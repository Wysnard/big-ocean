# Story 8.4: Pre-Generate Personalized Portrait at Free Tier Message Threshold

Status: review

## Story

As a **User who has reached the free tier message threshold**,
I want **to see a personalized personality portrait that references my actual conversation**,
So that **I feel genuinely understood in a way no static description can achieve**.

## Acceptance Criteria

1. **Given** my assessment has enough messages (messageCount >= freeTierMessageThreshold) **When** I view the results page for the first time **Then** a personalized portrait is generated via Claude API call **And** the portrait is stored in `assessment_sessions.personal_description` (TEXT column) **And** the portrait references specific themes from my conversation **And** the portrait is 6-10 sentences long

2. **Given** a personalized portrait already exists for my session **When** I view the results page again **Then** the stored portrait is returned immediately (no regeneration) **And** subsequent visits do NOT trigger a new Claude API call (NULL check before generating)

3. **Given** a personalized portrait exists **When** I view the results page **Then** I see a "Your Personal Portrait" section below the archetype card **And** the section has a distinct visual treatment (archetype-colored accent border) **And** the content references my actual responses and patterns

4. **Given** my message count is below the free tier threshold **When** I view the results page **Then** the personalized portrait section is not shown **And** no placeholder or teaser is shown (clean absence) **And** `personalDescription` is `null` in the API response

5. **Given** the portrait generation fails (Claude API error, timeout) **When** the user views results **Then** the results page renders normally without the portrait section **And** the failure is logged but does NOT block results display **And** `personalDescription` is `null` in the response

6. **Given** the results API is called **When** `personalDescription` is non-null **Then** it is included in the response payload **And** the frontend renders the PersonalPortrait component

## Tasks / Subtasks

- [x] Task 1: Database migration — add `personal_description` column (AC: #1, #2)
  - [x] 1.1 Add `personalDescription: text("personal_description")` to `assessmentSession` in `packages/infrastructure/src/db/drizzle/schema.ts` (nullable, no default)
  - [x] 1.2 Run `pnpm db:generate` to create migration SQL file in `drizzle/` directory
  - [x] 1.3 Update `AssessmentSessionEntitySchema` in `packages/domain/src/entities/session.entity.ts` to include `personalDescription: Schema.NullOr(Schema.String)`
  - [x] 1.4 Verify migration applies with `pnpm db:migrate`

- [x] Task 2: Portrait generator repository — domain interface + infrastructure implementation (AC: #1, #5)
  - [x] 2.1 Create `packages/domain/src/repositories/portrait-generator.repository.ts` — `PortraitGeneratorRepository` Context.Tag with `generatePortrait(input: PortraitGenerationInput) => Effect<string, PortraitGenerationError>`
  - [x] 2.2 Define `PortraitGenerationInput` interface: `{ sessionId: string; facetScoresMap: FacetScoresMap; topEvidence: SavedFacetEvidence[]; archetypeName: string; archetypeDescription: string; oceanCode5: string }` — pre-computed data, generator only produces text
  - [x] 2.3 Define `PortraitGenerationError` class (domain error, NOT TaggedError in contracts — this error is caught internally, never reaches HTTP layer)
  - [x] 2.4 Create `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` — Claude API call using LangChain `ChatAnthropic` (follow `analyzer.claude.repository.ts` pattern)
  - [x] 2.5 Portrait prompt: include facet scores, top evidence quotes (`quote` + `facetName` fields only — ignore `highlightStart`, `highlightEnd`, `assessmentMessageId`), archetype context. Tone: warm, insightful, second-person, non-clinical. Length: 6-10 sentences.
  - [x] 2.6 Use `claude-sonnet-4-20250514` model (same as analyzer) — NOT opus (cost control)
  - [x] 2.7 Export `PortraitGeneratorRepository` and `PortraitGenerationError` from `packages/domain/src/index.ts`
  - [x] 2.8 Create mock at `packages/infrastructure/src/repositories/__mocks__/portrait-generator.claude.repository.ts` — returns deterministic test portrait string

- [x] Task 3: Update get-results use-case — lazy portrait generation + return field (AC: #1-#6)
  - [x] 3.1 Add `personalDescription: S.NullOr(S.String)` to `GetResultsResponseSchema` in `packages/contracts/src/http/groups/assessment.ts`
  - [x] 3.2 Add `readonly personalDescription: string | null` to `GetResultsOutput` in `apps/api/src/use-cases/get-results.use-case.ts`
  - [x] 3.3 Add `PortraitGeneratorRepository`, `AppConfig`, and `AssessmentMessageRepository` as dependencies (yield* in Effect.gen)
  - [x] 3.4 Count user messages for threshold check: `const messages = yield* messageRepo.getMessages(sessionId); const userMessageCount = messages.filter(m => m.role === "user").length;` — do NOT use `session.messageCount` (it is not reliably maintained by the send-message flow)
  - [x] 3.5 After computing scores and archetype (existing logic), add portrait generation block:
    - Read `session.personalDescription` (session already fetched at line 76)
    - IF `session.personalDescription` is NULL AND `userMessageCount >= config.freeTierMessageThreshold`:
      - Select top 10 evidence records sorted by confidence descending
      - Call `portraitGenerator.generatePortrait({ sessionId, facetScoresMap, topEvidence, archetypeName, archetypeDescription, oceanCode5 })`
      - Store via `sessionRepo.updateSession(sessionId, { personalDescription: portrait })`
      - Use generated portrait as return value
    - IF `session.personalDescription` is non-null: use stored value
    - IF generation fails: catch with `Effect.catchAll`, log error, return `null`
  - [x] 3.6 Include `personalDescription` in the return object
  - [x] 3.7 Verify the assessment handler's `getResults` handler auto-maps the new `personalDescription` field to the contract response (Effect/Platform handlers typically auto-map — confirm no manual field mapping exists)
  - [x] 3.8 Verify handler layer composition — the `getResults` handler must provide `PortraitGeneratorRepository`, `AppConfig`, and `AssessmentMessageRepository` in its Effect layer. If layers are composed at server startup (single top-level `Layer.mergeAll`), add the new dependencies there. If handlers compose their own layers, update the `getResults` handler specifically.

- [x] Task 4: Frontend — PersonalPortrait component + results page integration (AC: #3, #4)
  - [x] 4.1 Create `apps/front/src/components/results/PersonalPortrait.tsx` component
  - [x] 4.2 Props: `{ personalDescription: string; dominantTrait: TraitName }` — only rendered when description exists
  - [x] 4.3 Visual treatment: archetype-colored left accent border (4px), padded card with distinct background
  - [x] 4.4 Header: "Your Personal Portrait" with `data-slot="personal-portrait"`
  - [x] 4.5 Body: render `personalDescription` text with `text-foreground/80 leading-relaxed`
  - [x] 4.6 Use `getTraitColor(dominantTrait)` for accent border color (already used in ArchetypeHeroSection)
  - [x] 4.7 Add `personalDescription` prop to `ProfileView` interface (optional `string | null`)
  - [x] 4.8 Place between ArchetypeHeroSection and WaveDivider in `ProfileView.tsx` — conditionally rendered only when `personalDescription` is truthy
  - [x] 4.9 Pass `results.personalDescription` from results page route (`$assessmentSessionId.tsx`) to ProfileView
  - [x] 4.10 Verify `useGetResults` hook return type auto-propagates `personalDescription` from `GetResultsResponse` contract type — no manual type definition needed if hook uses the contract type directly

- [x] Task 5: Tests (AC: #1-#6)
  - [x] 5.1 Unit test: portrait generator mock returns expected string, handles error gracefully
  - [x] 5.2 Unit test: `get-results` use-case generates portrait on first call when threshold met + `personalDescription` is NULL
  - [x] 5.3 Unit test: `get-results` use-case returns stored portrait on subsequent calls (no regeneration)
  - [x] 5.4 Unit test: `get-results` use-case returns `personalDescription: null` when below threshold
  - [x] 5.5 Unit test: `get-results` use-case returns `personalDescription: null` when generation fails (graceful degradation)
  - [x] 5.6 Verify all existing tests pass (`pnpm test:run`) — no regressions
  - [x] 5.7 Update assessment session mock (`__mocks__/assessment-session.drizzle.repository.ts`) to support `personalDescription` field
  - [x] 5.8 Ensure test layer for get-results tests includes `AppConfigLive` mock (from `__mocks__/app-config.ts`), `PortraitGeneratorClaudeRepositoryLive` mock, and `AssessmentMessageDrizzleRepositoryLive` mock

## Dev Notes

### Architecture Decision: Lazy Generation in get-results

Portrait generation happens **lazily in the `get-results` use-case**, NOT in the background orchestrator pipeline.

**Why this approach:**
- `get-results` already has all required data: evidence, facet scores, archetype — zero additional data fetching needed
- No changes to orchestrator, send-message, or analysis pipeline
- No race conditions (background daemon might read evidence before analyzer finishes writing)
- Simpler error handling — one place, one flow
- One generation per session guaranteed by NULL check → generate → store pattern

**Trade-off:** First results view takes ~2-3s longer (Claude API call). Subsequent views instant (read from DB). Acceptable because users expect some computation on their first results visit — the existing "Calculating your personality profile..." spinner covers this naturally.

**Automatic retry on failure:** If portrait generation fails (Claude timeout, error), `personalDescription` remains NULL. The next `get-results` call automatically retries — no manual intervention or retry logic needed.

**What this means for implementation:**
- `OrchestratorRepository` interface: **NO CHANGES**
- `send-message.use-case.ts`: **NO CHANGES**
- `processAnalysis`: **NO CHANGES**
- Only `get-results.use-case.ts` gains portrait generation logic

### Key Constraints

- **Hexagonal architecture** — `PortraitGeneratorRepository` is a new PORT (domain) + ADAPTER (infrastructure), same pattern as `AnalyzerRepository`
- **Non-fatal** — Generation failure MUST NOT block results display. Wrap in `Effect.catchAll`, log, return `null`.
- **One generation per session** — Check `session.personalDescription !== null` before generating. Store immediately after generation.
- **AppConfig for threshold** — Use `config.freeTierMessageThreshold` (default: 15, env: `FREE_TIER_MESSAGE_THRESHOLD`). Do NOT hardcode.
- **Owner-only** — Portrait shown on owner's results page only. NOT on public profiles (privacy concern — portrait references conversation content). Public profile support deferred to future story with opt-in toggle.

### Data Flow

```
get-results.use-case.ts:
  1. sessionRepo.getSession(sessionId)              [existing]
  2. evidenceRepo.getEvidenceBySession(sessionId)    [existing]
  3. aggregateFacetScores(evidence)                  [existing]
  4. deriveTraitScores(facetScoresMap)                [existing]
  5. generateOceanCode / lookupArchetype             [existing]
  5b. messageRepo.getMessages(sessionId)             [NEW — count user messages]
      userMessageCount = messages.filter(role=user).length
  6. IF session.personalDescription IS NULL
     AND userMessageCount >= config.freeTierMessageThreshold:
       → topEvidence = evidence.sort(confidence DESC).slice(0, 10)
       → portrait = yield* portraitGenerator.generatePortrait({
           sessionId, facetScoresMap, topEvidence,
           archetypeName, archetypeDescription, oceanCode5
         }).pipe(
           Effect.catchAll((err) => {
             logger.error("Portrait generation failed", { sessionId, error: String(err) });
             return Effect.succeed(null);
           })
         )
       → IF portrait !== null:
           yield* sessionRepo.updateSession(sessionId, { personalDescription: portrait })
  7. Return { ...existingFields, personalDescription: portrait ?? session.personalDescription ?? null }
```

### Portrait Prompt Design

The Claude API call receives pre-computed data from `get-results`:

**Input to portrait generator:**
- `facetScoresMap` — all 30 facet scores with confidence values
- `topEvidence` — top 10 evidence records sorted by confidence (includes `quote`, `facetName`, `score`)
- `archetypeName` + `archetypeDescription` — so portrait aligns with archetype narrative
- `oceanCode5` — OCEAN code for personality summary

**Prompt template:**
```
You are writing a personalized personality portrait for someone who just completed
a Big Five personality assessment through conversation. Write 6-10 sentences that
feel warm, insightful, and personally relevant.

RULES:
- Use second person ("you")
- Reference specific patterns from their conversation using the evidence quotes
- Be warm and affirming, not clinical
- Each sentence should reveal something specific about them
- Do NOT use generic personality psychology language
- Do NOT repeat the archetype description verbatim
- Do NOT use bullet points or lists — write flowing prose

PERSONALITY DATA:
Archetype: {archetypeName}
OCEAN Code: {oceanCode5}
Trait Scores: {formatted trait summary with levels}

KEY EVIDENCE FROM CONVERSATION:
{formatted top evidence quotes with facet names}
```

### Database Change

**Schema addition** (`packages/infrastructure/src/db/drizzle/schema.ts`):
```typescript
export const assessmentSession = pgTable(
  "assessment_session",
  {
    // ... existing fields ...
    personalDescription: text("personal_description"), // NULL until portrait generated
  },
  // ... existing index ...
);
```

**Entity update** (`packages/domain/src/entities/session.entity.ts`):
```typescript
export const AssessmentSessionEntitySchema = Schema.Struct({
  // ... existing fields ...
  personalDescription: Schema.NullOr(Schema.String),
});
```

**Migration:** Run `pnpm db:generate` after schema change → creates SQL file in `drizzle/` → apply with `pnpm db:migrate`.

### Contract Change

**Add to `GetResultsResponseSchema`** (`packages/contracts/src/http/groups/assessment.ts`):
```typescript
export const GetResultsResponseSchema = S.Struct({
  // ... existing fields ...
  personalDescription: S.NullOr(S.String),
});
```

Backward-compatible — `null` means "no portrait available".

### Message Count — Must Query, Not Use session.messageCount

**`session.messageCount` is NOT reliably maintained.** The `send-message.use-case.ts` computes message count from the `assessment_message` table each time (line 82: `previousMessages.filter(msg => msg.role === "user").length`) but never persists it back to the session entity. The `messageCount` column defaults to `0` and may never be updated.

**Solution:** Add `AssessmentMessageRepository` as a dependency to get-results and count user messages directly:
```typescript
const messages = yield* messageRepo.getMessages(input.sessionId);
const userMessageCount = messages.filter(m => m.role === "user").length;
```

This is consistent with how `send-message.use-case.ts` counts messages. The additional DB query is negligible (~1ms) since messages are indexed by `session_id`.

### Frontend Component Placement

Current `ProfileView` layout:
```
ArchetypeHeroSection (hero card)       ← bg: --depth-surface
  ↓ WaveDivider (surface → shallows)
TraitScoresSection (traits + facets)   ← bg: --depth-shallows
  ↓ {children}                         ← share, actions, evidence
```

**After story 8.4:**
```
ArchetypeHeroSection (hero card)       ← bg: --depth-surface
  ↓ PersonalPortrait (NEW, conditional) ← bg: --depth-surface (same zone)
  ↓ WaveDivider (surface → shallows)
TraitScoresSection (traits + facets)   ← bg: --depth-shallows
  ↓ {children}
```

The PersonalPortrait sits within `--depth-surface` zone, visually extending the hero section with a personal narrative before the wave transition.

### Styling Notes (Follow FRONTEND.md Conventions)

- Use `data-slot="personal-portrait"` on root element
- Accent border: `border-l-4` with `style={{ borderColor: getTraitColor(dominantTrait) }}`
- Background: `bg-foreground/5` for subtle card distinction
- Padding: `px-6 py-8` (same horizontal as hero section)
- Max width: `max-w-2xl mx-auto` (consistent with hero content)
- Text: `text-base text-foreground/80 leading-relaxed`
- Header: `text-sm tracking-wider uppercase font-heading text-foreground/70 mb-4` (matches hero subtitle pattern)
- No new CSS variables needed

### Public Profile Safety — Portrait NOT Exposed

The public profile endpoint reads from the `public_profile` table (which stores `oceanCode5`, `oceanCode4`, `isPublic`), NOT from `assessment_session`. Since `personalDescription` lives on the session table, it is never returned by the public profile endpoint. No code change needed to enforce owner-only access — the data model naturally excludes it. Verify during implementation that the public profile route does not join to `assessment_session.personal_description`.

### Evidence Coverage — Messages 1-12, Not 1-15

With a default threshold of 15, the last analysis batch fires at message 12 (12 % 3 === 0). Messages 13-15 are saved to the DB but the `FreeTierLimitReached` error fires at message 15 before the orchestrator processes it, so messages 13-15 are never analyzed. The portrait uses evidence from messages 1-12. This is expected and provides sufficient evidence (~40 records) for a meaningful portrait. Do NOT try to trigger a final analysis for messages 13-15 — the existing evidence is adequate.

### Handler Layer — Verify Auto-Mapping

The assessment handler (`apps/api/src/handlers/assessment.ts`) maps `getResults` use-case output to the `GetResultsResponseSchema`. Effect/Platform handlers typically auto-map fields when use-case output matches the schema struct. Adding `personalDescription` to both the use-case output and the contract schema should work without handler code changes — but verify no manual field mapping exists in the handler that would need updating.

### Assessment Session Repository — No Changes Needed

The `updateSession` method already exists and accepts `Partial<AssessmentSessionEntity>`:
```typescript
readonly updateSession: (
  sessionId: string,
  session: Partial<AssessmentSessionEntity>
) => Effect<AssessmentSessionEntity>;
```

Adding `personalDescription` to the entity schema means `updateSession({ personalDescription: "..." })` works automatically via Drizzle's `db.update().set()`.

### Mock for Portrait Generator

Create `packages/infrastructure/src/repositories/__mocks__/portrait-generator.claude.repository.ts`:
```typescript
import { PortraitGeneratorRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const MOCK_PORTRAIT = "You approach life with a distinctive blend of curiosity and practicality that makes you uniquely effective. Throughout our conversation, your thoughtful responses revealed someone who weighs options carefully before committing. You have a natural talent for seeing multiple perspectives, which makes you an excellent problem-solver and trusted advisor. Your emotional awareness runs deep — you pick up on subtleties that others miss. When faced with challenges, you prefer to understand the full picture before acting, which sometimes looks like hesitation but is actually strategic patience. Your relationships matter deeply to you, and you invest genuine energy into understanding the people around you.";

export const PortraitGeneratorClaudeRepositoryLive = Layer.succeed(
  PortraitGeneratorRepository,
  PortraitGeneratorRepository.of({
    generatePortrait: (_input) => Effect.succeed(MOCK_PORTRAIT),
  }),
);
```

### Cost Impact

- **One Claude API call per completed assessment** — ~500 input tokens (facet scores + evidence quotes) + ~200 output tokens (6-10 sentences)
- Using `claude-sonnet-4-20250514`: $3/1M input + $15/1M output ≈ $0.0045 per portrait
- Cost is NOT tracked by `costGuard` (portrait generation happens in get-results, outside the orchestrator cost tracking). This is acceptable — the cost is negligible (~$0.005) and one-time per session.

### Files NOT to Touch

- `packages/domain/src/repositories/orchestrator.repository.ts` — No interface changes
- `packages/infrastructure/src/repositories/orchestrator.langgraph.repository.ts` — No pipeline changes
- `apps/api/src/use-cases/send-message.use-case.ts` — No changes
- `packages/domain/src/constants/archetypes.ts` — Story 8.1 (done)
- `packages/domain/src/constants/trait-descriptions.ts` — Story 8.2 (done)
- `packages/domain/src/constants/facet-descriptions.ts` — Story 8.3 (done)
- `packages/domain/src/types/facet-levels.ts` — Story 8.3 (done)
- `packages/domain/src/utils/facet-level.ts` — Story 8.3 (done)
- LangGraph checkpoint tables — excluded by `drizzle.config.ts` `tablesFilter`

### Project Structure Notes

- New repository follows naming convention: `portrait-generator.repository.ts` (domain) / `portrait-generator.claude.repository.ts` (infrastructure)
- Export from domain `index.ts` following existing pattern
- Infrastructure implementation co-located with other repository implementations
- Mock file follows `__mocks__` auto-resolution convention (Vitest)
- Frontend component follows `apps/front/src/components/results/` pattern

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-results-page-content-enrichment.md#Story 8.4]
- [Source: packages/infrastructure/src/db/drizzle/schema.ts — assessmentSession table definition, lines 98-115]
- [Source: packages/domain/src/entities/session.entity.ts — AssessmentSessionEntitySchema, lines 56-67]
- [Source: apps/api/src/use-cases/get-results.use-case.ts — GetResultsOutput interface, session fetch at line 76, score computation lines 89-101]
- [Source: packages/contracts/src/http/groups/assessment.ts — GetResultsResponseSchema, lines 79-89]
- [Source: apps/front/src/routes/results/$assessmentSessionId.tsx — ProfileView usage, lines 251-308]
- [Source: apps/front/src/components/results/ProfileView.tsx — layout structure, ArchetypeHeroSection + WaveDivider placement]
- [Source: apps/front/src/components/results/ArchetypeHeroSection.tsx — getTraitColor pattern, hero styling]
- [Source: packages/infrastructure/src/repositories/__mocks__/ — mock pattern reference]
- [Source: packages/domain/src/config/app-config.ts — freeTierMessageThreshold config, line 72]
- [Source: packages/infrastructure/src/repositories/analyzer.claude.repository.ts — Claude API call pattern reference]
- [Source: packages/domain/src/repositories/assessment-session.repository.ts — updateSession interface]
- [Source: docs/FRONTEND.md — data-slot conventions, styling patterns]
- [Source: docs/ARCHITECTURE.md — hexagonal architecture, Effect DI patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Rework Context

Story 8.4 was originally implemented (done) and merged via PR #55. A brainstorming session on 2026-02-16 (Sprint Change Proposal #3) redesigned the portrait to use Nerin's dive-master voice with structured markdown output instead of the generic warm-prose JSON format. This record documents the rework implementation.

### Debug Log References

- All 153 frontend tests pass (including 8 PersonalPortrait tests)
- All 170 API tests pass (1 pre-existing skip)
- Lint passes (5 pre-existing warnings, none from changes)
- TypeScript type checking passes

### Completion Notes List

1. **Portrait prompt rewritten** — Full Nerin dive-master voice specification with 6-section structure, evidence-first pattern, metaphor density gradient, temporal modes, and validated example as few-shot reference
2. **formatTraitSummary() enriched** — Now includes per-facet confidence levels alongside trait-level scores
3. **formatEvidence() enriched** — Now includes numbered list with confidence percentages per evidence record
4. **maxTokens increased** — 1024 → 2048 to accommodate 6-section markdown output
5. **PersonalPortrait.tsx refactored** — Removed JSON parsing (PortraitSections interface, SECTION_CONFIG, tryParsePortrait), replaced with `splitMarkdownSections()` that splits on `##` headers. Renders per-section with dividers. Fallback to raw text if no `##` headers found.
6. **dominantTrait prop removed** — No longer needed since JSON grid with trait-colored dots is gone. ProfileView updated to not pass it.
7. **Mock updated** — Returns markdown with 6 `##` sections matching the validated example structure
8. **Domain interface JSDoc updated** — `@returns` updated from "6-10 sentences" to "markdown string (6 sections with ## headers)"
9. **Tests rewritten** — 8 tests covering: 6 section headers, body content, displayName, default title, plain text fallback, no headers for plain text, data-slot, section dividers

### File List

| File | Action | Description |
|------|--------|-------------|
| `packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts` | MODIFIED | Rewrote PORTRAIT_SYSTEM_PROMPT to Nerin dive-master voice, enriched formatTraitSummary() with per-facet confidence, enriched formatEvidence() with confidence %, increased maxTokens to 2048, updated user prompt format |
| `packages/infrastructure/src/repositories/__mocks__/portrait-generator.claude.repository.ts` | MODIFIED | Replaced plain text mock with 6-section markdown mock |
| `apps/front/src/components/results/PersonalPortrait.tsx` | MODIFIED | Removed JSON parsing, added splitMarkdownSections(), renders markdown with per-section styling, removed dominantTrait prop |
| `apps/front/src/components/results/PersonalPortrait.test.tsx` | MODIFIED | Rewrote all tests for markdown format (8 tests) |
| `apps/front/src/components/results/ProfileView.tsx` | MODIFIED | Removed dominantTrait prop from PersonalPortrait call, updated comment |
| `packages/domain/src/repositories/portrait-generator.repository.ts` | MODIFIED | Updated JSDoc @returns to describe markdown output |
