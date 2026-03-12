# Problem Solving Session: Prompt Builder Architecture — Static Character Bible vs Dynamic Steering Composition

**Date:** 2026-03-10
**Problem Solver:** Vincentlay
**Problem Category:** Conversation Architecture / Prompt Composition Pipeline

---

## PROBLEM DEFINITION

### Initial Problem Statement

The prompt builder is the final translation layer between the Move Governor's structured output and Nerin's actual system prompt. The broader prompt builder architecture has unresolved questions:

1. **Composition architecture:** How does the enriched territory system prompt section compose with the rest of Nerin's system prompt (`NERIN_PERSONA` + `CHAT_CONTEXT`)? Today it's simple string concatenation. The Governor's richer output demands a more intentional composition strategy.

2. **Separation of concerns:** `CHAT_CONTEXT` is a 276-line monolithic string that conflates personality (who Nerin IS), interaction patterns (how Nerin relates), and behavioral strategy (how Nerin steers). Stories 22-1, 22-2, and 22-3 already extracted pieces (depth pacing → territory system, contradiction belief → portrait generator). The boundaries have shifted but the constant hasn't been restructured. Some CHAT_CONTEXT guidance now overlaps with Governor-driven steering instructions — e.g., "Read the energy" in CONVERSATION AWARENESS partially duplicates what entry pressure instructions do.

3. **What's missing downstream:** The Governor spec defines *what* the prompt builder receives and *what* it produces (natural language instructions). But it doesn't specify how the prompt builder handles the boundary between static personality and dynamic per-turn instructions, or whether the character bible needs restructuring to avoid conflicting signals.

4. **Dev agent clarity:** The spec needs to be precise enough that a dev agent can implement the prompt builder without making architectural judgment calls about what belongs in the character bible vs what belongs in steering.

### Refined Problem Statement

**Design the prompt builder's full architecture: how the static character bible (NERIN_PERSONA + CHAT_CONTEXT) composes with the dynamic per-turn steering section (Governor output translation), what restructuring the character bible needs to eliminate overlap with Governor-driven instructions, and how the composition produces a coherent system prompt that a dev agent can implement with clear boundaries.**

The prompt builder's irreducible job:

> **Given Nerin's permanent personality, the Governor's per-turn constraints, and the territory catalog entry — produce a system prompt where personality is always-on and steering instructions are turn-specific, with no conflicting signals between the two layers.**

The architecture identity:
- The **character bible** defines *who Nerin is* — always present, never varies per turn
- The **steering section** defines *what Nerin should do this turn* — varies every turn, built from Governor output
- The **prompt builder** is the compositor — it knows both layers, owns their composition order, and ensures no conflicts
- The **Governor** deals in typed fields — the prompt builder is the ONLY layer that knows Nerin's voice

### Problem Context

**Current state (`nerin-system-prompt.ts`):**

```typescript
function buildChatSystemPrompt(params: ChatSystemPromptParams = {}): string {
  let prompt = `${NERIN_PERSONA}\n\n${CHAT_CONTEXT}`;
  if (territoryPrompt) {
    prompt += buildTerritorySystemPromptSection(territoryPrompt);
  }
  return prompt;
}
```

Three-part concatenation: `NERIN_PERSONA` (28 lines, shared identity) + `CHAT_CONTEXT` (276 lines, chat-specific behavior) + optional `TERRITORY GUIDANCE` block (energy + domains + opener).

**Future state (now specified in this document):**

The prompt builder receives a `PromptBuilderInput` discriminated union (5 intent variants) from the Governor and composes a four-layer system prompt: `NERIN_PERSONA` → Core Identity → Behavioral Modules (intent-contextual) → Steering Section (per-turn). See [Solution Generation](#solution-generation) for the full architecture.

**CHAT_CONTEXT section audit (initial → final assessment):**

| CHAT_CONTEXT Section | Initial Assessment | Final Assessment (post-session) |
|---|---|---|
| CONVERSATION MODE | Core identity — always-on | **Tier 1 core** — unchanged |
| BELIEFS IN ACTION | Core values — always-on | **Tier 1 core** — unchanged |
| RELATE > REFLECT | Interaction pattern — always-on | **Tier 2 contextual** — not needed on hold/amplify. Trimmed to principle + 2 examples. |
| STORY-PULLING | Interaction pattern — always-on | **Tier 2 contextual** — only on deepen. Trimmed to principle + 2 examples. |
| OBSERVATION + QUESTION | Partial overlap with overlays | **Tier 2 contextual** — rewritten as quality instinct (OBSERVATION_QUALITY). Mechanism removed, handled by focus instructions. |
| THREADING | Interaction pattern — always-on | **Tier 2 contextual** — only on bridge. As-is. |
| NATURAL WORLD MIRRORS | Personality — always-on | **Tier 2 contextual** — scoped into 4 per-intent libraries (deepen/bridge/hold/amplify). Placement rules extracted to Tier 1 guardrail. |
| QUESTIONING STYLE | No overlap | **Eliminated** — "leave room for neither" folded into deepen/bridge intent instructions. |
| RESPONSE FORMAT | No overlap | **Decomposed** — format guidance merged per-intent into intent instructions. "Every sentence earns its place" extracted to Tier 1 quality instinct. Response palette eliminated. |
| CONVERSATION AWARENESS | Gray zone — directives overlap with entry pressure | **Rewritten** — directives removed ("pivot angle", "acknowledge and move on"), instincts kept ("never make someone feel insufficient", IT'S OK TO NOT KNOW, meet vulnerability, celebrate depth). Moved to Tier 1 as CONVERSATION_INSTINCTS. |
| HUMOR | No overlap — guardrails | **Tier 1 core** — unchanged |
| WHAT STAYS INTERNAL | No overlap — silent tracking | **Tier 1 core** — unchanged |

**Key evolution:** The initial audit identified 2 gray-zone sections (CONVERSATION AWARENESS + OBSERVATION + QUESTION). The session revealed a deeper problem — even "clean" sections (RELATE > REFLECT, STORY-PULLING, MIRRORS) actively sabotage certain intents when always present. This led to the contextual composition model with 5 behavioral modules scoped per intent.

**Key files that will change:**

| File | Current Role | Future Role |
|---|---|---|
| `nerin-system-prompt.ts` | Simple concatenator | Compositor — knows both layers, manages composition |
| `territory-prompt-builder.ts` | Territory lookup + format | Enriched section builder — consumes Governor output |
| `nerin-chat-context.ts` | 276-line monolith | Decomposed into 7 Tier 1 core modules + 8 Tier 2 behavioral modules |
| `nerin-persona.ts` | Shared identity | Unchanged — clean separation already |

**Upstream contracts (revised by this spec):**
- `PromptBuilderInput` — discriminated union with 5 intent variants (open, deepen, bridge, hold, amplify), each carrying only its relevant parameters
- `MoveGovernorDebug` — flat trace for debug/replay (retains sessionPhase, transitionType for observability)
- Territory catalog — 25 territories with continuous `expectedEnergy`, dual-domain tags
- Governor adds `deriveIntent()` (~5 lines) and `toPromptBuilderInput()` mapping function

**Downstream consumer:**
- Anthropic API — receives the final system prompt string
- `nerin-agent.anthropic.repository.ts` (line 107) — calls `buildChatSystemPrompt()` and passes result to Claude

### Success Criteria

1. **Composition architecture spec** — how `NERIN_PERSONA` + `CHAT_CONTEXT` + enriched steering section compose into the final system prompt. Section order rationale (what goes where and why — LLM attention patterns).
2. **Character bible audit** — section-by-section analysis of CHAT_CONTEXT identifying what's always-on personality, what's steering-adjacent and needs rewording, and what should be removed (now handled by Governor instructions).
3. **Conflict resolution rules** — explicit rules for when character bible guidance and Governor steering instructions overlap (e.g., CONVERSATION AWARENESS "read the energy" vs entry pressure "approach gently").
4. **Prompt builder interface spec** — the full function signature, input types, composition logic, and output format. Tight enough for direct implementation.
5. **End-to-end prompt examples** — complete system prompts for representative scenarios (one per intent: `open`, `deepen` with angled entry, `bridge`, `hold` with noticing focus, `amplify` with contradiction focus).
6. **Dev agent implementability** — clear enough boundaries that a dev agent knows exactly what to build, what to restructure, and what to leave alone.

---

## DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

**Where the problem IS:**

| Dimension | IS | IS NOT |
|---|---|---|
| **What** | How static personality and dynamic steering compose into one prompt | The Governor's core restraint logic (locked) |
| **What** | CHAT_CONTEXT's 276-line monolith conflating personality with behavioral strategy | NERIN_PERSONA (clean, shared, 28 lines — no changes needed) |
| **What** | CONVERSATION AWARENESS section's directives overlapping with Governor entry pressure | Relate>Reflect, Story-Pulling, Threading, Mirrors as concepts (these are personality — now scoped per intent) |
| **What** | OBSERVATION + QUESTION mechanism overlapping with noticing/contradiction focus instructions | The mirror library content itself (curated per intent into 4 scoped libraries) |
| **What** | Behavioral modules (story-pulling, questioning) bleeding into turns where they conflict with intent (e.g., story-pulling during a hold moment) | The territory catalog or scorer formula |
| **What** | Governor output contract missing fields the prompt builder needs (`conversationalIntent`, `previousTerritory`) | Governor's core 3 decisions (entry pressure, noticing, contradiction) |
| **Where** | In `nerin-system-prompt.ts` (compositor) and `territory-prompt-builder.ts` (section builder) | In the pipeline (`nerin-pipeline.ts`) — pipeline just passes data through |
| **Where** | In `nerin-chat-context.ts` (needs decomposition into modules) | In `nerin-persona.ts` (clean as-is) |
| **Who** | The dev agent who implements this (needs unambiguous boundaries) | Nerin (Nerin doesn't know about architecture) |
| **Who** | The prompt builder (needs to compose contextually, not concatenate) | The Governor (deals in typed fields, never in prompt text) |
| **When** | At prompt composition time (every turn, context-dependent) | At Governor computation time (Governor doesn't know about prompt text) |

**Key diagnostic insight:** The problem is not overlap between two layers — it's the absence of a third concept. The character bible was doing double duty (personality AND turn management) because no steering layer existed. Now that the Governor handles turn management, the character bible needs decomposition: some sections are always-on personality, others are behavioral modules that should only appear when contextually relevant.

### Root Cause Analysis

**Five Whys:**

1. **Why does CONVERSATION AWARENESS overlap with entry pressure?** — Because before the Governor existed, Nerin needed inline instructions for "read the energy" and "pivot when guarded." Those were the only pacing mechanism.

2. **Why were pacing instructions in the character bible?** — Because the original system had no territory policy. Nerin WAS the pacing layer. The character bible did double duty: personality AND strategy.

3. **Why wasn't this fully extracted when the territory system was built?** — Story 22-1 extracted depth progression pacing (messages 14-18 rules) but left energy reading and pivot-on-guard because they still felt like personality. They're in the gray zone.

4. **Why is the gray zone dangerous now?** — Because the Governor's entry pressure instruction ("approach gently") and CONVERSATION AWARENESS ("Pivot angle — come at the same territory from a different direction") produce conflicting signals. The LLM sees both and averages them, producing confused responses.

5. **Why does averaging happen?** — Because both are phrased as directives (action instructions). When two directives conflict, the LLM compromises. The fix: character bible describes instincts ("you never make someone feel insufficient"), steering section gives directives ("enter at an angle"). Different abstraction levels don't conflict.

**Root cause:** CHAT_CONTEXT was written as a monolith before the steering pipeline existed. It mixed *who Nerin is* (coherence across surfaces and turns) with *what Nerin should do in specific situations* (per-turn management). The Governor now owns per-turn management, making the remaining directives in gray-zone sections redundant and potentially conflicting.

**Deeper root cause (discovered during party mode):** Even beyond the overlap, the monolithic character bible creates a structural problem: behavioral modules like STORY-PULLING and QUESTIONING STYLE are always present even when they actively work against the current conversational intent. During a `hold` moment (noticing/contradiction overlay), the presence of "70%+ of your questions should pull for stories" and "mix open-ended with choice-based questions" pressures Nerin to ask questions — sabotaging the suspended-note beat that needs SILENCE, not questions.

### Contributing Factors

1. **No separation principle existed** — "coherence vs turn management" and "instinct vs instruction" were never articulated as design principles until this session
2. **The original system had no steering pipeline** — CHAT_CONTEXT was the only way to influence Nerin's behavior, so it included everything
3. **Story 22-1/22-2/22-3 extractions stopped at the gray zone** — depth pacing and contradiction belief were extracted, but energy-reading directives and observation mechanisms were left because they felt like personality
4. **The Governor was designed top-down** — from "what does Nerin need restraining on?" The prompt builder asking bottom-up ("what do I need to compose the right prompt?") revealed gaps in the Governor's output contract
5. **No conversational intent concept** — the Governor outputs constraints (pressure, overlay, phase) but not the *kind of moment* the prompt builder needs to select appropriate behavioral modules
6. **Monolithic string architecture** — CHAT_CONTEXT as one 276-line constant makes it impossible to include/exclude sections contextually per turn

### System Dynamics

**The Instinct-vs-Instruction Principle:**

| Layer | Speaks as | Example | Changes per turn? |
|---|---|---|---|
| Character Bible | *"You are someone who..."* | "You naturally notice when someone closes up" | Never |
| Steering Section | *"This turn, do..."* | "Enter at an angle — find a lighter doorway" | Every turn |

When the character bible describes instincts and the steering section gives directives, they cooperate (different abstraction levels). When both give directives, they compete (same abstraction level, potentially conflicting).

**The Contextual Composition Discovery:**

The monolithic always-on character bible creates a second dynamic: behavioral modules that are helpful in some contexts actively sabotage others. Story-pulling helps during `deepen` but hurts during `hold`. Questioning style helps during `deepen` but hurts during `amplify`. The prompt builder needs to compose contextually — including only the behavioral modules that serve the current conversational intent.

This led to the three-tier prompt model:

```
┌─────────────────────────────────────────────┐
│  NERIN_PERSONA (universal identity)         │  ← shared across all surfaces
├─────────────────────────────────────────────┤
│  Core Identity modules (always-on chat)     │  ← makes Nerin coherent across
│                                             │     all 25 messages
├─────────────────────────────────────────────┤
│  Behavioral modules (intent-contextual)     │  ← included/excluded based on
│                                             │     conversationalIntent
├─────────────────────────────────────────────┤
│  Steering section (per-turn)                │  ← Governor output translation
└─────────────────────────────────────────────┘
```

**The Governor Output Gap:**

The prompt builder's contextual composition needs revealed two missing fields in the Governor's output contract:

1. **`conversationalIntent`** — the prompt builder needs to know what kind of moment this is (open/deepen/bridge/hold/amplify) to select appropriate behavioral modules. The Governor already computes this implicitly — it just doesn't name it. Derivation is a pure function of existing fields (~5 lines).

2. **`previousTerritory`** — the prompt builder needs to know where we're coming FROM during a `bridge` intent to compose connection instructions ("That thing about work — how does it play out in friendships?"). The Governor already scans prior messages for session state — reading the last territory is zero additional cost.

**Rhythm Emergence:**

The prompt builder does NOT control conversation rhythm. Rhythm emerges from the interplay between:
- The **scorer** (session-arc frequency — light→medium→heavy trajectory via conversationSkew)
- The **Governor** (turn frequency — constraints, overlays, entry pressure)
- The **pacing formula** (E_target — reads user state, sets energy ceiling)

The prompt builder's role is to faithfully shape each beat — not to orchestrate the sequence. It supports rhythm by composing the right behavioral modules for each intent, preventing modules from sabotaging beats (no questioning during hold, no length constraints during amplify).

---

## ANALYSIS

### Force Field Analysis

**Driving Forces (Supporting Solution):**

- **Locked upstream contracts** — Governor output is well-defined, prompt builder inputs are known
- **Clear separation principle** — instinct vs instruction, coherence vs turn management — provides unambiguous audit criteria
- **Existing module boundaries** — CHAT_CONTEXT already has named sections (11 of them) with clear headers. Decomposition follows existing structure.
- **Complexity is proportionate** — the scorer has a five-term formula with quadratic penalties and Jaccard similarity. A composition matrix with if-statements is trivial by comparison.
- **Two Governor additions are pure derivations** — `conversationalIntent` is ~5 lines from existing fields, `previousTerritory` is a session state read the Governor already performs
- **Contextual composition eliminates conflicting signals** — the root cause of "Nerin averages contradictory instructions" is resolved architecturally, not by prompt tuning

**Restraining Forces (Blocking Solution):**

- **Testing surface grows** — contextual composition means testing each intent × module combination, not just "prompt with territory" and "prompt without"
- **Module decomposition requires careful surgery** — splitting CHAT_CONTEXT into separate constants/files requires preserving coherence while enabling selective inclusion
- **Mirror library scoping requires careful curation** — 13 mirrors split into 4 per-intent libraries (10/4/4/4) based on psychological shape analysis. Some mirrors may need rewording to fit their intent context.
- **Behavioral module content needs rewriting** — CONVERSATION AWARENESS and OBSERVATION + QUESTION need instinct-vs-instruction surgery, not just extraction
- **E_target not yet built** — entry pressure defaults to `"direct"` until pacing pipeline exists, limiting the prompt builder's ability to demonstrate soft/angled entry in practice

**Balance:** Driving forces dominate. The contextual composition model is architecturally clean and the implementation complexity is modest relative to the codebase's existing patterns.

### Constraint Identification

**Primary constraint: The Governor output contract must expand minimally.**

Two new fields (`conversationalIntent`, `previousTerritory`) are the minimum additions that make the prompt builder fully deterministic. No inference, no judgment calls in the prompt builder.

**Secondary constraint: Character bible decomposition must preserve cross-surface coherence.**

`NERIN_PERSONA` is shared with the portrait generator. `CHAT_CONTEXT` is chat-only. The decomposed modules must remain chat-only — the portrait generator has its own context. Core identity modules (always-on) are the chat-specific coherence layer.

**Tertiary constraint: The prompt builder input must be a fully-shaped discriminated union.**

The prompt builder receives `PromptBuilderInput` — a discriminated union where each intent variant carries only its relevant parameters. No nullable fields, no derivation logic. The Governor handles intent derivation and produces the union; the prompt builder consumes it. Five intents, five code paths, no ambiguity.

**Quaternary constraint: The prompt builder is a faithful translator, not a rhythm engine.**

Rhythm emerges from scorer + Governor + pacing formula. The prompt builder shapes each beat via module selection but never second-guesses the Governor's output. No `previousIntent` tracking, no turn-number awareness, no post-hold softening logic. Entry pressure already captures these dynamics via E_target.

### Key Insights

1. **The character bible is Nerin's coherence layer, not just personality.** It's what makes Nerin sound like Nerin between message 3 and message 22, and between the chat and the portrait. The test for each section: "does this make Nerin coherent across surfaces and turns?"

2. **The instinct-vs-instruction principle resolves all gray-zone conflicts.** Character bible describes instincts ("you never make someone feel insufficient"). Steering section gives directives ("enter at an angle"). Different abstraction levels cooperate. Same abstraction level competes.

3. **Contextual module composition solves the deeper problem.** Beyond overlap, the monolithic bible actively sabotages certain beats. Story-pulling during a hold, questioning during amplification — these are conflicting signals that concatenation can't resolve. Only contextual composition (include modules based on intent) eliminates the conflict.

4. **Five conversational intents form a complete vocabulary.** `open`, `deepen`, `bridge`, `hold`, `amplify`. Validated by storytelling analysis: every dramatic beat in a transformative conversation maps to one of these. `explore` merged into `deepen` — once you're in a territory, you're always going further. "Return" is a `bridge` flavor.

5. **The Governor output gap is small and clean.** Two additions: `deriveIntent()` (pure derivation from existing fields, ~5 lines) and `previousTerritory` (session state read the Governor already performs). The Governor adds `toPromptBuilderInput()` to produce the discriminated union. No new inputs, no new dependencies.

6. **The prompt builder becomes a deterministic compositor.** Intent → module set (from composition matrix) → compose sections → output string. No inference, no judgment. Pure function of Governor output + territory catalog.

7. **Hold must be strictly protected.** The absence of "ask something" IS the hold instruction. No questioning modules, no story-pulling. The composition matrix enforces this architecturally, not by prompt discipline.

8. **Rhythm is emergent, not composed.** The scorer operates at session-arc frequency, the Governor at turn frequency, the prompt builder at beat frequency. They nest like waves within waves. The prompt builder supports rhythm by shaping each beat correctly — it never orchestrates the sequence.

---

## SOLUTION GENERATION

### Methods Used

- **Party Mode Panel** (Winston, Dr. Quinn, Sophia) — collaborative architecture design with adversarial stress-testing
- **Red Team vs Blue Team** — adversarial attack on the architecture (5 attacks, 0 architectural changes needed, 2 monitoring notes)
- **First Principles Analysis** — stripped assumptions and rebuilt from fundamental truths (6 principles confirmed)
- **Critique and Refine** — three rounds of systematic review (W1-W5 identified, all resolved: module count 10→5, format merged into intent instructions, mirrors scoped per intent, token budget validated)

### The Prompt Builder Architecture

#### Guiding Principles

1. **Instinct vs Instruction:** The character bible describes instincts ("you never make someone feel insufficient"). The steering section gives directives ("enter at an angle"). Different abstraction levels cooperate. Same abstraction level competes.
2. **Trust the LLM for creative judgment, constrain it for frequency control.** Mirrors = creative judgment → trust Nerin on WHEN. Noticing frequency = structural control → constrain via Governor.
3. **Focus compensates for Nerin's computational blind spots, not its conversational ones.** Hold and amplify need `MomentFocus` because Nerin can't compute emergence formulas or cross-domain divergence. Deepen and bridge don't — Nerin follows threads naturally.
4. **The absence of modules IS the instruction.** A hold-Nerin doesn't have questioning instincts loaded. The prompt builder doesn't just say "don't ask questions" — it gives Nerin a different cognitive palette for each beat.
5. **Tier 1 test:** "If you removed this module for one turn, would Nerin stop sounding like Nerin?" Yes → Tier 1. No → Tier 2.

---

#### Governor Output Revision

The Governor's output contract splits into two consumers:

**1. `PromptBuilderInput` — discriminated union for the prompt builder:**

```typescript
// ─── Moment Focus (tagged union) ───────────────────

type NoticingFocus = {
  readonly _tag: "NoticingFocus"
  readonly domain: LifeDomain
}

type ContradictionFocus = {
  readonly _tag: "ContradictionFocus"
  readonly target: ContradictionTarget
}

type MomentFocus = NoticingFocus | ContradictionFocus

// ─── Conversational Intent ─────────────────────────

type ConversationalIntent = "open" | "deepen" | "bridge" | "hold" | "amplify"

// ─── Prompt Builder Input (discriminated union) ────

type PromptBuilderInput =
  | {
      readonly intent: "open"
      readonly territory: Territory
    }
  | {
      readonly intent: "deepen"
      readonly territory: Territory
      readonly entryPressure: "direct" | "angled" | "soft"
    }
  | {
      readonly intent: "bridge"
      readonly territory: Territory
      readonly previousTerritory: Territory
      readonly entryPressure: "direct" | "angled" | "soft"
    }
  | {
      readonly intent: "hold"
      readonly territory: Territory
      readonly focus: MomentFocus
    }
  | {
      readonly intent: "amplify"
      readonly territory: Territory
      readonly focus: MomentFocus | null
    }
```

**Key design choices:**
- **`sessionPhase` and `transitionType` removed** — fully subsumed by `conversationalIntent`. Retained only in `MoveGovernorDebug` for debug/replay.
- **`entryPressure` only on `deepen` and `bridge`** — meaningless on `open` (always warm invitation), `hold` (sitting with something, not entering), and `amplify` (go bold, softening contradicts intent).
- **`focus` required on `hold`, optional on `amplify`, absent elsewhere** — the type system prevents impossible states (hold without focus, bridge without previousTerritory).
- **`MomentFocus` replaces "overlay"** — overlays were optional layers on top of a base move. Focus IS the substance of the hold, not a decoration. Named from Nerin's perspective: "what is this moment focused on?"
- **Five intents, not six** — `explore` merged into `deepen`. Every `transitionType: "continue"` turn is deepening — once you're in a territory, you're always going further. The first turn in a new territory is `bridge`.

**2. `MoveGovernorDebug` — flat trace for debug/replay (unchanged from Governor spec)**

**Governor responsibility (not in this spec):**

The Governor owns intent derivation (`deriveIntent()`) and the mapping to `PromptBuilderInput` (`toPromptBuilderInput()`). These belong in the Governor spec — the prompt builder never sees sessionPhase, transitionType, or the derivation logic. It receives a fully-shaped `PromptBuilderInput` discriminated union.

The Governor is the verified gate between its nullable internal world and the prompt builder's type-safe world. Impossible states are eliminated at that boundary, not here.

---

#### Character Bible Decomposition

CHAT_CONTEXT splits into two tiers. NERIN_PERSONA remains unchanged (shared with portrait generator).

**Tier 1: Core Identity (always-on, every turn)**

These make Nerin coherent across all 25 messages. The test: removing any of these for one turn would make Nerin unrecognizable.

| Module | Source | Change |
|---|---|---|
| `CONVERSATION_MODE` | CONVERSATION MODE | As-is — "you are mid-dive, the conversation IS the assessment" |
| `BELIEFS_IN_ACTION` | BELIEFS IN ACTION | As-is — three core beliefs |
| `CONVERSATION_INSTINCTS` | CONVERSATION AWARENESS (rewritten) | **Rewrite** — remove directives ("pivot angle", "acknowledge and move on"), keep instincts ("never make someone feel insufficient", "IT'S OK TO NOT KNOW", "meet vulnerability first", "celebrate depth", "read the energy") |
| `QUALITY_INSTINCT` | RESPONSE FORMAT (extracted) | One line: "Every sentence earns its place. Keep responses focused — default to concise unless the moment calls for more." |
| `MIRROR_GUARDRAILS` | NATURAL WORLD MIRRORS (extracted) | Placement rules only (~80 tokens): "1-2 mirrors max, accompany responses, after vulnerability meet first, biological accuracy non-negotiable" |
| `HUMOR_GUARDRAILS` | HUMOR | As-is — prevent tone disasters |
| `INTERNAL_TRACKING` | WHAT STAYS INTERNAL | As-is — prevents analyzing out loud |

**Tier 2: Behavioral Modules (contextual, included per intent)**

These shape Nerin's behavior for specific conversational moments. Removing any for one turn changes technique but preserves identity.

| Module | Source | Change |
|---|---|---|
| `RELATE_REFLECT` | RELATE > REFLECT | **Trim** — principle + AI-truthful framing + 2 examples (down from 5) |
| `STORY_PULLING` | STORY-PULLING | **Trim** — principle + "stories over introspection" rationale + 2 examples (down from 5) |
| `OBSERVATION_QUALITY` | OBSERVATION + QUESTION (rewritten) | **Rewrite** — keep quality instinct ("the pairing is the tool", "never just observe, never just ask", "the observation shows you're listening, the question gives ownership"). Remove mechanism (now handled by focus instructions). |
| `THREADING` | THREADING | As-is — connecting threads, flag-and-leave, park-and-pick |
| `MIRRORS_DEEPEN` | NATURAL WORLD MIRRORS (scoped) | 10 mirrors: Hermit Crab, Ghost Net, Pilot Fish, Tide Pool, Mimic Octopus, Clownfish, Dolphin Echolocation, Bioluminescence, Parrotfish (careful), Sea Urchin |
| `MIRRORS_BRIDGE` | NATURAL WORLD MIRRORS (scoped) | 4 mirrors: Tide Pool, Coral Reef, Volcanic Vents, Mola Mola |
| `MIRRORS_HOLD` | NATURAL WORLD MIRRORS (scoped) | 4 mirrors: Hermit Crab, Pilot Fish, Dolphin Echolocation, Bioluminescence |
| `MIRRORS_AMPLIFY` | NATURAL WORLD MIRRORS (scoped) | 4 mirrors: Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola |

**Eliminated modules (absorbed into intent instructions):**
- ~~HOLD_FORMAT~~ → merged into `hold` intent instruction
- ~~CLOSING_FORMAT~~ → merged into `amplify` intent instruction
- ~~RESPONSE_PALETTE~~ → response shapes merged into relevant intent instructions
- ~~QUESTIONING_PALETTE~~ → "leave room for neither" folded into `deepen`/`bridge` intent instructions
- ~~RESPONSE_SHAPE~~ → "every sentence earns its place" moved to Tier 1 `QUALITY_INSTINCT`

**Mirror scoping rationale:** The library exists because testing without it produced hollow metaphors — pretty words with no psychological weight. The curation (specific psychological mappings) IS the value. But not every mirror serves every intent:
- `deepen` mirrors illuminate one moment (go vertical) — 10 mirrors for the widest emotional range
- `bridge` mirrors connect two topics (go lateral) — 4 mirrors designed for transitions
- `hold` mirrors work as two-sentence suspended notes (one mirror + one clarification) — 4 mirrors that land in minimal space
- `amplify` mirrors crystallize boldly (go devastating) — 4 mirrors for final moments
- Trust Nerin on WHEN to use a mirror (Tier 1 guardrails). Don't trust Nerin on WHICH mirror without curated options.

---

#### Composition Matrix

| Intent | Core Identity | Relate>Reflect | Story-Pulling | Obs Quality | Threading | Mirrors |
|---|---|---|---|---|---|---|
| `open` | always | yes | — | — | — | — |
| `deepen` | always | yes | yes | — | — | `MIRRORS_DEEPEN` |
| `bridge` | always | yes | — | — | yes | `MIRRORS_BRIDGE` |
| `hold` | always | — | — | yes | — | `MIRRORS_HOLD` |
| `amplify` | always | — | — | if focus | — | `MIRRORS_AMPLIFY` |

---

#### Prompt Builder Implementation

```typescript
// ─── Main Entry Point ──────────────────────────────

function buildChatSystemPrompt(input: PromptBuilderInput): string {
  const sections: string[] = []

  // Layer 1: Universal identity (always)
  sections.push(NERIN_PERSONA)

  // Layer 2: Core identity (always)
  sections.push(CORE_IDENTITY)

  // Layer 3: Behavioral modules (intent-contextual)
  sections.push(composeBehavioralModules(input))

  // Layer 4: Steering section (per-turn)
  sections.push(composeSteeringSection(input))

  return sections.join("\n\n")
}
```

**Layer 3 — Behavioral module composition:**

```typescript
function composeBehavioralModules(input: PromptBuilderInput): string {
  switch (input.intent) {
    case "open":
      return [RELATE_REFLECT].join("\n\n")

    case "deepen":
      return [RELATE_REFLECT, STORY_PULLING, MIRRORS_DEEPEN].join("\n\n")

    case "bridge":
      return [RELATE_REFLECT, THREADING, MIRRORS_BRIDGE].join("\n\n")

    case "hold":
      return [OBSERVATION_QUALITY, MIRRORS_HOLD].join("\n\n")

    case "amplify":
      return [
        ...(input.focus ? [OBSERVATION_QUALITY] : []),
        MIRRORS_AMPLIFY
      ].join("\n\n")
  }
}
```

**Layer 4 — Steering section composition:**

```typescript
function composeSteeringSection(input: PromptBuilderInput): string {
  const sections: string[] = []

  // 1. Territory guidance (always)
  sections.push(buildTerritoryGuidance(input.territory))

  // 2. Intent instruction with format guidance (always)
  sections.push(buildIntentInstruction(input))

  // 3. Entry pressure (deepen + bridge only, if not direct)
  if ((input.intent === "deepen" || input.intent === "bridge")
      && input.entryPressure !== "direct") {
    sections.push(buildEntryPressureInstruction(input.entryPressure))
  }

  // 4. Focus (hold always, amplify if present)
  if (input.intent === "hold") {
    sections.push(buildFocusInstruction(input.focus))
  } else if (input.intent === "amplify" && input.focus) {
    sections.push(buildFocusInstruction(input.focus))
  }

  // 5. Amplification (amplify only — LAST position for highest LLM attention)
  if (input.intent === "amplify") {
    sections.push(buildAmplificationInstruction())
  }

  return sections.join("\n\n")
}
```

---

#### Intent Instructions (with format guidance)

Each intent instruction carries its own response format — format IS the intent, they're inseparable.

**`open`:**
> "You're meeting this person for the first time. Invite them in with warmth and genuine curiosity. One clear, concrete question. Keep it to 1-3 sentences — light, direct, no preamble."

**`deepen`:**
> "Stay with this thread — there's more here. Go further, not wider. Pull for the story underneath the story. 2-4 sentences. One question maximum. Leave room for 'neither' — the best answers often reject the premise."

**`bridge`:**
> "You're moving from [previous territory domains] into [new territory domains]. Find the connection — what thread from the last topic opens a door into this one? The transition should feel like discovery, not a topic change. If no natural connection exists, a clean shift is fine — honesty about changing direction is better than a forced bridge. 2-5 sentences — the connection needs room to breathe. One question maximum. Leave room for 'neither.'"

**`hold`:**
> "This is a moment to pause. Let your observation land — one to two sentences. No follow-up question. If a mirror fits, let it carry the meaning. Let silence do the work."

**`amplify`:**
> "This moment matters. If there's something you've been sensing but haven't said — a pattern, a tension, a question — now is the time. Go deeper, not wider. Say what you see with conviction. 3-6 sentences. No question needed."

---

#### Focus Instructions

**Noticing focus:**
> "FOCUS: Something is becoming clear about how they relate to [domain]. If it feels right, reflect what you're seeing — not as analysis, but as genuine noticing. This is a moment worth pausing for."

**Contradiction focus:**
> "FOCUS: You've noticed something fascinating: when they talk about [domainA], their [facet description] looks quite different than when they talk about [domainB]. If the moment is right, surface this with genuine fascination, not as a gotcha. 'I find it interesting that...' Frame it as curiosity about their complexity."

---

#### Entry Pressure Instructions

| Pressure | Instruction |
|---|---|
| `direct` | (No instruction — standard entry) |
| `angled` | "Enter this territory at an angle — don't go straight to the core. Find a lighter doorway into the topic." |
| `soft` | "This territory may be heavier than the person is ready for right now. Approach very gently — you might touch the edge of this topic without entering fully. Let them lead if they want to go deeper." |

---

#### Amplification Instruction

> "FINAL MOMENT: This moment matters. If there's something you've been sensing but haven't said — a pattern, a tension, a question — now is the time. Go deeper, not wider."

Properties:
- No closing language — no "before we wrap up"
- Nerin doesn't know it's the last turn
- Broad, not directive — maps to noticing, contradiction, or bare amplification
- LAST position in the prompt for highest LLM attention

---

#### Token Budget

| Intent | Estimated Tokens | vs Current Monolith (2400) |
|---|---|---|
| `open` | ~530 | **-78%** |
| `deepen` | ~1350 | **-44%** |
| `bridge` | ~1170 | **-51%** |
| `hold` | ~850 | **-65%** |
| `amplify` | ~920 | **-62%** |

Every intent produces a shorter, more focused prompt than the current monolithic 2400-token system prompt. Less noise = more steering compliance = better Nerin responses.

---

#### End-to-End Prompt Examples

Each example shows the complete assembled system prompt for one intent, using abbreviated module text (marked `[...]`) to show structure without consuming pages. The actual modules will contain the full text from Steps 2-3 of the implementation plan.

**Example 1: `open` — first turn, daily-routines territory**

Input: `{ intent: "open", territory: DAILY_ROUTINES }`

```
[NERIN_PERSONA — 28 lines, shared identity, voice, anti-patterns]

[CORE_IDENTITY — 7 modules joined]
  CONVERSATION_MODE: You are mid-dive — exploring, gathering...
  BELIEFS_IN_ACTION: The most interesting thing is usually what they think is ordinary...
  CONVERSATION_INSTINCTS: Never make someone feel like their answer wasn't good enough. IT'S OK TO NOT KNOW...
  QUALITY_INSTINCT: Every sentence earns its place...
  MIRROR_GUARDRAILS: 1-2 mirrors max, accompany questions, after vulnerability meet first...
  HUMOR_GUARDRAILS: Humor must land for both of you...
  INTERNAL_TRACKING: You are silently tracking emerging patterns...

[BEHAVIORAL MODULES — open gets RELATE_REFLECT only]
  RELATE_REFLECT: Your primary interaction pattern: share something that relates, then invite reflection...
    [principle + AI-truthful framing + 2 examples]

[STEERING SECTION]
  TERRITORY GUIDANCE:
  Energy: light
  Domain area: work, solo
  Suggested direction — you could explore something like: "What does a typical morning look like for you before the day really gets going?"
  This is a suggestion, not a script. Follow the natural flow of conversation.

  INTENT: You're meeting this person for the first time. Invite them in with warmth and genuine curiosity. One clear, concrete question. Keep it to 1-3 sentences — light, direct, no preamble.
```

**Example 2: `deepen` — angled entry, work-dynamics territory**

Input: `{ intent: "deepen", territory: WORK_DYNAMICS, entryPressure: "angled" }`

```
[NERIN_PERSONA]

[CORE_IDENTITY — same 7 modules as always]

[BEHAVIORAL MODULES — deepen gets RELATE_REFLECT + STORY_PULLING + MIRRORS_DEEPEN]
  RELATE_REFLECT: [principle + AI-truthful framing + 2 examples]
  STORY_PULLING: Story-pulling is your primary question type — pull for concrete, situated narratives...
    [principle + rationale + 2 examples]
  MIRRORS_DEEPEN: [10-mirror library — Hermit Crab, Ghost Net, Pilot Fish, Tide Pool,
    Mimic Octopus, Clownfish, Dolphin Echolocation, Bioluminescence, Parrotfish, Sea Urchin]

[STEERING SECTION]
  TERRITORY GUIDANCE:
  Energy: medium
  Domain area: work
  Suggested direction — you could explore something like: "What's the most interesting challenge you've faced at work recently?"

  INTENT: Stay with this thread — there's more here. Go further, not wider. Pull for the story underneath the story. 2-4 sentences. One question maximum. Leave room for 'neither' — the best answers often reject the premise.

  ENTRY: Enter this territory at an angle — don't go straight to the core. Find a lighter doorway into the topic.
```

**Example 3: `bridge` — from social-circles to friendship-depth**

Input: `{ intent: "bridge", territory: FRIENDSHIP_DEPTH, previousTerritory: SOCIAL_CIRCLES, entryPressure: "direct" }`

```
[NERIN_PERSONA]

[CORE_IDENTITY — same 7 modules]

[BEHAVIORAL MODULES — bridge gets RELATE_REFLECT + THREADING + MIRRORS_BRIDGE]
  RELATE_REFLECT: [principle + AI-truthful framing + 2 examples]
  THREADING: Connect threads across the conversation... flag-and-leave, park-and-pick...
  MIRRORS_BRIDGE: [4-mirror library — Tide Pool, Coral Reef, Volcanic Vents, Mola Mola]

[STEERING SECTION]
  TERRITORY GUIDANCE:
  Energy: medium
  Domain area: relationships
  Suggested direction — you could explore something like: "Think of a close friend — what made that friendship become important to you?"

  INTENT: You're moving from relationships into relationships. Find the connection — what thread from the last topic opens a door into this one? The transition should feel like discovery, not a topic change. If no natural connection exists, a clean shift is fine — honesty about changing direction is better than a forced bridge. 2-5 sentences — the connection needs room to breathe. One question maximum. Leave room for 'neither.'
```

Note: no entry pressure instruction — `direct` means standard entry.

**Example 4: `hold` — noticing focus on relationships domain**

Input: `{ intent: "hold", territory: FRIENDSHIP_DEPTH, focus: { _tag: "NoticingFocus", domain: "relationships" } }`

```
[NERIN_PERSONA]

[CORE_IDENTITY — same 7 modules]

[BEHAVIORAL MODULES — hold gets OBSERVATION_QUALITY + MIRRORS_HOLD]
  OBSERVATION_QUALITY: When you notice something specific — name it and hand it back.
    The observation shows you're listening. The question gives ownership.
    Never just observe. Never just ask. The pairing is the tool.
  MIRRORS_HOLD: [4-mirror library — Hermit Crab, Pilot Fish, Dolphin Echolocation, Bioluminescence]

[STEERING SECTION]
  TERRITORY GUIDANCE:
  Energy: medium
  Domain area: relationships
  Suggested direction — you could explore something like: "Think of a close friend — what made that friendship become important to you?"

  INTENT: This is a moment to pause. Let your observation land — one to two sentences. No follow-up question. If a mirror fits, let it carry the meaning. Let silence do the work.

  FOCUS: Something is becoming clear about how they relate to relationships. If it feels right, reflect what you're seeing — not as analysis, but as genuine noticing. This is a moment worth pausing for.
```

Note: no RELATE_REFLECT, no STORY_PULLING, no THREADING. The absence of questioning modules IS the hold instruction.

**Example 5: `amplify` — contradiction focus between work and relationships**

Input: `{ intent: "amplify", territory: CONFLICT_AND_RESOLUTION, focus: { _tag: "ContradictionFocus", target: { domainA: "work", domainB: "relationships", facetDescription: "assertiveness" } } }`

```
[NERIN_PERSONA]

[CORE_IDENTITY — same 7 modules]

[BEHAVIORAL MODULES — amplify with focus gets OBSERVATION_QUALITY + MIRRORS_AMPLIFY]
  OBSERVATION_QUALITY: [same as hold — the pairing is the tool]
  MIRRORS_AMPLIFY: [4-mirror library — Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola]

[STEERING SECTION]
  TERRITORY GUIDANCE:
  Energy: heavy
  Domain area: relationships, work
  Suggested direction — you could explore something like: "Tell me about a disagreement that actually taught you something about yourself."

  INTENT: This moment matters. If there's something you've been sensing but haven't said — a pattern, a tension, a question — now is the time. Go deeper, not wider. Say what you see with conviction. 3-6 sentences. No question needed.

  FOCUS: You've noticed something fascinating: when they talk about work, their assertiveness looks quite different than when they talk about relationships. If the moment is right, surface this with genuine fascination, not as a gotcha. 'I find it interesting that...' Frame it as curiosity about their complexity.

  FINAL MOMENT: This moment matters. If there's something you've been sensing but haven't said — a pattern, a tension, a question — now is the time. Go deeper, not wider.
```

Note: OBSERVATION_QUALITY included because `focus` is present. MIRRORS_AMPLIFY always included. Amplification instruction is LAST for highest LLM attention.

---

#### Test Strategy

Tests map to the composition matrix:

1. **Composition tests (5 intents × positive + negative):** Verify each intent includes correct modules AND excludes incorrect ones. ~25-30 test cases.
2. **Steering section tests:** Verify entry pressure, focus, and amplification instructions appear only when expected per discriminated union variant.
3. **Type safety tests:** Verify `toPromptBuilderInput()` mapping produces correct variants and that impossible states (hold without focus, bridge without previousTerritory) cannot be constructed.
4. **Integration tests:** Full `buildChatSystemPrompt()` for representative scenarios — one per intent.

---

#### v2 Candidates (deferred)

- **Bridge focus:** If real conversations show Nerin choosing shallow bridges when deep ones were available, add `MomentFocus` to the `bridge` variant. Requires a new Governor signal for "facet pattern relevant to the territory transition."
- **Contextual mirror injection:** If the scoped libraries prove too static, promote to dynamic mirror selection based on territory domains or active facets.
- **Function-based composition matrix:** If the static intent → module set mapping proves insufficient (e.g., `deepen` on turn 3 needs different modules than `deepen` on turn 15), add `turnNumber` to the discriminated union and make the matrix a function.

### Creative Alternatives

No alternative architectures were generated — the solution emerged directly from diagnosis through party mode collaboration and was refined through three rounds of advanced elicitation (Red Team, First Principles, Critique and Refine). Each refinement simplified the architecture rather than adding complexity:
- 10 behavioral modules → 5 (format merged into intent instructions, questioning folded in)
- Flat nullable struct → discriminated union (impossible states eliminated)
- Always-on mirrors → scoped per-intent libraries (trust Nerin on when, curate the what)
- Overlay → MomentFocus (naming reflects substance, not decoration)

---

## SOLUTION EVALUATION

### Evaluation Criteria

| Criterion | Score | Notes |
|---|---|---|
| **Addresses root cause** | 9/10 | Contextual composition eliminates both overlap (instinct vs instruction) and sabotage (modules present when they shouldn't be). Root cause fully resolved. |
| **Dev agent implementability** | 10/10 | Discriminated union makes impossible states unrepresentable. Composition matrix is a simple switch statement. No judgment calls required. |
| **Preserves Nerin's voice** | 9/10 | Tier 1 core identity ensures coherence across all intents. Scoped mirror libraries preserve the curated psychological weight. Risk: module decomposition surgery could lose subtle tonal qualities — mitigated by careful rewriting with testing. |
| **Minimal Governor changes** | 9/10 | ~30 lines new code (`deriveIntent` + `toPromptBuilderInput`). Pure derivations from existing fields. No new inputs, no new dependencies. |
| **Token efficiency** | 10/10 | 44-78% reduction across all intents. Every intent produces a shorter, more focused prompt than the current monolith. |
| **Testability** | 9/10 | Composition is pure functions. Each intent × module combination is independently testable. ~25-30 test cases cover the matrix. |
| **Extensibility** | 8/10 | Adding a new intent requires: new union variant, new row in composition matrix, new intent instruction. Clear but touches multiple files. v2 candidates identified (bridge focus, dynamic mirrors, turn-aware matrix). |

### Solution Analysis

**Strengths:**
- **Type safety eliminates entire error classes.** Hold without focus, bridge without previousTerritory — these are compile-time errors, not runtime bugs. The discriminated union is the most consequential architectural choice.
- **The absence of modules IS the instruction.** This is the deepest insight. Hold-Nerin doesn't have questioning instincts loaded — not because we told it "don't ask questions" (which creates tension), but because it literally doesn't have that cognitive palette available.
- **Scoped mirror libraries preserve what matters.** Previous attempt to remove libraries produced hollow metaphors. Curation (specific psychological mappings) IS the value. Per-intent scoping adds precision without losing the safety net.
- **Token reduction is dramatic and universal.** Not an optimization — it's a consequence of good architecture. When each intent carries only what it needs, prompts get shorter naturally.

**Risks:**
1. **Module text quality (tuning risk, not architectural).** The decomposed modules haven't been written yet. The rewriting surgery — especially CONVERSATION_INSTINCTS (removing directives, keeping instincts) and OBSERVATION_QUALITY (removing mechanism, keeping quality instinct) — requires careful craft. Mitigated by the clear instinct-vs-instruction principle and testing against existing Nerin outputs.
2. **Mirror scoping accuracy.** The 10/4/4/4 distribution across deepen/bridge/hold/amplify is based on analytical assessment of each mirror's psychological shape. Real conversations may reveal that some mirrors serve intents differently than expected. Mitigated by v2 candidate for dynamic mirror selection.
3. **`amplify` without focus.** When `amplify` fires with `focus: null` (closing phase, no noticing/contradiction), Nerin gets a broad "say what you see" instruction without a specific focus. This is intentional (broad amplification) but could produce diffuse responses. Mitigated by the amplification instruction's "go deeper, not wider" framing.
4. **Integration with E_target (future).** Entry pressure currently defaults to `"direct"` until the pacing pipeline is built. The architecture is ready for soft/angled entry but can't demonstrate it yet. No mitigation needed — this is a known sequential dependency.

### Recommended Solution

The three-tier contextual composition architecture with discriminated union input is the recommended solution. It is the only architecture generated — it emerged organically through diagnosis and was refined (not replaced) through three rounds of adversarial stress-testing.

### Rationale

The architecture is recommended because it:
1. **Resolves the root cause** (conflicting signals from monolithic character bible) through contextual composition rather than prompt tuning
2. **Makes impossible states unrepresentable** at compile time via discriminated union — the type system prevents bugs before they happen
3. **Is proportionate to the problem** — the composition matrix is a switch statement with 5 branches, the module decomposition follows existing CHAT_CONTEXT section boundaries
4. **Survived adversarial testing** — Red Team (5 attacks, 0 changes), First Principles (6 principles confirmed), Critique and Refine (3 rounds, all refinements simplified)
5. **Reduces token usage by 44-78%** — not as a goal but as a natural consequence of focused composition
6. **Supersedes the Governor spec's Prompt Builder Enrichment section** (lines 734-933 of `problem-solution-2026-03-09-move-generator.md`) with a more complete architecture that accounts for character bible decomposition, contextual modules, and the discriminated union input

---

## IMPLEMENTATION PLAN

### Implementation Approach

**Strategy: Bottom-up module extraction, then top-down composition wiring.**

The implementation follows a dependency-safe order: types first → module constants → composition functions → integration point. Each step produces independently testable artifacts. The Governor changes are a separate, parallel workstream that can be implemented before or after the prompt builder — the two are connected only by the `PromptBuilderInput` type.

**Key principle: No behavior change until the final integration step.** Module extraction (steps 1-3) produces new constants and functions that don't affect the running system. The existing `buildChatSystemPrompt()` continues working throughout. Only step 5 (integration) swaps the old compositor for the new one.

### Action Steps

**Step 1: Types — `PromptBuilderInput` discriminated union**

File: `packages/domain/src/types/prompt-builder.ts` (new)

- Define `NoticingFocus`, `ContradictionFocus`, `MomentFocus` tagged union
- Define `ConversationalIntent` literal union
- Define `PromptBuilderInput` discriminated union (5 variants)
- Export from `packages/domain/src/types/index.ts`

Dependencies: `LifeDomain` (existing), `ContradictionTarget` (existing), `Territory` (existing)

Tests: Type-level only — verify impossible states are unrepresentable (e.g., `hold` without `focus` should be a compile error). Can use `@ts-expect-error` assertions.

**Step 2: Tier 1 Core Identity modules**

File: `packages/domain/src/constants/nerin-core-identity.ts` (new)

Extract from `nerin-chat-context.ts`:
- `CONVERSATION_MODE` — as-is from CONVERSATION MODE section
- `BELIEFS_IN_ACTION` — as-is from BELIEFS IN ACTION section
- `CONVERSATION_INSTINCTS` — **rewrite** CONVERSATION AWARENESS: remove directives ("pivot angle", "acknowledge and move on"), keep instincts ("never make someone feel insufficient", IT'S OK TO NOT KNOW, meet vulnerability, celebrate depth, read the energy)
- `QUALITY_INSTINCT` — extract from RESPONSE FORMAT: "Every sentence earns its place. Keep responses focused — default to concise unless the moment calls for more."
- `MIRROR_GUARDRAILS` — extract from NATURAL WORLD MIRRORS: placement rules only (~80 tokens)
- `HUMOR_GUARDRAILS` — as-is from HUMOR section
- `INTERNAL_TRACKING` — as-is from WHAT STAYS INTERNAL section
- Compose into single `CORE_IDENTITY` export (all 7 joined with `\n\n`)

Dependencies: None (pure string constants)

Tests: Snapshot tests for each module. Verify `CORE_IDENTITY` contains all 7 modules. Verify removed directives are absent from `CONVERSATION_INSTINCTS`.

**Step 3: Tier 2 Behavioral modules**

File: `packages/domain/src/constants/nerin-behavioral-modules.ts` (new)

Extract from `nerin-chat-context.ts`:
- `RELATE_REFLECT` — **trim** to principle + AI-truthful framing + 2 examples
- `STORY_PULLING` — **trim** to principle + rationale + 2 examples
- `OBSERVATION_QUALITY` — **rewrite** from OBSERVATION + QUESTION: keep quality instinct, remove mechanism
- `THREADING` — as-is from THREADING section

File: `packages/domain/src/constants/nerin-mirror-libraries.ts` (new)

Scope from NATURAL WORLD MIRRORS:
- `MIRRORS_DEEPEN` — 10 mirrors (Hermit Crab, Ghost Net, Pilot Fish, Tide Pool, Mimic Octopus, Clownfish, Dolphin Echolocation, Bioluminescence, Parrotfish, Sea Urchin)
- `MIRRORS_BRIDGE` — 4 mirrors (Tide Pool, Coral Reef, Volcanic Vents, Mola Mola)
- `MIRRORS_HOLD` — 4 mirrors (Hermit Crab, Pilot Fish, Dolphin Echolocation, Bioluminescence)
- `MIRRORS_AMPLIFY` — 4 mirrors (Ghost Net, Mimic Octopus, Volcanic Vents, Mola Mola)

Dependencies: None (pure string constants)

Tests: Snapshot tests. Verify each mirror library contains only its designated mirrors. Verify no mirror appears in a library it shouldn't be in.

**Step 4: Prompt builder compositor**

File: `packages/domain/src/utils/nerin-system-prompt.ts` (rewrite)

Implement:
- `composeBehavioralModules(input: PromptBuilderInput): string` — switch on intent, return joined modules per composition matrix
- `composeSteeringSection(input: PromptBuilderInput): string` — territory guidance + intent instruction + entry pressure (if applicable) + focus (if applicable) + amplification (if applicable)
- `buildChatSystemPrompt(input: PromptBuilderInput): string` — compose 4 layers: `NERIN_PERSONA` → `CORE_IDENTITY` → behavioral modules → steering section

File: `packages/domain/src/utils/steering/territory-prompt-builder.ts` (rewrite)

Implement:
- `buildTerritoryGuidance(territory: Territory): string` — territory's domains + energy + opener
- `buildIntentInstruction(input: PromptBuilderInput): string` — per-intent instruction with format
- `buildEntryPressureInstruction(pressure: "angled" | "soft"): string` — entry pressure guidance
- `buildFocusInstruction(focus: MomentFocus): string` — noticing or contradiction focus
- `buildAmplificationInstruction(): string` — final moment instruction

Dependencies: Steps 1-3 (types + modules)

Tests:
- **Composition tests (5 × positive + negative):** Each intent includes correct modules AND excludes incorrect ones. ~25-30 cases.
- **Steering section tests:** Entry pressure only on deepen/bridge, focus only on hold/amplify, amplification only on amplify.
- **Integration tests:** Full `buildChatSystemPrompt()` for one scenario per intent. Verify output structure (4 layers present, correct order).

**Step 5: Integration — wire into Nerin agent**

File: `packages/domain/src/repositories/nerin-agent.repository.ts` (modify)

- Update `NerinInvokeInput` to accept `promptBuilderInput: PromptBuilderInput` instead of `territoryPrompt?: TerritoryPromptContent`

File: `packages/infrastructure/src/repositories/nerin-agent.anthropic.repository.ts` (modify)

- Update line 107: call `buildChatSystemPrompt(input.promptBuilderInput)` with new signature

File: `apps/api/src/use-cases/send-message.use-case.ts` (modify)

- Update the call site to pass `PromptBuilderInput` instead of `TerritoryPromptContent`

Dependencies: Steps 1-4 complete. Governor changes (separate workstream) provide `toPromptBuilderInput()`.

Tests: Existing integration tests should pass with updated mock setup. Add test verifying the full pipeline: Governor output → `toPromptBuilderInput()` → `buildChatSystemPrompt()` → valid prompt string.

**Step 6: Governor additions (separate spec — parallel workstream)**

Owned by the Governor spec (`problem-solution-2026-03-09-move-generator.md`). The Governor must implement:
- `deriveIntent()` — maps internal state to `ConversationalIntent`
- `toPromptBuilderInput()` — maps internal state to `PromptBuilderInput` discriminated union

The prompt builder depends on receiving `PromptBuilderInput` (Step 1 types). The Governor depends on Step 1 types. Both workstreams can proceed in parallel after Step 1.

**Step 7: Cleanup**

- Delete `CHAT_CONTEXT` constant from `nerin-chat-context.ts` (now decomposed into modules)
- Remove `ChatSystemPromptParams` interface (replaced by `PromptBuilderInput`)
- Remove `TerritoryPromptContent` export from territory-prompt-builder.ts (no longer needed externally)
- Update any remaining imports

### Timeline and Milestones

| Milestone | Steps | Gate |
|---|---|---|
| **M1: Types locked** | Step 1 | `PromptBuilderInput` compiles, impossible states rejected |
| **M2: Modules extracted** | Steps 2-3 | All 15 module constants exist, snapshot tests pass |
| **M3: Compositor works** | Step 4 | `buildChatSystemPrompt()` produces correct output for all 5 intents |
| **M4: Pipeline integrated** | Steps 5-6 | End-to-end: Governor → prompt builder → valid system prompt |
| **M5: Clean** | Step 7 | Old constants deleted, no dead code, all tests pass |

### Resource Requirements

- **Module text authoring:** Steps 2-3 require careful rewriting of CONVERSATION_INSTINCTS and OBSERVATION_QUALITY, plus scoping of the mirror library. This is craft work — the instinct-vs-instruction principle guides it, but the exact wording matters for Nerin's voice. Recommend human review of rewritten modules before integration.
- **Mirror scoping:** The 10/4/4/4 distribution needs validation against the existing 13 mirror entries in `nerin-chat-context.ts`. Some mirrors may need light rewording to fit their intent context.

### Responsible Parties

- **Dev agent:** Steps 1, 4, 5, 6, 7 (types, compositor, integration, Governor additions, cleanup)
- **Human review:** Steps 2-3 (module text quality — especially rewritten modules and mirror scoping)

---

## MONITORING AND VALIDATION

### Success Metrics

| Metric | How to Measure | Target |
|---|---|---|
| **Composition correctness** | Unit tests: each intent includes exactly the right modules and excludes the wrong ones | 100% pass — composition matrix is deterministic |
| **Type safety** | Compile-time: impossible states (hold without focus, bridge without previousTerritory) produce type errors | Zero `as any` casts in prompt builder code |
| **Token efficiency** | Count tokens per intent output vs current monolith (2400 tokens) | 44-78% reduction per intent (see Token Budget table) |
| **Module coherence** | Human review: rewritten modules (CONVERSATION_INSTINCTS, OBSERVATION_QUALITY) preserve Nerin's voice | Subjective — reviewer confirms instinct tone, no stray directives |
| **Mirror quality** | Test conversations: mirrors in scoped libraries produce psychologically grounded metaphors per intent | No hollow/fabricated mirrors — same quality bar as current full library |
| **Steering compliance** | Test conversations: Nerin follows intent instructions (e.g., no questions during hold, bridge references previous territory) | Qualitative — compare against current monolith responses for same scenarios |

### Validation Plan

**Phase 1: Static validation (during implementation)**

1. **Type tests (Step 1):** Verify `PromptBuilderInput` rejects impossible states at compile time. Use `@ts-expect-error` to confirm type errors on malformed inputs.
2. **Composition matrix tests (Step 4):** For each of the 5 intents:
   - Positive: output contains expected modules (substring match)
   - Negative: output does NOT contain excluded modules
   - ~25-30 test cases total
3. **Steering section tests (Step 4):** Verify conditional sections (entry pressure, focus, amplification) appear only for their designated intents.
4. **Snapshot tests (Steps 2-3):** Lock module text to prevent accidental drift.

**Phase 2: Dynamic validation (post-integration)**

5. **Prompt inspection:** For each intent, generate a full system prompt and manually review for:
   - Correct 4-layer structure (NERIN_PERSONA → CORE_IDENTITY → behavioral modules → steering)
   - No conflicting signals between layers
   - Appropriate token count
6. **Comparative testing:** Run the same 5 conversation scenarios through both old monolith and new compositor. Compare Nerin's responses for:
   - Hold: does Nerin stay silent (no follow-up question)?
   - Bridge: does Nerin reference the previous territory?
   - Amplify: does Nerin go bold without hedging?
   - Deepen: does Nerin pull for stories?
   - Open: is the invitation warm and concise?

**Phase 3: Ongoing (post-deploy)**

7. **Mirror scoping review:** After 50+ real conversations, audit whether mirrors are landing in their intended contexts. Flag any mirror that consistently feels wrong for its intent.

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Rewritten modules lose Nerin's voice** | Medium | High | Human review gate at Steps 2-3. Instinct-vs-instruction principle provides clear rewriting criteria. Compare rewritten text against originals for tone preservation. |
| **Mirror scoping is wrong** | Low | Medium | The 10/4/4/4 distribution is analytically grounded but unproven. v2 candidate allows dynamic mirror selection. For v1, monitor mirror quality in test conversations and reshuffle if needed. |
| **Amplify without focus produces diffuse responses** | Low | Medium | "Go deeper, not wider" framing constrains. If diffuse in practice, consider always deriving a focus for closing (Governor change, not prompt builder change). |
| **Module decomposition breaks existing tests** | Low | Low | Integration step (Step 5) is the only breaking change. Steps 1-4 produce new code alongside existing code. Existing tests continue passing until Step 5. |
| **Governor `toPromptBuilderInput` not ready when prompt builder is** | Medium | Low | Prompt builder can be tested with hand-crafted `PromptBuilderInput` values. Governor is a parallel workstream — no blocking dependency after Step 1 (types). |

### Adjustment Triggers

| Signal | Indicates | Action |
|---|---|---|
| Hold responses include follow-up questions | `STORY_PULLING` or `RELATE_REFLECT` leaking into hold (composition bug) OR intent instruction too weak | Check composition matrix first. If correct, strengthen hold instruction: "No follow-up question. Period." |
| Bridge responses don't reference previous territory | `buildIntentInstruction` not interpolating `previousTerritory` domains, or instruction phrasing too subtle | Make bridge instruction more explicit about the connection requirement |
| Mirrors feel hollow in a specific intent | Wrong mirrors in that intent's scoped library | Reshuffle: move the mirror to a different library or remove it. Check if the mirror needs intent-specific rewording. |
| Token count exceeds estimates by >20% | Module text is longer than expected after rewriting | Trim modules. Check if examples can be reduced (principle + 1 example instead of 2). |
| Nerin ignores entry pressure (soft/angled) | Entry pressure instruction positioned too far from territory guidance, or wording too gentle | Move entry pressure instruction closer to territory guidance in the steering section. Strengthen wording. |
| `amplify` with focus feels like a second `hold` | Focus instruction dominating over amplification instruction | Reorder: put amplification instruction AFTER focus so it gets highest LLM attention. Consider reducing focus to a hint rather than a full instruction during amplify. |

---

## LESSONS LEARNED

### Key Learnings

1. **The instinct-vs-instruction principle is the single most useful diagnostic tool.** Every gray-zone conflict in the character bible resolved cleanly once we asked: "is this an instinct or a directive?" Instincts belong in the character bible, directives belong in steering. No exceptions needed.

2. **Contextual composition > monolithic concatenation.** The deeper problem wasn't overlap — it was always-on modules sabotaging specific intents. Story-pulling during hold, questioning during amplify. You can't fix this with prompt tuning. Only module-level inclusion/exclusion resolves it.

3. **Discriminated unions are worth the ceremony.** Flat nullable structs create infinite illegal states that get tested for at runtime. The union eliminates them at compile time. The prompt builder's switch statement is exhaustive — add a new intent and the compiler tells you every function that needs updating.

4. **"Why does the library exist?" is the right question before removing any abstraction.** The mirror library exists because testing without it produced hollow metaphors. Knowing this prevents the obvious "simplification" of removing it and redirects toward the right move: scoping it per intent.

5. **Rhythm is emergent, not composed.** The temptation to make the prompt builder track previous intents, manage transitions, or soften after holds is strong. But rhythm already emerges from scorer (session arc) + Governor (turn constraints) + pacing formula (energy ceiling). Adding rhythm logic to the prompt builder would create a second control loop that fights the first.

### What Worked

- **Party mode with domain experts** — Winston (architecture), Dr. Quinn (psychology), Sophia (narrative) caught different classes of problems. Winston found structural issues, Quinn found psychological conflicts, Sophia found narrative gaps.
- **Bottom-up problem discovery** — Starting from "how does the prompt builder compose?" led to discovering the contextual composition need, which led to the intent vocabulary, which led to the Governor output gap. Top-down design would have missed the character bible decomposition.
- **Three rounds of adversarial testing** — Red Team found no architectural flaws (2 monitoring notes only). First Principles confirmed all 6 principles. Critique and Refine simplified the architecture (10→5 modules, format merged into intents). Each round refined rather than replaced.

### What to Avoid

- **Don't put Governor logic in the prompt builder spec.** The initial draft included `deriveIntent()` and `toPromptBuilderInput()` code. This confused the boundary — the prompt builder should only know about `PromptBuilderInput`, never about how it's produced.
- **Don't design format as a shared module.** Response format is inseparable from intent — hold needs 1-2 sentences with no question, amplify needs 3-6 sentences with conviction. A shared "response format" module creates the illusion of consistency while actually sabotaging intent-specific beats.
- **Don't remove curated libraries to "trust the LLM."** Nerin produces hollow metaphors without curated examples. Trust the LLM on *when* to use creative tools, but curate *which* tools are available.

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
