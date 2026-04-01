# Story 40-1: Add Health Life Domain to Constants, Schemas, and Database

Status: ready-for-dev

## Story

As a **system operator**,
I want the health life domain added to all TypeScript constants, Effect schemas, and the PostgreSQL enum,
So that the platform can classify personality evidence observed in health contexts (exercise, diet, sleep, stress management).

## Acceptance Criteria

1. **Given** the current LIFE_DOMAINS constant includes solo **When** the domain package constants are updated **Then** LIFE_DOMAINS includes: work, relationships, family, leisure, health, other **And** LifeDomainSchema (Effect Schema) validates the new domain list **And** STEERABLE_DOMAINS includes health

2. **Given** the PostgreSQL evidence_domain enum does not include health **When** a new Drizzle migration is applied **Then** the evidence_domain pgEnum includes health **And** no existing data is altered by this migration **And** the migration file is appended (existing migrations untouched)

3. **Given** the system boots after migration **When** new evidence is inserted with domain = "health" **Then** the insert succeeds and the evidence is retrievable

## Tasks / Subtasks

- [ ] Task 1: Update LIFE_DOMAINS constant and LifeDomainSchema (AC: #1)
  - [ ] 1.1: Write failing test — assert LIFE_DOMAINS contains "health" and does not contain "solo"
  - [ ] 1.2: Update `packages/domain/src/constants/life-domain.ts` — replace "solo" with "health" in LIFE_DOMAINS array
  - [ ] 1.3: Verify LifeDomainSchema automatically updates (derived from LIFE_DOMAINS)
  - [ ] 1.4: Verify STEERABLE_DOMAINS automatically includes "health" (derived by filtering LIFE_DOMAINS)

- [ ] Task 2: Update pgEnum in Drizzle schema (AC: #2)
  - [ ] 2.1: Update `packages/infrastructure/src/db/drizzle/schema.ts` — the pgEnum derives from LIFE_DOMAINS, so the import change propagates automatically
  - [ ] 2.2: Hand-write a new migration SQL file to add "health" to the evidence_domain pgEnum (additive only — does not remove solo yet, per Story 1.3 cleanup)

- [ ] Task 3: Update all references that use the "solo" domain literal (AC: #1)
  - [ ] 3.1: Search for "solo" string literals in domain, infrastructure, and contracts packages
  - [ ] 3.2: Update evidence-extraction schemas that reference LIFE_DOMAINS (auto-derived, verify)
  - [ ] 3.3: Update any test fixtures or mocks that use domain = "solo"

- [ ] Task 4: Run existing tests and fix breakages (AC: #1, #2, #3)
  - [ ] 4.1: Run `pnpm test:run` and fix any test failures from the domain change
  - [ ] 4.2: Run `pnpm turbo typecheck` and fix any type errors

## Dev Notes

### Key Files
- `packages/domain/src/constants/life-domain.ts` — LIFE_DOMAINS, LifeDomain type, LifeDomainSchema, STEERABLE_DOMAINS
- `packages/domain/src/schemas/evidence-extraction.ts` — EvidenceItemSchema uses `S.Literal(...LIFE_DOMAINS)`, auto-derives
- `packages/infrastructure/src/db/drizzle/schema.ts` — pgEnum("evidence_domain", LIFE_DOMAINS), auto-derives
- `drizzle/` — migration directory, append new migration

### Important: Migration Strategy
The TypeScript constants change `solo → health` (replace), but the DB migration only ADDS "health" to the pgEnum. The solo value is left in PostgreSQL for backward compatibility — it will be removed in Story 1.3 after data migration. The Drizzle schema pgEnum derives from LIFE_DOMAINS which no longer includes "solo", but the DB still has it — this is intentional divergence until Story 1.3 cleanup.

### Pattern Reference
See existing migrations in `drizzle/` for format. Each migration is a directory named `YYYYMMDDHHMMSS_description/migration.sql`.

## Architect Notes

### Finding: pgEnum/LIFE_DOMAINS Divergence Risk (Major)

**Problem:** `schema.ts` declares `pgEnum("evidence_domain", LIFE_DOMAINS)`. If LIFE_DOMAINS removes "solo", the Drizzle schema will no longer recognize "solo" as a valid enum value, but existing DB rows still contain domain="solo". This can cause read failures or Drizzle introspection mismatches.

**Resolution:** In this story, LIFE_DOMAINS must ADD "health" while KEEPING "solo". The constant becomes a 7-element array: `["work", "relationships", "family", "leisure", "solo", "health", "other"]`. Story 1.3 will later remove "solo" after data migration. This means:

- `packages/domain/src/constants/life-domain.ts`: Add "health" to LIFE_DOMAINS, keep "solo". STEERABLE_DOMAINS filter already excludes "other"; update it to also exclude "solo" from steering (since solo is deprecated and should not be steered to).
- AC #1 should be interpreted as: LIFE_DOMAINS includes health (additive). Solo removal is deferred to Story 1.3.
- The LifeDomainSchema will validate both "solo" and "health" — this is correct for the transition period.
- The pgEnum in schema.ts will include both "solo" and "health" — matching the DB state after migration.

**Key file changes:**
1. `packages/domain/src/constants/life-domain.ts` — Add "health" to array, update STEERABLE_DOMAINS to exclude "solo"
2. `packages/infrastructure/src/db/drizzle/schema.ts` — No code change needed (auto-derives from LIFE_DOMAINS)
3. `drizzle/20260401220000_add_health_domain/migration.sql` — `ALTER TYPE evidence_domain ADD VALUE 'health';`
4. Test files referencing "solo" domain — no changes needed (solo still valid)
5. Update any tests that assert exact LIFE_DOMAINS contents to include "health"
