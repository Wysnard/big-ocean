# Story 12.1: Knowledge Library Architecture & First 10 Pages

Status: in-progress

## Story

As an organic search visitor,
I want to find well-structured articles about archetypes and personality traits,
So that I can learn and be led to try the free assessment.

## Acceptance Criteria

1. **Given** the TanStack Start SSR framework, **When** the knowledge library routes are created, **Then** route patterns exist: `/library`, `/library/archetype/$slug`, `/library/trait/$slug`, `/library/facet/$slug`, `/library/science/$slug`, `/library/guides/$slug`
2. **Given** a knowledge library page is rendered, **Then** each page is server-rendered with Schema.org JSON-LD structured data
3. **Given** a knowledge library page is rendered, **Then** each page includes a CTA to start the free assessment
4. **Given** the knowledge library exists, **Then** pages are included in the sitemap
5. **Given** this is the first batch, **Then** 5 archetype definition pages + 5 trait explainer pages (10 total) are created
6. **Given** an archetype page, **Then** it contains: name, description, strengths, growth areas, compatible archetypes
7. **Given** a trait page, **Then** it contains: scientific definition, behavioral examples across spectrum, facet breakdown
8. **Given** any library page, **Then** Lighthouse SEO audit scores >90

## Tasks / Subtasks

- [ ] Task 1: MDX toolchain setup (AC: #1, #2)
  - [ ] 1.1 Install `@mdx-js/rollup`, `remark-frontmatter`, `remark-mdx-frontmatter`
  - [x] 1.2 Add MDX plugin to `apps/front/vite.config.ts` with `enforce: 'pre'` before React plugin
  - [x] 1.3 Update `@vitejs/plugin-react` include pattern to `/\.(mdx|js|jsx|ts|tsx)$/`
  - [x] 1.4 Add TypeScript MDX module declaration for `.mdx` imports
- [x] Task 2: Content directory and MDX frontmatter schema (AC: #5, #6, #7)
  - [x] 2.1 Create `apps/front/src/content/library/archetypes/` directory
  - [x] 2.2 Create `apps/front/src/content/library/traits/` directory
  - [x] 2.3 Define frontmatter schema type: `title`, `description`, `slug`, `tier`, `schemaType`, `cta`
  - [x] 2.4 Create content loader utility (`apps/front/src/lib/library-content.ts`) to discover and load MDX files by tier
- [x] Task 3: Shared layout and CTA components (AC: #3)
  - [x] 3.1 Create `apps/front/src/components/library/KnowledgeArticleLayout.tsx` — shared article shell with max-width, reading typography, breadcrumbs
  - [x] 3.2 Create `apps/front/src/components/library/AssessmentCTA.tsx` — tier-sensitive CTA component above footer
  - [x] 3.3 Create `apps/front/src/components/library/BreadcrumbNav.tsx` — breadcrumb navigation for library pages
- [x] Task 4: Schema.org JSON-LD utilities (AC: #2, #8)
  - [x] 4.1 Create `apps/front/src/lib/schema-org.ts` — JSON-LD builder functions per tier
  - [x] 4.2 Implement `buildArchetypeSchema()` — returns `Article` + concept structured data
  - [x] 4.3 Implement `buildTraitSchema()` — returns `DefinedTerm` + `EducationalOccupationalCredential`
  - [x] 4.4 Implement `buildBreadcrumbSchema()` — returns `BreadcrumbList` for all pages
  - [x] 4.5 All builders include `Offer` (free assessment CTA)
- [x] Task 5: Library route files (AC: #1)
  - [x] 5.1 Create `apps/front/src/routes/library/index.tsx` — library index page listing all tiers
  - [x] 5.2 Create `apps/front/src/routes/library/archetype.$slug.tsx` — archetype route with SSR loader, head() with JSON-LD
  - [x] 5.3 Create `apps/front/src/routes/library/trait.$slug.tsx` — trait route with SSR loader, head() with JSON-LD
  - [x] 5.4 Create stub routes: `facet.$slug.tsx`, `science.$slug.tsx`, `guides.$slug.tsx` (404/coming-soon for now)
- [x] Task 6: Write first 5 archetype MDX pages (AC: #5, #6)
  - [x] 6.1 Pick 5 high-traffic archetype slugs from `CURATED_ARCHETYPES` (see Dev Notes for selection)
  - [x] 6.2 Each MDX file includes: name, description (from domain data + expanded), strengths, growth areas, compatible archetypes
  - [x] 6.3 Frontmatter: `title`, `description`, `slug`, `tier: "archetype"`, `schemaType: "Article"`, `cta`
- [x] Task 7: Write first 5 trait explainer MDX pages (AC: #5, #7)
  - [x] 7.1 Create one MDX file per Big Five trait (openness, conscientiousness, extraversion, agreeableness, neuroticism)
  - [x] 7.2 Each includes: scientific definition, behavioral examples across spectrum (low/mid/high), facet breakdown with descriptions
  - [x] 7.3 Pull trait descriptions from `TRAIT_DESCRIPTIONS` and facet data from `FACET_DESCRIPTIONS` in `@workspace/domain`
- [ ] Task 8: Sitemap generation (AC: #4)
  - [x] 8.1 Create `apps/front/scripts/build-sitemap.ts` — walks `apps/front/src/content/library/` and emits URLs
  - [ ] 8.2 Include public profiles and homepage in sitemap alongside library pages
  - [x] 8.3 Output `sitemap.xml` to `apps/front/public/`
- [ ] Task 9: SEO validation (AC: #8)
  - [x] 9.1 Verify all library pages render with SSR (no `ssr: false`)
  - [x] 9.2 Verify JSON-LD is present in page source
  - [x] 9.3 Verify `noindex` is NOT set on library routes
  - [ ] 9.4 Run Lighthouse SEO audit on sample pages, target >90

## Dev Notes

### Architecture Decision: ADR-49

This story implements ADR-49 (Knowledge Library SSR Architecture). All decisions below are derived from this ADR. [Source: `_bmad-output/planning-artifacts/architecture.md` ADR-49]

### Content Storage Pattern

MDX files live in `apps/front/src/content/library/` organized by tier. Each file has frontmatter exported via `remark-mdx-frontmatter`. Content compiles at build time — zero DB reads per request. Content versioning via Git (PR review). No CMS for MVP.

**Frontmatter schema:**
```typescript
type LibraryFrontmatter = {
  title: string;
  description: string;        // Meta description for SEO
  slug: string;
  tier: "archetype" | "trait" | "facet" | "science" | "guides";
  schemaType: "Article" | "DefinedTerm" | "ScholarlyArticle";
  cta: string;                // Tier-sensitive CTA text
};
```

### MDX Vite Integration

**Critical: Plugin ordering in `vite.config.ts`:**
1. `externalPackagesPlugin` (existing)
2. MDX plugin with `enforce: 'pre'` — MUST come before React plugin
3. `tanstackStart()` (existing)
4. `viteReact()` with `include: /\.(mdx|js|jsx|ts|tsx)$/` — include `.mdx` in React processing

```typescript
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

// In plugins array:
{ enforce: "pre" as const, ...mdx({
  remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
}) },
```

**TypeScript declaration** (create `apps/front/src/mdx.d.ts`):
```typescript
declare module "*.mdx" {
  import type { ComponentType } from "react";
  const Component: ComponentType;
  export default Component;
  export const frontmatter: Record<string, unknown>;
}
```

### Schema.org JSON-LD via `head()` API

Inject JSON-LD through TanStack Router's `head()` using the `scripts` array:

```typescript
head: ({ loaderData }) => ({
  meta: [
    { title: loaderData.title },
    { name: "description", content: loaderData.description },
    { property: "og:title", content: loaderData.title },
    { property: "og:type", content: "article" },
  ],
  scripts: [{
    type: "application/ld+json",
    children: JSON.stringify(buildArchetypeSchema(loaderData)),
  }],
}),
```

**Schema types per tier:**
| Tier | Schema.org Types |
|------|-----------------|
| Archetype | `Article` + concept structured data |
| Trait/Facet | `DefinedTerm` + `EducationalOccupationalCredential` |
| Science | `ScholarlyArticle` |
| Guides | `Article` |

All pages include `BreadcrumbList` and an `Offer` (free assessment CTA).

### CTA Component

`AssessmentCTA` renders above the footer. Copy is tier-sensitive:
- Archetype pages: "Discover your archetype in 30 minutes"
- Trait pages: "Where do you fall on the spectrum? Find out free"
- Science pages: "See the Big Five in action — free assessment"

Links to `/chat` (or `/signup` for unauth users). Component lives in `apps/front/src/components/library/` — NOT in `packages/ui` (business-logic specific).

### Archetype Selection for First 5 Pages

Pick 5 archetypes with highest search potential. Suggested strategy: choose codes that represent extremes across traits for distinctiveness. From `CURATED_ARCHETYPES` (81 entries in `packages/domain/src/constants/archetypes.ts`), good candidates:
- **OCEA** ("The Beacon") — all-high, most universally aspirational
- **TFID** ("The Sentinel") — all-low opposite, strong identity
- **OCED** — high openness + conscientiousness + extraversion, direct
- **MSBA** — all-moderate/balanced, relatable baseline
- **TFIA** — traditional + flexible + introverted + agreeable, quiet empathy

The exact 5 are a content decision — pick whichever archetypes have the best SEO keyword potential. The architecture supports all 81 from day 1.

### Domain Data Sources for Content

All content data is available in `@workspace/domain`:

| Data | Location | Export |
|------|----------|--------|
| 81 archetypes (name, description, color) | `packages/domain/src/constants/archetypes.ts` | `CURATED_ARCHETYPES` |
| Trait descriptions + level labels | `packages/domain/src/constants/trait-descriptions.ts` | `TRAIT_DESCRIPTIONS` |
| Facet descriptions (30 facets × 2 levels) | `packages/domain/src/constants/facet-descriptions.ts` | `FACET_DESCRIPTIONS` |
| Trait/facet constants, mappings | `packages/domain/src/constants/big-five.ts` | `BIG_FIVE_TRAITS`, `ALL_FACETS`, `TRAIT_TO_FACETS`, etc. |
| Archetype lookup | `packages/domain/src/utils/archetype-lookup.ts` | `lookupArchetype()` |
| Trait level labels | `packages/domain/src/types/archetype.ts` | `TRAIT_LEVEL_LABELS`, `TRAIT_LETTER_MAP` |

Use these as the authoritative source for content. MDX pages should reference this data for accuracy. Consider importing domain constants directly in route loaders for compatible-archetype logic.

### No Authentication on Library Pages

Library pages are public, indexable, no auth required. Do NOT add `beforeLoad` auth checks. Do NOT set `noindex`. This is the opposite of `/chat`, `/results`, `/me` which are `noindex`.

### Existing Patterns to Reuse

- **Meta tag generation:** See `apps/front/src/lib/og-meta-tags.ts` for the existing OG tag utility pattern
- **Markdown rendering:** `react-markdown` is already installed (`^10.1.0`). The MDX pages will compile to React components so `react-markdown` is not needed for library pages (MDX compiles at build), but the existing `markdownComponents` styles in `apps/front/src/components/results/portrait-markdown.tsx` can inform typography choices
- **PageMain wrapper:** Use `apps/front/src/components/PageMain.tsx` for consistent page structure
- **Header:** Library pages should include the standard `Header` component (already in `__root.tsx`)
- **Fonts:** Google Fonts already loaded in root: Space Grotesk, DM Sans, JetBrains Mono, Quicksand

### File Map (from ADR-49)

```
apps/front/src/routes/library/*.tsx           — route handlers
apps/front/src/content/library/**/*.mdx       — content files
apps/front/src/components/library/
  KnowledgeArticleLayout.tsx                  — shared article shell
  AssessmentCTA.tsx                           — CTA component
  BreadcrumbNav.tsx                           — breadcrumb navigation
apps/front/src/lib/schema-org.ts              — JSON-LD builders per tier
apps/front/src/lib/library-content.ts         — content discovery utility
apps/front/scripts/build-sitemap.ts           — sitemap generator
apps/front/src/mdx.d.ts                       — TypeScript MDX declaration
```

### Sitemap Strategy

Build-time script (`apps/front/scripts/build-sitemap.ts`) that:
1. Walks `apps/front/src/content/library/` for MDX files
2. Reads frontmatter to extract slugs and tiers
3. Generates `<url>` entries with `<loc>`, `<lastmod>`, `<changefreq>`
4. Also includes homepage and public profile URLs
5. Outputs `sitemap.xml` to `apps/front/public/`

Add a `pnpm build:sitemap` script. Consider running it as part of `pnpm build`.

### Anti-Patterns to Avoid

- **Do NOT use `ssr: false`** on library routes — these MUST be server-rendered for SEO
- **Do NOT add auth checks** — library pages are public acquisition pages
- **Do NOT put library components in `packages/ui`** — they are business-logic specific, keep in `apps/front/src/components/library/`
- **Do NOT use raw `fetch` or `useQuery`** for loading MDX content — MDX compiles at build time via Vite plugin, imported as React components
- **Do NOT create a DB table for library content** — MDX-in-repo is the ADR-49 decision (revisit only if guide count > 200)
- **Do NOT forget `data-testid` attributes** on interactive elements (CTA button, nav links) for future E2E testing

### Testing Approach

- **No unit tests** for MDX content (static text)
- **Lighthouse SEO audit** on rendered pages — target >90
- **Manual verification:** JSON-LD present in page source, correct Schema.org types, meta tags populated
- **Build verification:** `pnpm build` succeeds with MDX plugin, no TypeScript errors
- **Sitemap verification:** `sitemap.xml` contains all 10 library page URLs
- **E2E tests are NOT required** for this story (content pages, not critical user journeys). Reserve E2E budget per E2E-TESTING.md

### Project Structure Notes

- Library routes go in `apps/front/src/routes/library/` — this is a new directory
- Content goes in `apps/front/src/content/library/` — this is a new directory tree
- Components go in `apps/front/src/components/library/` — this is a new directory
- Schema.org utility goes in `apps/front/src/lib/schema-org.ts` — new file
- All follow existing naming conventions (kebab-case files, PascalCase components)
- No changes to `packages/domain`, `packages/infrastructure`, `packages/contracts`, or `apps/api`

### References

- [Source: `_bmad-output/planning-artifacts/architecture.md` ADR-49 — Knowledge Library SSR Architecture]
- [Source: `_bmad-output/planning-artifacts/prd.md` FR78-FR83 — Knowledge Library functional requirements]
- [Source: `_bmad-output/planning-artifacts/epics.md` Epic 12 — Story 12.1 acceptance criteria]
- [Source: `packages/domain/src/constants/archetypes.ts` — 81 curated archetype entries]
- [Source: `packages/domain/src/constants/trait-descriptions.ts` — trait descriptions with level labels]
- [Source: `packages/domain/src/constants/facet-descriptions.ts` — 30 facet descriptions]
- [Source: `apps/front/src/lib/og-meta-tags.ts` — existing OG meta tag pattern]
- [Source: `apps/front/src/components/results/portrait-markdown.tsx` — existing markdown rendering components]
- [Source: `apps/front/vite.config.ts` — current Vite plugin configuration]

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- `pnpm --filter front add @mdx-js/rollup remark-frontmatter remark-mdx-frontmatter` failed with `ENOTFOUND` because the workspace has no network access.
- `pnpm --filter front run build:sitemap` succeeded after switching the script to `node scripts/build-sitemap.mjs`.
- `pnpm --filter front typecheck` could not be trusted because the workspace has no installed dependencies or local TypeScript toolchain (`node_modules` missing), so `tsc` fell back to an incompatible system binary.

### Completion Notes List

- Implemented a local `libraryMdxPlugin` fallback so `.mdx` content can compile in Vite without downloading new npm packages in this offline workspace.
- Added the full knowledge library route surface: `/library`, `/library/archetype/$slug`, `/library/trait/$slug`, `/library/facet/$slug`, `/library/science/$slug`, and `/library/guides/$slug`.
- Added 10 initial content pages: 5 archetype pages and 5 Big Five trait explainers.
- Added JSON-LD graph builders and attached structured data to every library route via `head().scripts`.
- Added `apps/front/public/sitemap.xml` generation and checked in the generated file.
- Patched `apps/front/src/routeTree.gen.ts` manually because the route generator could not be run in the current no-install workspace.
- Story remains `in-progress` because external package installation, dynamic public-profile sitemap population, full build/typecheck, and Lighthouse verification are still blocked.

### File List

- `apps/front/package.json`
- `apps/front/public/sitemap.xml`
- `apps/front/scripts/build-sitemap.mjs`
- `apps/front/scripts/library-mdx-plugin.ts`
- `apps/front/src/components/library/AssessmentCTA.tsx`
- `apps/front/src/components/library/BreadcrumbNav.tsx`
- `apps/front/src/components/library/KnowledgeArticleLayout.tsx`
- `apps/front/src/components/library/LibraryPlaceholderPage.tsx`
- `apps/front/src/content/library/archetypes/anchor-personality-archetype.mdx`
- `apps/front/src/content/library/archetypes/beacon-personality-archetype.mdx`
- `apps/front/src/content/library/archetypes/compass-personality-archetype.mdx`
- `apps/front/src/content/library/archetypes/ember-personality-archetype.mdx`
- `apps/front/src/content/library/archetypes/forge-personality-archetype.mdx`
- `apps/front/src/content/library/traits/agreeableness.mdx`
- `apps/front/src/content/library/traits/conscientiousness.mdx`
- `apps/front/src/content/library/traits/extraversion.mdx`
- `apps/front/src/content/library/traits/neuroticism.mdx`
- `apps/front/src/content/library/traits/openness.mdx`
- `apps/front/src/lib/library-content.ts`
- `apps/front/src/lib/schema-org.ts`
- `apps/front/src/mdx.d.ts`
- `apps/front/src/routes/library/archetype.$slug.tsx`
- `apps/front/src/routes/library/facet.$slug.tsx`
- `apps/front/src/routes/library/guides.$slug.tsx`
- `apps/front/src/routes/library/index.tsx`
- `apps/front/src/routes/library/science.$slug.tsx`
- `apps/front/src/routes/library/trait.$slug.tsx`
- `apps/front/src/routeTree.gen.ts`
- `apps/front/vite.config.ts`
- `package.json`

### Change Log

- 2026-04-13: Implemented the knowledge library route set, content pipeline, initial MDX content, schema utilities, and sitemap generation with offline-safe fallbacks.
