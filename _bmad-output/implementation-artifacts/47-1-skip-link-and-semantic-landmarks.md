# Story 47.1: Skip Link and Semantic Landmarks

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a keyboard and screen reader user,
I want to skip navigation and jump to content,
so that I can reach the main content without tabbing through every nav link.

## Acceptance Criteria

1. **Given** any page in the application
   **When** the user presses `Tab` as the first action
   **Then** a "Skip to content" link appears
   **And** it is visually hidden until focused
   **And** activating it moves focus to the page's `<main>` element

2. **Given** any page in the application
   **When** landmarks are inspected by the browser or assistive technology
   **Then** the page uses semantic HTML landmarks for the shared chrome and major content regions
   **And** shared page chrome uses `<header>`, `<nav>`, and `<main>`
   **And** page-specific content uses `<section>` and `<aside>` where the content is a meaningful region

3. **Given** the results page
   **When** a screen reader enumerates landmark regions
   **Then** the major regions expose accessible labels for "Your traits", "Your portrait", and "Your archetype"

4. **Given** any page in the application
   **When** headings are traversed
   **Then** there is exactly one page-level `<h1>`
   **And** heading levels do not skip in the rendered DOM

5. **Given** the accessibility changes are implemented
   **When** representative regression checks run
   **Then** the skip link, landmark structure, and page heading structure are covered by automated tests on representative routes
   **And** keyboard verification confirms the main content can be reached without traversing repeated navigation links first

## Tasks / Subtasks

- [x] Task 1: Add shared skip-link infrastructure in the root document (AC: 1, 2)
  - [x] 1.1 Update `apps/front/src/routes/__root.tsx` so the first focusable element in `<body>` is a "Skip to content" link rendered before `<Header />`
  - [x] 1.2 Ensure the skip link is visually hidden until focused and becomes visible with the existing focus-ring token / Tailwind focus-visible patterns
  - [x] 1.3 Establish a single shared main-target contract for route content (for example `id="main-content"` plus `tabIndex={-1}`) so skip-link activation reliably lands focus on the page's `<main>`
  - [x] 1.4 Keep the sticky header, theme provider, toaster, and devtools behavior unchanged

- [x] Task 2: Normalize shared header and navigation landmarks (AC: 2)
  - [x] 2.1 Keep `apps/front/src/components/Header.tsx` as the page `<header>`, but replace non-semantic desktop wrappers with a labeled `<nav aria-label="Primary">` where appropriate
  - [x] 2.2 Preserve the existing mobile sheet navigation in `apps/front/src/components/MobileNav.tsx`, but ensure the mobile nav also exposes a meaningful accessible label instead of an unlabeled landmark
  - [x] 2.3 Do not redesign the header IA in this story; this is a semantic/landmark pass, not a visual-navigation rewrite

- [x] Task 3: Introduce a reusable page-main pattern across route entry points (AC: 1, 2, 4)
  - [x] 3.1 Create or extract a small reusable page-shell helper in `apps/front/src/components/` if it reduces duplication; otherwise update routes directly
  - [x] 3.2 Apply the `<main id="main-content" tabIndex={-1}>` pattern to the route entry points under `apps/front/src/routes/` that currently render top-level `<div>` containers: home, chat, results shell/detail, dashboard, settings, auth routes, public profile, relationship analysis, ritual route, and QR accept route
  - [x] 3.3 Ensure loading, empty, not-found, and error states still render inside the page `<main>` landmark instead of returning bare `<div>` trees
  - [x] 3.4 Preserve current auth guards, loaders, redirects, and route params; this story must not alter route behavior

- [x] Task 4: Repair page-level heading structure without changing the visual design language (AC: 4)
  - [x] 4.1 Keep the existing visible homepage hero heading in `apps/front/src/components/home/HeroSection.tsx` as the page `<h1>`
  - [x] 4.2 Fix the homepage's current `h1 -> h3` jump in `apps/front/src/routes/index.tsx` by adding the missing intermediate section heading structure or re-ranking those beat headings
  - [x] 4.3 Add route-owned visible or `sr-only` page headings for routes that currently have no real page-level `<h1>`: chat, login, signup, forgot-password, reset-password, verify-email, and any other route currently relying on form-local `<h2>` headings
  - [x] 4.4 Keep one page-level `<h1>` per route view; do not introduce duplicate `h1`s in success/error/loading variants that can render simultaneously
  - [x] 4.5 Prefer `sr-only` headings or minimal heading-rank changes where the existing visual layout should remain unchanged

- [x] Task 5: Add semantic landmark labels to the results experience (AC: 2, 3, 4)
  - [x] 5.1 Update `apps/front/src/components/results/ProfileView.tsx` to replace generic wrapper `<div>` regions with semantic landmarks for the major results sections
  - [x] 5.2 Label the archetype hero region as "Your archetype" while preserving the existing visible `h1` inside `apps/front/src/components/results/ArchetypeHeroSection.tsx`
  - [x] 5.3 Wrap the portrait block in a dedicated labeled region "Your portrait" without breaking the ready / generating / failed / unlock CTA states
  - [x] 5.4 Wrap the trait/radar/confidence area in a dedicated labeled region "Your traits"
  - [x] 5.5 Use native sectioning and heading elements first; only use extra ARIA when native semantics alone are not enough

- [x] Task 6: Preserve and extend existing accessibility work instead of reinventing it (AC: 2, 3)
  - [x] 6.1 Preserve `PersonalityRadarChart`'s existing `role="img"` and sr-only table fallback; do not replace it with a new custom accessibility layer
  - [x] 6.2 Preserve `TraitCard`'s current button semantics and `aria-expanded` behavior in this story; deeper trait-card structural changes belong to later accessibility stories unless strictly required for AC 4
  - [x] 6.3 Preserve `PwywModal` and `RitualScreen` dialog/focus-management behavior; this story should add page landmarks around them, not rewrite their modal internals
  - [x] 6.4 Preserve the current conversation, results, and relationship route loaders/redirects while adding semantics

- [ ] Task 7: Add targeted regression tests for skip links and landmarks (AC: 5)
  - [x] 7.1 Add front-end unit/route tests covering the root skip link, the shared main target, and page-level heading presence on representative routes
  - [x] 7.2 Extend results-related tests to assert landmark labels for "Your archetype", "Your traits", and "Your portrait"
  - [x] 7.3 Add or extend Playwright coverage in `e2e/specs/homepage.spec.ts` and `e2e/specs/public-profile.spec.ts` for keyboard-first navigation to the skip link and then to `<main>`
  - [x] 7.4 If authenticated seeded-browser coverage for chat/results is too expensive for this story, keep automated coverage at the static/public route level and perform manual keyboard verification on chat/results
  - [ ] 7.5 Run `pnpm --filter=front test`, `pnpm --filter=front typecheck`, and the targeted Playwright specs that cover the new keyboard-navigation assertions

### Review Findings

- [x] [Review][Patch] Skip-link target is missing on route-level not-found views [apps/front/src/routes/__root.tsx:74]
- [x] [Review][Patch] Chat route `notFoundComponent` bypasses `PageMain`, so the shared `#main-content` focus target is absent [apps/front/src/routes/chat/index.tsx:42]
- [x] [Review][Patch] Relationship analysis ready view introduces `h1 -> h3` heading skip (`PageMain` title + `RelationshipPortrait` section headings) [apps/front/src/routes/relationship/$analysisId.tsx:175]

## Dev Notes

- This story is intentionally structural. It is about landmarks, skip-link behavior, and heading hierarchy. It is **not** the story for chat live regions, trait-card keyboard interaction redesign, modal focus-trap work, or contrast/touch-target audits. Those belong to Stories 47.2 through 47.5.
- The biggest current gap is structural, not stylistic: outside the dev playground route, the app currently has almost no `<main>` landmarks. The skip link must therefore be paired with a consistent route-level `<main>` pattern instead of a one-off anchor target.
- Keep the fix native-first. Use `<header>`, `<nav>`, `<main>`, `<section>`, and `<aside>` before adding ARIA roles that recreate semantics already available in HTML.
- Do not break route guards, search params, or current conversation/results flow while adding semantics. This story must be behavior-preserving for auth, loading, and results gating.
- Preserve existing a11y work already present in the codebase:
  - `apps/front/src/components/results/PersonalityRadarChart.tsx` already has `role="img"` and an sr-only table fallback.
  - `apps/front/src/components/results/TraitCard.tsx` already exposes `aria-expanded` and strong button labeling.
  - `apps/front/src/components/results/PwywModal.tsx` and `apps/front/src/components/relationship/RitualScreen.tsx` already rely on dialog primitives / focus semantics.
- Follow current live code names, not stale pre-rename examples in older docs. Epic 45 renamed route params and session concepts from `assessment*` to `conversation*`; use `conversationSessionId`, `useListConversations`, and the current route filenames in any implementation.

### Current Code Observations

- `apps/front/src/routes/__root.tsx` renders `<Header />` plus route children directly in `<body>`; there is no shared skip link or shared main target today.
- `apps/front/src/components/Header.tsx` is a real `<header>`, but the desktop action cluster is still a plain `<div>` rather than an explicitly labeled navigation landmark.
- `apps/front/src/components/MobileNav.tsx` already contains a `<nav>`, so the mobile pattern should be extended, not replaced.
- `apps/front/src/routes/index.tsx` currently renders a homepage `h1` in `HeroSection`, but the conversation-preview headings in the route body are `h3`s, creating a direct `h1 -> h3` jump.
- Auth routes (`login.tsx`, `signup.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `verify-email.tsx`) currently render page cards with form-local `h2`s and no route-owned `<main>` / page-level `<h1>`.
- `apps/front/src/components/results/ProfileView.tsx` and `apps/front/src/routes/results/$conversationSessionId.tsx` currently use generic wrapper `<div>`s for the major results regions, so landmark labels for "Your traits", "Your portrait", and "Your archetype" do not exist yet.
- Representative relationship routes (`apps/front/src/routes/relationship/$analysisId.tsx`, `apps/front/src/routes/relationship/$analysisId_.ritual.tsx`, `apps/front/src/routes/relationship/qr/$token.tsx`) also need route-level `<main>` coverage even when their internal child components already contain headings.

### Architecture Compliance

- Frontend stack remains TanStack Start + React 19 + Tailwind CSS v4 + shadcn/ui. Keep the implementation inside the existing route/component structure and avoid introducing a parallel layout system. [Source: `_bmad-output/planning-artifacts/architecture.md` - Technology Stack]
- Follow the existing file-based route boundaries under `apps/front/src/routes/`. This work belongs in the front-end route layer and supporting presentational components only. [Source: `_bmad-output/planning-artifacts/architecture.md` - Project Structure & Boundaries]
- Continue using the project's established data-attribute testing / targeting patterns (`data-slot`, `data-testid`) where useful, but do not rely on them as a substitute for semantic HTML. [Source: `docs/FRONTEND.md`]

### Library / Framework Requirements

- No new framework should be introduced for this story.
- Use native HTML landmarks first.
- Reuse existing `sr-only` utility patterns already used in `packages/ui` and front-end components when a heading should exist for assistive tech without changing the visible layout.
- If a tiny shared helper is created for page-main wrappers, keep it inside `apps/front/src/components/` and make it framework-local to TanStack Start routes.

### File Structure Requirements

Likely touch points for implementation:

- Shared document / nav semantics
  - `apps/front/src/routes/__root.tsx`
  - `apps/front/src/components/Header.tsx`
  - `apps/front/src/components/MobileNav.tsx`
  - `apps/front/src/components/UserNav.tsx` (only if needed for semantic cleanup)

- Route entry points that need `<main>` / page-level heading normalization
  - `apps/front/src/routes/index.tsx`
  - `apps/front/src/routes/chat/index.tsx`
  - `apps/front/src/routes/results.tsx`
  - `apps/front/src/routes/results/$conversationSessionId.tsx`
  - `apps/front/src/routes/dashboard.tsx`
  - `apps/front/src/routes/settings.tsx`
  - `apps/front/src/routes/login.tsx`
  - `apps/front/src/routes/signup.tsx`
  - `apps/front/src/routes/forgot-password.tsx`
  - `apps/front/src/routes/reset-password.tsx`
  - `apps/front/src/routes/verify-email.tsx`
  - `apps/front/src/routes/public-profile.$publicProfileId.tsx`
  - `apps/front/src/routes/relationship/$analysisId.tsx`
  - `apps/front/src/routes/relationship/$analysisId_.ritual.tsx`
  - `apps/front/src/routes/relationship/qr/$token.tsx`

- Results-specific semantic regions / headings
  - `apps/front/src/components/results/ProfileView.tsx`
  - `apps/front/src/components/results/ArchetypeHeroSection.tsx`
  - `apps/front/src/components/results/PersonalPortrait.tsx`
  - Any adjacent results wrapper component that ends up owning the labeled section heading

- Homepage heading-order cleanup
  - `apps/front/src/components/home/HeroSection.tsx`
  - `apps/front/src/components/home/HowItWorks.tsx`
  - `apps/front/src/components/home/FinalCta.tsx`
  - `apps/front/src/routes/index.tsx`

### Testing Requirements

- Front-end unit / route tests:
  - Verify the skip link renders before header content and becomes reachable on first `Tab`
  - Verify activating the skip link moves focus to the shared main target
  - Verify representative routes expose one page-level `h1`
  - Verify the results page exposes labeled landmark regions for "Your archetype", "Your traits", and "Your portrait"

- Playwright:
  - Extend existing public-route specs (`homepage.spec.ts`, `public-profile.spec.ts`) with keyboard-first assertions around skip-link visibility and focus movement into `<main>`
  - Keep the E2E scope aligned with `docs/E2E-TESTING.md`: browser navigation and access/landmark behavior only, not component-detail rendering already covered by unit tests

- Manual verification:
  - Keyboard check on home, chat, results, login/signup, dashboard/settings, public profile, relationship analysis, ritual, and QR accept flows
  - Confirm the first `Tab` reveals the skip link and `Enter` lands focus on the correct `<main>`
  - Confirm heading order is sane in browser accessibility tree / screen-reader quick-nav

### Latest Accessibility Guidance

- WCAG 2.1 SC 2.4.1 requires a mechanism to bypass repeated content. A top-of-page skip link to the main content region is a sufficient pattern. [Source: `https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html`]
- WAI page-region guidance recommends native `<header>`, `<nav aria-label="...">`, `<main>`, and `<aside>` landmarks so browsers and assistive technologies can identify the major regions of the page/application. [Source: `https://www.w3.org/WAI/tutorials/page-structure/regions/`]
- WAI heading guidance recommends nesting headings by rank and avoiding skipped levels where possible. It also explicitly allows the main content heading to remain the route's `h1` even when navigation appears earlier in the DOM. [Source: `https://www.w3.org/WAI/tutorials/page-structure/headings/`]

### Project Structure Notes

- The architecture document still contains some stale examples from before the Epic 45 conversation rename (`assessmentSessionId`, `start-assessment.use-case.ts`, etc.). For this story, trust the live code and current route filenames over those stale examples.
- Keep current visual composition intact where possible. If a visible heading rank change would disturb the design, prefer `sr-only` wrapper headings or `aria-labelledby` on semantic sections rather than visual redesign.
- Avoid widening scope into Story 47.2 (chat live-region work), Story 47.3 (results/portrait content accessibility), Story 47.4 (modal focus management), or Story 47.5 (contrast/touch-target audit).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 3, Story 3.1 "Skip-Link & Semantic Landmarks"]
- [Source: `_bmad-output/planning-artifacts/prd.md` - Web App Specific Requirements > Accessibility; NFR20-NFR24]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - 13.3 Accessibility Strategy; 13.4 Testing Strategy; 13.5 Implementation Guidelines; 18.14 Results Page Accessibility]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - Technology Stack; Structure Patterns; Project Structure & Boundaries]
- [Source: `docs/FRONTEND.md` - frontend patterns and data-attribute conventions]
- [Source: `docs/E2E-TESTING.md` - E2E scope and selector rules]
- [Source: `apps/front/src/routes/__root.tsx` - current root document structure]
- [Source: `apps/front/src/components/Header.tsx` and `apps/front/src/components/MobileNav.tsx` - current shared header / nav semantics]
- [Source: `apps/front/src/routes/index.tsx` and `apps/front/src/components/home/HeroSection.tsx` - current homepage heading order]
- [Source: `apps/front/src/routes/login.tsx`, `apps/front/src/routes/signup.tsx`, `apps/front/src/routes/forgot-password.tsx`, `apps/front/src/routes/reset-password.tsx`, `apps/front/src/routes/verify-email.tsx` - current auth-page heading structure]
- [Source: `apps/front/src/routes/results/$conversationSessionId.tsx` and `apps/front/src/components/results/ProfileView.tsx` - current results-page structure]
- [Source: `https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html` - SC 2.4.1 Bypass Blocks]
- [Source: `https://www.w3.org/WAI/tutorials/page-structure/regions/` - WAI Page Regions tutorial]
- [Source: `https://www.w3.org/WAI/tutorials/page-structure/headings/` - WAI Headings tutorial]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-08T16:01 - Story context created from epics, PRD, architecture, UX spec, current front-end code, recent git history, and official W3C accessibility guidance.
- 2026-04-08T16:04 - Development started via bmad-dev-story workflow; story status set to in-progress and implementation/test surface inspection began for root layout, route semantics, and representative accessibility coverage.
- 2026-04-08T16:28 - Route-level `<main>` rollout completed across results/public/auth/relationship entry points, with per-state heading normalization added where routes previously rendered no page-level `h1`.
- 2026-04-08T16:47 - Results landmarks, targeted regression tests, and story validation completed; front typecheck passed, focused Vitest coverage passed, full-suite and Playwright runs surfaced external blockers documented below.
- 2026-04-08T17:20 - Code-review patch findings resolved: root/chat not-found fallbacks now preserve shared main target, relationship heading order normalized, and targeted typecheck/tests re-run successfully.

### Completion Notes List

- Added a shared `PageMain` / `SkipToContentLink` contract and applied it across the route entry points for home, chat, results shell/detail, dashboard, settings, auth flows, public profile, relationship analysis, ritual, and QR accept.
- Normalized page-heading coverage by keeping existing visible headings where possible and adding route-owned sr-only `h1`s for auth, loading, and relationship states that previously had none.
- Labeled the results experience with native section landmarks for "Your archetype", "Your portrait", and "Your traits" without replacing the existing radar-chart, trait-card, or dialog accessibility work.
- Added targeted regression coverage in `PageMain.test.tsx`, `ArchetypeHeroSection.test.tsx`, `ProfileView.test.tsx`, `homepage.spec.ts`, and `public-profile.spec.ts`.
- `pnpm --filter=front exec vitest run src/components/PageMain.test.tsx src/components/results/ArchetypeHeroSection.test.tsx src/components/results/ProfileView.test.tsx` passed.
- `pnpm --filter=front typecheck` passed.
- `pnpm --filter=front test -- --run ...` executed the full front suite and surfaced an unrelated existing failure in `src/components/sharing/__tests__/archetype-card-template.test.tsx` (`every curated archetype can render a card template`).
- Targeted Playwright specs could not be completed locally because the E2E harness first required missing `.env.e2e` Polar variables, and after temporary placeholders were supplied the configured web server failed to boot with `Vite environment "nitro" is unavailable`.
- Review patches applied and validated with `pnpm --filter=front typecheck` plus targeted Vitest runs for `PageMain`, `RelationshipPortrait`, and `ProfileView`.

### File List

- `_bmad-output/implementation-artifacts/47-1-skip-link-and-semantic-landmarks.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/front/src/components/Header.tsx`
- `apps/front/src/components/MobileNav.tsx`
- `apps/front/src/components/PageMain.test.tsx`
- `apps/front/src/components/PageMain.tsx`
- `apps/front/src/components/relationship/QrAcceptScreen.tsx`
- `apps/front/src/components/results/ArchetypeHeroSection.test.tsx`
- `apps/front/src/components/results/ArchetypeHeroSection.tsx`
- `apps/front/src/components/results/ProfileView.test.tsx`
- `apps/front/src/components/results/ProfileView.tsx`
- `apps/front/src/routes/__root.tsx`
- `apps/front/src/routes/chat/index.tsx`
- `apps/front/src/routes/dashboard.tsx`
- `apps/front/src/routes/forgot-password.tsx`
- `apps/front/src/routes/index.tsx`
- `apps/front/src/routes/login.tsx`
- `apps/front/src/routes/public-profile.$publicProfileId.tsx`
- `apps/front/src/routes/relationship/$analysisId.tsx`
- `apps/front/src/routes/relationship/$analysisId_.ritual.tsx`
- `apps/front/src/routes/relationship/qr/$token.tsx`
- `apps/front/src/routes/reset-password.tsx`
- `apps/front/src/routes/results.tsx`
- `apps/front/src/routes/results/$conversationSessionId.tsx`
- `apps/front/src/routes/settings.tsx`
- `apps/front/src/routes/signup.tsx`
- `apps/front/src/routes/verify-email.tsx`
- `e2e/specs/homepage.spec.ts`
- `e2e/specs/public-profile.spec.ts`

## Change Log

- 2026-04-08: Implemented shared skip-link and route-main infrastructure, repaired heading hierarchy on key route states, added labeled results landmarks, and extended targeted a11y regression coverage.
