# Story 7.16: Geometric Ocean Sea Life Ambient Layer

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User taking the 30-minute assessment**,
I want **to see subtle, animated geometric sea life creatures behind the chat conversation**,
So that **the assessment feels immersive and alive — like exploring an underwater world — without distracting from the conversation**.

## Acceptance Criteria

1. **Given** I'm on the chat assessment page
   **When** the page loads
   **Then** I see subtle geometric sea life animating behind the conversation:
   - Teal seaweed stalks swaying at edges and center
   - Orange diamond fish swimming slowly across
   - Pink triangle school fish in formation
   - Purple jellyfish drifting upward
   - Peach bubbles rising gently
   **And** all creatures are at low opacity (5-22%) and non-distracting
   **And** the ocean layer is `aria-hidden` (decorative only)
   **And** the ocean layer has `pointer-events: none` (no interaction)

2. **Given** a new message arrives in the chat
   **When** the pulse state activates
   **Then** seaweed sways wider, fish speed up briefly, school scatters, jellyfish pulses harder
   **And** the pulse reverts after 3 seconds

3. **Given** the conversation reaches 60%+ progress (via `depthProgress` prop)
   **When** the depth threshold is crossed
   **Then** all animations slow down (~30% longer duration) via `data-depth="deep"` attribute

4. **Given** I toggle dark mode
   **When** the theme switches
   **Then** creatures shift to bioluminescent palette (gold fish, bright teal seaweed, hot pink school)
   **And** opacity values adjust per the dark mode specification

5. **Given** I have `prefers-reduced-motion` enabled
   **When** the page loads
   **Then** all animations are disabled — creatures show at final static positions

6. **Given** I'm on mobile (< 900px)
   **When** the layout adapts
   **Then** center seaweed groups are hidden
   **And** edge seaweed groups shift to 6px from edge
   **And** all other creatures remain visible

## Tasks / Subtasks

- [x] Task 1: Create creature CSS custom properties in globals.css (AC: #1, #4)
  - [x]Add sea-life color tokens for light mode (seaweed, fish, school, jelly, bubble)
  - [x]Add sea-life opacity tokens for light mode
  - [x]Add dark mode overrides (bioluminescent palette + adjusted opacities)

- [x] Task 2: Create `Seaweed.tsx` component (AC: #1, #2, #3, #5, #6)
  - [x]4 groups: left edge, right edge, center-left, center-right
  - [x]Each group has 2-4 rounded stalks of varying height (100-170px) and width (6-10px)
  - [x]`seaweedSway` CSS keyframe animation (~5s cycle, staggered per stalk)
  - [x]Pulse state: wider sway amplitude
  - [x]Deep state: slower sway (~7s)
  - [x]Mobile: hide center groups at < 900px, edge groups at 6px offset
  - [x]`data-slot="seaweed-group"`

- [x] Task 3: Create `DiamondFish.tsx` component (AC: #1, #2, #3, #5)
  - [x]3 fish at different vertical positions and speeds
  - [x]CSS-only diamond body (rotated square) + triangular tail
  - [x]`fishSwim` keyframe: linear left-to-right traverse (35-48s per fish)
  - [x]`fishBob` keyframe: subtle vertical bob (4s cycle)
  - [x]Fish fade to lower opacity (0.05/0.07) when crossing center 40-60% zone (behind chat)
  - [x]Pulse state: speed up briefly
  - [x]Deep state: slower swim (45-55s)
  - [x]`data-slot="diamond-fish"`

- [x] Task 4: Create `SchoolFish.tsx` component (AC: #1, #2, #3, #5)
  - [x]9 individual triangle fish in V-formation
  - [x]CSS border-trick triangles (no SVG needed)
  - [x]`schoolSwim` keyframe: right-to-left traverse (38s)
  - [x]`individualDrift` keyframe: subtle per-fish movement offset
  - [x]Fade to lower opacity when crossing center zone
  - [x]Pulse state: scatter effect (wider individual drift)
  - [x]Deep state: slower swim (48s)
  - [x]`data-slot="school-fish"`

- [x] Task 5: Create `Jellyfish.tsx` component (AC: #1, #2, #3, #5)
  - [x]2 jellyfish at different positions and speeds
  - [x]CSS-only: circular bell + 3-4 wavy tentacle lines
  - [x]`jellyDrift` keyframe: vertical upward drift with horizontal oscillation (55-65s)
  - [x]`jellyPulse` keyframe: bell scale pulse (scaleY 0.80-1.06, 4s)
  - [x]`tentacleSway` keyframe: gentle rotation + scaleY variation (4s)
  - [x]Pulse state: `jellyPulseBurst` — stronger pulse
  - [x]Deep state: slower drift (70-80s)
  - [x]`data-slot="jellyfish"`

- [x] Task 6: Create `Bubbles.tsx` component (AC: #1, #5)
  - [x]8 hollow circle particles with varying sizes (4-12px)
  - [x]`bubbleRise` keyframe: rise from bottom to top with horizontal zigzag (8-15s per bubble, staggered)
  - [x]Border-only styling using `--bubble-border-color` token
  - [x]`data-slot="bubble-particle"`

- [x] Task 7: Create `GeometricOcean.tsx` scene container (AC: #1, #2, #3, #4, #5, #6)
  - [x]Full scene wrapper: `position: absolute; inset: 0; z-0; pointer-events: none; overflow: hidden`
  - [x]`aria-hidden="true"` on root
  - [x]Props: `depthProgress?: number` (0-1), `pulse?: boolean`, `className?: string`
  - [x]Sets `data-depth="deep"` when `depthProgress >= 0.6`, otherwise `"surface"`
  - [x]Manages pulse class: adds `.pulse` class when `pulse=true`, auto-removes after 3s
  - [x]Composes all creature sub-components
  - [x]`data-slot="geometric-ocean-layer"`

- [x] Task 8: Integrate into TherapistChat (AC: #1, #2, #3)
  - [x]Add `GeometricOcean` layer inside the chat layout container
  - [x]Position: behind chat content (z-0), chat content at z-10
  - [x]Pass `depthProgress` from existing `depthProgress` state variable
  - [x]Pass `pulse` prop triggered on new message arrival (3s window)
  - [x]Ensure no layout or scroll regression

- [x] Task 9: Add CSS keyframe animations to globals.css (AC: #1, #2, #3, #5)
  - [x]All creature keyframes: `seaweedSway`, `fishSwimA/B/C`, `fishBob`, `schoolSwim`, `individualDrift`, `jellyDriftA/B`, `jellyPulse`, `jellyPulseBurst`, `tentacleSway`, `bubbleRise`
  - [x]Deep state overrides via `[data-depth="deep"]` selector
  - [x]Pulse state overrides via `.pulse` selector
  - [x]`@media (prefers-reduced-motion: reduce)` — disable all animations

- [x] Task 10: Create Storybook stories (AC: all)
  - [x]`sea-life.stories.tsx` with controls for: pulse toggle, depth progress slider, dark mode toggle
  - [x]Individual creature stories: Seaweed, DiamondFish, SchoolFish, Jellyfish, Bubbles
  - [x]Full scene story: GeometricOcean with all controls
  - [x]File: `apps/front/src/components/sea-life/sea-life.stories.tsx`

- [x] Task 11: Fix milestone message positioning on session resumption (Bug fix)
  - [x] On resume, pre-compute milestone positions from message history instead of using `messages.length` at trigger time
  - [x] Calculate the message array index where each milestone threshold was first crossed (based on user message count / freeTierMessageThreshold)
  - [x] Initialize `shownMilestones` state with correct historical positions so badges appear inline with the conversation, not at the bottom

- [x] Task 12: Fix milestone race condition — init vs live-tracking effects (Bug fix)
  - [x] Root cause: two separate useEffects (init + live-tracking) fired in the same React render cycle; live effect saw stale empty Map and overwrote pre-computed positions with `messages.length` (bottom)
  - [x] Merged into a single unified useEffect that handles both resume (historical scan) and live (incremental scan) milestone computation
  - [x] Uses `milestonesComputedForRef` to track scan progress — first run scans full history, subsequent runs scan only new messages
  - [x] Removed unused `progressPercent` destructure (was only used by the old live-tracking effect)

- [x] Task 13: Move auth handling from TherapistChat to route level (Refactor)
  - [x] Removed `useAuth` import and auth-based redirect effects from TherapistChat — component no longer manages auth
  - [x] Added `onSessionError` callback prop to TherapistChat for session error notification
  - [x] Route component (`routes/chat/index.tsx`) now handles auth-based redirects: authenticated → `/404`, unauthenticated → `/chat`
  - [x] Removed `isAuthenticated` and `isResumeSessionNotFound` from ChatContent props — no longer needed
  - [x] Simplified session-not-found UI in ChatContent to generic resume error (route handles redirect before UI is reached)
  - [x] Updated 2 tests to verify `onSessionError` callback instead of direct navigate calls
  - [x] Removed unused `mockUseAuth` test mock

- [x] Task 14: Fix scrollbar overlapping messages — match homepage scroll pattern (Bug fix)
  - [x] Moved `overflow-y-auto` from inner messages div to outer `flex-1` scroll container — scrollbar now at viewport edge, not inside 900px content area
  - [x] Added `pb-[140px]` to messages area to prevent content from being hidden behind sticky input bar
  - [x] Centered input bar content with `mx-auto max-w-[900px]` wrapper to align with messages
  - [x] Fixed broken JSX nesting from partial edit — removed extra `</div>` from deleted intermediate wrapper div

- [x] Task 15: Fix input bar hidden behind messages on scroll (Bug fix)
  - [x] Root cause: input bar was inside the `overflow-y-auto` scroll container as a `sticky bottom-0` element — sticky positioning failed when scrolling up through long conversations, causing input to disappear behind messages
  - [x] Moved input bar outside the scroll container to be a direct sibling in the flex column — input is now always visible at the bottom regardless of scroll position
  - [x] Removed `pb-[140px]` hack from messages area (no longer needed since input bar is not overlaying scroll content), replaced with `pb-6` for standard spacing
  - [x] Added `relative z-10` to input bar to maintain proper stacking above the GeometricOcean background layer

- [x] Task 16: Remove hover and pointer cursor on user messages (UX cleanup)
  - [x] Changed user message element from `<button>` to `<div>` — messages are no longer interactive
  - [x] Removed `cursor-pointer`, `hover:ring-2 hover:ring-ring/40`, `transition-shadow` classes
  - [x] Removed `onClick` handler and `handleMessageClick` function (dead code — `onMessageClick` prop was never passed by any route)
  - [x] Removed `onMessageClick` prop from `TherapistChatProps` interface
  - [x] Updated tests: replaced 3 click/button tests with 1 test verifying user messages render as non-interactive `div` elements

- [x] Task 17: Fix bubbles invisible in light mode (Bug fix)
  - [x] Root cause: bubble border `#FFD6C4` matches light mode background `#FFF8F0` — peach on peach at 22% opacity is invisible
  - [x] Changed light mode `--bubble-border-color` from `#FFD6C4` (peach) to `rgba(0, 180, 166, 0.45)` (teal, matching `--tertiary` brand token)
  - [x] Changed light mode `--bubble-fill-color` from `rgba(255, 232, 216, 0.06)` (peach) to `rgba(0, 180, 166, 0.04)` (subtle teal)
  - [x] Bubbles now use ocean-teal tones in light mode — visible against warm peach background while remaining ambient and non-distracting

- [x] Task 18: Fix send button not visible enough in dark mode (Bug fix)
  - [x] Root cause: teal `#00D4C8` primary button at `disabled:opacity-50` is too dim against the near-black input bar (`rgba(10, 14, 39, 0.92)`)
  - [x] Added `dark:shadow-[0_0_8px_rgba(0,212,200,0.3)]` — subtle teal glow makes button pop against the dark background
  - [x] Added `dark:disabled:opacity-65` — raised from 50% so disabled state remains visible in dark mode

## Dev Notes

### Critical Implementation Context

This story adds a purely decorative CSS animation layer to the assessment chat. **Zero backend/API changes.** The entire implementation is CSS keyframes + React components with minimal JS logic (just `data-depth` attribute switching and pulse class toggling).

### Design Reference (MUST READ)

**Approved HTML mockup:** `apps/front/geometric-ocean-mockup.html`

This mockup is the source of truth for all creature shapes, animation timing, opacity levels, color tokens, and layout positions. The dev agent MUST load and reference this file — it contains the exact CSS keyframes, creature construction patterns, and state modifiers to implement.

### Integration Point — TherapistChat.tsx

**File:** `apps/front/src/components/TherapistChat.tsx`

The `ChatContent` component currently renders:
```tsx
<>
  <DepthMeter progress={depthProgress} />
  <div className="h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden ...">
    {/* chat header, messages area, input bar */}
  </div>
</>
```

The ocean layer needs to be placed **inside** the main chat `div` as the first child, positioned absolutely at `inset-0 z-0`, with all existing chat content elevated to `z-10` (or using `relative z-10`). The chat container already has `overflow-hidden`, which will clip the ocean layer correctly.

**Existing `depthProgress` variable:** Already computed as `Math.min(userMessageCount / (freeTierMessageThreshold || 27), 1)` — this is the same 0-1 float to pass as `depthProgress` prop to `GeometricOcean`.

**Pulse trigger:** Fire `pulse=true` when a new assistant message arrives. Use a `useState` + `useEffect` with a 3-second timeout to reset.

### Creature Construction — CSS Only, No SVG

The mockup uses pure CSS shapes (no SVG elements):

- **Diamond fish:** Two `div` elements — `.body` (rotated 45deg square, `border-radius: 2px`) + `.tail` (smaller rotated square, `border-radius: 1px`)
- **School fish:** CSS border triangle trick (`border-left: solid color; border-top/bottom: transparent`)
- **Jellyfish:** Circle `.bell` (`border-radius: 50%`) + `div.tentacles` container with 3-4 wavy line children
- **Seaweed:** Tall thin `div` stalks with `border-radius: 50%/30%` for organic shape
- **Bubbles:** Small circles with border-only (hollow)

This approach matches the mockup exactly and requires zero new dependencies.

### Animation Architecture

All animations are **pure CSS `@keyframes`** — no JS animation libraries, no `requestAnimationFrame`, no framer-motion.

**State management via CSS selectors:**
- `[data-depth="surface"]` — default animation speeds
- `[data-depth="deep"]` — slower animations (~30% longer durations)
- `.pulse` — temporary intensification (wider sway, faster swim, scatter, stronger pulse)
- `@media (prefers-reduced-motion: reduce)` — `animation: none !important` on all creatures

**Fish center-fade pattern:** Fish crossing the center 40-60% horizontal zone fade to very low opacity (0.05 light / 0.07 dark) using keyframe opacity steps — this simulates them passing behind the chat content area.

### Color Token Strategy

The story spec defines creature-specific CSS custom properties. However, to minimize globals.css pollution, **scope these within the component CSS** rather than adding to the global root. The creatures already map to existing brand tokens:

| Creature | Brand Token | Light | Dark |
|----------|------------|-------|------|
| Seaweed | `--tertiary` | `#00B4A6` | `#00D4C8` |
| Fish body | `--secondary` | `#FF6B2B` | `#FFB830` |
| School | Primary (light) / Tertiary (dark) | `#FF0080` | `#FF2D9B` |
| Jellyfish | `--trait-openness` | `#A855F7` | `#A855F7` / `#C084FC` |
| Bubbles border | `--border` | `#FFD6C4` | `#F0EDE8` |

Option A: Use existing brand tokens directly in component styles (fewer new CSS vars).
Option B: Define creature-specific tokens scoped to `[data-slot="geometric-ocean-layer"]` selector.

**Recommend Option B** for clarity and to match the spec opacity tokens, but keep them scoped to the component selector, not `:root`.

### Opacity Values (Critical for Ambient Feel)

| Creature | Light Mode | Dark Mode |
|----------|-----------|-----------|
| Seaweed | 0.18 | 0.22 |
| Fish body | 0.14 | 0.20 |
| Fish crossing center | 0.05 | 0.07 |
| School fish | 0.14 | 0.18 |
| School crossing | 0.05 | 0.07 |
| Jellyfish bell | 0.12 | 0.18 |
| Jellyfish tentacles | 0.08 | 0.12 |
| Bubbles | 0.22 | 0.18 |

These are deliberately very low — the layer must feel ambient and never compete with the chat conversation for attention.

### Existing Components to Reuse

- **`DepthMeter` component** (`apps/front/src/components/chat/DepthMeter.tsx`) — already receives `progress: number` (0-1). The `GeometricOcean` layer uses the same `depthProgress` prop from `TherapistChat`.
- **Ocean shape SVG components** (`apps/front/src/components/ocean-shapes/`) — NOT used here. The sea life creatures are CSS-only shapes, not the brand mark SVGs. These are different visual elements.
- **Existing decorative components** (`OceanDecorative.tsx`) — NOT used here. Those are static SVG illustrations at 10% opacity. The sea life layer is animated CSS creatures. Different purpose and implementation.

### File Structure

```
apps/front/src/components/sea-life/
  GeometricOcean.tsx          # Full scene container (absolute, inset-0, z-0, pointer-events-none)
  Seaweed.tsx                 # Teal stalks with sway animation
  DiamondFish.tsx             # Orange diamond body + tail, swim paths
  SchoolFish.tsx              # Pink triangle formation with individual drift
  Jellyfish.tsx               # Purple bell + tentacles, vertical drift
  Bubbles.tsx                 # Rising peach/warm bubbles
  sea-life.stories.tsx        # Storybook stories for all creatures
```

### Anti-Patterns to AVOID

```tsx
// BAD - Using SVG for creature shapes
<svg viewBox="0 0 24 24"><polygon ... /></svg>

// BAD - Hard-coded colors
<div style={{ backgroundColor: '#FF6B2B' }}>

// BAD - JavaScript animation (framer-motion, react-spring, rAF)
import { motion } from "framer-motion"

// BAD - New npm dependencies
npm install react-particles  // NO — zero new dependencies

// BAD - Adding creature tokens to global :root
:root { --seaweed-color: #00B4A6; }  // Pollutes globals

// GOOD - CSS-only shapes
<div className="w-3 h-3 rotate-45 rounded-[2px]" style={{ backgroundColor: 'var(--fish-body-color)' }} />

// GOOD - Scoped CSS custom properties
[data-slot="geometric-ocean-layer"] { --seaweed-color: var(--tertiary); }

// GOOD - Pure CSS keyframe animations
@keyframes seaweedSway { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }

// GOOD - State via data attributes
[data-depth="deep"] .seaweed-stalk { animation-duration: 7s; }
```

### Performance Considerations

- All animations use CSS `transform` and `opacity` only — these are GPU-composited and don't trigger layout/paint
- The ocean layer has `overflow: hidden` and `pointer-events: none` — no hit testing overhead
- Bubble recycling: bubbles that exit the top are repositioned via `animation-iteration-count: infinite` — no JS needed
- Fish swim keyframes use `translateX` — GPU composited
- Total DOM elements: ~35-40 divs (4 seaweed groups × 4 stalks + 3 fish × 2 parts + 9 school triangles + 2 jellies × 5 parts + 8 bubbles)

### Testing Strategy

- **Visual verification:** Storybook stories with controls for pulse/depth/dark mode
- **Reduced motion:** Verify `prefers-reduced-motion` media query disables all animations
- **Mobile:** Verify center seaweed groups hidden at < 900px
- **No functional tests needed** — this is a purely decorative, `aria-hidden` layer with no user interaction
- **Regression:** Ensure chat scroll, message rendering, input, and DepthMeter still work correctly after integration

### Previous Story Intelligence (7.15)

Story 7.15 (auth form redesign) established patterns for:
- Using semantic tokens consistently (`bg-card`, `border-border`, `text-foreground`)
- `data-slot` attributes on all component parts
- Gradient accent text using `bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`
- Dark mode handled purely via CSS custom property switching (no JS theme detection in components)
- Code review caught: missing `autoComplete` attributes, inconsistent button radius — apply same attention to detail here

### Git Intelligence (Recent Commits)

Recent commits show the codebase is mature with Epic 4 (frontend) and Epic 8 (content) complete. The most relevant recent work:
- `feat(story-4-8): message character limit with counter` — added `data-slot="char-counter"` to chat, shows the pattern for adding new elements to TherapistChat
- `feat(story-8-6): results page layout redesign` — large frontend visual change, demonstrates the pattern for CSS-heavy visual stories

### Project Structure Notes

- Component location: `apps/front/src/components/sea-life/` — new directory, matches pattern of `ocean-shapes/`, `home/`, `chat/`, `auth/`
- Storybook stories co-located in the same directory (matches `ocean-shapes.stories.tsx` pattern)
- No changes to `packages/ui/` — this is app-specific decoration, not a shared component
- CSS keyframes in `packages/ui/src/styles/globals.css` — matches existing animation definitions (`wave`, `bubble`, `float`, `shape-reveal`, etc.)

### References

- [Source: apps/front/geometric-ocean-mockup.html] — Complete design mockup with CSS keyframes, creature shapes, animation timing, opacity values, state modifiers
- [Source: _bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md#story-716] — Story specification with creature table, acceptance criteria, CSS token definitions
- [Source: apps/front/src/components/TherapistChat.tsx] — Integration target, provides `depthProgress` and message arrival events
- [Source: apps/front/src/components/chat/DepthMeter.tsx] — Sibling component using same `progress` prop pattern
- [Source: packages/ui/src/styles/globals.css] — Existing CSS keyframes and token definitions
- [Source: docs/FRONTEND.md] — `data-slot` and `data-state` conventions
- [Source: apps/front/src/components/ocean-shapes/] — Existing OCEAN shapes (NOT used here, but shows SVG component pattern)
- [Source: apps/front/.storybook/] — Storybook config, story patterns, `withThemeProvider` decorator

## Dev Agent Record

### Agent Model Used

Claude Opus 4

### Debug Log References

None required — purely decorative CSS component, no backend changes.

### Completion Notes List

- Implemented all 6 sea-life creature components (Seaweed, DiamondFish, SchoolFish, Jellyfish, Bubbles) as pure CSS-animated React components
- Created GeometricOcean scene container with data-depth and pulse state management
- Added scoped CSS custom properties for creature colors/opacities (light + dark mode bioluminescent palette) under `[data-slot="geometric-ocean-layer"]` — no `:root` pollution
- Added 15+ CSS `@keyframes` animations (seaweedSway, fishSwimA/B/C, fishBob, schoolSwim, individualDrift, jellyDriftA/B, jellyPulse, tentacleSway, bubbleRise, seaweedSwayPulse, individualScatter, jellyPulseBurst)
- Pulse state: wider seaweed sway, faster fish, school scatter, jellyfish burst — auto-reverts after 3s
- Deep state (depthProgress >= 0.6): all animations slow ~30% via `[data-depth="deep"]` CSS overrides
- `@media (prefers-reduced-motion: reduce)` disables all animations
- Mobile responsive: center seaweed groups hidden at < 900px, edge groups shift to 6px offset
- Integrated into TherapistChat: GeometricOcean positioned behind chat (z-0), chat content elevated (z-10), pulse triggers on new assistant message
- aria-hidden="true" and pointer-events: none for accessibility and non-interference
- Zero new dependencies, zero backend changes, zero SVG usage — all pure CSS shapes
- Storybook stories: full scene with depthProgress slider + pulse toggle, plus individual creature stories
- All 30 existing test files pass (327 tests), lint clean, build succeeds
- Review fix: DiamondFish now uses `clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)` for a true diamond shape + CSS border-trick triangular tail (was rotated square with rounded corners)
- Review fix: SchoolFish simplified — removed `individualDrift` animation from each triangle. Fish now move only as a group via `schoolSwim`. Pulse speeds up group instead of scattering individuals.
- Cleaned up unused CSS keyframes: `individualDrift`, `individualScatter`. Updated `fishBob` to remove redundant `rotate(45deg)`.
- User feedback: Reduced DiamondFish from 3 to 2 (removed fish C + fishSwimC keyframe + all fish-c pulse/deep overrides)
- User feedback: SchoolFish triangles now point left (direction of travel) — changed `borderLeft` to `borderRight` so the pointed end faces the swim direction (right-to-left)
- User feedback: DiamondFish tail changed from CSS border-trick triangle to a second smaller diamond shape (clip-path polygon) — each fish is now two diamonds (body + tail)
- User feedback: Scope reduced to bubbles only — removed Seaweed, DiamondFish, SchoolFish, Jellyfish components and all their CSS keyframes/tokens. GeometricOcean now renders only Bubbles. Deleted 4 component files, removed ~140 lines of CSS (12 keyframes, creature tokens, pulse/deep overrides).
- Task 12: Fixed milestone race condition — two separate useEffects (init + live-tracking) fired in same render cycle, causing live effect to overwrite pre-computed positions with `messages.length` (milestones appeared at bottom). Merged into single unified effect using `milestonesComputedForRef` for incremental scanning. Removed unused `progressPercent` destructure.
- Task 13: Moved auth handling from TherapistChat to route level. TherapistChat no longer imports `useAuth` or manages redirects — it surfaces session errors via `onSessionError` callback. The route component (`routes/chat/index.tsx`) now owns auth-based redirect decisions. Tests updated to verify callback-based pattern.
- Task 14: Fixed scrollbar overlapping messages. Moved `overflow-y-auto` to outer scroll container so scrollbar sits at viewport edge. Added `pb-[140px]` to messages for sticky input bar clearance. Centered input bar content with `max-w-[900px] mx-auto`. Fixed broken JSX nesting from incomplete prior edit.
- Task 15: Fixed input bar hidden behind messages on scroll. Root cause: input bar was a `sticky bottom-0` element inside the scroll container, which failed on scroll-up. Moved input bar out of the scroll container to be a direct flex column child — always visible at bottom regardless of scroll position. Removed `pb-[140px]` hack (replaced with `pb-6`).
- Task 16: Removed hover and pointer cursor from user messages. Changed `<button>` to `<div>`, removed `onMessageClick` prop and `handleMessageClick` function (unused dead code). Updated tests accordingly.
- Task 17: Fixed bubbles invisible in light mode. Root cause: `--bubble-border-color: #FFD6C4` was the same peach tone as the light background `#FFF8F0` — at 22% opacity, completely invisible. Changed to `rgba(0, 180, 166, 0.45)` (brand teal) with matching teal fill `rgba(0, 180, 166, 0.04)`. Bubbles now have ocean-teal coloring in light mode — visible but still ambient.
- Task 18: Fixed send button visibility in dark mode. Added `dark:shadow-[0_0_8px_rgba(0,212,200,0.3)]` (teal glow) and `dark:disabled:opacity-65` (raised from 50%). Button now has a subtle bioluminescent glow in dark mode and remains visible even when disabled.

### Change Log

- 2026-02-17: Story 7.16 implementation complete — Geometric Ocean sea life ambient layer
- 2026-02-18: Review feedback — DiamondFish: replaced rotated-square+rounded-corners with clip-path diamond polygon and triangular CSS tail. SchoolFish: removed individualDrift per-fish animation for simpler group movement. Cleaned up unused CSS keyframes (individualDrift, individualScatter).
- 2026-02-18: User feedback — DiamondFish reduced to 2 fish (removed fish C). SchoolFish triangles now point in direction of travel (left-pointing for right-to-left swim).
- 2026-02-18: User feedback — DiamondFish tail changed from triangle to second diamond shape. Each fish is now two diamond polygons (body + tail).
- 2026-02-18: User feedback — Scope reduced to bubbles only. Deleted Seaweed.tsx, DiamondFish.tsx, SchoolFish.tsx, Jellyfish.tsx. Removed all non-bubble CSS keyframes and creature tokens. GeometricOcean now renders only Bubbles.
- 2026-02-18: Bug fix — Milestone messages now appear at correct historical positions on session resumption. Added pre-computation that walks resumed message history to determine the array index where each milestone threshold was first crossed, seeding `shownMilestones` before the live-tracking useEffect fires.
- 2026-02-18: Bug fix v2 — Milestone race condition: init and live-tracking useEffects both fired in same render cycle, live effect overwrote positions. Merged into single unified useEffect with incremental scan tracking. Milestones now correctly appear at historical positions on resume.
- 2026-02-18: Refactor — Moved auth handling from TherapistChat to route level. TherapistChat uses `onSessionError` callback; route component owns auth-based redirect decisions.
- 2026-02-18: Bug fix — Scrollbar overlapping messages. Restructured TherapistChat layout: `overflow-y-auto` on outer scroll container (scrollbar at viewport edge), `pb-[140px]` on messages for input bar clearance, input bar content centered with `max-w-[900px] mx-auto`.
- 2026-02-18: Bug fix — Input bar hidden behind messages on scroll-up. Moved input bar from inside scroll container (sticky) to outside as flex column sibling. Input now always visible at bottom. Removed `pb-[140px]` padding hack.
- 2026-02-18: UX cleanup — Removed hover ring and pointer cursor from user messages. Changed `<button>` to `<div>`, removed unused `onMessageClick` prop and handler. Updated tests.
- 2026-02-18: Bug fix — Bubbles invisible in light mode. Changed light mode bubble tokens from peach (`#FFD6C4`) to teal (`rgba(0, 180, 166, 0.45)`) for contrast against warm peach background.
- 2026-02-18: Bug fix — Send button not visible in dark mode. Added teal glow shadow + raised disabled opacity from 50% to 65%.

### File List

- apps/front/src/components/sea-life/GeometricOcean.tsx (new — bubbles only)
- apps/front/src/components/sea-life/Bubbles.tsx (new)
- apps/front/src/components/sea-life/sea-life.stories.tsx (new — full scene + BubblesOnly story)
- apps/front/src/components/TherapistChat.tsx (modified — added GeometricOcean integration + pulse state + milestone fix + removed auth handling)
- apps/front/src/components/TherapistChat.test.tsx (modified — updated session error tests for callback pattern, removed useAuth mock)
- apps/front/src/routes/chat/index.tsx (modified — added auth-based session error redirect handling)
- packages/ui/src/styles/globals.css (modified — bubble tokens + bubbleRise keyframe only)
