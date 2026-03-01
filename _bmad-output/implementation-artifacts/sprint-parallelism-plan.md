# Sprint Parallelism Plan
Generated: 2026-03-01 (refreshed)

> Only forward-looking stories (status != done). Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.

## Step 1: Remaining Epic 16 + Independent Starts
| Story | Mode | Notes |
|-------|------|-------|
| 16-2-delete-legacy-scoring-system | parallel | depends on 16-1 (done) — blocks nothing |
| 17-2-micro-intent-realizer | sequential(after: 17-3) | depends on 17-1 (done) + 17-3 |
| 17-3-domain-streak-computation-and-conversanalyzer-retry-bump | parallel | ready-for-dev, no blocking deps |
| 18-1-evidence-v2-schema-and-conversanalyzer-prompt-update | parallel | ready-for-dev, blocks 18-2 |
| 19-2-portrait-telemetry-placeholder | parallel | depends on 19-1 (done) — ready to execute |

**Gate:** All stories above must be done before proceeding.

## Step 2: Evidence v2 Scoring
| Story | Mode | Notes |
|-------|------|-------|
| 18-2-rewrite-compute-facet-metrics-for-evidence-v2 | parallel | depends on 18-1 |

**Gate:** All stories above must be done before proceeding.

## Step 3: Evidence Budget & Cap
| Story | Mode | Notes |
|-------|------|-------|
| 18-3-rolling-evidence-budget-and-cap-enforcement | parallel | depends on 18-1, 18-2 |

**Gate:** All stories above must be done before proceeding.

## Step 4: Finalization Pipeline Rewrite
| Story | Mode | Notes |
|-------|------|-------|
| 18-4-rewrite-finalization-pipeline-with-staged-idempotency | parallel | depends on 18-1, 18-2, 18-3 |

**Gate:** All stories above must be done before proceeding.

## Step 5: Kill FinAnalyzer & Portrait Update
| Story | Mode | Notes |
|-------|------|-------|
| 18-5-delete-finanalyzer-infrastructure | parallel | depends on 18-4, blocks 20-1 |
| 18-6-update-portrait-generators-to-use-conversation-evidence | parallel | depends on 18-4 |

**Gate:** All stories above must be done before proceeding.

## Step 6: Evidence Review API
| Story | Mode | Notes |
|-------|------|-------|
| 20-1-evidence-annotations-api-endpoint | parallel | depends on 18-5 |

**Gate:** All stories above must be done before proceeding.

## Step 7: Evidence Review UI
| Story | Mode | Notes |
|-------|------|-------|
| 20-2-conversation-review-ui-with-inline-annotations | parallel | depends on 20-1 |

**Gate:** All stories above must be done before proceeding.

## Step 8: Evidence Panel Navigation
| Story | Mode | Notes |
|-------|------|-------|
| 20-3-evidence-panel-with-bidirectional-navigation | parallel | depends on 20-2 |

**Gate:** All stories above must be done before proceeding.

## Conflict Notes
- **Step 1 parallelism:** 16-2, 17-3, 18-1, and 19-2 touch separate subsystems (scoring, steering, evidence, portraits) — no shared file conflicts
- **17-2 depends on 17-3:** Micro-intent realizer needs `computeDomainStreak()` from 17-3
- **Epic 18 chain** (Steps 1→2→3→4→5) is strictly sequential due to shared evidence schema, formula functions, and finalization pipeline
- **Epic 20 chain** (Steps 6→7→8) is strictly sequential — each builds on the previous
- **Epics 16, 17, 19** complete by end of Step 1 — fast wins
- **Critical path:** 18-1 → 18-2 → 18-3 → 18-4 → 18-5 → 20-1 → 20-2 → 20-3 (8 stories, longest chain)
