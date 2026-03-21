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

### Task 1: Share Results Use Case (Backend)
Create a use case that generates a shareable URL for the user's results page.

**Subtasks:**
- 1.1: Create `get-share-url.use-case.ts` in `apps/api/src/use-cases/` that takes a `sessionId` and `userId`, verifies session ownership, and returns the shareable URL (delegates to existing `createShareableProfile`)
- 1.2: Add `getShareUrl` endpoint to the contracts `ResultsGroup` in `packages/contracts/src/http/groups/results.ts` -- `GET /results/:sessionId/share` returning `{ shareableUrl: string, isPublic: boolean }`
- 1.3: Wire the handler in `apps/api/src/handlers/results.ts` to call the use case
- 1.4: Write tests for the use case verifying session ownership check and URL generation

### Task 2: Share Button Component (Frontend)
Implement the share button with Web Share API and clipboard fallback on the results page.

**Subtasks:**
- 2.1: Create `useShareResults` hook in `apps/front/src/components/results/useShareResults.ts` that calls `GET /results/:sessionId/share`, triggers Web Share API where available, falls back to `navigator.clipboard.writeText`, and tracks copied state with auto-reset timer
- 2.2: Create `ShareResultsButton` component in `apps/front/src/components/results/ShareResultsButton.tsx` with share icon, loading state, and success feedback (checkmark)
- 2.3: Integrate `ShareResultsButton` into the results page layout alongside existing share section
- 2.4: Write component tests verifying Web Share API usage, clipboard fallback, and loading states

### Task 3: Credits Display Component (Frontend)
Display the credit balance and purchase CTA on the results page using the existing `GET /api/purchase/credits` endpoint.

**Subtasks:**
- 3.1: Verify the existing `RelationshipCreditsSection` component already satisfies AC3 requirements (credit balance display, purchase CTA via Polar embedded checkout)
- 3.2: If any gaps exist, enhance the component to show credit balance prominently and ensure the purchase CTA is always visible
- 3.3: Ensure the credits section is integrated into the results page grid layout

### Task 4: Integration Verification
Verify the full flow end-to-end.

**Subtasks:**
- 4.1: Verify that share action on results page correctly triggers Web Share API or clipboard copy
- 4.2: Verify credit balance updates after purchase via Polar webhook polling
- 4.3: Run `pnpm turbo typecheck` and `pnpm test:run` to ensure no regressions
