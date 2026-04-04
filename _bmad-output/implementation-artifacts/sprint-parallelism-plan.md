# Sprint Parallelism Plan
Generated: 2026-04-04

## Step 1: Dev Tools + Export Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| 44-2-seed-script-and-exchange-builder-rewrite-for-director-model | parallel | Rewrites exchange-builder to produce Director-format data |
| 44-3-barrel-export-cleanup-and-conversanalyzer-mock-removal | parallel | Removes exports for deleted files, cleans dead mocks |

**Gate:** All stories above must be done. Epic 44 and Phase 9 complete.

## Deferred Work (not scheduled)
| Item | Reason |
|------|--------|
| Epic 6 (Privacy/GDPR) | Deferred to EU launch |
| Epic 20 (Evidence Review) | Deferred — messageId FK already in place |

## Conflict Notes
- **44-2 vs 44-3:** Independent — 44-2 touches seed scripts and exchange-builder, 44-3 touches barrel exports and mocks. No shared file conflicts. Safe to run in parallel.
- **schema.ts:** No modifications needed (43-1 migration already merged).

## Summary
- **1 step** — 2 stories remaining
- **Max parallelism:** 2 stories (no conflicts)
- **Blocker:** None — 44-1 merged via PR #205, gate cleared
- **Completed:** Epic 43 fully merged (43-1 through 43-6). Story 44-1 merged.
