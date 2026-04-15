# Story 3.5: Subscription Pitch Section

Status: review

## Story

As a free user on my Me page,

I want to see a Nerin-voiced pitch for subscription,

So that I understand the value of continuing my conversation with Nerin.

## Acceptance Criteria

1. **Given** the user is a **free** user (no active conversation extension / not in the “subscribed” capability state) **When** the Subscription section on `/me` renders **Then** a `**SubscriptionPitchSection`** displays with Nerin-voiced copy: **"Continue your conversation with Nerin — +15 exchanges + a new portrait"** (exact product string; line breaks allowed for layout).
2. **And** a **single primary CTA** opens the **Polar embedded checkout** for the **extended conversation** product (see technical notes for slug and helper).
3. **And** the section does **not** show **pricing**, **€ amounts**, **feature comparison tables**, or marketing grids.
4. **Given** the user **has** an active **extended conversation** entitlement (`hasExtendedConversation === true` from derived capabilities) **When** the Subscription section renders **Then** a `**SubscriptionValueSummary`** displays instead of the pitch, summarizing **current perks** (extended conversation unlocked; optionally relationship **available credits** if useful and already on the same capability payload).
5. **And** **“Billing status”** is represented **honestly from available data**: at minimum, confirm active extension / perks from capabilities. Do **not** fabricate renewal dates or payment instrument details unless a **documented API** exists in-repo by implementation time (see Dev Notes if only capabilities exist).
6. **And** subscription-related state is derived from **purchase events** via the same `**deriveCapabilities`** logic as the backend (`PurchaseEventRepository.getCapabilities` → `deriveCapabilities`) — **no** new stored aggregates.

## Tasks / Subtasks

- Task 1 — Expose capabilities to the frontend (AC: 1, 4, 6)
  - 1.1 **Contract + API:** Extend `**GetCreditsResponse`** in `[packages/contracts/src/http/groups/purchase.ts](packages/contracts/src/http/groups/purchase.ts)` to include at least `**hasExtendedConversation`** and `**hasFullPortrait**` (both already on `UserCapabilities` in domain). Keep backward compatibility in mind for any other consumers.
  - 1.2 **Use case:** Update `[apps/api/src/use-cases/get-credits.use-case.ts](apps/api/src/use-cases/get-credits.use-case.ts)` to return these fields from the existing `purchaseRepo.getCapabilities(userId)` result (already uses `deriveCapabilities` internally via repository).
  - 1.3 **Handler:** Ensure `[apps/api/src/handlers/purchase.ts](apps/api/src/handlers/purchase.ts)` `getCredits` path returns the expanded payload (no business logic in handler beyond auth guard).
  - 1.4 **Frontend hook:** Add a small TanStack Query hook (e.g. `usePurchaseCapabilities` or `useGetCredits`) in `apps/front/src/hooks/` calling `**makeApiClient` → `client.purchase.getCredits`** — **no raw `fetch`** (`[apps/front/src/lib/api-client.ts](apps/front/src/lib/api-client.ts)`).
- Task 2 — Me page UI: pitch vs value (AC: 1–5)
  - 2.1 Add `**SubscriptionPitchSection**` and `**SubscriptionValueSummary**` under `[apps/front/src/components/me/](apps/front/src/components/me/)` (names may be adjusted if you merge into one file with two exports).
  - 2.2 Replace the placeholder copy in `[apps/front/src/routes/me/index.tsx](apps/front/src/routes/me/index.tsx)` inside `**MePageSection**` for `data-testid="me-section-subscription"` with the new section(s), passing `**useGetResults(sessionId)**` only where portrait/session copy is needed; **capabilities come from the purchase hook**, not a second results fetch.
  - 2.3 **Free path:** Nerin-voiced body copy + **one** CTA button. On click, call `[createThemedCheckoutEmbed](apps/front/src/lib/polar-checkout.ts)` with slug `**"extended-conversation"`** and `useTheme().userTheme` (see `[packages/infrastructure/src/context/better-auth.ts](packages/infrastructure/src/context/better-auth.ts)` checkout `products` — slug must match).
  - 2.4 **Subscribed path:** Replace pitch with `**SubscriptionValueSummary`**: state **perks** from `hasExtendedConversation` / `availableCredits` / `hasFullPortrait` as appropriate; **warm, minimal** Nerin tone; no pricing.
  - 2.5 **Loading / error:** If capabilities query is loading, show a compact skeleton or muted line inside the section; on error, non-blocking message + retry consistent with other Me sections.
- Task 3 — Accessibility & test IDs (AC: all)
  - 3.1 Preserve `**data-testid="me-section-subscription"`** on the section wrapper; add **new** stable ids for inner surfaces, e.g. `data-testid="subscription-pitch"` / `data-testid="subscription-value-summary"` / `data-testid="subscription-checkout-cta"` — **never remove or rename** existing ids (`[CLAUDE.md](CLAUDE.md)`).
  - 3.2 CTA must be keyboard-focusable with visible focus; section has a sensible `aria-label` via `MePageSection` / heading pattern.
- Task 4 — Tests
  - 4.1 Component tests under `[apps/front/src/components/me/__tests__/](apps/front/src/components/me/__tests__/)` (not under `routes/me/` — TanStack Router file routing).
  - 4.2 Cover: free user → pitch + CTA present; extended user → value summary, no pitch; mock purchase hook + optional checkout spy.
  - 4.3 Extend or add API/use-case tests for expanded `**getCredits`** response if not already covered.
  - 4.4 Run `pnpm typecheck` and targeted `pnpm --filter front exec vitest run …`.

## Dev Notes

### Epic & FR context

- **Epic 3** (`[_bmad-output/planning-artifacts/epics.md](_bmad-output/planning-artifacts/epics.md)`): Me page **Subscription** slice — conversion pitch without hard-sell pricing; aligns with **Epic 8** monetization later, but this story **ships the Me surface** now.

### Terminology mapping (product vs code)

- Epic language **“subscription”** for this pitch maps to the **extended conversation** Polar product and `**extended_conversation_unlocked`** / refund events → `**hasExtendedConversation`** in `[packages/domain/src/utils/derive-capabilities.ts](packages/domain/src/utils/derive-capabilities.ts)`.
- **“Free user”** for this UI means `**hasExtendedConversation === false`** (subject to refund rules already in `deriveCapabilities`).

### Critical guardrails


| Rule                       | Detail                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| API client                 | `makeApiClient` + `@workspace/contracts` only                                                                               |
| Navigation                 | TanStack Router `**<Link>`** for in-app routes; checkout is embed overlay, not `window.location`                            |
| No business logic in route | Orchestration in components/hooks; use-cases own derivation                                                                 |
| `data-testid`              | Do not remove/rename e2e selectors on shared wrappers                                                                       |
| UX                         | No price tables; single CTA; Nerin warmth consistent with Me page / letter styling (`[docs/FRONTEND.md](docs/FRONTEND.md)`) |


### Architecture compliance

- **Derive-at-read:** Capabilities from events via existing repository + `deriveCapabilities` — **no** new capability columns.
- **Handlers:** Purchase handler stays thin; logic stays in `getCredits` use-case and domain.

### Library / framework requirements

- **Polar:** `@polar-sh/checkout/embed` via existing `[createThemedCheckoutEmbed](apps/front/src/lib/polar-checkout.ts)`; **Better Auth** `authClient.checkout` with slug `**extended-conversation`**.
- **Theme:** `@workspace/ui/hooks/use-theme` for embed theme.
- **TanStack Query:** Single query key for purchase capabilities; invalidate after successful `verifyPurchase` flow if user returns from checkout with query param (optional polish — align with any existing post-checkout patterns).

### File structure (expected touchpoints)

```
packages/contracts/src/http/groups/purchase.ts          # GetCreditsResponse schema
packages/domain/                                        # types already exist
apps/api/src/use-cases/get-credits.use-case.ts
apps/api/src/handlers/purchase.ts
apps/api/src/use-cases/__tests__/get-credits.use-case.test.ts  # update expectations

apps/front/src/hooks/                                   # NEW: usePurchaseCapabilities (or similar)
apps/front/src/components/me/
  SubscriptionPitchSection.tsx                          # NEW
  SubscriptionValueSummary.tsx                        # NEW
  __tests__/…                                         # NEW
apps/front/src/routes/me/index.tsx                    # Wire section
apps/front/src/lib/polar-checkout.ts                  # REUSE (no fork)
```

### Billing status (MVP honesty)

- `**UserCapabilities**` does not include renewal dates or card last-four. For AC “billing status,” ship **capability-grounded copy** (e.g. “Your conversation extension is active”) plus optional **Settings** link only if product-approved. **Do not** mock invoice data. Deeper Polar **customer portal** links belong in **Epic 8** unless already exposed by a typed client in-repo.

### Testing requirements

- Vitest + Testing Library; follow `vi.mock` import order from `[CLAUDE.md](CLAUDE.md)` if mocking modules.
- Contract change: run `**pnpm test:run`** or scoped package tests for contracts if present.

### Previous story intelligence (3.4)

From `[_bmad-output/implementation-artifacts/3-4-your-public-face-section.md](_bmad-output/implementation-artifacts/3-4-your-public-face-section.md)`:

- Me page uses `**useGetResults(sessionId)`** as the single results source; **do not duplicate** results fetches for this story.
- **Sonner**, **share flows**, and `**MePageSection`** patterns are established — subscription section should match spacing/typography of **Your Public Face** / **Identity Hero** for visual cohesion.

### Git intelligence (recent)

Recent work touched Me page, share flow, and sprint metadata; implement against current `main` and rebase if needed. Public-face story established `components/me/` testing layout.

### Latest tech notes

- **Polar embed:** Keep `**embedOrigin: window.location.origin`** behavior inside `createThemedCheckoutEmbed`; do not bypass the helper without cause.
- **OptionalAuthMiddleware** on purchase group: ensure authenticated session for `/me` (route already requires auth).

### Project context reference

- `[CLAUDE.md](CLAUDE.md)` — HttpApiClient pattern, forms/navigation rules, `data-testid` policy.
- `[docs/FRONTEND.md](docs/FRONTEND.md)` — Me page styling patterns.

## Dev Agent Record

### Agent Model Used

*(filled by implementer)*

### Debug Log References

### Completion Notes List

### File List

### Change Log

- 2026-04-15: Story context file created (create-story workflow).

## Story completion status

- **Status:** review
- **Note:** All tasks complete. 844 tests pass, typecheck clean. Ready for code review.

