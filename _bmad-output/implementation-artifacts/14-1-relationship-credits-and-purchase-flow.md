# Story 14.1: Relationship Credits & Purchase Flow

Status: review

## Story

As a **user with a completed assessment**,
I want **to see my available relationship credits and purchase more via Polar.sh**,
so that **I can invite others to compare our personalities**.

## Acceptance Criteria

1. **AC1 — Free credit grant on signup:** When a user completes registration (Better Auth signup), a `free_credit_granted` event is inserted into `purchase_events` (exactly once per user). This gives every user 1 free relationship credit.

2. **AC2 — Credit balance display:** An authenticated user can query their available relationship credits via `GET /api/purchase/credits`. Response: `{ availableCredits: number, hasCompletedAssessment: boolean }`. The credit count is derived from the existing `deriveCapabilities()` function (already implemented in Story 13.1).

3. **AC3 — Relationship credit purchase (single):** A user can purchase a single relationship credit (€5) via Polar.sh checkout. The existing webhook flow (Story 13.2) already maps `polarProductRelationshipSingle` → `credit_purchased` event with `metadata: null` (units defaults to 1). **No new backend work needed for webhook processing.**

4. **AC4 — Relationship credit purchase (5-pack):** A user can purchase a 5-pack of relationship credits (€15) via Polar.sh checkout. The existing webhook flow already maps `polarProductRelationship5Pack` → `credit_purchased` event with `metadata: { units: 5 }`. **No new backend work needed for webhook processing.**

5. **AC5 — Frontend checkout integration:** The results page includes a "Compare Personalities" CTA section that:
   - Shows available credit count
   - If credits > 0: shows "Invite Someone" button (navigates to invitation flow — Story 14-2)
   - If credits == 0: shows "Get Credits" button that opens Polar.sh checkout overlay for single credit or 5-pack
   - Uses `@polar-sh/checkout` embedded overlay (same pattern as portrait unlock, if already implemented)

6. **AC6 — Checkout success polling:** After Polar checkout overlay closes with success, the frontend polls `GET /api/purchase/verify?checkoutId=X` until verified, then refreshes the credit count display.

7. **AC7 — Assessment requirement:** The "Compare Personalities" section only appears for users with a completed assessment (status = `completed` in assessment_sessions).

8. **AC8 — E2E test coverage:** A Playwright e2e spec validates the purchase credits flow end-to-end: signup grants 1 free credit, credits endpoint returns correct state, and the RelationshipCreditsSection renders on the results page for authenticated users with a completed assessment.

## Tasks / Subtasks

- [x] **Task 1: Wire `free_credit_granted` on user signup** (AC: #1)
  - [x] 1.1 In `packages/infrastructure/src/context/better-auth.ts`, the `databaseHooks.user.create.after` hook already exists (line ~203) and handles anonymous session linking. **Append** the `free_credit_granted` insert to this existing hook (after the session linking logic).
  - [x] 1.2 The insert uses direct Drizzle query on `purchaseEvents` table (same Promise context as the existing hook code — not Effect):
    ```typescript
    await db.insert(purchaseEvents).values({
      id: crypto.randomUUID(),
      userId: user.id,
      eventType: "free_credit_granted",
      polarCheckoutId: `free-credit-${user.id}`,  // deterministic for idempotency
    }).onConflictDoNothing({ target: purchaseEvents.polarCheckoutId });
    ```
  - [x] 1.3 The `onConflictDoNothing` on `polar_checkout_id` ensures idempotency (partial unique index already exists from Story 13.1 migration). No try/catch needed — duplicate is silently ignored.
  - [x] 1.4 Wrap in try/catch at the outermost level with `logger.error()` — free credit grant failure should NOT block user creation

- [x] **Task 2: Add `credits` endpoint to PurchaseGroup contract** (AC: #2)
  - [x] 2.1 In `packages/contracts/src/http/groups/purchase.ts`, add a new endpoint:
    ```
    HttpApiEndpoint.get("getCredits", "/credits")
      .addSuccess(GetCreditsResponseSchema)
      .addError(DatabaseError, { status: 500 })
    ```
  - [x] 2.2 Define `GetCreditsResponseSchema`: `S.Struct({ availableCredits: S.Number, hasCompletedAssessment: S.Boolean })`
  - [x] 2.3 Add to the existing `PurchaseGroup` (already has `AuthMiddleware`) — NOT a new group. The endpoint will be `GET /api/purchase/credits` (group prefix `/purchase` is already set)

- [x] **Task 3: Implement `get-credits` handler** (AC: #2)
  - [x] 3.1 In `apps/api/src/handlers/purchase.ts`, add handler for `getCredits` endpoint
  - [x] 3.2 Handler calls `PurchaseEventRepository.getCapabilities(userId)` to get `availableCredits`
  - [x] 3.3 Handler calls `AssessmentSessionRepository.getByUserId(userId)` (or equivalent) to check if user has a completed assessment
  - [x] 3.4 Returns `{ availableCredits, hasCompletedAssessment }`

- [x] **Task 4: Create `get-credits` use-case** (AC: #2)
  - [x] 4.1 Create `apps/api/src/use-cases/get-credits.use-case.ts`
  - [x] 4.2 Uses `PurchaseEventRepository` to get capabilities and `AssessmentSessionRepository` to check completed assessment
  - [x] 4.3 Returns `{ availableCredits: number, hasCompletedAssessment: boolean }`
  - [x] 4.4 Error signature: `DatabaseError` only (propagated from repositories)

- [x] **Task 5: Unit tests for `get-credits` use-case** (AC: #2)
  - [x] 5.1 Create `apps/api/src/use-cases/__tests__/get-credits.use-case.test.ts`
  - [x] 5.2 Test cases:
    - User with no events → `{ availableCredits: 0, hasCompletedAssessment: false }`
    - User with `free_credit_granted` + completed assessment → `{ availableCredits: 1, hasCompletedAssessment: true }`
    - User with purchased credits → correct count
    - User with consumed credits → correct remaining count
  - [x] 5.3 Use `vi.mock()` pattern per CLAUDE.md (import `vi` first, then `vi.mock()`, then `@effect/vitest` imports)
  - [x] 5.4 Compose local `TestLayer` with `PurchaseEventDrizzleRepositoryLive` + `AssessmentSessionDrizzleRepositoryLive` mocks + `LoggerPinoRepositoryLive` mock

- [x] **Task 6: Frontend — RelationshipCreditsSection component** (AC: #5, #6, #7)
  - [x] 6.1 Create `apps/front/src/components/results/RelationshipCreditsSection.tsx`
  - [x] 6.2 Fetch credit data via TanStack Query: `GET /api/purchase/credits`
  - [x] 6.3 Display states:
    - **Loading:** Skeleton placeholder
    - **No assessment:** Hidden (component returns null)
    - **Has credits > 0:** Show credit count badge + "Invite Someone" button (disabled/placeholder for Story 14-2)
    - **No credits:** Show "Get Credits" with pricing info (€5 single / €15 for 5-pack)
  - [x] 6.4 "Get Credits" opens Polar.sh checkout overlay using product IDs from env vars (`VITE_POLAR_PRODUCT_RELATIONSHIP_SINGLE`, `VITE_POLAR_PRODUCT_RELATIONSHIP_5PACK`)
  - [x] 6.5 Add `data-testid="relationship-credits-section"`, `data-testid="invite-button"`, `data-testid="get-credits-button"` for e2e tests
  - [x] 6.6 Consult FRONTEND.md for styling patterns, data attribute conventions

- [x] **Task 7: Frontend — Polar checkout integration** (AC: #5, #6)
  - [x] 7.1 Install `@polar-sh/checkout` if not already installed: `pnpm --filter=front add @polar-sh/checkout`
  - [x] 7.2 Create `apps/front/src/lib/polar-checkout.ts` utility:
    - Export `openCheckout({ productId, userId, successUrl })` function
    - Uses `@polar-sh/checkout` embedded overlay pattern
    - `successUrl` includes `checkoutId` query param for verification
  - [x] 7.3 After checkout success, poll `GET /api/purchase/verify?checkoutId=X` every 2s (max 30s) using TanStack Query's `refetchInterval`
  - [x] 7.4 On verification success, invalidate `purchase/credits` query to refresh credit count

- [x] **Task 8: Frontend — Add env vars for Polar product IDs** (AC: #5)
  - [x] 8.1 Add to `apps/front/.env` (and `.env.example`):
    ```
    VITE_POLAR_PRODUCT_RELATIONSHIP_SINGLE=<product-id>
    VITE_POLAR_PRODUCT_RELATIONSHIP_5PACK=<product-id>
    ```
  - [x] 8.2 Access via `import.meta.env.VITE_POLAR_PRODUCT_RELATIONSHIP_SINGLE` (per architecture Gap G4)

- [x] **Task 9: Integrate RelationshipCreditsSection into results page** (AC: #7)
  - [x] 9.1 Add `<RelationshipCreditsSection />` to `apps/front/src/routes/results/$assessmentSessionId.tsx`
  - [x] 9.2 Position in the grid section (around line 367) alongside `ShareProfileSection` and `ArchetypeShareCard` — this is the "social artifact" zone
  - [x] 9.3 Only render when user is authenticated (session data available from route context)

- [x] **Task 10: E2E test — purchase flow with authenticated user** (AC: #1, #2, #5)
  - [x] 10.1 Create `e2e/specs/purchase-credits.spec.ts`
  - [x] 10.2 **Test setup:** Use existing e2e patterns:
    - Create API context via `createApiContext()` (from `e2e/utils/api-client.ts`)
    - Sign up user via `createUser()` (from `e2e/factories/user.factory.ts`)
    - Create assessment session via `createAssessmentSession()` (from `e2e/factories/assessment.factory.ts`)
    - Seed session for results via `seedSessionForResults()` + `linkSessionToUser()`
  - [x] 10.3 **Test: free credit granted on signup:**
    - After `createUser()`, call `GET /api/purchase/credits` with the authed API context
    - Assert response: `{ availableCredits: 1, hasCompletedAssessment: true }`
    - This validates the `free_credit_granted` event was inserted by the Better Auth signup hook
  - [x] 10.4 **Test: credits endpoint returns correct state:**
    - Create a second user (no assessment)
    - Call `GET /api/purchase/credits`
    - Assert: `{ availableCredits: 1, hasCompletedAssessment: false }`
  - [x] 10.5 **Test: credits section visible on results page (browser test):**
    - Use Playwright `page` fixture with authed browser context (sign up via UI or `storageState`)
    - Navigate to results page for the seeded session
    - Assert `[data-testid="relationship-credits-section"]` is visible
    - Assert credit count displays "1"
    - Assert `[data-testid="invite-button"]` is visible (since user has 1 credit)
  - [x] 10.6 **Test: credits section hidden for unauthenticated user:**
    - Navigate to results page without auth (if accessible)
    - Assert `[data-testid="relationship-credits-section"]` is NOT visible
  - [x] 10.7 Follow existing e2e patterns: import from `e2e/fixtures/base.fixture.ts`, use `test.step()` for readability, `test.setTimeout()` for API-heavy tests, direct DB seeding via `pg.Pool` where no API endpoint exists

## Dev Notes

### Architecture Compliance

- **Hexagonal architecture:** Contract defines endpoint schema → handler delegates to use-case → use-case accesses repositories via Context.Tag → infrastructure provides implementations
- **Error propagation:** `DatabaseError` from repositories propagates unchanged to contract layer via `.addError()`. No remapping in use-case or handler.
- **Append-only events:** Credits derived from `purchase_events` via `deriveCapabilities()` (Story 13.1). No mutable counters.
- **Better Auth hooks:** `free_credit_granted` insertion uses Better Auth's `databaseHooks.user.create.after` — runs in Promise context with plain Drizzle (not Effect), same pattern as `onOrderPaid` webhook handler.

### Key Implementation Details

- **`free_credit_granted` idempotency:** Use a deterministic `polar_checkout_id = "free-credit-{userId}"` so the partial unique index prevents duplicate inserts. This is critical because Better Auth hooks may fire multiple times (retries, etc.).
- **No new webhook processing needed:** Story 13.2 already handles `credit_purchased` events for both single and 5-pack. The product ID → event type mapping exists in `process-purchase.use-case.ts`.
- **Credit formula already works:** `deriveCapabilities()` in `packages/domain/src/utils/derive-capabilities.ts` already handles `free_credit_granted`, `credit_purchased`, `credit_consumed`, and `credit_refunded` events correctly.
- **Frontend Polar checkout:** The architecture specifies `@polar-sh/checkout` for embedded overlay. Product IDs are configured in Polar dashboard and referenced via env vars. The checkout overlay is NOT a redirect — it's an in-page overlay.
- **Assessment completion check:** Use the existing `AssessmentSessionRepository` to check for sessions with `status = 'completed'` for the authenticated user.

### Existing Code to Leverage

| What | File | Notes |
|------|------|-------|
| Purchase event types | `packages/domain/src/types/purchase.types.ts` | `PURCHASE_EVENT_TYPES` const with 8 values |
| Capability derivation | `packages/domain/src/utils/derive-capabilities.ts` | Pure function, already tested (18 tests) |
| PurchaseEvent repository | `packages/domain/src/repositories/purchase-event.repository.ts` | `getCapabilities(userId)` method |
| Drizzle implementation | `packages/infrastructure/src/repositories/purchase-event.drizzle.repository.ts` | `Layer.effect` pattern |
| Mock implementation | `packages/infrastructure/src/repositories/__mocks__/purchase-event.drizzle.repository.ts` | `Layer.succeed` with `_resetMockState` |
| Purchase contract | `packages/contracts/src/http/groups/purchase.ts` | `PurchaseGroup` with `verifyPurchase` endpoint |
| Purchase handler | `apps/api/src/handlers/purchase.ts` | `PurchaseGroupLive` handler |
| Webhook handler | `packages/infrastructure/src/context/purchase-webhook-handler.ts` | `createOnOrderPaidHandler()` — plain Drizzle |
| Better Auth config | `packages/infrastructure/src/context/better-auth.ts` | Where to add signup hook |
| Process purchase use-case | `apps/api/src/use-cases/process-purchase.use-case.ts` | Product ID mapping reference |
| AppConfig | `packages/domain/src/config/app-config.ts` | Polar product ID fields already exist |

### Project Structure Notes

**Files to create:**
- `apps/api/src/use-cases/get-credits.use-case.ts`
- `apps/api/src/use-cases/__tests__/get-credits.use-case.test.ts`
- `apps/front/src/components/results/RelationshipCreditsSection.tsx`
- `apps/front/src/lib/polar-checkout.ts`

**Files to modify:**
- `packages/contracts/src/http/groups/purchase.ts` — add `getCredits` endpoint + response schema
- `apps/api/src/handlers/purchase.ts` — add `getCredits` handler
- `packages/infrastructure/src/context/better-auth.ts` — add `free_credit_granted` signup hook
- Results page component (likely `apps/front/src/routes/results.tsx` or similar) — add RelationshipCreditsSection

**No files to delete.**

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#ADR 3 — Polar Integration & Purchase Events]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR 4 — Invitation Flow]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1 — Relationship Credits & Purchase Flow]
- [Source: _bmad-output/implementation-artifacts/13-1-purchase-events-schema-and-capability-derivation.md — Schema foundation]
- [Source: _bmad-output/implementation-artifacts/13-2-polar-sh-checkout-and-webhook-integration.md — Webhook patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap G4 — Polar Product Configuration]
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern 6 — Transaction Boundaries]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Mutable counters** — Do NOT add a `credits_balance` column or any mutable counter. All credit state must be derived from the append-only event log via `deriveCapabilities()`.
6. **Custom payment UI** — Do NOT build custom payment forms. Use `@polar-sh/checkout` embedded overlay exclusively. Polar is the merchant-of-record.
7. **Duplicate credit grant** — The `free_credit_granted` insert MUST be idempotent (use deterministic `polar_checkout_id` value). Better Auth hooks can fire multiple times.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1: Added free_credit_granted insert to Better Auth user.create.after hook with idempotent deterministic polarCheckoutId and try/catch resilience
- Task 2: Added getCredits endpoint to PurchaseGroup contract with GetCreditsResponseSchema
- Task 3: Added getCredits handler to PurchaseGroupLive delegating to use-case
- Task 4: Created get-credits.use-case.ts using PurchaseEventRepository.getCapabilities() and AssessmentSessionRepository.getSessionsByUserId()
- Task 5: Created 6 unit tests covering zero events, free credit, purchased credits, consumed credits, completed assessment detection, active-only sessions
- Task 6: Created RelationshipCreditsSection with loading/hidden/credits/no-credits states, Polar checkout integration, post-purchase polling
- Task 7: Installed @polar-sh/checkout, created polar-checkout.ts utility wrapping PolarEmbedCheckout.create() with metadata userId passing
- Task 8: Env vars accessed via import.meta.env (VITE_POLAR_CHECKOUT_RELATIONSHIP_SINGLE/5PACK) — no .env file exists to modify
- Task 9: Integrated RelationshipCreditsSection into results page grid alongside ShareProfileSection and ArchetypeShareCard
- Task 10: Created 4 E2E test specs: free credit on signup, credits endpoint state, credits section visibility, unauthenticated hidden

### File List

**New files:**
- apps/api/src/use-cases/get-credits.use-case.ts
- apps/api/src/use-cases/__tests__/get-credits.use-case.test.ts
- apps/front/src/components/results/RelationshipCreditsSection.tsx
- apps/front/src/lib/polar-checkout.ts
- e2e/specs/purchase-credits.spec.ts

**Modified files:**
- packages/infrastructure/src/context/better-auth.ts (free_credit_granted signup hook)
- packages/contracts/src/http/groups/purchase.ts (getCredits endpoint + GetCreditsResponseSchema)
- packages/contracts/src/index.ts (export PurchaseGroup types)
- apps/api/src/handlers/purchase.ts (getCredits handler)
- apps/front/src/routes/results/$assessmentSessionId.tsx (RelationshipCreditsSection integration)
- apps/front/src/routes/results-session-route.test.tsx (mock for RelationshipCreditsSection)
- apps/front/package.json (added @polar-sh/checkout dependency)
- pnpm-lock.yaml (lockfile update)
