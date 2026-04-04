# Sprint Parallelism Plan
Generated: 2026-04-04

## Step 1: Director + Actor (parallel build)
| Story | Mode | Notes |
|-------|------|-------|
| 43-3-nerin-director-repository-prompt-and-langchain-implementation | parallel | Depends on 43-1 (done) — writes to director_output column |
| 43-4-nerin-actor-persona-rewrite-prompt-and-repository-adaptation | parallel | Independent of 43-3 — rename + rewrite existing files |

**Gate:** All stories above must be done before proceeding.

## Step 2: Pipeline Integration
| Story | Mode | Notes |
|-------|------|-------|
| 43-5-pipeline-orchestrator-rewrite-4-step-sequential-pipeline | parallel | Wires 43-1 + 43-2 + 43-3 + 43-4 together |

**Gate:** Story above must be done before proceeding.

## Step 3: ConversAnalyzer Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| 43-6-conversanalyzer-cleanup-strip-user-state-extraction | parallel | Pipeline must work (43-5) before stripping user-state |

**Gate:** Story above must be done before proceeding to Epic 44.

## Step 4: Codebase Cleanup (Epic 44)
| Story | Mode | Notes |
|-------|------|-------|
| 44-1-delete-old-pipeline-code-functions-constants-and-types | parallel | All old code is dead after Epic 43 |

**Gate:** Story above must be done before proceeding.

## Step 5: Dev Tools + Export Cleanup
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
- **Step 1:** 43-3 and 43-4 touch different files — no conflicts. 43-3 creates new Director files, 43-4 renames existing Actor files.
- **Step 4→5:** 44-1 deletes files, 44-2 and 44-3 update references. 44-1 must complete first to avoid import errors during seed/barrel work.
- **schema.ts:** No further modifications needed (43-1 migration already merged).
- **nerin-pipeline.ts:** Modified in 43-5 only. No conflicts.

## Summary
- **5 steps** — 7 stories remaining
- **Max parallelism:** 2 stories in Steps 1 and 5
- **Critical path:** 43-3 → 43-5 → 43-6 → 44-1 → 44-2/44-3 (5 sequential gates)
- **Estimated shape:** Step 1 runs 2 agents in parallel. Steps 2-4 are single-story. Step 5 runs 2 in parallel.
- **Completed:** 43-1 (exchange table) and 43-2 (coverage analyzer) — merged 2026-04-04
