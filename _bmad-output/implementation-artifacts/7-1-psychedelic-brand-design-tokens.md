# Story 7.1: Psychedelic Brand Design Tokens (Color + Spacing + Radius)

Status: ready-for-dev

<!-- Note: This replaces the old 7-1-ocean-brand-color-theme.md which implemented the Coral Reef/Moonlit Navy OKLCH palette. The new Epic 7 (rewritten 2026-02-13) specifies a completely different psychedelic-bold palette with hex colors. -->

## Story

As a **User**,
I want **the application to have a distinctive, psychedelic-bold visual identity with vibrant colors**,
So that **the brand feels alive, memorable, and unmistakably "big-ocean" — not a default shadcn/ui app**.

## Acceptance Criteria

1. **Given** the application loads in light mode **When** I view any page **Then** the primary color is Electric Pink (`#FF0080`) **And** secondary is Vivid Orange (`#FF6B2B`) **And** tertiary is Saturated Teal (`#00B4A6`) **And** backgrounds use Warm Cream (`#FFF8F0`) **And** surfaces use Soft Blush (`#FFF0E8`) **And** the palette feels bold, warm, and psychedelic
2. **Given** I view the application in dark mode **When** the dark theme is active **Then** the primary color shifts to Saturated Teal (`#00D4C8`) **And** secondary is Rich Gold (`#FFB830`) **And** tertiary is Hot Pink (`#FF2D9B`) **And** backgrounds use Abyss Navy (`#0A0E27`) **And** surfaces use Deep Navy (`#141838`) **And** dark mode feels like a distinct personality ("deep-ocean"), not just inverted light mode
3. **Given** I interact with buttons, links, and focus states **When** primary color is applied **Then** all interactive elements use semantic variables (`bg-primary`, `text-primary-foreground`) **And** WCAG AA contrast ratios are maintained (4.5:1 for text, 3:1 for large text) **And** vibrating complementary pairs are reserved for non-text celebration surfaces only
4. **Given** I view components across the application **When** border radius and spacing are applied **Then** buttons and inputs use 12px radius **And** cards use 16px radius **And** modals/dialogs use 24px radius **And** hero containers use 32px radius **And** spacing follows the defined scale (4px to 96px)

## Tasks / Subtasks

- [ ] Task 1: Replace `:root` light mode tokens with Psychedelic Celebration palette (AC: #1)
  - [ ] Replace OKLCH values with hex-based values for psychedelic palette
  - [ ] Set `--primary` to Electric Pink `#FF0080`
  - [ ] Set `--primary-foreground` to `#FFFFFF`
  - [ ] Set `--secondary` to Vivid Orange `#FF6B2B`
  - [ ] Set `--tertiary` to Saturated Teal `#00B4A6` (NEW token)
  - [ ] Set `--background` to Warm Cream `#FFF8F0`
  - [ ] Set `--foreground` to Deep Charcoal `#1A1A2E`
  - [ ] Set `--card` to Soft Blush `#FFF0E8`
  - [ ] Set `--muted` / `--muted-foreground` for Warm Gray system
  - [ ] Set `--accent` to Light Peach `#FFE8D8`
  - [ ] Set `--destructive` to Coral Red `#FF3B5C`
  - [ ] Set `--border` / `--input` to Blush Border `#FFD6C4`
  - [ ] Set `--ring` to Electric Pink `#FF0080`
  - [ ] Add `--success` (`#00C896`) and `--warning` (`#FFB020`) tokens
  - [ ] Add `--primary-hover` to Neon Fuchsia `#FF1493`
  - [ ] Update `--chart-*` with psychedelic tones
  - [ ] Update `--sidebar-*` tokens
- [ ] Task 2: Replace `.dark` tokens with Abyss Deep-Ocean palette (AC: #2)
  - [ ] Set dark `--primary` to Saturated Teal `#00D4C8`
  - [ ] Set dark `--primary-hover` to Bright Teal `#00EDE5`
  - [ ] Set dark `--primary-foreground` to Abyss Navy `#0A0E27`
  - [ ] Set dark `--secondary` to Rich Gold `#FFB830`
  - [ ] Set dark `--tertiary` to Hot Pink `#FF2D9B` (NEW token)
  - [ ] Set dark `--background` to Abyss Navy `#0A0E27`
  - [ ] Set dark `--foreground` to Warm White `#F0EDE8`
  - [ ] Set dark `--card` to Deep Navy `#141838`
  - [ ] Set dark `--muted` / `--muted-foreground` for Muted Lavender system
  - [ ] Set dark `--accent` to Midnight `#1C2148`
  - [ ] Set dark `--destructive` to Neon Coral `#FF4D6A`
  - [ ] Set dark `--border` / `--input` to Navy Edge `#252A52`
  - [ ] Set dark `--ring` to Saturated Teal `#00D4C8`
  - [ ] Add dark `--success` (`#00E0A0`) and `--warning` (`#FFB830`)
  - [ ] Update dark `--chart-*` with deep-ocean tones
  - [ ] Update dark `--sidebar-*` tokens
- [ ] Task 3: Add gradient CSS custom properties (AC: #1, #2)
  - [ ] Light `--gradient-celebration`: `linear-gradient(120deg, #FF0080, #FF1493, #FF6B2B)`
  - [ ] Light `--gradient-progress`: `linear-gradient(90deg, #00B4A6, #00D4C8)`
  - [ ] Light `--gradient-surface-glow`: `radial-gradient(circle, #FFF0E8, #FFF8F0)`
  - [ ] Dark `--gradient-celebration`: `linear-gradient(120deg, #00D4C8, #FFB830, #FF2D9B)`
  - [ ] Dark `--gradient-progress`: `linear-gradient(90deg, #00D4C8, #00EDE5)`
  - [ ] Dark `--gradient-surface-glow`: `radial-gradient(circle, #1C2148, #0A0E27)`
  - [ ] Rename `--gradient-ocean*` to `--gradient-celebration` / `--gradient-progress` / `--gradient-surface-glow`
- [ ] Task 4: Add spacing scale tokens (AC: #4)
  - [ ] `--space-1: 4px` through `--space-24: 96px` (full scale)
- [ ] Task 5: Add radius scale tokens (AC: #4)
  - [ ] `--radius-button: 12px`, `--radius-input: 12px`
  - [ ] `--radius-card: 16px`
  - [ ] `--radius-dialog: 24px`
  - [ ] `--radius-hero: 32px`
  - [ ] `--radius-full: 9999px`
  - [ ] `--radius-chat-bubble: 16px`, `--radius-chat-sender: 4px`
  - [ ] Keep existing `--radius` for shadcn/ui backward compat but update value
- [ ] Task 6: Update `@theme inline` block with new token mappings
  - [ ] Add `--color-tertiary`, `--color-tertiary-foreground`
  - [ ] Add `--color-success`, `--color-warning`
  - [ ] Add `--color-primary-hover`
  - [ ] Replace gradient mappings: celebration, progress, surface-glow
  - [ ] Add spacing and radius scale mappings
  - [ ] Keep existing trait/facet token mappings (from old 7.1/7.3/7.5 work)
- [ ] Task 7: Update depth zone tokens (AC: #1, #2)
  - [ ] Light depth zones: warm cream progression matching new palette
  - [ ] Dark depth zones: Abyss Navy progression (matching new `#0A0E27` system)
- [ ] Task 8: WCAG AA contrast verification (AC: #3)
  - [ ] All primary/foreground pairs >= 4.5:1 in both modes
  - [ ] All muted-foreground/muted pairs >= 4.5:1 in both modes
  - [ ] Verify Electric Pink on white has sufficient contrast (may need dark text)
  - [ ] Verify Saturated Teal on Abyss Navy has sufficient contrast
  - [ ] Document any vibrating pairs that must be celebration-surface-only
- [ ] Task 9: Update Storybook color palette story
  - [ ] Relabel to "Psychedelic Celebration (Light)" / "Abyss Deep-Ocean (Dark)"
  - [ ] Show new tokens including tertiary, success, warning
  - [ ] Show gradient examples (celebration, progress, surface-glow)
  - [ ] Show spacing and radius scale visual reference
- [ ] Task 10: Verify existing components still render correctly
  - [ ] `pnpm build --filter=front` — 0 errors
  - [ ] `pnpm lint` — no new warnings
  - [ ] `pnpm test:run` — no regressions
  - [ ] Visual check: existing components use semantic vars and pick up new palette

## Dev Notes

### What This Story Changes

Replaces the **Coral Reef / Moonlit Navy OKLCH palette** (from old Story 7.1) with the **Psychedelic Celebration / Abyss Deep-Ocean hex palette** defined in the new UX Design Specification. Also adds spacing scale and radius scale tokens that didn't exist before.

The change is primarily in `packages/ui/src/styles/globals.css` and the Storybook color palette story. No component code changes needed — existing components use semantic variables.

### Design Philosophy

**Light Mode — Psychedelic Celebration:**
- Electric Pink (`#FF0080`) is the dominant brand color — bold, unapologetic
- Vivid Orange (`#FF6B2B`) and Saturated Teal (`#00B4A6`) provide complementary energy
- Warm Cream backgrounds give vibrant colors breathing room
- This is a consumer personality platform, not enterprise software

**Dark Mode — Abyss Deep-Ocean:**
- Primary shifts to Teal (not just darker pink) — a completely different personality
- Rich Gold (`#FFB830`) as punctuation, not surface (bioluminescence principle)
- Abyss Navy (`#0A0E27`) is the deepest ocean — immersive
- Gold appears at achievement moments only

**Gold Principle (Dark Mode):** Gold is punctuation, not surface. Teal carries dark mode as primary. Gold appears exclusively at achievement moments — precision milestones, archetype reveal, premium signals.

### Key File to Modify

**`packages/ui/src/styles/globals.css`** — Primary file. Currently 303 lines with OKLCH-based Coral Reef palette + trait/facet tokens + animations.

### Current State (What Exists)

The file already has:
- OKLCH-based coral reef light mode tokens (lines 11-65)
- OKLCH-based moonlit navy dark mode tokens (lines 121-182)
- Big Five trait + facet color tokens (lines 67-118, 176-181) — **KEEP THESE**
- Trait gradient tokens (lines 113-118) — **KEEP THESE**
- `@theme inline` mappings for all trait/facet colors — **KEEP THESE**
- Depth zone tokens — **UPDATE to match new palette**
- Gradient tokens (ocean-*) — **REPLACE with celebration/progress/surface-glow**
- Animations (wave, caustic, bubble, fadeInUp, float) — **KEEP THESE**

### What to Keep vs Replace

| Section | Action |
|---------|--------|
| `:root` surfaces, core semantic, charts, sidebar, gradients | **REPLACE** with psychedelic hex palette |
| `.dark` surfaces, core semantic, charts, sidebar, gradients | **REPLACE** with abyss hex palette |
| `:root` Big Five trait tokens (`--trait-*`, `--facet-*`) | **KEEP** unchanged |
| `.dark` Big Five trait tokens | **KEEP** unchanged |
| Trait gradient tokens (`--gradient-trait-*`) | **KEEP** unchanged |
| Depth zone tokens (both modes) | **UPDATE** to match new palette |
| `@theme inline` trait/facet mappings | **KEEP** unchanged |
| `@theme inline` gradient mappings | **UPDATE** names (ocean → celebration etc.) |
| `@theme inline` — add new tokens | **ADD** tertiary, success, warning, spacing, radius |
| `@layer base` block | **NO CHANGE** |
| `@keyframes` animations | **NO CHANGE** |

### New Tokens (Not in Current File)

These tokens are NEW and need to be added:

```css
/* Tertiary color (both modes) */
--tertiary: ...;
--tertiary-foreground: ...;

/* Success and Warning */
--success: ...;
--warning: ...;

/* Hover states */
--primary-hover: ...;

/* Spacing scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
--space-16: 64px;
--space-24: 96px;

/* Radius scale */
--radius-button: 12px;
--radius-input: 12px;
--radius-card: 16px;
--radius-dialog: 24px;
--radius-hero: 32px;
--radius-full: 9999px;
--radius-chat-bubble: 16px;
--radius-chat-sender: 4px;
```

### Target Palette (from Epic 7 Spec)

#### Light Mode `:root` — Psychedelic Celebration

```css
--primary: #FF0080;           /* Electric Pink */
--primary-hover: #FF1493;     /* Neon Fuchsia */
--primary-foreground: #FFFFFF;
--secondary: #FF6B2B;         /* Vivid Orange */
--secondary-foreground: #FFFFFF;
--tertiary: #00B4A6;          /* Saturated Teal */
--tertiary-foreground: #FFFFFF;
--background: #FFF8F0;        /* Warm Cream */
--foreground: #1A1A2E;        /* Deep Charcoal */
--card: #FFF0E8;              /* Soft Blush */
--card-foreground: #1A1A2E;
--muted: #FFF0E8;
--muted-foreground: #6B6580;  /* Warm Gray */
--accent: #FFE8D8;            /* Light Peach */
--accent-foreground: #1A1A2E;
--destructive: #FF3B5C;       /* Coral Red */
--destructive-foreground: #FFFFFF;
--border: #FFD6C4;            /* Blush Border */
--input: #FFD6C4;
--ring: #FF0080;
--success: #00C896;           /* Ocean Green */
--warning: #FFB020;           /* Amber */
```

#### Dark Mode `.dark` — Abyss Deep-Ocean

```css
--primary: #00D4C8;           /* Saturated Teal */
--primary-hover: #00EDE5;     /* Bright Teal */
--primary-foreground: #0A0E27;
--secondary: #FFB830;         /* Rich Gold */
--secondary-foreground: #0A0E27;
--tertiary: #FF2D9B;          /* Hot Pink */
--tertiary-foreground: #FFFFFF;
--background: #0A0E27;        /* Abyss Navy */
--foreground: #F0EDE8;        /* Warm White */
--card: #141838;              /* Deep Navy */
--card-foreground: #F0EDE8;
--muted: #141838;
--muted-foreground: #8B85A0;  /* Muted Lavender */
--accent: #1C2148;            /* Midnight */
--accent-foreground: #F0EDE8;
--destructive: #FF4D6A;       /* Neon Coral */
--destructive-foreground: #FFFFFF;
--border: #252A52;            /* Navy Edge */
--input: #252A52;
--ring: #00D4C8;
--success: #00E0A0;           /* Mint */
--warning: #FFB830;           /* Gold */
```

### WCAG Contrast Considerations

Electric Pink `#FF0080` on white `#FFFFFF` has a contrast ratio of approximately 3.7:1 — this **fails** WCAG AA for body text (4.5:1 required). Options:
1. Use `#FFFFFF` foreground on `#FF0080` backgrounds (white text on pink — ~3.7:1, passes for large text only)
2. For small body text on pink, darken pink slightly or use dark foreground
3. The spec says `--primary-foreground: #FFFFFF` — this works for buttons (large text) but may need verification for smaller text contexts

The dev agent should:
- Verify exact contrast ratios using Chrome DevTools
- Ensure buttons (large text) pass at 3:1
- If small text on primary is needed, use `--foreground` (#1A1A2E) instead of `--primary-foreground`

Dark mode: Teal `#00D4C8` on Navy `#0A0E27` = high contrast (~9.5:1), no issues.

### Anti-Patterns

```
DO NOT keep the old OKLCH values — replace completely with hex
DO NOT remove trait/facet color tokens (--trait-*, --facet-*) — those are separate
DO NOT remove animation @keyframes — those are separate
DO NOT change @source or @import directives
DO NOT hard-code color classes in components (bg-pink-500)
DO NOT use Gold as a surface color in dark mode (it's punctuation only)
```

### Tailwind v4 Specifics

This project uses **Tailwind CSS v4**:
- `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- `@custom-variant dark (&:is(.dark *))` for dark mode class strategy
- `@theme inline { ... }` for theme values
- Hex colors work natively, no conversion needed
- New tokens need `@theme inline` entries to be usable as Tailwind classes

### Testing Approach

No unit tests needed for CSS changes. Verification is visual + automated:
1. `pnpm build --filter=front` — confirm CSS compiles
2. `pnpm lint` — no new warnings
3. `pnpm test:run` — no regressions
4. Visual check in browser: light = psychedelic pink/orange/teal, dark = abyss navy/teal/gold
5. Chrome DevTools accessibility panel for contrast verification
6. Storybook: verify updated color palette story

### File Summary

| Action | Path |
|--------|------|
| MODIFY | `packages/ui/src/styles/globals.css` |
| MODIFY | `packages/ui/src/components/color-palette.stories.tsx` |

### References

- [Epic 7 Specification](/_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md) — Story 7.1 full spec with all hex values
- [UX Design Specification](/_bmad-output/planning-artifacts/ux-design-specification.md) — Brand color system context
- [FRONTEND.md](/docs/FRONTEND.md) — Styling conventions, semantic color tokens
- [Current globals.css](/packages/ui/src/styles/globals.css) — File to modify (303 lines, OKLCH coral reef + trait tokens)

## Change Log

- 2026-02-13: Story file created for new Epic 7 psychedelic-bold palette. Replaces old 7-1-ocean-brand-color-theme.md scope.
