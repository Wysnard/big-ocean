# Story 23-1: Pipeline Domain Types

**Status:** ready-for-dev

**Epic:** Epic 1 — Conversation State Foundation (Conversation Pacing Pipeline)

## Story

As a developer,
I want all conversation pacing pipeline types defined in the domain package,
So that every layer of the pipeline has compile-time-safe contracts to build against.

## Acceptance Criteria

### AC1: All pipeline types defined and exported

**Given** the domain package at `packages/domain/src/types/`
**When** pacing pipeline types are created
**Then** the following types are defined and exported:

- `EnergyBand` — `"minimal" | "low" | "steady" | "high" | "very_high"` literal union
- `TellingBand` — `"fully_compliant" | "mostly_compliant" | "mixed" | "mostly_self_propelled" | "strongly_self_propelled"` literal union
- `EntryPressure` — `"direct" | "angled" | "soft"` literal union
- `ConversationalIntent` — `"open" | "explore" | "amplify"` literal union
- `ObservationFocus` — tagged discriminated union with 4 variants: `RelateFocus` (`type: "relate"`), `NoticingFocus` (`type: "noticing"`, `domain: LifeDomain`), `ContradictionFocus` (`type: "contradiction"`, `target: ContradictionTarget`), `ConvergenceFocus` (`type: "convergence"`, `target: ConvergenceTarget`)
- `ContradictionTarget` — `{ facet: FacetName, pair: [DomainScore, DomainScore], strength: number }`
- `ConvergenceTarget` — `{ facet: FacetName, domains: DomainScore[], strength: number }` (3+ domains)
- `DomainScore` — `{ domain: LifeDomain, score: number, confidence: number }`
- `PromptBuilderInput` — discriminated union on `intent`: `open` (territory only), `explore` (territory + entryPressure + observationFocus), `amplify` (territory + `"direct"` + observationFocus)
- `MoveGovernorDebug` — `{ intent, isFinalTurn, entryPressure: EntryPressureDebug, observationGating: ObservationGatingDebug }`
- `ObservationGatingDebug` — `{ mode, phase, threshold, sharedFireCount, candidates: ObservationCandidate[], winner, mutualExclusionApplied }`
- `TerritoryScorerOutput` — `{ ranked: Array<{ territoryId, score, breakdown: { coverageGain, adjacency, skew, malus, freshness } }>, currentTerritory, turnNumber, totalTurns }`
- `TerritorySelectorOutput` — `{ selectedTerritory: TerritoryId, selectionRule, selectionSeed, scorerOutput }`

**And** all types use existing branded types (`TerritoryId`, `FacetName`, `LifeDomain`) from the domain package
**And** all new types are re-exported from the domain package index

### AC2: PromptBuilderInput compile-time safety

**Given** the `PromptBuilderInput` type
**When** a consumer constructs a value with `intent: "open"` and includes `entryPressure`
**Then** TypeScript produces a compile error — `open` intent carries only `territory`

### AC3: ObservationFocus discriminated union narrowing

**Given** the `ObservationFocus` type
**When** a consumer pattern-matches on the `type` discriminant
**Then** TypeScript narrows to the correct variant with its specific fields (e.g., `NoticingFocus` narrows to include `domain`)

## Tasks

### Task 1: Define literal union types

Create `packages/domain/src/types/pacing.ts` with:
- `ENERGY_BANDS` const array and `EnergyBand` type
- `TELLING_BANDS` const array and `TellingBand` type
- `ENTRY_PRESSURES` const array and `EntryPressure` type
- `CONVERSATIONAL_INTENTS` const array and `ConversationalIntent` type

### Task 2: Define DomainScore and observation target types

In the same file, define:
- `DomainScore` interface with `domain: LifeDomain`, `score: number`, `confidence: number`
- `ContradictionTarget` interface with `facet: FacetName`, `pair: readonly [DomainScore, DomainScore]`, `strength: number`
- `ConvergenceTarget` interface with `facet: FacetName`, `domains: readonly DomainScore[]`, `strength: number`

### Task 3: Define ObservationFocus discriminated union

Define 4 tagged variants:
- `RelateFocus` — `{ readonly type: "relate" }`
- `NoticingFocus` — `{ readonly type: "noticing"; readonly domain: LifeDomain }`
- `ContradictionFocus` — `{ readonly type: "contradiction"; readonly target: ContradictionTarget }`
- `ConvergenceFocus` — `{ readonly type: "convergence"; readonly target: ConvergenceTarget }`
- `ObservationFocus` — union of all 4

### Task 4: Define PromptBuilderInput discriminated union

Define 3 tagged variants:
- `OpenPromptInput` — `{ readonly intent: "open"; readonly territory: TerritoryId }`
- `ExplorePromptInput` — `{ readonly intent: "explore"; readonly territory: TerritoryId; readonly entryPressure: EntryPressure; readonly observationFocus: ObservationFocus }`
- `AmplifyPromptInput` — `{ readonly intent: "amplify"; readonly territory: TerritoryId; readonly entryPressure: "direct"; readonly observationFocus: ObservationFocus }`
- `PromptBuilderInput` — union of all 3

### Task 5: Define debug and scorer output types

Define:
- `ObservationCandidate` — `{ readonly focus: ObservationFocus; readonly strength: number }`
- `EntryPressureDebug` — `{ readonly level: EntryPressure; readonly eTarget: number; readonly expectedEnergy: number; readonly gap: number }`
- `ObservationGatingDebug` — full debug type per AC1
- `MoveGovernorDebug` — full debug type per AC1
- `TerritoryScoreBreakdown` — `{ readonly coverageGain: number; readonly adjacency: number; readonly skew: number; readonly malus: number; readonly freshness: number }`
- `RankedTerritory` — `{ readonly territoryId: TerritoryId; readonly score: number; readonly breakdown: TerritoryScoreBreakdown }`
- `TerritoryScorerOutput` — full type per AC1
- `TerritorySelectorOutput` — full type per AC1

### Task 6: Export from domain package index

Add all new types to `packages/domain/src/index.ts` exports.

### Task 7: Write tests

Create `packages/domain/src/types/__tests__/pacing.test.ts` with:
- Tests verifying const array values and lengths
- Type-level tests for discriminated union narrowing (ObservationFocus)
- Type-level tests for PromptBuilderInput compile-time safety
- Runtime construction tests for all major types

## Technical Notes

- Follow existing patterns in `packages/domain/src/types/territory.ts` and `packages/domain/src/types/evidence.ts`
- Use `as const` arrays for literal unions (same pattern as `ENERGY_LEVELS`, `LIFE_DOMAINS`)
- All interfaces should use `readonly` fields (project convention)
- Use existing branded types: `TerritoryId` from `./territory`, `FacetName` from `../constants/big-five`, `LifeDomain` from `../constants/life-domain`
- No Effect Schema needed for these types — they are plain TypeScript types (Schema will be added in later stories when persistence is needed)

## Dependencies

- None (this is the foundational story for the pacing pipeline)

## Definition of Done

- All types compile without errors
- All types are exported from domain package index
- Tests pass verifying type correctness
- PromptBuilderInput enforces intent-specific fields at compile time
- ObservationFocus narrows correctly on `type` discriminant
