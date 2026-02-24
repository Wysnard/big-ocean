# Story 11.4: Archetype System

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to receive a memorable archetype name and see detailed facet labels,
So that my personality profile feels personal and understandable.

## Acceptance Criteria

1. **Given** a 5-letter OCEAN code is generated **When** the archetype is looked up **Then** the 4-letter code (O-C-E-A, excluding N) maps to an archetype name from ~25 hand-curated entries (FR9) **And** codes without a curated entry use component-based name generation (81 total combinations) **ALREADY IMPLEMENTED** via `lookupArchetype()` in `packages/domain/src/utils/archetype-lookup.ts`

2. **Given** an archetype is resolved **When** the result is returned **Then** it includes the archetype name + 2-3 sentence description (FR10) **And** lookup completes in < 100ms (NFR9) **ALREADY IMPLEMENTED** via `lookupArchetype()` — verify performance in tests

3. **Given** assessment results are finalized **When** facet-level results are displayed **Then** all 30 facet level names are shown aligned with the user's scores (FR11) **And** each facet name corresponds to the L/M/H level for that facet **THIS IS THE GAP** — `FacetResult` schema needs `level`, `levelLabel`, `levelDescription` fields

## Tasks / Subtasks

- [ ] Task 1: Extend FacetResultSchema with level fields (AC: #3)
  - [ ] 1.1: Update `packages/domain/src/schemas/result-schemas.ts`:
    - Add `level: S.String` — the two-letter facet level code (e.g., "OV", "CP")
    - Add `levelLabel: S.String` — human-readable label (e.g., "Visionary", "Persistent")
    - Add `levelDescription: S.String` — the level-specific description from `FACET_DESCRIPTIONS`
  - [ ] 1.2: Verify `FacetResult` type propagates correctly to:
    - `GetResultsOutput` in `get-results.use-case.ts`
    - Contract definitions in `packages/contracts/` (if any directly reference FacetResult)

- [ ] Task 2: Update get-results.use-case.ts to populate level fields (AC: #3)
  - [ ] 2.1: Import required utilities at top of file:
    - `import { getFacetLevel, FACET_LEVEL_LABELS, FACET_DESCRIPTIONS } from "@workspace/domain";`
  - [ ] 2.2: Update facet results mapping (around line 142) to include level fields:
    ```typescript
    const facets: FacetResult[] = (Object.keys(facetScoresMap) as FacetName[]).map((facetName) => {
      const facetData = facetScoresMap[facetName];
      if (!facetData) {
        // Should never happen — facetScoresMap is built from ALL_FACETS
        throw new Error(`Missing facet data for ${facetName}`);
      }
      const level = getFacetLevel(facetName, facetData.score);
      const levelLabel = FACET_LEVEL_LABELS[level];
      const levelDescription = FACET_DESCRIPTIONS[facetName].levels[level] as string;
      return {
        name: facetName,
        traitName: FACET_TO_TRAIT[facetName],
        score: facetData.score,
        confidence: facetData.confidence,
        level,
        levelLabel,
        levelDescription,
      };
    });
    ```

- [ ] Task 3: Update tests for get-results use-case (AC: #3)
  - [ ] 3.1: Update `apps/api/src/use-cases/__tests__/get-results-success.use-case.test.ts`:
    - Add assertions that each facet in result has `level`, `levelLabel`, `levelDescription`
    - Verify level codes match expected pattern (two uppercase letters, first is O/C/E/A/N)
    - Verify levelLabel is non-empty string
    - Verify levelDescription is non-empty string
  - [ ] 3.2: Add test: "facet level is computed correctly based on score threshold":
    - Score ≤ 10 → Low level code (first element in FACET_LETTER_MAP tuple)
    - Score > 10 → High level code (second element in FACET_LETTER_MAP tuple)
    - Note: Threshold uses `score <= 10` comparison, so 10.0 = Low, 10.1 = High

- [ ] Task 4: Verify archetype performance meets NFR9 (AC: #2)
  - [ ] 4.1: Add performance test in `packages/domain/src/utils/__tests__/archetype-lookup.test.ts`:
    - Call `lookupArchetype()` for all 81 possible codes
    - Assert total time < 100ms (should be < 1ms per lookup)
  - [ ] 4.2: Verify existing curated archetype tests still pass

## Dev Notes

### What's Already Implemented (Verify, Don't Rebuild)

| Component | Status | Location |
|-----------|--------|----------|
| `lookupArchetype(code4)` | Done | `packages/domain/src/utils/archetype-lookup.ts` |
| `extract4LetterCode(oceanCode5)` | Done | `packages/domain/src/utils/archetype-lookup.ts` |
| `CURATED_ARCHETYPES` (25 entries) | Done | `packages/domain/src/constants/archetypes.ts` |
| Component-based fallback generator | Done | `packages/domain/src/utils/archetype-lookup.ts` |
| `generateOceanCode(facetScoresMap)` | Done | `packages/domain/src/utils/ocean-code-generator.ts` |
| `getFacetLevel(facetName, score)` | Done | `packages/domain/src/utils/facet-level.ts` |
| `FACET_LEVEL_LABELS` (60 labels) | Done | `packages/domain/src/types/facet-levels.ts` |
| `FACET_LETTER_MAP` | Done | `packages/domain/src/types/facet-levels.ts` |
| `FACET_DESCRIPTIONS` (30 facets × 2 levels) | Done | `packages/domain/src/constants/facet-descriptions.ts` |
| `get-results.use-case.ts` (archetype integration) | Done | `apps/api/src/use-cases/get-results.use-case.ts` |
| Existing archetype tests | Done | `packages/domain/src/utils/__tests__/archetype-lookup-*.test.ts` |

### Critical Architecture Constraints

- **Archetype lookup is O(1)** — curated entries are a hash map lookup, fallback is pure computation with no external calls. Performance is guaranteed < 100ms even for all 81 codes in sequence.
- **`FacetResultSchema` is shared** between domain and contracts. Changes propagate automatically to HTTP response types.
- **`getFacetLevel()` threshold:** Score 0-10 = Low (first element of tuple), 11-20 = High (second element). Float scores are handled naturally: 10.0 → Low, 10.1 → High.
- **Level codes are globally unique** — every two-letter code maps to exactly one facet level (no ambiguity).
- **FACET_DESCRIPTIONS uses level codes as keys** — lookup is `FACET_DESCRIPTIONS[facetName].levels[levelCode]`.
- **Type safety for FACET_DESCRIPTIONS lookup:** `FACET_DESCRIPTIONS` uses `as const satisfies` so the literal types are preserved. However, when indexing with variables (`facetName: FacetName`, `level: FacetLevelCode`), TypeScript may require a type assertion. If TypeScript complains, cast the description lookup result: `FACET_DESCRIPTIONS[facetName].levels[level] as string`. This is safe because `getFacetLevel` always returns a valid level code for the given facet.

### Previous Story (11.3) Intelligence

Key learnings from Story 11.3:
- **Phase 2 scoring is complete** — facets and traits are computed and stored in `assessment_results`
- **Mock helpers available:** `_seedResult`, `_seedEvidence` in infrastructure mocks
- **Import ordering:** `vi` from `vitest` FIRST, then `vi.mock()` calls, then `@effect/vitest` imports
- **No deep imports:** Always use barrel `@workspace/domain`

### Type Updates Required

The `FacetResultSchema` in `packages/domain/src/schemas/result-schemas.ts` needs 3 new fields:

```typescript
// Current:
export const FacetResultSchema = S.Struct({
  name: FacetNameSchema,
  traitName: TraitNameSchema,
  score: S.Number,
  confidence: S.Number,
});

// Updated:
export const FacetResultSchema = S.Struct({
  name: FacetNameSchema,
  traitName: TraitNameSchema,
  score: S.Number,
  confidence: S.Number,
  level: S.String,           // Two-letter code like "OV"
  levelLabel: S.String,      // Human-readable like "Visionary"
  levelDescription: S.String, // Description from FACET_DESCRIPTIONS
});
```

### Project Structure Notes

**Modified files:**
- `packages/domain/src/schemas/result-schemas.ts` — add 3 fields to FacetResultSchema
- `apps/api/src/use-cases/get-results.use-case.ts` — populate level fields when building facets array
- `apps/api/src/use-cases/__tests__/get-results-success.use-case.test.ts` — add level field assertions

**No new files needed** — all infrastructure exists, this is pure integration work.

### Frontend Impact

The 3 new fields (`level`, `levelLabel`, `levelDescription`) added to `FacetResultSchema` will automatically appear in the API response consumed by `apps/front`. **Frontend changes are out of scope for this story** — the results page already renders facet data and will simply ignore the new fields until a future story updates the UI to display them. No coordination required for this backend-only change.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 11.4: Archetype System]
- [Source: packages/domain/src/utils/archetype-lookup.ts] (lookupArchetype, extract4LetterCode)
- [Source: packages/domain/src/constants/archetypes.ts] (CURATED_ARCHETYPES, 25 entries)
- [Source: packages/domain/src/utils/facet-level.ts] (getFacetLevel)
- [Source: packages/domain/src/types/facet-levels.ts] (FACET_LEVEL_LABELS, FACET_LETTER_MAP)
- [Source: packages/domain/src/constants/facet-descriptions.ts] (FACET_DESCRIPTIONS)
- [Source: packages/domain/src/schemas/result-schemas.ts] (FacetResultSchema — to modify)
- [Source: apps/api/src/use-cases/get-results.use-case.ts] (facet mapping — to update)
- [Source: _bmad-output/implementation-artifacts/11-3-score-computation-and-ocean-code-generation.md] (previous story)

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Reimplementing lookup logic** — Do NOT reimplement level lookup. `getFacetLevel()` exists and is tested. Use it directly.
6. **Hardcoded level codes/labels** — Do NOT hardcode level strings. Always use `FACET_LEVEL_LABELS[level]` and `FACET_DESCRIPTIONS[facetName].levels[level]`.
7. **Missing type narrowing** — When accessing `FACET_DESCRIPTIONS[facetName].levels[level]`, ensure TypeScript knows `level` is a valid key for that facet. The existing `getFacetLevel()` returns `FacetLevelCode` which should satisfy this.

## Dev Agent Record

### Agent Model Used

<!-- Filled by dev agent upon completion -->

### Debug Log References

### Completion Notes List

### File List

