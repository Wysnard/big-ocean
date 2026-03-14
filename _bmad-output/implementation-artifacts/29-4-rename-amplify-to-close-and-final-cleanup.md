# Story 29-4: Rename Amplify to Close and Final Cleanup

**Status:** ready-for-dev

**Epic:** Epic 2 — Bridge Transitions & Contextual Mirrors
**Story:** 2.4

## User Story

As a developer,
I want the codebase to use consistent terminology matching the brainstorming architecture,
so that the intent naming is clear and the codebase has no dead modules.

## Acceptance Criteria

**Given** the intent `amplify` exists throughout the codebase
**When** the rename is applied
**Then:**

1. `amplify` is renamed to `close` in: `PromptBuilderInput` type, governor intent derivation, prompt builder case handling, all templates, all tests
2. EXPLORE_RESPONSE_FORMAT is confirmed deleted (should be gone from Story 1.4)
3. OBSERVATION_QUALITY module file is deleted (content dissolved in Story 1.2)
4. THREADING module file is deleted (content dissolved in Stories 1.2 + 2.2)
5. MIRRORS_EXPLORE and MIRRORS_AMPLIFY module files are deleted (replaced in Story 2.3) — confirmed already deleted
6. All prompt builder tests pass with the new naming
7. No dead imports or unused exports remain in `packages/domain/src/constants/nerin/`

## Tasks

### Task 1: Rename `amplify` to `close` in type definitions

**Files:**
- `packages/domain/src/types/pacing.ts` — Rename `AmplifyPromptInput` to `ClosePromptInput`, change `intent: "amplify"` to `intent: "close"`, update `CONVERSATIONAL_INTENTS` array, update `ObservationGatingDebug.mode` type, update JSDoc comments
- `packages/domain/src/types/pacing-pipeline.types.ts` — Rename `SessionPhase` value `"amplifying"` to `"closing"`, rename `SelectionRule` value `"argmax_amplify"` to `"argmax_close"`
- `packages/domain/src/index.ts` — Update exports: `AmplifyPromptInput` -> `ClosePromptInput`, `AMPLIFY_*_TEMPLATE` -> `CLOSE_*_TEMPLATE`

### Task 2: Rename `amplify` to `close` in governor and observation gating

**Files:**
- `packages/domain/src/utils/steering/move-governor.ts` — Update `deriveIntent()` to return `"close"` instead of `"amplify"`, update `AmplifyPromptInput` references to `ClosePromptInput`, update comments
- `packages/domain/src/utils/steering/observation-gating.ts` — Rename `ObservationGatingMode` value from `"amplify"` to `"close"`, rename `evaluateAmplify()` to `evaluateClose()`, update comments

### Task 3: Rename `amplify` to `close` in steering templates

**File:** `packages/domain/src/constants/nerin/steering-templates.ts`

- Rename `AMPLIFY_RELATE_TEMPLATE` -> `CLOSE_RELATE_TEMPLATE`
- Rename `AMPLIFY_NOTICING_TEMPLATE` -> `CLOSE_NOTICING_TEMPLATE`
- Rename `AMPLIFY_CONTRADICTION_TEMPLATE` -> `CLOSE_CONTRADICTION_TEMPLATE`
- Rename `AMPLIFY_CONVERGENCE_TEMPLATE` -> `CLOSE_CONVERGENCE_TEMPLATE`
- Update TEMPLATE_LOOKUP keys from `"amplify:*"` to `"close:*"`
- Update `renderSteeringTemplate()` intent parameter type and comments

### Task 4: Rename `amplify` to `close` in contextual mirrors

**File:** `packages/domain/src/constants/nerin/contextual-mirrors.ts`

- Rename `AMPLIFY_MIRRORS` -> `CLOSE_MIRRORS`
- Rename `AMPLIFY_SET` -> `CLOSE_SET`
- Update mirror lookup keys from `"amplify:*"` to `"close:*"`
- Update header from `"(AMPLIFY)"` to `"(CLOSE)"`
- Update comments and JSDoc

### Task 5: Rename `amplify` to `close` in prompt builder

**File:** `packages/domain/src/utils/steering/prompt-builder.ts`

- Update `case "amplify"` references to `case "close"` in comments and condition checks
- Update JSDoc references

### Task 6: Update nerin constants index and domain index exports

**Files:**
- `packages/domain/src/constants/nerin/index.ts` — Update template exports from `AMPLIFY_*` to `CLOSE_*`, remove dead exports for THREADING and OBSERVATION_QUALITY
- `packages/domain/src/index.ts` — Update all `AMPLIFY_*` exports to `CLOSE_*`, remove `THREADING`, `OBSERVATION_QUALITY` exports, update `AmplifyPromptInput` to `ClosePromptInput`

### Task 7: Delete dead module files

**Files to delete:**
- `packages/domain/src/constants/nerin/observation-quality.ts` — content dissolved in Story 28-2 into `observation-quality-common.ts`
- `packages/domain/src/constants/nerin/threading.ts` — content dissolved in Stories 28-2 + 29-2 into `threading-common.ts` and bridge templates

### Task 8: Update nerin-pipeline.ts reference

**File:** `apps/api/src/use-cases/nerin-pipeline.ts`

- Update `"amplifying"` session phase reference to `"closing"`

### Task 9: Update all test files

**Files:**
- `packages/domain/src/types/__tests__/pacing.test.ts`
- `packages/domain/src/utils/steering/__tests__/move-governor.test.ts`
- `packages/domain/src/utils/steering/__tests__/observation-gating.test.ts`
- `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts`
- `packages/domain/src/constants/nerin/__tests__/steering-templates.test.ts`
- `packages/domain/src/constants/nerin/__tests__/contextual-mirrors.test.ts`
- `packages/domain/src/constants/nerin/__tests__/character-bible-decomposition.test.ts`

Update all `amplify` references to `close`, all `AMPLIFY_*` template references to `CLOSE_*`, all `AmplifyPromptInput` to `ClosePromptInput`.

### Task 10: Update story-pulling.ts comment

**File:** `packages/domain/src/constants/nerin/story-pulling.ts`

- Update comment referencing `amplify` to `close`

### Task 11: Confirm EXPLORE_RESPONSE_FORMAT is already deleted

Verify no references to `EXPLORE_RESPONSE_FORMAT` remain (should only be in prompt-builder test as a historical check — confirm and remove if present).

### Task 12: Verify no dead imports or unused exports

Run final check for any remaining `amplify` references, dead imports, or unused nerin module exports.
