# Story 22-1: Remove Steering Instructions from Character Bible

## Status: ready-for-dev

## Story

As a developer,
I want strategic and pacing instructions removed from Nerin's character bible,
So that character defines personality only, while steering strategy is handled by the DRS and territory system.

**Epic:** 2 - Nerin Character Evolution
**FR covered:** FR7

## Acceptance Criteria

**AC1:** Given the Nerin character bible at `packages/domain/src/constants/nerin-chat-context.ts`, when the character bible is updated, then depth progression rules (messages 14-18 pacing) are removed entirely.

**AC2:** Given the Nerin character bible at `packages/domain/src/constants/nerin-chat-context.ts`, when the character bible is updated, then the "late-conversation depth" section is removed entirely.

**AC3:** Given the Nerin character bible at `packages/domain/src/constants/nerin-chat-context.ts`, when the character bible is updated, then the "People are more ready for truth than they think" framing is replaced with "People discover more when they feel safe to explore".

**AC4:** Given the character bible after modifications, when reviewed for remaining content, then no strategic/pacing instructions remain -- only personality traits, communication style, and interaction patterns.

**AC5:** Given contradiction-surfacing instructions exist in the character bible, when this story is completed, then contradiction-surfacing is NOT yet removed (deferred to Story 2.3) -- only pacing/depth rules are removed in this story.

## Tasks

### Task 1: Update tests for character bible changes (TDD - red phase)

**File:** `packages/domain/src/utils/__tests__/nerin-system-prompt-persona.test.ts`

- Update the test that checks for "DEPTH PROGRESSION" section header to expect it is removed
- Update the test that checks for "PEOPLE ARE MORE READY FOR TRUTH THAN THEY THINK" to expect the new framing "PEOPLE DISCOVER MORE WHEN THEY FEEL SAFE TO EXPLORE"
- Add test asserting "LATE-CONVERSATION DEPTH" (messages ~14-18) content is NOT present
- Add test asserting contradiction-surfacing ("CONTRADICTIONS ARE FEATURES") IS still present (AC5)
- Verify tests fail (red phase)

### Task 2: Remove depth progression pacing from character bible

**File:** `packages/domain/src/constants/nerin-chat-context.ts`

- Remove the entire "DEPTH PROGRESSION" section (lines 161-183)
- Keep "MEET VULNERABILITY FIRST" and "CELEBRATE NEW DEPTH" subsections -- these are personality/interaction patterns, not pacing strategy
- Move the kept content (vulnerability response, depth celebration) into a new section or merge into an existing section (e.g., "CONVERSATION AWARENESS")
- Remove the "LATE-CONVERSATION DEPTH (messages ~14-18)" subsection entirely (AC1, AC2)

### Task 3: Replace truth framing with safety framing

**File:** `packages/domain/src/constants/nerin-chat-context.ts`

- Replace "PEOPLE ARE MORE READY FOR TRUTH THAN THEY THINK." belief header with "PEOPLE DISCOVER MORE WHEN THEY FEEL SAFE TO EXPLORE."
- Update the body text to match the new framing: shift from "accuracy is compassion" to exploration-through-safety
- Ensure the replacement maintains the same structural position in the "HOW TO BEHAVE" section

### Task 4: Update JSDoc comment

**File:** `packages/domain/src/constants/nerin-chat-context.ts`

- Update the file-level JSDoc to remove references to "depth progression" since that section is being removed
- Ensure the comment accurately reflects the remaining sections

### Task 5: Run all tests and verify

- Run `pnpm test:run` to verify all tests pass (green phase)
- Run `pnpm turbo typecheck` to verify type safety
- Ensure no other tests break due to content changes in the character bible

## Technical Notes

- The character bible is a string constant (`CHAT_CONTEXT`) used by `buildChatSystemPrompt()` in `nerin-system-prompt.ts`
- Existing tests in `nerin-system-prompt-persona.test.ts` check for section headers and specific content -- these must be updated
- The `nerin-persona.test.ts` tests check `NERIN_PERSONA` (separate file) and should not be affected
- Contradiction-surfacing must remain untouched (deferred to Story 2.3)
- This is a text-only change to a prompt constant -- no schema, API, or infrastructure changes needed

## Dependencies

- None (independent of Epic 1 territory system)

## Estimation

- Size: Small (prompt text editing + test updates)
- Risk: Low (no logic changes, only prompt content)
