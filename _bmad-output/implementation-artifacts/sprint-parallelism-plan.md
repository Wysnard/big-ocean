# Sprint Parallelism Plan
Generated: 2026-04-04

## Step 1: Codebase Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| 44-1-delete-old-pipeline-code-functions-constants-and-types | single | All old code is dead after Epic 43 |

**Gate:** Story above must be done before proceeding.

## Step 2: Dev Tools + Export Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| 44-2-seed-script-and-exchange-builder-rewrite-for-director-model | parallel | Can't reference deleted pipeline functions |
| 44-3-barrel-export-cleanup-and-conversanalyzer-mock-removal | parallel | Removes exports for deleted files |

**Gate:** All stories above must be done. Phase 9 complete.

## Deferred Work (not scheduled)
| Item | Reason |
|------|--------|
| Epic 6 (Privacy/GDPR) | Deferred to EU launch |
| Epic 20 (Evidence Review) | Deferred — messageId FK already in place |

## Conflict Notes
- **Step 1→2:** 44-1 deletes files, 44-2 and 44-3 update references. 44-1 must complete first to avoid import errors during seed/barrel work.
- **schema.ts:** No further modifications needed (43-1 migration already merged).
- **nerin-pipeline.ts:** Modified in 43-5 and 43-6 (both merged). No conflicts.

## Summary
- **2 steps** — 3 stories remaining
- **Max parallelism:** 2 stories in Step 2
- **Critical path:** 44-1 → 44-2/44-3 (1 sequential gate)
- **Estimated shape:** Step 1 is single-story. Step 2 runs 2 in parallel.
- **Completed:** Epic 43 fully merged (43-1 through 43-6). Step 1 of previous plan (43-6) done.
