# Sprint Parallelism Plan
Generated: 2026-03-14

> Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.
> Epic 20 (Evidence Review) deferred — evidence already has messageId FK.
> Phases 1-4 complete. Phase 5 (Conversation Pacing Pipeline) near completion.
> Phase 6 (Nerin Steering Format Overhaul) planned — 2 epics, 8 stories.

## ~~Step 1: Foundation Layer (Epic 23)~~ DONE
All 3 stories merged: 23-1, 23-2, 23-3 (PRs #121, #122, #123).

## ~~Step 2: Parallel Processing Layers (Epics 24, 25, 26)~~ DONE
All 4 stories merged: 24-1, 25-1, 25-2, 26-1 (PRs #124, #126, #127, #125).

## ~~Step 3: Dependent Processing Stories~~ DONE
All 3 stories merged: 24-2, 25-3, 26-2 (PRs #128, #129, #130).

## ~~Step 4: Governor + Character Bible Decomposition~~ DONE
All 2 stories merged: 26-3, 27-1 (PRs #131, #132).

## Step 5: Prompt Builder — PR-READY
| Story | Mode | Status | Notes |
|-------|------|--------|-------|
| 27-2-prompt-builder | single | **pr-ready** (PR #133) | Depends on 26-3 (consumes PromptBuilderInput) + 27-1 (uses decomposed modules) |

**Gate:** Story above must be done (PR #133 merge) before proceeding.

## Step 6: Pipeline Integration — PR-READY
| Story | Mode | Status | Notes |
|-------|------|--------|-------|
| 27-3-pipeline-integration | single | **pr-ready** (PR #134) | Wires ALL layers: 15-step pipeline replacing old steering; depends on everything |

**Gate:** Phase 5 complete after this story merges. Phase 6 begins.

## Step 7: Steering Format Foundation (Epic 28)
| Story | Mode | Notes |
|-------|------|-------|
| 28-1-territory-catalog-enrichment | parallel | Pure data: add name + description to 25 territories |
| 28-2-common-layer-reform | parallel | Reorganize modules: trim instincts, move reflect/story-pulling to common |

**Gate:** Both stories above must be done before proceeding.

**Conflict Notes:**
- 28-1 modifies territory-catalog.ts and Territory type — no overlap with 28-2
- 28-2 modifies conversation-instincts.ts, prompt-builder module selection — no overlap with 28-1
- Both are safe scaffolding — no behavior change

## Step 8: Skeleton Templates
| Story | Mode | Notes |
|-------|------|-------|
| 28-3-intent-observation-templates-and-pressure-modifiers | single | Creates 9 templates + 3 pressure modifiers as new constants |

**Gate:** Story above must be done before proceeding.

**Conflict Notes:**
- Creates new files in domain/src/constants/nerin/ — no conflicts with existing code

## Step 9: Prompt Builder Swap — THE BEHAVIOR CHANGE
| Story | Mode | Notes |
|-------|------|-------|
| 28-4-prompt-builder-skeleton-swap | single | Replaces 4-tier with 2-layer; promotes steering; desire framing. **This is where Nerin's behavior changes.** |

**Gate:** Epic 28 complete. Epic 29 begins.

**Conflict Notes:**
- Heavily modifies prompt-builder.ts — consumes templates from 28-3, common layer from 28-2, catalog from 28-1
- All prompt builder tests will be rewritten

## Step 10: Bridge Intent + Templates
| Story | Mode | Notes |
|-------|------|-------|
| 29-1-bridge-intent-and-governor-integration | parallel | Adds bridge to PromptBuilderInput type + governor logic |
| 29-2-bridge-templates-and-threading-dissolution | sequential(after: 29-1) | Creates 4 bridge templates, prompt builder handles bridge case |

**Gate:** Both stories above must be done before proceeding.

**Conflict Notes:**
- 29-1 modifies pacing.ts types + move-governor.ts
- 29-2 modifies prompt-builder.ts (adds bridge case) — must wait for 29-1's type changes
- 29-2 also creates new constant files (no conflict)

## Step 11: Mirrors + Cleanup
| Story | Mode | Notes |
|-------|------|-------|
| 29-3-contextual-mirror-system | parallel | Replaces MIRRORS_EXPLORE/MIRRORS_AMPLIFY with lookup table |
| 29-4-rename-amplify-to-close-and-final-cleanup | sequential(after: 29-3) | Renames amplify→close everywhere, deletes dead modules |

**Gate:** Phase 6 complete after this step.

**Conflict Notes:**
- 29-3 modifies prompt-builder.ts mirror loading — no overlap with 29-4's rename scope
- 29-4 touches many files (type rename) — must be last to avoid merge conflicts with 29-3

## Deferred Work (not scheduled)

| Epic | Stories | Reason |
|------|---------|--------|
| Epic 6 (Privacy/GDPR) | 6-1, 6-2, 6-3 | Deferred to Phase 2 EU launch |
| Epic 20 (Evidence Review) | 20-1, 20-2 | Deferred — messageId FK already in place |

## Summary
- **Phase 5:** 2 stories remaining (27-2, 27-3) — both pr-ready
- **Phase 6:** 8 stories across 2 epics (28, 29) — all backlog
- **5 remaining steps** (Steps 7-11) to deliver Phase 6 Nerin Steering Format
- **Parallelism opportunities:** Steps 7 and 10 have parallel stories
- **Critical path:** 27-2 → 27-3 → 28-1+28-2 → 28-3 → 28-4 → 29-1+29-2 → 29-3+29-4
