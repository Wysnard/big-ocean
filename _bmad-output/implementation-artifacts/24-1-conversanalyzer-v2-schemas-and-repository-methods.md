---
status: ready-for-dev
story_id: "24-1"
epic: 24
created_date: 2026-03-12
blocks: [24-2]
blocked_by: [23-1, 23-2, 23-3]
---

# Story 24-1: ConversAnalyzer v2 Schemas & Repository Methods

## Story

As a developer,
I want ConversAnalyzer v2 with dual extraction (userState + evidence), strict and lenient schemas, and two repository methods,
So that the system can extract energy/telling signals alongside evidence in a single LLM call with validation at two strictness levels.

## Acceptance Criteria

### AC1: Strict ConversAnalyzer v2 Output Schema
**Given** the domain package
**When** ConversAnalyzer v2 output schemas are defined using `@effect/schema`
**Then** a strict `ConversanalyzerV2ToolOutput` schema validates:
- `userState: { energyBand: EnergyBand, tellingBand: TellingBand, energyReason: string (max 200 chars), tellingReason: string (max 200 chars), withinMessageShift: boolean }`
- `evidence: Array<EvidenceItem>` — using the existing `EvidenceItemSchema`
**And** all fields must validate for the strict schema to succeed (rejects if ANY item invalid)
**And** `EnergyBand` and `TellingBand` use exact `S.Literal` matches for each band value

### AC2: Lenient ConversAnalyzer v2 Output Schema
**Given** the strict schema
**When** a `LenientConversanalyzerV2ToolOutput` schema is defined
**Then** `userState` fields are parsed independently — valid fields kept, invalid fields default (`energy=steady`, `telling=mixed`)
**And** `evidence` items are filtered individually — invalid items discarded, valid items kept
**And** partial success on either side is preserved (e.g., full state + filtered evidence, or default state + full evidence)

### AC3: Repository Interface Evolution
**Given** the ConversAnalyzer repository interface at `packages/domain/src/repositories/conversanalyzer.repository.ts`
**When** v2 methods are added
**Then** two methods are exposed:
- `analyze(input)` — uses strict `ConversanalyzerV2ToolOutput` schema, returns full validated output or error
- `analyzeLenient(input)` — uses `LenientConversanalyzerV2ToolOutput` schema, returns partial output (invalid items filtered) or error
**And** the existing v1 `analyze` method signature is evolved (not a second interface)

### AC4: ConversAnalyzer v2 Prompt & Infrastructure
**Given** the ConversAnalyzer infrastructure implementation at `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`
**When** the ConversAnalyzer v2 prompt is composed
**Then** state extraction (energy + telling) is positioned FIRST in the prompt for attention priority
**And** evidence extraction is positioned SECOND (battle-tested, tolerates being second)
**And** the prompt includes all six load-bearing guardrails:
1. Eloquence is not energy
2. Sophistication is not cognitive investment
3. Peak dimension, not average (one strongly present dimension sufficient for high energy)
4. Understated styles are not low energy
5. Long detailed answer is not high telling
6. Diagonal contrastive examples are mandatory (high-E/low-T and low-E/high-T)
**And** energy bands include anchored examples for each of the 4 observable dimensions (emotional activation, cognitive investment, expressive investment, activation/urgency)
**And** telling bands include Nerin+user message pairs showing the contrast
**And** temperature is set to 0.9 (retry variation)

### AC5: Mock Update
**Given** the ConversAnalyzer mock at `__mocks__/conversanalyzer.anthropic.repository.ts`
**When** the mock is updated for v2
**Then** `analyze` returns a default v2 output with `energyBand: "steady"`, `tellingBand: "mixed"`, and deterministic evidence
**And** `analyzeLenient` returns the same default output
**And** both methods can be overridden per-test via `_setMockOutput()`

### AC6: Unit Tests for Schemas
**Given** unit tests for the schemas
**When** tests run
**Then** strict schema rejects output with invalid energyBand values, invalid tellingBand values, and malformed evidence items
**And** lenient schema preserves valid userState fields when others fail, filters invalid evidence items while keeping valid ones, and handles complete userState failure with defaults

## Tasks

### Task 1: Define ConversAnalyzer v2 Output Schemas
**File:** `packages/domain/src/schemas/conversanalyzer-v2-extraction.ts`

1.1. Create `UserStateSchema` using `S.Struct` with:
  - `energyBand: S.Literal(...ENERGY_BANDS)`
  - `tellingBand: S.Literal(...TELLING_BANDS)`
  - `energyReason: S.String.pipe(S.maxLength(200))`
  - `tellingReason: S.String.pipe(S.maxLength(200))`
  - `withinMessageShift: S.Boolean`

1.2. Create `ConversanalyzerV2ToolOutput` strict schema:
  - `userState: UserStateSchema`
  - `evidence: S.Array(EvidenceItemSchema)`

1.3. Create `LenientConversanalyzerV2ToolOutput` using `S.transformOrFail`:
  - Parse `userState` fields independently; default invalid fields to `"steady"` / `"mixed"` / `""` / `false`
  - Filter evidence array: discard invalid items, keep valid ones
  - Produce partial success (valid state fields + filtered evidence)

1.4. Export JSON Schema for Anthropic tool `input_schema` via `JSONSchema.make()`

1.5. Export decode helpers: `decodeConversanalyzerV2Strict` and `decodeConversanalyzerV2Lenient`

### Task 2: Evolve ConversAnalyzer Repository Interface
**File:** `packages/domain/src/repositories/conversanalyzer.repository.ts`

2.1. Define `ConversanalyzerV2Output` interface with:
  - `userState: { energyBand, tellingBand, energyReason, tellingReason, withinMessageShift }`
  - `evidence: Array<EvidenceItem & { note: string }>`
  - `tokenUsage: { input: number, output: number }`

2.2. Evolve the `analyze` method to return `ConversanalyzerV2Output`
2.3. Add `analyzeLenient` method returning `ConversanalyzerV2Output`
2.4. Keep `ConversanalyzerInput` unchanged (same input for both methods)
2.5. Update domain index exports for new types and schemas

### Task 3: Implement ConversAnalyzer v2 Prompt
**File:** `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`

3.1. Rewrite `buildPrompt()` to `buildV2Prompt()`:
  - State extraction FIRST (energy + telling) for attention priority
  - Evidence extraction SECOND
  - Include all 6 load-bearing guardrails in the prompt
  - Energy band anchored examples for 4 observable dimensions
  - Telling band contrastive examples (Nerin+user pairs)

3.2. Update the Anthropic tool definition to use v2 JSON schema
3.3. Implement `analyze` method using strict schema decode
3.4. Implement `analyzeLenient` method using lenient schema decode
3.5. Set temperature to 0.9
3.6. Update mock path for integration tests (`mockAnalyzeV2()`)

### Task 4: Update ConversAnalyzer Mock
**File:** `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts`

4.1. Update `defaultOutput` to include v2 `userState` fields
4.2. Add `analyzeLenient` method to mock (same default output)
4.3. Keep `_setMockOutput`, `_setMockError`, `_resetMockState`, `_getMockCalls` helpers
4.4. Ensure mock can be overridden per-test for both methods

### Task 5: Write Schema Unit Tests
**File:** `packages/domain/src/schemas/__tests__/conversanalyzer-v2-extraction.test.ts`

5.1. Test strict schema accepts valid v2 output
5.2. Test strict schema rejects invalid energyBand values
5.3. Test strict schema rejects invalid tellingBand values
5.4. Test strict schema rejects malformed evidence items
5.5. Test lenient schema preserves valid userState fields when others fail
5.6. Test lenient schema filters invalid evidence items while keeping valid ones
5.7. Test lenient schema handles complete userState failure with defaults
5.8. Test JSON schema generation produces valid schema

## Dev Notes

- The existing v1 schemas in `packages/domain/src/schemas/evidence-extraction.ts` should NOT be deleted — they are still used by other parts of the system. The v2 schemas are a new file.
- The `EvidenceItemSchema` from `evidence-extraction.ts` is reused directly in v2.
- The `ConversanalyzerOutput` type (v1) is replaced by `ConversanalyzerV2Output` on the repository interface. Downstream consumers that depend on the old type will need updating in subsequent stories (Story 24-2).
- The `ObservedEnergyLevel` type is deprecated in favor of `EnergyBand` from pacing types.
- Temperature 0.9 enables retry variation for the three-tier extraction strategy (Story 24-2).
