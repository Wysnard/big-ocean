---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: 'Testing strategies for Effect-ts API backend to prevent deployment failures with production-environment parity'
session_goals: 'Evaluate testing approaches (integration vs alternatives) based on cost/reward, achieve local=deployed confidence, support fast safe development, validate Docker builds'
selected_approach: 'AI-Recommended Techniques'
techniques_used: ['Five Whys - Complete', 'Deep Dive on Docker Compose Integration Tests', 'LLM Mocking Strategy']
ideas_generated: [41]
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Vincentlay
**Date:** 2026-02-03

## Session Overview

**Topic:** Testing strategies for API backend (endpoints, authentication, external systems) with emphasis on production-environment parity and Docker build validation

**Goals:**
- Prevent endpoint failures in production by catching them locally
- Evaluate testing approaches (integration vs alternatives) based on cost/reward
- Achieve "works local = works deployed" confidence
- Support fast, safe development iteration
- Explore Docker Compose setup if it fits the solution
- (Future: CI/CD integration, but not blocking current work)

**Key Constraints:**
- Want to move fast (not over-engineer)
- Backend uses Effect-ts hexagonal architecture
- Currently experiencing deployment failures that local testing doesn't catch
- Docker build success is critical to validate

### Session Setup

Session initialized to explore testing strategies with focus on production parity and fast iteration. Primary concern is preventing deployment failures by improving local testing to match production environment behavior.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Testing strategies for Effect-ts API backend to prevent deployment failures with production-environment parity, focusing on cost/reward evaluation

**Recommended Techniques:**

- **Five Whys (Deep):** Drill down through layers of causation to uncover root causes of deployment failures. Will reveal fundamental gaps between local and deployed environments, whether it's Docker build issues, missing integration points, or environment differences.

- **Solution Matrix (Structured):** Systematically evaluate testing approaches (integration tests, contract tests, smoke tests, Docker validation, E2E tests) against key criteria (cost, speed, production parity, confidence level, CI/CD fit, maintenance burden). Directly addresses cost/reward evaluation need with objective comparison.

- **Failure Analysis (Deep):** Study actual production failures to extract patterns and validate testing solution. Ensures chosen approach addresses real problems experienced in production, not theoretical ones. Derives specific test scenarios from real failure data.

**AI Rationale:** Sequence designed for technical problem-solving with production parity focus. Starts with root cause diagnosis of deployment failures, moves to objective testing strategy evaluation, concludes with validation against real failure patterns. Total estimated time: ~50 minutes. Balances analytical depth with practical action orientation matching "move fast" constraint.

## Technique Execution Results

### Five Whys - Root Cause Analysis

**Complete Five Whys Journey:**

**Layer 1 (Surface Symptom):** Endpoints fail in production (/health, database connectivity, auth)

**Layer 2 (Why?):** Local development environment ≠ deployment environment (Railway)
- Local uses `pnpm dev` (fast, no Docker, hot reload)
- Railway uses Docker containers with production build, real PostgreSQL, strict env vars

**Layer 3 (Why different?):** Environment and build process mismatch
- Local: Direct Node execution, `.env` file, no containerization
- Railway: Multi-stage Docker build, environment variables from dashboard, production dependencies only

**Layer 4 (Why didn't tests catch it?):** Unit tests with mocked dependencies only validate business logic, not integration
- Assumed unit tests = deployment safety
- Integration testing wasn't priority until deployment failures became painful
- Effect-ts examples focus on unit testing patterns, not integration layer

**Layer 5 (ROOT CAUSE):** **Missing Docker Compose integration test layer** that validates entire stack (build + database + HTTP + endpoints) in production-like environment before deployment

**Key Discovery:** Integration testing as pre-flight check is the minimum viable solution to prevent deployment failures.

---

### Deep Dive: Docker Compose Integration Test Architecture

**Decision: Tier 2 Integration Tests Only (Tier 3 deferred)**
- Tier 2 validates: HTTP endpoints, database operations, Docker build, environment assembly
- Tier 3 (real LLM calls) deferred due to: cost, non-determinism, slow execution, rate limits
- Mock LLM at repository layer for integration tests

**Generated Ideas:**

**[Idea #1]**: Strategic Docker Validation
_Concept_: Don't run Docker for every change, but trigger at strategic checkpoints (pre-commit, pre-push, before PR, on-demand). Fast iteration 90% of time, production-parity validation when it matters.
_Novelty_: Optimize for BOTH speed and confidence rather than picking one.

**[Idea #2]**: Two-Speed Development Workflow
_Concept_: Quick Mode (`pnpm dev`) for rapid iteration + Validation Mode (Docker + integration tests) for confidence checkpoints. Like game design: fast exploration, checkpoints before boss fights.
_Novelty_: Treats Docker like a "save checkpoint" - iterate fast, validate before committing progress.

**[Idea #3]**: The Unit Test Blind Spot
_Concept_: Unit tests with mocked dependencies create false sense of security. They validate logic perfectly but miss integration failures: server startup, database connection, env vars, Docker builds.
_Novelty_: Hexagonal architecture double-edge - isolation great for logic testing, but need DIFFERENT layer for "does the hexagon actually assemble?"

**[Idea #4]**: The Missing Integration Layer
_Concept_: Docker Compose integration tests = minimum viable setup that catches: (1) Docker build failures, (2) database connection issues, (3) missing env vars, (4) HTTP endpoint failures - all in production-like environment without deploying to Railway first.
_Novelty_: Not "add more tests" - creating production-like validation environment. Pre-flight check before pushing code.

**[Idea #5]**: Layered Docker Compose Architecture
_Concept_: Multi-service test environment: (1) API built from Dockerfile (exact Railway build), (2) PostgreSQL (same version as Railway), (3) Test-runner service executing integration tests. Services share network, use .env.test.
_Novelty_: Not "Docker Compose for dev" - TESTING environment proving "if it works here, it works on Railway."

**[Idea #6]**: Three-Tier Integration Test Pyramid
_Concept_: Stratified layers by speed/scope: (1) Smoke tests (5s) - does it start?, (2) Contract tests (30s) - correct schemas?, (3) Full integration (2-3 min) - business logic with real DB. Run selectively by context.
_Novelty_: Not one giant suite - optimize for feedback speed. Pre-commit: smoke. Pre-push: smoke + contract. Before PR: full suite.

**[Idea #7]**: Git Hook Integration Points
_Concept_: Hook Docker Compose tests at strategic points: (1) On-demand manual, (2) Pre-push hook (smoke tests, blocks push), (3) CI/CD (full suite on PR), (4) Optional pre-commit.
_Novelty_: Not "always running" - triggered at decision points. User controls timing, critical checkpoints protected by automation.

**[Idea #8]**: .env.test Isolation
_Concept_: Separate `.env.test` with test-specific values (test DB URL, mock API keys, reduced timeouts). Same env var NAMES as production (compatibility) but safe VALUES.
_Novelty_: Prevents accidental production API calls, data corruption, rate limiting during testing.

**[Idea #9]**: Hybrid Coverage Reporting
_Concept_: Combined unit + integration coverage: "X% business logic (unit tests), Y% HTTP endpoints (integration tests)." Two metrics for two purposes - logic correctness vs operational viability.
_Novelty_: Unit tests prove logic, integration tests prove assembly. Both necessary, neither sufficient alone.

**[Idea #10]**: Containerized Test Runner (Option B)
_Concept_: Test-runner service runs integration tests INSIDE Docker container. Tests execute in containerized Node, making HTTP requests to containerized API over Docker network.
_Novelty_: Maximum production parity - if passes here, WILL work on Railway. Cost: slower feedback loop.

**[Idea #11]**: On-Demand + Pre-Push Automation
_Concept_: Two modes: (1) Manual `pnpm test:integration` during development, (2) Pre-push git hook automatically runs, blocks push if fail. Iterate fast with unit tests, validate at strategic checkpoints.
_Novelty_: Integration tests as "gate" not "constant companion" - choose when to pay time cost, critical decisions protected.

**[Idea #12]**: The LLM Testing Paradox
_Concept_: Tier 3 full integration with real LLMs is: expensive (API costs), slow (network + processing), non-deterministic (varying responses), fragile (rate limits, downtime). Makes comprehensive Tier 3 impractical for rapid development.
_Novelty_: Traditional integration testing assumptions break with AI backends - need different strategy.

**[Idea #13]**: Hybrid Testing Strategy for LLM Backends
_Concept_: Mock for speed (Tier 2 always - validates plumbing), Real for confidence (Tier 3 selectively - manual on-demand, CI before master merge, weekly scheduled validation).
_Novelty_: Separates "does plumbing work?" from "does AI work?" Tier 2 proves integration, Tier 3 proves external dependency.

**[Idea #14]**: Deployment Confidence Metrics > Code Coverage
_Concept_: Track outcome-based KPIs instead of code coverage %: (1) Endpoint coverage, (2) Critical path coverage, (3) Docker build success rate, (4) Mean time to detection.
_Novelty_: Shifts from input metric (code tested) to outcome metric (deployment confidence). 100% code coverage can still have deployment failures.

**[Idea #15]**: Agent-Driven Development Metrics
_Concept_: Metrics designed to GUIDE coding agents, not just report. Instead of "73% coverage," use "❌ /api/profile/:id missing integration test" → agent knows exactly what to build.
_Novelty_: Metrics become TODO lists that agents execute. Traditional metrics for humans to interpret, agent metrics are executable instructions.

**[Idea #16]**: Hybrid: Endpoint Coverage with Critical Path Gates
_Concept_: Primary metric: endpoint coverage checklist (100% automatable). Secondary: critical path requirements (manually defined must-haves). Agent gets both "what to build" and "how to build it."
_Novelty_: Combines quantitative completeness (all endpoints) with qualitative requirements (critical paths properly validated).

**[Idea #17]**: Test Coverage as Agent Directive
_Concept_: Coverage report generates explicit agent tasks. "Missing test for POST /api/assessment/message" becomes "Write integration test that: (1) starts Docker, (2) makes POST, (3) validates schema, (4) verifies DB persistence."
_Novelty_: Coverage isn't measurement - it's task generation. Gap becomes work queue for agents.

**[Idea #18]**: Endpoint Coverage as Primary Metric
_Concept_: For each HTTP endpoint in `@workspace/contracts`, ensure integration test exists validating: (1) correct status code, (2) response schema matches contract, (3) runs in Docker Compose with real database. Coverage = tested / total.
_Novelty_: Direct 1:1 mapping: contract endpoint → integration test. Agent-parseable, no interpretation needed.

**[Idea #19]**: Production-Mirroring Compose Configuration
_Concept_: Docker Compose that mirrors Railway exactly: same PostgreSQL version, Node version, build process, env var names. Only VALUES differ (test DB, mock secrets). If builds/runs here, WILL work on Railway.
_Novelty_: Compose as "deployment rehearsal" not "dev convenience." Contract with Railway.

**[Idea #20]**: Separate Test Runner Dockerfile
_Concept_: `Dockerfile.test` different from production - includes dev dependencies (vitest, test utilities), mounts test files as volumes, configured for test execution not serving.
_Novelty_: Optimize each Dockerfile for purpose: production for size/speed, test for tooling/debuggability.

**[Idea #21]**: Contract-Driven Test Generation Pattern
_Concept_: For each `HttpApiEndpoint` in contracts, generate corresponding test file. Structure mirrors: `packages/contracts/src/http/groups/assessment.ts` → `apps/api/tests/integration/assessment.test.ts`.
_Novelty_: Tests GENERATED from contracts as enforcement. Contract is source of truth, tests validate implementation matches.

**[Idea #22]**: Schema-Driven Test Validation
_Concept_: Use Effect Schema's `decodeUnknownSync` instead of manual assertions. Single assertion validates shape, types, required fields, transformations.
_Novelty_: Contract schemas do double duty: (1) runtime API validation, (2) test assertions. If contract changes, tests auto-validate new structure.

**[Idea #23]**: Modern Docker Compose Standards Compliance
_Concept_: Follow Compose Spec: (1) Remove obsolete `version` field, (2) Use `compose.test.yaml` naming, (3) Long-form `depends_on` with `condition: service_healthy`, (4) Complete healthcheck parameters, (5) Named project with `name` field.
_Novelty_: Eliminates deprecated v2/v3 patterns. Forward-compatible with Compose Spec evolution.

**[Idea #24]**: Compose Spec Modernization
_Concept_: Updated config with 2024+ standards: no version field, canonical naming, long-form depends_on with `restart: true`, complete healthcheck timing, named volumes for persistence.
_Novelty_: Config follows current community standards, not legacy Docker Compose v2/v3.

**[Idea #25]**: Repository Layer Swapping Pattern
_Concept_: Effect-ts Layers swap NerinAgentRepository: (1) Production: real Claude API, (2) Unit tests: in-memory mocks, (3) Integration tests: behavioral mock (realistic responses, no API). Same interface, swapped via Layer.provide().
_Novelty_: No "if (NODE_ENV === 'test')" conditionals. Production code stays pure - test vs prod is deployment concern, not code concern.

**[Idea #26]**: Deterministic Mock Responses
_Concept_: Mock returns deterministic responses based on input patterns - "organize" → boost conscientiousness, "creative" → boost openness. Validates precision calculation, DB persistence, HTTP structure without API costs.
_Novelty_: Not "return fake data" - simulates LLM behavior patterns. Tests prove "if LLM returns X, we correctly process to Y."

**[Idea #27]**: Pattern-Based Mock Behavior
_Concept_: Mock pattern-matches input for realistic behavior. Integration tests validate: precision reflects conversation, DB persistence works, HTTP serializes correctly. Proves plumbing works independent of AI quality.
_Novelty_: Behaviorally realistic, not just structurally valid. Tests verify scoring logic works.

**[Idea #28]**: Three-Tier LLM Testing Strategy
_Concept_: (1) Unit tests: in-memory mock (instant, fixed data), (2) Integration tests: behavioral mock (deterministic, no API), (3) Manual/CI real: actual Claude (validate integration, selective). Each tier has specific purpose.
_Novelty_: Separates business logic correctness, system integration, external API compatibility. Optimizes cost/speed/confidence tradeoff.

**[Idea #29]**: Environment-Driven Layer Composition
_Concept_: `MOCK_LLM=true` → use mock, `MOCK_LLM=false` → use real API. Integration tests set true in compose.test.yaml, Railway sets false. Code stays pure - environment determines behavior.
_Novelty_: Layer selection becomes configuration. Same Docker image runs with mocks (testing) or real APIs (production) based on env vars.

---

### Key Decisions Made

**✅ Tier 2 Integration Tests Only** - Tier 3 (real LLM calls) deferred to later due to cost/speed/non-determinism

**✅ Endpoint Coverage Metric** - Primary actionable metric for agent-driven development

**✅ Containerized Test Runner** - Full Docker isolation for maximum production parity

**✅ LLM Mocking Strategy** - Pattern-based behavioral mocks via Effect Layer swapping

**✅ Modern Docker Compose** - Spec-compliant compose.test.yaml following 2024+ standards

**✅ Two-Speed Workflow** - Fast iteration (pnpm dev) + validation checkpoints (Docker integration tests)

---

### Creative Facilitation Narrative

Session started with surface symptoms (endpoints failing in production) and systematically drilled down through Five Whys to uncover root cause: missing Docker Compose integration test layer that validates entire stack before deployment. User demonstrated strong technical clarity and decisive decision-making, quickly identifying that Tier 2 (contract tests with mocked LLM) strikes the right cost/reward balance, while Tier 3 (real LLM integration) should be deferred.

Deep dive exploration revealed sophisticated understanding of Effect-ts hexagonal architecture and how to leverage Layer system for test mocking. User made clear strategic tradeoffs: prioritize speed (don't want Docker overhead constantly) while maintaining confidence (strategic validation checkpoints). Strong focus on agent-actionable metrics showed forward-thinking approach to AI-assisted development.

Research instinct to verify Docker Compose modern standards demonstrated commitment to doing things correctly, not just quickly. Session generated 29 concrete, implementable ideas ranging from architecture patterns to quality metrics to specific tooling approaches.

### Session Highlights

**User Creative Strengths:**
- Strong root cause analysis skills
- Clear cost/benefit reasoning
- Decisive tradeoff decisions
- Systems thinking (seeing how pieces connect)
- Research-driven validation

**AI Facilitation Approach:**
- Started analytical (Five Whys) then shifted to design exploration
- Built on user's technical expertise rather than explaining basics
- Validated modern standards when user requested
- Maintained focus on "move fast" constraint throughout

**Breakthrough Moments:**
- Identifying Tier 3 as unnecessary after initial assumption it was needed
- Realizing endpoint coverage is sufficient metric (simpler than critical paths)
- Connecting Effect Layers to test mocking strategy
- Understanding LLM testing paradox requires different approach than traditional integration testing

**Energy Flow:**
Sustained high engagement throughout. User actively shaped direction with decisive choices. Session demonstrated productive balance of exploration (generating ideas) and decision-making (eliminating options).

---

### Coverage Script Exploration & Simplification

**[Idea #30-38]**: Initial exploration of sophisticated agent integration (JSON output, MCP servers, Cursor integration, autonomous test generation, etc.)

**[Idea #39]**: Keep It Simple - Coverage as Validation, Not Orchestration
_Concept_: Coverage script is just a validation tool - runs, reports pass/fail, exits with error code. Claude Code already knows how to run bash commands and read output. No special integration needed - just a simple checker that reports missing tests with expected file paths.
_Novelty_: Resists urge to build "AI-specific tooling." Script is for humans, Claude Code consumes it like any CLI tool.

**Key Decision:** SIMPLICITY WINS
- ✅ Simple bash script that parses contracts and checks for tests
- ✅ Human-readable terminal output (Claude Code can read it too)
- ✅ Exit code 0/1 for pre-push hook integration
- ✅ No JSON APIs, no MCP servers, no special agent integration
- ✅ Claude Code workflow: run script → see missing tests → write tests → done

**Final Simplification Insight:** Don't build infrastructure for AI agents - they can already consume standard CLI output. Keep tooling simple and maintainable.

---

### Vitest-Native Integration Testing (Final Solution)

**[Idea #40]**: Vitest Global Setup for Docker Compose
_Concept_: Use vitest's `globalSetup`/`globalTeardown` to manage Docker Compose lifecycle. Script starts compose services before tests, vitest runs integration tests normally (discovery, parallelization, watching all built-in), teardown stops services. Same pattern as `scripts/dev.sh` but for testing.
_Novelty_: Don't reinvent test runner - vitest already does it perfectly. Just manage the infrastructure (Docker Compose) around vitest's execution.

**[Idea #41]**: Vitest-Native Integration Testing
_Concept_: Vitest handles ALL test execution (discovery, parallelization, watching, reporting, coverage). Scripts only manage Docker Compose lifecycle (start/stop). Tests run on host machine, connect to services via exposed ports (4000 for API, 5433 for postgres). Same tools (vitest) for unit and integration tests.
_Novelty_: Not "containerized test runner" - tests run locally with vitest, infrastructure runs in Docker. Unified test experience, leverage entire vitest ecosystem (UI, coverage, watch mode, plugins).

**Key Architectural Decision:**
- ❌ Containerized test-runner service (complex, slow iteration)
- ✅ Host-based vitest with Docker Compose infrastructure (simple, fast, full vitest features)

**Benefits:**
- Same vitest experience as unit tests (watch mode, UI, coverage, debugging)
- Fast iteration (no docker exec needed)
- Scripts only manage infrastructure (start/stop Docker Compose)
- Tests run on host, can debug in IDE normally
- Exposed ports allow host to connect to containerized services

**File Structure:**
```
apps/api/
├── vitest.config.integration.ts           # Integration test config
├── scripts/
│   ├── integration-setup.ts               # Global setup (docker compose up)
│   └── integration-teardown.ts            # Global teardown (docker compose down)
├── tests/
│   └── integration/
│       ├── assessment.test.ts
│       └── health.test.ts
└── compose.test.yaml                      # Only postgres-test + api-test (no test-runner)
```

**Workflow:**
```bash
# Run integration tests (setup → test → teardown)
pnpm test:integration

# Watch mode for development
pnpm docker:test:up              # Start services manually
pnpm test:integration:watch      # Vitest watch (skips setup/teardown)
pnpm docker:test:down            # Stop when done

# Vitest UI
pnpm test:integration:ui
```

**compose.test.yaml services:**
- `postgres-test` - PostgreSQL 16 on port 5433 (host accessible)
- `api-test` - API built from Dockerfile on port 4000 (host accessible)
- No `test-runner` service - vitest runs on host!

---

## Final Decisions & Implementation Strategy

### Core Architecture: Tier 2 Integration Tests with Docker Compose

**What We're Building:**
1. **compose.test.yaml** - Production-mirroring test environment (PostgreSQL + API + test-runner)
2. **Integration tests** - Contract-driven tests validating HTTP + database + Docker build
3. **LLM mocking** - Effect Layer swapping for zero-cost test execution
4. **Coverage script** - Simple validator checking endpoint coverage
5. **Pre-push hook** - Automated coverage check blocking untested deployments

**What We're NOT Building (Deferred):**
- ❌ Tier 3 real LLM integration tests (too expensive/slow for now)
- ❌ Complex AI agent integration tooling (unnecessary - keep it simple)
- ❌ CI/CD pipeline integration (future work)

### Implementation Checklist

**Phase 1: Docker Compose Setup**
- [ ] Create `compose.test.yaml` with postgres-test and api-test services (NO test-runner)
- [ ] Expose ports: 5433 for postgres, 4000 for API (host accessible)
- [ ] Create `.env.test` with test environment variables (optional - can use compose env)
- [ ] Add package.json scripts: `test:integration`, `test:integration:watch`, `docker:test:up/down`

**Phase 2: Vitest Configuration**
- [ ] Create `vitest.config.integration.ts` with integration test settings
- [ ] Create `scripts/integration-setup.ts` (global setup - starts Docker Compose)
- [ ] Create `scripts/integration-teardown.ts` (global teardown - stops Docker Compose)
- [ ] Configure environment variables (API_URL, DATABASE_URL) in vitest config

**Phase 3: LLM Mocking**
- [ ] Create `NerinAgentMockRepositoryLive` with pattern-based responses
- [ ] Add `MOCK_LLM` environment variable support in compose.test.yaml
- [ ] Wire mock layer into API startup (env-driven Layer composition)

**Phase 4: Integration Tests**
- [ ] Write integration tests for existing endpoints (health, assessment/start, assessment/message)
- [ ] Tests run on HOST machine, connect to http://localhost:4000
- [ ] Follow contract-driven pattern with Effect Schema validation
- [ ] Verify tests work: `pnpm test:integration`

**Phase 5: Coverage Tooling**
- [ ] Create `scripts/check-integration-coverage.ts` (simple version)
- [ ] Parse contracts to find all endpoints
- [ ] Check if integration tests exist for each endpoint
- [ ] Output human-readable report (Claude Code can parse)
- [ ] Add `pnpm test:integration:coverage` script

**Phase 6: Git Hook Integration**
- [ ] Add coverage check to pre-push hook
- [ ] Set threshold (100% or configurable via COVERAGE_THRESHOLD)
- [ ] Document bypass process (--no-verify for emergencies)

### Success Metrics

**"Works local = works deployed" confidence achieved when:**
- ✅ All HTTP endpoints have integration tests (100% endpoint coverage)
- ✅ Tests run in Docker Compose environment (production parity)
- ✅ Docker build validated on every push (pre-push hook)
- ✅ Database operations tested with real PostgreSQL
- ✅ LLM integration mocked for cost-free execution
- ✅ Pre-push hook blocks untested code from reaching Railway

### Key Architectural Patterns

**Hexagonal Architecture Leverage:**
- Domain layer defines repository interfaces (Context.Tag)
- Infrastructure layer provides implementations (Live Layers)
- Test layer swaps implementations via Layer.provide()
- Use-cases remain pure - never know which implementation

**Effect-ts Integration:**
- Schema validation in tests (decodeUnknownSync)
- Layer composition for dependency injection
- Config for environment-based behavior (MOCK_LLM)

**Docker Compose Modern Standards:**
- No `version` field (obsolete)
- `compose.test.yaml` canonical naming
- Long-form `depends_on` with `condition: service_healthy`
- Complete healthcheck parameters
- Named volumes and networks

---

## Session Reflection

**Total Ideas Generated:** 41 ideas
**Techniques Used:** Five Whys (complete), Deep Dive on Docker Compose, LLM Mocking Strategy, Coverage Script Exploration
**Time Invested:** ~90 minutes of deep exploration
**Key Outcome:** Clear implementation plan for Tier 2 integration testing with production parity using vitest-native approach

**Most Valuable Insights:**
1. Root cause: Missing Docker Compose integration layer (not just "add more tests")
2. Tier 2 sufficient: Mock LLM for cost/speed, defer Tier 3 real API calls
3. Endpoint coverage metric: Simple and agent-actionable
4. Simplicity wins: Don't over-engineer for AI agents - standard CLI tools work fine
5. Two-speed workflow: Fast iteration + strategic validation checkpoints
6. **Vitest-native testing**: Leverage vitest infrastructure (globalSetup) instead of containerized test runner
7. **Tests run on host**: Connect to Docker services via exposed ports - full vitest ecosystem (watch, UI, debugging)

**Eliminated Complexity:**
- Sophisticated AI agent integration tooling (ideas #30-38) → Simplified to basic coverage script (#39)
- Containerized test-runner service (idea #20) → Host-based vitest with Docker infrastructure (#40-41)
- Tier 3 real LLM testing → Deferred indefinitely
- Critical path coverage definitions → Just endpoint coverage is enough

**Next Steps:**
1. Implement Phase 1 (Docker Compose with postgres-test + api-test, NO test-runner)
2. Implement Phase 2 (Vitest config with globalSetup/globalTeardown scripts)
3. Implement Phase 3 (LLM mocking via Effect Layers + MOCK_LLM env var)
4. Implement Phase 4 (Write first integration test - health endpoint)
5. Verify end-to-end: `pnpm test:integration` starts Docker, runs tests, stops Docker
6. Expand to all existing endpoints (assessment/start, assessment/message)
7. Implement Phase 5 (Coverage script - simple validator)
8. Implement Phase 6 (Pre-push hook integration)
9. Use as foundation for future endpoint development

**Implementation Priority:**
- **High**: Phases 1-4 (Core testing infrastructure)
- **Medium**: Phase 5 (Coverage validation)
- **Low**: Phase 6 (Git hook enforcement - can add later)

---

## Related Artifacts

**User Story Created:** [`_bmad-output/user-stories/story-2-8-integration-testing-docker-compose.md`](../user-stories/story-2-8-integration-testing-docker-compose.md)
- **Story ID:** 2-8 (Epic 2, Story 8)
- **Epic:** Testing Infrastructure
- **Priority:** High
- **Estimated Time:** 8-10 hours
- **Contents:**
  - Complete problem statement with root cause analysis
  - Solution architecture (vitest-native integration testing)
  - Detailed acceptance criteria (7 ACs across 6 phases)
  - Technical implementation details with code examples
  - Phase-by-phase implementation guide
  - Success metrics and testing strategy
  - Dependencies, risks, and mitigations

This user story is ready for implementation and contains all decisions made during this brainstorming session.
