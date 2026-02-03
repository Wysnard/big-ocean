# Story 2.8: Docker Setup for Integration Testing

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Backend Developer**,
I want **integration tests that validate HTTP endpoints in a production-like Docker environment**,
So that **I can catch deployment failures locally before pushing to Railway and ensure "works local = works deployed" confidence**.

## Acceptance Criteria

### Core Requirements (Must Have)

1. **Docker Compose Test Environment** - Production-mirroring services for integration testing
   - `compose.test.yaml` file created with `postgres-test` and `api-test` services
   - PostgreSQL 16 on port 5433 (avoids conflict with dev postgres on 5432)
   - API service built from production Dockerfile (`apps/api/Dockerfile`) on container port 4000, exposed to host on port 4001 (avoids conflict with dev API on host port 4000)
   - Health checks ensure services ready before tests run
   - Modern Compose spec (no deprecated `version` field, long-form `depends_on`)
   - All services run in isolated network (`bigocean-test-network`)
   - Test database initialized via `docker/init-db-test.sql` with complete schema (auth + assessment + scoring tables)

2. **Vitest Integration Configuration** - Native vitest infrastructure management
   - `vitest.config.integration.ts` configured for integration test suite
   - Global setup script (`scripts/integration-setup.ts`) starts Docker Compose before tests
   - Global teardown script (`scripts/integration-teardown.ts`) stops and cleans up containers
   - Environment variables configured (API_URL=http://localhost:4000, DATABASE_URL for postgres-test)
   - Tests run on HOST (not in container) to enable full vitest ecosystem (watch mode, UI, debugging)

3. **LLM Mocking Strategy** - Zero-cost integration testing with mock AI responses
   - `NerinAgentMockRepositoryLive` Layer created with pattern-based responses
   - Effect Layer swapping via `MOCK_LLM=true` environment variable in API
   - API automatically uses mock in integration tests, real Claude in production
   - Mock responses cover common conversation patterns (organization, creativity, social scenarios)
   - No Anthropic API costs during integration test runs

4. **Integration Tests for Core Endpoints** - Validate production-like behavior
   - Health check tests (2 tests): `GET /health` returns 200 with `{status: "ok"}` and validates Docker setup
   - Assessment start tests (3 tests): `POST /api/assessment/start` creates session and returns valid schema
   - Assessment message tests (4 tests): `POST /api/assessment/message` processes message and returns response
   - Assessment resume tests (2 tests): `GET /api/assessment/:sessionId/resume` retrieves session history
   - Total: 11 integration tests covering 4 endpoints
   - All tests validate response schemas using Effect Schema (contract enforcement)
   - Database persistence verified (session exists, messages saved)
   - Tests use real HTTP requests (`fetch`) against Dockerized API

5. **Working Test Commands** - Developer-friendly scripts
   - `pnpm test:integration` runs all integration tests (starts Docker → runs tests → stops Docker)
   - `pnpm test:integration:watch` enables watch mode for rapid iteration
   - `pnpm docker:test:up` starts test environment manually (for debugging)
   - `pnpm docker:test:down` stops and cleans test environment
   - All tests pass consistently without flakiness

6. **Documentation**: All new configuration files have clear inline comments explaining purpose
   - `compose.test.yaml` documented with service purposes and health check rationale
   - Integration test README created in `apps/api/tests/integration/README.md`
   - CLAUDE.md updated with integration testing patterns

7. **Tests**: Integration tests themselves validate the integration testing infrastructure
   - All 3 endpoint tests pass (health, start assessment, send message)
   - Tests verify Docker build succeeds
   - Tests verify database migrations run correctly
   - Tests verify HTTP contract compliance

## Tasks / Subtasks

- [x] Task 1: Docker Compose Test Environment (AC: #1)
  - [x] Create `compose.test.yaml` with postgres-test service (port 5433)
  - [x] Add api-test service built from production Dockerfile
  - [x] Configure health checks for both services
  - [x] Add `MOCK_LLM=true` environment variable to api-test
  - [x] Create isolated test network
  - [x] Create `docker/init-db-test.sql` for test database initialization
  - [x] Test manual startup: `docker compose -f compose.test.yaml up`

- [x] Task 2: Vitest Configuration (AC: #2)
  - [x] Create `vitest.config.integration.ts` extending base config
  - [x] Implement `scripts/integration-setup.ts` (Docker Compose up + health wait)
  - [x] Implement `scripts/integration-teardown.ts` (Docker Compose down -v)
  - [x] Add package.json scripts for test:integration commands
  - [x] Test: `pnpm test:integration` should start/stop Docker automatically

- [x] Task 3: LLM Mocking (AC: #3)
  - [x] Create `packages/infrastructure/src/repositories/nerin-agent.mock.repository.ts`
  - [x] Implement pattern-based mock responses (10 common patterns)
  - [x] Add Layer export: `NerinAgentMockRepositoryLive`
  - [x] Wire `MOCK_LLM` env var check in API server initialization
  - [x] Add Layer swapping logic (mock when MOCK_LLM=true, real otherwise)
  - [x] Test: API uses mock responses when env var set

- [x] Task 4: Integration Tests (AC: #4)
  - [x] Create `apps/api/tests/integration/` directory
  - [x] Write `health.test.ts` (2 tests - validates /health endpoint + Docker setup)
  - [x] Write `assessment.test.ts` (9 tests - start, message, resume endpoints)
  - [x] Add Effect Schema validation in all tests
  - [x] Verify database persistence in tests
  - [x] Test: All 11 integration tests pass with `pnpm test:integration`

- [x] Documentation & Testing (AC: #6-7) — **REQUIRED BEFORE DONE**
  - [x] Add inline comments to compose.test.yaml
  - [x] Create `apps/api/tests/integration/README.md` with usage guide
  - [x] Update CLAUDE.md with integration testing section
  - [x] Update story file with completion notes
  - [x] Verify all 11 integration tests pass consistently

- [ ] Task 5: CI/CD Integration (Future Enhancement)
  - [ ] Add integration tests to GitHub Actions CI pipeline
  - [ ] Configure Docker-in-Docker for CI environment
  - [ ] Set `MOCK_LLM=true` in CI workflow
  - [ ] Add integration test step after unit tests
  - [ ] Ensure test artifacts uploaded on failure

## Dev Notes

### 🔥 CRITICAL CONTEXT FOR DEVELOPER AGENT

**Story Purpose:** This story creates a **Tier 2 integration testing layer** that validates the complete HTTP stack (Docker build + PostgreSQL + API endpoints) BEFORE deployment to Railway. This prevents "works on my machine" failures.

**Key Anti-Patterns to Avoid:**
1. ❌ **DON'T** create integration tests that call use-cases directly - they must use HTTP fetch() against real Docker containers
2. ❌ **DON'T** reuse development docker compose (compose.yaml) - create separate compose.test.yaml to avoid port conflicts
3. ❌ **DON'T** put tests inside Docker container - run on HOST to enable vitest watch mode, UI, and debugging
4. ❌ **DON'T** use real Anthropic API - MUST use mock Layer to avoid costs (MOCK_LLM=true)
5. ❌ **DON'T** skip health checks - tests will be flaky without proper service readiness validation

**Success Criteria:**
- ✅ Developer runs `pnpm test:integration` → Docker starts → tests pass → Docker stops (all automatic)
- ✅ Tests validate actual HTTP responses match @workspace/contracts schemas
- ✅ Zero Anthropic API costs (mocked via Effect Layers)
- ✅ Can run `pnpm test:integration:watch` for rapid test-driven development

### Architecture Patterns

**Hexagonal Architecture Compliance:**
- Integration tests sit OUTSIDE the hexagon (validate complete system behavior)
- Tests use real HTTP endpoints (not internal use-case calls)
- Mock LLM via Layer swapping (infrastructure layer concern)
- Tests verify contracts (Effect Schema validation at boundary)

**Effect-ts Integration:**
- Layer swapping: `MOCK_LLM ? NerinAgentMockRepositoryLive : NerinAgentClaudeRepositoryLive`
- Schema validation: `Schema.decodeUnknownSync(ContractSchema)(apiResponse)`
- Pattern follows existing TestRepositoriesLayer approach from unit tests

**Testing Strategy (Decision 5):**
- **Tier 1: Unit Tests** - Use-cases with mock repos (already implemented)
- **Tier 2: Integration Tests** - THIS STORY - HTTP + DB + Docker (production parity)
- **Tier 3: Real LLM Tests** - Deferred (too expensive for frequent runs)

### Source Code Components

**Files to Create:**
1. `compose.test.yaml` - Test environment Docker Compose config
2. `apps/api/vitest.config.integration.ts` - Integration test configuration
3. `apps/api/scripts/integration-setup.ts` - Global setup (Docker up)
4. `apps/api/scripts/integration-teardown.ts` - Global teardown (Docker down)
5. `apps/api/tests/integration/README.md` - Integration testing guide
6. `apps/api/tests/integration/health.test.ts` - Health endpoint test
7. `apps/api/tests/integration/assessment.test.ts` - Assessment endpoints tests
8. `packages/infrastructure/src/repositories/nerin-agent.mock.repository.ts` - Mock LLM

**Files to Modify:**
1. `package.json` - Add test:integration scripts
2. `apps/api/src/index.ts` - Add MOCK_LLM Layer swapping logic
3. `CLAUDE.md` - Document integration testing patterns

### Testing Standards

**Integration Test Pattern:**
```typescript
// apps/api/tests/integration/assessment.test.ts
import { describe, test, expect } from 'vitest'
import { Schema } from 'effect'
import { StartAssessmentResponseSchema } from '@workspace/contracts'

const API_URL = process.env.API_URL || 'http://localhost:4000'

describe('POST /api/assessment/start', () => {
  test('creates session with valid response schema', async () => {
    const response = await fetch(`${API_URL}/api/assessment/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test-user' })
    })

    expect(response.status).toBe(200)
    const data = await response.json()

    // Validate with Effect Schema (contract enforcement)
    const decoded = Schema.decodeUnknownSync(StartAssessmentResponseSchema)(data)
    expect(decoded.sessionId).toMatch(/^session_/)
  })
})
```

**Mock LLM Pattern:**
```typescript
// packages/infrastructure/src/repositories/nerin-agent.mock.repository.ts
import { Layer, Effect } from 'effect'
import { NerinAgentRepository } from '@workspace/domain'

export const NerinAgentMockRepositoryLive = Layer.succeed(
  NerinAgentRepository,
  NerinAgentRepository.of({
    sendMessage: (sessionId, message, context) =>
      Effect.succeed({
        response: generateMockResponse(message).text,
        reasoning: generateMockResponse(message).reasoning
      })
  })
)

function generateMockResponse(message: string) {
  if (message.toLowerCase().includes("organize")) {
    return {
      text: "I appreciate your structured approach. How do you typically plan your day?",
      reasoning: "High conscientiousness signal detected"
    }
  }
  // ... 5-10 more patterns
  return {
    text: "That's interesting. Tell me more...",
    reasoning: "General engagement"
  }
}
```

### Project Structure Notes

**Docker Compose Isolation:**
- Test environment completely separate from dev environment
- Different ports (5433 vs 5432 for postgres, 4000 same for API)
- Isolated network prevents cross-contamination
- Uses production Dockerfile (validates actual deployment artifact)

**Vitest Configuration Strategy:**
- Separate config file (`vitest.config.integration.ts`) extends base
- Global setup/teardown only for integration tests
- Unit tests unaffected (remain fast, no Docker dependency)
- Can run both test suites independently

### Library & Framework Requirements

**Docker & Compose (Already Installed):**
- Docker Desktop 4.0+ or Docker Engine 20.10+ with Compose V2
- Modern Compose spec (no `version:` field, uses `depends_on` with conditions)
- Health checks: `pg_isready` for PostgreSQL, `wget` for API

**Vitest Configuration:**
- Package: `vitest` (already installed via catalog in pnpm-workspace.yaml)
- Global setup/teardown pattern: `globalSetup` and `globalTeardown` in vitest config
- Environment variables: `process.env.API_URL` for test endpoint
- Separate config file pattern already established in `vitest.config.ts` (extend for integration)

**Effect-ts Layer Swapping:**
- Pattern: Environment variable check → Layer selection at runtime
- Implementation location: `apps/api/src/index.ts` (server initialization)
- Mock layer: `packages/infrastructure/src/repositories/nerin-agent.mock.repository.ts`
- Real layer: `packages/infrastructure/src/repositories/nerin-agent.langgraph.repository.ts` (already exists)

**HTTP Client for Tests:**
- Use native `fetch()` API (Node.js 20+ has built-in fetch)
- NO external HTTP client libraries needed (keep dependencies minimal)
- Headers: `Content-Type: application/json` for all POST requests

**Schema Validation in Tests:**
- Package: `effect` (already installed)
- Import: `import { Schema } from 'effect'`
- Method: `Schema.decodeUnknownSync(ContractSchema)(responseData)`
- Contracts source: `@workspace/contracts` (already defined for all endpoints)

### Critical Implementation Details

**Docker Compose Test Environment Specifics:**

**Port Assignments (Avoid Conflicts):**
- postgres-test: 5433 (dev uses 5432)
- api-test: 4000 (same as dev - tests connect via localhost:4000)
- No frontend needed in test environment (API-only testing)
- No redis needed initially (can add if rate limiting tests required)

**Health Check Commands:**
```yaml
# PostgreSQL health check
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U test_user -d bigocean_test"]
  interval: 5s
  timeout: 3s
  retries: 3

# API health check (validates server started AND migrations ran)
healthcheck:
  test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://127.0.0.1:4000/health || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 15s  # Allow time for migrations
```

**Environment Variables for api-test Service:**
```yaml
environment:
  DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/bigocean_test
  MOCK_LLM: "true"  # CRITICAL: Prevents real Anthropic API calls
  BETTER_AUTH_SECRET: test-secret-min-32-chars-long
  BETTER_AUTH_URL: http://localhost:4000
  NODE_ENV: test
  PORT: 4000
```

**Vitest Global Setup Pattern:**

**Setup Script Responsibilities (`scripts/integration-setup.ts`):**
1. Clean up any lingering containers: `docker compose -f compose.test.yaml down -v`
2. Start services: `docker compose -f compose.test.yaml up -d --build`
3. Wait for health checks (poll http://localhost:4000/health until 200 OK)
4. Timeout: 60 seconds (generous for first-time image pull)
5. On failure: Print docker logs and exit with error

**Teardown Script Responsibilities (`scripts/integration-teardown.ts`):**
1. Stop containers: `docker compose -f compose.test.yaml down`
2. Remove volumes: `docker compose -f compose.test.yaml down -v` (clean slate for next run)
3. Always runs (even if tests fail)

**LLM Mocking Implementation:**

**Mock Response Patterns (Minimum Viable Set):**
```typescript
// Pattern 1: Conscientiousness signals (organization, planning, structure)
if (/organiz|plan|schedule|structur/i.test(message)) {
  return {
    text: "I appreciate your structured approach. How do you typically plan your day?",
    reasoning: "High conscientiousness signal detected"
  }
}

// Pattern 2: Openness signals (creativity, imagination, new ideas)
if (/creat|imagin|idea|art|novel/i.test(message)) {
  return {
    text: "That's a creative perspective! What inspires your imagination?",
    reasoning: "High openness signal detected"
  }
}

// Pattern 3: Extraversion signals (social, people, party, group)
if (/social|people|party|group|friend/i.test(message)) {
  return {
    text: "It sounds like you enjoy being around others. What do you like about social settings?",
    reasoning: "High extraversion signal detected"
  }
}

// Pattern 4: Agreeableness signals (help, care, kind, support)
if (/help|care|kind|support|compassion/i.test(message)) {
  return {
    text: "That's very thoughtful of you. How do you decide who to help?",
    reasoning: "High agreeableness signal detected"
  }
}

// Pattern 5: Neuroticism signals (worry, stress, anxiety, nervous)
if (/worry|stress|anxiety|nervous|overwhelm/i.test(message)) {
  return {
    text: "I hear that you're feeling stressed. What helps you calm down?",
    reasoning: "Neuroticism signal detected"
  }
}

// Default fallback
return {
  text: "That's interesting. Can you tell me more about that?",
  reasoning: "General engagement, no strong trait signal"
}
```

**Layer Swapping Logic (apps/api/src/index.ts):**
```typescript
// BEFORE (current - no mocking):
const ApiLayer = Layer.mergeAll(
  NerinAgentLangGraphRepositoryLive,
  // ... other layers
)

// AFTER (with mocking support):
const NerinLayer = process.env.MOCK_LLM === 'true'
  ? NerinAgentMockRepositoryLive
  : NerinAgentLangGraphRepositoryLive

const ApiLayer = Layer.mergeAll(
  NerinLayer,
  // ... other layers
)
```

### Previous Story Intelligence (Story 2.7)

**Key Learnings from TypeScript/Linting Story:**
- Bare imports now work without `.js` extensions (moduleResolution: bundler)
- All `as any` casts documented with `biome-ignore` comments
- Effect Schema transformations preferred over type assertions
- Pre-commit hooks run automatically (Biome fix)
- All 124 tests passing (115 API + 9 frontend)

**Patterns Established:**
- Effect Schema validation: `Schema.decodeUnknownSync(Schema)(data)`
- Repository pattern: Layer.succeed for mocks, Layer.effect for real implementations
- Branded types: `SessionId`, `UserId` (type-safe IDs)
- Test layers: `TestRepositoriesLayer` merges all mock dependencies

**Integration Test Parallel:**
- Story 2.7 focused on **compilation** quality (types, lint, imports)
- Story 2.8 focuses on **runtime** quality (Docker, HTTP, database)
- Both improve developer confidence before deployment

### Git Intelligence

**Recent Commits Pattern Analysis:**
- `6d66aec` - Story 2.7 completion (TypeScript improvements)
- `08d71c1` - Story 2.3 completion (Analyzer & Scorer with Evidence)
- `cf5efcb` - Story 2.6 completion (Effect + Vitest migration)

**Code Patterns from Recent Work:**
- Effect-ts 3.19+ is standard across all packages
- Vitest with @effect/vitest for testing Effect programs
- Schema validation at all boundaries (HTTP, database, external APIs)
- Layer composition for dependency injection (no constructor injection)

**Testing Patterns Established:**
- `it.effect()` from @effect/vitest for Effect-based tests
- `TestRepositoriesLayer` for unit test mocking
- Effect.provide() to inject test dependencies
- Schema validation in every test that touches external data

### References

All technical implementation details sourced from:
- [Source: _bmad-output/user-stories/story-2-8-integration-testing-docker-compose.md] - Complete user story with phases
- [Source: _bmad-output/planning-artifacts/architecture/decision-5-testing-strategy.md] - Testing strategy ADR
- [Source: _bmad-output/planning-artifacts/architecture/local-development-with-docker-compose.md] - Docker patterns
- [Source: compose.yaml] - Existing Docker Compose reference
- [Source: apps/api/src/use-cases/__tests__/analyzer-scorer-integration.test.ts] - Existing integration test pattern

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5 (create-story workflow)

### Debug Log References

- User story source: `/Users/vincentlay/Projects/big-ocean/_bmad-output/user-stories/story-2-8-integration-testing-docker-compose.md`
- Epic 2 context: `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/epics.md` (lines 293-677)
- Testing strategy: `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/architecture/decision-5-testing-strategy.md`
- Previous story (2.7): `/Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/2-7-typescript-compilation-linting-code-quality.md`
- Docker compose reference: `/Users/vincentlay/Projects/big-ocean/compose.yaml`
- Sprint status: `/Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/sprint-status.yaml`

### Completion Notes List

**Implementation Summary:**
- ✅ **Story Status**: COMPLETED (all acceptance criteria met, all tasks done)
- ✅ **Test Results**: 11 integration tests passing (2 health + 9 assessment/resume)
- ✅ **Docker Environment**: Production-parity test environment on ports 4001/5433
- ✅ **Mock LLM**: Zero-cost testing with 10 pattern-based responses
- ✅ **Documentation**: Complete (README + CLAUDE.md section)
- ✅ **CI/CD**: Task 5 added for future GitHub Actions integration

**Implementation Details:**
- 🐳 **Docker Compose**: compose.test.yaml with postgres-test + api-test services
- 📊 **Database Schema**: docker/init-db-test.sql initializes full schema (Better Auth + Assessment + Scoring tables)
- 🧪 **Vitest Config**: Separate integration config with global setup/teardown
- 🤖 **LLM Mocking**: Effect Layer swapping via MOCK_LLM=true environment variable
- 🎯 **Test Coverage**: 11 tests covering health, start, message, and resume endpoints
- 📝 **Port Configuration**: Host 4001 → Container 4000 (avoids dev conflict)

**Files Created (9 files):**
1. compose.test.yaml - Docker Compose test environment
2. docker/init-db-test.sql - Test database initialization (169 lines)
3. apps/api/vitest.config.integration.ts - Integration test config
4. apps/api/scripts/integration-setup.ts - Docker lifecycle setup
5. apps/api/scripts/integration-teardown.ts - Docker lifecycle teardown
6. apps/api/tests/integration/README.md - Integration testing guide
7. apps/api/tests/integration/health.test.ts - Health endpoint tests
8. apps/api/tests/integration/assessment.test.ts - Assessment endpoint tests
9. packages/infrastructure/src/repositories/nerin-agent.mock.repository.ts - Mock LLM

**Files Modified (4 files):**
1. package.json - Root test:integration scripts
2. apps/api/package.json - API test:integration scripts
3. apps/api/src/index.ts - MOCK_LLM Layer swapping (line 67-68)
4. CLAUDE.md - Integration testing documentation (lines 848-940)

**Verification Commands:**
```bash
# All passing ✅
pnpm test:integration              # 11 passed in ~10 seconds
pnpm docker:test:up                # Manual start works
pnpm docker:test:down              # Clean teardown works
pnpm test:integration:watch        # Watch mode works
```

**Future Enhancement (Task 5):**
- Add integration tests to GitHub Actions CI/CD pipeline
- Configure Docker-in-Docker for CI environment
- Ensure Railway deployment validation before production

### File List

**Files Created:**
1. `compose.test.yaml` - Docker Compose test environment (postgres + API)
2. `docker/init-db-test.sql` - PostgreSQL test database initialization script (auth + assessment + scoring tables with indexes and constraints)
3. `apps/api/vitest.config.integration.ts` - Vitest integration test config
4. `apps/api/scripts/integration-setup.ts` - Global setup (Docker Compose up)
5. `apps/api/scripts/integration-teardown.ts` - Global teardown (Docker Compose down)
6. `apps/api/tests/integration/README.md` - Integration testing guide
7. `apps/api/tests/integration/health.test.ts` - Health endpoint integration test (2 tests)
8. `apps/api/tests/integration/assessment.test.ts` - Assessment endpoints integration tests (9 tests)
9. `packages/infrastructure/src/repositories/nerin-agent.mock.repository.ts` - Mock LLM Layer (10 patterns)

**Files Modified:**
1. `package.json` - Add integration test scripts (test:integration, test:integration:watch, docker:test:up/down)
2. `apps/api/package.json` - Add integration test scripts
3. `apps/api/src/index.ts` - Add MOCK_LLM Layer swapping logic (line 67-68)
4. `CLAUDE.md` - Document integration testing patterns (lines 848-940)
