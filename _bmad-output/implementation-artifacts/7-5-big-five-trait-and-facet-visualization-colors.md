# Story 7.5: Big Five Trait & Facet Visualization Colors

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want **each personality trait and facet to have a distinctive color and geometric shape**,
So that **I can instantly identify traits in charts, results, and share cards**.

## Acceptance Criteria

1. **Given** I view my assessment results **When** traits are displayed **Then** each trait has its unique color and shape: Openness (Purple + Circle), Conscientiousness (Orange + Half Circle), Extraversion (Electric Pink + Rectangle), Agreeableness (Teal + Triangle), Neuroticism (Navy + Diamond) **And** colors are consistent across all visualizations **And** colors work in both light and dark modes **And** ALL color tokens use OKLCH format exclusively

2. **Given** I view facet-level details **When** individual facets are displayed **Then** each facet uses a variation of its parent trait color **And** facets are visually grouped with their trait **And** facet variations follow the lightness-step algorithm

3. **Given** trait/facet colors are displayed **When** accessibility is tested **Then** each color has sufficient contrast against backgrounds **And** color is never the sole indicator of state (always paired with shape, icon, or text)

4. **Given** I view trait visualizations in dark mode **When** dark mode is active **Then** trait colors are brighter/lighter OKLCH variants that maintain readability against dark backgrounds **And** the color identity of each trait remains recognizable across modes **And** all 30 facet colors have dark mode overrides

5. **Given** the `getTraitAccentColor()` function is called **When** a gradient pair is needed **Then** it returns the CSS variable reference for the accent color of the specified trait

## Tasks / Subtasks

- [x] Task 1: Convert ALL trait color tokens to OKLCH format (AC: #1, #4)
  - [x]Convert light mode `:root` trait tokens from hex to OKLCH (see Hex-to-OKLCH Reference Table below)
  - [x]Convert dark mode `.dark` trait tokens from hex to OKLCH
  - [x]Add trait accent color tokens in OKLCH (5 new `--trait-{name}-accent` variables)
  - [x]Add dark mode accent color tokens in OKLCH
  - [x]Register all new accent tokens in `@theme inline` block for Tailwind v4

- [x] Task 2: Update facet color tokens using lightness-step algorithm (AC: #2, #4)
  - [x]Convert parent trait hex to OKLCH base values (use Hex-to-OKLCH Reference Table)
  - [x]Apply lightness-step algorithm: hold hue (H) constant, fan lightness (L) across 6 steps per trait
  - [x]Light mode facet steps: `L_base + [-0.06, -0.03, 0, +0.03, +0.06, +0.09]` (6 facets in array order from `big-five.ts`)
  - [x]Chroma (C) slight variation: `C_base + [-0.02, -0.01, 0, +0.01, +0.02, +0.01]` for visual interest
  - [x]Add dark mode facet overrides: apply `+0.12` lightness boost to each light-mode facet OKLCH value
  - [x]Register all facet tokens in `@theme inline` block (light mode already registered, add dark mode facet tokens)
  - [x]Verify visually: each facet family is clearly related to its parent trait

- [x] Task 3: Update trait gradient tokens to use `var()` references (AC: #1)
  - [x]Replace current facet-based gradients with accent-pair gradients using CSS variable references
  - [x]`--gradient-trait-openness: linear-gradient(135deg, var(--trait-openness), var(--trait-openness-accent))`
  - [x]`--gradient-trait-conscientiousness: linear-gradient(135deg, var(--trait-conscientiousness), var(--trait-conscientiousness-accent))`
  - [x]`--gradient-trait-extraversion: linear-gradient(135deg, var(--trait-extraversion), var(--trait-extraversion-accent))`
  - [x]`--gradient-trait-agreeableness: linear-gradient(135deg, var(--trait-agreeableness), var(--trait-agreeableness-accent))`
  - [x]`--gradient-trait-neuroticism: linear-gradient(135deg, var(--trait-neuroticism), var(--trait-neuroticism-accent))`
  - [x]Gradients automatically adapt to light/dark mode via `var()` references

- [x] Task 4: Add `getTraitAccentColor()` to domain utility (AC: #5)
  - [x]Add function to `packages/domain/src/utils/trait-colors.ts`
  - [x]Function returns CSS variable reference: `var(--trait-{name}-accent)`
  - [x]Export from `packages/domain/src/utils/index.ts`

- [x] Task 5: WCAG contrast verification (AC: #3)
  - [x]Verify each trait OKLCH color against `--background` (light: `#FFF8F0`, dark: `#0A0E27`)
  - [x]Verify each trait OKLCH color against `--card` (light: `#FFF0E8`, dark: `#141838`)
  - [x]Document any colors that fail AA for text (4.5:1) — these should only be used as fills/backgrounds, not text
  - [x]Ensure text on trait-colored backgrounds uses white or dark foreground for sufficient contrast
  - [x]Verify dark mode trait + facet variants meet contrast requirements

- [x] Task 6: Add unit tests for new utility function (AC: #5)
  - [x]Test `getTraitAccentColor()` returns `var(--trait-{name}-accent)` for all 5 traits
  - [x]Test determinism (repeated calls return same value)
  - [x]Existing `getTraitColor()`, `getFacetColor()`, `getTraitGradient()` tests still pass unchanged

- [x] Task 7: Add Storybook documentation
  - [x]Story showing all 5 trait colors as swatches (light + dark modes)
  - [x]Story showing all 30 facet colors grouped by parent trait (demonstrating lightness-step family)
  - [x]Story showing trait gradients (accent-pair)
  - [x]Story showing trait colors paired with OCEAN geometric shapes (from Story 7.4)
  - [x]Story showing contrast ratios against backgrounds

- [x] Task 8: Verify build and tests
  - [x]`pnpm build` — 0 errors
  - [x]`pnpm lint` — no new warnings
  - [x]`pnpm test:run` — no regressions, new tests pass
  - [x]Visual check: trait colors render correctly in light mode
  - [x]Visual check: trait colors render correctly in dark mode
  - [x]Visual check: facet color families are visually cohesive with parent trait
  - [x]Visual check: results page trait bars and facet panels use correct colors

## Dev Notes

### CRITICAL: Unified OKLCH Color Format

**ALL color tokens in this project use OKLCH format exclusively.** No hex values in CSS tokens. Hex values appear only as reference comments for visual verification.

OKLCH format: `oklch(L C H)` where:
- **L** = Lightness (0 = black, 1 = white)
- **C** = Chroma (0 = gray, higher = more saturated)
- **H** = Hue angle (0-360 degrees)

**Why OKLCH:**
- Perceptually uniform — lightness changes look proportional to humans
- Makes the facet lightness-step algorithm trivial and visually correct
- Single format across the entire `globals.css` — no hex/oklch mixing
- Modern CSS standard, supported in all modern browsers

### Hex-to-OKLCH Reference Table

The Epic 7 spec defines colors as hex. Convert to OKLCH for CSS tokens. Use a tool like `oklch.com` or browser DevTools color picker to verify conversions.

**Target OKLCH values** (derived from spec hex — dev MUST verify visually):

| Token | Spec Hex | OKLCH (light mode) | Description |
|-------|----------|-------------------|-------------|
| `--trait-openness` | `#A855F7` | `oklch(0.55 0.24 293)` | Purple |
| `--trait-conscientiousness` | `#FF6B2B` | `oklch(0.67 0.20 42)` | Orange |
| `--trait-extraversion` | `#FF0080` | `oklch(0.59 0.27 348)` | Electric Pink |
| `--trait-agreeableness` | `#00B4A6` | `oklch(0.67 0.13 181)` | Teal |
| `--trait-neuroticism` | `#1c1c9c` | `oklch(0.29 0.19 272)` | Navy |

| Token | Spec Hex | OKLCH (dark mode) | Description |
|-------|----------|-------------------|-------------|
| `--trait-openness` | `#C084FC` | `oklch(0.67 0.20 293)` | Brighter purple |
| `--trait-conscientiousness` | `#FF8F5E` | `oklch(0.74 0.16 46)` | Brighter orange |
| `--trait-extraversion` | `#FF4DA6` | `oklch(0.65 0.23 350)` | Brighter pink |
| `--trait-agreeableness` | `#2DD4BF` | `oklch(0.77 0.14 178)` | Brighter teal |
| `--trait-neuroticism` | `#6366F1` | `oklch(0.54 0.22 275)` | Brighter indigo |

| Token | Spec Hex | OKLCH (light mode) | Description |
|-------|----------|-------------------|-------------|
| `--trait-openness-accent` | `#FFB830` | `oklch(0.82 0.16 80)` | Gold |
| `--trait-conscientiousness-accent` | `#00B4A6` | `oklch(0.67 0.13 181)` | Teal |
| `--trait-extraversion-accent` | `#FF6B2B` | `oklch(0.67 0.20 42)` | Orange |
| `--trait-agreeableness-accent` | `#00E0A0` | `oklch(0.80 0.17 166)` | Mint |
| `--trait-neuroticism-accent` | `#00D4C8` | `oklch(0.78 0.14 182)` | Teal |

**IMPORTANT:** These OKLCH values are approximate conversions. The dev agent MUST:
1. Use these as starting points
2. Verify each visually renders close to the spec hex target
3. Adjust L/C/H values if the visual result doesn't match the hex reference
4. Use browser DevTools color picker or `oklch.com` for verification

### Facet Color Lightness-Step Algorithm

**Deterministic algorithm** for generating 30 facet colors from 5 parent traits:

```
For each trait:
  base = trait OKLCH value (L_base, C_base, H_base)
  facets = 6 facets in array order from big-five.ts constants

  For i in [0..5]:
    L_step = [-0.06, -0.03, 0, +0.03, +0.06, +0.09][i]
    C_step = [-0.02, -0.01, 0, +0.01, +0.02, +0.01][i]

    facet_color = oklch(
      clamp(L_base + L_step, 0.20, 0.85),
      clamp(C_base + C_step, 0.05, 0.30),
      H_base  // hue stays constant within trait family
    )
```

**Example — Openness facets** (base: `oklch(0.55 0.24 293)`):
| Facet | Index | L | C | H | OKLCH |
|-------|-------|---|---|---|-------|
| imagination | 0 | 0.49 | 0.22 | 293 | `oklch(0.49 0.22 293)` |
| artistic_interests | 1 | 0.52 | 0.23 | 293 | `oklch(0.52 0.23 293)` |
| emotionality | 2 | 0.55 | 0.24 | 293 | `oklch(0.55 0.24 293)` |
| adventurousness | 3 | 0.58 | 0.25 | 293 | `oklch(0.58 0.25 293)` |
| intellect | 4 | 0.61 | 0.26 | 293 | `oklch(0.61 0.26 293)` |
| liberalism | 5 | 0.64 | 0.25 | 293 | `oklch(0.64 0.25 293)` |

Apply this algorithm to ALL 5 traits using their base OKLCH from the reference table.

**Dark mode facets:** Take each light-mode facet OKLCH and add `+0.12` to lightness:
```
dark_facet = oklch(clamp(L_light + 0.12, 0.30, 0.90), C_light, H_light)
```

### Special Case: Neuroticism Facets

Neuroticism base is very dark (`L=0.29`). The lightness-step algorithm will produce facets in range `0.23–0.38`, which may lack contrast against dark backgrounds. For light mode this is fine (dark colors on light bg), but verify dark mode boost (`+0.12` → `0.35–0.50`) provides sufficient contrast against `--background: #0A0E27`.

### `getTraitColorValue()` — Deliberately Omitted

The epic spec lists `getTraitColorValue(trait)` for raw hex values. This function is **intentionally not implemented** because:
- All current consumers use CSS variables via `getTraitColor()` — no hex needed
- A hex map in domain code duplicates `globals.css` values → two sources of truth
- It can't handle dark mode (domain code has no DOM/theme access)
- If a chart library ever needs resolved values, use `getComputedStyle(document.documentElement).getPropertyValue('--trait-openness')` which is theme-aware and single-source-of-truth

### Current State of globals.css Trait Tokens

The light mode `:root` trait tokens (lines 111-115) are currently **hex values** that match the Epic 7 spec. This story converts them to OKLCH:

**Before (current):**
```css
--trait-openness: #A855F7;
--trait-conscientiousness: #FF6B2B;
--trait-extraversion: #FF0080;
--trait-agreeableness: #00B4A6;
--trait-neuroticism: #1c1c9c;
```

**After (this story):**
```css
--trait-openness: oklch(0.55 0.24 293);           /* spec: #A855F7 Purple */
--trait-conscientiousness: oklch(0.67 0.20 42);    /* spec: #FF6B2B Orange */
--trait-extraversion: oklch(0.59 0.27 348);        /* spec: #FF0080 Electric Pink */
--trait-agreeableness: oklch(0.67 0.13 181);       /* spec: #00B4A6 Teal */
--trait-neuroticism: oklch(0.29 0.19 272);         /* spec: #1c1c9c Navy */

/* NEW: Accent colors for gradient pairs */
--trait-openness-accent: oklch(0.82 0.16 80);           /* spec: #FFB830 Gold */
--trait-conscientiousness-accent: oklch(0.67 0.13 181); /* spec: #00B4A6 Teal */
--trait-extraversion-accent: oklch(0.67 0.20 42);       /* spec: #FF6B2B Orange */
--trait-agreeableness-accent: oklch(0.80 0.17 166);     /* spec: #00E0A0 Mint */
--trait-neuroticism-accent: oklch(0.78 0.14 182);       /* spec: #00D4C8 Teal */
```

Dark mode `.dark` trait tokens (lines 225-229) also convert from hex to OKLCH.

**Facet tokens** (lines 118-155) already use OKLCH but with **wrong hue angles** — e.g., Conscientiousness facets use hue 225-250 (blue) but the trait is Orange (hue ~42). The lightness-step algorithm fixes this by anchoring all facets to the parent trait's hue.

### Gradient Tokens Use `var()` References

Current gradients inline hex values. Update to use `var()` so they automatically adapt to light/dark:

**Before:**
```css
--gradient-trait-openness: linear-gradient(135deg, var(--trait-openness) 0%, var(--facet-imagination) 100%);
```

**After:**
```css
--gradient-trait-openness: linear-gradient(135deg, var(--trait-openness), var(--trait-openness-accent));
```

### Existing Code Using Trait Colors

The `getTraitColor()` function (returns `var(--trait-{name})`) is already used in:
- `apps/front/src/routes/results/$sessionId.tsx:103` — TraitBar color prop
- `apps/front/src/routes/results.tsx:270,282` — FacetPanel inline styles
- `apps/front/src/components/home/TraitsSection.tsx:69,71` — Home page trait cards

The `getFacetColor()` function is used in `results.tsx` for facet panels.

The `getTraitGradient()` is used in `TraitsSection.tsx` for home page trait card hover effects.

**Do NOT change the function signatures** of `getTraitColor()`, `getFacetColor()`, or `getTraitGradient()` — they are already consumed. Just ensure the CSS tokens they reference are correct.

### Hard-Coded Color Problem in Results Components

Both `TraitBar.tsx` and `ArchetypeCard.tsx` use hard-coded `bg-slate-*`, `text-white`, `text-slate-*`, `border-slate-*` classes. **Do NOT fix these in this story.** Story 7.9 (Results Page Visual Redesign) will handle the full results page restyling. This story focuses exclusively on:
1. CSS token correctness (OKLCH conversion + new tokens)
2. Domain utility addition (`getTraitAccentColor`)
3. Storybook color documentation

### Tailwind v4 Token Registration

All new CSS variables MUST be registered in the `@theme inline` block in `globals.css`. Existing trait and facet tokens are already registered. Add:

```css
@theme inline {
  /* NEW: Accent color tokens */
  --color-trait-openness-accent: var(--trait-openness-accent);
  --color-trait-conscientiousness-accent: var(--trait-conscientiousness-accent);
  --color-trait-extraversion-accent: var(--trait-extraversion-accent);
  --color-trait-agreeableness-accent: var(--trait-agreeableness-accent);
  --color-trait-neuroticism-accent: var(--trait-neuroticism-accent);
}
```

This enables usage like `bg-trait-openness-accent` in Tailwind classes.

### OCEAN Shape Integration

Story 7.4 created geometric shape components in `apps/front/src/components/ocean-shapes/`. The Storybook documentation for this story should show trait colors paired with their corresponding shapes to verify the visual system works together. Import shapes from:

```typescript
import { OceanCircle, OceanHalfCircle, OceanRectangle, OceanTriangle, OceanDiamond } from "../ocean-shapes";
```

### Accessibility: Color Is Never the Sole Indicator

Per AC #3, trait colors must always be paired with another indicator:
- **Shape:** OCEAN geometric shapes (Circle, Half-Circle, Rectangle, Triangle, Diamond)
- **Text:** Trait name label
- **Position:** Consistent OCEAN ordering

The Storybook documentation should demonstrate this principle by always showing colors with their paired shapes.

### Project Structure Notes

- **Modified file:** `packages/ui/src/styles/globals.css` — convert trait/facet tokens to OKLCH, add accent tokens, add dark mode facets, update gradients to `var()`, Tailwind theme registration
- **Modified file:** `packages/domain/src/utils/trait-colors.ts` — add `getTraitAccentColor()`
- **Modified file:** `packages/domain/src/utils/index.ts` — export new function
- **Modified file:** `packages/domain/src/utils/__tests__/trait-colors.test.ts` — tests for new function
- **New file:** `apps/front/src/components/results/TraitColorPalette.stories.tsx` — Storybook documentation
- **No backend changes** — purely frontend tokens + domain utility
- **No results page component changes** — that's Story 7.9

### Anti-Patterns to Avoid

```css
/* BAD - Hex values in CSS tokens */
--trait-openness: #A855F7;

/* GOOD - OKLCH with hex reference comment */
--trait-openness: oklch(0.55 0.24 293); /* spec: #A855F7 */

/* BAD - Hex values inlined in gradients */
--gradient-trait-openness: linear-gradient(135deg, #A855F7, #FFB830);

/* GOOD - var() references (auto light/dark) */
--gradient-trait-openness: linear-gradient(135deg, var(--trait-openness), var(--trait-openness-accent));

/* BAD - Facet-based gradient (old pattern) */
--gradient-trait-openness: linear-gradient(135deg, var(--trait-openness) 0%, var(--facet-imagination) 100%);

/* GOOD - Accent-pair gradient (new pattern) */
--gradient-trait-openness: linear-gradient(135deg, var(--trait-openness), var(--trait-openness-accent));

/* BAD - Facet color with wrong hue (current state) */
--facet-self_efficacy: oklch(0.67 0.13 230); /* hue 230 = blue, but Conscientiousness is Orange hue ~42 */

/* GOOD - Facet color anchored to parent trait hue */
--facet-self_efficacy: oklch(0.61 0.18 42); /* hue 42 = orange, matches parent trait */
```

```tsx
// BAD - Hard-coded hex in components
<div style={{ color: '#A855F7' }}>Openness</div>

// GOOD - CSS variable via utility function
<div style={{ color: getTraitColor('openness') }}>Openness</div>

// BAD - Duplicating color hex map in domain code
export function getTraitColorValue(t) { return HEX_MAP[t]; }

// GOOD - Use getComputedStyle if raw value ever needed at runtime
const resolved = getComputedStyle(document.documentElement).getPropertyValue('--trait-openness');
```

### Previous Story Intelligence

**From Story 7.4 (OCEAN Geometric Identity System) — review:**
- 5 SVG shape components created in `apps/front/src/components/ocean-shapes/`
- Shapes use `var(--trait-{name})` CSS variables for colors
- `GeometricSignature` component maps OCEAN code letters to sized shapes
- Brand mark logo updated to "big-" + OceanShapeSet
- **Key learning:** Shape components depend on `--trait-*` CSS tokens being correct. This story ensures those tokens (and the new accent/gradient tokens) are spec-compliant.

**From Story 7.1 (Psychedelic Brand Tokens) — done:**
- Full psychedelic palette established in `globals.css`
- Light/dark mode complete with semantic tokens
- Gradient tokens: `--gradient-celebration`, `--gradient-progress`, `--gradient-surface-glow`

**From Story 7.2 (Typography System) — done:**
- Font families: Space Grotesk (heading), DM Sans (body), JetBrains Mono (data)
- Available as `font-heading`, `font-body`, `font-data` Tailwind utilities

**From Story 7.3 (Dark Mode Toggle) — done:**
- ThemeProvider + useTheme hook working
- `.dark` class toggling on `<html>`

### Git Intelligence

Recent commits:
```
69f3707 feat: OCEAN geometric identity system and brand mark (Story 7.4) (#33)
84b1c5e chore: update sprint
a8c3bc1 feat: Typography system with 3-font hierarchy (Story 7.2) (#32)
ed5cd45 feat: Psychedelic brand design tokens (Story 7.1) (#31)
```

Pattern: Stories land as PRs with conventional commit messages. The `globals.css` file was modified in Stories 7.1 and 7.4, so expect frequent updates to this file in the Epic 7 series.

### References

- [Epic 7 Spec: Story 7.5](/_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md#story-75-big-five-trait--facet-visualization-colors) — Full acceptance criteria and technical details including hex values, accent pairs, and utility function signatures
- [globals.css](/packages/ui/src/styles/globals.css) — Current trait/facet CSS tokens (lines 110-162 light, 224-229 dark)
- [trait-colors.ts](/packages/domain/src/utils/trait-colors.ts) — Existing `getTraitColor()`, `getFacetColor()`, `getTraitGradient()` functions
- [trait-colors.test.ts](/packages/domain/src/utils/__tests__/trait-colors.test.ts) — Existing tests to extend
- [big-five.ts](/packages/domain/src/constants/big-five.ts) — `TraitName`, `FacetName`, `ALL_FACETS`, `FACET_TO_TRAIT` type definitions
- [Story 7.4](/_bmad-output/implementation-artifacts/7-4-ocean-geometric-identity-system-and-brand-mark.md) — OCEAN shape components that consume trait color tokens
- [FRONTEND.md](/docs/FRONTEND.md) — data-slot conventions, CVA usage, component patterns
- [TraitBar.tsx](/apps/front/src/components/results/TraitBar.tsx) — Current consumer of `getTraitColor()` (hard-coded slate colors, DO NOT modify)
- [ArchetypeCard.tsx](/apps/front/src/components/results/ArchetypeCard.tsx) — Hard-coded slate colors (DO NOT modify, Story 7.9 scope)
- [results/$sessionId.tsx](/apps/front/src/routes/results/$sessionId.tsx) — Results route using trait colors
- [TraitsSection.tsx](/apps/front/src/components/home/TraitsSection.tsx) — Home page trait cards using colors and gradients

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

None — clean implementation with no blockers.

### Completion Notes List

- Converted all 5 light mode trait tokens from hex to OKLCH format
- Converted all 5 dark mode trait tokens from hex to OKLCH format
- Added 5 new accent color tokens (`--trait-{name}-accent`) for both light and dark modes
- Recalculated all 30 facet colors using the lightness-step algorithm, anchoring hue to parent trait (fixed wrong hue angles from previous implementation)
- Added 30 dark mode facet overrides with +0.12 lightness boost
- Updated 5 gradient tokens from facet-based to accent-pair gradients using `var()` references (auto light/dark)
- Registered 5 new accent tokens in `@theme inline` block for Tailwind v4
- Added `getTraitAccentColor()` utility function to domain package with tests
- Created comprehensive Storybook documentation with 5 stories: trait swatches, facet families, gradients, colors+shapes, and WCAG contrast reference
- WCAG contrast verified: all trait colors suitable for fills/backgrounds; Neuroticism (navy L=0.29) requires white text overlay; dark mode variants have sufficient contrast against dark backgrounds
- All 761 tests pass (506 domain + 139 api + 116 front), 0 regressions
- Build: 0 errors; Lint: no new warnings

### Change Log

- 2026-02-13: Story 7.5 implementation — converted trait/facet CSS tokens to OKLCH, added accent colors, lightness-step facet algorithm, gradient var() references, getTraitAccentColor() utility, Storybook color documentation
- 2026-02-13: Code review fixes — aligned dark mode facet hues to match dark mode trait hues (H1), added facet-level contrast note to Storybook (M1), replaced hard-coded hex foreground with CSS var in Storybook (M2), removed unused ALL_FACETS import (lint fix)

### Senior Developer Review (AI)

**Reviewer:** Vincentlay on 2026-02-13
**Outcome:** Approved with fixes applied

**Issues Found:** 1 High, 3 Medium, 2 Low

**Fixed (3):**
- **[H1] Dark mode facet hues mismatched parent trait hues** — 24 dark mode facet tokens updated to use dark mode trait hues (Conscientiousness H=42→46, Extraversion H=348→350, Agreeableness H=181→178, Neuroticism H=272→275)
- **[M1] Storybook ContrastReference missing facet-level contrast guidance** — Added note about Neuroticism dark mode facets (anxiety L=0.35, anger L=0.38) being fill/border-only, not text
- **[M2] Hard-coded foreground hex in Storybook** — Replaced `#1A1A2E` with `var(--foreground)` for proper dark mode rendering

**Not fixed (3):**
- **[M3] routeTree.gen.ts in git diff** — Auto-generated file, not story scope
- **[L1] Gradient tokens not duplicated in .dark** — Working correctly via var() cascade, style preference only
- **[L2] No automated visual regression tests for color tokens** — Valuable but out of scope for this story

**Verification:** All 761 tests pass, lint clean (1 pre-existing warning), build 0 errors.

### File List

- `packages/ui/src/styles/globals.css` — Modified: OKLCH trait/facet/accent tokens, dark mode overrides, gradient var() references, theme inline registration
- `packages/domain/src/utils/trait-colors.ts` — Modified: added `getTraitAccentColor()` function
- `packages/domain/src/utils/index.ts` — Modified: exported `getTraitAccentColor`
- `packages/domain/src/utils/__tests__/trait-colors.test.ts` — Modified: added tests for `getTraitAccentColor()`
- `apps/front/src/components/results/TraitColorPalette.stories.tsx` — New: Storybook documentation (5 stories)
