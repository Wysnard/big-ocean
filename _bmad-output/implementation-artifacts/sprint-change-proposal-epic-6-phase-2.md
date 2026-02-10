# Sprint Change Proposal: Move Epic 6 to Phase 2

**Date:** 2026-02-10
**Project:** big-ocean
**Change Type:** Epic Phase Reassignment
**Status:** ✅ APPROVED
**Approved By:** Vincentlay (Product Owner)

---

## Executive Summary

**Change:** Move Epic 6 (Privacy & Data Management) from Phase 1 to Phase 2

**Impact:** Accelerates Phase 1 MVP by 2-3 weeks, enables US-only launch with basic privacy controls, defers full GDPR compliance to Phase 2 for EU market expansion.

**Rationale:** Strategic scope reduction to focus Phase 1 on core assessment functionality (Epics 1-5) and faster product-market fit validation. Basic privacy foundation (TLS, Better Auth, default-private profiles) sufficient for US-only MVP. Full GDPR compliance (encryption at rest, data deletion/portability, audit logging) required only for EU launch in Phase 2.

---

## 1. Identified Issue

### Problem Statement

Epic 6 (Privacy & Data Management) includes comprehensive GDPR compliance work that blocks Phase 1 completion and delays MVP launch. The epic's 3 stories represent significant implementation effort:
- Story 6.1: Server-Side Encryption at Rest (AES-256-GCM + key management)
- Story 6.2: GDPR Compliance (data deletion/portability endpoints)
- Story 6.3: Audit Logging (comprehensive access logging infrastructure)

This work is **not required for US-only MVP** but was originally scoped as "Must Have" for Phase 1.

### Context

- PRD specifies "US launch first, add EU/Asia after PMF validation" (line 59)
- PRD originally listed GDPR as "Must Have" but also prioritizes US market (lines 59, 793)
- Epic 6 documentation states it's a "cross-cutting concern" with implementation following Epics 2-5
- Current Phase 1 already includes basic privacy via Better Auth (Epic 1) and private-by-default profiles (Epic 5)

### Discovery

Strategic scope review identified that full GDPR compliance isn't MVP-critical if launching US-only. Deferring Epic 6 to Phase 2:
- Accelerates time-to-market by **2-3 weeks**
- Reduces Phase 1 scope to **core value delivery** (assessment + sharing)
- Aligns with business strategy (US-first launch)
- Avoids over-engineering for 500-user validation

---

## 2. Epic Impact & Artifact Changes

### Epic-Level Changes

| Epic | Current Phase | New Phase | Status | Rationale |
|------|---------------|-----------|--------|-----------|
| Epic 1: Infrastructure & Auth | Phase 1 | Phase 1 | ✅ No Change | Foundational |
| Epic 2: Assessment Backend | Phase 1 | Phase 1 | ✅ No Change | Core functionality |
| Epic 3: OCEAN Archetype System | Phase 1 | Phase 1 | ✅ No Change | Results engine |
| Epic 4: Frontend Assessment UI | Phase 1 | Phase 1 | ✅ No Change | User interface + basic privacy controls |
| Epic 5: Results & Profile Sharing | Phase 1 | Phase 1 | ✅ No Change | Sharing + default-private profiles |
| **Epic 6: Privacy & Data Management** | **Phase 1** | **Phase 2** | **🔄 MOVED** | **GDPR not needed for US-only MVP** |

### Phase Structure

**Phase 1 (US MVP - 500 Users):**
- Epic 1: Infrastructure & Auth (TLS, Better Auth)
- Epic 2: Assessment Backend (core functionality)
- Epic 3: OCEAN Archetype System (archetype generation)
- Epic 4: Frontend Assessment UI (basic privacy UI)
- Epic 5: Results & Profile Sharing (default-private profiles)

**Phase 2 (EU Launch - 1k-5k Users):**
- **Epic 6: Privacy & Data Management** (full GDPR compliance)
  - Story 6.1: Server-Side Encryption at Rest
  - Story 6.2: GDPR Compliance (deletion, portability)
  - Story 6.3: Audit Logging

### Artifacts Updated

✅ **1. sprint-status.yaml**
- Added comment to Epic 6 section noting phase move
- Documented rationale and Phase 1 privacy coverage

✅ **2. epics.md**
- Updated Epic 6 metadata: `phase: 2`
- Added "Phase 1 Privacy Coverage" checklist (TLS, Better Auth, RLS, default-private)
- Added "Phase 2 Additions" section (encryption at rest, GDPR, audit logging)
- Updated "Critical" note to reflect US-only MVP scope

✅ **3. PRD (_bmad-output/planning-artifacts/prd.md)**
- **MVP Section (lines 783-806):**
  - Changed "Must Have" to "Must Have (US-Only Launch)"
  - Removed "EU GDPR compliance" from Must Have list
  - Added "Basic privacy foundation" to Must Have list
  - Added GDPR to "Explicitly NOT in MVP" section
  - Added EU/Asia launch to deferred features

- **Growth Features Section (lines 809-828):**
  - Added "EU Launch + GDPR Compliance (Epic 6)" as first Phase 2 item

- **Privacy & Data Protection Section (lines 180-220):**
  - Restructured "Technical Privacy Requirements" to show phased implementation
  - **Phase 1:** TLS 1.3, Better Auth, default-private, RLS, no training, privacy policy
  - **Phase 2:** AES-256-GCM encryption, audit logging, GDPR compliance, security audits

- **Compliance & Governance Section (lines 206-218):**
  - Restructured to show phased compliance approach
  - **Phase 1:** Basic US compliance (consent, data retention, privacy by design)
  - **Phase 2:** Full GDPR (deletion/portability, EU compliance, DPA)
  - **Phase 3:** Asia expansion compliance

✅ **4. Architecture Decision Records (ADR-3)**
- Updated "Privacy Controls" section to document phased implementation
- **Phase 1:** TLS 1.3, Better Auth, RLS, default-private, API filtering, URL privacy
- **Phase 2:** AES-256-GCM encryption at rest, GDPR deletion/portability, audit logging

✅ **5. CLAUDE.md**
- Added new "Privacy Implementation Strategy (Phased Approach)" section
- Documents Phase 1 basic privacy foundation (5 controls)
- Documents Phase 2 full GDPR compliance (3 stories)
- Explains rationale for phase move (US-first launch, PMF validation)

---

## 3. Recommended Path Forward

### Selected Approach

**Move Epic 6 to Phase 2** (full scope intact, timeline delayed)

### Justification

**1. Accelerates MVP Delivery**
- Removes 3 complex stories from Phase 1 critical path
- Epic 6 has longest implementation time (encryption, compliance flows, audit infrastructure)
- Estimated time savings: **2-3 weeks** off Phase 1 timeline

**2. Aligns with Business Strategy**
- PRD already specifies "US launch first" (line 59)
- MVP target is 500 users for PMF validation - US market sufficient
- GDPR only legally required for EU operations
- Deferring EU launch to Phase 2 is strategically sound

**3. Maintains Core Privacy**
- Phase 1 still includes:
  - ✅ Better Auth with 12+ char passwords + compromised credential checks (Epic 1)
  - ✅ TLS 1.3 encryption in transit (Epic 1)
  - ✅ Private-by-default profiles (Epic 5)
  - ✅ Explicit sharing controls (Epic 5)
  - ✅ PostgreSQL RLS for data access control (Epic 2)
- This satisfies US privacy expectations for MVP

**4. Risk Mitigation**
- **Market Risk:** US-only launch still tests core product hypothesis
- **Technical Risk:** Deferring doesn't create technical debt (architecture supports Phase 2 addition)
- **Legal Risk:** US compliance (CCPA) less strict than GDPR, manageable without full audit logging
- **User Trust Risk:** Basic privacy controls + clear messaging ("EU support coming Phase 2") maintains trust

**5. Preserves Future Optionality**
- Epic 6 scope unchanged, just delayed
- Can still launch EU in Phase 2 with full GDPR compliance
- If MVP fails, avoided expensive compliance work

### Alternatives Considered

❌ **Keep Epic 6 in Phase 1:** Delays MVP by 2-3 weeks, over-engineers for US-only launch

⚠️ **Split Epic 6:** Adds complexity (two partial epics), unclear value (basic privacy already in Epics 1, 4, 5)

✅ **Move to Phase 2 (chosen):** Clean separation, clear scope, aligns with business strategy

---

## 4. PRD MVP Impact & Action Plan

### MVP Impact

**Scope Change:** YES - GDPR compliance removed from MVP scope

**Launch Geography:** Explicitly US-only for Phase 1 (already implied in PRD)

**Timeline:** Accelerated by 2-3 weeks (Epic 6 no longer blocking)

**Success Criteria:** Unchanged (500 users, completion rate, sharing rate, NPS)

### High-Level Action Plan

**Step 1: Update Planning Artifacts (Immediate)** ✅ COMPLETED
- [x] Update PRD "MVP Scope" section to clarify US-only launch
- [x] Move Epic 6 to Phase 2 in epics.md
- [x] Update ADR-3 to document phased privacy approach
- [x] Update sprint-status.yaml with Epic 6 phase change
- [x] Update CLAUDE.md with phased privacy implementation notes

**Step 2: Communicate Scope Change (Before Implementation)**
- [ ] Update team on Epic 6 phase move (if applicable)
- [ ] Document "Phase 1 Privacy Checklist" for team reference:
  - ✅ TLS 1.3 on all endpoints
  - ✅ Better Auth password security
  - ✅ Default-private profiles
  - ✅ PostgreSQL RLS
  - ⛔ Encryption at rest (Phase 2)
  - ⛔ GDPR deletion/portability (Phase 2)
  - ⛔ Audit logging (Phase 2)

**Step 3: Verify Phase 1 Completeness (During Implementation)**
- [ ] Confirm Epic 1 includes TLS configuration
- [ ] Confirm Epic 5 includes "private by default" toggle
- [ ] Add privacy messaging to UI: "Your data is private. EU compliance coming in Phase 2."

**Step 4: Plan Phase 2 Transition (Post-MVP)**
- [ ] After 500-user MVP validation, prioritize Epic 6 for EU launch
- [ ] Budget 3-4 weeks for Epic 6 implementation
- [ ] Coordinate with legal team for GDPR compliance review (if needed)

### Dependencies & Sequencing

1. **Immediate** (before any Phase 1 work continues):
   - ✅ Update PRD and epics.md
   - ✅ Update architecture documentation
   - [ ] Communicate change to team (if applicable)

2. **During Phase 1 Implementation**:
   - [ ] Verify basic privacy features in Epics 1, 4, 5
   - [ ] Test privacy controls work as expected

3. **Before Phase 1 Launch**:
   - [ ] Legal review of US privacy compliance (if needed)
   - [ ] Messaging review ("EU support coming soon")

4. **Phase 2 Entry Criteria**:
   - [ ] 500+ users validated in US market
   - [ ] Product-market fit confirmed
   - [ ] Decision to expand to EU market

---

## 5. Agent Handoff Plan

### Handoff Recipients & Responsibilities

**1. Product Owner (Vincentlay)**
- **Responsibility:** Approve scope change and update PRD
- **Deliverables:**
  - ✅ Approve Sprint Change Proposal
  - ✅ Update PRD "MVP Scope" section
  - ✅ Confirm US-only launch strategy
- **Status:** ✅ COMPLETED

**2. Development Team / Technical Lead**
- **Responsibility:** Verify Phase 1 includes basic privacy features
- **Deliverables:**
  - [ ] Confirm Epic 1 (Infrastructure) includes TLS + Better Auth
  - [ ] Confirm Epic 5 (Profile Sharing) includes default-private controls
  - [ ] Review epic dependencies to ensure no blockers
- **Timeline:** Before starting future epic implementations

**3. Documentation / Knowledge Management**
- **Responsibility:** Update all planning artifacts
- **Deliverables:**
  - ✅ Update epics.md (move Epic 6 to Phase 2)
  - ✅ Update ADR-3 (add phased privacy section)
  - ✅ Update CLAUDE.md (document Phase 1 privacy scope)
  - ✅ Update sprint-status.yaml
  - ✅ Generate Sprint Change Proposal document
- **Status:** ✅ COMPLETED

### Success Criteria for Handoff

- ✅ All artifacts updated to reflect Epic 6 in Phase 2
- ✅ PRD clearly states US-only MVP launch
- ✅ Team understands Phase 1 privacy scope (basic controls, not full GDPR)
- ✅ No confusion about what's "Must Have" vs "Phase 2"
- ✅ Sprint Change Proposal documented for future reference

---

## 6. Summary of Changes

### Files Modified

1. ✅ `/Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/sprint-status.yaml`
   - Added comment to Epic 6 noting phase move to Phase 2

2. ✅ `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/epics.md`
   - Updated Epic 6 metadata: `phase: 2`
   - Added Phase 1/Phase 2 privacy breakdown
   - Updated critical note

3. ✅ `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/prd.md`
   - Updated "Must Have" to "Must Have (US-Only Launch)"
   - Removed GDPR from MVP, added to Phase 2
   - Restructured Privacy & Compliance sections with phased approach

4. ✅ `/Users/vincentlay/Projects/big-ocean/_bmad-output/planning-artifacts/architecture/architecture-decision-records.md`
   - Updated ADR-3 "Privacy Controls" to show Phase 1 vs Phase 2 implementation

5. ✅ `/Users/vincentlay/Projects/big-ocean/CLAUDE.md`
   - Added "Privacy Implementation Strategy (Phased Approach)" section
   - Documents rationale for Epic 6 phase move

6. ✅ `/Users/vincentlay/Projects/big-ocean/_bmad-output/implementation-artifacts/sprint-change-proposal-epic-6-phase-2.md`
   - This document (Sprint Change Proposal)

### Key Decisions

1. ✅ **Epic 6 moved from Phase 1 to Phase 2** (approved by Vincentlay)
2. ✅ **US-only launch for Phase 1 MVP** (deferred EU to Phase 2)
3. ✅ **Basic privacy foundation in Phase 1** (TLS, Better Auth, RLS, default-private)
4. ✅ **Full GDPR compliance in Phase 2** (encryption at rest, deletion/portability, audit logging)

---

## Approval Record

**Approver:** Vincentlay (Product Owner)
**Date:** 2026-02-10
**Decision:** APPROVED
**Method:** Interactive change analysis via `/bmad-bmm-correct-course` workflow

---

## Next Steps

1. ✅ Sprint Change Proposal approved and documented
2. ✅ All planning artifacts updated
3. [ ] Team notified of scope change (if applicable)
4. [ ] Continue Phase 1 implementation (Epics 1-5 only)
5. [ ] Verify basic privacy controls during implementation
6. [ ] Plan Epic 6 for Phase 2 after MVP validation

---

**End of Sprint Change Proposal**
