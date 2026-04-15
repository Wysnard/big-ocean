# Story 3.6: Your Circle Preview & Account Link

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created -->

## Story

As a user on my Me page,

I want a preview of my Circle and quick access to account settings,

So that I can see who is in my circle and manage my account.

## Acceptance Criteria

1. **Given** the Me page renders **When** the **Your Circle** section is visible **Then** it shows a **compact preview** of the user’s circle: **partner archetype display names** (one per relationship the user participates in) and a **count** of those relationships (e.g. “2 connections” — wording should feel intimate, not social-metrics; avoid “followers” / leaderboard language).
2. **And** a **“View all →”** control navigates to **`/circle`** using TanStack Router **`<Link>`** (not raw `<a>` or `navigate()` for this affordance).
3. **And** if the user has **no** relationship analyses yet, the section shows the **exact** empty-state line: **“Big Ocean is made for the few people you care about”** (per [Source: `_bmad-output/planning-artifacts/epics.md` — Story 3.6] and UX Intimacy Principle).
4. **And** **at the bottom of the page**, the **gear icon** links to **`/settings`** with **`data-testid="me-settings-link"`** preserved ([CLAUDE.md](CLAUDE.md) — never remove/rename e2e `data-testid` attributes).
5. **And** the gear is styled as a **subtle footer affordance**, not a heavy “Account” marketing block — refactor away from the current large bordered `MePageSection` + body copy if needed, while keeping tests and accessibility coherent (see Dev Notes).

## Tasks / Subtasks

### Task 1 — Backend: partner context on relationship list (AC: 1)

The existing `GET /relationship/analyses` payload exposes `userAName` / `userBName` but **not** which participant is the current user, and it has **no** archetype. The Me preview needs **deterministic partner identity** and **derive-at-read archetype** (same pipeline as `getResults`).

- [x] **1.1** Add **`AssessmentResultRepository.getById(resultId: string)`** in [packages/domain/src/repositories/assessment-result.repository.ts](packages/domain/src/repositories/assessment-result.repository.ts), implemented in [packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts](packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts) and [packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts](packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts).
- [x] **1.2** Extend **`RelationshipAnalysisListItem`** in [packages/contracts/src/http/groups/relationship.ts](packages/contracts/src/http/groups/relationship.ts) with:
  - **`partnerName: string`** — display name of the **other** participant (`userId === userAId` → `userBName`, else `userAName`).
  - **`partnerArchetypeName: string`** — `lookupArchetype(extract4LetterCode(generateOceanCode(facetScoresMap))).name` from the **partner’s** locked result row (`userAResultId` / `userBResultId` chosen to match partner). Reuse domain utilities already used in [apps/api/src/use-cases/get-results.use-case.ts](apps/api/src/use-cases/get-results.use-case.ts) (`generateOceanCode`, `extract4LetterCode`, `lookupArchetype`, `FacetScoresMap` construction from persisted facets).
- [x] **1.3** Update [apps/api/src/use-cases/list-relationship-analyses.use-case.ts](apps/api/src/use-cases/list-relationship-analyses.use-case.ts): after loading analyses, for each row resolve partner result id, `getById`, build facet map, derive archetype; **fail-open** on missing/empty facets (log + fallback string such as **“Unknown”** or partner name only — **do not** throw 500 for preview).
- [x] **1.4** Update [apps/api/src/use-cases/__tests__/list-relationship-analyses.use-case.test.ts](apps/api/src/use-cases/__tests__/list-relationship-analyses.use-case.test.ts) and any contract consumers.
- [x] **1.5** Keep **handlers thin** — no new business logic in [apps/api/src/handlers/relationship.ts](apps/api/src/handlers/relationship.ts) beyond typing.

### Task 2 — Frontend: `YourCirclePreviewSection` + wire Me route (AC: 1–3)

- [x] **2.1** Add **`YourCirclePreviewSection`** (or equivalent) under [apps/front/src/components/me/](apps/front/src/components/me/), using **`useRelationshipAnalysesList(true)`** from [apps/front/src/hooks/useRelationshipAnalysesList.ts](apps/front/src/hooks/useRelationshipAnalysesList.ts) — **HttpApiClient / `makeApiClient` only**, no raw `fetch`** ([CLAUDE.md](CLAUDE.md)).
- [x] **2.2** Replace placeholder copy in [apps/front/src/routes/me/index.tsx](apps/front/src/routes/me/index.tsx) inside **`data-testid="me-section-circle"`** / `data-slot="me-section-circle"` with the new component.
- [x] **2.3** **Compact preview UX:** show up to **3** partner archetype names (or “The …” strings from API); if more, append **“+N”** or similar restrained copy. Show **relationship count** aligned with list length.
- [x] **2.4** **“View all →”** as `<Link to="/circle">` — [apps/front/src/routes/circle/index.tsx](apps/front/src/routes/circle/index.tsx) is a shell today (Epic 6 will deepen it); linking must still work.
- [x] **2.5** **Loading / error:** muted skeleton or single-line placeholder inside the section; non-blocking retry consistent with Subscription / Public Face patterns.
- [x] **2.6** Add **new** stable `data-testid` values for inner surfaces (e.g. `me-circle-preview`, `me-circle-view-all-link`) — **do not** remove or rename existing section ids.

### Task 3 — Account footer refactor (AC: 4–5)

- [x] **3.1** Replace the prominent **Account** `MePageSection` card with a **subtle bottom strip** (e.g. `border-t`, reduced padding, no duplicate marketing paragraph) while keeping **`data-testid="me-section-account"`** and **`me-settings-link`** for [apps/front/src/routes/-three-space-routes.test.tsx](apps/front/src/routes/-three-space-routes.test.tsx).
- [x] **3.2** Update **`MePageSkeleton`** in the same file so the loading state matches the new Account layout (still exposes busy account test id if tests rely on it — verify).

### Task 4 — Tests

- [x] **4.1** Component tests under [apps/front/src/components/me/__tests__/](apps/front/src/components/me/__tests__/) (not under `routes/me/`).
- [x] **4.2** Cover: empty list → exact empty-state string; non-empty → archetype names + count + View all link.
- [x] **4.3** Run `pnpm typecheck` and scoped Vitest for touched packages.

### Review Findings

- [x] [Review][Patch] "0 connections" shown during loading and empty states — `formatRelationshipCount(analyses?.length ?? 0)` always renders above the empty-state copy and during loading; hide the count when `isLoading` or when list is empty [apps/front/src/components/me/YourCirclePreviewSection.tsx:20-22]
- [x] [Review][Patch] `lookupArchetype`/`extract4LetterCode` can throw inside `Effect.map` — wrap derivation in `Effect.try` or guard with try/catch to fall back to `UNKNOWN_ARCHETYPE_NAME` [apps/api/src/use-cases/list-relationship-analyses.use-case.ts:~108-111]
- [x] [Review][Patch] `result.facets` could be nullish — add null guard before `Object.keys(result.facets)` to prevent TypeError [apps/api/src/use-cases/list-relationship-analyses.use-case.ts:~86]
- [x] [Review][Patch] Unbounded `concurrency: "unbounded"` on per-analysis enrichment — cap to a bounded value (e.g. 10) [apps/api/src/use-cases/list-relationship-analyses.use-case.ts:~135]
- [x] [Review][Defer] No `stage === "completed"` check on partner result before deriving archetype — deferred, pre-existing; FK set at analysis creation time always points to completed result; fail-open handles edge cases
- [x] [Review][Defer] Redundant `getById` calls for the same `partnerResultId` across multiple analyses — deferred, optimization opportunity for future; correctness unaffected

## Dev Notes

### Epic & UX context

- **Epic 3** ([_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)): Me page **Your Circle** preview + **Account** affordance; **Intimacy Principle** — no vanity metrics, no social-proof numbers (relationship **count** here is an intimate “who’s in your circle” summary, not a public leaderboard).
- **UX** ([_bmad-output/planning-artifacts/ux-design-specification.md](_bmad-output/planning-artifacts/ux-design-specification.md)): Me includes Circle preview with **“View all →”**; empty Circle teaches values with the same line as in epics; **gear → `/settings`** is the thin admin entry, not a fourth tab.

### Critical guardrails

| Rule | Detail |
|------|--------|
| API client | `makeApiClient` + `@workspace/contracts` only |
| Navigation | `<Link>` to `/circle` and `/settings` |
| Derive-at-read | Archetype from **facet scores** on the partner’s **locked** result row — **no** stored archetype aggregates |
| `data-testid` | Never remove/rename `me-section-*` or `me-settings-link` |
| Handlers | No business logic in HTTP handlers |

### Architecture compliance

- **Hexagonal:** New derivation stays in **use-case** / domain helpers; repository gains **`getById`** only as a data port.
- **Error propagation:** Follow existing patterns; preview path should **fail-open** for enrichment.

### File structure (expected touchpoints)

```
packages/contracts/src/http/groups/relationship.ts     # list item schema
packages/domain/src/repositories/assessment-result.repository.ts
packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts
packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts
apps/api/src/use-cases/list-relationship-analyses.use-case.ts
apps/api/src/use-cases/__tests__/list-relationship-analyses.use-case.test.ts
apps/front/src/hooks/useRelationshipAnalysesList.ts   # types only if hook unchanged
apps/front/src/components/me/YourCirclePreviewSection.tsx   # NEW
apps/front/src/components/me/__tests__/…              # NEW
apps/front/src/routes/me/index.tsx
```

### Testing requirements

- Vitest + Testing Library; `vi.mock` import order per [CLAUDE.md](CLAUDE.md).
- Update route tests if Account DOM structure changes but **selectors** must remain valid.

### Previous story intelligence (3.5)

From [_bmad-output/implementation-artifacts/3-5-subscription-pitch-section.md](_bmad-output/implementation-artifacts/3-5-subscription-pitch-section.md):

- Me page uses **`useGetResults(sessionId)`** as the **single** results source for portrait/identity — **this story** adds a **separate** query for relationship analyses; do **not** duplicate results fetches for circle data.
- **`MePageSection`** spacing and typography should stay visually coherent with **Subscription** and **Your Public Face**.

### Git intelligence (recent)

- Recent work: Me subscription pitch (`feat(front): Me page subscription pitch section`), public face / share flows — follow established **`components/me/`** patterns and polar/checkout boundaries where relevant (this story does not touch checkout).

### Latest tech notes

- TanStack Router **file routes**: do not add test files directly under `routes/me/`; use `-` prefix or `__tests__` sibling.
- **`/circle`** route exists; preview is forward-compatible with Epic 6 Circle page work.

### Project context reference

- [CLAUDE.md](CLAUDE.md) — HttpApiClient, navigation, `data-testid` policy.
- [docs/FRONTEND.md](docs/FRONTEND.md) — Me page styling patterns.

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Implementation Plan

- Extend the relationship analysis list payload with partner-focused fields derived from the locked assessment result.
- Keep the frontend fetch path unchanged by reusing `useRelationshipAnalysesList(true)` and rendering a dedicated Me-page preview component.
- Refactor the account area into a footer affordance while preserving the existing `data-testid` selectors and route coverage.

### Debug Log References

- 2026-04-15T13:30:06+02:00 — Confirmed red phase failures in targeted API and frontend tests before implementation.
- 2026-04-15T13:32:25+02:00 — `pnpm --filter api exec vitest run "src/use-cases/__tests__/list-relationship-analyses.use-case.test.ts"`
- 2026-04-15T13:32:26+02:00 — `pnpm --filter front exec vitest run "src/components/me/__tests__/YourCirclePreviewSection.test.tsx" "src/routes/-three-space-routes.test.tsx"`
- 2026-04-15T13:33:12+02:00 — `pnpm typecheck`
- 2026-04-15T13:33:12+02:00 — `pnpm test:run`

### Completion Notes List

- Added `AssessmentResultRepository.getById` in domain, Drizzle, and mock repositories to support derive-at-read partner enrichment.
- Extended the relationship analyses list use-case and HTTP contract with `partnerName` and `partnerArchetypeName`, with fail-open logging/fallback to `"Unknown"` when partner result enrichment is unavailable.
- Added `YourCirclePreviewSection` on `/me`, showing count, up to three partner archetype chips, `+N` overflow, the exact empty-state copy, and a `/circle` link.
- Refactored the Me-page account area from a full card into a subtle footer strip while preserving `me-section-account` and `me-settings-link`.
- Added focused frontend and API tests and verified the changes with targeted Vitest runs, repo typecheck, and the full test suite.

### File List

- `packages/domain/src/repositories/assessment-result.repository.ts`
- `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/assessment-result.drizzle.repository.ts`
- `packages/contracts/src/http/groups/relationship.ts`
- `apps/api/src/use-cases/list-relationship-analyses.use-case.ts`
- `apps/api/src/use-cases/__tests__/list-relationship-analyses.use-case.test.ts`
- `apps/front/src/components/me/YourCirclePreviewSection.tsx`
- `apps/front/src/components/me/__tests__/YourCirclePreviewSection.test.tsx`
- `apps/front/src/routes/me/index.tsx`
- `apps/front/src/routes/-three-space-routes.test.tsx`

### Change Log

- 2026-04-15: Implemented Story 3.6 by enriching relationship list responses with partner archetype data, adding the Me-page Circle preview section, and refactoring the account footer affordance.

## Story completion status

- **Status:** review
- **Note:** All story tasks are complete. Targeted API/frontend tests, `pnpm typecheck`, and `pnpm test:run` passed successfully.
