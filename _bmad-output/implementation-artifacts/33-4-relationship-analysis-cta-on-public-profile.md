# Story 33-4: Relationship Analysis CTA on Public Profile

**Status:** ready-for-dev
**Epic:** 4 — Public Profile & Sharing
**FR Coverage:** FR45
**Priority:** Medium

## User Story

As a logged-in user with a completed assessment,
I want to see an invitation to discover my dynamic with the profile owner,
So that I can initiate a relationship analysis with someone I care about.

## Acceptance Criteria

**AC1: Relationship analysis CTA for authenticated-assessed users**
**Given** a logged-in user with a completed assessment views another user's public profile
**When** the profile renders
**Then** a relationship analysis CTA is displayed: "You care about [Name]. Discover your dynamic together."
**And** a brief explanation of the QR flow is included

**AC2: CTA hidden for unauthenticated or unassessed visitors**
**Given** an anonymous visitor or a user without a completed assessment views a public profile
**When** the profile renders
**Then** the relationship analysis CTA is not displayed
**And** only the standard "Start your own assessment" CTA is shown

**AC3: CTA hidden for profile owner**
**Given** the profile owner is viewing their own public profile
**When** the profile renders
**Then** the relationship analysis CTA is not displayed

## Technical Context

### Current State

The public profile route (`apps/front/src/routes/public-profile.$publicProfileId.tsx`) already:
- Determines auth state via server functions: `unauthenticated`, `authenticated-no-assessment`, `authenticated-assessed`
- Passes `authState` to `PublicProfileCTA` and `ProfileInlineCTA` components
- The `PublicProfileCTA` component already has CTA content for `authenticated-assessed` that says "You care about [Name]. Discover your dynamic together." with QR flow explanation text

The existing `PublicProfileCTA` component already handles the relationship analysis CTA for authenticated-assessed users. The `ProfileInlineCTA` already hides itself for authenticated-assessed users.

### What's Missing

1. **Own-profile detection (AC3):** The loader does not currently check if the viewer is the profile owner. Need to compare the session user's ID against the profile owner's user ID to suppress the relationship CTA on the user's own profile.
2. **Profile owner identity:** The `GetPublicProfileResponse` schema does not include a `userId` or `publicProfileId` for the owner. The loader needs to check ownership server-side and pass an `isOwnProfile` flag.
3. **QR flow explanation:** The existing CTA subtext mentions "Scan a QR code together..." which partially satisfies the "brief QR flow explanation" requirement, but could be enhanced.

## Tasks

### Task 1: Add owner identity check to the public profile loader

**Subtask 1.1:** Add a server function `checkIsOwnProfile` that compares the authenticated user's public profile ID (if any) against the current `publicProfileId` param.

**Subtask 1.2:** Extend the loader return type to include `isOwnProfile: boolean`.

**Subtask 1.3:** Pass `isOwnProfile` to the `PublicProfileCTA` component.

### Task 2: Update PublicProfileCTA to hide relationship CTA on own profile

**Subtask 2.1:** Add `isOwnProfile` prop to `PublicProfileCTA`.

**Subtask 2.2:** When `isOwnProfile` is true and `authState` is `authenticated-assessed`, fall back to a neutral CTA (e.g., share prompt) instead of the relationship analysis CTA.

### Task 3: Update ProfileInlineCTA for own-profile awareness

**Subtask 3.1:** When `isOwnProfile` is true, the inline CTA should not show "Discover your own personality" — the user already has one. Instead, hide or show a share CTA.

### Task 4: Add RelationshipAnalysisCTA component with QR flow explanation

**Subtask 4.1:** Create a dedicated `RelationshipAnalysisCTA` component that renders the relationship-specific CTA with the "You care about [Name]" heading and a brief QR flow explanation (2-3 sentence micro-copy).

**Subtask 4.2:** This component is rendered only when `authState === "authenticated-assessed"` AND `isOwnProfile === false`.

### Task 5: Write tests

**Subtask 5.1:** Unit test for `RelationshipAnalysisCTA` component — renders correct copy, does not render when hidden.

**Subtask 5.2:** Unit test for `PublicProfileCTA` — verify own-profile suppression of relationship CTA.

## Dev Notes

- The public profile response does not include the owner's userId. Ownership check must happen server-side by fetching the viewer's public profile ID and comparing.
- The `checkPublicProfileAuth` server function already fetches session data. It can be extended to also fetch the viewer's public profile ID for comparison.
- Maintain all existing `data-testid` attributes.
