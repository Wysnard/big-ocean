# Story 26-3: Move Governor

Status: ready-for-dev

## Story

As a developer,
I want a Governor that derives conversational intent, computes entry pressure, and wires observation gating to produce PromptBuilderInput,
So that Nerin receives exactly the behavioral constraints it needs without knowing about scoring, pacing, or coverage.

## Acceptance Criteria

1. **Given** a `computeGovernorOutput()` function at `packages/domain/src/utils/steering/move-governor.ts` **When** called with selectedTerritory (TerritoryId), E_target (number), turnNumber, isFinalTurn, observation gating input data, and previous territory ID (or null) **Then** it produces `{ output: PromptBuilderInput, debug: MoveGovernorDebug }`

2. **Given** intent derivation **When** `turnNumber === 1` **Then** intent = `"open"` — PromptBuilderInput carries territory only (no entryPressure, no observationFocus)

3. **Given** intent derivation **When** `isFinalTurn === true` **Then** intent = `"amplify"` — entryPressure is always `"direct"`, observationFocus from raw strength competition (amplify mode gating via `evaluateObservationGating`)

4. **Given** intent derivation **When** `turnNumber > 1` and not final turn and an observation focus fires (non-Relate) **Then** intent = `"explore"` with full entryPressure + observationFocus from gated competition

5. **Given** intent derivation **When** `turnNumber > 1` and not final turn and no observation fires **Then** intent = `"explore"` with entryPressure and observationFocus = Relate (default)

6. **Given** entry pressure calibration **When** the gap between E_target and territory expectedEnergy is computed **Then**:
   - `"direct"` — gap <= 0.15 (territory energy within comfortable range of E_target)
   - `"angled"` — gap > 0.15 and <= 0.30 (moderate gap)
   - `"soft"` — gap > 0.30 (territory significantly exceeds E_target)
   - Always `"direct"` on `open` and `amplify` intents

7. **Given** no E_target is available (null/undefined) **When** entry pressure is computed **Then** it defaults to `"direct"`

8. **Given** the Governor output **When** persisted **Then** territories are stored as `TerritoryId` (not full objects) — pipeline resolves from catalog when reading back (derive-at-read)

9. **Given** the `MoveGovernorDebug` output **When** returned alongside `PromptBuilderInput` **Then** it contains: intent, isFinalTurn, entryPressure debug (level, eTarget, expectedEnergy, gap), and observation gating debug (from `evaluateObservationGating`)

10. **Given** the Governor wires observation gating **When** in explore mode **Then** it calls `evaluateObservationGating()` from Story 26-2 with mode="explore" and forwards pre-computed raw strengths, phase, and shared fire count

11. **Given** the Governor wires observation gating **When** in amplify mode **Then** it calls `evaluateObservationGating()` with mode="amplify" and forwards raw strengths (no phase gating)

12. **Given** unit tests at `packages/domain/src/utils/steering/__tests__/move-governor.test.ts` **When** tests run **Then** tests cover:
    - Turn 1: intent=open, no entryPressure, no observationFocus
    - Turn 12: intent=explore, entryPressure computed from gap, observationFocus from gating
    - Turn 25 (final): intent=amplify, entryPressure=direct, observationFocus from raw competition
    - Entry pressure: small gap -> direct, moderate -> angled, large -> soft
    - Entry pressure: null E_target -> direct
    - MoveGovernorDebug contains full diagnostics
    - Governor does NOT read portrait readiness

## Tasks / Subtasks

- [ ] Task 1: Define `MoveGovernorInput` type and `computeEntryPressure()` (AC: #1, #6, #7)
  - [ ] 1.1: Define `MoveGovernorInput` interface with: `selectedTerritory: TerritoryId`, `eTarget: number | null`, `turnNumber: number`, `isFinalTurn: boolean`, `expectedEnergy: number`, `previousTerritory: TerritoryId | null`, plus all fields needed for observation gating input (raw strengths, phase, sharedFireCount, target data)
  - [ ] 1.2: Define entry pressure thresholds as named constants: `ENTRY_PRESSURE_MODERATE_GAP = 0.15`, `ENTRY_PRESSURE_LARGE_GAP = 0.30`
  - [ ] 1.3: Implement `computeEntryPressure(eTarget: number | null, expectedEnergy: number): EntryPressureDebug` — pure function returning level + debug
  - [ ] 1.4: Write tests for entry pressure: direct (small gap), angled (moderate gap), soft (large gap), null E_target -> direct

- [ ] Task 2: Implement `deriveIntent()` (AC: #2, #3, #4, #5)
  - [ ] 2.1: Implement `deriveIntent(turnNumber: number, isFinalTurn: boolean): ConversationalIntent`
  - [ ] 2.2: Turn 1 -> "open", isFinalTurn -> "amplify", otherwise -> "explore"
  - [ ] 2.3: Write tests for intent derivation: turn 1, mid-conversation, final turn

- [ ] Task 3: Implement `computeGovernorOutput()` orchestrator (AC: #1, #8, #9, #10, #11)
  - [ ] 3.1: Implement `computeGovernorOutput(input: MoveGovernorInput): MoveGovernorResult` that:
    1. Derives intent via `deriveIntent()`
    2. For `open`: returns `OpenPromptInput` with territory only, skips entry pressure and gating
    3. For `explore`: computes entry pressure, calls `evaluateObservationGating()` in explore mode, returns `ExplorePromptInput`
    4. For `amplify`: sets entry pressure to "direct", calls `evaluateObservationGating()` in amplify mode, returns `AmplifyPromptInput`
  - [ ] 3.2: Return `MoveGovernorDebug` with full diagnostics alongside `PromptBuilderInput`
  - [ ] 3.3: Write tests for full orchestration:
    - Turn 1 (open): only territory in output, no entry pressure computation, no gating call
    - Turn 12 (explore): entry pressure from gap, observation from explore-mode gating
    - Final turn (amplify): entry pressure = direct, observation from amplify-mode gating

- [ ] Task 4: Export from barrel files (AC: #1)
  - [ ] 4.1: Export `computeGovernorOutput`, `computeEntryPressure`, `deriveIntent`, constants, and `MoveGovernorInput` from `packages/domain/src/utils/steering/index.ts`

- [ ] Task 5: Comprehensive unit tests (AC: #12)
  - [ ] 5.1: Test entry pressure: small gap -> direct, moderate -> angled, large -> soft, null E_target -> direct
  - [ ] 5.2: Test intent derivation: turn 1 -> open, mid -> explore, final -> amplify
  - [ ] 5.3: Test open intent: output is OpenPromptInput with territory only
  - [ ] 5.4: Test explore intent: full entry pressure + observation gating wired
  - [ ] 5.5: Test amplify intent: entry pressure always direct, amplify-mode gating
  - [ ] 5.6: Test MoveGovernorDebug contains intent, isFinalTurn, entryPressure debug, and observation gating debug
  - [ ] 5.7: Test that Governor output uses TerritoryId (not full Territory objects)

## Technical Notes

- **Location:** `packages/domain/src/utils/steering/move-governor.ts` — pure function, no Effect dependencies
- **Dependencies:** Uses `evaluateObservationGating()` from Story 26-2, reuses types from `packages/domain/src/types/pacing.ts`
- **Pattern:** Same pure-function-with-debug pattern as `evaluateObservationGating()` and `computeETarget()`
- **Entry pressure thresholds:** Simulation-derived defaults, named constants for future calibration
- **Derive-at-read:** The `sharedFireCount` (prior non-Relate fires) is reconstructed by the pipeline caller, not computed inside the Governor
