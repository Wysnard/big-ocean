# Story 8.2: Subscription Checkout Flow

Status: review

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a free user,
I want to subscribe at €9.99/mo via an embedded checkout,
so that I can unlock conversation extension with Nerin (entitlement derived in Story 8.1).

## Acceptance Criteria

1. **Correct Polar product & slug:** Tapping Subscribe on the Me page (`SubscriptionPitchSection`) and the weekly letter conversion CTA (`WeeklyLetterReadingView`) opens Polar embedded checkout for the **€9.99/mo subscription** product — i.e. `createThemedCheckoutEmbed("subscription", ...)` (maps to `polarProductSubscription` / slug `subscription` in `better-auth.ts`). Do **not** use slug `"extended-conversation"` for these flows anymore (that slug remains the legacy one-time `polarProductExtendedConversation` product).

2. **Webhook → entitlement:** On successful first payment, Polar emits subscription lifecycle webhooks; Story 8.1 handlers already insert `subscription_started` with idempotency. After processing, `PurchaseEventRepository.isEntitledTo(userId, "conversation_extension")` is **true** for that user (same as epic AC).

3. **Me page reflects subscriber state:** When the user is entitled to `conversation_extension`, the Me page subscription section shows **`SubscriptionValueSummary`** instead of **`SubscriptionPitchSection`** (UX-DR36 / [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — §11.4a SubscriptionPitchSection / SubscriptionValueSummary]).

4. **Post-checkout UX:** After the embed closes, the UI **refetches** subscription/entitlement state so the Me page can switch to the subscriber variant without a full reload. Webhooks are asynchronous — use TanStack Query invalidation and/or short polling until `isEntitledTo` is true (cap retries; show toast if still pending).

5. **Customer portal (self-service cancel):** Users can open Polar’s **customer portal** for subscription management (cancel at period end per FR47). The Better Auth Polar plugin exposes this via the **`portal()`** sub-plugin — add it to `polar({ use: [...] })` in `packages/infrastructure/src/context/better-auth.ts` if not already present, and wire a **“Manage subscription”** link in `SubscriptionValueSummary` using the **`polarClient()`** on the frontend (`authClient` from `@/lib/auth-client`) — follow `@polar-sh/better-auth` types for the portal session URL pattern.

6. **Weekly letter tier awareness:** If the user is already a subscriber, the weekly letter conversion block should **not** push checkout again — show copy consistent with subscriber status (minimal MVP: hide primary checkout CTA or replace with link to Me / manage subscription).

7. **Performance / NFR25:** Checkout initiation stays within the **90 seconds tap-to-confirmed** expectation (FR47) — no blocking artificial delays; embed + webhook latency is external.

8. **Tests:** Update `SubscriptionPitchSection` tests and any checkout slug assertions; add coverage for subscriber vs pitch branching where practical. `pnpm test:run` passes.

## Tasks / Subtasks

- [x] **Task 1: Checkout slug & copy** (AC: #1, #7)
  - [x] 1.1 Replace `"extended-conversation"` with `"subscription"` in `SubscriptionPitchSection.tsx` and `WeeklyLetterReadingView.tsx`.
  - [x] 1.2 Centralize slug in a named constant (e.g. `POLAR_CHECKOUT_SLUG_SUBSCRIPTION = "subscription"`) in `apps/front/src/lib/polar-checkout.ts` or adjacent module to avoid string drift.

- [x] **Task 2: Expose subscription state to the client** (AC: #2, #3, #4)
  - [x] 2.1 Add an authenticated HTTP endpoint (recommended: extend `PurchaseGroup` in `packages/contracts/src/http/groups/purchase.ts`) returning at minimum: `isEntitledToConversationExtension: boolean` and `subscriptionStatus: "active" | "cancelled_active" | "expired" | "none"` via existing `PurchaseEventRepository.isEntitledTo` / `getSubscriptionStatus`.
  - [x] 2.2 Implement handler in `apps/api/src/handlers/purchase.ts` + thin use-case if needed; register in `BigOceanApi`.
  - [x] 2.3 Add TanStack Query hook using `makeApiClient` + `Effect.runPromise` ([Source: `CLAUDE.md` — Frontend API Client Pattern]).
  - [x] 2.4 **Do not** overload `deriveCapabilities().hasExtendedConversation` alone for subscription — that flag today means **legacy** one-time `extended_conversation_unlocked` events only ([Source: `packages/domain/src/utils/derive-capabilities.ts`]). Subscription entitlement for UI must use `isEntitledTo` / `getSubscriptionStatus` (already correct in domain).

- [x] **Task 3: `SubscriptionValueSummary` + Me page composition** (AC: #3, #5)
  - [x] 3.1 Create `apps/front/src/components/me/SubscriptionValueSummary.tsx` per UX spec: headline *"You and Nerin"*, “Subscribed since [Month Year]” from first `subscription_started` (expose `subscribedSince: string | null` ISO date from API if needed), **Manage subscription →** opening portal.
  - [x] 3.2 For **extension used / portrait regenerated** props (UX spec): if Story 8.3 data is unavailable, default to `false` / omit extended copy — do not block 8.2; optionally stub `data-testid`s for future 8.3 wiring.

- [x] **Task 4: Embed close → refetch** (AC: #4)
  - [x] 4.1 Extend `createThemedCheckoutEmbed` or callers to run `queryClient.invalidateQueries` for the subscription query after `PolarEmbedCheckout` success/close (inspect `@polar-sh/checkout` embed API for the right lifecycle hook).
  - [x] 4.2 Optional: poll subscription endpoint every 2–3s for ~30s after close while still showing pitch, then toast.

- [x] **Task 5: Polar `portal()` server + client** (AC: #5)
  - [x] 5.1 Import `portal` from `@polar-sh/better-auth` and add `portal({ ... })` to `polar({ use: [checkout(...), webhooks(...), portal(...)] })` (order per plugin docs — avoid breaking existing routes).
  - [x] 5.2 Wire manage link using typed `authClient` methods from `polarClient()` plugin.

- [x] **Task 6: Weekly letter** (AC: #6)
  - [x] 6.1 Use the same subscription query in `WeeklyLetterReadingView` to conditionally render subscriber vs conversion section.

- [x] **Task 7: Tests & QA** (AC: #8)
  - [x] 7.1 Fix `SubscriptionPitchSection.test.tsx` expected slug.
  - [x] 7.2 Add tests for new purchase endpoint handler (unit/integration per project patterns).

### Review Findings

- [x] [Review][Patch] Polling loop returns stale cached data — `staleTime: 60_000` prevents re-fetching within 60 s, so every iteration after the first returns the same cached value. Fix: pass `{ staleTime: 0 }` to `queryClient.fetchQuery(subscriptionStateQueryOptions(), { staleTime: 0 })` inside the loop. [apps/front/src/hooks/use-subscription-state.ts:39]
- [x] [Review][Patch] onClose fires runPostCheckoutRefresh on cancel and double-fires on success — On canceled checkout only `close` fires (unnecessary 30 s poll + misleading toast). On successful checkout `success` then `close` both fire, spawning two concurrent polling loops. Fix: remove `onClose` from the lifecycle callbacks; wire only `onSuccess`. [apps/front/src/components/me/SubscriptionPitchSection.tsx, apps/front/src/components/today/WeeklyLetterReadingView.tsx, apps/front/src/lib/polar-checkout.ts]
- [x] [Review][Patch] Unhandled promise rejection in runPostCheckoutRefresh — The `void (async () => { ... })()` pattern has no `.catch()`. Any network error or Effect failure inside the polling loop surfaces as an unhandled rejection with no user-visible feedback. Fix: add `.catch((err) => toast.error(...))` to the outer void expression. [apps/front/src/components/me/SubscriptionPitchSection.tsx:26, apps/front/src/components/today/WeeklyLetterReadingView.tsx:34]
- [x] [Review][Patch] Unvalidated server-supplied URL passed to window.open (open redirect) — `openPolarCustomerPortal` casts the response as `{ url?: string }` and passes `data.url` directly to `window.open` with no origin validation; a `javascript:` URI or phishing URL would be accepted. Fix: validate `data.url.startsWith("https://")` before calling `window.open`. [apps/front/src/lib/polar-customer-portal.ts:19]
- [x] [Review][Patch] Missing subscriber-branch tests — `WeeklyLetterReadingView.test.tsx` only tests `isEntitledToConversationExtension: false`; no test asserts that `data-testid="weekly-letter-subscriber"` renders for subscribers or that `weekly-letter-checkout-cta` is absent. `-three-space-routes.test.tsx` has no test case asserting `SubscriptionValueSummary` renders when entitled. (AC #8) [apps/front/src/components/today/__tests__/WeeklyLetterReadingView.test.tsx, apps/front/src/routes/-three-space-routes.test.tsx]
- [x] [Review][Patch] Me page / weekly letter subscription UI flashes pitch during loading — `subscriptionState` is `undefined` while the subscription query is pending; both Me page and WeeklyLetterReadingView render the free/pitch variant until it resolves, causing a flash for subscribers. Fix: use `isPending` from the query result to guard rendering (show skeleton or neutral state). [apps/front/src/routes/me/index.tsx:254, apps/front/src/components/today/WeeklyLetterReadingView.tsx:71]
- [x] [Review][Patch] Subscription query error state is silently indistinguishable from "not subscribed" — When React Query is in an `isError` state (network/auth failure), `subscriptionState?.isEntitledToConversationExtension` is falsy and the UI shows the free path with no distinction. Fix: check `isError` from `useSubscriptionState` and render a neutral/fallback state rather than the full pitch. [apps/front/src/routes/me/index.tsx, apps/front/src/components/today/WeeklyLetterReadingView.tsx]
- [x] [Review][Patch] Portal res.json() can throw on non-JSON success body — After `res.ok`, `await res.json()` assumes JSON; an HTML error page or proxy response with a 200 status would throw an unhandled exception. Fix: wrap `res.json()` in a try/catch that rethrows as a typed Error. [apps/front/src/lib/polar-customer-portal.ts:18]
- [x] [Review][Patch] window.open popup-blocked failure is invisible — `window.open(url, "_blank")` returns `null` when the browser blocks the popup; the current code discards the return value and reports success. Fix: check the return value and fall back to `window.location.href = url` if null. [apps/front/src/lib/polar-customer-portal.ts:23]
- [x] [Review][Patch] formatSubscribedSince renders "Invalid Date" on malformed ISO — `new Date(iso)` with a non-ISO or empty string produces an Invalid Date object that `Intl.DateTimeFormat.format()` renders as "Invalid Date". Fix: guard with `if (isNaN(d.getTime())) return "recently"`. [apps/front/src/components/me/SubscriptionValueSummary.tsx:7]

#### Round 2 (2026-04-16)

- [x] [Review][Patch] Portal JSON body may be non-object — After `res.json()`, if the body parses to `null` or a non-object primitive, evaluating `data.url` throws before the string/`https` checks. Fix: narrow with `data != null && typeof data === "object" && !Array.isArray(data)` (or schema) before reading `url`. [apps/front/src/lib/polar-customer-portal.ts:19]
- [x] [Review][Patch] No automated tests for `openPolarCustomerPortal` — Branches (JSON parse failure, missing url, non-https, popup blocked → `location.href`) are security- and UX-sensitive but unexercised in CI. Add Vitest with `fetch` / `window.open` mocks. [apps/front/src/lib/polar-customer-portal.ts]
- [x] [Review][Patch] Subscription error UI has no retry — Me (`subscription-section-error`) and weekly letter (`weekly-letter-subscription-error`) only ask the user to refresh the page; the query already exposes `refetch`. Fix: add a small "Try again" control wired to `refetch()` (and optionally `isFetching` disabled state). [apps/front/src/routes/me/index.tsx:262, apps/front/src/components/today/WeeklyLetterReadingView.tsx:82]
- [x] [Review][Defer] Portal `fetch` has no AbortSignal / timeout — A hung TCP connection can leave the manage action pending until the browser gives up; same class of issue as other cookie-authenticated fetches. Defer to a cross-cutting fetch hygiene pass. [apps/front/src/lib/polar-customer-portal.ts:10]

## Dev Notes

### Architecture compliance

- **Hexagonal / Effect:** New purchase read endpoints go through **handlers → use-cases**; delegate to `PurchaseEventRepository` only ([Source: `CLAUDE.md`]).
- **No error remapping** in use-cases except fail-open patterns already used.
- **Frontend:** `HttpApiClient` + `@workspace/contracts` only — no raw `fetch`.
- **Forms:** N/A for this story (checkout is Polar UI).
- **Navigation:** `<Link>` for internal routes; portal opens external Polar URL in same or new tab per UX/security choice (document in code comment).

### Previous story intelligence (Story 8.1)

- Subscription lifecycle is **fully implemented** in webhooks (`packages/infrastructure/src/context/better-auth.ts`, `polar-subscription-events.ts`). Product id env: `POLAR_PRODUCT_SUBSCRIPTION`; checkout slug **`subscription`** is already registered next to `extended-conversation` ([Source: completion notes in `8-1-subscription-event-types-and-entitlement-derivation.md`]).
- **`isEntitledTo(events, "conversation_extension")`** ORs subscription phases `active` | `cancelled_active` with legacy `hasExtendedConversation` ([Source: `packages/domain/src/utils/derive-capabilities.ts`]).
- **Idempotency:** duplicate webhooks handled via partial unique indexes — do not bypass.

### File structure (expected touchpoints)

| Area | Path |
|------|------|
| Themed embed | `apps/front/src/lib/polar-checkout.ts` |
| Pitch + weekly letter | `apps/front/src/components/me/SubscriptionPitchSection.tsx`, `apps/front/src/components/today/WeeklyLetterReadingView.tsx` |
| Me route composition | `apps/front/src/routes/me/index.tsx` |
| Contracts | `packages/contracts/src/http/groups/purchase.ts`, `packages/contracts/src/http/api.ts` |
| API handler | `apps/api/src/handlers/purchase.ts` |
| Use-case (if any) | `apps/api/src/use-cases/get-subscription-state.use-case.ts` (name as fits conventions) |
| Better Auth Polar | `packages/infrastructure/src/context/better-auth.ts` |
| Auth client | `apps/front/src/lib/auth-client.ts` (types only — portal methods come from `polarClient()`) |

### UX references

- **UX-DR36:** SubscriptionPitchSection (free) vs SubscriptionValueSummary (subscriber) — [Source: `_bmad-output/planning-artifacts/epics.md`]
- Component copy & structure — [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` §11.4a]

### Testing standards

- Vitest + existing frontend test patterns; mock `createThemedCheckoutEmbed` where used.
- Preserve **`data-testid`** attributes (`subscription-pitch`, `subscription-checkout-cta`, `weekly-letter-checkout-cta`, etc.) — extend rather than rename ([Source: `CLAUDE.md` — E2E]).

### Out of scope (explicit)

- **Story 8.3:** `activate-conversation-extension` gate removal, session fork, portrait regen — only stub props/copy if needed for `SubscriptionValueSummary`.
- Changing **pricing**, Polar product setup in dashboard, or webhook secrets.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.2]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — §Subscription flow ADR-47 MVP]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR47, NFR25]
- [Source: `CLAUDE.md` — API patterns, TanStack Router, migration rules]
- [Source: `8-1-subscription-event-types-and-entitlement-derivation.md` — webhook mapping table, file list]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented `GET /api/purchase/subscription-state` with `getSubscriptionState` use-case; domain helper `getSubscribedSinceForCurrentSubscription` for “Subscribed since” copy.
- Checkout slug centralized as `POLAR_CHECKOUT_SLUG_SUBSCRIPTION`; Me + weekly letter use subscription embed; post-checkout invalidates subscription query and polls up to ~30s for webhook latency.
- Added Polar `portal({ returnUrl })` to Better Auth; `openPolarCustomerPortal` uses cookie `fetch` to `/api/auth/customer/portal` (Better Auth route, outside HttpApiClient).
- `SubscriptionValueSummary`, Me `MePageSections` branching, weekly letter subscriber block; route tests mock `useSubscriptionState`.
- `pnpm turbo typecheck` (front) and `apps/front` full vitest suite passed.
- Round 2 code review: `parsePortalUrlPayload` guards non-object JSON; `apps/front/src/lib/__tests__/polar-customer-portal.test.ts`; Me + weekly letter subscription error states include **Try again** → `refetch()`.

### File List

- `apps/api/src/handlers/purchase.ts`
- `apps/api/src/use-cases/get-subscription-state.use-case.ts`
- `apps/api/src/use-cases/__tests__/get-subscription-state.use-case.test.ts`
- `apps/front/src/components/me/SubscriptionPitchSection.tsx`
- `apps/front/src/components/me/SubscriptionValueSummary.tsx`
- `apps/front/src/components/me/__tests__/SubscriptionPitchSection.test.tsx`
- `apps/front/src/components/today/WeeklyLetterReadingView.tsx`
- `apps/front/src/components/today/__tests__/WeeklyLetterReadingView.test.tsx`
- `apps/front/src/hooks/use-subscription-state.ts`
- `apps/front/src/lib/polar-checkout.ts`
- `apps/front/src/lib/polar-customer-portal.ts`
- `apps/front/src/lib/__tests__/polar-customer-portal.test.ts`
- `apps/front/src/routes/me/index.tsx`
- `apps/front/src/routes/-three-space-routes.test.tsx`
- `packages/contracts/src/http/groups/purchase.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/utils/derive-capabilities.ts`
- `packages/domain/src/utils/index.ts`
- `packages/domain/src/utils/__tests__/derive-capabilities.test.ts`
- `packages/infrastructure/src/context/better-auth.ts`
- `_bmad-output/implementation-artifacts/8-2-subscription-checkout-flow.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- **2026-04-16:** Story context generated (create-story workflow).
- **2026-04-16:** Story 8.2 implemented — subscription checkout UX, subscription-state API, portal plugin, tests; status **review**.
