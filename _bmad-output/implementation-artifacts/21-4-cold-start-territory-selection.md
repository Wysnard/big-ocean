# Story 21-4: Cold-Start Territory Selection

**Status:** ready-for-dev
**Epic:** 1 - Territory-Based Conversation Steering (Conversation Experience Evolution)
**Priority:** High (required by pipeline orchestration in Story 1.7)

## User Story

As a developer,
I want a cold-start function that selects from curated light-energy territories for the first 3 messages,
So that new conversations begin with approachable, low-stakes topics before the scoring formula takes over.

## Acceptance Criteria

**AC1: Cold-Start Selection for Early Messages**
**Given** a conversation with fewer than 3 user messages
**When** territory selection is requested
**Then** the cold-start function selects from `COLD_START_TERRITORIES` using round-robin via message index
**And** the return type is `SteeringOutput { territoryId }` -- identical to the scoring path

**AC2: Handoff to Scoring Formula**
**Given** a conversation with 3 or more user messages
**When** territory selection is requested
**Then** the cold-start function is NOT used and the territory scoring formula from Story 21-3 takes over

**AC3: Configurable Cold-Start Threshold**
**Given** the cold-start message threshold
**When** it is referenced in code
**Then** it is sourced from AppConfig (default: 3), not hardcoded as a magic number

**AC4: Unit Tests**
**Given** the cold-start function exists
**When** unit tests run
**Then** tests verify: first 3 messages use COLD_START_TERRITORIES in round-robin order, message 4+ delegates to scoring, and the output shape matches SteeringOutput

## Tasks

### Task 1: Add Cold-Start Configuration to AppConfig

- Add `territoryColdStartThreshold` to `AppConfigService` interface in `packages/domain/src/config/app-config.ts`:
  - `territoryColdStartThreshold`: number (default: 3) -- number of user messages before scoring formula takes over
- Update infrastructure AppConfig live implementation in `packages/infrastructure/src/config/app-config.live.ts` with env var and default
- Update mock AppConfig in `packages/domain/src/config/__mocks__/app-config.ts` with default
- Update testing AppConfig in `packages/infrastructure/src/utils/test/app-config.testing.ts` with default

### Task 2: Implement Cold-Start Territory Selection Function

- Create `selectColdStartTerritory()` at `packages/domain/src/utils/steering/cold-start.ts`
- Function signature: `selectColdStartTerritory(messageIndex: number, coldStartTerritories: readonly TerritoryId[]): SteeringOutput`
- Round-robin selection: `coldStartTerritories[messageIndex % coldStartTerritories.length]`
- Returns `SteeringOutput { territoryId }` -- identical shape to scoring path
- Pure function, no Effect dependencies

### Task 3: Implement Gateway Function

- Create `selectTerritoryWithColdStart()` at `packages/domain/src/utils/steering/cold-start.ts`
- Function signature: `selectTerritoryWithColdStart(params: { messageCount: number; coldStartThreshold: number; coldStartTerritories: readonly TerritoryId[]; scoredTerritories: ScoredTerritory[]; }): SteeringOutput`
- If `messageCount < coldStartThreshold`, delegate to `selectColdStartTerritory(messageCount, coldStartTerritories)`
- If `messageCount >= coldStartThreshold`, delegate to `selectTerritory(scoredTerritories)` from territory-scorer
- Pure function, acts as the single entry point for territory selection

### Task 4: Write Unit Tests

- Create test file at `packages/domain/src/utils/steering/__tests__/cold-start.test.ts`
- Test `selectColdStartTerritory()`:
  - Message 0 returns COLD_START_TERRITORIES[0]
  - Message 1 returns COLD_START_TERRITORIES[1]
  - Message 2 returns COLD_START_TERRITORIES[2]
  - Round-robin wraps correctly (message 3 would return [0] if threshold were higher)
  - Output shape matches SteeringOutput
- Test `selectTerritoryWithColdStart()`:
  - Messages 0-2 use cold-start path
  - Message 3+ uses scoring path (delegates to selectTerritory)
  - Configurable threshold works (e.g., threshold=5 keeps cold-start for messages 0-4)

### Task 5: Export from Steering Index and Domain Package Index

- Export `selectColdStartTerritory` and `selectTerritoryWithColdStart` from `packages/domain/src/utils/steering/index.ts`
- Re-export from `packages/domain/src/index.ts`
- Verify typecheck passes across the monorepo

## Technical Notes

- All functions are pure -- no Effect dependencies, no side effects
- `COLD_START_TERRITORIES` is already defined in `packages/domain/src/constants/territory-catalog.ts` (Story 21-1)
- The gateway function (`selectTerritoryWithColdStart`) will be called by the pipeline orchestration (Story 1.7) as the single entry point for territory selection
- Round-robin uses message index modulo -- simple, deterministic, no randomness
- The cold-start threshold is configurable via AppConfig following the same pattern as other territory config values (Story 21-3)
- `selectTerritory()` from `territory-scorer.ts` (Story 21-3) is reused, not reimplemented
