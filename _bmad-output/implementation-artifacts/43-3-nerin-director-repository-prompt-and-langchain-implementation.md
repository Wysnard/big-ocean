# Story 43-3: Nerin Director — Repository, Prompt, and LangChain Implementation

**Status:** ready-for-dev
**Epic:** 43 — Director-Steered Conversations
**Depends on:** 43-1 (Exchange Table Migration), 43-2 (Coverage Analyzer)

## User Story

As a **system operator**,
I want a Nerin Director LLM call that reads the full conversation and produces a creative director brief steering Nerin Actor,
So that each turn has intelligent, context-aware steering based on what the user actually said.

## Acceptance Criteria

**Given** the Nerin Director repository interface at `domain/src/repositories/nerin-director.repository.ts`
**When** the interface is created
**Then** it follows the Context.Tag pattern (same as existing ConversAnalyzer, PortraitGenerator)
**And** it accepts: system prompt, full conversation history, coverage targets (facets + domain with definitions)
**And** it returns: creative director brief (plain text string)

**Given** the Nerin Director system prompt at `domain/src/constants/nerin-director-prompt.ts`
**When** the prompt is written
**Then** it includes the Director role and strategic instincts
**And** it includes brief output format guidance with the three-signal quality bar (content direction, emotional shape, structural constraint)
**And** it includes the three-beat brief structure: Observation (when warranted) -> Connection (when needed) -> Question (always)
**And** it includes 3 surviving instincts: story-over-abstraction, pushback-two-strikes, don't-fully-reveal
**And** it includes anti-patterns: never write dialogue, never suggest specific phrases, describe the beat not the line
**And** it includes the critical requirement: "Quote or paraphrase the user's specific words, images, and phrases in your brief"
**And** it includes domain/facet steering guidance: "Domains are where the conversation goes. Facets are what you're listening for"

**Given** the closing Director prompt at `domain/src/constants/nerin-director-closing-prompt.ts`
**When** the prompt is created
**Then** it instructs: "This is the final exchange. Make your boldest observation — name the core tension or pattern you've been watching build. Don't hold back. End with something that leaves them wanting more."

**Given** the Anthropic/LangChain implementation at `infrastructure/src/repositories/nerin-director.anthropic.repository.ts`
**When** it calls the LLM
**Then** it uses ChatAnthropic from @langchain/anthropic for the LLM call
**And** it defaults to Sonnet model (configurable — Haiku as latency fallback)
**And** it implements retry once on failure with different temperature (ADR-DM-4)
**And** on second failure, it throws an error (no fallback brief)

**Given** the in-memory mock at `infrastructure/src/repositories/__mocks__/nerin-director.anthropic.repository.ts`
**When** used in unit tests via `vi.mock()`
**Then** it returns a deterministic test brief following the three-beat structure
**And** it follows the `Layer.succeed(Tag, implementation)` pattern

## Tasks

### Task 1: Nerin Director Repository Interface (Domain Layer)

**File:** `packages/domain/src/repositories/nerin-director.repository.ts`

- [ ] 1.1 Define `Nerin DirectorError` tagged error class using `S.TaggedError`
- [ ] 1.2 Define `NerinDirectorInput` interface:
  - `systemPrompt: string` — the Director prompt (main or closing variant)
  - `messages: readonly DomainMessage[]` — full conversation history
  - `coverageTargets: CoverageTargetWithDefinitions` — from coverage analyzer
- [ ] 1.3 Define `NerinDirectorOutput` interface:
  - `brief: string` — creative director brief (plain text)
  - `tokenUsage: { input: number; output: number }` — for cost tracking
- [ ] 1.4 Define `NerinDirectorRepository` class extending `Context.Tag`
  - Method: `generateBrief(input: NerinDirectorInput) => Effect<NerinDirectorOutput, NerinDirectorError>`

### Task 2: AppConfig Extension for Director Model

**File:** `packages/domain/src/config/app-config.ts`

- [ ] 2.1 Add `nerinDirectorModelId: string` (default: Sonnet)
- [ ] 2.2 Add `nerinDirectorMaxTokens: number` (default: 1024)
- [ ] 2.3 Add `nerinDirectorTemperature: number` (default: 0.7)
- [ ] 2.4 Add `nerinDirectorRetryTemperature: number` (default: 0.9, for ADR-DM-4 retry)

### Task 3: Nerin Director System Prompt

**File:** `packages/domain/src/constants/nerin-director-prompt.ts`

- [ ] 3.1 Write the Director system prompt (~400-500 tokens) containing:
  - Director role description (creative director briefing a voice actor)
  - Three-signal quality bar (content direction, emotional shape, structural constraint)
  - Three-beat brief structure (Observation -> Connection -> Question)
  - 3 surviving instincts (story-over-abstraction, pushback-two-strikes, don't-fully-reveal)
  - Anti-patterns (no dialogue, no suggested phrases, describe the beat not the line)
  - User word requirement ("Quote or paraphrase the user's specific words")
  - Domain/facet steering guidance
- [ ] 3.2 Export `NERIN_DIRECTOR_PROMPT` constant
- [ ] 3.3 Export `buildDirectorUserMessage(targets, messages)` helper that formats coverage targets + conversation for the Director's user message

### Task 4: Nerin Director Closing Prompt

**File:** `packages/domain/src/constants/nerin-director-closing-prompt.ts`

- [ ] 4.1 Write closing variant prompt that instructs bold final observation
- [ ] 4.2 Export `NERIN_DIRECTOR_CLOSING_PROMPT` constant

### Task 5: Anthropic/LangChain Implementation (Infrastructure Layer)

**File:** `packages/infrastructure/src/repositories/nerin-director.anthropic.repository.ts`

- [ ] 5.1 Create `ChatAnthropic` model instance using config (nerinDirectorModelId, nerinDirectorMaxTokens, nerinDirectorTemperature)
- [ ] 5.2 Implement `generateBrief` method:
  - Build SystemMessage from input.systemPrompt
  - Build HumanMessage from coverage targets + conversation history
  - Invoke model, extract plain text response
  - Extract token usage from AIMessage metadata
- [ ] 5.3 Implement retry logic (ADR-DM-4):
  - On first failure: retry with different temperature (nerinDirectorRetryTemperature)
  - On second failure: throw NerinDirectorError
- [ ] 5.4 Export `NerinDirectorAnthropicRepositoryLive` Layer
- [ ] 5.5 Add cost logging (same pattern as nerin-agent.anthropic.repository.ts)

### Task 6: In-Memory Mock

**File:** `packages/infrastructure/src/repositories/__mocks__/nerin-director.anthropic.repository.ts`

- [ ] 6.1 Create mock returning deterministic three-beat brief
- [ ] 6.2 Export `NerinDirectorAnthropicRepositoryLive` using `Layer.succeed`

### Task 7: Barrel Exports

- [ ] 7.1 Export repository interface from `domain/src/index.ts`
- [ ] 7.2 Export prompt constants from `domain/src/index.ts`
- [ ] 7.3 Export infrastructure Live layer (if barrel exists for infra)

### Task 8: Unit Tests

- [ ] 8.1 Test Director repository interface contract (type-level)
- [ ] 8.2 Test prompt constants are non-empty strings with expected content markers
- [ ] 8.3 Test buildDirectorUserMessage formats targets and messages correctly
- [ ] 8.4 Test mock returns expected output shape
- [ ] 8.5 Test Anthropic implementation retry behavior (mock ChatAnthropic)
