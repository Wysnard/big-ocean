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
apps/front     → contracts, domain, ui, database
apps/api       → contracts, domain, database, infrastructure
contracts      → domain (schema imports)
infrastructure → domain, database
ui             → (independent component library)
```

## Domain-Driven Design

The `@workspace/domain` package encapsulates core business logic:

**Domain Package Structure:**

```typescript
// packages/domain/src/
├── schemas/          # Effect Schema definitions for domain types
├── errors/           # Tagged Error types
├── types/            # Branded types (userId, sessionId, etc.)
└── constants/        # Domain constants (trait names, facets, etc.)
```

**Example Domain Export:**

```typescript
// packages/domain/src/schemas/index.ts
import * as S from "@effect/schema/Schema";

export const UserProfileSchema = S.Struct({
  id: S.String,
  name: S.String,
  traits: PersonalityTraitsSchema,
  // ... more fields
});

export type UserProfile = S.To<typeof UserProfileSchema>;
```

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

The backend uses LangGraph to orchestrate multiple specialized agents:

**Agent Architecture:**

```
┌─────────────────────────────────────────────────────┐
│ Orchestrator (Rules-based routing)                  │
│ - Identifies lowest precision trait                 │
│ - Recommends exploration domain                     │
│ - Generates context for Nerin                       │
└────────────────┬────────────────────────────────────┘
                 │ guidance
                 ▼
┌──────────────────────────────────────────────────────┐
│ Nerin (Conversational Agent - Claude 3.5 Sonnet)   │
│ - Handles conversational quality                    │
│ - Builds relational safety                          │
│ - No assessment responsibility                      │
└────────────────┬────────────────────────────────────┘
                 │ user response
      ┌──────────┴──────────┐
      │ (batch every 3 msgs)│
      ▼                     ▼
┌──────────────┐   ┌──────────────┐
│ Analyzer     │   │ Scorer       │
│ - Pattern    │   │ - Calculates │
│   extraction │   │   trait      │
│ - Detects    │   │   scores     │
│   contradic. │   │ - Identifies │
│              │   │   facets     │
└──────┬───────┘   └───────┬──────┘
       │                   │
       └───────┬───────────┘
               ▼
         (update state)
```

## Nerin Agent Implementation

The Nerin conversational agent follows **hexagonal architecture** (ports & adapters) with Effect-ts dependency injection.

**Architecture Overview:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ packages/domain (PORT - Interface)                                   │
│   └─ repositories/nerin-agent.repository.ts                         │
│       - NerinAgentRepository (Context.Tag)                          │
│       - NerinInvokeInput, NerinInvokeOutput types                   │
│       - PrecisionScores, TokenUsage interfaces                      │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ implements
                              │
┌─────────────────────────────────────────────────────────────────────┐
│ packages/infrastructure (ADAPTER - Implementation)                   │
│   └─ repositories/nerin-agent.langgraph.repository.ts               │
│       - NerinAgentLangGraphRepositoryLive (Layer)                   │
│       - LangGraph StateGraph with PostgresSaver                     │
│       - ChatAnthropic model integration                             │
│       - Token tracking and cost calculation                         │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ injected via Layer
                              │
┌─────────────────────────────────────────────────────────────────────┐
│ apps/api/src/use-cases (Business Logic)                             │
│   └─ send-message.use-case.ts                                       │
│       - Pure Effect, no direct LangGraph import                     │
│       - Accesses NerinAgentRepository via Context.Tag               │
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

Type-safe database access using Drizzle ORM with PostgreSQL.

```typescript
// packages/database/src/schema.ts
import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  // ... other fields
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => sessions.id),
  role: text("role"), // 'user' | 'assistant'
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

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
