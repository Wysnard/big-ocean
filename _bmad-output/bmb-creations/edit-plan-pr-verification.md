---
mode: edit
targetWorkflowPath: '_bmad/bmm/workflows/4-implementation/pr-verification'
workflowName: 'pr-verification'
editSessionDate: '2026-03-19'
stepsCompleted:
  - step-e-01-assess-workflow.md
  - step-e-02-discover-edits.md
  - step-e-04-direct-edit.md
  - step-e-05-apply-edit.md
  - step-e-07-complete.md
completionDate: '2026-03-19'
validationAfterEdit: passed-with-fix
completionStatus: complete
hasValidationReport: false
validationStatus: null
---

# Edit Plan: pr-verification

## Workflow Snapshot

**Path:** _bmad/bmm/workflows/4-implementation/pr-verification
**Format:** BMAD Compliant ✅
**Step Folders:** steps-c/ (7 step files)
**Data Folder:** yes (escalation-pattern.md, test-failure-decision-tree.md)
**Templates Folder:** no

## Validation Status

No validation run yet

---

## Edit Goals

- Make CI check polling use specific timing: 2 min 30 sec initial wait, then poll every 15 sec
- Add new step `step-02b-check-comments.md` between step-02 (Checkout/Rebase) and step-03 (E2E Testing)

### Direct Changes

**Category:** Step files + routing

**Changes Requested:**
- [ ] Create new step file `steps-c/step-02b-check-comments.md`
- [ ] Fetch PR review comments (inline code review) AND general conversation comments
- [ ] Check for "changes requested" review status
- [ ] Parse actionable feedback from all comment sources
- [ ] Apply fixes where resolution is clear (one fix attempt, then escalate)
- [ ] Reply to each comment on GitHub after addressing it (e.g., "Fixed in [commit]")
- [ ] If a comment is ambiguous, ask the user for clarification before attempting a fix
- [ ] Commit fixes with conventional commit format, push with `--force-with-lease`
- [ ] Update step-02 routing: `nextStepFile` → `step-02b-check-comments.md`
- [ ] New step routes to step-03 on completion

**Rationale:**
PR review comments (requested changes, inline feedback) are currently ignored by the workflow. This step ensures reviewer feedback is addressed before running tests, and that each comment gets a reply on GitHub for traceability.

---

## Edits Applied

### 2026-03-19: Add PR comment checking step (step-02b-check-comments.md)
- **Files created:** `steps-c/step-02b-check-comments.md` (178 lines)
- **Files modified:** `steps-c/step-02-checkout-rebase.md` (routing: nextStepFile → step-02b)
- **Change:** New step inserted between Checkout/Rebase and E2E Testing that:
  - Checks for "changes requested" review status
  - Fetches inline review comments AND conversation comments
  - Triages each comment (actionable / ambiguous / not actionable)
  - Asks user for clarification on ambiguous comments
  - Applies fixes and commits with conventional format
  - Replies to each comment on GitHub after addressing it
  - Escalates via standard F/S/X pattern on failure
- **Pipeline now:** step-02 → step-02b → step-03

### 2026-03-19: Validation fix — unused frontmatter vars (step-02b-check-comments.md)
- **File:** `steps-c/step-02b-check-comments.md`, Section 5 (Fix and Reply)
- **Change:** Added explicit X routing using `{loopStepFile}` and `{finalStepFile}` in escalation section to match pattern used by step-03 and step-04
- **Issue:** Frontmatter declared `loopStepFile` and `finalStepFile` but body never referenced them

### 2026-03-19: CI polling timing (step-05-merge-loop.md)
- **File:** `steps-c/step-05-merge-loop.md`, Section 1 (Check CI Status)
- **Change:** Replaced vague "poll at reasonable intervals" with explicit timing: wait 2 min 30 sec before first poll, then poll every 15 seconds
- **Lines affected:** 66-68

---

## Completion Summary

**Completed:** 2026-03-19
**Total Edits:** 3
- Validation Fixes: 1 (unused frontmatter vars in step-02b)
- Direct Changes: 2 (new step-02b + routing update in step-02)

**Files Created:** 1 (step-02b-check-comments.md)
**Files Modified:** 2 (step-02-checkout-rebase.md, step-02b-check-comments.md)
**Final Validation Status:** Passed with fix

**Workflow is ready for:** Testing
