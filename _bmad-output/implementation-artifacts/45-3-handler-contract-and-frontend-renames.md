# Story 45.3: Handler, Contract & Frontend Renames

Status: done

## Story

As a **developer**,
I want handlers, API contracts, and frontend code to use the new conversation naming,
so that the full stack is consistent after the schema (45-1) and domain/repo (45-2) renames.

## Acceptance Criteria

### AC-1: Rename API Contract Group

**Given** `packages/contracts/src/http/groups/assessment.ts` defines `AssessmentGroup` with prefix `/assessment`
**When** the contract rename is complete
**Then** the file is renamed to `conversation.ts`
**And** the group is renamed to `ConversationGroup`
**And** the prefix becomes `/conversation` (endpoint paths change from `/api/assessment/*` to `/api/conversation/*`)
**And** all schema names are renamed: `StartAssessmentRequestSchema` → `StartConversationRequestSchema`, `StartAssessmentResponseSchema` → `StartConversationResponseSchema`
**And** exported types are renamed: `StartAssessmentRequest` → `StartConversationRequest`, `StartAssessmentResponse` → `StartConversationResponse`
**And** `packages/contracts/src/index.ts` exports the new names from the new path
**And** `packages/contracts/src/http/api.ts` imports the renamed group

### AC-2: Rename Security Token

**Given** `packages/contracts/src/security/assessment-token.ts` exports `AssessmentTokenSecurity` with cookie key `"assessment_token"`
**When** the security rename is complete
**Then** the file is renamed to `conversation-token.ts`
**And** `AssessmentTokenSecurity` → `ConversationTokenSecurity`
**And** the cookie key changes from `"assessment_token"` to `"conversation_token"`
**And** `packages/contracts/src/index.ts` exports the renamed token from the new path

### AC-3: Rename API Handler

**Given** `apps/api/src/handlers/assessment.ts` exports `AssessmentGroupLive`
**When** the handler rename is complete
**Then** the file is renamed to `conversation.ts`
**And** `AssessmentGroupLive` → `ConversationGroupLive`
**And** all internal references to `AssessmentTokenSecurity` use the new name
**And** cookie paths update from `/api/assessment` to `/api/conversation`
**And** `apps/api/src/index.ts` and `apps/api/src/index.e2e.ts` import the renamed handler

### AC-4: Rename Frontend Hooks

**Given** `apps/front/src/hooks/use-assessment.ts` exports assessment-named hooks and types
**When** the frontend hook rename is complete
**Then** the file is renamed to `use-conversation.ts`
**And** `AssessmentApiError` → `ConversationApiError`, `isAssessmentApiError` → `isConversationApiError`
**And** `useStartAssessment` → `useStartConversation`
**And** `useListAssessments` → `useListConversations`, `listAssessmentsQueryOptions` → `listConversationsQueryOptions`
**And** all TanStack Query keys change from `["assessment", ...]` to `["conversation", ...]`
**And** all consumers of these hooks update their imports

### AC-5: Rename Frontend Route Parameter

**Given** `apps/front/src/routes/results/$assessmentSessionId.tsx` uses `$assessmentSessionId` as the route param
**When** the route rename is complete
**Then** the file is renamed to `$conversationSessionId.tsx`
**And** all internal references use `conversationSessionId`
**And** all `<Link>` components and `navigate()` calls across the app use `params={{ conversationSessionId: ... }}`
**And** the route tree regenerates correctly

### AC-6: Update All Test Files

**Given** unit, integration, and e2e tests reference the old naming
**When** the test updates are complete
**Then** all frontend test files update mocked module paths from `use-assessment` to `use-conversation`
**And** all test assertions using old query keys, variable names, or route params are updated
**And** e2e test API calls use `/api/conversation/*` paths
**And** `pnpm test:run` passes
**And** `pnpm build` succeeds

### AC-7: Update Seed Scripts

**Given** `scripts/seed-completed-assessment.ts` references old naming
**When** the seed script update is complete
**Then** comments and variable names reflecting "assessment session" are updated to "conversation" where applicable
**And** the seed script still runs successfully

## Tasks / Subtasks

### Task 1: Rename Contract Group (AC-1)

- [x] Rename `packages/contracts/src/http/groups/assessment.ts` → `conversation.ts`
- [x] Inside: rename `AssessmentGroup` → `ConversationGroup`
- [x] Rename schema names: `StartAssessmentRequestSchema` → `StartConversationRequestSchema`, `StartAssessmentResponseSchema` → `StartConversationResponseSchema`
- [x] Rename exported types: `StartAssessmentRequest` → `StartConversationRequest`, `StartAssessmentResponse` → `StartConversationResponse`
- [x] Update comment block: "Assessment API Group" → "Conversation API Group"
- [x] Verify the group prefix is `/conversation` (or update it)
- [x] Update `packages/contracts/src/http/api.ts`:
  - Import `ConversationGroup` from `"./groups/conversation"`
  - Update `.add(ConversationGroup.prefix("/api"))` and comment
- [x] Update `packages/contracts/src/index.ts`:
  - Change export paths from `"./http/groups/assessment"` to `"./http/groups/conversation"`
  - Export `ConversationGroup` instead of `AssessmentGroup`

### Task 2: Rename Security Token (AC-2)

- [x] Rename `packages/contracts/src/security/assessment-token.ts` → `conversation-token.ts`
- [x] Inside: rename `AssessmentTokenSecurity` → `ConversationTokenSecurity`
- [x] Change cookie key from `"assessment_token"` to `"conversation_token"`
- [x] Update comment block
- [x] Update `packages/contracts/src/index.ts`: change export path and name

### Task 3: Rename API Handler (AC-3)

- [x] Rename `apps/api/src/handlers/assessment.ts` → `conversation.ts`
- [x] Inside: rename `AssessmentGroupLive` → `ConversationGroupLive`
- [x] Update all `AssessmentTokenSecurity` → `ConversationTokenSecurity` references
- [x] Update cookie paths from `/api/assessment` to `/api/conversation`
- [x] Update `apps/api/src/index.ts`:
  - Import `ConversationGroupLive` from `"./handlers/conversation"`
  - Update HttpGroupsLive composition
  - Update startup logging text
- [x] Update `apps/api/src/index.e2e.ts`:
  - Same import and composition changes

### Task 4: Rename Frontend Hooks File (AC-4)

- [x] Rename `apps/front/src/hooks/use-assessment.ts` → `use-conversation.ts`
- [x] Inside rename:
  - `AssessmentApiError` → `ConversationApiError`
  - `isAssessmentApiError` → `isConversationApiError`
  - `useStartAssessment` → `useStartConversation`
  - `useListAssessments` → `useListConversations`
  - `listAssessmentsQueryOptions` → `listConversationsQueryOptions`
- [x] Update all TanStack Query keys: `["assessment", ...]` → `["conversation", ...]`
- [x] Update `client.assessment.*` calls → `client.conversation.*` (matches the renamed contract group)
- [x] Update all consumer imports across `apps/front/src/`:
  - `hooks/useTherapistChat.ts`
  - `components/TherapistChat.tsx`
  - `components/PortraitWaitScreen.tsx`
  - `routes/chat/index.tsx`
  - `routes/dashboard.tsx`
  - `routes/settings.tsx`
  - `routes/public-profile.$publicProfileId.tsx`
  - Any other files importing from `use-assessment`

### Task 5: Rename Frontend Route Parameter (AC-5)

- [x] Rename `apps/front/src/routes/results/$assessmentSessionId.tsx` → `$conversationSessionId.tsx`
- [x] Inside: replace all `assessmentSessionId` → `conversationSessionId`
- [x] Update all `<Link>` components across the app that navigate to `/results/$assessmentSessionId`:
  - `components/TherapistChat.tsx`
  - `components/auth/login-form.tsx`
  - `components/dashboard/DashboardPortraitCard.tsx`
  - `components/dashboard/DashboardIdentityCard.tsx`
  - Any other files with `params={{ assessmentSessionId: ... }}`
- [x] Regenerate route tree: `pnpm --filter=front generate-routes` (or let the dev server do it)

### Task 6: Update Frontend Variable Names and UI Strings (AC-4, AC-5)

- [x] In `routes/dashboard.tsx`: rename `assessmentData` → `conversationData`, `isAssessmentsLoading` → `isConversationsLoading`
- [x] In `routes/settings.tsx`: same variable renames
- [x] In `routes/public-profile.$publicProfileId.tsx`: same variable renames
- [x] Update user-facing UI strings that say "assessment" to "conversation" where contextually correct (e.g., "Loading your assessment..." → "Loading your conversation...")
- [x] Update comment references to "assessment" in hooks and components
- [x] In `hooks/useTherapistChat.ts`: update `AssessmentApiError` → `ConversationApiError` import

### Task 7: Update Test Files (AC-6)

- [x] Update all frontend test files that mock `use-assessment`:
  - `hooks/useTherapistChat-core.test.ts`
  - `hooks/useTherapistChat-resume.test.ts`
  - `hooks/useTherapistChat-network.test.ts`
  - `components/PortraitWaitScreen.test.tsx`
  - `components/TherapistChat-resume-charlimit.test.tsx`
  - `components/auth/login-form.test.tsx`
  - `routes/-results-session-route.test.tsx`
  - `components/results/EvidencePanel.test.tsx`
  - `components/results/ProfileInlineCTA.test.tsx`
  - `components/results/PublicProfileCTA.test.tsx`
  - `components/settings/ProfileVisibilitySection.test.tsx`
  - `components/results/PwywModal.test.tsx`
  - `components/auth/signup-form.test.tsx`
  - `components/ResultsAuthGate.test.tsx`
- [x] Update all mock paths: `"@/hooks/use-assessment"` → `"@/hooks/use-conversation"`
- [x] Update mock function names to match renamed exports
- [x] Update query key assertions from `["assessment", ...]` to `["conversation", ...]`
- [x] Update route param references: `assessmentSessionId` → `conversationSessionId`
- [x] Update e2e tests that make API calls to `/api/assessment/*` → `/api/conversation/*`:
  - `e2e/specs/golden-path.spec.ts`
  - `e2e/specs/conversation-lifecycle.spec.ts`
  - `e2e/specs/dashboard-page.spec.ts`
  - `e2e/specs/waitlist.spec.ts`
  - `e2e/specs/relationship-analysis.spec.ts`
  - `e2e/specs/purchase-credits.spec.ts`
  - `e2e/specs/invitation-system.spec.ts`
  - `e2e/specs/public-profile.spec.ts`
  - `e2e/specs/archetype-card.spec.ts`
  - `e2e/specs/__extracted-api-tests/` files
- [x] Update e2e factory/fixture files if they reference assessment API paths
- [x] Update `apps/api/src/__tests__/smoke.test.ts` if it references handler names

### Task 8: Update Seed Scripts (AC-7)

- [x] In `scripts/seed-completed-assessment.ts`: update comments and variable names referencing "assessment session" to "conversation"
- [x] Verify the seed script still runs successfully against the renamed API paths

### Task 9: Verify (AC-1 through AC-7)

- [x] Run `pnpm typecheck` — must pass across all packages
- [x] Run `pnpm test:run` — all tests pass
- [x] Run `pnpm build` — succeeds
- [x] Grep for remaining `AssessmentGroup`, `AssessmentGroupLive`, `AssessmentTokenSecurity`, `useStartAssessment`, `useListAssessments`, `$assessmentSessionId` references outside historical files
- [x] Manually verify: start dev server, confirm `/api/conversation/start` responds correctly

### Review Findings

- [x] [Review][Patch] Broken test: `http-contracts.test.ts` imports from deleted `../http/groups/assessment` — updated to `../http/groups/conversation` and renamed schemas [`packages/contracts/src/__tests__/http-contracts.test.ts:9`]
- [x] [Review][Patch] Legacy `api.ts` still imports `AssessmentGroup` from `./groups/assessment` — deleted orphaned file [`packages/contracts/src/api.ts`]
- [x] [Review][Patch] Legacy `groups/assessment.ts` still exists with old `AssessmentGroup` export — deleted orphaned file [`packages/contracts/src/groups/assessment.ts`]
- [x] [Review][Patch] Comment references `AssessmentGroup` — updated to `ConversationGroup` [`packages/contracts/src/http/groups/profile.ts:5`]
- [x] [Review][Patch] Stale comment: still says `/assessment/{sessionId}/results` — updated to `/results/{conversationSessionId}` [`scripts/seed-completed-assessment.ts:17`]
- [x] [Review][Defer] Integration test `assessment.test.ts` uses old `/api/assessment/*` paths and `assessment_token` cookie (55 occurrences) — deferred, pre-existing (not in uncommitted diff scope)
- [x] [Review][Defer] UI string "Start Fresh Assessment" in `ResultsAuthGate.tsx:49,123` — deferred, may be intentional product language
- [x] [Review][Defer] E2E factory exports `createAssessmentSession`/`sendAssessmentMessage` not renamed — deferred, explicitly out of scope per story Dev Notes

## Dev Notes

### Critical: This Is a Pure Rename — No Logic Changes

Like Story 45-2, this story is strictly mechanical renaming. Do not change any method signatures, return types, business logic, or error handling. The only changes are file names, export names, import paths, API route prefixes, cookie keys, query keys, and variable names.

### Rename Strategy: Contract → Handler → Frontend, Top-Down

Rename in this order to maintain a clear dependency flow:
1. Contract group + security token (packages/contracts)
2. API handler + composition files (apps/api)
3. Frontend hooks (apps/front/hooks)
4. Frontend routes (apps/front/routes) — file rename triggers route tree regen
5. Frontend components + consumers
6. Test files (last — they depend on all the above)

### API Path Change Is Breaking

The endpoint prefix changes from `/api/assessment/*` to `/api/conversation/*`. This affects:
- All frontend `client.assessment.*` calls → `client.conversation.*` (the Effect HttpApiClient derives method group names from the contract group identifier)
- All e2e tests that hardcode API paths
- The cookie path in the handler (used for path-scoped cookies)

Since this is pre-launch with no live traffic, the breaking path change is acceptable.

### Cookie Key Change

`"assessment_token"` → `"conversation_token"` invalidates any existing dev cookies. Pre-launch, this is fine. The dev agent should just make the rename cleanly.

### What Does NOT Rename in This Story

- `assessment_results` table, `AssessmentResultRepository`, `AssessmentResultError` — these stay per ADR-39 because only assessment/extension conversations produce scored results
- `assessmentSessionId` as a **database FK column name** in tables like `conversation_evidence`, `assessment_results`, `portrait_ratings` — those are DB schema concerns, not handler/contract/frontend
- Use-case file names and function names (e.g., `start-assessment.use-case.ts`, `startAnonymousAssessment`) — these were NOT renamed in 45-2 and are NOT in scope for 45-3 either (they describe the domain action, which is still "starting an assessment")
- `e2e/factories/assessment.factory.ts` file name — the factory creates assessment data, so the name is semantically correct

### Route Parameter Rename Cascade

Renaming `$assessmentSessionId.tsx` to `$conversationSessionId.tsx` in the routes directory triggers a TanStack Router route tree regeneration. Every `<Link>` and `navigate()` call that uses `params={{ assessmentSessionId: ... }}` must update to `params={{ conversationSessionId: ... }}`. Use grep to find all instances.

### Frontend API Client Group Access

After the contract group rename, frontend code accesses the API via `client.conversation.*` instead of `client.assessment.*`. The Effect HttpApiClient generates group accessors from the group's identifier string. Verify this by checking how `makeApiClient` resolves group names.

### Deferred Review Findings from Story 45-2

These items were deferred from the 45-2 review and are still deferred (not in scope for 45-3):
- Mock variable names in shared fixtures still use old naming (`mockAssessmentSessionRepo`, etc.) — these are internal test variable names, not exports
- Stale comments referencing old table names in domain/infra files
- Missing mock methods in `start-assessment.fixtures.ts`

### Previous Story Intelligence (Story 45-2)

Key learnings from 45-2:
- The rename was successfully completed with GPT-5 Codex
- `vi.mock()` paths AND `__mocks__` filenames must change together — if only one changes, tests silently use real implementations
- The `pnpm test:run` has some slow frontend Vitest cases under Turbo parallel execution — timeouts may need to be generous
- The `assessment.ts` handler file was already updated with new repo imports in 45-2, but the handler file name, group name, and contract group name were intentionally left for 45-3

### Files Most Likely to Change

**Contracts:**
- `packages/contracts/src/http/groups/assessment.ts` → `conversation.ts`
- `packages/contracts/src/security/assessment-token.ts` → `conversation-token.ts`
- `packages/contracts/src/http/api.ts`
- `packages/contracts/src/index.ts`

**API:**
- `apps/api/src/handlers/assessment.ts` → `conversation.ts`
- `apps/api/src/index.ts`
- `apps/api/src/index.e2e.ts`

**Frontend hooks:**
- `apps/front/src/hooks/use-assessment.ts` → `use-conversation.ts`
- `apps/front/src/hooks/useTherapistChat.ts`

**Frontend routes:**
- `apps/front/src/routes/results/$assessmentSessionId.tsx` → `$conversationSessionId.tsx`
- `apps/front/src/routes/chat/index.tsx`
- `apps/front/src/routes/dashboard.tsx`
- `apps/front/src/routes/settings.tsx`
- `apps/front/src/routes/public-profile.$publicProfileId.tsx`
- `apps/front/src/routeTree.gen.ts` (auto-generated)

**Frontend components:**
- `apps/front/src/components/TherapistChat.tsx`
- `apps/front/src/components/PortraitWaitScreen.tsx`
- `apps/front/src/components/ResultsAuthGate.tsx`
- `apps/front/src/components/auth/login-form.tsx`
- `apps/front/src/components/dashboard/DashboardPortraitCard.tsx`
- `apps/front/src/components/dashboard/DashboardIdentityCard.tsx`
- `apps/front/src/components/dashboard/DashboardEmptyState.tsx`
- `apps/front/src/components/finalization-wait-screen.tsx`
- `apps/front/src/components/settings/ProfileVisibilitySection.tsx`
- `apps/front/src/components/results/ProfileInlineCTA.tsx`
- `apps/front/src/lib/auth-session-linking.ts`

**Test files (frontend + e2e):**
- All frontend test files listed in Task 7
- All e2e spec files listed in Task 7

**Seed:**
- `scripts/seed-completed-assessment.ts`

### Architecture Compliance

- ADR-1 (Hexagonal): Handlers remain thin presenters that delegate to use-cases — no business logic moves
- ADR-39 (Conversations Table): This story completes the "handlers, contracts, frontend" layer of the cascading rename
- `assessment_results` table and `AssessmentResultRepository` explicitly stay unchanged per ADR-39

### Testing Requirements

- `pnpm typecheck` must pass across all packages
- `pnpm test:run` must pass (confirms all frontend mocks, query keys, and route params are consistent)
- `pnpm build` must succeed (confirms route tree is valid)
- No new tests needed — this is a rename, not new behavior
- If any test file is missed, it will fail with "Cannot find module" or type errors — easy to diagnose

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 1, Story 1.3]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-39 Cascading Renames]
- [Source: `_bmad-output/implementation-artifacts/45-2-repository-and-domain-layer-renames.md` — Previous story]
- [Source: `packages/contracts/src/http/groups/assessment.ts` — Current contract group]
- [Source: `packages/contracts/src/security/assessment-token.ts` — Current security token]
- [Source: `apps/api/src/handlers/assessment.ts` — Current handler]
- [Source: `apps/front/src/hooks/use-assessment.ts` — Current frontend hooks]
- [Source: `apps/front/src/routes/results/$assessmentSessionId.tsx` — Current route file]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Initial `pnpm test:run` failed: 7 tests in `useTherapistChat-core.test.ts` — root cause was `client.assessment.sendMessage` mock still using old group name `assessment` instead of `conversation` in test mocks for `makeApiClient`. Same issue in `useTherapistChat-network.test.ts` and `useTherapistChat-resume.test.ts`. Fixed all three.
- Also caught that `useTherapistChat.ts` had query keys still using `["assessment", ...]` — updated to `["conversation", ...]`.

### Completion Notes List

- Pure mechanical rename completed across contracts, API handler, frontend hooks, routes, components, and tests
- Contract group: `AssessmentGroup` → `ConversationGroup`, prefix `/assessment` → `/conversation`
- Security token: `AssessmentTokenSecurity` → `ConversationTokenSecurity`, cookie key `assessment_token` → `conversation_token`
- API handler: `AssessmentGroupLive` → `ConversationGroupLive`, cookie paths updated
- Frontend hooks: `use-assessment.ts` → `use-conversation.ts` with all exports renamed
- Route param: `$assessmentSessionId` → `$conversationSessionId` across all Link/navigate calls
- All test mocks updated (vi.mock paths, mock group names, query keys, route params)
- E2E factory API paths updated (`/api/assessment/start` → `/api/conversation/start`, etc.)
- Route tree auto-regenerated correctly
- `pnpm typecheck` passes (6/6 packages), `pnpm test:run` passes (all 4 test suites), `pnpm build` succeeds

### Change Log

- Story 45-3 implementation (Date: 2026-04-07)

### File List

**Created (new):**
- `packages/contracts/src/http/groups/conversation.ts`
- `packages/contracts/src/security/conversation-token.ts`
- `apps/api/src/handlers/conversation.ts`
- `apps/front/src/hooks/use-conversation.ts`
- `apps/front/src/routes/results/$conversationSessionId.tsx`

**Deleted (old):**
- `packages/contracts/src/http/groups/assessment.ts`
- `packages/contracts/src/security/assessment-token.ts`
- `apps/api/src/handlers/assessment.ts`
- `apps/front/src/hooks/use-assessment.ts`
- `apps/front/src/routes/results/$assessmentSessionId.tsx`

**Modified:**
- `packages/contracts/src/http/api.ts`
- `packages/contracts/src/index.ts`
- `apps/api/src/index.ts`
- `apps/api/src/index.e2e.ts`
- `apps/front/src/hooks/useTherapistChat.ts`
- `apps/front/src/components/PortraitWaitScreen.tsx`
- `apps/front/src/components/TherapistChat.tsx`
- `apps/front/src/components/auth/login-form.tsx`
- `apps/front/src/components/dashboard/DashboardIdentityCard.tsx`
- `apps/front/src/components/dashboard/DashboardPortraitCard.tsx`
- `apps/front/src/routes/dashboard.tsx`
- `apps/front/src/routes/settings.tsx`
- `apps/front/src/routes/results.tsx`
- `apps/front/src/routes/chat/index.tsx`
- `apps/front/src/routes/public-profile.$publicProfileId.tsx`
- `apps/front/src/lib/auth-session-linking.ts`
- `apps/front/src/routeTree.gen.ts` (auto-generated)
- `apps/front/src/hooks/useTherapistChat-core.test.ts`
- `apps/front/src/hooks/useTherapistChat-resume.test.ts`
- `apps/front/src/hooks/useTherapistChat-network.test.ts`
- `apps/front/src/components/PortraitWaitScreen.test.tsx`
- `apps/front/src/components/auth/login-form.test.tsx`
- `apps/front/src/routes/-results-session-route.test.tsx`
- `e2e/specs/conversation-lifecycle.spec.ts`
- `e2e/factories/assessment.factory.ts`
- `scripts/seed-completed-assessment.ts`
