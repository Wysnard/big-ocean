# Story 42-1: Polarity Schema, Database Migration, and Deviation Adapter

**Status:** ready-for-dev
**Epic:** Epic 3 — Evidence Extraction v3 — Polarity Model
**Sprint:** 42
**Story Key:** 42-1-polarity-schema-database-migration-and-deviation-adapter

## User Story

As a **system operator**,
I want a polarity column added to the evidence table and a deterministic adapter that derives deviation from polarity x strength,
So that the new extraction model can store its output while the existing scoring formula continues to work unchanged.

## Acceptance Criteria

### AC1: Database Migration — Polarity Column
**Given** the conversation_evidence table has no polarity column
**When** a new Drizzle migration is applied
**Then** a polarity column (enum: high, low) is added as nullable (existing rows have NULL — backward compat)
**And** the deviation column is preserved unchanged
**And** existing evidence rows with NULL polarity continue to work in all read paths (NFR-S1)
**And** the migration file is appended (existing migrations untouched)

### AC2: Domain Types — ExtractedEvidence and Polarity
**Given** the new ExtractedEvidence type is defined
**When** the type is created in packages/domain/src/types/evidence.ts
**Then** it includes: bigfiveFacet, polarity (high/low), strength, confidence, domain, note
**And** a polarity field is added to the Evidence Effect Schema

### AC3: deriveDeviation Pure Function
**Given** the deriveDeviation pure function is implemented
**When** called with polarity and strength
**Then** it returns: high+strong -> +3, high+moderate -> +2, high+weak -> +1, low+strong -> -3, low+moderate -> -2, low+weak -> -1
**And** all 6 combinations are covered by unit tests

### AC4: Adapter Function — ExtractedEvidence to EvidenceInput
**Given** an adapter function converts ExtractedEvidence to EvidenceInput
**When** new evidence is inserted via the adapter
**Then** the polarity column is populated
**And** the deviation column is computed from deriveDeviation(polarity, strength)
**And** formula.ts receives the same deviation values it always has — zero changes to scoring math (FR-S13)

## Tasks

### Task 1: Add Polarity Types and ExtractedEvidence to Domain
- [ ] 1.1: Add `EvidencePolarity` type (`"high" | "low"`) to `packages/domain/src/types/evidence.ts`
- [ ] 1.2: Add `ExtractedEvidence` interface to `packages/domain/src/types/evidence.ts` with fields: bigfiveFacet, polarity, strength, confidence, domain, note
- [ ] 1.3: Export new types from `packages/domain/src/index.ts`

### Task 2: Implement deriveDeviation Pure Function (TDD)
- [ ] 2.1: Write failing unit tests for all 6 polarity+strength combinations in `packages/domain/src/utils/__tests__/derive-deviation.test.ts`
- [ ] 2.2: Implement `deriveDeviation(polarity, strength)` in `packages/domain/src/utils/derive-deviation.ts`
- [ ] 2.3: Export `deriveDeviation` from `packages/domain/src/index.ts`

### Task 3: Implement adaptExtractedEvidence Adapter Function (TDD)
- [ ] 3.1: Write failing unit tests for the adapter in `packages/domain/src/utils/__tests__/adapt-extracted-evidence.test.ts`
- [ ] 3.2: Implement `adaptExtractedEvidence(extracted: ExtractedEvidence): EvidenceInput` in `packages/domain/src/utils/adapt-extracted-evidence.ts`
- [ ] 3.3: Export `adaptExtractedEvidence` from `packages/domain/src/index.ts`

### Task 4: Add Polarity to Evidence Effect Schema
- [ ] 4.1: Add polarity field (`S.optional(S.Literal("high", "low"))`) to `EvidenceItemSchema` in `packages/domain/src/schemas/evidence-extraction.ts`
- [ ] 4.2: Add polarity field to `EvidenceItemJsonSchemaSource` for LLM JSON Schema generation
- [ ] 4.3: Verify lenient parsing still works with and without polarity field

### Task 5: Database Schema and Migration
- [ ] 5.1: Create pgEnum `evidence_polarity_enum` with values `["high", "low"]` in `packages/infrastructure/src/db/drizzle/schema.ts`
- [ ] 5.2: Add nullable `polarity` column to `conversationEvidence` table definition using the new enum
- [ ] 5.3: Hand-write migration SQL at `drizzle/20260402200000_add_evidence_polarity/migration.sql`:
  - CREATE TYPE evidence_polarity AS ENUM ('high', 'low');
  - ALTER TABLE conversation_evidence ADD COLUMN polarity evidence_polarity;
- [ ] 5.4: Verify existing evidence rows with NULL polarity continue to be readable

### Task 6: Update Repository Layer for Polarity
- [ ] 6.1: Add optional `polarity` field to `ConversationEvidenceInput` type in `packages/domain/src/repositories/conversation-evidence.repository.ts`
- [ ] 6.2: Add optional `polarity` field to `ConversationEvidenceRecord` type
- [ ] 6.3: Update Drizzle repository save method to include polarity when present
- [ ] 6.4: Update Drizzle repository read methods to include polarity in returned records

## Dependencies

- **Depends on:** Epic 1 complete (health domain already in DB enum and constants)
- **Depended on by:** Story 3.2 (ConversAnalyzer split), Story 3.4 (pipeline integration)

## Technical Notes

- The polarity column MUST be nullable for backward compatibility — existing evidence rows have deviation but no polarity
- The `deriveDeviation` function is a pure deterministic mapping, no Effect needed
- formula.ts remains completely unchanged — the adapter bridges the gap between new extraction output and existing scoring input
- Migration must be additive only — never modify existing migration files
- The EvidenceItemSchema polarity field should be optional (S.optional) to maintain backward compat with existing extraction pipeline until Story 3.3 switches to the new prompt
