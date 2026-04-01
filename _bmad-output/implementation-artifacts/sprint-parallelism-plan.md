# Sprint Parallelism Plan
Generated: 2026-04-01

> Covers all forward-looking stories (not done).
> Phase 8: Scoring & Confidence v2 (Epics 40-42 + cleanup)

## Step 1: Health Domain Constants & Schema
| Story | Mode | Notes |
|-------|------|-------|
| 40-1-add-health-life-domain-to-constants-schemas-and-database | parallel | Foundation — adds health to LIFE_DOMAINS, LifeDomainSchema, STEERABLE_DOMAINS, pgEnum migration |
| 40-2-update-domain-definitions-and-assignment-guidance | sequential(after: 40-1) | Updates domain definition text in life-domain.ts — shares file with 40-1 |

**Gate:** All stories above must be done before proceeding.

## Step 2: Solo Migration + Territory Remap + Polarity Schema
| Story | Mode | Notes |
|-------|------|-------|
| 40-3-migrate-existing-solo-evidence-and-remove-solo-domain | parallel | Depends on 40-1, 40-2. Remaps solo evidence to health/leisure, removes solo from TS constants. |
| 41-1-remap-existing-territory-domains-and-replace-identity-and-purpose | parallel | Depends on 40-1. Touches territory-catalog.ts only — no conflict with 40-3 or 42-1. |
| 42-1-polarity-schema-database-migration-and-deviation-adapter | parallel | Depends on 40-1. New polarity column + deriveDeviation function — no conflict with 40-3 or 41-1. |

**Gate:** All stories above must be done before proceeding.

## Step 3: New Territories + ConversAnalyzer Split
| Story | Mode | Notes |
|-------|------|-------|
| 41-2-add-6-new-territories | parallel | Depends on 41-1. Adds 6 new entries to territory-catalog.ts (25→31). |
| 42-2-split-conversanalyzer-into-two-separate-llm-calls | parallel | Depends on 42-1. Splits ConversAnalyzer repo into analyzeUserState + analyzeEvidence. No conflict with 41-2. |

**Gate:** All stories above must be done before proceeding.

## Step 4: Catalog Validation + Extraction Prompt
| Story | Mode | Notes |
|-------|------|-------|
| 41-3-facet-additions-to-existing-territories-and-catalog-validation | parallel | Depends on 41-2. Adds cautiousness→work-dynamics, liberalism→growing-up, validates all facets ≥2 routes across 31 territories. |
| 42-3-evidence-extraction-v3-prompt-with-per-facet-conversational-anchors | parallel | Depends on 42-2. Per-facet HIGH/LOW anchors for all 30 facets, dual-polarity check, polarity balance audit. |

**Gate:** All stories above must be done before proceeding.

## Step 5: Pipeline Integration
| Story | Mode | Notes |
|-------|------|-------|
| 42-4-pipeline-integration-wire-two-call-extraction-into-nerin-pipeline | parallel | Depends on 42-2, 42-3, 41-3. Wires two-call extraction into nerin-pipeline.ts, end-to-end integration. |

**Gate:** Must be done and all 3 Scoring v2 epics verified in production before proceeding.

## Step 6: Post-Implementation Cleanup
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
- **life-domain.ts** (domain): Touched by 40-1 (Step 1), 40-2 (Step 1 sequential), 40-3 (Step 2). Spread across steps — no conflicts.
- **schema.ts** (infrastructure): Touched by 40-1 (Step 1), 42-1 (Step 2), 40-3 (Step 2). 40-3 and 42-1 are parallel in Step 2 but touch different columns/enums — safe.
- **territory-catalog.ts** (domain): Touched by 41-1 (Step 2), 41-2 (Step 3), 41-3 (Step 4). Spread across steps — no conflicts.
- **ConversAnalyzer infrastructure**: Touched by 42-2 (Step 3) and 42-3 (Step 4). Sequential across steps.
- **nerin-pipeline.ts**: Only touched by 42-4 in Step 5 — clean.

## Summary
- **6 steps** — 11 stories remaining (10 Scoring v2 + 1 cleanup)
- **Critical path:** 40-1 → 40-2 → 40-3/41-1/42-1 → 41-2/42-2 → 41-3/42-3 → 42-4 → cleanup-1
- **Max parallelism:** Step 2 (3 stories)
- **Epic 41 and Epic 42 are fully independent** — no shared file conflicts, parallelizable within each step
