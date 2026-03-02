# Sprint Parallelism Plan
Generated: 2026-03-02 (refreshed)

> Only forward-looking stories (status != done). Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.

## Step 1: Evidence v2 Scoring
| Story | Mode | Notes |
|-------|------|-------|
| 18-2-rewrite-compute-facet-metrics-for-evidence-v2 | parallel | depends on 18-1 (done) — ready |

**Gate:** All stories above must be done before proceeding.

## Step 2: Evidence Budget & Cap
| Story | Mode | Notes |
|-------|------|-------|
| 18-3-rolling-evidence-budget-and-cap-enforcement | parallel | depends on 18-2 |

**Gate:** All stories above must be done before proceeding.

## Step 3: Finalization Pipeline Rewrite
| Story | Mode | Notes |
|-------|------|-------|
| 18-4-rewrite-finalization-pipeline-with-staged-idempotency | parallel | depends on 18-3 |

**Gate:** All stories above must be done before proceeding.

## Step 4: Kill FinAnalyzer & Portrait Update
| Story | Mode | Notes |
|-------|------|-------|
| 18-5-delete-finanalyzer-infrastructure | parallel | depends on 18-4, blocks 20-1 |
| 18-6-update-portrait-generators-to-use-conversation-evidence | parallel | depends on 18-4 |

**Gate:** All stories above must be done before proceeding.

## Step 5: Evidence Review API
| Story | Mode | Notes |
|-------|------|-------|
| 20-1-evidence-annotations-api-endpoint | parallel | depends on 18-5 |

**Gate:** All stories above must be done before proceeding.

## Step 6: Evidence Review UI
| Story | Mode | Notes |
|-------|------|-------|
| 20-2-conversation-review-ui-with-inline-annotations | parallel | depends on 20-1 |

**Gate:** All stories above must be done before proceeding.

## Step 7: Evidence Panel Navigation
| Story | Mode | Notes |
|-------|------|-------|
| 20-3-evidence-panel-with-bidirectional-navigation | parallel | depends on 20-2 |

**Gate:** All stories above must be done before proceeding.

## Conflict Notes
- **Epic 18 chain** (Steps 1→2→3→4) is strictly sequential due to shared evidence schema, formula functions, and finalization pipeline
- **Step 4 parallelism:** 18-5 and 18-6 touch separate subsystems (finanalyzer deletion vs portrait generators) — no shared file conflicts
- **Epic 20 chain** (Steps 5→6→7) is strictly sequential — each builds on the previous
- **Critical path:** 18-2 → 18-3 → 18-4 → 18-5 → 20-1 → 20-2 → 20-3 (7 stories, longest chain)
- **Next actionable story:** 18-2 (rewrite computeFacetMetrics for Evidence v2) — ready to start immediately
