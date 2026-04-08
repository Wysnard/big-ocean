# Story 45.6: Assessment Turn Count - 25->15

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the conversation to be 15 turns (~30 minutes),
so that the assessment is the right length for meaningful personality discovery without unnecessary length.

## Acceptance Criteria

1. **AC1: Rename the assessment-length config surface**
   **Given** the current codebase still exposes `freeTierMessageThreshold`
   **When** this story is implemented
   **Then** that assessment-specific setting is renamed to `assessmentTurnCount` across the live config port, config adapters, mocks, test helpers, HTTP contracts, handler/use-case outputs, and frontend cache/types
   **And** the default value is changed from `25` to `15`
   **And** the env var name remains stable unless a concrete startup/runtime requirement proves it must change in this story
   **And** no extension- or purchase-related product IDs or post-MVP extension semantics are renamed or activated as part of this work.

2. **AC2: Runtime assessment completion and closing logic use 15 turns**
   **Given** the Director-model runtime currently reads the old threshold name/value
   **When** the rename and calibration are complete
   **Then** assessment sessions use `assessmentTurnCount = 15` as the single source of truth for turn counting
   **And** the Director closing phase triggers on the 15th user turn
   **And** any assessment completion checks, resume/list session payloads, chat defaults, and dashboard progress calculations use the renamed field and the new value
   **And** no new behavior is added for dormant extension sessions in this story.

3. **AC3: Depth-meter and milestone behavior is recalibrated for 15 turns**
   **Given** the chat UI already has milestone-aware depth components
   **When** the 15-turn assessment is implemented
   **Then** milestone visuals and milestone copy align with turns approximately 4 (25%), 8 (50%), and 11 (75%)
   **And** the implementation does not accidentally leave the last milestone at turn 12 just because `0.75 * 15 = 11.25`
   **And** chat-header/session-context copy, milestone messaging, and related tests reflect the 15-turn / ~30-minute experience.

4. **AC4: Portrait and user-facing copy match the new assessment length**
   **Given** the repo still contains hard-coded 25-minute and 25-message assessment wording
   **When** this story is implemented
   **Then** portrait-context instructions describe the assessment as a 15-turn conversation
   **And** production-facing frontend copy says "~30 minutes" rather than "25 minutes", "~25 min", or "15 minutes"
   **And** homepage metadata and CTA copy are updated without pulling a full homepage redesign into scope.

5. **AC5: Fixtures, seeds, evaluation scripts, and tests are kept in sync**
   **Given** the current repo has mocks, fixtures, tests, and evaluation scripts pinned to `25`
   **When** the implementation is complete
   **Then** assessment-specific fixtures, helper layers, and tests use `assessmentTurnCount: 15` where appropriate
   **And** any intentionally non-assessment thresholds that should stay `0`, `12`, `30`, or custom values for edge-case coverage remain explicit and readable
   **And** `pnpm typecheck`, `pnpm test:run`, and `pnpm build` pass.

## Tasks / Subtasks

- [x] Task 1: Rename the assessment threshold contract across config and transport layers (AC: 1, 2, 5)
  - [x] 1.1 Update the domain config port in `packages/domain/src/config/app-config.ts` from `freeTierMessageThreshold` to `assessmentTurnCount`.
  - [x] 1.2 Update the live config adapter in `packages/infrastructure/src/config/app-config.live.ts` to expose `assessmentTurnCount` with default `15`.
  - [x] 1.3 Keep the environment variable `FREE_TIER_MESSAGE_THRESHOLD` unless a concrete runtime issue requires an env rename; this story is about semantic cleanup in code, not environment migration churn.
  - [x] 1.4 Update test and mock config providers:
    - `packages/domain/src/config/__mocks__/app-config.ts`
    - `packages/infrastructure/src/utils/test/app-config.testing.ts`
    - any inline `Layer.succeed(AppConfig, ...)` test layers in API tests.
  - [x] 1.5 Rename HTTP response fields in `packages/contracts/src/http/groups/conversation.ts` from `freeTierMessageThreshold` to `assessmentTurnCount`.
  - [x] 1.6 Cascade that contract rename through API outputs and handlers:
    - `apps/api/src/use-cases/list-user-sessions.use-case.ts`
    - `apps/api/src/use-cases/resume-session.use-case.ts`
    - `apps/api/src/handlers/conversation.ts`.

- [x] Task 2: Recalibrate the runtime and assessment-only defaults to 15 turns (AC: 1, 2, 5)
  - [x] 2.1 Update `apps/api/src/use-cases/nerin-pipeline.ts` so the Director-model turn budget reads `config.assessmentTurnCount`.
  - [x] 2.2 Confirm the closing-phase pre-check and final-turn result logic both use turn 15.
  - [x] 2.3 Update frontend session/cache plumbing to use the renamed field:
    - `apps/front/src/hooks/useTherapistChat.ts`
    - `apps/front/src/components/TherapistChat.tsx`
    - `apps/front/src/components/dashboard/DashboardInProgressCard.tsx`
    - `apps/front/src/routes/dashboard.tsx`.
  - [x] 2.4 Replace remaining hard-coded assessment fallbacks such as `25` or `27` with `15` or the renamed runtime field where the code is specifically about the initial assessment.
  - [x] 2.5 Preserve scope: do not invent a second extension threshold or re-enable the extension flow in this story.

- [x] Task 3: Recompute milestone timing for the 15-turn chat experience (AC: 2, 3, 5)
  - [x] 3.1 Update the depth-meter and inline milestone logic so milestone hits occur at turns 4, 8, and 11 for the initial assessment rather than 4, 8, and 12.
  - [x] 3.2 Review both milestone systems:
    - `apps/front/src/components/chat/DepthMeter.tsx`
    - `apps/front/src/components/TherapistChat.tsx`.
  - [x] 3.3 If needed, switch from pure percentage thresholds to explicit turn-based milestone mapping for the 15-turn assessment while keeping the displayed milestone meaning as 25% / 50% / 75%.
  - [x] 3.4 Update the existing depth-meter tests in `apps/front/src/components/chat/__tests__/DepthMeter.test.tsx` and any therapist-chat tests that assert turn thresholds or milestone behavior.

- [x] Task 4: Update portrait prompt text and user-facing duration copy (AC: 4)
  - [x] 4.1 Update `packages/domain/src/constants/nerin/portrait-context.ts` so the portrait instructions reference a 15-turn conversation instead of a 25-message conversation.
  - [x] 4.2 Update production-facing UI copy that still promises 25 minutes or `~25 min`, including:
    - `apps/front/src/routes/index.tsx`
    - `apps/front/src/components/home/HeroSection.tsx`
    - `apps/front/src/components/home/FinalCta.tsx`
    - `apps/front/src/components/home/HowItWorks.tsx`
    - `apps/front/src/components/home/RelationshipCta.tsx`
    - `apps/front/src/components/results/ProfileHowItWorks.tsx`
    - `apps/front/src/components/dashboard/DashboardEmptyState.tsx`
    - `apps/front/src/components/TherapistChat.tsx`.
  - [x] 4.3 Treat homepage work as copy-only for this story. Do not pull in the deferred homepage redesign structure from FR59-FR66.
  - [x] 4.4 Update any QA/demo-only component preview text if it would otherwise create obvious confusion during review (for example `apps/front/src/routes/dev/components.tsx`), but keep that secondary to production code.

- [x] Task 5: Sync fixtures, seeds, scripts, and tests without over-renaming (AC: 1, 5)
  - [x] 5.1 Update assessment-specific API fixtures and tests that still use `freeTierMessageThreshold: 25`, especially:
    - `apps/api/src/use-cases/__tests__/__fixtures__/send-message.fixtures.ts`
    - `apps/api/src/use-cases/__tests__/__fixtures__/start-assessment.fixtures.ts`
    - `apps/api/src/use-cases/__tests__/list-user-sessions.use-case.test.ts`
    - `apps/api/src/use-cases/__tests__/resume-session.use-case.test.ts`
    - `apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts`
    - related send-message, session-linking, extraction, check-in, and recapture tests.
  - [x] 5.2 Update frontend fixtures/tests that still expect the old field/value:
    - `apps/front/src/components/__fixtures__/therapist-chat.fixtures.tsx`
    - `apps/front/src/hooks/useTherapistChat-core.test.ts`
    - `apps/front/src/hooks/useTherapistChat-network.test.ts`
    - `apps/front/src/hooks/useTherapistChat-resume.test.ts`
    - `e2e/specs/dashboard-page.spec.ts`.
  - [x] 5.3 Update evaluation/support scripts that intentionally model the assessment turn count:
    - `scripts/eval-portrait.ts`
    - any other assessment-eval or seed helpers discovered during implementation.
  - [x] 5.4 Preserve intentional non-default test coverage, such as custom threshold values used to verify edge cases, by renaming the property but not flattening the scenario.

- [x] Task 6: Validate and sweep for stale naming/copy (AC: 1, 4, 5)
  - [x] 6.1 Run `pnpm typecheck`.
  - [x] 6.2 Run `pnpm test:run`.
  - [x] 6.3 Run `pnpm build`.
  - [x] 6.4 Run targeted sweeps to confirm stale runtime references are gone:
    - `rg "freeTierMessageThreshold"`
    - `rg "25-minute|25 minutes|~25 MIN|~25 min"`
    - `rg "25-message conversation|25-turn"`.
  - [x] 6.5 Review remaining matches and confirm each one is either historical documentation, an intentional edge-case fixture value, or a deferred post-MVP extension note.

### Review Findings (Pass 1 — resolved)

- [x] [Review][Decision] `depth-milestones.ts` hard-codes only `totalTurns=15` — fallback for other values creates inconsistent milestone position vs. trigger logic — resolved: generalized fallback added
- [x] [Review][Decision] User-facing copy says "~30 minutes" while assessment shortened from 25→15 turns — resolved: verified against PRD/epics
- [x] [Review][Patch] `FREE_TIER_MESSAGE_THRESHOLD` constant in send-message fixtures not renamed — resolved: renamed to `ASSESSMENT_TURN_COUNT`
- [x] [Review][Patch] Fallback in TherapistChat changed from `27` to `15` — resolved: `?? 15` is correct
- [x] [Review][Patch] `dashboard.tsx` falls back to `?? 0` instead of `?? 15` — resolved: changed to `?? 15`

### Review Findings (Pass 2 — 2026-04-08)

- [x] [Review][Patch] No direct unit tests for `depth-milestones.ts` utility functions — fixed: added `depth-milestones.test.ts` with 13 tests [apps/front/src/components/chat/__tests__/depth-milestones.test.ts]
- [x] [Review][Defer] Dual milestone coordinate systems (TherapistChat int%, DepthMeter decimals) — fragile coupling, not a current bug — deferred, pre-existing
- [x] [Review][Defer] Two divergent "is final turn" checks in nerin-pipeline.ts (exchange count vs. atomic counter) — deferred, pre-existing
- [x] [Review][Defer] `eval-portrait.ts` variable still named `USER_MESSAGE_COUNT` instead of turn terminology — deferred, minor naming inconsistency
- [x] [Review][Defer] Seed script produces 6 user turns vs. 15 threshold — "completed" assessment shows 40% progress — deferred, pre-existing
- [x] [Review][Defer] Stale `MESSAGE_THRESHOLD` references in e2e compose files and comments — deferred, pre-existing dead config
- [x] [Review][Defer] Milestone badge insertion at `i + 1` creates 1-message visual delay vs. depth-meter tick — deferred, pre-existing
- [x] [Review][Defer] Resume milestone race: effect may fire before messages populate on async resume — deferred, pre-existing

## Dev Notes

- **This is a calibration-and-rename story, not a schema story.** Stories 45.1-45.5 already completed the ADR-39 table and FK rename chain. This story should stay focused on the assessment-turn semantic rename plus the 25->15 runtime/copy calibration.
- **The biggest implementation risk is over-renaming.** `freeTierMessageThreshold` is wrong because it describes the assessment length, but not every `sessionId`, extension path, or post-MVP purchase concept should be renamed just because this field changes.
- **The second biggest risk is milestone drift.** With the current percentage-based implementation, the 75% milestone lands on turn 12 when `totalTurns = 15`. The story requirement is approximately turn 11, so the implementation likely needs explicit turn mapping instead of naive percentage math.
- **Homepage work remains copy-only here.** The UX spec's homepage redesign is deferred, but the existing shipped text still has to stop promising 25 minutes. Update copy and metadata only; preserve the current layout and components.

### Architecture Compliance

- **ADR-1 remains the governing architecture pattern.** Keep the hexagonal flow intact: domain config port -> infrastructure config adapter -> contracts -> API use-cases/handlers -> frontend consumers. Do not bypass the established Context.Tag / Layer pattern. [Source: architecture.md - ADR-1, tech stack]
- **ADR-39 is still the epic anchor.** Epic 45 exists to align conversation semantics and assessment-length semantics before launch. This story is the "clear parameter semantics" part of that epic after the schema/repository/handler rename chain is already done. [Source: epics.md - Epic 1 scope; architecture.md - ADR-39]
- **Effect / contract layering matters.** Rename the contract field and use-case outputs cleanly rather than stuffing adapter-only aliases into the frontend forever. The current conversation group is already the active API surface. [Source: architecture.md - route and package structure; packages/contracts/src/http/groups/conversation.ts]

### Library / Framework Requirements

- **Pinned repo stack is the source of truth.** Follow the local versions already committed in `package.json`: TypeScript 5.7, Vitest 4, Turbo 2, pnpm 10, Drizzle Kit beta, TanStack Start/Router/Query, Effect-ts, and React 19.
- **Use existing repo patterns only.** API/config work should follow Effect `Layer.succeed` / `Context.Tag` conventions. Frontend updates should preserve existing React Query cache shapes, TanStack Router usage, and component boundaries. [Source: package.json; architecture.md - tech stack and project structure]
- **No external library changes are needed.** This is an internal refactor/calibration; do not add dependencies or change the test/build toolchain.

### File Structure Requirements

- Primary backend/config surfaces:
  - `packages/domain/src/config/`
  - `packages/infrastructure/src/config/`
  - `packages/contracts/src/http/groups/conversation.ts`
  - `apps/api/src/use-cases/`
  - `apps/api/src/handlers/conversation.ts`
- Primary frontend/runtime surfaces:
  - `apps/front/src/hooks/`
  - `apps/front/src/components/chat/`
  - `apps/front/src/components/dashboard/`
  - `apps/front/src/components/home/`
  - `apps/front/src/routes/`
- Primary test/support surfaces:
  - `apps/api/src/use-cases/__tests__/`
  - `apps/front/src/hooks/*.test.ts`
  - `apps/front/src/components/chat/__tests__/`
  - `e2e/specs/`
  - `scripts/`.

### Testing Requirements

- Run the full repo verification sequence used by recent Epic 45 stories: `pnpm typecheck`, `pnpm test:run`, then `pnpm build`.
- Expect a broad test blast radius because the renamed field crosses config ports, contracts, API outputs, frontend cache shapes, and copy assertions.
- Preserve tests that intentionally use non-default counts for edge cases; rename the property, not the scenario.
- Add or update milestone-specific assertions so the 75% milestone expectation proves the turn-11 behavior rather than only checking percentage labels.

### Previous Story Intelligence

- **Story 45.5's core lesson applies directly:** avoid scope creep and avoid blanket renames. Keep domain concepts stable unless this story is specifically correcting assessment-length semantics.
- **Story 45.5 also showed the right blast radius pattern:** start with the direct property/runtime surfaces, then use targeted grep sweeps to catch fixtures, tests, and support scripts.
- **Story 45.3 matters here too:** handlers, contracts, and frontend already use conversation naming after the earlier cascade. Build on that state rather than reintroducing old assessment-path assumptions.
- **Epic 45 has been validated with full-workspace verification in recent commits.** Follow the same closeout discipline rather than treating this as a "copy-only" tweak.

### Git Intelligence Summary

- Recent Epic 45 commits show a sequential rename pattern with explicit validation:
  - `5418a7cd` - FK column migration
  - `80bb28d2` - FK column code cascade
  - `4eb9c5a3` - finalize story 45-5 and fix test/runtime fallout.
- That history implies Story 45.6 should expect real ripple effects across API outputs, frontend consumers, tests, and support tooling even though the requested change sounds simple.

### Project Structure Notes

- The architecture doc's project tree matches the current repo layout: `apps/api` for Effect handlers/use-cases, `apps/front` for TanStack Start UI, and `packages/domain`, `packages/contracts`, `packages/infrastructure` for the shared boundaries. [Source: architecture.md - project tree]
- No `project-context.md` file was found in the repo, so this story relies on the epics, PRD, architecture, UX spec, previous story docs, and current codebase inspection.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Epic 1, Story 1.6]
- [Source: `_bmad-output/planning-artifacts/prd.md` - 15-exchange assessment, Director model, ~30-minute value contract]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - 15-turn conversation, DepthMeterMilestones, ~30-minute copy]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-1 hexagonal architecture, ADR-39 epic context, tech stack, project structure]
- [Source: `_bmad-output/implementation-artifacts/45-5-fk-column-code-cascade.md` - scope-boundary and grep-sweep learnings]
- [Source: `/package.json` - pinned workspace scripts and tool versions]
- [Source: `packages/domain/src/config/app-config.ts`, `packages/infrastructure/src/config/app-config.live.ts`, `packages/contracts/src/http/groups/conversation.ts` - current config/contract surfaces]
- [Source: `apps/api/src/use-cases/nerin-pipeline.ts`, `apps/front/src/hooks/useTherapistChat.ts`, `apps/front/src/components/TherapistChat.tsx` - active runtime turn-count consumers]
- [Source: `packages/domain/src/constants/nerin/portrait-context.ts` - current "25-message conversation" portrait instruction]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `2026-04-08T01:50+02:00` - Moved `45-6-assessment-turn-count-25-to-15` to `in-progress` in `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- `2026-04-08T01:54+02:00` - Renamed the live assessment-length surface to `assessmentTurnCount` across config, contracts, handlers, frontend consumers, and targeted fixtures/tests.
- `2026-04-08T01:57+02:00` - Added explicit 15-turn milestone mapping (`4 / 8 / 11`) for depth-meter and inline milestone rendering, plus focused milestone assertions.
- `2026-04-08T01:58+02:00` - Ran `pnpm typecheck`; all workspace packages passed after a readonly milestone-prop fix.
- `2026-04-08T01:59+02:00` - Ran `pnpm test:run`; fixed threshold-drift in shared send-message fixtures and updated frontend progress expectations, then reran the full workspace suite successfully.
- `2026-04-08T02:00+02:00` - Ran `pnpm build`; turbo build passed for `api` and `front`.
- `2026-04-08T02:00+02:00` - Ran stale-name/copy sweeps; remaining `freeTierMessageThreshold` hits were limited to historical planning/implementation docs and this story artifact.
- `2026-04-08T10:31+02:00` - Generalized fallback milestone turn mapping so non-15 totals keep tick position and reached-state logic aligned, renamed the shared send-message fixture constant to `ASSESSMENT_TURN_COUNT`, and fixed assessment-turn loading fallbacks in dashboard/chat surfaces.
- `2026-04-08T10:31+02:00` - Re-verified `~30 minutes` copy against `_bmad-output/planning-artifacts/epics.md`, `prd.md`, and `ux-design-specification.md`, then reran `pnpm typecheck`, `pnpm test:run`, and `pnpm build` successfully.

### Completion Notes List

- Renamed the active assessment-length contract from `freeTierMessageThreshold` to `assessmentTurnCount` across the domain config port, live config adapter, HTTP contracts, API use-case outputs, handlers, frontend consumers, and focused mocks/fixtures.
- Kept the environment variable name `FREE_TIER_MESSAGE_THRESHOLD` stable while changing the live default and local Compose default to `15`.
- Recalibrated the runtime to a 15-turn assessment in `nerin-pipeline`, resume/list-session payloads, dashboard progress, therapist chat defaults, and evaluation scripts.
- Added explicit milestone mapping so the 15-turn assessment hits 25% / 50% / 75% milestones at turns `4 / 8 / 11`, avoiding the previous percentage-only drift to turn 12.
- Tightened the post-review follow-up fixes by aligning fallback milestone positioning for non-15 totals, renaming the last stale shared test constant to assessment terminology, and restoring a safe `15`-turn UI fallback while conversation data loads.
- Updated production-facing copy and portrait instructions to describe a 15-turn, `~30 minutes` experience, and updated the dev preview text to match.
- Confirmed the `~30 minutes` promise is intentional and still matches the current planning artifacts for the 15-turn assessment experience.
- Verified `pnpm typecheck`, `pnpm test:run`, and `pnpm build` all passed.
- Status set to `review`.

### File List

- `_bmad-output/implementation-artifacts/45-6-assessment-turn-count-25-to-15.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/api/src/handlers/conversation.ts`
- `apps/api/src/use-cases/list-user-sessions.use-case.ts`
- `apps/api/src/use-cases/resume-session.use-case.ts`
- `apps/api/src/use-cases/nerin-pipeline.ts`
- `apps/api/src/use-cases/__tests__/__fixtures__/get-results.fixtures.ts`
- `apps/api/src/use-cases/__tests__/__fixtures__/send-message.fixtures.ts`
- `apps/api/src/use-cases/__tests__/__fixtures__/start-assessment.fixtures.ts`
- `apps/api/src/use-cases/__tests__/check-check-in.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/check-recapture.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/extraction-pipeline-evidence-processing.test.ts`
- `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/list-user-sessions.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/nerin-pipeline.test.ts`
- `apps/api/src/use-cases/__tests__/resume-session.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/send-message-base.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/send-relationship-analysis-notification.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/send-message-guards.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/session-linking.use-case.test.ts`
- `apps/front/src/components/TherapistChat.tsx`
- `apps/front/src/components/__fixtures__/therapist-chat.fixtures.tsx`
- `apps/front/src/components/chat/DepthMeter.tsx`
- `apps/front/src/components/chat/depth-milestones.ts`
- `apps/front/src/components/chat/__tests__/DepthMeter.test.tsx`
- `apps/front/src/components/dashboard/DashboardEmptyState.tsx`
- `apps/front/src/components/dashboard/DashboardInProgressCard.tsx`
- `apps/front/src/components/home/FinalCta.tsx`
- `apps/front/src/components/home/HeroSection.tsx`
- `apps/front/src/components/home/HowItWorks.tsx`
- `apps/front/src/components/home/RelationshipCta.tsx`
- `apps/front/src/components/results/ProfileHowItWorks.tsx`
- `apps/front/src/constants/chat-placeholders.ts`
- `apps/front/src/hooks/useTherapistChat.ts`
- `apps/front/src/hooks/useTherapistChat-core.test.ts`
- `apps/front/src/hooks/useTherapistChat-network.test.ts`
- `apps/front/src/hooks/useTherapistChat-resume.test.ts`
- `apps/front/src/routes/dashboard.tsx`
- `apps/front/src/routes/dev/components.tsx`
- `apps/front/src/routes/index.tsx`
- `compose.yaml`
- `packages/contracts/src/http/groups/conversation.ts`
- `packages/domain/src/config/__mocks__/app-config.ts`
- `packages/domain/src/config/app-config.ts`
- `packages/domain/src/constants/nerin/portrait-context.ts`
- `packages/infrastructure/src/config/app-config.live.ts`
- `packages/infrastructure/src/utils/test/app-config.testing.ts`
- `scripts/eval-portrait.ts`

## Change Log

- `2026-04-08` - Renamed the live assessment-length surface to `assessmentTurnCount`, recalibrated the assessment from 25 to 15 turns, and updated runtime/frontend/test fixtures accordingly.
- `2026-04-08` - Added explicit 15-turn depth milestones (`4 / 8 / 11`) for both depth-meter ticks and inline milestone copy.
- `2026-04-08` - Closed the post-review cleanup by aligning non-15 fallback milestone math, renaming the last stale send-message fixture constant, and fixing dashboard/chat loading fallbacks.
- `2026-04-08` - Updated user-facing copy to `~30 minutes`, ran validation (`pnpm typecheck`, `pnpm test:run`, `pnpm build`), and advanced the story to `review`.
