# Story 32-7b: Complete OCEAN Shape Library

**Status:** ready-for-dev
**Epic:** 7 (Frontend Visual Design System)
**Sprint Step:** 2
**Priority:** Medium
**Effort:** Low-Medium

---

## User Story

As a user viewing my personality results or archetype card,
I want each OCEAN code letter to have its own distinct geometric shape,
So that my personality signature is visually unique and not just a size variation of the same 5 shapes.

## Background

The UX spec (section 9.2) defines 15 unique geometric shapes -- one per OCEAN code letter. Only 5 are implemented (the High-level shapes: O=Circle, C=HalfCircle, E=Rectangle, A=Triangle, N=Diamond). The remaining 10 letters reuse the same shape with size variation, contradicting the spec which states "each letter has its own filled geometric shape."

**Source:** Sprint Change Proposal (sprint-change-proposal-shape-library-2026-03-19.md)

## Acceptance Criteria

### AC1: 10 New SVG Shape Components
**Given** the 10 missing OCEAN code letters (T, M, F, S, I, B, D, P, V, R)
**When** the shape library is complete
**Then** each letter has its own unique SVG component in `apps/front/src/components/ocean-shapes/`:

| Component | Letter | Shape | Trait + Level |
|-----------|--------|-------|---------------|
| OceanCross.tsx | T | Equilateral cross upright | Openness - Low |
| OceanCutSquare.tsx | M | Square with inverted triangle cut | Openness - Mid |
| OceanThreeQuarterSquare.tsx | F | Three-quarter square | Conscientiousness - Low |
| OceanDoubleQuarter.tsx | S | Two quarter-circles outward | Conscientiousness - Mid |
| OceanOval.tsx | I | Vertical ellipse | Extraversion - Low |
| OceanQuarterCircle.tsx | B | Quarter-circle | Extraversion - Mid |
| OceanReversedHalfCircle.tsx | D | Half-circle reversed | Agreeableness - Low |
| OceanLollipop.tsx | P | Square on one stick | Agreeableness - Mid |
| OceanInvertedTriangle.tsx | V | Inverted triangle | Neuroticism - Mid |
| OceanTable.tsx | R | Square on two sticks | Neuroticism - Low |

**And** each component follows the same interface pattern as existing shapes (`size`, `color`, `className` props)
**And** each component has `data-slot` attribute following the `ocean-shape-{letter}` convention
**And** each component uses `aria-hidden="true"` for accessibility

### AC2: GeometricSignature Refactored to Use Per-Letter Shapes
**Given** the GeometricSignature component currently uses `LETTER_TO_SIZE_TIER` for size variation
**When** the refactor is complete
**Then** a `LETTER_TO_SHAPE` map (15 entries) maps each letter to its own component
**And** the `SIZE_MULTIPLIERS` and `getShapeSize` logic is removed
**And** all shapes render at uniform `baseSize` (no size tiers)
**And** existing props (`oceanCode`, `baseSize`, `animate`, `archetypeName`, `className`) continue to work

### AC3: ArchetypeCardTemplate Refactored to Use Per-Letter Shapes
**Given** the ArchetypeCardTemplate currently uses `LETTER_SIZE_MAP` / `getShapeSizeFromLetter` with only 5 hardcoded inline SVGs
**When** the refactor is complete
**Then** a `LETTER_TO_SVG_RENDERER` map renders the correct inline SVG path for each of the 15 letters
**And** all shapes render at uniform size in generic mode
**And** `traitScores`-based sizing still works in personalized mode
**And** stale T/R collision comments are removed

### AC4: Barrel Exports Updated
**Given** the 10 new shape components
**When** the barrel export file (`index.ts`) is updated
**Then** all 15 shape components are exported

### AC5: Storybook Updated
**Given** the OceanShapes.stories.tsx currently shows TODO placeholders for 10 shapes
**When** the stories are updated
**Then** all 15 shapes render with their real components (no TODO placeholders)

### AC6: Tests Updated
**Given** the GeometricSignature.test.tsx tests size tiers
**When** tests are updated
**Then** tests verify letter-to-shape mapping (each letter renders its unique shape component)
**And** all existing test scenarios continue to pass with updated assertions

### AC7: All Existing Tests Pass
**Given** the refactor touches GeometricSignature and ArchetypeCardTemplate
**When** the full test suite is run
**Then** all tests pass (including archetype-card-template.test.tsx)

## Tasks

### Task 1: Create 10 New SVG Shape Components
1.1. Create `OceanCross.tsx` (T - equilateral cross upright)
1.2. Create `OceanCutSquare.tsx` (M - square with inverted triangle cut)
1.3. Create `OceanThreeQuarterSquare.tsx` (F - three-quarter square, one side missing)
1.4. Create `OceanDoubleQuarter.tsx` (S - two quarter-circles facing outward)
1.5. Create `OceanOval.tsx` (I - vertical ellipse)
1.6. Create `OceanQuarterCircle.tsx` (B - quarter-circle)
1.7. Create `OceanReversedHalfCircle.tsx` (D - half-circle reversed/facing opposite direction)
1.8. Create `OceanLollipop.tsx` (P - square on one stick)
1.9. Create `OceanInvertedTriangle.tsx` (V - inverted triangle, point down)
1.10. Create `OceanTable.tsx` (R - square on two sticks)

### Task 2: Update Barrel Exports
2.1. Add all 10 new components to `apps/front/src/components/ocean-shapes/index.ts`

### Task 3: Refactor GeometricSignature
3.1. Replace `LETTER_TO_SIZE_TIER` / `SIZE_MULTIPLIERS` / `getShapeSize` with `LETTER_TO_SHAPE` map (15 entries)
3.2. Update `shapes` array to use `LETTER_TO_SHAPE[letter]` for per-letter component selection
3.3. All shapes render at uniform `baseSize`

### Task 4: Refactor ArchetypeCardTemplate
4.1. Replace `LETTER_SIZE_MAP` / `getShapeSizeFromLetter` with `LETTER_TO_SVG_RENDERER` map
4.2. Each letter renders its own inline SVG path (Satori-compatible, no CSS transforms)
4.3. Remove stale T/R collision comments and fix code
4.4. Uniform shape size in generic mode; `traitScores`-based sizing in personalized mode

### Task 5: Update Tests
5.1. Rewrite GeometricSignature.test.tsx to verify letter-to-shape mapping instead of size tiers
5.2. Verify ArchetypeCardTemplate tests still pass

### Task 6: Update Storybook
6.1. Replace TODO placeholders in OceanShapes.stories.tsx with real components

## Technical Notes

- All new shapes follow the existing pattern: `size`, `color`, `className` props, `viewBox="0 0 24 24"`, `aria-hidden="true"`, `data-slot`, `cn("shrink-0", className)`
- ArchetypeCardTemplate uses inline SVG (Satori requirement) -- no React component imports, only `<svg>` elements with `<path>`, `<polygon>`, `<circle>`, `<rect>`, `<ellipse>`
- The `OceanShapeSet` component (logo mark) is NOT affected -- it always shows the 5 High-level shapes
- This is a frontend-only change -- no backend, API, or database modifications
