# Story 3.0: Migrate Tests to Vitest Mock Modules with `__mocks__` Folders

Status: review

## Story

As a developer,
I want test mock implementations extracted into `__mocks__` folders using Vitest's mock module system,
so that mock implementations are reusable, co-located with source, and test files are leaner.

## Acceptance Criteria

1. **AC1**: All test layer factory functions in `apps/api/src/test-utils/test-layers.ts` that create mock repository implementations are extracted into `__mocks__` folders co-located with their source interfaces/implementations.
2. **AC2**: Test files use `vi.mock()` (path-only, no factory) to activate `__mocks__` folder resolution instead of inline `vi.fn()` mock objects in `beforeEach` blocks.
3. **AC3**: The centralized `TestRepositoriesLayer` composition in `test-layers.ts` is preserved (or improved) — it still merges all mock layers into one reusable layer.
4. **AC4**: All existing tests pass without behavioral changes — zero regressions.
5. **AC5**: The `__mocks__` pattern is documented in CLAUDE.md testing section.
6. **AC6**: No changes to production source code — this is purely a test infrastructure refactoring.

## Tasks / Subtasks

- [x] **Task 1: Audit and categorize all mock implementations** (AC: #1)
  - [x] 1.1 Inventory all mock factory functions in `test-layers.ts` (11 factories)
  - [x] 1.2 Identify which mocks belong to `packages/domain/src/repositories/` (interface-level mocks)
  - [x] 1.3 Identify which mocks belong to `packages/infrastructure/src/repositories/` (implementation-level mocks)
  - [x] 1.4 Identify mocks that are app-level concerns (AppConfig, Logger)
  - [x] 1.5 Decide mock placement strategy: interface `__mocks__` vs implementation `__mocks__`

- [x] **Task 2: Create `__mocks__` folder structure** (AC: #1, #2)
  - [x] 2.1 Create `packages/domain/src/repositories/__mocks__/` directory
  - [x] 2.2 Extract `AssessmentSessionRepository` mock → `__mocks__/assessment-session.repository.ts`
  - [x] 2.3 Extract `AssessmentMessageRepository` mock → `__mocks__/assessment-message.repository.ts`
  - [x] 2.4 Extract `LoggerRepository` mock → `__mocks__/logger.repository.ts`
  - [x] 2.5 Extract `CostGuardRepository` mock → `__mocks__/cost-guard.repository.ts`
  - [x] 2.6 Extract `RedisRepository` mock → `__mocks__/redis.repository.ts`
  - [x] 2.7 Extract `NerinAgentRepository` mock → `__mocks__/nerin-agent.repository.ts`
  - [x] 2.8 Extract `AnalyzerRepository` mock → `__mocks__/analyzer.repository.ts`
  - [x] 2.9 Extract `ScorerRepository` mock → `__mocks__/scorer.repository.ts`
  - [x] 2.10 Extract `FacetEvidenceRepository` mock → `__mocks__/facet-evidence.repository.ts`
  - [x] 2.11 Extract `OrchestratorRepository` mock → `__mocks__/orchestrator.repository.ts`
  - [x] 2.12 Extract `AppConfig` mock → `packages/domain/src/config/__mocks__/app-config.ts`

- [x] **Task 3: Refactor `test-layers.ts` to use `__mocks__` imports** (AC: #3)
  - [x] 3.1 Replace inline factory functions with imports from `__mocks__/` files
  - [x] 3.2 Preserve `TestRepositoriesLayer` as `Layer.mergeAll(...)` composition
  - [x] 3.3 Preserve `createTest*Layer()` factory function signatures for backward compatibility
  - [x] 3.4 Ensure each `__mocks__` file exports both the raw mock object AND a `createTest*Layer()` factory

- [x] **Task 4: Update test files that use inline `vi.fn()` mocks** (AC: #2, #4)
  - [x] 4.1 Refactor `start-assessment.use-case.test.ts` — replace `beforeEach` vi.fn() blocks with `__mocks__` imports
  - [x] 4.2 Refactor `send-message.use-case.test.ts` — replace inline mock objects with `__mocks__` imports
  - [x] 4.3 For tests that need per-test mock customization, use `vi.fn().mockReturnValueOnce()` overrides on imported mocks
  - [x] 4.4 Retained `afterEach(() => vi.clearAllMocks())` — still needed to reset shared mock objects between tests

- [x] **Task 5: Run full test suite and verify zero regressions** (AC: #4)
  - [x] 5.1 `pnpm test:run` — 111 tests pass, 1 skipped (9 test files)
  - [x] 5.2 `pnpm lint` — 0 warnings, all 8 lint tasks pass
  - [x] 5.3 `pnpm build` — builds clean (2/2 tasks)

- [x] **Task 6: Update documentation** (AC: #5)
  - [x] 6.1 Update CLAUDE.md Testing section with `__mocks__` pattern and conventions
  - [x] 6.2 Add JSDoc to each `__mocks__` file explaining the pattern

## Dev Notes

### Current State Analysis

The project has **30 test files** across 4 packages with **two distinct mocking approaches**:

**Approach A — Effect DI with centralized test layers (dominant):**
- `apps/api/src/test-utils/test-layers.ts` contains **11 factory functions** creating mock layers
- Tests use `Effect.provide(TestRepositoriesLayer)` for dependency injection
- This is the **correct** Effect-ts idiomatic pattern and should remain the primary DI mechanism

**Approach B — Inline `vi.fn()` mocks in `beforeEach` blocks (secondary):**
- `start-assessment.use-case.test.ts` and `send-message.use-case.test.ts` create mock objects inline
- These use `vi.fn().mockReturnValue(Effect.succeed(...))` patterns
- Mock objects are then wrapped in `Layer.succeed()` per test
- **Problem**: Duplicates mock implementation across test files; harder to maintain

**Current state: Zero `__mocks__` directories, zero `vi.mock()` calls.**

### Target Architecture

```
packages/domain/src/repositories/
├── assessment-session.repository.ts          # Interface (Context.Tag)
├── assessment-message.repository.ts
├── cost-guard.repository.ts
├── ...
└── __mocks__/
    ├── assessment-session.repository.ts      # In-memory mock impl
    ├── assessment-message.repository.ts
    ├── cost-guard.repository.ts
    ├── redis.repository.ts
    ├── nerin-agent.repository.ts
    ├── analyzer.repository.ts
    ├── scorer.repository.ts
    ├── facet-evidence.repository.ts
    ├── orchestrator.repository.ts
    └── logger.repository.ts

apps/api/src/test-utils/
└── test-layers.ts                            # Slim: imports from __mocks__, composes Layer.mergeAll
```

### How Vitest `__mocks__` Works

**Key rules:**
1. `__mocks__` folder must be **sibling** of the file being mocked
2. Mock file must have the **same name** as the source file
3. Call `vi.mock('../path/to/module')` with **no factory function** — Vitest auto-resolves from `__mocks__/`
4. For third-party packages, `__mocks__` goes at **project root** (next to `node_modules`)
5. Modules are **NOT** auto-mocked — you must explicitly call `vi.mock()` per module

**Example pattern for this project:**
```typescript
// packages/domain/src/repositories/__mocks__/assessment-session.repository.ts
import { AssessmentSessionRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const sessions = new Map<string, any>();

export const mockAssessmentSessionRepo = {
  createSession: (userId?: string) => Effect.sync(() => { /* ... */ }),
  getSession: (sessionId: string) => Effect.sync(() => { /* ... */ }),
  updateSession: (sessionId: string, updates: any) => Effect.sync(() => { /* ... */ }),
};

export const createTestAssessmentSessionLayer = () =>
  Layer.succeed(AssessmentSessionRepository, mockAssessmentSessionRepo);
```

### Critical Constraints

**MUST preserve:**
- Effect DI pattern (`Layer.succeed` + `Effect.provide`) — this is the project's core testing architecture
- `TestRepositoriesLayer` as the single merged layer for use-case tests
- `@effect/vitest` `it.effect()` macro usage
- All `biome-ignore` lint suppression comments where `any` types are needed for test flexibility

**MUST NOT:**
- Change any production source code
- Add `automock: true` to vitest config (explicit `vi.mock()` calls only)
- Break the Effect-based test infrastructure
- Remove per-test mock customization capability (some tests override specific mock returns)

### Decision: Mock Placement Strategy

**Option chosen: Co-locate `__mocks__` with repository interfaces in `packages/domain/src/repositories/`**

Rationale:
- Repository interfaces are the **contracts** that tests mock against
- Domain package is already imported by all test files
- Matches hexagonal architecture: mocks implement the **port** (interface), not the **adapter** (implementation)
- `AppConfig` mock goes in `packages/domain/src/config/__mocks__/` (co-located with its interface)
- `LoggerRepository` mock goes in `packages/domain/src/repositories/__mocks__/` (same as other repos)

### Handling Tests That Need Per-Test Customization

Some tests (e.g., `start-assessment.use-case.test.ts`) need different mock behaviors per test:
```typescript
// Test 1: canStartAssessment returns true
mockCostGuard.canStartAssessment.mockReturnValue(Effect.succeed(true));

// Test 2: canStartAssessment returns false (rate limited)
mockCostGuard.canStartAssessment.mockReturnValue(Effect.succeed(false));
```

**Solution**: Each `__mocks__` file exports the mock object with `vi.fn()` wrappers, allowing per-test `.mockReturnValueOnce()` overrides:
```typescript
// In __mocks__/cost-guard.repository.ts
export const mockCostGuardRepo = {
  canStartAssessment: vi.fn().mockReturnValue(Effect.succeed(true)),
  recordAssessmentStart: vi.fn().mockReturnValue(Effect.succeed(undefined)),
  // ...
};

// In test file
import { mockCostGuardRepo } from "@workspace/domain/repositories/__mocks__/cost-guard.repository";
mockCostGuardRepo.canStartAssessment.mockReturnValueOnce(Effect.succeed(false));
```

### Files to Modify

**Create (new):**
- `packages/domain/src/repositories/__mocks__/assessment-session.repository.ts`
- `packages/domain/src/repositories/__mocks__/assessment-message.repository.ts`
- `packages/domain/src/repositories/__mocks__/logger.repository.ts`
- `packages/domain/src/repositories/__mocks__/cost-guard.repository.ts`
- `packages/domain/src/repositories/__mocks__/redis.repository.ts`
- `packages/domain/src/repositories/__mocks__/nerin-agent.repository.ts`
- `packages/domain/src/repositories/__mocks__/analyzer.repository.ts`
- `packages/domain/src/repositories/__mocks__/scorer.repository.ts`
- `packages/domain/src/repositories/__mocks__/facet-evidence.repository.ts`
- `packages/domain/src/repositories/__mocks__/orchestrator.repository.ts`
- `packages/domain/src/config/__mocks__/app-config.ts`

**Modify:**
- `apps/api/src/test-utils/test-layers.ts` — slim down to imports + Layer.mergeAll
- `apps/api/src/use-cases/__tests__/start-assessment.use-case.test.ts` — use __mocks__ imports
- `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` — use __mocks__ imports
- `CLAUDE.md` — add __mocks__ pattern documentation

**Do NOT modify:**
- Any production source files
- Integration test files (`apps/api/tests/integration/`)
- Pure unit test files that don't use mocks (cost-calculator, confidence-calculator, schema tests)

### Project Structure Notes

- Alignment: `__mocks__` folders co-located with interfaces follows hexagonal architecture (mocks = test adapters for ports)
- The domain package (`@workspace/domain`) is the correct home since all repositories are Context.Tag interfaces defined there
- Vitest resolves `__mocks__` relative to the source file path, so `import { AssessmentSessionRepository } from "@workspace/domain"` + `vi.mock()` will resolve correctly with workspace aliases

### Vitest Configuration Notes

Current `vitest.config.ts` has resolve aliases that map `@workspace/domain` → `./packages/domain`. The `__mocks__` folder resolution should work with these aliases since Vitest resolves mocks relative to the resolved file path. If alias resolution causes issues, the alternative is to use explicit relative paths in `vi.mock()` calls.

No changes to `vitest.config.ts` should be needed. Do NOT add `automock: true`.

### References

- [Vitest Mock Modules Documentation](https://vitest.dev/guide/mocking/modules) — Official `__mocks__` folder guide
- [Source: apps/api/src/test-utils/test-layers.ts] — Current centralized mock layer implementation (688 lines)
- [Source: apps/api/src/use-cases/__tests__/start-assessment.use-case.test.ts] — Inline vi.fn() pattern example
- [Source: apps/api/src/use-cases/__tests__/send-message.use-case.test.ts] — Inline vi.fn() pattern example
- [Source: CLAUDE.md#testing] — Current testing documentation
- [Source: docs/ARCHITECTURE.md] — Hexagonal architecture with Context.Tag DI

### Previous Story Intelligence

**Story 2.5 (most recent)** established:
- `createTestCostGuardLayer()` with full rate limiting mock logic
- `createTestAppConfigLayer()` with `AppConfigService` type satisfaction
- Pattern: mock objects wrapped in `Layer.succeed(Tag, implementation)`
- All 111 API tests passing

**Story 2.4** established:
- `createTestOrchestratorLayer()` — the most complex mock (120+ lines with steering logic)
- Pattern: deterministic mock implementations that replicate business logic
- `TestRepositoriesLayer` as the merged composition layer

**Key learning**: Mock implementations in this project are NOT simple stubs — many contain real business logic (e.g., orchestrator steering, cost guard rate limiting). The `__mocks__` files must preserve this logic exactly.

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4

### Completion Notes List
- All 11 mock factories extracted from `test-layers.ts` (688 lines → 80 lines)
- 10 `__mocks__` files in `packages/domain/src/repositories/__mocks__/`
- 1 `__mocks__` file in `packages/domain/src/config/__mocks__/`
- `test-layers.ts` reduced to imports + `Layer.mergeAll` + re-exports
- Both `start-assessment.use-case.test.ts` and `send-message.use-case.test.ts` refactored to import from `__mocks__` files
- `afterEach(() => vi.clearAllMocks())` retained in test files — still needed since mock objects are shared module-level singletons
- Added `./config/*` export to `packages/domain/package.json` to support `__mocks__` path resolution
- All 111 tests pass, 0 lint warnings, build clean
- CLAUDE.md updated with `__mocks__` pattern documentation

### File List

**Created (11 mock files):**
- `packages/domain/src/repositories/__mocks__/assessment-session.repository.ts`
- `packages/domain/src/repositories/__mocks__/assessment-message.repository.ts`
- `packages/domain/src/repositories/__mocks__/logger.repository.ts`
- `packages/domain/src/repositories/__mocks__/cost-guard.repository.ts`
- `packages/domain/src/repositories/__mocks__/redis.repository.ts`
- `packages/domain/src/repositories/__mocks__/nerin-agent.repository.ts`
- `packages/domain/src/repositories/__mocks__/analyzer.repository.ts`
- `packages/domain/src/repositories/__mocks__/scorer.repository.ts`
- `packages/domain/src/repositories/__mocks__/facet-evidence.repository.ts`
- `packages/domain/src/repositories/__mocks__/orchestrator.repository.ts`
- `packages/domain/src/config/__mocks__/app-config.ts`

**Modified (4 files):**
- `apps/api/src/test-utils/test-layers.ts` — Slimmed to imports + Layer.mergeAll composition
- `apps/api/src/use-cases/__tests__/start-assessment.use-case.test.ts` — Uses `__mocks__` imports
- `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` — Uses `__mocks__` imports
- `CLAUDE.md` — Added `__mocks__` pattern documentation to Testing section

**Infrastructure (1 file):**
- `packages/domain/package.json` — Added `./config/*` export for `__mocks__` path resolution
