# Story 8.4: Pre-Generate Personalized Portrait at 70% Confidence

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **User who has reached 70% assessment confidence**,
I want **to see a personalized personality portrait that references my actual conversation**,
So that **I feel genuinely understood in a way no static description can achieve**.

## Acceptance Criteria

1. **Given** my assessment reaches >= 70% overall confidence **When** the orchestrator pipeline completes that analysis batch **Then** a personalized portrait is generated via Claude API call **And** the portrait is stored in `assessment_sessions.personal_description` (TEXT column) **And** the portrait references specific themes from my conversation **And** the portrait is 6-10 sentences long **And** the generation happens in the background (no user wait)

2. **Given** a personalized portrait exists for my session **When** I view the results page **Then** I see a "Your Personal Portrait" section between the ArchetypeHeroSection and TraitScoresSection **And** the section has a distinct visual treatment (archetype-colored accent border) **And** the content references my actual responses and patterns

3. **Given** my confidence is below 70% **When** I view the results page **Then** the personalized portrait section is not shown **And** no placeholder or teaser is shown (clean absence)

4. **Given** the portrait is generated only once per session **When** the orchestrator detects `overallConfidence >= 70` AND `personal_description IS NULL` **Then** it generates the portrait via a single Claude API call **And** stores it in the DB **And** does NOT regenerate on subsequent analysis batches (idempotent check)

5. **Given** the `get-results` use-case returns results **When** a personalized portrait exists in the session **Then** the response includes `personalDescription: string` (new field) **And** when no portrait exists, the field is `null` in the response

6. **Given** portrait generation uses a Claude API call **When** the portrait is generated **Then** the cost is tracked via `CostGuardRepository.incrementDailyCost()` using existing cost accounting **And** the token usage is logged via `LoggerRepository`

7. **Given** the results page renders the portrait on shared/public profiles **When** a public profile is viewed **Then** the portrait is NOT shown (portraits are private, owner-only) **And** public profiles continue to show archetype description + trait/facet scores only

8. **Given** the portrait prompt includes conversation data **When** the Claude API is called **Then** the prompt includes: facet scores with levels, top evidence quotes (up to 10), OCEAN code, archetype name **And** the prompt instructs: warm second-person voice, 6-10 sentences, reference specific patterns, non-clinical

## Tasks / Subtasks

- [ ] Task 1: DB migration — add `personal_description` column (AC: #1, #4)
  - [ ] 1.1 Add `personalDescription: text("personal_description")` (nullable) to `assessmentSession` table in `packages/infrastructure/src/db/drizzle/schema.ts`
  - [ ] 1.2 Run `pnpm db:generate` to create migration
  - [ ] 1.3 Run `pnpm db:migrate` to apply migration locally

- [ ] Task 2: Update `AssessmentSessionEntity` and repository (AC: #1, #4, #5)
  - [ ] 2.1 Add `personalDescription: Schema.NullOr(Schema.String)` to `AssessmentSessionEntitySchema` in `packages/domain/src/entities/session.entity.ts`
  - [ ] 2.2 Update `AssessmentSessionRepository` Drizzle implementation to map `personal_description` ↔ `personalDescription`
  - [ ] 2.3 Update `__mocks__/assessment-session.drizzle.repository.ts` to include `personalDescription: null` in mock data

- [ ] Task 3: Create portrait generation repository (AC: #1, #6, #8)
  - [ ] 3.1 Create `PortraitGeneratorRepository` interface in `packages/domain/src/repositories/portrait-generator.repository.ts` — `Context.Tag` with single method: `generatePortrait(input: PortraitInput) => Effect<PortraitOutput, PortraitGenerationError>`
  - [ ] 3.2 Define `PortraitInput` type: `{ sessionId, archetypeName, oceanCode5, facetScores: FacetScoresMap, topEvidence: SavedFacetEvidence[] }`
  - [ ] 3.3 Define `PortraitOutput` type: `{ portrait: string, tokenUsage: TokenUsage, costIncurred: number }`
  - [ ] 3.4 Define `PortraitGenerationError` in `packages/domain/src/errors/http.errors.ts` — tagged error, non-fatal (portrait failure should NOT break the pipeline)
  - [ ] 3.5 Create live implementation in `packages/infrastructure/src/repositories/portrait-generator.anthropic.repository.ts` — uses Anthropic SDK (Claude Sonnet 4.5), constructs portrait prompt, returns structured output. **FMA-3:** Validate `portrait.trim().length >= 100` before returning; throw `PortraitGenerationError` if response is empty/malformed
  - [ ] 3.6 Create mock implementation in `packages/infrastructure/src/repositories/__mocks__/portrait-generator.anthropic.repository.ts` — returns deterministic portrait string
  - [ ] 3.7 Export `PortraitGeneratorRepository` from `packages/domain/src/index.ts`
  - [ ] 3.8 Export `PortraitGeneratorAnthropicRepositoryLive` from `packages/infrastructure/src/index.ts`

- [ ] Task 4: Portrait prompt engineering (AC: #8)
  - [ ] 4.1 Create portrait system prompt in `packages/domain/src/utils/portrait-system-prompt.ts` — pure function that builds the prompt string from input data
  - [ ] 4.2 Prompt structure: system message (role, tone, length constraints) + user message (facet scores, evidence quotes, archetype context)
  - [ ] 4.3 Tone: warm, insightful, second-person, non-clinical, references specific patterns from evidence
  - [ ] 4.4 Length: 6-10 sentences. Include instruction: "Reference specific behavioral patterns observed in the assessment."
  - [ ] 4.5 Include top 10 evidence quotes (highest confidence, diverse facets) as grounding material
  - [ ] 4.6 Export `buildPortraitPrompt` from `packages/domain/src/index.ts`

- [ ] Task 5: Integrate portrait generation into orchestrator pipeline (AC: #1, #4, #6)
  - [ ] 5.1 After analysis batch completes in `send-message.use-case.ts`, add portrait generation check:
    ```
    IF messageCount % 3 === 0 (batch message):
      AFTER forkDaemon(processAnalysis):
        → Compute overallConfidence from fresh evidence
        → IF overallConfidence >= 70 AND session.personalDescription IS NULL:
            → forkDaemon(generateAndStorePortrait)
    ```
  - [ ] 5.2 Create `generate-portrait.use-case.ts` in `apps/api/src/use-cases/` — orchestrates: fetch evidence → compute scores → select top evidence → call PortraitGeneratorRepository → store in session → track cost. **FMA-1:** Use atomic DB update `UPDATE ... SET personal_description = $1 WHERE personal_description IS NULL` as the idempotent guard (not a separate SELECT + UPDATE)
  - [ ] 5.3 Portrait generation runs as `Effect.forkDaemon` (fire-and-forget, non-blocking)
  - [ ] 5.4 Wrap portrait generation in `Effect.catchAllCause` (NOT `catchAll`) — captures both expected errors AND defects (die/interrupt). Portrait failure logs error but does NOT fail the message pipeline. **FMA-2:** `catchAll` misses defects; `catchAllCause` is comprehensive
  - [ ] 5.5 Track portrait generation cost via `CostGuardRepository.incrementDailyCost()`

- [ ] Task 6: Update `get-results` use-case and contract (AC: #5)
  - [ ] 6.1 Add `personalDescription: S.NullOr(S.String)` to `GetResultsResponseSchema` in `packages/contracts/src/http/groups/assessment.ts`
  - [ ] 6.2 Update `GetResultsOutput` interface in `apps/api/src/use-cases/get-results.use-case.ts` to include `personalDescription: string | null`
  - [ ] 6.3 In `getResults` use-case, read `session.personalDescription` and pass through to response
  - [ ] 6.4 No API endpoint changes needed — same GET `/:sessionId/results` endpoint, just expanded response

- [ ] Task 7: Frontend `PersonalPortrait` component (AC: #2, #3)
  - [ ] 7.1 Create `apps/front/src/components/results/PersonalPortrait.tsx` component
  - [ ] 7.2 Props: `{ portrait: string, archetypeColor: string, displayName?: string | null }`
  - [ ] 7.3 Visual treatment: archetype-colored left accent border (`border-l-4`), card-style container with subtle background
  - [ ] 7.4 Label: "Your Personal Portrait" (or "{displayName}'s Personal Portrait" when viewing own profile)
  - [ ] 7.5 Content: render portrait text as a `<p>` with `text-sm leading-relaxed`
  - [ ] 7.6 Add `data-slot="personal-portrait"` for testing
  - [ ] 7.7 Depth zone: sits in "Surface" zone, below ArchetypeHeroSection, above WaveDivider to Shallows

- [ ] Task 8: Integrate PersonalPortrait into ProfileView and results route (AC: #2, #3, #7)
  - [ ] 8.1 Add `personalDescription?: string | null` to `ProfileViewProps`
  - [ ] 8.2 Add `archetypeColor: string` to `ProfileViewProps` (for portrait accent border)
  - [ ] 8.3 Render `<PersonalPortrait>` conditionally in `ProfileView.tsx` — only when `personalDescription` is non-null
  - [ ] 8.4 Position: after `ArchetypeHeroSection`, before `WaveDivider` to Shallows (within Surface depth zone)
  - [ ] 8.5 Update `results/$assessmentSessionId.tsx` route to pass `personalDescription` and `archetypeColor` from API response
  - [ ] 8.6 **Do NOT render portrait on public profile route** (`public-profile.$publicProfileId.tsx`) — portraits are private, owner-only. **FMA-4:** Verify public profile API/use-case strips `personalDescription` from response
  - [ ] 8.7 Update `useGetResults` hook (or fetch function) to include `personalDescription` in response handling

- [ ] Task 9: Write tests (AC: #1, #4, #5, #6)
  - [ ] 9.1 Create `apps/api/src/__tests__/generate-portrait.use-case.test.ts` — test confidence threshold check, idempotent generation, cost tracking, error handling
  - [ ] 9.2 Update `apps/api/src/__tests__/get-results.use-case.test.ts` — verify `personalDescription` returned when present, `null` when absent
  - [ ] 9.3 Create `packages/domain/src/utils/__tests__/portrait-system-prompt.test.ts` — verify prompt includes evidence, respects length constraints, uses correct tone instruction
  - [ ] 9.4 Test `generate-portrait` use-case with mock PortraitGeneratorRepository — verify it checks `personalDescription IS NULL` before generating
  - [ ] 9.5 Test that portrait generation failure does NOT propagate to send-message response (test both expected errors AND defects per **FMA-2**)
  - [ ] 9.6 **FMA-4:** Add explicit test asserting public profile route/component does NOT receive or render `personalDescription`
  - [ ] 9.7 **FMA-1:** Test concurrent portrait generation attempts — verify atomic update prevents double-write
  - [ ] 9.8 **FMA-3:** Test that empty/short Claude responses are rejected and do NOT persist to DB
  - [ ] 9.9 Run `pnpm test:run` — verify no regressions

## Dev Notes

### Key Architecture Constraints

- **Hexagonal architecture compliance** — Portrait generator is a new repository (port + adapter). Interface in domain, implementation in infrastructure, mock in `__mocks__/`.
- **Fire-and-forget pattern** — Portrait generation uses `Effect.forkDaemon` exactly like the existing analyzer batch. It MUST NOT block the send-message response.
- **Non-fatal errors** — Portrait generation failure must be caught and logged. It should NEVER cause a message send to fail. Wrap in `Effect.catchAll`.
- **ADR-5 compliance** — Portrait text is stored in the DB (`personal_description` column) because it's AI-generated and unique per session, NOT a derivable constant like archetype descriptions.
- **Single API call per session** — Portrait is generated once (idempotent check: `personalDescription IS NULL`). Cost is one Claude call per completed assessment.
- **Existing cost tracking** — Use the existing `CostGuardRepository.incrementDailyCost()` and `calculateCostFromTokens()` patterns from Story 2.5.

### Failure Mode Mitigations (FMA)

**FMA-1: TOCTOU race on idempotent guard (HIGH)**
The `personalDescription IS NULL` check in the use-case has a time-of-check-to-time-of-use window if two batch messages trigger simultaneously. Use an atomic DB update as the guard: `UPDATE assessment_session SET personal_description = $1 WHERE id = $sessionId AND personal_description IS NULL` — if `rowsAffected === 0`, another daemon already wrote the portrait. This eliminates the race entirely.

**FMA-2: Daemon swallows defects silently (MEDIUM)**
`Effect.catchAll` only catches expected (typed) errors. If a defect (`die`) occurs (e.g., null pointer, JSON parse failure), it escapes the catch and kills the fiber silently. Use `Effect.catchAllCause` instead to capture both expected errors and defects, ensuring all failures are logged.

**FMA-3: Empty/malformed portrait stored (HIGH)**
If the Claude API returns an empty string or truncated response, it would be stored as the portrait and the idempotent guard would prevent regeneration — permanently broken for that session. Add validation before storing: `portrait.trim().length >= 100` (a 6-sentence portrait should be at least ~400 chars). If validation fails, do NOT store, log a warning, and allow future retries.

**FMA-4: Portrait leaks to public profiles (HIGH)**
AC #7 mandates portraits are private/owner-only. The public profile route (`public-profile.$publicProfileId.tsx`) must never receive `personalDescription`. Add an explicit unit test asserting the public profile API response or component props do NOT include portrait data. The `get-public-profile` use-case (if it exists) should strip `personalDescription` from the response.

**FMA-5: Analysis daemon not finished when portrait reads evidence (MEDIUM)**
The story chains portrait generation AFTER `processAnalysis` within the same `forkDaemon`. Verify that `processAnalysis` is fully synchronous within its Effect pipeline (no nested `forkDaemon` calls that would cause it to return before analysis writes complete). If `processAnalysis` uses internal forks, the portrait check may read stale evidence.

### Story 8.3 Relationship

Story 8.3 (facet-level descriptions) is currently in `review` status. Story 8.4 does NOT depend on 8.3 code — both operate on different data paths. However, if 8.3 is merged first, the facet level names (from `FACET_LEVEL_LABELS`) could optionally be included in the portrait prompt for richer context. This is a nice-to-have, not a requirement.

### Portrait Generation Trigger Point

The portrait check plugs into the existing batch analysis flow in `send-message.use-case.ts`:

```
User sends message (messageCount = N)
  → Orchestrator processes (nerin response returned immediately)
  → IF N % 3 === 0:
      → forkDaemon(processAnalysis)        ← EXISTING
      → AFTER analysis fork:
          → Compute fresh overallConfidence
          → IF >= 70 AND session.personalDescription IS NULL:
              → forkDaemon(generatePortrait)  ← NEW
```

**Important:** The portrait check should compute confidence from FRESH evidence (after the analysis batch writes new evidence), not from cached values. This means the portrait daemon should:
1. Wait briefly for the analysis daemon to complete (or compute independently)
2. Fetch evidence via `getEvidenceBySession()`
3. Compute `calculateConfidenceFromFacetScores(aggregateFacetScores(evidence))`
4. Check threshold

**Preferred approach:** Chain the portrait check AFTER `processAnalysis` completes, within the same forkDaemon. This ensures fresh evidence is available:

```typescript
// In send-message.use-case.ts
if (messageCount % 3 === 0) {
  yield* Effect.forkDaemon(
    Effect.gen(function* () {
      // Step 1: Run analysis (existing)
      yield* orchestrator.processAnalysis({
        sessionId: input.sessionId,
        messages: domainMessages,
        messageCount,
      });

      // Step 2: Check portrait generation (new)
      yield* generatePortraitIfReady({
        sessionId: input.sessionId,
        userId: session.userId ?? "anonymous",
      });
    }).pipe(
      Effect.catchAllCause((cause) =>
        Effect.sync(() =>
          logger.error("Background analysis/portrait failed", {
            sessionId: input.sessionId,
            cause: Cause.pretty(cause),
          }),
        ),
      ),
    ),
  );
}
```

### Portrait Prompt Design

The portrait prompt should leverage the rich data available:

**System Message:**
```
You are a personality insight writer for Big Ocean, a psychological profiling platform.
Write a personalized portrait of the user based on their Big Five assessment data.

Rules:
- Write 6-10 sentences in warm, second-person voice ("You...")
- Reference specific behavioral patterns observed in the evidence quotes
- Weave together insights from multiple facets into a cohesive narrative
- Be affirming — celebrate the user's unique pattern, don't pathologize
- Don't list traits mechanically — tell a story about who they are
- Don't use clinical psychology jargon
- Don't mention scores, percentages, or technical terms
```

**User Message (structured data):**
```
Archetype: The Creative Diplomat (HHMHM)

Trait Profile:
- Openness: High — curious, imaginative, open to new experiences
- Conscientiousness: High — organized, disciplined, goal-oriented
- Extraversion: Medium — comfortable socially but values alone time
- Agreeableness: High — empathetic, cooperative, values harmony
- Neuroticism: Medium — emotionally aware but generally stable

Key Evidence (selected quotes from assessment):
1. [Imagination - High] "I always find myself imagining how things could be different..."
2. [Orderliness - High] "I can't function if my workspace is messy..."
3. [Trust - High] "I generally assume people have good intentions..."
...up to 10 quotes

Write their personal portrait:
```

### Evidence Selection for Portrait Prompt

Select the top 10 evidence quotes using this strategy:
1. Sort all evidence by confidence (descending)
2. Deduplicate by facet (max 1 quote per facet for diversity)
3. Take top 10
4. Format each as: `[FacetName - Level] "quote text"`

**Implementation function:** `selectTopEvidence(evidence: SavedFacetEvidence[], facetScoresMap: FacetScoresMap, limit: number): FormattedEvidence[]`

Location: `packages/domain/src/utils/portrait-system-prompt.ts`

### Data Structures

**PortraitGeneratorRepository interface (`packages/domain/src/repositories/portrait-generator.repository.ts`):**

```typescript
import { Context, Effect } from "effect";
import type { FacetScoresMap, SavedFacetEvidence, TokenUsage } from "@workspace/domain";

export interface PortraitInput {
  readonly sessionId: string;
  readonly archetypeName: string;
  readonly oceanCode5: string;
  readonly facetScores: FacetScoresMap;
  readonly topEvidence: readonly SavedFacetEvidence[];
}

export interface PortraitOutput {
  readonly portrait: string;
  readonly tokenUsage: TokenUsage;
  readonly costIncurred: number; // dollars
}

export class PortraitGeneratorRepository extends Context.Tag("PortraitGeneratorRepository")<
  PortraitGeneratorRepository,
  {
    readonly generatePortrait: (
      input: PortraitInput,
    ) => Effect.Effect<PortraitOutput, PortraitGenerationError, never>;
  }
>() {}
```

**Generate portrait use-case (`apps/api/src/use-cases/generate-portrait.use-case.ts`):**

```typescript
export interface GeneratePortraitInput {
  readonly sessionId: string;
  readonly userId: string; // For cost tracking
}

// Dependencies: AssessmentSessionRepository, FacetEvidenceRepository,
//               PortraitGeneratorRepository, CostGuardRepository, LoggerRepository
//
// Flow:
// 1. Get session → check personalDescription IS NULL (idempotent guard)
// 2. Fetch evidence → compute facet scores → compute overallConfidence
// 3. Check overallConfidence >= 70 (threshold guard)
// 4. Select top 10 evidence quotes (diverse, high-confidence)
// 5. Generate OCEAN code + lookup archetype
// 6. Call PortraitGeneratorRepository.generatePortrait()
// 7. Store portrait in session via updateSession({ personalDescription: portrait })
// 8. Track cost via CostGuardRepository.incrementDailyCost()
// 9. Log success with token usage
```

### DB Schema Change

```typescript
// In packages/infrastructure/src/db/drizzle/schema.ts
export const assessmentSession = pgTable(
  "assessment_session",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    status: text("status").notNull().default("active"),
    messageCount: integer("message_count").default(0).notNull(),
    personalDescription: text("personal_description"), // NEW — nullable TEXT column
  },
  (table) => [
    index("assessment_session_user_id_idx").on(table.userId),
  ],
);
```

### Contract Change

```typescript
// In packages/contracts/src/http/groups/assessment.ts
export const GetResultsResponseSchema = S.Struct({
  oceanCode5: OceanCode5Schema,
  oceanCode4: OceanCode4Schema,
  archetypeName: S.String,
  archetypeDescription: S.String,
  archetypeColor: S.String,
  isCurated: S.Boolean,
  traits: S.Array(TraitResultSchema),
  facets: S.Array(FacetResultSchema),
  overallConfidence: S.Number,
  personalDescription: S.NullOr(S.String), // NEW — null when not yet generated
});
```

### Frontend Rendering Pattern

**PersonalPortrait component:**

```tsx
interface PersonalPortraitProps {
  portrait: string;
  archetypeColor: string;
  displayName?: string | null;
}

export function PersonalPortrait({ portrait, archetypeColor, displayName }: PersonalPortraitProps) {
  const heading = displayName ? `${displayName}'s Personal Portrait` : "Your Personal Portrait";

  return (
    <div
      data-slot="personal-portrait"
      className="max-w-2xl mx-auto px-6 py-8"
    >
      <div
        className="border-l-4 rounded-lg bg-card/50 p-6"
        style={{ borderColor: archetypeColor }}
      >
        <h3 className="text-lg font-semibold mb-4">{heading}</h3>
        <p className="text-sm leading-relaxed text-foreground/90">{portrait}</p>
      </div>
    </div>
  );
}
```

**ProfileView integration:**

```tsx
// In ProfileView.tsx — add PersonalPortrait between hero and wave divider
<div className="bg-[var(--depth-surface)]">
  <ArchetypeHeroSection ... />
  {personalDescription && (
    <PersonalPortrait
      portrait={personalDescription}
      archetypeColor={archetypeColor}
      displayName={displayName}
    />
  )}
</div>
<WaveDivider ... />
```

### Source Tree Components to Touch

| File | Change Type | Purpose |
|------|------------|---------|
| `packages/infrastructure/src/db/drizzle/schema.ts` | EDIT | Add `personalDescription` column to `assessmentSession` |
| `packages/domain/src/entities/session.entity.ts` | EDIT | Add `personalDescription` to `AssessmentSessionEntitySchema` |
| `packages/domain/src/repositories/portrait-generator.repository.ts` | CREATE | `PortraitGeneratorRepository` Context.Tag interface |
| `packages/domain/src/errors/http.errors.ts` | EDIT | Add `PortraitGenerationError` tagged error |
| `packages/domain/src/utils/portrait-system-prompt.ts` | CREATE | `buildPortraitPrompt()` + `selectTopEvidence()` pure functions |
| `packages/domain/src/index.ts` | EDIT | Export new types, repository, utils |
| `packages/infrastructure/src/repositories/portrait-generator.anthropic.repository.ts` | CREATE | Live implementation using Anthropic SDK |
| `packages/infrastructure/src/repositories/__mocks__/portrait-generator.anthropic.repository.ts` | CREATE | Mock returning deterministic portrait |
| `packages/infrastructure/src/index.ts` | EDIT | Export `PortraitGeneratorAnthropicRepositoryLive` |
| `apps/api/src/use-cases/generate-portrait.use-case.ts` | CREATE | Portrait generation orchestration use-case |
| `apps/api/src/use-cases/send-message.use-case.ts` | EDIT | Add portrait generation trigger after analysis batch |
| `apps/api/src/use-cases/get-results.use-case.ts` | EDIT | Include `personalDescription` in response |
| `packages/contracts/src/http/groups/assessment.ts` | EDIT | Add `personalDescription` to `GetResultsResponseSchema` |
| `apps/front/src/components/results/PersonalPortrait.tsx` | CREATE | Portrait display component |
| `apps/front/src/components/results/ProfileView.tsx` | EDIT | Add `PersonalPortrait` rendering + new props |
| `apps/front/src/routes/results/$assessmentSessionId.tsx` | EDIT | Pass `personalDescription` and `archetypeColor` to ProfileView |
| `drizzle/` | AUTO-GENERATED | Migration file for `personal_description` column |
| `apps/api/src/__tests__/generate-portrait.use-case.test.ts` | CREATE | Unit tests for portrait generation |
| `packages/domain/src/utils/__tests__/portrait-system-prompt.test.ts` | CREATE | Tests for prompt building |

### Files NOT to Touch

- `packages/domain/src/constants/archetypes.ts` — Archetype descriptions (Story 8.1). Unrelated.
- `packages/domain/src/constants/trait-descriptions.ts` — Trait descriptions (Story 8.2). Unrelated.
- `packages/domain/src/constants/facet-descriptions.ts` — Facet descriptions (Story 8.3). Unrelated.
- `packages/infrastructure/src/repositories/orchestrator.langgraph.repository.ts` — Orchestrator graph logic. Portrait generation is triggered from the USE-CASE layer, not the orchestrator graph.
- `packages/infrastructure/src/repositories/orchestrator.nodes.ts` — Graph node definitions. No changes needed.
- `apps/front/src/routes/public-profile.$publicProfileId.tsx` — Public profiles do NOT show portraits (AC #7).
- `packages/domain/src/utils/scoring.ts` — Scoring functions. No changes needed.
- `packages/domain/src/utils/confidence.ts` — Confidence functions. No changes needed (used as-is).

### Cost Analysis

- **Claude API call:** 1 per completed assessment (at 70% confidence threshold)
- **Input tokens:** ~2000-3000 (prompt with evidence quotes, scores, archetype context)
- **Output tokens:** ~300-500 (6-10 sentence portrait)
- **Estimated cost per portrait:** ~$0.01-$0.02 (using Sonnet pricing)
- **Budget impact:** Negligible — same cost tracking path as existing Nerin/Analyzer calls

### AppConfig Additions

No new AppConfig fields needed. The portrait generator can reuse `anthropicApiKey` and use a hardcoded model ID (Claude Sonnet 4.5, same as Nerin). If customization is needed later, `portraitModelId` and `portraitMaxTokens` can be added to AppConfig in a follow-up story.

### Testing Standards

- **Test framework:** `vitest` with `@effect/vitest`
- **Mock pattern:** `vi.mock()` with `__mocks__` auto-resolution (same as all other repositories)
- **Test layer:** Local `TestLayer = Layer.mergeAll(...)` with only needed mocks

```typescript
// generate-portrait.use-case.test.ts
vi.mock("@workspace/infrastructure/repositories/portrait-generator.anthropic.repository");
vi.mock("@workspace/infrastructure/repositories/assessment-session.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/facet-evidence.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/cost-guard.redis.repository");

import { PortraitGeneratorAnthropicRepositoryLive } from "@workspace/infrastructure/repositories/portrait-generator.anthropic.repository";
// ... compose TestLayer

describe("generatePortraitIfReady", () => {
  it.effect("should generate portrait when confidence >= 70 and no existing portrait", () =>
    Effect.gen(function* () {
      // Setup: session with null personalDescription, evidence at 75% confidence
      const result = yield* generatePortraitIfReady({ sessionId: "test", userId: "user1" });
      // Assert: session updated with portrait text, cost tracked
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should skip when portrait already exists (idempotent)", () =>
    Effect.gen(function* () {
      // Setup: session with existing personalDescription
      const result = yield* generatePortraitIfReady({ sessionId: "test", userId: "user1" });
      // Assert: no portrait generated, no cost incurred
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should skip when confidence < 70", () =>
    Effect.gen(function* () {
      // Setup: session with null personalDescription, evidence at 55% confidence
      const result = yield* generatePortraitIfReady({ sessionId: "test", userId: "user1" });
      // Assert: no portrait generated
    }).pipe(Effect.provide(TestLayer))
  );
});
```

### Previous Story Intelligence (Stories 8.1, 8.2, 8.3)

**Learnings from Story 8.1:**
- Character-length constraints proved more reliable than sentence-count assertions for testing
- All 817+ tests pass across the monorepo — this is the baseline
- Second-person voice with varied, non-repetitive prose patterns works well for engagement

**Key pattern from Stories 8.2/8.3:**
- Domain constants are in `packages/domain/src/constants/` — but portrait text is DB-stored (not a constant)
- Export patterns: types + constants from `packages/domain/src/index.ts`
- Test patterns: `vitest` with `@effect/vitest`, mock layers via `vi.mock()`

**Story 8.3 data (can enrich portrait prompt):**
- `FACET_LEVEL_LABELS` maps two-letter codes to human-readable names (e.g., "OV" → "Visionary")
- `getFacetLevel(facetName, score)` returns the level code
- These can optionally be used in the portrait prompt to describe facet levels by name

### Git Intelligence

Recent commits:
- `6605916` feat(story-8-3): add level-specific facet descriptions with high/medium/low variants
- `dc3a49a` feat(story-8-2): add level-specific trait descriptions with high/medium/low variants (#53)
- `7ca8581` feat(story-8-1): expand archetype descriptions to 1500-2500 characters (#52)
- `20089f2` feat(story-1-4): Effect API auth middleware with CurrentUser context (#51)

**Patterns:**
- Branch naming: `feat/story-8-4-personalized-portrait`
- Commit format: `feat(story-8-4): pre-generate personalized portrait at 70% confidence`
- PR-based workflow with squash merges

### Project Structure Notes

- New repository follows existing pattern: interface in `domain/repositories/`, implementation in `infrastructure/repositories/`, mock in `__mocks__/`
- New use-case follows existing pattern: `apps/api/src/use-cases/generate-portrait.use-case.ts`
- New component follows existing pattern: `apps/front/src/components/results/PersonalPortrait.tsx`
- Export additions: domain `index.ts`, infrastructure `index.ts`
- DB migration: auto-generated by `pnpm db:generate` after schema edit

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-results-page-content-enrichment.md#Story 8.4]
- [Source: apps/api/src/use-cases/send-message.use-case.ts — batch analysis trigger pattern]
- [Source: apps/api/src/use-cases/get-results.use-case.ts — results computation pipeline]
- [Source: packages/domain/src/entities/session.entity.ts — AssessmentSessionEntity schema]
- [Source: packages/infrastructure/src/db/drizzle/schema.ts — assessmentSession table definition]
- [Source: packages/contracts/src/http/groups/assessment.ts — GetResultsResponseSchema]
- [Source: packages/domain/src/repositories/assessment-session.repository.ts — session CRUD interface]
- [Source: packages/domain/src/repositories/facet-evidence.repository.ts — evidence query methods]
- [Source: packages/domain/src/utils/confidence.ts — calculateConfidenceFromFacetScores]
- [Source: packages/domain/src/utils/scoring.ts — aggregateFacetScores, deriveTraitScores]
- [Source: packages/domain/src/config/app-config.ts — AppConfigService interface]
- [Source: packages/domain/src/repositories/cost-guard.repository.ts — cost tracking methods]
- [Source: apps/front/src/components/results/ProfileView.tsx — results layout + depth zones]
- [Source: apps/front/src/components/results/ArchetypeHeroSection.tsx — hero component]
- [Source: docs/ARCHITECTURE.md — hexagonal architecture, Effect Context.Tag pattern]
- [Source: docs/FRONTEND.md — data-slot conventions, styling patterns]
- [Source: _bmad-output/planning-artifacts/architecture-archetype-description-storage.md — ADR-7 patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
