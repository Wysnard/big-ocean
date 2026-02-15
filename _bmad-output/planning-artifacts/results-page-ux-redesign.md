---
stepsCompleted: [1, 2, 3]
lastStep: 3
inputDocuments:
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/epics/epic-8-results-page-content-enrichment.md
  - _bmad-output/implementation-artifacts/7-10-assessment-chat-depth-journey-design.md
  - docs/FRONTEND.md
  - apps/front/src/routes/results/$sessionId.tsx
  - apps/front/src/components/results/ArchetypeHeroSection.tsx
  - apps/front/src/components/results/TraitScoresSection.tsx
  - apps/front/src/components/results/ShareProfileSection.tsx
  - apps/front/src/components/home/ChatBubble.tsx
  - apps/front/src/components/home/ShareCardPreview.tsx
  - packages/ui/src/styles/globals.css
---

# Results Page UX Redesign — big-ocean

**Author:** Vincentlay
**Date:** 2026-02-15

---

## Executive Summary

### Project Vision

Redesign the big-ocean results page to create visual and emotional continuity with the homepage depth scroll journey and the assessment chat depth zone experience. The current results page is functional (4 sections: Hero → Traits → Share → Actions) but reads as a static dashboard disconnected from the immersive conversational journey that preceded it. The redesign will explore 6 distinct design propositions — each built on a different visual metaphor and data visualization paradigm — and anticipate Epic 8's personalized AI-generated portrait feature.

### Target Users

Users arriving at the results page after completing a 30-minute conversational assessment with Nerin (70%+ confidence). Two primary states: (1) fresh completion with celebration momentum, and (2) return visits for review/sharing. Both require the results to feel as personal and rich as the conversation that generated them.

### Key Design Challenges

1. **Data density vs. emotional impact** — 5 traits, 30 facets, confidence scores, OCEAN code, archetype name + description, and evidence links must be presented with clear hierarchy and revelation, not as a data dump
2. **Depth journey continuity** — Results must feel like the natural culmination of the home → chat depth journey, not a teleportation to a dashboard. The chat ends at the Abyss; the results page should feel like surfacing with treasure.
3. **Epic 8 forward-compatibility** — Layout must accommodate the personalized portrait (6-10 sentence narrative), static trait descriptions (15), and facet descriptions (90) without current implementation
4. **Visualization diversity** — 6 propositions must represent genuinely different data visualization paradigms, not styling variations

### Design Opportunities

1. **Staggered reveal animation** — Traits/shapes materialize sequentially, extending the geometric signature animation pattern into the full results experience
2. **Trait-as-atmosphere** — Each trait section carries its own color atmosphere (like depth zones), making trait exploration feel like navigating dimensions of self
3. **Portrait as emotional anchor** — Epic 8's narrative portrait designed as the centerpiece, with supporting visualizations orbiting it
4. **Chat → Results narrative arc** — The user dove deep in the chat (Surface → Abyss). Results can reverse this: ascending from the depths with understanding, creating a satisfying emotional arc
5. **OCEAN shapes as data containers** — Each geometric shape (circle, half-circle, rectangle, triangle, diamond) can become the visualization for its trait, making the identity system functional, not just decorative

### SCAMPER Insights (Design Principles)

- **Substitute** horizontal bars with organic forms (radar, rings, petals) to break the clinical dashboard feel
- **Combine** trait + facet into unified expandable visualizations instead of separate sections
- **Adapt** Spotify Wrapped-style sequential reveal and chat depth meter as results navigation
- **Modify** the hero to full-viewport immersion — the archetype reveal should fill the screen
- **Put to Other Use** OCEAN shapes as actual data containers (donut chart, gauge, bar, radar, sparkle)
- **Eliminate** the separate Share and Actions sections — integrate into hero and sticky footer
- **Reverse** the depth direction (Abyss → Surface = discovery → clarity) and the trait order (strongest first)

### 6 Proposition Directions

| Rank | Name | Score | Tier | Core Metaphor | Primary Visualization | Epic 8 Portrait Slot |
|------|------|-------|------|--------------|----------------------|---------------------|
| 1 | **The Ascent** | 4.65 | Build-ready | Surfacing from a deep dive | Full-viewport trait sections, Abyss→Surface depth reversal | "Dive report" narrative at journey start |
| 2 | **Waveform** | 4.20 | Build-ready | Music album | Audio waveform bars, full-bleed trait sections with color energy | "Liner notes" section between tracks |
| 3 | **Living Shapes** | 4.10 | Strong | OCEAN shapes as data | Each trait shape IS its chart (O=donut, C=gauge, E=bar, A=radar, N=sparkle) | Narrative woven between shape reveals |
| 4 | **The Gallery** | 3.35 | Aspirational | Art exhibition rooms | Horizontal-scroll trait "rooms", facets as wall pieces | "Curator's introduction" at gallery entrance |
| 5 | **Constellation** | 3.10 | Aspirational | Star chart / night sky | Radial facet star map with trait constellation groupings | "Astronomer's notes" panel alongside the sky |
| 6 | **Topography** | 2.45 | Aspirational | Terrain / elevation map | Layered contour visualization, elevation = score, biome = trait color | "Field guide" overlay on the terrain |

**Evaluation criteria:** Emotional Impact (25%), Data Clarity (20%), Depth Journey Continuity (15%), Epic 8 Portrait Fit (15%), Mobile Experience (10%), Implementation Feasibility (10%), Shareability (5%).

**Recommended hybrid:** The Ascent's full-viewport immersive sections + Living Shapes' "shape as chart" data visualization = depth journey continuity with brand-reinforcing data clarity.

### User Validation Insights (Persona Focus Group)

**Tested with:** 4 personas spanning mobile/desktop, fresh/returning, analytical/emotional, screenshot-hunter/depth-seeker.

**Consensus findings:**

1. **The Ascent is the primary direction** — The "surfacing with understanding" narrative arc resonated universally. Full-viewport trait sections feel like chapters of a personal story, not a data table.

2. **Living Shapes hybrid** — OCEAN shapes as data containers (donut, gauge, bar, radar, sparkle) should be integrated INTO The Ascent's immersive sections. Provides data clarity + brand identity within the atmospheric experience.

3. **Constellation as hero accent** — A small radial star map works as a visual summary element in the hero section (screenshot-worthy) but fails as a full-page visualization due to poor data readability.

4. **Quick-jump navigation required** — Return visitors need a results-page depth meter (mirroring the chat sidebar) to jump directly to specific traits without scrolling through full-viewport sections.

5. **Confidence as first-class visual** — The current tiny pill badge undersells the most important trust signal. Confidence should be a progress ring, fill bar, or part of the primary visualization — not metadata.

6. **Share as integrated action, not section** — The dedicated Share section is consistently missed or perceived as boring. Replace with a floating share button or hero-integrated action.

7. **Epic 8 portrait as Nerin's voice** — The personalized narrative should feel like Nerin speaking directly about what was discovered during the dive. "Dive report" framing (The Ascent) was the strongest fit. Position as the emotional centerpiece, not a sidebar.

### Design Principles (First Principles)

Derived by stripping all "results page" conventions and rebuilding from what is irreducibly true about a user who just had a 30-minute intimate conversation with Nerin.

**Fundamental truths:** The user is in a relational state (not analytical), invested significant vulnerability (results must feel proportionally valuable), wants to feel understood (not measured), has an emotional relationship with Nerin (trusted interpreter), reacts strongest to surprises (not confirmations), shares from emotion (not from a button), earned their confidence score (it's an achievement, not metadata), and has a living profile (not a finished report).

**Principles:**

1. **Nerin narrates, the system displays.** The emotional layer (portrait, descriptions, insights) is Nerin's voice. The data layer (scores, charts, shapes) is the system. Both present simultaneously — never data alone.

2. **Celebrate the investment before revealing the label.** Hero hierarchy: Confidence achievement → Archetype reveal → Traits → Facets. Not Archetype → Traits → Confidence-in-a-pill.

3. **Lead with surprise, support with structure.** After the hero, surface the most unexpected finding first — the strongest deviation, the contradiction between traits. Then offer the full OCEAN breakdown as supporting detail.

4. **Co-locate the share impulse with the share action.** Every shareable moment gets an inline micro-share. No dedicated Share section. The impulse and the action are never separated by scrolling.

5. **Visual completeness encodes confidence.** Shapes, fills, opacity, and rendering detail reflect how much of the personality has been mapped. At 72%: partially rendered, some facets as dotted outlines. At 85%+: vivid and complete. The page grows richer as the profile deepens.

6. **The page is a living document, not a report.** Language says "your profile so far" not "your results." Visual cues and CTAs invite continuation and return, not conclusion.

### Radical Design Opportunities (What If Scenarios)

Three high-impact ideas surfaced by exploring radical alternatives:

**1. Hero as Standalone Personality Card (from "What if single screen?")**
The first viewport must work as a complete, shareable summary — archetype name, geometric signature, confidence ring, 5 compact trait indicators, and a share action. If someone screenshots ONLY the hero, they have a meaningful personality card. Everything below the fold is enrichment, not essential.

**2. First-Visit Guided Reveal vs. Return-Visit Reference (from "What if Nerin narrated?")**
Two modes for one page:
- **First visit:** Optional "guided reveal" where trait sections fade in sequentially, Nerin's voice introduces each finding, auto-paced scroll. The emotional payoff of the 30-minute investment.
- **Return visits:** Static reference view — all sections visible, quick-jump navigation, data-forward. A toggle ("Replay the reveal") lets users re-experience it when showing someone.

**3. Confidence-Driven Visual Evolution (from "What if different at every confidence?")**
The most differentiated feature. The page has 3 visual states tied to confidence tiers:
- **70% (minimum viable):** Shapes as sketchy outlines, muted colors, portrait as a teaser, low-confidence facets show "?" marks. Beautiful but intentionally unfinished.
- **80% (solid):** Shapes filled but slightly transparent, most facets populated, full portrait, more saturated colors. Substantial but hinting at more.
- **90%+ (deep):** Shapes vivid and glowing, all facets high-confidence, rich detailed portrait, micro-animations. The page feels alive — personality rendered in full color.

This creates intrinsic motivation to continue chatting (visual incompleteness), makes return visits rewarding (the page has literally changed), and drives premium conversion visually (you SEE what deepening unlocks). No other personality platform does this.

## Core User Experience

### Defining Experience

The results page is the **emotional payoff** of a 30-minute intimate conversation. The core action is *comprehension through scrolling* — the page communicates who you are as you move through it. It is not a dashboard to analyze; it is a personal revelation to experience.

**Core Loop:** Land → Feel the reveal → Absorb traits → Encounter surprise → Share a moment → Explore deeper → Return later and see evolution.

**What makes this different from every other personality results page:** The page is alive. It visually evolves with confidence. It speaks in Nerin's voice. It surfaces surprises before structure. And it remembers that the user just had a conversation, not a test.

### Architecture: Framework + Propositions

The results page is split into two layers:

**Results Page Framework (universal — shared by all 6 propositions):**
- Hero as standalone personality card (first viewport = complete shareable summary)
- Guided reveal on first visit (scroll-triggered, not auto-scrolled — sections animate in as they enter viewport, user controls pace)
- Depth meter quick-jump navigation (desktop sidebar, mirroring chat)
- Micro-share co-located with every shareable moment
- Epic 8 portrait slot (Nerin's voice narrating the findings)
- Confidence-driven visual evolution (CSS-only: opacity, saturation, filter, border-style — not component-level variants)
- "Replay the reveal" toggle for return visitors

**Visualization Propositions (what makes each of the 6 distinct):**
- Data visualization paradigm (shapes, waveforms, constellations, etc.)
- Spatial metaphor (vertical ascent, horizontal gallery, radial map, etc.)
- Trait section layout and interaction model
- Color atmosphere transitions between sections
- Animation choreography for the guided reveal
- Mobile adaptation strategy (concrete per proposition, not hand-waved)

This separation means the hero, navigation, share, and portrait are designed once. The 6 propositions focus on what truly differentiates them: **how you visualize 5 traits and 30 facets**.

### Platform Strategy

**Primary platform:** Web (TanStack Start SSR), responsive across desktop, tablet, and mobile.

**Device distribution for this page:**
- **Mobile (50%+):** Users who took the assessment on their phone want to see results immediately, screenshot, and share via messaging apps. The hero must be a self-contained personality card at 375px. Each proposition must define a concrete mobile layout — not "scales to cards" but an explicit adaptation strategy.
- **Desktop (35%):** Full immersive experience — full-viewport trait sections, depth meter navigation sidebar, richer animations.
- **Tablet (15%):** Middle ground — full-viewport sections work well, depth meter visible.

**Key platform decisions:**
- Share actions: native share API on mobile, copy-link on desktop
- Guided reveal: scroll-triggered across all devices, respects `prefers-reduced-motion`
- Confidence-driven visual evolution: CSS-only (opacity, saturation, `filter`, `border-style`) — no component-level branching per confidence tier

### Effortless Interactions

**1. Comprehension at a glance (zero effort)**
The first viewport communicates: archetype name, geometric signature, confidence level, and 5 trait indicators. No scrolling needed to understand "who am I."

**2. Sharing from emotion (1 tap)**
Every trait section has an inline micro-share action. When the user feels "this is SO me," the share button is right there — not 3 scrolls away in a dedicated section. Uses native share API on mobile.

**3. Quick-jump navigation (return visitors)**
A results depth meter (mirroring the chat sidebar) lets return visitors jump directly to any trait. No re-scrolling through the full reveal on repeat visits.

**4. Evidence connection (2 taps)**
From any facet score → tap "Evidence" → slide-out panel shows the conversation excerpts that informed this score. Bidirectional: chat references link back to results. Already implemented in current page, preserved in all 6 propositions.

**5. Guided reveal (first visit, scroll-triggered)**
On first visit, trait sections animate in as they enter the viewport — the user controls the pace by scrolling. The page builds itself as you move through it, like unwrapping a gift at your own speed. On return visits, everything is visible immediately. A "Replay the reveal" toggle restores the experience.

### Critical Success Moments

**Moment 1: The First 3 Seconds — "This was worth it"**
The user just invested 30 minutes of vulnerability. The hero must feel proportionally valuable — full-viewport, immersive, personal. If it looks like a generic dashboard, trust breaks. If it feels like a revelation, trust cements.
- *Success signal:* User pauses and reads their archetype name with recognition
- *Failure signal:* User immediately scrolls past the hero looking for "the real results"

**Moment 2: The Distinction — "This is uniquely me"**
After the hero, the first trait section surfaces the user's **most distinctive trait** — the one with the highest deviation from population mean. If someone is 95th percentile Openness and 20th percentile Conscientiousness, lead with whichever is more extreme. Statistically-derived distinctiveness, not guessed surprise.
- *Success signal:* User leans in, re-reads, shares immediately
- *Failure signal:* User sees obvious confirmations and thinks "any quiz could tell me this"

**Moment 3: The Share Impulse — "I need to show someone this"**
A specific trait description or score resonates so deeply that the user wants to share it RIGHT NOW. The share action must be immediately visible — co-located with the content that triggered the impulse.
- *Success signal:* User taps share within 5 seconds of the impulse
- *Failure signal:* User thinks "I'll share later" (they won't)

**Moment 4: The Evolution — "My page changed"**
A return visitor sees their profile has visually evolved — CSS-driven changes in opacity, saturation, and rendering detail. The page rewards continued investment without component-level complexity.
- *Success signal:* User notices the difference and feels motivated to continue chatting
- *Failure signal:* Page looks identical to last visit, no reason to return

### Experience Principles (Results Page Specific)

1. **Revelation over presentation.** The page reveals who you are progressively — it doesn't dump data. Each scroll reveals a new dimension.

2. **Personal over clinical.** Nerin's voice (portrait, descriptions) wraps every data point. No score exists without narrative context.

3. **Complete at every viewport.** The hero is a complete personality card. Each trait section is a complete chapter. The user can stop scrolling at any point and have received value.

4. **Alive, not archived.** CSS-driven visual evolution with confidence, "your profile so far" language, and continuation CTAs communicate that this is a living document.

5. **Immersive on first visit, efficient on return.** Scroll-triggered reveal creates the emotional payoff on first visit. Quick-jump depth meter serves return visitors. Both modes available via toggle.

6. **Framework once, propositions diverge.** Universal elements (hero, navigation, share, portrait, confidence evolution) are designed once. The 6 propositions differentiate through visualization paradigm, spatial metaphor, interaction model, and concrete mobile strategy.
