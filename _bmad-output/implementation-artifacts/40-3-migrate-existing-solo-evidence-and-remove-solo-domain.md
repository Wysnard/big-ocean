# Story 40-3: Migrate Existing Solo Evidence and Remove Solo Domain

**Epic:** 1 — Health Domain & Evidence Migration
**Status:** ready-for-dev
**FRs covered:** FR-S5, FR-S6 (partial — removal from TypeScript)
**NFRs addressed:** NFR-S5 (safe migration), NFR-S1 (backward compat)
**Depends on:** Story 40-1 (health domain in pgEnum), Story 40-2 (domain definitions updated)

## User Story

As a **system operator**,
I want existing solo evidence in the database remapped to leisure or health, and the solo domain removed from all TypeScript constants,
So that the system operates on a clean 6-domain model without legacy data.

## Acceptance Criteria

**AC1: Data migration remaps solo evidence to health or leisure**

**Given** existing conversation_evidence rows have domain = "solo"
**When** the data migration runs
**Then** each solo evidence record is remapped to "health" or "leisure" using the following deterministic rule:
- If `bigfive_facet` is in {activity_level, self_discipline, excitement_seeking, immoderation, cautiousness, vulnerability, anxiety, self_efficacy} -> "health"
- All other facets -> "leisure"
**And** zero rows remain with domain = "solo" after migration

**AC2: Solo removed from TypeScript constants**

**Given** solo evidence has been remapped
**When** solo is removed from TypeScript constants (LIFE_DOMAINS, STEERABLE_DOMAINS, LifeDomainSchema)
**Then** the TypeScript compiler reports no references to "solo" in domain-related constants
**And** the solo value is left in the PostgreSQL pgEnum for now (unused — cleanup deferred to Story C.1)
**And** all existing unit tests pass (with updated fixtures where needed)

**AC3: Running sessions unaffected**

**Given** a running session created before the migration
**When** the session continues after the migration
**Then** evidence retrieval works correctly for all previously-solo evidence now classified as leisure or health (NFR-S5)

**AC4: GREETING_SEED_POOL updated**

**Given** formula.ts references "solo" in GREETING_SEED_POOL
**When** the domain is removed
**Then** the "solo" entry is remapped to an appropriate active domain (health or leisure)

## Tasks

### Task 1: Write DB migration to remap solo evidence

**Subtasks:**
1.1. Create migration file `drizzle/20260402200000_migrate_solo_evidence/migration.sql`
1.2. UPDATE conversation_evidence SET domain = 'health' WHERE domain = 'solo' AND bigfive_facet IN ('activity_level', 'self_discipline', 'excitement_seeking', 'immoderation', 'cautiousness', 'vulnerability', 'anxiety', 'self_efficacy')
1.3. UPDATE conversation_evidence SET domain = 'leisure' WHERE domain = 'solo'
1.4. Add verification query comment: SELECT COUNT(*) FROM conversation_evidence WHERE domain = 'solo' -- should be 0

### Task 2: Remove "solo" from LIFE_DOMAINS constant and related types

**Subtasks:**
2.1. Remove "solo" from LIFE_DOMAINS array in `packages/domain/src/constants/life-domain.ts`
2.2. Remove ActiveLifeDomain type alias (no longer needed — LifeDomain IS the active set)
2.3. Remove "solo" from NON_STEERABLE set
2.4. Update LIFE_DOMAIN_DEFINITIONS type to use LifeDomain (since solo is gone, Record<LifeDomain, string> minus "other" is now just the 5 steerable + other)
2.5. Ensure LifeDomainSchema only accepts 6 domains

### Task 3: Update GREETING_SEED_POOL in formula.ts

**Subtasks:**
3.1. Change `{ domain: "solo", facet: "self_consciousness" }` to `{ domain: "health", facet: "self_consciousness" }` (or another appropriate active domain)

### Task 4: Update all test fixtures referencing "solo"

**Subtasks:**
4.1. Update `packages/domain/src/constants/__tests__/life-domain.test.ts` — expect 6 domains, no solo
4.2. Update `packages/domain/src/constants/__tests__/life-domain-definitions.test.ts` — already no solo, verify
4.3. Update `packages/domain/src/constants/__tests__/territory-catalog.test.ts` — update any solo domain references
4.4. Update `packages/domain/src/types/__tests__/territory.test.ts` — update solo references
4.5. Update `packages/domain/src/utils/__tests__/formula-numerical-hand-computed.test.ts`
4.6. Update `packages/domain/src/utils/__tests__/formula-numerical-steering.test.ts`
4.7. Update `packages/domain/src/utils/__tests__/formula-metrics-steering.test.ts`
4.8. Update `packages/domain/src/utils/__tests__/formula-numerical-components.test.ts`
4.9. Update `packages/domain/src/utils/__tests__/domain-distribution.test.ts`
4.10. Update `packages/domain/src/utils/steering/__tests__/prompt-builder.test.ts`
4.11. Update `packages/domain/src/utils/steering/__tests__/pacing-territory-scorer.test.ts`
4.12. Update `packages/infrastructure/src/db/__tests__/schema.test.ts` — expect 7 enum values (solo stays in pgEnum)
4.13. Update `packages/infrastructure/src/repositories/__tests__/conversanalyzer-energy.test.ts`
4.14. Update `packages/infrastructure/src/repositories/__tests__/conversanalyzer-prompt-content.test.ts`
4.15. Update `apps/api/src/use-cases/__tests__/send-message-conversanalyzer.use-case.test.ts`
4.16. Update `apps/api/src/use-cases/__tests__/send-message-evidence-caps.use-case.test.ts`

### Task 5: Update territory-catalog.ts solo references (if not already done by Story 2.1)

**Note:** Territory catalog solo->new-domain remapping is Story 2.1's scope. However, if territory-catalog.ts still references "solo" domains at this point, those must be updated to compile. Check and update if needed.

### Task 6: Verify typecheck passes

6.1. Run `pnpm turbo typecheck` — all packages must pass
6.2. Run `pnpm test:run` — all unit tests must pass

## Technical Notes

- The PostgreSQL pgEnum retains "solo" for backward compatibility — removal is deferred to Story C.1 (post-implementation cleanup requiring type recreation)
- The migration is safe for running sessions because it only remaps domain labels; evidence retrieval by session_id is unaffected
- The facet-to-domain mapping rule is derived from the health territory facet coverage in ADR-26
- LIFE_DOMAINS drives the pgEnum via `pgEnum("evidence_domain", LIFE_DOMAINS)` — but since solo stays in the DB enum, the schema.ts must handle this divergence (pgEnum keeps the full list including solo, while TypeScript constants exclude it)

## Dev Notes

- The pgEnum in schema.ts currently derives from LIFE_DOMAINS. After removing solo from LIFE_DOMAINS, the pgEnum will no longer include solo. This is acceptable because:
  - No new data will be inserted with domain="solo"
  - Existing data has been migrated away from solo
  - The pgEnum in PostgreSQL already has solo (from initial migration) and won't be altered by Drizzle
  - If we need to keep solo in the pgEnum for safety, we can hardcode it in schema.ts instead of deriving from LIFE_DOMAINS
