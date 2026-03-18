# Sprint Change Proposal: Complete OCEAN Shape Library

**Date:** 2026-03-19
**Triggered by:** Storybook review — 10 of 15 OCEAN code letter shapes missing
**Proposed by:** Vincentlay
**Scope classification:** Minor — direct implementation by dev team

---

## Section 1: Issue Summary

**Problem statement:** The UX spec (section 9.2, lines 1125-1145) defines 15 unique geometric shapes — one per OCEAN code letter. Only 5 are implemented (the High-level shapes: O=Circle, C=HalfCircle, E=Rectangle, A=Triangle, N=Diamond). The remaining 10 letters reuse the same shape with size variation, contradicting the spec which states *"each letter has its own filled geometric shape — an abstract geometric interpretation of the letter itself."*

**Context:** Discovered during Storybook review after completing Sprint Step 1 PR verification. The spec explicitly notes: *"Existing High-level shapes (O, C, E, A, N) are already in the codebase. 10 new shapes to create."*

**Evidence:**
- UX spec lines 1125-1145: full 15-shape definition table
- `GeometricSignature.tsx`: uses `LETTER_TO_SIZE_TIER` (size variation, not shape variation)
- `archetype-card-template.tsx`: 5 hardcoded inline SVGs with size variation
- Storybook screenshot confirms only size changes between levels

---

## Section 2: Impact Analysis

- **Epics:** No changes — this is missing implementation within existing scope (originally Story 7-4)
- **PRD / Architecture / UX Design:** No changes — the UX spec already defines all 15 shapes correctly
- **Code changes:** 10 new SVG components + 2 component refactors (GeometricSignature, ArchetypeCardTemplate) + test/storybook updates

---

## Section 3: Recommended Approach

**Direct Adjustment** — add Story 32-7b to create the 10 missing shapes and update consuming components.

- Effort: **Low-Medium** (10 SVGs are simple filled paths + 2 refactors)
- Risk: **Low** (visual-only change, no data/API impact)
- Timeline: Fits in Step 2 alongside other parallel stories

---

## Section 4: Detailed Change Proposals

### 4.1 Story Definition

**Story 32-7b:** Complete OCEAN Shape Library (10 missing shapes)

### 4.2 New SVG Components (10 files)

Create in `apps/front/src/components/ocean-shapes/`:

| Component | Letter | Shape | Trait + Level |
|-----------|--------|-------|---------------|
| OceanCross.tsx | T | Equilateral cross upright | Openness — Low |
| OceanCutSquare.tsx | M | Square with inverted triangle cut | Openness — Mid |
| OceanThreeQuarterSquare.tsx | F | Three-quarter square | Conscientiousness — Low |
| OceanDoubleQuarter.tsx | S | Two quarter-circles outward | Conscientiousness — Mid |
| OceanOval.tsx | I | Vertical ellipse | Extraversion — Low |
| OceanQuarterCircle.tsx | B | Quarter-circle | Extraversion — Mid |
| OceanReversedHalfCircle.tsx | D | Half-circle reversed | Agreeableness — Low |
| OceanLollipop.tsx | P | Square on one stick | Agreeableness — Mid |
| OceanInvertedTriangle.tsx | V | Inverted triangle | Neuroticism — Mid |
| OceanTable.tsx | R | Square on two sticks | Neuroticism — Low |

### 4.3 GeometricSignature Refactor

- Replace `LETTER_TO_SIZE_TIER` / `SIZE_MULTIPLIERS` with `LETTER_TO_SHAPE` map (15 entries)
- Each letter maps to its own component
- All shapes render at uniform `baseSize` (no size tiers)

### 4.4 ArchetypeCardTemplate Refactor

- Replace `LETTER_SIZE_MAP` / `getShapeSizeFromLetter` with `LETTER_TO_SVG_RENDERER` map
- Each letter renders its own inline SVG path (Satori-compatible)
- Uniform shape size; score-based sizing still available for personalized mode
- Remove stale T/R collision comments

### 4.5 Storybook & Tests

- Update OceanShapes.stories.tsx: replace TODO placeholders with real components
- Update GeometricSignature.test.tsx: verify letter → shape mapping instead of size tiers
- Verify ArchetypeCardTemplate stories render correctly

---

## Section 5: Implementation Handoff

**Scope:** Minor — direct implementation by dev team
**Implementation order:**
1. Create 10 SVG components (parallel, independent)
2. Update GeometricSignature + ArchetypeCardTemplate
3. Update barrel exports, tests, storybook
4. Visual verification in Storybook

**Success criteria:**
- All 15 shapes visible and distinct in Storybook Shape Library
- GeometricSignature renders unique shapes per letter
- Archetype cards render unique shapes per letter
- All existing tests pass
