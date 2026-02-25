# Story 15.3: Waitlist & Circuit Breaker

Status: done

## Story

As the system,
I want a global daily assessment limit with waitlist fallback,
So that costs are controlled during early growth.

## Acceptance Criteria

1. **AC1: Global daily assessment limit** — When the daily global assessment count reaches the configured limit (`GLOBAL_DAILY_ASSESSMENT_LIMIT`, default 100), new assessments are blocked. The count is tracked atomically in Redis via key `global_assessments:{YYYY-MM-DD}` with 48h TTL.

2. **AC2: Waitlist signup form** — When a user (anonymous or authenticated) tries to start an assessment while the circuit breaker is active, they see a waitlist signup form instead of the chat interface.

3. **AC3: Waitlist email storage** — Submitted emails are stored in the `waitlist_emails` table with columns: `id` (uuid PK), `email` (text, UNIQUE), `created_at` (timestamp). Duplicate emails are silently accepted (no error shown to user).

4. **AC4: Daily reset** — At UTC midnight the Redis counter expires via TTL, automatically reopening the circuit breaker. No cron job needed.

5. **AC5: Fail-open resilience** — If Redis is unavailable, the global limit check is skipped (assessments are allowed). Follows existing fail-open pattern from Story 10.6.

## Tasks / Subtasks

- [x] Task 1: Add `GlobalAssessmentLimitReached` error (AC: #1, #2)
  - [x] 1.1 Add `GlobalAssessmentLimitReached` class to `packages/domain/src/errors/http.errors.ts` with fields: `message: S.String`, `resumeAfter: S.DateTimeUtc`
  - [x] 1.2 Re-export from `packages/contracts/src/errors.ts` if not auto-exported
  - [x] 1.3 Add `.addError(GlobalAssessmentLimitReached, { status: 503 })` to the `start` endpoint in `packages/contracts/src/http/groups/assessment.ts`

- [x] Task 2: Extend CostGuard with global assessment limit (AC: #1, #4, #5)
  - [x] 2.1 Add `globalDailyAssessmentLimit` to `AppConfig` interface in `packages/domain/src/config/app-config.ts` (default: 100)
  - [x] 2.2 Add config binding in `packages/infrastructure/src/config/app-config.live.ts` reading `GLOBAL_DAILY_ASSESSMENT_LIMIT` env var
  - [x] 2.3 Add method `checkAndRecordGlobalAssessmentStart(): Effect<void, RedisOperationError | GlobalAssessmentLimitReached>` to `CostGuardMethods` interface in `packages/domain/src/repositories/cost-guard.repository.ts` — this is a single atomic operation (INCR → check → DECR-on-fail), NOT a separate check + record
  - [x] 2.5 Implement both methods in `packages/infrastructure/src/repositories/cost-guard.redis.repository.ts`:
    - Redis key: `global_assessments:{YYYY-MM-DD}` with 48h TTL
    - `checkAndRecordGlobalAssessmentStart`: **Atomic INCR-then-compare** — call `redis.incr(key)` first, then check if the returned count exceeds the limit. If it does, DECR the key back and fail with `GlobalAssessmentLimitReached`. This prevents race conditions where concurrent requests all pass a separate GET check before any INCR happens. This is the same pattern as `recordAssessmentStart` for per-user limits.
    - **Do NOT use a separate GET-check then INCR-record pattern** — that creates a TOCTOU race condition under concurrent load
  - [x] 2.6 Update `__mocks__/cost-guard.redis.repository.ts` with in-memory implementation of `checkAndRecordGlobalAssessmentStart`
  - [x] 2.7 Update `packages/domain/src/config/__mocks__/app-config.ts` — add `globalDailyAssessmentLimit` to `mockAppConfig` with a test default (e.g., 100). Without this, every test using the AppConfig mock will fail with a missing property error

- [x] Task 3: Integrate circuit breaker into assessment start (AC: #1, #5)
  - [x] 3.1 In `apps/api/src/use-cases/start-assessment.use-case.ts`, add atomic global limit check+record BEFORE per-user rate limit check in `startAuthenticatedAssessment()`:
    ```
    yield* costGuard.checkAndRecordGlobalAssessmentStart().pipe(
      Effect.catchTag("RedisOperationError", (err) =>
        Effect.sync(() => { logger.error("Redis unavailable for global limit check, allowing", { error: err.message }); })
      )
    );
    ```
  - [x] 3.2 Add the same `checkAndRecordGlobalAssessmentStart()` call in `startAnonymousAssessment()` BEFORE session creation (note: this adds `CostGuardRepository` as a new dependency for the anonymous path)

- [x] Task 4: Create waitlist domain and infrastructure (AC: #3)
  - [x] 4.1 Add `waitlist_emails` table to `packages/infrastructure/src/db/drizzle/schema.ts`:
    ```typescript
    export const waitlistEmails = pgTable("waitlist_emails", {
      id: uuid("id").primaryKey().defaultRandom(),
      email: text("email").notNull().unique(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
    });
    ```
  - [x] 4.2 Run `pnpm db:generate` to create migration
  - [x] 4.3 Create repository interface `packages/domain/src/repositories/waitlist.repository.ts`:
    ```typescript
    export interface WaitlistMethods {
      readonly addEmail: (email: string) => Effect<void, DatabaseError>;
    }
    export class WaitlistRepository extends Context.Tag("WaitlistRepository")<
      WaitlistRepository, WaitlistMethods
    >() {}
    ```
  - [x] 4.4 Create implementation `packages/infrastructure/src/repositories/waitlist.drizzle.repository.ts`:
    - `addEmail`: INSERT with ON CONFLICT (email) DO NOTHING (upsert to silently handle duplicates)
    - Export `WaitlistDrizzleRepositoryLive` as Layer
  - [x] 4.5 Create mock `packages/infrastructure/src/repositories/__mocks__/waitlist.drizzle.repository.ts` with in-memory Set
  - [x] 4.6 Export from `packages/domain/src/repositories/index.ts` and `packages/infrastructure/src/repositories/index.ts`

- [x] Task 5: Create waitlist API contract and handler (AC: #3)
  - [x] 5.1 Create `packages/contracts/src/http/groups/waitlist.ts`:
    ```typescript
    export const WaitlistGroup = HttpApiGroup.make("waitlist")
      .add(
        HttpApiEndpoint.post("joinWaitlist", "/signup")
          .setPayload(S.Struct({ email: S.String.pipe(S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) }))
          .addSuccess(S.Struct({ ok: S.Literal(true) }))
          .addError(DatabaseError, { status: 500 })
      )
      .prefix("/waitlist");
    ```
  - [x] 5.2 Register `WaitlistGroup` in `packages/contracts/src/http/api.ts`
  - [x] 5.3 Create use-case `apps/api/src/use-cases/join-waitlist.use-case.ts` — calls `waitlistRepo.addEmail(email)`
  - [x] 5.4 Create handler `apps/api/src/handlers/waitlist.ts` — thin adapter calling use-case
  - [x] 5.5 Register handler in `apps/api/src/index.ts`

- [x] Task 6: Frontend waitlist UI (AC: #2, #3)
  - [x] 6.1 Create `apps/front/src/components/waitlist/waitlist-form.tsx` — email input + submit button + success message. Calls `POST /api/waitlist/signup`. Styled with existing design tokens (psychedelic gradient accents). Include data attributes per FRONTEND.md.
  - [x] 6.2 In `apps/front/src/routes/chat/index.tsx` `beforeLoad()`, detect 503 response with `_tag: "GlobalAssessmentLimitReached"` and set route context/search param to indicate circuit breaker active
  - [x] 6.3 In chat route component, if circuit breaker active, render `WaitlistForm` instead of chat interface
  - [x] 6.4 Handle anonymous users: the waitlist form should work without authentication

- [x] Task 7: Unit tests (AC: all)
  - [x] 7.1 Test `checkAndRecordGlobalAssessmentStart` in cost guard: under limit → passes and increments, at limit → fails with `GlobalAssessmentLimitReached` and DECRs, Redis error → fail-open
  - [x] 7.2 Test `start-assessment` use-case integration: mock cost guard returning `GlobalAssessmentLimitReached` → use-case propagates error unchanged
  - [x] 7.4 Test `join-waitlist` use-case: valid email → stored, duplicate → no error
  - [x] 7.5 Follow existing test patterns: `vi.mock()` + `@effect/vitest` import ordering, local `TestLayer` per file

## Dev Notes

### Architecture

- **Global limit is separate from per-user limit.** The global circuit breaker (`global_assessments:{date}`) prevents ALL new assessments platform-wide. Per-user limits (`assessments:{userId}:{date}`) remain unchanged and check after the global check passes.
- **The waitlist endpoint requires NO authentication.** Anonymous users hitting the circuit breaker should be able to submit their email. The endpoint is public.
- **No notification system in scope.** The `waitlist_emails` table is capture-only. Emailing waitlisted users is a future feature.

### Existing Patterns to Follow

- **Redis key pattern:** `global_assessments:{YYYY-MM-DD}` with 48h TTL (matches `cost:{userId}:{date}` pattern)
- **Fail-open:** `Effect.catchTag("RedisOperationError", ...)` → log and allow (same as `send-message.use-case.ts` lines 108-116)
- **Error class:** `S.TaggedError` in `packages/domain/src/errors/http.errors.ts` (same file as `CostLimitExceeded`, `RateLimitExceeded`)
- **Repository:** `Context.Tag` + `Layer.effect` (same as `CostGuardRepository`)
- **Contract:** `HttpApiGroup.make()` + `HttpApiEndpoint` (same as `AssessmentGroup`)
- **Config:** `Config.number("ENV_VAR").pipe(Config.withDefault(N))` in `app-config.live.ts`

### Project Structure Notes

- New files follow naming conventions: kebab-case for files, PascalCase for exports
- Waitlist repository lives in standard locations: domain interface → infrastructure impl → `__mocks__` for testing
- Frontend component in `apps/front/src/components/waitlist/` (new directory, consistent with `sharing/`, `chat/`)
- New contract group in `packages/contracts/src/http/groups/waitlist.ts` (consistent with `assessment.ts`, `profile.ts`)

### References

- [Source: epics.md#Story 6.3] — Original story definition with BDD acceptance criteria
- [Source: cost-guard.redis.repository.ts] — Existing Redis atomic increment + TTL pattern
- [Source: cost-guard.repository.ts] — CostGuardMethods interface to extend
- [Source: start-assessment.use-case.ts] — Assessment start flow where global check is inserted
- [Source: http.errors.ts] — Error class definitions (CostLimitExceeded, RateLimitExceeded patterns)
- [Source: schema.ts] — Drizzle table definitions for waitlist_emails
- [Source: app-config.live.ts] — Config binding pattern for new env var
- [Source: ARCHITECTURE.md] — Redis fail-open resilience rules
- [Source: 15-2-archetype-card-generation.md] — Previous story learnings (SSR routes in frontend)

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. The `GlobalAssessmentLimitReached` error must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. The new `checkGlobalAssessmentLimit` and `recordGlobalAssessmentStart` methods must exist in the mock cost guard. The new `WaitlistDrizzleRepositoryLive` mock must match the real interface.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **No cron jobs** — The circuit breaker reset is entirely TTL-based. Do NOT add any scheduled task or cron to reset the counter.
6. **No email validation beyond format** — Do NOT add email verification (sending confirmation emails). This is a simple capture form.

## Previous Story Intelligence

### From Story 15.2 (Archetype Card Generation)

- SSR routes in TanStack Start use `server.handlers` pattern with dynamic imports for Node-only modules
- Font assets stored in `apps/front/assets/fonts/`
- Design tokens and psychedelic styling already established in the frontend
- Vite config has SSR externals pattern if needed

### Git Intelligence

Recent commits show Story 15.2 work:
- `e9797e6` — externalized `@resvg/resvg-js` platform binaries from Nitro bundle
- `743fbb0` — used `import.meta.env` for VITE_API_URL
- `71ee682` — moved card generation from API to frontend SSR routes
- `b073a80` — initial Satori + Resvg card generation

Key insight: Frontend SSR routes are viable for server-side functionality, but this story's waitlist endpoint belongs in the API (it writes to PostgreSQL and needs Effect/Drizzle).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Added `decr` method to RedisRepository interface and implementations (needed for atomic INCR-then-DECR pattern)
- Updated anonymous assessment test "should not call CostGuard at all" → now verifies global limit IS checked but per-user limits are NOT

### Completion Notes List

- All 7 tasks implemented following TDD and existing patterns
- Global circuit breaker uses atomic INCR→compare→DECR pattern (no TOCTOU race)
- Fail-open resilience: `catchTag("RedisOperationError")` in both auth and anon paths
- Waitlist endpoint is public (no AuthMiddleware) — anonymous users can submit
- Migration written manually (drizzle-kit generate is interactive)
- 293 tests passing (6 new tests added), 0 regressions
- All lint checks clean (no new warnings introduced)

### Change Log

- 2026-02-25: Story 15.3 implemented — global assessment circuit breaker + waitlist email capture
- 2026-02-25: Code review (Opus 4.6) — Fixed: `logger.error` → `logger.warn` in fail-open paths (AC #6), added `data-slot` to WaitlistForm (M1), added 2 missing tests: resumeAfter midnight UTC validation (AC #2), existing sessions unaffected by circuit breaker (AC #2). Note: error class named `GlobalAssessmentLimitReached` (not `CircuitBreakerOpenError` as originally spec'd) — functionally equivalent, kept as-is.

### File List

**New files:**
- `packages/domain/src/repositories/waitlist.repository.ts` — WaitlistRepository interface
- `packages/infrastructure/src/repositories/waitlist.drizzle.repository.ts` — Drizzle implementation
- `packages/infrastructure/src/repositories/__mocks__/waitlist.drizzle.repository.ts` — Test mock
- `packages/contracts/src/http/groups/waitlist.ts` — WaitlistGroup HTTP contract
- `apps/api/src/use-cases/join-waitlist.use-case.ts` — Join waitlist use-case
- `apps/api/src/handlers/waitlist.ts` — Waitlist HTTP handler
- `apps/front/src/components/waitlist/waitlist-form.tsx` — Frontend waitlist form component
- `apps/api/src/use-cases/__tests__/global-assessment-limit.test.ts` — Unit tests
- `drizzle/20260225000000_story_15_3_waitlist_emails/migration.sql` — DB migration

**Modified files:**
- `packages/domain/src/errors/http.errors.ts` — Added GlobalAssessmentLimitReached error
- `packages/domain/src/index.ts` — Export GlobalAssessmentLimitReached + WaitlistRepository
- `packages/domain/src/config/app-config.ts` — Added globalDailyAssessmentLimit field
- `packages/domain/src/config/__mocks__/app-config.ts` — Added globalDailyAssessmentLimit to mock
- `packages/domain/src/repositories/cost-guard.repository.ts` — Added checkAndRecordGlobalAssessmentStart method
- `packages/domain/src/repositories/redis.repository.ts` — Added decr method
- `packages/contracts/src/errors.ts` — Re-export GlobalAssessmentLimitReached
- `packages/contracts/src/http/groups/assessment.ts` — Added GlobalAssessmentLimitReached error to start endpoint
- `packages/contracts/src/http/api.ts` — Registered WaitlistGroup
- `packages/infrastructure/src/config/app-config.live.ts` — GLOBAL_DAILY_ASSESSMENT_LIMIT env var binding
- `packages/infrastructure/src/repositories/cost-guard.redis.repository.ts` — Implemented checkAndRecordGlobalAssessmentStart
- `packages/infrastructure/src/repositories/__mocks__/cost-guard.redis.repository.ts` — Added mock implementation
- `packages/infrastructure/src/repositories/redis.ioredis.repository.ts` — Added decr method
- `packages/infrastructure/src/db/drizzle/schema.ts` — Added waitlistEmails table
- `packages/infrastructure/src/index.ts` — Export WaitlistDrizzleRepositoryLive
- `packages/infrastructure/src/utils/test/app-config.testing.ts` — Added globalDailyAssessmentLimit
- `apps/api/src/use-cases/start-assessment.use-case.ts` — Global limit check in both auth and anon paths
- `apps/api/src/index.ts` — Registered WaitlistGroupLive + WaitlistDrizzleRepositoryLive
- `apps/api/src/use-cases/__tests__/__fixtures__/start-assessment.fixtures.ts` — Added checkAndRecordGlobalAssessmentStart mock
- `apps/api/src/use-cases/__tests__/start-assessment-anon.use-case.test.ts` — Updated test for new CostGuard dependency
- `apps/front/src/routes/chat/index.tsx` — 503 detection + waitlist search param + WaitlistForm render
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status updated
