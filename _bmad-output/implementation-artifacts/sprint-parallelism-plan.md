# Sprint Parallelism Plan
Generated: 2026-03-13

> Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.
> Epic 20 (Evidence Review) deferred — evidence already has messageId FK.
> Phases 1-4 complete. Phase 5 (Conversation Pacing Pipeline) is the active work.
> Step 1 (Epic 23 — Foundation Layer) complete. 3 PRs merged 2026-03-12.
> Step 2 (Parallel Processing Layers) complete. 4 PRs merged 2026-03-12.

## ~~Step 1: Foundation Layer (Epic 23)~~ DONE
All 3 stories merged: 23-1, 23-2, 23-3 (PRs #121, #122, #123).

## ~~Step 2: Parallel Processing Layers (Epics 24, 25, 26)~~ DONE
All 4 stories merged: 24-1, 25-1, 25-2, 26-1 (PRs #124, #126, #127, #125).

## Step 3: Dependent Processing Stories
| Story | Mode | Notes |
|-------|------|-------|
| 24-2-three-tier-extraction-pipeline | parallel | Depends on 24-1 (uses analyze/analyzeLenient methods) |
| 25-3-territory-selector | parallel | Depends on 25-2 (consumes TerritoryScorerOutput) |
| 26-2-observation-gating-and-competition | parallel | Depends on 26-1 (uses strength formulas) |

**Gate:** All stories above must be done before proceeding.

**Conflict Notes:**
- 24-2 is in api use-cases; 25-3 and 26-2 are in domain/src/utils/steering/ — no file conflicts
- All three are in different directories with no shared files

## Step 4: Governor (requires gating + pacing + extraction orchestration)
| Story | Mode | Notes |
|-------|------|-------|
| 26-3-move-governor | parallel | Wires: intent derivation + entry pressure (needs E_target from 25-1) + observation gating (from 26-2) → PromptBuilderInput |
| 27-1-character-bible-decomposition | parallel | INDEPENDENT — decomposes CHAT_CONTEXT into modular constants; no runtime deps on pipeline |

**Gate:** All stories above must be done before proceeding.

**Conflict Notes:**
- 26-3 lives in domain/src/utils/steering/ or api use-cases; 27-1 creates files in domain/src/constants/nerin/
- No file overlap; 27-1 is explicitly independently deployable per the epic spec

## Step 5: Prompt Builder + Pipeline Integration
| Story | Mode | Notes |
|-------|------|-------|
| 27-2-prompt-builder | sequential | Depends on 26-3 (consumes PromptBuilderInput) + 27-1 (uses decomposed modules) |
| 27-3-pipeline-integration | sequential(after: 27-2) | Wires ALL layers: 15-step pipeline replacing old steering; depends on everything |

**Gate:** All stories above must be done before proceeding.

**Conflict Notes:**
- 27-2 creates prompt-builder.ts in domain/src/utils/steering/
- 27-3 heavily modifies nerin-pipeline.ts in api use-cases + removes old steering code
- Must be sequential: 27-3 composes prompt via 27-2's buildPrompt()

## Deferred Work (not scheduled)

| Epic | Stories | Reason |
|------|---------|--------|
| Epic 6 (Privacy/GDPR) | 6-1, 6-2, 6-3 | Deferred to Phase 2 EU launch |
| Epic 20 (Evidence Review) | 20-1, 20-2 | Deferred — messageId FK already in place |

## Summary
- **3 remaining steps** to deliver Phase 5 Conversation Pacing Pipeline (Steps 1-2 complete)
- **7 stories remaining** across 4 epics (24-27)
- **Max parallelism:** Step 3 (3 stories simultaneously)
- **Critical path:** 25-3 → 26-3 → 27-2 → 27-3 (4 stories, longest sequential chain)
- **Independent opportunity:** 27-1 (character bible) can start as early as Step 3 but placed in Step 4 for simplicity; could be pulled forward if needed
