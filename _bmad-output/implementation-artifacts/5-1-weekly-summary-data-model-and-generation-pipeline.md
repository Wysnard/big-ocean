# Story 5.1: Weekly Summary Data Model & Generation Pipeline

Status: done

## Story

As a developer,
I want the database schema and generation pipeline for weekly letters,
So that Nerin can write users a letter about their week every Sunday.

## Acceptance Criteria

1. **Given** the Drizzle schema
  **When** the migration is applied  
   **Then** a `weekly_summaries` table exists with columns: `id` (uuid PK), `user_id` (FK → `user`), `week_start_date` (date), `week_end_date` (date), `content` (text, nullable), `generated_at` (timestamptz, nullable), `failed_at` (timestamptz, nullable), `retry_count` (smallint, default 0), `created_at`  
   **And** a unique constraint on `(user_id, week_start_date)` prevents duplicate summaries  
   **And** indexes support lookup by user + recency (e.g. `(user_id, week_start_date DESC)` or equivalent per existing migration style)
2. **Given** the domain layer
  **When** the story is complete  
   **Then** a `WeeklySummaryRepository` interface exists in `packages/domain/src/repositories/weekly-summary.repository.ts` with methods: `save` (upsert or insert-on-conflict for idempotency), `getByWeekId` (resolve by `userId` + ISO week id `YYYY-Www` **or** by `userId` + `week_start_date` — pick one canonical key and document it), `getByUserId` (list/history as needed), `getLatestForUser`  
   **And** a Drizzle implementation `WeeklySummaryDrizzleRepositoryLive` exists in `packages/infrastructure/src/repositories/weekly-summary.drizzle.repository.ts`  
   **And** a co-located `__mocks__/weekly-summary.drizzle.repository.ts` mock exists (in-memory, same interface)
3. **Given** check-in eligibility for the pipeline
  **When** the generator runs for a target ISO week (Mon–Sun, aligned with `getTodayWeekGrid` / `YYYY-Www` in `apps/api/src/use-cases/get-today-week.use-case.ts`)  
   **Then** only users with **≥3** `daily_check_ins` rows whose `local_date` falls in that week’s `[week_start_date, week_end_date]` (inclusive) are candidates  
   **And** users with 0–2 check-ins are skipped entirely (no row in `weekly_summaries`, no failure record, no shame copy — UX rule from Epic 5)
4. **Given** a `generate-weekly-summary.use-case.ts` (or equivalently named orchestration module)
  **When** it runs for a week  
   **Then** it:  
  - Resolves the ISO week window (Monday `week_start_date`, Sunday `week_end_date`) using the **same date math** as `parseIsoWeekId` in `get-today-week.use-case.ts` so `/today/week/$weekId` (Story 5.2) lines up with stored rows  
  - For each qualifying user, loads check-ins for that window (mood + note + `local_date`) via `DailyCheckInRepository`  
  - Loads personality context from the user’s completed assessment: facet scores and derived traits (derive-at-read — **do not** invent new stored aggregates; follow `loadUserAssessmentData` in `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` for pattern: `ConversationRepository.findSessionByUserId` → `AssessmentResultRepository.getBySessionId` → `computeTraitResults` / archetype as already exposed on result type)  
  - Calls **Claude Sonnet** (use `AppConfig.portraitGeneratorModelId` or add a dedicated `weeklySummaryModelId` in `AppConfig` defaulting to the same Sonnet id — document in `.env.example` if new)  
  - Persists markdown/text letter to `weekly_summaries.content`, sets `generated_at` on success; on failure after retries, sets `failed_at` and increments `retry_count` consistently with other generators  
   **And** generation is **idempotent**: re-running for the same `(user_id, week_start_date)` does not create duplicate rows (unique constraint + upsert or no-op when content already present)
5. **Given** LLM integration
  **When** implemented  
   **Then** business logic stays in the use-case / domain ports — **not** in HTTP handlers (hexagonal rule)  
   **And** a `WeeklySummaryGeneratorRepository` (domain `Context.Tag`) + `WeeklySummaryGeneratorAnthropicRepositoryLive` (infrastructure, mirror `RelationshipAnalysisGeneratorAnthropicRepositoryLive` + `PortraitGeneratorClaudeRepositoryLive` patterns: `ChatAnthropic`, `Redacted` API key, structured logging) keeps Anthropic details out of the use-case  
   **And** prompts live in `packages/domain` as pure builder functions (see `buildRelationshipAnalysisPrompt` style) so they are unit-testable without I/O
6. **Given** scheduling
  **When** the story is complete  
   **Then** there is a **callable** entry point suitable for **Sunday ~6pm** runs: either  
  - **A)** `Effect.forkDaemon` scheduled fiber using `Schedule` / clock (document timezone: prefer **UTC** with explicit conversion notes, or Europe/Paris if product is EU-first — pick one and log the cron intent), **or**  
  - **B)** an HTTP `POST` route on the Effect API (same pattern as `EmailGroup`: `POST /api/...` for cron) that invokes the same use-case — **recommended** for Railway/external cron compatibility  
   **And** if the HTTP option is used: add endpoint to `packages/contracts` (`HttpApiGroup`), register in `packages/contracts/src/http/api.ts`, thin handler in `apps/api/src/handlers/`, wire in `HttpGroupsLive` + `RepositoryLayers` for any new repos  
   **And** protect production triggers: at minimum document shared secret header (e.g. `x-cron-secret`) checked against `AppConfig` (add `cronSecret` Redacted field) — follow project preference; if email endpoints are currently unauthenticated, still **add** secret for this destructive/expensive job
7. **Given** quality gates
  **When** `pnpm typecheck` and `pnpm test:run` are executed  
   **Then** they pass  
   **And** new use-case tests exist under `apps/api/src/use-cases/__tests__/` using `@effect/vitest`, with repositories mocked via `vi.mock` + `Layer` composition per `CLAUDE.md`

## Tasks / Subtasks

- Task 1: Schema + migration (AC: #1, #7)  
  - 1.1 Add `weeklySummaries` table to `packages/infrastructure/src/db/drizzle/schema.ts`  
  - 1.2 Hand-write `drizzle/<timestamp>_weekly_summaries/migration.sql` (**never** edit an existing migration)  
  - 1.3 Foreign key `onDelete: "cascade"` from `user` like other user-owned tables
- Task 2: Daily check-in query for eligibility (AC: #3)  
  - 2.1 Extend `DailyCheckInRepository` with a method such as `listUserIdsWithAtLeastNCheckInsInRange(n, weekStart, weekEnd)` using Drizzle `GROUP BY user_id HAVING count(*) >= n` (efficient full-table scan for cron — acceptable off-hours)  
  - 2.2 Implement in Drizzle repo + mock  
  - 2.3 Unit tests for count edge cases (exactly 2 → excluded; 3 → included) — covered by SQL `HAVING count() >= n` + use-case tests for no-eligible / success paths
- Task 3: Weekly summary repository (AC: #2, #4)  
  - 3.1 Domain types + `WeeklySummaryRepository` tag  
  - 3.2 Drizzle + mock  
  - 3.3 Export from `packages/domain` package index and infrastructure barrel
- Task 4: Generator port + Anthropic adapter (AC: #4, #5)  
  - 4.1 `WeeklySummaryGeneratorRepository` + errors in domain  
  - 4.2 `WeeklySummaryGeneratorAnthropicRepositoryLive` in infrastructure  
  - 4.3 Prompt builder: inputs = serialized check-ins + facet/trait/archetype summary (no raw PII beyond what user already typed in notes)
- Task 5: `generate-weekly-summary` use-case (AC: #3–#6)  
  - 5.1 Orchestrate: resolve week → list eligible user ids → skip if summary already successful for that week → generate → save  
  - 5.2 `Effect.retry` with `Schedule.exponential` like `generate-full-portrait.use-case.ts` / `generate-relationship-analysis.use-case.ts`  
  - 5.3 Structured logs: `LoggerRepository`, user id, week id, outcome
- Task 6: Cron / HTTP entry (AC: #6)  
  - 6.1 Wire handler + contracts if HTTP route chosen  
  - 6.2 Document Railway Cron schedule (Sunday 18:00 **local product timezone** — align with UX “Sunday evening”) in Dev Notes
- Task 7: Tests (AC: #7)  
  - 7.1 Use-case tests: idempotency, skip low check-ins, mock LLM success/failure  
  - 7.2 Import order: `vi` first, then `vi.mock`, then `@effect/vitest` (see `CLAUDE.md`)

## Dev Notes

### Epic cross-story context

- **Story 5.2** will read `content` as markdown in `/today/week/$weekId` — store **markdown** string; no JSON spine unless you explicitly choose JSON and convert in 5.2 (default: **markdown**).  
- **Story 5.3** adds push/email + `WeeklyLetterCard` — **out of scope** here; do not implement notifications in 5.1.  
- **Epic 4** supplies `daily_check_ins` — reuse `DailyCheckInRepository` only; no schema changes to check-ins unless strictly required for the GROUP BY query.

### Week boundaries (non-negotiable)

- Align with ISO week already used by `GET /api/today/week?weekId=YYYY-Www` — shared helper `resolveIsoWeekBounds` in `packages/domain/src/utils/iso-week.ts` (used by `get-today-week.use-case.ts` and weekly summary pipeline).  
- `week_start_date` / `week_end_date` should be **date** columns matching the **same** `localDate` strings as check-ins for that week (UTC date strings from existing week grid logic).

### Railway / cron (Task 6.2)

- **Endpoint:** `POST /api/jobs/weekly-summaries/generate` with JSON body `{ "weekId": "2026-W15" }` (ISO week id).  
- **Auth:** When `CRON_SECRET` is set in the API environment, send header `x-cron-secret: <same value>`; the use-case compares it with a constant-time digest check. When unset or empty, the check is skipped (local dev only — **set `CRON_SECRET` in production**).  
- **Suggested schedule:** Sunday **18:00** in the product’s primary timezone (e.g. `Europe/Paris`), calling the endpoint with the **previous** ISO week id if the job runs at the end of Sunday, or the current week id per product decision — align with check-in `local_date` semantics.

### Architecture compliance

- **Handlers stay thin** — all branching in use-cases (`CLAUDE.md` / repo rules).  
- **Derive-at-read** for trait scores from facets when building LLM context.  
- **Contracts**: any new HTTP surface goes through `@workspace/contracts` + `HttpApiClient` on the front — this story’s cron endpoint may be server-only; if so, still define in contracts for typed testing or use internal fetch only if project convention allows (prefer contracts for consistency).

### File structure (expected touchpoints)


| Area             | Path                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema           | `packages/infrastructure/src/db/drizzle/schema.ts`                                                                                                |
| Migration        | `drizzle/*_weekly_summaries/migration.sql`                                                                                                        |
| Domain repo      | `packages/domain/src/repositories/weekly-summary.repository.ts`                                                                                   |
| Generator port   | `packages/domain/src/repositories/weekly-summary-generator.repository.ts` (name may vary; keep consistent with other `*GeneratorRepository` tags) |
| Use-case         | `apps/api/src/use-cases/generate-weekly-summary.use-case.ts`                                                                                      |
| Handler          | `apps/api/src/handlers/jobs.ts` (`JobsGroupLive`)                                                                                                 |
| Contracts        | `packages/contracts/src/http/groups/jobs.ts`                                                                                                      |
| API registration | `packages/contracts/src/http/api.ts`, `apps/api/src/index.ts` layers                                                                              |


### Testing standards

- `@effect/vitest` with `it.effect` / `it.scoped` where async context matters.  
- Mock LLM and DB repos; do not call real Anthropic in unit tests.  
- After schema change: update any seed/fixtures if the repo has FK to `weekly_summaries` (unlikely in 5.1 — no new seeds required unless you add test data for e2e later).

### UX / product rules (from `ux-design-specification.md`)

- Free weekly letter must feel **complete** and non-punitive; **no** messaging for users below the check-in threshold.  
- Silence for 0–2 check-ins is intentional — do not write placeholder rows.

### Previous story intelligence (Epic 4)

- **Story 4.1** (`4-1-daily-check-in-data-model-and-api.md`) defines `DailyCheckInRepository` methods, `TodayGroup`, and migration style — mirror exactly for naming and Effect patterns.  
- Week API uses `listForWeek(userId, weekStartLocal, weekEndLocal)` — reuse those bounds for eligibility counts.

### Git / recent patterns

- Recent work emphasizes Me/Today UX and subscription copy; backend patterns for LLM remain **portrait** and **relationship analysis** workers — follow those for retries and logging.

### Latest tech notes

- Use existing `@langchain/anthropic` `ChatAnthropic` + `AppConfig.anthropicApiKey` (Redacted) — same stack as other generators.  
- Node **>= 20**, `pnpm@10.4.1` per root tooling.

### Project context reference

- No `project-context.md` in repo root; rely on `CLAUDE.md` + this file.

### Open questions (non-blocking; default if unsure)

- **Timezone for “Sunday 6pm”:** document whether cron runs in UTC or a named IANA zone; ensure `week_start_date` logic stays consistent with check-in `local_date` (calendar dates, not wall-clock in multiple zones per user — MVP is single timezone for all users unless product specifies per-user TZ later).

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented `weekly_summaries` table, Drizzle + migration, eligibility query, weekly summary + generator ports, Sonnet generation via `portraitGeneratorModelId`, orchestration use-case with retries and idempotent save, `POST /api/jobs/weekly-summaries/generate` + optional `CRON_SECRET` / `x-cron-secret`, shared `resolveIsoWeekBounds` for ISO week alignment with Today week API.
- `pnpm typecheck` and `pnpm --filter=api test` pass.

### File List

- `drizzle/20260415140000_weekly_summaries/migration.sql`
- `packages/domain/src/config/app-config.ts`
- `packages/domain/src/config/__mocks__/app-config.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/prompts/weekly-summary.prompt.ts`
- `packages/domain/src/repositories/daily-check-in.repository.ts`
- `packages/domain/src/repositories/weekly-summary.repository.ts`
- `packages/domain/src/repositories/weekly-summary-generator.repository.ts`
- `packages/domain/src/utils/index.ts`
- `packages/domain/src/utils/iso-week.ts`
- `packages/contracts/src/http/api.ts`
- `packages/contracts/src/http/groups/jobs.ts`
- `packages/contracts/src/index.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/config/app-config.live.ts`
- `packages/infrastructure/src/index.ts`
- `packages/infrastructure/src/utils/test/app-config.testing.ts`
- `packages/infrastructure/src/repositories/daily-check-in.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/daily-check-in.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/weekly-summary.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/weekly-summary.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/weekly-summary-generator.anthropic.repository.ts`
- `packages/infrastructure/src/repositories/weekly-summary-generator.mock.repository.ts`
- `packages/infrastructure/src/repositories/__tests__/web-push.fetch.repository.test.ts`
- `apps/api/src/index.ts`
- `apps/api/src/index.e2e.ts`
- `apps/api/src/handlers/jobs.ts`
- `apps/api/src/use-cases/get-today-week.use-case.ts`
- `apps/api/src/use-cases/generate-weekly-summary.use-case.ts`
- `apps/api/src/use-cases/index.ts`
- `apps/api/src/use-cases/__tests__/generate-weekly-summary.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/check-check-in.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/check-subscription-nudge.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/send-relationship-analysis-notification.use-case.test.ts`
- `.env.example`

### Review Findings

- [Review][Decision] Cron-secret validation — **Resolved:** moved to use-case; handler passes `cronSecretHeader` only [`apps/api/src/handlers/jobs.ts`, `apps/api/src/use-cases/generate-weekly-summary.use-case.ts`]
- [Review][Decision] Parallelism — **Resolved:** `Effect.forEach(..., { concurrency: 3 })` for eligible users [`apps/api/src/use-cases/generate-weekly-summary.use-case.ts`]
- [Review][Patch] Timing-safe secret compare — **Resolved:** SHA-256 digest + `timingSafeEqual` on digests [`constantTimeSecretEqual` in use-case]
- [Review][Patch] Per-user error isolation — **Resolved:** `Effect.catchAll` on each `runForOneUser` counts one failure and continues batch
- [Review][Patch] `catchTag` for LLM failures — **Resolved:** `Effect.catchTag("WeeklySummaryGenerationError", ...)`
- [Review][Patch] Failure log detail — **Resolved:** log `message` and optional `cause` on generation failure
- [Review][Patch] `extractTextContent` null — **Resolved:** `if (content == null) return ""` before `String(content)`
- [Review][Defer] TOCTOU race on idempotency — concurrent requests for same weekId both proceed to LLM; same pattern as relationship analysis [`apps/api/src/use-cases/generate-weekly-summary.use-case.ts:80-81`] — deferred, pre-existing
- [Review][Defer] Partial facets (1–29) crash `computeTraitResults` — same unguarded pattern as `generate-full-portrait.use-case.ts` [`apps/api/src/use-cases/generate-weekly-summary.use-case.ts:106-114`] — deferred, pre-existing
- [Review][Defer] No `updated_at` column on `weekly_summaries` — no timestamp for when a row transitions from failed to generated [`drizzle/20260415140000_weekly_summaries/migration.sql`] — deferred, not in spec
- [Review][Defer] `DatabaseError` used for input validation failures — invalid weekId returns 500 instead of 400; same pattern as `get-today-week.use-case.ts` [`apps/api/src/use-cases/generate-weekly-summary.use-case.ts:54-57`] — deferred, pre-existing

## Change Log

- 2026-04-15: Story 5.1 implemented — weekly summaries schema, generation pipeline, cron HTTP route, tests, `CRON_SECRET` config.
- 2026-04-15: Code review complete — 2 decision-needed, 5 patch, 4 deferred, 8 dismissed.
- 2026-04-15: Code review follow-up — decisions and patches applied; story marked done.

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.1]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — Sunday weekly letter, silence / completeness principles]
- [Source: `apps/api/src/use-cases/get-today-week.use-case.ts` — ISO week parsing]
- [Source: `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` — assessment + LLM orchestration pattern]
- [Source: `apps/api/src/use-cases/generate-full-portrait.use-case.ts` — retry schedule, persistence]
- [Source: `_bmad-output/implementation-artifacts/4-1-daily-check-in-data-model-and-api.md` — repository + migration conventions]
- [Source: `packages/contracts/src/http/groups/email.ts` — cron-style HTTP endpoint pattern]