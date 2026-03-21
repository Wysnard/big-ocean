# Story 31-6: Cost Guard — Per-Session Budget Monitoring

## Status: ready-for-dev

## Story

As a user,
I want my conversation to never be interrupted mid-exchange by budget limits,
So that I have a reliable experience even when system costs are high.

## Epic Reference

Epic 2, Story 2.6 — Conversational Assessment & Drop-off Recovery

## FRs/NFRs Covered

- **FR55:** System monitors per-session LLM costs against a budget threshold
- **FR56:** Cost guard never blocks a user mid-session; budget protection applies at session boundaries
- **FR57:** When cost guard triggers, users can retry sending their message
- **FR58:** Users are informed when cost guard triggers and told they can retry
- **NFR6:** Per-assessment LLM cost stays within ~0.20 euro budget
- **NFR18:** Cost guard never terminates an active session — only blocks at session boundaries
- **NFR28:** System logs include per-session cost, completion status, and error events in structured format

## Current State Analysis

The codebase already has significant cost guard infrastructure from Story 10.6:
- Per-user daily cost tracking via Redis (`incrementDailyCost`, `checkDailyBudget`)
- `CostLimitExceeded` error defined in contracts (503 status)
- Fail-open pattern for Redis unavailability
- Message rate limiting (2/minute fixed-window)
- Cost tracking per LLM call in `nerin-pipeline.ts`
- Frontend error handling for 503/CostLimitExceeded with "budget paused" message
- Global daily assessment limit (circuit breaker, Story 15.3)

### What's Missing (Delta)

1. **Per-session cost tracking:** Current tracking is per-user-per-day, not per-session. Need Redis key `session_cost:{sessionId}` to track cumulative session cost.
2. **Per-session budget check:** Need `checkSessionBudget` method that checks session cost against a configurable session budget threshold.
3. **Session boundary enforcement:** Budget check should only block at session start (start-assessment), never mid-conversation (send-message). The current `checkDailyBudget` call in `send-message.use-case.ts` blocks mid-session — this must be changed to a per-session budget that does NOT block mid-conversation.
4. **Structured per-session cost logging:** Need structured log entries with per-session cost totals, completion status, and cost guard events.
5. **Frontend retry UX for cost guard:** The frontend already shows an error banner for budget errors but does NOT show a retry button for `budget` error type. Need to enable retry for cost guard triggers.
6. **AppConfig `sessionCostLimitCents`:** Configurable per-session budget threshold.

## Acceptance Criteria

### AC1: Per-Session Cost Tracking
**Given** a conversation is in progress
**When** per-session LLM costs are being tracked
**Then** the system monitors costs against a configurable budget threshold via Redis (FR55)
**And** cost tracking uses the fail-open pattern — if Redis is unavailable, the conversation continues

### AC2: Session Boundary Enforcement
**Given** the cost guard threshold is exceeded
**When** the user is mid-session
**Then** the current session is never terminated — cost guard only applies at session boundaries (FR56, NFR18)

### AC3: User-Facing Retry on Cost Guard Trigger
**Given** the cost guard triggers at a session boundary
**When** the user attempts to start a new assessment
**Then** the user is informed that the system is temporarily unavailable (FR58)
**And** a retry option is presented (FR57)

### AC4: Structured Cost Guard Logging
**Given** cost guard events occur
**When** the system logs the event
**Then** structured logs include per-session cost, completion status, and the cost guard event (NFR28)

### AC5: Fail-Open Resilience
**Given** Redis is unavailable
**When** a cost guard check is attempted
**Then** the system proceeds without blocking (fail-open pattern)
**And** the Redis failure is logged

## Tasks

### Task 1: Add `incrementSessionCost` and `getSessionCost` to CostGuardRepository

**Subtasks:**
1. Add `incrementSessionCost(sessionId: string, costCents: number): Effect<number, RedisOperationError>` to `CostGuardMethods` interface in `packages/domain/src/repositories/cost-guard.repository.ts`
2. Add `getSessionCost(sessionId: string): Effect<number, RedisOperationError>` to `CostGuardMethods` interface
3. Implement both methods in `packages/infrastructure/src/repositories/cost-guard.redis.repository.ts`:
   - Redis key format: `session_cost:{sessionId}`
   - TTL: 48 hours (same as existing keys)
4. Add `checkSessionBudget(sessionId: string, limitCents: number): Effect<void, RedisOperationError | CostLimitExceeded>` to the interface and implementation
5. Update `__mocks__/cost-guard.redis.repository.ts` with in-memory implementations
6. Update `createTestCostGuardRepository` in the repository file

### Task 2: Add `sessionCostLimitCents` to AppConfig

**Subtasks:**
1. Add `sessionCostLimitCents` field to `AppConfigService` interface in `packages/domain/src/config/app-config.ts` (default: 2000 = $0.20 per session, matching NFR6)
2. Add to `packages/infrastructure/src/config/app-config.live.ts` with env var `SESSION_COST_LIMIT_CENTS`
3. Add to test config mock in `packages/domain/src/config/__mocks__/app-config.ts`
4. Add to `.env.example`

### Task 3: Integrate Per-Session Cost Tracking in Nerin Pipeline

**Subtasks:**
1. In `apps/api/src/use-cases/nerin-pipeline.ts`, after `incrementDailyCost` call, add `incrementSessionCost` call with the same `totalCostCents` (fail-open)
2. Add structured log entry with per-session cost totals

### Task 4: Move Budget Check to Session Boundary (start-assessment only)

**Subtasks:**
1. In `apps/api/src/use-cases/send-message.use-case.ts`, remove the `checkDailyBudget` call. The send-message path should never block on budget — only rate limit checks remain.
2. In `apps/api/src/use-cases/start-assessment.use-case.ts`, add `checkDailyBudget` call (if not already present) so budget enforcement happens at session start only.
3. Update send-message-cost tests to reflect the removal of budget check from send-message.
4. Add/update start-assessment tests to verify budget check at session start.

### Task 5: Add Per-Session Cost Logging (NFR28)

**Subtasks:**
1. Add structured log entry in nerin-pipeline with `event: "session_cost_tracked"` including: `sessionId`, `sessionCostCents`, `exchangeNumber`, `dailyCostCents`, `costKey`
2. When `CostLimitExceeded` fires at session boundary, log with `event: "cost_guard_triggered"` including: `sessionCostCents`, `dailySpend`, `limit`

### Task 6: Enable Retry in Frontend for Cost Guard Errors

**Subtasks:**
1. In `apps/front/src/hooks/useTherapistChat.ts`, the `budget` error type currently has no retry. Since budget check is moving to session start, the 503 error would appear when starting a new assessment, not mid-conversation.
2. In `apps/front/src/components/TherapistChat.tsx`, the ErrorBanner for `budget` type currently sets `autoDismissMs={0}` (persistent) but no retry handler. This is correct for start-assessment context since the user should wait and retry later.
3. Ensure the start-assessment error handling in the frontend shows a clear message with retry capability when `CostLimitExceeded` is returned.

### Task 7: Write Tests (TDD)

**Subtasks:**
1. Unit test `incrementSessionCost` and `getSessionCost` in `packages/infrastructure/src/repositories/__tests__/cost-guard.redis.repository.test.ts`
2. Unit test `checkSessionBudget` in the same test file
3. Test per-session cost increment in nerin-pipeline test
4. Test that send-message no longer calls `checkDailyBudget`
5. Test that start-assessment calls `checkDailyBudget` at session boundary
6. Test fail-open for session cost increment

## Dev Notes

- The `checkDailyBudget` in send-message.use-case.ts currently blocks mid-session, which violates FR56/NFR18. This must be moved to start-assessment only.
- Per-session tracking is additive to per-user daily tracking (both coexist).
- The session cost key has 48h TTL because sessions may span midnight UTC.
- The `CostLimitExceeded` error already maps to HTTP 503 in contracts — no change needed.
- Frontend already handles 503 with persistent banner — retry at session start is the correct UX.
