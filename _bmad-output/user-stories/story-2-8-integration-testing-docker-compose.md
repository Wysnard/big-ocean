# User Story 2-8: Integration Testing with Docker Compose

**Story ID:** 2-8
**Epic:** 2 - Testing Infrastructure
**Created:** 2026-02-03
**Priority:** High
**Status:** Ready for Development

---

## User Story

**As a** developer working on the big-ocean API
**I want** integration tests that validate endpoints in a production-like Docker environment
**So that** I can catch deployment failures locally before pushing to Railway

---

## Problem Statement

### Current Pain Points

1. **Deployment Failures**: Endpoints fail in Railway production despite passing unit tests locally
2. **Environment Mismatch**: Local dev (`pnpm dev`) ≠ Railway deployment (Docker containers)
3. **Late Discovery**: Issues discovered hours after development when code is already merged
4. **Missing Integration Layer**: Unit tests validate business logic but miss:
   - Docker build failures
   - Database connection issues
   - Missing environment variables
   - HTTP endpoint assembly errors
   - Real service integration

### Root Cause (from Five Whys Analysis)

**Missing Docker Compose integration test layer** that validates the entire stack (build + database + HTTP + endpoints) in production-like environment before deployment.

---

## Solution Overview

### Architecture: Vitest-Native Integration Testing

**Core Principle:** Leverage vitest infrastructure management (globalSetup/globalTeardown) instead of building custom test runner.

**Components:**
1. **Docker Compose** (`compose.test.yaml`) - Production-mirroring environment
   - `postgres-test`: PostgreSQL 16 on port 5433
   - `api-test`: API built from production Dockerfile on port 4000
   - No test-runner service - tests run on HOST

2. **Vitest Configuration** (`vitest.config.integration.ts`)
   - Global setup: Start Docker Compose before tests
   - Global teardown: Stop Docker Compose after tests
   - Tests connect to http://localhost:4000

3. **LLM Mocking** (Effect-ts Layers)
   - `MOCK_LLM=true` in compose.test.yaml
   - Pattern-based mock responses (no API costs)
   - Validates plumbing, not AI quality

4. **Coverage Script** (Simple CLI validator)
   - Parses contracts to find endpoints
   - Reports missing integration tests
   - Exit code 0/1 for pre-push hook

---

## Acceptance Criteria

### Must Have (Phase 1-4)

- [ ] **AC1: Docker Compose Environment**
  - `compose.test.yaml` exists with postgres-test and api-test services
  - Services expose ports to host (5433 for postgres, 4000 for API)
  - Health checks ensure services ready before tests
  - Modern Compose spec (no `version` field, long-form `depends_on`)

- [ ] **AC2: Vitest Integration Configuration**
  - `vitest.config.integration.ts` configured for integration tests
  - `scripts/integration-setup.ts` starts Docker Compose
  - `scripts/integration-teardown.ts` stops and cleans up
  - Environment variables configured (API_URL, DATABASE_URL)

- [ ] **AC3: LLM Mocking Strategy**
  - `NerinAgentMockRepositoryLive` created with pattern-based responses
  - Effect Layer swapping via `MOCK_LLM` environment variable
  - API uses mock in tests, real Claude in production
  - Zero API costs for integration test runs

- [ ] **AC4: Integration Tests for Existing Endpoints**
  - Health check: `GET /health`
  - Assessment start: `POST /api/assessment/start`
  - Assessment message: `POST /api/assessment/message`
  - Tests validate response schemas using Effect Schema
  - Tests verify database persistence

- [ ] **AC5: Working Test Commands**
  - `pnpm test:integration` runs all integration tests
  - `pnpm test:integration:watch` enables watch mode
  - `pnpm docker:test:up/down` for manual control
  - Tests pass consistently

### Should Have (Phase 5-6)

- [ ] **AC6: Coverage Validation**
  - `scripts/check-integration-coverage.ts` parses contracts
  - Script reports missing integration tests with file paths
  - `pnpm test:integration:coverage` command available
  - Human-readable output (Claude Code can parse)

- [ ] **AC7: Pre-Push Hook**
  - Coverage check runs on `git push`
  - Blocks push if coverage < 100% (configurable threshold)
  - Can bypass with `--no-verify` for emergencies
  - Clear error messages when blocked

---

## Technical Implementation Details

### File Structure

```
apps/api/
├── vitest.config.integration.ts           # Integration test config
├── scripts/
│   ├── integration-setup.ts               # Global setup (docker compose up)
│   ├── integration-teardown.ts            # Global teardown (docker compose down)
│   └── check-integration-coverage.ts      # Coverage validator
├── tests/
│   └── integration/
│       ├── health.test.ts
│       ├── assessment.test.ts
│       └── README.md                      # Integration test guide
└── compose.test.yaml                      # Test environment services

packages/infrastructure/src/repositories/
└── nerin-agent.mock.repository.ts         # Mock LLM implementation
```

### compose.test.yaml Structure

```yaml
name: bigocean-integration-tests

services:
  postgres-test:
    image: postgres:16-alpine
    ports: ["5433:5432"]
    healthcheck: [pg_isready check]

  api-test:
    build: { context: ., dockerfile: apps/api/Dockerfile }
    ports: ["4000:4000"]
    environment:
      MOCK_LLM: "true"
      DATABASE_URL: "postgresql://test_user:test_password@postgres-test:5432/bigocean_test"
    depends_on:
      postgres-test: { condition: service_healthy, restart: true }
    healthcheck: [wget /health check]
```

### Vitest Global Setup Pattern

```typescript
// scripts/integration-setup.ts
export default async function globalSetup() {
  // 1. Clean up previous run
  await exec('docker compose -f compose.test.yaml down -v')

  // 2. Start services
  await exec('docker compose -f compose.test.yaml up -d')

  // 3. Wait for health checks
  await waitForHealthy('http://localhost:4000/health', 60)
}
```

### Integration Test Pattern

```typescript
// tests/integration/assessment.test.ts
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

### LLM Mocking Pattern

```typescript
// packages/infrastructure/src/repositories/nerin-agent.mock.repository.ts
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
      text: "I appreciate your structured approach...",
      reasoning: "High conscientiousness signal detected"
    }
  }
  // ... more patterns
}
```

---

## Implementation Phases

### Phase 1: Docker Compose Setup (1-2 hours)
- Create `compose.test.yaml` with postgres-test and api-test
- Configure health checks and port exposure
- Test manual startup: `docker compose -f compose.test.yaml up`
- Verify API accessible at http://localhost:4000

### Phase 2: Vitest Configuration (1 hour)
- Create `vitest.config.integration.ts`
- Implement `scripts/integration-setup.ts` (start Docker)
- Implement `scripts/integration-teardown.ts` (stop Docker)
- Add package.json scripts
- Test: `pnpm test:integration` (should start/stop Docker)

### Phase 3: LLM Mocking (2 hours)
- Create `NerinAgentMockRepositoryLive` with pattern matching
- Add `MOCK_LLM` env var support in API
- Wire Layer swapping in `apps/api/src/layers/app-layer.ts`
- Test: API uses mock when `MOCK_LLM=true`

### Phase 4: First Integration Tests (2-3 hours)
- Write `health.test.ts` (simplest - just GET /health)
- Write `assessment.test.ts` (start + message endpoints)
- Validate Effect Schema usage
- Test database persistence
- Verify all tests pass: `pnpm test:integration`

### Phase 5: Coverage Script (2 hours)
- Create `scripts/check-integration-coverage.ts`
- Parse contracts to extract endpoints
- Check for corresponding test files
- Generate human-readable report
- Test: `pnpm test:integration:coverage`

### Phase 6: Pre-Push Hook (30 minutes)
- Add coverage check to `.husky/pre-push`
- Set `COVERAGE_THRESHOLD=100`
- Test: Try pushing with missing test (should block)

**Total Estimated Time:** 8-10 hours

---

## Success Metrics

### Deployment Confidence
- ✅ **Primary Goal:** Zero deployment failures due to environment mismatch
- ✅ **Metric:** "Works local = works deployed" confidence

### Coverage
- ✅ **Target:** 100% endpoint coverage (all contracts have integration tests)
- ✅ **Enforcement:** Pre-push hook blocks untested endpoints

### Developer Experience
- ✅ **Fast Iteration:** Watch mode for rapid test-driven development
- ✅ **Full Vitest Features:** UI, coverage, debugging all work
- ✅ **Clear Feedback:** Coverage script shows exactly what's missing

### Cost Efficiency
- ✅ **Zero LLM Costs:** Mocked in integration tests
- ✅ **Fast Execution:** Tests run in seconds (no external API calls)

---

## Testing Strategy

### Three-Tier Testing (What Gets Tested Where)

| Test Type | What | How | When |
|-----------|------|-----|------|
| **Unit Tests** | Business logic (use-cases) | Effect-ts with TestRepositoriesLayer | Always (fast, every save) |
| **Integration Tests** | HTTP + DB + Docker build | Vitest + Docker Compose + Mock LLM | Pre-push (strategic checkpoint) |
| **Manual/Real Tests** | Actual LLM integration | Real Claude API (Tier 3 - deferred) | Rarely (before major releases) |

### Endpoint Coverage Principle

**For each `HttpApiEndpoint` in `@workspace/contracts`:**
1. Integration test file MUST exist
2. Test MUST validate response schema matches contract
3. Test MUST verify HTTP status codes
4. Test MUST check database side effects (if applicable)

---

## Dependencies

### Required Tools
- Docker & Docker Compose (modern spec support)
- Node.js 20+
- pnpm 10.4.1+
- vitest (already installed)

### Required Packages
- `@workspace/contracts` - HTTP contract definitions
- `@workspace/infrastructure` - Repository implementations
- Effect-ts - Schema validation and Layer system

### External Services (in Docker)
- PostgreSQL 16
- API built from production Dockerfile

---

## Risks & Mitigations

### Risk: Docker Compose startup failures
**Mitigation:** Comprehensive health checks, clear error messages with logs, cleanup on failure

### Risk: Port conflicts (4000, 5433 already in use)
**Mitigation:** Check ports in setup script, document manual override via env vars

### Risk: Flaky tests due to timing issues
**Mitigation:** Proper health check waiting, generous timeouts in vitest config

### Risk: Mock LLM responses too simplistic
**Mitigation:** Start simple, enhance patterns as needed based on test requirements

---

## Future Enhancements (Not in Scope)

- [ ] Tier 3: Real LLM integration tests (run selectively in CI)
- [ ] CI/CD integration (GitHub Actions)
- [ ] Parallel test execution (currently serial for stability)
- [ ] Database fixtures/seeding patterns
- [ ] Performance testing integration
- [ ] Visual regression testing

---

## Related Documents

- **Brainstorming Session:** [`_bmad-output/brainstorming/brainstorming-session-2026-02-03.md`](../brainstorming/brainstorming-session-2026-02-03.md)
  - 41 ideas generated through Five Whys analysis
  - Complete root cause diagnosis
  - Solution exploration and decision trail
- **Architecture Decisions:** `docs/ARCHITECTURE.md`
- **Testing Guide:** `docs/TESTING.md` (to be created after implementation)

---

## Notes

**Key Design Decisions:**
- Vitest-native (not containerized test runner) - leverage full vitest ecosystem
- Host-based tests connecting to Docker services - enables watch mode, debugging, UI
- Simple coverage script (not complex agent integration) - maintainable, human-readable
- Tier 2 only (mock LLM) - cost-effective, fast, sufficient for production parity
- Effect Layers for mocking - clean dependency injection, no code changes between test/prod

**Rationale for Approach:**
Based on root cause analysis (Five Whys), the fundamental issue is missing integration validation between local dev and production deployment. This solution provides minimum viable production parity testing without over-engineering.
