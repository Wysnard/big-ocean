# Story 3.1: Me Page Route & Section Layout

Status: done

## Story

As an authenticated user with a completed assessment,
I want a dedicated /me page that shows my full identity,
So that I have a persistent place to revisit my portrait, archetype, and personality data.

## Acceptance Criteria

1. **Given** an authenticated user with a completed assessment **When** they navigate to /me **Then** the page renders with 7 section slots in order: Identity Hero, Your Portrait, Your Growth (conditional — hidden until Epic 4), Your Public Face, Your Circle, Subscription, Account
2. **And** the page uses a single-column scrollable layout (max-width 720px on desktop, full-width on mobile)
3. **And** each section is wrapped in a semantic `<section>` with a clear heading
4. **And** the page loads assessment results via the existing `conversation.getResults` API
5. **And** if the user has no completed assessment, they are redirected to /chat
6. **And** BottomNav shows "Me" tab as active

## Tasks / Subtasks

- [x] Task 1: Resolve the user's latest assessment sessionId for /me route (AC: 4)
  - [x] 1.1 Use `listConversationsQueryOptions()` from `apps/front/src/hooks/use-conversation.ts` to fetch sessions in `beforeLoad`. The existing `GET /api/conversation/sessions` endpoint already returns all sessions with their `status`. Find the latest session with `status === "completed"` and extract its `id`. **No new backend endpoint needed.**
  - [x] 1.2 Pass the resolved `sessionId` via route loader data so the component can consume it with `Route.useLoaderData()` or equivalent TanStack Router context
- [x] Task 2: Add assessment-completion guard to /me route (AC: 5)
  - [x] 2.1 In `beforeLoad`, after the existing auth check, fetch sessions via `listSessions`. If a session has `status === "completed"`, proceed (and store sessionId for Task 1). If only active/paused sessions exist, redirect to `/chat?sessionId=<that-session-id>`. If no sessions at all, redirect to `/chat`
  - [x] 2.2 Combine Tasks 1 and 2 in the same `beforeLoad` — one fetch of sessions handles both the guard and sessionId resolution
- [x] Task 3: Create `MePageSection` layout component (AC: 1, 3)
  - [x] 3.1 Create `apps/front/src/components/me/MePageSection.tsx`
  - [x] 3.2 Props: `title: string`, `children: ReactNode`, `action?: { label: string; onClick: () => void }`, `isConditional?: boolean`, `className?: string`
  - [x] 3.3 Renders `<section aria-label={title}>` with heading, content area, optional action link
  - [x] 3.4 Consistent vertical rhythm between sections (use `space-y-10` or similar)
- [x] Task 4: Replace Me page shell with 7-section scroll layout (AC: 1, 2, 6)
  - [x] 4.1 Edit `apps/front/src/routes/me/index.tsx` — replace placeholder content with the section scaffold
  - [x] 4.2 Layout: single-column, `max-w-[720px] mx-auto`, full-width on mobile
  - [x] 4.3 Fetch results data using `useGetResults(sessionId)` from `use-conversation.ts`
  - [x] 4.4 Render 7 `MePageSection` wrappers in order (Identity Hero, Your Portrait, Your Growth, Your Public Face, Your Circle, Subscription, Account)
  - [x] 4.5 Each section renders placeholder content for now (actual section content is Stories 3.2–3.6)
  - [x] 4.6 Your Growth section: conditional render (only when mood history exists — for now, always hidden since Epic 4 hasn't been built)
  - [x] 4.7 Account section: gear icon link to `/settings` (already exists in the shell — keep it, move to bottom)
  - [x] 4.8 Keep `BottomNav` component (already present in shell)
  - [x] 4.9 Keep `completeFirstVisit()` call (already present in shell)
- [x] Task 5: Loading & error states (AC: 1)
  - [x] 5.1 Add skeleton state while results are loading (section heading placeholders + content skeletons)
  - [x] 5.2 Add error state if results fetch fails (ErrorBanner at page top with retry)
  - [x] 5.3 Per-section error boundaries are NOT required in this story (added in Stories 3.2–3.6 per section)
- [x] Task 6: Update existing tests (AC: all)
  - [x] 6.1 Update `apps/front/src/routes/-three-space-routes.test.tsx` to verify the new section layout renders
  - [x] 6.2 Add test: authenticated user with completed assessment sees 7 sections
  - [x] 6.3 Add test: user without completed assessment is redirected to /chat
  - [x] 6.4 Do NOT place test files directly in `apps/front/src/routes/me/` — use prefix `-` or `__tests__` directory
  - [x] 6.5 The existing test file mocks `@/hooks/use-account` and `@/lib/auth-client` but NOT `@/hooks/use-conversation`. Add `vi.mock("@/hooks/use-conversation")` to the hoisted mocks to support `useGetResults` and session listing

## Dev Notes

### Critical Architecture Context

**This story replaces a shell, not builds from scratch.** The `/me` route already exists at `apps/front/src/routes/me/index.tsx` with auth guard, first-visit tracking (`completeFirstVisit()`), BottomNav, and settings link. Edit it — do NOT create a new file or route.

**Me page = identity sanctuary.** Single-column scroll, NOT a dashboard grid. Even on desktop, max-width 720px. No multi-column layouts.

**Route convergence (important for future stories):** Architecture says `/me` and `/results/$sessionId` converge — they render the same page composition. Story 3.1 sets up `/me` as the canonical location. The `/results/$sessionId` route remains for backward-compat URLs and the `?view=portrait` focused reading variant.

**Section content is placeholder in this story.** Stories 3.2–3.6 fill in the actual section content (Identity Hero, Public Face, Subscription, etc.). This story only builds the layout scaffold + data fetching infrastructure.

### Technical Requirements

**Session ID resolution:** The `/me` route doesn't have `$sessionId` in the URL like `/results/$conversationSessionId` does. Use the existing `listSessions` endpoint (`GET /api/conversation/sessions`) which returns all user sessions with status. In `beforeLoad`, fetch sessions, find the one with `status === "completed"`, and pass its `id` as `sessionId` via route loader data. The `listConversationsQueryOptions()` helper in `use-conversation.ts` already wraps this call. **No new backend endpoint or schema change is needed.**

**Data fetching:** Use `useGetResults(sessionId)` from `apps/front/src/hooks/use-conversation.ts`. Do NOT create a new data-fetching mechanism. The sessionId comes from the route's beforeLoad/loader context.

**Assessment-completion check:** The `/today` route already does `fetchFirstVisitState()` in `beforeLoad` and redirects to `/me` if not completed. The `/me` route needs the inverse: if no assessment exists at all, redirect to `/chat`.

### Existing Code to Reuse (DO NOT Reinvent)

| What | Where | Usage |
|------|-------|-------|
| Auth guard pattern | `apps/front/src/routes/me/index.tsx` (existing beforeLoad) | Already in place — extend, don't replace |
| First-visit tracking | `apps/front/src/hooks/use-account.ts` (`completeFirstVisit`) | Already called in MePage — keep it |
| Session list hook | `apps/front/src/hooks/use-conversation.ts` (`listConversationsQueryOptions`) | Resolve latest completed sessionId in beforeLoad |
| Results data hook | `apps/front/src/hooks/use-conversation.ts` (`useGetResults`) | Primary data source for all sections |
| Portrait status hook | `apps/front/src/hooks/usePortraitStatus.ts` (`usePortraitStatus`) | Needed for Your Portrait section state |
| BottomNav | `apps/front/src/components/BottomNav.tsx` | Already in the shell — keep it |
| PageMain wrapper | `apps/front/src/components/PageMain.tsx` | Already in the shell — keep it |
| Settings link | Already in shell (`<Link to="/settings">`) | Move to Account section at bottom |

### Existing Components NOT to Use on Me Page

| Component | Why Not |
|-----------|---------|
| `ProfileView` | That's the results route's orchestrator — Me page has its own layout |
| `PortraitReadingView` | Only for focused reading at `/results/$sessionId?view=portrait` |
| `PortraitUnlockButton` | RETIRED — portrait is free |
| `PWYWCurtainModal` | RETIRED — no payment gate |

### File Structure

```
apps/front/src/
├── routes/me/index.tsx              # EDIT — replace shell with section layout
├── components/me/                    # NEW DIRECTORY
│   └── MePageSection.tsx            # NEW — section wrapper component
```

### Styling Conventions

- Use `data-slot="me-page"` on root (already exists)
- Use `data-testid="me-page"` on root (already exists)
- Add `data-slot="me-section-{name}"` on each `<section>` (e.g., `me-section-identity-hero`)
- Add `data-testid="me-section-{name}"` on each `<section>`
- Mobile: full-width, `pb-28` for BottomNav safe area
- Desktop: `max-w-[720px] mx-auto`, `lg:pb-0`
- All animations gated by `prefers-reduced-motion` (per UX spec)
- Section reveal on scroll: fade-in + slide-up, 400ms, IntersectionObserver threshold 0.1 (can be added in this story or deferred to section stories)

### Responsive Behavior

| Viewport | Layout |
|----------|--------|
| Mobile (< 640px) | Single column, full-width sections. Safe-area padding for BottomNav. |
| Tablet (640-1024px) | Single column, centered, max-width 720px. |
| Desktop (>= 1024px) | Single column, centered, max-width 720px. Top nav tabs replace BottomNav. |

### Testing Requirements

- Test framework: Vitest (existing setup)
- Test location: `apps/front/src/routes/-three-space-routes.test.tsx` (extend existing) or `apps/front/src/components/me/__tests__/`
- DO NOT place `.test.tsx` files directly in `apps/front/src/routes/me/` (TanStack Router treats them as routes)
- Existing test data attributes: `data-testid="me-page"`, `data-testid="me-settings-link"`, `data-testid="bottom-nav-root"`
- NEVER remove or rename existing `data-testid` attributes

### UX Spec References

- [Source: ux-design-specification.md §15.2] — Me Page Specification (sections, states, loading, errors, responsive)
- [Source: ux-design-specification.md §18] — Results/Me Page Specification (data model, fetching, convergence)
- [Source: architecture.md ADR-43] — Three-Space Navigation Model (routing contract, landing logic)
- [Source: architecture.md ADR-46] — Post-Assessment Focused Reading Transition
- [Source: epics.md Epic 3] — Full epic context with all 6 stories
- [Source: prd.md FR101-FR103] — Three-space navigation requirements

### State-Dependent Behavior (from UX Spec)

| User State | Me Page Behavior |
|-----------|-----------------|
| No assessment started | Redirect to `/chat` |
| Assessment in progress | Redirect to `/chat?sessionId=...` |
| Assessment complete, first visit | Full page + ReturnSeedSection (Story 2.5, not this story) |
| Assessment complete, returning | Full page (no ReturnSeedSection) |

### Cross-Story Dependencies

- **Story 1.1 (done):** Created the /me route shell, BottomNav, first-visit tracking — this story builds on top
- **Story 2.3 (done):** Portrait reading "There's more to see →" link navigates to results page (will eventually link to /me)
- **Story 2.5 (backlog):** ReturnSeedSection on first visit — separate story, not part of 3.1
- **Stories 3.2–3.6:** Fill in actual section content — depend on this story's layout scaffold

### Git Intelligence

Recent commits show Epic 2 portrait work is complete (2.1–2.4 done). The portrait reading view, generating state, and end-of-letter transition are all implemented. The `/results/$conversationSessionId` route has been enhanced with focused reading mode. The BottomNav and three-space shells were added in commit `3183fefb`.

### What This Story Does NOT Include

- Actual section content (Stories 3.2–3.6)
- GeometricSignature component (Story 3.3)
- Public face controls (Story 3.4)
- Subscription pitch (Story 3.5)
- Circle preview (Story 3.6)
- ReturnSeedSection / notification permission (Story 2.5)
- Scroll animations (can be added here or deferred)
- New backend endpoints beyond what's needed for sessionId resolution

## Dev Agent Record

### Agent Model Used

Codex GPT-5

### Debug Log References

- `pnpm --filter front test -- apps/front/src/routes/-three-space-routes.test.tsx apps/front/src/components/BottomNav.test.tsx`
- `pnpm --filter front typecheck`
- `pnpm --filter front check` (surfaces pre-existing unrelated diagnostics elsewhere in `apps/front/src`; changed files were then verified with a targeted Biome check)
- `pnpm --filter front exec biome check src/routes/me/index.tsx src/components/me/MePageSection.tsx src/routes/-three-space-routes.test.tsx`
- `pnpm --filter front exec vitest run src/routes/-three-space-routes.test.tsx src/components/BottomNav.test.tsx`

### Completion Notes List

- Added `MePageSection` as the reusable semantic section wrapper for the `/me` sanctuary layout.
- Extended `/me` route `beforeLoad` to resolve the latest completed session via `listConversationsQueryOptions()`, redirect incomplete users back to `/chat`, and expose `sessionId` through route loader data.
- Replaced the old `/me` shell with the single-column seven-section scaffold, placeholder section content, loading skeletons, error banner retry handling, and the moved settings link in the Account section.
- Preserved existing `BottomNav` rendering and `completeFirstVisit()` behavior.
- Updated route tests to cover completed-assessment rendering plus `/chat` redirects for users without a completed assessment or with only an active session.
- Validation completed: full `apps/front` test suite passed, `apps/front` typecheck passed, targeted Biome check on changed files passed.

### File List

- apps/front/src/components/me/MePageSection.tsx
- apps/front/src/routes/me/index.tsx
- apps/front/src/routes/-three-space-routes.test.tsx
- _bmad-output/implementation-artifacts/3-1-me-page-route-and-section-layout.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Review Findings

- [x] [Review][Defer] `archived` session status falls through to `/chat` redirect — User with only archived sessions is redirected to `/chat` as if they never did an assessment. No archived sessions exist in production yet; handle when archive feature is built. — deferred, feature not yet implemented
- [x] [Review][Patch] Unsafe `context as { sessionId: string }` cast in loader — replaced with runtime type guard + redirect fallback. [routes/me/index.tsx:68] ✓ fixed
- [x] [Review][Patch] Skeleton missing `data-state="hidden"` on growth section — added conditional `data-state` spread to skeleton. [routes/me/index.tsx:MePageSkeleton] ✓ fixed
- [x] [Review][Patch] No test for error state (ErrorBanner) — added test asserting ErrorBanner renders error message. [routes/-three-space-routes.test.tsx] ✓ fixed
- [x] [Review][Patch] No test for loading skeleton state — added test asserting `aria-busy` on skeleton sections. [routes/-three-space-routes.test.tsx] ✓ fixed
- [x] [Review][Defer] Pre-existing `overallConfidence * 100` bug in ArchetypeHeroSection — `ArchetypeHeroSection.tsx:177` does `Math.round(overallConfidence * 100)` but the API returns 0-100 scale (confirmed: contracts test uses `68`, backend unit test expects `60`). This would display "6800% confidence" with real data. Frontend tests mask this by using 0-1 scale mocks. Not caused by this change. — deferred, pre-existing
- [x] [Review][Defer] BottomNav "Me" active tab not tested (AC6) — BottomNav mock is a stub rendering `<div data-testid="bottom-nav-root" />` with no tabs. AC6 requires "Me" tab as active but this cannot be verified through current test setup. Pre-existing from Story 1.1. — deferred, pre-existing

### Change Log

- 2026-04-13: Implemented the `/me` route scaffold, assessment session resolution guard, reusable me-page section wrapper, and updated route coverage for the new layout and redirects.
