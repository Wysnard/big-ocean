# Geometric Ocean — Ambient Sea Life System

> **Supersedes:** "Chat Interface Visual Calm" section in Visual Design Foundation and "Visual Depth Metaphor During Assessment / 5-Zone Progression System" in Core Experience document.

## Design Philosophy

The chat assessment is a **dive into the deep ocean**. While the user converses with Nerin, the interface is alive with geometric sea creatures — seaweed swaying, fish swimming, jellyfish drifting, bubbles rising. Every creature is built from **simple geometric primitives** (rectangles, diamonds, circles, triangles, lines) — no illustrations, no SVG paths, no figurative art. The style is Bauhaus meets marine biology.

This system is **completely decoupled from user assessment data**. Creatures do not encode personality scores, trait levels, or confidence. They exist purely as atmospheric design — making the 30-minute conversation feel like inhabiting a living space rather than sitting in a chat window. The ocean ties directly to the Big Ocean brand identity.

**Core Principles:**
- Creatures are decorative, never data-driven — no influence on user responses
- Movement is organic and varied — no two creatures share timing cycles
- The ocean is alive and aware of conversation rhythm, not conversation content
- Performance is invisible — CSS animations, no canvas/WebGL overhead
- Both mobile and desktop receive a thoughtful, complete experience

---

## Creature Catalog

### 1. Seaweed

**Composition:** 3-4 thin vertical rectangles per group, slightly different heights, anchored at bottom edge of viewport.

```
    ▮  ▮  ▮
    ▮  ▮  ▮ ▮
    ▮  ▮  ▮ ▮
──────────────
```

**Quantity:** 2 primary groups (bottom-left and bottom-right corners) + 2 accent groups on desktop (closer to center, shorter stalks)

**Sizing:**
| Property | Desktop | Mobile |
|----------|---------|--------|
| Individual stalk width | 6-10px | 4-6px |
| Stalk height range | 100-170px | 60-100px |
| Stalks per group | 3-4 | 2-3 |
| Group width | ~60px | ~40px |
| Border radius | 2px (top corners) | 2px (top corners) |
| Accent group height | 60-100px | N/A (no accent groups on mobile) |

**Movement — Sway:**
- Primary motion: Horizontal sine-wave sway (CSS `translateX` on `@keyframes`)
- Sway amplitude: ±8px desktop, ±5px mobile
- Cycle duration: 4-6s per stalk
- Each stalk within a group has a ~200ms animation-delay offset — creates a ripple effect as if current is passing through
- Stalks sway from their anchor point (bottom), creating a natural hinged movement via `transform-origin: bottom center`

**Anchoring:** Bottom edge of the chat viewport. Primary groups positioned in corners, accent groups offset toward center (desktop only). On desktop, seaweed extends slightly into the margin gutters. On mobile, it peeks up from behind the input bar area.

**Crosses chat area:** No — anchored to edges.

---

### 2. Diamond Fish

**Composition:** Large diamond (body) + small diamond (tail) offset behind, connected visually as a single unit.

```
  ◆◇  →
```

**Quantity:** 3 (at different vertical heights and speeds for visual variety)

**Sizing:**
| Property | Desktop | Mobile |
|----------|---------|--------|
| Body diamond | 24×24px | 16×16px |
| Tail diamond | 12×12px | 8×8px |
| Gap between body and tail | 2px | 1px |
| Total footprint | ~40×24px | ~26×16px |

**Construction:** Each diamond is a square rotated 45°. Tail is positioned trailing the body along the swim direction. The fish unit rotates to align with its travel direction.

**Movement — Swim:**
- Follows a gentle cubic-bezier path across the viewport (horizontal dominant with vertical oscillation)
- Desktop: Full viewport crossing, ~35-48s per pass (deliberately slow and meditative)
- Mobile: Full viewport crossing, ~40-55s per pass
- Vertical bob: ±6px sine wave overlaid on the path, 3s cycle
- Direction: Alternates left-to-right and right-to-left between passes
- After exiting viewport, fish re-enters from the opposite side after a 5-10s pause
- Each fish swims at a different height (upper third, middle, lower third) and has a unique speed (e.g., 35s, 42s, 48s) to avoid synchronized movement

**Crosses chat area:** Yes. Opacity drops to ~0.04 (light mode) / ~0.06 (dark mode) when passing through the central chat content column. Fish renders behind message bubbles (z-index below chat content layer). Speed remains constant — no pause or acceleration in the chat zone.

---

### 3. School Fish

**Composition:** ~9 small triangles (pointing in swim direction) moving as a coordinated group with individual micro-variation.

```
  ▸
    ▸  ▸
  ▸    ▸  →
    ▸  ▸
  ▸    ▸
```

**Quantity:** 1 school of ~9 individuals

**Sizing:**
| Property | Desktop | Mobile |
|----------|---------|--------|
| Individual triangle | 8×6px | 6×5px |
| School formation spread | ~100×80px | ~60×50px |
| Space between individuals | 10-18px random | 8-14px random |

**Construction:** Each fish is a CSS triangle (border trick or `clip-path: polygon()`). Triangles point in the school's travel direction. Each individual has a randomized offset from the school center.

**Movement — Flocking:**
- The school has a **group vector** — a shared direction and speed driving the overall path
- Group path: Gentle bezier curve across viewport, ~35-42s per crossing (slow, deliberate pace)
- Individual variation: Each triangle has its own micro-animation — ±4px position offset on a 2-3s cycle, 50-150ms stagger between individuals
- Formation breathing: The school gently compresses and expands its formation spread (±15%) on a 6-8s cycle
- Direction changes: The school can gently curve mid-crossing. When turning, individuals follow with 50-150ms stagger — creating the classic flocking cascade
- After exiting viewport, school re-enters from opposite side after 8-15s pause

**Crosses chat area:** Yes. Same opacity rules as Diamond Fish (~0.04 light / ~0.06 dark). The school is the most dynamic element — it may cross through the upper or lower third of the chat area, adding life without competing with message text.

---

### 4. Jellyfish

**Composition:** Circle (bell) + 3-4 thin vertical lines (tentacles) trailing below.

```
    ●
    ┊┊┊
```

**Quantity:** 2 (positioned on opposite sides of the viewport for balance)

**Sizing:**
| Property | Desktop | Mobile |
|----------|---------|--------|
| Bell diameter | 28-32px | 20-24px |
| Tentacle length | 30-40px | 20-28px |
| Tentacle width | 1-2px | 1px |
| Tentacle spacing | 6-8px | 4-6px |
| Total height | ~70px | ~50px |

**Construction:** Bell is a CSS circle (border-radius: 50%). Tentacles are thin divs or pseudo-elements, with slight `border-radius` on ends for softness. Tentacles are anchored to the bottom of the bell.

**Movement — Drift & Pulse:**
- Primary motion: Slow upward drift, ~55-65s to traverse the viewport vertically (deliberately slow, meditative pace)
- Each jellyfish has a unique speed (e.g., 55s and 65s) to avoid synchronized movement
- Bell pulse: `scaleY` oscillation (1.0 → 0.85 → 1.0) on a 3-4s cycle — mimics the propulsion contraction of a real jellyfish
- Tentacle sway: Tentacles swing opposite to the bell pulse. When bell contracts (scaleY down), tentacles spread outward slightly. When bell expands, tentacles straighten. Creates a breathing organic feel.
- Horizontal drift: ±12px sine wave, 8-10s cycle (not purely vertical — meanders gently)
- When jellyfish exits top of viewport, it resets to below the bottom edge after a 10-20s pause

**Positioning:** Upper area of the viewport, in the margins on desktop — one on each side. On mobile, one positioned in the top-right or top-left background, partially clipped by viewport edge (peeking in from above). Second jellyfish hidden on small viewports (<500px) to reduce density.

**Crosses chat area:** No — remains in upper margins/background periphery.

---

### 5. Bubbles

**Composition:** 2-3 small circles of varying sizes, rising upward.

```
  ○
    ○
  ○
```

**Quantity:** 2-3 active bubbles at any given time, spawning continuously from seaweed areas.

**Sizing:**
| Property | Desktop | Mobile |
|----------|---------|--------|
| Small bubble | 4-6px | 3-5px |
| Medium bubble | 8-10px | 6-8px |
| Large bubble | 12-14px | 8-10px |

**Construction:** CSS circles (border-radius: 50%) with a subtle border (1px) and slight inner gradient or opacity variation to suggest translucency.

**Movement — Rise:**
- Vertical rise from bottom to top, ~8-12s per bubble
- Horizontal wobble: ±4-6px sine wave, 2-3s cycle
- Size pulse: Gentle scale oscillation (0.95 → 1.05 → 0.95) on a 1.5s cycle — subtle breathing
- Spawn rate: A new bubble spawns every 4-6s from the seaweed anchor points
- Stagger: Bubbles have randomized horizontal start positions within the seaweed group width
- Fade: Bubbles fade to opacity 0 over the final 15% of their rise

**Positioning:** Rise from seaweed anchor points along left and right edges. On desktop, they drift along the margin gutters. On mobile, they rise along the viewport edges.

**Crosses chat area:** No — rises along edges only.

---

## Creature Summary

| Creature | Geometric Primitives | Count | Color Identity | Crosses Chat | Primary Motion |
|----------|---------------------|-------|---------------|-------------|----------------|
| Seaweed | 3-4 thin vertical rectangles | 2 primary + 2 accent groups | Teal | No (anchored) | Sway left-right (sine) |
| Diamond Fish | Large diamond + small diamond | 3 (varied heights/speeds) | Orange/Gold | Yes (low opacity) | Swim horizontal bezier path |
| School Fish | ~9 small triangles | 1 school | Pink | Yes (low opacity) | Flocking with individual variation |
| Jellyfish | Circle + 3-4 trailing lines | 2 (opposite sides) | Purple | No (upper margins) | Drift upward + bell pulse |
| Bubbles | 2-3 small circles | Continuous spawn | Peach/White | No (edges only) | Rise with wobble |

**Total active primitives:** ~35-40 geometric shapes on screen at any given time, perceived as 5 distinct creature types. Each creature type has its own distinct color from the brand palette — no two creature types share a hue.

---

## Layout — Desktop (900px+)

```
┌──────────────────────────────────────────────────┐
│  ●      ○  ○                       ●             │
│  ┊┊┊   ○          ┌──────────────┐ ┊┊┊           │
│                    │              │                │
│   ◆◇  →           │    Chat      │      ◆◇  →    │
│                    │   Content    │     ▸          │
│         ◆◇  →     │   max-w:     │   ▸  ▸  ▸ →   │
│                    │  900-1100px  │  ▸    ▸  ▸    │
│                    │              │    ▸  ▸       │
│  ▮ ▮ ▮   ▮ ▮     └──────────────┘   ▮ ▮   ▮ ▮ ▮ │
│  ▮ ▮ ▮ ▮ ▮ ▮ ┌──────────────────┐ ▮ ▮ ▮ ▮ ▮ ▮  │
│  ▮ ▮ ▮ ▮ ▮   │     Input Bar    │   ▮ ▮ ▮ ▮ ▮  │
│───────────────└──────────────────┘───────────────│
└──────────────────────────────────────────────────┘
```

**Layer architecture (z-index):**

| Layer | Z-Index | Contents | Opacity Range |
|-------|---------|----------|---------------|
| Background canvas | 0 | Large blurred creatures passing behind chat (fish, school) | 0.03-0.06 |
| Chat content | 10 | Messages, input bar, depth meter | 1.0 |
| Margin creatures | 5 | Seaweed, jellyfish, bubbles, fish (when in margins) | 0.10-0.35 |

**Margin creatures** live in the gutters between viewport edges and the chat column (the space outside max-w: 900-1100px). They are more visible here (opacity 0.15-0.35) because they don't compete with text.

**Background layer** is visible through the gaps between and behind message bubbles. Fish and school cross this layer at very low opacity when traversing the chat column.

---

## Layout — Mobile (<900px)

```
┌────────────────────┐
│ ○                  │
│            ●       │
│            ┊┊      │
│                    │
│  Chat Messages     │
│  full width        │
│                    │
│              ◆◇ → │
│                    │
│  ▮ ▮         ▮ ▮  │
│ ┌────────────────┐ │
│ │   Input Bar    │ │
│ └────────────────┘ │
└────────────────────┘
```

**Mobile adaptations:**
- All creatures are background-only (no margin layer — chat is full width)
- Creatures stay in the periphery: top/bottom edges and left/right margins of the background
- Fish and school prefer upper and lower thirds when crossing, avoiding the dense text center
- All creature sizes reduced (see individual sizing tables)
- Opacity reduced across the board: max 0.06 for crossing creatures, max 0.15 for edge creatures
- Seaweed peeks up from behind the input bar at bottom corners
- Jellyfish is partially clipped by the top viewport edge — peeking in from above
- Bubbles rise along the very edges (leftmost/rightmost 30px)

**Key mobile rule:** Text readability is never compromised. Creatures are whispers, not statements.

---

## Color Mapping

Colors are drawn from the existing brand palette, used abstractly (not encoding any data). **Each creature type has its own unique color** — this creates visual distinction and makes the ocean feel rich and varied.

### Light Mode

| Creature | Color Identity | Hex | Opacity |
|----------|---------------|-----|---------|
| Seaweed stalks | Teal (`--tertiary`) | `#00B4A6` | 0.12-0.15 |
| Diamond Fish body | Orange (`--secondary`) | `#FF6B2B` | 0.10-0.12 (chat crossing: 0.04) |
| Diamond Fish tail | Orange lighter | `#FF8F5E` | Same as body |
| School Fish triangles | Pink (`--primary`) | `#FF0080` | 0.08-0.12 (chat crossing: 0.04) |
| Jellyfish bell | Purple | `#8B5CF6` | 0.08-0.10 |
| Jellyfish tentacles | Purple lighter | `#A78BFA` | 0.05-0.06 |
| Bubbles | Peach (`--accent`) | `#FFE8D8` | 0.15-0.20 border, 0.05 fill |

### Dark Mode

| Creature | Color Identity | Hex | Opacity |
|----------|---------------|-----|---------|
| Seaweed stalks | Hot Pink (`--tertiary` dark) | `#FF2D9B` | 0.15-0.20 |
| Diamond Fish body | Gold (`--secondary` dark) | `#FFB830` | 0.12-0.18 (chat crossing: 0.06) |
| Diamond Fish tail | Gold lighter | `#FFD060` | Same as body |
| School Fish triangles | Teal (`--primary` dark) | `#00D4C8` | 0.12-0.15 (chat crossing: 0.06) |
| Jellyfish bell | Lavender | `#C4B5FD` | 0.12-0.15 |
| Jellyfish tentacles | Lavender lighter | `#DDD6FE` | 0.08-0.10 |
| Bubbles | Warm White | `#F0EDE8` | 0.10-0.15 border, 0.04 fill |

**Dark mode is the deep ocean.** Creatures become softly bioluminescent against `#0A0E27` — glowing teal, gold, pink, and lavender. This is where the system has the most visual impact.

---

## Dynamism — Three Rhythm Layers

### 1. Ambient (Always Running)

Every creature has its own CSS `@keyframes` animation running continuously. No two creatures share timing cycles, which creates organic, non-repeating visual patterns.

**Implementation:** Pure CSS — `animation` property on each creature element. GPU-composited transforms only (`translate`, `scale`, `rotate`). No JavaScript required for ambient movement.

**Performance cost:** Effectively zero — CSS animations on composited layers don't trigger layout or paint.

### 2. Scroll-Reactive (Parallax)

As the user scrolls through the message history, creatures shift at different speeds, creating depth.

| Layer | Parallax Rate | Effect |
|-------|--------------|--------|
| Background creatures | 0.2x scroll speed | Barely move — deep background |
| Margin creatures | 0.4x scroll speed | Gentle drift — mid-ground |
| Chat content | 1.0x (normal scroll) | Foreground |

**Implementation:** Single `requestAnimationFrame` loop listening to scroll events. Applies `translateY` offset to creature containers based on `scrollTop × parallaxRate`. Throttled to scroll events only — no polling.

### 3. Conversation Pulse

When a new message arrives (user or Nerin), the ocean briefly responds — not to content, but to the event of a message appearing.

| Creature | Pulse Response | Duration | Easing |
|----------|---------------|----------|--------|
| Seaweed | Sway amplitude increases 40% for one cycle | ~5s | ease-out back to normal |
| Diamond Fish | Brief speed boost (1.3x) then return | ~2s | ease-out |
| School Fish | Formation scatters slightly then regroups | ~3s | ease-in-out |
| Jellyfish | One extra bell pulse (deeper contraction) | ~3s | ease-out |
| Bubbles | 2-3 extra bubbles spawn from seaweed | ~4s | normal spawn then rise |

**Implementation:** CSS class toggle triggered by message count change in React state. Classes apply temporary animation overrides using CSS transitions. Class removed after animation completes.

---

## Dive Narrative (Nice-to-Have)

A subtle, quiet atmospheric shift based on message count. Not data-driven — purely tied to how long the conversation has been going. Barely perceptible consciously, but the space *feels* different if you've been in it a while.

### Surface (Messages 1-8)

Default state. All creatures at normal pace and opacity.
- Full bubble spawn rate
- School fish present and active
- Seaweed sway at normal amplitude
- Standard color opacities

### Deeper (Messages 9+)

- All creature movement slows ~20% (CSS animation duration increases)
- Bubble spawn rate reduces to every 8-10s (from 4-6s)
- Jellyfish becomes slightly more prominent (opacity +0.03)
- Seaweed sway amplitude reduces ~15% (calmer current)
- No color changes, no dramatic shifts

**Implementation:** CSS custom properties (`--ocean-speed-multiplier`, `--ocean-bubble-rate`) toggled by a data attribute on the ocean container element: `data-depth="surface"` or `data-depth="deep"`. Transition between states over 3-5s with `transition` on animation-duration.

---

## Component Architecture

### `<GeometricOcean />`

Single React component rendered as a **fixed-position layer** behind the chat interface.

**Props:**
```typescript
interface GeometricOceanProps {
  messageCount: number;    // Drives dive narrative + conversation pulse
  isVisible?: boolean;     // Hide during results transition
}
```

**Internal structure:**
```
<div data-slot="geometric-ocean" data-depth="surface|deep">
  <!-- Background layer (z-0) -->
  <div data-slot="ocean-bg-layer">
    <DiamondFish id={1} />  <!-- Upper third, 35s -->
    <DiamondFish id={2} />  <!-- Middle, 42s -->
    <DiamondFish id={3} />  <!-- Lower third, 48s -->
    <SchoolFish count={9} />
  </div>

  <!-- Margin layer (z-5) — desktop only -->
  <div data-slot="ocean-margin-layer">
    <Seaweed position="bottom-left" />
    <Seaweed position="bottom-right" />
    <Seaweed position="accent-left" />   <!-- Desktop only -->
    <Seaweed position="accent-right" />  <!-- Desktop only -->
    <Jellyfish side="left" speed={55} />
    <Jellyfish side="right" speed={65} />
    <Bubbles anchor="bottom-left" />
    <Bubbles anchor="bottom-right" />
  </div>
</div>
```

**Each creature** is a lightweight sub-component rendering pure CSS shapes (divs with transforms, border-radius, clip-path). No SVG, no canvas, no external assets.

---

## Performance Budget

| Concern | Approach |
|---------|----------|
| Ambient animation | CSS `@keyframes` on GPU-composited transforms — ~0 CPU |
| Scroll parallax | Single `rAF` loop, transform-only — no layout recalc |
| Conversation pulse | CSS class toggle, transition-driven — no JS animation loop |
| DOM elements | ~40-50 divs total for all creatures — negligible |
| Bundle size | Zero dependencies — pure CSS + minimal React |
| Memory | No canvas buffers, no WebGL contexts |
| Mobile battery | CSS animations are GPU-optimized, minimal wake-ups |

**Total overhead:** Comparable to a modest CSS background animation. No measurable impact on chat interactivity or scroll performance.

---

## Accessibility

- **All creatures are decorative:** Every ocean element is `aria-hidden="true"` with `role="presentation"`
- **No information is conveyed:** Creatures encode zero assessment data — removing them changes nothing about the experience
- **`prefers-reduced-motion`:** All animations stop. Creatures render as static shapes at their default positions with a gentle `opacity` breathing animation only (0.1 → 0.15 → 0.1, 8s cycle via `opacity` transition). This preserves the atmospheric feel without motion.
- **Contrast preservation:** Creature opacities are calibrated to never reduce text contrast below WCAG AA thresholds. Maximum creature opacity in the chat content area is 0.06 — mathematically insignificant to text contrast ratios.
- **Focus management:** Ocean layer has `pointer-events: none` — it never intercepts clicks, taps, or focus.
- **Screen readers:** Entire `<GeometricOcean />` component is invisible to assistive technology. No alt text needed — it is purely decorative.

---

## Relationship to Existing Spec Sections

**Supersedes:**
- "Chat Interface Visual Calm" in Visual Design Foundation — which stated "No coral, no floating characters, no background illustrations during conversation." The Geometric Ocean replaces this with a carefully controlled ambient system that maintains calm through low opacity and geometric restraint rather than absence.
- "Visual Depth Metaphor During Assessment / 5-Zone Progression System" in Core Experience — the 5-zone background color shift system is replaced by the simpler 2-stage dive narrative. Background color remains constant (Warm Cream light / Abyss Navy dark) with creatures providing the atmospheric evolution instead.
- "Inline Facet Icons" and "Mini Evidence Cards" from the same section — removed. No assessment data is shown during the conversation to avoid influencing user responses.

**Preserves:**
- Depth Meter (desktop sidebar) — remains as the primary progress indicator
- Milestone badges at 25%, 50%, 70% — unchanged
- In-chat celebration card — unchanged
- All message bubble styling and typography — unchanged
- Error handling and input bar behavior — unchanged

---
