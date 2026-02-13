# Story 7.9: Results Page Visual Redesign with Archetype Theming

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User viewing my assessment results**,
I want **the results page to feel immersive and themed around my unique archetype — with bold color, geometric shapes, and a psychedelic-to-scientific depth progression**,
So that **seeing my results feels like a celebration of self-discovery, not a clinical data readout**.

## Acceptance Criteria

1. **Given** I view my results page **When** the archetype hero section loads **Then** the hero uses my archetype's trait color as the dominant color (bold background, not white/slate) **And** my Geometric Personality Signature is prominently displayed **And** the archetype name uses `display-hero` typography (56-64px) **And** the archetype reveal animation plays (shapes appear sequentially)

2. **Given** I scroll through the results page **When** I move from hero to detail sections **Then** the page transitions from psychedelic (top) to scientific (bottom):
   - Hero: Maximum psychedelic — archetype color block, bold shapes
   - Trait Overview: Balanced — structured layout with trait colors
   - Facet Details: Scientific — clean grids, readable body type
   - Evidence: Precision — monospace scores, minimal decoration
   **And** WaveDivider components separate depth zones

3. **Given** I view trait and facet sections **When** scores are displayed **Then** each trait section uses its trait color and geometric OCEAN shape as section marker **And** OCEAN shapes serve as chart markers and section indicators **And** the existing TraitBar/FacetBreakdown components are restyled to use semantic tokens (no hard-coded slate colors)

4. **Given** I view the results on mobile **When** the layout adapts **Then** the archetype hero is full-width with readable text **And** trait sections stack vertically **And** all interactive elements are touch-friendly (>= 44px)

5. **Given** the page respects accessibility **When** `prefers-reduced-motion` is enabled **Then** the archetype reveal animation shows the instant final state (no stagger) **And** all other animations are suppressed

6. **Given** the page works in both themes **When** I toggle light/dark mode **Then** the archetype hero adapts (light: trait color as dominant, dark: deeper variant) **And** all trait/facet colors use the existing OKLCH tokens from globals.css **And** depth zone backgrounds use `--depth-surface`/`--depth-shallows`/`--depth-mid`/`--depth-deep`

## Tasks / Subtasks

- [x] Task 1: Refactor results route to component-based architecture (AC: all)
  - [x] Extract archetype hero section into `ArchetypeHeroSection.tsx` component
  - [x] Extract trait scores section into `TraitScoresSection.tsx` component
  - [x] Extract share profile section into `ShareProfileSection.tsx` component
  - [x] Keep results route as layout orchestrator with depth zone backgrounds
  - [x] Replace all hard-coded `dark`, `slate-*`, `gray-*`, `blue-*`, `purple-*` classes with semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`, etc.)
  - [x] Add `data-slot` attributes to all new component roots

- [x] Task 2: Create ArchetypeHeroSection with color block composition (AC: #1, #4, #5, #6)
  - [x] Create `apps/front/src/components/results/ArchetypeHeroSection.tsx`
  - [x] Accept props: `archetypeName`, `oceanCode5`, `archetypeColor`, `overallConfidence`, `isCurated`, `archetypeDescription`
  - [x] Dominant background: archetype's trait color (derived from `dominantTrait` prop via `getTraitColor()`)
  - [x] Display `GeometricSignature` prominently with `animate={true}`, `baseSize={48}`
  - [x] Archetype name: `font-display text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.05]` (display-hero scale)
  - [x] Show archetype description, OCEAN code (monospace), and confidence badge
  - [x] Color block composition: 3 geometric shapes (circle, triangle, rectangle) as decorative background blocks with `aria-hidden="true"`
  - [x] Full-width on mobile, centered max-width on desktop
  - [x] `data-slot="archetype-hero-section"`
  - [x] `prefers-reduced-motion`: GeometricSignature uses motion-safe/motion-reduce classes

- [x] Task 3: Restyle TraitBar to use semantic tokens and OCEAN shapes (AC: #3, #6)
  - [x] Import OCEAN shape components for each trait (Circle=O, HalfCircle=C, Rectangle=E, Triangle=A, Diamond=N)
  - [x] Replace the small color dot with the corresponding OCEAN shape (size ~20px)
  - [x] Ensure all colors use `getTraitColor()` utility + semantic tokens
  - [x] Verify TraitBar already uses semantic tokens (it does — `bg-card`, `border-border`, `text-foreground` etc.) — minimal changes needed
  - [x] Confirm dark mode works with existing OKLCH trait colors

- [x] Task 4: Restyle results route layout with depth zones (AC: #2, #6)
  - [x] Remove `className="dark"` forced dark mode — let theme toggle control it
  - [x] Remove all `bg-slate-*`, `bg-gradient-to-b from-slate-900` backgrounds
  - [x] Apply depth zone backgrounds to each section:
    - Hero zone: `bg-[var(--depth-surface)]`
    - Trait overview: `bg-[var(--depth-shallows)]`
    - Facet/evidence: `bg-[var(--depth-mid)]`
    - Actions/share: `bg-[var(--depth-deep)]`
  - [x] Add `WaveDivider` components between depth zones
  - [x] Replace all `bg-gradient-to-r from-blue-500 to-purple-500` button styles with `bg-primary text-primary-foreground`
  - [x] Replace all `text-white`, `text-gray-*`, `text-slate-*` with semantic tokens

- [x] Task 5: Restyle empty/loading/error states (AC: #6)
  - [x] Replace dark slate backgrounds with `bg-background`
  - [x] Replace gradient buttons with semantic `bg-primary`
  - [x] Replace `text-white` / `text-gray-400` with `text-foreground` / `text-muted-foreground`
  - [x] Use `Loader2` with `text-primary` instead of `text-blue-400`

- [x] Task 6: Update ArchetypeCard to use semantic tokens (AC: #3, #6)
  - [x] Replace `bg-slate-800/80`, `border-slate-700/50`, `text-white`, `text-slate-*` with semantic tokens
  - [x] Add `data-slot="archetype-card"` alongside existing `data-testid`
  - [x] Add GeometricSignature display within the card

- [x] Task 7: Mobile responsiveness verification (AC: #4)
  - [x] Hero: full-width, `display-hero` scales down on mobile (`text-[2.5rem] md:text-[3.5rem] lg:text-[4rem]`)
  - [x] Trait sections: single column stack
  - [x] All buttons: `min-h-11` (44px touch target)
  - [x] Verified responsive classes at mobile/tablet/desktop breakpoints

- [x] Task 8: Build verification (AC: all)
  - [x] `pnpm build` — 0 errors
  - [x] `pnpm lint` — no new warnings (1 pre-existing warning in EvidencePanel)
  - [x] `pnpm test:run` — 135 frontend + 139 API tests passing, no regressions
  - [x] Semantic tokens ensure both light and dark modes work via CSS variables

### Review Follow-ups (AI)

- [ ] [AI-Review][MEDIUM] `TraitScoresSection` duplicates `TraitBar`/`FacetBreakdown` logic inline instead of composing existing components — consider refactoring to use `TraitBar` + `FacetBreakdown` with an `onViewEvidence` callback added to `FacetBreakdown` [apps/front/src/components/results/TraitScoresSection.tsx]
- [ ] [AI-Review][MEDIUM] `FacetBreakdown` still has disabled placeholder "View Evidence" button while `TraitScoresSection` has a working one — add `onViewEvidence` prop to `FacetBreakdown` for parity [apps/front/src/components/results/FacetBreakdown.tsx:125-132]

## Senior Developer Review (AI)

**Reviewer:** Code Review Agent (Claude Opus 4) on 2026-02-13
**Outcome:** Changes Requested → Fixed → Approved

**Issues Found:** 3 High, 4 Medium, 2 Low (9 total)

**Fixed (7):**
- [H2] `results/$sessionId.tsx` restyled: removed forced `className="dark"`, replaced all slate/gray/white with semantic tokens
- [H3] `TraitScoresSection` animations: added `motion-safe:` prefix to chevron transition and score bar fill (AC #5)
- [M1] `ShareProfileSection` Loader2 spinners + `results.tsx` loading spinner: added `motion-safe:animate-spin` (AC #5)
- [M3] Replaced `color-mix(in oklch, ...)` with direct color + `opacity: 0.7` for broader browser compat
- [M4] Noted as acceptable — facet name normalization matches API contract

**Deferred as action items (2):**
- [H1] `TraitScoresSection` duplicates `TraitBar`/`FacetBreakdown` — architectural decision needed (which route pattern to keep)
- [M2] `FacetBreakdown` disabled evidence button — requires `onViewEvidence` prop addition

**Verification:** Build 0 errors, lint 0 new warnings, 135 frontend tests passing, no regressions.

## Dev Notes

### CRITICAL: This is a RESTYLING, Not a Rewrite

The results page already works functionally (data fetching, evidence panel, share profile, trait expansion). This story ONLY changes the visual presentation. Do NOT:
- Rewrite data fetching logic
- Change route configuration
- Modify API contracts
- Break evidence panel functionality
- Remove share profile functionality

### Current State — What Needs to Change

The results page (`apps/front/src/routes/results.tsx`) currently:
1. **Forces dark mode** with `className="dark"` on every container — REMOVE this
2. **Uses hard-coded colors** throughout: `bg-slate-900`, `bg-slate-800/50`, `text-white`, `text-gray-400`, `text-blue-400`, `bg-gradient-to-r from-blue-500 to-purple-500` — REPLACE with semantic tokens
3. **Has no depth zone progression** — everything is the same dark slate background — ADD depth zones
4. **Uses lucide `Waves` icon** for archetype identity — REPLACE with `GeometricSignature`
5. **Has no archetype color theming** — everything is blue/purple gradient — REPLACE with archetype trait color
6. **Displays archetype name at 3xl/4xl** — UPGRADE to `display-hero` scale (56-64px)
7. **Has inline trait rendering** in the route file (~200 lines) — EXTRACT into separate components

### Results Route is Currently a Monolith (~450 lines)

The entire results page lives in `apps/front/src/routes/results.tsx` with all rendering inline. Extract into components:

```
apps/front/src/routes/results.tsx          # Layout orchestrator + state management
apps/front/src/components/results/
  ArchetypeHeroSection.tsx                  # NEW: Hero with color blocks + signature
  TraitScoresSection.tsx                    # NEW: Wrapper for trait list with depth zone
  ShareProfileSection.tsx                   # NEW: Extracted share UI
  ArchetypeCard.tsx                         # EXISTING: Restyle to semantic tokens
  TraitBar.tsx                              # EXISTING: Add OCEAN shape, verify tokens
  FacetBreakdown.tsx                        # EXISTING: Verify semantic tokens
```

### Key Components Available (Do Not Recreate)

| Component | Location | Use |
|-----------|----------|-----|
| `GeometricSignature` | `ocean-shapes/GeometricSignature.tsx` | Archetype reveal animation |
| `OceanCircle/HalfCircle/Rectangle/Triangle/Diamond` | `ocean-shapes/*.tsx` | Trait section markers |
| `WaveDivider` | `home/WaveDivider.tsx` | Section transitions |
| `NerinAvatar` | `NerinAvatar.tsx` | Optional: loading state avatar |
| `getTraitColor()` | `@workspace/domain` | CSS variable string for trait |
| `getFacetColor()` | `@workspace/domain` | CSS variable string for facet |
| `getTraitGradient()` | `@workspace/domain` | CSS gradient for trait |

### Depth Zone System (Already Defined in globals.css)

```css
/* Light mode */
--depth-surface: var(--background);    /* Warmest — hero */
--depth-shallows: #FFF0E8;             /* Value props */
--depth-mid: #FFE8D8;                  /* Traits */
--depth-deep: #FFD6C4;                 /* Deep detail */

/* Dark mode */
--depth-surface: #0A0E27;              /* Abyss navy — hero */
--depth-shallows: #0E1230;             /* Slightly lighter */
--depth-mid: #141838;                  /* Mid depth */
--depth-deep: #1C2148;                 /* Deepest visible */
```

Apply these as section backgrounds. The hero section overlays the archetype's trait color ON TOP of `--depth-surface`.

### Color Block Composition for Hero

Follow the pattern established in Story 7.8's HeroSection:

```tsx
<div className="absolute inset-0 overflow-hidden" aria-hidden="true">
  {/* Dominant: archetype trait color, large circle */}
  <div className="absolute -top-[20%] -right-[10%] aspect-square w-[60vmin] rounded-full"
       style={{ backgroundColor: archetypeColor, opacity: 0.85 }} />
  {/* Secondary: tertiary color, triangle */}
  <div className="absolute bottom-0 left-0 w-[35vmin] aspect-[3/4] bg-tertiary"
       style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 0)' }} />
</div>
{/* Content always above blocks */}
<div className="relative z-30">
  {/* Hero content here */}
</div>
```

Key lessons from Story 7.8 review:
- Use `vmin` units for responsive shape sizing
- Use `aspect-square` / `aspect-[3/4]` for consistent proportions
- Add `z-30` to content overlay so text is always above shapes
- Use `z-0`, `z-10`, `z-20` for shape layering
- Maximum 3 color blocks (not 4)

### Archetype Color Derivation

The results API returns `archetypeColor` as a hex string. But for the hero, we want the TRAIT color (from OKLCH tokens), not the archetype's hex:

```tsx
// The dominant trait for this archetype determines the hero color
// Use the archetype's trait color tokens, not the hex color directly
// Example: If archetype's dominant trait is Openness → use var(--trait-openness)
```

Since the API doesn't return the dominant trait directly, derive it from the highest-scoring trait in `results.traits`. Use `getTraitColor(highestTrait)` for the hero background.

### OCEAN Shape → Trait Mapping (Established in 7.8)

| Trait | Shape Component | CSS Variable |
|-------|----------------|-------------|
| Openness | `OceanCircle` | `--trait-openness` |
| Conscientiousness | `OceanHalfCircle` | `--trait-conscientiousness` |
| Extraversion | `OceanRectangle` | `--trait-extraversion` |
| Agreeableness | `OceanTriangle` | `--trait-agreeableness` |
| Neuroticism | `OceanDiamond` | `--trait-neuroticism` |

### Semantic Token Replacement Guide

| Hard-Coded (Current) | Semantic Token (Target) |
|----------------------|------------------------|
| `bg-slate-900` | `bg-background` |
| `bg-slate-800/50` | `bg-card` |
| `border-slate-700` | `border-border` |
| `text-white` | `text-foreground` |
| `text-gray-400` / `text-slate-400` | `text-muted-foreground` |
| `text-blue-400` | `text-primary` |
| `bg-gradient-to-r from-blue-500 to-purple-500` | `bg-primary text-primary-foreground` |
| `hover:bg-slate-700` | `hover:bg-accent` |
| `bg-slate-700` | `bg-muted` |
| `bg-slate-900/50` | `bg-muted/50` |

### WaveDivider Usage Between Sections

```tsx
<WaveDivider fromColor="var(--depth-surface)" className="text-[var(--depth-shallows)]" />
```

The `fromColor` fills the area above the wave (previous section's color), and `currentColor` (set via className `text-[...]`) fills below (next section's color).

### Typography for Hero

Use the project's typography scale (Story 7.2):
- Archetype name: `font-display text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.05]`
- "Your Personality Archetype" subtitle: `text-sm tracking-wider uppercase font-heading`
- OCEAN code: `font-mono text-base` (JetBrains Mono)
- Confidence badge: `text-xs font-medium`

### Testing Approach

No unit tests needed — this is a visual restyling story. Verification is visual:
1. `pnpm dev --filter=front` — navigate to `/results?sessionId=<test-session>`
2. Verify archetype hero uses bold trait color background
3. Verify GeometricSignature displays with reveal animation
4. Verify depth zone progression (psychedelic → scientific top to bottom)
5. Toggle dark mode — verify all sections adapt
6. Check mobile at 375px — verify stacked layout, readable hero
7. Verify evidence panel still works when clicking facet evidence buttons
8. Verify share profile flow still works
9. Check `prefers-reduced-motion` — animations should be suppressed
10. `pnpm build` — 0 errors
11. `pnpm lint` — no new warnings
12. `pnpm test:run` — no regressions

### Quick Testing with Seed Data

```bash
# Seed test assessment data (creates user, session, scores, evidence)
pnpm seed:test-assessment

# Then visit: http://localhost:3000/results?sessionId=<seeded-session-id>
# Or run full dev: pnpm dev (auto-seeds on startup)
```

### Data Attributes (per FRONTEND.md)

| Component | Attribute |
|-----------|-----------|
| ArchetypeHeroSection | `data-slot="archetype-hero-section"` |
| TraitScoresSection | `data-slot="trait-scores-section"` |
| ShareProfileSection | `data-slot="share-profile-section"` |
| ArchetypeCard | `data-slot="archetype-card"` |
| TraitBar | keep existing `data-testid` + add `data-slot="trait-bar"` |
| FacetBreakdown | keep existing `data-testid` + add `data-slot="facet-breakdown"` |

### Anti-Patterns

```
DO NOT rewrite data fetching or state management — only change visual presentation
DO NOT remove evidence panel or share profile functionality
DO NOT force dark mode with className="dark" — use theme system
DO NOT use hard-coded hex colors — use CSS variables and semantic Tailwind classes
DO NOT use raw color classes (bg-pink-500, bg-slate-900) — use bg-primary, bg-background, etc.
DO NOT add new npm packages — all tools are available
DO NOT recreate existing result components — restyle them
DO NOT skip data-slot attributes on new components
DO NOT use animations without motion-safe: prefix
DO NOT forget WaveDividers between depth zones
DO NOT remove existing test IDs — add data-slot alongside them
DO NOT modify ocean-shapes/ components — they are stable from Story 7.4
DO NOT modify domain/ or contracts/ packages — this is purely frontend visual
```

### Previous Story Intelligence

**From Story 7.8 (Home Page Redesign) — done:**
- Color block composition pattern established: hard-edged geometric shapes, NOT blended gradients
- Use `vmin` units with `aspect-square`/`aspect-[3/4]` for responsive scaling
- `z-30` on content overlay, `z-0`/`z-10`/`z-20` for shape layers
- Maximum 3 color blocks per composition
- WaveDivider already working between depth zones
- `motion-safe:` prefix required on all animations
- All semantic token patterns validated

**From Story 7.7 (Illustration & Icon System) — done:**
- NerinAvatar available for loading states
- OceanDecorative components available for subtle background decoration
- 8 ocean icons available but not needed for results page

**From Story 7.6 (Global Header) — done:**
- Logo.tsx pattern: "big-" text + OceanShapeSet inline
- All header components use semantic tokens exclusively

**From Story 7.5 (Trait & Facet Colors) — done:**
- All trait CSS tokens use OKLCH in globals.css with light/dark variants
- `getTraitColor()`, `getFacetColor()`, `getTraitAccentColor()`, `getTraitGradient()` utilities
- Dark mode trait variants are brighter for readability

**From Story 7.4 (OCEAN Shapes) — done:**
- GeometricSignature component with `animate` prop and `baseSize`
- Individual shape components: `size`, `className`, optional `color` props
- `shape-reveal` keyframe animation already in globals.css

**From Story 7.1 (Design Tokens) — done:**
- Depth zone CSS variables defined
- `display-hero` typography scale: 56-64px / 700 weight / 1.05 line-height
- All brand colors in OKLCH format

### Git Intelligence

Recent commits:
```
ab4f476 fix: 7-7 story
9ff3dce feat(story-7-8): Home page redesign with color block composition (Story 7.8) (#37)
e94b795 feat(story-7-7): Illustration & icon system (Story 7.7) (#36)
fb0cdb5 feat: Global header (Story 7.6) (#35)
0757354 feat: Big Five trait and facet visualization colors (Story 7.5) (#34)
```

Pattern: Feature PRs use `feat(story-X-Y):` conventional commits. Build/lint/test verified before PR.

### File Structure

```
apps/front/src/
  routes/
    results.tsx                              # MODIFY: extract components, add depth zones
  components/
    results/
      ArchetypeHeroSection.tsx               # NEW: hero with color blocks + signature
      TraitScoresSection.tsx                  # NEW: wrapper for trait list
      ShareProfileSection.tsx                 # NEW: extracted share UI
      ArchetypeCard.tsx                       # MODIFY: semantic tokens
      TraitBar.tsx                            # MODIFY: add OCEAN shape markers
      FacetBreakdown.tsx                      # VERIFY: semantic tokens (mostly OK)
    EvidencePanel.tsx                         # KEEP AS-IS
    ocean-shapes/                             # EXISTING: do NOT modify
      GeometricSignature.tsx                  # USE for hero
      OceanCircle.tsx                         # USE for Openness marker
      OceanHalfCircle.tsx                     # USE for Conscientiousness marker
      OceanRectangle.tsx                      # USE for Extraversion marker
      OceanTriangle.tsx                       # USE for Agreeableness marker
      OceanDiamond.tsx                        # USE for Neuroticism marker
    home/
      WaveDivider.tsx                         # USE between depth zones
```

### References

- [Epic 7 Spec: Story 7.9](/_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md#story-79-results-page-visual-redesign-with-archetype-theming) — Full acceptance criteria
- [UX Spec: Credibility Gradient Pattern](/_bmad-output/planning-artifacts/ux-design-specification.md#credibility-gradient-pattern) — Depth zone progression rules
- [UX Spec: Data Visualization Style](/_bmad-output/planning-artifacts/ux-design-specification.md#data-visualization-style) — Organic score visualization approach
- [UX Spec: Color Block Composition](/_bmad-output/planning-artifacts/ux-design-specification.md#hero--key-surfaces-color-block-composition) — Hero section composition
- [UX Spec: OCEAN Geometric Identity](/_bmad-output/planning-artifacts/ux-design-specification.md#ocean-geometric-identity-system) — Shape system and reveal animation
- [UX Spec: Archetype Trait Colors](/_bmad-output/planning-artifacts/ux-design-specification.md#archetype-trait-colors) — Trait-to-color mapping
- [Story 7.8 Implementation](/_bmad-output/implementation-artifacts/7-8-home-page-redesign-with-color-block-composition.md) — Color block patterns and lessons learned
- [Story 7.4 Implementation](/_bmad-output/implementation-artifacts/7-4-ocean-geometric-identity-system-and-brand-mark.md) — OCEAN shape component patterns
- [FRONTEND.md](/docs/FRONTEND.md) — data-slot conventions, component patterns
- [globals.css](/packages/ui/src/styles/globals.css) — OKLCH color tokens, depth zones, animation keyframes
- [results.tsx](/apps/front/src/routes/results.tsx) — Current results page (monolith to refactor)
- [GeometricSignature.tsx](/apps/front/src/components/ocean-shapes/GeometricSignature.tsx) — Archetype reveal component
- [WaveDivider.tsx](/apps/front/src/components/home/WaveDivider.tsx) — Section transition component
- [trait-colors.ts](/packages/domain/src/utils/trait-colors.ts) — Color utility functions

## Dev Agent Record

### Agent Model Used

Claude Opus 4

### Debug Log References

- TraitBar test failure: test expected `data-testid="trait-color-openness"` (color dot), updated to check OCEAN shape SVG element via `data-slot="ocean-shape-o"` attribute instead
- Lint fix: removed unused `TraitName` type import from TraitBar.tsx

### Completion Notes List

- Refactored 448-line monolith results route into component-based architecture with 3 new extracted components
- Created ArchetypeHeroSection with color block composition (3 decorative geometric shapes) using dominant trait's OKLCH color
- Replaced all hard-coded slate/gray/blue/purple classes with semantic tokens across results route, ArchetypeCard, TraitBar, and FacetBreakdown
- Added OCEAN geometric shapes as trait section markers in TraitBar (replacing color dots)
- Implemented 4-zone depth progression (surface→shallows→mid→deep) with WaveDivider transitions
- Removed forced `className="dark"` to let theme toggle control appearance
- Added GeometricSignature to ArchetypeCard and ArchetypeHeroSection with motion-safe animation
- Added `data-slot` attributes to all new and modified components
- All 135 frontend tests pass (updated TraitBar test for OCEAN shape), 139 API tests pass
- Build succeeds with 0 errors, lint shows 0 new warnings
- Hero uses `getDominantTrait()` to derive trait color from highest-scoring trait
- Hero typography uses display-hero scale (2.5rem→3.5rem→4rem responsive)
- Action buttons use `min-h-11` for 44px touch targets on mobile

### Change Log

- 2026-02-13: Story 7.9 implementation — Results page visual redesign with archetype theming, depth zones, and OCEAN shapes
- 2026-02-13: Code review fixes — Added motion-safe prefixes for prefers-reduced-motion compliance (AC #5), restyled results/$sessionId.tsx sub-route with semantic tokens (AC #6), replaced color-mix() with opacity fallback in TraitScoresSection

### File List

- `apps/front/src/routes/results.tsx` — MODIFIED: refactored from monolith to layout orchestrator with depth zones; added motion-safe to loading spinner
- `apps/front/src/routes/results/$sessionId.tsx` — MODIFIED: restyled with semantic tokens, removed forced dark mode and all hard-coded slate/gray/white classes
- `apps/front/src/components/results/ArchetypeHeroSection.tsx` — NEW: hero section with color block composition
- `apps/front/src/components/results/TraitScoresSection.tsx` — NEW: trait scores wrapper with OCEAN shapes; added motion-safe prefixes, replaced color-mix() with opacity
- `apps/front/src/components/results/ShareProfileSection.tsx` — NEW: extracted share profile UI; added motion-safe to Loader2 spinners
- `apps/front/src/components/results/ArchetypeCard.tsx` — MODIFIED: semantic tokens, GeometricSignature, data-slot
- `apps/front/src/components/results/TraitBar.tsx` — MODIFIED: OCEAN shape markers, data-slot
- `apps/front/src/components/results/FacetBreakdown.tsx` — MODIFIED: added data-slot
- `apps/front/src/components/results/TraitBar.test.tsx` — MODIFIED: updated test for OCEAN shape (replaces color dot)
- `apps/front/src/components/EvidencePanel.tsx` — MODIFIED: fixed evidence card text colors for light/dark mode readability
