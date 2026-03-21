---
status: ready-for-dev
story_id: "3.8"
epic: 3
created_date: 2026-03-21
blocks: []
blocked_by: [3-3]
---

# Story 3.8: Basic Share & Credit System

## Story

As a **user**,
I want to **share a link to my results and see how many relationship credits I have**,
So that **I can show friends what I discovered and know what I can do next**.

## Acceptance Criteria

### AC1: Share Action with Web Share API
**Given** a user is on their results page
**When** they tap the share action
**Then** a shareable URL is copied to clipboard
**And** Web Share API is used where available, with manual copy fallback

### AC2: Credit Balance Derivation at Read Time
**Given** a user has purchase events
**When** their available credits are computed
**Then** available = COUNT(free_credit_granted + credit_purchased) units - COUNT(credit_consumed)
**And** credits are derived at read time from purchase_events -- never stored as mutable state (FR38)

### AC3: Credits Display on Results Page
**Given** the credits display on the results page
**When** the user views it
**Then** the current credit balance is visible
**And** a CTA to purchase additional credits (5 euros each) is available via embedded checkout (FR48)

## Tasks

### Task 1: Add Web Share API to Share Handler (Frontend)
The backend share infrastructure already exists (`POST /api/public-profile/share`, `createShareableProfile` use case). The results page already gets share state from `results.publicProfileId`/`results.shareableUrl`. The only gap is Web Share API support in the share handler.

**Subtasks:**
- 1.1: Enhance `handleCopyLink` in `apps/front/src/routes/results/$assessmentSessionId.tsx` to attempt `navigator.share()` first (with `title`, `text`, `url`), falling back to `navigator.clipboard.writeText()` on rejection or lack of support
- 1.2: Update `ShareProfileSection` component to use a share icon label ("Share" instead of just "Copy") when Web Share API is available
- 1.3: Write unit tests for the Web Share API logic (mock `navigator.share` and `navigator.clipboard`)

### Task 2: Credits Display Verification
The existing `RelationshipCreditsSection` already satisfies AC3 (credit balance, single/5-pack purchase CTAs via Polar). The existing `getCredits` use case already satisfies AC2 (derive-at-read from purchase_events). Verify integration is complete.

**Subtasks:**
- 2.1: Confirm `RelationshipCreditsSection` is rendered in the results page grid (already at line 485 in `$assessmentSessionId.tsx`)
- 2.2: Confirm credit derivation test coverage exists (already in `get-credits.use-case.test.ts`)

### Task 3: Integration & Typecheck
- 3.1: Run `pnpm turbo typecheck` and `pnpm test:run` to ensure no regressions

## Architect Notes

### Critical Finding: Existing Backend Infrastructure
The share URL generation backend is fully implemented:
- **Contract:** `ProfileGroup` in `packages/contracts/src/http/groups/profile.ts` has `POST /api/public-profile/share`
- **Use case:** `apps/api/src/use-cases/create-shareable-profile.use-case.ts`
- **Handler:** `apps/api/src/handlers/profile.ts`
- **Results page integration:** `$assessmentSessionId.tsx` lines 271-281 initialize `shareState` from results data

**Do NOT create duplicate endpoints or use cases.** The only implementation gap is adding Web Share API support to the frontend share handler.

### Critical Finding: Existing Credits Infrastructure
Credits are fully implemented:
- **Use case:** `apps/api/src/use-cases/get-credits.use-case.ts` (derive-at-read from purchase_events)
- **Contract:** `PurchaseGroup` has `GET /api/purchase/credits`
- **Frontend:** `RelationshipCreditsSection` component with balance display + Polar checkout
- **Tests:** Full coverage in `get-credits.use-case.test.ts`

### Implementation Guidance
1. **File to modify:** `apps/front/src/routes/results/$assessmentSessionId.tsx` - enhance `handleCopyLink`
2. **File to modify:** `apps/front/src/components/results/ShareProfileSection.tsx` - update copy button to show "Share" when Web Share API available
3. **Pattern to follow:** `apps/front/src/components/sharing/archetype-share-card.tsx` lines 96-112 already use `navigator.share()` with clipboard fallback -- replicate this pattern
4. **Test pattern:** Component tests in `apps/front/src/components/results/` (e.g., `QuickActionsCard.test.tsx`)
