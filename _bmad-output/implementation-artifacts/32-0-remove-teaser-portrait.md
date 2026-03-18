# Story 32-0: Remove Teaser Portrait

**Status:** ready-for-dev

**Epic:** Epic 3 — Results, Portrait & Monetization
**Story:** 3.0

## User Story

As a developer,
I want to remove all teaser portrait references from the codebase and planning documents,
So that the architecture is clean and only the full portrait concept exists.

## Acceptance Criteria

**Given** the teaser portrait concept is being removed
**When** the cleanup is performed
**Then:**

1. All teaser portrait references are removed from active code (domain, infrastructure, contracts, API, frontend)
2. The `TeaserPortraitRepository` interface and all implementations (Anthropic, Mock, `__mocks__`) are deleted
3. The `TeaserPortraitError`, `TeaserPortraitInput`, `TeaserPortraitOutput` types are removed from domain exports
4. The `teaserModelId` config field is removed from `AppConfig` interface and all implementations
5. The `TEASER_MODEL_ID` env var is removed from `.env.example`
6. The `teaser` tier is removed from portrait contracts, DB schema type, and portrait-rating types
7. The `TeaserPortrait.tsx` and `TeaserPortraitReadingView.tsx` frontend components are deleted
8. The `teaser` field is removed from `GetPortraitStatusResponse` contract and related use-cases
9. The finalization pipeline (`generate-results.use-case.ts`) no longer generates a teaser portrait — it generates the full portrait directly at finalization
10. The `get-results.use-case.ts` lazy finalization path no longer generates a teaser portrait — it generates the full portrait directly
11. The portrait section pre-purchase shows only the "Unlock your portrait" CTA with no content preview
12. The `ResultsAuthGate` component removes the "teaser" gate mode concept and associated `TEASER_TRAIT_LETTERS` / `TEASER_ARCHETYPE_MASK` usage
13. All tests referencing teaser portrait continue to pass or are updated accordingly

**Given** the teaser portrait agent is removed
**When** the LLM agent inventory is updated
**Then** four agents remain: Nerin (Haiku), ConversAnalyzer v2 (Haiku), Full Portrait (Sonnet), Relationship Analysis (Sonnet)

## Tasks

### Task 1: Delete teaser portrait repository files

**Files to delete:**
- `packages/domain/src/repositories/teaser-portrait.repository.ts`
- `packages/infrastructure/src/repositories/teaser-portrait.anthropic.repository.ts`
- `packages/infrastructure/src/repositories/teaser-portrait.mock.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/teaser-portrait.anthropic.repository.ts`

### Task 2: Remove teaser exports from domain index

**File:** `packages/domain/src/index.ts`
- Remove `TeaserPortraitError`, `TeaserPortraitInput`, `TeaserPortraitOutput`, `TeaserPortraitRepository` exports
- Remove `TEASER_TRAIT_LETTERS` export from archetypes

### Task 3: Remove teaser exports from infrastructure index

**File:** `packages/infrastructure/src/index.ts`
- Remove `TeaserPortraitAnthropicRepositoryLive` and `TeaserPortraitMockRepositoryLive` exports

### Task 4: Remove `teaserModelId` from AppConfig

**Files:**
- `packages/domain/src/config/app-config.ts` — Remove `teaserModelId` field from `AppConfigService`
- `packages/infrastructure/src/config/app-config.live.ts` — Remove `teaserModelId` config loading
- `packages/infrastructure/src/utils/test/app-config.testing.ts` — Remove `teaserModelId` from test config
- `packages/domain/src/config/__mocks__/app-config.ts` — Remove `teaserModelId` from mock config
- `.env.example` — Remove `TEASER_MODEL_ID` line

### Task 5: Remove teaser from API server wiring

**File:** `apps/api/src/index.ts`
- Remove `TeaserPortraitAnthropicRepositoryLive`, `TeaserPortraitMockRepositoryLive` imports
- Remove `TeaserPortraitLayer` constant and its usage in `RepositoryLayers`

### Task 6: Update finalization pipeline — remove teaser, generate full portrait at finalization

**File:** `apps/api/src/use-cases/generate-results.use-case.ts`
- Remove `TeaserPortraitRepository` import and dependency
- Remove teaser portrait generation call
- Remove teaser cost tracking
- Remove teaser placeholder insertion into portraits table
- Instead: generate the full portrait at finalization using `PortraitGeneratorRepository`, store as tier "full" in portraits table
- Update logging references from "teaser" to "portrait"

### Task 7: Update lazy finalization in get-results — remove teaser, generate full portrait

**File:** `apps/api/src/use-cases/get-results.use-case.ts`
- Remove `TeaserPortraitRepository` import and dependency
- Remove teaser portrait generation call
- Remove teaser cost tracking
- Remove teaser placeholder insertion
- Instead: generate the full portrait at finalization using `PortraitGeneratorRepository`, store as tier "full"
- Update logging references

### Task 8: Remove teaser from get-portrait-status use-case

**File:** `apps/api/src/use-cases/get-portrait-status.use-case.ts`
- Remove `TeaserData` interface
- Remove teaser field from `GetPortraitStatusOutput`
- Remove teaser portrait fetching logic
- Return `{ status, portrait }` only

### Task 9: Remove teaser from portrait contracts

**File:** `packages/contracts/src/http/groups/portrait.ts`
- Remove `TeaserPortraitDataSchema`
- Remove `teaser` field from `GetPortraitStatusResponseSchema`
- Keep `tier` in PortraitSchema but change from `S.Literal("teaser", "full")` to `S.Literal("full")`
- Keep `portraitType` in RatePortraitPayloadSchema but change from `S.Literal("teaser", "full")` to `S.Literal("full")`

### Task 10: Remove teaser from assessment contracts

**File:** `packages/contracts/src/http/groups/assessment.ts`
- Remove `TeaserPortraitError` import and error declaration on generate-results endpoint

### Task 11: Remove teaser from assessment handler

**File:** `apps/api/src/handlers/assessment.ts`
- Remove `TeaserPortraitError` catch tag handling

### Task 12: Remove teaser from portrait-rating types

**File:** `packages/domain/src/types/portrait-rating.types.ts`
- Change `PORTRAIT_TYPES` from `["teaser", "full"]` to `["full"]`

### Task 13: Remove teaser from DB schema type annotation

**File:** `packages/infrastructure/src/db/drizzle/schema.ts`
- Change `tier` column type from `$type<"teaser" | "full">()` to `$type<"full">()`
- Update comment about two-tier system

### Task 14: Delete teaser frontend components

**Files to delete:**
- `apps/front/src/components/results/TeaserPortrait.tsx`
- `apps/front/src/components/results/TeaserPortraitReadingView.tsx`

### Task 15: Update ProfileView — remove teaser props and rendering

**File:** `apps/front/src/components/results/ProfileView.tsx`
- Remove `TeaserPortrait` import
- Remove `teaserContent` and `onUnlockPortrait` props
- Remove teaser rendering branch in portrait section
- Show "Unlock your portrait" CTA when no full portrait content exists

### Task 16: Update results page route — remove teaser references

**File:** `apps/front/src/routes/results/$assessmentSessionId.tsx`
- Remove `TeaserPortraitReadingView` import
- Remove teaser reading view branch in portrait mode
- Remove `teaserContent` prop from ProfileView usage
- Update "Read portrait" button condition to only check for full portrait content

### Task 17: Update ResultsAuthGate — simplify gate modes

**File:** `apps/front/src/components/ResultsAuthGate.tsx`
- Remove `TEASER_TRAIT_LETTERS` import
- Rename `GateMode` from `"teaser" | "signup" | "signin"` to `"gate" | "signup" | "signin"` (or simplify)
- Remove `getTeaserOceanCode` function
- Remove `TEASER_ARCHETYPE_MASK`
- Update the initial gate view to not use teaser ocean codes or blurred archetype names

### Task 18: Remove `TEASER_TRAIT_LETTERS` from archetypes

**File:** `packages/domain/src/constants/archetypes.ts`
- Remove `TEASER_TRAIT_LETTERS` constant

### Task 19: Update test files

**Files:**
- `apps/api/src/use-cases/__tests__/generate-results.use-case.test.ts` — Remove teaser mock references, update assertions
- `apps/api/src/use-cases/__tests__/get-portrait-status.use-case.test.ts` — Remove teaser assertions
- `apps/front/src/components/ResultsAuthGate.test.tsx` — Update for removed teaser mode
- `apps/front/src/routes/results-session-route.test.tsx` — Remove teaser references
- Any other test files referencing teaser
