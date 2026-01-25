# Story 7.1: Unit Testing Framework Setup & TDD Pattern

**Status:** ready-for-dev

**Epic:** 7 - Testing & Quality Assurance

**Story ID:** 7.1

---

## Story

As a **Developer**,
I want **to set up Vitest with Test-Driven Development (TDD) workflow for backend features**,
So that **all domain logic, RPC contracts, and backend services are built with comprehensive test coverage**.

---

## Acceptance Criteria

### Core Framework Setup
1. **Given** Vitest is configured across the monorepo
   **When** I run `pnpm test`
   **Then** all unit tests execute successfully
   **And** tests complete in <2 seconds total (excluding test discovery)
   **And** I can run `pnpm test --ui` for interactive test browser
   **And** coverage reports are generated automatically

2. **Given** a test file exists (`*.test.ts`)
   **When** tests run
   **Then** coverage reports show results for domain logic, contracts, and infrastructure
   **And** coverage threshold enforcement prevents commits if <100% for domain logic

### TDD Workflow
3. **Given** I'm implementing a backend feature (e.g., OCEAN code generation, session management)
   **When** I follow TDD red-green-refactor cycle
   **Then** I write failing test first (red phase) that defines expected behavior
   **And** test uses clear assertions (Vitest `expect()` API)
   **And** I implement code to pass the test (green phase)
   **And** I refactor for clarity while keeping all tests green (refactor phase)

4. **Given** a backend feature story requires testing
   **When** the story is implemented
   **Then** unit tests exist covering all major code paths
   **And** domain logic has ≥100% test coverage
   **And** RPC contracts have ≥90% test coverage
   **And** test results are visible in CI (GitHub Actions or equivalent)

### Test Infrastructure & Utilities
5. **Given** I'm writing tests for domain features
   **When** I need to mock external dependencies
   **Then** test utilities are available for common patterns:
   - Mock Anthropic API responses (deterministic testing)
   - Mock database queries (without spinning up PostgreSQL)
   - Mock Effect services (dependency injection)
   - Mock Redis (cost tracking)

6. **Given** I need to test archetype descriptions or similar static data
   **When** I write snapshot tests
   **Then** snapshot testing infrastructure works with Vitest
   **And** snapshots are tracked in git (`*.snap` files)

### CI/CD Integration
7. **Given** code is pushed to a feature branch
   **When** GitHub Actions runs
   **Then** `pnpm test` executes automatically
   **And** tests must pass before PR can be merged
   **And** coverage reports are posted as PR comments
   **And** failed tests block merge (enforced via branch protection rules)

---

## Tasks / Subtasks

### Task 1: Install & Configure Vitest
- [ ] Add `vitest`, `@vitest/ui`, `vitest-coverage-c8` to root `package.json`
- [ ] Create `vitest.config.ts` with:
  - ESM configuration (ESM-native Vitest)
  - Coverage thresholds: 100% for `packages/domain/**`, 90% for `packages/contracts/**`
  - Include patterns: `src/**/*.test.ts`
  - Exclude patterns: `node_modules`, `dist`
  - Coverage reporter: `text`, `html`, `json` formats
- [ ] Add npm scripts to root `package.json`:
  - `pnpm test` → `vitest run` (CI mode, exit on completion)
  - `pnpm test:watch` → `vitest` (watch mode for development)
  - `pnpm test:ui` → `vitest --ui` (interactive browser)
  - `pnpm test:coverage` → `vitest run --coverage` (generate coverage reports)
- [ ] Verify Vitest runs with `pnpm test`

### Task 2: Configure Packages for Testing
- [ ] Update `packages/domain/package.json`:
  - Add `vitest` to `devDependencies` (if not inherited from root)
  - Create `tsconfig.test.json` with Vitest-compatible settings (if needed)
- [ ] Update `packages/contracts/package.json`:
  - Add `vitest` to `devDependencies`
- [ ] Update `packages/infrastructure/package.json`:
  - Add `vitest` to `devDependencies`
- [ ] Update `packages/database/package.json`:
  - Add `vitest` to `devDependencies`
- [ ] Create `packages/domain/src/__tests__` directory structure (optional but recommended)

### Task 3: Create Test Utilities & Mocks
- [ ] Create `packages/domain/src/__tests__/mocks/anthropic-api.mock.ts`:
  - Mock Anthropic API `chat.completions.create()` response
  - Support streaming and non-streaming modes
  - Allow configurable token counts for cost testing
  - Example: `mockAnthropic.setResponse("Hello, I'm Nerin...")`

- [ ] Create `packages/domain/src/__tests__/mocks/database.mock.ts`:
  - Mock Drizzle ORM query builder
  - Support in-memory data storage for session/message tests
  - Example: `mockDb.sessions.create({ id, userId })`

- [ ] Create `packages/domain/src/__tests__/mocks/redis.mock.ts`:
  - Mock Redis for cost tracking tests
  - Support `get`, `set`, `incr` operations
  - Example: `mockRedis.set("cost:user-1:2026-01-30", "1500")`

- [ ] Create `packages/domain/src/__tests__/mocks/effect-services.mock.ts`:
  - Mock Effect Layer for dependency injection
  - Allow tests to inject mock services without framework overhead
  - Example: `mockEffectService("Logger", mockLogger)`

- [ ] Create `packages/domain/src/__tests__/helpers/test-fixtures.ts`:
  - Reusable test data (sample messages, sessions, precision scores)
  - Factory functions for creating test data
  - Example: `createTestSession({ userId, messageCount: 5 })`

### Task 4: Write Sample TDD Tests
- [ ] Create `packages/domain/src/__tests__/ocean-code-generator.test.ts`:
  - Test 1: Facet means calculated correctly
  - Test 2: Boundary conditions (0, 6.67, 13.33, 20)
  - Test 3: All 243 trait level combinations map correctly
  - Test 4: Determinism (same input → same output)
  - Test 5: Code is exactly 5 letters
  - Demonstrates red → green → refactor cycle

- [ ] Create `packages/domain/src/__tests__/cost-guard.test.ts`:
  - Test 1: Cost calculation formula accurate
  - Test 2: Daily accumulation in Redis
  - Test 3: Rate limit enforced (1 assessment/user/day)
  - Test 4: Hard cap at $75/day
  - Test 5: Graceful error messages

- [ ] Create `packages/domain/src/__tests__/session-manager.test.ts`:
  - Test 1: Session creation with unique ID
  - Test 2: Messages persisted correctly
  - Test 3: Precision scores saved and restored
  - Test 4: Session resume loads full history
  - Test 5: Conversation state accurate after resume

### Task 5: CI/CD Integration
- [ ] Create `.github/workflows/test.yml` (if not exists):
  - Trigger on: PR to main, push to main
  - Steps:
    1. Checkout code
    2. Setup Node.js (v20+)
    3. Install pnpm
    4. Run `pnpm install`
    5. Run `pnpm test --coverage`
    6. Upload coverage reports to CodeCov or similar (optional)
    7. Post coverage as PR comment (optional)
  - Fail if tests fail or coverage thresholds unmet

- [ ] Configure branch protection rule:
  - Require tests to pass before merge
  - Require status check from GitHub Actions test workflow
  - Dismiss stale PR approvals when new commits are pushed

### Task 6: Documentation & Team Onboarding
- [ ] Create `docs/testing-guide.md`:
  - Overview of TDD workflow
  - Step-by-step guide: red → green → refactor
  - Example: Writing a test for new feature
  - Running tests locally: `pnpm test`, `pnpm test:watch`, `pnpm test:ui`
  - Coverage reports: `pnpm test:coverage` (opens HTML report)
  - Debugging tips: Vitest debug flag, VSCode integration

- [ ] Update `README.md` (root):
  - Add "Testing" section with quick start commands
  - Link to testing guide

- [ ] Add inline code comments:
  - Add JSDoc comments to test helpers explaining usage
  - Example: `/**  createTestSession creates a realistic session for testing */`

---

## Dev Notes

### Architectural Patterns
- **Monorepo Testing:** Vitest can test multiple packages; use glob patterns in `vitest.config.ts` to target specific packages
- **TDD Workflow:** Core to this story — developers write failing test first, then implement code to pass test
- **Mock Strategy:** Avoid spinning up real dependencies (Anthropic API, PostgreSQL, Redis) — use mocks for unit tests, leave integration tests for Story 7.2
- **Coverage Thresholds:** 100% for domain logic is strict but essential for core business logic (OCEAN scoring, cost calculations)

### Project Structure Notes
This story primarily touches:
- **Root `package.json` & `vitest.config.ts`** — central test configuration
- **`packages/domain/`** — domain logic tests (highest coverage priority)
- **`packages/contracts/`** — RPC contract tests (90% coverage)
- **`packages/infrastructure/`** — utility tests as needed
- **`.github/workflows/test.yml`** — CI/CD integration
- **`docs/testing-guide.md`** — team documentation

No changes to frontend (`apps/front`) or API (`apps/api`) in this story; test setup is infrastructure-level.

### Dependencies & Versions
- **Vitest:** Latest stable (v1.x) — ESM-native, Effect-ts friendly
- **@vitest/ui:** Interactive browser for test debugging
- **vitest-coverage-c8:** Coverage reporter compatible with Vitest
- **Node.js:** ≥20 (as per CLAUDE.md requirement)
- **TypeScript:** 5.7+ (existing in project)

### Success Criteria Clarification
- Tests must run quickly (<2 sec) — mocks essential, no real I/O
- Coverage reports must be machine-parseable (JSON format) for CI integration
- Sample tests should demonstrate TDD pattern clearly for team to follow
- CI/CD integration must prevent merging of failing tests or coverage regressions

### Known Constraints
- **Vitest ESM requirement:** Ensure all test files use ESM imports/exports (not CommonJS)
- **Effect-ts testing:** May require `Effect.runPromise()` or `Effect.runSync()` for synchronous tests
- **Mocking Anthropic API:** Must support both streaming and non-streaming modes for realistic testing

### Architecture Compliance
Per [CLAUDE.md Architecture Guidelines](../../CLAUDE.md#domain-driven-design) and [Architecture ADRs](../../_bmad-output/planning-artifacts/architecture.md):
- All domain logic (scoring, code generation, cost calculations) must have 100% coverage
- RPC contracts must be validated against schema at test time
- Error handling must be tested (tagged Error types, not exceptions)
- No changes to production code structure; testing is isolated in `__tests__` folders

### Files Involved
- `packages/domain/src/**/*.test.ts` — domain logic tests
- `packages/contracts/src/**/*.test.ts` — RPC contract tests
- `packages/infrastructure/src/**/*.test.ts` — utility tests
- `vitest.config.ts` (root) — central configuration
- `.github/workflows/test.yml` — CI/CD workflow
- `docs/testing-guide.md` — team guide

---

## Story Completion Status

**Status:** ready-for-dev

**Context Engine Analysis:** ✅ Complete
- Epic context loaded from `epics.md`
- Architecture patterns identified from `architecture.md`
- PRD cost constraints integrated
- No previous story (first in testing epic) — starting fresh
- Git history reviewed (initial commit, no test patterns yet)

**Developer Readiness:** ✅ Ready
- All acceptance criteria clearly defined (7 criteria with sub-checklist)
- 6 major tasks broken into specific subtasks
- Mock infrastructure utilities specified
- CI/CD integration documented
- Team onboarding documentation required

**Next Steps for Developer:**
1. Set up Vitest configuration
2. Create mock utilities
3. Write sample TDD tests demonstrating red → green → refactor
4. Integrate CI/CD
5. Write team documentation
6. Mark story done when tests pass in CI

---

## References & Source Documentation

- **Epic Source:** [big-ocean Epics Document - Story 7.1](../../_bmad-output/planning-artifacts/epics.md#story-71-unit-testing-framework-setup--tdd-pattern)
- **Architecture Decisions:** [Architecture ADR-2: LLM Cost Control](../../_bmad-output/planning-artifacts/architecture.md#adr-2-llm-cost-control-architecture--active) — cost testing requirements
- **Project Guidelines:** [CLAUDE.md - Testing Strategy](../../CLAUDE.md#testing-strategy)
- **Related Stories:** None (foundational); enables Stories 2.x onwards for TDD pattern
- **Tech Stack Reference:** Vitest, Effect-ts, @anthropic-ai/sdk, Drizzle ORM

---

## Dev Agent Record

### Agent Model Used
Claude Haiku 4.5 (claude-haiku-4-5-20251001)

### Generated With
BMad Create Story Workflow - Ultimate Story Context Engine

### Key Context Integrated
- Monorepo structure (Turbo + pnpm workspaces)
- Effect-ts functional error handling patterns
- LLM cost monitoring requirements (Story 2.5 dependency)
- TDD as core team pattern (required for all subsequent backend stories)
- CI/CD integration for branch protection

### File List
- `_bmad-output/implementation-artifacts/7-1-unit-testing-framework-setup-tdd-pattern.md` — this file
- Related files to review: `vitest.config.ts` (to be created), `.github/workflows/test.yml` (to be created)
