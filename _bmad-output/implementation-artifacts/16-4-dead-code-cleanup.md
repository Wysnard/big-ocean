# Story 16.4: Dead Code Cleanup

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want unused code removed from the codebase,
So that the codebase stays lean and doesn't confuse future development.

## Acceptance Criteria

1. **Given** `update-facet-scores.use-case.ts` has no production callers (not exported from `use-cases/index.ts`)
   **When** the codebase is checked
   **Then** the file and its test (`update-facet-scores.use-case.test.ts`) are deleted

2. **Given** `facet-evidence.noop.repository.ts` is unused (production wires `FacetEvidenceDrizzleRepositoryLive`)
   **When** confirmed no production consumer exists
   **Then** the file is deleted and its export removed from `packages/infrastructure/src/index.ts`

3. **Given** `scripts/eval-portrait.ts` imports `aggregateFacetScores` and `deriveTraitScores` from `@workspace/domain`
   **When** updated
   **Then** it reads from persisted `assessment_results` instead (via direct DB query or a new helper)

## Tasks / Subtasks

- [ ] Task 1: Delete `update-facet-scores.use-case.ts` and its test (AC: #1)
  - [ ] 1.1 Delete `apps/api/src/use-cases/update-facet-scores.use-case.ts`
  - [ ] 1.2 Delete `apps/api/src/use-cases/__tests__/update-facet-scores.use-case.test.ts`
  - [ ] 1.3 Verify no imports remain — grep for `update-facet-scores` and `updateFacetScores` and `shouldTriggerScoring` across the codebase
  - [ ] 1.4 Confirm `apps/api/src/use-cases/index.ts` does NOT reference the file (it already doesn't — verify only)

- [ ] Task 2: Delete `facet-evidence.noop.repository.ts` (AC: #2)
  - [ ] 2.1 Delete `packages/infrastructure/src/repositories/facet-evidence.noop.repository.ts`
  - [ ] 2.2 Remove the `FacetEvidenceNoopRepositoryLive` export from `packages/infrastructure/src/index.ts`
  - [ ] 2.3 Remove the `FacetEvidenceNoopRepositoryLive` export from `packages/infrastructure/src/repositories/index.ts` (if barrel-exported there)
  - [ ] 2.4 Grep for `FacetEvidenceNoopRepositoryLive` and `facet-evidence.noop` — fix or remove any remaining references
  - [ ] 2.5 Check test files that import the noop: `shareable-profile.use-case.test.ts` and `evidence.use-case.test.ts` — these tests should switch to `FacetEvidenceDrizzleRepositoryLive` mock (from `__mocks__/facet-evidence.drizzle.repository.ts`) or remove the noop dependency if the test doesn't actually need `FacetEvidenceRepository` in its layer

- [ ] Task 3: Update `scripts/eval-portrait.ts` to read persisted results (AC: #3)
  - [ ] 3.1 Read the current `scripts/eval-portrait.ts` to understand its full flow
  - [ ] 3.2 Replace `aggregateFacetScores(evidence)` call with a read from `assessment_results` table (the persisted facet/trait scores)
  - [ ] 3.3 Replace `deriveTraitScores(facetScores)` call — trait scores are also persisted in `assessment_results`
  - [ ] 3.4 Verify the script still runs: `pnpm eval:portrait` (or `npx tsx scripts/eval-portrait.ts`)

- [ ] Task 4: Build verification (all ACs)
  - [ ] 4.1 Run `pnpm build` — confirm zero errors
  - [ ] 4.2 Run `pnpm test:run` — confirm all tests pass (some tests that imported deleted files should have been handled in prior tasks)
  - [ ] 4.3 Run `pnpm lint` — confirm no lint errors

## Parallelism

- **Blocked by:** none
- **Blocks:** none
- **Mode:** parallel
- **Domain:** backend scoring / domain utils
- **Shared files:** `packages/infrastructure/src/index.ts` (barrel export removal), `packages/domain/src/index.ts` (potential export cleanup if scoring.ts is deleted in Story 16-2)

## Dev Notes

### Key File Locations

| File | Path | Action |
|---|---|---|
| Dead use-case | `apps/api/src/use-cases/update-facet-scores.use-case.ts` | DELETE |
| Dead use-case test | `apps/api/src/use-cases/__tests__/update-facet-scores.use-case.test.ts` | DELETE |
| Noop repository | `packages/infrastructure/src/repositories/facet-evidence.noop.repository.ts` | DELETE |
| Infrastructure barrel | `packages/infrastructure/src/index.ts` | EDIT (remove noop export) |
| Eval portrait script | `scripts/eval-portrait.ts` | EDIT (read persisted results) |

### Architecture Context

- This codebase uses **hexagonal architecture** with Effect-ts `Context.Tag` for dependency injection
- Repository interfaces live in `packages/domain/src/repositories/`; implementations in `packages/infrastructure/src/repositories/`
- The noop repository was created for Story 9.1 when the `facet_evidence` table was dropped in a clean-slate migration; it was meant to be temporary
- `update-facet-scores.use-case.ts` wraps `scoring.ts` functions but is not wired into any handler — the scoring path now goes through `generate-results.use-case.ts` → `score-computation.ts` → `formula.ts`
- `scoring.ts` itself is NOT deleted in this story — that's Story 16-2 (Delete Legacy Scoring System). This story only removes the dead *use-case* and *noop repository*, plus updates the eval script

### Test Files Impacted

These test files import `FacetEvidenceNoopRepositoryLive` and need updating:
- `apps/api/src/use-cases/__tests__/shareable-profile.use-case.test.ts` — check if it actually needs `FacetEvidenceRepository` in its test layer; if yes, switch to the `__mocks__/facet-evidence.drizzle.repository.ts` mock via `vi.mock()`
- `apps/api/src/use-cases/__tests__/evidence.use-case.test.ts` — same check

### Important: What NOT to Delete

- Do NOT delete `scoring.ts` — that's Story 16-2
- Do NOT delete `packages/domain/src/utils/index.ts` exports of `aggregateFacetScores`/`deriveTraitScores` — that's Story 16-2
- Do NOT modify `formula.ts` — this story is purely cleanup
- Do NOT touch `FacetEvidenceDrizzleRepositoryLive` (the real implementation) — only the noop is deleted

### eval-portrait.ts Migration Approach

The script currently does:
```typescript
import { aggregateFacetScores, deriveTraitScores } from "@workspace/domain";
// ... fetches evidence, then:
const facetScores = aggregateFacetScores(evidence);
const traitScores = deriveTraitScores(facetScores);
```

Replace with reading from `assessment_results` table:
```typescript
// Read persisted results instead of re-computing
const results = await getAssessmentResults(sessionId); // from AssessmentResultRepository
const facetScores = results.facets;
const traitScores = results.traits;
```

The exact implementation depends on the script's Effect-ts setup — it may use a direct Drizzle query since it's a script, not a production use-case.

### Project Structure Notes

- Alignment with unified project structure: all deletions follow the standard hexagonal paths
- No conflicts or variances detected — this is pure deletion + one script update

### References

- [Source: epics-conversation-pipeline.md — Story 1.4: Dead Code Cleanup]
- [Source: architecture-conversation-pipeline.md — Dead code cleanup section]
- [Source: packages/infrastructure/src/repositories/facet-evidence.noop.repository.ts — header comment explaining temporary nature]
- [Source: apps/api/src/use-cases/index.ts — confirms update-facet-scores is not exported]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
