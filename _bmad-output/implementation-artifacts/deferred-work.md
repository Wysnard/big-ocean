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
