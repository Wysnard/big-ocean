# Sprint Change Proposal — FK Column Renames for ADR-39

**Date:** 2026-04-07
**Scope:** Minor
**Epic affected:** Epic 45 (Conversation Calibration — 15-Turn Assessment)
**Trigger:** ADR-39 specified "All FK references... updated to new names" but no story covered the downstream FK column renames

---

## 1. Issue Summary

ADR-39 mandated renaming assessment tables to conversation semantics. Stories 45-1 (table renames) and 45-2 (repo/domain layer) are complete. However, 7 FK columns across 6 downstream tables still use old naming (`assessment_session_id`, `session_id`, `assessment_message_id`). ADR-39's cascading rename table said "All FK references... updated to new names" but the story breakdown deliberately deferred FK column renames without creating follow-up stories.

**Discovery:** During Story 45-3 planning, the gap was identified. ADR-39 has now been updated with explicit column-by-column mapping tables.

---

## 2. Impact Analysis

### Epic Impact
- **Epic 45** — two stories added (1.4, 1.5), two stories renumbered (1.4→1.6, 1.5→1.7)
- No other epics affected

### Artifact Changes
- **Architecture (ADR-39):** Already updated with explicit FK column rename tables (done in this session)
- **Epics doc:** Two new stories added, two renumbered
- **Sprint status:** Two new story entries, two renumbered
- **PRD / UX Design:** No impact

### Technical Impact
- Story 45-5 (FK Column Code Cascade) will touch some files that 45-3 already modified — acceptable second pass
- No API contract changes (column names are internal to Drizzle schema)
- No frontend-visible changes

---

## 3. Recommended Approach

**Direct Adjustment** — add two stories to existing Epic 45, appended after the in-progress Story 45-3.

**Rationale:**
- The change is a natural continuation of the ADR-39 rename work already underway
- No rollback needed — 45-1 and 45-2 are correct and complete
- MVP scope unchanged
- Two-story split (DB migration first, then code cascade) follows the proven pattern from 45-1/45-2

---

## 4. Detailed Changes

### 4.1 Epics doc (`_bmad-output/planning-artifacts/epics.md`)

**Added:**
- Story 1.4: FK Column Migration — hand-written SQL migration for 7 column renames + index renames, Drizzle schema TS property updates
- Story 1.5: FK Column Code Cascade — repos, use-cases, handlers, mocks, tests, seeds updated to new property names

**Renumbered:**
- Story 1.4 (Turn Count) → Story 1.6
- Story 1.5 (Dead Code) → Story 1.7

**Epic scope line updated** to include "FK column renames (DB + code cascade)"

### 4.2 Sprint status (`_bmad-output/implementation-artifacts/sprint-status.yaml`)

**Added:**
- `45-4-fk-column-migration: backlog`
- `45-5-fk-column-code-cascade: backlog`

**Renumbered:**
- `45-4-assessment-turn-count-25-to-15` → `45-6-assessment-turn-count-25-to-15`
- `45-5-dead-code-cleanup` → `45-7-dead-code-cleanup`

### 4.3 Architecture (`_bmad-output/planning-artifacts/architecture.md`)

**ADR-39 updated** (done in this session) with:
- Explicit DB column rename table (7 columns across 6 tables)
- Drizzle TS property rename table (7 properties)
- Index rename table (8 indexes)
- Clear "what stays unchanged" list for `assessment_result_id` columns

---

## 5. Implementation Handoff

**Scope classification:** Minor — direct implementation by dev team

**Execution order:**
1. Finish 45-3 (handler/contract/frontend renames) — in progress now
2. 45-4 (FK Column Migration) — DB migration + Drizzle schema, minimal compile fixes
3. 45-5 (FK Column Code Cascade) — full TS property rename through repos/use-cases/tests
4. 45-6, 45-7 continue as before

**Success criteria:**
- All 7 FK columns renamed in DB
- All Drizzle TS properties consistent with new column names
- `pnpm typecheck`, `pnpm test:run`, `pnpm build` all pass
- No `assessment_session_id`, `assessment_message_id`, or `session_id` FK references remain (except in `assessment_results` table name and historical migrations)
