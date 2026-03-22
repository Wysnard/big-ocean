---
mode: edit
targetWorkflowPath: '_bmad/bmm/workflows/4-implementation/agent-team-pipeline'
workflowName: 'agent-team-pipeline'
editSessionDate: '2026-03-21'
stepsCompleted:
  - step-e-01-assess-workflow.md
  - step-e-02-discover-edits.md
  - step-e-03-fix-validation.md
  - step-e-04-direct-edit.md
  - step-e-05-apply-edit.md
  - step-e-07-complete.md
completionDate: '2026-03-21'
validationAfterEdit: completed
completionStatus: complete_with_validation
hasValidationReport: true
validationStatus: WARNINGS (0 critical, 4 warnings)
previousSession:
  date: '2026-03-18'
  changes: ['pnpm install in subagents', 'orchestrator reads parallelism plan', 'CI polling fix', 'frontmatter cleanups']
---

# Edit Plan: agent-team-pipeline

## Workflow Snapshot

**Path:** _bmad/bmm/workflows/4-implementation/agent-team-pipeline
**Format:** BMAD Compliant ✅
**Step Folders:** steps-c/ (4 step files), data/ (1 file)

## Validation Status

Validation run 2026-03-21:
- 0 critical issues
- 4 warnings (step-01-init near size limit, 2 unused frontmatter vars in step-01b, no conflict detection, no plan file)
- Key finding: **No conflict detection mechanism for parallel story execution** — directly aligns with edit goal

---

## Edit Goals

### Fix Validation Issues

**Priority: Medium** — Warnings, not critical

- [ ] **Fix 1 — step-01b-continue.md**: Remove unused frontmatter variables `parallelismPlan` and `sprintStatus`
- [ ] **Monitor — step-01-init.md**: At 220/250 lines, approaching limit (do not add content without splitting)

### Direct Changes — Add Conflict Detection

**Category:** Step files + data files (new capability)

**Changes Requested:**
- [ ] **Change 1 — Conflict detection mechanism**: After all subagents return results, compare changed files across branches to detect overlapping file modifications
- [ ] **Change 2 — Conflict report**: Flag overlapping files for user attention with actionable guidance (rebase, sequential re-run, manual merge)
- [ ] **Change 3 — Pipeline state update**: Track conflict detection results in pipeline-state.yaml

**Rationale:**
When multiple subagents work in parallel on worktrees, they may modify overlapping files. Without conflict detection, PRs may have merge conflicts, wasting CI runs and requiring manual intervention. Detecting overlaps early allows the orchestrator to warn or take corrective action.

---

## Previous Session Edits (2026-03-18)

- ✅ Added STAGE 0: Environment Setup (`pnpm install`) in agent-prompts.md
- ✅ Added mandatory read of `{parallelism_plan}` in workflow.md
- ✅ Fixed CI Check polling (Stage 8) in agent-prompts.md
- ✅ Removed unused frontmatter vars in step-01b-continue.md
- ✅ Added literal `{epicsFile}` reference in step-02-execute.md

---

## Edits Applied (Current Session)

### Validation Fixes

**[Frontmatter]** steps-c/step-01b-continue.md
- ✅ Fixed: Removed unused frontmatter variables `parallelismPlan` and `sprintStatus`
- User approved: Yes
- Compliance check: Passed

### Direct Changes — Conflict Detection

**[New Step File]** steps-c/step-02b-conflict-detection.md
- ✅ Created: New auto-proceed step for detecting file-level conflicts between parallel branches
- Algorithm: git diff per branch → overlap matrix → risk categorization → pipeline state update
- 192 lines, within limits
- User approved: Yes

**[Step File]** steps-c/step-02-execute.md
- ✅ Changed: `nextStepFile` from `./step-03-cleanup.md` → `./step-02b-conflict-detection.md`
- User approved: Yes

**[Step File]** steps-c/step-01-init.md
- ✅ Changed: Added `conflicts` section to pipeline-state.yaml schema (7 lines)
- Now 227 lines (was 220) — still under 250 max
- User approved: Yes

**[Checklist]** checklist.md
- ✅ Changed: Added Step 02b conflict detection checklist items
