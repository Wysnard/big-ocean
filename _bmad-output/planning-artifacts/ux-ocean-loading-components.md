# UX Spec: Ocean Loading Components

**Status:** Draft
**Author:** Sally (UX Designer)
**Date:** 2026-03-23
**Scope:** Two new reusable loading components for `packages/ui`

---

## Overview

Replace generic spinners and skeletons with branded loading components built on the Ocean Hieroglyph system. Two components with shared visual DNA — same glyphs, same trait colors, different choreography.

| Component | Replaces | Loading Type | Key Motion |
|-----------|----------|-------------|------------|
| `OceanSpinner` | Spinners (`Loader2`) | Indeterminate | SVG morph cycle |
| `OceanSkeleton` | Skeleton placeholders | Determinate / Auto | Staggered reveal |

---

## 1. OceanSpinner (Reveal Cycle)

### Purpose

Indeterminate loading indicator. Drop-in replacement for any spinner. Cycles through hieroglyphs using **flubber SVG path morphing** — each shape smoothly warps into the next.

### Behavior

1. Render a single SVG centered in the container
2. Display the first glyph from `code`
3. After `interval` ms, morph into the next glyph's geometry over `morphDuration` ms
4. Simultaneously crossfade to the next glyph's trait color
5. Loop indefinitely through all glyphs in `code`
6. Between morphs, apply a subtle `breathe` scale pulse (existing keyframe)
7. Respect `prefers-reduced-motion`: fall back to simple opacity crossfade (no morph, no breathe)

### Morph Details

**Library:** [flubber](https://github.com/veltman/flubber) — handles arbitrary SVG shape interpolation.

**Challenge:** Current hieroglyph definitions use mixed SVG primitives (`circle`, `rect`, `ellipse`, `polygon`, `path`). Flubber requires path strings.

**Solution:** Create a normalized path-string lookup (`OCEAN_HIEROGLYPH_PATHS`) that converts all 15 hieroglyphs to `<path d="...">` equivalents. This is a one-time data transformation in the domain layer. The original `OCEAN_HIEROGLYPHS` definitions remain untouched.

**Multi-element shapes** (S, P, R have 2-3 SVG elements): Merge into a single compound path string for flubber compatibility. Flubber's `combine` or manual path concatenation handles this.

**Morph timeline per glyph:**
```
|-- breathe hold (interval - morphDuration) --|-- morph to next (morphDuration) --|
```

### Component API

```tsx
interface OceanSpinnerProps {
  /** Hieroglyph letters to cycle through. Default: "OCEAN" */
  code?: string;
  /** Glyph size in px. Default: 32 */
  size?: number;
  /** Total time per glyph in ms (hold + morph). Default: 800 */
  interval?: number;
  /** Duration of the morph transition in ms. Default: 400 */
  morphDuration?: number;
  /** Monochrome mode — uses currentColor, no trait colors. Default: false */
  mono?: boolean;
  /** Additional CSS classes */
  className?: string;
}
```

### Usage Examples

```tsx
// Default — OCEAN cycle, 32px, trait colors
<OceanSpinner />

// Large, slow cycle
<OceanSpinner size={48} interval={1200} />

// Inline spinner — small, monochrome, inherits text color
<OceanSpinner size={16} mono />

// Custom code
<OceanSpinner code="OCEA" size={24} />

// Inside a button
<Button disabled>
  <OceanSpinner size={16} mono />
  Processing...
</Button>
```

### Visual Spec

- SVG renders at `size × size` px inside an inline-flex container
- `fill="currentColor"` — color controlled via CSS
- When `mono=false`: each glyph's color transitions to the next trait color during morph
- When `mono=true`: inherits parent's `currentColor`, no color transitions
- Breathe pulse: scale 1 → 1.05 → 1 (subtle, softer than the existing `breathe` keyframe's 1.07)
- viewBox: `0 0 24 24` (matches all hieroglyph definitions)

### Color Mapping

Each letter in the code maps to a trait color via its position in the OCEAN order:

| Position | Trait | CSS Variable |
|----------|-------|-------------|
| 1st letter | Openness | `--trait-openness` |
| 2nd letter | Conscientiousness | `--trait-conscientiousness` |
| 3rd letter | Extraversion | `--trait-extraversion` |
| 4th letter | Agreeableness | `--trait-agreeableness` |
| 5th letter | Neuroticism | `--trait-neuroticism` |

If `code` has fewer than 5 letters, only map up to the code length. Each glyph gets the trait color of its position as it appears.

### Accessibility

- `role="status"` on the container
- `aria-label="Loading"` (overridable via props)
- `aria-hidden` on the SVG itself (decorative)
- `prefers-reduced-motion`: disable morph + breathe, use simple opacity swap

---

## 2. OceanSkeleton (Assembly)

### Purpose

Progressive loading placeholder. Shows glyph "slots" that reveal one by one — either tied to real loading progress or on an automatic timer with looping.

### Behavior

#### Unrevealed State
- Glyphs render at very low opacity (0.08) with a desaturated/muted appearance
- No animation — static placeholders indicating "something will go here"
- Use `currentColor` with reduced opacity (no trait colors yet)

#### Reveal Transition
- Each glyph reveals using the existing `hieroglyph-reveal` animation: scale(0) → scale(1) with `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight overshoot bounce)
- On reveal, the glyph gains its trait color
- Duration: 400ms per reveal
- Stagger: controlled by `interval` in auto mode, or by `revealedCount` changes in controlled mode

#### Controlled Mode (`revealedCount`)
- Parent controls how many glyphs are revealed via `revealedCount` prop
- Useful when tied to real progress (e.g., 5 API calls = 5 reveals)
- Glyphs 1 through `revealedCount` are revealed; rest remain as placeholders

#### Auto Mode (`autoReveal`)
- Reveals glyphs one by one on a timer
- After all glyphs are revealed, resets (fade all back to placeholder opacity) and loops
- Reset transition: all glyphs fade out simultaneously over 300ms, then the cycle restarts
- Loop delay: 400ms pause after full reveal before resetting

### Component API

```tsx
interface OceanSkeletonProps {
  /** Hieroglyph letters to display as slots. Default: "OCEAN" */
  code?: string;
  /** Glyph size in px. Default: 32 */
  size?: number;
  /** Controlled mode: number of revealed glyphs (0 to code.length). */
  revealedCount?: number;
  /** Auto mode: reveal glyphs one by one on a timer, then loop. Default: false */
  autoReveal?: boolean;
  /** Time between reveals in auto mode, in ms. Default: 600 */
  interval?: number;
  /** Monochrome mode — revealed glyphs use currentColor. Default: false */
  mono?: boolean;
  /** Additional CSS classes */
  className?: string;
}
```

### Usage Examples

```tsx
// Default — 5 OCEAN glyphs, all unrevealed (use with revealedCount)
<OceanSkeleton />

// Controlled by loading progress
<OceanSkeleton revealedCount={loadedSections} />

// Auto mode — self-animating, loops
<OceanSkeleton autoReveal />

// Single glyph loading indicator
<OceanSkeleton code="O" autoReveal />

// Custom 3-glyph skeleton
<OceanSkeleton code="AEN" size={24} autoReveal interval={400} />

// Monochrome
<OceanSkeleton mono autoReveal />
```

### Visual Spec

- Glyphs laid out in a horizontal flex row with `gap: 0.2em` (matches `OceanHieroglyphCode`)
- Each glyph is `size × size` px
- Unrevealed: opacity 0.08, grayscale, `currentColor`
- Revealed: full opacity, trait color (unless `mono`), hieroglyph-reveal animation
- Container: inline-flex, centers content

### Layout

```
┌──────────────────────────────────┐
│  [○]  [◐]  [▯]  [△]  [◇]      │
│  0.08  0.08  1.0  0.08  0.08    │  ← revealedCount={3}
│  gray  gray  teal gray  gray    │
└──────────────────────────────────┘
```

### Accessibility

- `role="progressbar"` on the container
- `aria-valuemin={0}`, `aria-valuemax={code.length}`, `aria-valuenow={revealedCount}`
- In auto mode: `aria-valuenow` updates as glyphs reveal
- `aria-label="Loading"` (overridable)
- `prefers-reduced-motion`: skip scale animation, use simple opacity transition

---

## 3. Shared Infrastructure

### Normalized Path Data

Both components need path-string versions of the hieroglyphs for different reasons:
- **OceanSpinner**: flubber requires `d` attribute strings for morphing
- **OceanSkeleton**: uses standard `OceanHieroglyph` rendering (no path normalization needed)

Only `OceanSpinner` needs the normalized paths. Add to domain layer:

```typescript
// packages/domain/src/constants/ocean-hieroglyph-paths.ts

/**
 * Normalized path strings for all 15 hieroglyphs.
 * Each multi-element shape merged into a single compound path.
 * Used by OceanSpinner for flubber SVG morphing.
 */
export const OCEAN_HIEROGLYPH_PATHS: Record<TraitLevel, string> = {
  T: "M9 2h6v7h7v6h-7v7H9v-7H2V9h7z",
  M: "M2 7h20v10H2z",
  O: "M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z", // circle → path
  // ... all 15 converted
};
```

**Conversion rules:**
- `circle` → arc-based path (`M cx-r cy a r r 0 1 0 2r 0 a r r 0 1 0 -2r 0 z`)
- `ellipse` → arc-based path (same pattern with rx/ry)
- `rect` → `M x y h w v h H x z` (with rx for rounded)
- `polygon` → `M x1,y1 L x2,y2 L x3,y3 z`
- `path` → use `d` attribute directly
- Multi-element shapes → concatenate all paths into one string

### Trait Color Resolution

Shared utility for mapping code position → trait name → CSS variable:

```typescript
const TRAIT_ORDER: TraitName[] = [
  "openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"
];

function traitForPosition(index: number): TraitName {
  return TRAIT_ORDER[index % TRAIT_ORDER.length];
}
```

This already exists implicitly in `OceanHieroglyphCode` via `TRAIT_NAMES` — reuse that constant.

---

## 4. File Structure

```
packages/domain/src/constants/
  ocean-hieroglyphs.ts          ← existing (untouched)
  ocean-hieroglyph-paths.ts     ← NEW: normalized path strings for flubber

packages/ui/src/components/
  ocean-hieroglyph.tsx           ← existing (untouched)
  ocean-hieroglyph-code.tsx      ← existing (untouched)
  ocean-hieroglyph-set.tsx       ← existing (untouched)
  ocean-spinner.tsx              ← NEW
  ocean-skeleton.tsx             ← NEW

packages/ui/src/styles/globals.css
  ← ADD: keyframes for skeleton reset cycle (if CSS-based)
```

### Exports

Add to `packages/ui/package.json` exports:
```json
"./components/ocean-spinner": "./src/components/ocean-spinner.tsx",
"./components/ocean-skeleton": "./src/components/ocean-skeleton.tsx"
```

---

## 5. Dependencies

| Dependency | Package | Purpose |
|-----------|---------|---------|
| `flubber` | `packages/ui` | SVG path interpolation for OceanSpinner morphing |
| `@types/flubber` | `packages/ui` (devDep) | TypeScript definitions |

No other new dependencies required. Both components build on existing hieroglyph data, trait color CSS variables, and animation keyframes.

---

## 6. Migration Path

### Phase 1: Build Components
Create `OceanSpinner` and `OceanSkeleton` in `packages/ui`. Add to kitchen sink (`/dev/components`).

### Phase 2: Replace Spinners
Swap `Loader2` + `animate-spin` instances across the app with `<OceanSpinner>`:
- Button loading states → `<OceanSpinner size={16} mono />`
- Page loading → `<OceanSpinner size={48} />`
- Chat input pending → `<OceanSpinner size={16} mono />`

### Phase 3: Replace Skeletons
Introduce `OceanSkeleton` in places where content loads progressively:
- Dashboard cards loading
- Results page assembly
- Profile data loading

---

## 7. Kitchen Sink Demo

Both components must have demos in `/dev/components` per project rules:

- **OceanSpinner section:** Default, large, small mono, custom code, inside a button
- **OceanSkeleton section:** Auto mode, controlled mode with a slider, single glyph, custom code, mono variant
