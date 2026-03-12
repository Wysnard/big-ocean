# Story 23-2: Territory Catalog Evolution & Band Mapping

**Epic:** Epic 1 — Conversation State Foundation (Pacing Pipeline)
**Status:** ready-for-dev
**FRs covered:** FR3, FR17
**NFRs addressed:** NFR1
**Depends on:** Story 23-1 (Pipeline Domain Types) — uses `EnergyBand`, `TellingBand` types

## Story

As a developer,
I want the territory catalog evolved to 25 territories with continuous energy values and band-to-numeric mapping functions,
So that the scorer, Governor, and prompt builder have a complete, honest catalog to operate on.

## Acceptance Criteria

### AC1: Territory Catalog Evolution (25 Territories)

**Given** the existing territory catalog at `packages/domain/src/constants/territory-catalog.ts`
**When** the catalog is evolved
**Then** `TERRITORY_CATALOG` contains exactly 25 territories, each with:
- `id: TerritoryId` — branded string (e.g., `"daily-routines"`)
- `expectedEnergy: number` — continuous [0, 1] value (not categorical)
- `domains: readonly [LifeDomain, LifeDomain]` — exactly 2 domains per territory
- `expectedFacets: readonly FacetName[]` — 3-6 valid facet names per territory
- `opener: string` — natural conversation opener

**And** energy distribution follows: 9 light (0.20-0.37), 10 medium (0.38-0.53), 6 heavy (0.58-0.72)
**And** all 30 Big Five facets are covered across the catalog
**And** all domains appear in >= 6 territories

### AC2: Type Safety for Domains Tuple

**Given** the `Territory` interface uses `readonly` tuples for domains
**When** TypeScript compiles the catalog
**Then** any territory with fewer or more than 2 domains produces a compile error
**And** any territory referencing an invalid `FacetName` or `LifeDomain` produces a compile error

### AC3: Energy Band Mapping Function

**Given** band-to-numeric mapping functions at `packages/domain/src/utils/`
**When** `mapEnergyBand("steady")` is called
**Then** it returns `0.5`
**And** the full mapping is: `minimal=0.1, low=0.3, steady=0.5, high=0.7, very_high=0.9`

### AC4: Telling Band Mapping Function

**Given** band-to-numeric mapping functions
**When** `mapTellingBand("mixed")` is called
**Then** it returns `0.5`
**And** the full mapping is: `fully_compliant=0.0, mostly_compliant=0.25, mixed=0.5, mostly_self_propelled=0.75, strongly_self_propelled=1.0`

### AC5: Unit Tests for Band Mapping

**Given** the mapping functions
**When** unit tests run
**Then** all 5 energy bands and all 5 telling bands map to their correct [0, 1] values
**And** the functions are pure with no side effects

## Tasks

### Task 1: Evolve Territory Interface
- Update `Territory` interface in `packages/domain/src/types/territory.ts`:
  - Replace `energyLevel: EnergyLevel` with `expectedEnergy: number`
  - Change `domains` type from `readonly LifeDomain[]` to `readonly [LifeDomain, LifeDomain]` (exact 2-tuple)
  - Remove `ENERGY_LEVELS` constant and `EnergyLevel` type
- Update domain package index exports accordingly

### Task 2: Evolve Territory Catalog to 25 Territories
- Update `packages/domain/src/constants/territory-catalog.ts`:
  - Replace `territory()` helper to use `expectedEnergy: number` instead of `energyLevel`
  - Apply all 8 domain re-tags per design spec
  - Add 3 new territories: `daily-frustrations`, `growing-up`, `family-rituals`
  - Update all openers if needed (most stay the same)
  - Remove `COLD_START_TERRITORIES` (replaced by dynamic selection in scorer)
  - Remove `energyLevel`-related imports
- Update energy values per calibration table:
  - Light (9): daily-routines(0.20), creative-pursuits(0.25), weekend-adventures(0.25), learning-curiosity(0.25), family-rituals(0.28), social-circles(0.30), helping-others(0.30), comfort-zones(0.33), spontaneity-and-impulse(0.37)
  - Medium (10): daily-frustrations(0.38), work-dynamics(0.42), emotional-awareness(0.42), ambition-and-goals(0.43), growing-up(0.45), social-dynamics(0.46), friendship-depth(0.48), opinions-and-values(0.49), team-and-leadership(0.49), giving-and-receiving(0.53)
  - Heavy (6): family-bonds(0.58), conflict-and-resolution(0.59), identity-and-purpose(0.63), inner-struggles(0.65), vulnerability-and-trust(0.70), pressure-and-resilience(0.72)

### Task 3: Create Band-to-Numeric Mapping Functions
- Create `packages/domain/src/utils/band-mapping.ts` with:
  - `mapEnergyBand(band: EnergyBand): number` — pure function, deterministic
  - `mapTellingBand(band: TellingBand): number` — pure function, deterministic
- Energy mapping: minimal=0.1, low=0.3, steady=0.5, high=0.7, very_high=0.9
- Telling mapping: fully_compliant=0.0, mostly_compliant=0.25, mixed=0.5, mostly_self_propelled=0.75, strongly_self_propelled=1.0
- Export from `packages/domain/src/utils/index.ts`
- Re-export from `packages/domain/src/index.ts`
- Note: `EnergyBand` and `TellingBand` types are from Story 23-1. If not yet defined, define them locally or import from pacing types.

### Task 4: Update Territory Catalog Tests
- Update `packages/domain/src/constants/__tests__/territory-catalog.test.ts`:
  - Change count assertion from 22 to 25
  - Replace energyLevel assertions with expectedEnergy range checks
  - Assert exactly 2 domains per territory
  - Assert all domains appear in >= 6 territories
  - Assert energy distribution: 9 light, 10 medium, 6 heavy
  - Remove COLD_START_TERRITORIES tests
  - Keep facet coverage, facet count, opener, and ID match tests

### Task 5: Write Band Mapping Tests
- Create `packages/domain/src/utils/__tests__/band-mapping.test.ts`:
  - Test all 5 energy band mappings
  - Test all 5 telling band mappings
  - Verify return types are numbers in [0, 1]

### Task 6: Fix Downstream Consumers
- Search for all references to `energyLevel`, `EnergyLevel`, `ENERGY_LEVELS`, `COLD_START_TERRITORIES` across the codebase
- Update or remove references as needed
- Ensure all imports compile correctly

## Technical Notes

- The 25-territory catalog with calibrated energy values comes from the Territory Catalog Migration Spec (`_bmad-output/problem-solution-2026-03-08.md`)
- `EnergyBand` and `TellingBand` types may need to be defined in this story if Story 23-1 hasn't been implemented yet. They should live in `packages/domain/src/types/` per the pacing pipeline type conventions.
- The `COLD_START_TERRITORIES` export is used in existing steering code — must verify all consumers are updated.
- Domain package exports must be updated in `packages/domain/src/index.ts` to add new exports and remove deprecated ones.
