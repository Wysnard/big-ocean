# User Story 2-9: Evidence-Sourced Scoring — Remove Materialized Score Tables

**Story ID:** 2-9
**Epic:** 2 - Assessment Backend Services
**Created:** 2026-02-10
**Priority:** Medium
**Status:** Ready for Development

---

## User Story

**As a** developer evolving the scoring algorithm
**I want** trait scores and facet scores computed on-demand from raw evidence
**So that** formula changes are instant code deploys with zero data migrations, backfills, or sync risks

---

## Problem Statement

### Current Pain Points

1. **Formula Coupling**: The scoring formula (recency weighting, variance penalty, confidence adjustment) is baked into two materialized tables (`facet_scores`, `trait_scores`). Any formula tweak requires re-running aggregation across all active sessions and hoping no reads happen during the transition window.

2. **Redundant Derivation Chain**: `trait_scores` is a pure derivation of `facet_scores` (sum 6 facets, min confidence). `facet_scores` is a pure derivation of `facet_evidence`. Two tables exist solely as caches of deterministic computations.

3. **Sync Risk**: If `facet_scores` updates but `trait_scores` doesn't (crash, partial failure), the system shows inconsistent data. The current code doesn't have transactional guarantees across both table writes.

4. **Repository Overhead**: Two repository interfaces (`FacetScoreRepository`, `TraitScoreRepository`), two Drizzle implementations, two mock files, two layer compositions — all for data that's derivable from evidence in milliseconds.

5. **Session Confidence JSONB**: `assessment_session.confidence` stores 30 facet confidence values as JSONB — yet another copy of data derivable from evidence.

### Root Cause

Premature materialization. Score tables were introduced as a persistence pattern before the evidence table existed. Now that `facet_evidence` stores every signal with full fidelity, the intermediate tables are redundant caches that add complexity without meaningful performance benefit.

---

## Solution Overview

### Architecture: Event-Sourced Scoring

**Core Principle:** `facet_evidence` is the single source of truth. All scores are projections computed on-demand.

**Target Data Flow:**

```
facet_evidence table (immutable event log)
         │
         ▼
FacetEvidenceRepository.getEvidenceBySession(sessionId)
         │
         ▼
Pure domain functions (no DB dependency):
  ├── aggregateFacetScores(evidence[]) → FacetScoresMap
  ├── deriveTraitScores(facetScoresMap) → TraitScoresMap
  └── generateOceanCode(facetScoresMap) → string  [already exists]
```

**Components:**

1. **Pure Scoring Functions** — `aggregateFacetScores()` and `deriveTraitScores()` move from infrastructure (Drizzle repository) to domain utils. They accept data, return data, no DB dependency.

2. **Evidence Repository** — `FacetEvidenceRepository.getEvidenceBySession()` becomes the sole data source for scoring. Already exists and is indexed.

3. **Simplified Use Cases** — `get-results` and `update-facet-scores` fetch evidence once, compute everything in-memory. No score repositories needed.

4. **Schema Migration** — Drop `facet_scores` table, `trait_scores` table, and `assessment_session.confidence` JSONB column.

### Performance Justification

Evidence volume per session: ~300-600 rows (30 facets × 10-20 evidence records).

The aggregation query (`GROUP BY facet_name` with weighted average) runs in single-digit milliseconds on PostgreSQL. This is invisible against the 1-3 second LLM latency that dominates every conversation turn.

The results page (post-assessment) has no real-time constraint — a 20-50ms computation is imperceptible.

---

## Acceptance Criteria

### Must Have

- [ ] **AC1: Drop Materialized Score Tables**
  - Migration drops `facet_scores` and `trait_scores` tables
  - Migration drops `assessment_session.confidence` JSONB column
  - Remove table definitions from `packages/infrastructure/src/db/drizzle/schema.ts`
  - Remove associated Drizzle relations
  - Existing `facet_evidence` table and indexes unchanged

- [ ] **AC2: Pure Domain Scoring Functions**
  - `aggregateFacetScores(evidence: SavedFacetEvidence[])` → `FacetScoresMap` exists in `packages/domain/src/utils/`
  - `deriveTraitScores(facetScores: FacetScoresMap)` → `TraitScoresMap` exists in `packages/domain/src/utils/`
  - Both are pure functions with zero infrastructure dependencies
  - Algorithm unchanged: recency-weighted averaging, variance penalty, min-confidence derivation
  - Unit testable with plain data (no Effect layers, no DB)

- [ ] **AC3: Delete Score Repositories**
  - Delete `packages/domain/src/repositories/facet-score.repository.ts` (interface)
  - Delete `packages/domain/src/repositories/trait-score.repository.ts` (interface)
  - Delete `packages/infrastructure/src/repositories/facet-score.drizzle.repository.ts` (implementation)
  - Delete `packages/infrastructure/src/repositories/trait-score.drizzle.repository.ts` (implementation)
  - Delete `packages/infrastructure/src/repositories/__mocks__/facet-score.drizzle.repository.ts`
  - Delete `packages/infrastructure/src/repositories/__mocks__/trait-score.drizzle.repository.ts`
  - Remove `FacetScoreDrizzleRepositoryLive` and `TraitScoreDrizzleRepositoryLive` from `packages/infrastructure/src/index.ts` exports
  - Remove from layer composition in `apps/api/src/index.ts`

- [ ] **AC4: Refactor ScorerRepository**
  - `ScorerRepository` interface updated: remove `aggregateFacetScores(sessionId)` and `deriveTraitScores(facetScores)` methods
  - If no methods remain, delete `ScorerRepository` entirely (interface + implementation + mock)
  - If retained, it should only contain methods that genuinely need DB access
  - `ScorerDrizzleRepositoryLive` in `packages/infrastructure/src/repositories/scorer.drizzle.repository.ts` updated or deleted accordingly

- [ ] **AC5: Refactor get-results Use Case**
  - `apps/api/src/use-cases/get-results.use-case.ts` no longer depends on `FacetScoreRepository` or `TraitScoreRepository`
  - Instead: fetches evidence via `FacetEvidenceRepository.getEvidenceBySession(sessionId)`, then calls pure `aggregateFacetScores()` and `deriveTraitScores()`
  - Output shape (`GetResultsOutput`) unchanged — API contract preserved
  - `mapScoreToLevel()`, `generateOceanCode()`, `lookupArchetype()` logic unchanged

- [ ] **AC6: Refactor update-facet-scores Use Case**
  - `apps/api/src/use-cases/update-facet-scores.use-case.ts` no longer writes to any score table
  - Becomes a compute-only function: fetches evidence, aggregates, derives, returns scores
  - Output shape (`UpdateFacetScoresOutput`) unchanged
  - `shouldTriggerScoring()` function unchanged

- [ ] **AC7: Refactor send-message / Orchestrator Flow**
  - Orchestrator still receives `facetScores` for steering — now computed from evidence on each turn
  - `apps/api/src/use-cases/send-message.use-case.ts` fetches evidence → computes facet scores → passes to orchestrator
  - Nerin still receives `facetScores` and `steeringHint` — no change to agent interfaces
  - Scoring cycle (every 3 messages) still runs Analyzer → saves evidence → computes scores (just doesn't persist scores to separate tables)

- [ ] **AC8: All Existing Tests Pass**
  - Update test files that mock `FacetScoreRepository` or `TraitScoreRepository` to use new patterns
  - Tests in `apps/api/src/use-cases/__tests__/` updated to reflect new dependencies
  - `vi.mock()` calls for deleted repositories removed
  - New unit tests for pure `aggregateFacetScores()` and `deriveTraitScores()` functions
  - `pnpm test:run` passes
  - `pnpm lint` passes
  - `pnpm build` succeeds

### Should Have

- [ ] **AC9: Update Type Documentation**
  - `FacetScore` and `TraitScore` interfaces in `packages/domain/src/types/facet-evidence.ts` updated
  - Remove references to "Storage: facet_scores table" and "Storage: trait_scores table" from JSDoc
  - Update to reflect "Computed on-demand from evidence"
  - `createInitialFacetScoresMap()` and `createInitialTraitScoresMap()` in `confidence.ts` reviewed — keep if still used as defaults, delete if no longer needed

- [ ] **AC10: Update CLAUDE.md and Architecture Docs**
  - `CLAUDE.md` scoring sections reflect evidence-sourced model
  - `docs/ARCHITECTURE.md` updated if it references score tables
  - Remove references to `FacetScoreRepository`, `TraitScoreRepository` from documentation

---

## Tasks / Subtasks

- [ ] **Task 1: Create Pure Scoring Functions** (AC: 2)
  - [ ] 1.1 Create `packages/domain/src/utils/scoring.ts` with `aggregateFacetScores(evidence[])` and `deriveTraitScores(facetScoresMap)`
  - [ ] 1.2 Extract `aggregateFacet()`, `sum()`, `mean()`, `variance()`, `clamp()` helpers from `scorer.drizzle.repository.ts`
  - [ ] 1.3 Write unit tests for pure functions (no Effect layers needed)
  - [ ] 1.4 Export from `packages/domain/src/index.ts`

- [ ] **Task 2: Refactor Use Cases** (AC: 5, 6, 7)
  - [ ] 2.1 Update `get-results.use-case.ts` — replace `FacetScoreRepository` + `TraitScoreRepository` with `FacetEvidenceRepository` + pure functions
  - [ ] 2.2 Update `update-facet-scores.use-case.ts` — remove DB writes, compute-only
  - [ ] 2.3 Update `send-message.use-case.ts` — compute facet scores from evidence before passing to orchestrator
  - [ ] 2.4 Update `create-shareable-profile.use-case.ts` if it references score repos
  - [ ] 2.5 Update `calculate-confidence.use-case.ts` if it references score repos

- [ ] **Task 3: Delete Score Repositories** (AC: 3, 4)
  - [ ] 3.1 Delete `FacetScoreRepository` interface and `TraitScoreRepository` interface from `packages/domain/src/repositories/`
  - [ ] 3.2 Delete `facet-score.drizzle.repository.ts` and `trait-score.drizzle.repository.ts` from infrastructure
  - [ ] 3.3 Delete corresponding `__mocks__/` files
  - [ ] 3.4 Refactor or delete `ScorerRepository` interface + `ScorerDrizzleRepositoryLive`
  - [ ] 3.5 Remove exports from `packages/infrastructure/src/index.ts`
  - [ ] 3.6 Remove from layer composition in `apps/api/src/index.ts` (lines 26, 31, 131, 133)
  - [ ] 3.7 Remove from `packages/domain/src/index.ts` exports

- [ ] **Task 4: Database Migration** (AC: 1)
  - [ ] 4.1 Generate Drizzle migration to drop `facet_scores` table
  - [ ] 4.2 Generate Drizzle migration to drop `trait_scores` table
  - [ ] 4.3 Generate Drizzle migration to drop `assessment_session.confidence` JSONB column
  - [ ] 4.4 Remove table definitions from `packages/infrastructure/src/db/drizzle/schema.ts` (lines 187-210, 249-272)
  - [ ] 4.5 Remove `confidence` column from `assessmentSession` definition (line 118)
  - [ ] 4.6 Update Drizzle relations if they reference dropped tables

- [ ] **Task 5: Update Tests** (AC: 8)
  - [ ] 5.1 Update `get-results.use-case.test.ts` — remove score repo mocks, add evidence fixtures
  - [ ] 5.2 Update `send-message.use-case.test.ts` — adjust layer composition
  - [ ] 5.3 Update `update-facet-scores.use-case.test.ts` — test pure computation
  - [ ] 5.4 Update `analyzer-scorer-integration.test.ts`
  - [ ] 5.5 Update `orchestrator-integration.test.ts`
  - [ ] 5.6 Update `nerin-steering-integration.test.ts`
  - [ ] 5.7 Update `shareable-profile.use-case.test.ts` if affected
  - [ ] 5.8 Run full test suite: `pnpm test:run`
  - [ ] 5.9 Run lint: `pnpm lint`
  - [ ] 5.10 Run build: `pnpm build`

- [ ] **Task 6: Update Documentation** (AC: 9, 10)
  - [ ] 6.1 Update type JSDoc in `packages/domain/src/types/facet-evidence.ts`
  - [ ] 6.2 Review `createInitialFacetScoresMap()` / `createInitialTraitScoresMap()` — delete or update
  - [ ] 6.3 Update `CLAUDE.md` scoring sections
  - [ ] 6.4 Update `docs/ARCHITECTURE.md` if applicable

---

## Dev Notes

### Architecture Decision: Why Evidence-Sourced

The scoring model is pre-PMF. The aggregation formula (recency weighting coefficients, variance thresholds, confidence adjustments) will change as we learn from real user data. With materialized score tables:

- Formula change = code change + backfill migration + stale data risk
- With evidence-only = code change, done

This follows **event sourcing** principles: evidence records are immutable events, scores are projections. Projections should always be re-derivable from events.

### Performance Analysis

| Operation | Current (table read) | Proposed (evidence aggregation) | Delta |
|-----------|---------------------|---------------------------------|-------|
| Facet scores for steering | ~2ms (indexed read) | ~10-20ms (aggregate ~300 rows) | +15ms |
| Results page | ~4ms (2 table reads) | ~15-25ms (aggregate + derive) | +18ms |
| LLM response latency | 1000-3000ms | 1000-3000ms | 0ms |
| **User-perceived impact** | — | — | **None** |

Evidence count per session: ~300-600 rows max (30 facets × 10-20 evidence records). PostgreSQL handles this with existing `facet_evidence_facet_name_idx` and `facet_evidence_assessment_message_id_idx` indexes.

### Data Flow: Before vs After

**Before (3 tables):**
```
Analyzer → facet_evidence → Scorer → facet_scores → deriveTraitScores → trait_scores
                                          ↓                                    ↓
                                   Router reads for steering          Results page reads
```

**After (1 table):**
```
Analyzer → facet_evidence → [on read] → aggregateFacetScores() → deriveTraitScores()
                                                ↓                        ↓
                                         Router steering          Results page
```

### Files Deleted (Complete List)

| File | Type |
|------|------|
| `packages/domain/src/repositories/facet-score.repository.ts` | Interface |
| `packages/domain/src/repositories/trait-score.repository.ts` | Interface |
| `packages/infrastructure/src/repositories/facet-score.drizzle.repository.ts` | Implementation |
| `packages/infrastructure/src/repositories/trait-score.drizzle.repository.ts` | Implementation |
| `packages/infrastructure/src/repositories/__mocks__/facet-score.drizzle.repository.ts` | Mock |
| `packages/infrastructure/src/repositories/__mocks__/trait-score.drizzle.repository.ts` | Mock |

### Files Modified (Key Changes)

| File | Change |
|------|--------|
| `packages/infrastructure/src/db/drizzle/schema.ts` | Remove `facetScores`, `traitScores` tables + `confidence` column |
| `packages/infrastructure/src/repositories/scorer.drizzle.repository.ts` | Refactor or delete |
| `packages/infrastructure/src/index.ts` | Remove exports |
| `packages/domain/src/index.ts` | Remove score repo exports, add scoring utils export |
| `apps/api/src/index.ts` | Remove score repo layers from composition |
| `apps/api/src/use-cases/get-results.use-case.ts` | Use evidence + pure functions |
| `apps/api/src/use-cases/update-facet-scores.use-case.ts` | Remove DB writes |
| `apps/api/src/use-cases/send-message.use-case.ts` | Compute from evidence |
| `packages/domain/src/utils/confidence.ts` | Review init functions |
| `packages/domain/src/types/facet-evidence.ts` | Update JSDoc |
| 6 test files in `apps/api/src/use-cases/__tests__/` | Update mocks and layers |

### New Files Created

| File | Purpose |
|------|---------|
| `packages/domain/src/utils/scoring.ts` | Pure `aggregateFacetScores()` + `deriveTraitScores()` |
| `packages/domain/src/utils/__tests__/scoring.test.ts` | Unit tests for pure scoring functions |
| Drizzle migration file | Drop tables + column |

### What Does NOT Change

- `facet_evidence` table — unchanged, becomes the star
- `FacetEvidenceRepository` — unchanged
- `generateOceanCode()` — already uses `FacetScoresMap`
- Evidence handlers (`apps/api/src/handlers/evidence.ts`) — unchanged
- Frontend components — receive same API response shape
- API contracts — `GetResultsOutput` shape unchanged

---

## Testing Strategy

| Test Type | What | How |
|-----------|------|-----|
| **Unit** | Pure scoring functions (`aggregateFacetScores`, `deriveTraitScores`) | Plain vitest, no Effect layers — pass data in, assert data out |
| **Unit (Effect)** | Use cases (`get-results`, `update-facet-scores`, `send-message`) | `it.effect()` with `FacetEvidenceRepository` mock layer |
| **Integration** | Full HTTP flow with scoring | Docker-based integration tests (existing Story 2-8 infrastructure) |

---

## Risks & Mitigations

### Risk: Evidence aggregation too slow for large sessions
**Mitigation:** Maximum evidence per session is ~600 rows (bounded by assessment length). PostgreSQL indexed aggregation over 600 rows is <20ms. If scale becomes an issue, add a PostgreSQL materialized view — no application code change needed.

### Risk: Seed data scripts reference score tables
**Mitigation:** Update `seed:test-assessment` script to only seed `facet_evidence` records. Scores will be computed on-demand when the results page loads.

### Risk: LangGraph checkpoint state references facet scores
**Mitigation:** The orchestrator graph state carries `facetScores` as a runtime value passed into `processMessage()`. This is computed before the call and never persisted to a score table. No checkpoint changes needed.

### Risk: Migration on existing production data
**Mitigation:** The dropped tables contain only derived data. No user data is lost. Evidence (the source of truth) is preserved. After migration, scores are re-computed from evidence on first read.

---

## Future Enhancements (Not in Scope)

- [ ] PostgreSQL materialized view for scoring if evidence volume grows beyond 1000+ per session
- [ ] Scoring formula A/B testing (evidence-sourced model makes this trivial — different formula functions, same data)
- [ ] Historical score snapshots for "how your personality evolved" feature
- [ ] Batch re-scoring endpoint for admin use after formula changes

---

## Related Documents

- **Party Mode Discussion:** Architecture decision made during multi-agent discussion (2026-02-10)
- **Architecture:** `docs/ARCHITECTURE.md` (hexagonal architecture, scoring flow)
- **Completed Story 2.3:** Evidence-based Analyzer and Scorer Implementation
- **Completed Story 5.1:** Display Assessment Results with Evidence-Based Scores

---

## Notes

**Key Design Decisions:**

- Evidence-sourced scoring follows event sourcing principles — evidence is the immutable event log, scores are projections
- Pure domain functions (no Effect, no DB) for scoring enables trivial unit testing and formula iteration
- The `ScorerRepository` abstraction likely gets deleted entirely — its methods become plain functions
- `createInitialFacetScoresMap()` may still be needed as a default initializer when no evidence exists (new session), but should be reviewed
- API contract and frontend are completely unaffected — this is a backend-only simplification

**Rationale:**

The scoring formula is expected to evolve as we validate with real users. Materialized score tables create friction for formula iteration (backfills, sync risks, stale data windows). With ~300-600 evidence records per session and 1-3 second LLM latency dominating every interaction, the computation cost of on-demand scoring is invisible. Removing two tables, two repository interfaces, two implementations, and two mock files is significant complexity reduction for a pre-PMF product.
