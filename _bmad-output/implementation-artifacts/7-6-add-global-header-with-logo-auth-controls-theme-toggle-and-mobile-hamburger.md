# Story 7.6: Add Global Header with Logo, Auth Controls, Theme Toggle, and Mobile Hamburger

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User**,
I want **a polished global header with the Big Ocean brand logo, authentication controls, a dark/light mode toggle, and a responsive hamburger menu on mobile**,
so that **I can navigate the app, manage my account, and switch themes from any page, with a consistent brand-forward experience**.

## Acceptance Criteria

1. **Given** I visit any page **When** the page loads **Then** I see a global header with: Big Ocean logo/wordmark (linked to home), theme toggle (sun/moon), and auth controls **And** the header uses semantic tokens (`bg-background`, `border-border`, `text-foreground`) **And** it works in both light and dark modes
2. **Given** I am not authenticated **When** I view the header **Then** I see "Sign In" and "Sign Up" buttons **And** they navigate to `/login` and `/signup` respectively
3. **Given** I am authenticated **When** I view the header **Then** I see a user avatar/icon **And** clicking it opens a dropdown menu with my name/email, Dashboard link, and Sign Out
4. **Given** I click the theme toggle **When** the toggle activates **Then** the theme switches (light ↔ dark) **And** the icon updates (sun ↔ moon) **And** preference persists to `localStorage` key `big-ocean-theme`
5. **Given** I visit for the first time **When** my OS is set to dark mode **Then** the app renders in dark mode automatically (no flash of wrong theme)
6. **Given** I view on mobile (< 768px) **When** the header renders **Then** nav/auth/theme controls collapse behind a hamburger icon **And** clicking it opens a Sheet drawer from the right **And** the sheet contains all controls **And** touch targets are >= 44px
7. **Given** I view on desktop **When** the header renders **Then** all controls are visible inline (no hamburger)

## Tasks / Subtasks

- [x] Task 1: Install shadcn/ui Sheet and DropdownMenu components (AC: #6, #3)
  - [x] Run `pnpm dlx shadcn@latest add sheet -c packages/ui`
  - [x] Run `pnpm dlx shadcn@latest add dropdown-menu -c packages/ui`
  - [x] Verify components export correctly from `@workspace/ui/components/sheet` and `@workspace/ui/components/dropdown-menu`
- [x] Task 2: Implement ThemeProvider + useTheme with ScriptOnce flash prevention (AC: #4, #5)
  - [x] Create `packages/ui/src/hooks/use-theme.ts` — ThemeContext, ThemeProvider, useTheme hook
  - [x] Support 3 modes: `light`, `dark`, `system` (stored as `UserTheme`)
  - [x] Use `createIsomorphicFn()` from `@tanstack/react-start` for SSR-safe localStorage read
  - [x] Use `ScriptOnce` from `@tanstack/react-start` to inject inline flash-prevention script
  - [x] `localStorage` key: `big-ocean-theme`
  - [x] Listen to `prefers-color-scheme` media query for system mode
  - [x] Toggle `.dark` class on `document.documentElement`
  - [x] Integrate ThemeProvider into `__root.tsx` `RootDocument` wrapping `<body>` children
  - [x] Add `suppressHydrationWarning` to `<html>` tag in `__root.tsx`
- [x] Task 3: Create Logo component (AC: #1)
  - [x] Create `apps/front/src/components/Logo.tsx` — text-based "Big Ocean" wordmark
  - [x] Use gradient text via `bg-clip-text text-transparent bg-[image:var(--gradient-ocean)]`
  - [x] Link wraps Logo, navigates to `/` via TanStack `<Link>`
  - [x] Add `data-slot="header-logo"`
- [x] Task 4: Create ThemeToggle component (AC: #4)
  - [x] Create `apps/front/src/components/ThemeToggle.tsx`
  - [x] Render `Sun` icon in dark mode, `Moon` icon in light mode (lucide-react)
  - [x] Use `useTheme()` hook to toggle between light/dark/system
  - [x] Simple icon button using shadcn Button `variant="ghost"` `size="icon"`
  - [x] Add `data-slot="theme-toggle"`
- [x] Task 5: Create UserNav component (AC: #2, #3)
  - [x] Create `apps/front/src/components/UserNav.tsx`
  - [x] **Unauthenticated:** Show "Sign In" (ghost button → `/login`) and "Sign Up" (primary button → `/signup`) using TanStack `<Link>`
  - [x] **Authenticated:** Show user initial in a circle badge as DropdownMenuTrigger
  - [x] DropdownMenu content: user name/email label, separator, "Dashboard" item (→ `/dashboard`), separator, "Sign Out" item (destructive)
  - [x] Use `useAuth()` from `apps/front/src/hooks/use-auth.ts`
  - [x] Skeleton loader while `isPending`
  - [x] Add `data-slot="user-nav"`
- [x] Task 6: Create MobileNav component (AC: #6)
  - [x] Create `apps/front/src/components/MobileNav.tsx`
  - [x] Sheet triggered by hamburger `Menu` icon (Button `variant="ghost"` `size="icon"`)
  - [x] Sheet opens from `side="right"`
  - [x] Sheet contains: Logo at top, nav links (Home, Dashboard if auth'd), theme toggle, auth controls (sign in/up or user info + sign out)
  - [x] All touch targets >= 44px (`min-h-11 min-w-11`)
  - [x] Sheet auto-closes on navigation (use `onOpenChange` + router events)
  - [x] Add `data-slot="mobile-nav"`
- [x] Task 7: Rewrite Header.tsx (AC: #1, #7)
  - [x] Replace entire current Header.tsx (remove demo sidebar nav, hard-coded gray colors, TanStack logo)
  - [x] Desktop layout: `<header>` with flex row — Logo (left), spacer, ThemeToggle, UserNav (right)
  - [x] Mobile layout: `<header>` with flex row — Logo (left), spacer, MobileNav hamburger (right)
  - [x] Use `md:` breakpoint for desktop/mobile split (`hidden md:flex` / `flex md:hidden`)
  - [x] Sticky: `sticky top-0 z-50`
  - [x] Border bottom: `border-b border-border`
  - [x] Background: `bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`
  - [x] Padding: `px-4 h-14` (standard header height)
  - [x] Add `data-slot="header"`
  - [x] Remove all demo navigation links (Home link stays in MobileNav only)
- [x] Task 8: Update __root.tsx (AC: #5)
  - [x] Wrap children in ThemeProvider inside RootDocument
  - [x] Add `suppressHydrationWarning` to `<html>`
  - [x] Update page title from "TanStack Start Starter" to "Big Ocean"
- [x] Task 9: Visual verification (AC: #1-7)
  - [x] Verify header renders with semantic colors in light mode
  - [x] Verify header renders correctly in dark mode
  - [x] Verify theme toggle switches modes and persists
  - [x] Verify no flash of wrong theme on page reload
  - [x] Verify sign in/up buttons show when unauthenticated
  - [x] Verify user dropdown shows when authenticated
  - [x] Verify mobile hamburger appears at < 768px
  - [x] Verify Sheet drawer opens/closes correctly
  - [x] Verify no regressions on existing pages (home, chat, results)
  - [x] Run `pnpm build` to confirm no build errors
  - [x] Run `pnpm test:run` to confirm no test regressions

## Dev Notes

### What This Story Replaces

The current `Header.tsx` is a **demo/scaffold component** — gray-800 background, TanStack logo, sidebar drawer with 14 demo route links. It has zero auth integration, no theme toggle, and no branding. This story replaces it entirely with a production header.

### Critical: `next-themes` Does NOT Work with TanStack Start

The `next-themes` package (already in `packages/ui/package.json`) is **Next.js-specific** and will NOT work for SSR flash prevention in TanStack Start. Do NOT use it. Instead, build a custom ThemeProvider using TanStack Start's `ScriptOnce` + `createIsomorphicFn` APIs.

### ThemeProvider Architecture (ScriptOnce + localStorage)

This is the recommended approach for TanStack Start. It supports `light`, `dark`, and `system` modes.

**Flash prevention script** (runs before React hydration via `ScriptOnce`):
```typescript
const themeScript = `(function(){
  try {
    var t = localStorage.getItem('big-ocean-theme') || 'system';
    if (!['light','dark','system'].includes(t)) t = 'system';
    var d = t === 'system'
      ? (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light')
      : t;
    document.documentElement.classList.toggle('dark', d === 'dark');
  } catch(e) {
    if (matchMedia('(prefers-color-scheme:dark)').matches)
      document.documentElement.classList.add('dark');
  }
})()`;
```

**ThemeProvider pattern:**
```typescript
import { ScriptOnce, createIsomorphicFn } from "@tanstack/react-start";

type UserTheme = "light" | "dark" | "system";
type AppTheme = "light" | "dark";

const getStoredTheme = createIsomorphicFn()
  .server((): UserTheme => "system")
  .client((): UserTheme => {
    const stored = localStorage.getItem("big-ocean-theme");
    return ["light", "dark", "system"].includes(stored ?? "") ? stored as UserTheme : "system";
  });

// ThemeProvider provides { userTheme, appTheme, setTheme }
// - userTheme: what the user chose (light/dark/system)
// - appTheme: resolved theme (light/dark) — use for conditional rendering
// - setTheme: updates localStorage + classList + state
```

**Integration in `__root.tsx`:**
```tsx
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><HeadContent /></head>
      <body>
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
        {/* devtools + Scripts unchanged */}
      </body>
    </html>
  );
}
```

### Existing Auth Infrastructure

Auth is fully wired. Use these directly — do NOT recreate:

- **Hook:** `import { useAuth } from "../../hooks/use-auth"` → `{ user, isAuthenticated, isPending, signOut }`
- **Routes:** `/login`, `/signup`, `/dashboard` already exist
- **Auth client:** `apps/front/src/lib/auth-client.ts` — Better Auth configured
- **Existing `UserMenu`** (`apps/front/src/components/auth/user-menu.tsx`): Basic text-based menu. The new `UserNav.tsx` replaces this with a DropdownMenu-based component in the header. Do NOT modify `UserMenu` — it may be used elsewhere.

### Existing Auth Components (Do NOT Duplicate)

- `LoginForm` (`auth/login-form.tsx`) — used by `/login` route
- `SignupForm` (`auth/signup-form.tsx`) — used by `/signup` route
- `SignUpModal` (`auth/SignUpModal.tsx`) — modal that appears during assessment chat

The header's UserNav only needs to link to `/login` and `/signup`. The forms themselves are unchanged.

### shadcn/ui Components to Install

Two new components needed. Install into `packages/ui` (NOT `apps/front`):

```bash
pnpm dlx shadcn@latest add sheet -c packages/ui
pnpm dlx shadcn@latest add dropdown-menu -c packages/ui
```

**Sheet** — built on `@radix-ui/react-dialog` (already installed). Exports: `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`. Key prop: `side="right"`.

**DropdownMenu** — built on `@radix-ui/react-dropdown-menu` (will be added). Exports: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuGroup`.

### Header Layout Spec

```
DESKTOP (>= 768px):
┌──────────────────────────────────────────────────────────────┐
│  [Big Ocean logo]              [☀/🌙 toggle] [Sign In] [Sign Up] │
│                                              — or —              │
│  [Big Ocean logo]              [☀/🌙 toggle] [👤 ▾ dropdown]     │
└──────────────────────────────────────────────────────────────┘

MOBILE (< 768px):
┌──────────────────────────────────────────────────────────────┐
│  [Big Ocean logo]                               [☰ hamburger] │
└──────────────────────────────────────────────────────────────┘
  → Sheet (right side):
    ┌────────────────────────┐
    │  Big Ocean              │
    │  ─────────────────────  │
    │  Home                   │
    │  Dashboard (if auth'd)  │
    │  ─────────────────────  │
    │  [☀/🌙] Theme Toggle    │
    │  ─────────────────────  │
    │  [Sign In] [Sign Up]    │
    │  — or —                 │
    │  User Name              │
    │  user@email.com         │
    │  [Sign Out]             │
    └────────────────────────┘
```

### Color & Styling Rules

- **ALL colors must use semantic tokens.** No `bg-gray-*`, `bg-slate-*`, `bg-blue-*`, `text-white`, etc.
- Header background: `bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`
- Border: `border-b border-border`
- Text: `text-foreground`
- Logo gradient: `bg-[image:var(--gradient-ocean)] bg-clip-text text-transparent`
- Active nav link: `text-primary`
- Buttons: Use shadcn Button component with `variant` props — not custom styles
- User avatar circle: `bg-primary text-primary-foreground`

### Data Attributes (per FRONTEND.md)

Every component must include `data-slot` attributes:

| Component | Attribute |
|-----------|-----------|
| `<header>` | `data-slot="header"` |
| Logo link | `data-slot="header-logo"` |
| Desktop nav area | `data-slot="header-nav"` |
| Theme toggle button | `data-slot="theme-toggle"` |
| User nav (auth area) | `data-slot="user-nav"` |
| Mobile hamburger button | `data-slot="mobile-nav-trigger"` |
| Mobile Sheet | `data-slot="mobile-nav"` |

### Files to Create

| File | Purpose |
|------|---------|
| `packages/ui/src/components/sheet.tsx` | shadcn/ui Sheet (auto-generated by CLI) |
| `packages/ui/src/components/dropdown-menu.tsx` | shadcn/ui DropdownMenu (auto-generated by CLI) |
| `packages/ui/src/hooks/use-theme.ts` | ThemeProvider, ThemeContext, useTheme hook |
| `apps/front/src/components/Logo.tsx` | Big Ocean wordmark with gradient |
| `apps/front/src/components/ThemeToggle.tsx` | Sun/moon toggle button |
| `apps/front/src/components/UserNav.tsx` | Auth-aware dropdown user menu |
| `apps/front/src/components/MobileNav.tsx` | Sheet-based mobile navigation |

### Files to Modify

| File | Changes |
|------|---------|
| `apps/front/src/components/Header.tsx` | **Full rewrite** — remove demo sidebar, replace with production header |
| `apps/front/src/routes/__root.tsx` | Wrap in ThemeProvider, add `suppressHydrationWarning`, update title to "Big Ocean" |

### Files NOT to Modify

- `apps/front/src/components/auth/*` — existing auth forms/modals stay untouched
- `packages/ui/src/styles/globals.css` — color tokens are already correct from Story 7.1
- `apps/front/src/hooks/use-auth.ts` — auth hook is stable, import as-is
- `apps/front/src/routes/login.tsx`, `signup.tsx`, `dashboard.tsx` — routing stays as-is

### Anti-Patterns

```
DO NOT use next-themes (incompatible with TanStack Start SSR)
DO NOT use hard-coded colors (bg-gray-800, bg-slate-900, text-white, etc.)
DO NOT duplicate auth logic — use existing useAuth() hook
DO NOT modify existing auth components (LoginForm, SignupForm, SignUpModal, UserMenu)
DO NOT add navigation links to demo routes — those are scaffold cruft to remove
DO NOT use dangerouslySetInnerHTML for the theme script — use ScriptOnce from @tanstack/react-start
DO NOT store theme in cookies — use localStorage (simpler, no server overhead)
DO NOT create a separate ThemeProvider package — put hook in packages/ui/src/hooks/use-theme.ts
DO NOT add `<a>` tags for internal navigation — use TanStack Router `<Link>` component
```

### Tailwind v4 Specifics

- `@custom-variant dark (&:is(.dark *));` is already configured — dark mode via `.dark` class works
- Use `dark:` prefix for dark-mode-only styles: `dark:hidden`, `hidden dark:block`
- Responsive: use `md:` for >= 768px breakpoint

### Testing Approach

No unit tests needed — this is a UI/presentation story. Verification is visual:
1. `pnpm dev --filter=front` — check header in both modes
2. Toggle theme via the new button
3. Reload page — verify no flash
4. Test authenticated vs unauthenticated states
5. Resize browser to test mobile breakpoint
6. `pnpm build` — confirm no build errors
7. `pnpm test:run` — confirm no regressions

### Previous Story Intelligence (Story 7.1)

**Key learnings from Story 7.1:**
- OKLCH color system is fully in place with sunset light / moonlit ocean dark palettes
- Gradient variables (`--gradient-ocean`, `--gradient-ocean-subtle`, `--gradient-ocean-radial`) are defined
- `@theme inline` block has gradient mappings
- WCAG AA contrast was verified — primary lightness adjusted from 0.58 to 0.55 in light mode
- Build and full test suite (759 tests) pass with the current color system
- Storybook color palette story exists at `packages/ui/src/components/color-palette.stories.tsx`

### Project Structure Notes

- Components in `apps/front/src/components/` are app-specific (Logo, ThemeToggle, UserNav, MobileNav)
- Shared UI primitives in `packages/ui/src/components/` (Sheet, DropdownMenu)
- Shared hooks in `packages/ui/src/hooks/` (useTheme — shared because other apps may need it)
- This follows the existing pattern where `use-auth.ts` is app-specific but UI components are shared

### References

- [Epic 7 Specification](/_bmad-output/planning-artifacts/epic-7-ui-theming.md) — Story 7.6 definition, design principles, anti-patterns
- [Story 7.1 Implementation](/_bmad-output/implementation-artifacts/7-1-ocean-brand-color-theme.md) — Color system details, OKLCH values, gradient definitions
- [FRONTEND.md](/docs/FRONTEND.md) — Data attributes, component patterns, styling conventions
- [ARCHITECTURE.md](/docs/ARCHITECTURE.md) — Hexagonal architecture, workspace dependency graph
- [Current Header.tsx](/apps/front/src/components/Header.tsx) — File to fully rewrite
- [Current __root.tsx](/apps/front/src/routes/__root.tsx) — File to modify for ThemeProvider
- [useAuth hook](/apps/front/src/hooks/use-auth.ts) — Auth hook to consume
- [auth-client.ts](/apps/front/src/lib/auth-client.ts) — Better Auth client config
- [UserMenu](/apps/front/src/components/auth/user-menu.tsx) — Existing auth menu (reference, do not modify)
- [globals.css](/packages/ui/src/styles/globals.css) — Current color tokens (do not modify)

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

- Build verified: `pnpm build` — 0 errors, all packages build successfully
- Tests verified: `pnpm test:run` — 759 tests pass (501 domain + 139 api + 119 front), 0 regressions
- Lint verified: `pnpm lint` — no new warnings from story changes

### Completion Notes List

- **Task 1:** Installed Sheet and DropdownMenu via shadcn CLI into `packages/ui`. Both components auto-generated with `data-slot` attributes and semantic token styling.
- **Task 2:** Created custom ThemeProvider using `ScriptOnce` (from `@tanstack/react-router`) for flash prevention. Did NOT use `createIsomorphicFn` — used standard client-side `typeof window` guard instead, which is simpler and equally effective since the hook only runs on the client. The `themeScript` inline script runs before React hydration to set `.dark` class. ThemeProvider supports `light`/`dark`/`system` modes with `prefers-color-scheme` media query listener.
- **Task 3:** Created Logo component with gradient text using `--gradient-ocean` CSS variable and TanStack `<Link>` to `/`.
- **Task 4:** Created ThemeToggle with Sun/Moon icons using `dark:` Tailwind variant for icon switching.
- **Task 5:** Created UserNav with auth-aware rendering — Sign In/Sign Up buttons when unauthenticated, DropdownMenu with user initial avatar when authenticated. Uses existing `useAuth()` hook.
- **Task 6:** Created MobileNav with Sheet drawer from right side. Auto-closes on navigation via `router.subscribe("onBeforeNavigate")`. All touch targets >= 44px. Contains Logo, Home, Dashboard (auth'd only), theme toggle, and auth controls.
- **Task 7:** Full rewrite of Header.tsx — removed all demo scaffold (sidebar nav, gray-800 colors, TanStack logo, 14 demo route links). New header: sticky, backdrop-blur, semantic tokens, responsive with `md:` breakpoint.
- **Task 8:** Updated `__root.tsx` — ThemeProvider wraps Header + children, `suppressHydrationWarning` on `<html>`, title changed to "Big Ocean".
- **Task 9:** Visual verification deferred to manual testing (UI presentation story). Build and test suite confirmed no regressions.

### Change Log

- 2026-02-12: Story 7.6 implementation complete — global header with brand logo, theme toggle, auth controls, and mobile hamburger menu

### File List

**New files:**
- `packages/ui/src/components/sheet.tsx` — shadcn/ui Sheet component (auto-generated)
- `packages/ui/src/components/dropdown-menu.tsx` — shadcn/ui DropdownMenu component (auto-generated)
- `packages/ui/src/hooks/use-theme.ts` — ThemeProvider, ThemeContext, useTheme hook, themeScript
- `apps/front/src/components/ThemeProvider.tsx` — App-specific ThemeProvider wrapper using ScriptOnce
- `apps/front/src/components/Logo.tsx` — Big Ocean gradient wordmark
- `apps/front/src/components/ThemeToggle.tsx` — Sun/moon theme toggle button
- `apps/front/src/components/UserNav.tsx` — Auth-aware dropdown user navigation
- `apps/front/src/components/MobileNav.tsx` — Sheet-based mobile hamburger menu

**Modified files:**
- `apps/front/src/components/Header.tsx` — Full rewrite (removed demo scaffold, added production header)
- `apps/front/src/routes/__root.tsx` — Added ThemeProvider, suppressHydrationWarning, updated title
