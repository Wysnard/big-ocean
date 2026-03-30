# Sprint Parallelism Plan
Generated: 2026-03-30

> Covers all forward-looking stories (not done).
> Phase 7 residual (Epic 37) + Phase 8: Scoring & Confidence v2

## Step 1: Homepage Narrative Restructure (Phase 7 residual)
| Story | Mode | Notes |
|-------|------|-------|
| 37-3-homepage-narrative-restructure-and-hero-redesign | parallel | Epic 37 — Compress 14→8 beats, new hero, portrait at 33%, Nerin depth preview, PWYW. Homepage frontend only. |

**Gate:** Must be done before proceeding to Step 2.

## Step 2: Homepage Conversion Polish + Health Domain Foundation
| Story | Mode | Notes |
|-------|------|-------|
| 37-4-how-it-works-archetype-gallery-and-conversion-flow | parallel | Epic 37 — Depends on 37-3 (shares homepage route). Frontend only, no conflict with backend stories. |
| 40-1-add-health-life-domain-to-constants-schemas-and-database | parallel | Epic 40 — No dependencies. Adds health to LIFE_DOMAINS, LifeDomainSchema, STEERABLE_DOMAINS, pgEnum migration. Backend only. |
| 40-2-update-domain-definitions-and-assignment-guidance | parallel | Epic 40 — No dependencies. Updates domain definition text in life-domain.ts and extraction prompt references. Backend only. |

**Gate:** All stories above must be done before proceeding.

## Step 3: Solo Migration + Territory Remap + Polarity Schema
| Story | Mode | Notes |
|-------|------|-------|
| 40-3-migrate-existing-solo-evidence-and-remove-solo-domain | parallel | Depends on 40-1, 40-2. Remaps solo evidence to health/leisure, removes solo from TS constants. |
| 41-1-remap-existing-territory-domains-and-replace-identity-and-purpose | parallel | Depends on 40-1. Touches territory-catalog.ts only — no conflict with 40-3. |
| 42-1-polarity-schema-database-migration-and-deviation-adapter | parallel | Depends on 40-1. New polarity column + deriveDeviation function — no conflict with 40-3 or 41-1. |

**Gate:** All stories above must be done before proceeding.

## Step 4: New Territories + ConversAnalyzer Split
| Story | Mode | Notes |
|-------|------|-------|
| 41-2-add-6-new-territories | parallel | Depends on 41-1. Adds 6 new entries to territory-catalog.ts. |
| 42-2-split-conversanalyzer-into-two-separate-llm-calls | parallel | Depends on 42-1. Splits ConversAnalyzer repo into analyzeUserState + analyzeEvidence. No conflict with 41-2. |

**Gate:** All stories above must be done before proceeding.

## Step 5: Facet Anchors Prompt + Catalog Validation
| Story | Mode | Notes |
|-------|------|-------|
| 42-3-evidence-extraction-v3-prompt-with-per-facet-conversational-anchors | parallel | Depends on 42-2 (new evidence call must exist). Per-facet HIGH/LOW anchors, dual-polarity check, balance audit. |
| 41-3-facet-additions-to-existing-territories-and-catalog-validation | parallel | Depends on 41-2 (full 31-territory catalog). Adds cautiousness→work-dynamics, liberalism→growing-up, validates all facets ≥2 routes. |

**Gate:** All stories above must be done before proceeding.

## Step 6: Pipeline Integration
| Story | Mode | Notes |
|-------|------|-------|
| 42-4-pipeline-integration-wire-two-call-extraction-into-nerin-pipeline | parallel | Depends on 42-2, 42-3, 41-3 (both calls + prompt + validated catalog). Wires two-call extraction into nerin-pipeline.ts. |

**Gate:** Must be done before post-implementation cleanup.

## Step 7: Post-Implementation Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| cleanup-1-remove-solo-from-postgresql-enum | parallel | Run after all 3 Scoring v2 epics verified in production. Requires pgEnum type replacement (maintenance window). |

**Gate:** Production verification required before this step.

## Deferred Work (not scheduled)
| Epic | Stories | Reason |
|------|---------|--------|
| Epic 6 (Privacy/GDPR) | 6-1, 6-2, 6-3 | Deferred to EU launch |
| Epic 20 (Evidence Review) | 20-1, 20-2 | Deferred — messageId FK already in place |

## Conflict Notes
- **schema.ts** (infrastructure): Touched by 40-1 (health enum, Step 2), 40-3 (solo migration, Step 3), 42-1 (polarity column, Step 3). 40-3 and 42-1 are parallel in Step 3 but touch different columns/enums — safe.
- **territory-catalog.ts** (domain): Touched by 41-1 (remap, Step 3), 41-2 (new territories, Step 4), 41-3 (facet additions, Step 5). Spread across steps — no conflicts.
- **ConversAnalyzer infrastructure**: Touched by 42-2 (split calls, Step 4) and 42-3 (new prompt, Step 5). Sequential across steps.
- **nerin-pipeline.ts**: Only touched by 42-4 in Step 6 — clean.
- **37-3/37-4 vs backend stories**: Frontend-only (homepage route) vs backend-only (domain/infrastructure packages) — fully parallel in Step 2.

## Summary
- **7 steps** — 13 stories remaining (2 homepage + 10 Scoring v2 + 1 cleanup)
- **Critical path:** 37-3 → 37-4 (frontend) and 40-1/40-2 → 40-3/41-1/42-1 → 41-2/42-2 → 42-3/41-3 → 42-4 (backend)
- **Max parallelism:** Step 2 (3 stories), Step 3 (3 stories)
- **Frontend/backend independence:** Homepage stories (37-3, 37-4) run alongside Scoring v2 backend work
