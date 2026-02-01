# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

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
  ├── contracts/    # Effect/RPC contracts and schema definitions
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
  - Effect-ts for functional error handling and RPC client typing

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
  - **Story 1.6 Complete**: Migrated to Effect/Platform HTTP with Better Auth
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
  - Includes hooks for RPC interaction
  - Utilities for personality visualization and formatting

- **lint**: Shared Biome configuration used across all apps and packages
- **typescript-config**: Shared TypeScript configuration

## Common Commands

All commands run from repository root:

### Development

```bash
pnpm dev                      # Start all apps in dev mode (front + api)
pnpm dev --filter=front      # Run only frontend (TanStack Start, port 3000)
pnpm dev --filter=api        # Run only backend (Node.js, port 4000)
```

### Building & Testing

```bash
pnpm build                  # Build all packages and apps
pnpm lint                   # Lint all packages
pnpm format                 # Format all code with Prettier
pnpm test:run               # Run all tests
pnpm test:coverage          # Run tests with coverage report
```

### CI/CD Pipeline (Story 2.1.1)

GitHub Actions automatically runs on all pushes and pull requests:

**Pipeline Steps:**
1. Checkout code
2. Setup pnpm 10.4.1 + Node.js 20.x
3. Install dependencies (`pnpm install`)
4. TypeScript check (`pnpm turbo lint`)
5. Lint check (`pnpm lint`)
6. Build (`pnpm build`)
7. Run tests (`pnpm test:run`)
8. Validate commit messages (PR only - conventional commit format)

**Configuration:** `.github/workflows/ci.yml`

### Git Hooks (Local Enforcement)

Git hooks ensure code quality before commits and pushes:

**Pre-push hook** (runs before `git push`):
- Runs `pnpm lint` (Biome linting)
- Runs `pnpm turbo lint` (TypeScript check)
- Runs `pnpm test:run` (all tests)
- Blocks push if any check fails

**Commit-msg hook** (validates commit messages):
- Requires conventional commit format: `type(scope): Description` or `type: Description`
- Allowed types: `feat`, `fix`, `docs`, `chore`, `test`, `ci`, `refactor`, `perf`, `style`, `build`, `revert`
- Allows merge commits

**Bypass hooks (use sparingly):**
```bash
git commit --no-verify   # Skip commit-msg hook
git push --no-verify     # Skip pre-push hook
```

**Hook setup:** Hooks are managed by `simple-git-hooks`. After cloning:
```bash
pnpm install           # Installs dependencies
pnpm prepare           # Installs git hooks (runs automatically via postinstall)
```

### App-Specific Commands

**front** (TanStack Start frontend):

```bash
pnpm -C apps/front dev              # Start dev server with HMR (port 3000)
pnpm -C apps/front build            # Build for production (SSR)
pnpm -C apps/front start            # Start production server
pnpm -C apps/front lint             # Run Biome linter
pnpm -C apps/front typecheck        # TypeScript type checking
```

**api** (Node.js backend):

```bash
pnpm -C apps/api dev              # Start dev server with watch (port 4000)
pnpm -C apps/api build            # Build/compile TypeScript
pnpm -C apps/api typecheck        # TypeScript type checking
```

**packages** (Shared):

```bash
pnpm -C packages/domain lint      # Lint domain package
pnpm -C packages/contracts lint   # Lint contracts (zero warnings required)
pnpm -C packages/database lint    # Lint database package
pnpm -C packages/ui lint          # Lint UI components (zero warnings required)
pnpm -C packages/infrastructure lint # Lint infrastructure package
```

### Database Commands

```bash
# Migration management (from apps/api or packages/database)
pnpm drizzle-kit generate          # Generate migration files
pnpm drizzle-kit push              # Apply migrations to database
pnpm drizzle-kit studio            # Open Drizzle Studio UI
```

### Docker Compose Development (Story 1.4)

For containerized development with exact production parity:

```bash
# Start all services (PostgreSQL, Redis, Backend API, Frontend)
./scripts/dev.sh

# Stop services (keeps data)
docker compose stop
# or
./scripts/dev-stop.sh

# Full reset (removes all data)
./scripts/dev-reset.sh

# View logs
docker compose logs -f backend    # Backend logs with hot reload
docker compose logs -f frontend   # Frontend logs with Vite HMR
docker compose logs -f postgres   # Database logs
docker compose logs -f redis      # Cache logs

# Access services
curl http://localhost:4000/health  # Test backend health
docker compose exec postgres psql -U dev -d bigocean  # Access database
docker compose exec redis redis-cli  # Access cache

# Rebuild after dependency changes
docker compose build
docker compose up
```

**Key Features**:

- **Port mapping**: Frontend (3000), Backend (4000), PostgreSQL (5432), Redis (6379)
- **Hot reload**: Backend (tsx watch), Frontend (Vite HMR)
- **Volumes**: `./apps/api/src` and `./apps/front/src` mounted for real-time changes
- **Health checks**: All services validate startup order and readiness
- **Database persistence**: postgres_data and redis_data named volumes

See [DOCKER.md](./DOCKER.md) for comprehensive Docker development guide.

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

export interface Logger {
  info(msg: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  // ... other methods
}

export const LoggerRef = FiberRef.unsafeMake<Logger>(null as any);

// Helper to get the logger from current fiber
export const getLogger = Effect.gen(function* () {
  return yield* FiberRef.get(LoggerRef);
});

// Helper to execute effect with logger in scope
export const withLogger = <A, E, R>(
  logger: Logger,
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> =>
  Effect.gen(function* () {
    yield* FiberRef.set(LoggerRef, logger);
    return yield* effect;
  });
```

**Use in Handlers**:

```typescript
// In any handler, access logger without parameters
const MyHandler = Effect.gen(function* () {
  const logger = yield* getLogger;
  logger.info("This message is automatically scoped to the request");
  // ... more code
});
```

**Provide to Layer**:

```typescript
// In server setup, provide the FiberRef
const LoggerLayer = Layer.succeed(
  LoggerRef,
  winstonLogger, // instance created elsewhere
);

// When running the effect, include the LoggerLayer
const effect = MyEffect.pipe(Layer.provide(LoggerLayer));
```

This pattern prevents context leakage across requests and eliminates prop drilling throughout the codebase.

### Catalog Dependencies

`pnpm-workspace.yaml` defines a `catalog` for consistent dependency versions:

```yaml
catalog:
  zod: "4.2.1"
  effect: "3.19.14"
  "@effect/rpc": "0.73.0"
  "@effect/schema": "0.71.0"
  drizzle-orm: "0.45.1"
  "@anthropic-ai/sdk": "0.71.2"
```

Packages reference versions with `"catalog:"` to ensure consistency.

### Turbo Tasks

Turbo.json defines task dependencies:

- `build`: Depends on `^build` (dependencies must build first)
- `lint`: Depends on `^lint`
- `typecheck`: Depends on `^typecheck`
- `dev`: Not cached, persistent task

## Production Deployment (Story 1.3 ✅)

### Railway Deployment

The API is deployed to Railway with automatic CI/CD:

**Production URLs:**

- **Base**: https://api-production-f7de.up.railway.app
- **Health Check**: GET `/health` → `{"status":"ok"}`
- **RPC Endpoint**: POST `/rpc` (NDJSON serialization)

**Deployment Flow:**

1. Push to `master` branch triggers Railway build
2. Docker image built using `apps/api/Dockerfile`
3. TypeScript compiled with workspace package resolution
4. Container starts with `pnpm --filter api start` → runs `tsx src/index.ts`
5. Health check endpoint validates deployment
6. Automatic restart on failure (10 max retries)

**Environment Variables:**

- `PORT`: 8080 (Railway default)
- `HOST`: 0.0.0.0
- `ANTHROPIC_API_KEY`: Set in Railway dashboard
- Custom vars: `DATABASE_URL`, `REDIS_URL`, etc.

**Docker Best Practices:**

- Multi-stage build (builder + runtime)
- pnpm workspace resolution with double install for linking
- tsx for production TypeScript execution (handles workspace imports)
- Minimal production image (Node 20 Alpine)

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

**Frontend Stack:**

- React 19, TanStack Start, TanStack Router 1+, TanStack Query 5+, TanStack Form 1+, TanStack DB 0+
- ElectricSQL 1.4.1, Tailwind CSS 4+, shadcn/ui
- Effect (latest) for client-side error handling

**Backend Stack (Story 1.3):**

- Effect 3.19.15 (latest in catalog), @effect/rpc 0.73.0, @effect/schema 0.71.0
- @effect/platform 0.94.2, @effect/platform-node for Node.js runtime
- LangChain LangGraph 1.1+, Anthropic SDK 0.71.2
- Drizzle ORM 0.45.1, PostgreSQL
- Winston 3.19.0 for structured logging
- Pino 9.6.0 for high-performance logging

**Shared:**

- Effect Schema (for domain validation and type safety)
- TypeScript 5.7.3+, pnpm 10.4.1
- Node.js >= 20 required

**Catalog Configuration** (`pnpm-workspace.yaml`):

```yaml
catalog:
  effect: "latest" # Story 1.3: Using latest for compatibility
  "@effect/rpc": "latest"
  "@effect/schema": "latest"
  "@effect/platform": "latest"
  "@effect/platform-node": "latest"
  "@effect/cluster": "latest"
  "@effect/experimental": "latest"
  drizzle-orm: "0.45.1"
  "@anthropic-ai/sdk": "0.71.2"
  pino: "9.6.0"
```

## BMAD Development Workflow Rules

**Purpose:** Enforce clean git history and story-based development through branch-per-story workflow.

### Story Development Process

**Before starting any story with `/bmad-bmm-dev-story`:**

1. **Verify active phase:** Check sprint-status.yaml to confirm which stories are ready-for-dev
2. **Create feature branch** with consistent naming:
   ```bash
   git checkout -b feat/story-{epic-num}-{story-num}-{slug}
   # Example: feat/story-1-6-migrate-to-effect-platform-http
   ```
3. **Verify branch exists:**
   ```bash
   git status  # Should show your feature branch name, not master/main
   ```

**During development:**

- All work happens on the feature branch
- Commit incrementally as phases complete (e.g., one commit per phase if implementing multi-phase stories)
- Use conventional commit format: `feat: Description` or `feat(scope): Description`

**At story completion:**

- Run `/bmad-bmm-dev-story` with the story code
- Dev Agent will handle final testing and commit
- Agent commits with co-author signature:
  ```
  Co-Authored-By: Claude <model-signature>
  ```

**After dev completes:**

1. **Code Review:** Run `/bmad-bmm-code-review` on the feature branch in a fresh context
2. **Address Findings:** If issues found, return to dev branch and fix (create new commit)
3. **Re-review if needed:** If fixes were made, re-run code review to confirm approval
4. **Create Pull Request:** Once code review is approved, create a PR to merge to master
   - Push feature branch: `git push -u origin feat/story-{epic}-{num}-{slug}`
   - Create PR via GitHub/GitLab UI (see Pull Request Process section below)
   - Link to sprint-status.yaml and story artifact
5. **Merge to master:** After PR approval and any final checks, merge to master

### Branch Naming Convention

```
feat/story-{epic-num}-{story-num}-{slug}
├─ epic-num: Epic number (1-7 for current project)
├─ story-num: Story number within epic
└─ slug: URL-safe description of the story
```

**Examples:**

- `feat/story-1-2-integrate-better-auth`
- `feat/story-2-1-session-management-persistence`
- `feat/story-4-2-assessment-conversation-component`

### Commit Message Format

**Standard format:**

```
type(scope): Brief description

Detailed explanation of what was changed and why.

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

**Types:** `feat`, `fix`, `docs`, `chore`, `test`, `ci`, `refactor`, `perf`, `style`, `build`, `revert`

**Examples:**

- `feat: Add user authentication`
- `fix(api): Resolve session timeout issue`
- `docs: Update README with setup instructions`

**Multi-phase work:**

- One commit per major phase is acceptable
- Later commits can be: `feat(scope): Phase N - Description`

Example:

```
feat(http): Migrate to Effect/Platform HTTP with Better Auth

## Summary
Successfully migrated from Express.js to Effect/Platform HTTP...

## Changes

### HTTP Contracts Migration (Phase 1)
- [details]

### HTTP Handlers (Phase 2)
- [details]

[... other phases ...]
```

### Safety Checks

**Never commit directly to master/main.** CI/CD should enforce this, but manual checks:

```bash
# Before creating branch
git status  # Should show "On branch master" or "On branch main"

# After creating branch
git status  # Should show "On branch feat/story-..." or similar

# Before committing
git branch  # Should show * next to your feature branch
```

### Pull Request Process

**Timing:** Create PR after code review is approved and any fixes are committed.

1. **Push feature branch** (if not already pushed):

   ```bash
   git push -u origin feat/story-{epic}-{num}-{slug}
   # Example: git push -u origin feat/story-1-6-migrate-to-effect-platform-http
   ```

2. **Create PR from GitHub UI:**

   GitHub will show a prompt to create a PR when you push. Alternatively:
   - Visit: https://github.com/Wysnard/big-ocean/pull/new/{your-branch-name}
   - Or: Go to Pull Requests tab → New Pull Request → select your branch

3. **Fill PR details:**

   - **Title:** `Story {epic}.{num}: {Brief Description}`
     - Example: `Story 1.6: Migrate to Effect/Platform HTTP with Better Auth`

   - **Description template:**
     ```markdown
     ## Summary
     Brief description of what this story accomplishes.

     ## Changes
     - List of key changes
     - Reference any related commits or phases

     ## Story Artifact
     Link to: `_bmad-output/implementation-artifacts/story-{epic}-{num}-*.md`

     ## Checklist
     - [x] Passes all linting (`pnpm lint`)
     - [x] TypeScript compilation successful (`pnpm build`)
     - [x] Code review completed (`/bmad-bmm-code-review`)
     - [x] Related tests pass
     - [x] Story artifact updated in sprint-status.yaml
     ```

4. **Review & Merge:**

   - Wait for any additional review/approval (if required by your team)
   - Merge strategy:
     - **Squash & Merge** if multiple work commits (cleaner history)
     - **Create Merge Commit** if commits are logically separated by phase
   - Delete feature branch after merging

5. **Verify merge:**

   ```bash
   git checkout master
   git pull origin master
   git log --oneline -5  # Verify your commits are there
   ```

### Complete Story Workflow Summary

**Every story must follow this complete workflow:**

```
1. Create Branch
   git checkout -b feat/story-{epic}-{num}-{slug}

2. Develop
   /bmad-bmm-dev-story {epic}-{num}

3. Code Review
   /bmad-bmm-code-review

4. Fix Issues (if any)
   git add .
   git commit -m "fix: address code review findings"
   git push

5. Re-review if Fixes Needed
   /bmad-bmm-code-review (again if changes were made)

6. Create Pull Request ← MANDATORY
   git push -u origin feat/story-{epic}-{num}-{slug}
   Create PR via GitHub UI
   - Title: Story {epic}.{num}: Description
   - Link to story artifact
   - Include checklist

7. Merge to Master
   After approval, merge PR to master
   Delete feature branch
```

**Key Rule:** Story is NOT considered complete until:
- ✅ Code review passed
- ✅ All fixes committed
- ✅ Pull Request created
- ✅ PR merged to master

**Violation:** Committing directly to master bypasses this protection and is not allowed.

### Current Branch Status

- **Main branch:** `master`
- **Active branch:** Check with `git status` / `git branch`
- **Convention:** Always feature branches for user stories, except hotfixes
- **PR Required:** Every story must have a PR before merging to master
