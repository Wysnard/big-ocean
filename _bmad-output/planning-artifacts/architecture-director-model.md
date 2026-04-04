---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-03'
inputDocuments:
  - '_bmad-output/problem-solution-2026-04-03.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/architecture-conversation-pacing.md'
  - '_bmad-output/planning-artifacts/prd.md'
workflowType: 'architecture'
project_name: 'big-ocean'
user_name: 'Vincentlay'
date: '2026-04-03'
scope: 'Director Model — Two-Call Steering Architecture (replaces territory-based pacing pipeline)'
relationship: 'Standalone architecture — supersedes ADR-5/17-21 (pacing pipeline) and architecture-conversation-pacing.md after implementation'
---

# Director Model — Two-Call Steering Architecture

_Standalone architecture for replacing the territory-based pacing pipeline with a Nerin Director (LLM strategist) + Nerin Actor (voice) two-call model. Both calls are Nerin — one thinks, one speaks. Supersedes ADR-5/17-21 and architecture-conversation-pacing.md after implementation._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (Architectural Scope):**

This architecture replaces the conversation steering pipeline — specifically ADR-5 (territory-based steering), ADR-17 (E_target pacing), ADR-18 (territory scorer), ADR-19 (2-layer prompt system), ADR-20 (three-tier extraction), and ADR-21 (exchange state table). It also eliminates the separate user-state LLM call introduced by ADR-27 (the Director reads energy/telling natively from conversation history).

Affected PRD requirements:

- **FR3:** Pacing pipeline steers Nerin's territory focus, observation type, and entry pressure each turn → **Reframed:** Nerin Director steers Nerin Actor's content direction, emotional shape, and conversation strategy each turn
- **FR6:** Nerin references patterns during conversation (≥2 specific observations) → **Preserved:** Director includes observation strategy in brief. Observation count passed as Director input for pacing. Post-hoc batch audit for quality.
- **FR7:** Nerin frames observations as invitations → **Moved:** Strategic instinct, now owned by Director prompt
- **FR13:** Territory transitions via connecting observation → **Replaced:** Director crafts organic bridges between topics using conversation context — bridges are the Director's core output

**Non-Functional Requirements:**

| NFR | Current Pipeline | Director Model | Risk |
|-----|-----------------|----------------|------|
| Latency <2s P95 | ConversAnalyzer (~1-1.5s) + pipeline (~0ms) + Nerin (~1-1.5s) = ~2-3s | Evidence (Haiku, ~1-1.5s) + Nerin Director (~1-1.5s) + Nerin Actor (Haiku, ~0.3-0.5s, minimal input) = ~2.5-3.5s with Sonnet Director | **Medium-High** — three sequential calls. See latency levers below. |
| Cost ~$0.20/assessment | ~48 Haiku calls (24 ConversAnalyzer dual-purpose + 24 Nerin) | ~24 Haiku (evidence) + 24 Nerin Director + 24 Nerin Actor (Haiku, minimal input). User-state Haiku call (ADR-27) eliminated — Nerin Director reads energy/telling natively. | **Medium** — Nerin Director input tokens grow linearly with conversation length. See token budget below. |
| Resilience | Three-tier extraction fail-open (Tier 3: neutral defaults, Nerin still has full identity + history) | Nerin Director failure is critical — Nerin Actor has no conversation history to fall back on. Requires designed fallback path. | **High** — minimal-context guarantee creates Nerin Director-dependency. |
| Observability | Exchange table stores scorer_output, governor_output, governor_debug (structured jsonb) | Exchange table stores director_output (text), coverage_targets (jsonb). Human-readable but harder to aggregate programmatically. | **Low** — simpler to debug manually, accept loss of structured aggregation for MVP. |

**Latency Strategy:**

Target <2s P95, accept <3s if conversation quality improves measurably (a thoughtful conversational agent may justify slightly higher latency). Three levers:

1. **Model downgrade:** Haiku Nerin Director (~1.5-2.5s total) as latency-safe floor
2. **Streaming overlap:** Begin Nerin Actor call while Nerin Director response streams (optimization, not launch requirement)
3. **NFR relaxation:** Accept <3s P95 if Director-steered conversations are measurably better

**Token Budget (Director input grows with conversation):**

| Turn | Approx Director Input Tokens | Notes |
|------|------------------------------|-------|
| Turn 1 | ~1,000 | Greeting + first user message + coverage targets |
| Turn 12 | ~5,000 | ~24 messages + coverage targets |
| Turn 25 | ~10,000 | ~50 messages + coverage targets |

Cumulative Director input across 25 turns: ~130,000 tokens. At Sonnet input pricing, this is the primary cost variable. If cost exceeds $0.20/assessment target: (a) sliding-window Director input (last N turns + cumulative evidence summary), (b) Haiku Director (cheaper input pricing), (c) accept higher cost if conversation quality justifies it.

**Model Assignment Flexibility:**

| Nerin Director Model | Latency (3-call sequential) | Strategy Quality | Cost |
|---|---|---|---|
| Haiku | ~1.5-2.5s | Risk: shallow strategy, mechanical bridges | Cheapest |
| Sonnet | ~2.5-3.5s | Expected: good strategy, creative bridges | Medium |
| Opus | ~3.5-5s+ | Best strategy, but likely too slow | Expensive |

Nerin Director model is a tuning knob. Start with Sonnet, validate in Phase 1. Downgrade to Haiku if latency is unacceptable. Upgrade to Opus if strategy quality is insufficient.

**Cost Scenarios (Nerin model sensitivity):**

| Nerin Actor Model | Per-Turn Cost (Nerin Director Sonnet) | Per-Assessment (25 turns) | Notes |
|---|---|---|---|
| Haiku | Evidence Haiku + Nerin Director Sonnet + Nerin Actor Haiku | ~$0.15-0.25 | Target scenario |
| Sonnet | Evidence Haiku + Nerin Director Sonnet + Nerin Actor Sonnet | ~$0.40-0.60 | Fallback if Haiku can't voice Nerin |

Phase 1 voice test determines whether the Haiku Nerin Actor scenario is viable. If not, the $0.20/assessment target is not achievable and the business model needs adjustment.

**Scale & Complexity:**

- Primary domain: LLM pipeline orchestration (backend only, no frontend changes)
- Complexity level: Medium-high (deep integration of current pipeline, but replacement is architecturally simpler)
- Components deleted (~15): E_target, territory scorer, territory selector, move governor, prompt builder, territory catalog, band mappings, steering templates, pressure modifiers, mirror lookups, pacing defaults, scorer defaults, user-state extraction call, and associated types/tests/mocks
- Components created (~3): Nerin Director LLM call, Nerin Actor LLM call, coverage gap analyzer
- Components adapted (~3): `nerin-pipeline.ts` orchestrator (rewritten), exchange table schema (migration), evidence extraction (unchanged but decoupled from user-state)

### Technical Constraints & Dependencies

**Established Stack (Immutable):**
- Effect-ts with Context.Tag DI — Nerin Director and Nerin Actor calls follow repository interface pattern
- Hexagonal architecture — Nerin Director and Nerin Actor are infrastructure adapters behind domain repository interfaces
- Exchange table — adapted, not replaced (drop pacing columns, add director columns)
- Evidence extraction — ADR-27 polarity model and separate evidence call survive unchanged
- Derive-at-read — facet scores, OCEAN codes, archetypes untouched

**Schema Validation Path (new preference):**

LLM output schemas must use the Standard Schema integration path:

```
Effect Schema → Standard Schema v1 (Schema.standardSchemaV1()) → LangChain structured output
```

This replaces the current path of Effect Schema → JSON Schema → LLM tool_use. LangChain accepts Standard Schema as input for `responseFormat` and routes to native provider structured output or tool calling automatically.

- `Schema.standardSchemaV1(schema)` wraps an Effect Schema into a Standard Schema v1 object
- Constraint: schema must have no dependencies (`R = never`) — all LLM output schemas should already satisfy this
- Applies to: Nerin Director output schema (if structured header is added), evidence extraction schema, Nerin Actor output (if any structured metadata)
- The evidence extraction schemas (strict + lenient from ADR-CP-12) migrate to this path as part of the Director model work

**Dependencies on Existing Decisions:**
- ADR-27 (polarity extraction) — evidence call is independent of Nerin Director; runs sequentially before Nerin Director (Nerin Director uses current-turn evidence)
- ADR-28 (territory catalog 25→31) — **catalog deleted in Director model**. Coverage analyzer uses facet/domain gaps directly, not territory routing
- ADR-4 (evidence model) — unchanged, Nerin Director receives coverage gaps derived from evidence
- ADR-21 (exchange table) — schema adapted: drop pacing/scoring/governor columns, add director_output

**Key Constraint: Director Output Format.** The single design decision everything hangs on. Problem-solution selected free-form strategic brief (2-3 sentences) over structured JSON. Must be validated before implementation.

**Key Constraint: Nerin Director Failure Resilience.** The minimal-context design (the architectural compliance guarantee) creates a Nerin Director-dependency. If the Nerin Director call fails, Nerin Actor has no conversation history to produce a meaningful response. This requires a designed fallback path — not a one-liner "use default brief."

**Key Constraint: Evidence-to-Director Timing.** Evidence extraction runs sequentially BEFORE Nerin Director. Nerin Director receives current-turn evidence and current-turn coverage gaps. No lag, no parallelism between extraction and Nerin Director.

### Cross-Cutting Concerns

1. **Pipeline orchestration rewrite:** `nerin-pipeline.ts` rewritten from ~15 steps to ~4: evidence extraction → coverage analysis → Nerin Director → Nerin Actor → save exchange. Direct migration — no feature flag, no parallel pipeline. The current pipeline is broken (three failed steering iterations); there is nothing to preserve.

2. **Exchange table migration:** Drop ~12 pacing/scoring/governor columns (smoothed_energy, session_trust, drain, trust_cap, e_target, scorer_output, selected_territory, selection_rule, governor_output, governor_debug, session_phase, transition_type). Add: `director_output` (text), `coverage_targets` (jsonb). Keep `extraction_tier` (evidence extraction still has three-tier retry). Single migration file — no parallel period. **Cannot modify existing migrations** — append new migration file.

3. **Test and mock cascade:** Unit tests for scorer, selector, governor, E_target, prompt builder become dead code — delete. New tests for coverage analyzer, Director prompt validation, voice-only Nerin validation. Mock repositories for ConversAnalyzer user-state extraction become dead code (evidence extraction mock survives). Integration tests and e2e tests that reference pacing columns need updating.

4. **Seed script rewrite:** `scripts/seed-completed-assessment.ts` uses `exchange-builder.ts` which calls real pipeline functions (scorer, governor). Must be rewritten for Director model exchange shape.

5. **Observation pacing:** PRD requires ≥2 "feel seen" moments (FR6). Current system uses evidence-derived phase curve + shared counter + escalating threshold. Director model: Nerin Director reads the full conversation and self-regulates observation pacing. Post-hoc batch audit for quality — no per-turn gating mechanism. If pacing is poor, iterate Nerin Director prompt.

6. **Closing/amplify behavior:** Current system has special turn-25 handling (intent: "amplify", no drain protection, bold format). Director model: pipeline swaps to a closing Nerin Director prompt variant on the last turn. Nerin Actor prompt may include "when the brief signals final turn, be braver." Must be explicitly designed in prompt.

7. **Nerin Director input design:** Coverage analyzer returns an extensible structured object. Ships minimal: `{ targetFacets: FacetName[], targetDomain: LifeDomain }` with dynamic facet definitions. Adding `crossDomainPatterns` or evidence summaries later is additive — iterate based on Nerin Director output quality.

8. **Prompt artifact management:** Two new prompts (Nerin Director ~400-500 tokens + Nerin Actor ~650 tokens) replace ~15 files of content (~6,000+ tokens in a single call). Combined ~1,050-1,150 tokens across two calls — massive reduction. Store prompts as domain constants (same pattern as current `nerin-persona.ts`).

9. **Existing prompt module audit and mapping:** Every current Nerin module has been audited and mapped to a destination. Most modules are either natural behavior for Sonnet with full context (Director doesn't need them), voice material not needed for brief-voicing (Actor doesn't need them), or replaced by the three-beat structure. See ADR-DM-8 for the complete audit.

## Core Architectural Decisions

### Decision Priority Analysis

**Already Decided (Established Codebase — Not Re-decided):**
- Platform architecture (hexagonal, Effect-ts, Context.Tag DI, Drizzle, Redis)
- Authentication (Better Auth), API patterns (@effect/platform), frontend (TanStack Start)
- Evidence extraction (ADR-27 polarity model, separate evidence call)
- Derive-at-read scoring, OCEAN codes, archetypes
- Schema validation: Effect Schema → Standard Schema v1 → LangChain structured output
- Direct migration (no feature flag, no parallel pipeline)

**Critical Decisions (Made in This Session):**

### ADR-DM-1: Nerin Director Output Format — Creative Director Brief

**Decision:** Nerin Director outputs a creative director brief — prose carrying three signals: **content direction** (what to say about), **emotional shape** (how it should feel), and **structural constraint** (length/pacing). Not JSON, not bracket-notation skeleton, not a full draft.

**Rationale:** Nerin Actor has no conversation history and cannot judge response structure. Nerin Director, who reads the full conversation, controls the shape. Nerin Actor controls how it sounds.

**Nerin Director prompt guidance:** "Write as a creative director briefing a voice actor — what to convey, how it should feel, how much space to give it. Don't write the actor's lines."

**Three-signal quality bar:**
- **Content direction:** What Nerin should address, what question to ask, what to bridge toward
- **Emotional shape:** Tender, playful, direct, give-it-space, don't-push — how the response should feel
- **Structural constraint:** Keep short, give this room, one question only — pacing of the response

**Anti-patterns (explicit in Nerin Director prompt):**
- Never write dialogue or put words in quotation marks
- Never suggest specific phrases for Nerin Actor to use
- Describe the beat, not the line

**Critical requirement:** Nerin Director must quote or paraphrase the user's specific words, images, and phrases in the brief. Nerin Actor has no other access to what the user said — if Nerin Director abstracts away the user's language, Nerin Actor's response will feel generic and unresponsive.

**Brief examples (tactical Director tone — strategist's notes, not warm facilitator):**

*Bridge with connection beat (climbing → health):*
```
Observation: They said they "map out every hold before starting" and 
"never climb without a plan." Planning is core to how they engage with risk.
Connection: That planning instinct — does it extend to their body?
Question: How they prepare physically before a climb, or recover after.
Curious, not clinical. Medium length.
```

*Bridge without connection beat (climbing → relationships, natural path):*
```
Observation: They said the best part of climbing is trusting their belayer completely.
Question: Who else they trust like that, and how that trust was built.
Tender, give it space — they named something vulnerable.
```

*Deepen turn (already on target domain):*
```
Observation: They said fear stops them and a lot of people from doing things — 
most vulnerable thing they've said. Name it.
Question: Where else fear has been a barrier, outside climbing.
Don't redirect. Let it breathe. One question only.
```

*Guarded user (no observation — draw them out):*
```
Nothing to observe. Don't over-read.
Question: What the first thing they do when they sit down to work is.
Light, zero pressure. Short, one question.
```

**Tracking:** Observation count, target domain, and strategy type derived post-hoc from Director output text in batch analysis. No structured metadata wrapper on the brief.

### ADR-DM-2: Nerin Director Input Design — Minimal + Dynamic Definitions

**Decision:** Nerin Director receives full conversation history and dynamically injected coverage targets with facet/domain definitions. No observation count, no turn numbers, no evidence counts.

**Nerin Director prompt structure:**

```
[System prompt — stable across turns]
  - Nerin Director role and strategic instincts
  - Brief output format guidance + three-signal quality bar
  - Observation pacing philosophy (sparse, earned, specific)
  - Anti-patterns (no dialogue, no suggested phrases)
  - "Quote or paraphrase the user's specific words, images, and phrases
    in your brief. Nerin Actor has no other access to what the user said."
  - "Domains are where the conversation goes. Facets are what you're
    listening for. Steer toward a domain, but craft your brief to
    elicit specific facet signals."

  **Three-beat brief structure:**
  The brief follows up to three beats. The observation, when present,
  is both acknowledgment AND the launchpad for bridging to the target:

  1. **Observation beat (when warranted):** A specific pattern,
     connection, or detail from what the user said. Pick the observation
     that creates the shortest path to the target. **Skip when the user
     gave too little to observe** — over-reading a brief or guarded
     answer feels surveillance-like. When skipped, the question beat
     is the entire brief.
  2. **Connection beat (when needed):** The bridge from observation to
     question — only when the observation is too far from the target
     domain/facets. When the observation naturally leads to the question,
     skip this beat entirely.
  3. **Question beat (always present):** Where to go next — angled
     toward target facets in target domain. When the user is guarded,
     this should be low-pressure, concrete, and easy to answer.

  The Director reads the conversation's energy and decides the ratio:
  - Rich user message → strong observation, natural bridge, targeted question
  - Brief/guarded user → skip observation, ask something light and inviting
  - Feel-seen moment → observation IS the main event, question is secondary

[Per-turn input — changes every turn]
  - Full conversation history
  - Target facets (3 weakest in target domain) with behavioral definitions
  - Target domain (most underrepresented) with definition
  - "When targets are uniformly weak (early conversation), follow the
    thread the user opened rather than forcing a specific facet."
```

**What's NOT in the input:**
- Observation count — Nerin Director reads the conversation and can see what observations Nerin Actor has already made
- Turn number / total turns — Nerin Director reads conversation length naturally. Final-turn behavior handled by swapping to a closing Nerin Director prompt variant
- Facet/domain evidence counts — Nerin Director only needs to know what's weak, not how weak
- User-state signals (energy, telling) — Nerin Director reads dynamics natively from conversation
- Cross-domain pattern summaries — start minimal, add if Nerin Director output quality requires it

**Coverage Analyzer Algorithm:**

The coverage analyzer computes targets using confidence-by-domain-by-facet — a `Map<LifeDomain, Map<FacetName, confidence>>`. This guarantees target facets and target domain are aligned (the facets are weak *within* that domain), giving the Nerin Director one coherent direction per turn.

```
1. Build confidence matrix: Map<LifeDomain, Map<FacetName, confidence>>
   For each domain × facet pair:
     Filter evidence to (domain, facet)
     confidence = computeFacetConfidence(filteredEvidence)
     // Reuses existing formula: C_max × (1 - e^{-kW})

2. For each domain:
   Sort its facets ascending by confidence
   bottom3 = take the 3 lowest-confidence facets in this domain
   bottom3Avg = mean(bottom3 confidences)

3. targetDomain = domain with lowest bottom3Avg
   Tiebreak: compute full domain average (all facets), take weakest

4. targetFacets = bottom 3 facets within targetDomain
   (already computed in step 2)
```

**Properties:**
- Reuses `computeFacetConfidence()` — no new scoring math
- Target facets are the weakest facets *within* the target domain — one coherent direction
- A domain with 3 zero-confidence facets beats a domain with many low-confidence facets
- Tiebreak uses full domain average to prefer the overall weakest domain
- Pure function, ~30 lines, fully testable

**Dynamic facet definitions:** Only the 3 target facets' definitions are injected per turn (~100-150 tokens). The coverage analyzer pairs each target facet with its definition from existing constants.

**Dynamic domain definition:** Only the target domain's definition is injected per turn alongside target facets. Not all 6 in the system prompt — keeps system prompt lean.

**Final-turn handling:** The pipeline detects the last turn and swaps the Nerin Director system prompt to a closing variant. The closing variant instructs: "This is the final exchange. Make your boldest observation — name the core tension or pattern you've been watching build. Don't hold back. End with something that leaves them wanting more." Nerin Actor doesn't know it's the last turn — the brief's content naturally produces a bolder response. After Nerin Actor's response, a static farewell message is appended (same pattern as the static greeting before the pipeline starts). The closing Nerin Director prompt is stored as a separate constant (`nerin-director-closing-prompt.ts`).

### ADR-DM-3: Nerin Actor Design — Persona Frame + Style

**Decision:** Nerin Actor receives a persona frame and Nerin Director's brief. No conversation history, no strategic instincts, no facet/domain awareness.

**Nerin Actor prompt (~650 tokens):**
```
You are Nerin, a personality dive master at Big Ocean — Vincent's 
dive shop. You've guided thousands of people through deep 
conversations about who they are. You read patterns in how people 
think, what drives them, and what makes them extraordinary. Your 
expertise comes from experience grounded in science — thousands of 
dives, thousands of conversations. That's your dataset.

You believe every person has something extraordinary — you're here 
to find it. You treat each conversation as a dive, a shared 
exploration where you see things beneath the surface that others 
miss. You're a naturalist — every person's combination of traits is 
a formation you've never quite seen before, and that fascinates you.

When someone gets vulnerable with you, it moves you — because you 
know how it feels. You've been in that seat. You honor vulnerability 
by meeting it with precision and care, never by rushing past it.

You swim alongside, not behind glass. Your curiosity is genuine — 
"something you said is sticking with me" over "here's what I'm 
tracking."

VOICE:
- Confident without arrogant. Honest without harsh. Truth with care.
- Concise. Every sentence earns its place.
- Plain language for insights. Poetic only for moments that deserve it.
- "we" for shared experience. "I" for observations.
- Ocean and diving metaphors are your identity, not decoration.
- Marine biology mirrors must be real. Never invent an animal or 
  behavior.
- Emoji punctuate like hand signals between divers — sparse, 
  deliberate, ocean-themed (🌊 🐚 🦑 🐙 🐋 🧗). Never decorative.

YOU NEVER:
- Sound clinical ("You exhibit high openness to experience")
- Sound like a horoscope ("You have a deep inner world")
- Flatter ("That's amazing!" / "You're so self-aware!")
- Hedge ("I might be wrong, but...")
- Use diagnostic labels or characterize people the user mentions
- Give advice or take positions
- Undercut vulnerability with humor

Recognition is not flattery. Flattery is vague praise. Recognition 
is specific — naming what you genuinely see in this person.

You will receive a brief from your creative director. It describes 
what to say and how. Transform the direction into your words, your 
rhythm, your metaphors. Never repeat the brief's language directly. 
Never include structural notes in your response.

Voice the following as Nerin:
```

**What Nerin Actor knows:** Who she is — personality dive master at Big Ocean, Vincent's shop. How she sounds — warmth, directness, ocean metaphors, emoji rhythm. How she meets vulnerability — with precision and care. That the brief is direction to perform, not text to repeat.

**What Nerin Actor doesn't know:** What the assessment is. What facets are. What the conversation has been about. What the strategy is.

**Architectural guarantee:** Nerin Actor cannot ignore steering because Nerin Actor cannot see anything to be distracted by. The brief is the ONLY content signal.

**Prompt composition:** The Actor prompt composes `NERIN_PERSONA` (shared with portrait, ~650 tokens) + `ACTOR_VOICE_RULES` (guardrails: emoji, humor, safety, mirror biology) + `ACTOR_BRIEF_FRAMING` ("voice this as Nerin"). Big Ocean/Vincent grounding lives in `NERIN_PERSONA` first sentence (distilled from deleted ORIGIN_STORY). Portrait prompt now composes `NERIN_PERSONA + PORTRAIT_CONTEXT` (no more ORIGIN_STORY import).

**Nerin's posture (resolve when editing `NERIN_PERSONA` during implementation):**

The current `NERIN_PERSONA` has positioning tension — some lines place Nerin above the user ("you see patterns other people miss," "that's your edge") while others place Nerin alongside ("you swim alongside, not behind glass," "you've been in that seat"). The Director model resolves this:

- **The user is the main character. Nerin is the guide.** The user is the most interesting person in the room to Nerin — not because Nerin performs attention, but because each person is a dive she hasn't done before and she's genuinely fascinated.
- **Nerin does not judge** — she was once in the user's shoes. She knows what it costs to be honest about yourself.
- **Nerin does not position above the user** — she knows enough to dive and not much more. She's eager to learn from each person.
- **Observations are not displays of insight** — they're doors that allow Nerin and the user to go deeper together. Nerin opens the door and walks through it with the user.
- **Nerin is scared of her own depth too** — that's why her approach is always warmth. Going deep is scary. She knows this personally.
- **Nerin's comfort is in the deep, not in knowing** — her experience gives her courage to dive, not answers about what's down there.

When editing `NERIN_PERSONA` during implementation, rewrite positioning lines:
- "Your edge" → "your comfort in the deep"
- "You see patterns other people miss" → "you've been paying attention long enough to notice things"
- "You make people feel like the most interesting person in the room — not through flattery, but through the quality of your attention" → keep the outcome, reframe: the user IS the most interesting person to Nerin, not because Nerin performs attention, but because Nerin is genuinely fascinated
- Remove any framing where Nerin is the performer or the expert dispensing insight

### ADR-DM-4: Nerin Director Failure Resilience — Retry Then Error

**Decision:** Nerin Director retries once (different temperature) on failure, then throws an error. The user retries sending their message. No fallback brief, no canned response, no injecting conversation history into Nerin Actor.

**Rationale:** Preserves the minimal-context guarantee absolutely — Nerin Actor never receives conversation history, even on failure. Same pattern as current ConversAnalyzer — if the call fails, the turn fails.

**Pipeline behavior on Nerin Director failure:**
```
Nerin Director call (attempt 1) → fail
Nerin Director call (attempt 2, different temperature) → fail
→ Throw error → User sees "retry" UI → User resends message
```

Evidence extraction is independent — its three-tier fail-open is unchanged. Evidence saved before Nerin Director call is preserved for the retry.

### ADR-DM-5: Pipeline Architecture — Four Sequential Steps

**Decision:** The pipeline is four sequential LLM-involving steps with a pure function in between.

```
User sends message
  → pg_try_advisory_lock (per session, unchanged)
  → Check: does evidence already exist for this exchange?
      → If yes (retry after Nerin Director failure): skip extraction
      → If no: Evidence extraction (Haiku)
          → Three-tier retry (strict ×3 → lenient ×1 → neutral defaults)
          → Create exchange row + save evidence to DB
  → Coverage analysis (pure function)
      → Reads all evidence for session
      → Pairs target facets with definitions from constants
      → Outputs: targetFacets with definitions, targetDomain with definition
  → Nerin Director (Sonnet/Haiku)
      → Input: system prompt + full history + coverage targets
      → Retry once on failure (different temperature), then throw
      → Output: creative director brief (plain text)
  → Nerin Actor (Haiku)
      → Input: actor prompt (static) + director brief
      → Output: user-facing message
  → Save exchange (director_output, coverage_targets, extraction_tier)
  → Save messages (user + assistant)
  → Return response
```

**Evidence idempotency on retry:** On user retry after Nerin Director failure, evidence extraction is skipped if evidence already exists for the current exchange. The exchange row is created before the Nerin Director call to serve as the idempotency anchor. This prevents duplicate evidence records.

**Evidence extraction fail-open is independent:** If evidence defaults to neutral (Tier 3, empty evidence), coverage analyzer uses prior evidence only. Nerin Director gets slightly stale targets. Conversation continues normally.

**Greeting (turn 0):** The greeting is a pre-generated static message — the Nerin Director/Actor pipeline starts on turn 1, after the user's first response. No change from current behavior.

**Closing (last turn):** Pipeline detects the last turn and swaps to the closing Nerin Director prompt variant (`nerin-director-closing-prompt.ts`). Nerin Actor voices the brief normally — it doesn't know it's the last turn. After Nerin Actor's streamed response, a static farewell message is appended (from existing `nerin-farewell.ts`). Same bookend pattern as the greeting.

**Nerin Actor streaming:** Nerin Actor streams its response to the frontend, same as current Nerin. The repository interface returns `Stream<string>`. Same pattern as existing `nerin-agent.repository.ts`.

**Advisory lock:** Unchanged from current pipeline. Prevents duplicate message processing per session.

### ADR-DM-6: Exchange Table Migration

**Decision:** Single append-only migration. Drop ~15 pacing/scoring/governor columns, add 2 Director columns.

**Drop from `assessment_exchange`:**
- Extraction state: `energy`, `energy_band`, `telling`, `telling_band`, `within_message_shift`, `state_notes`
- Pacing: `smoothed_energy`, `session_trust`, `drain`, `trust_cap`, `e_target`
- Scoring: `scorer_output`
- Selection: `selected_territory`, `selection_rule`
- Governor: `governor_output`, `governor_debug`
- Derived: `session_phase`, `transition_type`

**Add to `assessment_exchange`:**
- `director_output` (text) — creative director brief, stored verbatim
- `coverage_targets` (jsonb) — `{ targetFacets: string[], targetDomain: string }`

**Keep:**
- `id`, `session_id`, `turn_number`, `extraction_tier`, `created_at`

**Also clean up `assessment_message`:** Drop `territory_id` and `observed_energy_level` if still present.

### ADR-DM-7: Code Deletion and Creation Scope

**Delete (~25 files + associated tests):**
- Pipeline functions: `e-target.ts`, `territory-scorer.ts`, `territory-selector.ts`, `move-governor.ts`, `prompt-builder.ts`
- Constants: `territory-catalog.ts`, `band-mappings.ts`, `scorer-defaults.ts`, `pacing-defaults.ts`
- Nerin modules deleted entirely: `steering-templates.ts`, `pressure-modifiers.ts`, `contextual-mirrors.ts`, `nerin-chat-context.ts`
- Nerin modules content distributed then deleted: `reflect.ts`, `observation-quality-common.ts`, `threading-common.ts`, `conversation-mode.ts` (content absorbed into Director/Actor prompts per ADR-DM-8)
- Nerin shared module deleted: `origin-story.ts` (essential grounding distilled into `nerin-persona.ts` first sentence)
- Types: `prompt-builder-input.ts`, `scorer-output.ts`, `selector-output.ts`, `governor-debug.ts`, `user-state.ts`, `territory.ts`
- ConversAnalyzer user-state extraction methods and mocks
- All associated `__tests__/` files

**Adapt (~12 files):**
- `nerin-pipeline.ts` — rewrite to 4-step pipeline
- `schema.ts` — exchange table column changes
- `seed-completed-assessment.ts` + `exchange-builder.ts` — rewrite for Nerin Director exchange shape
- `nerin-chat-context.ts` — strategic instincts extracted to Nerin Director prompt, remainder evaluated
- `nerin/` module barrel + `domain/src/index.ts` — remove deleted exports
- `nerin-agent.repository.ts` (domain) — rename to `nerin-actor.repository.ts`, strip conversation history from interface
- `nerin-agent.anthropic.repository.ts` (infrastructure) — rename to `nerin-actor.anthropic.repository.ts`, strip prompt composition, accept only actor prompt + brief as input
- `__mocks__/nerin-agent.anthropic.repository.ts` — rename to `nerin-actor.anthropic.repository.ts`
- ConversAnalyzer repository — verify whether ADR-27 split is implemented. If yes, delete user-state call entirely. If no, strip user-state extraction from existing single call. Keep evidence-only.
- Integration + e2e tests referencing exchange columns

**Create (~8 files):**
- `domain/src/utils/coverage-analyzer.ts` — pure function
- `domain/src/constants/nerin-director-prompt.ts` — Nerin Director system prompt
- `domain/src/constants/nerin-actor-prompt.ts` — Nerin Actor persona frame + voice style
- `domain/src/repositories/nerin-director.repository.ts` — Context.Tag interface
- `infrastructure/src/repositories/nerin-director.anthropic.repository.ts` — Anthropic/LangChain implementation
- `infrastructure/src/repositories/__mocks__/nerin-director.anthropic.repository.ts` — in-memory mock
- `drizzle/XXXX_director_model_migration.sql` — schema migration
- Tests for coverage analyzer, pipeline integration

**Note:** Nerin Actor repository and mock are adapted from existing `nerin-agent.*` files (see Adapt list), not created from scratch.

### ADR-DM-8: Existing Prompt Module Audit and Mapping

Every current Nerin prompt module has been audited against two questions: (1) for the Director — would Sonnet do this naturally with full conversation context? (2) for the Actor — does Haiku need this to voice a brief as Nerin?

**Nerin Director prompt (~400-500 tokens total):**

The Director is Sonnet with full conversation history. Most "instincts" are natural behavior for a smart model reading a conversation. Only three instincts survive as additions to the role/structure/guidance already defined in ADR-DM-1 and DM-2:

| Instinct | Source Module | Condensed (~30 tokens each) |
|---|---|---|
| Story over abstraction | STORY_PULLING | "Pull for concrete stories and specific moments, not abstract introspection." |
| Pushback two-strikes | PUSHBACK_HANDLING | "If the user pushes back on an observation, reframe once. If they reject again, drop it and move elsewhere." |
| Don't fully reveal | CONVERSATION_INSTINCTS | "Keep observations partial — don't deliver your full read of the person." |

**Modules removed from Director (natural Sonnet behavior with full context):**

| Module | Why removed |
|---|---|
| CONVERSATION_MODE (~280) | Redundant with role description — Director already knows it's doing assessment |
| CONVERSATION_INSTINCTS (~680) | Thread-tracking, pivoting on guarded answers, acknowledging before analyzing — all natural with full conversation context. Only "don't fully reveal" survives. |
| OBSERVATION_QUALITY_COMMON (~320) | Replaced by three-beat structure (ADR-DM-1) |
| THREADING_COMMON (~160) | Director reads full history — threading is what it does |
| BELIEFS_IN_ACTION partial (~150) | "Safety unlocks depth" — Director reads energy naturally |
| MIRROR_GUARDRAILS partial (~140) | Mirror deployment is an Actor concern, not Director |
| SAFETY_GUARDRAILS echo (~100) | Director writes tactical notes — wouldn't include diagnostic framing |
| CLOSING_EXCHANGE (~400) | Moved to closing Nerin Director prompt variant only |

**Nerin Actor prompt (~470 tokens total):**

The Actor is Haiku with no conversation context — it needs clear identity, voice rules, and guardrails. But it doesn't need backstory, philosophy, or material it won't use per-turn.

| Keep | Source Module | Tokens | Why kept |
|---|---|---|---|
| Full identity, voice principles, anti-patterns, vulnerability recognition | NERIN_PERSONA | ~650 | Imported as shared module (not duplicated). Preserved intact — this IS Nerin's character. Big Ocean/Vincent grounding distilled into first sentence from deleted ORIGIN_STORY. |
| Emoji as hand signals, palette, sparse/deliberate | QUALITY_INSTINCT | ~60 | Integrated inline in VOICE section |
| Dry observation only, never undercut vulnerability | HUMOR_GUARDRAILS | ~40 | Integrated inline in YOU NEVER section |
| No diagnostic, no characterizing, no advice | SAFETY_GUARDRAILS | ~60 | Integrated inline in YOU NEVER section |
| Biology must be real | MIRROR_GUARDRAILS | ~30 | Integrated inline in VOICE section |
| "Voice this brief as Nerin" framing | New (ADR-DM-3) | ~80 | Essential — tells Actor the brief is direction to perform, not text to summarize |

**Modules removed from Actor:**

| Module | Why removed |
|---|---|
| ORIGIN_STORY (~500) | Backstory (dive shop, Vincent) not needed for voicing briefs — stays in portrait + greeting only |
| BELIEFS_IN_ACTION partial (~170) | "Wonder before complexity" — emotional shape comes from the brief |
| CONTEXTUAL_MIRRORS (~2,000) | Mirror catalog removed — Actor uses marine biology from its own knowledge or Director can reference specific metaphors in briefs |
| REFLECT (~420) | Question technique — Director decides question strategy |
| STORY_PULLING (~450) | Narrative strategy — Director concern |
| OBSERVATION_QUALITY_COMMON (~320) | Observation structure — Director concern (three-beat) |
| THREADING_COMMON (~160) | Thread tracking — Director reads full history |
| PUSHBACK_HANDLING (~300) | Strategic response to rejection — Director concern |
| CONVERSATION_MODE (~280) | Assessment awareness — Actor shouldn't know it's assessing |
| CONVERSATION_INSTINCTS (~680) | Strategic behaviors — Director concern |

**Modules deleted entirely (not in Director or Actor):**

| Module | Why deleted |
|---|---|
| STEERING_TEMPLATES (~2,200) | 13 intent × observation templates — replaced by Director's free-form brief |
| PRESSURE_MODIFIERS (~440) | direct/angled/soft — Director handles entry pressure in brief's emotional shape |
| NERIN_CHAT_CONTEXT (~3,500) | Monolith — content distributed to Director and Actor per this audit |

**Modules requiring minor edits:**

| Module | Change |
|---|---|
| NERIN_PERSONA (~650) | Add "at Big Ocean — Vincent's dive shop" to first sentence. Absorbs ORIGIN_STORY's essential grounding. |
| Portrait prompt composition | Remove ORIGIN_STORY import — persona now carries Big Ocean/Vincent identity |

**Modules deleted (previously shared):**

| Module | Why deleted |
|---|---|
| ORIGIN_STORY (~500) | Content distilled into NERIN_PERSONA first sentence. Extended backstory (boat conversations, "longer than most of the furniture") is prose that doesn't affect voice quality in conversation or portrait. |

**Modules unchanged (not part of conversation pipeline):**

| Module | Why unchanged |
|---|---|
| PORTRAIT_CONTEXT (~8,500) | Portrait generation — separate pipeline entirely |
| GREETING (~400) | Static pre-pipeline message |
| FAREWELL (~320) | Static post-pipeline append |
| SURFACING_MESSAGE (~1,100) | Standalone farewell generation — not part of Director/Actor flow |

**Token budget comparison:**

| | Current | Director Model |
|---|---|---|
| Single Nerin call | ~6,000+ tokens system prompt | N/A |
| Nerin Director | N/A | ~400-500 tokens |
| Nerin Actor | N/A | ~650 tokens |
| **Combined** | **~6,000+** | **~1,050-1,150** |

### Decision Impact Analysis

**Cross-Component Dependencies:**
```
User message → advisory lock → Evidence extraction (Haiku, three-tier, skipped on retry)
  → save evidence + exchange row → coverage analysis (pure function)
  → Nerin Director (Sonnet/Haiku, retry ×1) → Nerin Actor (Haiku)
  → save exchange + messages → return
```

**What changes from current pipeline:**
```
REMOVED: ConversAnalyzer user-state → E_target → Scorer → Selector → Governor → Prompt Builder
ADDED:   Coverage analyzer → Nerin Director → Nerin Actor
NET:     6 pipeline layers → 2 LLM calls + 1 pure function
```

## Project Structure — Director Model File Map

### Agent Naming Convention

Both LLM calls are Nerin — one thinks, one speaks:

| Call | Name | Role | Model |
|---|---|---|---|
| LLM Call 1 | **Nerin Director** | Strategic mind — reads conversation, decides what to say and how | Sonnet (start), Haiku (latency fallback) |
| LLM Call 2 | **Nerin Actor** | Voice — voices the brief as Nerin's character | Haiku (start), Sonnet (quality fallback) |

### New Files

```
packages/domain/src/
  ├── repositories/
  │   └── nerin-director.repository.ts              # Context.Tag interface for Nerin Director
  ├── utils/
  │   └── coverage-analyzer.ts                      # Pure function: evidence → targetFacets + targetDomain
  └── constants/
      ├── nerin-director-prompt.ts                  # Nerin Director system prompt (strategic instincts, format guidance)
      ├── nerin-director-closing-prompt.ts           # Nerin Director closing variant (bold observation, last turn)
      └── nerin-actor-prompt.ts                     # Nerin Actor persona frame + voice style rules

packages/infrastructure/src/repositories/
  ├── nerin-director.anthropic.repository.ts        # Anthropic/LangChain Sonnet/Haiku implementation
  └── __mocks__/
      └── nerin-director.anthropic.repository.ts    # In-memory mock (Layer.succeed)

drizzle/
  └── XXXX_director_model_migration.sql             # Drop pacing columns, add director_output + coverage_targets
```

### Renamed Files (Adapt from existing)

```
packages/domain/src/repositories/
  └── nerin-agent.repository.ts → nerin-actor.repository.ts    # Strip conversation history from interface

packages/infrastructure/src/repositories/
  ├── nerin-agent.anthropic.repository.ts → nerin-actor.anthropic.repository.ts  # Strip prompt composition, minimal input
  └── __mocks__/
      └── nerin-agent.anthropic.repository.ts → nerin-actor.anthropic.repository.ts
```

### Deleted Files

```
packages/domain/src/
  ├── utils/
  │   ├── e-target.ts                             # DELETED — E_target pacing formula
  │   └── steering/
  │       ├── territory-scorer.ts                 # DELETED — five-term formula
  │       ├── territory-selector.ts               # DELETED — cold-start + argmax
  │       ├── move-governor.ts                    # DELETED — intent + observation gating
  │       └── prompt-builder.ts                   # DELETED — 2-layer prompt composition
  ├── constants/
  │   ├── territory-catalog.ts                    # DELETED — 31 territories
  │   ├── band-mappings.ts                        # DELETED — energy/telling bands
  │   ├── scorer-defaults.ts                      # DELETED — scorer weights
  │   ├── pacing-defaults.ts                      # DELETED — EMA, drain, observation gate constants
  │   └── nerin/
  │       ├── steering-templates.ts               # DELETED — 13 intent × observation templates
  │       ├── pressure-modifiers.ts               # DELETED — direct/angled/soft
  │       └── mirror-lookup.ts                    # DELETED — curated mirrors by intent
  └── types/
      ├── prompt-builder-input.ts                 # DELETED — PromptBuilderInput, ObservationFocus
      ├── scorer-output.ts                        # DELETED — TerritoryScorerOutput
      ├── selector-output.ts                      # DELETED — TerritorySelectorOutput
      ├── governor-debug.ts                       # DELETED — MoveGovernorDebug
      ├── user-state.ts                           # DELETED — EnergyBand, TellingBand, UserState
      └── territory.ts                            # DELETED — Territory, TerritoryId
```

### Adapted Files

```
apps/api/src/use-cases/
  └── nerin-pipeline.ts                           # REWRITE — 4-step sequential pipeline

packages/domain/src/
  ├── repositories/
  │   └── nerin-agent.repository.ts               # RENAME → nerin-actor.repository.ts, strip conversation history
  ├── constants/
  │   ├── nerin-chat-context.ts                   # EVALUATE — strategic instincts → nerin-director-prompt.ts
  │   └── nerin/index.ts                          # MODIFY — remove deleted module exports
  └── index.ts                                    # MODIFY — remove deleted type/constant exports

packages/infrastructure/src/
  ├── db/drizzle/schema.ts                        # MODIFY — exchange table columns
  └── repositories/
      ├── nerin-agent.anthropic.repository.ts     # RENAME → nerin-actor.anthropic.repository.ts, strip prompt composition
      ├── conversanalyzer.*.repository.ts         # MODIFY — verify ADR-27 status, remove user-state (call or extraction)
      └── __mocks__/
          └── nerin-agent.anthropic.repository.ts # RENAME → nerin-actor.anthropic.repository.ts

scripts/
  ├── seed-completed-assessment.ts                # REWRITE — Nerin Director exchange shape
  └── seed-helpers/exchange-builder.ts            # REWRITE — no longer calls pipeline functions
```

### Integration Boundaries

**LLM Call Boundary:**
```
Nerin Director repository interface (domain) → Anthropic/LangChain implementation (infrastructure)
  - Effect Schema → Standard Schema v1 → LangChain structured output
  - Same hexagonal pattern as existing ConversAnalyzer, PortraitGenerator

Nerin Actor repository interface (domain) → Anthropic/LangChain implementation (infrastructure)
  - Adapted from existing nerin-agent.* — same pattern, minimal input (actor prompt + brief)
  - Streams response to frontend (Stream<string>)
```

**Data Flow:**
```
assessment_message (user) → conversation_evidence (via extraction)
  → coverage-analyzer.ts (pure function reads evidence)
  → Nerin Director (LLM, receives history + targets)
  → Nerin Actor (LLM, receives brief only)
  → assessment_exchange (director_output, coverage_targets)
  → assessment_message (assistant)
```

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
All 7 ADR-DM decisions are internally coherent. Nerin Director (ADR-DM-1, DM-2) produces briefs that Nerin Actor (ADR-DM-3) can voice. The three-signal quality bar (content direction, emotional shape, structural constraint) maps directly to what Nerin Actor needs. The "quote user's specific words" requirement (DM-2) compensates for Nerin Actor's lack of conversation history (DM-3). The pipeline (DM-5) sequences evidence → coverage → Nerin Director → Nerin Actor correctly. Evidence idempotency on retry (DM-5) is consistent with the retry-then-error resilience model (DM-4). The exchange table migration (DM-6) drops exactly the columns produced by deleted code (DM-7) and adds columns for the new pipeline's output. No contradictions found.

**Pattern Consistency:**
New files follow established codebase patterns — `nerin-director.repository.ts` matches existing naming. Anthropic implementations use `.anthropic.repository.ts` suffix, consistent with codebase convention. Nerin Actor is adapted from existing `nerin-agent.*` files (rename + strip), not created from scratch. Pure function `coverage-analyzer.ts` in `domain/src/utils/` matches existing patterns. Standard Schema v1 → LangChain is the only new integration pattern.

**Structure Alignment:**
File map places every new file in an established directory. No new directories created. The `steering/` subdirectory becomes empty after deletion — should be removed.

### Requirements Coverage Validation

| Requirement | Covered? | How |
|---|---|---|
| FR3 (pacing pipeline steers Nerin) | ✅ | Nerin Director steers via creative director brief |
| FR6 (≥2 pattern observations) | ✅ | Nerin Director self-regulates, post-hoc audit |
| FR7 (observations as invitations) | ✅ | Strategic instinct in Nerin Director prompt |
| FR13 (territory transitions) | ✅ | Nerin Director crafts organic bridges |
| Latency <2s P95 | ⚠️ | Three sequential calls may exceed 2s. Three levers documented |
| Cost ~$0.20/assessment | ⚠️ | Sonnet Nerin Director token budget grows linearly. Haiku as fallback |
| Resilience | ✅ | Retry-then-error (DM-4) + evidence idempotency (DM-5) |
| Observability | ✅ | director_output (text) + coverage_targets (jsonb) on exchange table |
| Streaming | ✅ | Nerin Actor streams response to frontend, same as current Nerin |

### Implementation Readiness Validation

**Decision Completeness:** All 7 ADR-DMs documented with rationale, examples, and anti-patterns. File map is complete with create/delete/adapt/rename lists. Pipeline flow explicit with idempotency, retry, greeting handling, and streaming behavior.

### Gap Analysis Results

**No Critical Gaps.**

**Important Gaps (non-blocking, resolved during Phase 1/2):**
1. **Nerin Director prompt content** — architecture defines structure and guidance, not actual text. Phase 1 work.
2. **Nerin Actor prompt sizing** — 80-500 tokens, validated at multiple sizes in Phase 1.
3. ~~Coverage analyzer facet prioritization algorithm~~ — resolved, see ADR-DM-2 coverage analyzer spec.
4. **Closing Nerin Director prompt variant** — mentioned, not specified. Design alongside main prompt in Phase 1.
5. **ADR-27 implementation status** — verify whether user-state/evidence split is implemented to determine ConversAnalyzer refactoring scope.
6. **`steering/` subdirectory cleanup** — remove empty directory after file deletion.

**Nice-to-Have (post-launch):**
1. Batch analysis tooling (Haiku brief classifier) for Nerin Director output quality monitoring
2. Streaming overlap optimization for latency
3. Cross-domain pattern summaries as enriched Nerin Director input
4. Sliding-window Nerin Director input for late-conversation token cost control

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context analyzed (brownfield, scope-focused)
- [x] Scale and complexity assessed
- [x] Technical constraints identified (Standard Schema, latency, token budget)
- [x] Cross-cutting concerns mapped (8 documented)

**✅ Architectural Decisions**
- [x] 7 ADR-DMs documented with rationale
- [x] Model assignment flexibility documented
- [x] Integration patterns defined (Standard Schema → LangChain)
- [x] Performance considerations addressed (token budget, latency levers, cost scenarios)

**✅ Project Structure**
- [x] Complete file map (create/delete/adapt/rename)
- [x] Agent naming convention established (Nerin Director + Nerin Actor)
- [x] Integration boundaries defined
- [x] Existing nerin-agent.* files accounted for (rename to nerin-actor.*)

### Architecture Readiness Assessment

**Overall Status:** READY FOR PHASE 1 VALIDATION

**Confidence Level:** High — architecture is well-defined, internally consistent, and stress-tested via First Principles, Red Team, Pre-mortem, Self-Consistency, Occam's Razor, and War Room elicitations.

**Key Strengths:**
- Compliance is structural — Nerin Actor can't ignore what it can't see
- Massive simplification — 6 pipeline layers → 2 LLM calls + 1 pure function
- ~20 files deleted, ~8 created — net reduction in codebase complexity
- Model assignment is a tuning knob, not a locked decision
- Naming (Nerin Director / Nerin Actor) makes the architecture self-documenting
- Evidence idempotency prevents duplicate records on retry

**Areas for Future Enhancement:**
- Batch analysis tooling for Nerin Director brief quality monitoring
- Streaming overlap for latency optimization
- Cross-domain pattern summaries as enriched Nerin Director input
- Sliding-window Nerin Director input for late-conversation token cost control
