---
name: 'step-02b-conflict-detection'
description: 'Detect file-level conflicts between parallel story branches before cleanup'

nextStepFile: './step-03-cleanup.md'
pipelineState: '{implementation_artifacts}/pipeline-state.yaml'
---

# Step 2b: Conflict Detection

## STEP GOAL:

To detect file-level conflicts between parallel story branches by comparing changed files across all completed branches, updating the pipeline state with conflict data, and reporting findings before cleanup.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER skip checking any completed branch
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step, ensure entire file is read
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are the Scrum Master (Bob) checking for merge safety
- ✅ Systematic, thorough, zero files missed
- ✅ Fully autonomous — no user interaction unless a HALT occurs

### Step-Specific Rules:

- 🎯 Focus ONLY on detecting conflicts — do not resolve them
- 🚫 FORBIDDEN to modify any branch or PR
- 🚫 FORBIDDEN to skip branches that returned "done"
- 💬 Report conflicts clearly with actionable guidance

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Update {pipelineState} with conflict data
- 📖 Compare ALL completed branches against baseline
- 🚫 HALT only if git commands fail repeatedly

## CONTEXT BOUNDARIES:

- Available: pipeline-state.yaml with completed story branches
- Focus: file-level overlap detection, not content-level merge analysis
- Limits: do not modify branches, PRs, or resolve conflicts
- Dependencies: step-02 must have completed with at least one "done" story

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Load Pipeline State

Read {pipelineState} completely.

Extract:
- `baseline_commit`
- All stories where `status` is "done" and `dev_branch` is not null

**IF fewer than 2 completed branches:** Skip conflict detection — no overlaps possible with a single branch. Set `conflicts: none` in pipeline state and auto-proceed to {nextStepFile}.

### 2. Collect Changed Files Per Branch

For EACH completed story branch, run:

```bash
git diff --name-only {baseline_commit}...origin/{dev_branch}
```

Store as a map: `branch → [list of changed files]`

**IF a branch no longer exists on remote** (subagent may not have pushed): Try local ref:
```bash
git diff --name-only {baseline_commit}...{dev_branch}
```

**IF both fail:** Log warning for that branch, skip it, continue with remaining branches.

### 3. Build Overlap Matrix

Compare file lists across ALL branch pairs:

```
For each file F across all branches:
  branches_touching_F = [branches that changed F]
  if len(branches_touching_F) > 1:
    mark F as CONFLICTING with branches_touching_F
```

Categorize overlaps:
- **High Risk:** Same source file (`.ts`, `.tsx`, `.go`, etc.) modified by 2+ branches
- **Medium Risk:** Same test file modified by 2+ branches
- **Low Risk:** Generated files, lock files, or config files modified by 2+ branches (e.g., `routeTree.gen.ts`, `pnpm-lock.yaml`)

### 4. Update Pipeline State

Add `conflicts` section to {pipelineState}:

```yaml
# Conflict Detection Results
conflicts:
  detected: true|false
  scanned_branches: [list of branches checked]
  skipped_branches: [list of branches that couldn't be checked]
  overlapping_files:
    - file: "path/to/file.ts"
      risk: high|medium|low
      branches: ["feat/story-A", "feat/story-B"]
    - file: "path/to/other.ts"
      risk: high
      branches: ["feat/story-A", "feat/story-C"]
```

Update `last_updated` timestamp.

### 5. Report Conflict Detection Results

**IF NO CONFLICTS detected:**

"**Conflict Detection: Clean**

All {count} completed branches were checked. No overlapping file modifications detected. PRs can be merged independently.

**Proceeding to cleanup...**"

**IF CONFLICTS detected:**

"**Conflict Detection: Overlaps Found**

**Branches Scanned:** {count}

| File | Risk | Branches |
|------|------|----------|
| {file} | {risk} | {branch1}, {branch2} |

**High Risk:** {count} files — likely merge conflicts
**Medium Risk:** {count} files — possible test conflicts
**Low Risk:** {count} files — usually auto-resolvable

**Recommended Actions:**
- **High risk files:** Merge PRs sequentially (first PR merges clean, subsequent PRs will need rebase)
- **Medium risk files:** Review test files for conflicting assertions after merge
- **Low risk files:** These typically auto-resolve — no action needed

**Note:** Conflicts are reported for awareness. PRs have been created and CI has passed individually. Merge order matters — merge the PR with fewer changes to the conflicting file first, then rebase the other.

**Proceeding to cleanup...**"

### 6. Auto-Proceed to Cleanup

Immediately load, read entire file, then execute {nextStepFile}.

#### Menu Handling Logic:

- After conflict results are reported, immediately load, read entire file, then execute {nextStepFile}

#### EXECUTION RULES:

- This is an auto-proceed step with no user choices
- Proceed directly to step-03 after reporting

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN all branches have been checked, pipeline state has been updated with conflict data, and results have been reported will you load and read fully {nextStepFile} to begin cleanup.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Pipeline state loaded and completed branches identified
- Changed files collected for ALL completed branches
- Overlap matrix built across all branch pairs
- Risk levels assigned to overlapping files
- Pipeline state updated with conflict data
- Results reported with actionable guidance
- Auto-proceeded to step-03

### ❌ SYSTEM FAILURE:

- Not checking all completed branches
- Missing file overlaps between branches
- Not categorizing risk levels
- Not updating pipeline state with conflict data
- Not reporting actionable merge guidance
- Skipping any step in the sequence

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
