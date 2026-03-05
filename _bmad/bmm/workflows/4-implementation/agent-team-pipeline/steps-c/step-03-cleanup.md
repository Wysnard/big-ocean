---
name: 'step-03-cleanup'
description: 'Fan-in: update sprint status, report PR URLs, summarize halted stories, finalize pipeline'

pipelineState: '{implementation_artifacts}/pipeline-state.yaml'
sprintStatus: '{implementation_artifacts}/sprint-status.yaml'
---

# Step 3: Cleanup & Report

## STEP GOAL:

To finalize the pipeline by updating sprint status for completed stories, reporting all PR URLs, summarizing any halted stories with failure details, and presenting the final pipeline outcome.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER skip updating sprint status for completed stories
- 📖 CRITICAL: Read the complete step file before taking any action
- ⚙️ TOOL/SUBPROCESS FALLBACK: If any instruction references a subprocess, subagent, or tool you do not have access to, you MUST still achieve the outcome in your main context thread

### Role Reinforcement:

- ✅ You are the Scrum Master (Bob) finalizing pipeline results
- ✅ Clear reporting, actionable next steps
- ✅ Fully autonomous — no user interaction

### Step-Specific Rules:

- 🎯 Focus ONLY on state updates and reporting
- 🚫 FORBIDDEN to re-run any stories — that's step-02's job
- 🚫 FORBIDDEN to modify code or PRs
- 💬 Present final summary clearly

## EXECUTION PROTOCOLS:

- 🎯 Follow the MANDATORY SEQUENCE exactly
- 💾 Update {sprintStatus} for completed stories
- 📖 Read pipeline state for final results

## CONTEXT BOUNDARIES:

- Available: pipeline-state.yaml (updated by step-02), sprint-status.yaml
- Focus: reporting and state finalization
- Limits: do not re-run stories or modify code
- Dependencies: step-02 must have completed

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise.

### 1. Remove Worktrees

Subagents created git worktrees during execution. These MUST be removed before the PR Verification workflow can checkout the branches. A branch checked out in a worktree cannot be checked out elsewhere — git will refuse.

```bash
git worktree list
```

For each worktree that is NOT the main working tree:
```bash
git worktree remove --force <worktree-path>
```

After removal, verify:
```bash
git worktree list
```

Only the main working tree should remain. If any worktree removal fails, report the error but continue — do not HALT.

### 2. Load Final Pipeline State

Read {pipelineState} completely.

Collect:
- All stories with status "done" → list PR URLs
- All stories with status "halted" → list errors and halted stages

### 3. Update Sprint Status

Read {sprintStatus}.

For each story with status "done" in pipeline state:
- Update the story's status to `pr-ready` in sprint status

Write the updated {sprintStatus}.

Commit:
```
git add {sprintStatus}
git commit -m "chore: update sprint status — mark completed stories as pr-ready"
```

### 4. Present Final Summary

Output the final pipeline report:

"**Pipeline Complete**

**Parallelism Plan Step:** [N] — [name]

---

### Completed Stories (PR Ready)

| Story | PR URL | Branch |
|-------|--------|--------|
| [key] | [url] | [branch] |

### Halted Stories (Need Attention)

| Story | Halted At | Error |
|-------|-----------|-------|
| [key] | [stage] | [error summary] |

---

**Summary:**
- **Total stories:** [count]
- **Succeeded:** [count] — PRs ready for review
- **Halted:** [count] — need manual intervention

**Next steps:**
- Review and merge PRs for completed stories
- Investigate halted stories and re-run pipeline with `step-01b-continue`
- When all stories in this step are merged, run pipeline again for next parallelism plan step"

### 5. Pipeline End

This is the FINAL step. The workflow is complete.

**IF all stories succeeded:** Report success — all PRs are ready for review.

**IF some stories halted:** Report partial success — user should investigate halted stories and re-run via continue flow.

**IF all stories halted:** Report failure — no PRs were created. User should investigate errors before re-running.

## CRITICAL STEP COMPLETION NOTE

This is the terminal step. After presenting the final summary, the workflow is DONE. Do not load any further step files.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All subagent worktrees removed (branches unblocked for PR verification)
- Pipeline state loaded with final results
- Sprint status updated for completed stories
- Sprint status committed
- PR URLs clearly listed
- Halted stories reported with actionable details
- Final summary presented with next steps
- Workflow cleanly terminated

### ❌ SYSTEM FAILURE:

- Not removing worktrees (blocks PR verification branch checkout)
- Not updating sprint status for completed stories
- Not committing sprint status changes
- Not reporting halted story details
- Re-running stories in this step
- Not presenting clear next steps
- Loading another step file after this one

**Master Rule:** Skipping steps, optimizing sequences, or not following exact instructions is FORBIDDEN and constitutes SYSTEM FAILURE.
