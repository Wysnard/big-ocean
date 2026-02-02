# Project Context Analysis

## Requirements Overview

**Functional Requirements (26 Total):**

The system must deliver conversational personality assessment through seven interconnected capability areas:

1. **Conversational Layer** (FR1-4): Multi-turn dialogue with Nerin agent, real-time streaming responses, session pause/resume, progress indication
2. **Assessment Layer** (FR5-7): Extract 30 Big Five facets from conversation, calculate 5 trait scores (0-20 scale), update precision confidence (0-100%)
3. **Archetype Layer** (FR8-12): Generate deterministic 4-letter OCEAN codes (POC: 81 combinations), lookup memorable character names (hand-curated + component-based), retrieve 2-3 sentence descriptions
4. **Sharing Layer** (FR13-16): Generate unique shareable profile links, display private vs. public data separation, export results
5. **Data Layer** (FR17-20): Encrypt conversation history + metadata, implement GDPR deletion/portability, maintain audit logs
6. **Sync Layer** (FR21-23): Server-state management with TanStack Query, session resumption via URL, optimistic UI updates
7. **Cost Management** (FR24-26): Monitor LLM spend per user/session, enforce rate limits, auto-disable with graceful messaging

**Non-Functional Requirements (Quality Drivers):**

- **Nerin Conversational Quality:** Responses feel personalized, adaptive, not generic. Non-negotiable competitive moat.
- **Real-Time Responsiveness:** Nerin <2 sec (P95), Archetype lookups <100ms, UI updates instant (optimistic)
- **Privacy & Security:** Zero unauthorized profile access, E2E encryption (TLS 1.3+), GDPR compliance from day 1
- **OCEAN Consistency:** Same trait scores always produce identical 4-letter code (deterministic), stable across sessions
- **Scaling:** Handle 500 concurrent users MVP without degradation, query response <500ms

**Scale & Complexity:**

- **Project Complexity:** HIGH (multi-agent orchestration, real-time streaming, privacy-critical, offline-first sync)
- **Technical Domain:** Full-stack web (React 19 frontend, Node.js backend, LLM integration, local-first sync)
- **Estimated Components:** 12-15 core architectural pieces

## Technical Constraints & Dependencies

**Monorepo Architecture (Existing):**
- Apps: `apps/front` (TanStack Start), `apps/api` (Node.js/Effect-ts)
- Packages: `domain`, `contracts`, `database`, `infrastructure`, `ui`
- Build system: Turbo + pnpm workspaces

**Tech Stack (Locked):**
- Frontend: React 19, TanStack Start (SSR), TanStack Query 5+, TanStack Form 1+
- Backend: Effect 3.19.14, @effect/rpc 0.73.0, @effect/schema 0.71.0
- LLM Orchestration: @langchain/langgraph 1.1+, @anthropic-ai/sdk 0.71.2
- Database: Drizzle ORM 0.45.1, PostgreSQL
- Design System: shadcn/ui, Tailwind CSS v4

**External Dependencies:**
- Claude API for Nerin responses (cost-critical: $0.15/assessment target)
- PostgreSQL database (must handle conversation history + precision tracking + secure encryption)

**Budget Constraint (CRITICAL):**
- Self-funded MVP target 500 users
- LLM cost must be ≤ $0.15/assessment (~$75/day max)
- Caching, batching, prompt optimization non-negotiable

## Cross-Cutting Concerns Identified

1. **LLM Cost Control** (affects: Nerin orchestration, caching strategy, rate limiting, monitoring)
2. **Precision Scoring Pipeline** (affects: Nerin responses, Analyzer output, Scorer, UI display)
3. **OCEAN Code Generation & Lookup** (affects: Assessment completion, results, sharing)
4. **Privacy & Encryption** (affects: All data storage, transmission, query filtering)
5. **Real-Time State Management** (affects: Conversation streaming, precision updates, server-state synchronization)
6. **Error Resilience** (affects: LLM failures, cost breaches, network reconnection graceful handling)

---
