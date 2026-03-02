# Story 18.2: Rewrite computeFacetMetrics for Evidence v2

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system computing personality scores,
I want the scoring formula to natively consume v2 evidence (deviation + enums),
So that scores are computed from higher-quality structured inputs without adapter layers.

## Acceptance Criteria

1. **Given** `computeFacetMetrics()` in `formula.ts`, **When** rewritten for v2, **Then** it accepts `EvidenceInput` with `deviation`, `strength`, `confidence` fields directly. Weight maps are co-located inside: `STRENGTH_WEIGHT = { weak: 0.3, moderate: 0.6, strong: 1.0 }`, `CONFIDENCE_WEIGHT = { low: 0.3, medium: 0.6, high: 0.9 }`. `finalWeight = strengthWeight x confidenceWeight` replaces raw confidence in all mass/entropy computations. Deviation-to-score mapping uses `MIDPOINT(10) + D_f x SCALE_FACTOR(10/3)` internally.

2. **Given** `STRENGTH_WEIGHT`, `CONFIDENCE_WEIGHT`, and `computeFinalWeight()`, **When** needed by annotation API (Decision 12, Story 20-1), **Then** they are exported from `formula.ts` for reuse (Pattern 2 from architecture doc).

3. **Given** `computeDepthSignal()` in the portrait pipeline, **When** updated for v2, **Then** it counts evidence records with `finalWeight >= 0.36` (RICH >= 8, MODERATE >= 4, THIN < 4). This replaces any confidence float threshold.

4. **Given** `score-computation.ts` wrapper, **When** updated, **Then** it passes v2 evidence to `computeFacetMetrics()` — no adapter layer. The default score for missing facets remains `FORMULA_DEFAULTS.SCORE_MIDPOINT` (10).

5. **Given** existing formula tests (`formula-numerical-hand-computed.test.ts`, `formula-numerical-components.test.ts`, `formula-metrics-steering.test.ts`, `formula-numerical-steering.test.ts`), **When** updated, **Then** fixtures use v2 evidence shape and tests pass with the new native formula (not the temporary adapter). Hand-computed expected values must be recalculated to match the native v2 aggregation.

## Tasks / Subtasks

- [x] Task 1: Promote weight maps and add `computeFinalWeight()` export (AC: #1, #2)
  - [x] 1.1 In `packages/domain/src/utils/formula.ts`, move `STRENGTH_WEIGHT` and `CONFIDENCE_WEIGHT` from internal adapter to **exported** top-level constants. These already exist as internal constants (added by Story 18-1 as temporary adapters) — make them `export const`.
  - [x] 1.2 Create and export a pure function `computeFinalWeight(strength: EvidenceStrength, confidence: EvidenceConfidence): number` that returns `STRENGTH_WEIGHT[strength] * CONFIDENCE_WEIGHT[confidence]`. This is consumed by Story 20-1 (annotation API).
  - [x] 1.3 Export these from `packages/domain/src/utils/formula.ts` (they are NOT re-exported via `packages/domain/src/utils/index.ts` barrel — formula.ts consumers import directly).

- [x] Task 2: Rewrite `computeFacetMetrics()` grouping loop (AC: #1)
  - [x] 2.1 Remove the temporary adapter functions `deviationToScore()` and `v2ToNumericConfidence()`.
  - [x] 2.2 Rewrite the grouping loop (currently lines ~171-187) to consume v2 fields natively:
    - For each evidence record, compute `finalWeight = computeFinalWeight(e.strength, e.confidence)`.
    - Push `e.deviation` (not a converted score) and `finalWeight` (not raw confidence) into domain groups.
    - Domain groups now store `deviations: number[]` and `weights: number[]` instead of `scores: number[]` and `confidences: number[]`.
  - [x] 2.3 Rewrite `computeContextMean()` call or inline equivalent — per-domain weighted mean becomes:
    ```
    mu_g = sum(weight_i * deviation_i) / sum(weight_i)
    ```
    This computes a **weighted mean deviation** per domain (range -3 to +3), replacing the old weighted mean score (0-20).
  - [x] 2.4 Rewrite `computeContextWeight()` call or inline equivalent — per-domain context weight becomes:
    ```
    w_g = sqrt(sum(finalWeight_i))
    ```
    This uses `finalWeight` instead of raw `confidence` as the mass input.
  - [x] 2.5 Compute facet-level deviation as cross-domain weighted mean:
    ```
    D_f = sum(w_g * mu_g) / sum(w_g)
    ```
  - [x] 2.6 Map deviation to 0-20 score scale for the output `FacetMetrics.score`:
    ```
    S_f = MIDPOINT + D_f * SCALE_FACTOR
    where MIDPOINT = 10, SCALE_FACTOR = 10/3
    ```
    Add `SCALE_FACTOR = 10 / 3` as a module-level constant (not exported — internal only).
  - [x] 2.7 Confidence and signal power computations remain structurally identical — they use `w_g` (domain context weight) and `W` (total diversified mass) which are now derived from `finalWeight` instead of raw confidence. Verify `C`, `V`, `D`, `P` formulas are unchanged.

- [x] Task 3: Update `computeContextMean` and `computeContextWeight` helpers (AC: #1)
  - [x] 3.1 Rename or update `computeContextMean(scores, confidences, epsilon)` — it currently computes `sum(c_i * s_i) / sum(c_i)`. After the rewrite, the inputs are `deviations[]` and `weights[]` (finalWeight). The formula `sum(w_i * d_i) / sum(w_i)` is structurally identical — only the parameter semantics change. Update parameter names from `scores`/`confidences` to `values`/`weights` for clarity if desired (these are exported functions, but only consumed internally by `computeFacetMetrics` — verify no external consumers before renaming).
  - [x] 3.2 Update `computeContextWeight(confidences)` — currently `sqrt(sum(c_i))`. After rewrite, input is `finalWeight[]`. Same formula: `sqrt(sum(w_i))`. Update parameter name from `confidences` to `weights` if desired.
  - [x] 3.3 **Critical check:** Verify `computeContextWeight` and `computeContextMean` are NOT imported by any file outside `formula.ts`. If they are (e.g., test files), update those imports too.

- [x] Task 4: Update `computeDepthSignal()` (AC: #3)
  - [x] 4.1 Locate `computeDepthSignal()`. It is NOT in `packages/domain/src/utils/confidence.ts` (that file has legacy facet score helpers). Search for it — likely in portrait-related code (`teaser-portrait.anthropic.repository.ts` or a utility).
  - [x] 4.2 Update to count evidence records where `computeFinalWeight(e.strength, e.confidence) >= 0.36`:
    ```
    const hqCount = evidence.filter(e => computeFinalWeight(e.strength, e.confidence) >= 0.36).length;
    if (hqCount >= 8) return "RICH";
    if (hqCount >= 4) return "MODERATE";
    return "THIN";
    ```
  - [x] 4.3 Import `computeFinalWeight` from `@workspace/domain/utils/formula` (or wherever the function lives relative to the depth signal consumer). Ensure this does NOT create a cross-layer import violation.

- [x] Task 5: Verify `score-computation.ts` wrapper (AC: #4)
  - [x] 5.1 In `packages/domain/src/utils/score-computation.ts`, verify `computeAllFacetResults()` passes `EvidenceInput[]` directly to `computeFacetMetrics()` with no intermediate mapping. This should already work correctly since `computeFacetMetrics` now consumes v2 natively.
  - [x] 5.2 Verify the default for missing facets: `{ score: FORMULA_DEFAULTS.SCORE_MIDPOINT, confidence: 0, signalPower: 0 }` — `SCORE_MIDPOINT` (10) is still the correct default since the output score is still on 0-20 scale.
  - [x] 5.3 Verify `computeDomainCoverage()` is unaffected (it only reads `e.domain`).

- [x] Task 6: Update all formula test files (AC: #5)
  - [x] 6.1 In `packages/domain/src/utils/__tests__/__fixtures__/formula.fixtures.ts` and `formula-numerical.fixtures.ts`, verify fixtures use v2 `EvidenceInput` shape (`deviation`, `strength`, `confidence`). These were already updated by Story 18-1, but the expected values were computed using the temporary adapter math.
  - [x] 6.2 In `formula-numerical-hand-computed.test.ts`, recalculate all hand-computed expected values:
    - Old adapter path: `deviation -> deviationToScore() -> computeContextMean() with raw confidence`
    - New native path: `deviation + finalWeight -> weighted mean deviation -> MIDPOINT + D_f * SCALE_FACTOR`
    - **These produce the SAME numerical results** because `deviationToScore(d) = MIDPOINT + d * MIDPOINT/3` and `SCALE_FACTOR = 10/3 = MIDPOINT/3`. Verify this algebraic equivalence holds for all test cases — if so, expected values do NOT change.
  - [x] 6.3 In `formula-numerical-components.test.ts`, update tests for `computeContextMean` and `computeContextWeight` if parameter names changed. Update any tests that reference the adapter functions (`deviationToScore`, `v2ToNumericConfidence`).
  - [x] 6.4 In `formula-metrics-steering.test.ts`, verify behavioral/invariant tests still pass (these test properties like monotonicity, not exact values).
  - [x] 6.5 In `formula-numerical-steering.test.ts`, verify steering tests pass (these depend on `computeFacetMetrics` output which feeds `computeSteeringTarget`).
  - [x] 6.6 Remove any test comments/sections referencing "v2 adapter recap (temporary, Story 18-2 will rewrite)" — the adapter is gone.
  - [x] 6.7 Add new test: `computeFinalWeight` returns correct values for all 9 enum combinations (3 strength x 3 confidence).

- [x] Task 7: Remove all TODO markers and verify build (AC: #1, #5)
  - [x] 7.1 Search for all `// TODO: Story 18-2` comments across the codebase and remove them.
  - [x] 7.2 Run `pnpm build` — fix any TypeScript errors.
  - [x] 7.3 Run `pnpm test:run` — all tests must pass.
  - [x] 7.4 Run `pnpm lint` — fix any lint errors.

## Parallelism

- **Blocked by:** 18-1-evidence-v2-schema-and-conversanalyzer-prompt-update
- **Blocks:** 18-3-rolling-evidence-budget-and-cap-enforcement, 18-4-rewrite-finalization-pipeline-with-staged-idempotency
- **Mode:** sequential (blocked by 18-1)
- **Domain:** backend scoring (domain utils, formula, tests)
- **Shared files:**
  - `packages/domain/src/utils/formula.ts` — primary target of this story. Also touched by 18-1 (adapter) and potentially 18-3 (cap constants).
  - `packages/domain/src/types/evidence.ts` — read-only dependency (already v2 from 18-1)
  - `packages/domain/src/utils/score-computation.ts` — verification only, no changes expected

## Dev Notes

### Architecture Compliance

- **Decision D4 (Evidence v2 Format):** This story completes D4 by making the formula natively consume v2 fields. Story 18-1 added temporary adapters — this story removes them.
- **IC-1 (`computeFacetMetrics()` rewrite):** This IS the IC-1 implementation item from the architecture doc. Weight maps co-located inside formula.ts. `finalWeight = strength x confidence` replaces raw confidence everywhere.
- **Pattern 2 (Export for reuse):** `STRENGTH_WEIGHT`, `CONFIDENCE_WEIGHT`, `computeFinalWeight()` are exported for Story 20-1 (annotation API) to compute `finalWeight` at read time.
- **Hexagonal architecture:** All changes are in `packages/domain/src/utils/` — pure domain logic. No infrastructure or handler changes.
- **Deviation Aggregation (architecture doc section):** The exact formula is:
  ```
  Per-domain weighted mean:   mu_g = sum(finalWeight_i * deviation_i) / sum(finalWeight_i)
  Context weight per domain:  w_g = sqrt(sum(finalWeight_i))
  Facet deviation:            D_f = sum(w_g * mu_g) / sum(w_g)
  Facet score:                S_f = MIDPOINT + D_f * SCALE_FACTOR  (mapped to 0-20)
  ```

### Algebraic Equivalence Note

The temporary adapter in Story 18-1 does: `score = MIDPOINT + deviation * (MIDPOINT/3)` and `confidence = STRENGTH_WEIGHT[s] * CONFIDENCE_WEIGHT[c]`, then feeds `(score, confidence)` into the existing formula. The native v2 formula does: weighted mean of `deviation` values using `finalWeight`, then `S_f = MIDPOINT + D_f * SCALE_FACTOR` where `SCALE_FACTOR = 10/3 = MIDPOINT/3`. **These are algebraically equivalent** because the weighted mean of `(MIDPOINT + d * k)` = `MIDPOINT + k * weighted_mean(d)`. This means:
- Output `FacetMetrics.score` values are **identical** before and after this rewrite
- Test expected values should NOT change
- This is a refactor, not a behavioral change

This equivalence should be verified in Task 6.2 but is expected to hold.

### Key Files to Modify

| File | Change |
|---|---|
| `packages/domain/src/utils/formula.ts` | Export weight maps, add `computeFinalWeight()`, rewrite `computeFacetMetrics()` grouping loop, remove adapter functions |
| `packages/domain/src/utils/__tests__/__fixtures__/formula.fixtures.ts` | Verify v2 shape (likely no changes needed) |
| `packages/domain/src/utils/__tests__/__fixtures__/formula-numerical.fixtures.ts` | Verify v2 shape (likely no changes needed) |
| `packages/domain/src/utils/__tests__/formula-numerical-hand-computed.test.ts` | Remove adapter references, verify expected values unchanged |
| `packages/domain/src/utils/__tests__/formula-numerical-components.test.ts` | Update helper function tests, add `computeFinalWeight` tests |
| `packages/domain/src/utils/__tests__/formula-metrics-steering.test.ts` | Remove adapter references |
| `packages/domain/src/utils/__tests__/formula-numerical-steering.test.ts` | Verify passes |
| `computeDepthSignal()` location (TBD — search codebase) | Update to use `finalWeight >= 0.36` threshold |

### Previous Story Intelligence (18-1)

Story 18-1 established:
- `EvidenceInput` is already v2: `{ deviation, strength, confidence, domain, note? }`
- Temporary adapter functions exist in `formula.ts`: `STRENGTH_WEIGHT`, `CONFIDENCE_WEIGHT`, `deviationToScore()`, `v2ToNumericConfidence()`
- Test fixtures already use v2 shape
- Tests contain comments like `// v2 adapter recap (temporary, Story 18-2 will rewrite)`
- Anti-pattern #7 in 18-1: "NO formula rewrite — that's Story 18-2"

### Git Intelligence

Recent commits show:
- `7465127` fix: remove panel and fix polar
- `819e0ea` feat: remove transcript panel, fix completed session UX, sync DB schema
- `f581c2d` feat: micro-intent realizer for natural conversation steering (#105)

No conflicts expected — this story touches only `formula.ts` and its tests, which are not actively modified by other recent work.

### Testing Standards

- Use `@effect/vitest` with `it.effect()` for Effect programs
- Import ordering: `import { vi } from "vitest"` FIRST, then `vi.mock()` calls, then `@effect/vitest` imports
- Test files are in `packages/domain/src/utils/__tests__/`
- Fixtures in `packages/domain/src/utils/__tests__/__fixtures__/`
- This story is pure domain logic — no mocking needed (formula functions are pure)
- All 4 formula test files must pass after changes

### Project Structure Notes

- All changes are within `packages/domain/src/utils/` — pure domain layer
- No new files created (except possibly a small depth signal utility if refactored)
- No new packages or dependencies
- `formula.ts` and `score-computation.ts` are NOT exported via the `utils/index.ts` barrel — they are imported directly by consumers

### References

- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Decision 4]
- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Deviation Aggregation + Score Mapping]
- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Depth Signal (Updated for Evidence v2)]
- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Phase 2: Evidence v2 + Scoring v2]
- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Pattern 2]
- [Source: _bmad-output/planning-artifacts/epics-conversation-pipeline.md#Story 3.2]
- [Source: packages/domain/src/utils/formula.ts]
- [Source: packages/domain/src/utils/score-computation.ts]
- [Source: packages/domain/src/types/evidence.ts]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **NO adapter layers** — Do NOT create intermediate adapter functions that convert v2 evidence to some other format before feeding to the formula. The whole point of this story is to eliminate the adapter from 18-1.
6. **NO new score scales** — Output `FacetMetrics.score` remains on the 0-20 scale. Do NOT change it to deviation scale (-3 to +3) or any other scale. The mapping `MIDPOINT + D_f * SCALE_FACTOR` converts internal deviation back to 0-20 for output.
7. **NO changes to `FacetMetrics` interface** — The output type `{ score, confidence, signalPower, domainWeights }` is unchanged. Consumers of `computeFacetMetrics()` should see no difference in output shape or scale.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None required — pure refactor with algebraic equivalence verified by unchanged test values.

### Completion Notes List

- Exported `STRENGTH_WEIGHT`, `CONFIDENCE_WEIGHT`, and `computeFinalWeight()` from `formula.ts` for reuse by Story 20-1 annotation API
- Rewrote `computeFacetMetrics()` grouping loop to consume v2 evidence natively: `deviation` + `finalWeight` replace `score` + `confidence`
- Added `SCALE_FACTOR = 10/3` constant for deviation-to-score mapping
- Renamed `computeContextMean` and `computeContextWeight` parameters from `scores`/`confidences` to `values`/`weights` for clarity
- Removed temporary adapter functions `deviationToScore()` and `v2ToNumericConfidence()`
- Updated `computeDepthSignal()` to use `computeFinalWeight(e.strength, e.confidence) >= 0.36` threshold
- Added `scoringEvidence` field to `PortraitGenerationInput` and `TeaserPortraitInput` interfaces to carry v2 evidence for depth signal
- Updated portrait generator callers to pass `scoringEvidence` from mapped v2 evidence
- Added `computeFinalWeight` test covering all 9 strength x confidence combinations
- Updated all formula test comments to reference native v2 formula instead of adapter
- Verified algebraic equivalence: all existing test expected values unchanged
- All 784 domain tests, 100 infrastructure tests, 283 API tests pass
- Build clean, lint clean

### File List

| File | Change |
|---|---|
| `packages/domain/src/utils/formula.ts` | Export weight maps, add `computeFinalWeight()`, rewrite grouping loop, remove adapters |
| `packages/domain/src/utils/__tests__/formula-numerical-hand-computed.test.ts` | Update comments to native v2, rewrite score computation to use deviation + SCALE_FACTOR |
| `packages/domain/src/utils/__tests__/formula-numerical-components.test.ts` | Add `computeFinalWeight` 9-combo test, update adapter comments |
| `packages/domain/src/utils/__tests__/formula-metrics-steering.test.ts` | No changes needed (verified passing) |
| `packages/domain/src/utils/__tests__/formula-numerical-steering.test.ts` | No changes needed (verified passing) |
| `packages/infrastructure/src/repositories/portrait-prompt.utils.ts` | Update `computeDepthSignal` to accept v2 evidence with `finalWeight >= 0.36` threshold |
| `packages/infrastructure/src/repositories/__tests__/portrait-generator.depth-signal.test.ts` | Rewrite tests for v2 evidence shape |
| `packages/domain/src/repositories/portrait-generator.repository.ts` | Add `scoringEvidence: EvidenceInput[]` to `PortraitGenerationInput` |
| `packages/domain/src/repositories/teaser-portrait.repository.ts` | Add `scoringEvidence: EvidenceInput[]` to `TeaserPortraitInput` |
| `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` | Use `input.scoringEvidence` for `computeDepthSignal` |
| `packages/infrastructure/src/repositories/teaser-portrait.anthropic.repository.ts` | Use `input.scoringEvidence` for `computeDepthSignal` |
| `apps/api/src/use-cases/generate-results.use-case.ts` | Pass `scoringEvidence` to teaser portrait |
| `apps/api/src/use-cases/generate-full-portrait.use-case.ts` | Map finalization evidence to v2, pass `scoringEvidence` to portrait generator |

### Change Log

- 2026-03-02: Story 18.2 implemented — native v2 formula, adapter removal, depth signal update
