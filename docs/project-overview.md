# Project Overview: big-ocean

## Executive Summary

**big-ocean** is a sophisticated B2C psychological profiling platform built on the Big Five personality framework. The platform uses conversational AI to conduct coherence-based personality assessments, generating memorable archetypes and shareable profiles for users.

The system employs a multi-agent AI architecture where a conversational agent (Nerin) engages users in natural dialogue while an Analyzer agent extracts personality evidence. This evidence is aggregated into scores across 30 facets (5 traits x 6 facets), which map to one of 81 possible archetype combinations represented by a 4-letter OCEAN code.

**Repository:** Monorepo using pnpm workspaces + Turbo
**Node.js:** >= 20 | **pnpm:** 10.4.1

---

## Core Vision

**Mission:** Deliver conversational, coherence-based personality assessment via LLM agents, integrating scientific research into memorable archetypes with social features for comparison and discovery.

**Key Differentiators:**
- Natural conversation-based assessment (not questionnaire-driven)
- Evidence-based scoring with confidence tracking per facet
- Memorable archetype system with hand-curated descriptions
- Shareable profiles for social discovery
- Privacy-first design with default-private profiles

**MVP Success Metrics:**
| Metric | Target |
|--------|--------|
| Completion Rate | >= 50% |
| Sharing Rate | >= 15% |
| Net Promoter Score | >= 40 |
| LLM Cost per User | <= $0.15 |

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Backend Runtime** | Node.js >= 20 |
| **Backend Framework** | Effect-ts + @effect/platform |
| **AI Orchestration** | LangGraph + Anthropic Claude |
| **Database** | PostgreSQL 16 + Drizzle ORM |
| **Cache/Rate Limiting** | Redis |
| **Authentication** | Better Auth (NIST 2025 compliant) |
| **Frontend Framework** | React 19 + TanStack Start |
| **Frontend Build** | Vite 7.1 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **UI Primitives** | Radix UI |
| **Monorepo Tools** | pnpm workspaces + Turbo |
| **Testing** | Vitest + Playwright |
| **CI/CD** | GitHub Actions |
| **Deployment** | Railway (us-west1) |
| **Containerization** | Docker multi-stage builds |

---

## Architecture Overview

### Hexagonal Architecture (Ports and Adapters)

The codebase follows hexagonal architecture with clear layer separation and dependency inversion using Effect-ts Context.Tag pattern.

```
Contracts --> Handlers --> Use-Cases --> Domain (interfaces)
                                            ^
                                     Infrastructure (injected)
```

**Layer Responsibilities:**

1. **Contracts** - HTTP API definitions shared between frontend and backend
2. **Handlers** - Thin HTTP adapters (controllers/presenters) with no business logic
3. **Use-Cases** - Pure business logic and main unit test target
4. **Domain** - Repository interfaces (Context.Tag), entities, types, constants
5. **Infrastructure** - Repository implementations (Drizzle, LangGraph, Redis, Pino)

### Multi-Agent AI System

```
Router --> Nerin (conversational) --> Analyzer (batch every 3 msgs) --> Scorer
```

**Agent Responsibilities:**

- **Router** - Budget checks, steering calculation, message routing
- **Nerin** - Conversational agent that engages users naturally
- **Analyzer** - Extracts personality evidence from conversation batches
- **Scorer** - Computes facet and trait scores from evidence on-demand

**Big Five Framework:**

- 5 Traits: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
- 6 Facets per Trait = 30 total facets
- Evidence-based scoring with confidence tracking
- Recency-weighted averaging for score computation

### Archetype System

- 4-letter OCEAN code derived from trait levels (L/M/H thresholds)
- 81 possible combinations (3^4 = 81, with one trait fixed)
- 25 hand-curated archetype descriptions
- Fallback generator for uncurated combinations

---

## Monorepo Structure

```
big-ocean/
├── apps/
│   ├── api/              # Node.js backend
│   │   └── src/
│   │       ├── handlers/     # HTTP adapters
│   │       └── use-cases/    # Business logic
│   └── front/            # React 19 frontend
│       └── src/
│           ├── components/
│           └── routes/
├── packages/
│   ├── domain/           # Pure abstractions
│   │   └── src/
│   │       ├── constants/    # Big Five traits, facets
│   │       ├── repositories/ # Context.Tag interfaces
│   │       ├── schemas/      # Effect Schema definitions
│   │       ├── types/        # Branded types
│   │       └── utils/        # Pure domain functions
│   ├── contracts/        # HTTP API contracts
│   │   └── src/
│   │       ├── http/groups/  # HttpApiGroup definitions
│   │       └── errors.ts     # Tagged HTTP errors
│   ├── infrastructure/   # Repository implementations
│   │   └── src/
│   │       ├── db/           # Drizzle schema, migrations
│   │       └── repositories/ # *RepositoryLive layers
│   ├── ui/               # shadcn/ui components
│   │   └── src/
│   │       └── components/
│   ├── lint/             # Biome configuration
│   └── typescript-config/
├── docs/                 # Documentation
├── turbo.json            # Turbo configuration
├── pnpm-workspace.yaml   # Workspace configuration
└── drizzle.config.ts     # Drizzle ORM configuration
```

### Package Dependency Graph

```
apps/api -----------> contracts, domain, infrastructure
apps/front ---------> contracts, domain, ui
contracts ----------> domain
infrastructure -----> contracts, domain
ui -----------------> (independent)
```

### Database Schema

**PostgreSQL 16** with 8 tables:

| Category | Tables |
|----------|--------|
| Better Auth (4) | user, session, account, verification |
| Assessment (4) | assessment_session, assessment_message, facet_evidence, facet_score |

---

## Deployment

### Production Environment

- **Platform:** Railway (us-west1 region)
- **API URL:** https://api-production-f7de.up.railway.app
- **Container:** Docker multi-stage builds
- **CI/CD:** GitHub Actions (lint -> build -> test -> deploy)

### Infrastructure Services

| Service | Purpose |
|---------|---------|
| PostgreSQL 16 | Primary database |
| Redis | Cost tracking, rate limiting |
| Railway | Container hosting, environment management |

### Cost and Rate Controls

| Control | Limit |
|---------|-------|
| Daily Cost Budget | $75 |
| Assessments per User per Day | 1 |
| Message Cost Estimate | Calculated per request |

### Development Environment

```bash
# Quick start
pnpm install              # Install dependencies
pnpm dev                  # Start all services

# Individual services
pnpm dev --filter=api     # Backend only (port 4000)
pnpm dev --filter=front   # Frontend only (port 3000)
```

### Testing Strategy

| Tier | Tool | Purpose |
|------|------|---------|
| Unit | Vitest + mock repos | Use-case logic, isolated components |
| Integration | Docker Compose | HTTP stack validation |
| E2E | Playwright | Full user flow testing |

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Detailed architecture patterns and ADRs |
| [COMMANDS.md](./COMMANDS.md) | Complete command reference |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |
| [FRONTEND.md](./FRONTEND.md) | Frontend conventions and styling |
| [NAMING-CONVENTIONS.md](./NAMING-CONVENTIONS.md) | Git, code, and component naming |
| [API-CONTRACT-SPECIFICATION.md](./API-CONTRACT-SPECIFICATION.md) | HTTP API contract details |
| [COMPLETED-STORIES.md](./COMPLETED-STORIES.md) | Implemented feature documentation |

---

## Privacy Implementation

### Phase 1 (US MVP)

- TLS 1.3 encryption in transit
- Better Auth password security (12+ char, compromised credential checks)
- Default-private profiles (zero public discovery)
- PostgreSQL RLS for data access control

### Phase 2 (EU Launch)

- AES-256-GCM encryption at rest
- GDPR deletion/portability endpoints
- Comprehensive audit logging

---

*Last updated: February 2026*
