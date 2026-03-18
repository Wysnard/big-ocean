---
status: ready-for-dev
story_id: "3.3"
epic: 3
created_date: 2026-03-18
blocks: [3-4]
blocked_by: []
---

# Story 3.3: Polar Integration & Purchase Events

## Story

As the **system**,
I want to **process payments through Polar as merchant-of-record and track all purchase events immutably**,
So that **monetization is reliable, idempotent, and supports all product types**.

## Acceptance Criteria

### AC1: Better Auth Polar Plugin Configuration
**Given** the Polar integration is configured
**When** the Better Auth Polar plugin is initialized
**Then** customer sync creates a Polar customer with externalId = userId on signup
**And** the webhook handler (onOrderPaid) lives inside the Better Auth Polar plugin

### AC2: Webhook Processing & Idempotency
**Given** a Polar webhook fires for a completed order
**When** onOrderPaid processes the event
**Then** the Polar product ID is mapped to an internal event type
**And** a purchase_event row is inserted into the append-only purchase_events table
**And** the polar_checkout_id UNIQUE constraint ensures idempotent processing (duplicate webhooks are no-ops)

### AC3: 8 Purchase Event Types
**Given** the purchase_events table
**When** events are recorded
**Then** 8 event types are supported: free_credit_granted, portrait_unlocked, credit_purchased, credit_consumed, extended_conversation_unlocked, portrait_refunded, credit_refunded, extended_conversation_refunded
**And** rows are INSERT-only and immutable -- no updates or deletes

### AC4: Plain Drizzle in Better Auth Context
**Given** the webhook handler processes events
**When** a database transaction is needed
**Then** plain Drizzle is used for transactions (not Effect layers) within the Better Auth plugin context

## Tasks

### Task 1: Purchase Events Schema & Domain Types
Create the append-only purchase_events database table with domain types and capability derivation.

**Subtasks:**
- 1.1: Define `PURCHASE_EVENT_TYPES` constant array (8 event types) and `PurchaseEventType` union type in `packages/domain/src/types/purchase.types.ts`
- 1.2: Define `PurchaseEvent` entity interface and `UserCapabilities` interface in the same file
- 1.3: Define `PurchaseEventMetadata` Effect Schema for safe jsonb parsing with `{ units: number }` and `parseMetadata()` fallback function
- 1.4: Create `purchase_events` pgTable in `packages/infrastructure/src/db/drizzle/schema.ts` with: uuid pk, user_id FK, event_type, polar_checkout_id (unique where not null), polar_product_id, amount_cents, currency, metadata jsonb, created_at
- 1.5: Generate and apply Drizzle migration for the new table
- 1.6: Implement `deriveCapabilities()` pure function in `packages/domain/src/utils/derive-capabilities.ts` that computes `UserCapabilities` from an event array
- 1.7: Write unit tests for `deriveCapabilities()` covering: free credits, purchased credits (single + 5-pack via metadata.units), consumed credits, refunds, portrait unlock/refund, extended conversation unlock/refund, floor-at-zero

### Task 2: Purchase Event Repository (Domain Interface + Drizzle Implementation)
Implement the repository interface and Drizzle-based implementation for purchase events.

**Subtasks:**
- 2.1: Define `PurchaseEventRepository` Context.Tag in `packages/domain/src/repositories/purchase-event.repository.ts` with methods: `insertEvent`, `getEventsByUserId`, `getCapabilities`, `getByCheckoutId`, `insertEventWithPortraitPlaceholder`
- 2.2: Implement `PurchaseEventDrizzleRepositoryLive` in `packages/infrastructure/src/repositories/purchase-event.drizzle.repository.ts`
- 2.3: Handle duplicate checkout detection via unique constraint violation → `DuplicateCheckoutError`
- 2.4: Implement `insertEventWithPortraitPlaceholder` as a Drizzle Effect transaction with `onConflictDoNothing` for portrait idempotency
- 2.5: Create `__mocks__/purchase-event.drizzle.repository.ts` in-memory mock with state reset

### Task 3: Payment Gateway Repository (Polar Webhook Verification)
Abstract webhook verification behind a domain interface.

**Subtasks:**
- 3.1: Define `PaymentGatewayRepository` Context.Tag in `packages/domain/src/repositories/payment-gateway.repository.ts` with `verifyWebhook` method
- 3.2: Implement `PaymentGatewayPolarRepositoryLive` in `packages/infrastructure/src/repositories/payment-gateway.polar.repository.ts` using `@polar-sh/sdk` `validateEvent` for HMAC verification
- 3.3: Create `__mocks__/payment-gateway.polar.repository.ts` mock

### Task 4: Better Auth Polar Plugin Integration
Configure the Better Auth Polar plugin with checkout products and webhook handler.

**Subtasks:**
- 4.1: Add `@polar-sh/better-auth` and `@polar-sh/sdk` dependencies
- 4.2: Configure `polar()` plugin in `packages/infrastructure/src/context/better-auth.ts` with: Polar SDK client, `createCustomerOnSignUp`, checkout products (portrait-unlock, relationship-single, relationship-5pack, extended-conversation), and webhook secret
- 4.3: Implement `onOrderPaid` handler inside the `webhooks()` plugin using plain Drizzle: extract userId from `order.customer.externalId`, map product ID to event type via `mapPolarProductToEventType`, insert purchase event with `onConflictDoNothing` for idempotency
- 4.4: Add portrait placeholder creation inside the webhook transaction for portrait-triggering event types (`portrait_unlocked`, `extended_conversation_unlocked`)
- 4.5: Add AppConfig entries for Polar product IDs, access token, and webhook secret (all as Redacted secrets)

### Task 5: Process Purchase Use Case (Effect-Based)
Create the Effect-wrapped use case for unit-testable business logic.

**Subtasks:**
- 5.1: Implement `processPurchase` use case in `apps/api/src/use-cases/process-purchase.use-case.ts` with two-phase idempotency: Phase 1 checks `getByCheckoutId`, Phase 2 inserts event + portrait placeholder
- 5.2: Map product IDs to event types using AppConfig
- 5.3: Handle portrait generation trigger via `forkDaemon` for async portrait generation after transaction commit
- 5.4: Handle re-trigger on duplicate webhook if portrait is incomplete (content null, retryCount < 3)
- 5.5: Write comprehensive unit tests in `apps/api/src/use-cases/__tests__/process-purchase.use-case.test.ts` covering: all 4 product mappings, unknown product rejection, duplicate webhook idempotency, portrait placeholder creation, portrait generation re-trigger

### Task 6: Purchase HTTP Contracts & Handler
Define HTTP API contracts and implement the purchase handler group.

**Subtasks:**
- 6.1: Define `PurchaseGroup` in `packages/contracts/src/http/groups/purchase.ts` with `verifyPurchase` (GET /verify with checkoutId param) and `getCredits` (GET /credits) endpoints
- 6.2: Implement `PurchaseGroupLive` handler in `apps/api/src/handlers/purchase.ts`
- 6.3: Implement `getCredits` use case in `apps/api/src/use-cases/get-credits.use-case.ts`
- 6.4: Write unit tests for `getCredits` use case

### Task 7: Frontend Checkout Client
Implement the Polar embedded checkout client for the frontend.

**Subtasks:**
- 7.1: Add `@polar-sh/checkout` dependency to `apps/front`
- 7.2: Implement `createThemedCheckoutEmbed()` in `apps/front/src/lib/polar-checkout.ts` that calls `authClient.checkout()` and creates `PolarEmbedCheckout` with current theme
- 7.3: Configure `authClient` with Polar plugin in `apps/front/src/lib/auth-client.ts`

## Dev Notes

- The webhook handler runs inside Better Auth's async (Promise) context, so it uses plain Drizzle transactions, not Effect layers
- A parallel `process-purchase.use-case.ts` wraps the same business logic in Effect for unit testing with DI
- The `PolarWebhookEvent` domain type abstracts the Polar SDK's raw event shape
- Portrait placeholder uses `onConflictDoNothing` for idempotency -- if portrait already exists, transaction succeeds silently
- Free credit granting on user signup is handled in Better Auth's `databaseHooks.user.create.after` hook, not in the webhook handler
- All Polar secrets (access token, webhook secret, product IDs) come from `AppConfig` via Effect DI -- no `process.env` usage

## References

- Architecture: ADR-9 (Append-Only Purchase Events)
- Prior implementation: Stories 13.1, 13.2, 13.3
- Key files: `packages/domain/src/types/purchase.types.ts`, `packages/infrastructure/src/context/better-auth.ts`, `apps/api/src/use-cases/process-purchase.use-case.ts`
