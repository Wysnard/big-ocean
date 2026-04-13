# Story 4.1: Daily Check-in Data Model & API

Status: done

## Story

As a developer,
I want the database schema and API endpoints for daily check-ins,
so that the Today page has a backend to save and retrieve mood data.

## Acceptance Criteria

1. **Given** the Drizzle schema at `packages/infrastructure/src/db/drizzle/schema.ts`
   **When** the migration is applied
   **Then** a `daily_check_ins` table exists with columns: `id` (uuid PK), `user_id` (FK → `user`), `local_date` (date, NOT NULL), `mood` (enum, NOT NULL), `note` (text, nullable), `visibility` (enum, default `'private'`), `created_at` (timestamptz)
   **And** a unique constraint on `(user_id, local_date)` prevents duplicate check-ins per day
   **And** an index `daily_check_ins_user_created_idx` on `(user_id, created_at DESC)` is present

2. **Given** the domain layer
   **When** the story is complete
   **Then** a `DailyCheckInRepository` interface exists in `packages/domain/src/repositories/daily-check-in.repository.ts` with methods: `upsert`, `getByDate`, `listForWeek`, `listForMonth`
   **And** a Drizzle implementation `DailyCheckInDrizzleRepositoryLive` exists in `packages/infrastructure/src/repositories/daily-check-in.drizzle.repository.ts`
   **And** a co-located `__mocks__/daily-check-in.drizzle.repository.ts` mock exists (in-memory, same interface)

3. **Given** the contracts layer
   **When** the story is complete
   **Then** a `TodayGroup` HttpApiGroup exists in `packages/contracts/src/http/groups/today.ts` with endpoints:
   - `POST /check-in` — submit/upsert a daily check-in (auth required)
   - `GET /check-in` — fetch check-in by `?date=YYYY-MM-DD` query param (auth required)
   - `GET /week` — fetch 7-day grid for week by `?weekId=YYYY-Www` query param (auth required)
   **And** `TodayGroup` is registered in `packages/contracts/src/http/api.ts` under `/api/today`

4. **Given** the API layer
   **When** a `POST /api/today/check-in` is submitted
   **Then** a handler `TodayGroupLive` exists in `apps/api/src/handlers/today.ts`
   **And** use-cases `submit-daily-check-in.use-case.ts` and `get-today-check-in.use-case.ts` and `get-today-week.use-case.ts` exist in `apps/api/src/use-cases/`
   **And** no business logic lives in the handler

5. **Given** a user submits two check-ins on the same `local_date`
   **When** the second submission arrives
   **Then** the first is overwritten (upsert — `INSERT ... ON CONFLICT (user_id, local_date) DO UPDATE SET mood, note, visibility`)

6. **Given** the migration is written
   **When** `pnpm db:generate` is run (or migration is hand-written) and `pnpm typecheck` is run
   **Then** both complete without errors

## Tasks / Subtasks

- [x] Task 1: DB schema + migration (AC: #1)
  - [x] 1.1 Add `dailyCheckInMoodEnum` and `dailyCheckInVisibilityEnum` enums to `packages/infrastructure/src/db/drizzle/schema.ts`
  - [x] 1.2 Add `dailyCheckIns` table definition to schema.ts with all columns, unique constraint, and index
  - [x] 1.3 Hand-write migration SQL file `drizzle/20260413XXXXXX_daily_check_ins/migration.sql` following existing format (see `drizzle/20260412223000_push_notifications/`)
  - [x] 1.4 Run `pnpm typecheck` to verify schema compiles

- [x] Task 2: Domain layer — repository interface (AC: #2)
  - [x] 2.1 Create `packages/domain/src/repositories/daily-check-in.repository.ts` with `DailyCheckInRepository` Context.Tag
  - [x] 2.2 Define `DailyCheckIn` domain type and `UpsertDailyCheckIn` input type (use branded `UserId`, plain `string` for localDate)
  - [x] 2.3 Export `DailyCheckInRepository` and types from `packages/domain/src/repositories/index.ts`

- [x] Task 3: Infrastructure layer — Drizzle implementation + mock (AC: #2)
  - [x] 3.1 Create `packages/infrastructure/src/repositories/daily-check-in.drizzle.repository.ts` with `DailyCheckInDrizzleRepositoryLive` (Layer.effect pattern)
  - [x] 3.2 Implement `upsert` using `db.insert(...).onConflictDoUpdate(...)` on `(user_id, local_date)`
  - [x] 3.3 Implement `getByDate`, `listForWeek`, `listForMonth` using Drizzle queries
  - [x] 3.4 Create `packages/infrastructure/src/repositories/__mocks__/daily-check-in.drizzle.repository.ts` with in-memory mock (Map-based, keyed by `userId:localDate`)
  - [x] 3.5 Export `DailyCheckInDrizzleRepositoryLive` from infrastructure barrel

- [x] Task 4: Contracts — API group definition (AC: #3)
  - [x] 4.1 Create `packages/contracts/src/http/groups/today.ts` with `TodayGroup` HttpApiGroup
  - [x] 4.2 Define `CheckInPayloadSchema`, `CheckInResponseSchema`, `WeekGridResponseSchema` Effect Schema types
  - [x] 4.3 Register `TodayGroup.prefix("/api")` in `packages/contracts/src/http/api.ts`
  - [x] 4.4 Export types from contracts package

- [x] Task 5: API handler + use-cases (AC: #4, #5)
  - [x] 5.1 Create `apps/api/src/handlers/today.ts` with thin `TodayGroupLive` HttpApiBuilder.group
  - [x] 5.2 Create `apps/api/src/use-cases/submit-daily-check-in.use-case.ts`
  - [x] 5.3 Create `apps/api/src/use-cases/get-today-check-in.use-case.ts`
  - [x] 5.4 Create `apps/api/src/use-cases/get-today-week.use-case.ts`
  - [x] 5.5 Register `TodayGroupLive` in the API server's layer composition

- [x] Task 6: Tests (AC: #5, #6)
  - [x] 6.1 Create `apps/api/src/use-cases/__tests__/submit-daily-check-in.use-case.test.ts` using `@effect/vitest`
  - [x] 6.2 Test upsert: first check-in saves, second overwrites; verify only one row per (user, date)
  - [x] 6.3 Run `pnpm typecheck` and `pnpm test:run` and confirm green

## Dev Notes

### Enum Naming

- DB enum names: `daily_check_in_mood` and `daily_check_in_visibility` (snake_case)
- Mood values: `great`, `good`, `okay`, `uneasy`, `rough` (5 options matching Story 4.2 emoji ordering)
- Visibility values: `private`, `inner_circle`, `public_pulse` (default `private`)

### Exact Schema Pattern to Follow

In `packages/infrastructure/src/db/drizzle/schema.ts`, look at `purchaseEvents` table for enum pattern:

```typescript
export const dailyCheckInMoodEnum = pgEnum("daily_check_in_mood", [
  "great", "good", "okay", "uneasy", "rough",
]);

export const dailyCheckInVisibilityEnum = pgEnum("daily_check_in_visibility", [
  "private", "inner_circle", "public_pulse",
]);

export const dailyCheckIns = pgTable(
  "daily_check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    localDate: date("local_date").notNull(),
    mood: dailyCheckInMoodEnum("mood").notNull(),
    note: text("note"),
    visibility: dailyCheckInVisibilityEnum("visibility")
      .notNull()
      .default("private"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique().on(t.userId, t.localDate),
    index("daily_check_ins_user_created_idx").on(t.userId, t.createdAt.desc()),
  ],
);
```

### Migration File Format

Follow the exact pattern in `drizzle/20260412223000_push_notifications/`:
- Folder: `drizzle/20260413XXXXXX_daily_check_ins/`
- File: `migration.sql`
- Use `DO $$ BEGIN ... END $$;` pattern for enum creation (safe re-run)
- Create enum types first, then the table, then the index

### Repository Interface Pattern

Follow `packages/domain/src/repositories/purchase-event.repository.ts` exactly:

```typescript
// packages/domain/src/repositories/daily-check-in.repository.ts
import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

export interface UpsertDailyCheckIn {
  readonly userId: string;
  readonly localDate: string; // "YYYY-MM-DD"
  readonly mood: DailyCheckInMood;
  readonly note?: string | null;
  readonly visibility: DailyCheckInVisibility;
}

export type DailyCheckInMood = "great" | "good" | "okay" | "uneasy" | "rough";
export type DailyCheckInVisibility = "private" | "inner_circle" | "public_pulse";

export interface DailyCheckIn {
  readonly id: string;
  readonly userId: string;
  readonly localDate: string;
  readonly mood: DailyCheckInMood;
  readonly note: string | null;
  readonly visibility: DailyCheckInVisibility;
  readonly createdAt: Date;
}

export class DailyCheckInRepository extends Context.Tag("DailyCheckInRepository")<
  DailyCheckInRepository,
  {
    readonly upsert: (input: UpsertDailyCheckIn) => Effect.Effect<DailyCheckIn, DatabaseError>;
    readonly getByDate: (userId: string, localDate: string) => Effect.Effect<DailyCheckIn | null, DatabaseError>;
    readonly listForWeek: (userId: string, weekStartLocal: string, weekEndLocal: string) => Effect.Effect<DailyCheckIn[], DatabaseError>;
    readonly listForMonth: (userId: string, monthStartLocal: string, monthEndLocal: string) => Effect.Effect<DailyCheckIn[], DatabaseError>;
  }
>() {}
```

### Drizzle Implementation Pattern

Follow `packages/infrastructure/src/repositories/conversation.drizzle.repository.ts`:
- Use `Layer.effect(DailyCheckInRepository, Effect.gen(function* () { const db = yield* Database; ... }))`
- Wrap all Drizzle operations with `Effect.mapError((e) => new DatabaseError({ message: "..." }))`
- For upsert: `db.insert(dailyCheckIns).values({...}).onConflictDoUpdate({ target: [dailyCheckIns.userId, dailyCheckIns.localDate], set: { mood, note, visibility } })`

### Mock Pattern (co-located `__mocks__`)

Follow the exact mock architecture rule from CLAUDE.md:
- Location: `packages/infrastructure/src/repositories/__mocks__/daily-check-in.drizzle.repository.ts`
- Exports the SAME name: `DailyCheckInDrizzleRepositoryLive`
- Implements via `Layer.succeed(DailyCheckInRepository, {...})` with an in-memory `Map<string, DailyCheckIn>` keyed by `"userId:localDate"`
- In tests, use `vi.mock("@workspace/infrastructure/repositories/daily-check-in.drizzle.repository")` (NOT the `__mocks__` path directly)

### Contract Group Pattern

Follow `packages/contracts/src/http/groups/account.ts` exactly:

```typescript
// packages/contracts/src/http/groups/today.ts
import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError, Unauthorized } from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";

export const CheckInPayloadSchema = S.Struct({
  localDate: S.String,  // "YYYY-MM-DD" — computed client-side in user's local timezone
  mood: S.Literal("great", "good", "okay", "uneasy", "rough"),
  note: S.optional(S.NullishOr(S.String)),
  visibility: S.optional(S.Literal("private", "inner_circle", "public_pulse")),
});

export const CheckInResponseSchema = S.Struct({
  id: S.String,
  localDate: S.String,
  mood: S.Literal("great", "good", "okay", "uneasy", "rough"),
  note: S.NullishOr(S.String),
  visibility: S.Literal("private", "inner_circle", "public_pulse"),
});

export const CheckInNotFoundResponseSchema = S.Struct({
  found: S.Literal(false),
});

export const WeekGridResponseSchema = S.Struct({
  weekId: S.String,  // "YYYY-Www"
  days: S.Array(S.Struct({
    localDate: S.String,
    checkIn: S.NullishOr(CheckInResponseSchema),
  })),
});

export const TodayGroup = HttpApiGroup.make("today")
  .add(
    HttpApiEndpoint.post("submitCheckIn", "/check-in")
      .setPayload(CheckInPayloadSchema)
      .addSuccess(CheckInResponseSchema)
      .addError(Unauthorized, { status: 401 })
      .addError(DatabaseError, { status: 500 }),
  )
  .add(
    HttpApiEndpoint.get("getCheckIn", "/check-in")
      .setUrlParams(S.Struct({ date: S.String }))
      .addSuccess(S.Union(CheckInResponseSchema, CheckInNotFoundResponseSchema))
      .addError(Unauthorized, { status: 401 })
      .addError(DatabaseError, { status: 500 }),
  )
  .add(
    HttpApiEndpoint.get("getWeekGrid", "/week")
      .setUrlParams(S.Struct({ weekId: S.String }))
      .addSuccess(WeekGridResponseSchema)
      .addError(Unauthorized, { status: 401 })
      .addError(DatabaseError, { status: 500 }),
  )
  .middleware(AuthMiddleware)
  .prefix("/today");
```

### Handler Pattern

Follow `apps/api/src/handlers/account.ts` — thin presenter, delegates everything to use-cases:
- `apps/api/src/handlers/today.ts` exports `TodayGroupLive`
- Extracts `currentUser` from `CurrentUser` context tag (see `account.ts` handler)
- Calls `submitDailyCheckIn`, `getTodayCheckIn`, `getTodayWeekGrid` use-cases

### Use-Case Pattern

Follow `apps/api/src/use-cases/` existing files — pure Effect.gen functions:
- No HTTP concerns, no error remapping (only fail-open catchTag allowed)
- `submitDailyCheckIn`: zero LLM calls, delegates directly to `DailyCheckInRepository.upsert`
- `getTodayCheckIn`: delegates to `DailyCheckInRepository.getByDate`
- `getTodayWeekGrid`: parses weekId → derive Mon-Sun date range → delegates to `DailyCheckInRepository.listForWeek`, then builds 7-element days array

### API Server Registration

After creating `TodayGroupLive`, register it in the API server's layer composition:
- Find the file that assembles all `*GroupLive` layers (likely `apps/api/src/main.ts` or `apps/api/src/server.ts`)
- Add `TodayGroupLive` alongside other group live layers

### weekId Format

`weekId` format is `"YYYY-Www"` (ISO week, e.g., `"2026-W15"`).
- Week starts Monday, ends Sunday
- For `listForWeek`, compute `weekStartLocal` (Monday) and `weekEndLocal` (Sunday) from weekId

### `localDate` is Client-Provided

The `local_date` is computed **client-side** in the user's local timezone and sent as a `"YYYY-MM-DD"` string. The backend stores it as-is. No server-side timezone conversion at this story level. This matches the architecture (ADR-44: `local_date` pre-computed at write time).

### Error Types

- No new HTTP error types needed for this story — `DatabaseError` and `Unauthorized` are sufficient
- `CheckInNotFound` is handled as a nullable return (`null` or `{ found: false }` schema union) — not a thrown error

### Project Structure Notes

| New file | Location |
|----------|----------|
| Schema enum + table | `packages/infrastructure/src/db/drizzle/schema.ts` (append) |
| Migration SQL | `drizzle/20260413XXXXXX_daily_check_ins/migration.sql` (new file) |
| Domain repository interface | `packages/domain/src/repositories/daily-check-in.repository.ts` |
| Domain types | Inline in repository file (or `packages/domain/src/types/daily-check-in.types.ts`) |
| Infrastructure implementation | `packages/infrastructure/src/repositories/daily-check-in.drizzle.repository.ts` |
| Infrastructure mock | `packages/infrastructure/src/repositories/__mocks__/daily-check-in.drizzle.repository.ts` |
| Contracts group | `packages/contracts/src/http/groups/today.ts` |
| API handler | `apps/api/src/handlers/today.ts` |
| Use-case 1 | `apps/api/src/use-cases/submit-daily-check-in.use-case.ts` |
| Use-case 2 | `apps/api/src/use-cases/get-today-check-in.use-case.ts` |
| Use-case 3 | `apps/api/src/use-cases/get-today-week.use-case.ts` |
| Unit tests | `apps/api/src/use-cases/__tests__/submit-daily-check-in.use-case.test.ts` |

### Cross-Story Context (Do NOT implement now)

- Story 4.2 will create the `CheckInForm` component using `POST /api/today/check-in`
- Story 4.3 will use `GET /api/today/week` for the week-dots display
- Story 4.4 will use `GET /api/today/check-in` and/or `listForMonth` for the calendar view
- Story 5.1 will join `daily_check_ins` to `weekly_summaries` — the weekly letter gate requires ≥3 check-ins per week

### Testing Notes

- Use `@effect/vitest` with `it.effect()` for all async use-case tests
- Import ordering: `vi.mock(...)` calls BEFORE `import { describe, it, expect } from "@effect/vitest"` (avoids initialization error — see CLAUDE.md)
- Tests compose a local `TestLayer` via `Layer.mergeAll(DailyCheckInDrizzleRepositoryLive)` (from mock)
- Never import from `__mocks__/` path directly — always use `vi.mock()` + original path

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — ADR-44, DB Schema, Hexagonal Architecture]
- [Source: CLAUDE.md — Architecture Rules, Mock Architecture, Testing Rules]
- [Source: packages/contracts/src/http/groups/account.ts — HttpApiGroup pattern]
- [Source: packages/contracts/src/http/api.ts — API group registration pattern]
- [Source: packages/domain/src/repositories/purchase-event.repository.ts — Context.Tag repository interface]
- [Source: packages/infrastructure/src/db/drizzle/schema.ts — table/enum pattern]
- [Source: apps/api/src/handlers/conversation.ts — handler pattern]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- 2026-04-13: Implementation plan
  - Task 1: Add daily check-in enums, table, and handwritten migration, then verify schema compilation.
  - Task 2-5: Add repository contract, Drizzle implementation, mock, contracts, handlers, and use-cases using existing Effect patterns.
  - Task 6: Add upsert-focused use-case coverage, then run `pnpm typecheck` and targeted tests before moving story to review.

### Completion Notes List

- Added the daily check-in enums, table, relations, and handwritten migration with the required unique constraint and descending user/date index.
- Added `DailyCheckInRepository`, the Drizzle implementation, and a matching in-memory mock; exported them through the package barrels actually used in this repo.
- Added `TodayGroup`, registered `/api/today`, and implemented thin handlers plus submit/get/week use-cases with ISO week expansion for the 7-day grid.
- Added `submit-daily-check-in.use-case` coverage for create, overwrite, and user/date isolation; `pnpm typecheck`, the targeted Vitest file, and `pnpm test:run` all passed.
- Kept `daily_check_ins.user_id` as `text` instead of `uuid` to match the existing Better Auth `user.id` column and preserve a valid foreign key.

### File List

- drizzle/20260413123000_daily_check_ins/migration.sql
- packages/domain/src/repositories/daily-check-in.repository.ts
- packages/domain/src/index.ts
- packages/infrastructure/src/db/drizzle/schema.ts
- packages/infrastructure/src/repositories/daily-check-in.drizzle.repository.ts
- packages/infrastructure/src/repositories/__mocks__/daily-check-in.drizzle.repository.ts
- packages/infrastructure/src/index.ts
- packages/contracts/src/http/groups/today.ts
- packages/contracts/src/http/api.ts
- packages/contracts/src/index.ts
- apps/api/src/handlers/today.ts
- apps/api/src/use-cases/submit-daily-check-in.use-case.ts
- apps/api/src/use-cases/get-today-check-in.use-case.ts
- apps/api/src/use-cases/get-today-week.use-case.ts
- apps/api/src/use-cases/__tests__/submit-daily-check-in.use-case.test.ts
- apps/api/src/use-cases/index.ts
- apps/api/src/index.ts
- apps/api/src/index.e2e.ts

### Change Log

- 2026-04-13: Implemented Story 4.1 daily check-in backend, repository mock/test coverage, and `/api/today` contract/handler registration.

### Review Findings

- [x] [Review][Decision] D1: Silent visibility downgrade on re-submit — Resolved: reset is intentional (full replacement semantics)
- [x] [Review][Decision] D2: Silent note erasure on re-submit — Resolved: reset is intentional (full replacement semantics)
- [x] [Review][Patch] P1: `localDate` and `date` not format-validated at HTTP boundary — Fixed: added `S.pattern(/^\d{4}-\d{2}-\d{2}$/)` to contract schemas
- [x] [Review][Patch] P2: Invalid `weekId` returns 500 DatabaseError instead of 4xx — Fixed: added `S.pattern(/^\d{4}-W\d{2}$/)` to `weekId` schema
- [x] [Review][Patch] P3: W53 for non-long years silently accepted — Fixed: added `hasIsoWeek53()` check in `parseIsoWeekId`
- [x] [Review][Patch] P4: `getCheckIn` URL param named `date` instead of `localDate` — Fixed: renamed to `localDate` in contract and handler
- [x] [Review][Defer] W1: `toDatabaseError` swallows original error cause — follows existing repo pattern, not unique to this change [`packages/infrastructure/src/repositories/daily-check-in.drizzle.repository.ts`] — deferred, pre-existing pattern
- [x] [Review][Defer] W2: No `updatedAt` column — audit trail incomplete, but not required by spec — deferred, schema design decision
- [x] [Review][Defer] W3: No test coverage for `getTodayWeekGrid` ISO week parsing — not in story AC scope (only submit tests required) — deferred, out of scope
- [x] [Review][Defer] W4: `note` field has no length constraint anywhere in stack — general system boundary concern — deferred, not unique to this story
