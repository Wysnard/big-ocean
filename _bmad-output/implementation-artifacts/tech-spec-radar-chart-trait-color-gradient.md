---
title: 'Radar Chart Trait-Color Gradient Enhancement'
slug: 'radar-chart-trait-color-gradient'
created: '2026-02-16'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['recharts (RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis)', 'react 19', 'SVG (defs, path, line, radialGradient)', 'CSS variables (--trait-* tokens)', 'shadcn chart (ChartContainer)']
files_to_modify: ['apps/front/src/components/results/PersonalityRadarChart.tsx', 'apps/front/src/components/results/PersonalityRadarChart.test.tsx']
code_patterns: ['Recharts shape prop for custom SVG rendering', 'Recharts dot prop for per-vertex rendering', 'CSS variable trait colors via getTraitColor()', 'TRAIT_NAMES ordered array for consistent axis mapping', 'data-slot attribute convention', 'shadcn ChartContainer + ChartConfig pattern']
test_patterns: ['@testing-library/react render + screen queries', 'vitest describe/it', 'jsdom environment (// @vitest-environment jsdom)', 'ResizeObserver polyfill in beforeAll', 'container.querySelector for data-slot assertions']
---

# Tech-Spec: Radar Chart Trait-Color Gradient Enhancement

**Created:** 2026-02-16

## Overview

### Problem Statement

The PersonalityRadarChart currently uses a single flat color (`var(--trait-openness)`) for the entire polygon fill and stroke. All 5 trait axes look identical — there's no visual mapping between each trait's color identity and its position on the chart. The mockup specifies that each trait axis should have its own color gradient where higher scores produce more intense coloring in that trait's color.

### Solution

Replace the single-color `<Radar>` fill/stroke with a custom `shape` prop that renders 5 triangular SVG pie slices from the chart center to each pair of adjacent vertices. Each slice uses its trait's color with opacity scaled by score magnitude. Per-edge stroke segments are rendered as individual `<line>` elements with per-trait coloring. The existing per-vertex colored dots remain unchanged.

### Scope

**In Scope:**
- Custom `shape` prop on `<Radar>` rendering 5 triangular pie slices with per-trait fill colors
- Fill opacity proportional to trait score (higher score = more intense trait color)
- Per-edge stroke coloring via individual `<line>` SVG elements between vertices
- Keep existing per-vertex colored dot rendering
- Update `PersonalityRadarChart.tsx` only
- Update existing test file if assertions break

**Out of Scope:**
- No changes to other results page components
- No changes to trait color CSS token definitions (`globals.css`)
- No new component files created
- No changes to the chart card layout, title, or tick labels

## Context for Development

### Codebase Patterns

- **Recharts `shape` prop:** The `<Radar>` component accepts a `shape` prop (React element or function) that receives computed `{ points, cx, cy }` — the vertex coordinates already mapped from polar data. No polar math needed.
- **Recharts `dot` prop:** Already used (lines 82-95) to render per-vertex colored circles. Same pattern applies for `shape`.
- **SVG `<defs>` in Recharts:** Standard SVG elements like `<defs>` can be placed as direct children of `<RadarChart>` — they pass through to the underlying SVG DOM.
- **CSS variable paint:** Current code uses `var(--trait-openness)` as SVG fill/stroke values. CSS variables work in SVG `fill` and `stroke` attributes.
- **Trait color system:** `getTraitColor(traitName)` returns `var(--trait-{name})`. Colors defined in `packages/ui/src/styles/globals.css` lines 111-115 (oklch values). Light and dark mode variants exist.
- **TRAIT_NAMES ordering:** `['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']` — this matches the `chartData` array order and therefore the Recharts `points` array order.
- **ChartContainer:** shadcn wrapper (`packages/ui/src/components/chart.tsx`) provides `ResponsiveContainer` + theme CSS injection. The `<RadarChart>` is rendered inside it.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `apps/front/src/components/results/PersonalityRadarChart.tsx` | **Primary file to modify** — current radar chart component |
| `apps/front/src/components/results/PersonalityRadarChart.test.tsx` | Existing test file — verify no breakage |
| `packages/domain/src/utils/trait-colors.ts` | `getTraitColor()` utility — returns CSS variable references |
| `packages/domain/src/constants/big-five.ts` | `TRAIT_NAMES` ordered array, `TraitName` type |
| `packages/ui/src/components/chart.tsx` | shadcn ChartContainer wrapper |
| `packages/ui/src/styles/globals.css` (lines 110-169) | Trait color CSS variable definitions |

### Technical Decisions

1. **`shape` prop over SVG `<defs>` gradient:** SVG only supports `<linearGradient>` and `<radialGradient>` — neither provides angular/sector-based coloring. CSS `conic-gradient()` cannot be used inside SVG `<defs>`. The Recharts `shape` prop renders custom SVG geometry with access to computed vertex coordinates, making per-sector fills straightforward.

2. **Triangular pie slices for fill:** Each of the 5 slices is a `<path>` triangle from center `(cx, cy)` to vertex `i` to vertex `i+1`. The slice is filled with `getTraitColor(TRAIT_NAMES[i])` at a base opacity of ~0.25, with the visual "intensity = score" effect achieved naturally: higher scores push the vertex further from center, making the colored triangle larger.

3. **Individual `<line>` elements for stroke:** Since a single `<polygon>` can only have one `stroke` color, we render 5 separate `<line>` elements between consecutive vertices, each using its trait color as the stroke. This gives per-edge coloring.

4. **Score-based opacity scaling:** Base `fillOpacity` of 0.15, scaled up to 0.35 based on the average of the two adjacent vertex scores. Formula: `0.15 + (avgScore / MAX_TRAIT_SCORE) * 0.20`. This creates the "higher score = more color" effect beyond just the geometric area difference.

5. **Stroke color assignment:** Each edge between vertex `i` and vertex `i+1` uses the color of the trait at vertex `i` (the "source" vertex). This creates a clean visual where each trait's color extends along its outgoing edge.

## Implementation Plan

### Tasks

- [x] Task 1: Create the `MultiColorRadarShape` component function
  - File: `apps/front/src/components/results/PersonalityRadarChart.tsx`
  - Action: Define a new function component above `PersonalityRadarChart` that accepts Recharts shape props `{ points, cx, cy }` and the `chartData` array.
  - Details:
    - Props type: `{ points: Array<{ x: number; y: number }>; cx: number; cy: number }`
    - Access `chartData` via closure (defined in parent scope) or pass as a prop via wrapper
    - Render a `<g>` containing:
      - 5 `<path>` elements: triangular slices `M${cx},${cy} L${points[i].x},${points[i].y} L${points[(i+1)%5].x},${points[(i+1)%5].y} Z`
      - Each `<path>` filled with `chartData[i].fill` (which is `getTraitColor(traitName)`)
      - `fillOpacity` per slice: `0.15 + ((chartData[i].score + chartData[(i+1)%5].score) / (2 * MAX_TRAIT_SCORE)) * 0.20`
      - 5 `<line>` elements: from `points[i]` to `points[(i+1)%5]`, stroke color = `chartData[i].fill`, strokeWidth = 2
    - Add `data-slot="radar-shape"` to the root `<g>`

- [x] Task 2: Wire the custom shape into the `<Radar>` component
  - File: `apps/front/src/components/results/PersonalityRadarChart.tsx`
  - Action: Replace the current `<Radar>` element's `fill`, `fillOpacity`, `stroke`, `strokeWidth` props with a `shape` prop pointing to `MultiColorRadarShape`.
  - Details:
    - Remove: `fill="var(--trait-openness)"`, `fillOpacity={0.25}`, `stroke="var(--trait-openness)"`, `strokeWidth={2}`
    - Add: `shape={<MultiColorRadarShape />}` (or use a render function that forwards Recharts props + chartData)
    - Keep `dataKey="score"` (Recharts still needs this to compute vertex positions)
    - Keep existing `dot` prop unchanged (per-vertex colored circles remain as-is)
    - Set `fill="none"` and `stroke="none"` on `<Radar>` to prevent Recharts from rendering its default polygon behind the custom shape

- [x] Task 3: Verify chartData availability in shape renderer
  - File: `apps/front/src/components/results/PersonalityRadarChart.tsx`
  - Action: Ensure `chartData` is accessible inside `MultiColorRadarShape`. Since `chartData` is built with `TRAIT_NAMES.map(...)` inside `PersonalityRadarChart`, and `shape` receives Recharts-computed props, the simplest approach is:
    - Option A (recommended): Define `MultiColorRadarShape` as an inline function inside `PersonalityRadarChart` that closes over `chartData`. Wrap with `useCallback` or extract to avoid unnecessary re-creation.
    - Option B: Pass `chartData` via a wrapper — `shape={(props) => <MultiColorRadarShape {...props} chartData={chartData} />}`
  - Notes: The `points` array from Recharts is guaranteed to be in the same order as `chartData` (both follow `TRAIT_NAMES` order via the `data` prop on `<RadarChart>`).

- [x] Task 4: Update tests to verify multi-color rendering
  - File: `apps/front/src/components/results/PersonalityRadarChart.test.tsx`
  - Action: Verify existing tests still pass. Add new test cases:
    - Test that SVG `<path>` elements exist (5 triangular slices): `container.querySelectorAll('path').length >= 5`
    - Test that SVG `<line>` elements exist for strokes (5 edges): `container.querySelectorAll('line').length >= 5`
    - Test that `data-slot="radar-shape"` is present in the rendered output
  - Notes: jsdom doesn't render visual output, so we verify DOM structure only. Visual verification is manual (dev server).

- [x] Task 5: Manual visual verification
  - Action: Run `pnpm dev --filter=front`, navigate to results page (use seeded test assessment), visually verify:
    - Each pie slice shows a different trait color
    - Higher-scoring traits have noticeably more color saturation
    - Stroke edges show per-trait colors
    - Vertex dots remain unchanged (per-trait colored circles)
    - Dark mode: colors adapt via CSS variable overrides
    - The chart doesn't look broken or have overlapping artifacts

### Acceptance Criteria

- [x] AC 1: Given the radar chart renders with 5 trait scores, when I view the filled polygon area, then I see 5 distinct color segments — each matching its corresponding trait color (openness=purple, conscientiousness=orange, extraversion=pink, agreeableness=teal, neuroticism=navy).

- [x] AC 2: Given a trait has a high score (e.g. 100/120), when I view its pie slice segment, then the colored area is visually larger AND more opaque compared to a low-scoring trait (e.g. 30/120), creating an "intensity = score" effect.

- [x] AC 3: Given the radar chart renders, when I inspect the stroke (border line) of the polygon, then each edge between two vertices uses the trait color of the source vertex, resulting in 5 differently-colored edge segments.

- [x] AC 4: Given the radar chart renders, when I inspect the vertex dots, then each dot is filled with its trait color (unchanged from current behavior — regression check).

- [x] AC 5: Given the radar chart renders in dark mode, when I view the chart, then the trait colors adapt correctly via the CSS variable dark mode overrides (e.g. openness changes from `oklch(0.55 0.24 293)` to `oklch(0.67 0.20 293)`).

- [x] AC 6: Given the existing test suite runs (`pnpm test:run`), when I execute all tests, then all existing tests pass with no regressions, and new tests verify the multi-color SVG structure (5 path elements, 5 line elements, radar-shape data-slot).

## Additional Context

### Dependencies

- **No new dependencies required.** All functionality uses existing Recharts API (`shape` prop) and SVG primitives already available.
- **Existing dependencies used:** `recharts` (RadarChart, Radar), `@workspace/domain` (getTraitColor, TRAIT_NAMES), `@workspace/ui` (ChartContainer, Card).

### Testing Strategy

- **Unit tests (automated):** Verify SVG DOM structure — 5 `<path>` slices, 5 `<line>` stroke segments, `data-slot="radar-shape"` attribute. Run via `pnpm test:run --filter=front`.
- **Visual testing (manual):** Start dev server, navigate to results page with seeded data, verify multi-color appearance in both light and dark modes. Check that the overall shape remains a pentagon and colors blend naturally at edges.
- **Regression:** Existing 2 tests in `PersonalityRadarChart.test.tsx` must continue to pass (data-slot check, title text check).

### Notes

- **SVG conic gradient limitation:** SVG natively supports only `<linearGradient>` and `<radialGradient>`. True angular gradients require the pie-slice decomposition approach we're using. This is a well-known SVG constraint.
- **Color blending at edges:** Where two adjacent trait slices meet, there will be a sharp boundary (not a smooth gradient blend). This is intentional — each trait has a distinct identity. If smoother blending is desired in the future, a post-processing SVG `<filter>` with `feGaussianBlur` could soften edges, but that's out of scope.
- **Performance:** Rendering 5 paths + 5 lines + 5 dots (15 SVG elements) instead of 1 polygon + 5 dots (6 SVG elements) is negligible overhead. RadarChart is a single static render, not animated.
- **Recharts `shape` prop types:** Recharts doesn't export a strict type for shape props. Use inline `{ points: Array<{x: number; y: number}>; cx: number; cy: number }` type annotation. Cast to `any` if Recharts passes additional props that conflict — add comment explaining the Recharts typing gap.

## Review Notes
- Adversarial review completed
- Findings: 14 total, 4 fixed, 10 skipped (noise/undecided)
- Resolution approach: auto-fix
- Fixed: F1 (TRAIT_LABELS typed as Record<TraitName, string>), F2 (ChartDataItem.trait typed as TraitName), F4 (bounds check in dot callback), F6 (key prop on tick <g> element)
