# Sprint Parallelism Plan
Generated: 2026-04-02

> Covers all forward-looking stories (not done).
> Phase 8: Scoring & Confidence v2 (Epics 40-42 + cleanup)
> Step 1 (40-1, 40-2) completed 2026-04-02.

## Step 1: Solo Migration + Territory Remap + Polarity Schema
| Story | Mode | Notes |
|-------|------|-------|
| 40-3-migrate-existing-solo-evidence-and-remove-solo-domain | parallel | Depends on 40-1, 40-2 (done). Remaps solo evidence to health/leisure, removes solo from TS constants. |
| 41-1-remap-existing-territory-domains-and-replace-identity-and-purpose | parallel | Depends on 40-1 (done). Touches territory-catalog.ts only — no conflict with 40-3 or 42-1. |
| 42-1-polarity-schema-database-migration-and-deviation-adapter | parallel | Depends on 40-1 (done). New polarity column + deriveDeviation function — no conflict with 40-3 or 41-1. |

**Gate:** All stories above must be done before proceeding.

## Step 2: New Territories + ConversAnalyzer Split
| Story | Mode | Notes |
|-------|------|-------|
| 41-2-add-6-new-territories | parallel | Depends on 41-1. Adds 6 new entries to territory-catalog.ts (25→31). |
| 42-2-split-conversanalyzer-into-two-separate-llm-calls | parallel | Depends on 42-1. Splits ConversAnalyzer repo into analyzeUserState + analyzeEvidence. No conflict with 41-2. |

**Gate:** All stories above must be done before proceeding.

## Step 3: Catalog Validation + Extraction Prompt
| Story | Mode | Notes |
|-------|------|-------|
| 41-3-facet-additions-to-existing-territories-and-catalog-validation | parallel | Depends on 41-2. Adds cautiousness→work-dynamics, liberalism→growing-up, validates all facets ≥2 routes across 31 territories. |
| 42-3-evidence-extraction-v3-prompt-with-per-facet-conversational-anchors | parallel | Depends on 42-2. Per-facet HIGH/LOW anchors for all 30 facets, dual-polarity check, polarity balance audit. |

**Gate:** All stories above must be done before proceeding.

## Step 4: Pipeline Integration
| Story | Mode | Notes |
|-------|------|-------|
| 42-4-pipeline-integration-wire-two-call-extraction-into-nerin-pipeline | parallel | Depends on 42-2, 42-3, 41-3. Wires two-call extraction into nerin-pipeline.ts, end-to-end integration. |

**Gate:** Must be done and all 3 Scoring v2 epics verified in production before proceeding.

## Step 5: Post-Implementation Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| cleanup-1-remove-solo-from-postgresql-enum | parallel | Removes unused solo value from pgEnum — requires type replacement, schedule during maintenance window. |

**Gate:** Production verification required before this step.

## Deferred Work (not scheduled)
| Epic | Stories | Reason |
|------|---------|--------|
| Epic 6 (Privacy/GDPR) | 6-1, 6-2, 6-3 | Deferred to EU launch |
| Epic 20 (Evidence Review) | 20-1, 20-2 | Deferred — messageId FK already in place |

## Conflict Notes
- **life-domain.ts** (domain): Touched by 40-3 (Step 1). No conflicts — 40-1 and 40-2 already merged.
- **schema.ts** (infrastructure): Touched by 42-1 (Step 1), 40-3 (Step 1). Both parallel in Step 1 but touch different columns/enums — safe.
- **territory-catalog.ts** (domain): Touched by 41-1 (Step 1), 41-2 (Step 2), 41-3 (Step 3). Spread across steps — no conflicts.
- **ConversAnalyzer infrastructure**: Touched by 42-2 (Step 2) and 42-3 (Step 3). Sequential across steps.
- **nerin-pipeline.ts**: Only touched by 42-4 in Step 4 — clean.

## Summary
- **5 steps** — 9 stories remaining (8 Scoring v2 + 1 cleanup)
- **Critical path:** 40-3/41-1/42-1 → 41-2/42-2 → 41-3/42-3 → 42-4 → cleanup-1
- **Max parallelism:** Step 1 (3 stories)
- **Epic 41 and Epic 42 are fully independent** — no shared file conflicts, parallelizable within each step
- **Next action:** Create story files for Step 1 stories (40-3, 41-1, 42-1) and begin orchestration
