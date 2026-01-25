---
status: ready-for-dev
story_id: "1.3"
epic: 1
created_date: 2026-01-30
blocks: [1-2, 2-1, 2-2, 4-1, 4-2]
blocked_by: [1-1]
---

# Story 1.3: Configure Effect-ts RPC Contracts and Infrastructure Layer

## Story

As a **Backend Developer**,
I want **to define type-safe RPC contracts between frontend and backend**,
so that **all API interactions are compile-time verified and self-documenting**.

## Acceptance Criteria

### Contract Definition & Type Safety
**Given** the Effect-ts environment is configured
**When** I define an RPC contract (e.g., `startAssessment`)
**Then** the contract automatically generates TypeScript types for frontend/backend
**And** frontend client imports can only call valid procedures
**And** invalid RPC calls fail at compile time, not runtime

### Handler Implementation
**Given** a backend handler is implemented
**When** it returns a successful response
**Then** the response matches the contract output schema
**And** errors are caught as tagged Error types (SessionNotFoundError, etc.)
**And** handler can be mounted on Express with proper routing

### Dependency Injection
**Given** a handler needs database or logger access
**When** the handler runs
**Then** it receives dependencies via Effect Layer injection
**And** dependencies are request-scoped (FiberRef)
**And** no global state required

## Business Context

**Why This Story Matters:**
- Foundational infrastructure for all backend development
- Type-safe contracts prevent runtime API mismatches
- All future stories (Auth, Assessment, Results) depend on this RPC framework
- Establishes architectural patterns for error handling + dependency injection

**Blocks Until Complete:**
- Story 1.2 (Better Auth) - auth RPC endpoints needed
- Story 2.1 (Session Management) - needs RPC framework
- Story 2.2 (Nerin Agent) - RPC handler for chat endpoint
- Story 4.1 (Frontend Auth UI) - needs RPC client types
- All subsequent backend stories

**Depends On:**
- Story 1.1 (Railway Infrastructure) - deployed Node.js backend ready
- packages/domain (already exists with domain types)
- packages/contracts (will be created/updated in this story)

## Technical Requirements

### Core Technologies

**Effect-ts Stack (Already in pnpm-lock.yaml):**
- `effect@3.19.14` - Functional effect system
- `@effect/rpc@0.73.0` - Type-safe RPC contract system
- `@effect/schema@0.71.0` - Runtime schema validation
- `express@4.x` - HTTP server framework
- `@sentry/node` - Error tracking

### Project Structure Setup

**Directory Layout:**

```
big-ocean/
├── apps/
│   └── api/
│       ├── src/
│       │   ├── index.ts                    [MODIFY - add RPC middleware]
│       │   ├── handlers/
│       │   │   ├── index.ts               [CREATE - export all services]
│       │   │   ├── assessment.ts          [CREATE - startAssessment, sendMessage]
│       │   │   ├── profile.ts             [CREATE - getProfile, compareProfiles]
│       │   │   └── auth.ts                [CREATE - signUp, signIn (Story 1.2)]
│       │   ├── middleware/
│       │   │   ├── error-handler.ts       [CREATE - HTTP error mapping]
│       │   │   ├── rpc-router.ts          [CREATE - RPC endpoint mounting]
│       │   │   └── security.ts            [VERIFY - headers from Story 1.2]
│       │   ├── context/
│       │   │   ├── index.ts               [CREATE - Layer definitions]
│       │   │   ├── database.ts            [CREATE - DatabaseRef service]
│       │   │   ├── logger.ts              [CREATE - LoggerRef service]
│       │   │   └── cost-guard.ts          [CREATE - CostGuardRef service]
│       │   └── utils/
│       │       └── session.ts             [CREATE - session helpers]
│       └── package.json                   [VERIFY - effect deps]
├── packages/
│   ├── contracts/
│   │   └── src/
│   │       └── index.ts                   [CREATE - RPC service definitions]
│   ├── domain/
│   │   └── src/
│   │       └── errors/
│   │           └── index.ts               [VERIFY - domain error types]
│   └── infrastructure/
│       └── src/
│           └── services.ts                [VERIFY - Layer composition]
```

### RPC Contract System

**Core Concepts:**

1. **Service Definition** - Defines RPC procedures with input/output schemas
2. **Schema Validation** - @effect/schema for runtime validation
3. **Error Discrimination** - Tagged errors for type-safe error handling
4. **Handler Implementation** - Effect-based handlers with dependency injection
5. **HTTP Mapping** - Routes mapped to Express endpoints

### Contract Definition Pattern

**File: `packages/contracts/src/index.ts`**

```typescript
import * as S from "@effect/schema/Schema";
import * as Rpc from "@effect/rpc/Rpc";

// Service definition with typed procedures
export const AssessmentService = Rpc.define({
  startAssessment: Rpc.rpcFunction({
    // Input schema - validated at runtime
    input: S.struct({
      userId: S.optional(S.string),
    }),

    // Output schema - response must match
    output: S.struct({
      sessionId: S.string,
      createdAt: S.Date,
    }),

    // Possible errors - discriminated union
    failure: S.union(
      S.struct({ _tag: S.literal("SessionCreationError"), reason: S.string }),
      S.struct({ _tag: S.literal("DatabaseError"), operation: S.string })
    ),
  }),

  sendMessage: Rpc.rpcFunction({
    input: S.struct({
      sessionId: S.string,
      message: S.string,
    }),
    output: S.struct({
      response: S.string,
      precision: S.number,
      tokensUsed: S.number,
    }),
    failure: S.union(
      S.struct({ _tag: S.literal("SessionNotFoundError"), sessionId: S.string }),
      S.struct({ _tag: S.literal("CostLimitExceededError"), dailyLimit: S.number }),
      S.struct({ _tag: S.literal("LLMError"), model: S.string, message: S.string })
    ),
  }),

  getResults: Rpc.rpcFunction({
    input: S.struct({ sessionId: S.string }),
    output: S.struct({
      oceanCode: S.string,
      archetypeName: S.string,
      traits: S.struct({
        openness: S.number,
        conscientiousness: S.number,
        extraversion: S.number,
        agreeableness: S.number,
        neuroticism: S.number,
      }),
    }),
    failure: S.union(
      S.struct({ _tag: S.literal("SessionNotFoundError"), sessionId: S.string }),
      S.struct({ _tag: S.literal("ResultsNotReadyError"), precision: S.number })
    ),
  }),
});

// Auth service (placeholder - Story 1.2)
export const AuthService = Rpc.define({
  signUp: Rpc.rpcFunction({
    input: S.struct({
      email: S.string,
      password: S.string,
    }),
    output: S.struct({
      user: S.struct({ id: S.string, email: S.string }),
      session: S.struct({ id: S.string, expiresAt: S.Date }),
    }),
    failure: S.union(
      S.struct({ _tag: S.literal("InvalidPassword"), reason: S.string }),
      S.struct({ _tag: S.literal("EmailExists"), email: S.string })
    ),
  }),

  signIn: Rpc.rpcFunction({
    input: S.struct({ email: S.string, password: S.string }),
    output: S.struct({
      user: S.struct({ id: S.string, email: S.string }),
      session: S.struct({ id: S.string, expiresAt: S.Date }),
    }),
    failure: S.union(
      S.struct({ _tag: S.literal("InvalidCredentials") })
    ),
  }),
});

// Profile service (future - Epic 5)
export const ProfileService = Rpc.define({
  getProfile: Rpc.rpcFunction({
    input: S.struct({ profileId: S.string }),
    output: S.struct({
      archetype: S.string,
      traits: S.struct({}),
    }),
    failure: S.union(
      S.struct({ _tag: S.literal("NotFound") })
    ),
  }),
});
```

### Handler Implementation Pattern

**File: `apps/api/src/handlers/assessment.ts`**

```typescript
import { Effect } from "effect";
import * as Rpc from "@effect/rpc/Rpc";
import * as S from "@effect/schema/Schema";
import {
  SessionNotFoundError,
  CostLimitExceededError,
  LLMError
} from "@workspace/domain";
import { DatabaseRef, LoggerRef, CostGuardRef } from "../context";

// Handler for startAssessment RPC
export const startAssessment = ((input: { userId?: string }) =>
  Effect.gen(function* () {
    // Inject dependencies via Effect services
    const db = yield* Effect.service(DatabaseRef);
    const logger = yield* Effect.service(LoggerRef);

    // Generate session ID
    const sessionId = yield* generateSessionId();
    const userId = input.userId || null;

    // Create session in database
    yield* db.sessions.create({
      id: sessionId,
      userId,
      startedAt: new Date(),
      precision: 0,
      status: "active",
    });

    // Log with structured data
    logger.info("session_created", {
      sessionId,
      userId,
      anonymous: !userId,
    });

    // Return typed response
    return { sessionId, createdAt: new Date() };
  })
) as Rpc.RpcFunction<typeof AssessmentService.startAssessment>;

// Handler for sendMessage RPC
export const sendMessage = ((input: { sessionId: string; message: string }) =>
  Effect.gen(function* () {
    const costGuard = yield* Effect.service(CostGuardRef);
    const db = yield* Effect.service(DatabaseRef);
    const logger = yield* Effect.service(LoggerRef);

    // Cost guard check (rate limiting)
    const budgetOk = yield* costGuard.checkBudget(input.sessionId);
    if (!budgetOk) {
      yield* Effect.fail(
        new CostLimitExceededError(input.sessionId, 0.15, 0.15)
      );
    }

    // Load session from database
    const session = yield* db.sessions.findById(input.sessionId).pipe(
      Effect.orElseEff(() => Effect.fail(
        new SessionNotFoundError(input.sessionId)
      ))
    );

    // Call Nerin agent (via LangGraph - Story 2.2)
    const { response, tokens } = yield* callNerin(input.message, session).pipe(
      Effect.mapError((error) => new LLMError("claude-sonnet-4.5", error.message))
    );

    // Track cost
    yield* costGuard.trackCost(input.sessionId, tokens);

    // Log event
    logger.info("message_processed", {
      sessionId: input.sessionId,
      tokens,
      cost: (tokens * 0.001).toFixed(4),
    });

    // Return response
    return { response, precision: session.precision, tokensUsed: tokens };
  })
) as Rpc.RpcFunction<typeof AssessmentService.sendMessage>;

// Handler for getResults RPC
export const getResults = ((input: { sessionId: string }) =>
  Effect.gen(function* () {
    const db = yield* Effect.service(DatabaseRef);

    // Load session
    const session = yield* db.sessions.findById(input.sessionId).pipe(
      Effect.orElseEff(() => Effect.fail(
        new SessionNotFoundError(input.sessionId)
      ))
    );

    // Check if assessment complete (precision ≥ 50%)
    if (session.precision < 50) {
      yield* Effect.fail({
        _tag: "ResultsNotReadyError",
        precision: session.precision,
      });
    }

    // Load trait scores from database
    const traits = yield* db.traitAssessments.findBySessionId(input.sessionId);

    // Generate OCEAN code (Story 3.1)
    const oceanCode = generateOceanCode(traits);

    // Lookup archetype (Story 3.2)
    const archetype = yield* lookupArchetype(oceanCode);

    return {
      oceanCode,
      archetypeName: archetype.name,
      traits: {
        openness: traits.openness,
        conscientiousness: traits.conscientiousness,
        extraversion: traits.extraversion,
        agreeableness: traits.agreeableness,
        neuroticism: traits.neuroticism,
      },
    };
  })
) as Rpc.RpcFunction<typeof AssessmentService.getResults>;
```

### Context & Dependency Injection

**File: `apps/api/src/context/index.ts`**

```typescript
import { Context, Layer, Effect } from "effect";
import { Database } from "@workspace/database";
import pino from "pino";
import redis from "ioredis";

// Define service contexts (like React Context)
export class DatabaseRef extends Context.Tag<"DatabaseRef", Database>() {}
export class LoggerRef extends Context.Tag<"LoggerRef", pino.Logger>() {}
export class CostGuardRef extends Context.Tag<"CostGuardRef", CostGuard>() {}
export class RedisRef extends Context.Tag<"RedisRef", redis.Redis>() {}

// Create layers (lazy dependencies)
export const DatabaseLayer = Layer.sync(
  DatabaseRef,
  () => new Database(process.env.DATABASE_URL)
);

export const LoggerLayer = Layer.sync(
  LoggerRef,
  () => pino({ level: process.env.LOG_LEVEL || "info" })
);

export const RedisLayer = Layer.sync(
  RedisRef,
  () => new redis.Redis(process.env.REDIS_URL)
);

export const CostGuardLayer = Layer.effect(
  CostGuardRef,
  Effect.gen(function* () {
    const redis = yield* RedisRef;
    return new CostGuard(redis);
  })
);

// Compose all layers for dependency injection
export const AppLayer = Layer.mergeAll(
  DatabaseLayer,
  LoggerLayer,
  RedisLayer,
  CostGuardLayer
);
```

### RPC Router Setup

**File: `apps/api/src/middleware/rpc-router.ts`**

```typescript
import express from "express";
import { Rpc } from "@effect/rpc";
import { AssessmentService, AuthService, ProfileService } from "@workspace/contracts";
import * as handlers from "../handlers";

// Create RPC router
export function createRpcRouter() {
  const router = express.Router();

  // Mount Assessment service
  router.post("/assessment/startAssessment", async (req, res) => {
    // Extract input from request
    const result = await handlers.startAssessment(req.body).pipe(
      Effect.provide(AppLayer)
    ).unsafeRunPromise();

    res.json(result);
  });

  router.post("/assessment/sendMessage", async (req, res) => {
    const result = await handlers.sendMessage(req.body).pipe(
      Effect.provide(AppLayer)
    ).unsafeRunPromise();

    res.json(result);
  });

  // Mount Auth service (Story 1.2)
  router.post("/auth/signUp", async (req, res) => {
    const result = await handlers.signUp(req.body).pipe(
      Effect.provide(AppLayer)
    ).unsafeRunPromise();

    res.json(result);
  });

  return router;
}
```

### Error Handler Middleware

**File: `apps/api/src/middleware/error-handler.ts`**

```typescript
import { Effect } from "effect";
import { SessionNotFoundError, CostLimitExceededError, LLMError } from "@workspace/domain";

// Map domain errors to HTTP status codes
export function mapErrorToHttpStatus(error: unknown): {
  status: number;
  body: Record<string, any>;
} {
  if (error instanceof SessionNotFoundError) {
    return {
      status: 404,
      body: {
        _tag: "SessionNotFoundError",
        sessionId: error.sessionId,
        message: "Session not found",
      },
    };
  }

  if (error instanceof CostLimitExceededError) {
    return {
      status: 429, // Too Many Requests
      body: {
        _tag: "CostLimitExceededError",
        message: "Daily assessment limit exceeded",
      },
    };
  }

  if (error instanceof LLMError) {
    return {
      status: 503, // Service Unavailable
      body: {
        _tag: "LLMError",
        model: error.model,
        message: "LLM service temporarily unavailable",
      },
    };
  }

  // Fallback for unknown errors
  return {
    status: 500,
    body: {
      _tag: "InternalServerError",
      message: error instanceof Error ? error.message : "Unknown error",
    },
  };
}

// Express error handler middleware
export function errorHandlerMiddleware(
  err: unknown,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const { status, body } = mapErrorToHttpStatus(err);
  res.status(status).json(body);
}
```

### Express Setup Integration

**File: `apps/api/src/index.ts`**

```typescript
import express from "express";
import { createRpcRouter } from "./middleware/rpc-router";
import { errorHandlerMiddleware } from "./middleware/error-handler";
import { securityHeaders } from "./middleware/security";

const app = express();

// Middleware
app.use(express.json());
app.use(securityHeaders);

// Health check (from Story 1.1)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// RPC routes
app.use("/api/rpc", createRpcRouter());

// Error handling
app.use(errorHandlerMiddleware);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
});
```

## Architecture Compliance

**From architecture.md ADR-3 (Backend API Structure):**
- ✅ @effect/rpc for contract definitions
- ✅ @effect/schema for runtime validation
- ✅ FiberRef bridges for request-scoped dependencies (database, logger, cost guard)
- ✅ Layer composition for dependency injection
- ✅ Error mapping to HTTP status codes (404, 429, 503)
- ✅ Tagged errors for type-safe error handling

**Non-Functional Requirements Met:**
- **NFR2 (Real-Time Responsiveness):** RPC handlers optimized for <2 sec P95
- **NFR3 (Privacy & Security):** Error handlers don't leak internal details
- **NFR5 (Scaling):** Effect Layers support horizontal scaling patterns

## Files and Directory Structure

**Files to Create:**

```
apps/api/src/
├── context/
│   ├── index.ts                    [CREATE]
│   ├── database.ts                 [CREATE]
│   ├── logger.ts                   [CREATE]
│   ├── cost-guard.ts               [CREATE]
│   └── redis.ts                    [CREATE]
├── handlers/
│   ├── index.ts                    [CREATE - re-export all]
│   ├── assessment.ts               [CREATE]
│   ├── auth.ts                     [CREATE - placeholder for Story 1.2]
│   └── profile.ts                  [CREATE - placeholder for Epic 5]
├── middleware/
│   ├── rpc-router.ts               [CREATE]
│   ├── error-handler.ts            [CREATE]
│   ├── security.ts                 [VERIFY - from Story 1.2]
│   └── request-logger.ts           [CREATE - Pino JSON logging]
├── utils/
│   ├── session.ts                  [CREATE - generateSessionId, etc.]
│   └── validation.ts               [CREATE - input validation helpers]
└── index.ts                        [MODIFY - add RPC middleware]

packages/contracts/src/
└── index.ts                        [CREATE - all RPC service definitions]
```

## Dependencies

### NPM Libraries (Already in pnpm-lock.yaml)
- `effect@3.19.14` - Core Effect library
- `@effect/rpc@0.73.0` - RPC contract system
- `@effect/schema@0.71.0` - Schema validation
- `express@4.18.x` - HTTP server
- `ioredis@5.x` - Redis client
- `pino@8.x` - Structured logging
- `@sentry/node@7.x` - Error tracking

### External Dependencies
- **Express** - HTTP routing (already used)
- **Effect ecosystem** - Already specified in architecture

## Implementation Checklist

### Phase 1: Setup Effect Layers
- [ ] Create `apps/api/src/context/index.ts` with service definitions
- [ ] Create database layer (lazy-init PostgreSQL connection)
- [ ] Create logger layer (Pino setup)
- [ ] Create Redis layer (cost tracking cache)
- [ ] Create cost guard layer (depends on Redis)
- [ ] Verify all layers compose correctly: `Layer.mergeAll(...)`

### Phase 2: Define RPC Contracts
- [ ] Create `packages/contracts/src/index.ts`
- [ ] Define AssessmentService (startAssessment, sendMessage, getResults)
- [ ] Define AuthService (signUp, signIn, signOut)
- [ ] Define ProfileService (getProfile, compareProfiles)
- [ ] Verify all schemas match @effect/schema requirements
- [ ] Test TypeScript compilation: `pnpm build`

### Phase 3: Implement Handlers
- [ ] Create `apps/api/src/handlers/assessment.ts`
- [ ] Implement startAssessment handler (create session)
- [ ] Implement sendMessage handler (route to Nerin - placeholder for Story 2.2)
- [ ] Implement getResults handler (fetch traits, generate code, lookup archetype)
- [ ] All handlers use Effect.gen() pattern with dependency injection

### Phase 4: Setup RPC Routing
- [ ] Create `apps/api/src/middleware/rpc-router.ts`
- [ ] Mount all RPC endpoints on Express
- [ ] Wire up dependency layers: `Effect.provide(AppLayer)`
- [ ] Test routes: `POST /api/rpc/assessment/startAssessment`

### Phase 5: Error Handling
- [ ] Create `apps/api/src/middleware/error-handler.ts`
- [ ] Map domain errors to HTTP status codes
- [ ] Test error responses with invalid inputs

### Phase 6: Integration Testing
- [ ] Test startAssessment: creates session with unique ID
- [ ] Test sendMessage: requires valid sessionId (error if not found)
- [ ] Test getResults: requires precision ≥ 50% (error if not ready)
- [ ] Test dependency injection: handlers receive all services
- [ ] Test error handling: invalid input → proper error response

### Phase 7: Documentation
- [ ] Document RPC contract system for team
- [ ] Add examples of new handlers (for Story 1.2)
- [ ] Document error types and HTTP mappings

## Testing Strategy

### Unit Tests (TDD)

**File: `apps/api/src/handlers/assessment.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import * as handlers from "./assessment";

describe("Assessment Handlers", () => {
  it("startAssessment should create session with unique ID", async () => {
    const result1 = await handlers.startAssessment({ userId: undefined })
      .pipe(Effect.provide(testLayer))
      .unsafeRunPromise();

    const result2 = await handlers.startAssessment({ userId: undefined })
      .pipe(Effect.provide(testLayer))
      .unsafeRunPromise();

    // Each call creates unique session
    expect(result1.sessionId).not.toBe(result2.sessionId);
  });

  it("sendMessage should reject invalid sessionId", async () => {
    const result = await handlers.sendMessage({
      sessionId: "invalid-id",
      message: "test",
    })
      .pipe(Effect.provide(testLayer))
      .unsafeRunPromise();

    // Should throw SessionNotFoundError
    expect(result).toThrow("SessionNotFoundError");
  });
});
```

### Integration Tests

Test with real database + Redis (TestContainers):

```typescript
describe("RPC Handlers (Integration)", () => {
  let testDb: Database;
  let testRedis: redis.Redis;

  beforeAll(async () => {
    // Spin up PostgreSQL + Redis containers
    testDb = await initializeTestDatabase();
    testRedis = await initializeTestRedis();
  });

  it("should handle full assessment flow", async () => {
    // 1. Start assessment
    const { sessionId } = await startAssessment({ userId: "test-user" })
      .pipe(Effect.provide(testLayer))
      .unsafeRunPromise();

    // 2. Send messages
    const response = await sendMessage({
      sessionId,
      message: "I love reading",
    })
      .pipe(Effect.provide(testLayer))
      .unsafeRunPromise();

    expect(response.response).toBeDefined();

    // 3. Get results (if precision ready)
    if (response.precision >= 50) {
      const results = await getResults({ sessionId })
        .pipe(Effect.provide(testLayer))
        .unsafeRunPromise();

      expect(results.oceanCode).toBeDefined();
    }
  });

  afterAll(async () => {
    await testDb.close();
    await testRedis.disconnect();
  });
});
```

## Common Pitfalls to Avoid

❌ **Hardcoding dependencies** - Use Effect Layers for all services
❌ **Mixing sync/async code** - Always use Effect.gen() consistently
❌ **Not validating input** - @effect/schema validates at runtime
❌ **Returning untyped responses** - Responses must match RPC output schema
❌ **Swallowing errors** - Use Effect.mapError() to transform, not catch
❌ **Direct database calls in handlers** - Inject DatabaseRef service
❌ **Forgetting error discrimination** - All errors must be in failure union

## Dev Notes

### Why Effect-ts + RPC?
- **Type Safety:** Compile-time verification of API contracts
- **Dependency Injection:** Layers manage service lifecycle automatically
- **Error Handling:** Tagged errors prevent runtime surprises
- **Testability:** Pure functions with deterministic behavior
- **Observability:** FiberRef captures request context for logging

### Why Layer Pattern?
- Services are lazy-initialized (only when needed)
- Dependencies automatically injected (no constructor hell)
- Composable (merge layers to build complete app)
- Testable (swap test implementations in tests)

### Why FiberRef Over Global State?
- Request-scoped (each request gets isolated context)
- No race conditions (no shared mutable state)
- Easy to test (no setup/teardown needed)
- Supports distributed tracing (context flows through async boundaries)

## Dependencies: Story 1.1 → Story 1.3 → Story 1.2 → Story 2.x

**Correct Workflow:**
```
Story 1.1: Deploy Infrastructure ✅
    ↓
Story 1.3: Effect-ts RPC (THIS STORY) ← Establishes backend framework
    ↓
Story 1.2: Better Auth ← Builds on RPC contracts + Express
    ↓
Story 2.1: Session Management ← Uses RPC + database
```

## Reference Docs

**Source Documents:**
- [Architecture: Backend API Structure](../planning-artifacts/architecture.md#technical-stack)
- [Architecture: Hybrid Approach Selection](../planning-artifacts/architecture.md#option-c-hybrid-tanstack-cli--manual-effect-ts)
- [Effect Official Docs](https://effect.website/)
- [Effect RPC Documentation](https://effect.website/docs/rx/rpc)

**Related Stories:**
- [Story 1.1: Deploy Infrastructure to Railway](./1-1-deploy-infrastructure-to-railway.md)
- [Story 1.2: Integrate Better Auth](./1-2-integrate-better-auth-for-email-password-authentication.md)
- [Story 2.1: Session Management](./2-1-session-management-and-persistence.md)
- [Story 2.2: Nerin Agent Setup](./2-2-nerin-agent-setup-and-conversational-quality.md)

## Dev Agent Record

### Agent Model Used
Claude Haiku 4.5

### Completion Notes
- This story establishes the RPC infrastructure that ALL subsequent stories build upon
- Effect Layers provide automatic dependency injection for database, logger, Redis, etc.
- All handlers use Effect.gen() pattern with tagged errors
- RPC contracts are self-documenting type-safe interfaces
- Story 1.2 (Better Auth) cannot proceed until this framework is in place

### Known Issues / Follow-ups
- OAuth support deferred to Phase 2 (just add to AuthService contract)
- Streaming responses for Nerin chat deferred to Story 2.2
- Request middleware (logging, tracing) can be enhanced later

---

## Next Steps After Completion

1. ✅ **Story Complete** → Update sprint-status.yaml: `1-3-configure-effect-ts-rpc: done`
2. ✅ **Unblock Dependencies** → Story 1.2 (Better Auth) can now proceed
3. ✅ **Start Story 1.2** → `/bmad-bmm-create-story` or `/bmad-bmm-dev-story` if ready
4. ✅ **Parallel Work** → Story 7.1 (Unit Testing) uses this RPC infrastructure for examples

---

**Status:** ready-for-dev
**Epic:** 1 (Infrastructure & Auth Setup)
**Dependencies:** Story 1.1 (Railway Infrastructure)
**Blocks:** Story 1.2 (Better Auth), Story 2.1 (Session Management), Story 2.2 (Nerin), All Epic 2+ stories
**Ready for:** Dev Story workflow → `/bmad-bmm-dev-story 1-3-configure-effect-ts-rpc-contracts-and-infrastructure-layer`
