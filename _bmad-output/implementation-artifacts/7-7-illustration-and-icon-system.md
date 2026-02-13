# Story 7.7: Illustration & Icon System (Phase 1)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want **a cohesive hand-drawn illustration system with a Diver character (Nerin), ocean-themed icons, and decorative elements**,
So that **the application feels warm, approachable, and distinctly "big-ocean" throughout the experience**.

## Acceptance Criteria

1. **Given** I encounter Nerin in the chat interface or home page **When** assistant messages or chat previews render **Then** Nerin has a Diver avatar — an ethereal ocean entity, bioluminescent, translucent, gender-neutral **And** the avatar works at all sizes (32px chat to 256px hero) **And** the avatar has 3 confidence-based CSS tiers: 0-30% (`opacity-40`, faint glow), 30-60% (`opacity-70`, medium glow), 60-100% (`opacity-100`, luminous glow)

2. **Given** I view decorative elements throughout the app **When** the page renders **Then** ocean-themed decorative SVGs (waves, bubbles, coral, seaweed) appear where appropriate **And** decorative elements are at low opacity (5-10%) and non-distracting **And** all decorative elements are marked `aria-hidden`

3. **Given** I view icons throughout the app **When** ocean-themed actions appear **Then** custom ocean icons are used where appropriate: Shell (home), Compass (explore), Anchor (profile), Bubble (send), Wave (share), Pearl (save), Rising Bubbles (loading), Lighthouse (complete) **And** icons accept `size` and `className` props for consistency with lucide-react patterns

4. **Given** the Nerin avatar is used in the chat preview section on the home page **When** the ChatPreviewSection renders **Then** the existing `N`-in-a-circle placeholder is replaced with the NerinAvatar component at the appropriate size

5. **Given** the illustration system is documented **When** Storybook is loaded **Then** all avatar states (3 confidence tiers), all decorative elements, and all 8 ocean icons are documented in Storybook stories

## Tasks / Subtasks

- [x] Task 1: Create NerinAvatar component with SVG Diver (AC: #1)
  - [x] Create `apps/front/src/components/NerinAvatar.tsx` with Diver SVG
  - [x] Props: `size` (number, default 40), `confidence` (number 0-100, default 100), `className`
  - [x] SVG Diver design: ethereal, bioluminescent, translucent, gender-neutral diver silhouette
  - [x] 3 confidence tiers via CSS: 0-30 (`opacity-40` + faint glow), 30-60 (`opacity-70` + medium glow), 60-100 (`opacity-100` + luminous glow)
  - [x] Glow effect: `drop-shadow` using `var(--primary)` at varying intensity per tier
  - [x] Scale from 32px to 256px cleanly (SVG viewBox-based)
  - [x] `data-slot="nerin-avatar"` attribute
  - [x] `aria-hidden="true"` (decorative)

- [x] Task 2: Create OceanDecorative component with 4 SVG elements (AC: #2)
  - [x] Create `apps/front/src/components/OceanDecorative.tsx`
  - [x] 4 decorative SVGs exported as named components: `WaveDecoration`, `BubblesDecoration`, `CoralDecoration`, `SeaweedDecoration`
  - [x] Each accepts `className` prop for positioning and sizing
  - [x] Default opacity: 5-10% (`opacity-5` to `opacity-10`)
  - [x] All marked `aria-hidden="true"`
  - [x] Use brand palette colors (via CSS variables where appropriate)
  - [x] SVG format, inline (no external files)
  - [x] `data-slot` attributes: `wave-decoration`, `bubbles-decoration`, `coral-decoration`, `seaweed-decoration`

- [x] Task 3: Create ocean icon set with 8 icons (AC: #3)
  - [x] Create `apps/front/src/components/icons/ocean-icons.tsx`
  - [x] 8 icons: `ShellIcon`, `CompassIcon`, `AnchorIcon`, `BubbleIcon`, `WaveIcon`, `PearlIcon`, `RisingBubblesIcon`, `LighthouseIcon`
  - [x] Each icon: SVG-based, accepts `size` (number, default 24) and `className` props
  - [x] Match lucide-react pattern: `stroke="currentColor"`, `strokeWidth={2}`, `fill="none"`, 24x24 viewBox
  - [x] Consistent line weight (2px) matching illustration style guide
  - [x] `aria-hidden="true"` on all icons (decorative by default)
  - [x] Export all from a barrel `apps/front/src/components/icons/index.ts`

- [x] Task 4: Update ChatPreviewSection to use NerinAvatar (AC: #4)
  - [x] Import `NerinAvatar` component
  - [x] Replace the `N`-in-a-circle div (`<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">N</div>`) with `<NerinAvatar size={40} />`
  - [x] Verify visual harmony in both light and dark modes

- [x] Task 5: Create Storybook stories for all components (AC: #5)
  - [x] Create `apps/front/src/components/NerinAvatar.stories.tsx`
    - [x] Stories: Default, Small (32px), Medium (64px), Large (128px), Hero (256px)
    - [x] Confidence tiers: Low (20%), Medium (50%), High (90%)
    - [x] All tiers side-by-side comparison
  - [x] Create `apps/front/src/components/OceanDecorative.stories.tsx`
    - [x] Stories: Each decoration standalone, All decorations grid
  - [x] Create `apps/front/src/components/icons/OceanIcons.stories.tsx`
    - [x] Stories: All icons in grid, Size variants (16px, 24px, 32px, 48px)
  - [x] Use existing decorators: `withThemeProvider` from `.storybook/decorators.tsx`

- [x] Task 6: Build verification (AC: all)
  - [x] `pnpm build` — 0 errors
  - [x] `pnpm lint` — no new warnings
  - [x] `pnpm test:run` — no regressions

## Dev Notes

### CRITICAL: Phase 1 Scope — Ship Elegant Placeholders, Not Final Art

This story creates the **component infrastructure and SVG placeholders** for the illustration system. The Diver avatar should be a well-crafted SVG silhouette/geometric placeholder that looks intentional and polished — NOT a rough sketch. Final illustration art is a parallel design task.

**What "elegant placeholder" means for the Diver:**
- A stylized diver silhouette using the brand's geometric visual language
- Bioluminescent glow effect using `drop-shadow` with primary color
- Translucent/ethereal feel via opacity layers
- Gender-neutral, abstract form
- NOT a stick figure, NOT a photo, NOT a generic avatar icon

### Current Nerin Representation (Replace These)

Nerin currently appears as a simple **"N" letter in a primary-colored circle** in two locations:

1. **ChatPreviewSection** (`apps/front/src/components/home/ChatPreviewSection.tsx:38-40`):
   ```tsx
   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
     N
   </div>
   ```
   **Action:** Replace with `<NerinAvatar size={40} />` (Task 4)

2. **TherapistChat** (`apps/front/src/components/TherapistChat.tsx`):
   - Currently has NO avatar on assistant messages — just aligned-left bubbles
   - **Do NOT modify TherapistChat in this story** — Story 7.10 (Chat UX Polish) handles full chat avatar integration
   - NerinAvatar component must be ready for Story 7.10 to import and use

### Existing OCEAN Shapes — Do NOT Duplicate

5 OCEAN geometric shapes already exist in `apps/front/src/components/ocean-shapes/`:
- `OceanCircle.tsx`, `OceanHalfCircle.tsx`, `OceanRectangle.tsx`, `OceanTriangle.tsx`, `OceanDiamond.tsx`
- `OceanShapeSet.tsx` (brand mark), `GeometricSignature.tsx` (user's OCEAN code)

These are **not** part of the illustration system. The 8 ocean icons in this story are a separate set for UI actions (navigation, loading states, etc.).

### Icon Design Consistency with Lucide

The codebase extensively uses `lucide-react` icons (Menu, Sun, Moon, Monitor, Send, Loader2, Home, LayoutDashboard, etc.). Ocean icons must:
- Follow the same API pattern: `size` prop (number), `className` prop
- Use `stroke="currentColor"` so they inherit text color
- Use `strokeWidth={2}` and `fill="none"` (outline style)
- Use `24x24` viewBox
- NOT conflict with existing lucide icons that serve similar purposes — ocean icons are for **brand-specific** contexts (e.g., `ShellIcon` for home on landing page, while lucide `Home` stays in navigation menus)

### SVG Best Practices

- All SVGs inline (no external `.svg` files to fetch)
- Use `viewBox` for scaling (not fixed width/height attributes)
- Use `currentColor` for strokes to respect theme colors
- Decorative SVGs: `aria-hidden="true"`, `role="img"` NOT needed
- Use CSS custom properties for brand colors where needed (e.g., glow effects)
- Optimize: minimal paths, no unnecessary groups, clean coordinates

### Confidence-Based Glow Implementation

```tsx
// Tier calculation
const tier = confidence <= 30 ? 'low' : confidence <= 60 ? 'mid' : 'high';

// CSS classes per tier
const tierStyles = {
  low: 'opacity-40 drop-shadow-[0_0_4px_var(--primary)]',
  mid: 'opacity-70 drop-shadow-[0_0_8px_var(--primary)]',
  high: 'opacity-100 drop-shadow-[0_0_12px_var(--primary)]',
};
```

This uses `var(--primary)` which automatically switches between Electric Pink (light) and Saturated Teal (dark), creating the bioluminescent effect described in the UX spec.

### Color Token Usage

- **Glow effects:** Use `var(--primary)` for bioluminescent glow (auto light/dark)
- **Decorative SVG fills:** Use `var(--primary)`, `var(--secondary)`, `var(--tertiary)` at low opacity
- **Icon strokes:** Use `currentColor` (inherits from parent text color)
- **NO hard-coded hex colors** in any component

### OKLCH Color System

All color tokens in `globals.css` use OKLCH format. When referencing colors in SVGs, always use CSS variables (`var(--primary)`, `var(--trait-openness)`, etc.), never raw hex values. The CSS variables handle light/dark mode switching automatically.

### File Structure

```
apps/front/src/components/
  NerinAvatar.tsx                    # NEW: Diver avatar with confidence tiers
  NerinAvatar.stories.tsx            # NEW: Storybook stories
  OceanDecorative.tsx                # NEW: 4 decorative SVG elements
  OceanDecorative.stories.tsx        # NEW: Storybook stories
  icons/
    ocean-icons.tsx                  # NEW: 8 ocean-themed icons
    index.ts                        # NEW: barrel export
    OceanIcons.stories.tsx           # NEW: Storybook stories
  home/
    ChatPreviewSection.tsx           # MODIFY: Replace N-circle with NerinAvatar
  ocean-shapes/                      # EXISTING: Do NOT modify
    OceanCircle.tsx
    OceanHalfCircle.tsx
    OceanRectangle.tsx
    OceanTriangle.tsx
    OceanDiamond.tsx
    OceanShapeSet.tsx
    GeometricSignature.tsx
    OceanShapes.stories.tsx
    index.ts
```

### Storybook Configuration

Storybook is already configured:
- Config: `apps/front/.storybook/main.ts` — stories from `../src/**/*.stories.@(js|jsx|mjs|ts|tsx)`
- Preview: `apps/front/.storybook/preview.ts` — auth mocking, theme addon (light/dark)
- Decorators: `apps/front/.storybook/decorators.tsx` — `withRouter`, `withThemeProvider`
- Use `withThemeProvider` decorator for components that need theme context
- Stories DON'T need `withRouter` unless they use `<Link>` components

### Data Attributes (per FRONTEND.md)

Every component MUST include `data-slot` attributes:

| Component | Attribute |
|-----------|-----------|
| NerinAvatar wrapper | `data-slot="nerin-avatar"` |
| WaveDecoration | `data-slot="wave-decoration"` |
| BubblesDecoration | `data-slot="bubbles-decoration"` |
| CoralDecoration | `data-slot="coral-decoration"` |
| SeaweedDecoration | `data-slot="seaweed-decoration"` |
| Each ocean icon | `data-slot="ocean-icon"` |

### Anti-Patterns

```
DO NOT modify TherapistChat.tsx — Story 7.10 handles chat avatar integration
DO NOT duplicate OCEAN geometric shapes — they already exist in ocean-shapes/
DO NOT use external SVG files — all SVGs must be inline React components
DO NOT use hard-coded hex colors — use CSS variables (var(--primary), currentColor)
DO NOT use lucide-react for the 8 ocean icons — these are custom brand icons
DO NOT add new npm packages — SVGs are hand-crafted inline
DO NOT create overly complex SVGs — keep paths minimal and clean
DO NOT use `role="img"` on decorative elements — use `aria-hidden="true"` only
DO NOT skip data-slot attributes — required per FRONTEND.md conventions
```

### Testing Approach

No unit tests needed — this is a UI/illustration story. Verification is visual:
1. `pnpm dev --filter=front` — check NerinAvatar renders at various sizes
2. Check confidence tier glow effects (pass different confidence values)
3. Verify decorative elements render at low opacity
4. Verify all 8 ocean icons render correctly
5. Check ChatPreviewSection now shows NerinAvatar instead of "N" circle
6. Verify all components work in both light and dark modes
7. Run Storybook: `pnpm --filter=front storybook` — verify all new stories render
8. `pnpm build` — 0 errors
9. `pnpm lint` — no new warnings
10. `pnpm test:run` — no regressions

### Project Structure Notes

- All new components follow existing patterns in `apps/front/src/components/`
- Icon barrel export follows convention used in `ocean-shapes/index.ts`
- Storybook stories follow patterns in `OceanShapes.stories.tsx` and `Header.stories.tsx`
- No conflicts with existing file structure detected

### Previous Story Intelligence

**From Story 7.6 (Global Header) — review:**
- Logo.tsx uses `OceanShapeSet` at `size={18}` with `font-heading tracking-tight`
- MobileNav.tsx Sheet title uses same geometric brand mark
- All header components use semantic tokens exclusively
- 255 tests pass (139 API + 116 frontend), build clean
- `data-slot` attributes on all component parts

**From Story 7.5 (Trait & Facet Colors) — done:**
- All trait CSS tokens use OKLCH format in `globals.css`
- Dark mode trait variants are brighter for readability
- 30 facet colors defined with lightness-step algorithm
- 761 tests pass, build clean

**From Story 7.4 (OCEAN Shapes) — review:**
- 5 SVG shape components in `ocean-shapes/` directory
- Each shape uses `var(--trait-*)` CSS variables for auto light/dark
- OceanShapeSet renders all 5 inline with configurable size
- GeometricSignature maps OCEAN code to sized shapes with animation
- Pattern: SVG components accept `size`, `className`, optional `color` props

**Key Pattern to Follow:** The OCEAN shape components provide the best reference for how to structure SVG components in this codebase — `viewBox` based scaling, CSS variable colors, `data-slot` attributes, TypeScript interfaces for props.

### Git Intelligence

Recent commits show Epic 7 progression:
```
95741e1 fix: colors
00c78d9 chore: storybook dark/light mode
0757354 feat: Big Five trait and facet visualization colors (Story 7.5) (#34)
69f3707 feat: OCEAN geometric identity system and brand mark (Story 7.4) (#33)
a8c3bc1 feat: Typography system with 3-font hierarchy (Story 7.2) (#32)
ed5cd45 feat: Psychedelic brand design tokens (Story 7.1) (#31)
```

Pattern: Feature PRs use `feat:` conventional commits with story reference. Build/lint/test are verified before PR.

### References

- [Epic 7 Spec: Story 7.7](/_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md#story-77-illustration--icon-system-phase-1) — Full acceptance criteria and component structure
- [UX Spec: Illustration & Imagery System](/_bmad-output/planning-artifacts/ux-design-specification/visual-design-foundation.md#illustration--imagery-system) — Phase 1 scope, illustration style guide, character library
- [UX Spec: Chat Visual Calm](/_bmad-output/planning-artifacts/ux-design-specification/visual-design-foundation.md#chat-interface-visual-calm) — Nerin avatar behavior in chat
- [Story 7.4 Implementation](/_bmad-output/implementation-artifacts/7-4-ocean-geometric-identity-system-and-brand-mark.md) — SVG component patterns to follow
- [Story 7.6 Implementation](/_bmad-output/implementation-artifacts/7-6-global-header-with-geometric-logo-auth-theme-toggle-mobile-nav.md) — Header/Logo integration patterns
- [FRONTEND.md](/docs/FRONTEND.md) — data-slot conventions, component patterns
- [globals.css](/packages/ui/src/styles/globals.css) — OKLCH color tokens and CSS variables
- [ChatPreviewSection.tsx](/apps/front/src/components/home/ChatPreviewSection.tsx) — Current "N" circle to replace
- [OceanShapeSet.tsx](/apps/front/src/components/ocean-shapes/OceanShapeSet.tsx) — Reference SVG component pattern
- [.storybook/decorators.tsx](/apps/front/.storybook/decorators.tsx) — Storybook decorator imports

## Dev Agent Record

### Agent Model Used

GPT-5 Codex (Codex Desktop)

### Debug Log References

- `pnpm build` (pass)
- `pnpm lint` (pass; pre-existing warnings in `apps/api/src/index.ts` and `apps/front/src/components/TherapistChat.tsx`, no new story warnings)
- `pnpm test:run` (pass; 761 tests passed, 1 skipped)
- `pnpm --filter=front build-storybook` (pass)

### Completion Notes List

- Implemented `NerinAvatar` with confidence-tier glow states (`low`/`mid`/`high`), `data-slot="nerin-avatar"`, and decorative `aria-hidden`.
- Added `OceanDecorative` set (`WaveDecoration`, `BubblesDecoration`, `CoralDecoration`, `SeaweedDecoration`) with low-opacity defaults, CSS variable palette usage, and required data-slot attributes.
- Added eight custom ocean icons with lucide-style API (`size`, `className`), `stroke="currentColor"`, `strokeWidth={2}`, `24x24` viewBox, `aria-hidden`, and barrel exports.
- Replaced chat preview "N" placeholder with `NerinAvatar size={40}` in `ChatPreviewSection`.
- Added Storybook stories for avatar, decorative set, and all icon variants using `withThemeProvider`.
- Verified Storybook production build succeeds with the new stories.
- Completed repo-wide verification gates: build/lint/test all passing after implementation updates.

### Senior Developer Review (AI)

**Reviewer:** Vincentlay | **Date:** 2026-02-13 | **Outcome:** Approved with fixes applied

**Issues Found:** 2 High, 4 Medium, 2 Low

**Fixed (2 High, 1 Medium):**
- **[H1] Removed contradictory `<title>` from `OceanIconBase`** — SVGs have `aria-hidden="true"` making `<title>` useless; removed `title` prop and `<title>` element from all 8 icons (`ocean-icons.tsx`)
- **[H2] Build artifacts already cleaned** — `.nitro/` and `.output/` were committed in merge but removed in `91311a1 chore: clean up epic 7`
- **[M2] Cleaned up unused `ReactElement` return types** — Removed explicit return type annotations and unused `ReactElement` import from `ocean-icons.tsx`

**Noted (3 Medium, 2 Low — not blocking):**
- **[M1] No barrel export for OceanDecorative** — Unlike `icons/index.ts`, decorative components lack a barrel; single-file module makes this optional
- **[M3] Story File List missing 7-8 doc change** — Merge commit modified `7-8-home-page-redesign...md` but story doesn't list it
- **[M4] NerinAvatar uses `var(--secondary)` for accent dots** — Intentional design for multi-color bioluminescent effect; not overridable via className but correct for the use case
- **[L1] Storybook meta uses `WaveDecoration` as primary component** — Autodocs only generates prop table for Wave, not all 4 decoratives (same interface)
- **[L2] No `data-confidence-tier` attribute on NerinAvatar** — Could follow FRONTEND.md data-attribute pattern for external CSS targeting

**Verification:** `pnpm build` (pass), `pnpm lint` (pass, 1 pre-existing warning), `pnpm test:run` (pass, 274 tests, 1 skipped)

### Change Log

- 2026-02-13: Code review — fixed H1 (removed `<title>` from aria-hidden icons) and M2 (cleaned up unused types) in `ocean-icons.tsx`. All verification gates passing.
- 2026-02-13: Implemented Story 7.7 illustration and icon system (avatar, decorative SVG set, ocean icon library, chat preview avatar integration, Storybook documentation, and validation runs).

### File List

- `apps/front/src/components/NerinAvatar.tsx` — New
- `apps/front/src/components/OceanDecorative.tsx` — New
- `apps/front/src/components/icons/ocean-icons.tsx` — New
- `apps/front/src/components/icons/index.ts` — New
- `apps/front/src/components/home/ChatPreviewSection.tsx` — Modified
- `apps/front/src/components/NerinAvatar.stories.tsx` — New
- `apps/front/src/components/OceanDecorative.stories.tsx` — New
- `apps/front/src/components/icons/OceanIcons.stories.tsx` — New
- `_bmad-output/implementation-artifacts/7-7-illustration-and-icon-system.md` — Modified
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Modified
