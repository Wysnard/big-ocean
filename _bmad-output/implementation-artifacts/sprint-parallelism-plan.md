# Sprint Parallelism Plan
Generated: 2026-03-13

> Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.
> Epic 20 (Evidence Review) deferred — evidence already has messageId FK.
> Phases 1-4 complete. Phase 5 (Conversation Pacing Pipeline) is the active work.
> Step 1 (Epic 23 — Foundation Layer) complete. 3 PRs merged 2026-03-12.
> Step 2 (Parallel Processing Layers) complete. 4 PRs merged 2026-03-12.
> Step 3 (Dependent Processing Stories) complete. 3 PRs merged 2026-03-13.

## ~~Step 1: Foundation Layer (Epic 23)~~ DONE
All 3 stories merged: 23-1, 23-2, 23-3 (PRs #121, #122, #123).

## ~~Step 2: Parallel Processing Layers (Epics 24, 25, 26)~~ DONE
All 4 stories merged: 24-1, 25-1, 25-2, 26-1 (PRs #124, #126, #127, #125).

## ~~Step 3: Dependent Processing Stories~~ DONE
All 3 stories merged: 25-3, 26-2, 24-2 (PRs #128, #129, #130).

## Step 4: Governor + Character Bible Decomposition
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
- **2 remaining steps** to deliver Phase 5 Conversation Pacing Pipeline (Steps 1-3 complete)
- **4 stories remaining** across 2 epics (26, 27)
- **Max parallelism:** Step 4 (2 stories simultaneously)
- **Critical path:** 26-3 → 27-2 → 27-3 (3 stories, longest sequential chain)
- **Independent opportunity:** 27-1 (character bible) runs in parallel with 26-3 in Step 4
