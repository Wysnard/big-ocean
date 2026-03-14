# Story 28-4: Prompt Builder Skeleton Swap

**Status:** ready-for-dev

**Epic:** Epic 1 — Desire-Framed Steering System
**Story:** 1.4

## User Story

As an assessment user,
I want Nerin to follow territory assignments via desire framing and skeleton-based prompt composition,
so that assessment sessions achieve territory coverage across multiple life domains.

## Acceptance Criteria

**Given** templates and pressure modifiers from Story 1.3 and common layer from Story 1.2
**When** the prompt builder composes the system prompt
**Then:**

1. The 4-tier system is replaced with 2 layers: common (stable) + steering (per-turn)
2. Steering section is positioned immediately after persona (position 2, not last)
3. Steering section uses "What's caught your attention this turn:" prefix
4. The appropriate intent x observation template is selected based on `PromptBuilderInput`
5. Entry pressure modifier is appended for `explore` intent
6. Territory `name` and `description` from catalog are interpolated into template parameter slots
7. `selectTier2Modules()` is replaced — no more dynamic tier selection; common modules are always loaded, steering template is always loaded
8. EXPLORE_RESPONSE_FORMAT static constant is removed (replaced by skeleton templates)
9. All prompt builder tests are updated to verify new 2-layer structure
10. Prompt output for `open` and `amplify` intents also uses the new skeleton system

## Tasks

### Task 1: Rewrite prompt builder to 2-layer composition

**File:** `packages/domain/src/utils/steering/prompt-builder.ts`

Replace the 4-tier composition with 2 layers:

**Layer 1 — Common (stable, always loaded):**
- NERIN_PERSONA
- All current Tier 1 modules (CONVERSATION_MODE, BELIEFS_IN_ACTION, CONVERSATION_INSTINCTS, QUALITY_INSTINCT, MIRROR_GUARDRAILS, HUMOR_GUARDRAILS, REFLECT, STORY_PULLING, OBSERVATION_QUALITY_COMMON, THREADING_COMMON)

**Layer 2 — Steering (per-turn):**
- STEERING_PREFIX ("What's caught your attention this turn:")
- Rendered intent x observation template (from `renderSteeringTemplate`)
- Entry pressure modifier (for `explore` intent, via `getPressureModifier`)

Composition order: `[commonLayer, steeringSection]` — steering is position 2, immediately after common.

**Subtasks:**
- 1a. Remove `selectTier2Modules()` function and `Tier2Selection` interface
- 1b. Remove `EXPLORE_RESPONSE_FORMAT` constant
- 1c. Remove old `buildSteeringSection()` and `buildTerritoryGuidanceWithPressure()` and `translateObservationFocus()`
- 1d. Create new `buildSteeringSection()` that uses `renderSteeringTemplate` + `getPressureModifier` + `STEERING_PREFIX`
- 1e. Update `buildPrompt()` to compose 2 layers instead of 4 tiers
- 1f. Update `PromptBuilderOutput` — remove `tier2Modules` field, keep `steeringSection` for debugging

### Task 2: Handle open intent in new steering system

**File:** `packages/domain/src/utils/steering/prompt-builder.ts`

For `open` intent:
- Use `OPEN_RELATE_TEMPLATE` (open always uses relate observation)
- No pressure modifier (open has no entry pressure)
- Territory name and description interpolated into template

### Task 3: Handle explore intent in new steering system

**File:** `packages/domain/src/utils/steering/prompt-builder.ts`

For `explore` intent:
- Select template based on observation focus type (relate/noticing/contradiction/convergence)
- Append entry pressure modifier after the template
- Territory name and description interpolated into template
- MIRRORS_EXPLORE no longer loaded as a Tier 2 module (will be handled by contextual mirror system in Story 2.3)

### Task 4: Handle amplify intent in new steering system

**File:** `packages/domain/src/utils/steering/prompt-builder.ts`

For `amplify` intent:
- Select template based on observation focus type
- Append entry pressure modifier after the template
- MIRRORS_AMPLIFY and OBSERVATION_QUALITY no longer loaded as Tier 2 modules
- Remove the old "AMPLIFY MODE" block — skeleton templates already carry amplify-specific framing

### Task 5: Rewrite prompt builder tests

**File:** `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts`

Rewrite all tests to verify the new 2-layer structure:

1. **Common layer tests:** All common modules present in every intent
2. **Steering position test:** Steering section appears after common layer, not at end
3. **Steering prefix test:** All intents include STEERING_PREFIX
4. **Template selection tests:** Correct template selected per intent x observation
5. **Pressure modifier tests:** Explore intent appends pressure modifier; open does not
6. **Territory interpolation tests:** Territory name/description filled in template slots
7. **Removed content tests:** No EXPLORE_RESPONSE_FORMAT, no TERRITORY GUIDANCE header, no AMPLIFY MODE block, no OBSERVATION FOCUS header
8. **Error handling test:** Invalid territory ID still throws descriptive error
9. **Output shape test:** `PromptBuilderOutput` no longer has `tier2Modules`

## Technical Guidance

- Use `renderSteeringTemplate` from `packages/domain/src/constants/nerin/steering-templates.ts` for template selection and rendering
- Use `getPressureModifier` from `packages/domain/src/constants/nerin/pressure-modifiers.ts` for pressure modifiers
- Use `STEERING_PREFIX` from steering-templates for the prefix
- Territory catalog entries already have `name` and `description` fields (Story 28-1)
- The prompt builder is a pure function with no Effect dependencies
- MIRRORS_EXPLORE, MIRRORS_AMPLIFY, and OBSERVATION_QUALITY remain as constants — they are not loaded by the new prompt builder but will be cleaned up in Story 2.3/2.4
- The `translateObservationFocus` function is currently exported and may be used elsewhere — check for usages before removing
