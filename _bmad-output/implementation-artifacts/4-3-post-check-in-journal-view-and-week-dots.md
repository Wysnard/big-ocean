# Story 4.3: Post-Check-in Journal View & Week Dots

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created -->

## Story

As a user who just checked in,
I want to see my entry in journal format with my week-so-far progress,
so that my daily deposit feels recorded and I can anticipate Sunday's letter.

## Acceptance Criteria

1. **Given** the user has checked in today  
   **When** the post-check-in state renders on `/today`  
   **Then** a `JournalEntry` (or equivalent composition) shows the user's mood emoji and note text in **journal format** — shared-page feel, warm body typography, **not** chat bubbles, **not** a threaded message list  
   **And** a `MoodDotsWeek` component shows **7 dots** for the current ISO week (**Mon–Sun**), with day labels **M T W T F S S** (small, muted)  
   **And** today's dot is visually distinguished (subtle ring/highlight) whether filled or empty  
   **And** days with a saved check-in render as **filled** dots; days without a check-in render as **empty/outlined** dots; **future** days within the week remain empty  
   **And** **no streak counter**, no “days this week” percentage, no gamification copy — dots only  

2. **Given** it is **Monday through Saturday** (local calendar day for the user)  
   **When** the post-check-in state renders  
   **Then** a `QuietAnticipationLine` displays the **locked** copy: `Nerin will write you a letter about your week on Sunday.`  
   **And** the line is small, muted, non-interactive (no button, no icon) per UX  

3. **Given** it is **Sunday** (local calendar day)  
   **When** the post-check-in state renders  
   **Then** the quiet anticipation line **does not** render (Epic 5 `WeeklyLetterCard` will occupy this slot — **out of scope** for this story; do not build the weekly letter card here)  

4. **Given** the user transitions from pre-check-in to post-check-in (save success or page load with existing check-in)  
   **When** the UI switches state  
   **Then** the transition uses a **cross-fade** (target ~**400ms**) with **`prefers-reduced-motion`** respected (instant or minimal motion when reduced)  
   **And** the implementation remains compatible with the optimistic path from Story 4.2 (no full reload required)  

5. **Given** the UX three-space spec for Today  
   **When** `/today` renders in the **pre-check-in** state  
   **Then** the page should still communicate week-so-far progress: render `MoodDotsWeek` alongside the existing `CheckInForm` using the same `weekQuery` data so “today” can appear empty before save (**UX §15.1 / Journey 2** alignment — week dots are not only a post-check-in artifact)  

6. **Given** ADR-44  
   **When** this story ships  
   **Then** **zero LLM calls** are added — rendering is pure UI + existing Today APIs  

## Tasks / Subtasks

- [x] Task 1 — Extract / implement **`JournalEntry`** (AC: #1, #6)  
  - [x] 1.1 Add `JournalEntry` under `apps/front/src/components/today/` (or split file per component) with props driven by `CheckInResponse` / mood meta  
  - [x] 1.2 Typography: warm **body** font for note text (use existing theme / `font-serif` or project-approved reading font — match `PortraitReadingView` / letter-reading patterns where applicable, not chat UI fonts)  
  - [x] 1.3 Layout: mood emoji at **left margin** (journal marker), note flows as readable paragraphs; optional subtle date/`localDate` via `<time>` if helpful for a11y  
  - [x] 1.4 **No** avatar, **no** “sent” indicator, **no** chat bubble chrome  
  - [x] 1.5 Visibility: MVP may show 🔒 private affordance only; do not invent Inner Circle / Public Pulse UI  

- [x] Task 2 — Implement **`MoodDotsWeek`** (AC: #1, #5, #6)  
  - [x] 2.1 Input: `WeekGridResponse` from `useTodayCheckIn().weekQuery` (already fetched in Story 4.2) — map `days[]` to 7 dots; `weekId` is informational only  
  - [x] 2.2 Filled vs empty: `day.checkIn != null` → filled; use mood-colored fills **or** a single accent — pick one approach and stay consistent with design tokens  
  - [x] 2.3 “Today” index: derive from hook `localDate` by finding matching `days[].localDate`  
  - [x] 2.4 Accessibility: `role="list"` / `role="listitem"` or equivalent; each dot has an **`aria-label`** describing weekday + status (per UX component spec)  
  - [x] 2.5 Loading / error: if `weekQuery` is pending or errored, prefer **non-blocking** UI (dots skeleton or inline calm fallback) — **do not** block the journal entry on week grid failure (align with Story 4.2: week errors don’t block the form)  

- [x] Task 3 — Implement **`QuietAnticipationLine`** (AC: #2, #3)  
  - [x] 3.1 Copy **exactly**: `Nerin will write you a letter about your week on Sunday.`  
  - [x] 3.2 Show **only** when local weekday is Mon–Sat; **hide** on Sunday  
  - [x] 3.3 Do not add countdown variants unless explicitly requested — epic uses locked copy  

- [x] Task 4 — Wire **`TodayCheckInSurface`** composition (AC: #4, #5)  
  - [x] 4.1 Replace or refactor `CheckInSavedState` in `CheckInForm.tsx` so post-check-in = `JournalEntry` + `MoodDotsWeek` + conditional `QuietAnticipationLine`  
  - [x] 4.2 Pre-check-in branch: insert `MoodDotsWeek` **below** prompt/form (or per layout fit) while keeping `CheckInForm` behavior unchanged  
  - [x] 4.3 Cross-fade: unify motion on the container or per-section; ensure `motion-safe:` / `motion-reduce:` classes align with Story 4.2 patterns (`TodayCheckInSurface` already animates on `data-state` switch — extend rather than duplicate)  
  - [x] 4.4 Preserve `data-testid="today-check-in-surface"` and `data-state` — add testids for new components **without** removing existing ones  

- [x] Task 5 — Tests (AC: all)  
  - [x] 5.1 Unit/component tests for `MoodDotsWeek` (filled/empty/today ring; Mon–Sun labels)  
  - [x] 5.2 Unit/component tests for `QuietAnticipationLine` visibility (mock “Sunday” vs “Wednesday”)  
  - [x] 5.3 Update `CheckInForm` / `TodayCheckInSurface` tests as needed; extend `-three-space-routes.test.tsx` only if route-level behavior changes  
  - [x] 5.4 `pnpm --filter front test` and `pnpm --filter front typecheck`  

### Review Findings

- [x] [Review][Decision] "This week" heading removed — "dots only" per AC1 (chose option A)
- [x] [Review][Decision] QuietAnticipationLine ordering kept as JournalEntry → dots → anticipation — visual flow preferred (chose option B)
- [x] [Review][Patch] Hardcoded `id="journal-entry-heading"` — fixed: `useId()` for heading id + `aria-labelledby` [`JournalEntry.tsx`]
- [x] [Review][Patch] Duplicate saving copy — fixed: removed inline "Saving…" from `JournalEntry`; `CardDescription` remains single source [`CheckInForm.tsx`, `JournalEntry.tsx`]
- [x] [Review][Patch] Loading skeleton pulse — fixed: `motion-safe:animate-pulse motion-reduce:animate-none` [`MoodDotsWeek.tsx`]
- [x] [Review][Defer] `QuietAnticipationLine` uses `new Date().getDay()` (browser TZ) while rest of flow uses server-derived `localDate` — timezone mismatch possible but edge-case; deferred, needs design decision
- [x] [Review][Defer] `getMoodMeta` fallback silently maps unknown moods to "okay" — if API extends moods the UI will mislabel; deferred, pre-existing from Story 4.2 extraction
- [x] [Review][Defer] No `aria-live` region announcement when MoodDotsWeek transitions from loading to ready — deferred, a11y enhancement
- [x] [Review][Defer] `weekQueryError` naming is ambiguous (it means "error AND no cached data", not just "errored") — deferred, cosmetic
- [x] [Review][Dismiss] Transition is fade-in on remount (`key={surfaceState}`) not a true overlapping cross-fade — AC4 says "cross-fade" but the existing Story 4.2 pattern already uses this same `key` swap approach; changing to an actual crossfade would be a larger motion system rework. The current ~400ms fade-in with reduced-motion guard is functionally equivalent.
- [x] [Review][Dismiss] `data-testid` collision risk for "journal-entry" / "mood-dots-week" — only one instance per page in the current architecture
- [x] [Review][Dismiss] `text-sm` for QuietAnticipationLine vs UX "small" — `text-sm` (14px) is the project's standard "small" body size
- [x] [Review][Dismiss] Visibility treatment (inline text vs corner icon) — minor interpretation; spec intent is "subtle" which this satisfies
- [x] [Review][Dismiss] Server-validated edge cases (duplicate dates, mis-ordered days, invalid localDate format, whitespace-only note) — backend contract + server use-case guarantee validity

## Dev Notes

### Story intent

Story 4.2 delivered the **pre-check-in** form, optimistic save, and TanStack Query wiring for **today** + **week grid**. This story completes the **free-tier Today** “silent journal” **read** experience: journal-formatted entry, week dots, and the **quiet anticipation** bridge to Sunday — **without** LLM calls (ADR-44). Epic 5 owns the Sunday **WeeklyLetterCard** and weekly letter pipeline; **do not** implement those here.

### Previous story intelligence (4.2)

- **`useTodayCheckIn`** (`apps/front/src/hooks/use-today-check-in.ts`) exposes `todayQuery`, `weekQuery`, `submitCheckIn`, `weekId`, `localDate`. Reuse; do not add raw `fetch`.  
- **Week grid shape:** `WeekGridResponse.days` is **7 entries Mon–Sun** for the ISO week parsed server-side — see `getTodayWeekGrid` in `apps/api/src/use-cases/get-today-week.use-case.ts` (`Array.from({ length: 7 }, …)` from Monday).  
- **`hasCheckInRecord`** guards optimistic vs not-found responses.  
- **`CheckInSavedState`** is a **placeholder** card (“Checked in for today.”) — **replace** journal content with `JournalEntry` + surrounding layout per this story.  
- **`TodayCheckInSurface`** intentionally waits on **`todayQuery` only** for the skeleton; week query must not hide the main surface early.  
- Review notes from 4.2: preserve drafts on failure; touch targets 44px; reduced-motion safety for animations.

### Technical requirements

- **HTTP client:** only `makeApiClient` + `TodayGroup` contracts (`@workspace/contracts`).  
- **No backend changes** expected — `GET /api/today/week` and `GET /api/today/check-in` already exist from Story 4.1. If a gap is discovered, stop and flag; do not bypass contracts.  
- **No LLM:** no Effect LLM layers, no `NerinMarginNote` (post-MVP per UX).  
- **Navigation:** internal links (if any) use TanStack Router `<Link>`. This story likely has none.  
- **Forms:** not required for read-only journal/dots; existing check-in form stays on TanStack Form.

### Architecture compliance

- **ADR-44** (`_bmad-output/planning-artifacts/architecture.md`): silent journal, &lt;500ms perceived transition, zero LLM on write — this story is read/UI only.  
- **Three-space UX:** Today is ephemeral and calm; avoid dashboard/streak language.  
- **File placement:** `apps/front/src/components/today/*`, route stays `apps/front/src/routes/today/index.tsx`.  
- **Shared UI:** reusable primitives → `@workspace/ui`; Today-specific compositions stay in `apps/front`.

### File structure (expected)

| Action | Path |
|--------|------|
| Add / extend | `apps/front/src/components/today/JournalEntry.tsx` |
| Add | `apps/front/src/components/today/MoodDotsWeek.tsx` |
| Add | `apps/front/src/components/today/QuietAnticipationLine.tsx` |
| Refactor | `apps/front/src/components/today/CheckInForm.tsx` (`CheckInSavedState`) |
| Refactor | `apps/front/src/components/today/TodayCheckInSurface.tsx` (pre + post composition) |
| Tests | `apps/front/src/components/today/*.test.tsx` |

### UX guardrails

- Copy lock for anticipation line (see Acceptance Criteria).  
- Journal format ≠ chat; reference UX **MoodDotsWeek**, **JournalEntry**, **QuietAnticipationLine** sections in `_bmad-output/planning-artifacts/ux-design-specification.md` (~L3650–3740).  
- **Intimacy Principle:** no engagement metrics on Today.

### Testing requirements

- Vitest + Testing Library; mock queries where needed.  
- **No new Playwright E2E** required for this story unless you touch critical multi-page flows — see `docs/E2E-TESTING.md`.  
- Do **not** remove or rename existing `data-testid` values.

### Git / recent work intelligence

- Story 4.2 touched: `TodayCheckInSurface.tsx`, `CheckInForm.tsx`, `use-today-check-in.ts`, `-three-space-routes.test.tsx`. Build on those patterns.  
- Contracts: `packages/contracts/src/http/groups/today.ts` — `WeekGridResponseSchema`, `CheckInResponseSchema`.

### Project context reference

- No `project-context.md` in repo root — follow `CLAUDE.md` and `docs/FRONTEND.md`.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 4, Story 4.3]  
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — §15.1 Today, MoodDotsWeek, JournalEntry, QuietAnticipationLine]  
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-44 Silent Daily Journal]  
- [Source: `apps/api/src/use-cases/get-today-week.use-case.ts` — week grid ordering]  
- [Source: `apps/front/src/hooks/use-today-check-in.ts`]  
- [Source: `apps/front/src/components/today/TodayCheckInSurface.tsx`]  
- [Source: `_bmad-output/implementation-artifacts/4-2-checkinform-component.md`]  

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

- `pnpm --filter front exec vitest run src/components/today/`
- `pnpm --filter front typecheck`
- `pnpm --filter front lint`

### Completion Notes List

- Added `today-mood-meta.ts`, `JournalEntry.tsx`, `MoodDotsWeek.tsx`, and `QuietAnticipationLine.tsx`; refactored `CheckInSavedState` to compose journal + week dots + anticipation (Mon–Sat only); pre-check-in shows `MoodDotsWeek` in a secondary card below `CheckInForm`.
- Week grid loading/error paths use non-blocking skeleton and dashed-dot fallback; assistive text uses `sr-only` where Biome disallowed `aria-label` on decorative spans.
- Extended `TodayCheckInSurface` with `motion-reduce:animate-none` for the pre/post transition.
- `pnpm --filter front test` (523 tests) and `pnpm --filter front typecheck` pass; `pnpm --filter front lint` passes (existing warnings elsewhere).
- Code review (2026-04-15): D1 removed "This week" headings; D2 kept JournalEntry → dots → anticipation order; batch patches: `useId()` for journal heading, single saving message in card description, `motion-safe` skeleton pulse.

### File List

- `apps/front/src/components/today/today-mood-meta.ts`
- `apps/front/src/components/today/JournalEntry.tsx`
- `apps/front/src/components/today/JournalEntry.test.tsx`
- `apps/front/src/components/today/MoodDotsWeek.tsx`
- `apps/front/src/components/today/MoodDotsWeek.test.tsx`
- `apps/front/src/components/today/QuietAnticipationLine.tsx`
- `apps/front/src/components/today/QuietAnticipationLine.test.tsx`
- `apps/front/src/components/today/CheckInForm.tsx`
- `apps/front/src/components/today/TodayCheckInSurface.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/4-3-post-check-in-journal-view-and-week-dots.md`

## Change Log

- 2026-04-15: Implemented Story 4.3 post-check-in journal view, week dots (pre + post), quiet anticipation line, tests, and sprint/story status → review.
- 2026-04-15: Code review — decisions + patches applied; story and sprint status → **done**.

---

**Completion status:** Story **done** — implementation and review complete.
