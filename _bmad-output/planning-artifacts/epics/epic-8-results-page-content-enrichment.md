# Epic 8: Results Page Content Enrichment

**Phase:** 1 (MVP) for static content, Phase 2 for personalized portraits

**Goal:** Transform the results page from a clinical data readout into a meaningful, layered personality narrative that makes users feel understood - with static archetype/trait/facet descriptions (Phase 1) and AI-generated personalized portraits tied to a freemium model (Phase 2).

**Dependencies:**
- Epic 3 (OCEAN Archetype System) - archetype lookup working
- Epic 5 (Results & Profiles) - results display page exists
- Epic 2 (Assessment Backend) - orchestrator pipeline for portrait generation trigger

**Enables:** User retention, shareability, freemium monetization ($10 paid tier)

**User Value:** Users understand their personality results through rich, personally relevant descriptions rather than raw scores. Paid users get AI-generated portraits that reference their actual conversation.

---

## Content Architecture

### Results Page Layout (Post-Implementation)

```
┌─────────────────────────────────────────────────────────────┐
│  1. ARCHETYPE CARD (existing, enhanced)                      │
│     - Archetype name (e.g., "The Creative Diplomat")         │
│     - OCEAN code badges                                      │
│     - 4-5 sentence archetype description (EXPANDED)          │
│     - Confidence indicator                                   │
├─────────────────────────────────────────────────────────────┤
│  2. PERSONALIZED PORTRAIT (new, conditional)                 │
│     - Appears when overallConfidence >= 70%                  │
│     - AI-generated narrative referencing user's conversation │
│     - Visual distinction (archetype-colored accent border)   │
│     - Label: "Your Personal Portrait"                        │
│     - Regenerated at 85% for paid users (replaces v1)        │
├─────────────────────────────────────────────────────────────┤
│  3. TRAIT SECTIONS (enhanced)                                │
│     Per trait:                                               │
│     - Trait name + one-line tagline                          │
│     - Score bar (existing)                                   │
│     - Level-specific description (4-5 sentences)             │
│     - Expandable facet breakdown (existing)                  │
│       Per facet:                                             │
│       - Facet name + score                                   │
│       - Level-specific description (2-3 sentences)           │
├─────────────────────────────────────────────────────────────┤
│  4. ACTION BUTTONS (existing)                                │
│     - Continue Assessment / Share My Archetype               │
└─────────────────────────────────────────────────────────────┘
```

### Content Tiers

| Tier | Content | Source | When Available |
|------|---------|--------|----------------|
| **Static** | Archetype description (4-5 sentences) | `CURATED_ARCHETYPES` constant | Always |
| **Static** | Trait level descriptions (4-5 sentences per level) | `TRAIT_DESCRIPTIONS` constant | Always |
| **Static** | Facet level descriptions (2-3 sentences per level) | `FACET_DESCRIPTIONS` constant | Always |
| **Dynamic** | Personalized portrait | AI-generated, stored in DB | >= 70% confidence |
| **Dynamic** | Enhanced portrait (paid) | AI-regenerated at 85% | >= 85% confidence, paid tier |

### Freemium Model

**Free tier:**
- Chat until ~70% confidence (conversation locks)
- Receive: archetype description, trait/facet level descriptions, ONE personalized portrait
- Cannot continue chatting with Nerin

**Paid tier ($10):**
- Unlock continued conversation beyond 70%
- Chat to 85%+ confidence for sharper scores
- Personalized portrait regenerated at 85% (replaces the 70% version)
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

## Story 8.4: Pre-Generate Personalized Portrait at 70% Confidence

As a **User who has reached 70% assessment confidence**,
I want **to see a personalized personality portrait that references my actual conversation**,
So that **I feel genuinely understood in a way no static description can achieve**.

**Acceptance Criteria:**

**Given** my assessment reaches >= 70% overall confidence
**When** the orchestrator pipeline completes that analysis batch
**Then** a personalized portrait is generated via Claude API call
**And** the portrait is stored in `assessment_sessions.personal_description` (TEXT column)
**And** the portrait references specific themes from my conversation
**And** the portrait is 6-10 sentences long
**And** the generation happens in the background (no user wait)

**Given** a personalized portrait exists for my session
**When** I view the results page
**Then** I see a "Your Personal Portrait" section below the archetype card
**And** the section has a distinct visual treatment (archetype-colored accent border)
**And** the content references my actual responses and patterns

**Given** my confidence is below 70%
**When** I view the results page
**Then** the personalized portrait section is not shown
**And** no placeholder or teaser is shown (clean absence)

**Technical Details:**

- Add `personal_description TEXT NULL` column to `assessment_sessions` table (migration)
- Add portrait generation step to orchestrator pipeline:
  ```
  After analysis batch:
    IF overallConfidence >= 70% AND personal_description IS NULL:
      → Generate portrait via Claude API (one call)
      → Store in assessment_sessions.personal_description
  ```
- Claude prompt includes: facet scores, evidence summaries, conversation themes
- Portrait tone: warm, insightful, second-person, non-clinical
- Results endpoint (`get-results` use-case) returns `personalDescription` field when non-null
- Frontend renders `PersonalPortrait` component conditionally
- One API call per session, not per page view

**Acceptance Checklist:**
- [ ] DB migration adds `personal_description` column to `assessment_sessions`
- [ ] Orchestrator triggers portrait generation at >= 70% confidence
- [ ] Portrait generated only once (checks for NULL before generating)
- [ ] Portrait stored in DB (not regenerated on each visit)
- [ ] Portrait is 6-10 sentences referencing conversation themes
- [ ] Results API returns `personalDescription` when non-null
- [ ] Frontend `PersonalPortrait` component renders with archetype accent
- [ ] Component hidden when `personalDescription` is null
- [ ] Cost: one additional Claude API call per completed assessment
- [ ] Tests: use-case test with mock orchestrator verifying trigger condition

---

## Story 8.5: Regenerate Personalized Portrait at 85% Confidence (Paid Tier)

As a **Paid user who has continued chatting beyond 70%**,
I want **my personalized portrait to be regenerated with richer data at 85% confidence**,
So that **my portrait reflects the deeper understanding from my extended conversation**.

**Acceptance Criteria:**

**Given** I am a paid user and my confidence reaches >= 85%
**When** the orchestrator pipeline completes that analysis batch
**Then** the personalized portrait is regenerated via Claude API call
**And** the new portrait REPLACES the existing `personal_description` (single column, overwrite)
**And** the new portrait is noticeably richer (references more specific patterns)
**And** a subtle indicator shows: "Portrait updated - based on 85% confidence"

**Given** I am a free user
**When** my confidence stays at 70% (conversation locked)
**Then** no regeneration occurs
**And** I keep my original 70% portrait permanently

**Technical Details:**

- Extend orchestrator trigger:
  ```
  IF overallConfidence >= 85% AND paid_user AND portrait_not_recently_updated:
    → Regenerate portrait, overwrite personal_description
  ```
- Same `personal_description` column - no v2 column needed
- Optionally add `personal_description_updated_at TIMESTAMP` for tracking
- Results API returns same field; frontend doesn't need to know which version
- Paid tier check: query user subscription status before regenerating

**Acceptance Checklist:**
- [ ] Orchestrator checks for paid user status at 85% threshold
- [ ] Portrait regenerated and overwrites existing `personal_description`
- [ ] Free users' portraits are never overwritten
- [ ] Optional: `personal_description_updated_at` tracks when portrait was last generated
- [ ] Results page shows confidence-based indicator when portrait was updated
- [ ] Total max API calls for portraits: 2 per user (once at 70%, once at 85%)
- [ ] Tests: verify paid vs free tier behavior

---

## Implementation Sequence

1. **Story 8.1** - Expand archetype descriptions (pure content, no code changes except constants)
2. **Story 8.2** - Trait level descriptions (new constant file + frontend rendering)
3. **Story 8.3** - Facet level descriptions (new constant file + frontend rendering)
4. **Story 8.4** - Personalized portrait at 70% (DB migration + orchestrator + frontend)
5. **Story 8.5** - Portrait regeneration at 85% (paid tier integration + orchestrator extension)

**Stories 8.1-8.3** are Phase 1 (MVP) - pure static content, zero API cost, immediate impact.
**Stories 8.4-8.5** are Phase 2 - require orchestrator integration, API cost, and payment system.

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
2. **Single `personal_description` column** - Overwrite at 85% rather than maintaining v1/v2 columns.
3. **Pre-generate portraits in orchestrator pipeline** - No loading spinners on results page. Portrait is just *there*.
4. **Static content in domain package** - Trait/facet descriptions are pure domain knowledge, belong alongside Big Five constants.
5. **Facet descriptions are 2-3 sentences** (shorter than traits) - 30 facets x 3 levels = 90 entries; keep them punchy.

---
