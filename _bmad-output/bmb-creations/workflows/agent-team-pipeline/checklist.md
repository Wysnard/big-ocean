---
title: 'Agent Team Pipeline Validation Checklist'
validation-target: 'Pipeline execution for parallelism plan step'
validation-criticality: 'HIGHEST'
required-inputs:
  - 'sprint-parallelism-plan.md'
  - 'sprint-status.yaml'
  - 'epics.md'
  - 'Clean main branch'
  - 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1'
---

# Agent Team Pipeline Checklist

## Pre-Pipeline

- [ ] sprint-parallelism-plan.md exists and has incomplete steps
- [ ] sprint-status.yaml exists
- [ ] epics.md exists with story definitions
- [ ] Main branch is clean (no uncommitted changes)

## Step 01: Init

- [ ] Parallelism plan loaded and parsed
- [ ] Current incomplete step identified
- [ ] All stories in step listed
- [ ] Baseline commit recorded
- [ ] pipeline-state.yaml created with initial state

## Step 01b: Continue (if resuming)

- [ ] pipeline-state.yaml loaded
- [ ] Completed stories skipped
- [ ] HALTed/incomplete stories identified for re-run

## Step 02: Execute (per story)

- [ ] Subagent spawned per story with isolation: "worktree"
- [ ] Each subagent prompt is self-contained with all paths and instructions
- [ ] Story created from epics
- [ ] Adversarial review completed (findings or "no critical findings")
- [ ] Architect notes appended to story (if critical findings)
- [ ] Dev implementation completed with TDD
- [ ] Typecheck passing (within 3 retries)
- [ ] Code review completed
- [ ] Review findings fixed (if critical/high)
- [ ] Branch pushed, PR created via gh pr create
- [ ] CI check passing via gh pr checks --watch (within 3 retries)
- [ ] Story file committed to feature branch
- [ ] Subagent returned: {story_key, status, pr_url, dev_branch}

## Step 03: Cleanup

- [ ] All subagent results collected
- [ ] pipeline-state.yaml updated with final statuses
- [ ] sprint-status.yaml updated (stories set to "pr-ready")
- [ ] All PR URLs reported to user
- [ ] HALTed stories reported with failure details
- [ ] Summary output presented
