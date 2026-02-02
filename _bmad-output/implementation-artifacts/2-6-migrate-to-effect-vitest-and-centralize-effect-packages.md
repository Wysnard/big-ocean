# Story 2.6: Migrate to @effect/vitest and Centralize Effect Packages

Status: ready-for-dev

## Story

As a **Backend Developer**,
I want **to migrate our test suite to @effect/vitest and centralize all Effect package versions in the workspace catalog**,
So that **tests are cleaner with `it.effect`/`it.layer` patterns and dependency versions are consistently managed across the monorepo**.

## Acceptance Criteria

1. **Effect/Vitest Integration**: All Effect-based tests use `@effect/vitest` patterns (`it.effect`, `it.layer`, `describe.concurrent`) instead of manual `Effect.runPromise` wrapping
2. **Centralized Package Versions**: All Effect-related packages are defined in `pnpm-workspace.yaml` catalog and referenced as `catalog:` in individual package.json files
3. **No Version Duplication**: No Effect package versions are hardcoded in any package.json - all use `catalog:` reference
4. **Existing Tests Pass**: All existing tests continue to pass after migration with identical behavior
5. **Documentation**: CLAUDE.md updated with new testing patterns if needed
6. **Tests**: Unit tests demonstrate new `@effect/vitest` patterns; refactor existing tests to new pattern
7. **Use-Case Coverage**: All use-cases in `apps/api/src/use-cases/` have corresponding test files with comprehensive coverage

## Tasks / Subtasks

- [ ] Task 1: Add @effect/vitest to catalog and root package.json (AC: #2, #3)
  - [ ] Add `@effect/vitest` to `pnpm-workspace.yaml` catalog with compatible version
  - [ ] Add `@effect/vitest` as devDependency at root package.json using `catalog:`
  - [ ] Run `pnpm install` to verify resolution

- [ ] Task 2: Audit and centralize all Effect packages (AC: #2, #3)
  - [ ] Audit all package.json files for Effect-related dependencies
  - [ ] Ensure all Effect packages are in `pnpm-workspace.yaml` catalog:
    - `effect`
    - `@effect/platform`
    - `@effect/platform-node`
    - `@effect/rpc`
    - `@effect/schema`
    - `@effect/sql`
    - `@effect/sql-pg`
    - `@effect/cluster`
    - `@effect/experimental`
    - `@effect/vitest` (new)
  - [ ] Update all package.json files to use `catalog:` references
  - [ ] Remove any duplicate/hardcoded versions from individual packages
  - [ ] Run `pnpm install` to verify all resolutions

- [ ] Task 3: Configure vitest for @effect/vitest (AC: #1)
  - [ ] Update `vitest.config.ts` if needed for @effect/vitest compatibility
  - [ ] Update `vitest.setup.ts` if needed for Effect test utilities
  - [ ] Verify configuration works with `pnpm test:run`

- [ ] Task 4: Migrate existing Effect tests to new patterns (AC: #1, #4)
  - [ ] Migrate `apps/api/src/use-cases/__tests__/start-assessment.use-case.test.ts`
  - [ ] Migrate `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts`
  - [ ] Migrate `apps/api/src/use-cases/__tests__/send-message-precision.use-case.test.ts`
  - [ ] Migrate `packages/domain/src/__tests__/effect-patterns.test.ts`
  - [ ] Migrate `packages/domain/src/__tests__/schema-validation.test.ts`
  - [ ] Migrate `packages/domain/src/services/__tests__/precision-calculator.service.test.ts`
  - [ ] Migrate `packages/contracts/src/__tests__/http-contracts.test.ts`

- [ ] Task 5: Ensure all use-cases have comprehensive test coverage (AC: #6, #7)
  - [ ] `start-assessment.use-case.ts` - Has tests ✓, migrate to @effect/vitest
  - [ ] `send-message.use-case.ts` - Has tests ✓, migrate to @effect/vitest
  - [ ] `resume-session.use-case.ts` - **MISSING TESTS** - Create new tests with @effect/vitest
  - [ ] `get-results.use-case.ts` - **MISSING TESTS** - Create new tests with @effect/vitest

- [ ] Task 6: Verification and Documentation (AC: #4, #5, #7)
  - [ ] Run full test suite: `pnpm test:run`
  - [ ] Run test coverage: `pnpm test:coverage`
  - [ ] Verify all use-cases have test coverage (no gaps)
  - [ ] Verify CI pipeline passes (GitHub Actions)
  - [ ] Update CLAUDE.md with new testing patterns if significant changes
  - [ ] Update story file with completion notes

## Dev Notes

### Current Test Pattern (Before)

```typescript
import { Effect, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";

describe("Use Case", () => {
  it("should do something", async () => {
    const testLayer = Layer.mergeAll(
      Layer.succeed(SomeRepository, mockRepo),
      Layer.succeed(LoggerRepository, mockLogger),
    );

    const result = await Effect.runPromise(
      myEffect(input).pipe(Effect.provide(testLayer)),
    );

    expect(result).toBe(expected);
  });
});
```

### Target Test Pattern (After)

```typescript
import { Effect, Layer } from "effect";
import { describe, expect, it } from "@effect/vitest";

// Layer for tests
const TestLayer = Layer.mergeAll(
  Layer.succeed(SomeRepository, mockRepo),
  Layer.succeed(LoggerRepository, mockLogger),
);

describe("Use Case", () => {
  // Simple effect test - auto-runs Effect.runPromise
  it.effect("should do something with effect", () =>
    Effect.gen(function* () {
      const result = yield* myEffect(input);
      expect(result).toBe(expected);
    }),
  );

  // Layer-provided test - auto-provides the layer
  it.layer(TestLayer)("should do something with layer", () =>
    Effect.gen(function* () {
      const result = yield* myEffect(input);
      expect(result).toBe(expected);
    }),
  );
});
```

### Key Benefits

1. **Less Boilerplate**: No manual `Effect.runPromise` or `.pipe(Effect.provide(...))`
2. **Better Error Messages**: @effect/vitest integrates with Effect's error system
3. **Concurrent Tests**: `describe.concurrent` for parallel Effect test execution
4. **Scoped Resources**: `it.scoped` for tests with resource lifecycle
5. **Live Tests**: `it.live` for tests requiring real time/random

### Migration Checklist Per Test File

For each test file being migrated, apply these changes:

- [ ] Replace `import { ... } from "vitest"` with `import { describe, expect, it } from "@effect/vitest"`
- [ ] Remove `vi` import and all `vi.fn()` usage
- [ ] Remove `beforeEach`/`afterEach` hooks (use Layer-based isolation instead)
- [ ] Create `Layer.sync()` test implementations for repositories
- [ ] Replace `it("...", async () => ...)` with `it.effect("...", () => Effect.gen(...))`
- [ ] Remove manual `Effect.runPromise()` calls
- [ ] Remove repeated `testLayer` creation inside each test (define once, reuse)
- [ ] Replace `rejects.toThrow()` with `Effect.either` or `it.effect.fails()`
- [ ] Remove `any` type annotations and biome-ignore comments
- [ ] Use in-memory Maps within Layer.sync() for tracking service interactions

### Use-Case Test Coverage Matrix

| Use-Case                             | Test File Exists  | Migration Status               |
| ------------------------------------ | ----------------- | ------------------------------ |
| `start-assessment.use-case.ts`       | ✅ Yes            | Migrate to @effect/vitest      |
| `send-message.use-case.ts`           | ✅ Yes            | Migrate to @effect/vitest      |
| `send-message-precision.use-case.ts` | ✅ Yes (separate) | Migrate to @effect/vitest      |
| `resume-session.use-case.ts`         | ❌ **Missing**    | Create new with @effect/vitest |
| `get-results.use-case.ts`            | ❌ **Missing**    | Create new with @effect/vitest |

### Packages to Centralize in Catalog

Current scattered packages found in individual package.json files:

| Package                 | Current Location                 | Action                    |
| ----------------------- | -------------------------------- | ------------------------- |
| `effect`                | catalog (some), hardcoded (some) | Ensure all use `catalog:` |
| `@effect/platform`      | catalog                          | Keep in catalog           |
| `@effect/platform-node` | catalog                          | Keep in catalog           |
| `@effect/rpc`           | catalog                          | Keep in catalog           |
| `@effect/schema`        | catalog                          | Keep in catalog           |
| `@effect/sql`           | root hardcoded `^0.49.0`         | Move to catalog           |
| `@effect/sql-pg`        | root hardcoded `^0.50.1`         | Move to catalog           |
| `@effect/cluster`       | catalog                          | Keep in catalog           |
| `@effect/experimental`  | catalog                          | Keep in catalog           |
| `@effect/vitest`        | **NEW**                          | Add to catalog            |

### Project Structure Notes

- Root `vitest.config.ts` already configured for monorepo
- Root `vitest.setup.ts` exists for universal setup
- Tests run from root via `pnpm test:run`
- Turbo build/test orchestration in place

### References

- [Effect Solutions Testing Guide](https://www.effect.solutions/testing#next-steps) - Comprehensive @effect/vitest patterns and best practices
- [Effect-ts Testing Guide](https://effect.website/docs/guides/testing/introduction/)
- [@effect/vitest Package](https://www.npmjs.com/package/@effect/vitest)
- [Source: _bmad-output/planning-artifacts/research/technical-langgraph-effect-ts-monorepo-frontend-research-2026-02-01.md] - Previous research on @effect/vitest patterns

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

**Package Configuration:**

- `pnpm-workspace.yaml` - Add @effect/vitest to catalog, verify all Effect packages
- `package.json` (root) - Add @effect/vitest devDependency, centralize any hardcoded versions
- `apps/api/package.json` - Convert any hardcoded Effect versions to catalog:
- `packages/domain/package.json` - Convert any hardcoded Effect versions to catalog:
- `packages/contracts/package.json` - Convert any hardcoded Effect versions to catalog:
- `packages/infrastructure/package.json` - Convert any hardcoded Effect versions to catalog:

**Vitest Configuration:**

- `vitest.config.ts` - Potential updates for @effect/vitest
- `vitest.setup.ts` - Potential updates for Effect test utilities

**Existing Tests to Migrate:**

- `apps/api/src/use-cases/__tests__/start-assessment.use-case.test.ts` - Migrate
- `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` - Migrate
- `apps/api/src/use-cases/__tests__/send-message-precision.use-case.test.ts` - Migrate
- `packages/domain/src/__tests__/*.test.ts` - Migrate
- `packages/domain/src/services/__tests__/*.test.ts` - Migrate
- `packages/contracts/src/__tests__/*.test.ts` - Migrate

**New Tests to Create:**

- `apps/api/src/use-cases/__tests__/resume-session.use-case.test.ts` - **CREATE NEW**
- `apps/api/src/use-cases/__tests__/get-results.use-case.test.ts` - **CREATE NEW**
