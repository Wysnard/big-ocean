# Story 7.3: Relationship Letter Page — Living Relational Space

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user viewing a relationship letter,

I want to see a living page with the letter, data grid, history, and shared notes,

so that the relationship feels like an ongoing space, not a one-time report.

## Acceptance Criteria

1. **Given** the user navigates to `/relationship/$analysisId` (same route as today; internal model remains `relationship_analyses`)

   **When** the relationship letter page renders with generated content (`content` non-null)

   **Then** **Section A — This Year’s Letter** displays the LLM-generated letter in **letter format** (ADR-48): focused reading, warm body tone, max-width consistent with `PortraitReadingView` / `WeeklyLetterReadingView` (~65ch / ~720px register — see `apps/front/src/components/results/PortraitReadingView.tsx`, `apps/front/src/components/today/WeeklyLetterReadingView.tsx`). The narrative may remain spine/markdown-backed as today; presentation must read as a **letter**, not a dashboard card.

2. **And** **Section B — Where You Are Right Now** shows a **side-by-side trait/facet comparison** for both participants, **derived at read time** from the **locked** `user_a_result_id` / `user_b_result_id` on the `relationship_analyses` row (NFR29 / derive-at-read — same truth as scores elsewhere). Framing: complementarity / overlap, **not** winner/loser. Reuse existing trait/facet visualization patterns from results where possible (`TraitCard`, facet breakdown patterns, design tokens — see `docs/FRONTEND.md`).

3. **And** **Section C — Letter History** shows a **vertical timeline** of letters. **MVP:** exactly **one** entry (this letter), labeled with the completion timestamp (`content_completed_at` or `created_at` from analysis — product copy can say “This connection” / year as appropriate). Structure must accept **multiple** rows post-MVP (FR35 annual regeneration) without a front-end rewrite.

4. **And** **Section D1 — Things You’ve Learned About Each Other** shows **user-owned shared notes** with **per-entry attribution** (author display name + time). Both participants in the dyad can add notes; notes are visible to both (privacy contract per FR32a / UX — no raw evidence strings).

5. **And** **Section F — Your Next Letter** shows an **anticipation anchor** (static MVP copy is acceptable): e.g. that Nerin is already learning more about both of you — align with PRD/UX tone; **no** fake countdown unless product adds real scheduling data later.

6. **And** **Ritual flow (FR31 / UX):** The existing **`RitualScreen`** (`apps/front/src/components/relationship/RitualScreen.tsx`) is shown on **first meaningful visit** to this relationship’s letter experience; **subsequent** visits skip the full ritual by default and expose a **“Read together again”** (or equivalent) control that navigates to `/relationship/$analysisId/ritual` to re-enter the ritual route. Persist “seen” state **per `analysisId`** (e.g. `localStorage` key scoped to analysis — avoid server requirement for MVP unless you have a strong reason).

7. **And** **Intimacy Principle** holds: **no** activity metrics, streaks, scores-as-leaderboards, or surveillance framing on this page (FR98 / UX). The grid is relational context, not gamification.

8. **And** **User-facing language** says **relationship letter** / **dynamic** — not “relationship analysis” — on this surface (align with `ux-design-specification.md` and Story 6.2 framing). Internal code names (`relationship_analysis`, `getRelationshipAnalysis`) can stay.

9. **And** quality gates: `pnpm typecheck` and `pnpm test:run` pass; add/extend tests for new hooks/components (and use-cases if backend expands). Follow `CLAUDE.md` / `docs/E2E-TESTING.md` — prefer integration/unit for section logic; E2E only if covering a critical journey.

## Tasks / Subtasks

- [x] Task 1 — Contracts & API shape for page data (AC: #2, #3, #4, #8)

  - [x] 1.1 Extend `RelationshipAnalysisResponse` (or add a dedicated grouped endpoint) in `packages/contracts/src/http/groups/relationship.ts` to carry data required for Section B (facet/trait maps for both locked results — minimal JSON shape, versioned). **Option A (preferred):** extend `getRelationshipAnalysis` success schema with e.g. `userAFacets`, `userBFacets`, `userATraits`, `userBTraits` (or a single structured `comparison` object). Load via `AssessmentResultRepository.getById` for `userAResultId` / `userBResultId` inside `apps/api/src/use-cases/get-relationship-analysis.use-case.ts` (hexagonal — no logic in handler beyond wiring).

  - [x] 1.2 Add **letter history** metadata needed for Section C MVP (at minimum `contentCompletedAt` / `createdAt` exposed to client — may already exist in DB but not in contract; align field names with schema `relationship_analyses`).

  - [x] 1.3 **Shared notes (Section D1):** introduce persistence — new Drizzle table (e.g. `relationship_shared_notes` or name aligned with `architecture.md` “relationship.notes”), repository in domain, use-cases (`list`, `create` — update/delete only if required by UX; MVP likely create + list). Hand-write migration SQL (**never** edit existing migrations). Wire `HttpApiGroup` endpoints under `relationship` with auth + dyad membership checks (same authorization model as `getRelationshipAnalysis`). Re-export errors in `contracts`.

- [x] Task 2 — Frontend page composition (AC: #1, #2, #3, #4, #5, #6, #7, #8)

  - [x] 2.1 Refactor `apps/front/src/routes/relationship/$analysisId.tsx` from a single `RelationshipPortrait` card into a **scrollable living layout**: sections A → B → C → D1 → F with clear headings and landmarks for accessibility (`<main>`, section `aria-labelledby`).

  - [x] 2.2 Implement **Section A** using letter-register styling; optionally extract a small `RelationshipLetterReadingView` if it clarifies reuse (mirror `WeeklyLetterReadingView` patterns). Keep `data-testid` stability: extend or nest — **do not** remove existing ids used by tests without updating tests.

  - [x] 2.3 Implement **Section B** grid component(s) under `apps/front/src/components/relationship/` — consume new API fields; mobile: stacked comparison if needed.

  - [x] 2.4 Implement **Section C** timeline (single item MVP).

  - [x] 2.5 Implement **Section D1** notes list + composer (TanStack Form + shadcn — per `CLAUDE.md`). Use `HttpApiClient` / `makeApiClient` only — no raw `fetch`.

  - [x] 2.6 Implement **Section F** static anticipation block.

  - [x] 2.7 **Ritual gating:** Implement first-visit vs return-visit behavior and **“Read together again”** → `/relationship/$analysisId/ritual` using TanStack Router `<Link>` / `useNavigate` per `CLAUDE.md`.

- [x] Task 3 — Copy & UX polish (AC: #7, #8)

  - [x] 3.1 Replace user-visible “analysis” strings on this page with “letter” / “dynamic” per UX spec.

  - [x] 3.2 Verify invite / Circle flows still land correctly (`CirclePersonCard` already links to `/relationship/$analysisId`).

- [x] Task 4 — Tests (AC: #9)

  - [x] 4.1 Unit/integration: `get-relationship-analysis` with extended payload; notes use-cases; new components.

  - [x] 4.2 Run `pnpm typecheck` + `pnpm test:run`.

## Dev Notes

### Epic cross-story context

- **7.1 / 7.2** — UserSummary-backed generation is done; this story is **mostly presentation + relational surface + notes**. Do not change Sonnet prompt contracts unless a bug blocks UI.

- **Dependencies:** Requires completed relationship analysis row with content for the “ready” path; generating/null-content path should remain intact (polling + retry).

### Canonical references

- Epic AC: [`_bmad-output/planning-artifacts/epics.md`](../../planning-artifacts/epics.md) — Epic 7, Story 7.3

- PRD: [`_bmad-output/planning-artifacts/prd.md`](../../planning-artifacts/prd.md) — **FR29**, **FR31**, **FR35** (history / future multi-letter)

- Architecture: [`_bmad-output/planning-artifacts/architecture.md`](../../planning-artifacts/architecture.md) — Relationship Letter row in Component Boundaries; **ADR-48** letter register; **ADR-55** UserSummary (already consumed in 7.2)

- UX: [`_bmad-output/planning-artifacts/ux-design-specification.md`](../../planning-artifacts/ux-design-specification.md) — relationship letter ritual, three-space language

- Prior implementation stories: [`7-2-relationship-letter-generation-with-usersummary.md`](./7-2-relationship-letter-generation-with-usersummary.md), [`7-1-usersummary-data-model-and-generator.md`](./7-1-usersummary-data-model-and-generator.md)

### Architecture compliance

- **Hexagonal:** Notes CRUD and comparison data loading live in use-cases + repos; handlers thin.

- **Derive-at-read:** Facet/trait values for Section B must come from **locked** assessment results tied to this analysis, not stale cached aggregates.

- **Errors:** Define domain/HTTP errors for notes in the usual `domain` + `contracts` pattern (`CLAUDE.md`).

- **Authorization:** Any note or analysis field must verify the requester is `userA` or `userB` for that analysis (mirror `getRelationshipAnalysis`).

### File structure (expected touchpoints)

| Area | Path |
| --- | --- |
| Route | `apps/front/src/routes/relationship/$analysisId.tsx` |
| Ritual route | `apps/front/src/routes/relationship/$analysisId_.ritual.tsx` |
| Letter UI | `apps/front/src/components/relationship/*` (new section components) |
| Hooks | `apps/front/src/hooks/useRelationshipAnalysis.ts` (extend or add notes hooks) |
| Contracts | `packages/contracts/src/http/groups/relationship.ts` |
| Get analysis UC | `apps/api/src/use-cases/get-relationship-analysis.use-case.ts` |
| Handler | `apps/api/src/handlers/relationship.ts` |
| Schema | `packages/infrastructure/src/db/drizzle/schema.ts` + new `drizzle/*/migration.sql` |

### Testing standards

- `@effect/vitest` for use-cases; `vi.mock` import order per `CLAUDE.md`.

- Frontend: Testing Library; route tests not in `routes/` unless using `-` prefix rule.

- Do **not** remove or rename `data-testid` attributes without updating consumers.

### Previous story intelligence (7.2)

Source: [`7-2-relationship-letter-generation-with-usersummary.md`](./7-2-relationship-letter-generation-with-usersummary.md)

- Relationship content is **spine JSON string** rendered via markdown sections in `RelationshipPortrait` — Section A can keep that pipeline while changing **chrome** to letter-reading layout.

- Display names may still be **“Person A” / “Person B”** in data if not resolved — if notes attribution needs real names, use session/profile patterns consistently (do not invent PII).

- Retry / missing UserSummary behaviors are backend concerns; this page assumes generation eventually succeeds or shows existing generating UI.

### Git intelligence (recent context)

- Recent work includes UserSummary relationship letters (`66273607`) — build on that stack; avoid parallel fetch patterns that bypass `@workspace/contracts` client.

### Latest tech notes

- Node **≥ 20**, **pnpm@10.4.1** (`CLAUDE.md`).

- API client: **Effect** `HttpApiClient` from `@workspace/contracts` only on the frontend.

### Project context reference

- [`CLAUDE.md`](../../../CLAUDE.md) — architecture, frontend rules, testing.

- [`docs/FRONTEND.md`](../../../docs/FRONTEND.md) — styling/data attributes.

### Scope boundaries (do not expand without PM)

- **Post-MVP Section D2–D4** (relational observations, subscriber layers) — out of scope.

- **Annual regeneration & multi-version letters** — only **structure** Section C for it; no scheduler required in this story unless already present.

- **Real-time “live” grid** beyond derive-at-read — MVP: load on page fetch; optional light refetch is OK; no WebSocket requirement.

## Dev Agent Record

### Agent Model Used

Composer (Cursor)

### Debug Log References

### Completion Notes List

- Implemented Epic 7 Story 7.3: extended `getRelationshipAnalysis` with locked-result facet/trait maps plus `contentCompletedAt` / `createdAt`; added `relationship_shared_notes` table, repository, list/create use-cases, and HTTP endpoints; rebuilt `/relationship/$analysisId` as sections A–F with letter register, trait comparison grid, history timeline, shared notes (TanStack Form + Effect client), next-letter anchor, and per-analysis `localStorage` ritual gate with “Read together again” link; updated related relationship UI copy.
- Fixed `MePageSections` subscription prop wiring uncovered by forced `front` typecheck (subscription block referenced out-of-scope state).
- `pnpm turbo typecheck` (contracts, domain, infrastructure, api, front) and full `pnpm test:run` completed successfully (2026-04-16).

### File List

- `drizzle/20260416195000_relationship_shared_notes/migration.sql`
- `packages/domain/src/errors/http.errors.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/repositories/relationship-shared-note.repository.ts`
- `packages/contracts/src/errors.ts`
- `packages/contracts/src/http/groups/relationship.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/index.ts`
- `packages/infrastructure/src/repositories/relationship-shared-note.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/relationship-shared-note.drizzle.repository.ts`
- `apps/api/src/index.ts`
- `apps/api/src/index.e2e.ts`
- `apps/api/src/handlers/relationship.ts`
- `apps/api/src/use-cases/get-relationship-analysis.use-case.ts`
- `apps/api/src/use-cases/list-relationship-shared-notes.use-case.ts`
- `apps/api/src/use-cases/create-relationship-shared-note.use-case.ts`
- `apps/api/src/use-cases/__tests__/get-relationship-analysis.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/list-relationship-shared-notes.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/create-relationship-shared-note.use-case.test.ts`
- `apps/front/src/routes/relationship/$analysisId.tsx`
- `apps/front/src/routes/relationship/$analysisId_.ritual.tsx`
- `apps/front/src/routes/me/index.tsx`
- `apps/front/src/lib/relationship-letter-ritual-storage.ts`
- `apps/front/src/hooks/useRelationshipSharedNotes.ts`
- `apps/front/src/components/relationship/RelationshipLetterBody.tsx`
- `apps/front/src/components/relationship/RelationshipLetterTraitGrid.tsx`
- `apps/front/src/components/relationship/RelationshipLetterHistory.tsx`
- `apps/front/src/components/relationship/RelationshipLetterNextAnchor.tsx`
- `apps/front/src/components/relationship/RelationshipSharedNotesPanel.tsx`
- `apps/front/src/components/relationship/RelationshipCard.tsx`
- `apps/front/src/components/relationship/RelationshipAnalysesList.tsx`
- `apps/front/src/components/relationship/RitualScreen.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/7-3-relationship-letter-page-living-relational-space.md`

### Review Findings

_First-pass review (2026-04-16): prior decision/patch items were re-verified in HEAD and addressed in code (see `#### BMAD code-review re-run` summary)._

- [x] [Review][Defer] **Unbounded notes per analysis (no insert cap)** — `create-relationship-shared-note.use-case.ts` validates only body length, not total count. A participant could POST unlimited notes, causing unbounded list responses. Pre-existing pattern for MVP; no scalability requirement specified. [`apps/api/src/use-cases/create-relationship-shared-note.use-case.ts:14`]
- [x] [Review][Defer] **`isLatestVersion=true` when no completed result** — `isLatestVersion(resultId, null)` returns `true` vacuously when `getLatestByUserId` returns `null`. The "earlier chapter" banner may be incorrectly suppressed. Pre-existing behavior from Story 36-3, not introduced here. [`apps/api/src/use-cases/get-relationship-analysis.use-case.ts:85`]

## Change Log

- **2026-04-16:** Story 7.3 implemented — living relationship letter page, shared notes API, ritual persistence, tests, and sprint status set to **review**.
- **2026-04-16:** Code review (3-layer adversarial) — 2 decision-needed, 15 patch, 2 deferred, 0 dismissed.
- **2026-04-16:** BMAD code-review re-run — prior items verified fixed in HEAD; 1 new patch, 2 defer, remainder dismissed as addressed or noise.
- **2026-04-16:** Re-review patch applied — visible loading on `opening-ritual` handoff; story marked **done**.

---

#### BMAD code-review re-run (2026-04-16)

**Summary of first-pass closure:** those issues were verified implemented (short-circuit when content null, merged `serializeScoreMap`, `FacetScoreSchema` coupling comment, Back as `<Link>`, blank `content` normalization, notes list/create error handling, textarea `maxLength` + counter, `TraitBar` finite scores, note timestamp fallback, “Relationship letters” copy, `authorUserId` removed from API schema, `useRelationshipSharedNotes` tests, `opening-ritual` gate, live `authorDisplayName` via `UserAccountRepository`, per-trait complementarity copy, `resetRelationshipSharedNoteMockStore` export).

New triage:

- [x] [Review][Patch] **`opening-ritual` shell lacks visible loading affordance** — Addressed: visible `Loader2` + copy in `opening-ritual` branch, `output` with `aria-live` / `aria-busy`. [AC #6] [`apps/front/src/routes/relationship/$analysisId.tsx`]

- [x] [Review][Defer] **`resetRelationshipSharedNoteMockStore` unused by tests** — No test file imports the in-memory notes repository mock; cross-test leakage remains theoretical until the mock is adopted. Call `resetRelationshipSharedNoteMockStore()` from `beforeEach` when that layer is used. [`packages/infrastructure/src/repositories/__mocks__/relationship-shared-note.drizzle.repository.ts:11`]

- [x] [Review][Defer] **E2E for full letter journey** — AC9 allows unit/integration; Playwright coverage of ritual → letter → notes is optional unless QA prioritizes it.

---

**Story completion status:** **done** — open patches from re-review resolved.
