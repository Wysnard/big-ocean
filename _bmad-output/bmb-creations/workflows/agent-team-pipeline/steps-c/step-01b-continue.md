---
name: 'step-01b-continue'
description: 'Resume pipeline from previous session — skip completed stories, re-run halted/incomplete ones'

nextStepFile: './step-02-execute.md'
pipelineState: '{implementation_artifacts}/pipeline-state.yaml'
parallelismPlan: '{implementation_artifacts}/sprint-parallelism-plan.md'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'
---

# Step 1b: Continue Pipeline

## STEP GOAL:

To resume the pipeline from a previous session by reading the pipeline state file, identifying which stories are complete vs halted/incomplete, and routing to the execute step with only the remaining stories.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER skip reading the pipeline state file
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step, ensure entire file is read
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are the Scrum Master (Bob) resuming pipeline orchestration
- ✅ Crisp, checklist-driven, zero ambiguity
- ✅ Fully autonomous — no user interaction unless a HALT occurs

### Step-Specific Rules:

- 🎯 Focus ONLY on reading state and determining what to re-run
- 🚫 FORBIDDEN to re-run stories that are already "done"
- 🚫 FORBIDDEN to modify the pipeline state in this step
- 💬 Report resume status clearly before proceeding

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Do not modify {pipelineState} — step-02 will update it
- 📖 Validate state file integrity before proceeding

## CONTEXT BOUNDARIES:

- Available: pipeline-state.yaml from previous session
- Focus: determining what needs to be re-run
- Limits: do not spawn agents or modify state
- Dependencies: pipeline-state.yaml must exist and be valid

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Load Pipeline State

Read {pipelineState} completely.

**Validate structure:**
- Has `parallelism_step` field
- Has `baseline_commit` field
- Has `stories` map with at least one entry
- Each story has `status`, `mode`, `pr_url`, `dev_branch`, `error` fields

**IF invalid:** HALT — "Pipeline state file is malformed. Delete it and re-run the pipeline from scratch."

### 2. Categorize Stories

Group stories by status:

**Completed (skip these):**
- status: "done"

**Halted (re-run from their halted stage):**
- status: "halted"
- Note: the `error` field contains failure details

**In Progress (re-run from beginning):**
- status: "pending", "created", "reviewed", "dev", "pr", "ci"
- Note: these were interrupted mid-pipeline, safest to re-run from start

### 3. Check If Anything Needs Re-Running

**IF all stories are "done":**
- HALT — "All stories in this step are already complete. Nothing to resume. Run step-01-init to start the next parallelism plan step."

**IF no stories need re-running after filtering:**
- HALT — same message

### 4. Validate Current State

**Check main branch:**
```
git status --porcelain
```
- If dirty: HALT — "Main branch has uncommitted changes."

**Check baseline still valid:**
```
git rev-parse HEAD
```
- Compare with `baseline_commit` from state file
- If different: Warn but proceed — "Baseline has advanced from [old] to [new]. Subagents will use current HEAD as baseline."
- Update baseline_commit in memory (step-02 will persist it)

### 5. Report Resume Status

Output summary:

"**Pipeline Resuming**

**Parallelism Plan Step:** [N] — [name]
**Original Baseline:** [SHA]
**Current HEAD:** [SHA]

**Story Status:**

| Story | Previous Status | Action |
|-------|----------------|--------|
| [key] | done | skip |
| [key] | halted (at ci) | re-run |
| [key] | dev | re-run |

**Stories to re-run:** [count]
**Stories already done:** [count]

**Proceeding to execute...**"

### 6. Auto-Proceed to Execute

Immediately load, read entire file, then execute {nextStepFile}.

The execute step will read {pipelineState} and only spawn subagents for stories that are NOT "done".

#### Menu Handling Logic:

- After resume status is reported, immediately load, read entire file, then execute {nextStepFile}

#### EXECUTION RULES:

- This is an auto-proceed step with no user choices
- Proceed directly to step-02 after reporting

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN the pipeline state has been read, stories categorized, and resume status reported will you load and read fully {nextStepFile} to begin re-executing incomplete stories.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Pipeline state loaded and validated
- Stories correctly categorized (done vs re-run)
- Main branch checked for cleanliness
- Baseline validity checked
- Resume status clearly reported
- Auto-proceeded to step-02

### ❌ SYSTEM FAILURE:

- Not validating pipeline state structure
- Re-running stories that are already "done"
- Not checking main branch cleanliness
- Proceeding without reporting what will be re-run
- Modifying pipeline state in this step

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
