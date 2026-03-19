# Story 31-4: Depth Meter & Progress Milestones

**Epic:** 2 — Conversational Assessment & Drop-off Recovery
**Status:** ready-for-dev
**Priority:** High (Tier 1 MVP animation)

## User Story

As a user,
I want to see how deep into the conversation I am without it feeling like a progress bar,
So that I have a sense of progression without being reminded I'm being assessed.

## Context

The chat interface already has a basic `DepthMeter` component (`apps/front/src/components/chat/DepthMeter.tsx`) that renders a vertical fill bar based on a `progress` prop, and milestone badges are rendered inline in the chat via the `TherapistChat` component. This story enhances the depth meter with:

1. Turn-based milestone markers (dots/ticks) at 25%, 50%, 75% on the vertical bar
2. A glow pulse animation when milestones are reached
3. Proper ARIA attributes (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `role="progressbar"`)
4. `aria-live="polite"` announcements for milestone events
5. `prefers-reduced-motion` respect for all animations

The depth meter is desktop-only (hidden below 900px). The inline milestone badges in the chat stream remain as-is — they are the mobile equivalent.

## Acceptance Criteria

**AC1: Milestone markers on vertical bar**
- **Given** a conversation is in progress
- **When** the user views the chat interface on desktop (>=900px)
- **Then** the depth meter displays small horizontal tick marks at 25%, 50%, and 75% positions
- **And** unreached milestones appear dimmed
- **And** reached/passed milestones appear lit (primary color)

**AC2: Glow pulse animation on milestone hit**
- **Given** the conversation reaches 25%, 50%, or 75% completion
- **When** the milestone is hit
- **Then** the corresponding tick mark displays a brief glow pulse animation
- **And** the animation uses only `transform` and `opacity` (no layout thrashing)
- **And** the animation respects `prefers-reduced-motion` (instant cut fallback — no animation)

**AC3: Non-numeric visual indicators**
- **Given** the depth meter is visible
- **When** the user views it
- **Then** no numeric values, percentages, or text labels are visible on the meter itself
- **And** the meter uses only visual fill height and tick marks (assessment invisibility principle)

**AC4: ARIA accessibility**
- **Given** the depth meter is rendered
- **When** a screen reader encounters it
- **Then** the meter has `role="progressbar"` with `aria-valuenow` (current turn), `aria-valuemin="0"`, `aria-valuemax` (total turns)
- **And** the `aria-label` reads "Conversation depth"
- **And** milestone announcements use `aria-live="polite"` with text like "25% depth reached"

**AC5: CSS transitions on fill**
- **Given** the depth meter transitions between states
- **When** progress changes
- **Then** the fill height animates with CSS transitions using custom easing
- **And** the transition respects `prefers-reduced-motion`

**AC6: Props interface**
- **Given** the DepthMeter component
- **When** rendered
- **Then** it accepts `currentTurn: number`, `totalTurns: number`, and optional `milestones?: number[]` (defaults to `[0.25, 0.5, 0.75]`)

## Tasks

### Task 1: Enhance DepthMeter component with milestone markers
**File:** `apps/front/src/components/chat/DepthMeter.tsx`

1.1. Update the props interface from `{ progress: number }` to `{ currentTurn: number; totalTurns: number; milestones?: number[] }`
1.2. Compute `progress` internally as `currentTurn / totalTurns`
1.3. Render milestone tick marks at each milestone position on the vertical bar
1.4. Style unreached milestones as dimmed, reached as lit (primary color)
1.5. Add `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label="Conversation depth"`

### Task 2: Add glow pulse animation for milestone hits
**File:** `apps/front/src/components/chat/DepthMeter.tsx`

2.1. Track which milestones were just reached (compare previous vs current turn)
2.2. Apply a CSS glow pulse keyframe animation to newly-reached milestone ticks
2.3. Use `motion-safe:` prefix for all animations (Tailwind `prefers-reduced-motion` support)
2.4. Animation should use only `transform` and `opacity` — no layout properties

### Task 3: Add aria-live milestone announcements
**File:** `apps/front/src/components/chat/DepthMeter.tsx`

3.1. Add a visually hidden `aria-live="polite"` region
3.2. When a milestone is newly reached, update the live region text (e.g., "25% depth reached")
3.3. Clear the announcement after a brief delay to avoid stale content

### Task 4: Update TherapistChat to pass new props
**File:** `apps/front/src/components/TherapistChat.tsx`

4.1. Replace `depthProgress` computation with `currentTurn` (user message count) and `totalTurns` (freeTierMessageThreshold)
4.2. Update `ChatContent` interface and the `<DepthMeter>` call site

### Task 5: Write tests
**File:** `apps/front/src/components/chat/__tests__/DepthMeter.test.tsx`

5.1. Test that milestone ticks render at correct positions
5.2. Test that reached milestones have the "reached" visual state
5.3. Test that ARIA attributes are set correctly
5.4. Test that milestone announcements appear in the live region
5.5. Test that the component handles edge cases (0 turns, totalTurns=0, milestones at boundary)

## Technical Notes

- The depth meter is desktop-only (hidden below 900px via `max-[900px]:hidden`)
- The existing homepage `DepthMeter` (`apps/front/src/components/home/DepthMeter.tsx`) is a separate component — do not modify it
- The inline milestone badges in the chat (`TherapistChat.tsx` MILESTONES array) remain unchanged — they serve mobile users
- All animations must be CSS-only (no animation libraries in MVP per UX spec)
- Performance budget: <5% CPU during conversation on mid-range Android
- The `--gradient-progress` CSS variable can be used for the glow effect

## Dependencies

- Existing `DepthMeter` component in `apps/front/src/components/chat/DepthMeter.tsx`
- `TherapistChat` component that renders the depth meter
- No backend changes required — this is purely a frontend enhancement

## Out of Scope

- Mobile depth meter (mobile uses inline milestone badges)
- Energy-responsive ambient visualization (separate concern)
- Numeric turn count display (violates assessment invisibility)
