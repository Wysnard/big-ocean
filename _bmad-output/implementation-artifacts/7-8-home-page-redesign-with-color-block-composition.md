# Story 7.8: Home Page Redesign with Color Block Composition

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want **the home page to feature bold geometric color block compositions that instantly communicate big-ocean's psychedelic personality**,
So that **I immediately understand this is not another corporate personality test — it's vibrant, alive, and celebrates self-discovery**.

## Acceptance Criteria

1. **Given** I visit the home page **When** the hero section loads **Then** I see bold geometric color blocks (not blended gradients): hard-edged shapes of Electric Pink, Teal, and Orange **And** OCEAN geometric shapes serving as the color block forms **And** asymmetric layout (dominant 50-60%, secondary 25-30%, accent 10-15%) **And** "big-[shapes]" logo centered on color blocks **And** clear value proposition in Space Grotesk display type **And** primary CTA button with brand styling **And** the design works in both light and dark modes **And** dark mode hero uses Teal dominant, Navy secondary, Gold accent

2. **Given** I scroll past the hero **When** I view the value props section **Then** I see 3 cards explaining differentiation: "Conversation, Not Quiz", "30 Facets, Not 5", "AI That Adapts"

3. **Given** I view the "Meet Nerin" section **When** the chat preview appears **Then** I see a realistic chat interface mockup with Nerin avatar and sample conversation

4. **Given** I view the Big Five traits section **When** trait cards are displayed **Then** each card uses its trait color and geometric shape **And** cards are in asymmetric bento layout (Openness card larger) **And** hover states reveal trait gradient and facet preview

5. **Given** I view the results teaser section **When** the blurred archetype preview displays **Then** I see a preview of what results look like with blurred details **And** CTA to start assessment

6. **Given** I view the final CTA section **When** the section renders **Then** I see "Takes 30 min . Free . No account needed" messaging **And** prominent CTA button

7. **Given** I view the page on mobile **When** the layout adapts **Then** hero section is full viewport with readable text **And** bento grids collapse to single column **And** CTA buttons are full-width and prominent (min 44px height)

8. **Given** I view the page with `prefers-reduced-motion` **When** animations would normally trigger **Then** all animations are disabled or replaced with static states

## Tasks / Subtasks

- [x] Task 1: Redesign HeroSection with color block composition (AC: #1, #7, #8)
  - [x] Replace current gradient-based hero with hard-edged geometric color blocks
  - [x] Light mode: Electric Pink dominant circle (50-60%), Teal triangle (25-30%), Orange rectangle accent (10-15%), Warm Cream negative space
  - [x] Dark mode: Teal dominant shape (50-60%), Navy secondary (25-30%), Gold accent (10-15%), Abyss Navy background
  - [x] Use OCEAN shapes (from `ocean-shapes/`) as the color block forms themselves — large-scale shapes positioned absolutely
  - [x] Replace `<Waves>` lucide icon + "Big Ocean" gradient text with `<Logo />` component (already uses "big-" + OceanShapeSet)
  - [x] Update headline to Space Grotesk `display-xl` size (3rem) with value proposition
  - [x] Update subtitle copy and CTA text per epic spec
  - [x] Update duration copy: "Takes 30 min" (not "20-minute")
  - [x] Keep `ScrollIndicator` component
  - [x] Ensure color blocks are absolutely positioned behind content
  - [x] `data-slot="hero-section"` preserved
  - [x] `motion-safe:` prefix on all animated elements
  - [x] Mobile: color blocks scale proportionally, text remains readable

- [x] Task 2: Update ValuePropsSection with epic-specified content (AC: #2)
  - [x] Update card titles: "Conversation, Not Quiz", "30 Facets, Not 5", "AI That Adapts"
  - [x] Update descriptions to match epic spec messaging
  - [x] Keep existing fade-in-on-scroll animation
  - [x] Keep existing card styling (border, bg-card, rounded-xl)
  - [x] `data-slot="value-props-section"` preserved

- [x] Task 3: Update ChatPreviewSection with Nerin avatar integration (AC: #3)
  - [x] Import and use `NerinAvatar` component if Story 7.7 is complete, otherwise use current "N" placeholder
  - [x] Verify chat preview shows realistic Nerin conversation mockup
  - [x] Ensure section works in both light and dark modes
  - [x] `data-slot="chat-preview-section"` preserved

- [x] Task 4: Enhance TraitsSection with OCEAN shape integration (AC: #4)
  - [x] Import OCEAN shape components (OceanCircle, OceanHalfCircle, etc.) into TraitCard
  - [x] Replace lucide icons with corresponding OCEAN geometric shapes per trait
  - [x] Keep asymmetric bento layout (Openness card `isLarge`)
  - [x] Add hover state: reveal trait gradient background and facet list preview
  - [x] Each card uses its trait CSS variable color (`var(--trait-*)`)
  - [x] `data-slot="traits-section"` preserved

- [x] Task 5: Update ArchetypeTeaserSection as "Results Teaser" (AC: #5)
  - [x] Verify blurred archetype preview with CTA overlay is working
  - [x] Ensure section uses brand tokens and works in both modes
  - [x] `data-slot="archetype-teaser-section"` preserved

- [x] Task 6: Update FinalCTASection with epic-specified copy (AC: #6)
  - [x] Update copy: "Takes 30 min · Free · No account needed"
  - [x] Ensure CTA navigates to `/chat`
  - [x] `data-slot="final-cta-section"` preserved

- [x] Task 7: Add WaveDivider components between major sections (AC: #1)
  - [x] Verify WaveDivider appears between all major depth zone transitions
  - [x] WaveDivider uses depth zone CSS variables for seamless color transitions
  - [x] Both "gentle" and "deep" variants available

- [x] Task 8: Mobile responsiveness pass (AC: #7)
  - [x] Hero: full viewport height on mobile, text readable, color blocks scale
  - [x] Value props: collapse to single column
  - [x] Trait cards: collapse to single column (Openness card still larger on tablet+)
  - [x] CTA buttons: full-width on mobile, minimum 44px height
  - [x] All touch targets >= 44px
  - [x] Proper padding adjustments for mobile (px-4 vs px-6)

- [x] Task 9: Accessibility and animation pass (AC: #8)
  - [x] All `motion-safe:` prefixes on animations
  - [x] `prefers-reduced-motion` respected — no scroll-triggered animations, static final states
  - [x] `aria-hidden="true"` on all decorative color block shapes
  - [x] Semantic HTML: proper heading hierarchy (h1 in hero, h2 in sections)
  - [x] WCAG AA contrast for all text on color block backgrounds
  - [x] Decorative bubble elements marked `aria-hidden`

- [x] Task 10: Build verification
  - [x] `pnpm build` — 0 errors
  - [x] `pnpm lint` — no new warnings
  - [x] `pnpm test:run` — no regressions

## Dev Notes

### CRITICAL: This is a REDESIGN of Existing Components, Not a Rewrite

The home page already exists with 7 section components, WaveDivider, depth zones, and bubbles. This story **enhances** the existing implementation to match the epic spec's color block composition vision. Do NOT delete and recreate components — modify them in place.

### What Already Exists (DO NOT Recreate)

All of these components exist in `apps/front/src/components/home/`:

| Component | File | Status |
|-----------|------|--------|
| HeroSection | `HeroSection.tsx` | MODIFY — replace gradients with color blocks, update copy |
| ValuePropsSection | `ValuePropsSection.tsx` | MODIFY — update card titles/descriptions |
| ChatPreviewSection | `ChatPreviewSection.tsx` | MINOR UPDATE — verify Nerin avatar |
| TraitsSection | `TraitsSection.tsx` | MODIFY — add OCEAN shapes to TraitCard |
| TraitCard | `TraitCard.tsx` | MODIFY — replace lucide icons with OCEAN shapes |
| ArchetypeTeaserSection | `ArchetypeTeaserSection.tsx` | MINOR UPDATE — verify styling |
| DiscoverSection | `DiscoverSection.tsx` | KEEP AS-IS or MINOR UPDATE |
| FinalCTASection | `FinalCTASection.tsx` | MODIFY — update copy |
| WaveDivider | `WaveDivider.tsx` | KEEP AS-IS |
| ChatBubble | `ChatBubble.tsx` | KEEP AS-IS |
| ScrollIndicator | `ScrollIndicator.tsx` | KEEP AS-IS |

**Route file:** `apps/front/src/routes/index.tsx` — page layout with depth zones and bubble animations

### Color Block Composition Pattern (The Core Change)

The hero section currently uses **blended gradients** (pink-to-cream radial gradients). The epic requires **hard-edged geometric color blocks** — distinct, poster-like shapes with sharp boundaries.

**Current hero (REPLACE):**
```tsx
// Blended gradient overlays — NOT what the epic wants
<div className="bg-[linear-gradient(180deg,_#FFE0EC_0%,_#FFE8D8_30%,...)]" />
<div className="bg-[radial-gradient(ellipse_60%_50%_at_50%_-5%,...)]" />
<div className="animate-[caustic_8s_...] bg-[radial-gradient(ellipse_at_30%_40%,...)]" />
```

**Target hero (IMPLEMENT):**
```tsx
// Hard-edged color blocks using OCEAN shapes at large scale
<div className="absolute inset-0 overflow-hidden" aria-hidden="true">
  {/* Dominant block: large circle shape */}
  <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[80%] rounded-full bg-primary opacity-90" />
  {/* Secondary block: triangle-ish shape */}
  <div className="absolute bottom-0 left-0 w-[35%] h-[50%] bg-tertiary"
       style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 0)' }} />
  {/* Accent block: small rectangle */}
  <div className="absolute top-[30%] right-[20%] w-[15%] h-[25%] bg-secondary rotate-12 rounded-lg" />
</div>
```

**Dark mode blocks:**
- Dominant: `bg-primary` (Teal `#00D4C8` in dark)
- Secondary: `bg-[var(--depth-mid)]` or `bg-card` (Deep Navy)
- Accent: `bg-secondary` (Gold `#FFB830` in dark)

The semantic tokens (`bg-primary`, `bg-secondary`, `bg-tertiary`) automatically switch between light and dark mode, so the color personality shift happens naturally.

### Logo Integration in Hero

The current hero uses a lucide `<Waves>` icon + "Big Ocean" gradient text. Replace with the existing `<Logo />` component which renders "big-" + `OceanShapeSet`:

```tsx
// Current (REPLACE):
<Waves className="mx-auto mb-4 h-20 w-20 text-primary" />
<h1>Big Ocean</h1>

// Target:
import { Logo } from "../Logo";
// Use Logo at hero-appropriate size, or render inline:
<span className="text-4xl font-heading font-bold">big-</span>
<OceanShapeSet size={36} />
// Then add display-xl headline below
```

**Note:** The `Logo` component at `apps/front/src/components/Logo.tsx` renders "big-" (text-xl font-heading font-bold) + `OceanShapeSet size={20}`. For the hero, you may want a larger version. Consider creating a variant or using OceanShapeSet directly with a larger size prop.

### OCEAN Shapes in Trait Cards

Currently, TraitsSection uses lucide icons (Lightbulb, Zap, Heart, Handshake, TrendingUp). Replace with OCEAN geometric shapes:

| Trait | Current Icon | Replace With |
|-------|-------------|--------------|
| Openness | `Lightbulb` | `OceanCircle` |
| Conscientiousness | `Zap` | `OceanHalfCircle` |
| Extraversion | `Heart` | `OceanRectangle` |
| Agreeableness | `Handshake` | `OceanTriangle` |
| Neuroticism | `TrendingUp` | `OceanDiamond` |

Import from: `apps/front/src/components/ocean-shapes/`

Each shape component accepts `size` (number) and `className` props. They use `var(--trait-*)` CSS variables for auto light/dark colors.

### Depth Zone System (Already Implemented)

The page uses 4 depth zones defined in `globals.css`:
```css
--depth-surface: ...  /* Warmest (hero) */
--depth-shallows: ... /* Value props, chat preview */
--depth-mid: ...      /* Traits, archetype teaser */
--depth-deep: ...     /* Discover, final CTA */
```

These create a credibility gradient from psychedelic (top) → scientific (bottom). **Keep this system**. The color block composition applies specifically to the hero section (surface zone).

### Value Prop Copy Updates

Epic spec requires specific messaging. Update from current to:

| # | Current Title | Epic Title |
|---|--------------|------------|
| 1 | "Deep Conversation, Not Surface Questions" | "Conversation, Not Quiz" |
| 2 | "30 Facets Deep" | "30 Facets, Not 5" |
| 3 | "An AI That Dives With You" | "AI That Adapts" |

Keep description content similar but align messaging.

### Duration Copy

Epic spec says "Takes 30 min" but current copy says "20-minute deep dive". Update ALL references to say "30 min":
- Hero: "Takes 30 min · Free · No account needed"
- Final CTA: "Takes 30 min · Free · No account needed"

### OKLCH Color System

All color tokens in `globals.css` use OKLCH format. When referencing colors in code:
- Use CSS variables: `var(--primary)`, `var(--trait-openness)`, etc.
- Use Tailwind semantic classes: `bg-primary`, `text-foreground`, etc.
- NEVER use raw hex values in components
- The CSS variables handle light/dark mode switching automatically

### Existing Animation System

These keyframes are already defined in `globals.css` and can be used:
- `wave` — gentle Y translation + rotation
- `caustic` — background position shift (shimmer)
- `bubble` — floating upward animation
- `fadeInUp` — Y translate + opacity
- `float` — vertical float motion
- `shape-reveal` — scale + opacity reveal

Use `motion-safe:animate-[name_duration_timing_iteration]` format.

### NerinAvatar Integration (Conditional)

Story 7.7 creates the `NerinAvatar` component. If it exists when implementing this story:
- Import from `apps/front/src/components/NerinAvatar`
- Use in ChatPreviewSection to replace "N" circle placeholder
- If 7.7 is not yet implemented, keep the current "N" placeholder — it still works

### Data Attributes (per FRONTEND.md)

Every component root MUST include `data-slot` attributes. All existing sections already have them:

| Component | Attribute |
|-----------|-----------|
| HeroSection | `data-slot="hero-section"` |
| ValuePropsSection | `data-slot="value-props-section"` |
| ChatPreviewSection | `data-slot="chat-preview-section"` |
| TraitsSection | `data-slot="traits-section"` |
| ArchetypeTeaserSection | `data-slot="archetype-teaser-section"` |
| DiscoverSection | `data-slot="discover-section"` |
| FinalCTASection | `data-slot="final-cta-section"` |

Any NEW sub-components must also get `data-slot` attributes.

### File Structure

```
apps/front/src/
  routes/
    index.tsx                          # MODIFY: verify depth zone layout
  components/
    Logo.tsx                           # EXISTING: "big-" + OceanShapeSet
    home/
      HeroSection.tsx                  # MODIFY: color blocks, logo, copy
      ValuePropsSection.tsx            # MODIFY: update card copy
      ChatPreviewSection.tsx           # MINOR: verify Nerin avatar
      TraitsSection.tsx                # MODIFY: OCEAN shapes replace icons
      TraitCard.tsx                    # MODIFY: accept shape component
      ArchetypeTeaserSection.tsx       # MINOR: verify styling
      DiscoverSection.tsx              # KEEP or MINOR
      FinalCTASection.tsx              # MODIFY: update copy
      WaveDivider.tsx                  # KEEP AS-IS
      ChatBubble.tsx                   # KEEP AS-IS
      ScrollIndicator.tsx              # KEEP AS-IS
    ocean-shapes/                      # EXISTING: import shapes from here
      OceanCircle.tsx
      OceanHalfCircle.tsx
      OceanRectangle.tsx
      OceanTriangle.tsx
      OceanDiamond.tsx
      OceanShapeSet.tsx
      index.ts
```

### Anti-Patterns

```
DO NOT delete and recreate section components — modify existing ones
DO NOT use blended gradients for the hero (use hard-edged color blocks)
DO NOT use hard-coded hex colors — use CSS variables and semantic Tailwind classes
DO NOT use raw color classes (bg-pink-500, bg-teal-600) — use bg-primary, bg-secondary, bg-tertiary
DO NOT add new npm packages — all tools are already available
DO NOT skip data-slot attributes on component roots
DO NOT use animations without motion-safe: prefix
DO NOT place text directly on vibrating complementary color pairs (accessibility)
DO NOT forget dark mode — test both modes for every change
DO NOT change the depth zone system — it already works correctly
DO NOT modify ocean-shapes/ components — they are stable from Story 7.4
```

### Testing Approach

No unit tests needed — this is a UI/visual story. Verification is visual:
1. `pnpm dev --filter=front` — check hero renders with color blocks
2. Toggle dark mode — verify color personality shift (pink → teal dominant)
3. Check mobile responsiveness at 375px, 768px, 1024px, 1440px widths
4. Verify value prop cards show updated copy
5. Check trait cards show OCEAN shapes instead of lucide icons
6. Verify all sections have proper WaveDivider transitions
7. Check `prefers-reduced-motion` — disable animations in browser dev tools
8. Verify no hard-coded colors (`grep -r "bg-gray" --include="*.tsx"` should find nothing in home/)
9. `pnpm build` — 0 errors
10. `pnpm lint` — no new warnings
11. `pnpm test:run` — no regressions

### Project Structure Notes

- All modifications stay within `apps/front/src/components/home/` and `apps/front/src/routes/index.tsx`
- No new packages required
- No backend changes
- No new routes
- Imports from `ocean-shapes/` and potentially `NerinAvatar` are within the same app

### Previous Story Intelligence

**From Story 7.7 (Illustration & Icon System) — ready-for-dev:**
- NerinAvatar component will be created with confidence-based CSS tiers
- OceanDecorative component will provide wave, bubble, coral, seaweed SVGs
- Ocean icon set (8 icons) for brand-specific navigation
- ChatPreviewSection will be updated to use NerinAvatar
- **If 7.7 completes before 7.8 dev starts:** Use NerinAvatar in ChatPreviewSection
- **If 7.7 is not complete:** Keep "N" placeholder, it's functional

**From Story 7.6 (Global Header) — done:**
- Logo.tsx uses `OceanShapeSet` at `size={20}` with `font-heading tracking-tight`
- All header components use semantic tokens exclusively
- Pattern to follow: "big-" text + OceanShapeSet inline
- `data-slot` attributes on all component parts

**From Story 7.5 (Trait & Facet Colors) — done:**
- All trait CSS tokens use OKLCH format in `globals.css`
- Dark mode trait variants are brighter for readability
- 30 facet colors defined with lightness-step algorithm
- `getTraitColor()`, `getTraitGradient()`, `getTraitAccentColor()` utilities available

**From Story 7.4 (OCEAN Shapes) — review:**
- 5 SVG shape components in `ocean-shapes/` directory
- Each shape uses `var(--trait-*)` CSS variables for auto light/dark
- OceanShapeSet renders all 5 inline with configurable size
- Pattern: SVG components accept `size`, `className`, optional `color` props

**From Story 7.1 (Design Tokens) — done:**
- Complete psychedelic palette defined in globals.css
- Gradient tokens: celebration, progress, surface-glow
- Depth zone variables for page progression
- Spacing and radius scale tokens

### Git Intelligence

Recent commits show Epic 7 progression:
```
48ca552 feat: Global header with geometric logo, auth, theme toggle & mobile nav (Story 7.6)
95741e1 fix: colors
00c78d9 chore: storybook dark/light mode
0757354 feat: Big Five trait and facet visualization colors (Story 7.5) (#34)
69f3707 feat: OCEAN geometric identity system and brand mark (Story 7.4) (#33)
```

Pattern: Feature PRs use `feat:` conventional commits with story reference. Build/lint/test verified before PR.

### References

- [Epic 7 Spec: Story 7.8](/_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md#story-78-home-page-redesign-with-color-block-composition) — Full acceptance criteria, color block rules, component structure
- [UX Spec: Color Block Composition](/_bmad-output/planning-artifacts/ux-design-specification/visual-design-foundation.md#hero--key-surfaces-color-block-composition) — Hard edges, asymmetric layout, shape-as-block principles
- [UX Spec: Credibility Gradient Pattern](/_bmad-output/planning-artifacts/ux-design-specification/visual-design-foundation.md#credibility-gradient-pattern) — Psychedelic → scientific depth zones
- [UX Spec: Color System](/_bmad-output/planning-artifacts/ux-design-specification/visual-design-foundation.md#color-system) — Light/dark palettes, gradients, accessibility
- [Story 7.4: OCEAN Shapes](/_bmad-output/implementation-artifacts/7-4-ocean-geometric-identity-system-and-brand-mark.md) — Shape component API and patterns
- [Story 7.6: Header](/_bmad-output/implementation-artifacts/7-6-global-header-with-geometric-logo-auth-theme-toggle-mobile-nav.md) — Logo integration pattern
- [FRONTEND.md](/docs/FRONTEND.md) — data-slot conventions, component patterns, CVA usage
- [globals.css](/packages/ui/src/styles/globals.css) — Complete token system (OKLCH colors, depth zones, animations)
- [Current HeroSection](/apps/front/src/components/home/HeroSection.tsx) — Current gradient-based hero to replace
- [Current index.tsx](/apps/front/src/routes/index.tsx) — Page layout with depth zones
- [OceanShapeSet](/apps/front/src/components/ocean-shapes/OceanShapeSet.tsx) — Brand mark component to use in hero
- [TraitCard](/apps/front/src/components/home/TraitCard.tsx) — Current card to modify with OCEAN shapes

## Dev Agent Record

### Agent Model Used

Claude Opus 4

### Debug Log References

None — clean implementation with no failures.

### Completion Notes List

- **Task 1**: Redesigned HeroSection — replaced 3 gradient overlay divs with 4 hard-edged geometric color block divs (circle, triangle, rectangle, accent circle). Replaced `<Waves>` lucide icon + gradient text with `OceanShapeSet` at hero scale (36px mobile, 44px desktop). Updated copy to "Takes 30 min · Free · No account needed". CTA button is full-width on mobile. Added `min-h-[80vh]` for mobile viewport height.
- **Task 2**: Updated ValuePropsSection card titles to "Conversation, Not Quiz", "30 Facets, Not 5", "AI That Adapts".
- **Task 3**: Verified — NerinAvatar already integrated in ChatPreviewSection by Story 7.7. No changes needed.
- **Task 4**: Replaced lucide icons with OCEAN geometric shapes in TraitCard. Changed TraitCard prop from `icon: LucideIcon` to `shapeElement: ReactNode`. Added facet preview on hover with trait-colored border pills. TraitsSection maps each trait to its OCEAN shape (Circle→O, HalfCircle→C, Rectangle→E, Triangle→A, Diamond→N).
- **Task 5**: Verified — ArchetypeTeaserSection already uses semantic tokens and brand styling. No changes needed.
- **Task 6**: Updated FinalCTASection duration copy from "20-minute" to "Takes 30 min".
- **Task 7**: Verified — WaveDividers already present between all 3 depth zone transitions with correct CSS variables.
- **Task 8**: Hero has `min-h-[80vh]` + `w-full sm:w-auto` CTA. All grids collapse to single column. Touch targets exceed 44px.
- **Task 9**: Added `aria-hidden="true"` to Bubbles component wrapper. Hero color blocks already have `aria-hidden`. All animations use `motion-safe:` prefix. Heading hierarchy: h1 hero, h2 sections.
- **Task 10**: `pnpm build` 0 errors, `pnpm lint` no new warnings, `pnpm test:run` 255 tests passed (139 API + 116 frontend).

### Change Log

- 2026-02-13: Story 7.8 implementation complete — home page redesigned with color block composition
- 2026-02-13: Code review fixes applied (9 issues found, 7 fixed):
  - CRITICAL: Fixed hero circle distortion — replaced `h-[70%] w-[55%]` with `aspect-square w-[60vmin]` so circle stays circular across all viewport aspect ratios
  - HIGH: All color blocks now use `vmin` units with `aspect-square`/`aspect-[3/4]` for consistent proportions across screen sizes
  - HIGH: Removed undocumented 4th accent shape (epic spec requires 3 blocks only)
  - HIGH: Added responsive breakpoints (sm/md/lg) to all color blocks for mobile, tablet, and desktop
  - HIGH: Added z-index layers (z-0, z-10, z-20) to control shape stacking order
  - HIGH: TraitsSection shapes now use responsive sizing (32px mobile, 40px desktop)
  - MEDIUM: ValuePropsSection now respects `prefers-reduced-motion` — skips fade-in animation
- 2026-02-13: Code review fix — shapes overlapping text:
  - CRITICAL: Content overlay div had no z-index while color block shapes had z-10/z-20, causing shapes to render ON TOP of text. Added `z-30` to content overlay so all text, buttons, and brand mark always render above the decorative shapes.

### File List

- `apps/front/src/components/home/HeroSection.tsx` — **MODIFIED**: Replaced gradient hero with geometric color blocks, OceanShapeSet brand mark, updated copy
- `apps/front/src/components/home/ValuePropsSection.tsx` — **MODIFIED**: Updated card titles to match epic spec
- `apps/front/src/components/home/TraitCard.tsx` — **MODIFIED**: Changed `icon: LucideIcon` prop to `shapeElement: ReactNode`, added facet preview on hover
- `apps/front/src/components/home/TraitsSection.tsx` — **MODIFIED**: Replaced lucide icons with OCEAN geometric shapes, added facet lists per trait
- `apps/front/src/components/home/FinalCTASection.tsx` — **MODIFIED**: Updated duration copy from "20-minute" to "30 min"
- `apps/front/src/routes/index.tsx` — **MODIFIED**: Added `aria-hidden` to Bubbles component wrapper
