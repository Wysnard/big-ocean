---
status: in-progress
story_id: "3.5"
epic: 3
created_date: 2026-03-21
blocks: []
blocked_by: [3-4]
---

# Story 32-5: Full Portrait Display

## Story

As a **user**,
I want to **read my full portrait after purchasing it**,
So that **I experience the deeply personal narrative Nerin has written for me**.

## Acceptance Criteria

### AC1: Pre-Purchase State (Unlock CTA)
**Given** a user has completed their assessment but has not purchased
**When** they view the portrait section on the results page
**Then** the portrait section shows the "Unlock your portrait" breathing CTA button
**And** no portrait content or preview is displayed

### AC2: Generating State (Skeleton Pulse)
**Given** a user has purchased their portrait
**When** portrait generation is in progress (status = "generating")
**Then** a skeleton pulse is displayed with "Nerin is writing..." label
**And** the client polls GET /api/portrait/:sessionId/status every 2s
**And** polling stops on "ready", "failed", or "none"

### AC3: Ready State (Portrait Rendered via Spine Renderer)
**Given** portrait generation completes
**When** status returns "ready"
**Then** the full portrait renders via the PersonalPortrait component (markdown section renderer)
**And** the portrait content is parsed into sections with h1 (title) and h2 (body sections) headers
**And** the portrait is viewable in an immersive reading mode via `?view=portrait` URL param
**And** a back button returns to the results grid

### AC4: Failed State (Retry Button)
**Given** portrait generation fails
**When** the user sees the failure state
**Then** a retry button is displayed (no re-charge)
**And** clicking retry triggers refetchPortraitStatus which spawns a lazy retry daemon
**And** the error is non-blocking — the rest of the results page remains functional

### AC5: Portrait Reading Mode
**Given** a user navigates to `/results/$assessmentSessionId?view=portrait`
**When** full portrait content is available
**Then** a full-screen immersive reading experience is displayed via PortraitReadingView
**And** the reading view shows only the portrait content (no trait cards, radar, OCEAN code)
**And** a "See your full personality profile" link navigates back to the results grid

### AC6: Conditional Rendering in ProfileView
**Given** the portrait section in the results grid (ProfileView)
**When** portrait content is available OR status is "generating" OR status is "failed"
**Then** the PersonalPortrait component is rendered with appropriate state
**When** no portrait exists and onUnlockPortrait callback is provided
**Then** the PortraitUnlockCta is rendered instead

## Tasks

### Task 1: PortraitSection Integration Component

Create a `PortraitSection` component that orchestrates the portrait display states: unlock CTA, generating skeleton, ready content, and failed retry.

**File:** `apps/front/src/components/results/PortraitSection.tsx`

**Subtasks:**
- 1.1: Write failing test that renders PortraitUnlockCta when status is "none" and onUnlock is provided
- 1.2: Write failing test that renders skeleton pulse with "Nerin is writing..." when status is "generating"
- 1.3: Write failing test that renders PersonalPortrait with content when status is "ready"
- 1.4: Write failing test that renders retry button when status is "failed"
- 1.5: Write failing test that retry button calls onRetry callback
- 1.6: Implement PortraitSection component that delegates to the appropriate sub-component based on status
- 1.7: Add `data-testid="portrait-section"` to the wrapper
- 1.8: Add `data-testid="portrait-generating"` to the generating skeleton state
- 1.9: Add `data-testid="portrait-failed"` to the failed state

### Task 2: Portrait Reading Mode Route Integration

Verify the reading mode route integration works end-to-end with the `?view=portrait` search param.

**File:** `apps/front/src/routes/results/$assessmentSessionId.tsx`

**Subtasks:**
- 2.1: Write failing test that when `view=portrait` and portrait content is available, PortraitReadingView is rendered
- 2.2: Write failing test that when `view=portrait` but no portrait content, falls through to normal results grid
- 2.3: Write failing test that the "See your full personality profile" button navigates back to results without `view` param
- 2.4: Verify existing route code handles `view=portrait` correctly (already implemented in route file)

### Task 3: Portrait Status Polling Integration

Verify the usePortraitStatus hook correctly manages polling lifecycle.

**File:** `apps/front/src/hooks/usePortraitStatus.ts`

**Subtasks:**
- 3.1: Write failing test that polling runs every 2s when status is "generating"
- 3.2: Write failing test that polling stops when status is "ready"
- 3.3: Write failing test that polling stops when status is "failed"
- 3.4: Write failing test that polling stops when status is "none" and waitingForUnlock is false
- 3.5: Write failing test that polling continues when waitingForUnlock is true even if status is "none"

### Task 4: "Read your portrait" Action Button

Verify the "Read your portrait again" button appears in the results page action CTAs when portrait is ready.

**File:** `apps/front/src/routes/results/$assessmentSessionId.tsx`

**Subtasks:**
- 4.1: Write failing test that the "Read your portrait again" button is visible when portrait content exists
- 4.2: Write failing test that the button links to `?view=portrait`
- 4.3: Write failing test that the button is NOT visible when portrait content is null

## Dev Notes

### Existing Infrastructure (DO NOT recreate)
- **PersonalPortrait component:** `apps/front/src/components/results/PersonalPortrait.tsx` — renders portrait content with markdown sections, generating skeleton, failed retry
- **PortraitReadingView component:** `apps/front/src/components/results/PortraitReadingView.tsx` — full-screen immersive reading mode
- **PortraitUnlockCta component:** `apps/front/src/components/results/PortraitUnlockCta.tsx` — breathing CTA button
- **ProfileView component:** `apps/front/src/components/results/ProfileView.tsx` — grid layout that conditionally renders portrait section
- **usePortraitStatus hook:** `apps/front/src/hooks/usePortraitStatus.ts` — polls portrait status every 2s
- **Portrait API contract:** `packages/contracts/src/http/groups/portrait.ts` — GET /portrait/:sessionId/status endpoint
- **get-portrait-status use-case:** `apps/api/src/use-cases/get-portrait-status.use-case.ts` — derives status, triggers lazy retry
- **Results route:** `apps/front/src/routes/results/$assessmentSessionId.tsx` — already integrates portrait status polling, PWYW modal, reading view

### Key Observation
Most of the infrastructure for this story is **already implemented** across Stories 13.3 (full portrait async generation) and 3.4 (PWYW modal). The results route already:
1. Polls portrait status via `usePortraitStatus`
2. Renders `PersonalPortrait` with generating/failed/ready states
3. Shows `PortraitUnlockCta` when portrait is not unlocked
4. Handles `?view=portrait` for reading mode via `PortraitReadingView`
5. Shows "Read your portrait again" button when content is available

**The primary value of this story is:**
1. Creating a dedicated `PortraitSection` orchestrator component with proper test coverage
2. Ensuring comprehensive test coverage for all portrait display states
3. Verifying the polling lifecycle is correct
4. Validating end-to-end integration of all portrait states

### Patterns to Follow
- Use `@testing-library/react` for component tests (`render`, `screen`, `fireEvent`)
- Use `data-testid` for test selectors (FRONTEND.md rule)
- Use `data-slot` for structural identification
- Use `motion-safe:` prefix for animations (prefers-reduced-motion)
- Follow existing PersonalPortrait.test.tsx patterns for markdown rendering tests
