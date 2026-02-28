# Story 17.3: Domain Streak Computation and ConversAnalyzer Retry Bump

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user in conversation,
I want Nerin to stay in a topic for a natural arc before switching, and evidence extraction to be more resilient,
so that conversations don't ping-pong between topics and transient failures don't lose evidence.

## Acceptance Criteria

1. **Given** `send-message.use-case.ts` needs `domainStreak` for `realizeMicroIntent()` (Story 17.2)
   **When** computing domain streak
   **Then** `computeDomainStreak()` walks backward through assistant messages counting consecutive same-`targetDomain` turns, returning 0 if no current domain

2. **Given** `computeDomainStreak()` is a pure function
   **When** located in the codebase
   **Then** it lives at `packages/domain/src/utils/steering/compute-domain-streak.ts` with unit tests

3. **Given** ConversAnalyzer fails on first attempt
   **When** retry policy is applied in `send-message.use-case.ts`
   **Then** it retries twice (3 total attempts), then skips with structured warning log including `sessionId` and `messageId`
   **And** the failure is non-fatal — Nerin still responds with stale steering

## Tasks / Subtasks

- [ ] Task 1: Create `computeDomainStreak()` pure function (AC: #1, #2)
  - [ ] 1.1: Create directory `packages/domain/src/utils/steering/`
  - [ ] 1.2: Create `packages/domain/src/utils/steering/compute-domain-streak.ts` with function signature: `(messages: readonly { targetDomain: LifeDomain | null }[]) => number` — walks backward from last element counting consecutive same-`targetDomain` values; returns 0 if last message has `targetDomain === null`
  - [ ] 1.3: Create barrel export `packages/domain/src/utils/steering/index.ts` re-exporting `computeDomainStreak`
  - [ ] 1.4: Add `export * from "./steering/index.js"` to `packages/domain/src/utils/index.ts` (note: this file uses `.js` extensions for barrel exports — check existing pattern)
  - [ ] 1.5: Export from `packages/domain/src/index.ts` if not already re-exported via utils barrel
  - [ ] 1.6: Write unit tests at `packages/domain/src/utils/steering/__tests__/compute-domain-streak.test.ts`:
    - Empty array → 0
    - Single message with `targetDomain: "work"` → 1
    - Three messages all `"work"` → 3
    - `["work", "work", "relationships"]` (most recent last) → 1 (only last "relationships" counts)
    - Last message `targetDomain: null` → 0
    - Mixed with nulls in middle: `["work", null, "work"]` → 1 (only last streak)

- [ ] Task 2: Wire `computeDomainStreak()` into `send-message.use-case.ts` (AC: #1)
  - [ ] 2.1: Import `computeDomainStreak` from `@workspace/domain`
  - [ ] 2.2: After fetching `recentMessages` (line ~162), call `computeDomainStreak(assistantMessages)` where `assistantMessages` are filtered to `role === "assistant"` messages. Use the same `recentMessages` already fetched (which are the last 6 messages) — filter for assistant role
  - [ ] 2.3: Store result as `domainStreak` for future use by `realizeMicroIntent()` (Story 17.2). For now, log it as part of steering debug info: `logger.debug("Steering context", { domainStreak, previousDomain, targetFacet })`

- [ ] Task 3: Bump ConversAnalyzer retry from 1 to 2 (AC: #3)
  - [ ] 3.1: In `send-message.use-case.ts` (~line 195), change `Effect.retry(Schedule.once)` to `Effect.retry(Schedule.recurs(2))` — this gives 3 total attempts (initial + 2 retries)
  - [ ] 3.2: Update the `catchAll` error log to include `messageId` alongside existing `sessionId`: `logger.warn("ConversAnalyzer failed after 3 attempts, skipping", { sessionId: input.sessionId, messageId: savedMessage.id, error: error.message })`
  - [ ] 3.3: Change log level from `error` to `warn` — this is expected fail-open behavior, not an application error

- [ ] Task 4: Update tests (AC: #1, #3)
  - [ ] 4.1: Verify existing `send-message.use-case.ts` tests still pass with retry bump (mock already supports error simulation via `_setMockError`)
  - [ ] 4.2: If existing tests assert on retry count or log messages, update assertions to match new 3-attempt behavior

## Parallelism

- **Blocked by:** none
- **Blocks:** 17-2-micro-intent-realizer (needs `computeDomainStreak` and `domainStreak` value)
- **Mode:** parallel (can run concurrently with 17-1, 16-x stories)
- **Domain:** backend — domain utils + use-case layer
- **Shared files:** `send-message.use-case.ts` (also touched by 17-1 all-30-facets steering and 17-2 micro-intent realizer — coordinate merge order)

## Dev Notes

### Architecture Patterns and Constraints

- **Hexagonal architecture**: Pure function goes in `packages/domain/src/utils/steering/`. Use-case wiring in `apps/api/src/use-cases/`. No infrastructure layer involvement.
- **Effect-ts patterns**: Retry uses `Schedule` from Effect. Current pattern in codebase: `Schedule.once` (1 retry), `Schedule.exponential("2 seconds")` with `times: 2` (for portrait generation). For ConversAnalyzer, use `Schedule.recurs(2)` for simple 2-retry (no backoff needed — Haiku calls are fast and cheap).
- **Fail-open resilience**: ConversAnalyzer failure is non-fatal (established in Story 10.6). The `catchAll` pattern returns empty evidence array so Nerin responds with stale steering. This is the ONLY allowed `catchAll` in the codebase per anti-pattern rules.
- **Pure functions in domain**: `computeDomainStreak()` must be a pure function with no Effect wrapper — it takes a plain array and returns a number. Same pattern as `computeSteeringTarget()`, `computeFacetMetrics()` in `formula.ts`.

### Source Tree Components to Touch

| File | Action | Notes |
|------|--------|-------|
| `packages/domain/src/utils/steering/compute-domain-streak.ts` | **CREATE** | New pure function |
| `packages/domain/src/utils/steering/index.ts` | **CREATE** | Barrel export |
| `packages/domain/src/utils/steering/__tests__/compute-domain-streak.test.ts` | **CREATE** | Unit tests |
| `packages/domain/src/utils/index.ts` | **MODIFY** | Add steering barrel re-export |
| `apps/api/src/use-cases/send-message.use-case.ts` | **MODIFY** | Wire domainStreak + bump retry |

### Key Implementation Details

**`computeDomainStreak` algorithm:**
```typescript
export function computeDomainStreak(
  messages: readonly { readonly targetDomain: LifeDomain | null }[],
): number {
  if (messages.length === 0) return 0;
  const last = messages[messages.length - 1];
  if (last.targetDomain === null) return 0;
  let streak = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].targetDomain === last.targetDomain) streak++;
    else break;
  }
  return streak;
}
```

**Input type**: Use `readonly { readonly targetDomain: LifeDomain | null }[]` — this is compatible with `AssessmentAssistantMessageEntity` shape without importing the full entity type. The function only needs `targetDomain`.

**`LifeDomain` type**: Import from `@workspace/domain` — defined in `packages/domain/src/constants/life-domain.ts`. Values: `"work" | "relationships" | "family" | "leisure" | "solo" | "other"`.

**Message ordering**: Messages from the repository are ordered by `createdAt ASC` (oldest first). The function walks backward from the end (most recent message) counting consecutive same-domain turns.

**Retry schedule**: `Schedule.recurs(2)` gives exactly 2 retries (3 total attempts). No exponential backoff needed — ConversAnalyzer Haiku calls complete in <1s and transient failures are typically instant (network blip, rate limit). This matches the architecture doc spec: "retry twice, remain non-fatal."

### Testing Standards

- Use `@effect/vitest` with `describe`/`it` from `@effect/vitest` for Effect tests, plain `vitest` for pure function tests
- `computeDomainStreak` is a pure function — use plain `describe`/`it`/`expect` from `vitest` (no Effect needed)
- For send-message retry tests: use `_setMockError` on ConversAnalyzer mock to simulate failures, verify evidence fallback behavior

### Project Structure Notes

- Creating new `steering/` subdirectory under `packages/domain/src/utils/` — this is the first steering utility. Story 17.2 will add `realize-micro-intent.ts` here.
- Barrel export pattern: `packages/domain/src/utils/index.ts` currently exports from `./formula.js`, `./scoring.js`, `./confidence.js`, etc. — check if it uses `.js` extensions (bundler mode) and follow the same pattern.

### References

- [Source: epics-conversation-pipeline.md#Story 2.3] — Story requirements and acceptance criteria
- [Source: architecture-conversation-pipeline.md#ConversAnalyzer] — Error resilience: "Retry once → skip (fire-and-forget)" → upgraded to "Retry twice → skip"
- [Source: architecture-conversation-pipeline.md#IC-2] — `domainStreak computed from message history`
- [Source: architecture-conversation-pipeline.md#D6] — Lambda bump to 0.3 (Story 17.1, not this story)
- [Source: architecture-conversation-pipeline.md#D9] — ConversAnalyzer error resilience: retry twice, remain non-fatal
- [Source: apps/api/src/use-cases/send-message.use-case.ts:195] — Current retry: `Schedule.once`
- [Source: packages/domain/src/utils/formula.ts:288] — Current switch cost logic using `previousDomain`
- [Source: packages/domain/src/entities/message.entity.ts:24-32] — Assistant message entity with `targetDomain` field

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchAll` for ConversAnalyzer (already exists, just update retry count). Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — If updating ConversAnalyzer mock behavior, match live repository interface exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports. `compute-domain-streak.ts` lives in domain layer and must NOT import from infrastructure or use-cases. Use `@workspace/domain` paths for imports.
4. **Type safety** — No unsafe `as` casts. The function input type should be a structural type `{ readonly targetDomain: LifeDomain | null }` — do NOT cast message arrays. No `as any`.
5. **Over-engineering** — Do NOT add exponential backoff to ConversAnalyzer retry. Simple `Schedule.recurs(2)` is sufficient. Do NOT add circuit breaker patterns — this is a simple retry bump.
6. **Premature abstraction** — Do NOT create a generic "retry helper" or "streak computation utility". This is a single-purpose function.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
