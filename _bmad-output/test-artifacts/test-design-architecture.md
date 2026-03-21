# Test Design for Architecture: big-ocean E2E Coverage Gaps

**Purpose:** Architectural concerns, testability gaps, and recommendations for review by Dev team. Serves as a contract between QA and Engineering on what must be addressed before test development begins.

**Date:** 2026-03-21
**Author:** Vincentlay
**Status:** Architecture Review Pending
**Project:** big-ocean
**PRD Reference:** `_bmad-output/planning-artifacts/prd.md`
**ADR Reference:** `_bmad-output/planning-artifacts/architecture.md`

---

## Executive Summary

**Scope:** System-level E2E coverage gap analysis across all 38 epics (Phases 1–7). Focus on untested revenue-critical user journeys and missing E2E automation.

**Business Context** (from PRD):

- **Revenue model:** PWYW portrait (min €1), relationship credits (€5/€15), conversation extension (€25)
- **Problem:** Core user journeys (conversation lifecycle, monetization, retention emails) lack E2E coverage despite strong unit test foundation
- **Target:** Pre-launch readiness — fill critical gaps before GA

**Architecture:**

- Hexagonal architecture with Effect-ts DI (`Context.Tag` + `Layer.succeed()`)
- 6-layer conversation pacing pipeline (ConversAnalyzer → E_target → Scorer → Selector → Governor → Prompt Builder)
- Derive-at-read scoring (facet scores are single source of truth)

**Risk Summary:**

- **Total risks**: 14
- **High-priority (>=6)**: 4 risks requiring immediate mitigation
- **Test effort**: ~32 new scenarios (~1–1.5 weeks for 1 engineer)

---

## Quick Guide

### BLOCKERS - Team Must Decide

**Sprint 0 Critical Path** — These must be completed before QA can write new E2E tests:

1. **B-001: Dedicated E2E server entrypoint** — Create `apps/api/src/index.e2e.ts` as an independent composition root that mirrors `index.ts` but swaps LLM/email/payment layers for mocks. No shared function or abstraction — two separate files that can evolve independently. Currently 5 `MOCK_LLM` touchpoints pollute production code (3 ternaries in `index.ts`, 1 inline mock function + branch in `conversanalyzer.anthropic.repository.ts`). Steps: (1) Create `conversanalyzer.mock.repository.ts` — extract inline `mockAnalyzeV2()` into proper `Layer.succeed(ConversanalyzerRepository, ...)`, same pattern as the other 3 mock repos. (2) Create `index.e2e.ts` — copy of `index.ts` with 6 import swaps: `NerinAgent…Anthropic → Mock`, `Conversanalyzer…Anthropic → Mock`, `PortraitGenerator…Claude → Mock`, `RelationshipAnalysis…Anthropic → Mock`, `ResendEmail…Resend → Mock` (new), `PaymentGateway…Polar → Mock` (new). No ternaries, no env var checks. (3) Clean `index.ts` — remove all `MOCK_LLM` references and mock imports. (4) Clean `conversanalyzer.anthropic.repository.ts` — delete `mockAnalyzeV2()`, `isMocked` variable, and all conditional branches. (5) Update `compose.e2e.yaml` — change entrypoint to `index.e2e.ts`, remove `MOCK_LLM` env var. (recommended owner: Dev)
2. **B-002: Resend mock adapter for E2E** — Need a test-mode email sink to verify email triggers without real delivery. Wire as a mock layer in the E2E server entrypoint, not as a production env var branch. (recommended owner: Dev)
3. **B-003: Polar checkout mock for E2E** — Need deterministic checkout simulation for extension/PWYW flows without hitting real Polar API. Same approach: mock layer in E2E entrypoint. (recommended owner: Dev)

**What we need from team:** Complete these 3 items in Sprint 0 or E2E test development is blocked.

---

### HIGH PRIORITY - Team Should Validate

1. **R-001: Conversation lifecycle E2E** — Verify that mock LLM layers + reduced turn count env var produce a deterministic finalization flow suitable for E2E (Dev, Sprint 0)
2. **R-003: Extension session access control** — Confirm access control enforced at route level for extended sessions, not just original sessions (Dev, Sprint 0)

**What we need from team:** Review and confirm these assumptions hold.

---

### INFO ONLY - Solutions Provided

1. **Test strategy**: 32 new scenarios (8 P0, 11 P1, 9 P2, 4 P3) — all functional tests run in PRs
2. **Tooling**: Playwright (existing), Resend mock (new), Polar mock (new)
3. **Execution**: All Playwright tests in PRs (<15 min with 4-worker parallelization)
4. **Quality gates**: P0 = 100% pass, P1 >= 95%, high-risk mitigations complete before launch

---

## For Architects and Devs - Open Topics

### Risk Assessment

**Total risks identified**: 14 (4 high-priority score >=6, 7 medium, 3 low)

#### High-Priority Risks (Score >=6) - IMMEDIATE ATTENTION

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|------|--------|-------|------------|-------|----------|
| **R-001** | **BUS** | Conversation-to-finalization flow has no E2E — core journey could break silently | 2 | 3 | **6** | Add conversation lifecycle E2E with mock layers + reduced turns | Dev | Sprint 0 |
| **R-002** | **BUS** | Conversation extension (€25) completely untested E2E — payment + session + re-scoring | 2 | 3 | **6** | New E2E spec: extension purchase → pipeline re-init → updated results | Dev | Sprint 0 |
| **R-003** | **SEC** | No E2E for cross-session data leakage during conversation extension or relationship data | 2 | 3 | **6** | Extend access-control specs to cover extension sessions | Dev | Sprint 1 |
| **R-004** | **BUS** | Email flows (drop-off, recapture, RA notification) untested — retention mechanics could fail | 2 | 3 | **6** | Mock Resend in E2E, verify trigger conditions and content | Dev | Sprint 1 |

#### Medium-Priority Risks (Score 3-5)

| Risk ID | Category | Description | Prob | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|------|--------|-------|------------|-------|
| R-005 | BUS | Homepage acquisition funnel untested | 2 | 2 | 4 | Add homepage E2E | Dev |
| R-006 | PERF | No performance baseline (Nerin P95 <2s unvalidated) | 1 | 3 | 3 | Manual baseline pre-launch | Dev |
| R-007 | BUS | Share flow (clipboard fallback) untested | 2 | 2 | 4 | E2E for clipboard copy | Dev |
| R-008 | OPS | No mobile viewport E2E | 2 | 2 | 4 | Add mobile Playwright project | Dev |
| R-009 | DATA | QR token TTL/regeneration untested | 1 | 3 | 3 | Unit + API test for TTL | Dev |
| R-010 | BUS | Depth meter has zero tests | 2 | 2 | 4 | Assert in conversation lifecycle E2E | Dev |
| R-011 | TECH | Cost guard only unit-tested | 1 | 3 | 3 | E2E with seeded near-budget session | Dev |

#### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Prob | Impact | Score | Action |
|---------|----------|-------------|------|--------|-------|--------|
| R-012 | BUS | Ritual suggestion screen sync untested | 1 | 2 | 2 | Monitor |
| R-013 | OPS | Polar webhook idempotency only unit-tested | 1 | 2 | 2 | Monitor |
| R-014 | BUS | Confidence ring rendering untested | 1 | 1 | 1 | Monitor |

#### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

### Testability Concerns and Architectural Gaps

#### Blockers to Fast Feedback

| Concern | Impact | What Architecture Must Provide | Owner | Timeline |
|---------|--------|-------------------------------|-------|----------|
| **`MOCK_LLM` branching in production code** | Test-only logic shipped to prod; ConversAnalyzer has mock function inline | Dedicated E2E server entrypoint (`index.e2e.ts`) with mock layers composed at root | Dev | Sprint 0 |
| **No Resend mock for E2E** | Cannot verify email triggers end-to-end | Mock email layer in E2E entrypoint | Dev | Sprint 0 |
| **No Polar checkout mock** | Cannot test monetization flows without real API | Mock payment layer in E2E entrypoint | Dev | Sprint 0 |

#### Architectural Improvements Needed

1. **Dedicated E2E server entrypoint (two independent composition roots)**
   - **Current problem**: 5 `MOCK_LLM` touchpoints in production code — 3 ternaries in `apps/api/src/index.ts` (lines 98-121), 1 inline `mockAnalyzeV2()` function + `isMocked` branch in `conversanalyzer.anthropic.repository.ts` (lines 174-205, 215, 238, 295). Test-only code ships to production.
   - **Required change**: Create `index.e2e.ts` as a full independent copy of `index.ts` with 6 layer import swaps (Nerin, ConversAnalyzer, Portrait, RA Generator, Resend, Polar). No shared function, no abstraction — both entrypoints own their full layer stack and can evolve separately. Extract ConversAnalyzer mock into `conversanalyzer.mock.repository.ts` (same `Layer.succeed` pattern as the other 3 mock repos). Clean all `MOCK_LLM` references from `index.ts` and `conversanalyzer.anthropic.repository.ts`. Update `compose.e2e.yaml` entrypoint.
   - **Impact if not fixed**: Test-only code in production; E2E tests a hybrid composition that doesn't exist in prod; violates hexagonal architecture's core benefit
   - **Owner**: Dev
   - **Timeline**: Sprint 0

2. **Mobile viewport configuration**
   - **Current problem**: Playwright config has Chrome Desktop only
   - **Required change**: Add mobile project (iPhone 14 viewport) to `playwright.config.ts`
   - **Impact if not fixed**: Responsive layouts untested — chat, depth meter, results could break on mobile
   - **Owner**: Dev
   - **Timeline**: Sprint 0

---

### Testability Assessment Summary

#### What Works Well

- Hexagonal architecture + Effect DI makes repos trivially mockable — mock layers already exist for 3 of 4 LLM repos
- `data-testid` discipline across all E2E specs — stable selectors, never match LLM output
- Docker Compose parity — local dev matches prod
- `seedFullPortrait()` factory enables fast E2E setup
- Auth state persistence via Playwright `storageState`
- Reduced turn count env var enables full lifecycle testing without 25 real exchanges
- 95%+ backend use-cases unit tested

#### Accepted Trade-offs (No Action Required)

- **No visual regression testing** — Chromatic deferred to Phase 2; acceptable for MVP
- **No chaos/fault injection** — single Railway instance, not needed at current scale
- **No k6 performance testing** — manual baseline sufficient pre-launch

---

### Risk Mitigation Plans (High-Priority Risks >=6)

#### R-001: Conversation lifecycle has no E2E (Score: 6)

**Mitigation Strategy:**

1. Build E2E server entrypoint with mock LLM layers (prerequisite: B-001)
2. Verify mock layers + reduced turn count env var produce deterministic finalization
3. Ensure test seeding can create sessions at any exchange count
4. Confirm finalization pipeline runs synchronously in test mode

**Owner:** Dev
**Timeline:** Sprint 0
**Status:** Planned
**Verification:** New E2E spec passes: start → N exchanges → results page with OCEAN code

#### R-002: Conversation extension untested E2E (Score: 6)

**Mitigation Strategy:**

1. Implement Polar checkout mock for test environment
2. Verify extension session inherits prior session context correctly
3. Confirm re-finalization updates results (derive-at-read)

**Owner:** Dev
**Timeline:** Sprint 0
**Status:** Planned
**Verification:** New E2E spec passes: purchase → resume → updated results

#### R-003: Extension session access control gap (Score: 6)

**Mitigation Strategy:**

1. Audit route-level ownership checks for extension sessions
2. Verify relationship data isolation between users

**Owner:** Dev
**Timeline:** Sprint 1
**Status:** Planned
**Verification:** Access-control E2E specs extended with extension + relationship scenarios

#### R-004: Email flows untested (Score: 6)

**Mitigation Strategy:**

1. Build Resend mock adapter for test environment
2. Define trigger conditions for each email type in testable form

**Owner:** Dev
**Timeline:** Sprint 1
**Status:** Planned
**Verification:** E2E specs verify email trigger for drop-off, recapture, RA notification

---

### Assumptions and Dependencies

#### Assumptions

1. Mock LLM layers produce stable, deterministic outputs suitable for E2E assertions
2. Reduced turn count env var triggers the same finalization pipeline as production 25-exchange flow
3. Two independent entrypoints can compose different layers without shared abstractions (no code changes to use-cases or handlers)

#### Dependencies

1. E2E server entrypoint (`index.e2e.ts`) as independent composition root + ConversAnalyzer mock extraction — Required by Sprint 0
2. Resend mock layer — Required by Sprint 0
3. Polar checkout mock layer — Required by Sprint 0
4. Mobile viewport config in `playwright.config.ts` — Required by Sprint 0

#### Risks to Plan

- **Risk**: Mock LLM layers may not trigger all pipeline layers (pacing, steering, governor) identically to real LLM
  - **Impact**: Conversation lifecycle E2E would test a simplified path
  - **Contingency**: Accept simplified path for E2E; rely on integration tests for full pipeline

---

**End of Architecture Document**

**Next Steps for Dev Team:**

1. Review Quick Guide (BLOCKERS / HIGH PRIORITY) and prioritize
2. Build E2E server entrypoint — extract ConversAnalyzer mock, compose all mock layers at root, remove `MOCK_LLM` from production code
3. Build Resend + Polar mock layers for E2E entrypoint
4. Add mobile viewport to Playwright config
5. Validate mock layers + reduced turns produce deterministic finalization

**Next Steps for QA:**

1. Refer to companion QA doc (`test-design-qa.md`) for test scenarios and implementation details
2. Begin test development once Sprint 0 blockers resolved

---

**Generated by:** BMad TEA Agent - Test Architect Module
**Workflow:** `_bmad/tea/testarch/test-design`
