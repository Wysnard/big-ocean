# Tech Spec: OCEAN Meter Card (AboutArchetypeCard Redesign)

**Status:** ready-for-dev
**Story:** 8.6 (Results Page Layout Redesign)
**Design reference:** `_bmad-output/implementation-artifacts/archetype-card-mockup-d-fluid.html` (Variant D4 — Dashed Seams)

---

## Overview

Replace the current plain-text `AboutArchetypeCard` with a rich **OCEAN Meter Card** that:

1. Wraps each of the 5 OCEAN traits in a **Layered Depth sub-card** (raised background, hover border)
2. Renders a **continuous fluid bar** per trait with 3 opacity-stepped zones (Low / Mid / High) separated by **dashed seams** — no gap between zones
3. Shows a **floating score badge** (white pill with numeric score) anchored above the bar via a gradient stem
4. Displays the **trait-specific level letter + label** inside each zone (e.g., `P Practical | G Grounded | O Open-minded`)
5. Includes the **level-specific description** from `TRAIT_DESCRIPTIONS` below each bar
6. Uses the existing **trait color system** (`getTraitColor`) and **AccentCard pattern** from `@workspace/ui`

The card replaces the current single `description` prop with structured OCEAN data.

---

## Data Flow

### Currently available at `ProfileView`

| Data | Source | Type |
|------|--------|------|
| `traits` | API response | `readonly TraitResult[]` |
| `oceanCode5` | API response | `OceanCode5` (branded string, e.g., `"ODEWR"`) |

### `TraitResult` shape (from `packages/domain`)

```typescript
{
  name: TraitName;    // "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism"
  score: number;      // 0-120
  level: string;      // Trait-specific letter: "O", "D", "E", "W", "R", etc.
  confidence: number; // 0-1
}
```

### Key domain constants (already exported from `@workspace/domain`)

| Constant | Purpose |
|----------|---------|
| `TRAIT_LETTER_MAP` | Maps trait name to `[lowLetter, midLetter, highLetter]` |
| `TRAIT_LEVEL_LABELS` | Maps letter to human label (e.g., `"O"` -> `"Open-minded"`) |
| `TRAIT_DESCRIPTIONS` | Maps trait name + level letter to 1-sentence description |
| `BIG_FIVE_TRAITS` | Ordered array of 5 trait names (OCEAN order) |
| `getTraitColor(traitName)` | Returns CSS custom property string `var(--trait-openness)` |

No new domain types or API changes required. Everything needed is already in the response payload.

---

## Component Architecture

### New props interface

```typescript
interface OceanMeterCardProps {
  traits: readonly TraitResult[];
  /** Possessive label: "Your" or "Alex's" */
  displayName?: string | null;
}
```

### Rename

| Before | After |
|--------|-------|
| `AboutArchetypeCard` | `OceanMeterCard` |
| `AboutArchetypeCard.tsx` | `OceanMeterCard.tsx` |

### Internal sub-components (co-located in same file, not exported)

| Component | Responsibility |
|-----------|---------------|
| `TraitMeter` | Single trait sub-card: header + fluid bar + description |
| `FluidBar` | The 3-zone continuous bar with dashed seams |
| `ScoreBadge` | Floating white pill badge + gradient stem |

---

## Visual Specification (D4 — Dashed Seams)

### Card container
- Uses standard `Card` from `@workspace/ui`
- `data-slot="ocean-meter-card"`
- `className="col-span-full"` (full-width in the profile grid)

### Card header
- Title: `"Your OCEAN Code"` (or `"{name}'s OCEAN Code"`)
- Subtitle: `"Where you land across each personality dimension"`

### Trait sub-card (`TraitMeter`)

```
┌─ raised bg (#1C1C22), 1px border rgba(255,255,255,0.04), rounded-[14px] ──┐
│                                                                            │
│  [dot] Openness                            ┌─ pill border ─────────────┐  │
│        How you engage with new ideas...    │ O · Open-minded           │  │
│                                            └───────────────────────────┘  │
│                                                                            │
│            ┌──[95]──┐                                                      │
│            │  stem  │                                                      │
│  ┌─────────┼────────┼──────────────────────────────────────────────────┐   │
│  │ P Practical ┊ G Grounded ┊ O Open-minded                           │   │
│  │  18% opacity ┊ 30% opacity ┊ full trait color                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  Novel experiences and unconventional thinking draw you in naturally...    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Fluid bar zones

All 3 zones share the **same rounded track** (no gap). Zone separation is via **dashed vertical seams** only.

| Zone position | When active (user is in this zone) | When passed (lower than user) | When dim (above user) |
|---------------|-------------------------------------|-------------------------------|----------------------|
| Background | Full trait color | 18% / 30% trait color opacity | Transparent |
| Letter text | White, font-weight 600 | rgba(255,255,255,0.3) | rgba(255,255,255,0.1) |
| Label text | rgba(255,255,255,0.6) | rgba(255,255,255,0.15) | rgba(255,255,255,0.06) |

Zone opacity levels for the "passed" state:
- **Zone 1 (Low):** `color-mix(in srgb, {traitColor} 18%, transparent)`
- **Zone 2 (Mid):** `color-mix(in srgb, {traitColor} 30%, transparent)`
- **Zone 3 (High):** Full `{traitColor}`

Dashed seam CSS (applied via `::before` pseudo-element on zones 2 and 3):

```css
background: repeating-linear-gradient(
  180deg,
  rgba(255,255,255,0.15) 0px,
  rgba(255,255,255,0.15) 3px,
  transparent 3px,
  transparent 6px
);
```

### Score badge

- White pill: `background: #fff`, `color: var(--card-bg)`, `border-radius: 4px`, `font-size: 0.6rem`, `font-weight: 600`, mono font
- Gradient stem: `2px` wide, `height: 40px` (spans from badge bottom through bar), gradient from `#fff` to `rgba(255,255,255,0.08)`
- Positioned absolutely at `left: {scorePercentage}%`, `top: -12px`, `transform: translateX(-50%)`

Score percentage formula:

```typescript
const percentage = Math.round((trait.score / 120) * 100);
```

### Level pill badge (top-right of sub-card header)

- Outlined pill: `border: 1px solid color-mix(in srgb, {traitColor} 40%, transparent)`
- Text in trait color, mono font, 0.72rem
- Content: `"{letter} · {label}"` (e.g., `"O · Open-minded"`)

### Trait header

- Left: 8px colored dot + trait display name + tagline (from `TRAIT_DESCRIPTIONS[traitName].tagline`)
- Right: Level pill badge

### Description text below bar

Pulled from `TRAIT_DESCRIPTIONS[traitName].levels[traitLevelLetter]`.

---

## Determining zone state

```typescript
const MAX_SCORE = 120;
const ZONE_THRESHOLDS = [40, 80, MAX_SCORE]; // Low: 0-39, Mid: 40-79, High: 80-120

function getZoneState(
  zoneIndex: number, // 0=Low, 1=Mid, 2=High
  traitScore: number
): "active" | "passed" | "dim" {
  const activeZone = traitScore < 40 ? 0 : traitScore < 80 ? 1 : 2;

  if (zoneIndex === activeZone) return "active";
  if (zoneIndex < activeZone) return "passed";
  return "dim";
}
```

---

## OCEAN trait display names

Use the existing label pattern, but rename "Neuroticism" for user-facing display:

```typescript
const DISPLAY_NAMES: Record<TraitName, string> = {
  openness: "Openness",
  conscientiousness: "Conscientiousness",
  extraversion: "Extraversion",
  agreeableness: "Agreeableness",
  neuroticism: "Emotional Processing",
};
```

This is consistent with the mockups and avoids the negative connotation of "Neuroticism" in a consumer product.

---

## Changes to `ProfileView`

### Before

```tsx
<AboutArchetypeCard description={description} />
```

### After

```tsx
<OceanMeterCard traits={traits} displayName={displayName} />
```

The `description` prop (archetype narrative) is **not used** by this card. It remains available on `ProfileView` for other components or future use (e.g., a separate collapsible "Full Portrait" section).

---

## File changes

| File | Action |
|------|--------|
| `apps/front/src/components/results/AboutArchetypeCard.tsx` | **Delete** |
| `apps/front/src/components/results/OceanMeterCard.tsx` | **Create** — new component |
| `apps/front/src/components/results/OceanMeterCard.test.tsx` | **Create** — tests |
| `apps/front/src/components/results/ProfileView.tsx` | **Edit** — swap `AboutArchetypeCard` for `OceanMeterCard`, update import and props |

---

## Implementation steps

1. **Create `OceanMeterCard.tsx`** with `TraitMeter`, `FluidBar`, `ScoreBadge` sub-components
2. **Update `ProfileView.tsx`** — replace `AboutArchetypeCard` usage with `OceanMeterCard`, pass `traits` and `displayName`
3. **Delete `AboutArchetypeCard.tsx`**
4. **Write tests** (`OceanMeterCard.test.tsx`)
5. **Visual QA** — verify with seeded test data (`pnpm dev`, test user)

---

## Test plan

### Unit tests (`OceanMeterCard.test.tsx`)

| Test | Assertion |
|------|-----------|
| Renders 5 trait meters in OCEAN order | Query for 5 `data-slot="trait-meter"` elements; verify order matches `BIG_FIVE_TRAITS` |
| Each meter shows correct level letter + label | For a score of 95 in openness, check for text "O" and "Open-minded" |
| Each meter shows correct score badge | Check for score number text (e.g., "95") |
| Each meter shows trait description | Check for substring of the `TRAIT_DESCRIPTIONS` level text |
| Neuroticism displays as "Emotional Processing" | Query for text "Emotional Processing", absence of "Neuroticism" |
| Low-scoring trait shows correct active zone | For neuroticism score 28, first zone (R) should have `data-state="active"`, others `dim` |
| High-scoring trait fills passed zones | For openness score 95, zones 1+2 should be `passed`, zone 3 `active` |
| Mid-scoring trait handles middle zone | For a score of 60, zone 1 `passed`, zone 2 `active`, zone 3 `dim` |
| Displays custom name when `displayName` provided | Pass `displayName="Alex"`, check for "Alex's OCEAN Code" |
| Defaults to "Your" when no displayName | Check for "Your OCEAN Code" |

### Data attributes for test queries

| Element | `data-slot` | `data-*` state |
|---------|-------------|----------------|
| Card root | `ocean-meter-card` | — |
| Each trait sub-card | `trait-meter` | `data-trait="openness"` etc. |
| Each bar zone | `meter-zone` | `data-state="active" \| "passed" \| "dim"` |
| Score badge | `score-badge` | — |

---

## Acceptance criteria

1. Card renders 5 trait meters vertically in OCEAN order
2. Each meter shows a continuous fluid bar with 3 dashed-seam zones
3. The user's active zone is colored at full trait color; passed zones at reduced opacity; dim zones are transparent
4. A white score badge floats above the bar at the correct horizontal position
5. Each zone displays its trait-specific letter and label (e.g., "P Practical")
6. The level-specific description from `TRAIT_DESCRIPTIONS` appears below each bar
7. "Neuroticism" is displayed as "Emotional Processing"
8. The card uses `data-slot` and `data-state` attributes per FRONTEND.md conventions
9. All existing `ProfileView` functionality is unaffected
10. No new domain types or API changes required
