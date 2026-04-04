# Story 43-2: Coverage Analyzer — Evidence-to-Target Pure Function

**Status:** ready-for-dev

**Epic:** Epic 1 — Director-Steered Conversations (Director Model)
**Source:** `_bmad-output/planning-artifacts/epics-director-model.md` → Story 1.2

## Story

As a **system operator**,
I want a pure function that analyzes conversation evidence and identifies the weakest personality facets in the weakest life domain,
So that the Director receives one coherent direction per turn for what to explore next.

## Acceptance Criteria

### AC-1: Confidence Matrix Construction
**Given** a set of conversation evidence records (`EvidenceInput[]`) for a session
**When** the coverage analyzer runs
**Then** it builds a confidence matrix: `Map<LifeDomain, Map<FacetName, number>>` where each confidence value is computed using the existing `computeFacetConfidence()` formula: `C_max × (1 - e^{-k × W})` (from `formula.ts`)

### AC-2: Target Domain Selection
**Given** the confidence matrix is built
**When** the coverage analyzer selects a target domain
**Then** for each steerable domain, it identifies the 3 lowest-confidence facets
**And** it computes the bottom-3 average confidence per domain
**And** it selects the target domain as the domain with the lowest bottom-3 average
**And** tiebreak uses the full domain average (all facets), selecting the weakest

### AC-3: Target Output Shape
**Given** the coverage analyzer completes
**When** it returns
**Then** the output is `{ targetFacets: FacetName[], targetDomain: LifeDomain }`
**And** `targetFacets` contains the 3 lowest-confidence facets in the selected domain

### AC-4: Definition Pairing
**Given** the coverage analyzer returns target facets
**When** definitions are paired
**Then** each target facet includes its behavioral definition from `FACET_PROMPT_DEFINITIONS`
**And** the target domain includes its definition from `LIFE_DOMAIN_DEFINITIONS`
**And** total injected definition text is ~100-150 tokens

### AC-5: Zero Evidence (First Turn)
**Given** a session with zero evidence (first turn)
**When** the coverage analyzer runs
**Then** all confidences are zero
**And** it returns any valid steerable domain and its 3 weakest facets (deterministic tiebreak — use `STEERABLE_DOMAINS` array order for domain, `OCEAN_INTERLEAVED_ORDER` for facets)

### AC-6: No New Scoring Math
**Given** the coverage analyzer implementation
**When** it computes facet confidence per domain
**Then** it reuses the existing confidence formula pattern from `formula.ts`: `C_max × (1 - e^{-k × W})` where W is the total evidence mass for that facet in that domain
**And** no new scoring math is introduced

### AC-7: Unit Tests
**Given** the function file at `packages/domain/src/utils/coverage-analyzer.ts`
**When** unit tests run
**Then** all edge cases pass: zero evidence, uniform evidence, single-domain-heavy evidence, tiebreak scenarios

## Tasks

### Task 1: Define the CoverageAnalyzerOutput type
- **File:** `packages/domain/src/utils/coverage-analyzer.ts`
- Create the output interface:
  ```typescript
  interface CoverageTarget {
    targetFacets: FacetName[];
    targetDomain: LifeDomain;
  }

  interface CoverageTargetWithDefinitions {
    targetFacets: Array<{ facet: FacetName; definition: string }>;
    targetDomain: { domain: LifeDomain; definition: string };
  }
  ```

### Task 2: Implement `analyzeCoverage` pure function
- **File:** `packages/domain/src/utils/coverage-analyzer.ts`
- Input: `EvidenceInput[]`, optional `FormulaConfig`
- Steps:
  1. Group evidence by domain → facet
  2. For each (domain, facet) pair, compute evidence mass W using `computeFinalWeight()` from formula.ts, then confidence via `C_max × (1 - e^{-k × W})`
  3. For each steerable domain, find the 3 lowest-confidence facets
  4. Select the domain with the lowest bottom-3 average
  5. Tiebreak on full-domain average (weakest wins); second tiebreak on `STEERABLE_DOMAINS` array order
  6. Return `{ targetFacets, targetDomain }`

### Task 3: Implement `enrichWithDefinitions` helper
- **File:** `packages/domain/src/utils/coverage-analyzer.ts`
- Input: `CoverageTarget`
- Output: `CoverageTargetWithDefinitions`
- Pairs each target facet with its definition from `FACET_PROMPT_DEFINITIONS`
- Pairs target domain with its definition from `LIFE_DOMAIN_DEFINITIONS`

### Task 4: Write unit tests (TDD — tests first)
- **File:** `packages/domain/src/utils/__tests__/coverage-analyzer.test.ts`
- Test cases:
  1. Zero evidence returns deterministic default (first steerable domain, first 3 facets in OCEAN order)
  2. Single-domain evidence produces a different domain as target (the unexplored one)
  3. Uniform evidence across all domains — tiebreak produces deterministic result
  4. Heavy evidence on one facet/domain pushes target elsewhere
  5. Definition enrichment returns correct facet + domain definitions
  6. Tiebreak scenario: two domains with same bottom-3 average, full-domain average breaks tie
  7. Returns exactly 3 target facets

### Task 5: Export from domain barrel
- **File:** `packages/domain/src/index.ts`
- Export `analyzeCoverage`, `enrichWithDefinitions`, `CoverageTarget`, `CoverageTargetWithDefinitions`

## Technical Notes

- **Location:** `packages/domain/src/utils/coverage-analyzer.ts` — pure function, no DI, no repository
- **Existing patterns:** Follow `formula.ts` patterns — pure functions, `FormulaConfig` parameter with defaults, `FORMULA_DEFAULTS` reuse
- **Confidence formula:** Reuse the exact formula from `computeFacetMetrics` in `formula.ts`: `C_max × (1 - e^{-k × W})`. The coverage analyzer computes per-domain-per-facet confidence (not the cross-domain aggregated confidence from `computeFacetMetrics`)
- **Evidence mass W:** For each (domain, facet) pair, W = sum of `computeFinalWeight(strength, confidence)` for matching evidence records
- **Constants to import:** `STEERABLE_DOMAINS`, `LIFE_DOMAIN_DEFINITIONS` from `life-domain.ts`; `ALL_FACETS`, `FacetName` from `big-five.ts`; `FACET_PROMPT_DEFINITIONS` from `facet-prompt-definitions.ts`; `computeFinalWeight`, `FormulaConfig`, `FORMULA_DEFAULTS` from `formula.ts`
- **No new dependencies:** Pure TypeScript, no external packages
