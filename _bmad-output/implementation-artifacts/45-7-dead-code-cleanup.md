# Story 45.7: Dead Code Cleanup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want unused code removed,
so that the codebase is clean.

## Acceptance Criteria

1. **AC1: Remove the orphaned dashboard portrait component**
   **Given** `DashboardPortraitCard` is no longer rendered anywhere in the live dashboard flow
   **When** cleanup is completed
   **Then** `apps/front/src/components/dashboard/DashboardPortraitCard.tsx` is deleted
   **And** no runtime imports or exports reference it
   **And** the dashboard continues to route portrait reading through the results page rather than a dedicated dashboard card.

2. **AC2: Remove dead test-only references**
   **Given** the only remaining live references to `DashboardPortraitCard` are in its dedicated unit test file
   **When** cleanup is completed
   **Then** `apps/front/src/components/dashboard/DashboardPortraitCard.test.tsx` is deleted or otherwise removed from the active test graph
   **And** no stale `DashboardPortraitCard` symbol references remain in `apps/front/src`.

3. **AC3: Preserve the consolidated dashboard design**
   **Given** ADR-23 and the UX spec already moved portrait access to the results page
   **When** this story is implemented
   **Then** no replacement portrait card is introduced on `/dashboard`
   **And** existing dashboard cards (`DashboardIdentityCard`, `DashboardRelationshipsCard`, `DashboardCreditsCard`, `DashboardEmptyState`, `DashboardInProgressCard`) remain intact
   **And** existing `data-testid` attributes on surviving dashboard components are not removed or renamed.

4. **AC4: Verification succeeds after cleanup**
   **Given** this is a frontend dead-code removal story
   **When** verification runs
   **Then** `pnpm build` succeeds
   **And** targeted search confirms no remaining code references to `DashboardPortraitCard`
   **And** if tests are touched as part of the deletion, the relevant frontend test surface still compiles and runs cleanly.

## Tasks / Subtasks

- [x] Task 1: Confirm the component is truly dead before deleting it (AC: 1, 2, 3)
  - [x] 1.1 Run a repo-wide search for `DashboardPortraitCard` and verify the only remaining matches are the component file itself, its test file, and historical planning/story docs.
  - [x] 1.2 Confirm the live dashboard route and component composition do not import or render `DashboardPortraitCard`.
  - [x] 1.3 Preserve scope: do not reopen the broader dashboard/profile consolidation work from Story 38.3 or ADR-23.

- [x] Task 2: Delete the dead dashboard portrait implementation (AC: 1, 3)
  - [x] 2.1 Delete `apps/front/src/components/dashboard/DashboardPortraitCard.tsx`.
  - [x] 2.2 Verify no barrel export, sibling component, or route file still imports it.
  - [x] 2.3 Do not create a replacement component or move its logic elsewhere in this story.

- [x] Task 3: Delete dead test coverage tied only to the removed component (AC: 2, 3)
  - [x] 3.1 Delete `apps/front/src/components/dashboard/DashboardPortraitCard.test.tsx`.
  - [x] 3.2 Confirm no test helper, mock, or spec file still imports the removed symbol.
  - [x] 3.3 Preserve `data-testid` stability for the dashboard components that remain in use; only the removed component's test id may disappear.

- [x] Task 4: Sweep for stragglers and verify the frontend still builds (AC: 1, 2, 4)
  - [x] 4.1 Run `rg "DashboardPortraitCard"` and confirm remaining hits are limited to historical docs / story artifacts.
  - [x] 4.2 Run `pnpm build`.
  - [x] 4.3 If deletion touches test discovery or imports beyond the removed files, run the smallest relevant test command needed to confirm no stale frontend test references remain.

### Review Findings

Clean review — all three layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor) passed. 4 findings raised by the context-free Blind Hunter were all dismissed as false positives after cross-verification by the codebase-aware reviewers.

## Dev Notes

- **This is a pure dead-code cleanup story.** No new behavior, UI replacement, route changes, or backend work belongs here.
- **The codebase evidence is unusually clear:** a live code search shows `DashboardPortraitCard` is referenced only by:
  - `apps/front/src/components/dashboard/DashboardPortraitCard.tsx`
  - `apps/front/src/components/dashboard/DashboardPortraitCard.test.tsx`
  Historical planning and implementation docs also mention it, but those are not runtime references.
- **Do not reintroduce portrait access on the dashboard.** The approved direction is that portrait reading lives on the results page, not in a dashboard card.
- **Delete the dead test with the dead component.** Keeping a test file that imports a removed component would just convert cleanup into a broken test story.

### Architecture Compliance

- **ADR-23 is the governing product/UX decision.** The dashboard is the single authenticated home surface, and `DashboardPortraitCard` was explicitly removed because portrait access moved to `/results/$sessionId`. This story implements that cleanup, not a redesign. [Source: architecture.md - ADR-23]
- **Hexagonal/backend architecture is irrelevant to the write scope.** Keep this story in the frontend component/test surface; do not expand into contracts, handlers, or repositories just because Epic 45 also contains rename work. [Source: architecture.md - ADR-1, project structure]
- **Epic 45 scope explicitly includes this cleanup.** The dead-card deletion is the final cleanup step after the schema/rename/turn-count stories already completed. [Source: epics.md - Epic 1 scope, Story 1.7]

### Library / Framework Requirements

- **Use the existing frontend stack only.** This repo already uses React 19, TanStack Start/Router/Query, Tailwind CSS 4, shadcn/ui, Vitest, and Turbo/pnpm workspace scripts. No dependency or tooling changes are needed for this story. [Source: architecture.md - tech stack; package.json]
- **Follow the existing frontend testing rule:** surviving `data-testid` attributes must remain stable because e2e tests rely on them. The only acceptable removed test id is the one attached to the deleted portrait card itself. [Source: docs/FRONTEND.md - Testing with Data Attributes]

### File Structure Requirements

- Primary write scope:
  - `apps/front/src/components/dashboard/DashboardPortraitCard.tsx`
  - `apps/front/src/components/dashboard/DashboardPortraitCard.test.tsx`
- Read-only context surfaces worth checking before delete:
  - `apps/front/src/routes/dashboard.tsx`
  - `apps/front/src/components/dashboard/`
  - any dashboard/navigation files surfaced by `rg "DashboardPortraitCard"`.
- Planning/docs references should usually remain unchanged; this story is about runtime/test dead code, not rewriting historical artifacts.

### Testing Requirements

- Required verification:
  - `rg "DashboardPortraitCard"`
  - `pnpm build`
- Conditional verification:
  - Run focused frontend tests only if deletion exposes stale imports or test graph issues beyond the removed files.
- Preserve existing `data-testid` attributes on remaining dashboard components; do not “clean up” unrelated selectors in this story.

### Reinvention / Regression Guardrails

- Do not replace the deleted card with a new portrait teaser, CTA block, or alternate dashboard widget.
- Do not edit dashboard grid/layout unless the delete reveals a real compile error.
- Do not expand this into `/profile` cleanup, navigation cleanup, or other ADR-23 leftovers unless a direct reference blocks the deletion.
- Do not remove or rename unrelated dashboard tests just because they live in the same folder.

### Previous Story Intelligence

- **Story 45.6 reinforces the same epic boundary discipline:** Epic 45 stories have been succeeding by keeping each change narrowly scoped and then using grep/build sweeps to catch stragglers.
- **Story 45.5 is especially relevant for cleanup mechanics:** recent Epic 45 work used targeted `rg` sweeps after the main change to confirm only intentional references remained. Follow that same pattern here.
- **Story 38.3 is the origin of the component, but later planning superseded it.** It created `DashboardPortraitCard` when the dashboard still carried portrait state directly. ADR-23 and the updated UX spec later made that card obsolete.

### Git Intelligence Summary

- Recent Epic 45 commits show the cleanup should stay small and verification-driven:
  - `0868f701` - rename freeTierMessageThreshold to assessmentTurnCount and calibrate to 15 turns (Story 45-6)
  - `4eb9c5a3` - finalize story 45-5, fix e2e teardown and Polar sandbox detection
  - `80bb28d2` - cascade FK column renames to repositories, tests, and seeds (Story 45-5)
- That pattern argues for a minimal write set plus explicit verification rather than speculative refactors.

### Latest Technical Information

- No external web research is required for this story. The work is an internal frontend dead-code removal against the repo's already-pinned stack and established architecture.

### Project Structure Notes

- The architecture and docs align on the frontend write surface: dashboard UI lives under `apps/front/src/components/dashboard/` and `apps/front/src/routes/dashboard.tsx`. [Source: architecture.md - project structure; docs/index.md - frontend quick reference]
- No `project-context.md` file was found in the repo, so this story relies on the epics, architecture, UX spec, prior story artifacts, and current codebase inspection.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 1 scope; Story 1.7]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-23 Dashboard/Profile Consolidation; ADR-1 Hexagonal Architecture]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - dashboard route inventory; implementation gap "Portrait Card"]
- [Source: `docs/FRONTEND.md` - Testing with Data Attributes]
- [Source: `_bmad-output/implementation-artifacts/45-5-fk-column-code-cascade.md` - recent grep-and-verify cleanup pattern]
- [Source: `_bmad-output/implementation-artifacts/45-6-assessment-turn-count-25-to-15.md` - Epic 45 scope discipline and verification pattern]
- [Source: `_bmad-output/implementation-artifacts/38-3-dashboard.md` - original creation of `DashboardPortraitCard` in the older dashboard design]
- [Source: `apps/front/src/components/dashboard/DashboardPortraitCard.tsx`, `apps/front/src/components/dashboard/DashboardPortraitCard.test.tsx` - current live dead-code surface]
- [Source: `git log --oneline -5` - recent Epic 45 work pattern]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `2026-04-08T00:00+02:00` - Created story context for `45-7-dead-code-cleanup` from Epic 45 / Story 1.7 and current repo inspection.
- `2026-04-08T00:00+02:00` - Verified `DashboardPortraitCard` is orphaned in the live codebase; only the component file and its dedicated unit test still reference the symbol.
- `2026-04-08T00:00+02:00` - Updated `_bmad-output/implementation-artifacts/sprint-status.yaml` to mark `45-7-dead-code-cleanup` as `ready-for-dev`.
- `2026-04-08T11:18:18+0200` - Confirmed `/dashboard` renders only the surviving dashboard cards and does not import or render `DashboardPortraitCard`.
- `2026-04-08T11:18:18+0200` - Updated `_bmad-output/implementation-artifacts/sprint-status.yaml` to mark `45-7-dead-code-cleanup` as `in-progress`.
- `2026-04-08T11:18:18+0200` - Deleted `DashboardPortraitCard.tsx` and `DashboardPortraitCard.test.tsx`; no runtime or test imports remained in `apps/front/src`.
- `2026-04-08T11:20:01+0200` - Post-delete `rg "DashboardPortraitCard"` confirmed remaining matches are limited to historical docs and story artifacts; no live `apps/front/src` references remain.
- `2026-04-08T11:20:01+0200` - `pnpm --filter front exec vitest run src/components/dashboard` passed (`4` files, `17` tests).
- `2026-04-08T11:20:01+0200` - `pnpm build` passed after the cleanup; sprint tracking advanced to `review`.

### Completion Notes List

- Built a scoped cleanup story for deleting the dead dashboard portrait component and its dedicated test.
- Added guardrails to prevent accidental reopening of broader dashboard/profile work.
- Anchored the story to ADR-23, the UX implementation gap, and the live `rg` evidence from the current codebase.
- Specified minimal verification: targeted `rg` sweep plus `pnpm build`, with optional focused test execution only if the delete exposes stale imports.
- Status set to `ready-for-dev`.
- Confirmed the live dashboard route already uses only `DashboardIdentityCard`, `DashboardRelationshipsCard`, `DashboardCreditsCard`, `DashboardEmptyState`, and `DashboardInProgressCard`.
- Removed the orphaned `DashboardPortraitCard` implementation and its dedicated unit test without introducing any replacement dashboard portrait surface.
- Verified no `DashboardPortraitCard` imports remain under `apps/front/src`; remaining grep hits are historical docs and story artifacts only.
- Confirmed the dashboard component test surface still runs cleanly after removing the dead test file (`4` files, `17` tests passed).
- Confirmed `pnpm build` succeeds after the cleanup and the story is ready for review.

### File List

- `_bmad-output/implementation-artifacts/45-7-dead-code-cleanup.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/front/src/components/dashboard/DashboardPortraitCard.tsx`
- `apps/front/src/components/dashboard/DashboardPortraitCard.test.tsx`

### Change Log

- `2026-04-08` - Deleted the orphaned dashboard portrait component and its dedicated unit test; updated story tracking and verification notes.
