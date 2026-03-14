---
status: ready-for-dev
story_id: "1.2"
epic: 1
epic_name: "Desire-Framed Steering System"
created_date: 2026-03-14
completed_date: null
---

# Story 1.2: Common Layer Reform

## Story

As a assessment user,
I want Nerin's always-on instincts to not compete with territory steering,
so that the steering pipeline's territory assignments can actually influence Nerin's behavior.

## Acceptance Criteria

### AC1: Unconditional depth instinct removed

**Given** CONVERSATION_INSTINCTS contains "When someone is opening up, you go deeper"
**When** the common layer is reformed
**Then** the unconditional depth instinct is removed (only "When guarded, you change angle" remains)

### AC2: REFLECT and STORY_PULLING moved to common layer

**Given** REFLECT and STORY_PULLING are currently Tier 2 (intent-contextual) modules
**When** the common layer is reformed
**Then** REFLECT and STORY_PULLING are loaded on every turn regardless of intent (moved to Tier 1 / common layer)

### AC3: OBSERVATION_QUALITY dissolved

**Given** OBSERVATION_QUALITY contains both universal instincts and observation-specific content
**When** the common layer is reformed
**Then** "name it and hand it back" and "go beyond their framework" move to common layer
**And** observation-specific content is preserved for future template extraction (Story 1.3)

### AC4: Merged threading instinct in common layer

**Given** THREADING module contains thread-tracking and park/flag behaviors
**When** the common layer is reformed
**Then** the common layer includes the merged threading instinct: "You reference earlier parts of the conversation -- you're always tracking threads"

### AC5: Existing tests updated

**Given** prompt builder tests verify module locations per intent
**When** modules are reorganized
**Then** existing prompt builder tests are updated to reflect the new module locations
**And** all tests pass

### AC6: No behavioral change — prompt output equivalence

**Given** modules are being reorganized, not rewritten
**When** the reform is complete
**Then** no behavioral change occurs yet — modules are reorganized but the total prompt content is equivalent
**And** the same content that was previously loaded conditionally is now loaded unconditionally in the common layer

## Tasks

### Task 1: Modify CONVERSATION_INSTINCTS — remove unconditional depth instinct

**File:** `packages/domain/src/constants/nerin/conversation-instincts.ts`

1.1. Remove the line "When someone is opening up, you go deeper" from the CONVERSATION_INSTINCTS constant
1.2. Keep "When guarded, you change angle" and all other instincts
1.3. Update the module doc comment to note the depth instinct was removed (Story 28-2)

### Task 2: Create OBSERVATION_QUALITY_COMMON — extract universal instincts

**File:** `packages/domain/src/constants/nerin/observation-quality-common.ts`

2.1. Create new constant `OBSERVATION_QUALITY_COMMON` containing:
     - "name it and hand it back" pattern (observation + question pairing)
     - "go beyond their framework" pattern (accepting frameworks, going deeper)
2.2. Keep the original OBSERVATION_QUALITY unchanged for now (will be dissolved in Story 1.3)

### Task 3: Create THREADING_COMMON — extract thread-tracking instinct

**File:** `packages/domain/src/constants/nerin/threading-common.ts`

3.1. Create new constant `THREADING_COMMON` with: "You reference earlier parts of the conversation -- you're always tracking threads"
3.2. Keep the original THREADING unchanged for now (park/flag behaviors will move to bridge templates in Story 2.2)

### Task 4: Update prompt builder — reorganize module loading

**File:** `packages/domain/src/utils/steering/prompt-builder.ts`

4.1. Add REFLECT, STORY_PULLING, OBSERVATION_QUALITY_COMMON, and THREADING_COMMON to TIER_1_MODULES (always-on)
4.2. Update `selectTier2Modules()`:
     - `open`: remove REFLECT (now in Tier 1) — return empty modules
     - `explore`: remove STORY_PULLING, REFLECT, THREADING (now in Tier 1) — keep MIRRORS_EXPLORE, EXPLORE_RESPONSE_FORMAT
     - `amplify`: remove OBSERVATION_QUALITY (universal parts now in Tier 1) — keep MIRRORS_AMPLIFY and OBSERVATION_QUALITY (observation-specific parts still needed until Story 1.3)
4.3. Export THREADING_COMMON and OBSERVATION_QUALITY_COMMON from nerin/index.ts

### Task 5: Update prompt builder tests

**File:** `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts`

5.1. Update Tier 1 tests to verify REFLECT, STORY_PULLING, OBSERVATION_QUALITY_COMMON, and THREADING_COMMON are included in all prompts
5.2. Update open intent tests — REFLECT is no longer tier 2 specific
5.3. Update explore intent tests — STORY_PULLING, REFLECT, THREADING no longer tier 2 specific
5.4. Update amplify intent tests — OBSERVATION_QUALITY universal parts now in Tier 1
5.5. Add test verifying depth instinct is NOT in CONVERSATION_INSTINCTS
5.6. Verify all existing observation focus and pressure tests still pass

### Task 6: Update nerin/index.ts exports

**File:** `packages/domain/src/constants/nerin/index.ts`

6.1. Add exports for OBSERVATION_QUALITY_COMMON and THREADING_COMMON
6.2. Update doc comments to reflect new Tier 1 membership for REFLECT and STORY_PULLING
