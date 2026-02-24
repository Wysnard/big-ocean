# Sprint Parallelism Plan

**Last Updated:** 2026-02-24
**Sprint:** Post-Epic 11 (Epics 8, 12, 13, 15 active)

---

## Recommended Schedule

```
LANE A                    LANE B                    LANE C
──────                    ──────                    ──────

12-1 Results page         13-2 Polar checkout       8-8 Archetype library
  │ (frontend+backend)      │ (backend+webhook)       │ (domain, content)
  ▼                         ▼                         ▼
12-2 Evidence highlight   13-3 Full portrait        15-2 Archetype cards
  │ (frontend)              │ (backend+Anthropic)     │ (frontend+share)
  ▼                         ▼                         ▼
12-3 Teaser portrait      ─── done ───              15-3 Waitlist+breaker
  │ (frontend display)                                │ (backend+frontend)
  ▼                                                   ▼
─── done ───                                        ─── done ───
```

**Safety indicators:**
- 🟢 No shared file conflicts between lanes
- 🟡 Minor overlap — coordinate merge order
- 🔴 Blocking dependency — must sequence

| Pair | Risk | Detail |
|------|------|--------|
| 12-1 ↔ 13-2 | 🟢 | Separate domains (results UI vs payment webhook) |
| 12-1 ↔ 8-8 | 🟡 | Both touch archetype constants — merge 8-8 first |
| 12-3 ↔ 13-3 | 🟡 | Both touch portrait display — merge 12-3 first |
| 13-2 ↔ 15-2 | 🟢 | Separate domains (payment vs sharing) |
| 12-1 ↔ 15-2 | 🟡 | Both add frontend routes — coordinate barrel exports |

---

## Merge Queue

Order matters — merge earlier items first to reduce rebase pain.

| # | Story | Branch | Rebase After |
|---|-------|--------|--------------|
| 1 | 8-8 Archetype library | `feat/story-8-8-*` | master |
| 2 | 13-2 Polar checkout | `feat/story-13-2-*` | master |
| 3 | 12-1 Results page | `feat/story-12-1-*` | after 8-8 merge |
| 4 | 15-2 Archetype cards | `feat/story-15-2-*` | after 8-8 merge |
| 5 | 12-2 Evidence highlight | `feat/story-12-2-*` | after 12-1 merge |
| 6 | 13-3 Full portrait | `feat/story-13-3-*` | after 13-2 merge |
| 7 | 12-3 Teaser portrait | `feat/story-12-3-*` | after 12-2 merge |
| 8 | 15-3 Waitlist+breaker | `feat/story-15-3-*` | after 15-2 merge |

---

## Story Status

| Story | Epic | Lane | Status | Blocked By | Shared Files |
|-------|------|------|--------|------------|--------------|
| 8-8 | 8 | C | backlog | — | `archetypes.ts`, `archetype-lookup.ts` |
| 12-1 | 12 | A | backlog | — | `result-schemas.ts`, routes, handlers |
| 12-2 | 12 | A | backlog | 12-1 | frontend components |
| 12-3 | 12 | A | backlog | 12-2 | portrait display components |
| 13-2 | 13 | B | backlog | — | `purchase-events` schema, handlers |
| 13-3 | 13 | B | backlog | 13-2 | portrait generation, Anthropic repo |
| 15-2 | 15 | C | backlog | 8-8 (archetype data) | share card components |
| 15-3 | 15 | C | backlog | — | middleware, config |

---

## Conflict Matrix

Files likely modified by multiple stories (check before parallel work):

| Shared File | 8-8 | 12-1 | 12-2 | 12-3 | 13-2 | 13-3 | 15-2 | 15-3 |
|-------------|-----|------|------|------|------|------|------|------|
| `domain/src/constants/archetypes.ts` | ✏️ | | | | | | ✏️ | |
| `domain/src/schemas/result-schemas.ts` | | ✏️ | | | | | | |
| `api/src/handlers/assessment.ts` | | ✏️ | | | | | | |
| `api/src/index.ts` (routes) | | ✏️ | | | ✏️ | | | ✏️ |
| `contracts/src/http/groups/` | | ✏️ | | | ✏️ | | | ✏️ |
| `front/src/routeTree.gen.ts` | | ✏️ | ✏️ | ✏️ | | | ✏️ | ✏️ |
| `infrastructure/src/repositories/` | | | | | ✏️ | ✏️ | | |
| Portrait components | | | | ✏️ | | ✏️ | | |

---

## Bottlenecks

| Bottleneck | Impact | Mitigation |
|------------|--------|------------|
| `archetypes.ts` shared by 8-8 and 15-2 | 🟡 Merge conflict | Complete and merge 8-8 before starting 15-2 |
| `api/src/index.ts` barrel (routes) | 🟡 Merge conflict on barrel | Last-to-merge rebases and resolves |
| `routeTree.gen.ts` auto-generated | 🟢 Auto-resolves | Regenerate after merge (`pnpm dev`) |
| Portrait display shared by 12-3 and 13-3 | 🟡 Component conflict | Merge 12-3 first (teaser), then 13-3 (full) |

---

## Principles

- **Story-level granularity** — split by story, not epic
- **Agent-agnostic lanes** — assign as many agents as available
- **Updated alongside sprint-status** — SM refreshes after each story completes
- **Don't force parallelism** — sequence where natural dependencies exist
