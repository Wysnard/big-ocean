# Sprint Change Proposal — Two-Tier Architecture Redesign

**Date:** 2026-02-22
**Author:** Vincentlay (via correct-course workflow)
**Status:** Approved (2026-02-22)

---

## 1. Issue Summary

### Problem Statement

Phase 1 of big-ocean is complete — all 8 epics (40+ stories) delivered successfully. The LangGraph-based assessment pipeline works but has architectural limitations identified through extensive design-thinking analysis (2026-02-20):

1. **Depth Spiral** — facet-only steering causes Nerin to drill into one life context (80% work evidence)
2. **Flat Evidence** — no context tags means portrait LLM must both analyze and narrate
3. **1D Steering** — no cross-context signal power, no domain diversity metrics
4. **BATCH/STEER/COAST Complexity** — LangGraph cadence routing adds unnecessary abstraction
5. **Portrait Overload** — portrait LLM receives flat evidence list without pre-organized structure
6. **Reframing Echo** — repetitive conversational patterns without domain-aware steering

### Discovery Context

These limitations were identified through 13 design prototypes (A-M) during a collaborative design-thinking session. The session produced:
- A complete architecture document (1543 lines) specifying the two-tier replacement
- New scoring formulas (facet score, confidence, signal power, steering)
- A context tagging system (6 life domains for cross-context deduction)
- 4 new epics with 19 stories covering the full implementation

### Trigger Classification

**Strategic evolution** — not a bug fix or emergency. Phase 1 is functionally complete and working. This is the next development phase improving core pipeline quality.

---

## 2. Impact Analysis

### Epic Impact

| Epic | Status | Impact |
|---|---|---|
| Old Epics 1-8 | **Done** (all) | No impact — remain as completed history |
| New Epic 1: Start a Conversation | **New** | Auth, sessions, Nerin chat, cold start |
| New Epic 2: Conversation Intelligence | **New** | Conversanalyzer, formulas, steering, cost guards |
| New Epic 3: Portrait & Results | **New** | Finanalyzer, scoring, portrait, results page |
| New Epic 4: Sharing & Public Profile | **New** | Shareable links, public archetype view |
| Old Epic 6 (GDPR, backlog) | Unaffected | Still deferred to Phase 2 EU launch |
| Old Epic 8, Story 8.5 (paid portrait) | **Review needed** | Portrait repository interface changes |

### Story Impact

- **0 existing stories modified** — all Phase 1 stories are complete and stay as-is
- **19 new stories created** across 4 new epics (already defined in `epics.md`)
- **~32 code files will be removed** (LangGraph, old pipeline, old repositories)
- **~25 code files will be added** (new repositories, formula module, evidence tables)
- **~20 code files will be modified** (send-message use-case, schema, contracts, handlers)

### Artifact Conflicts

| Artifact | Conflict | Action Needed |
|---|---|---|
| PRD (prd.md) | None — goals unchanged | No changes required |
| Architecture (new) | **Authoritative** | Already complete, use as-is |
| Architecture (docs/ARCHITECTURE.md) | Outdated after implementation | Update after implementation |
| CLAUDE.md | Multi-agent section references LangGraph | Update after implementation |
| UX Design Spec | No conflicts | No changes required |
| Sprint Status (sprint-status.yaml) | New epics need addition | **Action: Add new epics** |
| Epics (epics.md) | New document, already validated | Use as story source |

### Technical Impact

- **Database:** Clean-slate migration — drop assessment tables, recreate with two evidence tables + assessment_results + pgEnums
- **LangGraph:** Complete removal — graph, checkpointer, PostgresSaver, cadence routing
- **Dependencies:** No new dependencies (Haiku accessed via existing Anthropic SDK)
- **Infrastructure:** Docker/Railway deployment unchanged
- **Testing:** All pipeline tests need rewriting, new formula property-based tests

---

## 3. Recommended Approach

### Selected: Direct Adjustment (Option 1)

Add 4 new epics to sprint tracking as a new development phase. Old Phase 1 epics remain as completed history with a clear separator in sprint-status.yaml.

### Rationale

1. **Clean transition point** — all Phase 1 work is done, no in-progress disruption
2. **Architecture fully specified** — 1543-line document covers every interface, schema, pattern
3. **Stories fully defined** — 19 stories with acceptance criteria, FR coverage map validated
4. **No rollback needed** — Phase 1 code continues working until replaced
5. **5-phase migration sequence** already documented in architecture (Foundation → Infrastructure → Rewire → Cleanup → Frontend+Tests)

### Effort & Risk

- **Effort:** High — this is a major pipeline rewrite (77 files touched)
- **Risk:** Medium — clean-slate migration means no data migration complexity, but the scope is large
- **Timeline impact:** Adds a full development phase. Not a scope reduction — it's a quality improvement sprint.

### Alternatives Considered

- **Rollback:** Not applicable — nothing to roll back
- **MVP scope reduction:** Not applicable — MVP goals unchanged, this improves how goals are met

---

## 4. Detailed Change Proposals

### 4.1 Sprint Status Updates

**Add new epics to sprint-status.yaml:**

```yaml
# ─────────────────────────────────────────────────────────────────
# PHASE 2: Two-Tier Architecture Redesign
# Architecture: _bmad-output/planning-artifacts/architecture.md
# Epics/Stories: _bmad-output/planning-artifacts/epics.md
# ─────────────────────────────────────────────────────────────────

# EPIC 9 (New Epic 1): Start a Conversation with Nerin
epic-9: backlog
9-1-anonymous-assessment-start: backlog
9-2-send-message-and-nerin-response: backlog
9-3-user-registration-and-login: backlog
9-4-anonymous-to-authenticated-transition: backlog
9-5-chat-interface-and-conversation-ux: backlog

# EPIC 10 (New Epic 2): Conversation Intelligence
epic-10: backlog
10-1-conversation-evidence-schema-and-repository: backlog
10-2-conversanalyzer-haiku-analysis-on-every-message: backlog
10-3-formula-functions-facet-metrics-and-steering-target: backlog
10-4-steering-integration-smart-nerin-responses: backlog
10-5-message-count-progress-and-session-guards: backlog
10-6-cost-tracking-and-rate-limiting: backlog

# EPIC 11 (New Epic 3): Personality Portrait & Results
epic-11: backlog
11-1-finalization-evidence-schema-and-repository: backlog
11-2-assessment-results-schema-and-repository: backlog
11-3-finanalyzer-full-re-analysis-at-finalization: backlog
11-4-score-computation-and-ocean-code-generation: backlog
11-5-portrait-generation: backlog
11-6-generate-results-endpoint-and-finalization-pipeline: backlog
11-7-results-page-and-profile-viewing: backlog

# EPIC 12 (New Epic 4): Sharing & Public Profile
epic-12: backlog
12-1-shareable-link-generation: backlog
12-2-public-archetype-view: backlog
```

**Numbering rationale:** Continue from Epic 8 (last old epic) → Epic 9-12. This avoids confusion with old epic numbers while maintaining a single sequential numbering system.

### 4.2 Mark Story 7-18 as Done

```yaml
# Before:
7-18-conversation-to-portrait-transition-ux: in-progress

# After:
7-18-conversation-to-portrait-transition-ux: done
```

### 4.3 Mark Epic 7 as Done

With Story 7-18 now complete, all stories in Epic 7 are done:

```yaml
# Before:
epic-7: in-progress

# After:
epic-7: done
```

### 4.4 No PRD Changes

The PRD goals, success metrics, and scope remain unchanged. The new epics implement the same features with a better architecture.

### 4.5 CLAUDE.md Update (Post-Implementation)

After the new epics are implemented, CLAUDE.md needs:
- Remove "Multi-Agent System (LangGraph)" section
- Add "Two-Tier Analysis Architecture" section
- Update repository naming tables
- Update architecture layer descriptions
- Update error types inventory

**Not needed now** — update after implementation is complete.

---

## 5. Implementation Handoff

### Scope Classification: **Major**

This is a fundamental architectural redesign requiring new stories, new schemas, and a pipeline rewrite.

### Handoff Plan

| Role | Responsibility |
|---|---|
| **Scrum Master** | Add new epics to sprint-status.yaml, create story files via `/bmad-bmm-create-story` for each of the 19 stories |
| **Developer** | Implement stories following 5-phase migration sequence from architecture doc |
| **Architect** | Available for clarification — architecture document is the source of truth |

### Implementation Sequence

Per the architecture document, implementation follows a 5-phase order:

1. **Phase 1 — Foundation:** Domain constants, types, utils, repository interfaces (zero breaking changes)
2. **Phase 2 — Infrastructure:** Drizzle schema, pgEnums, new tables, migration, repository implementations
3. **Phase 3 — Rewire:** Rewrite send-message, add generate-results, update handlers/contracts
4. **Phase 4 — Cleanup:** Remove LangGraph code, old repositories, old use-cases
5. **Phase 5 — Frontend + Tests:** Update hooks, routes, rewrite tests

### Success Criteria

- All 19 stories reach `done` status
- Formula functions have 100% branch coverage with property-based tests
- Integration tests pass with MOCK_LLM=true
- E2E golden path test passes
- LangGraph dependencies fully removed from codebase
- `docs/ARCHITECTURE.md` and `CLAUDE.md` updated to reflect new architecture

---

## Checklist Summary

| Section | Status |
|---|---|
| 1.1 Triggering story | [x] Done — design-thinking strategic evolution |
| 1.2 Core problem | [x] Done — 6 pipeline limitations identified |
| 1.3 Evidence | [x] Done — 13 prototypes, complete architecture |
| 2.1 Current epic | [x] Done — all Phase 1 done |
| 2.2 Epic changes | [x] Done — add 4 new epics (9-12) |
| 2.3 Future epic review | [x] Done — Epic 6 unaffected, 8.5 needs review |
| 2.4 Invalidated/new epics | [x] Done — no invalidation, 4 new epics |
| 2.5 Epic ordering | [x] Done — sequential 9→10→11→12 |
| 3.1 PRD conflicts | [x] Done — no conflicts |
| 3.2 Architecture conflicts | [x] Done — new doc is authoritative |
| 3.3 UX conflicts | [N/A] — no UX impact |
| 3.4 Other artifacts | [x] Done — tests, CLAUDE.md, docs need update post-impl |
| 4.1 Direct adjustment | [x] Viable — recommended |
| 4.2 Rollback | [Not viable] — nothing to roll back |
| 4.3 MVP review | [Not viable] — MVP unchanged |
| 4.4 Recommended path | [x] Done — Direct Adjustment |
| 5.1-5.5 Proposal components | [x] Done — documented above |
