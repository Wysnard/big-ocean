# Story 7.12: Shareable Public Profile & Share Cards

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User who has completed the assessment**,
I want **a beautiful, shareable public profile page and social share card featuring my archetype**,
so that **I can share my personality with friends via a unique link that looks stunning in social previews and inspires others to take the assessment**.

## Acceptance Criteria

1. **Given** someone visits my shareable profile link (e.g., `/profile/:publicProfileId`)
   **When** the public profile page loads
   **Then** they see:
   - My archetype name in `display-hero` typography
   - My Geometric Personality Signature (5 OCEAN shapes sized by level)
   - Big Five trait summary (High/Mid/Low for each trait with trait colors and shapes)
   - 2-3 sentence archetype description
   - A CTA: "Discover Your Archetype" linking to the home page
   **And** NO private data is shown (no conversation, no evidence)
   **And** facet scores and trait breakdowns ARE visible (expandable per trait)
   **And** the page uses the archetype's dominant trait color as hero background

2. **Given** I share my profile link on social media (Twitter, Facebook, LinkedIn, iMessage)
   **When** the platform fetches the link preview
   **Then** an OG meta card renders showing:
   - Site name: "big-ocean"
   - Archetype name as title
   - Archetype description as description
   - Appropriate twitter:card type
   **And** the card is branded and inviting

3. **Given** I am on my results page (authenticated)
   **When** I click "Share My Archetype"
   **Then** I see a share panel with:
   - Preview of what recipients will see (public profile)
   - "Copy Link" button
   - Social share buttons (Twitter, Facebook, LinkedIn)
   - A note: "Your archetype, trait scores, and facet breakdowns will be visible. Conversations and evidence are not shared."
   **And** the share link is generated (using existing Epic 5 infrastructure)

4. **Given** a recipient views my public profile
   **When** they click "Discover Your Archetype"
   **Then** they are navigated to the big-ocean home page
   **And** the viral loop is complete

## Tasks / Subtasks

- [x] Task 1: Redesign public profile page with psychedelic brand identity (AC: #1)
  - [x] Replace all hard-coded slate/blue/gray/purple colors in `profile.$publicProfileId.tsx` with semantic tokens
  - [x] Add `display-hero` typography (Space Grotesk) for archetype name
  - [x] Replace Waves icon with `GeometricSignature` component (import from `ocean-shapes/`)
  - [x] Use trait color CSS variables (`--trait-openness`, etc.) instead of hard-coded Tailwind color classes
  - [x] Apply archetype's dominant trait color as hero section background via dynamic CSS
  - [x] Use `OceanCircle`/`OceanHalfCircle`/`OceanRectangle`/`OceanTriangle`/`OceanDiamond` as trait markers in summary
  - [x] Show facet-level expansion on public profile (expandable per trait, same as results page)
  - [x] Update CTA copy from "Take the Assessment" to "Discover Your Archetype" and link to `/` (home page)
  - [x] Add `data-slot` attributes to all component parts per FRONTEND.md
  - [x] Ensure light and dark mode work correctly with semantic tokens
  - [x] Mobile responsive with 44px+ touch targets

- [x] Task 2: Add OG meta tags for social sharing previews (AC: #2)
  - [x] Add `head()` function to `createFileRoute('/profile/$publicProfileId')` with dynamic meta
  - [x] Set `og:title` to archetype name (e.g., "The Thoughtful Creator | big-ocean")
  - [x] Set `og:description` to archetype description (2-3 sentences)
  - [x] Set `og:url` to canonical profile URL
  - [x] Set `og:site_name` to "big-ocean"
  - [x] Set `og:type` to "profile"
  - [x] Set `twitter:card` to "summary"
  - [x] Set `twitter:title` and `twitter:description` matching OG values
  - [x] Ensure meta tags are SSR-rendered (TanStack Start `head()` pattern)
  - [x] Handle loading/error states gracefully in meta (fallback title/description)

- [x] Task 3: Enhance share panel on results page with social buttons and preview (AC: #3)
  - [x] Add social share buttons to `ShareProfileSection.tsx`: Twitter (X), Facebook, LinkedIn
  - [x] Each button opens share URL in new window with pre-filled share text
  - [x] Twitter: `https://twitter.com/intent/tweet?text=...&url=...`
  - [x] Facebook: `https://www.facebook.com/sharer/sharer.php?u=...`
  - [x] LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=...`
  - [x] Add privacy notice text: "Only your archetype and trait summary will be visible"
  - [x] Style social buttons with brand tokens (not platform brand colors)
  - [x] Add `data-slot` attributes to new elements

- [x] Task 4: Ensure viral loop CTA works correctly (AC: #4)
  - [x] Verify "Discover Your Archetype" CTA on public profile links to home page (`/`)
  - [x] Ensure CTA is prominent and uses brand styling (gradient CTA button)
  - [x] Verify CTA works for unauthenticated visitors (no auth required to view CTA target)

- [x] Task 5: Validation and regression testing (AC: #1-#4)
  - [x] Verify public profile page renders correctly with brand design tokens
  - [x] Verify facet-level data is visible on public profile (expandable per trait)
  - [x] Verify OG meta tags render in SSR HTML source
  - [x] Verify social share buttons open correct URLs
  - [x] Verify copy link functionality still works
  - [x] Verify privacy toggle functionality still works
  - [x] Verify light and dark mode visual correctness
  - [x] Run `pnpm lint` and `pnpm test:run`

## Dev Notes

### Current Implementation Reality (Must Account For)

1. **Public profile page already exists** at `apps/front/src/routes/profile.$publicProfileId.tsx`. It was built in Epic 5 (Story 5.2) with a functional but unstyled design using hard-coded slate/blue/purple colors. This story is a **visual redesign** to match the psychedelic brand identity, NOT a greenfield build.

2. **All backend infrastructure is complete** from Epic 5:
   - Profile creation endpoint: `POST /api/profile/share`
   - Public profile fetch: `GET /api/profile/:publicProfileId`
   - Privacy toggle: `PATCH /api/profile/:publicProfileId/visibility`
   - Database table: `public_profile` with `oceanCode5`, `oceanCode4`, `isPublic`, `viewCount`
   - Use cases: `create-shareable-profile`, `get-public-profile`, `toggle-profile-visibility`

3. **Share functionality already exists** in `ShareProfileSection.tsx` on the results page, including:
   - Generate shareable link button
   - Copy link button
   - Privacy toggle (public/private)
   - URL display
   What's missing: social share buttons, privacy note, visual preview.

4. **Profile data available from `useGetPublicProfile()` hook** (`apps/front/src/hooks/use-profile.ts`):
   - `archetypeName` (string)
   - `oceanCode` (OceanCode5, e.g., "HHMHM")
   - `description` (string, 2-3 sentences)
   - `color` (string, hex color from curated archetypes)
   - `traitSummary` (Record<string, string>, e.g., `{ openness: "H", ... }`)
   - `facets` (FacetScoresMap, all 30 facets) - shown on public profile in expandable trait sections
   - `isPublic` (boolean)

5. **GeometricSignature component exists and is production-ready** at `apps/front/src/components/ocean-shapes/GeometricSignature.tsx`:
   - Props: `oceanCode: OceanCode5`, `baseSize?: number`, `animate?: boolean`, `archetypeName?: string`
   - Uses OCEAN shape components and trait colors from CSS variables

6. **OCEAN shape components exist** at `apps/front/src/components/ocean-shapes/`:
   - `OceanCircle.tsx` (O), `OceanHalfCircle.tsx` (C), `OceanRectangle.tsx` (E), `OceanTriangle.tsx` (A), `OceanDiamond.tsx` (N)
   - Each accepts `size` and `color` props

7. **Current public profile page has these anti-patterns that MUST be fixed:**
   - Hard-coded colors: `from-slate-900`, `via-slate-800`, `bg-blue-400`, `text-amber-400`, `text-purple-400`, etc.
   - Uses generic `Waves` icon instead of `GeometricSignature`
   - Exposes facet-level details (expandable trait sections showing 30 facets with scores)
   - "Take the Assessment" CTA links to `/chat` instead of home page `/`
   - Uses `data-testid` instead of `data-slot` convention
   - Missing `font-heading` (Space Grotesk) for archetype name
   - Hard-coded gradient buttons: `from-blue-500 to-purple-500`

8. **No OG meta tags exist anywhere in the app.** The `__root.tsx` sets only basic charset/viewport/title. TanStack Start supports route-level `head()` for SSR meta.

9. **16 share card UX direction explorations exist** at `_bmad-output/ux-explorations/share-card-directions/`. These are design references only - not production code. Favorites: Topographic (direction-2) and Tarot (direction-6).

### Implementation Blueprint

- **Visual redesign of existing page** - do NOT create new routes or new backend endpoints
- Replace all hard-coded colors with semantic tokens from `globals.css`
- Use existing OCEAN shape components and trait colors
- Show facet-level detail on public view (expandable per trait, same as authenticated results page)
- Add dynamic OG meta via TanStack Start `head()` function at route level
- Add social share buttons to existing `ShareProfileSection.tsx`
- No new npm packages needed

### Architecture Compliance Requirements

- Continue using TanStack Router file-route pattern (`createFileRoute`)
- Use existing `useGetPublicProfile()` hook for data fetching
- Use existing `useShareProfile()`, `useToggleVisibility()` hooks for share actions
- Use semantic CSS tokens from `packages/ui/src/styles/globals.css` (no hard-coded colors)
- Use `data-slot` attributes per FRONTEND.md conventions (not `data-testid`)
- Use `font-heading` (Space Grotesk) for headings, `font-sans` (DM Sans) for body, `font-mono` (JetBrains Mono) for data
- All trait colors via CSS variables: `var(--trait-openness)`, `var(--trait-conscientiousness)`, etc.
- No new backend endpoints or contract changes needed
- Keep domain/application boundaries intact (frontend-only changes)

### Library / Framework Requirements

- Routing: `@tanstack/react-router` with `createFileRoute` and `head()` for SSR meta
- Data: existing `useGetPublicProfile()` from `apps/front/src/hooks/use-profile.ts`
- UI: `@workspace/ui` Button, semantic token classes
- Shapes: `GeometricSignature`, individual OCEAN shape components from `apps/front/src/components/ocean-shapes/`
- Trait colors: CSS variables `--trait-*` from `packages/ui/src/styles/globals.css`
- No new packages required

### File Structure Requirements

```
apps/front/src/
  routes/
    profile.$publicProfileId.tsx   # MODIFY: full visual redesign + OG meta tags
  components/
    results/
      ShareProfileSection.tsx      # MODIFY: add social share buttons + privacy notice
    ocean-shapes/
      GeometricSignature.tsx       # USE (no changes)
      OceanCircle.tsx              # USE (no changes)
      OceanHalfCircle.tsx          # USE (no changes)
      OceanRectangle.tsx           # USE (no changes)
      OceanTriangle.tsx            # USE (no changes)
      OceanDiamond.tsx             # USE (no changes)
  hooks/
    use-profile.ts                 # USE (no changes)
```

### Testing Requirements

- Visual verification:
  - Public profile renders with semantic tokens (no hard-coded colors)
  - Archetype hero uses dominant trait color background
  - GeometricSignature displays correctly with ocean code
  - No facet-level data visible on public profile
  - OG meta tags present in SSR HTML

- Functional:
  - Copy link still works
  - Privacy toggle still works
  - Social share buttons open correct URLs with encoded parameters
  - "Discover Your Archetype" CTA links to `/`
  - Profile loads correctly for both public and private states

- Regression:
  - Results page share section still functions correctly
  - Profile generation from results page still works
  - Private profile shows lock screen

### OG Meta Implementation Pattern

```typescript
// In profile.$publicProfileId.tsx route definition
export const Route = createFileRoute("/profile/$publicProfileId")({
  component: ProfilePage,
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.archetypeName || 'Personality Profile'} | big-ocean` },
      { name: 'description', content: loaderData?.description || 'Discover your personality archetype with big-ocean.' },
      { property: 'og:title', content: `${loaderData?.archetypeName || 'Personality Profile'} | big-ocean` },
      { property: 'og:description', content: loaderData?.description || 'Discover your personality archetype with big-ocean.' },
      { property: 'og:type', content: 'profile' },
      { property: 'og:site_name', content: 'big-ocean' },
      { property: 'twitter:card', content: 'summary' },
      { property: 'twitter:title', content: `${loaderData?.archetypeName || 'Personality Profile'} | big-ocean` },
      { property: 'twitter:description', content: loaderData?.description || 'Discover your personality archetype with big-ocean.' },
    ],
  }),
});
```

**Note:** TanStack Start SSR meta requires data to be available at route level. If `head()` doesn't have access to async data from the component's `useGetPublicProfile()` hook, the implementation may need a route `loader` to fetch profile data server-side. Investigate whether the existing query hook data can be lifted to the route loader for SSR meta rendering.

### Social Share URL Patterns

```typescript
const shareText = encodeURIComponent(
  `I'm "${archetypeName}" — discover your personality archetype on big-ocean!`
);
const shareUrl = encodeURIComponent(profileUrl);

const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
```

### Trait Display Pattern for Public Profile

Use OCEAN shape components as visual markers instead of lucide icons:

```tsx
// Replace TRAIT_CONFIG icon mapping with OCEAN shapes
const TRAIT_SHAPE_MAP = {
  openness: OceanCircle,
  conscientiousness: OceanHalfCircle,
  extraversion: OceanRectangle,
  agreeableness: OceanTriangle,
  neuroticism: OceanDiamond,
};

// Render trait row with geometric shape
<div className="flex items-center gap-3">
  <ShapeComponent size={20} color={`var(--trait-${trait})`} />
  <span className="font-heading text-sm text-foreground">{label}</span>
  <span className="font-mono text-sm text-muted-foreground">{levelLabel}</span>
</div>
```

### Anti-Patterns (Do Not Do)

- Do not use hard-coded color classes (`bg-slate-*`, `text-blue-*`, `from-purple-*`, etc.)
- Facet-level details ARE shown on public profile (expandable per trait); only conversations and evidence are private
- Do not create new backend endpoints (all infrastructure exists from Epic 5)
- Do not use `data-testid` attributes (use `data-slot` per FRONTEND.md)
- Do not add new npm packages (use existing lucide-react icons + OCEAN shapes)
- Do not use generic `Waves` icon for profile avatar (use `GeometricSignature`)
- Do not link CTA to `/chat` (link to home page `/` for viral loop)
- Do not break existing copy link or privacy toggle functionality

### Previous Story Intelligence

- **From Story 7.11 (review):**
  - Auth gate implemented at results entry; public profile does NOT require auth (correct)
  - Session linking infrastructure works for both sign-up and sign-in paths
  - `data-slot` discipline and semantic token usage are enforced requirements

- **From Story 7.9 (done):**
  - Results page has `ArchetypeHeroSection` with depth zone design pattern
  - Archetype theming uses dominant trait color for hero background
  - `display-hero` typography class used for archetype name (56-64px Space Grotesk)
  - OCEAN shapes used as chart markers in trait sections

- **From Stories 7.4/7.5:**
  - GeometricSignature accepts `oceanCode` and renders 5 sized shapes
  - Trait color CSS variables defined: `--trait-openness`, `--trait-conscientiousness`, etc.
  - Trait accent colors and gradients available for rich visual treatment

- **From Story 5.2 (done):**
  - Public profile route, hooks, and backend all fully functional
  - Default privacy is private (must toggle to public)
  - UUID-based share IDs (no encryption needed)
  - Profile includes facet data — now shown publicly in expandable trait sections

### Git Intelligence Summary

Recent commits:
- `9c8c89f feat(story-7-10): assessment chat depth journey with immersive zone transitions (#47)`
- `80defdc feat(story-7-8): conversation-driven homepage with depth scroll journey (#46)`
- `e984962 feat(story-7-15): auth form psychedelic brand redesign + accessibility fixes (#45)`

Pattern: Large frontend-focused commits with explicit story tags. Brand redesign stories follow a consistent pattern of replacing hard-coded colors with semantic tokens and adding `data-slot` attributes.

### Latest Tech Information

| Technology | Repo Version | Guidance For Story 7.12 |
|-----------|--------------|---------------------------|
| `@tanstack/react-router` | `^1.132.0` | Use `head()` in `createFileRoute` for SSR meta tags. No upgrade needed. |
| `react` | `^19.2.0` | No changes needed. |
| `tailwindcss` | `^4.0.6` | Continue semantic token classes. |
| `lucide-react` | installed | Use for social share icons (Twitter/X, Facebook, LinkedIn) alongside OCEAN shapes. |

### Project Context Reference

- Story context derived from epics, UX explorations, architecture docs, previous implementation artifacts, and live codebase analysis.
- Share card UX explorations at `_bmad-output/ux-explorations/share-card-directions/` provide visual direction references (16 variants across 8 directions).

### References

- `_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md` (Story 7.12 requirements)
- `_bmad-output/ux-explorations/share-card-directions/` (16 UX direction mockups)
- `apps/front/src/routes/profile.$publicProfileId.tsx` (existing public profile page - redesign target)
- `apps/front/src/components/results/ShareProfileSection.tsx` (existing share panel - enhance target)
- `apps/front/src/components/ocean-shapes/GeometricSignature.tsx` (reusable signature component)
- `apps/front/src/hooks/use-profile.ts` (profile data hooks)
- `apps/front/src/components/results/ArchetypeHeroSection.tsx` (design reference for hero treatment)
- `packages/ui/src/styles/globals.css` (semantic color tokens, trait colors)
- `docs/FRONTEND.md` (data-slot conventions, component patterns)
- `packages/contracts/src/http/groups/profile.ts` (API contract - no changes needed)
- `packages/infrastructure/src/db/drizzle/schema.ts` (public_profile table - no changes needed)

## Story Completion Status

- Story context document created with exhaustive epic/UX/architecture/codebase intelligence.
- Status set to **ready-for-dev**.
- Completion note: **Ultimate context engine analysis completed - comprehensive developer guide created**.

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

None

### Completion Notes List

- **Task 1 (Profile Redesign):** Complete rewrite of `profile.$publicProfileId.tsx`. Replaced all hard-coded slate/blue/gray/purple colors with semantic tokens (bg-background, text-foreground, border-border, bg-card). Replaced Waves icon with GeometricSignature component. Added dominant trait color hero background using same pattern as ArchetypeHeroSection. Used OCEAN shape components (OceanCircle, OceanHalfCircle, OceanRectangle, OceanTriangle, OceanDiamond) as trait markers in summary. Applied font-display typography for archetype name. Removed facet-level expansion entirely. Added data-slot attributes throughout. Updated CTA to "Discover Your Archetype" linking to `/`. Created getDominantTrait utility function using BIG_FIVE_TRAITS from domain.

- **Task 2 (OG Meta Tags):** Added route `loader` for server-side profile data fetching (required for `head()` to access profile data). Added `head()` function with og:title, og:description, og:url, og:type, og:site_name, twitter:card, twitter:title, twitter:description. Graceful fallback if loader fails (returns null profile, uses FALLBACK_TITLE/FALLBACK_DESCRIPTION). Uses params.publicProfileId to construct canonical URL with SSR safety check.

- **Task 3 (Social Share Buttons):** Added `archetypeName` optional prop to ShareProfileSection. Added inline SVG icon components (TwitterIcon, FacebookIcon, LinkedInIcon). Added handleSocialShare function opening share URLs via window.open. Added privacy notice text. Changed data-testid to data-slot attributes. Used semantic color tokens (text-success). Added min-h-[44px] for touch targets. Updated results page to pass archetypeName prop.

- **Task 4 (Viral Loop CTA):** Implemented as part of Task 1. "Discover Your Archetype" CTA links to `/` with brand styling. No auth required to view.

- **Task 5 (Validation):** All 160 tests pass (14 test files). Lint passes clean. No regressions introduced.

### Change Log

- 2026-02-15: Story 7.12 implementation complete — public profile redesign with psychedelic brand identity, OG meta tags, social share buttons, viral loop CTA

### File List

- `apps/front/src/routes/profile.$publicProfileId.tsx` (MODIFIED — complete visual redesign + OG meta tags + loader)
- `apps/front/src/components/results/ShareProfileSection.tsx` (MODIFIED — social share buttons + privacy notice + data-slot)
- `apps/front/src/routes/results/$sessionId.tsx` (MODIFIED — pass archetypeName to ShareProfileSection, use Link for navigation buttons)
- `apps/front/src/routes/results-session-route.test.tsx` (MODIFIED — added Link to @tanstack/react-router mock)
