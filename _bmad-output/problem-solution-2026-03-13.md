# Problem Solving Session: Nerin Ignores Steering Pipeline Territory Instructions

**Date:** 2026-03-13
**Problem Solver:** Vincentlay
**Problem Category:** LLM Agent Compliance / Prompt Engineering

---

## PROBLEM DEFINITION

### Initial Problem Statement

The steering pipeline (ConversAnalyzer extraction → pacing → scorer → territory selection → governor) computes correct territory assignments and observation focuses each turn, but Nerin (the conversational LLM agent) does not follow these instructions. Across two live assessment sessions, Nerin consistently ignored assigned territories, instead locking onto a single emotional thread and pursuing depth regardless of the pipeline's steering signals.

### Refined Problem Statement

**The gap:** The steering pipeline outputs (selected territory, observation focus, entry pressure, intent) are computed correctly but fail to influence Nerin's actual conversational behavior. Nerin treats territory assignments as suggestions it can override in favor of emotional momentum, resulting in:
- Facet coverage gaps (entire trait domains unexplored)
- User energy drain from relentless depth-seeking
- Wasted pipeline computation (scorer/governor outputs ignored)

**What exactly is wrong:** Nerin receives territory instructions but generates responses that belong to different territories entirely. In session `b29bffc5`, 0 of 9 turns showed strong territory compliance. Turns assigned to `friendship-depth` contained zero friendship content. Turns assigned to `opinions-and-values` contained zero opinions/values content.

**The gap between current and desired state:** Currently Nerin operates as a free-form depth-seeking therapist. The desired state is a territory-aware conversational agent that covers ground across life domains while respecting user energy, with natural bridging between territory transitions.

### Problem Context

- The pacing pipeline (Epic 23/27) was specifically built to prevent this — energy tracking, drain ceilings, territory scoring, and governor output all exist to steer Nerin
- Nerin's system prompt receives the governor output (territory, intent, observation focus, entry pressure) as context for each turn
- The problem has been observed in 2 out of 2 live sessions tested — 100% reproduction rate
- The conversation quality *within* the wrong territory is high — Nerin is emotionally resonant and insightful, just not where it's supposed to be
- The pacing system correctly detected territory saturation (comfort-zones after 4 turns) and moved on, but Nerin didn't follow the pivot

### Success Criteria

1. **Territory compliance:** Nerin's closing question should demonstrably target the assigned territory's expected facets and domains (e.g., `friendship-depth` → asks about a friend/relationship, not about self-worth)
2. **Natural bridging:** When territory changes, Nerin should acknowledge the current thread and transition naturally ("That's really interesting about X — I want to come back to that. Let me ask you about something different...")
3. **Energy respect:** Nerin should modulate depth based on the governor's entry pressure and energy target, not always escalate
4. **Coverage progress:** Over a full session, evidence should appear across multiple territories, not cluster in 1-2 emotional threads

---

## DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

| Dimension | IS | IS NOT |
|-----------|-----|--------|
| **What** | Nerin ignores territory assignments and observation focuses | Pipeline computation error (scorer, governor, pacing all correct) |
| **What** | Nerin's closing question targets wrong territory facets | Nerin producing low-quality conversation (quality is high, just misplaced) |
| **Where** | At the system prompt → LLM response boundary | In territory scoring, selection, or governor logic |
| **Where** | In the Tier 4 steering section of the prompt (last ~50 words) | In Tier 1-3 modules (persona, instincts, question types work well) |
| **When** | Every turn, especially after territory changes (turns 6-9 in session `b29bffc5`) | On the very first opener (turn 0 follows territory adequately) |
| **When** | When user shares emotionally rich content that triggers Nerin's depth instincts | When conversation is low-energy or surface-level (untested, but structurally predicted) |
| **Who** | Nerin (Claude Haiku via LangChain) receiving the composed system prompt | ConversAnalyzer (separate LLM call — follows its structured output schema reliably) |
| **Who** | Observed in 2/2 live sessions — 100% reproduction | Isolated to one session or one user style |
| **Pattern** | Nerin locks onto a single emotional thread and pursues it regardless of territory | Random non-compliance (the non-compliance is systematic and predictable) |

**Key pattern from boundaries:** The problem is NOT in computation or LLM capability — it's in how the computed signal is *communicated* to the LLM. ConversAnalyzer (same model family) follows structured instructions reliably because it has structured output schemas. Nerin gets prose suggestions.

### Root Cause Analysis

**Method: Five Whys + Fishbone (multi-factor)**

**Primary Chain — Why doesn't Nerin follow territory?**

1. **Why doesn't Nerin follow the territory assignment?**
   → Because the territory guidance is phrased as a suggestion ("you could explore something like...") with explicit permission to ignore it ("If the person is already in an interesting thread, stay with it").

2. **Why is it phrased as a suggestion?**
   → Because the prompt builder (`prompt-builder.ts:151-153`) was designed to preserve conversational naturalness. The "direct" entry pressure — the *strongest* setting — still says "this is a suggestion, not a script."

3. **Why does the suggestion lose to Nerin's instincts?**
   → Because Tier 1 modules contain unconditional depth-seeking commands ("When someone is opening up, you go deeper" in `conversation-instincts.ts:19`) that have no territory-awareness qualifier. These always-on instincts override the conditional territory suggestion.

4. **Why do Tier 1 instincts take priority?**
   → Because of prompt position bias: ~1,500 words of identity/instincts come first, territory guidance (~50 words) comes last. LLMs weight earlier instructions more heavily. The territory is structurally an afterthought.

5. **Why is there no enforcement mechanism?**
   → Because the system is open-loop. The governor sends a signal, but nothing verifies compliance. There's no post-generation check that Nerin's question actually targets the assigned territory.

**Root Cause:** The steering signal is too weak (suggestive language + last position + small footprint) relative to competing identity signals (imperative language + first position + large footprint), and there is no feedback loop to enforce compliance.

### Contributing Factors

1. **Observation focus defaults to non-instruction:** `relate` (selected 7/9 turns) translates to "Connect naturally... No special observation — be present and genuine." This is a non-instruction that reinforces Nerin's default behavior. The pipeline's most common output tells Nerin to do nothing special.

2. **No territory-specific content in the question modules:** `STORY_PULLING`, `REFLECT`, and `THREADING` (Tier 2) are territory-agnostic. They teach Nerin *how* to ask questions but not *what topic* to ask about. The territory opener is the only topic signal, and it's buried at the bottom.

3. **Emotional momentum in message history:** By turn 5-6, the conversation history contains 3,000+ words of deep identity/vulnerability content. This context creates strong inertia — the LLM naturally continues the dominant theme in the message history, and the system prompt's small territory section can't overcome conversation-level momentum.

4. **No bridging instruction on territory change:** When `transition_type: "territory_change"` occurs, the prompt doesn't tell Nerin "you are switching topics — acknowledge the current thread and pivot." The territory change is invisible to Nerin — it just sees a different territory name with no transition guidance.

5. **Entry pressure never escalates:** In session `b29bffc5`, entry pressure was `direct` on every turn (gap between expectedEnergy and eTarget was always ≤ 0). This means the "angled" and "soft" modifiers (which are even *weaker* signals) were never tested, but even the strongest signal ("direct") failed.

### System Dynamics

```
┌─────────────────────────────────────────────────────────────────┐
│                    REINFORCING FAILURE LOOP                      │
│                                                                  │
│  User shares vulnerable content                                  │
│       ↓                                                          │
│  Nerin's Tier 1 instincts fire: "go deeper"                     │
│       ↓                                                          │
│  Nerin ignores territory, asks depth question                    │
│       ↓                                                          │
│  User goes deeper (high energy, high telling)                    │
│       ↓                                                          │
│  ConversAnalyzer extracts rich evidence (but narrow facets)      │
│       ↓                                                          │
│  Pacing sees high energy → no drain alarm                        │
│       ↓                                                          │
│  Governor selects new territory (correctly!) but entry           │
│  pressure stays "direct" because energy looks fine               │
│       ↓                                                          │
│  Nerin receives "direct" suggestion to explore new territory     │
│  BUT message history is saturated with the old thread            │
│       ↓                                                          │
│  Tier 1 instincts + message history momentum > territory hint    │
│       ↓                                                          │
│  Nerin ignores territory again → LOOP CONTINUES                  │
│                                                                  │
│  Result: territory changes on paper, conversation doesn't move   │
└─────────────────────────────────────────────────────────────────┘
```

**Key dynamic:** The system measures energy/engagement but not *topic compliance*. High energy from depth-seeking looks identical to high energy from healthy territory exploration. The pacing system can't distinguish "user is engaged in the right territory" from "user is being drained by repetitive depth in the wrong territory." This makes the feedback loop invisible to the pipeline — everything looks healthy from the metrics while the conversation stalls topically.

---

## ANALYSIS

### Force Field Analysis

**Driving Forces (Supporting Solution):**

1. **Territory compliance and conversational quality are aligned, not opposed.** Nerin's depth addiction is a UX problem — the user gets pushed deeper into one emotional vein until drained. Territory transitions are the pressure release valve. Fixing compliance *improves* session quality.
2. **Modular prompt architecture already exists.** The 4-tier system (`prompt-builder.ts`) is clean and extensible — restructuring what goes where requires no pipeline rewrite.
3. **Territory catalog is content-rich.** Each territory has openers, expected facets, domains, and energy levels — plenty of material for stronger topic-specific instructions.
4. **Governor already computes `transition_type`.** `territory_change` vs `normal` is tracked per exchange — prompt behavior can be conditioned on transitions today.
5. **ConversAnalyzer proves structured compliance works.** Same model family follows structured output schemas reliably. The precedent for LLM compliance exists in this codebase.
6. **Observation focus machinery is underutilized.** `noticing`, `contradiction`, and `convergence` are genuinely territory-aware instructions, but `relate` (default 7/9 turns) is a non-instruction. Tuning gating thresholds could increase specific observation firing.

**Restraining Forces (Blocking Solution):**

1. **Message history momentum.** By mid-session, 3,000+ words of prior exchanges create strong thematic inertia that can't be edited. System prompt changes must overcome conversation-level context.
2. **Prompt length ceiling.** System prompt is already ~1,600 words. Adding enforcement content increases token cost and may push less important context out of attention.
3. **LLM stochasticity.** Even with stronger instructions, 100% compliance is impossible without structured output (which would kill conversational feel). Target is "strong influence," not "guaranteed."
4. **Testing cost.** Validating prompt changes requires live/simulated sessions — slow and expensive. Existing test infra mocks LLM responses, can't test compliance.
5. **Personality regression risk.** Nerin's voice, mirrors, and instincts are carefully tuned. Prompt restructuring could inadvertently change quality even while fixing compliance.

### Constraint Identification

**Primary constraint:** Preserve Nerin's conversational quality while significantly improving territory compliance. These are *not* in tension — territory transitions are better UX than depth addiction. The constraint is execution: making territory transitions feel natural, not robotic.

**Bottleneck (Theory of Constraints):** The prompt→LLM interface. Everything upstream (pipeline, scorer, governor) works. Everything downstream (extraction, persistence) works. The single point of failure is how the governor's output is *translated into language the LLM prioritizes*.

**Real vs. assumed constraints:**
- **Real:** LLM attention is finite — prompt position and language strength matter. Message history creates momentum.
- **Assumed (can be challenged):** "Territory guidance must be a suggestion to feel natural." This assumption is embedded in `prompt-builder.ts:151-153` and is the single biggest contributor to the problem. Territory can be framed as a clear direction without sounding like a survey.
- **Assumed (can be challenged):** "Nerin should always go deeper when someone opens up." This unconditional instinct in `conversation-instincts.ts:19` needs a territory-awareness qualifier.

### Key Insights

1. **Micro-quality vs. macro-quality.** Nerin has excellent micro-quality (each response is resonant, insightful) but broken macro-quality (session arc stalls, user drains, coverage gaps). Territory compliance fixes macro-quality without reducing micro-quality.

2. **The prompt is fighting itself.** Tier 1 says "go deeper" (unconditional, imperative, 1,500 words, top of prompt). Tier 4 says "maybe explore this topic" (conditional, suggestive, 50 words, bottom of prompt). The outcome is structurally predetermined.

3. **The "relate" observation focus is a force multiplier for non-compliance.** 7/9 turns default to "connect naturally, no special observation" — effectively telling Nerin to continue doing what it's already doing. The governor's most common output reinforces the problem.

4. **Territory transitions are invisible to Nerin.** When `transition_type: territory_change` occurs, nothing in the prompt signals "you are switching topics." Nerin sees a different territory name but no transition instruction. This is the highest-leverage gap — a transition bridge instruction could flip compliance on territory-change turns.

5. **The self-undermining language is the single easiest fix.** Changing "This is a suggestion, not a script. If the person is already in an interesting thread, stay with it" to directive language would immediately increase signal strength with minimal prompt restructuring.

---

## SOLUTION GENERATION

### Methods Used

1. **Reverse Brainstorming** — Listed every way to make compliance worse, discovered all 6 anti-patterns are already present in the system. Flipping each produced candidate solutions.
2. **TRIZ Contradiction Matrix** — Resolved "compliance vs. naturalness" contradiction using Segmentation (separate reflection from question), Inversion (tell Nerin what NOT to do), and Parameter Change (from prose suggestion to behavioral mode).
3. **Morphological Analysis** — Mapped solution space across signal strength × prompt position × enforcement mechanism. Produced 16 raw candidates evaluated with user.

### Generated Solutions

**From 16 raw candidates, user feedback converged on a unified architecture with 3 layers:**

#### Solution A: Governor-Controlled Behavioral Stack

**Principle:** The governor doesn't just pick a territory — it assembles the entire behavioral recipe for each turn. Depth, observation type, reflection approach, and response format are all functions of steering output, not unconditional always-on modules.

**Changes:**

**A1. Remove unconditional depth instinct.**
Delete "When someone is opening up, you go deeper" from `conversation-instincts.ts`. Depth becomes a steering-controlled parameter. When the governor output indicates "explore deeply in this territory," the prompt includes depth permission. When it indicates "breadth — move to new territory," the depth instinct is absent. The persona stays warm and curious, but the behavioral *mode* is governor-composed.

**A2. Promote steering to top of behavioral stack.**
Move the steering section from Tier 4 (last, ~50 words) to a prominent position after persona (Tier 0). Frame it as Nerin's current curiosity/attention, not an external instruction. Example: "This turn, your attention is drawn toward [domain area]. You've noticed something about how this person [territory theme] and you want to see what's there."

**A3. Observation focus pilots the response shape.**
Each observation type (`relate`, `noticing`, `contradiction`, `convergence`) becomes a full response pattern, not a one-line footnote. The observation defines how the reflection flows and how it threads naturally into the closing question:

- **Relate**: Connect to what they shared → reflect genuinely → steer closing question into territory domain
- **Noticing**: Name a shift you see in [domain] → let them react → close with territory question that follows the thread
- **Contradiction**: Frame a tension across domains with fascination → invite them to explore it → close in territory
- **Convergence**: Name a consistent pattern → validate → close in territory

Each pattern should have depth layers based on extraction tier (how rich the user's response was):
- **Tier 1 (thin):** Short observation + direct territory question
- **Tier 2 (moderate):** Observation + brief threading + territory question
- **Tier 3 (rich):** Full observation + multi-thread weaving + natural territory-directed close

**A4. Reframe territory language as Nerin's desire, not external instruction.**
Instead of "Suggested direction — you could explore something like..." use framing that makes territory feel like Nerin's own curiosity: "You're noticing something about how they [territory theme]. Your closing question should explore this — adapt the approach to what they've given you, but land in [domain area]."

#### Solution B: Bridge Intent for Territory Transitions

**Principle:** Territory transitions deserve their own intent. The conversation doesn't jump from territory A to B — it flows through a bridge turn where observation, reflection, and closing question work together to make the pivot feel like Nerin's natural curiosity pulling toward a new area.

**Changes:**

**B1. Add `bridge` intent to PromptBuilderInput.**
When `transition_type === "territory_change"`, the governor emits `intent: "bridge"` instead of `intent: "explore"`. This triggers a distinct set of Tier 2 modules and steering instructions.

**B2. Bridge-specific Tier 2 modules.**
The bridge intent loads:
- `THREADING` (connect what was said to where we're going)
- `TERRITORY_BRIDGES` (expanded from the existing mirror-based bridge examples in `mirrors-explore.ts:41-44`)
- A dynamic bridge instruction: "You've been exploring [previous territory/domain]. The conversation is naturally shifting toward [new territory/domain]. Use a thread, mirror, or observation to connect these areas. Your closing question should land in the new domain."

**B3. Bridge response format.**
A bridge response follows a specific arc:
1. **Park the thread:** Acknowledge what was shared, signal you're holding it ("I want to come back to that" / "There's something there")
2. **Bridge observation:** A mirror, thread, or pattern that connects old territory to new territory
3. **Closing question:** Lands firmly in the new territory's domain area

**B4. Nerin frames the bridge as its own curiosity (#14).**
The bridge prompt frames the transition as Nerin's attention naturally shifting: "Something about what they said is making you think about [new domain]. You see a connection between [old thread] and [new territory theme]. Follow that connection."

#### Solution C: Refined Response Format with Observation-Driven Flow

**Principle:** The response isn't rigidly split into "reflection part" and "question part" — it's an organic arc where observation, empathy, and threading build naturally toward a territory-directed closing question. The observation focus determines the shape of the entire arc, not just one line.

**Changes:**

**C1. Replace static `EXPLORE_RESPONSE_FORMAT` with dynamic observation-format pairing.**
Instead of a generic "your responses can take different shapes" module, the prompt builder injects a response format specific to the current observation focus. Each observation type has a natural arc that makes the closing question feel inevitable rather than forced.

**C2. Multi-layer depth based on user response richness.**
The extraction tier (from ConversAnalyzer) determines response depth:
- **Tier 1 (surface):** Brief acknowledgment → territory question (don't over-invest in thin content)
- **Tier 2 (moderate):** Observation + short thread → territory question
- **Tier 3 (rich):** Full observation + weaving + natural territory-directed close

**C3. "DO NOT" constraint as guardrail (#8, refined).**
On territory-change turns, add a soft negative constraint: "You've spent the last [N] turns in [old domain]. Don't pull the conversation back there. Your curiosity has moved." This isn't a hard ban — it's framed as Nerin's attention having shifted.

### Creative Alternatives

1. **Territory as Nerin's desire framing (#14).** Instead of external instruction, territory is Nerin's intrinsic curiosity: "You've noticed something about how they [domain theme] and it's pulling at you." This aligns compliance with character — Nerin *wants* to explore the territory, it doesn't *have* to.

2. **Mirror-as-bridge technique.** The existing ocean mirror library (`mirrors-explore.ts`) already has bridge examples. Expand this into a first-class bridge mechanism — each territory pair gets 1-2 mirror bridges that connect them thematically. "From self-worth to friendship: Hermit Crab — must go naked between shells → 'You've been talking about what you think you're worth. I'm curious who actually sees that in you. Who do you not have to perform for?'"

3. **Dynamic persona modifier on bridge turns.** On bridge turns, prepend: "This turn you are Nerin the explorer — your attention has shifted. You've been diving deep in one spot and now you're swimming toward a different reef. You see something over there that connects to what you just heard." Reframe the mechanical territory switch as Nerin's natural movement pattern.

4. **Graduated territory enforcement.** First turn in a new territory: strong directive ("your closing question must explore [domain]"). Second turn: moderate ("continue exploring [domain]"). Third turn: relaxed ("you're in [domain], follow natural threads"). This frontloads compliance when it matters most (the pivot) and relaxes once Nerin is in the right territory.

5. **Thread parking as explicit skill.** Add a parking module that teaches Nerin to explicitly name threads it's holding: "I want to hold what you said about [X] — we'll come back to it. But right now something else is catching my attention..." This makes transitions feel like curation, not interruption.

---

## SOLUTION EVALUATION

### Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Territory compliance impact | High | Does this solve the core problem — Nerin following territory assignments? |
| Naturalness preservation | High | Does the conversation still feel like Nerin — curious, warm, insightful? |
| Implementation scope | Medium | How many files change, what's the blast radius? |
| Testability | Medium | Can we verify correctness without expensive live sessions? |
| Reversibility | Low | Can we roll back if quality degrades? |

### Solution Analysis

| Criterion | Solution A (Behavioral Stack) | Solution B (Bridge Intent) | Solution C (Observation Format) |
|-----------|------|------|------|
| **Compliance impact** | **High** — removes root causes 1, 2, 3 (depth instinct, weak signal, position bias) | **High** on transition turns — attacks root cause 4 (invisible transitions) | **Medium** — shapes response flow, reinforces A and B |
| **Naturalness** | **High** — territory-as-desire framing makes compliance *be* the character | **Excellent** — bridges are inherently natural ("something caught my attention...") | **Excellent** — observation-driven flow makes territory feel organic |
| **Scope** | Medium — prompt restructure + instinct rewrite (~100 lines across 3 files) | Medium — new intent + governor change + new module (~50 lines + new constants) | Small — prompt-builder format changes (~50 lines + new constants) |
| **Testability** | Unit-testable (prompt-builder is pure function) + live validation | Unit-testable + live validation for bridge quality | Fully unit-testable |
| **Reversibility** | Easy — revert prompt-builder + restore instinct | Easy — remove bridge case, falls back to explore | Easy — swap format constants |

**Complementarity analysis:** A, B, and C are not competing alternatives — they address different root causes and reinforce each other. A fixes signal strength. B fixes territory transitions. C fixes observation defaulting. Together they form a complete steering-to-prompt pipeline.

### Recommended Solution

**Implement Solutions A + B + C as a unified architecture change, with Creative Alternative #1 (territory-as-desire) as the foundational framing principle.**

The combined solution creates a **governor-composed behavioral stack** where:

1. **Nerin's depth, observation, and response format are all functions of steering output** — not unconditional always-on modules (Solution A)
2. **Territory transitions get their own intent (`bridge`)** — with park-bridge-close response arcs that make pivots feel like Nerin's curiosity shifting (Solution B)
3. **Observation focus determines the entire response shape** — with depth layers based on extraction richness (Solution C)
4. **Territory is framed as Nerin's desire** — "your attention is drawn toward [domain], you've noticed something..." — making compliance *be* the character, not fight it (Creative Alt #1)

**Implementation sequence: C → A → B**
- **C first:** Smallest scope, immediately testable, establishes observation-driven format
- **A second:** Highest single-change impact — removes depth instinct, promotes steering, applies desire framing
- **B third:** Requires A to exist (depth removal + territory promotion make bridging work). Adds bridge intent for natural transitions.

### Rationale

1. **All five root causes are addressed:**
   - RC1 (position bias): A2 promotes steering to top of prompt
   - RC2 (self-undermining language): A4 replaces suggestion framing with desire framing
   - RC3 (competing Tier 1 instincts): A1 removes unconditional depth instinct
   - RC4 (relate = non-instruction): C1 gives every observation type a full response pattern
   - RC5 (no structural enforcement): B1-B3 add bridge intent with structured response arc

2. **Naturalness and compliance are unified, not traded off.** The territory-as-desire framing (#1) is the key innovation — it makes territory compliance an expression of Nerin's character rather than an external constraint. Nerin is a curious explorer. The governor tells Nerin *where its curiosity is pointing*. This is completely in character.

3. **All five contributing factors are mitigated:**
   - CF1 (relate defaults to nothing): C1 replaces with full observation-format pairing
   - CF2 (no topic in question modules): A3 injects territory-specific patterns per observation type
   - CF3 (message history momentum): A1 removes depth instinct + B3 explicitly parks threads
   - CF4 (no bridging on transition): B1-B4 adds dedicated bridge intent
   - CF5 (entry pressure never escalates): A2 makes territory promotion structurally visible regardless of pressure level

4. **Scope is concentrated and reversible.** Changes touch prompt-builder, governor, conversation-instincts, and add new constants. Pipeline architecture unchanged. All changes are pure-function prompt composition — fully unit-testable. Live validation confirms quality.

---

## IMPLEMENTATION PLAN

### Implementation Approach

**Strategy: Phased rollout (C → A → B) with validation between each layer.**

Each layer is a self-contained, testable change. Layer C establishes new observation-driven formats. Layer A restructures the prompt and removes the depth instinct. Layer B adds the bridge intent. Each layer improves compliance incrementally, and each can be validated independently before proceeding.

**Branch strategy:** Single feature branch `feat/story-XX-steering-prompt-compliance` with atomic commits per layer. Each layer passes existing tests before proceeding.

### Action Steps

#### Layer C — Observation-Driven Response Format

**C1. Create observation response pattern constants**
- **New file:** `packages/domain/src/constants/nerin/observation-formats.ts`
- Define 4 response format templates, one per observation type:
  - `RELATE_FORMAT` — Connect → reflect → steer closing question into territory domain
  - `NOTICING_FORMAT` — Name what's shifting in [domain] → let them react → close in territory
  - `CONTRADICTION_FORMAT` — Frame tension with fascination → invite exploration → close in territory
  - `CONVERGENCE_FORMAT` — Name consistent pattern → validate → close in territory
- Each format should have 3 depth variants keyed by extraction tier (1/2/3)
- Export a `getObservationFormat(focus: ObservationFocus, tier: number): string` function
- **Export from:** `packages/domain/src/constants/nerin/index.ts`

**C2. Replace static EXPLORE_RESPONSE_FORMAT in prompt-builder**
- **File:** `packages/domain/src/utils/steering/prompt-builder.ts`
- **Current (line 73-80):** Static `EXPLORE_RESPONSE_FORMAT` constant
- **Change:** Remove static constant. In `selectTier2Modules()`, replace `EXPLORE_RESPONSE_FORMAT` with a dynamic call — the format is now composed in `buildSteeringSection()` based on observation focus + extraction tier.
- **Requires:** Add `extractionTier: number` to `buildPrompt()` signature (or to `PromptBuilderInput`)

**C3. Pass extraction tier from pipeline to prompt builder**
- **File:** `apps/api/src/use-cases/nerin-pipeline.ts`
- The extraction tier is already computed by ConversAnalyzer before Nerin invocation (pipeline step order: extract → score → select → governor → **prompt builder** → nerin)
- Pass `extractionTier` from the extraction result into the `buildPrompt()` call
- **Decision needed:** Add `extractionTier` to `PromptBuilderInput` type in `packages/domain/src/types/pacing.ts`, or keep it as a separate parameter?

**C4. Update prompt-builder tests**
- **File:** `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts` (if exists, or create)
- Test that each observation type × extraction tier combination produces the expected format
- Test that the observation format includes territory domain reference

**Milestone: Layer C complete** — observation focus now drives response shape. Existing tests pass. Nerin's response format varies by observation type and user response richness.

---

#### Layer A — Governor-Controlled Behavioral Stack

**A1. Remove unconditional depth instinct**
- **File:** `packages/domain/src/constants/nerin/conversation-instincts.ts`
- **Current (line 19):** "When someone is opening up, you go deeper."
- **Change:** Remove this line entirely. Depth behavior is now controlled by observation format patterns (from Layer C) and territory framing.
- Also review lines 17-18 ("You read the energy. When someone is opening up, you go deeper. When guarded, you change angle.") — keep the guarded/angle-change instinct, remove only the "go deeper" directive.
- **Rewrite to:** "You read the energy. When guarded, you change angle." (delete the depth half)

**A2. Promote steering section to top of behavioral stack**
- **File:** `packages/domain/src/utils/steering/prompt-builder.ts`
- **Current (line 238):** `[persona, tier1, tier2Content, steeringSection].join("\n\n")`
- **Change to:** `[persona, steeringSection, tier1, tier2Content].join("\n\n")`
- Steering moves from position 4 (last) to position 2 (right after persona). Nerin reads "who I am" then immediately "where my attention is this turn" before any behavioral modules.

**A3. Rewrite territory guidance with desire framing**
- **File:** `packages/domain/src/utils/steering/prompt-builder.ts`
- **Current (lines 141-170):** `buildTerritoryGuidanceWithPressure()` with suggestive language
- **Rewrite all three entry pressure variants:**
  - **Direct:** "Your attention is drawn to [domain area]. You've noticed something about how this person [territory theme]. Your closing question should explore this — adapt to the conversation flow, but land in this domain."
  - **Angled:** "Something about [domain area] is pulling at you, but approach it from the side. Find a thread from what they've shared that naturally bends toward this territory."
  - **Soft:** "There may be something in [domain area] worth exploring — if the conversation naturally opens toward it, follow your curiosity there. If not, stay present where you are."
- Remove all instances of "this is a suggestion" and "if the person is already in an interesting thread, stay with it"
- **Key principle:** Territory is Nerin's curiosity, not an external instruction

**A4. Add territory theme descriptions for desire framing**
- **Decision needed:** The current territory catalog has `opener` and `expectedFacets` but no prose `theme` description. The desire framing needs something like "how this person relates to close friends" (for `friendship-depth`) or "what this person values and stands for" (for `opinions-and-values`).
- **Option 1:** Add a `theme: string` field to the `Territory` type and populate in `territory-catalog.ts`
- **Option 2:** Derive theme from territory ID + domains inline in the prompt builder
- **Recommendation:** Option 1 — explicit theme in catalog is cleaner and testable

**A5. Add soft negative constraint on territory-change turns**
- **File:** `packages/domain/src/utils/steering/prompt-builder.ts`
- **When:** `buildSteeringSection()` receives a signal that this is a territory-change turn
- **Add:** "You've been exploring [previous domain] — your curiosity has moved. Don't pull the conversation back there."
- **Requires:** Previous territory ID passed to prompt builder (available from exchange history in pipeline)
- **Decision needed:** Pass `previousTerritory` as part of `PromptBuilderInput` or as separate param?

**A6. Update tests**
- Prompt builder tests: verify steering section appears in position 2
- Prompt builder tests: verify desire framing language in all entry pressure variants
- Prompt builder tests: verify negative constraint appears on territory-change
- Conversation instincts: verify depth instinct removed

**Milestone: Layer A complete** — Steering is promoted, depth instinct removed, territory framed as Nerin's desire. This is the highest-impact change. Validate with simulated session before proceeding to B.

---

#### Layer B — Bridge Intent

**B1. Add bridge intent to domain types**
- **File:** `packages/domain/src/types/pacing.ts`
- Add `"bridge"` to the `PromptBuilderInput` intent discriminated union
- Define `BridgePromptInput`:
  ```
  intent: "bridge"
  territory: TerritoryId          // new territory
  previousTerritory: TerritoryId  // territory we're leaving
  entryPressure: EntryPressure
  observationFocus: ObservationFocus
  ```

**B2. Governor emits bridge intent on territory change**
- **File:** `packages/domain/src/utils/steering/move-governor.ts`
- **Current (lines 107-114):** Intent derivation returns "open" | "explore" | "amplify"
- **Change:** When `transition_type === "territory_change"` AND `turnNumber > 1` AND NOT `isFinalTurn`, return `"bridge"` instead of `"explore"`
- Pass `previousTerritory` from exchange history into the governor result

**B3. Create bridge Tier 2 module**
- **New file:** `packages/domain/src/constants/nerin/bridge.ts`
- Content: Instructions for parking current thread + bridging to new territory + landing closing question in new domain
- Include mirror-as-bridge examples (expanded from `mirrors-explore.ts:41-44`)
- Include thread parking patterns: "I want to hold what you said about [X] — there's something there. But something else is catching my attention..."
- Include desire framing for the bridge: "Something about what they said connects to [new domain]. You see a thread between [old thread] and [new territory theme]. Follow that connection."
- **Export from:** `packages/domain/src/constants/nerin/index.ts`

**B4. Prompt builder handles bridge intent**
- **File:** `packages/domain/src/utils/steering/prompt-builder.ts`
- Add `case "bridge"` to `selectTier2Modules()`:
  - Load: `[THREADING, BRIDGE, REFLECT]`
  - Module names: `["THREADING", "BRIDGE", "REFLECT"]`
- Add bridge-specific steering section in `buildSteeringSection()`:
  - Include previous territory theme + new territory theme
  - Include bridge arc: park → connect → close in new domain
  - Frame as Nerin's curiosity shifting naturally

**B5. Graduated enforcement for territory persistence**
- After a bridge turn successfully transitions to a new territory, the next `explore` turn in that territory should have stronger territory anchoring (turn 1 in new territory = firm, turn 2+ = relaxed)
- **Implementation:** Track territory tenure (how many turns in current territory) and adjust directive strength. Available from exchange history.

**B6. Update tests**
- Governor tests: verify bridge intent emitted on territory_change
- Prompt builder tests: verify bridge module selection and steering section
- Type tests: verify BridgePromptInput type
- Pipeline integration: verify previous territory flows through correctly

**Milestone: Layer B complete** — Territory transitions get dedicated bridge intent with natural park-bridge-close arcs. Full A+B+C architecture operational.

---

#### Post-Implementation Validation

**V1. Simulated session test**
- Run a simulated assessment session with mock user responses that trigger territory changes
- Verify Nerin's closing questions land in assigned territory domains
- Verify bridge turns produce natural transitions
- Verify observation focus shapes response format

**V2. Live session test**
- Run 2-3 live sessions with the new prompt architecture
- Compare territory compliance rate to baseline (0/9 in session `b29bffc5`)
- Evaluate conversational quality — does Nerin still feel warm, curious, insightful?
- Monitor user energy — does territory switching provide the expected "pressure release"?

**V3. Regression check**
- Verify all existing prompt-builder tests pass
- Verify all pipeline tests pass
- Verify ConversAnalyzer behavior unchanged (separate LLM call, unaffected)

### Timeline and Milestones

| Milestone | Layer | Dependencies | Status |
|-----------|-------|-------------|--------|
| Observation format constants created | C1 | None | Not started |
| Prompt builder uses dynamic formats | C2-C3 | C1 | Not started |
| Layer C tests pass | C4 | C1-C3 | Not started |
| Depth instinct removed | A1 | None | Not started |
| Steering promoted + desire framing | A2-A4 | C complete (formats exist) | Not started |
| Negative constraint on transitions | A5 | A2-A4 | Not started |
| Layer A tests pass | A6 | A1-A5 | Not started |
| **Simulated session validation** | — | A complete | Not started |
| Bridge intent in domain types | B1 | A complete | Not started |
| Governor emits bridge intent | B2 | B1 | Not started |
| Bridge module created | B3 | None (can parallel with B1-B2) | Not started |
| Prompt builder handles bridge | B4-B5 | B1-B3 | Not started |
| Layer B tests pass | B6 | B1-B5 | Not started |
| **Live session validation** | — | B complete | Not started |

### Resource Requirements

- **Codebase changes:** ~6-8 files modified, 1-2 new files created
- **Primary packages affected:** `domain` (types, constants, steering utils), `api` (pipeline)
- **No infrastructure changes** — no DB schema, no new API endpoints, no deployment changes
- **Testing:** Unit tests (free), simulated sessions (cheap), live sessions (time-intensive)
- **LLM cost:** No change — same model, same number of calls. Prompt length increases slightly (~100-200 tokens for richer steering section)

### Responsible Parties

- **Implementation:** Vincentlay (sole developer)
- **Validation:** Live session testing by Vincentlay
- **Architecture decisions:** Vincentlay (territory theme field, extractionTier placement, previousTerritory passing)

---

## MONITORING AND VALIDATION

### Success Metrics

**Primary metric — Territory Compliance Rate:**
- **Definition:** Percentage of turns where Nerin's closing question demonstrably targets the assigned territory's domain area
- **Baseline:** 0/9 (0%) in session `b29bffc5`
- **Target:** ≥ 70% strong compliance, ≤ 10% full misses (remaining 20% = partial/marginal)
- **Measurement:** Manual review of closing questions against territory expected facets/domains per session. Query: join `assessment_message` (assistant role) with `assessment_exchange` (selected_territory) and compare closing question content to territory catalog domains.

**Secondary metrics:**

| Metric | Baseline (session b29bffc5) | Target | How to measure |
|--------|---------------------------|--------|----------------|
| Territory diversity | 4 territories visited / 25 available | ≥ 6 territories per full session | Count distinct `selected_territory` in exchanges AND verify Nerin's questions actually explored them |
| Domain coverage | Heavy solo/work, zero social/family | Evidence in ≥ 4 of 5 life domains | Query `conversation_evidence` domain distribution |
| Bridge naturalness | No bridges (territory changes invisible) | Bridge turns feel like Nerin's curiosity shifting (qualitative) | Manual review of bridge-intent turns |
| Conversation quality | High micro-quality | No regression — Nerin still warm, curious, insightful | Qualitative review of full session transcripts |
| Energy distribution | Consistently high (0.5-0.9), no pressure release | Energy variation with lighter turns after territory switches | Query `assessment_exchange` energy values, look for variation |

**Anti-metric (what we DON'T want):**
- Nerin sounding like a survey bot ("Now let's talk about your friends")
- Abrupt topic changes without bridging
- Loss of emotional resonance or depth within territory turns

### Validation Plan

**Phase 1 — Unit tests (after each layer):**
- Prompt builder outputs correct format for each observation type × extraction tier combination
- Steering section appears in position 2 (after persona)
- Desire framing language present in all entry pressure variants
- Bridge intent emitted on territory_change turns
- Negative constraint present on territory-change, absent on normal turns
- All existing prompt-builder and governor tests pass

**Phase 2 — Simulated session (after Layer A):**
- Create a scripted user input sequence that triggers at least 3 territory changes
- Run through the pipeline with mock ConversAnalyzer responses
- Inspect the composed system prompt at each turn — verify:
  - Steering is at top (position 2)
  - Territory framing uses desire language
  - Observation format matches observation type
  - No "go deeper" instinct present
- Run Nerin with the composed prompt against scripted inputs
- Manual review: does Nerin's closing question land in territory?

**Phase 3 — Live session validation (after Layer B):**
- Run 2-3 full live assessment sessions
- For each session:
  1. Query `assessment_exchange` for territory sequence and transition types
  2. Query `assessment_message` for assistant responses
  3. Score each turn: strong / partial / miss territory compliance
  4. Score bridge turns: natural / forced / absent
  5. Review evidence domain distribution
  6. Subjective quality assessment: does Nerin still feel like Nerin?
- **Pass criteria:** ≥ 70% compliance, bridge turns feel natural, no quality regression

**Phase 4 — Comparison (after validation):**
- Side-by-side comparison of session `b29bffc5` (before) vs new sessions (after)
- Compare: territory compliance rates, domain coverage, energy distribution, conversation arc quality

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Nerin sounds robotic after territory promotion** | Medium | High | Desire framing ("your curiosity pulls you") preserves character. Test in simulated session before live. Rollback: revert prompt-builder position change. |
| **Bridge turns feel forced or abrupt** | Medium | Medium | Bridge module includes multiple transition patterns (mirrors, threads, parking). Graduated enforcement relaxes after first turn. Rollback: remove bridge intent, fall back to explore. |
| **Removing depth instinct makes Nerin too shallow** | Low | High | Depth is now observation-driven (tier 3 = full depth). The instinct removal only stops *unconditional* depth — Nerin still goes deep when the observation format calls for it. Rollback: restore single line in conversation-instincts.ts. |
| **Prompt length increases too much** | Low | Low | Observation formats are concise (3-5 sentences). Net change is ~100-200 tokens. Monitor with prompt builder output length checks. |
| **Extraction tier not available at prompt build time** | Low | Medium | Verify pipeline step order: extraction happens BEFORE prompt building in nerin-pipeline.ts. If not available for turn N, use turn N-1's tier (available from exchange history). |
| **Bridge intent breaks existing tests** | Medium | Low | PromptBuilderInput union expansion requires updating pattern matches in tests. Catch during Layer B unit testing. |
| **Quality regression not caught by metrics** | Low | High | Qualitative review is mandatory — metrics alone can't capture "does Nerin feel right." Review full session transcripts, not just closing questions. |

### Adjustment Triggers

| Trigger | Condition | Response |
|---------|-----------|----------|
| **Compliance still < 50%** | After full A+B+C implementation, Nerin still ignores territory on majority of turns | Investigate: is message history momentum overpowering the prompt? Consider stronger language, response structure constraints, or pre-turn territory priming. |
| **Nerin sounds robotic** | Bridge turns or territory-directed questions feel forced or survey-like in ≥ 2 sessions | Soften desire framing language. Add more bridge pattern variety. Consider removing negative constraint ("don't go back") if it's making Nerin stiff. |
| **Depth regression** | Nerin stays surface-level even when user shares rich content (tier 3 extraction) | Review observation format tier 3 patterns — they may need stronger depth permission. Consider adding a conditional depth instinct: "When extraction is rich AND you're within the assigned territory, go deeper." |
| **Bridge turns too long** | Bridge responses consistently > 6 sentences, feeling like monologues | Tighten bridge response format: "Park in 1 sentence, bridge in 1-2, close with question." |
| **Energy doesn't vary** | Energy stays consistently high across territory switches (no pressure release effect) | Territory transitions may not be producing lighter questions. Review entry pressure interaction with bridge intent — bridge turns should feel like a breath, not another deep dive. |
| **Observation focus still defaults to relate** | After Layer C, observation gating still produces relate 70%+ of turns | Separate issue — tune observation gating thresholds in `observation-gating.ts`. Lower `noticing` threshold or boost its base strength. This is upstream of the prompt fix. |

---

## LESSONS LEARNED

### Key Learnings

1. **LLM prompt position and language strength matter more than content correctness.** The steering pipeline was computing perfect outputs. The problem was never the *what* — it was the *how*. A correct instruction buried at the bottom in suggestive language will lose to an incorrect instinct placed at the top in imperative language. When designing LLM agent systems: the interface between your logic and the LLM is where compliance lives or dies.

2. **Unconditional behavioral instincts are dangerous in steered agents.** "When someone is opening up, you go deeper" sounds like good conversational design. But in a system where depth should be *contextual* (controlled by territory, energy, and observation focus), an unconditional depth instinct becomes the dominant force that overrides all steering. Every always-on instinct should be audited: *does this conflict with any steering signal?*

3. **"Suggestion" framing is anti-compliance.** Telling an LLM "this is a suggestion, not a script — follow the natural flow" explicitly gives it permission to ignore the instruction. LLMs are eager to please and will interpret any escape clause as license. If you want compliance, frame instructions as the agent's *desire* or *attention*, not as external suggestions.

4. **The default observation output matters enormously.** When the most common pipeline output (relate, 7/9 turns) translates to "do nothing special — be natural," the pipeline is effectively silent on 78% of turns. The default path should still carry meaningful behavioral guidance, not a non-instruction.

5. **Territory-as-desire is a general pattern for LLM compliance.** Instead of external instructions ("you must ask about X"), framing the instruction as the agent's internal state ("your curiosity is pulling you toward X") aligns compliance with character. The LLM follows the instruction because it *wants* to, not because it's told to. This pattern likely applies to any persona-driven LLM agent that receives external steering.

6. **Open-loop steering systems are structurally fragile.** No matter how sophisticated the computation (scorer, governor, pacing), if the output is injected as prose into a system prompt with no verification, compliance is probabilistic at best. Closing the loop (even partially, through post-hoc review or structured output for the closing question) would provide guarantees. For now, making the open-loop signal as strong as possible is the pragmatic choice.

7. **Micro-quality vs. macro-quality is a useful diagnostic frame.** Nerin's responses were individually excellent — warm, insightful, emotionally resonant. But the session arc was broken — repetitive depth, narrow coverage, user drain. Evaluating only per-response quality misses the macro problem. Session-level quality metrics (territory diversity, domain coverage, energy variation) are needed alongside turn-level quality.

### What Worked

1. **The diagnostic approach.** Reading the actual prompt Nerin receives — not just the pipeline code — immediately revealed the root cause. The Five Whys chain from "Nerin ignores territory" to "the prompt explicitly tells Nerin to ignore territory" was a straight line once we looked at `prompt-builder.ts:151-153`.

2. **Querying the live session data.** Having the full exchange history (energy, telling, territory, scorer output, governor output, governor debug) made the diagnosis evidence-based rather than speculative. The `assessment_exchange` table is well-designed for exactly this kind of analysis.

3. **Party mode for multi-perspective problem solving.** Having Dr. Quinn (systematic diagnosis), Winston (architectural framing), and Amelia (implementation grounding) work the problem simultaneously produced a more complete analysis than any single perspective would have.

4. **The Is/Is Not analysis.** Contrasting "where IS the problem" (prompt→LLM boundary) with "where is it NOT" (pipeline computation) immediately narrowed the investigation. Without this, we might have wasted effort debugging the scorer or governor.

5. **Reverse brainstorming.** Asking "how would we make compliance worse?" and discovering every anti-pattern is already present was the most impactful single insight. It reframed the problem from "how do we add compliance" to "how do we stop actively undermining it."

### What to Avoid

1. **Don't add steering complexity upstream when the downstream interface is broken.** More sophisticated territory scoring, better observation gating, finer energy tracking — none of these help if the prompt translates the output into "this is a suggestion, do what feels natural." Fix the interface before adding upstream sophistication.

2. **Don't conflate conversational quality with agent compliance.** "Nerin sounds great" masked "Nerin ignores everything the pipeline tells it." Quality and compliance are orthogonal. An agent can be high-quality and non-compliant (current state) or low-quality and compliant (survey bot). The goal is both.

3. **Don't use escape clauses in LLM instructions unless you genuinely want non-compliance.** "If the person is already in an interesting thread, stay with it" sounds reasonable but is functionally a compliance kill switch. Every thread is interesting to an LLM playing a curious personality. If the escape should be rare, don't make it easy.

4. **Don't test LLM agent systems only at the unit level.** Prompt builder unit tests verify the prompt is *composed* correctly but can't verify the LLM *follows* it. Session-level integration testing (even simulated) is essential for behavioral validation.

5. **Don't treat persona and steering as independent systems.** The current architecture treats Nerin's identity (Tier 0-2) and steering (Tier 4) as separate concerns that coexist in one prompt. They don't coexist — they compete. The solution (territory-as-desire) merges them: steering becomes part of identity. Design persona and steering as one integrated system from the start.

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
