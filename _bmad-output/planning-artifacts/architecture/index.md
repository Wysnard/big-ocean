# Architecture Documentation - big-ocean

## Quick Reference

| Document | Purpose |
|----------|---------|
| [ADR-6: Hexagonal Architecture](./adr-6-hexagonal-architecture-dependency-inversion.md) | Core architecture pattern, dependency inversion, Effect-ts layers |
| [Architecture Decision Records](./architecture-decision-records.md) | ADRs 1-5: Nerin, Cost Control, Privacy, State, Archetypes |
| [Core Decisions](./core-architectural-decisions.md) | Decisions 1-3: Auth, Error Handling, Frontend State |
| [Decision 4: Infrastructure](./decision-4-infrastructure-hosting.md) | Railway deployment, PostgreSQL, Redis |
| [Decision 5: Testing](./decision-5-testing-strategy.md) | Vitest, Playwright, TestContainers, Storybook |

---

## Document Index

### Core Architecture

- **[ADR-6: Hexagonal Architecture](./adr-6-hexagonal-architecture-dependency-inversion.md)** - Ports & adapters pattern with Effect-ts Context.Tag for dependency inversion. Defines layer boundaries: Domain → Use-Cases → Infrastructure.

- **[Architecture Decision Records](./architecture-decision-records.md)** - ADRs 1-5 covering:
  - ADR-1: Nerin Orchestration (LangGraph state machine)
  - ADR-2: LLM Cost Control (adaptive token budget)
  - ADR-3: Privacy Model (server-side encryption + RLS)
  - ADR-4: Server-State Management (TanStack Query)
  - ADR-5: OCEAN Archetype Lookup (in-memory + fallback)

- **[Core Architectural Decisions](./core-architectural-decisions.md)** - Decisions 1-3:
  - Decision 1: Authentication (Better Auth + NIST 2025)
  - Decision 2: Error Handling (Effect TaggedError + Pino + Sentry)
  - Decision 3: Frontend State (TanStack Query + optimistic updates)

### Infrastructure & Deployment

- **[Decision 4: Infrastructure & Hosting](./decision-4-infrastructure-hosting.md)** - All-Railway deployment architecture, PostgreSQL, Redis, backup strategy.

- **[Infrastructure Setup Flow](./infrastructure-setup-flow.md)** - Step-by-step Railway setup guide.

- **[Local Development with Docker Compose](./local-development-with-docker-compose.md)** - Local dev environment matching production.

- **[Cost Summary](./cost-summary-all-railway-path.md)** - Railway pricing breakdown ($5-12/month MVP).

- **[Monitoring & Operations](./monitoring-operations-phase-1.md)** - Phase 1 monitoring approach.

- **[Why Not Alternatives](./why-not-the-alternatives.md)** - Rationale for rejecting Cloudflare, Vercel, VPS options.

### Testing

- **[Decision 5: Testing Strategy](./decision-5-testing-strategy.md)** - Complete testing approach:
  - Unit: Vitest with mock repositories
  - Integration: TestContainers
  - E2E: Playwright
  - LLM: Mock Anthropic API
  - Components: Storybook + a11y

### Project Setup

- **[Project Context Analysis](./project-context-analysis.md)** - Requirements overview, technical constraints.

- **[Reference Architecture: effect-worker-mono](./reference-architecture-effect-worker-mono-pattern.md)** - Effect-ts patterns, FiberRef bridges, monorepo organization.

- **[Starter Template Evaluation](./starter-template-evaluation-selection.md)** - Tech stack evaluation and scoring.

- **[Selected Approach: Hybrid](./selected-starter-approach-hybrid-option-c.md)** - TanStack CLI + Manual Effect-ts implementation path.

- **[Implementation Roadmap](./implementation-roadmap.md)** - High-level milestone plan.

---

## File Summary

| File | Size | Content |
|------|------|---------|
| `adr-6-hexagonal-architecture-dependency-inversion.md` | 8KB | Hexagonal architecture patterns |
| `architecture-decision-records.md` | 18KB | ADRs 1-5 |
| `reference-architecture-effect-worker-mono-pattern.md` | 9KB | Effect-ts patterns |
| `decision-5-testing-strategy.md` | 8KB | Testing strategy |
| `core-architectural-decisions.md` | 6KB | Decisions 1-3 |
| `decision-4-infrastructure-hosting.md` | 6KB | Infrastructure |
| `starter-template-evaluation-selection.md` | 5KB | Tech evaluation |
| `selected-starter-approach-hybrid-option-c.md` | 4KB | Implementation approach |
| `project-context-analysis.md` | 4KB | Requirements |
| `infrastructure-setup-flow.md` | 2KB | Railway setup |
| `local-development-with-docker-compose.md` | 2KB | Docker Compose |
| `implementation-roadmap.md` | 1KB | Milestones |
| `why-not-the-alternatives.md` | 1KB | Alternative analysis |
| `monitoring-operations-phase-1.md` | 1KB | Monitoring |
| `cost-summary-all-railway-path.md` | 1KB | Pricing |

**Total: 15 files (~77KB)**
