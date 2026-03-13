# Story 27-1: Character Bible Decomposition

**Status:** ready-for-dev

## Story

As a developer,
I want the CHAT_CONTEXT monolith decomposed into modular, independently loadable constant modules,
So that each conversational intent loads only the cognitive palette it needs — reducing token cost and preventing behavioral leakage between intents.

## Acceptance Criteria

### AC1: Tier 1 (Always-On) Modules Created

**Given** the existing `CHAT_CONTEXT` at `packages/domain/src/constants/nerin-chat-context.ts`
**When** decomposed into modular constants at `packages/domain/src/constants/nerin/`
**Then** Tier 1 (always-on, core identity) modules are created:
- `CONVERSATION_MODE` — conversational frame and purpose
- `BELIEFS_IN_ACTION` — core beliefs that shape behavior
- `CONVERSATION_INSTINCTS` — rewritten to remove directives, keep instincts only ("you never make someone feel insufficient")
- `QUALITY_INSTINCT` — what quality looks like in Nerin's responses
- `MIRROR_GUARDRAILS` — constraints on mirror usage
- `HUMOR_GUARDRAILS` — constraints on humor
- `INTERNAL_TRACKING` — what Nerin tracks internally

### AC2: Tier 2 (Intent-Contextual) Modules Created

**Given** Tier 1 modules are created
**When** Tier 2 (intent-contextual) modules are created
**Then**:
- `STORY_PULLING` — primary question type for pulling concrete narratives
- `REFLECT` — reflection question module
- `THREADING` — connecting threads across the conversation
- `OBSERVATION_QUALITY` — what makes a good observation (amplify only)
- `MIRRORS_EXPLORE` — 13 mirrors for explore intent (folds DEEPEN 10 + BRIDGE 3 unique: Coral Reef, Volcanic Vents, Mola Mola)
- `MIRRORS_AMPLIFY` — 4 mirrors for amplify intent (Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola)

### AC3: No Content Lost

**Given** the decomposition is complete
**When** all Tier 1 + Tier 2 modules are concatenated
**Then** no content from the original CHAT_CONTEXT is lost — only reorganized
**And** eliminated sections are confirmed removed: QUESTIONING_STYLE (folded into intent instructions), RESPONSE_FORMAT (decomposed), RESPONSE_PALETTE, separate MIRRORS_BRIDGE and MIRRORS_HOLD (folded into MIRRORS_EXPLORE)

### AC4: Token Budget Targets

**Given** the token budget targets
**When** modules are measured
**Then** open intent (Tier 1 + Reflect only) <= ~500 tokens (-79% vs ~2400 monolith)
**And** explore intent (Tier 1 + full question palette) <= ~1400 tokens (-42%)
**And** amplify intent (Tier 1 + amplify-specific) <= ~900 tokens (-63%)

### AC5: Independently Deployable

**Given** this story is independently deployable
**When** shipped without the Prompt Builder or pipeline changes
**Then** the existing system continues to work with the original CHAT_CONTEXT — modules are additive, not a replacement, until Story 5.2 switches to them

## Tasks

### Task 1: Create Tier 1 Module Files
- **1.1** Create `packages/domain/src/constants/nerin/` directory
- **1.2** Create `packages/domain/src/constants/nerin/conversation-mode.ts` — extract CONVERSATION MODE section
- **1.3** Create `packages/domain/src/constants/nerin/beliefs-in-action.ts` — extract HOW TO BEHAVE — BELIEFS IN ACTION section
- **1.4** Create `packages/domain/src/constants/nerin/conversation-instincts.ts` — rewrite CONVERSATION AWARENESS section to remove directives, keep instincts only
- **1.5** Create `packages/domain/src/constants/nerin/quality-instinct.ts` — extract response quality guidance from RESPONSE FORMAT
- **1.6** Create `packages/domain/src/constants/nerin/mirror-guardrails.ts` — extract NATURAL WORLD MIRRORS placement rules and delivery guidance (not the mirrors themselves)
- **1.7** Create `packages/domain/src/constants/nerin/humor-guardrails.ts` — extract HUMOR section
- **1.8** Create `packages/domain/src/constants/nerin/internal-tracking.ts` — extract WHAT STAYS INTERNAL section

### Task 2: Create Tier 2 Module Files
- **2.1** Create `packages/domain/src/constants/nerin/story-pulling.ts` — extract STORY-PULLING section
- **2.2** Create `packages/domain/src/constants/nerin/reflect.ts` — extract relate > reflect patterns as the reflection question module
- **2.3** Create `packages/domain/src/constants/nerin/threading.ts` — extract THREADING section
- **2.4** Create `packages/domain/src/constants/nerin/observation-quality.ts` — extract OBSERVATION + QUESTION section (amplify only)
- **2.5** Create `packages/domain/src/constants/nerin/mirrors-explore.ts` — compose 13 mirrors for explore intent (TIER 1 + TIER 2 + territory bridges, folding deepen+bridge)
- **2.6** Create `packages/domain/src/constants/nerin/mirrors-amplify.ts` — 4 mirrors for amplify intent (Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola)

### Task 3: Create Module Index and Re-export
- **3.1** Create `packages/domain/src/constants/nerin/index.ts` — barrel export for all Tier 1 and Tier 2 modules
- **3.2** Re-export from `packages/domain/src/index.ts` — export all module constants from the domain package

### Task 4: Write Tests
- **4.1** Create `packages/domain/src/constants/nerin/__tests__/character-bible-decomposition.test.ts`
- **4.2** Test: all Tier 1 module constants are non-empty strings
- **4.3** Test: all Tier 2 module constants are non-empty strings
- **4.4** Test: no content lost — verify key phrases from original CHAT_CONTEXT appear in at least one module
- **4.5** Test: eliminated sections are NOT present in any module (QUESTIONING_STYLE header, RESPONSE_PALETTE)
- **4.6** Test: CONVERSATION_INSTINCTS does NOT contain directives ("Never tell people how to behave"), only instincts
- **4.7** Test: MIRRORS_EXPLORE contains exactly 13 mirror names
- **4.8** Test: MIRRORS_AMPLIFY contains exactly 4 mirror names (Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola)
- **4.9** Test: original CHAT_CONTEXT export still exists and still works (backward compat)

### Task 5: Verify Backward Compatibility
- **5.1** Ensure `nerin-chat-context.ts` still exports `CHAT_CONTEXT` unchanged
- **5.2** Ensure `nerin-system-prompt.ts` still imports from `nerin-chat-context.ts` (no changes to existing prompt builder)
- **5.3** Run full typecheck to verify no breakage

## Dev Notes

- The original `CHAT_CONTEXT` must NOT be modified or removed. The new modules are additive.
- Story 27-2 (Prompt Builder) will switch from monolithic CHAT_CONTEXT to modular modules.
- Mirror assignment: MIRRORS_EXPLORE gets 13 (all 6 Tier 1 + all 7 Tier 2 mirrors minus the 3 unique to bridge: Coral Reef, Volcanic Vents, Mola Mola which are added in). Actually per architecture: MIRRORS_EXPLORE = DEEPEN 10 + BRIDGE 3 unique. MIRRORS_AMPLIFY = Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola.
- CONVERSATION_INSTINCTS is a rewrite, not a copy — extract the instinct-level behaviors from CONVERSATION AWARENESS but remove all directive/instructional framing.
- Token budget targets are approximate — measure with a tokenizer or estimate at ~4 chars/token.
