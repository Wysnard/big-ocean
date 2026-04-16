# Story 8.1: Subscription Event Types & Entitlement Derivation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want subscription lifecycle events tracked in `purchase_events`,
so that the system can derive subscription status and feature entitlements for Epic 8 (conversation extension behind €9.99/mo subscription).

## Acceptance Criteria

1. **Enum & schema:** Four new values are added to `purchase_event_type` (domain `PURCHASE_EVENT_TYPES`, Drizzle `pgEnum`, migration): `subscription_started`, `subscription_renewed`, `subscription_cancelled`, `subscription_expired`. Existing one-time / legacy event types stay unchanged.

2. **Correlation column:** `purchase_events` gains nullable `polar_subscription_id` (text) with a **partial unique index** where `polar_subscription_id IS NOT NULL` (pattern matches `polar_checkout_id`) so subscription webhook retries are idempotent. Extend `PurchaseEvent`, `InsertPurchaseEvent`, Drizzle `mapRow`, and mocks accordingly.

3. **Polar / Better Auth webhooks:** In `packages/infrastructure/src/context/better-auth.ts`, the existing `webhooks({ ... })` from `@polar-sh/better-auth` gains handlers beyond `onOrderPaid` — use the plugin’s typed callbacks (`WebhooksOptions` in `node_modules/@polar-sh/better-auth/dist/index.d.ts`): at minimum `onSubscriptionCreated`, `onSubscriptionCanceled`, `onSubscriptionRevoked`, and handlers needed to emit **renewal** and **expiry** events without double-counting. Map Polar `Subscription` payloads (`data.id`, `data.customer`, `data.productId`, `data.status`, `currentPeriodEnd`, `endedAt`, `cancelAtPeriodEnd`, etc. — see `@polar-sh/sdk` `Subscription` type) to the four internal event types. Resolve `userId` from `data.customer.externalId` (same pattern as `onOrderPaid`); log and return early if missing.

4. **Product scoping:** Only record subscription events for the **€9.99/mo subscription product** once `AppConfig` exposes its product id (add `polarProductSubscription` or equivalent next to existing `polarProduct*` keys in config + env). Ignore unrelated subscription products. If config is not yet wired in this story, gate inserts behind a clear config check and document the follow-up for Story 8.2 — prefer completing config + env + `.env.example` in 8.1 so 8.2 only wires checkout UX.

5. **Capability derivation:** Extend `packages/domain/src/utils/derive-capabilities.ts` (or add a focused helper imported from it) so that:
   - `getSubscriptionStatus(events: PurchaseEvent[]): "active" | "cancelled_active" | "expired" | "none"` is a **pure** function over the user’s ordered event list (assume chronological `createdAt`, consistent with `getEventsByUserId`).
   - `isEntitledTo(events: PurchaseEvent[], feature: "conversation_extension"): boolean` returns **true** when status is `"active"` or `"cancelled_active"` (per epic: user keeps access until period end after cancel).

6. **Repository API:** Expose subscription-aware capability reads without breaking existing `UserCapabilities` consumers — e.g. add `getSubscriptionStatus(userId)` / `isEntitledTo(userId, feature)` on `PurchaseEventRepository` that load events and delegate to the pure functions, **or** extend `UserCapabilities` with optional subscription fields. Do not duplicate event-query logic in handlers.

7. **Tests:** Unit tests cover derivation edge cases (started → renewed → cancelled → expired; out-of-order safety if you document ordering requirements); webhook mapping can be tested with extracted pure mappers + fixture payloads. `pnpm test:run` passes.

## Tasks / Subtasks

- [x] **Task 1: Domain & migration** (AC: #1, #2)
  - [x] 1.1 Append the four enum values to `PURCHASE_EVENT_TYPES` in `packages/domain/src/types/purchase.types.ts`; export through `packages/domain/src/index.ts`.
  - [x] 1.2 Add `polarSubscriptionId` to `PurchaseEvent` / `InsertPurchaseEvent`; add Drizzle column + partial unique index; hand-write new migration SQL (never edit old migrations — `CLAUDE.md`).
  - [x] 1.3 Update `packages/infrastructure/src/repositories/purchase-event.drizzle.repository.ts` mapping and duplicate-key handling if a second unique constraint message appears.

- [x] **Task 2: Pure derivation** (AC: #5, #7)
  - [x] 2.1 Implement `getSubscriptionStatus` and `isEntitledTo` from events; define an explicit reduce-over-events ruleset in comments (avoid ambiguous “latest wins” without stating tie-breakers).
  - [x] 2.2 Extend `packages/domain/src/utils/__tests__/derive-capabilities.test.ts` or add `derive-subscription-status.test.ts`.

- [x] **Task 3: Config** (AC: #4)
  - [x] 3.1 Add Polar subscription product id to `AppConfigService` / `AppConfig` live layer and `.env.example` (mirror existing `polarProductExtendedConversation` pattern in `packages/infrastructure`).

- [x] **Task 4: Better Auth webhooks** (AC: #3, #4, #7)
  - [x] 4.1 Add `onSubscription*` handlers alongside `onOrderPaid`; insert rows into `purchase_events` with `polar_subscription_id` = Polar subscription `id`, `eventType` set per mapping table (document table in Dev Notes).
  - [x] 4.2 Ensure idempotency: duplicate webhook → `onConflictDoNothing` on the subscription unique key or equivalent.

- [x] **Task 5: Repository surface** (AC: #6)
  - [x] 5.1 Add methods on `PurchaseEventRepository` + Drizzle live + mock.

### Review Findings

- [x] [Review][Patch] Subscription state mixes multiple subscription IDs into one lifecycle [packages/domain/src/utils/derive-capabilities.ts]
- [x] [Review][Patch] Renewal is dropped when `subscription.updated` arrives before the first started row [packages/infrastructure/src/context/better-auth.ts]
- [x] [Review][Patch] Expiry is only recorded from `subscription.revoked`, not from updated terminal subscription state [packages/infrastructure/src/context/better-auth.ts]
- [x] [Review][Patch] Subscription events can still be inserted without `polar_subscription_id` [packages/infrastructure/src/db/drizzle/schema.ts]
- [x] [Review][Patch] Review-added tests miss webhook mapping/idempotency coverage and the full started-renewed-cancelled-expired path [packages/domain/src/utils/__tests__/derive-capabilities.test.ts]

## Dev Notes

### Architecture compliance

- **Hexagonal / Effect:** Keep financial event writes in the Better Auth webhook path using **plain Drizzle** (`plainDb`) — same as `onOrderPaid`. Do not move business rules into HTTP handlers; pure derivation stays in `packages/domain`.
- **Errors:** Do not remap domain errors in use-cases (`CLAUDE.md`). Webhook failures should log and swallow where today’s `onOrderPaid` does, to avoid breaking auth routes.
- **Derive-at-read:** Subscription entitlement is derived from events, not a mutable `user` column.

### Source files (expected touchpoints)

| Area | Path |
|------|------|
| Domain types & derivation | `packages/domain/src/types/purchase.types.ts`, `packages/domain/src/utils/derive-capabilities.ts` |
| Repository | `packages/domain/src/repositories/purchase-event.repository.ts`, `packages/infrastructure/src/repositories/purchase-event.drizzle.repository.ts`, `packages/infrastructure/src/repositories/__mocks__/purchase-event.drizzle.repository.ts` |
| Schema / migration | `packages/infrastructure/src/db/drizzle/schema.ts`, new file under `packages/infrastructure/drizzle/` |
| Polar webhooks | `packages/infrastructure/src/context/better-auth.ts` |
| App config | Search `polarProduct` in `packages/domain` / `packages/infrastructure` for `AppConfig` definitions |

### Polar / `@polar-sh/better-auth` reference

- `webhooks()` accepts `WebhooksOptions`: `onSubscriptionCreated`, `onSubscriptionUpdated`, `onSubscriptionActive`, `onSubscriptionCanceled`, `onSubscriptionRevoked`, `onSubscriptionUncanceled`, etc. (`node_modules/@polar-sh/better-auth/dist/index.d.ts`, `interface WebhooksOptions`).
- Payload types import from `@polar-sh/sdk/models/components/*` (e.g. `WebhookSubscriptionCreatedPayload` — `data` is `Subscription` with `id`, `customer.externalId`, `productId`, `status`, period fields).

### Webhook → `purchase_events` mapping (implemented, Story 8.1)

All subscription rows use `polar_subscription_id = data.id`, `polar_checkout_id = null`, and only fire when `data.productId === config.polarProductSubscription`.

| Polar / Better Auth handler | `event_type` | Notes |
|------------------------------|--------------|--------|
| `onSubscriptionCreated`, `onSubscriptionActive` | `subscription_started` | Same insert path; partial unique on `(polar_subscription_id)` where `subscription_started` dedupes retries / duplicate created+active. |
| `onSubscriptionCanceled` | `subscription_cancelled` | User may still have access until period end (`cancelled_active` in derivation). |
| `onSubscriptionRevoked` | `subscription_expired` | Polar: access removed immediately → maps to internal `subscription_expired`. |
| `onSubscriptionUpdated` | `subscription_renewed` | Emits when `subscription_started` exists, `currentPeriodEnd` differs from started row `metadata.periodEnd`, and not already recorded for same `renewalPeriodEnd` (unique on sub id + `metadata->>'renewalPeriodEnd'`). |

**`onOrderPaid`:** Orders for `polarProductSubscription` are ignored here (lifecycle comes from subscription webhooks only).

**Renewal / expiry:** Confirm ordering in Polar sandbox for your org; logic above is deterministic given webhook payloads.

### Relationship to existing purchase flow

- **Story 13.1** established append-only `purchase_events` and `deriveCapabilities` for credits/portrait/legacy `extended_conversation_unlocked`. Epic 8 moves **conversation extension** to subscription — `isEntitledTo(..., "conversation_extension")` is the new gate; Story 8.3 will swap `FeatureUnavailable` in `activate-conversation-extension.use-case.ts` for this check (do **not** remove the gate in 8.1 unless explicitly requested).

### Testing standards

- Vitest + `@effect/vitest` patterns per existing domain tests.
- Repository mock: resettable in-memory store (`__mocks__/purchase-event.drizzle.repository.ts`).

### Epic cross-reference

| Story | Scope |
|-------|--------|
| **8.1 (this)** | Events, schema, derivation, webhook mapping |
| **8.2** | Embedded checkout, `subscription.created` → first `subscription_started` from real product |
| **8.3** | `activate-conversation-extension` + session fork + portrait regeneration metadata |

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.1–8.3]
- [Source: `packages/infrastructure/src/context/better-auth.ts` — `onOrderPaid` insert pattern]
- [Source: `packages/domain/src/utils/derive-capabilities.ts` — capability derivation]
- [Source: `CLAUDE.md` — hexagonal architecture, migration rules]
- [Source: `_bmad-output/implementation-artifacts/13-1-purchase-events-schema-and-capability-derivation.md` — prior purchase-events story]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

_(none)_

### Completion Notes List

- Implemented four `purchase_event_type` enum values, `polar_subscription_id` column, partial unique indexes for idempotent subscription lifecycle + renewal per billing period end, migration `drizzle/20260416180000_subscription_purchase_events`, and `docker/init-db-test.sql` sync.
- Added `polarProductSubscription` / `POLAR_PRODUCT_SUBSCRIPTION` across AppConfig, compose files, fixtures, and checkout slug `subscription`.
- Better Auth Polar `webhooks`: `onSubscriptionCreated`, `onSubscriptionActive`, `onSubscriptionCanceled`, `onSubscriptionRevoked`, `onSubscriptionUpdated` with `onConflictDoNothing()` inserts; `onOrderPaid` skips subscription product id.
- Domain: `getSubscriptionStatus`, `isEntitledTo` (includes legacy `extended_conversation_unlocked` OR for `conversation_extension`), repository methods, Vitest coverage in `derive-capabilities.test.ts`.
- Code review fixes: current entitlement derivation now isolates the latest active subscription lineage by `polarSubscriptionId`; `subscription.updated` can seed missing `subscription_started` rows, infer cancelled/expired terminal state, and renewal dedupe is covered by pure helper tests.
- Validation after review fixes: `pnpm turbo typecheck`, `pnpm test:run`, `pnpm --filter=api exec vitest run`, targeted Vitest for subscription helpers, and Biome checks on touched files all passed.

### File List

- `compose.yaml`
- `compose.e2e.yaml`
- `compose.test.yaml`
- `docker/init-db-test.sql`
- `drizzle/20260416180000_subscription_purchase_events/migration.sql`
- `.env.e2e.example`
- `.env.example`
- `packages/domain/src/config/__mocks__/app-config.ts`
- `packages/domain/src/config/app-config.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/repositories/purchase-event.repository.ts`
- `packages/domain/src/types/purchase.types.ts`
- `packages/domain/src/utils/__tests__/derive-capabilities.test.ts`
- `packages/domain/src/utils/derive-capabilities.ts`
- `packages/domain/src/utils/index.ts`
- `packages/infrastructure/src/config/__tests__/__fixtures__/app-config.fixtures.ts`
- `packages/infrastructure/src/config/app-config.live.ts`
- `packages/infrastructure/src/context/better-auth.ts`
- `packages/infrastructure/src/context/polar-subscription-events.ts`
- `packages/infrastructure/src/context/__tests__/polar-subscription-events.test.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/repositories/__mocks__/purchase-event.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/purchase-event.drizzle.repository.ts`
- `packages/infrastructure/src/utils/test/app-config.testing.ts`
- `_bmad-output/implementation-artifacts/8-1-subscription-event-types-and-entitlement-derivation.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- **2026-04-16:** Story 8.1 implemented — subscription purchase events, entitlement derivation, config, webhooks, migration, tests (`pnpm test:run`, `pnpm turbo typecheck`).
- **2026-04-16:** Code review fixes applied — lifecycle derivation isolated per subscription id, `subscription.updated` terminal-state handling added, schema guard added for `polar_subscription_id`, and focused webhook helper tests added.

---

**Completion status:** Implementation and code review fixes complete; story moved to **done**.
