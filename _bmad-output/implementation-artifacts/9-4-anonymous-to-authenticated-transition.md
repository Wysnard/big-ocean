# Story 9.4: Anonymous-to-Authenticated Transition

Status: ready-for-dev

## Story

As an anonymous user who has been chatting with Nerin,
I want to sign up and have my existing session linked to my new account,
So that I don't lose my conversation progress.

## Acceptance Criteria

1. **Given** an anonymous user with an active session **When** they sign up or log in **Then** the existing session's `user_id` is updated to the new account **And** `assessment_message.user_id` is backfilled for all user-authored messages **And** the conversation continues seamlessly

2. **Given** an anonymous user completes auth **When** the session is linked **Then** the `session_token` is rotated (new token, old invalidated) **And** the `assessment_token` cookie is cleared (no longer needed — Better Auth session cookie takes over)

3. **Given** an authenticated user with an existing session **When** they try to link an anonymous session **Then** the anonymous session is rejected (one-session-per-user enforced via partial unique index `WHERE user_id IS NOT NULL`)

4. **Given** an anonymous user signs up **When** the user account is created **Then** `databaseHooks.user.create.after` fires **And** `linkAnonymousAssessmentSession()` runs atomically in a transaction

5. **Given** an anonymous user logs in **When** the session is created **Then** `databaseHooks.session.create.after` fires (skips sign-up routes) **And** `linkAnonymousAssessmentSession()` runs atomically

6. **Given** a linked session **When** the user sends the next message **Then** the handler resolves identity via `CurrentUser` (Better Auth session cookie) **And** anonymous `assessment_token` cookie auth is no longer used for this session

7. **Given** an anonymous user on the chat page **When** they click "Sign Up" or "Log In" **Then** the `anonymousSessionId` is passed to the auth form via `?sessionId=` query param **And** post-auth they are redirected back to `redirectTo` (or `/assessment` by default)

## Tasks / Subtasks

- [ ] Task 1: Verify and harden `linkAnonymousAssessmentSession()` (AC: #1, #2, #4, #5)
  - [ ] 1.1: Read `packages/infrastructure/src/context/better-auth.ts` — verify `linkAnonymousAssessmentSession()` handles: (a) session assignment, (b) message backfill, (c) transaction atomicity, (d) idempotent relinking
  - [ ] 1.2: Verify `assignUserId()` in `assessment-session.drizzle.repository.ts` clears `session_token` after user assignment (token becomes unnecessary once Better Auth session takes over)
  - [ ] 1.3: Verify `rotateToken()` is called OR confirm token clearing in `assignUserId()` is sufficient (architecture says rotate, but clearing may be equivalent if cookie is also removed)
  - [ ] 1.4: Verify `databaseHooks.user.create.after` (signup) and `databaseHooks.session.create.after` (signin) both call linking function with correct parameters
  - [ ] 1.5: Verify sign-in hook skips when request path is `/api/auth/sign-up/email` (prevents double-linking during signup)

- [ ] Task 2: Handle one-session-per-user conflict (AC: #3)
  - [ ] 2.1: Test that `linkAnonymousAssessmentSession()` fails gracefully when authenticated user already has a session (partial unique index violation)
  - [ ] 2.2: Define conflict resolution: if user already has an active session, keep the session with more messages (architecture spec) — OR simply reject the link and keep user's existing session
  - [ ] 2.3: Add error handling in Better Auth hook for unique constraint violation — log warning, do NOT crash auth flow (user should still authenticate even if linking fails)
  - [ ] 2.4: Surface the conflict to the frontend: after auth, check if session was linked (GET `/api/assessment/session-status`) — if user's own session is different from the anonymous one, redirect to user's session

- [ ] Task 3: Frontend post-auth transition flow (AC: #6, #7)
  - [ ] 3.1: Verify chat page provides "Sign Up" / "Log In" CTAs that pass `anonymousSessionId` to auth forms via `buildAuthPageHref()` in `apps/front/src/lib/auth-session-linking.ts`
  - [ ] 3.2: Verify `signup-form.tsx` and `login-form.tsx` pass `anonymousSessionId` to Better Auth API in request body
  - [ ] 3.3: Implement post-auth session verification: after redirect back from auth, call `GET /api/auth/get-session` to confirm auth → then fetch session status to confirm linking
  - [ ] 3.4: Clear `assessment_token` cookie on the frontend after successful auth transition (cookie scoped to `/api/assessment` path)
  - [ ] 3.5: Handle edge case: user navigates away during auth flow — on return, detect auth state via `useSession()` and reconcile

- [ ] Task 4: Verify dual-auth handler continuity (AC: #6)
  - [ ] 4.1: Verify `apps/api/src/handlers/assessment.ts` sendMessage handler correctly resolves authenticated user via `CurrentUser` after transition
  - [ ] 4.2: Verify that after linking, the handler stops looking for anonymous token (because `CurrentUser` is now set)
  - [ ] 4.3: Test message flow: anonymous msg → sign up → next msg uses Better Auth — no session mismatch

- [ ] Task 5: Unit tests — session linking (AC: #1, #2, #3)
  - [ ] 5.1: Test `linkAnonymousAssessmentSession()`: anonymous session → linked with user_id + message backfill
  - [ ] 5.2: Test idempotent relink: same user re-links same session → no error
  - [ ] 5.3: Test conflict: user already has a session → graceful rejection, auth still succeeds
  - [ ] 5.4: Test token clearing: after link, `session_token` is NULL
  - [ ] 5.5: Test message backfill: all user-authored messages get `user_id` set
  - [ ] 5.6: Test invalid session ID: linking with non-existent session → logged warning, no crash

- [ ] Task 6: Integration tests (AC: all)
  - [ ] 6.1: Full anonymous → signup → linked flow: start anonymous assessment → send 2 messages → sign up with `anonymousSessionId` → verify session linked → send next message as authenticated user
  - [ ] 6.2: Full anonymous → login → linked flow: same as 6.1 but with existing account login
  - [ ] 6.3: Conflict flow: user with existing session → create anonymous session → sign in → verify original session preserved
  - [ ] 6.4: Cookie transition: verify `assessment_token` cookie no longer required after auth transition

## Dev Notes

### Architecture Context

This story bridges anonymous and authenticated experiences — the critical UX inflection point where a casual visitor becomes a committed user. The linking infrastructure is **already built** in Stories 9-1 through 9-3. This story is primarily about **verification, hardening, edge cases, and testing**.

### What Already Exists (DO NOT Rebuild)

**Backend — Session linking (fully functional):**
- `linkAnonymousAssessmentSession()` in `packages/infrastructure/src/context/better-auth.ts` (lines 86-137) — atomic transaction: updates `assessment_session.user_id`, backfills `assessment_message.user_id`
- Database hooks: `databaseHooks.user.create.after` (signup) and `databaseHooks.session.create.after` (signin) — both trigger linking
- `assignUserId()` in `packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts` — sets user_id, clears session_token
- `rotateToken()` in same file — generates new 32-byte hex token (may not be needed if clearing is sufficient)
- Partial unique index: `assessment_session_user_id_unique WHERE user_id IS NOT NULL`

**Frontend — Auth form integration (fully functional):**
- `signup-form.tsx` and `login-form.tsx` accept `anonymousSessionId` prop, pass to Better Auth API
- `auth-session-linking.ts` — `buildAuthPageHref()`, `buildPostAuthRedirect()`, `getActiveAssessmentSessionId()`
- Auth routes accept `?sessionId=` + `?redirectTo=` query params
- `use-auth.ts` hook wraps Better Auth client with `anonymousSessionId` support

**Handler — Dual auth (fully functional):**
- `assessment.ts` handler checks `CurrentUser` (Better Auth) first, falls back to `assessment_token` cookie
- After linking, `CurrentUser` resolves to the user ID → anonymous token path is bypassed

### Key Implementation Details

**Session linking flow (already implemented):**
```
Anonymous user clicks "Sign Up"
  → Frontend passes anonymousSessionId in body to /api/auth/sign-up/email
  → Better Auth creates user + session
  → databaseHooks.user.create.after fires
    → linkAnonymousAssessmentSession(userId, anonymousSessionId, "signup")
      → Transaction: UPDATE assessment_session SET user_id = ? WHERE id = ? AND user_id IS NULL
      → Transaction: UPDATE assessment_message SET user_id = ? WHERE session_id = ? AND role = 'user'
  → Better Auth returns session cookie
  → Frontend redirects to assessment/results
```

**Token rotation vs clearing:** Architecture doc says "rotate token" but `assignUserId()` implementation **clears** `session_token` to NULL (equivalent security — the token is invalidated either way). Clearing is simpler and correct because once Better Auth session cookie is active, the anonymous token is never checked again.

**Conflict resolution:** If the authenticated user already has an active session (unique index violation), the linking function should catch the constraint error, log a warning, and let the auth flow proceed normally. The user keeps their existing session. The anonymous session remains orphaned (acceptable — it has no user_id).

### Error Types

No new HTTP error types needed. Session linking happens inside Better Auth hooks (server-side, transparent to user). Errors are logged, not surfaced as HTTP responses.

Existing errors that may surface:
- `AssessmentAlreadyExists` (429) — from `start-assessment` if user already has a session and tries to start new one
- `DatabaseError` — from repository operations (internal, logged)

### Testing Standards

- **Unit tests:** Vitest with `@effect/vitest` for Effect programs, `vi.mock()` for repository mocks
- **Integration tests:** Docker Compose test environment (`compose.test.yaml`)
- **Component tests:** Vitest + React Testing Library for frontend auth forms
- Follow existing mock patterns from `packages/infrastructure/src/repositories/__mocks__/`

### Previous Story Intelligence (Story 9-3)

**Key learnings:**
- Better Auth hooks are the correct place for session linking — they fire after user/session creation but within the same request
- `getAnonymousSessionId(context)` extracts the ID from the request body — this is how the linking function knows which session to link
- Error messages normalized for security: login always shows "Invalid email or password" regardless of whether email exists
- Open redirect guard on `redirectTo` param — validates against relative paths only
- Test counts after 9-3: 362 tests (193 front + 169 API)
- `MESSAGE_THRESHOLD` default is 25 in `app-config.live.ts` (not 30)

**From Story 9-2:**
- Dual auth pattern established and working: `AssessmentTokenSecurity` (anonymous) + `CurrentUser` (authenticated)
- `message_count` increments with atomic SQL
- Orchestrator files NOT yet removed (still referenced by integration tests)

### Cookie Lifecycle

| Phase | `assessment_token` cookie | `better-auth.session_token` cookie |
|-------|--------------------------|-----------------------------------|
| Anonymous | Set (httpOnly, `/api/assessment`, 30 days) | Not set |
| During auth | Still present | Set by Better Auth |
| Post-transition | Should be cleared (frontend) | Active (httpOnly, 7 days) |
| Authenticated messages | Ignored (CurrentUser takes priority) | Used for auth |

**Frontend cookie clearing:** After successful auth + redirect, the frontend should clear the `assessment_token` cookie. Since it's httpOnly, this requires either:
- (a) A server endpoint that sets the cookie with `maxAge: 0` — preferred
- (b) The handler naturally stops setting it once user is authenticated — already the case for subsequent requests

In practice, the cookie expires naturally (30-day maxAge) and is ignored once `CurrentUser` is present. No explicit clearing strictly necessary, but clean practice.

### Project Structure Notes

- Session linking logic: `packages/infrastructure/src/context/better-auth.ts`
- Session repository: `packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts`
- Session repository interface: `packages/domain/src/repositories/assessment-session.repository.ts`
- Auth handler: `apps/api/src/handlers/assessment.ts`
- Auth middleware: `apps/api/src/middleware/auth.middleware.ts` + `better-auth.ts`
- Frontend auth forms: `apps/front/src/components/auth/login-form.tsx`, `signup-form.tsx`
- Frontend auth helpers: `apps/front/src/lib/auth-session-linking.ts`
- Frontend auth hook: `apps/front/src/hooks/use-auth.ts`
- DB schema: `packages/infrastructure/src/db/drizzle/schema.ts`
- Assessment token security: `packages/contracts/src/security/assessment-token.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.4] — Story acceptance criteria
- [Source: _bmad-output/planning-artifacts/architecture.md#Security-Anonymous-Session-Auth] — Token rotation on auth, session fixation prevention
- [Source: _bmad-output/planning-artifacts/architecture.md#Results-Data-Storage] — One session per user, partial unique index, conflict resolution
- [Source: packages/infrastructure/src/context/better-auth.ts#linkAnonymousAssessmentSession] — Existing linking implementation
- [Source: packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts#assignUserId] — Session assignment + token clearing
- [Source: apps/api/src/handlers/assessment.ts] — Dual auth handler pattern
- [Source: apps/front/src/lib/auth-session-linking.ts] — Frontend session linking helpers
- [Source: _bmad-output/implementation-artifacts/9-3-user-registration-and-login.md] — Previous story (auth hardening)
- [Source: _bmad-output/implementation-artifacts/9-2-send-message-and-nerin-response.md] — Dual auth pattern origin

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
