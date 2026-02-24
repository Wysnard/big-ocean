# Story 13.3: Full Portrait Async Generation

Status: ready-for-dev

## Story

As a **user who has purchased portrait unlock**,
I want **my full personality portrait generated asynchronously after payment**,
so that **I receive a rich, detailed narrative about my personality without blocking the checkout flow**.

## Acceptance Criteria

1. **AC1 — Placeholder row insertion:** When a `portrait_unlocked` (or `extended_conversation_unlocked`) purchase event is recorded via webhook, a placeholder row is inserted in the `portraits` table with `tier='full'`, `content=NULL`, `retry_count=0` before spawning the async generation.

2. **AC2 — Async generation via forkDaemon:** A background fiber is spawned via `Effect.forkDaemon` to generate the full portrait using Sonnet/Opus. The daemon updates the placeholder row with `content` on success or increments `retry_count` and retries on failure (max 3 auto-retries).

3. **AC3 — Transaction boundary:** The `purchase_event` insertion and `portraits` placeholder insertion happen in a single database transaction (both or neither).

4. **AC4 — Portrait status endpoint:** A new `GET /api/portraits/{sessionId}/status` endpoint returns the current portrait status (`none`, `generating`, `ready`, `failed`) derived from the `portraits` table, not a stored status column.

5. **AC5 — Lazy retry via staleness check:** The status endpoint checks for stale "generating" portraits (> 5 min, `retry_count < 3`) and triggers a retry. If `retry_count >= 3`, returns `failed`.

6. **AC6 — Frontend polling:** `usePortraitStatus(sessionId)` hook polls the status endpoint via TanStack Query `refetchInterval`. Polling runs only while status is `generating` (every 2 seconds), stops on `ready` or `failed`.

7. **AC7 — PersonalPortrait renders full content:** The `PersonalPortrait` component displays the full portrait content when available, using the same Spine-based markdown structure as the existing portrait renderer.

8. **AC8 — portraits table schema:** A `portraits` table exists with: `id` (UUID PK), `assessment_result_id` (UUID FK), `tier` (text: 'teaser'|'full'), `content` (text, nullable), `locked_section_titles` (jsonb, nullable), `model_used` (text), `retry_count` (int, default 0), `created_at`. `UNIQUE(assessment_result_id, tier)` constraint prevents duplicate entries.

9. **AC9 — Idempotent daemon update:** The daemon's UPDATE query uses `WHERE id = X AND content IS NULL` to ensure idempotent completion.

10. **AC10 — Mock implementation:** `__mocks__/portrait.drizzle.repository.ts` provides in-memory mock with `_resetMockState` for testing.

## Tasks / Subtasks

- [ ] **Task 1: Database schema — portraits table** (AC: #8)
  - [ ] 1.1 Add `portraits` table to `packages/infrastructure/src/db/drizzle/schema.ts`:
    ```typescript
    export const portraits = pgTable("portraits", {
      id: uuid("id").defaultRandom().primaryKey(),
      assessmentResultId: uuid("assessment_result_id")
        .notNull()
        .references(() => assessmentResults.id, { onDelete: "cascade" }),
      tier: text("tier").notNull().$type<"teaser" | "full">(),
      content: text("content"), // nullable — NULL = generating
      lockedSectionTitles: jsonb("locked_section_titles"), // nullable — only for teaser
      modelUsed: text("model_used").notNull(),
      retryCount: integer("retry_count").notNull().default(0),
      createdAt: timestamp("created_at").notNull().defaultNow(),
    }, (table) => [
      uniqueIndex("portraits_result_tier_unique").on(table.assessmentResultId, table.tier),
    ]);
    ```
  - [ ] 1.2 Add relation definition in `defineRelations` section (portraits → assessmentResults)
  - [ ] 1.3 Run `pnpm db:generate` to create migration

- [ ] **Task 2: Domain repository interface — PortraitRepository** (AC: #1, #2, #4, #5, #9)
  - [ ] 2.1 Create `packages/domain/src/repositories/portrait.repository.ts`:
    ```typescript
    export type PortraitTier = "teaser" | "full";
    export type PortraitStatus = "none" | "generating" | "ready" | "failed";

    export interface Portrait {
      readonly id: string;
      readonly assessmentResultId: string;
      readonly tier: PortraitTier;
      readonly content: string | null;
      readonly lockedSectionTitles: ReadonlyArray<string> | null;
      readonly modelUsed: string;
      readonly retryCount: number;
      readonly createdAt: Date;
    }

    export interface InsertPortraitPlaceholder {
      readonly assessmentResultId: string;
      readonly tier: PortraitTier;
      readonly modelUsed: string;
    }

    export class PortraitRepository extends Context.Tag("PortraitRepository")<
      PortraitRepository,
      {
        readonly insertPlaceholder: (data: InsertPortraitPlaceholder) => Effect.Effect<Portrait, DatabaseError | DuplicatePortraitError>;
        readonly updateContent: (id: string, content: string) => Effect.Effect<Portrait, DatabaseError | PortraitNotFoundError>;
        readonly incrementRetryCount: (id: string) => Effect.Effect<Portrait, DatabaseError | PortraitNotFoundError>;
        readonly getByResultIdAndTier: (assessmentResultId: string, tier: PortraitTier) => Effect.Effect<Portrait | null, DatabaseError>;
        readonly getFullPortraitBySessionId: (sessionId: string) => Effect.Effect<Portrait | null, DatabaseError>;
      }
    >() {}
    ```
  - [ ] 2.2 Define `DuplicatePortraitError` and `PortraitNotFoundError` as `Data.TaggedError` **in the same file** (`portrait.repository.ts`), following the pattern of `PortraitGenerationError` in `portrait-generator.repository.ts`. These are infrastructure errors, NOT HTTP-facing — do not put them in `http.errors.ts`:
    ```typescript
    export class DuplicatePortraitError extends Data.TaggedError("DuplicatePortraitError")<{
      readonly assessmentResultId: string;
      readonly tier: PortraitTier;
    }> {}

    export class PortraitNotFoundError extends Data.TaggedError("PortraitNotFoundError")<{
      readonly portraitId: string;
    }> {}
    ```
  - [ ] 2.3 Export from `packages/domain/src/index.ts` barrel

- [ ] **Task 3: Drizzle repository implementation** (AC: #1, #9)
  - [ ] 3.1 Create `packages/infrastructure/src/repositories/portrait.drizzle.repository.ts`
  - [ ] 3.2 Implement `insertPlaceholder`: INSERT with returning, catch unique constraint → `DuplicatePortraitError`
  - [ ] 3.3 Implement `updateContent`: `UPDATE ... SET content = $content WHERE id = $id AND content IS NULL RETURNING *` — idempotent, returns `PortraitNotFoundError` if no rows affected (already has content or doesn't exist)
  - [ ] 3.4 Implement `incrementRetryCount`: `UPDATE ... SET retry_count = retry_count + 1 WHERE id = $id RETURNING *`
  - [ ] 3.5 Implement `getByResultIdAndTier`: SELECT WHERE assessment_result_id AND tier
  - [ ] 3.6 Implement `getFullPortraitBySessionId`: **Returns raw data only (no status derivation)**
    - JOIN `assessment_sessions` → `assessment_results` → `portraits` WHERE tier = 'full'
    - Returns `Portrait | null` — the use-case derives status from this data
    - If session has no `assessment_results` row, return `null` (not an error)
  - [ ] 3.7 Export `PortraitDrizzleRepositoryLive` Layer

- [ ] **Task 4: Mock implementation** (AC: #10)
  - [ ] 4.1 Create `packages/infrastructure/src/repositories/__mocks__/portrait.drizzle.repository.ts`
  - [ ] 4.2 Use `Layer.succeed` with in-memory `Map<string, Portrait>`
  - [ ] 4.3 Export `_resetMockState` and `PortraitDrizzleRepositoryLive`

- [ ] **Task 5: Generate full portrait use-case** (AC: #2, #9)
  - [ ] 5.1 Create `apps/api/src/use-cases/generate-full-portrait.use-case.ts`:
    ```typescript
    export const generateFullPortrait = (input: {
      portraitId: string;
      sessionId: string;
    }) => Effect.gen(function* () {
      const portraitRepo = yield* PortraitRepository;
      const portraitGen = yield* PortraitGeneratorRepository;
      const sessionRepo = yield* AssessmentSessionRepository;
      const resultsRepo = yield* AssessmentResultsRepository;
      const evidenceRepo = yield* FinalizationEvidenceRepository;
      const archetypeRepo = yield* ArchetypeRepository;

      // Load all required data
      const session = yield* sessionRepo.getById(input.sessionId);
      const results = yield* resultsRepo.getBySessionId(input.sessionId);
      const evidence = yield* evidenceRepo.getBySessionId(input.sessionId);
      const archetype = yield* archetypeRepo.getByOceanCode(results.oceanCode);
      const messages = yield* sessionRepo.getMessages(input.sessionId);

      // Generate portrait using existing PortraitGeneratorRepository (Sonnet)
      const content = yield* portraitGen.generatePortrait({
        sessionId: input.sessionId,
        facetScoresMap: results.facets,
        allEvidence: evidence,
        archetypeName: archetype.name,
        archetypeDescription: archetype.description,
        oceanCode5: results.oceanCode,
        messages,
      }).pipe(
        Effect.retry({
          times: 2, // 3 total attempts
          schedule: Schedule.exponential("2 seconds"),
        }),
        Effect.catchAll((error) => {
          // Log error and increment retry count
          return Effect.gen(function* () {
            yield* portraitRepo.incrementRetryCount(input.portraitId);
            return yield* Effect.fail(error);
          });
        }),
      );

      // Update placeholder with generated content (idempotent)
      yield* portraitRepo.updateContent(input.portraitId, content);

      return { success: true };
    });
    ```
  - [ ] 5.2 Handle the case where portrait is already generated (idempotent update)

- [ ] **Task 6: Extend PurchaseEventRepository with transactional portrait insertion** (AC: #1, #2, #3)
  - [ ] 6.1 Add `insertEventWithPortraitPlaceholder` method to `PurchaseEventRepository` interface:
    ```typescript
    insertEventWithPortraitPlaceholder: (
      event: InsertPurchaseEvent,
      portraitPlaceholder: InsertPortraitPlaceholder | null
    ) => Effect.Effect<{ purchaseEvent: PurchaseEvent; portrait: Portrait | null }, DatabaseError | DuplicateCheckoutError>
    ```
  - [ ] 6.2 Implement in `purchase-event.drizzle.repository.ts` using `db.transaction()`:
    - Insert purchase event
    - If portrait placeholder provided, insert with `onConflictDoNothing()` (idempotent)
    - Return both results
  - [ ] 6.3 Update mock implementation to match new interface

- [ ] **Task 7: Update process-purchase use-case to trigger portrait generation** (AC: #1, #2, #3)
  - [ ] 7.1 Add `getByCheckoutId` method to `PurchaseEventRepository` interface for idempotency check
  - [ ] 7.2 Modify `apps/api/src/use-cases/process-purchase.use-case.ts` with two-phase idempotency:
    ```typescript
    // Phase 1: Idempotency check
    const existingEvent = yield* purchaseRepo.getByCheckoutId(input.checkoutId);
    if (existingEvent) {
      // Duplicate webhook — check portrait state for re-trigger
      if (eventType === "portrait_unlocked" || eventType === "extended_conversation_unlocked") {
        const portrait = yield* portraitRepo.getFullPortraitBySessionId(sessionId);
        if (portrait && portrait.content === null && portrait.retryCount < 3) {
          yield* Effect.forkDaemon(generateFullPortrait({ portraitId: portrait.id, sessionId }));
        }
      }
      return existingEvent;
    }

    // Phase 2: First-time insertion
    const result = yield* purchaseRepo.insertEventWithPortraitPlaceholder(event, placeholder);
    if (result.portrait) {
      yield* Effect.forkDaemon(generateFullPortrait({ portraitId: result.portrait.id, sessionId }));
    }
    ```
  - [ ] 7.3 Handle case where user has no completed assessment (pass `null` for placeholder, skip forkDaemon)
  - [ ] 7.4 Import `generateFullPortrait` use-case, `PortraitRepository`, and required dependencies

- [ ] **Task 8: Get portrait status use-case** (AC: #4, #5)
  - [ ] 8.1 Create `apps/api/src/use-cases/get-portrait-status.use-case.ts`:
    ```typescript
    const STALENESS_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    const deriveStatus = (portrait: Portrait | null): PortraitStatus => {
      if (!portrait) return "none";
      if (portrait.content !== null) return "ready";
      if (portrait.retryCount >= 3) return "failed";
      return "generating";
    };

    const isStale = (createdAt: Date): boolean =>
      Date.now() - createdAt.getTime() > STALENESS_THRESHOLD_MS;

    export const getPortraitStatus = (sessionId: string) =>
      Effect.gen(function* () {
        const portraitRepo = yield* PortraitRepository;
        const portrait = yield* portraitRepo.getFullPortraitBySessionId(sessionId);
        const status = deriveStatus(portrait);

        // Lazy retry: if stale "generating" with retries left, spawn new daemon
        if (status === "generating" && portrait && isStale(portrait.createdAt) && portrait.retryCount < 3) {
          yield* Effect.forkDaemon(generateFullPortrait({
            portraitId: portrait.id,
            sessionId,
          }));
        }

        return { status, portrait };
      });
    ```
  - [ ] 8.2 Export `deriveStatus` as a pure function for unit testing

- [ ] **Task 9: Portrait status contract and handler** (AC: #4)
  - [ ] 9.1 Add to `packages/contracts/src/http/groups/portrait.ts`:
    ```typescript
    export class PortraitGroup extends HttpApiGroup.make("portrait")
      .add(
        HttpApiEndpoint.get("getPortraitStatus", "/portraits/:sessionId/status")
          .addSuccess(PortraitStatusResponse)
          .setPath(S.Struct({ sessionId: S.String }))
      ) {}
    ```
  - [ ] 9.2 Define `PortraitStatusResponse` schema: `{ status: 'none' | 'generating' | 'ready' | 'failed', portrait: Portrait | null }`
  - [ ] 9.3 Add to MainApi groups with `HttpApi.make("BigOceanApi").add(PortraitGroup)`
  - [ ] 9.4 Create `apps/api/src/handlers/portrait.ts` — **thin handler, delegates to use-case**:
    ```typescript
    export const PortraitGroupLive = HttpApiBuilder.group(BigOceanApi, "portrait", (handlers) =>
      handlers.handle("getPortraitStatus", ({ path }) =>
        getPortraitStatus(path.sessionId)
      )
    );
    ```

- [ ] **Task 10: Frontend polling hook** (AC: #6)
  - [ ] 10.1 Create `apps/front/src/hooks/usePortraitStatus.ts`:
    ```typescript
    export function usePortraitStatus(sessionId: string) {
      return useQuery<PortraitStatusResponse>({
        queryKey: ["portraitStatus", sessionId],
        queryFn: async () => {
          const response = await fetch(`${API_URL}/api/portraits/${sessionId}/status`, {
            credentials: "include", // Required for auth cookies
          });
          if (!response.ok) {
            throw new Error(`Portrait status fetch failed: ${response.status}`);
          }
          return response.json();
        },
        refetchInterval: (query) => {
          if (query.state.status === "error") return false;
          if (query.state.data?.status === "ready") return false;
          if (query.state.data?.status === "failed") return false;
          if (query.state.data?.status === "none") return false;
          return 2000; // Poll every 2 seconds while generating
        },
        enabled: !!sessionId,
      });
    }
    ```

- [ ] **Task 11: Update PersonalPortrait component** (AC: #7)
  - [ ] 11.1 Modify `apps/front/src/components/results/PersonalPortrait.tsx` to accept optional `fullPortrait` prop
  - [ ] 11.2 When `fullPortrait` is provided, render its `content` instead of `personalDescription`
  - [ ] 11.3 Add loading state for when portrait is `generating`
  - [ ] 11.4 Add error state with "Retry" button for when portrait is `failed`

- [ ] **Task 12: Integration in results page** (AC: #6, #7)
  - [ ] 12.1 In results page route, use `usePortraitStatus(sessionId)` to get full portrait status
  - [ ] 12.2 Pass `fullPortrait` to `PersonalPortrait` when status is `ready`
  - [ ] 12.3 Show generation progress indicator when status is `generating`
  - [ ] 12.4 Show retry UI when status is `failed`

- [ ] **Task 13: Unit tests**
  - [ ] 13.1 Create `apps/api/src/use-cases/__tests__/get-portrait-status.use-case.test.ts`:
    - Test `deriveStatus` pure function for all cases (none, generating, ready, failed)
    - Test staleness check triggers forkDaemon
    - Test non-stale generating does NOT trigger forkDaemon
  - [ ] 13.2 Create `apps/api/src/use-cases/__tests__/generate-full-portrait.use-case.test.ts`:
    - Test successful generation updates placeholder
    - Test retry on failure increments retry_count
    - Test idempotent update (already has content)
  - [ ] 13.3 Update `apps/api/src/use-cases/__tests__/process-purchase.use-case.test.ts`:
    - Test portrait_unlocked triggers placeholder insertion + forkDaemon
    - Test extended_conversation_unlocked also triggers portrait generation
    - Test duplicate webhook with existing portrait checks portrait state and triggers if needed

## Dev Notes

### Dependency Note: portraits Table Creation

**This story creates the `portraits` table.** Although the architecture shows teaser portrait (Story 12-3) also using this table, Epic 13 is being worked before Epic 12. This story creates the schema; Story 12-3 will add teaser-specific logic later.

The existing `portrait` field in `assessment_results` and `personalDescription` field in `assessment_sessions` remain unchanged for now. The new `portraits` table is additive — it supports the two-tier (teaser/full) model alongside the legacy single-portrait field. A future migration story may consolidate these.

### Architecture Compliance

- **Hexagonal architecture:** Domain interfaces in `packages/domain`, implementations in `packages/infrastructure`, handlers thin
- **Placeholder row pattern (ADR architecture.md):** INSERT with `content: null` → `Effect.forkDaemon` → daemon UPDATEs. Never daemon INSERTs.
- **Transaction boundary (Pattern 6):** `purchase_event` + `portraits` placeholder in single `db.transaction()`
- **Status derivation (Pattern 4):** `portraitStatus` derived from `portraits` table data, not a stored column
- **Error propagation:** Repository errors propagate unchanged to HTTP layer

### Key Implementation Details

- **`assessment_result_id` lookup:** The webhook handler knows `userId` from the event. Must look up the user's most recent completed `assessment_session` → `assessment_results.id`. If no completed assessment exists, skip portrait generation (user will trigger when they complete).
- **Model used:** Full portrait uses `claude-sonnet-4-6` (via existing `PortraitGeneratorRepository`). Store `"claude-sonnet-4-6"` in `model_used`.
- **forkDaemon vs fork:** Use `Effect.forkDaemon` to ensure the fiber survives request completion. The daemon runs independently and updates the DB.
- **Retry semantics — `retry_count` tracks daemon invocations, NOT internal LLM attempts:**
  - Each daemon invocation uses `Effect.retry({ times: 2 })` internally (3 LLM attempts per daemon)
  - If all 3 internal attempts fail, `retry_count` is incremented ONCE and the daemon exits
  - Lazy retry (via polling staleness) spawns a NEW daemon, which again has 3 internal attempts
  - Total possible LLM attempts: up to 9 (3 daemons × 3 attempts each)
  - `retry_count >= 3` means 3 daemon invocations failed, triggering `failed` status
- **Staleness threshold:** 5 minutes. If portrait has been `generating` for > 5 min with `retry_count < 3`, polling endpoint triggers retry.
- **Idempotent update:** `UPDATE ... WHERE content IS NULL` ensures completion is idempotent. If content already set, UPDATE affects 0 rows (not an error).
- **Double portrait prevention:** `UNIQUE(assessment_result_id, tier)` prevents duplicate placeholders. Catch `DuplicatePortraitError` in process-purchase and proceed (idempotent).

### Repository Naming Clarification

Two distinct repositories:
- **`PortraitGeneratorRepository`** (existing) — LLM-based generation (`generatePortrait()` → calls Sonnet, returns markdown string)
- **`PortraitRepository`** (this story) — Database operations (`insertPlaceholder`, `updateContent`, `getStatus`)

The use-case calls `PortraitRepository.insertPlaceholder()`, then `PortraitGeneratorRepository.generatePortrait()`, then `PortraitRepository.updateContent()`.

### Existing Code Reuse

- **`PortraitGeneratorRepository`** (`packages/domain/src/repositories/portrait-generator.repository.ts`) — already exists with `generatePortrait()` method, uses Sonnet with Spine prompt
- **`portrait-generator.claude.repository.ts`** — existing implementation with detailed PORTRAIT_CONTEXT system prompt (~530 lines)
- **`PersonalPortrait.tsx`** — existing component that renders portrait markdown with `splitMarkdownSections()`
- **`useFinalizationStatus.ts`** — existing polling pattern to follow for `usePortraitStatus`
- **`Effect.fork` pattern** — see `get-public-profile.use-case.ts` for fire-and-forget pattern

### Portrait Prompt Preservation

**The existing portrait generation prompt is preserved unchanged.** The `portrait-generator.claude.repository.ts` already implements the full Spine architecture with Sonnet — this IS the "full portrait" generator. Story 13-3 reuses it as-is via `PortraitGeneratorRepository.generatePortrait()`.

No prompt modifications are in scope for this story. The existing prompt includes:
- Spine-driven narrative structure (Opening → Build → Turn → Landing)
- Depth adaptation (RICH/MODERATE/THIN based on evidence density)
- Voice principles, craft requirements, and guardrails
- ~530 lines of detailed craftsmanship guidance

If prompt changes are needed later (e.g., for teaser differentiation in Story 12-3), that would be a separate story.

### Transaction Pattern and Idempotency (C6 Fix)

**Two-Phase Idempotency for Duplicate Webhooks:**

Polar may send duplicate webhooks. The flow must handle:
1. **First webhook:** Insert purchase_event + portrait placeholder → forkDaemon
2. **Duplicate webhook:** Detect duplicate → check portrait state → maybe re-trigger daemon

**Phase 1: Check before transaction (idempotency gate)**
```typescript
// In process-purchase.use-case.ts
const existingEvent = yield* purchaseRepo.getByCheckoutId(input.checkoutId);
if (existingEvent) {
  // Duplicate webhook — skip event insertion, but still check portrait state
  const portrait = yield* portraitRepo.getFullPortraitBySessionId(sessionId);
  if (portrait && portrait.content === null && portrait.retryCount < 3) {
    // Portrait exists but not complete — re-trigger generation
    yield* Effect.forkDaemon(generateFullPortrait({ portraitId: portrait.id, sessionId }));
  }
  return existingEvent; // Idempotent success
}
```

**Phase 2: First-time transaction**
```typescript
// Only reached on first webhook (no existing event)
const result = yield* purchaseRepo.insertEventWithPortraitPlaceholder(event, placeholder);

// Fork daemon AFTER transaction commits
if (result.portrait) {
  yield* Effect.forkDaemon(generateFullPortrait({
    portraitId: result.portrait.id,
    sessionId,
  }));
}
```

**Why two phases?**
- The combined transaction would throw `DuplicateCheckoutError` on duplicate webhook
- If we catch and swallow that error, we'd miss the opportunity to re-trigger failed portrait generation
- Checking portrait state on duplicate webhooks enables automatic recovery from daemon failures

**Repository method (for first-time insertion):**
```typescript
// In purchase-event.drizzle.repository.ts
insertEventWithPortraitPlaceholder: (event, portraitPlaceholder) =>
  Effect.tryPromise({
    try: async () => {
      return await db.transaction(async (tx) => {
        const [purchaseEvent] = await tx.insert(purchaseEvents).values(event).returning();
        let portrait = null;
        if (portraitPlaceholder) {
          [portrait] = await tx
            .insert(portraits)
            .values(portraitPlaceholder)
            .onConflictDoNothing()
            .returning();
        }
        return { purchaseEvent, portrait };
      });
    },
    catch: (e) => new DatabaseError({ message: String(e) }),
  })
```

**Critical:** The `forkDaemon` call must be OUTSIDE the transaction to avoid holding locks during long-running LLM generation.

### Frontend State Coordination

```
Payment confirmed (Polar onSuccess)
  → Show "Payment confirmed! Generating your full portrait..."
  → Poll `/api/portraits/{sessionId}/status`
  → While `generating`: show progress animation
  → When `ready`: update PersonalPortrait with full content
  → When `failed`: show retry button
```

### Project Structure Notes

**Files to create:**
- `packages/domain/src/repositories/portrait.repository.ts` — includes `DuplicatePortraitError`, `PortraitNotFoundError` as `Data.TaggedError`
- `packages/infrastructure/src/repositories/portrait.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/portrait.drizzle.repository.ts`
- `apps/api/src/use-cases/generate-full-portrait.use-case.ts`
- `apps/api/src/use-cases/get-portrait-status.use-case.ts` — status derivation + lazy retry logic
- `packages/contracts/src/http/groups/portrait.ts`
- `apps/api/src/handlers/portrait.ts`
- `apps/front/src/hooks/usePortraitStatus.ts`
- `drizzle/20260224XXXXXX_story_13_3_portraits/migration.sql`

**Files to modify:**
- `packages/infrastructure/src/db/drizzle/schema.ts` — add portraits table
- `packages/domain/src/index.ts` — export new types and repository
- `packages/domain/src/repositories/purchase-event.repository.ts` — add `getByCheckoutId`, `insertEventWithPortraitPlaceholder`
- `packages/infrastructure/src/repositories/purchase-event.drizzle.repository.ts` — implement new methods
- `packages/infrastructure/src/repositories/__mocks__/purchase-event.drizzle.repository.ts` — update mock
- `packages/contracts/src/http/api.ts` — add PortraitGroup to MainApi
- `apps/api/src/use-cases/process-purchase.use-case.ts` — two-phase idempotency + forkDaemon
- `apps/front/src/components/results/PersonalPortrait.tsx` — support full portrait rendering
- Results page route — integrate usePortraitStatus polling

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Portrait Generation Pipeline — lines 301-332]
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern 1: Placeholder Row Pattern — lines 405-418]
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern 6: Transaction Boundaries — lines 436-438]
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern 7: Lazy Retry via Polling — lines 440-442]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3 — lines 995-1027]
- [Source: packages/domain/src/repositories/portrait-generator.repository.ts — existing interface]
- [Source: packages/infrastructure/src/repositories/portrait-generator.claude.repository.ts — Sonnet implementation]
- [Source: apps/front/src/components/results/PersonalPortrait.tsx — existing component]
- [Source: apps/front/src/hooks/useFinalizationStatus.ts — polling pattern]
- [Source: apps/api/src/use-cases/get-public-profile.use-case.ts — Effect.fork pattern]
- [Source: _bmad-output/implementation-artifacts/13-1-purchase-events-schema-and-capability-derivation.md — purchase events schema]
- [Source: _bmad-output/implementation-artifacts/13-2-polar-sh-checkout-and-webhook-integration.md — webhook handler]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.

2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.

3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.

4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.

5. **forkDaemon that INSERTs** — NEVER have the daemon INSERT rows. Always use placeholder row pattern: INSERT placeholder → forkDaemon → daemon UPDATEs.

6. **Status column** — Do NOT add a `status` column to the `portraits` table. Status is derived from data (`content IS NULL` + `retry_count`).

7. **Polling when not needed** — Do NOT poll when status is `none`, `ready`, or `failed`. Only poll during `generating`.

8. **Transaction spanning forkDaemon** — Do NOT include forkDaemon inside the transaction. Transaction commits, THEN fork. Otherwise transaction may hold locks during long-running generation.

9. **Business logic in handlers** — Do NOT put status derivation, staleness checks, or forkDaemon calls in handlers. Per CLAUDE.md "Hard Rule: No business logic in handlers - all logic belongs in use-cases." Handlers only delegate to use-cases.

10. **Infrastructure errors in http.errors.ts** — Do NOT put repository-level errors (`DuplicatePortraitError`, `PortraitNotFoundError`) in `http.errors.ts`. HTTP-facing errors use `Schema.TaggedError` in contracts. Infrastructure errors use `Data.TaggedError` co-located in the repository file.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
