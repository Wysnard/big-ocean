# Visual Design Foundation

## Color System

**Design Philosophy:** Psychedelic, bold, saturated — a visual identity that feels alive, distinctive, and unmistakably "big-ocean." Colors are unapologetically vibrant, creating instant brand recognition and celebrating the boldness of authentic self-discovery.

### Light Mode Palette

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--primary` | Electric Pink | `#FF0080` | Primary CTAs, brand accent, active states |
| `--primary-hover` | Neon Fuchsia | `#FF1493` | Hover/pressed states |
| `--secondary` | Vivid Orange | `#FF6B2B` | Secondary actions, highlights, warmth signals |
| `--tertiary` | Saturated Teal | `#00B4A6` | Info, progress bars, trust/science signals |
| `--background` | Warm Cream | `#FFF8F0` | Page backgrounds |
| `--surface` | Soft Blush | `#FFF0E8` | Cards, panels, elevated surfaces |
| `--surface-alt` | Light Peach | `#FFE8D8` | Alternate surface, hover backgrounds |
| `--foreground` | Deep Charcoal | `#1A1A2E` | Primary body text |
| `--muted` | Warm Gray | `#6B6580` | Secondary text, captions |
| `--border` | Blush Border | `#FFD6C4` | Card borders, dividers |
| `--success` | Ocean Green | `#00C896` | Success states, positive signals |
| `--warning` | Amber | `#FFB020` | Warning states |
| `--error` | Coral Red | `#FF3B5C` | Error states, destructive actions |

**Light Mode Gradients:**
- **Celebration gradient:** `linear-gradient(120deg, #FF0080, #FF1493, #FF6B2B)` — Pink → Fuchsia → Orange (milestone toasts, notifications)
- **Progress gradient:** `linear-gradient(90deg, #00B4A6, #00D4C8)` — Teal ramp
- **Surface glow:** `radial-gradient(circle, #FFF0E8, #FFF8F0)` — Subtle warm depth

### Dark Mode Palette

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--primary` | Saturated Teal | `#00D4C8` | Primary CTAs, brand accent, active states |
| `--primary-hover` | Bright Teal | `#00EDE5` | Hover/pressed states |
| `--secondary` | Rich Gold | `#FFB830` | Highlights, premium signals, warmth |
| `--tertiary` | Hot Pink | `#FF2D9B` | Accents, secondary actions, energy |
| `--background` | Abyss Navy | `#0A0E27` | Page backgrounds |
| `--surface` | Deep Navy | `#141838` | Cards, panels, elevated surfaces |
| `--surface-alt` | Midnight | `#1C2148` | Alternate surface, hover backgrounds |
| `--foreground` | Warm White | `#F0EDE8` | Primary body text |
| `--muted` | Muted Lavender | `#8B85A0` | Secondary text, captions |
| `--border` | Navy Edge | `#252A52` | Card borders, dividers |
| `--success` | Mint | `#00E0A0` | Success states |
| `--warning` | Gold | `#FFB830` | Warning states |
| `--error` | Neon Coral | `#FF4D6A` | Error states |

**Dark Mode Gradients:**
- **Celebration gradient:** `linear-gradient(120deg, #00D4C8, #FFB830, #FF2D9B)` — Teal → Gold → Pink (milestone toasts, notifications)
- **Progress gradient:** `linear-gradient(90deg, #00D4C8, #00EDE5)` — Teal ramp
- **Surface glow:** `radial-gradient(circle, #1C2148, #0A0E27)` — Subtle depth

**Dark Mode Gold Principle:** Gold is punctuation, not surface. Teal carries dark mode as the primary accent. Gold appears exclusively at moments of achievement — precision milestones, archetype reveal, premium signals. Think bioluminescence: rare, striking, meaningful.

### Dark Mode Personality Shift

Dark mode is not simply "inverted light mode" — it's the **deep-ocean version.** Calmer, more contemplative, with gold accents that feel premium. Same person, different depth. Light mode is the sunlit surface — warm, energetic, pink-and-orange psychedelic energy. Dark mode is the midnight zone — cool, mysterious, teal-and-gold bioluminescence.

### Dual Color Modes by Intent

Colors operate differently depending on the emotional context:

- **Celebration contexts** (results reveal, milestones, share cards): Complementary vibrating pairs — Electric Pink on Teal, Orange on Navy. Visually intense, memorable, screenshot-worthy. These moments are *meant* to feel extraordinary.
- **Reading contexts** (chat interface, facet details, evidence panels): Analogous harmonious pairs — text on muted backgrounds, comfortable contrast, extended-reading optimized for 30+ minute sessions.

### Archetype Trait Colors

Each archetype maps to a dominant Big Five trait. That trait determines the archetype's visual color identity:

| Trait | Shape | Primary | Accent | Gradient |
|-------|-------|---------|--------|----------|
| **O — Openness** | Circle | `#A855F7` Purple | `#FFB830` Gold | Purple → Gold |
| **C — Conscientiousness** | Half Circle | `#FF6B2B` Orange | `#00B4A6` Teal | Orange → Teal |
| **E — Extraversion** | Tall Slim Rectangle (portrait) | `#FF0080` Electric Pink | `#FF6B2B` Orange | Pink → Orange |
| **A — Agreeableness** | Triangle | `#00B4A6` Teal | `#E08840` Warm Orange | Teal → Orange |
| **N — Neuroticism** | Diamond | `#1c1c9c` Navy | `#00D4C8` Teal | Navy → Teal |

### Color Saturation as Data Encoding

Color intensity communicates score magnitude throughout the interface:
- **Low scores:** Desaturated, muted versions of the trait color — the data *feels* quieter
- **High scores:** Fully saturated, almost glowing — the data *feels* intense
- **Confidence level:** Opacity encodes confidence — solid = high confidence, faded = low confidence

This ensures every use of color carries meaning, not just decoration.

### Accessibility Compliance

- All text/background combinations meet **WCAG AA** minimum (4.5:1 for body text, 3:1 for large text)
- Vibrating complementary pairs are reserved for non-text celebration surfaces — never used for body text
- Dark mode foreground on navy backgrounds exceeds 7:1 contrast
- Interactive elements have distinct focus states (not color-only)
- Color is never the sole indicator of state — always paired with shape, icon, or text

---

## OCEAN Geometric Identity System

**Design Philosophy:** The Big Five framework is encoded directly into the brand's visual DNA through 5 geometric shapes — one per OCEAN trait. These shapes ARE the brand mark, the data visualization, and the user's personal identity simultaneously.

### Shape Definitions

| Letter | Trait | Shape | Rationale |
|--------|-------|-------|-----------|
| **O** | Openness | Circle | Wholeness, expansiveness, boundaryless thinking |
| **C** | Conscientiousness | Half Circle (left half) | Structure imposed on wholeness, precision, organized duality |
| **E** | Extraversion | Tall Slim Rectangle (portrait) | Solid presence, upward-facing energy, vertical social platform |
| **A** | Agreeableness | Triangle | Harmony, balance, directional empathy |
| **N** | Neuroticism | Diamond | Pressure-formed, multifaceted, sharp sensitivity |

Each shape renders in its trait color from the Archetype Trait Colors palette.

### Brand Mark Usage

**Logo:** "big-" in Space Grotesk bold, followed by the 5 geometric shapes inline replacing "ocean." Each shape in its trait color. This IS the primary brand mark.

**Variations:**
- **Full color:** All 5 shapes in trait colors — primary usage
- **Monochrome:** All 5 shapes in foreground color — for constrained contexts
- **Single-color accent:** All 5 shapes in primary brand color — simplified contexts
- **Icon mark:** 5 shapes stacked/arranged compactly without "big-" — favicon, app icon, watermark

### Geometric Personality Signature

Each user's OCEAN code (e.g., "HHMHM") renders as their unique **Geometric Personality Signature:**

- **Shape = Trait** (always the same 5 shapes in OCEAN order)
- **Size = Level** — Large (H), Medium (M), Small (L)
- **Fill = Trait color** at full saturation
- **Arrangement:** Inline horizontal sequence, evenly spaced

Example: A user with code "HHMHM" sees:
```
[Large Circle] [Large Half-Circle] [Medium Tall Rectangle] [Large Triangle] [Medium Diamond]
  purple           orange                    pink                  teal           navy
```

This signature is:
- Displayed prominently on the results page
- Featured on share cards
- Used as profile avatar/badge
- Animated during the archetype reveal sequence

### Results Reveal Animation

The 5 shapes animate in sequence during the archetype reveal:

1. Shapes appear one by one (O → C → E → A → N), ~200ms stagger
2. Each shape starts small and scales to its final size (encoding the trait level)
3. Color fills in as the shape reaches full size
4. Final state holds: the user's complete Geometric Personality Signature
5. Archetype name fades in below the signature
6. Users with `prefers-reduced-motion` see instant final state (no animation)

### Decorative & Structural Use

- **Section dividers:** Repeating OCEAN shapes in a horizontal pattern at low opacity
- **Loading states:** Shapes assemble/pulse in sequence
- **Background patterns:** Scattered shapes at very low opacity as page texture
- **Navigation markers:** Active page indicated by its corresponding trait shape
- **Data visualization:** Shapes used as chart markers, legend icons, category indicators throughout the interface

---

## Hero & Key Surfaces: Color Block Composition

**Design Philosophy:** Hero sections and key celebration surfaces use bold geometric color blocks — distinct, hard-edged shapes of pink, teal, and orange — rather than blended gradients. This creates a graphic poster-like quality: striking, intentional, psychedelic through juxtaposition rather than blending.

### Composition Principles

- **Hard edges, not blends:** Color blocks meet with sharp boundaries. The contrast between adjacent saturated colors creates visual energy.
- **Asymmetric layout:** Color blocks are arranged in uneven proportions — dominant color takes 50-60%, secondary 25-30%, accent 10-15%. No even splits.
- **Geometric shapes as blocks:** The OCEAN shapes (circle, half-circle, tall rectangle, triangle, diamond) double as the color block forms. A large pink circle, an overlapping teal triangle, an orange rectangle anchoring the bottom — the brand shapes ARE the layout.
- **Content overlays blocks:** Typography and UI elements sit on top of/across color blocks. Text color adapts to underlying block (light text on dark blocks, dark text on light blocks).

### Light Mode Hero

- **Dominant block:** Electric Pink (`#FF0080`) — large circle or organic shape, 50-60% of hero area
- **Secondary block:** Saturated Teal (`#00B4A6`) — triangle or angular shape, overlapping, 25-30%
- **Accent block:** Vivid Orange (`#FF6B2B`) — small rectangle or strip, 10-15%
- **Background:** Warm Cream (`#FFF8F0`) visible in negative space between blocks

### Dark Mode Hero

- **Dominant block:** Deep Teal (`#00D4C8`) — large shape, 50-60%
- **Secondary block:** Abyss Navy (`#141838`) — overlapping shape, 25-30%
- **Accent block:** Rich Gold (`#FFB830`) — small punctuation shape (achievement signal), 10-15%
- **Background:** Abyss Navy (`#0A0E27`)

### Application Contexts

| Surface | Composition | Notes |
|---------|------------|-------|
| **Landing hero** | Full color block composition with "big-[shapes]" logo centered | First impression, maximum boldness |
| **Results reveal** | OCEAN shapes expand to become the color blocks themselves as signature animates | Personality shapes ARE the layout |
| **Share card** | Compact color block composition with signature + archetype name | Optimized for social screenshots |
| **Milestone toast** | Single color block flash with trait shape + message | Brief celebratory moment in chat |
| **404 / Empty states** | Playful color block arrangement with ocean character | Brand consistency even in error states |

---

## Typography System

**Design Philosophy:** Geometric, modern, confident — typography that feels sharp and intentional while remaining highly readable for long conversational sessions.

### Font Selection

| Role | Font Family | Weight Range | Rationale |
|------|-------------|-------------|-----------|
| **Headings / Display** | **Space Grotesk** | 500–700 | Geometric, modern, distinctive character. Bold without being aggressive. Personality through letterforms. |
| **Body** | **DM Sans** | 400–600 | Clean geometric sans-serif, excellent readability at all sizes. Pairs naturally with Space Grotesk. |
| **Monospace** | **JetBrains Mono** | 400 | Data display, precision scores, OCEAN codes. Technical credibility. |

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display-hero` | 56-64px / 3.5-4rem | 700 | 1.05 | Archetype name reveal — THE hero moment |
| `display-xl` | 48px / 3rem | 700 | 1.1 | Hero headlines, celebration headers |
| `display` | 36px / 2.25rem | 700 | 1.15 | Page titles |
| `h1` | 30px / 1.875rem | 600 | 1.2 | Section headings |
| `h2` | 24px / 1.5rem | 600 | 1.25 | Subsection headings |
| `h3` | 20px / 1.25rem | 600 | 1.3 | Card titles, trait names |
| `h4` | 18px / 1.125rem | 500 | 1.35 | Labels, facet names |
| `body` | 16px / 1rem | 400 | 1.6 | Body text, chat messages |
| `body-sm` | 14px / 0.875rem | 400 | 1.5 | Secondary text, captions |
| `caption` | 12px / 0.75rem | 400 | 1.4 | Fine print, metadata |
| `data` | 16px / 1rem (mono) | 400 | 1.4 | Precision %, scores, OCEAN codes |

### Typography Principles

1. **Headings carry personality** — Space Grotesk's geometric character gives big-ocean its typographic identity
2. **Body prioritizes readability** — DM Sans is optimized for long reading sessions (30-min chat)
3. **Data is distinct** — Monospace for all numerical/data display creates visual separation from prose
4. **Scale is generous** — `display-hero` at 56-64px makes the archetype name impossible to ignore. The user earned that moment.
5. **Weight hierarchy is clear** — 700 for display, 600 for headings, 400 for body. No ambiguity.

---

## Data Visualization Style

**Design Philosophy:** Organic data forms — trait and facet scores use fluid, wave-inspired shapes rather than rigid rectangular bars. The psychedelic visual language extends into how data is rendered, making personality data feel alive and personal rather than clinical.

### Organic Score Visualizations

- **Trait bars as wave-forms:** High openness undulates like an ocean current; low conscientiousness is a gentle ripple. Score shapes are fluid, not rigid rectangles.
- **Color saturation encodes magnitude:** Low scores are muted, high scores glow at full saturation. The data itself has emotional weight.
- **Facet constellation maps:** Instead of 30 facet bars in a vertical list, facets arrange in a radial "coral reef" pattern. Each facet is a coral branch — length encodes score, color encodes confidence. The whole structure looks organic and alive while remaining precisely readable.
- **OCEAN shapes as chart markers:** The 5 geometric shapes serve as category indicators, legend icons, and axis markers throughout all data visualizations.

### Character-as-Data Pattern

Archetype characters serve as visual anchors for personality data:

- **Phase 1 (MVP):** Character uses the archetype trait color as its accent color. Surrounding scene reflects precision level conceptually (simpler scene = lower precision, richer scene = higher precision).
- **Phase 2:** Character proportions subtly encode Big Five trait scores. Surrounding elements (bubbles, coral) encode facet scores and confidence. Full dynamic SVG composition per user.

---

## Illustration & Imagery System

**Design Philosophy:** Hand-drawn cartoon ocean world — friendly, bold, distinctive. The ocean theme reinforces the "big-ocean" brand while cartoon illustration style creates warmth and approachability that counterbalances scientific rigor.

### MVP Illustration Scope (Phase 1)

To ship a cohesive visual identity without requiring a full illustration pipeline:

**Phase 1 — Ship These:**
- **1 character:** The Diver (Nerin's avatar, onboarding companion, brand mascot)
- **3-4 static SVG decorative elements:** Waves, bubbles, coral cluster, seaweed strand
- **Ocean icon set:** Shell (home), compass (explore), anchor (profile), bubble (send), wave (share), pearl (save), rising bubbles (loading), lighthouse (complete)
- **OCEAN geometric shapes:** 5 SVG shapes (circle, half-circle, tall rectangle, triangle, diamond) in all trait colors

**Phase 2 — Expand To:**
- Full character library (sea turtle, dolphin, whale, seahorse)
- Lottie animations for key moments (reveal, milestones, celebration)
- Dynamic character-as-data compositions
- Underwater landscape backgrounds per precision level
- Extended decorative element library

### Character Library (Full Vision)

| Character | Phase | Usage | Personality Signal |
|-----------|-------|-------|--------------------|
| **Diver** | Phase 1 | Nerin's avatar, onboarding companion, brand mascot | Curiosity, courage, the self-discovery journey itself |
| **Sea Turtle** | Phase 2 | Conscientiousness archetype family | Groundedness, steady progress |
| **Dolphin** | Phase 2 | Extraversion archetype family | Social energy, playfulness, joy |
| **Whale** | Phase 2 | Openness archetype family | Depth, introspection, vast inner world |
| **Seahorse** | Phase 2 | Individuality archetype family | Uniqueness, nuance, hidden complexity |

### Illustration Style Guide

- **Line weight:** Bold, confident outlines (2-3px)
- **Fill style:** Flat saturated colors with minimal shading (matches psychedelic palette)
- **Expression:** Characters are expressive and emotive (wide eyes, clear gestures)
- **Consistency:** All illustrations share same line weight, color saturation, and proportions
- **Format:** SVG for scalability, with optional Lottie animations (Phase 2)

### Chat Interface Atmosphere

> **See [Geometric Ocean — Ambient Sea Life System](./geometric-ocean-ambient-system.md)** for the complete specification of the chat assessment's visual atmosphere.

The chat screen — where users spend 30 minutes — is immersed in a **living geometric ocean**. Sea creatures built from simple primitives (rectangles, diamonds, circles, triangles) drift, swim, and sway around and behind the conversation. This creates a calm yet alive atmosphere without competing with message content.

- **Background:** Warm Cream / Abyss Navy with geometric sea creatures at very low opacity
- **Nerin avatar:** Small diver character, consistent across all messages
- **Message bubbles:** Clean, rounded, generous padding. User = surface color, Nerin = slightly elevated surface-alt
- **Ocean creatures:** Seaweed, fish, jellyfish, and bubbles — all geometric, all decorative, all `aria-hidden`
- **No data visualization during assessment:** Creatures are completely decoupled from personality data to avoid influencing user responses
- **Psychedelic energy appears ONLY in:** Precision milestone toasts and the transition to results reveal

The conversation content IS the experience. The ocean makes the space feel alive while the content breathes.

---

## Credibility Gradient Pattern

**Design Philosophy:** Pages transition from psychedelic/emotional at the top to structured/scientific at depth. This mirrors the user's emotional journey: excitement → curiosity → trust.

### Spatial Transition Rules

| Page Zone | Visual Register | Decoration Density | Data Density |
|-----------|----------------|-------------------|-------------|
| **Hero / Top** | Maximum psychedelic — color block composition, bold OCEAN shapes, display-hero typography | High | Low |
| **Middle / Overview** | Balanced — structured layout with colorful accents, trait summaries, geometric signature | Medium | Medium |
| **Deep / Detail** | Scientific — clean grids, readable body type, systematic color encoding, evidence panels | Low | High |
| **Evidence / Bottom** | Precision — monospace scores, quote highlights, minimal decoration, high data-ink ratio | Minimal | Maximum |

### Dual Visual Register

- **Public/shareable surfaces:** Maximum psychedelic energy — color block composition, bold OCEAN shapes, display typography, intense color. Optimized for social sharing, screenshots, first impressions.
- **Private/detailed surfaces:** Structured scientific presentation — clean grids, readable type, systematic color encoding, evidence transparency. Optimized for self-reflection and trust.
- **Section transitions:** Wave dividers, OCEAN shape patterns at low opacity, and subtle underwater color shifts replace generic horizontal rules. Structure is present but never sterile.

---

## Spacing & Layout Foundation

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing, icon padding |
| `space-2` | 8px | Inline element gaps, small padding |
| `space-3` | 12px | Compact component padding |
| `space-4` | 16px | Standard component padding, form gaps |
| `space-6` | 24px | Section gaps, card padding |
| `space-8` | 32px | Section spacing |
| `space-12` | 48px | Major section breaks |
| `space-16` | 64px | Page-level section spacing |
| `space-24` | 96px | Hero sections, top-level spacing |

### Layout Principles

1. **Generous breathing room** — Content never feels cramped. Cards have 24px+ padding, sections have 48px+ spacing
2. **Rounded everything** — Border radius 12px for small elements, 16-24px for cards, 32px for hero containers. Reinforces friendly, approachable feel
3. **Mobile-first chat** — Chat interface optimized for one-handed thumb use. Send button, input field, and key actions within thumb reach zone
4. **Content max-width 1200px** — Readable line lengths, centered content with generous side margins on desktop
5. **12-column responsive grid** — Standard Tailwind breakpoints (sm/md/lg/xl/2xl)

### Layout Structure

| Breakpoint | Behavior |
|------------|----------|
| **Mobile** (<640px) | Single column, full-width cards, bottom-anchored chat input |
| **Tablet** (640-1024px) | Two-column where appropriate, side panels slide in |
| **Desktop** (>1024px) | Multi-column layouts, persistent sidebars, max-width container |

### Component Radius Scale

| Element | Radius |
|---------|--------|
| Buttons | 12px |
| Input fields | 12px |
| Cards | 16px |
| Modals/Dialogs | 24px |
| Hero containers | 32px |
| Avatar/icons | Full round |
| Chat bubbles | 16px (with 4px on sender corner) |

---

## Accessibility Considerations

- **Color contrast:** All text meets WCAG AA (4.5:1 body, 3:1 large). Vibrating complementary pairs reserved for non-text celebration surfaces only. Color blocks ensure sufficient contrast for overlaid text.
- **Motion sensitivity:** All animations respect `prefers-reduced-motion`. OCEAN shape reveal degrades to instant display. Celebration animations become simple fades.
- **Focus visibility:** High-contrast focus rings (2px solid, offset) on all interactive elements. Never hidden.
- **Touch targets:** Minimum 44x44px for all interactive elements (mobile chat, buttons, links)
- **Font scaling:** All typography uses rem units, respects user browser font-size settings
- **Screen readers:** Decorative illustrations, OCEAN shapes in decorative contexts, and color blocks marked `aria-hidden`. Geometric Personality Signature has text alternative (e.g., "Openness: High, Conscientiousness: High, Extraversion: Medium, Agreeableness: High, Neuroticism: Medium"). All meaningful content accessible.
- **Color independence:** Status is never communicated by color alone — always paired with shape, icon, text, or size. OCEAN shapes use both color AND distinct geometry to differentiate traits.

---
