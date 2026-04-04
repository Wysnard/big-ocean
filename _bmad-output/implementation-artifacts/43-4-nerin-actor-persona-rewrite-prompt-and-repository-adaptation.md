# Story 43-4: Nerin Actor — Persona Rewrite, Prompt, and Repository Adaptation

**Status:** ready-for-dev
**Epic:** Epic 1 — Director-Steered Conversations (Director Model)
**Source:** `_bmad-output/planning-artifacts/epics-director-model.md` — Story 1.4

## Story

As a **system operator**,
I want Nerin Actor to voice Director briefs as Nerin's character — warm, specific, ocean-flavored — without access to conversation history or assessment strategy,
So that Nerin's responses sound authentically human while being precisely steered by the Director.

## Acceptance Criteria

### AC-1: NERIN_PERSONA Positioning Rewrite (ADR-DM-3)

**Given** the existing `NERIN_PERSONA` constant in `domain/src/constants/nerin-persona.ts`
**When** the positioning is rewritten
**Then** "at Big Ocean — Vincent's dive shop" is added to the first sentence (absorbs ORIGIN_STORY grounding)
**And** "Your edge" becomes "your comfort in the deep"
**And** "You see patterns other people miss" becomes "you've been paying attention long enough to notice things"
**And** the "most interesting person in the room" framing is reframed: the user IS fascinating to Nerin, not because Nerin performs attention, but because Nerin is genuinely fascinated
**And** any framing where Nerin is the performer or expert dispensing insight is removed
**And** the NERIN_PERSONA is still shared between Actor and portrait prompt

### AC-2: Nerin Actor Prompt Creation

**Given** the new file `domain/src/constants/nerin-actor-prompt.ts`
**When** the prompt is composed
**Then** it composes three sections: `NERIN_PERSONA` (shared, ~650 tokens) + `ACTOR_VOICE_RULES` + `ACTOR_BRIEF_FRAMING`
**And** `ACTOR_VOICE_RULES` includes: emoji as hand signals (sparse, deliberate, ocean-themed), dry observation humor only, never undercut vulnerability, marine biology mirrors must be real, no diagnostic language, no characterizing third parties, no advice
**And** `ACTOR_BRIEF_FRAMING` includes: "You will receive a brief from your creative director. Transform the direction into your words, your rhythm, your metaphors. Never repeat the brief's language directly."
**And** Nerin Actor knows nothing about: the assessment, facets, domains, conversation history, strategy

### AC-3: Repository Interface Rename (nerin-agent → nerin-actor)

**Given** `domain/src/repositories/nerin-agent.repository.ts`
**When** the interface is renamed to `nerin-actor.repository.ts`
**Then** the tag class is renamed from `NerinAgentRepository` to `NerinActorRepository`
**And** the Context.Tag string is updated to `"NerinActorRepository"`
**And** conversation history (`messages: readonly DomainMessage[]`) is stripped from `NerinInvokeInput` — Actor receives only: `sessionId`, `actorPrompt` (string), and `directorBrief` (string)
**And** the repository returns `NerinInvokeOutput` (unchanged: `{ response: string, tokenCount: TokenUsage }`)
**And** `domain/src/index.ts` barrel is updated to export `NerinActorRepository` instead of `NerinAgentRepository`

### AC-4: Infrastructure Implementation Rename (nerin-agent → nerin-actor)

**Given** `infrastructure/src/repositories/nerin-agent.anthropic.repository.ts`
**When** the implementation is renamed to `nerin-actor.anthropic.repository.ts`
**Then** the Layer export is renamed from `NerinAgentAnthropicRepositoryLive` to `NerinActorAnthropicRepositoryLive`
**And** prompt composition logic is stripped — it receives the pre-composed actor prompt + brief as input
**And** it defaults to Haiku model (matching `config.nerinModelId`)
**And** streaming behavior pattern is preserved (returns response string + token count)
**And** `infrastructure/src/index.ts` barrel is updated

### AC-5: Mock Rename

**Given** `infrastructure/src/repositories/__mocks__/nerin-agent.anthropic.repository.ts`
**When** the mock is renamed to `nerin-actor.anthropic.repository.ts`
**Then** it returns a deterministic Nerin-voiced response
**And** it follows the `Layer.succeed(Tag, implementation)` pattern with `NerinActorRepository`

### AC-6: Integration Mock Rename

**Given** `infrastructure/src/repositories/nerin-agent.mock.repository.ts`
**When** the mock is renamed to `nerin-actor.mock.repository.ts`
**Then** the Layer export is renamed from `NerinAgentMockRepositoryLive` to `NerinActorMockRepositoryLive`
**And** it follows the `Layer.succeed(Tag, implementation)` pattern with `NerinActorRepository`
**And** `infrastructure/src/index.ts` barrel is updated

### AC-7: Portrait Prompt No Longer Imports ORIGIN_STORY

**Given** the portrait prompt composition in `domain/src/utils/steering/prompt-builder.ts`
**When** it is updated
**Then** `buildPortraitPrompt` composes `NERIN_PERSONA + PORTRAIT_CONTEXT` (no more ORIGIN_STORY import)
**And** `buildSurfacingPrompt` similarly drops ORIGIN_STORY
**And** the persona now carries Big Ocean/Vincent identity via AC-1

### AC-8: All Existing Tests Pass

**Given** the renames and rewrites are complete
**When** `pnpm turbo typecheck` runs
**Then** it passes with zero errors
**And** all tests that referenced `NerinAgentRepository` are updated to use `NerinActorRepository`

## Tasks

### Task 1: Rewrite NERIN_PERSONA Positioning
- [ ] 1.1: Edit `domain/src/constants/nerin-persona.ts` per ADR-DM-3 positioning guidance
- [ ] 1.2: Add "at Big Ocean — Vincent's dive shop" to the first sentence
- [ ] 1.3: Rewrite "your edge" → "your comfort in the deep"
- [ ] 1.4: Rewrite "you see patterns other people miss" → "you've been paying attention long enough to notice things"
- [ ] 1.5: Reframe "most interesting person in the room" — user IS fascinating, not performed
- [ ] 1.6: Remove performer/expert-dispensing-insight framing
- [ ] 1.7: Update module docstring to note ORIGIN_STORY grounding absorbed

### Task 2: Create Nerin Actor Prompt
- [ ] 2.1: Create `domain/src/constants/nerin-actor-prompt.ts`
- [ ] 2.2: Define ACTOR_VOICE_RULES constant (emoji, humor, safety, mirror biology)
- [ ] 2.3: Define ACTOR_BRIEF_FRAMING constant
- [ ] 2.4: Export `buildActorPrompt()` function composing NERIN_PERSONA + ACTOR_VOICE_RULES + ACTOR_BRIEF_FRAMING
- [ ] 2.5: Write unit tests for the prompt composition

### Task 3: Rename and Adapt Repository Interface
- [ ] 3.1: Rename `nerin-agent.repository.ts` → `nerin-actor.repository.ts`
- [ ] 3.2: Rename `NerinAgentRepository` → `NerinActorRepository` (tag class + Context.Tag string)
- [ ] 3.3: Redefine `NerinActorInvokeInput` with `sessionId`, `actorPrompt`, `directorBrief` (no messages, no systemPrompt)
- [ ] 3.4: Update domain barrel export (`domain/src/index.ts`)

### Task 4: Rename and Adapt Infrastructure Implementation
- [ ] 4.1: Rename `nerin-agent.anthropic.repository.ts` → `nerin-actor.anthropic.repository.ts`
- [ ] 4.2: Rename layer export `NerinAgentAnthropicRepositoryLive` → `NerinActorAnthropicRepositoryLive`
- [ ] 4.3: Strip prompt composition — accept actorPrompt + directorBrief, compose SystemMessage(actorPrompt) + HumanMessage(directorBrief)
- [ ] 4.4: Update infrastructure barrel export (`infrastructure/src/index.ts`)

### Task 5: Rename and Adapt Mocks
- [ ] 5.1: Rename `__mocks__/nerin-agent.anthropic.repository.ts` → `__mocks__/nerin-actor.anthropic.repository.ts`
- [ ] 5.2: Update to use `NerinActorRepository` tag
- [ ] 5.3: Rename `nerin-agent.mock.repository.ts` → `nerin-actor.mock.repository.ts`
- [ ] 5.4: Update to use `NerinActorRepository` tag, rename layer export
- [ ] 5.5: Update infrastructure barrel export

### Task 6: Update Portrait Prompt Composition
- [ ] 6.1: Update `buildPortraitPrompt()` to use `NERIN_PERSONA + PORTRAIT_CONTEXT` (drop ORIGIN_STORY)
- [ ] 6.2: Update `buildSurfacingPrompt()` to drop ORIGIN_STORY
- [ ] 6.3: Update prompt-builder tests

### Task 7: Update All Consumer References
- [ ] 7.1: Find and update all imports of `NerinAgentRepository` across the codebase
- [ ] 7.2: Find and update all imports of `NerinAgentAnthropicRepositoryLive` and `NerinAgentMockRepositoryLive`
- [ ] 7.3: Update vi.mock paths referencing old file names
- [ ] 7.4: Run `pnpm turbo typecheck` — must pass
- [ ] 7.5: Run `pnpm test:run` — all tests pass
