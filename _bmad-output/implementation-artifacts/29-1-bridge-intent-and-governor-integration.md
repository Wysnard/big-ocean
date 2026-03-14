# Story 29-1: Bridge Intent and Governor Integration

**Status:** ready-for-dev

**Epic:** Epic 2 — Bridge Transitions & Contextual Mirrors
**Story:** 2.1

## User Story

As an assessment user,
I want territory transitions to be recognized as a distinct conversational moment,
so that Nerin can bridge between territories naturally instead of jumping abruptly.

## Acceptance Criteria

**Given** `PromptBuilderInput` has intents `open`, `explore`, `amplify`
**When** the bridge intent is added
**Then:**

1. `PromptBuilderInput` type includes a `bridge` intent variant with `previousTerritory: TerritoryId` field
2. The governor emits `intent: "bridge"` when `selectedTerritory !== previousTerritory` AND `turnNumber > 0` AND NOT `isFinalTurn`
3. `previousTerritory` is derived from the most recent exchange record (already available in `MoveGovernorInput`)
4. When `selectedTerritory === previousTerritory`, the governor emits `explore` as before
5. Governor unit tests verify bridge emission on territory change and explore emission on same territory
6. `ConversationalIntent` type includes `"bridge"` as a valid intent
7. `MoveGovernorDebug` reflects bridge intent correctly
8. Existing pipeline behavior is unchanged until prompt builder handles bridge (Story 2.2)

## Tasks

### Task 1: Add `bridge` to ConversationalIntent and PromptBuilderInput types

**File:** `packages/domain/src/types/pacing.ts`

Add `"bridge"` to the `CONVERSATIONAL_INTENTS` array and `ConversationalIntent` type.

Create a `BridgePromptInput` interface:
- `intent: "bridge"`
- `territory: TerritoryId` (the new territory)
- `previousTerritory: TerritoryId` (the territory being transitioned from)
- `entryPressure: EntryPressure`
- `observationFocus: ObservationFocus`

Add `BridgePromptInput` to the `PromptBuilderInput` union type.

### Task 2: Update governor intent derivation to emit bridge

**File:** `packages/domain/src/utils/steering/move-governor.ts`

Modify `deriveIntent` to accept `selectedTerritory`, `previousTerritory`, and return `"bridge"` when:
- `turnNumber > 1` (not the opening turn)
- `!isFinalTurn`
- `previousTerritory !== null`
- `selectedTerritory !== previousTerritory`

When `selectedTerritory === previousTerritory` (or `previousTerritory` is null), return `"explore"` as before.

### Task 3: Update governor orchestrator to handle bridge intent

**File:** `packages/domain/src/utils/steering/move-governor.ts`

Add a `bridge` case in `computeGovernorOutput`:
- Compute entry pressure (same as explore)
- Run observation gating in explore mode (same as explore)
- Produce `BridgePromptInput` with `previousTerritory` field from `input.previousTerritory`

Update `MoveGovernorDebug` intent type to include `"bridge"`.

### Task 4: Update prompt builder to pass through bridge intent

**File:** `packages/domain/src/utils/steering/prompt-builder.ts`

For now, the prompt builder should handle `bridge` input by treating it the same as `explore` — selecting the explore template and applying pressure modifiers. This is a temporary pass-through until Story 2.2 adds bridge-specific templates.

The `getObservationFocus` function needs to handle the `bridge` case (same as explore — use `input.observationFocus`).

The `buildSteeringSection` function needs to handle `bridge` intent for pressure modifier application.

The `renderSteeringTemplate` function in `steering-templates.ts` needs to accept `"bridge"` as an intent and fall back to the `explore` template for the same observation type.

### Task 5: Write governor unit tests for bridge intent

**File:** `packages/domain/src/utils/steering/__tests__/move-governor.test.ts`

Add tests:
1. `deriveIntent` returns `"bridge"` when territory changed, not turn 1, not final turn
2. `deriveIntent` returns `"explore"` when territory unchanged (same territory)
3. `deriveIntent` returns `"explore"` when previousTerritory is null (no prior exchange)
4. `deriveIntent` returns `"open"` on turn 1 even if territory changed (open takes priority)
5. `deriveIntent` returns `"amplify"` on final turn even if territory changed (amplify takes priority)
6. `computeGovernorOutput` produces `BridgePromptInput` with correct `previousTerritory` field on territory change
7. `computeGovernorOutput` produces `ExplorePromptInput` when territory is unchanged
8. Bridge intent carries entry pressure and observation focus (same computation as explore)
9. `MoveGovernorDebug` shows `intent: "bridge"` on territory change

### Task 6: Update domain index exports

**File:** `packages/domain/src/index.ts`

Ensure `BridgePromptInput` is exported from the domain package index.

## Technical Guidance

- `MoveGovernorInput` already has `previousTerritory: TerritoryId | null` — no changes needed to the input type
- `deriveIntent` currently only takes `turnNumber` and `isFinalTurn` — its signature must expand to include `selectedTerritory` and `previousTerritory`
- The prompt builder's `renderSteeringTemplate` currently only accepts `"open" | "explore" | "amplify"` — update this to also accept `"bridge"` with a fallback to explore templates
- Bridge intent uses explore-mode observation gating (not amplify mode)
- The `TEMPLATE_LOOKUP` table does not need bridge entries yet — Story 2.2 adds those
- Keep `MoveGovernorDebug.intent` type in sync with `ConversationalIntent`
