# Story 6.1: Circle Page & Person Cards

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created -->

## Story

As a user,

I want to see the people I care about on my Circle page,

So that I can access my relationship letters and feel connected to my closest people.

## Acceptance Criteria

1. **Given** an authenticated user with a completed assessment navigates to `/circle` **When** the Circle page renders **Then** each connected person is displayed as a **full-width** `CirclePersonCard` showing: **partner display name** (use `partnerName` from the list API), **partner archetype name**, **OCEAN code** (5-letter semantic code, derive-at-read — same source as archetype), **duration** line: *Understanding each other since [Month Year]* (from relationship establishment — use **`createdAt`** on the analysis row per data available today), **“last shared”** recency (see Dev Notes — presence-oriented, not activity metrics), and **“View your dynamic →”** as an internal **`<Link>`** to `/relationship/$analysisId` with `params={{ analysisId }}` (not raw `<a>`, not `navigate()` for this affordance).
2. **And** cards are shown in **organic order**: **oldest relationship first** — sort by `createdAt` **ascending** on the client (or align repository ordering — see Tasks) so the list does **not** feel ranked, filtered, or “most recent first.”
3. **And** **no** aggregate count metrics on this page (“X connections”, view counters, attribution). **No** follower / friend / fan language anywhere on `/circle`.
4. **And** the **Intimacy Principle** empty state when there are **no** analyses: **“Big Ocean is made for the few people you care about. This is where they’ll live.”** (exact two-sentence copy from [Source: `_bmad-output/planning-artifacts/epics.md` — Story 6.1]; distinct from the Me preview single-line empty copy).
5. **And** **BottomNav** shows the **Circle** tab as active on `/circle` (existing `BottomNav` + `ThreeSpaceLayout` — verify `data-state=active` on circle tab).
6. **And** loading / error states are **non-blocking** and consistent with other three-space pages (muted skeleton or copy; optional retry — mirror `YourCirclePreviewSection` patterns where sensible).

## Tasks / Subtasks

### Task 1 — Contract & API: list payload completeness (AC: 1)

- [x] **1.1** Extend `RelationshipAnalysisListItem` in [packages/contracts/src/http/groups/relationship.ts](packages/contracts/src/http/groups/relationship.ts) with:
  - **`partnerOceanCode: string`** — `generateOceanCode(facetScoresMap)` (5-letter semantic code), derived in the same pass as `partnerArchetypeName` from the partner’s locked result row. Fail-open to a safe placeholder (e.g. `"?????"` or empty policy — align with archetype fail-open) if facets are missing.
  - **`contentCompletedAt: string | null`** — ISO 8601 **nullable**. When the relationship letter content has never been written, `null`. When content exists, the timestamp of **first successful content write** (see Task 2).
- [x] **1.2** Update [apps/api/src/use-cases/list-relationship-analyses.use-case.ts](apps/api/src/use-cases/list-relationship-analyses.use-case.ts): enrich each row with `partnerOceanCode` (reuse facet map already built for archetype; add `generateOceanCode` next to `lookupArchetype(extract4LetterCode(...))`). Map `contentCompletedAt` from domain row.
- [x] **1.3** Keep handlers thin — [apps/api/src/handlers/relationship.ts](apps/api/src/handlers/relationship.ts) unchanged except types if needed.
- [x] **1.4** Update [apps/api/src/use-cases/__tests__/list-relationship-analyses.use-case.test.ts](apps/api/src/use-cases/__tests__/list-relationship-analyses.use-case.test.ts) and mocks.

### Task 2 — DB & repository: `content_completed_at` (AC: 1, “last shared”)

- [x] **2.1** Append a **new** Drizzle migration (never edit an old migration): add nullable `content_completed_at` timestamptz on `relationship_analyses`.
- [x] **2.2** Update [packages/infrastructure/src/db/drizzle/schema.ts](packages/infrastructure/src/db/drizzle/schema.ts) and [packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts](packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts): on **`updateContent`** (first time `content` becomes non-null), set **`content_completed_at = now()`** (or DB default). Domain type + `mapRow` in [packages/domain/src/types/relationship.types.ts](packages/domain/src/types/relationship.types.ts) (and repository interface) must carry the field.
- [x] **2.3** Update [packages/infrastructure/src/repositories/__mocks__/relationship-analysis.drizzle.repository.ts](packages/infrastructure/src/repositories/__mocks__/relationship-analysis.drizzle.repository.ts) and any fixtures.
- [x] **2.4** **“Last shared” UI:** On the card, if `contentCompletedAt` is set, show a single line such as **Last shared: [relative time]** using `Intl.RelativeTimeFormat` or a small local helper (avoid new date library unless already in app). If `null` but `hasContent` is true (edge), fall back to `createdAt`; if still generating (`!hasContent`), omit or show a muted **Letter still opening…** line — pick one consistent rule and document in component.

### Task 3 — Frontend: `CirclePersonCard` + Circle route (AC: 1–6)

- [x] **3.1** Add **`CirclePersonCard`** under `apps/front/src/components/circle/` (page-specific; not `packages/ui` unless you later promote). Props should align with [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — CirclePersonCard]: full-width card, warm typography, **GeometricSignature** mini + OCEAN letters — reuse [@workspace/ui/components/geometric-signature](packages/ui/src/components/geometric-signature.tsx) with `size="mini"` or `"card"` (see [apps/front/src/components/me/IdentityHeroSection.tsx](apps/front/src/components/me/IdentityHeroSection.tsx) for reference).
- [x] **3.2** Replace placeholder body in [apps/front/src/routes/circle/index.tsx](apps/front/src/routes/circle/index.tsx): use **`useRelationshipAnalysesList(true)`** — **only** `makeApiClient` / `@workspace/contracts` ([CLAUDE.md](CLAUDE.md)).
- [x] **3.3** **Sort** analyses **ascending** by `createdAt` before map (AC 2). **Do not** show a total count on the page (AC 3).
- [x] **3.4** **Duration** line: format `createdAt` to **“Understanding each other since [Month Year]”** (locale-aware month/year).
- [x] **3.5** **Accessibility:** Card meets UX-DR15: meaningful **`aria-label`** summarizing partner + archetype (or use heading + link pattern per [docs/FRONTEND.md](docs/FRONTEND.md)).
- [x] **3.6** Add **new** stable `data-testid` hooks (e.g. `circle-person-card`, `circle-person-dynamic-link`) — **do not** remove or rename existing `circle-page` / section ids used elsewhere.
- [x] **3.7** **Out of scope for 6.1:** `InviteCeremonyCard` / `InviteCeremonyDialog` — that is **Story 6.2**; do not implement the invite ceremony in this story.

### Task 4 — Tests

- [x] **4.1** Unit/component tests for `CirclePersonCard` under `apps/front/src/components/circle/__tests__/` (not under `routes/`).
- [x] **4.2** Cover: empty state exact copy; non-empty → link target `/relationship/:id`; no count string on page.
- [x] **4.3** Run `pnpm typecheck` and scoped tests for touched packages.

### Review Findings

- [x] [Review][Patch] `"?????"` OCEAN placeholder renders empty `GeometricSignature` glyphs — hide signature when code is `UNKNOWN_OCEAN_CODE` [apps/front/src/components/circle/CirclePersonCard.tsx:~36-40]
- [x] [Review][Patch] Circle error copy does not mirror `YourCirclePreviewSection` wording — align to "Your Circle is taking a moment to load." [apps/front/src/components/circle/CirclePageContent.tsx:~49]
- [x] [Review][Defer] `hasContent === true` with `contentCompletedAt === null` falls back to `createdAt` — deferred, pre-existing; rows completed before migration will have null; fallback is intentional and tested
- [x] [Review][Defer] `formatLastSharedRelative` uses approximate 30/365-day unit constants — deferred, pre-existing; calendar-precise relative time would require a date library; cosmetic inaccuracy at boundaries only

## Dev Notes

### Epic & UX

- **Epic 6** ([_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)): Circle full page + Intimacy Principle; **FR97–FR100**; **UX-DR15** (CirclePersonCard), **UX-DR16** is invite dialog (**6.2**).
- Full UX component contract: [_bmad-output/planning-artifacts/ux-design-specification.md](_bmad-output/planning-artifacts/ux-design-specification.md) — CirclePersonCard section (~L3831). **No** avatar grid; **no** sort/filter UI; **no** “last active” online indicator.

### Architecture compliance

| Rule | Detail |
|------|--------|
| API client | `makeApiClient` + `@workspace/contracts` only — no raw `fetch` |
| Navigation | TanStack Router `<Link>` for internal routes |
| Derive-at-read | OCEAN + archetype from **partner** facet scores on locked result — **no** stored OCEAN aggregates |
| Business logic | Use-cases + repositories — **not** HTTP handlers |
| Migrations | **Append-only** new SQL file; update seeds/fixtures if constraints affect local dev |

### File structure (expected touchpoints)

```
packages/contracts/src/http/groups/relationship.ts
packages/domain/src/types/relationship.types.ts
packages/domain/src/repositories/relationship-analysis.repository.ts  # if interface changes
packages/infrastructure/src/db/drizzle/schema.ts
packages/infrastructure/drizzle/*.sql  # NEW migration only
packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts
packages/infrastructure/src/repositories/__mocks__/relationship-analysis.drizzle.repository.ts
apps/api/src/use-cases/list-relationship-analyses.use-case.ts
apps/api/src/use-cases/__tests__/list-relationship-analyses.use-case.test.ts
apps/front/src/components/circle/CirclePersonCard.tsx
apps/front/src/components/circle/__tests__/...
apps/front/src/routes/circle/index.tsx
```

### Ordering note (AC 2)

- Repository `listByUserId` currently uses **`orderBy(desc(createdAt))`** ([packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts](packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts)). **Me** page preview ([YourCirclePreviewSection](apps/front/src/components/me/YourCirclePreviewSection.tsx)) relies on list order for its “up to 3” chips. **Prefer** client-side **asc** sort **only on `/circle`** in this story to avoid changing preview behavior; optionally add a follow-up to align API order with product-wide semantics.

### Previous story intelligence (3.6)

From [_bmad-output/implementation-artifacts/3-6-your-circle-preview-and-account-link.md](_bmad-output/implementation-artifacts/3-6-your-circle-preview-and-account-link.md):

- **`GET /relationship/analyses`** already returns `partnerName`, `partnerArchetypeName`, `createdAt`, `hasContent`, etc. Extend rather than duplicating fetches.
- **Fail-open** enrichment patterns and **bounded concurrency** — keep the same discipline when adding OCEAN derivation.
- **Me** preview may show **“N connections”** — **Circle page must not** show that aggregate (epics AC); do not copy the preview count line onto `/circle`.

### Git intelligence (recent)

- Recent work: **Your Circle preview** (`feat(me): Your Circle preview and partner context on relationship list`) — reuse hooks and API patterns; **Circle page** is the full **non-compact** treatment with stricter **no count** rule.

### Latest tech notes

- **Effect / HttpApiClient:** Follow existing [apps/front/src/lib/api-client.ts](apps/front/src/lib/api-client.ts) patterns.
- **Ocean code:** `generateOceanCode` / `extract4LetterCode` / `lookupArchetype` from `@workspace/domain` — same as list archetype path.

### Project context reference

- No `project-context.md` in repo; rely on [CLAUDE.md](CLAUDE.md), [docs/FRONTEND.md](docs/FRONTEND.md), and architecture excerpts above.

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- `pnpm vitest run apps/api/src/use-cases/__tests__/list-relationship-analyses.use-case.test.ts`
- `pnpm vitest run apps/front/src/components/circle/__tests__/CirclePersonCard.test.tsx apps/front/src/components/circle/__tests__/circle-relationship-copy.test.ts apps/front/src/components/circle/__tests__/circle-empty-messages.test.ts apps/front/src/components/circle/__tests__/CirclePageContent.test.tsx apps/front/src/components/me/__tests__/YourCirclePreviewSection.test.tsx`
- `pnpm typecheck`
- `pnpm test:run`

### Implementation Plan

- Extend the relationship list contract and use-case so Circle can render partner OCEAN code and a stable last-shared timestamp without adding a second fetch.
- Persist `content_completed_at` on first relationship-letter completion and thread it through repository, handler, and frontend display helpers.
- Build the Circle UI as a tested page-content component plus `CirclePersonCard`, keeping `/circle` count-free and sorted oldest-first only in the Circle view.

### Completion Notes List

- Added `partnerOceanCode` and `contentCompletedAt` to the relationship analyses API, with fail-open derivation for missing partner results.
- Added `content_completed_at` schema + migration support and updated repository implementations/mocks to preserve first completion time.
- Implemented `CirclePersonCard`, Circle copy helpers, and `CirclePageContent`; `/circle` now renders full-width cards, exact empty-state copy, oldest-first ordering, and no aggregate count language.
- Added/updated backend and frontend tests covering API shape, helper formatting, card rendering, empty state, sorting, and link targets.
- Verified with `pnpm typecheck` and full `pnpm test:run`.

### File List

- `apps/api/src/handlers/relationship.ts`
- `apps/api/src/use-cases/__tests__/list-relationship-analyses.use-case.test.ts`
- `apps/api/src/use-cases/list-relationship-analyses.use-case.ts`
- `apps/front/src/components/circle/CirclePageContent.tsx`
- `apps/front/src/components/circle/CirclePersonCard.tsx`
- `apps/front/src/components/circle/__tests__/CirclePageContent.test.tsx`
- `apps/front/src/components/circle/__tests__/CirclePersonCard.test.tsx`
- `apps/front/src/components/circle/__tests__/circle-empty-messages.test.ts`
- `apps/front/src/components/circle/__tests__/circle-relationship-copy.test.ts`
- `apps/front/src/components/circle/circle-empty-messages.ts`
- `apps/front/src/components/circle/circle-relationship-copy.ts`
- `apps/front/src/components/me/__tests__/YourCirclePreviewSection.test.tsx`
- `apps/front/src/routes/circle/index.tsx`
- `drizzle/20260416120000_relationship_analyses_content_completed_at/migration.sql`
- `packages/contracts/src/http/groups/relationship.ts`
- `packages/domain/src/types/relationship.types.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/repositories/__mocks__/relationship-analysis.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts`

## Change Log

- 2026-04-15: Implemented Story 6.1 Circle page and person cards; extended relationship analyses payload with partner OCEAN code and completion timestamp, added Circle UI/helpers/tests, and verified with repo typecheck plus full test suite.

## Story completion status

- **review** — Implementation complete, validations passed, and story is ready for code review.

### Open questions (saved for product if needed)

- Whether **global** API list order should eventually be **asc** for all consumers vs **Circle-only** sort (see Ordering note).
