# Story 2.14: Nerin Greeting Sequence Redesign

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Origin: Design Thinking 2026-02-20, Prototype K (Priority 3 — Greeting) -->
<!-- Previous Story: 2-13-nerin-chat-foundation-redesign (done) -->

## Story

As a **User starting a new assessment**,
I want **Nerin's greeting to be a single warm message followed immediately by an opening question — with the weakest question replaced by one that primes belief #3 (ordinary = interesting)**,
So that **the conversation starts faster, Nerin earns authority through question quality instead of self-description, and users engage from their second turn instead of third**.

## Acceptance Criteria

1. **AC1: Single Combined Greeting Message** — `GREETING_MESSAGES` array in `packages/domain/src/constants/nerin-greeting.ts` contains exactly **1 message** (down from 2). The single message is verbatim from design thinking Prototype K:

   > Hey — I'm Nerin 👋 We're about to have a conversation, and by the end I'll write you something about what I noticed. No quizzes, no right answers — just talk honestly and the messy, contradictory stuff is welcome 🤿

   Key changes from current 2-message version:
   - Drops "personality dive master" label (earns it through question quality instead)
   - Drops "personality" framing (loaded word)
   - Combines permission framing ("messy, contradictory") into same message
   - "Write you something" creates portrait anticipation without revealing it
   - 2 emojis (👋 greeting, 🤿 metaphor) down from 3 (👋 🤿 🐙)

2. **AC2: Beach Question Replaced** — The beach question is removed from `OPENING_QUESTIONS` and replaced with the new belief #3 primer. Revised pool (6 questions):

   | # | Question | Status |
   |---|----------|--------|
   | 1 | "If someone followed you around for a week, what would surprise them most about how you actually live?" | Kept |
   | 2 | "Free weekend ahead — are you the type to fill every hour with plans, or do you need it completely open? What happens when you get the opposite?" | Kept (minor wording tweak) |
   | 3 | "If you had to send someone to explain *you* to a stranger — who are you sending, and what are they getting wrong?" | Kept |
   | 4 | "What's a rule you always break — and one you'd never break?" | Kept |
   | 5 | "What's the most boring true thing about you? Sometimes those are the ones I find most interesting." | **NEW** (replaces beach) |
   | 6 | "If you had to wear a sign around your neck for a day that said one true thing about you — what would it say?" | Kept |

3. **AC3: Session Start Sends 2 Messages** — `start-assessment.use-case.ts` persists and returns exactly **2** greeting messages (1 fixed + 1 random question), down from 3.

4. **AC4: Message Cadence Unaffected** — The batch/steer/coast cadence (N % 3 cycle) is verified unaffected. `messageCount` in `send-message.use-case.ts` counts only user messages (`previousMessages.filter(msg => msg.role === "user").length`), so greeting messages (assistant role) don't shift the cycle.

5. **AC5: All Existing Tests Pass** — No regressions. Test files updated:
   - `nerin-greeting.test.ts` — updated for 1 greeting message, revised question pool
   - `start-assessment.use-case.test.ts` — updated for 2 total messages (was 3)
   - `start-assessment-effect.use-case.test.ts` — updated for 2 total messages (was 3)

6. **AC6: JSDoc and Comments Updated** — All JSDoc comments referencing "3 greeting messages" or "2 fixed messages" updated to reflect "1 fixed message + 1 random question = 2 messages".

## Tasks / Subtasks

- [x] **Task 1: Update GREETING_MESSAGES constant** (AC: 1)
  - [x] 1.1 Replace `GREETING_MESSAGES` array in `packages/domain/src/constants/nerin-greeting.ts` from 2 items to 1 item with the combined message from Prototype K
  - [x] 1.2 Update JSDoc comment: "Persisted to the database as the first 2 assistant messages" (was 3), "Message 1 is fixed. Message 2 is randomly selected from OPENING_QUESTIONS." (was "Messages 1-2 are fixed. Message 3 is randomly selected")

- [x] **Task 2: Update OPENING_QUESTIONS pool** (AC: 2)
  - [x] 2.1 Remove beach question: `"You're at the beach — are you the one diving straight into the waves, testing the water with your toes first, or watching from the shore with a book? 🌊"`
  - [x] 2.2 Add new question at position 5 (0-indexed 4): `"What's the most boring true thing about you? Sometimes those are the ones I find most interesting."`
  - [x] 2.3 Apply minor wording tweak to question 2: `"When you've got a free weekend"` → `"Free weekend ahead"` (matches Prototype K)
  - [x] 2.4 Update JSDoc: "One is randomly selected per session as message 2." (was "message 3")

- [x] **Task 3: Update start-assessment use-case** (AC: 3, 6)
  - [x] 3.1 Update comment in `createSessionWithGreetings()`: "Build the 2 greeting messages (1 fixed + 1 random opening question)" (was "3 greeting messages (2 fixed + 1 random)")
  - [x] 3.2 No logic change needed — spread `[...GREETING_MESSAGES, openingQuestion]` automatically produces 2 items when `GREETING_MESSAGES` has 1 item

- [x] **Task 4: Update nerin-greeting tests** (AC: 5)
  - [x] 4.1 Update `"has exactly 2 fixed messages"` → `"has exactly 1 fixed message"` (length assertion: 2 → 1)
  - [x] 4.2 Update `"message 1 introduces Nerin as a personality dive master"` → update assertion to check for `"Nerin"` (still present) but NOT `"personality dive master"` (removed). Add assertion for `"write you something"` (portrait anticipation)
  - [x] 4.3 Remove `"message 2 encourages messy/contradictory answers"` test (message 2 is now the opening question, not a fixed message). The "messy, contradictory" content is now in message 1.
  - [x] 4.4 Update `"does not contain instructional language"` test — still valid, applies to single message
  - [x] 4.5 Update `pickOpeningQuestion` edge case: `OPENING_QUESTIONS[5]` index still valid (pool remains 6)

- [x] **Task 5: Update start-assessment use-case tests** (AC: 5)
  - [x] 5.1 In `start-assessment-effect.use-case.test.ts`:
    - `"should return session ID, creation timestamp, and greeting messages"` — change `toHaveLength(3)` → `toHaveLength(2)`, remove `GREETING_MESSAGES[1]` assertion, update `OPENING_QUESTIONS` check from `result.messages[2]` → `result.messages[1]`
    - `"should return greeting messages"` (anonymous path) — same changes
  - [x] 5.2 In `start-assessment.use-case.test.ts`:
    - `"should save exactly 3 greeting messages to the database"` → rename to "2 greeting messages", change `toHaveBeenCalledTimes(3)` → `toHaveBeenCalledTimes(2)`
    - `"should save the 2 fixed greeting messages in order"` → rename to "should save the fixed greeting message and opening question in order", update assertions (only `GREETING_MESSAGES[0]` for first call, `OPENING_QUESTIONS` contains check for second call)
    - `greetingCount: 3` → `greetingCount: 2` (2 occurrences: authenticated + anonymous paths)
    - Anonymous greeting persistence tests — same pattern as authenticated

- [x] **Task 6: Run full test suite and verify** (AC: 5)
  - [x] 6.1 `pnpm test:run` — all tests pass (932 total: 605 domain + 174 API + 153 front), no regressions
  - [x] 6.2 `pnpm lint` — clean (pre-existing API warnings only)
  - [x] 6.3 `pnpm build` — succeeds

## Dev Notes

### Problem This Solves

The current greeting sequence has 4 issues identified in design thinking Prototype K:

1. **Two declarative messages before asking anything** — Nerin talks for 2 full messages establishing credentials and giving permission. By message 3, the user has been listening, not participating.
2. **"Think of me as your personality dive master" is a label** — asks users to accept identity on faith. The character bible principle is authority shows through precision, not credentials.
3. **Permission message is slightly defensive** — "There's no good or bad answers" frames the experience by what it ISN'T. Users not thinking about quizzes start thinking about quizzes.
4. **Beach question breaks the "no quiz" promise** — A/B/C format ("waves, toes, or book?") is exactly the categorization we just said we wouldn't do.

### What Changes

| Aspect | Current (3 messages) | Revised (2 messages) |
|--------|---------------------|---------------------|
| Messages before user speaks | 3 | 2 |
| Self-labeling | "personality dive master" | None — earns it through questions |
| Permission framing | Split across 2 messages | One sentence, embedded naturally |
| Belief #3 (ordinary = interesting) | Missing | In question pool (new Q5) |
| Portrait anticipation | "see yourself in ways that might surprise you" | "I'll write you something about what I noticed" |
| Emoji density | 3 emojis in 2 messages (👋 🤿 🐙) | 2 emojis in 1 message (👋 🤿) |
| Beach quiz question | Present | Removed, replaced with "boring true thing" |

### Implementation Constraints

1. **DO NOT change any repository interfaces** — No domain interface changes.
2. **DO NOT change API contracts or schemas** — `StartAssessmentResponseSchema` returns `messages: Array<...>` which naturally accommodates 2 items instead of 3.
3. **DO NOT change database schema** — No migration needed.
4. **DO NOT change the orchestrator or steering logic** — Message cadence counts user messages only.
5. **DO NOT change NERIN_PERSONA or CHAT_CONTEXT** — Those were handled in Story 2.13.
6. **`pickOpeningQuestion()` function signature unchanged** — Same name, same parameter, same return type. Only pool content changes.

### Message Cadence Verification

Confirmed safe — the cadence system is **not affected** by this change:

```typescript
// send-message.use-case.ts line 81-82
const messageCount = previousMessages.filter((msg) => msg.role === "user").length;
```

- Greeting messages are persisted as `role: "assistant"` — they are NOT counted
- User message counter starts at 0 regardless of how many greeting messages exist
- First user reply → messageCount = 1, Third user reply → messageCount = 3 (first batch trigger)
- Changing from 3→2 greeting messages has zero impact on the batch/steer/coast cadence

### Existing Sessions (Backward Compatibility)

**No migration needed.** Existing sessions have 3 greeting messages stored in the database. New sessions will have 2. This is handled naturally because:
- Message count only considers user messages (assistant greeting count is irrelevant)
- Resume flow loads all messages from DB regardless of count
- The orchestrator receives the full message array and doesn't care about greeting structure

### Seed Script

The seed script (`scripts/seed-completed-assessment.ts`) does NOT include greeting messages in the seeded conversation — it seeds 12 substantive conversation messages (6 user + 6 assistant turns). **No seed script changes needed.**

### File Changes (Ordered)

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `packages/domain/src/constants/nerin-greeting.ts` | **MODIFY** | GREETING_MESSAGES: 2→1 item (combined). OPENING_QUESTIONS: replace beach with "boring true thing", tweak Q2 wording. Update JSDoc. |
| 2 | `packages/domain/src/constants/__tests__/nerin-greeting.test.ts` | **MODIFY** | Update assertions for 1 greeting message, remove message 2 test, update content checks |
| 3 | `apps/api/src/use-cases/start-assessment.use-case.ts` | **MODIFY** | Update comments only (logic auto-adapts to array length) |
| 4 | `apps/api/src/use-cases/__tests__/start-assessment.use-case.test.ts` | **MODIFY** | Update 3→2 message count assertions, greeting count assertions |
| 5 | `apps/api/src/use-cases/__tests__/start-assessment-effect.use-case.test.ts` | **MODIFY** | Update 3→2 message count assertions |

**5 files modified. 0 new files. 0 deleted files.**

### Previous Story Intelligence

**Story 2-13 (Nerin Chat Foundation Redesign) — done:**
- Trimmed NERIN_PERSONA (~780→~350 tokens), replaced CHAT_CONTEXT entirely
- 932 tests passing (603 domain + 176 API + 153 front)
- Key learning: String constant changes are low-risk. Test updates are primarily assertion adjustments.
- **Explicitly deferred greeting changes to this story** (constraint #6: "DO NOT change the greeting messages")
- Clean implementation, no regressions — sets stable baseline for this story

### Git Intelligence

Recent commits:
- `a5b3942` feat(story-8-7): portrait prompt rework — portrait changes, no greeting impact
- `fc4d7c3` feat(story-2-13): Nerin chat foundation redesign — most relevant, created the prompt architecture this story builds on
- Pattern: conventional commits with `feat(story-X-Y):` prefix

### Testing Strategy

1. **Update `nerin-greeting.test.ts`** — Adjust assertions for 1 greeting message (was 2), verify combined message content, verify revised question pool (beach removed, "boring true thing" added)
2. **Update `start-assessment.use-case.test.ts`** — Change 3→2 message count in both authenticated and anonymous paths, update greeting persistence order checks
3. **Update `start-assessment-effect.use-case.test.ts`** — Change 3→2 message count in both paths
4. **No orchestrator tests affected** — Message cadence is user-message-only
5. **No integration tests needed** — This is a string constant change, not a structural change

### Open Questions from Design Thinking

1. **"Write you something"** — Prototype K flagged this as potentially too vague. Current decision: keep it. It creates mystery around the portrait without overselling. Alternative noted: "I'll have something to show you about what I see."
2. **Should message 1 reference the portrait at all?** — Prototype K kept the reference. Complete surprise risks earlier disengagement.

### Project Structure Notes

- All greeting constants: `packages/domain/src/constants/nerin-greeting.ts`
- Greeting consumed by: `apps/api/src/use-cases/start-assessment.use-case.ts`
- Exported from domain barrel: `packages/domain/src/index.ts` — `GREETING_MESSAGES`, `pickOpeningQuestion` already exported, no change needed
- `OPENING_QUESTIONS` also exported — pool content changes but export unchanged

### References

- [Source: `_bmad-output/design-thinking-2026-02-20.md` — Prototype K: Revised Greeting Sequence, lines 2496-2638]
- [Source: `_bmad-output/design-thinking-2026-02-20.md` — Priority 3 Action Items, lines 3558-3563]
- [Source: `_bmad-output/design-thinking-2026-02-20.md` — Test 1.3 Greeting, lines 3373-3383]
- [Source: `_bmad-output/design-thinking-2026-02-20.md` — Open Questions #7-8, lines 3525-3526]
- [Source: `packages/domain/src/constants/nerin-greeting.ts`] — Current greeting constants (modification target)
- [Source: `apps/api/src/use-cases/start-assessment.use-case.ts`] — Greeting consumption (comment update)
- [Source: `apps/api/src/use-cases/send-message.use-case.ts:81-82`] — Message count logic (user-only, confirms cadence safety)
- [Source: `_bmad-output/implementation-artifacts/2-13-nerin-chat-foundation-redesign.md`] — Previous story with prompt architecture and learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

N/A — clean implementation with no failures.

### Completion Notes List

- **Task 1**: Replaced `GREETING_MESSAGES` from 2 items to 1, combining old messages 1+2 per Prototype K. Dropped "personality dive master" label, "personality" framing, second permission message. Added "write you something" portrait anticipation. Reduced emoji density from 3 to 2. Updated JSDoc to reflect 2-message greeting (was 3).
- **Task 2**: Removed beach question ("You're at the beach — are you the one diving straight into the waves..."). Added "boring true thing" question (belief #3 primer). Applied wording tweak to Q2: "When you've got a free weekend" → "Free weekend ahead". Pool remains at 6 questions. Updated JSDoc.
- **Task 3**: Updated 2 comments in `start-assessment.use-case.ts`: helper JSDoc ("persist 3" → "persist 2") and inline comment ("3 greeting messages (2 fixed + 1 random)" → "2 greeting messages (1 fixed + 1 random)"). No logic changes needed — spread operator auto-adapts.
- **Task 4**: Rewrote `nerin-greeting.test.ts` — 11 tests (was 9, +2 new: beach question absence, boring true thing presence). Updated length assertion 2→1, replaced "personality dive master" check with "write you something" + "not contain personality dive master", replaced separate message 2 test with message 1 "messy, contradictory" check.
- **Task 5**: Updated both start-assessment test files. Effect tests: 2 tests updated (authenticated + anonymous paths) — `toHaveLength(3)` → `toHaveLength(2)`, removed `GREETING_MESSAGES[1]` assertion, updated OPENING_QUESTIONS index. Spy tests: 8 tests updated — renamed "save exactly 3" → "save exactly 2", renamed "save the 2 fixed greeting messages" → "save the fixed greeting message and opening question", removed "save a 3rd message" test, updated `greetingCount: 3` → `greetingCount: 2` (2 occurrences), updated message content matching.
- **Task 6**: Full suite green. 932 tests (605 domain + 174 API + 153 front). Domain test count: 603 → 605 (+2 new greeting tests). API test count: 176 → 174 (-2 removed "save 3rd from pool" tests, consolidated into order tests). Lint clean. Build succeeds.

### Change Log

- 2026-02-22: Implemented Story 2.14 — Nerin Greeting Sequence Redesign. Combined 2 fixed greeting messages into 1 (Prototype K), replaced beach question with "boring true thing" (belief #3 primer), tweaked Q2 wording. All 932 tests pass, no regressions.

### File List

- `packages/domain/src/constants/nerin-greeting.ts` — MODIFIED (GREETING_MESSAGES 2→1 item, OPENING_QUESTIONS beach→boring, Q2 wording, JSDoc)
- `packages/domain/src/constants/__tests__/nerin-greeting.test.ts` — MODIFIED (11 tests, updated assertions for 1 greeting message, +2 new tests)
- `apps/api/src/use-cases/start-assessment.use-case.ts` — MODIFIED (comments only: 3→2 greeting messages)
- `apps/api/src/use-cases/__tests__/start-assessment.use-case.test.ts` — MODIFIED (30 tests, 3→2 message counts, greeting persistence assertions)
- `apps/api/src/use-cases/__tests__/start-assessment-effect.use-case.test.ts` — MODIFIED (3→2 message counts in 2 tests)
