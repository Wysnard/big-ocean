# UX Design Specification: Public Profile Redesign (Story 15-1)

**Author:** Vincentlay + Sally (UX Designer)
**Date:** 2026-02-24
**Design Direction:** D+B Hybrid — "The Story Scroll" with poster-scale radar

---

## 1. Design Philosophy

The public profile is the **first impression surface** of big-ocean — potentially the first thing a new user ever sees. It must be more visually striking than the results page while sharing the same design language.

**Guiding Principle:**
- **Results page** = the album with liner notes — analytical, expandable, informationally complete (for the assessed user)
- **Public profile** = the album cover in a record shop window — editorial, curated, impressive (for the visitor)

**Visual Language:** Geometric shapes, psychedelic color fields, bold saturated OCEAN trait palette, editorial typography. Consistent with the existing UX design specification's Visual Design Foundation and Credibility Gradient Pattern.

**Key Difference from Current Implementation:** The current public profile reuses `<ProfileView>` identically to the results page — it's the results page with holes in it. The redesign gives the public profile its own page composition: a vertical editorial scroll that builds narrative momentum toward a call to action.

---

## 2. Information Architecture

### What's Shown (Public)

| Data | Source | Display |
|------|--------|---------|
| Display name | `profile.displayName` | Hero subtitle |
| Archetype name | `profile.archetypeName` | Hero headline |
| OCEAN code (5 letters) | `profile.oceanCode` | Hero, letter-colored |
| GeometricSignature | Derived from OCEAN code | Hero, animated |
| 5 trait scores (0–120) | Derived from facets | Radar chart + strata bands |
| 5 trait levels (L/M/H) | `profile.traitSummary` | Strata band headers |
| 30 facet scores (0–20) | `profile.facets` | Strata band facet bars |
| Archetype description | `profile.description` | Dedicated editorial section |

### What's NOT Shown (Private)

- Personal portrait / personality description
- Conversation evidence and quotes
- Confidence scores (per-trait and per-facet)
- Confidence ring card
- Message count / session details
- OceanCodeStrand (replaced by strata)
- DetailZone (expandable evidence panels)

### CTA Logic

| Visitor State | CTA Copy | Action |
|---|---|---|
| Unauthenticated | "Discover Your Personality" | Navigate to `/signup` or `/chat` |
| Authenticated, no completed assessment | "Start Your Assessment" | Navigate to `/chat` |
| Authenticated, has completed assessment | "Start Relationship Analysis" | Navigate to `/relationship-analysis?with={publicProfileId}` |

---

## 3. Page Structure — The Story Scroll

The page is a **5-section vertical scroll**. Each section is a full-width dramatic moment. No expandable panels, no interactive toggling — pure curated presentation.

```
Section 1: Archetype Hero          (70–85vh, full-bleed)
Section 2: The Shape               (80vh, full-bleed, psychedelic bg)
Section 3: Trait Strata            (auto height, max-w 1120px)
Section 4: Archetype Description   (auto height, full-bleed gradient bg)
Section 5: Call to Action          (auto height, full-bleed gradient bg)
```

---

## 4. Section Specifications

### Section 1: Archetype Hero

**Purpose:** Immediate emotional impact. The visitor knows whose profile this is and what their archetype is within 2 seconds.

**Layout:** Full-bleed, centered content, min-height 70vh (desktop) / 85vh (mobile).

**Background:**
- Dominant trait color at ~8% opacity fill
- Decorative geometric shapes (reuse existing `ArchetypeHeroSection` pattern):
  - Large circle: top-right, 60vmin, trait color, opacity 0.85
  - Triangle: bottom-left, 35vmin, clip-path polygon, trait color, opacity 0.35
  - Small rectangle: top-left, 18vmin, rounded, trait color, opacity 0.2

**Content Stack (vertically centered, z-30):**

1. **Subtitle:** `{displayName}'s Personality`
   - `text-sm uppercase tracking-widest text-muted-foreground`

2. **GeometricSignature** (reuse existing component)
   - `animate` prop enabled (shape-reveal animation on load)
   - 5 shapes in OCEAN order, sized by level (H/M/L)

3. **Archetype Name:** e.g. "The Reflective Strategist"
   - `font-display text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] font-bold text-foreground`
   - Fluid clamp for responsive sizing

4. **OCEAN Code:** e.g. "H H M H M"
   - `font-mono text-2xl md:text-3xl lg:text-5xl tracking-[0.3em]`
   - Each letter colored by its trait CSS variable

5. **Scroll Indicator:**
   - Animated chevron (CSS `animate-bounce`)
   - Fades to `opacity-0` on first scroll via IntersectionObserver
   - `text-muted-foreground`

**Component:** Reuse `<ArchetypeHeroSection>` with minor modifications:
- Add scroll indicator
- Remove confidence pill (not shown on public profile)
- Accept optional `subtitle` prop for "{name}'s Personality" vs "Your Personality Archetype"

---

### Section 2: The Shape (Radar)

**Purpose:** The personality at a glance — a single visual that communicates the shape of this person's Big Five profile. This is the "poster moment."

**Layout:** Full-bleed background, centered content, min-height 80vh (desktop) / 70vh (mobile).

**Background — Psychedelic Geometric Pattern:**
- Concentric geometric shapes (circles, triangles, diamonds) in all 5 trait colors
- Each shape at 3–5% opacity
- Slow CSS rotation: `@keyframes rotate { to { transform: rotate(360deg) } }`, 60s cycle
- Applied to a pseudo-element so content is unaffected
- `prefers-reduced-motion`: static, no rotation

**Content:**

1. **Section Title:** "Personality Shape"
   - `font-display text-2xl text-center text-muted-foreground`

2. **Radar Chart** (oversized)
   - Desktop: 400×400px minimum, centered
   - Mobile: 280×280px minimum, centered
   - Reuse existing `<PersonalityRadarChart>` component
   - Modifications needed:
     - Accept `width`/`height` props (currently hardcoded via ChartContainer)
     - Add **external score labels** at each vertex: trait initial + score (e.g., "O: 87")
     - Labels: `font-data text-xl`, colored in trait color, positioned outside polygon vertices
   - Existing features retained: gradient fill across polygon (25% opacity), colored dots per vertex

3. **Legend Row:**
   - Centered below chart
   - Each trait: shape icon + trait name in trait color
   - `text-sm`, spaced evenly
   - Desktop: single row; Mobile: 2-row wrap

**New Component:** `<PsychedelicBackground>`
- CSS-only decorative layer
- Props: `intensity?: 'subtle' | 'medium'` (controls opacity range)
- Renders concentric geometric shapes as pseudo-elements
- Handles `prefers-reduced-motion` internally

---

### Section 3: Trait Strata

**Purpose:** Detailed personality breakdown — all 5 traits with their 6 facets each, displayed as colored geological layers. This is the data-rich section.

**Layout:** Max-width 1120px, centered, auto height. Bands stacked vertically with 1px gap (they feel like geological layers).

**Each Trait Band:**

```
┌────────────────────────────────────────────────────────────┐
│  [4px left border in trait color]                          │
│  [bg: trait color at 5% opacity]                           │
│  [padding: p-6]                                            │
│                                                            │
│  HEADER                                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │ [OceanShape] [Trait Name]               [Score]/120    ││
│  │ [font-display text-xl]       [font-data text-2xl       ││
│  │                               in trait color]          ││
│  │                                                        ││
│  │ [Full-width score bar: h-2, rounded-full,              ││
│  │  fill in trait color, track in muted]                  ││
│  └────────────────────────────────────────────────────────┘│
│                                                            │
│  FACETS                                                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │ [3-column grid desktop / 2-column tablet / 1-col mob]  ││
│  │ [gap-x-8 gap-y-3]                                     ││
│  │                                                        ││
│  │  Facet Name              Score                         ││
│  │  [text-sm                [font-data text-sm            ││
│  │   muted-foreground]       trait color]                  ││
│  │  [bar: h-1.5, rounded-full, trait color at 70% opacity ││
│  │   fill proportional to score/20]                       ││
│  └────────────────────────────────────────────────────────┘│
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Order:** OCEAN — Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism.

**Animation (optional):** Each band fades in on scroll via IntersectionObserver + `translate-y` transition. 200ms stagger per band. Subtle — `transform: translateY(12px)` to `translateY(0)` with `opacity: 0` to `1`.

**New Component:** `<TraitBand>`

```typescript
interface TraitBandProps {
  trait: TraitResult;
  facets: FacetResult[];
}
```

Renders the horizontal full-width band layout. Reuses:
- Ocean shape icons from existing `TraitCard` (`OceanCircle`, `OceanHalfCircle`, etc.)
- `getTraitColor()` utility for CSS variable access

**Shared Component (extract):** `<FacetScoreBar>`
- Small facet name + score + thin bar
- Currently inline in `TraitCard` — extract to reuse in both `TraitCard` (results page) and `TraitBand` (public profile)

---

### Section 4: Archetype Description

**Purpose:** Narrative anchor. The archetype description paints a human picture of the personality in broad strokes. This is the editorial moment — large type, generous whitespace, decorative accents.

**Layout:** Full-bleed background, content max-width 720px centered, padding py-20 md:py-32.

**Background:**
- Subtle gradient using dominant trait color:
  ```
  linear-gradient(180deg,
    var(--trait-{dominant}) 3%, transparent 40%,
    transparent 60%, var(--trait-{secondary}) 3%)
  ```
  Where `secondary` = second-highest scoring trait

**Content:**

1. **Divider:** `<GeometricSignature>` (small, muted, centered) — visual break from strata

2. **Section Title:** "About The {Archetype Name}"
   - `font-display text-2xl text-center text-muted-foreground`

3. **Description Block:**
   - `font-body text-lg md:text-xl leading-relaxed text-foreground`
   - Max-width 720px for comfortable reading line length
   - Decorative quotation marks:
     - Left + right `"` characters in trait color at 20% opacity
     - `font-display text-8xl absolute` positioned flanking the text

4. **Decorative Accents (margins):**
   - Vertical column of 5 OCEAN shapes stacked on each side
   - Trait colors at 15% opacity
   - `aria-hidden="true"`
   - Desktop only — hidden on mobile

**New Component:** `<ArchetypeDescriptionSection>`

```typescript
interface ArchetypeDescriptionSectionProps {
  archetypeName: string;
  description: string;
  dominantTrait: TraitName;
  secondaryTrait: TraitName;
}
```

---

### Section 5: Call to Action

**Purpose:** Convert the visitor. Two goals: (1) engage existing users into relationship analysis, (2) convert new visitors into assessments.

**Layout:** Full-bleed background, content max-width 600px centered, padding py-16 md:py-24.

**Background:**
```css
linear-gradient(135deg,
  oklch(0.67 0.13 181 / 0.08),   /* agreeableness teal */
  oklch(0.55 0.24 293 / 0.06))   /* openness purple */
```

**Three Conditional States:**

#### State A: Unauthenticated

```
Curious about your own personality?

Discover your archetype through a
10-minute conversation with our AI.

[ 🌊 Discover Your Personality ]     ← primary button

── big-ocean ──
```

- Button links to `/signup` or `/chat` (TBD based on auth flow)

#### State B: Authenticated + No Assessment

```
Want to compare personalities?

Complete your own assessment first,
then unlock relationship analysis.

[ 🌊 Start Your Assessment ]         ← primary button

── big-ocean ──
```

- Button links to `/chat`

#### State C: Authenticated + Has Assessment

```
See how you compare with {displayName}

Explore where you align and where you
differ across all personality traits.

[ 🔗 Start Relationship Analysis ]   ← primary button

── big-ocean ──
```

- Button links to `/relationship-analysis?with={publicProfileId}`

**Typography:**
- Heading: `font-display text-2xl text-center text-foreground`
- Subtext: `text-muted-foreground text-center`
- Button: `bg-primary text-primary-foreground text-lg py-4 px-8 rounded-xl font-semibold min-h-[44px]` (full-width up to max 400px)
- Wordmark: `text-sm text-muted-foreground text-center mt-8`

**New Component:** `<PublicProfileCTA>`

```typescript
interface PublicProfileCTAProps {
  displayName: string;
  publicProfileId: string;
  authState: 'unauthenticated' | 'authenticated-no-assessment' | 'authenticated-assessed';
}
```

**Data Requirements for CTA state:**
- Auth state: checked via `getSession()` in route `beforeLoad` (same pattern as other routes)
- Assessment completion: requires a lightweight check — either a new API endpoint or include `hasCompletedAssessment` in session data
- The CTA component receives the resolved state as a prop — no auth logic inside the component

---

## 5. Mobile Adaptation Summary

| Section | Desktop | Mobile (<640px) |
|---|---|---|
| **Hero** | min-h 70vh, text-[4.5rem] | min-h 85vh, text-[2rem] |
| **Radar** | 400×400px chart, single-row legend | 280×280px chart, 2-row legend wrap |
| **Strata** | 3-column facet grid | 1-column facet list (stacked bars) |
| **Description** | Margin accents visible, text-xl | No margin accents, text-base |
| **CTA** | Max-w 400px button | Full-width button |

**General mobile rules:**
- All decorative shapes scale down but remain present
- Section vertical padding reduces (py-20 → py-12, py-16 → py-10)
- Generous touch targets maintained (min 44×44px)

---

## 6. Component Architecture

### New Components

| Component | Location | Purpose |
|---|---|---|
| `TraitBand` | `components/results/TraitBand.tsx` | Full-width horizontal trait+facets band |
| `FacetScoreBar` | `components/results/FacetScoreBar.tsx` | Extracted shared facet bar (name + score + bar) |
| `PsychedelicBackground` | `components/results/PsychedelicBackground.tsx` | CSS-only decorative concentric shapes |
| `ArchetypeDescriptionSection` | `components/results/ArchetypeDescriptionSection.tsx` | Editorial description block with accents |
| `PublicProfileCTA` | `components/results/PublicProfileCTA.tsx` | 3-state conditional CTA |

### Modified Components

| Component | Change |
|---|---|
| `ArchetypeHeroSection` | Add optional `subtitle` prop, optional scroll indicator, make confidence pill optional |
| `PersonalityRadarChart` | Accept `width`/`height` props, add optional external vertex score labels |

### Extracted from Existing

| Component | Extracted From | Reused In |
|---|---|---|
| `FacetScoreBar` | `TraitCard` inline facet grid | `TraitCard` (results), `TraitBand` (public profile) |

### Unchanged / Reused As-Is

| Component | Used In |
|---|---|
| `GeometricSignature` | Hero (Section 1) + Description divider (Section 4) |
| Ocean shape icons (`OceanCircle`, etc.) | TraitBand headers |
| `getTraitColor()` | All sections |

---

## 7. Page Composition — New Public Profile Route

The public profile route (`/public-profile/$publicProfileId`) will **no longer use `<ProfileView>`**. It gets its own page composition:

```tsx
<div data-slot="public-profile" className="min-h-screen bg-depth-surface">

  {/* Section 1: Hero */}
  <ArchetypeHeroSection
    archetypeName={archetypeName}
    oceanCode5={oceanCode}
    dominantTrait={dominantTrait}
    displayName={displayName}
    subtitle={`${displayName}'s Personality`}
    showScrollIndicator
  />

  {/* Section 2: Radar */}
  <section data-slot="personality-shape" className="relative min-h-[80vh] flex items-center justify-center">
    <PsychedelicBackground intensity="subtle" />
    <div className="relative z-10 text-center">
      <h2>Personality Shape</h2>
      <PersonalityRadarChart
        traits={traits}
        width={400}
        height={400}
        showExternalLabels
      />
      <TraitLegend traits={traits} />
    </div>
  </section>

  {/* Section 3: Strata */}
  <section data-slot="trait-strata" className="max-w-[1120px] mx-auto px-5">
    {traits.map(trait => (
      <TraitBand
        key={trait.name}
        trait={trait}
        facets={facetsForTrait(trait.name)}
      />
    ))}
  </section>

  {/* Section 4: Description */}
  <ArchetypeDescriptionSection
    archetypeName={archetypeName}
    description={description}
    dominantTrait={dominantTrait}
    secondaryTrait={secondaryTrait}
  />

  {/* Section 5: CTA */}
  <PublicProfileCTA
    displayName={displayName}
    publicProfileId={publicProfileId}
    authState={authState}
  />

</div>
```

---

## 8. Results Page Impact

The results page **retains its current `<ProfileView>` composition** — expandable TraitCards, DetailZone, OceanCodeStrand, ConfidenceRing, PersonalPortrait, ShareProfileSection. No layout changes.

**Shared improvements that benefit both pages:**
- `FacetScoreBar` extraction — cleaner code in TraitCard
- `PersonalityRadarChart` accepting size props — useful for responsive tweaks
- `ArchetypeHeroSection` subtitle prop — enables "{Name}'s Personality Archetype" on results page too

The results page's analytical depth and the public profile's editorial drama now serve their distinct audiences without compromising either experience.

---

## 9. Data Requirements

### Existing API (No Changes Needed)

The `GET /api/public-profile/:id` endpoint already returns all required data:

```typescript
interface GetPublicProfileResponse {
  archetypeName: string;
  oceanCode: string;           // 5-letter code
  description: string;         // archetype description text
  displayName: string;
  facets: Record<FacetName, { score: number; confidence: number }>;
  traitSummary: Record<TraitName, string>;  // level letters
}
```

### CTA Auth State Detection

The CTA section needs to know the visitor's auth + assessment state:

1. **Auth check:** `getSession()` in `beforeLoad` (existing pattern)
2. **Assessment check:** Call an existing endpoint (e.g., `GET /api/results` or similar) and check if it returns data. If results exist → `authenticated-assessed`. If no results → `authenticated-no-assessment`. If no session → `unauthenticated`.

The route passes the resolved `authState` string to `<PublicProfileCTA>` — the component itself does no fetching.

### Relationship Analysis Route

The relationship analysis route path is **not yet defined** — it will be specified in a future story. The CTA button should use a placeholder path (e.g., `/relationship-analysis?with={publicProfileId}`) that will be updated when that story is implemented.

---

## 10. Accessibility

| Concern | Approach |
|---|---|
| **Decorative shapes** | All geometric bg shapes, psychedelic pattern, margin accents: `aria-hidden="true"`, `role="presentation"` |
| **Radar chart** | Existing Recharts accessibility + text alternative listing all 5 trait scores |
| **Trait strata** | Semantic heading hierarchy: h2 per trait name, facet data in structured grid |
| **Scroll indicator** | `aria-hidden="true"` (decorative) |
| **CTA buttons** | Clear button labels, min 44×44px touch targets, proper focus styles |
| **Motion** | `prefers-reduced-motion`: psychedelic bg stops rotating, scroll-in animations become instant, scroll indicator static |
| **Color** | Trait identity communicated by shape + name + position, never color alone |
| **Contrast** | All text on gradient/colored backgrounds meets WCAG AA (4.5:1 body, 3:1 large) |

---

## 11. Resolved Decisions

| Question | Decision | Rationale |
|---|---|---|
| Relationship analysis route | **Placeholder** — use `/relationship-analysis?with={id}`, update in future story | Route not yet defined |
| Assessment status check | **Reuse existing endpoint** — call GET /api/results and check for data | No new endpoint needed |
| OG image | **Yes, in this story** — generate dynamic OG image with archetype name + radar shape | First impression for social sharing |
| Psychedelic CSS performance | **Ship it** — CSS-only animations on composited layers are GPU-optimized, low risk | No pre-ship perf testing needed |

### OG Image Specification

Generate a dynamic Open Graph image per public profile for social sharing previews. The image should include:

- **Archetype name** in display typography (Space Grotesk bold)
- **OCEAN code** in monospace, letters colored by trait
- **GeometricSignature** shapes sized by level
- **Background:** dominant trait color with geometric shapes (simplified version of the hero)
- **Dimensions:** 1200×630px (OG standard)
- **Format:** Generated server-side (e.g., via `@vercel/og` or a custom SVG→PNG pipeline)
- **Caching:** Generated once per profile, invalidated when profile data changes

The `head()` function in the route adds `og:image` pointing to a generation endpoint:
```
/api/og/public-profile/{publicProfileId}
```
