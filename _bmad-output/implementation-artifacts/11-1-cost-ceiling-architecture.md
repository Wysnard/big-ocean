# Story 11.1: Cost Ceiling Architecture

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a platform operator,
I want automatic cost controls during viral traffic spikes,
So that LLM costs do not exceed budget even during unexpected growth.

## Acceptance Criteria

**Given** the existing Redis-based cost tracking and fail-open pattern  
**When** cost ceiling thresholds are configured  
**Then** per-user token budgets are enforced at session boundaries (never mid-session per FR56)  
**And** a global free-tier circuit breaker triggers when weekly-letter LLM cost exceeds 3× the expected cost within any 24h window  
**And** when the circuit breaker triggers, rate limiting is applied with alerting (structured log event)  
**And** users hitting the cost guard see a "temporarily unavailable" message with retry after a configurable cooldown (default 15 minutes)  
**And** the cost guard is fail-open — if Redis is unavailable, requests proceed and failure is logged  
**And** per-session cost is logged in structured format (NFR28)

**Cross-cutting FR/NFR:** FR55–FR58, NFR7a, NFR7b, NFR28 (see `_bmad-output/planning-artifacts/epics.md` Epic 11 summary).

## Tasks / Subtasks

- [x] **Circuit breaker core (NFR7b)** (AC: breaker, alerting, fail-open)
  - [x] Add configuration for expected weekly-letter unit cost, active-user estimate (or derived query), 24h multiplier (3×), and optional cooldown seconds (default 900).
  - [x] Persist per-generation LLM cost for weekly letters: extend `weekly_summaries` with `llm_cost_cents` (nullable for legacy rows), set on successful `WeeklySummaryRepository.save` from generator token usage + `calculateCost` (same pattern as `nerin-pipeline.ts`).
  - [x] Implement aggregation for **actual** rolling 24h free-tier weekly-letter spend (sum `llm_cost_cents` where `generated_at` in window and user is free-tier — use existing subscription/entitlement derivation; subscribers excluded from numerator per ADR-50).
  - [x] Compare `actualCost24h` to `threshold = 3 × expectedDailyFreeLLMCost` using ADR-50 math (`expectedDailyFreeLLMCost ≈ (activeUsers × avgWeeklyLetterCostCents) / 7` — document chosen inputs in `AppConfig`).
  - [x] New periodic use case (e.g. `global-cost-circuit-breaker` or cron handler) aligned with weekly cron cadence (~15 min): flip Redis flag `free_tier_llm_paused` when tripped; clear or TTL when under threshold (define safe hysteresis to avoid flapping).
  - [x] On trip: emit structured log `cost_circuit_breaker_tripped` with `thresholdCents`, `actualCost24hCents`, `windowStart`, `windowEnd`.
  - [x] All Redis reads/writes for breaker state: fail-open with degraded-mode log (consistent with ADR-14).

- [x] **Weekly letter + free-tier surfaces respect breaker** (AC: rate limiting)
  - [x] In `generate-weekly-summary.use-case.ts` (and any other free-tier-only LLM job in scope), skip generation for free users when `free_tier_llm_paused` is set; subscribers continue.
  - [x] Ensure new free-tier LLM surfaces added later check the same flag (document in dev notes).

- [x] **Session-boundary enforcement** (AC: per-user budgets, FR56)
  - [x] Verify/adjust `start-conversation.use-case.ts` and session-completion paths so **daily + per-session** budget checks remain only at boundaries (`checkDailyBudget`, `checkSessionBudget`); `send-message.use-case.ts` must not block on budget mid-session (already commented FR56 — confirm no regression).
  - [x] If ADR-50 monthly rolling budgets are in scope for this story: extend `CostGuardRepository` + `cost-guard.redis.repository.ts` with `trackUserMonthlyLLMCost` / `checkUserMonthlyBudget` and call at appropriate boundaries; otherwise split to a follow-up with explicit "out of scope" note in PR.

- [x] **User-visible "temporarily unavailable" + cooldown (FR57, FR58)** (AC: message + retry)
  - [x] Today `/chat` maps `CostLimitExceeded` to waitlist UI — align copy/UX with **"temporarily unavailable"** and surface **Retry-After** (header or body field) matching configurable cooldown (default 15 min). Distinguish viral cost guard from Story 15.3 waitlist if both can occur.
  - [x] Use `HttpApiClient` + contracts for any new error shape; map to toast or inline state per `docs/FRONTEND.md`.

- [x] **Observability** (AC: NFR28, ops)
  - [x] Confirm `session_cost_tracked` / `Cost tracked` logs in `nerin-pipeline.ts` remain the canonical per-turn structured log; add session **completion** summary log if missing (total session cost at finalize).
  - [x] Expose circuit breaker + budget snapshot: `GET /health/cost-guard` per ADR-50 (add to `@workspace/contracts` HttpApi `health` group + `HealthGroupLive` handler).

- [x] **Tests**
  - [x] Unit/integration: breaker threshold math with fixed clock; Redis flag toggling; fail-open when Redis throws.
  - [x] Integration: weekly generation skips free tier when flag set; subscriber path still runs.
  - [x] Contract test for new health route if pattern exists in `apps/api/tests`.

## Dev Notes

### Architecture and product rules

- **Authoritative spec:** [ADR-50: Cost Ceiling Architecture](_bmad-output/planning-artifacts/architecture.md) (Cost budgets table, circuit breaker math, implementation bullets, interaction with ADR-14 fail-open).
- **Hexagonal + Effect:** Business logic in use-cases; handlers thin; errors defined in `packages/domain/src/errors/http.errors.ts` and re-exported via `packages/contracts/src/errors.ts`; no remapping except fail-open `catchTag` (see `CLAUDE.md`).
- **Redis:** `packages/infrastructure/src/repositories/cost-guard.redis.repository.ts`, `RedisRepository` / ioredis; TTL and key naming follow existing `cost:*`, `session_cost:*` patterns.
- **Frontend:** No raw `fetch` — `makeApiClient` + Effect (`apps/front/src/lib/api-client.ts`). Internal links: TanStack Router `<Link>`.

### Current codebase anchors (do not reinvent)

| Concern | Location |
|--------|----------|
| Session-boundary budget; global assessment gate | `apps/api/src/use-cases/start-conversation.use-case.ts` |
| Mid-session: rate limit only, no budget block | `apps/api/src/use-cases/send-message.use-case.ts` |
| Per-turn cost + `session_cost_tracked` | `apps/api/src/use-cases/nerin-pipeline.ts` |
| CostGuard interface | `packages/domain/src/repositories/cost-guard.repository.ts` |
| Redis implementation | `packages/infrastructure/src/repositories/cost-guard.redis.repository.ts` |
| Cost math | `packages/domain/src/services/cost-calculator.service.ts` |
| Weekly letter pipeline | `apps/api/src/use-cases/generate-weekly-summary.use-case.ts` |
| Weekly summary schema | `packages/infrastructure/src/db/drizzle/schema.ts` → `weeklySummaries` |
| Chat cost-guard UX (waitlist today) | `apps/front/src/routes/chat/index.tsx` |
| Health API | `apps/api/src/handlers/health.ts`, `packages/contracts` `BigOceanApi` health group |

### Gap vs ADR-50 (explicit)

- `weekly_summaries` **does not** yet store `llm_cost_cents`; ADR-50 assumes it for `actualCost24h`. This story should add the column + migration and write path before relying on SQL SUM.
- `GET /health/cost-guard` is specified in ADR-50 but not implemented — add via contracts-first workflow (`docs/API-CONTRACT-SPECIFICATION.md`).

### Config (extend `AppConfig`)

Add env-backed fields (names illustrative — match project naming): e.g. `weeklyLetterExpectedCostCents`, `costCeilingActiveUsersEstimate`, `costCircuitBreakerMultiplier` (default 3), `costGuardRetryAfterSeconds` (default 900). Validate in infrastructure config loader alongside existing `sessionCostLimitCents`, `globalDailyAssessmentLimit`.

### Testing standards

- Vitest + `@effect/vitest` for use-cases; `vi.mock` ordering per `CLAUDE.md`.
- Integration tests with Redis mocks or Docker per repo convention; avoid e2e for pure domain logic.

### Project Structure Notes

- New migration SQL under `packages/infrastructure/drizzle/` (or project’s migration path) — **never edit applied migrations**.
- After schema change, update seeds/fixtures if any reference `weekly_summaries` inserts.

### References

- Epic 11 + Story 11.1: `_bmad-output/planning-artifacts/epics.md` (lines ~1128–1148)
- ADR-50, ADR-14: `_bmad-output/planning-artifacts/architecture.md`
- API contracts: `docs/API-CONTRACT-SPECIFICATION.md`, `packages/contracts`
- Frontend patterns: `docs/FRONTEND.md`

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent, dev-story workflow)

### Debug Log References

_(none)_

### Completion Notes List

- **Circuit breaker:** `evaluateFreeTierCostCircuitBreaker` aggregates `WeeklySummaryRepository.listGeneratedCostsSince` over 24h, filters free tier via `isEntitledTo(..., "conversation_extension")`, compares to `costCircuitBreakerMultiplier × expectedDailyCents`, toggles `free_tier_llm_paused` with 80% hysteresis on clear, logs `cost_circuit_breaker_tripped` / `cost_circuit_breaker_cleared`, Redis fail-open on read/write.
- **Cron / HTTP:** `POST /jobs/cost-circuit-breaker/evaluate` in jobs contract + `apps/api/src/handlers/jobs.ts`; optional `x-cron-secret` when `CRON_SECRET` is set.
- **Persistence:** Migration `drizzle/20260416200000_weekly_summaries_llm_cost_cents/migration.sql`; `llm_cost_cents` on `weekly_summaries`; generators and Drizzle repo persist cost.
- **Config:** `weeklyLetterExpectedCostCents`, `costCeilingActiveUsersEstimate`, `costCircuitBreakerMultiplier`, `costGuardRetryAfterSeconds` on `AppConfig` + live loader + test mocks.
- **Guards:** `start-conversation` blocks new authenticated free-tier starts when paused with `CostLimitExceeded` and `reason: "circuit_breaker"` + `resumeAfter`; `generate-weekly-summary` skips free tier when paused; `CostLimitExceeded` extended with optional `reason` (`daily_budget` | `session_budget` | `circuit_breaker`).
- **Redis:** `getFreeTierLlmPaused` / `setFreeTierLlmPaused` on `CostGuardRepository` + Redis adapter + mocks; `RedisRepository` `set`/`del` for string key.
- **Health:** `GET /health/cost-guard` contract + handler; isolated schema tests in `packages/contracts/src/__tests__/health-http-contracts.test.ts` (run with root `vitest` on that file).
- **Frontend:** `/chat` handles circuit-breaker cost limit via `serviceBusy` / `resumeAt` search params — distinct from global-assessment waitlist.
- **Future free-tier LLM jobs:** Reuse `CostGuardRepository.getFreeTierLlmPaused()` (and fail-open semantics) before model calls; per dev-story rules the long-lived “document in Dev Notes” reminder is captured here in the agent record instead of editing the Dev Notes section.
- **Observability:** `generate-results` logs session total cost at completion (`session_llm_cost_complete` / equivalent structured fields per implementation).
- **ADR-50 monthly rolling budgets:** Explicitly **out of scope** for this story; deferred to a follow-up (task branch “otherwise split”).
- **Regression checks:** `send-message` mid-session budget behavior unchanged (FR56); confirmed via existing tests and code inspection.
- **Validation:** `pnpm test:run --filter=api` (363 passed, 1 skipped), `pnpm exec vitest run packages/contracts/src/__tests__/health-http-contracts.test.ts -c vitest.config.ts`, targeted `turbo typecheck` on api/contracts/domain/infrastructure/front, `pnpm lint` (warnings only, pre-existing).

### File List

- `drizzle/20260416200000_weekly_summaries_llm_cost_cents/migration.sql`
- `packages/domain/src/config/app-config.ts`
- `packages/domain/src/config/__mocks__/app-config.ts`
- `packages/domain/src/errors/http.errors.ts`
- `packages/domain/src/repositories/cost-guard.repository.ts`
- `packages/domain/src/repositories/redis.repository.ts`
- `packages/domain/src/repositories/weekly-summary-generator.repository.ts`
- `packages/domain/src/repositories/weekly-summary.repository.ts`
- `packages/contracts/src/http/groups/health.ts`
- `packages/contracts/src/http/groups/jobs.ts`
- `packages/contracts/src/__tests__/health-http-contracts.test.ts`
- `packages/infrastructure/src/config/app-config.live.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/repositories/cost-guard.redis.repository.ts`
- `packages/infrastructure/src/repositories/redis.ioredis.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/cost-guard.redis.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/redis.ioredis.repository.ts`
- `packages/infrastructure/src/repositories/weekly-summary-generator.anthropic.repository.ts`
- `packages/infrastructure/src/repositories/weekly-summary-generator.mock.repository.ts`
- `packages/infrastructure/src/repositories/weekly-summary.drizzle.repository.ts`
- `packages/infrastructure/src/utils/test/app-config.testing.ts`
- `apps/api/src/use-cases/evaluate-free-tier-cost-circuit-breaker.use-case.ts`
- `apps/api/src/use-cases/generate-weekly-summary.use-case.ts`
- `apps/api/src/use-cases/generate-results.use-case.ts`
- `apps/api/src/use-cases/start-conversation.use-case.ts`
- `apps/api/src/use-cases/index.ts`
- `apps/api/src/handlers/health.ts`
- `apps/api/src/handlers/jobs.ts`
- `apps/api/src/use-cases/__tests__/evaluate-free-tier-cost-circuit-breaker.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/generate-weekly-summary.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/generate-results.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/__fixtures__/start-conversation.fixtures.ts`
- `apps/front/src/routes/chat/index.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings

- [x] [Review][Patch] `CostLimitExceeded` reasons are collapsed into breaker UX [`apps/front/src/routes/chat/index.tsx:72`]  
      The route now maps every `CostLimitExceeded` to `_tag: "serviceBusy"` and ignores the new `reason` discriminator. That means pre-existing `daily_budget` / `session_budget` failures from `checkDailyBudget` or `checkSessionBudget` will be shown as a temporary viral-traffic outage, which is a user-facing regression and makes the new `reason` field ineffective.
- [x] [Review][Patch] Start-conversation fail-open path does not log Redis failure [`apps/api/src/use-cases/start-conversation.use-case.ts:185`]  
      Story 11-1 requires Redis-backed cost-guard checks to fail open and log the degraded-mode failure. This new `getFreeTierLlmPaused()` catch returns `false` silently, unlike the analogous weekly-summary and breaker-evaluator paths, so Redis outages on the start boundary are invisible in ops logs.
- [x] [Review][Patch] Breaker evaluator reports state transitions even when Redis write fails [`apps/api/src/use-cases/evaluate-free-tier-cost-circuit-breaker.use-case.ts:108`]  
      Both the trip and clear branches swallow `setFreeTierLlmPaused()` write failures but still emit transition logs, and the trip branch returns `freeTierLlmPaused: true` even if Redis never persisted the flag. That makes the job response and structured logs disagree with actual runtime state during Redis degradation.
- [x] [Review][Patch] Guardrail tests miss the subscriber-bypass and breaker-clear paths [`apps/api/src/use-cases/__tests__/generate-weekly-summary.use-case.test.ts:399`]  
      The story marks the test task complete, but the added coverage only proves free-tier skipping while paused. It still lacks a test that a subscribed user continues generating while `free_tier_llm_paused` is set, and the new breaker test file does not exercise the clear/hysteresis branch or write-failure handling.

### Change Log

- 2026-04-16 — Implemented cost ceiling architecture: weekly summary `llm_cost_cents`, free-tier 24h circuit breaker use case + cron job route, Redis pause flag with fail-open, session-boundary and weekly-skip behavior, health snapshot, chat “temporarily unavailable” UX for breaker, structured logging, and tests (including contract schema tests for cost-guard health response).
- 2026-04-16 — Code review follow-up: branch chat `CostLimitExceeded` on `reason`, log Redis fail-open on start-conversation pause read, only log breaker trip/clear after successful Redis writes and return final pause state from Redis, add weekly-summary subscriber + breaker clear/SET-failure tests.

---

**Git intelligence (recent context):** Latest commits on `main` are mostly sprint/epic bookkeeping and unrelated features; cost work predates in `cost-guard.redis.repository.ts`, `nerin-pipeline.ts`, and `start-conversation.use-case.ts` — follow patterns there.

**Open questions (non-blocking):** Confirm product preference if both global **assessment** gate (Story 15.3) and **cost circuit breaker** trigger — should UI show one combined message or prioritized copy?
