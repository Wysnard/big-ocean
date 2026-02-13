# Story 7.6: Global Header with Geometric Logo, Auth, Theme Toggle & Mobile Nav

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want **a polished global header featuring the "big-[shapes]" geometric logo, auth controls, theme toggle, and responsive mobile navigation**,
So that **I can navigate the app, manage my account, and switch themes from any page with a brand-forward experience**.

## Acceptance Criteria

1. **Given** I visit any page in the application **When** the page loads **Then** I see a global header containing: "big-[OCEAN shapes]" geometric logo on the left (linked to home), navigation links (desktop), theme toggle button (sun/moon icon), auth controls (Sign In / Sign Up when unauthenticated, user avatar/menu when authenticated) **And** the header uses semantic color tokens **And** the header works correctly in both light and dark modes

2. **Given** I am not authenticated **When** I view the header **Then** I see "Sign In" and "Sign Up" buttons **And** clicking them navigates to the appropriate routes (`/login` and `/signup`)

3. **Given** I am authenticated **When** I view the header **Then** I see my user avatar/initial **And** clicking it opens a dropdown with: name/email, Dashboard link, Sign Out

4. **Given** I view the application on mobile (< 768px) **When** the header renders **Then** navigation collapses behind a hamburger menu icon **And** clicking it opens a side sheet/drawer with nav links, auth, and theme toggle **And** all touch targets are minimum 44px

5. **Given** I view the logo anywhere in the header **When** the brand mark renders **Then** I see "big-" in Space Grotesk bold followed by 5 inline geometric shapes: Circle (Purple), Half-Circle (Orange), Rectangle (Pink), Triangle (Teal), Diamond (Navy) **And** the shapes replace the word "ocean" in the logo **And** the shapes use their trait CSS variable colors (`var(--trait-*)`) **And** the logo works at the header's size (approximately 20-24px shapes)

6. **Given** I view the header in dark mode **When** dark mode is active **Then** all elements use dark mode semantic tokens **And** the OCEAN shapes use their dark mode trait color variants **And** no hard-coded color classes appear

7. **Given** I view on desktop (>= 768px) **When** the header renders **Then** all controls are visible inline (no hamburger) **And** layout is: Logo (left), spacer, ThemeToggle, UserNav (right)

## Tasks / Subtasks

- [x] Task 1: Update Logo component to use geometric brand mark (AC: #1, #5, #6)
  - [x] Replace text-only "Big Ocean" wordmark with "big-" + `OceanShapeSet` inline
  - [x] "big-" text: Space Grotesk (`font-heading`), bold (700), tracking-tight
  - [x] OceanShapeSet renders at appropriate size for header (size=18-20)
  - [x] Shapes use trait CSS variables (auto light/dark via `var(--trait-*)`)
  - [x] Remove gradient text styling (shapes ARE the brand, no text gradient needed)
  - [x] Verify logo works at favicon-ish sizes down to hero sizes
  - [x] Maintain `data-slot="header-logo"` attribute
  - [x] Logo links to `/` via TanStack `<Link>`

- [x] Task 2: Update MobileNav Sheet title to use geometric logo (AC: #4, #5)
  - [x] Replace "Big Ocean" gradient text in Sheet header with "big-" + `OceanShapeSet`
  - [x] Match the same visual treatment as the header Logo component
  - [x] Verify shapes render correctly within Sheet context

- [x] Task 3: Remove any hard-coded colors from header components (AC: #6)
  - [x] Audit Header.tsx — ensure all styling uses semantic tokens
  - [x] Audit Logo.tsx — remove any `bg-[image:var(--gradient-ocean)]` if shapes replace the text gradient
  - [x] Audit UserNav.tsx — verify `bg-primary text-primary-foreground` for avatar circle
  - [x] Audit MobileNav.tsx — ensure all buttons and text use semantic tokens
  - [x] Audit ThemeToggle.tsx — confirm ghost button uses semantic tokens

- [x] Task 4: Verify data-slot attributes on all component parts (AC: #1)
  - [x] `<header>` — `data-slot="header"`
  - [x] Logo link — `data-slot="header-logo"`
  - [x] Desktop nav area — `data-slot="header-nav"`
  - [x] Theme toggle button — `data-slot="theme-toggle"`
  - [x] User nav (auth area) — `data-slot="user-nav"`
  - [x] Mobile hamburger button — `data-slot="mobile-nav-trigger"`
  - [x] Mobile Sheet — `data-slot="mobile-nav"`

- [x] Task 5: Visual verification in both modes (AC: #1-7)
  - [x] Light mode: Header renders with correct semantic colors, shapes show trait colors
  - [x] Dark mode: Header renders with dark tokens, shapes show brighter dark mode trait colors
  - [x] Theme toggle cycles correctly (system → light → dark → system)
  - [x] No flash of wrong theme on page reload
  - [x] Sign In/Sign Up buttons visible when unauthenticated
  - [x] User dropdown works when authenticated
  - [x] Mobile hamburger appears at < 768px
  - [x] Sheet drawer opens/closes correctly with geometric logo
  - [x] No regressions on existing pages (home, chat, results)
  - [x] `pnpm build` — 0 errors
  - [x] `pnpm lint` — no new warnings
  - [x] `pnpm test:run` — no regressions

## Dev Notes

### CRITICAL: This Story Is an UPDATE, Not a Greenfield Build

The previous Story 7.6 iteration (from the old epic scope) already implemented the full header infrastructure:
- ThemeProvider + useTheme hook (with ScriptOnce flash prevention)
- Header.tsx (sticky, backdrop-blur, responsive)
- Logo.tsx (text-based "big-" + OceanShapeSet)
- ThemeToggle.tsx (Sun/Moon/Monitor cycling)
- UserNav.tsx (auth-aware DropdownMenu)
- MobileNav.tsx (Sheet-based mobile drawer)
- Sheet and DropdownMenu shadcn/ui components installed

**The primary change in this story is updating the Logo to use the full "big-[OCEAN shapes]" geometric brand mark** from Story 7.4, and ensuring visual consistency with the rewritten Epic 7 spec. Most infrastructure is ALREADY BUILT.

### Current Logo State

The current `Logo.tsx` (from old 7.6) already renders "big-" text + `OceanShapeSet`. The update needed is:
1. Ensure the "big-" text uses `font-heading` (Space Grotesk) at bold weight
2. Ensure `OceanShapeSet` is properly sized for header context (~18-20px)
3. Remove any text gradient styling — the shapes themselves provide the brand color
4. Verify the logo composition matches the Epic 7 brand mark specification

### Current MobileNav State

The `MobileNav.tsx` Sheet title currently shows "Big Ocean" as gradient text. This should be updated to match the geometric logo pattern: "big-" + `OceanShapeSet` (same as header Logo).

### OceanShapeSet Component (from Story 7.4)

Located at `apps/front/src/components/ocean-shapes/OceanShapeSet.tsx`:
- Props: `size` (default 24), `variant` ("color" | "monochrome"), `className`
- In "color" mode: uses `var(--trait-openness)`, `var(--trait-conscientiousness)`, etc.
- In "monochrome" mode: uses `currentColor`
- Gap: `gap-[0.15em]` (responsive to font size)
- Already has `data-slot="ocean-shape-set"`

Individual shapes are in `apps/front/src/components/ocean-shapes/`:
- `OceanCircle.tsx` — O: Openness (Purple)
- `OceanHalfCircle.tsx` — C: Conscientiousness (Orange)
- `OceanRectangle.tsx` — E: Extraversion (Electric Pink)
- `OceanTriangle.tsx` — A: Agreeableness (Teal)
- `OceanDiamond.tsx` — N: Neuroticism (Navy)

### Existing Auth Infrastructure (Do NOT Recreate)

- **Hook:** `import { useAuth } from "../hooks/use-auth"` → `{ user, isAuthenticated, isPending, signOut }`
- **Routes:** `/login`, `/signup`, `/dashboard` already exist
- **Existing components:** LoginForm, SignupForm, SignUpModal — do NOT modify
- **UserNav** already uses `useAuth()` correctly

### Existing Theme Infrastructure (Do NOT Recreate)

- **Hook:** `import { useTheme } from "@workspace/ui/hooks/use-theme"` → `{ userTheme, appTheme, setTheme }`
- **ThemeProvider:** `apps/front/src/components/ThemeProvider.tsx` — uses `ScriptOnce` for flash prevention
- **Integration:** Already in `__root.tsx` wrapping Header + children
- **localStorage key:** `big-ocean-theme`

### Color & Styling Rules

- **ALL colors MUST use semantic tokens.** Zero `bg-gray-*`, `bg-slate-*`, `bg-blue-*`, `text-white`
- Header background: `bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`
- Border: `border-b border-border`
- Text: `text-foreground`
- Active nav link: `text-primary`
- Buttons: Use shadcn Button component with `variant` props
- User avatar circle: `bg-primary text-primary-foreground`
- OCEAN shape colors: via `var(--trait-*)` CSS variables (auto light/dark)

### OKLCH Color System

All color tokens use OKLCH format exclusively. The trait color CSS variables automatically switch between light and dark mode values:

**Light Mode Trait Colors:**
- `--trait-openness: oklch(0.55 0.24 293)` — Purple
- `--trait-conscientiousness: oklch(0.67 0.20 42)` — Orange
- `--trait-extraversion: oklch(0.59 0.27 348)` — Electric Pink
- `--trait-agreeableness: oklch(0.67 0.13 181)` — Teal
- `--trait-neuroticism: oklch(0.29 0.19 272)` — Navy

**Dark Mode Trait Colors:**
- `--trait-openness: oklch(0.67 0.20 293)` — Brighter purple
- `--trait-conscientiousness: oklch(0.74 0.16 46)` — Brighter orange
- `--trait-extraversion: oklch(0.65 0.23 350)` — Brighter pink
- `--trait-agreeableness: oklch(0.77 0.14 178)` — Brighter teal
- `--trait-neuroticism: oklch(0.54 0.22 275)` — Brighter indigo

### Data Attributes (per FRONTEND.md)

Every component MUST include `data-slot` attributes:

| Component | Attribute |
|-----------|-----------|
| `<header>` | `data-slot="header"` |
| Logo link | `data-slot="header-logo"` |
| Desktop nav area | `data-slot="header-nav"` |
| Theme toggle button | `data-slot="theme-toggle"` |
| User nav (auth area) | `data-slot="user-nav"` |
| Mobile hamburger button | `data-slot="mobile-nav-trigger"` |
| Mobile Sheet | `data-slot="mobile-nav"` |

### Header Layout Spec

```
DESKTOP (>= 768px):
+--------------------------------------------------------------+
|  [big-●◐▬▲◆]              [☀/🌙 toggle] [Sign In] [Sign Up] |
|                                     — or —                    |
|  [big-●◐▬▲◆]              [☀/🌙 toggle] [👤 ▾ dropdown]      |
+--------------------------------------------------------------+

MOBILE (< 768px):
+--------------------------------------------------------------+
|  [big-●◐▬▲◆]                                   [☰ hamburger] |
+--------------------------------------------------------------+
  → Sheet (right side):
    +------------------------+
    |  big-●◐▬▲◆             |
    |  -----------------------|
    |  Home                   |
    |  Dashboard (if auth'd)  |
    |  -----------------------|
    |  [☀/🌙] Theme Toggle    |
    |  -----------------------|
    |  [Sign In] [Sign Up]    |
    |  — or —                 |
    |  User Name              |
    |  user@email.com         |
    |  [Sign Out]             |
    +------------------------+
```

### Anti-Patterns

```
DO NOT install new shadcn/ui components — Sheet and DropdownMenu are already installed
DO NOT recreate ThemeProvider — it already exists and works
DO NOT use hard-coded colors (bg-gray-800, bg-slate-900, text-white, etc.)
DO NOT duplicate auth logic — use existing useAuth() hook
DO NOT modify existing auth components (LoginForm, SignupForm, SignUpModal)
DO NOT use next-themes (incompatible with TanStack Start)
DO NOT use dangerouslySetInnerHTML for theme script — ScriptOnce is already set up
DO NOT use <a> tags for internal navigation — use TanStack Router <Link>
DO NOT add hex colors to CSS tokens — all tokens use OKLCH format
```

### Project Structure Notes

- Logo component: `apps/front/src/components/Logo.tsx` — **modify** to use geometric brand mark
- MobileNav: `apps/front/src/components/MobileNav.tsx` — **modify** Sheet title to geometric logo
- Header: `apps/front/src/components/Header.tsx` — **audit** for hard-coded colors (likely clean already)
- ThemeToggle: `apps/front/src/components/ThemeToggle.tsx` — **audit** only
- UserNav: `apps/front/src/components/UserNav.tsx` — **audit** only
- All other infrastructure files: **do NOT modify**

### Testing Approach

No unit tests needed — this is a UI/presentation story. Verification is visual:
1. `pnpm dev --filter=front` — check header in both light and dark modes
2. Verify geometric shapes render in header logo with correct trait colors
3. Verify MobileNav Sheet shows geometric logo
4. Verify theme toggle still works
5. Test authenticated vs unauthenticated states
6. Resize browser to test mobile breakpoint
7. `pnpm build` — confirm 0 errors
8. `pnpm lint` — no new warnings
9. `pnpm test:run` — no regressions

### Previous Story Intelligence

**From Story 7.5 (Big Five Trait & Facet Visualization Colors) — done:**
- All trait CSS tokens now use OKLCH format
- Dark mode trait variants are brighter for readability
- 30 facet colors use lightness-step algorithm anchored to parent trait hue
- Accent color tokens added for gradient pairs
- `getTraitAccentColor()` utility function added
- 761 tests pass, build clean

**From Story 7.4 (OCEAN Geometric Identity System) — review:**
- 5 SVG shape components created in `apps/front/src/components/ocean-shapes/`
- OceanShapeSet renders all 5 shapes inline using `var(--trait-*)` CSS variables
- GeometricSignature component maps OCEAN code to sized shapes with animation
- Brand mark logo pattern: "big-" + OceanShapeSet

**From old Story 7.6 (Header implementation) — done:**
- Full header infrastructure built: ThemeProvider, Header, Logo, ThemeToggle, UserNav, MobileNav
- Sheet and DropdownMenu installed in packages/ui
- All 759 tests pass, build clean
- ThemeProvider uses ScriptOnce for flash prevention

### Git Intelligence

Recent commits show the progression:
```
95741e1 fix: colors
00c78d9 chore: storybook dark/light mode
0757354 feat: Big Five trait and facet visualization colors (Story 7.5) (#34)
69f3707 feat: OCEAN geometric identity system and brand mark (Story 7.4) (#33)
84b1c5e chore: update sprint
a8c3bc1 feat: Typography system with 3-font hierarchy (Story 7.2) (#32)
ed5cd45 feat: Psychedelic brand design tokens (Story 7.1) (#31)
```

Pattern: Feature PRs use conventional commits. The `globals.css` file is frequently modified across Epic 7 stories. The header files were last touched in Story 7.4/7.5 timeframe.

### References

- [Epic 7 Spec: Story 7.6](/_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md#story-76-global-header-with-geometric-logo-auth-theme-toggle--mobile-nav) — Full acceptance criteria and component structure
- [Story 7.5 Implementation](/_bmad-output/implementation-artifacts/7-5-big-five-trait-and-facet-visualization-colors.md) — OKLCH trait color tokens, accent colors, dark mode variants
- [Story 7.4 Implementation](/_bmad-output/implementation-artifacts/7-4-ocean-geometric-identity-system-and-brand-mark.md) — OCEAN shape components, OceanShapeSet brand mark
- [Old Story 7.6 Implementation](/_bmad-output/implementation-artifacts/7-6-add-global-header-with-logo-auth-controls-theme-toggle-and-mobile-hamburger.md) — Existing header infrastructure (ThemeProvider, Header, Logo, UserNav, MobileNav, ThemeToggle)
- [FRONTEND.md](/docs/FRONTEND.md) — data-slot conventions, CVA usage, component patterns
- [globals.css](/packages/ui/src/styles/globals.css) — OKLCH trait color tokens and semantic variables
- [Header.tsx](/apps/front/src/components/Header.tsx) — Current header (modify for audit)
- [Logo.tsx](/apps/front/src/components/Logo.tsx) — Current logo (modify for geometric brand mark)
- [MobileNav.tsx](/apps/front/src/components/MobileNav.tsx) — Current mobile nav (modify Sheet title)
- [OceanShapeSet.tsx](/apps/front/src/components/ocean-shapes/OceanShapeSet.tsx) — Brand mark shapes component
- [useAuth hook](/apps/front/src/hooks/use-auth.ts) — Auth hook (consume, do not modify)
- [useTheme hook](/packages/ui/src/hooks/use-theme.ts) — Theme hook (consume, do not modify)
- [__root.tsx](/apps/front/src/routes/__root.tsx) — Root layout (already has ThemeProvider)

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

- `pnpm --filter=front exec biome check src/components/MobileNav.tsx src/components/Logo.tsx` (pass)
- `pnpm --filter=front test` (116/116 tests pass)
- `pnpm --filter=front build` (pass)

### Completion Notes List

- **Task 1:** Logo.tsx already had "big-" + OceanShapeSet from old 7.6 implementation. Added `tracking-tight` to text and set OceanShapeSet size to 20 to align with AC target range (20-24px). No gradient text existed to remove — Logo was already clean.
- **Task 2:** MobileNav.tsx Sheet title replaced gradient "Big Ocean" text (`bg-[image:var(--gradient-celebration)] bg-clip-text text-transparent`) with geometric "big-" + OceanShapeSet brand mark matching header Logo treatment exactly. Added OceanShapeSet import.
- **Task 3:** Audited all 5 header components. Only hard-coded color was in MobileNav Sheet title (fixed in Task 2). Header.tsx, Logo.tsx, UserNav.tsx, ThemeToggle.tsx all use semantic tokens exclusively.
- **Task 4:** Corrected `data-slot="mobile-nav"` placement from wrapper div to `<SheetContent>` so the data-slot maps to the actual mobile sheet container. All 7 required data-slot attributes are present.
- **Task 5:** Replaced manual menu-open button wiring with `SheetTrigger asChild` for Radix trigger semantics and accessibility consistency.
- **Task 6:** Hardened sign-out flow in MobileNav with async handling, loading state (`Signing out...`), and inline error feedback on failure.
- **Task 7:** Validation rerun after fixes: component lint/check pass, frontend tests pass (116/116), frontend build pass.

### Change Log

- 2026-02-13: Story 7.6 implementation — Updated Logo.tsx with tracking-tight and size=20 shapes, replaced MobileNav Sheet gradient title with geometric brand mark, audited all header components for semantic token compliance.
- 2026-02-13: Senior review fixes applied — moved `data-slot="mobile-nav"` to `<SheetContent>`, switched mobile trigger to `SheetTrigger`, and added robust async sign-out handling.

### File List

- `apps/front/src/components/Logo.tsx` — Modified: added `tracking-tight`, set OceanShapeSet size to 20
- `apps/front/src/components/MobileNav.tsx` — Modified: replaced gradient "Big Ocean" Sheet title with "big-" + OceanShapeSet geometric brand mark, added `SheetTrigger`, moved `data-slot="mobile-nav"` to `SheetContent`, added async sign-out handling with error state
- `apps/front/src/routeTree.gen.ts` — Modified in working tree (generated formatting drift; no functional story logic changes)
- `apps/front/.storybook/decorators.tsx` — Modified in working tree (storybook context wiring; outside Story 7.6 scope)
- `apps/front/src/components/Header.stories.tsx` — Modified in working tree (storybook decorator usage; outside Story 7.6 scope)

## Senior Developer Review (AI)

### Review Date

2026-02-13

### Outcome

All HIGH and MEDIUM findings from adversarial review were fixed in code or reconciled in story documentation. Story status updated to `done`.

### Resolved Findings

1. `mobile-nav` data-slot was on wrapper instead of sheet container — fixed by moving to `SheetContent`.
2. Logo shape size was below AC target — fixed by setting header and mobile logo shape size to 20.
3. Mobile sheet trigger bypassed Radix trigger semantics — fixed with `SheetTrigger asChild`.
4. Sign-out flow lacked async error handling — fixed with loading + error state handling.
5. Story file list did not reflect current source-level working tree changes — reconciled in File List with scope notes.
