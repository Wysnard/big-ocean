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
5. **Infrastructure** (`packages/infrastructure`): Repository implementations (Drizzle, Anthropic, Pino, Redis, etc.)

**Hard Rule:** Handlers extract request data and call use-cases. No conditional logic, validation, or orchestration in handlers. All business logic belongs in use-cases.

**Quick Discovery Pattern:**

- Need a repository interface? Check `packages/domain/src/repositories/{name}.repository.ts` - this is the source of truth
- Once you have the interface, find the implementation (Drizzle, Anthropic, Redis, etc.) in `packages/infrastructure/src/repositories/`
- Mock implementations live in `packages/infrastructure/src/repositories/__mocks__/`

**Key Benefits:**

- **Testability**: Use-cases tested in isolation with test implementations
- **Flexibility**: Swap implementations without changing business logic
- **Clarity**: Each layer has single responsibility
- **Effect-ts native**: Context.Tag and Layer system for DI

## Key Files Inventory

**Use-Cases** (`apps/api/src/use-cases/` — 14 files):
- `start-assessment.use-case.ts` — Session creation + cost reservation
- `send-message.use-case.ts` — Core message pipeline (ConversAnalyzer → formulas → steering → Nerin)
- `get-results.use-case.ts` — Assessment results retrieval
- `create-shareable-profile.use-case.ts` / `toggle-profile-visibility.use-case.ts` — Public profiles
- `get-public-profile.use-case.ts` — Profile viewing with archetype derivation
- `save-facet-evidence.use-case.ts` / `get-facet-evidence.use-case.ts` / `get-message-evidence.use-case.ts` — Evidence CRUD
- `calculate-confidence.use-case.ts` / `update-facet-scores.use-case.ts` — Score computation
- `list-user-sessions.use-case.ts` / `resume-session.use-case.ts` — Session management

**Domain Repository Interfaces** (`packages/domain/src/repositories/` — 14 files):
- `assessment-session.repository.ts` / `assessment-message.repository.ts` — Core session data
- `conversanalyzer.repository.ts` — Haiku analysis (Phase 2)
- `conversation-evidence.repository.ts` — Lean per-message evidence (Phase 2)
- `nerin-agent.repository.ts` — Nerin AI agent
- `cost-guard.repository.ts` — Rate limiting + budget enforcement
- `redis.repository.ts` — Redis operations
- `public-profile.repository.ts` — Shareable profiles
- `logger.repository.ts` — Structured logging
- Legacy (pending removal in Epic 11): several Phase 1 interfaces — see `packages/domain/src/repositories/` for full list

**Infrastructure Implementations** (`packages/infrastructure/src/repositories/` — 23 files):
- Drizzle repositories for all DB-backed domains
- `conversanalyzer.anthropic.repository.ts` — Haiku LLM calls (Phase 2)
- `conversation-evidence.drizzle.repository.ts` — Evidence persistence (Phase 2)
- `cost-guard.redis.repository.ts` — Redis-based cost tracking
- `nerin-agent.mock.repository.ts` — Nerin agent (mock for testing)
- Legacy (pending removal in Epic 11): several Phase 1 implementations — see directory for full list

**Handlers** (`apps/api/src/handlers/`):
- `health.ts` — Health check endpoint
- `assessment.ts` — Assessment endpoints (start, send-message)
- `evidence.ts` — Evidence endpoints
- `profile.ts` — Public profile endpoints

**DB Schema:** `packages/infrastructure/src/db/drizzle/schema.ts`

## Assessment Pipeline (LLM Architecture)

The assessment uses a sequential Effect pipeline for message processing. No graph-based routing — the use-case directly composes the pipeline.

### Message Flow (Current — Phase 2)

```
User message arrives
  → Save user message to DB
  → Query conversation_evidence for session
  → ConversAnalyzer (Haiku) — extracts facet signals + domain tags
  → Save conversation_evidence rows (max 3 per message)
  → computeFacetMetrics(allEvidence) — pure domain function
  → computeSteeringTarget(metrics, previousDomain, config) — entropy-based domain selection
  → Nerin (Claude) responds with steering hint
  → Save AI message with target_domain + target_bigfive_facet
  → Return { response, messageCount, isFinalTurn }
```

### ConversAnalyzer (Haiku — runs on every message)

- **Purpose:** Extract basic facet signals + domain tags for formula-driven steering
- **Model:** Claude Haiku (fast, <1s)
- **Output:** `{ bigfiveFacet, score, confidence, domain }[]` — max 3 records per message
- **Repository:** `ConversanalyzerRepository` → `conversanalyzer.anthropic.repository.ts`
- **Use-case:** `analyzeMessage` (called within `sendMessage` pipeline)
- **Error handling:** Non-fatal. Retry once, then skip. Nerin responds with stale steering. ConversAnalyzer is a steering optimization — finalization re-analyzes ALL messages regardless.

### Formula-Driven Steering

Pure domain functions in `packages/domain/src/utils/formula.ts`:
- `computeFacetMetrics(evidence[])` — context-weighted scores, confidence (exponential saturation), signal power (cross-context entropy)
- `computeSteeringTarget(metrics, previousDomain, config)` — selects facet with lowest confidence/power gap, then picks domain that maximizes expected signal power gain with switch-cost penalty

No hand-crafted domain-to-facet mapping. The formula computes which domain would help which facet based on actual evidence distribution.

### FinAnalyzer (Sonnet — Epic 11, not yet implemented)

- **Purpose:** Re-analyze ALL messages at assessment end with full conversation context
- **Produces:** Portrait-quality `finalization_evidence` — the single source of truth for results
- **Architecture:** Will run during finalization flow, producing rich evidence (quotes, rawDomain, highlights)

### Two-Tier Evidence Model

| Table | Purpose | Schema | Lifecycle |
|-------|---------|--------|-----------|
| `conversation_evidence` | Steering (Haiku output) | Lean: `bigfive_facet, score, confidence, domain` | Kept for analytics |
| `finalization_evidence` | Results + portrait (Sonnet output) | Rich: + `raw_domain, quote, highlight_start, highlight_end` | Authoritative, linked to `assessment_results` |

**`conversation_evidence`** exists today (Epic 10). **`finalization_evidence`** will be added in Epic 11.

### Session Flow

```
Anonymous start → /api/assessment/start (no auth required)
  → Chat with Nerin (ConversAnalyzer on every message)
  → Message count reaches MESSAGE_THRESHOLD (30)
  → Frontend shows auth gate
  → POST /api/assessment/generate-results (auth required, Epic 11)
  → FinAnalyzer + portrait generation → assessment_results
  → Redirect to results page
```

## Cost Tracking & Rate Limiting

Redis fixed-window pattern with fail-open resilience.

**Redis Key Patterns:**
- Cost tracking: `cost:{userId}:{YYYY-MM-DD}` (TTL: 48 hours)
- Rate limiting: `assessments:{userId}:{YYYY-MM-DD}` (TTL: 48 hours)
- Daily reset: Keys automatically expire, new day = fresh counters

**Fail-Open Pattern:** If Redis is unavailable, the system allows the request and logs the failure. Cost tracking is advisory, not a hard gate. This prevents Redis outages from blocking all conversations.

**Concurrency Control:** `pg_try_advisory_lock(session_id)` — non-blocking. Prevents concurrent message processing on the same session. Returns 409 if lock held.

**Per-user limits:**
- Daily assessment count limit (configurable via `AppConfig`)
- Daily cost budget (configurable via `AppConfig`)
- Message rate limit: 2 messages/minute

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
├── constants/     # Domain constants (traits, facets, life domains, validation bounds)
├── utils/         # Pure domain functions (OCEAN code gen, formula, confidence calc)
├── config/        # AppConfig interface + defaults
└── repositories/  # Context.Tag interfaces (ports)
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

**Pattern:** `HttpApiGroup.make()` → `HttpApiEndpoint` → `HttpApiBuilder.group()` handlers

See `packages/contracts/src/http/groups/` for contract definitions and `apps/api/src/handlers/` for implementations.

## Use-Case Pattern

```typescript
export const sendMessage = (input: SendMessageInput) =>
  Effect.gen(function* () {
    const sessionRepo = yield* AssessmentSessionRepository;
    const messageRepo = yield* AssessmentMessageRepository;
    const logger = yield* LoggerRepository;

    const session = yield* sessionRepo.getSession(input.sessionId);
    yield* messageRepo.saveMessage(input.sessionId, "user", input.message);
    // ... business logic
    return { response, precision };
  });
```

**Key Pattern:** `Effect.gen` + `yield*` to access repositories → return typed result with errors in signature.

## Testing Pattern

Uses `@effect/vitest` with `__mocks__/` co-location pattern. Each test file declares its own `vi.mock()` calls and composes a minimal local `TestLayer` with only the services it needs.

```typescript
import { vi } from "vitest";
vi.mock("@workspace/infrastructure/repositories/cost-guard.redis.repository");

import { describe, expect, it } from "@effect/vitest";
import { CostGuardRedisRepositoryLive } from "@workspace/infrastructure/repositories/cost-guard.redis.repository";

const TestLayer = Layer.mergeAll(CostGuardRedisRepositoryLive, LoggerPinoRepositoryLive);
```

## Database (Drizzle ORM + PostgreSQL)

Type-safe database access using Drizzle ORM with PostgreSQL. Schema lives in `packages/infrastructure/src/db/drizzle/schema.ts`.

**Key Tables:** `assessment_sessions`, `assessment_messages`, `conversation_evidence`, `public_profiles`, `users`

**Key pgEnums:** `evidence_domain` (work, relationships, family, leisure, solo, other), `bigfive_facet_name` (30 facets)

> **Note (Story 2-9):** `facet_scores` and `trait_scores` tables were removed. Scores are now computed on-demand from evidence via pure functions.

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
