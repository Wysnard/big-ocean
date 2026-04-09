# Deferred Work

## Deferred from: code review of 45-2-repository-and-domain-layer-renames (2026-04-07)

- `mockAssessmentMessageRepo` in `start-assessment.fixtures.ts:35` is missing `updateExchangeId` and `getMessagesByUserId` methods required by `MessageRepository` interface
- `mockExchangeRepo` in `start-assessment.fixtures.ts:48` is missing `findByUserId` method required by `ExchangeRepository` interface
- `smoke.test.ts:58` asserts `session.userId` which is beyond the `ConversationRepository.createSession` return type contract — works only because mock returns a superset
- Stale comments referencing old table names (`assessment_exchange`, `assessment_message`, `assessment session`) remain in domain/infra files (conversation.entity.ts, message.entity.ts, conversation.repository.ts, exchange.drizzle.repository.ts, message.drizzle.repository.ts, and others)
- Mock variable names in shared fixtures still use old naming (`mockAssessmentSessionRepo`, `mockAssessmentMessageRepo`) — affects `start-assessment.fixtures.ts`, `global-assessment-limit.test.ts`, `start-assessment-auth.use-case.test.ts`

## Deferred from: code review of 45-3-handler-contract-and-frontend-renames (2026-04-07)

- Integration test `apps/api/tests/integration/assessment.test.ts` uses old `/api/assessment/*` paths and `assessment_token` cookie (55 occurrences) — needs full rename to `/api/conversation/*` and `conversation_token`
- UI string "Start Fresh Assessment" in `apps/front/src/components/ResultsAuthGate.tsx:49,123` — may need updating to "Start Fresh Conversation" depending on product intent
- E2E factory exports `createAssessmentSession`/`sendAssessmentMessage` not renamed — explicitly deferred per story scope notes

## Deferred from: code review of 45-4-fk-column-migration (2026-04-08)

- `parentSessionId` TS property on `conversation` table not renamed to `parentConversationId` — pre-existing from Story 45-1 (SQL column was renamed to `parent_conversation_id` but TS property was left as `parentSessionId`)
- 4 legacy `assessment_session_*` prefixed index names on `conversations` table (`assessment_session_user_id_idx`, `assessment_session_original_lifetime_unique`, `assessment_session_token_unique`, `assessment_session_parent_session_id_idx`) — intentionally kept stable per Story 45-1 scope boundary

## Deferred from: code review of 45-5-fk-column-code-cascade (2026-04-08)

- `exchanges` table definition is missing from `docker/init-db-test.sql` — the table was renamed from `assessment_exchange` to `exchanges` in a prior story but the manual init SQL was not updated to include it

## Deferred from: code review of 45-6-assessment-turn-count-25-to-15 (2026-04-08)

- Dual milestone coordinate systems: `TherapistChat` uses integer percentages (25/50/75) while `DepthMeter` uses decimals (0.25/0.5/0.75) — fragile coupling, not a current bug
- Two divergent "is final turn" checks in `nerin-pipeline.ts` — exchange count vs. atomic `incrementMessageCount` counter could disagree in retry scenarios
- `eval-portrait.ts` variable still named `USER_MESSAGE_COUNT` instead of turn terminology — minor naming inconsistency in script
- Seed script `seed-completed-assessment.ts` produces 6 user turns vs. `assessmentTurnCount=15` — "completed" assessment shows 40% progress in certain views
- Stale `MESSAGE_THRESHOLD` references in `compose.e2e.yaml`, `compose.test.yaml`, and e2e spec comments — dead config from removed env var
- Milestone badge insertion at `i + 1` in TherapistChat creates 1-message visual delay vs. depth-meter tick position — pre-existing
- Resume milestone race condition: milestone tracking effect may fire before messages populate on async resume — pre-existing

## Deferred from: code review of 45-8-deferred-cleanup (2026-04-08)

- Concurrent final-turn requests can double-trigger farewell + finalization: two simultaneous requests for the same session can both compute `isFinalTurn=true` via `getTurnState()` and both attempt farewell message save + status transition to `finalizing`. No request-level mutex or optimistic locking guard exists. Pre-existing.
- `getTurnState(messageCount, 0)` yields `isFinalTurn=true` always when `totalTurns=0`. No guard against zero or negative `totalTurns` in the helper. Currently mitigated by config defaults but no defensive check. Pre-existing.
- `e2e/specs/dashboard-page.spec.ts` line 11 comment says `FREE_TIER_MESSAGE_THRESHOLD=2` but the e2e compose sets it to `1`. Pre-existing factual error in an untouched file.
- `docker/init-db-test.sql` FK constraint still named `assessment_session_user_id_user_id_fkey` (pre-ADR-39 naming). FK constraint names were not in scope for Story 45-8 (only index names).

## Deferred from: code review of 47-3-results-page-and-portrait-accessibility (2026-04-09)

- Route test mock drift: mocks in `-results-session-route.test.tsx` hardcode `role`/`aria-label` values that must stay in sync with real component implementations manually. Pre-existing mock architecture pattern.
- Brittle className assertion in `PortraitReadingView.test.tsx:47` — tests implementation detail (`max-w-[65ch]`) rather than observable behavior. No behavioral alternative available for asserting prose width.

## Deferred from: code review of 47-5-touch-targets-and-contrast-audit (2026-04-09)

- W1: Hardcoded error IDs (e.g., `login-email-error`, `signup-name-error`) risk DOM ID collision if multiple form instances render simultaneously. Pattern works today but `useId()` would be more robust.
- W2: Task 3 contrast audit (AC2) is incomplete — no color token or contrast-related changes in the diff. Explicitly marked incomplete in story spec.
- W3: Task 7.3/7.4 manual mobile-sized walkthrough and light/dark contrast verification not completed. Acknowledged in story completion notes.
- W4: No regression tests for shared `Input` min-height change (`h-9` → `min-h-11`) or `Button` size contract changes. Task 6.1 says to add tests if changes are material.
- W5: No reduced-motion regression tests for `motion-reduce:animate-none` additions to dialog, sheet, and tooltip. Motion behavior is hard to test in JSDOM; manual verification is more appropriate.
