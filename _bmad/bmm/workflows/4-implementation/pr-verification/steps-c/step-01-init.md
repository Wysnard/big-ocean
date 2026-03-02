---
name: 'step-01-init'
description: 'Initialize PR verification — discover sprint plan, build PR queue, detect continuation'

nextStepFile: './step-02-checkout-rebase.md'
continueFile: './step-01b-continue.md'
stateFile: '{output_folder}/pr-verification-state.yaml'
sprintPlanFolder: '{output_folder}'
sprintPlanPattern: 'sprint-*.yaml'
---

# Step 1: Initialize PR Verification

## STEP GOAL:

To discover the sprint plan, identify developed stories, read story file dependencies, reconcile against actual open PRs, build an ordered processing queue, and save initial state.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are a QA automation engineer — methodical, precise, terse
- ✅ Report what you're doing, what you found, what comes next
- ✅ Only engage conversationally when escalating to user

### Step-Specific Rules:

- 🎯 Focus only on discovering inputs and building the PR queue
- 🚫 FORBIDDEN to checkout branches or run tests — that comes in later steps
- 💬 Approach: systematic discovery, report findings, confirm with user

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Create state file with PR queue and processing order
- 📖 Check for existing state file for continuation detection
- 🚫 Do not proceed until PR queue is confirmed by user

## CONTEXT BOUNDARIES:

- Available: sprint plan files, story files, git repository
- Focus: input discovery and queue building
- Limits: do not modify any code or branches
- Dependencies: none — this is the first step

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Check for Existing State (Continuation Detection)

Look for {stateFile}.

- **If exists** and has `prsProcessed` data → load {continueFile}
- **If not found** → continue to step 2 (new workflow run)

### 2. Discover Sprint Plan

Search {sprintPlanFolder} for files matching {sprintPlanPattern}.

"**Found sprint plan files:**
[List files with dates]

Which sprint plan should I use?"

If no sprint plan found: "No sprint plan found in {sprintPlanFolder}. Please provide the path to your sprint plan."

### 3. Identify Developed Stories

From the selected sprint plan, extract all stories with status indicating they have been developed (i.e., stories at the top of the plan that have been through the orchestration pipeline).

"**Developed stories found:**
[List story keys and titles]"

### 4. Read Story File Dependencies

For each developed story, read the story file and extract:
- Story key and title
- Dependency metadata (what other stories it depends on)
- Relevant test suites (if specified)

Build a dependency graph from this metadata.

### 5. Reconcile Against Open PRs

For each developed story, check for a corresponding open PR:
- Use `gh pr list` to find open PRs
- Match PRs to stories by branch name or PR title

**Report findings:**

"**PR Reconciliation:**
- Story X-Y: PR #123 ✓
- Story X-Z: PR #456 ✓
- Story A-B: ⚠️ No PR found — flagging mismatch"

If mismatches found, ask user: "Some stories have no matching PR. Continue with available PRs?"

### 6. Build Ordered Processing Queue

Sort PRs by dependency order:
- PRs with no dependencies go first
- PRs that depend on other PRs go after their dependencies
- If circular dependency detected → flag to user

"**Processing order:**
1. PR #123 (Story X-Y) — no dependencies
2. PR #456 (Story X-Z) — depends on X-Y
3. ..."

Confirm with user: "Does this processing order look correct?"

### 7. Save Initial State

Create {stateFile} with:

```yaml
prsProcessed: []
currentPr: null
currentStage: null
prQueue:
  - prNumber: 123
    storyKey: 'X-Y'
    branch: 'feat/story-x-y-slug'
    dependencies: []
    testSuites: []
  - prNumber: 456
    storyKey: 'X-Z'
    branch: 'feat/story-x-z-slug'
    dependencies: ['X-Y']
    testSuites: []
staleTestsRemoved: []
prResults: []
startedAt: '{date}'
```

### 8. Present MENU OPTIONS

Display: "**Proceeding to checkout first PR...**"

#### Menu Handling Logic:

- After state file is created and user confirms queue, immediately load, read entire file, then execute {nextStepFile}

#### EXECUTION RULES:

- This is an auto-proceed init step with no A/P options
- Proceed directly to next step after setup is confirmed

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Sprint plan discovered and loaded
- Developed stories identified
- Story dependencies read and dependency graph built
- PRs reconciled against stories, mismatches flagged
- Ordered processing queue built and confirmed by user
- State file created with full queue

### ❌ SYSTEM FAILURE:

- Checking out branches or running tests in this step
- Proceeding without user confirmation of queue
- Not flagging missing PRs for developed stories
- Hardcoded paths instead of variables
- Not checking for existing state file (continuation detection)

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
