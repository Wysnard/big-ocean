# Sprint Parallelism Plan
Generated: 2026-03-02 (refreshed 3 — post 18-2 merge)

> Only forward-looking stories (status != done). Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.

## Step 1: Evidence Budget & Cap
| Story | Mode | Notes |
|-------|------|-------|
| 18-3-rolling-evidence-budget-and-cap-enforcement | parallel | depends on 18-2 (done) — **READY** |

**Gate:** All stories above must be done before proceeding.

## Step 2: Finalization Pipeline Rewrite
| Story | Mode | Notes |
|-------|------|-------|
| 18-4-rewrite-finalization-pipeline-with-staged-idempotency | parallel | depends on 18-3 |

**Gate:** All stories above must be done before proceeding.

## Step 3: Kill FinAnalyzer & Portrait Update
| Story | Mode | Notes |
|-------|------|-------|
| 18-5-delete-finanalyzer-infrastructure | parallel | depends on 18-4, blocks 20-1 |
| 18-6-update-portrait-generators-to-use-conversation-evidence | parallel | depends on 18-4 |

**Gate:** All stories above must be done before proceeding.

## Step 4: Evidence Review API
| Story | Mode | Notes |
|-------|------|-------|
| 20-1-evidence-annotations-api-endpoint | parallel | depends on 18-5 |

**Gate:** All stories above must be done before proceeding.

## Step 5: Evidence Review UI + Navigation
| Story | Mode | Notes |
|-------|------|-------|
| 20-2-conversation-review-ui-with-inline-annotations | parallel | depends on 20-1; includes facet→conversation navigation (replaces removed 20-3) |

**Gate:** All stories above must be done before proceeding.

## Conflict Notes
- **Epic 18 chain** (Steps 1→2→3) is strictly sequential due to shared evidence schema, formula functions, and finalization pipeline
- **Step 3 parallelism:** 18-5 and 18-6 touch separate subsystems (finanalyzer deletion vs portrait generators) — no shared file conflicts
- **Epic 20 chain** (Steps 4→5) is strictly sequential — API before UI
- **Story 20-3 removed** (correct-course 2026-03-02) — navigation absorbed into 20-2
- **Critical path:** 18-3 → 18-4 → 18-5 → 20-1 → 20-2 (5 stories remaining on longest chain)
- **Next actionable story:** 18-3 (Rolling Evidence Budget and Cap Enforcement) — **ready to start immediately**
