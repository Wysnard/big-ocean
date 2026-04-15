# Story 2.5: Return Seed & Notification Permission on First Me Page Visit

**Status:** done

**Story ID:** 2.5
**Created:** 2026-04-14
**Epic:** 2 - Post-Assessment Transition & Portrait Reading
**Epic Status:** in-progress

---

## Story

As a user visiting my full identity page for the first time after the portrait,
I want Nerin to invite me back tomorrow,
so that I'm motivated to return and start the daily check-in habit.

## Acceptance Criteria

1. **Return seed appears on the first full post-portrait identity visit**  
   Given the user leaves `PortraitReadingView` via "There's more to see →", when the first full post-portrait identity surface renders, then a `ReturnSeedSection` appears at the bottom of that page only on the first visit. In the current codebase, that host surface is still `"/results/$conversationSessionId"` even though the long-term architecture names this as the full results/Me page.

2. **The section uses Nerin-voiced copy, not system copy**  
   The section renders Nerin's message: `"Tomorrow, I'll ask how you're doing. Come check in with me."` and the permission request: `"I'd like to check in with you tomorrow. Mind if I send a quiet note?"` with warm styling that feels like part of the portrait/results world rather than a browser settings card.

3. **Permission is requested only after explicit user intent**  
   The section shows two clear actions: `Yes, send me a quiet note` and `Not right now`. The browser `Notification.requestPermission()` prompt is triggered only from the explicit accept click path, never on mount.

4. **Granted permission persists subscription and schedules the first prompt truthfully**  
   If notification permission is granted, the app immediately syncs the user's web-push subscription using the existing service-worker + account API path, and the backend persists a server-side schedule/intention for the first daily prompt on the next day at the MVP default time. This must survive refreshes and device changes; an in-memory or `localStorage` "scheduled" flag is insufficient.

5. **Decline and unsupported/error states remain graceful**  
   If the user declines, blocks, or the browser lacks notification support, the relationship still continues without lock-in. The section dismisses or shows calm inline fallback copy; it must not hard-block the page or loop the system prompt.

6. **First-visit state stays server-side and is aligned with the actual return-seed moment**  
   The first-visit flag remains server-side on the user account and is consumed by the return-seed flow itself, not by an unrelated `/me` mount side effect. The current eager `completeFirstVisit()` call on `/me` must no longer pre-empt the return-seed experience.

7. **Relevant tests cover the flow and no existing route behavior regresses**  
   Frontend tests cover first-visit rendering, subsequent-visit hiding, accept/decline paths, and the permission-trigger contract. Backend/use-case tests cover first-visit state reads/writes and the persisted scheduling path. Existing `/today` first-visit redirect behavior remains coherent.

## Tasks / Subtasks

- [x] Task 1: Normalize first-visit state around the return-seed moment (AC: 1, 6)
  - [x] Audit the current first-visit flow across `apps/front/src/routes/results/$conversationSessionId.tsx`, `apps/front/src/routes/me/index.tsx`, `apps/front/src/routes/today/index.tsx`, `apps/front/src/hooks/use-account.ts`, and the account use-cases.
  - [x] Reuse the existing server-side first-visit concept (`firstVisitCompleted`) rather than inventing a second parallel flag such as `hasVisitedMeOnce`.
  - [x] Remove or relocate the current unconditional `completeFirstVisit()` effect in `apps/front/src/routes/me/index.tsx`; it currently marks the visit complete before Story 2.5 ever renders.
  - [x] Ensure the first-visit flag is consumed by the real return-seed experience: the component can stay visible for the current page session, but subsequent visits must not show it again.

- [x] Task 2: Build the `ReturnSeedSection` component for the identity surface (AC: 1, 2, 3, 5)
  - [x] Create `apps/front/src/components/me/ReturnSeedSection.tsx` so the component lives with the future Me-page composition even if the current host is still the full results route.
  - [x] Add semantic structure and stable selectors: `role="region"`, labelled heading, `data-slot="return-seed-section"`, and stable `data-testid` values for the card and both actions.
  - [x] Render the exact Nerin-voiced copy from FR96/UX spec; do not introduce generic browser or product-marketing copy.
  - [x] Use existing design tokens/utilities from the results/Me surfaces. The card should feel like a continuation of the portrait/results reading flow, not a dashboard widget.
  - [x] Model local UI states explicitly (`idle`, `requesting`, `granted`, `declined`, `unsupported`, `error`) using data attributes where useful for styling and test targeting.

- [x] Task 3: Integrate the section into the current first full identity route without creating duplicate moments (AC: 1, 6)
  - [x] Render `ReturnSeedSection` at the bottom of `apps/front/src/routes/results/$conversationSessionId.tsx` on the first full post-portrait visit only.
  - [x] Keep the component placement compatible with the architecture's "full results/Me page" intent: current host is `/results/$conversationSessionId`, future home is `/me`.
  - [x] Do not render a second independent return-seed moment on `/me` while the `/results` route still owns the immediate post-portrait landing.
  - [x] Preserve the existing focused reading flow from Stories 2.1-2.4 and the current full results experience from `ProfileView`.

- [x] Task 4: Wire notification permission and push subscription reuse correctly (AC: 3, 4, 5)
  - [x] Refactor `apps/front/src/hooks/use-push-subscription-sync.ts` so its core subscription-sync logic can be triggered immediately after permission is granted. The current root-level effect only depends on auth state and will not rerun just because `Notification.permission` changed.
  - [x] Reuse the existing stack: service worker at `apps/front/public/push-sw.js`, `VITE_PUSH_VAPID_PUBLIC_KEY`, and the typed account endpoints in `packages/contracts/src/http/groups/account.ts`.
  - [x] On accept click, call `Notification.requestPermission()` directly from the button handler. If granted, persist the push subscription using the existing `/account/push-subscription` path; if denied/default, handle it as a graceful non-blocking outcome.
  - [x] Do not duplicate push-subscription serialization logic in multiple places if a shared helper can own it.

- [x] Task 5: Persist the first daily prompt schedule server-side (AC: 4)
  - [x] Add the minimal backend persistence needed so "scheduled for tomorrow" is true in a durable sense. A user-row timestamp or equivalent durable server-side field is acceptable; a client-only timer or `localStorage` flag is not.
  - [x] Add or extend the relevant account use-case/endpoint so the frontend can record that the first daily prompt should be sent the next day at the MVP default time after permission is granted.
  - [x] Keep this scope minimal: store the schedule/intention now, but do not build an unrelated general-purpose notification scheduler if the repo does not already have one.
  - [x] Reuse the existing account repository / handler pattern rather than building a new vertical slice in a different module.

- [x] Task 6: Add focused test coverage and verification (AC: 1-7)
  - [x] Add component tests for `ReturnSeedSection` under `apps/front/src/components/me/__tests__/`.
  - [x] Update `apps/front/src/routes/-results-session-route.test.tsx` to cover first-visit rendering, subsequent-visit hiding, and the accept/decline contract.
  - [x] Update `apps/front/src/routes/-three-space-routes.test.tsx` so `/today` redirection still aligns with the revised first-visit semantics.
  - [x] Extend `apps/api/src/use-cases/__tests__/first-visit.use-case.test.ts` (and related account tests if new scheduling behavior is added) to cover the persisted first-daily-prompt path.
  - [x] Run the relevant frontend test/typecheck/build commands plus the targeted API/use-case tests, or document clearly if any verification is deferred.

### Review Findings

- [x] [Review][Defer] Timezone handling for schedule timestamp — `getFirstDailyPromptSchedule` uses `setHours(19)` in the user's local timezone, serialized to UTC via `.toISOString()`, stored in a timezone-less `timestamp` column. Accepted for MVP: stored UTC instant captures user's intended local 7 PM; timezone-aware scheduling deferred to future notification scheduler story. [apps/front/src/components/me/ReturnSeedSection.tsx:7-12]
- [x] [Review][Patch] consumeFirstVisit retry loop with no backoff — fixed: no longer resets ref on failure, preventing unbounded retry loop [apps/front/src/routes/results/$conversationSessionId.tsx:298-314]
- [x] [Review][Patch] No server-side validation that scheduledFor is in the future — fixed: added future-date schema filter in IsoTimestampSchema [packages/contracts/src/http/groups/account.ts:24-34]
- [x] [Review][Patch] scheduleFirstDailyPrompt allows silent overwrite (no write-once guard) — fixed: added `isNull(firstDailyPromptScheduledFor)` WHERE guard in repo + mock [packages/infrastructure/src/repositories/user-account.drizzle.repository.ts:72]
- [x] [Review][Patch] IsoTimestampSchema accepts non-ISO date strings — fixed: added strict ISO 8601 UTC regex before Date.parse [packages/contracts/src/http/groups/account.ts:24-34]
- [x] [Review][Patch] Mock setMockFirstVisitCompleted missing firstDailyPromptScheduledFor field — fixed: added `firstDailyPromptScheduledFor: null` to fallback creation [packages/infrastructure/src/repositories/__mocks__/user-account.drizzle.repository.ts:35]
- [x] [Review][Defer] /today route beforeLoad has no error handling for fetchFirstVisitState failure — network failure blocks route navigation entirely; pre-existing, not introduced by this change [apps/front/src/routes/today/index.tsx]
- [x] [Review][Patch] `scheduleFirstDailyPrompt` maps `wasUpdated === false` to `AccountNotFound` — fixed: repository returns `ScheduleFirstDailyPromptOutcome` (`inserted` | `already_scheduled` | `user_not_found`); use-case succeeds with stored `scheduledFor` when already scheduled. [apps/api/src/use-cases/schedule-first-daily-prompt.use-case.ts] [packages/infrastructure/src/repositories/user-account.drizzle.repository.ts] [packages/domain/src/repositories/user-account.repository.ts]
- [x] [Review][Defer] `fetchFirstVisitState` failure on the results session route sets `firstVisitCompleted` to true — hides Return Seed on network/API error (fail-closed); user must refresh to retry; same tradeoff class as `/today` gate. [apps/front/src/routes/results/$conversationSessionId.tsx:223-226]

## Dev Notes

### Source Alignment: Results vs Me

There is a real document/codebase mismatch here:

- `epics.md` still phrases Story 2.5 as the first full `"/results/$conversationSessionId"` visit.
- The PRD, architecture, and UX spec all describe the same emotional moment as the first full **results/Me** visit and eventually place the component on `/me`.
- The current app still routes `"There's more to see →"` to `"/results/$conversationSessionId"` (Story 2.3), and `/me` is only a scaffold from Story 3.1.

**Implementation guidance:** treat the product intent as "the first full identity page after the portrait," and implement it on the concrete host that exists today: `apps/front/src/routes/results/$conversationSessionId.tsx`. Put the reusable component in `apps/front/src/components/me/` so it can move to `/me` later without a rewrite.

### Existing Code to Reuse

| What | Where | Why it matters |
|------|-------|----------------|
| First-visit state API | `apps/front/src/hooks/use-account.ts`, `apps/api/src/use-cases/get-first-visit-state.use-case.ts`, `apps/api/src/use-cases/complete-first-visit.use-case.ts` | Story 3.1 already introduced server-side first-visit plumbing. Reuse it; do not create a second client-only flag. |
| User persistence | `packages/domain/src/repositories/user-account.repository.ts`, `packages/infrastructure/src/repositories/user-account.drizzle.repository.ts`, `packages/infrastructure/src/db/drizzle/schema.ts` | `user.firstVisitCompleted` already exists and is the current server-side flag. |
| Full results host surface | `apps/front/src/routes/results/$conversationSessionId.tsx`, `apps/front/src/components/results/ProfileView.tsx` | This is where the user actually lands today after Story 2.3. |
| `/me` scaffold | `apps/front/src/routes/me/index.tsx` | Important because it currently marks first visit complete too early. |
| `/today` gate | `apps/front/src/routes/today/index.tsx` | Must remain coherent after changing when the first-visit flag flips. |
| Push subscription sync | `apps/front/src/hooks/use-push-subscription-sync.ts`, `apps/front/public/push-sw.js` | Existing push setup exists, but the sync logic is currently mount/auth-driven, not accept-click-driven. |
| Account push endpoints | `packages/contracts/src/http/groups/account.ts`, `apps/api/src/handlers/account.ts` | Already support saving/removing push subscriptions. Reuse these contracts. |

### Critical Existing Gap

`apps/front/src/routes/me/index.tsx` currently calls `completeFirstVisit()` inside a mount effect. That means the boolean can be consumed before the Story 2.5 experience is ever shown. This is the biggest regression risk in the current repo for this story.

The fix is not "add another flag." The fix is to align the existing server-side first-visit concept with the actual return-seed moment.

### Notification / Push Guardrails

- **Do not trigger browser permission on mount.** The browser prompt must come only from the explicit accept button click.
- **Do not assume `usePushSubscriptionSync()` will save the subscription after permission is newly granted.** Right now it runs off auth state and an internal session-storage key; a permission change alone will not rerun it.
- **Do not duplicate push-subscription logic.** Extract/reuse the existing service-worker + VAPID + account-client path instead of re-implementing subscription persistence inside the component.
- **Do not claim "scheduled for tomorrow" unless the schedule exists server-side.** A local timer, toast, or `sessionStorage` marker is not enough.

### Suggested File Targets

- `apps/front/src/components/me/ReturnSeedSection.tsx` (new)
- `apps/front/src/components/me/__tests__/ReturnSeedSection.test.tsx` (new)
- `apps/front/src/routes/results/$conversationSessionId.tsx`
- `apps/front/src/routes/me/index.tsx`
- `apps/front/src/routes/-results-session-route.test.tsx`
- `apps/front/src/routes/-three-space-routes.test.tsx`
- `apps/front/src/hooks/use-account.ts`
- `apps/front/src/hooks/use-push-subscription-sync.ts` or a new shared helper beside it
- `packages/contracts/src/http/groups/account.ts`
- `apps/api/src/handlers/account.ts`
- `apps/api/src/use-cases/get-first-visit-state.use-case.ts`
- `apps/api/src/use-cases/complete-first-visit.use-case.ts`
- `apps/api/src/use-cases/__tests__/first-visit.use-case.test.ts`
- `packages/domain/src/repositories/user-account.repository.ts`
- `packages/infrastructure/src/repositories/user-account.drizzle.repository.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts` (only if durable scheduling requires a new persisted field)

### Testing Notes

- Keep tests focused on observable behavior:
  - first full visit shows the section
  - later visits do not
  - accept triggers permission request path
  - decline/unsupported states stay graceful
  - `/today` still redirects correctly based on the server-side flag
- Prefer mocking `Notification.requestPermission` and the extracted push-sync helper rather than trying to exercise the real browser subscription APIs in component tests.
- Do not place tests directly under routed folders that TanStack Router will treat as routes.

### Previous Story Intelligence

**Story 2.3** established the current route contract:
- `"There's more to see →"` still targets `"/results/$conversationSessionId"`, explicitly noted as "will become `/me` in future."
- That means Story 2.5 cannot assume the post-portrait user is already landing on `/me`.

**Story 3.1** introduced the current first-visit plumbing:
- `/me` resolves the latest completed session and renders the seven-section sanctuary scaffold.
- It also added the current `completeFirstVisit()` mount effect, which is now the main thing this story must correct.
- Its state table already anticipated Story 2.5 as "Assessment complete, first visit -> Full page + ReturnSeedSection."

### Git Intelligence

Recent commits show the repo has just finished the Me-page scaffold and related identity components:

- `28655d0e feat(front): Story 3.3 — GeometricSignature component (#227)`
- `fad1853c feat(api): Story 4.1 — daily check-in data model and API (#226)`
- `77913f17 feat(front): Story 3.2 — IdentityHeroSection and ThreeSpaceLayout extraction`

This means Story 2.5 should be careful not to fork new page architecture. The correct move is to connect the existing results/me surfaces and first-visit plumbing, not build another parallel identity route.

### What Not To Do

- Do not add a localStorage-only `hasVisitedMeOnce` flag.
- Do not leave the eager `/me` `completeFirstVisit()` mount effect in place and add another first-visit mechanism beside it.
- Do not request notification permission automatically on load.
- Do not add generic copy such as "Enable notifications for the best experience."
- Do not fake "scheduled for tomorrow" with a local timer, toast, or immediate push queue write that has no delayed-delivery semantics.
- Do not move the post-portrait flow wholesale to `/me` unless the full identity content parity problem is solved inside this story.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 2] — Story 2.5 definition and original acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md#FR96] — Return seed + notification permission requirement
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-46] — Post-assessment focused reading transition and return-seed placement
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#ReturnSeedSection] — Component-level copy, behavior, and first-visit semantics
- [Source: _bmad-output/implementation-artifacts/2-3-portrait-reading-copy-and-end-of-letter-transition.md] — Current route target remains `/results/$conversationSessionId`
- [Source: _bmad-output/implementation-artifacts/3-1-me-page-route-and-section-layout.md] — Existing first-visit assumptions and `/me` scaffold
- [Source: apps/front/src/routes/results/$conversationSessionId.tsx] — Current full results host
- [Source: apps/front/src/routes/me/index.tsx] — Current eager first-visit completion behavior
- [Source: apps/front/src/routes/today/index.tsx] — Redirect contract based on first-visit state
- [Source: apps/front/src/hooks/use-account.ts] — Existing account hooks
- [Source: apps/front/src/hooks/use-push-subscription-sync.ts] — Existing push-subscription sync path
- [Source: packages/contracts/src/http/groups/account.ts] — Existing typed account endpoints for first-visit and push-subscription operations

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `pnpm exec biome check apps/front/src/components/me/ReturnSeedSection.tsx apps/front/src/components/me/__tests__/ReturnSeedSection.test.tsx apps/front/src/hooks/use-account.ts apps/front/src/hooks/use-push-subscription-sync.ts apps/front/src/routes/me/index.tsx apps/front/src/routes/results/$conversationSessionId.tsx apps/front/src/routes/-results-session-route.test.tsx apps/front/src/routes/-three-space-routes.test.tsx packages/domain/src/repositories/user-account.repository.ts packages/infrastructure/src/repositories/user-account.drizzle.repository.ts packages/infrastructure/src/repositories/__mocks__/user-account.drizzle.repository.ts packages/infrastructure/src/db/drizzle/schema.ts packages/contracts/src/http/groups/account.ts apps/api/src/handlers/account.ts apps/api/src/use-cases/schedule-first-daily-prompt.use-case.ts apps/api/src/use-cases/index.ts apps/api/src/use-cases/__tests__/first-visit.use-case.test.ts`
- `cd apps/front && pnpm test -- src/components/me/__tests__/ReturnSeedSection.test.tsx src/routes/-results-session-route.test.tsx src/routes/-three-space-routes.test.tsx`
- `cd apps/api && pnpm test -- src/use-cases/__tests__/first-visit.use-case.test.ts`
- `cd apps/api && pnpm typecheck`
- `cd apps/front && pnpm typecheck` (currently fails in unrelated pre-existing `src/components/today/CheckInForm.tsx` generics)

### Completion Notes List

- Shifted first-visit consumption from the `/me` scaffold to the actual return-seed flow on `/results/$conversationSessionId`, while keeping `/today` gating based on the existing server-side `firstVisitCompleted` flag.
- Added `ReturnSeedSection` with explicit accept/decline handling, Nerin-voiced copy, stable selectors, and local UI states for granted, declined, unsupported, and error outcomes.
- Extracted reusable push-subscription sync logic so the accept click can immediately persist the web-push subscription after permission is granted.
- Added durable first-daily-prompt persistence on the user account plus a typed account endpoint/use-case for recording the next-day MVP schedule.
- Added focused tests for the return-seed component, results-route first-visit behavior, `/me` regression protection, and first-daily-prompt persistence.
- Verification completed: targeted frontend tests passed, targeted API tests passed, API typecheck passed, and `apps/front` typecheck is still blocked by unrelated existing errors in `src/components/today/CheckInForm.tsx`.

### File List

- _bmad-output/implementation-artifacts/2-5-return-seed-and-notification-permission-on-first-me-page-visit.md
- apps/front/src/components/me/ReturnSeedSection.tsx
- apps/front/src/components/me/__tests__/ReturnSeedSection.test.tsx
- apps/front/src/hooks/use-account.ts
- apps/front/src/hooks/use-push-subscription-sync.ts
- apps/front/src/routes/results/$conversationSessionId.tsx
- apps/front/src/routes/me/index.tsx
- apps/front/src/routes/-results-session-route.test.tsx
- apps/front/src/routes/-three-space-routes.test.tsx
- packages/contracts/src/http/groups/account.ts
- apps/api/src/handlers/account.ts
- apps/api/src/use-cases/schedule-first-daily-prompt.use-case.ts
- apps/api/src/use-cases/index.ts
- apps/api/src/use-cases/__tests__/first-visit.use-case.test.ts
- packages/domain/src/repositories/user-account.repository.ts
- packages/infrastructure/src/repositories/user-account.drizzle.repository.ts
- packages/infrastructure/src/repositories/__mocks__/user-account.drizzle.repository.ts
- packages/infrastructure/src/db/drizzle/schema.ts
- drizzle/20260414110000_first_daily_prompt_schedule/migration.sql
