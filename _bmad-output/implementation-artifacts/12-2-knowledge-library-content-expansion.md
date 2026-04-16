# Story 12.2: Knowledge Library Content Expansion

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created -->

## Story

As the platform operator,
I want to expand the knowledge library to 35+ pages,
So that SEO coverage grows and more organic visitors discover the product.

## Acceptance Criteria

1. **Given** the library architecture from Story 12.1, **When** content is expanded, **Then** all 5 trait explainer pages are complete (verify against template; fix gaps only if discovered).
2. **Given** facet tier is implemented, **When** a visitor opens `/library/facet/$slug`, **Then** each of the 30 facet slugs from `@workspace/domain` resolves to a real SSR article (no placeholder `notFound()` for valid slugs).
3. **Given** a facet page, **When** it renders, **Then** it follows the established library template: `KnowledgeArticleLayout`, MDX body, tier-appropriate `AssessmentCTA`, and supplementary context derived from domain data (`FACET_DESCRIPTIONS`, `FACET_TO_TRAIT`).
4. **Given** any new library page, **When** it renders, **Then** it includes Schema.org JSON-LD (`DefinedTerm` + `EducationalOccupationalCredential` per ADR-49 for trait/facet tiers), `BreadcrumbList`, and an `Offer` for the free assessment — injected via route `head()` like existing archetype/trait routes.
5. **Given** the sitemap build, **When** it runs after adding MDX files, **Then** all new facet URLs appear in `apps/front/public/sitemap.xml` (script already walks `src/content/library/**/*.mdx`).
6. **Given** SEO targets from Epic 12, **When** facet pages are checked, **Then** Lighthouse SEO score remains **>90** on a representative sample of facet URLs (spot-check, same standard as Story 12.1).

## Tasks / Subtasks

- [x] Task 1: Facet route — replace placeholder (AC: #2, #3, #4)
  - [x] 1.1 Rewrite `apps/front/src/routes/library/facet.$slug.tsx` to mirror `trait.$slug.tsx`: loader validates `FacetName` via `ALL_FACETS` / `FACET_DESCRIPTIONS`, loads entry via `getLibraryEntry` / `getLibraryEntryData("facet", slug)`, throws `notFound()` for unknown slugs.
  - [x] 1.2 Compose supplementary UI: parent trait link (`Link` to `/library/trait/$traitSlug`), and a “two-pole” or level breakdown section using `FACET_DESCRIPTIONS[facet].levels` (humanize labels for display; keep domain strings authoritative).
  - [x] 1.3 `head()`: meta, canonical, JSON-LD graph — call new `buildFacetSchema()` (or equivalent) plus `buildBreadcrumbSchema`; no `CollectionPage` placeholder for real articles.
- [x] Task 2: Schema.org — facet builders (AC: #4)
  - [x] 2.1 Add `buildFacetSchema()` in `apps/front/src/lib/schema-org.ts`: `DefinedTerm` with `inDefinedTermSet` pointing at the facet collection (`/library` facet tier or absolute `/library/facet` index pattern — align with existing `buildTraitSchema` URL style), include `Offer` for free assessment, and relate the parent trait explainer URL (`/library/trait/{trait}`) in a schema-consistent way (`mentions` / related link — match patterns already used for archetypes).
  - [x] 2.2 Keep `EducationalOccupationalCredential` node coherent with trait pages (facet-level explainer credential copy).
- [x] Task 3: MDX content — 30 facet pages (AC: #2, #3, #5)
  - [x] 3.1 Create `apps/front/src/content/library/facets/` and add **one `.mdx` file per** entry in `ALL_FACETS` from `packages/domain/src/constants/big-five.ts` (30 files). **Slug in frontmatter must equal** the domain facet key (e.g. `imagination`, `artistic_interests`, … `vulnerability`).
  - [x] 3.2 Frontmatter: `tier: "facet"`, `schemaType: "DefinedTerm"`, `title`, `description` (meta/SEO), `slug`, `cta` (can match frontmatter pattern from traits or override per page).
  - [x] 3.3 Body structure (match trait depth): opening definition (what this facet measures in the Big Five / NEO-style sense), then sections for how the facet shows up in life; **do not contradict** `FACET_DESCRIPTIONS` — treat domain constants as source of truth for level wording where reused.
- [x] Task 4: Trait pages audit (AC: #1)
  - [x] 4.1 Confirm all five `apps/front/src/content/library/traits/*.mdx` files include: scientific definition, spectrum-style sections, and facet breakdown alignment with Story 12.1 AC; patch only if something is incomplete.
- [x] Task 5: Sitemap & index (AC: #5)
  - [x] 5.1 Run `pnpm --filter front run build:sitemap` (or root script if wired) and commit updated `apps/front/public/sitemap.xml`.
  - [x] 5.2 Confirm `/library` index lists facet entries via existing `getAllLibraryEntries()` (no code change expected unless tier filter is wrong).
- [x] Task 6: Verification (AC: #6)
  - [x] 6.1 `pnpm build` / `pnpm typecheck` / `pnpm lint` for `front` as applicable.
  - [x] 6.2 Lighthouse SEO spot-check on 2–3 facet URLs + confirm JSON-LD in page source.

### Review Findings

_Code review (2026-04-16). Subagent layers were executed in single-session adversarial review (Blind Hunter + Edge Case Hunter + Acceptance Auditor); no separate subagent processes._

- [x] [Review][Patch] “Two poles” sidebar shows raw NEO level codes (e.g. OP, OV) instead of human-readable labels — Task 1.2 asked to humanize labels for display while keeping domain strings authoritative in data. [`apps/front/src/routes/library/facet.$slug.tsx`](apps/front/src/routes/library/facet.$slug.tsx) (LevelBreakdown, ~lines 114–132). **Resolved:** labels from `FACET_LEVEL_LABELS`, pole row from `FACET_LETTER_MAP` (lower/higher), codes kept as secondary mono line.

- [x] [Review][Patch] JSON-LD `mentions[0].name` is the generic string `Parent trait`; richer `Thing.name` (e.g. parent trait explainer title) would better match archetype `mentions` quality and help consumers of structured data. [`apps/front/src/lib/schema-org.ts`](apps/front/src/lib/schema-org.ts) (`buildFacetSchema`, ~lines 151–156). **Resolved:** `parentTraitMentionName` uses trait MDX `title` from `getLibraryEntryData("trait", …)` when present.

- [x] [Review][Defer] AC #6 (Lighthouse SEO >90 on a sample of facet URLs) is not evidenced in-repo (no Lighthouse report, CI artifact, or recorded scores) — defer manual spot-check before release; not a code defect. [Completion notes vs. AC #6] **Update 2026-04-16:** Manual Lighthouse run completed — see Completion Notes (three facet URLs, SEO 100 each).

## Dev Notes

### Scope boundary

- **Frontend / content only.** No changes to `apps/api`, `packages/contracts`, `packages/infrastructure`, or DB. Epic 12 is MDX + TanStack Start routes + build-time sitemap.
- **Not in scope:** science/guides tiers (still placeholders), remaining archetype pages beyond Story 12.1’s first five.

### Architecture compliance (ADR-49)

- MDX in `apps/front/src/content/library/{tier}/`; SSR via TanStack Start; JSON-LD + `AssessmentCTA`; public routes — **no auth `beforeLoad`**, **no `noindex`** on library routes. [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-49]
- Sitemap: build script walks all `.mdx` under `content/library/` — new facet files are picked up automatically when the script runs. [Source: `apps/front/scripts/build-sitemap.mjs`]

### Technical requirements

- **Navigation:** Use TanStack Router `<Link>` for internal links (facet → trait, library index, CTA). Never raw `<a href>` for in-app navigation. [Source: `CLAUDE.md` — Navigation rule]
- **Domain types:** `FacetName`, `ALL_FACETS`, `FACET_TO_TRAIT`, `FACET_DESCRIPTIONS` from `@workspace/domain`. Slugs in URLs and frontmatter must match `FacetName` keys exactly (e.g. `activity_level`, `artistic_interests`).
- **Plugin order / MDX:** Do not regress Vite MDX setup from Story 12.1 (`@mdx-js/rollup` with `enforce: 'pre'`, React `include` covers `.mdx`). [Source: `apps/front/vite.config.ts`, Story 12.1 file list]
- **`data-testid`:** Preserve `library-assessment-cta` / `library-assessment-cta-button` patterns; do not remove test ids. [Source: `CLAUDE.md` — E2E rule]

### File structure requirements

| Area | Path |
|------|------|
| Facet MDX | `apps/front/src/content/library/facets/*.mdx` (30 files) |
| Facet route | `apps/front/src/routes/library/facet.$slug.tsx` (replace placeholder) |
| JSON-LD | `apps/front/src/lib/schema-org.ts` — add `buildFacetSchema` |
| Sitemap output | `apps/front/public/sitemap.xml` (regenerated) |
| Shared layout | `apps/front/src/components/library/KnowledgeArticleLayout.tsx` (reuse) |

### Testing requirements

- **No new E2E required** for static content pages per project E2E policy unless adding a critical journey; manual + Lighthouse + build verification per Story 12.1 precedent.
- **Unit tests:** Optional for pure schema builders if you add non-trivial logic; not mandatory for MDX prose.

### Previous story intelligence (12.1)

- **Patterns to reuse:** `trait.$slug.tsx` loader/head/component structure; `KnowledgeArticleLayout` with `supplementary` slot; `getLibraryEntry` / `getLibraryEntryData` from `library-content.ts`.
- **Completed surface:** 5 archetype + 5 trait MDX pages; `buildTraitSchema` + breadcrumbs; sitemap script is `build-sitemap.mjs` (not `.ts` — known deviation).
- **Review fixes to honor:** JSON-LD uses `buildJsonLdGraph`; breadcrumbs are 3-level (Home → Library → page title); `escapeXml` in sitemap; facet route should not reintroduce placeholder `CollectionPage` for real content.
- **Deferred items from 12.1:** `SITE_ORIGIN` baked at build time — same pattern as other library routes unless product asks otherwise.

### Git intelligence summary

Recent commits are unrelated to the library (cost ceiling, homepage). Implementation should follow **file patterns established in Story 12.1** (see Previous story intelligence and `git` file list in `12-1-knowledge-library-architecture-and-first-10-pages.md`).

### Latest tech information

- Stack unchanged: TanStack Start/Router, Vite, MDX via `@mdx-js/rollup`, Tailwind v4. No new dependencies expected unless you introduce a helper for content generation.

### Project context reference

- Styling/components: [Source: `docs/FRONTEND.md`]
- Library-specific anti-patterns (no `ssr: false`, no DB for content): [Source: Story 12.1 Dev Notes — Anti-Patterns]

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 12, Story 12.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-49]
- [Source: `_bmad-output/implementation-artifacts/12-1-knowledge-library-architecture-and-first-10-pages.md` — Story 12.1]
- [Source: `packages/domain/src/constants/big-five.ts` — `ALL_FACETS`, `FACET_TO_TRAIT`]
- [Source: `packages/domain/src/constants/facet-descriptions.ts` — `FACET_DESCRIPTIONS`]
- [Source: `apps/front/src/routes/library/trait.$slug.tsx` — reference implementation]
- [Source: `apps/front/src/lib/library-content.ts` — frontmatter schema, `buildLibraryPath`]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `pnpm typecheck` passed (front cache miss, all others cached) — 5.8s
- `pnpm lint` passed — all pre-existing warnings only, no new lint issues from story changes
- `pnpm build` passed — 42 sitemap URLs generated, client + server chunks for `facet.$slug` route confirmed in output
- `pnpm test:run` — 584 tests passed across 81 test files, zero regressions

### Completion Notes List

- Replaced the placeholder `facet.$slug.tsx` route (which threw `notFound()` for all slugs) with a full SSR route mirroring `trait.$slug.tsx`: loader validates `FacetName` via `isFacetName()`, loads MDX entry via `getLibraryEntry`/`getLibraryEntryData`, renders `KnowledgeArticleLayout` with supplementary "Parent trait" link and "Two poles" level breakdown sidebar.
- Added `buildFacetSchema()` to `schema-org.ts`: `DefinedTerm` + `EducationalOccupationalCredential` + `Offer`, with `mentions` linking to the parent trait page — consistent with `buildTraitSchema` and `buildArchetypeSchema` patterns.
- Created 30 facet MDX files in `apps/front/src/content/library/facets/`. Each file has correct frontmatter (`tier: "facet"`, `schemaType: "DefinedTerm"`, slug matching `FacetName` key exactly). Body structure: opening definition, two-pole sections (lower/higher), daily-life manifestation.
- Audited all 5 trait MDX pages — all complete with scientific definition, spectrum sections, and facet breakdown; no patches needed.
- Regenerated sitemap: 42 URLs (was 12 before, +30 facet pages). All 30 facet URLs confirmed in `sitemap.xml`.
- Library index page picks up facet entries automatically via `import.meta.glob("../content/library/**/*.mdx")` — no code change needed.
- **Lighthouse SEO (AC #6) — manual run 2026-04-16:** Production Nitro build served on `127.0.0.1:3456`; `lighthouse@12.8.2` SEO-only, desktop preset, on `/library/facet/imagination`, `/library/facet/activity_level`, `/library/facet/vulnerability` — **SEO scores 100 / 100 / 100** (all above >90). SSR HTML includes `application/ld+json` and `DefinedTerm`.

**Post-review batch (2026-04-16):** Code review patches applied — two-pole sidebar uses `FACET_LEVEL_LABELS` + lower/higher pole from `FACET_LETTER_MAP` (codes as secondary mono line); `buildFacetSchema` takes `parentTraitMentionName` from trait MDX title when available.

### File List

- `apps/front/src/routes/library/facet.$slug.tsx` (rewritten)
- `apps/front/src/lib/schema-org.ts` (added `buildFacetSchema`)
- `apps/front/public/sitemap.xml` (regenerated — 42 URLs)
- `apps/front/src/content/library/facets/imagination.mdx` (new)
- `apps/front/src/content/library/facets/artistic_interests.mdx` (new)
- `apps/front/src/content/library/facets/emotionality.mdx` (new)
- `apps/front/src/content/library/facets/adventurousness.mdx` (new)
- `apps/front/src/content/library/facets/intellect.mdx` (new)
- `apps/front/src/content/library/facets/liberalism.mdx` (new)
- `apps/front/src/content/library/facets/self_efficacy.mdx` (new)
- `apps/front/src/content/library/facets/orderliness.mdx` (new)
- `apps/front/src/content/library/facets/dutifulness.mdx` (new)
- `apps/front/src/content/library/facets/achievement_striving.mdx` (new)
- `apps/front/src/content/library/facets/self_discipline.mdx` (new)
- `apps/front/src/content/library/facets/cautiousness.mdx` (new)
- `apps/front/src/content/library/facets/friendliness.mdx` (new)
- `apps/front/src/content/library/facets/gregariousness.mdx` (new)
- `apps/front/src/content/library/facets/assertiveness.mdx` (new)
- `apps/front/src/content/library/facets/activity_level.mdx` (new)
- `apps/front/src/content/library/facets/excitement_seeking.mdx` (new)
- `apps/front/src/content/library/facets/cheerfulness.mdx` (new)
- `apps/front/src/content/library/facets/trust.mdx` (new)
- `apps/front/src/content/library/facets/morality.mdx` (new)
- `apps/front/src/content/library/facets/altruism.mdx` (new)
- `apps/front/src/content/library/facets/cooperation.mdx` (new)
- `apps/front/src/content/library/facets/modesty.mdx` (new)
- `apps/front/src/content/library/facets/sympathy.mdx` (new)
- `apps/front/src/content/library/facets/anxiety.mdx` (new)
- `apps/front/src/content/library/facets/anger.mdx` (new)
- `apps/front/src/content/library/facets/depression.mdx` (new)
- `apps/front/src/content/library/facets/self_consciousness.mdx` (new)
- `apps/front/src/content/library/facets/immoderation.mdx` (new)
- `apps/front/src/content/library/facets/vulnerability.mdx` (new)

### Change Log

- 2026-04-16: Implemented knowledge library content expansion — 30 facet MDX pages, facet route with SSR/JSON-LD, buildFacetSchema, sitemap regeneration. All acceptance criteria satisfied. Story moved to review.
- 2026-04-16: Code review batch-fix — humanized two-pole labels (`FACET_LEVEL_LABELS` + lower/higher pole), JSON-LD `mentions` uses parent trait article title; story marked done; `epic-12` set to done in sprint-status.
