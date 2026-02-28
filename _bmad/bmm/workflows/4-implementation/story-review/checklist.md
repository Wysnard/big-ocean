# Story Review - Validation Checklist

- [ ] Story file loaded from `{{story_path}}`
- [ ] Story Status verified as reviewable (draft or created)
- [ ] Epic and Story IDs resolved ({{epic_num}}.{{story_num}})
- [ ] Architecture doc loaded for alignment checks
- [ ] Previous story loaded (if story_num > 1) for continuity
- [ ] Fast-path assessment completed (trivial vs standard)
- [ ] All ACs have Given/When/Then structure
- [ ] Every task has clear, verifiable completion criteria
- [ ] Dev Notes reference correct architectural patterns from architecture doc
- [ ] File locations match project structure conventions
- [ ] No reinvention of existing utilities/patterns (checked against codebase)
- [ ] Security considerations addressed (auth, validation, injection) where applicable
- [ ] Error handling specified for all failure paths
- [ ] Error location rules followed (HTTP errors in contracts, infra errors co-located)
- [ ] No business logic specified in handlers (handler-layer boundary)
- [ ] Cross-story dependencies identified and documented
- [ ] API contracts specified (request/response shapes) where applicable
- [ ] DB schema changes documented with migration approach
- [ ] Testing approach specified (unit, integration, E2E)
- [ ] All required layers specified (handler, use-case, repository, Live layer)
- [ ] Instructions are actionable and LLM-optimized (not verbose)
- [ ] Minimum 3 findings produced (or fast-path justified)
- [ ] Findings categorized (CRITICAL / HIGH / MEDIUM)
- [ ] Status updated according to gate outcome
- [ ] Sprint status synced (if sprint tracking enabled)

_Reviewer: {{user_name}} on {{date}}_
