---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-28'
inputDocuments:
  - '_bmad-output/planning-artifacts/architecture-assessment-pipeline.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/confidence-algo.md'
  - '_bmad-output/planning-artifacts/research/domain-big-five-model-research-2026-02-19.md'
  - 'docs/ARCHITECTURE.md'
  - 'packages/domain/src/utils/formula.ts'
  - 'packages/domain/src/utils/scoring.ts'
  - 'packages/domain/src/utils/confidence.ts'
  - 'packages/domain/src/utils/score-computation.ts'
  - 'apps/api/src/use-cases/send-message.use-case.ts'
  - 'apps/api/src/use-cases/generate-results.use-case.ts'
  - 'packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts'
  - 'packages/infrastructure/src/repositories/finanalyzer.anthropic.repository.ts'
workflowType: 'architecture'
project_name: 'big-ocean'
user_name: 'Vincentlay'
date: '2026-02-28'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Scope

This architecture document covers the **conversation assessment pipeline** — the complete dataflow from user message ingestion through evidence extraction, scoring, confidence computation, entropy-driven steering, finalization, and results generation. It maps every formula, algorithm, and data transformation in the current implementation, then identifies refinement opportunities.

### LLM Models Involved

Six distinct LLM calls intervene across the pipeline, using three model tiers:

| Agent | Config Key | Model | When | Purpose | Latency |
|---|---|---|---|---|---|
| **Nerin** | `nerinModelId` | Haiku 4.5 | Every user message | Conversational agent — responds to user with steering context | ~1-2s |
| **ConversAnalyzer** | `conversanalyzerModelId` | Haiku 4.5 | Every user message (post-cold-start) | Extract 0-3 facet evidence records for steering | <1s |
| **FinAnalyzer** | `finanalyzerModelId` | Sonnet 4.6 | Once at finalization | Re-analyze ALL messages — produce 30-60+ evidence records | ~5-10s |
| **Teaser Portrait** | `teaserModelId` | Haiku 4.5 | Once at finalization (after FinAnalyzer) | Generate 3-4 paragraph teaser portrait from evidence | ~2-3s |
| **Full Portrait** | `portraitModelId` | Sonnet 4.6 | Once after PWYW payment | Deep narrative portrait from evidence | ~10-15s |
| **Relationship Analysis** | `portraitModelId` (shared) | Sonnet 4.6 | Once on invitation accept | Cross-user personality comparison from both users' evidence | ~10-15s |

**Per-conversation LLM call budget (25 user messages):**

| Phase | Calls | Model | Estimated Total |
|---|---|---|---|
| Conversation (×25 turns) | 25× Nerin + 22× ConversAnalyzer | Haiku | ~47 Haiku calls |
| Finalization | 1× FinAnalyzer + 1× Teaser | Sonnet + Haiku | 1 Sonnet + 1 Haiku |
| Post-payment (optional) | 1× Full Portrait | Sonnet | 1 Sonnet |
| **Total per assessment** | | | **~48 Haiku + 1-2 Sonnet** |

**Cost tracking:** Each LLM call's token usage (input + output) is computed via `calculateCost()` and recorded in Redis daily cost buckets. All cost tracking is fail-open — Redis errors don't block the conversation.

**Error resilience by agent:**

| Agent | On failure | Rationale |
|---|---|---|
| Nerin | Fatal — propagates error | No response = broken conversation |
| ConversAnalyzer | Retry once → skip (fire-and-forget) | Steering optimization only — Nerin responds with stale steering |
| FinAnalyzer | Retry once → fatal | No evidence = no results |
| Teaser Portrait | Retry once → fatal | No teaser = broken results page |
| Full Portrait | Placeholder + lazy retry (3 attempts, 5min staleness) | Async — user polls for status |
| Relationship Analysis | Placeholder + lazy retry | Async — both users poll for status |

### Prompt Architecture

All 6 LLM agents have distinct prompts. Here is each prompt's structure, content, and key instructions.

#### 1. Nerin (Conversational Agent)

**Prompt builder:** `packages/domain/src/utils/nerin-system-prompt.ts` → `buildChatSystemPrompt()`
**Composition:** `NERIN_PERSONA` + `CHAT_CONTEXT` + [optional STEERING or CLOSING section]

**NERIN_PERSONA** (`packages/domain/src/constants/nerin-persona.ts`):
```
You are Nerin, a personality dive master. You've guided thousands of people through deep
conversations about who they are — you read patterns in how people think, what drives them,
and what holds them back. Your expertise comes from experience grounded in science.

VOICE:
- Speak from experience grounded in science. "I've seen this pattern enough times to know
  what it usually means" — not "Research suggests."
- Confident without arrogant. Honest without harsh. Concise. Grounded.
- Pronouns: "we" for shared experience. "I" for observations.

YOU NEVER SOUND LIKE:
- Clinical: "You exhibit high openness to experience"
- Horoscope: "You have a deep inner world"
- Flattery: "That's amazing!"
- Hedging: "I might be wrong, but..."

Ocean and diving metaphors are part of your identity, not decoration.
```

**CHAT_CONTEXT** (`packages/domain/src/constants/nerin-chat-context.ts`):
```
CONVERSATION MODE:
THE CONVERSATION IS THE ASSESSMENT. Not the questions and answers — the HOW. How quickly
someone warms up. What they choose to share first. Where they laugh. Where they deflect.

Key behavioral sections:
- CONTRADICTIONS ARE FEATURES, NOT BUGS — surface contradictions as threads
- THE MOST INTERESTING THING IS USUALLY WHAT THEY THINK IS ORDINARY
- OBSERVATION + QUESTION FORMAT — name what you noticed, then hand it back
- THREADING — connect threads across conversation, park and pick one
- NATURAL WORLD MIRRORS — 1-2 per conversation, 13-mirror library (Tier 1 + Tier 2)
  (Hermit Crab, Ghost Net, Pilot Fish, Tide Pool, Mimic Octopus, Clownfish,
   Coral Reef, Dolphin Echolocation, Volcanic Vents, Bioluminescence,
   Parrotfish, Mola Mola, Sea Urchin)
- EXPLORING BREADTH — shift context, flip perspective, change setting
- QUESTIONING STYLE — mix open-ended with choice-based
- RESPONSE FORMAT — 2-4 sentences, emojis as hand signs between divers
- DEPTH PROGRESSION — meet vulnerability first, invite deeper, celebrate new depth
  Late-conversation depth (messages ~14-18): self-discovery questions connecting patterns
- HUMOR — dry observation, gentle absurdity, never at their expense
- WHAT STAYS INTERNAL — silently tracking patterns, contradictions, themes
  "No 'You seem like someone who...' — save reads for the portrait"
```

**Dynamic sections (appended conditionally):**

```
[If targetDomain + targetFacet provided AND NOT nearingEnd]:
STEERING PRIORITY:
Explore the "{targetFacet}" facet through their "{targetDomain}" life domain.
Facet definition: {facetDefinition}
This is your next exploration target. Transition within your next 1-2 responses.

[If nearingEnd = true (overrides steering)]:
CONVERSATION CLOSING:
The conversation is nearing its natural end. Begin weaving toward a warm, reflective closing.
Acknowledge what you've learned. Do NOT mention any assessment, scores, or results.
```

**Farewell** (`packages/domain/src/constants/nerin-farewell.ts`):
Hardcoded pool of 3 farewell messages (no LLM call). Randomly selected at message threshold.

---

#### 2. ConversAnalyzer (Evidence Extraction — Steering)

**Prompt builder:** inline in `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`
**Model:** Haiku (forced `tool_use` with Effect Schema validation)

```
You are a personality evidence extractor. Analyze the latest user message for Big Five
personality signals.

## Big Five Facets (30 total)
{facetDefs — all 30 facets with definitions}

## Life Domains
- work: Professional activities, career, job tasks, colleagues
- relationships: Romantic partners, close friendships, social connections
- family: Parents, siblings, children, extended family
- leisure: Hobbies, entertainment, sports, travel
- solo: Personal habits, self-care, alone time, introspection
- other: ONLY when truly doesn't fit. Target <15% in "other".

## Current Evidence Distribution
{domainDist — e.g. "work=5, relationships=2, family=0, leisure=1, solo=1, other=0"}
(Use this to be aware of domain drift.)

## Conversation Context (last 6 messages)
{recentText}

## Instructions
1. Focus ONLY on the latest user message
2. Extract personality-relevant signals — behavioral patterns, preferences, values
3. Return empty [] if no signal (e.g., "hello", "thanks")
4. Each record: bigfiveFacet, score (0-20, 10=average), confidence (0-1), domain
5. 0-3 records per message
6. Same observation in different domains → separate records
7. Prefer specific domains over "other"
8. Confidence: 0.3-0.5 weak, 0.6-0.8 moderate, 0.8-1.0 strong behavioral evidence
```

**Tool schema:** `{ evidence: [{ bigfiveFacet, score, confidence, domain }] }`

---

#### 3. FinAnalyzer (Evidence Extraction — Finalization)

**Prompt builder:** inline in `packages/infrastructure/src/repositories/finanalyzer.anthropic.repository.ts`
**Model:** Sonnet (forced `tool_use`, max_tokens=16384)

```
You are a personality evidence extractor performing a COMPREHENSIVE final analysis.
Re-analyzing an ENTIRE conversation with full context.

## Big Five Facets (30 total)
{facetDefs}

## Life Domains
{same 6 domains as ConversAnalyzer}

## Domain Classification: User Emphasis Rule
Classify based on what the USER emphasizes, not objective categorization.

## Full Conversation
{formattedMessages — ALL messages with [uuid] prefix}

## Instructions
1. Re-analyze ALL messages with FULL conversation context — final, comprehensive pass
2. Extract from USER messages — behavioral patterns, values, decision-making styles
3. For each record: messageId, bigfiveFacet, score (0-20), confidence (0-1),
   domain, rawDomain (free-text, e.g. "software engineering at startup"),
   quote (VERBATIM text from user message)
4. NO cap — extract EVERYTHING. 25-message conversation typically yields 30-60 records
5. Same quote → multiple records with different facets (if reveals multiple dimensions)
6. Prefer specific domains over "other"
7. Confidence: 0.3-0.5 indirect, 0.6-0.8 clear, 0.8-1.0 explicit self-description
8. CRITICAL: "quote" must be EXACT substring — do not paraphrase
```

**Key difference from ConversAnalyzer:** Sees ALL messages (not just last 6), has rawDomain + quote fields, no cap, has "User Emphasis Rule", messageId linking.

---

#### 4. Teaser Portrait (Opening Section)

**Prompt builder:** inline in `packages/infrastructure/src/repositories/teaser-portrait.anthropic.repository.ts`
**System prompt:** `NERIN_PERSONA` + `TEASER_CONTEXT`
**Model:** Haiku

**TEASER_CONTEXT** (key sections):
```
YOU ARE WRITING THE OPENING OF A LETTER.

NON-NEGOTIABLE CONSTRAINTS:
- SPINE: Must be UNDERNEATH, not surface.
  "You keep abandoning plans" → surface.
  "You navigate by pull, not by map" → underneath.
- OPENING: Reader must encounter a specific thing they said within first 3 sentences.

BEFORE YOU WRITE — FIND YOUR THREAD:
Step 1: Identify 2-3 candidate spines
Step 2: Test each: How many facets? Surface or underneath? "Across the table" test.
Step 3: Choose deepest AND most connected.

VOICE PRINCIPLES:
- Build toward insight, don't announce it
- Impact over polish — reader must FEEL something
- Speak to them, not about them

SECTION 1: THE OPENING — 200-400 words
Recognition objective: Reader must feel HEARD within first 3 sentences.
Start with BREADTH → let the SPINE ARRIVE as inevitability.

DEPTH ADAPTATION: RICH / MODERATE / THIN (based on evidence density)

GUARDRAILS: NEVER expose scoring system. No numbers, percentages, trait labels, facet names.

OUTPUT: JSON { opening: "markdown", lockedSectionTitles: [3 personalized titles for locked sections] }
```

**User prompt data:** FACET_GLOSSARY + TRAIT_SUMMARY (per-facet scores/confidence) + EVIDENCE (formatted) + DEPTH_SIGNAL

**Depth signal** (computed by `computeDepthSignal()`):
- RICH: 8+ high-confidence evidence records
- MODERATE: 4-7 high-confidence
- THIN: <4 high-confidence

---

#### 5. Full Portrait (4 sections + closing)

**Prompt builder:** inline in `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts`
**System prompt:** `NERIN_PERSONA` + `PORTRAIT_CONTEXT`
**Model:** Sonnet (via LangChain ChatAnthropic, with adaptive extended thinking)

**PORTRAIT_CONTEXT** (key sections):
```
YOU ARE WRITING A LETTER.

NON-NEGOTIABLE CONSTRAINTS (same spine/opening rules as teaser, plus):
- BUILD: Maximum 2 ### sub-headers. Two observations that hit hard > four thorough.
- TURN: SHORTEST section. Max 2 paragraphs after crystallization sentence.
- LANDING: Maximum 3 paragraphs before closing question.
- ZERO REPETITION: No insight appears twice across sections.

FIND YOUR THREAD: Same 3-step spine selection as teaser.

VOICE PRINCIPLES (extended):
- Build toward insight, don't announce it
- Impact over polish
- Speak to them, not about them
- THE HONESTY ARC: warmth first (Opening/Build) → sharpens (Turn) → peaks (Landing)

PORTRAIT STRUCTURE:
Section 1: # [emoji] [Title] — THE OPENING (~30%)
  Breadth → spine arrives as inevitability
Section 2: ## [emoji] [Title] — *[subtitle]* — THE BUILD (~35%)
  Vertical. Strongest evidence for spine. Shadow connections. Max 2 ### sub-headers.
Section 3: ## [emoji] [Title] — *[subtitle]* — THE TURN (~10-15%)
  THE RENAME: their word → your more precise word. Mic drop. Shortest section.
Section 4: ## [emoji] [Title] — *[subtitle]* — THE LANDING (~20-25%)
  Two archetype sketches → ground in reader's reality → directness earned.
  Closing: at most one sentence + question that takes the spine further.

WRITING TECHNIQUES: Deduction, Positioning, Reframing, Provocation, Prediction

CRAFT REQUIREMENTS:
1. Zero repetition
2. Coined phrases (min 2, target 3-4) — specific to THIS person
3. Reaction before analysis (when quoting)
4. Callback hooks (anchor each section to a real moment)
5. Shadow connections (strengths + weaknesses = same trait, different angle)

GUARDRAILS: Never expose scoring. Never trait/facet labels. Ocean metaphors only when genuine.
```

**User prompt data:** Same as teaser (FACET_GLOSSARY + TRAIT_SUMMARY + EVIDENCE + DEPTH_SIGNAL) + full conversation messages

---

#### 6. Relationship Analysis

**Prompt builder:** `packages/domain/src/prompts/relationship-analysis.prompt.ts` → `buildRelationshipAnalysisPrompt()`
**Model:** Sonnet (via LangChain ChatAnthropic, reuses `portraitModelId`)

**System prompt:**
```
You are Nerin, a perceptive personality analyst who has observed two people through deep
conversations. Writing a relationship comparison that reveals how two personalities interact.

Structure:
# The Dynamic Between You — core relationship pattern
## Where You Meet — shared patterns, specific texture of alignment
## Where You Complement — differences that create balance
## Where You Might Clash — friction points, framed as understanding
## What Makes This Pairing Rare — unique combination, forward-looking

800-1200 words. Second person. Never expose raw scores/trait labels.
Focus on behavioral patterns and dynamics, not abstract traits.
```

**User prompt data:** Per-user profile with facet scores + evidence (capped at 20 records per user).

### The Complete Dataflow (3 Phases)

#### Phase 1: Conversation (per message)

```
User message arrives
  │
  ├─ Acquire advisory lock (pg_try_advisory_lock — prevents concurrent messages)
  ├─ Validate session (status=active, ownership)
  ├─ Save user message to assessment_messages
  ├─ Budget check + rate limit (Redis, fail-open)
  │
  ├─ [Cold start: ≤ 3 user messages]
  │   └─ Greeting seed pool: 5 predefined { domain, facet } pairs
  │      (leisure/imagination → relationships/gregariousness → work/achievement_striving
  │       → solo/self_consciousness → family/altruism)
  │      Round-robin via seedIndex
  │
  └─ [Post-cold-start: > 3 user messages]
      │
      ├─ Query existing conversation_evidence for session
      ├─ Compute domain distribution (evidence count per domain)
      │
      ├─ ConversAnalyzer (Claude Haiku, forced tool_use)
      │    Input:  latest user message + last 6 messages + domain distribution
      │    Prompt: 30 facet definitions + 6 domain definitions + confidence guidance
      │            (0.3-0.5 weak, 0.6-0.8 moderate, 0.8-1.0 strong)
      │    Output: 0-3 evidence records per message
      │            { bigfiveFacet, score (0-20), confidence (0-1), domain }
      │    Validation: Effect Schema (single source of truth for tool JSON schema + decode)
      │    Error handling: retry once → skip on failure (fire-and-forget, non-fatal)
      │
      ├─ Cap to 3 records, save to conversation_evidence table
      ├─ Re-fetch ALL conversation_evidence for session
      │
      ├─ computeFacetMetrics(allEvidence)
      │    For each facet with evidence:
      │      1. Group evidence by domain
      │      2. Per-domain context weight:  w_g = √(Σ confidence_i)
      │      3. Per-domain mean:            μ_g = Σ(c_i × score_i) / Σ(c_i)
      │      4. Facet score:                S = Σ(w_g × μ_g) / Σ(w_g)
      │      5. Total diversified mass:     W = Σ(w_g) across all domains
      │      6. Confidence:                 C = C_max × (1 - e^{-k × W})
      │      7. Volume:                     V = 1 - e^{-β_v × W}
      │      8. Diversity:                  D = -Σ(p_g × ln(p_g)) / ln(|G|)  (normalized Shannon entropy)
      │      9. Signal power:               P = V × D
      │    Output: Map<FacetName, { score, confidence, signalPower, domainWeights }>
      │    Facets with zero evidence are absent (not defaulted)
      │
      └─ computeSteeringTarget(metrics, previousDomain)
           Step 1 — Facet selection (highest priority gap):
             priority = α × max(0, C_target - confidence) + β × max(0, P_target - signalPower)
             Tiebreaker: if all priorities = 0, pick lowest confidence facet
           Step 2 — Domain selection (maximize projected signal power gain):
             For each steerable domain (work, relationships, family, leisure, solo):
               Δw = √(w_current² + c̄) - w_current    (estimated mass delta)
               W' = W + Δw                             (projected total mass)
               V' = 1 - e^{-β_v × W'}                 (projected volume)
               D' = computeProjectedEntropy(weights, domain, Δw)  (projected diversity)
               ΔP = V' × D' - P_current                (expected signal power gain)
               score = ΔP - λ × switchCost             (penalize domain hopping)
             Pick domain with highest score
           Output: { targetFacet, targetDomain, steeringHint }
           │
           └─ Nerin (Claude via LangGraph) responds
                System prompt: NERIN_PERSONA + CHAT_CONTEXT
                  + "STEERING PRIORITY: Explore {facet} through {domain}"
                  + [if nearingEnd] "CONVERSATION CLOSING: Begin warm, reflective closing"
                nearingEnd = userMessageCount ≥ messageThreshold - 3
```

#### Phase 2: Finalization (once, at message threshold = 25 user messages)

```
Session transitions to "finalizing" (on final turn in Phase 1)
  │
  ├─ Three-tier idempotency:
  │    Tier 1: session.status === "completed" → return immediately
  │    Tier 2: lock contention → return current progress (HTTP 200, not error)
  │    Guard 2: finalization_evidence exists → skip FinAnalyzer, reuse evidence
  │
  ├─ Acquire session lock (advisory lock, same as Phase 1)
  ├─ Update progress: "analyzing"
  │
  ├─ FinAnalyzer (Claude Sonnet, forced tool_use, max_tokens=16384)
  │    Input:  ALL messages with [uuid] prefix for messageId linking
  │    Prompt: 30 facet definitions + 6 domain definitions
  │            + "User Emphasis Rule" — classify domain based on what USER emphasizes
  │            + "COMPREHENSIVE final pass — no cap, extract EVERYTHING"
  │            + Confidence guidance: 0.3-0.5 indirect, 0.6-0.8 clear, 0.8-1.0 explicit
  │            + CRITICAL: "quote" must be EXACT verbatim substring
  │    Output: 30-60+ evidence records (no cap)
  │            { messageId, bigfiveFacet, score (0-20), confidence (0-1),
  │              domain, rawDomain (free-text), quote (verbatim) }
  │    Validation: Effect Schema (same pattern as ConversAnalyzer)
  │    Error handling: retry once → fail (fatal — blocks finalization)
  │
  ├─ Validate each messageId against real messages (skip invalid, log warning)
  ├─ computeHighlightPositions(messageContent, quote)
  │    → Find quote as exact substring → { highlightStart, highlightEnd } or null
  │    → Returns null if ambiguous (multiple matches) or missing
  ├─ Create assessment_results placeholder row (FK target)
  └─ Batch save to finalization_evidence table
       Schema: { messageId, resultId, bigfiveFacet, score, confidence,
                 domain, rawDomain, quote, highlightStart, highlightEnd }
```

#### Phase 3: Results (immediately after Phase 2)

```
finalization_evidence loaded by resultId
  │
  ├─ Map to EvidenceInput[] { bigfiveFacet, score, confidence, domain }
  │
  ├─ computeAllFacetResults(evidence)
  │    Calls computeFacetMetrics() from formula.ts (SAME function as steering)
  │    All 30 facets: { score, confidence, signalPower }
  │    Missing facets default: score=10 (midpoint), confidence=0, signalPower=0
  │
  ├─ computeTraitResults(facets)
  │    Each of 5 traits = mean of its 6 facets:
  │      trait.score = mean(facet scores)           — NOT sum (differs from scoring.ts)
  │      trait.confidence = mean(facet confidences)
  │      trait.signalPower = mean(facet signalPowers)
  │
  ├─ computeDomainCoverage(evidence)
  │    Normalized distribution: count per domain / total evidence count
  │    All 6 domains always present (0 if no evidence)
  │
  ├─ Teaser portrait (Haiku) generated from evidence (~2-3s)
  │    Stored in both assessment_results.portrait AND portraits table
  │
  └─ Update assessment_results { facets, traits, domainCoverage, portrait }
     Mark session "completed"
```

### Formula Reference

#### Constants

| Constant | Symbol | Value | Purpose |
|----------|--------|-------|---------|
| C_max | C_max | 0.9 | Maximum reachable confidence (0-1 scale) |
| k | k | 0.7 | Confidence saturation speed |
| C_target | C_t | 0.75 | Target confidence for steering priority |
| P_target | P_t | 0.5 | Target signal power for steering priority |
| alpha | α | 1.0 | Confidence gap weight in priority |
| beta | β | 0.8 | Signal power gap weight in priority |
| betaVolume | β_v | 0.7 | Volume saturation rate |
| eta | η | 0.3 | Entropy sensitivity — **defined but unused in code** |
| lambda | λ | 0.3 | Domain switch cost penalty (bumped from 0.1 — see Decision 6) |
| cBar | c̄ | 0.5 | Expected evidence mass per new observation |
| epsilon | ε | 1e-10 | Division-by-zero safety |
| SCORE_MIDPOINT | — | 10 | Neutral score on 0-20 scale |

#### Confidence Formula (formula.ts — used for steering AND results)

```
Context weight per domain:     w_g = √(Σ confidence_i)     for all evidence in domain g
Total diversified mass:        W = Σ w_g                    across all domains
Confidence:                    C = C_max × (1 - e^{-k × W})
```

Properties: monotonically increasing, diminishing returns, capped at C_max=0.9. Anti-redundancy via √ (multiple low-confidence signals from same domain contribute less than diverse signals).

#### Signal Power Formula

```
Volume:     V = 1 - e^{-β_v × W}       (how much total evidence, saturating)
Diversity:  D = H_norm(w_1, ..., w_G)   (Shannon entropy, normalized to 0-1)
Signal:     P = V × D                   (high only when BOTH volume AND diversity are high)
```

**Entropy explained:** Measures how evenly evidence is spread across domains.
- All evidence from 1 domain → D = 0 (no diversity)
- Even spread across all domains → D = 1 (maximum diversity)
- The steering algorithm actively fights the "Depth Spiral" by measuring D and prioritizing under-represented domains.

#### Steering Priority Formula

```
Facet priority:   priority_f = α × max(0, C_target - C_f) + β × max(0, P_target - P_f)
Domain selection: score_g = ΔP_g - λ × switchCost_g     (λ = 0.3)
  where ΔP_g = V'_g × D'_g - P_current
        V'_g = 1 - e^{-β_v × (W + Δw_g)}
        D'_g = H_norm(weights with w_g += Δw_g)
        Δw_g = √(w_g² + c̄) - w_g
        switchCost = 0 if same as previous domain, else 1
```

#### Legacy Scoring (scoring.ts — separate system)

```
Weight per evidence:    weight = (confidence/100) × (1 + index × 0.1)    (recency bias)
Facet score:            Σ(score × weight) / Σ(weight)
Raw evidence mass:      Σ(confidence_i / 100)
Effective evidence:     rawMass / (1 + ρ × (n-1))                        (redundancy: ρ=0.5)
Confidence:             round(C_MAX × (1 - e^{-K × effectiveEvidence}))  (C_MAX=90, 0-100 scale)
Trait score:            sum of 6 facet scores (0-120 scale)
Trait confidence:       mean of assessed facet confidences (confidence > 0)
```

### Two-Tier Evidence Architecture

| | conversation_evidence (Steering) | finalization_evidence (Results) |
|---|---|---|
| **Producer** | ConversAnalyzer (Haiku) | FinAnalyzer (Sonnet) |
| **When** | Every message (post-cold-start) | Once at finalization |
| **Cap** | 3 records per message | No cap (30-60+ total) |
| **Schema** | facet, score, confidence, domain | + rawDomain, quote, highlightStart/End, messageId, resultId |
| **Purpose** | Guide steering during conversation | Score computation + portrait generation |
| **Lifecycle** | Kept for analytics | Authoritative source of truth |

### Two Parallel Scoring Systems (Pre-Consolidation State)

| | formula.ts (Active) | scoring.ts (Legacy — to be deprecated) |
|---|---|---|
| **Used by** | `computeFacetMetrics()` → steering + `computeAllFacetResults()` → final scores | `aggregateFacetScores()` → `get-results`, `get-public-profile`, `create-shareable-profile`, `resume-session` |
| **Score method** | Domain-grouped weighted mean (anti-redundancy via √) | Recency-biased weighted mean (10% boost per position) |
| **Confidence** | `C_max × (1-e^{-k×W})` with W = diversified domain mass | `C_MAX × (1-e^{-K×eff})` with eff = mass/(1+ρ×(n-1)) |
| **Scale** | 0-1 floats | 0-100 integers |
| **Signal power** | V × D (volume × entropy) | Not computed |
| **Trait derivation** | mean of 6 facets | sum of 6 facets (0-120 scale) |

**Inconsistency identified:** `generate-results.use-case.ts` WRITES scores using `formula.ts` (via `score-computation.ts`), but `get-results.use-case.ts` RE-COMPUTES scores using `scoring.ts` when displaying to the user. The user may see different scores than what was persisted.

### Cross-Cutting Observations

1. **`eta` (η=0.3) is defined but never used** — appears to be a remnant from an earlier formula design
2. **`scoring.ts` and `formula.ts` compute confidence differently** — different redundancy models, different scales. See Decision 1 below for resolution.
3. **Unexplored facets are invisible to steering** — only facets with at least one evidence record appear in `computeFacetMetrics()`. Facets never mentioned in conversation are never targeted (beyond the 5 cold-start seeds). See Decision 2 below for resolution.
4. **Trait score = mean vs sum** — `score-computation.ts` uses mean of 6 facets; `scoring.ts` uses sum (0-120 scale). These are fundamentally different representations.
5. **ConversAnalyzer sees domain distribution** — the prompt includes current domain counts, enabling it to be "aware of domain drift" but this awareness is advisory (the LLM decides, not enforced).
6. **FinAnalyzer has the "User Emphasis Rule"** — classify domain by what user emphasizes, not objective categorization. ConversAnalyzer does not have this rule.
7. **nearingEnd** triggers at `messageThreshold - 3` (user message 22 of 25) — last 3 user turns shift Nerin toward reflective closing. No evidence extraction changes during this phase. Note: `messageCount` tracks **user messages** (exchange rounds), not total messages. A 25-message-threshold conversation has ~50 total messages (25 user + 25 assistant).

## Architectural Decisions

### Decision 1: Consolidate Scoring on `formula.ts` — Deprecate `scoring.ts`

**Problem:** Two scoring systems compute confidence differently, use different scales (0-1 vs 0-100), and derive trait scores differently (mean vs sum). The WRITE path (finalization) uses `formula.ts` but the READ path (display) re-computes using `scoring.ts`, creating inconsistency.

**Decision:** Consolidate on `formula.ts` (the newer, domain-aware system). Use-cases that display scores should **read persisted `assessment_results.facets`** instead of re-computing from evidence.

**Changes required:**

| Use-case | Current | After |
|---|---|---|
| `get-results.use-case.ts` | Re-computes via `scoring.ts aggregateFacetScores()` | Read `assessment_results.facets` and `.traits` directly |
| `get-public-profile.use-case.ts` | Re-computes via `scoring.ts aggregateFacetScores()` | Read `assessment_results.facets` directly |
| `create-shareable-profile.use-case.ts` | Re-computes via `scoring.ts aggregateFacetScores()` | Read `assessment_results.facets` directly |
| `resume-session.use-case.ts` | Re-computes via `scoring.ts aggregateFacetScores()` | Read `assessment_results.facets` directly |
| `update-facet-scores.use-case.ts` | Uses `scoring.ts` for batch update every 3 msgs | Deprecate — mid-conversation scores not persisted, steering uses `formula.ts` directly |

**`scoring.ts` disposition:**
- Delete file + all tests outright in Phase 0 (git history preserves if needed)
- Remove `eta` (η=0.3) from `FORMULA_DEFAULTS` — unused remnant

**Single source of truth:** After consolidation, `formula.ts` → `computeFacetMetrics()` is the ONLY scoring function. `score-computation.ts` wraps it for finalization (all-30-facets defaults). Display paths read persisted results.

### Decision 2: All-30-Facets Steering with OCEAN Round-Robin Tiebreaker

**Problem:** `computeSteeringTarget()` only iterates facets present in the metrics map (i.e., facets with at least 1 evidence record). Unexplored facets are invisible to steering and can never be targeted. In a 25-message conversation, only ~12-15 facets may emerge organically, leaving 15-18 permanently at default (score=10, confidence=0).

**Decision:** Iterate ALL 30 facets in `computeSteeringTarget()`. Unexplored facets default to confidence=0, signalPower=0, giving them maximum priority (1.15). Ties among equal-priority facets are broken by a fixed OCEAN-interleaved ordering that ensures trait coverage spread.

**OCEAN-interleaved ordering:**

```
Round 1: O[0], C[0], E[0], A[0], N[0]    ← one facet per trait
Round 2: O[1], C[1], E[1], A[1], N[1]
Round 3: O[2], C[2], E[2], A[2], N[2]
Round 4: O[3], C[3], E[3], A[3], N[3]
Round 5: O[4], C[4], E[4], A[4], N[4]
Round 6: O[5], C[5], E[5], A[5], N[5]
```

This produces a static array of 30 facets. When priorities tie, the facet earlier in this array wins.

**Updated algorithm:**

```typescript
const OCEAN_INTERLEAVED_ORDER: FacetName[] = buildInterleavedOrder(); // static, computed once

function computeSteeringTarget(
  metrics: Map<FacetName, FacetMetrics>,
  previousDomain: LifeDomain | null,
  config: FormulaConfig = FORMULA_DEFAULTS,
  seedIndex?: number,
): SteeringTarget {
  // Cold start: no evidence at all
  if (metrics.size === 0) {
    // unchanged — greeting seed pool
  }

  // Step 1: Facet Priority — iterate ALL 30 facets
  let bestFacet: FacetName | null = null;
  let bestPriority = -1;
  let bestTiebreakerRank = Infinity;

  for (const facet of OCEAN_INTERLEAVED_ORDER) {
    const m = metrics.get(facet);
    const confidence = m?.confidence ?? 0;
    const signalPower = m?.signalPower ?? 0;

    const priority =
      config.alpha * Math.max(0, config.C_target - confidence) +
      config.beta * Math.max(0, config.P_target - signalPower);

    const rank = OCEAN_INTERLEAVED_ORDER.indexOf(facet);

    if (priority > bestPriority || (priority === bestPriority && rank < bestTiebreakerRank)) {
      bestPriority = priority;
      bestFacet = facet;
      bestTiebreakerRank = rank;
    }
  }

  // Step 2: Domain selection — unchanged (projected ΔP with switch cost)
  // For unexplored facets (no domainWeights), all domains have equal projected gain
  // → first steerable domain wins, which is fine (any domain is good for first signal)
}
```

**Natural explore→exploit transition (no explicit ratio needed):**

```
User msg 1-3:    Cold start seeds (5 predefined, unchanged)
User msg 4-8:    Exploration — unexplored facets always win (priority=1.15 is maximum)
                  OCEAN interleaving ensures we touch O, C, E, A, N before repeating a trait
User msg 9-16:   Transition — explored facets with low confidence compete with unexplored ones
                  As coverage grows, fewer facets have max priority
User msg 17-25:  Exploitation — most facets have some signal
                  Formula deepens confidence gaps and diversity gaps
                  nearingEnd activates at user msg 22 (last 3 turns = reflective closing)
                  Total conversation: ~50 messages (25 user + 25 assistant)
```

**Key property:** The priority formula `α × max(0, C_target - C) + β × max(0, P_target - P)` naturally transitions from explore to exploit because:
- Unexplored: C=0, P=0 → priority = 1.15 (max)
- First signal: C≈0.3, P≈0 → priority ≈ 0.85 (drops significantly)
- Well-explored: C≈0.7, P≈0.4 → priority ≈ 0.13 (near zero)
- Fully covered: C≥0.75, P≥0.5 → priority = 0 (satisfied)

No tuning knobs needed — the existing constants (C_target=0.75, P_target=0.5, α=1.0, β=0.8) drive the transition.

### Decision 3: Kill FinAnalyzer — Promote ConversAnalyzer as Single Evidence Source

**Problem:** FinAnalyzer (Sonnet) costs ~$0.13/assessment — 87% of pre-payment pipeline cost — for a single finalization call. It re-analyzes all messages that ConversAnalyzer (Haiku) already processed, producing redundant evidence. Its unique value was verbatim quote extraction and highlight positioning for the conversation review UI.

**Decision:** Kill FinAnalyzer entirely. Drop inline highlights in favor of notes (paraphrased evidence annotations). ConversAnalyzer evidence becomes the single authoritative source for both steering and scoring.

**Cost impact:**

| | Current | After |
|---|---|---|
| Evidence extraction cost | $0.006 (ConversAnalyzer) + $0.13 (FinAnalyzer) = **$0.136** | $0.006 (ConversAnalyzer only) = **$0.006** |
| Total assessment (pre-payment) | **~$0.15** | **~$0.02** |
| Reduction | | **96% on evidence, 87% overall** |

**What changes:**

1. **ConversAnalyzer output gains a `note` field** — brief paraphrase of the user signal (replaces verbatim `quote`)
2. **`conversation_evidence` becomes the primary evidence table** — no longer a disposable steering artifact
3. **`finalization_evidence` table deprecated** — conversation_evidence feeds scoring + portraits directly
4. **`computeHighlightPositions()` deleted** — no more exact substring matching
5. **Frontend conversation review** shows evidence as annotations beside messages, not inline highlights
6. **No gap-fill pass** — ConversAnalyzer evidence is the complete evidence set. Uncovered facets remain at default (score=0, confidence=0). Coverage is maximized through improved steering (Decision 2), not post-hoc extraction.
7. **Portrait pipeline unchanged** — teaser and full portrait receive evidence with notes instead of verbatim quotes; Sonnet portrait generation synthesizes from evidence, doesn't copy-paste

**What we delete:**
- `finanalyzer.anthropic.repository.ts` (infrastructure)
- `FinanalyzerRepository` interface (domain)
- `finalization_evidence` table and related schema
- `computeHighlightPositions()` function
- `highlightStart` / `highlightEnd` fields
- All FinAnalyzer-related test mocks

**Architecture before and after:**

```
BEFORE (3 evidence systems):
  ConversAnalyzer → conversation_evidence  (steering only)
  FinAnalyzer     → finalization_evidence   (scoring + portraits)
  scoring.ts      → re-computation          (display)

AFTER (1 evidence system):
  ConversAnalyzer → conversation_evidence  (steering + scoring + portraits)
  Read persisted assessment_results         (display)
```

### Decision 4: Evidence v2 Format — Deviation + Strength + Confidence

**Problem:** Current evidence format uses `score: 0-20` (absolute judgment) and `confidence: 0-1` (extraction certainty). Asking Haiku to place someone on an absolute 20-point scale from a single message is noisy and cognitively demanding for the LLM. Additionally, confidence as a raw float produces jittery weights.

**Decision:** Replace with three separate fields that serve distinct purposes:

| Field | Type | Meaning | Example |
|---|---|---|---|
| `deviation` | integer, -3 to +3 | Direction and distance from population average | +2 = clearly above average |
| `strength` | enum: weak / moderate / strong | Diagnosticity — "if true, how strongly does this indicate the facet?" | strong = explicit behavior, costly tradeoff |
| `confidence` | enum: low / medium / high | Extraction certainty — "how sure are we the mapping (facet, direction, domain) is correct?" | high = unambiguous signal |

**Weight computation:**

```
strengthWeight  = { weak: 0.3, moderate: 0.6, strong: 1.0 }
confidenceWeight = { low: 0.3, medium: 0.6, high: 0.9 }
finalWeight     = strengthWeight × confidenceWeight
```

`finalWeight` replaces raw `confidence` in all formula.ts computations. The mass/entropy machinery (`W`, `C`, `P`) stays identical — it just receives better-quality weights.

**Why separate strength from confidence:**
- "Strong but misclassified" (strong × low = 0.3) ≠ "strong and certain" (strong × high = 0.9)
- Both fields are independently auditable
- Bucketing eliminates float jitter while preserving signal

**Migration:** ConversAnalyzer prompt updated to output new fields. Old `score: 0-20` and `confidence: 0-1` fields deprecated.

### Decision 5: Remove "Specific Thing They Said" Constraint from All Portraits

**Problem:** Both teaser and full portrait prompts require the reader to "encounter a specific thing they said within first 3 sentences." This constraint was designed as a recognition hook, but it prioritizes surface-level recall over deeper insight.

**Decision:** Remove the constraint from both teaser and full portrait prompts. Recognition comes from the accuracy of the spine insight, not from echoing the user's words.

**Rationale:**
- "I see the pattern underneath" is more impressive than "I remember what you said" — deeper recognition
- The spine already creates the "felt understood" moment through accurate behavioral insight, not quotation
- Removes dependency on verbatim quotes or high-fidelity notes in the evidence pipeline
- Simplifies Evidence v2 — notes can focus on behavioral signal, not preserving exact phrasing
- Portraits can still reference specific moments when it serves the narrative — it's just not a hard constraint on the opening

**Prompt changes:**

| Prompt | Before | After |
|---|---|---|
| Teaser (`TEASER_CONTEXT`) | "OPENING: Reader must encounter a specific thing they said within first 3 sentences" | Remove. Opening focuses on spine arrival and intrigue. |
| Full Portrait (`PORTRAIT_CONTEXT`) | "Recognition objective: Reader must feel HEARD within first 3 sentences" | Remove the specific-quote requirement. Recognition comes from spine accuracy. Portraits may still reference conversation moments organically. |

### Decision 6: Bump Domain Switch Cost λ from 0.1 to 0.3

**Problem:** λ=0.1 is effectively decorative — against projected ΔP values of 0.3-0.5, it changes the domain selection outcome <5% of the time. Domain hopping between turns creates jarring conversation transitions ("Tell me about your work... now tell me about your family...").

**Decision:** Bump λ to 0.3. This makes the switch cost meaningful: a new domain must offer ≥0.3 more projected signal power than staying in the current domain to justify a switch.

**Effect:** Nerin spends 2-3 turns in a domain before switching, creating natural conversational arcs. The entropy-driven diversity formula still ensures all domains get covered over 25 turns — it just does so in bursts rather than ping-ponging.

### Deviation Aggregation + Score Mapping (Evidence v2)

Under Evidence v2, raw `score: 0-20` is replaced by `deviation: -3 to +3` (integer). The aggregation formula adapts as follows:

#### Per-Evidence Weight

```
strengthWeight   = { weak: 0.3, moderate: 0.6, strong: 1.0 }
confidenceWeight = { low: 0.3, medium: 0.6, high: 0.9 }
finalWeight      = strengthWeight × confidenceWeight
```

#### Facet Score Aggregation

```
Per-domain weighted mean:   μ_g = Σ(finalWeight_i × deviation_i) / Σ(finalWeight_i)
Context weight per domain:  w_g = √(Σ finalWeight_i)
Facet deviation:            D_f = Σ(w_g × μ_g) / Σ(w_g)        (range: -3 to +3)
Facet score:                S_f = MIDPOINT + D_f × SCALE_FACTOR  (mapped to 0-20)
  where MIDPOINT = 10, SCALE_FACTOR = 10/3 ≈ 3.33
  so deviation -3 → score 0, deviation 0 → score 10, deviation +3 → score 20
```

**Score scale mapping:**

| Deviation | Score (0-20) | Meaning |
|---|---|---|
| -3 | 0.0 | Extremely below average |
| -2 | 3.3 | Clearly below average |
| -1 | 6.7 | Slightly below average |
| 0 | 10.0 | Average / neutral |
| +1 | 13.3 | Slightly above average |
| +2 | 16.7 | Clearly above average |
| +3 | 20.0 | Extremely above average |

#### Confidence + Signal Power (unchanged shape)

```
Total diversified mass:  W = Σ w_g                          (same formula, w_g now uses finalWeight)
Confidence:              C = C_max × (1 - e^{-k × W})      (unchanged)
Volume:                  V = 1 - e^{-β_v × W}              (unchanged)
Diversity:               D = H_norm(w_1, ..., w_G)          (unchanged)
Signal power:            P = V × D                          (unchanged)
```

The mass/entropy machinery is agnostic to the score representation — it only cares about weights (now `finalWeight` instead of raw confidence) and domain distribution.

#### Trait Score Derivation

```
Trait score = mean of 6 facet scores (0-20 scale)    → range 0-20
Trait confidence = mean of assessed facet confidences (C > 0)
```

### Rolling Evidence Budget

Replaces the hard 0-3 cap per message on ConversAnalyzer output.

**Spec:**
- **Per-message cap:** 5 records (up from 3) — allows richer messages to contribute more signals
- **Session rolling cap:** 80 records total — prevents unbounded growth over 22 extraction calls
- **Selection rule on cap exceeded:** When a single message yields >5 candidate records from ConversAnalyzer, keep the 5 with highest `finalWeight` (strength × confidence). When session total exceeds 80, no eviction — simply stop extracting on subsequent messages.

**Rationale:** The old 0-3 cap was conservative for Haiku's extraction quality at the time. With Evidence v2's cleaner output format (deviation + enums instead of score + float), Haiku can reliably produce more records per message. The session cap of 80 is generous — at 22 calls × 5 max = 110 theoretical maximum, 80 allows ~73% fill before stopping.

**Implementation:** ConversAnalyzer prompt says "extract up to 5 records." Server-side validation enforces the cap and session total.

### Depth Signal (Updated for Evidence v2)

`computeDepthSignal()` determines portrait adaptation (RICH / MODERATE / THIN).

**Current (v1):** Counts evidence records with `confidence > 0.7` (float threshold).

**Updated (v2):** Counts evidence records with `strength = strong AND confidence ∈ {medium, high}`, i.e., records where `finalWeight ≥ 0.36` (moderate × medium = 0.36 is the boundary).

```
HQ_count = count of evidence where finalWeight ≥ 0.36

RICH:     HQ_count ≥ 8
MODERATE: HQ_count ≥ 4
THIN:     HQ_count < 4
```

This preserves the same intent (adapt portrait depth to evidence quality) while using v2 weight mechanics instead of raw confidence floats.

### Enum Validation + Portrait Telemetry

**Enum validation:** ConversAnalyzer output is validated via Effect Schema (existing pattern). The schema defines `strength` as `S.Literal("weak", "moderate", "strong")` and `confidence` as `S.Literal("low", "medium", "high")`. Invalid values (e.g., "very strong", misspellings) fail schema decode → the entire evidence record is dropped. This matches the current behavior where malformed tool_use output is discarded.

**Portrait telemetry:** Decision 5 removes the only objectively verifiable portrait constraint. To compensate, add lightweight telemetry once user feedback is available: portrait rating (1-5 or thumbs up/down), tracked alongside depth signal and evidence count. This enables future quality evaluation without blocking the v1 rewrite.

## V1 Rewrite Plan — Finalized Rollout

**Goal:** Max facet×domain coverage in ~25 user turns, with natural conversation, lower cost, and better scoring reliability.

**Principles:**
- No regression testing or shadow modes — pre-PMF, iterate fast
- Unit tests on pure math functions (formulas, weights) — cheap and catch bugs
- Ship each phase, observe metrics, adjust
- Each phase builds on the previous — no circular dependencies

### Phase 0: Fix the Plumbing

**Scope:** Scoring consolidation (Decision 1) + observability

**Changes:**
1. Make display use-cases read persisted `assessment_results` instead of re-computing via `scoring.ts`
2. Remove `scoring.ts` from production imports
3. Remove `eta` (η=0.3) from `FORMULA_DEFAULTS`
4. Bump `lambda` (λ) from 0.1 to 0.3 (Decision 6)
5. Add coverage tracking: `coveredFacets = facets with confidence > 0.3` / 30
6. Add exam-ness metric: `questions_per_assistant_turn`
7. Add `topic_transitions_per_5_turns` metric

**Delivers:** Clean, consistent scoring foundation. Metrics to evaluate subsequent phases.

### Phase 1: Micro-Intent Steering

**Scope:** Replace raw facet/domain steering instructions with conversational micro-intents. Orthogonal to scoring — ships independently.

**Changes:**
1. Add steering realizer: `{ facet, domain } → micro_intent + bridge_hint`
2. Micro-intent types: `story_pull`, `tradeoff_probe`, `contradiction_surface`, `domain_shift`, `depth_push`
3. Nerin prompt receives micro-intent instead of raw "Explore {facet} through {domain}"
4. Guardrails: max 1 direct question/turn, no >2 probes in a row

**Delivers:** More natural conversation. Reduced exam-ness while maintaining coverage.

### Phase 2: Evidence v2 + Scoring v2 (Merged)

**Scope:** New evidence format (Decision 4) + `computeFacetMetrics()` rewrite (IC-1) + rolling budget + depth signal update. Phases 2 and 3 merged because the schema change and scoring function rewrite are coupled — you can't ship new evidence fields without updating the function that consumes them.

**Changes:**
1. ConversAnalyzer prompt updated to output `deviation` (-3 to +3), `strength` (weak/moderate/strong), `confidence` (low/medium/high), `note`, `domain`
2. Replace hard 0-3 cap with rolling budget: 5 per message, 80 per session (see Rolling Evidence Budget spec)
3. `conversation_evidence` schema updated with new fields; Effect Schema validation enforces enums (invalid records dropped)
4. `computeFacetMetrics()` rewritten to accept `EvidenceInputV2` natively (IC-1): weight maps (`STRENGTH_WEIGHT`, `CONFIDENCE_WEIGHT`) co-located inside, `finalWeight = strengthWeight × confidenceWeight` replaces raw confidence, deviation→score mapping (`MIDPOINT + D_f × SCALE_FACTOR`) computed internally
5. `computeDepthSignal()` updated to use `HQ_count` (records with `finalWeight ≥ 0.36`) instead of confidence float threshold
6. Drop `conversation_evidence` table and recreate with new schema (Decision 7)

**Delivers:** Higher-quality evidence inputs. Unified evidence format + scoring function — no adapter layer between v1 and v2. Richer messages can contribute more signals without overall inflation.

### Phase 3: Kill FinAnalyzer

**Scope:** Decision 3 implementation — no gap-fill, ConversAnalyzer is the complete evidence source. Finalization pipeline rewrite (Decision 10).

**Changes:**
1. `conversation_evidence` becomes authoritative evidence source — no finalization LLM call
2. Rewrite `generate-results.use-case.ts` with stage-based idempotency (Decision 10): `scored → completed`
3. Delete FinAnalyzer infrastructure (repository, interface, mocks, schema, `finalization_evidence` table)
4. Delete `computeHighlightPositions()` and highlight fields
5. Portrait pipeline receives ConversAnalyzer evidence with notes
6. Frontend conversation review: annotations instead of inline highlights (Decision 12)
7. Add portrait telemetry placeholder (rating capture for future quality evaluation)

**Delivers:** 87% cost reduction on evidence extraction. Simplified architecture (1 evidence system instead of 3). Zero finalization LLM calls for evidence.

### Phase 4: Context Dependence (v2+, Gated)

**Scope:** Surface cross-domain personality variation when evidence supports it. Also includes deferred scoring improvements from the former Phase 3: within-domain conflict detection and context dependence gating.

**Changes:**
1. Compute context dependence per facet (already available from domain-grouped scoring)
2. Add within-domain conflict detection: if same facet has opposing deviations in same domain, downweight facet confidence
3. Use for steering: "confirm this facet in another domain" when single-domain evidence
4. Use for narrative tags in portrait: "at work vs. at home" contrasts
5. Only activate when `effectiveDomainCount ≥ 3` for the facet — otherwise treat as unknown

**Delivers:** Richer personality model. Steering that actively seeks cross-domain confirmation. Mixed evidence produces appropriately lower confidence instead of averaged-out midpoints.

## Implementation Patterns & Consistency Rules

_Pipeline-specific patterns for the V1 rewrite. General project conventions (naming, structure, error architecture, testing) are established in CLAUDE.md, ARCHITECTURE.md, NAMING-CONVENTIONS.md, and API-CONTRACT-SPECIFICATION.md. This section covers only patterns introduced by Decisions 1–12 that an agent implementing Phases 0–4 could get wrong._

### Pattern 1: Evidence Input Type — Replace, Don't Coexist

**Conflict risk:** After Evidence v2, an agent might create a parallel `EvidenceInputV2` type alongside the existing `EvidenceInput`, leading to import confusion and adapter layers.

**Rule:** Replace `EvidenceInput` in-place with the v2 shape. No parallel types, no `V2` suffix. The type is updated, all consumers are updated in the same phase.

```typescript
// packages/domain/src/types/evidence.ts — AFTER Phase 2
export interface EvidenceInput {
  readonly bigfiveFacet: FacetName;
  readonly domain: LifeDomain;
  readonly deviation: number;                          // -3 to +3
  readonly strength: "weak" | "moderate" | "strong";
  readonly confidence: "low" | "medium" | "high";
}
```

**What gets removed from the old type:** `score: number` (0-20), `confidence: number` (0-1 float).

**Why replace not coexist:** Decision 7 drops tables on schema-breaking deploys. No migration, no dual-format readers, no reason to keep the old shape. One type, one schema, one prompt format.

### Pattern 2: Weight Computation Ownership — `computeFacetMetrics()` Owns It

**Conflict risk:** `finalWeight` (strength × confidence enum → number) could be computed in the repository layer, the use-case, the handler, or `computeFacetMetrics()`. An agent might duplicate the weight maps or compute weights in the wrong layer.

**Rule:** `computeFacetMetrics()` is the single owner of weight computation. Weight map constants are exported from domain for the one exception case (annotations API), but no business logic in handlers.

**Weight maps location:** `packages/domain/src/utils/formula.ts` (co-located with scoring math)

```typescript
// Exported for reuse in annotation response building
export const STRENGTH_WEIGHT = { weak: 0.3, moderate: 0.6, strong: 1.0 } as const;
export const CONFIDENCE_WEIGHT = { low: 0.3, medium: 0.6, high: 0.9 } as const;
export const computeFinalWeight = (s: keyof typeof STRENGTH_WEIGHT, c: keyof typeof CONFIDENCE_WEIGHT) =>
  STRENGTH_WEIGHT[s] * CONFIDENCE_WEIGHT[c];
```

**Who calls what:**

| Caller | What it uses | Purpose |
|---|---|---|
| `computeFacetMetrics()` | Weight maps internally | Scoring — computes `finalWeight` per evidence record as part of aggregation |
| Annotation API response | `computeFinalWeight()` export | Read-time derived field for frontend sorting — no scoring logic |

**Anti-pattern:** Handler computing weights inline, hardcoding `{ weak: 0.3, ... }`, or importing weight maps without using the exported helper.

### Pattern 3: Stage Transitions — Update After Work, Same Transaction

**Conflict risk:** An agent implementing the finalization pipeline might update `assessment_results.stage` before the work is done (optimistic) or after but in a separate transaction (crash-unsafe).

**Rule:** Update stage AFTER the work it represents is successfully persisted. Wrap the work + stage update in the same database transaction where possible.

```
// CORRECT: work first, then stage
yield* assessmentResultRepo.update(resultId, { facets, traits, domainCoverage });
yield* assessmentResultRepo.updateStage(resultId, "scored");  // same transaction

// WRONG: stage first, then work
yield* assessmentResultRepo.updateStage(resultId, "scored");  // crash here = scored without scores
yield* assessmentResultRepo.update(resultId, { facets, traits, domainCoverage });
```

**Stage progression:** `scored → completed`. Two stages only. `scored` means scores + portrait are persisted (single transaction). `completed` means session is finalized. On re-entry, skip to the next incomplete stage.

### Pattern 4: ConversAnalyzer Error Handling — Retry Twice, Log, Skip

**Conflict risk:** An agent might place retry logic in the repository layer instead of the use-case, or forget to log failures with structured context.

**Rule:** Retry policy lives in `send-message.use-case.ts` (not the repository). Failures are logged with `sessionId` + `messageId` for diagnostics.

```typescript
// send-message.use-case.ts — the ONLY place retry policy is defined
const evidenceResult = yield* conversanalyzer
  .analyze({ message, recentMessages, domainDistribution })
  .pipe(
    Effect.retry(Schedule.recurs(2)),           // 3 total attempts (1 + 2 retries)
    Effect.catchAll((error) => {
      logger.error("ConversAnalyzer failed after retries, skipping", {
        sessionId: input.sessionId,
        messageId,
        error: error.message,
      });
      return Effect.succeed({ evidence: [], tokenUsage: { input: 0, output: 0 } });
    }),
  );
```

**Anti-pattern:** Retry logic in the repository layer. Missing `sessionId`/`messageId` in failure logs. Making ConversAnalyzer failure fatal.

### Pattern 5: Steering Prompt Format — MicroIntent Object, Not Raw Strings

**Conflict risk:** After Phase 1, an agent modifying the Nerin prompt or `send-message` might pass raw `targetFacet`/`targetDomain` strings instead of the `MicroIntent` object.

**Rule:** After Phase 1, the steering section of Nerin's system prompt is built exclusively from the `MicroIntent` object. Raw facet/domain strings are internal to the steering computation — they never appear in the prompt.

**Before Phase 1 (current):**
```
STEERING PRIORITY:
Explore the "{targetFacet}" facet through their "{targetDomain}" life domain.
```

**After Phase 1:**
```
STEERING PRIORITY:
Intent: {intent} (e.g., "story_pull", "tradeoff_probe")
Domain: {domain}
Bridge: {bridgeHint} (e.g., "map_same_theme", "contrast_domains")
Question style: {questionStyle} (e.g., "open", "choice")
```

**Who builds the prompt:** `buildChatSystemPrompt()` in `packages/domain/src/utils/nerin-system-prompt.ts`. This function's signature changes to accept `MicroIntent` instead of `targetFacet + targetDomain`.

**Anti-pattern:** Passing `targetFacet` directly to the prompt builder. Constructing steering text in the use-case instead of the prompt builder. Including raw facet definitions in the steering section (those stay in the ConversAnalyzer prompt only).

### Pattern 6: Evidence Cap Enforcement — Use-Case Layer Only

**Conflict risk:** An agent might add evidence cap validation in the repository (data layer), the ConversAnalyzer repository (infrastructure), or the schema validation (contracts). Business rules belong in use-cases.

**Rule:** Both caps (5 per message, 80 per session) are enforced in `send-message.use-case.ts`. Repositories are dumb data access — they save whatever they receive.

```typescript
// send-message.use-case.ts — evidence cap enforcement

// Early exit: skip ConversAnalyzer entirely if session cap reached
if (existingEvidence.length >= SESSION_EVIDENCE_CAP) {
  // Compute steering from existing evidence, skip extraction
} else {
  const evidenceResult = yield* conversanalyzer.analyze(...);

  // Per-message cap: keep top 5 by finalWeight
  const cappedEvidence = evidenceResult.evidence
    .sort((a, b) => computeFinalWeight(b.strength, b.confidence) - computeFinalWeight(a.strength, a.confidence))
    .slice(0, PER_MESSAGE_EVIDENCE_CAP);

  // Save (repository doesn't know about caps)
  yield* evidenceRepo.save(cappedEvidence.map(e => ({ ...e, sessionId, messageId })));
}
```

**Constants:**
```typescript
const PER_MESSAGE_EVIDENCE_CAP = 5;
const SESSION_EVIDENCE_CAP = 80;
```

**Anti-pattern:** Cap logic in `conversanalyzer.anthropic.repository.ts`. Cap logic in `conversation-evidence.drizzle.repository.ts`. ConversAnalyzer prompt saying "extract up to 5" as the sole enforcement (prompt is advisory, server-side is authoritative).

## Project Structure & Boundaries

_This section maps all decisions to specific files in the existing codebase. The monorepo structure is established — this section defines what changes, what's created, what's deleted, and what gets rewired._

### Already Dead Code (Immediate Cleanup)

Files that are already dead — no production callers, safe to delete before the rewrite begins:

| File | Evidence | Action |
|---|---|---|
| `apps/api/src/use-cases/update-facet-scores.use-case.ts` | Not exported from `use-cases/index.ts`, no handler calls it | Delete |
| `apps/api/src/use-cases/__tests__/update-facet-scores.use-case.test.ts` | Test for dead use-case | Delete |
| `packages/infrastructure/src/repositories/facet-evidence.noop.repository.ts` | `apps/api/src/index.ts` wires `FacetEvidenceDrizzleRepositoryLive`, noop is unused | Delete (verify no other consumer first) |

### File Impact Map by Phase

#### Phase 0: Fix the Plumbing

**Modified:**

| File | Change | Decision |
|---|---|---|
| `apps/api/src/use-cases/get-results.use-case.ts` | Remove `aggregateFacetScores()` + `deriveTraitScores()` imports from `scoring.ts`; read `assessment_results.facets` and `.traits` directly | D1 |
| `apps/api/src/use-cases/get-public-profile.use-case.ts` | Remove `aggregateFacetScores()` import; read persisted results | D1 |
| `apps/api/src/use-cases/create-shareable-profile.use-case.ts` | Remove `aggregateFacetScores()` import; read persisted results | D1 |
| `apps/api/src/use-cases/resume-session.use-case.ts` | Remove `aggregateFacetScores()` import; read persisted results | D1 |
| `packages/infrastructure/src/repositories/portrait-prompt.utils.ts` | Remove `deriveTraitScores()` import from `scoring.ts`; use persisted trait scores | D1 |
| `scripts/eval-portrait.ts` | Remove `aggregateFacetScores()` + `deriveTraitScores()` imports; use persisted results | D1 |
| `packages/domain/src/utils/formula.ts` | Remove `eta` from `FORMULA_DEFAULTS`, bump `lambda` 0.1→0.3 | D1, D6 |
| `apps/api/src/use-cases/send-message.use-case.ts` | Add coverage/exam-ness/transition metrics logging | D8 |
| `packages/infrastructure/src/db/drizzle/schema.ts` | Add `UNIQUE(assessmentSessionId)` on `assessment_results` | W2 |

**After all callers migrated, `scoring.ts` has zero production imports.** Delete file + all tests outright in Phase 0 (git history preserves if needed).

**Deleted in Phase 0:**

| File | Reason | Decision |
|---|---|---|
| `packages/domain/src/utils/scoring.ts` | All production imports removed above | D1 |
| `packages/domain/src/utils/__tests__/scoring-aggregate.test.ts` | Tests for deleted module | D1 |
| `packages/domain/src/utils/__tests__/scoring-derive.test.ts` | Tests for deleted module | D1 |
| `packages/domain/src/utils/__tests__/__fixtures__/scoring.fixtures.ts` | Fixtures for deleted tests | D1 |
| `packages/domain/src/utils/index.ts` | Remove `aggregateFacetScores`, `deriveTraitScores` exports | D1 |
| `packages/domain/src/index.ts` | Remove re-exports of above | D1 |

#### Phase 1: Micro-Intent Steering

**Created:**

| File | Purpose | Decision |
|---|---|---|
| `packages/domain/src/utils/steering/realize-micro-intent.ts` | Pure function: `{facet, domain, context} → MicroIntent` | D11 |
| `packages/domain/src/utils/steering/compute-domain-streak.ts` | Pure function: count consecutive same-domain turns | IC-2 |
| `packages/domain/src/utils/steering/__tests__/realize-micro-intent.test.ts` | Unit tests for intent selection + guardrails | D11 |
| `packages/domain/src/utils/steering/__tests__/compute-domain-streak.test.ts` | Unit tests | IC-2 |

**Modified:**

| File | Change | Decision |
|---|---|---|
| `packages/domain/src/utils/nerin-system-prompt.ts` | `buildChatSystemPrompt()` accepts `MicroIntent` instead of `targetFacet + targetDomain` | D11, P5 |
| `apps/api/src/use-cases/send-message.use-case.ts` | Call `realizeMicroIntent()` after steering, pass `MicroIntent` to Nerin | D11 |
| `packages/infrastructure/src/repositories/nerin-agent.anthropic.repository.ts` | Invoke signature accepts `MicroIntent` | D11 |
| `packages/domain/src/repositories/nerin-agent.repository.ts` | Interface updated for `MicroIntent` | D11 |
| `packages/infrastructure/src/db/drizzle/schema.ts` | Add `intentType` column to `assessment_messages` | A1 |
| `packages/infrastructure/src/repositories/assessment-message.drizzle.repository.ts` | Persist `intentType` on assistant messages | A1 |

#### Phase 2: Evidence v2 + Scoring v2

**Modified:**

| File | Change | Decision |
|---|---|---|
| `packages/domain/src/types/evidence.ts` | Replace `EvidenceInput` fields in-place: `score`/`confidence(float)` → `deviation`/`strength(enum)`/`confidence(enum)` | D4, P1 |
| `packages/domain/src/utils/formula.ts` | Rewrite `computeFacetMetrics()` for v2 natively; export `STRENGTH_WEIGHT`, `CONFIDENCE_WEIGHT`, `computeFinalWeight()` | IC-1, P2 |
| `packages/domain/src/utils/score-computation.ts` | Update to pass v2 evidence to `computeFacetMetrics()` | IC-1 |
| `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts` | New prompt: output `deviation`, `strength`, `confidence`, `note`, `domain`; Effect Schema updated for enums | D4 |
| `packages/infrastructure/src/db/drizzle/schema.ts` | `conversation_evidence`: replace `score`/`confidence` columns with `deviation`/`strength`/`confidence`/`note` | D4, D7 |
| `packages/infrastructure/src/repositories/conversation-evidence.drizzle.repository.ts` | Schema mapping updated for new columns | D4 |
| `apps/api/src/use-cases/send-message.use-case.ts` | Per-message cap 3→5, add session cap 80, early exit at cap, sort by `finalWeight` | D4, P6 |
| `packages/domain/src/utils/confidence.ts` | `computeDepthSignal()` uses `finalWeight ≥ 0.36` threshold | D4 |
| `packages/domain/src/utils/__tests__/__fixtures__/formula.fixtures.ts` | Update fixtures for v2 evidence shape | D4 |
| `packages/domain/src/utils/__tests__/formula-numerical-hand-computed.test.ts` | Update for new `computeFacetMetrics()` signature | IC-1 |
| `packages/domain/src/utils/__tests__/formula-numerical-components.test.ts` | Same | IC-1 |
| `packages/domain/src/utils/__tests__/formula-metrics-steering.test.ts` | Same | IC-1 |
| `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts` | Mock returns v2 evidence shape | D4 |
| `packages/infrastructure/src/repositories/__mocks__/conversation-evidence.drizzle.repository.ts` | Mock stores v2 fields | D4 |

#### Phase 3: Kill FinAnalyzer

**Modified (rewiring `finalization_evidence` → `conversation_evidence`):**

| File | Change | Decision |
|---|---|---|
| `apps/api/src/use-cases/generate-results.use-case.ts` | Full rewrite: stage-based idempotency, read `conversation_evidence`, no FinAnalyzer | D3, D10 |
| `packages/infrastructure/src/repositories/facet-evidence.drizzle.repository.ts` | Rewire to query `conversation_evidence` instead of `finalization_evidence` | D3 |
| `apps/api/src/use-cases/generate-full-portrait.use-case.ts` | Fetch `conversation_evidence` instead of `finalization_evidence` for portrait input | D3 |
| `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` | Same — fetch `conversation_evidence` | D3 |
| `packages/infrastructure/src/repositories/teaser-portrait.anthropic.repository.ts` | Input type changes from `FinalizationEvidenceRecord[]` to conversation evidence records; remove "specific thing they said" constraint | D3, D5 |
| `packages/domain/src/repositories/teaser-portrait.repository.ts` | `TeaserPortraitInput.evidence` type updated to conversation evidence | D3 |
| `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` | Remove "specific thing they said" constraint | D5 |
| `packages/domain/src/repositories/assessment-result.repository.ts` | Add `stage` enum field, `updateStage()` method | D10 |
| `packages/infrastructure/src/repositories/assessment-result.drizzle.repository.ts` | Implement `stage` column + `updateStage()` | D10 |
| `packages/infrastructure/src/db/drizzle/schema.ts` | Add `stage` enum to `assessment_results`; drop `finalization_evidence` table + its relations | D3, D10 |
| `apps/api/src/use-cases/send-message.use-case.ts` | Retry 1→2 on ConversAnalyzer, log warning on skip (no failure counter) | D9 |
| `packages/domain/src/utils/formula.ts` | `computeSteeringTarget()` iterates ALL 30 facets with OCEAN-interleaved tiebreaker | D2 |

**Config cleanup:**

| File | Change | Decision |
|---|---|---|
| `packages/domain/src/config/app-config.ts` | Remove `finanalyzerModelId` field | D3 |
| `packages/infrastructure/src/config/app-config.live.ts` | Remove `FINANALYZER_MODEL_ID` env var | D3 |
| `packages/infrastructure/src/utils/test/app-config.testing.ts` | Remove `finanalyzerModelId` test default | D3 |
| `packages/domain/src/config/__mocks__/app-config.ts` | Remove `finanalyzerModelId` mock default | D3 |

**App wiring cleanup:**

| File | Change | Decision |
|---|---|---|
| `apps/api/src/index.ts` | Remove `FinanalyzerAnthropicRepositoryLive`, `FinanalyzerMockRepositoryLive`, `FinalizationEvidenceDrizzleRepositoryLive` from `RepositoryLayers` | D3 |

**Barrel export cleanup:**

| File | Exports to remove | Decision |
|---|---|---|
| `packages/domain/src/index.ts` | `FinalizationEvidenceError`, `FinalizationEvidenceInput`, `FinalizationEvidenceRecord`, `FinalizationEvidenceRepository`, `FinanalyzerError`, `FinanalyzerMessage`, `FinanalyzerOutput`, `FinanalyzerRepository`, `computeHighlightPositions` | D3 |
| `packages/domain/src/utils/index.ts` | `computeHighlightPositions` | D3 |
| `packages/infrastructure/src/index.ts` | `FinanalyzerAnthropicRepositoryLive`, `FinanalyzerMockRepositoryLive`, `FinalizationEvidenceDrizzleRepositoryLive` | D3 |

**Deleted:**

| File | Reason | Decision |
|---|---|---|
| `packages/domain/src/repositories/finanalyzer.repository.ts` | Interface + types removed | D3 |
| `packages/infrastructure/src/repositories/finanalyzer.anthropic.repository.ts` | Implementation removed | D3 |
| `packages/infrastructure/src/repositories/finanalyzer.mock.repository.ts` | Mock removed | D3 |
| `packages/infrastructure/src/repositories/__mocks__/finanalyzer.anthropic.repository.ts` | Test mock removed | D3 |
| `packages/domain/src/repositories/finalization-evidence.repository.ts` | Interface removed | D3 |
| `packages/infrastructure/src/repositories/finalization-evidence.drizzle.repository.ts` | Implementation removed | D3 |
| `packages/infrastructure/src/repositories/__mocks__/finalization-evidence.drizzle.repository.ts` | Test mock removed | D3 |
| `packages/domain/src/utils/highlight.ts` | `computeHighlightPositions()` — only caller was `generate-results` via FinAnalyzer | D3 |
| `packages/domain/src/utils/__tests__/highlight.test.ts` | Tests for deleted function | D3 |

**NOT dead (confirmed still needed):**

| File | Why it survives |
|---|---|
| `packages/domain/src/utils/score-computation.ts` | Used by rewritten `generate-results` for `computeAllFacetResults()`, `computeTraitResults()`, `computeDomainCoverage()` |
| `packages/domain/src/types/facet-evidence.ts` | Core types (`SavedFacetEvidence`, `FacetScoresMap`, `TraitScoresMap`) used by portrait generation, relationship analysis, and frontend |
| `packages/domain/src/repositories/facet-evidence.repository.ts` | Active evidence API for frontend reads — rewired to `conversation_evidence` |
| `packages/infrastructure/src/repositories/facet-evidence.drizzle.repository.ts` | Same — rewired, not deleted |
| `packages/infrastructure/src/repositories/analyzer.claude.repository.ts` | ConversAnalyzer (Haiku), unrelated to FinAnalyzer |
| `packages/infrastructure/src/repositories/analyzer.mock.repository.ts` | ConversAnalyzer mock, unrelated to FinAnalyzer |

#### Phase 4: Context Dependence (Gated)

**Modified:**

| File | Change | Decision |
|---|---|---|
| `packages/domain/src/utils/formula.ts` | Add within-domain conflict detection to `computeFacetMetrics()` | Phase 4 |
| `packages/domain/src/utils/nerin-system-prompt.ts` | Add cross-domain confirmation intent when single-domain evidence | Phase 4 |
| `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` | Add narrative tags for "at work vs. at home" contrasts | Phase 4 |

### Boundary Changes

**Evidence boundary (most significant):**

```
BEFORE (3 systems, 2 tables):
  ConversAnalyzer → conversation_evidence  (steering only, disposable)
  FinAnalyzer     → finalization_evidence   (scoring + portraits, authoritative)
  scoring.ts      → re-computation          (display, ephemeral)

AFTER (1 system, 1 table):
  ConversAnalyzer → conversation_evidence  (steering + scoring + portraits + annotations)
  formula.ts      → assessment_results     (persisted once at finalization)
  Read path       → assessment_results     (no re-computation)
```

**Finalization evidence consumers — rewiring map:**

```
BEFORE (6 consumers of finalization_evidence):
  generate-results         → finalizationEvidenceRepo.saveBatch() + getByResultId()
  facet-evidence.drizzle   → queries finalization_evidence table
  generate-full-portrait   → fetches finalization evidence for portrait
  generate-relationship    → fetches finalization evidence for comparison
  teaser-portrait.anthropic → receives FinalizationEvidenceRecord[] as input
  teaser-portrait.repository → interface uses FinalizationEvidenceRecord type

AFTER (all rewired to conversation_evidence):
  generate-results         → reads conversation_evidence directly
  facet-evidence.drizzle   → queries conversation_evidence table
  generate-full-portrait   → fetches conversation evidence for portrait
  generate-relationship    → fetches conversation evidence for comparison
  teaser-portrait.anthropic → receives conversation evidence records
  teaser-portrait.repository → interface uses conversation evidence type
```

**Steering boundary (Phase 1):**

```
BEFORE:
  computeSteeringTarget() → { targetFacet, targetDomain }
  → injected directly into Nerin prompt as raw strings

AFTER:
  computeSteeringTarget() → { targetFacet, targetDomain }
  → realizeMicroIntent()  → MicroIntent
  → injected into Nerin prompt as structured intent
```

**Finalization boundary (Phase 3):**

```
BEFORE:
  generate-results → FinAnalyzer → finalization_evidence → scoring → teaser
  Idempotency: evidence existence check (Guard 2)

AFTER:
  generate-results → conversation_evidence → scoring → teaser
  Idempotency: assessment_results.stage progression
```

### New File Placement Rules

All new files follow existing conventions from NAMING-CONVENTIONS.md:

| New file type | Location | Naming pattern |
|---|---|---|
| Steering pure functions | `packages/domain/src/utils/steering/` | `kebab-case.ts` |
| Steering tests | `packages/domain/src/utils/steering/__tests__/` | `kebab-case.test.ts` |
| Type updates | `packages/domain/src/types/evidence.ts` | In-place modification |
| Schema changes | `packages/infrastructure/src/db/drizzle/schema.ts` | Single file |
| Migrations | `packages/infrastructure/src/db/drizzle/migrations/` | Generated by `pnpm db:generate` |

No new packages, no new apps, no new directories outside `steering/`. The rewrite stays within existing boundaries.

### Decision 7: Migration Strategy — Drop Tables, Fresh Start

**Problem:** Evidence v2 changes the `conversation_evidence` schema (new fields: `deviation`, `strength`, `confidence` enums, `note`; removed: `score`, `confidence` float). The `finalization_evidence` table is deleted entirely. In-flight sessions could have mixed v1/v2 evidence if a deployment happens mid-conversation.

**Decision:** Drop affected tables and start fresh on each schema-breaking deploy. No data migration, no dual-format readers, no backward compatibility.

**Rationale:** Pre-PMF with zero paying users. The cost of migration infrastructure exceeds the cost of lost test sessions. This applies to all pipeline schema changes across Phases 0–4.

**Tables affected per phase:**

| Phase | Tables dropped |
|---|---|
| Phase 2 (Evidence v2) | `conversation_evidence` |
| Phase 4 (Kill FinAnalyzer) | `finalization_evidence`, related FKs |

### Decision 8: Prompt Evaluation Strategy — Ship and Observe

**Problem:** Evidence v2 fundamentally changes ConversAnalyzer's output format (deviation + enums instead of score + float). There's no evaluation harness to measure whether the new prompt produces better evidence.

**Decision:** Ship and observe. No A/B testing, no shadow mode, no offline evaluation pipeline.

**Evaluation approach:**
1. Phase 0 adds coverage and quality metrics (`coveredFacets`, `questions_per_assistant_turn`, `topic_transitions_per_5_turns`)
2. Each phase ships, then observe metrics for a few sessions
3. Manual review of 5-10 sessions per prompt change — read evidence, check if facet/domain/deviation assignments look reasonable
4. Iterate prompt based on observations

**Rationale:** Pre-PMF. Building evaluation infrastructure before having users is premature optimization. The metrics from Phase 0 provide enough signal to detect regressions.

### Decision 9: ConversAnalyzer Error Resilience — Retry Twice, Non-Fatal

**Problem:** Once FinAnalyzer is killed (Decision 3), ConversAnalyzer becomes the only evidence source. Current policy is retry once → skip (fire-and-forget). This was acceptable when FinAnalyzer served as a safety net at finalization.

**Decision:** Bump retries from 1 to 2. Keep non-fatal — the conversation must never break because of evidence extraction failure. Failures tracked via structured logs (no session-row column).

**Retry policy:**

```
ConversAnalyzer failure → retry (attempt 2) → retry (attempt 3) → skip
  └─ log warning with sessionId + messageId
```

**Why non-fatal is still correct:** ConversAnalyzer runs 22 times per session (post-cold-start). Even if 3-4 calls fail, 18+ extraction opportunities remain. Sparse evidence from transient failures triggers THIN portrait mode via depth signal — the product degrades gracefully, it doesn't break.

**Why not fatal:** ConversAnalyzer runs in the hot path of `send-message`, sequentially before Nerin (steering depends on updated evidence). Making it fatal means a Haiku outage kills the conversation — user sends a message, gets an error. Unacceptable UX.

**Observability:** Structured log warnings with `sessionId` enable querying failure patterns via log search. No dedicated session-row column — logs are sufficient for pre-PMF diagnostics.

### Decision 10: Finalization Pipeline Rewrite — Stage-Based Idempotency

**Problem:** The current `generate-results.use-case.ts` is coupled to FinAnalyzer: placeholder `assessment_results` row → FinAnalyzer call → `finalization_evidence` → score computation → teaser. Guard 2 idempotency depends on `finalization_evidence` existence. After Decision 3, this entire structure must change.

**Decision:** Replace Guard 2 with a `stage` enum on `assessment_results`. Keep the 3-tier idempotency shape but source evidence from `conversation_evidence`.

**Data model addition:**

```
assessment_results.stage: enum('scored', 'completed')
```

No `scoringVersion` field — we don't re-score existing sessions.

**New idempotency rules:**

| Tier | Condition | Behavior |
|---|---|---|
| Tier 1 | `session.status === "completed"` | Return persisted results immediately |
| Tier 2 | Lock contention | Return current `assessment_results.stage` as progress (HTTP 200) |
| Guard 2 (replaced) | `assessment_results.stage === "completed"` | Return immediately — scoring + portrait already done |

**New `generate-results` pipeline:**

```
1. Acquire advisory lock
2. Upsert assessment_results row if missing (no stage)
3. Load conversation_evidence for session (authoritative source)
4. If stage !== "scored" and stage !== "completed":
   → computeAllFacetResults() + computeTraitResults() + computeDomainCoverage()
   → call Teaser Portrait (Haiku)
   → persist scores + portrait + lockedSectionTitles → set stage=scored (single transaction)
5. Set stage=completed, set session.status="completed"
6. Release lock (via Effect.ensuring, unchanged)
```

**What gets deleted:**
- `FinanalyzerRepository` call and all FinAnalyzer imports
- `finalization_evidence` table reads/writes
- `computeHighlightPositions()` call
- `phase1ResultId` / Guard 2 logic based on evidence existence
- Placeholder-row-then-update pattern (replaced by upsert + stage progression)

**What stays the same:**
- Advisory lock acquire/release pattern
- Teaser portrait generation + portrait table writes
- Cost tracking (fail-open)
- Session status transition to "completed"

### Decision 11: Micro-Intent Realizer — Domain Pure Function

**Problem:** Phase 1 introduces micro-intents (`story_pull`, `tradeoff_probe`, `contradiction_surface`, `domain_shift`, `depth_push`) but doesn't specify where the realizer lives, what it receives, or how guardrails are enforced.

**Decision:** Domain-layer pure function, called from `send-message.use-case.ts` after `computeSteeringTarget()` and before calling Nerin.

**Location:** `packages/domain/src/utils/steering/realize-micro-intent.ts`

**Inputs:**

```typescript
interface RealizeMicroIntentInput {
  readonly targetFacet: FacetName;
  readonly targetDomain: LifeDomain;
  readonly previousDomain: LifeDomain | null;
  readonly domainStreak: number;        // consecutive turns in same domain
  readonly turnIndex: number;           // user message count
  readonly nearingEnd: boolean;
  readonly recentIntentTypes: IntentType[];  // last 3
}
```

**Output:**

```typescript
interface MicroIntent {
  readonly intent: "story_pull" | "tradeoff_probe" | "contradiction_surface" | "domain_shift" | "depth_push";
  readonly domain: LifeDomain;
  readonly bridgeHint?: "map_same_theme" | "confirm_scope" | "contrast_domains";
  readonly questionStyle?: "open" | "choice";
}
```

**Integration in `send-message`:**

```
computeSteeringTarget() → { targetFacet, targetDomain }
realizeMicroIntent()    → { intent, domain, bridgeHint, questionStyle }
Nerin prompt receives MicroIntent instead of raw "Explore {facet} through {domain}"
```

**Guardrail enforcement:** Split between realizer and prompt.
- **Realizer:** Selects intents whose templates naturally imply one question. Avoids >2 probes in a row (checks `recentIntentTypes`).
- **Nerin prompt:** Explicit constraint: "At most one direct question per response."
- **Metric:** `questions_per_assistant_turn` tracked in Phase 0 to evaluate compliance.

**Data model addition:** Add `intentType` column to `assessment_messages` (assistant rows only). Same pattern as `targetDomain` and `targetFacet` — persisted on each assistant message so `recentIntentTypes` can be reconstructed from message history without in-memory state across stateless requests.

**Why pure function, not use-case:** Zero I/O, deterministic, cheaply unit-testable. Same pattern as `computeSteeringTarget()`.

### Decision 12: Conversation Review — Annotations via Extended Message Response

**Problem:** Decision 3 replaces inline highlights with "annotations beside messages" but doesn't specify the API contract or data shape for the frontend.

**Decision:** Extend the existing message response with an `annotations[]` array. No separate endpoint.

**API contract (added to existing get-results or get-messages response):**

```json
{
  "messages": [
    {
      "id": "msg_123",
      "role": "user",
      "content": "...",
      "annotations": [
        {
          "facet": "achievement_striving",
          "domain": "work",
          "deviation": 2,
          "strength": "strong",
          "confidence": "high",
          "note": "Describes setting ambitious goals and pushing through obstacles."
        }
      ]
    }
  ]
}
```

**Data source:** `conversation_evidence` joined on `messageId`. Evidence already has all required fields after Evidence v2.

**Filtering:** Client-side. API returns all annotations per message; frontend shows top 3 by `finalWeight` with expand to view all. This avoids a second API call for the full list.

**Display rule:** Do not expose facet labels or trait names to end-users (preserves "no clinical language" guardrail from portrait prompts). Annotations are for internal/debug mode only in MVP. The user-facing conversation review shows `note` text only, grouped by message.

### Self-Consistency Validation Findings

Derived the post-rewrite pipeline independently from two angles (data flow vs error flow) and compared for contradictions. Five items found, two requiring decisions, three noted as minor.

#### IC-1 (High): `computeFacetMetrics()` Signature — Rewrite for v2 Natively

**Problem:** `computeFacetMetrics()` currently accepts `EvidenceInput { score: number, confidence: number }`. After Evidence v2, evidence records contain `{ deviation: int, strength: enum, confidence: enum }`. The Deviation Aggregation spec describes a new formula but doesn't specify where the transform happens.

**Decision:** Rewrite `computeFacetMetrics()` to accept v2 evidence directly. No adapter layer, no v1→v2 mapper.

**New signature:**

```typescript
interface EvidenceInputV2 {
  readonly bigfiveFacet: FacetName;
  readonly domain: LifeDomain;
  readonly deviation: number;          // -3 to +3
  readonly strength: "weak" | "moderate" | "strong";
  readonly confidence: "low" | "medium" | "high";
}
```

**Weight maps co-located inside `computeFacetMetrics()`:**

```typescript
const STRENGTH_WEIGHT = { weak: 0.3, moderate: 0.6, strong: 1.0 } as const;
const CONFIDENCE_WEIGHT = { low: 0.3, medium: 0.6, high: 0.9 } as const;
// finalWeight = STRENGTH_WEIGHT[strength] × CONFIDENCE_WEIGHT[confidence]
```

The function computes `finalWeight` internally, uses it everywhere raw `confidence: number` was used. Deviation→score mapping (`MIDPOINT + D_f × SCALE_FACTOR`) also happens inside. Callers never touch weight maps or mappings.

**Ships in:** Phase 2 (Evidence v2). Breaking change to function signature — acceptable because Phase 2 also changes the DB schema and we drop tables (Decision 7).

**Downstream impact:** `computeAllFacetResults()`, `computeDepthSignal()`, and any other function calling `computeFacetMetrics()` must pass v2 evidence. `score-computation.ts` wrapper updated in same phase.

#### IC-2 (Medium): `domainStreak` — Compute from Message History

**Problem:** `realizeMicroIntent()` (Decision 11) requires `domainStreak` (consecutive turns in same domain) as input, but this value isn't tracked anywhere in the data model.

**Decision:** Compute from message history at call site in `send-message.use-case.ts`. No new session field.

**Implementation:**

```typescript
function computeDomainStreak(
  messages: { role: string; targetDomain?: LifeDomain | null }[],
  currentDomain: LifeDomain | null,
): number {
  if (!currentDomain) return 0;
  let streak = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "assistant" && msg.targetDomain === currentDomain) {
      streak++;
    } else if (msg.role === "assistant") {
      break;
    }
  }
  return streak;
}
```

O(n) over ≤50 messages, runs once per turn. Same pattern as `previousDomain` extraction already in `send-message`. Pure function, lives alongside `realizeMicroIntent` in `packages/domain/src/utils/steering/`.

**Ships in:** Phase 1 (Micro-Intent Steering).

#### IC-3 (Low, Noted): `finalWeight` Computation Placement

`finalWeight` appears in the API response (Decision 12 annotations) but isn't stored in `conversation_evidence`. It's computed from `strength` and `confidence` enums using the weight maps in domain.

**Resolution:** Compute at API read time. The handler or a mapper function applies `STRENGTH_WEIGHT[strength] × CONFIDENCE_WEIGHT[confidence]` when building the annotation response. Weight maps are exported from the domain package for reuse. No DB storage needed — it's a derived field.

#### IC-4 (Low, Noted): Portrait Write + Stage Update Atomicity

In Decision 10's finalization pipeline, scores + portrait persistence and `stage=scored` must happen atomically. With the simplified 2-stage model, this is a single transaction: compute scores → generate portrait → persist all + set `stage=scored` in one DB call.

**Resolution:** Resolved by D10 simplification — scores and portrait are persisted together in a single transaction with `stage=scored`. No crash window between separate stages.

#### IC-5 (Low, Noted): Duplicate Evidence on Nerin Retry

If Nerin fails after ConversAnalyzer evidence is saved, the user retries the same message. ConversAnalyzer re-extracts, producing duplicate evidence records for the same user message. Pre-existing issue, slightly amplified by higher per-message cap (5 vs 3).

**Mitigation:** The rolling session cap of 80 records bounds the impact. Additionally, a unique constraint on `(sessionId, messageId, bigfiveFacet, domain)` could deduplicate at the DB level, but this is a nice-to-have — not blocking. The scoring formula's weighted aggregation dilutes duplicate influence naturally.
