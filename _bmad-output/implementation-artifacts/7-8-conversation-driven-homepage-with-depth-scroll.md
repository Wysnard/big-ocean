# Story 7.8: Conversation-Driven Homepage with Depth Scroll

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- REPLACES: 7-8-home-page-redesign-with-color-block-composition.md (previous color-block design, now superseded) -->

## Story

As a **User**,
I want **the home page to unfold as a conversation with Nerin — the AI guide — with rich embedded content that scroll-reveals as I descend through depth zones**,
So that **I experience the product's core value proposition (conversational personality discovery) directly on the landing page, and I'm compelled to start my own assessment**.

## Acceptance Criteria

1. **Given** I visit the home page **When** the hero section loads **Then** I see a two-column layout:
   - Left: Brand mark ("big-" + OceanShapeSet) above the headline, headline ("What if the most interesting person in the room is you?"), tagline, meta line ("30 MIN · FREE · NO ACCOUNT NEEDED"), "Begin Your Dive" CTA
   - Right: 5 OCEAN geometric shapes with breathing animation (6s cycle, staggered 1.2s per shape)
   - Bottom: "Scroll to descend" cue with bob animation
   **And** the hero fills the full viewport height
   **And** the design uses brand typography (Space Grotesk headings, DM Sans body, JetBrains Mono meta)

2. **Given** I scroll past the hero **When** the conversation section enters the viewport **Then** messages from Nerin and a simulated user scroll-reveal sequentially (Intersection Observer) **And** each message group fades in with upward slide (translateY 26px → 0, 0.65s ease) **And** a vertical conversation thread line runs along the left side **And** Nerin messages have a gradient avatar (Teal → Pink) with "N" initial **And** user messages are right-aligned with gradient bubble (Pink → Orange)

3. **Given** I scroll in auto or forced-light mode **When** the page transitions through depth zones **Then** the background interpolates through 5 color zones:
   - Surface: Warm Cream `rgb(255,248,240)` — dark text
   - Shallows: Soft Blush `rgb(255,240,232)` — dark text
   - Mid: Light Peach `rgb(255,232,216)` — dark text
   - Deep: Dark Purple-Navy `rgb(40,38,65)` — white text
   - Abyss: Deep Navy `rgb(10,14,39)` — white text
   **And** the nav, bubble styles, facet pills, and input bar dynamically switch between light/dark classes based on current zone darkness
   **And** CSS custom properties update for bubble-bg, bubble-border, embed-bg, muted-dynamic, etc.

4. **Given** I am in forced dark mode **When** I scroll **Then** the background remains static Abyss Navy `rgb(14,16,42)` throughout **And** all UI elements use dark mode styling regardless of scroll position

5. **Given** the depth meter is visible (desktop only, hidden < 900px) **When** I scroll through the conversation **Then** a fixed left-side depth meter shows:
   - A 160px vertical track with fill indicator tracking scroll percentage
   - 5 labeled pips: Surface, Shallows, Mid, Deep, Abyss
   - Active pip highlighted in Electric Pink
   - Current zone name displayed below the track
   **And** the depth meter only appears when the conversation section is in the viewport

6. **Given** I view the trait stack embed **When** it appears inside a Nerin chat bubble **Then** I see 5 stacked trait cards, each showing: trait geometric shape, trait name (in trait color), conversational description (Nerin voice)
   **And** clicking a trait card spawns a simulated user message ("Tell me more about {Trait}") and a Nerin response below the stack
   **And** the Nerin response shows the trait shape, "Six facets of {Trait}" header, and 6 facets with left accent bars in facet sub-colors
   **And** each facet shows its name in facet color and a conversational description
   **And** only one trait is expanded at a time (clicking another replaces the conversation pair)
   **And** the active card gets a trait-colored border while others dim
   **And** facets cascade in with staggered animation
   **And** the stack is contained within an embed container (rounded, bordered, backdrop-blur)

7. **Given** I view the result preview embeds (OCEAN Code, Radar Chart, 30-Facet Bars) **When** they appear inside Nerin chat bubbles **Then** each shows a clear, unblurred preview of example result data **And** each embed has a CTA pill below the content ("Take assessment to discover yours →", "See your scores →", "Reveal your 30 facets →") **And** the previews use example/demo data (not tied to any real assessment)

8. **Given** Nerin introduces sharing **When** the share card embed appears **Then** I see a visual preview of a social share card containing:
   - Archetype name (e.g., "The Explorer") in display typography
   - Geometric Personality Signature (5 OCEAN shapes sized by trait level)
   - Trait summary bar (O: High, C: High, E: Mid, A: High, N: Mid)
   - big-ocean brand mark at top
   - Themed background using archetype colors
   **And** Nerin's message explains that the profile is shareable with friends
   **And** a CTA pill below: "Share your archetype →"

9. **Given** Nerin introduces comparison **When** the comparison teaser embed appears **Then** I see a preview of two overlaid radar charts:
   - "You" radar in Electric Pink (filled, semi-transparent)
   - "Friend" radar in Teal (filled, semi-transparent)
   - Overlap area visually highlighted
   - Legend: "You" and "A Friend" labels with color dots
   - "Coming soon" badge in top-right corner
   **And** Nerin's message teases the ability to compare personalities with friends
   **And** a CTA pill below: "Discover how you compare →"

10. **Given** I have scrolled past ~35% of the page **When** the chat input bar becomes visible **Then** a fixed bottom bar slides up containing:
    - A readonly text input with placeholder "Type your first message to Nerin..."
    - A "Start Conversation →" gradient button
    **And** the bar uses glass-morphism (backdrop-blur, semi-transparent background)
    **And** clicking the button navigates to the assessment start flow

11. **Given** I use the theme toggle **When** I click the toggle button **Then** the theme cycles: auto → dark → light → dark → ... **And** auto mode uses scroll-driven light-to-dark transition **And** dark mode uses static dark background **And** light mode uses the same light-to-dark transition as auto

12. **Given** I view the page on mobile (< 900px) **When** the layout adapts **Then** the hero collapses to single column (text above, shapes below) **And** the depth meter is hidden **And** conversation bubbles use 92% max-width **And** facet grid collapses to 2 columns (1 column below 480px) **And** trait cards stack vertically with centered text **And** share card scales down proportionally **And** comparison radar charts stack vertically **And** all touch targets are minimum 44px

13. **Given** I view the page with `prefers-reduced-motion` **When** animations would normally trigger **Then** OCEAN shapes show static final state (no breathing) **And** scroll cue shows without bob animation **And** message groups appear without slide transition **And** chat bar appears without slide-up animation

## Tasks / Subtasks

- [x] Task 1: Create DepthScrollProvider context (AC: #3, #4, #9)
  - [x] Create `apps/front/src/components/home/DepthScrollProvider.tsx`
  - [x] Track scroll percentage via `requestAnimationFrame`-throttled scroll listener
  - [x] Compute current zone index and interpolated bg/fg colors from active palette
  - [x] Expose via context: `scrollPercent`, `currentZone`, `isDark`, `themeMode` (auto/dark/light)
  - [x] Three zone palettes: AUTO_ZONES (light→dark scroll), DARK_ZONES (static navy), LIGHT_ZONES (same as auto)
  - [x] **Tailwind integration:** Toggle `dark` class on `<html>` when `isDark` changes — this enables all existing Tailwind `dark:` variants across the page (header, components, etc.)
  - [x] Set `document.body.style.background` and `document.body.style.color` as inline RGB for smooth interpolation (Tailwind classes can't interpolate between arbitrary RGB values per-frame)
  - [x] Add new CSS custom properties to `globals.css` under `:root` and `.dark` selectors (see "Depth Scroll CSS Tokens" below) — consumed via Tailwind `bg-[var(--bubble-bg)]` etc.
  - [x] **isDark threshold logic:** `isDark = zone.dark || (nextZone.dark && interpolationFactor > 0.3)` — switches to dark 30% before reaching a dark zone for smooth visual transition
  - [x] Read current theme from `useTheme()` hook to select active zone palette
  - [x] `data-slot="depth-scroll-provider"`

- [x] Task 2: Build HeroSection as two-column layout (AC: #1, #10, #11)
  - [x] Replace current color-block hero with two-column grid: text (1.1fr) + shapes (1fr)
  - [x] Left column content:
    - **Brand mark** above headline: `"big-"` in `font-heading text-4xl font-bold` + `<OceanShapeSet size={36} />` (mobile) / `<OceanShapeSet size={44} />` (sm+) — reuse the existing pattern from current HeroSection. Wrap in `mb-6` container. On mobile (<900px), center the brand mark.
    - `h1`: "What if the most `<span class="hl">interesting person</span>` in the room is you?" — the `hl` span gets gradient text: `bg-gradient-to-r from-primary via-[#FF1493] to-secondary bg-clip-text text-transparent` (3-stop gradient: Electric Pink → Deep Pink → Sunset Orange)
    - Tagline `p`: "A personality deep dive guided by AI, grounded in science, revealed through conversation. Not a quiz. A real exploration of the 30 facets that make you, you."
    - Meta line: "30 MIN · FREE · NO ACCOUNT NEEDED" in `font-mono text-[.72rem] tracking-[.05em] text-muted-foreground`
    - CTA: "Begin Your Dive ↓" button with `bg-gradient-to-r from-primary to-secondary` padding `15px 34px` rounded-xl, hover: `translate-y-[-2px] shadow-[0_8px_28px_rgba(255,0,128,.28)]`
  - [x] Right column: 5 OCEAN shapes with `breathe` keyframe (6s cycle, 1.2s stagger per shape via `animation-delay: -1.2s, -2.4s, -3.6s, -4.8s`)
  - [x] Bottom: scroll cue with bob animation ("Scroll to descend ↓") — 2.5s ease-in-out, 8px vertical travel
  - [x] Mobile (< 900px): single column, text centered above, shapes below (230px height)
  - [x] `prefers-reduced-motion`: static shapes, no bob
  - [x] `data-slot="hero-section"` preserved

- [x] Task 3: Build ConversationFlow container (AC: #2, #3, #4)
  - [x] Create `apps/front/src/components/home/ConversationFlow.tsx`
  - [x] Vertical conversation thread with left-side line via `::before` pseudo-element: `left: 29px` (center of 32px avatar + 11px gap offset), `width: 1.5px`, gradient top→transparent bottom
  - [x] Line switches between light/dark variants based on `isDark` from DepthScrollProvider:
    - Light: `bg-gradient-to-b from-border to-transparent`
    - Dark: `bg-gradient-to-b from-white/[.06] to-transparent`
  - [x] Max-width: 900px (1000px at 1200px+, 1100px at 1440px+)
  - [x] Renders MessageGroup children in order
  - [x] `data-slot="conversation-flow"`

- [x] Task 4: Build MessageGroup and ChatBubble components (AC: #2)
  - [x] Create `apps/front/src/components/home/MessageGroup.tsx` — wrapper with IntersectionObserver fade+slide
  - [x] Create `apps/front/src/components/home/ChatBubble.tsx` — individual bubble (Nerin or User variant)
  - [x] Nerin: left-aligned, 32px avatar with gradient (Teal→Pink), "N" initial, bubble with theme-aware bg/border
  - [x] User: right-aligned, 32px avatar with theme-aware bg, "Y" initial, gradient bubble (Pink→Orange), white text
  - [x] Bubble max-width: 88% (92% at 1200px+)
  - [x] Nerin bubble: bottom-left radius reduced to 5px; User bubble: bottom-right radius reduced to 5px
  - [x] IntersectionObserver: threshold 0.12, rootMargin '0px 0px -30px 0px'
  - [x] `data-slot="message-group"`, `data-slot="chat-bubble"`

- [x] Task 5: Build TraitStackEmbed — Interactive Conversational Trait Explorer (AC: #6)
  - [x] Create `apps/front/src/components/home/TraitStackEmbed.tsx`
  - [x] **Replaces TraitCarouselEmbed** with a conversational interaction pattern:
    - 5 stacked trait cards inside an embed container (not a carousel)
    - Clicking a card spawns a user+Nerin message pair below the stack
    - User message: "Tell me more about {Trait}"
    - Nerin response: trait shape (40px) + "Six facets of {Trait}" header + 6 facets with left accent bars
    - One trait expanded at a time (accordion behavior via state replacement)
    - Clicking same card deselects and removes the conversation pair
  - [x] **Copy deck:** Version A (Nerin conversational voice) for all 5 traits and 30 facets
    - Reference: `_bmad-output/ux-explorations/trait-stack-copy-deck.md`
    - Pattern: one sentence reframes the construct, one sentence makes you feel seen
  - [x] **Visual design:**
    - Trait cards: shape (32px) + name (trait color) + one-liner description + chevron affordance
    - Active card: trait-colored border + faint trait wash, other cards dim to 0.45 opacity
    - Facets: left accent bar in facet sub-color (`--facet-{name}`), name in facet color, description in muted
    - Facet cascade animation: translateX(-6px → 0) + opacity, 60ms stagger per facet
    - Shape scale pulse on expand (1.0 → 1.15), shape reveal in response (scale+rotate)
  - [x] **Shape→Trait mapping** (from Story 7.4):
    | Trait | Shape Component |
    |-------|----------------|
    | Openness | `OceanCircle` |
    | Conscientiousness | `OceanHalfCircle` |
    | Extraversion | `OceanRectangle` |
    | Agreeableness | `OceanTriangle` |
    | Neuroticism | `OceanDiamond` |
  - [x] **Facet display names:** Derived from `packages/domain/src/constants/big-five.ts` canonical facet names (snake_case → Title Case)
  - [x] Uses `data-state` attributes for card states (active/dimmed/idle) per FRONTEND.md conventions
  - [x] Mobile: cards go full-width, shape above name below 600px
  - [x] `data-slot="trait-stack-embed"`, `data-slot="trait-card"`, `data-slot="facet-conversation-pair"`
  - [x] Keyframe animations added to globals.css: `traitPairEnter`, `traitPairExit`, `facetCascade`, `shapeReveal`
  - [x] `motion-reduce` respected on conversation pair and facet cascade
  - [x] Design mockup: `_bmad-output/ux-explorations/trait-stack-mockup.html`

- [x] Task 6: Build ResultPreviewEmbed + 3 preview content components (AC: #7)
  - [x] Create `apps/front/src/components/home/ResultPreviewEmbed.tsx` — shared embed wrapper with CTA pill below content
  - [x] Wrapper: embed container (`rounded-xl`, bordered, `backdrop-blur-sm`, `bg-[var(--embed-bg)]`, `border-[var(--embed-border)]`) with content displayed clearly (no blur)
  - [x] CTA pill below preview content: Electric Pink bg (`bg-primary`), `font-heading font-semibold text-xs text-white px-4 py-2 rounded-lg shadow-[0_4px_14px_rgba(255,0,128,.3)]`, navigates to `/chat`
  - [x] Create `OceanCodePreview.tsx` — 5 letter boxes with trait colors (H/H/M/H/M example)
  - [x] Create `RadarChartPreview.tsx` — SVG radar pentagon (200×200 viewBox) with exact coordinates from prototype:
    - Outer pentagon: `points="100,20 175,65 155,155 45,155 25,65"` (stroke, opacity .12)
    - Inner pentagon: `points="100,45 155,75 142,140 58,140 45,75"` (stroke, opacity .06)
    - Score polygon: `points="100,28 168,72 140,148 55,135 35,70"` (fill `rgba(255,0,128,.1)`, stroke primary, width 2)
    - Score dots (r=4): O(100,28) C(168,72) E(140,148) A(55,135) N(35,70) — each in trait color
    - Legend: "Openness: 92/120", "Conscientiousness: 88/120", "Extraversion: 65/120", "Agreeableness: 78/120", "Neuroticism: 52/120" with colored dots
  - [x] Create `FacetBarsPreview.tsx` — 5-column grid (`grid-cols-5`, responsive `grid-cols-2` at <900px, `grid-cols-1` at <480px) of 6 facet bars per trait. Exact bar widths from prototype:
    - O: 85%, 92%, 70%, 78%, 95%, 80%
    - C: 88%, 72%, 80%, 90%, 75%, 65%
    - E: 68%, 42%, 72%, 58%, 55%, 60%
    - A: 75%, 82%, 80%, 70%, 55%, 85%
    - N: 50%, 35%, 40%, 55%, 48%, 45%
    - Bar track: light `bg-border`, dark `bg-white/[.06]`; bar fill: trait color
  - [x] All previews use `text-[var(--muted-dynamic)]` for theme-aware muted text
  - [x] `data-slot="result-preview-embed"`, `data-slot="ocean-code-preview"`, etc.

- [x] Task 6b: Build ShareCardPreview (AC: #8)
  - [x] Create `apps/front/src/components/home/ShareCardPreview.tsx`
  - [x] Visual mockup of a social share card (NOT functional — static example data):
    - big-ocean brand mark at top (`"big-" + OceanShapeSet` at `size={16}`)
    - Archetype name in `font-heading text-xl font-bold` (e.g., "The Explorer")
    - `GeometricSignature` component with example OCEAN code "HHMHM" at `baseSize={24}`
    - Trait summary row: 5 colored badges showing "O: High", "C: High", "E: Mid", "A: High", "N: Mid" using trait colors
    - Card background: subtle gradient using archetype-themed colors (e.g., `from-trait-openness/10 to-trait-extraversion/10`)
    - Card frame: `rounded-2xl border shadow-lg` with aspect ratio ~1200:630 (OG card proportions)
  - [x] Wrapped in `ResultPreviewEmbed` with CTA: "Share your archetype →" (links to `/chat`)
  - [x] Theme-aware: uses `bg-[var(--embed-bg)]` and depth scroll tokens
  - [x] Mobile: scales down proportionally, maintains aspect ratio
  - [x] `data-slot="share-card-preview"`

- [x] Task 6c: Build ComparisonTeaserPreview (AC: #9)
  - [x] Create `apps/front/src/components/home/ComparisonTeaserPreview.tsx`
  - [x] Two overlaid radar charts in a single SVG (200×200 viewBox):
    - Reuse the same pentagon grid as `RadarChartPreview` (outer + inner pentagons)
    - "You" polygon: Electric Pink fill `rgba(255,0,128,.15)`, stroke `var(--primary)`, stroke-width 2
      - Points: `100,28 168,72 140,148 55,135 35,70` (same as RadarChartPreview)
    - "Friend" polygon: Teal fill `rgba(0,180,166,.15)`, stroke `var(--tertiary)`, stroke-width 2
      - Points: `100,40 150,80 130,140 65,130 50,75` (different shape for visual contrast)
    - Score dots on both polygons in their respective colors
  - [x] Legend below chart: two rows with colored dots
    - `●` Electric Pink — "You"
    - `●` Teal — "A Friend"
  - [x] "Coming soon" badge: absolute positioned top-right, `bg-secondary/90 text-white font-mono text-[.6rem] px-2 py-1 rounded-md`
  - [x] Wrapped in `ResultPreviewEmbed` with CTA: "Discover how you compare →" (links to `/chat`)
  - [x] Mobile: radar SVG scales responsively, legend stacks below
  - [x] `data-slot="comparison-teaser-preview"`

- [x] Task 7: Build DepthMeter (AC: #5)
  - [x] Create `apps/front/src/components/home/DepthMeter.tsx`
  - [x] Fixed position: left 20px, vertically centered
  - [x] 160px vertical track with fill bar tracking scroll percentage (`height: scrollPercent * 100%`)
  - [x] 5 labeled pips: Surface, Shallows, Mid, Deep, Abyss (`font-mono text-[.45rem] tracking-[.08em] uppercase`)
  - [x] Active pip detection: `activePip = Math.round(scrollPercent * (zones.length - 1))` — highlights nearest zone
  - [x] Active pip: Electric Pink (`text-primary font-semibold`), inactive: light `text-black/20`, dark `text-white/15`
  - [x] Zone name below track (`font-mono text-[.5rem] tracking-[.06em] text-primary`)
  - [x] Only visible when conversation section is in viewport (IntersectionObserver, threshold 0.01)
  - [x] Hidden on mobile (< 900px)
  - [x] `data-slot="depth-meter"`

- [x] Task 8: Build ChatInputBar (AC: #10)
  - [x] Create `apps/front/src/components/home/ChatInputBar.tsx`
  - [x] Fixed bottom bar, slides up at ~35% scroll (transform translateY)
  - [x] Glass-morphism: backdrop-blur 14px, semi-transparent bg, top border
  - [x] Readonly input: "Type your first message to Nerin..." placeholder
  - [x] "Start Conversation →" gradient button (Pink→Orange)
  - [x] Clicking button navigates to `/chat` (assessment start)
  - [x] Theme-aware light/dark styling from DepthScrollProvider
  - [x] Input max-width: 520px (700px at 1200px+, 820px at 1440px+)
  - [x] `data-slot="chat-input-bar"`

- [x] Task 9: Compose page in index.tsx route (AC: all)
  - [x] Replace current section-based layout with conversation-driven layout
  - [x] Structure: DepthScrollProvider wrapping Hero → ConversationFlow (with MessageGroups containing embeds) → ChatInputBar + DepthMeter
  - [x] Conversation content sequence:
    1. Nerin intro (2 messages)
    2. User asks "What exactly do you measure?"
    3. Nerin response with TraitCarouselEmbed
    4. User asks "What do I actually get at the end?"
    5. Nerin with OCEAN Code preview
    6. Nerin with Radar Chart preview
    7. Nerin with 30-Facet Bars preview
    8. User asks "Can I share my results?"
    9. Nerin explains sharing + ShareCardPreview embed
    10. User asks "Can I compare with friends?"
    11. Nerin teases comparison + ComparisonTeaserPreview embed
    12. User asks "How long does this take?"
    13. Nerin closing: "About 30 minutes. It's free. You don't need an account."
  - [x] Remove old section components from page (ValuePropsSection, ChatPreviewSection, TraitsSection, ArchetypeTeaserSection, DiscoverSection, FinalCTASection, WaveDivider, Bubbles)
  - [x] Keep existing Header integration
  - [x] `data-slot="home-page"` on root

- [x] Task 10: Mobile responsiveness pass (AC: #12)
  - [x] Hero: single column below 900px, centered text, shapes 230px height
  - [x] Depth meter: hidden below 900px
  - [x] Bubbles: 92% max-width on mobile
  - [x] Facet grid in FacetBarsPreview: 2 columns (1 column below 480px)
  - [x] Trait carousel cards: vertical stack with centered text on mobile
  - [x] Chat input bar: reduced padding on mobile
  - [x] All touch targets >= 44px
  - [x] Nav padding: 12px 18px on mobile

- [x] Task 11: Accessibility and animation pass (AC: #13)
  - [x] All animated elements use `motion-safe:` prefix or CSS `prefers-reduced-motion` media query
  - [x] OCEAN shapes: no breathing animation with reduced motion
  - [x] Message groups: instant visibility (no fade/slide)
  - [x] Chat bar: instant show (no slide-up)
  - [x] Scroll cue: no bob animation
  - [x] `aria-hidden="true"` on all decorative elements (shapes, thread line, depth meter pips)
  - [x] Semantic HTML: h1 in hero, proper heading hierarchy
  - [x] WCAG AA contrast for all text on interpolated backgrounds

- [x] Task 12: Build verification
  - [x] `pnpm build` — 0 errors
  - [x] `pnpm lint` — no new warnings (only pre-existing `highlightQuote` warning in TherapistChat.tsx)
  - [x] `pnpm test:run` — no regressions (154 API + 165 front = 319 tests pass)

## Dev Notes

### CRITICAL: This is a COMPLETE REARCHITECTURE, Not a Modification

The previous Story 7.8 (color-block composition) implemented a **section-based layout** with discrete zones (Hero → ValueProps → ChatPreview → Traits → Teaser → CTA). This new design is **fundamentally different** — a **conversation-driven experience** where the homepage unfolds as a simulated chat with Nerin.

**Strategy:** Create new components for the conversation-driven design. The old section components (ValuePropsSection, ChatPreviewSection, TraitsSection, ArchetypeTeaserSection, DiscoverSection, FinalCTASection) should be **removed from the page layout** but can remain in the codebase if other pages reference them. The index.tsx route file gets a complete rewrite of its content section.

### Design Reference

The authoritative design prototype is:
```
_bmad-output/ux-explorations/homepage-directions/direction-combined.html
```

This is a fully working HTML/CSS/JS prototype with:
- Complete depth scroll color interpolation system
- Theme toggle (auto/dark/light cycling)
- Scroll-reveal conversation messages
- Trait carousel with scroll-snap
- Blurred preview embeds with hover reveal
- Depth meter with zone tracking
- Sticky chat input bar
- Full responsive breakpoints

**The prototype uses vanilla JS/CSS. Production must use React components with Tailwind + CSS custom properties.**

### Depth Scroll Color System (Core Innovation)

The homepage uses **scroll-position-driven background color interpolation** — as you scroll, the page physically darkens from warm cream to deep navy, simulating a descent into deeper personality exploration.

```typescript
// Three zone palettes for three theme modes
const AUTO_ZONES = [
  { bg: [255,248,240], fg: [26,26,46], dark: false, name: 'Surface' },
  { bg: [255,240,232], fg: [26,26,46], dark: false, name: 'Shallows' },
  { bg: [255,232,216], fg: [26,26,46], dark: false, name: 'Mid' },
  { bg: [40,38,65],    fg: [255,255,255], dark: true, name: 'Deep' },
  { bg: [10,14,39],    fg: [255,255,255], dark: true, name: 'Abyss' },
];

const DARK_ZONES = AUTO_ZONES.map(z => ({
  ...z, bg: [14,16,42], fg: [255,255,255], dark: true
})); // Static dark navy throughout

const LIGHT_ZONES = [...AUTO_ZONES]; // Same transition as auto
```

**How it works:**
1. `DepthScrollProvider` computes `scrollPercent = scrollY / (scrollHeight - windowHeight)`
2. Maps scroll percent to zone pair index (0-4), computes interpolation factor
3. Linearly interpolates RGB values between adjacent zones
4. Sets `document.body.style.background` and `document.body.style.color` (inline style for per-frame interpolation)
5. Determines `isDark` flag from zone's dark property + 30% threshold lookahead
6. Toggles `dark` class on `<html>` — this switches all Tailwind `dark:` variants AND the depth scroll CSS tokens defined in `globals.css` (`:root` vs `.dark` selectors)
7. Exposes `scrollPercent`, `currentZone`, `isDark`, `themeMode` via React context

**Components consume depth-scroll tokens via Tailwind:** `bg-[var(--bubble-bg)]`, `border-[var(--bubble-border)]`, etc. The CSS cascade handles the light/dark switch automatically.

### Theme Toggle Behavior

The toggle cycles through three modes: **system → dark → light → system → ...**

| Mode | Scroll Effect | Background | isDark |
|------|--------------|------------|--------|
| System (Auto) | Light→Dark gradient as you scroll | Interpolated from zone palette | Zone-dependent |
| Dark | No scroll effect on background | Static `rgb(14,16,42)` everywhere | Always true |
| Light | Same gradient as Auto | Interpolated from zone palette | Zone-dependent |

The theme toggle icon: moon (☽) in light modes, sun (☀) in dark mode.

**IMPORTANT: Cycling order change required.** The current `ThemeToggle.tsx` and `MobileNav.tsx` both use:
```typescript
const themeOrder: UserTheme[] = ["system", "light", "dark"];
```
This must change to:
```typescript
const themeOrder: UserTheme[] = ["system", "dark", "light"];
```
This ensures dark mode is the first forced option (most natural for the depth scroll experience where you're descending into darkness). Update in both files:
- `apps/front/src/components/ThemeToggle.tsx`
- `apps/front/src/components/MobileNav.tsx`

### Conversation Content (Hardcoded — Not Live Chat)

The conversation is **static, scripted content** that demonstrates the product. It is NOT connected to any backend. The messages are hardcoded in the page component.

**Message sequence:**
```
1.  [Nerin] Hi. I'm Nerin. I'm not a questionnaire. I don't do "on a scale of 1 to 5." I have actual conversations.
2.  [Nerin] Through our chat, I map 30 distinct facets of your personality. Not just "are you an introvert" — but the real nuances of how you see and process the world.
3.  [User]  What exactly do you measure?
4.  [Nerin] Five core dimensions of personality. Each one has six facets beneath it. Swipe through: [TRAIT CAROUSEL EMBED]
5.  [User]  That's a lot deeper than I expected. What do I actually get at the end?
6.  [Nerin] First, your OCEAN Code — a 5-letter personality fingerprint: [OCEAN CODE EMBED]
7.  [Nerin] Then a visual overview of how your five traits compare: [RADAR CHART EMBED]
8.  [Nerin] And the full 30-facet breakdown — the real depth: [FACET BARS EMBED]
9.  [User]  Can I share my results?
10. [Nerin] Absolutely. You get a shareable profile card — your archetype, your signature, your trait map. Send it to anyone: [SHARE CARD EMBED]
11. [User]  Can I compare with friends?
12. [Nerin] That's where it gets interesting. Once your friends take the assessment, you'll be able to overlay your profiles and see where you align — and where you diverge: [COMPARISON TEASER EMBED]
13. [User]  How long does this take?
14. [Nerin] About 30 minutes. It's free. You don't need an account. Just a conversation between you and me. Ready?
```

### Dynamic CSS Custom Properties Pattern (Tailwind-First)

The depth scroll system uses **two layers** of theme integration:

1. **Tailwind `dark` class on `<html>`:** DepthScrollProvider toggles this when `isDark` changes. All existing Tailwind `dark:` variants (header, buttons, components) automatically adapt — no extra work needed.

2. **CSS custom properties for depth-scroll-specific tokens:** Defined in `globals.css` under `:root` and `.dark` selectors (see "Depth Scroll CSS Tokens" section below). Components consume via Tailwind arbitrary values: `bg-[var(--bubble-bg)]`, `border-[var(--bubble-border)]`, `text-[var(--bubble-fg)]`, etc.

3. **Inline `style` on `document.body`:** Background and text color are set via `document.body.style.background` and `document.body.style.color` because Tailwind classes can't interpolate between arbitrary RGB values per-frame.

**Why not use `document.documentElement.style.setProperty()` for all tokens?** The depth-scroll tokens have fixed light/dark values (not interpolated per-frame), so they belong in CSS where Tailwind can reference them. Only the body background needs per-frame JS manipulation.

### Depth Scroll CSS Tokens for globals.css

Add these custom properties to `packages/ui/src/styles/globals.css`. They provide depth-scroll-specific styling that components consume via Tailwind arbitrary values (e.g., `bg-[var(--bubble-bg)]`).

```css
/* In the existing :root block (or as a new section after existing tokens): */
:root {
  /* Depth scroll conversation tokens */
  --bubble-bg: var(--card);
  --bubble-border: var(--border);
  --bubble-fg: var(--foreground);
  --embed-bg: rgba(255, 255, 255, 0.55);
  --embed-border: var(--border);
  --user-avatar-bg: var(--deep);
  --user-avatar-fg: var(--foreground);
  --muted-dynamic: var(--muted-foreground);
}

/* In the existing .dark block: */
.dark {
  /* Depth scroll conversation tokens */
  --bubble-bg: rgba(255, 255, 255, 0.05);
  --bubble-border: rgba(255, 255, 255, 0.07);
  --bubble-fg: rgba(255, 255, 255, 0.85);
  --embed-bg: rgba(255, 255, 255, 0.04);
  --embed-border: rgba(255, 255, 255, 0.06);
  --user-avatar-bg: rgba(255, 255, 255, 0.08);
  --user-avatar-fg: #fff;
  --muted-dynamic: rgba(255, 255, 255, 0.45);
}
```

**Usage in components:**
```tsx
// ChatBubble.tsx (Nerin variant)
<div className="bg-[var(--bubble-bg)] border border-[var(--bubble-border)] text-[var(--bubble-fg)]">

// BlurredPreviewEmbed.tsx
<div className="bg-[var(--embed-bg)] border border-[var(--embed-border)] backdrop-blur-sm">

// User avatar
<div className="bg-[var(--user-avatar-bg)] text-[var(--user-avatar-fg)]">
```

These tokens transition automatically when DepthScrollProvider toggles the `dark` class on `<html>`, because the CSS cascade handles the `:root` vs `.dark` selector switch.

### Scroll Performance

The scroll listener MUST be throttled via `requestAnimationFrame` to avoid jank:

```typescript
useEffect(() => {
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        // compute scroll %, interpolate colors, update CSS props
        ticking = false;
      });
      ticking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

### Trait Carousel Implementation

Uses **CSS scroll-snap** — no carousel library needed:

```css
.trait-scroll {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; /* Firefox */
}
.trait-scroll::-webkit-scrollbar { display: none; } /* Chrome/Safari */
.trait-card {
  min-width: 100%;
  scroll-snap-align: start;
}
```

Dot navigation syncs with `scrollLeft / offsetWidth` on scroll event.

### Result Preview Pattern

All three preview embeds share the same `ResultPreviewEmbed` wrapper:

```tsx
<div className="embed rounded-xl bg-[var(--embed-bg)] border border-[var(--embed-border)] backdrop-blur-sm p-[18px]">
  {/* Preview content — displayed clearly, no blur */}
  {children}
  <div className="mt-3 flex justify-center">
    <Link to="/chat" className="bg-primary text-white font-heading font-semibold
                     text-xs px-4 py-2 rounded-lg shadow-[0_4px_14px_rgba(255,0,128,.3)]
                     cursor-pointer hover:translate-y-[-1px] transition-transform">
      {ctaText} →
    </Link>
  </div>
</div>
```

The previews use hardcoded example data to showcase what users get after completing an assessment. Content is fully visible — no blur or obfuscation.

### Components to Keep vs Replace vs Create

| Action | Component | Notes |
|--------|-----------|-------|
| **KEEP** | `ocean-shapes/*` | All 5 shapes + OceanShapeSet — used in hero |
| **KEEP** | `Logo.tsx` | Unchanged |
| **KEEP** | `NerinAvatar.tsx` | Not used on homepage (Nerin uses "N" gradient circle on homepage) |
| **KEEP** | `ThemeProvider.tsx` | Still wraps app |
| **KEEP** | `Header.tsx` | Still renders at top |
| **KEEP** | `ScrollIndicator.tsx` | Reusable for scroll cue (or inline equivalent) |
| **REMOVE FROM PAGE** | `ValuePropsSection.tsx` | No longer in homepage layout |
| **REMOVE FROM PAGE** | `ChatPreviewSection.tsx` | Replaced by conversation flow |
| **REMOVE FROM PAGE** | `TraitsSection.tsx` | Trait info now in carousel embed |
| **REMOVE FROM PAGE** | `ArchetypeTeaserSection.tsx` | Replaced by blurred previews |
| **REMOVE FROM PAGE** | `DiscoverSection.tsx` | No longer in homepage layout |
| **REMOVE FROM PAGE** | `FinalCTASection.tsx` | Replaced by sticky chat bar |
| **REMOVE FROM PAGE** | `WaveDivider.tsx` | No wave dividers in conversation design |
| **REMOVE FROM PAGE** | Bubbles animation | No floating bubbles in conversation design |
| **CREATE** | `DepthScrollProvider.tsx` | Scroll state context |
| **CREATE** | `ConversationFlow.tsx` | Conversation container with thread line |
| **CREATE** | `MessageGroup.tsx` | Scroll-reveal wrapper |
| **CREATE** | `ChatBubble.tsx` | Nerin/User bubble (new design, replaces old ChatBubble) |
| **CREATE** | `TraitCarouselEmbed.tsx` | 5-card swipeable carousel |
| **CREATE** | `ResultPreviewEmbed.tsx` | Shared embed wrapper with CTA |
| **CREATE** | `OceanCodePreview.tsx` | OCEAN code content |
| **CREATE** | `RadarChartPreview.tsx` | SVG radar chart |
| **CREATE** | `FacetBarsPreview.tsx` | 30-facet bar grid |
| **CREATE** | `ShareCardPreview.tsx` | Social share card mockup |
| **CREATE** | `ComparisonTeaserPreview.tsx` | Overlaid radar comparison teaser |
| **CREATE** | `DepthMeter.tsx` | Fixed left indicator |
| **CREATE** | `ChatInputBar.tsx` | Sticky bottom bar |

### File Structure

```
apps/front/src/
  routes/
    index.tsx                              # REWRITE: conversation-driven layout
  components/
    Logo.tsx                               # KEEP
    Header.tsx                             # KEEP
    NerinAvatar.tsx                        # KEEP (not used on homepage)
    ThemeProvider.tsx                       # KEEP
    home/
      DepthScrollProvider.tsx              # NEW: scroll state context
      HeroSection.tsx                      # REWRITE: two-column hero
      ConversationFlow.tsx                 # NEW: conversation container
      MessageGroup.tsx                     # NEW: scroll-reveal wrapper
      ChatBubble.tsx                       # REWRITE: Nerin/User bubbles (new design)
      TraitCarouselEmbed.tsx               # NEW: 5-card swipeable carousel
      ResultPreviewEmbed.tsx               # NEW: shared embed wrapper with CTA
      OceanCodePreview.tsx                 # NEW: OCEAN code content
      RadarChartPreview.tsx                # NEW: SVG radar
      FacetBarsPreview.tsx                 # NEW: 30-facet grid
      ShareCardPreview.tsx                 # NEW: social share card mockup
      ComparisonTeaserPreview.tsx          # NEW: overlaid radar comparison teaser
      DepthMeter.tsx                       # NEW: fixed left indicator
      ChatInputBar.tsx                     # NEW: sticky bottom bar
      ScrollIndicator.tsx                  # KEEP
      # Old components (keep files, remove from page):
      ValuePropsSection.tsx                # UNUSED on homepage
      ChatPreviewSection.tsx               # UNUSED on homepage
      TraitsSection.tsx                    # UNUSED on homepage
      TraitCard.tsx                        # UNUSED on homepage
      ArchetypeTeaserSection.tsx           # UNUSED on homepage
      DiscoverSection.tsx                  # UNUSED on homepage
      FinalCTASection.tsx                  # UNUSED on homepage
      WaveDivider.tsx                      # UNUSED on homepage
    ocean-shapes/                          # KEEP: all shapes
```

### Existing Nav Integration

The global header (`Header.tsx`) already has a theme toggle and uses Tailwind `dark:` variants for styling. The depth scroll system integrates seamlessly:

- **Header automatically adapts:** Because DepthScrollProvider toggles the `dark` class on `<html>`, the Header's existing `dark:bg-*`, `dark:text-*`, `dark:border-*` classes activate automatically as you scroll into dark zones. No Header modifications needed for depth scroll.
- **Theme toggle coordination:** The Header's theme toggle calls `setTheme()` from `useTheme()`. DepthScrollProvider reads `appTheme` from the same hook to select its zone palette.
- **Layered architecture:** DepthScrollProvider does NOT replace ThemeProvider — it layers on top. ThemeProvider manages user preference persistence + `dark` class for non-homepage pages. DepthScrollProvider overrides the `dark` class based on scroll position when on the homepage.

**Key detail:** When DepthScrollProvider unmounts (user navigates away from homepage), it must restore the `dark` class to match the user's actual theme preference (via cleanup in `useEffect`).

### OKLCH Color System Note

The existing `globals.css` uses OKLCH format for all tokens. The depth scroll system uses raw RGB interpolation (which is simpler for smooth animation). The interpolated colors are applied directly to `document.body.style.background` as `rgb()` values — this is intentional and correct. The CSS custom property overrides use raw values or `rgba()` functions, not OKLCH.

### Anti-Patterns

```
DO NOT use a carousel library (react-slick, embla, etc.) — CSS scroll-snap is sufficient
DO NOT connect the conversation to any backend — all content is hardcoded
DO NOT modify ocean-shapes/ components — they are stable from Story 7.4
DO NOT use blended gradients for the hero background — hero has discrete shapes with breathing animation
DO NOT add new npm packages — all tools are already available
DO NOT skip data-slot attributes on component roots
DO NOT use animations without motion-safe: prefix or prefers-reduced-motion check
DO NOT apply background color transitions via Tailwind classes — use direct style manipulation for smooth interpolation
DO NOT make the chat input bar functional — it's decorative, clicking navigates to /chat
DO NOT use inline event handlers in JSX — use useCallback or event handler functions
DO NOT forget the vertical thread line on the left of the conversation (1.5px, with gradient fade)
```

### Testing Approach

No unit tests needed — this is a UI/visual story. Verification is visual:
1. `pnpm dev --filter=front` — check hero renders with two-column layout + breathing shapes
2. Scroll through conversation — verify messages reveal sequentially
3. Check trait carousel — swipe through 5 cards, dot navigation syncs
4. Check result previews — verify OCEAN code, radar chart, facet bars display clearly with CTA pills below
5. Check share card preview — verify archetype name, geometric signature, trait badges, brand mark
6. Check comparison teaser — verify two overlaid radar charts, legend, "Coming soon" badge
7. Check depth meter — fill tracks scroll, pips highlight, zone name updates
6. Check sticky chat bar — appears at ~35% scroll, disappears at top
7. Toggle dark mode — verify static dark background, all elements adapt
8. Toggle light mode — verify scroll-driven light→dark transition
9. Check mobile responsiveness at 375px, 768px, 900px, 1024px, 1440px
10. Verify `prefers-reduced-motion` — disable animations in browser devtools
11. `pnpm build` — 0 errors
12. `pnpm lint` — no new warnings
13. `pnpm test:run` — no regressions

### Project Structure Notes

- All modifications stay within `apps/front/src/components/home/`, `apps/front/src/routes/index.tsx`, `apps/front/src/components/ThemeToggle.tsx`, `apps/front/src/components/MobileNav.tsx`, and `packages/ui/src/styles/globals.css`
- No new packages required
- No backend changes
- No new routes
- Imports from `ocean-shapes/` are within the same app
- Imports from `@workspace/domain` for facet constants (trait carousel)
- ThemeProvider integration: DepthScrollProvider **reads** user theme preference and **writes** `dark` class on `<html>` to drive Tailwind dark variants based on scroll position

### Previous Story Intelligence

**From Story 7.8 OLD (Color Block Composition) — done:**
- HeroSection had 3 geometric color block divs (circle, triangle, rectangle) — will be replaced with breathing OCEAN shapes
- TraitCard was modified to accept `shapeElement: ReactNode` — this pattern is useful
- `pnpm build` verified 0 errors, `pnpm lint` no warnings, tests pass (255 tests)
- Recent commit `8c472b7 refactor: new home page` may have started this work

**From Story 7.7 (Illustration & Icon System) — done:**
- NerinAvatar component exists with confidence-based CSS tiers
- Ocean icon set created (8 icons)
- NOT used on the homepage (homepage uses simple "N" gradient circle, not full avatar)

**From Story 7.6 (Global Header) — done:**
- Header.tsx has theme toggle using `useTheme()` hook
- Logo.tsx uses OceanShapeSet at size={20}
- All semantic tokens used consistently

**From Story 7.5 (Trait Colors) — done:**
- All trait CSS tokens in OKLCH format in globals.css
- `getTraitColor()`, `getTraitGradient()`, `getTraitAccentColor()` utilities available
- Trait colors used in carousel cards

**From Story 7.4 (OCEAN Shapes) — done:**
- 5 SVG shape components accept `size`, `className`, optional `color` props
- OceanShapeSet renders all 5 inline — used in hero for breathing animation
- Shapes use `var(--trait-*)` CSS variables automatically

**From Story 7.3 (Dark Mode) — done:**
- ThemeProvider wraps app in `__root.tsx`
- `useTheme()` hook returns `{ theme, setTheme, systemTheme }`
- localStorage key: `big-ocean-theme`
- Flash prevention script in head

**From Story 7.1 (Design Tokens) — done:**
- Complete psychedelic palette in globals.css (OKLCH)
- Gradient tokens: celebration, progress, surface-glow
- Depth zone variables defined but currently used for static section backgrounds
- Spacing and radius scale tokens

### Git Intelligence

```
8c472b7 refactor: new home page  ← Most recent, may have partial work
e984962 feat(story-7-15): auth form psychedelic brand redesign + accessibility fixes (#45)
394b67a Feat/story 4 7 message count progress indicator (#44)
```

The `8c472b7` commit suggests the rearchitecture may have started. Check the current state of `index.tsx` and home components before beginning work — some of the new components may already exist.

### References

- [Design Prototype: direction-combined.html](/_bmad-output/ux-explorations/homepage-directions/direction-combined.html) — Authoritative HTML/CSS/JS prototype for the conversation-driven design
- [Epic 7 Spec: Story 7.8](/_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md#story-78-conversation-driven-homepage-with-depth-scroll) — Full acceptance criteria and technical details
- [FRONTEND.md](/docs/FRONTEND.md) — data-slot conventions, component patterns, CVA usage
- [globals.css](/packages/ui/src/styles/globals.css) — Token system (OKLCH colors, depth zones, animations)
- [Current index.tsx](/apps/front/src/routes/index.tsx) — Current page layout (to be rewritten)
- [OceanShapeSet](/apps/front/src/components/ocean-shapes/OceanShapeSet.tsx) — Brand mark component for hero
- [ThemeProvider](/apps/front/src/components/ThemeProvider.tsx) — Theme context to integrate with


## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

- Lint error: `aria-label` on plain `<div>` in DepthMeter.tsx — fixed by changing to semantic `<nav>` element
- Build verified: `pnpm build --filter=front` — 0 errors
- Lint verified: `pnpm lint` — only pre-existing warning (unused `highlightQuote` param in TherapistChat.tsx)
- Tests verified: `pnpm test:run` — 165 front + API tests all pass

### Completion Notes List

- All 13 ACs addressed across 12 tasks (+ 6b, 6c sub-tasks)
- Complete homepage rearchitecture from section-based to conversation-driven layout
- DepthScrollProvider implements scroll-driven light→dark color interpolation with 5 zones
- Three theme modes: auto (scroll-driven), dark (static navy), light (same as auto)
- 13 hardcoded conversation messages with 6 embedded interactive previews
- TraitCarouselEmbed replaced with TraitStackEmbed: interactive conversational trait explorer with Version A copy deck (Nerin voice), clickable trait cards spawning user+Nerin message pairs with 30 facet descriptions
- Design artifacts: `_bmad-output/ux-explorations/trait-stack-copy-deck.md` (copy), `_bmad-output/ux-explorations/trait-stack-mockup.html` (mockup)
- Theme toggle order changed from system→light→dark to system→dark→light in both ThemeToggle.tsx and MobileNav.tsx
- CSS custom properties added to globals.css for depth scroll tokens (bubble-bg, embed-bg, etc.)
- breathe and bob keyframe animations added to globals.css
- All components use data-slot attributes per FRONTEND.md conventions
- motion-safe/motion-reduce accessibility patterns applied to all animations
- Hero uses CSS div shapes (not SVG components) for responsive sizing
- OceanCodeEmbed, RadarEmbed, FacetBarsEmbed are co-located in ResultPreviewEmbed.tsx (not separate files as originally planned — simpler, avoids unnecessary file proliferation)
- Old section components (ValuePropsSection, ChatPreviewSection, etc.) kept in codebase but removed from page layout

### File List

**Created:**
- `apps/front/src/components/home/DepthScrollProvider.tsx` — Scroll state context with color interpolation
- `apps/front/src/components/home/ConversationFlow.tsx` — Conversation container with thread line
- `apps/front/src/components/home/MessageGroup.tsx` — IntersectionObserver scroll-reveal wrapper
- `apps/front/src/components/home/TraitStackEmbed.tsx` — Interactive conversational trait explorer (replaces TraitCarouselEmbed)
- `apps/front/src/components/home/ResultPreviewEmbed.tsx` — Shared embed wrapper + OceanCodeEmbed, RadarEmbed, FacetBarsEmbed
- `apps/front/src/components/home/ShareCardPreview.tsx` — Social share card mockup
- `apps/front/src/components/home/ComparisonTeaserPreview.tsx` — Overlaid radar comparison teaser
- `apps/front/src/components/home/DepthMeter.tsx` — Fixed left-side depth indicator
- `apps/front/src/components/home/ChatInputBar.tsx` — Sticky bottom CTA bar

**Rewritten:**
- `apps/front/src/routes/index.tsx` — Complete homepage rewrite with conversation-driven layout
- `apps/front/src/components/home/HeroSection.tsx` — Two-column layout with CSS shapes + breathing animation
- `apps/front/src/components/home/ChatBubble.tsx` — New Nerin/User variants with children prop

**Modified:**
- `packages/ui/src/styles/globals.css` — Added depth scroll CSS tokens + breathe/bob keyframes
- `apps/front/src/components/ThemeToggle.tsx` — Changed theme cycle order to system→dark→light
- `apps/front/src/components/MobileNav.tsx` — Changed theme cycle order to system→dark→light

## Change Log

- 2026-02-14: Resumed implementation — verified all subtasks complete via code inspection + build/lint/test verification. Marked all subtasks [x]. Build: 0 errors, Lint: no new warnings, Tests: 319 pass (154 API + 165 front). Story ready for review.
- 2026-02-14: Implemented sprint change proposal (homepage-copy-rewrite) — rewrote conversation flow from 13 feature-focused message groups to 8 emotional beats. Removed OCEAN Code, Radar Chart, Share Card, and Comparison Teaser embeds from homepage. Kept TraitStackEmbed and FacetBarsEmbed. Updated copy to focus on emotional journey (Introduction → Safety → Nuance → Value → Depth → Invitation). Build: 0 errors, Lint: clean, Tests: 319 pass. Story remains in review status.
