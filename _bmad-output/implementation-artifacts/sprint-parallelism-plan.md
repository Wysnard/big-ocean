# Sprint Parallelism Plan
Generated: 2026-03-02 (refreshed 6 — post 18-5 & 18-6 merge)

> Only forward-looking stories (status != done). Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.

## Step 1: Evidence Review API
| Story | Mode | Notes |
|-------|------|-------|
| 20-1-evidence-annotations-api-endpoint | parallel | depends on 18-5 (done) — **READY** |

**Gate:** All stories above must be done before proceeding.

## Step 2: Evidence Review UI + Navigation
| Story | Mode | Notes |
|-------|------|-------|
| 20-2-conversation-review-ui-with-inline-annotations | parallel | depends on 20-1; includes facet→conversation navigation (replaces removed 20-3) |

**Gate:** All stories above must be done before proceeding.

## Conflict Notes
- **Epic 20 chain** (Steps 1→2) is strictly sequential — API before UI
- **Story 20-3 removed** (correct-course 2026-03-02) — navigation absorbed into 20-2
- **Critical path:** 20-1 → 20-2 (2 stories remaining on longest chain)
- **Next actionable story:** 20-1 — **ready to start immediately**
