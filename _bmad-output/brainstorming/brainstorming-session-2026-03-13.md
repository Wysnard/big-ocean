---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Adaptive response format architecture + desire-based steering language for Nerin'
session_goals: '(1) Design how Nerin response shape flexes by context, (2) Generate concrete prompt prose for territory desire framing and bridge transitions'
selected_approach: 'ai-recommended'
techniques_used: ['morphological-analysis', 'persona-journey', 'analogical-thinking']
ideas_generated: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
session_active: false
workflow_completed: true
context_file: '_bmad-output/problem-solution-2026-03-13.md'
---

# Brainstorming Session Results

**Facilitator:** Vincentlay
**Date:** 2026-03-13

## Session Overview

**Topic:** Adaptive response format architecture + desire-based steering language for Nerin
**Goals:** (1) Design how Nerin's response shape flexes by context dimensions, (2) Generate concrete prompt prose for territory desire framing and bridge transition patterns

### Context Guidance

_Loaded from problem-solution document: Nerin ignores steering pipeline territory instructions. Root causes identified (position bias, suggestive language, competing depth instincts, relate defaults to nothing, invisible transitions). Three-layer solution proposed (C: observation formats, A: behavioral stack, B: bridge intent). This brainstorming session explores the creative/linguistic dimensions of that solution._

### Session Setup

_AI-recommended technique sequence: Morphological Analysis (map format dimensions) → Persona Journey (generate Nerin-voice language) → Analogical Thinking (bridge patterns from other domains)._

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Adaptive response format + desire-based steering language

**Recommended Techniques:**

- **Morphological Analysis:** Map all interacting dimensions of the adaptive response format to find which combinations produce distinct shapes vs. which collapse
- **Persona Journey:** Embody Nerin to generate desire-framing and bridge language from inside the character voice
- **Analogical Thinking:** Draw parallels from film editing, jazz, therapy, and conversation hosting to surface bridge transition patterns

## Technique Execution Results

### Phase 1: Morphological Analysis

**Key Discovery: 4 Skeletons, Not a Matrix**

The adaptive response format is NOT a matrix of templates. It's:

```
ResponseFormat = Skeleton(intent) + Slots(observation, pressure, territory)
```

**Parameter space analysis:**

| Axis | Role | Values |
|------|------|--------|
| **Intent** | Skeleton (determines response arc) | open, explore, bridge, close |
| **Observation Focus** | Injected content (Nerin connects the dots) | relate, noticing, contradiction, convergence |
| **Entry Pressure** | Energy gap modifier | soft, angled, direct |
| **Transition Type** | Triggers bridge intent | normal, territory_change, energy_shift |

**Eliminated parameters:**
- **Extraction Tier** — measures pipeline reliability, not user response richness. Not a format dimension.
- **Territory Tenure** — computable but not tracked. Deferred.

**Key principle:** Intent is the framework that shapes the response format. Everything else is flavor. Observation is a pointer — Nerin connects the dots in the narrative she wants to build.

**Intent constraints:**

| Intent | Valid Observations | Why |
|--------|-------------------|-----|
| **open** | relate only | Nothing to observe yet |
| **explore** | all 4 | Full territory exploration |
| **bridge** | all 4 | All observations can connect territories |
| **close** | all 4 (competing) | Best observation wins for conclusion |

### Phase 2: Persona Journey

**Territory Descriptions — Nerin's Curiosity Voice**

**Design rule:** Territory descriptions are written as what Nerin is curious about, phrased as "how they...", "what they...", "who they..." — never clinical, never abstract.

**Light Energy (0.20–0.37)**

| # | ID | Name | Description |
|---|---|---|---|
| 1 | `daily-routines` | Daily Routines | how they structure their time and what they protect in it |
| 2 | `creative-pursuits` | Creative Pursuits | what they make or imagine when nobody's watching |
| 3 | `weekend-adventures` | Weekend Adventures | what they chase when the schedule opens up |
| 4 | `learning-curiosity` | Learning & Curiosity | what pulls their attention and why they follow it |
| 5 | `family-rituals` | Family Rituals | the small repeated things that hold their family together |
| 6 | `social-circles` | Social Circles | who they spend time with and what draws them there |
| 7 | `helping-others` | Helping Others | how they show up for people and what that costs them |
| 8 | `comfort-zones` | Comfort Zones | where they retreat when things get heavy and what that says about them |
| 9 | `spontaneity-and-impulse` | Spontaneity & Impulse | when they let go of the plan and what happens |

**Medium Energy (0.38–0.53)**

| # | ID | Name | Description |
|---|---|---|---|
| 10 | `daily-frustrations` | Daily Frustrations | what gets under their skin and how they handle it |
| 11 | `work-dynamics` | Work Dynamics | how they navigate challenge and hierarchy at work |
| 12 | `emotional-awareness` | Emotional Awareness | how they read their own internal weather |
| 13 | `ambition-and-goals` | Ambition & Goals | what they're building toward and what's driving it |
| 14 | `growing-up` | Growing Up | what shaped them early and what they carried forward |
| 15 | `social-dynamics` | Social Dynamics | how they move through rooms and what that takes from them |
| 16 | `friendship-depth` | Close Friendships | who they let close, what earns that, and what they need from it |
| 17 | `opinions-and-values` | Opinions & Values | what they stand for and where they push back |
| 18 | `team-and-leadership` | Team & Leadership | how they lead, how they follow, and which one costs more |
| 19 | `giving-and-receiving` | Giving & Receiving | how they handle generosity coming in and going out |

**Heavy Energy (0.58–0.72)**

| # | ID | Name | Description |
|---|---|---|---|
| 20 | `family-bonds` | Family Bonds | who shaped them in the family and what that left behind |
| 21 | `conflict-and-resolution` | Conflict & Resolution | how they fight, how they repair, and what that costs them |
| 22 | `identity-and-purpose` | Identity & Purpose | what drives them and whether they trust it |
| 23 | `inner-struggles` | Inner Struggles | what weighs on them and how they carry it |
| 24 | `vulnerability-and-trust` | Vulnerability & Trust | what it takes for them to be open and who gets to see it |
| 25 | `pressure-and-resilience` | Pressure & Resilience | how they hold up when it gets hard and what that reveals |

**Desire Framing — Steering Prefix**

Every turn uses the same prefix:

```
What's caught your attention this turn:
```

Frames steering as Nerin's own attention, not a system instruction. Signals priority without breaking character.

**Complete Intent × Observation Templates (13 total)**

**OPEN** (always relate, 1 template)

```
This is your first question. You're curious about {territory.name} — {territory.description}.
```

**EXPLORE** (4 templates — integrated observation→close)

```
relate:
Connect naturally to what they just shared. Your curiosity is on {territory.name} — {territory.description}.

noticing:
Something is shifting in how they talk about {domain}. That shift points toward {territory.description} — follow it.

contradiction:
{facet} shows up differently in {domain1} vs {domain2}. That tension has something to do with {territory.description} — explore it.

convergence:
{facet} keeps showing up across {domains}. That pattern connects to {territory.description} — go deeper.
```

**BRIDGE** (4 templates — observation-as-bridge, single block)

```
relate:
You've been exploring {previousTerritory.name}. Something in what they just shared connects to {newTerritory.description}. Follow that thread. If the thread isn't there but something interesting is unfinished, name it — "there's something there, we'll come back to it" — and shift your curiosity to {newTerritory.description}. If nothing connects, you have a good read on {previousTerritory.name} — tell them, and shift your curiosity to {newTerritory.description}.

noticing:
Something is shifting in how they talk about {domain}. You've been in {previousTerritory.name} — this shift is pulling you toward {newTerritory.description}.

contradiction:
{facet} shows up differently in {domain1} vs {domain2}. You've been exploring {previousTerritory.name} — that tension is pulling you toward {newTerritory.description}.

convergence:
{facet} keeps showing up across {domains}. You've been in {previousTerritory.name}. You're curious where else it lives — {newTerritory.description}.
```

**CLOSE** (4 templates — no territory reference)

```
relate:
This is your last question. Connect to what they just shared and land it — something that lets them leave with a feeling, not a thread to chase.

noticing:
This is your last question. Something has been shifting in how they talk about {domain}. Name it — give them something to sit with.

contradiction:
This is your last question. {facet} shows up differently in {domain1} vs {domain2}. Frame that tension as something worth holding — not to resolve, to notice.

convergence:
This is your last question. {facet} has shown up consistently across {domains}. Name that pattern — it says something core about who they are.
```

**Pressure Modifiers** (explore + bridge only)

```
direct:
Go straight there.

angled:
Find a thread from what they've shared that bends toward it. If they're guarded, come at it from a different direction. If you see something interesting but it's not where your curiosity is pointing — flag it and leave it.

soft:
Only if the conversation opens toward it naturally. If not, stay where you are. If you see a thread worth holding, name it — "there's something there, we'll come back to it."
```

**Observation Focus Parameter Signatures:**

| Observation | Parameters | What Nerin gets pointed at |
|-------------|-----------|---------------------------|
| relate | _(none)_ | Connect naturally |
| noticing | `domain` | Something shifting in this life domain |
| contradiction | `facet, domain1, domain2` | This facet shows up differently across two domains |
| convergence | `facet, domains[]` | This facet is consistent across these domains |

### Phase 3: Analogical Thinking

**Bridge Transition Principle: The Bridge Is Something That Belongs to Both Sides**

Drawn from three domains:
- **Jazz (key changes):** Find a pivot note — a note that belongs to both keys. For Nerin: a facet, feeling, or word that belongs to both territories.
- **Film editing (match cuts):** Visual or thematic continuity across a discontinuous jump. For Nerin: a rhyming shape or pattern across territories.
- **Therapy (topic redirection):** Reflect back what was said and add a pivot. For Nerin: "You said X about Y, and now this about Z — I see a thread there."

**Bridge + Relate Three-Tier Fallback Hierarchy:**

1. **Find a connection** (default) — thread, feeling, shape that links old→new territory (Nerin's narrative intuition)
2. **Flag and leave** — "there's something there, we'll come back to it" + shift curiosity
3. **Clean jump** — "I have a good read on this, now I'm curious about something different"

The observation pipeline naturally handles routing: convergence/contradiction/noticing bridge through computed data. Relate bridges through Nerin's intuition. Clean jump is relate's last resort.

## Module Dissolution Plan

### THREADING — Fully Dissolved

| Skill | New Home | Why |
|---|---|---|
| Connect threads ("That connects to something you said earlier...") | **Common** — merged with "reference earlier parts" | How Nerin thinks, not observation-specific |
| Flag and leave ("There's a thread there... let's leave it for now") | **Bridge intent** | Softer flavor of territory transition |
| Park and pick ("I want to hold X and Y for later...") | **Bridge intent (relate fallback)** | Direct clean jump language |

**Merged common instinct:**
> You reference earlier parts of the conversation — you're always tracking threads. When you spot a connection between things said at different moments, name it. You never repeat ground already covered.

### CONVERSATION_INSTINCTS — Trimmed

| Skill | Action |
|---|---|
| "Go deeper when opening up" | **Removed** — depth is steering-controlled |
| "When guarded, change angle" | **Moved to pressure modifiers (soft/angled)** |
| Reference earlier parts | Stays common (merged with connect threads) |
| Normalize not-knowing | Stays common |
| Explore feelings actively | Stays common |
| Meet vulnerability first | Stays common |
| Celebrate new depth | Stays common |

### MIRRORS_EXPLORE + MIRRORS_AMPLIFY — Dissolved into Lookup Table

Mirrors loaded contextually by intent × observation. Curated mirrors are examples — Nerin can discover new ones (biology must be real).

**Open** — no mirrors

**Explore:**

| Observation | Mirrors |
|---|---|
| relate | Full library available |
| noticing | Hermit Crab, Volcanic Vents, Bioluminescence, Tide Pool |
| contradiction | Tide Pool, Bioluminescence, Dolphin Echolocation, Mimic Octopus |
| convergence | Ghost Net, Pilot Fish, Coral Reef, Parrotfish, Sea Urchin |

**Bridge:**

| Observation | Mirrors |
|---|---|
| relate | Any mirror that connects territories |
| noticing | Hermit Crab, Volcanic Vents |
| contradiction | Tide Pool, Dolphin Echolocation |
| convergence | Ghost Net, Coral Reef, Pilot Fish |

**Close:**

| Observation | Mirrors (all types) |
|---|---|
| all | Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola |

### OBSERVATION_QUALITY — Dissolved

| Content | New Home |
|---|---|
| "You said X, now Y — those feel different" | Contradiction observation template |
| "You almost skipped past that — say more?" | Noticing observation template |
| "That's a very specific pattern" | Convergence observation template |
| "Name it and hand it back" principle | Common |
| "Go beyond their framework" | Common |

### REFLECT + STORY_PULLING — Moved to Common

Both are questioning techniques that apply regardless of intent or observation. Not intent-specific.

### EXPLORE_RESPONSE_FORMAT — Replaced

Entirely replaced by the skeleton system.

## Final Architecture: Two Layers

The 4-tier prompt system collapses to **two layers:**

**Layer 1 — Common (who Nerin is):**
- NERIN_PERSONA
- CONVERSATION_MODE
- BELIEFS_IN_ACTION
- CONVERSATION_INSTINCTS (trimmed)
- QUALITY_INSTINCT
- MIRROR_GUARDRAILS
- HUMOR_GUARDRAILS
- INTERNAL_TRACKING
- REFLECT
- STORY_PULLING
- "Name it and hand it back" + "go beyond their framework"

Stable across all turns.

**Layer 2 — Steering (where Nerin points this turn):**
- Prefix: "What's caught your attention this turn:"
- Intent × observation template (13 templates)
- Pressure modifier (explore + bridge only)
- Curated mirrors (intent × observation lookup)

Changes every turn.

**Prompt assembly:**

```
[Layer 1: Common modules]

What's caught your attention this turn:
[Intent × observation template with filled parameters]
[Pressure modifier if explore/bridge]

[Curated mirror examples for this intent × observation]
You can discover new mirrors in the moment — but the biology must be real.
```

## Implementation Sequence

**Phase 1: Foundation**
1. Add `name` and `description` fields to territory catalog (25 territories)
2. Trim CONVERSATION_INSTINCTS (remove depth, move guarded to pressure)
3. Move REFLECT + STORY_PULLING to common
4. Dissolve OBSERVATION_QUALITY into common + observation templates

**Phase 2: Skeleton System**
5. Create the 13 intent × observation templates
6. Create pressure modifiers with absorbed guarded/pivot + flag-and-leave
7. Build the "What's caught your attention this turn:" steering prefix
8. Replace prompt builder's Tier 2 selection + steering section with skeleton system

**Phase 3: Bridge + Mirrors**
9. Add `bridge` intent to governor (emit on territory_change)
10. Dissolve THREADING into common + bridge templates
11. Create mirror lookup table by intent × observation
12. Replace MIRRORS_EXPLORE/MIRRORS_AMPLIFY with contextual mirror loading

**Phase 4: Cleanup**
13. Remove EXPLORE_RESPONSE_FORMAT
14. Rename amplify → close throughout
15. Update all prompt builder tests

Each phase is independently testable. Existing behavior doesn't break until Phase 2 step 8 (the actual swap).

## Session Summary and Insights

**Key Achievements:**

- Discovered the format system is 4 skeletons with variable slots, not a combinatorial matrix
- Drafted all 13 intent × observation templates in Nerin's desire-framing voice
- Designed bridge strategy: connect first, flag-and-leave second, clean jump third
- Dissolved 5 modules (THREADING, MIRRORS_EXPLORE, MIRRORS_AMPLIFY, OBSERVATION_QUALITY, EXPLORE_RESPONSE_FORMAT)
- Collapsed the 4-tier prompt system to 2 layers (common identity + per-turn steering)
- Drafted 25 territory name + description fields in Nerin's curiosity voice

**Breakthrough Insight:**

The core discovery is that intent determines the response arc skeleton, while observation focus and entry pressure are injected parameters — not separate format variations. This collapses the design space from 400+ theoretical combinations to 13 templates + 3 pressure modifiers. The observation is a pointer — Nerin connects the dots.

### Creative Facilitation Narrative

The session started with structural analysis (Morphological Analysis) that rapidly eliminated unnecessary dimensions — extraction tier and territory tenure were cut, and the matrix collapsed to skeletons. Persona Journey grounded the language in Nerin's actual voice, producing the "curiosity as desire" framing and all 25 territory descriptions. Analogical Thinking brought the jazz/film/therapy bridge principle — "the bridge is something that belongs to both sides" — which unified the bridge strategy. The most productive moments came from the user's corrections: "observation is a pointer, not a script", "bridge default is connect, not park", "threading should be split", "mirrors should be curated by context." Each correction sharpened the architecture.
