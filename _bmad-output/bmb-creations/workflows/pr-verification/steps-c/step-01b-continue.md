---
name: 'step-01b-continue'
description: 'Handle workflow continuation from previous session'

stateFile: '{output_folder}/pr-verification-state.yaml'
nextStepOptions:
  checkout-rebase: './step-02-checkout-rebase.md'
  e2e-testing: './step-03-e2e-testing.md'
  manual-testing: './step-04-manual-testing.md'
  merge: './step-05-merge-loop.md'
---

# Step 1b: Continue PR Verification

## STEP GOAL:

To resume the PR verification workflow from where it was left off in a previous session, restoring state and routing to the correct step.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are a QA automation engineer resuming a verification session
- ✅ Report progress from previous session, confirm where to resume

### Step-Specific Rules:

- 🎯 Focus only on restoring state and routing to the correct step
- 🚫 FORBIDDEN to re-process already completed PRs
- 💬 Show clear progress summary before resuming

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Read state from {stateFile}
- 📖 Route to correct step based on currentStage

## CONTEXT BOUNDARIES:

- Available: state file from previous session
- Focus: restore and resume
- Limits: do not re-process completed PRs
- Dependencies: state file must exist

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly.

### 1. Welcome Back

"**Welcome back!** Let me check where we left off..."

### 2. Read State

Load {stateFile} and extract:
- `prsProcessed` — PRs already verified and merged
- `currentPr` — PR that was in progress
- `currentStage` — stage within that PR (checkout-rebase, e2e-testing, manual-testing, merge)
- `prQueue` — remaining PRs to process
- `staleTestsRemoved` — tests removed so far
- `prResults` — results from completed PRs

### 3. Display Progress Summary

"**Previous session progress:**

**Completed PRs:** [count]
[List each with result: merged/flagged/skipped]

**Current PR:** PR #[number] (Story [key])
**Stage:** [currentStage]

**Remaining:** [count] PRs in queue"

### 4. Confirm Resume

"Ready to resume from PR #[number], stage: [currentStage]. Continue?"

### 5. Route to Correct Step

Based on `currentStage`, load the appropriate step:

- `checkout-rebase` → load {nextStepOptions.checkout-rebase}
- `e2e-testing` → load {nextStepOptions.e2e-testing}
- `manual-testing` → load {nextStepOptions.manual-testing}
- `merge` → load {nextStepOptions.merge}

If `currentPr` is null (between PRs), set `currentPr` to next in queue and load {nextStepOptions.checkout-rebase}.

### 6. Present MENU OPTIONS

Display: "**Proceeding to resume...**"

#### Menu Handling Logic:

- After user confirms resume, load the appropriate step file based on currentStage

#### EXECUTION RULES:

- This is an auto-proceed step after user confirmation
- Route to the correct step based on state

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- State file loaded successfully
- Progress summary displayed clearly
- User confirms resume point
- Routed to correct step based on currentStage
- No re-processing of completed PRs

### ❌ SYSTEM FAILURE:

- Re-processing already completed PRs
- Routing to wrong step
- Not displaying progress summary
- Proceeding without user confirmation

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
