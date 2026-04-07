# Deferred Work

## Deferred from: code review of 45-2-repository-and-domain-layer-renames (2026-04-07)

- `mockAssessmentMessageRepo` in `start-assessment.fixtures.ts:35` is missing `updateExchangeId` and `getMessagesByUserId` methods required by `MessageRepository` interface
- `mockExchangeRepo` in `start-assessment.fixtures.ts:48` is missing `findByUserId` method required by `ExchangeRepository` interface
- `smoke.test.ts:58` asserts `session.userId` which is beyond the `ConversationRepository.createSession` return type contract — works only because mock returns a superset
- Stale comments referencing old table names (`assessment_exchange`, `assessment_message`, `assessment session`) remain in domain/infra files (conversation.entity.ts, message.entity.ts, conversation.repository.ts, exchange.drizzle.repository.ts, message.drizzle.repository.ts, and others)
- Mock variable names in shared fixtures still use old naming (`mockAssessmentSessionRepo`, `mockAssessmentMessageRepo`) — affects `start-assessment.fixtures.ts`, `global-assessment-limit.test.ts`, `start-assessment-auth.use-case.test.ts`
