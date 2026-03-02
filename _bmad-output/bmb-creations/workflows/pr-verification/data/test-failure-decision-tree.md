# Test Failure Decision Tree

## E2E Test Failure Triage

When an e2e test fails, follow this decision tree in order:

### 1. Stale Test Detection
**Check:** Does the test reference a selector, route, component, or API endpoint that no longer exists in the codebase?

- **YES** → Remove the test. Log: test name, what it referenced, why it's stale.
- **NO** → Continue to step 2.

### 2. PR Regression
**Check:** Did code changes in THIS PR's branch cause the test to fail? (Compare test against the diff.)

- **YES** → Fix the code on the branch. Commit with conventional format: `fix: [description]`. Re-run test.
- **NO** → Continue to step 3.

### 3. Cascade Issue
**Check:** Did a previously merged PR (from this verification session) change something that this test depends on?

- **YES** → The fix may belong to the previous PR's scope. Attempt a fix on the current branch if straightforward. If not → escalate to user.
- **NO** → Continue to step 4.

### 4. Unclear
**Action:** Escalate to user. Present:
- Test name and file path
- Failure message / screenshot
- What was checked in steps 1-3 and why none matched

## Retry Policy

- **Maximum fix attempts per test:** 1
- After fixing, re-run the specific test
- If it still fails after the fix → escalate to user
- Never enter an infinite fix loop

## Logging Requirements

When removing a stale test, log:
- Test file path and test name
- What the test was asserting
- Why it's considered stale (missing selector/route/component)
- Date of removal
