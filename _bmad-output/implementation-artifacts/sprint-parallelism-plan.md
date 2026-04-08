# Sprint Parallelism Plan
Generated: 2026-04-04
Updated: 2026-04-08

## Phase 10: Product Completeness — Calibration & Accessibility

### Current Status

- Epic 45 complete: 9/9 stories done, retrospective done
- Epic 46 complete: 1/1 story done
- Epic 47 in progress: 1/5 stories done, 4 stories backlog

### Dependency Graph

```text
Epic 45 (Conversation Calibration) - complete
  45-1 Schema Migration
    ->
  45-2 Repo & Domain Renames
    ->
  45-3 Handler / Contract / Frontend Renames
    ->
  45-4 FK Column Migration
    ->
  45-5 FK Column Code Cascade
    ->
  45-6 Turn Count 25->15
    ->
  45-7 Dead Code Cleanup
    ->
  45-8 Deferred Cleanup
    ->
  45-9 File Rename Cascade

Epic 46 (Extension Cleanup) - complete
  46-1 Gate Extension & Remove UI Surface

Epic 47 (Accessibility) - active
  47-1 Skip Link & Semantic Landmarks (done)
  47-2 Conversation UI Accessibility
  47-3 Results Page & Portrait Accessibility
  47-4 Modal & Focus Management
  47-5 Touch Targets & Contrast Audit
```

### Remaining Work

| Story | Epic | Depends On | Can Run With |
|-------|------|------------|--------------|
| 47-2-conversation-ui-accessibility | 47 | None | 47-3, 47-4, 47-5 |
| 47-3-results-page-and-portrait-accessibility | 47 | None | 47-2, 47-4, 47-5 |
| 47-4-modal-and-focus-management | 47 | None | 47-2, 47-3, 47-5 |
| 47-5-touch-targets-and-contrast-audit | 47 | None | 47-2, 47-3, 47-4 |

All remaining Phase 10 stories are inside Epic 47 and can run in parallel.

### Sequencing Guidance

If one engineer is executing the remaining work serially:

1. 47-4-modal-and-focus-management
2. 47-2-conversation-ui-accessibility
3. 47-3-results-page-and-portrait-accessibility
4. 47-5-touch-targets-and-contrast-audit

Rationale: 47-4 and 47-2/47-3 change concrete interaction patterns, while 47-5 is a cross-cutting audit/pass best run after the structural accessibility work lands.

### Maximum Parallelism

At peak, **4 streams** can run simultaneously:

1. 47-2-conversation-ui-accessibility
2. 47-3-results-page-and-portrait-accessibility
3. 47-4-modal-and-focus-management
4. 47-5-touch-targets-and-contrast-audit

### Deferred Work

| Item | Reason |
|------|--------|
| Epic 6 (Privacy/GDPR) | Deferred to EU launch |
| Epic 20 (Evidence Review) | Deferred - messageId FK already in place |

## Summary

- **4 stories** remaining across **1 epic**
- **44 epics complete**, **1 epic in progress**
- **Critical path:** Epic 47 only; no cross-epic blockers remain
- **Blockers:** None
