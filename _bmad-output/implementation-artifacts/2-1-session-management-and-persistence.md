# Story 2.1: Session Management & Persistence (TDD)

**Story ID:** 2.1
**Status:** in-progress
**Created:** 2026-01-31
**Epic:** 2 - Assessment Backend Services
**Epic Status:** in-progress (Story 2-0.5 complete, Story 2-1 starting)

**Developer Context:** This story builds directly on Story 2-0.5 (Effect-Based DI refactoring). All service patterns established there must be followed. Key learnings: Use Context.Tag (not FiberRef), implement services via Layer.effect, test service wiring (not library behavior), access services via `yield* ServiceTag` in handlers.

---

## Dev Agent Record → File List

**Files Created:**
- `packages/infrastructure/src/context/session-manager.ts` — SessionManager service with Context.Tag pattern
- `packages/infrastructure/src/__tests__/session-manager.test.ts` — Service layer tests (verify service wiring)
- `packages/domain/src/types/session.ts` — Session/Message type definitions (SessionData, PrecisionScores, etc.)
- `packages/domain/src/errors/session.ts` — Session error types (SessionNotFoundError, InvalidSessionStateError)

**Files Modified:**
- `packages/infrastructure/src/auth-schema.ts` — Added sessions and messages tables with indexes
- `packages/infrastructure/src/index.ts` — Export SessionManager service and live layer
- `packages/domain/src/index.ts` — Export session types and errors
- `apps/api/src/handlers/assessment.ts` — Updated handlers to use SessionManager service
- `apps/api/src/index.ts` — Added SessionManagerLive to service layer composition

---

## Tasks/Subtasks

### Task 1: Domain Types and Errors ✅
- [x] Create session types (SessionData, PrecisionScores, etc.)
- [x] Create session errors (SessionNotFoundError, InvalidSessionStateError)
- [x] Export from domain package index

### Task 2: Database Schema ⏳
- [x] Add sessions table with status, precision, messageCount fields
- [x] Add messages table with role, content, createdAt fields
- [x] Add composite index on (sessionId, createdAt) for performance
- [ ] Generate migration: `drizzle-kit generate`
- [ ] Apply migration: `drizzle-kit push`

### Task 3: SessionManager Service ✅
- [x] Create SessionManager Context.Tag
- [x] Implement createSession method
- [x] Implement saveMessage method
- [x] Implement getSession method
- [x] Implement updatePrecision method
- [x] Create SessionManagerLive layer with Database dependency

### Task 4: Service Tests ✅
- [x] Test service tag existence
- [x] Test layer construction with mock database
- [x] Test method availability (createSession, saveMessage, getSession, updatePrecision)
- [x] Test method execution (verify operations work)

### Task 5: HTTP Handler Integration ✅
- [x] Update `start` handler to use SessionManager.createSession
- [x] Update `sendMessage` handler to use SessionManager (getSession + saveMessage)
- [x] Update `resumeSession` handler to use SessionManager.getSession
- [x] Add Effect.orDie for error handling (TypeScript compatibility)

### Task 6: API Layer Composition ✅
- [x] Create ServiceLayers combining SessionManagerLive and DatabaseStack
- [x] Add ServiceLayers to HttpLive layer provides
- [x] Verify TypeScript compilation passes
- [x] Verify build succeeds

### Task 7: Integration Testing ⏳
- [ ] Start API server (`pnpm dev --filter api`)
- [ ] Test POST /api/assessment/start
- [ ] Test POST /api/assessment/message
- [ ] Test GET /api/assessment/:sessionId/resume
- [ ] Verify session persistence works end-to-end

### Task 8: Performance Validation ⏳
- [ ] Test resume endpoint with 100+ message history
- [ ] Verify load time <1 second (composite index working)
- [ ] Test message persistence (no data loss)

### Task 9: Documentation ⏳
- [ ] Add JSDoc comments to SessionManager methods
- [ ] Update CLAUDE.md with SessionManager usage examples (if needed)

---

## Story

As a **User**,
I want **to pause an assessment and resume from exactly where I left off**,
So that **I can take time between conversations without losing progress**.

---

## Acceptance Criteria

### Primary (TDD-Based)

**TEST-FIRST (Red Phase):**
- Test: Session created with unique ID
- Test: Messages persisted to database
- Test: Precision scores saved and restored
- Test: Session resume loads full history (<1 sec)
- Test: Conversation state accurate after resume

**IMPLEMENTATION (Green Phase):**
- Session saved with full conversation history
- History loads from server in <1 second
- Next agent response can be generated seamlessly
- All tests pass (green)

**INTEGRATION:**
- Full conversation history visible (scrollable)
- Precision scores continue updating
- Assessment continues from exact pause point

### Secondary
- **Documentation**: Session pattern documented; JSDoc on all methods
- **Tests**: 100% coverage for SessionManager code paths
- **Integration**: History loads <1s; no message loss
- **Error Handling**: SessionNotFoundError (404), InvalidSessionStateError (400)

---

## Developer Guidance: Effect Service Patterns (From Story 2-0.5)

**Critical Requirement:** This story establishes session management services using the Effect Context.Tag pattern perfected in Story 2-0.5. All implementations must follow these patterns exactly.

### Service Pattern: Context.Tag (Not FiberRef)

**Pattern to Follow:**

```typescript
// packages/infrastructure/src/context/session-manager.ts

import { Context, Layer, Effect } from "effect"
import { Database } from "./database.js"

/**
 * Session Manager Service Tag
 *
 * Service interface has NO requirements - dependencies managed by layer
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */
export class SessionManager extends Context.Tag("SessionManager")<
  SessionManager,
  {
    readonly createSession: (userId?: string) => Effect.Effect<{ sessionId: string }>;
    readonly saveMessage: (sessionId: string, role: "user" | "assistant", content: string) => Effect.Effect<void>;
    readonly getSession: (sessionId: string) => Effect.Effect<SessionData>;
    readonly updatePrecision: (sessionId: string, precision: PrecisionScores) => Effect.Effect<void>;
  }
>() {}

/**
 * Session Manager Layer - Receives database through DI
 *
 * Layer type: Layer<SessionManager, never, Database>
 * Database dependency resolved during layer construction, not at service level
 */
export const SessionManagerLive = Layer.effect(
  SessionManager,
  Effect.gen(function* () {
    // KEY: Receive database through DI during layer construction
    const database = yield* Database

    // Return service implementation
    return {
      createSession: (userId?: string) =>
        Effect.gen(function* () {
          // Use injected database
          const sessionId = `session_${Date.now()}_${nanoid()}`
          yield* database.insert(sessions).values({
            id: sessionId,
            userId: userId ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: "active",
            precision: {
              openness: 0.5,
              conscientiousness: 0.5,
              extraversion: 0.5,
              agreeableness: 0.5,
              neuroticism: 0.5,
            },
            messageCount: 0,
          })
          return { sessionId }
        }),

      saveMessage: (sessionId, role, content) =>
        Effect.gen(function* () {
          // Save message and update session
          yield* database.insert(messages).values({
            id: `msg_${nanoid()}`,
            sessionId,
            role,
            content,
            createdAt: new Date(),
          })
          yield* database.update(sessions).set({
            messageCount: count + 1,
            updatedAt: new Date()
          }).where(eq(sessions.id, sessionId))
        }),

      getSession: (sessionId) =>
        Effect.gen(function* () {
          // Load full session with messages
          const session = yield* database.query.sessions.findFirst({
            where: eq(sessions.id, sessionId)
          })
          const msgs = yield* database.query.messages.findMany({
            where: eq(messages.sessionId, sessionId),
            orderBy: asc(messages.createdAt)
          })
          return { session, messages: msgs }
        }),

      updatePrecision: (sessionId, precision) =>
        Effect.gen(function* () {
          yield* database.update(sessions).set({ precision, updatedAt: new Date() })
            .where(eq(sessions.id, sessionId))
        })
    }
  })
)

// Usage in handlers:
const handler = Effect.gen(function* () {
  const sessionMgr = yield* SessionManager
  const { sessionId } = yield* sessionMgr.createSession("user-123")
  yield* sessionMgr.saveMessage(sessionId, "user", "Tell me about myself")
  return { sessionId }
})
```

**Why This Pattern Matters:**
- Service interfaces stay clean (no requirements parameters)
- Dependencies managed at layer construction time (not at service usage time)
- Enables straightforward testing through layer substitution
- Type system ensures all dependencies are provided before service is used
- Follows official Effect documentation: "Layers act as constructors for creating services"

### Testing Approach (From Story 2-0.5)

**DO NOT test the underlying library behavior.** Test service wiring only.

**Anti-pattern:**
```typescript
// ❌ WRONG - Testing library behavior
it("should insert into database", async () => {
  const db = yield* Database
  const result = yield* db.insert(sessions).values(...)
  expect(result).toBeDefined() // Testing Drizzle, not our service
})
```

**Correct pattern:**
```typescript
// ✅ CORRECT - Testing service wiring
it("should create session with injected database", async () => {
  const mockDb = mockDatabase() // Test double with method stubs

  const handler = Effect.gen(function* () {
    const sessionMgr = yield* SessionManager
    return yield* sessionMgr.createSession("user-123")
  })

  // Provide mock database layer
  const result = await Effect.runPromise(
    handler.pipe(
      Effect.provide(
        Layer.succeed(Database, mockDb)
      )
    )
  )

  expect(result).toHaveProperty("sessionId")
  expect(mockDb.insert).toHaveBeenCalled() // Verify interaction
})
```

**Focus on:**
- ✅ Service tag existence
- ✅ Layer construction succeeds
- ✅ Method availability
- ✅ Correct parameters passed to dependencies
- ✅ Effect.gen syntax and error handling

**Avoid testing:**
- ❌ Database insert/update behavior (Drizzle's responsibility)
- ❌ Transaction semantics
- ❌ SQL generation
- ❌ Network I/O

---

## Technical Requirements

### Database Schema (Drizzle ORM + Effect Postgres)

The schema extends the existing Better Auth schema created in Story 1-2. All tables are defined in `packages/database/src/schema.ts` using Drizzle ORM with PostgreSQL.

**Story 2-0.5 established:** Database accessed via `DatabaseLive` layer using `@effect/sql-pg` and `drizzle-orm/effect-postgres` (official integration).

```typescript
// packages/database/src/schema.ts

import { pgTable, text, timestamp, integer, index, jsonb } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),                              // session_{timestamp}_{nanoid}
  userId: text("user_id"),                                  // NULL for anonymous, linked on auth
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  status: text("status").notNull().default("active"),        // 'active' | 'paused' | 'completed'
  precision: jsonb("precision").notNull(),                   // { openness, conscientiousness, ... }
  messageCount: integer("message_count").default(0).notNull(),
}, (table) => ({
  // Index by user_id for quick session lookup by user
  userIdIdx: index("idx_sessions_user_id").on(table.userId),
}))

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),                              // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // CRITICAL for <1 second resume load time: composite index on (sessionId, createdAt)
  // Allows efficient retrieval of all messages for a session in order
  sessionCreatedIdx: index("idx_messages_session_created")
    .on(table.sessionId, table.createdAt),
}))

// Relations for Drizzle query builder
export const sessionsRelations = relations(sessions, ({ many }) => ({
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(sessions, {
    fields: [messages.sessionId],
    references: [sessions.id],
  }),
}))
```

**Index Performance Notes:**
- `idx_sessions_user_id`: Enables fast lookup of all sessions by a user (for user profile, resumption list)
- `idx_messages_session_created`: **Critical for story requirement** - enables efficient retrieval of all messages for a session in chronological order. Combined index (sessionId, createdAt) allows DB to:
  1. Locate all rows for a session (sessionId filter)
  2. Retrieve in creation order (createdAt ordering)
  3. Without additional sorting step
  4. Query execution: ~10ms for 100 messages, <1s for 1000 messages

**Migration:**
```bash
# After adding/modifying schema
pnpm -C packages/database drizzle-kit generate:pg
# Verify migration in packages/database/migrations/
pnpm -C packages/database drizzle-kit push
```

### HTTP Contract Definitions

**Verify contracts exist in** `packages/contracts/src/http/groups/assessment.ts`:

```typescript
// StartAssessment endpoint
export const StartAssessmentRequestSchema = S.Struct({
  userId: S.optional(S.String),
})

export const StartAssessmentResponseSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.DateTimeUtc,
})

// SendMessage endpoint (stores user message, gets response)
export const SendMessageRequestSchema = S.Struct({
  sessionId: S.String,
  message: S.String,
})

export const SendMessageResponseSchema = S.Struct({
  response: S.String,
  precision: S.Struct({
    openness: S.Number,
    conscientiousness: S.Number,
    extraversion: S.Number,
    agreeableness: S.Number,
    neuroticism: S.Number,
  }),
})

// GetSession endpoint (resume session, load full history)
export const GetSessionRequestSchema = S.Struct({
  sessionId: S.String,
})

export const GetSessionResponseSchema = S.Struct({
  session: S.Struct({
    id: S.String,
    userId: S.optional(S.String),
    createdAt: S.DateTimeUtc,
    status: S.Literal("active", "paused", "completed"),
    precision: S.Struct({
      openness: S.Number,
      conscientiousness: S.Number,
      extraversion: S.Number,
      agreeableness: S.Number,
      neuroticism: S.Number,
    }),
  }),
  messages: S.Array(
    S.Struct({
      id: S.String,
      role: S.Literal("user", "assistant"),
      content: S.String,
      createdAt: S.DateTimeUtc,
    })
  ),
})
```

### Core Session Operations

**1. Create Session** (startAssessment HTTP POST)
- Generate unique sessionId (session_{timestamp}_{nanoid})
- Insert into sessions table with status='active', precision baseline (all 0.5)
- Return { sessionId, createdAt }

**2. Persist Message** (sendMessage HTTP POST)
- Validate sessionId exists and status='active'
- Insert message into messages table (role: 'user')
- Increment sessions.messageCount, update updatedAt
- Must be fast (synchronous) for optimistic update in frontend

**3. Update Precision** (async, after Analyzer/Scorer runs)
- Update sessions.precision with new scores
- Update sessions.updatedAt
- Can be asynchronous; called after analysis completes

**4. Retrieve Full Session** (HTTP GET /sessions/{sessionId})
- Query sessions table by ID (fail if not found)
- Query messages table WHERE sessionId=... ORDER BY createdAt ASC
- Return { session, messages }
- **Must complete <1 second** (requires (sessionId, createdAt) index)

### Error Handling with Effect-ts

```typescript
// packages/domain/src/errors/session.ts

import { Tagged } from "effect"

export class SessionNotFoundError extends Tagged("SessionNotFoundError")<{
  readonly sessionId: string
}> {}

export class InvalidSessionStateError extends Tagged("InvalidSessionStateError")<{
  readonly sessionId: string
  readonly currentStatus: string
}> {}

export type SessionError = SessionNotFoundError | InvalidSessionStateError
```

Then in HTTP handlers:
```typescript
const session = yield* db.sessions.findById(payload.sessionId)
if (!session) {
  return yield* Effect.fail(
    new SessionNotFoundError({ sessionId: payload.sessionId })
  )
}
```

---

## HTTP Handler Implementation (Story 1.6 + Story 2-0.5 Patterns)

Story 1.6 established Effect/Platform HTTP handlers. Story 2-0.5 established proper dependency injection via Context.Tag layers. This story integrates both patterns.

**Handler Pattern:**

```typescript
// apps/api/src/handlers/assessment.ts

import { HttpApiBuilder } from "@effect/platform"
import { DateTime, Effect } from "effect"
import { BigOceanApi } from "@workspace/contracts"
import { SessionManager } from "@workspace/infrastructure"
import { SessionError } from "@workspace/domain"

export const AssessmentGroupLive = HttpApiBuilder.group(
  BigOceanApi,
  "assessment",
  (handlers) =>
    Effect.gen(function* () {
      // KEY: Access SessionManager service via Context.Tag injection
      // Following Story 2-0.5 pattern: service dependencies resolved at layer construction
      const sessionMgr = yield* SessionManager

      return handlers
        .handle("startAssessment", ({ payload }) =>
          Effect.gen(function* () {
            // Service method - dependencies (database) already injected during layer construction
            const { sessionId } = yield* sessionMgr.createSession(payload.userId)

            return {
              sessionId,
              createdAt: DateTime.unsafeMake(Date.now()),
            }
          })
        )
        .handle("sendMessage", ({ payload }) =>
          Effect.gen(function* () {
            // Get current session to validate it exists and is active
            const sessionData = yield* sessionMgr.getSession(payload.sessionId).pipe(
              Effect.catchTag("SessionNotFoundError", () =>
                Effect.fail(
                  new SessionNotFoundError({ sessionId: payload.sessionId })
                )
              )
            )

            if (sessionData.session.status !== "active") {
              return yield* Effect.fail(
                new InvalidSessionStateError({
                  sessionId: payload.sessionId,
                  currentStatus: sessionData.session.status,
                })
              )
            }

            // Save user message
            yield* sessionMgr.saveMessage(
              payload.sessionId,
              "user",
              payload.message
            )

            // Placeholder response (Nerin will be added in Story 2.2)
            return {
              response: "Thank you for sharing that...",
              precision: sessionData.session.precision,
            }
          })
        )
        .handle("getSession", ({ payload }) =>
          Effect.gen(function* () {
            // Load full session and message history
            // Service ensures <1 second load via composite index on (sessionId, createdAt)
            const { session, messages } = yield* sessionMgr.getSession(payload.sessionId).pipe(
              Effect.catchTag("SessionNotFoundError", () =>
                Effect.fail(
                  new SessionNotFoundError({ sessionId: payload.sessionId })
                )
              )
            )

            return {
              session: {
                id: session.id,
                userId: session.userId ?? undefined,
                createdAt: DateTime.unsafeMake(session.createdAt.getTime()),
                status: session.status as "active" | "paused" | "completed",
                precision: session.precision,
              },
              messages: messages.map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                createdAt: DateTime.unsafeMake(m.createdAt.getTime()),
              })),
            }
          })
        )
    })
)
```

**Key Patterns (From Story 2-0.5):**
- Use `Context.Tag` for service definitions (not FiberRef)
- Access services via `yield* ServiceTag` (example: `yield* SessionManager`)
- Service interfaces have NO requirements - dependencies managed at layer construction
- Return errors with `yield* Effect.fail(ErrorType)`
- Layer composition uses `Layer.effect()` to inject dependencies during construction
- Type signatures: `Effect<SuccessType, ErrorType, RequiredServices>`
- Test service wiring, not library behavior (verify method availability, not execution)

---

## File Structure

**New Files to Create:**
1. `packages/infrastructure/src/context/session-manager.ts` — SessionManager service with Context.Tag pattern
2. `packages/domain/src/errors/session.ts` — Session error types (SessionNotFoundError, InvalidSessionStateError)
3. `packages/domain/src/types/session.ts` — Session/Message type definitions (SessionData, PrecisionScores, etc.)
4. `packages/domain/src/__tests__/session-manager.test.ts` — TDD tests (red phase first)
5. `packages/infrastructure/src/__tests__/session-manager.test.ts` — Service layer tests (verify service wiring)

**Files to Modify:**
1. `packages/database/src/schema.ts` — Add sessions and messages tables with indexes
2. `packages/infrastructure/src/index.ts` — Export SessionManager service and live layer
3. `apps/api/src/handlers/assessment.ts` — Update handlers to use SessionManager service
4. `apps/api/src/index.ts` — Add SessionManagerLive to service layer composition (Layer.mergeAll)

**Database Migration:**
```bash
# Generate migration from schema changes
pnpm -C packages/database drizzle-kit generate:pg

# Verify migration file created in packages/database/migrations/
# Review SQL to ensure indexes are correct

# Apply migrations to local PostgreSQL
pnpm -C packages/database drizzle-kit push

# For development with Docker Compose:
docker compose exec postgres psql -U dev -d bigocean -c "SELECT * FROM information_schema.tables WHERE table_schema = 'public'"
```

**Service Layer Updates (Story 2-0.5 Pattern):**

```typescript
// packages/api/src/index.ts - Add SessionManager to layer composition

const ServiceLayers = Layer.mergeAll(
  DatabaseStack,           // Database + PgClient (from Story 2-0.5)
  BetterAuthLive,          // Better Auth (from Story 2-0.5)
  LoggerServiceLive,       // Logger (from Story 2-0.5)
  SessionManagerLive,      // NEW - Session management (Story 2-1)
  CostGuardServiceLive,    // Cost guard (placeholder, Story 2.5)
)
```

---

## TDD Workflow

### Red Phase: Write Failing Tests First

**Strategy (From Story 2-0.5):** Test service wiring, not library behavior. Focus on:
- Service tag existence
- Layer construction succeeds
- Method availability
- Correct parameters passed to dependencies

**Test Structure:**

```typescript
// packages/infrastructure/src/__tests__/session-manager.test.ts
// Tests the SessionManager service wiring and layer composition

import { describe, it, expect, beforeEach } from "vitest"
import { Layer, Effect, Context } from "effect"
import { SessionManager, SessionManagerLive } from "../context/session-manager.js"
import { Database } from "../context/database.js"

// Mock database for testing (test double, not Drizzle execution)
const createMockDatabase = () => ({
  // Stub methods that service will call
  insert: {
    values: Effect.succeed,
  },
  update: () => ({
    set: () => ({
      where: Effect.succeed,
    }),
  }),
  query: {
    sessions: {
      findFirst: Effect.succeed({ id: "test" }),
    },
    messages: {
      findMany: Effect.succeed([]),
    },
  },
})

describe("SessionManager Service", () => {
  describe("Service Layer Composition", () => {
    it("should define SessionManager service tag", () => {
      expect(SessionManager).toBeDefined()
    })

    it("should construct with mock database", async () => {
      const mockDb = createMockDatabase()

      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        expect(sessionMgr).toBeDefined()
        expect(sessionMgr.createSession).toBeDefined()
        expect(sessionMgr.saveMessage).toBeDefined()
        expect(sessionMgr.getSession).toBeDefined()
        expect(sessionMgr.updatePrecision).toBeDefined()
      })

      // Provide mock database layer
      await Effect.runPromise(
        test.pipe(
          Effect.provide(
            Layer.succeed(Database, mockDb)
          ),
          Effect.provide(SessionManagerLive)
        )
      )
    })
  })

  describe("Service Method Availability", () => {
    it("should expose createSession method", async () => {
      const mockDb = createMockDatabase()

      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        expect(typeof sessionMgr.createSession).toBe("function")
      })

      await Effect.runPromise(
        test.pipe(
          Effect.provide(Layer.succeed(Database, mockDb)),
          Effect.provide(SessionManagerLive)
        )
      )
    })

    it("should expose saveMessage method", async () => {
      const mockDb = createMockDatabase()

      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        expect(typeof sessionMgr.saveMessage).toBe("function")
      })

      await Effect.runPromise(
        test.pipe(
          Effect.provide(Layer.succeed(Database, mockDb)),
          Effect.provide(SessionManagerLive)
        )
      )
    })

    it("should expose getSession method", async () => {
      const mockDb = createMockDatabase()

      const test = Effect.gen(function* () {
        const sessionMgr = yield* SessionManager
        expect(typeof sessionMgr.getSession).toBe("function")
      })

      await Effect.runPromise(
        test.pipe(
          Effect.provide(Layer.succeed(Database, mockDb)),
          Effect.provide(SessionManagerLive)
        )
      )
    })
  })
})
```

### Green Phase: Implement SessionManager to Pass Tests

Create `packages/infrastructure/src/context/session-manager.ts` with full implementation following the service pattern shown in Developer Guidance section above. Tests should pass when:
1. Service tag defined
2. Layer construction succeeds with mock database
3. All service methods are callable

### Refactor Phase: Improve While Tests Stay Green

- Verify correct parameters passed to database methods
- Add JSDoc comments to service methods
- Ensure error handling patterns are consistent with Story 1.6
- Verify database access patterns follow Drizzle Effect integration

---

## Success Metrics

**Acceptance Checklist:**

**TDD (Red Phase):**
- [ ] Write service wiring tests (verify service tag, layer construction, method availability)
- [ ] Tests fail initially (red phase)

**Implementation (Green Phase):**
- [ ] Create `packages/infrastructure/src/context/session-manager.ts` with SessionManager service
- [ ] Create `packages/domain/src/errors/session.ts` with error types
- [ ] Create `packages/domain/src/types/session.ts` with type definitions
- [ ] Add sessions and messages tables to `packages/database/src/schema.ts`
- [ ] All service wiring tests pass: `pnpm test packages/infrastructure`
- [ ] Database tables created: `pnpm drizzle-kit generate:pg && pnpm drizzle-kit push`

**Integration:**
- [ ] Update `apps/api/src/handlers/assessment.ts` to use SessionManager service
- [ ] Update `apps/api/src/index.ts` to compose SessionManagerLive layer
- [ ] Update `packages/infrastructure/src/index.ts` to export SessionManager and SessionManagerLive
- [ ] HTTP handlers work: `pnpm dev --filter=api` starts without errors

**Validation:**
- [ ] Resume loads full history in <1 second (composite index working)
- [ ] No message loss on pause/resume cycle
- [ ] Error handling: 404 for missing session, 400 for invalid state
- [ ] SessionManager service integrates with Database layer (following 2-0.5 pattern)
- [ ] All tests pass: `pnpm test` (no regressions)
- [ ] JSDoc comments on SessionManager methods
- [ ] Code review: Check Effect patterns match Story 2-0.5 standards

---

## Dependencies

**Already Complete:**
- Story 1.1: Railway infrastructure (PostgreSQL running)
- Story 1.4: Docker Compose setup (local PostgreSQL)
- Story 1.6: Effect/Platform HTTP handlers (handler pattern)
- Story 7.1: Vitest testing framework

**Use From Previous Stories:**
- RPC contract pattern: `packages/contracts/src/http/groups/assessment.ts`
- Handler pattern: Story 1.6 implementation
- Error handling: Effect-ts tagged errors
- Testing utilities: `@workspace/domain/test-utils`
- Database setup: Drizzle ORM via `packages/database`

---

## References

- **HTTP Contracts:** `packages/contracts/src/http/groups/assessment.ts`
- **Handler Pattern:** `apps/api/src/handlers/assessment.ts` (from Story 1.6)
- **Testing Guide:** `docs/testing/tdd-guide.md`
- **Database:** `packages/database/src/schema.ts`
- **Error Patterns:** `packages/domain/src/errors/`

---

## Integration Points & Architecture Context

### Where Story 2-1 Fits in Epic 2

**Epic 2: Assessment Backend Services** (in-progress)
- Story 2-0: Linter fixes ✅ (complete)
- Story 2-0.5: Effect DI refactoring ✅ (complete, establishes service patterns)
- **Story 2-1: Session Management** ← YOU ARE HERE
  - Builds on: Database layer (2-0.5), HTTP handlers (1.6), Effect patterns (2-0.5)
  - Enables: Story 2-2 (Nerin agent), Story 2-3 (Analyzer/Scorer)
- Story 2-2: Nerin agent (depends on 2-1)
- Story 2-3: Analyzer/Scorer (depends on 2-1)
- Story 2-4: LangGraph orchestration (depends on 2-2, 2-3)
- Story 2-5: Cost tracking & rate limiting (depends on 2-1, 2-2, 2-3)

### Precision Scoring Pipeline Integration

This story establishes session state persistence. Precision scores are updated by Story 2-3 (Analyzer/Scorer) via `sessionMgr.updatePrecision(sessionId, scores)` after analysis. The session manager stores precision as JSONB:

```typescript
precision: {
  openness: number,          // 0.0-1.0
  conscientiousness: number,
  extraversion: number,
  agreeableness: number,
  neuroticism: number,
}
```

Score persistence enables:
1. **Frontend Display:** Real-time precision updates in conversation UI
2. **Cost Awareness:** Scores below 60% confidence trigger more questions (Story 2-2)
3. **Archetype Generation:** Final scores map to OCEAN codes (Story 3-1)

### Cost Control Architecture

Sessions tracked via `messageCount` for cost awareness (Story 2.5). Each session can be tagged with:
- `userId`: Links to user's daily budget tracking (Redis)
- `createdAt`: Enables per-day cost aggregation
- `status`: 'active' allows new messages, 'paused'/'completed' blocks further messages

Cost guard service (Story 2.5) will:
```typescript
const canContinue = yield* costGuard.checkDailyLimit(session.userId)
if (!canContinue) {
  // Update session.status to 'cost-limit-reached'
  // Send user message: "Assessment paused due to daily budget..."
}
```

### Frontend State Synchronization (TanStack Query)

Sessions are retrieved via `GET /assessment/session/{sessionId}` and cached by TanStack Query (Story 4). The HTTP response includes:
- Complete session metadata (id, userId, createdAt, status, precision)
- Full message history (enables scrolling)
- Enables session resumption: Frontend loads history on URL with `?sessionId=...` param

Local-first sync via ElectricSQL (Story 5) will sync messages and precision to local DB for offline access.

---

## Developer Onboarding Checklist

**Before Starting Development:**
- [ ] Review Story 2-0.5 (Effect service patterns) for implementation examples
- [ ] Review Story 1.6 (HTTP handlers) for handler structure
- [ ] Check `CLAUDE.md` section on "FiberRef Dependency Injection Pattern"
- [ ] Understand composite indexes for performance (<1 sec requirement)
- [ ] Familiar with Drizzle ORM + Effect Postgres integration

**During Development:**
- [ ] Follow Effect service pattern: Context.Tag + Layer.effect + yield* ServiceTag
- [ ] Test service wiring, not library behavior (lesson from 2-0.5)
- [ ] Keep database logic in SessionManager service, HTTP logic in handlers
- [ ] Use Effect.gen for all async/DB operations
- [ ] Ensure composite index created for performance testing

**After Development:**
- [ ] All tests pass with no regressions
- [ ] Code review validates Effect patterns match 2-0.5
- [ ] Performance test: <1 second for 100+ message history load
- [ ] Error messages for missing/invalid sessions
- [ ] Backwards compatibility: No breaking changes to existing APIs

---

**Ready for Development** ✅

**Story Status:** ready-for-dev
**Complete Context Provided:** ✅
**All Dependencies Met:** ✅
**Previous Story Learnings Incorporated:** ✅ (Story 2-0.5 Effect patterns)
**Architectural Context Established:** ✅ (Precision pipeline, cost control, frontend sync)

Proceed with TDD workflow:
1. **Red Phase:** Write service wiring tests
2. **Green Phase:** Implement SessionManager service
3. **Refactor Phase:** Optimize, document, integrate with API
4. **Code Review:** Validate Effect patterns against Story 2-0.5
5. **Merge:** Update sprint-status.yaml to 'done'
