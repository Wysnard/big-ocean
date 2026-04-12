# Story 2.4: Portrait Retry with Exponential Backoff

**Status:** done

**Story ID:** 2.4
**Created:** 2026-04-12
**Epic:** 2 - Post-Assessment Transition & Portrait Reading
**Epic Status:** in-progress

---

## Story

As a **system operator**,
I want **portrait generation to retry with increasing delays**,
So that **transient LLM failures don't permanently fail portrait generation**.

---

## Acceptance Criteria

1. **Exponential backoff retry:** The existing `Effect.retry({ times: 2 })` in `generate-full-portrait.use-case.ts` is replaced with exponential backoff — 3 total attempts (initial + 2 retries) with increasing delays (~5s, ~10s).
2. **Failure persistence:** If all 3 attempts fail, a portrait row is inserted with `failedAt` timestamp (existing behavior, unchanged).
3. **Retry in PortraitReadingView:** When the user is on the portrait reading view (`/results/$sessionId?view=portrait`) and portrait status is `"failed"`, they see a retry option that calls `POST /portrait/:sessionId/retry`.
4. **Tests pass:** `pnpm test:run` passes after all changes.

---

## Tasks / Subtasks

- [x] Task 1: Replace simple retry with exponential backoff (AC: #1)
  - [x] Import `Schedule` from `effect` in `generate-full-portrait.use-case.ts`
  - [x] Replace `.pipe(Effect.retry({ times: 2 }),` with `.pipe(Effect.retry({ times: 2, schedule: Schedule.exponential("5 seconds") }),`
- [x] Task 2: Update unit tests for retry behavior (AC: #4)
  - [x] Update `generate-full-portrait.use-case.test.ts` — the LLM failure test must still pass (3 calls total before inserting failed row)
  - [x] Add test verifying `generatePortrait` is called 3 times on repeated failure (not 1 or 2)
  - [x] Use `TestClock.adjust()` to advance past backoff delays in tests
- [x] Task 3: Add failed state + retry button to portrait reading view route (AC: #3)
  - [x] In the results route (`apps/front/src/routes/results/$conversationSessionId.tsx`), when `view === "portrait"` and `effectivePortraitStatus === "failed"`, render a failed state with retry button instead of falling through to ProfileView
  - [x] The retry button must call the actual `POST /portrait/:sessionId/retry` endpoint (not just `refetchPortraitStatus`)
  - [x] After retry call, invalidate the portrait status query so polling resumes
  - [x] Style the failed state consistent with the PortraitReadingView's warm letter format (same max-width, background)
  - [x] Use `RefreshCw` icon from lucide-react (consistent with existing retry in PersonalPortrait)
- [x] Task 3b: Fix existing ProfileView retry to call real endpoint (AC: #3)
  - [x] Replace `onRetryPortrait={() => void refetchPortraitStatus()}` in the results route with a mutation that calls `POST /portrait/:sessionId/retry` then invalidates the portrait status query
- [x] Task 4: Run full test suite (AC: #4)
  - [x] `pnpm test:run` passes
  - [x] `pnpm typecheck` passes
  - [x] `pnpm lint` passes

---

### Review Findings

- [x] [Review][Patch] Fix indentation mismatch in `Effect.retry` block — deviates from codebase precedent in `generate-relationship-analysis.use-case.ts` [`apps/api/src/use-cases/generate-full-portrait.use-case.ts:112-115`]
- [x] [Review][Patch] Add error handling for retry mutation — user gets no feedback if retry endpoint fails (no `onError`, no `isError` display) [`apps/front/src/routes/results/$conversationSessionId.tsx:122-136`]
- [x] [Review][Patch] Add back navigation link in failed portrait view — currently a dead end with only retry button, unlike PortraitReadingView which has `onViewFullProfile` [`apps/front/src/routes/results/$conversationSessionId.tsx:434-461`]
- [x] [Review][Defer] Successful retry transitions user out of portrait view with no generating indicator (falls through to ProfileView when status becomes "generating") — deferred, pre-existing flow

---

## Dev Notes

### Backend: Exponential Backoff Replacement

**File:** `apps/api/src/use-cases/generate-full-portrait.use-case.ts`

The current retry logic at line ~112:
```typescript
.pipe(
  Effect.retry({ times: 2 }),
```

Replace with:
```typescript
import { Effect, Schedule } from "effect";

// ...

.pipe(
  Effect.retry({ times: 2, schedule: Schedule.exponential("5 seconds") }),
```

This gives 3 total attempts (initial + 2 retries) with exponential backoff delays: ~5s, then ~10s.

**Codebase precedent:** `generate-relationship-analysis.use-case.ts` (lines 109-112) already uses this exact pattern: `Effect.retry({ times: 2, schedule: Schedule.exponential("2 seconds") })`. Follow that convention — the `{ times, schedule }` object form is the idiomatic Effect-ts way to cap retries with a schedule.

**Why NOT `Schedule.compose(Schedule.recurs(2))`:** The epic AC mentions this form, but `Schedule.compose` is sequential composition (run one schedule then another), not retry capping. Use the `{ times }` object form instead — it's clearer, matches the codebase, and is semantically correct.

### Frontend: Failed State in Portrait Reading View

**Current behavior:** When `view === "portrait"` in the results route, it checks for `fullContent` from `portraitStatusData?.portrait?.content`. If content exists → `PortraitReadingView`. If no content → falls through to `ProfileView` which has its own retry via `PersonalPortrait`.

**Problem:** When the portrait status is `"failed"` and the user is in portrait reading mode, there's no content, so it silently falls through to ProfileView. The AC requires a dedicated failed state IN the portrait reading view.

**Fix location:** `apps/front/src/routes/results/$conversationSessionId.tsx` — around lines 412-422, add a check for failed status before the fullContent check:

```typescript
if (view === "portrait") {
  // Failed state with retry
  if (effectivePortraitStatus === "failed") {
    // Render warm failed state with retry button
  }

  // Ready state — full reading view
  const fullContent = portraitStatusData?.portrait?.content;
  if (fullContent) {
    return (
      <PageMain className="bg-background">
        <PortraitReadingView content={fullContent} onViewFullProfile={handleBackToProfile} />
      </PageMain>
    );
  }
}
```

**Retry must call the actual endpoint**, not just refetch status. Currently `onRetryPortrait={() => void refetchPortraitStatus()}` does NOT call the retry endpoint — it only re-polls status. The retry endpoint (`POST /portrait/:sessionId/retry`) deletes the failed row and queues a new job. Use:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Effect } from "effect";
import { makeApiClient } from "@/lib/api-client";
```

Create a mutation that calls `client.portrait.retryPortrait({ path: { sessionId } })` and on success invalidates `["portraitStatus", sessionId]` so polling resumes.

**IMPORTANT: Also fix the existing `onRetryPortrait` in ProfileView.** The current `onRetryPortrait={() => void refetchPortraitStatus()}` is incorrect — it doesn't actually retry, it just refetches status. Replace it with the same mutation. Both the portrait reading failed state AND the ProfileView retry button should use the real endpoint.

**Styling for the failed state:** Match the PortraitReadingView's warm letter format:
- Same `min-h-[calc(100dvh-3.5rem)] bg-background` container
- Same `mx-auto max-w-[65ch] px-6 py-12 sm:py-16` article layout
- Nerin-voiced message (warm, not clinical): e.g., "Something went wrong while writing your letter."
- Retry button styled consistently with the reading view (not a system button)
- Include `data-testid="portrait-retry-btn"` on the retry button

### Testing: Effect TestClock for Backoff

The existing test `"should insert failed portrait when LLM generation fails"` passes because `Effect.retry({ times: 2 })` retries instantly. With exponential backoff, the test will hang waiting for real delays unless you use `TestClock`.

**Pattern for testing Effect Schedule with TestClock:**
```typescript
import { Effect, TestClock, Fiber } from "effect";

// Fork the effect, then adjust the clock to skip delays
const fiber = yield* Effect.fork(generateFullPortrait({ sessionId: "session_123" }));
yield* TestClock.adjust("30 seconds"); // Skip past all backoff delays
yield* Fiber.join(fiber);
```

**CRITICAL import ordering** (from CLAUDE.md mock architecture rules):
```typescript
import { vi } from "vitest";                    // FIRST
vi.mock("...");                                  // AFTER vi import
import { describe, expect, it } from "@effect/vitest"; // AFTER vi.mock calls
```

### Project Structure Notes

- All changes are in existing files — no new files needed
- Backend change is in `apps/api/src/use-cases/generate-full-portrait.use-case.ts`
- Backend test is in `apps/api/src/use-cases/__tests__/generate-full-portrait.use-case.test.ts`
- Frontend change is in `apps/front/src/routes/results/$conversationSessionId.tsx`
- Frontend API calls must use typed Effect `HttpApiClient` from `@workspace/contracts` (CLAUDE.md rule)
- Navigation uses TanStack Router `<Link>` — no raw `<a href>` (CLAUDE.md rule)
- Do NOT add or modify `data-testid` attributes on existing elements (CLAUDE.md rule). Only add new ones on new elements.

### Key Architectural Constraints

- **Hexagonal architecture:** The retry schedule is infrastructure-level concern but the use-case orchestrates it — this is acceptable per codebase patterns.
- **Error propagation rule:** Use-cases must NOT remap errors. The `Effect.catchAll` wrapping the retry is fine — it's fail-open resilience, not error remapping.
- **ADR-7 Pattern A:** Queue-based fire-once for portraits. The worker calls `generateFullPortrait`, which contains the retry. Manual retry (via `retry-portrait.use-case.ts`) deletes the failed row and re-queues.
- **ADR-51 context (future):** The three-stage pipeline (ADR-51) will further change the retry logic, but this story targets the current monolithic generator. The exponential backoff pattern established here will carry forward.
- **PortraitReadingView component:** Do NOT modify the `PortraitReadingView` component itself (it only handles the "ready" state with content). The failed state should be rendered inline in the route, next to the component, using the same styling.

### Existing Patterns to Follow

- **Frontend mutations:** See `apps/front/src/hooks/` for existing `useMutation` patterns using `makeApiClient` and `Effect.runPromise`.
- **Query invalidation:** Use `queryClient.invalidateQueries({ queryKey: ["portraitStatus", sessionId] })` after successful retry.
- **Button styling in reading views:** The existing "See your full personality profile" button at the bottom of `PortraitReadingView` uses `text-muted-foreground hover:text-primary transition-colors font-heading text-base` — match this warm styling for the retry button.
- **Retry icon:** Use `RefreshCw` from `lucide-react` (same icon used in `PersonalPortrait.tsx` line 11 for the existing retry button in ProfileView).

### References

- [Source: apps/api/src/use-cases/generate-full-portrait.use-case.ts] — Current retry logic (line ~112)
- [Source: apps/api/src/use-cases/generate-relationship-analysis.use-case.ts#L109-112] — Codebase precedent for exponential backoff retry
- [Source: apps/api/src/use-cases/__tests__/generate-full-portrait.use-case.test.ts] — Existing tests
- [Source: apps/api/src/use-cases/retry-portrait.use-case.ts] — Manual retry use-case
- [Source: apps/front/src/routes/results/$conversationSessionId.tsx] — Results route with portrait view logic
- [Source: apps/front/src/components/results/PortraitReadingView.tsx] — Portrait reading component
- [Source: apps/front/src/hooks/usePortraitStatus.ts] — Portrait status polling hook
- [Source: packages/contracts/src/http/groups/portrait.ts] — Portrait API contract (retryPortrait endpoint)
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-7] — Async generation patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-51] — Three-stage pipeline (future context)
- [Source: CLAUDE.md#Frontend-API-Client-Pattern] — Effect HttpApiClient requirement

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- TestClock + Effect.retry interaction: `Effect.retry` re-runs the same Effect instance (not the function that produced it). To verify retry count in tests, use `Effect.suspend` inside the mock return value so each retry evaluates the lazy wrapper (incrementing a counter). The vi.fn mock itself is only called once to produce the Effect.

### Completion Notes List

- Task 1: Added `Schedule.exponential("5 seconds")` to `Effect.retry({ times: 2 })` in `generate-full-portrait.use-case.ts`. Follows the exact pattern from `generate-relationship-analysis.use-case.ts`.
- Task 2: Updated test to use `it.scoped` with `TestContext.TestContext` for TestClock. Used `Effect.suspend` pattern to track actual LLM call count (3 attempts). Merged the old "LLM failure" test and new "3 retries" test into a single comprehensive test.
- Task 3: Added failed state with warm Nerin-voiced message and retry button in the portrait reading view. Uses `RefreshCw` icon and matches PortraitReadingView styling (`max-w-[65ch]`, same font/spacing). Retry calls real `POST /portrait/:sessionId/retry` endpoint via typed Effect HttpApiClient.
- Task 3b: Replaced `onRetryPortrait={() => void refetchPortraitStatus()}` (which only re-polled status) with `retryPortrait.mutate()` (which calls the real retry endpoint). Both the reading-view failed state and ProfileView now use the same mutation.
- Task 4: `pnpm typecheck`, `pnpm lint`, and full test suite (747 tests) all pass with 0 failures.

### File List

- `apps/api/src/use-cases/generate-full-portrait.use-case.ts` (modified) — added Schedule import and exponential backoff
- `apps/api/src/use-cases/__tests__/generate-full-portrait.use-case.test.ts` (modified) — added TestClock, Fiber, TestContext imports; updated LLM failure test to verify 3 retry attempts with Effect.suspend pattern
- `apps/front/src/routes/results/$conversationSessionId.tsx` (modified) — added useMutation/useQueryClient/RefreshCw imports, retry mutation, failed state UI in portrait view, fixed ProfileView onRetryPortrait
- `apps/front/src/routes/-results-session-route.test.tsx` (modified) — added mock for @tanstack/react-query (useQueryClient, useMutation) to support new hooks

### Change Log

- 2026-04-12: Story 2.4 implementation — exponential backoff retry for portrait generation, failed state with retry button in portrait reading view, fixed ProfileView retry to use real endpoint
