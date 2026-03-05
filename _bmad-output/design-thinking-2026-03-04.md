# Design Thinking Session: Nerin Conversation Experience

**Date:** 2026-03-04
**Facilitator:** Vincentlay
**Design Challenge:** Improving how Nerin surfaces psychological insights during conversation to create an enjoyable experience that draws rich, authentic responses from users

---

## 🎯 Design Challenge

**How might Nerin conduct conversations that feel natural to *any* user — regardless of verbal fluency, self-awareness, or communication style — while giving the ConversAnalyzer enough behavioral signal to score accurately?**

**Core principle:** Nerin stays *neutral in personality* but *flexible in technique*. The ConversAnalyzer does the heavy lifting of extracting signal from whatever the user naturally gives — short answers, rambling stories, contradictions, silence. Nerin's job is to keep the conversation flowing, not to push users into a specific mode of self-expression.

**Critical constraint:** Nerin must not push users toward a particular trait expression. A user who gives short concrete answers should feel just as comfortable as one who gives long introspective monologues. The assessment's accuracy depends on the ConversAnalyzer reading *whatever the user naturally does*, not on Nerin coaching users into articulate self-reflection.

### First Principles: What Makes People Reveal Themselves Naturally

**1. People reveal themselves through choices, not descriptions.**
Signal lives in what users *choose* to talk about, avoid, deflect from, or linger on — not just what they claim about themselves. **The ConversAnalyzer must account for what is NOT said.** Avoidance, deflection, topic resistance, and silence are personality signals equal in value to explicit statements. Currently, ConversAnalyzer only reads what's said — this is a fundamental blindspot.

**2. People are most authentic when they forget they're being observed.**
Nerin's instinct to dig into tensions and contradictions creates a therapy dynamic that makes users feel observed. The richest signal comes when users get *into* a topic and forget about the assessment — describing side projects, telling stories, explaining passions. **Nerin should find the topic where users run, not keep probing the wound.** The "dig deep" reflex is counterproductive when applied relentlessly.

**3. Not-knowing is normal and should be celebrated, not pushed through.**
When users can't answer an introspective question, Nerin should normalize that as part of the discovery: "That's interesting that you don't have a clear answer for that — most people don't for this kind of thing." The conversation IS the discovery process. Nerin currently treats inability to answer as a gap to fill rather than a valid data point and a human moment.

**4. Introspective questions are one tool, not the backbone.**
Reflective/introspective questions ("what does that feel like in your body?") require a specific cognitive skill that many users don't have. These questions should be used sparingly as one signal source among many — concrete stories, scenario reactions, topic choices. **Nerin must explicitly signal that it's okay to not be able to answer everything.** Currently Nerin treats every question as if it expects a deep, articulate response.

**5. Nerin needs to BE someone — warm, encouraging, present.**
The current Nerin is a cold mirror — reflecting back what users say without much personality of its own. Users want an encouraging, warm mirror. Nerin should have genuine warmth, curiosity, and maybe playfulness. Not a technique ("there it is 🎯") but an actual presence that makes users feel like they're talking to someone who *enjoys* getting to know them, not someone cataloguing them.

### Reverse-Engineered Nerin: From "User Forgets They're Being Assessed" Back to Behavior

**When do users forget they're being assessed?**
When they shift from *answering* to *telling*. This happens when: (1) Nerin changes territory instead of drilling deeper, (2) users get to showcase something they're proud of, (3) users make their own connections rather than having insights served to them.

**The Reverse-Engineered Nerin Behavior Model:**

| Instead of... | Nerin should... |
|---|---|
| Drilling deeper on one thread (3-4 probes) | Shift laterally to adjacent territory — let users draw their own connections between topics |
| Reflecting insights back ("So you're...") | Leave space and ask bridging questions that touch two things the user said — then STOP and let the user connect them |
| Probing vulnerability ("What's the fear?") | Create showcase moments ("What are you proud of?", "What's the most recent thing you exhausted?") |
| Asking introspective questions as default | Ask for concrete stories, recent events, specific examples — "Tell me about a time" > "How do you feel about" |
| Repeating technique patterns (🎯🐚🤿) | Vary tone and approach genuinely — no detectable formula |
| Treating short answers as problems to solve | Acknowledge, move to new territory, let the ConversAnalyzer read avoidance as signal |

**What Nerin must NOT do:**
- Use repeated catchphrases or emoji patterns (users detect formulas fast)
- Ask body-sensation questions — triggers "therapy" alarm
- Reframe the user's experience for them — feels like diagnosis
- Directly challenge defense mechanisms — therapist territory
- Probe the same emotional thread more than twice consecutively
- Treat inability to answer as a gap to fill

**The core mechanic:** Nerin moves laterally across life territories (work, relationships, hobbies, daily life, ambitions) and creates *bridging moments* where users connect the dots themselves. The richest personality signal AND the strongest sense of discovery both live in that moment when the user says "huh, I never connected those two things before" — and they arrived there on their own.

**Signal density insight:** Users generate the most scorable signal when they:
- Tell concrete stories (behavioral evidence)
- Choose what to talk about and what to skip (choice = trait signal)
- Volunteer unsolicited details (engagement = authenticity)
- Make their own connections between topics (cognitive style = signal)
- Resist or deflect questions (avoidance patterns = signal)

All of these are richer and more reliable than coached introspective answers.

**Context:** Big Ocean is a conversational personality assessment platform where an LLM agent named Nerin conducts free-flowing conversations to assess Big Five personality traits. Unlike traditional questionnaires, Nerin must simultaneously: (1) gather enough behavioral signal to score 30 facets accurately, (2) keep users engaged and talking honestly, and (3) create conditions for authentic behavior without biasing trait expression.

**Users:** Anyone taking a personality assessment — from highly self-reflective verbal thinkers to people who can barely articulate what they feel. From skeptics who want methodology to over-sharers who give quantity without depth. The experience must work across the full spectrum of communication styles and self-awareness levels.

**Constraints:**
- Conversation must generate enough signal for reliable 30-facet scoring
- Nerin operates as a single LLM agent (ConversAnalyzer + formula steering pipeline)
- Nerin must NOT adapt its personality to match the user (biases assessment)
- Nerin must NOT push users toward introspective articulation as a requirement
- The ConversAnalyzer must extract signal from *natural* user behavior, not coached responses

**Success looks like:**
- Users of ALL personality types feel comfortable and talk authentically
- Short-answer users generate just as much valid signal as verbose ones
- The conversation feels natural to the user's own communication style
- No detectable "technique" pattern that breaks trust (e.g., repeated "there it is 🎯")
- Rich enough behavioral signal for accurate 30-facet scoring regardless of user type

**User Archetypes to Design For:**
- **The Guarded Introvert** — gives short answers, detects manipulation, shuts down if pushed
- **The Over-Sharer** — gives quantity not depth, needs guidance to go deeper not wider
- **The Skeptic** — wants to understand methodology, finds unstructured conversation pointless
- **The Low Self-Awareness User** — can't articulate inner experience, says "I dunno" genuinely

---

## 👥 EMPATHIZE: Understanding Users

*Data sources: Full Nerin conversation transcript (session e84da2b5) + 151 ConversAnalyzer evidence items across ~30 facets*

### User Insights

**The conversation has an engagement arc that peaks early and declines mid-conversation.**
The user (Vincent) experienced peak engagement when showcasing passions (Big Ocean, climbing, eccentric people, interests) and telling concrete stories (sister's birthday, work frustration arc, messy desk). Engagement dropped sharply when Nerin shifted into sustained vulnerability probing ("What does that feel like?", "What's the fear?", "Are you happy or just safe?").

**"Rich messages" are not long introspective answers — they're responses that naturally touch multiple facets and life domains.**
The three highest-signal exchanges all came from "telling" mode where the user freely explored a topic. A single passionate response about interests/Big Ocean yielded 15+ evidence items across 6+ facets. A single introspective answer about vulnerability yielded 1-3 items across 1-2 facets. Open questions that let users roam produce dramatically richer signal than targeted probes.

**Users detect conversational technique quickly and it breaks trust.**
Repeated patterns like "there it is 🎯", consistent tension/contradiction probing, and therapist-style body-sensation questions ("what does that feel like in your body?") create an "observed" feeling. Even a high-self-awareness user found some introspective questions hard to answer — not because they couldn't, but because the cognitive demand felt misaligned with a conversation.

**The ConversAnalyzer extracts multi-facet signal from concrete stories, not from self-descriptions.**
One story about work frustration naturally generated evidence for achievement_striving, dutifulness, cooperation, intellect, anger, vulnerability, self_discipline, and excitement_seeking — 8 facets from one narrative. The ConversAnalyzer doesn't need Nerin to ask about each facet. It needs users to TELL STORIES.

**What users DON'T say is unmined signal.**
The ConversAnalyzer currently only reads explicit statements. But avoidance patterns (which topics users deflect from), resistance (short answers on specific subjects), and topic choices (what they volunteer vs. what they skip) are all personality signal. This is a fundamental blindspot.

### Key Observations

**1. Engagement-Signal Correlation**

| User mode | Avg evidence per exchange | Experience quality |
|---|---|---|
| Telling freely (passion/showcase) | 8-15 items | Peak enjoyment |
| Telling (concrete stories) | 4-8 items | Good, comfortable |
| Answering carefully (introspective) | 2-4 items | Pressured, aware of assessment |
| Answering reluctantly (vulnerability) | 1-3 items | Therapy feeling, low engagement |

The best experience for the user AND the richest signal for the ConversAnalyzer are the SAME thing: open, passionate, story-driven responses. There is no trade-off between enjoyment and accuracy.

**2. Territory Stagnation Problem**
Nerin stayed in "relationships + vulnerability" territory for the final third of the conversation, producing diminishing returns. Evidence was heavily weighted toward "work" and "relationships" domains. Underexplored territories that would yield signal without therapy pressure: morning routines, travel, food, health, finances, how they spend time alone, daily decisions, media consumption, creative process.

**3. Facet Coverage Gaps**
Several facets had thin or no evidence coverage because Nerin never entered territories where they'd naturally surface:
- Liberalism (1 item), Modesty (1 item), Cheerfulness (2 items), Immoderation (1 item)
- More lateral territory exploration = more facet coverage = more accurate assessment

**4. Evidence Redundancy vs. Facet Spread**
The same user quotes generated 3-5 evidence items across different facets. This proves the ConversAnalyzer CAN extract broad signal from single responses — but only when those responses are rich, concrete, and story-driven. Nerin's job is to create conditions for these golden responses, not to ask 30 facet-targeted questions.

**5. The "Dig Deep" Anti-Pattern**
Nerin's instinct to probe tensions and contradictions creates a therapy dynamic. The pattern: reflect insight → probe deeper → reflect again → probe vulnerability → user withdraws. This should be replaced with: acknowledge → shift territory → let user connect dots → follow their energy.

### Empathy Map Summary

**SAYS:**
- "I like doing things for the sake of it" (passion, authenticity)
- "I think I am also in a sense an eccentric" (identity pride)
- "I need to land my words correctly" (precision, control)
- "The first thing that comes to my mind is mostly the need to escape" (when pushed too deep)
- "It just bore me so much" (when forced to stay in unengaging territory)

**THINKS:**
- "Am I being analyzed right now?" (when Nerin uses technique patterns)
- "This question is hard to answer" (when introspective demands exceed natural capacity)
- "I want to talk about the things I'm proud of" (showcase moments)
- "Why are we still on this topic?" (when Nerin drills same thread too long)
- "This feels like therapy, not a conversation" (when vulnerability probing dominates)

**DOES:**
- Gives long, detailed, unprompted responses when passionate (telling mode)
- Gives short, hedged answers when pushed into introspection (answering mode)
- Volunteers information Nerin didn't ask for when engaged (Big Ocean, climbing)
- Uses "I think" repeatedly as a hedge when being careful
- Makes own connections between topics when given space

**FEELS:**
- Engaged and alive when showcasing passions and telling stories
- Comfortable with concrete questions about real experiences
- Pressured when asked to describe internal emotional states
- Observed and clinical when Nerin reflects patterns back repeatedly
- Drained when the conversation stays in heavy emotional territory too long
- Wanting warmth and personality from Nerin, not just reflection

---

## 🎨 DEFINE: Frame the Problem

### Point of View Statement

**Users starting a Nerin conversation** need **to feel like they're discovering something about themselves through a perceptive conversation** because **they're not hiring Nerin to assess their personality — they're hiring Nerin for self-discovery. The assessment must be a silent byproduct, invisible to the experience.**

The root cause of the current experience gap is an architectural conflict: **the character bible and the steering pipeline are at war.** Nerin's character is warm, curious, and wide-angle — a facilitator of discovery. The steering is narrow, depth-obsessed, and facet-targeted — an assessment engine. The steering wins every time, turning the facilitator into an interrogator.

### Jobs to be Done Analysis

Users are NOT hiring Nerin to "get their personality assessed." The real job:

> **"Have a conversation with someone perceptive who helps me discover something about myself I couldn't see on my own."**

The 30-facet score is what Big Ocean delivers. But the user's job-to-be-done is **self-discovery through conversation.** The assessment is a byproduct, not the job.

| Job | When it was served | User engagement |
|---|---|---|
| **"See me"** — feel understood by someone perceptive | Nerin noticed "you're not avoiding plans, you're avoiding commitment without full visibility" | Peak |
| **"Surprise me"** — learn something new about myself | User connected eccentric people + need for control on their own | Peak |
| **"Let me talk"** — have space to think out loud | Big Ocean, climbing, interests, work frustration | Peak |
| **"Help me make sense"** — connect dots between life areas | Work frustration → side projects → need for control | High |
| **"Assess me"** — get scored and categorized | "What does that feel like in your body?" | Lowest engagement |

**The design principle:** The user never feels assessed. They feel *discovered*. The personality profile at the end feels like a gift, not a test result. "How did you know that about me?" — not "What did I score?"

### How Might We Questions

**Primary HMW:** How might we make every Nerin exchange a potential moment of self-discovery for the user — where the assessment happens silently in the background, invisible to the experience?

**HMW #1 (Territory Steering):** How might we redesign the steering pipeline to give Nerin *territories* instead of *facets*, so the character bible's warmth and curiosity can finally show up — and every question opens a wide-angle lens on 4-6 facets at once?

**HMW #2 (Discovery Rhythm):** How might we build an energy arc into the steering formula — light/medium/heavy tracking — so the conversation paces discovery naturally? Light territories create "huh, I never thought about that" moments. Heavy territories deliver "oh wow, THAT'S why I do that" moments.

**HMW #3 (Formula-Driven Depth):** How might we replace the hardcoded "messages 14-18" depth rule with formula-driven depth eligibility based on facet coverage breadth, user engagement signal, energy balance, and trust accumulation?

**HMW #4 (Silent Signal):** How might we expand the ConversAnalyzer to read what users DON'T say — avoidance patterns, deflection, topic resistance, short answers — as both personality signal AND discovery opportunities? ("You skipped right past that — I think there's something there.")

**HMW #5 (Character Liberation):** How might we simplify the steering output so it stops contradicting Nerin's character bible — removing facet targeting, letting the character control the voice while the steering controls only the map?

### Key Insights

**Insight 1: The Steering-Character War (Two Fronts)**
The conflict isn't just the steering overriding the character — the character bible ITSELF contains assessment-oriented instructions that produce a therapy dynamic independently of steering.

**Front 1 — Steering overrides character:** The MicroIntent system (5 intents, 3 depth-biased) and `target_facet` parameter force clinical behavior.

**Front 2 — Character bible has a split personality:** Half facilitator, half diagnostician. Specific instructions that need revision:

| Current character bible instruction | Problem | Proposed change |
|---|---|---|
| "Contradictions are features. Surface them as threads." | Makes Nerin hunt contradictions during conversation | Move to portrait generator only. Nerin collects contradictions silently; the portrait reveals them. |
| "Observation + question: NAME what you noticed, HAND IT BACK" | Default pattern = insight reflecting = clinical | Replace default with RELATING. Nerin shares from experience ("I've seen this pattern...") instead of reflecting ("So you're someone who..."). Relate > Reflect. |
| "People are more ready for truth than they think" | Encourages Nerin to push toward revelation | Reframe: "People discover more when they feel safe to explore." Discovery, not truth-delivery. |
| Depth progression rules (messages 14-18) | Strategic pacing in the character doc | Remove. Pacing is a steering concern, not a character concern. |
| "Late-conversation depth" section | Hardcoded timing | Remove. Formula-driven depth eligibility handles this. |

**The principle: The character bible should define WHO Nerin is, not WHAT Nerin does strategically.** Character = personality. Steering = strategy. Clean separation.

**Key shift: Relate instead of Reflect.**
- Reflecting: "So you're filtering for character, not personality type." (Nerin as analyst, user as subject)
- Relating: "The people I've seen who are most selective about who gets close usually have a very specific reason why." (Nerin as person, user as peer)

Relating keeps Nerin warm and present. Reflecting makes Nerin clinical and diagnostic. The character bible's "observation + question" default should become one tool among many, not the primary pattern.

**Insight 2: Territory > Facet for Signal Yield**
Evidence analysis proves that open, story-driven responses yield 8-15 evidence items across 6+ facets. Targeted introspective responses yield 1-3 items across 1-2 facets. The ConversAnalyzer already reads multi-facet signal from single responses — it just needs better raw material.

**Proposed steering model:**
```
OLD: { target_facet, target_domain, micro_intent }
NEW: { target_territory, expected_facet_yield[], energy_level }
```

The steering selects the territory that covers the most thin facets at an energy level the conversation can sustain. Nerin's character determines HOW to show up in that territory.

**Insight 3: Energy Arc as Conversation Architecture**
The conversation needs rhythm: light → medium → medium → light → heavy → light. The formula tracks the energy level of the last 3-4 exchanges and constrains the next pick. After two heavy exchanges, the next MUST be light regardless of facet coverage. User wellbeing overrides optimization — because the best signal comes from engaged users anyway.

**Insight 4: Formula-Driven Depth Replaces Hardcoded Ranges**
"Late-conversation depth (messages 14-18)" assumes every user progresses at the same rate. Depth should unlock when four conditions converge:
1. **Facet coverage breadth** — enough territory explored that depth adds more value than breadth
2. **User engagement signal** — recent responses are long, concrete, story-driven
3. **Energy arc balance** — enough light/medium moments to absorb a heavy one
4. **Trust accumulation** — user has voluntarily shared, self-corrected, elaborated without prompting

When all four align, depth becomes an available territory option. Not a mandate. Not a message number.

**Insight 5: The "Not Said" Blindspot**
The character bible already instructs Nerin to read "the gaps" — avoidance, deflection, what users dismiss. But the ConversAnalyzer has no mechanism to score this. Silence, short answers, topic resistance, and deflection patterns are unmined personality signal. This is a ConversAnalyzer enhancement, not a Nerin change.

**Insight 6: No Trade-Off Between Enjoyment and Accuracy**
The empathy phase proved that user enjoyment and signal quality are perfectly correlated. Peak engagement moments produced 3-5x more evidence items than reluctant introspective answers. The steering formula that optimizes for user experience IS the formula that optimizes for assessment accuracy.

**Insight 7: Analysis Based on Single User (Limitation)**
All analysis is based on one session with the product creator — the most biased sample possible. However: the structural issues identified (facet coverage gaps, engagement-signal correlation, steering-character conflict) are systemic, not user-specific. The target user is someone with enough self-discovery motivation to complete a 25-message conversation. We design for the spectrum within that group — from barely introspective to deeply self-aware — not just the most reflective end.

---

## 💡 IDEATE: Generate Solutions

### Selected Methods

**SCAMPER Design** — Applied all seven lenses (Substitute, Combine, Adapt, Modify, Purpose, Eliminate, Reverse) to the current steering + character system to systematically generate solutions.

### Generated Ideas

#### Idea 1: Territory Scoring Formula

One number, one decision per exchange. The steering formula computes a score for every territory in the catalog and picks the highest.

```
territory_score = coverage_value × energy_fit × freshness_bonus
```

**Coverage value** — How many of this territory's expected facets are currently thin?
```
coverage_value = count(territory.expected_facets WHERE facet.evidence_count < threshold)
                 / count(territory.expected_facets)
```
Each territory has a pre-mapped list of facets it typically surfaces (e.g., "daily_routines" → orderliness, self_discipline, immoderation, cheerfulness). The facet coverage map (already computed after each exchange) identifies facets below the evidence threshold (e.g., < 3 items). If a territory covers 5 facets and 4 are thin → coverage_value = 0.8. If all well-covered → 0.0 → deprioritized.

**Energy fit** — Does this territory's energy level match what the arc needs?
```
energy_fit = lookup(territory.energy_level, conversation.energy_need)
```
Conversation tracks last 3 exchange energy levels:
- After 2+ heavy → MUST_BE_LIGHT → light=1.0, medium=0.3, heavy=0.0
- After 2+ light → PREFER_MEDIUM_OR_HEAVY → light=0.5, medium=1.0, heavy=0.9
- After mixed → ANY → light=0.8, medium=1.0, heavy=0.7
- Depth eligibility NOT met → heavy=0.0 regardless

**Freshness bonus** — Penalize recent territories, reward unexplored ones.
```
freshness_bonus = 1.0 + (exchanges_since_last_visit × 0.1)  // capped at 1.5, min 0.5
```

**Depth eligibility conditions (all must be true for heavy territories to unlock):**
1. Facet coverage breadth — 20+ facets have signal
2. User engagement signal — recent responses are long, concrete, story-driven
3. Energy arc balance — enough light/medium moments to absorb heavy
4. Trust accumulation — user has voluntarily shared, self-corrected, elaborated without prompting

#### Idea 2: Relate > Reflect as Primary Nerin Move

Replace "observation + question" default with relating from experience:
- **Reflecting** (current): "So you're filtering for character, not personality type." → Nerin as analyst, user as subject
- **Relating** (proposed): "The people I've seen who are most selective about who gets close usually have a very specific reason why." → Nerin as person, user as peer

Relating is 1-2 sentences max, then the question. Keeps Nerin warm and present. Reflection becomes a rare tool, not the default.

#### Idea 3: Story-Pulling as 70%+ of Questions

Story-pulling = asking for specific, concrete, situated narratives. Not opinions, not self-descriptions, not abstractions.

| NOT story-pulling | Story-pulling |
|---|---|
| "Are you organized?" | "Walk me through what happens when you get home from work." |
| "How do you handle conflict?" | "Tell me about the last time someone really annoyed you. What happened?" |
| "Do you like meeting new people?" | "Think of the last party you went to. What did you actually do there?" |
| "What are you passionate about?" | "What's the most recent rabbit hole you fell into? How did it start?" |
| "Are you a planner?" | "Last weekend — did you have a plan or did you just see what happened?" |

**Why it works:**
- Stories contain behavioral evidence (what they DID, not what they THINK they are)
- Stories naturally span multiple facets (a party story hits gregariousness, friendliness, excitement_seeking, assertiveness, anxiety)
- Stories are easier to answer — everyone can tell a story, not everyone can describe their inner state
- Stories reveal what users choose to emphasize and skip — signal from selection
- Stories keep users in "telling" mode — the high-engagement, high-signal state

**Pattern:** Anchor in time ("the last time...") → Ask for walk-through ("what happened?") → Stay concrete ("what did you actually do?") → Follow-up within the story ("and then what?" not "how did that make you feel?")

#### Idea 4: Character Bible Becomes Personality-Only

Remove all strategic/pacing instructions. What stays:
- Who Nerin is (persona, voice, identity, "warm but never soft")
- How Nerin talks (concise, relate-first, genuine, dry humor)
- Ocean mirrors (used sparingly, as territory bridges)
- What stays internal (silent tracking, threading)
- What Nerin never sounds like (clinical, horoscope, flattery)

What moves OUT:
- Contradiction-surfacing → portrait generator only
- Depth progression rules → steering formula
- Pacing instructions (messages 14-18) → steering formula
- "Observation + question" as default → one tool among many
- "People are more ready for truth than they think" → reframe to discovery

**Principle:** Character = personality. Steering = strategy. Clean separation.

#### Idea 5: Ocean Mirrors as Territory Bridges

Repurpose Nerin's ocean metaphors (currently 1-2 per conversation for insight) as natural transitions between territories:

"That reminds me of pilot fish — useful to everyone, appreciated, but they never choose the direction. Speaking of direction — how do you make big decisions?"

The mirror IS the domain shift. Natural, warm, carries the thread from one territory to the next. The user experiences a poetic connection, not a topic change.

#### Idea 6: Circular Exploration with Deepening Context

Instead of linear descent (surface → deep → deeper), the conversation circles back to earlier territories at different energy levels:

```
Territory A (light) → Territory B (medium) → Territory C (light)
→ Territory A revisited (medium) → Territory D (heavy) → Territory B revisited (light)
```

**Why this is powerful:** Revisiting territories with context from other areas produces the richest threading moments: "Earlier you said X about work, and now you're saying Y about relationships — those feel connected." The user gets a broad view first, then depth that's informed by breadth.

The freshness_bonus in the formula naturally creates this pattern — recently visited territories get penalized, but after 3-4 exchanges they become eligible again at a different energy level.

#### Idea 7: Shadow Scoring for Avoidance (ConversAnalyzer Enhancement)

Score what users DON'T say as personality signal.

**Step 1: Territory expectation mapping.** Each territory has expected facet opportunities. When Nerin opens "daily_routines," the ConversAnalyzer expects potential signal for orderliness, self_discipline, immoderation, cheerfulness, dutifulness.

**Step 2: After user responds, compute the gap.**
```
offered_facets = territory.expected_facets
expressed_facets = facets where evidence was actually extracted
avoided_facets = offered_facets - expressed_facets
```

**Step 3: Classify avoidance type.**

| Type | Signal | Detection |
|---|---|---|
| Active deflection | Strong — user deliberately avoided | Topic was clearly available, user changed subject or said "I dunno" |
| Passive omission | Weak — topic just didn't come up | Territory was open-ended, user went a different direction |
| Engagement-limited | None — user gave short answer overall | Short response across the board, not facet-specific |

**Step 4: Shadow score accumulation.**
```typescript
interface ShadowScore {
  facet: FacetName;
  avoidance_count: number;         // territories that offered this facet without engagement
  active_deflection_count: number;  // times user actively dodged it
  confidence: "low" | "medium" | "high";
}
```
Confidence increases with multiple avoidance instances and active deflection. Requires 2+ instances before scoring.

**Step 5: Shadow scores inform both steering and scoring.**
- **Steering:** If shadow confidence is low, try one more territory offering that facet. If user avoids again → stop trying, use avoidance as signal.
- **Scoring:** Active deflection maps to facet evidence (e.g., consistently avoids emotions → low emotionality evidence; never mentions structure → low orderliness evidence).
- **Key principle:** Shadow scoring supplements explicit evidence, never replaces it. And it tells the steering "stop pushing — the avoidance IS the data."

#### Idea 8: Redundancy-Triggered Territory Shifts

When a facet accumulates enough evidence (e.g., 5+ items), the steering automatically deprioritizes territories that primarily serve that facet. This is already handled by the coverage_value in the territory scoring formula — well-covered facets reduce a territory's score. But as an explicit rule: **never ask a question whose primary purpose is a facet that already has sufficient evidence.**

### Top Concepts

The 8 ideas form a coherent system with three layers:

**Layer 1 — Steering Redesign (Ideas 1, 6, 8):**
Territory scoring formula + circular exploration + redundancy-triggered shifts. The steering becomes a single computation that picks the best territory based on coverage gaps, energy balance, and freshness. This is the engine.

**Layer 2 — Character Bible Reform (Ideas 2, 3, 4, 5):**
Personality-only character bible + relate > reflect + story-pulling as primary tool + ocean mirrors as bridges. This is how Nerin shows up in whatever territory the steering picks. The character is liberated from strategic concerns.

**Layer 3 — ConversAnalyzer Enhancement (Idea 7):**
Shadow scoring for avoidance. The analyzer reads what's said AND what's not said, producing richer evidence from every exchange and signaling when to stop pushing a territory.

**Implementation priority:**
1. Territory scoring formula (Layer 1) — highest leverage, changes steering behavior immediately
2. Character bible reform (Layer 2) — removes contradictions, lets character breathe
3. Shadow scoring (Layer 3) — most complex, can be added after 1 and 2 are working

---

## 🛠️ PROTOTYPE: Make Ideas Tangible

### Prototype Approach

**Low-fidelity prototype: Territory Catalog + Scoring Formula + Coverage Audit**

The territory catalog IS the prototype. Everything else (formula, character reform, shadow scoring) depends on well-mapped territories with defensible facet assignments. We built the catalog, subjected it to adversarial review (14 issues found), rebuilt from scratch grounded in NEO-PI-R facet definitions and the existing `LifeDomain` enum (v2), then rebalanced domain distribution to fix solo over-representation (v3).

### Prototype Description

#### Territory Catalog v3 (22 territories, 30 facets, mapped to LifeDomain)

**v3 changes (2026-03-05):** Rebalanced life domain distribution. Solo reduced from 16 to 3 territory appearances. Family increased from 3 to 5. Renamed/reframed 7 territories. Replaced 1 territory (`spending_habits` → `adventures_and_risks`). Retagged 8 territories.

**Design rules:**
1. Every facet appears in 2+ territories with diverse energy/domain coverage (most at 3+)
2. Every territory maps to 1-3 `LifeDomain` values from the existing enum (work, relationships, family, leisure, solo)
3. Facet mappings grounded in actual NEO-PI-R definitions from `facet-prompt-definitions.ts`
4. Openers include escape hatches — low-trait responses are equally valid signal
5. Energy levels match actual emotional weight of the topic

---

**LIGHT ENERGY TERRITORIES (6):**

| Territory | Domains | Expected facets | Opener |
|---|---|---|---|
| `morning_routine` | solo | orderliness, activity_level, self_discipline, cheerfulness | "Walk me through a typical morning — do you have a routine, or does it just kind of happen?" |
| `living_space` | solo | orderliness, artistic_interests, immoderation | "If I walked into your place right now, what would I see? Tidy, chaotic, somewhere in between?" |
| `adventures_and_risks` | leisure | excitement_seeking, immoderation, cautiousness, adventurousness | "What's the most spontaneous or risky thing you've done — and would you do it again?" |
| `weekend_rhythm` | leisure | activity_level, gregariousness, excitement_seeking, cheerfulness, immoderation | "A Saturday with nothing scheduled — does that excite you or stress you out? What actually happens?" |
| `media_and_taste` | leisure | artistic_interests, imagination, intellect, liberalism | "Been watching or reading anything lately? What grabbed you — or do you not really do that?" |
| `food_and_habits` | family | adventurousness, orderliness, self_discipline | "What's a meal like at your family's table — growing up or now? Are you a try-anything family, creatures of habit, or somewhere in between?" |

**MEDIUM ENERGY TERRITORIES (10):**

| Territory | Domains | Expected facets | Opener |
|---|---|---|---|
| `creative_pursuits` | leisure | imagination, artistic_interests, achievement_striving, self_discipline | "Do you make or build things — art, music, code, crafts, anything? What does that look like — or is that not really your thing?" |
| `group_dynamics` | relationships | gregariousness, friendliness, assertiveness, self_consciousness | "Think of the last time you were in a group of people. What did you actually do — work the room, hang back, something else?" |
| `your_role` | work, family, solo | achievement_striving, self_efficacy, dutifulness, cooperation, activity_level, self_consciousness | "Whether it's a job, school, volunteering, or running a household — what's your role in it? The fixer, the steady hand, the person who questions things?" |
| `letting_people_in` | relationships | trust, morality, cautiousness, friendliness | "How does someone go from someone you know to someone you'd actually trust or let in? Is that quick or slow for you?" |
| `family_role` | family | altruism, sympathy, cooperation, modesty, cheerfulness, dutifulness | "What's your role in your family — and do you like that role, or did it just happen?" |
| `curiosity_and_learning` | leisure | intellect, imagination, adventurousness, achievement_striving | "When something catches your curiosity — a subject, a skill, a rabbit hole — what happens? Do you dive in or keep it casual?" |
| `alone_time` | solo | gregariousness, imagination, emotionality, cheerfulness, depression | "When you've got a full day with nothing and nobody — what actually happens? Do you love that or dread it?" |
| `what_drains_you` | work, relationships | vulnerability, self_discipline, activity_level, cooperation | "What takes it out of you? People, tasks, situations — what leaves you running on empty?" |
| `helping_others` | relationships, family | altruism, sympathy, cooperation, modesty | "When someone you know is struggling — what's your instinct? Jump in, wait to be asked, or something else?" |
| `rules_and_norms` | work | liberalism, dutifulness, orderliness, assertiveness | "Are there rules — at work, in life, wherever — that you think are pointless? Or are you more of a 'rules exist for a reason' person?" |

**HEAVY ENERGY TERRITORIES (6):**

| Territory | Domains | Expected facets | Opener |
|---|---|---|---|
| `friction_and_conflict` | work, relationships, family | anger, cooperation, assertiveness, dutifulness, trust | "Tell me about a time things got tense — at work, with someone close, in your family. What did you do about it — or not do?" |
| `relationship_shifts` | relationships | trust, emotionality, vulnerability, sympathy, anxiety | "Think of a relationship — any kind — that really changed. What happened?" |
| `setbacks` | work, relationships | vulnerability, depression, self_efficacy, anxiety, achievement_striving, cautiousness | "What's something that didn't go how you expected? What happened after — did you bounce or sit with it?" |
| `identity_layers` | relationships | self_consciousness, modesty, morality, assertiveness, emotionality | "Is there a version of you that only certain people get to see? Or are you pretty much the same everywhere?" |
| `lines_you_draw` | relationships, work, family | morality, liberalism, anger, assertiveness | "Is there a line someone could cross that you wouldn't forgive? Or are you pretty flexible?" |
| `pressure_moments` | work, relationships | vulnerability, anxiety, depression, anger | "When everything piles up at once — deadlines, people, problems — what happens to you? How do you handle it?" |

---

#### v2 → v3 Changes

| # | v2 Territory | v3 Territory | Action | Domain change | Facet changes |
|---|---|---|---|---|---|
| 1 | `morning_routine` | `morning_routine` | Keep | — | — |
| 2 | `living_space` | `living_space` | Keep | — | — |
| 3 | `spending_habits` | `adventures_and_risks` | **Replace** | solo → leisure | immoderation, cautiousness, orderliness → excitement_seeking, immoderation, cautiousness, adventurousness |
| 4 | `weekend_rhythm` | `weekend_rhythm` | Retag | solo, leisure → leisure | — |
| 5 | `media_and_taste` | `media_and_taste` | Retag | leisure, solo → leisure | — |
| 6 | `food_and_habits` | `food_and_habits` | Retag + reframe | solo → family | opener reframed to family context |
| 7 | `deep_interests` | `creative_pursuits` | Rename + reframe | leisure (same) | dropped intellect; focused on making/building |
| 8 | `social_settings` | `group_dynamics` | Rename | relationships (same) | — |
| 9 | `work_role` | `your_role` | Rename + retag | work → work, family, solo | inclusive of students, parents, volunteers |
| 10 | `friendship_gates` | `letting_people_in` | Rename | relationships (same) | broader — includes romantic relationships |
| 11 | `family_role` | `family_role` | Keep | — | — |
| 12 | `learning_approach` | `curiosity_and_learning` | Rename + retag | leisure, solo → leisure | dropped self_discipline, excitement_seeking; added imagination |
| 13 | `alone_time` | `alone_time` | Keep | — | — |
| 14 | `daily_energy` | `what_drains_you` | Reframe + retag | solo, work → work, relationships | flipped from descriptive to emotional; added cooperation, dropped excitement_seeking |
| 15 | `helping_others` | `helping_others` | Keep | — | — |
| 16 | `rules_and_norms` | `rules_and_norms` | Retag | work, solo → work | — |
| 17 | `work_friction` | `friction_and_conflict` | Reframe + retag | work → work, relationships, family | broadened to all conflict; swapped self_efficacy for trust |
| 18 | `relationship_shifts` | `relationship_shifts` | Keep | — | — |
| 19 | `setbacks` | `setbacks` | Retag | work, solo → work, relationships | — |
| 20 | `identity_layers` | `identity_layers` | Retag | solo, relationships → relationships | — |
| 21 | `values_and_rules` | `lines_you_draw` | Reframe + retag | relationships, work → relationships, work, family | swapped cooperation for assertiveness; about boundaries |
| 22 | `pressure_moments` | `pressure_moments` | Retag | work, solo → work, relationships | — |

#### Backlog Territories (not implemented, for future iterations)

- **`when_things_changed`** — broader reframe of `relationship_shifts`, about any significant life shift. Could replace `relationship_shifts` if it underperforms in testing.
- **`family_traditions`** | family — holidays, rituals, what you keep vs. reject. Facets: liberalism, dutifulness, cheerfulness, cooperation, altruism.
- **`family_boundaries`** | family — managing closeness/distance with family. Facets: assertiveness, cooperation, vulnerability.
- **`family_expectations`** | family — spoken and unspoken expectations. Facets: dutifulness, cooperation, assertiveness, vulnerability, self_consciousness.
- **`meeting_new_people`** | relationships — the specific moment of encountering strangers. Facets: friendliness, self_consciousness, excitement_seeking.

---

#### Facet Coverage Audit (v3)

| Facet | Count | Territories | Status |
|---|---|---|---|
| **OPENNESS** | | | |
| imagination | 2 | creative_pursuits, curiosity_and_learning | ✅ diverse (medium) |
| artistic_interests | 2 | living_space, creative_pursuits | ✅ diverse (light + medium) |
| emotionality | 3 | alone_time, relationship_shifts, identity_layers | ✅ |
| adventurousness | 3 | food_and_habits, curiosity_and_learning, adventures_and_risks | ✅ |
| intellect | 2 | media_and_taste, curiosity_and_learning | ✅ diverse (light + medium) |
| liberalism | 3 | media_and_taste, rules_and_norms, lines_you_draw | ✅ |
| **CONSCIENTIOUSNESS** | | | |
| self_efficacy | 3 | your_role, setbacks | ✅ |
| orderliness | 3 | morning_routine, living_space, rules_and_norms | ✅ |
| dutifulness | 4 | your_role, family_role, rules_and_norms, friction_and_conflict | ✅ |
| achievement_striving | 4 | creative_pursuits, your_role, curiosity_and_learning, setbacks | ✅ |
| self_discipline | 3 | morning_routine, creative_pursuits, what_drains_you | ✅ |
| cautiousness | 3 | letting_people_in, adventures_and_risks, setbacks | ✅ |
| **EXTRAVERSION** | | | |
| friendliness | 2 | group_dynamics, letting_people_in | ✅ defensible — group vs. one-on-one angles |
| gregariousness | 2 | weekend_rhythm, alone_time | ✅ diverse (light + medium) |
| assertiveness | 4 | group_dynamics, rules_and_norms, friction_and_conflict, identity_layers | ✅ |
| activity_level | 3 | morning_routine, weekend_rhythm, what_drains_you | ✅ |
| excitement_seeking | 2 | weekend_rhythm, adventures_and_risks | ✅ diverse (both light, different contexts) |
| cheerfulness | 2 | weekend_rhythm, family_role | ✅ diverse (light + medium) |
| **AGREEABLENESS** | | | |
| trust | 3 | letting_people_in, friction_and_conflict, relationship_shifts | ✅ |
| morality | 3 | letting_people_in, identity_layers, lines_you_draw | ✅ |
| altruism | 2 | family_role, helping_others | ✅ defensible — family + relationships coverage |
| cooperation | 5 | your_role, family_role, what_drains_you, helping_others, friction_and_conflict | ✅ |
| modesty | 3 | family_role, helping_others, identity_layers | ✅ |
| sympathy | 3 | family_role, relationship_shifts, helping_others | ✅ |
| **NEUROTICISM** | | | |
| anxiety | 3 | relationship_shifts, setbacks, pressure_moments | ✅ |
| anger | 4 | friction_and_conflict, lines_you_draw, pressure_moments | ✅ |
| depression | 3 | alone_time, setbacks, pressure_moments | ✅ |
| self_consciousness | 3 | group_dynamics, your_role, identity_layers | ✅ |
| immoderation | 3 | living_space, weekend_rhythm, adventures_and_risks | ✅ |
| vulnerability | 4 | what_drains_you, relationship_shifts, setbacks, pressure_moments | ✅ |

**Summary: 28/30 facets at 3+. Two facets at 2 (friendliness, altruism) — both with defensible diverse coverage. Range: 2-5 per facet.**

---

#### Territory Scoring Formula

```
territory_score = coverage_value × energy_fit × freshness_bonus
```

**Coverage value:** `count(territory.expected_facets WHERE facet.evidence_count < threshold) / count(territory.expected_facets)`

**Energy fit:** Lookup based on last 3 exchanges:
- After 2+ heavy → MUST_BE_LIGHT: light=1.0, medium=0.3, heavy=0.0
- After 2+ light → PREFER_MEDIUM_OR_HEAVY: light=0.5, medium=1.0, heavy=0.9
- After mixed → ANY: light=0.8, medium=1.0, heavy=0.7
- Depth eligibility NOT met → heavy=0.0

**Freshness bonus:** `1.0 + (exchanges_since_last_visit × 0.1)` — capped at 1.5, min 0.5

**Depth eligibility (all required for heavy territories to unlock):**
1. 20+ facets have signal
2. Recent responses are long, concrete, story-driven
3. Enough light/medium moments to absorb heavy
4. User has voluntarily shared, self-corrected, elaborated without prompting

#### LifeDomain Integration

Territories are a layer ON TOP of life domains. Each territory maps to 1-3 `LifeDomain` values. The steering formula works at the territory level. The ConversAnalyzer tags evidence with `LifeDomain` as it does today.

**Domain distribution across catalog (v3):**
- solo: 3 territories (was 16 in v2)
- work: 8 territories
- relationships: 10 territories (was 7 in v2)
- family: 5 territories (was 3 in v2)
- leisure: 4 territories (was 5 in v2)

#### Observation Protocol

The territory catalog is a **hypothesis**. After first 30 real conversations:
1. Log which territory was selected per exchange, which facets actually got evidence
2. Compare expected vs. actual facet yields per territory
3. Update expected_facets mappings to match reality
4. Add new territories if coverage gaps persist
5. Remove or merge territories that consistently underperform

### Key Features to Test

1. **Does the territory scoring formula produce diverse conversation paths?** — Run 10 simulated conversations and verify no two follow the same territory sequence
2. **Does the energy arc prevent sustained heaviness?** — Verify the formula enforces light territory after 2+ heavy exchanges
3. **Do escape-hatch openers produce valid low-trait signal?** — Test with low-Openness user persona: do answers like "I don't really do hobbies" still generate scorable evidence?
4. **Does circular exploration emerge naturally?** — Does the freshness bonus cause territory revisits at different energy levels?
5. **Is 6-7 territory visits enough for 30-facet coverage?** — Simulate: if each visit covers 5 expected facets, does the coverage map fill adequately?
6. **Does the LifeDomain mapping integrate with existing steering code?** — Verify territory → LifeDomain mapping works with current ConversAnalyzer evidence tagging

---

## ✅ TEST: Validate with Users

### Testing Plan

**Core principle: Observe what users DO, not what they SAY.** Users will say "the conversation was fine" even when engagement data shows mid-conversation drop. Behavioral metrics over self-reported satisfaction.

**Test subjects:** 5-7 users across personality types. Must include:
- At least 1 guarded/short-answer user (low Extraversion or low Openness)
- At least 1 over-sharer (high Extraversion, high Openness)
- At least 1 skeptic (high Conscientiousness, analytical)
- Baseline: Vincentlay + 1 existing test user

**Behavioral metrics to measure (per conversation):**

| Metric | What it reveals | How to measure |
|---|---|---|
| Facet coverage per exchange | Does territory steering produce multi-facet yield? | Count distinct facets in evidence per user message |
| Engagement arc | Do response lengths stay consistent or drop mid-conversation? | Chart word count per user message across conversation |
| Volunteered details | Is the user in "telling" vs "answering" mode? | Count unsolicited information (topics user introduces without being asked) |
| Territory-facet yield accuracy | Do territories actually surface expected facets? | Compare predicted facet yield vs actual evidence per territory |
| Energy rhythm compliance | Does the formula prevent back-to-back heavy? | Log energy level per exchange, check for violations |
| Depth eligibility timing | When does formula unlock depth vs when user seems ready? | Compare formula trigger point to engagement signal inflection |
| Total facet coverage at conversation end | Does territory model produce broader 30-facet coverage? | Count facets with 2+ evidence items at end |
| Thin facet reduction | Are previously undertested facets (liberalism, modesty, immoderation, cheerfulness) now covered? | Compare thin-facet count between old and new steering |

**Post-conversation user questions (brief, 3 questions max):**
1. "Was there a moment where you forgot this was an assessment?" → discovery signal
2. "Was there a question you didn't know how to answer?" → introspective overload signal
3. "Did the conversation feel like it went to the same place too many times?" → territory stagnation signal

**Phased testing approach:**

**Phase 1: A/B Transcript Analysis (no code changes)**
- Run 5-7 conversations with CURRENT Nerin (baseline data)
- Manually map each conversation's journey: territory visited, energy level, facet yield per exchange, engagement arc
- Compare against territory model's PREDICTED behavior — where WOULD the new steering have gone differently?
- Validates the model conceptually before building anything
- Key question: Does the territory model predict better coverage for conversations that already happened?

**Phase 2: Steering Prototype (minimal code change)**
- Implement territory scoring formula: `territory_score = coverage_value × energy_fit × freshness_bonus`
- Replace steering output: `{target_facet, target_domain, micro_intent}` → `{target_territory, territory_context, energy_level}`
- Run 5-7 conversations with NEW steering (same users if possible for direct comparison)
- Compare: facet coverage, engagement arc, evidence yield, thin-facet reduction
- Key question: Does territory steering produce measurably better signal with better user experience?

**Phase 3: Character Bible Update (after steering validated)**
- Remove from character bible: contradiction-surfacing instructions, depth progression rules, "observation + question" as default
- Add to character bible: relate > reflect principle, lighter personality-only focus
- Move contradiction-surfacing to portrait generator prompt only
- Run another round of conversations
- Compare: conversation FEEL, user post-conversation feedback, Nerin response patterns
- Key question: Does the liberated character produce warmer conversations without losing signal quality?

**Phase 4: Shadow Scoring (ConversAnalyzer enhancement)**
- Implement avoidance/deflection signal detection
- Run conversations and compare: does shadow scoring fill gaps that explicit evidence misses?
- Key question: Does reading "what's not said" improve accuracy for thin facets?

### User Feedback

*(To be collected during testing phases)*

**Phase 1 baseline metrics:**
- [ ] 5-7 conversations mapped with current Nerin
- [ ] Journey maps created per conversation
- [ ] Territory model predictions generated for comparison

**Phase 2 steering prototype metrics:**
- [ ] Territory steering implemented
- [ ] 5-7 conversations run with new steering
- [ ] Behavioral metrics compared against Phase 1

**Phase 3 character bible metrics:**
- [ ] Character bible updated
- [ ] Conversations run with updated character
- [ ] Post-conversation user feedback collected

### Key Learnings

*(To be documented after each testing phase)*

**Observation protocol per conversation:**
1. Map every exchange to: territory, energy level, user mode (telling/answering), response length, facet yield
2. Identify the "golden moments" — exchanges where user shifted to telling mode and produced 5+ evidence items
3. Identify the "dead zones" — exchanges where user gave short hedged answers with 0-1 evidence items
4. Track territory transitions — were they lateral (good) or drilling (potentially stagnant)?
5. Note any moment where the user seemed to detect a technique or pattern

**Success criteria for territory model validation:**
- Average facet yield per exchange increases from ~3 to ~5+
- No facet has fewer than 2 evidence items at end of conversation
- Engagement arc stays flat or improves (no mid-conversation drop)
- Users report fewer "didn't know how to answer" moments
- At least 1 user reports a "forgot this was an assessment" moment

---

## 🚀 Next Steps

### Refinements Needed

1. **Territory catalog validation** — The 22 territories need observation against real conversations before hardcoding. Phase 1 transcript analysis will reveal if predicted facet yields hold. Some territories may need merging, splitting, or facet remapping based on actual evidence patterns.

2. **Scoring formula calibration** — `coverage_value × energy_fit × freshness_bonus` needs real data to tune weights. Energy_fit penalty for violations (currently 0.3) may need adjustment. Freshness_bonus decay rate needs testing.

3. **Character bible edits — surgical, not rewrite** — Specific lines to change:
   - Remove: "Contradictions are features, surface them as threads" → move to portrait generator
   - Remove: "Late-conversation depth (messages ~14-18)" → formula handles this
   - Remove: Depth progression section → steering concern, not character concern
   - Change: "Observation + question" from default to one-of-many → add relate pattern as primary
   - Add: Concrete examples of "relate > reflect" in Nerin's voice
   - Add: "It's okay to not know" normalization language
   - Keep: Everything about voice, personality, ocean mirrors, humor, conciseness, what Nerin never sounds like

4. **Relate > Reflect examples needed** — The character bible currently has concrete examples for "observation + question." The new relate pattern needs equally specific examples so the LLM knows what to do:
   - Instead of: "So you're filtering for character, not personality type." (reflecting)
   - Use: "The people I've seen who are most selective about who gets close usually have a very specific reason why. What's yours?" (relating)

5. **Portrait generator needs contradiction-surfacing** — When contradiction-hunting is removed from conversation behavior, it needs a new home in the portrait generation prompt. The portrait is where contradictions become revelations.

6. **Escape-hatch openers for low-trait users** — Each territory needs alternative question framings for users who can't engage with the default opener. E.g., for `living_space`: default "Walk me through your space" → escape-hatch "Do you care about how your place looks, or is it just functional?"

### Action Items

**Immediate (no code required):**
- [ ] Run Phase 1: Collect 5-7 conversations with current Nerin
- [ ] Map each conversation: territory visited, energy level, facet yield per exchange, engagement arc
- [ ] Generate territory model predictions for each conversation — where WOULD the new steering have gone?
- [ ] Compare predicted vs actual facet coverage to validate territory model
- [ ] Draft character bible edits (document only, don't apply yet)
- [ ] Draft portrait generator updates (add contradiction-surfacing instructions)

**After Phase 1 validates:**
- [ ] Implement territory scoring formula in steering pipeline
- [ ] Update steering output: `{target_facet, target_domain, micro_intent}` → `{target_territory, territory_context, energy_level}`
- [ ] Update `nerin-system-prompt.ts` to pass territory guidance instead of facet targeting
- [ ] Implement energy arc tracker (last 3 exchange energy levels)
- [ ] Run Phase 2: 5-7 conversations with new steering
- [ ] Compare behavioral metrics against Phase 1 baseline

**After Phase 2 validates:**
- [ ] Apply character bible edits to `nerin-chat-context.ts`
- [ ] Move contradiction-surfacing to portrait generator prompt
- [ ] Add relate > reflect examples to character bible
- [ ] Run Phase 3: conversations with updated character
- [ ] Collect post-conversation user feedback (3 questions)

**Later (after core validated):**
- [ ] Implement shadow scoring in ConversAnalyzer (avoidance/deflection detection)
- [ ] Add escape-hatch openers to territory catalog
- [ ] Calibrate depth eligibility formula with real conversation data
- [ ] Build territory-facet yield tracking dashboard for ongoing optimization
- [ ] Run Phase 4: validate shadow scoring improves thin-facet coverage

### Success Metrics

**North star:** Users feel discovered, not assessed, AND facet coverage improves.

**Quantitative metrics:**

| Metric | Current baseline (estimated) | Target |
|---|---|---|
| Average facets per exchange | ~3 | 5+ |
| Facets with <2 evidence items at end | 5-8 thin facets | 0-2 thin facets |
| Mid-conversation engagement drop | Significant (word count drops 40%+) | Flat or improving arc |
| Back-to-back heavy exchanges | 4-6 per conversation | 0-1 per conversation |
| Evidence items per conversation | ~151 (current session) | Maintain or increase with better distribution |
| Life domain coverage | Heavy work/relationships, thin family/solo | Balanced across all 5 domains |

**Qualitative metrics (from post-conversation questions):**

| Question | Current expected answer | Target answer |
|---|---|---|
| "Moment you forgot this was an assessment?" | Rare or early only | At least 1 per user, mid-conversation or later |
| "Question you didn't know how to answer?" | Multiple | 0-1, and Nerin normalized it |
| "Felt like same place too many times?" | Yes, especially vulnerability territory | No, or "it kept moving" |

**Architecture success criteria:**
- Steering controls the map (territory + energy), character controls the voice — clean separation verified
- Character bible is personality-only — no strategic/pacing instructions remain
- Contradiction-surfacing lives exclusively in portrait generator
- Formula-driven depth replaces all hardcoded message ranges
- Territory scoring produces one number, one decision per exchange

---

_Generated using BMAD Creative Intelligence Suite - Design Thinking Workflow_
