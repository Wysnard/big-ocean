# Story 7.3: Dark Mode Toggle with System Preference Detection

Status: done

## Story

As a **User**,
I want **to switch between light and dark themes, where dark mode feels like a distinct personality — the deep-ocean version**,
So that **I can use the app comfortably in any lighting condition and experience the brand's dual personality**.

## Acceptance Criteria

1. **Given** I visit the application for the first time **When** my system is set to dark mode **Then** the app renders in dark mode automatically (Abyss Navy, Teal primary, Gold accents) **And** no flash of light mode occurs (SSR-safe)
2. **Given** I click the theme toggle button **When** the toggle activates **Then** the theme switches immediately (light <-> dark) **And** my preference is persisted to localStorage **And** the toggle icon reflects current theme (sun/moon/monitor) **And** the color personality shifts completely (not just inverted)
3. **Given** I have a saved theme preference **When** I return to the application **Then** my saved preference is applied **And** system preference is overridden by my choice
4. **Given** I change my OS dark/light mode preference **When** my app theme is set to "system" **Then** the app updates to match my new OS preference without a page reload
5. **Given** the ThemeProvider wraps the app **When** the page is SSR-rendered **Then** there is no hydration mismatch warning **And** the theme script runs before React hydration

## Tasks / Subtasks

- [x] Task 1: Verify ThemeProvider wraps app in `__root.tsx` (AC: #5)
  - [x] Confirm `<ThemeProvider>` wraps Header and children in RootDocument
  - [x] Confirm `suppressHydrationWarning` on `<html>` element
  - [x] Confirm `ScriptOnce` injects flash prevention script
- [x] Task 2: Verify `useTheme` hook returns correct interface (AC: #1, #2, #3, #4)
  - [x] Returns `{ userTheme, appTheme, setTheme }`
  - [x] `UserTheme = "light" | "dark" | "system"`
  - [x] System preference detection via `matchMedia('prefers-color-scheme: dark')`
  - [x] Live listener updates theme when OS preference changes in "system" mode
  - [x] Manual choices (light/dark) unaffected by OS changes
- [x] Task 3: Verify theme toggle cycles through 3 states (AC: #2)
  - [x] Cycle order: system -> light -> dark -> system
  - [x] Sun icon for light mode, Moon for dark, Monitor for system
  - [x] `aria-label` describes current mode and next action
  - [x] `data-slot="theme-toggle"` attribute present
- [x] Task 4: Verify localStorage persistence (AC: #3)
  - [x] Key: `big-ocean-theme`
  - [x] Valid values: `"light"`, `"dark"`, `"system"`
  - [x] Missing/invalid values default to `"system"`
- [x] Task 5: Verify flash prevention (AC: #1, #5)
  - [x] Inline script checks localStorage before React hydration
  - [x] `.dark` class applied to `<html>` before first paint
  - [x] Fallback to `matchMedia` if localStorage fails
- [x] Task 6: Verify dark mode tokens render correctly (AC: #1)
  - [x] Dark primary: Saturated Teal `#00D4C8`
  - [x] Dark secondary: Rich Gold `#FFB830`
  - [x] Dark background: Abyss Navy `#0A0E27`
  - [x] Dark surfaces: Deep Navy `#141838`
  - [x] Dark mode feels like distinct personality ("deep-ocean"), not inverted light
- [x] Task 7: Verify mobile theme toggle (AC: #2)
  - [x] Mobile nav sheet includes theme toggle with same 3-state cycling
  - [x] Shows "Theme: Auto/Light/Dark" label text
  - [x] Touch target >= 44px

## Dev Notes

### CRITICAL: This Feature Is Already Fully Implemented

All Story 7.3 acceptance criteria are met by existing code. The dark mode toggle was implemented during the old Epic 7 Story 7.2 (before epic renumbering) and the header story (7.6). No new code changes are required.

**Existing Implementation:**

| Component | File | Status |
|-----------|------|--------|
| `useTheme` hook | `packages/ui/src/hooks/use-theme.ts` | Complete |
| `ThemeContext` + `useThemeProvider` | `packages/ui/src/hooks/use-theme.ts` | Complete |
| `themeScript` (flash prevention) | `packages/ui/src/hooks/use-theme.ts` | Complete |
| `ThemeProvider` wrapper | `apps/front/src/components/ThemeProvider.tsx` | Complete |
| `ThemeToggle` button (3-state) | `apps/front/src/components/ThemeToggle.tsx` | Complete |
| Mobile theme toggle | `apps/front/src/components/MobileNav.tsx` | Complete |
| Root layout integration | `apps/front/src/routes/__root.tsx` | Complete |
| Light mode tokens (Psychedelic) | `packages/ui/src/styles/globals.css` `:root` | Complete (Story 7.1) |
| Dark mode tokens (Abyss) | `packages/ui/src/styles/globals.css` `.dark` | Complete (Story 7.1) |

### How It Works

**Theme Resolution Chain:**
1. `themeScript` runs inline before React hydration (via `ScriptOnce`)
2. Reads `localStorage.getItem('big-ocean-theme')` — defaults to `"system"` if missing
3. If `"system"`, checks `matchMedia('(prefers-color-scheme:dark)')` for OS preference
4. Applies `.dark` class to `<html>` element immediately — no flash
5. React hydrates with `ThemeProvider` wrapping the app
6. `useThemeProvider` hook initializes state from localStorage
7. System preference listener registered only when `userTheme === "system"`

**Three-State Toggle:**
```
system (Monitor icon) → light (Sun icon) → dark (Moon icon) → system
```

**CSS Architecture:**
- `@custom-variant dark (&:is(.dark *));` — Tailwind v4 dark mode
- `:root` block defines light mode tokens (Psychedelic Celebration palette)
- `.dark` block defines dark mode tokens (Abyss Deep-Ocean palette)
- Components use semantic variables (`bg-primary`, `text-foreground`) — auto-switch

### Key Files (No Changes Needed)

| File | Role |
|------|------|
| `packages/ui/src/hooks/use-theme.ts` | Hook: 3 modes, localStorage, matchMedia listener, flash script |
| `apps/front/src/components/ThemeProvider.tsx` | Context provider + ScriptOnce injection |
| `apps/front/src/components/ThemeToggle.tsx` | 3-state cycling toggle with Sun/Moon/Monitor icons |
| `apps/front/src/components/MobileNav.tsx` | Mobile theme toggle with label text |
| `apps/front/src/components/Header.tsx` | Renders ThemeToggle in desktop nav |
| `apps/front/src/routes/__root.tsx` | ThemeProvider wraps app, suppressHydrationWarning |
| `packages/ui/src/styles/globals.css` | `:root` + `.dark` token definitions |

### Anti-Patterns

```
DO NOT create a new ThemeProvider — one already exists
DO NOT use next-themes — incompatible with TanStack Start
DO NOT modify globals.css — color tokens are already correct from Story 7.1
DO NOT use dangerouslySetInnerHTML — ScriptOnce is already in place
DO NOT store theme in cookies — localStorage is the chosen approach
DO NOT use dark:/hidden Tailwind classes for icon switching — use userTheme state
```

### Testing Approach

No new code changes needed. Verification is visual:
1. `pnpm build --filter=front` — confirm no build errors
2. `pnpm test:run` — confirm no regressions
3. Visual check: toggle cycles through 3 states with correct icons
4. Visual check: dark mode shows Abyss Navy + Teal + Gold palette
5. Visual check: no flash of wrong theme on page load

### Previous Story Intelligence

**From Story 7.1 (Psychedelic Brand Design Tokens):**
- Hex-based psychedelic palette fully in place: Celebration (light) / Abyss Deep-Ocean (dark)
- Gradient variables defined: `--gradient-celebration`, `--gradient-progress`, `--gradient-surface-glow`
- WCAG AA contrast verified for both modes
- All semantic tokens updated — components auto-switch via CSS variables

**From Story 7.2 (Typography System):**
- Google Fonts loaded via `<link>` tags in `__root.tsx`
- Font tokens work identically in both light and dark modes (fonts don't change)

### Project Structure Notes

- ThemeToggle lives in `apps/front/src/components/` (app-specific)
- useTheme hook lives in `packages/ui/src/hooks/` (shared UI package)
- ThemeProvider is app-specific (uses TanStack Router's `ScriptOnce`)
- This follows the pattern: shared hooks in `packages/ui`, app-specific wiring in `apps/front`

### References

- [Epic 7 Specification: Story 7.3](/_bmad-output/planning-artifacts/epics/epic-7-ui-theme-visual-identity.md#story-73-dark-mode-toggle-with-system-preference-detection) — Full spec
- [Story 7.1 (completed)](/_bmad-output/implementation-artifacts/7-1-psychedelic-brand-design-tokens.md) — Color tokens
- [Story 7.2 (completed)](/_bmad-output/implementation-artifacts/7-2-typography-system.md) — Typography
- [Old Story 7.2 (dark mode)](/_bmad-output/implementation-artifacts/7-2-add-dark-mode-toggle-with-system-preference-detection.md) — Original implementation record
- [FRONTEND.md](/docs/FRONTEND.md) — Component conventions, data-slot attributes
- [use-theme.ts](/packages/ui/src/hooks/use-theme.ts) — Hook implementation
- [ThemeToggle.tsx](/apps/front/src/components/ThemeToggle.tsx) — Toggle component
- [ThemeProvider.tsx](/apps/front/src/components/ThemeProvider.tsx) — Provider component
- [__root.tsx](/apps/front/src/routes/__root.tsx) — Root layout integration

## Dev Agent Record

### Agent Model Used

N/A — No implementation needed. Feature already complete from old Story 7.2 + Story 7.6.

### Debug Log References

Previous implementation verified:
- Build: `pnpm build --filter=front` — 0 errors
- Tests: `pnpm test:run` — all pass
- Lint: `pnpm lint` — no new warnings

### Completion Notes List

- All acceptance criteria already met by existing code
- ThemeProvider wraps app in `__root.tsx` with `suppressHydrationWarning`
- `useTheme` hook supports light/dark/system with `matchMedia` listener
- ThemeToggle cycles through 3 states (system/light/dark) with Sun/Moon/Monitor icons
- Flash prevention via inline `ScriptOnce` script
- localStorage persistence with key `big-ocean-theme`
- Dark mode renders Abyss Navy + Teal + Gold (Psychedelic palette from Story 7.1)
- Mobile theme toggle in MobileNav sheet with label text
- SSR-compatible via TanStack Start's ScriptOnce

### File List

No files modified — implementation already exists from previous stories.

| Status | File |
|--------|------|
| EXISTS | `packages/ui/src/hooks/use-theme.ts` |
| EXISTS | `apps/front/src/components/ThemeProvider.tsx` |
| EXISTS | `apps/front/src/components/ThemeToggle.tsx` |
| EXISTS | `apps/front/src/components/MobileNav.tsx` |
| EXISTS | `apps/front/src/components/Header.tsx` |
| EXISTS | `apps/front/src/routes/__root.tsx` |
| EXISTS | `packages/ui/src/styles/globals.css` |

## Change Log

- 2026-02-13: Story file created for rewritten Epic 7 Story 7.3. Feature already fully implemented under old Epic 7 Story 7.2 numbering. No new code changes required.
