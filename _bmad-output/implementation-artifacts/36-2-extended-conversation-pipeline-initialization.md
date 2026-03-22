# Story 36-2: Extended Conversation Pipeline Initialization

**Status:** review

## Story

As a user,
I want my extended conversation to feel like a natural continuation,
So that Nerin builds on what we already explored together.

**Epic:** 7 — Conversation Extension
**Depends on:** Story 36-1 (Conversation Extension Purchase & Session Creation)

## Acceptance Criteria

1. **Given** a new extension session is created, **When** the pacing pipeline runs, **Then** Nerin receives ALL messages from ALL the user's sessions in chronological order as one continuous conversation history, so she can naturally reference things the user said in prior conversations.

2. **Given** the territory scorer runs, **When** coverage gaps are computed, **Then** ALL evidence from ALL user sessions contributes to scoring coverage, loaded via a single `findByUserId` query rather than manual session merging.

3. **Given** the pacing pipeline computes visit history and E_target, **When** exchanges are loaded, **Then** ALL exchanges from ALL user sessions are used for visit history and E_target seeding, loaded via a single `findByUserId` query.

4. **Given** anonymous users or query failures, **When** user-level queries are attempted, **Then** the pipeline falls back gracefully to session-scoped queries.

## Tasks

### Task 1: Add `getMessagesByUserId` to message repository

- [x] 1a: Add `getMessagesByUserId(userId: string)` to `AssessmentMessageRepository` interface in `packages/domain/src/repositories/assessment-message.repository.ts`
- [x] 1b: Implement in `packages/infrastructure/src/repositories/assessment-message.drizzle.repository.ts` — JOIN `assessment_message` with `assessment_session` on `sessionId`, filter by `assessment_session.userId`, ORDER BY `createdAt ASC`
- [x] 1c: Add to mock in `packages/infrastructure/src/repositories/__mocks__/assessment-message.drizzle.repository.ts`

### Task 2: Add `findByUserId` to evidence repository

- [x] 2a: Add `findByUserId(userId: string)` to `ConversationEvidenceRepository` interface in `packages/domain/src/repositories/conversation-evidence.repository.ts`
- [x] 2b: Implement in `packages/infrastructure/src/repositories/conversation-evidence.drizzle.repository.ts` — JOIN `conversation_evidence` with `assessment_session`, filter by `userId`
- [x] 2c: Add to mock in `packages/infrastructure/src/repositories/__mocks__/conversation-evidence.drizzle.repository.ts`

### Task 3: Add `findByUserId` to exchange repository

- [x] 3a: Add `findByUserId(userId: string)` to `AssessmentExchangeRepository` interface in `packages/domain/src/repositories/assessment-exchange.repository.ts`
- [x] 3b: Implement in `packages/infrastructure/src/repositories/assessment-exchange.drizzle.repository.ts` — JOIN `assessment_exchange` with `assessment_session`, filter by `userId`, ORDER BY `createdAt ASC`
- [x] 3c: Add to mock in `packages/infrastructure/src/repositories/__mocks__/assessment-exchange.drizzle.repository.ts`

### Task 4: Refactor nerin-pipeline to use user-level queries

- [x] 4a: Replace session-scoped `getMessages(sessionId)` with `getMessagesByUserId(userId)` for authenticated users (fall back to session-scoped for anonymous). Nerin gets the full conversation history across all sessions.
- [x] 4b: Replace session-scoped `findBySession(sessionId)` evidence query with `findByUserId(userId)` for authenticated users (fall back to session-scoped for anonymous).
- [x] 4c: Replace session-scoped `findBySession(sessionId)` exchange query with `findByUserId(userId)` for authenticated users. Use all-user exchanges for visit history, E_target seeding, and currentTerritory. Keep session-scoped exchanges only for turn counting and message linking.
- [x] 4d: Remove `buildExtensionContext` / `extension-context.ts` and the `extensionContext` prompt builder parameter — no longer needed since Nerin gets actual messages.
- [x] 4e: Remove parent-session-specific exchange loading (`parentExchanges`) — replaced by user-level queries.

### Task 5: Tests

- [x] 5a: Write unit tests verifying `getMessagesByUserId` returns messages from all sessions chronologically
- [x] 5b: Write unit tests verifying `findByUserId` (evidence) returns evidence from all sessions
- [x] 5c: Write unit tests verifying `findByUserId` (exchange) returns exchanges from all sessions
- [x] 5d: Write pipeline tests verifying authenticated users get full cross-session context
- [x] 5e: Write pipeline tests verifying anonymous/fail-open fallback to session-scoped queries

## Dev Notes

- Messages, evidence, and exchanges are stored per assessment_session but conceptually belong to the user. When loading context for the pipeline, we should always load by user to see the complete history.
- The previous approach (loading parent session specifically) was too narrow — it only saw one parent, not the full chain of conversations.
- The `extension-context.ts` summary approach is removed entirely. Instead of summarizing themes for Nerin, we give her the actual messages so she can naturally reference prior conversations.
- E_target seeding still matters: on the first turn of an extension session (no prior exchanges in current session), use the most recent exchange from any user session for smoothedEnergy/comfort priors.
- All user-level queries use INNER JOIN on `assessment_session` filtered by `userId`. This means anonymous sessions (userId IS NULL) won't appear — which is correct since they don't have user-level context.

## Dev Agent Record

### Implementation Plan
- Tasks 1-3: Add `findByUserId` / `getMessagesByUserId` repo methods (interface, drizzle impl, mock)
- Task 4: Refactor pipeline to use user-level queries, remove extension-context approach
- Task 5: Tests for new repo methods and pipeline behavior

### Debug Log

### Completion Notes
- All 3 repositories (message, evidence, exchange) now have `findByUserId`/`getMessagesByUserId` methods using INNER JOIN on `assessment_session`
- Pipeline loads all user context (messages, evidence, exchanges) by userId for authenticated users, falls back to sessionId for anonymous
- Removed `extension-context.ts`, `PromptBuilderOptions`, and parent-session-specific loading — replaced by user-level queries
- All 290 tests pass, 0 regressions. Updated test fixtures in both `nerin-pipeline.test.ts` and `send-message.fixtures.ts`

## File List

- packages/domain/src/repositories/assessment-message.repository.ts (modified — added `getMessagesByUserId`)
- packages/domain/src/repositories/conversation-evidence.repository.ts (modified — added `findByUserId`)
- packages/domain/src/repositories/assessment-exchange.repository.ts (modified — added `findByUserId`)
- packages/infrastructure/src/repositories/assessment-message.drizzle.repository.ts (modified — implemented `getMessagesByUserId`)
- packages/infrastructure/src/repositories/conversation-evidence.drizzle.repository.ts (modified — implemented `findByUserId`)
- packages/infrastructure/src/repositories/assessment-exchange.drizzle.repository.ts (modified — implemented `findByUserId`)
- packages/infrastructure/src/repositories/__mocks__/assessment-message.drizzle.repository.ts (modified — added mock)
- packages/infrastructure/src/repositories/__mocks__/conversation-evidence.drizzle.repository.ts (modified — added mock)
- packages/infrastructure/src/repositories/__mocks__/assessment-exchange.drizzle.repository.ts (modified — added mock)
- apps/api/src/use-cases/nerin-pipeline.ts (modified — user-level queries, removed extension-context)
- apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts (modified — updated extension tests, added user-level tests)
- apps/api/src/use-cases/__tests__/__fixtures__/send-message.fixtures.ts (modified — added new mock methods)
- packages/domain/src/utils/steering/prompt-builder.ts (modified — removed `PromptBuilderOptions`)
- packages/domain/src/utils/steering/index.ts (modified — removed extension-context exports)
- packages/domain/src/index.ts (modified — removed extension-context exports)
- packages/domain/src/utils/steering/extension-context.ts (deleted)
- packages/domain/src/utils/steering/__tests__/extension-context.test.ts (deleted)

## Change Log

- 2026-03-22: Refactored from parent-session-specific loading to user-level queries for messages, evidence, and exchanges. Removed extension-context summary approach — Nerin now gets actual conversation history across all sessions.
