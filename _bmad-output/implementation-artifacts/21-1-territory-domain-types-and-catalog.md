# Story 21-1: Territory Domain Types & Catalog

**Status:** ready-for-dev
**Epic:** 1 - Territory-Based Conversation Steering (Conversation Experience Evolution)
**Priority:** High (foundation for all subsequent territory stories)

## User Story

As a developer,
I want a typed territory catalog with branded IDs, energy levels, domain mappings, expected facets, and openers,
So that the territory system has a compile-time-safe foundation for all scoring and prompt logic.

## Acceptance Criteria

**AC1: Territory Types**
**Given** the domain package exists
**When** territory types are created at `packages/domain/src/types/territory.ts`
**Then** `TerritoryId` is a branded string type, `EnergyLevel` is `"light" | "medium" | "heavy"`, and `Territory` interface has fields: `id`, `energyLevel`, `domains` (readonly `LifeDomain[]`), `expectedFacets` (readonly `FacetName[]`), `opener` (string)

**AC2: SteeringOutput Type**
**Given** the territory types exist
**When** `SteeringOutput` is created at `packages/domain/src/types/steering.ts`
**Then** `SteeringOutput` contains only `{ readonly territoryId: TerritoryId }` -- no other fields

**AC3: Territory Catalog**
**Given** the territory and steering types exist
**When** the territory catalog is created at `packages/domain/src/constants/territory-catalog.ts`
**Then** `TERRITORY_CATALOG` contains exactly 22 territories, each with 3-6 expected facets referencing valid `FacetName` values, 1-3 `LifeDomain` values, one of three energy levels, and a conversation opener string
**And** `COLD_START_TERRITORIES` is exported as an array of 3 `TerritoryId` values referencing light-energy territories suitable as conversation openers

**AC4: Compile-Time Safety**
**Given** the catalog is defined
**When** TypeScript compiles the project
**Then** any territory referencing an invalid `FacetName` or `LifeDomain` produces a compile error
**And** all new types and constants are re-exported from the domain package index

## Tasks

### Task 1: Create Territory Types (`packages/domain/src/types/territory.ts`)
- Define `EnergyLevel` as `"light" | "medium" | "heavy"` union type
- Define `ENERGY_LEVELS` as const array for runtime validation
- Define `TerritoryId` as an Effect branded string type (using `S.String.pipe(S.brand("TerritoryId"))`)
- Define `Territory` interface with fields:
  - `id: TerritoryId`
  - `energyLevel: EnergyLevel`
  - `domains: readonly LifeDomain[]`
  - `expectedFacets: readonly FacetName[]`
  - `opener: string`
- Write unit tests at `packages/domain/src/types/__tests__/territory.test.ts`:
  - TerritoryId branded type accepts strings via schema decode
  - EnergyLevel union accepts valid values, rejects invalid
  - Territory interface enforces field types at compile time

### Task 2: Create SteeringOutput Type (`packages/domain/src/types/steering.ts`)
- Define `SteeringOutput` interface with single field: `{ readonly territoryId: TerritoryId }`
- Write unit test verifying SteeringOutput shape

### Task 3: Create Territory Catalog (`packages/domain/src/constants/territory-catalog.ts`)
- Define 22 territories covering all 30 facets across diverse life domains
- Each territory has:
  - Unique `TerritoryId` (descriptive slug, e.g., "creative-pursuits", "social-dynamics")
  - `energyLevel`: one of "light", "medium", "heavy"
  - `domains`: 1-3 `LifeDomain` values
  - `expectedFacets`: 3-6 valid `FacetName` values
  - `opener`: Conversation opener string
- Export `TERRITORY_CATALOG` as `ReadonlyMap<TerritoryId, Territory>`
- Export `COLD_START_TERRITORIES` as array of 3 `TerritoryId` values (all light-energy)
- Export helper `getTerritoryById(id: TerritoryId): Territory | undefined`
- Write unit tests at `packages/domain/src/constants/__tests__/territory-catalog.test.ts`:
  - Catalog contains exactly 22 territories
  - Each territory has 3-6 expected facets
  - Each territory has 1-3 domains
  - All expectedFacets are valid FacetName values
  - All domains are valid LifeDomain values
  - All 30 facets are covered across the full catalog
  - COLD_START_TERRITORIES contains exactly 3 light-energy territory IDs
  - COLD_START_TERRITORIES IDs exist in the catalog
  - getTerritoryById returns correct territory
  - getTerritoryById returns undefined for invalid ID

### Task 4: Re-export from Domain Package Index
- Add exports for territory types to `packages/domain/src/index.ts`
- Add exports for steering types to `packages/domain/src/index.ts`
- Add exports for territory catalog to `packages/domain/src/index.ts`
- Verify typecheck passes

## Technical Notes

- Follow existing branded type pattern from `packages/domain/src/schemas/ocean-code.ts` (S.String.pipe + S.brand)
- Follow existing constant pattern from `packages/domain/src/constants/life-domain.ts` (as const arrays)
- Territory IDs are stored as snapshot strings (not FK) per architecture requirement -- survives catalog evolution
- `satisfies` keyword should be used on catalog entries to get compile-time type checking while preserving literal types
- EnergyLevel is a new concept distinct from existing domain types
- The 22 territories should cover all 5 Big Five traits with good facet distribution

## Dependencies

- None (this is a foundation story with no dependencies on other stories)

## Out of Scope

- Territory scoring formulas (Story 1.2, 1.3)
- DRS computation (Story 1.2)
- Pipeline integration (Story 1.7)
- Schema migration for assessment_messages (Story 1.6)
