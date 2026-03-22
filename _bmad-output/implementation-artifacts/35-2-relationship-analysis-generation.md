# Story 35-2: Relationship Analysis Generation

Status: ready-for-dev

## Story

As the system,
I want to generate a relationship analysis comparing two users' personality evidence,
So that both users receive insights about their relational dynamics.

## Acceptance Criteria

1. **Given** a QR token has been accepted and credit consumed, **When** the analysis generation begins, **Then** a placeholder row is inserted into `relationship_analyses` with `content: null`, `user_a_result_id`, and `user_b_result_id` FKs (FR29), **And** a `forkDaemon` is spawned for generation.

2. **Given** the Sonnet agent generates the analysis, **When** both users' conversation evidence is provided, **Then** the analysis describes relational dynamics using complementary framing -- dynamics not deficits (FR32), **And** no blame language is used, **And** no individual vulnerability data is exposed (NFR13), **And** no raw conversation transcripts are shared with the other party.

3. **Given** generation completes, **When** the daemon writes the result, **Then** `UPDATE ... WHERE content IS NULL` ensures idempotency, **And** the analysis content follows the spine format: `{emoji, title, subtitle?, paragraphs[]}[]`.

4. **Given** generation fails or stalls, **When** staleness threshold is exceeded (>5 min) and retries remain, **Then** lazy retry spawns a new daemon, **And** if generation ultimately fails, both users see a failure state with retry option.

## Tasks / Subtasks

### Backend

- [ ] **Task 1: Update relationship analysis prompt for spine format output** (AC: #2, #3)
  - [ ] 1.1 Update `packages/domain/src/prompts/relationship-analysis.prompt.ts` — modify the system prompt to instruct the LLM to output JSON in spine format `{emoji, title, subtitle?, paragraphs[]}[]` instead of raw markdown
  - [ ] 1.2 Update prompt to explicitly enforce: complementary framing (dynamics not deficits), no blame language, no individual vulnerability data, no raw conversation transcripts (FR32, NFR13)
  - [ ] 1.3 Update unit test `packages/domain/src/prompts/__tests__/relationship-analysis-prompt.test.ts` to verify prompt includes spine format instructions and safety guardrails

- [ ] **Task 2: Update generator repository to parse spine format** (AC: #3)
  - [ ] 2.1 Update `packages/infrastructure/src/repositories/relationship-analysis-generator.anthropic.repository.ts` — parse the LLM output as JSON spine format, validate structure, and store as JSON string
  - [ ] 2.2 Update `packages/infrastructure/src/repositories/__mocks__/relationship-analysis-generator.anthropic.repository.ts` — return mock spine-format JSON content
  - [ ] 2.3 Update `packages/infrastructure/src/repositories/relationship-analysis-generator.mock.repository.ts` — return mock spine-format JSON content

- [ ] **Task 3: Add retry-relationship-analysis use-case** (AC: #4)
  - [ ] 3.1 Create `apps/api/src/use-cases/retry-relationship-analysis.use-case.ts` — follows `retry-portrait.use-case.ts` pattern: validates user authorization (must be userA or userB), checks analysis is in failed state (content null, retryCount >= 3), resets retry count, forks new daemon
  - [ ] 3.2 Create `apps/api/src/use-cases/__tests__/retry-relationship-analysis.use-case.test.ts` — test authorization, state validation, daemon forking

- [ ] **Task 4: Add retry endpoint to contracts and handler** (AC: #4)
  - [ ] 4.1 Add `retryRelationshipAnalysis` POST endpoint to `packages/contracts/src/http/groups/relationship.ts` — path `/analysis/:analysisId/retry`, success returns `{ status: string }`
  - [ ] 4.2 Add handler in `apps/api/src/handlers/relationship.ts`

- [ ] **Task 5: Update generate-relationship-analysis for staleness detection** (AC: #4)
  - [ ] 5.1 Review `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` — verify staleness threshold (>5 min based on `createdAt` vs now) and retry count check already work correctly with the lazy retry pattern from get-relationship-analysis polling

### Tests

- [ ] **Task 6: Update existing tests for spine format** (AC: #2, #3)
  - [ ] 6.1 Update `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts` — verify generated content is treated as spine-format JSON string
  - [ ] 6.2 Verify existing `get-relationship-analysis.use-case.test.ts` still passes with string content (no format assumptions in get use-case)

## Dev Notes

### Spine Format

The analysis content is stored as a JSON string in the `content` column. The spine format is:
```typescript
type SpineSection = {
  emoji: string;
  title: string;
  subtitle?: string;
  paragraphs: string[];
};
// Content stored as: JSON.stringify(SpineSection[])
```

The frontend (Story 35-3) will parse this JSON and render via the Portrait Spine Renderer.

### Prompt Safety Guardrails (FR32, NFR13)

The prompt must explicitly instruct the LLM to:
- Use complementary framing: "dynamics not deficits"
- Never use blame language or characterize either person negatively
- Never expose individual vulnerability data (raw scores, specific evidence quotes, or behavioral patterns that one person shared in confidence)
- Never include raw conversation transcripts
- Focus on what emerges between the two people, not on individual weaknesses

### Lazy Retry Pattern

The staleness detection works via the existing polling mechanism:
1. Frontend polls `GET /relationship/analysis/:id` every 5s
2. If `content IS NULL` and `createdAt > 5 min ago` and `retryCount < 3`, the get use-case can fork a new daemon
3. The `UPDATE ... WHERE content IS NULL` ensures only one daemon's result is written

For this story, the manual retry endpoint provides a user-triggered retry when generation ultimately fails (retryCount >= 3).

### Reference Implementation

- Portrait retry: `apps/api/src/use-cases/retry-portrait.use-case.ts`
- Generation daemon: `apps/api/src/use-cases/generate-full-portrait.use-case.ts`
- Existing relationship generation: `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts`

### Existing Infrastructure

The core generation pipeline (Story 14-4) already exists:
- Domain repos: `relationship-analysis.repository.ts`, `relationship-analysis-generator.repository.ts`
- Infrastructure: Drizzle repo, Anthropic repo with LangChain
- Use cases: `generate-relationship-analysis.use-case.ts`, `accept-qr-invitation.use-case.ts`
- Placeholder row + forkDaemon pattern

This story focuses on:
1. Upgrading the prompt for spine format output + safety guardrails
2. Parsing LLM output as spine-format JSON
3. Adding manual retry endpoint for failed analyses

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** -- No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag` for resilience.
2. **No business logic in handlers** -- All retry logic belongs in the use-case, not the handler.
3. **Canonical ordering** -- Always use `MIN/MAX` for `userAId/userBId`. Never assume inviter = userA.
4. **Placeholder pattern** -- ALWAYS insert placeholder row BEFORE `forkDaemon`. The daemon only UPDATEs `WHERE content IS NULL`.
5. **No "read together" gate** -- Each user accesses the analysis independently.
6. **Error propagation** -- Use-cases must NOT remap errors. Errors propagate to the HTTP contract layer unchanged.
