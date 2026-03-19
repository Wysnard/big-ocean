# Story 31-7b: Wire Resend into Better Auth (Email Verification + Password Reset)

Status: ready-for-dev

## Story

As a user,
I want to verify my email address after signup and reset my password if I forget it,
So that my account is secure and I can always recover access.

## Acceptance Criteria

1. **AC1: Email verification on signup** — Signup sends a verification email via Resend. The user must verify their email before a session is created (`requireEmailVerification: true`). After verification, the user is auto-signed in and redirected to `/profile` (`autoSignInAfterVerification: true`).

2. **AC2: Verification page** — A `/verify-email` route exists with three states: (a) verified — link to profile, (b) error — expired/invalid token with resend button, (c) pending — "check your inbox" message with resend button. Resend button calls `authClient.sendVerificationEmail()`.

3. **AC3: Forgot password link** — The login form includes a "Forgot password?" link between the password field and the submit button, navigating to `/forgot-password`.

4. **AC4: Forgot password page** — A `/forgot-password` route exists with an email input. On submit, calls `authClient.forgetPassword()`. Always shows "If an account exists, we sent a reset link" to prevent email enumeration. Authenticated users are redirected to `/profile`.

5. **AC5: Reset password page** — A `/reset-password` route reads `?token=xxx` from the URL. Displays a new password form with 12-char minimum + confirmation. Calls `authClient.resetPassword({ newPassword, token })`. On success, redirects to `/login`.

6. **AC6: Password reset email template** — A `renderPasswordResetEmail({ userName, resetUrl })` template function exists in `packages/infrastructure/src/email-templates/password-reset.ts` following the same pattern as `drop-off-re-engagement.ts` (HTML template literal, `escapeHtml`, dark theme, purple CTA button).

7. **AC7: Email verification template** — A `renderEmailVerificationEmail({ userName, verifyUrl })` template function exists in `packages/infrastructure/src/email-templates/email-verification.ts` following the same pattern.

8. **AC8: Better Auth callbacks** — `sendResetPassword` and `emailVerification.sendVerificationEmail` callbacks are configured in `better-auth.ts` using a raw Resend SDK instance (same pattern as Polar client — Promise-based, fire-and-forget via `void resend.emails.send().catch()`).

9. **AC9: Signup redirect change** — After signup, the user is redirected to `/verify-email` instead of `/profile` or `/results`.

## Tasks / Subtasks

- [ ] Task 1: Create email verification template (AC: #7)
  - [ ] 1.1 Create `packages/infrastructure/src/email-templates/email-verification.ts` with `renderEmailVerificationEmail({ userName, verifyUrl })` returning HTML string
  - [ ] 1.2 Follow same pattern as `drop-off-re-engagement.ts`: template literal, `escapeHtml`, dark theme (#0a0e1a bg, #111827 card), purple CTA (#7c3aed)
  - [ ] 1.3 Welcome tone: "Thanks for signing up. Verify your email to get started with Nerin."
  - [ ] 1.4 Write unit tests in `packages/infrastructure/src/email-templates/__tests__/email-verification.test.ts`

- [ ] Task 2: Create password reset template (AC: #6)
  - [ ] 2.1 Create `packages/infrastructure/src/email-templates/password-reset.ts` with `renderPasswordResetEmail({ userName, resetUrl })` returning HTML string
  - [ ] 2.2 Same styling pattern as above
  - [ ] 2.3 Copy: "Reset your password to get back to your journey with Nerin."
  - [ ] 2.4 Write unit tests in `packages/infrastructure/src/email-templates/__tests__/password-reset.test.ts`

- [ ] Task 3: Wire Resend into Better Auth config (AC: #1, #8)
  - [ ] 3.1 In `packages/infrastructure/src/context/better-auth.ts`:
    - Import `Resend` from `resend`
    - Import the two template render functions
    - Instantiate `const resend = new Resend(Redacted.value(config.resendApiKey))` alongside the Polar client
  - [ ] 3.2 Set `requireEmailVerification: true` in `emailAndPassword` config
  - [ ] 3.3 Add `emailVerification` config with `sendOnSignUp: true`, `autoSignInAfterVerification: true`, and `sendVerificationEmail` callback that calls `void resend.emails.send({ from, to, subject, html: renderEmailVerificationEmail(...) }).catch(e => logger.error(...))`
  - [ ] 3.4 Add `sendResetPassword` callback with same fire-and-forget pattern using `renderPasswordResetEmail()`

- [ ] Task 4: Add "Forgot password?" link to login form (AC: #3)
  - [ ] 4.1 In `apps/front/src/components/auth/login-form.tsx`, add a text link between the password field and the submit button
  - [ ] 4.2 Link navigates to `/forgot-password` using `<a>` or TanStack Router `Link`

- [ ] Task 5: Create /forgot-password route (AC: #4)
  - [ ] 5.1 Create `apps/front/src/routes/forgot-password.tsx`
  - [ ] 5.2 `beforeLoad`: redirect authenticated users to `/profile`
  - [ ] 5.3 Email input form, on submit calls `authClient.forgetPassword({ email, redirectTo: frontendUrl + "/reset-password" })`
  - [ ] 5.4 Always shows success message after submission (anti-enumeration)
  - [ ] 5.5 Style consistent with login/signup pages

- [ ] Task 6: Create /reset-password route (AC: #5)
  - [ ] 6.1 Create `apps/front/src/routes/reset-password.tsx`
  - [ ] 6.2 Read `token` from search params
  - [ ] 6.3 New password + confirm password form with 12-char minimum
  - [ ] 6.4 Calls `authClient.resetPassword({ newPassword, token })`
  - [ ] 6.5 On success, redirect to `/login`
  - [ ] 6.6 Show error state for invalid/expired tokens

- [ ] Task 7: Create /verify-email route (AC: #2)
  - [ ] 7.1 Create `apps/front/src/routes/verify-email.tsx`
  - [ ] 7.2 Three states: verified (link to profile), error (resend button), pending (check inbox + resend button)
  - [ ] 7.3 Resend button calls `authClient.sendVerificationEmail({ email, callbackURL: "/profile" })`

- [ ] Task 8: Update signup form redirect (AC: #9)
  - [ ] 8.1 In `apps/front/src/components/auth/signup-form.tsx`, after successful signup redirect to `/verify-email` instead of `/profile` or `/results`

## Dev Notes

- **Better Auth callbacks pattern:** The `sendResetPassword` and `sendVerificationEmail` callbacks run in Better Auth's Promise-based world (not Effect). Use raw Resend SDK (`resend.emails.send(...)`) with fire-and-forget pattern: `void resend.emails.send(...).catch(e => logger.error(...))`. This matches the Polar webhook handler pattern already in `better-auth.ts`.
- **No new dependencies:** The `resend` package is already installed in the infrastructure package (Story 31-7).
- **Frontend URL for email links:** Better Auth provides the callback URL to the template callbacks. Use `config.frontendUrl` for constructing redirect URLs.
- **Email from address:** Use `config.emailFromAddress` (already configured in AppConfig from Story 31-7).
- **Route pattern:** Follow existing `/login.tsx` and `/signup.tsx` patterns for the 3 new routes.
- **Better Auth client methods:** `forgetPassword`, `resetPassword`, `sendVerificationEmail`, `verifyEmail` are already exported from `auth-client.ts`.
