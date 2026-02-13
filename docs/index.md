# big-ocean Documentation Index

Generated: 2026-02-12 | Scan Level: Deep | Mode: Initial Scan

## Project Overview

- **Type:** Monorepo (pnpm workspaces + Turbo) with 8 parts (2 apps + 6 packages)
- **Primary Languages:** TypeScript 5.7
- **Architecture:** Hexagonal (Ports and Adapters) with Effect-ts dependency injection
- **AI System:** Multi-agent LangGraph orchestration (Nerin + Analyzer)
- **Database:** PostgreSQL 16 + Drizzle ORM (8 tables)
- **Cache:** Redis (cost tracking, rate limiting)

---

## Quick Reference

### Backend API (apps/api)

- **Type:** backend
- **Stack:** Node.js, Effect-ts 3.19, LangGraph 1.1, Drizzle ORM, PostgreSQL, Redis, Better Auth, Pino
- **Entry Point:** src/index.ts (port 4000)
- **Architecture:** Hexagonal with Effect-ts Context.Tag DI
- **Key Directories:**
  - `src/handlers/` - HTTP adapters (thin controllers)
  - `src/use-cases/` - Pure business logic (main test target)
  - `src/agents/` - LangGraph agent implementations

### Frontend Web (apps/front)

- **Type:** web
- **Stack:** React 19, TanStack Start 1.132, Vite 7.1, Tailwind CSS 4, shadcn/ui
- **Entry Point:** src/routes/__root.tsx (port 3000)
- **Architecture:** Component-based, file-based routing, SSR-first
- **Key Directories:**
  - `src/routes/` - File-based routing (TanStack Router)
  - `src/components/` - React components
  - `src/lib/` - Utilities and helpers

### Shared Packages

| Package | Purpose |
|---------|---------|
| `@workspace/domain` | Repository interfaces (Context.Tag), schemas, branded types, domain errors |
| `@workspace/contracts` | Effect/HTTP API definitions shared frontend/backend |
| `@workspace/infrastructure` | Repository implementations, Drizzle DB schema |
| `@workspace/ui` | shadcn/ui component library |
| `@workspace/lint` | Shared Biome linting configuration |
| `@workspace/typescript-config` | Shared TypeScript configuration |

---

## Data Models

### Database Tables (8 total)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `user` | User accounts | id, name, email, emailVerified |
| `session` | Better Auth sessions | id, token, userId, expiresAt |
| `account` | OAuth/provider accounts | id, userId, providerId, accessToken |
| `verification` | Email verification tokens | id, identifier, value, expiresAt |
| `assessment_session` | Assessment conversation sessions | id, userId, status, messageCount |
| `assessment_message` | Conversation messages | id, sessionId, role, content |
| `facet_evidence` | Analyzer output (facet detections) | id, facetName, score, confidence, quote |
| `public_profile` | Shareable profile links | id, sessionId, oceanCode5, isPublic |

### Domain Types

- **Big Five Framework:** 5 traits x 6 facets = 30 facets total
- **OCEAN Code:** 5-letter code (e.g., "HHMHM") mapping traits to levels (L/M/H)
- **Branded Types:** `UserId`, `SessionId` for type-safe IDs

---

## Core Documentation

### Architecture and Design

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Hexagonal architecture, dependency injection, error handling patterns
- [FRONTEND.md](./FRONTEND.md) - Frontend styling patterns, component conventions, data attributes
- [NAMING-CONVENTIONS.md](./NAMING-CONVENTIONS.md) - Branch naming, commit format, component naming
- [API-CONTRACT-SPECIFICATION.md](./API-CONTRACT-SPECIFICATION.md) - Effect/Platform HTTP contract patterns

### Operations

- [COMMANDS.md](./COMMANDS.md) - Development commands, database operations, testing
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Railway deployment, Docker builds, CI/CD
- [COMPLETED-STORIES.md](./COMPLETED-STORIES.md) - Implemented features and their details

### Testing

- [testing/tdd-guide.md](./testing/tdd-guide.md) - Test-driven development patterns with Effect-ts

---

## Planning Artifacts

Located in `_bmad-output/`:

### Core Planning

- [prd.md](./../_bmad-output/planning-artifacts/prd.md) - Product Requirements Document
- [epics.md](./../_bmad-output/planning-artifacts/epics.md) - Epic breakdown and story mapping
- [ux-design-specification.md](./../_bmad-output/planning-artifacts/ux-design-specification.md) - UX design guidelines

### Architecture Decisions

- [adr-6-hexagonal-architecture-dependency-inversion.md](./../_bmad-output/planning-artifacts/architecture/adr-6-hexagonal-architecture-dependency-inversion.md) - Hexagonal architecture ADR
- [architecture-decision-records.md](./../_bmad-output/planning-artifacts/architecture/architecture-decision-records.md) - All ADRs index
- [core-architectural-decisions.md](./../_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md) - Key decisions summary

### Sprint Tracking

- [sprint-status.yaml](./../_bmad-output/implementation-artifacts/sprint-status.yaml) - Current sprint status
- [epic-7-ui-theming.md](./../_bmad-output/planning-artifacts/epic-7-ui-theming.md) - Current epic details
- [epic-8-results-page-content-enrichment.md](./../_bmad-output/planning-artifacts/epic-8-results-page-content-enrichment.md) - Upcoming epic

---

## Epic Roadmap

### Phase 1 (MVP - US Launch)

| Epic | Status | Description |
|------|--------|-------------|
| 1. Infrastructure and Auth | Complete | Railway deployment, Better Auth, Docker |
| 2. Assessment Backend | Complete | Nerin agent, Analyzer, LangGraph orchestration |
| 3. OCEAN Archetype System | Complete | Code generation, archetype lookup |
| 4. Frontend Assessment UI | Complete | Chat UI, session management, Storybook |
| 5. Results and Profiles | Complete | Results display, shareable profiles |
| 7. UI Theming | In Progress | Dark mode, brand colors, visual polish |

### Phase 2 (EU Expansion)

| Epic | Status | Description |
|------|--------|-------------|
| 6. Privacy and Data Management | Planned | GDPR compliance, encryption at rest |
| 8. Results Page Content Enrichment | Planned | Archetype descriptions, insights |

---

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm 10.4.1
- Docker (for local database)

### Quick Start

```bash
# Install dependencies
pnpm install

# Start all services (includes database seeding)
pnpm dev

# Run tests
pnpm test:run

# Lint all code
pnpm lint
```

### Development Ports

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/health

### Test Assessment

```bash
# Seed database with completed assessment for testing
pnpm seed:test-assessment

# Test user: test@bigocean.dev
```

---

## Key Patterns

### Effect-ts Dependency Injection

```typescript
// Domain: Interface (Context.Tag)
const AssessmentRepository = Context.Tag<AssessmentRepository>();

// Infrastructure: Implementation (Layer)
const AssessmentRepositoryLive = Layer.succeed(AssessmentRepository, { ... });

// Use-case: Consume via Effect.gen
Effect.gen(function* () {
  const repo = yield* AssessmentRepository;
  return yield* repo.getById(id);
});
```

### Handler Pattern

```typescript
// Thin HTTP adapter - no business logic
HttpApiBuilder.group(api, "assessment", (handlers) =>
  handlers.handle("sendMessage", ({ payload }) =>
    sendMessageUseCase(payload).pipe(Effect.provide(LiveLayer))
  )
);
```

### Testing Pattern

```typescript
it.effect("should work", () =>
  Effect.gen(function* () {
    const result = yield* myUseCase({ input: "test" });
    expect(result).toBeDefined();
  }).pipe(Effect.provide(TestLayer))
);
```

---

## External Links

- **Production API:** https://api-production-f7de.up.railway.app/health
- **Repository:** GitHub (private)
- **CI/CD:** GitHub Actions

---

## Navigation

| Need to... | Go to... |
|------------|----------|
| Understand the architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Write frontend code | [FRONTEND.md](./FRONTEND.md) |
| Run commands | [COMMANDS.md](./COMMANDS.md) |
| Deploy changes | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Follow naming conventions | [NAMING-CONVENTIONS.md](./NAMING-CONVENTIONS.md) |
| Write tests | [testing/tdd-guide.md](./testing/tdd-guide.md) |
| See API contracts | [API-CONTRACT-SPECIFICATION.md](./API-CONTRACT-SPECIFICATION.md) |
| View completed work | [COMPLETED-STORIES.md](./COMPLETED-STORIES.md) |
