# Story 8.3: Conversation Extension Activation

Status: done



## Story

As a subscriber,
I want to extend my conversation with Nerin by 15 more exchanges,
so that I can deepen my assessment and get a richer portrait.

## Acceptance Criteria

1. **Re-enable the use-case (remove MVP gate):** `activateConversationExtension` in `apps/api/src/use-cases/activate-conversation-extension.use-case.ts` no longer fails immediately with `FeatureUnavailable`. The dormant implementation (`activateConversationExtensionWhenEnabled`, lines 68–128) becomes the real path after entitlement checks.
2. **Subscription entitlement gate (product scope):** **Conversation extension is part of the subscription feature** — the only capability gate is subscription entitlement: `isEntitledTo(events, "conversation_extension")` via `PurchaseEventRepository.getEventsByUserId` (same as Story 8.1 / `get-subscription-state.use-case.ts`). **No separate “extension feature” flag** beyond subscription. If not entitled, fail with a new `**SubscriptionRequired`** (or equivalent name) tagged error — **confirmed** — mapped to **403** on `POST` `/conversation/activate-extension` (do **not** reuse `FeatureUnavailable` / 409 for this).
3. **Session fork (unchanged semantics):** Eligible parent is still `findCompletedSessionWithoutChild(userId)`; child is still `createExtensionSession(userId, parentSession.id)` with greeting + opening question loop — preserve idempotency notes in the file header (no duplicate child for same parent).
4. **Director / pipeline:** No separate “credit” purchase path. Extension sessions already run through the Director pipeline with parent context (Stories 36-2+). Do **not** reintroduce `extended_conversation_unlocked` webhook activation for MVP subscription flow.
5. **Completion & results:** When the extension session reaches finalization and `generateResults` runs, combined evidence for authenticated extension sessions is already handled (Story 36-3). Verify end-to-end: new `assessment_results` for the extension session reflect combined evidence; `isLatestVersion` behavior remains correct for portraits and relationship analyses.
6. **Bundled portrait on first completed extension (FR23):** On **first** successful completion of an **extension** session (subscription path), enqueue `PortraitJobQueue.offer` so the portrait worker runs `generateFullPortrait` for the **extension session’s** `sessionId` at no extra charge. **Detection:** treat as “first extension completion” when, **before** marking the current session `completed`, the user has **zero** other `completed` sessions with `parentConversationId` set. **Subsequent** extension completions must **not** auto-queue (post-MVP per ADR-11 / FR23a — out of scope).
7. **Portrait “versioning” (derive-at-read only):** **Do not** add or mutate a “replaces portrait” FK on `portraits` or elsewhere. **Derive-at-read** already picks the **latest** portrait/result for the user (`getLatestByUserId` / `isLatestVersion` — Story 36-3). The bundled job only inserts a new portrait row for the **new** `assessment_result_id`; the prior portrait remains linked to its older result and shows as “previous version” in UI. `**PortraitJob` stays `{ sessionId, userId }`** unless you add optional logging fields — **no** requirement to thread `replacesPortraitId` through the queue for MVP.
8. **Idempotency for portrait enqueue:** Follow the **same spirit as first portrait generation** — the Polar `portrait_unlocked` path calls `offerPortraitJob` once per paid unlock; here, **only enqueue when transitioning the extension session to completed** and only if the “first extension completion” predicate holds, and rely on existing `**generateResults` staged idempotency** (if session/result already `completed`, return early — **no second offer**). If needed, add a narrow guard (e.g. only offer when moving into `completed` from `finalizing`, matching existing lock/result-stage patterns).
9. **HTTP contract:** Register `**SubscriptionRequired`** on `POST` `activateExtension` in `packages/contracts/src/http/groups/conversation.ts` with **403**. Remove or stop using `**FeatureUnavailable`** on this endpoint for “not subscribed” (that error was for the old MVP-disabled behavior). Re-export from `packages/contracts`. Ensure `ConversationGroupLive` does not remap domain errors incorrectly ([Source: `CLAUDE.md`]).
10. **Frontend — extension CTA (Me + results) + auth:** **Anonymous extension flows are out of scope** — assume **authenticated** users only; **auth-gate** any route that starts or continues extension (same pattern as other `/chat` / Me flows: `beforeLoad` + `getSession()`). **Product gate for showing the subscriber extension affordances:** `useSubscriptionState` → `**isEntitledToConversationExtension` only** (conversation extension **is** the subscription depth feature — no second feature toggle). Server-side, `findCompletedSessionWithoutChild` still determines whether activation succeeds (`SessionNotFound` if nothing to extend); the client may show the CTA whenever subscribed and handle `SessionNotFound` with a short message, or hide the button if the app already has session summary data showing no completed baseline — **no new eligibility micro-endpoint required** for MVP.
  **Proposed copy & placement (MVP):**
  - **Me — `SubscriptionValueSummary`:** Add a primary action **“Continue with Nerin”** with supporting line **“+15 new exchanges”** (Nerin-voiced, calm). Place it below the subscription copy and above **Manage subscription** (secondary outline). `data-testid="subscription-extend-conversation-cta"`.
  - **Results — `ProfileView` (or compact strip under `ArchetypeHeroSection`):** Short headline **“Go deeper with Nerin”**, body **“Pick up where you left off — 15 more exchanges, one continuing thread.”**, button **“Continue conversation”**. `data-testid="results-extend-conversation-cta"`. Only render when `isEntitledToConversationExtension` is **true** **and** this page is showing the user’s **latest** assessment result — i.e. `**isLatestVersion === true`** on the loaded `getResults` payload (Story 36-3). **Do not** show the strip on deep links to an older session’s results (avoids implying they can “continue” from a stale snapshot).
    **Flow:** `makeApiClient` + `Effect.runPromise` → `client.conversation.activateExtension({})` → on success `useNavigate` to `/chat` with new `sessionId`. No raw `fetch`.
    **Double-submit:** Disable both extend CTAs (Me + results) while the `activateExtension` mutation is **pending** (`isPending` / `isLoading`), and optionally show a subtle busy state — **confirmed**.
11. **Tests:** Update `apps/api/src/use-cases/__tests__/activate-conversation-extension.use-case.test.ts` — entitlement true → session creation path; entitlement false → `SubscriptionRequired`. Add tests for `generateResults` portrait-queue branch: **exactly one** offer on first extension completion. Frontend: Me CTA when subscribed; results CTA when subscribed **and** `isLatestVersion`; mutation disables buttons while pending; auth-gated routes. `pnpm test:run` passes.

## Tasks / Subtasks

- [x] **Task 1: Domain error + contracts** (AC: #2, #9)
  - [x] 1.1 Add `SubscriptionRequired` to `packages/domain/src/errors/http.errors.ts`; export via `packages/domain` and `packages/contracts`.
  - [x] 1.2 On `activateExtension`: `.addError(SubscriptionRequired, { status: 403 })`; removed `FeatureUnavailable` from this endpoint.
- [x] **Task 2: Activate use-case** (AC: #1–#4)
  - [x] 2.1 Add `PurchaseEventRepository`; call `isEntitledTo(..., "conversation_extension")` after loading events.
  - [x] 2.2 Replace MVP stub with `createExtensionSessionAndGreetings` after entitlement passes.
  - [x] 2.3 Contract error registration sufficient for HttpApiBuilder (no handler remapping).
- [x] **Task 3: Portrait queue + generateResults** (AC: #5–#8)
  - [x] 3.1 `PortraitJob` unchanged `{ sessionId, userId }`.
  - [x] 3.2 `countCompletedExtensionSessionsExcluding` + `PortraitJobQueue.offer` on first extension completion in `generate-results.use-case.ts`.
  - [x] 3.3 Idempotent via existing session/result completed early returns.
- [x] **Task 4: Frontend** (AC: #10)
  - [x] 4.1 `use-activate-extension.ts` + toasts for 403/404 + `isPending` disables CTAs.
  - [x] 4.2 `SubscriptionValueSummary` Me CTA + testids.
  - [x] 4.3 Results strip + `ProfileView` `conversationExtensionStrip`; gates `isLatestVersion` + entitlement.
  - [x] 4.4 Results `/results` and `/chat` already auth-gated via existing `beforeLoad` / chat route patterns.
- [x] **Task 5: QA** (AC: #11)
  - [x] 5.1 API + front tests updated; `pnpm test:run` green.

### Review Findings

- [x] [Review][Patch] Concurrent extension activation can create duplicate child sessions [`apps/api/src/use-cases/activate-conversation-extension.use-case.ts:59`]
- [x] [Review][Patch] Extension creation is not atomic, so a failed greeting write can strand an unusable child session [`apps/api/src/use-cases/activate-conversation-extension.use-case.ts:71`]
- [x] [Review][Patch] First-extension portrait enqueue can fire twice under concurrent completions [`apps/api/src/use-cases/generate-results.use-case.ts:219`]
- [x] [Review][Patch] Frontend tests miss the required extension CTA scenarios for latest-version visibility and pending-disabled states [`apps/front/src/routes/-results-session-route.test.tsx:102`]

## Change Log

- **2026-04-16:** Implemented Story 8.3 — subscription-gated extension activation, first-extension portrait queue, Me + results CTAs, `SubscriptionRequired` (403), `conversation_type` set to `extension` on insert.
- **2026-04-16:** Code review follow-up — per-user Redis lock for activation, atomic extension insert + greetings (DB transaction), per-user lock during extension finalization for bundled portrait, `conversation_type = extension` in first-extension count, results/Me tests for CTA gates and pending state, `ConcurrentMessageError` (409) on `activateExtension`.

## Dev Notes

### Architecture compliance

- **Hexagonal / Effect:** Entitlement and session rules stay in the use-case; repositories only persist/read ([Source: `CLAUDE.md`]).
- **Derive-at-read:** Subscription status and entitlements from `purchase_events` only — no new `subscriptions` table.
- **ADR-11 / ADR-47:** Extension +15 exchanges; first extension bundles portrait regen; unlimited extensions for subscribers (FR49) — activation is subscription-scoped, not per-checkout event ([Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-9, ADR-11, ADR-47]).
- **Frontend:** Typed `HttpApiClient` only; TanStack Router `useNavigate` after activation success; forms N/A.

### Conflict resolution (older story docs)

- **Story 36-3** mentioned “repurchase” portrait CTA for extension results. **MVP subscription (FR23)** bundles the **first** extension portrait — do not show a paid repurchase CTA for that path. Subsequent extensions: no bundled regen in MVP (ADR-11).

### Previous story intelligence (Story 8.2)

- Subscription state for UI: `useSubscriptionState` + `GET` purchase/subscription-state; polling used post-checkout with `staleTime: 0` during poll; portal and Me/weekly letter branching patterns ([Source: `8-2-subscription-checkout-flow.md` — Dev Agent Record, review fixes]).
- `SubscriptionValueSummary` intentionally deferred extension CTAs — wire them here without breaking manage-subscription behavior.

### File structure (expected touchpoints)


| Area                          | Path                                                                                                                                                                                                                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use-case                      | `apps/api/src/use-cases/activate-conversation-extension.use-case.ts`                                                                                                                                                                                                                            |
| Generate results              | `apps/api/src/use-cases/generate-results.use-case.ts`                                                                                                                                                                                                                                           |
| Portrait queue (enqueue only) | `apps/api/src/use-cases/generate-results.use-case.ts` → existing `PortraitJobQueue` / worker (`portrait-job-queue.ts`, `portrait-generation.worker.ts`, `generate-full-portrait.use-case.ts`); reference `**offerPortraitJob`** pattern in `packages/infrastructure/src/context/better-auth.ts` |
| Contracts                     | `packages/contracts/src/http/groups/conversation.ts`, `packages/contracts/src/errors.ts`                                                                                                                                                                                                        |
| Handler                       | `apps/api/src/handlers/conversation.ts`                                                                                                                                                                                                                                                         |
| Frontend                      | `apps/front/src/components/me/SubscriptionValueSummary.tsx`, `apps/front/src/routes/me/index.tsx`, `apps/front/src/routes/results/$conversationSessionId.tsx` or `ProfileView.tsx`, new hook under `apps/front/src/hooks/`                                                                      |
| Tests                         | `apps/api/src/use-cases/__tests__/activate-conversation-extension.use-case.test.ts`, new tests as needed                                                                                                                                                                                        |


### Testing standards

- Vitest; `@effect/vitest` patterns; `vi.mock` order per `CLAUDE.md` where used.
- Preserve and extend `data-testid` attributes.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 8, Story 8.3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-11 Conversation Extension, ADR-47 subscription, portrait queue notes]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR10, FR23, FR25, FR47, FR49]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — subscription + extension copy]
- [Source: `8-1-subscription-event-types-and-entitlement-derivation.md` — `isEntitledTo`]
- [Source: `8-2-subscription-checkout-flow.md` — subscription UI/API patterns]
- [Source: `CLAUDE.md` — API client, navigation, architecture rules]

## Dev Agent Record

### Agent Model Used

Composer (Cursor agent)

### Debug Log References

### Completion Notes List

- Implemented `SubscriptionRequired` + 403 on `POST /conversation/activate-extension`; removed `FeatureUnavailable` from that endpoint contract.
- `activateConversationExtension` loads purchase events, gates with `isEntitledTo`, then creates extension session; Drizzle sets `conversationType: "extension"`.
- `generateResults` offers `PortraitJobQueue` once for first completed extension (`countCompletedExtensionSessionsExcluding`).
- Frontend: `useActivateExtension`, `SubscriptionValueSummary` + results extension strip with `isLatestVersion` gate; tests/mocks updated.

### File List

- `apps/api/src/use-cases/activate-conversation-extension.use-case.ts`
- `apps/api/src/use-cases/__tests__/activate-conversation-extension.use-case.test.ts`
- `apps/api/src/use-cases/generate-results.use-case.ts`
- `apps/api/src/use-cases/__tests__/generate-results.use-case.test.ts`
- `packages/domain/src/errors/http.errors.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/repositories/conversation.repository.ts`
- `packages/contracts/src/errors.ts`
- `packages/contracts/src/http/groups/conversation.ts`
- `packages/infrastructure/src/repositories/conversation.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/conversation.drizzle.repository.ts`
- `apps/front/src/hooks/use-activate-extension.ts`
- `apps/front/src/components/me/SubscriptionValueSummary.tsx`
- `apps/front/src/components/results/ProfileView.tsx`
- `apps/front/src/routes/results/$conversationSessionId.tsx`
- `apps/front/src/routes/-three-space-routes.test.tsx`
- `apps/front/src/routes/-results-session-route.test.tsx`
- `_bmad-output/implementation-artifacts/8-3-conversation-extension-activation.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings

_BMAD code review (2026-04-16). Diff baseline: `master` vs working tree for Story 8.3 file list (~349 insertions / 76 deletions across 15 paths). Parallel review layers were synthesized inline (Blind Hunter, Edge Case Hunter, Acceptance Auditor); no separate subagent transcripts._

- [x] [Review][Patch] Add Vitest proving bundled portrait job is **not** queued when `countCompletedExtensionSessionsExcluding` returns `> 0` (subsequent extension completion; AC #6 / AC #11 negative path) [`apps/api/src/use-cases/__tests__/generate-results.use-case.test.ts`]

- [x] [Review][Defer] Results `view=portrait` full-screen reading path does not render the extension strip; only the `ProfileView` grid path shows the CTA. Spec places the strip on profile results; immersive portrait is unchanged — optional UX follow-up if product wants extend affordance from portrait mode [`apps/front/src/routes/results/$conversationSessionId.tsx` ~539–554 vs ~571–588] — deferred, not a spec violation

