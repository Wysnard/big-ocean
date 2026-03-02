---
name: 'step-06-summary'
description: 'Display final summary of all PRs processed and clean up state'

stateFile: '{output_folder}/pr-verification-state.yaml'
---

# Step 6: Summary

## STEP GOAL:

To display a comprehensive summary of all PRs processed across all sessions (if continuable), including merge results, fixes applied, stale tests removed, and any skipped/flagged PRs. Then clean up state and mark the workflow complete.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are a QA automation engineer delivering a final report
- ✅ Present results clearly and concisely
- ✅ Highlight any items that need user attention

### Step-Specific Rules:

- 🎯 Focus only on summarizing results and completing the workflow
- 🚫 FORBIDDEN to process any more PRs
- 🚫 FORBIDDEN to run tests or modify code
- 💬 Approach: clear, structured summary with actionable items if any

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Clean up state file after summary
- 📖 This is the final step — no next step to load

## CONTEXT BOUNDARIES:

- Available: state file with all results from all sessions
- Focus: reporting and cleanup
- Limits: read-only — no code changes
- Dependencies: all PRs must have been processed (merged, skipped, or flagged)

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Load Final State

Read {stateFile} and extract:
- `prsProcessed` — all completed PRs
- `prResults` — detailed results per PR
- `staleTestsRemoved` — all stale tests removed across sessions
- `startedAt` — when the workflow started

### 2. Display PR Results Summary

"**PR Verification Complete**

**Session started:** [startedAt]
**Total PRs processed:** [count]

| PR | Story | Status | Tests Fixed | Stale Removed | Skipped |
|----|-------|--------|-------------|---------------|---------|
| #123 | X-Y | ✓ Merged | 0 | 1 | 0 |
| #456 | X-Z | ✓ Merged | 2 | 0 | 0 |
| #789 | A-B | ⚠ Skipped | - | - | - |
"

### 3. Display Merge Statistics

"**Results:**
- **Merged:** [count] PR(s)
- **Skipped:** [count] PR(s)
- **Flagged:** [count] PR(s)
- **Total fixes committed:** [count]
- **Stale tests removed:** [count]"

### 4. Display Stale Test Removal Log

If any stale tests were removed:

"**Stale Tests Removed:**

| Test | File | Reason |
|------|------|--------|
| [test name] | [file path] | [why it was stale] |
"

If no stale tests removed:
"**No stale tests were removed.**"

### 5. Display Action Items (If Any)

If any PRs were skipped or flagged:

"**Action Items Requiring Attention:**

- PR #[number] (Story [key]): [reason it was skipped/flagged]
  - [what the user needs to do]
"

If no action items:
"**No outstanding action items. All PRs verified and merged.**"

### 6. Clean Up State

Delete or archive {stateFile} to indicate workflow completion:

"**Workflow state cleaned up.** Run the workflow again for the next verification cycle."

### 7. Final Message

"**PR Verification workflow complete.**

All [N] developed stories from the sprint plan have been processed. [M] PR(s) merged successfully."

If all merged: "Clean run — no issues found."
If some skipped: "Review the action items above for [N] skipped PR(s)."

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Comprehensive summary displayed with all PR results
- Stale test removal log presented
- Action items highlighted for skipped/flagged PRs
- State file cleaned up
- Workflow marked as complete
- Results include PRs from all sessions (if continuable)

### ❌ SYSTEM FAILURE:

- Not including PRs from previous sessions in summary
- Not displaying stale test removal log
- Not highlighting action items for skipped PRs
- Processing more PRs in this step
- Not cleaning up state file

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
