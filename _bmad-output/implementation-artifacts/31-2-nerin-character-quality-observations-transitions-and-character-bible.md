# Story 31-2: Nerin Character Quality — Observations, Transitions & Character Bible

Status: ready-for-dev

<!-- Origin: Epic 2 (Conversational Assessment & Drop-off Recovery), Story 2.2 in epics.md -->
<!-- Phase 7, Epic 31, Story 2 -->
<!-- Builds on: Story 27-1 (Character Bible Decomposition), Story 28-4 (Prompt Builder Skeleton Swap), Story 29-2 (Bridge Templates), Story 31-1 (Greeting & Onboarding) -->

## Story

As a **user having a conversation with Nerin**,
I want **Nerin to feel like a real person with depth and a story of his own — grounded in the Big Ocean dive shop, with natural observation sharing, graceful topic transitions, and firm safety guardrails**,
So that **the conversation feels authentic and I trust him enough to share honestly**.

## Acceptance Criteria

1. **AC1: Character Bible in Common Prompt Layer** — Nerin is grounded in the Big Ocean diving shop setting. Big Ocean is a dive shop, Vincent is the founder and boss, Nerin is its dive master. Nerin has an origin story that informs his personality, perspective, and conversational style. The character bible is reflected in the Common prompt layer (~1,500 words, loaded once per session). The NERIN_PERSONA constant is updated or a new origin story module is added to the common layer.

2. **AC2: Pattern Observations After Settling Phase** — After the settling phase (~turns 5-8), when Nerin has accumulated evidence, he references patterns he is noticing about the user to build anticipation for the portrait (FR6). The observation gating system already controls when observations fire; this AC ensures the prompt language explicitly encourages pattern-referencing after early turns.

3. **AC3: Pushback Handling** — When the user pushes back on an observation, Nerin acknowledges the pushback, offers an alternative framing, and only redirects to a different topic if the user rejects the observation a second time (FR7). This is prompt-level guidance in the common layer.

4. **AC4: Territory Transition Quality** — When the pacing pipeline changes the selected territory, Nerin transitions using a connecting observation or question that references the prior topic (FR13). This is already implemented via bridge intent templates (Story 29-2). Verify no regression.

5. **AC5: Safety Guardrails** — Nerin never uses diagnostic language or characterizes third parties the user mentions (FR9). This is prompt-level guidance in the common layer.

6. **AC6: All Existing Tests Pass** — No regressions in prompt-builder tests, nerin-persona tests, nerin-system-prompt tests, or any related test files.

7. **AC7: Common Layer Word Budget** — The assembled common layer (NERIN_PERSONA + all common modules) is approximately 1,500 words (+/-20%), measured and asserted in tests.

## Tasks / Subtasks

- [ ] Task 1: Create Nerin origin story module (AC: #1)
  - [ ] 1.1 Create `packages/domain/src/constants/nerin/origin-story.ts` with `ORIGIN_STORY` constant — Nerin's backstory grounded in the Big Ocean dive shop setting. Vincent is the founder/boss. Nerin is the dive master. The origin story should explain how Nerin came to be good at reading people through diving — experiential, not academic. ~150-200 words.
  - [ ] 1.2 Export `ORIGIN_STORY` from `packages/domain/src/constants/nerin/index.ts`
  - [ ] 1.3 Add `ORIGIN_STORY` to the `COMMON_MODULES` array in `packages/domain/src/utils/steering/prompt-builder.ts` (position: after NERIN_PERSONA, before CONVERSATION_MODE)
  - [ ] 1.4 Write test in `packages/domain/src/constants/nerin/__tests__/origin-story.test.ts` verifying:
    - Contains "Big Ocean" (dive shop name)
    - Contains "Vincent" (founder)
    - Contains "dive master" or equivalent identity marker
    - Does not contain forbidden words: "assessment", "test", "diagnostic", "quiz"
    - Is between 100-300 words

- [ ] Task 2: Add pushback handling guidance to common layer (AC: #3)
  - [ ] 2.1 Create `packages/domain/src/constants/nerin/pushback-handling.ts` with `PUSHBACK_HANDLING` constant — prompt guidance for FR7: acknowledge pushback, offer alternative framing, redirect only on second rejection. ~80-120 words, written in instinct style (how Nerin naturally is, not directives).
  - [ ] 2.2 Export `PUSHBACK_HANDLING` from `packages/domain/src/constants/nerin/index.ts`
  - [ ] 2.3 Add `PUSHBACK_HANDLING` to the `COMMON_MODULES` array in `packages/domain/src/utils/steering/prompt-builder.ts`
  - [ ] 2.4 Write test verifying pushback handling content includes "alternative framing" or "reframe" concept, and "second" rejection/refusal concept

- [ ] Task 3: Add safety guardrails module (AC: #5)
  - [ ] 3.1 Create `packages/domain/src/constants/nerin/safety-guardrails.ts` with `SAFETY_GUARDRAILS` constant — prompt guidance for FR9: never use diagnostic language (e.g., "narcissistic", "anxious attachment", "codependent"), never characterize third parties the user mentions. ~60-100 words.
  - [ ] 3.2 Export `SAFETY_GUARDRAILS` from `packages/domain/src/constants/nerin/index.ts`
  - [ ] 3.3 Add `SAFETY_GUARDRAILS` to the `COMMON_MODULES` array in `packages/domain/src/utils/steering/prompt-builder.ts`
  - [ ] 3.4 Write test verifying safety guardrails content includes "diagnostic" prohibition and "third party" / "third parties" protection

- [ ] Task 4: Add pattern observation encouragement to common layer (AC: #2)
  - [ ] 4.1 Create `packages/domain/src/constants/nerin/pattern-observations.ts` with `PATTERN_OBSERVATIONS` constant — prompt guidance for FR6: after early turns, reference patterns being noticed to build portrait anticipation. Frame as Nerin's natural instinct. ~80-120 words.
  - [ ] 4.2 Export `PATTERN_OBSERVATIONS` from `packages/domain/src/constants/nerin/index.ts`
  - [ ] 4.3 Add `PATTERN_OBSERVATIONS` to the `COMMON_MODULES` array in `packages/domain/src/utils/steering/prompt-builder.ts`
  - [ ] 4.4 Write test verifying pattern observation content includes "pattern" concept and "portrait" anticipation concept

- [ ] Task 5: Update prompt-builder tests for new modules (AC: #6, #7)
  - [ ] 5.1 Update `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts`:
    - Update COMMON_MODULES array to include 4 new modules (total: 14)
    - Update "includes all N common modules" test assertion count
    - Add assertion that all new modules are present in all intents' system prompts
  - [ ] 5.2 Add word count budget test: the assembled common layer is approximately 1,500 words (+/-20% = 1,200-1,800 words)

- [ ] Task 6: Verify bridge template regression (AC: #4)
  - [ ] 6.1 Run existing bridge template tests — confirm they pass without changes
  - [ ] 6.2 Verify bridge intent produces territory transition content referencing prior topic

- [ ] Task 7: Run full test suite (AC: #6)
  - [ ] 7.1 `pnpm test:run` — all tests pass
  - [ ] 7.2 `pnpm turbo typecheck` — clean
  - [ ] 7.3 `pnpm lint` — clean

## Dev Notes

### Current State

The character bible was decomposed in Story 27-1 into modular constants under `packages/domain/src/constants/nerin/`. The prompt builder (Story 28-4) assembles these into a 2-layer system prompt: Common (always-on) + Steering (per-turn).

Current common layer modules (10):
1. CONVERSATION_MODE
2. BELIEFS_IN_ACTION
3. CONVERSATION_INSTINCTS
4. QUALITY_INSTINCT
5. MIRROR_GUARDRAILS
6. HUMOR_GUARDRAILS
7. REFLECT
8. STORY_PULLING
9. OBSERVATION_QUALITY_COMMON
10. THREADING_COMMON

This story adds 4 new modules:
11. ORIGIN_STORY (Task 1)
12. PUSHBACK_HANDLING (Task 2)
13. SAFETY_GUARDRAILS (Task 3)
14. PATTERN_OBSERVATIONS (Task 4)

### Key Files

- `packages/domain/src/constants/nerin-persona.ts` — shared Nerin identity constant
- `packages/domain/src/constants/nerin/index.ts` — barrel export for all modules
- `packages/domain/src/constants/nerin/*.ts` — individual modules
- `packages/domain/src/utils/steering/prompt-builder.ts` — 2-layer prompt builder
- `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts` — prompt builder tests
- `packages/domain/src/constants/__tests__/nerin-persona.test.ts` — persona tests

### Architecture Notes

- All new modules are **pure string constants** — no I/O, no Effect dependencies
- Modules follow existing pattern: JSDoc header, named export, instinct-style prose
- The prompt builder's `COMMON_MODULES` array determines load order
- Bridge templates (FR13) are already implemented in Story 29-2 — verify only
- Word budget target ensures the Common layer doesn't bloat (LLM context cost concern)
