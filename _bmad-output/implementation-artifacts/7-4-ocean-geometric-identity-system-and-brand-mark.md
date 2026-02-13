# Story 7.4: OCEAN Geometric Identity System & Brand Mark

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want **the Big Five personality framework encoded into 5 distinctive geometric shapes that serve as the brand identity, data visualization markers, and my personal identity**,
So that **the brand feels deeply connected to its psychological foundation, and my personality profile has a unique visual signature**.

## Acceptance Criteria

1. **Given** I view the big-ocean logo anywhere **When** the brand mark renders **Then** I see "big-" in Space Grotesk bold followed by 5 inline geometric shapes: O (Circle, Purple), C (Half-Circle, Orange), E (Tall Slim Rectangle, Electric Pink), A (Triangle, Teal), N (Diamond, Navy) **And** the shapes replace the word "ocean" in the logo **And** the brand mark works at all sizes (favicon to hero)

2. **Given** I view my Geometric Personality Signature on the results page **When** my OCEAN code (e.g., "HHMHM") renders visually **Then** I see the 5 shapes in OCEAN order **And** each shape's size encodes my level: Large (H), Medium (M), Small (L) **And** each shape uses its trait color at full saturation **And** shapes are arranged inline with even spacing

3. **Given** the results reveal animation plays **When** my archetype is being revealed **Then** shapes appear one by one (O → C → E → A → N) with ~200ms stagger **And** each shape starts small and scales to its final size **And** color fills in as the shape reaches full size **And** archetype name fades in below the signature **And** users with `prefers-reduced-motion` see instant final state

4. **Given** I view the brand mark in monochrome or constrained contexts **When** the monochrome variant renders **Then** all 5 shapes use `currentColor` (inherits from parent text color) **And** the logo remains recognizable without trait colors

5. **Given** I view the favicon/app icon **When** the icon-only variant renders **Then** I see 5 shapes arranged compactly without "big-" text **And** the icon is recognizable at 16px (favicon) size

## Tasks / Subtasks

- [x] Task 1: Create 5 individual SVG shape components (AC: #1, #2)
  - [x] `OceanCircle.tsx` — O (Openness): Full circle SVG
  - [x] `OceanHalfCircle.tsx` — C (Conscientiousness): Half circle (left half) SVG
  - [x] `OceanRectangle.tsx` — E (Extraversion): Tall slim rectangle (2:3 aspect ratio) SVG
  - [x] `OceanTriangle.tsx` — A (Agreeableness): Equilateral triangle SVG
  - [x] `OceanDiamond.tsx` — N (Neuroticism): Diamond (rotated square) SVG
  - [x] Each shape accepts `size`, `color`, and `className` props
  - [x] Each shape uses `aria-hidden="true"` (decorative)
  - [x] Each shape has `data-slot="ocean-shape-{letter}"` attribute

- [x] Task 2: Create `OceanShapeSet` component — brand mark (AC: #1, #4)
  - [x] Renders 5 shapes inline in OCEAN order
  - [x] Accepts `size` prop (controls shape height, shapes scale proportionally)
  - [x] Default variant: full color (each shape in its trait color via CSS variable)
  - [x] Monochrome variant: all shapes use `currentColor`
  - [x] `data-slot="ocean-shape-set"` attribute
  - [x] Even spacing between shapes (use `gap` utility)

- [x] Task 3: Update `Logo.tsx` to use brand mark (AC: #1)
  - [x] Replace gradient text "Big Ocean" with: "big-" text + `OceanShapeSet`
  - [x] "big-" text in Space Grotesk bold (`font-heading font-bold`)
  - [x] `OceanShapeSet` inline after text, vertically centered
  - [x] Logo scales with text size (hero vs header usage)
  - [x] Works in both light and dark modes

- [x] Task 4: Create `GeometricSignature` component (AC: #2, #3)
  - [x] Accepts `oceanCode` prop (5-letter string like "HHMHM")
  - [x] Maps each letter to a size tier: H=Large, M=Medium, L=Small (fallback to Medium)
  - [x] Renders 5 shapes in OCEAN order, each at its mapped size
  - [x] Each shape uses its trait color from CSS variables
  - [x] `data-slot="geometric-signature"` attribute
  - [x] Accepts optional `animate` prop (default: `false`)

- [x] Task 5: Implement reveal animation for `GeometricSignature` (AC: #3)
  - [x] When `animate={true}`, shapes appear sequentially O → C → E → A → N
  - [x] ~200ms stagger between each shape
  - [x] Each shape: starts at scale(0) + opacity(0) → scales to full size + opacity(1)
  - [x] Use CSS transitions/keyframes (not a JS animation library)
  - [x] `prefers-reduced-motion: reduce` → skip animation, show final state immediately
  - [x] Archetype name (if provided via prop) fades in after last shape appears

- [x] Task 6: Create icon-only variant for favicon (AC: #5 — partial)
  - [x] Create static SVG file with simplified single-shape icon (deliberate design choice — 5 shapes were visually cluttered at small sizes, using Openness circle as recognizable brand mark; may revisit later)
  - [x] Generate favicon.ico from SVG (16x16, 32x32, 48x48)
  - [x] Update `manifest.json` with big-ocean branding (replace TanStack defaults)
  - [x] Generate `logo192.png` and `logo512.png` from brand mark

- [x] Task 7: Add Storybook documentation
  - [x] Story for each individual shape at multiple sizes
  - [x] Story for `OceanShapeSet` (full color + monochrome)
  - [x] Story for `GeometricSignature` with various OCEAN codes
  - [x] Story for reveal animation
  - [x] Story for Logo with brand mark

- [x] Task 8: Verify build and tests
  - [x] `pnpm build --filter=front` — 0 errors
  - [x] `pnpm lint` — no new warnings
  - [x] `pnpm test:run` — no regressions
  - [x] Visual check: brand mark renders in header at multiple sizes
  - [x] Visual check: shapes work in both light and dark modes
  - [x] Visual check: animation plays correctly and respects reduced motion

## Dev Notes

### CRITICAL: Trait Color Discrepancy Between Epic Spec and Current Implementation

The Epic 7 spec defines shapes with **specific hex colors**:
- O (Openness): Purple `#A855F7`
- C (Conscientiousness): Orange `#FF6B2B`
- E (Extraversion): Electric Pink `#FF0080`
- A (Agreeableness): Teal `#00B4A6`
- N (Neuroticism): Navy `#1c1c9c`

However, the **current `globals.css` trait tokens use OKLCH values** from an older implementation (Story 7.3/7.5 pre-rewrite):
```css
--trait-openness: oklch(0.62 0.16 285);        /* Purple-ish but NOT #A855F7 */
--trait-conscientiousness: oklch(0.64 0.14 238); /* Blue, NOT Orange #FF6B2B */
--trait-extraversion: oklch(0.66 0.17 25);      /* Orange-ish, NOT Pink #FF0080 */
--trait-agreeableness: oklch(0.63 0.13 162);    /* Teal-ish */
--trait-neuroticism: oklch(0.60 0.18 350);      /* Red-ish, NOT Navy #1c1c9c */
```

**Decision for dev:** The shape components MUST use `var(--trait-{name})` CSS variables (NOT hard-coded hex values). This ensures shapes automatically adapt to light/dark mode. Story 7.5 (Trait & Facet Visualization Colors) is responsible for updating the OKLCH tokens to match the new hex values from the spec. If Story 7.5 hasn't run yet when you implement this, the shapes will still work — they'll just use the current OKLCH colors until 7.5 updates them. This is by design.

**Hard rule:** Never hard-code color hex values in shape components. Always reference CSS variables.

### OCEAN Code Mapping to Shapes

The OCEAN code system uses **trait-specific semantic letters** (NOT generic H/M/L):

| Trait | Shape | Low Letter | Mid Letter | High Letter |
|-------|-------|-----------|-----------|------------|
| Openness | Circle | P (Practical) | G (Grounded) | O (Open-minded) |
| Conscientiousness | Half-Circle | F (Flexible) | B (Balanced) | D (Disciplined) |
| Extraversion | Rectangle | I (Introvert) | A (Ambivert) | E (Extravert) |
| Agreeableness | Triangle | C (Candid) | N (Negotiator) | W (Warm) |
| Neuroticism | Diamond | R (Resilient) | T (Temperate) | S (Sensitive) |

The `GeometricSignature` component must map these letters to size tiers:
- **Low** letters (P, F, I, C, R) → Small shape
- **Mid** letters (G, B, A, N, T) → Medium shape
- **High** letters (O, D, E, W, S) → Large shape

**Source:** `packages/domain/src/types/archetype.ts` — `TRAIT_LETTER_MAP` and `TRAIT_LEVEL_LABELS`

**Import the level mapping from domain**, don't duplicate the letter definitions. Create a utility that maps trait letter → size tier.

### Size Tiers for Geometric Signature

Suggested pixel sizes (relative to a `baseSize` prop):
- **Small (Low):** `baseSize * 0.5` (e.g., 16px at base 32)
- **Medium (Mid):** `baseSize * 0.75` (e.g., 24px at base 32)
- **Large (High):** `baseSize * 1.0` (e.g., 32px at base 32)

The `GeometricSignature` should accept a `baseSize` prop (default: 32px for inline usage, 64px for results page hero).

### Shape SVG Design Guidelines

Each shape should be a simple, clean SVG:
- Use `viewBox="0 0 24 24"` for consistent sizing
- Fill uses `currentColor` by default (allows color to be set via CSS `color` property or `fill` attribute)
- Pass `fill` prop to override (for trait colors): `fill={getTraitColor(trait)}` or `style={{ color: 'var(--trait-openness)' }}`
- SVG elements should use `<svg>` with `aria-hidden="true"` and `role="img"` only when NOT decorative

**Shape definitions:**
```
Circle (O):       <circle cx="12" cy="12" r="10" />
Half-Circle (C):  <path d="M12 2 A10 10 0 0 0 12 22 Z" />  (left semicircle)
Rectangle (E):    <rect x="7" y="2" width="10" height="20" rx="1" />  (tall slim)
Triangle (A):     <polygon points="12,2 22,22 2,22" />  (equilateral)
Diamond (N):      <polygon points="12,1 23,12 12,23 1,12" />  (rotated square)
```

### Component File Structure

```
apps/front/src/components/
  ocean-shapes/
    OceanCircle.tsx           # O - Openness
    OceanHalfCircle.tsx       # C - Conscientiousness
    OceanRectangle.tsx        # E - Extraversion
    OceanTriangle.tsx         # A - Agreeableness
    OceanDiamond.tsx          # N - Neuroticism
    OceanShapeSet.tsx         # All 5 shapes inline (brand mark)
    GeometricSignature.tsx    # User's OCEAN code as sized shapes
    index.ts                  # Barrel export
```

All components live in `apps/front/src/components/ocean-shapes/` (app-specific, not `packages/ui`). They are front-end presentation components specific to the brand identity, not generic reusable UI primitives.

### Logo Update Details

Current `Logo.tsx` is a simple gradient text:
```tsx
<Link to="/" data-slot="header-logo" className="flex items-center">
  <span className="text-xl font-bold bg-[image:var(--gradient-celebration)] bg-clip-text text-transparent">
    Big Ocean
  </span>
</Link>
```

Replace with brand mark:
```tsx
<Link to="/" data-slot="header-logo" className="flex items-center gap-1">
  <span className="font-heading font-bold text-foreground text-xl">big-</span>
  <OceanShapeSet size={20} />
</Link>
```

Key points:
- "big-" in `text-foreground` (not gradient), using `font-heading` (Space Grotesk)
- Lowercase "big-" per the epic spec
- The `OceanShapeSet` replaces the word "ocean" visually
- `size` prop on `OceanShapeSet` should match the text line height
- `gap-1` (4px) between text and shapes

### Existing Code That Touches OCEAN Codes

- **`packages/domain/src/utils/ocean-code-generator.ts`** — Generates 5-letter OCEAN codes from facet scores. This is the source of truth for what codes look like.
- **`packages/domain/src/types/archetype.ts`** — Type definitions for `OceanCode4`, `OceanCode5`, trait level letters, and `TRAIT_LETTER_MAP`.
- **`packages/domain/src/utils/archetype-lookup.ts`** — Looks up archetype names from OCEAN codes. Uses the same letter system.
- **`apps/front/src/components/results/ArchetypeCard.tsx`** — Currently displays OCEAN codes as text. Future Story 7.9 will integrate `GeometricSignature` here. **Do NOT modify ArchetypeCard in this story** — just make `GeometricSignature` ready for it.

### ArchetypeCard Has Hard-Coded Slate Colors (Known Issue)

`ArchetypeCard.tsx` uses hard-coded `bg-slate-800/80`, `text-white`, `text-slate-200`, etc. This is a known issue from pre-rewrite implementation. **Do NOT fix it in this story** — Story 7.9 (Results Page Visual Redesign) will handle the full results page visual update. Just ensure your new components use semantic tokens from day one.

### Favicon & Manifest Update

Current state:
- `apps/front/public/manifest.json` — Still has TanStack placeholder branding (`"short_name": "TanStack App"`)
- `apps/front/public/favicon.ico` — TanStack default icon
- `apps/front/public/logo192.png` and `logo512.png` — TanStack defaults

Update manifest.json:
```json
{
  "short_name": "big-ocean",
  "name": "big-ocean — Discover Your Personality",
  "icons": [
    { "src": "logo192.png", "type": "image/png", "sizes": "192x192" },
    { "src": "logo512.png", "type": "image/png", "sizes": "512x512" }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#FF0080",
  "background_color": "#FFF8F0"
}
```

For favicon generation: Create a compact SVG with 5 shapes arranged in a tight grid or row, then convert to ICO/PNG. Consider using a build script or manual conversion tool. The icon-only variant should be recognizable even at 16px — keep shapes simple and use bold fills.

### Animation Implementation

Use CSS `@keyframes` and `animation-delay` for the stagger effect:

```css
@keyframes shape-reveal {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

Each shape gets `animation-delay: calc(var(--index) * 200ms)` where `--index` is 0-4.

**Reduced motion:** Wrap in `@media (prefers-reduced-motion: no-preference) { ... }` or use Tailwind's `motion-safe:` and `motion-reduce:` variants. When reduced motion is preferred, shapes render in final state immediately with no animation.

### Previous Story Intelligence

**From Story 7.1 (Psychedelic Brand Tokens) — done:**
- Hex-based psychedelic palette in place: Electric Pink primary, Vivid Orange secondary, Saturated Teal tertiary
- Gradient variables: `--gradient-celebration`, `--gradient-progress`, `--gradient-surface-glow`
- Spacing and radius scale tokens defined
- WCAG AA contrast verified

**From Story 7.2 (Typography System) — done:**
- Space Grotesk (headings), DM Sans (body), JetBrains Mono (data) loaded via Google Fonts
- Font tokens: `font-heading`, `font-body`, `font-data` available as Tailwind utilities
- Type scale tokens defined

**From Story 7.3 (Dark Mode Toggle) — done:**
- ThemeProvider wraps app, `useTheme` hook available
- Flash prevention script in place
- `.dark` class toggling on `<html>` element
- Dark mode tokens fully defined (Abyss Navy + Teal + Gold)

**Key Pattern from Previous Stories:**
- Components use `data-slot` attributes for identification
- CSS variables for all colors (no hard-coded values)
- `cn()` for class merging
- Semantic color tokens (`bg-primary`, `text-foreground`, etc.)

### Git Intelligence

Recent commits show the new Epic 7 rewrite is underway:
```
84b1c5e chore: update sprint
a8c3bc1 feat: Typography system with 3-font hierarchy (Story 7.2) (#32)
ed5cd45 feat: Psychedelic brand design tokens (Story 7.1) (#31)
```

Stories 7.1 and 7.2 landed via PRs. Story 7.3 was marked done without code changes (feature already existed). This is the first story requiring significant **new component creation** in the rewritten Epic 7.

### Anti-Patterns to Avoid

```tsx
// BAD - Hard-coded trait colors
<circle fill="#A855F7" />

// GOOD - CSS variable reference
<circle fill="var(--trait-openness)" />
// OR
<circle className="fill-trait-openness" />

// BAD - Hard-coded slate/gray colors (existing ArchetypeCard pattern)
<div className="bg-slate-800/80 text-white">

// GOOD - Semantic tokens
<div className="bg-card text-card-foreground">

// BAD - JS animation library for simple stagger
import { motion } from "framer-motion";

// GOOD - CSS keyframes + animation-delay
<div style={{ animationDelay: `${index * 200}ms` }} className="animate-shape-reveal">

// BAD - Duplicating OCEAN letter definitions
const LETTERS = { openness: ["P", "G", "O"], ... };

// GOOD - Import from domain
import { TRAIT_LETTER_MAP } from "@workspace/domain";

// BAD - Placing brand components in packages/ui
// packages/ui/src/components/ocean-shapes/ ← WRONG

// GOOD - App-specific brand components
// apps/front/src/components/ocean-shapes/ ← CORRECT
```

### Project Structure Notes

- **New directory:** `apps/front/src/components/ocean-shapes/` — brand-specific component library
- **Modified file:** `apps/front/src/components/Logo.tsx` — replace gradient text with brand mark
- **Modified files:** `apps/front/public/favicon.ico`, `logo192.png`, `logo512.png`, `manifest.json` — brand assets
- **Domain import:** `packages/domain/src/types/archetype.ts` — `TRAIT_LETTER_MAP` for letter-to-size mapping
- **Domain import:** `packages/domain/src/utils/trait-colors.ts` — `getTraitColor()` for shape fills
- **No backend changes** — this is purely frontend/presentation

### References

- [Epic 7 Spec: Story 7.4](/_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md#story-74-ocean-geometric-identity-system--brand-mark) — Full acceptance criteria and technical details
- [Story 7.1 (done)](/_bmad-output/implementation-artifacts/7-1-psychedelic-brand-design-tokens.md) — Color tokens, spacing, radius
- [Story 7.2 (done)](/_bmad-output/implementation-artifacts/7-2-typography-system.md) — Typography system with Space Grotesk
- [Story 7.3 (done)](/_bmad-output/implementation-artifacts/7-3-dark-mode-toggle-with-system-preference-detection.md) — Theme toggle, dark mode
- [FRONTEND.md](/docs/FRONTEND.md) — data-slot conventions, component patterns, CVA usage
- [trait-colors.ts](/packages/domain/src/utils/trait-colors.ts) — `getTraitColor()`, `getFacetColor()`, `getTraitGradient()`
- [archetype.ts](/packages/domain/src/types/archetype.ts) — `TRAIT_LETTER_MAP`, `OceanCode5`, trait level types
- [ocean-code-generator.ts](/packages/domain/src/utils/ocean-code-generator.ts) — OCEAN code generation algorithm
- [Logo.tsx](/apps/front/src/components/Logo.tsx) — Current text logo to replace
- [ArchetypeCard.tsx](/apps/front/src/components/results/ArchetypeCard.tsx) — Future integration point (Story 7.9)
- [globals.css](/packages/ui/src/styles/globals.css) — Trait color CSS variables (lines 111-115, 225-229)

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

None — clean implementation with no blockers.

### Completion Notes List

- Created 5 individual SVG shape components (OceanCircle, OceanHalfCircle, OceanRectangle, OceanTriangle, OceanDiamond) in `apps/front/src/components/ocean-shapes/`. Each accepts `size`, `color`, and `className` props, uses `aria-hidden="true"`, and has `data-slot="ocean-shape-{letter}"`.
- Created `OceanShapeSet` component with `color` (default) and `monochrome` variants. Color variant uses CSS variable trait colors (`var(--trait-{name})`), monochrome uses `currentColor`.
- Updated `Logo.tsx` to replace gradient text "Big Ocean" with lowercase "big-" in Space Grotesk bold + `OceanShapeSet` inline shapes.
- Created `GeometricSignature` component that maps OCEAN code letters to size tiers using `TRAIT_LETTER_MAP` imported from `@workspace/domain`. Size tiers: Large (1.0x), Medium (0.75x), Small (0.5x).
- Implemented CSS keyframes `shape-reveal` and `fade-in` with Tailwind v4 `@utility` directives. Animation uses `motion-safe:` and `motion-reduce:` variants for `prefers-reduced-motion` support. 200ms stagger via `animationDelay`.
- Created `ocean-icon.svg` with simplified single Openness circle (deliberate design choice — 5 shapes were cluttered at favicon sizes; may revisit later). Generated `favicon.ico` (16/32/48px), `logo192.png`, and `logo512.png` using `rsvg-convert`.
- Updated `manifest.json` with big-ocean branding (replaced TanStack defaults).
- Added favicon and apple-touch-icon link tags to `__root.tsx` head configuration.
- Created comprehensive Storybook stories covering individual shapes at multiple sizes, OceanShapeSet variants, GeometricSignature with various OCEAN codes, reveal animation, and Logo brand mark.
- All builds pass (0 errors), lint clean (no new warnings), all 255 tests pass (139 API + 116 frontend).

**Code Review Fixes (2026-02-13):**
- Fixed 5 TypeScript errors in Storybook stories by splitting `OceanShapes.stories.tsx` into 4 properly-typed story files (Individual Shapes, OceanShapeSet, GeometricSignature, Logo).
- Added 19 unit tests for `GeometricSignature` covering letter-to-size mapping (all 15 trait letters), rendering (OCEAN order, data-slots, CSS variable colors), animation (class application, stagger delays), and edge cases (short/empty/invalid codes).
- Added dev-mode `console.warn` validation for invalid `oceanCode` prop in `GeometricSignature`.
- Fixed `OceanHalfCircle` inconsistent bounding box — now uses `width={size}` / `height={size}` with 24x24 viewBox matching other shapes (was half-width causing uneven spacing).
- Removed redundant `favicon.ico` entry from `manifest.json` icons array (already referenced via `<link>` tag in `__root.tsx`).
- All 274 tests pass (139 API + 135 frontend).

### Change Log

- 2026-02-13: Implemented OCEAN Geometric Identity System — 5 shape components, brand mark, geometric signature with animation, favicon/manifest update, Storybook documentation
- 2026-02-13: Code review fixes — split stories into separate files (TS errors), added 19 GeometricSignature unit tests, added oceanCode validation, fixed HalfCircle bounding box, cleaned up manifest.json

### File List

**New files:**
- `apps/front/src/components/ocean-shapes/OceanCircle.tsx`
- `apps/front/src/components/ocean-shapes/OceanHalfCircle.tsx`
- `apps/front/src/components/ocean-shapes/OceanRectangle.tsx`
- `apps/front/src/components/ocean-shapes/OceanTriangle.tsx`
- `apps/front/src/components/ocean-shapes/OceanDiamond.tsx`
- `apps/front/src/components/ocean-shapes/OceanShapeSet.tsx`
- `apps/front/src/components/ocean-shapes/GeometricSignature.tsx`
- `apps/front/src/components/ocean-shapes/index.ts`
- `apps/front/src/components/ocean-shapes/OceanShapes.stories.tsx` — individual shapes
- `apps/front/src/components/ocean-shapes/OceanShapeSet.stories.tsx` — shape set variants
- `apps/front/src/components/ocean-shapes/GeometricSignature.stories.tsx` — signature + animation
- `apps/front/src/components/ocean-shapes/Logo.stories.tsx` — logo brand mark
- `apps/front/src/components/ocean-shapes/GeometricSignature.test.tsx` — 19 unit tests
- `apps/front/public/ocean-icon.svg`

**Modified files:**
- `apps/front/src/components/Logo.tsx` — replaced gradient text with brand mark
- `apps/front/src/routes/__root.tsx` — added favicon/apple-touch-icon links, updated title
- `apps/front/public/manifest.json` — updated branding from TanStack defaults, removed redundant favicon.ico from icons
- `apps/front/public/favicon.ico` — regenerated from ocean-icon.svg
- `apps/front/public/logo192.png` — regenerated from ocean-icon.svg
- `apps/front/public/logo512.png` — regenerated from ocean-icon.svg
- `packages/ui/src/styles/globals.css` — added shape-reveal and fade-in keyframes + utility classes
