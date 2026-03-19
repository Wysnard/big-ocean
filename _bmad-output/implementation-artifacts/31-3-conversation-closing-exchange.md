# Story 31-3: Conversation Closing Exchange

Status: ready-for-dev

<!-- Origin: Epic 2 (Conversational Assessment & Drop-off Recovery), Story 2.3 in epics.md -->
<!-- Phase 7, Epic 31, Story 3 -->
<!-- Builds on: Story 26-3 (Move Governor), Story 28-4 (Prompt Builder Skeleton Swap), Story 31-1 (Greeting & Onboarding), Story 31-2 (Character Quality) -->

## Story

As a **user completing my conversation with Nerin**,
I want **a meaningful closing moment that wraps the conversation themes before seeing my results**,
So that **the conversation ends with emotional resonance rather than an abrupt stop**.

## Acceptance Criteria

1. **AC1: Close Intent Triggers on Turn 25** — When a conversation reaches the final turn (turn 25, configurable via `freeTierMessageThreshold`), the Move Governor selects the `close` intent. The close intent is already implemented in the Move Governor (`deriveIntent` returns `"close"` when `isFinalTurn` is true). Verify the close intent fires correctly in the full pipeline context and produces a closing exchange that wraps conversation themes.

2. **AC2: Closing Prompt Module** — A new `CLOSING_EXCHANGE` prompt module exists in `packages/domain/src/constants/nerin/` that provides closing-specific guidance for Nerin. The module instructs Nerin to: reference specific patterns or moments from the conversation (FR12), deliver a distinct closing exchange that wraps conversation themes, and leave the user with a feeling of emotional resonance rather than abruptness. The module is added to the prompt builder's common layer.

3. **AC3: Session Locked After Final Turn** — After the user's final response is processed (turn 25), the session transitions to `"finalizing"` status and no further messages can be sent. This is already implemented in `nerin-pipeline.ts` (lines 721-723). Verify no regression.

4. **AC4: Frontend Transition to Results** — After Nerin delivers the closing exchange and the `isFinalTurn` flag is returned, the frontend disables the input, shows a "View Results" button (for authenticated users), and prevents further message sending. This is already implemented via `isFarewellReceived` state in `useTherapistChat.ts` and `TherapistChat.tsx`. Verify no regression.

5. **AC5: All Existing Tests Pass** — No regressions in move-governor tests, prompt-builder tests, steering-templates tests, send-message use-case tests, or related test files.

6. **AC6: Common Layer Word Budget** — The assembled common layer (NERIN_PERSONA + all common modules including the new CLOSING_EXCHANGE module) stays within 1,500-2,500 words.

## Tasks / Subtasks

- [ ] Task 1: Create closing exchange prompt module (AC: #2, #6)
  - [ ] 1.1 Create `packages/domain/src/constants/nerin/closing-exchange.ts` with `CLOSING_EXCHANGE` constant -- prompt guidance instructing Nerin on how to deliver a closing exchange. Content should: reference patterns/moments from the conversation (FR12), wrap themes with emotional resonance, leave the user with something to sit with. ~80-150 words, written in instinct style (how Nerin naturally is, not directives). The module should complement the existing close steering templates (close:relate, close:noticing, close:contradiction, close:convergence) without duplicating them.
  - [ ] 1.2 Export `CLOSING_EXCHANGE` from `packages/domain/src/constants/nerin/index.ts`
  - [ ] 1.3 Add `CLOSING_EXCHANGE` to the `COMMON_MODULES` array in `packages/domain/src/utils/steering/prompt-builder.ts` (position: after THREADING_COMMON, as the final common module)
  - [ ] 1.4 Write test in `packages/domain/src/constants/nerin/__tests__/closing-exchange.test.ts` verifying:
    - Module content is non-empty
    - Contains reference to "patterns" or "moments" or "noticed" (FR12 -- references conversation patterns)
    - Contains concept of "closing" or "last" or "final" or "ending"
    - Does not contain forbidden words: "assessment", "test", "diagnostic", "quiz"
    - Is between 50-200 words

- [ ] Task 2: Update prompt-builder tests for new module (AC: #5, #6)
  - [ ] 2.1 Update `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts`:
    - Update COMMON_MODULES count assertion to include new module (14 total)
    - Add Story 31-3 module assertion (CLOSING_EXCHANGE present in common layer)
  - [ ] 2.2 Word count budget test: common layer still between 1,500-2,500 words after addition

- [ ] Task 3: Verify close intent in pipeline context (AC: #1)
  - [ ] 3.1 Add test in `packages/domain/src/utils/steering/__tests__/move-governor.test.ts` (if not already present) verifying: when `isFinalTurn` is true and `turnNumber >= 2`, the governor returns `intent: "close"` with observation gating in `close` mode
  - [ ] 3.2 Verify close intent produces PromptBuilderInput with `intent: "close"` that feeds into the prompt builder and includes close steering templates

- [ ] Task 4: Verify session locking and frontend transition (AC: #3, #4)
  - [ ] 4.1 Run existing send-message use-case tests -- session transitions to "finalizing" on final turn (no new code needed, regression check only)
  - [ ] 4.2 Run existing frontend tests -- `isFarewellReceived` state prevents further messages and shows "View Results" button (no new code needed, regression check only)

- [ ] Task 5: Run full test suite (AC: #5)
  - [ ] 5.1 `pnpm test:run` -- all tests pass
  - [ ] 5.2 `pnpm turbo typecheck` -- clean
  - [ ] 5.3 `pnpm lint` -- clean

## Dev Notes

### Current State

The closing exchange infrastructure is largely in place:
- **Move Governor** (`packages/domain/src/utils/steering/move-governor.ts`): `deriveIntent()` already returns `"close"` when `isFinalTurn` is true. The governor runs observation gating in `"close"` mode and produces `ClosePromptInput`.
- **Steering Templates** (`packages/domain/src/constants/nerin/steering-templates.ts`): Four close templates exist (close:relate, close:noticing, close:contradiction, close:convergence) providing per-turn steering for the closing exchange.
- **Prompt Builder** (`packages/domain/src/utils/steering/prompt-builder.ts`): Already handles `intent: "close"` in the steering section, including entry pressure modifier.
- **Nerin Pipeline** (`apps/api/src/use-cases/nerin-pipeline.ts`): Computes `isFinalTurn` and transitions session to `"finalizing"` status on the last turn.
- **Frontend** (`apps/front/src/hooks/useTherapistChat.ts`, `apps/front/src/components/TherapistChat.tsx`): `isFarewellReceived` state disables input, fades the input area, and shows "View Results" button for authenticated users.

### What This Story Adds

The **missing piece** is a common-layer prompt module that gives Nerin general guidance on how to close a conversation. The close steering templates handle the per-turn specific focus (relate/noticing/contradiction/convergence), but the common layer lacks an instinct-style module telling Nerin *how* to approach closing -- referencing patterns he noticed, wrapping themes, leaving the user with something resonant.

### Key Files

- `packages/domain/src/constants/nerin/closing-exchange.ts` -- NEW: closing exchange prompt module
- `packages/domain/src/constants/nerin/index.ts` -- barrel export
- `packages/domain/src/utils/steering/prompt-builder.ts` -- add to COMMON_MODULES
- `packages/domain/src/utils/steering/move-governor.ts` -- existing close intent (verify)
- `packages/domain/src/constants/nerin/steering-templates.ts` -- existing close templates (verify)
- `apps/api/src/use-cases/nerin-pipeline.ts` -- existing session finalization (verify)
- `apps/front/src/hooks/useTherapistChat.ts` -- existing farewell state (verify)
- `apps/front/src/components/TherapistChat.tsx` -- existing farewell UI (verify)
