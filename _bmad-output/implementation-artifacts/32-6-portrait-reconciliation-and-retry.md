# Story 32-6: Portrait Reconciliation & Retry

**Status:** ready-for-dev

**Epic:** Epic 3 — Results, Portrait & Monetization
**Story:** 3.6 — Portrait Reconciliation & Retry

## User Story

As a user,
I want my portrait to be generated even if my browser closed during payment,
So that I never pay without receiving my portrait.

## Background

The portrait purchase flow involves a Polar webhook (`portrait_unlocked`) that inserts a purchase event and a portrait placeholder row, then forks a daemon for LLM generation. However, if the browser closes during checkout or the webhook fires before the placeholder INSERT succeeds (e.g., transient DB failure), the user could end up with a paid purchase but no portrait row.

**ADR-13 (Portrait Reconciliation)** defines the solution: on results page load, if a `portrait_unlocked` purchase event exists but no portrait row exists, auto-insert a placeholder and fork a daemon.

This story implements:
1. The `reconcile-portrait-purchase` use-case
2. Integration with the portrait status endpoint to trigger reconciliation
3. Manual retry button for users when portrait generation ultimately fails

## Acceptance Criteria

**AC1: Auto-reconciliation on results page load**
**Given** a `portrait_unlocked` purchase event exists for a user
**When** the results page loads and no portrait row exists in the database
**Then** the `reconcile-portrait-purchase` use-case auto-inserts a placeholder row with content: null
**And** a `forkDaemon` is spawned for portrait generation

**AC2: Lazy retry for stale portraits**
**Given** a portrait placeholder row exists with content: null
**When** the staleness threshold is exceeded (>5 minutes) and retries remain (<3)
**Then** the lazy retry mechanism spawns a new generation daemon
**And** the `UPDATE ... WHERE content IS NULL` constraint ensures only one daemon's result is written (idempotency)

**AC3: Failed portrait notification with manual retry**
**Given** portrait generation ultimately fails after all retries (retryCount >= 3)
**When** the user views the portrait section
**Then** the user is informed that generation failed (FR27)
**And** a manual retry option is available that resets retry count and re-triggers generation

**AC4: Idempotent reconciliation**
**Given** the reconciliation use-case runs on every results page load
**When** a portrait row already exists (generating, ready, or failed)
**Then** reconciliation is a no-op — no duplicate placeholder rows are created

**AC5: Reconciliation handles missing assessment result**
**Given** a `portrait_unlocked` event exists but no `assessment_results` row exists
**When** reconciliation runs
**Then** it skips placeholder insertion and logs the anomaly
**And** no error is propagated to the user

## Tasks

### Task 1: Create `reconcile-portrait-purchase` use-case

**File:** `apps/api/src/use-cases/reconcile-portrait-purchase.use-case.ts`

**Subtasks:**
1. Define `ReconcilePortraitPurchaseInput` interface with `sessionId` and `userId` fields
2. Implement reconciliation logic:
   - Check if `portrait_unlocked` event exists for the user via `PurchaseEventRepository.getCapabilities`
   - Check if a portrait row exists via `PortraitRepository.getFullPortraitBySessionId`
   - If purchase exists but no portrait: lookup `AssessmentResultRepository.getBySessionId` for the result ID
   - Insert placeholder via `PortraitRepository.insertPlaceholder` (catch `DuplicatePortraitError` as no-op)
   - Fork daemon via `Effect.forkDaemon(generateFullPortrait(...))`
3. Handle edge cases:
   - Portrait already exists (any state): return early, no-op
   - No purchase event: return early, no-op
   - No assessment result: log warning, return early
4. Export `reconcilePortraitPurchase` function

### Task 2: Create manual retry use-case

**File:** `apps/api/src/use-cases/retry-portrait.use-case.ts`

**Subtasks:**
1. Define `RetryPortraitInput` with `sessionId` and `userId` fields
2. Implement retry logic:
   - Validate session ownership (session.userId === userId)
   - Get portrait by session ID
   - Validate portrait exists and status is "failed" (retryCount >= 3)
   - Reset retry count to 0 (new repo method or update portrait)
   - Fork daemon for generation
3. Return new portrait status

### Task 3: Add portrait retry contract endpoint

**File:** `packages/contracts/src/http/groups/portrait.ts`

**Subtasks:**
1. Add `retryPortrait` endpoint: `POST /portrait/:sessionId/retry`
   - Path params: `sessionId`
   - Response: `{ status: PortraitStatus }`
   - Errors: `SessionNotFound`, `Unauthorized`

### Task 4: Add `resetRetryCount` to PortraitRepository

**File:** `packages/domain/src/repositories/portrait.repository.ts`
**File:** `packages/infrastructure/src/repositories/portrait.drizzle.repository.ts`

**Subtasks:**
1. Add `resetRetryCount` method to `PortraitRepository` interface
2. Implement in Drizzle repository: `UPDATE portraits SET retry_count = 0 WHERE id = $id`
3. Add mock implementation in `__mocks__/portrait.drizzle.repository.ts`

### Task 5: Integrate reconciliation into portrait status endpoint

**File:** `apps/api/src/use-cases/get-portrait-status.use-case.ts`

**Subtasks:**
1. Add `userId` parameter to `getPortraitStatus`
2. When status is "none", call `reconcilePortraitPurchase` to check for orphaned purchases
3. If reconciliation created a placeholder, return status "generating" instead of "none"

### Task 6: Wire retry endpoint in portrait handler

**File:** `apps/api/src/handlers/portrait.ts`

**Subtasks:**
1. Add handler for `retryPortrait` endpoint
2. Extract `AuthenticatedUser` for ownership validation
3. Call `retryPortrait` use-case
4. Return portrait status

### Task 7: Write unit tests

**File:** `apps/api/src/use-cases/__tests__/reconcile-portrait-purchase.use-case.test.ts`
**File:** `apps/api/src/use-cases/__tests__/retry-portrait.use-case.test.ts`

**Subtasks:**
1. Test reconciliation when purchase exists but no portrait — placeholder created and daemon forked
2. Test reconciliation when portrait already exists — no-op
3. Test reconciliation when no purchase event — no-op
4. Test reconciliation when no assessment result — logs warning, no-op
5. Test reconciliation idempotency (DuplicatePortraitError caught)
6. Test manual retry when portrait is failed — retry count reset and daemon forked
7. Test manual retry when portrait is not failed — rejected
8. Test manual retry with wrong user — rejected

### Task 8: Update portrait status endpoint tests

**File:** `apps/api/src/use-cases/__tests__/get-portrait-status.use-case.test.ts`

**Subtasks:**
1. Update tests for new `userId` parameter
2. Add test: status "none" with purchase event triggers reconciliation
3. Add test: status "none" without purchase event remains "none"

## Technical Notes

- **Reconciliation runs on every portrait status poll**, not just page load. This is by design — the polling interval (2s) acts as the retry interval for reconciliation.
- **DuplicatePortraitError** is caught silently during reconciliation since concurrent reconciliation attempts are expected (multiple polls in flight).
- The existing `generateFullPortrait` use-case handles all generation logic — reconciliation only creates the placeholder and forks the daemon.
- Manual retry resets `retryCount` to 0, allowing the standard lazy retry mechanism (3 daemon-level retries with exponential backoff) to take effect again.
- The `UPDATE ... WHERE content IS NULL` idempotency constraint in `updateContent` ensures that even if multiple daemons run concurrently, only one writes the result.

## Dependencies

- Story 32-3 (Polar Integration & Purchase Events) — provides `PurchaseEventRepository`
- Story 32-4 (PWYW Modal & Portrait Unlock) — provides portrait purchase flow
- Story 13.3 (Full Portrait Async Generation) — provides `generateFullPortrait`, `getPortraitStatus`, `PortraitRepository`

## Out of Scope

- Frontend changes to the portrait polling hook (already handles all states)
- Frontend changes to the PersonalPortrait component (already has retry button)
- Changes to the PWYW checkout flow
