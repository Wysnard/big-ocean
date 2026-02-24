---
status: in-progress
story_id: "13.2"
epic: 13
created_date: 2026-02-24
blocks: [13-3]
blocked_by: [13-1]
---

# Story 13.2: Polar.sh Checkout & Webhook Integration

## Story

As a **User**,
I want **to purchase portrait unlocks and relationship credits via Polar.sh checkout**,
so that **my purchases are recorded and capabilities unlocked immediately**.

## Acceptance Criteria

### Checkout Flow (Client-Side)
**Given** an authenticated user on the purchase page
**When** they click a product button (portrait, single credit, 5-pack, extended conversation)
**Then** `authClient.checkout()` initiates a Polar checkout session
**And** the user is redirected to Polar's hosted checkout

### Webhook Processing (Server-Side)
**Given** Polar sends an `order.paid` webhook to `/api/auth/polar/webhooks`
**When** Better Auth's Polar plugin verifies the HMAC signature
**Then** `onOrderPaid` handler maps the product ID to an event type via AppConfig
**And** a purchase event is inserted into `purchase_events` table
**And** duplicate webhooks (same `polar_checkout_id`) are handled idempotently

### Product Mapping
**Given** a valid order with a known product ID
**When** the webhook handler processes it
**Then** the product maps to the correct event type:
  - Portrait unlock → `portrait_unlocked`
  - Single relationship credit → `credit_purchased` (metadata: null)
  - 5-pack relationship credits → `credit_purchased` (metadata: `{ units: 5 }`)
  - Extended conversation → `extended_conversation_unlocked`

### Unknown Product Handling
**Given** a webhook with an unrecognized product ID
**When** the handler processes it
**Then** it logs a warning and skips insertion (no error thrown to Polar)

### Verify Purchase Endpoint
**Given** an authenticated user
**When** they call `GET /api/purchases/verify`
**Then** they receive their current capabilities (credits, portrait, extended conversation)

## Business Context

**Why This Story Matters:**
- Enables monetization via Polar.sh checkout
- Purchases unlock portrait generation and relationship comparison features
- Webhook ensures purchase events are recorded even if user closes browser after payment

**Approach: Better Auth Polar Plugin**
The implementation uses `@polar-sh/better-auth` plugin, which handles:
- HMAC webhook verification internally (no custom crypto)
- Webhook routing at `/api/auth/polar/webhooks` (no custom HttpApiEndpoint)
- Customer creation on signup via Better Auth hooks

The `createOnOrderPaidHandler` in `packages/infrastructure/src/context/purchase-webhook-handler.ts` runs in Better Auth's Promise context with plain Drizzle (not Effect), since Better Auth manages the request lifecycle.

A separate `process-purchase.use-case.ts` wraps the same business logic in Effect for unit testing with DI.

## Technical Implementation

### Architecture

```
Polar checkout → Better Auth Polar plugin → onOrderPaid handler
                                              ↓
                                       purchase-webhook-handler.ts (plain Drizzle)
                                              ↓
                                       purchase_events table

Effect unit tests → process-purchase.use-case.ts → PurchaseEventRepository
```

### Key Files

| File | Purpose |
|------|---------|
| `packages/infrastructure/src/context/purchase-webhook-handler.ts` | `createOnOrderPaidHandler()` — plain Drizzle webhook handler |
| `packages/infrastructure/src/context/better-auth.ts` | Polar plugin config with `checkout()`, `webhooks()` |
| `apps/api/src/use-cases/process-purchase.use-case.ts` | Effect use-case for unit testing business logic |
| `apps/api/src/use-cases/__tests__/process-purchase.use-case.test.ts` | Unit tests |
| `packages/contracts/src/http/groups/purchase.ts` | `PurchaseGroup` with `verifyPurchase` endpoint |
| `apps/api/src/handlers/purchase.ts` | `PurchaseGroupLive` handler |
| `packages/domain/src/errors/http.errors.ts` | `DuplicateCheckoutError`, `UnknownProductError` |
| `packages/domain/src/config/app-config.ts` | Polar product ID config fields |

### AppConfig Fields (Story 13.2)

```typescript
readonly polarAccessToken: Redacted<string>;
readonly polarWebhookSecret: Redacted<string>;
readonly polarProductPortraitUnlock: string;
readonly polarProductRelationshipSingle: string;
readonly polarProductRelationship5Pack: string;
readonly polarProductExtendedConversation: string;
```

### Environment Variables

```env
POLAR_ACCESS_TOKEN=        # Polar API access token
POLAR_WEBHOOK_SECRET=      # Webhook HMAC secret
POLAR_PRODUCT_PORTRAIT_UNLOCK=    # Product ID
POLAR_PRODUCT_RELATIONSHIP_SINGLE= # Product ID
POLAR_PRODUCT_RELATIONSHIP_5PACK=  # Product ID
POLAR_PRODUCT_EXTENDED_CONVERSATION= # Product ID
```

## Tasks

- [x] Task 1: Add Polar config fields to `AppConfig` interface and mock
- [x] Task 2: Add `UnknownProductError` to domain errors
- [x] Task 3: Create `purchase-webhook-handler.ts` (plain Drizzle, Better Auth context)
- [x] Task 4: Configure Better Auth Polar plugin in `better-auth.ts`
- [x] Task 5: Create `PurchaseGroup` contract with `verifyPurchase` endpoint
- [x] Task 6: Create `PurchaseGroupLive` handler
- [x] Task 7: Create `process-purchase.use-case.ts` (Effect wrapper for testability)
- [x] Task 8: Create unit tests for process-purchase use-case
- [x] Task 9: Add Docker/env configuration for Polar env vars
- [ ] Task 10: Integration test with Docker (deferred to CI)

## Dev Testing

```bash
# Unit tests
pnpm --filter=api test -- --run src/use-cases/__tests__/process-purchase.use-case.test.ts

# All tests
pnpm test:run
```
