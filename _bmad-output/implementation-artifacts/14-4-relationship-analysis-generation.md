# Story 14.4: Relationship Analysis Generation

Status: done

## Story

As a user,
I want to see how my personality compares with someone I invited,
So that I gain insight into our relationship dynamics.

## Acceptance Criteria

1. **Given** an invitee accepts the invitation, **When** the accept-invitation use-case completes, **Then** a placeholder row is inserted into `relationship_analyses` (content: null) and a forkDaemon is spawned to generate the analysis in the background.

2. **Given** the relationship analysis daemon runs, **When** it calls the LLM with both users' facet data + finalization evidence, **Then** the `relationship_analyses` row is updated with the generated content (idempotent: `WHERE content IS NULL`).

3. **Given** the daemon fails after retries, **When** the error is caught, **Then** `retry_count` is incremented and the placeholder row remains with `content: null`.

4. **Given** a relationship analysis is ready, **When** either participant navigates to their results page, **Then** a `RelationshipCard` renders with state `ready` showing a summary and link to the full analysis.

5. **Given** the inviter views their results page, **When** they have pending/accepted/refused invitations, **Then** the `RelationshipCard` renders the correct state from the discriminated union: `invite-prompt | pending-sent | generating | ready | declined | no-credits`.

6. **Given** a relationship analysis is ready, **When** either user views the analysis, **Then** they see a comparison of their personality profiles — the analysis is accessible independently (no "read together" gate).

7. **Given** a pending invitation exists, **When** the invitee views their results page, **Then** a `RelationshipCard` renders with state `pending-received` showing inviter name and accept/refuse options.

## Tasks / Subtasks

### Backend

- [x] **Task 1: RelationshipAnalysis domain layer** (AC: #1, #2, #3)
  - [x] 1.1 Create `packages/domain/src/repositories/relationship-analysis.repository.ts` — Context.Tag with methods: `insertPlaceholder({ id, invitationId, userAId, userBId })`, `updateContent({ id, content, modelUsed })`, `incrementRetryCount(id)`, `getByInvitationId(invitationId)`, `getByUserId(userId)`
  - [x] 1.2 Add `RelationshipAnalysis` type to `packages/domain/src/types/relationship.types.ts` — `{ id, invitationId, userAId, userBId, content: string | null, modelUsed: string | null, retryCount, createdAt }`
  - [x] 1.3 Export new repository and types from `packages/domain/src/index.ts`

- [x] **Task 2: RelationshipAnalysis infrastructure** (AC: #1, #2, #3)
  - [x] 2.1 Create `packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts` — implements all methods against existing `relationshipAnalyses` table. Canonical user ordering: `userAId = MIN(inviter, invitee)`, `userBId = MAX(inviter, invitee)`
  - [x] 2.2 Create `packages/infrastructure/src/repositories/__mocks__/relationship-analysis.drizzle.repository.ts` — in-memory mock for unit tests

- [x] **Task 3: Relationship analysis LLM prompt** (AC: #2, #6)
  - [x] 3.1 Create `packages/domain/src/prompts/relationship-analysis.prompt.ts` — Sonnet prompt that takes both users' facet scores, trait scores, and finalization evidence; generates a personality comparison analysis

- [x] **Task 4: RelationshipAnalysisGenerator repository** (AC: #2)
  - [x] 4.1 Create `packages/domain/src/repositories/relationship-analysis-generator.repository.ts` — Context.Tag with `generateAnalysis` method (takes both users' data, returns string content)
  - [x] 4.2 Create `packages/infrastructure/src/repositories/relationship-analysis-generator.anthropic.repository.ts` — calls Anthropic Sonnet with the relationship prompt
  - [x] 4.3 Create corresponding `__mocks__/` file with deterministic mock response

- [x] **Task 5: generate-relationship-analysis use-case (daemon)** (AC: #2, #3)
  - [x] 5.1 Create `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` — follows `generate-full-portrait.use-case.ts` pattern exactly:
    1. Load inviter's assessment result, evidence, facet scores (via data access path: `findSessionByUserId → getBySessionId → getByResultId`)
    2. Load invitee's assessment result, evidence, facet scores — if invitee has no completed assessment yet, fail with a retryable error (the retry schedule will re-attempt; the invitee may complete their assessment between retries)
    3. Call `RelationshipAnalysisGeneratorRepository.generateAnalysis()` with retry (Schedule.exponential, 3 attempts)
    4. On success: `RelationshipAnalysisRepository.updateContent({ content, modelUsed })` (idempotent — populate `model_used` column with the model string returned by the Anthropic SDK)
    5. On failure: `RelationshipAnalysisRepository.incrementRetryCount()`
  - [x] 5.2 Create `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts`

- [x] **Task 6: Extend accept-invitation to trigger analysis** (AC: #1)
  - [x] 6.1 Modify `apps/api/src/use-cases/accept-invitation.use-case.ts`:
    1. After `repo.acceptInvitation()`, load both users' session IDs
    2. Insert placeholder row via `RelationshipAnalysisRepository.insertPlaceholder()` — wrap in `catchTag("DatabaseUniqueConstraintError", () => Effect.void)` to no-op if placeholder already exists (handles race with auto-accept via Better Auth hooks)
    3. `Effect.forkDaemon(generateRelationshipAnalysis({ analysisId, inviterSessionId, inviteeSessionId }))`
  - [x] 6.2 Update `apps/api/src/use-cases/__tests__/accept-invitation.use-case.test.ts`

- [x] **Task 7: Relationship state endpoint** (AC: #4, #5, #7)
  - [x] 7.1 Add `getRelationshipState` endpoint to `RelationshipGroup` in contracts — returns `RelationshipCardState` discriminated union
  - [x] 7.2 Create `apps/api/src/use-cases/get-relationship-state.use-case.ts` — implements Decision Tree 1 (see Dev Notes)
  - [x] 7.3 Add handler in `apps/api/src/handlers/relationship.ts`
  - [x] 7.4 Unit tests for all 7 states (including invitee-side `generating` and `ready`)

- [x] **Task 8: Get analysis endpoint** (AC: #6)
  - [x] 8.1 Add `getRelationshipAnalysis` endpoint to `RelationshipGroup` — returns full analysis content for authorized user
  - [x] 8.2 Create `apps/api/src/use-cases/get-relationship-analysis.use-case.ts` — verify requesting user is either userA or userB
  - [x] 8.3 Handler + unit tests

### Frontend

- [x] **Task 9: RelationshipCard component** (AC: #4, #5, #7)
  - [x] 9.1 Create `apps/front/src/components/relationship/RelationshipCard.tsx` — renders one of 7 states from the discriminated union. Use `data-testid="relationship-card"` and `data-testid="relationship-card-state-{state}"`
  - [x] 9.2 Add `RelationshipInviteNudge` sub-component for the results page CTA
  - [x] 9.3 Wire into results page layout

- [x] **Task 10: Relationship analysis view page** (AC: #6)
  - [x] 10.1 Create route `apps/front/src/routes/relationship/$analysisId.tsx` — displays the full comparison analysis
  - [x] 10.2 Fetch analysis via `getRelationshipAnalysis` endpoint
  - [x] 10.3 Add `data-testid="relationship-analysis-page"`

### E2E

- [ ] **Task 11: E2E tests** (AC: #1-#7)
  - [ ] 11.1 Extend `e2e/specs/invitee-flow.spec.ts` or create `e2e/specs/relationship-analysis.spec.ts` — test that after accept, analysis is eventually generated (poll or wait for `RelationshipCard` state transition)
  - [ ] 11.2 Test relationship card renders correct states on results page

## Dev Notes

### Decision Tree 1: RelationshipCard State Resolution

```
1. Is user authenticated? → No → don't render
2. Query invitations WHERE invitee_id = userId AND status = 'pending'
   ├─ Has pending → state: 'pending-received'
   └─ No pending
       3. Query invitations WHERE invitee_id = userId AND status = 'accepted'
          ├─ Has accepted, analysis.content IS NULL → state: 'generating'
          ├─ Has accepted, analysis.content IS NOT NULL → state: 'ready'
          └─ No accepted-as-invitee
              4. Query invitations WHERE inviter_id = userId
                 ├─ Has pending → state: 'pending-sent'
                 ├─ Has accepted, analysis.content IS NULL → state: 'generating'
                 ├─ Has accepted, analysis.content IS NOT NULL → state: 'ready'
                 ├─ Has refused → state: 'declined'
                 └─ None → check credits
                     ├─ Has credits → state: 'invite-prompt'
                     └─ No credits → state: 'no-credits'
```

### Placeholder Row Pattern (from architecture ADR)

```typescript
// ALWAYS: Insert placeholder → forkDaemon → daemon UPDATEs
// NEVER: forkDaemon → daemon INSERTs
yield* analysisRepo.insertPlaceholder({ id, invitationId, userAId, userBId })
yield* Effect.forkDaemon(generateRelationshipAnalysis({ analysisId: id, ... }))
// Daemon: UPDATE SET content = '...' WHERE id = X AND content IS NULL
```

### Canonical User Ordering

`userAId = MIN(inviterId, inviteeId)`, `userBId = MAX(inviterId, inviteeId)` — ensures deterministic ordering regardless of who initiated.

### Data Access Path (for daemon)

```
userId → AssessmentSessionRepository.findSessionByUserId(userId)
       → AssessmentResultRepository.getBySessionId(sessionId)
       → FinalizationEvidenceRepository.getByResultId(resultId)
```

### RelationshipCardState Type

**Location:** `packages/contracts/src/http/groups/relationship.ts` (returned by HTTP endpoint, so lives in contracts per architecture rules)

```typescript
type RelationshipCardState =
  | { _tag: 'invite-prompt'; availableCredits: number }
  | { _tag: 'pending-sent'; inviteeName: string }
  | { _tag: 'pending-received'; inviterName: string; invitationId: string }
  | { _tag: 'generating' }
  | { _tag: 'ready'; analysisId: string; partnerName: string }
  | { _tag: 'declined'; inviteeName: string }
  | { _tag: 'no-credits' }
```

### Contract Errors

Add to `packages/contracts/src/errors.ts`:
- `RelationshipAnalysisNotFound` (404) — analysis does not exist
- `RelationshipAnalysisUnauthorized` (403) — requesting user is neither `userAId` nor `userBId`

### Frontend Polling for "generating" → "ready"

The `RelationshipCard` in `generating` state should poll the `getRelationshipState` endpoint every 5 seconds using TanStack Query's `refetchInterval` option. Stop polling once state transitions to `ready`. This is the simplest approach consistent with the existing stack (no WebSocket infrastructure needed for MVP).

```typescript
useQuery({
  queryKey: ['relationship-state'],
  queryFn: () => fetchRelationshipState(),
  refetchInterval: (query) =>
    query.state.data?._tag === 'generating' ? 5000 : false,
})
```

### Reference Implementation

Follow `generate-full-portrait.use-case.ts` (Story 13.3) exactly for the daemon pattern — same retry strategy, same error handling, same idempotent update.

### Existing DB Table

`relationship_analyses` table already exists in schema (Story 14-2). No migration needed. Schema:
- `id` (UUID PK), `invitation_id` (FK UNIQUE), `user_a_id`, `user_b_id`, `content` (nullable), `model_used`, `retry_count` (default 0), `created_at`

### Previous Story Learnings (14-3)

- SSR cookie forwarding doesn't work with `getSession()` — use client-side `useEffect` for auth-dependent state
- `data-testid` attributes required on all new components for e2e
- Better Auth hooks (`user.create.after`, `session.create.after`) handle auto-accept via cookie — the accept-invitation use-case extension (Task 6) handles the analysis trigger for explicit UI accepts

### Project Structure Notes

All new files follow established patterns:
- Domain repos: `packages/domain/src/repositories/`
- Infra repos: `packages/infrastructure/src/repositories/`
- Prompts: `packages/domain/src/prompts/`
- Use-cases: `apps/api/src/use-cases/`
- Handlers: `apps/api/src/handlers/`
- Components: `apps/front/src/components/relationship/`
- Routes: `apps/front/src/routes/relationship/`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-1-Relationship-Pair-Data-Model]
- [Source: _bmad-output/planning-artifacts/architecture.md#ADR-5-Cross-User-Data-Access]
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision-Tree-5]
- [Source: _bmad-output/planning-artifacts/architecture.md#G5-RelationshipCard]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.4]
- [Source: apps/api/src/use-cases/generate-full-portrait.use-case.ts] (daemon pattern reference)
- [Source: packages/infrastructure/src/db/drizzle/schema.ts#relationshipAnalyses] (existing table)

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Placeholder pattern** — ALWAYS insert placeholder row BEFORE `forkDaemon`. Never let the daemon INSERT rows. The daemon only UPDATEs `WHERE content IS NULL`.
6. **Canonical ordering** — Always use `MIN/MAX` for `userAId/userBId`. Never assume inviter = userA.
7. **No "read together" gate** — Each user accesses the analysis independently. Authorization = user is either `userAId` or `userBId`.
8. **Credit refunds** — Do NOT refund credits on refuse. The credit is consumed when the invitation is created.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A

### Completion Notes List

- Tasks 1-10 completed (backend + frontend)
- Task 11 (E2E) deferred — requires running environment
- All 349 API tests + 206 frontend tests pass
- Lint passes with 0 errors (12 pre-existing warnings)
- Task 9.2 (RelationshipInviteNudge sub-component) merged into RelationshipCard states — invite-prompt state serves the same purpose

### File List

**Created:**
- `packages/domain/src/repositories/relationship-analysis.repository.ts`
- `packages/domain/src/repositories/relationship-analysis-generator.repository.ts`
- `packages/domain/src/prompts/relationship-analysis.prompt.ts`
- `packages/domain/src/errors/http.errors.ts` (extended)
- `packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/relationship-analysis-generator.anthropic.repository.ts`
- `packages/infrastructure/src/repositories/relationship-analysis-generator.mock.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/relationship-analysis.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/relationship-analysis-generator.anthropic.repository.ts`
- `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts`
- `apps/api/src/use-cases/get-relationship-state.use-case.ts`
- `apps/api/src/use-cases/get-relationship-analysis.use-case.ts`
- `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/get-relationship-state.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/get-relationship-analysis.use-case.test.ts`
- `apps/front/src/components/relationship/RelationshipCard.tsx`
- `apps/front/src/routes/relationship/$analysisId.tsx`

**Modified:**
- `packages/domain/src/types/relationship.types.ts`
- `packages/domain/src/index.ts`
- `packages/contracts/src/errors.ts`
- `packages/contracts/src/http/groups/relationship.ts`
- `packages/infrastructure/src/index.ts`
- `apps/api/src/index.ts`
- `apps/api/src/handlers/relationship.ts`
- `apps/api/src/use-cases/accept-invitation.use-case.ts`
- `apps/api/src/use-cases/__tests__/accept-invitation.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/refuse-invitation.use-case.test.ts`
- `apps/front/src/routes/results/$assessmentSessionId.tsx`
- `apps/front/src/routes/results-session-route.test.tsx`
- `apps/front/src/routeTree.gen.ts`
