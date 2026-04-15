# Story 4.4: Mood Calendar View

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created -->

## Story

As a user,
I want to view my check-in history as a calendar,
So that I can see patterns in my mood over time.

## Acceptance Criteria

1. **Given** the user has mood check-in history  
   **When** they open the mood calendar at `/today/calendar`  
   **Then** a `MoodCalendarView` renders a **month** grid: each calendar day cell shows the **mood emoji** for that day when a check-in exists, and an **empty** treatment when there is no check-in (no shaming, no filler copy)  
   **And** the view defaults to the **current month** in the user’s local timezone  
   **And** the user can navigate to **previous** months (and forward again when past months are shown — at minimum: back month-by-month; future months beyond “today” are not required)  

2. **Given** the user is on `/today/calendar`  
   **When** they use the primary back affordance  
   **Then** they return to `/today` (TanStack Router `<Link>` or `useNavigate` after explicit user action — consistent with project navigation rules)  

3. **Given** the epic requires this route **outside** the bottom tab bar  
   **When** `/today/calendar` renders  
   **Then** **BottomNav is not shown** on this route (today shell differs from `/today` index — introduce a small layout variant or route-level wrapper; `ThreeSpaceLayout` today always mounts `BottomNav`, so this story **must** adjust composition for this route only)  
   **And** a visible **back** control to `/today` remains available (pattern: top app bar / back link — match visual language of other “focused” routes in the app if one exists; otherwise minimal text button + arrow icon)  

4. **Given** the Me page “Your Growth” section (currently placeholder / hidden)  
   **When** the user has **at least one** saved daily check-in  
   **Then** the section **renders** with a link to `/today/calendar` (copy can be minimal: growth / mood calendar — align with UX naming)  
   **When** the user has **zero** check-ins  
   **Then** the section stays **hidden** (same conditional pattern as other `isConditional` sections)  

5. **Given** ADR-44  
   **When** this story ships  
   **Then** **zero LLM calls** are added — mood calendar is pure read + UI  

6. **Given** UX detail behavior for look-back (see UX §11 `MoodCalendarView`)  
   **When** the user selects a **past** day that has a check-in  
   **Then** they can see that day’s entry in **`JournalEntry`** presentation (reuse `apps/front/src/components/today/JournalEntry.tsx` — same “journal not chat” rules as Story 4.3)  
   **And** there is **no** streak counter, no “days in a row,” no share/export CTA (Intimacy Principle)  

## Tasks / Subtasks

### Backend — month payload + “has history” for Me

- [x] Task 1 — Contracts + API (AC: #1, #4, #5)  
  - [x] 1.1 Extend `@workspace/contracts` `TodayGroup` with `GET /today/calendar` (name e.g. `getCalendarMonth`) with url param `month` = `YYYY-MM` (validated with `effect` Schema pattern, same style as `LocalDateString` / `WeekIdString`)  
  - [x] 1.2 Define `CalendarMonthResponseSchema`: include `yearMonth`, and enough structured data to render a month grid **and** know empty vs filled days — e.g. per-day cells for the visible month with `localDate` + `checkIn: CheckInResponse | null` **or** sparse list + client expansion (prefer **server-expanded month** for consistent timezone/date handling with Story 4.1/4.2)  
  - [x] 1.3 Add `GET /today/has-check-ins` (or a minimal boolean field on an existing small profile/today bootstrap — **prefer a dedicated minimal endpoint** to avoid coupling) returning `{ hasCheckIns: true | false }` for gating Me “Your Growth”  
  - [x] 1.4 Implement use-cases: `get-calendar-month.use-case.ts`, `has-daily-check-ins.use-case.ts` (names may vary — follow `get-today-week.use-case.ts` / `submit-daily-check-in.use-case.ts` patterns) using existing `DailyCheckInRepository.listForMonth` / a **new** repository method like `existsForUser` if cleaner than `listForMonth` for the boolean query  
  - [x] 1.5 Wire `TodayGroupLive` handlers — **no business logic in handlers** (hexagonal rule)  
  - [x] 1.6 Co-located `__mocks__` updates for `DailyCheckInRepository` if needed for tests  

### Frontend — route, layout, calendar UI, Me section

- [x] Task 2 — `/today/calendar` route (AC: #1–#3, #5)  
  - [x] 2.1 Add TanStack Router file under `apps/front/src/routes/today/calendar.tsx` (or `today/calendar/index.tsx` per file-route conventions generated in this repo — follow existing route tree)  
  - [x] 2.2 Auth: same session gate as `/today` (`beforeLoad` + `getSession` redirect to login)  
  - [x] 2.3 Route guard parity: follow `/today` auth behavior only (`beforeLoad` + `getSession` redirect to login). Do **not** assume a persistent first-visit redirect gate for Today-space routes.  
  - [x] 2.4 Implement layout **without** `BottomNav` + back to `/today` (AC #3)  
  - [x] 2.5 Data: TanStack Query + `makeApiClient` + `client.today.getCalendarMonth` / `hasCheckIns` — **never raw `fetch`** (CLAUDE.md)  
  - [x] 2.6 `MoodCalendarView` component (likely `apps/front/src/components/today/MoodCalendarView.tsx`): month grid, prev/next month controls, mood emoji per day, loading/error states  
  - [x] 2.7 Day detail: sheet/dialog or inline expansion for **past** days with `JournalEntry` — use existing mood meta helper (`today-mood-meta.ts`) for emoji + labels  

- [x] Task 3 — Me page “Your Growth” (AC: #4)  
  - [x] 3.1 Replace placeholder / `hidden` growth section with conditional render driven by `hasCheckIns` query  
  - [x] 3.2 Link to `/today/calendar` using `<Link>` from `@tanstack/react-router`  
  - [x] 3.3 Preserve `data-testid` conventions — **do not remove/rename** existing Me testids; add new ones for growth link + calendar page  

- [x] Task 4 — Tests (AC: all)  
  - [x] 4.1 Unit/component tests for `MoodCalendarView` (grid labels, empty vs filled, month navigation)  
  - [x] 4.2 Integration or handler tests for new API contracts (follow Story 4.1 patterns in `apps/api`)  
  - [x] 4.3 `pnpm typecheck` and targeted Vitest; avoid new Playwright E2E unless a critical journey requires it (`docs/E2E-TESTING.md`)

### Review Findings

- [x] [Review][Decision] `useMemo` after conditional returns — **Resolved (A):** all `useMemo` calls run before loading/error early returns, with empty/safe defaults when `calendarMonth` is absent or the view is not ready [`apps/front/src/components/today/MoodCalendarView.tsx`]
- [x] [Review][Decision] BottomNav hiding for `/today/calendar` — **Resolved (B):** keep composition-only approach (`PageMain` without `ThreeSpaceLayout`); no change to `HIDDEN_ROUTE_PREFIXES` — document that wrapping this route in `ThreeSpaceLayout` would require revisiting AC3
- [x] [Review][Patch] `JournalEntry` accessible heading — optional `srOnlyHeading` prop; default remains today's-check-in wording; mood calendar passes `Check-in on {formatted date}` [`apps/front/src/components/today/JournalEntry.tsx`, `MoodCalendarView.tsx`]
- [x] [Review][Patch] Invalid `yearMonth` — `InvalidYearMonthError` (422) on `TodayGroup.getCalendarMonth`; use-case no longer uses `DatabaseError` for validation [`packages/domain/src/errors/http.errors.ts`, `packages/contracts/src/http/groups/today.ts`, `get-calendar-month.use-case.ts`]
- [x] [Review][Patch] `shiftYearMonth` — uses local `Date(y, m + delta, 1)` to match `getCurrentYearMonth`; covered by `use-calendar-month.test.ts`
- [x] [Review][Patch] `-three-space-routes.test.tsx` — mock `useHasCheckIns` is overridable; added test for growth section + `/today/calendar` link when `hasCheckIns` is true
- [x] [Review][Defer] `shiftYearMonth` throws raw `Error` on malformed input — deferred, edge case only reachable via corrupted local state
- [x] [Review][Defer] `YourGrowthSection` collapses loading/error/no-data into `null` — deferred, acceptable for a conditional Me section; future enhancement could add error distinction
- [x] [Review][Defer] Auth redirect clears `redirectTo` — deferred, pre-existing pattern across all Today-space routes, not introduced by this story
- [x] [Review][Defer] Diff includes non-story-4.4 changes (weekly letter wiring, first-visit gate removal) — deferred, acknowledged in story completion notes  

## Dev Notes

### Story intent

Stories 4.1–4.3 delivered persistence, `/today` check-in UX, week dots, and journal read path. This story adds the **look-back** calendar: **month grid**, **navigation across months**, **Me** discovery link, and **focused** `/today/calendar` shell **without** bottom tabs. Epic 5+ own weekly letter surfaces; do not build weekly letter UI here.

### Spec alignment / intentional deltas

| Source | What it says | This story |
|--------|----------------|------------|
| `epics.md` Story 4.4 | Month grid, previous months, `/today/calendar`, Me growth if ≥1 check-in, outside BottomNav | **Authoritative AC** |
| `ux-design-specification.md` §11 `MoodCalendarView` | Props with `rangeDays: 14`, 14-day grid | **Superseded for MVP grid shape** — keep behaviors (tap → `JournalEntry`, `role="grid"`, no streak/share) |
| `ux-design-specification.md` §11.5 table | BottomNav + MoodCalendarView | **Conflicts with epic** — follow epic AC #3 (no BottomNav on calendar) |
| `architecture.md` ADR-44 | `listForMonth`, `get-mood-calendar.use-case.ts` | Implement the contracted month read path; repository **already** has `listForMonth` |

### Previous story intelligence (4.3)

- Reuse **`JournalEntry`**, **`getMoodMeta`** / `today-mood-meta.ts`, and mood enums **`great` | `good` | `okay` | `uneasy` | `rough`**.  
- **`useTodayCheckIn`** is optimized for **today + current week** — calendar likely needs **new** query hooks (e.g. `useCalendarMonth`, `useHasCheckIns`) rather than overloading the existing hook.  
- **Timezone:** Story 4.3 deferred note: some code uses `new Date().getDay()` vs server `localDate`. For calendar month boundaries, **prefer server-computed `YYYY-MM` and `localDate` list** from the API so the grid matches check-in storage.  
- **Accessibility:** Continue list/grid semantics; for emoji cells use **accessible names** (weekday + date + mood status).  

### Technical requirements

- **HTTP:** `makeApiClient` + `@workspace/contracts` only.  
- **Navigation:** `<Link to="/today/calendar">` / `<Link to="/today">` for internal navigation.  
- **Forms:** No new user-input form for MVP calendar — month switching is **buttons**, not TanStack Form unless you add a date picker later.  
- **Zero LLM:** no Effect LLM layers in use-cases for this feature.  

### Architecture compliance

- **ADR-44:** Silent journal; mood calendar read path only; &lt;500ms perceived navigation where reasonable.  
- **Hexagonal:** Handlers delegate to use-cases; repositories already abstract Postgres.  
- **Derive-at-read:** N/A — check-ins are source data.  

### File structure (expected)

| Area | Path |
|------|------|
| Contracts | `packages/contracts/src/http/groups/today.ts` |
| Use-cases | `apps/api/src/use-cases/get-calendar-month.use-case.ts`, `has-daily-check-ins.use-case.ts` (adjust names to repo conventions) |
| Handler | `apps/api/src/handlers/today.ts` |
| Route | `apps/front/src/routes/today/calendar.tsx` (or equivalent) |
| UI | `apps/front/src/components/today/MoodCalendarView.tsx` (+ optional `MoodCalendarLayout.tsx`) |
| Me | `apps/front/src/routes/me/index.tsx` (Your Growth section) |
| Hooks | `apps/front/src/hooks/use-calendar-month.ts` / `use-has-check-ins.ts` (names flexible) |

### Testing requirements

- Vitest + Testing Library for components; Effect API tests for handlers where the project already does so for `today` group.  
- **Do not** remove or rename existing `data-testid` attributes.  

### Git intelligence

Recent related work: daily check-in API + Today journal/week UI on `73795bdf` / `fad1853c` — extend those patterns rather than new HTTP stacks.

### Project context reference

- Follow root `CLAUDE.md` and `docs/FRONTEND.md` for data attributes and layout.  
- No `project-context.md` in repo — use team conventions above.  

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4, Story 4.4]  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — §11 MoodCalendarView, §11.5 route table, Intimacy / no metrics]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-44, repository `listForMonth`]  
- [Source: `packages/domain/src/repositories/daily-check-in.repository.ts` — `listForMonth`]  
- [Source: `packages/contracts/src/http/groups/today.ts` — existing Today endpoints]  
- [Source: `_bmad-output/implementation-artifacts/4-3-post-check-in-journal-view-and-week-dots.md` — JournalEntry + patterns]  

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- `pnpm --filter api exec vitest run "src/use-cases/__tests__/get-calendar-month.use-case.test.ts"`
- `pnpm --filter front exec vitest run "src/components/today/MoodCalendarView.test.tsx" "src/components/me/__tests__/YourGrowthSection.test.tsx"`
- `pnpm --filter front exec vite build`
- `pnpm typecheck`
- `pnpm test:run`
- `pnpm lint` (repo-level lint still reports pre-existing unrelated diagnostics outside Story 4.4; story-touched files were linted separately and passed)
- `pnpm --filter front exec biome lint src/hooks/use-calendar-month.ts src/hooks/use-has-check-ins.ts src/components/today/MoodCalendarView.tsx src/components/today/MoodCalendarView.test.tsx src/components/me/YourGrowthSection.tsx src/components/me/__tests__/YourGrowthSection.test.tsx src/routes/today/calendar.tsx src/routes/me/index.tsx`
- `pnpm --filter contracts exec biome lint src/http/groups/today.ts`
- `pnpm --filter domain exec biome lint src/repositories/daily-check-in.repository.ts`
- `pnpm --filter infrastructure exec biome lint src/repositories/daily-check-in.drizzle.repository.ts src/repositories/__mocks__/daily-check-in.drizzle.repository.ts`
- `pnpm --filter api exec biome lint src/handlers/today.ts src/use-cases/get-calendar-month.use-case.ts src/use-cases/has-daily-check-ins.use-case.ts src/use-cases/index.ts src/use-cases/__tests__/get-calendar-month.use-case.test.ts`

### Completion Notes List

- **2026-04-15 (bmad-code-review):** Adversarial + AC audit on Story 4.4 scope; no patch/decision items persisted (clean review). Status set to `done`; sprint synced.
- **2026-04-15 (dev-story rerun):** Reconciled `sprint-status.yaml`: `4-4-mood-calendar-view` was `ready-for-dev` while implementation artifact was already `review`; updated sprint entry to `review`. Ran `pnpm typecheck` and `pnpm test:run` — all passed.
- Added month-level Today API contracts and use-cases: `getCalendarMonth` and `getHasCheckIns`, plus repository support for detecting whether a user has any check-ins.
- Implemented `/today/calendar` as a focused route without `BottomNav`, with month navigation, a back link to `/today`, and inline `JournalEntry` detail for selected check-in days.
- Added `useCalendarMonth` and `useHasCheckIns` hooks using the typed Effect `HttpApiClient`; no raw `fetch` or LLM calls were introduced.
- Replaced the hidden Me growth placeholder with a conditional `YourGrowthSection` that appears only when check-in history exists and links to the mood calendar.
- Added backend and frontend tests for the new month/history flow; `pnpm typecheck`, `pnpm test:run`, and `pnpm --filter front exec vite build` all passed.
- `pnpm lint` does not pass repo-wide because of pre-existing unrelated diagnostics outside this story (including an existing error in `apps/front/src/routes/circle/index.tsx`); Story 4.4 files lint clean in targeted runs.
- Follow-up alignment: Today-space route docs originally assumed a persistent first-visit redirect to `/me`; the implementation artifact now reflects the simplified rule used in code and planning docs: assessment completion reveals `/me` once, then users navigate freely.

### File List

- `packages/domain/src/errors/http.errors.ts` (`InvalidYearMonthError`)
- `packages/contracts/src/errors.ts`
- `packages/contracts/src/http/groups/today.ts`
- `packages/domain/src/repositories/daily-check-in.repository.ts`
- `packages/infrastructure/src/repositories/daily-check-in.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/daily-check-in.drizzle.repository.ts`
- `apps/api/src/use-cases/get-calendar-month.use-case.ts`
- `apps/api/src/use-cases/has-daily-check-ins.use-case.ts`
- `apps/api/src/use-cases/index.ts`
- `apps/api/src/use-cases/__tests__/get-calendar-month.use-case.test.ts`
- `apps/api/src/handlers/today.ts`
- `apps/front/src/hooks/use-calendar-month.ts`
- `apps/front/src/hooks/use-calendar-month.test.ts`
- `apps/front/src/hooks/use-has-check-ins.ts`
- `apps/front/src/components/today/JournalEntry.tsx`
- `apps/front/src/components/today/JournalEntry.test.tsx`
- `apps/front/src/components/today/MoodCalendarView.tsx`
- `apps/front/src/components/today/MoodCalendarView.test.tsx`
- `apps/front/src/components/me/YourGrowthSection.tsx`
- `apps/front/src/components/me/__tests__/YourGrowthSection.test.tsx`
- `apps/front/src/routes/today/calendar.tsx`
- `apps/front/src/routes/me/index.tsx`
- `apps/front/src/routes/-three-space-routes.test.tsx`
- `apps/front/src/routeTree.gen.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (sprint: `4-4-mood-calendar-view` → `done`, `epic-4` → `done`, 2026-04-15)
- `_bmad-output/implementation-artifacts/4-4-mood-calendar-view.md`

### Change Log

- 2026-04-15: Implemented the month-based mood calendar API and `/today/calendar` route, added conditional Me growth entry point, and covered the new flow with backend/frontend tests.
- 2026-04-15: Post-review: moved `MoodCalendarView` memos before loading/error returns (`isReady` + empty `cells` when no month); confirmed BottomNav omission stays layout-based (no `HIDDEN_ROUTE_PREFIXES` change).
- 2026-04-15: Post-review patches: `JournalEntry.srOnlyHeading`, `InvalidYearMonthError` + contract wiring, local-time `shiftYearMonth`, Me route growth test with `hasCheckIns: true`.
- 2026-04-15: Sprint tracking aligned to story status (`4-4-mood-calendar-view`: `review`).
- 2026-04-15: BMAD code review completed — no new findings; story marked `done`.

## Story completion status

**done** — Code review passed; mood calendar shipped per AC.
