# Sprint Parallelism Plan
Generated: 2026-04-04
Updated: 2026-04-07

## Phase 10: Product Completeness — Calibration & Accessibility

### Dependency Graph

```
Epic 45 (Conversation Calibration)     Epic 47 (Accessibility)
  45-1 Schema Migration                  47-1 through 47-5
    ↓                                    (all independent of 45/46)
  45-2 Repo & Domain Renames
    ↓
  45-3 Handler/Contract/Frontend
    ↓
  45-4 Turn Count 25→15
    ↓
  45-5 Dead Code Cleanup

Epic 46 (Extension Cleanup)
  46-1 Gate Extension & Remove UI
  (parallel with Epic 45)
```

### Step 1 — Foundation (sequential within Epic 45)
| Story | Epic | Parallel With |
|-------|------|---------------|
| 45-1-schema-migration-table-renames | 45 | 46-1, 47-* |
| 46-1-gate-extension-use-case-and-remove-ui-surface | 46 | 45-1, 47-* |
| 47-1-skip-link-and-semantic-landmarks | 47 | 45-*, 46-* |

**Gate:** 45-1 must complete before 45-2 starts (schema dependency).
Epic 46 and Epic 47 stories have no dependency on Epic 45 — fully parallel.

### Step 2 — Rename Cascade (sequential)
| Story | Epic | Depends On |
|-------|------|------------|
| 45-2-repository-and-domain-layer-renames | 45 | 45-1 |

**Parallel:** Any remaining 47-* stories.

### Step 3 — Full Stack Rename + Turn Count
| Story | Epic | Depends On |
|-------|------|------------|
| 45-3-handler-contract-and-frontend-renames | 45 | 45-2 |

### Step 4 — Calibration
| Story | Epic | Depends On |
|-------|------|------------|
| 45-4-assessment-turn-count-25-to-15 | 45 | 45-3 |

### Step 5 — Cleanup
| Story | Epic | Depends On |
|-------|------|------------|
| 45-5-dead-code-cleanup | 45 | 45-3 |

**Note:** 45-4 and 45-5 are parallel with each other (no mutual dependency).

### Epic 47 — Accessibility (all stories independent)
| Story | Depends On |
|-------|------------|
| 47-1-skip-link-and-semantic-landmarks | None |
| 47-2-conversation-ui-accessibility | None |
| 47-3-results-page-and-portrait-accessibility | None |
| 47-4-modal-and-focus-management | None |
| 47-5-touch-targets-and-contrast-audit | None |

All 47-* stories are independent of each other and of Epics 45/46. Can be worked in any order or in parallel at any time.

### Maximum Parallelism

At peak, **3 streams** can run simultaneously:
1. Epic 45 sequential chain (45-1 → 45-2 → 45-3 → 45-4/45-5)
2. Epic 46 (single story, no dependencies)
3. Epic 47 (5 independent stories)

**Critical path:** Epic 45's 5-story sequential chain (schema → repos → handlers → turn count → cleanup).

## Deferred Work (not scheduled)
| Item | Reason |
|------|--------|
| Epic 6 (Privacy/GDPR) | Deferred to EU launch |
| Epic 20 (Evidence Review) | Deferred — messageId FK already in place |

## Summary
- **11 stories** remaining across 3 epics
- **44 epics complete** (2 deferred)
- **Critical path:** Epic 45 (5 sequential stories — ADR-39 renames)
- **Blocker:** None
