# Epic 7: UI Theme & Visual Identity

**Phase:** 1 (MVP Visual Identity)

**Goal:** Establish big-ocean's distinctive psychedelic-bold visual identity — a warm, saturated, personality-celebrating design system with OCEAN geometric shapes, dual light/dark personalities, custom typography, illustration system, immersive page experiences, auth-gated results reveal, shareable public profiles, and registered user dashboard that make personality discovery feel like a celebration.

**Dependencies:**
- Epic 4 (Frontend Assessment UI) — base components exist
- Epic 5 (Results & Profiles) — visualization surfaces ready

**Enables:** Brand differentiation, archetype virality (shareable visuals), user trust through polished experience, accessibility compliance, auth conversion at peak engagement

**User Value:** A visually bold, memorable experience that celebrates personality discovery — not clinical data readout. Users feel proud of their results and want to share them. Authentication gate at the moment of peak engagement converts anonymous users. Profile page provides a home base for returning users.

---

## Overview

The new UX Design Specification defines a **psychedelic, bold, saturated** visual identity that is fundamentally different from default shadcn/ui. This epic transforms the entire visual layer:

1. **Psychedelic brand color system** — Electric Pink, Vivid Orange, Saturated Teal (not calm ocean blue)
2. **Dark mode as personality shift** — Abyss Navy + Teal + Gold bioluminescence (not inverted light mode)
3. **Typography system** — Space Grotesk (headings), DM Sans (body), JetBrains Mono (data)
4. **OCEAN Geometric Identity** — 5 shapes (Circle, Half-Circle, Rectangle, Triangle, Diamond) as brand mark, data viz, and personal identity
5. **Big Five trait colors** — Purple, Orange, Pink, Teal, Navy with geometric shape per trait
6. **Color block composition** — Hard-edged geometric shapes on hero surfaces (not blended gradients)
7. **Illustration system** — Diver character (Nerin), ocean icon set, decorative SVGs
8. **Credibility gradient pattern** — Psychedelic (top) -> Scientific (bottom) page transitions
9. **Immersive chat experience** — Visual calm during conversation, celebration at milestones
10. **Organic data visualization** — Wave-form score bars, constellation maps
11. **Auth-gated results reveal** — Sign-up conversion at peak engagement moment
12. **Shareable public profile** — Social share cards with OG meta for viral loop
13. **Registered user profile page** — Dashboard with assessment history and navigation
14. **Chat-results navigation** — Bidirectional linking between chat and results

---

## Design Principles

### 1. Psychedelic Bold Over Conservative Minimalism

This is a consumer personality platform, not enterprise software. Colors are unapologetically vibrant. Design celebrates self-discovery as an achievement worth visualizing beautifully.

### 2. Dual Color Modes by Intent

- **Celebration contexts** (results reveal, milestones, share cards): Complementary vibrating pairs — Electric Pink on Teal, Orange on Navy. Visually intense, screenshot-worthy.
- **Reading contexts** (chat interface, facet details, evidence panels): Analogous harmonious pairs — comfortable contrast, optimized for 30+ minute sessions.

### 3. Credibility Gradient Pattern

Pages transition from emotional (top) to scientific (bottom):
- **Hero / Top:** Maximum psychedelic — color blocks, bold shapes, display typography
- **Middle / Overview:** Balanced — structured layout with colorful accents
- **Deep / Detail:** Scientific — clean grids, readable body type
- **Evidence / Bottom:** Precision — monospace scores, minimal decoration

### 4. OCEAN Shapes ARE the Brand

The 5 geometric shapes serve triple duty: brand mark, data visualization markers, and personal identity (Geometric Personality Signature). This isn't decoration — it's the brand's visual DNA.

### 5. Chat Interface Visual Calm

The chat screen — where users spend 30 minutes — uses the **calmest expression** of the brand. Warm Cream / Abyss Navy, no color blocks, no bold patterns. The conversation IS the experience. Psychedelic energy appears ONLY in milestone toasts and the results transition.

### 6. Auth Gate as Engagement Conversion

The moment of peak engagement (assessment complete, archetype revealed as geometric shapes) is the optimal conversion point. Show enough to hook (animated signature reveal) while gating the full results behind authentication.

---

## Story 7.1: Psychedelic Brand Design Tokens (Color + Spacing + Radius)

As a **User**,
I want **the application to have a distinctive, psychedelic-bold visual identity with vibrant colors**,
So that **the brand feels alive, memorable, and unmistakably "big-ocean" — not a default shadcn/ui app**.

**Acceptance Criteria:**

**Given** the application loads in light mode
**When** I view any page
**Then** the primary color is Electric Pink (`#FF0080`)
**And** secondary is Vivid Orange (`#FF6B2B`)
**And** tertiary is Saturated Teal (`#00B4A6`)
**And** backgrounds use Warm Cream (`#FFF8F0`)
**And** surfaces use Soft Blush (`#FFF0E8`)
**And** the palette feels bold, warm, and psychedelic

**Given** I view the application in dark mode
**When** the dark theme is active
**Then** the primary color shifts to Saturated Teal (`#00D4C8`)
**And** secondary is Rich Gold (`#FFB830`)
**And** tertiary is Hot Pink (`#FF2D9B`)
**And** backgrounds use Abyss Navy (`#0A0E27`)
**And** surfaces use Deep Navy (`#141838`)
**And** dark mode feels like a distinct personality ("deep-ocean"), not just inverted light mode

**Given** I interact with buttons, links, and focus states
**When** primary color is applied
**Then** all interactive elements use semantic variables (`bg-primary`, `text-primary-foreground`)
**And** WCAG AA contrast ratios are maintained (4.5:1 for text, 3:1 for large text)
**And** vibrating complementary pairs are reserved for non-text celebration surfaces only

**Given** I view components across the application
**When** border radius and spacing are applied
**Then** buttons and inputs use 12px radius
**And** cards use 16px radius
**And** modals/dialogs use 24px radius
**And** hero containers use 32px radius
**And** spacing follows the defined scale (4px to 96px)

**Technical Details:**

- Update `packages/ui/src/styles/globals.css` with complete new palette
- Define all tokens in both `:root` (light) and `.dark` (dark) scopes
- Define gradient tokens: celebration gradient, progress gradient, surface glow
- Content max-width 1200px
- Update `--radius` tokens to match new scale

**Light Mode Tokens:**
```css
:root {
  --primary: #FF0080;           /* Electric Pink */
  --primary-hover: #FF1493;     /* Neon Fuchsia */
  --primary-foreground: #FFFFFF;
  --secondary: #FF6B2B;         /* Vivid Orange */
  --secondary-foreground: #FFFFFF;
  --tertiary: #00B4A6;          /* Saturated Teal */
  --tertiary-foreground: #FFFFFF;
  --background: #FFF8F0;        /* Warm Cream */
  --foreground: #1A1A2E;        /* Deep Charcoal */
  --card: #FFF0E8;              /* Soft Blush */
  --card-foreground: #1A1A2E;
  --popover: #FFF0E8;
  --popover-foreground: #1A1A2E;
  --muted: #FFF0E8;
  --muted-foreground: #6B6580;  /* Warm Gray */
  --accent: #FFE8D8;            /* Light Peach */
  --accent-foreground: #1A1A2E;
  --destructive: #FF3B5C;       /* Coral Red */
  --destructive-foreground: #FFFFFF;
  --border: #FFD6C4;            /* Blush Border */
  --input: #FFD6C4;
  --ring: #FF0080;
  --success: #00C896;           /* Ocean Green */
  --warning: #FFB020;           /* Amber */

  /* Gradients */
  --gradient-celebration: linear-gradient(120deg, #FF0080, #FF1493, #FF6B2B);
  --gradient-progress: linear-gradient(90deg, #00B4A6, #00D4C8);
  --gradient-surface-glow: radial-gradient(circle, #FFF0E8, #FFF8F0);

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;

  /* Radius scale */
  --radius-button: 12px;
  --radius-input: 12px;
  --radius-card: 16px;
  --radius-dialog: 24px;
  --radius-hero: 32px;
  --radius-full: 9999px;
  --radius-chat-bubble: 16px;
  --radius-chat-sender: 4px;
}
```

**Dark Mode Tokens:**
```css
.dark {
  --primary: #00D4C8;           /* Saturated Teal */
  --primary-hover: #00EDE5;     /* Bright Teal */
  --primary-foreground: #0A0E27;
  --secondary: #FFB830;         /* Rich Gold */
  --secondary-foreground: #0A0E27;
  --tertiary: #FF2D9B;          /* Hot Pink */
  --tertiary-foreground: #FFFFFF;
  --background: #0A0E27;        /* Abyss Navy */
  --foreground: #F0EDE8;        /* Warm White */
  --card: #141838;              /* Deep Navy */
  --card-foreground: #F0EDE8;
  --popover: #141838;
  --popover-foreground: #F0EDE8;
  --muted: #141838;
  --muted-foreground: #8B85A0;  /* Muted Lavender */
  --accent: #1C2148;            /* Midnight */
  --accent-foreground: #F0EDE8;
  --destructive: #FF4D6A;       /* Neon Coral */
  --destructive-foreground: #FFFFFF;
  --border: #252A52;            /* Navy Edge */
  --input: #252A52;
  --ring: #00D4C8;
  --success: #00E0A0;           /* Mint */
  --warning: #FFB830;           /* Gold */

  /* Dark mode gradients */
  --gradient-celebration: linear-gradient(120deg, #00D4C8, #FFB830, #FF2D9B);
  --gradient-progress: linear-gradient(90deg, #00D4C8, #00EDE5);
  --gradient-surface-glow: radial-gradient(circle, #1C2148, #0A0E27);
}
```

**Dark Mode Gold Principle:** Gold is punctuation, not surface. Teal carries dark mode as primary. Gold appears exclusively at achievement moments — precision milestones, archetype reveal, premium signals. Think bioluminescence: rare, striking, meaningful.

**Acceptance Checklist:**
- [ ] All semantic tokens updated in globals.css for light and dark modes
- [ ] Components use semantic variables (`bg-primary`, not `bg-pink-500`)
- [ ] Gradient CSS variables defined for celebration, progress, and surface glow
- [ ] Spacing scale tokens defined (space-1 through space-24)
- [ ] Radius scale tokens defined (button, input, card, dialog, hero, chat-bubble)
- [ ] WCAG AA contrast verified for all text/background combinations
- [ ] Vibrating complementary pairs used only on non-text celebration surfaces
- [ ] Dark mode foreground on navy backgrounds exceeds 7:1 contrast
- [ ] Storybook documents complete color palette with light/dark comparison
- [ ] No hard-coded color classes remain in existing components

---

## Story 7.2: Typography System

As a **User**,
I want **the application to use distinctive, modern typography that feels confident and readable**,
So that **headings carry personality, body text supports long reading sessions, and data display feels precise**.

**Acceptance Criteria:**

**Given** I view any heading in the application
**When** the heading renders
**Then** it uses Space Grotesk font at the appropriate weight (500-700)
**And** headings feel geometric, modern, and distinctive

**Given** I read body text (chat messages, descriptions, explanations)
**When** the body text renders
**Then** it uses DM Sans font at 400-600 weight
**And** text is highly readable for extended sessions (30+ min chat)
**And** line height is generous (1.5-1.6 for body)

**Given** I view data displays (precision %, scores, OCEAN codes)
**When** numerical data renders
**Then** it uses JetBrains Mono font at 400 weight
**And** data feels visually distinct from prose
**And** monospace creates technical credibility

**Given** I view the archetype name on the results page
**When** the display-hero typography renders
**Then** the text is 56-64px (3.5-4rem) at weight 700
**And** the archetype name is impossible to ignore

**Technical Details:**

- Install/configure Google Fonts: Space Grotesk, DM Sans, JetBrains Mono
- Define type scale tokens in globals.css or Tailwind config
- Configure Tailwind font families

**Type Scale:**

| Token | Size | Weight | Line Height | Font | Usage |
|-------|------|--------|-------------|------|-------|
| `display-hero` | 56-64px | 700 | 1.05 | Space Grotesk | Archetype name reveal |
| `display-xl` | 48px | 700 | 1.1 | Space Grotesk | Hero headlines |
| `display` | 36px | 700 | 1.15 | Space Grotesk | Page titles |
| `h1` | 30px | 600 | 1.2 | Space Grotesk | Section headings |
| `h2` | 24px | 600 | 1.25 | Space Grotesk | Subsection headings |
| `h3` | 20px | 600 | 1.3 | Space Grotesk | Card titles, trait names |
| `h4` | 18px | 500 | 1.35 | Space Grotesk | Labels, facet names |
| `body` | 16px | 400 | 1.6 | DM Sans | Body text, chat messages |
| `body-sm` | 14px | 400 | 1.5 | DM Sans | Secondary text, captions |
| `caption` | 12px | 400 | 1.4 | DM Sans | Fine print, metadata |
| `data` | 16px | 400 | 1.4 | JetBrains Mono | Precision %, scores, OCEAN codes |

**Acceptance Checklist:**
- [ ] Space Grotesk loaded and configured as heading font
- [ ] DM Sans loaded and configured as body font
- [ ] JetBrains Mono loaded and configured as mono/data font
- [ ] Type scale tokens defined in Tailwind/CSS
- [ ] All headings use Space Grotesk
- [ ] All body text uses DM Sans
- [ ] All data display uses JetBrains Mono
- [ ] Font loading optimized (display=swap, preload)
- [ ] Fonts use rem units (respects user browser font-size)
- [ ] Storybook documents type scale with all tokens

---

## Story 7.3: Dark Mode Toggle with System Preference Detection

As a **User**,
I want **to switch between light and dark themes, where dark mode feels like a distinct personality — the deep-ocean version**,
So that **I can use the app comfortably in any lighting condition and experience the brand's dual personality**.

**Acceptance Criteria:**

**Given** I visit the application for the first time
**When** my system is set to dark mode
**Then** the app renders in dark mode automatically (Abyss Navy, Teal primary, Gold accents)
**And** no flash of light mode occurs (SSR-safe)

**Given** I click the theme toggle button
**When** the toggle activates
**Then** the theme switches immediately (light <-> dark)
**And** my preference is persisted to localStorage
**And** the toggle icon reflects current theme (sun/moon)
**And** the color personality shifts completely (not just inverted)

**Given** I have a saved theme preference
**When** I return to the application
**Then** my saved preference is applied
**And** system preference is overridden by my choice

**Technical Details:**

- Add ThemeProvider component wrapping the app in `__root.tsx`
- Implement `useTheme` hook for toggle functionality
- Use `localStorage` key: `big-ocean-theme` with values: `light`, `dark`, `system`
- Add `.dark` class to `<html>` element
- Prevent flash: inline script in `<head>` checks preference before render
- SSR-safe: TanStack Start compatible implementation

**Flash Prevention:**
```html
<script dangerouslySetInnerHTML={{ __html: `
  (function() {
    const stored = localStorage.getItem('big-ocean-theme');
    const theme = stored === 'system' || !stored
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : stored;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  })()
` }} />
```

**Component Structure:**
```
packages/ui/src/hooks/
  use-theme.ts              # Theme hook (useTheme)

apps/front/src/components/
  ThemeProvider.tsx          # Context provider
  ThemeToggle.tsx            # Sun/moon toggle button
```

**Acceptance Checklist:**
- [ ] ThemeProvider wraps app in __root.tsx
- [ ] useTheme hook returns { theme, setTheme, systemTheme }
- [ ] Theme toggle button placed in Header
- [ ] Dark mode tokens render correctly (Abyss Navy, Teal, Gold)
- [ ] System preference detection works
- [ ] Manual toggle overrides system preference
- [ ] Preference persisted to localStorage
- [ ] No flash of wrong theme on page load
- [ ] SSR-compatible (TanStack Start)

---

## Story 7.4: OCEAN Geometric Identity System & Brand Mark

As a **User**,
I want **the Big Five personality framework encoded into 5 distinctive geometric shapes that serve as the brand identity, data visualization markers, and my personal identity**,
So that **the brand feels deeply connected to its psychological foundation, and my personality profile has a unique visual signature**.

**Acceptance Criteria:**

**Given** I view the big-ocean logo anywhere
**When** the brand mark renders
**Then** I see "big-" in Space Grotesk bold followed by 5 inline geometric shapes:
  - O: Circle (Purple `#A855F7`)
  - C: Half Circle (Orange `#FF6B2B`)
  - E: Tall Slim Rectangle (Electric Pink `#FF0080`)
  - A: Triangle (Teal `#00B4A6`)
  - N: Diamond (Navy `#1c1c9c`)
**And** the shapes replace the word "ocean" in the logo
**And** the brand mark works at all sizes (favicon to hero)

**Given** I view my Geometric Personality Signature on the results page
**When** my OCEAN code (e.g., "HHMHM") renders visually
**Then** I see the 5 shapes in OCEAN order
**And** each shape's size encodes my level: Large (H), Medium (M), Small (L)
**And** each shape uses its trait color at full saturation
**And** shapes are arranged inline with even spacing

**Given** the results reveal animation plays
**When** my archetype is being revealed
**Then** shapes appear one by one (O -> C -> E -> A -> N) with ~200ms stagger
**And** each shape starts small and scales to its final size
**And** color fills in as the shape reaches full size
**And** archetype name fades in below the signature
**And** users with `prefers-reduced-motion` see instant final state

**Technical Details:**

**Shape SVG Components:**
```
apps/front/src/components/
  ocean-shapes/
    OceanCircle.tsx          # O - Openness
    OceanHalfCircle.tsx      # C - Conscientiousness
    OceanRectangle.tsx       # E - Extraversion
    OceanTriangle.tsx        # A - Agreeableness
    OceanDiamond.tsx         # N - Neuroticism
    OceanShapeSet.tsx        # All 5 shapes inline (brand mark)
    GeometricSignature.tsx   # User's OCEAN code as sized shapes
```

**Logo Variations:**
- Full color: All 5 shapes in trait colors (primary usage)
- Monochrome: All 5 shapes in foreground color (constrained contexts)
- Icon mark: 5 shapes arranged compactly without "big-" (favicon, app icon)

**Decorative Uses:**
- Section dividers: Repeating OCEAN shapes at low opacity
- Loading states: Shapes pulse in sequence
- Background patterns: Scattered shapes at very low opacity

**Acceptance Checklist:**
- [ ] 5 SVG shape components created (Circle, Half-Circle, Rectangle, Triangle, Diamond)
- [ ] Each shape renders in its trait color from palette
- [ ] OceanShapeSet component renders brand mark ("big-" + 5 shapes)
- [ ] Brand mark scales correctly (favicon 16px to hero 64px+)
- [ ] GeometricSignature component accepts OCEAN code and renders sized shapes
- [ ] Size encoding: L=Small, M=Medium, H=Large per shape
- [ ] Results reveal animation with 200ms stagger
- [ ] `prefers-reduced-motion` respected (instant final state)
- [ ] Monochrome variant available for constrained contexts
- [ ] Icon-only variant for favicon/app icon
- [ ] Storybook documents all brand mark variations

---

## Story 7.5: Big Five Trait & Facet Visualization Colors

As a **User**,
I want **each personality trait and facet to have a distinctive color and geometric shape**,
So that **I can instantly identify traits in charts, results, and share cards**.

**Acceptance Criteria:**

**Given** I view my assessment results
**When** traits are displayed
**Then** each trait has its unique color and shape:
  - Openness: Purple `#A855F7` + Circle
  - Conscientiousness: Orange `#FF6B2B` + Half Circle
  - Extraversion: Electric Pink `#FF0080` + Rectangle
  - Agreeableness: Teal `#00B4A6` + Triangle
  - Neuroticism: Navy `#1c1c9c` + Diamond
**And** colors are consistent across all visualizations
**And** colors work in both light and dark modes

**Given** I view facet-level details
**When** individual facets are displayed
**Then** each facet uses a variation of its parent trait color
**And** facets are visually grouped with their trait

**Given** trait/facet colors are displayed
**When** accessibility is tested
**Then** each color has sufficient contrast against backgrounds
**And** color is never the sole indicator of state (always paired with shape, icon, or text)

**Technical Details:**

**Trait Color CSS Tokens:**
```css
:root {
  --trait-openness: #A855F7;
  --trait-conscientiousness: #FF6B2B;
  --trait-extraversion: #FF0080;
  --trait-agreeableness: #00B4A6;
  --trait-neuroticism: #1c1c9c;

  /* Trait accent colors (for gradient pairs) */
  --trait-openness-accent: #FFB830;     /* Purple -> Gold */
  --trait-conscientiousness-accent: #00B4A6; /* Orange -> Teal */
  --trait-extraversion-accent: #FF6B2B;  /* Pink -> Orange */
  --trait-agreeableness-accent: #00E0A0; /* Teal -> Mint */
  --trait-neuroticism-accent: #00D4C8;   /* Navy -> Teal */

  /* Trait gradients */
  --gradient-trait-openness: linear-gradient(135deg, #A855F7, #FFB830);
  --gradient-trait-conscientiousness: linear-gradient(135deg, #FF6B2B, #00B4A6);
  --gradient-trait-extraversion: linear-gradient(135deg, #FF0080, #FF6B2B);
  --gradient-trait-agreeableness: linear-gradient(135deg, #00B4A6, #00E0A0);
  --gradient-trait-neuroticism: linear-gradient(135deg, #1c1c9c, #00D4C8);
}
```

**Utility Functions (packages/domain/src/utils/trait-colors.ts):**
```typescript
export function getTraitColor(trait: TraitName): string;
export function getTraitAccentColor(trait: TraitName): string;
export function getFacetColor(facet: FacetName): string;
export function getTraitGradient(trait: TraitName): string;
export function getTraitColorValue(trait: TraitName): string; // Raw hex for chart libs
```

**Acceptance Checklist:**
- [ ] 5 trait color tokens added to globals.css
- [ ] 5 trait accent color tokens added (for gradient pairs)
- [ ] 5 trait gradient tokens defined
- [ ] Facet color tokens added (variations of parent trait)
- [ ] Dark mode variants for trait colors
- [ ] Utility functions created in domain package
- [ ] Colors tested for colorblind accessibility
- [ ] WCAG AA contrast verified for text on trait colors
- [ ] Color never sole state indicator (paired with shape/text)
- [ ] Results page uses trait colors via semantic variables
- [ ] Storybook documents trait and facet color palettes

---

## Story 7.6: Global Header with Geometric Logo, Auth, Theme Toggle & Mobile Nav

As a **User**,
I want **a polished global header featuring the "big-[shapes]" geometric logo, auth controls, theme toggle, and responsive mobile navigation**,
So that **I can navigate the app, manage my account, and switch themes from any page with a brand-forward experience**.

**Dependencies:**
- Story 7.1 (color tokens)
- Story 7.3 (theme toggle logic)
- Story 7.4 (OCEAN shape brand mark)

**Acceptance Criteria:**

**Given** I visit any page in the application
**When** the page loads
**Then** I see a global header containing:
  - "big-[OCEAN shapes]" geometric logo on the left (linked to home)
  - Navigation links (desktop)
  - Theme toggle button (sun/moon icon)
  - Auth controls (Sign In / Sign Up when unauthenticated, user avatar/menu when authenticated)
**And** the header uses semantic color tokens
**And** the header works correctly in both light and dark modes

**Given** I am not authenticated
**When** I view the header
**Then** I see "Sign In" and "Sign Up" buttons
**And** clicking them navigates to the appropriate routes

**Given** I am authenticated
**When** I view the header
**Then** I see my user avatar/initial
**And** clicking it opens a dropdown with: name/email, Dashboard link, Sign Out

**Given** I view the application on mobile (< 768px)
**When** the header renders
**Then** navigation collapses behind a hamburger menu icon
**And** clicking it opens a side sheet/drawer with nav links, auth, and theme toggle
**And** all touch targets are minimum 44px

**Technical Details:**

**Component Structure:**
```
apps/front/src/components/
  Header.tsx                # Redesigned global header
  ThemeToggle.tsx           # Sun/moon toggle
  MobileNav.tsx             # Sheet-based mobile navigation
  UserNav.tsx               # Auth-aware user dropdown
  Logo.tsx                  # "big-" + OceanShapeSet

packages/ui/src/components/
  sheet.tsx                 # shadcn/ui Sheet (install if needed)
  dropdown-menu.tsx         # shadcn/ui DropdownMenu (install if needed)
```

**Acceptance Checklist:**
- [ ] Header replaces current demo sidebar navigation
- [ ] "big-[shapes]" geometric logo displayed and linked to home
- [ ] Logo uses trait colors from Story 7.4
- [ ] Theme toggle visible and functional
- [ ] Sign In / Sign Up shown when unauthenticated
- [ ] User dropdown shown when authenticated (with Dashboard link)
- [ ] Mobile hamburger menu at < 768px breakpoint
- [ ] Mobile sheet contains nav links, auth, and theme toggle
- [ ] All hard-coded colors removed (no `bg-gray-*`, `bg-slate-*`)
- [ ] All elements use semantic tokens
- [ ] `data-slot` attributes on all component parts (per FRONTEND.md)
- [ ] Touch targets >= 44px on mobile
- [ ] Works in both light and dark modes

---

## Story 7.7: Illustration & Icon System (Phase 1)

As a **User**,
I want **a cohesive hand-drawn illustration system with a Diver character (Nerin), ocean-themed icons, and decorative elements**,
So that **the application feels warm, approachable, and distinctly "big-ocean" throughout the experience**.

**Acceptance Criteria:**

**Given** I encounter Nerin in the chat interface
**When** assistant messages render
**Then** Nerin has a Diver avatar — an ethereal ocean entity, bioluminescent, translucent, gender-neutral
**And** the avatar works at all sizes (32px chat to 256px hero)
**And** the avatar has idle, reading, and thinking visual states

**Given** I view decorative elements throughout the app
**When** the page renders
**Then** ocean-themed decorative SVGs (waves, bubbles, coral, seaweed) appear where appropriate
**And** decorative elements are at low opacity (5-10%) and non-distracting
**And** all decorative elements are marked `aria-hidden`

**Given** I view icons throughout the app
**When** ocean-themed actions appear
**Then** custom ocean icons are used where appropriate:
  - Shell (home), Compass (explore), Anchor (profile)
  - Bubble (send), Wave (share), Pearl (save)
  - Rising Bubbles (loading), Lighthouse (complete)

**Technical Details:**

**Illustration Style Guide:**
- Bold outlines (2-3px line weight)
- Flat saturated colors (matches psychedelic palette)
- Expressive and emotive characters
- SVG format for scalability
- Consistent proportions across all illustrations

**Phase 1 Scope (ship with this story):**
- 1 character: Diver (Nerin avatar/mascot) — ship with elegant placeholder, final illustration is parallel sub-task
- 3-4 static SVG decorative elements: waves, bubbles, coral cluster, seaweed strand
- Ocean icon set (8 icons)
- 5 OCEAN geometric shapes (may already exist from Story 7.4)

**Component Structure:**
```
apps/front/src/components/
  NerinAvatar.tsx            # Diver avatar with confidence-based CSS tiers
  OceanDecorative.tsx        # Waves, bubbles, coral SVGs
  icons/
    ocean-icons.tsx         # Shell, Compass, Anchor, Bubble, Wave, Pearl, etc.
```

**Nerin Avatar Confidence Tiers (CSS-only):**
- 0-30% confidence: `opacity-40`, faint glow
- 30-60% confidence: `opacity-70`, medium glow
- 60-100% confidence: `opacity-100`, luminous glow

**Acceptance Checklist:**
- [ ] Nerin Diver avatar component created (placeholder OK for initial ship)
- [ ] Avatar scales from 32px to 256px
- [ ] Avatar has 3 confidence-based CSS tiers
- [ ] 3-4 decorative SVG elements created (waves, bubbles, coral, seaweed)
- [ ] Ocean icon set created (8 icons)
- [ ] All decorative elements `aria-hidden`
- [ ] Illustration style consistent (line weight, color saturation, proportions)
- [ ] SVG format for all illustrations
- [ ] Storybook documents avatar states, decorative elements, and icons

---

## Story 7.8: Conversation-Driven Homepage with Depth Scroll

As a **User**,
I want **the home page to unfold as a conversation with Nerin — the AI guide — with rich embedded content that scroll-reveals as I descend through depth zones**,
So that **I experience the product's core value proposition (conversational personality discovery) directly on the landing page, and I'm compelled to start my own assessment**.

**Dependencies:**
- Story 7.1 (color tokens), 7.2 (typography), 7.3 (dark mode toggle), 7.4 (OCEAN shapes), 7.5 (trait colors), 7.6 (global header), 7.7 (illustrations)

**Design Reference:**
- Prototype: `_bmad-output/ux-explorations/homepage-directions/direction-combined.html`
- Context: 6 UX direction explorations culminated in a combined direction; see `_bmad-output/ux-explorations/homepage-directions/index.html` for all directions

**Acceptance Criteria:**

**Given** I visit the home page
**When** the hero section loads
**Then** I see a two-column layout:
  - Left: Headline ("What if the most interesting person in the room is you?"), tagline, meta line ("30 MIN · FREE · NO ACCOUNT NEEDED"), "Begin Your Dive" CTA
  - Right: 5 OCEAN geometric shapes with breathing animation (6s cycle, staggered)
  - Bottom: "Scroll to descend" cue with bob animation
**And** the hero fills the full viewport height
**And** the design uses brand typography (Space Grotesk headings, DM Sans body, JetBrains Mono meta)

**Given** I scroll past the hero
**When** the conversation section enters the viewport
**Then** messages from Nerin and a simulated user scroll-reveal sequentially (Intersection Observer)
**And** each message group fades in with upward slide (translateY 26px → 0, 0.65s ease)
**And** a vertical conversation thread line runs along the left side
**And** Nerin messages have a gradient avatar (Teal → Pink) with "N" initial
**And** user messages are right-aligned with gradient bubble (Pink → Orange)

**Given** I scroll in auto or forced-light mode
**When** the page transitions through depth zones
**Then** the background interpolates through 5 color zones:
  - Surface: Warm Cream `rgb(255,248,240)` — dark text
  - Shallows: Soft Blush `rgb(255,240,232)` — dark text
  - Mid: Light Peach `rgb(255,232,216)` — dark text
  - Deep: Dark Purple-Navy `rgb(40,38,65)` — white text
  - Abyss: Deep Navy `rgb(10,14,39)` — white text
**And** the nav, bubble styles, facet pills, and input bar dynamically switch between light/dark classes based on current zone darkness
**And** CSS custom properties update for bubble-bg, bubble-border, embed-bg, muted-dynamic, etc.

**Given** I am in forced dark mode
**When** I scroll
**Then** the background remains static Abyss Navy `rgb(14,16,42)` throughout
**And** all UI elements use dark mode styling regardless of scroll position

**Given** the depth meter is visible (desktop only, hidden < 900px)
**When** I scroll through the conversation
**Then** a fixed left-side depth meter shows:
  - A 160px vertical track with fill indicator tracking scroll percentage
  - 5 labeled pips: Surface, Shallows, Mid, Deep, Abyss
  - Active pip highlighted in Electric Pink
  - Current zone name displayed below the track
**And** the depth meter only appears when the conversation section is in the viewport

**Given** I view the trait carousel embed
**When** it appears inside a Nerin chat bubble
**Then** I see a horizontally swipeable carousel with 5 trait cards:
  - Each card shows: trait geometric shape, trait name (in trait color), description, 6 facet pills
  - Scroll-snap alignment for clean paging
  - Dot navigation below (5 dots, active = Electric Pink)
  - "← swipe →" hint text
**And** the carousel is contained within an embed container (rounded, bordered, backdrop-blur)

**Given** I view the blurred preview embeds (OCEAN Code, Radar Chart, 30-Facet Bars)
**When** they appear inside Nerin chat bubbles
**Then** each shows a realistic but blurred (5px) preview of actual result data
**And** hovering reduces blur to 2.5px and reveals a CTA pill ("Take assessment to reveal yours →", "See your scores →", "Reveal your 30 facets →")
**And** the blurred content is non-selectable and non-interactive

**Given** I have scrolled past ~35% of the page
**When** the chat input bar becomes visible
**Then** a fixed bottom bar slides up containing:
  - A readonly text input with placeholder "Type your first message to Nerin..."
  - A "Start Conversation →" gradient button
**And** the bar uses glass-morphism (backdrop-blur, semi-transparent background)
**And** clicking the button navigates to the assessment start flow

**Given** I use the theme toggle
**When** I click the toggle button
**Then** the theme cycles: auto → dark → light → dark → ...
**And** auto mode uses scroll-driven light-to-dark transition
**And** dark mode uses static dark background
**And** light mode uses the same light-to-dark transition as auto

**Given** I view the page on mobile (< 900px)
**When** the layout adapts
**Then** the hero collapses to single column (text above, shapes below)
**And** the depth meter is hidden
**And** conversation bubbles use 92% max-width
**And** facet grid collapses to 2 columns (1 column below 480px)
**And** trait cards stack vertically with centered text
**And** all touch targets are minimum 44px

**Technical Details:**

**Page Structure:**
```
1. HERO — Two-column: headline + OCEAN shapes with breathing animation
2. CONVERSATION — Scroll-reveal chat thread:
   a. Nerin intro (2 messages)
   b. User question about measurement
   c. Trait carousel embed (5 swipeable cards)
   d. User question about results
   e. Blurred OCEAN Code embed
   f. Blurred Radar Chart embed
   g. Blurred 30-Facet Bars embed
   h. User question about duration
   i. Nerin closing message with CTA
3. STICKY CHAT BAR — Fixed bottom input (appears at 35% scroll)
4. DEPTH METER — Fixed left indicator (desktop only)
```

**Component Structure:**
```
apps/front/src/components/home/
  HeroSection.tsx              # Two-column: headline + OCEAN shapes
  ConversationFlow.tsx         # Scroll-reveal conversation container + depth color logic
  MessageGroup.tsx             # Reusable Nerin/User message bubble group
  ChatBubble.tsx               # Individual bubble with embed slot
  TraitCarouselEmbed.tsx       # 5-card swipeable trait carousel
  BlurredPreviewEmbed.tsx      # Shared blur-wrap with hover reveal CTA
  OceanCodePreview.tsx         # OCEAN code content for blur embed
  RadarChartPreview.tsx        # Radar SVG content for blur embed
  FacetBarsPreview.tsx         # 30-facet bar grid content for blur embed
  DepthMeter.tsx               # Fixed left-side scroll indicator (desktop)
  ChatInputBar.tsx             # Sticky bottom chat bar
  DepthScrollProvider.tsx      # React context: scroll %, zone, isDark, theme mode
```

**Depth Scroll Color System:**
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
})); // Static dark navy
const LIGHT_ZONES = [...AUTO_ZONES]; // Same transition as auto
```

**Scroll-Driven Theme Logic:**
- `DepthScrollProvider` computes scroll percentage, interpolates bg/fg from active zone palette
- Sets `isDark` flag based on zone darkness (auto/light: zone-based, dark: always true)
- Updates CSS custom properties for dynamic bubble/embed/nav theming
- Components read theme state via React context (not direct DOM manipulation)

**Key Implementation Notes:**
- The prototype uses vanilla JS/CSS; production should use React components with Tailwind + CSS custom properties
- Scroll listener should be throttled (requestAnimationFrame) for performance
- Intersection Observer for message reveal (threshold: 0.12, rootMargin: '0px 0px -30px 0px')
- Trait carousel uses CSS scroll-snap (no carousel library needed)
- Blurred previews use CSS `filter: blur()` with `user-select: none; pointer-events: none`
- The chat input bar is decorative on the homepage — clicking navigates to `/assessment`

**Animations (respect `prefers-reduced-motion`):**
- OCEAN shapes: breathing scale animation (6s cycle, staggered 1.2s per shape)
- Scroll cue: vertical bob (2.5s cycle)
- Message groups: fade + slide on intersection
- Chat bar: slide up from bottom at 35% scroll
- Blur reduction on hover (5px → 2.5px)

**Acceptance Checklist:**
- [ ] Hero section: two-column layout with OCEAN shapes and breathing animation
- [ ] Conversation thread with vertical line and scroll-reveal messages
- [ ] Nerin avatar gradient (Teal → Pink), user avatar with theme-aware styling
- [ ] Trait carousel embed: 5 swipeable cards with dot navigation
- [ ] Blurred OCEAN Code preview with hover reveal CTA
- [ ] Blurred Radar Chart preview with hover reveal CTA
- [ ] Blurred 30-Facet Bars preview with hover reveal CTA
- [ ] Depth scroll: background color interpolation across 5 zones (auto/light modes)
- [ ] Dark mode: static Abyss Navy background, no scroll transition
- [ ] Depth meter: fixed left-side indicator with zone labels (desktop only)
- [ ] Sticky chat input bar appears at ~35% scroll
- [ ] Theme toggle cycles auto → dark → light
- [ ] Dynamic CSS custom properties for bubble/embed/nav theming
- [ ] DepthScrollProvider React context for scroll state
- [ ] Mobile responsive: single column hero, hidden depth meter, adapted grids
- [ ] All touch targets >= 44px
- [ ] No hard-coded color classes
- [ ] `prefers-reduced-motion` respected
- [ ] `data-slot` attributes on all component parts (per FRONTEND.md)

---

## Story 7.9: Results Page Visual Redesign with Archetype Theming

As a **User viewing my assessment results**,
I want **the results page to feel immersive and themed around my unique archetype — with bold color, geometric shapes, and a psychedelic-to-scientific depth progression**,
So that **seeing my results feels like a celebration of self-discovery, not a clinical data readout**.

**Dependencies:**
- Story 7.1 (color tokens), 7.4 (OCEAN shapes, signature, reveal animation), 7.5 (trait colors)
- Epic 8 provides content (descriptions); this story provides visual treatment

**Acceptance Criteria:**

**Given** I view my results page
**When** the archetype hero section loads
**Then** the hero uses my archetype's trait color as the dominant color (bold background, not white)
**And** my Geometric Personality Signature is prominently displayed
**And** the archetype name uses `display-hero` typography (56-64px)
**And** the archetype reveal animation plays (shapes appear sequentially)

**Given** I scroll through the results page
**When** I move from hero to detail sections
**Then** the page transitions from psychedelic (top) to scientific (bottom):
  - Hero: Maximum psychedelic — archetype color block, bold shapes
  - Trait Overview: Balanced — structured layout with trait colors
  - Facet Details: Scientific — clean grids, readable body type
  - Evidence: Precision — monospace scores, minimal decoration
**And** WaveDivider components separate depth zones

**Given** I view trait and facet sections
**When** scores are displayed
**Then** trait score visualizations use organic wave-form bars (not rigid rectangles)
**And** each trait section uses its trait color and geometric shape
**And** OCEAN shapes serve as chart markers and section indicators

**Given** I view the results on mobile
**When** the layout adapts
**Then** the archetype hero is full-width with readable text
**And** trait sections stack vertically
**And** all interactive elements are touch-friendly (>= 44px)

**Technical Details:**

**Depth Zone CSS Tokens:**
```css
:root {
  --depth-shallows: var(--background);     /* Warmest, most psychedelic */
  --depth-mid: var(--card);                 /* Balanced */
  --depth-deep: var(--muted);              /* Scientific, structured */
}
```

**Archetype-Color Dynamic Theming:**
- Results page receives archetype's dominant trait
- Hero section background uses that trait's color/gradient
- CTAs use archetype color instead of generic primary
- Subtle archetype-color tint on depth zones

**Organic Data Visualization:**
- Trait score bars: Wave-form shapes (not rectangular bars)
- Score bar width encodes magnitude
- OCEAN shapes as chart markers and legend icons
- Facet breakdown uses parent trait's color family

**Acceptance Checklist:**
- [ ] Archetype hero uses bold trait-colored background
- [ ] Geometric Personality Signature displayed prominently
- [ ] Archetype name uses `display-hero` typography
- [ ] Results reveal animation works (sequential shape appearance)
- [ ] Depth zone progression: psychedelic -> scientific (top -> bottom)
- [ ] WaveDivider components between sections
- [ ] Trait score bars use organic wave-form visualization
- [ ] Each trait section uses its trait color and geometric shape
- [ ] OCEAN shapes used as chart markers
- [ ] Archetype-color CTAs (not generic primary)
- [ ] `prefers-reduced-motion` respected for all animations
- [ ] Mobile responsive with stacked layout
- [ ] Works in both light and dark modes

---

## Story 7.10: Assessment Chat UX Polish

As a **User**,
I want **the assessment chat to feel like a warm, immersive conversation with a distinct personality — the calmest expression of big-ocean's brand — rather than a clinical data-collection interface**,
So that **I'm more engaged, comfortable, and authentic throughout the 30-minute assessment**.

**Dependencies:** Story 7.1 (color tokens), Story 7.7 (Nerin avatar/illustrations)

**Scope:** Frontend-only — zero backend/API changes.

### Requirements

| # | Requirement | Description |
|---|---|---|
| FR-7.10.1 | Multi-message auto-greeting | 2-3 staggered messages (0/1200/2000ms delays). Msg 1: intro. Msg 2: context framing. Msg 3: rotating opening question. Client-side only. |
| FR-7.10.2 | Nerin-focused minimal header | Remove raw session ID and clinical title. Replace with minimal "Nerin" + Diver avatar. |
| FR-7.10.3 | Nerin Diver avatar in messages | Diver avatar on all assistant messages. Idle/reading/thinking states. Confidence-based CSS tiers (3 levels). |
| FR-7.10.4 | Progress milestones | In-chat milestone badges at 25%/50%/70% with Nerin-voice notifications. |
| FR-7.10.5 | In-chat celebration | Full-width milestone message card (not modal). Visually distinct (archetype-colored). CTAs: "View Results" + "Keep Exploring". Input state changes during display. |
| FR-7.10.6 | Textarea + rotating placeholders | Auto-resizing textarea with Shift+Enter. Two-tier rotating placeholder pool: playful (messages 1-15), calmer (16+). 20+ placeholders. |
| FR-7.10.7 | Relative timestamps | "just now", "2 min ago" instead of raw `toLocaleTimeString()`. |
| FR-7.10.8 | Mobile polish | Wider bubbles (90%), larger touch targets (44px+), proper safe-area handling. |
| FR-7.10.9 | Nerin-voice progress labels | Replace clinical "X% assessed" with: "Getting to know you..." -> "Understanding your patterns..." -> "Almost there..." |
| FR-7.10.10 | Remove "Start Assessment" button | Auto-greeting + visible inviting input = sufficient CTA. |
| FR-7.10.11 | Chat-to-results navigation | When user has completed assessment (>= 70%), show "View Your Results" link in chat header. |

### Chat Interface Visual Rules (from UX Spec)

The chat screen uses the **calmest expression** of the brand:
- Background: Warm Cream (`#FFF8F0`) / Abyss Navy (`#0A0E27`) — no color blocks
- Nerin avatar: Small Diver character, consistent across messages
- Message bubbles: Clean, rounded (16px radius, 4px sender corner), generous padding
- User bubbles: Surface color (`--card`), Nerin bubbles: slightly elevated (`--accent`)
- Ocean accents: Subtle wave pattern at 5-10% opacity on background (not distracting)
- Psychedelic energy ONLY in: milestone toasts (brief, fades back to calm) and results transition

**Technical Details:**

**New Files:**
- `apps/front/src/constants/nerin-greeting.ts` — greeting messages, opening question pool
- `apps/front/src/constants/chat-placeholders.ts` — two-tier placeholder pools (20+ entries)

**Modified Files:**
- `apps/front/src/components/TherapistChat.tsx` — header, welcome flow, celebration, input, timestamps, mobile, results link
- `apps/front/src/components/ProgressBar.tsx` — Nerin-voice labels

**Greeting Copy (updated 2026-02-13 — Party Mode insights):**
```
Message 1: "Hey there! I'm Nerin — I'm here to help you understand your personality through conversation. No multiple choice, no right answers, just us talking."
Message 2: "Here's the thing: the more openly and honestly you share, the more accurate and meaningful your insights will be. This is a judgment-free space — be as real as you'd like. The honest answer, even if it's messy or contradictory, is always more valuable than the polished one."
Message 3: [Random from pool]:
  - "If your closest friend described you in three words, what would they say?"
  - "What's something most people get wrong about you?"
  - "Picture a perfect Saturday with nothing planned — what does your ideal day look like?"
  - "Think of a moment recently when you felt most like yourself — what were you doing?"
```

### Implementation Order

1. Identity cluster (FR-7.10.1, 7.10.2, 7.10.3, 7.10.10) — core transformation
2. Celebration (FR-7.10.5) — climax moment rework
3. Input (FR-7.10.6) — conversational feel
4. Progress (FR-7.10.4, 7.10.9) — engagement loop
5. Polish (FR-7.10.7, 7.10.8) — refinements
6. Navigation (FR-7.10.11) — chat-to-results link

**Acceptance Checklist:**
- [ ] Nerin auto-greets with 2-3 staggered messages (no start button)
- [ ] Opening question rotates from pool of 3-4 options
- [ ] Header shows "Nerin" + Diver avatar only (no session ID, no clinical title)
- [ ] Diver avatar appears on all assistant messages with states
- [ ] Avatar opacity scales with confidence (3 CSS tiers)
- [ ] Chat background uses calmest brand expression (Warm Cream / Abyss Navy)
- [ ] Message bubbles use 16px radius, 4px sender corner
- [ ] Progress milestones as in-chat badges at 25%/50%/70%
- [ ] Celebration is in-chat styled card (not modal) with archetype-colored border
- [ ] Auto-resizing textarea with Shift+Enter and rotating placeholders
- [ ] Two-tier placeholder pools: playful (1-15), calmer (16+)
- [ ] Timestamps show relative time ("just now", "2 min ago")
- [ ] Mobile: wider bubbles (90%), proper safe-area, 44px+ touch targets
- [ ] Progress bar labels use Nerin-voice contextual text
- [ ] "View Your Results" link visible when assessment completed (>= 70%)
- [ ] All existing functionality preserved (error handling, evidence highlighting, facet panel)
- [ ] Works in both light and dark modes
- [ ] Zero backend/API changes

---

## Story 7.11: Auth-Gated Results Reveal & Sign-Up Flow

As a **User who has completed the assessment**,
I want **to be prompted to sign up or sign in before viewing my full results**,
So that **my results are saved to my account and I can access them later, while the platform captures authenticated users at the moment of peak engagement**.

**Dependencies:** Story 7.1 (tokens), Story 7.3 (dark mode), Story 7.9 (results page)

**Acceptance Criteria:**

**Given** I complete the assessment (precision reaches 70%+) and I am NOT signed in
**When** the celebration moment triggers
**Then** I see a teaser screen showing:
  - My Geometric Personality Signature (animated reveal with OCEAN shapes)
  - My archetype name (blurred or partially revealed)
  - A headline: "Your Personality Profile is Ready!"
  - A prominent CTA: "Sign Up to See Your Results"
  - A secondary link: "Already have an account? Sign In"
**And** the full results page is NOT accessible without authentication

**Given** I am on the auth-gate teaser screen
**When** I click "Sign Up to See Your Results"
**Then** I see an inline sign-up form (email + password) on the teaser page
**And** the form follows the brand's visual identity (psychedelic tokens, Space Grotesk headings)
**And** after successful sign-up, I'm redirected to my full results page
**And** my assessment session is linked to my new account

**Given** I am on the auth-gate teaser screen
**When** I click "Sign In"
**Then** I see a sign-in form
**And** after successful sign-in, I'm redirected to my full results page
**And** my assessment session is linked to my existing account

**Given** I complete the assessment and I AM already signed in
**When** the celebration moment triggers
**Then** I skip the auth gate entirely
**And** I go directly to the full results page with archetype reveal animation

**Given** I am an anonymous user who closes the browser before signing up
**When** I return to the same device within 24 hours
**Then** my session ID is preserved (localStorage)
**And** I can resume and complete the auth gate to view results

**Technical Details:**

- Teaser screen lives at same route as results, conditionally renders based on auth state
- Uses Better Auth session check
- Assessment session ID stored in localStorage for anonymous-to-auth linking
- Results gate passes `anonymousSessionId` for both sign-up and sign-in submissions
- Standalone auth routes (`/login`, `/signup`) also accept active assessment context (`sessionId`) and pass `anonymousSessionId` on submit
- Auth navigation from active assessment contexts preserves safe `redirectTo` and restores `/chat` or `/results` with the same session context post-auth
- Backend Better Auth hooks link `assessment_session.user_id` for both auth paths:
  - `databaseHooks.user.create.after` for sign-up
  - `databaseHooks.session.create.after` for sign-in
- Backend backfills `assessment_message.user_id` for user-role historical messages in the linked session
- There is no persisted "results row" to link; results are computed from linked session evidence at read time
- Geometric signature shows full animation (hook moment), archetype name stays blurred
- Sign-up form inline on the teaser page (not a separate route) for minimal friction
- Password validation: 12+ characters per Better Auth config

**Component Structure:**
```
apps/front/src/components/
  ResultsAuthGate.tsx          # Teaser screen with signature + auth forms
```

**Acceptance Checklist:**
- [ ] Teaser screen shows geometric signature animation + blurred archetype name
- [ ] "Sign Up to See Results" CTA is prominent and brand-styled
- [ ] "Already have an account? Sign In" secondary link available
- [ ] Sign-up form follows brand identity (tokens, typography)
- [ ] Successful sign-up redirects to full results
- [ ] Session linked to new account after sign-up
- [ ] Successful sign-in redirects to full results
- [ ] Session linked to existing account after sign-in
- [ ] Already-authenticated users bypass gate entirely
- [ ] Session persistence for anonymous users (24h localStorage)
- [ ] Auth links from active assessment flows preserve `sessionId` and return user to the same assessment context post-auth
- [ ] Password validation (12+ characters)
- [ ] Works in both light and dark modes
- [ ] Mobile-responsive with 44px+ touch targets

---

## Story 7.12: Shareable Public Profile & Share Cards

As a **User who has completed the assessment**,
I want **a beautiful, shareable public profile page and social share card featuring my archetype**,
So that **I can share my personality with friends via a unique link that looks stunning in social previews and inspires others to take the assessment**.

**Dependencies:** Story 7.1 (tokens), Story 7.4 (OCEAN shapes), Story 7.5 (trait colors), Story 7.9 (results visual design), Story 7.11 (auth required)

**Acceptance Criteria:**

**Given** someone visits my shareable profile link (e.g., `/profile/:shareId`)
**When** the public profile page loads
**Then** they see:
  - My archetype name in `display-hero` typography
  - My Geometric Personality Signature (5 OCEAN shapes sized by level)
  - Big Five trait summary (High/Mid/Low for each trait with trait colors and shapes)
  - 2-3 sentence archetype description
  - A CTA: "Discover Your Archetype" linking to the home/assessment page
**And** NO private data is shown (no facet details, no conversation, no evidence)
**And** the page uses the archetype's dominant trait color as hero background

**Given** I share my profile link on social media (Twitter, Facebook, LinkedIn, iMessage)
**When** the platform fetches the link preview
**Then** an OG meta card renders showing:
  - "big-[shapes]" logo
  - Archetype name
  - Geometric Personality Signature (as static image)
  - Trait summary
  - Site name: "big-ocean"
**And** the card uses the archetype's trait color as background
**And** the card is optimized for both 1200x630 (Facebook) and 1200x675 (Twitter) aspect ratios

**Given** I am on my results page (authenticated)
**When** I click "Share My Archetype"
**Then** I see a share panel with:
  - Preview of what recipients will see (public profile)
  - "Copy Link" button
  - Social share buttons (Twitter, Facebook, LinkedIn)
  - A note: "Only your archetype and trait summary will be visible — your private profile stays private"
**And** the share link is generated (unique, encrypted)

**Given** a recipient views my public profile
**When** they click "Discover Your Archetype"
**Then** they are navigated to the big-ocean home page / assessment start
**And** the viral loop is complete

**Technical Details:**

- Public profile route: `/profile/:shareId` (SSR-rendered for OG meta)
- OG meta tags set via TanStack Start `createFileRoute` meta
- Share card image: server-side generated or CSS-to-image (satori/og-image)
- Share panel component in results page
- Privacy: public profile queries only archetype data, never facet/evidence
- Share link uses encrypted share ID from existing profile sharing infrastructure (Epic 5)

**Component Structure:**
```
apps/front/src/routes/profile/
  $shareId.tsx               # Public profile page (SSR)

apps/front/src/components/
  SharePanel.tsx             # Share link + social buttons + preview
  PublicProfileCard.tsx      # Public archetype display
```

**Acceptance Checklist:**
- [ ] Public profile page renders archetype name, signature, trait summary
- [ ] Archetype description (2-3 sentences) displayed
- [ ] Hero uses archetype's dominant trait color
- [ ] No private data visible on public profile
- [ ] OG meta tags render correct card preview
- [ ] Card image includes logo, archetype name, geometric signature
- [ ] Card optimized for Twitter + Facebook aspect ratios
- [ ] Share panel on results page with copy link + social buttons
- [ ] Privacy notice in share panel
- [ ] "Discover Your Archetype" CTA on public profile (viral loop)
- [ ] Works in both light and dark modes
- [ ] Mobile-responsive layout

---

## Story 7.13: Registered User Profile Page

As a **Registered User**,
I want **a profile/dashboard page that shows my assessments, archetype, and actions I can take**,
So that **I have a home base in the app where I can view my results, resume conversations, or start new assessments**.

**Dependencies:** Story 7.1 (tokens), Story 7.6 (header with auth), Story 7.11 (auth gate)

**Acceptance Criteria:**

**Given** I am authenticated and navigate to my profile (via header user menu or `/dashboard`)
**When** the profile page loads
**Then** I see:
  - My name/email at the top
  - My latest assessment's archetype card (archetype name, geometric signature, trait colors)
  - Assessment history list (date, precision %, archetype, status)
  - Action buttons for each assessment: "View Results" / "Resume Conversation"
**And** the page uses brand design tokens and typography

**Given** I have one completed assessment
**When** I view my profile
**Then** the latest archetype card is prominently displayed
**And** "View Results" navigates to my full results page
**And** "Resume Conversation" navigates to the chat with my session restored
**And** "Share My Archetype" is available if precision >= 70%

**Given** I have no completed assessments
**When** I view my profile
**Then** I see an empty state with:
  - Nerin diver illustration (or decorative ocean element)
  - "You haven't taken an assessment yet"
  - A CTA: "Start Your Assessment" linking to the chat page

**Given** I am on the results page
**When** I want to continue the conversation
**Then** I see a "Continue Conversation" link/button
**And** clicking it navigates to the chat page with my session resumed

**Given** I am unauthenticated and try to access `/dashboard`
**When** the route loads
**Then** I am redirected to the sign-in page
**And** after sign-in I am redirected back to the dashboard

**Technical Details:**

- Route: `/dashboard` (protected, requires auth)
- Uses TanStack Router authenticated route guard
- Queries user's assessment sessions from API
- Assessment card component reusable from results page
- Empty state uses illustration system from Story 7.7
- Bidirectional navigation: chat <-> results <-> profile

**Component Structure:**
```
apps/front/src/routes/
  dashboard.tsx              # Protected dashboard route

apps/front/src/components/
  AssessmentCard.tsx         # Reusable assessment summary card
  EmptyDashboard.tsx         # Empty state with illustration + CTA
```

**Acceptance Checklist:**
- [ ] Profile page accessible from header user menu
- [ ] Protected route (redirects to sign-in if unauthenticated)
- [ ] Latest archetype card displayed prominently
- [ ] Assessment history list with date, precision, status
- [ ] "View Results" and "Resume Conversation" actions per assessment
- [ ] "Share My Archetype" available for completed assessments (>= 70%)
- [ ] Empty state with illustration and CTA
- [ ] Bidirectional navigation: chat <-> results <-> profile
- [ ] Brand design tokens and typography applied
- [ ] Works in both light and dark modes
- [ ] Mobile-responsive with 44px+ touch targets

---

## Story 7.15: Auth Form Psychedelic Brand Redesign

As a **User visiting the sign-up or sign-in page**,
I want **the authentication forms to match the psychedelic brand identity used throughout the rest of the application**,
So that **the experience feels cohesive and trustworthy at the critical moment of creating an account or signing in**.

**Dependencies:** Stories 7.1-7.5 (design tokens, typography, dark mode, shapes, colors)

**Acceptance Criteria:**

**Given** I visit the sign-up or sign-in page
**When** the form renders
**Then** I see the `big-[shapes]` brand mark, gradient accent headings (Space Grotesk), borderless tinted inputs, dark primary CTA with brand hover, and corner geometric decorations
**And** no hard-coded blue/gray colors remain

**Given** I toggle between light and dark mode
**When** the auth forms re-render
**Then** both themes use appropriate brand gradients (pink→orange light, teal→gold dark)
**And** all text meets WCAG AA contrast

**Given** I view the forms on mobile
**When** the layout adapts
**Then** all touch targets are >= 44px and the form is usable on 375px viewport

**Given** the Results auth forms exist
**When** comparing all auth forms
**Then** all four forms share consistent brand styling and semantic token usage

**Technical Details:**

- Replace hard-coded colors in `login-form.tsx` and `signup-form.tsx` with semantic tokens
- Add brand mark, gradient headings, corner decorations, tinted inputs
- Align Results auth forms (`ResultsSignUpForm.tsx`, `ResultsSignInForm.tsx`) with same brand pattern
- Design reference: `apps/front/src/components/auth/_design-sketches/auth-final-direction.html`

---

## Story 7.14: Component Visual Consistency & Final Polish

As a **User**,
I want **all UI components to feel cohesive with the psychedelic-bold brand identity**,
So that **the application feels professional, trustworthy, and visually unified**.

**Dependencies:** All other Story 7.x stories

**Acceptance Criteria:**

**Given** I navigate through the application
**When** I encounter different components (buttons, cards, inputs, dialogs)
**Then** all components share consistent:
  - Border radius (from radius scale: 12px buttons, 16px cards, 24px dialogs)
  - Shadow depths
  - Spacing rhythm (from spacing scale)
  - Animation timing (150-300ms transitions)
  - Typography (Space Grotesk headings, DM Sans body, JetBrains Mono data)
**And** no component feels visually out of place

**Given** I use the application on mobile
**When** I interact with touch targets
**Then** all interactive elements are minimum 44x44px
**And** spacing is comfortable for touch interaction

**Given** I view any page in the app
**When** the page renders
**Then** no hard-coded colors remain (no `bg-gray-*`, `bg-slate-*`, `bg-blue-*`)
**And** all components use semantic tokens from globals.css
**And** focus states are visible and use `--ring` color
**And** `aria-hidden` is set on all decorative elements

**Technical Details:**

- Full audit of all shadcn/ui components for consistency with new tokens
- Remove all hard-coded color classes across the entire frontend
- Verify focus states across all interactive components
- Mobile touch target audit (44px minimum)
- Animation timing review (150ms for hover, 300ms for enter/exit)
- Shadow standardization (shadow-sm, shadow-md, shadow-lg)

**Acceptance Checklist:**
- [ ] Zero hard-coded color classes in the entire frontend
- [ ] All components use semantic tokens
- [ ] Border radius consistent per radius scale
- [ ] Shadow depths standardized
- [ ] Animation timings reviewed and consistent (150-300ms)
- [ ] Touch targets >= 44px on mobile
- [ ] Focus states visible and use `--ring` color
- [ ] Loading states polished (use OCEAN shape pulse animation)
- [ ] All decorative elements `aria-hidden`
- [ ] Lighthouse accessibility score >= 90
- [ ] Storybook documents all component variants

---

## Implementation Sequence

```
7.1 (Design Tokens) -----+
                          +----> 7.6 (Header) ----> 7.8 (Home Page)
7.2 (Typography) ---------+
                          +----> 7.9 (Results Page) ----> 7.12 (Share Profile)
7.3 (Dark Mode) ----------+
                          +----> 7.10 (Chat Polish)
7.4 (OCEAN Shapes) -------+
                          +----> 7.11 (Auth Gate) ----> 7.13 (User Profile)
7.5 (Trait Colors) --------+

7.7 (Illustrations) -------- (can parallel with 7.1-7.5)

                          +----> 7.14 (Final Polish, last)
```

1. **Story 7.1** — Psychedelic Brand Design Tokens (foundation for everything)
2. **Story 7.2** — Typography System (second foundation piece)
3. **Story 7.3** — Dark Mode Toggle (theme switching infrastructure)
4. **Story 7.4** — OCEAN Geometric Identity (brand mark, shapes, signature)
5. **Story 7.5** — Trait & Facet Colors (visualization palette)
6. **Story 7.7** — Illustration & Icon System (can start earlier, parallel track)
7. **Story 7.6** — Global Header (needs 7.1, 7.3, 7.4)
8. **Story 7.8** — Home Page Redesign (needs 7.1-7.5, 7.7)
9. **Story 7.9** — Results Page Visual Redesign (needs 7.1, 7.4, 7.5)
10. **Story 7.10** — Assessment Chat UX Polish (needs 7.1, 7.7)
11. **Story 7.11** — Auth-Gated Results Reveal (needs 7.1, 7.3, 7.4, 7.9)
12. **Story 7.15** — Auth Form Psychedelic Brand Redesign (needs 7.1-7.5)
13. **Story 7.12** — Shareable Public Profile & Share Cards (needs 7.9, 7.11)
14. **Story 7.13** — Registered User Profile Page (needs 7.6, 7.11)
15. **Story 7.14** — Component Visual Consistency & Final Polish (last)

---

## Technical Notes

### Current State (as of 2026-02-13)
- Tailwind v4 with CSS custom properties
- shadcn/ui component library
- Dark mode CSS defined in globals.css
- Dark mode variant configured
- Better Auth authentication configured
- Grayscale default palette (needs full replacement)
- No custom typography (uses default fonts)
- No OCEAN geometric shapes
- No illustration system
- No color block composition
- No trait/facet color system
- No auth gate on results
- No public profile/share cards
- No user dashboard/profile page
- No chat-to-results navigation

### Key Files
- `packages/ui/src/styles/globals.css` — Color, spacing, radius token definitions
- `packages/domain/src/utils/trait-colors.ts` — Trait/facet color utilities
- `apps/front/src/routes/__root.tsx` — ThemeProvider, font loading
- `apps/front/src/components/Header.tsx` — Header with geometric logo
- `apps/front/src/components/ocean-shapes/` — SVG shape components (new)
- `apps/front/src/components/home/` — Home page sections (new)
- `apps/front/src/components/ResultsAuthGate.tsx` — Auth gate teaser (new)
- `apps/front/src/components/SharePanel.tsx` — Share link UI (new)
- `apps/front/src/routes/dashboard.tsx` — User profile/dashboard (new)
- `apps/front/src/routes/profile/$shareId.tsx` — Public profile (new)

### Anti-Patterns to Avoid

```tsx
// BAD - Hard-coded colors
<div className="bg-blue-500 text-white">

// BAD - Blended gradients for hero (use color blocks)
<div className="bg-gradient-to-r from-pink-500 to-blue-500">

// BAD - Conservative minimalism (too clinical for personality platform)
<div className="bg-white text-gray-600">

// GOOD - Semantic variables
<div className="bg-primary text-primary-foreground">

// GOOD - Trait color variables
<div className="bg-[var(--trait-openness)]">

// GOOD - Color block composition (hard edges, not gradients for hero)
<div className="absolute inset-0">
  <div className="absolute bg-primary rounded-full w-[60%] h-[80%]" />
  <div className="absolute bg-tertiary rotate-45 w-[30%] h-[40%]" />
</div>
```

### Dependencies
- **Google Fonts:** Space Grotesk, DM Sans, JetBrains Mono
- **shadcn/ui additions:** Sheet, DropdownMenu (if not installed)
- **No other new npm packages required**

---

**Document Status:** Rewritten 2026-02-13 to align with new UX Design Specification. Includes 3 new stories (7.11 Auth Gate, 7.12 Share Profile, 7.13 User Dashboard) and updated Story 7.10 with chat-results navigation. Ready for review and implementation.

---
