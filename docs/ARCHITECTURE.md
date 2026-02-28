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

**Use-Cases** (`apps/api/src/use-cases/` — 29 files):

*Core Assessment:*
- `start-assessment.use-case.ts` — Session creation + cost reservation
- `send-message.use-case.ts` — Core message pipeline (ConversAnalyzer → formulas → steering → Nerin)
- `get-results.use-case.ts` — Assessment results retrieval
- `get-transcript.use-case.ts` — Conversation transcript retrieval

*Finalization (Epic 11):*
- `generate-results.use-case.ts` — Triggers FinAnalyzer + result generation
- `get-finalization-status.use-case.ts` — Poll finalization progress
- `calculate-confidence.use-case.ts` / `update-facet-scores.use-case.ts` — Score computation

*Evidence:*
- `save-facet-evidence.use-case.ts` / `get-facet-evidence.use-case.ts` / `get-message-evidence.use-case.ts` — Evidence CRUD

*Profiles & Portraits (Epic 12):*
- `create-shareable-profile.use-case.ts` / `toggle-profile-visibility.use-case.ts` — Public profiles
- `get-public-profile.use-case.ts` — Profile viewing with archetype derivation
- `generate-full-portrait.use-case.ts` / `get-portrait-status.use-case.ts` — Portrait generation

*Monetization (Epic 13):*
- `process-purchase.use-case.ts` / `get-credits.use-case.ts` — Purchase + credit tracking

*Relationships (Epic 14):*
- `create-invitation.use-case.ts` / `accept-invitation.use-case.ts` / `refuse-invitation.use-case.ts` — Invitation flow
- `get-invitation-by-token.use-case.ts` / `list-invitations.use-case.ts` — Invitation queries
- `generate-relationship-analysis.use-case.ts` / `get-relationship-analysis.use-case.ts` / `get-relationship-state.use-case.ts` — Analysis

*Growth (Epic 15):*
- `join-waitlist.use-case.ts` — Waitlist signup

*Session Management:*
- `list-user-sessions.use-case.ts` / `resume-session.use-case.ts` — Session management

**Domain Repository Interfaces** (`packages/domain/src/repositories/` — 26 files):

*Core:*
- `assessment-session.repository.ts` / `assessment-message.repository.ts` — Session data
- `conversanalyzer.repository.ts` — Haiku analysis
- `conversation-evidence.repository.ts` — Lean per-message evidence
- `nerin-agent.repository.ts` — Nerin AI agent
- `cost-guard.repository.ts` / `redis.repository.ts` — Rate limiting + budget
- `logger.repository.ts` — Structured logging

*Finalization & Results (Epic 11):*
- `assessment-result.repository.ts` — Final assessment results
- `finalization-evidence.repository.ts` — Rich evidence for portraits
- `finanalyzer.repository.ts` / `analyzer.repository.ts` — LLM analysis
- `facet-evidence.repository.ts` — Legacy facet evidence

*Profiles & Portraits (Epic 12):*
- `public-profile.repository.ts` — Shareable profiles
- `portrait.repository.ts` / `portrait-generator.repository.ts` / `teaser-portrait.repository.ts` — Portrait generation & storage
- `profile-access-log.repository.ts` — Access audit trail

*Monetization (Epic 13):*
- `purchase-event.repository.ts` / `payment-gateway.repository.ts` — Purchases

*Relationships (Epic 14):*
- `relationship-invitation.repository.ts` / `relationship-analysis.repository.ts` / `relationship-analysis-generator.repository.ts` — Relationship flow

*Growth (Epic 15):*
- `waitlist.repository.ts` — Waitlist

**Infrastructure Implementations** (`packages/infrastructure/src/repositories/` — 40 files):
- Drizzle repositories for all DB-backed domains
- `conversanalyzer.anthropic.repository.ts` — Haiku LLM calls
- `finanalyzer.anthropic.repository.ts` / `finanalyzer.mock.repository.ts` — Sonnet finalization
- `nerin-agent.anthropic.repository.ts` — Nerin agent (LangGraph-based chat)
- `portrait-generator.claude.repository.ts` / `teaser-portrait.anthropic.repository.ts` — Portrait LLM
- `relationship-analysis-generator.anthropic.repository.ts` — Relationship analysis LLM
- `payment-gateway.polar.repository.ts` — Polar payment integration
- `cost-guard.redis.repository.ts` / `redis.ioredis.repository.ts` — Redis
- `logger.pino.repository.ts` — Pino logger
- Mock variants (`*.mock.repository.ts`) for testing

**Handlers** (`apps/api/src/handlers/` — 8 files):
- `health.ts` — Health check endpoint
- `assessment.ts` — Assessment endpoints (start, send-message, generate-results, finalization-status)
- `evidence.ts` — Evidence endpoints
- `profile.ts` — Public profile endpoints
- `portrait.ts` — Portrait generation & status
- `purchase.ts` — Purchase processing & credits
- `relationship.ts` — Invitations & relationship analysis
- `waitlist.ts` — Waitlist signup

**DB Schema:** `packages/infrastructure/src/db/drizzle/schema.ts`

**Key Tables:** `user`, `session`, `account`, `verification`, `assessment_sessions`, `assessment_messages`, `conversation_evidence`, `finalization_evidence`, `assessment_results`, `public_profiles`, `portraits`, `purchase_events`, `profile_access_log`, `waitlist_emails`, `relationship_invitations`, `relationship_analyses`

**Key pgEnums:** `evidence_domain` (work, relationships, family, leisure, solo, other), `bigfive_facet_name` (30 facets)

## Assessment Pipeline (LLM Architecture)

The assessment uses a sequential Effect pipeline for message processing. No graph-based routing — the use-case directly composes the pipeline.

### Message Flow

```
User message arrives
  → Save user message to DB
  → Query conversation_evidence for session
  → ConversAnalyzer (Haiku) — extracts facet signals + domain tags
  → Save conversation_evidence rows (max 3 per message)
  → computeFacetMetrics(allEvidence) — pure domain function
  → computeSteeringTarget(metrics, previousDomain, config) — entropy-based domain selection
  → Nerin (Claude via LangGraph) responds with steering hint
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

### FinAnalyzer (Sonnet — Epic 11)

- **Purpose:** Re-analyze ALL messages at assessment end with full conversation context
- **Produces:** Portrait-quality `finalization_evidence` — the single source of truth for results
- **Architecture:** Runs during finalization flow, producing rich evidence (quotes, rawDomain, highlights)
- **Repository:** `FinanalyzerRepository` → `finanalyzer.anthropic.repository.ts`

### Two-Tier Evidence Model

| Table | Purpose | Schema | Lifecycle |
|-------|---------|--------|-----------|
| `conversation_evidence` | Steering (Haiku output) | Lean: `bigfive_facet, score, confidence, domain` | Kept for analytics |
| `finalization_evidence` | Results + portrait (Sonnet output) | Rich: + `raw_domain, quote, highlight_start, highlight_end` | Authoritative, linked to `assessment_results` |

### Session Flow

```
Anonymous start → /api/assessment/start (no auth required)
  → Chat with Nerin (ConversAnalyzer on every message)
  → Message count reaches freeTierMessageThreshold (25 user messages)
  → Frontend shows auth gate
  → POST /api/assessment/generate-results (auth required)
  → FinAnalyzer + portrait generation → assessment_results
  → Redirect to results page
```

### LangGraph Status

- **Nerin agent** (`nerin-agent.anthropic.repository.ts`): Actively used for conversational responses via LangGraph

## Architectural Patterns

### Placeholder-Row Pattern (Async Generation)

Used for any resource that requires slow LLM generation (portraits, relationship analyses). The pattern has four parts:

**1. Insert placeholder row** — The triggering use-case inserts a DB row with `status: "generating"` and `updated_at` timestamp, then returns 202 immediately.

**2. Fork async generation** — The same use-case spawns the generation via `Effect.forkDaemon(generateX(...))`. The daemon runs independently; if it fails, the row stays in "generating" state.

**3. Client polls status endpoint** — A separate status use-case derives status from the row:
- Row missing → `"not_started"`
- `status: "generating"` and not stale → `"generating"`
- `status: "completed"` → `"completed"` (return content)
- `status: "generating"` and stale (age > threshold) → trigger lazy retry

**4. Lazy retry via staleness** — If the row has been "generating" too long (stale) and `retry_count < max_retries`, the status endpoint itself spawns a new `forkDaemon` and increments `retry_count`. This self-heals silently without requiring the original trigger.

**Used by:**
- `process-purchase.use-case.ts` → `generate-full-portrait.use-case.ts` (portraits table)
- `accept-invitation.use-case.ts` → `generate-relationship-analysis.use-case.ts` (relationship_analyses table)
- `get-portrait-status.use-case.ts` — status polling + lazy retry
- `get-relationship-state.use-case.ts` — status polling

**Key rule:** The triggering use-case (e.g., `process-purchase`) owns the placeholder insert + initial `forkDaemon`. The status use-case (e.g., `get-portrait-status`) owns staleness detection + retry. Generation use-cases (e.g., `generate-full-portrait`) are pure — they receive the row ID and update it on completion.

### Append-Only Purchase Events + Capability Derivation

Purchase events are append-only (`purchase_events` table). User capabilities (credits, unlocked features) are derived by aggregating events rather than maintaining mutable state.

### Circuit Breaker with Fail-Open Resilience

Redis-dependent features (cost tracking, rate limiting) use fail-open: if Redis is unavailable, the request proceeds and the failure is logged. Prevents Redis outages from blocking conversations.

### Fire-and-Forget Audit Logging

Profile access logging (`profile_access_log`) is fire-and-forget — failures don't block the response.

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
