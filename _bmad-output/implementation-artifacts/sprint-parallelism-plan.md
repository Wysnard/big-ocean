# Sprint Parallelism Plan

**Last Updated:** 2026-02-25
**Sprint:** Post-Epic 15 — remaining stories across Epics 6, 8, 12, 14

---

## Remaining Stories (7 stories across 3 epics)

| Story | Name | Blocked By | Domain |
|-------|------|------------|--------|
| 8-8 | Complete Archetype Library | — | domain content |
| 12-2 | Bidirectional Evidence Highlighting | — (12-1 done) | frontend results |
| 12-3 | Teaser Portrait Generation & Display | — (12-1 done) | frontend + backend portrait |
| 14-1 | Relationship Credits & Purchase Flow | — (Epic 13 done) | backend monetization |
| 14-2 | Invitation System | 14-1 | backend + frontend |
| 14-3 | Invitee Assessment Flow | 14-2 | full-stack |
| 14-4 | Relationship Analysis Generation | 14-3 | backend LLM |

**Phase 2 deferred (EU launch):** 6-1, 6-2, 6-3 — not included in active plan (requires all core epics complete first).

---

## Step 1: Foundation + Results (5 stories, all parallel)

| Story | Mode | Notes |
|-------|------|-------|
| 8-8 Complete Archetype Library | parallel | Domain content only, no shared files |
| 12-2 Bidirectional Evidence Highlighting | parallel | 12-1 done; results page exists |
| 12-3 Teaser Portrait Generation & Display | parallel | 12-1 done; different results page section |
| 14-1 Relationship Credits & Purchase Flow | parallel | Backend monetization, extends purchase_events |

**Gate:** All stories above must be done before proceeding to Step 2.

## Step 2: Invitation System (1 story)

| Story | Mode | Notes |
|-------|------|-------|
| 14-2 Invitation System | sequential | Depends on 14-1 credits |

**Gate:** Story above must be done before proceeding to Step 3.

## Step 3: Invitee Flow (1 story)

| Story | Mode | Notes |
|-------|------|-------|
| 14-3 Invitee Assessment Flow | sequential | Depends on 14-2 invitations |

**Gate:** Story above must be done before proceeding to Step 4.

## Step 4: Capstone (1 story)

| Story | Mode | Notes |
|-------|------|-------|
| 14-4 Relationship Analysis Generation | sequential | Depends on 14-3 invitee flow; LLM-heavy |

**Gate:** Epic 14 complete.

---

## Lane View

```
LANE A (Results)          LANE B (Relationships)     LANE C (Content)
────────────────          ──────────────────────     ──────────────────
12-1 ✅ DONE
  ├───────────┐
  ▼           ▼           14-1 Credits & purchase    8-8  Archetype library
12-2 Evidence 12-3 Teaser    │  (backend monetize)      │  (domain content)
  │  highlight   │  portrait   ▼                          ▼
  ▼              ▼          14-2 Invitation system     ─── done ───
─── done ──── ─── done ──    │  (backend+frontend)
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

| Shared File | 8-8 | 12-2 | 12-3 | 14-1 | 14-2 | 14-3 | 14-4 |
|-------------|-----|------|------|------|------|------|------|
| `contracts/src/http/groups/` | | | | ✏️ | ✏️ | | |
| `api/src/index.ts` (routes) | | | | ✏️ | | | |
| `api/src/handlers/` | | | ✏️ | ✏️ | ✏️ | | ✏️ |
| `infrastructure/src/repositories/` | | | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| `infrastructure/src/db/drizzle/schema.ts` | | | | ✏️ | ✏️ | | |
| `front/src/routeTree.gen.ts` | | ✏️ | ✏️ | | ✏️ | ✏️ | ✏️ |
| Portrait components | | | ✏️ | | | | |

---

## Merge Queue

| # | Story | Branch | Rebase After |
|---|-------|--------|--------------|
| 1 | 8-8 Archetype library | `feat/story-8-8-*` | master |
| 2 | 12-2 Evidence highlight | `feat/story-12-2-*` | master (12-1 merged) |
| 3 | 12-3 Teaser portrait | `feat/story-12-3-*` | master (12-1 merged) |
| 4 | 14-1 Credits & purchase | `feat/story-14-1-*` | master |
| 5 | 14-2 Invitation system | `feat/story-14-2-*` | after 14-1 merge |
| 6 | 14-3 Invitee flow | `feat/story-14-3-*` | after 14-2 merge |
| 7 | 14-4 Relationship analysis | `feat/story-14-4-*` | after 14-3 merge |

---

## Principles

- **Story-level granularity** — split by story, not epic
- **Agent-agnostic lanes** — assign as many agents as available
- **Updated alongside sprint-status** — SM refreshes after each story completes
- **Don't force parallelism** — sequence where natural dependencies exist
