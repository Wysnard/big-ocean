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
  ├── eslint-config/
  └── typescript-config/
```

### Apps

- **front** (`port 3001`): TanStack Start full-stack SSR frontend with React 19, featuring:
  - TanStack Start framework for isomorphic React (SSR/streaming)
  - TanStack Router 1+ for file-based routing
  - TanStack Query 5+ for data fetching and caching
  - TanStack Form 1+ for form state management
  - TanStack DB 0+ for reactive state management
  - ElectricSQL (@electric-sql/client, @electric-sql/react) for local-first sync
  - shadcn/ui components with Tailwind CSS v4
  - Effect-ts for functional error handling and RPC client typing

- **api** (`port 4000`): Node.js backend featuring:
  - Effect-ts 3+ for functional programming and error handling
  - @effect/rpc 0+ for type-safe RPC contracts
  - @effect/schema 0+ for runtime validation and serialization
  - @langchain/langgraph 1+ for multi-agent orchestration
  - @anthropic-ai/sdk 0+ for Claude API integration
  - Drizzle ORM 0+ for type-safe database queries
  - PostgreSQL as primary database

### Packages

- **domain**: Core domain types and business logic exports
  - Schemas for users, sessions, personality traits, archetypes
  - Error definitions for domain-level errors
  - Branded types for type-safe IDs (userId, sessionId, etc.)

- **contracts**: Effect/RPC contract definitions using @effect/rpc and @effect/schema
  - Assessment RPC group (startAssessment, sendMessage, resumeSession, getResults)
  - Profile RPC group (getProfile, compareProfiles, findSimilar)
  - Streaming contract support for real-time responses from Nerin agent
  - Shared middleware tags for cross-protocol concerns

- **database**: Drizzle ORM schema and utilities
  - Tables: users, sessions, messages, trait_assessments, etc.
  - Migration scripts for PostgreSQL
  - Query builders and type-safe helpers

- **infrastructure**: Backend utilities and dependency injection
  - FiberRef-based request context management
  - Service layer bindings (database, logging, LLM)
  - withContextBridge utility for Effect Layer setup
  - PgDrizzle and ElectricSQL client initialization

- **ui**: Shared React component library built on shadcn/ui
  - Exports components from `./components/*`
  - Includes hooks for RPC interaction
  - Utilities for personality visualization and formatting

- **eslint-config**: Shared ESLint configuration used across packages
- **typescript-config**: Shared TypeScript configuration

## Common Commands

All commands run from repository root:

### Development

```bash
pnpm dev                      # Start all apps in dev mode (front + api)
pnpm dev --filter=front      # Run only frontend (TanStack Start, port 3001)
pnpm dev --filter=api        # Run only backend (Node.js, port 4000)
```

### Building & Testing

```bash
pnpm build                  # Build all packages and apps
pnpm lint                   # Lint all packages
pnpm format                 # Format all code with Prettier
```

### App-Specific Commands

**front** (TanStack Start frontend):

```bash
pnpm -C apps/front dev              # Start dev server with HMR (port 3001)
pnpm -C apps/front build            # Build for production (SSR)
pnpm -C apps/front start            # Start production server
pnpm -C apps/front lint             # Run ESLint
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

## Architecture & Key Patterns

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
├── schemas/          # Zod schemas for types
├── errors/           # Tagged Error types
├── types/            # Branded types (userId, sessionId, etc.)
└── constants/        # Domain constants (trait names, facets, etc.)
```

**Example Domain Export:**
```typescript
// packages/domain/src/schemas/index.ts
export const UserProfileSchema = z.object({
  id: z.string().brand<"UserId">(),
  name: z.string(),
  traits: PersonalityTraitsSchema,
  // ... more fields
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
```

### Effect/RPC Contracts

The `@workspace/contracts` package defines type-safe RPC contracts using Effect/RPC and Effect Schema.

**Contract Structure** (in `packages/contracts/src/index.ts`):

```typescript
import * as S from "@effect/schema/Schema";
import * as Rpc from "@effect/rpc/Rpc";

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
      precision: S.struct({ // Updated trait precision
        openness: S.number,
        conscientiousness: S.number,
        // ... other traits
      }),
    }),
    failure: SessionError,
  }),
  // ... other procedures
});
```

**Procedure Implementation** (in `apps/api/src/handlers/`):

```typescript
import * as Effect from "effect";
import * as Rpc from "@effect/rpc/Rpc";
import { AssessmentService } from "@workspace/contracts";

export const AssessmentHandlers = Rpc.handler(AssessmentService)({
  startAssessment: ({ userId }) =>
    Effect.gen(function* () {
      const sessionId = yield* generateSessionId();
      yield* persistSession(sessionId, userId);
      return { sessionId, createdAt: new Date() };
    }),

  sendMessage: ({ sessionId, message }) =>
    Effect.gen(function* () {
      const session = yield* loadSession(sessionId);
      const nerinResponse = yield* Nerin.chat(message, session);
      // ... analysis, scoring, orchestration
      return { response: nerinResponse, precision: updatedPrecision };
    }),

  // ... other handlers
});
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
    queryFn: () => electric.db.session.findUnique({
      where: { id: sessionId }
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

## Linting & Code Quality

- **Root level**: ESLint with shared config
- **web app**: Next.js ESLint (configured for React 19)
- **api app**: ESLint (configured for Node.js)
- **ui package**: ESLint with zero-warnings policy
- **contracts/domain/infrastructure packages**: ESLint with zero-warnings policy
- **Format all**: `pnpm format` runs Prettier on all code

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
- Effect 3.19.14 for client-side error handling

**Backend Stack:**
- Effect 3.19.14, @effect/rpc 0.73.0, @effect/schema 0.71.0
- LangChain LangGraph 1.1+, Anthropic SDK 0.71.2
- Drizzle ORM 0.45.1, PostgreSQL
- Winston for structured logging

**Shared:**
- Zod 4.2.1 (for schema validation before Effect Schema migration)
- TypeScript 5.7+, pnpm 10.4.1
