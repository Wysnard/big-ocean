# Sprint Parallelism Plan
Generated: 2026-03-02 (refreshed 5 — post 18-4 merge)

> Only forward-looking stories (status != done). Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.

## Step 1: Kill FinAnalyzer & Portrait Update
| Story | Mode | Notes |
|-------|------|-------|
| 18-5-delete-finanalyzer-infrastructure | parallel | depends on 18-4 (done), blocks 20-1 — **READY** |
| 18-6-update-portrait-generators-to-use-conversation-evidence | parallel | depends on 18-4 (done) — **READY** |

**Gate:** All stories above must be done before proceeding.

## Step 2: Evidence Review API
| Story | Mode | Notes |
|-------|------|-------|
| 20-1-evidence-annotations-api-endpoint | parallel | depends on 18-5 |

**Gate:** All stories above must be done before proceeding.

## Step 3: Evidence Review UI + Navigation
| Story | Mode | Notes |
|-------|------|-------|
| 20-2-conversation-review-ui-with-inline-annotations | parallel | depends on 20-1; includes facet→conversation navigation (replaces removed 20-3) |

**Gate:** All stories above must be done before proceeding.

## Conflict Notes
- **Step 1 parallelism:** 18-5 and 18-6 touch separate subsystems (finanalyzer deletion vs portrait generators) — no shared file conflicts
- **Epic 20 chain** (Steps 2→3) is strictly sequential — API before UI
- **Story 20-3 removed** (correct-course 2026-03-02) — navigation absorbed into 20-2
- **Critical path:** 18-5 → 20-1 → 20-2 (3 stories remaining on longest chain)
- **Next actionable stories:** 18-5 + 18-6 — **both ready to start in parallel immediately**
