# Sprint Parallelism Plan
Generated: 2026-03-05 (refreshed 13 — Step 1 complete, 21-4 and 21-5 merged)

> Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.
> Epic 20 (Evidence Review) deferred — evidence already has messageId FK.
> Epic 22 complete — all 3 stories merged.
> Steps 1-4 of original plan completed: 21-1 through 21-5, 22-1 through 22-3 all merged.

## Step 1: Infrastructure changes
| Story | Mode | Notes |
|-------|------|-------|
| 21-6-schema-migration-and-conversanalyzer-energy-classification | parallel | Schema migration (2 new columns on assessment_messages) + ConversAnalyzer energy classification output + mock updates; depends on 21-1 through 21-5 (all done) |

**Gate:** All stories above must be done before proceeding.

## Step 2: Pipeline integration
| Story | Mode | Notes |
|-------|------|-------|
| 21-7-pipeline-orchestration-integration | parallel | Wires all Epic 21 components (21-1 through 21-6) into 8-step territory-based pipeline; clean cut replaces old facet-targeted steering |

**Gate:** Epic 21 complete after this step.

## Conflict Notes
- **packages/infrastructure/src/db/drizzle/schema.ts**: Modified by 21-6 (2 new nullable columns). Standard migration, no conflicts expected.
- **ConversAnalyzer prompt + mock**: 21-6 adds `observedEnergyLevel` output field and updates the mock. 21-7 depends on this.
- **nerin-pipeline.ts**: 21-7 rewrites pipeline to 8-step orchestration using components from 21-1 through 21-6. Must be last.
- **Epic 21 is atomic at deployment** — all 7 stories must be complete before deploying territory steering to production.

## Summary
- **2 steps** remaining to complete Phase 4 (CEE)
- **Step 1:** 1 story (infrastructure + ConversAnalyzer)
- **Step 2:** 1 story (integration gate)
- **Total remaining:** 2 stories in Epic 21
