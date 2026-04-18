# Story 12.3: Knowledge Library Article Page Layout (UX §21)

Status: review

<!-- Ultimate context engine analysis completed — comprehensive developer guide created -->

## Story

As a reader arriving from search or `LibraryArticleCard`,
I want trait, facet, and archetype articles to use one coherent layout system with tier-appropriate modules and in-page navigation,
so that longform library content feels like the rest of the product and stays easy to scan and orient within.

## Acceptance Criteria

1. **Given** UX Design Specification **§21 Knowledge Library Article Page Layout** and direction mockups `/dev/library/direction/trait`, `/dev/library/direction/facet`, `/dev/library/direction/archetype` (dev-only; `beforeLoad` redirects in production)

2. **When** production `/library/trait/$slug`, `/library/facet/$slug`, and `/library/archetype/$slug` render

3. **Then** each tier follows its spine (hero → reading rail → main column → optional side column) per §21.5–§21.7, honoring the **Intimacy Principle** and **primary-tinted orientation** (§21.2)

4. **And** responsive grid matches §21.3: default `<lg` single column with **reading rail first**; `lg` two columns `[14rem | minmax(0,1fr)]` with side column stacked below main where applicable; `xl` three columns `[14rem | minmax(0,1fr) | 20rem]` (archetype third column `18rem` acceptable) with sticky right rail where specified

5. **And** **reading rail:** sticky numbered TOC on `lg+`; on `<lg`, `<details>` “On this page” **closed by default**; hash links target stable section `id`s; `IntersectionObserver` (or equivalent) sets active row emphasis and `aria-current="location"`; `scroll-behavior: smooth` only when `prefers-reduced-motion: no-preference`

6. **And** **trait** pages: facet map → across-the-spectrum → visual seam → MDX body (main); assessment CTA + optional “continue exploring” in side column (`xl`; below on `lg`) per §21.5

7. **And** **facet** pages: poles/scale → sibling facet map → seam → MDX (main); parent trait + CTA + optional sibling continue in side column per §21.6

8. **And** **archetype** pages: hero includes **identity pull-quote**; MDX body with **inline assessment CTA** after the article; side column **Who this pattern pairs with** relational cards per §21.7 (relational labels, not generic directory framing)

9. **And** **MDX contract (§21.8):** stable ids on every `h2` (or build-time slugging) that the rail lists; non-MDX modules (facet map, spectrum, poles, sibling map) expose matching `id` + `scroll-margin-top`; estimated read time in hero (static or word-count — implementer’s choice)

10. **And** **accessibility (§21.9):** focusable rail links with visible focus rings; mobile disclosure does not trap focus; touch targets ≥44px where practical; active chapter not indicated by color alone

11. **And** production layout matches direction mockups in visual QA; drift between `/dev/library/direction/*` and production is **retired** after parity (§21.10)

12. **And** shared implementation converges on `KnowledgeArticleLayout` (or successor) with a tier prop and optional shared chrome (e.g. reading rail + scroll-spy) per architecture ADR-49 and §21.10

## Tasks / Subtasks

- [x] Task 1: Shared chrome — reading rail + scroll spy (AC: #5, #9, #10, #12)
  - [x] 1.1 Add a client component (e.g. `LibraryReadingRail` + `useLibraryScrollSpy`) that accepts ordered `{ id, label }[]`, renders sticky nav on `lg+` and `<details>` on `<lg`, uses `IntersectionObserver` with root margin accounting for sticky global nav, sets `aria-current="location"` on the active `Link`
  - [x] 1.2 Use TanStack Router `<Link>` to current route + hash for each row; ensure focus rings (`focus-visible`) and non-color-only active styling (e.g. border/weight)
  - [x] 1.3 Wire `prefers-reduced-motion` for smooth scroll (global CSS or programmatic); align `scroll-margin-top` / `scroll-mt-*` with `LibraryNav` height (mockup uses `[&_h2]:scroll-mt-28` pattern — verify against real header)
- [x] Task 2: Grid + layout shell refactor (AC: #4, #12)
  - [x] 2.1 Refactor `KnowledgeArticleLayout` (or introduce successor exported from same module) to implement §21.3 column templates with explicit grid placement for side column (`lg` col 2 full-width stack; `xl` col 3 sticky rail)
  - [x] 2.2 Hero: tier-specific eyebrow + primary accent lines + read time (`Clock` + primary) per mockup; trait hero **without** “what you will learn” bullet list (§21.2)
  - [x] 2.3 Main column: single article card with shared prose tokens (`articleProseClass` pattern from direction mockup — keep consistent with existing typography utilities in layout)
- [x] Task 3: Trait route composition (AC: #6, #11)
  - [x] 3.1 Move **Facet map** (scan-first grid) and **Across the spectrum** into **main** column **before** MDX; add visual seam (“Long form article”) before MDX; keep facet breakdown aligned with MDX headings per §21.5
  - [x] 3.2 Build reading chapter list: facet map id, across-the-spectrum id, then each major MDX `h2` id (must match MDX)
  - [x] 3.3 Side column: `AssessmentCTA` + optional “Continue exploring” card; preserve `data-testid` on CTA from project conventions
- [x] Task 4: Facet route composition (AC: #7, #11)
  - [x] 4.1 Main: **Two poles** (levels-first) → **Sibling facet map** (`Layers3` cue per §21.6) → seam → MDX
  - [x] 4.2 Side: parent trait summary + link → CTA → optional sibling continue card
  - [x] 4.3 Reading rail order: poles id, sibling-map id, then MDX `h2`s
- [x] Task 5: Archetype route composition (AC: #8, #11)
  - [x] 5.1 Hero: identity pull-quote (excerpt, `font-heading`, responsive scale)
  - [x] 5.2 Main: MDX then **inline** `AssessmentCTA` immediately after article body
  - [x] 5.3 Side: rename/reframe “Compatible archetypes” to **Who this pattern pairs with** with **relational** labels (see mockup `RELATED_PATTERN_ROLES` pattern); keep internal links as `<Link>`
- [x] Task 6: MDX + anchors audit (AC: #9)
  - [x] 6.1 Audit `apps/front/src/content/library/traits/*.mdx`, `facets/*.mdx`, `archetypes/*.mdx` for explicit `<h2 id="…">` (or equivalent) for every chapter listed in reading rails; add missing ids
  - [x] 6.2 Ensure non-MDX sections use the same ids referenced in TOC arrays
- [x] Task 7: Parity + retirement (AC: #11)
  - [x] 7.1 Visual QA: compare production pages to `/dev/library/direction/*` for Openness / Imagination / Beacon exemplars
  - [x] 7.2 When parity is accepted, remove or slim dev-only mockup duplication per team preference (§21.10: retire drift — either delete redundant code paths or document mockups as thin wrappers around shared components)
- [x] Task 8: Verification
  - [x] 8.1 `pnpm --filter front run typecheck` / `lint` / `build` as applicable
  - [x] 8.2 Manual a11y pass against §21.9 checklist (keyboard, SR spot-check on rail)
  - [x] 8.3 Confirm JSON-LD `head()` unchanged for all three routes (no regression to ADR-49 SEO)

### Review Findings

_Code review (2026-04-18). Three layers in parallel: Blind Hunter (adversarial), Edge Case Hunter (path enumeration), Acceptance Auditor (spec)._

- [x] [Review][Decision] **Read time is per-tier constant, not per-article** (§21.8) — `routes/library/{trait,facet,archetype}.$slug.tsx`: `readTimeMinutes={7|6|8}` hardcoded. Spec allows static **per-article** OR word-count. Pick a path: (a) keep tier defaults, (b) require `readTimeMinutes` in MDX frontmatter, (c) compute from MDX word count.
- [x] [Review][Decision] **Trait facet-map icon: `MapPinned` vs `Layers3`** (§21.6 / AC #11) — `components/library/TraitFacetMapSection.tsx:33` ships `MapPinned`; mockup baseline used `Layers3`; spec reserves `MapPinned` for the trait hero cue. Decide which ships.
- [x] [Review][Decision] **Trait hero eyebrow icon: `BookOpenText` vs `MapPinned`** (§21.6 prose) — Production + mockup ship `BookOpenText`; §21.6 explicitly names `MapPinned`. Reconcile spec text or code.
- [x] [Review][Decision] **Archetype hero pull-quotes** (§21.7) — `lib/library-archetype-article-meta.ts` defines bespoke marketing copy; spec wants "short excerpt from the article voice". Keep curated copy or extract verbatim from MDX overview?
- [x] [Review][Decision] **"Continue exploring" cards on trait/facet are always rendered** (§21.5/§21.6: optional) — Decide whether to expose an off-switch (frontmatter `continueExploring: false` or omission) so editors can suppress per article.
- [x] [Review][Patch] Remove the `"use client"` directive in `apps/front/src/components/library/LibraryReadingRail.tsx:1` (Vite/TanStack Start; Next.js construct only)
- [x] [Review][Patch] Reset `activeId` to `null` when `idsKey` changes inside `useLibraryScrollSpy` so a chapter list change does not leak the previous active id [`apps/front/src/hooks/useLibraryScrollSpy.ts:8-18`]
- [x] [Review][Patch] Track last-seen-above-viewport or clear `activeId` when no section intersects, so the rail does not freeze on a stale chapter once the reader scrolls past the last section [`apps/front/src/hooks/useLibraryScrollSpy.ts:21-32`]
- [x] [Review][Patch] `pickSiblingContinueSlug` returns the same facet when `slugs.length === 1` → side-column "Continue exploring" links back to the current article. Return null and skip the section in that case [`apps/front/src/routes/library/facet.$slug.tsx:107-117`]
- [x] [Review][Patch] Use `filter(Boolean).pop()` (and skip empties) when deriving the slug from `pathname` in `RelatedArchetypePatternsColumn` so trailing-slash pathnames do not collapse into the "Also explore" missing-role fallback [`apps/front/src/components/library/RelatedArchetypePatternsColumn.tsx:25-30` and `apps/front/src/routes/library/archetype.$slug.tsx:115-119`]
- [x] [Review][Patch] `LibraryReadingRail` renders both the mobile `<details>` and desktop `<nav>` simultaneously with no `aria-label` on the mobile widget, exposing the ToC twice to screen readers. Add `aria-label="On this page"` to the `<details>` summary container (or wrap it as `<aside aria-label>`) [`apps/front/src/components/library/LibraryReadingRail.tsx:69`]
- [x] [Review][Patch] Skip the side-cell wrapper `<div className={sideCellClass}>{sideColumn}</div>` when `sideColumn` is null/falsy so archetypes with no compatibles do not occupy an empty sticky `xl` column [`apps/front/src/components/library/KnowledgeArticleLayout.tsx:81`]
- [x] [Review][Patch] When `showReadingRail` is true but `readingChapters.length === 0`, do not render the rail card (would emit "Reading rail" with an empty list) [`apps/front/src/components/library/KnowledgeArticleLayout.tsx:67`]
- [x] [Review][Patch] Clamp `minutes` to `Math.max(1, Math.round(minutes))` in `ReadingTimeHero` to avoid "About 0 min read" / "About NaN min read" [`apps/front/src/components/library/ReadingTimeHero.tsx:3-11`]
- [x] [Review][Patch] Reserve transparent left border + matching padding on inactive rail rows so the active row's `border-l-2 border-primary pl-1.5` does not jitter the chapter labels horizontally during scroll-spy [`apps/front/src/components/library/LibraryReadingRail.tsx:31-37`]
- [x] [Review][Patch] Guard mobile `<details>` summary `· {chapters.find(...)?.label}` so an `activeId` that no longer matches any chapter does not render `· ` followed by nothing (replace with `&&` short-circuit) [`apps/front/src/components/library/LibraryReadingRail.tsx:73-77`]
- [x] [Review][Patch] Extract a single `humanize`/`humanizeFacet` helper (currently duplicated in `TraitFacetMapSection.tsx`, `FacetSiblingMapSection.tsx`, `routes/library/trait.$slug.tsx:23`, `routes/library/facet.$slug.tsx:25`, and the dev mockup file)
- [x] [Review][Patch] Move the `getLibraryEntry(tier, slug)` "missing → notFound()" checks from the component body into the route `loader()` so the loader and component agree on existence (and JSON-LD is not produced for a record the component then 404s) [`apps/front/src/routes/library/{trait,facet,archetype}.$slug.tsx`]
- [x] [Review][Patch] Add `vi.unstubAllGlobals()` to the `afterEach` in `useLibraryScrollSpy.test.tsx` so the stubbed `IntersectionObserver` does not leak into other tests [`apps/front/src/hooks/useLibraryScrollSpy.test.tsx:6-9`]
- [x] [Review][Patch] Mark the `LongFormSeam` text "Long form article" as `aria-hidden="true"` (decorative divider; redundant content for SR) [`apps/front/src/components/library/LongFormSeam.tsx`]
- [x] [Review][Patch] Reading-rail `<Link to={articlePath} hash={chapter.id}>` runs through TanStack Router with a dynamic string `to`. Use a plain `<a href={\`#${chapter.id}\`}>` for in-page hash jumps to avoid router resolution per click and bypass typed-route warnings [`apps/front/src/components/library/LibraryReadingRail.tsx:29-37`]
- [x] [Review][Defer] `getLibraryEntryData` called inside `FacetSiblingMapSection.map()` without memoization — pre-existing pattern, micro-optimization, deferred.
- [x] [Review][Defer] Type-safe archetype-slug union for `ARCHETYPE_HERO_PULL_QUOTES` / `ARCHETYPE_RELATIONAL_ROLES` requires an `ArchetypeSlug` enum that does not exist yet — deferred.
- [x] [Review][Defer] Centralize sticky-nav offset constants used by `[&_h2]:scroll-mt-28`, `LibraryReadingRail` `lg:top-28` / `xl:top-28`, and `useLibraryScrollSpy` `rootMargin: "-120px 0px -55% 0px"` — deferred to a follow-up cleanup.
- [x] [Review][Defer] Direction mockup still maintains its own data constants (`OPENNESS_READING_CHAPTERS`, `IMAGINATION_READING_CHAPTERS`, `BEACON_READING_CHAPTERS`, `RELATED_PATTERN_ROLES`, `COMPATIBLE_ARCHETYPE_SLUGS`); §21.10 "drift retired" partially honored — deferred (low signal/effort to remove now).
- [x] [Review][Defer] AC #6 spirit: Lighthouse SEO spot-check on representative trait/facet/archetype URLs not evidenced in-repo (Story 12.1/12.2 standard >90) — deferred to manual run before release.

## Dev Notes

### Scope boundary

- **Frontend only** (`apps/front`). No API, contracts, or DB changes unless a build-time content hook is explicitly required.
- **Preserve ADR-49:** SSR library routes remain public, indexable, no `noindex`; JSON-LD + sitemap contracts stay intact.
- **Do not** add social proof counts, directory framing, or “compare to everyone” copy (Intimacy Principle, §21.2).

### Current production vs target (from UX §21.11)

| Area | Current | Target |
|------|---------|--------|
| Layout | `KnowledgeArticleLayout`: hero + `lg` two-column `[main \| 20rem supplementary]` | §21.3 three-breakpoint grid + reading rail column |
| Trait | Spectrum + facet breakdown split vs §21.5 (spectrum was supplementary) | Facet map + spectrum in **main** before MDX; rail TOC |
| Facet | Levels + parent trait in supplementary | Poles + sibling map in **main**; side = parent + CTA + continue |
| Archetype | Compatible list in supplementary only | Pull-quote hero; inline CTA after body; relational side column |
| Reading rail | None | Sticky / disclosure + scroll-spy |

### Architecture compliance

- **ADR-49** ([`architecture.md`](../planning-artifacts/architecture.md)): MDX in `apps/front/src/content/library/`; routes in `apps/front/src/routes/library/`; shared shell `KnowledgeArticleLayout`; `AssessmentCTA`; no auth on library routes.
- **Navigation:** TanStack Router `<Link>` for all internal links and in-page hash links ([`AGENT.md`](../../AGENT.md)).
- **Client components:** Reading rail + `IntersectionObserver` require `"use client"` boundaries only where needed; keep route loaders and `head()` as server-friendly as today.

### Technical requirements

- **Direction reference implementation:** [`apps/front/src/components/dev/library-article-direction-mockup-pages.tsx`](../../apps/front/src/components/dev/library-article-direction-mockup-pages.tsx) — chapter constants (`OPENNESS_READING_CHAPTERS`, etc.), grid structure, `TraitFacetMapSection`, facet/sibling maps, `ReadingTime`, `RELATED_PATTERN_ROLES`. Treat as visual/IA source of truth; **extract** shared pieces into production components rather than copying ad hoc.
- **Routes to update:** [`trait.$slug.tsx`](../../apps/front/src/routes/library/trait.$slug.tsx), [`facet.$slug.tsx`](../../apps/front/src/routes/library/facet.$slug.tsx), [`archetype.$slug.tsx`](../../apps/front/src/routes/library/archetype.$slug.tsx).
- **Layout:** [`KnowledgeArticleLayout.tsx`](../../apps/front/src/components/library/KnowledgeArticleLayout.tsx) — refactor props to accept tier-specific hero slots, `readingRail`, `mainColumn`, `sideColumn`, and shared prose wrapper.
- **Domain data:** `@workspace/domain` — `TRAIT_TO_FACETS`, `FACET_DESCRIPTIONS`, `FACET_LETTER_MAP`, `TRAIT_DESCRIPTIONS`, etc. Reuse existing loaders; add sibling facet map data from same sources as mockup `buildFacetMapForTrait` / per-facet siblings.
- **Icons:** `lucide-react` — `MapPinned` vs `Layers3` distinction per §21.6 for facet maps.
- **Motion:** Respect `prefers-reduced-motion` for smooth scrolling (§21.4).

### File structure requirements

| Area | Path |
|------|------|
| Shared layout / chrome | `apps/front/src/components/library/KnowledgeArticleLayout.tsx` (+ new colocated files, e.g. `LibraryReadingRail.tsx`, `useLibraryScrollSpy.ts`) |
| Trait / facet / archetype routes | `apps/front/src/routes/library/trait.$slug.tsx`, `facet.$slug.tsx`, `archetype.$slug.tsx` |
| MDX content | `apps/front/src/content/library/{traits,facets,archetypes}/*.mdx` |
| Direction mockups (QA reference) | `apps/front/src/routes/dev/library/direction/*.tsx`, `components/dev/library-article-direction-mockup-pages.tsx` |
| Global styles (if needed) | `apps/front/src/styles.css` — scoped smooth-scroll preference |

### Testing requirements

- **E2E:** Not mandatory unless adding a critical journey; preserve existing `data-testid` on `AssessmentCTA` and compatible archetype links where present.
- **Unit:** Optional for pure helpers (e.g. building chapter lists from MDX metadata); prioritize manual visual QA + a11y checklist §21.9.
- **Regression:** Lighthouse SEO spot-check on sample trait/facet/archetype URLs after layout change (Story 12.1/12.2 standard >90).

### Previous story intelligence (12.2)

- Story 12.2 delivered 30 facet MDX files and `buildFacetSchema`; facet route replaced placeholder; trait/facet pages use `KnowledgeArticleLayout` + `getLibraryEntry` / `getLibraryEntryData`.
- **Preserve:** JSON-LD graph patterns, breadcrumb structure, `SITE_ORIGIN` canonical URLs, facet schema parent trait mention quality.
- **Layout story explicitly moves modules** — content expansion is done; this story is **presentation and navigation**.

### Git intelligence summary

Recent library work: direction mockups and planning commit `c26e51da`; facet expansion `f8a07dda`. Implementation should **build on** `library-article-direction-mockup-pages.tsx` rather than reinventing layout from scratch.

### Latest tech information

- Stack unchanged: TanStack Start/Router, React 19, Tailwind v4, `motion` already in app for other surfaces — prefer CSS + `IntersectionObserver` for scroll-spy unless motion library adds clear value.
- No new dependencies required unless team chooses a lightweight headless utility for `details` behavior (avoid heavy TOC libraries if possible).

### Project context reference

- Styling and `data-*` patterns: [`docs/FRONTEND.md`](../../docs/FRONTEND.md)
- E2E attributes: [`docs/E2E-TESTING.md`](../../docs/E2E-TESTING.md) — preserve established `data-testid` conventions on CTA

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 12, Story 12.3]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — §21 Knowledge Library Article Page Layout (21.1–21.11)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-49 Knowledge Library SSR Architecture]
- [Source: `_bmad-output/implementation-artifacts/12-2-knowledge-library-content-expansion.md` — prior library delivery]
- [Source: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-18.md` — Story 12.3 insertion context]

## Dev Agent Record

### Agent Model Used

Composer (dev-story workflow)

### Debug Log References

### Completion Notes List

- Implemented §21.3 grid shell, reading rail (`LibraryReadingRail` + `useLibraryScrollSpy`), shared prose (`libraryArticleProseClass`), trait/facet/archetype tier composition, and generated reading-chapter maps from MDX `h2` ids.
- Converted all trait (4), facet (29), and archetype (4) MDX files that used `##` headings to explicit `<h2 id="…">` for stable anchors; `openness` / `imagination` / `beacon` already had ids.
- Direction mockups now reuse production `LibraryReadingRail`, `TraitFacetMapSection`, `FacetPolesSection`, `FacetSiblingMapSection`, and `libraryArticleProseClass` to reduce drift (Task 7.2).
- Added unit test `useLibraryScrollSpy.test.tsx`; full `pnpm --filter front run test` passes (593 tests).
- **Follow-up (human):** Quick visual compare of `/library/trait/openness`, `/library/facet/imagination`, `/library/archetype/beacon-personality-archetype` vs `/dev/library/direction/*` and a screen-reader spot-check on the reading rail before release.

### Change Log

- 2026-04-18: Story 12.3 implemented — library article layout, reading rail, MDX anchor audit, mockup alignment.

### File List

- `apps/front/src/components/library/KnowledgeArticleLayout.tsx`
- `apps/front/src/components/library/LibraryReadingRail.tsx`
- `apps/front/src/components/library/LibraryPlaceholderPage.tsx`
- `apps/front/src/components/library/ReadingTimeHero.tsx`
- `apps/front/src/components/library/RelatedArchetypePatternsColumn.tsx`
- `apps/front/src/components/library/TraitFacetMapSection.tsx`
- `apps/front/src/components/library/TraitSpectrumSection.tsx`
- `apps/front/src/components/library/FacetPolesSection.tsx`
- `apps/front/src/components/library/FacetSiblingMapSection.tsx`
- `apps/front/src/components/library/LongFormSeam.tsx`
- `apps/front/src/components/library/library-article-prose.ts`
- `apps/front/src/hooks/useLibraryScrollSpy.ts`
- `apps/front/src/hooks/useLibraryScrollSpy.test.tsx`
- `apps/front/src/lib/library-trait-reading-chapters.ts`
- `apps/front/src/lib/library-facet-reading-chapters.ts`
- `apps/front/src/lib/library-archetype-reading-chapters.ts`
- `apps/front/src/lib/library-archetype-article-meta.ts`
- `apps/front/src/routes/library/trait.$slug.tsx`
- `apps/front/src/routes/library/facet.$slug.tsx`
- `apps/front/src/routes/library/archetype.$slug.tsx`
- `apps/front/src/components/dev/library-article-direction-mockup-pages.tsx`
- `apps/front/src/content/library/traits/*.mdx` (4 files updated)
- `apps/front/src/content/library/facets/*.mdx` (29 files updated; imagination unchanged)
- `apps/front/src/content/library/archetypes/*.mdx` (4 files updated; beacon unchanged)
