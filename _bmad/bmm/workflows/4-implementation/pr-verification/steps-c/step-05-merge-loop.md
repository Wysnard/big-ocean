---
name: 'step-05-merge-loop'
description: 'Squash merge the verified PR, then loop to next PR or proceed to summary'

loopStepFile: './step-02-checkout-rebase.md'
finalStepFile: './step-06-summary.md'
stateFile: '{output_folder}/pr-verification-state.yaml'
---

# Step 5: Merge & Loop

## STEP GOAL:

To squash merge the current PR after it has passed both e2e and manual testing, record the result, then either loop back to step-02 for the next PR in the queue or proceed to the summary step if all PRs are processed.

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
- ✅ Report merge result and queue status
- ✅ Only engage conversationally if merge fails unexpectedly

### Step-Specific Rules:

- 🎯 Focus only on merging and routing to next PR or summary
- 🚫 FORBIDDEN to run tests — that was steps 03 and 04
- 🚫 FORBIDDEN to checkout new branches — that happens when looping to step 02
- 💬 Approach: merge, record, report, route

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Update state file with merge result and clear currentPr
- 📖 Return to master after merge for clean state
- 🚫 Do not proceed if merge fails without escalating

## CONTEXT BOUNDARIES:

- Available: state file with current PR info, PR has passed all tests
- Focus: merge operation and loop routing
- Limits: do not modify code or run tests
- Dependencies: steps 03 and 04 must have completed successfully

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Check CI Status (If Applicable)

Before merging, check if GitHub Actions CI is running additional checks beyond what was tested locally (lint, typecheck, build):

```bash
gh pr checks [prNumber]
```

**If CI checks are pending:**
Report: "CI checks still running. Waiting 2 min 30 sec for initial run..."
Wait 2 minutes 30 seconds before the first poll, then poll with `gh pr checks` every 15 seconds until checks complete or fail.

**If CI checks pass:**
Report: "CI checks passed. ✓"

**If CI checks fail:**
Report: "CI check `[name]` failed: [reason]"

- If the failing check is something tested locally (e2e) → likely a flaky test, proceed with merge
- If the failing check is additional (lint, typecheck, build) → attempt to fix:
  - Run the failing check locally, fix the issue, commit with conventional format
  - Push the fix: `git push --force-with-lease origin [branch]`
  - Wait for CI to re-run
  - If still failing after one fix → escalate to user

**If no CI configured or checks not required:**
Report: "No CI checks required. Proceeding to merge."

### 2. Squash Merge the PR

```bash
gh pr merge [prNumber] --squash --delete-branch
```

**If merge succeeds:**
Report: "**PR #[number] merged successfully.** ✓ (Story [storyKey])"

**If merge fails:**
Report: "Merge failed for PR #[number]: [error]"

Possible causes:
- Branch protection rules blocking merge → escalate to user
- Merge conflicts appeared after CI (race condition) → rebase and retry once
- PR was closed or already merged → check status, skip if already merged

If unresolvable: escalate to user with options:
- **[R]etry** — Attempt merge again
- **[S]kip** — Skip this PR
- **[X]** — Stop the workflow
- **If any other input:** Redisplay the escalation options.

Wait for user input.

### 3. Update State

Update {stateFile}:

- Add current PR to `prsProcessed`
- Add to `prResults`:
  ```yaml
  - prNumber: [number]
    storyKey: '[key]'
    status: 'merged'
    testsFixed: [count]
    staleTestsRemoved: [count]
    instructionsSkipped: [count]
  ```
- Set `currentPr`: null
- Set `currentStage`: null

### 4. Return to Master

```bash
git checkout master
git pull origin master
```

This ensures the next PR rebases against the freshly updated master (cascade-aware).

### 5. Check Queue for Remaining PRs

Read {stateFile} and check if there are PRs in `prQueue` that are not in `prsProcessed`.

**If more PRs remain:**

Report: "**[N] PR(s) remaining in queue.** Next: PR #[number] (Story [key])"

→ Load, read entire file, then execute {loopStepFile} to process the next PR.

**If all PRs processed:**

Report: "**All PRs processed.** Proceeding to summary."

→ Load, read entire file, then execute {finalStepFile}.

### 6. Present MENU OPTIONS

Display: "**Proceeding to [next PR / summary]...**"

#### Menu Handling Logic:

- If more PRs remain: immediately load, read entire file, then execute {loopStepFile}
- If all PRs processed: immediately load, read entire file, then execute {finalStepFile}

#### EXECUTION RULES:

- This is an auto-proceed step with conditional routing
- Route based on queue status — no user choice needed
- Loop back to step-02 for next PR or forward to step-06 for summary

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- CI status checked before merge (if applicable)
- PR squash merged successfully
- State file updated with merge result
- Master checked out and pulled for cascade awareness
- Correctly routed to next PR or summary based on queue

### ❌ SYSTEM FAILURE:

- Merging without checking CI (if CI runs additional checks)
- Using merge strategy other than squash
- Not returning to master after merge (breaks cascade-aware rebasing)
- Not updating state file with results
- Routing to wrong step (next PR vs summary)
- Running tests or modifying code in this step

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
