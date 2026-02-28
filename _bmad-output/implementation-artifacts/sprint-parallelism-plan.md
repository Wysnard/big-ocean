# Sprint Parallelism Plan
Generated: 2026-03-01 (refreshed)

> Only forward-looking stories (status != done). Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.

## Step 1: Foundation — Scoring Consolidation, Steering Tuning, Dead Code, Independent Starts

| Story | Mode | Notes |
|-------|------|-------|
| 16-1-migrate-display-use-cases-to-read-persisted-results | parallel | No dependencies, blocks 16-2 |
| 16-3-tune-steering-parameters-and-add-observability | parallel | No dependencies |
| 16-4-dead-code-cleanup | parallel | No dependencies |
| 17-1-all-30-facets-steering-with-ocean-round-robin-tiebreaker | parallel | No dependencies, blocks 17-2 |
| 17-3-domain-streak-computation-and-conversanalyzer-retry-bump | parallel | No dependencies, blocks 17-2 |
| 18-1-evidence-v2-schema-and-conversanalyzer-prompt-update | parallel | No dependencies, blocks 18-2 |
| 19-1-remove-quote-constraint-from-portrait-prompts | parallel | No dependencies, blocks 19-2 |

**Gate:** All stories above must be done before proceeding.

## Step 2: Consumers of Step 1 — Legacy Deletion, Micro-Intent, Metrics Rewrite, Telemetry

| Story | Mode | Notes |
|-------|------|-------|
| 16-2-delete-legacy-scoring-system | parallel | depends on 16-1 |
| 17-2-micro-intent-realizer | parallel | depends on 17-1, 17-3 |
| 18-2-rewrite-compute-facet-metrics-for-evidence-v2 | parallel | depends on 18-1 |
| 19-2-portrait-telemetry-placeholder | parallel | depends on 19-1 |

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
- **Step 1** has 7 parallel stories touching different subsystems — no shared file conflicts expected
- **Epic 18 chain** (Steps 1→2→3→4→5) is strictly sequential due to shared evidence schema, formula functions, and finalization pipeline
- **Epic 20 chain** (Steps 6→7→8) is strictly sequential — each builds on the previous
- **Epics 16, 17, 19** complete by end of Step 2 — fast wins
- **Critical path:** 18-1 → 18-2 → 18-3 → 18-4 → 18-5 → 20-1 → 20-2 → 20-3 (8 steps, longest chain)
