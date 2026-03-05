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

- Function signature: `computeCoverageValue(territory: Territory, facetMetrics: Map<FacetName, FacetMetrics>, config: TerritoryScorerConfig): number`
- For each expected facet in the territory, check if it exists in facetMetrics and has `signalPower` below `minEvidenceThreshold`
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

- Function signature: `scoreAllTerritories(catalog: ReadonlyMap<TerritoryId, Territory>, facetMetrics: Map<FacetName, FacetMetrics>, drs: number, visitHistory: TerritoryVisitHistory, currentExchange: number, drsConfig: DRSConfig, scorerConfig: TerritoryScorerConfig): ScoredTerritory[]`
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
- `computeFacetMetrics()` is used as input, not replaced (wrapper pattern per architecture)
- `signalPower` from `FacetMetrics` is the metric used for "thin" detection -- it represents the weighted evidence density for a facet
- `computeEnergyFit()` from the DRS module (Story 21-2) is reused, not reimplemented
- `extractTerritoryScorerConfig()` follows the same pattern as `extractDRSConfig()` from Story 21-2
- Freshness cap at 1.2 (not 1.5) per failure mode analysis -- coverage must be the primary driver
