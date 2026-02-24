# Story 15.1: Shareable Profile & Public URL — Editorial Redesign

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a visually striking, editorial public profile page with a unique URL,
so that I can share my personality results in a way that impresses visitors and converts them into users.

## Acceptance Criteria

1. **Given** the public profile route `/public-profile/:publicProfileId` **When** a visitor loads it **Then** they see a 5-section "Story Scroll" layout: Archetype Hero → Personality Shape (radar) → Trait Strata → Archetype Description → CTA **And** the page loads in < 1s (NFR3)

2. **Given** the Hero section renders **When** the page loads **Then** the archetype name, OCEAN code (each letter colored by trait), GeometricSignature, and "{displayName}'s Personality" subtitle are shown **And** a scroll indicator chevron animates at the bottom and fades on first scroll

3. **Given** the Personality Shape section renders **When** the radar chart displays **Then** it is oversized (400×400px desktop, 280×280px mobile) with external score labels at each vertex **And** a psychedelic CSS background with rotating geometric shapes plays behind it (respects `prefers-reduced-motion`)

4. **Given** the Trait Strata section renders **When** all 5 trait bands display **Then** each band shows: trait shape icon, trait name, score/120, full-width score bar, and a responsive facet grid (3-col lg / 2-col sm / 1-col mobile) **And** bands animate in on scroll via IntersectionObserver

5. **Given** the Archetype Description section renders **When** it displays **Then** it shows the archetype name and description in editorial typography with decorative quotation marks and a gradient background using dominant + secondary trait colors

6. **Given** the CTA section renders **When** the visitor is unauthenticated **Then** it shows "Discover Your Personality" linking to `/signup` **When** the visitor is authenticated without assessment **Then** it shows "Start Your Assessment" linking to `/chat` **When** the visitor is authenticated with completed assessment **Then** it shows "Start Relationship Analysis" linking to `/relationship-analysis?with={publicProfileId}`

7. **Given** the public profile URL is shared on social media **When** a platform fetches OG metadata **Then** a dynamic PNG OG image is returned from `GET /api/og/public-profile/:publicProfileId` with archetype name, colored OCEAN letters, and dominant trait decorative shapes **And** the response has `Content-Type: image/png` and is cached for 24h

8. **Given** the `FacetScoreBar` component is extracted **When** the `TraitCard` (results page) renders **Then** it uses the shared `FacetScoreBar` component with `size="compact"` and is visually identical to before

9. **Given** any public profile is accessed **When** the page loads successfully **Then** an audit log entry is created recording the access (FR26) **And** audit logging is fire-and-forget — failures never block the user-facing response **And** private profiles (403) and not-found profiles (404) do NOT create audit log entries

## Tasks / Subtasks

- [x] Task 1: Extract `FacetScoreBar` shared component (AC: #8)
  - [x] 1.1 Create `apps/front/src/components/results/FacetScoreBar.tsx` — facet name + score + thin bar, `size` prop (`compact` | `standard`)
  - [x] 1.2 Refactor `TraitCard.tsx` to import and use `<FacetScoreBar size="compact" />` instead of inline facet rendering
  - [x] 1.3 Verify `TraitCard` renders identically after extraction

- [x] Task 2: Modify `ArchetypeHeroSection` for public profile use (AC: #2)
  - [x] 2.1 Add `subtitle?: string` prop — overrides default subtitle text
  - [x] 2.2 Add `showScrollIndicator?: boolean` prop — renders `ScrollIndicator` at bottom
  - [x] 2.3 When `showScrollIndicator=true`, apply `min-h-[70vh] flex items-center justify-center`
  - [x] 2.4 `ScrollIndicator`: local component with `ChevronDown`, `animate-bounce`, fades to `opacity-0` on `scrollY > 50`

- [x] Task 3: Modify `PersonalityRadarChart` for standalone oversized use (AC: #3)
  - [x] 3.1 Add `width?: number`, `height?: number` props — override `aspect-square max-h-[280px]` when set
  - [x] 3.2 Add `showExternalLabels?: boolean` — renders `"{TraitInitial}: {score}"` in trait color at each vertex
  - [x] 3.3 Add `standalone?: boolean` — skips Card/CardHeader/CardContent wrapper

- [x] Task 4: Create `PsychedelicBackground` component (AC: #3)
  - [x] 4.1 Create `apps/front/src/components/results/PsychedelicBackground.tsx`
  - [x] 4.2 Render 5 concentric geometric shapes (circle, diamond, rectangle, triangle, ring) using `var(--trait-*)` CSS variables
  - [x] 4.3 60s/80s CSS rotation animations on composited layers (`will-change-transform`)
  - [x] 4.4 `prefers-reduced-motion`: static, no rotation
  - [x] 4.5 `aria-hidden="true"`, `role="presentation"`, `pointer-events-none`

- [x] Task 5: Create `TraitBand` component (AC: #4)
  - [x] 5.1 Create `apps/front/src/components/results/TraitBand.tsx`
  - [x] 5.2 Props: `trait: TraitResult`, `facets: readonly FacetResult[]`
  - [x] 5.3 Layout: 4px left border in trait color, 5% trait-color bg, trait shape + name + score header, full-width score bar, facet grid using `<FacetScoreBar size="standard" />`
  - [x] 5.4 IntersectionObserver scroll-in animation: `translateY(12px)→0` + `opacity 0→1`, `motion-safe` gated

- [x] Task 6: Create `ArchetypeDescriptionSection` component (AC: #5)
  - [x] 6.1 Create `apps/front/src/components/results/ArchetypeDescriptionSection.tsx`
  - [x] 6.2 Props: `archetypeName`, `description`, `oceanCode`, `dominantTrait`, `secondaryTrait`
  - [x] 6.3 Gradient background: dominant trait color 8% → transparent → secondary 5%
  - [x] 6.4 GeometricSignature divider (small, muted), "About The {name}" title, description in `text-lg md:text-xl leading-relaxed`
  - [x] 6.5 Decorative `"` quotation marks flanking text (desktop only, `aria-hidden`)

- [x] Task 7: Create `PublicProfileCTA` component (AC: #6)
  - [x] 7.1 Create `apps/front/src/components/results/PublicProfileCTA.tsx`
  - [x] 7.2 Export `AuthState` type: `'unauthenticated' | 'authenticated-no-assessment' | 'authenticated-assessed'`
  - [x] 7.3 3-state content map: heading, subtext, buttonLabel per auth state. Unauthenticated links to `/signup` (NOT `/`), authenticated-no-assessment to `/chat`, authenticated-assessed to `/relationship-analysis?with={publicProfileId}`
  - [x] 7.4 Gradient background: `oklch(0.67 0.13 181 / 0.08)` → `oklch(0.55 0.24 293 / 0.06)`
  - [x] 7.5 `data-auth-state` attribute, `data-testid="public-profile-cta-button"`

- [x] Task 8: Rewrite public profile route with auth-aware loader (AC: #1, #6)
  - [x] 8.1 Add `checkPublicProfileAuth` server function — `createServerFn` + `getRequestHeader("cookie")` → calls `/api/auth/get-session`
  - [x] 8.2 Add `checkHasCompletedAssessment` server function — calls `/api/assessment/sessions`, checks for `status: "completed"`
  - [x] 8.3 Loader resolves: `{ profile, authState }` — profile fetch (unauthenticated) + auth check + conditional assessment check
  - [x] 8.4 `head()` function: OG meta tags (`og:image` pointing to `/api/og/public-profile/:id`)
  - [x] 8.5 `ProfilePage` component: 5-section Story Scroll layout composing all new components
  - [x] 8.6 Data helpers: `deriveTraitData()`, `toFacetData()`, `getDominantTrait()`, `getSecondaryTrait()`, `TraitLegendRow`
  - [x] 8.7 `ProfileLoading` (spinner) and `ProfileErrorState` (private/not-found/generic error) inline components

- [x] Task 9: OG image backend endpoint (AC: #7)
  - [x] 9.1 Create `apps/api/src/handlers/og.ts` — generate SVG internally, then convert to PNG via `@resvg/resvg-js` for social platform compatibility (Facebook, Twitter/X, LinkedIn, iMessage all reject SVG for og:image)
  - [x] 9.2 `escapeXml()` helper for safe user-generated content in SVG template
  - [x] 9.3 `deriveTraitScores()` from facets to determine dominant trait color
  - [x] 9.4 Response: `Content-Type: image/png`, `Cache-Control: public, max-age=86400, stale-while-revalidate=3600`
  - [x] 9.5 Add `@resvg/resvg-js` dependency to `apps/api/package.json` — zero-dependency SVG→PNG rasterizer
  - [x] 9.6 Register in `apps/api/src/index.ts` — intercept `GET /api/og/public-profile/:id` in `wrapServerWithCorsAndAuth` BEFORE auth/Effect layers

- [x] Task 10: Audit logging for profile access (AC: #9)
  - [x] 10.1 Create `profile_access_log` table in `packages/infrastructure/src/db/drizzle/schema.ts` — columns: `id` (uuid PK), `profileId` (FK), `accessorUserId` (nullable), `accessorIp` (nullable), `accessorUserAgent` (nullable), `action` (text), `createdAt` (timestamp) — index on `(profileId, createdAt)`
  - [x] 10.2 Create domain interface `ProfileAccessLogRepository` in `packages/domain/src/repositories/profile-access-log.repository.ts` — single method: `logAccess(input) => Effect.Effect<void, never>` (infallible)
  - [x] 10.3 Create `ProfileAccessLogDrizzleRepositoryLive` in `packages/infrastructure/src/repositories/profile-access-log.drizzle.repository.ts` — wraps insert in `Effect.catchAll(() => Effect.void)` (fire-and-forget)
  - [x] 10.4 Create `__mocks__/profile-access-log.drizzle.repository.ts` with in-memory array
  - [x] 10.5 Export from `packages/domain/src/index.ts` and `packages/infrastructure/src/index.ts`
  - [x] 10.6 Integrate in `get-public-profile.use-case.ts` — after successful retrieval + privacy check, fire-and-forget via `Effect.fork`
  - [x] 10.7 Add `ProfileAccessLogDrizzleRepositoryLive` to server layer composition in `apps/api/src/index.ts`
  - [x] 10.8 Migration created manually at `drizzle/20260224120000_story_15_1_profile_access_log/migration.sql`

- [x] Task 11: Unit tests (AC: #7, #8, #9)
  - [x] 11.1 Create `apps/api/src/use-cases/__tests__/profile-access-log.test.ts`
  - [x] 11.2 Test: successful profile view creates audit log entry
  - [x] 11.3 Test: audit log failure does NOT fail the profile GET response (fire-and-forget)
  - [x] 11.4 Test: private profile (403) does NOT create audit log
  - [x] 11.5 Test: non-existent profile (404) does NOT create audit log
  - [x] 11.6 Test: OG image handler returns `Content-Type: image/png` and valid PNG bytes for a known profile
  - [x] 11.7 Test: OG image handler returns 404 for non-existent profile
  - [x] 11.8 Run `pnpm test:run` — all existing profile tests pass (no regressions)

- [x] Task 12: Visual and accessibility verification (AC: #1-#9)
  - [x] 12.1 `prefers-reduced-motion`: psychedelic bg stops rotating, scroll-in animations instant, bounce indicator static
  - [x] 12.2 All decorative elements: `aria-hidden="true"`
  - [x] 12.3 Heading hierarchy: h1 (archetype name in hero), h2 per section and per trait band
  - [x] 12.4 Touch targets >= 44px on CTA button
  - [x] 12.5 Facet grid responsiveness: 3-col lg / 2-col sm / 1-col mobile
  - [x] 12.6 OCEAN letter colors match `getTraitColor()` trait palette
  - [x] 12.7 Run `pnpm lint` — zero new warnings (8 pre-existing `as any` warnings in index.ts)
  - [x] 12.8 Run `pnpm test:run` — all 442 tests pass (242 API + 200 frontend)

## Dev Notes

### Design Direction

"D+B Hybrid — The Story Scroll" with poster-scale radar. The public profile is the **album cover in a record shop window** — editorial, curated, impressive. The results page remains the analytical deep-dive.

### Component Architecture

**New Components (5):**

| Component | File | Purpose |
|---|---|---|
| `FacetScoreBar` | `components/results/FacetScoreBar.tsx` | Extracted shared facet bar (name + score + bar) |
| `TraitBand` | `components/results/TraitBand.tsx` | Full-width horizontal trait+facets band |
| `PsychedelicBackground` | `components/results/PsychedelicBackground.tsx` | CSS-only decorative rotating shapes |
| `ArchetypeDescriptionSection` | `components/results/ArchetypeDescriptionSection.tsx` | Editorial description block |
| `PublicProfileCTA` | `components/results/PublicProfileCTA.tsx` | 3-state conditional CTA |

**Modified Components (3):**

| Component | Changes |
|---|---|
| `ArchetypeHeroSection` | `subtitle` prop, `showScrollIndicator` prop, conditional `min-h-[70vh]` |
| `PersonalityRadarChart` | `width`/`height`/`showExternalLabels`/`standalone` props |
| `TraitCard` | Replace inline facet grid with `<FacetScoreBar size="compact" />` |

**Reused As-Is:** `GeometricSignature`, Ocean shape icons, `getTraitColor()`, `useGetPublicProfile` hook.

### Route Data Flow

```
Route.loader (server-side, parallel)
  ├─ fetchPublicProfile(publicProfileId)         → profile data (unauthenticated)
  ├─ checkPublicProfileAuth() [createServerFn]   → { isAuthenticated }
  └─ if authenticated → checkHasCompletedAssessment() → { hasCompleted }
        ↓
  Returns: { profile, authState: AuthState }
        ↓
ProfilePage (pure rendering, no fetching)
  ├─ deriveTraitData(facets, traitSummary) → TraitResult[]
  ├─ toFacetData(facets) → FacetResult[]
  ├─ getDominantTrait / getSecondaryTrait
  └─ 5-section composition
```

### Auth State Resolution

- `checkPublicProfileAuth`: `createServerFn` → `getRequestHeader("cookie")` → `GET /api/auth/get-session`
- `checkHasCompletedAssessment`: only runs when `isAuthenticated === true` → `GET /api/assessment/sessions` → checks for `status: "completed"` in sessions array
- Unauthenticated visitors: only 2 fetches (profile + auth check)

### OG Image Handler

Standalone handler at `apps/api/src/handlers/og.ts` — registered OUTSIDE Effect API layer in `wrapServerWithCorsAndAuth`. Pipeline: SVG template → `@resvg/resvg-js` rasterization → PNG response.

**Why PNG, not SVG:** Facebook, Twitter/X, LinkedIn, and iMessage all reject SVG for `og:image`. The handler generates an SVG internally (easy to template) then converts to PNG via `@resvg/resvg-js` (zero-dependency Rust-based rasterizer, fast).

Image spec:
- 1200×630 viewBox, dark `#0a0a0f` background
- Archetype name in Space Grotesk 72px
- OCEAN code letters each colored by trait
- Dominant trait decorative circles at 10-18% opacity
- Google Fonts import for Space Grotesk + Space Mono (embedded in SVG before rasterization)
- `escapeXml()` on all user-generated content
- Response: `Content-Type: image/png`

### CSS Variable Note

`PsychedelicBackground` uses `var(--trait-openness)`, `var(--trait-conscientiousness)`, etc. These must exist in global CSS. If they don't, refactor to pass traits prop and call `getTraitColor()` inline per shape.

### Audit Logging (FR26)

Audit logging for profile access IS in scope (Task 10). Follows the same hexagonal architecture:

```
Domain (ProfileAccessLogRepository) ← Infrastructure (profile-access-log.drizzle.repository.ts)
                                      ↑ injected via Layer
Use-Case (get-public-profile) → logs access via fire-and-forget Effect.fork
```

**Critical:** Audit log writes MUST be fire-and-forget. Never fail a user-facing request because of audit logging. Use `Effect.fork` + `Effect.catchAll(() => Effect.void)` in the Drizzle implementation.

Future Story 6.3 (Epic 6) will expand audit logging to comprehensive data access logging. This implementation should be clean but NOT over-engineered for that future scope.

### What's NOT in Scope

- Privacy toggle changes (already done in Story 5-2)
- ShareProfileSection / QuickActionsCard (already done)
- Profile auto-creation in get-results use-case (already done)
- Relationship analysis route (placeholder path used)

### Project Structure Notes

- All new components in `apps/front/src/components/results/` — consistent with existing component location
- `data-slot` convention on all component roots
- `data-trait` attribute on `TraitBand` for styling hooks
- OG handler uses raw `node:http` types, not Effect — matches existing CORS/auth handler pattern in `index.ts`

### References

- [Source: _bmad-output/planning-artifacts/public-profile-redesign-ux-spec.md] — Full UX specification
- [Source: _bmad-output/planning-artifacts/public-profile-redesign-architecture.md] — Implementation blueprint with component designs
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] — Original epic story requirements
- [Source: apps/front/src/components/results/ArchetypeHeroSection.tsx] — Existing hero component to modify
- [Source: apps/front/src/components/results/PersonalityRadarChart.tsx] — Existing radar chart to modify
- [Source: apps/front/src/components/results/TraitCard.tsx] — Existing trait card (facet extraction source)
- [Source: apps/front/src/routes/public-profile.$publicProfileId.tsx] — Route to rewrite
- [Source: apps/api/src/index.ts] — Server setup (OG route registration)
- [Source: docs/FRONTEND.md] — Frontend styling patterns and conventions

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports. Use `@workspace/*` paths. No deep imports bypassing barrel exports.
4. **Type safety** — No unsafe `as` casts. No `as any` without justifying comment. Use `import type` for type-only imports.
5. **Over-engineering** — No abstract "section renderer" factory. Each section is its own component. No shared state management between sections — all data flows from route loader.
6. **Rebuilding existing work** — Do NOT recreate profile creation, privacy toggle, ShareProfileSection, QuickActionsCard, or existing API endpoints.
7. **Inline styles vs CSS** — Use Tailwind classes where possible. Inline `style` only for dynamic values (trait colors, percentages). No CSS-in-JS libraries.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None required.

### Completion Notes List

- Tasks 1-8 were largely pre-implemented from a prior session; this session validated correctness and fixed bugs
- Fixed PublicProfileCTA unauthenticated link from `/` to `/signup` (AC #6 compliance)
- Converted OG image handler from SVG to PNG output via `@resvg/resvg-js` (AC #7 compliance — social platforms reject SVG)
- Implemented full audit logging stack (Task 10): domain interface, Drizzle repo, mock, use-case integration, server layer, migration
- Wrote 4 unit tests for audit logging: view creates entry, 403/404 don't create entries, failure doesn't block GET
- All 442 tests pass (242 API + 200 frontend), lint clean (8 pre-existing warnings only)
- Migration created manually (drizzle-kit interactive prompts blocked automated generation)

### Change Log

- 2026-02-24: Story implemented — all 12 tasks completed, audit logging, OG PNG output, CTA link fix
- 2026-02-24: Code review fixes — OG handler: replaced oklch with hex colors (resvg SVG 1.1 compat), removed unreachable Google Fonts @import, switched to system fonts; shareable-profile test: fixed vi.mock() import ordering per project pattern; updated File List completeness

### File List

**New files:**
- `apps/front/src/components/results/FacetScoreBar.tsx`
- `apps/front/src/components/results/TraitBand.tsx`
- `apps/front/src/components/results/PsychedelicBackground.tsx`
- `apps/front/src/components/results/ArchetypeDescriptionSection.tsx`
- `apps/front/src/components/results/PublicProfileCTA.tsx`
- `apps/api/src/handlers/og.ts`
- `packages/domain/src/repositories/profile-access-log.repository.ts`
- `packages/infrastructure/src/repositories/profile-access-log.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/profile-access-log.drizzle.repository.ts`
- `apps/api/src/use-cases/__tests__/profile-access-log.test.ts`
- `drizzle/20260224120000_story_15_1_profile_access_log/migration.sql`

**Modified files:**
- `apps/front/src/components/results/ArchetypeHeroSection.tsx` (subtitle, showScrollIndicator props)
- `apps/front/src/components/results/PersonalityRadarChart.tsx` (width, height, showExternalLabels, standalone props)
- `apps/front/src/components/results/TraitCard.tsx` (uses FacetScoreBar)
- `apps/front/src/routes/public-profile.$publicProfileId.tsx` (full rewrite — 5-section Story Scroll)
- `apps/api/src/index.ts` (ProfileAccessLogDrizzleRepositoryLive added to layer)
- `apps/api/src/use-cases/get-public-profile.use-case.ts` (audit log integration)
- `apps/api/src/use-cases/__tests__/shareable-profile.use-case.test.ts` (ProfileAccessLogRepository mock added, import ordering fix)
- `packages/infrastructure/src/db/drizzle/schema.ts` (profile_access_log table + relations)
- `packages/domain/src/index.ts` (ProfileAccessLogRepository export)
- `packages/infrastructure/src/index.ts` (ProfileAccessLogDrizzleRepositoryLive export)
- `apps/api/package.json` (@resvg/resvg-js dependency)
- `pnpm-lock.yaml` (@resvg/resvg-js lockfile update)
