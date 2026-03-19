---
status: ready-for-dev
story_id: "3.4"
epic: 3
created_date: 2026-03-19
blocks: [3-5]
blocked_by: [3-3]
---

# Story 3.4: PWYW Modal & Portrait Unlock

## Story

As a **user**,
I want to **unlock my portrait through a meaningful pay-what-you-wish moment**,
So that **I feel the value of what Nerin has written for me before deciding to pay**.

## Acceptance Criteria

### AC1: PWYW Modal Auto-Open on First Visit
**Given** a user visits the results page for the first time after completing their assessment
**When** ~2-3 seconds have passed (emotional absorption delay)
**And** the user has NOT already unlocked their portrait
**Then** the PWYW modal auto-opens with: congratulations bridge, founder's love letter (dense, 3-4 sentences, personal vulnerability), Vincent's portrait example, and "Unlock your portrait" CTA
**And** the modal has proper focus management (NFR24)

### AC2: Polar Embedded Checkout
**Given** a user clicks "Unlock your portrait"
**When** the Polar embedded checkout opens
**Then** it stacks on top of the PWYW modal (z-50 for modal, Polar overlay on top)
**And** the default amount is EUR 5, minimum EUR 1
**And** no preset amount buttons appear in our UI -- Polar handles pricing UI (FR47)

### AC3: Portrait Unlock Webhook Processing
**Given** a user completes PWYW payment
**When** the portrait_unlocked webhook fires
**Then** a portrait_unlocked purchase event is recorded
**And** if this is the user's first portrait purchase, a free_credit_granted event is conditionally inserted (only if no prior free_credit_granted exists for this user) (FR33)

### AC4: Persistent Unlock CTA for Deferred Payers
**Given** a user dismisses the PWYW modal without paying
**When** they return to the results page
**Then** a persistent "Unlock your portrait" button with breathing animation is displayed in the portrait section
**And** tapping the button reopens the PWYW modal

### AC5: Post-Payment Portrait Polling
**Given** the user completes payment via the Polar checkout
**When** the checkout success event fires
**Then** the modal closes
**And** the portrait section shows a "generating" state with skeleton pulse and "Nerin is writing..." label
**And** the client polls portrait status every 2s via usePortraitStatus hook

## Tasks

### Task 1: PWYW Modal Component

Create the `PwywModal` component using Radix Dialog primitives from `packages/ui`.

**File:** `apps/front/src/components/results/PwywModal.tsx`

**Subtasks:**
- 1.1: Write failing test that the modal renders with all required sections: congratulations bridge, founder letter, portrait example, and CTA button
- 1.2: Write failing test for proper `aria-labelledby` and `aria-describedby` attributes on the dialog
- 1.3: Implement `PwywModal` component using `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogDescription` from `@workspace/ui/components/dialog`
- 1.4: Add congratulations bridge section with warm, non-clinical copy acknowledging the user's completed conversation
- 1.5: Add founder's love letter section (dense, 3-4 sentences, personal vulnerability, love letter tone) explaining why the portrait matters
- 1.6: Add Vincent's portrait example section — a scrollable excerpt demonstrating portrait depth and specificity
- 1.7: Add "Unlock your portrait" CTA button with `data-testid="pwyw-unlock-button"` that triggers the checkout callback
- 1.8: Add relationship credit mention: "Your payment also includes one relationship analysis credit"

### Task 2: PWYW Modal Auto-Open Logic

Wire the PWYW modal into the results page with auto-open on first visit.

**File:** `apps/front/src/routes/results/$assessmentSessionId.tsx`

**Subtasks:**
- 2.1: Write failing test verifying modal does NOT open when portrait is already unlocked (portraitStatus is "ready" or "generating")
- 2.2: Add `showPwywModal` state variable, defaulting to `false`
- 2.3: Add `useEffect` with 2.5-second delay that sets `showPwywModal = true` on first visit when portrait status is "none" and user has no portrait_unlocked event
- 2.4: Track "first visit" using `sessionStorage` key `pwyw-modal-shown-{sessionId}` to avoid re-opening on page refreshes
- 2.5: Render `PwywModal` component with `open={showPwywModal}` and `onOpenChange` handler
- 2.6: Add `data-testid="pwyw-modal"` to the modal for e2e testing

### Task 3: Polar Checkout Integration in PWYW Modal

Connect the "Unlock your portrait" button to Polar embedded checkout.

**File:** `apps/front/src/components/results/PwywModal.tsx`

**Subtasks:**
- 3.1: Write failing test that clicking the CTA calls the checkout handler
- 3.2: Import `createThemedCheckoutEmbed` from `@/lib/polar-checkout` and `useTheme` hook
- 3.3: On CTA click, call `createThemedCheckoutEmbed` with the portrait unlock product slug and current theme
- 3.4: Handle checkout error state — show toast notification on failure, keep modal open
- 3.5: On successful checkout (Polar `success` event), close the modal and set `waitingForUnlock = true` to trigger portrait polling

### Task 4: Persistent "Unlock your portrait" CTA Button

Show a breathing CTA in the portrait section when the user hasn't purchased.

**File:** `apps/front/src/components/results/ProfileView.tsx`

**Subtasks:**
- 4.1: Write failing test that the unlock CTA renders when `fullPortraitStatus` is "none" or undefined
- 4.2: Write failing test that the unlock CTA does NOT render when portrait is "ready", "generating", or "failed"
- 4.3: Add a new portrait section slot in `ProfileView` that renders when no portrait exists and no generation is in progress
- 4.4: Style the CTA button with a subtle breathing animation (`motion-safe:animate-pulse` with custom timing) using Tailwind CSS only
- 4.5: Wire the CTA's `onClick` to reopen the PWYW modal via a callback prop `onUnlockPortrait`
- 4.6: Add `data-testid="portrait-unlock-cta"` to the button

### Task 5: Free Credit Grant on First Portrait Purchase (AC3)

Ensure the backend conditionally grants a free relationship credit on first portrait purchase.

**File:** `apps/api/src/use-cases/process-purchase.use-case.ts`

**Subtasks:**
- 5.1: Write failing test that a `free_credit_granted` event is inserted when processing the first `portrait_unlocked` event for a user
- 5.2: Write failing test that NO `free_credit_granted` event is inserted when user already has one
- 5.3: After inserting a `portrait_unlocked` event, check if user already has a `free_credit_granted` event via `purchaseRepo.getEventsByUserId`
- 5.4: If no prior `free_credit_granted` exists, insert a new `free_credit_granted` event with the same userId
- 5.5: Ensure the free credit grant is within the same transaction as the portrait unlock event insertion

### Task 6: Integration Wiring and Post-Checkout Flow

Wire the full flow together: modal dismiss, checkout success, portrait polling.

**File:** `apps/front/src/routes/results/$assessmentSessionId.tsx`

**Subtasks:**
- 6.1: Write failing test that `waitingForUnlock` is set to `true` after checkout success
- 6.2: When checkout `success` event fires, close the PWYW modal and set `waitingForUnlock = true`
- 6.3: The existing `usePortraitStatus` hook (with `waitingForUnlock` option) already handles polling — verify it works with the new flow
- 6.4: When portrait status transitions to "ready", the `PersonalPortrait` component already renders content — verify the existing flow works end-to-end
