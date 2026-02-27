# Story 14.2: Invitation System

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user with available relationship credits**,
I want **to send a relationship analysis invitation to someone via a shareable link**,
so that **we can compare our personality profiles**.

## Acceptance Criteria

1. **AC1 — Credit consumption + invitation creation in single transaction:** When a user creates an invitation, exactly 1 credit is consumed and 1 shareable link is generated (UUID v4, 30-day expiry). The `credit_consumed` purchase event and `relationship_invitations` row are inserted in a single `db.transaction()` (FR49). If the user has 0 credits, the request fails with a clear error.

2. **AC2 — Invitation token and link format:** Each invitation has a UUID v4 `invitation_token` (UNIQUE constraint). The shareable link is `{FRONTEND_URL}/invite/{token}`. Tokens are single-use (one invitee per token).

3. **AC3 — InvitationBottomSheet sharing UI:** After creating an invitation, an `InvitationBottomSheet` displays:
   - QR code encoding the invitation link (using `qrcode.react`)
   - Copy-link button (copies URL to clipboard)
   - Native share button (uses `navigator.share()` Web Share API with fallback)
   - Personal message display (message is composed before invitation creation in Task 11.2, then displayed read-only in the BottomSheet)
   (FR60)

4. **AC4 — 30-day expiry:** Invitations expire 30 days after creation. Expired invitations cannot be used. Credits are NOT refunded on expiry (FR50).

5. **AC5 — Database schema:** The `relationship_invitations` table includes: `id` (PK), `inviter_user_id` (FK → users), `invitee_user_id` (FK → users, nullable — claimed in Story 14-3 invitee flow, per ADR 4), `invitation_token` (UUID v4, UNIQUE), `personal_message` (text, nullable — per FR60 InvitationBottomSheet "editable message"), `status` (enum: pending/accepted/refused/expired), `expires_at` (timestamp), `updated_at` (timestamp), `created_at` (timestamp).

6. **AC6 — List invitations endpoint:** An authenticated user can query their sent invitations via `GET /api/relationship/invitations`. Response includes invitation status (with expired status derived at query time — see Dev Notes), token, invitee user ID (if accepted), personal message, expires_at, and created_at. This powers the RelationshipCard states on the results page.

7. **AC7 — Credit check guard:** The create-invitation endpoint validates `availableCredits >= 1` before proceeding. Returns `InsufficientCreditsError` (402) if the user has no credits.

8. **AC8 — Invitation detail endpoint:** `GET /api/relationship/invitations/:token` returns the invitation details for a given token (used by the invitee landing page in Story 14-3). Returns `InvitationNotFoundError` (404) if token is invalid or expired.

9. **AC9 — Unit test coverage:** Use-case tests cover: successful creation with credit consumption, insufficient credits rejection, duplicate token handling (idempotent retry), and invitation listing.

10. **AC10 — E2E test coverage:** A Playwright e2e spec validates: create invitation consumes credit, invitation appears in list, invitation details retrievable by token.

## Tasks / Subtasks

- [x] **Task 1: Database migration — `relationship_invitations` table** (AC: #5)
  - [x] 1.1 Add `relationship_invitations` table to `packages/infrastructure/src/db/drizzle/schema.ts`:
    ```typescript
    export const invitationStatus = pgEnum("invitation_status", [
      "pending", "accepted", "refused", "expired",
    ]);

    export const relationshipInvitations = pgTable("relationship_invitations", {
      id: uuid("id").primaryKey().defaultRandom(),
      inviterUserId: text("inviter_user_id").notNull().references(() => users.id),
      inviteeUserId: text("invitee_user_id").references(() => users.id),
      invitationToken: uuid("invitation_token").notNull().unique(),
      personalMessage: text("personal_message"),
      status: invitationStatus("status").notNull().default("pending"),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    });
    ```
  - [x] 1.2 Add `relationship_analyses` placeholder table (needed for FK in Story 14-4, define now to avoid migration conflicts):
    ```typescript
    export const relationshipAnalyses = pgTable("relationship_analyses", {
      id: uuid("id").primaryKey().defaultRandom(),
      invitationId: uuid("invitation_id").notNull().unique().references(() => relationshipInvitations.id),
      userAId: text("user_a_id").notNull().references(() => users.id),
      userBId: text("user_b_id").notNull().references(() => users.id),
      content: text("content"),  // NULL = generating placeholder; status derived from content: NULL = generating, NOT NULL = ready (same pattern as portraits table)
      modelUsed: text("model_used"),
      retryCount: integer("retry_count").notNull().default(0),
      createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    });
    ```
  - [x] 1.3 Run `pnpm db:generate` to create the migration file
  - [x] 1.4 Verify migration applies cleanly with `pnpm db:migrate`
  - [x] 1.5 Add Drizzle `defineRelations` for both new tables in `schema.ts` (follow existing pattern — every table has relations defined). `relationshipInvitations` relates to `users` (inviter + invitee) and `relationshipAnalyses`. `relationshipAnalyses` relates to `relationshipInvitations` and `users` (userA + userB).
  - [x] 1.6 Add both tables to `docker/init-db-test.sql` for e2e test database setup (follow existing patterns for `purchase_events`, `portraits` tables already there)

- [x] **Task 2: Domain types and repository interface** (AC: #1, #5, #6, #8)
  - [x] 2.1 Create `packages/domain/src/types/relationship.types.ts`:
    - Export `InvitationStatus = "pending" | "accepted" | "refused" | "expired"` (string literal union)
    - Export `RelationshipInvitation` type with all fields from the table
    - Export `CreateInvitationInput = { inviterUserId: string; personalMessage?: string }`
    - Export `INVITATION_EXPIRY_DAYS = 30` constant
  - [x] 2.2 Create `packages/domain/src/repositories/relationship-invitation.repository.ts`:
    - Define `RelationshipInvitationRepository` using `Context.Tag` pattern (same as `PurchaseEventRepository`)
    - Methods:
      ```typescript
      readonly createWithCreditConsumption: (input: {
        inviterUserId: string;
        invitationToken: string;
        personalMessage: string | null;
        expiresAt: Date;
      }) => Effect.Effect<RelationshipInvitation, DatabaseError>;
      // ^ This method performs the ENTIRE transaction: INSERT credit_consumed into purchase_events + INSERT invitation

      readonly getByToken: (token: string) => Effect.Effect<RelationshipInvitation, DatabaseError | InvitationNotFoundError>;

      readonly listByInviter: (userId: string) => Effect.Effect<ReadonlyArray<RelationshipInvitation>, DatabaseError>;

      readonly updateStatus: (id: string, status: InvitationStatus) => Effect.Effect<RelationshipInvitation, DatabaseError | InvitationNotFoundError>;
      ```
    - **CRITICAL:** The `createWithCreditConsumption` method encapsulates the entire transaction (credit_consumed event + invitation insert) in a single `db.transaction()`. This ensures atomicity per FR49 and Pattern 6.
  - [x] 2.3 Add error types to `packages/domain/src/errors/http.errors.ts` (this is where all HTTP-facing errors are canonically defined — `packages/contracts/src/errors.ts` is a re-export barrel):
    - `InsufficientCreditsError` — `export class InsufficientCreditsError extends S.TaggedError<InsufficientCreditsError>()("InsufficientCreditsError", { message: S.String }) {}`
    - `InvitationNotFoundError` — `export class InvitationNotFoundError extends S.TaggedError<InvitationNotFoundError>()("InvitationNotFoundError", { message: S.String }) {}`
    - Then add both to the re-export list in `packages/contracts/src/errors.ts`
  - [x] 2.4 Export new types from `packages/domain/src/index.ts` barrel

- [x] **Task 3: Infrastructure — Drizzle repository implementation** (AC: #1, #5, #6, #8)
  - [x] 3.1 Create `packages/infrastructure/src/repositories/relationship-invitation.drizzle.repository.ts`:
    - Implement `RelationshipInvitationRepository` as `Layer.effect` (same pattern as `PurchaseEventDrizzleRepositoryLive`)
    - `createWithCreditConsumption`: Use `db.transaction((tx) => ...)` wrapping:
      1. `tx.insert(purchaseEvents).values({ id: crypto.randomUUID(), userId: inviterUserId, eventType: "credit_consumed", polarCheckoutId: \`credit-consumed-\${invitationToken}\`, metadata: { invitationId: invitationToken } })`
      2. `tx.insert(relationshipInvitations).values({ inviterUserId, invitationToken, personalMessage, status: "pending", expiresAt })`
      3. Return the inserted invitation row
    - `getByToken`: SELECT WHERE `invitation_token = token` AND (`status = 'pending'` AND `expires_at > NOW()`) — return `InvitationNotFoundError` if not found or expired
    - `listByInviter`: SELECT WHERE `inviter_user_id = userId` ORDER BY `created_at DESC`. **IMPORTANT:** For each returned row, derive the effective status at the application level: if `status = 'pending'` AND `expires_at < NOW()`, return `status: 'expired'` in the result (do NOT update the DB row — Anti-Pattern #7). This ensures the frontend can display "expired" badges without a background cron.
    - `updateStatus`: UPDATE SET `status` WHERE `id` — return `InvitationNotFoundError` if no rows affected
  - [x] 3.2 The `polarCheckoutId` for `credit_consumed` events uses a deterministic format `credit-consumed-{invitationToken}` for idempotency — if the same invitation creation is retried, the unique constraint on `polar_checkout_id` prevents duplicate credit consumption.
  - [x] 3.3 Export `RelationshipInvitationDrizzleRepositoryLive` from `packages/infrastructure/src/repositories/index.ts` (or wherever repositories are exported)

- [x] **Task 4: Mock repository for tests** (AC: #9)
  - [x] 4.1 Create `packages/infrastructure/src/repositories/__mocks__/relationship-invitation.drizzle.repository.ts`:
    - In-memory `Map<string, RelationshipInvitation>` store
    - `createWithCreditConsumption` adds to map + tracks credit consumption (for assertion)
    - `getByToken` looks up by token in map
    - `listByInviter` filters by inviterUserId
    - `updateStatus` updates in map
    - Export `_resetMockState()` for test cleanup (same pattern as `purchase-event.drizzle.repository.ts` mock)
    - Export same name `RelationshipInvitationDrizzleRepositoryLive` (Vitest auto-resolution)

- [x] **Task 5: Contract endpoints — RelationshipGroup** (AC: #1, #6, #7, #8)
  - [x] 5.1 Create `packages/contracts/src/http/groups/relationship.ts`:
    ```typescript
    export const RelationshipGroup = HttpApiGroup.make("relationship")
      .prefix("/relationship")
      .middleware(AuthMiddleware)
      .add(
        HttpApiEndpoint.post("createInvitation", "/invitations")
          .addSuccess(CreateInvitationResponseSchema)
          .setPayload(CreateInvitationPayloadSchema)
          .addError(InsufficientCreditsError, { status: 402 })
          .addError(DatabaseError, { status: 500 })
      )
      .add(
        HttpApiEndpoint.get("listInvitations", "/invitations")
          .addSuccess(ListInvitationsResponseSchema)
          .addError(DatabaseError, { status: 500 })
      )
      .add(
        HttpApiEndpoint.get("getInvitationByToken", "/invitations/:token")
          .addSuccess(InvitationDetailResponseSchema)
          .addError(InvitationNotFoundError, { status: 404 })
          .addError(DatabaseError, { status: 500 })
      )
    ```
  - [x] 5.2 Define schemas:
    - `CreateInvitationPayloadSchema`: `S.Struct({ personalMessage: S.optional(S.String.pipe(S.maxLength(500))) })`
    - `CreateInvitationResponseSchema`: `S.Struct({ invitation: InvitationSchema, shareUrl: S.String })`
    - `ListInvitationsResponseSchema`: `S.Struct({ invitations: S.Array(InvitationSchema) })`
    - `InvitationDetailResponseSchema`: `S.Struct({ invitation: InvitationSchema, inviterDisplayName: S.optional(S.String) })`
    - `InvitationSchema`: `S.Struct({ id: S.String, invitationToken: S.String, inviteeUserId: S.NullOr(S.String), personalMessage: S.NullOr(S.String), status: S.Literal("pending", "accepted", "refused", "expired"), expiresAt: S.DateTimeUtc, createdAt: S.DateTimeUtc })`
  - [x] 5.3 Add `RelationshipGroup` to the API in `packages/contracts/src/index.ts` and wire into the main `Api` definition
  - [x] 5.4 **Note on `getInvitationByToken`:** This endpoint does NOT require auth (invitee may not be logged in yet). Remove `AuthMiddleware` from this specific endpoint or create it in a separate unauthenticated group. Decision: Add it as a **separate** `RelationshipPublicGroup` without `AuthMiddleware`, prefixed `/relationship/public`.

- [x] **Task 5B: AppConfig — add frontendUrl** (AC: #2) — **MUST complete before Task 6**
  - [x] 5B.1 Check if `frontendUrl` already exists in `packages/domain/src/config/app-config.ts`. If not, add it:
    ```typescript
    readonly frontendUrl: string;  // e.g., "https://bigocean.dev" or "http://localhost:3000"
    ```
  - [x] 5B.2 Add to `AppConfigLive` in infrastructure with env var `FRONTEND_URL` (default `http://localhost:3000`)
  - [x] 5B.3 Add to `AppConfig` test mock with `http://localhost:3000`

- [x] **Task 6: Create-invitation use-case** (AC: #1, #7)
  - [x] 6.1 Create `apps/api/src/use-cases/create-invitation.use-case.ts`:
    ```typescript
    export const createInvitation = (input: { userId: string; personalMessage?: string }) =>
      Effect.gen(function* () {
        // 1. Check credit balance
        const purchaseRepo = yield* PurchaseEventRepository;
        const capabilities = yield* purchaseRepo.getCapabilities(input.userId);
        if (capabilities.availableCredits < 1) {
          return yield* Effect.fail(new InsufficientCreditsError({ message: "No relationship credits available" }));
        }

        // 2. Generate token + expiry
        const invitationToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        // 3. Atomic: credit_consumed + invitation creation
        const invitationRepo = yield* RelationshipInvitationRepository;
        const invitation = yield* invitationRepo.createWithCreditConsumption({
          inviterUserId: input.userId,
          invitationToken,
          personalMessage: input.personalMessage ?? null,
          expiresAt,
        });

        // 4. Build share URL
        const config = yield* AppConfig;
        const shareUrl = `${config.frontendUrl}/invite/${invitationToken}`;

        return { invitation, shareUrl };
      });
    ```
  - [x] 6.2 Error signature: `InsufficientCreditsError | DatabaseError` — both propagate unchanged to contract layer

- [x] **Task 7: List-invitations and get-invitation use-cases** (AC: #6, #8)
  - [x] 7.1 Create `apps/api/src/use-cases/list-invitations.use-case.ts`:
    - Calls `RelationshipInvitationRepository.listByInviter(userId)`
    - Returns array of invitations
  - [x] 7.2 Create `apps/api/src/use-cases/get-invitation-by-token.use-case.ts`:
    - Calls `RelationshipInvitationRepository.getByToken(token)`
    - Returns invitation details (+ inviter display name if available)
    - This use-case is unauthenticated — used by the `/invite/:token` landing page (Story 14-3)

- [x] **Task 8: Handlers — RelationshipGroupLive** (AC: #1, #6, #8)
  - [x] 8.1 Create `apps/api/src/handlers/relationship.ts`:
    - `createInvitation` handler: extract userId from auth context, call `createInvitation` use-case
    - `listInvitations` handler: extract userId from auth context, call `listInvitations` use-case
    - `getInvitationByToken` handler: extract token from path params, call `getInvitationByToken` use-case
  - [x] 8.2 Wire `RelationshipGroupLive` into the API server in `apps/api/src/index.ts` (same pattern as `PurchaseGroupLive`)

- [x] **Task 9: Unit tests for create-invitation use-case** (AC: #9)
  - [x] 9.1 Create `apps/api/src/use-cases/__tests__/create-invitation.use-case.test.ts`
  - [x] 9.2 Test cases:
    - **Happy path:** User with 1+ credits → invitation created, credit consumed, shareUrl returned
    - **Insufficient credits:** User with 0 credits → `InsufficientCreditsError`
    - **Personal message:** Invitation stores optional personal message
    - **Expiry calculation:** `expiresAt` is 30 days from creation
  - [x] 9.3 Use `vi.mock()` pattern: import `vi` first, then mock `relationship-invitation.drizzle.repository` and `purchase-event.drizzle.repository`, then import `@effect/vitest`
  - [x] 9.4 Compose local `TestLayer` with mocked repositories + `LoggerPinoRepositoryLive` + `AppConfig` mock

- [x] **Task 10: Frontend — InvitationBottomSheet component** (AC: #3)
  - [x] 10.1 Install `qrcode.react`: `pnpm --filter=front add qrcode.react`
  - [x] 10.2 Create `apps/front/src/components/relationship/InvitationBottomSheet.tsx`:
    - Props: `{ shareUrl: string; invitationToken: string; personalMessage?: string; onClose: () => void }`
    - Uses shadcn `Sheet` (bottom variant) or `Dialog` component
    - **QR code:** Render `<QRCodeSVG value={shareUrl} />` from `qrcode.react`
    - **Copy link:** Button that calls `navigator.clipboard.writeText(shareUrl)` with toast feedback
    - **Native share:** Button that calls `navigator.share({ title: "Personality Comparison", text: personalMessage, url: shareUrl })` — hidden if `navigator.share` is undefined (desktop fallback: just copy link)
    - **Personal message display:** Shows the message read-only (editing happens before creation in Task 11.2)
  - [x] 10.3 Add `data-testid="invitation-bottom-sheet"`, `data-testid="copy-link-button"`, `data-testid="share-button"`, `data-testid="qr-code"` for e2e tests
  - [x] 10.4 Consult FRONTEND.md for styling patterns, data attribute conventions, use `data-slot` for shadcn components

- [x] **Task 11: Frontend — Create invitation flow from results page** (AC: #1, #3)
  - [x] 11.1 In the existing `RelationshipCreditsSection.tsx` (from Story 14-1), the "Invite Someone" button currently does nothing. Wire it to:
    1. Call `POST /api/relationship/invitations` with optional personal message
    2. On success, open `InvitationBottomSheet` with the returned `shareUrl`
    3. Invalidate `purchase/credits` query to refresh credit count
  - [x] 11.2 Add a simple text input for personal message before creating the invitation (inline in the credits section, or as a small dialog step)
  - [x] 11.3 Handle loading state on the button during API call
  - [x] 11.4 Handle error state: show toast for `InsufficientCreditsError` ("No credits available — purchase more to invite someone")

- [x] **Task 12: Frontend — Sent invitations list** (AC: #6)
  - [x] 12.1 Create `apps/front/src/components/relationship/SentInvitationsList.tsx`:
    - Fetches `GET /api/relationship/invitations` via TanStack Query
    - Renders list of sent invitations with status badge (pending/accepted/refused/expired)
    - Each invitation shows: status, personal message excerpt, created date, expires date
    - Pending invitations show "Share Again" button that opens `InvitationBottomSheet`
  - [x] 12.2 Add to results page below `RelationshipCreditsSection` — only render if user has sent invitations
  - [x] 12.3 Add `data-testid="sent-invitations-list"`, `data-testid="invitation-card"` for e2e tests

- [x] **Task 13: E2E tests — invitation creation flow** (AC: #10)
  - [x] 13.1 Create `e2e/specs/invitation-system.spec.ts`
  - [x] 13.2 **Test setup:** Use existing e2e patterns:
    - Create API context via `createApiContext()`
    - Sign up user via `createUser()` (grants 1 free credit via Better Auth hook)
    - Create and seed assessment session via existing factories
  - [x] 13.3 **Test: create invitation consumes credit:**
    - Call `POST /api/relationship/invitations` with authed API context
    - Assert response: invitation object with `status: "pending"`, valid `invitationToken`, `shareUrl` containing token
    - Call `GET /api/purchase/credits` — assert `availableCredits: 0` (was 1, consumed 1)
  - [x] 13.4 **Test: list invitations returns created invitation:**
    - Call `GET /api/relationship/invitations`
    - Assert array contains 1 invitation with matching token
  - [x] 13.5 **Test: get invitation by token (unauthenticated):**
    - Call `GET /api/relationship/public/invitations/:token` without auth
    - Assert returns invitation details
  - [x] 13.6 **Test: create invitation with no credits fails:**
    - Create second invitation attempt (0 credits remaining)
    - Assert 402 error response
  - [x] 13.7 Follow existing e2e patterns from `e2e/specs/purchase-credits.spec.ts`

## Dev Notes

### Architecture Compliance

- **Hexagonal architecture:** Contract defines endpoint schemas → handler delegates to use-case → use-case accesses repositories via Context.Tag → infrastructure provides Drizzle implementations
- **Error propagation:** `InsufficientCreditsError` and `DatabaseError` propagate unchanged from use-case to contract layer via `.addError()`. No remapping in use-case or handler.
- **Append-only events:** Credit consumption uses `credit_consumed` event in `purchase_events` table. The `deriveCapabilities()` function (already tested with 18 tests in Story 13.1) handles the `-1` per `credit_consumed` event correctly.
- **Transaction boundaries (Pattern 6):** `credit_consumed` + `relationship_invitations` INSERT in single `db.transaction()` — same pattern as `process-purchase.use-case.ts` which wraps `purchase_event` + `portraits` placeholder in a transaction.

### Key Implementation Details

- **Transaction atomicity (FR49):** The `createWithCreditConsumption` repository method owns the entire transaction. The use-case calls it as a single operation. If any part fails, the entire transaction rolls back — no orphaned credit consumption or invitation.
- **Idempotent credit consumption:** The `polarCheckoutId` for `credit_consumed` is `credit-consumed-{invitationToken}`. Since `invitation_token` is UUID v4 and UNIQUE, each invitation creation can only consume one credit. Retries are safe due to the partial unique index on `polar_checkout_id`.
- **Token format:** UUID v4 via `crypto.randomUUID()`. 30-day expiry calculated as `Date.now() + 30 * 24 * 60 * 60 * 1000`.
- **`getByToken` expiry check:** The repository method checks `expires_at > NOW()` in the WHERE clause. Expired invitations are not returned — they effectively become invisible. No background cron needed for expiry.
- **Unauthenticated token lookup:** `getInvitationByToken` endpoint does NOT require auth because invitees may not be logged in when they click the link. This is in a separate `RelationshipPublicGroup` without `AuthMiddleware`.
- **`relationship_analyses` table created now:** Even though Story 14-4 will use it, creating the table in this migration avoids future migration conflicts when Story 14-4 adds FK references.
- **QR code library:** `qrcode.react` is specified in the architecture (Line 708). Use `<QRCodeSVG>` (SVG variant) for crisp rendering at any size.

### Existing Code to Leverage

| What | File | Notes |
|------|------|-------|
| Purchase event types | `packages/domain/src/types/purchase.types.ts` | `credit_consumed` already defined, `PurchaseEventMetadata.invitationId` field exists |
| Capability derivation | `packages/domain/src/utils/derive-capabilities.ts` | `-1` per `credit_consumed` already works (18 tests) |
| PurchaseEvent repository | `packages/domain/src/repositories/purchase-event.repository.ts` | `getCapabilities(userId)` for credit check |
| Purchase Drizzle impl | `packages/infrastructure/src/repositories/purchase-event.drizzle.repository.ts` | Transaction pattern reference |
| Process purchase use-case | `apps/api/src/use-cases/process-purchase.use-case.ts` | `db.transaction()` + `Effect.forkDaemon()` pattern reference |
| Purchase handler | `apps/api/src/handlers/purchase.ts` | Handler pattern reference |
| Purchase contract | `packages/contracts/src/http/groups/purchase.ts` | Contract group pattern reference |
| Purchase mock | `packages/infrastructure/src/repositories/__mocks__/purchase-event.drizzle.repository.ts` | Mock pattern with `_resetMockState()` |
| RelationshipCreditsSection | `apps/front/src/components/results/RelationshipCreditsSection.tsx` | "Invite Someone" button to wire up |
| Results page | `apps/front/src/routes/results/$assessmentSessionId.tsx` | Where to add SentInvitationsList |
| AppConfig | `packages/domain/src/config/app-config.ts` | May need `frontendUrl` field |
| DB schema | `packages/infrastructure/src/db/drizzle/schema.ts` | Where to add new tables |
| Test DB init | `docker/init-db-test.sql` | Add new tables for e2e |
| E2E patterns | `e2e/specs/purchase-credits.spec.ts` | Factory + assertion patterns |

### Previous Story Intelligence (14-1)

From Story 14-1 completion notes:
- `free_credit_granted` is inserted in Better Auth `user.create.after` hook with idempotent `polarCheckoutId`
- `GET /api/purchase/credits` returns `{ availableCredits, hasCompletedAssessment }`
- `RelationshipCreditsSection` has "Invite Someone" button (currently disabled/placeholder) — wire it up in Task 11
- Polar checkout overlay pattern established for credit purchase — not needed here but UI patterns are consistent
- E2E tests in `purchase-credits.spec.ts` demonstrate factory + API context patterns

### Git Intelligence

Recent commits show:
- `6bf6252 feat(story-14-1)` — relationship credits & purchase flow (direct predecessor)
- `009c2c4 feat(story-8-8)` — archetype library completion
- `249ae3b feat(story-12-3)` — teaser portrait generation
- Pattern: feature branches merged via PR, conventional commit format `feat(story-X-Y): description`

### Project Structure Notes

**Files to create:**
- `packages/domain/src/types/relationship.types.ts`
- `packages/domain/src/repositories/relationship-invitation.repository.ts`
- `packages/infrastructure/src/repositories/relationship-invitation.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/relationship-invitation.drizzle.repository.ts`
- `packages/contracts/src/http/groups/relationship.ts`
- `apps/api/src/handlers/relationship.ts`
- `apps/api/src/use-cases/create-invitation.use-case.ts`
- `apps/api/src/use-cases/list-invitations.use-case.ts`
- `apps/api/src/use-cases/get-invitation-by-token.use-case.ts`
- `apps/api/src/use-cases/__tests__/create-invitation.use-case.test.ts`
- `apps/front/src/components/relationship/InvitationBottomSheet.tsx`
- `apps/front/src/components/relationship/SentInvitationsList.tsx`
- `e2e/specs/invitation-system.spec.ts`
- Drizzle migration file (auto-generated)

**Files to modify:**
- `packages/infrastructure/src/db/drizzle/schema.ts` (add 2 tables + enum)
- `packages/domain/src/errors/http.errors.ts` (add `InsufficientCreditsError`, `InvitationNotFoundError`)
- `packages/contracts/src/errors.ts` (re-export new errors)
- `packages/contracts/src/index.ts` (export RelationshipGroup)
- `packages/domain/src/index.ts` (export new types + repository)
- `apps/api/src/index.ts` (wire RelationshipGroupLive)
- `apps/front/src/components/results/RelationshipCreditsSection.tsx` (wire "Invite Someone" button)
- `apps/front/src/routes/results/$assessmentSessionId.tsx` (add SentInvitationsList)
- `packages/domain/src/config/app-config.ts` (add `frontendUrl` if missing)
- `docker/init-db-test.sql` (add new tables)

**No files to delete.**

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#ADR 1 — Relationship Pair Data Model]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR 4 — Invitation Flow]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR 5 — Cross-User Data Access]
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern 6 — Transaction Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap G2 — Invitation Token Flow]
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap G5 — RelationshipCard Discriminated Union]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2 — Invitation System]
- [Source: _bmad-output/implementation-artifacts/14-1-relationship-credits-and-purchase-flow.md — Predecessor story]
- [Source: _bmad-output/implementation-artifacts/13-1-purchase-events-schema-and-capability-derivation.md — Event log patterns]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Mutable counters** — Do NOT add a `credits_balance` column or any mutable counter. All credit state must be derived from the append-only event log via `deriveCapabilities()`.
6. **Split transaction** — Do NOT insert `credit_consumed` and `relationship_invitations` in separate queries. They MUST be in a single `db.transaction()` (FR49). If either fails, both roll back.
7. **Background expiry cron** — Do NOT create a background job to expire invitations. Expiry is checked at query time via `expires_at > NOW()` in the WHERE clause. Status column may remain "pending" even after expiry — that's fine.
8. **Auth on token lookup** — Do NOT require authentication on the `getInvitationByToken` endpoint. Invitees clicking the link may not be logged in yet.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

**New files:**
- `packages/domain/src/types/relationship.types.ts`
- `packages/domain/src/repositories/relationship-invitation.repository.ts`
- `packages/infrastructure/src/repositories/relationship-invitation.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/relationship-invitation.drizzle.repository.ts`
- `packages/contracts/src/http/groups/relationship.ts`
- `apps/api/src/handlers/relationship.ts`
- `apps/api/src/use-cases/create-invitation.use-case.ts`
- `apps/api/src/use-cases/list-invitations.use-case.ts`
- `apps/api/src/use-cases/get-invitation-by-token.use-case.ts`
- `apps/api/src/use-cases/__tests__/create-invitation.use-case.test.ts`
- `apps/front/src/components/relationship/InvitationBottomSheet.tsx`
- `apps/front/src/components/relationship/SentInvitationsList.tsx`
- `e2e/specs/invitation-system.spec.ts`
- `drizzle/20260227000000_story_14_2_invitation_system/migration.sql`
- `packages/ui/src/components/badge.tsx`
- `packages/ui/src/components/input.tsx`

**Modified files:**
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/domain/src/errors/http.errors.ts`
- `packages/domain/src/index.ts`
- `packages/contracts/src/errors.ts`
- `packages/contracts/src/http/api.ts`
- `packages/contracts/src/index.ts`
- `packages/infrastructure/src/index.ts`
- `apps/api/src/index.ts`
- `apps/front/src/components/results/RelationshipCreditsSection.tsx`
- `apps/front/src/routes/results/$assessmentSessionId.tsx`
- `apps/front/src/routes/results-session-route.test.tsx`
- `apps/front/package.json`
- `docker/init-db-test.sql`
- `compose.test.yaml`
- `pnpm-lock.yaml`
