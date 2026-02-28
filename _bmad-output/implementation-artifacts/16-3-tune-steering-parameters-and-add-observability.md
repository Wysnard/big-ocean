# Story 16.3: Tune Steering Parameters and Add Observability

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a product operator,
I want conversation quality metrics tracked and the domain switch cost tuned,
so that I can evaluate steering effectiveness and conversations feel less jumpy.

## Acceptance Criteria

1. **Given** `formula.ts` `FORMULA_DEFAULTS`
   **When** the lambda (λ) value is checked
   **Then** it has been bumped from 0.1 to 0.3

2. **Given** an active assessment conversation
   **When** each message is processed in `send-message.use-case.ts`
   **Then** the following metrics are logged at the existing "Steering computed" log point:
   - `coveredFacets`: count of facets with confidence > 0.3 out of 30
   - `questionsPerAssistantTurn`: always 1 in current architecture (placeholder for future multi-question detection)
   - `topicTransitionsPerFiveTurns`: number of domain switches in the last 5 assistant messages (computed from stored `steeringDomain` on assistant messages)

3. **Given** the λ=0.3 change is deployed
   **When** `topicTransitionsPerFiveTurns` exceeds 4.0 across 50+ sessions (indicating conversations are still too jumpy)
   **Then** revert λ to 0.1 and investigate — the observability metrics from this story provide the signal

## Tasks / Subtasks

- [ ] Task 1: Bump lambda from 0.1 to 0.3 in FORMULA_DEFAULTS (AC: #1)
  - [ ] 1.1 Edit `packages/domain/src/utils/formula.ts` line ~54: change `lambda: 0.1` to `lambda: 0.3`
  - [ ] 1.2 Update any test fixtures that assert the default lambda value (check `formula-numerical-steering.test.ts` for hardcoded `0.1` expectations)
  - [ ] 1.3 Verify existing steering tests still pass with λ=0.3 — tests that use explicit config objects (`{ ...FORMULA_DEFAULTS, lambda: X }`) should be unaffected; only tests relying on the default value need updating

- [ ] Task 2: Compute `coveredFacets` metric (AC: #2)
  - [ ] 2.1 In `send-message.use-case.ts`, after `computeFacetMetrics()` returns the `metrics` map (~line 233-236), compute `coveredFacets` by counting entries where `confidence > 0.3`, divided as a string `"X/30"` for readability
  - [ ] 2.2 Add `coveredFacets` to the existing "Steering computed" `logger.info` call at ~line 244-250

- [ ] Task 3: Compute `topicTransitionsPerFiveTurns` metric (AC: #2)
  - [ ] 3.1 In `send-message.use-case.ts`, after steering is computed, filter the messages from `getMessages()` to assistant-role only, take the last 5, read each message's `targetDomain` column (already stored in `assessment_message` table as `target_domain` — see schema.ts L184), and count domain transitions between consecutive messages
  - [ ] 3.2 Add `topicTransitionsPerFiveTurns` to the "Steering computed" log

- [ ] Task 4: Add `questionsPerAssistantTurn` placeholder (AC: #2)
  - [ ] 4.1 Add `questionsPerAssistantTurn: 1` as a static value in the "Steering computed" log (placeholder — the current architecture sends exactly one Nerin response per user message)

- [ ] Task 5: Enrich "Steering computed" log with additional context
  - [ ] 5.1 Add `nearingEnd` flag to the log (already computed at ~line 253 but not currently logged)
  - [ ] 5.2 Add `metricsMapSize` (number of facets with any evidence) to distinguish early-conversation sparse metrics from late-conversation rich metrics
  - [ ] 5.3 Add `bestPriority` — the winning facet's priority score from `computeSteeringTarget()` — this requires modifying `SteeringTarget` return type to include it (or logging it separately from the metrics map)

- [ ] Task 6: Expose priority score from `computeSteeringTarget()` (AC: #2, supports Task 5.3)
  - [ ] 6.1 Extend `SteeringTarget` interface in `formula.ts` to add `readonly bestPriority: number`
  - [ ] 6.2 In `computeSteeringTarget()`, capture the winning facet's priority score and include it in the return value
  - [ ] 6.3 Update all callers and tests that destructure or assert on `SteeringTarget` shape — check `send-message.use-case.ts`, `formula-numerical-steering.test.ts`, and any mock implementations

- [ ] Task 7: Verify and update tests
  - [ ] 7.1 Run `pnpm --filter=@workspace/domain test` to verify formula tests pass with λ=0.3 default
  - [ ] 7.2 Run `pnpm --filter=api test` to verify send-message use-case tests pass with new log fields
  - [ ] 7.3 If mock for `computeSteeringTarget` in `__mocks__/` returns a `SteeringTarget`, update it to include `bestPriority`

## Parallelism

- **Blocked by:** none
- **Blocks:** none
- **Mode:** parallel
- **Domain:** backend assessment pipeline (formula utils + send-message use-case)
- **Shared files:**
  - `packages/domain/src/utils/formula.ts` — also touched by Story 18.2 (rewrite computeFacetMetrics for Evidence v2), but that's in a later epic
  - `apps/api/src/use-cases/send-message.use-case.ts` — also touched by Story 17.1 (all-30-facets steering) and 18.3 (rolling evidence budget), but both are later epics

## Dev Notes

### Architecture Patterns and Constraints

- **Hexagonal architecture**: All business logic in use-cases, not handlers. `formula.ts` is a pure domain utility — no side effects.
- **Structured Pino logging**: All logs use `logger.info(message, { ...meta })` pattern. The `meta` object is `Record<string, unknown>`. Use `logger.debug` for verbose per-facet breakdowns to avoid production noise.
- **Effect-ts dependency injection**: `LoggerRepository` injected via Context.Tag. Already available in `send-message.use-case.ts`.
- **SteeringTarget is a readonly interface**: Adding `bestPriority` is a non-breaking extension since all existing destructuring will simply ignore the new field.
- **No OTel/Prometheus**: Observability is purely structured Pino logs. Metrics analysis happens by querying log aggregation (Railway logs or future Datadog/Loki).

### Key File Locations

| File | Purpose | Lines of Interest |
|------|---------|-------------------|
| `packages/domain/src/utils/formula.ts` | FORMULA_DEFAULTS (λ=0.1), computeSteeringTarget(), SteeringTarget interface | L45-58 (defaults), L37-41 (interface), L204-304 (steering fn) |
| `apps/api/src/use-cases/send-message.use-case.ts` | Main message pipeline, existing "Steering computed" log | L244-250 (log point), L233-236 (metrics computation), L253 (nearingEnd) |
| `packages/domain/src/utils/__tests__/formula-numerical-steering.test.ts` | Steering parameter tests | L16-97 (lambda sensitivity tests) |
| `packages/domain/src/repositories/logger.repository.ts` | Logger interface (info/warn/error/debug) | L10-40 |
| `packages/infrastructure/src/repositories/logger.pino.repository.ts` | Pino implementation | L21-56 |
| `apps/api/src/use-cases/generate-results.use-case.ts` | Reference pattern for phase timing and rich logging | L225-230, L321-338 |

### Existing "Steering computed" Log (Current Shape)

```typescript
logger.info("Steering computed", {
  sessionId,
  targetFacet: steering.targetFacet,
  targetDomain: steering.targetDomain,
  previousDomain,
  userMessageCount,
});
```

**Target shape after this story:**

```typescript
logger.info("Steering computed", {
  sessionId,
  targetFacet: steering.targetFacet,
  targetDomain: steering.targetDomain,
  previousDomain,
  userMessageCount,
  coveredFacets: `${coveredCount}/30`,
  metricsMapSize: metrics.size,
  bestPriority: steering.bestPriority,
  nearingEnd,
  topicTransitionsPerFiveTurns,
  questionsPerAssistantTurn: 1,
});
```

### Computing `topicTransitionsPerFiveTurns`

The use-case already calls `getMessages()` which returns all messages for the session. The `assessment_message` table has a `targetDomain` column (`evidenceDomainEnum`) that stores the steering domain on each assistant message. Filter messages by `role === "assistant"`, take the last 5, and count domain transitions between consecutive messages.

**Transition count algorithm:**
```
transitions = 0
for i in [1..min(5, assistantMessages.length)-1]:
  if domain(assistantMsg[i]) !== domain(assistantMsg[i-1]):
    transitions++
```

### Project Structure Notes

- All changes are within `packages/domain/` and `apps/api/` — no cross-package boundary issues
- `SteeringTarget` is defined in `packages/domain/` and consumed in `apps/api/` — the extension is additive and non-breaking
- No new files needed — all changes are edits to existing files

### References

- [Source: _bmad-output/planning-artifacts/epics-conversation-pipeline.md#Story 1.3]
- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Phase 1: Conversation]
- [Source: packages/domain/src/utils/formula.ts — FORMULA_DEFAULTS, computeSteeringTarget()]
- [Source: apps/api/src/use-cases/send-message.use-case.ts — "Steering computed" log]
- [Source: docs/ARCHITECTURE.md — hexagonal architecture, error handling patterns]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Over-logging** — Do NOT log per-facet detail at `info` level. Use `logger.debug` for verbose breakdowns. The "Steering computed" log should remain a single structured event per message turn, not 30 individual facet logs.
6. **Metric computation in wrong layer** — `topicTransitionsPerFiveTurns` computation belongs in the use-case, NOT in `formula.ts` (it requires message history, which is a side-effect concern). `coveredFacets` can be computed inline from the metrics map.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
