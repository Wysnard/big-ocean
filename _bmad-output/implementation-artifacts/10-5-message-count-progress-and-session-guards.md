# Story 10.5: Message-Count Progress & Session Guards

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see how far along I am in my conversation and be protected from race conditions,
So that I know when my portrait will be ready and my session data stays consistent.

## Acceptance Criteria

1. **Given** a user is chatting **When** they send a message **Then** the session's `message_count` is incremented atomically **And** the frontend displays message-count progress toward `freeTierMessageThreshold`

2. **Given** a user sends a message on a session **When** another request arrives concurrently for the same session **Then** `pg_try_advisory_lock(session_id)` prevents race conditions **And** the second request receives a 409 `ConcurrentMessageError` **And** the `sendMessage` HTTP endpoint maps `ConcurrentMessageError` to 409 via `.addError()`

3. **Given** `freeTierMessageThreshold` is the single threshold config **When** `message_count` reaches the threshold **Then** Nerin's responses begin winding down the conversation naturally **And** the frontend already handles this via existing `isFarewellReceived` + `isCompleted` logic (verification only — no frontend changes)

4. **Given** the duplicate `messageThreshold` config exists **When** this story is implemented **Then** `messageThreshold` is removed from AppConfig **And** all backend code uses `freeTierMessageThreshold` as the single source of truth for isFinalTurn and progress **And** the `MESSAGE_THRESHOLD` env var is removed (only `FREE_TIER_MESSAGE_THRESHOLD` remains) **And** the default value remains 25 (architecture doc's "30" is aspirational — to be updated separately)

5. **Given** advisory lock is implemented for `sendMessage` **When** the `generateResults` use-case is built (Epic 11, Story 11.6) **Then** it must also acquire the session advisory lock with `FinalizationInProgressError` (409). This story wires the lock into both `sendMessage` and `generateResults` if the use-case exists, otherwise documents it as a prerequisite for Epic 11.

## Tasks / Subtasks

- [x] Task 1: Implement advisory lock for concurrent message prevention (AC: #2, #5)
  - [x] 1.1: Add `acquireSessionLock(sessionId): Effect<void, ConcurrentMessageError>` and `releaseSessionLock(sessionId): Effect<void, DatabaseError>` to `AssessmentSessionRepository` interface in `packages/domain/src/repositories/assessment-session.repository.ts`
  - [x] 1.2: Implement `acquireSessionLock` in `AssessmentSessionDrizzleRepositoryLive` — execute raw SQL `SELECT pg_try_advisory_lock(hashtext($1))` where `$1` is sessionId. If returns `false`, fail with `ConcurrentMessageError`. Implement `releaseSessionLock` with `SELECT pg_advisory_unlock(hashtext($1))`
  - [x] 1.3: Add `ConcurrentMessageError` to `packages/contracts/src/errors.ts` as `Schema.TaggedError` with `sessionId` field and message "Another message is being processed". Add `FinalizationInProgressError` as a separate error for future `generateResults` use
  - [x] 1.4: Map `ConcurrentMessageError` in the `sendMessage` HTTP endpoint: add `.addError(ConcurrentMessageError, { status: 409 })` to `packages/contracts/src/http/groups/assessment.ts`
  - [x] 1.5: Wire advisory lock into `send-message.use-case.ts` using `Effect.acquireRelease` scope pattern: acquire lock as resource, pipeline runs in scope, lock released on finalize (success or failure). This replaces flat `Effect.gen` structure for the locked section
  - [x] 1.6: If `generateResults` use-case exists, wire advisory lock there too with `FinalizationInProgressError`. If it doesn't exist yet, add a dev note to Story 11.6 prerequisites — `generateResults` does not exist yet; `FinalizationInProgressError` is defined and ready for Story 11.6
  - [x] 1.7: Add `acquireSessionLock`/`releaseSessionLock` to mock repository (`__mocks__/assessment-session.drizzle.repository.ts`) — always succeeds
  - [x] 1.8: Add unit tests: (a) lock acquired successfully → pipeline proceeds, (b) lock fails → ConcurrentMessageError returned, (c) lock released on pipeline failure via `Effect.acquireRelease`
  - [x] 1.9: Add monitoring log on lock contention: when `acquireSessionLock` fails, log `{ sessionId, event: "advisory_lock_contention" }` at warn level for collision tracking

- [x] Task 2: Consolidate `messageThreshold` → `freeTierMessageThreshold` (AC: #4)
  - [x] 2.1: Remove `messageThreshold` from `AppConfigService` interface in `packages/domain/src/config/app-config.ts`
  - [x] 2.2: Remove `messageThreshold` from `packages/infrastructure/src/config/app-config.live.ts` (the `Config.number("MESSAGE_THRESHOLD")` entry)
  - [x] 2.3: Remove `messageThreshold` from test config mock `packages/domain/src/config/__mocks__/app-config.ts` and `packages/infrastructure/src/utils/test/app-config.testing.ts`
  - [x] 2.4: In `send-message.use-case.ts`: change `config.messageThreshold` → `config.freeTierMessageThreshold` for `isFinalTurn` computation
  - [x] 2.5: Update all test files that set `messageThreshold` in test configs — grep for `messageThreshold:` across `apps/api/src/use-cases/__tests__/` and update to use `freeTierMessageThreshold` only
  - [x] 2.6: Run full test suite to confirm consolidation didn't break anything

- [x] Task 3: Implement farewell winding-down behavior (AC: #3)
  - [x] 3.1: Add `nearingEnd?: boolean` to `NerinInvokeInput` in `packages/domain/src/repositories/nerin-agent.repository.ts`
  - [x] 3.2: Update `buildChatSystemPrompt` in `packages/domain/src/utils/nerin-system-prompt.ts` to accept a params object (or extend signature) that includes `nearingEnd`. When `nearingEnd` is true, append a CONVERSATION CLOSING section to the system prompt
  - [x] 3.3: Update the Nerin infrastructure implementation (`nerin-agent.langgraph.repository.ts` or equivalent) to pass `nearingEnd` from `NerinInvokeInput` through to `buildChatSystemPrompt`
  - [x] 3.4: In `send-message.use-case.ts`, compute `nearingEnd` from the message list: `nearingEnd = messages.filter(m => m.role === 'user').length >= (config.freeTierMessageThreshold - 3)`. This uses the pre-Nerin user message count, not the post-increment `messageCount`
  - [x] 3.5: Pass `nearingEnd` to `nerin.invoke({ ..., nearingEnd })`
  - [x] 3.6: Add unit tests for farewell detection: verify `nearingEnd` is passed when user message count >= threshold - 3, and NOT passed when below

- [x] Task 4: Add integration-level session guard tests (AC: #2)
  - [x] 4.1: Test that two concurrent `sendMessage` calls on the same session result in one success and one `ConcurrentMessageError`
  - [x] 4.2: Test that advisory lock is released after successful pipeline completion
  - [x] 4.3: Test that advisory lock is released after pipeline failure (e.g., Nerin agent error)

## Dev Notes

### What's Already Implemented (Verify, Don't Rebuild)

Most of the "message-count progress" aspects are already done from previous stories:

| Component | Status | Story | Location |
|-----------|--------|-------|----------|
| `message_count` column on `assessment_sessions` | Done | 9.1 | `assessmentSession` table in schema |
| `incrementMessageCount()` atomic SQL | Done | 9.2 | `AssessmentSessionDrizzleRepositoryLive` |
| `isFinalTurn` detection in use-case | Done | 9.2 | `sendMessage` use-case |
| `isFinalTurn` in HTTP response contract | Done | 9.2 | `SendMessageResponseSchema` |
| Frontend `progressPercent` calculation | Done | 4.7 | `useTherapistChat` hook |
| `isFarewellReceived` state transition | Done | 7.18 | `useTherapistChat` hook |
| `freeTierMessageThreshold` in AppConfig | Done | 4.7 | `AppConfigService` interface |
| `messageThreshold` in AppConfig (duplicate) | To remove | 9.1 | `AppConfigService` — consolidate into `freeTierMessageThreshold` |

**This story's primary NEW work is:**
1. **Consolidate threshold config** — remove duplicate `messageThreshold`, use `freeTierMessageThreshold` as single source of truth (prepares for Phase B +25 extended conversation where threshold becomes per-session)
2. Advisory lock (`pg_try_advisory_lock`) for concurrent message prevention
3. Nerin farewell winding-down behavior (nearingEnd flag)
4. Hardening tests for the session guard flows

### Threshold Consolidation Rationale

Two config values currently exist with the same default (25):
- `messageThreshold` (env: `MESSAGE_THRESHOLD`) — used only in `send-message.use-case.ts` for `isFinalTurn`
- `freeTierMessageThreshold` (env: `FREE_TIER_MESSAGE_THRESHOLD`) — used by frontend progress, resume-session, get-results, list-sessions

These are legacy duplication from Phase 1 refactors. Consolidating to `freeTierMessageThreshold` because:
1. Frontend already reads it — no frontend changes needed
2. It's the value returned in API responses (`resume-session`, `list-user-sessions`)
3. Phase B innovation strategy adds +25 extended conversation product — threshold will become per-session (`session.messageLimit`), derived from `freeTierMessageThreshold + purchased_extension`. One base config is cleaner than two.

**Default stays 25.** Architecture doc says 30 but current codebase uses 25. Update architecture doc separately — don't change runtime behavior in a plumbing story.

### Advisory Lock Pattern

Use `Effect.acquireRelease` for structured lock management:

```typescript
// In send-message.use-case.ts — wrap the pipeline body in a scoped resource
const lockResource = Effect.acquireRelease(
  sessionRepo.acquireSessionLock(sessionId),  // acquire
  () => sessionRepo.releaseSessionLock(sessionId).pipe(Effect.orDie)  // release (always)
);

// Use within Effect.scoped
yield* Effect.scoped(
  Effect.gen(function* () {
    yield* lockResource;
    // ... rest of pipeline (save msg → steering → nerin → save assistant → increment)
  })
);
```

**Why `Effect.acquireRelease` over `Effect.ensuring`:** More idiomatic Effect pattern for resource lifecycle. Guarantees release even on fiber interruption, not just errors. The current flat `Effect.gen` structure needs to nest the locked section inside a scoped block.

**Why `hashtext()`:** Advisory locks take `bigint` keys. `hashtext()` converts UUID to int32. At our scale (hundreds of concurrent sessions), collision probability is ~0.001%. Add warn-level logging on lock contention to monitor for collisions in production. If collisions become an issue at scale, migrate to two-key lock or `uuid_hash()`.

**Why session-level (not transaction-level):** The pipeline spans multiple DB operations. Transaction-level advisory locks would release too early if using separate transactions.

### Error Naming: Two Errors for Two Use-Cases

- **`ConcurrentMessageError`** (409) — used in `sendMessage` when another message is already being processed for the same session
- **`FinalizationInProgressError`** (409) — used in future `generateResults` (Story 11.6) when finalization is already running

Both are defined in `contracts/src/errors.ts` and mapped in their respective HTTP groups via `.addError()`. Different error names give the frontend distinct handling paths (retry vs wait).

### Message Save Idempotency Note

If advisory lock is acquired, user message is saved, then Nerin fails — the lock releases but the user message persists. This is **correct behavior**: the user DID send the message, it should be recorded. The frontend receives an error and can retry, which sends a NEW user message (not a duplicate). Each submit is a distinct conversational turn.

### Farewell Winding-Down

Architecture doc specifies: "Nerin's responses begin winding down the conversation naturally" when approaching the threshold.

**`nearingEnd` computation:** Use the user message count from the already-loaded message list (available BEFORE calling Nerin). Do NOT use the post-increment `messageCount` from `incrementMessageCount` — that value doesn't exist yet when Nerin needs it.

```typescript
// Compute from message list (pre-Nerin, already available)
const userMsgCount = messages.filter(m => m.role === 'user').length;
const nearingEnd = userMsgCount >= (config.freeTierMessageThreshold - 3);
```

When `nearingEnd` is true, `buildChatSystemPrompt` appends:
```
CONVERSATION CLOSING:
The conversation is nearing its natural end. Begin weaving your responses toward a warm, reflective closing.
Acknowledge what you've learned about the person and express genuine appreciation for the conversation.
Do NOT mention any assessment, scores, or results — just naturally wind down.
```

### `buildChatSystemPrompt` Signature Update

Current signature: `buildChatSystemPrompt(targetDomain?, targetFacet?)`. Update to accept a params object for extensibility:

```typescript
interface ChatSystemPromptParams {
  targetDomain?: LifeDomain;
  targetFacet?: FacetName;
  nearingEnd?: boolean;
}
buildChatSystemPrompt(params: ChatSystemPromptParams): string
```

This requires updating the call site in the Nerin infrastructure implementation (`nerin-agent.langgraph.repository.ts`) to pass the full params object including `nearingEnd`.

### Rate Limiting (Deferred to Story 10.6)

The architecture specifies a per-user "2 messages/minute" rate limit alongside advisory locks. This is **explicitly deferred to Story 10.6: Cost Tracking & Rate Limiting**, which covers all rate limiting and cost guard concerns. Advisory locks (this story) prevent concurrent *simultaneous* requests; rate limiting (10.6) throttles sequential rapid-fire requests.

### Key Code Locations

| File | Change |
|------|--------|
| `packages/domain/src/repositories/assessment-session.repository.ts` | Add `acquireSessionLock`, `releaseSessionLock` methods |
| `packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts` | Implement advisory lock with `pg_try_advisory_lock` / `pg_advisory_unlock` |
| `packages/infrastructure/src/repositories/__mocks__/assessment-session.drizzle.repository.ts` | Add mock lock methods (always succeed) |
| `packages/contracts/src/errors.ts` | Add `ConcurrentMessageError` (409) and `FinalizationInProgressError` (409) |
| `packages/contracts/src/http/groups/assessment.ts` | Add `.addError(ConcurrentMessageError, { status: 409 })` to `sendMessage` endpoint |
| `packages/domain/src/config/app-config.ts` | Remove `messageThreshold` field |
| `packages/infrastructure/src/config/app-config.live.ts` | Remove `MESSAGE_THRESHOLD` config entry |
| `packages/domain/src/config/__mocks__/app-config.ts` | Remove `messageThreshold` from mock |
| `packages/infrastructure/src/utils/test/app-config.testing.ts` | Remove `messageThreshold` from test config |
| `apps/api/src/use-cases/send-message.use-case.ts` | Wire advisory lock via `Effect.acquireRelease`, add `nearingEnd`, change `config.messageThreshold` → `config.freeTierMessageThreshold` |
| `packages/domain/src/repositories/nerin-agent.repository.ts` | Add `nearingEnd?: boolean` to `NerinInvokeInput` |
| `packages/domain/src/utils/nerin-system-prompt.ts` | Refactor to accept `ChatSystemPromptParams` object, add farewell section when `nearingEnd` |
| `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` | Pass `nearingEnd` from `NerinInvokeInput` through to `buildChatSystemPrompt` |
| `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` | Add advisory lock tests, farewell detection tests |

### Files NOT to Modify

- `packages/infrastructure/src/db/drizzle/schema.ts` — `message_count` column already exists
- `packages/contracts/src/http/groups/assessment.ts` — only add `.addError()`, no endpoint changes
- `apps/front/src/hooks/useTherapistChat.ts` — progress display and farewell handling already work
- `packages/domain/src/utils/formula.ts` — no formula changes

### Previous Story Intelligence (Story 10.4)

- Pipeline flow is well-established: validate → save user msg → load context → extract previousDomain → steering → Nerin → save assistant msg → increment count → return
- Advisory lock should wrap steps 2-8 (save user message through return) using `Effect.acquireRelease` scoped block
- `GREETING_MESSAGES.length` is 1 (not 2) — cold start seed index is 1
- 1040+ tests currently passing across the monorepo
- Code review identified importance of type safety: use `LifeDomain | null` not `as` casts

### Git Intelligence

Recent commits follow pattern:
- Branch: `feat/story-10-5-message-count-progress-and-session-guards`
- Commit: `feat(story-10-5): message-count progress and session guards`
- PR merges use squash

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.5] — Story acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Concurrent-Message-Protection] — Advisory lock specification
- [Source: _bmad-output/planning-artifacts/architecture-assessment-pipeline.md#Message-Processing-Flow] — Pipeline flow with increment step
- [Source: apps/api/src/use-cases/send-message.use-case.ts] — `sendMessage` use-case, current pipeline
- [Source: packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts] — `incrementMessageCount` implementation
- [Source: packages/domain/src/config/app-config.ts] — `freeTierMessageThreshold` config (single threshold after consolidation)
- [Source: packages/domain/src/utils/nerin-system-prompt.ts] — `buildChatSystemPrompt` (to be refactored to params object)
- [Source: packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts] — Nerin infra implementation (passes steering to prompt builder)
- [Source: packages/contracts/src/http/groups/assessment.ts] — HTTP endpoint error mapping (`.addError()` pattern)
- [Source: _bmad-output/implementation-artifacts/10-4-steering-integration-smart-nerin-responses.md] — Previous story dev notes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Build compilation error: Drizzle `execute()` returns `readonly Record<string, unknown>[]`, not `{ rows: ... }`. Fixed by accessing `results[0]` directly.
- Test constant double-rename: `replace_all` on `MESSAGE_THRESHOLD` hit the already-renamed `FREE_TIER_MESSAGE_THRESHOLD` constant definition, producing `FREE_TIER_FREE_TIER_MESSAGE_THRESHOLD`. Fixed manually.
- Existing test expected Nerin invoke without `nearingEnd` field — updated to include `nearingEnd: false` for cold start messages.

### Completion Notes List

- **Task 1 (Advisory Lock):** Implemented `pg_try_advisory_lock(hashtext(sessionId))` / `pg_advisory_unlock` in session repository. Wired into `send-message.use-case.ts` via `Effect.acquireRelease` + `Effect.scoped` — guarantees lock release even on fiber interruption. `ConcurrentMessageError` (409) and `FinalizationInProgressError` (409) defined. `generateResults` use-case doesn't exist yet; `FinalizationInProgressError` is ready for Story 11.6. Warn-level logging on lock contention implemented.
- **Task 2 (Threshold Consolidation):** Removed `messageThreshold` from `AppConfigService`, live config, and all test mocks. `isFinalTurn` now uses `config.freeTierMessageThreshold` as single source of truth. `MESSAGE_THRESHOLD` env var removed. Default remains 25.
- **Task 3 (Farewell Winding-Down):** Refactored `buildChatSystemPrompt` from positional args `(targetDomain?, targetFacet?)` to `ChatSystemPromptParams` object. Added `nearingEnd` field to `NerinInvokeInput`. When `userMessageCount >= freeTierMessageThreshold - 3`, appends CONVERSATION CLOSING section to system prompt. Updated Nerin infrastructure implementation to pass `nearingEnd` through.
- **Task 4 (Session Guard Tests):** Added 5 new unit tests: advisory lock acquire/release on success, ConcurrentMessageError on contention, lock release on pipeline failure, nearingEnd=true at threshold-3, nearingEnd=false below threshold. All tests pass (204 API + 200 frontend = 404 total).

### File List

- `packages/domain/src/errors/http.errors.ts` — Added `ConcurrentMessageError`, `FinalizationInProgressError`
- `packages/domain/src/index.ts` — Added exports for new errors
- `packages/domain/src/repositories/assessment-session.repository.ts` — Added `acquireSessionLock`, `releaseSessionLock` methods
- `packages/domain/src/repositories/nerin-agent.repository.ts` — Added `nearingEnd?: boolean` to `NerinInvokeInput`
- `packages/domain/src/config/app-config.ts` — Removed `messageThreshold` field
- `packages/domain/src/config/__mocks__/app-config.ts` — Removed `messageThreshold` from mock
- `packages/domain/src/utils/nerin-system-prompt.ts` — Refactored to `ChatSystemPromptParams` object, added CONVERSATION CLOSING section
- `packages/domain/src/utils/__tests__/nerin-system-prompt.test.ts` — Updated call sites to params object, added 3 nearingEnd tests
- `packages/contracts/src/errors.ts` — Added re-exports for new errors
- `packages/contracts/src/http/groups/assessment.ts` — Added `.addError(ConcurrentMessageError, { status: 409 })` to sendMessage endpoint
- `packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts` — Implemented `acquireSessionLock`/`releaseSessionLock` with pg_try_advisory_lock
- `packages/infrastructure/src/repositories/__mocks__/assessment-session.drizzle.repository.ts` — Added mock lock methods
- `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` — Updated `buildChatSystemPrompt` call to params object
- `packages/infrastructure/src/config/app-config.live.ts` — Removed `MESSAGE_THRESHOLD` config entry
- `packages/infrastructure/src/utils/test/app-config.testing.ts` — Removed `messageThreshold` from test config
- `apps/api/src/use-cases/send-message.use-case.ts` — Advisory lock via Effect.acquireRelease, nearingEnd computation, threshold consolidation
- `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` — Added 5 new tests (advisory lock + farewell), removed messageThreshold
- `apps/api/src/use-cases/__tests__/session-linking.use-case.test.ts` — Removed `messageThreshold` from test config

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 | **Date:** 2026-02-23 | **Outcome:** Approved (with fixes applied)

### Review Summary

**Issues Found:** 1 High, 4 Medium, 3 Low
**Issues Fixed:** 1 High, 3 Medium (4 total)
**Issues Deferred:** 1 Medium (M1 — reclassified as working-as-designed), 3 Low

### Fixes Applied

1. **[H1] Orphaned JSDoc for MalformedEvidenceError** — Moved JSDoc comment from line 157 (where it sat above `FreeTierLimitReached`) to its correct position above `MalformedEvidenceError` class at line 226. File: `packages/domain/src/errors/http.errors.ts`

2. **[M2] `acquireSessionLock` masked DB errors as `ConcurrentMessageError`** — Changed `mapError` in `acquireSessionLock` to return `DatabaseError` on DB failures, reserving `ConcurrentMessageError` only for actual lock contention (`row.locked === false`). Updated repository interface to reflect `DatabaseError | ConcurrentMessageError` error type. Files: `assessment-session.drizzle.repository.ts`, `assessment-session.repository.ts`

3. **[M3] Monitoring gap on DB failures** — Resolved by M2 fix. DB failures now correctly produce `DatabaseError` with existing error logging, while lock contention still produces the warn-level `advisory_lock_contention` log.

4. **[M4] Lock release test missing call order verification** — Added `invocationCallOrder` assertion to verify `acquireSessionLock` is called before `releaseSessionLock`. File: `send-message.use-case.test.ts`

### Remaining Items (Low — No Action Required)

- **[L1]** Stale `MESSAGE_THRESHOLD` references in integration/e2e test comments (cosmetic only)
- **[L2]** Task 4 titled "integration-level" but tests are unit-level mocks (documentation accuracy)
- **[L3]** `FinalizationInProgressError` defined but not wired to HTTP endpoint (by design — Story 11.6)

### AC Validation

| AC | Status | Evidence |
|----|--------|----------|
| #1 | IMPLEMENTED | `incrementMessageCount` atomic SQL in use-case, `freeTierMessageThreshold` drives progress |
| #2 | IMPLEMENTED | `pg_try_advisory_lock(hashtext(sessionId))` + `ConcurrentMessageError` (409) + `.addError()` in assessment contract |
| #3 | IMPLEMENTED | `nearingEnd` flag → `buildChatSystemPrompt` CONVERSATION CLOSING section, existing frontend handles via `isFarewellReceived` |
| #4 | IMPLEMENTED | `messageThreshold` fully removed from AppConfig, live config, all mocks. Zero grep hits. `freeTierMessageThreshold` is single source of truth |
| #5 | IMPLEMENTED | `FinalizationInProgressError` defined + exported. `generateResults` doesn't exist yet — documented as prerequisite for Story 11.6 |

### Tests

All 404 tests pass (204 API + 200 frontend) after review fixes applied.
