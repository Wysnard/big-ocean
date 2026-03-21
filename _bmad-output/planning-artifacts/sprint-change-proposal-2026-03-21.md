# Sprint Change Proposal — DRS Dead Code Cleanup

**Date:** 2026-03-21
**Triggered by:** Post-Phase 5 code hygiene — DRS (Depth Readiness Score) config fields remain in AppConfig after source code was deleted
**Scope:** Minor — Direct implementation by dev team
**Mode:** Incremental (all 7 proposals approved)

---

## Section 1: Issue Summary

The Depth Readiness Score (DRS) system was implemented in Story 21-2 (Phase 4, CEE Epic 1) as a single metric to drive conversation energy pacing. The pacing pipeline (Phase 5, Epics 23-27) replaced DRS with a more sophisticated multi-component system: E_target -> V2 Scorer (5-term additive formula) -> V2 Selector -> Move Governor -> Prompt Builder.

The DRS source files (`drs.ts`, `cold-start.ts`, `territory-scorer.ts`, old `e-target.ts`) and their tests were already deleted in commit `10fb788` (2026-03-13). However, **24 vestigial AppConfig fields** (18 DRS + 5 territory scoring + 1 cold-start) remain defined in the interface and all implementations/mocks. An outdated comment in `nerin-chat-context.ts` also references DRS.

No production code reads any of these 24 fields.

---

## Section 2: Impact Analysis

### Epic Impact
- **No epics affected.** All related epics (21-27) are already done.
- No new epics needed. No epics invalidated.
- No resequencing required.

### Story Impact
- No stories require modification. This is a standalone cleanup task.

### Artifact Conflicts
- **PRD:** No conflict.
- **Architecture:** No structural changes. The architecture already describes the pacing pipeline.
- **UI/UX:** No impact (backend config only).

### Technical Impact
- **AppConfigService interface** loses 24 fields — any code that references these fields will get a compile error (none exists in production).
- **7 files modified** across domain, infrastructure, and test layers.
- **Zero runtime behavior change** — these fields are read from env vars but never consumed.

---

## Section 3: Recommended Approach

**Selected: Direct Adjustment** (Option 1)

- **Effort:** Low — 7 files, deletion-only changes
- **Risk:** Low — removing unused interface fields; TypeScript compiler will catch any missed references
- **Timeline impact:** None — can be done in a single PR

**Rationale:** This is pure dead code removal. The TypeScript compiler guarantees safety — if any production code still reads a deleted field, the build will fail. All 24 fields have zero consumers in production code.

---

## Section 4: Detailed Change Proposals

### Proposal 1: Domain Interface — `packages/domain/src/config/app-config.ts`
Remove 24 fields from `AppConfigService` interface (lines 122-198):
- 18 DRS fields (`drsBreadthWeight` through `drsHeavyFitRange`)
- 5 Territory Scoring fields (`territoryMinEvidenceThreshold` through `territoryFreshnessMax`)
- 1 Cold-Start field (`territoryColdStartThreshold`)

### Proposal 2: Live Config Adapter — `packages/infrastructure/src/config/app-config.live.ts`
Remove 24 `Config.*` loaders from `configSchema` (lines 110-148).

### Proposal 3: Domain Mock — `packages/domain/src/config/__mocks__/app-config.ts`
Remove 24 mock values from `mockAppConfig` object (lines 51-77).

### Proposal 4: Test Config Factory — `packages/infrastructure/src/utils/test/app-config.testing.ts`
Remove 24 test default values from `defaultTestConfig` object (lines 58-84).

### Proposal 5: Session Linking Test — `apps/api/src/use-cases/__tests__/session-linking.use-case.test.ts`
Remove 24 inline AppConfig mock values (lines 97-117+).

### Proposal 6: Nerin Pipeline Test — `apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts`
Remove 24 inline AppConfig mock values (lines 341-361+).

### Proposal 7a: Send Message Fixtures — `apps/api/src/use-cases/__tests__/__fixtures__/send-message.fixtures.ts`
Remove 24 inline AppConfig mock values (lines 244-264+).

### Proposal 7b: Outdated Comment — `packages/domain/src/constants/nerin-chat-context.ts`
Update comment (line 13): "DRS and territory system" -> "pacing pipeline and territory system".

---

## Section 5: Implementation Handoff

**Scope classification:** Minor — Direct implementation by dev team.

**Handoff:** Development team implements all 7 proposals in a single PR.

**Implementation steps:**
1. Remove 24 fields from `AppConfigService` interface
2. Remove corresponding config loaders from `app-config.live.ts`
3. Remove values from mock, test config, and 3 test fixture files
4. Update stale DRS comment in `nerin-chat-context.ts`
5. Run `pnpm build` to verify no compile errors
6. Run `pnpm test:run` to verify all tests pass
7. Commit and open PR

**Success criteria:**
- Build passes with zero TypeScript errors
- All existing tests pass
- No references to `drs` prefix remain in `app-config.ts` or its implementations
- `grep -r "drsBreadth\|drsEngagement\|drsWord\|drsEvidence\|drsRecency\|drsEnergy\|drsLight\|drsMedium\|drsHeavy" packages/ apps/` returns zero results
