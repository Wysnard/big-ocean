---
name: 'step-03-e2e-testing'
description: 'Run e2e tests, triage failures using decision tree, fix or escalate'

nextStepFile: './step-04-manual-testing.md'
loopStepFile: './step-02-checkout-rebase.md'
finalStepFile: './step-06-summary.md'
stateFile: '{output_folder}/pr-verification-state.yaml'
decisionTreeFile: '../data/test-failure-decision-tree.md'
escalationPattern: '../data/escalation-pattern.md'
---

# Step 3: E2E Testing

## STEP GOAL:

To run the relevant e2e test suites for the current PR, triage any failures using a structured decision tree, fix or remove stale tests as appropriate, and commit all fixes with conventional commit format.

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
- ✅ Report test results clearly: passed, failed, fixed, removed
- ✅ Only engage conversationally when escalating uncertain failures

### Step-Specific Rules:

- 🎯 Focus only on running e2e tests and triaging failures
- 🚫 FORBIDDEN to run manual/Chrome DevTools tests — that comes in step 04
- 🚫 FORBIDDEN to merge — that comes in step 05
- 💬 Approach: run tests, apply decision tree systematically, report results
- 🔄 Retry limit: ONE fix attempt per failing test, then re-run. If still failing, escalate.

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Update state file after testing completes
- 📖 Log all stale test removals with reasoning
- 🚫 Never enter infinite fix loops — one fix + one re-run max

## CONTEXT BOUNDARIES:

- Available: state file with current PR info, story file with test suite info, decision tree
- Focus: e2e test execution and failure triage
- Limits: do not perform manual testing or merge
- Dependencies: step-02 must have completed checkout and rebase

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Load Context

Read {stateFile} to get current PR info (branch, storyKey, testSuites).

Read the story file for this PR to identify which test suites are relevant. If the story file specifies test suites, run only those. If not specified, run the full e2e suite.

Load {decisionTreeFile} for failure triage reference.

Report: "**Running e2e tests for PR #[number]** (Story [storyKey])"
Report: "Test suites: [list suites or 'full suite']"

### 2. Run E2E Tests

Execute the relevant test suites:

```bash
pnpm test:run [--filter if specific suites]
```

**If all tests pass:**
Report: "All e2e tests passed. ✓"
→ Skip to step 6 (Update State).

**If tests fail:**
Report: "**[N] test(s) failed.** Triaging failures..."
→ Proceed to step 3.

### 3. Triage Each Failing Test

For EACH failing test, apply the decision tree from {decisionTreeFile} in order:

**Check 1 — Stale Test Detection:**
Does the test reference a selector, route, component, or API endpoint that no longer exists in the codebase?

- **YES** → Remove the test file or test case. Log the removal:
  - Test file path and test name
  - What the test was asserting
  - Why it's considered stale (missing selector/route/component)

  Add to `staleTestsRemoved` in {stateFile}.

  Report: "Removed stale test: `[test name]` — referenced `[missing element]` which no longer exists."

- **NO** → Continue to Check 2.

**Check 2 — PR Regression:**
Did code changes in THIS PR's branch cause the test to fail? Compare the test expectations against the PR diff.

- **YES** → Fix the code on the branch to make the test pass.
  Report: "PR regression detected in `[file]`. Fixing..."
  → Proceed to step 4 (Fix and Re-run).

- **NO** → Continue to Check 3.

**Check 3 — Cascade Issue:**
Did a previously merged PR (from this verification session) change something that this test depends on?

- **YES, and fix is straightforward** → Fix the code on the current branch.
  Report: "Cascade issue from previous merge. Fixing..."
  → Proceed to step 4 (Fix and Re-run).

- **YES, but fix is complex** → Escalate to user.
  Report: "Cascade issue detected but fix is non-trivial. Escalating."
  → Proceed to step 5 (Escalate).

- **NO** → Continue to Check 4.

**Check 4 — Unclear:**
None of the above matched.

- Escalate to user. Present:
  - Test name and file path
  - Failure message and/or stack trace
  - What was checked in steps 1-3 and why none matched
  → Proceed to step 5 (Escalate).

### 4. Fix and Re-run (Retry Limit: 1)

Follow the "Fix and Re-test Protocol" from {escalationPattern}. Commit fixes, re-run the specific failing test. If still failing after one fix, escalate.

### 5. Escalate to User

Follow the "Standard Escalation Menu (F/S/X)" from {escalationPattern}. Include the test name, file path, failure message, triage result, and action taken. Route X to {loopStepFile} for next PR, or {finalStepFile} if no PRs remain. Update {stateFile} accordingly.

### 6. Update State

After all tests pass (or stale tests removed, or user confirmed skips):

Update {stateFile}:
- `currentStage`: `manual-testing`

Push any fix commits:
```bash
git push --force-with-lease origin [branch]
```

Report: "**E2E testing complete for PR #[number].**"
Report: "Results: [N] passed, [N] fixed, [N] stale removed, [N] skipped"

### 7. Present MENU OPTIONS

Display: "**Proceeding to manual testing...**"

#### Menu Handling Logic:

- After state update and fixes pushed, immediately load, read entire file, then execute {nextStepFile}

#### EXECUTION RULES:

- This is an auto-proceed step
- Proceed directly to manual testing after e2e testing completes
- If PR was skipped (user selected X), route to {loopStepFile} for next PR or {finalStepFile} if queue empty

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Relevant test suites identified and executed
- Decision tree applied systematically to each failure
- Stale tests removed with logged reasoning
- Fixes committed with conventional commit format
- Retry limit respected (one fix + one re-run max)
- Ambiguous failures escalated to user
- State file updated with results

### ❌ SYSTEM FAILURE:

- Running all tests instead of relevant suites when story specifies
- Not following the decision tree order
- Entering infinite fix loops (more than one fix attempt)
- Not logging stale test removals
- Committing fixes without conventional commit format
- Not escalating when uncertain
- Silently skipping failing tests without user consent

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
