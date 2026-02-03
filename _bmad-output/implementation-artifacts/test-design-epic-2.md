# Test Design: Epic 2 - Assessment Backend Services

**Date:** 2026-02-03
**Author:** Vincentlay
**Test Architect:** Murat 🧪 (Master Test Architect)
**Status:** Draft
**Scope:** Stories 2.4 (LangGraph State Machine) + 2.5 (Cost Tracking & Rate Limiting)

---

## Executive Summary

**Scope:** Epic-level test design for remaining Epic 2 stories (2.4, 2.5)

**Context:**
- Epic 2 has **3 completed stories** (2.1 Session Management, 2.2 Nerin Agent, 2.3 Analyzer/Scorer)
- **2 remaining stories** in backlog (2.4 LangGraph Orchestration, 2.5 Cost Control)
- Story 2.8 (Docker Integration Testing) completed with 11 integration tests established
- Test infrastructure: Vitest unit + Docker integration + Mock LLM support

**Risk Summary:**

- Total risks identified: **14**
- High-priority risks (≥6): **5**
- Critical categories: **BUS (Business), TECH (Technical), PERF (Performance)**

**Coverage Summary:**

- P0 scenarios: **12** (~24 hours)
- P1 scenarios: **18** (~18 hours)
- P2/P3 scenarios: **15** (~5 hours)
- **Total effort**: **~47 hours (~6 days)** for test development

**Key Testing Challenges:**

1. **LangGraph State Machine Determinism** - Non-deterministic routing would break user experience
2. **Cost Control Accuracy** - Errors in cost calculation = runway burn
3. **Integration Complexity** - Multi-agent coordination requires sophisticated mocking
4. **Performance Under Load** - Orchestration latency must stay <2s P95

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| **R-001** | BUS | **Cost calculation formula errors** - Wrong token pricing or missing token counts lead to inaccurate cost tracking and potential budget overrun | 2 (Medium) | 3 (High) | **6** | Unit tests verify formula against Anthropic pricing. Integration tests with real API calls validate token counts. | DEV | Story 2.5 |
| **R-002** | BUS | **Budget cap bypass** - User can trigger multiple assessments or expensive operations despite $75/day hard cap, burning runway | 2 (Medium) | 3 (High) | **6** | API-level tests verify rate limiting at edge cases. Integration tests with Redis validate counter atomicity. Manual penetration testing for bypass attempts. | QA | Story 2.5 |
| **R-003** | TECH | **Non-deterministic routing** - Same LangGraph state produces different routing decisions, breaking user experience consistency | 2 (Medium) | 3 (High) | **6** | Property-based tests verify determinism across 1000+ state samples. Snapshot tests for all routing paths. | DEV | Story 2.4 |
| **R-004** | PERF | **Orchestration latency >2s** - LangGraph state machine overhead causes P95 response time SLA violation | 3 (High) | 2 (Medium) | **6** | Load tests with 100 concurrent sessions. Profiling LangGraph execution. Caching optimizations for repeated state queries. | DEV | Story 2.4 |
| **R-005** | DATA | **Evidence loss during state transitions** - Facet evidence (messageId references) corrupted or lost when LangGraph transitions between Analyzer → Scorer → Aggregator | 2 (Medium) | 3 (High) | **6** | Integration tests verify bidirectional navigation (Profile ↔ Evidence ↔ Message) after orchestration. Database integrity checks for orphaned records. | DEV | Story 2.4 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| **R-006** | TECH | **State machine edge case failures** - Unexpected state combinations (e.g., precision=0%, cost=exceeded, message count=0) cause orchestrator crashes | 2 (Medium) | 2 (Medium) | **4** | Boundary value testing for precision (0%, 50%, 100%), cost (0, threshold-1, threshold, exceeded), message count (0, 1, 2, 3, 100). | DEV |
| **R-007** | PERF | **Rate limit check latency** - Redis round-trip for every message adds noticeable delay to user experience | 2 (Medium) | 2 (Medium) | **4** | Cache rate limit status in-memory for request duration. Monitor P95 latency for rate limit checks (<50ms target). | DEV |
| **R-008** | DATA | **Redis data loss/corruption** - Cost counters or rate limit flags reset unexpectedly, allowing bypasses or inaccurate tracking | 1 (Low) | 3 (High) | **3** | Redis persistence enabled (AOF). Monitoring alerts for counter anomalies. TTL validation tests. | OPS |
| **R-009** | BUS | **Graceful degradation messaging** - User sees technical error instead of helpful message when cost cap hit or rate limited | 2 (Medium) | 2 (Medium) | **4** | API-level tests verify user-friendly error messages. Integration tests validate full error flow (CostGuard → Use-Case → Handler → HTTP response). | QA |
| **R-010** | TECH | **Batch trigger failures** - Analyzer/Scorer not triggered every 3 messages due to counting bugs or state corruption | 2 (Medium) | 2 (Medium) | **4** | Unit tests verify message counter logic. Integration tests assert Scorer invocation at messages 3, 6, 9, 12. | DEV |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| **R-011** | OPS | **Cost alert threshold failures** - Pino logs or Sentry alerts not triggered when approaching $75/day limit | 1 (Low) | 2 (Medium) | **2** | Integration tests verify logging at 50%, 75%, 90% thresholds. Manual Sentry alert validation. |
| **R-012** | PERF | **Memory leaks in long sessions** - LangGraph state accumulation over 30-min conversation causes memory pressure | 1 (Low) | 2 (Medium) | **2** | Memory profiling during load tests. Vitest leak detection for state cleanup. |
| **R-013** | OPS | **Mock LLM divergence from production** - Mock responses in tests don't reflect real Claude Sonnet 4.5 behavior, causing production issues | 2 (Medium) | 1 (Low) | **2** | Periodic validation tests with real API (flagged as $$$ tests). Mock response alignment reviews. |
| **R-014** | BUS | **Precision-based routing false triggers** - Router unnecessarily adds extra context to Nerin when precision ≥50%, wasting tokens | 1 (Low) | 1 (Low) | **1** | Unit tests verify routing logic thresholds. Token count monitoring in integration tests. |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability, state machine logic)
- **SEC**: Security (access controls, auth, data exposure, bypass vulnerabilities)
- **PERF**: Performance (SLA violations, degradation, resource limits, latency)
- **DATA**: Data Integrity (loss, corruption, inconsistency, orphaned records)
- **BUS**: Business Impact (UX harm, logic errors, revenue, cost control)
- **OPS**: Operations (deployment, config, monitoring, alerting)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| **Cost calculation accuracy** (Story 2.5) | Unit | R-001 | 4 | DEV | Test formula: `(inputTokens / 1M * 0.003) + (outputTokens / 1M * 0.015)`. Boundary values: 0 tokens, 1 token, 10k tokens, 100k tokens. |
| **Budget cap enforcement** (Story 2.5) | Integration | R-002 | 3 | QA | Test hard cap at $75/day. Verify rejection with graceful message. Test Redis counter atomicity under concurrent requests. |
| **Deterministic routing** (Story 2.4) | Unit | R-003 | 5 | DEV | Property-based tests: Same state (messages, precision, cost) → same routing decision. Test 1000+ random state samples for stability. |
| **Orchestration latency** (Story 2.4) | Integration | R-004 | 3 | QA | Load test with 100 concurrent sessions. Assert P95 < 2s. Profile LangGraph execution for bottlenecks. |
| **Evidence preservation** (Story 2.4) | Integration | R-005 | 4 | DEV | Verify bidirectional navigation (Profile → Evidence → Message) after full orchestration. Check for orphaned facet_evidence records. |

**Total P0**: **19 tests**, **~38 hours** (2 hours/test avg - complex setup, Docker, mocking)

---

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| **State machine edge cases** (Story 2.4) | Unit | R-006 | 6 | DEV | Test boundary values: precision (0%, 50%, 100%), cost (0, $74.99, $75, $76), message count (0, 1, 2, 3, 100). |
| **Rate limit check performance** (Story 2.5) | Integration | R-007 | 3 | DEV | Assert Redis round-trip <50ms P95. Test in-memory caching for request duration. |
| **Graceful degradation messages** (Story 2.5) | API | R-009 | 4 | QA | Verify user-friendly messages: "Assessment temporarily unavailable" (budget exceeded), "Try again tomorrow" (rate limited). |
| **Batch trigger reliability** (Story 2.4) | Unit | R-010 | 5 | DEV | Test message counter logic. Assert Analyzer/Scorer triggered at messages 3, 6, 9, 12. Test edge case: exactly 3 messages. |

**Total P1**: **18 tests**, **~18 hours** (1 hour/test avg - standard API/unit tests)

---

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| **Redis persistence** (Story 2.5) | Integration | R-008 | 3 | OPS | Test Redis AOF recovery. Verify cost counters persist after Redis restart. Validate TTL cleanup (48 hours). |
| **Cost alert thresholds** (Story 2.5) | Integration | R-011 | 4 | QA | Verify Pino logs at 50%, 75%, 90% of $75 budget. Test Sentry alert triggers. |
| **Memory leak detection** (Story 2.4) | Integration | R-012 | 3 | DEV | Run 30-min simulated conversation. Profile memory usage. Assert no unbounded growth. |
| **Precision-based routing logic** (Story 2.4) | Unit | R-014 | 5 | DEV | Test Router adds context when precision <50%. Test Router skips extra context when precision ≥50%. |

**Total P2**: **15 tests**, **~7.5 hours** (0.5 hours/test avg - simple scenarios)

---

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Real LLM validation

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| **Mock LLM alignment** (Story 2.4) | Integration ($$$ flagged) | 2 | DEV | Periodic validation with real Claude Sonnet 4.5 API. Compare mock vs. real token counts. |
| **Concurrent session stress test** (Story 2.4) | Load | 1 | QA | Test 500 concurrent sessions. Measure orchestration latency under load. |
| **Cost optimization verification** (Story 2.5) | Integration | 1 | DEV | Validate cost-aware routing skips Analyzer/Scorer when approaching budget. Measure token savings. |

**Total P3**: **4 tests**, **~1 hour** (0.25 hours/test avg - exploratory)

---

## Execution Order

### Smoke Tests (<2 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [ ] **Health check**: LangGraph state machine initializes without errors (10s)
- [ ] **Redis connectivity**: Cost tracking can read/write to Redis (15s)
- [ ] **Mock LLM**: Deterministic mock responses return expected tokens (20s)
- [ ] **Database schema**: facet_evidence, facet_scores, trait_scores tables exist (10s)

**Total**: **4 scenarios**, **~1 minute**

---

### P0 Tests (<15 min - CI pipeline)

**Purpose**: Critical path validation - must pass before merge

**Story 2.5: Cost Control**
- [ ] Cost formula accuracy: inputTokens=10000, outputTokens=5000 → $0.105 (Unit, 30s)
- [ ] Budget hard cap: Daily cost at $75 → next assessment rejected (Integration, 2min)
- [ ] Rate limit enforcement: 2nd assessment same day → rejected (Integration, 1.5min)
- [ ] Redis counter atomicity: 10 concurrent cost increments → accurate total (Integration, 2min)

**Story 2.4: LangGraph Orchestration**
- [ ] Deterministic routing: Same state → same decision (1000 samples) (Unit, 3min)
- [ ] Always routes to Nerin on every message (Unit, 30s)
- [ ] Triggers Analyzer/Scorer every 3rd message (Unit, 1min)
- [ ] Skips expensive ops when cost approaching budget (Unit, 1min)
- [ ] P95 latency <2s under 100 concurrent sessions (Integration, 3min)
- [ ] Bidirectional navigation: Profile → Evidence → Message (Integration, 2min)
- [ ] No orphaned facet_evidence records after orchestration (Integration, 1.5min)

**Total**: **11 scenarios**, **~15 minutes**

---

### P1 Tests (<20 min - PR validation)

**Purpose**: Important feature coverage

**Story 2.4: State Machine Edge Cases**
- [ ] Precision 0% triggers extra context for Nerin (Unit, 1min)
- [ ] Precision 100% skips extra context (Unit, 45s)
- [ ] Cost $74.99 allows operations (Unit, 30s)
- [ ] Cost $75.01 skips expensive ops (Unit, 30s)
- [ ] Message count 0 doesn't crash (Unit, 30s)
- [ ] Message count exactly 3 triggers Scorer (Unit, 1min)

**Story 2.5: Rate Limiting & Graceful Errors**
- [ ] Rate limit check <50ms P95 (Integration, 2min)
- [ ] Budget exceeded shows: "Assessment temporarily unavailable..." (API, 1.5min)
- [ ] Rate limited shows: "Try again tomorrow" (API, 1.5min)
- [ ] Pino logs cost events (API, 1min)

**Story 2.4: Batch Triggering**
- [ ] Analyzer triggered on messages 1, 2, 3, 4, 5... (Unit, 1min)
- [ ] Scorer triggered on messages 3, 6, 9, 12 (Unit, 1.5min)
- [ ] Scorer NOT triggered on messages 1, 2, 4, 5, 7, 8 (Unit, 1min)
- [ ] Aggregator derives traits after Scorer runs (Unit, 1.5min)
- [ ] Router uses precision gaps to guide Nerin (Unit, 2min)

**Total**: **15 scenarios**, **~18 minutes**

---

### P2/P3 Tests (<30 min - Nightly/On-Demand)

**Purpose**: Full regression coverage + exploratory validation

**P2 - Nightly**
- [ ] Redis AOF recovery preserves cost counters (Integration, 3min)
- [ ] Cost counter TTL cleans up after 48 hours (Integration, 2min)
- [ ] Pino logs at 50% budget threshold ($37.50) (Integration, 1.5min)
- [ ] Sentry alert triggered at 90% budget ($67.50) (Integration, 2min)
- [ ] 30-min conversation shows no memory leaks (Integration, 5min)
- [ ] Router skips context when precision ≥50% (Unit, 1min)

**P3 - On-Demand**
- [ ] Real Claude API token counts match mock (Integration $$, 5min)
- [ ] 500 concurrent sessions don't degrade latency >2s P95 (Load, 10min)
- [ ] Cost-aware routing saves tokens when approaching budget (Integration, 3min)

**Total**: **9 scenarios**, **~32 minutes**

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 19 | 2.0 | **38** | Complex: Docker setup, LangGraph mocking, Redis integration, property-based tests |
| P1 | 18 | 1.0 | **18** | Standard: API tests, unit tests with Effect test layers |
| P2 | 15 | 0.5 | **7.5** | Simple: Boundary value tests, logging verification |
| P3 | 4 | 0.25 | **1** | Exploratory: Real LLM tests ($$), load tests |
| **Total** | **56** | **-** | **~64.5** | **~8 days** (1 developer) |

**Adjusted Estimate**: **~6 days** accounting for existing Docker infrastructure (Story 2.8) and test utilities from Stories 2.1-2.3.

---

### Prerequisites

**Test Data Factories:**

- `createMockLangGraphState()` - Factory for LangGraph state objects (messages, precision, cost, evidence)
- `createFacetEvidence()` - Factory for facet evidence records with messageId references
- `createAssessmentSession()` - Factory for sessions (already exists from Story 2.1)
- `createCostEntry()` - Factory for Redis cost tracking entries

**Test Fixtures:**

- `withRedis()` - Setup/teardown Redis test instance (reuse from Story 2.8 Docker setup)
- `withPostgreSQL()` - Setup/teardown PostgreSQL test DB (reuse from Story 2.8)
- `withMockLLM()` - Mock Anthropic SDK with deterministic responses (already exists)
- `withLangGraphOrchestrator()` - Initialize LangGraph state machine for tests

**Tooling:**

- **Vitest** - Unit testing with Effect support (`it.effect()`, `TestClock`)
- **TestContainers** - Docker-based PostgreSQL + Redis for integration tests
- **fast-check** - Property-based testing for deterministic routing (Story 2.4)
- **@effect/vitest** - Effect-friendly test utilities and layers

**Environment:**

- Docker Compose for local test environment (port 4001 API, port 5433 PostgreSQL)
- `MOCK_LLM=true` flag to swap real Claude for deterministic mock
- Redis test instance on port 6380 (separate from dev Redis 6379)
- Test database with migrations applied automatically

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: **100%** (no exceptions - blocks merge)
- **P1 pass rate**: **≥95%** (waivers required for failures - blocks release)
- **P2/P3 pass rate**: **≥90%** (informational - doesn't block)
- **High-risk mitigations**: **100%** complete or approved waivers

### Coverage Targets

- **Critical paths** (LangGraph routing, cost calculation): **≥90%**
- **Security scenarios** (rate limit bypass, budget cap enforcement): **100%**
- **Business logic** (cost-aware routing, precision-based context): **≥80%**
- **Edge cases** (boundary values, state machine edge cases): **≥60%**

### Non-Negotiable Requirements

- [ ] All P0 tests pass (19 tests)
- [ ] No high-risk (≥6) items unmitigated (5 risks)
- [ ] Budget cap bypass tests (R-002) pass 100%
- [ ] Orchestration latency <2s P95 validated (R-004)
- [ ] Deterministic routing verified (R-003)
- [ ] Evidence preservation confirmed (R-005)

---

## Mitigation Plans

### R-001: Cost Calculation Formula Errors (Score: 6)

**Mitigation Strategy:**
1. **Unit tests** validate formula against Anthropic pricing:
   - Test: 0 tokens → $0.00
   - Test: 1M input + 0 output → $0.003
   - Test: 0 input + 1M output → $0.015
   - Test: 10k input + 5k output → (10000/1M * 0.003) + (5000/1M * 0.015) = $0.000105
2. **Integration tests** with real API calls (flagged $$$):
   - Send known prompt → verify token counts match Anthropic response
   - Compare calculated cost with Anthropic's reported cost
3. **Monitoring**: Pino logs every cost calculation for audit trail

**Owner:** DEV (Story 2.5 implementation)
**Timeline:** Story 2.5 completion
**Status:** Planned
**Verification:** P0 tests pass + integration test with real API (periodic validation)

---

### R-002: Budget Cap Bypass (Score: 6)

**Mitigation Strategy:**
1. **Redis atomic operations**: Use `INCR` for counter atomicity under concurrent requests
2. **API-level tests**:
   - Test: Daily cost $74 → next assessment allowed
   - Test: Daily cost $75 → next assessment rejected with message "Assessment temporarily unavailable..."
   - Test: Concurrent requests at $74.50 → only 1 succeeds, others rejected
3. **Rate limiting**: Max 1 assessment per user per day enforced at use-case layer
4. **Penetration testing**: Manual attempts to bypass via concurrent requests, session manipulation

**Owner:** QA (integration tests), DEV (implementation)
**Timeline:** Story 2.5 completion
**Status:** Planned
**Verification:** P0 integration tests + manual penetration testing

---

### R-003: Non-Deterministic Routing (Score: 6)

**Mitigation Strategy:**
1. **Property-based tests** using `fast-check`:
   - Generate 1000+ random LangGraph states (messages, precision, cost)
   - Assert: Same state → same routing decision every time
2. **Snapshot tests**: Capture routing decisions for known states, detect regressions
3. **No randomness in routing logic**: Routing based purely on deterministic inputs (message count, precision, cost)
4. **Code review**: Ensure no `Math.random()`, `Date.now()`, or non-deterministic LLM calls in routing

**Owner:** DEV (Story 2.4 implementation)
**Timeline:** Story 2.4 completion
**Status:** Planned
**Verification:** P0 property-based tests pass 1000+ samples

---

### R-004: Orchestration Latency >2s (Score: 6)

**Mitigation Strategy:**
1. **Load tests**: 100 concurrent sessions with realistic conversation patterns (30 messages each)
2. **Profiling**: Use Vitest profiling to identify LangGraph bottlenecks
3. **Optimizations**:
   - Cache facet scores in-memory during request to avoid repeated DB queries
   - Batch database writes (evidence, scores) instead of individual inserts
   - Async non-blocking Analyzer/Scorer execution
4. **Performance targets**:
   - Nerin response: <2s P95
   - Analyzer per-message: <500ms
   - Scorer aggregation: <200ms
5. **Monitoring**: Real User Monitoring (RUM) in production to track P95 latency

**Owner:** DEV (Story 2.4 implementation)
**Timeline:** Story 2.4 completion
**Status:** Planned
**Verification:** P0 load test passes (<2s P95 under 100 concurrent sessions)

---

### R-005: Evidence Loss During State Transitions (Score: 6)

**Mitigation Strategy:**
1. **Integration tests** verify bidirectional navigation after full orchestration:
   - Test: Click facet score → returns correct message quotes
   - Test: Click message → returns contributing facets
   - Test: highlightRange enables precise text highlighting
2. **Database integrity checks**:
   - Test: No orphaned facet_evidence records (messageId references valid messages)
   - Test: All facet_scores have supporting evidence in facet_evidence table
3. **Transactional writes**: Database writes for evidence + scores in single transaction
4. **Schema validation**: Foreign key constraints on facet_evidence.message_id

**Owner:** DEV (Story 2.4 implementation)
**Timeline:** Story 2.4 completion
**Status:** Planned
**Verification:** P0 integration tests pass + database integrity checks

---

## Assumptions and Dependencies

### Assumptions

1. **Mock LLM accuracy**: Deterministic mock responses in tests approximate real Claude Sonnet 4.5 behavior for token counts and response structure
2. **Redis availability**: Redis is stable and persistent (AOF enabled) for cost tracking and rate limiting
3. **Docker infrastructure**: Story 2.8 Docker setup (PostgreSQL, Redis, API on ports 4001/5433/6380) is operational and reusable for integration tests
4. **Test data cleanup**: All tests use fixtures with automatic teardown to avoid polluting test database
5. **Effect test layers**: Stories 2.1-2.3 established Effect test layer patterns (`TestRepositoriesLayer`) that can be extended for Stories 2.4-2.5

### Dependencies

1. **Story 2.1-2.3 completion** - Required for session management, Nerin agent, Analyzer/Scorer implementations (✅ Done)
2. **Story 2.8 Docker infrastructure** - Required for integration test environment (✅ Done)
3. **LangGraph library** - Required for state machine implementation (install during Story 2.4)
4. **Redis client (ioredis)** - Required for cost tracking (install during Story 2.5)
5. **fast-check library** - Required for property-based testing (install during Story 2.4)

### Risks to Plan

- **Risk**: LangGraph documentation incomplete or unstable APIs
  - **Impact**: Delays Story 2.4 implementation + testing
  - **Contingency**: Allocate 1 day for LangGraph research before Story 2.4 starts. If APIs unstable, implement custom state machine using Effect.

- **Risk**: Real LLM tests (P3, flagged $$$) consume excessive budget
  - **Impact**: Testing costs approach production budget
  - **Contingency**: Limit real API tests to 10 calls/week. Use cached responses for most validation.

- **Risk**: Property-based tests reveal non-deterministic routing bugs late in development
  - **Impact**: Story 2.4 requires refactoring of routing logic
  - **Contingency**: Run property-based tests early (TDD red phase) to catch non-determinism before implementation.

---

## Integration with Development Workflow

### Story 2.4: LangGraph State Machine (TDD Approach)

**Test-First Development:**

1. **Red Phase**: Write failing tests for routing logic
   - Unit tests: Deterministic routing, batch triggering, precision-based context
   - Property-based tests: 1000+ state samples for stability
2. **Green Phase**: Implement LangGraph state machine to pass tests
3. **Refactor Phase**: Optimize for latency, remove duplication
4. **Integration Phase**: Add Docker integration tests for full orchestration

**Test Execution During Development:**
- `pnpm test:watch` - Unit tests run on every save (fast feedback)
- `pnpm test:integration` - Integration tests run on-demand (pre-push)
- `pnpm test:coverage` - Coverage report after implementation complete

---

### Story 2.5: Cost Tracking & Rate Limiting (TDD Approach)

**Test-First Development:**

1. **Red Phase**: Write failing tests for cost control
   - Unit tests: Cost formula accuracy, rate limit enforcement
   - Integration tests: Redis atomicity, budget cap bypass prevention
2. **Green Phase**: Implement CostGuard repository + use-case integration
3. **Refactor Phase**: Optimize Redis queries, add caching
4. **Integration Phase**: Add Docker integration tests for full cost tracking flow

**Test Execution During Development:**
- `pnpm test:watch` - Unit tests for formula validation (instant)
- `pnpm docker:test:up && pnpm test:integration` - Integration tests with Redis (1-2 min)
- `pnpm test:coverage` - Ensure 100% coverage for cost calculation logic

---

### Pre-Commit Hooks Integration

**Current Git Hooks** (from CLAUDE.md):
- Pre-push: Lint check, TypeScript check, test suite (`pnpm test:run`)
- Commit-msg: Conventional commit validation

**Test Plan Impact:**
- P0 tests (~15 min) run as part of `pnpm test:run` in pre-push hook
- P1 tests (~20 min) run in CI pipeline on PR to main
- P2/P3 tests (~30 min) run nightly or on-demand

**Bypass for WIP commits:**
```bash
git push --no-verify  # Skip pre-push hook (use sparingly)
```

---

## Follow-on Workflows

After test design is approved, the following workflows can be run:

1. **`/bmad-bmm-testarch-atdd`** (Story 2.4 or 2.5)
   - Generate failing P0 acceptance tests before implementation
   - Creates test files in `apps/api/src/__tests__/` following TDD red-green-refactor cycle
   - Not auto-run - manual invocation after Story creation

2. **`/bmad-bmm-testarch-automate`** (Epic 2 completion)
   - Expand test coverage beyond P0 to P1/P2 scenarios
   - Add broader integration tests after all stories implemented
   - Run after Epic 2 completion to validate end-to-end orchestration

3. **`/bmad-bmm-testarch-nfr`** (Before Epic 2 release)
   - Assess non-functional requirements: performance, security, reliability, maintainability
   - Validate NFR1 (Conversational Quality), NFR2 (Real-Time Responsiveness <2s), NFR8 (Cost ≤$0.15/assessment)
   - Run before release to production

4. **`/bmad-bmm-testarch-trace`** (Epic 2 retrospective)
   - Generate requirements-to-tests traceability matrix
   - Analyze coverage gaps
   - Make quality gate decision (PASS/CONCERNS/FAIL/WAIVED)

---

## Approval

**Test Design Approved By:**

- [ ] **Product Manager:** Vincentlay | Date: ___________
- [ ] **Tech Lead:** _____________ | Date: ___________
- [ ] **QA Lead:** _____________ | Date: ___________

**Comments:**

_Pending approval - ready for review_

---

## Appendix

### Knowledge Base References

*Note: BMAD knowledge base fragments loaded during workflow execution:*

- `risk-governance.md` - Risk classification framework (TECH, SEC, PERF, DATA, BUS, OPS)
- `probability-impact.md` - Risk scoring methodology (Probability × Impact = Score)
- `test-levels-framework.md` - Test level selection (Unit, Integration, API, E2E)
- `test-priorities-matrix.md` - P0-P3 prioritization criteria

### Related Documents

- **PRD**: `_bmad-output/planning-artifacts/prd.md`
- **Epics & Stories**: `_bmad-output/planning-artifacts/epics.md`
- **Architecture**: `_bmad-output/planning-artifacts/architecture/architecture-decision-records.md`
- **Hexagonal Architecture**: `_bmad-output/planning-artifacts/architecture/adr-6-hexagonal-architecture-dependency-inversion.md`
- **Sprint Status**: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- **Docker Integration Tests**: `apps/api/tests/integration/README.md`

### Test Infrastructure (Existing - Story 2.8)

**Already Implemented:**
- Docker Compose test environment (API port 4001, PostgreSQL port 5433)
- Mock LLM support via `MOCK_LLM=true` flag
- 11 existing integration tests validating HTTP + DB + Docker build
- Test utilities: `TestRepositoriesLayer`, `createTestSession()`, `withDockerEnvironment()`

**To Be Added:**
- `createMockLangGraphState()` factory (Story 2.4)
- `withRedis()` fixture (Story 2.5)
- `fast-check` property-based test helpers (Story 2.4)
- CostGuard test repository (Story 2.5)

---

**Generated by**: Murat 🧪, BMad Master Test Architect
**Workflow**: `_bmad/bmm/workflows/testarch/test-design`
**BMAD Version**: 6.0
**Date**: 2026-02-03
