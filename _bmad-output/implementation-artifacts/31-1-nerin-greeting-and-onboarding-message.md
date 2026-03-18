# Story 31-1: Nerin Greeting & Onboarding Message

Status: ready-for-dev

<!-- Origin: Epic 2 (Conversational Assessment & Drop-off Recovery) in epics.md -->
<!-- Phase 7, Epic 31, Story 1 -->
<!-- Builds on: Story 2-14 (Nerin Greeting Sequence Redesign) which established the current 1 greeting + 1 opening question format -->

## Story

As a **user starting a new conversation**,
I want **Nerin's greeting to include onboarding cues that set expectations for the conversation format, a "not therapy" framing, and a data storage notice**,
So that **I understand what to expect, feel safe to share openly, and am informed about how my data is used**.

## Acceptance Criteria

1. **AC1: "Not therapy" framing in greeting** — The greeting message in `GREETING_MESSAGES[0]` includes a natural "this is not therapy" framing consistent with Nerin's voice (FR8). Per UX spec, this should feel woven in, not clinical — e.g., "this isn't therapy or a test" rather than a formal disclaimer.

2. **AC2: Data storage notice** — The greeting message includes a brief, natural notice that conversation data is stored (FR52). This should be conversational, not legalese — e.g., "I keep notes from our conversation" or similar.

3. **AC3: Onboarding cues** — The greeting message introduces the conversational format without using words like "assessment," "test," or "diagnostic" (FR54). The current greeting already avoids these words ("No quizzes, no right answers") and creates portrait anticipation ("I'll write you something about what I noticed").

4. **AC4: Encouragement cues in opening question context** — The opening questions pool (`OPENING_QUESTIONS`) and/or the greeting message collectively encourage:
   - It's okay to not know the answer
   - Give concrete examples rather than abstract answers
   - Answer as truthfully as possible
   - Go beyond the original question if needed
   These cues should feel natural and woven into Nerin's voice, not presented as a bulleted instruction list.

5. **AC5: No forbidden words** — Neither the greeting message nor opening questions contain the words "assessment," "test," "diagnostic," "personality," "quiz," or "evaluation."

6. **AC6: Cold-start pipeline activation** — When a user sends their first response after the greeting, the pacing pipeline activates with cold-start perimeter selection. (This is already implemented in the send-message use-case — verify no regression.)

7. **AC7: All existing tests pass** — No regressions in `nerin-greeting.test.ts`, `start-assessment-*.use-case.test.ts`, or any related test files.

8. **AC8: Message count unchanged** — The session still starts with exactly 2 messages (1 fixed greeting + 1 random opening question). The greeting count in `start-assessment.use-case.ts` remains 2.

## Tasks / Subtasks

- [ ] Task 1: Update GREETING_MESSAGES constant with onboarding content (AC: #1, #2, #3, #5)
  - [ ] 1.1 Update `GREETING_MESSAGES[0]` in `packages/domain/src/constants/nerin-greeting.ts` to include:
    - "Not therapy" framing woven naturally into Nerin's voice (FR8)
    - Data storage notice in conversational tone (FR52)
    - Retain the existing strengths: "No quizzes, no right answers", portrait anticipation ("write you something"), "messy, contradictory stuff is welcome"
  - [ ] 1.2 Verify the updated message does NOT contain forbidden words: "assessment", "test", "diagnostic", "personality", "quiz", "evaluation"
  - [ ] 1.3 Update JSDoc if the message description has changed

- [ ] Task 2: Add encouragement cues to greeting (AC: #4, #5)
  - [ ] 2.1 Weave encouragement cues into the greeting message naturally in Nerin's voice. The cues should convey: okay to not know, concrete examples welcome, be truthful, go beyond the question if needed. These should NOT be a bulleted list — they should feel like Nerin talking.
  - [ ] 2.2 Verify the encouragement cues don't make the greeting excessively long (aim for 2-4 sentences total for the greeting)

- [ ] Task 3: Update nerin-greeting tests (AC: #7)
  - [ ] 3.1 Update `packages/domain/src/constants/__tests__/nerin-greeting.test.ts`:
    - Update the verbatim text assertion for `GREETING_MESSAGES[0]` to match new content
    - Add assertion for "not therapy" content presence
    - Add assertion for data storage notice presence
    - Retain existing assertions for "Nerin" presence, "write you something" (portrait anticipation), no instructional language
  - [ ] 3.2 Add test: greeting does NOT contain forbidden words ("assessment", "test", "diagnostic", "personality", "quiz", "evaluation")
  - [ ] 3.3 Verify opening question tests still pass unchanged

- [ ] Task 4: Verify cold-start pipeline activation (AC: #6)
  - [ ] 4.1 Read `apps/api/src/use-cases/send-message.use-case.ts` and verify that the first user message triggers cold-start perimeter selection (already implemented)
  - [ ] 4.2 Run existing send-message tests to confirm no regression

- [ ] Task 5: Run full test suite (AC: #7)
  - [ ] 5.1 `pnpm test:run` — all tests pass
  - [ ] 5.2 `pnpm turbo typecheck` — clean
  - [ ] 5.3 `pnpm lint` — clean

## Dev Notes

### Current State

The greeting system was last redesigned in Story 2-14 (Nerin Greeting Sequence Redesign). Current greeting:
> "Hey — I'm Nerin 👋 We're about to have a conversation, and by the end I'll write you something about what I noticed. No quizzes, no right answers — just talk honestly and the messy, contradictory stuff is welcome 🤿"

This greeting already satisfies AC3 partially (no forbidden words, portrait anticipation) but is missing:
- **FR8**: "Not therapy" framing
- **FR52**: Data storage notice
- **FR54 (full)**: Encouragement cues (okay to not know, concrete examples, truthfulness, going beyond)

### UX Spec Guidance

The UX design specification (Section: Conversation Start) specifies that onboarding elements should be spread across the first 1-3 exchanges. The "not therapy" framing and other context should be **woven naturally** into Nerin's voice, not front-loaded as disclaimers.

> "Exchanges 2-3: Nerin naturally weaves in 'not therapy' framing, duration, what you'll get"

Since our current architecture uses a **static greeting** (not LLM-generated), we should incorporate the essential elements into the greeting message itself. The opening question (message 2) provides natural variety.

### Key Files

- `packages/domain/src/constants/nerin-greeting.ts` — greeting messages and opening questions
- `packages/domain/src/constants/__tests__/nerin-greeting.test.ts` — greeting tests
- `apps/api/src/use-cases/start-assessment.use-case.ts` — session creation with greetings
- `apps/api/src/use-cases/__tests__/start-assessment-auth.use-case.test.ts` — auth path tests
- `apps/api/src/use-cases/__tests__/start-assessment-anon.use-case.test.ts` — anon path tests
