# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

**Related docs:** [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | [COMMANDS.md](./docs/COMMANDS.md) | [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | [NAMING-CONVENTIONS.md](./docs/NAMING-CONVENTIONS.md) | [COMPLETED-STORIES.md](./docs/COMPLETED-STORIES.md) | [API-CONTRACT-SPECIFICATION.md](./docs/API-CONTRACT-SPECIFICATION.md)

## Repository Overview

**big-ocean** is a sophisticated psychological profiling platform built on the Big Five personality framework. It's a monorepo using [Turbo](https://turbo.build) and [pnpm workspaces](https://pnpm.io) with a clear separation between frontend, backend, shared packages, and infrastructure.

**Core Vision:** Conversational, coherence-based personality assessment via LLM agents → scientific research integration → memorable archetypes → social features for comparison and discovery.

**Node requirement:** >= 20
**Package manager:** pnpm@10.4.1

## Monorepo Structure

```
apps/
  ├── front/          # TanStack Start frontend (React 19, full-stack SSR)
  └── api/            # Node.js backend with Effect-ts and LangGraph
packages/
  ├── domain/         # Core types, schemas, repository interfaces
  ├── contracts/      # Effect/HTTP contracts and schema definitions
  ├── infrastructure/ # Repository implementations, DB schema (Drizzle)
  ├── ui/             # Shared React components (shadcn/ui based)
  ├── lint/           # Shared Biome linting configuration
  └── typescript-config/
```

### Apps

- **front** (`port 3000`): TanStack Start SSR frontend - React 19, TanStack Router/Query/Form/DB, ElectricSQL, shadcn/ui, Tailwind v4
- **api** (`port 4000`): Effect-ts backend - hexagonal architecture, LangGraph multi-agent, Drizzle + PostgreSQL, Better Auth
  - Health: `GET /health` | API: `/api/*`
  - Structure: `src/handlers/` (HTTP adapters) → `src/use-cases/` (business logic)

### Packages

- **domain**: Repository interfaces (Context.Tag), schemas, branded types, domain errors - pure abstractions
- **contracts**: HTTP API definitions (HttpApiGroup/HttpApiEndpoint) shared frontend ↔ backend
- **infrastructure**: Repository implementations (`*RepositoryLive`), Drizzle DB schema, Pino logger
- **ui**: shadcn/ui component library
- **lint** / **typescript-config**: Shared configurations

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
- `pnpm db:migrate` - Apply Drizzle migrations
- `pnpm db:generate` - Generate migration from schema changes

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

**Use-Case Pattern:** `Effect.gen` + `yield*` to access repositories → return typed result with errors in signature.

**Testing:** Provide `TestLayer` with mock implementations via `Effect.provide()`.

**Error Location Rules:** HTTP-facing errors MUST be in `contracts/src/errors.ts` (Schema.TaggedError). Infrastructure errors are co-located with repository interfaces in `domain/src/repositories/`. Use-cases throw contract errors directly. See [Error Architecture](./docs/ARCHITECTURE.md#error-architecture--location-rules) for complete rules.

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for full examples and ADR-6 details.

### Workspace Dependencies

Packages use `workspace:*` and `workspace:^` to reference other packages in the monorepo. This ensures they're always in sync with local versions.

**Dependency Graph:**

```
apps/front     → contracts, domain, ui
apps/api       → contracts, domain, infrastructure
contracts      → domain (schema imports)
infrastructure → domain (DB schema lives here)
ui             → (independent component library)
```

### Domain Package Structure

```
packages/domain/src/
├── schemas/      # Effect Schema definitions
├── errors/       # Tagged Error types
├── types/        # Branded types (userId, sessionId)
├── constants/    # Big Five traits, facets
├── utils/        # Pure domain functions (OCEAN code gen, confidence calc)
└── repositories/ # Context.Tag interfaces
```

### OCEAN Code Generation (Story 3.1)

Pure function that deterministically maps 30 facet scores to a 5-letter OCEAN code (e.g., "HHMHM").

**Key File:** `packages/domain/src/utils/ocean-code-generator.ts`

**Algorithm:** Sum 6 facets per trait (0-120) → map to level (L/M/H) → concatenate in OCEAN order.

**Thresholds:** 0-40=L, 40-80=M, 80-120=H

```typescript
import { generateOceanCode } from "@workspace/domain";
const code = generateOceanCode(facetScoresMap); // → "HHMHM"
```

### Effect/Platform HTTP Contracts (Story 1.6 ✅)

Type-safe HTTP API contracts using @effect/platform and @effect/schema.

**Key Files:**
- Contract definitions: `packages/contracts/src/http/groups/*.ts`
- Handler implementations: `apps/api/src/handlers/*.ts`
- Server setup: `apps/api/src/index.ts`

**Pattern:** `HttpApiGroup.make()` → `HttpApiEndpoint` → `HttpApiBuilder.group()` handlers

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for full examples.

### Multi-Agent System (LangGraph)

**Architecture:** Orchestrator → Nerin (conversational) → Analyzer + Scorer (batch every 3 msgs)

**Big Five Framework:** 5 traits × 6 facets = 30 facets total
- Constants: `packages/domain/src/constants/big-five.ts`
- Scoring triggers every 3 messages with recency-weighted averaging

**Orchestrator Repository (Story 2.4):**
- Interface: `packages/domain/src/repositories/orchestrator.repository.ts`
- Graph Interface: `packages/domain/src/repositories/orchestrator-graph.repository.ts`
- Checkpointer Interface: `packages/domain/src/repositories/checkpointer.repository.ts`
- Production Layer: `packages/infrastructure/src/repositories/orchestrator.langgraph.repository.ts`
- Graph Layer: `packages/infrastructure/src/repositories/orchestrator-graph.langgraph.repository.ts`

**LangGraph Effect DI Pattern:**
```
OrchestratorRepository (pure Effect, no bridging)
    └── OrchestratorGraphRepository (bridges Effect → LangGraph async internally)
            └── CheckpointerRepository (PostgresSaver or MemorySaver)
            └── NerinAgentRepository, AnalyzerRepository, ScorerRepository
```
- Bridge logic (Effect.runPromise) is **internal** to `OrchestratorGraphLangGraphRepositoryLive`
- External code only sees Effect-based APIs - no `OrchestratorDependencies` interface exposed
- Graph compilation happens once during layer construction

**Key Routing Logic:**
1. **Budget Check FIRST** - Throws `BudgetPausedError` if `dailyCostUsed + MESSAGE_COST >= $75`
2. **Steering Calculation** - Pure outlier detection: `confidence < (mean - stddev)` identifies weakest facet
   - Generates natural language `steeringHint` from facet target (e.g., "Explore how they organize their space...")
   - **Nerin receives both `facetScores` and `steeringHint`** for precise conversation guidance
3. **Always Route to Nerin** - Every message gets conversational response with facet-level context
4. **Batch Trigger** - Every 3rd message (`messageCount % 3 === 0`) runs Analyzer + Scorer

**Error Types:**
- `BudgetPausedError` - Assessment paused, resume next day (includes `resumeAfter` timestamp)
- `OrchestrationError` - Generic routing/pipeline failure
- `PrecisionGapError` - Precision calculation failure (422)

**Nerin Data Flow (Facet-Level Granularity):**

Nerin operates at **facet-level** (30 facets) rather than trait-level (5 traits) for precise conversational steering:

```typescript
// Router calculates steering from facetScores
const steeringTarget = getSteeringTarget(facetScores);  // e.g., "orderliness"
const steeringHint = getSteeringHint(steeringTarget);   // e.g., "Explore how they organize..."

// Nerin receives facet-level data
nerinAgent.invoke({
  sessionId,
  messages,
  facetScores,      // 30 facets with scores + confidence
  steeringHint,     // Natural language guidance
  // NOT trait-level precision (deprecated pattern)
});
```

**Data Flow Principle:** Work with primitives (facetScores), derive aggregates (traitScores) on demand.
- **Input:** Use-case provides `facetScores` (30 facets)
- **Steering:** Router calculates single weakest outlier facet
- **Nerin:** Receives facet-level context for natural conversation
- **Output:** Scorer transforms `facetScores` → `traitScores` for user display

**Use-Case Integration:**
```typescript
// send-message.use-case.ts uses Orchestrator instead of direct Nerin
const result = yield* orchestrator.processMessage({
  sessionId, userMessage, messages, messageCount,
  precision, dailyCostUsed, facetScores
});
// Returns: nerinResponse, tokenUsage, costIncurred, facetEvidence?, facetScores?, traitScores?
```

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for agent flow diagrams and scoring algorithm.

### Cost Tracking & Rate Limiting (Story 2.5)

**Budget Enforcement:** $75 daily cost limit (configurable via `DAILY_COST_LIMIT` env var)
**Rate Limiting:** 1 new assessment per user per day (unlimited message resumption)

**CostGuard Repository (Story 2.2.5 + 2.5):**
- Interface: `packages/domain/src/repositories/cost-guard.repository.ts`
- Implementation: `packages/infrastructure/src/repositories/cost-guard.redis.repository.ts`
- Methods:
  - `incrementDailyCost(userId, costCents)` - Atomic cost tracking
  - `getDailyCost(userId)` - Get current daily spend (cents)
  - `canStartAssessment(userId)` - Check if user can start new assessment
  - `recordAssessmentStart(userId)` - Atomically record assessment start with overflow protection

**Redis Key Patterns:**
- Cost tracking: `cost:{userId}:{YYYY-MM-DD}` (TTL: 48 hours)
- Rate limiting: `assessments:{userId}:{YYYY-MM-DD}` (TTL: 48 hours)
- Daily reset: Keys automatically expire, new day = fresh counters

**Cost Calculation Formula:**
```typescript
// Story 2.2.5: Anthropic Claude pricing
const costCents = Math.ceil(
  (inputTokens / 1_000_000) * 0.003 +  // $3 per 1M input tokens
  (outputTokens / 1_000_000) * 0.015    // $15 per 1M output tokens
) * 100;
```

**Budget Check Flow (Story 2.4):**
1. Router node checks: `dailyCostUsed + MESSAGE_COST_ESTIMATE > dailyCostLimit`
2. If exceeded: Throw `BudgetPausedError` with `resumeAfter` = next day midnight UTC
3. Session state preserved for resumption
4. HTTP 503 response with countdown timer

**Rate Limiting Flow (Story 2.5):**
1. `start-assessment` use-case checks `canStartAssessment(userId)`
2. If limit exceeded: Throw `RateLimitExceeded` with `resetAt` = next day midnight UTC
3. HTTP 429 response with retry-after header
4. Users can resume existing assessments (no rate limit on resume)
5. Anonymous users bypass rate limiting

**Date Utilities:**
- `getUTCDateKey()` - Returns `YYYY-MM-DD` for Redis keys
- `getNextDayMidnightUTC()` - Returns next day 00:00:00 UTC Date object
- Location: `packages/domain/src/utils/date.utils.ts`

**Structured Logging (Story 2.5):**
All cost events logged with Pino for analytics:
- Assessment start: `{ userId, count, dateKey }`
- Cost increment: `{ userId, costCents, newDailyTotal, dateKey }`
- Rate limit check: `{ userId, currentCount, limit, canStart, dateKey }`
- Rate limit exceeded: `{ userId, currentCount, limit, resetAt, dateKey }`

**Error Types:**
- `RateLimitExceeded` (429) - Daily assessment limit reached
- `BudgetPausedError` (503) - Daily cost budget exceeded
- `RedisOperationError` (500) - Redis connectivity/operation failure

### Database & Sync

- **Backend:** Drizzle ORM + PostgreSQL (`packages/infrastructure/src/db/drizzle/schema.ts`)
- **Frontend:** ElectricSQL + TanStack DB for local-first reactive sync
- **Migrations:** Managed by `drizzle-kit` — run `pnpm db:migrate` to apply, `pnpm db:generate` to create new migrations
- **Docker:** Migrations run automatically on backend startup via `docker-entrypoint.sh`
- **Config:** `drizzle.config.ts` at repo root (uses `tablesFilter` to ignore LangGraph `checkpoint_*` tables)

**Hard Rule:** No business logic in handlers - all logic belongs in use-cases.

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

## Testing

Uses [@effect/vitest](https://github.com/Effect-TS/effect/tree/main/packages/vitest) with dependency injection via Test Layers.

**Commands:**
```bash
pnpm test:run          # Run all tests
pnpm test:watch        # Watch mode
pnpm --filter=api test # API tests only
pnpm test:coverage     # With coverage
```

**Key Pattern:** Provide `TestRepositoriesLayer` (in `apps/api/src/test-utils/test-layers.ts`) to all use-case tests:

```typescript
it.effect('should work', () =>
  Effect.gen(function* () {
    const result = yield* myUseCase({ input: 'test' })
    expect(result).toBeDefined()
  }).pipe(Effect.provide(TestRepositoriesLayer))
)
```

### Mock Architecture (`__mocks__` + `vi.mock()` Pattern)

Mock implementations are co-located with their repository implementations using [Vitest's `__mocks__` auto-resolution](https://vitest.dev/guide/mocking/modules):

```
packages/infrastructure/src/repositories/
├── assessment-session.drizzle.repository.ts    # Production implementation
├── orchestrator.langgraph.repository.ts
├── ...
└── __mocks__/
    ├── assessment-session.drizzle.repository.ts  # In-memory mock Layer
    ├── orchestrator.langgraph.repository.ts      # Deterministic mock with business logic
    └── ...                                       # 11 mock files total

packages/domain/src/config/
├── app-config.ts                           # Interface
└── __mocks__/
    └── app-config.ts                       # Test config defaults (uses vi.importActual)
```

**Each `__mocks__` file:**
- Exports the same Live layer name as the real module (e.g., `AssessmentSessionDrizzleRepositoryLive`)
- Implements `Layer.succeed(Tag, implementation)` with in-memory behavior
- Imports Context.Tags directly from `@workspace/domain`

**How to use in test files** — call `vi.mock()` with the infrastructure module path (no factory), then import the Live layer. Vitest auto-resolves to the `__mocks__` sibling:
```typescript
import { vi } from "vitest";

// Activate mocking — Vitest auto-resolves to __mocks__ siblings
vi.mock("@workspace/infrastructure/repositories/cost-guard.redis.repository");

// Import Live layer — Vitest replaces with __mocks__ version
import { CostGuardRedisRepositoryLive } from "@workspace/infrastructure/repositories/cost-guard.redis.repository";

// Compose local TestLayer with only the dependencies this test needs
const TestLayer = Layer.mergeAll(CostGuardRedisRepositoryLive, LoggerPinoRepositoryLive);
```

**Important:** Never import directly from `__mocks__/` paths. Always use `vi.mock()` + original paths.

**No centralized `TestRepositoriesLayer`** — each test file declares its own `vi.mock()` calls and composes a minimal local `TestLayer` with only the services it needs via `Layer.mergeAll(...)`.

**Test utilities:**
- `it.effect()` - Test Effect programs with TestClock injected
- `it.scoped` - Auto-cleanup for resources
- `Effect.exit()` - Capture failures for assertion
- `TestClock.adjust()` - Virtual time control

See `apps/api/src/__tests__/` for examples.

## Integration Testing (Docker)

Validates HTTP stack with Dockerized API before Railway deployment.

```bash
pnpm test:integration       # Run all (auto Docker lifecycle)
pnpm test:integration:watch # Watch mode
pnpm docker:test:up         # Manual: start test env
pnpm docker:test:down       # Manual: stop and clean
```

**Ports:** Dev (API 4000, PG 5432) / Test (API 4001, PG 5433)

**LLM Mocking:** `MOCK_LLM=true` swaps real Claude for deterministic mock responses.

**Three-tier strategy:** Unit (mock repos) → Integration (Docker) → Real LLM ($$)

See `apps/api/tests/integration/README.md` for details.

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
- **Auto-fix**: `pnpm lint:fix` applies all safe Biome fixes across the monorepo
- **Pre-commit hook**: Automatically runs Biome check with auto-fix on staged files

## Type Safety Patterns

- **Bare imports** - No `.js` extensions (bundler mode)
- **Workspace imports** - `@workspace/domain`, `@workspace/contracts`, etc.
- **Type imports** - Use `import type` for type-only imports (Biome enforced)

**Avoid `as any`** - Use type guards, typed arrays, or `unknown` instead. Acceptable with comment for: test mocks, complex generics (LangGraph), generated files, external library compat.

**Key patterns:**
- **Branded types** - Type-safe IDs (`UserId`, `SessionId`) prevent accidental mixing
- **Discriminated unions** - Tagged `_tag` for exhaustive matching (Effect provides this)
- **Schema transforms** - `S.transform()` for validated external → domain conversions

**Domain types** from `@workspace/domain`: `TraitName`, `FacetName`, `BIG_FIVE_TRAITS`, `ALL_FACETS`

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
