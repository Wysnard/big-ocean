# Sprint Parallelism Plan
Generated: 2026-03-13

> Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.
> Epic 20 (Evidence Review) deferred — evidence already has messageId FK.
> Phases 1-4 complete. Phase 5 (Conversation Pacing Pipeline) is the active work.
> Step 1 (Epic 23 — Foundation Layer) complete. 3 PRs merged 2026-03-12.
> Step 2 (Parallel Processing Layers) complete. 4 PRs merged 2026-03-12.
> Step 3 (Dependent Processing Stories) complete. 3 PRs merged 2026-03-13.
> Step 4 (Governor + Character Bible) complete. 2 PRs merged 2026-03-13.

## ~~Step 1: Foundation Layer (Epic 23)~~ DONE
All 3 stories merged: 23-1, 23-2, 23-3 (PRs #121, #122, #123).

## ~~Step 2: Parallel Processing Layers (Epics 24, 25, 26)~~ DONE
All 4 stories merged: 24-1, 25-1, 25-2, 26-1 (PRs #124, #126, #127, #125).

## ~~Step 3: Dependent Processing Stories~~ DONE
All 3 stories merged: 25-3, 26-2, 24-2 (PRs #128, #129, #130).

## ~~Step 4: Governor + Character Bible Decomposition~~ DONE
All 2 stories merged: 26-3, 27-1 (PRs #131, #132).

## Step 5: Prompt Builder — PR-READY
| Story | Mode | Status | Notes |
|-------|------|--------|-------|
| 27-2-prompt-builder | single | **pr-ready** (PR #133) | Depends on 26-3 (consumes PromptBuilderInput) + 27-1 (uses decomposed modules) |

**Gate:** Story above must be done (PR #133 merge) before proceeding.

**Conflict Notes:**
- 27-2 creates prompt-builder.ts in domain/src/utils/steering/
- Consumes PromptBuilderInput from 26-3's Move Governor and Tier 1/2 modules from 27-1's character bible decomposition

## Step 6: Pipeline Integration
| Story | Mode | Notes |
|-------|------|-------|
| 27-3-pipeline-integration | single | Wires ALL layers: 15-step pipeline replacing old steering; depends on everything |

**Gate:** Final step — Phase 5 complete after this story merges.

**Conflict Notes:**
- 27-3 heavily modifies nerin-pipeline.ts in api use-cases + removes old steering code
- Composes prompt via 27-2's buildPrompt()

## Deferred Work (not scheduled)

| Epic | Stories | Reason |
|------|---------|--------|
| Epic 6 (Privacy/GDPR) | 6-1, 6-2, 6-3 | Deferred to Phase 2 EU launch |
| Epic 20 (Evidence Review) | 20-1, 20-2 | Deferred — messageId FK already in place |

## Summary
- **2 remaining steps** to deliver Phase 5 Conversation Pacing Pipeline (Steps 1-4 complete)
- **2 stories remaining** in Epic 27
- **Strictly sequential:** 27-2 (Step 5) → 27-3 (Step 6)
- **Critical path:** 27-2 → 27-3
