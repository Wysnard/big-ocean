---
name: 'step-04-manual-testing'
description: 'Execute manual test instructions from PR message via Chrome DevTools MCP'

nextStepFile: './step-05-merge-loop.md'
loopStepFile: './step-02-checkout-rebase.md'
finalStepFile: './step-06-summary.md'
stateFile: '{output_folder}/pr-verification-state.yaml'
escalationPattern: '../data/escalation-pattern.md'
---

# Step 4: Manual Testing (Chrome DevTools)

## STEP GOAL:

To parse the structured test instructions from the PR message, execute each instruction via Chrome DevTools MCP (navigating pages, clicking elements, verifying outcomes), fix issues found, and commit fixes with conventional commit format.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are a QA automation engineer performing manual verification via browser automation
- ✅ Report each test instruction and its result clearly
- ✅ Only engage conversationally when a test instruction fails and fix is uncertain

### Step-Specific Rules:

- 🎯 Focus only on executing manual test instructions via Chrome DevTools MCP
- 🚫 FORBIDDEN to re-run e2e tests — that was step 03
- 🚫 FORBIDDEN to merge — that comes in step 05
- 💬 Approach: parse instructions, execute systematically, report pass/fail per instruction
- 🔄 Retry limit: ONE fix attempt per failing instruction, then re-test. If still failing, escalate.

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Update state file after manual testing completes
- 📖 Take screenshots on failures for evidence
- 🚫 Never skip test instructions without user consent

## CONTEXT BOUNDARIES:

- Available: state file with current PR info, PR message with test instructions
- Focus: browser-based manual test execution only
- Limits: do not re-run e2e tests or merge
- Dependencies: step-03 must have completed e2e testing, dev environment must be running

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Load Context

Read {stateFile} to get current PR info (prNumber, branch, storyKey).

Fetch the PR message to extract test instructions:
```bash
gh pr view [prNumber] --json body -q '.body'
```

Report: "**Running manual tests for PR #[number]** (Story [storyKey])"

### 2. Parse Test Instructions

Extract the structured test instructions section from the PR body. Test instructions should follow a standardized format with steps and expected outcomes.

Parse each instruction into:
- **Action**: What to do (navigate, click, type, etc.)
- **Target**: Where to do it (URL, selector, element)
- **Expected**: What should happen (element appears, text matches, redirect occurs)

Report: "**Found [N] manual test instructions.**"
List each instruction briefly.

If no test instructions found in PR message:
Report: "No manual test instructions found in PR #[number]. Skipping manual testing."
→ Skip to step 6 (Update State).

### 3. Verify Dev Environment

Before executing tests, verify the dev environment is running:

- Check that the frontend is accessible (port 3000)
- Check that the API is accessible (port 4000)

If not running:
Report: "Dev environment not running. Please start with `pnpm dev` and confirm."
Wait for user confirmation.

### 4. Execute Each Test Instruction

For EACH test instruction, execute via Chrome DevTools MCP:

**4a. Navigate** (if instruction requires a page load):
- Use Chrome DevTools MCP to navigate to the target URL
- Wait for page to load

**4b. Perform Action** (click, type, hover, etc.):
- Use Chrome DevTools MCP to perform the specified action on the target element
- If element not found: take screenshot, report failure, proceed to step 5

**4c. Verify Expected Outcome:**
- Check that the expected result occurred (element visible, text matches, URL changed, etc.)
- Take a screenshot for evidence

**If instruction passes:**
Report: "✓ Instruction [N]: [brief description] — passed"

**If instruction fails:**
Report: "✗ Instruction [N]: [brief description] — FAILED"
Report: "Expected: [expected outcome]"
Report: "Actual: [what happened]"
Take screenshot.
→ Proceed to step 5 (Fix and Re-test).

### 5. Fix and Re-test (Retry Limit: 1)

When a manual test instruction fails:

1. **Analyze the failure** — read relevant source code, compare expected vs actual, identify root cause
2. **If fix is clear** — follow the "Fix and Re-test Protocol" from {escalationPattern}. Re-execute the failed instruction via Chrome DevTools MCP after committing the fix.
3. **If fix is unclear or still fails after one attempt** — escalate immediately

**Escalation:**

Follow the "Standard Escalation Menu (F/S/X)" from {escalationPattern}. Include the instruction number, what was tested, expected/actual outcomes, screenshot reference, and action taken. Route X to {loopStepFile} for next PR, or {finalStepFile} if no PRs remain. Update {stateFile} with status `manual-test-skipped`.

### 6. Update State

After all manual test instructions pass (or user confirmed skips):

Update {stateFile}:
- `currentStage`: `merge`

Push any fix commits:
```bash
git push --force-with-lease origin [branch]
```

Report: "**Manual testing complete for PR #[number].**"
Report: "Results: [N] passed, [N] fixed, [N] skipped"

### 7. Present MENU OPTIONS

Display: "**Proceeding to merge...**"

#### Menu Handling Logic:

- After state update and fixes pushed, immediately load, read entire file, then execute {nextStepFile}

#### EXECUTION RULES:

- This is an auto-proceed step
- Proceed directly to merge after manual testing completes
- If PR was skipped (user selected X), route to {loopStepFile} for next PR or {finalStepFile} if queue empty

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- PR message parsed for structured test instructions
- Dev environment verified before testing
- Each instruction executed via Chrome DevTools MCP
- Screenshots taken on failures
- Fixes committed with conventional commit format
- Retry limit respected (one fix + one re-test max)
- Unclear failures escalated to user
- State file updated with results

### ❌ SYSTEM FAILURE:

- Not parsing test instructions from PR message
- Skipping test instructions without user consent
- Not verifying dev environment is running
- Not taking screenshots on failures
- Entering infinite fix loops (more than one fix attempt)
- Committing fixes without conventional commit format
- Not escalating when uncertain
- Re-running e2e tests in this step

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
