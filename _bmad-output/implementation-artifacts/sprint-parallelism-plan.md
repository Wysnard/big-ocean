# Sprint Parallelism Plan
Generated: 2026-03-05 (refreshed 14 — 21-6 merged, only 21-7 remains)

> Epic 6 (Privacy/GDPR) excluded — deferred to Phase 2 EU launch.
> Epic 20 (Evidence Review) deferred — evidence already has messageId FK.
> Epic 22 complete — all 3 stories merged.
> Stories 21-1 through 21-6 all merged. Only 21-7 (pipeline orchestration) remains.

## Step 1: Pipeline integration (final story)
| Story | Mode | Notes |
|-------|------|-------|
| 21-7-pipeline-orchestration-integration | parallel | Wires all Epic 21 components (21-1 through 21-6) into 8-step territory-based pipeline; clean cut replaces old facet-targeted steering |

**Gate:** Epic 21 complete after this step.

## Conflict Notes
- **nerin-pipeline.ts**: 21-7 rewrites pipeline to 8-step orchestration using components from 21-1 through 21-6. This is the final integration story.
- **Epic 21 is atomic at deployment** — all 7 stories must be complete before deploying territory steering to production.

## Summary
- **1 step** remaining to complete Phase 4 (CEE)
- **Step 1:** 1 story (pipeline orchestration integration)
- **Total remaining:** 1 story in Epic 21
