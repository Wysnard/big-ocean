# Sprint Parallelism Plan

**Last Updated:** 2026-02-27
**Sprint:** Post-Epic 15 — remaining stories in Epic 14 (+ deferred Epic 6)

---

## Remaining Stories (3 active + 3 deferred)

| Story | Name | Blocked By | Domain |
|-------|------|------------|--------|
| 14-2 | Invitation System | — (14-1 done) | backend + frontend |
| 14-3 | Invitee Assessment Flow | 14-2 | full-stack |
| 14-4 | Relationship Analysis Generation | 14-3 | backend LLM |

**Phase 2 deferred (EU launch):** 6-1, 6-2, 6-3 — not included in active plan.
**Removed from sprint:** 8-5 (2026-02-27)

---

## Step 1: Invitation System (1 story)

| Story | Mode | Notes |
|-------|------|-------|
| 14-2 Invitation System | parallel | 14-1 done; credits & purchase flow exists |

**Gate:** Story above must be done before proceeding to Step 2.

## Step 2: Invitee Flow (1 story)

| Story | Mode | Notes |
|-------|------|-------|
| 14-3 Invitee Assessment Flow | sequential | Depends on 14-2 invitations |

**Gate:** Story above must be done before proceeding to Step 3.

## Step 3: Capstone (1 story)

| Story | Mode | Notes |
|-------|------|-------|
| 14-4 Relationship Analysis Generation | sequential | Depends on 14-3 invitee flow; LLM-heavy |

**Gate:** Epic 14 complete.

---

## Lane View

```
LANE A (Relationships)
──────────────────────
14-2 Invitation system
  │  (backend+frontend)
  ▼
14-3 Invitee flow
  │  (full-stack)
  ▼
14-4 Relationship analysis
  │  (backend LLM)
  ▼
─── done ───
```

---

## Conflict Matrix

Files likely modified by multiple stories:

| Shared File | 14-2 | 14-3 | 14-4 |
|-------------|------|------|------|
| `contracts/src/http/groups/` | ✏️ | | |
| `api/src/handlers/` | ✏️ | | ✏️ |
| `infrastructure/src/repositories/` | ✏️ | ✏️ | ✏️ |
| `infrastructure/src/db/drizzle/schema.ts` | ✏️ | | |
| `front/src/routeTree.gen.ts` | ✏️ | ✏️ | ✏️ |

**Note:** All 3 stories are sequential — no parallel merge conflicts.

---

## Merge Queue

| # | Story | Branch | Rebase After |
|---|-------|--------|--------------|
| 1 | 14-2 Invitation system | `feat/story-14-2-*` | master |
| 2 | 14-3 Invitee flow | `feat/story-14-3-*` | after 14-2 merge |
| 3 | 14-4 Relationship analysis | `feat/story-14-4-*` | after 14-3 merge |

---

## Principles

- **Story-level granularity** — split by story, not epic
- **Agent-agnostic lanes** — assign as many agents as available
- **Updated alongside sprint-status** — SM refreshes after each story completes
- **Don't force parallelism** — sequence where natural dependencies exist
