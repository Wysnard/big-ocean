# Story 5.2: Weekly Letter Reading View & Route

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a user who received a weekly letter,

I want to read it in a focused, distraction-free view,

So that the letter feels like a personal gift from Nerin, not a notification.

## Acceptance Criteria

1. **Given** a weekly summary has been generated for the user (row in `weekly_summaries` with `content` set and `generated_at` populated for that ISO week)

   **When** they navigate to `/today/week/$weekId` (with `$weekId` matching `^\d{4}-W\d{2}$`, same format as `GET /api/today/week?weekId=`)

   **Then** the page loads the letter for the authenticated user and renders a **WeeklyLetterReadingView** that matches the **focused reading shell** used for `PortraitReadingView`: full-width warm background, centered column, letter typography — use the same layout tokens as `PortraitReadingView` (`min-h-[calc(100dvh-3.5rem)]`, `mx-auto max-w-[65ch]`, padding) unless product asks to change to explicit `max-w-[720px]`; either is acceptable if visually aligned with portrait reading.

2. **Given** the letter body

   **When** displayed

   **Then** it renders as **markdown** using the same markdown pipeline as portrait reading (`react-markdown` + `readingMarkdownComponents` from `apps/front/src/components/results/portrait-markdown.tsx`) so lists, emphasis, and paragraphs match the portrait “letter” register.

3. **Given** the weekly letter route

   **When** rendered

   **Then** **BottomNav is not shown** (this route must **not** use `ThreeSpaceLayout`, which always mounts `BottomNav` — use `PageMain` or an equivalent shell without bottom navigation).

4. **Given** the user finished reading

   **When** they use the **back** affordance

   **Then** they return to **`/today`** via TanStack Router **`<Link>`** (not raw `<a href>`).

5. **Given** a free user (MVP: subscription entitlements may still be stubbed; treat “free” as “not subscribed” when entitlement API exists)

   **When** they scroll past the letter

   **Then** a **soft conversion CTA** appears at the bottom in Nerin’s voice:

   - Lead: *"I have more I want to say about what comes next…"* (exact string from UX spec — adjust only for punctuation/typography consistency).
   - Primary button: reuse the **Polar checkout** integration pattern from `SubscriptionPitchSection` (`createThemedCheckoutEmbed` / same testids pattern where applicable — new `data-testid`s for this surface).
   - Secondary: *"Not right now"* dismiss — navigates to `/today` with **no** toast, **no** modal escalation, **no** additional friction.

6. **Given** the dismiss action

   **When** used

   **Then** the user lands on `/today`. **Do not persist “never show again”** in `localStorage`. The CTA **reappears on subsequent visits** to the weekly letter (including a new Sunday / new `weekId`). Session-only suppression is optional but not required by AC.

7. **Given** no letter exists for that user/week (no row, generation failed, or `content` null)

   **When** they open `/today/week/$weekId`

   **Then** show a **calm empty state** — **no shame copy** for low check-ins (Epic / UX: silence is intentional). Prefer HTTP **404** from API + `notFound()` route handling or a dedicated empty component; do **not** leak whether another user’s letter exists.

8. **Given** quality gates

   **When** `pnpm typecheck` and `pnpm test:run` run

   **Then** they pass, including tests for the new use-case and handler behavior.

## Tasks / Subtasks

- [x] **Task 1 — API & contract (AC: #1, #7, #8)**  
  - [x] Add `GET` endpoint on **`TodayGroup`** in `packages/contracts/src/http/groups/today.ts` (e.g. `getWeeklyLetter` with path `/week/:weekId/letter` under prefix `/today` → `/api/today/week/:weekId/letter`) returning a schema like `{ weekId, content: string, generatedAt: string (ISO) }` on success.  
  - [x] Add domain-level “not found” error type if missing row or missing content — mirror patterns from other read endpoints; **handlers stay thin**.  
  - [x] Implement `get-weekly-letter-for-user.use-case.ts` (or equivalent name) calling `WeeklySummaryRepository.getByWeekId(userId, weekId)` — **reuse** existing repository from Story 5.1.  
  - [x] Wire `TodayGroupLive` in `apps/api/src/handlers/today.ts` + export use-case from `apps/api/src/use-cases/index.ts` + layers in `apps/api/src/index.ts`.  
  - [x] Unit tests: `apps/api/src/use-cases/__tests__/get-weekly-letter-for-user.use-case.test.ts` with mocked repo (`vi.mock` + `Layer` per `CLAUDE.md` import order).

- [x] **Task 2 — Frontend route & layout (AC: #1, #3, #4)**  
  - [x] Add file route `apps/front/src/routes/today/week.$weekId.tsx` (path `/today/week/$weekId`) with `beforeLoad` auth + `firstVisitCompleted` gate **consistent with** `apps/front/src/routes/today/index.tsx`.  
  - [x] Implement `WeeklyLetterReadingView` in `apps/front/src/components/today/` (architecture also mentions `components/weekly/` — **pick one** location and keep imports coherent; prefer `components/today/` to colocate with Today space).  
  - [x] Ensure **no `ThreeSpaceLayout`** on this route.

- [x] **Task 3 — Data fetching (AC: #1)**  
  - [x] Add TanStack Query hook using **`makeApiClient`** + `client.today.<newEndpoint>` — **never raw `fetch`** (`CLAUDE.md`).  
  - [x] Align query key with `weekId` (e.g. `["today", "weekly-letter", weekId]`).

- [x] **Task 4 — Markdown + CTA (AC: #2, #5, #6)**  
  - [x] Render markdown via shared `readingMarkdownComponents`.  
  - [x] Bottom CTA block: Nerin copy + checkout + dismiss — mirror UX §Weekly Letter / `ux-design-specification.md` conversion wording; reuse Polar pattern from `SubscriptionPitchSection.tsx`.  
  - [x] Add **`data-testid`** attributes for e2e (do **not** remove/rename once added — `FRONTEND.md`).

- [x] **Task 5 — Empty / error states (AC: #7)**  
  - [x] Loading skeleton consistent with Today / Me patterns.  
  - [x] 404 / missing letter: calm copy, link back to `/today`.

## Dev Notes

### Epic cross-story context

- **Story 5.1** delivered `weekly_summaries`, `WeeklySummaryRepository`, `generate-weekly-summary`, and `POST /api/jobs/weekly-summaries/generate`. Content is **markdown**. ISO week boundaries are centralized in `packages/domain/src/utils/iso-week.ts` (`resolveIsoWeekBounds`, `parseIsoWeekId`).  
- **Story 5.3** will add `WeeklyLetterCard` on `/today`, push, and email — **out of scope** here; do not implement notifications or inline card.  
- **Epic UX:** Free weekly letter must feel **complete**; conversion is a **soft** end-of-letter beat, not a paywall tone.

### Architecture compliance

- **ADR-45** (`architecture.md`): `/today/week/$weekId` = `WeeklyLetterReadingView`, shared shell with portrait focused reading; conversion CTA at end (FR91).  
- **ADR-46** alignment: same “letter” typographic shell as `PortraitReadingView`.  
- **Hexagonal:** No business logic in HTTP handlers — use-case owns branching; errors propagate without remapping except documented fail-open patterns.  
- **Contracts-first:** All new HTTP surface in `@workspace/contracts`, consumed via `HttpApiClient` on the front.

### File structure (expected touchpoints)

| Area | Path |
|------|------|
| Contract | `packages/contracts/src/http/groups/today.ts`, `packages/contracts/src/http/api.ts` |
| Errors (if new) | `packages/domain/src/errors/http.errors.ts` + re-export via `contracts` if needed |
| Use-case | `apps/api/src/use-cases/get-weekly-letter-for-user.use-case.ts` (name may vary) |
| Handler | `apps/api/src/handlers/today.ts` |
| Route | `apps/front/src/routes/today/week.$weekId.tsx` |
| View | `apps/front/src/components/today/WeeklyLetterReadingView.tsx` |
| Hook | `apps/front/src/hooks/use-weekly-letter.ts` (optional; or inline query in route) |

### Testing standards

- API: `@effect/vitest`, `it.effect`, mocked `WeeklySummaryRepository`.  
- Front: component tests colocated or under `__tests__` — **not** raw files under `routes/` without `-` prefix (`CLAUDE.md`).  
- Preserve/add `data-testid` for Playwright.

### Previous story intelligence (5.1)

- Cron route and batch generation are **server-side**; this story only needs **per-user read** by `weekId`.  
- `getByWeekId(userId, weekId)` already exists on `WeeklySummaryRepository`.  
- Review notes from 5.1 file list: layers wired in `apps/api/src/index.ts`; follow same import patterns.

### Git intelligence (recent commits)

- `73795bdf` — weekly summaries pipeline, today journal/week UI: touch similar Today contracts and hooks; follow established Effect + TanStack patterns.

### Latest tech notes

- Node **>= 20**, `pnpm@10.4.1`. No new major deps expected — reuse `react-markdown` and existing Polar embed helper.

### Project context reference

- No `project-context.md` in repo; authoritative rules in `CLAUDE.md` and `docs/FRONTEND.md`.

### Technical requirements (guardrails)

- **Navigation:** `<Link to="/today">` for back and dismiss; `useNavigate()` only if imperative navigation is clearly better (prefer `Link`).  
- **Forms:** N/A for core read path; checkout may use existing embed pattern (not a TanStack Form).  
- **Week ID:** Must match server validation `^\d{4}-W\d{2}$` — same as `WeekIdString` in contracts.

### Architecture compliance checklist

- [x] Handlers delegate to use-cases  
- [x] New errors use domain HTTP error types  
- [x] Frontend uses `HttpApiClient` only

### Testing requirements

- [x] Use-case unit tests with mocks  
- [x] Handler integration via existing API test patterns if present  
- [x] Front: smoke test for WeeklyLetterReadingView or route (optional if time-boxed; typecheck required)

### Review Findings

- [x] [Review][Decision] Reading shell vertical padding diverges from PortraitReadingView — **Resolved:** matched to `py-12 sm:py-16` [`apps/front/src/components/today/WeeklyLetterReadingView.tsx`]
- [x] [Review][Decision] Duplicate `<h1>` — **Resolved:** removed view-level `<h1>`; PageMain `title` is the single heading [`apps/front/src/components/today/WeeklyLetterReadingView.tsx`]
- [x] [Review][Patch] 404 detection via substring match is fragile — **Resolved:** added `Unauthorized` branch to error status detection [`apps/front/src/hooks/use-weekly-letter.ts`]
- [x] [Review][Patch] `beforeLoad` missing error handling for network failures — **Resolved:** wrapped with try/catch + `isRedirect` fallback to `/login` [`apps/front/src/routes/today/week.$weekId.tsx`]
- [x] [Review][Patch] 401 (session expired) misclassified as 500 — **Resolved:** loader now redirects to `/login` on 401; hook detects `Unauthorized` as 401 [`apps/front/src/hooks/use-weekly-letter.ts`, `apps/front/src/routes/today/week.$weekId.tsx`]
- [x] [Review][Defer] `beforeLoad` auth pattern lacks try/catch across all three-space routes [`/today/index.tsx`, `/me/index.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Error status detection via string includes is a project-wide pattern [`use-conversation.ts:77-80`] — deferred, pre-existing

## Dev Agent Record

### Agent Model Used

Cursor (Claude)

### Debug Log References

### Completion Notes List

- Implemented `GET /api/today/week/:weekId/letter` (`getWeeklyLetter`), `WeeklyLetterNotFound` (404), `getWeeklyLetterForUser` use-case, `WeeklyLetterReadingView`, route `/today/week/$weekId` with `PageMain` (no BottomNav), TanStack Query + `fetchWeeklyLetter`, Polar CTA + dismiss links, `notFound` + calm empty UI.
- Fixed `Effect.gen` in `get-calendar-month.use-case.ts` (invalid return type annotation) so API `pnpm typecheck` passes.
- Stabilized `src/routes/-three-space-routes.test.tsx`: mock `useHasCheckIns`, expect growth section absent when no check-ins.

### File List

- `packages/domain/src/errors/http.errors.ts`
- `packages/domain/src/index.ts`
- `packages/contracts/src/errors.ts`
- `packages/contracts/src/http/groups/today.ts`
- `apps/api/src/use-cases/get-weekly-letter-for-user.use-case.ts`
- `apps/api/src/use-cases/index.ts`
- `apps/api/src/handlers/today.ts`
- `apps/api/src/use-cases/__tests__/get-weekly-letter-for-user.use-case.test.ts`
- `apps/api/src/use-cases/get-calendar-month.use-case.ts`
- `apps/front/src/hooks/use-weekly-letter.ts`
- `apps/front/src/components/today/WeeklyLetterReadingView.tsx`
- `apps/front/src/components/today/__tests__/WeeklyLetterReadingView.test.tsx`
- `apps/front/src/routes/today/week.$weekId.tsx`
- `apps/front/src/routes/-three-space-routes.test.tsx`

## References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 5, Story 5.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-45, ADR-46, file tree `today/week.$weekId.tsx`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — weekly letter conversion copy, focused reading]
- [Source: `_bmad-output/implementation-artifacts/5-1-weekly-summary-data-model-and-generation-pipeline.md` — repository, ISO week, markdown content]
- [Source: `apps/front/src/components/results/PortraitReadingView.tsx` — reading shell]
- [Source: `apps/front/src/components/results/portrait-markdown.tsx` — `readingMarkdownComponents`]
- [Source: `apps/front/src/components/me/SubscriptionPitchSection.tsx` — Polar checkout pattern]
- [Source: `packages/domain/src/repositories/weekly-summary.repository.ts` — `getByWeekId`]

## Open questions (non-blocking)

- **Subscriber vs free CTA:** If subscription entitlement is not yet exposed on the API, ship CTA for all users with checkout, or hide CTA when `purchase_events` derivation says active subscriber — confirm against Epic 8 readiness; default to **show CTA only when not subscribed** once `useSubscription` (or equivalent) exists, else show for all with copy still valid.

---

## Change Log

- 2026-04-15: Story implemented — weekly letter API, reading view, route, tests; sprint status → review.
- 2026-04-15: Code review complete — 2 decision-needed, 3 patch, 2 deferred, 6 dismissed. All resolved.

## Story completion status

- **Status:** done  
- **Note:** Implementation complete; code review done — all findings resolved.
