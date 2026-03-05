# Story 21-3: Territory Scoring & Selection

**Status:** ready-for-dev
**Epic:** 1 - Territory-Based Conversation Steering (Conversation Experience Evolution)
**Priority:** High (required by pipeline orchestration in Story 1.7)

## User Story

As a developer,
I want pure functions that score all territories and select the best one based on coverage needs, energy fit, and freshness,
So that the system steers conversations toward under-explored territories at appropriate energy levels.

## Acceptance Criteria

**AC1: Coverage Value Computation**
**Given** a territory's expected facets and the current facet metrics from `computeFacetMetrics()`
**When** `computeCoverageValue()` is called
**Then** it returns the proportion of expected facets that are "thin" (below `MIN_EVIDENCE_THRESHOLD`, configurable via AppConfig, default: 3)
**And** it uses the existing `computeFacetMetrics()` output as input (wrapper pattern, not replacement)

**AC2: Freshness Bonus Computation**
**Given** a territory and the exchange history
**When** `computeFreshnessBonus()` is called
**Then** it returns `clamp(1.0 + (exchangesSinceLastVisit * 0.05), 0.8, 1.2)` -- capped at 1.2, neutral at 1.0 for just-visited, and 1.2 for never-visited territories

**AC3: Territory Score Computation**
**Given** coverage_value, energy_fit, and freshness_bonus for a territory
**When** `scoreTerritory()` is called
**Then** it returns `coverage_value * energy_fit * freshness_bonus`

**AC4: Score All Territories**
**Given** the full territory catalog, facet metrics, DRS, and visit history
**When** `scoreAllTerritories()` is called
**Then** it returns all territories ranked by score
**And** any territory with `visitCount >= MAX_TERRITORY_VISITS` (configurable via AppConfig, default: 2) receives a score of 0

**AC5: Select Territory**
**Given** ranked territories
**When** `selectTerritory()` is called
**Then** it returns the `SteeringOutput { territoryId }` for the highest-scoring territory
**And** territories at visit cap are excluded

**AC6: Unit Tests**
**Given** the scoring functions exist
**When** unit tests run at `packages/domain/src/utils/steering/__tests__/territory-scorer.test.ts`
**Then** tests cover: high-coverage territories deprioritized (FR5), freshness causes revisits (FR4), visit cap enforcement (FR18), and all-territories-capped edge case

## Tasks

### Task 1: Add Territory Scoring Configuration to AppConfig

- Add territory scoring fields to `AppConfigService` interface in `packages/domain/src/config/app-config.ts`:
  - `territoryMinEvidenceThreshold`: number (default: 3) -- minimum evidence count to consider a facet "covered"
  - `territoryMaxVisits`: number (default: 2) -- maximum times a territory can be visited per conversation
  - `territoryFreshnessRate`: number (default: 0.05) -- freshness bonus growth per exchange since last visit
  - `territoryFreshnessMin`: number (default: 0.8) -- minimum freshness bonus
  - `territoryFreshnessMax`: number (default: 1.2) -- maximum freshness bonus (capped per failure mode analysis)
- Update infrastructure AppConfig live implementation in `packages/infrastructure/src/config/app-config.live.ts` with env vars and defaults
- Update mock AppConfig in `packages/domain/src/config/__mocks__/app-config.ts` with defaults
- Update testing AppConfig in `packages/infrastructure/src/utils/test/app-config.testing.ts` with defaults

### Task 2: Create Territory Scorer Config Type

- Define `TerritoryScorerConfig` interface in `packages/domain/src/utils/steering/territory-scorer.ts`:
  - `minEvidenceThreshold: number`
  - `maxTerritoryVisits: number`
  - `freshnessRate: number`
  - `freshnessMin: number`
  - `freshnessMax: number`
- Define `extractTerritoryScorerConfig(config: AppConfigService): TerritoryScorerConfig` helper
- Define `TerritoryVisitHistory` type: `ReadonlyMap<TerritoryId, { visitCount: number; lastVisitExchange: number }>`
- Define `ScoredTerritory` type: `{ territory: Territory; score: number; coverageValue: number; energyFit: number; freshnessBonus: number }`

### Task 3: Implement `computeCoverageValue()`

- Function signature: `computeCoverageValue(territory: Territory, facetEvidenceCounts: ReadonlyMap<FacetName, number>, config: TerritoryScorerConfig): number`
- Accept `facetEvidenceCounts` (a map of facet name to raw evidence count) instead of `FacetMetrics` -- the threshold of 3 is a raw evidence count, not a 0-1 metric
- The caller builds `facetEvidenceCounts` from the evidence array before calling this function
- For each expected facet in the territory, check if evidence count is below `minEvidenceThreshold` (default: 3)
- Facets not present in the map are treated as having 0 evidence (always "thin")
- Return proportion of "thin" facets: `thinCount / territory.expectedFacets.length`
- Edge case: if territory has 0 expected facets, return 0
- Write failing test first, then implement

### Task 4: Implement `computeFreshnessBonus()`

- Function signature: `computeFreshnessBonus(territoryId: TerritoryId, visitHistory: TerritoryVisitHistory, currentExchange: number, config: TerritoryScorerConfig): number`
- If territory has never been visited, return `freshnessMax` (1.2)
- If territory has been visited, compute `exchangesSinceLastVisit = currentExchange - lastVisitExchange`
- Return `clamp(1.0 + (exchangesSinceLastVisit * freshnessRate), freshnessMin, freshnessMax)`
- Write failing test first, then implement

### Task 5: Implement `scoreTerritory()`

- Function signature: `scoreTerritory(coverageValue: number, energyFit: number, freshnessBonus: number): number`
- Return `coverageValue * energyFit * freshnessBonus`
- Pure multiplication, no clamping needed (inputs are already bounded)
- Write failing test first, then implement

### Task 6: Implement `scoreAllTerritories()`

- Function signature: `scoreAllTerritories(catalog: ReadonlyMap<TerritoryId, Territory>, facetEvidenceCounts: ReadonlyMap<FacetName, number>, drs: number, visitHistory: TerritoryVisitHistory, currentExchange: number, drsConfig: DRSConfig, scorerConfig: TerritoryScorerConfig): ScoredTerritory[]`
- Iterate all territories in catalog
- For each: compute coverageValue, energyFit (using `computeEnergyFit` from DRS module), freshnessBonus
- If `visitCount >= maxTerritoryVisits`, set score to 0
- Sort descending by score
- Return sorted array of ScoredTerritory
- Write failing test first, then implement

### Task 7: Implement `selectTerritory()`

- Function signature: `selectTerritory(scoredTerritories: ScoredTerritory[]): SteeringOutput`
- Return `{ territoryId: scoredTerritories[0].territory.id }` for the highest-scoring territory
- If all territories have score 0 (all capped), fall back to the territory with highest coverage_value regardless of visit cap
- Write failing test first, then implement

### Task 8: Export from Steering Index and Domain Package Index

- Export all new types and functions from `packages/domain/src/utils/steering/index.ts`
- Export all new types and functions from `packages/domain/src/index.ts`
- Verify typecheck passes across the monorepo

## Technical Notes

- All functions are pure -- no Effect dependencies, no side effects
- `computeFacetMetrics()` output is still used by the pipeline (wrapper pattern per architecture), but `computeCoverageValue` accepts raw evidence counts per facet rather than FacetMetrics, because the "thin" threshold (default: 3) is a raw evidence count, not a 0-1 metric like signalPower or confidence
- The caller (pipeline orchestration in Story 1.7) will build `facetEvidenceCounts` from the evidence array
- `computeEnergyFit()` from the DRS module (Story 21-2) is reused, not reimplemented
- `extractTerritoryScorerConfig()` follows the same pattern as `extractDRSConfig()` from Story 21-2
- Freshness cap at 1.2 (not 1.5) per failure mode analysis -- coverage must be the primary driver
- Also export a `buildFacetEvidenceCounts(evidence: EvidenceInput[]): ReadonlyMap<FacetName, number>` helper function for the pipeline to use

## Architect Notes

### Finding: Evidence Count vs signalPower for "Thin" Detection

**Issue:** The epic specifies `MIN_EVIDENCE_THRESHOLD` with a default of 3, which clearly refers to a raw evidence count (3 pieces of evidence per facet). However, `FacetMetrics.signalPower` is a 0-1 normalized value (V * D = volume saturation * normalized entropy). Using signalPower against a threshold of 3 would never match and break the formula.

**Resolution:** `computeCoverageValue` accepts `ReadonlyMap<FacetName, number>` (raw evidence counts per facet) instead of `Map<FacetName, FacetMetrics>`. A helper function `buildFacetEvidenceCounts(evidence: EvidenceInput[]): ReadonlyMap<FacetName, number>` is provided to build this map from raw evidence. This maintains the wrapper pattern (the pipeline still calls `computeFacetMetrics()` separately) while using the correct metric for thin detection.

**Files to modify:**
- `packages/domain/src/utils/steering/territory-scorer.ts` (new file -- all scoring functions)
- `packages/domain/src/utils/steering/index.ts` (export new functions)
- `packages/domain/src/index.ts` (re-export from domain package)
- `packages/domain/src/config/app-config.ts` (add territory config fields)
- `packages/domain/src/config/__mocks__/app-config.ts` (add mock defaults)
- `packages/infrastructure/src/config/app-config.live.ts` (add env var parsing)
- `packages/infrastructure/src/utils/test/app-config.testing.ts` (add test defaults)

**Patterns to follow:**
- `packages/domain/src/utils/steering/drs.ts` -- config extraction pattern, pure functions, clamp utility
- `packages/domain/src/utils/steering/__tests__/drs.test.ts` -- test pattern with inline config objects
