# Epic 5 Preparation Sprint Plan
**Generated:** 2026-02-08
**Updated:** 2026-02-08 (verified state - Tasks 1-4 complete)
**Status:** In Progress - Critical Tasks Complete
**Scrum Master:** Bob
**Project:** big-ocean
**Duration:** 3 days (2026-02-09 to 2026-02-11)

---

## Sprint Overview

**Purpose:** Prepare infrastructure and resolve deferred action items before Epic 5: Results & Profile Sharing begins

**Sprint Goal:** Complete 7 preparation tasks enabling Epic 5 Stories 1-3 to start with unblocked dependencies

**Team Capacity:** Charlie (Senior Dev) + Elena (Junior Dev) + Alice (Product Owner)

**Total Estimated Effort:** 24-26 hours

### Verified State (2026-02-08)

Upon verification, several items were already completed:
- **Task 1 (CORS):** ✅ Already implemented in `apps/api/src/middleware/better-auth.ts` with integration tests
- **Task 2 (Confidence Tests):** ✅ All 498 domain tests passing (including 23 confidence calculator tests)
- **Task 3 (OceanCode5 Type):** ✅ Implemented as template literal types, build passes, 695 tests passing
- **Task 4 (API Contract Template):** ✅ Created `docs/API-CONTRACT-SPECIFICATION.md`, referenced in CLAUDE.md
- **Task 5 (Facet Evidence Tracing):** Remaining - parallel with Epic 5

**Sprint Schedule:**
- **Day 1 (Feb 9):** Critical infrastructure fixes (CORS, templates)
- **Day 2 (Feb 10):** Deferred action items (confidence tests, type system)
- **Day 3 (Feb 11):** Verification & facet tracing prep

---

## Sprint Tasks by Priority

### **CRITICAL PRIORITY - Must Complete Before Epic 5 Starts** (13-15 hours)

#### **Task 1: Fix API CORS Configuration**
- **Owner:** Charlie (Senior Dev)
- **Status:** Not Started
- **Estimated Effort:** 2-3 hours
- **Type:** Infrastructure / Bug Fix
- **Priority:** 🔴 CRITICAL
- **Deadline:** 2026-02-09 EOD

**Description:**
7 E2E tests failing in Story 4-1 because API server has no CORS configuration. This blocks end-to-end testing for all Epic 5 features.

**Tasks:**
1. [ ] Review current CORS setup in API (`apps/api/src/index.ts`)
2. [ ] Add CORS middleware (npm package: `cors`)
3. [ ] Configure allowed origins: `http://localhost:3000`, production domain
4. [ ] Test: Run `pnpm test:integration` in Story 4-1 - expect 7 tests to pass
5. [ ] Verify in staging environment

**Success Criteria:**
- ✅ 7 previously failing E2E tests now pass
- ✅ CORS headers present in API responses
- ✅ No regressions in existing tests

**Dependencies:** None (can start immediately)

**Blocked By:** None

**Blocks:** All Epic 5 E2E testing

**Files to Modify:**
- `apps/api/src/index.ts` - Add CORS middleware
- `apps/api/src/server.ts` (if applicable) - Configure CORS settings

---

#### **Task 2: Fix 19 Confidence-Calculator Tests**
- **Owner:** Elena (Junior Dev)
- **Status:** Not Started
- **Estimated Effort:** 4-6 hours
- **Type:** Quality / Test Fixes
- **Priority:** 🔴 CRITICAL
- **Deadline:** 2026-02-10 EOD

**Description:**
Epic 3 deferred action: 19 failing tests in the domain package confidence calculator. Tests not in turbo test pipeline, blocking domain package quality baseline. This is foundational for confidence calculations used throughout the system.

**Tasks:**
1. [ ] Read test file: `packages/domain/src/utils/__tests__/confidence-calculator.test.ts`
2. [ ] Identify all 19 failing tests
3. [ ] Analyze failure patterns (same bug or multiple issues?)
4. [ ] Fix implementation in `confidence-calculator.ts`
5. [ ] Verify: `pnpm --filter=domain test` passes
6. [ ] Add domain tests to turbo test pipeline (check `turbo.json`)
7. [ ] Verify: `pnpm test:run` includes domain tests
8. [ ] Re-run full test suite to ensure no regressions

**Success Criteria:**
- ✅ All 19 tests passing
- ✅ Domain tests now in turbo pipeline
- ✅ `pnpm test:run` shows domain tests executing
- ✅ No regressions in other packages

**Dependencies:** None (parallel work with Task 1)

**Blocked By:** None

**Blocks:** OceanCode5 type implementation (Task 3)

**Files to Modify:**
- `packages/domain/src/utils/confidence-calculator.ts` - Implementation fixes
- `packages/domain/package.json` - Ensure test script exists
- `turbo.json` - Add domain to test pipeline (if needed)

---

#### **Task 3: Add OceanCode5 Branded Type**
- **Owner:** Charlie (Senior Dev)
- **Status:** Not Started
- **Estimated Effort:** 2-3 hours
- **Type:** Type System / Architecture
- **Priority:** 🔴 CRITICAL
- **Deadline:** 2026-02-10 EOD

**Description:**
Epic 3 deferred action: Create branded type for 5-letter OCEAN codes (e.g., "HHMHM"). Improves type safety in archetype pipeline, prevents accidental string mixing.

**Tasks:**
1. [ ] Create new file: `packages/domain/src/types/ocean-code.ts`
2. [ ] Define branded type: `type OceanCode5 = S.Brand<string, "OceanCode5">`
3. [ ] Export from `packages/domain/src/index.ts`
4. [ ] Update `generateOceanCode()` to return `OceanCode5`
5. [ ] Update archetype lookup to use branded type
6. [ ] Run type check: `pnpm turbo lint`
7. [ ] Verify: All type errors resolve with branded type applied

**Success Criteria:**
- ✅ OceanCode5 type created and exported
- ✅ Generators return branded type
- ✅ Type system enforces branded type where applicable
- ✅ No TypeScript errors after changes

**Dependencies:** Task 2 (confidence calculator baseline)

**Blocked By:** Task 2 completion (for type safety consistency)

**Blocks:** Story 5-1 implementation (evidence-based scoring uses archetypal type)

**Files to Create:**
- `packages/domain/src/types/ocean-code.ts` - New branded type

**Files to Modify:**
- `packages/domain/src/utils/ocean-code-generator.ts` - Return branded type
- `packages/domain/src/repositories/archetype.repository.ts` - Accept branded type
- `packages/domain/src/index.ts` - Export type

---

#### **Task 4: Update API Contract Specification Template**
- **Owner:** Alice (Product Owner)
- **Status:** Not Started
- **Estimated Effort:** 3-4 hours
- **Type:** Documentation / Process
- **Priority:** 🔴 CRITICAL
- **Deadline:** 2026-02-09 EOD

**Description:**
Create API contract specification template to prevent future ambiguity (precision vs. confidence issue in Story 4-2). Template includes mandatory fields for scale, units, validation rules, and examples.

**Tasks:**
1. [ ] Create file: `docs/API-CONTRACT-SPECIFICATION-TEMPLATE.md`
2. [ ] Define mandatory fields:
   - Contract name and purpose
   - Request structure with types
   - Response structure with types
   - **Scales/Units** (e.g., "confidence: 0-100 integer, NOT 0-1 decimal")
   - Validation rules (min/max, required fields, etc.)
   - Error responses
   - Example request/response
   - Notes/assumptions
3. [ ] Review with team (Charlie, Elena, Dana)
4. [ ] Add to project documentation index
5. [ ] Share with team via CLAUDE.md reference

**Success Criteria:**
- ✅ Template document created and documented
- ✅ Mandatory fields clearly specified
- ✅ Team acknowledges and understands template
- ✅ Guidance on using template in Story acceptance criteria

**Dependencies:** None (can happen in parallel)

**Blocked By:** None

**Blocks:** Epic 5 stories (guidance for contract clarity)

**Files to Create:**
- `docs/API-CONTRACT-SPECIFICATION-TEMPLATE.md` - Template documentation

**Files to Modify:**
- `CLAUDE.md` - Add reference to contract template in "Common Patterns"

---

### **PARALLEL PREPARATION - Can Overlap with Epic 5 Early Stories** (12-16 hours)

#### **Task 5: Implement Facet Evidence Tracing Infrastructure**
- **Owner:** Charlie (Senior Dev) + Elena (Junior Dev)
- **Status:** Not Started
- **Estimated Effort:** 12-16 hours
- **Type:** Feature / Data Architecture
- **Priority:** 🟡 HIGH (Parallel, don't block)
- **Deadline:** Before Story 5-3 starts (est. 2026-02-12)

**Description:**
New infrastructure for Story 5-3 (evidence highlighting). Track which messages contributed to each facet score. Required for "View Evidence" functionality that shows supporting quotes.

**Tasks:**
1. [ ] Design facet evidence data structure:
   ```typescript
   interface FacetEvidence {
     facetName: FacetName;
     messageId: MessageId;
     contribution: number; // 0-1 score contribution
     facetScoreBefore: number;
     facetScoreAfter: number;
   }
   ```
2. [ ] Add `facetEvidence[]` to session schema in Drizzle
3. [ ] Update `send-message.use-case.ts` to capture evidence:
   - When Scorer runs (every 3 messages)
   - Calculate per-message facet contributions
   - Store in session.facetEvidence
4. [ ] Create `get-facet-evidence.use-case.ts`:
   - Input: sessionId, facetName
   - Output: array of FacetEvidence items sorted by contribution
5. [ ] Create HTTP endpoint: `GET /api/sessions/{id}/evidence/{facet}`
6. [ ] Add tests:
   - [ ] Unit test: facet contribution calculation
   - [ ] Integration test: evidence retrieval
   - [ ] E2E test: evidence panel displays correctly
7. [ ] Verify in Storybook: EvidencePanel component can consume endpoint

**Success Criteria:**
- ✅ Facet evidence structure designed and tested
- ✅ Evidence captured during assessment
- ✅ Evidence retrieval endpoint functional
- ✅ Evidence tracing integrated with existing assessment flow
- ✅ Story 5-3 can consume evidence data

**Dependencies:**
- Task 1 (CORS) - for E2E testing of evidence endpoint
- Task 2 (confidence tests) - for calculation consistency
- Story 4-3 (session resumption) - existing session infrastructure

**Blocked By:** None (can start immediately, finish before Story 5-3)

**Blocks:** Story 5-3 implementation

**Parallelization Strategy:**
- **Charlie:** Data model + scoring integration (Days 1-2)
- **Elena:** Tests + endpoint (Days 2-3)
- Both coordinate on schema design Day 1

**Files to Create:**
- `packages/infrastructure/src/repositories/facet-evidence.drizzle.repository.ts` - Data access
- `apps/api/src/use-cases/get-facet-evidence.use-case.ts` - Business logic
- `packages/contracts/src/http/groups/evidence.ts` - HTTP contract

**Files to Modify:**
- `packages/infrastructure/src/db/schema.ts` - Add facetEvidence table
- `apps/api/src/use-cases/send-message.use-case.ts` - Capture evidence
- `apps/api/src/handlers/assessment.ts` - Route evidence endpoint

---

### **OPTIONAL - Nice-to-Have Preparation** (0-4 hours)

#### **Task 6: Design & Build Result UI Components**
- **Owner:** Elena (Junior Dev)
- **Status:** Backlog
- **Estimated Effort:** 8-10 hours
- **Type:** UI Components
- **Priority:** 🟢 OPTIONAL (Story 5-1 starts these)
- **Deadline:** Before Story 5-1 development

**Description:**
Create Storybook stories for result display components (ArchetypeCard, FacetBreakdown, EvidencePanel). Not blocking - part of normal Story 5-1 development.

**Note:** This is standard feature work and should be done as part of Story 5-1 development, not as prep. Skipping from prep plan.

---

## Sprint Schedule - Day by Day

### **Day 1: Feb 9, 2026 - Critical Infrastructure**

**Morning (4-5 hours):**
- [ ] Charlie: CORS configuration setup (Task 1)
- [ ] Alice: API contract template documentation (Task 4)

**Afternoon (2-3 hours):**
- [ ] Elena: Begin confidence-calculator test review (Task 2)
- [ ] Charlie: Review and test CORS fixes

**EOD Goals:**
- ✅ CORS configuration deployed and 7 E2E tests passing
- ✅ API contract template completed and shared
- ✅ Confidence calculator tests analyzed, fix strategy clear

---

### **Day 2: Feb 10, 2026 - Type System & Tests**

**Morning (4-6 hours):**
- [ ] Elena: Complete confidence-calculator test fixes (Task 2)
- [ ] Charlie: Begin OceanCode5 type implementation (Task 3)

**Afternoon (2-3 hours):**
- [ ] Charlie: Complete OceanCode5 type with tests
- [ ] Elena: Verify turbo test pipeline includes domain tests

**EOD Goals:**
- ✅ 19 confidence-calculator tests passing
- ✅ OceanCode5 branded type implemented and type-safe
- ✅ All critical prep tasks complete
- ✅ Ready to start Epic 5

---

### **Day 3: Feb 11, 2026 - Parallel Infrastructure Work**

**Morning/Afternoon (4-6 hours):**
- [ ] Charlie + Elena: Begin facet evidence tracing (Task 5)
- [ ] Design data model
- [ ] Create Drizzle schema
- [ ] Start evidence capture logic

**EOD Goals:**
- ✅ Facet evidence design complete
- ✅ Schema and initial implementation in progress
- ✅ Ready to parallelize with Epic 5 stories

**Note:** Task 5 continues beyond Day 3 and completes before Story 5-3 starts (est. Feb 12-13)

---

## Dependency Graph

```
Task 1 (CORS)
├─ Unblocks: All E2E testing for Epic 5
└─ Blocks: None (independent)

Task 2 (Confidence Tests)
├─ Unblocks: Task 3 (type system consistency)
├─ Blocks: Task 3 (type safety baseline)
└─ Deferred from: Epic 3

Task 3 (OceanCode5 Type)
├─ Depends on: Task 2 (test baseline)
├─ Unblocks: Story 5-1 (type-safe archetype pipeline)
└─ Deferred from: Epic 3

Task 4 (API Contract Template)
├─ Unblocks: Future API clarity
├─ Blocks: None (documentation)
└─ Prevents: Future precision/confidence confusion

Task 5 (Facet Evidence Tracing)
├─ Depends on: Task 1 (CORS for E2E testing)
├─ Unblocks: Story 5-3 (evidence highlighting)
├─ Blocks: Story 5-3 functionality
└─ Can parallelize: With Epic 5 Stories 1-2
```

---

## Resource Allocation

**Charlie (Senior Dev):**
- Task 1: CORS configuration (2-3 hrs, Day 1)
- Task 3: OceanCode5 type (2-3 hrs, Day 2)
- Task 5: Facet evidence tracing lead (6-8 hrs, Days 2-3+)
- **Total: 10-14 hours**

**Elena (Junior Dev):**
- Task 2: Confidence calculator tests (4-6 hrs, Days 1-2)
- Task 5: Facet evidence testing (4-6 hrs, Days 2-3+)
- **Total: 8-12 hours**

**Alice (Product Owner):**
- Task 4: API contract template (3-4 hrs, Day 1)
- Review and sign-off (1 hr)
- **Total: 4-5 hours**

**Total Team Effort:** 22-31 hours across 3 days (manageable with parallel work)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| CORS config not sufficient for E2E | Low | High | Test thoroughly on Day 1, have API team review |
| Confidence test fixes reveal deeper issues | Medium | Medium | Analyze all 19 failures together before coding |
| OceanCode5 type causes refactoring cascade | Medium | Low | Start with generators, expand gradually |
| Facet evidence schema needs redesign | Low | Medium | Design review on Day 2 before coding |

---

## Success Criteria

**Sprint Success = All Critical Tasks Complete:**

- ✅ Task 1: CORS fixed, 7 E2E tests passing
- ✅ Task 2: 19 tests passing, domain tests in turbo pipeline
- ✅ Task 3: OceanCode5 type implemented, zero TypeScript errors
- ✅ Task 4: API contract template documented and shared

**Bonus (Not blocking Epic 5 start):**
- ✅ Task 5: Facet evidence design complete, 50% implementation

---

## Epic 5 Readiness Checkpoint

**Before Epic 5 Starts, Verify:**

- [ ] CORS passes E2E test
- [ ] Confidence tests passing
- [ ] OceanCode5 type implemented
- [ ] API contract template reviewed by team
- [ ] Epic 5 sprint plan created and ready

**Date:** 2026-02-11 EOD

---

## Handoff to Epic 5

**When ready to start Epic 5:**

1. Run: `/bmad-bmm-create-story epic=5 story=1`
2. Assign to Elena (Junior Dev)
3. Start with ArchetypeCard component (prerequisite UI)

**Parallel work:**
- Charlie + Elena continue Task 5 (facet evidence tracing) during Epic 5 early stories
- Complete before starting Story 5-3

---

## Document References

- **Epic 4 Retrospective:** `epic-4-retro-2026-02-08.md` (action items source)
- **Epics Definition:** `epics.md` (Epic 5 stories)
- **Sprint Status:** `sprint-status.yaml` (track completion)

---

## Notes for Team

**From Retrospective:**
- API contract clarity is critical (precision vs. confidence issue in Story 4-2)
- Code review catches issues early - continue rigorous reviews
- Configuration spikes save time when isolated
- Team agreements going forward: test-first, code review checklist for contracts

**Action Items Reference:**
All tasks in this sprint correspond to action items from Epic 4 retrospective (epic-4-retro-2026-02-08.md)

---

**Sprint Plan Created:** 2026-02-08 by Bob (Scrum Master)
**Status:** 🟢 Ready for Development
**Next Action:** Begin Day 1 tasks (CORS configuration, API template documentation)
