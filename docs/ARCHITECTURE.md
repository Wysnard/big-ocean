# Architecture & Key Patterns

## Hexagonal Architecture (Ports & Adapters)

The codebase follows **hexagonal architecture** with clear layer separation and dependency inversion using Effect-ts Context.Tag pattern.

**Architecture Layers:**

```
Contracts ─→ Handlers ─→ Use-Cases ─→ Domain (interfaces)
                                         ↑
                                  Infrastructure (injected)
```

**Layer Responsibilities:**

1. **Contracts** (`packages/contracts`): HTTP API definitions shared between frontend and backend
2. **Handlers** (`apps/api/src/handlers`): Thin HTTP adapters (controllers/presenters) - no business logic
3. **Use-Cases** (`apps/api/src/use-cases`): Pure business logic - **main unit test target**
4. **Domain** (`packages/domain`): Repository interfaces (Context.Tag), entities, types
5. **Infrastructure** (`packages/infrastructure`): Repository implementations (Drizzle, Pino, etc.)

**Hard Rule:** Handlers extract request data and call use-cases. No conditional logic, validation, or orchestration in handlers. All business logic belongs in use-cases.

**Quick Discovery Pattern:**

- Need a repository interface? Check `packages/domain/src/repositories/{name}.repository.ts` - this is the source of truth
- Once you have the interface, find the implementation (Drizzle, LangGraph, etc.) in `packages/infrastructure/src/repositories/`
- Test implementations live in `*.test.ts` files next to the production implementations

**Key Benefits:**

- **Testability**: Use-cases tested in isolation with test implementations
- **Flexibility**: Swap implementations without changing business logic
- **Clarity**: Each layer has single responsibility
- **Effect-ts native**: Context.Tag and Layer system for DI

For complete architecture details, see `_bmad-output/planning-artifacts/architecture.md` (ADR-6).

## Workspace Dependencies

Packages use `workspace:*` and `workspace:^` to reference other packages in the monorepo. This ensures they're always in sync with local versions.

**Dependency Graph:**

```
apps/front     → contracts, domain, ui
apps/api       → contracts, domain, infrastructure
contracts      → domain (schema imports)
infrastructure → domain (DB schema lives here)
ui             → (independent component library)
```

## Domain-Driven Design

The `@workspace/domain` package encapsulates core business logic:

**Domain Package Structure:**

```
packages/domain/src/
├── schemas/       # Effect Schema definitions for domain types
├── errors/        # Tagged Error types
├── types/         # Branded types (userId, sessionId, etc.)
├── constants/     # Domain constants (trait names, facets, etc.)
└── repositories/  # Context.Tag interfaces (ports)
```

**Example Domain Export:**

```typescript
// packages/domain/src/schemas/index.ts
import { Schema as S } from "effect";

export const UserProfileSchema = S.Struct({
  id: S.String,
  name: S.String,
  traits: PersonalityTraitsSchema,
});

export type UserProfile = typeof UserProfileSchema.Type;
```

## Error Architecture & Location Rules

**CRITICAL RULE: Errors MUST be defined in the correct package based on their purpose.**

### Error Location Rules

**1. HTTP-Facing Errors** → `packages/contracts/src/errors.ts`

All errors that are returned via HTTP API MUST be defined in contracts using `Schema.TaggedError`:

```typescript
// ✅ CORRECT: HTTP error in contracts
export class RateLimitExceeded extends S.TaggedError<RateLimitExceeded>()("RateLimitExceeded", {
  userId: S.String,
  resetAt: S.DateTimeUtc,
  message: S.String,
}) {}
```

**Why?** These errors are part of the API contract - they're JSON-serialized and sent to clients.

**2. Infrastructure-Specific Errors** → Co-located with repository interfaces in `packages/domain/src/repositories/`

Errors that represent infrastructure failures (Redis, database, external APIs) are defined alongside their repository interfaces:

```typescript
// ✅ CORRECT: Infrastructure error co-located with interface
// packages/domain/src/repositories/redis.repository.ts
export class RedisOperationError extends Error {
  readonly _tag = "RedisOperationError";
  constructor(public readonly message: string, public readonly operation: string) {
    super(message);
    this.name = "RedisOperationError";
  }
}
```

**Why?** These are internal errors that get mapped to contract errors in handlers.

**3. Domain Logic Errors** → Use contract errors directly

Use-cases should throw contract errors directly when the error will be returned to the client:

```typescript
// ✅ CORRECT: Use-case throws contract error
import { RateLimitExceeded } from "@workspace/contracts";

export const startAssessment = (input: StartAssessmentInput) =>
  Effect.gen(function* () {
    if (!canStart) {
      return yield* Effect.fail(
        new RateLimitExceeded({
          userId,
          message: "You can start a new assessment tomorrow",
          resetAt: DateTime.unsafeMake(tomorrow.getTime()),
        }),
      );
    }
  });
```

### Error Propagation Rule

**Use-cases and handlers must NOT remap errors.** Errors thrown at the lowest appropriate layer (repository, domain service) propagate unchanged through the use-case and handler to the HTTP contract, where `.addError()` declarations handle serialization and status code mapping automatically.

```typescript
// ✅ CORRECT: Handler lets errors propagate
.handle("sendMessage", ({ payload }) =>
  Effect.gen(function* () {
    return yield* sendMessage({ sessionId: payload.sessionId, message: payload.message });
  }),
)

// ❌ WRONG: Handler remaps domain error to a different error
.handle("sendMessage", ({ payload }) =>
  Effect.gen(function* () {
    return yield* sendMessage({ ... }).pipe(
      Effect.catchTag("AgentInvocationError", (e) =>
        Effect.fail(new NerinError({ message: e.message })),  // ❌ Don't remap
      ),
    );
  }),
)
```

**Allowed exception:** `catchTag` for fail-open resilience — catching infrastructure errors (e.g., `RedisOperationError`) to allow degraded operation rather than failing the request:

```typescript
// ✅ OK: Fail-open — catch infrastructure error, log, continue
yield* costGuard.checkDailyBudget(costKey, limit).pipe(
  Effect.catchTag("RedisOperationError", (err) =>
    Effect.sync(() => {
      logger.error("Redis unavailable for budget check, allowing message", { error: err.message });
    }),
  ),
);
```

### Common Mistakes to Avoid

❌ **WRONG: Duplicate error definitions**
```typescript
// packages/domain/src/errors/rate-limit.errors.ts
export class RateLimitExceeded extends Error { ... } // ❌ Plain Error, wrong location

// packages/contracts/src/errors.ts
export class RateLimitExceeded extends S.TaggedError { ... } // Already exists!
```

❌ **WRONG: Use-case imports domain error that should be contract error**
```typescript
// ❌ Importing from wrong package
import { RateLimitExceeded } from "@workspace/domain";

// ✅ Should import from contracts
import { RateLimitExceeded } from "@workspace/contracts";
```

### Package Dependency Rules

- **Contracts**: No dependencies on domain (defines API surface)
- **Domain**: Depends on contracts (re-exports HTTP errors for convenience)
- **Infrastructure**: Depends on domain (implements interfaces)
- **Use-Cases**: Import from contracts for HTTP errors, domain for infrastructure errors

### Verification Checklist

When adding a new error, ask:

1. **Will this error be returned via HTTP?**
   - YES → Define in `contracts/src/errors.ts` as `Schema.TaggedError`
   - NO → Continue to question 2

2. **Is this an infrastructure/external system failure?**
   - YES → Define in `domain/src/repositories/{service}.repository.ts` as plain `Error`
   - NO → Re-evaluate if it's truly a domain error or should be in contracts

3. **Does the error need JSON serialization?**
   - YES → Must be `Schema.TaggedError` in contracts
   - NO → Can be plain `Error` in domain

## Effect/Platform HTTP Contracts

The `@workspace/contracts` package defines type-safe HTTP API contracts using @effect/platform and @effect/schema following the official effect-worker-mono pattern.

<details>
<summary><b>HTTP Contract Implementation Example</b></summary>

**HTTP Contract Structure** (in `packages/contracts/src/http/groups/assessment.ts`):

```typescript
import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";

// Request/Response schemas
export const StartAssessmentRequestSchema = S.Struct({
  userId: S.optional(S.String),
});

export const StartAssessmentResponseSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.DateTimeUtc,
});

export const SendMessageRequestSchema = S.Struct({
  sessionId: S.String,
  message: S.String,
});

export const SendMessageResponseSchema = S.Struct({
  response: S.String,
  precision: S.Struct({
    openness: S.Number,
    conscientiousness: S.Number,
    extraversion: S.Number,
    agreeableness: S.Number,
    neuroticism: S.Number,
  }),
});

// HTTP API Group combines endpoints
export const AssessmentGroup = HttpApiGroup.make("assessment")
  .add(
    HttpApiEndpoint.post("start", "/start")
      .addSuccess(StartAssessmentResponseSchema)
      .setPayload(StartAssessmentRequestSchema)
  )
  .add(
    HttpApiEndpoint.post("sendMessage", "/message")
      .addSuccess(SendMessageResponseSchema)
      .setPayload(SendMessageRequestSchema)
  )
  .prefix("/assessment");
```

**Handler Implementation** (in `apps/api/src/handlers/assessment.ts`):

```typescript
import { HttpApiBuilder } from "@effect/platform";
import { DateTime, Effect } from "effect";
import { BigOceanApi } from "@workspace/contracts";
import { LoggerService } from "../services/logger.js";

// Handlers use HttpApiBuilder.group pattern
export const AssessmentGroupLive = HttpApiBuilder.group(
  BigOceanApi,
  "assessment",
  (handlers) =>
    Effect.gen(function* () {
      return handlers
        .handle("start", ({ payload }) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService;

            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const createdAt = DateTime.unsafeMake(Date.now());

            logger.info("Assessment session started", {
              sessionId,
              userId: payload.userId,
            });

            return { sessionId, createdAt };
          })
        )
        .handle("sendMessage", ({ payload }) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService;

            logger.info("Message received", {
              sessionId: payload.sessionId,
              messageLength: payload.message.length,
            });

            // Placeholder response (real Nerin logic in Epic 2)
            return {
              response: "Thank you for sharing that...",
              precision: {
                openness: 0.5,
                conscientiousness: 0.4,
                extraversion: 0.6,
                agreeableness: 0.7,
                neuroticism: 0.3,
              },
            };
          })
        );
    })
);
```

**Server Setup** (in `apps/api/src/index.ts`):

```typescript
import { Effect, Layer } from "effect";
import { HttpApiBuilder, HttpMiddleware } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { createServer } from "node:http";
import { BigOceanApi } from "@workspace/contracts";
import { HealthGroupLive } from "./handlers/health.js";
import { AssessmentGroupLive } from "./handlers/assessment.js";
import { LoggerServiceLive } from "./services/logger.js";
import { betterAuthHandler } from "./middleware/better-auth.js";

// Merge all handler groups with services
const HttpGroupsLive = Layer.mergeAll(
  HealthGroupLive,
  AssessmentGroupLive,
  LoggerServiceLive
);

// Build API from contracts with handlers
const ApiLive = HttpApiBuilder.api(BigOceanApi).pipe(
  Layer.provide(HttpGroupsLive)
);

// Complete API with router and middleware
const ApiLayer = Layer.mergeAll(
  ApiLive,
  HttpApiBuilder.Router.Live,
  HttpApiBuilder.Middleware.layer
);

// Hybrid server: Better Auth (node:http) → Effect (remaining routes)
const createCustomServer = () => {
  const server = createServer();
  let effectHandler: any = null;

  server.on("newListener", (event, listener) => {
    if (event === "request") {
      effectHandler = listener;
      server.removeListener("request", listener as any);
    }
  });

  server.on("request", async (req, res) => {
    await betterAuthHandler(req, res);
    if (!res.writableEnded && effectHandler) {
      effectHandler(req, res);
    }
  });

  return server;
};

// HTTP Server with Better Auth integration
const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(ApiLayer),
  Layer.provide(NodeHttpServer.layer(createCustomServer, { port: 4000 })),
  Layer.provide(LoggerServiceLive)
);

// Launch server
NodeRuntime.runMain(Layer.launch(HttpLive));
```

</details>

## Multi-Agent System (LangGraph)

The backend uses LangGraph to orchestrate multiple specialized agents via the **Orchestrator Repository** (Story 2.4).

**Agent Architecture (Story 2.11: Async Analyzer with Offset Steering):**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Conversation Graph (SYNCHRONOUS — blocks HTTP response)              │
│                                                                      │
│ 1. BUDGET CHECK - throws BudgetPausedError if exceeded              │
│ 2. STEERING (offset msgs 4,7,10...) - read evidence, compute hint  │
│    OR use cached hint from checkpointer (msgs 2,3,5,6,8,9...)      │
│ 3. NERIN - always runs with steeringHint                            │
│ 4. RETURN { response } immediately                                   │
└────────────────┬─────────────────────────────────────────────────────┘
                 │ response returned to client (~2-3s)
                 │
                 │ if (messageCount % 3 === 0):
                 │   Effect.forkDaemon ──────────────────────┐
                 │                                            │
                 ▼                                            ▼
        HTTP Response                            ┌────────────────────┐
        { response: string }                     │ Analysis Pipeline  │
                                                 │ (ASYNC — daemon)   │
                                                 │                    │
                                                 │ Analyzer           │
                                                 │ - Extract evidence │
                                                 │ - 30 facets        │
                                                 │ - Save to DB       │
                                                 │       ↓            │
                                                 │ Scorer             │
                                                 │ - Aggregate scores │
                                                 │ - Derive traits    │
                                                 │ - Save to state    │
                                                 └────────────────────┘

Message Cadence (3-message cycle, offset by 1):
  [N % 3 === 0] BATCH  → nerin (cached) → forkDaemon(analyzer + scorer)
  [N % 3 === 1] STEER  → read evidence → fresh steering → nerin
  [N % 3 === 2] COAST  → nerin (cached steering)
  Exception: messages 1-3 → cold start, no steering
```

**Orchestrator Repository Interface:**

```typescript
// packages/domain/src/repositories/orchestrator.repository.ts
export class OrchestratorRepository extends Context.Tag("OrchestratorRepository")<
  OrchestratorRepository,
  {
    readonly processMessage: (
      input: ProcessMessageInput,
    ) => Effect.Effect<ProcessMessageOutput, OrchestrationError | BudgetPausedError, never>;
  }
>() {}
```

**Key Design Decisions:**

1. **Single-Target Steering** - Pure outlier detection (`confidence < mean - stddev`) rather than arbitrary thresholds
2. **Budget-First Pause** - Assessment pauses gracefully rather than degrading quality
3. **Async Batch Processing (Story 2.11)** - Analyzer fires as `Effect.forkDaemon` every 3rd message; scores computed on-demand from evidence via pure functions. Nerin response returns immediately without waiting for analysis.
4. **Offset Steering (Story 2.11)** - Steering recalculates at messages 4, 7, 10... (one offset from analyzer at 3, 6, 9...). Guarantees fresh evidence data and reduces DB reads by ~70%.
5. **State Preservation** - `BudgetPausedError` includes `resumeAfter` timestamp and `currentPrecision`
6. **Facet-Level Granularity** - Nerin operates on 30 facets, not 5 traits (traits are derived aggregates)

**Data Flow Architecture (Facet-Level Primitives):**

The system follows a **"primitives first, aggregates on demand"** pattern:

```typescript
// INPUT: Use-case provides facet-level data (30 facets)
orchestrator.processMessage({
  sessionId,
  userMessage,
  messageCount,
  precision,          // Single overall precision score (0-100)
  dailyCostUsed,
  facetScores,        // FacetScoresMap - 30 facets with score + confidence
});

// ROUTER: Calculates steering from facet outliers
const steeringTarget = getSteeringTarget(facetScores);
// Example: "orderliness" (confidence 0.2, below mean - stddev)

const steeringHint = getSteeringHint(steeringTarget);
// Example: "Explore how they organize their space, time, or belongings"

// NERIN: Receives facet-level data for precise conversation steering
nerinAgent.invoke({
  sessionId,
  messages,
  facetScores,        // All 30 facets for context
  steeringHint,       // Natural language guidance toward weak facet
  // NO trait-level precision (deprecated pattern - was duplicated across all 5 traits)
});

// System prompt includes steering:
// "Current conversation focus:
//  Explore how they organize their space, time, or belongings
//  Naturally guide the conversation to explore this area..."

// SCORER: Transforms facets → traits for OUTPUT only
const traitScores = deriveTraitScores(facetScores);
// Openness = mean(imagination, artistic_interests, ...) with min(confidence)

// OUTPUT: Return both facets (internal) and traits (user-facing)
return {
  nerinResponse,
  tokenUsage,
  costIncurred,
  facetScores,        // Granular data for next iteration
  traitScores,        // Aggregated for user display
  steeringTarget,     // Which facet was targeted
  steeringHint,       // What guidance was given
};
```

**Why Facet-Level?**
- **Precision**: 30 facets provide finer steering than 5 traits
- **No Duplication**: Single source of truth (facetScores), traits derived on demand
- **Proper Abstraction**: Nerin operates at the granularity it needs
- **Debugging**: Can trace which specific facet was targeted each turn

**Error Types:**
- `BudgetPausedError` - Daily $75 limit reached, session paused (resume next day)
- `OrchestrationError` - Generic routing/pipeline failure
- `PrecisionGapError` - Precision calculation failure (422)

## Nerin Agent Implementation

The Nerin conversational agent follows **hexagonal architecture** (ports & adapters) with Effect-ts dependency injection.

**Nerin Repository Interface (Facet-Level):**

```typescript
// packages/domain/src/repositories/nerin-agent.repository.ts
export interface NerinInvokeInput {
  /** Session identifier for state persistence */
  readonly sessionId: string;

  /** Message history for conversational context */
  readonly messages: readonly BaseMessage[];

  /** Current facet scores (30 facets) - NOT trait-level precision */
  readonly facetScores?: FacetScoresMap;

  /** Natural language steering hint from orchestrator outlier detection */
  readonly steeringHint?: string;
}

export class NerinAgentRepository extends Context.Tag("NerinAgentRepository")<
  NerinAgentRepository,
  {
    readonly invoke: (input: NerinInvokeInput) => Effect.Effect<NerinInvokeOutput, AgentInvocationError, never>;
  }
>() {}
```

**System Prompt Construction:**

```typescript
// packages/domain/src/utils/nerin-system-prompt.ts
function buildChatSystemPrompt(steeringHint?: string): string {
  let prompt = `${NERIN_PERSONA}\n\n${CHAT_CONTEXT}`;

  // Add facet-level steering hint if provided
  if (steeringHint) {
    prompt += `\n\nSTEERING PRIORITY:\n${steeringHint}`;
    prompt += `\nTransition to this territory within your next 1-2 responses...`;
  }

  return prompt;
}
```

**Key Changes from Previous Implementation:**
- ❌ **REMOVED**: `PrecisionScores` (trait-level object with 5 duplicated values)
- ❌ **REMOVED**: `facetScores` / `assessedCount` from prompt (unnecessary context)
- ✅ **ADDED**: `steeringHint` (natural language guidance from router)
- ✅ **ADDED**: `NERIN_PERSONA` shared constant + `CHAT_CONTEXT` (Story 2.12)
- ✅ **EFFECT**: System prompt now includes precise facet-level steering via hint

**Architecture Overview (with Orchestrator integration):**

```
┌─────────────────────────────────────────────────────────────────────┐
│ packages/domain (PORTS - Interfaces)                                 │
│   └─ repositories/orchestrator.repository.ts (Story 2.4)           │
│       - OrchestratorRepository (Context.Tag)                        │
│       - ProcessMessageInput, ProcessMessageOutput types             │
│       - BudgetPausedError, OrchestrationError                       │
│   └─ repositories/nerin-agent.repository.ts                         │
│       - NerinAgentRepository (used internally by Orchestrator)      │
│   └─ repositories/analyzer.repository.ts                            │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ implements
                              │
┌─────────────────────────────────────────────────────────────────────┐
│ packages/infrastructure (ADAPTERS - Implementations)                 │
│   └─ repositories/orchestrator.langgraph.repository.ts              │
│       - OrchestratorLangGraphRepositoryLive (Layer)                 │
│       - LangGraph StateGraph for routing                            │
│   └─ repositories/nerin-agent.langgraph.repository.ts               │
│   └─ repositories/analyzer.claude.repository.ts                     │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ injected via Layer
                              │
┌─────────────────────────────────────────────────────────────────────┐
│ apps/api/src/use-cases (Business Logic)                             │
│   └─ send-message.use-case.ts                                       │
│       - Pure Effect, no direct LangGraph import                     │
│       - Accesses OrchestratorRepository via Context.Tag             │
│       - Handles BudgetPausedError for graceful session pause        │
└─────────────────────────────────────────────────────────────────────┘
```

**Critical Note on thread_id:** The `configurable.thread_id` passed to `graph.invoke()` is required for checkpointer persistence. Use `sessionId` as the thread_id to maintain conversation history across requests. Omitting this breaks state persistence and each invocation will start fresh.

## Use-Case Pattern

<details>
<summary><b>Use-Case Implementation Example</b></summary>

```typescript
// apps/api/src/use-cases/send-message.use-case.ts
import { Effect } from "effect";
import { AssessmentSessionRepository } from "@workspace/domain/repositories/assessment-session.repository";
import { AssessmentMessageRepository } from "@workspace/domain/repositories/assessment-message.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";

export const sendMessage = (
  input: SendMessageInput
): Effect.Effect<
  SendMessageOutput,
  DatabaseError | SessionNotFound,
  AssessmentSessionRepository | AssessmentMessageRepository | LoggerRepository
> =>
  Effect.gen(function* () {
    // Access injected dependencies
    const sessionRepo = yield* AssessmentSessionRepository;
    const messageRepo = yield* AssessmentMessageRepository;
    const logger = yield* LoggerRepository;

    // Business logic orchestrates domain operations
    const session = yield* sessionRepo.getSession(input.sessionId);
    yield* messageRepo.saveMessage(input.sessionId, "user", input.message);

    // ... more business logic

    return { response, precision };
  });
```

</details>

## Testing Pattern

<details>
<summary><b>Unit Testing with Test Implementations</b></summary>

```typescript
// Unit test with test implementations
const TestLayer = Layer.mergeAll(
  Layer.succeed(AssessmentSessionRepository, TestSessionRepo),
  Layer.succeed(AssessmentMessageRepository, TestMessageRepo),
  Layer.succeed(LoggerRepository, TestLogger)
);

const result = await Effect.runPromise(
  sendMessage({ sessionId: "test", message: "Hello" }).pipe(
    Effect.provide(TestLayer)
  )
);
```

**Key Pattern:** Each test double must implement the same interface as the production layer. Create test implementations in `*.test.ts` files alongside production code. Use `Layer.succeed(RepositoryTag, mockImplementation)` to inject test doubles.

</details>

## Database (Drizzle ORM + PostgreSQL)

Type-safe database access using Drizzle ORM with PostgreSQL. Schema lives in `packages/infrastructure/src/db/schema.ts`.

**Key Tables:** `assessment_session`, `assessment_message`, `facet_evidence`

> **Note (Story 2-9):** `facet_scores` and `trait_scores` tables were removed. Scores are now computed on-demand from `facet_evidence` via pure functions (`aggregateFacetScores`, `deriveTraitScores`).

See actual schema file for current table definitions.

## Catalog Dependencies

`pnpm-workspace.yaml` defines a `catalog` for consistent dependency versions:

```yaml
catalog:
  effect: "latest"
  "@effect/schema": "latest"
  "@effect/platform": "latest"
  "@effect/platform-node": "latest"
  drizzle-orm: "0.45.1"
  "@anthropic-ai/sdk": "0.71.2"
  pino: "9.6.0"
```

**Best Practice:** Before updating any package version, check `pnpm-workspace.yaml` catalog first. Use `catalog:` prefix in package.json (e.g., `"effect": "catalog:"`). This ensures all packages stay synchronized. Only add new versions to the catalog, never hardcode versions in individual package.json files.

## Turbo Tasks

Turbo.json defines task dependencies:

- `build`: Depends on `^build` (dependencies must build first)
- `lint`: Depends on `^lint`
- `typecheck`: Depends on `^typecheck`
- `dev`: Not cached, persistent task
