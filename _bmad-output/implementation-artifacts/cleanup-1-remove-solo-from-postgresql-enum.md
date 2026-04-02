# Story C.1: Remove Solo from PostgreSQL Enum

**Status:** ready-for-dev
**Epic:** Post-Implementation Cleanup
**Priority:** low
**Points:** 2

## User Story

As a **system operator**,
I want the unused solo value removed from the PostgreSQL evidence_domain enum,
So that the database schema reflects the clean 6-domain model with no legacy values.

## Preconditions

- Story 1.3 (40-3) is complete: zero conversation_evidence rows have domain = "solo"
- Solo is already removed from all TypeScript constants (LIFE_DOMAINS, STEERABLE_DOMAINS, LifeDomainSchema)
- The health domain has been added and solo evidence has been migrated

## Acceptance Criteria

### AC-1: PostgreSQL enum cleanup migration
**Given** zero conversation_evidence rows have domain = "solo" (verified by Story 1.3)
**And** solo is already removed from all TypeScript constants
**When** a new Drizzle migration is applied that removes solo from the evidence_domain pgEnum
**Then** the enum contains only: work, relationships, family, leisure, health, other
**And** all existing data is preserved (no rows reference solo)
**And** the migration file is appended (existing migrations untouched)
**And** the system boots and operates normally after migration

### AC-2: Schema TypeScript constant updated
**Given** the DB_EVIDENCE_DOMAINS constant in schema.ts includes "solo"
**When** the schema is updated
**Then** DB_EVIDENCE_DOMAINS contains only: work, relationships, family, leisure, health, other
**And** all backward-compatibility comments referencing solo removal deferral are removed or updated

### AC-3: Schema test updated
**Given** the schema test expects 7 enum values and asserts solo is present
**When** the test is updated
**Then** it expects exactly 6 enum values
**And** it does NOT assert solo is present
**And** all tests pass

### AC-4: Seed scripts and fixtures updated
**Given** seed scripts and e2e factories may reference "solo" as a domain
**When** they are updated
**Then** no seed script or fixture references "solo" as a domain value
**And** seed scripts use only valid domains: work, relationships, family, leisure, health, other

### AC-5: Frontend evidence utils updated
**Given** the evidence-utils.ts DOMAIN_LABELS map includes a "solo" entry
**When** it is updated
**Then** the solo entry is removed
**And** the health entry is present (if not already)

## Tasks

### Task 1: Write the PostgreSQL migration SQL
- Create a new migration directory: `drizzle/20260402220000_remove_solo_from_domain_enum/migration.sql`
- PostgreSQL does not support `ALTER TYPE ... REMOVE VALUE`. The migration must:
  1. Create a new enum type without solo
  2. Alter the column to use the new type (via text cast)
  3. Drop the old type
  4. Rename the new type to the original name
- Verify the migration is idempotent-safe (no rows reference solo)

### Task 2: Update schema.ts
- Remove "solo" from DB_EVIDENCE_DOMAINS array
- Remove or update backward-compatibility comments about solo deferral
- Update the schema.ts doc comment

### Task 3: Update schema test
- Change assertion from 7 values to 6
- Remove assertion that solo is in the enum
- Add assertion that solo is NOT in the enum

### Task 4: Update seed scripts and e2e factories
- `scripts/seed-completed-assessment.ts`: Replace all `domain: "solo"` with appropriate domains (health or leisure)
- `e2e/factories/assessment.factory.ts`: Remove "solo" from the domains array, add "health" if not present

### Task 5: Update frontend evidence-utils.ts
- Remove `solo: "Solo"` from DOMAIN_LABELS
- Add `health: "Health"` if not already present

### Task 6: Remove remaining solo references
- Clean up any remaining comments or code that reference solo deferral to Story C.1
- Update schema.ts import comment about LIFE_DOMAINS

## Technical Notes

- PostgreSQL enum value removal requires: CREATE new type -> ALTER column -> DROP old type -> RENAME new type
- This is a maintenance-window operation in production
- The migration should include a safety check (assert 0 rows with solo) before proceeding
- Never modify existing migration files
