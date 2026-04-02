# Sprint Parallelism Plan
Generated: 2026-04-02

> All Scoring v2 stories (Steps 1-2) completed and merged.
> Only post-implementation cleanup remains.

## Step 1: Post-Implementation Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| cleanup-1-remove-solo-from-postgresql-enum | parallel | Removes unused solo value from pgEnum — requires type replacement, schedule during maintenance window. |

**Gate:** All 3 Scoring v2 epics must be verified in production before executing.

## Deferred Work (not scheduled)
| Epic | Stories | Reason |
|------|---------|--------|
| Epic 6 (Privacy/GDPR) | 6-1, 6-2, 6-3 | Deferred to EU launch |
| Epic 20 (Evidence Review) | 20-1, 20-2 | Deferred — messageId FK already in place |

## Summary
- **1 step** — 1 story remaining (cleanup)
- **Critical path:** Verify Scoring v2 in production → cleanup-1
- **All implementation stories are complete.** Phase 8 is functionally done.
- **Next action:** Verify Scoring v2 epics (40, 41, 42) in production, then schedule cleanup-1 during maintenance window.
