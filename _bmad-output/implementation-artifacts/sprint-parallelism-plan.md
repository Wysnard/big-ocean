# Sprint Parallelism Plan
Generated: 2026-03-05 (refreshed 9 — Conversation Experience Evolution epics 21-22)

> Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.
> Epic 20 (Evidence Review) deferred — evidence already has messageId FK.

## Step 1: Foundation types + Character bible cleanup
| Story | Mode | Notes |
|-------|------|-------|
| 21-1-territory-domain-types-and-catalog | parallel | Types, branded IDs, 22-territory catalog — no runtime impact |
| 22-1-remove-steering-instructions-from-character-bible | parallel | Remove pacing/depth rules from nerin-chat-context.ts — independent of Epic 21 |

**Gate:** All stories above must be done before proceeding.

## Step 2: Pure scoring functions + Character content additions
| Story | Mode | Notes |
|-------|------|-------|
| 21-2-depth-readiness-score-drs | parallel | Pure domain function, depends on 21-1 types |
| 22-2-relate-reflect-and-story-pulling-patterns | parallel | Adds content to nerin-chat-context.ts, depends on 22-1 cleanup |

**Gate:** All stories above must be done before proceeding.

## Step 3: Scoring + cold-start + prompt builder + portrait migration
| Story | Mode | Notes |
|-------|------|-------|
| 21-3-territory-scoring-and-selection | parallel | Pure domain functions, depends on 21-1, 21-2 |
| 22-3-contradiction-surfacing-migration-to-portrait-generator | parallel | Modifies nerin-chat-context.ts + portrait-generator repo, depends on 22-1 |

**Gate:** All stories above must be done before proceeding.

## Step 4: Cold-start + prompt builder
| Story | Mode | Notes |
|-------|------|-------|
| 21-4-cold-start-territory-selection | parallel | Uses catalog + scoring, depends on 21-1, 21-3 |
| 21-5-territory-prompt-builder-and-nerin-system-prompt | parallel | Catalog lookup + system prompt modification, depends on 21-1 |

**Gate:** All stories above must be done before proceeding.

## Step 5: Infrastructure changes
| Story | Mode | Notes |
|-------|------|-------|
| 21-6-schema-migration-and-conversanalyzer-energy-classification | parallel | Schema + ConversAnalyzer prompt + mock updates — no dependency on scoring stories |

**Gate:** All stories above must be done before proceeding.

## Step 6: Pipeline integration
| Story | Mode | Notes |
|-------|------|-------|
| 21-7-pipeline-orchestration-integration | parallel | Wires all Epic 21 components together — depends on 21-1 through 21-6 |

**Gate:** All stories above must be done before proceeding.

## Conflict Notes
- **nerin-chat-context.ts**: Modified by 22-1 (removal), 22-2 (additions), 22-3 (removal). Must be sequential within Epic 22.
- **Epic 21 vs Epic 22**: Zero shared file conflicts — fully parallel tracks except Step 6 (21-7) which only touches pipeline code.
- **Epic 21 is atomic at deployment** — all 7 stories must be complete before deploying territory steering to production. Epic 22 can deploy independently at any time.
