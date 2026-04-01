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
