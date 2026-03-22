# Story 33-3: Share Flow & Visibility Toggle

**Epic:** 4 — Public Profile & Sharing
**Status:** ready-for-dev
**Priority:** high

## User Story

As a user,
I want to instantly share my profile link and be prompted to make it public if needed,
So that sharing is frictionless and I control my visibility at the moment it matters.

## Acceptance Criteria

### AC1: Share when profile is already public
**Given** a user taps the share action on their results page or profile
**When** their profile is already "Public"
**Then** the share flow triggers immediately via Web Share API where available, with copy-to-clipboard fallback (FR44)

### AC2: Share when profile is private — prompt to go public
**Given** a user taps the share action
**When** their profile is currently "Private"
**Then** a prompt appears: "Make your profile public so friends can see your archetype when they tap your link?" with Accept and Decline options
**And** if accepted, the profile is toggled to "Public" and the share flow proceeds immediately
**And** if declined, the share is cancelled and the profile remains private

### AC3: Shareable URL points to public profile
**Given** the share flow completes
**When** the link is copied or shared
**Then** the shareable URL points to the user's public profile page

## Tasks

### Task 1: Create PublicVisibilityPrompt component
- **1.1** Write tests for the `PublicVisibilityPrompt` dialog component
  - Test: renders prompt text, Accept and Decline buttons
  - Test: calls `onAccept` when Accept is clicked
  - Test: calls `onDecline` when Decline is clicked
  - Test: proper focus management and accessibility (aria-labels)
- **1.2** Implement `PublicVisibilityPrompt` component using shadcn/ui Dialog (AlertDialog)
  - Title: "Share your profile?"
  - Description: "Make your profile public so friends can see your archetype when they tap your link?"
  - Accept button: "Make public & share"
  - Decline button: "Cancel"
  - Proper focus trap and keyboard navigation
  - `data-testid` attributes for E2E

### Task 2: Create `useShareFlow` hook
- **2.1** Write tests for the `useShareFlow` hook
  - Test: when profile is public, calling `initiateShare()` triggers share/copy immediately
  - Test: when profile is private, calling `initiateShare()` opens the prompt (returns `promptNeeded` state)
  - Test: `acceptAndShare()` calls toggle visibility mutation, then triggers share/copy
  - Test: `declineShare()` resets prompt state
  - Test: Web Share API used when available, clipboard fallback otherwise
  - Test: `copied` state resets after 2 seconds
- **2.2** Implement `useShareFlow` hook
  - Encapsulates the full share flow logic currently inline in the results page
  - Uses `useToggleVisibility` from `use-profile.ts`
  - Returns: `{ initiateShare, acceptAndShare, declineShare, promptNeeded, copied, isToggling }`
  - Calls Web Share API or clipboard copy based on availability
  - After successful `acceptAndShare`, auto-triggers the share/copy action

### Task 3: Integrate share flow into results page
- **3.1** Write tests for the integration (update existing ShareProfileSection tests)
  - Test: clicking share when public triggers immediate share
  - Test: clicking share when private shows PublicVisibilityPrompt
  - Test: accepting prompt toggles visibility then shares
  - Test: declining prompt does nothing
- **3.2** Refactor `ShareProfileSection` to use the new share flow
  - Remove inline toggle switch from the share action flow
  - Keep the existing visibility toggle for manual control
  - Wire share button to `initiateShare()` from `useShareFlow`
  - Render `PublicVisibilityPrompt` when `promptNeeded` is true
- **3.3** Update results page (`$assessmentSessionId.tsx`) to pass new share flow props
  - Replace inline `handleShareLink`/`handleCopyLink` logic with `useShareFlow` hook
  - Remove duplicated share logic from the route component

### Task 4: Migrate `use-profile.ts` to Effect HttpApiClient
- **4.1** Refactor `useToggleVisibility` to use `makeApiClient` + Effect pattern (per CLAUDE.md rule)
  - Replace raw `fetch` with typed Effect HttpApiClient from `@workspace/contracts`
  - Follow the pattern in CLAUDE.md: `yield* makeApiClient` -> `yield* client.profile.toggleVisibility()`
- **4.2** Refactor `useShareProfile` to use `makeApiClient` + Effect pattern
- **4.3** Refactor `useGetPublicProfile` to use `makeApiClient` + Effect pattern
- **4.4** Update/add tests for migrated hooks

## Dev Notes

- The existing `ShareProfileSection` already has a visibility toggle (Switch) inline — this should remain as a convenience control
- The new behavior adds a just-in-time prompt when the user tries to share while private
- Web Share API detection is already implemented in `ShareProfileSection.tsx` via `canUseWebShare()`
- The share URL should always point to the public profile page (`/public-profile/:publicProfileId`)
- The `use-profile.ts` hooks currently use raw `fetch` which violates the CLAUDE.md rule about using typed Effect HttpApiClient
