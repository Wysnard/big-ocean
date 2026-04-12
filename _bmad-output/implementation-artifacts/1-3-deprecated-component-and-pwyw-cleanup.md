# Story 1.3: Deprecated Component & PWYW Cleanup

Status: done

## Story

As a **developer**,
I want **all deprecated monetization and auth-gate components removed**,
So that **the codebase reflects the current free-portrait subscription model**.

## Acceptance Criteria

1. **Given** the following components exist in the codebase
   **When** this cleanup is complete
   **Then** these files are deleted:
   - `ChatAuthGate.tsx` and `ChatAuthGate.test.tsx`
   - `PortraitWaitScreen.tsx` and `PortraitWaitScreen.test.tsx`
   - `PwywModal.tsx` and `PwywModal.test.tsx`
   - `PortraitUnlockCta.tsx`
   - `RelationshipCreditsSection.tsx`
   - `QuickActionsCard.tsx` and `QuickActionsCard.test.tsx`
   - `useCredits.ts` hook

2. **And** all imports referencing these deleted components are removed

3. **And** any parent component that rendered these components is updated to remove the usage

4. **And** the results page no longer shows PWYW modal or portrait unlock CTA (portrait renders directly — it's free)

5. **And** `pnpm build` succeeds and `pnpm test:run` passes

## Tasks / Subtasks

- [x] Task 1: Delete component files and test files (AC: #1)
  - [x] 1.1 Delete `apps/front/src/components/ChatAuthGate.tsx`
  - [x] 1.2 Delete `apps/front/src/components/ChatAuthGate.test.tsx`
  - [x] 1.3 Delete `apps/front/src/components/PortraitWaitScreen.tsx`
  - [x] 1.4 Delete `apps/front/src/components/PortraitWaitScreen.test.tsx`
  - [x] 1.5 Delete `apps/front/src/components/results/PwywModal.tsx`
  - [x] 1.6 Delete `apps/front/src/components/results/PwywModal.test.tsx`
  - [x] 1.7 Delete `apps/front/src/components/results/PortraitUnlockCta.tsx`
  - [x] 1.8 Delete `apps/front/src/components/results/RelationshipCreditsSection.tsx`
  - [x] 1.9 Delete `apps/front/src/components/results/QuickActionsCard.tsx`
  - [x] 1.10 Delete `apps/front/src/components/results/QuickActionsCard.test.tsx`
  - [x] 1.11 Delete `apps/front/src/hooks/useCredits.ts`

- [x] Task 2: Clean up results route — `apps/front/src/routes/results/$conversationSessionId.tsx` (AC: #2, #3, #4)
  - [x] 2.1 Remove imports: `PwywModal`, `QuickActionsCard`, `RelationshipCreditsSection`
  - [x] 2.2 Remove `createThemedCheckoutEmbed` import (line 35) — only used here for PWYW checkout
  - [x] 2.3 Remove PWYW state: `showPwywModal`, `isCheckoutLoading` (lines 132-133)
  - [x] 2.4 Remove PWYW refs: `pwywAutoOpenRef`, `portraitUnlockTriggerRef` (lines 135-136)
  - [x] 2.5 Remove `waitingForUnlock` state and its cleanup effect (lines 108, 119-123)
  - [x] 2.6 Simplify `effectivePortraitStatus`: remove `waitingForUnlock` ternary → use `portraitStatusData?.status` directly (lines 126-129)
  - [x] 2.7 Remove PWYW auto-open effect (lines 139-165)
  - [x] 2.8 Remove `handlePwywCheckout` callback (lines 168-189)
  - [x] 2.9 Remove `handleUnlockPortrait` callback (lines 192-194)
  - [x] 2.10 Remove `onUnlockPortrait` prop passed to `<ProfileView>` (lines 440-446)
  - [x] 2.11 Remove `portraitUnlockTriggerRef` prop from `<ProfileView>` (line 447)
  - [x] 2.12 Remove `quickActions` prop from `<ProfileView>` — was `<QuickActionsCard>` (line 472)
  - [x] 2.13 Remove `<RelationshipCreditsSection />` from grid children (line 491)
  - [x] 2.14 Remove `<PwywModal>` JSX block (lines 519-526)

- [x] Task 3: Clean up ProfileView — `apps/front/src/components/results/ProfileView.tsx` (AC: #2, #3)
  - [x] 3.1 Remove `import { PortraitUnlockCta } from "./PortraitUnlockCta";` (line 9)
  - [x] 3.2 Remove `onUnlockPortrait`, `portraitUnlockTriggerRef` from props interface (lines 36-38)
  - [x] 3.3 Remove those props from the function parameter destructuring (lines 65-66)
  - [x] 3.4 Remove the PortraitUnlockCta conditional branch at lines 124-131 (the `else` of the portrait section that renders `<PortraitUnlockCta>` when `onUnlockPortrait` is set)
  - [x] 3.5 Remove `quickActions` prop and its rendering `<div>` at line 167 — no remaining providers

- [x] Task 4: Clean up PortraitSection — `apps/front/src/components/results/PortraitSection.tsx` (AC: #2, #3)
  - [x] 4.1 Remove `import { PortraitUnlockCta } from "./PortraitUnlockCta";` (line 16)
  - [x] 4.2 Remove `{status === "none" && onUnlock && <PortraitUnlockCta onUnlock={onUnlock} />}` (line 35)
  - [x] 4.3 Remove `onUnlock` from props interface and parameter destructuring (lines 22-23, 32)

- [x] Task 5: Clean up TherapistChat — `apps/front/src/components/TherapistChat.tsx` (AC: #2, #3)
  - [x] 5.1 Remove `import { ChatAuthGate } from "./ChatAuthGate";` (line 19)
  - [x] 5.2 Remove `{isFarewellReceived && !isAuthenticated && <ChatAuthGate sessionId={sessionId} />}` in `ChatContent` (line 707)

- [x] Task 6: Clean up dashboard route — `apps/front/src/routes/dashboard.tsx` (AC: #2)
  - [x] 6.1 Remove `import { useCredits } from "@/hooks/useCredits";` (line 20)
  - [x] 6.2 Remove `const { data: credits, isLoading: isCreditsLoading } = useCredits(canLoad);` (line 70)
  - [x] 6.3 Remove any JSX that references `credits` or `isCreditsLoading`
  - [x] **NOTE:** If Story 1.2 has already been completed, `dashboard.tsx` may already be deleted or replaced with a redirect. Skip this task if the file no longer exists.

- [x] Task 7: Clean up e2e tests — remove PWYW modal dismissal blocks (AC: #5)
  - [x] 7.1 `e2e/specs/golden-path.spec.ts` — remove 4 PWYW dismissal blocks (lines ~82-86, ~119-125, ~199-203, ~231-235)
  - [x] 7.2 `e2e/specs/archetype-card.spec.ts` — remove 2 blocks (lines ~76-80, ~101-105)
  - [x] 7.3 `e2e/specs/relationship-analysis.spec.ts` — remove 2 blocks (lines ~125-129, ~143-147)
  - [x] 7.4 `e2e/specs/conversation-lifecycle.spec.ts` — remove 1 block (lines ~88-92)
  - [x] 7.5 `e2e/specs/invitation-system.spec.ts` — remove 1 block (lines ~113-117)
  - [x] Each block follows this pattern — delete the entire block including surrounding comments:
    ```typescript
    // Dismiss PWYW modal if ...
    const pwywModal = page.getByTestId("pwyw-modal");
    await pwywModal.waitFor({ state: "visible", timeout: X_000 }).catch(() => {});
    if (await pwywModal.isVisible()) {
        await page.locator("[data-slot='dialog-close']").click();
        await pwywModal.waitFor({ state: "hidden", timeout: 3_000 });
    }
    ```

- [x] Task 8: Verify build and tests (AC: #5)
  - [x] 8.1 Run `pnpm build` — must succeed
  - [x] 8.2 Run `pnpm test:run` — must pass
  - [x] 8.3 Run `pnpm typecheck` — must pass

## Dev Notes

### Critical Execution Order

Execute tasks 1-7 in any order, but run Task 8 last. The safest approach: delete files first (Task 1), then fix all broken imports (Tasks 2-7), then verify (Task 8).

### Files NOT to delete

- `@/lib/polar-checkout.ts` — still needed for subscription checkout (Epic 8)
- `ResultsAuthGate.tsx` — different from ChatAuthGate, still used in the results route
- `PersonalPortrait.tsx` — still renders portrait content
- `PortraitReadingView.tsx` — the full-screen portrait reading view, still used
- `PortraitSection.tsx` — still used (just remove the PortraitUnlockCta branch)
- `usePortraitStatus.ts` — still polls portrait generation status

### PWYW Removal Cascading State

Removing PwywModal from the results route creates orphaned state. The `waitingForUnlock` state + its `useEffect` must also be removed because:
- `waitingForUnlock` was set to `true` only after a Polar checkout success
- `effectivePortraitStatus` used it to treat `"none"` as `"generating"` during the checkout → webhook gap
- With no checkout flow, `waitingForUnlock` is dead code

After removal, `effectivePortraitStatus` simplifies to just `portraitStatusData?.status`. The portrait section will show:
- `"none"` → nothing (no unlock CTA, no generating state — portrait is free and auto-generated)
- `"generating"` → spinner
- `"ready"` → full portrait
- `"failed"` → retry button

### Story 1.2 Dependency

Story 1.2 (Dashboard Retirement) deletes `dashboard.tsx`. If it runs before this story, Task 6 can be skipped entirely. If this story runs first, clean up the `useCredits` import in dashboard.tsx.

### E2E Test Rationale

All 5 e2e specs contain PWYW modal dismissal blocks because the modal auto-opened ~2.5s after the results page loaded. These blocks used `waitFor` + `catch` pattern to handle the modal gracefully. With the modal removed, these blocks become dead code that would timeout on `waitFor` — they MUST be removed.

This is NOT violating the `data-testid` rule from CLAUDE.md. The rule says "NEVER remove data-testid attributes" — these attributes live on the deleted `PwywModal` component, not on surviving components. We are removing the e2e code that references a deleted component's testid.

### Project Structure Notes

All deleted files live in:
- `apps/front/src/components/` (ChatAuthGate, PortraitWaitScreen)
- `apps/front/src/components/results/` (PwywModal, PortraitUnlockCta, RelationshipCreditsSection, QuickActionsCard)
- `apps/front/src/hooks/` (useCredits)

This aligns with the project convention: page-specific components in `apps/front/src/components/`, hooks in `apps/front/src/hooks/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: apps/front/src/routes/results/$conversationSessionId.tsx] — main parent file for PwywModal, QuickActionsCard, RelationshipCreditsSection
- [Source: apps/front/src/components/TherapistChat.tsx:707] — ChatAuthGate usage
- [Source: apps/front/src/components/results/ProfileView.tsx:124-131] — PortraitUnlockCta usage
- [Source: apps/front/src/components/results/PortraitSection.tsx:35] — PortraitUnlockCta usage
- [Source: apps/front/src/routes/dashboard.tsx:20,70] — useCredits usage
- [Source: CLAUDE.md#Testing Rules] — data-testid rule context

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Deleted 12 deprecated component/test/hook files (ChatAuthGate, PortraitWaitScreen, PwywModal, PortraitUnlockCta, RelationshipCreditsSection, QuickActionsCard, useCredits + their tests)
- Cleaned up results route: removed all PWYW state, refs, effects, callbacks, and JSX. Simplified `effectivePortraitStatus` to `portraitStatusData?.status`
- Cleaned up ProfileView: removed `onUnlockPortrait`, `portraitUnlockTriggerRef`, `quickActions` props and their rendering
- Cleaned up PortraitSection: removed `onUnlock` prop, PortraitUnlockCta rendering, updated docstring
- Cleaned up TherapistChat: removed ChatAuthGate import and JSX rendering
- Cleaned up dashboard.tsx: removed useCredits import, call, and DashboardCreditsCard references
- Removed 10 PWYW modal dismissal blocks across 5 e2e spec files
- Also removed the golden-path "assert Polar checkout button" step that referenced the deleted PortraitUnlockCta
- Updated 3 test files with broken assertions: results-session-route.test.tsx (removed RelationshipCreditsSection assertion), TherapistChat-core.test.tsx (removed auth gate assertion), TherapistChat-farewell-auth-focus.test.tsx (removed ChatAuthGate test describe block)
- Updated PortraitSection.test.tsx: replaced PortraitUnlockCta tests with "none" state empty section test
- Removed unused `useTheme` import from results route
- All acceptance criteria satisfied: `pnpm typecheck` passes, `pnpm build` succeeds, `pnpm test:run` passes (412 frontend tests, 295 api tests, all green)

### Review Findings

- [x] [Review][Patch] Orphaned `DashboardCreditsCard` component — deleted component + test
- [x] [Review][Patch] `usePortraitStatus` dead `waitingForUnlock` parameter and polling logic — cleaned up
- [x] [Review][Patch] Golden path E2E dead portrait purchase webhook step — removed + cleaned imports
- [x] [Review][Patch] `purchase-credits.spec.ts` references deleted `RelationshipCreditsSection` — deleted spec
- [x] [Review][Patch] Stale `useTheme` and `polar-checkout` mocks in results route test — removed
- [x] [Review][Patch] Stale comment in chat route referencing `ChatAuthGate` — fixed

### Change Log

- 2026-04-12: Story 1.3 implementation complete — removed all deprecated PWYW/monetization components and cleaned up all references

### File List

**Deleted:**
- apps/front/src/components/ChatAuthGate.tsx
- apps/front/src/components/ChatAuthGate.test.tsx
- apps/front/src/components/PortraitWaitScreen.tsx
- apps/front/src/components/PortraitWaitScreen.test.tsx
- apps/front/src/components/results/PwywModal.tsx
- apps/front/src/components/results/PwywModal.test.tsx
- apps/front/src/components/results/PortraitUnlockCta.tsx
- apps/front/src/components/results/PortraitUnlockCta.test.tsx
- apps/front/src/components/results/RelationshipCreditsSection.tsx
- apps/front/src/components/results/QuickActionsCard.tsx
- apps/front/src/components/results/QuickActionsCard.test.tsx
- apps/front/src/hooks/useCredits.ts

**Modified:**
- apps/front/src/routes/results/$conversationSessionId.tsx
- apps/front/src/components/results/ProfileView.tsx
- apps/front/src/components/results/PortraitSection.tsx
- apps/front/src/components/results/PortraitSection.test.tsx
- apps/front/src/components/TherapistChat.tsx
- apps/front/src/routes/dashboard.tsx
- apps/front/src/routes/-results-session-route.test.tsx
- apps/front/src/components/TherapistChat-core.test.tsx
- apps/front/src/components/TherapistChat-farewell-auth-focus.test.tsx
- apps/front/src/components/__fixtures__/therapist-chat.fixtures.tsx
- e2e/specs/golden-path.spec.ts
- e2e/specs/archetype-card.spec.ts
- e2e/specs/relationship-analysis.spec.ts
- e2e/specs/conversation-lifecycle.spec.ts
- e2e/specs/invitation-system.spec.ts
- _bmad-output/implementation-artifacts/1-3-deprecated-component-and-pwyw-cleanup.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
