# Story 42-2: Split ConversAnalyzer into Two Separate LLM Calls

**Status:** ready-for-dev
**Epic:** 3 — Evidence Extraction v3 — Polarity Model
**FRs:** FR-S7, FR-S8
**NFRs:** NFR-S2 (cost budget), NFR-S3 (latency), NFR-S4 (fail-open)
**Depends on:** Story 42-1 (polarity schema, deviation adapter — already merged)

## User Story

As a **system operator**,
I want ConversAnalyzer split from one dual-purpose LLM call into two dedicated calls (user state + evidence),
So that each call has a focused task, reducing hallucination and freeing token budget for richer evidence extraction.

## Acceptance Criteria

**AC1: Repository interface exposes two new methods**
- **Given** the ConversAnalyzer repository interface currently exposes `analyze` and `analyzeLenient`
- **When** the interface is updated
- **Then** it additionally exposes:
  - `analyzeUserState(params) → ConversanalyzerUserStateOutput` — returns energyBand, tellingBand, energyReason, tellingReason, withinMessageShift, tokenUsage
  - `analyzeEvidence(params) → ConversanalyzerEvidenceOutput` — returns ExtractedEvidence[] (with polarity), tokenUsage
- **And** the existing `analyze` and `analyzeLenient` methods are preserved for backward compatibility

**AC2: User state extraction (Call 1) uses existing prompt**
- **Given** the user state extraction call
- **When** it executes
- **Then** it uses a user-state-only prompt derived from Phase 1 of the existing v2 prompt (no content changes to the user state instructions)
- **And** it returns the same user state schema as before
- **And** it uses a user-state-only JSON schema for structured output

**AC3: Evidence extraction (Call 2) uses existing evidence prompt**
- **Given** the evidence extraction call
- **When** it executes
- **Then** it uses an evidence-only prompt derived from Phase 2 of the existing v2 prompt
- **And** it returns evidence items with the existing schema (deviation-based, with optional polarity)
- **And** it uses an evidence-only JSON schema for structured output

**AC4: Three-tier fail-open behavior for both calls independently**
- **Given** the infrastructure repository implementations
- **When** the Anthropic repository is updated
- **Then** strict and lenient parsing modes exist for both calls independently
- **And** each call has its own three-tier fail-open behavior: strict x3 → lenient x1 → neutral defaults
- **And** user state neutral defaults: energy="steady", telling="mixed"
- **And** evidence neutral defaults: empty array []

**AC5: Pipeline integration — sequential two-call extraction**
- **Given** the three-tier extraction pipeline and nerin-pipeline orchestrator
- **When** extraction runs
- **Then** it calls user state extraction first, then evidence extraction second (sequential)
- **And** if user state extraction fails at all tiers, it uses neutral defaults but evidence extraction still runs
- **And** if evidence extraction fails at all tiers, it uses empty array but pipeline continues
- **And** the combined output matches the existing ConversanalyzerV2Output shape for downstream compatibility

**AC6: Cost and latency tracking**
- **Given** both calls use Haiku
- **When** a full extraction runs (Call 1 + Call 2)
- **Then** token usage from both calls is summed for cost tracking
- **And** total cost stays within per-message extraction budget

**AC7: Mock and test repositories updated**
- **Given** the mock repository and __mocks__ file
- **When** updated to match the new interface
- **Then** they implement both new methods (`analyzeUserState`, `analyzeEvidence`) with deterministic outputs
- **And** the existing `analyze`/`analyzeLenient` methods continue to work
- **And** all existing tests pass without modification

## Tasks

### Task 1: Update ConversAnalyzer repository interface
**File:** `packages/domain/src/repositories/conversanalyzer.repository.ts`
- 1.1: Define `ConversanalyzerUserStateOutput` type (userState + tokenUsage)
- 1.2: Define `ConversanalyzerEvidenceOutput` type (evidence[] with note + tokenUsage)
- 1.3: Add `analyzeUserState` method to `ConversanalyzerRepository` tag
- 1.4: Add `analyzeEvidence` method to `ConversanalyzerRepository` tag
- 1.5: Add `analyzeUserStateLenient` method to `ConversanalyzerRepository` tag
- 1.6: Add `analyzeEvidenceLenient` method to `ConversanalyzerRepository` tag
- 1.7: Export new types from `packages/domain/src/index.ts`

### Task 2: Create separate schemas for user state and evidence extraction
**File:** `packages/domain/src/schemas/conversanalyzer-v2-extraction.ts`
- 2.1: Create `UserStateOnlyToolOutput` strict schema (just userState, no evidence)
- 2.2: Create `LenientUserStateOnlyToolOutput` lenient schema
- 2.3: Create `EvidenceOnlyToolOutput` strict schema (just evidence array, no userState)
- 2.4: Create `LenientEvidenceOnlyToolOutput` lenient schema
- 2.5: Generate JSON schemas for both (`userStateOnlyJsonSchema`, `evidenceOnlyJsonSchema`)
- 2.6: Export decode helpers: `decodeUserStateStrict`, `decodeUserStateLenient`, `decodeEvidenceStrict`, `decodeEvidenceLenient`
- 2.7: Export from `packages/domain/src/index.ts`

### Task 3: Split the v2 prompt into two separate prompts
**File:** `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`
- 3.1: Extract `buildUserStatePrompt(input)` — Phase 1 content only (energy/telling extraction)
- 3.2: Extract `buildEvidencePrompt(input)` — Phase 2 content only (evidence extraction)
- 3.3: Keep existing `buildV2Prompt` unchanged for backward compat

### Task 4: Implement the split methods in the Anthropic repository
**File:** `packages/infrastructure/src/repositories/conversanalyzer.anthropic.repository.ts`
- 4.1: Implement `analyzeUserState` — calls Haiku with user-state-only prompt and schema, strict decode
- 4.2: Implement `analyzeUserStateLenient` — calls Haiku with user-state-only prompt and schema, lenient decode
- 4.3: Implement `analyzeEvidence` — calls Haiku with evidence-only prompt and schema, strict decode
- 4.4: Implement `analyzeEvidenceLenient` — calls Haiku with evidence-only prompt and schema, lenient decode
- 4.5: Keep existing `analyze`/`analyzeLenient` methods unchanged

### Task 5: Update three-tier extraction to use split calls
**File:** `apps/api/src/use-cases/three-tier-extraction.ts`
- 5.1: Create `runUserStateExtraction(input)` — three-tier pipeline for user state only
- 5.2: Create `runEvidenceExtraction(input)` — three-tier pipeline for evidence only
- 5.3: Create `runSplitThreeTierExtraction(input)` — orchestrates both calls sequentially, returns combined `ConversanalyzerV2Output`
- 5.4: Keep existing `runThreeTierExtraction` unchanged for backward compat

### Task 6: Wire split extraction into nerin-pipeline
**File:** `apps/api/src/use-cases/nerin-pipeline.ts`
- 6.1: Replace `runThreeTierExtraction` call with `runSplitThreeTierExtraction`
- 6.2: Verify combined token usage is summed for cost tracking
- 6.3: Ensure downstream code sees the same `ConversanalyzerV2Output` shape

### Task 7: Update mock and __mocks__ repositories
- 7.1: Update `packages/infrastructure/src/repositories/conversanalyzer.mock.repository.ts` — add `analyzeUserState`, `analyzeUserStateLenient`, `analyzeEvidence`, `analyzeEvidenceLenient`
- 7.2: Update `packages/infrastructure/src/repositories/__mocks__/conversanalyzer.anthropic.repository.ts` — add the new methods
- 7.3: Verify all existing tests pass

### Task 8: Add unit tests for new schemas and split extraction
- 8.1: Test `UserStateOnlyToolOutput` strict/lenient decode
- 8.2: Test `EvidenceOnlyToolOutput` strict/lenient decode
- 8.3: Test `runUserStateExtraction` three-tier fallback behavior
- 8.4: Test `runEvidenceExtraction` three-tier fallback behavior
- 8.5: Test `runSplitThreeTierExtraction` combines results correctly
- 8.6: Test independent failure: user state fails but evidence succeeds (and vice versa)
