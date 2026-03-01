# Story 16.2: Delete Legacy Scoring System

Status: ready-for-dev

## Story

As a developer maintaining the codebase,
I want the deprecated `scoring.ts` and all its consumers removed,
so that there is a single source of truth for scoring (`formula.ts`).

## Acceptance Criteria

1. **Given** Story 1.1 has migrated all consumers away from `scoring.ts`, **When** the codebase is checked, **Then** `scoring.ts` is deleted along with its tests (`scoring-aggregate.test.ts`, `scoring-derive.test.ts`, `scoring.fixtures.ts`).

2. **Given** `packages/domain/src/utils/index.ts` exports `aggregateFacetScores` and `deriveTraitScores`, **When** the deletion is complete, **Then** these exports are removed from `packages/domain/src/utils/index.ts`.

3. **Given** `packages/domain/src/index.ts` re-exports the above, **When** the deletion is complete, **Then** these re-exports are removed from `packages/domain/src/index.ts`.

4. **Given** `eta` (η=0.3) exists in `FORMULA_DEFAULTS` in `formula.ts` but is never consumed, **When** the cleanup is complete, **Then** `eta` is removed from `FORMULA_DEFAULTS` and `FormulaConfig`.

## Tasks / Subtasks

- [ ] Task 1: Delete `scoring.ts` and its test files (AC: #1)
  - [ ] 1.1: Delete `packages/domain/src/utils/scoring.ts`
  - [ ] 1.2: Delete `packages/domain/src/utils/__tests__/scoring-aggregate.test.ts`
  - [ ] 1.3: Delete `packages/domain/src/utils/__tests__/scoring-derive.test.ts`
  - [ ] 1.4: Delete `packages/domain/src/utils/__tests__/__fixtures__/scoring.fixtures.ts`

- [ ] Task 2: Remove barrel exports (AC: #2, #3)
  - [ ] 2.1: Remove `export { aggregateFacetScores, deriveTraitScores } from "./scoring"` from `packages/domain/src/utils/index.ts`
  - [ ] 2.2: Remove `aggregateFacetScores` and `deriveTraitScores` re-exports from `packages/domain/src/index.ts`

- [ ] Task 3: Remove `eta` from formula config (AC: #4)
  - [ ] 3.1: Remove `readonly eta: number` from `FormulaConfig` interface in `packages/domain/src/utils/formula.ts`
  - [ ] 3.2: Remove `eta: 0.3` from `FORMULA_DEFAULTS` in `packages/domain/src/utils/formula.ts`

- [ ] Task 4: Verify no remaining references
  - [ ] 4.1: Run typecheck to confirm no broken imports
  - [ ] 4.2: Run tests to confirm no test failures
