# Sprint Parallelism Plan
Generated: 2026-03-22 (refreshed — Step 9 complete)

> Phase 7: Product Completeness & Launch Readiness
> Source: epics.md (9 epics, 41 stories incl. sub-stories)
> Only forward-looking stories included — all prior phases complete.
> Steps 1-9 complete (37 stories merged). Step 10 unlocked.
>
> Conservative parallelism: stories sharing a page, route, or domain area
> are placed in separate steps even when technically independent.

## Step 1: COMPLETE (2026-03-18)
All 5 stories merged: 32-0b, 32-0, 32-3, 31-7, 32-7.

## Step 2: COMPLETE (2026-03-19)
All 6 stories merged: 30-1, 31-1, 31-7b, 32-1, 32-7b, 37-1.

## Step 3: COMPLETE (2026-03-19)
All 4 stories merged: 31-2 (PR #156), 32-2 (PR #157), 31-4 (PR #154), 37-2 (PR #155).

## Step 4: COMPLETE (2026-03-21)
All 4 stories merged: 30-2 (PR #161), 31-3 (PR #158), 31-5 (PR #160), 32-4 (PR #159).

## Step 5: COMPLETE (2026-03-21)
All 4 stories merged: 32-5 (PR #162), 33-1 (PR #163), 32-6 (PR #164), 31-6 (PR #165).

## Step 6: COMPLETE (2026-03-21)
All 4 stories merged: 33-2 (PR #167), 32-8 (PR #168), 36-1 (PR #169), 34-1 (PR #170).

## Step 7: COMPLETE (2026-03-22)
All 4 stories merged: 33-3 (PR #171), 34-2 (PR #172), 36-2 (PR #173), 38-1 (PR #174).

## Step 8: COMPLETE (2026-03-22)
All 4 stories merged: 33-4 (PR #175), 36-3 (PR #177), 38-2 (PR #176), 34-3 (merged to master).

## Step 9: COMPLETE (2026-03-22)
All 2 stories merged: 35-1 (PR #179), 35-2 (PR #180).

## Step 10: Relationship Analysis Display, Versioning & Notification
| Story | Mode | Notes |
|-------|------|-------|
| 35-3-relationship-analysis-display | parallel | After 35-2. Reuses spine renderer from 32-5 |
| 35-4-version-management-and-cascade-deletion | parallel | After 35-2 + 30-2. Derive-at-read versioning |
| 35-5-relationship-analysis-email-notification | parallel | After 35-2 + 31-7. Email on analysis ready |

**Gate:** All stories above must be done before proceeding.

## Step 11: Dashboard (Final Integration)
| Story | Mode | Notes |
|-------|------|-------|
| 38-3-dashboard | — | After 32-1, 32-5, 35-3. Aggregates all product surfaces |

**Gate:** Phase 7 complete.

## Deferred Work (not scheduled)
| Epic | Stories | Reason |
|------|---------|--------|
| Epic 6 (Privacy/GDPR) | 6-1, 6-2, 6-3 | Deferred to EU launch |
| Epic 20 (Evidence Review) | 20-1, 20-2 | Deferred — messageId FK already in place |

## Summary
- **11 steps** — Steps 1-9 complete (38 merged), Step 10 unlocked
- **4 stories remaining** (Steps 10-11)
- **Critical path:** 35-3 (Step 10) → 38-3 (Step 11)
- **No shared-file conflicts within any step** — stories in the same step touch different pages/domains
- **Next action:** Begin Step 10 — 3 parallel stories: 35-3 (analysis display), 35-4 (versioning), 35-5 (email notification)
