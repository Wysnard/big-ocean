# Sprint Parallelism Plan
Generated: 2026-03-05 (refreshed 11 — Steps 1-2 complete, 21-2 and 22-2 merged)

> Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.
> Epic 20 (Evidence Review) deferred — evidence already has messageId FK.
> Steps 1-2 completed: 21-1, 21-2, 22-1, 22-2 all merged to done.

## Step 1: Scoring + portrait migration
| Story | Mode | Notes |
|-------|------|-------|
| 21-3-territory-scoring-and-selection | parallel | Pure domain functions; depends on 21-2 (done) |
| 22-3-contradiction-surfacing-migration-to-portrait-generator | parallel | Epic 22; modifies nerin-chat-context.ts + portrait generator; depends on 22-1 (done) |

**Gate:** All stories above must be done before proceeding.

## Step 2: Cold-start + prompt builder
| Story | Mode | Notes |
|-------|------|-------|
| 21-4-cold-start-territory-selection | parallel | Uses catalog + scoring; depends on 21-3 |
| 21-5-territory-prompt-builder-and-nerin-system-prompt | parallel | Catalog lookup + system prompt; benefits from seeing scoring patterns from 21-3 |

**Gate:** All stories above must be done before proceeding.

## Step 3: Infrastructure changes
| Story | Mode | Notes |
|-------|------|-------|
| 21-6-schema-migration-and-conversanalyzer-energy-classification | parallel | Schema + ConversAnalyzer prompt + mock updates; no dependency on scoring but benefits from prompt patterns in 21-5 |

**Gate:** All stories above must be done before proceeding.

## Step 4: Pipeline integration
| Story | Mode | Notes |
|-------|------|-------|
| 21-7-pipeline-orchestration-integration | parallel | Wires all Epic 21 components (21-3 through 21-6) into 8-step pipeline; clean cut replaces old steering |

**Gate:** Epic 21 complete after this step.

## Conflict Notes
- **nerin-chat-context.ts**: Modified by 22-3 (removal of contradiction-surfacing). No conflict with Epic 21 stories.
- **packages/domain/src/utils/steering/**: 21-3 and 21-4 both add files here — barrel export merge needed if concurrent (separated by gate).
- **Epic 21 is atomic at deployment** — all 7 stories must be complete before deploying territory steering to production.
- **Epic 22 can deploy independently** at any time (zero data flow coupling with Epic 21).

## Summary
- **4 steps** to complete Phase 4 (CEE)
- **Step 1:** 2 stories in parallel
- **Step 2:** 2 stories in parallel
- **Step 3:** 1 story
- **Step 4:** 1 story (integration gate)
- **Total remaining:** 6 stories across 2 epics
