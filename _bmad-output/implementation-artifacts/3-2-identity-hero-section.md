# Story 3.2: Identity Hero Section

Status: done

## Story

As a user on my Me page,
I want to see my archetype, OCEAN code, radar chart, and confidence at the top,
so that my personality identity is immediately visible and celebrated.

## Acceptance Criteria

1. **Given** the Me page is loaded with assessment results **When** the Identity Hero section renders **Then** it displays the user's archetype name using the existing `ArchetypeHeroSection` component.
2. **And** the OCEAN code is rendered using the existing `OceanCodeStrand` component with interactive tooltips.
3. **And** the `PersonalityRadarChart` renders the user's 5 trait scores.
4. **And** the existing `ConfidenceRingCard` shows the assessment confidence level.
5. **And** all hero subcomponents receive data from the same TanStack Query result object sourced from `useGetResults(sessionId)` — no duplicate fetches or secondary queries inside the hero composition.

## Tasks / Subtasks

- [x] Task 1: Build the Me-page identity composition component (AC: 1-5)
  - [x] Create or finish `apps/front/src/components/me/IdentityHeroSection.tsx` as a pure composition component that accepts `results: GetResultsResponse`
  - [x] Do **not** call `useGetResults()` or any other data hook inside `IdentityHeroSection`; the `/me` route owns fetching and passes the query result down
  - [x] Derive `dominantTrait` from `results.traits` via `getDominantTrait()` from `apps/front/src/lib/trait-utils.ts`
  - [x] Normalize `results.overallConfidence` from API scale `0-100` to component scale `0-1` before passing it into `ArchetypeHeroSection` and `ConfidenceRingCard`

- [x] Task 2: Reuse existing results-surface components without reinventing them (AC: 1-4)
  - [x] Render `ArchetypeHeroSection` first, reusing the existing hero component from `apps/front/src/components/results/ArchetypeHeroSection.tsx`
  - [x] Render `OceanCodeStrand` below the hero using `results.oceanCode5`
  - [x] Render `PersonalityRadarChart` and `ConfidenceRingCard` in a `grid grid-cols-1 sm:grid-cols-2 gap-5`
  - [x] Keep the Me page section landmark owned by `MePageSection`; avoid nested landmark confusion by not introducing a second user-facing section heading for the same semantic section

- [x] Task 3: Respect current Me-page layout and styling conventions (AC: 1-5)
  - [x] Keep the composition inside the existing `MePageSection` shell in `apps/front/src/routes/me/index.tsx`
  - [x] Make the hero visually bleed to the section edges using local wrapper spacing only if needed; do not break the `MePageSection` card rhythm used by Story 3.1
  - [x] Preserve existing `data-testid` attributes on the Me page route and sections
  - [x] Use existing Tailwind/data-slot conventions from `docs/FRONTEND.md`; do not replace `data-testid` with `data-slot`

- [x] Task 4: Wire the section in the `/me` route without duplicate queries (AC: 5)
  - [x] In `apps/front/src/routes/me/index.tsx`, keep `useGetResults(sessionId)` as the single source of identity data for the page
  - [x] Render `<IdentityHeroSection results={results} />` inside the `me-section-identity-hero` section when results exist
  - [x] Keep loading and error states in the route, not inside the hero component

- [x] Task 5: Add focused test coverage for composition and route integration (AC: 1-5)
  - [x] Add or update `apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx`
  - [x] Verify the composition renders `ArchetypeHeroSection`, `OceanCodeStrand`, `PersonalityRadarChart`, and `ConfidenceRingCard`
  - [x] Verify `IdentityHeroSection` remains a prop-driven component that can render without React Query providers
  - [x] Update `apps/front/src/routes/-three-space-routes.test.tsx` so the `/me` route still proves the identity section renders from the route-level results query
  - [x] Keep tests out of `apps/front/src/routes/me/` per TanStack Router file-routing rules

### Review Findings

- [x] [Review][Patch] Make `ArchetypeHeroSection` embeddable so `MePageSection` remains the semantic owner [`apps/front/src/components/me/IdentityHeroSection.tsx`:31]
- [x] [Review][Patch] Route test no longer proves `/me` passes the route-level results object into the identity hero [`apps/front/src/routes/-three-space-routes.test.tsx`:61]

## Dev Notes

### Story intent

This story fills the **top section only** of the `/me` page scaffold created in Story 3.1. It is a composition story, not a net-new data or domain story. The implementation should reuse the existing results components and arrange them for the Me page's “identity sanctuary” presentation.

### Previous Story Intelligence

From `3-1-me-page-route-and-section-layout.md`:
- `/me` already resolves `sessionId` in `beforeLoad` using `listConversationsQueryOptions()` and redirects incomplete users back to `/chat`
- `/me` already fetches results via `useGetResults(sessionId)`
- `MePageSection` already owns section semantics, spacing, and test hooks
- Loading and error states already exist at the route level and should remain there
- The account/settings link and 7-section layout are already in place

**Implication for this story:** do not add a second query path, do not introduce a new API surface, and do not bypass `MePageSection`.

### Existing code to reuse

| Concern | Reuse this | Notes |
|---|---|---|
| Me page data source | `apps/front/src/hooks/use-conversation.ts` → `useGetResults(sessionId)` | Single TanStack Query source for the whole page |
| Hero visual shell | `apps/front/src/components/results/ArchetypeHeroSection.tsx` | Already renders archetype name, glyph code, OCEAN letters, optional confidence, description |
| OCEAN explanation card | `apps/front/src/components/results/OceanCodeStrand.tsx` | Already has interactive tooltips and trait-level descriptions |
| Radar chart | `apps/front/src/components/results/PersonalityRadarChart.tsx` | Accepts `traits` array directly |
| Confidence display | `apps/front/src/components/results/ConfidenceRingCard.tsx` | Expects confidence on `0-1` scale |
| Dominant trait derivation | `apps/front/src/lib/trait-utils.ts` | Reuse `getDominantTrait()`; do not duplicate logic |
| Me section shell | `apps/front/src/components/me/MePageSection.tsx` | Owns the outer section heading/landmark |

### Architecture compliance guardrails

- **Frontend data rule:** Use the typed Effect `HttpApiClient` path already wrapped by `useGetResults`; never add raw `fetch`
- **Single-query rule:** Identity Hero must consume the same `GetResultsResponse` object already fetched by `/me`
- **Reuse-over-rebuild rule:** This story composes existing results components; do not fork or clone `ArchetypeHeroSection`, `OceanCodeStrand`, `PersonalityRadarChart`, or `ConfidenceRingCard`
- **No business logic in route rendering:** Only lightweight view composition/normalization belongs here
- **No route-file test placement:** tests must stay in `-three-space-routes.test.tsx` or a sibling `__tests__` folder

### Critical implementation details

#### 1. Confidence scale mismatch is the main footgun

`GetResultsResponse.overallConfidence` comes back from the API on a `0-100` scale, while:
- `ArchetypeHeroSection` does `Math.round(overallConfidence * 100)`
- `ConfidenceRingCard` does `Math.round(confidence * 100)` and `confidence * 360`

So the composition layer must convert:

```ts
const confidenceNormalised = results.overallConfidence / 100;
```

Then pass `confidenceNormalised` to both components.

#### 2. Me page section semantics

`MePageSection` already renders:
- `<section aria-label={title}>`
- the visible `h2`
- standard card spacing and section rhythm

`ArchetypeHeroSection` internally renders its own `<section>`. Avoid introducing duplicate user-facing section headings or extra route-level landmarks around it. Keep the Me page section shell as the semantic owner and treat the hero component as presentational content within it.

#### 3. No duplicate fetching

The `/me` route already does:

```ts
const { data: results, isLoading, error, refetch } = useGetResults(sessionId);
```

The hero component must stay prop-based:

```tsx
<IdentityHeroSection results={results} />
```

Do **not** add:
- a second `useGetResults()` call inside `IdentityHeroSection`
- a custom API helper just for the hero
- per-subcomponent queries

### File structure requirements

**Primary files to touch**
- `apps/front/src/components/me/IdentityHeroSection.tsx`
- `apps/front/src/routes/me/index.tsx`
- `apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx`
- `apps/front/src/routes/-three-space-routes.test.tsx`

**Likely reused but not modified unless required**
- `apps/front/src/components/results/ArchetypeHeroSection.tsx`
- `apps/front/src/components/results/OceanCodeStrand.tsx`
- `apps/front/src/components/results/PersonalityRadarChart.tsx`
- `apps/front/src/components/results/ConfidenceRingCard.tsx`
- `apps/front/src/lib/trait-utils.ts`

### Testing requirements

- Use Vitest + Testing Library
- Mock child components that pull in Recharts or Radix Tooltip when unit-testing `IdentityHeroSection`
- Keep the composition test focused on prop wiring and render presence, not child internals
- Route test should continue proving `/me` renders the identity section for a completed assessment
- Preserve all existing `data-testid` selectors

### Git intelligence summary

Recent commits relevant to this story:
- `4aa634ee feat(front): Story 3.1 — Me page route and section layout (#225)`
- `dd18c4eb fix: update sprint-status.yaml to reflect completion of Epic 10 and associated tasks`
- `4e6deb3a fix(e2e): update locators for renamed farewell link and portrait view`

**What this implies:** the `/me` page scaffold is fresh, tests were recently updated, and this story should be implemented as an incremental continuation of Story 3.1 rather than a redesign.

### Latest codebase intelligence

A current `IdentityHeroSection` implementation already exists in:
- `apps/front/src/components/me/IdentityHeroSection.tsx`

If continuing work from the current branch state, review it before changing anything. It already establishes the correct composition pattern:
- prop-driven `results`
- `getDominantTrait([...results.traits])`
- `results.overallConfidence / 100`
- reuse of the four existing results components

Treat that file as the likely target for completion/refinement, not proof that the story should be reimplemented from scratch.

### Project context reference

- No `project-context.md` file was found in the repository during artifact discovery.
- Frontend conventions come from `docs/FRONTEND.md` and repository rules in `CLAUDE.md`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.2-Identity-Hero-Section]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-3-Me-Page--Identity-Sanctuary]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#152-Me-Page-Specification-me]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#OceanCodeStrand]
- [Source: _bmad-output/planning-artifacts/architecture.md#Component-Boundaries]
- [Source: docs/FRONTEND.md#Data-Fetching]
- [Source: docs/FRONTEND.md#Testing-with-Data-Attributes]
- [Source: _bmad-output/implementation-artifacts/3-1-me-page-route-and-section-layout.md]
- [Source: apps/front/src/routes/me/index.tsx]
- [Source: apps/front/src/components/me/MePageSection.tsx]
- [Source: apps/front/src/components/me/IdentityHeroSection.tsx]
- [Source: apps/front/src/components/results/ArchetypeHeroSection.tsx]
- [Source: apps/front/src/components/results/OceanCodeStrand.tsx]
- [Source: apps/front/src/components/results/PersonalityRadarChart.tsx]
- [Source: apps/front/src/components/results/ConfidenceRingCard.tsx]
- [Source: apps/front/src/hooks/use-conversation.ts]
- [Source: apps/front/src/lib/trait-utils.ts]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `pnpm vitest run apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx apps/front/src/routes/-three-space-routes.test.tsx`
- `pnpm --filter front typecheck`
- `pnpm exec biome check vitest.setup.ts apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx apps/front/src/routes/-three-space-routes.test.tsx apps/front/src/components/me/IdentityHeroSection.tsx apps/front/src/routes/me/index.tsx`

### Completion Notes List

- Completed the Me-page identity hero composition by wiring `IdentityHeroSection` into `/me` while keeping `useGetResults(sessionId)` as the route-owned single query source.
- Reused `ArchetypeHeroSection`, `OceanCodeStrand`, `PersonalityRadarChart`, and `ConfidenceRingCard`, with dominant trait derived via `getDominantTrait()` and confidence normalized from `0-100` to `0-1` before prop handoff.
- Preserved the `MePageSection` semantic shell, existing `data-testid` hooks, and the Story 3.1 card rhythm while allowing the hero content to bleed to section edges.
- Added focused composition assertions for child-component wiring and route integration coverage for the `/me` identity section.
- Added universal root Vitest DOM matcher setup so jsdom tests using `toBeInTheDocument()` and `toHaveAttribute()` pass consistently from the repo root.
- Validation completed with targeted Vitest, frontend typecheck, and changed-file Biome checks. A full `pnpm --filter front check` still reports pre-existing unrelated diagnostics elsewhere in the frontend package.

### File List

- `_bmad-output/implementation-artifacts/3-2-identity-hero-section.md`
- `apps/front/src/components/me/IdentityHeroSection.tsx`
- `apps/front/src/components/me/__tests__/IdentityHeroSection.test.tsx`
- `apps/front/src/lib/trait-utils.ts`
- `apps/front/src/routes/-three-space-routes.test.tsx`
- `apps/front/src/routes/me/index.tsx`
- `vitest.setup.ts`

### Change Log

- 2026-04-13: Completed Story 3.2 identity hero composition, route wiring, and focused test coverage; moved story to `review`.
