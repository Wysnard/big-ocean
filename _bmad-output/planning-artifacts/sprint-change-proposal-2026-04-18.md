# Sprint Change Proposal

**Project:** big-ocean  
**Date:** 2026-04-18  
**Author:** Correct Course workflow (AI-assisted)  
**Recipient:** Vincentlay  

---

## 1. Issue Summary

**Trigger:** A new **knowledge library article page layout** has been designed and validated (UX §21; dev direction routes). The user requested this work be **represented in user stories** for implementation tracking.

**Context:** Epic 12 (Knowledge Library) and stories 12.1–12.2 are marked **done** in `sprint-status.yaml`. Those stories covered routes, Schema.org, CTAs, sitemap, and content expansion — but **did not** decompose the **tier-specific article shell** (reading rail, responsive three-breakpoint grid, trait/facet/archetype spine modules, MDX anchor contract) now specified in **UX Design Specification §21** and the implementation gap table (§21.11).

**Evidence:**

- `ux-design-specification.md` §§21.1–21.11 (purpose, grid, reading rail, per-tier zones, MDX contract, a11y checklist, implementation direction).
- `architecture.md` ADR-49 references `KnowledgeArticleLayout` and library routes.
- Dev direction mockups: `/dev/library/direction/trait`, `/facet`, `/archetype` (cited in §21.1).

**Problem type:** **New requirement emerged** — layout system was specified in UX after (or parallel to) epic closure; backlog did not yet contain a story that encodes §21 for dev execution.

---

## 2. Impact Analysis

| Area | Impact |
|------|--------|
| **Epics** | **Epic 12** gains **Story 12.3**; epic should return to **in-progress** until 12.3 is delivered (or explicitly deferred). |
| **Stories** | New story **12.3** with acceptance criteria traced to §21; no change to 12.1/12.2 text (historical record). |
| **PRD** | **No conflict.** FR78–FR83 remain valid; §21 refines *how* article pages are presented, not whether the library exists. Optional: one line in FR78 notes could reference UX §21 for layout — **not required** if UX remains the layout SoT. |
| **Architecture** | **Minor alignment:** ADR-49 already names `KnowledgeArticleLayout`; §21.10 suggests shared chrome (e.g. reading rail). Update ADR-49 or a short addendum **when** implementation names stabilize — **not blocking** story creation. |
| **UX** | **No rewrite** — §21 is already the source of truth. Story 12.3 **references** it. |
| **Code / QA** | Implementation + visual QA against direction mockups; possible removal or alignment of dev-only direction routes after parity (§21.10). |

---

## 3. Recommended Approach

**Selected path:** **Direct adjustment (Option 1)** — add **Story 12.3** under Epic 12; reopen Epic 12 in sprint tracking until 12.3 is complete.

| Option | Assessment |
|--------|------------|
| **1. Direct adjustment** | **Viable.** Low process risk; clear AC from existing UX. **Effort:** Medium (layout refactor + MDX audit). **Risk:** Medium (responsive + scroll-spy edge cases). |
| **2. Rollback** | **Not viable** — no benefit to reverting 12.1/12.2. |
| **3. MVP / PRD review** | **Not required** — scope is UX refinement of an existing FR, not a product pivot. |

**Rationale:** The layout is already specified; the gap is **planning traceability** (stories ↔ UX). Adding one story avoids a new epic and keeps SEO library work together.

---

## 4. Detailed Change Proposals

### 4.1 `epics.md`

**Artifact:** `_bmad-output/planning-artifacts/epics.md`  
**Change:** Insert **Story 12.3: Knowledge Library Article Page Layout (UX §21)** immediately after Story 12.2 (before Epic 13).

**Rationale:** Implements the user request to “put that into stories” with testable acceptance criteria aligned to §21.5–§21.10.

### 4.2 `sprint-status.yaml`

**Artifact:** `_bmad-output/implementation-artifacts/sprint-status.yaml`  
**Changes:**

- `epic-12`: `done` → `in-progress` (new outstanding story).
- Add row: `12-3-knowledge-library-article-page-layout-ux-spec: backlog` (or `ready-for-dev` after story file exists, per team convention).

**Rationale:** Tracking must reflect open work; Epic 12 cannot remain `done` with an unimplemented story.

### 4.3 Optional follow-ups (not in initial diff)

- **Story file:** Create `12-3-*.md` in `implementation-artifacts` if the project uses per-story files for dev handoff.
- **Architecture:** One paragraph under ADR-49 when `LibraryArticleChrome` (or final name) lands.
- **PRD:** Optional cross-link from FR78 to UX §21 — only if you want requirements doc self-contained without opening UX.

---

## 5. Implementation Handoff

| Classification | **Moderate** — backlog and epic status updated; implementation is a focused front-end/content contract effort. |
|----------------|------------------------------------------------------------------------------------------------------------------|
| **Owner (implementation)** | Developer agent / frontend — `KnowledgeArticleLayout`, routes under `apps/front/src/routes/library/`, MDX under `content/library/`. |
| **Owner (backlog)** | Product owner — confirm Epic 12 reopen is acceptable; prioritize 12.3 vs other work. |
| **Success criteria** | Story 12.3 acceptance criteria pass; visual parity with direction mockups; §21.9 checklist satisfied; sprint-status shows 12.3 `done` and Epic 12 returns to `done` when appropriate. |

---

## 6. Checklist execution log (summary)

| Section | Status |
|---------|--------|
| 1. Trigger & context | **Done** — post-epic UX/layout spec not in stories |
| 2. Epic impact | **Done** — Epic 12 extended, not replaced |
| 3. Artifacts | **Done** — PRD OK; UX is SoT; arch minor note |
| 4. Path forward | **Done** — Direct adjustment |
| 5. Proposal components | **Done** — This document + epics/sprint-status updates |
| 6. Final review | **Pending** — your explicit approval if any process differs |

---

## 7. Approval

- [ ] I approve adding Story 12.3 and reopening Epic 12 as described.
- [ ] I approve the `sprint-status.yaml` changes.

*(Edits were applied in-repo for stories + sprint status; adjust or revert any line as needed.)*
