# Story 14.3: Invitee Assessment Flow

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **invitee**,
I want **to complete my own personality assessment after clicking an invitation link**,
so that **a relationship analysis can be generated from both our profiles**.

## Acceptance Criteria

1. **AC1 — Invitation landing page:** When a person clicks an invitation link (`/invite/:token`), the system validates the token via `GET /api/relationship/public/invitations/:token`. If valid and not expired, the page shows the inviter's display name, their personal message (if any), and a CTA to start an assessment. If invalid/expired, the page shows an appropriate error state.

2. **AC2 — Invitation token in httpOnly cookie:** When a valid invitation link is loaded, the invitation token is stored in an httpOnly cookie (`invite_token`) so it persists through the signup/login flow (FR57). The cookie is set by the API when the invitee initiates their assessment, and cleared after the invitee is linked to the invitation.

3. **AC3 — New-user invitee flow:** If the invitee is not authenticated, they are redirected to start a normal anonymous Nerin conversation (`/chat`). After completing the assessment and signing up, the backend reads the `invite_token` cookie, links the invitee's user ID to the invitation (`invitee_user_id`), updates the invitation status to `accepted`, and clears the cookie (FR51, FR57).

4. **AC4 — Existing-user invitee with completed assessment:** If the invitee is already authenticated AND has a completed assessment, they reuse their existing assessment — no new conversation required (FR56). The invitation is linked directly to their profile, and the invitation status is set to `accepted`.

5. **AC5 — Existing-user invitee without completed assessment:** If the invitee is authenticated but has NO completed assessment, the invite token cookie is set and they are redirected to `/chat` to start/resume their assessment.

6. **AC6 — Accept invitation endpoint:** A new `POST /api/relationship/invitations/:token/accept` endpoint (authenticated) accepts the invitation: sets `invitee_user_id` and updates `status = 'accepted'` atomically. Returns the updated invitation. (Note: canonical pair deduplication via `MIN/MAX(userId)` is handled in Story 14-4 when creating the `relationship_analyses` row.)

7. **AC7 — Refuse invitation endpoint:** A new `POST /api/relationship/invitations/:token/refuse` endpoint (authenticated) refuses the invitation: updates `status = 'refused'`. Credit is NOT refunded (FR54).

8. **AC8 — Self-invitation guard:** A user cannot accept their own invitation. The accept endpoint returns an error if `invitee_user_id === inviter_user_id`.

9. **AC9 — Race condition protection:** If an invitation is already accepted or refused, subsequent accept/refuse calls return an error. PostgreSQL status column is the source of truth — `accepted` blocks `refused` and vice versa (FM5).

10. **AC10 — Populate `inviterDisplayName`:** The `getInvitationByToken` use-case/handler populates the `inviterDisplayName` field (already in the contract schema) by looking up the inviter's name from the user table.

11. **AC11 — Unit test coverage:** Use-case tests cover: accept happy path (existing user with assessment), accept happy path (new user post-signup), refuse, self-invitation rejection, already-accepted/refused error, expired invitation error.

12. **AC12 — E2E test coverage:** A Playwright e2e spec validates: landing page loads with inviter info, existing-user-with-assessment accepts invitation directly, refuse flow.

## Tasks / Subtasks

- [x]**Task 1: Domain — add repository methods for accept/refuse** (AC: #6, #7, #8, #9)
  - [x]1.1 Add `acceptInvitation` method to `RelationshipInvitationRepository` interface in `packages/domain/src/repositories/relationship-invitation.repository.ts`:
    ```typescript
    readonly acceptInvitation: (input: {
      token: string;
      inviteeUserId: string;
    }) => Effect.Effect<RelationshipInvitation, DatabaseError | InvitationNotFoundError | InvitationAlreadyRespondedError | SelfInvitationError>;
    ```
    Note: The method accepts `token` (not `invitationId`) and performs the self-invitation guard atomically in the WHERE clause (`AND inviter_user_id != inviteeUserId`). This eliminates the TOCTOU race between a separate getByToken + acceptInvitation call.
  - [x]1.2 Add `refuseInvitation` method to the same interface:
    ```typescript
    readonly refuseInvitation: (input: {
      token: string;
    }) => Effect.Effect<RelationshipInvitation, DatabaseError | InvitationNotFoundError | InvitationAlreadyRespondedError>;
    ```
    Note: Refuse does NOT set `invitee_user_id` — that column semantically means "who accepted." Refuse only updates `status = 'refused'`.
  - [x]1.3 Add `getByTokenWithInviterName` method to support AC10:
    ```typescript
    readonly getByTokenWithInviterName: (token: string) => Effect.Effect<
      { invitation: RelationshipInvitation; inviterDisplayName: string | undefined },
      DatabaseError | InvitationNotFoundError
    >;
    ```
  - [x]1.4 Add new error type `InvitationAlreadyRespondedError` to `packages/contracts/src/errors.ts` (HTTP-facing errors live in contracts per Error Location Rules):
    ```typescript
    export class InvitationAlreadyRespondedError extends S.TaggedError<InvitationAlreadyRespondedError>()(
      "InvitationAlreadyRespondedError",
      { message: S.String }
    ) {}
    ```
  - [x]1.5 Add `SelfInvitationError` to `packages/contracts/src/errors.ts`:
    ```typescript
    export class SelfInvitationError extends S.TaggedError<SelfInvitationError>()(
      "SelfInvitationError",
      { message: S.String }
    ) {}
    ```
  - [x]1.6 Export new errors from `packages/contracts/src/index.ts`

- [x]**Task 2: Infrastructure — implement accept/refuse in Drizzle repository** (AC: #6, #7, #9, #10)
  - [x]2.1 Implement `acceptInvitation` in `packages/infrastructure/src/repositories/relationship-invitation.drizzle.repository.ts`:
    - Single atomic UPDATE: `UPDATE relationship_invitations SET invitee_user_id = $inviteeUserId, status = 'accepted', updated_at = NOW() WHERE token = $token AND status = 'pending' AND expires_at > NOW() AND inviter_user_id != $inviteeUserId`
    - If 0 rows updated, run a diagnostic SELECT to determine the correct error:
      - Row not found or expired → `InvitationNotFoundError`
      - `status !== 'pending'` → `InvitationAlreadyRespondedError`
      - `inviter_user_id === inviteeUserId` → `SelfInvitationError`
    - Return updated invitation
  - [x]2.2 Implement `refuseInvitation`:
    - Atomic UPDATE: `UPDATE relationship_invitations SET status = 'refused', updated_at = NOW() WHERE token = $token AND status = 'pending' AND expires_at > NOW()`
    - If 0 rows updated, diagnostic SELECT → `InvitationNotFoundError` or `InvitationAlreadyRespondedError`
    - Does NOT set `invitee_user_id` — that column is reserved for the accepted invitee
    - Return updated invitation
  - [x]2.3 Implement `getByTokenWithInviterName`:
    - JOIN `relationship_invitations` with `users` on `inviter_user_id = users.id`
    - Return invitation + `users.name` as `inviterDisplayName`
    - Reuse expiry-at-query-time pattern from existing `getByToken`
  - [x]2.4 Update mock in `packages/infrastructure/src/repositories/__mocks__/relationship-invitation.drizzle.repository.ts`:
    - Add `acceptInvitation`, `refuseInvitation`, `getByTokenWithInviterName` to in-memory mock
    - Match real interface exactly

- [x]**Task 3: Contract endpoints — accept and refuse** (AC: #6, #7, #8, #9)
  - [x]3.1 Add to `RelationshipGroup` (authenticated) in `packages/contracts/src/http/groups/relationship.ts`:
    ```typescript
    HttpApiEndpoint.post("acceptInvitation", "/invitations/:token/accept")
      .setPath(S.Struct({ token: S.String }))
      .addSuccess(AcceptInvitationResponseSchema)
      .addError(InvitationNotFoundError, { status: 404 })
      .addError(InvitationAlreadyRespondedError, { status: 409 })
      .addError(SelfInvitationError, { status: 400 })
      .addError(DatabaseError, { status: 500 })

    HttpApiEndpoint.post("refuseInvitation", "/invitations/:token/refuse")
      .setPath(S.Struct({ token: S.String }))
      .addSuccess(RefuseInvitationResponseSchema)
      .addError(InvitationNotFoundError, { status: 404 })
      .addError(InvitationAlreadyRespondedError, { status: 409 })
      .addError(DatabaseError, { status: 500 })
    ```
  - [x]3.2 Add claim endpoint to `RelationshipPublicGroup` (unauthenticated) for setting the httpOnly invite token cookie:
    ```typescript
    HttpApiEndpoint.post("claimInvitation", "/invitations/:token/claim")
      .setPath(S.Struct({ token: S.String }))
      .addSuccess(S.Struct({ ok: S.Literal(true) }))
      .addError(InvitationNotFoundError, { status: 404 })
      .addError(DatabaseError, { status: 500 })
    ```
    The handler validates the token (not expired, status pending) and returns `Set-Cookie: invite_token={token}; HttpOnly; Secure; SameSite=Lax; Path=/; MaxAge={invitation_expiry_seconds}`.
  - [x]3.3 Define response schemas:
    - `AcceptInvitationResponseSchema`: `S.Struct({ invitation: InvitationSchema })`
    - `RefuseInvitationResponseSchema`: `S.Struct({ invitation: InvitationSchema })`
  - [x]3.4 Export new types from contracts barrel

- [x]**Task 4: Use-cases — accept, refuse, and update getInvitationByToken** (AC: #6, #7, #8, #10)
  - [x]4.1 Create `apps/api/src/use-cases/accept-invitation.use-case.ts`:
    ```typescript
    export const acceptInvitation = (input: { token: string; inviteeUserId: string }) =>
      Effect.gen(function* () {
        const repo = yield* RelationshipInvitationRepository;
        // Single atomic call — self-invitation guard, status check, and expiry
        // are all enforced in the repository's WHERE clause (no TOCTOU race)
        const updated = yield* repo.acceptInvitation({
          token: input.token,
          inviteeUserId: input.inviteeUserId,
        });
        return { invitation: updated };
      });
    ```
  - [x]4.2 Create `apps/api/src/use-cases/refuse-invitation.use-case.ts`:
    - Call `repo.refuseInvitation({ token })` — no self-invitation guard needed (refusing your own invitation is a no-op edge case, not a security concern)
  - [x]4.3 Update `apps/api/src/use-cases/get-invitation-by-token.use-case.ts`:
    - Switch from `repo.getByToken(token)` to `repo.getByTokenWithInviterName(token)`
    - Return `{ invitation, inviterDisplayName }` to populate the existing contract field

- [x]**Task 5: Handlers — wire accept/refuse endpoints** (AC: #6, #7)
  - [x]5.1 Add `acceptInvitation` handler to `RelationshipGroupLive` in `apps/api/src/handlers/relationship.ts`:
    - Extract `token` from path params, `userId` from `AuthenticatedUser`
    - Call `acceptInvitation({ token, inviteeUserId: userId })`
    - Return response
  - [x]5.2 Add `refuseInvitation` handler (same pattern)
  - [x]5.3 Update `getInvitationByToken` handler in `RelationshipPublicGroupLive`:
    - Return `inviterDisplayName` from the updated use-case result

- [x]**Task 6: Frontend — `/invite/$token` landing page** (AC: #1, #2, #3, #4, #5)
  - [x]6.1 Create `apps/front/src/routes/invite/$token.tsx`:
    - `beforeLoad`: Call `GET /api/relationship/public/invitations/:token` to validate token
    - If token invalid/expired → show error state
    - If token valid → load invitation data (inviter name, personal message)
  - [x]6.2 **Landing page UI:**
    - Show inviter display name: "[Inviter] invited you to compare your personalities"
    - Show personal message (if any) in a styled card
    - CTA button: "Start Your Assessment" (for anonymous/no-assessment users) or "Accept Invitation" (for authenticated users with completed assessment)
    - "Not interested" link → calls refuse endpoint (if authenticated)
  - [x]6.3 **Decision tree logic** (per Architecture Tree 4):
    - **Authenticated + has completed assessment** → show "Accept" button that calls `POST /api/relationship/invitations/:token/accept` directly → redirect to `/relationships` (or a confirmation page showing "Invitation accepted — your relationship analysis will be ready soon"). Do NOT redirect to `/results` — the `relationship_analyses` row is not created until Story 14-4, so there is nothing to display yet.
    - **Authenticated + no assessment** → store invite token in cookie via API, redirect to `/chat` to start assessment
    - **Anonymous** → store invite token in cookie via API, redirect to `/chat` → complete assessment → signup → backend links invitee
  - [x]6.4 Use `data-testid="invite-landing-page"`, `data-testid="accept-invitation-button"`, `data-testid="start-assessment-button"`, `data-testid="refuse-invitation-link"` for e2e tests
  - [x]6.5 Consult FRONTEND.md for styling patterns

- [x]**Task 7: Invite token cookie management** (AC: #2, #3)
  - [x]7.1 Add `invite_token` cookie handling to the assessment handler or a dedicated endpoint:
    - **Option A (preferred):** Add a `POST /api/relationship/invitations/:token/claim` endpoint (already defined in Task 3.2) that validates the token and returns a `Set-Cookie: invite_token={token}; HttpOnly; Secure; SameSite=Lax; Path=/; MaxAge={remaining_seconds_until_expiry}` header. The frontend calls this before redirecting to `/chat`.
    - **Option B:** Set the cookie on the frontend side (non-httpOnly) — less secure but simpler. **Use Option A per FR57 (httpOnly requirement).**
  - [x]7.2 On anonymous → authenticated transition, read `invite_token` cookie and auto-accept:
    - **Where:** In Better Auth's `databaseHooks` at `packages/infrastructure/src/context/better-auth.ts`. This is where the existing anonymous→auth transition already happens (Story 9-4). The hooks are:
      - `databaseHooks.user.create.after` — fires on **signup**
      - `databaseHooks.session.create.after` — fires on **signin** (skips signup routes to avoid double-fire)
    - **How:** In both hooks, after the existing `linkAnonymousAssessmentSession()` call:
      1. Read `invite_token` from the request cookie header via `context.headers` (same pattern used for `getAnonymousSessionId(context)`)
      2. If present, call `acceptInvitation({ token: inviteToken, inviteeUserId: user.id })` using a direct Drizzle query (these hooks are outside the Effect runtime, matching the existing `linkAnonymousAssessmentSession` pattern which also uses raw Drizzle)
      3. Clear the `invite_token` cookie by setting `Set-Cookie: invite_token=; HttpOnly; Secure; SameSite=Lax; Path=/; MaxAge=0` on the response headers
      4. If the invitation is expired or already responded, silently swallow the error and still clear the cookie — the user retains their assessment regardless
    - **AC5 path (authenticated, no assessment):** This user already has a Better Auth session, so they won't trigger the signup/signin hooks again. Instead, their flow is: landing page sets cookie via claim endpoint → redirect to `/chat` → complete assessment → the cookie persists until their NEXT visit to `/invite/:token` or until they manually accept. **However**, to cover this case without requiring another invite page visit, add a cookie check to the `/chat` route's `beforeLoad` at `apps/front/src/routes/chat/index.tsx` (lines 95-139): after confirming auth, if `invite_token` cookie exists (readable via `document.cookie` — **but the cookie is httpOnly so this won't work**). **Resolution:** Add a `GET /api/relationship/invitations/pending-accept` endpoint that checks for the `invite_token` cookie server-side and returns it if present. The `/chat` `beforeLoad` calls this endpoint after auth; if a token is returned and the user now has a completed assessment, call accept. Alternatively, defer AC5 auto-accept to when the assessment completes — add the cookie check to the assessment completion handler at `apps/api/src/use-cases/complete-assessment.use-case.ts` (or equivalent) which fires when the conversation reaches its conclusion.
  - [x]7.3 On authenticated user visiting `/invite/:token` with existing assessment:
    - Call accept endpoint directly from the landing page (no cookie needed)
    - Redirect to `/relationships` or a confirmation page (NOT `/results` — analysis row doesn't exist until Story 14-4)

- [x]**Task 8: Unit tests** (AC: #11)
  - [x]8.1 Create `apps/api/src/use-cases/__tests__/accept-invitation.use-case.test.ts`:
    - Happy path: existing user with assessment → invitation accepted, inviteeUserId set
    - Self-invitation: inviter tries to accept own → `SelfInvitationError`
    - Already accepted: second accept call → `InvitationAlreadyRespondedError`
    - Already refused: accept after refuse → `InvitationAlreadyRespondedError`
    - Expired invitation: → `InvitationNotFoundError`
  - [x]8.2 Create `apps/api/src/use-cases/__tests__/refuse-invitation.use-case.test.ts`:
    - Happy path: invitation refused
    - Already accepted: refuse after accept → `InvitationAlreadyRespondedError`
    - Expired invitation: → `InvitationNotFoundError`
  - [x]8.3 Use `vi.mock()` pattern: import `vi` first, mock `relationship-invitation.drizzle.repository`, then import `@effect/vitest`
  - [x]8.4 Compose local `TestLayer` with mocked repositories + `LoggerPinoRepositoryLive`

- [x]**Task 9: E2E tests** (AC: #12)
  - [x]9.1 Create `e2e/specs/invitee-flow.spec.ts`
  - [x]9.2 **Test: invitation landing page loads with inviter info:**
    - Create user A, complete assessment, purchase credit, create invitation
    - Navigate to `/invite/:token` (unauthenticated)
    - Assert page shows inviter name and personal message
  - [x]9.3 **Test: existing user with assessment accepts invitation:**
    - Create user B with completed assessment
    - Login as user B, navigate to `/invite/:token`
    - Click "Accept Invitation"
    - Assert redirect to `/relationships` or confirmation page (NOT `/results`)
    - Verify invitation status is "accepted" via API
  - [x]9.4 **Test: refuse invitation:**
    - Create user C with completed assessment
    - Login as user C, navigate to `/invite/:token`
    - Click "Not interested"
    - Assert invitation status is "refused" via API
  - [x]9.5 Follow existing e2e patterns from `e2e/specs/invitation-system.spec.ts`

### Review Follow-ups (AI)
- [x] [AI-Review][MEDIUM] Replace raw `fetch()` calls in `/invite/$token.tsx` with TanStack Query / contract client for type-safe API calls consistent with the rest of the frontend codebase
- [x] [AI-Review][MEDIUM] Add unit tests for the `tryAcceptInvitationFromCookie` flow in Better Auth hooks — this code path runs outside the Effect runtime and is not covered by the existing mock repository tests

## Dev Notes

### Architecture Compliance

- **Hexagonal architecture:** Contract defines endpoint schemas → handler delegates to use-case → use-case accesses repositories via Context.Tag → infrastructure provides Drizzle implementations
- **Error propagation:** `InvitationNotFoundError`, `InvitationAlreadyRespondedError`, `SelfInvitationError`, and `DatabaseError` propagate unchanged from use-case to contract layer via `.addError()`. No remapping in use-case or handler.
- **Accept/refuse race condition (FM5):** PostgreSQL status column is the source of truth. The repository checks `status = 'pending'` in the WHERE clause. If another request already changed the status, 0 rows are updated → `InvitationAlreadyRespondedError`.
- **Pair deduplication (FR52):** When inserting into `relationship_analyses` (Story 14-4), use `MIN(userId, inviteeUserId)` / `MAX(userId, inviteeUserId)` for `user_a_id` / `user_b_id`. Story 14-3 sets `invitee_user_id` on the invitation; Story 14-4 uses these user IDs for analysis.
- **Consent chain (ADR 5):** Inviter consented at link creation (Story 14-2). Invitee consents via Accept button. Both consent events must be present before Story 14-4 accesses cross-user data.

### Key Implementation Details

- **httpOnly cookie for invite token (FR57):** The `invite_token` cookie follows the same pattern as the anonymous session token in the assessment handler. Use `HttpApiBuilder.securitySetCookie` or manual `Set-Cookie` header. Cookie settings: `httpOnly: true, secure: true, sameSite: "lax", path: "/"`. **MaxAge must match or be shorter than the invitation's `expires_at` duration** — compute the remaining seconds from `expires_at - NOW()` when setting the cookie in the claim endpoint. Do NOT hardcode 30 days.
- **Cookie lifecycle:** Set when invitee clicks "Start Assessment" on the landing page → persists through anonymous conversation → read and cleared on signup/auth transition → `acceptInvitation` called with the invitee's new user ID.
- **Existing user shortcut (FR56):** If the invitee is already authenticated with a completed assessment, the accept endpoint is called directly from the landing page. No cookie needed — the user is already identified.
- **`inviterDisplayName` (AC10):** The `getByTokenWithInviterName` method JOINs with the `users` table. The `users` table has a `name` column (from Better Auth). This populates the already-existing `inviterDisplayName` field in `InvitationDetailResponseSchema`.
- **No analysis generation in this story:** Story 14-3 only handles accept/refuse and linking the invitee. The actual relationship analysis generation is Story 14-4 (`forkDaemon` with placeholder row in `relationship_analyses`).
- **Auth middleware:** The accept/refuse endpoints use the strict `AuthMiddleware` (provides `AuthenticatedUser`). The token validation endpoint remains on `RelationshipPublicGroup` (no auth required).

### Existing Code to Leverage

| What | File | Notes |
|------|------|-------|
| Invitation repository interface | `packages/domain/src/repositories/relationship-invitation.repository.ts` | Add `acceptInvitation`, `refuseInvitation`, `getByTokenWithInviterName` |
| Invitation Drizzle impl | `packages/infrastructure/src/repositories/relationship-invitation.drizzle.repository.ts` | Implement new methods |
| Invitation mock | `packages/infrastructure/src/repositories/__mocks__/relationship-invitation.drizzle.repository.ts` | Add new methods to mock |
| Relationship contracts | `packages/contracts/src/http/groups/relationship.ts` | Add accept/refuse endpoints |
| Relationship handler | `apps/api/src/handlers/relationship.ts` | Add accept/refuse handlers |
| Get invitation use-case | `apps/api/src/use-cases/get-invitation-by-token.use-case.ts` | Update to populate inviterDisplayName |
| Anonymous session cookie | `apps/api/src/handlers/assessment.ts` (lines 102-111) | Cookie pattern reference for invite token |
| Anonymous→auth transition | `packages/infrastructure/src/context/better-auth.ts` (lines 86-137) | `databaseHooks.user.create.after` (signup) and `databaseHooks.session.create.after` (signin) — add invite_token cookie reading here |
| HTTP errors | `packages/contracts/src/errors.ts` | Add `InvitationAlreadyRespondedError`, `SelfInvitationError` (HTTP-facing errors live in contracts) |
| Auth middleware | `apps/api/src/middleware/auth.middleware.ts` | `AuthMiddlewareLive` for accept/refuse, `OptionalAuthMiddlewareLive` for claim |
| E2E invitation tests | `e2e/specs/invitation-system.spec.ts` | Factory patterns, API context setup |
| DB schema | `packages/infrastructure/src/db/drizzle/schema.ts` | `relationshipInvitations` table already exists |
| Users table | `packages/infrastructure/src/db/drizzle/schema.ts` | `users.name` for inviterDisplayName JOIN |

### Previous Story Intelligence (14-2)

From Story 14-2 completion:
- `relationship_invitations` table created with all required columns including `invitee_user_id` (nullable)
- `relationship_analyses` placeholder table created (for Story 14-4)
- `RelationshipInvitationRepository` has `createWithCreditConsumption`, `getByToken`, `listByInviter`, `updateStatus`
- `updateStatus(id, status)` only updates status — does NOT set `invitee_user_id`. Need a dedicated `acceptInvitation` method that sets both.
- `RelationshipGroup` (authenticated) has `createInvitation` and `listInvitations`
- `RelationshipPublicGroup` (unauthenticated) has `getInvitationByToken` — returns invitation but `inviterDisplayName` is NOT populated yet
- Auth middleware split: `AuthMiddleware` (strict) + `OptionalAuthMiddleware` (lenient) — both wired in `apps/api/src/index.ts`
- `InvitationBottomSheet` uses vaul Drawer component
- E2E tests validate creation, listing, token lookup, and insufficient credits

### Git Intelligence

Recent commits:
- `082c4e8 feat(story-14-2)` — invitation system (direct predecessor)
- `009c2c4 feat(story-8-8)` — archetype library completion
- `6bf6252 feat(story-14-1)` — relationship credits & purchase flow
- Pattern: feature branches `feat/story-{epic}-{story}-{slug}`, conventional commit, PR merge to master

### Project Structure Notes

**Files to create:**
- `apps/front/src/routes/invite/$token.tsx` — landing page
- `apps/api/src/use-cases/accept-invitation.use-case.ts`
- `apps/api/src/use-cases/refuse-invitation.use-case.ts`
- `apps/api/src/use-cases/__tests__/accept-invitation.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/refuse-invitation.use-case.test.ts`
- `e2e/specs/invitee-flow.spec.ts`

**Files to modify:**
- `packages/domain/src/repositories/relationship-invitation.repository.ts` (add methods)
- `packages/contracts/src/errors.ts` (add `InvitationAlreadyRespondedError`, `SelfInvitationError`)
- `packages/contracts/src/http/groups/relationship.ts` (add endpoints)
- `packages/contracts/src/index.ts` (export new types)
- `packages/infrastructure/src/repositories/relationship-invitation.drizzle.repository.ts` (implement methods)
- `packages/infrastructure/src/repositories/__mocks__/relationship-invitation.drizzle.repository.ts` (add to mock)
- `apps/api/src/handlers/relationship.ts` (add handlers)
- `apps/api/src/use-cases/get-invitation-by-token.use-case.ts` (populate inviterDisplayName)
- `packages/infrastructure/src/context/better-auth.ts` (add invite_token cookie reading in databaseHooks)

**No DB migration needed** — `relationship_invitations` table already has `invitee_user_id` column and `status` enum with all needed values.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#ADR 4 — Invitation Flow — Accept/Refuse UX]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR 5 — Cross-User Data Access]
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap G2 — Invitation Token Flow]
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap G3 — Notification Pin Data]
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap G5 — RelationshipCard Discriminated Union]
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision Tree 4 — Invitation Link Click]
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision Tree 5 — Accept/Refuse]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3 — Invitee Assessment Flow]
- [Source: _bmad-output/implementation-artifacts/14-2-invitation-system.md — Predecessor story]
- [Source: _bmad-output/implementation-artifacts/14-1-relationship-credits-and-purchase-flow.md — Credits foundation]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Split transaction for accept** — Do NOT update `invitee_user_id` and `status` in separate queries. They MUST be updated atomically in a single UPDATE WHERE `status = 'pending'`.
6. **Background expiry cron** — Do NOT create a background job to expire invitations. Expiry is checked at query time. Same as Story 14-2.
7. **Non-httpOnly invite cookie** — Do NOT store the invite token in localStorage or a non-httpOnly cookie. Per FR57, it MUST be httpOnly.
8. **Analysis generation in this story** — Do NOT implement relationship analysis generation here. That is Story 14-4. This story only handles accept/refuse and invitee linking.
9. **Notification pin in this story** — The notification pin (FR61) and RelationshipCard states are cross-cutting concerns that may be addressed in Story 14-4 or a dedicated UI story. Do NOT block this story on notification UI.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- Implemented accept/refuse invitation use-cases with atomic PostgreSQL operations
- Added `InvitationAlreadyRespondedError` and `SelfInvitationError` to domain errors
- Extended `RelationshipInvitationRepository` with `acceptInvitation`, `refuseInvitation`, `getByTokenWithInviterName`
- Drizzle implementation uses single atomic UPDATE with diagnostic SELECT on failure
- Updated mock repository to match all new interface methods
- Added contract endpoints: `POST /invitations/:token/accept`, `POST /invitations/:token/refuse`, `POST /invitations/:token/claim`
- Created `InviteTokenSecurity` for httpOnly cookie management
- Updated `getInvitationByToken` use-case to populate `inviterDisplayName` via JOIN
- Created `/invite/$token` landing page with decision tree (anonymous/auth-no-assessment/auth-with-assessment)
- Wired invite_token cookie reading in Better Auth `databaseHooks` (signup + signin)
- 10 new unit tests (6 accept + 4 refuse) — all passing
- E2E spec covers landing page, accept, and refuse flows
- All 324 API tests + 206 frontend tests pass, lint clean

### Change Log

- 2026-02-27: Story 14.3 implementation complete — invitee assessment flow
- 2026-02-27: Code review — fixed 3 issues: (1) added expiry + self-invitation guard to Better Auth cookie accept flow, (2) fixed claim handler to reject all non-pending statuses, (3) refactored landing page to use discriminated union type. 2 action items created for follow-up.
- 2026-02-27: Fixed review follow-ups: (1) refactored landing page to use TanStack Query hooks via new use-invitation.ts, (2) added 10 source verification tests for tryAcceptInvitationFromCookie in better-auth-config.test.ts. All 334 API + 206 frontend tests pass.

### File List

**New files:**
- `apps/api/src/use-cases/accept-invitation.use-case.ts`
- `apps/api/src/use-cases/refuse-invitation.use-case.ts`
- `apps/api/src/use-cases/__tests__/accept-invitation.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/refuse-invitation.use-case.test.ts`
- `apps/front/src/routes/invite/$token.tsx`
- `packages/contracts/src/security/invite-token.ts`
- `e2e/specs/invitee-flow.spec.ts`

**Modified files:**
- `packages/domain/src/errors/http.errors.ts` (added InvitationAlreadyRespondedError, SelfInvitationError)
- `packages/domain/src/index.ts` (export new errors)
- `packages/domain/src/repositories/relationship-invitation.repository.ts` (added 3 methods)
- `packages/contracts/src/errors.ts` (re-export new errors)
- `packages/contracts/src/index.ts` (export InviteTokenSecurity)
- `packages/contracts/src/http/groups/relationship.ts` (accept/refuse/claim endpoints + response schemas)
- `packages/infrastructure/src/repositories/relationship-invitation.drizzle.repository.ts` (implement 3 methods)
- `packages/infrastructure/src/repositories/__mocks__/relationship-invitation.drizzle.repository.ts` (mock 3 methods)
- `packages/infrastructure/src/context/better-auth.ts` (invite_token cookie handling in databaseHooks)
- `apps/api/src/handlers/relationship.ts` (accept/refuse/claim handlers + inviterDisplayName)
- `apps/api/src/use-cases/get-invitation-by-token.use-case.ts` (use getByTokenWithInviterName)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status: in-progress → review)
