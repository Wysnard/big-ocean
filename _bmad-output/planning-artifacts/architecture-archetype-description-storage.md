---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "prd.md"
  - "ux-design-specification.md"
  - "architecture/architecture-decision-records.md"
  - "docs/ARCHITECTURE.md"
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-09'
project_name: big-ocean
user_name: Vincentlay
date: '2026-02-09'
communication_language: English
document_output_language: English
---

# Architecture Decision Document: ADR-7 — Remove Derived Archetype Fields from `public_profile`

## Project Context Analysis

### Requirements Overview

**Functional Requirements Impacted:**
- FR9: System maps OCEAN codes to memorable character archetype names
- FR10: System retrieves archetype name + 2-3 sentence trait description
- FR13: System generates shareable profile with archetype code, character name, trait summary

**Existing Architectural Decision:**
- ADR-5: OCEAN Archetype Lookup — In-Memory Registry + Component-Based Generation
- Archetype name, description, and color are deterministic given a 4-letter OCEAN code

### The Contradiction

Current `public_profile` table denormalizes `description`, `archetypeName`, and `color` per row, contradicting ADR-5 which establishes these as in-memory derivable constants.

### Technical Constraints & Dependencies

- Drizzle ORM schema change requires migration
- Repository interface (`PublicProfileRepository`) and its mock need updating
- Use-case layer (`create-shareable-profile.use-case.ts`) passes these fields explicitly
- API contract for GET /api/profiles/:id must still return description to consumers

### Cross-Cutting Concerns

1. **Data Consistency**: Archetype wording updates currently don't propagate to existing profiles
2. **Single Source of Truth**: ADR-5 registry should be the sole owner of archetype metadata
3. **API Response Assembly**: Description must be derived at read-time from OCEAN code

## Core Architectural Decisions

### Decision: Remove Derived Archetype Fields from `public_profile` (ADR-7)

**Priority:** Critical (blocks Story 5.2 implementation cleanup)

**Selected Option:** Option A (full removal) — enhanced by first-principles analysis

**Remove from `public_profile`:** `archetypeName`, `description`, `color`, `traitSummary`
**Keep:** `oceanCode4` (pragmatic denormalization for DB queries)

**Resulting Schema:**

```
id | sessionId | userId | oceanCode5 | oceanCode4 | isPublic | viewCount | createdAt | updatedAt
```

**Rationale:**

1. **ADR-5 Compliance** — archetype data belongs in-memory, not in database
2. **First Principles** — `oceanCode5` is the irreducible assessment result; everything else is derived
3. **Data Consistency** — archetype updates instantly propagate to all profiles
4. **Simplicity** — fewer fields through the entire write path

**Impact Analysis:**

| Layer | Change |
|---|---|
| DB Schema | Migration: drop 4 columns (`archetype_name`, `description`, `color`, `trait_summary`) |
| `PublicProfileRepository` interface | `CreatePublicProfileInput` reduced from 8 → 4 fields; `PublicProfileData` reduced from 12 → 8 fields |
| `PublicProfileDrizzleRepositoryLive` | Remove mapping of dropped columns in all methods |
| `__mocks__/public-profile.drizzle.repository.ts` | Same simplification |
| `create-shareable-profile.use-case.ts` | Remove lines passing `archetypeName`, `description`, `color`, `traitSummary` |
| `get-public-profile.use-case.ts` | Add `lookupArchetype()` + `deriveTraitSummary()` calls before return |
| `GetPublicProfileResponseSchema` (contract) | **No change** — still returns all fields to consumers |
| Frontend (`profile.$publicProfileId.tsx`) | **No change** — API response shape unchanged |

**Trade-offs Accepted:**

- DB rows not human-readable (use `ocean_code_4` for queries)
- Read path gains pure function call (< 1ms, negligible per ADR-5 benchmarks)
- One-time migration for existing rows

**Supersedes:** ADR-3 `public_profiles` schema (denormalized column list reduced)
**Aligns With:** ADR-5 (in-memory archetype lookup, no DB storage)

## Implementation Patterns for ADR-7

### Naming Patterns (Existing — No Changes)

All existing conventions from NAMING-CONVENTIONS.md apply:
- DB columns: `snake_case` (e.g., `ocean_code_5`, `is_public`)
- TypeScript: `camelCase` properties (e.g., `oceanCode5`, `isPublic`)
- Repository interfaces: `PascalCase` + `Repository` suffix
- Implementation files: `kebab-case.drizzle.repository.ts`

### Structure Patterns

**Migration file:** Generated via `pnpm db:generate` — Drizzle auto-names migration folders

**Files to modify (in order):**

1. `packages/infrastructure/src/db/drizzle/schema.ts` — Drop 4 columns from `publicProfile`
2. `packages/domain/src/repositories/public-profile.repository.ts` — Simplify interfaces
3. `packages/infrastructure/src/repositories/public-profile.drizzle.repository.ts` — Remove dropped field mappings
4. `packages/infrastructure/src/repositories/__mocks__/public-profile.drizzle.repository.ts` — Match simplified interfaces
5. `apps/api/src/use-cases/create-shareable-profile.use-case.ts` — Remove archetype field passing
6. `apps/api/src/use-cases/get-public-profile.use-case.ts` — Add `lookupArchetype()` derivation
7. Generate migration: `pnpm db:generate`

### Process Patterns

**Derivation utility (new pure function):**

```typescript
// packages/domain/src/utils/derive-trait-summary.ts
export function deriveTraitSummary(oceanCode5: string): Record<string, string> {
  const traitSummary: Record<string, string> = {};
  for (let i = 0; i < BIG_FIVE_TRAITS.length; i++) {
    const trait = BIG_FIVE_TRAITS[i];
    const level = oceanCode5[i];
    if (trait && level) traitSummary[trait] = level;
  }
  return traitSummary;
}
```

**Read-path assembly pattern:**

```typescript
// In get-public-profile.use-case.ts
const archetype = lookupArchetype(profile.oceanCode4);
const traitSummary = deriveTraitSummary(profile.oceanCode5);
return {
  archetypeName: archetype.name,
  description: archetype.description,
  color: archetype.color,
  oceanCode: profile.oceanCode5,
  traitSummary,
  isPublic: profile.isPublic,
};
```

### Anti-Patterns to Avoid

- Do NOT add a new `archetypes` reference table — ADR-5 is explicit about in-memory
- Do NOT pass archetype fields through the repository layer — derive at use-case level
- Do NOT change `GetPublicProfileResponseSchema` — API contract stays identical
- Do NOT store `traitSummary` in any DB table — it's derivable from `oceanCode5`

### Enforcement

- Tests: `get-public-profile.use-case.test.ts` must verify that the returned `archetypeName` matches `lookupArchetype(oceanCode4).name`
- Lint: Biome will catch unused imports after removing dropped fields
- Type safety: Removing fields from `CreatePublicProfileInput` will cause compile errors in any code still passing them

## Project Structure & Boundaries (ADR-7 Scope)

### Files Modified by ADR-7

```
packages/
├── domain/src/
│   ├── repositories/
│   │   └── public-profile.repository.ts          # ← Simplify interfaces
│   ├── utils/
│   │   └── derive-trait-summary.ts                # ← NEW pure function
│   └── index.ts                                   # ← Export new utility
├── infrastructure/src/
│   ├── db/drizzle/
│   │   └── schema.ts                              # ← Drop 4 columns from publicProfile
│   ├── repositories/
│   │   ├── public-profile.drizzle.repository.ts   # ← Remove dropped field mappings
│   │   └── __mocks__/
│   │       └── public-profile.drizzle.repository.ts # ← Match simplified interfaces
│   └── index.ts                                   # ← No change expected
├── contracts/src/
│   └── http/groups/
│       └── profile.ts                             # ← NO CHANGE (API contract stable)
apps/
├── api/src/
│   ├── use-cases/
│   │   ├── create-shareable-profile.use-case.ts   # ← Remove archetype field passing
│   │   ├── get-public-profile.use-case.ts         # ← Add lookupArchetype() derivation
│   │   └── __tests__/
│   │       └── shareable-profile.use-case.test.ts # ← Update test assertions
│   └── handlers/
│       └── profile.ts                             # ← NO CHANGE (handler is thin)
├── front/src/
│   └── routes/
│       └── profile.$publicProfileId.tsx           # ← NO CHANGE (API response unchanged)
drizzle/
└── YYYYMMDDHHMMSS_drop_archetype_columns/         # ← NEW migration (auto-generated)
```

### Architectural Boundaries

**Data Boundary Change:**
- `PublicProfileRepository` no longer carries archetype metadata across the data boundary
- Archetype derivation happens **inside** the use-case layer, not at the repository layer

**Data Flow (After ADR-7):**

```
DB (oceanCode5 + oceanCode4)
  → Repository (returns minimal profile data)
    → Use-Case (derives archetype via lookupArchetype + deriveTraitSummary)
      → Handler (passes through)
        → API Response (full shape with archetypeName, description, color, traitSummary)
```

### Integration Points

- `lookupArchetype()` — pure function from `@workspace/domain`, no service dependency
- `deriveTraitSummary()` — new pure function from `@workspace/domain`, no service dependency
- Both are imported directly (not via Context.Tag), so no Layer changes needed

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** PASS — ADR-7 resolves contradiction between ADR-5 and current schema. No conflicts with ADR-1 through ADR-6.

**Pattern Consistency:** PASS — Hexagonal architecture respected. Derivation stays in use-case layer. Effect Service Pattern unaffected.

**Structure Alignment:** PASS — File tree maps to existing monorepo. New utility follows `packages/domain/src/utils/` pattern.

### Requirements Coverage

| Requirement | Status | Notes |
|---|---|---|
| FR9: OCEAN → archetype name | PASS | `lookupArchetype()` called at read-time |
| FR10: Archetype description retrieval | PASS | Derived from registry, < 1ms |
| FR13: Shareable profile generation | PASS | API response unchanged |

### Implementation Readiness

- **Decision Completeness:** PASS — versions, rationale, trade-offs documented
- **Structure Completeness:** PASS — every modified file listed with specific change
- **Pattern Completeness:** PASS — read/write path examples, anti-patterns, enforcement rules

### Gap Analysis

- **Critical Gaps:** None
- **Important:** Add unit test for `deriveTraitSummary` pure function
- **Nice-to-Have:** Formalize ADR-7 entry in `architecture-decision-records.md` during implementation

### Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** High
