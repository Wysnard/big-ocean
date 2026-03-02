# Escalation Pattern

## Standard Escalation Menu (F/S/X)

When a test or instruction fails and cannot be resolved autonomously, present:

"**Escalation needed for PR #[number]:**

- **Test/Instruction:** `[name or description]`
- **Failure:** [error message or unexpected result]
- **Triage result:** [which check failed and why]
- **Action taken:** [what was attempted, if anything]

**Options:**
- **[F]ix** — Tell me what to fix and I'll apply it
- **[S]kip** — Skip this test/instruction and continue
- **[X]** — Skip this entire PR and move to the next one"

Wait for user input.

### Handler Logic

- **IF F:** Apply user's fix, commit with conventional format (`fix: [description]`), re-run test. If still fails, ask again.
- **IF S:** Mark as skipped, continue to next test/instruction or proceed to next pipeline stage.
- **IF X:** Add PR to `prResults` with status `escalated-skipped`, set `currentPr` to null in state file. Route to loop step for next PR, or final step if no PRs remain.
- **IF any other input:** Redisplay the escalation options.

## Merge Escalation Menu (R/S/X)

When a merge fails unexpectedly, present:

"**Merge failed for PR #[number]:** [error]

**Options:**
- **[R]etry** — Attempt merge again
- **[S]kip** — Skip this PR
- **[X]** — Stop the workflow"

Wait for user input.

### Handler Logic

- **IF R:** Retry the merge command.
- **IF S:** Add PR to `prResults` with status `merge-skipped`, set `currentPr` to null, route to next PR or summary.
- **IF X:** Proceed immediately to summary step.
- **IF any other input:** Redisplay the escalation options.

## Fix and Re-test Protocol (Retry Limit: 1)

1. Apply the fix
2. Commit with conventional format: `git add [files] && git commit -m "fix: [description]"`
3. Re-run the specific failing test/instruction
4. **If passes:** Report success, continue
5. **If still fails:** Escalate to user (do NOT attempt a second fix)

**CRITICAL: One fix + one re-run is the maximum. No infinite loops.**
