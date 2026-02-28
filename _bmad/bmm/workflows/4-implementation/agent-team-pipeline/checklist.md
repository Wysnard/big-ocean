---
title: 'Agent Team Pipeline Validation Checklist'
validation-target: 'Pipeline execution for story {{story_key}}'
validation-criticality: 'HIGHEST'
required-inputs:
  - 'Story file with Status: ready-for-dev'
  - 'Sprint status file (optional)'
  - 'Clean main branch'
---

# Agent Team Pipeline Checklist

## Pre-Pipeline

- [ ] Story file exists and has Status: ready-for-dev
- [ ] Main branch is clean (no uncommitted changes)
- [ ] CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 is set

## Pipeline Execution

- [ ] Team created successfully via TeamCreate
- [ ] All 7 tasks created with correct dependency chain
- [ ] Adversarial review completed (findings produced or "no critical findings")
- [ ] Architect filter applied (if critical findings existed)
- [ ] Dev implementation completed with typecheck passing
- [ ] Code review completed (findings produced)
- [ ] Fixes applied (if critical/high findings existed)
- [ ] E2E validation passed
- [ ] Branch pushed to remote
- [ ] PR created via gh pr create

## Post-Pipeline

- [ ] Sprint status updated to "review" (if sprint tracking active)
- [ ] Story file Status updated to "review"
- [ ] All teammates shut down
- [ ] Team cleaned up via TeamDelete
- [ ] PR URL reported to user
