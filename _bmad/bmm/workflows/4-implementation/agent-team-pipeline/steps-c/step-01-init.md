---
name: 'step-01-init'
description: 'Initialize pipeline: load parallelism plan, identify current step, list stories, create pipeline state'

nextStepFile: './step-02-execute.md'
continueFile: './step-01b-continue.md'
parallelismPlan: '{implementation_artifacts}/sprint-parallelism-plan.md'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'
pipelineState: '{implementation_artifacts}/pipeline-state.yaml'
epicsFile: '{planning_artifacts}/epics.md'
---

# Step 1: Pipeline Initialization

## STEP GOAL:

To load the sprint parallelism plan, identify the first incomplete step, list all stories in that step, record the baseline commit, and create the initial pipeline state file for tracking progress.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER skip reading the parallelism plan or sprint status
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step, ensure entire file is read
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are the Scrum Master (Bob) orchestrating the story pipeline
- ✅ Crisp, checklist-driven, zero ambiguity
- ✅ This is fully autonomous — no user interaction unless a HALT occurs

### Step-Specific Rules:

- 🎯 Focus ONLY on initialization — do not create stories or spawn agents yet
- 🚫 FORBIDDEN to proceed if main branch is not clean
- 🚫 FORBIDDEN to proceed if no incomplete step exists in the parallelism plan
- 💬 Report what was found clearly before proceeding

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Create {pipelineState} with initial state
- 📖 Validate all required inputs exist before proceeding
- 🚫 HALT if any required input is missing

## CONTEXT BOUNDARIES:

- Available: parallelism plan, sprint status, epics file
- Focus: identifying what to work on, not doing the work
- Limits: do not create stories or spawn agents
- Dependencies: clean main branch, required files exist

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Check for Existing Pipeline State (Continuation Detection)

Check if {pipelineState} already exists.

**IF {pipelineState} exists AND has incomplete stories:**
- Load, read entirely, then execute {continueFile}
- STOP — do not continue this step

**IF {pipelineState} does not exist OR all stories are "done":**
- Continue to section 2

### 2. Validate Prerequisites

**Check main branch is clean:**
```
git status --porcelain
```
- If output is non-empty: HALT — "Main branch has uncommitted changes. Please commit or stash before running the pipeline."

**Check required files exist:**
- {parallelismPlan} — HALT if missing: "sprint-parallelism-plan.md not found."
- {sprintStatus} — HALT if missing: "sprint-status.yaml not found."
- {epicsFile} — HALT if missing: "epics.md not found."

### 3. Load and Parse Parallelism Plan

Read {parallelismPlan} completely.

**Parse the step structure:**
- Each step has a header: `## Step N: [Name]`
- Each step has a table of stories with columns: Story, Mode, Notes
- Each step ends with a `**Gate:**` line

**Identify the first incomplete step:**
- Read {sprintStatus} to check each story's status
- A step is "complete" when ALL its stories have status "done" or "pr-ready" in sprint-status
- The first step with ANY story NOT "done"/"pr-ready" is the current step
- If ALL steps are complete: HALT — "All parallelism plan steps are complete. Nothing to do."

**Extract all stories from the current step:**
- Story key (e.g., "17-3-domain-streak-computation-and-conversanalyzer-retry-bump")
- Mode (parallel/sequential)
- Notes (dependencies, blockers)
- Filter OUT stories already marked "done" or "pr-ready" in sprint-status

### 4. Record Baseline Commit

```
git rev-parse HEAD
```

Store as `baseline_commit`.

### 5. Discover Optional Context Documents

Search for optional context documents that will be passed to subagents:
- Architecture: `{planning_artifacts}/architecture.md` or `{planning_artifacts}/*architecture*.md`
- UX: `{planning_artifacts}/*ux*.md`
- Innovation: `{planning_artifacts}/*innovation*.md`
- Project context: `**/project-context.md`

Record paths of documents that exist. Do not HALT if any are missing — they are optional.

### 6. Create Pipeline State File

Write {pipelineState}:

```yaml
# Pipeline State — auto-generated, do not edit manually
parallelism_step: [step number]
parallelism_step_name: "[step name]"
baseline_commit: "[SHA]"
created: "[current date]"
last_updated: "[current date]"

# Optional context documents discovered
context_docs:
  architecture: "[path or null]"
  ux: "[path or null]"
  innovation: "[path or null]"
  project_context: "[path or null]"

# Stories in this step
stories:
  [story-key-1]:
    status: pending  # pending | created | reviewed | dev | pr | ci | done | halted
    mode: "[parallel|sequential]"
    notes: "[from parallelism plan]"
    pr_url: null
    dev_branch: null
    error: null
  [story-key-2]:
    status: pending
    mode: "[parallel|sequential]"
    notes: "[from parallelism plan]"
    pr_url: null
    dev_branch: null
    error: null

# Conflict detection (populated by step-02b)
conflicts:
  detected: false
  scanned_branches: []
  skipped_branches: []
  overlapping_files: []
```

### 7. Report and Proceed

Output summary:

"**Pipeline Initialized**

**Parallelism Plan Step:** [N] — [name]
**Baseline Commit:** [SHA]
**Stories to Process:** [count]

| Story | Mode | Status |
|-------|------|--------|
| [key] | [mode] | pending |
| ... | ... | ... |

**Context Docs:** [list found docs or 'none']

**Proceeding to execute...**"

### 8. Auto-Proceed

After initialization is complete and {pipelineState} is written, immediately load, read entire file, then execute {nextStepFile}.

#### Menu Handling Logic:

- After pipeline state is created, immediately load, read entire file, then execute {nextStepFile}

#### EXECUTION RULES:

- This is an auto-proceed init step with no user choices
- Proceed directly to next step after setup

## CRITICAL STEP COMPLETION NOTE

ONLY WHEN {pipelineState} has been successfully written with all story entries will you load and read fully {nextStepFile} to begin executing story pipelines.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Parallelism plan loaded and parsed correctly
- Current incomplete step identified
- All stories in step extracted with modes and notes
- Baseline commit recorded
- Optional context documents discovered
- {pipelineState} created with correct structure
- Summary output presented
- Auto-proceeded to step-02

### ❌ SYSTEM FAILURE:

- Not checking for existing pipeline state (continuation detection)
- Proceeding with dirty main branch
- Missing required files without HALTing
- Not filtering out already-done stories
- Not recording baseline commit
- Creating malformed pipeline state file
- Skipping any prerequisite check

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
