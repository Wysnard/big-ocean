# Epic 7: UI Theme & Visual Polish

**Phase:** 2 (Post-MVP Polish)

**Goal:** Establish a distinctive ocean-inspired visual identity with dark mode support, custom color theming, and Big Five trait visualization colors.

**Dependencies:**
- Epic 4 (Frontend Assessment UI) - base components exist
- Epic 5 (Results & Profiles) - visualization surfaces ready

**Enables:** Brand differentiation, improved user experience, accessibility compliance

**User Value:** Polished, memorable visual experience that reinforces the "big-ocean" brand identity and supports user preferences (dark mode)

---

## Overview

The current UI uses shadcn/ui's default grayscale palette. This epic transforms the visual identity to:
1. **Ocean-themed primary colors** - Blue-based palette reflecting the "big-ocean" brand
2. **Dark mode support** - System preference detection + manual toggle
3. **Big Five trait colors** - Consistent visualization colors for personality traits
4. **Facet-level color variations** - Subtle variations within each trait family
5. **Gradient usage** - Ocean-inspired gradients for hero sections and accents
6. **Accessibility compliance** - WCAG AA contrast ratios maintained

---

## Design Principles

### 1. Semantic Theme Variables First

**Always prefer semantic variables over hard-coded colors.** This ensures:
- Automatic dark mode compatibility
- Consistent theming across components
- Single source of truth for color changes

```tsx
// ✅ GOOD - Use semantic variables
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
<div className="bg-muted text-muted-foreground">
<span className="text-destructive">

// ❌ BAD - Hard-coded colors
<button className="bg-blue-500 text-white hover:bg-blue-600">
<div className="bg-gray-100 text-gray-600">
```

### 2. Variable Hierarchy

| Level | Purpose | Example Variables |
|-------|---------|-------------------|
| **Core Semantic** | Base UI elements | `primary`, `secondary`, `muted`, `accent`, `destructive` |
| **Surface** | Backgrounds & cards | `background`, `card`, `popover` |
| **Trait-Specific** | Big Five traits | `--trait-openness`, `--trait-conscientiousness`, etc. |
| **Facet-Specific** | 30 facets (derived) | `--facet-imagination`, `--facet-orderliness`, etc. |
| **Gradient** | Hero sections, accents | `--gradient-ocean`, `--gradient-trait-*` |

### 3. When to Create New Variables

Create a **new CSS variable** when:
- A color has semantic meaning beyond core UI (traits, facets, status)
- The color needs to change between light/dark modes
- Multiple components share the same color purpose

**DO NOT** create variables for:
- One-off decorative colors (use Tailwind arbitrary values)
- Opacity variants (use `bg-primary/50` syntax)

### 4. Gradient Usage Guidelines

Gradients add depth and visual interest. Use them for:
- **Hero sections** - Page headers, welcome screens
- **Progress indicators** - Precision meter, completion bars
- **Trait visualizations** - Radar charts, score cards
- **CTA buttons** - Primary actions (sparingly)

```css
/* Ocean brand gradients */
--gradient-ocean: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
--gradient-ocean-subtle: linear-gradient(180deg, var(--primary)/10 0%, transparent 100%);

/* Trait gradients (for charts/visualizations) */
--gradient-trait-openness: linear-gradient(135deg, var(--trait-openness) 0%, var(--trait-openness)/60 100%);
```

---

## Story 7.1: Implement Ocean Brand Color Theme with Gradients

As a **User**,
I want **the application to have a distinctive ocean-inspired visual identity**,
So that **the brand feels cohesive and memorable**.

**Acceptance Criteria:**

**Given** the application loads
**When** I view any page
**Then** the primary color is ocean blue (not grayscale)
**And** the color palette feels cohesive across all components
**And** the brand identity is distinctive from default shadcn/ui

**Given** I interact with buttons, links, and focus states
**When** primary color is applied
**Then** all interactive elements use semantic variables (`bg-primary`, `text-primary-foreground`)
**And** hover/focus states have appropriate contrast
**And** WCAG AA contrast ratios are maintained (4.5:1 for text)

**Given** I view hero sections or key visual areas
**When** gradients are applied
**Then** ocean-inspired gradients create visual depth
**And** gradients work correctly in both light and dark modes

**Technical Details:**

- Update `packages/ui/src/styles/globals.css` with ocean-themed OKLCH values
- **Maximize use of semantic variables** - all components use `primary`, `secondary`, `muted`, `accent`
- Primary palette: Ocean blue (`oklch(0.55 0.2 240)` range)
- Secondary palette: Complementary teal/seafoam accents
- Define gradient CSS variables for reusable gradient patterns
- Test all shadcn/ui components with new palette
- Document color tokens in Storybook

**Semantic Color Token Updates:**
```css
:root {
  /* Core semantic tokens - USE THESE IN COMPONENTS */
  --primary: oklch(0.55 0.18 240);           /* Ocean blue */
  --primary-foreground: oklch(0.98 0.01 240);
  --secondary: oklch(0.92 0.03 240);         /* Light ocean tint */
  --secondary-foreground: oklch(0.25 0.10 240);
  --accent: oklch(0.75 0.12 195);            /* Seafoam accent */
  --accent-foreground: oklch(0.25 0.05 240);
  --muted: oklch(0.96 0.01 240);             /* Subtle ocean gray */
  --muted-foreground: oklch(0.50 0.03 240);
  --ring: oklch(0.60 0.15 240);              /* Focus ring */

  /* Gradient tokens */
  --gradient-ocean: linear-gradient(135deg, oklch(0.55 0.18 240) 0%, oklch(0.65 0.15 195) 100%);
  --gradient-ocean-subtle: linear-gradient(180deg, oklch(0.55 0.18 240 / 0.08) 0%, transparent 100%);
  --gradient-ocean-radial: radial-gradient(ellipse at top, oklch(0.55 0.18 240 / 0.15) 0%, transparent 70%);
}

.dark {
  --primary: oklch(0.65 0.15 240);           /* Brighter for dark mode */
  --primary-foreground: oklch(0.15 0.02 240);
  --secondary: oklch(0.25 0.05 240);
  --secondary-foreground: oklch(0.90 0.02 240);
  --accent: oklch(0.60 0.12 195);
  --accent-foreground: oklch(0.95 0.02 195);
  --muted: oklch(0.22 0.02 240);
  --muted-foreground: oklch(0.65 0.03 240);

  /* Dark mode gradients */
  --gradient-ocean: linear-gradient(135deg, oklch(0.50 0.15 240) 0%, oklch(0.55 0.12 195) 100%);
  --gradient-ocean-subtle: linear-gradient(180deg, oklch(0.65 0.15 240 / 0.10) 0%, transparent 100%);
}
```

**Tailwind Theme Extension:**
```css
@theme inline {
  /* Map CSS vars to Tailwind for gradient utilities */
  --gradient-ocean: var(--gradient-ocean);
  --gradient-ocean-subtle: var(--gradient-ocean-subtle);
  --gradient-ocean-radial: var(--gradient-ocean-radial);
}
```

**Usage Examples:**
```tsx
// Hero section with gradient
<div className="bg-[image:var(--gradient-ocean-subtle)]">

// CTA button with gradient
<Button className="bg-[image:var(--gradient-ocean)] text-primary-foreground">

// Always use semantic variables for standard UI
<Card className="bg-card text-card-foreground border-border">
<Button className="bg-primary text-primary-foreground">
<Badge className="bg-secondary text-secondary-foreground">
```

**Acceptance Checklist:**
- [ ] All semantic tokens updated to ocean palette in globals.css
- [ ] Components use semantic variables (`bg-primary`, not `bg-blue-500`)
- [ ] Gradient CSS variables defined for light and dark modes
- [ ] Hero/welcome sections use gradient backgrounds
- [ ] All buttons use `bg-primary text-primary-foreground`
- [ ] Focus rings use ocean blue via `ring` variable
- [ ] Card and surface colors use `bg-card`, `bg-muted`
- [ ] WCAG AA contrast verified (use axe or Lighthouse)
- [ ] Storybook documents color tokens and gradient usage

---

## Story 7.2: Add Dark Mode Toggle with System Preference Detection

As a **User**,
I want **to switch between light and dark themes**,
So that **I can use the app comfortably in any lighting condition**.

**Acceptance Criteria:**

**Given** I visit the application for the first time
**When** my system is set to dark mode
**Then** the app renders in dark mode automatically
**And** no flash of light mode occurs (SSR-safe)

**Given** I click the theme toggle button
**When** the toggle activates
**Then** the theme switches immediately (light ↔ dark)
**And** my preference is persisted to localStorage
**And** the toggle icon reflects current theme (sun/moon)

**Given** I have a saved theme preference
**When** I return to the application
**Then** my saved preference is applied
**And** system preference is overridden by my choice

**Technical Details:**

- Add ThemeProvider component wrapping the app in `__root.tsx`
- Implement `useTheme` hook for toggle functionality
- Use `localStorage` key: `big-ocean-theme` with values: `light`, `dark`, `system`
- Add `.dark` class to `<html>` element (already configured in CSS)
- Prevent flash: inline script in `<head>` checks preference before render
- SSR-safe: TanStack Start compatible implementation

**Component Structure:**
```
packages/ui/src/components/
├── theme-provider.tsx    # Context provider
├── theme-toggle.tsx      # Toggle button component
└── use-theme.ts          # Theme hook
```

**Acceptance Checklist:**
- [ ] ThemeProvider wraps app in __root.tsx
- [ ] useTheme hook returns { theme, setTheme, systemTheme }
- [ ] Theme toggle button in Header component
- [ ] Dark mode CSS variables already defined (verified)
- [ ] System preference detection works
- [ ] Manual toggle overrides system preference
- [ ] Preference persisted to localStorage
- [ ] No flash of unstyled content on load
- [ ] SSR-compatible (TanStack Start)
- [ ] Storybook documents ThemeToggle component

---

## Story 7.3: Define Big Five Trait and Facet Visualization Colors

As a **User**,
I want **each personality trait and facet to have a distinctive, consistent color**,
So that **I can quickly identify traits in charts and results, with facets visually grouped under their parent trait**.

**Acceptance Criteria:**

**Given** I view my assessment results
**When** traits are displayed in charts or cards
**Then** each trait has a unique, recognizable color:
  - Openness: Purple (creativity, imagination)
  - Conscientiousness: Blue (stability, reliability)
  - Extraversion: Orange/Yellow (energy, warmth)
  - Agreeableness: Green (harmony, nature)
  - Neuroticism: Red/Coral (intensity, emotion)
**And** colors are consistent across all visualizations
**And** colors work in both light and dark modes

**Given** I view facet-level details
**When** individual facets are displayed
**Then** each facet uses a variation of its parent trait color
**And** facets are visually grouped with their trait
**And** facet variations are subtle but distinguishable

**Given** trait/facet colors are displayed
**When** accessibility is tested
**Then** each color has sufficient contrast against backgrounds
**And** colors are distinguishable for colorblind users (tested with simulator)

**Technical Details:**

- Add trait color CSS custom properties to globals.css
- Add facet color CSS custom properties (derived from traits)
- Use OKLCH for perceptual uniformity and easy hue/lightness adjustments
- Define both light and dark mode variants
- Create utility functions in domain package:
  - `getTraitColor(trait: TraitName): string`
  - `getFacetColor(facet: FacetName): string`
  - `getTraitGradient(trait: TraitName): string`
- Integrate with chart components (if using Recharts/Chart.js)

**Color Token Hierarchy:**

```css
:root {
  /* === TRAIT COLORS (5 traits) === */
  --trait-openness: oklch(0.65 0.18 290);           /* Purple */
  --trait-conscientiousness: oklch(0.55 0.18 230);  /* Blue */
  --trait-extraversion: oklch(0.75 0.18 65);        /* Orange */
  --trait-agreeableness: oklch(0.65 0.18 145);      /* Green */
  --trait-neuroticism: oklch(0.60 0.20 25);         /* Coral */

  /* === FACET COLORS (30 facets - derived from traits) === */
  /* Openness facets (purple family, hue 280-300) */
  --facet-imagination: oklch(0.68 0.16 295);
  --facet-artistic-interests: oklch(0.63 0.17 288);
  --facet-emotionality: oklch(0.66 0.15 292);
  --facet-adventurousness: oklch(0.70 0.14 285);
  --facet-intellect: oklch(0.62 0.18 298);
  --facet-liberalism: oklch(0.67 0.15 282);

  /* Conscientiousness facets (blue family, hue 220-240) */
  --facet-self-efficacy: oklch(0.58 0.16 235);
  --facet-orderliness: oklch(0.53 0.17 228);
  --facet-dutifulness: oklch(0.56 0.15 232);
  --facet-achievement-striving: oklch(0.60 0.14 225);
  --facet-self-discipline: oklch(0.52 0.18 238);
  --facet-cautiousness: oklch(0.57 0.15 222);

  /* Extraversion facets (orange family, hue 55-75) */
  --facet-friendliness: oklch(0.78 0.16 70);
  --facet-gregariousness: oklch(0.73 0.17 62);
  --facet-assertiveness: oklch(0.76 0.15 68);
  --facet-activity-level: oklch(0.80 0.14 58);
  --facet-excitement-seeking: oklch(0.72 0.18 72);
  --facet-cheerfulness: oklch(0.77 0.15 55);

  /* Agreeableness facets (green family, hue 135-155) */
  --facet-trust: oklch(0.68 0.16 150);
  --facet-morality: oklch(0.63 0.17 142);
  --facet-altruism: oklch(0.66 0.15 148);
  --facet-cooperation: oklch(0.70 0.14 138);
  --facet-modesty: oklch(0.62 0.18 152);
  --facet-sympathy: oklch(0.67 0.15 145);

  /* Neuroticism facets (coral/red family, hue 15-35) */
  --facet-anxiety: oklch(0.63 0.18 30);
  --facet-anger: oklch(0.58 0.20 20);
  --facet-depression: oklch(0.55 0.17 28);
  --facet-self-consciousness: oklch(0.65 0.16 32);
  --facet-immoderation: oklch(0.60 0.19 18);
  --facet-vulnerability: oklch(0.62 0.17 25);

  /* === TRAIT GRADIENTS === */
  --gradient-trait-openness: linear-gradient(135deg, var(--trait-openness) 0%, oklch(0.70 0.12 290 / 0.7) 100%);
  --gradient-trait-conscientiousness: linear-gradient(135deg, var(--trait-conscientiousness) 0%, oklch(0.60 0.12 230 / 0.7) 100%);
  --gradient-trait-extraversion: linear-gradient(135deg, var(--trait-extraversion) 0%, oklch(0.80 0.12 65 / 0.7) 100%);
  --gradient-trait-agreeableness: linear-gradient(135deg, var(--trait-agreeableness) 0%, oklch(0.70 0.12 145 / 0.7) 100%);
  --gradient-trait-neuroticism: linear-gradient(135deg, var(--trait-neuroticism) 0%, oklch(0.65 0.14 25 / 0.7) 100%);
}

.dark {
  /* Trait colors - slightly brighter for dark mode */
  --trait-openness: oklch(0.70 0.15 290);
  --trait-conscientiousness: oklch(0.60 0.15 230);
  --trait-extraversion: oklch(0.80 0.15 65);
  --trait-agreeableness: oklch(0.70 0.15 145);
  --trait-neuroticism: oklch(0.65 0.17 25);

  /* Facet colors adjust automatically via OKLCH lightness */
  /* (Define overrides only if needed for specific facets) */
}
```

**Tailwind Theme Extension:**
```css
@theme inline {
  /* Expose trait colors to Tailwind */
  --color-trait-openness: var(--trait-openness);
  --color-trait-conscientiousness: var(--trait-conscientiousness);
  --color-trait-extraversion: var(--trait-extraversion);
  --color-trait-agreeableness: var(--trait-agreeableness);
  --color-trait-neuroticism: var(--trait-neuroticism);
}
```

**Utility Functions (packages/domain/src/utils/trait-colors.ts):**
```typescript
import type { TraitName, FacetName } from "../types";
import { FACET_TO_TRAIT } from "../constants/big-five";

export function getTraitColor(trait: TraitName): string {
  return `var(--trait-${trait})`;
}

export function getFacetColor(facet: FacetName): string {
  return `var(--facet-${facet})`;
}

export function getTraitGradient(trait: TraitName): string {
  return `var(--gradient-trait-${trait})`;
}

// For chart libraries that need raw values
export function getTraitColorValue(trait: TraitName): string {
  const colors: Record<TraitName, string> = {
    openness: "oklch(0.65 0.18 290)",
    conscientiousness: "oklch(0.55 0.18 230)",
    extraversion: "oklch(0.75 0.18 65)",
    agreeableness: "oklch(0.65 0.18 145)",
    neuroticism: "oklch(0.60 0.20 25)",
  };
  return colors[trait];
}
```

**Usage Examples:**
```tsx
// Trait card with gradient background
<Card
  className="bg-[image:var(--gradient-trait-openness)]"
  style={{ '--tw-bg-opacity': 0.1 } as React.CSSProperties}
>
  <h3 className="text-[var(--trait-openness)]">Openness</h3>
</Card>

// Facet badge
<Badge className="bg-[var(--facet-imagination)] text-white">
  Imagination: 16/20
</Badge>

// Chart with trait colors (Recharts example)
<RadarChart>
  <Radar
    dataKey="openness"
    stroke={getTraitColorValue("openness")}
    fill={getTraitColorValue("openness")}
    fillOpacity={0.3}
  />
</RadarChart>
```

**Acceptance Checklist:**
- [ ] 5 trait color tokens added to globals.css
- [ ] 30 facet color tokens added (grouped by trait)
- [ ] 5 trait gradient tokens defined
- [ ] Dark mode variants for all trait colors
- [ ] `getTraitColor()` utility function created
- [ ] `getFacetColor()` utility function created
- [ ] `getTraitGradient()` utility function created
- [ ] Colors tested for colorblind accessibility (Coblis simulator)
- [ ] WCAG AA contrast verified for text on trait/facet colors
- [ ] Results page uses trait colors via semantic variables
- [ ] Facet breakdown uses facet colors consistently
- [ ] Chart components use trait colors (if applicable)
- [ ] Storybook documents trait and facet color palettes

---

## Story 7.4: Polish Component Visual Consistency

As a **User**,
I want **all UI components to feel cohesive and polished**,
So that **the application feels professional and trustworthy**.

**Acceptance Criteria:**

**Given** I navigate through the application
**When** I encounter different components (buttons, cards, inputs, dialogs)
**Then** all components share consistent:
  - Border radius (using --radius tokens)
  - Shadow depths
  - Spacing rhythm
  - Animation timing
**And** no component feels visually out of place

**Given** I use the application on mobile
**When** I interact with touch targets
**Then** all interactive elements are minimum 44x44px
**And** spacing is comfortable for touch interaction

**Technical Details:**

- Audit all shadcn/ui components for consistency
- Ensure `--radius` tokens used consistently
- Standardize shadow usage (shadow-sm, shadow-md, shadow-lg)
- Review animation durations (prefer 150-300ms)
- Mobile touch target audit

**Acceptance Checklist:**
- [ ] Border radius consistent across components
- [ ] Shadow depths standardized
- [ ] Animation timings reviewed and consistent
- [ ] Touch targets ≥44px on mobile
- [ ] Component spacing uses consistent scale
- [ ] Focus states visible and consistent
- [ ] Loading states polished (skeletons, spinners)

---

## Story 7.5: Redesign Home Page with Theme System

> **Detailed Brainstorm:** See [story-7.5-home-page-brainstorm.md](./story-7.5-home-page-brainstorm.md) for full design exploration, wireframes, and component specifications.

As a **User**,
I want **the home page to showcase the ocean brand identity with polished visuals**,
So that **I immediately understand the product value and feel invited to start an assessment**.

### Design Direction: "Bento Ocean with Depth"

**Chosen Concept:** Hybrid approach combining:
- **Bento grid layout** for scannability and mobile-friendliness
- **Subtle depth progression** in background (light surface → deeper sections)
- **Interactive chat preview** showing Nerin conversation
- **Clean typography** with professional, trustworthy feel

### Page Sections

```
┌─────────────────────────────────────────────────────────────┐
│  1. HERO (Full viewport)                                    │
│     - Radial ocean gradient background                      │
│     - Animated wave logo                                    │
│     - "Big Ocean" gradient text                             │
│     - Primary CTA + secondary "How it works"                │
│     - Micro social proof (star rating)                      │
├─────────────────────────────────────────────────────────────┤
│  2. VALUE PROPS (Bento Grid - 3 cards)                      │
│     - "Conversation, not quiz"                              │
│     - "30 facets, not 5 traits"                             │
│     - "AI that adapts to you"                               │
├─────────────────────────────────────────────────────────────┤
│  3. MEET NERIN (Chat preview)                               │
│     - Mockup of chat interface                              │
│     - Sample conversation with Nerin                        │
│     - "This isn't a quiz. It's a conversation."             │
├─────────────────────────────────────────────────────────────┤
│  4. THE FIVE DIMENSIONS (Trait bento cards)                 │
│     - Asymmetric grid with trait colors                     │
│     - Each card uses --gradient-trait-*                     │
│     - Hover reveals facet breakdown                         │
├─────────────────────────────────────────────────────────────┤
│  5. WHAT YOU'LL DISCOVER (Result teaser)                    │
│     - Blurred archetype card preview                        │
│     - "Your unique archetype awaits"                        │
│     - CTA to reveal                                         │
├─────────────────────────────────────────────────────────────┤
│  6. SOCIAL PROOF (Optional for MVP)                         │
│     - Testimonial cards                                     │
│     - User count / credibility                              │
├─────────────────────────────────────────────────────────────┤
│  7. FINAL CTA                                               │
│     - Ocean gradient background                             │
│     - "Takes 30 min · Free · No account needed"             │
└─────────────────────────────────────────────────────────────┘
```

### Acceptance Criteria

**Given** I visit the home page
**When** the page loads
**Then** I see a visually striking hero section with:
  - Radial ocean gradient background (`--gradient-ocean-radial`)
  - Animated wave logo with gentle motion
  - "Big Ocean" wordmark with gradient text effect
  - Clear value proposition: "Personality assessment that actually understands you."
  - Primary CTA button with ocean gradient
  - Micro social proof (star rating + quote)
  - Scroll indicator animation
**And** the design works in both light and dark modes

**Given** I scroll past the hero
**When** I view the value props section
**Then** I see 3 bento cards explaining differentiation:
  - "Conversation, Not Quiz" with chat icon
  - "30 Facets, Not 5" with layers icon
  - "AI That Adapts" with sparkles icon
**And** cards have subtle gradient hover effects

**Given** I view the "Meet Nerin" section
**When** the chat preview appears
**Then** I see a realistic chat interface mockup with:
  - Nerin avatar and name
  - Sample conversation messages (2-3 exchanges)
  - Fake input field with "Try typing a response..." placeholder
  - Text: "This isn't a quiz. It's a conversation."

**Given** I view the Big Five traits section
**When** trait cards are displayed
**Then** each trait card uses its corresponding `--trait-*` color
**And** cards are in asymmetric bento layout (Openness larger)
**And** icons match trait colors (not hard-coded)
**And** hover states reveal `--gradient-trait-*` and facet preview
**And** cards feel cohesive with the ocean brand

**Given** I view the page on mobile
**When** the layout adapts
**Then** hero section is full viewport with readable text
**And** bento grids collapse to single column
**And** CTA buttons are full-width and prominent (min 44px height)
**And** chat preview is scrollable if needed

**Given** I interact with CTA buttons
**When** I hover or focus
**Then** buttons use `--gradient-ocean` with smooth transitions
**And** focus states are visible (ring) and accessible

### Current Issues to Address

The existing home page (`apps/front/src/routes/index.tsx`) has:
- ❌ Hard-coded colors: `text-amber-400`, `text-blue-400`, `bg-slate-900`
- ❌ Hard-coded gradients: `bg-gradient-to-r from-blue-500 to-purple-500`
- ❌ Dark-only design (no light mode support)
- ❌ Trait icons use wrong colors (amber for Openness should be purple)
- ❌ No semantic variables used
- ❌ No social proof or differentiation messaging
- ❌ No preview of the product (chat interface)
- ❌ No archetype teaser
- ❌ Static, no entrance animations

### Technical Details

**Component Structure:**
```
apps/front/src/
├── routes/index.tsx                    # Home page (orchestrator)
├── components/
│   └── home/
│       ├── HeroSection.tsx             # Hero with gradient + animations
│       ├── ValuePropsSection.tsx       # 3-column bento
│       ├── ValueCard.tsx               # Individual value prop card
│       ├── ChatPreviewSection.tsx      # Nerin demo mockup
│       ├── ChatBubble.tsx              # Chat message component
│       ├── TraitsSection.tsx           # Trait cards grid
│       ├── TraitCard.tsx               # Individual trait card
│       ├── ResultsTeaserSection.tsx    # Blurred archetype preview
│       ├── FinalCTASection.tsx         # Bottom CTA
│       ├── WaveLogoAnimated.tsx        # Animated wave logo
│       └── ScrollIndicator.tsx         # Bounce arrow
```

**Key Animations:**
```css
/* Wave logo - gentle motion */
@keyframes wave {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-3px) rotate(2deg); }
  75% { transform: translateY(3px) rotate(-2deg); }
}

/* Scroll indicator - bounce */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
}

/* Entrance - fade up */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Hero Gradient (Light Mode):**
```css
--gradient-hero: radial-gradient(
  ellipse 80% 50% at 50% 100%,
  oklch(0.75 0.12 210 / 0.3) 0%,
  oklch(0.92 0.03 220 / 0.1) 50%,
  transparent 100%
);
```

**Hero Gradient (Dark Mode):**
```css
--gradient-hero-dark: radial-gradient(
  ellipse 80% 50% at 50% 100%,
  oklch(0.35 0.12 240 / 0.5) 0%,
  oklch(0.15 0.05 240 / 0.3) 50%,
  transparent 100%
);
```

### Copy & Messaging

| Section | Headline | Subtext |
|---------|----------|---------|
| Hero | "Big Ocean" | Personality assessment that actually understands you. |
| Value Props | — | Conversation not quiz / 30 facets not 5 / AI that adapts |
| Chat Preview | "Meet Nerin" | Your AI conversation partner for personality discovery |
| Traits | "The Five Dimensions of You" | — |
| Results Teaser | "Discover Your Archetype" | Every personality is unique. Yours has a name. |
| Final CTA | "Ready to dive in?" | Takes 30 minutes · Free · No account needed |

### Acceptance Checklist

**Structure:**
- [ ] 7 sections implemented as separate components
- [ ] Components extracted to `apps/front/src/components/home/`
- [ ] Mobile-first responsive layout

**Theming:**
- [ ] Hero uses `--gradient-ocean-radial` (or `--gradient-hero`)
- [ ] "Big Ocean" text uses gradient via `bg-clip-text`
- [ ] All trait icons use `--trait-*` colors
- [ ] Trait cards use `--gradient-trait-*` on hover
- [ ] All cards use semantic variables (`bg-card`, `border-border`)
- [ ] CTA buttons use `--gradient-ocean`
- [ ] No hard-coded color classes remain

**Light/Dark Mode:**
- [ ] Page works correctly in light mode
- [ ] Page works correctly in dark mode
- [ ] Gradients adapt to mode

**Animations:**
- [ ] Wave logo has gentle animation
- [ ] Scroll indicator bounces
- [ ] Sections fade in on scroll (optional: use Intersection Observer)
- [ ] Respects `prefers-reduced-motion`

**Content:**
- [ ] Chat preview section shows Nerin conversation
- [ ] Archetype teaser shows blurred preview
- [ ] Value props communicate differentiation

**Performance & Accessibility:**
- [ ] Lighthouse accessibility score ≥ 90
- [ ] All touch targets ≥ 44px
- [ ] Images/animations are optimized
- [ ] No layout shift on load

---

## Implementation Sequence

1. **Story 7.1** (Ocean Brand Colors + Gradients) - Foundation for visual identity
2. **Story 7.2** (Dark Mode) - User preference support
3. **Story 7.3** (Trait + Facet Colors) - Visualization consistency with full hierarchy
4. **Story 7.5** (Home Page Redesign) - Apply theming to flagship page
5. **Story 7.4** (Polish) - Final consistency pass across all pages

**Estimated Effort:** 7-10 days total
- Story 7.1: 1 day (ocean colors + gradients)
- Story 7.2: 1 day (dark mode toggle)
- Story 7.3: 1 day (trait + facet colors)
- Story 7.5: 2-3 days (home page complete redesign with 7 sections)
- Story 7.4: 1-2 days (visual polish)
- Story 7.5: 1-2 days (home page redesign)
- Story 7.4: 1-2 days (visual polish)

---

## Technical Notes

### Current State (as of 2026-02-11)
- Tailwind v4 with OKLCH color tokens ✅
- shadcn/ui component library ✅
- Dark mode CSS defined in globals.css ✅
- Dark mode variant configured: `@custom-variant dark (&:is(.dark *));` ✅
- No theme toggle implementation yet ❌
- Grayscale primary palette (default shadcn) ❌
- No trait/facet color system ❌
- No gradient tokens ❌

### Key Files
- `packages/ui/src/styles/globals.css` - Color token definitions (main file to update)
- `packages/domain/src/utils/trait-colors.ts` - Trait/facet color utilities (new file)
- `apps/front/src/routes/__root.tsx` - ThemeProvider integration
- `apps/front/src/components/Header.tsx` - Theme toggle placement

### Variable Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Core semantic | `--{name}` | `--primary`, `--muted` |
| Core foreground | `--{name}-foreground` | `--primary-foreground` |
| Trait | `--trait-{trait}` | `--trait-openness` |
| Facet | `--facet-{facet}` | `--facet-imagination` |
| Gradient | `--gradient-{purpose}` | `--gradient-ocean`, `--gradient-trait-openness` |

### Dependencies
- No new npm packages required (can implement without next-themes)
- Optional: `next-themes` for SSR-safe theme management

### Anti-Patterns to Avoid

```tsx
// ❌ BAD - Hard-coded colors
<div className="bg-blue-500 text-white">

// ❌ BAD - Arbitrary values for recurring colors
<div className="bg-[#3b82f6]">

// ❌ BAD - Inline styles for theme colors
<div style={{ backgroundColor: 'oklch(0.55 0.18 240)' }}>

// ✅ GOOD - Semantic variables
<div className="bg-primary text-primary-foreground">

// ✅ GOOD - Domain-specific variables
<div className="bg-[var(--trait-openness)]">

// ✅ GOOD - Gradient variables
<div className="bg-[image:var(--gradient-ocean)]">
```

---

**Document Status:** Ready for review and implementation.
