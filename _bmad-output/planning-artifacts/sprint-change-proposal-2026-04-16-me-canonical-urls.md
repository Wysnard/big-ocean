# Sprint Change Proposal — Canonical Me URLs & Legacy `/results` (2026-04-16)

**Project:** big-ocean  
**Author:** Correct Course workflow (BMad)  
**Stakeholder:** Vincentlay  
**Mode used for proposals:** Batch (full proposal in one document)

---

## Checklist execution record

### Section 1 — Understand the trigger and context

| ID | Item | Status | Notes |
|----|------|--------|-------|
| 1.1 | Triggering story | **Done** | Product/docs alignment initiative (PRD + UX §18.17 + `ux-design-addendum-me-canonical-urls.md`), not a single story ID. Related requirements: **FR93–FR95**, **FR101**, **FR16**. |
| 1.2 | Core problem | **Done** | **Type:** New requirement / stakeholder decision (canonical routing). **Statement:** Post-assessment identity must live under **`/me`** and **`/me/$conversationSessionId`** (with **`?view=portrait`** for focused reading). Legacy **`/results/*`** may remain only as **permanent redirects**; user-facing copy and deep links must not treat `/results` as the primary surface. |
| 1.3 | Evidence | **Done** | PRD `editHistory` and FR blocks updated (2026-04-16). UX spec §18.17 + editorial pass. **`epics.md`** and **`architecture.md`** still contain **`/results/$sessionId`** in story ACs, route tables, and ADR-46 flow — **artifact conflict**. |

### Section 2 — Epic impact assessment

| ID | Item | Status | Notes |
|----|------|--------|-------|
| 2.1 | Epic containing trigger | **Done** | Surfaced during **post-shipped** alignment; **Epics 2–3** (post-assessment + Me) are the functional home. **`sprint-status.yaml`** shows Epics **1–13** as **done** — epics are complete; this is **follow-up alignment**, not a failed epic. |
| 2.2 | Epic-level changes | **Done** | **No epic removal.** Optional: add **one small backlog epic or epic-level note** (“URL canonicalization — implementation”) if you want traceability; otherwise track as **1–2 stories** under maintenance / tech-debt. |
| 2.3 | Other epics | **Done** | **Epic 10** (emails): deep links must match canonical paths. **Epic 13** (a11y): route change must preserve focus/modal behavior. **Epic 1** story text still says BottomNav hidden on **`/results/...`** — should become **`/me/...?view=portrait`** in doc text. |
| 2.4 | Obsolete epics | **N/A** | None invalidated. |
| 2.5 | Epic order / priority | **Done** | If implemented: **before** broad marketing/email campaigns that bake in URLs — **sequencing risk** is bookmarked and shared links. |

### Section 3 — Artifact conflict and impact

| ID | Item | Status | Notes |
|----|------|--------|-------|
| 3.1 | PRD | **Done** | **Aligned** — FR93–95, FR101, journeys use `/me/$conversationSessionId`. |
| 3.2 | Architecture | **! Action-needed** | **`architecture.md`** still documents **`/results/$sessionId`** as primary portrait + full surfaces (e.g. lines ~629–658, ~842, ~1364–1368, ~2948–2953, ~3097–3104). **Update** ADR-43 / ADR-46 narrative, route tables, and file-path tree to **canonical `/me/$conversationSessionId`** + **redirect contract** for `/results/*`. |
| 3.3 | UI/UX | **Done** | **`ux-design-specification.md`** §18.17 + addendum define redirects and checklist. Residual **Known gap** (§12 etc.) is separate cleanup. |
| 3.4 | Other artifacts | **! Action-needed** | **`epics.md`**: multiple story lines still say **`/results/$conversationSessionId`** and “results page”. **`docs/FRONTEND.md`** / E2E: verify if they reference `/results` (spot-check when implementing). **CI/E2E:** update any tests that assert `/results` as the happy path. |

### Section 4 — Path forward evaluation

| Option | Viable? | Effort | Risk | Notes |
|--------|---------|--------|------|-------|
| **4.1 Direct adjustment** | **Yes** | Medium | Low | Implement canonical routes + redirects; update docs/tests; **no rollback** of Me/portrait features. |
| **4.2 Rollback** | **No** | — | High | Reverting shipped Me/post-assessment work would **not** simplify routing; **not recommended**. |
| **4.3 MVP review** | **N/A** | — | — | MVP scope unchanged — **URL contract** is an implementation + documentation alignment, not a scope cut. |

**Selected approach:** **Direct adjustment (4.1)**  
**Rationale:** PRD/UX already decided. Remaining work is **engineering + artifact sync** with clear acceptance criteria (redirects preserve query string, bookmarks work, in-app navigation emits canonical URLs per `CLAUDE.md`).

### Section 5 — Sprint change proposal components

| ID | Item | Status |
|----|------|--------|
| 5.1 | Issue summary | **Done** — see §1 below |
| 5.2 | Epic + artifact impact | **Done** — see §2 |
| 5.3 | Recommended path | **Done** — §4 |
| 5.4 | MVP impact + action plan | **Done** — see §3 “Recommended approach” |
| 5.5 | Handoff | **Done** — see §5 |

### Section 6 — Final review

| ID | Item | Status |
|----|------|--------|
| 6.1 | Checklist complete | **Done** |
| 6.2 | Proposal accuracy | **Done** (pending your review) |
| 6.3 | User approval | **[!] Action-needed** — approve or revise |
| 6.4 | `sprint-status.yaml` | **N/A** unless you add a new tracked story/epic; then add entry |
| 6.5 | Next steps | **Done** — see handoff |

---

## 1. Issue summary

**What triggered this:** A **product decision** to make **`/me`** the canonical identity home and **`/me/$conversationSessionId`** the session-scoped full surface, with **`?view=portrait`** for focused portrait reading. Legacy **`/results`** URLs are **redirect-only** (e.g. 308), preserving query strings for bookmarks and old emails.

**Why it matters now:** Planning artifacts (**PRD**, **UX**) were updated in **2026-04-16**, but **`architecture.md`** and parts of **`epics.md`** still describe the **pre-canonical** model where **`/results/$sessionId`** is the primary route. That creates **spec drift**, confusing implementers and reviewers, and risks **tests and deep links** staying on non-canonical paths.

**Evidence:** Grep-backed examples — `epics.md` still includes acceptance lines such as navigating to **`/results/$conversationSessionId?view=portrait`** and “full results page”; `architecture.md` route and ADR-46 tables still list **`/results/$sessionId`** as the main consumer path.

---

## 2. Impact analysis

### 2.1 Epic impact

| Area | Impact |
|------|--------|
| **Epics 1–3 (done)** | Logical owner of routing; **no need to mark epics “not done”** if shipped behavior is correct — treat as **documentation debt + optional follow-up story** for redirects/canonical paths. |
| **Epic 10** | Re-engagement / transactional emails: **deep links** should use canonical **`/me/...`** shapes (with note that redirects cover old links). |
| **Epic 13** | Any a11y work that hard-coded “results route” in copy or tests may need a **pass** after URL change. |

### 2.2 Story impact

- **Epic 2 / Epic 1 stories (text in `epics.md`):** Acceptance criteria should be **edited** so URLs read **`/me/$conversationSessionId`** (and BottomNav hidden on **`/me/...?view=portrait`**, not `/results/...`).
- **No automatic story file rewrites** assumed — **confirm** whether story files under `_bmad-output/implementation-artifacts` exist per story and update if they duplicate old paths.

### 2.3 Artifact conflicts

| Artifact | Conflict | Severity |
|----------|----------|----------|
| **PRD** | None (canonical paths present) | — |
| **UX spec** | None for §18.17; older §8–§14 “Known gap” remains separate | Low |
| **Epics** | Old `/results` strings in ACs | **Medium** |
| **Architecture** | ADR tables + flows still **`/results`-centric** | **High** (single source of false truth) |
| **Code** | **To verify:** `apps/front` routes, `Link`, `navigate`, e2e | **High** if not done |

### 2.4 Technical impact

- **TanStack Router:** New or moved route segment under **`/me/$conversationSessionId`** (exact file layout is an implementation choice; align with existing `routes/me/` and `routes/results/`).
- **Redirects:** **`/results`** and **`/results/$id`** → **`/me`** / **`/me/$id`**; preserve **`?view=portrait`**.
- **Tests:** Unit, integration, Playwright — update URL expectations.
- **Analytics:** If path-based funnel events exist, **event names or path filters** may need a migration note (internal analytics only per FR24).

---

## 3. Recommended approach

**Choice:** **Direct adjustment** — implement canonical routing + redirects, then **sync `architecture.md` and `epics.md`** to match PRD/UX.

**Effort:** **Medium** (routing + redirects + test sweep + doc sync).  
**Risk:** **Low** if redirects are comprehensive and tested; **Medium** if old links are scattered (emails, shared screenshots, third-party bookmarks).

**Rollback strategy:** Not applicable to “undo Me page” — if redirects misbehave, **fix forward** (redirect rules + tests).

---

## 4. Detailed change proposals

### 4.1 `architecture.md` (required)

**Sections to update (representative):**

- **Assessment completion flow** (~629): Replace **`/results/$sessionId?view=portrait`** with **`/me/$conversationSessionId?view=portrait`**; clarify **`/results/*` → `/me/*`** redirect.
- **Route tables** (~655–658, ~1364–1368, ~2948–2953, ~3097–3104): Same substitution; add **one row** for legacy redirect behavior.
- **Directory tree** (~1106–1107): Note **`me/$conversationSessionId`** (or equivalent) as canonical; **`results`** as redirect or thin shim — match actual repo after implementation.

**Rationale:** Architecture is the **technical single source** engineers read; it must not contradict PRD FR93–95.

### 4.2 `epics.md` (required)

**Pattern:** Global editorial pass on **Epic 1 Story 1.1**, **Epic 2** stories (2.x), and any line saying “results page” where **Me identity surface** is meant.

**Example edit pattern (illustrative):**

```
OLD: ...navigate to `/results/$conversationSessionId?view=portrait`
NEW: ...navigate to `/me/$conversationSessionId?view=portrait`

OLD: BottomNav hidden on ... /results/$id?view=portrait
NEW: BottomNav hidden on ... /me/$conversationSessionId?view=portrait
```

**Rationale:** Prevents future story implementations from reintroducing `/results` as primary.

### 4.3 Codebase (implementation handoff)

| Task | Acceptance hint |
|------|-----------------|
| Canonical routes | User reaches portrait + full identity at **`/me/...`** per PRD. |
| Redirects | **`/results`**, **`/results/$id`** 308 (or product-chosen status) to **`/me`**, **`/me/$id`**; **query string preserved**. |
| Navigation | **`Link`** / **`navigate()`** emit canonical URLs (`CLAUDE.md`). |
| Tests | Update assertions; add redirect tests. |

### 4.4 `sprint-status.yaml` (optional)

- **If** you add a named story (e.g. `3-x-me-canonical-routes-and-results-redirects`): add row with **`backlog`** or **`ready-for-dev`**.
- **If** work is **small and folded into maintenance**: **no YAML change** — checklist item 6.4 **N/A**.

---

## 5. Implementation handoff

| Field | Value |
|-------|--------|
| **Scope classification** | **Moderate** — engineering + doc sync; **no** full PM replan |
| **Primary owner** | **Developer** (routing, redirects, tests) |
| **Secondary** | **Tech writer / Architect** — `architecture.md` + `epics.md` sync |
| **PO** | Optional — only if new epic/story is created for tracking |

**Success criteria**

1. PRD FR93–95 behaviors work at **canonical** URLs.  
2. Legacy **`/results/*`** URLs **redirect** without breaking **`?view=portrait`**.  
3. **`architecture.md`** and **`epics.md`** contain **no** primary-path **`/results/$sessionId`** without “legacy / redirect” context.  
4. Automated tests pass; spot-check **email deep links** if applicable.

---

## 6. Approval

**Status:** **Approved** (2026-04-16) — implementation executed in-repo.

### Implementation summary (2026-04-16)

- **Frontend:** Added canonical route **`apps/front/src/routes/me/$conversationSessionId.tsx`** (session-scoped Me + `?view=portrait` portrait reading). Replaced **`results/$conversationSessionId.tsx`** with **`beforeLoad` redirect** to **`/me/$conversationSessionId`** preserving **`search`** (including `view=portrait`). Updated **`PostAssessmentTransitionButton`**, **`PortraitReadingView`**, **`login-form`**, **`results.tsx`** resume navigation, **`auth-session-linking`**, **`BottomNav`** (hide on **`/me/...?view=portrait`**), unit tests, and **`routeTree.gen.ts`** (via `vite build`).
- **E2E:** Playwright specs now use **`/me/`** URLs and **`waitForURL(/\/me\//)`** where applicable.
- **Planning artifacts:** **`architecture.md`** (ADR-15 flow, ADR-43 table, ADR-46, component boundary table, file tree) and **`epics.md`** story lines aligned to canonical paths + legacy redirect notes.

**Follow-up (optional):** HTTP **308** for legacy `/results/*` at the edge (CDN/Nitro) if strict non-JS clients must see permanent redirects; in-app navigation uses TanStack **`redirect`**.

---

_Correct Course workflow complete, Vincentlay!_
