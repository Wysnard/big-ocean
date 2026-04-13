# Story 1.1: BottomNav Component & Three-Space Route Shells

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an authenticated user,
I want to see a persistent bottom navigation with Today / Me / Circle tabs,
So that I can move between the three spaces of the product.

## Acceptance Criteria

1. **Given** an authenticated user with a completed assessment
   **When** they visit any authenticated route (`/today`, `/me`, `/circle`)
   **Then** a persistent BottomNav renders at the bottom with three tabs: Today, Me, Circle
   **And** the active tab is highlighted based on the current route
   **And** tapping a tab navigates to the corresponding route using TanStack Router `<Link>`

2. **Given** the three-space navigation is rendered
   **When** the user is on desktop (`>=1024px`)
   **Then** the mobile BottomNav is replaced with a top-nav variant with the same three tabs
   **And** mobile BottomNav uses safe-area-inset-bottom padding on iOS

3. **Given** the user is on a focused or non-three-space route
   **When** they visit `/chat`, `/results/$id?view=portrait`, `/today/week/$weekId`, or `/settings`
   **Then** the BottomNav/top-nav variant is hidden

4. **Given** the three-space navigation exists
   **When** implementation is complete
   **Then** route shells exist for `/today` (placeholder), `/me` (placeholder), and `/circle` (placeholder)
   **And** `/settings` remains accessible via a gear icon from the Me page
   **And** each route shell has `beforeLoad` auth check redirecting unauthenticated users to `/login`

5. **Given** a user has just finished the assessment and enters the authenticated product world
   **When** their first post-assessment visit is resolved
   **Then** they are routed to `/me`
   **And** all subsequent authenticated default visits route to `/today`
   **And** the decision is backed by a server-side `first_visit_completed` flag on the user record

## Tasks / Subtasks

- [ ] Task 1: Create the reusable three-space navigation component (AC: #1, #2, #3)
  - [ ] 1.1 Create `apps/front/src/components/BottomNav.tsx` as the canonical three-tab nav component for authenticated product surfaces
  - [ ] 1.2 Implement shared tab config for `today`, `me`, and `circle` so mobile and desktop variants derive from one source of truth
  - [ ] 1.3 Use TanStack Router pathname matching to compute the active tab state
  - [ ] 1.4 Render a fixed mobile bottom nav with safe-area padding and a desktop top-nav variant shown only at `lg:` and above
  - [ ] 1.5 Add stable `data-slot` and `data-testid` attributes for the nav root, each tab, and the desktop variant

- [ ] Task 2: Add placeholder route shells for the three spaces (AC: #1, #4)
  - [ ] 2.1 Create `apps/front/src/routes/today/index.tsx`
  - [ ] 2.2 Create `apps/front/src/routes/me/index.tsx`
  - [ ] 2.3 Create `apps/front/src/routes/circle/index.tsx`
  - [ ] 2.4 Use the existing protected-route pattern from `apps/front/src/routes/dashboard.tsx` and `apps/front/src/routes/settings.tsx`: `beforeLoad` with `getSession()` redirecting unauthenticated users to `/login`
  - [ ] 2.5 Render route-specific placeholder content that teaches the three-space model instead of a generic "coming soon" blank page
  - [ ] 2.6 Ensure Me includes a visible gear icon link to `/settings`
  - [ ] 2.7 Use folder-based route structure (`today/index.tsx`, `circle/index.tsx`) to leave room for future nested routes like `/today/week/$weekId` and `/circle/$personId`

- [ ] Task 3: Wire the three-space nav into the new route shells only (AC: #1, #2, #3)
  - [ ] 3.1 Mount the nav in the new Today/Me/Circle route shells so it is persistent across those routes
  - [ ] 3.2 Do not show the three-space nav on `/chat`, `/settings`, `/results/$conversationSessionId?view=portrait`, or weekly-letter reading routes
  - [ ] 3.3 Ensure the fixed mobile nav does not cover route content by adding bottom padding to the page shell
  - [ ] 3.4 Reuse `PageMain` and the existing header height convention (`3.5rem`) so layout spacing stays consistent with the rest of the app

- [ ] Task 4: Implement first authenticated landing behavior with a server-side visit flag (AC: #4, #5)
  - [ ] 4.1 Add `first_visit_completed` support to the user persistence layer (schema + migration + repository/use-case wiring); this field does not exist today
  - [ ] 4.2 Change the generic post-auth fallback from `/dashboard` to `/today` in `apps/front/src/lib/auth-session-linking.ts`
  - [ ] 4.3 In the `/today` route loader/beforeLoad flow, check the server-side visit flag and redirect first-time post-assessment users to `/me`
  - [ ] 4.4 In the `/me` route flow, mark the first visit as completed once the user has actually entered the Me surface
  - [ ] 4.5 Keep this logic server-backed; do not implement the first-visit decision with localStorage, cookies, or client-only state

- [ ] Task 5: Update auth and nav surfaces that currently assume `/dashboard` (AC: #4, #5)
  - [ ] 5.1 Update login default navigation expectations from `/dashboard` to the new three-space flow
  - [ ] 5.2 Update any tests or helper utilities that currently hard-code `/dashboard` as the authenticated default
  - [ ] 5.3 Do not retire `/dashboard` in this story; Story 1.2 owns the redirect-only replacement and component deletions

- [ ] Task 6: Add tests and verification (AC: all)
  - [ ] 6.1 Add component tests for `BottomNav`: active tab state, desktop/mobile variants, safe-area class, and hidden-route behavior
  - [ ] 6.2 Add route tests for `/today`, `/me`, and `/circle` auth redirects
  - [ ] 6.3 Update `apps/front/src/components/auth/login-form.test.tsx` and `apps/front/src/lib/auth-session-linking.test.ts` to match the new default routing contract
  - [ ] 6.4 Run `pnpm build`
  - [ ] 6.5 Run `pnpm test:run`

## Parallelism

- **Blocked by:** none
- **Blocks:** Story 1.2 (dashboard retirement), Epic 3 (Me page), Epic 4 (Today page), Epic 6 (Circle page)
- **Mode:** mixed
- **Domain:** frontend routing/navigation with a small backend persistence change
- **Shared files:** `apps/front/src/lib/auth-session-linking.ts`, `packages/infrastructure/src/db/drizzle/schema.ts`, auth tests

## Dev Notes

### Current Codebase Reality

- `apps/front/src/components/MobileNav.tsx` and `apps/front/src/components/UserNav.tsx` still link authenticated users to `/dashboard`
- `apps/front/src/routes/dashboard.tsx` and `apps/front/src/routes/settings.tsx` are the current protected-route examples
- `apps/front/src/routes/index.tsx` is the homepage; no `/today`, `/me`, or `/circle` routes currently exist
- `packages/infrastructure/src/db/drizzle/schema.ts` has no `first_visit_completed` or equivalent first-Me-visit field on the `user` table
- `apps/front/src/lib/auth-session-linking.ts` still defaults post-auth navigation to `/dashboard`

### Architecture Context

- ADR-43 replaces the old dashboard model with the three-space navigation model: Today / Me / Circle
- `/chat` is outside the three-space world as an onboarding tunnel
- `/settings` is intentionally a thin admin route, accessed by gear icon, not by adding a fourth tab
- First post-assessment visit must land on `/me`; subsequent authenticated visits default to `/today`
- Focused reading routes intentionally hide primary navigation to protect the emotional moment

### Implementation Guidance

- Prefer one reusable nav component with two render modes rather than separate mobile/desktop sources of truth
- Use folder-based route files for `today` and `circle` because nested children are already planned in the architecture and UX docs
- Keep the route shells lightweight: placeholder sections, clear headings, and room for future story insertion
- Use `PageMain` for a11y and keep the existing header-height offset (`h-14` / `3.5rem`) consistent with the rest of the app
- Add `data-slot` to new component primitives and `data-testid` to user-facing nav/page-shell landmarks; this is an explicit project convention in `docs/FRONTEND.md`
- For the mobile nav inset, use CSS that accounts for `env(safe-area-inset-bottom)` so the tabs are usable on iOS home-indicator devices

### Route and Redirect Guardrails

- Do not implement the nav as an extension of the existing `MobileNav` sheet; that component is a menu, not the three-space navigation model
- Do not make `/settings` a fourth primary tab
- Do not base first-visit routing on frontend-only state; the requirement is server-backed user state
- Do not fully delete or repurpose `/dashboard` in this story; Story 1.2 handles retirement and redirect-only replacement
- Do not add completed-assessment business rules beyond what is required for the first-visit redirect; keep this story focused on shells + nav + landing behavior

### Suggested File Targets

| Area | Path | Expected Change |
|---|---|---|
| Shared nav | `apps/front/src/components/BottomNav.tsx` | NEW |
| Today route shell | `apps/front/src/routes/today/index.tsx` | NEW |
| Me route shell | `apps/front/src/routes/me/index.tsx` | NEW |
| Circle route shell | `apps/front/src/routes/circle/index.tsx` | NEW |
| Redirect helper | `apps/front/src/lib/auth-session-linking.ts` | EDIT |
| User table | `packages/infrastructure/src/db/drizzle/schema.ts` | EDIT |
| User persistence | `packages/domain/src/repositories/user-account.repository.ts` and `packages/infrastructure/src/repositories/user-account.drizzle.repository.ts` or equivalent user-state repository | EDIT |
| Login redirect tests | `apps/front/src/components/auth/login-form.test.tsx` | EDIT |
| Redirect helper tests | `apps/front/src/lib/auth-session-linking.test.ts` | EDIT |

### Testing Notes

- Route test files must not live directly beside route files unless they use the repo's `-` prefix pattern or a `__tests__/` directory
- Verify active-tab state against real route paths, not mocked booleans only
- Include one test that proves the mobile nav is absent on a hidden route such as `/settings` or portrait reading
- Include one test that proves the first-visit redirect contract no longer defaults to `/dashboard`

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Client-only first-visit state** - No localStorage, sessionStorage, cookie-only, or in-memory tracking for `first_visit_completed`
2. **Dashboard leakage** - No new links or default redirects that keep `/dashboard` as the primary authenticated destination
3. **Duplicated nav configs** - Do not maintain separate hard-coded tab lists for mobile and desktop variants
4. **Route-specific anchor hacks** - Use TanStack Router `<Link>` and route-aware matching, not manual `window.location` or raw anchor navigation for primary tabs

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-1-Story-1.1] - Story statement and acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md#FR19] - Three-space authenticated product model
- [Source: _bmad-output/planning-artifacts/prd.md#FR101-FR103] - Default routing and navigation requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-43] - Three-space navigation replaces dashboard
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-15] - `/chat` sits outside the three-space world after auth gate
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Three-Space-Navigation-Model] - Today / Me / Circle definitions and routing decisions
- [Source: apps/front/src/routes/dashboard.tsx] - Existing protected-route pattern
- [Source: apps/front/src/routes/settings.tsx] - Existing protected-route pattern for thin admin route
- [Source: apps/front/src/components/MobileNav.tsx] - Current mobile authenticated navigation still points to `/dashboard`
- [Source: apps/front/src/components/UserNav.tsx] - Current desktop authenticated navigation still points to `/dashboard`
- [Source: apps/front/src/lib/auth-session-linking.ts] - Current post-auth fallback is `/dashboard`
- [Source: packages/infrastructure/src/db/drizzle/schema.ts] - Missing server-side first-visit field on user record
- [Source: docs/FRONTEND.md] - `data-slot` / data-attribute conventions

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `2026-04-13`: `pnpm --filter=front test -- src/components/BottomNav.test.tsx src/routes/-three-space-routes.test.tsx src/components/auth/login-form.test.tsx src/lib/auth-session-linking.test.ts` failed because `vitest` was not installed in this worktree (`node_modules` missing).
- `2026-04-13`: `pnpm --filter=api test -- src/use-cases/__tests__/first-visit.use-case.test.ts` failed for the same reason (`vitest` missing; local dependencies not installed).

### Completion Notes List

- Implemented a server-backed `first_visit_completed` flag across schema, repository, use cases, API contract, and account handlers.
- Added the reusable `BottomNav` component plus protected `/today`, `/me`, and `/circle` route shells, including the Me-page settings entry point and first-visit completion side effect.
- Updated authenticated default routing from `/dashboard` to `/today` across login/signup flows, verification callbacks, and global authenticated menu links.
- Manually synchronized `apps/front/src/routeTree.gen.ts` with the new routes because the normal generator step could not run without installed dependencies.
- Added focused frontend and backend tests for the new navigation and first-visit behavior, but validation is currently blocked until workspace dependencies are installed.

### File List

- `apps/front/src/components/BottomNav.tsx`
- `apps/front/src/components/BottomNav.test.tsx`
- `apps/front/src/routes/today/index.tsx`
- `apps/front/src/routes/me/index.tsx`
- `apps/front/src/routes/circle/index.tsx`
- `apps/front/src/routes/-three-space-routes.test.tsx`
- `apps/front/src/routeTree.gen.ts`
- `apps/front/src/hooks/use-account.ts`
- `apps/front/src/lib/auth-session-linking.ts`
- `apps/front/src/lib/auth-session-linking.test.ts`
- `apps/front/src/components/auth/login-form.tsx`
- `apps/front/src/components/auth/login-form.test.tsx`
- `apps/front/src/components/auth/signup-form.tsx`
- `apps/front/src/components/auth/ResultsSignUpForm.tsx`
- `apps/front/src/components/home/HomepageSignupForm.tsx`
- `apps/front/src/routes/login.tsx`
- `apps/front/src/routes/signup.tsx`
- `apps/front/src/routes/forgot-password.tsx`
- `apps/front/src/routes/verify-email.tsx`
- `apps/front/src/components/UserNav.tsx`
- `apps/front/src/components/MobileNav.tsx`
- `packages/domain/src/repositories/user-account.repository.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/repositories/user-account.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/user-account.drizzle.repository.ts`
- `packages/contracts/src/http/groups/account.ts`
- `apps/api/src/handlers/account.ts`
- `apps/api/src/use-cases/get-first-visit-state.use-case.ts`
- `apps/api/src/use-cases/complete-first-visit.use-case.ts`
- `apps/api/src/use-cases/index.ts`
- `apps/api/src/use-cases/__tests__/first-visit.use-case.test.ts`
- `drizzle/20260413120000_add_first_visit_completed_flag/migration.sql`

### Change Log

- `2026-04-13`: Implemented Story 1.1 routing, navigation, and first-visit persistence changes; validation is pending because this worktree does not currently have installed dependencies.
