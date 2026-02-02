# Reference Architecture: effect-worker-mono Pattern

**Source:** [backpine/effect-worker-mono](https://github.com/backpine/effect-worker-mono)

Your project will follow the production-ready monorepo pattern demonstrated by `effect-worker-mono`. This is an excellent reference for organizing Effect-TS + RPC in a type-safe, scalable way.

## How effect-worker-mono Aligns with big-ocean

### Applications Layer (Your Apps)

```
apps/
├── front/              # TanStack Start (React 19 full-stack SSR)
│   ├── src/
│   │   ├── routes/    # File-based routing
│   │   ├── server/    # Server functions
│   │   └── client/    # Client components
│   └── package.json
│
└── api/               # Node.js backend (Express/Fastify with Effect-ts)
    ├── src/
    │   ├── agents/    # LangGraph agents (Nerin, Analyzer, Scorer)
    │   ├── handlers/  # @effect/rpc handlers
    │   ├── services/  # Business logic layers
    │   ├── middleware/# Cost control, logging, auth
    │   └── index.ts   # App entry point
    └── package.json
```

### Shared Packages (Your Libraries)

```
packages/
├── domain/            # @workspace/domain
│   └── Branded types, domain errors, Big Five schemas, OCEAN constants
│
├── contracts/         # @workspace/contracts (CRITICAL - RPC Definitions)
│   ├── Assessment.rpc  # startAssessment, sendMessage, resumeSession, getResults
│   ├── Profile.rpc     # getProfile, compareProfiles, findSimilar
│   └── Middleware tags # Cost tracking, auth, logging
│
├── database/          # @workspace/database
│   ├── schema.ts      # Drizzle ORM tables (users, sessions, messages, etc.)
│   └── migrations/
│
├── infrastructure/    # @workspace/infrastructure (REQUEST CONTEXT)
│   ├── db.ts          # FiberRef bridge for database access
│   ├── llm.ts         # FiberRef bridge for LLM client
│   ├── cache.ts       # FiberRef bridge for Redis (cost tracking)
│   └── withContextBridge.ts  # Effect Layer setup
│
├── ui/                # @workspace/ui
│   └── React components (shadcn/ui based)
│
└── [build-config]/    # ESLint, TypeScript configs
```

## Key Design Patterns from effect-worker-mono Applied to big-ocean

### 1. FiberRef Bridge for Request-Scoped Dependencies

**Pattern:** Inject shared services (database, LLM client, cost tracker) via Effect's FiberRef, accessible throughout async contexts without parameter passing.

**Application in big-ocean:**

```typescript
// packages/infrastructure/src/context.ts
import { FiberRef } from "effect";

export const DatabaseRef = FiberRef.unsafeMake<Database>(null);
export const LLMClientRef = FiberRef.unsafeMake<AnthropicClient>(null);
export const CostTrackerRef = FiberRef.unsafeMake<CostTracker>(null);

// apps/api/src/handlers/assessment.ts
import { Effect } from "effect";
import { DatabaseRef, LLMClientRef } from "@workspace/infrastructure";

export const sendMessage = Rpc.rpcFunction({
  input: S.struct({ sessionId: S.string, message: S.string }),
  output: S.struct({ response: S.string, precision: S.number }),
  failure: SessionError,
})((input) =>
  Effect.gen(function* () {
    const db = yield* Effect.service(DatabaseRef);
    const llm = yield* Effect.service(LLMClientRef);

    // Use db and llm without passing as parameters
    const session = yield* loadSession(input.sessionId);
    const response = yield* callNerin(input.message, session);
    return { response, precision: session.precision };
  })
);
```

### 2. Middleware Tags for Cross-Cutting Concerns

**Pattern:** Define shared middleware tags in contracts; implement them in specific app layers (cost control, auth, logging).

**Application in big-ocean:**

```typescript
// packages/contracts/src/middleware.ts
import { Effect } from "effect";
import { Tag } from "effect";

export const CostGuard = Tag<{
  trackCost: (sessionId: string, tokens: number) => Effect.Effect<void>;
  checkBudget: (userId: string) => Effect.Effect<boolean>;
}>();

export const AuthGuard = Tag<{
  verifyUser: (token: string) => Effect.Effect<UserId>;
}>();

// apps/api/src/middleware/cost-guard.ts
export const costGuardImpl = CostGuard.of({
  trackCost: (sessionId, tokens) =>
    Effect.gen(function* () {
      const cache = yield* CostTrackerRef;
      yield* cache.incrementCost(sessionId, tokens);
    }),
  checkBudget: (userId) =>
    Effect.gen(function* () {
      const cache = yield* CostTrackerRef;
      const spent = yield* cache.getSpent(userId);
      return spent < DAILY_BUDGET;
    }),
});

// Provide in app layer
const app = Effect.provide(
  assessmentHandlers,
  Layer.succeed(CostGuard, costGuardImpl)
);
```

### 3. Type-Safe RPC Contracts as Contract-First Design

**Pattern:** Define all RPC procedures in contracts package with schema validation; handlers implement with guarantee of type safety.

**Application in big-ocean:**

```typescript
// packages/contracts/src/index.ts
import * as Rpc from "@effect/rpc/Rpc";
import * as S from "@effect/schema/Schema";

export const AssessmentService = Rpc.define({
  startAssessment: Rpc.rpcFunction({
    input: S.struct({ userId: S.optional(S.string) }),
    output: S.struct({ sessionId: S.string, createdAt: S.Date }),
    failure: SessionError,
  }),

  sendMessage: Rpc.rpcFunction({
    input: S.struct({
      sessionId: S.string,
      message: S.string,
    }),
    output: S.struct({
      response: S.string,
      precision: S.number,
      traits: TraitSummarySchema,
    }),
    failure: SessionError,
  }),

  getResults: Rpc.rpcFunction({
    input: S.struct({ sessionId: S.string }),
    output: S.struct({
      archetype: ArchetypeSchema,
      traits: AllTraitsSchema,
      facets: AllFacetsSchema,
    }),
    failure: SessionError,
  }),
});

// apps/api/src/handlers/assessment.ts
export const AssessmentHandlers = Rpc.handler(AssessmentService)({
  startAssessment: ({ userId }) =>
    Effect.gen(function* () {
      const sessionId = yield* generateSessionId();
      yield* persistSession(sessionId, userId);
      return { sessionId, createdAt: new Date() };
    }),

  sendMessage: ({ sessionId, message }) =>
    Effect.gen(function* () {
      const costGuard = yield* Effect.service(CostGuard);
      const budget = yield* costGuard.checkBudget(sessionId);

      if (!budget) {
        yield* costGuard.gracefulDegrade("Daily assessment limit reached");
      }

      // Call Nerin, track cost, update precision
      const session = yield* loadSession(sessionId);
      const { response, tokens } = yield* Nerin.chat(message, session);
      yield* costGuard.trackCost(sessionId, tokens);

      const { precision, traits } = yield* Analyzer.analyze(session);
      return { response, precision, traits };
    }),

  getResults: ({ sessionId }) =>
    Effect.gen(function* () {
      const session = yield* loadSession(sessionId);
      const archetype = getArchetype(session.oceanCode4Letter);
      return {
        archetype,
        traits: session.allTraits,
        facets: session.allFacets,
      };
    }),
});
```

## Monorepo Workspace Organization

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/**"
  - "packages/**"

catalog:
  effect: "3.19.14"
  "@effect/rpc": "0.73.0"
  "@effect/schema": "0.71.0"
  drizzle-orm: "0.45.1"
  "@anthropic-ai/sdk": "0.71.2"
  "react": "19.0.0"
  "@tanstack/start": "1.149.4"
  "tailwindcss": "4.0.0"
```

**Dependencies Flow (as per effect-worker-mono pattern):**

```
apps/front     → packages/contracts, domain, ui
apps/api       → packages/contracts, domain, database, infrastructure
contracts      → domain
infrastructure → domain, database
ui             → (independent)
```

## Project Initialization with effect-worker-mono Pattern

**Step 1: Frontend Setup**
```bash
pnpm create @tanstack/start@latest apps/front \
  --add-ons shadcn,tanstack-query \
  --package-manager pnpm
```

**Step 2: Backend Setup (Manual, following effect-worker-mono structure)**
```bash
mkdir -p apps/api/src/{agents,handlers,services,middleware,db}

pnpm -C apps/api add effect @effect/rpc @effect/schema \
  @langchain/langgraph @anthropic-ai/sdk \
  drizzle-orm pg redis
```

**Step 3: Shared Packages (Already in place, follow effect-worker-mono structure)**
- `packages/domain/` — Branded types, domain errors, Big Five schemas
- `packages/contracts/` — RPC definitions, middleware tags, shared error types
- `packages/database/` — Drizzle schema, migrations
- `packages/infrastructure/` — FiberRef bridges, Effect layers

## Why effect-worker-mono Pattern Works for big-ocean

✅ **Type Safety:** Contract-first design ensures handlers match RPC definitions
✅ **Composability:** FiberRef bridges decouple dependencies from handlers
✅ **Scalability:** Monorepo structure allows growing from frontend + one API to multiple services
✅ **Cost Control:** Middleware tags enable global cost tracking without handler pollution
✅ **Privacy:** RLS + RPC filtering follows the same pattern as effect-worker-mono's middleware
✅ **Testing:** Effect layers make mocking and testing straightforward
✅ **Maintainability:** Clear separation between contracts, handlers, and infrastructure

---
