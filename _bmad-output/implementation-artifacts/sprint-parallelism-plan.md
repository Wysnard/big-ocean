# Sprint Parallelism Plan
Generated: 2026-03-05 (refreshed 12 — Step 1 complete, 21-3 and 22-3 merged, Epic 22 done)

> Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.
> Epic 20 (Evidence Review) deferred — evidence already has messageId FK.
> Epic 22 complete — all 3 stories merged.
> Steps 1-3 of original plan completed: 21-1, 21-2, 21-3, 22-1, 22-2, 22-3 all merged.

## Step 1: Cold-start + prompt builder
| Story | Mode | Notes |
|-------|------|-------|
| 21-4-cold-start-territory-selection | parallel | Uses catalog + scoring; depends on 21-3 (done) |
| 21-5-territory-prompt-builder-and-nerin-system-prompt | parallel | Catalog lookup + system prompt; depends on 21-1 (done) |

**Gate:** All stories above must be done before proceeding.

## Step 2: Infrastructure changes
| Story | Mode | Notes |
|-------|------|-------|
| 21-6-schema-migration-and-conversanalyzer-energy-classification | parallel | Schema + ConversAnalyzer prompt + mock updates; benefits from prompt patterns in 21-5 |

**Gate:** All stories above must be done before proceeding.

## Step 3: Pipeline integration
| Story | Mode | Notes |
|-------|------|-------|
| 21-7-pipeline-orchestration-integration | parallel | Wires all Epic 21 components (21-3 through 21-6) into 8-step pipeline; clean cut replaces old steering |

**Gate:** Epic 21 complete after this step.

## Conflict Notes
- **packages/domain/src/utils/steering/**: 21-4 and 21-5 both add files here — barrel export merge needed if concurrent (separated within step by parallel mode, but both are pure domain so no file conflicts).
- **nerin-system-prompt.ts**: Modified by 21-5 (territory context injection). 21-7 depends on this being done first.
- **Epic 21 is atomic at deployment** — all 7 stories must be complete before deploying territory steering to production.

## Summary
- **3 steps** remaining to complete Phase 4 (CEE)
- **Step 1:** 2 stories in parallel (pure domain)
- **Step 2:** 1 story (infrastructure + ConversAnalyzer)
- **Step 3:** 1 story (integration gate)
- **Total remaining:** 4 stories in Epic 21
