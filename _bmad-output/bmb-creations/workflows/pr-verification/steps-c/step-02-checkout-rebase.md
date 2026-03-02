---
name: 'step-02-checkout-rebase'
description: 'Checkout PR branch and rebase onto latest base with cascade-aware conflict resolution'

nextStepFile: './step-03-e2e-testing.md'
finalStepFile: './step-06-summary.md'
stateFile: '{output_folder}/pr-verification-state.yaml'
---

# Step 2: Checkout & Rebase

## STEP GOAL:

To checkout the current PR's branch, rebase it onto the latest base branch (which may have changed from previously merged PRs), and resolve any merge conflicts.

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
- ✅ Report branch operations and conflict status
- ✅ Only engage conversationally when conflicts are ambiguous

### Step-Specific Rules:

- 🎯 Focus only on branch checkout and rebase operations
- 🚫 FORBIDDEN to run tests or modify application code — that comes in later steps
- 🚫 FORBIDDEN to merge — that comes in step 05
- 💬 Approach: execute git operations, report results, escalate ambiguous conflicts

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Update state file with currentPr and currentStage
- 📖 Report all git operations and their results
- 🚫 Do not proceed if rebase fails and conflicts cannot be resolved

## CONTEXT BOUNDARIES:

- Available: state file with PR queue and current PR info
- Focus: git checkout and rebase operations only
- Limits: do not modify application code except for conflict resolution
- Dependencies: step-01 must have created state file with PR queue

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Load Current PR from State

Read {stateFile} and identify the current PR to process:
- If `currentPr` is set, use it
- If `currentPr` is null, take the next PR from `prQueue` that is not in `prsProcessed`

Update {stateFile}: set `currentPr` to the selected PR and `currentStage` to `checkout-rebase`.

Report: "**Processing PR #[number]** (Story [storyKey]) — branch: `[branch]`"

### 2. Fetch Latest and Checkout Branch

```bash
git fetch origin
git checkout [branch]
```

Report: "Checked out branch `[branch]`."

If checkout fails: "Branch `[branch]` not found. Flagging PR #[number] as skipped." → Add to `prResults` with status `skipped`, set `currentPr` to null, and loop back to step 1 logic to get next PR. If no more PRs, load {finalStepFile}.

### 3. Rebase onto Latest Base (Cascade-Aware)

The base branch may have changed if previous PRs were merged in this session. Always rebase onto the latest base:

```bash
git rebase origin/master
```

**If rebase succeeds cleanly:**
Report: "Rebase onto latest master succeeded — no conflicts."

**If rebase has conflicts:**
Proceed to step 4.

### 4. Resolve Merge Conflicts (If Any)

For each conflicting file:

1. **Examine the conflict** — read both sides of the conflict markers
2. **Determine resolution:**
   - If the conflict is straightforward (e.g., both sides add non-overlapping code) → resolve automatically
   - If the conflict involves competing logic changes → attempt intelligent resolution based on the PR's intent (read the PR message for context)
   - If the conflict is ambiguous or involves complex business logic → escalate to user

3. **After resolving each file:**
   ```bash
   git add [resolved-file]
   ```

4. **Continue rebase:**
   ```bash
   git rebase --continue
   ```

5. **If resolution fails or is too ambiguous:**
   ```bash
   git rebase --abort
   ```
   Report: "Could not resolve conflicts for PR #[number]. Escalating."
   Ask user for guidance. If user says skip: add to `prResults` with status `conflict-skipped`, set `currentPr` to null.

### 5. Force Push Rebased Branch

After successful rebase:

```bash
git push --force-with-lease origin [branch]
```

Report: "Branch `[branch]` rebased and pushed."

### 6. Update State

Update {stateFile}:
- `currentStage`: `e2e-testing`

### 7. Present MENU OPTIONS

Display: "**Proceeding to e2e testing...**"

#### Menu Handling Logic:

- After successful rebase and state update, immediately load, read entire file, then execute {nextStepFile}

#### EXECUTION RULES:

- This is an auto-proceed step
- Proceed directly to e2e testing after successful rebase
- If rebase failed and PR was skipped, route to next PR (reload this step) or to {finalStepFile} if no PRs remain

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Branch checked out successfully
- Rebase completed (with or without conflict resolution)
- Conflicts resolved correctly or escalated when ambiguous
- Branch force-pushed with rebased commits
- State file updated with currentStage

### ❌ SYSTEM FAILURE:

- Running tests or modifying application code in this step
- Not rebasing onto latest base (missing cascade awareness)
- Silently dropping conflicting changes without resolution
- Not escalating ambiguous conflicts to user
- Using `git push --force` instead of `--force-with-lease`

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
