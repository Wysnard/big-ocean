# Story 7.5: Redesign Home Page — Deep Dive Theme

Status: review

<!-- Re-execution: Diving metaphor overhaul. All existing components will be updated in-place. -->

## Story

As a **Visitor**,
I want **the home page to immerse me in a "deep dive" metaphor — where exploring my personality is framed as descending into the ocean's depths with Nerin as my dive companion**,
so that **I immediately feel the product is about profound self-discovery (not a surface-level quiz), the brand identity is viscerally memorable, and I'm compelled to "take the plunge"**.

## Design Philosophy: Diving as Metaphor

The diving metaphor transforms the user's relationship with personality assessment:

- **Surface** = what we show the world (persona). The home page starts here.
- **Descent** = the assessment conversation. Each exchange goes deeper.
- **The Deep** = your results. Beautiful, luminous, uniquely yours (bioluminescence).
- **Resurface** = sharing. You bring treasures back from the dive.

The home page is the **surface** — you see the vast, shimmering ocean. Intriguing but unknown. Every visual and copy element invites you to go deeper.

**Key principle:** The metaphor is *suggested*, not literal. No aquarium graphics or cartoon fish. Depth is communicated through **color gradients, copy, subtle animations, and atmospheric CSS effects** (caustics, bubbles, wave dividers).

## Acceptance Criteria

1. **Given** I visit the home page in light mode **When** the page loads **Then** all sections use semantic color tokens from the sunset palette **And** no hard-coded color classes exist (`bg-slate-*`, `bg-blue-*`, `text-white`, etc.) **And** the ocean/diving brand identity is visually distinctive
2. **Given** I visit the home page in dark mode **When** the page loads **Then** all sections use the moonlit ocean palette **And** gradients adapt automatically via CSS custom properties **And** the dark mode naturally evokes "being underwater" with deeper blues
3. **Given** I view the hero section **When** the page loads **Then** I see an animated wave logo with gentle CSS motion **And** "Big Ocean" with ocean gradient text **And** the subtitle **"Explore the Depths of Who You Are"** **And** a primary CTA **"Begin Your Dive"** **And** trust signals: "A 15-minute deep dive · No account needed" **And** a scroll indicator with **"Go deeper"** text and bounce animation **And** subtle CSS caustic light patterns animate in the background **And** small CSS bubble particles drift upward slowly
4. **Given** I scroll down the page **When** sections transition **Then** organic SVG wave dividers separate sections (not hard edges) **And** the page background subtly deepens in color as I scroll further down (depth gradient effect)
5. **Given** I scroll to the value props section **When** the cards appear **Then** I see 3 bento cards: **"Deep Conversation, Not Surface Questions"**, **"30 Facets Deep"**, and **"An AI That Dives With You"** **And** each card has an icon and description **And** cards fade-in-up on scroll via intersection observer
6. **Given** I scroll to the "Meet Nerin" section **When** the chat preview appears **Then** the section title is **"Meet Your Dive Companion"** **And** Nerin's subtitle is **"AI Deep Dive Companion"** **And** sample messages use diving language (e.g., "Welcome to your deep dive...") **And** the tagline is **"This isn't a quiz. It's an expedition."** **And** a CTA links to start the assessment **And** the chat container has a gentle floating idle animation
7. **Given** I view the traits section **When** I see the Big Five traits **Then** the section title is **"Five Dimensions of the Deep"** **And** each trait card uses its OKLCH color with `dark:` variant **And** hover reveals a **luminescent glow** (box-shadow with trait color) plus facet preview text **And** layout is asymmetric bento (Openness larger)
8. **Given** I view the archetype teaser **When** the section appears **Then** the title is **"What Will You Find in the Deep?"** **And** body text: "Every personality holds hidden treasures. Yours has a name." **And** CTA: **"Discover What's Below"** **And** blurred archetype card with sample name
9. **Given** I view the "What You'll Bring Back" section **When** the cards appear **Then** I see 4 items framed as treasures: OCEAN Code, Evidence-Based Scores, Your Archetype, Shareable Profile
10. **Given** I reach the final CTA **When** I'm ready to start **Then** I see **"Ready to Take the Plunge?"** with ocean gradient background **And** trust signals: "A 30-minute deep dive · Free · No account needed" **And** CTA **"Begin Your Dive"** navigating to `/chat`
11. **Given** I'm on mobile (< 768px) **When** I view the page **Then** all grids collapse to single column **And** wave dividers scale responsively **And** CTAs are full-width with min 44px height **And** no horizontal scrolling
12. **Given** animations are present **When** the page loads or scrolls **Then** all animations respect `prefers-reduced-motion: reduce` via `motion-safe:` prefix **And** wave logo bobs gently (4s) **And** bubbles drift (8-12s) **And** caustics shift (6s) **And** sections fade in on scroll

## Tasks / Subtasks

### Task 1: Add depth-zone CSS variables and new keyframes to globals.css (AC: #3, #4, #12)

- [x] Add depth-zone custom properties to `:root` and `.dark` in `packages/ui/src/styles/globals.css`:
  ```css
  /* Depth zones for scroll-based background transitions */
  --depth-surface: var(--background);
  --depth-shallows: oklch(0.95 0.015 210);
  --depth-mid: oklch(0.90 0.03 220);
  --depth-deep: oklch(0.84 0.05 230);
  ```
  Dark mode equivalents:
  ```css
  --depth-surface: var(--background);
  --depth-shallows: oklch(0.16 0.03 245);
  --depth-mid: oklch(0.18 0.04 240);
  --depth-deep: oklch(0.20 0.05 235);
  ```
- [x] Add `@keyframes caustic` — slow-moving radial gradient overlay (6s ease-in-out infinite)
  ```css
  @keyframes caustic {
    0%, 100% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
  }
  ```
- [x] Add `@keyframes bubble` — upward drift for bubble particles (linear infinite)
  ```css
  @keyframes bubble {
    0% { transform: translateY(0) scale(1); opacity: 0.6; }
    50% { opacity: 0.3; }
    100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
  }
  ```
- [x] Add `@keyframes fadeInUp` — for scroll-triggered section entrances
  ```css
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  ```
- [x] Existing `@keyframes wave` stays as-is

### Task 2: Create WaveDivider component (AC: #4)

- [x] Create `apps/front/src/components/home/WaveDivider.tsx`
- [x] Inline SVG with `preserveAspectRatio="none"` for responsive stretching
- [x] Accept props: `className`, `flip` (boolean — flips vertically for top-of-section use), `variant` (`"gentle"` | `"deep"` — controls wave amplitude)
- [x] SVG path draws an organic wave curve, `fill` uses `currentColor` so parent can set color via `text-{token}`
- [x] `width="100%" height="auto"` with `viewBox` for consistent scaling
- [x] Add `data-slot="wave-divider"`
- [x] `aria-hidden="true"` since decorative

### Task 3: Update HeroSection with diving copy and atmospheric effects (AC: #3, #12)

- [x] Update copy:
  - Subtitle: **"Explore the Depths of Who You Are"**
  - Sub-subtitle: "A deep dive into who you really are — guided by AI, grounded in science"
  - CTA text: **"Begin Your Dive"**
  - Trust signals: "A 15-minute deep dive · No account needed"
- [x] Add CSS caustic light overlay: a `div` with `absolute inset-0 pointer-events-none` using `background: radial-gradient(...)` animated with `motion-safe:animate-[caustic_6s_ease-in-out_infinite]`. Low opacity (~0.08) so it's atmospheric, not distracting.
- [x] Add 5-8 bubble particles: small `div` elements (4-8px, `rounded-full`, `bg-primary/20`) with randomized `animation-delay` and `animation-duration` (8s-12s) using `motion-safe:animate-[bubble_Xs_linear_infinite]`. Position them `absolute` within the hero with random horizontal placement.
- [x] Update ScrollIndicator to show **"Go deeper"** text above the bouncing arrow
- [x] Keep: animated wave logo, "Big Ocean" gradient text, `data-slot="hero-section"`

### Task 4: Update ValuePropsSection with diving copy and fade-in animation (AC: #5)

- [x] Update card titles and descriptions:
  1. **"Deep Conversation, Not Surface Questions"** (MessageCircle) — "Nerin dives into what makes you tick through natural dialogue — no multiple choice, no forced answers."
  2. **"30 Facets Deep"** (Layers) — "While others skim the surface with 5 traits, we explore 30 facets of who you are."
  3. **"An AI That Dives With You"** (Sparkles) — "Nerin adapts to your responses in real-time, exploring deeper where it matters most."
- [x] Add scroll-triggered fade-in: use `IntersectionObserver` in a `useFadeInOnScroll` hook (or inline `useEffect`) to add a class when visible. CSS: `opacity-0 translate-y-6 transition-all duration-700` → `opacity-100 translate-y-0` when intersecting.
- [x] Keep: `data-slot="value-props-section"`, bento grid layout, icon circles

### Task 5: Update ChatPreviewSection with dive companion messaging (AC: #6)

- [x] Update section title: **"Meet Your Dive Companion"**
- [x] Update Nerin subtitle: **"AI Deep Dive Companion"** (was "AI Personality Guide")
- [x] Update tagline: **"This isn't a quiz. It's an expedition."**
- [x] Update sample conversation messages:
  ```
  Nerin: "Welcome to your deep dive. I'm Nerin, and I'll be exploring alongside you. There's no right or wrong here — just depth. Ready to see what we discover?"
  Nerin: "Let's start at the surface. When you walk into a room full of strangers, what's the first thing you notice?"
  User: "I usually look for someone I know, or find a quiet corner to observe from..."
  Nerin: "Interesting — you're taking it all in before diving in. That tells me something. What happens once you've observed for a while?"
  ```
- [x] Add gentle floating animation to the chat container: `motion-safe:animate-[float_6s_ease-in-out_infinite]` where `@keyframes float` is a subtle `translateY(±4px)`. (Can reuse the existing `wave` keyframe or define `float` as alias)
- [x] Keep: ChatBubble AI/user variants, disabled input, CTA, `data-slot="chat-preview-section"`

### Task 6: Update TraitsSection with diving copy and luminescent hover glow (AC: #7)

- [x] Update section title: **"Five Dimensions of the Deep"**
- [x] Update section subtitle: "Each trait is a layer of your personality waiting to be explored"
- [x] Add luminescent hover glow to TraitCard: on hover, apply `box-shadow` using the trait's OKLCH color at low opacity (e.g., `shadow-[0_0_20px_oklch(0.55_0.15_280_/_0.3)]`). Transition with `transition-shadow duration-300`.
- [x] Keep: asymmetric bento layout, OKLCH colors, gradient overlay on hover, facet preview, `data-slot` attributes

### Task 7: Update ArchetypeTeaserSection with diving copy (AC: #8)

- [x] Update title: **"What Will You Find in the Deep?"**
- [x] Update subtitle: "Every personality holds hidden treasures. Yours has a name."
- [x] Update CTA: **"Discover What's Below"**
- [x] Keep: blurred card pattern, gradient circle, "Thoughtful Explorer" sample, `data-slot`

### Task 8: Update DiscoverSection with diving framing (AC: #9)

- [x] Update section title: **"What You'll Bring Back"**
- [x] Reframe card descriptions to use treasure/discovery language:
  1. OCEAN Code (Fingerprint): "Your unique 5-letter code — a compass for understanding yourself at a glance"
  2. Evidence-Based Scores (TrendingUp): "See exactly what shaped your profile — every score traced back to your own words"
  3. Your Archetype (Lightbulb): "A memorable name for your unique personality pattern, discovered in the deep"
  4. Shareable Profile (Share2): "Bring your discoveries to the surface — share with friends, teams, or employers"
- [x] Keep: 2-column grid, icons, `data-slot="discover-section"`

### Task 9: Update FinalCTASection with diving copy (AC: #10)

- [x] Update headline: **"Ready to Take the Plunge?"**
- [x] Update trust signals: "A 30-minute deep dive · Free · No account needed"
- [x] Update CTA text: **"Begin Your Dive"**
- [x] Keep: ocean gradient background, navigation to `/chat`, `data-slot`

### Task 10: Add WaveDividers between sections and depth scroll wrapper (AC: #4)

- [x] Insert `<WaveDivider>` components between major sections in `index.tsx`:
  - Between Hero → Value Props (gentle variant, `text-background` or depth zone color)
  - Between Value Props → Chat Preview
  - Between Chat Preview → Traits
  - Between Traits → Archetype Teaser
  - Between Archetype Teaser → Discover
  - Between Discover → Final CTA
- [x] Wave divider fill color should match the *next* section's background for seamless transition
- [x] Add depth scroll wrapper in `index.tsx`: a parent `<div>` with `data-depth-zone` sections. Use `IntersectionObserver` to update a CSS custom property (`--current-depth`) on the root wrapper as sections enter viewport. The wrapper's `background-color` transitions between depth zone values using `transition-colors duration-1000`.
  - Zones: hero = `--depth-surface`, value-props/chat = `--depth-shallows`, traits/archetype = `--depth-mid`, discover/final-cta = `--depth-deep`

### Task 11: Mobile responsiveness verification (AC: #11)

- [x] Test at 375px: all sections stack, wave dividers scale, hero text readable, no overflow
- [x] Test at 768px: grids transition to 2-column layout
- [x] Test at 1024px+: full desktop layout with bento asymmetric grids
- [x] All buttons have `min-h-11` (44px) for touch targets
- [x] Verify no horizontal scroll at any breakpoint
- [x] Bubble particles don't cause overflow (use `overflow-hidden` on hero)

### Task 12: Build, lint, and visual verification (AC: #1, #2)

- [x] `pnpm build --filter=front` — 0 errors
- [x] `pnpm lint` — no new warnings
- [x] `pnpm test:run` — no regressions
- [x] View in light mode: depth gradient visible as page scrolls, warm palette
- [x] View in dark mode: naturally feels "underwater", moonlit ocean palette
- [x] Toggle theme: smooth transition, no flash
- [x] Grep for hard-coded colors: zero matches for `-slate-`, `-blue-`, `-purple-`, `-gray-`, `text-white`
- [x] Verify `prefers-reduced-motion`: all animations stop (caustics, bubbles, wave logo, float, fade-in)
- [x] Verify wave dividers render correctly at all breakpoints

## Dev Notes

### What This Re-execution Changes

The previous 7.5 implementation created a solid, theme-aware home page with 10 extracted components. This re-execution **preserves the architecture** and updates:

| Aspect | Previous | This Re-execution |
|--------|----------|-------------------|
| Copy voice | Generic/neutral | **Diving metaphor throughout** |
| Section dividers | Hard `py-*` spacing | **SVG wave dividers** |
| Background | Static `bg-background` | **Depth-gradient scroll effect** |
| Hero atmosphere | Radial gradient only | **+ CSS caustics + bubble particles** |
| Chat preview Nerin | "AI Personality Guide" | **"AI Deep Dive Companion"** |
| Chat messages | Generic intro | **Diving-language conversation** |
| Trait cards hover | Border + gradient overlay | **+ Luminescent glow** |
| Scroll behavior | Instant appearance | **Fade-in-up on scroll** |
| Chat container | Static | **Gentle floating animation** |
| New component | — | **WaveDivider.tsx** |

### Current File State

All 10 home components exist under `apps/front/src/components/home/`. They will be **modified in-place** (not recreated). The orchestrator `index.tsx` is 26 lines — it will grow slightly to include WaveDividers and the depth scroll wrapper.

### Component Architecture

```
apps/front/src/
├── routes/index.tsx                    # Orchestrator — depth wrapper + sections + wave dividers
├── components/
│   └── home/
│       ├── HeroSection.tsx             # UPDATE: diving copy, caustics, bubbles
│       ├── ValuePropsSection.tsx       # UPDATE: diving copy, fade-in animation
│       ├── ChatPreviewSection.tsx      # UPDATE: dive companion copy, float animation
│       ├── ChatBubble.tsx              # Minor: updated message content
│       ├── TraitsSection.tsx           # UPDATE: diving title, subtitle
│       ├── TraitCard.tsx               # UPDATE: luminescent glow hover
│       ├── ArchetypeTeaserSection.tsx  # UPDATE: diving copy
│       ├── DiscoverSection.tsx         # UPDATE: diving copy (treasures framing)
│       ├── FinalCTASection.tsx         # UPDATE: diving copy
│       ├── ScrollIndicator.tsx         # UPDATE: "Go deeper" text
│       └── WaveDivider.tsx             # NEW: SVG wave section divider
```

### Copy & Messaging Reference (Complete)

| Section | Headline | Subtext / CTA |
|---------|----------|---------------|
| Hero | "Big Ocean" | "Explore the Depths of Who You Are" |
| Hero sub | — | "A deep dive into who you really are — guided by AI, grounded in science" |
| Hero CTA | — | **"Begin Your Dive"** |
| Hero trust | — | "A 15-minute deep dive · No account needed" |
| Scroll | **"Go deeper"** | ↓ bouncing arrow |
| Value Prop 1 | "Deep Conversation, Not Surface Questions" | Nerin dives into what makes you tick... |
| Value Prop 2 | "30 Facets Deep" | While others skim the surface... |
| Value Prop 3 | "An AI That Dives With You" | Nerin adapts to your responses... |
| Chat title | "Meet Your Dive Companion" | — |
| Chat Nerin subtitle | "AI Deep Dive Companion" | — |
| Chat tagline | "This isn't a quiz. It's an expedition." | — |
| Chat CTA | — | "Start your deep dive" |
| Traits title | "Five Dimensions of the Deep" | "Each trait is a layer waiting to be explored" |
| Archetype title | "What Will You Find in the Deep?" | "Every personality holds hidden treasures. Yours has a name." |
| Archetype CTA | — | **"Discover What's Below"** |
| Discover title | "What You'll Bring Back" | — |
| Final CTA | **"Ready to Take the Plunge?"** | "A 30-minute deep dive · Free · No account needed" |
| Final CTA button | — | **"Begin Your Dive"** |

### Chat Preview Messages (Dive Companion Voice)

```
Nerin (AI): "Welcome to your deep dive. I'm Nerin, and I'll be exploring alongside you. There's no right or wrong here — just depth. Ready to see what we discover?"
Nerin (AI): "Let's start at the surface. When you walk into a room full of strangers, what's the first thing you notice?"
User: "I usually look for someone I know, or find a quiet corner to observe from..."
Nerin (AI): "Interesting — you're taking it all in before diving in. That tells me something. What happens once you've observed for a while?"
```

### WaveDivider Component Spec

```tsx
interface WaveDividerProps {
  className?: string;
  flip?: boolean;        // Flip vertically (for top-of-section placement)
  variant?: "gentle" | "deep";  // Wave amplitude
}

// Gentle variant: subtle curve (20-30px amplitude)
// Deep variant: more pronounced wave (40-50px amplitude)
// SVG uses currentColor for fill — parent controls color via text-* class
// Example: <WaveDivider className="text-card" variant="gentle" />
```

SVG path example (gentle):
```html
<svg viewBox="0 0 1440 80" preserveAspectRatio="none" class="w-full h-auto block">
  <path fill="currentColor" d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z" />
</svg>
```

### Depth Scroll Implementation

Use `IntersectionObserver` to detect which depth zone is currently in view:

```tsx
// In index.tsx orchestrator
const depthZones = [
  { id: "surface", ref: heroRef },
  { id: "shallows", ref: valuePropsRef },
  { id: "mid", ref: traitsRef },
  { id: "deep", ref: discoverRef },
];

// On intersection, set CSS variable on wrapper:
// wrapper.style.setProperty('--current-bg', `var(--depth-${zone})`)
// wrapper has: style={{ backgroundColor: 'var(--current-bg)' }}
//   with: transition: background-color 1s ease
```

Alternatively, use `data-depth` attribute per section and a single observer:
```tsx
<div className="transition-colors duration-1000" style={{ backgroundColor: currentDepthColor }}>
  <div data-depth="surface"><HeroSection /></div>
  <WaveDivider className="text-[var(--depth-shallows)]" />
  <div data-depth="shallows"><ValuePropsSection /></div>
  ...
</div>
```

### Caustic Light Effect (CSS Only)

```css
/* Pseudo-element on hero */
.hero-caustics {
  background:
    radial-gradient(ellipse at 20% 50%, oklch(0.72 0.14 55 / 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, oklch(0.58 0.18 350 / 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, oklch(0.72 0.14 55 / 0.05) 0%, transparent 50%);
  background-size: 200% 200%;
  animation: caustic 6s ease-in-out infinite;
}
```

In dark mode, swap to blue/moonlight tones:
```css
.dark .hero-caustics {
  background:
    radial-gradient(ellipse at 20% 50%, oklch(0.62 0.14 240 / 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, oklch(0.82 0.10 85 / 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, oklch(0.62 0.14 240 / 0.06) 0%, transparent 50%);
}
```

### Bubble Particles Implementation

5-8 small absolute-positioned divs inside the hero:

```tsx
const BUBBLES = [
  { size: 4, left: "10%", delay: "0s", duration: "8s" },
  { size: 6, left: "25%", delay: "2s", duration: "10s" },
  { size: 3, left: "45%", delay: "1s", duration: "12s" },
  { size: 5, left: "65%", delay: "3s", duration: "9s" },
  { size: 4, left: "80%", delay: "0.5s", duration: "11s" },
  { size: 7, left: "92%", delay: "4s", duration: "8s" },
];

// Each bubble:
<div
  className="absolute bottom-0 rounded-full bg-primary/15 motion-safe:animate-[bubble_var(--dur)_linear_infinite]"
  style={{
    width: `${b.size}px`,
    height: `${b.size}px`,
    left: b.left,
    animationDelay: b.delay,
    animationDuration: b.duration,
  }}
/>
```

Parent hero needs `overflow-hidden` to prevent bubbles from causing scroll.

### Luminescent Glow on Trait Cards

```tsx
// TraitCard hover glow — add to existing hover styles
// Use inline style for the box-shadow since OKLCH values vary per trait
const TRAIT_GLOWS: Record<string, string> = {
  openness: "0 0 24px oklch(0.55 0.15 280 / 0.35)",
  conscientiousness: "0 0 24px oklch(0.55 0.15 240 / 0.35)",
  extraversion: "0 0 24px oklch(0.60 0.15 10 / 0.35)",
  agreeableness: "0 0 24px oklch(0.60 0.12 175 / 0.35)",
  neuroticism: "0 0 24px oklch(0.65 0.15 45 / 0.35)",
};

// Apply on hover via group-hover or onMouseEnter style
// Dark mode uses brighter glow (dark: variants have +0.1 lightness)
```

### Fade-In-On-Scroll Hook

Simple reusable hook for scroll-triggered entrance animations:

```tsx
function useFadeInOnScroll(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-6");
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

// Usage in a section:
const sectionRef = useRef<HTMLElement>(null);
useFadeInOnScroll(sectionRef);
return (
  <section ref={sectionRef} className="opacity-0 translate-y-6 transition-all duration-700">
    ...
  </section>
);
```

### Trait Color System (Unchanged from Previous)

From Story 7.1's OKLCH system. Use Tailwind arbitrary values with `dark:` variants:

| Trait | Light Mode Class | Dark Mode Class | Icon |
|-------|-----------------|-----------------|------|
| Openness | `text-[oklch(0.55_0.15_280)]` | `dark:text-[oklch(0.65_0.15_280)]` | `Lightbulb` |
| Conscientiousness | `text-[oklch(0.55_0.15_240)]` | `dark:text-[oklch(0.65_0.15_240)]` | `Zap` |
| Extraversion | `text-[oklch(0.60_0.15_10)]` | `dark:text-[oklch(0.70_0.15_10)]` | `Heart` |
| Agreeableness | `text-[oklch(0.60_0.12_175)]` | `dark:text-[oklch(0.70_0.12_175)]` | `Handshake` |
| Neuroticism | `text-[oklch(0.65_0.15_45)]` | `dark:text-[oklch(0.75_0.15_45)]` | `TrendingUp` |

### Trait Card Gradient Hover (Unchanged)

```tsx
const TRAIT_GRADIENTS: Record<string, string> = {
  openness: "linear-gradient(135deg, oklch(0.55 0.15 280 / 0.2) 0%, oklch(0.65 0.10 290 / 0.1) 100%)",
  conscientiousness: "linear-gradient(135deg, oklch(0.55 0.15 240 / 0.2) 0%, oklch(0.65 0.10 250 / 0.1) 100%)",
  extraversion: "linear-gradient(135deg, oklch(0.60 0.15 10 / 0.2) 0%, oklch(0.70 0.10 20 / 0.1) 100%)",
  agreeableness: "linear-gradient(135deg, oklch(0.60 0.12 175 / 0.2) 0%, oklch(0.70 0.08 185 / 0.1) 100%)",
  neuroticism: "linear-gradient(135deg, oklch(0.65 0.15 45 / 0.2) 0%, oklch(0.75 0.10 55 / 0.1) 100%)",
};
```

### Asymmetric Bento Grid Layout (Unchanged)

```
Desktop (md:grid-cols-4):
+-------------+--------------+--------------+
|  OPENNESS   | CONSCIEN.    | EXTRAVERSION |
|  (col-span-2|              |              |
|   row-span-2)|-------------|--------------|
|             | AGREEABLENESS| NEUROTICISM  |
+-------------+--------------+--------------+

Mobile (grid-cols-1 sm:grid-cols-2):
+--------------+
|   OPENNESS   | (col-span-full on mobile)
+------+-------+
|CONSC.|EXTRAV.|
+------+-------+
|AGREE.|NEURO. |
+------+-------+
```

### Semantic Token Quick Reference (Unchanged)

| Purpose | Token | Usage |
|---------|-------|-------|
| Page background | `bg-background` | Root `<div>` |
| Card surface | `bg-card` | Cards, chat container |
| Card border | `border-border` | Card borders |
| Primary text | `text-foreground` | Headings, body text |
| Secondary text | `text-muted-foreground` | Descriptions, captions |
| Brand color | `bg-primary` / `text-primary` | CTAs, icons, links |
| Brand text on primary | `text-primary-foreground` | Button text |
| Subtle background | `bg-muted` | Chat bubbles (AI) |
| Ocean gradient | `bg-[image:var(--gradient-ocean)]` | Hero text, CTA backgrounds |
| Radial gradient | `bg-[image:var(--gradient-ocean-radial)]` | Hero ambient glow |
| Subtle gradient | `bg-[image:var(--gradient-ocean-subtle)]` | Section backgrounds |

### Icons Used (lucide-react)

All icons already installed:

- **Hero:** `Waves` (animated logo), `ChevronDown` (scroll indicator)
- **Value Props:** `MessageCircle`, `Layers`, `Sparkles`
- **Chat Preview:** (text avatar "N")
- **Traits:** `Lightbulb` (O), `Zap` (C), `Heart` (E), `Handshake` (A), `TrendingUp` (N)
- **Discover:** `Fingerprint`, `TrendingUp`, `Lightbulb`, `Share2`

### Anti-Patterns

```
DO NOT install new npm packages — all dependencies already exist
DO NOT create complex animation libraries — CSS keyframes only
DO NOT fetch real data or API calls — home page is entirely static
DO NOT add fake social proof numbers — better to skip than fabricate
DO NOT use hard-coded colors — always use semantic tokens or OKLCH arbitrary values
DO NOT use next-themes or any theme-related logic — ThemeProvider already handles everything
DO NOT modify the Header component — it's correct from Story 7.6
DO NOT change the route structure — keep as routes/index.tsx
DO NOT use inline styles for colors — use Tailwind classes (arbitrary OKLCH via text-[oklch(...)])
DO NOT forget data-slot attributes on section components
DO NOT add social proof section yet — defer to a future story
DO NOT make the diving metaphor literal — no fish, no scuba gear, no aquarium graphics
DO NOT use heavy 3D graphics, WebGL, or canvas — CSS only for all effects
DO NOT let bubble particles cause horizontal overflow — hero needs overflow-hidden
```

### Testing Approach

Visual verification only (no unit tests for static page):

1. **Light mode:** Depth gradient visible, sunset palette, caustics warm-toned
2. **Dark mode:** Naturally feels "underwater", moonlit caustics, depth zones darker blues
3. **Theme toggle:** Smooth transition, no flash, caustics adapt
4. **Wave dividers:** Render between all sections, scale at all breakpoints, no gap/overlap
5. **Depth scroll:** Background color transitions smoothly as user scrolls
6. **Bubbles:** Drift upward in hero, don't cause overflow, stop on `prefers-reduced-motion`
7. **Fade-in:** Sections animate in on scroll, respect reduced motion
8. **Mobile (375px):** All sections stack, readable, tappable, no overflow
9. **Tablet (768px):** Grids show 2-3 columns
10. **Desktop (1024px+):** Full bento layout, atmospheric effects visible
11. **Reduced motion:** ALL animations stop — caustics, bubbles, wave, float, fade-in, bounce
12. **Build & lint:** `pnpm build --filter=front` + `pnpm lint` + `pnpm test:run`

### Files to Create

| File | Purpose |
|------|---------|
| `apps/front/src/components/home/WaveDivider.tsx` | SVG wave section divider (gentle/deep variants) |

### Files to Modify

| File | Changes |
|------|---------|
| `packages/ui/src/styles/globals.css` | Add depth-zone variables, caustic/bubble/fadeInUp keyframes |
| `apps/front/src/routes/index.tsx` | Add WaveDividers, depth scroll wrapper, section refs |
| `apps/front/src/components/home/HeroSection.tsx` | Diving copy, caustics overlay, bubble particles |
| `apps/front/src/components/home/ValuePropsSection.tsx` | Diving copy, fade-in animation |
| `apps/front/src/components/home/ChatPreviewSection.tsx` | Dive companion copy, float animation |
| `apps/front/src/components/home/ChatBubble.tsx` | Updated message text content |
| `apps/front/src/components/home/TraitsSection.tsx` | Diving section title/subtitle |
| `apps/front/src/components/home/TraitCard.tsx` | Luminescent glow hover |
| `apps/front/src/components/home/ArchetypeTeaserSection.tsx` | Diving copy |
| `apps/front/src/components/home/DiscoverSection.tsx` | Diving copy (treasures framing) |
| `apps/front/src/components/home/FinalCTASection.tsx` | Diving copy |
| `apps/front/src/components/home/ScrollIndicator.tsx` | "Go deeper" text |

### Files NOT to Modify

- `apps/front/src/components/Header.tsx` — correct from Story 7.6
- `packages/ui/src/hooks/use-theme.ts` — correct from Story 7.6
- `apps/front/src/components/ThemeProvider.tsx` — correct from Story 7.6
- `apps/front/src/routes/__root.tsx` — correct from Story 7.6

### Previous Story Intelligence

**From Story 7.1 (Ocean Brand Color Theme):**
- Dual OKLCH color system fully in place: sunset (light) / moonlit ocean (dark)
- Semantic tokens: `--primary`, `--accent`, `--foreground`, `--background`, `--card`, `--muted`, etc.
- Gradient CSS variables: `--gradient-ocean`, `--gradient-ocean-subtle`, `--gradient-ocean-radial`
- WCAG AA contrast verified for all token pairs
- OKLCH hue reference: Light primary hue ~350 (pink), accent ~55 (orange); Dark primary ~240 (blue), accent ~85 (moonlight)

**From Story 7.6 (Global Header):**
- Header mode-aware with logo, auth controls, theme toggle, mobile hamburger
- ThemeProvider uses `ScriptOnce` for flash prevention
- Sheet and DropdownMenu components installed

**From Story 7.2 (Dark Mode Toggle):**
- 3-state theme cycling: system -> light -> dark -> system
- localStorage key: `big-ocean-theme`

**From previous 7.5 execution:**
- 10 components extracted under `components/home/`
- All semantic tokens in use, zero hard-coded colors
- Asymmetric bento trait grid, chat preview, archetype teaser all working
- Wave keyframe in globals.css, `motion-safe:` prefix on animations

### Project Structure Notes

- `data-slot` attributes required on all component roots per FRONTEND.md
- Use `cn()` from `@workspace/ui/lib/utils` for class composition
- Use TanStack Router `<Link>` and `useNavigate` for navigation
- Import components from `@workspace/ui/components/*`

### References

- [Epic 7 Specification](/_bmad-output/planning-artifacts/epic-7-ui-theming.md) — Story 7.5 definition, design principles
- [Story 7.5 Brainstorm](/_bmad-output/planning-artifacts/story-7.5-home-page-brainstorm.md) — Design concepts and component specs
- [Story 7.1 Implementation](/_bmad-output/implementation-artifacts/7-1-ocean-brand-color-theme.md) — Color system, OKLCH values, gradients
- [Story 7.2 Implementation](/_bmad-output/implementation-artifacts/7-2-add-dark-mode-toggle-with-system-preference-detection.md) — Theme toggle
- [Story 7.6 Implementation](/_bmad-output/implementation-artifacts/7-6-add-global-header-with-logo-auth-controls-theme-toggle-and-mobile-hamburger.md) — Header, ThemeProvider
- [FRONTEND.md](/docs/FRONTEND.md) — Data attributes, component patterns, styling conventions
- [CLAUDE.md](/CLAUDE.md) — Monorepo structure, testing patterns

## File List

### New Files
- `apps/front/src/components/home/WaveDivider.tsx` — SVG wave section divider (gentle/deep variants)

### Modified Files
- `packages/ui/src/styles/globals.css` — Added depth-zone CSS variables (`:root` and `.dark`), added keyframes: caustic, bubble, fadeInUp, float
- `apps/front/src/routes/index.tsx` — Added WaveDividers between all sections, depth scroll wrapper with IntersectionObserver
- `apps/front/src/components/home/HeroSection.tsx` — Diving copy, caustic light overlay, bubble particles, updated CTA and trust signals
- `apps/front/src/components/home/ScrollIndicator.tsx` — Added "Go deeper" text above bouncing arrow
- `apps/front/src/components/home/ValuePropsSection.tsx` — Diving copy, useFadeInOnScroll hook with IntersectionObserver
- `apps/front/src/components/home/ChatPreviewSection.tsx` — Dive companion copy, float animation, updated messages
- `apps/front/src/components/home/TraitsSection.tsx` — Diving section title/subtitle, added glow prop to TraitCard config
- `apps/front/src/components/home/TraitCard.tsx` — Luminescent hover glow via CSS custom property `--trait-glow`
- `apps/front/src/components/home/ArchetypeTeaserSection.tsx` — Diving copy updates
- `apps/front/src/components/home/DiscoverSection.tsx` — Treasure/discovery framing for card descriptions
- `apps/front/src/components/home/FinalCTASection.tsx` — Diving copy updates

### Re-Execution #2 Modified Files
- `apps/front/src/components/home/ArchetypeTeaserSection.tsx` — Added explainer paragraph, subheading, 3 example archetype mini-cards before blurred mystery card
- `apps/front/src/components/home/TraitsSection.tsx` — Replaced `sampleFacets` with `humanDescription` in TRAIT_CONFIG, updated TraitCard props
- `apps/front/src/components/home/TraitCard.tsx` — Replaced facet list with `humanDescription` text, simplified interface (removed `sampleFacets` and `description`)
- `apps/front/src/components/home/HeroSection.tsx` — Changed "15-minute" to "20-minute" in trust signal
- `apps/front/src/components/home/FinalCTASection.tsx` — Changed "30-minute" to "20-minute" in trust signal

## Change Log

- 2026-02-12: Initial implementation — 10 components, bento layout, semantic tokens, animations
- 2026-02-12: **Re-execution spec** — Full diving metaphor overhaul: new copy throughout, WaveDivider component, depth scroll effect, CSS caustics, bubble particles, luminescent trait glow, fade-in-on-scroll animations, dive companion Nerin messaging
- 2026-02-12: **Re-execution implementation** — All 12 tasks completed: depth-zone CSS variables, WaveDivider component, diving copy across all sections, caustic/bubble effects, luminescent trait glow, fade-in-on-scroll, depth scroll wrapper with IntersectionObserver
- 2026-02-12: **Re-execution spec #2** — Three content revisions from party mode review: (1) Expand archetype section with explainer, (2) Replace trait facet lists with human-readable descriptions, (3) Standardize assessment duration to "20 minutes"
- 2026-02-12: **Re-execution #2 implementation** — All 4 tasks (C1-C4) completed: archetype section expanded with explainer + 3 example cards, trait facet lists replaced with human-readable descriptions, duration standardized to "20 minutes", build/lint/tests all pass

## Re-Execution #2: Content Revisions (Archetype, Traits, Duration)

<!-- Re-execution: Three targeted content changes from party mode review. Architecture unchanged. -->

### Motivation

Party mode review (2026-02-12) identified three content issues:

1. **Archetype section is too cryptic.** The blurred "Thoughtful Explorer" card assumes visitors know what a Big Ocean archetype is. They don't — it's a concept unique to this product (a memorable name derived from your OCEAN code). The section needs an explainer *before* the teaser to create informed curiosity.

2. **Traits section shows facets too early.** Listing "Imagination, Intellect, Adventurousness" as facets assumes the visitor already cares about facet-level detail. On a landing page, the user needs to *feel* what each trait means in plain language. Facet lists belong on the results page, not the conversion page.

3. **Duration inconsistency.** Hero says "15 minutes", FinalCTA says "30 minutes". Standardize to **20 minutes** everywhere.

### Re-Execution Tasks

- [x] Task C1: Expand ArchetypeTeaserSection with explainer content
  - [x] Add introductory copy *before* the blurred card explaining what a Big Ocean archetype is. Three pillars:
    1. **Identity**: Your 30 facet scores distill into a memorable archetype name — not a clinical label, but a character that captures who you are.
    2. **Community**: Your archetype connects you to others who see the world the same way. Find people who get you without having to explain yourself.
    3. **Self-acceptance**: Seeing your patterns named and reflected back helps you understand — and embrace — the parts of yourself you might have questioned.
  - [x] Headline: "What Will You Find in the Deep?"
  - [x] Subheading: "Your personality has a name. And you're not the only one who carries it."
  - [x] Explainer paragraph: "Your dive distills 30 facets of who you are into a single archetype — a name that captures your unique pattern. It's not a box. It's a mirror. And it connects you to others who share the same depths."
  - [x] Show 3 example archetype mini-cards (slightly faded/muted, not blurred) each with:
    - An archetype name (e.g., "Thoughtful Explorer", "Steady Navigator", "Bold Catalyst")
    - A one-line personality hint (e.g., "Curious, independent, always asking 'what if?'")
  - [x] Keep the main blurred card with "Discover What's Below" CTA beneath the examples
  - [x] The section should flow: headline → subheading → explainer → example cards → mystery card → CTA
  - [x] Keep `data-slot="archetype-teaser-section"`

- [x] Task C2: Replace trait facet lists with human-readable descriptions in TraitsSection/TraitCard
  - [x] Replace `sampleFacets` arrays with `humanDescription` strings in TRAIT_CONFIG:
    | Trait | Current (facets) | New (description) |
    |-------|-----------------|-------------------|
    | Openness | Imagination, Intellect, Adventurousness | "How curious are you? How open to new ideas, experiences, and ways of seeing the world?" |
    | Conscientiousness | Orderliness, Self-Discipline, Achievement | "How organized and driven are you? Do you plan ahead or go with the flow?" |
    | Extraversion | Friendliness, Assertiveness, Cheerfulness | "How do you recharge? Do crowds energize you, or do you need your quiet corner?" |
    | Agreeableness | Trust, Altruism, Cooperation | "How do you navigate conflict? Are you the peacemaker or the one who speaks hard truths?" |
    | Neuroticism | Anxiety, Self-Consciousness, Vulnerability | "How do you handle stress and uncertainty? What does your emotional weather look like?" |
  - [x] Update TraitCard component to render `humanDescription` instead of facet list
  - [x] Keep "Five Dimensions of the Deep" title and "Each trait is a layer..." subtitle
  - [x] Keep luminescent glow, gradient hover, asymmetric bento layout
  - [x] Keep OKLCH trait colors and icons

- [x] Task C3: Standardize duration to "20 minutes" across all sections
  - [x] HeroSection trust signal: "A 15-minute deep dive" → "A 20-minute deep dive"
  - [x] FinalCTASection trust signal: "A 30-minute deep dive" → "A 20-minute deep dive"
  - [x] Verify no other duration mentions exist in home page components

- [x] Task C4: Build, lint, visual verification
  - [x] `pnpm build --filter=front` — 0 errors
  - [x] `pnpm lint` — no new warnings
  - [x] `pnpm test:run` — no regressions
  - [x] Visual check: archetype section tells a story before the tease
  - [x] Visual check: trait cards feel approachable, not academic
  - [x] Visual check: "20 minutes" consistent everywhere

### Archetype Section Wireframe (After Revision)

```
┌─────────────────────────────────────────────────────────────┐
│  "What Will You Find in the Deep?"                          │
│  "Your personality has a name. And you're not the only      │
│   one who carries it."                                      │
│                                                             │
│  "Your dive distills 30 facets of who you are into a single │
│   archetype — a name that captures your unique pattern.     │
│   It's not a box. It's a mirror. And it connects you to     │
│   others who share the same depths."                        │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Thoughtful   │ │    Steady    │ │     Bold     │        │
│  │  Explorer     │ │  Navigator   │ │   Catalyst   │        │
│  │ "Curious,     │ │ "Grounded,   │ │ "Energetic,  │ (muted)│
│  │  independent, │ │  reliable,   │ │  decisive,   │        │
│  │  always asking│ │  the calm in │ │  first to    │        │
│  │  'what if?'"  │ │  any storm"  │ │  take the    │        │
│  │               │ │              │ │  leap"       │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│  ┌─────────────────────────────┐                            │
│  │  [Blurred archetype card]   │                            │
│  │  ┌─────────────────────┐    │                            │
│  │  │ "Discover What's    │    │                            │
│  │  │  Below"  [Button]   │    │                            │
│  │  └─────────────────────┘    │                            │
│  └─────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### Trait Card Content (After Revision)

```
┌──────────────────────────────────────────────────┐
│  💡 Openness                                      │
│  "How curious are you? How open to new ideas,     │
│   experiences, and ways of seeing the world?"      │
├──────────────────────────────────────────────────┤
│  ⚡ Conscientiousness                              │
│  "How organized and driven are you? Do you plan    │
│   ahead or go with the flow?"                      │
├──────────────────────────────────────────────────┤
│  ...etc                                           │
└──────────────────────────────────────────────────┘
```

### Copy Reference (Updated)

| Section | Previous | New |
|---------|----------|-----|
| Hero trust | "A 15-minute deep dive · No account needed" | "A 20-minute deep dive · No account needed" |
| Final CTA trust | "A 30-minute deep dive · Free · No account needed" | "A 20-minute deep dive · Free · No account needed" |
| Archetype subheading | "Every personality holds hidden treasures. Yours has a name." | "Your personality has a name. And you're not the only one who carries it." |
| Archetype explainer | (none) | "Your dive distills 30 facets of who you are into a single archetype — a name that captures your unique pattern. It's not a box. It's a mirror. And it connects you to others who share the same depths." |
| Archetype examples | (none) | 3 mini-cards: "Thoughtful Explorer", "Steady Navigator", "Bold Catalyst" with personality hints |
| Openness facets | "Imagination, Intellect, Adventurousness" | "How curious are you? How open to new ideas..." |
| Conscientiousness | "Orderliness, Self-Discipline, Achievement" | "How organized and driven are you?..." |
| Extraversion | "Friendliness, Assertiveness, Cheerfulness" | "How do you recharge?..." |
| Agreeableness | "Trust, Altruism, Cooperation" | "How do you navigate conflict?..." |
| Neuroticism | "Anxiety, Self-Consciousness, Vulnerability" | "How do you handle stress and uncertainty?..." |

### Files to Modify

| File | Changes |
|------|---------|
| `apps/front/src/components/home/ArchetypeTeaserSection.tsx` | Add explainer text, example archetype names, restructure layout |
| `apps/front/src/components/home/TraitsSection.tsx` | Replace `sampleFacets` with `humanDescription` in TRAIT_CONFIG |
| `apps/front/src/components/home/TraitCard.tsx` | Render description text instead of facet list |
| `apps/front/src/components/home/HeroSection.tsx` | "15-minute" → "20-minute" |
| `apps/front/src/components/home/FinalCTASection.tsx` | "30-minute" → "20-minute" |

### Anti-Patterns (Re-Execution #2)

```
DO NOT restructure the page section order — only modify content within existing sections
DO NOT remove the blurred archetype card — it stays as the mystery hook AFTER the explainer
DO NOT add real archetype data or API calls — all example names are static/decorative
DO NOT make trait descriptions too long — 1-2 sentences max, conversational tone
DO NOT remove trait icons, colors, or glow effects — only changing the text content
DO NOT change the bento grid layout — keep asymmetric with Openness larger
```

## Dev Agent Record

### Implementation Plan
- Task 1: Added depth-zone CSS custom properties to `:root` and `.dark`, plus 4 new keyframes (caustic, bubble, fadeInUp, float) to globals.css
- Task 2: Created WaveDivider.tsx with gentle/deep SVG variants, flip support, currentColor fill, aria-hidden
- Task 3: Rewrote HeroSection with diving copy, CSS caustic overlay (radial gradients with dark mode variants), 6 bubble particles with staggered animations, updated ScrollIndicator with "Go deeper" text
- Task 4: Updated ValuePropsSection with diving copy and useFadeInOnScroll hook using IntersectionObserver
- Task 5: Updated ChatPreviewSection with dive companion messaging, float animation on chat container
- Task 6: Added luminescent glow to TraitCard via --trait-glow CSS custom property and hover:shadow-[var(--trait-glow)]
- Task 7-9: Updated ArchetypeTeaserSection, DiscoverSection, FinalCTASection with diving copy
- Task 10: Added WaveDividers between all sections and depth scroll wrapper with IntersectionObserver in index.tsx
- Task 11-12: Verified build (0 errors), lint (no new warnings), tests (258 pass, 0 regressions), zero hard-coded colors

### Completion Notes
All 12 tasks completed. The diving metaphor is implemented through:
- **Atmospheric effects**: CSS caustics, bubble particles in hero
- **Depth progression**: Background color transitions via IntersectionObserver as user scrolls
- **Organic transitions**: SVG wave dividers between all sections
- **Consistent voice**: All copy updated to diving/deep-dive metaphor
- **Animation system**: All animations use `motion-safe:` prefix for reduced-motion support
- Build: 0 errors | Lint: 1 pre-existing warning (unrelated) | Tests: 258 pass, 0 regressions

### Re-Execution #2 Implementation Notes
- Task C1: Expanded ArchetypeTeaserSection with explainer paragraph, new subheading, and 3 example archetype mini-cards (Thoughtful Explorer, Steady Navigator, Bold Catalyst) with personality hints. Section flow: headline → subheading → explainer → example cards → mystery card → CTA
- Task C2: Replaced `sampleFacets` arrays with `humanDescription` strings in TraitsSection TRAIT_CONFIG. Updated TraitCard interface and rendering — now shows conversational questions instead of facet names. Removed `description` field (was only used on isLarge card). All descriptions always visible, not just on hover.
- Task C3: Standardized duration to "20 minutes" in HeroSection and FinalCTASection. Grep confirmed no other duration mentions.
- Task C4: Build 0 errors, lint 1 pre-existing warning (unrelated), tests 258 pass (139 API + 119 frontend), zero hard-coded colors, zero regressions.
