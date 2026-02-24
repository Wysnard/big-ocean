# Story 11.3: Score Computation & OCEAN Code Generation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want accurate personality scores computed from all finalization evidence,
So that my Big Five profile reflects the full assessment and I receive my OCEAN archetype code.

## Acceptance Criteria

1. **Given** finalization_evidence exists for a session **When** Phase 2 of finalization computes scores **Then** facet scores are calculated from finalization_evidence using `computeFacetMetrics()` formula functions (FR5.2, FR6) **And** all 30 facet results (score, confidence, signalPower) are stored in the `assessment_results.facets` JSONB column

2. **Given** 30 facet scores are computed **When** trait scores are derived **Then** each of the 5 trait scores is the average of its 6 contributing facets via `FACET_TO_TRAIT` / `TRAIT_TO_FACETS` lookup (FR6) **And** trait confidence is the mean across contributing facet confidences (FR7) **And** trait signalPower is the mean across contributing facet signalPowers

3. **Given** 30 facet scores exist **When** the OCEAN code is generated **Then** `generateOceanCode()` produces a deterministic 5-letter code from facet scores (FR8, NFR10) **And** the OCEAN code is returned in the finalization result (not stored separately — derived on demand)

4. **Given** domain coverage is computed from finalization evidence **When** results are stored **Then** `assessment_results.domainCoverage` contains a normalized distribution `Record<LifeDomain, number>` summing to ~1.0

5. **Given** the Phase 1 placeholder `assessment_results` row exists **When** Phase 2 completes score computation **Then** the placeholder row is UPDATED (not a new INSERT) with computed facets, traits, and domainCoverage

6. **Given** finalization evidence exists but contains zero records for some facets **When** scores are computed **Then** missing facets receive defaults: score = `SCORE_MIDPOINT` (10), confidence = 0, signalPower = 0

7. **Given** Phase 2 completes successfully **When** the session transitions **Then** `finalizationProgress` is set to `"generating_portrait"` before scoring, then `"completed"` after **And** the session status becomes `"completed"`

## Tasks / Subtasks

- [x] Task 1: Add `update` method to AssessmentResultRepository (AC: #5)
  - [x] 1.1: Add to `packages/domain/src/repositories/assessment-result.repository.ts`:
    - Add `AssessmentResultUpdateInput` type: `Partial<Pick<AssessmentResultInput, "facets" | "traits" | "domainCoverage" | "portrait">>` — allows updating any subset of computed fields
    - Add `update(id: string, input: AssessmentResultUpdateInput): Effect.Effect<AssessmentResultRecord, AssessmentResultError>` to the repository interface
  - [x] 1.2: Implement in `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts`:
    - `UPDATE assessment_results SET ... WHERE id = ?` using Drizzle's `.set()` — only update provided fields
    - Return the updated record
  - [x] 1.3: Update mock `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts`:
    - Add `update` to the in-memory mock — merge input into stored record, return updated

- [x] Task 2: Create score computation pure functions (AC: #1, #2, #4, #6)
  - [x] 2.1: Create `packages/domain/src/utils/score-computation.ts`:
    - `computeAllFacetResults(evidence: EvidenceInput[]): Record<FacetName, { score: number; confidence: number; signalPower: number }>`:
      - Call `computeFacetMetrics(evidence)` from existing `formula.ts`
      - For ALL 30 facets (iterate `ALL_FACETS`): if metrics exist, extract score/confidence/signalPower; if missing, use defaults (SCORE_MIDPOINT, 0, 0)
      - Return complete Record with all 30 facets
    - `computeTraitResults(facets: Record<FacetName, { score: number; confidence: number; signalPower: number }>): Record<TraitName, { score: number; confidence: number; signalPower: number }>`:
      - For each trait in `TRAIT_NAMES`: average the score, confidence, and signalPower of its 6 facets via `TRAIT_TO_FACETS[trait]`
      - Return complete Record with all 5 traits
    - `computeDomainCoverage(evidence: EvidenceInput[]): Record<LifeDomain, number>`:
      - Count evidence records per domain
      - Normalize to sum = 1.0 (each domain / total)
      - If zero evidence, return all zeros
  - [x] 2.2: Export from `packages/domain/src/index.ts`

- [x] Task 3: Unit tests for score computation (AC: #1, #2, #4, #6)
  - [x] 3.1: Create `packages/domain/src/utils/__tests__/score-computation.test.ts`:
    - **computeAllFacetResults:** empty evidence → all 30 facets at defaults; single-facet evidence → correct score + defaults for other 29; multi-domain evidence → correctly weighted scores
    - **computeTraitResults:** uniform facets → trait score = facet score; mixed facets → trait = average; zero-confidence facets → trait confidence = 0
    - **computeDomainCoverage:** empty → all zeros; single domain → 1.0; balanced 3 domains → ~0.33 each; includes "other" domain

- [x] Task 4: Implement Phase 2 in generate-results use-case (AC: #1-7)
  - [x] 4.1: Replace the Phase 2 placeholder in `apps/api/src/use-cases/generate-results.use-case.ts`:
    - After Phase 1 (evidence saved or Guard 2 skipped):
    - Fetch finalization evidence: `yield* finalizationEvidenceRepo.getByResultId(assessmentResultId)`
      - **Note:** Need the `assessmentResultId` — in the happy path it's `assessmentResult.id` from Phase 1. In the Guard 2 path (evidence exists), fetch it via `yield* assessmentResultRepo.getBySessionId(input.sessionId)` and use that id
    - Map `FinalizationEvidenceRecord[]` to `EvidenceInput[]` (pick `bigfiveFacet`, `score`, `confidence`, `domain`)
    - Call `computeAllFacetResults(evidenceInputs)` → facets
    - Call `computeTraitResults(facets)` → traits
    - Call `computeDomainCoverage(evidenceInputs)` → domainCoverage
    - Update the assessment_results row: `yield* assessmentResultRepo.update(assessmentResultId, { facets, traits, domainCoverage })`
    - Log: "Phase 2 complete: scores computed", including facet count with evidence, trait scores summary
  - [x] 4.2: Fix the assessmentResultId flow for the Guard 2 path:
    - When Guard 2 fires (evidence exists, FinAnalyzer skipped), the `assessmentResult` variable doesn't exist yet
    - Fetch it: `const existingResult = yield* assessmentResultRepo.getBySessionId(input.sessionId)`
    - Use `existingResult.id` as `assessmentResultId` for Phase 2
    - If somehow no result exists (data corruption), fail with `AssessmentResultError`
  - [x] 4.3: Keep progress updates:
    - `finalizationProgress = "generating_portrait"` set BEFORE Phase 2 scoring (already in code)
    - Phase 2 scoring happens between "generating_portrait" and "completed"
    - After scoring: session status → "completed", finalizationProgress → "completed" (already in code)

- [x] Task 5: Unit tests for Phase 2 in generate-results (AC: all)
  - [x] 5.1: Update `apps/api/src/use-cases/__tests__/generate-results.use-case.test.ts`:
    - **New test: Phase 2 happy path** — evidence exists → scores computed → assessment_results updated with facets/traits/domainCoverage → session completed
    - **New test: Phase 2 with Guard 2** — evidence pre-exists from previous attempt → FinAnalyzer skipped → scores still computed correctly from existing evidence → assessment_results updated
    - **New test: all 30 facets populated** — verify the assessment_results.facets has entries for all 30 facets from `ALL_FACETS`, even if only a subset have real evidence (rest are defaults)
    - **New test: trait derivation** — verify each trait's score is the mean of its 6 facets' scores
    - **New test: domain coverage normalization** — verify domainCoverage values sum to ~1.0
    - **New test: empty evidence edge case** — zero finalization evidence records → all facets at defaults, all traits at defaults, domainCoverage all zeros → assessment_results still updated (valid result)
    - **Preserve all existing tests** — Phase 1 tests, Guard 1, Guard 2 (idempotency), concurrent lock, FinAnalyzer failure, etc. must continue passing

## Dev Notes

### What's Already Implemented (Verify, Don't Rebuild)

| Component | Status | Location |
|-----------|--------|----------|
| `computeFacetMetrics()` | Done | `packages/domain/src/utils/formula.ts` |
| `FORMULA_DEFAULTS` (frozen) | Done | `packages/domain/src/utils/formula.ts` |
| `FACET_TO_TRAIT` / `TRAIT_TO_FACETS` | Done | `packages/domain/src/constants/big-five.ts` |
| `ALL_FACETS` (30 facets), `TRAIT_NAMES` (5 traits) | Done | `packages/domain/src/constants/big-five.ts` |
| `LIFE_DOMAINS` (6 domains), `LifeDomain` type | Done | `packages/domain/src/constants/life-domain.ts` |
| `SCORE_MIDPOINT = 10` | Done | `packages/domain/src/utils/formula.ts` → `FORMULA_DEFAULTS.SCORE_MIDPOINT` |
| `EvidenceInput` type | Done | `packages/domain/src/types/evidence.ts` |
| `generateOceanCode()` | Done | `packages/domain/src/utils/ocean-code-generator.ts` |
| `FinalizationEvidenceRepository.getByResultId()` | Done | `packages/domain/src/repositories/finalization-evidence.repository.ts` |
| `AssessmentResultRepository.create()` / `getBySessionId()` | Done | `packages/domain/src/repositories/assessment-result.repository.ts` |
| `generate-results.use-case.ts` with Phase 1 complete | Done | `apps/api/src/use-cases/generate-results.use-case.ts` |
| Phase 2 placeholder (lines 213-223) | Done — **replace this** | `apps/api/src/use-cases/generate-results.use-case.ts` |
| Mock for AssessmentResult repo | Done | `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts` |
| Mock for FinalizationEvidence repo | Done | `packages/infrastructure/src/repositories/__mocks__/finalization-evidence.drizzle.repository.ts` |
| `FacetScore` type (used by ocean-code-generator) | Done | `packages/domain/src/types/facet-evidence.ts` |

### Critical Architecture Constraints

- **`computeFacetMetrics()` already exists** — it takes `EvidenceInput[]` and returns `Map<FacetName, FacetMetrics>`. `FacetMetrics` = `{ score, confidence, signalPower, domainWeights }`. The new `computeAllFacetResults()` wraps this to ensure all 30 facets are in the output (filling defaults for missing facets).
- **`assessment_results.facets` JSONB shape:** `Record<FacetName, { score: number; confidence: number }>` — the current type does NOT include `signalPower`. **Decision: add `signalPower` to the JSONB shape** by updating `AssessmentResultRecord` and `AssessmentResultInput` types. This is a JSONB column so no DB migration needed — just update the TypeScript types.
- **`assessment_results.traits` JSONB shape:** Same update — add `signalPower` alongside `score` and `confidence`.
- **OCEAN code is NOT stored** in `assessment_results` — it's derived on read via `generateOceanCode()`. The `get-results` use-case already handles this.
- **Phase 1 creates a placeholder row with empty facets/traits/domainCoverage.** Phase 2 UPDATES that row. Need `update()` method on `AssessmentResultRepository` (currently only has `create` and `getBySessionId`).
- **Guard 2 flow:** When finalization evidence already exists (retry scenario), Phase 1 is skipped but Phase 2 must still run. The `assessmentResultId` must be fetched via `getBySessionId()` since the `create()` call was skipped.
- **`finalizationToEvidenceInput` mapper** exists at `packages/domain/src/utils/evidence-mapper.ts` — use it to convert `FinalizationEvidenceRecord` → `EvidenceInput` for formula input. Check if it exists; if not, the structural typing means you can just pick the 4 fields directly.
- **Domain coverage normalization:** Count evidence per domain, divide by total. Include all 6 domains in output even if some are 0.
- **No portrait generation in this story** — portrait field stays as empty string `""`. Story 11.4/11.5 will handle archetype lookup and portrait. The `generateOceanCode()` call can happen in this story's scoring logic for logging/verification, but the code itself is derived on read.

### Previous Story (11.2) Intelligence

Key learnings from Story 11.2:
- **Mock deferred side effects:** Use `Effect.sync()` in mock implementations to defer side effects — enables retry testing
- **Import ordering:** `vi` from `vitest` FIRST, then `vi.mock()` calls, then `@effect/vitest` imports
- **`_failForCalls()` mock helper:** Useful pattern for testing retry scenarios — fails for N calls then succeeds
- **`_linkResultToSession()` mock helper:** FinalizationEvidence mock needs session-to-result mapping for `existsForSession()` to work correctly
- **No deep imports:** Always use barrel `@workspace/domain`, never deep path imports
- **`as` cast justification:** Add comment when casting JSON schema for Anthropic tool use

### Type Updates Required

The `AssessmentResultRecord` and `AssessmentResultInput` types in `assessment-result.repository.ts` need `signalPower` added to facets and traits:

```typescript
// Current:
readonly facets: Record<FacetName, { score: number; confidence: number }> | Record<string, never>;
readonly traits: Record<TraitName, { score: number; confidence: number }> | Record<string, never>;

// Updated:
readonly facets: Record<FacetName, { score: number; confidence: number; signalPower: number }> | Record<string, never>;
readonly traits: Record<TraitName, { score: number; confidence: number; signalPower: number }> | Record<string, never>;
```

This is safe because it's a JSONB column — no DB migration needed. Existing placeholder rows have `{}` which still satisfies `Record<string, never>`.

### Project Structure Notes

**New files:**
- `packages/domain/src/utils/score-computation.ts`
- `packages/domain/src/utils/__tests__/score-computation.test.ts`

**Modified files:**
- `packages/domain/src/repositories/assessment-result.repository.ts` — add `update` method + `AssessmentResultUpdateInput` type + add `signalPower` to JSONB types
- `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts` — implement `update`
- `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts` — add `update` to mock
- `apps/api/src/use-cases/generate-results.use-case.ts` — replace Phase 2 placeholder with real scoring
- `apps/api/src/use-cases/__tests__/generate-results.use-case.test.ts` — add Phase 2 tests
- `packages/domain/src/index.ts` — export new score-computation functions

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3: Score Computation & OCEAN Code Generation]
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#New Scoring Formulas]
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Results Data Storage]
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Finalization Atomicity & Idempotency]
- [Source: packages/domain/src/utils/formula.ts] (computeFacetMetrics, FacetMetrics, FORMULA_DEFAULTS)
- [Source: packages/domain/src/constants/big-five.ts] (FACET_TO_TRAIT, TRAIT_TO_FACETS, ALL_FACETS)
- [Source: packages/domain/src/utils/ocean-code-generator.ts] (generateOceanCode)
- [Source: apps/api/src/use-cases/generate-results.use-case.ts] (Phase 2 placeholder to replace)
- [Source: _bmad-output/implementation-artifacts/11-2-finanalyzer-sonnet-integration.md] (previous story)

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. When adding `update` to the interface, add it to the mock too. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Score computation location** — Score computation is a PURE DOMAIN FUNCTION in `packages/domain/src/utils/score-computation.ts`. Do NOT put it in infrastructure or use-cases. The use-case calls the pure function and passes results to the repository.
6. **Redundant formula reimplementation** — Do NOT reimplement facet score/confidence/signalPower calculation. `computeFacetMetrics()` in `formula.ts` already does this. Wrap it, don't duplicate it.
7. **OCEAN code storage** — Do NOT store OCEAN code in `assessment_results`. It is DERIVED on read via `generateOceanCode()`. The `get-results` use-case handles this.
8. **Assessment result mutation pattern** — Phase 2 UPDATES the existing placeholder row. Do NOT create a second `assessment_results` row. Use the new `update()` method, not `create()`.
9. **Evidence table mixing** — Do NOT query `conversation_evidence` for scoring. Final scores come exclusively from `finalization_evidence`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None.

### Completion Notes List

- Task 1: Added `update` method + `AssessmentResultUpdateInput` type to domain interface, Drizzle implementation, and mock. Also added `signalPower` to facets/traits JSONB types (JSONB — no DB migration needed). Added `_seedResult` helper to mock for testing Guard 2 path.
- Task 2: Created `score-computation.ts` with `computeAllFacetResults`, `computeTraitResults`, `computeDomainCoverage` — pure domain functions wrapping existing `computeFacetMetrics()`. Exported from domain barrel.
- Task 3: 11 unit tests covering all 3 functions: empty evidence, single-facet, multi-domain, uniform/mixed traits, domain normalization, "other" domain inclusion.
- Task 4: Replaced Phase 2 placeholder in `generate-results.use-case.ts`. Fetches finalization evidence, computes scores via domain functions, updates assessment_results row. Handles both normal path (Phase 1 result) and Guard 2 path (pre-existing evidence, fetches result by sessionId).
- Task 5: 6 new Phase 2 tests + updated 2 existing tests to account for Phase 2 scoring. All 238 API tests pass, all 733 domain tests pass. Zero regressions.

### Change Log

- 2026-02-24: Story 11.3 implementation complete — score computation & OCEAN code generation
- 2026-02-24: Code review fixes — removed unused import, improved type usage in mock, updated header comment

### File List

**New files:**
- `packages/domain/src/utils/score-computation.ts`
- `packages/domain/src/utils/__tests__/score-computation.test.ts`

**Modified files:**
- `packages/domain/src/repositories/assessment-result.repository.ts` — added `update` method, `AssessmentResultUpdateInput` type, `signalPower` to facets/traits types
- `packages/domain/src/index.ts` — exported new score-computation functions + `AssessmentResultUpdateInput`
- `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts` — implemented `update`
- `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts` — added `update`, `_seedResult` helper
- `packages/infrastructure/src/repositories/__mocks__/finalization-evidence.drizzle.repository.ts` — added `_seedEvidence` helper
- `apps/api/src/use-cases/generate-results.use-case.ts` — replaced Phase 2 placeholder with real score computation
- `apps/api/src/use-cases/__tests__/generate-results.use-case.test.ts` — added 6 Phase 2 tests, updated 2 existing tests
