---
conversionFrom: '_bmad/bmm/workflows/4-implementation/agent-team-pipeline'
originalFormat: 'Legacy YAML + XML (workflow.yaml + instructions.xml)'
stepsCompleted: ['step-00-conversion', 'step-02-classification', 'step-03-requirements', 'step-04-tools', 'step-05-plan-review', 'step-06-design', 'step-07-foundation', 'step-08-build-step-01', 'step-09-build-step-02', 'step-09-build-step-03']
lastStep: 'step-09-build-step-03'
created: 2026-03-01
status: APPROVED_FOR_DESIGN
approvedDate: 2026-03-01
---

# Workflow Creation Plan

## Conversion Source

**Original Path:** _bmad/bmm/workflows/4-implementation/agent-team-pipeline
**Original Format:** Legacy YAML + XML instructions with markdown reference doc
**Detected Structure:** 10-stage sequential pipeline using Claude Code agent teams with worktree isolation

---

## Original Workflow Analysis

### Goal (from source)

Orchestrate a full story pipeline from story finding through PR creation using Claude Code agent teams with git worktree isolation.

### Original Steps (Complete List)

**Step 1:** Find/Load Story - Locate next `ready-for-dev` story from sprint-status or user-provided path. HALTs if none found.
**Step 2:** Create Team + Tasks - TeamCreate with 7 tasks in dependency chain
**Step 3:** Adversarial Review - Worktree-isolated story review for gaps/risks (severity: critical/major/minor/nit)
**Step 4:** Architect Filter - Filter findings KEEP/DROP, apply KEEP to story file only
**Step 5:** Dev Implementation - Worktree-isolated coding with typecheck gate (3 retries), conventional commits
**Step 6:** Code Review - feature-dev:code-reviewer reviews diff vs baseline
**Step 7:** Fix Review Findings - Dev fixes critical/high-confidence findings
**Step 8:** E2E Validation - QA writes/runs Playwright E2E tests (3 retries)
**Step 9:** Push + Create PR - Push branch, gh pr create with title/body/base
**Step 10:** Cleanup - Shutdown team, update sprint-status to "review", report PR URL

### Output / Deliverable

PR URL, updated sprint-status, story status set to "review"

### Input Requirements

- Sprint-status file (sprint-status.yaml)
- Story file (or auto-discovered from sprint-status)
- Clean main branch
- CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 enabled

### Key Instructions to LLM

- Sequential stage execution with dependency gates
- Worktree isolation for read-heavy and dev stages
- Typecheck gates with retry limits (max 3)
- Agent team coordination via TaskCreate/TaskUpdate/SendMessage
- Halt conditions on repeated failures, blocking deps, ambiguity, merge conflicts

---

## Conversion Notes

**What works well in original (preserve):**
- Agent spawning and team coordination works correctly
- CI passes for PRs created by the pipeline
- Worktree isolation pattern is sound
- Dependency chain via task list is effective
- Halt conditions and retry limits are practical

**What needs improvement (user requested changes):**

1. **Stage 1 — Auto-create stories from parallelism plan:** Currently halts if no `ready-for-dev` story exists. Should read `sprint-parallelism-plan.md` (at `{implementation_artifacts}/sprint-parallelism-plan.md`), find the first incomplete step (e.g., Step 1), and create ALL stories in that step using the `create-story` workflow before running dev pipelines. Stories within a step marked `parallel` can be run concurrently; `sequential` stories respect their `after:` dependency.

2. **Stage 4 — Architect applies fixes to code:** Currently architect only edits the story file with KEEP findings. Should also apply architectural fixes to actual code when the adversarial review identifies implementation concerns.

3. **Stage 8 — Replace E2E with unit tests:** Remove Playwright E2E validation stage. Replace with unit test run (`pnpm test:run` or similar).

4. **New Stage — CI check after PR:** After PR creation, monitor CI pipeline. Wait for CI to pass/fail. If CI fails, fix and re-push.

5. **New Stage — Manual testing from PR:** After CI passes, the agent should perform the manual testing steps recommended in the PR description, fix any bugs found, and push fixes.

**Compliance gaps identified:**
- Uses legacy XML instructions format (instructions.xml) — needs conversion to step-file architecture (steps-c/, workflow.md)
- No micro-file step design — entire pipeline is one monolithic XML file
- No tri-modal structure (Create/Validate/Edit)
- No state tracking via stepsCompleted in frontmatter
- No JIT loading of step files
- workflow.yaml used as config instead of workflow.md as entry point

---

## Classification Decisions

**Workflow Name:** agent-team-pipeline
**Target Path:** _bmad/bmm/workflows/4-implementation/agent-team-pipeline/

**4 Key Decisions:**
1. **Document Output:** false (performs actions — PRs, sprint updates — not document creation)
2. **Module Affiliation:** BMM (4-implementation phase)
3. **Session Type:** continuable (multi-story pipeline can span sessions, massive token usage)
4. **Lifecycle Support:** create-only (steps-c/ only)

**Structure Implications:**
- Needs `steps-c/` folder with step files
- Needs `step-01-init.md` with continuation detection and `step-01b-continue.md` for resuming
- Needs `stepsCompleted` tracking for resume capability
- No template needed (non-document)
- No steps-e/ or steps-v/ folders needed

---

## Architecture Decision Records

### ADR-1: Story Creation Strategy
**Decision:** Batch-create all stories first, then run dev pipelines.
**Rationale:** Story creation is fast (minutes), dev is slow (heavy). Negligible delay for a clean checkpoint before expensive work begins. All stories get adversarial review + architect notes before any dev starts.

### ADR-2: Architect Fix Scope
**Decision:** Architect adds `## Architect Notes` section to story file with specific file paths, patterns, and code-level guidance. No direct code edits.
**Rationale:** Avoids merge conflicts (architect edits markdown on main, dev works in worktree). Dev reads architect notes as authoritative instructions. Contained scope, no architect creep.

### ADR-3: CI Check Strategy
**Decision:** Use `gh pr checks --watch` to block until CI resolves, then act on result.
**Rationale:** Purpose-built command, single blocking call, minimal tokens. Agent can immediately fix + re-push on failure.

### ADR-4: Manual Testing Execution
**Decision:** Cross-reference PR test plan AND story acceptance criteria for comprehensive coverage.
**Rationale:** Acceptance criteria define *what* should work (PM intent); PR test plan defines *how* to verify the specific implementation. Together they cover both.

### ADR-5: Parallel Story Pipelines
**Decision:** All stories within a parallelism plan step run concurrently as **subagents** (Agent tool with `isolation: "worktree"`), NOT agent teams.
**Rationale:** Story pipelines are fully independent — no inter-agent communication needed. The sprint parallelism plan guarantees stories within a step have no blocking dependencies and touch separate subsystems. Subagents are the correct pattern per Claude Code docs: "focused tasks where only the result matters." Lower token cost, no TeamCreate/TaskCreate/SendMessage overhead. Team lead spawns all story agents in parallel via multiple Agent tool calls in one message, collects results when each returns.

### ADR-6: Subagents over Agent Teams
**Decision:** Use subagents (Agent tool) instead of agent teams (TeamCreate + TaskCreate + SendMessage).
**Rationale:** Per Claude Code documentation, agent teams are for "complex work requiring discussion and collaboration" where teammates need to "share findings, challenge each other, and coordinate." Our story pipelines are independent — each story agent does its own work and reports back a result (PR URL, status). This is textbook subagent territory. Agent teams would add unnecessary coordination overhead and higher token costs with no benefit.

---

## Requirements

**Flow Structure:**
- Pattern: Fan-out / fan-in with parallel linear pipelines
- Phases:
  1. **Init:** Read parallelism plan → identify first incomplete step → list all stories
  2. **Fan-out:** For each story, spawn independent pipeline: create story → adversarial review → architect notes → dev → code review → fix → unit tests → PR → CI check → manual test
  3. **Fan-in:** Wait for all story pipelines to complete → update sprint status → report
- Estimated steps: 5-6 step files (init/continue, story pipeline, CI check, manual test, cleanup/report)

**User Interaction:**
- Style: Mostly autonomous
- Decision points: None — no approval gates
- Checkpoint frequency: HALT only on repeated failures (3 consecutive at any gated stage)
- HALTs on: 3x typecheck failures, 3x unit test failures, 3x CI failures, ambiguity, merge conflicts

**Inputs Required:**
- Required:
  - `sprint-parallelism-plan.md` at `{implementation_artifacts}/sprint-parallelism-plan.md`
  - `sprint-status.yaml` at `{implementation_artifacts}/sprint-status.yaml`
  - `epics.md` at `{planning_artifacts}/epics.md`
  - Clean main branch
- Optional:
  - Specific step number (otherwise auto-detects first incomplete step)
  - Specific story key (to run a single story instead of full step)
  - `architecture.md` — architectural constraints and patterns
  - `ux-design.md` — UX requirements
  - `innovation-strategy.md` — innovation/business context
  - `project-context.md` — general project conventions
- Prerequisites: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 enabled

**Output Specifications:**
- Type: Actions (not a document)
- Outputs:
  - PRs — one per story, CI passing, manual testing done
  - Updated `sprint-status.yaml` — stories marked "review"
  - Updated story files — status changed, architect notes added
  - Sprint parallelism plan — current step marked complete when all stories pass gate

**Success Criteria:**
- All stories in the step have PRs created
- All PRs pass CI
- All PRs pass manual testing (no unfixed bugs)
- Sprint status updated for every story
- No unresolved HALTs
- Step gate satisfied — ready to proceed to next step

**Instruction Style:**
- Overall: Prescriptive
- Notes: Each stage has exact instructions — what to spawn, what prompt to give, what gates to check. Mechanical, repeatable execution.

---

## Party Mode Insights

### Pipeline Stages (Revised — 10 stages per story)
1. **Create Story** — from sprint parallelism plan + epics
2. **Adversarial Review** — worktree-isolated story review
3. **Architect Notes** — KEEP/DROP findings, append `## Architect Notes` to story
4. **Dev (TDD)** — implementation with tests built-in (red-green-refactor), typecheck gate (3x retry)
5. **Code Review** — code-reviewer agent reviews diff
6. **Fix Review Findings** — dev fixes critical/high findings
7. **PR Creation** — push branch, `gh pr create`
8. **CI Check** — `gh pr checks --watch`, on failure: `gh run view <run-id> --log-failed` → fix → re-push (3x retry)
9. **Manual Testing** — Chrome DevTools MCP: start dev server in worktree, follow PR test plan steps, take screenshots as evidence, fix bugs found, screenshot fixes, optionally append screenshots to PR
10. **Cleanup** — shutdown agents, update sprint-status, update parallelism plan

### Key Design Decisions from Discussion
- **No separate unit test gate** — TDD is baked into dev stage, tests already written and passing
- **CI failure handling** — parse `gh pr checks --watch --json` for `conclusion`, on failure run `gh run view <run-id> --log-failed` to get error logs, feed into fix prompt
- **Manual testing = real browser testing** — agent uses Chrome DevTools MCP to navigate app, click, fill forms, verify visually
- **Dev server per worktree** — each story pipeline starts its own dev server (different port), self-contained
- **Screenshots as evidence** — agent takes screenshots at each test plan step, captures before/after for bug fixes
- **Step gate tracking** — sprint-parallelism-plan.md updated as stories complete, enables resume awareness

---

## Tools Configuration

**Core BMAD Tools:**
- **Party Mode:** excluded — fully autonomous pipeline, no user interaction
- **Advanced Elicitation:** excluded — no human in the loop
- **Brainstorming:** excluded — no creative ideation needed

**LLM Features:**
- **Web-Browsing:** excluded — all context from local files
- **File I/O:** included — agents read/write story files, sprint status, parallelism plan, code
- **Sub-Agents:** included — one Agent tool call per story with `isolation: "worktree"`, spawned in parallel
- **Sub-Processes:** excluded — subagents replace the need for sub-processes

**Memory:**
- Type: continuable
- Tracking:
  - `stepsCompleted` — which pipeline stages completed per story
  - `storiesCompleted` — which stories in the step are done
  - `currentStep` — which parallelism plan step we're on
  - Resume via `step-01b-continue.md` that reads this state

**External Integrations:**
- **Chrome DevTools MCP** — Stage I manual testing (already installed)
- **GitHub CLI (`gh`)** — PR creation + CI checking (standard CLI)
- **Context7 MCP** — optional library docs during dev stage (already installed)

**Installation Requirements:**
- None — all tools already available in environment

---

## Workflow Structure Design

### File Structure
```
agent-team-pipeline/
├── workflow.md              # Entry point + config
├── data/
│   └── agent-prompts.md     # Prompt templates for per-story agent pipeline
├── steps-c/
│   ├── step-01-init.md           # Init with continuation detection
│   ├── step-01b-continue.md      # Resume from last completed state
│   ├── step-02-execute.md        # Fan-out: one agent per story runs full pipeline
│   └── step-03-cleanup.md        # Fan-in: collect PR URLs, update sprint, report
└── checklist.md              # Validation checklist
```

### Step Sequence

| Step | Type | Goal | Menu |
|------|------|------|------|
| 01-init | Init (Continuable) | Load parallelism plan, identify current step, list stories, record baseline. Route to 01b if resuming | Auto-proceed |
| 01b-continue | Continuation | Read state, find last completed stage per story, resume failed/incomplete stories | Auto-proceed |
| 02-execute | Middle (Simple) | Fan-out: spawn one subagent per story (Agent tool, isolation: "worktree"), all in parallel. Each runs full 8-stage pipeline. Collect results when all return. | Auto-proceed |
| 03-cleanup | Final | Fan-in: collect PR URLs from subagent results, update sprint-status to "pr-ready", report results | None (final) |

### Per-Story Agent Pipeline (8 internal stages)
Each story gets one agent in its own worktree running these stages sequentially:
1. **Create Story** — from epics via create-story workflow
2. **Adversarial Review** — review story for gaps/risks
3. **Architect Notes** — filter findings KEEP/DROP, append `## Architect Notes` to story
4. **Dev (TDD)** — implement with tests, typecheck gate (3x retry)
5. **Code Review** — review diff vs baseline
6. **Fix Findings** — fix critical/high findings
7. **PR Creation** — push branch, `gh pr create`
8. **CI Check** — `gh pr checks --watch`, fix failures (3x retry)

### Separate PR Validation Workflow (future)
Manual testing, merge orchestration, and final verification are handled by a **separate PR validation workflow** (to be created):
1. Collect all PRs from completed orchestration
2. Per PR: Chrome DevTools MCP manual testing against test plan + acceptance criteria, screenshots as evidence
3. Merge order resolution from parallelism plan dependency notes
4. Sequential merge + verify — merge PR, run CI on main, verify no regressions, repeat
5. Final integration report — all PRs merged, tests passing, step gate satisfied

### Data Flow
```
sprint-parallelism-plan.md
        ↓
  [step-01: init]
        ↓ stories[], currentStep, baseline_commit
  [step-02: execute] → one subagent per story (parallel Agent tool calls)
        ↓ Each subagent (isolation: "worktree"): create → review →
        ↓ architect notes → dev TDD → code review → fix → PR → CI check
        ↓ Returns: {story_key, status, pr_url, dev_branch}
  [step-03: cleanup]
        ↓ updated sprint-status.yaml ("pr-ready"), PR URLs report
```

### State Tracking (Continuable)
```yaml
currentStep: 1  # parallelism plan step number
stories:
  17-3-domain-streak:
    status: "dev"  # created | reviewed | dev | pr | ci | testing | done
    worktree_path: "..."
    dev_branch: "..."
    pr_url: "..."
  18-1-evidence-v2:
    status: "reviewed"
stepsCompleted: ['step-01-init', 'step-02-create-stories']
```

### Role/Persona
SM agent (Bob) as team lead — crisp, checklist-driven, zero ambiguity. Spawns specialized agents per stage.

### Error Handling
- 3x retry at each gated stage (typecheck, CI, manual test fixes)
- HALT on 3 consecutive failures — report which story, which stage, error details
- On resume (01b), skip completed stories, restart failed story at its last stage

### Subprocess Optimization
- Pattern 4 (Parallel) — all stories launch as parallel subagents via multiple Agent tool calls in one message
- Each subagent returns structured results (story_key, status, pr_url, dev_branch)
- Fallback: process stories sequentially if parallel not available
- No TeamCreate/TaskCreate/SendMessage — pure Agent tool with isolation: "worktree"

### Special Features
- Input discovery: reads sprint-parallelism-plan.md + sprint-status.yaml to auto-detect current step
- Workflow chaining: follows create-story workflow for story creation, integrates with sprint-status tracking. Hands off to PR validation workflow after completion.
- Conditional logic: skips architect notes stage if adversarial review finds no critical/major findings
- Branch points: none (fully autonomous linear pipeline per story)
- One agent per story runs the full 8-stage pipeline — minimal orchestration overhead
- Sprint-status set to "pr-ready" (not "done") — PR validation workflow moves to "done" after merge

### Party Mode Design Review Findings

**1. HALT Return Format:**
Subagent must return structured failure info on HALT:
```
{story_key, status: "halted", halted_at: "ci"|"typecheck"|"code_review", error: "...", worktree_path: "..."}
```
Team lead uses this to report which stories failed and where.

**2. Pipeline State File (`pipeline-state.yaml`):**
Team lead persists state to `{implementation_artifacts}/pipeline-state.yaml` for resume:
```yaml
parallelism_step: 1
baseline_commit: abc123
stories:
  17-3-domain-streak: {status: done, pr_url: "..."}
  18-1-evidence-v2: {status: halted, halted_at: ci, error: "..."}
```
On resume (step-01b), team lead reads this file and only spawns subagents for non-done stories.

**3. Story File in Commit:**
Subagent commits the story file to its feature branch. After PR merge, story file lands on main. No separate copy needed.

**4. Subagent Prompt Must Be Self-Contained:**
Subagent does NOT inherit team lead conversation history. Prompt must include:
- Story key and which story to create
- All file paths (epics, architecture, ux, sprint-status, project-context)
- Full 8-stage sequential instructions
- Retry limits and HALT conditions
- Return format for success AND failure
- Split into clear sections with headers for sequential following
