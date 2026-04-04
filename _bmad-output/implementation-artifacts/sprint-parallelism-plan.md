# Sprint Parallelism Plan
Generated: 2026-04-04

## Step 1: Pipeline Integration
| Story | Mode | Notes |
|-------|------|-------|
| 43-5-pipeline-orchestrator-rewrite-4-step-sequential-pipeline | single | Wires 43-1 + 43-2 + 43-3 + 43-4 together — all dependencies now done |

**Gate:** Story above must be done before proceeding.

## Step 2: ConversAnalyzer Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| 43-6-conversanalyzer-cleanup-strip-user-state-extraction | single | Pipeline must work (43-5) before stripping user-state |

**Gate:** Story above must be done before proceeding to Epic 44.

## Step 3: Codebase Cleanup (Epic 44)
| Story | Mode | Notes |
|-------|------|-------|
| 44-1-delete-old-pipeline-code-functions-constants-and-types | single | All old code is dead after Epic 43 |

**Gate:** Story above must be done before proceeding.

## Step 4: Dev Tools + Export Cleanup
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
- **Step 3→4:** 44-1 deletes files, 44-2 and 44-3 update references. 44-1 must complete first to avoid import errors during seed/barrel work.
- **schema.ts:** No further modifications needed (43-1 migration already merged).
- **nerin-pipeline.ts:** Modified in 43-5 only. No conflicts.

## Summary
- **4 steps** — 5 stories remaining
- **Max parallelism:** 2 stories in Step 4
- **Critical path:** 43-5 → 43-6 → 44-1 → 44-2/44-3 (4 sequential gates)
- **Estimated shape:** Steps 1-3 are single-story. Step 4 runs 2 in parallel.
- **Completed:** 43-1 (exchange table), 43-2 (coverage analyzer), 43-3 (Nerin Director), 43-4 (Nerin Actor) — all merged
