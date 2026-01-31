# Story 2.1: Session Management & Persistence (TDD)

**Story ID:** 2.1  
**Status:** ready-for-dev  
**Created:** 2026-01-31

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

## Technical Requirements

### Database Schema (Drizzle ORM)

```typescript
// packages/database/src/schema.ts

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),                              // session_{timestamp}_{nanoid}
  userId: text("user_id"),                                  // NULL for anonymous, linked on auth
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  status: text("status").notNull(),                          // 'active' | 'paused' | 'completed'
  precision: jsonb("precision").notNull(),                   // { openness, conscientiousness, ... }
  messageCount: integer("message_count").default(0).notNull(),
})

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),                              // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Critical for <1 second resume load time
export const messagesSessionIndex = index("idx_messages_session_created")
  .on(messages.sessionId, messages.createdAt)
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

## HTTP Handler Pattern (from Story 1.6)

Follow exactly the Effect/Platform HTTP structure with contracts and HttpApiBuilder:

```typescript
// apps/api/src/handlers/assessment.ts

import { HttpApiBuilder } from "@effect/platform"
import { DateTime, Effect } from "effect"
import { BigOceanApi } from "@workspace/contracts"
import { DatabaseRef, LoggerRef } from "@workspace/infrastructure"
import { SessionError } from "@workspace/domain"
import { nanoid } from "nanoid"

export const AssessmentGroupLive = HttpApiBuilder.group(
  BigOceanApi,
  "assessment",
  (handlers) =>
    Effect.gen(function* () {
      return handlers
        .handle("startAssessment", ({ payload }) =>
          Effect.gen(function* () {
            const db = yield* DatabaseRef.get()
            const logger = yield* LoggerRef.get()

            const sessionId = `session_${Date.now()}_${nanoid()}`

            yield* db.sessions.insert({
              id: sessionId,
              userId: payload.userId ?? null,
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

            logger.info("Session started", {
              sessionId,
              userId: payload.userId,
            })

            return {
              sessionId,
              createdAt: DateTime.unsafeMake(Date.now()),
            }
          })
        )
        .handle("sendMessage", ({ payload }) =>
          Effect.gen(function* () {
            const db = yield* DatabaseRef.get()
            const logger = yield* LoggerRef.get()

            // Validate session exists and is active
            const session = yield* db.sessions.findById(payload.sessionId)
            if (!session) {
              return yield* Effect.fail(
                new SessionNotFoundError({ sessionId: payload.sessionId })
              )
            }

            if (session.status !== "active") {
              return yield* Effect.fail(
                new InvalidSessionStateError({
                  sessionId: payload.sessionId,
                  currentStatus: session.status,
                })
              )
            }

            // Save user message
            yield* db.messages.insert({
              id: `msg_${nanoid()}`,
              sessionId: payload.sessionId,
              role: "user",
              content: payload.message,
              createdAt: new Date(),
            })

            // Update session
            yield* db.sessions.update(payload.sessionId, {
              ...session,
              messageCount: session.messageCount + 1,
              updatedAt: new Date(),
            })

            logger.info("Message saved", {
              sessionId: payload.sessionId,
              messageLength: payload.message.length,
            })

            // Placeholder response (Nerin will be added in Story 2.2)
            return {
              response: "Thank you for sharing that...",
              precision: session.precision,
            }
          })
        )
        .handle("getSession", ({ payload }) =>
          Effect.gen(function* () {
            const db = yield* DatabaseRef.get()

            // Load session
            const session = yield* db.sessions.findById(payload.sessionId)
            if (!session) {
              return yield* Effect.fail(
                new SessionNotFoundError({ sessionId: payload.sessionId })
              )
            }

            // Load all messages in chronological order
            const messages = yield* db.messages.findBySessionId(
              payload.sessionId
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

**Key Patterns:**
- Use `Effect.gen(function* () { ... })` for all async/DB operations
- Access services via `yield* ServiceRef.get()` (DatabaseRef, LoggerRef)
- Return errors with `yield* Effect.fail(ErrorType)`
- Type signatures: `Effect<SuccessType, ErrorType, RequiredServices>`

---

## File Structure

**New Files to Create:**
1. `packages/domain/src/errors/session.ts` — Session error types
2. `packages/domain/src/types/session.ts` — Session/Message type definitions
3. `packages/domain/src/__tests__/session-manager.test.ts` — TDD tests

**Files to Modify:**
1. `packages/database/src/schema.ts` — Add sessions and messages tables
2. `apps/api/src/handlers/assessment.ts` — Add session HTTP handlers

**Database Migration:**
```bash
# Generate migration from schema changes
pnpm -C packages/database drizzle-kit generate:pg

# Apply migrations to local PostgreSQL
pnpm -C packages/database drizzle-kit push
```

---

## TDD Workflow

### Red Phase: Write Failing Tests First

```typescript
// packages/domain/src/__tests__/session-manager.test.ts

import { describe, it, expect, beforeEach } from "vitest"
import { Effect } from "effect"
import { mockDatabase, createTestSession } from "@workspace/domain/test-utils"

describe("SessionManager", () => {
  let db: ReturnType<typeof mockDatabase>

  beforeEach(() => {
    db = mockDatabase()
  })

  describe("Session Creation", () => {
    it("should create session with unique ID", async () => {
      const sessionId = `session_${Date.now()}_abc123`
      expect(sessionId).toMatch(/^session_/)
    })

    it("should set baseline precision", async () => {
      const session = createTestSession()
      expect(session.precision.openness).toBe(0.5)
      expect(session.precision.conscientiousness).toBe(0.5)
    })
  })

  describe("Message Persistence", () => {
    it("should save message and maintain order", async () => {
      const session = createTestSession()
      await Effect.runPromise(db.sessions.insert(session))

      const msg1 = {
        id: "msg_1",
        sessionId: session.id,
        role: "assistant" as const,
        content: "Hi there",
        createdAt: new Date(Date.now() - 1000),
      }
      const msg2 = {
        id: "msg_2",
        sessionId: session.id,
        role: "user" as const,
        content: "Hello",
        createdAt: new Date(),
      }

      await Effect.runPromise(db.messages.insert(msg1))
      await Effect.runPromise(db.messages.insert(msg2))

      const messages = await Effect.runPromise(
        db.messages.findBySessionId(session.id)
      )

      expect(messages[0].content).toBe("Hi there")
      expect(messages[1].content).toBe("Hello")
    })
  })

  describe("Session Resumption", () => {
    it("should load full history in <1 second", async () => {
      const session = createTestSession()
      await Effect.runPromise(db.sessions.insert(session))

      // Insert 50 messages
      for (let i = 0; i < 50; i++) {
        await Effect.runPromise(
          db.messages.insert({
            id: `msg_${i}`,
            sessionId: session.id,
            role: i % 2 === 0 ? "user" : "assistant",
            content: `Message ${i}`,
            createdAt: new Date(Date.now() - (50 - i) * 1000),
          })
        )
      }

      const start = Date.now()
      const messages = await Effect.runPromise(
        db.messages.findBySessionId(session.id)
      )
      const elapsed = Date.now() - start

      expect(messages).toHaveLength(50)
      expect(elapsed).toBeLessThan(1000)
    })
  })
})
```

### Green Phase: Implement to Pass Tests

Implement handlers in `apps/api/src/handlers/assessment.ts` following the pattern above. When tests pass, move to refactor phase.

### Refactor Phase: Improve While Tests Stay Green

- Extract common error handling patterns
- Add comprehensive logging
- Optimize database queries
- Add JSDoc comments

---

## Success Metrics

**Acceptance Checklist:**
- [ ] Write failing tests for session creation, persistence, resume (red phase)
- [ ] Implement SessionManager handlers (green phase)
- [ ] All tests pass: `pnpm test session-manager.test.ts`
- [ ] 100% coverage for SessionManager: `pnpm test:coverage`
- [ ] Resume loads full history in <1 second
- [ ] No message loss on pause/resume cycle
- [ ] Error handling: 404 for missing session, 400 for invalid state
- [ ] No regressions: `pnpm test` passes completely
- [ ] JSDoc comments on all public methods
- [ ] Database migration applied: `pnpm drizzle-kit push`

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

**Ready for Development** ✅  
Complete context provided. All dependencies met. Proceed with TDD workflow.
