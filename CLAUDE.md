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

The codebase follows **hexagonal architecture** with clear layer separation and dependency inversion using Effect-ts Context.Tag pattern.

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
