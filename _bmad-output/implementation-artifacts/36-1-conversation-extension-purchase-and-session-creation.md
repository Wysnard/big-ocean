# Story 36-1: Conversation Extension Purchase & Session Creation

**Epic:** 7 — Conversation Extension
**Status:** ready-for-dev
**Story ID:** 36-1

## User Story

As a user who has completed their 25-exchange conversation,
I want to purchase a conversation extension to continue exploring with Nerin,
So that I can go deeper and discover more about myself.

## Acceptance Criteria

**AC-1:** Given a user has completed their 25-exchange conversation, when they choose to purchase a conversation extension, then the embedded checkout opens via Polar for the extension product (FR10, FR49).

**AC-2:** Given the extension purchase webhook fires, when an `extended_conversation_unlocked` purchase event is recorded, then the `activate-conversation-extension` use-case creates a new `assessment_session` row with a `parent_session_id` FK linking to the original completed session (FR25).

**AC-3:** Given a new extension session is created, when the user is routed to `/chat`, then the new session is active with status `active` and exchange count starting at 0.

**AC-4:** Given a user has not purchased an extension, when they attempt to start an extended conversation, then they are directed to the extension purchase flow.

**AC-5:** Given a user has an existing active extension session, when the extension purchase webhook fires again (duplicate), then idempotency prevents duplicate session creation.

**AC-6:** Given a user has multiple completed sessions, when the extension purchase is processed, then the extension links to the most recently completed session (the one without a child extension session).

## Tasks

### Task 1: Add `parentSessionId` column to `assessment_session` schema

**Subtasks:**
- 1.1: Add `parent_session_id` nullable UUID column to `assessmentSession` table in `packages/infrastructure/src/db/drizzle/schema.ts` with FK reference to `assessment_session.id` (onDelete: cascade).
- 1.2: Generate Drizzle migration via `pnpm db:generate`.
- 1.3: Update `AssessmentSessionEntity` schema in `packages/domain/src/entities/session.entity.ts` to include optional `parentSessionId` field.

### Task 2: Extend `AssessmentSessionRepository` with `createExtensionSession`

**Subtasks:**
- 2.1: Add `createExtensionSession(userId: string, parentSessionId: string)` method to the `AssessmentSessionRepository` interface in `packages/domain/src/repositories/assessment-session.repository.ts`. Returns `Effect.Effect<{ sessionId: string }, DatabaseError, never>`.
- 2.2: Add `findCompletedSessionWithoutChild(userId: string)` method to the interface. Returns the most recent completed session that has no child extension session. Returns `Effect.Effect<AssessmentSessionEntity | null, DatabaseError, never>`.
- 2.3: Add `hasExtensionSession(parentSessionId: string)` method to the interface. Returns `Effect.Effect<boolean, DatabaseError, never>`.

### Task 3: Implement Drizzle repository methods

**Subtasks:**
- 3.1: Implement `createExtensionSession` in `packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts` — inserts a new row with `parent_session_id`, `userId`, status `active`, messageCount 0.
- 3.2: Implement `findCompletedSessionWithoutChild` — query for the most recent completed session where no other session has `parent_session_id = session.id`.
- 3.3: Implement `hasExtensionSession` — check if any session has the given `parentSessionId`.
- 3.4: Add mock implementations in `packages/infrastructure/src/repositories/__mocks__/assessment-session.drizzle.repository.ts`.

### Task 4: Create `activate-conversation-extension` use-case

**Subtasks:**
- 4.1: Create `apps/api/src/use-cases/activate-conversation-extension.use-case.ts`.
- 4.2: Use-case logic:
  - Accept `userId: string` input.
  - Find the user's most recent completed session without a child extension (`findCompletedSessionWithoutChild`).
  - If no eligible session found, fail with appropriate error.
  - Check if extension already exists (`hasExtensionSession`) for idempotency.
  - If extension already exists, return existing extension session (idempotent).
  - Create new extension session via `createExtensionSession(userId, parentSessionId)`.
  - Persist greeting messages to the new session (reuse greeting pattern from `start-assessment`).
  - Return `{ sessionId, parentSessionId, createdAt, messages }`.
- 4.3: Write unit tests in `apps/api/src/use-cases/__tests__/activate-conversation-extension.use-case.test.ts` covering:
  - Happy path: creates extension session linked to parent.
  - No completed session: fails with error.
  - Idempotency: returns existing extension session if parent already has a child.

### Task 5: Wire `activate-conversation-extension` into `process-purchase` use-case

**Subtasks:**
- 5.1: In `process-purchase.use-case.ts`, after inserting `extended_conversation_unlocked` event, call `activateConversationExtension` to create the extension session.
- 5.2: Handle the case where no eligible parent session is found (log warning, don't fail the purchase event).
- 5.3: Write/update tests for the extended flow.

### Task 6: Add `activateExtension` API endpoint

**Subtasks:**
- 6.1: Add `POST /api/assessment/activate-extension` endpoint to the `AssessmentGroup` contract in `packages/contracts/src/http/groups/assessment.ts`.
  - Request: `{ checkoutId: string }` (for purchase verification).
  - Response: `StartAssessmentResponseSchema` (reuse — sessionId, createdAt, messages).
  - Errors: `SessionNotFound` (404), `Unauthorized` (401), `DatabaseError` (500).
- 6.2: Implement handler in `apps/api/src/handlers/assessment.ts` — verifies purchase, calls `activateConversationExtension`, returns session data.
- 6.3: Write handler-level test if needed.

### Task 7: Frontend — Extension purchase button and routing

**Subtasks:**
- 7.1: Add "Continue with Nerin" button to the results page that opens Polar embedded checkout for the extension product.
- 7.2: After successful purchase verification, navigate to `/chat?sessionId=<newSessionId>`.
- 7.3: Ensure `/chat` route handles the new extension session the same as a regular session.

## Technical Notes

- **Hexagonal architecture:** Repository interface in `domain`, implementation in `infrastructure`, business logic in use-case. No business logic in handlers.
- **Error propagation:** Use-cases must NOT remap errors.
- **Derive-at-read:** No stored aggregations. Extension sessions link to parent via `parent_session_id` FK.
- **Append-only purchase events:** The `extended_conversation_unlocked` event type already exists in the purchase event system.
- **Idempotency:** Extension creation must be safe to retry. Check `hasExtensionSession` before creating.
- **Greeting messages:** Reuse the existing greeting pattern from `start-assessment.use-case.ts`.
- **Conversation extension model per architecture:** New session with `parent_session_id`, pacing pipeline initialized from prior session's final state (Story 7.2 scope — not this story). This story covers session creation only.

## Dependencies

- Epic 3 (Results, Portrait & Monetization) — Polar integration, purchase events system.
- Story 31-6 (Cost Guard) — Budget check at session boundary for extension sessions.
