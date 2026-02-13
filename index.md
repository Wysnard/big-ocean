# Project Root Index

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Claude Code AI assistant guidance and project context
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Railway environment variables and deployment config
- **[DOCKER.md](./DOCKER.md)** - Docker Compose local development guide
- **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** - Multi-service Railway deployment architecture
- **[RAILWAY_SETUP.md](./RAILWAY_SETUP.md)** - Step-by-step Railway project setup walkthrough
- **[README.md](./README.md)** - Project overview and Big Five personality framework

## Configuration

- **[biome.json](./biome.json)** - Biome linter and formatter settings
- **[compose.yaml](./compose.yaml)** - Docker Compose development services (Postgres, API)
- **[compose.test.yaml](./compose.test.yaml)** - Docker Compose integration test environment
- **[drizzle.config.ts](./drizzle.config.ts)** - Drizzle Kit migration and schema config
- **[opencode.jsonc](./opencode.jsonc)** - OpenCode AI tool MCP server config
- **[package.json](./package.json)** - Root monorepo scripts and dependencies
- **[pnpm-lock.yaml](./pnpm-lock.yaml)** - Locked dependency versions
- **[pnpm-workspace.yaml](./pnpm-workspace.yaml)** - Workspace packages and dependency catalog
- **[tsconfig.json](./tsconfig.json)** - Root TypeScript config extending shared base
- **[turbo.json](./turbo.json)** - Turborepo task pipeline configuration
- **[vitest.config.ts](./vitest.config.ts)** - Vitest base config with aliases and coverage
- **[vitest.setup.ts](./vitest.setup.ts)** - Universal test setup (jsdom polyfills)
- **[vitest.workspace.ts](./vitest.workspace.ts)** - Vitest workspace (frontend vs backend environments)

## Apps

### apps/api/

Node.js backend with Effect-ts, hexagonal architecture, LangGraph multi-agent, and Drizzle + PostgreSQL.

### apps/front/

TanStack Start SSR frontend with React 19, TanStack Router/Query, ElectricSQL, shadcn/ui, and Tailwind v4.

## Packages

### packages/contracts/

Effect/HTTP API contracts shared between frontend and backend.

### packages/domain/

Core types, schemas, repository interfaces, branded types, and domain errors.

### packages/infrastructure/

Repository implementations (Drizzle), DB schema, Pino logger, and auth schema.

### packages/lint/

Shared Biome linting configuration for all packages.

### packages/typescript-config/

Shared TypeScript compiler configuration.

### packages/ui/

Shared React component library based on shadcn/ui.

## Subdirectories

### docs/

- **[API-CONTRACT-SPECIFICATION.md](./docs/API-CONTRACT-SPECIFICATION.md)** - Mandatory API contract field conventions
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Hexagonal architecture and key patterns
- **[COMMANDS.md](./docs/COMMANDS.md)** - Development command quick reference
- **[COMPLETED-STORIES.md](./docs/COMPLETED-STORIES.md)** - Deployed and stable implementation stories
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Production Railway deployment details
- **[FRONTEND.md](./docs/FRONTEND.md)** - Frontend development guidelines and patterns
- **[NAMING-CONVENTIONS.md](./docs/NAMING-CONVENTIONS.md)** - Component, branch, and commit naming rules

### docs/testing/

- **[tdd-guide.md](./docs/testing/tdd-guide.md)** - TDD workflow and red-green-refactor examples

### scripts/

- **[README.md](./scripts/README.md)** - Script reference for development and seeding
- **[dev.sh](./scripts/dev.sh)** - Start Docker Compose development environment
- **[dev-reset.sh](./scripts/dev-reset.sh)** - Reset dev environment (deletes all data)
- **[dev-stop.sh](./scripts/dev-stop.sh)** - Stop dev environment (preserves data)
- **[seed-completed-assessment.ts](./scripts/seed-completed-assessment.ts)** - Seed database with test assessment data

### docker/

- **[init-db-test.sql](./docker/init-db-test.sql)** - PostgreSQL schema init for integration tests

### drizzle/

Database migration files managed by Drizzle Kit.

### _bmad/

BMAD methodology configuration, templates, and task definitions.

### _bmad-output/

BMAD workflow output: planning artifacts, implementation artifacts, and user stories.
