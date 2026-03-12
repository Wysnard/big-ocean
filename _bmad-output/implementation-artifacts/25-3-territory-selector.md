# Story 25-3: Territory Selector

Status: ready-for-dev

## Story

As a developer,
I want a pure function that picks a territory from the scorer's ranked list via deterministic rules,
So that territory selection is predictable, debuggable, and varies only by turn position.

## Acceptance Criteria

1. **Given** a `selectTerritory()` pure function at `packages/domain/src/utils/steering/territory-selector.ts`
   **When** called with `TerritoryScorerOutput`
   **Then** it applies one of three selection rules based on turn position

2. **Given** turn 1 (cold start)
   **When** selection is requested
   **Then** `selectionRule = "cold-start-perimeter"`: take top score, include all territories within `COLD_START_PERIMETER` of top score, random pick from pool using a deterministic seed
   **And** `selectionSeed` is set to the hashed seed value (non-null)

3. **Given** turns 2-24 (steady state)
   **When** selection is requested
   **Then** `selectionRule = "argmax"`: deterministic top-1 from ranked list
   **And** tiebreak: catalog order (lower index wins)
   **And** `selectionSeed` is undefined

4. **Given** turn 25 (finale)
   **When** selection is requested
   **Then** `selectionRule = "argmax"`: same as steady-state — closing behavior lives in the Governor (`intent: "amplify"`), not the selector

5. **Given** the selector output
   **When** a territory is selected
   **Then** `TerritorySelectorOutput` contains:
   - `selectedTerritory: TerritoryId` — the one field the Governor consumes
   - `selectionRule` — which code path was used
   - `selectionSeed` — non-null only on cold-start
   - `scorerOutput` — full ranked list for debug/replay

6. **Given** derived annotations
   **When** the selector completes
   **Then** `sessionPhase` is derived: turn 1 -> `"opening"`, turn 25 -> `"closing"`, else -> `"exploring"`
   **And** `transitionType` is derived: selectedTerritory === currentTerritory -> `"continue"`, else -> `"transition"`
   **And** these are observability annotations only — not part of the inter-layer contract

7. **Given** unit tests at `packages/domain/src/utils/steering/__tests__/territory-selector.test.ts`
   **When** tests run
   **Then** tests cover:
   - Turn 1: cold-start-perimeter selects from pool within perimeter of top score
   - Turn 1: same seed produces same selection (deterministic)
   - Turn 12: argmax selects top-1
   - Turn 12: tiebreak uses catalog order
   - Turn 25: argmax (same as steady-state)
   - Derived annotations: sessionPhase and transitionType computed correctly

## Tasks / Subtasks

- [ ] Task 1: Implement `selectTerritoryV2()` pure function (AC: #1, #2, #3, #4, #5)
  - [ ] 1.1: Create `packages/domain/src/utils/steering/territory-selector.ts` with `selectTerritoryV2()` accepting `TerritoryScorerOutput` and optional seed input
  - [ ] 1.2: Implement cold-start-perimeter path (turn 1): compute perimeter pool from top score, deterministic random pick using seeded hash
  - [ ] 1.3: Implement argmax path (turns 2-25): select top-1 from ranked list (tiebreak by catalog order, already sorted)
  - [ ] 1.4: Return `TerritorySelectorOutput` with selectedTerritory, selectionRule, selectionSeed, and scorerOutput
  - [ ] 1.5: Export `COLD_START_PERIMETER` constant for configurability

- [ ] Task 2: Implement derived annotations (AC: #6)
  - [ ] 2.1: Add `deriveSessionPhase()` function: turn 1 -> "opening", totalTurns -> "closing", else -> "exploring"
  - [ ] 2.2: Add `deriveTransitionType()` function: selectedTerritory === currentTerritory -> "continue", else -> "transition"
  - [ ] 2.3: Add `SessionPhase` and `TransitionType` literal union types
  - [ ] 2.4: Add annotations to `TerritorySelectorOutput` as optional observability fields

- [ ] Task 3: Export from barrel files
  - [ ] 3.1: Export `selectTerritoryV2`, `deriveSessionPhase`, `deriveTransitionType`, `COLD_START_PERIMETER` from `packages/domain/src/utils/steering/index.ts`

- [ ] Task 4: Write unit tests (AC: #7)
  - [ ] 4.1: Create `packages/domain/src/utils/steering/__tests__/territory-selector.test.ts`
  - [ ] 4.2: Test cold-start-perimeter: pool includes all territories within COLD_START_PERIMETER of top score
  - [ ] 4.3: Test cold-start determinism: same seed produces same selection
  - [ ] 4.4: Test argmax: selects top-1 from ranked list (turn 12)
  - [ ] 4.5: Test tiebreak: catalog order (lower index wins) when scores are equal
  - [ ] 4.6: Test turn 25: uses argmax (same as steady-state)
  - [ ] 4.7: Test derived annotations: sessionPhase and transitionType computed correctly
  - [ ] 4.8: Test edge case: single territory in ranked list
  - [ ] 4.9: Test edge case: all territories within perimeter on cold start
