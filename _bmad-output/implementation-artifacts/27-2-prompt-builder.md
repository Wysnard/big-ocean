# Story 27-2: Prompt Builder

**Status:** ready-for-dev

## Story

As a developer,
I want a deterministic prompt compositor that assembles Nerin's system prompt from modular tiers based on the Governor's PromptBuilderInput,
So that each conversational intent gets exactly the cognitive palette it needs — no more, no less.

## Acceptance Criteria

### AC1: buildPrompt Function Created

**Given** a `buildPrompt()` function at `packages/domain/src/utils/steering/prompt-builder.ts`
**When** called with `PromptBuilderInput` and the territory catalog
**Then** it composes the system prompt in 4 tiers:
1. `NERIN_PERSONA` — universal identity (shared across all surfaces)
2. Core identity modules (Tier 1 — always included): `CONVERSATION_MODE`, `BELIEFS_IN_ACTION`, `CONVERSATION_INSTINCTS`, `QUALITY_INSTINCT`, `MIRROR_GUARDRAILS`, `HUMOR_GUARDRAILS`, `INTERNAL_TRACKING`
3. Question modules (Tier 2 — included/excluded per intent)
4. Steering section (per-turn — territory + observation focus translated to instruction)

### AC2: Open Intent Prompt Composition

**Given** intent = `"open"`
**When** the prompt is composed
**Then** Tier 2 includes: `REFLECT` only (light opener)
**And** steering section includes: territory opener as suggested direction
**And** no observation focus instruction (nothing to observe yet)
**And** Story-Pulling, Threading, Mirrors are NOT loaded

### AC3: Explore Intent Prompt Composition

**Given** intent = `"explore"`
**When** the prompt is composed
**Then** Tier 2 includes: `STORY_PULLING`, `REFLECT`, `THREADING`, `MIRRORS_EXPLORE`
**And** steering section includes: territory context + observation focus translated to natural instruction
**And** observation focus translation:
- Relate -> "Connect naturally to what they just shared"
- Noticing -> "Something is shifting in [domain]" (domain compass, not facet target)
- Contradiction -> "Something interesting — [facet] shows up differently in [domainA] vs [domainB]" (framed as fascination, never verdict)
- Convergence -> "A pattern is emerging — [facet] shows up consistently across [domains]"
**And** entry pressure modifies the territory instruction: direct = use opener, angled = approach from adjacent angle, soft = gentle mention

### AC4: Amplify Intent Prompt Composition

**Given** intent = `"amplify"`
**When** the prompt is composed
**Then** Tier 2 includes: `OBSERVATION_QUALITY`, `MIRRORS_AMPLIFY`
**And** steering section includes: bold format permission, longer responses, declarative statements about the user
**And** entry pressure is always `"direct"`
**And** Story-Pulling, Threading are NOT loaded — the absence of modules IS the instruction

### AC5: Contradiction Framing Safety

**Given** the prompt builder
**When** it receives an ObservationFocus with type `"contradiction"`
**Then** the contradiction is NEVER framed as verdict — always as fascination
**And** example good: "Something interesting is happening — earlier you described X, and here it feels almost opposite"
**And** example bad: "So you're actually contradictory about closeness"

### AC6: Token Budget Compliance

**Given** the token budget targets
**When** composed prompts are measured
**Then** open intent prompt is within ~500 tokens for Tier 2 content (excluding persona)
**And** explore intent prompt is within ~1400 tokens for Tier 2 content
**And** amplify intent prompt is within ~900 tokens for Tier 2 content

### AC7: Steering Index Updated

**Given** the new prompt builder
**When** it is created
**Then** it is exported from `packages/domain/src/utils/steering/index.ts`
**And** the domain package index re-exports it

## Tasks

### Task 1: Create Prompt Builder Function

- **1.1** Create `packages/domain/src/utils/steering/prompt-builder.ts` with the `buildPrompt()` function
- **1.2** Define `PromptBuilderOutput` type — `{ systemPrompt: string; tier2Modules: string[]; steeringSection: string }`
- **1.3** Implement Tier 1 assembly — concatenate `NERIN_PERSONA` + all 7 core identity modules (always-on)
- **1.4** Implement intent-based Tier 2 module selection:
  - `open` -> `[REFLECT]`
  - `explore` -> `[STORY_PULLING, REFLECT, THREADING, MIRRORS_EXPLORE]`
  - `amplify` -> `[OBSERVATION_QUALITY, MIRRORS_AMPLIFY]`
- **1.5** Look up territory from `TERRITORY_CATALOG` by `input.territory` and build territory guidance section using existing `buildTerritorySystemPromptSection()`
- **1.6** Implement entry pressure modifiers for territory guidance:
  - `direct` -> use opener directly ("Suggested direction — explore something like: ...")
  - `angled` -> approach from adjacent angle ("Consider approaching from a related angle: ...")
  - `soft` -> gentle mention ("If there's a natural opening, you might touch on: ...")

### Task 2: Implement Observation Focus Translation

- **2.1** Create `translateObservationFocus()` helper that converts `ObservationFocus` to a natural language instruction
- **2.2** Implement `relate` translation: "Connect naturally to what they just shared"
- **2.3** Implement `noticing` translation: "Something is shifting in {domain} — you're seeing it, let them see it too. Frame it as curiosity, not diagnosis."
- **2.4** Implement `contradiction` translation: "Something interesting — {facet} shows up differently in {domainA} vs {domainB}. Frame this as fascination, never as a verdict."
- **2.5** Implement `convergence` translation: "A pattern is emerging — {facet} shows up consistently across {domains}. Name what you're seeing."
- **2.6** Ensure contradiction framing uses fascination language, never verdict language

### Task 3: Implement Amplify Steering Section

- **3.1** Create amplify-specific steering section with bold format permission
- **3.2** Include "longer responses are welcome" instruction
- **3.3** Include "declarative statements about the user" permission
- **3.4** Include observation focus translation for the winning observation

### Task 4: Export and Integration

- **4.1** Export `buildPrompt` and `PromptBuilderOutput` from `packages/domain/src/utils/steering/index.ts`
- **4.2** Ensure domain package index re-exports the new function

### Task 5: Write Tests

- **5.1** Create `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts`
- **5.2** Test: open intent loads only REFLECT in Tier 2, no observation instruction
- **5.3** Test: explore intent loads STORY_PULLING, REFLECT, THREADING, MIRRORS_EXPLORE in Tier 2
- **5.4** Test: explore intent observation focus translated correctly for each variant (relate, noticing, contradiction, convergence)
- **5.5** Test: amplify intent loads OBSERVATION_QUALITY, MIRRORS_AMPLIFY in Tier 2
- **5.6** Test: amplify intent includes bold format permission
- **5.7** Test: entry pressure direct/angled/soft modify territory instruction appropriately
- **5.8** Test: contradiction framing uses fascination language, not verdict language
- **5.9** Test: all composed prompts include NERIN_PERSONA
- **5.10** Test: all composed prompts include all 7 Tier 1 modules
- **5.11** Test: invalid territory ID throws descriptive error

## Dev Notes

- This story depends on Story 27-1 (Character Bible Decomposition) which provides the modular Tier 1 and Tier 2 constants.
- The existing `buildChatSystemPrompt()` in `packages/domain/src/utils/nerin-system-prompt.ts` uses the monolithic CHAT_CONTEXT. The new `buildPrompt()` replaces this for the pacing pipeline but does NOT remove the old function (backward compat until Story 5.3 pipeline integration).
- The existing `buildTerritorySystemPromptSection()` in `territory-prompt-builder.ts` can be reused/adapted for territory guidance.
- Pure function — no Effect dependencies, no I/O.
- Token budget targets are approximate. Measure at ~4 chars/token.
- The `PromptBuilderInput` discriminated union (from `pacing.ts`) already enforces that open intent carries no entry pressure or observation focus at the type level.
