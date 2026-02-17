# Epic 8: Results Page Content Enrichment

**Phase:** 1 (MVP) for static content + personalized portrait, Phase 2 for paid tier portrait regeneration

**Goal:** Transform the results page from a clinical data readout into a meaningful, layered personality narrative that makes users feel understood - with static archetype/trait/facet descriptions and a personalized AI portrait at the free tier message threshold (Phase 1), and paid tier portrait regeneration with richer evidence (Phase 2).

**Dependencies:**
- Epic 3 (OCEAN Archetype System) - archetype lookup working
- Epic 5 (Results & Profiles) - results display page exists
- Epic 2 (Assessment Backend) - orchestrator pipeline for portrait generation trigger

**Enables:** User retention, shareability, freemium monetization ($10 paid tier)

**User Value:** Users understand their personality results through rich, personally relevant descriptions rather than raw scores. Paid users get AI-generated portraits regenerated with richer evidence from extended conversations.

---

## Content Architecture

### Results Page Layout (Mockup 7: Detail Zone)

Reference mockup: `_bmad-output/planning-artifacts/result-page-ux-design/profile-mockup-7-detail-zone.html`

```
┌─────────────────────────────────────────────────────────────┐
│  1. HERO SECTION (existing, modified — ARCHETYPE-FIRST)       │
│     - Keep archetype name as PRIMARY heading (h1, display)   │
│     - OCEAN code as STRONG SECONDARY below name (font-mono,  │
│       text-2xl, wide tracking, monochrome text-foreground/50)│
│     - No per-letter trait colors — minimal, typographic      │
│     - Remove archetype description from hero                 │
│     - Geometric signature, confidence badge remain           │
├─────────────────────────────────────────────────────────────┤
│  2. GRID CONTAINER (new layout — max-width 1120px)           │
│                                                              │
│  ┌─ Full-width ──────────────────────────────────────────┐   │
│  │  2a. ABOUT YOUR ARCHETYPE (full-width card)           │   │
│  │      - Archetype description (4-5 sentences, Story 8.1)│  │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Full-width ──────────────────────────────────────────┐   │
│  │  2b. PERSONALIZED PORTRAIT (full-width card, conditional)│ │
│  │      - Rainbow accent bar (5 trait colors)             │  │
│  │      - Icon + "Your Personality Portrait" header       │  │
│  │      - Rendered markdown, split on ## for section styling│ │
│  │      - 6 sections in Nerin's dive-master voice:        │  │
│  │        The Dive, What Sets You Apart, Your Depths,     │  │
│  │        Undercurrents, Murky Waters, The Ceiling         │  │
│  │      - Evidence-first pattern throughout               │  │
│  │      - Only shown when personalDescription exists       │  │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Side by side ────────────────────────────────────────┐   │
│  │  2c. RADAR CHART        │  2d. CONFIDENCE RING        │  │
│  │  "Personality Shape"    │  "Overall Confidence"        │  │
│  │  shadcn/Recharts        │  Ring with percentage        │  │
│  │  RadarChart (pentagon)  │  Message count label         │  │
│  └─────────────────────────┴─────────────────────────────┘   │
│                                                              │
│  ┌─ Grid: 3 cards per row (responsive) ──────────────────┐   │
│  │  2e. TRAIT CARDS (5 cards in auto-fill grid)          │   │
│  │  Per card:                                             │  │
│  │  - Color accent bar (4px top)                          │  │
│  │  - OCEAN shape + trait name + level badge (H/M/L)      │  │
│  │  - Large score + /120 + percentage                     │  │
│  │  - Score bar                                           │  │
│  │  - 2x3 compact facet grid (name + score + mini bar)    │  │
│  │  - "Tap to see evidence" hint                          │  │
│  │  - Click → opens DETAIL ZONE below the row             │  │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Full-width, slides open ─────────────────────────────┐   │
│  │  2f. DETAIL ZONE (inline, replaces modal)             │   │
│  │  - Header: shape + trait name + score + close button   │  │
│  │  - 3-column facet detail grid (responsive 3→2→1)       │  │
│  │  - Per facet: name, score bar, evidence quotes          │  │
│  │  - Evidence: italic quote, message ref, signal badge    │  │
│  │  - Animated open/close (max-height transition)          │  │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Side by side ────────────────────────────────────────┐   │
│  │  2g. QUICK ACTIONS      │                              │  │
│  │  - Resume Conversation  │                              │  │
│  │  - View Public Profile  │                              │  │
│  │  - Download Report      │                              │  │
│  └─────────────────────────┘                              │  │
│                                                              │
│  ┌─ Full-width ──────────────────────────────────────────┐   │
│  │  2h. SHARE CARD (full-width, gradient bg)             │   │
│  │  - "Share your OCEAN code" + description               │  │
│  │  - Shareable link + Copy button                        │  │
│  │  - Visibility toggle (Public/Private)                  │  │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Components: shadcn Card, Button, Switch, Chart (Recharts RadarChart)
```

### Content Tiers

| Tier | Content | Source | When Available |
|------|---------|--------|----------------|
| **Static** | Archetype description (4-5 sentences) | `CURATED_ARCHETYPES` constant | Always |
| **Static** | Trait level descriptions (4-5 sentences per level) | `TRAIT_DESCRIPTIONS` constant | Always |
| **Static** | Facet level descriptions (2-3 sentences per level) | `FACET_DESCRIPTIONS` constant | Always |
| **Dynamic** | Personalized portrait | AI-generated, stored in DB | Free tier message threshold reached |
| **Dynamic** | Enhanced portrait (paid) | AI-regenerated with more evidence | Paid tier, Phase 2 |

### Freemium Model

**Free tier:**
- Chat until free tier message threshold (default: 15 user messages, conversation locks)
- Receive: archetype description, trait/facet level descriptions, ONE personalized portrait
- Cannot continue chatting with Nerin

**Paid tier ($10, Phase 2 — requires tier infrastructure):**
- Unlock continued conversation beyond free tier threshold
- More messages = more evidence = sharper scores
- Personalized portrait regenerated with richer data (replaces free tier version)
- Richer portrait because more evidence data available

---

## Story 8.1: Expand Archetype Descriptions to 4-5 Sentences

As a **User viewing my results**,
I want **to read a rich, engaging description of my archetype**,
So that **I immediately feel understood and want to read further**.

**Acceptance Criteria:**

**Given** I view my results page
**When** the archetype card renders
**Then** the archetype description is 4-5 sentences (expanded from current 2-3)
**And** the description makes me feel "that's SO me" (emotionally resonant)
**And** the description covers key behavioral tendencies of the archetype

**Given** a non-curated archetype (fallback-generated)
**When** the results render
**Then** the fallback generator also produces 4-5 sentence descriptions
**And** quality is comparable to curated entries

**Technical Details:**

- Update `packages/domain/src/constants/archetypes.ts` - expand all 25 curated `description` fields from 2-3 sentences to 4-5 sentences
- Update fallback generator in `packages/domain/src/utils/archetype-lookup.ts` to produce 4-5 sentence descriptions
- No schema changes needed (same `description` field, just longer content)
- No API changes needed

**Acceptance Checklist:**
- [ ] All 25 curated archetypes have 4-5 sentence descriptions
- [ ] Fallback generator produces 4-5 sentence descriptions
- [ ] Descriptions cover behavioral tendencies, social style, and core motivations
- [ ] No archetype description exceeds 6 sentences
- [ ] Existing tests updated and passing

---

## Story 8.2: Add Level-Specific Trait Descriptions

As a **User viewing my trait scores**,
I want **to read what my specific trait level means in everyday terms**,
So that **I understand what being an "Introvert" or "Disciplined" means for me without needing a psychology textbook**.

**Acceptance Criteria:**

**Given** I view the trait summary section
**When** each trait renders
**Then** I see:
  - Trait name with a one-line tagline (e.g., "Extraversion - how you engage with the world")
  - Score bar (existing)
  - Level-specific description (4-5 sentences) matching my level (Low/Mid/High)
**And** the description uses second-person ("you tend to...") for personal feel
**And** no generic "what is this trait" educational text is shown

**Given** I am scored as "Introvert" (Low Extraversion)
**When** the Extraversion section renders
**Then** I read something like: "As an introvert, you direct your energy inward, finding renewal in solitude and deep thought rather than social stimulation. You prefer meaningful one-on-one conversations over large group settings, and your rich inner world is where your best ideas take shape..."

**Given** all 3 levels exist for all 5 traits
**When** any user views results
**Then** 15 total descriptions exist (5 traits x 3 levels)
**And** all descriptions are 4-5 sentences

**Technical Details:**

- Create `packages/domain/src/constants/trait-descriptions.ts`
- Data structure:

```typescript
export const TRAIT_DESCRIPTIONS: Record<TraitName, {
  tagline: string;
  levels: Record<"L" | "M" | "H", string>;
}> = {
  openness: {
    tagline: "How you approach new ideas and experiences",
    levels: {
      L: "As a practical thinker, you value...",
      M: "With a grounded approach, you balance...",
      H: "With an open mind, you actively seek..."
    }
  },
  // ... other traits
};
```

- Export from `packages/domain/src/index.ts`
- Update results page (`apps/front/src/routes/results/$sessionId.tsx`) to render tagline + level description below score bar
- Map trait level letter (from OCEAN code) to "L"/"M"/"H" key for lookup

**Acceptance Checklist:**
- [ ] `trait-descriptions.ts` created with all 5 traits
- [ ] Each trait has a `tagline` (one-liner, <10 words)
- [ ] Each trait has 3 level descriptions (L, M, H) of 4-5 sentences each
- [ ] Descriptions use second-person voice ("you tend to...")
- [ ] No generic "what is this trait" educational content
- [ ] Results page renders tagline below trait name
- [ ] Results page renders level-specific description below score bar
- [ ] All 15 descriptions written and reviewed
- [ ] Exported from domain package

---

## Story 8.3: Add Level-Specific Facet Descriptions

As a **User exploring my facet breakdown**,
I want **to understand what each facet score means for me specifically**,
So that **the granular 30-facet breakdown feels informative rather than overwhelming**.

**Acceptance Criteria:**

**Given** I expand a trait to see facet breakdown
**When** each facet renders
**Then** I see:
  - Facet name + score (existing)
  - Level-specific description (2-3 sentences) matching my level (Low/Mid/High)
**And** the description explains what this facet level means in everyday behavior

**Given** I score High on "Orderliness" facet
**When** the facet detail renders
**Then** I read something like: "You thrive with clear systems and organized spaces. When things are out of place, you notice - and you're usually the one who fixes it."

**Technical Details:**

- Create `packages/domain/src/constants/facet-descriptions.ts`
- Data structure:

```typescript
export const FACET_DESCRIPTIONS: Record<FacetName, {
  levels: Record<"L" | "M" | "H", string>;
}> = {
  imagination: {
    levels: {
      L: "You prefer concrete, practical thinking...",
      M: "You balance practical thinking with...",
      H: "Your mind naturally wanders into..."
    }
  },
  // ... 29 more facets
};
```

- Map facet score (0-20) to level: 0-6=L, 7-13=M, 14-20=H
- Export from `packages/domain/src/index.ts`
- Update `FacetBreakdown` component to render level description below each facet score

**Acceptance Checklist:**
- [ ] `facet-descriptions.ts` created with all 30 facets
- [ ] Each facet has 3 level descriptions (L, M, H) of 2-3 sentences each
- [ ] Descriptions use second-person voice
- [ ] Facet score to level mapping function created (0-6=L, 7-13=M, 14-20=H)
- [ ] FacetBreakdown component renders level description
- [ ] All 90 descriptions written and reviewed
- [ ] Exported from domain package

---

## Story 8.4: Pre-Generate Personalized Portrait at Free Tier Message Threshold

As a **User who has reached the free tier message threshold**,
I want **to see a personalized personality portrait that references my actual conversation**,
So that **I feel genuinely understood in a way no static description can achieve**.

**Acceptance Criteria:**

**Given** my assessment reaches the free tier message threshold (default: 15 user messages)
**When** the orchestrator pipeline completes the final analysis batch
**Then** a personalized portrait is generated via Claude API call
**And** the portrait is stored in `assessment_sessions.personal_description` (TEXT column)
**And** the portrait is written in Nerin's dive-master voice (experienced, calm, empathic, mentoring)
**And** the portrait is a single flowing markdown document with 6 sections using `##` headers
**And** the portrait uses evidence-first patterns (conversation reference → revelation → insight)
**And** the generation happens in the background (no user wait)

**Given** a personalized portrait exists for my session
**When** I view the results page
**Then** I see a "Your Personality Portrait" full-width card below the About Archetype section
**And** the card has a rainbow accent bar (5 trait colors gradient) at the top
**And** the card header shows an icon + "Your Personality Portrait" + subtitle "Patterns discovered from your conversation with Nerin"
**And** the content renders markdown, optionally split on `##` headers for per-section visual treatment
**And** the portrait contains up to 6 sections (trust LLM output, no guaranteed count):
  1. "The Dive" — dynamic greeting + global personality summary (300-500 chars)
  2. "What Sets You Apart" — top 3 defining traits, evidence-anchored
  3. "Your Depths" — top 3 strengths with mentoring voice
  4. "Undercurrents" — top 3 weaknesses (compassionate but unflinching)
  5. "Murky Waters" — 2-5 hints based on low-confidence data (never padded)
  6. "The Ceiling" — limiting factor, ends with question or possibility
**And** the content references my actual conversation moments and trait scores

**Given** my message count is below the free tier threshold
**When** I view the results page
**Then** the personalized portrait section is not shown
**And** no placeholder or teaser is shown (clean absence)

**Technical Details:**

- Add `personal_description TEXT NULL` column to `assessment_sessions` table (migration)
- Add portrait generation step to orchestrator pipeline:
  ```
  After analysis batch (when messageCount >= freeTierMessageThreshold):
    IF personal_description IS NULL:
      → Generate portrait via Claude API (one call)
      → Store in assessment_sessions.personal_description
  ```
- Trigger condition matches the result reveal condition: `messageCount >= config.freeTierMessageThreshold`
- Uses the same `freeTierMessageThreshold` config from AppConfig (default: 15, env: FREE_TIER_MESSAGE_THRESHOLD)
- **Portrait spec:** `_bmad-output/implementation-artifacts/personalized-portrait-spec.md` is the source of truth for the prompt
- Portrait generation prompt includes:
  - **System prompt:** Nerin's dive-master voice spec (identity, pronoun flow, temporal modes, evidence-first pattern, metaphor density gradient, section structure, formatting rules, guardrails)
  - **Validated example:** Few-shot reference from the spec for consistent quality
  - **User prompt:** 30 facet scores with confidence levels, top evidence records with confidence, archetype name/description, OCEAN code
- Output format: **single markdown string** with `##` headers and emojis — no JSON structure
- `maxTokens`: 2048 (6 sections need more room than the previous 1024)
- DB column `personal_description` stores the markdown string (TEXT column, unchanged)
- Results endpoint returns `personalDescription` as string when non-null
- Frontend `PersonalPortrait` component renders markdown, splits on `##` for per-section styling
- No guaranteed 6 sections — frontend trusts LLM output
- Portrait voice: Nerin dive-master — NOT generic warm prose, NOT clinical, NOT horoscope
- Evidence-first pattern: conversation reference → what it revealed → insight (evidence BEFORE analysis)
- Metaphor density gradient: heavy in opening (~80%), fading through middle (~20-30%), plain in closing (~10%)
- Strengths (Part 3) must fully land before weaknesses (Part 4) — emotional arc matters
- Part 6 always ends with a question or possibility, never bleak
- Privacy: portrait is private-only, not shown on public profiles
- shadcn Card component for container
- One API call per session, not per page view

**Acceptance Checklist:**
- [ ] DB migration adds `personal_description` column to `assessment_sessions`
- [ ] Orchestrator triggers portrait generation when messageCount >= freeTierMessageThreshold
- [ ] Portrait generated only once (checks for NULL before generating)
- [ ] Portrait stored in DB (not regenerated on each visit)
- [ ] Portrait prompt includes Nerin's dive-master voice spec and validated example from `personalized-portrait-spec.md`
- [ ] Portrait output is single markdown string with `##` headers (not JSON)
- [ ] Portrait uses evidence-first pattern (conversation reference → revelation → insight)
- [ ] Results API returns `personalDescription` when non-null
- [ ] Frontend `PersonalPortrait` component renders markdown with per-section styling (split on `##`)
- [ ] Component hidden when `personalDescription` is null
- [ ] Rainbow accent bar preserved on portrait card
- [ ] No guaranteed section count — frontend trusts LLM output
- [ ] Responsive layout for portrait sections
- [ ] Cost: one additional Claude API call per completed assessment (maxTokens: 2048)
- [ ] Mock updated to return markdown format with `##` headers
- [ ] Tests: use-case test verifying trigger condition + updated PersonalPortrait component tests for markdown rendering

---

## Story 8.5: Regenerate Personalized Portrait for Paid Tier (Phase 2 — Deferred)

> **DEFERRED:** This story requires tier infrastructure (free vs premium user distinction) which does not yet exist. Postponed until tier system is implemented. The core concept remains: paid users unlock continued conversation beyond the free tier threshold, accumulate more evidence, and receive a richer regenerated portrait.

As a **Paid user who has continued chatting beyond the free tier threshold**,
I want **my personalized portrait to be regenerated with richer data from my extended conversation**,
So that **my portrait reflects the deeper understanding from more evidence**.

**Prerequisites (not yet implemented):**
- Tier infrastructure: ability to distinguish free vs premium users
- Payment system: mechanism to unlock paid tier
- Extended conversation: ability for paid users to send messages beyond free tier threshold

**Acceptance Criteria:**

**Given** I am a paid user and I have continued chatting beyond the free tier message threshold
**When** the orchestrator pipeline completes a subsequent analysis batch
**Then** the personalized portrait is regenerated via Claude API call
**And** the new portrait REPLACES the existing `personal_description` (single column, overwrite)
**And** the new portrait is noticeably richer (references more specific patterns)
**And** a subtle indicator shows: "Portrait updated — based on extended conversation"

**Given** I am a free user
**When** my conversation is locked at the free tier threshold
**Then** no regeneration occurs
**And** I keep my original portrait permanently

**Technical Details:**

- Extend orchestrator trigger:
  ```
  IF paid_user AND messageCount > freeTierMessageThreshold AND portrait_not_recently_updated:
    → Regenerate portrait, overwrite personal_description
  ```
- Same `personal_description` column — no v2 column needed
- Optionally add `personal_description_updated_at TIMESTAMP` for tracking
- Results API returns same field; frontend doesn't need to know which version
- Paid tier check: query user subscription status before regenerating

**Acceptance Checklist:**
- [ ] Tier infrastructure exists (prerequisite)
- [ ] Orchestrator checks for paid user status beyond free tier threshold
- [ ] Portrait regenerated and overwrites existing `personal_description`
- [ ] Free users' portraits are never overwritten
- [ ] Optional: `personal_description_updated_at` tracks when portrait was last generated
- [ ] Results page shows indicator when portrait was updated from extended conversation
- [ ] Total max API calls for portraits: 2 per user (once at threshold, once after extended chat)
- [ ] Tests: verify paid vs free tier behavior

---

## Story 8.6: Results Page Layout Redesign — Mockup 7 Detail Zone

As a **User viewing my results**,
I want **to see my personality data in an engaging grid layout with clickable trait cards that reveal evidence inline**,
So that **I can explore my results at my own pace without modal interruptions, with a clear visual hierarchy from overview to detail**.

**Reference:** `_bmad-output/planning-artifacts/result-page-ux-design/profile-mockup-7-detail-zone.html`

**Acceptance Criteria:**

**Hero Section (modified — Archetype-First with Strong Code Secondary):**
**Given** I view the results page
**When** the hero renders
**Then** the ArchetypeHeroSection displays the archetype name as the PRIMARY heading (display scale, emotional anchor)
**And** the OCEAN code is displayed as a STRONG SECONDARY below the name (font-mono, ~text-2xl, wide letter-spacing, monochrome text-foreground/50 — no per-letter trait colors, no hover interaction in hero)
**And** the OCEAN code and confidence badge are visually separated (code on its own line, confidence as small pill below)
**And** the archetype description is NOT shown in the hero (moved to About card below)
**And** geometric signature remains

**About Your Archetype (new):**
**Given** I view the results page
**When** the grid container renders
**Then** I see a full-width "About Your Archetype" card as the first element
**And** it contains the 4-5 sentence archetype description (from Story 8.1)

**Radar Chart (new):**
**Given** I view the results page
**When** the data overview section renders
**Then** I see a "Personality Shape" card with a pentagon radar chart
**And** each axis represents one OCEAN trait with its name and percentage
**And** the filled area uses a trait-color gradient with 25% opacity
**And** dots at each vertex use the individual trait color
**And** the chart uses shadcn Chart component (Recharts RadarChart)

**Confidence Ring (new):**
**Given** I view the results page
**When** the data overview section renders
**Then** I see an "Overall Confidence" card alongside the radar chart
**And** it shows a circular progress ring with the confidence percentage
**And** a label shows "Based on N conversation messages"

**Trait Cards (replaces TraitScoresSection):**
**Given** I view the results page
**When** the trait section renders
**Then** I see 5 trait cards in a responsive grid (3 per row desktop, 1 mobile)
**And** each card shows:
  - 4px color accent bar at top (trait color)
  - OCEAN shape icon + trait name + level badge (H/M/L)
  - Large score number + /120 + percentage
  - Score progress bar
  - 2x3 compact facet grid (name + score + mini bar per facet)
  - "Tap to see evidence" hint at bottom
**And** cards have hover effect (shadow + slight lift)
**And** clicking a card opens the Detail Zone below the row

**Detail Zone (replaces EvidencePanel modal):**
**Given** I click a trait card
**When** the detail zone opens
**Then** a full-width panel slides open below the current row
**And** the selected card shows a "selected" state (border color, arrow indicator)
**And** the zone header shows: trait shape + "Trait — Evidence" + score + level + evidence count + close button
**And** the zone contains a 3-column facet detail grid (responsive 3→2→1)
**And** each facet detail card shows:
  - Left border in trait color (3px)
  - Facet name + score
  - Score progress bar
  - Evidence quotes (italic, with message ref and signal badge: Strong/Moderate/Weak)
**And** clicking the same card again (or close button) collapses the zone
**And** clicking a different card closes the current zone and opens the new one
**And** the zone animates open/close (max-height transition, ~400ms)
**And** the page scrolls smoothly to the opened zone

**Quick Actions (new):**
**Given** I view the results page
**When** the actions section renders
**Then** I see a "Quick Actions" card with 3 action items:
  - Resume Conversation (deepens personality insights)
  - View Public Profile (see how others see you)
  - Download Report (PDF of results)
**And** each item has an icon, title, description, and arrow indicator

**Share Card (redesigned):**
**Given** I view the results page
**When** the share section renders
**Then** I see a full-width "Share your OCEAN code" card with gradient background
**And** it shows: title, description, shareable link with Copy button
**And** a visibility toggle (Public/Private) using shadcn Switch component

**Technical Details:**

- Install shadcn components: `chart` (brings Recharts), `switch`
- Restructure `ProfileView.tsx` from depth-zone layout to CSS Grid container
  (max-width 1120px, `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`, gap 20px)
- Modify `ArchetypeHeroSection.tsx` — promote OCEAN code to strong secondary (own line below archetype name, font-mono text-2xl tracking-[0.3em] text-foreground/50, monochrome), remove description rendering
- Create new components:
  - `AboutArchetypeCard` — full-width card, renders archetype description
  - `PersonalityRadarChart` — shadcn ChartContainer + Recharts RadarChart with custom PolarAngleAxis tick
  - `ConfidenceRingCard` — circular SVG ring or Recharts RadialBarChart
  - `TraitCard` — clickable card with compact facet grid, manages selected state
  - `DetailZone` — full-width collapsible panel with facet evidence grid
  - `QuickActionsCard` — action list card
- Redesign `ShareProfileSection` to match mockup full-width card pattern ("Share your OCEAN code")
- Remove or deprecate: `TraitScoresSection`, `TraitBar`, `FacetBreakdown` (replaced by TraitCard + DetailZone)
- `EvidencePanel` (Dialog modal) replaced by inline DetailZone — can be removed
- Detail zone row mapping: O/C/E share zone 1, A/N share zone 2 (grid position logic)
- All data flows unchanged — same hooks (useGetResults, useFacetEvidence), same API

**Acceptance Checklist:**
- [ ] Hero section renders without archetype description
- [ ] About Your Archetype full-width card renders description
- [ ] Radar chart renders 5-axis pentagon with trait colors and scores
- [ ] Confidence ring renders with percentage and message count
- [ ] 5 trait cards render in responsive grid
- [ ] Trait card click opens detail zone below the row
- [ ] Detail zone shows facet evidence in 3-column grid
- [ ] Detail zone animates open/close smoothly
- [ ] Only one detail zone open at a time
- [ ] Quick Actions card renders 3 action items
- [ ] Share card renders with link, copy, and visibility toggle
- [ ] shadcn Chart component used for radar chart
- [ ] shadcn Switch component used for visibility toggle
- [ ] Responsive: all sections adapt to mobile (single column)
- [ ] Removed components cleaned up (no dead code)
- [ ] All existing tests updated for new component structure

---

## Implementation Sequence

1. **Story 8.1** ✅ - Expand archetype descriptions (pure content, no code changes except constants)
2. **Story 8.2** ✅ - Trait level descriptions (new constant file + frontend rendering)
3. **Story 8.3** ✅ - Facet level descriptions (new constant file + frontend rendering)
4. **Story 8.6** - Results page layout redesign — Mockup 7 Detail Zone (frontend restructure, shadcn Chart + Switch)
5. **Story 8.4** - Personalized portrait at free tier message threshold (DB migration + orchestrator + frontend component within new layout)
6. **Story 8.5** (Phase 2, DEFERRED) - Portrait regeneration for paid tier (requires tier infrastructure + payment system)

**Stories 8.1-8.3** are Phase 1 (MVP) — pure static content, zero API cost, immediate impact.
**Story 8.6** is Phase 1 (MVP) — pure frontend layout restructure. Must land BEFORE 8.4 so the portrait component renders in the new grid layout.
**Story 8.4** is Phase 1 (MVP) — triggers at message threshold, one Claude API call per completed assessment. Portrait frontend renders within the layout established by 8.6.
**Story 8.5** is Phase 2 — requires tier infrastructure (free vs premium), payment system, and extended conversation unlock.

---

## Content Authoring Notes

### Tone Guidelines
- **Second person:** "You tend to..." not "People with this trait..."
- **Warm and affirming:** Celebrate each level as valid, not better/worse
- **Behavioral:** Describe what users DO, not abstract psychology
- **Specific:** Use concrete examples ("you're the one organizing the group trip")
- **Non-judgmental:** Low Agreeableness is "direct and honest," not "difficult"

### Level Naming (for descriptions)
| Trait | Low | Mid | High |
|-------|-----|-----|------|
| Openness | Practical | Grounded | Open-minded |
| Conscientiousness | Flexible | Balanced | Disciplined |
| Extraversion | Introvert | Ambivert | Extravert |
| Agreeableness | Candid | Negotiator | Warm |
| Neuroticism | Resilient | Temperate | Sensitive |

### Facet Score to Level Mapping
- **0-6:** Low (L)
- **7-13:** Mid (M)
- **14-20:** High (H)

---

## Key Technical Decisions

1. **No generic trait/facet descriptions** - Jump straight to level-specific content. Users care about THEIR level, not abstract psychology.
2. **Single `personal_description` column** - Overwrite for paid tier regeneration rather than maintaining v1/v2 columns.
3. **Pre-generate portraits in orchestrator pipeline** - No loading spinners on results page. Portrait is just *there*.
4. **Static content in domain package** - Trait/facet descriptions are pure domain knowledge, belong alongside Big Five constants.
5. **Facet descriptions are 2-3 sentences** (shorter than traits) - 30 facets x 3 levels = 90 entries; keep them punchy.
6. **Portrait output is markdown, not JSON** - Single flowing document in Nerin's dive-master voice. LLM manages structure, headers, emojis. Frontend splits on `##` for styling. See `personalized-portrait-spec.md` for full spec.
7. **Evidence-first pattern** - Portrait anchors traits/strengths/weaknesses to actual conversation moments. Evidence BEFORE analysis — feels like discovery, not labeling.
8. **No guaranteed section count** - Frontend trusts LLM output. Spec defines 6 sections but doesn't enforce them programmatically.

---
