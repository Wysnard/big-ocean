# Agent Team Pipeline — Worktree-Isolated Story Execution

Orchestration spec for a team lead (SM agent) to drive a story from creation through PR using Claude Code agent teams with git worktree isolation.

---

## Prerequisites

- Story file exists with `## Parallelism` metadata (produced by `create-story` workflow)
- Main branch is clean and up to date
- Claude Code agent teams available (`Task` tool with `team_name`)

---

## Pipeline Stages

### Stage 1: Create Story (SM agent, main branch)

**Agent:** SM / general-purpose
**Isolation:** none (runs on main)

1. Run `create-story` workflow to produce story file with parallelism metadata
2. Verify story has `Status: ready-for-dev` and `## Parallelism` section populated
3. Record `story_path` and `baseline_commit` (current HEAD) for downstream stages

**Output:** `story_path`, `baseline_commit`

---

### Stage 2: Adversarial Review (Review agent, worktree)

**Agent:** general-purpose (read-heavy, spawned via `Task`)
**Isolation:** `isolation: "worktree"` — read-only analysis in isolated copy

1. Read the story file at `story_path`
2. Execute adversarial review (use `bmad-review-adversarial-general` skill or equivalent)
3. Produce a numbered findings list with severity (critical / major / minor / nit)
4. Return findings list to team lead

**Gate:** If zero critical/major findings, skip Stage 3 and proceed to Stage 4.

**Output:** `findings_list` (text block with numbered findings and severities)

---

### Stage 3: Architect Filter (Architect agent, main branch)

**Agent:** general-purpose
**Isolation:** none (edits story file on main)

1. Receive `findings_list` from Stage 2
2. For each finding, decide: **KEEP** (critical, will cause implementation failure) or **DROP** (style, preference, low-risk)
3. Apply KEEP findings directly to the story file
4. Save updated story file

**Output:** updated `story_path` with filtered findings incorporated

---

### Stage 4: Dev (Dev agent, worktree)

**Agent:** general-purpose (full tool access)
**Isolation:** `isolation: "worktree"` — creates the dev worktree used through Stage 8

1. Read story file for full implementation context
2. Create feature branch: `feat/story-{epic}-{story}-{slug}`
3. Implement all tasks/subtasks from the story
4. **Mandatory gate:** Run `pnpm turbo typecheck` — must pass with zero errors
5. If typecheck fails, fix errors and re-run (max 3 attempts)
6. Commit implementation with conventional commit message

**Halt condition:** 3 consecutive typecheck failures → notify team lead, pause pipeline.

**Output:** `worktree_path`, `dev_branch`, implementation commit SHA

---

### Stage 5: Code Review (Review agent, same worktree)

**Agent:** feature-dev:code-reviewer
**Isolation:** same worktree as Stage 4 (read access to implementation)

1. Review all changes in `dev_branch` vs `baseline_commit`
2. Produce findings list with severity and confidence
3. **Mandatory gate:** Run `pnpm turbo typecheck` to verify reviewer's understanding
4. Return findings to team lead

**Output:** `review_findings` (numbered list with severity/confidence)

---

### Stage 6: Fix (Dev agent, same worktree)

**Agent:** general-purpose (same worktree as Stage 4)
**Isolation:** same worktree — continues on `dev_branch`

1. Receive `review_findings` from Stage 5
2. Address critical and high-confidence findings
3. Commit fixes
4. **Mandatory gate:** Run `pnpm turbo typecheck` — must pass

**Halt condition:** 3 consecutive failures → notify team lead.

**Output:** fix commit SHA

---

### Stage 7: E2E Validation (QA agent, same worktree)

**Agent:** general-purpose
**Isolation:** same worktree as Stage 4

1. Read story acceptance criteria
2. Write or extend Playwright E2E tests that validate the story's user-facing behavior
3. Tests MUST use actual UI interactions (clicks, forms, navigation) — NOT direct API calls
4. Tests MUST extend existing test files and user journeys before creating new ones
5. Run `pnpm test:e2e` (or relevant Playwright command)
6. If tests fail: fix test code or implementation, re-run (max 3 attempts)

**Halt condition:** 3 consecutive E2E failures → notify team lead.

**Output:** E2E tests passing, test commit SHA

---

### Stage 8: PR (Dev agent, same worktree)

**Agent:** general-purpose (same worktree)
**Isolation:** same worktree — pushes `dev_branch`

1. Ensure all commits are on `dev_branch`
2. Push branch to remote: `git push -u origin {dev_branch}`
3. Create PR via `gh pr create` with:
   - Title: story title
   - Body: summary of changes, link to story file, test plan
4. Return PR URL to team lead

**Output:** PR URL

---

## Parallel Execution

When multiple stories have `Mode: parallel` in their `## Parallelism` metadata:

1. Team lead reads all ready stories and groups by parallelism mode
2. For `parallel` stories with no shared files, spawn independent Stage 4-8 pipelines concurrently (each in its own worktree)
3. For `parallel` stories with overlapping shared files, run sequentially to avoid merge conflicts
4. For `sequential` stories, wait for `blocked-by` stories to merge before starting

The team lead uses `TaskCreate` / `TaskUpdate` to track each story's pipeline progress and `SendMessage` for coordination.

---

## Team Structure

```
Team Lead (SM agent)
├── Story Creator    — Stage 1 (may be team lead itself)
├── Reviewer         — Stages 2, 5
├── Architect        — Stage 3
├── Dev              — Stages 4, 6, 8
└── QA               — Stage 7
```

Agents are spawned via `Task` tool with `team_name` parameter. The team lead assigns tasks via `TaskUpdate` with `owner`.

---

## State Passing

All inter-stage state is passed via task descriptions in the shared task list:

| Variable | Set by | Used by |
|----------|--------|---------|
| `story_path` | Stage 1 | All stages |
| `baseline_commit` | Stage 1 | Stage 5 |
| `findings_list` | Stage 2 | Stage 3 |
| `worktree_path` | Stage 4 | Stages 5-8 |
| `dev_branch` | Stage 4 | Stages 5-8 |
| `review_findings` | Stage 5 | Stage 6 |
| PR URL | Stage 8 | Team lead |

---

## Halt Conditions

The pipeline halts and notifies the team lead when:

1. **3 consecutive failures** at any gated stage (typecheck, E2E)
2. **Blocking dependency** — a `blocked-by` story has not yet merged
3. **Ambiguity** — dev or review agent encounters requirements that cannot be resolved from the story file
4. **Merge conflict** — worktree branch conflicts with main (requires manual resolution or rebase)

On halt, the team lead decides: retry, reassign, escalate to human, or skip.
