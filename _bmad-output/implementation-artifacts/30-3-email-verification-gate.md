# Story 30-3: Email Verification Gate

**Status:** ready-for-dev
**Epic:** Epic 1 — Account & Authentication
**Priority:** High
**Points:** 3

## User Story

As a user,
I want to verify my email address before accessing the platform,
So that my account is secured and I can receive important notifications reliably.

## Background

Better Auth is configured with `requireEmailVerification: true`, which prevents session creation for unverified accounts. The signup form already redirects to `/verify-email` after account creation, and the verify-email page exists with pending/error states and a resend button.

**What's missing:** The login form does not handle the 403 response that Better Auth returns when an unverified user attempts to sign in. Additionally, `sendOnSignIn: true` is not configured, so unverified users who attempt to log in do not get an automatic re-send of the verification email.

## Acceptance Criteria

### AC1: Signup redirects to verify-email
**Given** a user submits the sign-up form with email and password
**When** the account is created
**Then** a verification email is sent to the provided address
**And** the user is redirected to the `/verify-email` page with a "Check your inbox" message
**And** the account exists but is unverified — no access to any authenticated feature

> Already implemented in signup-form.tsx.

### AC2: Verification link activates account
**Given** a user receives the verification email
**When** they click the verification link
**Then** the account is activated and the user gains platform access
**And** the link contains a unique token that expires after 1 week (FR50a)

> Already implemented via Better Auth config + email-verification template.

### AC3: Expired verification link shows error
**Given** a user's verification link has expired (>1 week)
**When** they click the expired link
**Then** they are redirected to the `/verify-email` page with an "expired link" message and a resend button (NFR9b)

> Already implemented in verify-email.tsx.

### AC4: Resend verification email
**Given** a user is on the `/verify-email` page
**When** they click "Resend verification email"
**Then** a new verification email is sent with a fresh 1-week expiry token (FR50b)
**And** the resend action is rate-limited to prevent abuse

> Already implemented in verify-email.tsx.

### AC5: Unverified user accessing protected routes
**Given** an unverified user attempts to access any authenticated route (dashboard, chat, results, etc.)
**When** the route's `beforeLoad` checks auth status via `getSession()`
**Then** `getSession()` returns null because Better Auth's `requireEmailVerification: true` prevents session creation for unverified accounts
**And** the standard auth gate redirects to `/login` (same as unauthenticated users)

> Already implemented — all protected routes use the `beforeLoad` auth pattern.

### AC6: Login form catches 403 for unverified users (NEW)
**Given** an unverified user lands on `/login` and submits correct credentials
**When** Better Auth processes the sign-in
**Then** Better Auth returns a **403 status** (not a session)
**And** Better Auth auto-resends the verification email (`sendOnSignIn: true`)
**And** the login form catches the 403 and redirects to `/verify-email` with the user's email as a search param
**And** the `/verify-email` page shows "Check your inbox" + resend button

### AC7: Public routes remain accessible
**Given** public routes (`/`, `/public-profile/:id`)
**When** an unauthenticated or unverified user visits them
**Then** the pages render normally — no verification required

> Already implemented — these routes have no auth gate.

## Tasks

### Task 1: Add `sendOnSignIn: true` to Better Auth email verification config
- **File:** `packages/infrastructure/src/context/better-auth.ts`
- **Change:** Add `sendOnSignIn: true` to the `emailVerification` config block
- **Purpose:** When an unverified user attempts to sign in, Better Auth auto-resends the verification email before returning 403

### Task 2: Handle 403 in login form — redirect to `/verify-email`
- **File:** `apps/front/src/components/auth/login-form.tsx`
- **Change:** In the `handleSubmit` catch block, detect 403 status errors and redirect to `/verify-email` with the email as a search param instead of showing a generic error
- **Pattern:** Check `err.message` or error status for 403/email-not-verified indicator from Better Auth client

### Task 3: Update `useAuth` sign-in to propagate error details
- **File:** `apps/front/src/hooks/use-auth.ts`
- **Change:** Ensure the sign-in error includes enough context (status code or error code) for the login form to distinguish 403 (unverified) from other errors
- **Purpose:** The login form needs to differentiate "unverified email" from "wrong password"

### Task 4: Write tests for login form 403 handling
- **File:** `apps/front/src/components/auth/login-form.test.tsx`
- **Change:** Add test case for 403 error triggering redirect to `/verify-email` with email param
- **Pattern:** Follow existing test structure in the file

### Task 5: Write test for `sendOnSignIn` config
- **File:** Verify via existing integration test infrastructure or add unit assertion
- **Change:** Ensure `sendOnSignIn: true` is present in the Better Auth config

## Technical Notes

- Better Auth client returns errors with a `status` property and `code` property. When `requireEmailVerification` is true and an unverified user signs in, the error has `status: 403` and `code: "EMAIL_NOT_VERIFIED"`.
- The `useAuth` hook currently throws a generic `Error` — it should propagate the status/code from the Better Auth response.
- The two-redirect path (protected route -> `/login` -> 403 -> `/verify-email`) is the intentional design per ADR-24.

## Dependencies

- Better Auth server config (`packages/infrastructure/src/context/better-auth.ts`) — already has `requireEmailVerification: true`
- Verify-email page (`apps/front/src/routes/verify-email.tsx`) — already exists
- Login form (`apps/front/src/components/auth/login-form.tsx`) — needs modification
- Auth hook (`apps/front/src/hooks/use-auth.ts`) — needs modification

## Out of Scope

- Email template changes (already done in Story 31-7b)
- Verify-email page UI changes (already done)
- Backend email verification flow (already configured)
