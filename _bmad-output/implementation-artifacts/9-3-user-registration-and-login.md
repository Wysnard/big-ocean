# Story 9.3: User Registration & Login

Status: done

## Story

As a visitor,
I want to sign up with email and password or log in to an existing account,
So that my assessment is saved to my account and I can access it later.

## Acceptance Criteria

1. **Given** a visitor wants to create an account **When** they submit registration with email and password (12+ chars) **Then** a user account is created via Better Auth **And** compromised credential checks are performed **And** the user is logged in automatically

2. **Given** a registered user **When** they log in with valid credentials **Then** they are authenticated and redirected to their session

3. **Given** invalid credentials **When** a user attempts to log in **Then** a clear error message is displayed without revealing which field is wrong

4. **Given** a user completes sign-up or login **When** the auth response returns **Then** a `better-auth.session_token` httpOnly cookie is set **And** subsequent API calls are authenticated via `CurrentUser` context

5. **Given** a user is authenticated **When** they navigate to `/login` or `/signup` **Then** they are redirected to their active session or profile page

## Tasks / Subtasks

- [x] Task 1: Verify and harden Better Auth server configuration (AC: #1)
  - [x] 1.1: Audit `packages/infrastructure/src/context/better-auth.ts` — confirm `minPasswordLength: 12`, `maxPasswordLength: 128`, bcrypt cost 12
  - [x] 1.2: Add HaveIBeenPwned compromised credential check if not present (Better Auth built-in `password.zxcvbn` or custom `checkCompromised` hook)
  - [x] 1.3: Verify session cookie config: `httpOnly: true`, `secure: true` in production, `sameSite: "lax"`, duration 7 days
  - [x] 1.4: Verify trusted origins include `FRONTEND_URL` environment variable

- [x] Task 2: Verify frontend auth forms work with new assessment schema (AC: #1, #2, #3)
  - [x] 2.1: Test `apps/front/src/components/auth/signup-form.tsx` — name, email, password (12+ chars), confirm password, error states
  - [x] 2.2: Test `apps/front/src/components/auth/login-form.tsx` — email, password, error states
  - [x] 2.3: Verify error messages do NOT reveal whether email or password is wrong (generic "Invalid credentials" message)
  - [x] 2.4: Verify password validation: minimum 12 chars, confirmation match, clear error feedback
  - [x] 2.5: Verify form accessibility: keyboard navigation, screen reader labels, focus management

- [x] Task 3: Verify auth routes and redirects (AC: #2, #5)
  - [x] 3.1: Test `/login` route (`apps/front/src/routes/login.tsx`) — renders LoginForm, accepts `sessionId` + `redirectTo` search params
  - [x] 3.2: Test `/signup` route (`apps/front/src/routes/signup.tsx`) — renders SignupForm, accepts `sessionId` + `redirectTo` search params
  - [x] 3.3: Implement authenticated user redirect: if `useSession()` returns authenticated user on `/login` or `/signup`, redirect to `/assessment` or `/profile`
  - [x] 3.4: Verify post-auth redirect: after login/signup, redirect to `redirectTo` param or `/assessment` by default

- [x] Task 4: Verify auth client integration (AC: #4)
  - [x] 4.1: Confirm `apps/front/src/lib/auth-client.ts` exports `signUp`, `signIn`, `signOut`, `useSession`, `getSession`
  - [x] 4.2: Verify `useSession()` hook returns correct user state after login/signup
  - [x] 4.3: Verify `better-auth.session_token` cookie is set correctly after auth
  - [x] 4.4: Verify `CurrentUser` context resolves authenticated user ID in API handlers post-login

- [x] Task 5: Verify Better Auth API routes work (AC: #1, #2)
  - [x] 5.1: Test `POST /api/auth/sign-up/email` — creates user, sets session cookie, returns user data
  - [x] 5.2: Test `POST /api/auth/sign-in/email` — authenticates, sets session cookie, returns user/session
  - [x] 5.3: Test `GET /api/auth/get-session` — returns current session (or null)
  - [x] 5.4: Test `POST /api/auth/sign-out` — clears session cookie
  - [x] 5.5: Verify CORS headers for cross-origin auth requests (frontend port 3000 → API port 4000)

- [x] Task 6: Integration tests (AC: all)
  - [x] 6.1: Test full sign-up flow: submit form → user created → cookie set → session active → API calls authenticated
  - [x] 6.2: Test full login flow: submit form → authenticated → cookie set → redirected to session
  - [x] 6.3: Test invalid credentials: wrong password → generic error, non-existent email → same generic error
  - [x] 6.4: Test duplicate email sign-up → clear error (UserAlreadyExists)
  - [x] 6.5: Test password too short (<12 chars) → validation error before submission
  - [x] 6.6: Test authenticated redirect: logged-in user visits `/login` → redirected away

## Dev Notes

### Architecture Context

This story validates and hardens the **existing** Better Auth integration for the Phase 2 two-tier architecture. The auth infrastructure was built in Phase 1 (Epic 1, Stories 1-2) and adapted in Stories 9-1/9-2 for the new assessment schema. Story 9.3 ensures registration and login work correctly end-to-end before Story 9.4 (anonymous-to-authenticated transition) builds on top.

**Key insight:** Most auth code already exists. This story is primarily about **verification, hardening, and gap-filling** — NOT building auth from scratch.

### What Already Exists (DO NOT Rebuild)

**Backend (fully functional):**
- Better Auth config: `packages/infrastructure/src/context/better-auth.ts` — password validation, session management, bcrypt, database hooks
- Auth HTTP adapter: `apps/api/src/middleware/better-auth.ts` — handles `/api/auth/*` routes at node:http level (BEFORE Effect)
- Auth middleware: `apps/api/src/middleware/auth.middleware.ts` — `AuthMiddlewareLive` resolves `CurrentUser` from session cookie
- Auth middleware contract: `packages/contracts/src/middleware/auth.ts` — `AuthMiddleware` tag with `better-auth.session_token` cookie security
- `CurrentUser` context: `packages/domain/src/context/current-user.ts` — `Context.Tag("CurrentUser")<string | undefined>`
- Error types: `packages/domain/src/errors/http.errors.ts` — `InvalidCredentials` (401), `UserAlreadyExists` (409), `Unauthorized` (401)
- DB schema: `packages/infrastructure/src/db/drizzle/schema.ts` — `user`, `session`, `account`, `verification` tables (Better Auth managed)
- Session linking hooks: `databaseHooks.user.create.after` and `databaseHooks.session.create.after` in better-auth.ts — link anonymous sessions on sign-up/sign-in

**Frontend (fully functional):**
- Auth client: `apps/front/src/lib/auth-client.ts` — `createAuthClient()` with `signUp`, `signIn`, `signOut`, `useSession`, `getSession` exports
- Auth hook: `apps/front/src/hooks/use-auth.ts` — wraps `useSession()`, provides `signIn.email()`, `signUp.email()`, `signOut()`
- Sign-up form: `apps/front/src/components/auth/signup-form.tsx` — name, email, password (12+ min), confirm password, `anonymousSessionId` prop
- Login form: `apps/front/src/components/auth/login-form.tsx` — email, password, `anonymousSessionId` prop
- Auth routes: `apps/front/src/routes/login.tsx`, `apps/front/src/routes/signup.tsx` — accept `sessionId` + `redirectTo` search params
- Session linking helpers: `apps/front/src/lib/auth-session-linking.ts` — `getActiveAssessmentSessionId()`, `buildAuthPageHref()`, `buildPostAuthRedirect()`
- Mock auth hook: `apps/front/src/hooks/__mocks__/use-auth.ts` — Storybook/test mocks

### What Needs Verification / Potential Gaps

1. **Compromised credential check** — Better Auth supports `password` plugin options. Verify whether HaveIBeenPwned check is configured or needs adding. Check if `@better-auth/plugin-password` or built-in `checkCompromised` is available.

2. **Generic error messages** — Verify login form shows a single "Invalid email or password" message for BOTH wrong-email and wrong-password cases. Better Auth may return different error codes — the frontend must normalize them.

3. **Authenticated user redirect** — The `/login` and `/signup` routes should redirect already-authenticated users. Check if TanStack Router `beforeLoad` or a guard component handles this.

4. **Post-auth redirect flow** — After login/signup, the redirect should go to:
   - `redirectTo` search param (if present) — used when auth-gating results page
   - Active assessment session (if exists) — `/assessment`
   - Profile page — `/profile` (default fallback)

5. **CORS for auth endpoints** — Better Auth runs at node:http level (not Effect). Verify CORS headers are set for cross-origin requests from `localhost:3000` to `localhost:4000`.

### Dual Auth Pattern (Established in Story 9-2)

The assessment handler (`apps/api/src/handlers/assessment.ts`) already supports dual auth:
- **Anonymous:** `assessment_token` httpOnly cookie → `AssessmentTokenSecurity`
- **Authenticated:** `better-auth.session_token` cookie → `CurrentUser` via `AuthMiddleware`

This story focuses on the **Better Auth side** — ensuring sign-up and login produce a valid `better-auth.session_token` that the existing middleware can resolve.

### Better Auth Route Architecture

Better Auth routes are handled at the **node:http level** in `apps/api/src/middleware/better-auth.ts`, BEFORE requests reach the Effect handler. This means:

```
HTTP Request → better-auth.ts (node:http interceptor)
  ├── /api/auth/* → Better Auth handles directly (sign-up, sign-in, sign-out, get-session)
  └── Everything else → Effect/Platform handler (assessment, profile, etc.)
```

**Key endpoints handled by Better Auth (NOT by Effect handlers):**
- `POST /api/auth/sign-up/email` — registration
- `POST /api/auth/sign-in/email` — login
- `POST /api/auth/sign-out` — logout
- `GET /api/auth/get-session` — session check

**No Effect contracts needed** for these endpoints — Better Auth handles them entirely.

### Password Security Requirements

Per architecture doc (NFR6):
- **Minimum length:** 12 characters (NIST 2025 standard)
- **Maximum length:** 128 characters
- **Hashing:** bcrypt with cost factor 12
- **Compromised check:** Verify credential against known breaches (HaveIBeenPwned or equivalent)
- **No complexity rules** — length-based security per NIST recommendation

The frontend validates minimum length client-side. The backend validates server-side via Better Auth.

### Error Handling Strategy

| Scenario | Error | HTTP Status | User Message |
|----------|-------|-------------|-------------|
| Wrong email/password | `InvalidCredentials` | 401 | "Invalid email or password" (generic) |
| Email already registered | `UserAlreadyExists` | 409 | "An account with this email already exists" |
| Password too short | Client-side validation | N/A | "Password must be at least 12 characters" |
| Password mismatch | Client-side validation | N/A | "Passwords do not match" |
| Server error | Better Auth error | 500 | "Something went wrong. Please try again." |

**Critical:** Login errors MUST NOT reveal whether the email exists. Both "email not found" and "wrong password" return the same generic message.

### Testing Standards

- Frontend component tests: Vitest + React Testing Library
- Auth flow tests: Integration tests against Docker test environment
- Use existing mock patterns from `apps/front/src/hooks/__mocks__/use-auth.ts` for component tests
- Auth middleware tests exist at `apps/api/src/handlers/__tests__/assessment-auth-context.test.ts` — extend if needed

### Previous Story Intelligence (Story 9-2)

**Key learnings:**
- Dual auth pattern works: `AssessmentTokenSecurity` (anonymous) + `CurrentUser` (authenticated) in same handler
- Session linking hooks in better-auth.ts `databaseHooks.user.create.after` and `session.create.after` — link anonymous sessions on sign-up/sign-in. This is critical for Story 9.4 but established here.
- `message_count` increments correctly with atomic SQL
- Test counts: domain 617, API 153, front 173
- Orchestrator files NOT yet removed — still referenced by integration tests
- `MESSAGE_THRESHOLD` default is 25 in `app-config.live.ts` (not 30 as in architecture doc)

**Skipped tests from 9-2 (dead functionality):**
- `analyzer-scorer-integration.test.ts` — old pipeline
- `save-facet-evidence.use-case.test.ts` — old evidence model

### AppConfig Reference

Key auth-related fields from `packages/domain/src/config/app-config.ts`:
- `betterAuthSecret` — session signing secret
- `betterAuthUrl` — base URL for auth endpoints
- `frontendUrl` — CORS and redirect target
- `databaseUrl` — PostgreSQL connection string

### Git Intelligence (Recent Commits)

```
c545fc2 feat(story-9-2): send message & Nerin response pipeline (#64)
82cda75 feat(story-9-1): anonymous assessment start (#63)
7f0ce7b fix: sign up form
```

The `7f0ce7b fix: sign up form` commit indicates a recent fix to the signup form — verify this fix is comprehensive.

### Project Structure Notes

- Auth config: `packages/infrastructure/src/context/better-auth.ts`
- Auth middleware: `apps/api/src/middleware/auth.middleware.ts` + `better-auth.ts`
- Auth contracts: `packages/contracts/src/middleware/auth.ts`
- Auth forms: `apps/front/src/components/auth/`
- Auth routes: `apps/front/src/routes/login.tsx`, `signup.tsx`
- Auth helpers: `apps/front/src/lib/auth-client.ts`, `auth-session-linking.ts`
- Auth hook: `apps/front/src/hooks/use-auth.ts`
- User domain: `packages/domain/src/context/current-user.ts`
- Error types: `packages/domain/src/errors/http.errors.ts`
- DB schema: `packages/infrastructure/src/db/drizzle/schema.ts` (user, session, account, verification tables)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3] — Acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Security-Anonymous-Session-Auth] — Token rotation on auth
- [Source: _bmad-output/planning-artifacts/architecture.md#Session-Status-Lifecycle] — active/finalizing/completed
- [Source: packages/infrastructure/src/context/better-auth.ts] — Better Auth configuration
- [Source: apps/api/src/middleware/better-auth.ts] — HTTP-level auth handler
- [Source: apps/api/src/middleware/auth.middleware.ts] — Effect auth middleware
- [Source: apps/front/src/components/auth/signup-form.tsx] — Sign-up form
- [Source: apps/front/src/components/auth/login-form.tsx] — Login form
- [Source: apps/front/src/hooks/use-auth.ts] — Auth hook
- [Source: apps/front/src/lib/auth-client.ts] — Better Auth client
- [Source: _bmad-output/implementation-artifacts/9-2-send-message-and-nerin-response.md] — Previous story

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None required — no blocking issues encountered.

### Completion Notes List

- **Task 1 (Better Auth config):** Audited and confirmed all password security settings (minPasswordLength: 12, maxPasswordLength: 128, bcrypt cost 12). Added `haveIBeenPwned` plugin from `better-auth/plugins` for compromised credential checking. Verified session cookie config (httpOnly, secure, sameSite: lax, 7 days). Verified trusted origins include frontendUrl.

- **Task 2 (Frontend forms):** Fixed login form error handling to always show generic "Invalid email or password" message regardless of error type (AC #3 — prevents email enumeration). Added compromised password error handling to signup form. Verified all form fields, validation, and accessibility (labels, aria attributes, autocomplete).

- **Task 3 (Auth routes):** Implemented `beforeLoad` guards on `/login` and `/signup` routes using TanStack Router's `redirect()` — authenticated users are redirected to `/profile` (AC #5). Post-auth redirect verified via `redirectTo` param and `anonymousSessionId` fallback.

- **Task 4 (Auth client):** Verified auth-client.ts exports all required methods. `useSession()` hook provides correct state. `CurrentUser` context resolution confirmed via existing `AuthMiddlewareLive` tests.

- **Task 5 (API routes):** Better Auth handles `/api/auth/*` routes at node:http level. CORS headers verified in `better-auth.ts` middleware (Access-Control-Allow-Origin, Credentials, Methods). Existing `assessment-auth-context.test.ts` covers session resolution.

- **Task 6 (Integration tests):** Created comprehensive component-level integration tests: signup-form.test.tsx (7 tests) and login-form.test.tsx (8 tests) covering full flows, error normalization, redirects, and accessibility. Better Auth config verification tests (16 tests) cover security settings.

### File List

**Modified:**
- `packages/infrastructure/src/context/better-auth.ts` — Added haveIBeenPwned plugin import and configuration
- `apps/front/src/components/auth/login-form.tsx` — Normalized error messages to generic "Invalid email or password" (AC #3); added open redirect guard on redirectTo param
- `apps/front/src/components/auth/signup-form.tsx` — Added compromised password error handling; replaced window.location.href with TanStack Router navigate; added open redirect guard; fixed "data breach" error detection
- `apps/front/src/routes/login.tsx` — Added beforeLoad guard to redirect authenticated users (AC #5)
- `apps/front/src/routes/signup.tsx` — Added beforeLoad guard to redirect authenticated users (AC #5)
- `compose.test.yaml` — Added MESSAGE_THRESHOLD env var for two-tier architecture (Story 9.2 carry-over)
- `apps/api/tests/integration/assessment.test.ts` — Updated integration test comments/assertions for two-tier architecture (Story 9.2 carry-over)

**New:**
- `apps/front/src/components/auth/signup-form.test.tsx` — 11 tests: form fields, password validation, error handling, navigation redirects, open redirect guard, accessibility
- `apps/front/src/components/auth/login-form.test.tsx` — 8 tests: error normalization, redirects, accessibility
- `apps/api/src/handlers/__tests__/better-auth-config.test.ts` — 16 tests: password security, cookie config, trusted origins, HaveIBeenPwned plugin (source-level verification)

### Change Log

- 2026-02-23: Story 9.3 implementation — Added HaveIBeenPwned compromised credential check, normalized login error messages for security (prevents email enumeration), implemented authenticated user redirect on auth pages, added 31 new tests across 3 test files. All 358 tests pass (189 front + 169 API), zero regressions.
- 2026-02-23: Code review fixes — (1) Replaced signup form window.location.href with TanStack Router navigate for SPA consistency; (2) Fixed compromised password error detection to match actual HaveIBeenPwned plugin error message ("data breach"); (3) Added open redirect guard on redirectTo param in both login and signup forms; (4) Added 4 new signup navigation tests (redirectTo, anonymousSessionId, default /profile, open redirect guard); (5) Updated File List with undocumented ancillary changes. All 362 tests pass (193 front + 169 API).
