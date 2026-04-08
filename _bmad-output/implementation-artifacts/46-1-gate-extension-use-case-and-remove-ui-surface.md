# Story 46.1: Gate Extension Use-Case & Remove UI Surface

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the product to only show features I can use,
so that I don't encounter dead-end paths or confusing purchase options.

## Acceptance Criteria

1. **AC1: Extension activation is explicitly unavailable in MVP**
   **Given** `activate-conversation-extension.use-case.ts` currently exists and is reachable
   **When** the cleanup is complete
   **Then** the extension use-case returns a clear "feature not available" outcome if called
   **And** it does not create a child conversation, opener exchange, or greeting messages
   **And** the implementation is preserved rather than deleted outright so Phase 2a subscription work still has a defined seam.

2. **AC2: No extension CTA appears on the results page**
   **Given** a user is viewing a completed assessment
   **When** the results surface renders
   **Then** no CTA suggests they can extend, continue, or purchase more conversation depth in MVP
   **And** completed-session affordances do not route users into a dead-end chat resume flow that behaves like a hidden extension path.

3. **AC3: No extension CTA appears on the dashboard**
   **Given** an authenticated user opens `/dashboard`
   **When** the dashboard renders
   **Then** it shows only MVP actions for completed and in-progress conversations
   **And** no extension-specific or repurchase-style extension action is visible anywhere in the dashboard UI.

4. **AC4: No EUR 25 extension purchase option is visible anywhere in MVP UI**
   **Given** the product is scoped to MVP
   **When** a user navigates the authenticated surfaces
   **Then** no UI copy, CTA, checkout trigger, or user-facing text advertises a standalone paid conversation extension
   **And** any lingering completed-session "continue chat" affordance that implicitly acts like extension is removed or repurposed.

5. **AC5: Future extension scaffolding remains dormant but intact**
   **Given** extension is a documented post-MVP subscription capability
   **When** this story is implemented
   **Then** the extension-related purchase event types (`extended_conversation_unlocked`, `extended_conversation_refunded`) remain defined
   **And** `hasExtendedConversation` capability derivation remains present in the domain layer
   **And** conversation schema/repository/config scaffolding for extension sessions is not deleted without explicit proof it is dead and not part of Phase 2a.

6. **AC6: Extension no longer piggybacks portrait unlock semantics**
   **Given** the updated PRD states extension produces a new result that still requires a separate portrait purchase
   **When** dormant extension code paths are cleaned up
   **Then** `extended_conversation_unlocked` no longer grants `hasFullPortrait`
   **And** result-scoped portrait checks no longer treat extension purchases as portrait unlocks
   **And** any legacy webhook or purchase-processing path does not queue portrait generation for extension unlock events.

7. **AC7: The live Polar fulfillment path matches the gated MVP behavior**
   **Given** the production webhook path runs through `packages/infrastructure/src/context/better-auth.ts`
   **When** an extension-related product event is processed
   **Then** the live webhook path mirrors the same MVP-disabled behavior as the pure Effect use-case path
   **And** gating only `process-purchase.use-case.ts` is not treated as sufficient.

8. **AC8: Verification proves the MVP surface is clean**
   **Given** this story removes a dormant post-MVP feature from the live MVP experience
   **When** verification runs
   **Then** targeted sweeps confirm no user-facing extension or `EUR 25` copy remains in active MVP UI surfaces
   **And** focused backend/domain/frontend tests cover the gated behavior
   **And** `pnpm typecheck`, `pnpm test:run`, and `pnpm build` pass.

## Tasks / Subtasks

- [x] Task 1: Gate extension activation at the API boundary without deleting future scaffolding (AC: 1, 7, 8)
  - [x] 1.1 Update `apps/api/src/use-cases/activate-conversation-extension.use-case.ts` to short-circuit with an explicit MVP-disabled outcome before any session creation, exchange creation, or greeting persistence occurs.
  - [x] 1.2 Align `packages/contracts/src/http/groups/conversation.ts` and `apps/api/src/handlers/conversation.ts` with that gated behavior so the endpoint no longer returns a misleading success payload.
  - [x] 1.3 Update focused tests in `apps/api/src/use-cases/__tests__/activate-conversation-extension.use-case.test.ts` and any affected handler/integration coverage to prove direct calls fail cleanly and do not create extension sessions.

- [x] Task 2: Remove live extension fulfillment side effects while preserving future event vocabulary (AC: 1, 5, 6, 7)
  - [x] 2.1 Update `apps/api/src/use-cases/process-purchase.use-case.ts` so `extended_conversation_unlocked` no longer triggers portrait generation or extension-session creation while MVP gating is in effect.
  - [x] 2.2 Mirror that same behavior in the real Polar webhook flow in `packages/infrastructure/src/context/better-auth.ts`; a stale extension checkout must not queue portrait generation or silently reanimate extension behavior.
  - [x] 2.3 Preserve `PURCHASE_EVENT_TYPES`, `polarProductExtendedConversation`, and extension-related repository/schema helpers unless removal is explicitly proven safe for Phase 2a.
  - [x] 2.4 Update `apps/api/src/use-cases/__tests__/process-purchase.use-case.test.ts` and any affected purchase/webhook fixtures so event recording can remain test-covered without live extension side effects.

- [x] Task 3: Decouple dormant extension capability from portrait access (AC: 5, 6, 8)
  - [x] 3.1 Update `packages/domain/src/utils/derive-capabilities.ts` so `hasExtendedConversation` remains derived, but `extended_conversation_unlocked` no longer implies `hasFullPortrait`.
  - [x] 3.2 Update `hasPortraitForResult` in the same module so portrait access is scoped to portrait unlock/refund events only, consistent with the rewritten PRD.
  - [x] 3.3 Refresh `packages/domain/src/utils/__tests__/derive-capabilities.test.ts` and any affected portrait-status tests that currently assume extension unlock is a portrait bundle.

- [x] Task 4: Remove or repurpose dead-end completed-session affordances on results and dashboard surfaces (AC: 2, 3, 4, 8)
  - [x] 4.1 Audit `apps/front/src/routes/results/$conversationSessionId.tsx` and `apps/front/src/components/results/QuickActionsCard.tsx`; remove or replace any completed-session CTA that routes the user back into chat as if extension were available.
  - [x] 4.2 Confirm `/dashboard` exposes only MVP actions. If no visible dashboard extension CTA exists, satisfy AC with a targeted audit and keep `DashboardInProgressCard` limited to genuinely in-progress conversations.
  - [x] 4.3 Update route/component tests such as `apps/front/src/routes/-results-session-route.test.tsx` and `apps/front/src/components/results/QuickActionsCard.test.tsx` to lock the MVP surface: no extension copy, no completed-session "continue chat" affordance, and no `EUR 25` purchase messaging.

- [x] Task 5: Verify the MVP surface is clean and future scaffolding remains dormant (AC: 5, 8)
  - [x] 5.1 Run targeted sweeps, at minimum:
    - `rg -n -i "extension|extend conversation|continue chat|EUR 25|25 euro" apps/front apps/api packages --glob '!**/node_modules/**'`
    - `rg -n "extended_conversation_unlocked|extended_conversation_refunded|hasExtendedConversation" apps/api packages/domain packages/infrastructure`
    - Review remaining hits individually; comments in planning artifacts and post-MVP architecture docs are expected and should not drive code churn.
  - [x] 5.2 Run `pnpm typecheck`.
  - [x] 5.3 Run `pnpm test:run`.
  - [x] 5.4 Run `pnpm build`.

## Dev Notes

- **This story is about dormancy, not deletion.** Epic 46 cleans the MVP product surface. It does not erase ADR-39/40/42 scaffolding for extension as a post-MVP subscription capability.
- **The highest-risk mistake is gating only the pure Effect use-case.** The live purchase/webhook flow runs through `packages/infrastructure/src/context/better-auth.ts`; if that file still maps extension purchases to portrait generation or other side effects, the feature remains live in practice.
- **The second highest-risk mistake is preserving the old bundle semantics.** The PRD now states extension produces a new result that still requires a separate portrait purchase. Any code that treats `extended_conversation_unlocked` as `hasFullPortrait` is now product-inaccurate.
- **Completed-session chat affordances are part of the problem.** On the current results page, "Continue Chat" and `QuickActionsCard`'s "Resume Conversation" are misleading because completed sessions disable input and bounce the user toward results. Those dead-end paths should be treated as latent extension UI, not harmless wording.
- **No existing typed "feature unavailable" contract error appears to exist.** Prefer a typed contract-level error if the change stays reasonably scoped. If that is too heavy, still avoid misleading `SessionNotFound` or generic `DatabaseError` behavior for a deliberate MVP gate.

### Architecture Compliance

- **ADR-1 hexagonal boundaries still apply.** Keep the flow clean: domain/contracts define the outward behavior, handlers stay thin, and purchase/webhook logic remains in the appropriate use-case or infrastructure adapter layer. [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-1]
- **ADR-39 keeps extension scaffolding in the conversation schema.** `conversation_type = extension` and `parent_conversation_id` are forward-looking design decisions; this story should not rip them out. [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-39]
- **ADR-42 and the PRD place extension in the future subscription model, not MVP standalone purchase UX.** That is why the current extension purchase/event side effects must be gated now without deleting the event vocabulary. [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-42; `_bmad-output/planning-artifacts/prd.md` - FR10/FR23/FR25/FR49]

### Library / Framework Requirements

- Use the pinned monorepo stack already in place: TypeScript, Effect, Better Auth, Polar, TanStack Router/Query, Vitest, and Biome. No new dependency is required for this cleanup. [Source: `package.json`; `_bmad-output/planning-artifacts/architecture.md` - Technology Stack]
- Keep frontend `data-testid` and `data-slot` selectors stable when touching results/dashboard components. [Source: `docs/FRONTEND.md` - Testing with Data Attributes]

### File Structure Requirements

- Primary extension-gating surfaces:
  - `apps/api/src/use-cases/activate-conversation-extension.use-case.ts`
  - `apps/api/src/handlers/conversation.ts`
  - `packages/contracts/src/http/groups/conversation.ts`
- Primary purchase/fulfillment surfaces:
  - `apps/api/src/use-cases/process-purchase.use-case.ts`
  - `packages/infrastructure/src/context/better-auth.ts`
  - `packages/domain/src/utils/derive-capabilities.ts`
  - `packages/domain/src/types/purchase.types.ts`
- Primary frontend UX surfaces:
  - `apps/front/src/routes/results/$conversationSessionId.tsx`
  - `apps/front/src/components/results/QuickActionsCard.tsx`
  - `apps/front/src/routes/dashboard.tsx`
- Primary focused tests:
  - `apps/api/src/use-cases/__tests__/activate-conversation-extension.use-case.test.ts`
  - `apps/api/src/use-cases/__tests__/process-purchase.use-case.test.ts`
  - `packages/domain/src/utils/__tests__/derive-capabilities.test.ts`
  - `apps/front/src/routes/-results-session-route.test.tsx`
  - `apps/front/src/components/results/QuickActionsCard.test.tsx`

### Testing Requirements

- Required verification sequence:
  - `pnpm typecheck`
  - `pnpm test:run`
  - `pnpm build`
- Required focused proof points:
  - Direct extension activation fails cleanly and performs no writes
  - Extension-related purchase/webhook paths no longer create sessions or queue portraits
  - Portrait capability remains governed by portrait unlock events only
  - Results/dashboard no longer present completed-session affordances that imply extension availability

### Previous Story Intelligence

- **Epic 45 just completed a large rename/calibration chain.** Do not reopen schema renames, file renames, or unrelated structural churn while doing Epic 46 cleanup. [Source: `_bmad-output/implementation-artifacts/epic-45-retro-2026-04-08.md`]
- **Story 45.8 explicitly warned to keep extension functionality dormant.** This story is where that dormant-state requirement becomes a user-facing product cleanup rather than a background reminder. [Source: `_bmad-output/implementation-artifacts/45-8-deferred-cleanup.md`]
- **Epic 45 retro says Epics 46 and 47 are independent and need no prep sprint.** Keep scope surgical and verification-driven. [Source: `_bmad-output/implementation-artifacts/epic-45-retro-2026-04-08.md` - Next Steps]

### Git Intelligence Summary

- Recent commits show a verification-first pattern after Epic 45:
  - `c17bd6a3` - rename assessment files to conversation across codebase (Story 45-9)
  - `b7770fc5` - resolve Epic 45 deferred cleanup (Story 45-8)
  - `78e8865d` - refresh sprint status timestamp after Story 45-9 completion
- Follow that pattern here: small write set, explicit sweeps, and test/build proof rather than broad opportunistic refactors.

### Latest Technical Information

- No external web research is required for this story. The required context is fully contained in the repo's PRD, UX spec, architecture, prior story artifacts, and active code paths.

### Project Structure Notes

- No `project-context.md` file was found in the workspace, so this story is grounded in the planning artifacts, Epic 45 implementation history, and direct inspection of the live code paths.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 2: Conversation Extension Cleanup; Story 2.1]
- [Source: `_bmad-output/planning-artifacts/prd.md` - FR10, FR23, FR25, FR49 marked post-MVP subscription]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - extension moved to subscription/post-MVP; results/dashboard as MVP surfaces]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-1, ADR-39, ADR-42]
- [Source: `_bmad-output/implementation-artifacts/45-8-deferred-cleanup.md` - note to keep extension functionality dormant]
- [Source: `_bmad-output/implementation-artifacts/epic-45-retro-2026-04-08.md` - Epic 46 next steps]
- [Source: `apps/api/src/use-cases/activate-conversation-extension.use-case.ts` - active extension creation path]
- [Source: `apps/api/src/use-cases/process-purchase.use-case.ts` - extension purchase side effects]
- [Source: `packages/infrastructure/src/context/better-auth.ts` - live Polar webhook fulfillment path]
- [Source: `packages/domain/src/utils/derive-capabilities.ts` - extension capability currently coupled to portrait access]
- [Source: `apps/front/src/routes/results/$conversationSessionId.tsx` - completed-session "Continue Chat" CTA]
- [Source: `apps/front/src/components/results/QuickActionsCard.tsx` - completed-session "Resume Conversation" action]
- [Source: `apps/front/src/routes/dashboard.tsx` - dashboard surface audit target]
- [Source: `apps/front/src/routes/chat/index.tsx` and `apps/front/src/components/TherapistChat.tsx` - completed sessions route back to results, making "continue chat" a dead-end]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `2026-04-08T15:57+0200` - Loaded the BMAD create-story workflow, resolved BMM planning/implementation artifact paths, and parsed requested story `46-1`.
- `2026-04-08T15:57+0200` - Audited epic, PRD, UX, architecture, recent Epic 45 artifacts, and active code paths for extension activation, purchase fulfillment, domain capability derivation, and completed-session UI affordances.
- `2026-04-08T15:57+0200` - Created `_bmad-output/implementation-artifacts/46-1-gate-extension-use-case-and-remove-ui-surface.md` and updated sprint tracking to mark Epic 46 in progress with Story 46.1 ready for development.
- `2026-04-08T16:10+0200` - Added failing focused tests for gated extension activation, dormant purchase/webhook fulfillment, portrait capability derivation, portrait status polling, and completed-session results actions.
- `2026-04-08T16:33+0200` - Implemented a typed `FeatureUnavailable` MVP gate, preserved the dormant extension implementation seam, removed extension-triggered portrait/session side effects from both the Effect purchase flow and Better Auth webhook, and decoupled extension purchases from portrait access.
- `2026-04-08T16:40+0200` - Replaced completed-session results affordances with dashboard navigation, confirmed the dashboard already exposed only MVP actions, and refreshed focused results-page tests.
- `2026-04-08T16:56+0200` - Ran extension/UI sweeps plus `pnpm typecheck`, `pnpm test:run`, and `pnpm build`; increased `apps/front/vitest.config.ts` test timeout to stabilize the existing full front suite under turbo concurrency.

### Completion Notes List

- Added a typed `FeatureUnavailable` error to the domain/contracts seam and gated `activateConversationExtension` before any child session, exchange, or greeting writes while keeping the dormant implementation helper in place for post-MVP work.
- Stopped `extended_conversation_unlocked` from triggering portrait generation or extension-session creation in both `apps/api/src/use-cases/process-purchase.use-case.ts` and `packages/infrastructure/src/context/better-auth.ts`; extension event vocabulary and repository/schema scaffolding remain intact.
- Updated `deriveCapabilities` and `hasPortraitForResult` so portrait access is governed only by portrait unlock/refund events while `hasExtendedConversation` continues to derive from extension events.
- Removed the completed-session chat return path from results UI by replacing `QuickActionsCard`'s resume affordance with dashboard navigation and deleting the bottom-of-page `Continue Chat` CTA; dashboard audit confirmed no extension CTA was live there.
- Verification passed with targeted sweeps plus focused package tests and the full required gates: `pnpm typecheck`, `pnpm test:run`, and `pnpm build`.

### File List

- `_bmad-output/implementation-artifacts/46-1-gate-extension-use-case-and-remove-ui-surface.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/api/src/use-cases/__tests__/activate-conversation-extension.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/get-portrait-status.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/process-purchase.use-case.test.ts`
- `apps/api/src/use-cases/activate-conversation-extension.use-case.ts`
- `apps/api/src/use-cases/process-purchase.use-case.ts`
- `apps/front/src/components/results/QuickActionsCard.test.tsx`
- `apps/front/src/components/results/QuickActionsCard.tsx`
- `apps/front/src/routes/-results-session-route.test.tsx`
- `apps/front/src/routes/results/$conversationSessionId.tsx`
- `apps/front/vitest.config.ts`
- `packages/contracts/src/errors.ts`
- `packages/contracts/src/http/groups/conversation.ts`
- `packages/domain/src/errors/http.errors.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/utils/__tests__/derive-capabilities.test.ts`
- `packages/domain/src/utils/derive-capabilities.ts`
- `packages/infrastructure/src/context/better-auth.ts`

### Change Log

- `2026-04-08` - Gated MVP extension activation with a typed unavailable error, removed extension-triggered portrait/session side effects from purchase fulfillment, decoupled extension purchases from portrait access, cleaned completed-session results affordances, and stabilized the full front Vitest run with a 15s timeout.
