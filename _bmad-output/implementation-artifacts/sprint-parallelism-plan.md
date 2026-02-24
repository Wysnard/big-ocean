# Sprint Parallelism Plan

**Last Updated:** 2026-02-24
**Sprint:** Post-Epic 11 — remaining stories across Epics 8, 12, 14, 15

---

## Remaining Stories

| Story | Name | Blocked By | Domain |
|-------|------|------------|--------|
| 8-5 | Regenerate Portrait — Paid Tier | — (Epic 13 done) | backend portrait + monetization |
| 8-8 | Complete Archetype Library | — | domain content |
| 12-1 | Results Page & Trait Display | — (Epic 11 done) | frontend + backend results |
| 12-2 | Bidirectional Evidence Highlighting | 12-1 | frontend results |
| 12-3 | Teaser Portrait Generation & Display | 12-1 | frontend + backend portrait |
| 14-1 | Relationship Credits & Purchase Flow | — | backend monetization |
| 14-2 | Invitation System | 14-1 | backend + frontend |
| 14-3 | Invitee Assessment Flow | 14-2 | full-stack |
| 14-4 | Relationship Analysis Generation | 14-3 | backend LLM |
| 15-3 | Waitlist & Circuit Breaker | — | backend Redis + frontend |

**Phase 2 deferred (EU launch):** 6-1, 6-2, 6-3 — not included in this plan.

---

## Recommended Schedule

```
LANE A (Results)          LANE B (Relationships)     LANE C (Infra/Content)
────────────────          ──────────────────────     ──────────────────────

8-8  Archetype library    14-1 Credits & purchase    15-3 Waitlist+breaker
  │  (domain content)       │  (backend monetize)      │  (Redis+frontend)
  ▼                         ▼                          ▼
12-1 Results page         14-2 Invitation system     8-5  Portrait regen paid
  │  (frontend+backend)     │  (backend+frontend)     │  (backend portrait)
  ▼                         ▼                          ▼
12-2 Evidence highlight   14-3 Invitee flow          ─── done ───
  │  (frontend)             │  (full-stack)
  ▼                         ▼
12-3 Teaser portrait      14-4 Relationship analysis
  │  (frontend+backend)     │  (backend LLM)
  ▼                         ▼
─── done ───              ─── done ───
```

**Lane A rationale:** 8-8 first because 12-1 needs archetype data. Then 12-1→12-2→12-3 is a natural dependency chain.

**Lane B rationale:** 14-1→14-2→14-3→14-4 is strictly sequential — each story depends on the previous.

**Lane C rationale:** 15-3 and 8-5 are independent of each other but both small. Group them to free up a lane.

---

## Safety Indicators

- 🟢 No shared file conflicts between lanes
- 🟡 Minor overlap — coordinate merge order
- 🔴 Blocking dependency — must sequence

| Pair | Risk | Detail |
|------|------|--------|
| 8-8 ↔ 14-1 | 🟢 | Separate domains (archetype content vs payment) |
| 8-8 ↔ 15-3 | 🟢 | Separate domains (content vs Redis/waitlist) |
| 12-1 ↔ 14-1 | 🟡 | Both add contracts + handler routes — merge 12-1 first |
| 12-1 ↔ 15-3 | 🟡 | Both touch `api/src/index.ts` routes — last merger rebases |
| 12-3 ↔ 8-5 | 🟡 | Both touch portrait infrastructure — merge 12-3 first |
| 14-1 ↔ 15-3 | 🟢 | Separate domains (credits vs waitlist) |

---

## Merge Queue

Order matters — merge earlier items first to reduce rebase pain.

| # | Story | Branch | Rebase After |
|---|-------|--------|--------------|
| 1 | 8-8 Archetype library | `feat/story-8-8-*` | master |
| 2 | 15-3 Waitlist & breaker | `feat/story-15-3-*` | master |
| 3 | 14-1 Credits & purchase | `feat/story-14-1-*` | master |
| 4 | 12-1 Results page | `feat/story-12-1-*` | after 8-8 merge |
| 5 | 8-5 Portrait regen paid | `feat/story-8-5-*` | after 8-8 merge |
| 6 | 12-2 Evidence highlight | `feat/story-12-2-*` | after 12-1 merge |
| 7 | 14-2 Invitation system | `feat/story-14-2-*` | after 14-1 merge |
| 8 | 12-3 Teaser portrait | `feat/story-12-3-*` | after 12-2 merge |
| 9 | 14-3 Invitee flow | `feat/story-14-3-*` | after 14-2 merge |
| 10 | 14-4 Relationship analysis | `feat/story-14-4-*` | after 14-3 merge |

---

## Conflict Matrix

Files likely modified by multiple stories (check before parallel work):

| Shared File | 8-8 | 8-5 | 12-1 | 12-2 | 12-3 | 14-1 | 14-2 | 14-3 | 14-4 | 15-3 |
|-------------|-----|-----|------|------|------|------|------|------|------|------|
| `domain/src/constants/archetypes.ts` | ✏️ | | | | | | | | | |
| `contracts/src/http/groups/` | | | ✏️ | | | ✏️ | ✏️ | | | ✏️ |
| `api/src/index.ts` (routes) | | | ✏️ | | | ✏️ | | | | ✏️ |
| `api/src/handlers/` | | ✏️ | ✏️ | | ✏️ | ✏️ | ✏️ | | ✏️ | ✏️ |
| `infrastructure/src/repositories/` | | ✏️ | ✏️ | | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| `infrastructure/src/db/drizzle/schema.ts` | | | | | | ✏️ | ✏️ | | | ✏️ |
| `front/src/routeTree.gen.ts` | | | ✏️ | ✏️ | ✏️ | | ✏️ | ✏️ | ✏️ | ✏️ |
| Portrait components | | ✏️ | | | ✏️ | | | | | |

---

## Bottlenecks

| Bottleneck | Impact | Mitigation |
|------------|--------|------------|
| `contracts/` + `api/src/index.ts` barrel | 🟡 Multi-story route additions | Last merger rebases; barrel conflicts are trivial |
| `routeTree.gen.ts` auto-generated | 🟢 Auto-resolves | Regenerate after merge (`pnpm dev`) |
| Portrait infra (8-5 vs 12-3) | 🟡 Both touch portrait generation | Merge 12-3 first (teaser), then 8-5 (regen) |
| Epic 14 strict chain | 🟡 No parallelism within lane B | Accept sequential; focus parallel effort on A+C |
| `drizzle/schema.ts` new tables | 🟡 14-1, 14-2, 15-3 add tables | Merge 15-3 first (simplest), then 14-x in order |

---

## Principles

- **Story-level granularity** — split by story, not epic
- **Agent-agnostic lanes** — assign as many agents as available
- **Updated alongside sprint-status** — SM refreshes after each story completes
- **Don't force parallelism** — sequence where natural dependencies exist
