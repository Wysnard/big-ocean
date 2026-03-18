---
mode: edit
targetWorkflowPath: '/Users/vincentlay/Projects/big-ocean/_bmad-output/bmb-creations/workflows/agent-team-pipeline'
workflowName: 'agent-team-pipeline'
editSessionDate: '2026-03-18'
stepsCompleted:
  - step-e-01-assess-workflow.md
  - step-e-02-discover-edits.md
  - step-e-04-direct-edit.md
  - step-e-05-apply-edit.md
completionDate: '2026-03-18'
validationAfterEdit: completed
completionStatus: complete_with_validation
hasValidationReport: false
validationStatus: N/A
---

# Edit Plan: agent-team-pipeline

## Workflow Snapshot

**Path:** /Users/vincentlay/Projects/big-ocean/_bmad-output/bmb-creations/workflows/agent-team-pipeline
**Format:** BMAD Compliant ✅
**Step Folders:** steps-c/ (4 files: step-01-init.md, step-01b-continue.md, step-02-execute.md, step-03-cleanup.md)
**Data Folder:** data/ (agent-prompts.md)

## Validation Status

No validation run yet

---

## Edit Goals

### Direct Changes

**Category:** workflow.md + step files / data files

**Changes Requested:**
- [ ] **Change 1 — Subagent `pnpm install`**: Worktree-isolated subagents must run `pnpm install` as their first action before proceeding with any work (worktrees don't carry `node_modules`)
- [ ] **Change 2 — Orchestrator reads sprint parallelism plan**: Add an explicit mandatory step in the orchestrator's initialization sequence to read the sprint parallelism plan file (`{parallelism_plan}`) — not just define it as a path variable

**Rationale:**
1. Subagents spawn in git worktrees which are clean copies without `node_modules`. Without `pnpm install`, any build/test/lint commands will fail.
2. The parallelism plan is the source of truth for what stories to execute. The orchestrator must read it, not just reference the path.

---

## Edits Applied

### Direct Changes Applied

**[Data File]** data/agent-prompts.md
- ✅ Changed: Added STAGE 0: Environment Setup — `pnpm install` before any other stage
- User approved: Yes
- Compliance check: Passed

**[Workflow.md]** workflow.md
- ✅ Changed: Added mandatory step 2 to read `{parallelism_plan}` in initialization sequence
- User approved: Yes
- Compliance check: Passed

**[Data File]** data/agent-prompts.md
- ✅ Changed: Stage 8 CI Check — replaced `gh pr checks --watch` with 2-min wait + 15-sec polling
- User approved: Yes
- Compliance check: Passed

### Frontmatter Fixes (from validation)

**[Step File]** steps-c/step-01b-continue.md
- ✅ Removed unused frontmatter variables `parallelismPlan` and `sprintStatus`

**[Step File]** steps-c/step-02-execute.md
- ✅ Added literal `{epicsFile}` reference in variable injection table
