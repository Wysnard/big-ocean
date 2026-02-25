# Sprint Parallelism Plan

**Last Updated:** 2026-02-25
**Sprint:** Post-Epic 15 — remaining stories across Epics 6, 8, 12, 14

---

## Remaining Stories (11 stories across 4 epics)

| Story | Name | Blocked By | Domain |
|-------|------|------------|--------|
| 8-5 | Regenerate Portrait — Paid Tier | — (Epic 13 done) | backend portrait + monetization |
| 8-8 | Complete Archetype Library | — | domain content |
| 12-1 | Results Page & Trait Display | — (Epic 11 done) | frontend + backend results |
| 12-2 | Bidirectional Evidence Highlighting | 12-1 | frontend results |
| 12-3 | Teaser Portrait Generation & Display | 12-1 | frontend + backend portrait |
| 14-1 | Relationship Credits & Purchase Flow | — (Epic 13 done) | backend monetization |
| 14-2 | Invitation System | 14-1 | backend + frontend |
| 14-3 | Invitee Assessment Flow | 14-2 | full-stack |
| 14-4 | Relationship Analysis Generation | 14-3 | backend LLM |

**Phase 2 deferred (EU launch):** 6-1, 6-2, 6-3 — not included in active plan (requires all core epics complete first).

---

## Step 1: Foundation (3 stories, all parallel)

| Story | Mode | Notes |
|-------|------|-------|
| 8-8 Complete Archetype Library | parallel | Domain content only, no shared files |
| 12-1 Results Page & Trait Display | parallel | Frontend + backend results; needs archetype data from 8-8 ideally but not blocking |
| 14-1 Relationship Credits & Purchase Flow | parallel | Backend monetization, extends purchase_events |

**Gate:** All stories above must be done before proceeding to Step 2.

## Step 2: Core Features (3 stories, all parallel)

| Story | Mode | Notes |
|-------|------|-------|
| 12-2 Bidirectional Evidence Highlighting | parallel | Depends on 12-1 results page |
| 12-3 Teaser Portrait Generation & Display | parallel | Depends on 12-1 results page |
| 14-2 Invitation System | parallel | Depends on 14-1 credits |

**Gate:** All stories above must be done before proceeding to Step 3.

## Step 3: Advanced Features (3 stories, mixed)

| Story | Mode | Notes |
|-------|------|-------|
| 8-5 Regenerate Portrait — Paid Tier | parallel | Builds on portrait infrastructure from 12-3 |
| 14-3 Invitee Assessment Flow | parallel | Depends on 14-2 invitations |
| — | — | 8-5 and 14-3 have zero shared files |

**Gate:** All stories above must be done before proceeding to Step 4.

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

12-1 Results page         14-1 Credits & purchase    8-8  Archetype library
  │  (frontend+backend)     │  (backend monetize)      │  (domain content)
  ├───────────┐              ▼                          ▼
  ▼           ▼           14-2 Invitation system     ─── done ───
12-2 Evidence 12-3 Teaser    │  (backend+frontend)
  │  highlight   │  portrait   ▼
  ▼              ▼          14-3 Invitee flow
─── done ──── 8-5 Regen      │  (full-stack)
              paid tier       ▼
                ▼           14-4 Relationship analysis
              ─── done ───    │  (backend LLM)
                              ▼
                            ─── done ───
```

---

## Conflict Matrix

Files likely modified by multiple stories:

| Shared File | 8-8 | 8-5 | 12-1 | 12-2 | 12-3 | 14-1 | 14-2 | 14-3 | 14-4 |
|-------------|-----|-----|------|------|------|------|------|------|------|
| `contracts/src/http/groups/` | | | ✏️ | | | ✏️ | ✏️ | | |
| `api/src/index.ts` (routes) | | | ✏️ | | | ✏️ | | | |
| `api/src/handlers/` | | ✏️ | ✏️ | | ✏️ | ✏️ | ✏️ | | ✏️ |
| `infrastructure/src/repositories/` | | ✏️ | ✏️ | | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| `infrastructure/src/db/drizzle/schema.ts` | | | | | | ✏️ | ✏️ | | |
| `front/src/routeTree.gen.ts` | | | ✏️ | ✏️ | ✏️ | | ✏️ | ✏️ | ✏️ |
| Portrait components | | ✏️ | | | ✏️ | | | | |

---

## Merge Queue

| # | Story | Branch | Rebase After |
|---|-------|--------|--------------|
| 1 | 8-8 Archetype library | `feat/story-8-8-*` | master |
| 2 | 14-1 Credits & purchase | `feat/story-14-1-*` | master |
| 3 | 12-1 Results page | `feat/story-12-1-*` | after 8-8 merge |
| 4 | 12-2 Evidence highlight | `feat/story-12-2-*` | after 12-1 merge |
| 5 | 12-3 Teaser portrait | `feat/story-12-3-*` | after 12-1 merge |
| 6 | 14-2 Invitation system | `feat/story-14-2-*` | after 14-1 merge |
| 7 | 8-5 Portrait regen paid | `feat/story-8-5-*` | after 12-3 merge |
| 8 | 14-3 Invitee flow | `feat/story-14-3-*` | after 14-2 merge |
| 9 | 14-4 Relationship analysis | `feat/story-14-4-*` | after 14-3 merge |

---

## Principles

- **Story-level granularity** — split by story, not epic
- **Agent-agnostic lanes** — assign as many agents as available
- **Updated alongside sprint-status** — SM refreshes after each story completes
- **Don't force parallelism** — sequence where natural dependencies exist
