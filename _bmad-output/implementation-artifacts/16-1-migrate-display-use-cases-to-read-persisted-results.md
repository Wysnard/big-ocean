# Story 16.1: Migrate Display Use-Cases to Read Persisted Results

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user viewing my assessment results,
I want to see the exact same scores on my results page, public profile, and shareable link,
so that my personality profile is consistent everywhere I or others view it.

## Acceptance Criteria

1. **Given** a completed assessment with persisted `assessment_results` (facets + traits), **When** the user views their results via `get-results`, **Then** the scores are read directly from `assessment_results.facets` and `.traits` — no re-computation via `scoring.ts`.

2. **Given** a completed assessment, **When** anyone views the public profile via `get-public-profile`, **Then** scores are read from persisted `assessment_results`, identical to the results page.

3. **Given** a completed assessment, **When** the user creates a shareable profile via `create-shareable-profile`, **Then** scores are read from persisted `assessment_results`.

4. **Given** a user resuming a session via `resume-session`, **When** scores are displayed, **Then** they are read from persisted `assessment_results` (not re-computed). For in-progress sessions where `assessment_results` don't yet exist, the existing `aggregateFacetScores` fallback remains until finalization.

5. **Given** `portrait-prompt.utils.ts` building portrait input, **When** trait scores are needed, **Then** they are read from persisted results, not derived via `scoring.ts`.

## Tasks / Subtasks

- [ ] Task 1: Migrate `get-results.use-case.ts` (AC: #1)
  - [ ] 1.1: Add `AssessmentResultRepository` to the use-case's dependency tags (import from `@workspace/domain`)
  - [ ] 1.2: Replace `aggregateFacetScores(evidence)` + `deriveTraitScores(facetScoresMap)` (lines ~120-121) with `AssessmentResultRepository.getBySessionId(input.sessionId)`
  - [ ] 1.3: Read `facets` and `traits` directly from the persisted `AssessmentResultRecord` — note these include `signalPower` (not present in old scoring output); adapt the return type if needed
  - [ ] 1.4: Remove `FacetEvidenceRepository` dependency if no longer used in this use-case (check if evidence is used elsewhere in the function, e.g., for the evidence highlighting feature)
  - [ ] 1.5: Remove `import { aggregateFacetScores, deriveTraitScores } from "@workspace/domain"`
  - [ ] 1.6: Update the use-case's test (`get-results.test.ts`) — add `vi.mock()` for `assessment-result.drizzle.repository` and seed a result via `_seedResult()`

- [ ] Task 2: Migrate `get-public-profile.use-case.ts` (AC: #2)
  - [ ] 2.1: Add `AssessmentResultRepository` to dependency tags
  - [ ] 2.2: Replace `aggregateFacetScores(evidence)` (line ~103) with `AssessmentResultRepository.getBySessionId(profile.sessionId)` — read `.facets` directly
  - [ ] 2.3: Remove `FacetEvidenceRepository` dependency if no longer used
  - [ ] 2.4: Remove `import { aggregateFacetScores } from "@workspace/domain"`
  - [ ] 2.5: Update `get-public-profile.test.ts` — mock `assessment-result.drizzle.repository`, seed result

- [ ] Task 3: Migrate `create-shareable-profile.use-case.ts` (AC: #3)
  - [ ] 3.1: Add `AssessmentResultRepository` to dependency tags
  - [ ] 3.2: Replace `aggregateFacetScores(evidence)` (line ~65) with `AssessmentResultRepository.getBySessionId(input.sessionId)` — read `.facets` for OCEAN code generation
  - [ ] 3.3: `generateOceanCode(facetScores)` still needed but now reads from `result.facets` — adapt the `FacetScoresMap` extraction from the persisted `facets` JSONB shape (which includes `signalPower`)
  - [ ] 3.4: Remove `FacetEvidenceRepository` dependency if no longer used
  - [ ] 3.5: Update test

- [ ] Task 4: Migrate `resume-session.use-case.ts` (AC: #4)
  - [ ] 4.1: Add `AssessmentResultRepository` to dependency tags
  - [ ] 4.2: For **completed** sessions: read from `AssessmentResultRepository.getBySessionId()` instead of `aggregateFacetScores(evidence)` (line ~73)
  - [ ] 4.3: For **in-progress** sessions (no `assessment_results` row yet): keep existing `aggregateFacetScores` as fallback — check `result === null` then fall back
  - [ ] 4.4: Update test to cover both paths (completed session with persisted results, in-progress session with fallback)

- [ ] Task 5: Migrate `portrait-prompt.utils.ts` (AC: #5)
  - [ ] 5.1: Refactor `formatTraitSummary()` in `packages/infrastructure/src/repositories/portrait-prompt.utils.ts` (line ~34) to accept pre-computed `TraitScoresMap` instead of `FacetScoresMap` + calling `deriveTraitScores` internally
  - [ ] 5.2: Update all callers of `formatTraitSummary()` (portrait generators) to pass `result.traits` from the persisted `AssessmentResultRecord` instead of passing `facetScoresMap`
  - [ ] 5.3: Remove `import { deriveTraitScores } from "@workspace/domain"` from `portrait-prompt.utils.ts`
  - [ ] 5.4: Update tests for portrait prompt utils

- [ ] Task 6: Wire `AssessmentResultRepository` into handlers (AC: all)
  - [ ] 6.1: Add `AssessmentResultDrizzleRepositoryLive` to the Layer composition in `apps/api/src/index.ts` if not already present (check — it may already be wired for `generate-results`)
  - [ ] 6.2: Add `AssessmentResultRepository` to each handler's dependency list that uses the migrated use-cases (assessment handler, profile handler, etc.)
  - [ ] 6.3: Verify all migrated use-cases' Effect error channels include `AssessmentResultError`

- [ ] Task 7: Verify consistency (AC: all)
  - [ ] 7.1: Run full test suite: `pnpm test:run`
  - [ ] 7.2: Verify no remaining imports of `aggregateFacetScores` or `deriveTraitScores` from `scoring.ts` in any use-case (except `update-facet-scores.use-case.ts` which is dead code — Story 16.4 deletes it)
  - [ ] 7.3: Verify `scoring.ts` itself is NOT deleted in this story — that's Story 16.2's job

## Parallelism

- **Blocked by:** (none)
- **Blocks:** 16-2-delete-legacy-scoring-system
- **Mode:** parallel (with 16-3, 16-4)
- **Domain:** backend assessment scoring
- **Shared files:** `apps/api/src/index.ts` (Layer wiring — also touched by 16-3, 16-4)

## Dev Notes

- The `AssessmentResultRecord.facets` shape is `Record<FacetName, { score: number; confidence: number; signalPower: number }>` — note the extra `signalPower` field that `scoring.ts` never produced. Use-cases that only need `score` and `confidence` can destructure accordingly.
- The `AssessmentResultRecord.traits` shape is `Record<TraitName, { score: number; confidence: number; signalPower: number }>`.
- `AssessmentResultRepository` already has `getBySessionId()` returning `AssessmentResultRecord | null`. The `null` case must be handled (return error or empty state for completed sessions; fallback for in-progress).
- `resume-session` is the trickiest migration: in-progress sessions don't have `assessment_results` rows. Use a conditional: if `getBySessionId` returns non-null, use persisted; otherwise fall back to `aggregateFacetScores`. This is acceptable because Story 16.2 won't delete `scoring.ts` until all consumers are migrated.
- `update-facet-scores.use-case.ts` also imports from `scoring.ts` but is dead code (no production callers). Do NOT migrate it — Story 16.4 deletes it entirely.
- `apps/front/src/lib/card-generation.ts` has a local `deriveTraitScores` copy — not in scope (frontend-only, not importing from `scoring.ts`).

### Project Structure Notes

- All use-cases in `apps/api/src/use-cases/` — no path changes needed
- Repository interface at `packages/domain/src/repositories/assessment-result.repository.ts`
- Repository implementation at `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts`
- Mock at `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts` — has `_seedResult()` helper for tests
- Portrait utils at `packages/infrastructure/src/repositories/portrait-prompt.utils.ts`
- Layer wiring at `apps/api/src/index.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics-conversation-pipeline.md#Story 1.1]
- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#D1]
- [Source: packages/domain/src/repositories/assessment-result.repository.ts] — `AssessmentResultRecord` type, `getBySessionId` method
- [Source: packages/domain/src/utils/scoring.ts] — `aggregateFacetScores`, `deriveTraitScores` (to be replaced)
- [Source: packages/domain/src/utils/formula.ts] — authoritative scoring pipeline (writes to `assessment_results`)
- [Source: apps/api/src/use-cases/get-results.use-case.ts:120-121] — current `scoring.ts` usage
- [Source: apps/api/src/use-cases/get-public-profile.use-case.ts:103] — current `scoring.ts` usage
- [Source: apps/api/src/use-cases/create-shareable-profile.use-case.ts:65] — current `scoring.ts` usage
- [Source: apps/api/src/use-cases/resume-session.use-case.ts:73] — current `scoring.ts` usage
- [Source: packages/infrastructure/src/repositories/portrait-prompt.utils.ts:34] — current `deriveTraitScores` usage

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
