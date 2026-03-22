# Story 35-3: Relationship Analysis Display

**Status:** ready-for-dev
**Epic:** 6 — Relationship Analysis — Generation & Display
**Story:** 6.3 — Relationship Analysis Display
**Priority:** High
**Depends on:** Story 35-1 (Ritual Suggestion Screen), Story 35-2 (Relationship Analysis Generation)

---

## User Story

As a user,
I want to read the relationship analysis in a rich, immersive format,
So that I understand the dynamics between us in a meaningful way.

## Acceptance Criteria

### AC-1: Generating State
**Given** the relationship analysis is generating
**When** the user views the analysis page (`/relationship/$analysisId`)
**Then** a loading state with skeleton pulse is displayed
**And** the client polls relationship analysis status every 5s
**And** polling stops on "ready" or "failed"

### AC-2: Ready State — Analysis Content
**Given** the analysis is ready
**When** the page renders
**Then** the analysis content renders via the Portrait Spine Renderer (reused from Epic 3)
**And** both users' names are displayed in the page header
**And** a back button navigates to the home page

### AC-3: Failed State — Retry
**Given** the analysis generation failed
**When** the user views the analysis page
**Then** a failure message is displayed
**And** a retry button is available that calls POST `/relationship/analysis/:analysisId/retry`
**And** on successful retry, the page transitions to the generating state

### AC-4: Version Badge
**Given** the analysis may be based on outdated assessment results
**When** `isLatestVersion` is false in the API response
**Then** a "Previous version" badge is displayed on the analysis

### AC-5: Mobile Layout
**Given** the analysis display on mobile
**When** viewport is <640px
**Then** the layout stacks appropriately
**And** all interactive elements meet 44px minimum tap targets

### AC-6: Accessibility
**Given** a screen reader encounters the analysis
**When** the page renders
**Then** the analysis content is semantically structured
**And** the retry button has appropriate aria-labels
**And** loading/error states are announced via appropriate roles

### AC-7: Auth Guard
**Given** a user is not authenticated
**When** they navigate to the analysis page
**Then** they are redirected to the login page

---

## Tasks

### Task 1: Enhance the RelationshipAnalysisPage Component
**File:** `apps/front/src/routes/relationship/$analysisId.tsx`

Rewrite the existing relationship analysis page route to:

#### Subtask 1.1: Add polling for generating state
- When `data.content === null`, enable `refetchInterval: 5000` to poll every 5s
- Stop polling when content becomes non-null or status is failed
- Show skeleton pulse loading animation during generation

#### Subtask 1.2: Render analysis content via Portrait Spine Renderer
- Reuse the `splitMarkdownSections`, `markdownComponents`, and `renderHeader` utilities from `portrait-markdown.tsx`
- Create a `RelationshipPortrait` component that renders the analysis content using the same section-based layout as `PersonalPortrait`
- Display both users' names in the header: "{userAName} & {userBName}"

#### Subtask 1.3: Add retry functionality for failed state
- Detect "failed" state: when content is null and analysis has been generating too long (use a retry button always visible when content is null and not in initial load)
- Wire up POST `/relationship/analysis/:analysisId/retry` via Effect HttpApiClient
- On successful retry, set state back to generating/polling

#### Subtask 1.4: Add version badge
- When `isLatestVersion` is false, render a "Previous version" badge
- Use muted styling to not distract from content

#### Subtask 1.5: Add auth guard via beforeLoad
- Use the Route Loader Auth Pattern with `getSession()` in `beforeLoad`
- Redirect unauthenticated users to `/login`

### Task 2: Create RelationshipPortrait Component
**File:** `apps/front/src/components/relationship/RelationshipPortrait.tsx`

#### Subtask 2.1: Create component
- Accept props: `content: string`, `userAName: string`, `userBName: string`, `isLatestVersion: boolean`
- Reuse `splitMarkdownSections`, `renderHeader`, `markdownComponents` from portrait-markdown
- Render sections in AccentCard with appropriate styling
- Show "Previous version" badge when `isLatestVersion` is false

#### Subtask 2.2: Write tests
**File:** `apps/front/src/components/relationship/RelationshipPortrait.test.tsx`
- Test rendering of markdown content sections
- Test "Previous version" badge visibility
- Test both user names displayed
- Test data-testid attributes

### Task 3: Create useRelationshipAnalysisPolling Hook
**File:** `apps/front/src/hooks/useRelationshipAnalysisPolling.ts`

#### Subtask 3.1: Implement polling hook
- Use `useQuery` with `refetchInterval` that returns `5000` when content is null, `false` when ready
- Use Effect HttpApiClient pattern from `makeApiClient`

#### Subtask 3.2: Create useRetryRelationshipAnalysis mutation hook
- Use `useMutation` with Effect HttpApiClient
- Invalidate the analysis query on success

#### Subtask 3.3: Write tests
**File:** `apps/front/src/hooks/useRelationshipAnalysisPolling.test.ts`
- Test that polling is enabled when content is null
- Test that polling stops when content is ready

### Task 4: Update Route with Enhanced Page Component
**File:** `apps/front/src/routes/relationship/$analysisId.tsx`

#### Subtask 4.1: Integrate all components
- Wire `RelationshipPortrait` component
- Wire polling hook
- Wire retry mutation
- Add `beforeLoad` auth guard
- Ensure proper loading/error/ready state transitions

#### Subtask 4.2: Write route-level integration tests (component tests)
- Test auth redirect behavior
- Test loading → ready transition
- Test retry flow

---

## Technical Notes

- **Portrait Spine Renderer reuse:** The story spec calls for reusing the "Portrait Spine Renderer" from Epic 3. In the current codebase, portrait rendering uses `splitMarkdownSections` + `markdownComponents` from `portrait-markdown.tsx` and `PersonalPortrait.tsx`. The `RelationshipPortrait` component should follow the same pattern.
- **Polling pattern:** Follow the existing `usePortraitStatus` polling pattern from FRONTEND.md using TanStack Query's `refetchInterval`.
- **API client pattern:** Use `makeApiClient` from `apps/front/src/lib/api-client.ts` with Effect `HttpApiClient`.
- **Auth guard:** Use `getSession()` in `beforeLoad` per the Route Loader Auth Pattern in CLAUDE.md.
- **Existing contracts:** The `getRelationshipAnalysis` and `retryRelationshipAnalysis` endpoints already exist in `packages/contracts/src/http/groups/relationship.ts`.
- **Existing use-cases:** Backend use-cases already exist for `get-relationship-analysis` and `retry-relationship-analysis`.

## Out of Scope

- Dual-polygon radar chart (comparing both users' trait scores) — deferred to a future story when trait data is exposed in the analysis API response
- Archetype cards for both users — deferred until archetype data is available in the analysis response
- Confidence rings — deferred until confidence data is available
