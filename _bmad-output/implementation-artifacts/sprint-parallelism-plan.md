# Sprint Parallelism Plan
Generated: 2026-03-14

> Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.
> Epic 20 (Evidence Review) deferred — evidence already has messageId FK.
> Phases 1-5 complete. Phase 6 (Nerin Steering Format Overhaul) in progress.
> Steps 1-9 complete. Step 10 next.

## ~~Step 1: Foundation Layer (Epic 23)~~ DONE
All 3 stories merged: 23-1, 23-2, 23-3 (PRs #121, #122, #123).

## ~~Step 2: Parallel Processing Layers (Epics 24, 25, 26)~~ DONE
All 4 stories merged: 24-1, 25-1, 25-2, 26-1 (PRs #124, #126, #127, #125).

## ~~Step 3: Dependent Processing Stories~~ DONE
All 3 stories merged: 24-2, 25-3, 26-2 (PRs #128, #129, #130).

## ~~Step 4: Governor + Character Bible Decomposition~~ DONE
All 2 stories merged: 26-3, 27-1 (PRs #131, #132).

## ~~Step 5: Prompt Builder~~ DONE
Story 27-2 merged (PR #133).

## ~~Step 6: Pipeline Integration~~ DONE
Story 27-3 merged (PR #134). Phase 5 complete.

## ~~Step 7: Steering Format Foundation (Epic 28)~~ DONE
Both stories merged: 28-1 (PR #135), 28-2 (PR #136).

## ~~Step 8: Skeleton Templates~~ DONE
Story 28-3 merged (PR #137).

## ~~Step 9: Prompt Builder Swap — THE BEHAVIOR CHANGE~~ DONE
Story 28-4 merged (PR #138). Epic 28 complete.

## Step 10: Bridge Intent + Templates
| Story | Mode | Status | Notes |
|-------|------|--------|-------|
| 29-1-bridge-intent-and-governor-integration | parallel | **backlog** | Adds bridge to PromptBuilderInput type + governor logic |
| 29-2-bridge-templates-and-threading-dissolution | sequential(after: 29-1) | **backlog** | Creates 4 bridge templates, prompt builder handles bridge case |

**Gate:** Both stories above must be done before proceeding.

**Conflict Notes:**
- 29-1 modifies pacing.ts types + move-governor.ts
- 29-2 modifies prompt-builder.ts (adds bridge case) — must wait for 29-1's type changes
- 29-2 also creates new constant files (no conflict)

## Step 11: Mirrors + Cleanup
| Story | Mode | Status | Notes |
|-------|------|--------|-------|
| 29-3-contextual-mirror-system | parallel | **backlog** | Replaces MIRRORS_EXPLORE/MIRRORS_AMPLIFY with lookup table |
| 29-4-rename-amplify-to-close-and-final-cleanup | sequential(after: 29-3) | **backlog** | Renames amplify→close everywhere, deletes dead modules |

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
- **Phase 6:** 4 stories remaining in Epic 29 — all backlog
- **2 remaining steps** (Steps 10-11) to deliver Phase 6 Nerin Steering Format
- **Parallelism opportunities:** Steps 10 and 11 each have a parallel + sequential pair
- **Critical path:** 29-1+29-2 → 29-3+29-4
