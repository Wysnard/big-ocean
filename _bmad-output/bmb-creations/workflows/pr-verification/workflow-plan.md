---
stepsCompleted: ['step-01-discovery', 'step-02-classification', 'step-03-requirements', 'step-04-tools', 'step-05-plan-review', 'step-06-design', 'step-07-foundation', 'step-08-build-step-01', 'step-09-build-all-steps', 'step-10-confirmation', 'step-11-completion']
created: 2026-03-01
completionDate: 2026-03-02
status: COMPLETE
confirmationDate: 2026-03-02
confirmationType: new_workflow
coverageStatus: complete
approvedDate: 2026-03-01
---

# Workflow Creation Plan

## Discovery Notes

**User's Vision:**
A post-orchestration quality gate workflow that verifies each PR produced by the orchestration workflow. It runs e2e tests and executes manual test instructions (from the PR message) using Chrome DevTools MCP. If issues are found, it fixes them autonomously when confident, removes stale/deprecated tests, and asks the user when uncertain. PRs that pass all verification are merged automatically.

**Who It's For:**
The developer (Vincentlay), running after the orchestration workflow completes.

**What It Produces:**
Verified and merged PRs. Each PR goes through e2e testing + manual Chrome DevTools verification, gets fixed if needed, and is merged upon passing.

**Key Insights:**
- 2-6 PRs per orchestration run, mostly independent but with potential partial dependencies
- PR processing order determined by story file metadata (dependency fields)
- E2e test failures: fix autonomously, remove stale tests that test nonexistent features, ask user when uncertain
- Manual testing: execute the specific test instructions contained in each PR message via Chrome DevTools MCP
- Auto-merge PRs that pass all checks
- Branches are already created by the orchestration workflow
- Before testing each PR: rebase the branch onto the latest base and resolve any merge conflicts
- Conflict resolution happens before e2e/manual testing so tests run against the true integrated state
- Cascade-aware rebasing: after each PR merge, subsequent PRs must rebase against the updated base
- Standardized test instruction format in PR messages (contract with orchestration workflow)
- Per-PR state tracking for reliable continuation (which PR, which stage)
- Log removed/stale tests with reasoning for audit trail

## Classification Decisions

**Workflow Name:** pr-verification
**Target Path:** _bmad/bmm/workflows/4-implementation/pr-verification/

**4 Key Decisions:**
1. **Document Output:** false
2. **Module Affiliation:** BMM (4-implementation)
3. **Session Type:** continuable
4. **Lifecycle Support:** create-only

**Structure Implications:**
- Needs `steps-c/` folder only (create-only)
- Needs `step-01-init.md` with continuation detection and `step-01b-continue.md` for resuming
- `stepsCompleted` tracking in state for multi-session support
- Non-document: no templates or persistent output files needed
- Will use Chrome DevTools MCP and GitHub CLI for PR interaction

## Requirements

**Flow Structure:**
- Pattern: looping (per-PR pipeline)
- Phases: Init (gather PRs, determine dependency order) → Loop per PR: Checkout & Rebase → E2E Testing → Chrome DevTools Manual Testing → Merge → End (summary)
- Estimated steps: 5-6 (init, continue, checkout/rebase, e2e-test, manual-test, merge/summary)

**User Interaction:**
- Style: mostly autonomous with escalation points
- Decision points: uncertain test failures (real regression vs stale test), ambiguous conflict resolution
- Checkpoint frequency: only on uncertainty — no confirmation before merge

**Inputs Required:**
- Required: sprint planning document (lists developed stories), story files (dependency metadata, status)
- Required: PR branches already created by orchestration workflow
- Required: dev environment running (for Chrome DevTools testing)
- Optional: none identified

**Output Specifications:**
- Type: actions (rebase, fix, merge PRs)
- No persistent document produced
- Side effects: merged PRs, logs of removed stale tests with reasoning

**Success Criteria:**
- All PRs from sprint plan processed
- Each PR either merged (passed all checks) or flagged to user (unresolvable)
- No e2e test regressions introduced
- All manual test instructions verified via Chrome DevTools
- Stale test removals logged with reasoning

**Instruction Style:**
- Overall: prescriptive
- Notes: exact procedural steps at each gate; only judgment-based moments are fix attempts (fix autonomously, remove stale test, or ask user)

**Party Mode Refinements (Round 2):**
- Structured decision tree for test failure triage: stale test (selector/route gone) → PR regression (this PR broke it) → cascade issue (previous merge broke it) → unclear (ask user)
- Story files should specify which test suites are relevant per PR — don't blindly run everything
- Fixes must be committed with conventional commit format before proceeding to manual testing
- Init step must reconcile sprint plan stories vs actual open PRs — flag mismatches
- Retry limit: one fix attempt + re-run; if still failing, escalate to user (no infinite loops)

## Workflow Structure Design

### Step Sequence

**step-01-init.md** (Continuable Init)
- Check for existing state file (continuation detection)
- If resuming → route to step-01b
- If new → load sprint plan, find stories with "developed" status
- Read story files for dependency metadata
- Reconcile sprint plan vs actual open PRs, flag mismatches
- Build ordered PR processing queue
- Save initial state (PR queue, processing order)
- Menu: Auto-proceed (no A/P)

**step-01b-continue.md** (Continuation)
- Load existing state (prsProcessed, currentPr, currentStage)
- Welcome user back, show progress summary
- Route to step matching currentStage

**step-02-checkout-rebase.md** (Middle - Simple)
- Checkout PR branch
- Rebase onto latest base (cascade-aware)
- Resolve conflicts; if ambiguous → ask user
- Update state: currentStage → 'e2e-testing'
- Menu: Auto-proceed

**step-03-e2e-testing.md** (Middle - Complex)
- Run relevant test suites (specified in story file)
- On failure, apply decision tree:
  1. Selector/route/component gone → stale, remove, log
  2. PR code caused regression → fix code
  3. Previous merge caused it → flag cascade issue
  4. Unclear → ask user
- Retry limit: one fix + re-run, then escalate
- Commit fixes with conventional commit format
- Update state: currentStage → 'manual-testing'
- Menu: Auto-proceed

**step-04-manual-testing.md** (Middle - Complex)
- Parse structured test instructions from PR message
- Execute via Chrome DevTools MCP (navigate, click, verify)
- On failure → attempt fix, re-test (same retry limit)
- Commit fixes with conventional commit format
- Update state: currentStage → 'merge'
- Menu: Auto-proceed

**step-05-merge-loop.md** (Loop/Branch)
- Squash merge PR via `gh pr merge --squash`
- Wait for CI if additional checks beyond local testing
- Add PR to prsProcessed
- If more PRs in queue → loop back to step-02
- If all PRs processed → proceed to step-06
- Menu: Auto-proceed

**step-06-summary.md** (Final)
- Display all PRs processed (merged, flagged, skipped)
- Include PRs from previous sessions if continuable
- Display stale test removal log
- Mark workflow complete
- No nextStepFile

### Interaction Patterns
- Menu pattern: Auto-proceed (Pattern 3) for all steps — prescriptive pipeline
- No A/P menus — no creative facilitation needed
- User interaction only on escalation (ambiguous conflicts, uncertain test failures)

### Data Flow
- State file tracks: prsProcessed, currentPr, currentStage, prQueue, staleTestsRemoved
- Sprint plan → story files → PR branches → test results → merge
- Each step updates state before proceeding

### File Structure
```
pr-verification/
├── workflow.md
├── steps-c/
│   ├── step-01-init.md
│   ├── step-01b-continue.md
│   ├── step-02-checkout-rebase.md
│   ├── step-03-e2e-testing.md
│   ├── step-04-manual-testing.md
│   ├── step-05-merge-loop.md
│   └── step-06-summary.md
└── data/
    └── test-failure-decision-tree.md
```

### Role and Persona
- QA automation engineer — methodical, precise, terse status updates
- Only conversational when escalating to user
- Reports: what it's doing, what passed/failed, what it fixed

### Subprocess Optimization
- Not applicable — small file counts (2-6), heavy lifting by external tools

### Workflow Chaining
- Before: agent-team-pipeline / orchestration workflow (produces PRs)
- After: none — merged PRs are the end state
- Input discovery: sprint plan file (pattern search in _bmad-output/)

### Error Handling
- Rebase conflict unresolvable → ask user
- E2E fix fails after retry → escalate, skip PR, continue with next
- Chrome DevTools test can't execute → log issue, ask user
- No open PR for sprint plan story → flag mismatch in init, continue
- All PRs flagged/skipped → complete with summary showing no merges

## Tools Configuration

**Core BMAD Tools:**
- **Party Mode:** excluded — prescriptive pipeline, no creative facilitation needed
- **Advanced Elicitation:** excluded — no discovery or exploration phases
- **Brainstorming:** excluded — no ideation needed

**LLM Features:**
- **Web-Browsing:** excluded — all operations are local
- **File I/O:** included — read sprint plan, story files, PR messages; modify code for fixes
- **Sub-Agents:** excluded — sequential pipeline due to PR dependencies
- **Sub-Processes:** excluded — sequential pipeline due to cascade-aware rebasing

**Memory:**
- Type: continuable
- Tracking: prsProcessed (completed PRs), currentPr (active PR), currentStage (checkout/e2e/manual/merge), stepsCompleted (standard BMAD)

**External Integrations:**
- **Chrome DevTools MCP** — manual test execution (Phase 2c)
- **GitHub CLI (gh)** — PR operations (read PR message, merge)
- **Git** — checkout, rebase, commit fixes

**Installation Requirements:**
- Chrome DevTools MCP: already installed
- GitHub CLI: already installed
- No additional installations needed

**Party Mode Refinements (Round 3):**
- Git/File I/O are baseline agent capabilities, not integrations — Chrome DevTools MCP is the only true external integration
- Specify merge strategy (squash merge) explicitly in workflow steps
- CI check handling: decide whether to wait for GitHub Actions CI or trust local testing as sufficient (if CI runs additional checks like lint/typecheck/build, should wait)
- Summary destination: console output + should include PRs from previous sessions (pulled from prsProcessed state) for continuable runs
