# Scoring & Confidence v2 Spec

**Date:** 2026-03-29
**Status:** Draft
**Research basis:** `research/domain-psychometric-scoring-confidence-big-five-research-2026-03-29.md`

---

## 1. Overview

This spec covers two interconnected changes to the scoring/confidence pipeline, plus a territory catalog evolution:

1. **Evidence extraction redesign** — polarity+strength model with per-facet conversational examples
2. **Life domain restructure** — remove `solo`, add `health`, 3 new health territories
3. **Territory catalog evolution** — domain remapping, hard-to-assess facet coverage, new territory for inner life

### Goals

- Fix the positive deviation bias (75% of current evidence is positive)
- Fix the compression toward moderate scores (LLM avoids -3 entirely)
- Eliminate single-territory bottlenecks for hard-to-assess facets (orderliness, artistic_interests)
- Add health domain for facets that naturally express there (self_discipline, immoderation, activity_level, anxiety, vulnerability)

### Non-Goals

- Merging domain breadth into confidence (explored and rejected — adds cascading complexity without proportional value; see ADR-28)
- Removing signal power (confirmed as architecturally correct — it IS the domain diversity signal, used by steering)
- Full Bayesian rewrite (deferred)
- OCEAN code confidence-awareness (keeping it simple for users)
- Coherence/context-sensitivity signal (observation focus already handles contradiction/convergence for steering)

### What Stays Unchanged

- **Confidence formula**: `C_max × (1 - e^{-kW})` — evidence mass, domain-blind
- **Signal power**: `V × D` — volume × domain diversity, drives steering
- **Steering priority**: `α × max(0, C_target - confidence) + β × max(0, P_target - signalPower)`
- **Score formula**: `10 + D_f × SCALE_FACTOR` — weighted deviation mean
- **Result schema**: `{ score, confidence, signalPower }` per facet and trait
- **OCEAN code generation**: deterministic threshold mapping, unchanged

---

## 2. Life Domain Changes

### Current → New

```
REMOVED:  solo
ADDED:    health
UNCHANGED: work, relationships, family, leisure, other
```

**New domain list:**
```typescript
export const LIFE_DOMAINS = [
  "work",
  "relationships",
  "family",
  "leisure",
  "health",
  "other",
] as const;
```

### Domain Definitions (for extraction prompt)

```
- work: Professional activities, career, job tasks, education, studying, colleagues, workplace dynamics
- relationships: Romantic partners, close friendships, social connections
- family: Parents, siblings, children, extended family, household dynamics
- leisure: Hobbies, entertainment, sports, travel, group activities, alone-time hobbies, introspection, daydreaming
- health: Exercise, diet, sleep, self-care routines, morning/evening habits, physical/mental wellness, stress management
- other: ONLY when truly doesn't fit above. Target <5%.
```

**Key design decisions:**
- `leisure` absorbs the introspective/alone-time aspects previously in `solo` (daydreaming, reading, solo hobbies)
- `health` captures self-care routines, exercise habits, diet discipline — strong signal for conscientiousness and neuroticism facets
- Education maps to `work` (a student's "work" is studying)

### Migration

- Add `health` to `LIFE_DOMAINS`, pgEnum, `LifeDomainSchema`, `STEERABLE_DOMAINS`
- Existing `solo` evidence in DB: migrate to `leisure` or `health` based on note content (or leave as-is with a remap at read time)
- Update all territory definitions that use `solo` domain

---

## 3. Evidence Extraction Redesign

### Architecture: Two Separate LLM Calls

**Call 1 — User State Extraction** (energy + telling)
- Existing Phase 1 prompt, moved to its own dedicated LLM call
- No changes to prompt content
- Output: `{ energyBand, tellingBand, energyReason, tellingReason, withinMessageShift }`

**Call 2 — Personality Evidence Extraction** (new prompt below)
- Dedicated call with rich per-facet conversational examples
- Output: `{ evidence: BehavioralSignal[] }`

### Schema Change

**Current:**
```typescript
interface EvidenceInput {
  bigfiveFacet: FacetName;
  deviation: number;              // -3 to +3 (LLM judges magnitude — PROBLEMATIC)
  strength: "weak" | "moderate" | "strong";
  confidence: "low" | "medium" | "high";
  domain: LifeDomain;
  note?: string;
}
```

**New extraction output:**
```typescript
interface ExtractedEvidence {
  bigfiveFacet: FacetName;
  polarity: "high" | "low";      // Direction only — LLM judges which end
  strength: "weak" | "moderate" | "strong";  // How diagnostic is the signal
  confidence: "low" | "medium" | "high";     // How certain the extraction is
  domain: LifeDomain;
  note?: string;
}
```

**Deviation becomes derived (deterministic):**
```typescript
const MAGNITUDE_MAP = { weak: 1, moderate: 2, strong: 3 } as const;

function deriveDeviation(polarity: "high" | "low", strength: EvidenceStrength): number {
  const sign = polarity === "high" ? 1 : -1;
  return sign * MAGNITUDE_MAP[strength];
}
// high+strong → +3, high+moderate → +2, high+weak → +1
// low+strong  → -3, low+moderate  → -2, low+weak  → -1
```

**Bridge to existing formula:**
The adapter converts `ExtractedEvidence` → `EvidenceInput` before it enters `formula.ts`. The formula code itself is unchanged — it still receives deviation values.

### Database Change

Add `polarity` column to `conversation_evidence` table. Keep `deviation` column — compute it from `polarity × strength` before insert. Existing evidence from old sessions still works.

### Why This Fixes the Bias

| Problem | Root Cause | How Polarity Model Fixes It |
|---------|-----------|---------------------------|
| 75% positive deviations | LLM defaults to positive numbers | LLM just says "high" or "low" — binary is harder to bias |
| Zero -3 extractions | LLM avoids extreme negative numbers | `low+strong` automatically → -3. Saying "strong low signal" is easier than "-3" |
| Deviation 0 never used | LLM treats extraction as "noteworthy" | Eliminated — no evidence = neutral score (10) |
| Moderate compression | LLM defaults to ±1 or ±2 | Strength is about signal clarity, not person extremeness — better calibrated |

---

## 4. Evidence Extraction Prompt (Call 2)

```
You are a personality evidence extractor. Analyze the latest user message for Big Five personality signals.

## Big Five Facets — Conversational Anchors

For each facet, HIGH and LOW examples show what each pole sounds like in real conversation. Use these to calibrate your extractions.

### OPENNESS TO EXPERIENCE

**imagination** — Active fantasy life and vivid daydreaming; tendency to create rich mental scenarios
- HIGH: "I spend hours daydreaming about scenarios that will never happen — what if animals could vote, what if I lived in the 1800s... my head is always somewhere else"
- LOW: "I don't really daydream. I think about practical stuff — what needs to get done, what's for dinner. Fantasy just isn't my thing"

**artistic_interests** — Appreciation for art, beauty, and aesthetic experiences
- HIGH: "I stood in front of that painting for twenty minutes. There was something about the light that I couldn't stop looking at — I notice beauty in weird places"
- LOW: "Museums bore me. I went once because my friend dragged me, and I spent the whole time checking my phone. I just don't get the appeal"

**emotionality** — Receptiveness to one's own inner feelings and emotional awareness (distinct from neuroticism)
- HIGH: "I can always tell when something is off inside me — like a shift in my mood before I even know why. I sit with my feelings a lot"
- LOW: "People ask me how I feel about things and I genuinely don't know. I process things logically, not emotionally. Feelings are kind of background noise"

**adventurousness** — Willingness to try new activities and embrace novel experiences
- HIGH: "I moved to a country where I didn't speak the language just to see what would happen. I get restless if life feels too predictable"
- LOW: "I eat at the same three restaurants. I've had the same morning routine for years. I know what I like, and trying new things stresses me out"

**intellect** — Intellectual curiosity and love of learning for its own sake
- HIGH: "I fell down a Wikipedia rabbit hole about the history of zero last night. I just love learning things for no reason — even useless stuff"
- LOW: "I'm not really a thinker. I don't read for fun or wonder about abstract stuff. If it doesn't affect my day-to-day, I don't bother with it"

**liberalism** — Willingness to re-examine values and challenge convention (not political ideology)
- HIGH: "I question everything I was taught growing up. Just because something is tradition doesn't mean it's right. I've changed my mind on a lot of big things"
- LOW: "I respect the way things have always been done. There's wisdom in tradition. I'm not someone who constantly questions authority or pushes for change"

### CONSCIENTIOUSNESS

**self_efficacy** — Confidence in one's own competence and ability to handle challenges
- HIGH: "When something breaks, I'm the person everyone calls. I figure things out — I trust myself to handle whatever comes up"
- LOW: "I often feel like I'm going to mess things up. Even when I've done something before, I second-guess whether I can do it again"

**orderliness** — Personal organization and preference for structured environments
- HIGH: "My desk is always clean. I have a system for everything — files, emails, even my fridge. Mess makes me anxious"
- LOW: "My room is chaos and I know where everything is. I've never used a planner in my life. Structure feels suffocating"

**dutifulness** — Sense of moral obligation and reliable follow-through on commitments
- HIGH: "If I say I'll do something, I do it. Even if I don't feel like it anymore. Breaking a promise physically bothers me"
- LOW: "I'm flexible with commitments. If something better comes up or I change my mind, I'll adjust. I don't see the point in forcing myself to do things I don't want to do"

**achievement_striving** — Drive toward personal achievement and high standards
- HIGH: "I need to be working toward something. Setting goals, hitting milestones — if I'm not improving, I feel like I'm wasting time"
- LOW: "I don't need to be the best at anything. I'm happy coasting. Achievement for its own sake doesn't motivate me — I'd rather just enjoy life"

**self_discipline** — Ability to persist on tasks despite boredom or distractions
- HIGH: "I finish things even when they're boring. If I started it, I'll sit there and push through until it's done, no matter how tedious"
- LOW: "I can't focus on anything that doesn't interest me. If a task is boring, I'll procrastinate for days. I need genuine interest to push through"

**cautiousness** — Tendency to think carefully before acting
- HIGH: "I make pro/con lists for everything. I don't rush decisions — I'd rather take a week to decide than make a mistake"
- LOW: "I decide fast and course-correct later. Overthinking kills momentum. I'd rather act and adjust than sit around analyzing"

### EXTRAVERSION

**friendliness** — Genuine warmth and interest in other people
- HIGH: "I strike up conversations with strangers in line. I'm genuinely curious about people — their stories, what makes them tick"
- LOW: "I'm not unfriendly, but I don't go out of my way to connect. I keep things professional. I don't need to know everyone's life story"

**gregariousness** — Preference for the company of others over solitude
- HIGH: "I hate being alone. I fill every evening with plans — dinner with friends, group activities, anything with people around"
- LOW: "I go weeks without seeing anyone and that's exactly how I like it. I need long stretches of alone time to feel like myself"

**assertiveness** — Social dominance and forcefulness of expression
- HIGH: "In group conversations, I usually end up steering the direction. I speak up immediately when I disagree — I don't wait to be asked"
- LOW: "I let others take the lead. In meetings, I hold back my opinions unless directly asked. I'm more of an observer than a driver"

**activity_level** — Pace of living and overall energy
- HIGH: "My schedule is packed from 6am to midnight. I'm always doing something — if there's a gap, I fill it. I can't sit still"
- LOW: "I like slow days. My ideal weekend is doing absolutely nothing. I don't understand people who need to be busy all the time"

**excitement_seeking** — Need for environmental stimulation and thrilling experiences
- HIGH: "I get bored so easily. I need novelty — new places, new experiences, new challenges. Routine makes me feel dead inside"
- LOW: "I'm perfectly happy with a quiet, predictable life. I don't need thrills. A calm evening at home is my idea of a perfect night"

**cheerfulness** — Tendency to experience and express positive emotions
- HIGH: "People say I light up a room. I laugh a lot, I get excited about small things, I just generally feel happy most of the time"
- LOW: "I'm not really a smiley person. I'm not unhappy — I'm just even. I don't get outwardly excited or expressive about things"

### AGREEABLENESS

**trust** — Belief in the sincerity and good intentions of others
- HIGH: "I give everyone the benefit of the doubt. Until someone proves otherwise, I assume they're being honest and well-meaning"
- LOW: "I always look for the angle. When someone is nice to me, my first thought is what they want. People are rarely straightforward"

**morality** — Straightforwardness and sincerity in social interactions (not moral character)
- HIGH: "I say what I mean. I don't do the thing where you sugarcoat to manage people. If I disagree, I'll tell you directly"
- LOW: "I know how to play the game. Sometimes you need to tell people what they want to hear, or position things strategically. That's just social intelligence"

**altruism** — Active concern for the welfare of others
- HIGH: "I'll drop everything to help a friend. When I see someone struggling, I physically can't not do something — helping is reflexive for me"
- LOW: "I help when it's convenient, but I don't go out of my way. I focus on my own life first. People need to solve their own problems"

**cooperation** — Preference for harmony over confrontation
- HIGH: "I'll bend on almost anything to avoid a fight. Conflict makes me physically uncomfortable — I'd rather compromise than argue"
- LOW: "If I think I'm right, I'll argue until the end. I don't back down to keep the peace. Healthy conflict is how you get to the truth"

**modesty** — Tendency to be humble and self-effacing
- HIGH: "I downplay what I'm good at. When people praise me, I deflect or change the subject — it makes me genuinely uncomfortable"
- LOW: "I know I'm good at what I do, and I'm comfortable saying so. I don't see the point in false modesty — own your strengths"

**sympathy** — Compassion and tender-mindedness; being moved by others' suffering
- HIGH: "When I see someone in pain — even a stranger — I feel it in my chest. I can't watch the news without being affected. Other people's suffering stays with me"
- LOW: "I care about people, but I don't get emotional about their problems. Sympathy doesn't help — practical solutions do. I'm the tough-love friend"

### NEUROTICISM

**anxiety** — Level of free-floating worry and nervousness
- HIGH: "I lose sleep worrying about things that probably won't happen. My mind runs worst-case scenarios constantly — even when everything is fine"
- LOW: "I genuinely don't worry much. Even in a crisis, I feel calm. People find it weird, but anxiety just isn't something I experience"

**anger** — Tendency to experience anger, frustration, and bitterness
- HIGH: "I have a short fuse. Small things set me off — someone cutting in line, a slow driver. I feel the anger physically before I can even think about it"
- LOW: "It takes a lot to make me angry. I let most things slide. Life's too short to get worked up about small stuff"

**depression** — Tendency to experience sadness, guilt, loneliness, and hopelessness
- HIGH: "I go through periods where everything feels pointless. I feel a heaviness that doesn't have a clear cause — it just sits there"
- LOW: "I'm generally a content person. Even when bad things happen, I bounce back fast. I don't really do prolonged sadness"

**self_consciousness** — Sensitivity to social evaluation and others' opinions
- HIGH: "I replay conversations for hours wondering if I said the wrong thing. I'm hyper-aware of how people perceive me — it's exhausting"
- LOW: "I genuinely don't care what people think of me. If I embarrass myself, I laugh it off. Other people's judgment doesn't register"

**immoderation** — Difficulty resisting cravings and urges
- HIGH: "I can't resist snacks at night. If I want something, I do it — even when I know I shouldn't. Willpower is not my thing"
- LOW: "I'm very disciplined about temptation. If I decide not to eat sugar, I just... don't. Cravings don't control me"

**vulnerability** — Susceptibility to stress and difficulty coping under pressure
- HIGH: "When everything piles up, I shut down. I feel overwhelmed and can't think straight — pressure makes me worse, not better"
- LOW: "I work well under pressure. Deadlines, chaos, crises — that's when I'm most focused. Stress brings out my best"

## Extraction Instructions

### Valid Facet Names (ONLY these 30)
imagination, artistic_interests, emotionality, adventurousness, intellect, liberalism,
self_efficacy, orderliness, dutifulness, achievement_striving, self_discipline, cautiousness,
friendliness, gregariousness, assertiveness, activity_level, excitement_seeking, cheerfulness,
trust, morality, altruism, cooperation, modesty, sympathy,
anxiety, anger, depression, self_consciousness, immoderation, vulnerability

### Life Domains
- work: Professional activities, career, job tasks, education, studying, colleagues, workplace dynamics
- relationships: Romantic partners, close friendships, social connections
- family: Parents, siblings, children, extended family, household dynamics
- leisure: Hobbies, entertainment, sports, travel, group activities, alone-time hobbies, introspection, daydreaming
- health: Exercise, diet, sleep, self-care routines, morning/evening habits, physical/mental wellness, stress management
- other: ONLY when truly doesn't fit above. Target <5%.

### Current Evidence Distribution
${domainDist}

### Conversation Context
${recentText}

### What To Extract

For each personality signal in the latest user message:

1. **bigfiveFacet**: Which facet? Match the user's behavior to the conversational examples above.
2. **polarity**: HIGH or LOW expression? Compare to the HIGH and LOW examples. Ask: "Does this sound more like the HIGH example or the LOW example for this facet?"
3. **strength**: How diagnostic is this signal?
   - "strong": Concrete behavioral pattern or strong stated preference that clearly maps to one pole — the person described a specific, repeated action
   - "moderate": Suggestive — an opinion, tendency, or indirect signal
   - "weak": Mild hint — could be interpreted differently
4. **confidence**: How certain is this extraction?
   - "high": Facet and polarity are clear from the conversational examples
   - "medium": Reasonable but some ambiguity
   - "low": Uncertain
5. **domain**: Which life domain?
6. **note**: Brief behavioral paraphrase (max 200 chars, no direct quotes)

### Dual-Polarity Check (MANDATORY)

For EVERY signal, ask: "Does this same behavior ALSO reveal the OPPOSITE polarity on a DIFFERENT facet?"

Examples from real conversations:
- "I spend all my free time on solo side projects" → HIGH self_discipline + LOW gregariousness
- "I invited colleagues to my party to manage perceptions" → HIGH assertiveness + LOW morality (straightforwardness)
- "Surface-level conversation bores me" → HIGH intellect + LOW friendliness (unconditional warmth)
- "I can't sit still when nothing is happening" → HIGH activity_level + LOW vulnerability (handles restlessness by staying busy)
- "I never give advice unless asked" → HIGH cooperation + LOW assertiveness

Extract BOTH signals when applicable.

### Polarity Balance Audit (MANDATORY)

After extracting all signals, count HIGH vs LOW:
- If fewer than 35% are LOW, re-read the message looking specifically for:
  - ABSENCES: What the person does NOT do or enjoy
  - AVOIDANCES: What they actively steer away from
  - PREFERENCES AGAINST: "I don't enjoy...", "I'm not someone who...", "That's not my thing"
- "I prefer small groups" → LOW gregariousness (this IS a personality signal, not a neutral statement)
- "I don't really care about that" → LOW on the relevant facet

### Rules
1. Focus ONLY on the latest user message
2. Return empty array [] if no personality signal (e.g., "hello", "thanks", "ok")
3. Extract signals at moderate+ strength AND confidence
4. Same behavior in different domains → separate records
5. Prefer specific domains over "other"
```

---

## 5. Scoring Formula — No Changes

The three-signal scoring model is confirmed as architecturally correct:

```
score_f       — 0-20 facet score (weighted deviation mean)
confidence_f  — C_max × (1 - e^{-kW}) — evidence mass, domain-blind
signalPower_f — V × D (volume × normalized entropy) — domain diversity, drives steering
```

**Why no changes:** Confidence and breadth answer different questions. Confidence = "how much evidence supports this score?" (reliability). Signal power = "how broadly was it observed?" (generalizability). Merging them into one number was explored and rejected — it created cascading complexity (eligible domain overrides, observability matrices, facet classification) without proportional value. Signal power IS the breadth signal, and it's already in the right place: steering.

**Result schema unchanged:** `{ score, confidence, signalPower }` per facet and trait.

**Steering unchanged:** `priority = α × max(0, C_target - confidence) + β × max(0, P_target - signalPower)`

---

## 6. Territory Catalog Changes

### Domain Remapping (solo → new domains)

| Territory | Old Domains | New Domains |
|-----------|------------|-------------|
| daily-routines | work, solo | work, **health** |
| creative-pursuits | leisure, solo | **leisure, work** |
| weekend-adventures | leisure, solo | **leisure, relationships** |
| learning-curiosity | solo, work | **leisure**, work |
| comfort-zones | solo, relationships | **health**, relationships |
| spontaneity-and-impulse | leisure, solo | leisure, **health** |
| emotional-awareness | solo, relationships | **health**, relationships |
| ambition-and-goals | work, solo | work, **health** |
| growing-up | family, solo | family, **relationships** |
| friendship-depth | relationships, solo | relationships, **leisure** |
| opinions-and-values | solo, relationships | relationships, **work** |
| inner-struggles | solo, relationships | **health**, relationships |

### Replaced Territory

| Old | New | Domains | Facets |
|-----|-----|---------|--------|
| identity-and-purpose (solo, work) | **inner-life** | health, leisure | intellect, emotionality, imagination, liberalism, **artistic_interests** |

### New Health Territories (3)

| Territory | Domains | Facets | Energy | Opener |
|-----------|---------|--------|--------|--------|
| body-and-movement | health, leisure | activity_level, self_discipline, excitement_seeking | 0.25 | "What's your favorite way to move your body — do you have a sport, a routine, or something you just enjoy doing?" |
| cravings-and-indulgences | health, leisure | immoderation, self_discipline, cautiousness | 0.40 | "Everyone has their guilty pleasures — what's yours?" |
| stress-and-the-body | health, work | vulnerability, anxiety, self_efficacy, self_discipline | 0.60 | "When stress starts building up, where do you feel it first — and what do you do about it?" |

### New Hard-to-Assess Coverage Territories (3)

| Territory | Domains | Facets | Energy | Opener |
|-----------|---------|--------|--------|--------|
| home-and-space | family, leisure | orderliness, activity_level, cautiousness | 0.22 | "What does your living space look like — are you someone who keeps things tidy or do you have your own system?" |
| trips-and-plans | leisure, relationships | orderliness, adventurousness, cooperation | 0.28 | "When you're planning a trip or an outing with friends, how do you go about it — are you the planner or do you just show up?" |
| taking-care | health, family | altruism, sympathy, dutifulness, self_discipline | 0.48 | "Is there someone in your life you look after or worry about their wellbeing?" |

### Facet Additions to Existing Territories

| Facet | Added to Territory | Why |
|-------|-------------------|-----|
| artistic_interests | **inner-life** (health, leisure) | "What does your mind do" reveals aesthetic appreciation |
| cautiousness | **work-dynamics** (work, relationships) | Deliberation before decisions at work |
| liberalism | **growing-up** (family, relationships) | Challenging or accepting family values |

### Hard-to-Assess Facet Coverage (Final)

| Facet | Territories | Domains | Notes |
|-------|:-----------:|:-------:|-------|
| orderliness | 3 (daily-routines, home-and-space, trips-and-plans) | 5 (all) | No duplicate domain pairs |
| artistic_interests | 2 (creative-pursuits, inner-life) | 3 | Sufficient — niche facet |
| cautiousness | 5 (comfort, spontaneity, cravings, work-dyn, home-and-space) | 4 | Strong |
| liberalism | 3 (opinions-values, inner-life, growing-up) | 4 | Good |
| dutifulness | 5 (family-rit, growing-up, team, family-bonds, taking-care) | 4 | Strong |
| altruism | 3 (helping-others, giving-and-receiving, taking-care) | 4 (rel, work, family, health) | Fixed — was missing health |
| immoderation | 3 (spontaneity, cravings, giving) | 4 | Good |
| depression | 2 (inner-struggles, pressure) | 4 | Acceptable — sensitive, heavy territories only |
| modesty | 3 (friendship, team, giving) | 4 | Decent |
| adventurousness | 4 (creative, weekend, comfort, trips-and-plans) | 4 | Good |

### Catalog Size

25 → **31 territories** (3 new health + 3 new hard-to-assess coverage + 1 replacement for identity-and-purpose). All 30 facets have ≥2 territory routes. No hard-to-assess facet is stuck in a single domain pair.

---

## 7. Migration Plan

### Phase 1: Life domains + territory catalog
- Add `health` to `LIFE_DOMAINS`, pgEnum, `LifeDomainSchema`, `STEERABLE_DOMAINS`
- Remove `solo` from all constants and enums
- Remap existing `solo` evidence in DB to `leisure` or `health`
- Update all 12 remapped territories with new domain assignments
- Replace `identity-and-purpose` with `inner-life`
- Add 3 new health territories (body-and-movement, cravings-and-indulgences, stress-and-the-body)
- Add 3 new hard-to-assess coverage territories (home-and-space, trips-and-plans, taking-care)
- Add facets to existing territories (artistic_interests → inner-life, cautiousness → work-dynamics, liberalism → growing-up)
- Update territory catalog tests
- Update ConversAnalyzer domain definitions in extraction prompt

### Phase 2: Evidence extraction split + polarity model
- Separate ConversAnalyzer into two LLM calls (user state + evidence)
- Add `polarity` column to `conversation_evidence` table
- Implement `deriveDeviation()` adapter
- Deploy new extraction prompt with per-facet conversational anchors
- Update extraction schemas and lenient parsing
- `formula.ts` unchanged — receives same deviation values via adapter

---

## 8. What's Explicitly Out of Scope

- Merging breadth into confidence (explored, rejected — see ADR-28)
- Removing signal power (confirmed as correct — it IS domain diversity)
- Full Bayesian posterior estimation (future)
- OCEAN code confidence-awareness (keeping it simple)
- Coherence/context-sensitivity signal (observation focus handles this for steering)
- Population priors (future)
- Two-axis domain model (social × life context — discussed, deferred)
- Splitting `relationships` into friends + romantic (not worth the extraction noise)
- Eligible domain overrides / observability matrix (rejected complexity)
