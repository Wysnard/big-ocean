# Story 8.5: Regenerate Personalized Portrait at 85% Confidence (Paid Tier)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Paid user who has continued chatting beyond 70%**,
I want **my personalized portrait to be regenerated with richer data at 85% confidence**,
So that **my portrait reflects the deeper understanding from my extended conversation**.

## Acceptance Criteria

1. **Given** I am a paid user and my confidence reaches >= 85% **When** the orchestrator pipeline completes that analysis batch **Then** the personalized portrait is regenerated via Claude API call **And** the new portrait REPLACES the existing `personal_description` (single column, overwrite) **And** the new portrait is noticeably richer (references more specific patterns from extended conversation) **And** a `personal_description_updated_at` timestamp is written to track the regeneration

2. **Given** I am a free user **When** my confidence stays at 70% (conversation locked by `freeTierMessageThreshold`) **Then** no regeneration occurs **And** I keep my original 70% portrait permanently

3. **Given** a portrait has been regenerated at 85% **When** I view the results page **Then** the `PersonalPortrait` component shows the updated portrait text **And** a subtle "Updated — based on deeper understanding" indicator is visible below the portrait

4. **Given** the 85% portrait regeneration triggers **When** the system checks conditions **Then** it verifies ALL of: `overallConfidence >= 85` AND `user.tier === "paid"` AND `portrait already exists` (regeneration, not first generation) **And** portrait is regenerated at most once at the 85% threshold (idempotent — check `personal_description_updated_at` to prevent repeated regeneration)

5. **Given** the user has no subscription (free tier) **When** the orchestrator batch runs at any confidence level above 70% (hypothetical future scenario) **Then** portrait regeneration is NOT triggered **And** the original 70% portrait from Story 8-4 remains intact

6. **Given** portrait regeneration uses a Claude API call **When** the portrait is regenerated **Then** the cost is tracked via `CostGuardRepository.incrementDailyCost()` **And** the token usage is logged via `LoggerRepository` **And** total max portrait API calls per user = 2 (once at 70%, once at 85%)

7. **Given** the `generate-portrait.use-case.ts` (from Story 8-4) handles portrait generation **When** Story 8-5 extends it **Then** the same use-case gains a `regenerate` mode that overwrites `personal_description` and writes `personal_description_updated_at` **And** the regeneration prompt includes MORE evidence quotes (up to 15 instead of 10) to leverage the richer data available at 85%

8. **Given** a user's tier must be checked **When** the portrait regeneration trigger fires **Then** the system reads `user.tier` from the `user` table (new column) **And** only proceeds if `tier === "paid"` **And** free users are never checked (short-circuit)

## Tasks / Subtasks

- [ ] Task 1: DB migration — add `tier` column to `user` table and `personal_description_updated_at` to `assessment_session` (AC: #1, #4, #8)
  - [ ] 1.1 Add `tier: text("tier").default("free").notNull()` to `user` table in `packages/infrastructure/src/db/drizzle/schema.ts` — values: `"free" | "paid"`
  - [ ] 1.2 Add `personalDescriptionUpdatedAt: timestamp("personal_description_updated_at")` (nullable) to `assessmentSession` table in `packages/infrastructure/src/db/drizzle/schema.ts`
  - [ ] 1.3 Run `pnpm db:generate` to create migration
  - [ ] 1.4 Run `pnpm db:migrate` to apply migration locally

- [ ] Task 2: Update domain entities and types (AC: #4, #8)
  - [ ] 2.1 Add `tier: Schema.optionalWith(Schema.Literal("free", "paid"), { default: () => "free" as const })` to user entity schema in `packages/domain/src/entities/` (or wherever the user entity schema lives — verify the file)
  - [ ] 2.2 Add `personalDescriptionUpdatedAt: Schema.NullOr(Schema.DateFromSelf)` to `AssessmentSessionEntitySchema` in `packages/domain/src/entities/session.entity.ts`
  - [ ] 2.3 Export new type `UserTier = "free" | "paid"` from `packages/domain/src/types/` if not already present
  - [ ] 2.4 Update `AssessmentSessionRepository` Drizzle implementation to map `personal_description_updated_at` ↔ `personalDescriptionUpdatedAt`
  - [ ] 2.5 Update `__mocks__/assessment-session.drizzle.repository.ts` to include `personalDescriptionUpdatedAt: null` in mock data

- [ ] Task 3: Extend `generate-portrait.use-case.ts` for 85% regeneration (AC: #1, #4, #6, #7)
  - [ ] 3.1 Add a `mode: "generate" | "regenerate"` parameter to `GeneratePortraitInput` — `"generate"` is the existing 70% behavior (from Story 8-4), `"regenerate"` is the new 85% behavior
  - [ ] 3.2 In `"regenerate"` mode: skip the `personalDescription IS NULL` idempotent check, instead check `personalDescriptionUpdatedAt IS NULL` (to prevent repeated 85% regeneration)
  - [ ] 3.3 In `"regenerate"` mode: use up to 15 evidence quotes instead of 10 (more data available at 85%)
  - [ ] 3.4 After successful regeneration: write `personalDescriptionUpdatedAt = new Date()` alongside the new `personalDescription` in the session update
  - [ ] 3.5 Track regeneration cost via existing `CostGuardRepository.incrementDailyCost()` — same cost path as the 70% generation

- [ ] Task 4: Add paid tier check to portrait regeneration trigger in `send-message.use-case.ts` (AC: #1, #2, #4, #5, #8)
  - [ ] 4.1 In the batch analysis daemon (existing `messageCount % 3 === 0` block in `send-message.use-case.ts`), AFTER the existing 70% portrait generation check (from Story 8-4), add an 85% regeneration check:
    ```
    IF overallConfidence >= 85
       AND session.userId IS NOT NULL (must be authenticated)
       AND user.tier === "paid"
       AND session.personalDescriptionUpdatedAt IS NULL (not already regenerated at 85%):
        → Call generatePortraitIfReady({ sessionId, userId, mode: "regenerate" })
    ```
  - [ ] 4.2 Fetch user tier by reading the user record from the DB (use existing session's `userId` to query)
  - [ ] 4.3 Short-circuit: if `user.tier !== "paid"`, skip entirely — no confidence computation needed for regeneration
  - [ ] 4.4 Wrap regeneration in `Effect.catchAll` — regeneration failure must NOT break the message pipeline (same non-fatal pattern as 70% generation)

- [ ] Task 5: Update `buildPortraitPrompt` for richer 85% portraits (AC: #7)
  - [ ] 5.1 In `packages/domain/src/utils/portrait-system-prompt.ts`, update `selectTopEvidence()` to accept a configurable `limit` parameter (default 10, use 15 for regeneration)
  - [ ] 5.2 Add a note to the system prompt when regenerating: "This is a refined portrait based on deeper conversation data. Include more nuanced behavioral patterns and specific examples from the evidence."
  - [ ] 5.3 Keep the same 6-10 sentence length constraint — richer content, not longer content

- [ ] Task 6: Frontend — add "Portrait updated" indicator to `PersonalPortrait` component (AC: #3)
  - [ ] 6.1 Add optional `isUpdated?: boolean` prop to `PersonalPortrait` component in `apps/front/src/components/results/PersonalPortrait.tsx`
  - [ ] 6.2 When `isUpdated` is true, render a subtle indicator below the portrait text: `<p className="text-xs text-muted-foreground mt-3">Updated — based on deeper understanding</p>`
  - [ ] 6.3 Add `personalDescriptionUpdatedAt: S.NullOr(S.String)` to `GetResultsResponseSchema` in `packages/contracts/src/http/groups/assessment.ts`
  - [ ] 6.4 Update `get-results.use-case.ts` to return `personalDescriptionUpdatedAt` from the session
  - [ ] 6.5 In `results/$assessmentSessionId.tsx` route, pass `isUpdated={!!personalDescriptionUpdatedAt}` to `PersonalPortrait`

- [ ] Task 7: Write tests (AC: #1, #2, #4, #5, #6)
  - [ ] 7.1 Update `apps/api/src/__tests__/generate-portrait.use-case.test.ts` to test regeneration mode:
    - Test: regeneration at 85% overwrites existing portrait
    - Test: regeneration is idempotent (checks `personalDescriptionUpdatedAt`)
    - Test: regeneration uses 15 evidence quotes
    - Test: cost is tracked for regeneration
  - [ ] 7.2 Update `apps/api/src/__tests__/send-message.use-case.test.ts` (or create integration-level test) to verify:
    - Test: paid user at 85% triggers regeneration
    - Test: free user at 85% does NOT trigger regeneration
    - Test: paid user below 85% does NOT trigger regeneration
    - Test: regeneration failure does NOT propagate to message response
  - [ ] 7.3 Update `packages/domain/src/utils/__tests__/portrait-system-prompt.test.ts`:
    - Test: `selectTopEvidence()` with limit=15 returns 15 items
    - Test: regeneration prompt includes "refined portrait" instruction
  - [ ] 7.4 Run `pnpm test:run` — verify no regressions

## Dev Notes

### Key Architecture Constraints

- **Hexagonal architecture compliance** — User tier is read from the DB via the existing user/session infrastructure. No new repository needed — the `AssessmentSessionRepository` already has access to session → userId, and the user table can be queried through the existing Drizzle setup.
- **Fire-and-forget pattern** — 85% portrait regeneration uses the same `Effect.forkDaemon` pattern as the 70% generation. It MUST NOT block the send-message response.
- **Non-fatal errors** — Portrait regeneration failure must be caught and logged. It should NEVER cause a message send to fail. Wrap in `Effect.catchAll`.
- **Single `personal_description` column** — Overwrite at 85%, don't create a v2 column. The `personal_description_updated_at` timestamp tracks WHEN the overwrite happened.
- **Max 2 API calls per user** — 1 at 70% (Story 8-4), 1 at 85% (this story). The `personalDescriptionUpdatedAt IS NULL` check prevents additional regenerations.

### Story 8-4 Dependency

This story REQUIRES Story 8-4 to be completed first. Story 8-4 provides:
- `personal_description` column on `assessment_sessions` table
- `PortraitGeneratorRepository` interface and implementation
- `generate-portrait.use-case.ts` use-case
- `buildPortraitPrompt()` and `selectTopEvidence()` utilities
- `PersonalPortrait` frontend component
- Integration into `send-message.use-case.ts` batch trigger

Story 8-5 EXTENDS all of these — it does NOT duplicate them.

### Paid Tier Implementation — Minimal Approach

The payment system (Stripe checkout, subscription management, etc.) is OUT OF SCOPE for this story. This story adds:
1. A `tier` column to the `user` table (`"free"` | `"paid"`)
2. A tier check in the portrait regeneration trigger

**How users become "paid":** This will be handled by a future Stripe integration story. For now, the `tier` column can be manually set to `"paid"` in the database for testing, or a simple admin API can be added. The important thing is the portrait regeneration logic correctly gates on `tier === "paid"`.

**For testing/demo:** The mock user in `__mocks__` can have `tier: "paid"` to enable testing the regeneration flow.

### Portrait Regeneration Trigger Point

The 85% check plugs into the SAME daemon as the 70% check (from Story 8-4):

```
User sends message (messageCount = N)
  → Orchestrator processes (nerin response returned immediately)
  → IF N % 3 === 0:
      → forkDaemon(
          → processAnalysis()                            ← EXISTING
          → IF >= 70 AND personalDescription IS NULL:
              → generatePortrait(mode: "generate")       ← STORY 8-4
          → IF >= 85 AND user.tier === "paid"
             AND personalDescriptionUpdatedAt IS NULL:
              → generatePortrait(mode: "regenerate")     ← THIS STORY
        )
```

**Important:** The 85% check runs AFTER the 70% check in the same daemon. On the message where confidence first crosses 85%, both checks may fire — but the 70% check will no-op (portrait already exists) and the 85% check will trigger regeneration.

### Idempotent Regeneration Guard

The `personalDescriptionUpdatedAt` column serves as the idempotent guard for 85% regeneration:

| State | 70% Behavior | 85% Behavior |
|-------|-------------|-------------|
| `personalDescription IS NULL`, `updatedAt IS NULL` | Generate (set description) | Skip (no portrait to regenerate) |
| `personalDescription IS NOT NULL`, `updatedAt IS NULL` | Skip (already generated) | Regenerate (overwrite description, set updatedAt) |
| `personalDescription IS NOT NULL`, `updatedAt IS NOT NULL` | Skip | Skip (already regenerated) |

### Free Tier Message Limit Interaction

The `freeTierMessageThreshold` config (currently enforced in `send-message.use-case.ts:84-93`) prevents free users from sending messages beyond the threshold. This means:
- Free users' confidence will plateau around 70% (they can't send more messages)
- Free users will NEVER reach 85% confidence (they're message-locked)
- The `user.tier === "paid"` check is a safety guard, but the real gating is the message limit
- When a user pays (future story), the `freeTierMessageThreshold` check needs to be bypassed for paid users — **this is NOT in scope for Story 8-5** but is important context

### DB Schema Changes

```typescript
// In packages/infrastructure/src/db/drizzle/schema.ts

// User table — add tier column
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  tier: text("tier").default("free").notNull(), // NEW — "free" | "paid"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Assessment session table — add personal_description_updated_at
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
    personalDescription: text("personal_description"),           // FROM STORY 8-4
    personalDescriptionUpdatedAt: timestamp("personal_description_updated_at"), // NEW
  },
  (table) => [
    index("assessment_session_user_id_idx").on(table.userId),
  ],
);
```

### Reading User Tier

The user tier can be read via the existing session → userId relationship. In the daemon:

```typescript
// In the batch daemon, after computing confidence:
const userRecord = yield* sessionRepo.getSession(sessionId);
if (!userRecord.userId) return; // Anonymous users are always free tier

// Read user tier from DB (need to add a method or use Drizzle directly)
// Option A: Add getUserTier to AssessmentSessionRepository (couples concern)
// Option B: Query user table in the use-case (simpler, direct)
//
// RECOMMENDED: Option B — use a simple Effect that queries the user table
// via Drizzle. This avoids adding a new repository for a single field read.
// If a UserRepository already exists (check), use it instead.
```

**Note:** The `user` table is managed by Better Auth. Check if Better Auth provides a user query mechanism or if a direct Drizzle query is needed. The simplest approach is a direct Drizzle query in the use-case since this is a single-field read.

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
  personalDescription: S.NullOr(S.String),         // FROM STORY 8-4
  personalDescriptionUpdatedAt: S.NullOr(S.String), // NEW — ISO string or null
});
```

### Frontend Changes

Minimal — just add the "Updated" indicator:

```tsx
// In PersonalPortrait.tsx — add isUpdated prop
interface PersonalPortraitProps {
  portrait: string;
  archetypeColor: string;
  displayName?: string | null;
  isUpdated?: boolean; // NEW
}

export function PersonalPortrait({ portrait, archetypeColor, displayName, isUpdated }: PersonalPortraitProps) {
  const heading = displayName ? `${displayName}'s Personal Portrait` : "Your Personal Portrait";

  return (
    <div data-slot="personal-portrait" className="max-w-2xl mx-auto px-6 py-8">
      <div
        className="border-l-4 rounded-lg bg-card/50 p-6"
        style={{ borderColor: archetypeColor }}
      >
        <h3 className="text-lg font-semibold mb-4">{heading}</h3>
        <p className="text-sm leading-relaxed text-foreground/90">{portrait}</p>
        {isUpdated && (
          <p className="text-xs text-muted-foreground mt-3">
            Updated — based on deeper understanding
          </p>
        )}
      </div>
    </div>
  );
}
```

### Source Tree Components to Touch

| File | Change Type | Purpose |
|------|------------|---------|
| `packages/infrastructure/src/db/drizzle/schema.ts` | EDIT | Add `tier` to `user`, `personalDescriptionUpdatedAt` to `assessmentSession` |
| `packages/domain/src/entities/session.entity.ts` | EDIT | Add `personalDescriptionUpdatedAt` to entity schema |
| `packages/domain/src/utils/portrait-system-prompt.ts` | EDIT | Make `selectTopEvidence` limit configurable, add regeneration prompt note |
| `packages/domain/src/index.ts` | EDIT | Export `UserTier` type if added |
| `apps/api/src/use-cases/generate-portrait.use-case.ts` | EDIT | Add `mode: "generate" | "regenerate"` support |
| `apps/api/src/use-cases/send-message.use-case.ts` | EDIT | Add 85% paid tier regeneration trigger |
| `apps/api/src/use-cases/get-results.use-case.ts` | EDIT | Return `personalDescriptionUpdatedAt` |
| `packages/contracts/src/http/groups/assessment.ts` | EDIT | Add `personalDescriptionUpdatedAt` to response schema |
| `packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts` | EDIT | Map `personal_description_updated_at` field |
| `packages/infrastructure/src/repositories/__mocks__/assessment-session.drizzle.repository.ts` | EDIT | Add `personalDescriptionUpdatedAt: null` to mock |
| `apps/front/src/components/results/PersonalPortrait.tsx` | EDIT | Add `isUpdated` prop and indicator |
| `apps/front/src/routes/results/$assessmentSessionId.tsx` | EDIT | Pass `isUpdated` prop from API response |
| `drizzle/` | AUTO-GENERATED | Migration files |
| `apps/api/src/__tests__/generate-portrait.use-case.test.ts` | EDIT | Add regeneration mode tests |
| `packages/domain/src/utils/__tests__/portrait-system-prompt.test.ts` | EDIT | Test configurable limit |

### Files NOT to Touch

- `packages/domain/src/constants/archetypes.ts` — Static archetype descriptions (Story 8.1). Unrelated.
- `packages/domain/src/constants/trait-descriptions.ts` — Static trait descriptions (Story 8.2). Unrelated.
- `packages/domain/src/constants/facet-descriptions.ts` — Static facet descriptions (Story 8.3). Unrelated.
- `packages/domain/src/repositories/portrait-generator.repository.ts` — Interface unchanged. Same `generatePortrait()` method handles both modes (the mode distinction is in the use-case, not the repository).
- `packages/infrastructure/src/repositories/portrait-generator.anthropic.repository.ts` — Implementation unchanged. It receives a prompt and returns a portrait.
- `packages/infrastructure/src/repositories/orchestrator.langgraph.repository.ts` — Orchestrator graph logic. Portrait regeneration is triggered from the USE-CASE layer.
- `apps/front/src/routes/public-profile.$publicProfileId.tsx` — Public profiles do NOT show portraits (AC #7 from Story 8-4, still applies).

### Testing Standards

- **Test framework:** `vitest` with `@effect/vitest`
- **Mock pattern:** `vi.mock()` with `__mocks__` auto-resolution
- **Test layer:** Local `TestLayer = Layer.mergeAll(...)` with only needed mocks

```typescript
// generate-portrait.use-case.test.ts — add tests for regeneration
describe("generatePortraitIfReady — regeneration mode", () => {
  it.effect("should regenerate portrait when confidence >= 85 and paid user", () =>
    Effect.gen(function* () {
      // Setup: session with existing personalDescription, null updatedAt, user tier = "paid"
      const result = yield* generatePortraitIfReady({
        sessionId: "test",
        userId: "paid-user-1",
        mode: "regenerate",
      });
      // Assert: personalDescription overwritten, personalDescriptionUpdatedAt set, cost tracked
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should skip regeneration when updatedAt already set (idempotent)", () =>
    Effect.gen(function* () {
      // Setup: session with personalDescriptionUpdatedAt set
      const result = yield* generatePortraitIfReady({
        sessionId: "test",
        userId: "paid-user-1",
        mode: "regenerate",
      });
      // Assert: no regeneration, no cost incurred
    }).pipe(Effect.provide(TestLayer))
  );

  it.effect("should NOT regenerate for free tier users", () =>
    Effect.gen(function* () {
      // Setup: user.tier = "free", confidence >= 85
      // Assert: regeneration skipped entirely
    }).pipe(Effect.provide(TestLayer))
  );
});
```

### Previous Story Intelligence

**From Story 8-4:**
- Portrait generation is triggered from `send-message.use-case.ts`, NOT from the orchestrator graph
- `generate-portrait.use-case.ts` is a standalone use-case that can be called independently
- Portrait prompt is built via pure functions in `packages/domain/src/utils/portrait-system-prompt.ts`
- `PersonalPortrait` component uses `data-slot="personal-portrait"` for testing
- Portrait is NOT shown on public profiles (private, owner-only)
- Cost tracking uses existing `CostGuardRepository.incrementDailyCost()` path

**From Stories 8.1-8.3:**
- Character-length constraints are more reliable than sentence-count assertions for testing
- Second-person voice with varied, non-repetitive prose patterns works well
- `FACET_LEVEL_LABELS` from Story 8.3 can enrich the portrait prompt

### Git Intelligence

Recent commits:
- `9225a7c` chore: update sprint
- `c775c7f` feat(story-8-3): add level-specific facet descriptions with high/medium/low variants (#54)
- `dc3a49a` feat(story-8-2): add level-specific trait descriptions with high/medium/low variants (#53)
- `7ca8581` feat(story-8-1): expand archetype descriptions to 1500-2500 characters (#52)

**Patterns:**
- Branch naming: `feat/story-8-5-regenerate-portrait-paid-tier`
- Commit format: `feat(story-8-5): regenerate personalized portrait at 85% confidence for paid tier`
- PR-based workflow with squash merges

### Monetization Context

The UX spec defines the freemium model:
- **Free tier:** Chat until ~70% confidence, receive ONE personalized portrait, conversation locks
- **Paid tier ($10 one-time):** Unlock continued conversation beyond 70%, portrait regenerated at 85%
- **Price is TBD** in the UX spec — Story 8-5 only implements the portrait regeneration gate, not payment processing

The conversion messaging is subtle and non-manipulative (see UX spec: `monetization-display-transparency-model.md`). The portrait update indicator ("Updated — based on deeper understanding") aligns with the "depth-focused premium" philosophy.

### Out of Scope

- **Stripe integration / payment processing** — Future story. `user.tier` is manually set for now.
- **Free tier message limit bypass for paid users** — The `freeTierMessageThreshold` check in `send-message.use-case.ts` currently blocks ALL users. Paid users need this bypassed, but that's a separate story (conversation continuation).
- **Subscription management UI** — No upgrade/downgrade flow in this story.
- **Portrait regeneration at other confidence thresholds** — Only 70% (Story 8-4) and 85% (this story).

### Project Structure Notes

- All changes follow existing hexagonal architecture patterns
- New `tier` column on user table follows Better Auth's schema extension pattern
- No new repositories needed — use-case layer handles the tier check directly
- DB migration auto-generated by `pnpm db:generate`
- Mock data updated in `__mocks__/` for test layer compatibility

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-8-results-page-content-enrichment.md#Story 8.5]
- [Source: _bmad-output/implementation-artifacts/8-4-pre-generate-personalized-portrait-at-70-percent-confidence.md — Full Story 8-4 spec]
- [Source: _bmad-output/planning-artifacts/ux-design-specification/monetization-display-transparency-model.md — Freemium model]
- [Source: apps/api/src/use-cases/send-message.use-case.ts — batch analysis trigger + free tier limit]
- [Source: apps/api/src/use-cases/generate-portrait.use-case.ts — portrait generation orchestration (Story 8-4)]
- [Source: packages/domain/src/utils/portrait-system-prompt.ts — portrait prompt building (Story 8-4)]
- [Source: packages/infrastructure/src/db/drizzle/schema.ts — user + assessmentSession tables]
- [Source: packages/domain/src/entities/session.entity.ts — AssessmentSessionEntity schema]
- [Source: packages/contracts/src/http/groups/assessment.ts — GetResultsResponseSchema]
- [Source: packages/domain/src/config/app-config.ts — AppConfigService, freeTierMessageThreshold]
- [Source: packages/domain/src/repositories/cost-guard.repository.ts — cost tracking methods]
- [Source: apps/front/src/components/results/PersonalPortrait.tsx — portrait display component (Story 8-4)]
- [Source: apps/front/src/components/results/ProfileView.tsx — results layout]
- [Source: docs/ARCHITECTURE.md — hexagonal architecture, Effect Context.Tag pattern]
- [Source: docs/FRONTEND.md — data-slot conventions, styling patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
