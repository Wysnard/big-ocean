# Story 4.3: Post-Check-in Journal View & Week Dots

Status: ready-for-dev

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

- [ ] Task 1 — Extract / implement **`JournalEntry`** (AC: #1, #6)  
  - [ ] 1.1 Add `JournalEntry` under `apps/front/src/components/today/` (or split file per component) with props driven by `CheckInResponse` / mood meta  
  - [ ] 1.2 Typography: warm **body** font for note text (use existing theme / `font-serif` or project-approved reading font — match `PortraitReadingView` / letter-reading patterns where applicable, not chat UI fonts)  
  - [ ] 1.3 Layout: mood emoji at **left margin** (journal marker), note flows as readable paragraphs; optional subtle date/`localDate` via `<time>` if helpful for a11y  
  - [ ] 1.4 **No** avatar, **no** “sent” indicator, **no** chat bubble chrome  
  - [ ] 1.5 Visibility: MVP may show 🔒 private affordance only; do not invent Inner Circle / Public Pulse UI  

- [ ] Task 2 — Implement **`MoodDotsWeek`** (AC: #1, #5, #6)  
  - [ ] 2.1 Input: `WeekGridResponse` from `useTodayCheckIn().weekQuery` (already fetched in Story 4.2) — map `days[]` to 7 dots; `weekId` is informational only  
  - [ ] 2.2 Filled vs empty: `day.checkIn != null` → filled; use mood-colored fills **or** a single accent — pick one approach and stay consistent with design tokens  
  - [ ] 2.3 “Today” index: derive from hook `localDate` by finding matching `days[].localDate`  
  - [ ] 2.4 Accessibility: `role="list"` / `role="listitem"` or equivalent; each dot has an **`aria-label`** describing weekday + status (per UX component spec)  
  - [ ] 2.5 Loading / error: if `weekQuery` is pending or errored, prefer **non-blocking** UI (dots skeleton or inline calm fallback) — **do not** block the journal entry on week grid failure (align with Story 4.2: week errors don’t block the form)  

- [ ] Task 3 — Implement **`QuietAnticipationLine`** (AC: #2, #3)  
  - [ ] 3.1 Copy **exactly**: `Nerin will write you a letter about your week on Sunday.`  
  - [ ] 3.2 Show **only** when local weekday is Mon–Sat; **hide** on Sunday  
  - [ ] 3.3 Do not add countdown variants unless explicitly requested — epic uses locked copy  

- [ ] Task 4 — Wire **`TodayCheckInSurface`** composition (AC: #4, #5)  
  - [ ] 4.1 Replace or refactor `CheckInSavedState` in `CheckInForm.tsx` so post-check-in = `JournalEntry` + `MoodDotsWeek` + conditional `QuietAnticipationLine`  
  - [ ] 4.2 Pre-check-in branch: insert `MoodDotsWeek` **below** prompt/form (or per layout fit) while keeping `CheckInForm` behavior unchanged  
  - [ ] 4.3 Cross-fade: unify motion on the container or per-section; ensure `motion-safe:` / `motion-reduce:` classes align with Story 4.2 patterns (`TodayCheckInSurface` already animates on `data-state` switch — extend rather than duplicate)  
  - [ ] 4.4 Preserve `data-testid="today-check-in-surface"` and `data-state` — add testids for new components **without** removing existing ones  

- [ ] Task 5 — Tests (AC: all)  
  - [ ] 5.1 Unit/component tests for `MoodDotsWeek` (filled/empty/today ring; Mon–Sun labels)  
  - [ ] 5.2 Unit/component tests for `QuietAnticipationLine` visibility (mock “Sunday” vs “Wednesday”)  
  - [ ] 5.3 Update `CheckInForm` / `TodayCheckInSurface` tests as needed; extend `-three-space-routes.test.tsx` only if route-level behavior changes  
  - [ ] 5.4 `pnpm --filter front test` and `pnpm --filter front typecheck`  

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

_(filled by dev agent)_

### Debug Log References

### Completion Notes List

### File List

---

**Completion status:** ready-for-dev — Ultimate context engine analysis completed — comprehensive developer guide created.
