# Sprint Parallelism Plan
Generated: 2026-04-04

## Step 1: Schema Foundation + Independent Components
| Story | Mode | Notes |
|-------|------|-------|
| 43-1-exchange-table-migration-and-schema-changes | parallel | Schema migration — foundation for pipeline |
| 43-2-coverage-analyzer-evidence-to-target-pure-function | parallel | Pure function, no schema dependency |

**Gate:** All stories above must be done before proceeding.

## Step 2: Director + Actor (parallel build)
| Story | Mode | Notes |
|-------|------|-------|
| 43-3-nerin-director-repository-prompt-and-langchain-implementation | parallel | Depends on 43-1 (writes to director_output column) |
| 43-4-nerin-actor-persona-rewrite-prompt-and-repository-adaptation | parallel | Independent of 43-3 — rename + rewrite existing files |

**Gate:** All stories above must be done before proceeding.

## Step 3: Pipeline Integration
| Story | Mode | Notes |
|-------|------|-------|
| 43-5-pipeline-orchestrator-rewrite-4-step-sequential-pipeline | parallel | Wires 43-1 + 43-2 + 43-3 + 43-4 together |

**Gate:** Story above must be done before proceeding.

## Step 4: ConversAnalyzer Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| 43-6-conversanalyzer-cleanup-strip-user-state-extraction | parallel | Pipeline must work (43-5) before stripping user-state |

**Gate:** Story above must be done before proceeding to Epic 44.

## Step 5: Codebase Cleanup (Epic 44)
| Story | Mode | Notes |
|-------|------|-------|
| 44-1-delete-old-pipeline-code-functions-constants-and-types | parallel | All old code is dead after Epic 43 |

**Gate:** Story above must be done before proceeding.

## Step 6: Dev Tools + Export Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| 44-2-seed-script-and-exchange-builder-rewrite-for-director-model | parallel | Can't reference deleted pipeline functions |
| 44-3-barrel-export-cleanup-and-conversanalyzer-mock-removal | parallel | Removes exports for deleted files |

**Gate:** All stories above must be done. Phase 9 complete.

## Deferred Work (not scheduled)
| Item | Reason |
|------|--------|
| cleanup-1-remove-solo-from-postgresql-enum | Pending production verification of Scoring v2 |
| Epic 6 (Privacy/GDPR) | Deferred to EU launch |
| Epic 20 (Evidence Review) | Deferred — messageId FK already in place |

## Conflict Notes
- **Step 2:** 43-3 and 43-4 touch different files — no conflicts. 43-3 creates new Director files, 43-4 renames existing Actor files.
- **Step 5→6:** 44-1 deletes files, 44-2 and 44-3 update references. 44-1 must complete first to avoid import errors during seed/barrel work.
- **schema.ts:** Modified in 43-1 only (exchange table). No conflicts.
- **nerin-pipeline.ts:** Modified in 43-5 only. No conflicts.

## Summary
- **6 steps** — 9 stories total
- **Max parallelism:** 2 stories in Steps 1, 2, and 6
- **Critical path:** 43-1 → 43-3 → 43-5 → 43-6 → 44-1 → 44-2/44-3 (6 sequential gates)
- **Estimated shape:** Steps 1-2 can each run 2 agents in parallel. Steps 3-5 are single-story. Step 6 runs 2 in parallel.
