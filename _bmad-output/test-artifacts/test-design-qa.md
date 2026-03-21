# Test Design for QA: big-ocean E2E Coverage Gaps

**Purpose:** Test execution recipe for QA. Defines what to test, how to test it, and what QA needs from other teams.

**Date:** 2026-03-21
**Author:** Vincentlay
**Status:** Draft
**Project:** big-ocean

**Related:** See Architecture doc (`test-design-architecture.md`) for testability concerns and architectural blockers.

---

## Executive Summary

**Scope:** System-level E2E coverage gap analysis — 32 new test scenarios to fill critical gaps across conversation lifecycle, monetization, retention, and acquisition flows.

**Risk Summary:**

- Total Risks: 14 (4 high-priority score >=6, 7 medium, 3 low)
- Critical Categories: BUS (revenue journeys), SEC (access control), OPS (mobile viewports)

**Coverage Summary:**

- P0 tests: ~8 (critical paths, core journey)
- P1 tests: ~11 (retention, acquisition, mobile, share)
- P2 tests: ~9 (edge cases, UI interactions)
- P3 tests: ~4 (performance, exploratory)
- **Total**: ~32 tests (~1–1.5 weeks with 1 engineer)

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|------------|
| **Visual regression testing** | Chromatic deferred to Phase 2 | Manual visual review during PR |
| **Performance load testing (k6)** | No k6 infrastructure yet | Manual baseline pre-launch |
| **GDPR compliance testing** | Epic 6 in backlog (EU launch) | Deferred to Phase 2 |
| **Multi-browser E2E** | Chrome Desktop sufficient for MVP | Add Firefox/WebKit post-launch |
| **Chaos/fault injection** | Single Railway instance, low scale | Not needed pre-launch |
| **LLM output quality testing** | Non-deterministic; requires human eval | Manual conversation review |
| **Epic 38 features** (check-in email, recapture email, dashboard) | Still in backlog | Test when implemented |

---

## Dependencies & Test Blockers

### Backend Dependencies (Sprint 0)

**Source:** See Architecture doc "Quick Guide" for detailed mitigation plans

1. **Dedicated E2E server entrypoint (`index.e2e.ts`)** — Dev — Sprint 0
   - Independent composition root mirroring `index.ts` with 6 mock layer swaps (no shared function)
   - Extract ConversAnalyzer mock into `conversanalyzer.mock.repository.ts`
   - Remove all `MOCK_LLM` references from production code
   - Blocks all new E2E specs (mock layers must be composed cleanly)

2. **Resend mock layer** — Dev — Sprint 0
   - Wire as a mock layer in E2E entrypoint to verify email triggers and content
   - Blocks P1-001, P1-002, P1-003 (all email E2E tests)

3. **Polar checkout mock layer** — Dev — Sprint 0
   - Wire as a mock layer in E2E entrypoint for deterministic checkout simulation
   - Blocks P0-005, P0-007 (monetization E2E tests)

### QA Infrastructure Setup (Sprint 0)

1. **Mobile Playwright project** — Dev/QA
   - Add iPhone 14 viewport to `playwright.config.ts`
   - Blocks P1-008, P1-009 (mobile E2E tests)

2. **Near-budget session seed** — QA
   - Factory function to create session near cost guard threshold
   - Blocks P1-010 (cost guard E2E)

**Existing infrastructure (ready):**

- `seedFullPortrait()` factory — creates completed assessment with scores
- Auth state persistence (`.auth/owner.json`, `.auth/other-user.json`)
- Mock LLM layers via E2E entrypoint — deterministic LLM responses (once B-001 complete)
- Reduced turn count env var — conversation lifecycle in seconds
- Docker Compose test environment (API:4001, PG:5433)

---

## Risk Assessment

**Full risk details in Architecture doc. This section summarizes risks relevant to QA test planning.**

### High-Priority Risks (Score >=6)

| Risk ID | Category | Description | Score | QA Test Coverage |
|---------|----------|-------------|-------|------------------|
| **R-001** | BUS | Conversation lifecycle has no E2E | **6** | P0-001 through P0-004: full lifecycle with MOCK_LLM |
| **R-002** | BUS | Conversation extension untested E2E | **6** | P0-005, P0-006: extension purchase → re-finalization |
| **R-003** | SEC | Extension session access control gap | **6** | P0-006: verify ownership enforcement |
| **R-004** | BUS | Email retention flows untested | **6** | P1-001 through P1-003: mock Resend verification |

### Medium/Low-Priority Risks

| Risk ID | Category | Description | Score | QA Test Coverage |
|---------|----------|-------------|-------|------------------|
| R-005 | BUS | Homepage untested | 4 | P1-004, P1-005: homepage navigation and CTAs |
| R-007 | BUS | Share flow untested | 4 | P1-006, P1-007: clipboard + link resolution |
| R-008 | OPS | No mobile E2E | 4 | P1-008, P1-009: mobile viewport |
| R-010 | BUS | Depth meter untested | 4 | P0-002: assert in conversation lifecycle |
| R-011 | TECH | Cost guard only unit-tested | 3 | P1-010: near-budget session trigger |
| R-009 | DATA | QR token TTL untested | 3 | P1-011: expired token error state |

---

## Entry Criteria

- [ ] Resend mock adapter available
- [ ] Polar checkout mock available
- [ ] Mobile viewport added to `playwright.config.ts`
- [ ] E2E server entrypoint built with mock LLM layers (B-001)
- [ ] Mock layers verified to produce deterministic finalization
- [ ] Reduced turn count env var confirmed to trigger same pipeline as production
- [ ] Test environment running (Docker Compose: API:4001, PG:5433)

## Exit Criteria

- [ ] All P0 tests passing (100%)
- [ ] All P1 tests passing or failures triaged (>=95%)
- [ ] No open high-priority bugs
- [ ] All 4 high-priority risks (R-001 through R-004) have E2E coverage
- [ ] Test coverage agreed as sufficient by Dev

---

## Test Coverage Plan

**IMPORTANT:** P0/P1/P2/P3 = priority and risk level, NOT execution timing. See "Execution Strategy" for when tests run.

### P0 (Critical)

**Criteria:** Blocks core functionality + High risk (>=6) + No workaround + Affects majority of users

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| **P0-001** | Conversation lifecycle: start → N exchanges → finalization → results page shows OCEAN + archetype + traits | E2E | R-001 | Mock LLM layers + reduced turns env var |
| **P0-002** | Depth meter updates per exchange, milestone markers render | E2E | R-001, R-010 | Assert within conversation lifecycle spec |
| **P0-003** | Closing exchange triggers at final turn, farewell message displays | E2E | R-001 | Part of conversation lifecycle spec |
| **P0-004** | Auth-gated conversation: anonymous → sign-up → session linked → conversation continues | E2E | R-003 | Verify session linking mid-flow |
| **P0-005** | Conversation extension: purchase → new session → pipeline re-init → N more exchanges → updated results | E2E | R-002 | Mock Polar checkout |
| **P0-006** | Extension access control: only session owner can access extended session | E2E | R-003 | Extend existing access-control specs |
| **P0-007** | PWYW checkout → portrait unlock → portrait displays (non-seeded) | E2E | — | Mock Polar; real generation flow |
| **P0-008** | Session resume: page reload mid-conversation → resumes at correct exchange | E2E | — | Simulate reload, verify state |

**Total P0:** ~8 tests

---

### P1 (High)

**Criteria:** Important features + Medium risk (3-5) + Common workflows

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| **P1-001** | Drop-off re-engagement email: abandon at exchange N → email triggered | API | R-004 | Mock Resend; verify trigger + content |
| **P1-002** | Portrait recapture email: deferred purchase → email sent | API | R-004 | Mock Resend; verify timing |
| **P1-003** | RA notification email: analysis completes → partner notified | API | R-004 | Mock Resend; verify delivery trigger |
| **P1-004** | Homepage: 14-beat narrative renders, CTAs visible, "Start" navigates to /chat | E2E | R-005 | New homepage spec |
| **P1-005** | Homepage: founder portrait bridge section renders | E2E | R-005 | Part of homepage spec |
| **P1-006** | Share: copy link to clipboard works (fallback path) | E2E | R-007 | Test clipboard API |
| **P1-007** | Share: shared link resolves to correct public profile | E2E | R-007 | Link generation → resolution |
| **P1-008** | Mobile: chat interface usable on iPhone 14 viewport | E2E | R-008 | Mobile Playwright project |
| **P1-009** | Mobile: results page layout correct | E2E | R-008 | Mobile Playwright project |
| **P1-010** | Cost guard: near-budget session → next exchange blocked gracefully | E2E | R-011 | Seed near-budget session |
| **P1-011** | QR token expiration: expired token → accept screen shows error | API | R-009 | TTL behavior verification |

**Total P1:** ~11 tests

---

### P2 (Medium)

**Criteria:** Secondary features + Low risk + Edge cases + Regression prevention

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| **P2-001** | Confidence ring renders on results page | E2E | — | Visual assertion |
| **P2-002** | Trait card expansion → facet bars display correct values | E2E | — | Interactive component |
| **P2-003** | Evidence panel modal: click evidence → modal opens with highlights | E2E | — | Interactive component |
| **P2-004** | QR token auto-regeneration after 1h | API | R-009 | May need clock mock |
| **P2-005** | Profile visibility default: new user profile is private | API | — | Schema default verification |
| **P2-006** | Account deletion: cascade removes all user data | API | — | API-level cascade verification |
| **P2-007** | Nerin check-in email (~2 weeks post-assessment) | API | R-004 | Test when Epic 38 implemented |
| **P2-008** | Polar webhook idempotency: duplicate webhook → no double credit | API | — | Promote from unit to API test |
| **P2-009** | Results page: scientific section renders all 5 traits + 30 facets | E2E | — | Completeness assertion |

**Total P2:** ~9 tests

---

### P3 (Low)

**Criteria:** Nice-to-have + Exploratory + Performance benchmarks

| Test ID | Requirement | Test Level | Notes |
|---------|-------------|------------|-------|
| **P3-001** | Nerin response time baseline (P95 <2s target) | Performance | Manual or k6; Phase 2 |
| **P3-002** | Public profile LCP <1s | Performance | Lighthouse audit; Phase 2 |
| **P3-003** | Ritual suggestion screen: two-device sync | E2E | Complex multi-session; exploratory |
| **P3-004** | Desktop depth meter sticky behavior on scroll | E2E | Low-risk visual |

**Total P3:** ~4 tests

---

## Execution Strategy

**Philosophy:** Run everything in PRs unless significant infrastructure overhead. Playwright with 4-worker parallelization handles 100+ tests in ~10–15 min.

**Organized by tool type:**

### Every PR: Playwright Tests (~10–15 min)

All functional tests from P0 through P3:
- All existing 12 E2E specs + all ~28 new Playwright specs
- Parallelized across 4 workers
- Includes E2E and API-level tests

### Manual (Pre-Launch)

- P3-001: Nerin response time baseline
- P3-002: Public profile LCP audit
- P3-003: Ritual screen multi-device sync
- Web Share API on real mobile device

No nightly/weekly tiers needed — all functional tests are fast enough for PR execution.

---

## QA Effort Estimate

| Priority | Count | Effort Range | Notes |
|----------|-------|-------------|-------|
| P0 | ~8 | ~16–24 hours | Conversation lifecycle, extension, auth flows |
| P1 | ~11 | ~12–20 hours | Email mocks, homepage, mobile, share |
| P2 | ~9 | ~6–12 hours | UI interactions, API edge cases |
| P3 | ~4 | ~2–4 hours | Manual/exploratory |
| **Total** | **~32** | **~36–60 hours (~1–1.5 weeks)** | **1 engineer, full-time** |

**Assumptions:**

- Existing infrastructure reused (factories, fixtures, auth state)
- `index.e2e.ts` + ConversAnalyzer mock extraction + MOCK_LLM cleanup: ~3–4 hours (one-time)
- Resend mock layer: ~2 hours (one-time)
- Polar checkout mock layer: ~2 hours (one-time)
- Mobile Playwright project config: ~1 hour (one-time)

---

## Sprint Planning Handoff

| Work Item | Owner | Dependencies/Notes |
|-----------|-------|-------------------|
| Build `index.e2e.ts` (independent composition root) + extract ConversAnalyzer mock | Dev | Blocks all new E2E specs; removes MOCK_LLM from prod |
| Build Resend mock layer for E2E entrypoint | Dev | Blocks P1-001 through P1-003 |
| Build Polar checkout mock layer for E2E entrypoint | Dev | Blocks P0-005, P0-007 |
| Add mobile viewport to playwright.config.ts | Dev/QA | Blocks P1-008, P1-009 |
| Create near-budget session seed factory | QA | Blocks P1-010 |
| Implement P0 specs (conversation lifecycle, extension, auth, resume) | QA | After Sprint 0 blockers resolved |
| Implement P1 specs (email, homepage, mobile, share, cost guard) | QA | After mocks available |
| Implement P2 specs (UI interactions, API edge cases) | QA | No blockers |

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope | Validation Steps |
|-------------------|--------|-----------------|------------------|
| **Assessment Pipeline** | Conversation lifecycle E2E exercises full pipeline | Existing unit tests (44 use-case files) must pass | Run `pnpm test:run` before E2E |
| **Polar.sh API** | Mocked in E2E; real API tested manually | `process-purchase` unit tests cover idempotency | Manual checkout verification pre-launch |
| **Resend Email** | Mocked in E2E; real API tested via staging | Email template unit tests cover content | Manual email verification in staging |
| **Better Auth** | Session linking exercised in P0-004 | `auth-session-linking` unit test must pass | Golden path continues to cover auth flow |
| **PostgreSQL (Drizzle)** | Schema changes could break E2E seeds | Integration tests (assessment.test.ts) must pass | Run integration suite if schema changes |

**Regression test strategy:**

- All existing 12 E2E specs + 44 use-case unit tests continue to run on every PR
- New specs added incrementally; dependency ordering managed via Playwright projects

---

## Appendix A: Code Examples & Tagging

**Playwright Tags for Selective Execution:**

```typescript
import { test, expect } from "@playwright/test";

// P0 critical — conversation lifecycle
test("@P0 @E2E conversation completes and shows results", async ({ page }) => {
  // Start conversation with MOCK_LLM=true + reduced turns
  await page.goto("/chat");
  // ... exchange loop ...
  await expect(page.getByTestId("ocean-code")).toBeVisible();
  await expect(page.getByTestId("archetype-name")).toBeVisible();
});

// P1 — homepage navigation
test("@P1 @E2E homepage CTA navigates to chat", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("start-conversation-cta").click();
  await expect(page).toHaveURL(/\/chat/);
});
```

**Run specific tags:**

```bash
# Run only P0 tests
npx playwright test --grep @P0

# Run P0 + P1 tests
npx playwright test --grep "@P0|@P1"

# Run all tests (default in PR)
npx playwright test
```

---

## Appendix B: Knowledge Base References

- **Risk Governance**: `risk-governance.md` — Risk scoring methodology (P x I, gate decisions)
- **Test Levels Framework**: `test-levels-framework.md` — E2E vs API vs Unit selection
- **Test Quality**: `test-quality.md` — DoD (no hard waits, <300 lines, <1.5 min, parallel-safe)
- **ADR Quality Readiness**: `adr-quality-readiness-checklist.md` — 29-criteria testability framework

---

**Generated by:** BMad TEA Agent
**Workflow:** `_bmad/tea/testarch/test-design`
