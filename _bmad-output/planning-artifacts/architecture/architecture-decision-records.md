# Architecture Decision Records

## ADR-1: Nerin Orchestration Strategy ✅

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

## ADR-2: LLM Cost Control Architecture ✅

**Decision:** Adaptive Token Budget + Per-User Rate Limiting

**Architecture:**

Two-layer cost control strategy:

1. **Rate Limiting (Baseline Protection):**
   - Maximum 1 assessment per user per day (prevents spam)
   - Maximum 1 resume per week (prevents gaming)
   - Enforced at use-case level (business logic layer)

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

**Hexagonal Architecture Integration:**

Following ADR-6 (Hexagonal Architecture), cost tracking is implemented as:

- **Domain Layer** (`packages/domain/src/repositories/cost-guard.repository.ts`):
  - `CostGuardRepository` interface using Context.Tag
  - Methods: `incrementDailyCost()`, `getDailyCost()`, `checkRateLimit()`

- **Infrastructure Layer** (`packages/infrastructure/src/repositories/cost-guard.redis.repository.ts`):
  - `CostGuardRedisRepositoryLive` implementation using ioredis
  - Redis key schema: `cost:{userId}:{YYYY-MM-DD}`, `assessments:{userId}:{YYYY-MM-DD}`
  - TTL: 48 hours for automatic cleanup

- **Use-Case Layer** (`apps/api/src/use-cases/send-message.use-case.ts`):
  - Use-cases depend on `CostGuardRepository` via Effect type signature
  - Business logic checks budget before calling LLM agents
  - Graceful degradation logic resides in use-cases

**Rationale:**
- Prevents runaway costs while allowing flexibility for engaged users
- Frictionless to users (they don't see limits, just graceful messaging)
- Realistic for self-funded MVP ($75/day budget ≈ 500 users × 1 assessment/day)
- Cost-aware routing enables intelligent degradation before hard stops
- Hexagonal architecture allows testing cost logic without Redis (mock repository)

**Trade-offs Accepted:**
- Requires Redis for real-time cost tracking
- Complex implementation (multi-layer budget logic)
- Requires monitoring and tuning post-launch

**Key Metrics:**
- Cost per assessment: Target ≤ $0.10 (realistic: $0.12-$0.15 with overhead)
- Daily budget utilization: 80-95% (predictable costs)
- Users hitting daily limit: < 5% (most users complete 1 assessment)

---

## ADR-3: Privacy & Profile Storage Model ✅

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

## ADR-4: Server-State Management with TanStack Query (Revised) ✅

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

## ADR-5: OCEAN Archetype Lookup & Storage ✅

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
