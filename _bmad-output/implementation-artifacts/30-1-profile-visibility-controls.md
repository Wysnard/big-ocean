# Story 30-1: Profile Visibility Controls

Status: ready-for-dev

## Story

As a user,
I want to control whether my profile is publicly visible or private,
So that I decide who can see my personality results.

## Acceptance Criteria

1. **AC1: Settings route exists** — A `/settings` route exists in the frontend that is protected (requires authentication). Unauthenticated users are redirected to `/login`.

2. **AC2: Profile visibility toggle** — When a user with a completed assessment navigates to `/settings`, they see a profile visibility toggle. The toggle displays exactly two states: "Public" and "Private". The toggle defaults to "Private" (reflecting the `isPublic: false` default from the backend).

3. **AC3: Toggle persists via API** — Toggling the switch calls the existing `PATCH /api/public-profile/:publicProfileId/visibility` endpoint via the existing `useToggleVisibility` hook. Optimistic UI update reflects the new state immediately, with rollback on error.

4. **AC4: Private profile blocks access** — When a user's profile is set to "Private" (default), visiting their public profile URL returns a 404/not-found response. (Already implemented by backend — this AC validates end-to-end behavior.)

5. **AC5: Public profile enables access** — When a user toggles to "Public", their profile becomes accessible at their public profile URL. Toggling back to "Private" immediately removes public access. (Already implemented by backend.)

6. **AC6: Navigation link** — The UserNav dropdown (desktop) and MobileNav (mobile) include a "Settings" link to `/settings`, visible only to authenticated users.

7. **AC7: No-profile state** — If the user has not completed an assessment (no public profile exists), the settings page shows the visibility section in a disabled/informational state explaining that profile visibility controls become available after completing an assessment.

## Tasks / Subtasks

- [ ] Task 1: Create settings route (AC: #1, #6)
  - [ ] 1.1 Create `apps/front/src/routes/settings.tsx` with auth-protected `beforeLoad` (redirect to `/login` if not authenticated)
  - [ ] 1.2 Add "Settings" link to `apps/front/src/components/UserNav.tsx` dropdown menu (with Settings/gear icon, between Profile and Sign Out)
  - [ ] 1.3 Add "Settings" link to `apps/front/src/components/MobileNav.tsx` nav list (with Settings/gear icon)

- [ ] Task 2: Create ProfileVisibilitySection component (AC: #2, #3, #7)
  - [ ] 2.1 Create `apps/front/src/components/settings/ProfileVisibilitySection.tsx`:
    - Accepts `publicProfileId: string | null`, `isPublic: boolean`, `isTogglePending: boolean`, `onToggleVisibility: () => void`
    - Shows Switch toggle with "Public" / "Private" label
    - When `publicProfileId` is null, show disabled state with explanation text
    - Include `data-testid="profile-visibility-toggle"` on the Switch
    - Include `data-testid="profile-visibility-status"` on the status label
  - [ ] 2.2 Write unit test `apps/front/src/components/settings/ProfileVisibilitySection.test.tsx`:
    - Test: renders toggle with "Private" when `isPublic=false`
    - Test: renders toggle with "Public" when `isPublic=true`
    - Test: calls `onToggleVisibility` when toggled
    - Test: shows disabled state when `publicProfileId` is null

- [ ] Task 3: Wire settings page with data fetching (AC: #2, #3, #7)
  - [ ] 3.1 In settings route component, use `useListAssessments` to find the user's completed session
  - [ ] 3.2 If completed session exists, use `useGetResults` to fetch `publicProfileId` and `isPublic`
  - [ ] 3.3 Wire `useToggleVisibility` mutation for the toggle action
  - [ ] 3.4 Manage local state for optimistic updates (same pattern as results page `handleToggleVisibility`)

- [ ] Task 4: Write route-level test (AC: #1, #2)
  - [ ] 4.1 Create `apps/front/src/routes/settings.test.tsx` with basic render test verifying the settings page renders the visibility section

## Dev Notes

### Existing Infrastructure (DO NOT recreate)
- **Backend API:** `PATCH /api/public-profile/:publicProfileId/visibility` — already implemented
- **Backend use-case:** `toggle-profile-visibility.use-case.ts` — already tested
- **Frontend hook:** `useToggleVisibility` in `apps/front/src/hooks/use-profile.ts` — already implemented
- **Frontend hook:** `useGetPublicProfile` in `apps/front/src/hooks/use-profile.ts` — already implemented
- **Results page toggle:** `ShareProfileSection.tsx` — existing reference for toggle UI pattern

### Key Patterns to Follow
- Auth guard: Same `beforeLoad` pattern as `/profile` route (see `apps/front/src/routes/profile.tsx`)
- Data attributes: Use `data-slot` for structural identification, `data-testid` for test selectors (see FRONTEND.md)
- Component structure: Follow existing component patterns in `apps/front/src/components/`
