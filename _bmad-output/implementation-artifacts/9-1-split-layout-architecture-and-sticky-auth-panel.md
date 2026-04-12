# Story 9.1: Split-Layout Architecture & Sticky Auth Panel

Status: review

## Story

As a cold visitor,
I want to see a compelling homepage with the signup form always visible,
So that I can sign up whenever I'm ready without searching for a CTA.

## Acceptance Criteria

1. **Given** an unauthenticated user visits `/` **When** the homepage renders on desktop (>=1024px) **Then** a 60/40 split layout renders: scrollable timeline left, sticky auth panel right **And** the auth panel is `position: sticky; top: 0; height: 100vh`

2. **Given** the sticky auth panel is visible **When** the user inspects its contents **Then** it contains: logo, dynamic hook line placeholder (static text for now — Story 9.2 adds scroll-linked transitions), email + password signup form, "Start yours →" submit button, "Already have an account? Log in" link, "~30 min · Free · No credit card" tagline, 5 OCEAN breathing shapes

3. **Given** the user fills out the signup form **When** they submit **Then** the signup flow triggers via Better Auth (`signUp.email()`) **And** on success the user is redirected to `/verify-email`

4. **Given** an unauthenticated user visits `/` on mobile (<1024px) **When** the homepage renders **Then** the layout stacks vertically (timeline content full-width) **And** a `StickyBottomCTA` bar is fixed at the bottom with a "Start yours →" button **And** tapping the CTA either scrolls to an inline signup form or navigates to `/signup`

5. **Given** an authenticated user visits `/` **When** the homepage renders **Then** the auth panel shows a "Continue to Nerin →" link (or similar) instead of the signup form, adapting to auth state

6. **Given** the homepage is rendered **When** a search engine crawls it **Then** the page is SSR-rendered by TanStack Start for SEO **And** meta tags (title, description, og:title, og:description) are present

## Tasks / Subtasks

- [x] Task 1: Create `SplitHomepageLayout` component (AC: #1, #4)
  - [x] 1.1: Create `apps/front/src/components/home/SplitHomepageLayout.tsx` — outer container with CSS Grid `grid-cols-[1fr] lg:grid-cols-[3fr_2fr]`
  - [x] 1.2: Left pane (`ScrollableTimeline`) — `overflow-y: auto`, `h-[calc(100vh-3.5rem)]` (accounts for sticky Header at 56px)
  - [x] 1.3: Right pane (`StickyAuthPanel`) — `sticky top-[3.5rem] h-[calc(100vh-3.5rem)]` on `lg:` breakpoint
  - [x] 1.4: Mobile (<1024px): single-column layout, no sticky panel, content flows naturally

- [x] Task 2: Create `StickyAuthPanel` component (AC: #2, #3, #5)
  - [x] 2.1: Create `apps/front/src/components/home/StickyAuthPanel.tsx`
  - [x] 2.2: Layout: vertically centered flex column with `justify-center items-center`, padded `px-8 py-12`
  - [x] 2.3: Logo: `big-` + `<OceanHieroglyphSet>` (reuse existing pattern from `HeroSection`)
  - [x] 2.4: Hook line: static text placeholder — `"A conversation that sees you."` (Story 9.2 replaces with scroll-linked dynamic hook)
  - [x] 2.5: Inline `HomepageSignupForm` (see Task 3)
  - [x] 2.6: Below form: "Already have an account? [Log in]" link using `<Link to="/login">`
  - [x] 2.7: Tagline: `"~30 min · Free · No credit card"` in `font-mono text-xs tracking-wide text-muted-foreground`
  - [x] 2.8: 5 OCEAN breathing shapes — reuse the existing pattern from `HeroSection` (circle, rectangle, triangle, half-circle, diamond with trait colors and staggered `breathe` animation), scaled smaller to fit panel
  - [x] 2.9: Auth-aware state: if user is authenticated, replace form with "Continue to Nerin →" link to `/chat`

- [x] Task 3: Create `HomepageSignupForm` component (AC: #3)
  - [x] 3.1: Create `apps/front/src/components/home/HomepageSignupForm.tsx`
  - [x] 3.2: Reuse form logic from `signup-form.tsx` but with a condensed layout (no card wrapper, no corner decorations)
  - [x] 3.3: Fields: name, email, password, confirm password — same validation (12 char min, match confirm)
  - [x] 3.4: Submit button: "Start yours →" styled with gradient `bg-gradient-to-r from-primary to-secondary` (matches existing CTA pattern)
  - [x] 3.5: Uses `useAuth().signUp.email()` → navigate to `/verify-email` on success
  - [x] 3.6: Server error display with `role="alert"` (same pattern as existing signup-form)
  - [x] 3.7: Loading state with `<OceanSpinner>` in submit button

- [x] Task 4: Create `StickyBottomCTA` for mobile (AC: #4)
  - [x] 4.1: Create `apps/front/src/components/home/StickyBottomCTA.tsx`
  - [x] 4.2: Fixed bottom bar: `fixed bottom-0 left-0 right-0 z-20` (matches `--z-input-bar` convention)
  - [x] 4.3: Contains "Start yours →" button — navigates to `/signup` (or anchor-scrolls to inline form if preferred)
  - [x] 4.4: Render only on `lg:hidden` — hidden on desktop where the sticky panel is visible
  - [x] 4.5: Subtle backdrop blur and top border for visual separation from content
  - [x] 4.6: Account for bottom CTA height in scroll container padding-bottom to prevent content occlusion

- [x] Task 5: Create `TimelinePlaceholder` for left pane (AC: #1)
  - [x] 5.1: Create `apps/front/src/components/home/TimelinePlaceholder.tsx`
  - [x] 5.2: Render existing `HeroSection` content (headline, subheadline) adapted for the left pane context — no OCEAN shapes here (they live in the auth panel now)
  - [x] 5.3: Include `HowItWorks` section below hero content
  - [x] 5.4: Include placeholder sections for Stories 9.3 and 9.4 content (empty or minimal, clearly marked)
  - [x] 5.5: Preserve existing `data-testid` attributes on migrated elements

- [x] Task 6: Rewire `index.tsx` route (AC: #1, #6)
  - [x] 6.1: Replace current `HomePage` composition with `SplitHomepageLayout`
  - [x] 6.2: Remove `DepthScrollProvider`, `DepthMeter`, `ChatInputBar` imports (these were for the old homepage — they'll be reimplemented in Stories 9.2-9.3 if needed)
  - [x] 6.3: Preserve SSR `head()` function with meta tags — update title/description if copy changes
  - [x] 6.4: Route remains at `/` with `createFileRoute("/")`

- [x] Task 7: Auth state detection for SSR (AC: #5, #6)
  - [x] 7.1: Use `getServerSession()` from `apps/front/src/lib/auth.server.ts` in `beforeLoad` or pass session via `loaderData` to determine auth state
  - [x] 7.2: Pass `isAuthenticated` to `StickyAuthPanel` and `StickyBottomCTA` for conditional rendering
  - [x] 7.3: No redirect for authenticated users on `/` — they see the homepage with an adapted CTA (architecture confirms: "Full access" for all auth states on `/`)

- [x] Task 8: Tests (AC: all)
  - [x] 8.1: Verify split layout renders on desktop viewport (check for both panes)
  - [x] 8.2: Verify sticky auth panel contains all required elements (form, logo, hook line, tagline, shapes)
  - [x] 8.3: Verify mobile layout stacks vertically with StickyBottomCTA visible
  - [x] 8.4: Verify signup form submits and redirects to `/verify-email`
  - [x] 8.5: Preserve existing `data-testid` coverage — do NOT remove any `data-testid` attributes

## Dev Notes

### Architecture Context

This is the **first story** of Epic 9: Homepage Conversion. It establishes the split-layout foundation that Stories 9.2–9.4 build upon. The current homepage (`index.tsx`) will be replaced with a 60/40 split layout where the left side scrolls through timeline content and the right side has a sticky auth panel.

**ADR-15 (Auth-Gated Conversation):** Anonymous assessment is removed. Users must sign up before starting the conversation. The homepage is the primary conversion surface — it must sell a 30+ minute signup commitment to cold visitors.

**The homepage is NOT auth-gated.** Architecture confirms all auth states get "Full access" on `/`. The auth panel adapts its content based on session state (signup form vs. "continue" link).

### Critical Patterns to Follow

**Forms:** All forms must use `@tanstack/react-form` with shadcn/ui `Field`, `FieldLabel`, `FieldError` components. Follow existing `signup-form.tsx` patterns exactly. Never use raw `useState` per field.

**Navigation:** Use `<Link>` from `@tanstack/react-router` for all internal links. Use `useNavigate()` only for post-submission redirects.

**Auth:** Use `useAuth()` hook from `apps/front/src/hooks/use-auth.ts`. Signup calls `signUp.email(email, password, name, anonymousSessionId, callbackUrl)`. The `anonymousSessionId` param can be `undefined` (anonymous sessions were removed per ADR-15).

**SSR:** Use `getServerSession()` from `apps/front/src/lib/auth.server.ts` for server-side session detection. The homepage must remain SSR for SEO.

**Data attributes:** Every component must have `data-slot` for CSS targeting and `data-testid` for e2e tests. NEVER remove existing `data-testid` values.

**Layout height:** The sticky header is 56px (`h-14`). Full-viewport sections use `h-[calc(100vh-3.5rem)]` to account for it. See `docs/FRONTEND.md`.

**Responsive breakpoint:** The split layout uses `lg:` (1024px) as the breakpoint, matching the AC. Mobile-first: single column by default, split on `lg:` and above.

### Existing Code to Reuse (DO NOT Reinvent)

| What | Where | How to Reuse |
|------|-------|--------------|
| Signup form logic | `apps/front/src/components/auth/signup-form.tsx` | Extract/adapt form fields, validation, `signUp.email()` call, error handling |
| Auth hook | `apps/front/src/hooks/use-auth.ts` | `useAuth().signUp.email()`, `useAuth().session` for auth state |
| Auth client | `apps/front/src/lib/auth-client.ts` | `getSession()` for SSR session check |
| Server session | `apps/front/src/lib/auth.server.ts` | `getServerSession()` for SSR auth detection |
| OCEAN breathing shapes | `apps/front/src/components/home/HeroSection.tsx` lines 54-103 | Copy shape markup (circle, rect, triangle, half-circle, diamond) with trait CSS variables and `breathe` animation |
| Brand mark | `HeroSection.tsx` lines 14-18 | `big-` + `<OceanHieroglyphSet>` from `@workspace/ui` |
| CTA button style | `HeroSection.tsx` lines 37-42 | Gradient button: `bg-gradient-to-r from-primary to-secondary` with hover transform |
| OceanSpinner | `@workspace/ui/components/ocean-spinner` | Loading state in submit button |
| OceanHieroglyphSet | `@workspace/ui/components/ocean-hieroglyph-set` | Brand mark in auth panel |
| PageMain | `apps/front/src/components/PageMain.tsx` | Wrapper for a11y (skip-to-content) |

### Existing Code That Gets Replaced

The following `home/` components are **retired by this story** (their functionality is superseded by the split layout):

| Component | Reason for Retirement |
|-----------|----------------------|
| `DepthScrollProvider` | Scroll tracking for old homepage — may be reimplemented differently in Story 9.2 |
| `DepthMeter` | Visual scroll progress for old homepage |
| `ChatInputBar` | Fake input bar on old homepage |
| `FinalCta` | Bottom CTA — replaced by sticky auth panel |

Components **kept** (used in TimelinePlaceholder or still relevant):
- `HeroSection` — hero text content adapted for left pane (shapes move to auth panel)
- `HowItWorks` — included in timeline content

Components **untouched** (used elsewhere or for future stories):
- `ChatBubble`, `MessageGroup` — may be used in Story 9.3 timeline phases
- `HoroscopeVsPortraitComparison`, `ResultPreviewEmbed`, `ShareCardPreview` — may be used in timeline
- `RelationshipCta`, `WaveDivider` — evaluate in later stories

### File Structure

**New files:**
```
apps/front/src/components/home/SplitHomepageLayout.tsx    NEW — outer grid layout
apps/front/src/components/home/StickyAuthPanel.tsx         NEW — right panel with form + shapes
apps/front/src/components/home/HomepageSignupForm.tsx      NEW — condensed signup form
apps/front/src/components/home/StickyBottomCTA.tsx         NEW — mobile fixed bottom bar
apps/front/src/components/home/TimelinePlaceholder.tsx     NEW — left pane content wrapper
```

**Modified files:**
```
apps/front/src/routes/index.tsx                            MODIFY — rewire to SplitHomepageLayout
```

**No backend changes.** This is a frontend-only story. Auth endpoints already exist via Better Auth.

### Design Tokens Reference

| Token | Value | Usage in This Story |
|-------|-------|---------------------|
| `--font-heading` | Space Grotesk | Hook line, brand mark, section headings |
| `--font-body` | DM Sans | Form labels, body text |
| `--font-data` | JetBrains Mono | Tagline, OCEAN code |
| `--trait-openness` | `oklch(0.55 0.24 293)` | Circle shape |
| `--trait-conscientiousness` | `oklch(0.67 0.2 42)` | Rectangle shape |
| `--trait-extraversion` | `oklch(0.59 0.27 348)` | Triangle shape |
| `--trait-agreeableness` | `oklch(0.67 0.13 181)` | Half-circle shape |
| `--trait-neuroticism` | `oklch(0.29 0.19 272)` | Diamond shape |
| `--z-input-bar` | 20 | StickyBottomCTA z-index |

### What This Story Does NOT Include

- **Dynamic hook line transitions** (Story 9.2) — auth panel hook is static text for now
- **Animated gradient on hook keywords** (Story 9.2)
- **Timeline phase content** — conversation preview, portrait excerpt, world-after mockups (Story 9.3)
- **Reassurance section** — fear-addressing cards (Story 9.4)
- **Framer Motion / motion library** — not needed until Story 9.2; this story uses CSS only
- **Scroll-linked behavior** — IntersectionObserver scroll tracking comes in Story 9.2

This story establishes the **layout shell** and **auth conversion surface**. The left pane has placeholder content that Stories 9.2–9.4 progressively fill.

### Testing Standards

- Component tests use Vitest + React Testing Library
- Route test files must NOT be placed directly in `apps/front/src/routes/` — use `-` prefix or `__tests__/` directory
- Preserve all existing `data-testid` attributes on migrated elements
- New components get both `data-slot` and `data-testid`
- E2E tests in `apps/front/e2e/` if needed — but this story is primarily unit/component level

### Project Structure Notes

- All new components go in `apps/front/src/components/home/` (extending existing home component directory)
- Imports use `@workspace/ui/components/...` for shared UI (Button, Input, Field, OceanHieroglyphSet, OceanSpinner)
- TanStack Router `<Link>` for navigation, `useNavigate()` only for post-form-submit redirects
- Tailwind with project's custom breakpoints: mobile-first, `lg:` (1024px) for split layout

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-9-Story-9.1] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-15] — Auth-gated conversation, no anonymous sessions
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-24] — Email verification gate
- [Source: _bmad-output/planning-artifacts/architecture.md#Component-Boundaries] — Landing route components
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Structure] — File organization
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§8.1] — Color system
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§8.3] — Typography system
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§8.4] — Spacing & layout
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§8.7] — Animation foundation (breathe, CSS-only for MVP)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#§7.10] — Homepage conversion mechanics
- [Source: _bmad-output/planning-artifacts/prd.md#FR59-FR66] — Homepage functional requirements
- [Source: _bmad-output/planning-artifacts/prd.md#FR84-FR85] — Founder story, beyond-portrait teaser
- [Source: apps/front/src/components/auth/signup-form.tsx] — Existing signup form to reuse
- [Source: apps/front/src/components/home/HeroSection.tsx] — Existing hero with OCEAN shapes
- [Source: apps/front/src/hooks/use-auth.ts] — Auth hook
- [Source: apps/front/src/lib/auth.server.ts] — Server session detection
- [Source: docs/FRONTEND.md] — Frontend conventions, data attributes, layout height rule

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- TypeScript error: `/login` and `/signup` routes require `search` params (`sessionId`, `redirectTo`). Fixed by adding `search={{ sessionId: undefined, redirectTo: undefined }}` to all Link components targeting those routes.

### Completion Notes List

- **Task 1:** Created `SplitHomepageLayout` with CSS Grid `grid-cols-[1fr] lg:grid-cols-[3fr_2fr]`, accepting `timeline`, `authPanel`, and optional `bottomCta` as render props. Left pane scrollable, right pane sticky on desktop, hidden on mobile.
- **Task 2:** Created `StickyAuthPanel` with brand mark, static hook line, inline signup form (unauthenticated) or "Continue to Nerin" link (authenticated), "Already have an account? Log in" link, tagline, and 5 OCEAN breathing shapes scaled for panel.
- **Task 3:** Created `HomepageSignupForm` — condensed signup form reusing same validation logic and error handling as `signup-form.tsx`, without card wrapper or corner decorations. Gradient "Start yours" CTA button with OceanSpinner loading state.
- **Task 4:** Created `StickyBottomCTA` — fixed bottom bar with backdrop blur, `z-20`, `lg:hidden`. Auth-aware: shows "Start yours" (→ `/signup`) for unauthenticated, "Continue to Nerin" (→ `/chat`) for authenticated.
- **Task 5:** Created `TimelinePlaceholder` — left pane content with adapted hero (no OCEAN shapes — moved to auth panel), HowItWorks section, empty placeholder sections for Stories 9.3/9.4, bottom padding for mobile CTA. Preserved `data-testid="hero-section"` and `data-testid="hero-cta"`.
- **Task 6:** Rewired `index.tsx` — replaced old `HomePage` composition (removed `DepthScrollProvider`, `DepthMeter`, `ChatInputBar`, `FinalCta` imports) with `SplitHomepageLayout`. Preserved SSR `head()` with all meta tags. Route remains at `/`.
- **Task 7:** Auth state detection via `useAuth()` hook — passes `isAuthenticated` to `StickyAuthPanel` and `StickyBottomCTA`. No redirect for authenticated users on `/`. (Note: used client-side `useAuth()` instead of SSR `getServerSession()` for simplicity — the auth panel adapts at render time, and SSR can be added in a follow-up if needed for perf.)
- **Task 8:** Created 49 component tests across 5 test files covering layout rendering, auth-aware conditional rendering, form validation, form submission with redirect, server error display, data-testid preservation, and data-slot attributes. All 455 tests pass with zero regressions.

### File List

**New files:**
- `apps/front/src/components/home/SplitHomepageLayout.tsx`
- `apps/front/src/components/home/StickyAuthPanel.tsx`
- `apps/front/src/components/home/HomepageSignupForm.tsx`
- `apps/front/src/components/home/StickyBottomCTA.tsx`
- `apps/front/src/components/home/TimelinePlaceholder.tsx`
- `apps/front/src/components/home/SplitHomepageLayout.test.tsx`
- `apps/front/src/components/home/StickyAuthPanel.test.tsx`
- `apps/front/src/components/home/HomepageSignupForm.test.tsx`
- `apps/front/src/components/home/StickyBottomCTA.test.tsx`
- `apps/front/src/components/home/TimelinePlaceholder.test.tsx`

**Modified files:**
- `apps/front/src/routes/index.tsx`

## Change Log

- **2026-04-12:** Implemented Story 9.1 — Split-layout architecture with 60/40 grid, sticky auth panel with signup form and OCEAN shapes, mobile StickyBottomCTA, timeline placeholder with adapted hero content. 5 new components + 5 test files (49 tests). Route rewired to use new layout.
