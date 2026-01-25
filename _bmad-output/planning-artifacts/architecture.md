---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - "prd.md"
  - "ux-design-specification.md"
  - "CLAUDE.md"
workflowType: 'architecture'
project_name: 'big-ocean'
user_name: 'Vincentlay'
date: '2026-01-29'
---

# Architecture Decision Document - big-ocean

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

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

### Technical Constraints & Dependencies

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

### Cross-Cutting Concerns Identified

1. **LLM Cost Control** (affects: Nerin orchestration, caching strategy, rate limiting, monitoring)
2. **Precision Scoring Pipeline** (affects: Nerin responses, Analyzer output, Scorer, UI display)
3. **OCEAN Code Generation & Lookup** (affects: Assessment completion, results, sharing)
4. **Privacy & Encryption** (affects: All data storage, transmission, query filtering)
5. **Real-Time State Management** (affects: Conversation streaming, precision updates, server-state synchronization)
6. **Error Resilience** (affects: LLM failures, cost breaches, network reconnection graceful handling)

---

## Architecture Decision Records

### ADR-1: Nerin Orchestration Strategy ✅

**Decision:** LangGraph State Machine with Intelligent Routing

**Architecture:**

Nerin (conversational agent), Analyzer (pattern extraction), and Scorer (trait calculation) are orchestrated via LangGraph state machine with intelligent routing:

- **Nerin:** Streams conversational responses in real-time (< 2 sec P95)
- **Analyzer & Scorer:** Run asynchronously in background every 3 messages
- **Router:** LangGraph agent decides which agents to activate based on:
  - Message count (every 3 messages, trigger analysis)
  - Precision gaps (if confidence < 60%, request more exploration on low-confidence traits)
  - Cost awareness (skip analysis if approaching token budget)

**Rationale:**
- Leverages existing LangGraph dependency (already in stack)
- Enables intelligent routing to optimize costs while maintaining responsiveness
- Centralized state management is debuggable and maintainable
- Precision updates stream to UI in real-time (visible engagement signal)

**Trade-offs Accepted:**
- Higher implementation complexity upfront
- Requires careful orchestration between agents
- Must handle concurrent LLM calls with cost monitoring

**Key Metrics:**
- Nerin response time: < 2 sec (P95)
- Analysis latency: < 500ms (batched, non-blocking)

---

### ADR-2: LLM Cost Control Architecture ✅

**Decision:** Adaptive Token Budget + Per-User Rate Limiting

**Architecture:**

Two-layer cost control strategy:

1. **Rate Limiting (Baseline Protection):**
   - Maximum 1 assessment per user per day (prevents spam)
   - Maximum 1 resume per week (prevents gaming)
   - Enforced at RPC contract level

2. **Adaptive Token Budget (Real-Time Optimization):**
   - Each session allocated token budget based on daily spend
   - Real-time tracking via Redis: `cost:{{userId}}:{{date}}` = $X spent today
   - Analyzer/Scorer are cost-aware; skip analysis if approaching budget
   - Graceful degradation: If approaching limit, Nerin signals "Let's wrap up soon"
   - Hard cap: If daily spend > $75, auto-disable Nerin with message: "Assessment temporarily unavailable. Try again tomorrow."

3. **Cost Monitoring Dashboard:**
   - Real-time spend tracking per session
   - Per-user cost history (identify expensive users)
   - Alert thresholds (warn at 50%, 75%, 90% of daily budget)

**Rationale:**
- Prevents runaway costs while allowing flexibility for engaged users
- Frictionless to users (they don't see limits, just graceful messaging)
- Realistic for self-funded MVP ($75/day budget ≈ 500 users × 1 assessment/day)
- Cost-aware routing enables intelligent degradation before hard stops

**Trade-offs Accepted:**
- Requires Redis for real-time cost tracking
- Complex implementation (multi-layer budget logic)
- Requires monitoring and tuning post-launch

**Key Metrics:**
- Cost per assessment: Target ≤ $0.10 (realistic: $0.12-$0.15 with overhead)
- Daily budget utilization: 80-95% (predictable costs)
- Users hitting daily limit: < 5% (most users complete 1 assessment)

---

### ADR-3: Privacy & Profile Storage Model ✅

**Decision:** Single Source of Truth (user_profiles) + Derived Public Table + RLS + Server-Side Filtering

**Architecture:**

```
┌─────────────────────────────────────┐
│  Single Source of Truth             │
│  user_profiles table (encrypted)    │
│  - Full conversation history        │
│  - All 30 facets (0-20 scale)       │
│  - Precision tracking               │
│  - OCEAN codes (5-letter)           │
│  - Private notes                    │
└─────────────────────────────────────┘
              │
              ├─────────────────────────────────────┐
              │                                     │
         (RLS Policy)                     (Server-side stripping)
              │                                     │
              ▼                                     ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │ Server-State Mgmt    │        │  GET /profile/:id    │
    │ (TanStack Query)     │        │  (Public API Route)  │
    │                      │        │                      │
    │ RPC: getSession      │        │  Returns only:       │
    │ returns private      │        │  - Archetype name    │
    │ assessment data      │        │  - 5 trait summary   │
    │ (authenticated)      │        │  - Brief description │
    │                      │        │  - Color/icon        │
    │ RLS ensures only     │        │                      │
    │ authed user can      │        │  Strips:             │
    │ access their data    │        │  - Conversation      │
    │                      │        │  - Facet details     │
    │  Background sync     │        │  - User ID           │
    │  (optimistic updates)│        │  - Timestamps        │
    └──────────────────────┘        │  - Auth tokens       │
                                     └──────────────────────┘
                                              │
                                     ┌────────────────┐
                                     │public_profiles │
                                     │(denormalized)  │
                                     │                │
                                     │ - id (PK)      │
                                     │ - user_id (FK) │
                                     │ - archetype... │
                                     │ - Shareable    │
                                     │   URL ref      │
                                     └────────────────┘
```

**Data Model:**

- **user_profiles:** Single authoritative store for all personality data (encrypted at rest)
  - `id` (user_id, PK)
  - `conversationHistory` (JSON, encrypted)
  - `allFacets` (30 facet details, encrypted)
  - `oceanCode5Letter` (PPAMG, encrypted)
  - `oceanCode4Letter` (PPAM, encrypted)
  - `precision` (0-100%, encrypted)
  - `privateNotes` (optional, encrypted)
  - `createdAt`, `updatedAt`

- **public_profiles:** Denormalized reference table for sharing (no user_id in URL)
  - `id` (public_profile_id, PK) — This is what goes in shareable URL
  - `userId` (FK to user_profiles)
  - `archetypeName` (e.g., "The Grounded Thinker")
  - `oceanCode4Letter` (PPAM)
  - `traitSummary` (JSON with Low/Mid/High values)
  - `description` (2-3 sentence archetype summary)
  - `archetypeColor` (for UI)
  - `viewCount` (engagement tracking)
  - `sharedAt`

**Data Flow:**

1. **Private Assessment (Server-State via TanStack Query):**
   - User takes assessment; all data stored on server
   - User authenticated via Better Auth (session token)
   - RLS prevents cross-user data access at database level
   - Precision meter updates via background query refetch

2. **Public Sharing (Server-Side Filtering via API):**
   - User clicks "Share My Archetype"
   - System generates unique `public_profile_id` and stores in `public_profiles`
   - Shareable link: `big-ocean.com/profile/{{public_profile_id}}`
   - Recipient clicks link → GET /api/profiles/:publicProfileId
   - Server returns only safe public fields
   - User ID never exposed

**Privacy Controls:**

- **PostgreSQL Row-Level Security (RLS):** Users can only query their own assessment data
  - Policy: `auth.uid()::text = sessions.user_id` (at query level)
- **Server-Side Encryption:** All conversations encrypted with AES-256 at rest
- **API Filtering:** GET /api/sessions/:id endpoint checks auth before returning data
- **URL Privacy:** Shareable links use `public_profile_id`, never `user_id`
- **Database Trigger:** Trigger keeps `public_profiles` in sync when `user_profiles` updates

**Rationale:**
- **Single Source of Truth:** `user_profiles` and `sessions` are authoritative on server
- **No Sync Complexity:** Server-side encryption only (no key management in browser)
- **Defense in Depth:** RLS (database) + API auth (application) + encrypted storage
- **Privacy by Design:** Profiles not searchable/discoverable; only accessible via explicit link
- **Simpler Architecture:** No local database to manage, fewer sync edge cases

**Trade-offs Accepted:**
- Database trigger complexity (keep tables in sync)
- RLS policy maintenance
- Two-layer access control (more to audit)

**Key Metrics:**
- Zero unauthorized profile access (audit log verification)
- Shareable link access: Anonymous (no auth required)
- Private data encryption: AES-256 at rest

---

### ADR-4: Server-State Management with TanStack Query (Revised) ✅

**Decision:** TanStack Query + Session Resumption via URL (removed ElectricSQL complexity)

**Architecture:**

Pragmatic server-state management using TanStack Query for efficient data fetching, caching, and optimistic updates. No local database sync complexity.

**Data Flow:**

1. **User starts assessment** → Backend creates session, generates `sessionId`
2. **Messages sent** → Frontend optimistic update (appears instantly) + TanStack Query mutation to server
3. **Server processes** → Nerin responds, Analyzer/Scorer run, precision updates, database persists
4. **Frontend syncs** → TanStack Query background refetch pulls updated state from server
5. **User switches device** → Resume via URL: `/assessment?sessionId={sessionId}` → TanStack Query fetches full history in <1sec

**Implementation:**

```typescript
// Frontend: TanStack Query + optimistic updates
import { useQuery, useMutation } from "@tanstack/react-query";

// Fetch full session history (on mount or device resumption)
const useSessionHistory = (sessionId: string) => {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/full`);
      return response.json(); // { messages: [], precision, oceanCode4Letter, ... }
    },
  });
};

// Send message with optimistic update
const useSendMessage = (sessionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      return response.json(); // { response, precision, ... }
    },
    onMutate: async (message) => {
      // Optimistic update: add message to cache immediately
      await queryClient.cancelQueries({ queryKey: ["session", sessionId] });
      const prev = queryClient.getQueryData(["session", sessionId]);
      queryClient.setQueryData(["session", sessionId], (old: any) => ({
        ...old,
        messages: [...old.messages, { id: "temp", role: "user", content: message }],
      }));
      return { prev };
    },
    onSuccess: () => {
      // Refetch full session after server response
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
    onError: (err, message, context) => {
      // Rollback on error
      if (context?.prev) {
        queryClient.setQueryData(["session", sessionId], context.prev);
      }
    },
  });
};
```

**Backend Endpoints:**

```typescript
// GET /api/sessions/{sessionId}/full
// Returns: { messages: [], precision, oceanCode4Letter, oceanCode5Letter, createdAt }
// Purpose: Full session history (used on resume)
// Response time: <1 second (all data fetched in single query)

// POST /api/sessions/{sessionId}/messages
// Input: { message: string }
// Returns: { response: string, precision: number, oceanCode4Letter: string }
// Purpose: Send message, get Nerin response + updated precision
// Side effects: Triggers Analyzer/Scorer asynchronously
```

**Optimistic Updates:**

- Message appears in UI instantly (before server confirm)
- Input field clears immediately
- Server processes asynchronously (Nerin generation, analysis)
- When response arrives, TanStack Query refetches full session state
- UI reconciles with server state seamlessly

**Device Switching:**

- User takes 10 messages on Desktop
- Bookmarks or shares URL: `https://big-ocean.com/assessment?sessionId=abc123`
- Opens on Mobile → Full history loads in <1 second
- Can continue assessment seamlessly
- No real-time sync, but imperceptible latency

**Rationale (Why ElectricSQL Removed):**

**Original ElectricSQL approach:**
- ❌ Full client-side SQLite with bidirectional sync
- ❌ Complex encryption key management (keys in browser)
- ❌ Logical replication setup & maintenance
- ❌ Conflict resolution overhead (Last-Write-Wins)
- ❌ Large local database footprint
- ❌ Testing burden: offline scenarios, reconnection edge cases

**New TanStack Query approach:**
- ✅ Simple HTTP-based fetching (standard, proven pattern)
- ✅ No encryption key management (server-side encryption only)
- ✅ No sync complexity (stateless REST API)
- ✅ Optimistic updates feel instant (no latency perception)
- ✅ Device switching <1 second (acceptable for MVP)
- ✅ Simpler testing (REST mocks, no ElectricSQL integration)
- ✅ Faster launch: 2-3 months earlier

**Key Metrics:**

- Session history load: <1 second (full fetch on resume)
- Message send latency: Instant (optimistic), confirmed <2 seconds (Nerin + server)
- Device switching experience: <1 second full history load
- Offline capability: None (assessment requires server connectivity anyway)
- Complexity: Low (standard React Query patterns)

---

### ADR-5: OCEAN Archetype Lookup & Storage ✅

**Decision:** In-Memory Registry + Component-Based Generation Fallback

**Architecture:**

Two-tier archetype naming system optimized for performance and scalability:

**Tier 1: Curated Archetypes (In-Memory)**
- 25-30 hand-curated memorable names stored in TypeScript constant
- Loaded once at app startup
- Lookup: O(1) object property access
- Performance: < 1ms per lookup
- Examples: "The Grounded Thinker", "The Catalyst", "The Architect"

**Tier 2: Component-Based Generation (Algorithm Fallback)**
- For remaining ~51 combinations (81 total POC - 30 curated = 51 fallback)
- Generate names on-the-fly from trait components
- Algorithm: [Trait1 Adjective] + [Trait2 Noun]
- Example: Practical + Purpose-driven + Ambivert + Moderate → "The Pragmatic Peer"
- Performance: < 5ms computation
- Scales to Phase 2: If expanding to 243 combinations, only add more curated names

**Storage & Distribution:**

```typescript
// packages/domain/src/archetypes.ts
export const CURATED_ARCHETYPES = {
  "RPAM": {
    name: "The Anchor",
    description: "You approach life with thoughtful balance...",
    color: "#7C3AED",
  },
  "IDEC": {
    name: "The Catalyst",
    description: "You spark change and inspire action...",
    color: "#DC2626",
  },
  // ... 23 more hand-curated
} as const;

export function getArchetype(code: string) {
  return CURATED_ARCHETYPES[code as keyof typeof CURATED_ARCHETYPES]
    || generateComponentBasedName(code);
}

// Component-based fallback
function generateComponentBasedName(code: string): ArchetypeDetail {
  const [o, c, e, a] = code.split('');
  const adjective = TRAIT_ADJECTIVES[o + c]; // "Pragmatic"
  const noun = TRAIT_NOUNS[e + a]; // "Peer"
  return {
    name: `The ${adjective} ${noun}`,
    description: generateDescription(code),
    color: generateColor(code),
  };
}
```

**No Database Lookup Needed:**
- Archetypes NOT stored in database
- No migrations needed when adding new names
- No RPC round-trip for archetype display
- Works offline (in-memory constant)

**Performance Characteristics:**

| Lookup Type | Time | Notes |
|-------------|------|-------|
| Curated (in-memory) | < 1ms | Object property access |
| Generated (component) | < 5ms | String interpolation + color generation |
| **Target: < 100ms** | ✅ Achieved | Both options far below threshold |

**Rationale:**
- Meets <100ms performance requirement with massive margin
- Curated names are memorable (shareable identity)
- Component generation scales to 243+ combinations without bottleneck
- No database load (queries are expensive for high-volume queries)

**Phase 2 Migration Path (if needed):**
- If A/B testing archetype names becomes critical
- Move to database-backed approach without refactoring
- Add cache layer (Redis) for sub-millisecond lookups
- No frontend logic changes needed

**Trade-offs Accepted:**
- Can't change archetype names without code redeploy (but rare post-MVP)
- Generated names less memorable than hand-curated (acceptable for 51 fallback)
- Component algorithm must be carefully designed for semantic coherence

**Key Metrics:**
- Lookup performance: < 5ms (P95)
- Memory footprint: < 50KB (in-memory constant)
- Curation coverage: 30-35% of 81 combinations (hand-curated)
- Fallback quality: Semantic coherence verified in component algorithm

---

## Architectural Decisions Summary

| Decision | Recommended | Rationale | Key Trade-off |
|----------|-------------|-----------|---------------|
| **Nerin Orchestration** | LangGraph State Machine | Intelligent routing, cost-aware, centralized | Higher implementation complexity |
| **Cost Control** | Adaptive Token Budget + Rate Limit | Prevents runaway costs, frictionless | Requires Redis + budget logic |
| **Privacy Model** | Server-side Encryption + RLS + API Filtering | Single source of truth, defense in depth, secure | Requires AES-256 crypto layer |
| **Frontend State** | TanStack Query + Session Resumption | Proven pattern, simple testing, no sync complexity | No offline message queuing (acceptable) |
| **Archetype Lookup** | In-Memory + Component Fallback | <5ms performance, scalable, no DB load | Can't change names without redeploy |

---

## Reference Architecture: effect-worker-mono Pattern

**Source:** [backpine/effect-worker-mono](https://github.com/backpine/effect-worker-mono)

Your project will follow the production-ready monorepo pattern demonstrated by `effect-worker-mono`. This is an excellent reference for organizing Effect-TS + RPC in a type-safe, scalable way.

### How effect-worker-mono Aligns with big-ocean

#### Applications Layer (Your Apps)

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

#### Shared Packages (Your Libraries)

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

### Key Design Patterns from effect-worker-mono Applied to big-ocean

#### 1. FiberRef Bridge for Request-Scoped Dependencies

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

#### 2. Middleware Tags for Cross-Cutting Concerns

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

#### 3. Type-Safe RPC Contracts as Contract-First Design

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

### Monorepo Workspace Organization

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

### Project Initialization with effect-worker-mono Pattern

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

### Why effect-worker-mono Pattern Works for big-ocean

✅ **Type Safety:** Contract-first design ensures handlers match RPC definitions
✅ **Composability:** FiberRef bridges decouple dependencies from handlers
✅ **Scalability:** Monorepo structure allows growing from frontend + one API to multiple services
✅ **Cost Control:** Middleware tags enable global cost tracking without handler pollution
✅ **Privacy:** RLS + RPC filtering follows the same pattern as effect-worker-mono's middleware
✅ **Testing:** Effect layers make mocking and testing straightforward
✅ **Maintainability:** Clear separation between contracts, handlers, and infrastructure

---

## Starter Template Evaluation & Selection

### Evaluation Criteria (Weighted)

| Criterion | Weight | Why It Matters |
|-----------|--------|----------------|
| **Setup Speed (MVP Timeline)** | 15% | Need working frontend + backend quickly |
| **Effect-ts / RPC Alignment** | 20% | Must follow effect-worker-mono pattern cleanly |
| **Cost Control Integration** | 15% | Budget enforcement is existential for self-funded MVP |
| **LLM Orchestration (LangGraph)** | 15% | Nerin orchestration is your competitive moat |
| **TanStack Query Integration** | 10% | Server-state management needs clean patterns |
| **Long-Term Maintainability** | 15% | Avoid tech debt that haunts you post-launch |
| **Documentation & Community** | 10% | Can you find help when stuck? |

### Comparative Analysis: Starter Options

#### **Option A: TanStack Start CLI Only** (Not Recommended)

**Approach:** Run `pnpm create @tanstack/start@latest` for both frontend AND backend

| Criterion | Score | Analysis |
|-----------|-------|----------|
| Setup Speed | 9/10 | Fastest possible — one command, everything ready |
| Effect-ts Alignment | 2/10 | ❌ TanStack Start doesn't include Effect-ts; retrofitting feels awkward |
| Cost Control | 3/10 | ❌ No built-in Redis/budget tracking; requires custom bolting-on |
| LangGraph Ready | 2/10 | ❌ Designed for tRPC/Server Functions, not multi-agent orchestration |
| TanStack Query | 8/10 | ✅ TanStack Start integrates Query patterns well |
| Maintainability | 4/10 | ⚠️ Mixing backend logic in TanStack blurs concerns; hard to separate |
| Documentation | 9/10 | ✅ Excellent docs (for TanStack, not Effect-ts integration) |
| **WEIGHTED SCORE** | **4.8/10** | ❌ **AVOID** |

**Why This Fails:**
- TanStack Start optimized for SSR + Server Functions (tRPC-style), not Effect-ts/RPC
- Cost control, LangGraph orchestration, privacy layer feel bolted-on
- Architectural confusion mixing frontend + backend in same framework

---

#### **Option B: Manual Everything** (Pure but Slow)

**Approach:** Build frontend + backend scaffolding from scratch (no starters)

| Criterion | Score | Analysis |
|-----------|-------|----------|
| Setup Speed | 3/10 | ❌ Slowest — you build everything from scratch |
| Effect-ts Alignment | 10/10 | ✅ Full control; follow effect-worker-mono perfectly |
| Cost Control | 10/10 | ✅ Build cost tracking exactly as envisioned |
| LangGraph Ready | 10/10 | ✅ LangGraph + Effect layers integrate seamlessly |
| TanStack Query | 7/10 | ⚠️ Works, but manual state management patterns needed |
| Maintainability | 9/10 | ✅ Clear separation; no framework assumptions to fight |
| Documentation | 4/10 | ❌ You write docs as you go; Effect-ts community is small |
| **WEIGHTED SCORE** | **7.5/10** | ⚠️ **ACCEPTABLE** (slow to first working state) |

**Trade-off:**
- ✅ Architectural purity
- ❌ Weeks of scaffolding before first session runs
- ❌ Risk: Solo decisions may miss best practices

---

#### **Option C: Hybrid (TanStack CLI + Manual Effect-ts)** ✅ RECOMMENDED

**Approach:** TanStack Start for `apps/front` + Manual Effect-ts for `apps/api` + effect-worker-mono pattern

| Criterion | Score | Analysis |
|-----------|-------|----------|
| Setup Speed | 8/10 | ✅ Frontend ready immediately; backend scaffolding manageable |
| Effect-ts Alignment | 9/10 | ✅ Backend follows effect-worker-mono exactly; frontend separate |
| Cost Control | 9/10 | ✅ Effect layer for cost tracking feels natural; FiberRef bridges work seamlessly |
| LangGraph Ready | 9/10 | ✅ LangGraph agents + Effect state machine is canonical pattern |
| TanStack Query | 9/10 | ✅ TanStack Query provides proven server-state patterns seamlessly |
| Maintainability | 9/10 | ✅ Clear split: frontend (TanStack) + backend (Effect) concerns |
| Documentation | 8/10 | ✅ Reference TanStack Start docs + effect-worker-mono as guides |
| **WEIGHTED SCORE** | **8.6/10** | ✅ **STRONGLY RECOMMENDED** |

**Why This Wins:**
- ✅ Frontend ready in hours (leverage TanStack CLI)
- ✅ Backend clarity (manual scaffolding = exact effect-worker-mono alignment)
- ✅ Cost control, LangGraph, TanStack Query feel like natural extensions
- ✅ Long-term: Clear separation means can evolve independently
- ✅ Reference implementation (effect-worker-mono) available to copy from

---

### Scoring Summary

```
Option A (TanStack Only):        4.8/10  ❌ Avoid — Framework misalignment
Option B (Manual Full):          7.5/10  ⚠️ Acceptable — Too slow to MVP
Option C (Hybrid):               8.6/10  ✅ Optimal — Speed + Architecture
```

---

## Selected Starter Approach: Hybrid (Option C)

### Rationale for Selection

The **Hybrid approach** (TanStack Start CLI + Manual Effect-ts) scores **8.6/10** and provides optimal balance:

1. **Speed:** Frontend ready in hours via TanStack CLI; MVP-critical paths cleared early
2. **Architecture:** Backend scaffolding aligns precisely with effect-worker-mono pattern; no retrofitting
3. **Cost Control:** Effect layer integrates cost tracking, budget guards, graceful degradation naturally
4. **Nerin Orchestration:** LangGraph + Effect state machine is canonical pattern; no fighting framework
5. **Privacy & Sync:** Server-side encryption + RLS + RPC filtering feels coherent across stack
6. **Long-Term:** Clear separation between frontend (TanStack concerns) and backend (Effect concerns)

### Implementation Path

**Step 1: Frontend Initialization**
```bash
pnpm create @tanstack/start@latest apps/front \
  --add-ons shadcn,tanstack-query \
  --package-manager pnpm
```

**Step 2: Backend Scaffolding (Manual, effect-worker-mono pattern)**
```bash
# Create directory structure
mkdir -p apps/api/src/{agents,handlers,services,middleware,db,context}

# Initialize Node.js project
pnpm -C apps/api init -y

# Add Effect-ts + orchestration + database dependencies
pnpm -C apps/api add \
  effect @effect/rpc @effect/schema \
  @langchain/langgraph @anthropic-ai/sdk \
  drizzle-orm pg redis \
  express cors helmet

# Add development dependencies
pnpm -C apps/api add -D \
  typescript @types/node ts-node tsx \
  eslint prettier @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin
```

**Step 3: Shared Packages (Already exist in monorepo)**
- No additional commands; pnpm workspace links automatically
- Existing: `packages/{domain,contracts,database,infrastructure,ui}`

**Step 4: Wire Up First Session (End-to-End Flow)**
- Implement `startAssessment` RPC handler
- Implement `sendMessage` RPC handler with Nerin orchestration
- Wire TanStack Query hooks (useSessionHistory, useSendMessage)
- Integrate cost tracking via middleware

### Timeline & Milestones

| Phase | Week | Deliverable |
|-------|------|-------------|
| **Phase 1: Setup** | Week 1 | TanStack Start initialized + backend directory structure + RPC contracts |
| **Phase 2: Core Session Flow** | Week 1-2 | First session end-to-end (startAssessment → sendMessage → resume via URL) |
| **Phase 3: Nerin Integration** | Week 2-3 | LangGraph agent orchestration working + streaming responses |
| **Phase 4: Cost Control** | Week 3 | Budget tracking + rate limiting operational |
| **Phase 5: Privacy & Sharing** | Week 3-4 | Server-side encryption + RLS + public profiles working |
| **Phase 6: Testing & QA** | Week 4 | Unit tests, integration tests, E2E tests, Storybook docs |

### Key References During Implementation

- **[TanStack Start Official Docs](https://tanstack.com/start/latest/docs/framework/react/overview)** — Frontend patterns, SSR, streaming
- **[effect-worker-mono Repository](https://github.com/backpine/effect-worker-mono)** — Your exact backend pattern (FiberRef bridges, RPC handlers, middleware)
- **[Effect-ts Official Docs](https://effect.website/)** — Effect Layer setup, FiberRef, error handling
- **[LangGraph Documentation](https://docs.langchain.com/oss/javascript/langgraph/overview)** — Agent orchestration patterns
- **Your ADRs (this document)** — Cost control, privacy model, archetype lookup decisions

### Risk Mitigation

**Risk 1: Manual backend scaffolding creates inconsistency**
- **Mitigation:** Use effect-worker-mono as strict reference; follow directory structure exactly
- **Prevention:** Create implementation checklist verifying against effect-worker-mono pattern

**Risk 2: Effect-ts learning curve delays backend work**
- **Mitigation:** Dedicate developer time to study effect-worker-mono handlers before implementation
- **Prevention:** Team review of Effect patterns + FiberRef bridges first

**Risk 3: TanStack Query caching edge cases (stale data)**
- **Mitigation:** Set appropriate `staleTime` and `refetchInterval` for assessment data (suggest: staleTime 1s, refetch on window focus)
- **Prevention:** Write integration tests for mutation + refetch cycles (test optimistic update rollback)

---

## Core Architectural Decisions

### Decision 1: Authentication & Authorization ✅

**Selected Approach:** Better Auth with Email/Password + Custom Password Validation

**Library:** [Better Auth](https://www.better-auth.com/docs/basic-usage) (default transport: HTTP cookies + sessions)

**Authentication Methods (MVP):**
- ✅ Email & Password (with NIST 2025 validation)
- ❌ OAuth Providers (deferred to Phase 2: Facebook, Google)
- ❌ Multi-Factor Authentication (deferred to Phase 2: optional email code or TOTP)

**Password Validation Rules (NIST 2025 Standards):**

Based on [NIST 2025 Guidelines](https://www.strongdm.com/blog/nist-password-guidelines), modern password policy prioritizes length over complexity:

- **Minimum Length:** 12 characters (recommended over 8-character minimum)
- **Character Composition:** All ASCII + Unicode allowed (no forced uppercase/numbers/symbols)
- **Compromised Credential Screening:** Check against [HaveIBeenPwned](https://haveibeenpwned.com/) or similar service
- **No Mandatory Expiration:** Only reset on confirmed breach
- **Password Manager Support:** Full compatibility with long, random passwords

**Backend Configuration:**

```typescript
// apps/api/src/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import bcrypt from "bcryptjs";

export const auth = betterAuth({
  database: db,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,

    // NIST 2025: Length-based, not complexity-based
    minPasswordLength: 12,
    maxPasswordLength: 128,

    // Industry-standard bcrypt hashing
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 12);
      },
      verify: async (hash: string, password: string) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
});

// Hook: Screen against compromised credentials (NIST requirement)
auth.onBeforeSignUp(async (context) => {
  const password = context.body.password;

  // Check HaveIBeenPwned API
  const isCompromised = await checkCompromisedPassword(password);

  if (isCompromised) {
    throw new Error(
      "This password has appeared in data breaches. Please choose another."
    );
  }

  return context;
});

// Hook: Link anonymous session to user account on sign-up
auth.onAfterSignUp(async (context) => {
  const newUser = context.user;
  const anonymousSessionId = context.body.sessionId;

  if (anonymousSessionId) {
    // Link anonymous session → new user account
    await db.sessions.update(
      { id: anonymousSessionId },
      { userId: newUser.id }
    );
  }

  return context;
});

// Mount as Express middleware
app.all("/api/auth/*", toNodeHandler(auth));
```

**Frontend Integration (TanStack Start):**

```typescript
// apps/front/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.VITE_API_URL || "http://localhost:4000",
});

export function useSession() {
  return authClient.useSession();
}

// apps/front/src/routes/assessment.tsx
import { SignUpModal } from "~/components/SignUpModal";

export function AssessmentPage() {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const { data: session } = useSession();

  const handleSendMessage = async (message: string) => {
    // Trigger sign-up modal after first message (if not authenticated)
    if (isFirstMessage && !session?.user) {
      setShowSignUpModal(true);
    }

    setIsFirstMessage(false);

    // Send message regardless (works anonymous or authenticated)
    await sendMessage({ sessionId, message });
  };

  return (
    <>
      <AssessmentUI onSendMessage={handleSendMessage} />
      <SignUpModal
        isOpen={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
      />
    </>
  );
}
```

**Sign-Up Modal UX (Appears After First Message):**

```typescript
// apps/front/src/components/SignUpModal.tsx
export function SignUpModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: email.split("@")[0], // Default name from email
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      // Success: Session automatically updated, modal closes
      onClose();
    } catch (err) {
      setError("Sign-up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Your Profile</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600">
          Create an account to save and share your assessment results.
        </p>

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <Input
            type="password"
            placeholder="Password (12+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button
              onClick={handleSignUp}
              disabled={isLoading || !email || password.length < 12}
              className="flex-1"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>

            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Continue Without Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**User Session Lifecycle:**

1. **Anonymous Start** (No authentication)
   - User clicks "Start Assessment"
   - Session created with `userId = null`
   - Assessment begins, Nerin responds
   - After first user message: Sign-up modal appears

2. **Sign-Up Path** (New account)
   - User enters email + password in modal
   - Better Auth validates password (12+ chars, not compromised)
   - User account created
   - Anonymous session linked to new user account
   - Modal closes, assessment continues as authenticated user

3. **Continue Without Account** (Remain anonymous)
   - User clicks "Continue without account"
   - Modal closes
   - Assessment continues as anonymous
   - Session persists 24-48 hours
   - Results still shareable via public profile link (no sign-in required)

**Authorization in RPC Handlers:**

RPC handlers access authenticated user via Effect layer:

```typescript
// packages/infrastructure/src/auth.ts
import { FiberRef, Effect, Tag } from "effect";

export const AuthContext = Tag.class<{
  readonly session: Session | null;
  readonly userId: string | null;
}>();

// apps/api/src/handlers/assessment.ts
export const startAssessment = Rpc.rpcFunction({
  input: S.struct({ userId: S.optional(S.string) }),
  output: S.struct({ sessionId: S.string, createdAt: S.Date }),
  failure: SessionError,
})((input) =>
  Effect.gen(function* () {
    const auth = yield* AuthContext;

    // userId can be null (anonymous) or string (authenticated)
    const sessionId = yield* generateSessionId();
    yield* persistSession(sessionId, auth.userId);

    return { sessionId, createdAt: new Date() };
  })
);

// sendMessage allows both anonymous and authenticated
export const sendMessage = Rpc.rpcFunction({
  input: S.struct({
    sessionId: S.string,
    message: S.string,
  }),
  output: S.struct({
    response: S.string,
    precision: S.number,
  }),
  failure: SessionError,
})((input) =>
  Effect.gen(function* () {
    const session = yield* loadSession(input.sessionId);

    // Works whether session.userId is null or authenticated
    const response = yield* Nerin.chat(input.message, session);

    return { response, precision: session.precision };
  })
);
```

**Multi-Factor Authentication (MFA):**
- ❌ **MVP Scope:** Skipped for speed
- ✅ **Phase 2:** Add optional email code or TOTP-based MFA

**OAuth Providers:**
- ❌ **MVP Scope:** Email/password only
- ✅ **Phase 2:** Add Google, Facebook social login

**Database Tables (Better Auth Auto-Creates):**

Better Auth creates these tables automatically with Drizzle adapter:
- `user` — User accounts
- `session` — Active sessions
- `account` — OAuth account links (for Phase 2)
- `verification` — Email verification tokens

**Sources:**
- [Better Auth: Basic Usage](https://www.better-auth.com/docs/basic-usage)
- [Better Auth: Email & Password](https://www.better-auth.com/docs/authentication/email-password)
- [Better Auth: Hooks](https://www.better-auth.com/docs/concepts/hooks)
- [NIST 2025 Password Guidelines](https://www.strongdm.com/blog/nist-password-guidelines)

---

### Decision 2: Error Handling & Observability ✅

**Selected Approach:** Effect TaggedError + Pino + Sentry (Free Plan)

This decision spans three interconnected systems for production-grade error handling and visibility.

#### 2A: Error Handling Strategy

**Selected: Effect TaggedError (Type-Safe, Domain-Specific)**

Using Effect's `Data.TaggedError` for all domain errors:

```typescript
// packages/domain/src/errors.ts
import { Data } from "effect";

// Domain-specific errors
export class SessionNotFoundError extends Data.TaggedError("SessionNotFoundError") {
  constructor(readonly sessionId: string) {
    super();
  }
}

export class CostLimitExceededError extends Data.TaggedError("CostLimitExceededError") {
  constructor(readonly userId: string, readonly spent: number, readonly limit: number) {
    super();
  }
}

export class LLMError extends Data.TaggedError("LLMError") {
  constructor(readonly model: string, readonly message: string, readonly status?: number) {
    super();
  }
}

export class PrecisionTooLowError extends Data.TaggedError("PrecisionTooLowError") {
  constructor(readonly sessionId: string, readonly currentPrecision: number) {
    super();
  }
}

export class DatabaseError extends Data.TaggedError("DatabaseError") {
  constructor(readonly operation: string, readonly cause: Error) {
    super();
  }
}

export class ElectricSyncError extends Data.TaggedError("ElectricSyncError") {
  constructor(readonly table: string, readonly message: string) {
    super();
  }
}

// Type union for all domain errors
export type DomainError =
  | SessionNotFoundError
  | CostLimitExceededError
  | LLMError
  | PrecisionTooLowError
  | DatabaseError
  | ElectricSyncError;
```

**RPC Error Handling:**

```typescript
// apps/api/src/handlers/assessment.ts
import { Effect } from "effect";
import * as Rpc from "@effect/rpc/Rpc";
import * as S from "@effect/schema/Schema";
import { SessionNotFoundError, CostLimitExceededError, LLMError } from "@workspace/domain";

export const AssessmentService = Rpc.define({
  startAssessment: Rpc.rpcFunction({
    input: S.struct({ userId: S.optional(S.string) }),
    output: S.struct({ sessionId: S.string, createdAt: S.Date }),
    failure: S.union(
      S.struct({ _tag: S.literal("SessionNotFoundError"), sessionId: S.string }),
      S.struct({ _tag: S.literal("DatabaseError"), operation: S.string, cause: S.string })
    ),
  }),
});

export const startAssessment = ((input) =>
  Effect.gen(function* () {
    const db = yield* Effect.service(DatabaseRef);
    const logger = yield* Effect.service(LoggerRef);

    try {
      const sessionId = yield* generateSessionId();
      const userId = input.userId || null;

      yield* db.sessions.create({
        id: sessionId,
        userId,
        startedAt: new Date(),
      });

      logger.info("session_created", {
        sessionId,
        userId,
        anonymous: !userId,
      });

      return { sessionId, createdAt: new Date() };
    } catch (error) {
      if (error instanceof Error) {
        yield* Effect.fail(new DatabaseError("create_session", error));
      }
      throw error;
    }
  })
) as RpcFunction;

export const sendMessage = ((input) =>
  Effect.gen(function* () {
    const costGuard = yield* Effect.service(CostGuard);
    const logger = yield* Effect.service(LoggerRef);

    // Check cost limit first
    const budgetOk = yield* costGuard.checkBudget(input.sessionId);
    if (!budgetOk) {
      yield* Effect.fail(
        new CostLimitExceededError(input.sessionId, 0.15, 0.15)
      );
    }

    // Load session
    const session = yield* loadSession(input.sessionId).pipe(
      Effect.orElseEff(() => new SessionNotFoundError(input.sessionId))
    );

    // Call Nerin
    const { response, tokens } = yield* Nerin.chat(input.message, session).pipe(
      Effect.mapError((error) => new LLMError("claude-3.5-sonnet", error.message))
    );

    // Track cost
    yield* costGuard.trackCost(input.sessionId, tokens);

    logger.info("message_processed", {
      sessionId: input.sessionId,
      tokens,
      cost: tokens * 0.001,
    });

    return { response, precision: session.precision };
  })
) as RpcFunction;
```

**Error Mapping to HTTP Status Codes:**

```typescript
// apps/api/src/middleware/error-handler.ts
import * as Rpc from "@effect/rpc/Rpc";
import {
  SessionNotFoundError,
  CostLimitExceededError,
  LLMError,
} from "@workspace/domain";

export function mapErrorToHttpStatus(error: unknown): {
  status: number;
  message: string;
  tag?: string;
} {
  if (error instanceof SessionNotFoundError) {
    return { status: 404, message: "Session not found", tag: "SessionNotFoundError" };
  }

  if (error instanceof CostLimitExceededError) {
    return { status: 429, message: "Daily assessment limit reached", tag: "CostLimitExceededError" };
  }

  if (error instanceof LLMError) {
    return {
      status: error.status || 503,
      message: "Assessment service temporarily unavailable",
      tag: "LLMError",
    };
  }

  // Default
  return { status: 500, message: "Internal server error" };
}

// Use in RPC error handler
app.post("/api/rpc", async (req, res) => {
  try {
    const result = await rpcHandler(req.body);
    res.json(result);
  } catch (error) {
    const { status, message, tag } = mapErrorToHttpStatus(error);

    // Send to Sentry
    Sentry.captureException(error, { tags: { rpc_error: tag } });

    res.status(status).json({ error: message, tag });
  }
});
```

**Key Benefits:**
- ✅ Type-safe: Compiler catches unhandled error types
- ✅ Discriminated unions: Easy pattern matching on error tags
- ✅ Composable: Errors flow through Effect pipelines
- ✅ Serializable: Works with @effect/rpc automatically

**Sources:**
- [Effect Documentation: Expected Errors](https://effect.website/docs/error-management/expected-errors/)
- [Effect Documentation: TaggedError](https://www.typeonce.dev/course/effect-beginners-complete-getting-started/type-safe-error-handling-with-effect/define-errors-with-taggederror)

---

#### 2B: Structured Logging

**Selected: Pino (High-Performance JSON Logging)**

Pino provides structured JSON logging optimized for cloud deployments:

```bash
pnpm -C apps/api add pino pino-pretty
pnpm -C apps/api add -D @types/pino
```

**Logger Setup:**

```typescript
// apps/api/src/logger.ts
import pino from "pino";

export const logger =
  process.env.NODE_ENV === "production"
    ? pino({
        level: process.env.LOG_LEVEL || "info",
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
            remoteAddress: req.remoteAddress,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
            responseTime: res.responseTime,
          }),
          err: pino.stdSerializers.err,
        },
      })
    : pino(
        {
          level: process.env.LOG_LEVEL || "debug",
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
            },
          },
        }
      );

// Child logger per request (for context tracking)
export function getRequestLogger(sessionId: string, userId?: string) {
  return logger.child({
    sessionId,
    userId,
    timestamp: new Date().toISOString(),
  });
}
```

**Usage in Handlers:**

```typescript
// apps/api/src/handlers/assessment.ts
export const sendMessage = ((input) =>
  Effect.gen(function* () {
    const log = getRequestLogger(input.sessionId);

    log.info("send_message_start", {
      messageLength: input.message.length,
    });

    const { response, tokens } = yield* callNerin(input.message);

    log.info("llm_call_completed", {
      model: "claude-3.5-sonnet",
      tokens,
      cost: tokens * 0.003,
      responseLength: response.length,
    });

    return { response, precision: 0.72 };
  })
) as RpcFunction;
```

**Log Output (JSON):**

```json
{
  "level": "info",
  "time": "2026-01-29T15:45:30.123Z",
  "sessionId": "sess_abc123",
  "userId": "user_xyz789",
  "msg": "llm_call_completed",
  "model": "claude-3.5-sonnet",
  "tokens": 450,
  "cost": 0.00135,
  "responseLength": 256,
  "pid": 12345,
  "hostname": "api-server"
}
```

**Key Benefits:**
- ✅ 5x faster than Winston (minimal overhead)
- ✅ JSON by default (searchable, structured)
- ✅ Child loggers (per-session context)
- ✅ Cloud-native (works with log aggregators)

**Sources:**
- [Pino Complete Guide 2026](https://signoz.io/guides/pino-logger/)
- [Pino vs Winston Comparison](https://betterstack.com/community/comparisons/pino-vs-winston/)

---

#### 2C: Error Monitoring & Observability

**Selected: Sentry (Free Developer Plan)**

Sentry provides error tracking, performance monitoring, and alerting:

**Pricing & Plan:**
- **Plan:** Free Developer (supports MVP)
- **Cost:** $0/month
- **Event Quota:** ~5,000 events/month (should be sufficient for MVP)
- **Features:** Error tracking, performance monitoring, email alerts
- **Upgrade Path:** Seamless upgrade to Team ($29/month) if needed post-launch

**Backend Setup (Node.js/Express):**

```bash
pnpm -C apps/api add @sentry/node @sentry/profiling-node
```

```typescript
// apps/api/src/instrument.ts (MUST import first, before other modules)
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  integrations: [
    nodeProfilingIntegration(),
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],

  // Performance monitoring
  tracesSampleRate: 1.0,

  // Profiling
  profilesSampleRate: 1.0,

  // Ignore expected errors (not worth reporting)
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
  ],
});

export default Sentry;
```

```typescript
// apps/api/src/index.ts
import "./instrument"; // MUST be first import
import express from "express";
import * as Sentry from "@sentry/node";
import { betterAuth } from "better-auth";

const app = express();

// Add Sentry request handler BEFORE routes
app.use(Sentry.Handlers.requestHandler());

// Your routes
app.post("/api/rpc", rpcHandler);
app.all("/api/auth/*", authHandler);

// Add Sentry error handler AFTER routes
app.use(Sentry.Handlers.errorHandler());

app.listen(4000);
```

**Capture Exceptions in Error Handler:**

```typescript
// apps/api/src/middleware/error-handler.ts
import * as Sentry from "@sentry/node";
import { SessionNotFoundError, CostLimitExceededError, LLMError } from "@workspace/domain";

export function captureError(error: unknown, context: Record<string, any>) {
  if (error instanceof SessionNotFoundError) {
    // Info level: Expected error, not a bug
    Sentry.captureMessage("Session not found", "info", {
      tags: { error_type: "SessionNotFoundError" },
      extra: context,
    });
  } else if (error instanceof CostLimitExceededError) {
    // Warning level: User hit limit (expected behavior)
    Sentry.captureMessage("Cost limit exceeded", "warning", {
      tags: { error_type: "CostLimitExceededError" },
      extra: context,
    });
  } else if (error instanceof LLMError) {
    // Error level: LLM service failure (unexpected)
    Sentry.captureException(error, {
      tags: { error_type: "LLMError" },
      contexts: { llm: context },
    });
  } else {
    // Unknown error
    Sentry.captureException(error, {
      extra: context,
    });
  }
}
```

**Frontend Setup (TanStack Start):**

```bash
pnpm -C apps/front add @sentry/react @sentry/tracing
```

```typescript
// apps/front/src/entry.tsx (App entry point)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,

  integrations: [
    new Sentry.Replay({
      maskAllText: true, // Privacy: don't capture user input
      blockAllMedia: true, // Privacy: don't capture images/video
    }),
  ],

  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

export const RootComponent = Sentry.withProfiler(() => {
  return <Root />;
});
```

```typescript
// apps/front/src/components/AssessmentUI.tsx
import * as Sentry from "@sentry/react";

export function AssessmentUI() {
  const handleError = (error: Error) => {
    Sentry.captureException(error, {
      tags: { component: "AssessmentUI" },
    });
  };

  return (
    <ErrorBoundary fallback={<ErrorFallback />} onError={handleError}>
      <Assessment />
    </ErrorBoundary>
  );
}
```

**Critical Alerts (Email):**

Sentry sends email alerts for:
- ✅ **New Error Types:** First time an error occurs
- ✅ **Error Spike:** Error rate suddenly increases (> 2x baseline)
- ✅ **Regression:** Error reappears after being marked resolved
- ✅ **Assigned Issues:** When you assign an issue, Sentry notifies

**Manual Configuration (in Sentry Dashboard):**

1. Go to [Sentry.io](https://sentry.io) and create free account
2. Create two projects: "big-ocean-backend" and "big-ocean-frontend"
3. Copy DSN to environment variables:
   ```bash
   SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz      # Backend
   VITE_SENTRY_DSN=https://aaa@bbb.ingest.sentry.io/ccc # Frontend
   ```
4. In Sentry Settings → Alerts → Create Alert Rule for:
   - **Condition:** Error event
   - **Action:** Send email to your address
   - **Frequency:** Per issue (every time a new error type occurs)

**Monitoring Dashboard:**

Sentry provides:
- Error timeline (when errors occurred)
- Stack traces (where errors happened)
- Breadcrumbs (what happened before error)
- Sessions affected (how many users impacted)
- Performance metrics (transaction duration, slow requests)

**Key Benefits:**
- ✅ Free (Developer plan fits MVP)
- ✅ Backend + Frontend unified
- ✅ Email alerts (no Slack needed)
- ✅ Easy upgrade path (to Team plan if needed)
- ✅ Session replay (debug user issues)

**Sources:**
- [Sentry: Express Integration](https://docs.sentry.io/platforms/javascript/guides/express/)
- [Sentry: Pricing & Plans 2026](https://sentry.io/pricing/)
- [Sentry: Node.js Setup](https://docs.sentry.io/platforms/javascript/guides/node/)

---

#### 2D: Cost Tracking via Observability

**Special handling for LLM cost tracking:**

```typescript
// apps/api/src/handlers/assessment.ts
const handleSendMessage = yield* Effect.gen(function* () {
  const logger = getRequestLogger(sessionId);
  const costGuard = yield* Effect.service(CostGuard);

  // Log LLM call as breadcrumb (appears in Sentry error context)
  Sentry.addBreadcrumb({
    category: "llm",
    message: "Claude API call",
    level: "info",
    data: {
      model: "claude-3.5-sonnet",
      tokens: response.tokens,
      cost: response.tokens * 0.003,
    },
  });

  logger.info("llm_cost_tracked", {
    sessionId,
    model: "claude-3.5-sonnet",
    tokens: response.tokens,
    cost: response.tokens * 0.003,
    totalSessionCost: yield* costGuard.getSessionCost(sessionId),
  });

  // Alert if approaching daily limit
  const dailySpent = yield* costGuard.getDailySpent();
  if (dailySpent > 60) {
    Sentry.captureMessage("Approaching daily cost limit", "warning", {
      tags: { cost_tracking: "true" },
      extra: { spent: dailySpent, limit: 75 },
    });
  }
});
```

**Query logs in production:**

You can query Pino logs via:
- Local development: `grep "llm_cost_tracked"` in logs
- Production: Export logs to monitoring service
- Sentry: View cost data in breadcrumbs when debugging errors

---

### Decision Summary: Error Handling & Observability

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Error Model** | Effect TaggedError | Type-safe, composable, integrates with @effect/rpc |
| **Structured Logging** | Pino | 5x faster, cloud-native, minimal overhead |
| **Error Monitoring** | Sentry Free Plan | $0/month, backend + frontend, email alerts |
| **Cost Tracking** | Pino logs + Sentry breadcrumbs | Queryable cost events, correlated with errors |
| **Alerting** | Email (Sentry default) | Simple setup, no Slack needed for MVP |

**Implementation Order:**

1. **Week 1:** Define domain errors (SessionNotFoundError, CostLimitExceededError, etc.)
2. **Week 1:** Configure Pino logger with child loggers per session
3. **Week 2:** Wire Sentry (backend + frontend setup)
4. **Week 2:** Add error handlers to RPC endpoints
5. **Week 3:** Set up email alerts in Sentry
6. **Ongoing:** Monitor Sentry dashboard, adjust log levels as needed

---

### Decision 3: Frontend State Management ✅

**Selected Approach:** TanStack Query with Optimistic Updates + Efficient Server-State Caching

This decision focuses on managing client-side conversation state during the 30-minute assessment using proven HTTP-based patterns.

#### 3A: Client-Side Conversation State

**Selected: TanStack Query (Server-State Caching + Optimistic Updates)**

Simple, efficient HTTP-based state management using [TanStack Query](https://tanstack.com/query/latest):

**Architecture:**

```
User Action (send message)
     ↓
Optimistic Update (instant UI feedback)
     ↓
TanStack Query Mutation (HTTP POST to backend)
     ↓
Backend Processing (Nerin, Analyzer, Scorer)
     ↓
Server Response (updated precision, trait scores)
     ↓
TanStack Query Refetch (background sync with server)
     ↓
React Component (automatic re-render with latest state)
```

**Why TanStack Query:**
- ✅ Standard, proven React data fetching library
- ✅ Optimistic mutations (instant feedback)
- ✅ Automatic background refetching and caching
- ✅ Type-safe with TypeScript support
- ✅ Simple to test (REST mocks)
- ✅ Zero offline-sync complexity

**Key Features:**

```typescript
// apps/front/src/lib/assessment-hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string | null;
  precision: number;
  oceanCode4Letter: string;
  oceanCode5Letter: string;
  createdAt: Date;
  messages: Message[];
}

// Load full session history (used on mount or device resumption)
export function useSessionHistory(sessionId: string) {
  return useQuery<Session>({
    queryKey: ["session", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/full`);
      if (!response.ok) throw new Error("Failed to load session");
      return response.json();
    },
    staleTime: 1000, // Refetch if data older than 1 second
    retry: 3,
  });
}

// Send message with optimistic update
export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json(); // { response, precision, oceanCode4Letter }
    },
    onMutate: async (message) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey: ["session", sessionId] });

      // Save previous state for rollback
      const previous = queryClient.getQueryData<Session>(["session", sessionId]);

      // Optimistic update: add user message immediately
      if (previous) {
        queryClient.setQueryData<Session>(["session", sessionId], (old) => ({
          ...old!,
          messages: [
            ...old!.messages,
            {
              id: `optimistic-${Date.now()}`,
              sessionId,
              role: "user",
              content: message,
              createdAt: new Date(),
            },
          ],
        }));
      }

      return { previous };
    },
    onSuccess: () => {
      // Refetch full session to get server state
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
    onError: (error, message, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["session", sessionId], context.previous);
      }
    },
  });
}

// Precision meter component (auto-updates when session data changes)
export function usePrecision(sessionId: string) {
  const { data: session } = useSessionHistory(sessionId);
  return session?.precision ?? 0;
}
```

**Benefits:**
- ✅ **Instant feedback:** Optimistic updates feel seamless
- ✅ **Automatic sync:** Background refetch keeps UI in sync with server
- ✅ **Network resilient:** Retry logic handles temporary failures
- ✅ **Simple testing:** REST mocks are trivial to write
- ✅ **Zero encryption headache:** No browser key management
- ✅ **Proven pattern:** Used by millions of React apps

**Sources:**
- [TanStack Query Overview](https://tanstack.com/query/latest)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Using React Query](https://tkdodo.eu/blog/the-end-of-an-era-tannos-last-dance)

---

#### 3B: Optimistic Update Strategy

**Selected: Optimistic Mutation + TanStack Query Reconciliation**

When user sends a message during assessment:

```typescript
// apps/front/src/lib/assessment-hooks.ts
const { mutate: sendMessage } = useSendMessage(sessionId);

const handleSendMessage = (message: string) => {
  sendMessage(message, {
    onSuccess: () => {
      // TanStack Query automatically refetches full session
      // UI updates with server state
    },
    onError: () => {
      // TanStack Query rollback handled in hook definition
      toast.error("Failed to send message");
    },
  });
};
```

**User Experience During Assessment:**

```
User types message
     ↓
User clicks SEND
     ↓
Message appears INSTANTLY (optimistic update to query cache)
No loading spinner, no delay
     ↓
(Background: Mutation to backend in flight)
(Background: Backend processes Nerin, updates database)
     ↓
Server response received
(Includes new precision, Nerin response, etc.)
     ↓
TanStack Query refetches full session in background
     ↓
UI updates with server state
Nerin response appears
Precision meter updates
     ↓
All smooth, no jank
```

**Error Handling:**

- **Network error:** Optimistic update rolled back, error toast shown
- **Server error:** Optimistic update rolled back, user can retry
- **Retry logic:** TanStack Query handles automatic retries (configurable)

**Key Behavior:**

- ✅ **Optimistic insert:** Message appears instantly in UI
- ✅ **Background sync:** Server response updates cache automatically
- ✅ **Graceful rollback:** If mutation fails, cache rolled back to previous state
- ✅ **Automatic refetch:** Background sync keeps UI in sync with server

**Sources:**
- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)

---

#### 3C: Assessment UI State & Server Synchronization

**Selected: TanStack Query Caching + Component Re-render**

Simple, proven pattern for managing assessment state:

```typescript
// apps/front/src/routes/assessment.tsx
import { useSessionHistory, useSendMessage } from "~/lib/assessment-hooks";

export function AssessmentPage() {
  const { sessionId } = useParams();
  const { data: session, isLoading } = useSessionHistory(sessionId);
  const { mutate: sendMessage, isPending } = useSendMessage(sessionId);

  const [input, setInput] = useState("");

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    sendMessage(input, {
      onSuccess: () => {
        setInput(""); // Clear input after send
        // TanStack Query automatically refetches and updates component
      },
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!session) return <ErrorMessage>Session not found</ErrorMessage>;

  return (
    <div className="assessment-container">
      {/* Precision meter (updated via TanStack Query refetch) */}
      <PrecisionMeter
        value={session.precision}
        maxValue={100}
        target={70}
        showMilestone={session.precision >= 70}
      />

      {/* Ocean code display (updated via TanStack Query refetch) */}
      {session.oceanCode4Letter && (
        <ArchetypePreview
          code={session.oceanCode4Letter}
          showWhenReady={session.precision >= 70}
        />
      )}

      {/* Conversation list (TanStack Query caches messages) */}
      <ConversationList messages={session.messages} />

      {/* Message input (optimistic updates via mutation hook) */}
      <MessageInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onSend={handleSendMessage}
        disabled={isPending}
      />
    </div>
  );
}
```

**Data Flow:**

```
1. Component mounts
   ↓
2. useSessionHistory fires query to GET /api/sessions/{sessionId}/full
   ↓
3. Server returns: { messages: [], precision, oceanCode4Letter, ... }
   ↓
4. TanStack Query caches response
   ↓
5. Component renders with cached data
   ↓
6. User sends message
   ↓
7. Optimistic update: cache.messages updated immediately
   ↓
8. Component re-renders (shows new message instantly)
   ↓
9. POST /api/sessions/{sessionId}/messages sent to backend
   ↓
10. Server processes (Nerin, Analyzer, Scorer)
    ↓
11. Server responds with updated precision + Nerin response
    ↓
12. TanStack Query invalidates query cache
    ↓
13. Background refetch to GET /api/sessions/{sessionId}/full
    ↓
14. Cache updated with server state
    ↓
15. Component re-renders with latest data
```

**Benefits:**

- ✅ **Simple:** Standard HTTP caching pattern, no sync complexity
- ✅ **Predictable:** Server state is source of truth
- ✅ **Efficient:** Only refetches when data changes
- ✅ **Testable:** REST mocks are straightforward
- ✅ **Robust:** No ElectricSQL/sync edge cases

**Sources:**
- [TanStack Query Overview](https://tanstack.com/query/latest)

---

### Additional State Management: Context & Forms

**UI State (Non-Synced):**

```typescript
// apps/front/src/context/assessment-context.tsx
import { createContext, useContext, useState } from "react";

interface AssessmentContextType {
  showSignUpModal: boolean;
  setShowSignUpModal: (show: boolean) => void;
  showResultsModal: boolean;
  setShowResultsModal: (show: boolean) => void;
  completionMessage: string | null;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  return (
    <AssessmentContext.Provider
      value={{
        showSignUpModal,
        setShowSignUpModal,
        showResultsModal,
        setShowResultsModal,
        completionMessage,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
}

export const useAssessmentUI = () => {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("AssessmentProvider not found");
  return ctx;
};
```

**Form State (TanStack Form):**

```typescript
// apps/front/src/components/SignUpModal.tsx
import { useForm } from "@tanstack/react-form";

export function SignUpModal() {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const result = await authClient.signUp.email({
        email: value.email,
        password: value.password,
      });

      if (!result.error) {
        // Automatically redirects after successful signup
        window.location.reload();
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => {
            if (!value.includes("@")) return "Invalid email";
            return undefined;
          },
        }}
        children={(field) => (
          <Input
            type="email"
            placeholder="Email"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      />

      <form.Field name="password">
        {(field) => (
          <Input
            type="password"
            placeholder="Password (12+ characters)"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <Button type="submit">Create Account</Button>
    </form>
  );
}
```

---

### Frontend State Management Architecture Summary

| State Type | Technology | Pattern | Updates |
|-----------|-----------|---------|---------|
| **Assessment Data** | TanStack Query | Server-state caching | Background refetch |
| **Conversation** | TanStack Query (cached) | useSessionHistory hook | On refetch |
| **Precision** | TanStack Query (cached) | useSessionHistory hook | On refetch |
| **OCEAN Code** | TanStack Query (cached) | useSessionHistory hook | On refetch |
| **UI (Modals)** | React Context | Manual | User events |
| **Form (Sign-up)** | TanStack Form | Form-driven | Form submission |
| **Shared Profile** | TanStack Query | Server state | On-demand |

**Key Principles:**

1. **Server-State Management:** Use TanStack Query for all assessment data (messages, precision, OCEAN codes)
2. **Optimistic Updates:** Mutate cache immediately, refetch from server on response
3. **Automatic Sync:** TanStack Query background refetch keeps UI in sync with server
4. **UI State:** React Context for modals, toggles (non-synced)
5. **Forms:** TanStack Form for structured input validation

**Implementation Priority:**

1. **Week 1:** Set up TanStack Query hooks (useSessionHistory, useSendMessage)
2. **Week 1:** Create API endpoints (GET /sessions/{id}/full, POST /sessions/{id}/messages)
3. **Week 1-2:** Implement optimistic mutations + error handling
4. **Week 2:** Implement sign-up modal flow
5. **Week 2:** Wire progress indicator (auto-updates via TanStack Query)

---

## Decision 4: Infrastructure & Hosting ✅

**Selected Approach:** All-Railway Unified Platform with Docker Compose for Local Development

This decision addresses three interconnected concerns: deployment platform simplicity, database infrastructure, and backup/disaster recovery strategy.

### Context: Why Simplified Infrastructure Matters

For a self-funded MVP with complex LLM orchestration, **operational burden is a productivity killer**. Every additional platform means:
- Extra login credentials to manage
- Separate billing invoices
- Different learning curves
- More places for bugs to hide
- More monitoring dashboards

**Railway solves this:** single dashboard, single invoice, one ecosystem for backend + database + cache + monitoring.

---

### Decision 4A: Deployment Platform

**Selected: All-Railway (Single Unified Platform)**

#### Why All-Railway vs. Vercel + Railway?

| Aspect | All Railway | Vercel + Railway |
|--------|------------|-----------------|
| **Platforms to manage** | 1 | 2 |
| **Dashboards** | 1 | 2 |
| **Billing** | 1 invoice | 2 invoices |
| **Latency** | Lowest (co-located) | Slight cross-platform overhead |
| **Learning curve** | Single ecosystem | Learn both platforms |
| **Docker Compose parity** | Perfect (same container runtime) | Good but two deployment styles |
| **MVP Friction** | Minimal | Additional context switching |

**Key Insight:** Vercel's main advantage is TanStack Start SSR optimization (built by same team). For MVP, this is **premature optimization**. Railway serves TanStack Start perfectly fine.

#### All-Railway Architecture

```
Railway Dashboard (Single pane of glass):
├─ Backend Service
│  └─ Node.js (LangGraph + Effect-ts + Better Auth)
│  └─ Dockerfile: apps/api/Dockerfile
│  └─ Environment: PORT=4000
│
├─ Frontend Service
│  └─ Node.js / TanStack Start (optional separate service)
│  └─ Or: Served from backend + reverse proxy
│
├─ PostgreSQL Database (Managed)
│  └─ Connection pooling automatic
│  └─ Backups: 7-day retention (default)
│  └─ Server-side encryption at rest
│
└─ Redis Cache
   └─ For cost tracking + rate limiting
   └─ For session state (optional)
```

**Cost Estimate (MVP):**
- Backend service: $2-5/month (usage-based)
- PostgreSQL: $2-5/month (usage-based)
- Redis: $1-2/month (usage-based)
- **Total: $5-12/month** ✅ Cheapest option

**Key Benefits:**
- ✅ Single dashboard = single source of truth for monitoring
- ✅ Docker Compose locally → exact same container in production
- ✅ No cold starts (traditional VPS, not serverless)
- ✅ No timeout constraints (unlike Cloudflare Workers)
- ✅ Native PostgreSQL + Redis support
- ✅ Usage-based pricing = pay only what you use
- ✅ Free tier available for experimentation

**Constraints:**
- ⚠️ Less advanced SSR optimizations than Vercel (negligible for MVP)
- ⚠️ No global edge deployment (acceptable for MVP latency targets)

**When You'd Upgrade (Phase 2):**

If you need global edge deployment or advanced SSR optimizations, add **Vercel as a CDN in front** without changing backend:
```
Users → Vercel CDN (edge caching)
     → Railway backend (origin)
```

---

### Decision 4B: Database Infrastructure

**Selected: Railway-Managed PostgreSQL + Redis**

**Why Railway Database?**

| Aspect | Railway | Alternatives |
|--------|---------|--------------|
| **Cost (MVP)** | $2-5/month | Neon $0 (free), Render $7+, Supabase $0-25 |
| **Setup time** | 2 minutes (click "Add Postgres") | 5 minutes (external setup) |
| **Encryption at rest** | ✅ Supported | ✅ All support encryption |
| **Operational burden** | Minimal (managed by Railway) | Minimal (managed) |
| **Scaling** | Automatic | Automatic |
| **Backup included** | Yes (7 days) | Yes (varies by provider) |

**PostgreSQL Configuration:**

```bash
# Railway automatically enables:
# - SSL/TLS connections (required for security)
# - Automatic daily backups (7-day retention)
# - Connection pooling via built-in proxy
# - Server-side encryption at rest

# You get environment variables automatically:
DATABASE_URL=postgresql://user:pass@host:port/big_ocean
```

**Redis Configuration:**

```bash
# Railway Redis for:
# - Cost tracking (adaptive token budget)
# - Rate limiting (1 assessment/user/day)
# - Session cache (optional)

REDIS_URL=redis://user:pass@host:port
```

**No Additional Setup Required:**
- Railway manages schema migrations (you run `drizzle-kit push`)
- Railway manages backups automatically
- Railway manages connection pooling
- Railway handles SSL/TLS

---

### Decision 4C: Backup & Disaster Recovery

**Selected: Railway-Managed Backups + Manual Export Strategy**

**For MVP (Early Stage):**

```
Railway automatic backups (included):
├─ 7-day retention
├─ Daily snapshots
├─ Point-in-time recovery (within 7 days)
└─ Cost: $0 (included)
```

**Recovery Strategy:**

If disaster occurs:
1. **Within 7 days:** Use Railway's PITR (point-in-time recovery)
   ```bash
   # In Railway dashboard: Database → Restore → Choose timestamp
   ```

2. **After 7 days:** Recreate from source (conversations are recoverable via Anthropic API logs)

**When You'd Add 3-2-1 Backups (Phase 2):**

Once you have paying users, implement:
```bash
# Daily export to S3
* 0 1 * * * \
  pg_dump $DATABASE_URL \
  | gzip \
  | aws s3 cp - s3://backups-big-ocean/$(date +\%Y-\%m-\%d).sql.gz

# Weekly export to GCS (offsite)
* 0 0 * * 0 \
  aws s3 cp s3://backups-big-ocean/latest.sql.gz \
  gs://backups-big-ocean/weekly/
```

**Cost:** $0 MVP → $2-5/month Phase 2 (S3 storage)

---

## Infrastructure Setup Flow

### Step 1: Create Railway Project

```bash
# 1. Go to https://railway.app
# 2. Sign up (GitHub OAuth)
# 3. Create new project
```

### Step 2: Connect GitHub Repository

```bash
# In Railway dashboard:
# 1. New → GitHub repo (connect authorization)
# 2. Select: vincentlay/big-ocean
# 3. Railway watches for deployments
```

### Step 3: Add PostgreSQL Service

```bash
# In Railway dashboard → Add Service → PostgreSQL
# Configuration auto-set:
# - Version: Latest
# - Storage: 10GB
# - Connections: 10 (enough for MVP)

# Get connection string
# Settings → PostgreSQL → CONNECTION_STRING
DATABASE_URL=postgresql://...
```

### Step 4: Add Redis Service

```bash
# In Railway dashboard → Add Service → Redis
# Configuration auto-set:
# - Version: Latest
# - Memory: 256MB
# - Eviction policy: allkeys-lru

# Get connection string
# Settings → Redis → REDIS_URL
REDIS_URL=redis://...
```

### Step 5: Configure Backend Service

```bash
# Railway auto-detects:
# - apps/api/Dockerfile
# - apps/api/package.json
# - Start command: node dist/index.js

# Add environment variables in Railway Dashboard:
# Backend Settings → Variables:
DATABASE_URL=<from PostgreSQL>
REDIS_URL=<from Redis>
BETTER_AUTH_SECRET=<generate: openssl rand -hex 32>
ANTHROPIC_API_KEY=<your API key>
SENTRY_DSN=<from Sentry>
NODE_ENV=production
```

### Step 6: Deploy Backend

```bash
# Option A: Manual trigger
# In Railway dashboard → Backend → Deploy

# Option B: Automatic on git push
# (Default: Railway watches main branch)
git push origin main
# Railway auto-detects changes, builds, deploys
```

### Step 7: Run Database Migrations

```bash
# One-time: Initialize schema
pnpm -C apps/api drizzle-kit push

# Railway provides shell access:
# Dashboard → Backend → Shell
# Run: drizzle-kit push --config=drizzle.config.ts
```

### Step 8: (Optional) Configure Frontend Deployment

**Option A: Serve from Backend**
```typescript
// apps/api/src/index.ts
app.use(express.static("../front/dist"));
```

**Option B: Separate Railway Service (Frontend as separate service)****
```bash
# In Railway dashboard → Add Service → GitHub
# Select: apps/front
# Build command: pnpm -C apps/front build
# Start command: pnpm -C apps/front start
```

---

## Local Development with Docker Compose

Your existing Docker Compose setup works **exactly** as production:

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: big_ocean
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/big_ocean
      REDIS_URL: redis://redis:6379
      BETTER_AUTH_SECRET: dev-secret
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NODE_ENV: development

  frontend:
    build:
      context: ./apps/front
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://backend:4000

volumes:
  postgres_data:
```

**Local Workflow:**

```bash
# Start everything locally
docker-compose up -d

# Backend available at: http://localhost:4000
# Frontend available at: http://localhost:3001
# PostgreSQL at: localhost:5432 (user: dev, pass: dev)
# Redis at: localhost:6379

# Run migrations locally
pnpm -C apps/api drizzle-kit push

# Develop normally
pnpm dev

# Logs
docker-compose logs -f backend
```

**Parity with Production:**
- ✅ Same PostgreSQL version (16)
- ✅ Same Redis version (7)
- ✅ Same Node.js runtime (Railway uses your Dockerfile)
- ✅ Same environment variables (Railway → .env)
- ✅ Same dependencies

---

## Monitoring & Operations (Phase 1)

**What Railway Provides:**

```
Dashboard → Backend Service:
├─ CPU usage
├─ Memory usage
├─ Disk usage
├─ Network I/O
└─ Deployment history (with rollback capability)

Dashboard → PostgreSQL:
├─ Connection count
├─ Query performance
└─ Storage usage

Dashboard → Redis:
├─ Memory usage
├─ Hit rate
├─ Commands/sec
└─ Connected clients
```

**No Additional Tools Needed (MVP):**

- Railway dashboard covers 80% of monitoring needs
- Sentry covers error tracking (already configured)
- Pino logs appear in Railway logs tab
- Cost tracking via Pino + Sentry breadcrumbs

**Alerting (Phase 2):**

When database grows, add:
- Railway alerts (CPU, memory, disk thresholds)
- Custom metrics via Sentry

---

## Cost Summary (All-Railway Path)

| Component | Monthly Cost | Notes |
|-----------|------------|-------|
| Backend | $2-5 | Usage-based (CPU hours, memory) |
| PostgreSQL | $2-5 | Usage-based (storage, queries) |
| Redis | $1-2 | Usage-based (memory, operations) |
| **Railway Total** | **$5-12** | Scales with usage |
| Claude API | ~$90 | Fixed (based on assessment volume) |
| Sentry | $0 | Free Developer plan |
| **MVP Total** | **~$95-102/month** | Dominated by LLM costs |

**Payment Model:**
- All Railway services: Usage-based (you can set spending limits)
- Claude API: Based on token usage (configure daily cap: $75/day)
- Billing: Single Railway invoice + Anthropic invoice

---

## Why Not the Alternatives?

### Cloudflare Workers (Pages + Workers)
- ❌ **10-30 second timeout** is dealbreaker for Nerin agent reasoning
- ⚠️ LangGraph compatibility uncertain under timeout constraint
- ⚠️ Effect-ts requires bridge pattern (extra complexity)
- 🚨 Risk: Long reasoning chains would timeout

### Cloudflare Containers (Pages + Containers)
- ⏳ **Still in beta** (launched June 2025, stability unproven)
- ⚠️ **Pricing model unclear** (free during beta, unknown at GA)
- ⚠️ Community track record thin
- Later: Once Containers GA + pricing transparent, consider as alternative

### Vercel + Railway
- ✅ Works well
- ⚠️ **Extra complexity:** Two platforms, two dashboards, two invoices
- ⚠️ Vercel's SSR advantages negligible for MVP
- Later: Add Vercel CDN in Phase 2 if needed

### Docker VPS (Linode, Vultr, DigitalOcean)
- ✅ Works, full control
- ⚠️ **Operational burden:** You manage OS patching, backups, monitoring
- ⚠️ Fixed cost ($20/month minimum)
- ❌ Not worth the overhead for MVP

---

## Implementation Roadmap

**Week 1: Infrastructure Setup**

```
Monday-Tuesday:
  1. Create Railway project + connect GitHub
  2. Add PostgreSQL + Redis services
  3. Configure environment variables
  4. Deploy backend to Railway
  5. Run migrations: drizzle-kit push

Wednesday-Thursday:
  6. Test database connectivity from backend (TanStack Query integration)
  7. Test Redis connectivity (cost tracking + rate limiting)
  8. Configure Sentry DSN in Railway
  9. Set up TanStack Query base configuration

Friday:
  10. Load test locally with Docker Compose
  11. Test assessment flow end-to-end
  12. Verify logs appear in Railway dashboard
  13. Verify errors appear in Sentry
```

**Week 2: Ongoing**

```
Daily:
  - Monitor Railway dashboard (CPU, memory, errors)
  - Check Sentry for new errors
  - Verify Pino logs are captured

As Needed:
  - Update environment variables (API keys, secrets)
  - Roll back deployment if needed (Railway provides UI)
  - Increase PostgreSQL storage if approaching limit
```

---

## Decisions Summary

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Deployment Platform** | All-Railway | Single platform, lowest operational burden, perfect Docker Compose parity |
| **Database** | Railway PostgreSQL | Managed, server-side encryption, AES-256 at rest, $2-5/month |
| **Cache** | Railway Redis | Same platform, cost tracking + rate limiting, $1-2/month |
| **Backup Strategy** | Railway managed + manual export (Phase 2) | 7-day PITR included, add 3-2-1 later |
| **Monitoring** | Railway dashboard + Sentry + Pino | Coverage without extra tools |
| **Frontend** | Serve from backend (MVP) or separate Railway service (Phase 2) | Simplicity vs. scaling trade-off |

**Why This Wins for MVP:**

1. **Simplicity:** One platform, one dashboard, one invoice
2. **Cost:** Cheapest infrastructure option ($5-12/month)
3. **Parity:** Docker Compose locally = Railway production (identical containers)
4. **No surprises:** Usage-based pricing, no hidden costs
5. **Scaling:** Grows smoothly from 10 to 1000 users without re-architecture

---

**Sources:**
- [Railway Documentation](https://docs.railway.app/)
- [Railway Pricing](https://railway.app/pricing)
- [PostgreSQL AES-256 Encryption](https://www.postgresql.org/docs/current/pgcrypto.html)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)

---

## Decision 5: Testing Strategy ✅

**Scope:** Unit testing, integration testing, E2E testing, and LLM/agent testing for a complex full-stack system with multi-agent orchestration, local-first sync, and cost-critical LLM integration.

**Testing Challenges:**

1. **LangGraph Agent Testing:** How to verify multi-agent state flows without calling Claude API every test
2. **TanStack Query Caching:** How to test optimistic updates, rollback, and background refetch
3. **Cost Tracking Testing:** How to verify token counting and rate limiting don't break
4. **Authentication Integration:** Testing Better Auth signup flow + RPC coordination
5. **Deterministic OCEAN Codes:** Ensuring trait scores always map to same 5-letter code (or 4-letter for naming)

**Core Principle:** Tests should run locally in seconds, not require external services (except CI/CD).

---

### Decision 5A: Unit Testing Framework

**Recommendation: Vitest**

```bash
pnpm add -D vitest @vitest/ui @vitest/coverage-v8
```

**Why Vitest:**
- ✅ Native ESM support (no CommonJS issues)
- ✅ Effect-ts friendly (Effect team uses Vitest)
- ✅ Monorepo optimized (workspace setup built-in)
- ✅ Instant HMR for test files
- ✅ React 19 compatible (uses Vite config)
- ✅ ~10x smaller than Jest
- ✅ Snapshot testing built-in

**Example: OCEAN Code Generation Test**

```typescript
// packages/domain/src/ocean.test.ts
import { describe, it, expect } from "vitest";
import { generateOceanCode4Letter } from "./ocean";

describe("OCEAN Code Generation", () => {
  it("generates deterministic 4-letter code from trait scores", () => {
    const code = generateOceanCode4Letter({
      openness: 18,
      conscientiousness: 14,
      extraversion: 10,
      agreeableness: 16,
    });

    expect(code).toBe("HMLH"); // Deterministic
  });

  it("always returns 4 characters for 4 traits", () => {
    const code = generateOceanCode4Letter({
      openness: 10,
      conscientiousness: 10,
      extraversion: 10,
      agreeableness: 10,
    });

    expect(code).toHaveLength(4);
    expect(code).toMatch(/^[HML]{4}$/);
  });
});
```

**Example: Cost Calculation Test**

```typescript
// packages/domain/src/cost-guard.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CostCalculator } from "./cost-calculator";

describe("Cost Calculation", () => {
  let calculator: CostCalculator;

  beforeEach(() => {
    calculator = new CostCalculator({
      inputCostPerMToken: 0.003,
      outputCostPerMToken: 0.015,
    });
  });

  it("calculates cost correctly for token counts", () => {
    const cost = calculator.calculateCost(1000, 500);
    expect(cost).toBeCloseTo(0.0000105, 7);
  });

  it("enforces daily limit", () => {
    calculator.setDailyLimit(75); // cents
    calculator.recordCost(0.50);

    expect(calculator.getRemainingBudget()).toBeCloseTo(0.25, 2);
    expect(calculator.canSpend(0.30)).toBe(false);
  });

  it("resets daily budget at midnight", () => {
    calculator.setDailyLimit(75);
    calculator.recordCost(0.50);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-31"));

    expect(calculator.getRemainingBudget()).toBeCloseTo(0.75, 2);
    vi.useRealTimers();
  });
});
```

---

### Decision 5B: Integration Testing (Backend + Database)

**Context:** Tests verifying RPC contracts work with actual database interactions and Effect layers.

**Tools: Vitest + TestContainers**

```bash
pnpm add -D testcontainers
```

**Example: RPC Integration Test**

```typescript
// apps/api/src/__tests__/assessment.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Effect, Layer } from "effect";
import { testDb } from "../test-utils/db-container";
import { AssessmentHandlers } from "../handlers/assessment";
import { mockAnthropicApi } from "../test-utils/mock-anthropic";

describe("Assessment RPC Integration", () => {
  let testEnv: Awaited<ReturnType<typeof testDb.start>>;

  beforeAll(async () => {
    testEnv = await testDb.start();
    await testEnv.runMigrations();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("startAssessment creates session and returns sessionId", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const handlers = AssessmentHandlers;
        const response = yield* handlers.startAssessment({ userId: "user123" });

        expect(response).toHaveProperty("sessionId");
        expect(response.sessionId).toMatch(/^[a-z0-9-]+$/);

        const session = yield* testEnv.db.query.sessions.findFirst({
          where: (s) => s.id.equals(response.sessionId),
        });

        expect(session).toBeDefined();
        expect(session?.userId).toBe("user123");
        expect(session?.precision).toBe(0);
      }).pipe(Layer.provide(testEnv.layer))
    );
  });

  it("respects cost limits and refuses messages when limit exceeded", async () => {
    const sessionId = "test-session-cost";

    await Effect.runPromise(
      Effect.gen(function* () {
        const costGuard = yield* Effect.service(CostGuard);
        costGuard.setDailyLimit(0.01); // 1 cent

        mockAnthropicApi.setMockResponse({
          content: "Response",
          tokens: { input: 100000, output: 100000 }, // Very expensive
        });

        const handlers = AssessmentHandlers;
        const result = yield* handlers.sendMessage({
          sessionId,
          message: "Message",
        }).pipe(Effect.either);

        expect(result._tag).toBe("Left");
        expect(result.left).toBeInstanceOf(CostLimitExceededError);
      }).pipe(Layer.provide(testEnv.layer))
    );
  });
});
```

**Test Database Container:**

```typescript
// apps/api/src/test-utils/db-container.ts
import { GenericContainer } from "testcontainers";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

export const testDb = {
  async start() {
    const container = await new GenericContainer("postgres:16")
      .withEnvironment("POSTGRES_PASSWORD", "test")
      .withEnvironment("POSTGRES_DB", "big_ocean_test")
      .withExposedPorts(5432)
      .start();

    const port = container.getMappedPort(5432);
    const pool = new Pool({
      host: "localhost",
      port,
      database: "big_ocean_test",
      user: "postgres",
      password: "test",
    });

    const db = drizzle(pool);

    return {
      db,
      pool,
      async runMigrations() {
        await db.migrate();
      },
      async cleanup() {
        await pool.end();
        await container.stop();
      },
      layer: Layer.succeed(DatabaseService, db),
    };
  },
};
```

---

### Decision 5C: E2E Testing (Full Assessment Flow)

**Recommendation: Playwright**

```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```

**Why Playwright:**
- ✅ Multi-browser support (Chromium, Firefox, WebKit)
- ✅ Better TanStack Start SSR support
- ✅ Faster than Cypress (no instrumentation overhead)
- ✅ Better mobile/cross-browser testing
- ✅ Smaller footprint

**Example: Complete Assessment Flow**

```typescript
// apps/front/e2e/assessment-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Assessment Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3001");
  });

  test("user can complete assessment without account", async ({ page }) => {
    // 1. Click "Start Assessment"
    await page.click("button:has-text('Start Assessment')");

    // 2. Verify first message from Nerin
    await expect(
      page.locator("[data-testid='nerin-message']").first()
    ).toContainText(/tell me about|describe yourself/i, { timeout: 10000 });

    // 3. Send messages (5 total to trigger analysis)
    const messages = [
      "I love reading, coding, and hiking in nature.",
      "I prefer working alone on complex problems.",
      "I'm detail-oriented and plan everything.",
      "I rarely get anxious or stressed.",
      "I care deeply about helping others.",
    ];

    for (const msg of messages) {
      await page.fill("[data-testid='message-input']", msg);
      await page.click("[data-testid='send-button']");

      // Wait for response
      await page.waitForFunction(
        () =>
          document.querySelectorAll("[data-testid='nerin-message']").length > 0,
        { timeout: 10000 }
      );
    }

    // 4. Verify precision indicator updated
    const precision = await page.locator("[data-testid='precision-bar']")
      .getAttribute("data-precision");
    expect(Number(precision)).toBeGreaterThan(0);

    // 5. Verify OCEAN code displayed
    await expect(
      page.locator("[data-testid='ocean-code-4letter']")
    ).toMatch(/^[A-Z]{4}$/);

    // 6. Verify archetype name displayed
    await expect(page.locator("[data-testid='archetype-name']")).toBeDefined();
  });

  test("user can resume incomplete assessment", async ({ page }) => {
    // Start and send one message
    await page.click("button:has-text('Start Assessment')");
    await page.fill("[data-testid='message-input']", "I love nature.");
    await page.click("[data-testid='send-button']");

    const sessionUrl = page.url();

    // Refresh to simulate interruption
    await page.reload();

    // Verify message still there
    await expect(
      page.locator("[data-testid='user-message']").first()
    ).toContainText("I love nature");
  });

  test("shared profile link is accessible without auth", async ({ page }) => {
    // Complete assessment...
    await page.click("button:has-text('Start Assessment')");

    // Send 5+ messages to complete
    for (let i = 0; i < 5; i++) {
      await page.fill("[data-testid='message-input']", `Message ${i}`);
      await page.click("[data-testid='send-button']");
      await page.waitForTimeout(500);
    }

    // Get share link
    const shareLink = await page
      .locator("[data-testid='share-link']")
      .inputValue();

    // Open in new context (unauthenticated)
    const context = await page.context();
    const anonPage = await context.newPage();
    await anonPage.goto(shareLink);

    // Verify public profile visible
    await expect(anonPage.locator("[data-testid='archetype-name']")).toBeDefined();
    await expect(
      anonPage.locator("[data-testid='ocean-code-4letter']")
    ).toBeDefined();

    // Verify private data NOT visible
    await expect(anonPage.locator("[data-testid='full-conversation']")).not.toBeVisible();
  });
});
```

**playwright.config.ts:**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
```

---

### Decision 5D: LLM/Agent Testing (Mock Nerin)

**Strategy: Mock Anthropic API for deterministic tests**

```typescript
// apps/api/src/test-utils/mock-anthropic.ts
export const mockAnthropicApi = {
  responses: new Map<string, string>(),
  tokens: { input: 0, output: 0 },

  setMockResponse(pattern: string, response: string) {
    this.responses.set(pattern, response);
  },

  setTokenCounts(input: number, output: number) {
    this.tokens = { input, output };
  },

  async create(params: any) {
    const lastMessage = params.messages[params.messages.length - 1].content;
    const response = this.responses.get(lastMessage) || "Mock Nerin response";

    return {
      id: "mock-message-" + Date.now(),
      type: "message" as const,
      role: "assistant" as const,
      content: [{ type: "text" as const, text: response }],
      model: "claude-3.5-sonnet-20241022",
      stop_reason: "end_turn" as const,
      stop_sequence: null,
      usage: {
        input_tokens: this.tokens.input,
        output_tokens: this.tokens.output,
      },
    };
  },
};
```

**Example: LangGraph State Machine Test**

```typescript
// apps/api/src/__tests__/langgraph-orchestration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { mockAnthropicApi } from "../test-utils/mock-anthropic";
import { createOrchestratorGraph } from "../agents/orchestrator";

describe("LangGraph Orchestration", () => {
  let graph: ReturnType<typeof createOrchestratorGraph>;

  beforeEach(() => {
    mockAnthropicApi.setTokenCounts(100, 50);
    graph = createOrchestratorGraph(mockAnthropicApi);
  });

  it("triggers analyzer every 3 messages", async () => {
    const state = {
      messages: Array(5)
        .fill(null)
        .map((_, i) => ({
          role: i % 2 === 0 ? "user" : "assistant",
          content: `Message ${i}`,
        })),
      messageCount: 5,
      precision: 25,
    };

    const result = await graph.invoke(state);

    // After 5 messages (3 user msgs), analyzer should run
    expect(result.precision).toBeGreaterThan(25);
  });

  it("skips analysis when cost limit approaches", async () => {
    const state = {
      messages: Array(7)
        .fill(null)
        .map((_, i) => ({
          role: i % 2 === 0 ? "user" : "assistant",
          content: `Message ${i}`,
        })),
      messageCount: 7,
      precision: 75,
      remainingBudget: 0.01, // Very low
    };

    const result = await graph.invoke(state);

    // Should only route to Nerin, not expensive analysis
    expect(result.messages.length).toBe(8); // 7 + 1 Nerin
  });
});
```

**Example: Precision Scoring Determinism Test**

```typescript
// apps/api/src/__tests__/precision-scoring.test.ts
import { describe, it, expect } from "vitest";
import { Scorer } from "../agents/scorer";
import { mockAnthropicApi } from "../test-utils/mock-anthropic";

describe("Precision Scoring Determinism", () => {
  const scorer = new Scorer(mockAnthropicApi);

  it("always produces same OCEAN code for same messages", async () => {
    mockAnthropicApi.setMockResponse(
      "score",
      JSON.stringify({
        openness: 18,
        conscientiousness: 16,
        extraversion: 14,
        agreeableness: 17,
      })
    );

    const messages = [
      "I love reading",
      "I'm very organized",
      "I enjoy people",
      "I'm empathetic",
      "I don't stress",
    ];

    const result1 = await scorer.scoreTraits(messages);
    const result2 = await scorer.scoreTraits(messages);

    expect(result1.oceanCode4Letter).toBe(result2.oceanCode4Letter);
    expect(result1.oceanCode4Letter).toBe("HHHH");
  });
});
```

---

### Test Coverage Goals (MVP Phase 1)

| Layer | Coverage Goal | Priority |
|-------|--------------|----------|
| **Domain Logic** (OCEAN, cost, precision) | 100% | Critical |
| **RPC Contracts** (sendMessage, startAssessment) | 90%+ | Critical |
| **Database Queries** (Drizzle) | 80%+ | High |
| **LangGraph Routing** | 85%+ | High |
| **Authentication Flow** | 70%+ | High |
| **UI Components** (shadcn/ui) | 100% Storybook docs, 60% unit tests | High |
| **Component Accessibility** (a11y) | 100% checklist via Storybook addon | Critical |
| **Error Handling** | 90%+ | Critical |
| **E2E Happy Path** | 100% | Critical |

---

### Decision 5E: Component Documentation & Storybook

**Context:** The `packages/ui` library contains shadcn/ui-based components shared across frontend and backend (SSR-friendly). Each component needs:
- Interactive documentation (Storybook)
- Visual regression testing
- Accessibility testing
- Props documentation

**Recommendation: Storybook 10.1.11 with Vitest & Accessibility Testing**

**Setup:**

```bash
# Initialize Storybook in packages/ui
pnpm dlx storybook@latest init --type react

# Add testing libraries
pnpm -C packages/ui add -D \
  @storybook/test \
  @storybook/addon-a11y \
  @chromatic-com/storybook
```

**Storybook Configuration:**

```typescript
// packages/ui/.storybook/main.ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y", // Accessibility testing
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag", // Auto-generate docs from stories
  },
};

export default config;
```

**Example: Button Component Story**

```typescript
// packages/ui/src/components/button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { expect, userEvent, within } from "@storybook/test";

const meta = {
  component: Button,
  title: "Components/Button",
  tags: ["autodocs"], // Auto-generate documentation
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Primary button for main actions (default variant).
 */
export const Primary: Story = {
  args: {
    variant: "default",
    children: "Primary Button",
  },
};

/**
 * Secondary button for less important actions.
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

/**
 * Destructive button for deletion/warning actions (red).
 */
export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Delete",
  },
};

/**
 * Disabled state (prevents user interaction).
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};

/**
 * Interaction test: Click button and verify callback fired.
 */
export const WithInteraction: Story = {
  args: {
    children: "Click Me",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    // User clicks button
    await userEvent.click(button);

    // Button should have focus
    await expect(button).toBeFocused();
  },
};

/**
 * Accessibility test: Verify semantic HTML and ARIA attributes.
 */
export const Accessible: Story = {
  args: {
    children: "Accessible Button",
    type: "button",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");

    // Button is properly labeled
    await expect(button).toHaveAccessibleName("Accessible Button");
  },
};
```

**Example: Form Components Story**

```typescript
// packages/ui/src/components/form.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useForm } from "@tanstack/react-form";
import { Input } from "./input";
import { Label } from "./label";

const meta = {
  component: Input,
  title: "Components/Form/Input",
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "date"],
    },
    placeholder: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {
  args: {
    type: "text",
    placeholder: "Enter your name",
  },
};

export const EmailInput: Story = {
  args: {
    type: "email",
    placeholder: "you@example.com",
  },
};

export const PasswordInput: Story = {
  args: {
    type: "password",
    placeholder: "Enter password (12+ chars)",
  },
};

/**
 * Form with validation (TanStack Form integration).
 */
export const WithValidation: Story = {
  render: () => {
    const form = useForm({
      defaultValues: {
        email: "",
        password: "",
      },
      onSubmit: ({ value }) => {
        console.log("Form submitted:", value);
      },
    });

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value.includes("@")) return "Invalid email";
              },
            }}
          >
            {(field) => (
              <>
                <Input
                  id="email"
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="you@example.com"
                />
                {field.state.meta.errors && (
                  <p className="text-red-500 text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </>
            )}
          </form.Field>
        </div>

        <button type="submit">Submit</button>
      </form>
    );
  },
};
```

**Storybook Commands:**

```bash
# Start Storybook dev server (port 6006)
pnpm -C packages/ui storybook

# Build static Storybook site
pnpm -C packages/ui build-storybook

# Run visual regression tests with Chromatic (optional, paid)
pnpm -C packages/ui chromatic --project-token=...
```

---

### Decision 5F: Visual Regression Testing

**For MVP:** Use Storybook's built-in visual testing via interactions + accessibility addon.

**For Phase 2:** Add Chromatic for cloud-based visual regression testing.

**Why not add in MVP:**

- ✅ Chromatic is paid ($99+/month)
- ✅ Storybook interactions cover most use cases
- ✅ Can add later when component library stabilizes

**Chromatic Setup (Phase 2):**

```bash
# Install Chromatic
pnpm add -D chromatic

# Authenticate
pnpm chromatic --project-token=YOUR_TOKEN

# Push baseline
pnpm chromatic --auto

# Automatic checks on PR
# (Chromatic GitHub action handles this)
```

---

### Decision 5G: Component Accessibility Testing

**Built-in:** Storybook's `@storybook/addon-a11y` checks every story for:
- ✅ Color contrast (WCAG AA/AAA)
- ✅ Missing labels/ARIA attributes
- ✅ Keyboard navigation
- ✅ Screen reader compatibility

**Example: Accessibility Violations Report**

```typescript
// packages/ui/src/components/dialog.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Dialog } from "./dialog";

const meta = {
  component: Dialog,
  title: "Components/Dialog",
  tags: ["autodocs"],
  parameters: {
    a11y: {
      config: {
        rules: {
          // Disable specific rules if justified
          "color-contrast": { enabled: false }, // Custom styling okay
        },
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    title: "Are you sure?",
    description: "This action cannot be undone.",
    children: "Delete account",
  },
  play: async ({ canvasElement }) => {
    // Storybook a11y addon automatically checks:
    // - Focus management (dialog gets focus)
    // - Keyboard trap (Tab/Escape work)
    // - ARIA attributes (role="alertdialog")
  },
};
```

---

### Component Documentation Standards

**Every component story should include:**

1. **JSDoc Comments** — Brief description + usage notes
   ```typescript
   /**
    * Button component for primary actions.
    *
    * Use `variant="destructive"` for deletion actions.
    * Avoid using multiple primary buttons in same section.
    */
   export const Primary: Story = { ... }
   ```

2. **Args & ArgTypes** — Document all props
   ```typescript
   argTypes: {
     variant: {
       control: "select",
       options: ["default", "destructive", "outline"],
       description: "Visual style variant",
     },
   }
   ```

3. **Accessibility Demo** — Show a11y-compliant usage
   ```typescript
   export const Accessible: Story = {
     args: { ... },
     play: async ({ canvasElement }) => {
       // Verify semantic HTML and ARIA
     }
   }
   ```

4. **Interaction Demo** — Show user interaction
   ```typescript
   export const Interactive: Story = {
     play: async ({ canvasElement }) => {
       await userEvent.click(button);
     }
   }
   ```

---

### Test Organization (Updated)

```
packages/
  ui/
    src/
      components/
        button.tsx
        button.stories.tsx        # Storybook + docs
        button.test.tsx           # Unit tests
        dialog.tsx
        dialog.stories.tsx
        dialog.test.tsx
    .storybook/
      main.ts
      preview.ts
    package.json

apps/
  api/
    src/
      __tests__/
        assessment.integration.test.ts

  front/
    src/
      __tests__/
        components/
          AssessmentUI.test.tsx
    e2e/
      assessment-flow.spec.ts
```

---

### Storybook in CI/CD

**GitHub Actions: Build & Deploy Storybook**

```yaml
name: Storybook

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm -C packages/ui build-storybook

      # (Optional) Deploy to GitHub Pages
      - uses: peaceiris/actions-gh-pages@v3
        if: github.ref == 'refs/heads/main'
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./packages/ui/storybook-static

      # (Optional) Push to Chromatic for visual regression
      # - run: pnpm -C packages/ui chromatic --project-token=${{ secrets.CHROMATIC_TOKEN }}
```

**Result:** Every PR shows:
- ✅ Component stories built successfully
- ✅ No accessibility violations
- ✅ Storybook deployed to GitHub Pages
- ✅ (Phase 2) Visual diffs in Chromatic

---

## Test Execution (Updated)

**Local Development:**

```bash
# Unit tests
pnpm test --ui

# Component documentation (Storybook)
pnpm -C packages/ui storybook

# E2E tests
pnpm -C apps/front exec playwright test

# All tests
pnpm test && pnpm -C packages/ui storybook
```

**GitHub Actions (CI):**

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm -C apps/front exec playwright install --with-deps
      - run: pnpm dev &
      - run: sleep 5 && pnpm -C apps/front exec playwright test
```

---

## Test Organization

```
packages/
  domain/
    src/
      __tests__/
        ocean.test.ts
        cost-calculator.test.ts
        precision.test.ts

apps/
  api/
    src/
      __tests__/
        assessment.integration.test.ts
        langgraph-orchestration.test.ts
      test-utils/
        db-container.ts
        mock-anthropic.ts

  front/
    e2e/
      assessment-flow.spec.ts
      sharing.spec.ts
```

---

## Decisions Summary: Testing Strategy

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Unit Testing** | Vitest | Fast, ESM-native, Effect-friendly |
| **Integration Testing** | Vitest + Test Containers | Full Effect layer wiring, actual database |
| **E2E Testing** | Playwright | Multi-browser, fast, TanStack compatible |
| **LLM Testing** | Mock Anthropic API | Fast, deterministic, no API costs |
| **Component Documentation** | Storybook 10.1.11 | Interactive docs, a11y testing, auto-docs |
| **Component a11y Testing** | Storybook a11y addon | Built-in WCAG checks, no extra cost |
| **Visual Regression** | Chromatic (Phase 2) | Cloud-based diffs, deferred cost |
| **Coverage Goals** | 90%+ domain, 60% UI, 100% component docs | Focus on critical paths |
| **CI/CD** | GitHub Actions | Built-in, free, easy matrix |

**Why This Works for MVP:**

1. **Speed:** Tests run in seconds locally, ~2 minutes in CI, Storybook in ~30s
2. **Cost:** No paid services ($0 MVP, Chromatic $99+/month in Phase 2)
3. **Maintainability:** Single test runner (Vitest), clear patterns, component docs as source of truth
4. **Parity with Production:** Same database/Redis as Railway, same components as UI library
5. **Accessibility First:** Every component story includes a11y checks (WCAG AA/AAA)

---

**Sources:**
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [TestContainers Documentation](https://testcontainers.com/)
- [Effect Testing Guide](https://effect.website/docs/testing/)

---
