# Story 21-2: Depth Readiness Score (DRS)

**Status:** ready-for-dev
**Epic:** 1 - Territory-Based Conversation Steering (Conversation Experience Evolution)
**Priority:** High (required by territory scoring in Story 1.3)

## User Story

As a developer,
I want a pure function that computes the Depth Readiness Score from facet coverage, engagement signals, and observed energy history,
So that the system has a single metric driving conversation energy pacing.

## Acceptance Criteria

**AC1: DRS Computation**
**Given** a set of covered facet count, last 3 message word counts, last 3 evidence-per-message counts, and last 3 observed energy levels
**When** `computeDRS()` is called at `packages/domain/src/utils/steering/drs.ts`
**Then** it returns a DRS value between 0 and 1 computed as `(0.55 * Breadth + 0.45 * Engagement) * EnergyMultiplier`
**And** Breadth = `clamp((coveredFacets - 10) / 15, 0, 1)`
**And** Engagement word component = `clamp(avgWordCountLast3 / 120, 0, 1)`, evidence component = `clamp(avgEvidencePerMsgLast3 / 6, 0, 1)`, combined as `clamp(0.55 * word + 0.45 * evid, 0, 1)`
**And** EnergyMultiplier uses recency weights `[1.0, 0.6, 0.3]` with energy weights `{ light: 0, medium: 1, heavy: 2 }`, computed as `clamp(1 - energyPressure, 0, 1)`

**AC2: Energy Fit Computation**
**Given** a DRS value and a territory energy level
**When** `computeEnergyFit()` is called
**Then** it returns the energy_fit value using asymmetric curves: `lightFit = clamp((0.55 - DRS) / 0.35, 0, 1)`, `mediumFit = 1 - clamp(abs(DRS - 0.55) / 0.35, 0, 1)`, `heavyFit = clamp((DRS - 0.65) / 0.25, 0, 1)`

**AC3: AppConfig Integration**
**Given** all DRS formula parameters (breadth weight, engagement thresholds, recency weights, energy_fit curve parameters)
**When** these values are referenced in the code
**Then** they are sourced from AppConfig, not hardcoded as magic numbers

**AC4: Unit Tests**
**Given** the DRS functions exist
**When** unit tests run at `packages/domain/src/utils/steering/__tests__/drs.test.ts`
**Then** snapshot tests cover: early conversation (DRS ~0.1-0.3 favors light), mid conversation (DRS ~0.4-0.6 favors medium), late conversation (DRS ~0.7+ favors heavy), recovery after heavy (energy pressure drops DRS), and edge cases (no messages yet, all heavy history)

## Tasks

### Task 1: Add DRS Configuration to AppConfig

- Add DRS-related configuration fields to `AppConfigService` interface in `packages/domain/src/config/app-config.ts`:
  - `drsBreadthWeight`: number (default: 0.55)
  - `drsEngagementWeight`: number (default: 0.45)
  - `drsBreadthOffset`: number (default: 10)
  - `drsBreadthRange`: number (default: 15)
  - `drsWordCountThreshold`: number (default: 120)
  - `drsEvidenceThreshold`: number (default: 6)
  - `drsEngagementWordWeight`: number (default: 0.55)
  - `drsEngagementEvidenceWeight`: number (default: 0.45)
  - `drsRecencyWeights`: readonly number[] (default: [1.0, 0.6, 0.3])
  - `drsEnergyWeightLight`: number (default: 0)
  - `drsEnergyWeightMedium`: number (default: 1)
  - `drsEnergyWeightHeavy`: number (default: 2)
  - `drsLightFitCenter`: number (default: 0.55)
  - `drsLightFitRange`: number (default: 0.35)
  - `drsMediumFitCenter`: number (default: 0.55)
  - `drsMediumFitRange`: number (default: 0.35)
  - `drsHeavyFitCenter`: number (default: 0.65)
  - `drsHeavyFitRange`: number (default: 0.25)
- Update mock AppConfig in `packages/domain/src/config/__mocks__/app-config.ts` with defaults

### Task 2: Create DRS Input Type and Core Functions (`packages/domain/src/utils/steering/drs.ts`)

- Define `DRSInput` interface:
  - `coveredFacets: number`
  - `lastWordCounts: readonly number[]` (last 3 message word counts)
  - `lastEvidenceCounts: readonly number[]` (last 3 evidence-per-message counts)
  - `lastEnergyLevels: readonly EnergyLevel[]` (last 3 observed energy levels)
- Implement `computeBreadth(coveredFacets: number, config: DRSConfig): number`
- Implement `computeEngagement(wordCounts: readonly number[], evidenceCounts: readonly number[], config: DRSConfig): number`
- Implement `computeEnergyMultiplier(energyLevels: readonly EnergyLevel[], config: DRSConfig): number`
- Implement `computeDRS(input: DRSInput, config: DRSConfig): number`
  - Returns `(breadthWeight * Breadth + engagementWeight * Engagement) * EnergyMultiplier`
  - All intermediate values clamped to [0, 1]
  - Gracefully handles arrays shorter than 3 (early conversation)

### Task 3: Create Energy Fit Function

- Implement `computeEnergyFit(drs: number, energyLevel: EnergyLevel, config: DRSConfig): number`
  - `lightFit = clamp((lightFitCenter - DRS) / lightFitRange, 0, 1)`
  - `mediumFit = 1 - clamp(abs(DRS - mediumFitCenter) / mediumFitRange, 0, 1)`
  - `heavyFit = clamp((DRS - heavyFitCenter) / heavyFitRange, 0, 1)`
  - Returns the fit value for the given energy level

### Task 4: Extract DRS Config from AppConfig

- Define `DRSConfig` interface that groups all DRS-related config fields
- Implement `extractDRSConfig(config: AppConfigService): DRSConfig` helper
- This keeps the DRS functions pure (accept config as parameter, not Effect dependency)

### Task 5: Re-export from Steering Index and Domain Package Index

- Export DRS functions and types from `packages/domain/src/utils/steering/index.ts`
- Export DRS functions and types from `packages/domain/src/index.ts`
- Verify typecheck passes

### Task 6: Write Unit Tests (`packages/domain/src/utils/steering/__tests__/drs.test.ts`)

- Test `computeBreadth`:
  - 0 covered facets -> 0 (below offset)
  - 10 covered facets -> 0 (at offset)
  - 17 covered facets -> ~0.47
  - 25+ covered facets -> 1.0 (capped)
- Test `computeEngagement`:
  - Empty arrays -> 0 (no messages yet)
  - Low word counts and evidence -> low engagement
  - High word counts and evidence -> high engagement (capped at 1.0)
  - Arrays shorter than 3 elements handled gracefully
- Test `computeEnergyMultiplier`:
  - All light energy -> multiplier = 1.0 (no pressure)
  - All heavy energy -> multiplier near 0 (high pressure)
  - Mixed energy levels -> intermediate multiplier
  - Empty array -> multiplier = 1.0
- Test `computeDRS`:
  - Early conversation (few facets, short messages, light energy) -> DRS ~0.1-0.3
  - Mid conversation (moderate facets, decent messages, mixed energy) -> DRS ~0.4-0.6
  - Late conversation (many facets, long messages, some heavy) -> DRS ~0.7+
  - Recovery after heavy (energy pressure drops DRS)
  - Edge case: no messages yet -> DRS near 0
  - Edge case: all heavy history -> DRS suppressed to near 0
- Test `computeEnergyFit`:
  - Low DRS (0.1) -> light fit high, heavy fit 0
  - Mid DRS (0.55) -> medium fit high, light and heavy lower
  - High DRS (0.8) -> heavy fit high, light fit 0
  - Boundary values at curve transitions

## Technical Notes

- All functions are pure (no Effect dependencies) -- they accept config as a parameter
- Follow existing pattern from `packages/domain/src/utils/formula.ts` for pure function style
- DRS wraps/uses output from `computeFacetMetrics()` (covered facet count) but does not call it directly -- the caller provides the count
- `clamp` utility: `Math.max(lower, Math.min(upper, value))`
- EnergyMultiplier normalization denominator: `sum(recencyWeights) * maxEnergyWeight = (1.0 + 0.6 + 0.3) * 2 = 3.8`
- Arrays shorter than 3 elements: use available data only, adjusting recency weights accordingly
- All configurable values via AppConfig per architecture requirement -- no magic numbers

## Dependencies

- Story 21-1: Territory Domain Types & Catalog (provides `EnergyLevel` type) -- DONE

## Out of Scope

- Territory scoring formula (Story 1.3)
- Cold-start selection (Story 1.4)
- Pipeline integration (Story 1.7)
- ConversAnalyzer energy classification (Story 1.6)
