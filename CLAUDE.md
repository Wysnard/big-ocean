# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## Table of Contents

### 🚀 Quick Start
- [Repository Overview](#repository-overview)
- [Common Commands](#common-commands)

### 📚 Core Documentation
- [Architecture & Key Patterns](#architecture--key-patterns) → [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [Completed Stories](#completed-stories-) → [COMPLETED-STORIES.md](./docs/COMPLETED-STORIES.md)
- [Tech Stack Summary](#tech-stack-summary)
- [Key Dependencies & Versions](#key-dependencies--versions)

### ⚙️ Development Setup
- [Monorepo Structure](#monorepo-structure)
- [Common Commands](#common-commands) → [COMMANDS.md](./docs/COMMANDS.md)
- [Git Hooks](#git-hooks-local-enforcement)
- [Testing with Effect and @effect/vitest](#testing-with-effect-and-effectvitest)

### 🚢 Production & Deployment
- [Production Deployment](#production-deployment-story-13-) → [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

### 📋 Conventions & Workflows
- [Git Conventions](#git-conventions) → [NAMING-CONVENTIONS.md](./docs/NAMING-CONVENTIONS.md)
- [Linting & Code Quality](#linting--code-quality)
- [Adding New Packages or Apps](#adding-new-packages-or-apps)
- [Adding Components to UI Library](#adding-components-to-ui-library)

## Repository Overview

**big-ocean** is a sophisticated psychological profiling platform built on the Big Five personality framework. It's a monorepo using [Turbo](https://turbo.build) and [pnpm workspaces](https://pnpm.io) with a clear separation between frontend, backend, shared packages, and infrastructure.

**Core Vision:** Conversational, coherence-based personality assessment via LLM agents → scientific research integration → memorable archetypes → social features for comparison and discovery.

**Node requirement:** >= 20
**Package manager:** pnpm@10.4.1

## Monorepo Structure

```
apps/
  ├── front/        # TanStack Start frontend (React 19, full-stack SSR)
  └── api/          # Node.js backend with Effect-ts and LangGraph
packages/
  ├── domain/       # Core types, schemas, and domain models
  ├── contracts/    # Effect/HTTP contracts and schema definitions
  ├── database/     # Drizzle ORM schema and migrations
  ├── ui/           # Shared React components (shadcn/ui based)
  ├── infrastructure/ # Backend utilities (context bridges, dependency injection)
  ├── lint/         # Shared Biome linting and formatting configuration
  └── typescript-config/
```

### Apps

- **front** (`port 3000`): TanStack Start full-stack SSR frontend with React 19, featuring:
  - TanStack Start framework for isomorphic React (SSR/streaming)
  - TanStack Router 1+ for file-based routing
  - TanStack Query 5+ for data fetching and caching
  - TanStack Form 1+ for form state management
  - TanStack DB 0+ for reactive state management
  - ElectricSQL (@electric-sql/client, @electric-sql/react) for local-first sync
  - shadcn/ui components with Tailwind CSS v4
  - Effect-ts for functional error handling and HTTP client typing

- **api** (`port 4000` dev, Railway prod): Node.js backend featuring:
  - **Hexagonal Architecture**:
    - `src/handlers/` - Thin HTTP adapters (controllers/presenters)
    - `src/use-cases/` - Business logic (main unit test target)
  - Effect-ts 3.19+ for functional programming and error handling
  - @effect/platform 0.94+ for HTTP server and API contracts
  - @effect/platform-node for Node.js HTTP runtime
  - @effect/schema 0.71+ for runtime validation and serialization
  - @langchain/langgraph 1+ for multi-agent orchestration
  - @anthropic-ai/sdk 0.71+ for Claude API integration
  - Drizzle ORM 0.45+ for type-safe database queries
  - PostgreSQL as primary database
  - Better Auth for authentication (integrated at node:http layer)
  - Health check: GET `/health` → `{"status":"ok","timestamp":"..."}`
  - HTTP API: All routes under `/api/*` (except `/health`)

### Packages

- **domain**: Core domain layer (hexagonal architecture - ports)
  - Repository interfaces using Context.Tag (no implementations)
  - Entity schemas with Effect Schema (users, sessions, messages, etc.)
  - Domain errors and types
  - Branded types for type-safe IDs (userId, sessionId, etc.)
  - Pure abstractions - no external dependencies

- **contracts**: Effect/Platform HTTP contract definitions using @effect/platform and @effect/schema
  - HTTP API Groups: AssessmentGroup, HealthGroup, ProfileGroup (future)
  - Type-safe request/response schemas with Effect Schema validation
  - BigOceanApi composition class with route grouping and prefixing
  - Exported TypeScript types for frontend consumption
  - Pattern: HttpApiGroup.make() → HttpApiEndpoint → HttpApiBuilder handlers

- **database**: Drizzle ORM schema and utilities
  - Tables: users, sessions, messages, trait_assessments, etc.
  - Migration scripts for PostgreSQL
  - Query builders and type-safe helpers

- **infrastructure**: Infrastructure layer (hexagonal architecture - adapters)
  - Repository implementations as Effect Layers (`*RepositoryLive`)
  - Drizzle ORM implementations (`*.drizzle.repository.ts`)
  - Pino logger implementation (`*.pino.repository.ts`)
  - Database context and schema definitions
  - Naming: `AssessmentMessageDrizzleRepositoryLive` (production)
  - Testing: `AssessmentMessageTestRepositoryLive` (test implementations)
  - Injected into use-cases via Layer composition

- **ui**: Shared React component library built on shadcn/ui
  - Exports components from `./components/*`
  - Utilities for personality visualization and formatting

- **lint**: Shared Biome configuration used across all apps and packages
- **typescript-config**: Shared TypeScript configuration

## Common Commands

**Quick Start:**

```bash
pnpm install                # Install dependencies
pnpm prepare                # Install git hooks (automatic via postinstall)
pnpm dev                    # Start all services
pnpm test:run               # Run all tests
pnpm lint                   # Lint all packages
```

For complete command reference, see [COMMANDS.md](./docs/COMMANDS.md).

**Key Commands:**
- `pnpm dev --filter=front` - Frontend only (TanStack Start, port 3000)
- `pnpm dev --filter=api` - Backend only (Node.js, port 4000)
- `pnpm build` - Build all packages
- `pnpm format` - Format all code
- `pnpm test:coverage` - Run tests with coverage

### Git Hooks (Local Enforcement)

Git hooks ensure code quality before commits and pushes:

**Pre-push hook** (runs before `git push`):
- Lint check (`pnpm lint`)
- TypeScript check (`pnpm turbo lint`)
- Test suite (`pnpm test:run`)
- Blocks push if any check fails

**Commit-msg hook** (validates commit messages):
- Requires [conventional commit format](#commit-message-format)
- Allowed types: `feat`, `fix`, `docs`, `chore`, `test`, `ci`, `refactor`, `perf`, `style`, `build`, `revert`

**Bypass hooks (use sparingly):**
```bash
git commit --no-verify   # Skip commit-msg hook
git push --no-verify     # Skip pre-push hook
```

Hooks are managed by `simple-git-hooks` (installed automatically via `pnpm install`).

## Architecture & Key Patterns

### Hexagonal Architecture (Ports & Adapters)

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

**Naming Conventions:**

| Component | Location | Example | Notes |
|-----------|----------|---------|-------|
| Repository Interface | `packages/domain/src/repositories/` | `assessment-message.repository.ts` | Context.Tag definition |
| Repository Implementation | `packages/infrastructure/src/repositories/` | `assessment-message.drizzle.repository.ts` | Layer.effect implementation |
| Live Layer Export | Same as implementation | `AssessmentMessageDrizzleRepositoryLive` | Production Layer |
| Test Layer Export | Test files | `AssessmentMessageTestRepositoryLive` | Testing Layer |
| Use-Case | `apps/api/src/use-cases/` | `send-message.use-case.ts` | Pure business logic |
| Handler | `apps/api/src/handlers/` | `assessment.ts` | HTTP adapter |

**Example Use-Case Pattern:**

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

**Testing Pattern:**

```typescript
// Unit test with test implementations
const TestLayer = Layer.mergeAll(
  Layer.succeed(AssessmentSessionRepository, TestSessionRepo),
  Layer.succeed(AssessmentMessageRepository, TestMessageRepo),
  Layer.succeed(LoggerRepository, TestLogger)
);

const result = await Effect.runPromise(
  sendMessage({ sessionId: "test", message: "Hello" })
    .pipe(Effect.provide(TestLayer))
);
```

**Key Benefits:**
- **Testability**: Use-cases tested in isolation with test implementations
- **Flexibility**: Swap implementations without changing business logic
- **Clarity**: Each layer has single responsibility
- **Effect-ts native**: Context.Tag and Layer system for DI

For complete architecture details, see `_bmad-output/planning-artifacts/architecture.md` (ADR-6).

### Workspace Dependencies

Packages use `workspace:*` and `workspace:^` to reference other packages in the monorepo. This ensures they're always in sync with local versions.

**Dependency Graph:**

```
apps/front     → contracts, domain, ui, database
apps/api       → contracts, domain, database, infrastructure
contracts      → domain (schema imports)
infrastructure → domain, database
ui             → (independent component library)
```

### Domain-Driven Design

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

### Effect/Platform HTTP Contracts (Story 1.6 ✅)

The `@workspace/contracts` package defines type-safe HTTP API contracts using @effect/platform and @effect/schema following the official effect-worker-mono pattern.

**HTTP Contract Structure** (in `packages/contracts/src/http/groups/assessment.ts`):

```typescript
import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema as S } from "effect"

// Request/Response schemas
export const StartAssessmentRequestSchema = S.Struct({
  userId: S.optional(S.String),
})

export const StartAssessmentResponseSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.DateTimeUtc,
})

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
  .prefix("/assessment")
```

**Handler Implementation** (in `apps/api/src/handlers/assessment.ts`):

```typescript
import { HttpApiBuilder } from "@effect/platform"
import { DateTime, Effect } from "effect"
import { BigOceanApi } from "@workspace/contracts"
import { LoggerService } from "../services/logger.js"

// Handlers use HttpApiBuilder.group pattern
export const AssessmentGroupLive = HttpApiBuilder.group(
  BigOceanApi,
  "assessment",
  (handlers) =>
    Effect.gen(function* () {
      return handlers
        .handle("start", ({ payload }) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService

            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
            const createdAt = DateTime.unsafeMake(Date.now())

            logger.info("Assessment session started", {
              sessionId,
              userId: payload.userId,
            })

            return { sessionId, createdAt }
          })
        )
        .handle("sendMessage", ({ payload }) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService

            logger.info("Message received", {
              sessionId: payload.sessionId,
              messageLength: payload.message.length,
            })

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
            }
          })
        )
    })
)
```

**Server Setup** (in `apps/api/src/index.ts`):

```typescript
import { Effect, Layer } from "effect"
import { HttpApiBuilder, HttpMiddleware } from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { createServer } from "node:http"
import { BigOceanApi } from "@workspace/contracts"
import { HealthGroupLive } from "./handlers/health.js"
import { AssessmentGroupLive } from "./handlers/assessment.js"
import { LoggerServiceLive } from "./services/logger.js"
import { betterAuthHandler } from "./middleware/better-auth.js"

// Merge all handler groups with services
const HttpGroupsLive = Layer.mergeAll(
  HealthGroupLive,
  AssessmentGroupLive,
  LoggerServiceLive
)

// Build API from contracts with handlers
const ApiLive = HttpApiBuilder.api(BigOceanApi).pipe(
  Layer.provide(HttpGroupsLive)
)

// Complete API with router and middleware
const ApiLayer = Layer.mergeAll(
  ApiLive,
  HttpApiBuilder.Router.Live,
  HttpApiBuilder.Middleware.layer
)

// Hybrid server: Better Auth (node:http) → Effect (remaining routes)
const createCustomServer = () => {
  const server = createServer()
  let effectHandler: any = null

  server.on("newListener", (event, listener) => {
    if (event === "request") {
      effectHandler = listener
      server.removeListener("request", listener as any)
    }
  })

  server.on("request", async (req, res) => {
    await betterAuthHandler(req, res)
    if (!res.writableEnded && effectHandler) {
      effectHandler(req, res)
    }
  })

  return server
}

// HTTP Server with Better Auth integration
const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(ApiLayer),
  Layer.provide(NodeHttpServer.layer(createCustomServer, { port: 4000 })),
  Layer.provide(LoggerServiceLive)
)

// Launch server
NodeRuntime.runMain(Layer.launch(HttpLive))
```

### Multi-Agent System (LangGraph)

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

### Analyzer and Scorer Implementation (Story 2.3 ✅)

The Analyzer and Scorer work together to build personality profiles from conversation:

**Big Five Framework:**
- 5 traits: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- 30 facets total (6 per trait)
- Constants defined in `packages/domain/src/constants/big-five.ts`

**Database Schema (facet_evidence, facet_scores, trait_scores):**

```typescript
// packages/infrastructure/src/db/schema.ts
export const facetEvidence = pgTable("facet_evidence", {
  id: uuid("id").primaryKey(),
  messageId: uuid("message_id").references(() => assessmentMessage.id),
  facetName: text("facet_name").notNull(),  // "imagination", "altruism", etc.
  score: integer("score").notNull(),        // 0-20
  confidence: integer("confidence").notNull(), // 0-100
  quote: text("quote").notNull(),           // Evidence text
  highlightStart: integer("highlight_start").notNull(),
  highlightEnd: integer("highlight_end").notNull(),
});
```

**Repository Pattern:**

| Repository | Interface | Implementation | Purpose |
|------------|-----------|----------------|---------|
| AnalyzerRepository | `packages/domain/src/repositories/analyzer.repository.ts` | `analyzer.claude.repository.ts` | Claude API for facet extraction |
| ScorerRepository | `packages/domain/src/repositories/scorer.repository.ts` | `scorer.drizzle.repository.ts` | Facet aggregation + trait derivation |
| FacetEvidenceRepository | `packages/domain/src/repositories/facet-evidence.repository.ts` | (test only) | Evidence persistence |

**Use-Cases:**

```typescript
// Analyze message and extract facet evidence
const evidence = yield* analyzer.analyzeFacets(messageId, content);

// Save evidence (validates: score 0-20, confidence 0-1, valid facet names)
const saved = yield* saveFacetEvidence({ messageId, evidence });

// Aggregate every 3 messages
if (shouldTriggerScoring(messageCount)) {
  const scores = yield* updateFacetScores({ sessionId });
  const precision = yield* calculatePrecisionFromFacets({ facetScores: scores.facetScores });
}
```

**Scoring Algorithm:**
1. Group evidence by facetName
2. Weighted average with recency bias: `confidence × (1 + position × 0.1)`
3. Contradiction detection via variance analysis
4. Trait score = mean of 6 related facet scores
5. Trait confidence = minimum confidence across facets
6. Precision = mean of all facet confidences × 100

### Local-First Data Sync (ElectricSQL + TanStack DB)

Frontend uses reactive local-first sync:

```typescript
// apps/web/src/lib/sync.ts
import { useElectricClient } from "@electric-sql/react";
import { useQuery } from "@tanstack/react-query";

export function useSession(sessionId: string) {
  const electric = useElectricClient();

  // ElectricSQL syncs automatically with PostgreSQL
  const { data } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () =>
      electric.db.session.findUnique({
        where: { id: sessionId },
      }),
  });

  return data;
}
```

### Database (Drizzle ORM + PostgreSQL)

Type-safe database access with Drizzle:

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

### FiberRef Dependency Injection Pattern (Story 1.3)

FiberRef enables request-scoped context without prop drilling. Handlers access services via `FiberRef.get()`:

**Define a FiberRef Bridge** (in `packages/infrastructure/src/context/logger.ts`):

```typescript
import { FiberRef, Effect } from "effect";

**Key Principles:**
- **Handlers**: Thin HTTP adapters - extract request data and call use-cases
- **Use-Cases**: Pure business logic - main unit test target
- **Domain**: Repository interfaces (Context.Tag), entities, types
- **Infrastructure**: Repository implementations (Drizzle, LangGraph, Pino, etc.)

**Hard Rule:** No conditional logic, validation, or orchestration in handlers. All business logic belongs in use-cases.

**Quick Discovery Pattern:**
- Repository interface? → `packages/domain/src/repositories/{name}.repository.ts`
- Repository implementation? → `packages/infrastructure/src/repositories/{name}*.repository.ts`
- Test implementations? → `*.test.ts` files next to production code

For complete architecture details, see:
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Detailed patterns, examples, and diagrams
- [NAMING-CONVENTIONS.md](./docs/NAMING-CONVENTIONS.md) - Component naming and file locations

### Tech Stack Summary

**Core Dependencies:**
- **Effect-ts**: Functional programming and error handling (latest)
- **@effect/platform**: Type-safe HTTP contracts and server
- **@effect/schema**: Runtime validation and serialization
- **LangGraph + Anthropic SDK**: Multi-agent orchestration and Claude integration
- **Drizzle ORM**: Type-safe database queries with PostgreSQL
- **Pino**: High-performance structured logging
- **React 19 + TanStack**: Frontend with SSR, routing, forms, state

**Deployment & Dev:**
- Railway for production API
- Docker Compose for development environment parity
- GitHub Actions for CI/CD (lint → build → test → validate commits)
- Better Auth for authentication

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production details.

## Testing with Effect and @effect/vitest

The codebase uses [@effect/vitest](https://github.com/Effect-TS/effect/tree/main/packages/vitest) for testing Effect programs with proper dependency injection and virtual time control.

### Test Layer Pattern

All repository dependencies are mocked using **Test Layers** defined in `apps/api/src/test-utils/test-layers.ts`:

```typescript
import { Effect } from "effect"
import { TestRepositoriesLayer } from "../test-utils/test-layers.js"
import { AssessmentSessionRepository } from "@workspace/domain"

it.effect('should create session', () =>
  Effect.gen(function* () {
    const sessionRepo = yield* AssessmentSessionRepository
    const session = yield* sessionRepo.createSession("user123")
    expect(session.sessionId).toBeDefined()
  }).pipe(Effect.provide(TestRepositoriesLayer))
)
```

**TestRepositoriesLayer** merges all repository mocks:
- AssessmentSessionRepository (in-memory Map)
- AssessmentMessageRepository (in-memory Map)
- LoggerRepository (no-op logger)
- CostGuardRepository (in-memory tracking)
- RedisRepository (in-memory key-value store)
- NerinAgentRepository (mock Claude responses)

### Writing Tests for Use-Cases

**Pattern**: Use-cases are pure business logic that depend on repository interfaces. Test them by providing test implementations via Layers.

```typescript
import { it } from '@effect/vitest'
import { Effect } from 'effect'
import { TestRepositoriesLayer } from '../../test-utils/test-layers.js'
import { myUseCase } from '../../use-cases/my-use-case.js'

describe('myUseCase', () => {
  it.effect('should handle success case', () =>
    Effect.gen(function* () {
      const result = yield* myUseCase({ input: 'test' })
      expect(result.output).toBe('expected')
    }).pipe(Effect.provide(TestRepositoriesLayer))
  )

  it.effect('should handle failure case', () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        myUseCase({ input: 'invalid' })
      )

      expect(exit._tag).toBe('Failure')
    }).pipe(Effect.provide(TestRepositoriesLayer))
  )
})
```

### Testing Time-Dependent Code with TestClock

@effect/vitest provides **TestClock** for testing time-dependent operations without real delays:

```typescript
import { TestClock, Effect, Fiber } from 'effect'

it.effect('should handle delayed operations', () =>
  Effect.gen(function* () {
    const testClock = yield* TestClock.TestClock

    // Start operation that delays 5 seconds
    const deferred = yield* Effect.fork(
      Effect.sleep('5 seconds').pipe(Effect.as('done'))
    )

    // Advance virtual time instantly
    yield* testClock.adjust('5 seconds')

    // Operation completes immediately (no real wait)
    const result = yield* Fiber.join(deferred)
    expect(result).toBe('done')
  })
)
```

### Resource Management with it.scoped

Use `it.scoped` for tests that need automatic cleanup:

```typescript
it.scoped('should clean up resources', () =>
  Effect.gen(function* () {
    const resource = yield* Effect.acquireRelease(
      Effect.sync(() => openConnection()),
      (conn) => Effect.sync(() => closeConnection(conn))
    )

    const result = yield* useResource(resource)
    expect(result).toBeDefined()

    // Resource automatically closed after test
  }).pipe(Effect.provide(TestRepositoriesLayer))
)
```

### Test Modifiers

@effect/vitest supports standard test modifiers:

```typescript
// Skip test temporarily
it.effect.skip('not ready yet', () => Effect.void)

// Run only this test (for debugging)
it.effect.only('focus on this', () => Effect.succeed(undefined))

// Expect test to fail
it.effect.fails('should fail', () =>
  Effect.fail(new Error('Expected'))
)
```

### Overriding Specific Services

Override individual services while keeping others from TestRepositoriesLayer:

```typescript
it.effect('should use custom logger', () => {
  let callCount = 0
  const customLogger = {
    info: () => Effect.sync(() => { callCount++ }),
    error: () => Effect.void,
    warn: () => Effect.void,
    debug: () => Effect.void,
  }

  const customLayer = Layer.mergeAll(
    TestRepositoriesLayer,
    Layer.succeed(LoggerRepository, customLogger)
  )

  return Effect.gen(function* () {
    const logger = yield* LoggerRepository
    yield* logger.info('test')
    expect(callCount).toBe(1)
  }).pipe(Effect.provide(customLayer))
})
```

### Best Practices

1. **Use it.effect() for Effect programs** - Automatically injects TestContext (TestClock, etc.)
2. **Provide TestRepositoriesLayer** - All use-cases need repository dependencies
3. **Test failures with Effect.exit** - Capture exit to inspect failure causes
4. **Use TestClock for time** - Virtual time is deterministic and instant
5. **Keep tests pure** - Test Layers ensure no database/API calls
6. **Test at use-case level** - Main unit test target per hexagonal architecture

### Running Tests

```bash
# Run all tests (via turbo)
pnpm test:run

# Run tests in watch mode
pnpm test:watch

# Run API tests only
pnpm --filter=api test

# Run with coverage
pnpm test:coverage
```

**Pre-push hook** automatically runs all tests before allowing pushes.

For complete examples, see:
- `apps/api/src/__tests__/effect-vitest-examples.test.ts` - Full feature showcase
- `apps/api/src/__tests__/smoke.test.ts` - Basic setup verification
- `apps/api/src/__tests__/use-cases/*.test.ts` - Real-world use-case tests

## Production Deployment (Story 1.3 ✅)

Railway deployment with automatic CI/CD, Docker multi-stage builds, and health checks.

**Production:** https://api-production-f7de.up.railway.app/health

**Key Features:**
- Automatic deployment on `master` branch
- Docker containers with workspace resolution
- Health check validation endpoint
- Environment variable configuration in Railway dashboard

For complete deployment guide, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Completed Stories ✅

Stories that are fully implemented and deployed:

- **Story 1.3**: Production Deployment (Railway + Docker)
- **Story 1.4**: Docker Compose Development
- **Story 1.6**: Effect/Platform HTTP Contracts
- **Story 2.1.1**: CI/CD Pipeline
- **Story 2.2**: Nerin Agent Implementation (Hexagonal Architecture)

For details on each completed story, see [COMPLETED-STORIES.md](./docs/COMPLETED-STORIES.md)

## Git Conventions

Branch naming, commit messages, and component naming follow consistent patterns.

See [NAMING-CONVENTIONS.md](./docs/NAMING-CONVENTIONS.md) for:
- Branch naming format (`feat/story-{epic-num}-{story-num}-{slug}`)
- Commit message format with examples
- Component naming conventions
- Repository interface and implementation patterns

## Linting & Code Quality

- **Root level**: Biome with shared config from @workspace/lint
- **All apps (front, api)**: Biome via extends pattern from @workspace/lint/biome
- **All packages (ui, contracts, domain, infrastructure, lint, typescript-config)**: Biome via extends pattern
- **Zero-warnings policy**: Maintained for packages/ui, packages/contracts
- **Format all**: `pnpm format` runs Prettier on all code
- **Shared config**: `packages/lint/biome.json` is the single source of truth for linting rules

## Adding New Packages or Apps

When adding a new package or app:

1. Create directory under `packages/` or `apps/`
2. Add `package.json` with workspace references
3. Turbo and pnpm automatically recognize it via `pnpm-workspace.yaml`
4. Update imports in dependent packages
5. Add lint task to `turbo.json` if needed

## Adding Components to UI Library

```bash
# Add component from shadcn/ui registry
pnpm dlx shadcn@latest add [component-name] -c apps/front

# Then move generated files from apps/front to packages/ui/src/components/
# and export from packages/ui/src/index.ts
```

Components are imported across apps as:

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Key Dependencies & Versions

**Requirements:**
- Node.js >= 20
- pnpm 10.4.1
- TypeScript 5.7.3+

**Frontend Stack:**
- React 19, TanStack Start, TanStack Router, TanStack Query, TanStack Form
- ElectricSQL, Tailwind CSS 4+, shadcn/ui
- Effect for error handling

**Backend Stack:**
- Effect, @effect/platform (HTTP contracts)
- @effect/schema (runtime validation)
- LangGraph + Anthropic SDK (multi-agent AI)
- Drizzle ORM + PostgreSQL (database)
- Pino (structured logging)
- Better Auth (authentication)

**Catalog Configuration:**

Versions are centralized in `pnpm-workspace.yaml` to ensure consistency across packages. Always reference the catalog when updating dependencies.

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md#catalog-dependencies) for the complete catalog configuration.

## Git Conventions

Branch naming, commit messages, and component naming follow consistent patterns.

See [NAMING-CONVENTIONS.md](./docs/NAMING-CONVENTIONS.md) for:
- Branch naming format (`feat/story-{epic-num}-{story-num}-{slug}`)
- Commit message format with examples
- Component naming conventions
- Repository interface and implementation patterns
