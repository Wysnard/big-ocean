# Story 32-2: Results Page — Scientific Section

## Status: ready-for-dev

## Summary

Enhance the existing results page Scientific Section to satisfy all acceptance criteria from Epic 3, Story 3.2. The core components (`PersonalityRadarChart`, `ConfidenceRingCard`, `TraitCard`, `DetailZone`, `EvidencePanel`, `FacetScoreBar`) already exist and are wired into the `ProfileView` layout. This story fills remaining gaps: accessible radar chart with `role="img"`, `aria-label`, and a data table fallback; keyboard-navigable trait cards with `aria-expanded`; evidence panel rendered as `role="dialog"` with focus trap and `aria-labelledby`; facet bar left-to-right animation with 50ms stagger; confidence ring clockwise draw animation; `prefers-reduced-motion` instant-cut fallback for all animations; and comprehensive test coverage.

## Acceptance Criteria

**AC-1:** Given a user views the results page, when the scientific section renders, then a radar chart (Recharts, lines-only style) displays 5 trait scores as a single polygon, and a confidence ring shows overall assessment confidence (8px stroke, rounded caps, clockwise draw animation). Radar and confidence display side-by-side above sm breakpoint, stacked on mobile.

**AC-2:** Given a user clicks a trait card, when the detail zone expands, then 6 facet bars are displayed for that trait (3px height, solid trait color fill, left-to-right animation with 50ms stagger). Only one trait card is expanded at a time (clicking another collapses the current). The trait card is keyboard navigable (Tab + Enter) with `aria-expanded` state.

**AC-3:** Given a user clicks a facet within an expanded detail zone, when the evidence panel opens, then it renders as `role="dialog"` with focus trap and `aria-labelledby` to the facet name. Evidence records from the conversation are displayed with deviation, strength, and domain. Evidence is fetched on demand (not preloaded with results).

**AC-4:** Given score visualizations are rendered, when a screen reader encounters them, then the radar chart has `role="img"` with `aria-label` and a data table fallback. Trait bars and facet bars have text alternatives (NFR22). Score levels pair with text labels, not color-only indicators.

**AC-5:** Given all animations in this section, when `prefers-reduced-motion` is enabled, then all animations use instant-cut fallback (radar reveal, bar animations, facet cascade, confidence ring draw).

## Tasks

### Task 1: Add accessible data table fallback to PersonalityRadarChart

**File:** `apps/front/src/components/results/PersonalityRadarChart.tsx`

Add a visually hidden data table (`sr-only`) that provides screen reader users with the raw trait scores. The chart already has `role="img"` and `aria-label` — verify these are present and correct. Add the `<table>` inside the card below the chart.

**Subtasks:**
1. Write failing test for data table presence inside radar chart (check for `<table>` with trait names and scores)
2. Implement visually hidden data table with trait name, score, and level columns
3. Verify existing `role="img"` and `aria-label` are correct

### Task 2: Ensure TraitCard keyboard navigation and aria-expanded

**File:** `apps/front/src/components/results/TraitCard.tsx`

The TraitCard already renders as a `<button>` with `aria-expanded`. Verify and test that:
- Tab navigation works (button is natively focusable)
- Enter/Space toggles the detail zone
- `aria-expanded` reflects `isSelected` state
- `aria-label` includes trait name, score, level label, and confidence

**Subtasks:**
1. Write failing tests for `aria-expanded="true"` when selected and `aria-expanded="false"` when not
2. Write test for keyboard Enter key toggling trait
3. Verify existing implementation satisfies requirements (fix if needed)

### Task 3: Convert EvidencePanel to role="dialog" with focus trap

**File:** `apps/front/src/components/results/EvidencePanel.tsx`

Add `role="dialog"`, `aria-labelledby` pointing to a heading ID with the facet name, and focus trap behavior. When opened, focus should move to the panel. When closed via Escape or close button, focus returns to the triggering facet.

**Subtasks:**
1. Write failing test for `role="dialog"` and `aria-labelledby` attributes
2. Write failing test for Escape key closing the panel
3. Implement `role="dialog"`, `aria-labelledby` with heading ID, and focus trap via `useEffect`
4. Add Escape key handler to close the panel

### Task 4: Add facet bar left-to-right animation with 50ms stagger

**File:** `apps/front/src/components/results/FacetScoreBar.tsx`

Add a CSS animation that fills the facet bar from left to right when it appears. Support a `staggerIndex` prop so bars can be staggered by 50ms. Use `motion-safe:` prefix for all animation classes and respect `prefers-reduced-motion` with instant fill.

**Subtasks:**
1. Write failing test for `staggerIndex` prop acceptance
2. Add `staggerIndex` prop and CSS animation-delay calculation
3. Add `motion-safe:` transition classes for the bar fill
4. Update DetailZone to pass `staggerIndex` to each FacetScoreBar

### Task 5: Add confidence ring clockwise draw animation

**File:** `apps/front/src/components/results/ConfidenceRingCard.tsx`

The confidence ring already renders via Recharts RadialBarChart. Add a CSS animation that draws the ring clockwise on mount. Use `motion-safe:` prefix and provide instant-cut for `prefers-reduced-motion`.

**Subtasks:**
1. Write failing test that the confidence ring card renders with expected animation class
2. Add CSS keyframe animation for stroke-dashoffset clockwise reveal
3. Wrap in `motion-safe:` to respect reduced motion

### Task 6: Ensure all animations have prefers-reduced-motion fallback

**Files:** All modified component files

Audit all animation additions from Tasks 4-5 and verify they use `motion-safe:` Tailwind prefix or equivalent CSS media query. The existing codebase already uses `motion-safe:` consistently.

**Subtasks:**
1. Write test that verifies motion-safe class prefixes are present on animated elements
2. Audit and fix any animations missing reduced-motion fallback

### Task 7: Add text alternatives for score visualizations

**Files:** `apps/front/src/components/results/FacetScoreBar.tsx`, `apps/front/src/components/results/TraitCard.tsx`

Ensure all score bars have `aria-label` or `aria-valuetext` attributes with the score value and level. Score levels must pair with text labels (already implemented via level pills in TraitCard — verify facet bars also have text labels).

**Subtasks:**
1. Write failing test for aria attributes on facet score bars
2. Add `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label` to facet bar elements
3. Verify trait card score bars have proper text alternatives
