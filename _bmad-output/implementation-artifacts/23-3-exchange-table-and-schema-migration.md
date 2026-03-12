# Story 23-3: Exchange Table & Schema Migration

**Epic:** Epic 1 — Conversation State Foundation (Pacing Pipeline)
**Status:** ready-for-dev
**Depends on:** Story 23-1 (Pipeline Domain Types) — types needed will be defined locally
**FRs covered:** FR14, FR15, FR16

## Description

As a developer,
I want an `assessment_exchange` table and evolved FKs on `assessment_message` and `conversation_evidence`,
So that per-turn pipeline state is stored as a single row and all related data references the exchange.

## Acceptance Criteria

### AC1: assessment_exchange table creation

**Given** the Drizzle schema at `packages/infrastructure/src/db/drizzle/schema.ts`
**When** the `assessmentExchange` table is added
**Then** it contains all columns specified in ADR-CP-14:
- `id` (uuid, PK), `sessionId` (uuid, FK -> assessment_session), `turnNumber` (smallint, NOT NULL)
- Extraction: `energy` (real), `energyBand` (text), `telling` (real), `tellingBand` (text), `withinMessageShift` (boolean), `stateNotes` (jsonb), `extractionTier` (smallint)
- Pacing: `smoothedEnergy` (real), `comfort` (real), `drain` (real), `drainCeiling` (real), `eTarget` (real)
- Scoring: `scorerOutput` (jsonb)
- Selection: `selectedTerritory` (text), `selectionRule` (text)
- Governor: `governorOutput` (jsonb), `governorDebug` (jsonb)
- Derived: `sessionPhase` (text), `transitionType` (text)
- `createdAt` (timestamp)

### AC2: assessment_message table evolution

**Given** the `assessmentMessages` table
**When** the migration is applied
**Then** `exchangeId` (uuid, FK -> assessment_exchange) is added
**And** `territoryId` and `observedEnergyLevel` columns are dropped
**And** `userId` column is dropped (derivable from session)

### AC3: conversation_evidence table evolution

**Given** the `conversationEvidence` table
**When** the migration is applied
**Then** `exchangeId` (uuid, FK -> assessment_exchange) is added
**And** existing `messageId` FK is kept (provenance)

### AC4: Fresh-start migration

**Given** this is a fresh-start migration (no production users)
**When** `pnpm db:generate` and `pnpm db:migrate` are run
**Then** the migration creates `assessment_exchange`, adds `exchange_id` FKs, and drops deprecated columns in a single migration file
**And** existing dev/test sessions are discarded (accepted)

### AC5: Exchange repository interface

**Given** the exchange repository interface
**When** `AssessmentExchangeRepository` is defined at `packages/domain/src/repositories/assessment-exchange.repository.ts`
**Then** it uses `Context.Tag` following existing repository patterns
**And** it exposes methods: `create(sessionId, turnNumber)`, `update(exchangeId, data)`, `findBySession(sessionId)`

### AC6: Exchange repository implementation

**Given** the exchange repository implementation
**When** `AssessmentExchangeDrizzleRepositoryLive` is created at `packages/infrastructure/src/repositories/assessment-exchange.drizzle.repository.ts`
**Then** it implements the repository interface using Drizzle ORM
**And** a `__mocks__/assessment-exchange.drizzle.repository.ts` in-memory mock is provided following the existing mock pattern

## Tasks

### Task 1: Define pipeline types locally (dependency on 23-1)
- Create `packages/domain/src/types/pacing-pipeline.types.ts` with:
  - `EnergyBand` — `"minimal" | "low" | "steady" | "high" | "very_high"`
  - `TellingBand` — `"fully_compliant" | "mostly_compliant" | "mixed" | "mostly_self_propelled" | "strongly_self_propelled"`
  - `ExtractionTier` — 1 | 2 | 3
  - `SessionPhase` — `"opening" | "exploring" | "amplifying"`
  - `TransitionType` — `"normal" | "energy_shift" | "territory_change"`
  - `SelectionRule` — `"cold_start" | "argmax" | "argmax_amplify"`
- Export from domain package index

### Task 2: Add assessment_exchange table to Drizzle schema
- Add `assessmentExchange` table definition to `packages/infrastructure/src/db/drizzle/schema.ts`
- Add all columns per AC1
- Add index on `sessionId`
- Add unique constraint on `(sessionId, turnNumber)`
- Add relations

### Task 3: Evolve assessment_message table
- Add `exchangeId` column (uuid, FK -> assessment_exchange, nullable for migration)
- Drop `territoryId` column
- Drop `observedEnergyLevel` column
- Drop `userId` column
- Update `AssessmentMessageEntitySchema` in domain entities
- Update relations

### Task 4: Evolve conversation_evidence table
- Add `exchangeId` column (uuid, FK -> assessment_exchange, nullable)
- Keep existing `messageId` FK
- Update relations

### Task 5: Update existing code references
- Update `AssessmentMessageRepository` interface to remove dropped columns from `saveMessage`
- Update `AssessmentMessageDrizzleRepositoryLive` implementation
- Update `AssessmentMessageDrizzleRepositoryLive` mock
- Update any use-cases that reference `territoryId`, `observedEnergyLevel`, or `userId` on messages
- Update `ConversationEvidenceRepository` if needed

### Task 6: Create AssessmentExchangeRepository interface
- Create `packages/domain/src/repositories/assessment-exchange.repository.ts`
- Define Context.Tag with methods: `create`, `update`, `findBySession`
- Define input/output types

### Task 7: Create AssessmentExchangeDrizzleRepositoryLive implementation
- Create `packages/infrastructure/src/repositories/assessment-exchange.drizzle.repository.ts`
- Implement all repository methods using Drizzle ORM
- Export from infrastructure index

### Task 8: Create mock implementation
- Create `packages/infrastructure/src/repositories/__mocks__/assessment-exchange.drizzle.repository.ts`
- In-memory implementation following existing mock patterns

### Task 9: Write tests
- Unit tests for repository mock behavior
- Type-level tests ensuring schema correctness

### Task 10: Generate and verify migration
- Run `pnpm db:generate` to create migration SQL
- Verify migration file contents

## Architect Notes

### Finding 1 (major): Cascading breakage from dropped columns

Dropping `userId`, `territoryId`, `observedEnergyLevel` from `assessmentMessage` will break:

1. **`AssessmentMessageRepository.saveMessage` signature** — currently takes `userId`, `territoryId`, `observedEnergyLevel` as optional params. Must be simplified to `(sessionId, role, content, exchangeId?)`.
2. **`assessment-message.drizzle.repository.ts`** — implementation inserts these columns. Must be updated.
3. **`__mocks__/assessment-message.drizzle.repository.ts`** — mock stores these fields. Must be updated.
4. **`message.entity.ts`** — `AssessmentHumanMessageEntitySchema` has `observedEnergyLevel` and `userId`; `AssessmentAssistantMessageEntitySchema` has `territoryId`. Both must be cleaned.
5. **Use-cases calling `saveMessage`** — search for all callers:
   - `apps/api/src/use-cases/send-message.use-case.ts`
   - `apps/api/src/use-cases/` — grep for `saveMessage` and `territoryId`
   - Seed scripts at repo root
6. **Frontend** — `apps/front` may reference `territoryId` or `observedEnergyLevel` on message entities.
7. **Relations in `schema.ts`** — the `assessmentMessage.user` relation uses `assessmentMessage.userId` and must be removed.

**Approach:** Update all of these in a single commit. Use `pnpm turbo typecheck` to find all breakages.

### Finding 2 (major): Migration generation not possible in worktree

The worktree has no running database, so `pnpm db:generate` and `pnpm db:migrate` cannot run. The story scope for this PR is:

1. Update Drizzle schema TypeScript (which drizzle-kit uses to generate SQL)
2. Update all code that depends on the schema types
3. Migration SQL generation is deferred — the schema changes are the source of truth for `drizzle-kit generate`

**Do NOT** attempt to run `pnpm db:generate` or `pnpm db:migrate` in CI. The migration file will be generated when a developer runs these commands against a real database.

### Finding 3 (minor): Entity schema updates

The `AssessmentMessageEntitySchema` uses a `Schema.Union` of Human and Assistant message schemas. After removing the dropped columns:
- Human messages: remove `userId`, `observedEnergyLevel`; optionally add `exchangeId`
- Assistant messages: remove `territoryId`; optionally add `exchangeId`
- Both: `exchangeId` as `Schema.optionalWith(Schema.NullOr(Schema.UUID), { default: () => null })`
