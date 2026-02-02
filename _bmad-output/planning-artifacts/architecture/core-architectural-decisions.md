# Core Architectural Decisions

## Decision 1: Authentication & Authorization ✅

**Selected:** Better Auth with Email/Password + NIST 2025 Password Validation

| Aspect | Decision |
|--------|----------|
| Library | Better Auth (HTTP cookies + sessions) |
| Auth Methods (MVP) | Email/Password only |
| Deferred to Phase 2 | OAuth (Google, Facebook), MFA (TOTP/email) |
| Password Hashing | bcrypt with cost factor 12 |

### Password Validation Rules (NIST 2025)

| Rule | Value | Rationale |
|------|-------|-----------|
| Minimum Length | 12 characters | Length > complexity per NIST 2025 |
| Maximum Length | 128 characters | Support password managers |
| Character Set | All ASCII + Unicode | No forced composition rules |
| Compromised Check | Deferred (post-MVP) | Reduce external dependencies |
| Expiration | None | Only reset on confirmed breach |

### Session Lifecycle States

| State | userId | Behavior |
|-------|--------|----------|
| Anonymous | `null` | Session created, assessment works, 24-48h persistence |
| Authenticated | `string` | Anonymous session linked to user on sign-up |

### Implementation Pattern

```typescript
// Backend: apps/api/src/auth.ts
// Use betterAuth() with drizzleAdapter, emailAndPassword enabled
// Hook: auth.onAfterSignUp links anonymous session to new user

// Frontend: apps/front/src/lib/auth-client.ts
// Use createAuthClient() with baseURL pointing to API
// Trigger sign-up modal after first message if !session?.user
```

### Database Tables (Better Auth Auto-Creates)

- `user` — User accounts
- `session` — Active sessions
- `account` — OAuth links (Phase 2)
- `verification` — Email verification tokens

---

## Decision 2: Error Handling & Observability ✅

**Selected:** Effect TaggedError + Pino + Sentry (Free Plan)

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Error Model | Effect `Data.TaggedError` | Type-safe, composable, works with @effect/platform |
| Logging | Pino | 5x faster than Winston, JSON by default |
| Monitoring | Sentry Free Plan | $0/month, 5K events, email alerts |
| Cost Tracking | Pino logs + Sentry breadcrumbs | Correlated with errors |

### Domain Error Types

| Error Class | HTTP Status | Trigger |
|-------------|-------------|---------|
| `SessionNotFoundError` | 404 | Session lookup fails |
| `CostLimitExceededError` | 429 | Daily budget exceeded |
| `LLMError` | 503 | Claude API failure |
| `PrecisionTooLowError` | 400 | Assessment incomplete |
| `DatabaseError` | 500 | Drizzle operation fails |

### Error Flow (Hexagonal Architecture)

```
Infrastructure (throws TaggedError)
  → Use-Cases (propagate via Effect.gen)
  → Handlers (Effect/Platform maps to HTTP status via .addError())
```

### Implementation Pattern

```typescript
// packages/domain/src/errors.ts
// Define errors extending Data.TaggedError("ErrorName")
// Include context fields (sessionId, userId, etc.)

// packages/infrastructure/src/repositories/*.ts
// Throw domain errors: yield* Effect.fail(new SessionNotFound({ sessionId }))

// apps/api/src/handlers/*.ts
// Errors propagate automatically; Effect/Platform handles HTTP mapping
```

### Logging Pattern

```typescript
// Use pino with child loggers per session
// Production: JSON output, level from LOG_LEVEL env
// Development: pino-pretty with colorize

// Log structure: { sessionId, userId, event, ...data }
```

### Sentry Integration

- Backend: `@sentry/node` with requestHandler/errorHandler middleware
- Frontend: `@sentry/react` with Replay (masked for privacy)
- Alerts: Email on new error types, spikes, regressions

---

## Decision 3: Frontend State Management ✅

**Selected:** TanStack Query with Optimistic Updates

| State Type | Technology | Update Trigger |
|------------|------------|----------------|
| Assessment Data | TanStack Query | Background refetch |
| Conversation | TanStack Query (cached) | On refetch |
| Precision/OCEAN | TanStack Query (cached) | On refetch |
| UI (Modals) | React Context | User events |
| Forms | TanStack Form | Form submission |

### Why TanStack Query (Not ElectricSQL)

- Standard HTTP caching pattern, no sync complexity
- Optimistic mutations with automatic rollback
- Zero offline-sync edge cases
- Simple REST mocks for testing

### Core Hooks

| Hook | Purpose | Pattern |
|------|---------|---------|
| `useSessionHistory(sessionId)` | Load full session | `useQuery` with GET /api/sessions/{id}/full |
| `useSendMessage(sessionId)` | Send + optimistic update | `useMutation` with POST, onMutate for optimistic insert |
| `usePrecision(sessionId)` | Derived from session | Extract from useSessionHistory data |

### Optimistic Update Flow

1. User sends message
2. `onMutate`: Cancel queries, save previous state, optimistically add message to cache
3. `mutationFn`: POST to backend
4. `onSuccess`: Invalidate queries (triggers background refetch)
5. `onError`: Rollback to previous state

### Implementation Pattern

```typescript
// apps/front/src/lib/assessment-hooks.ts
// useSessionHistory: useQuery with queryKey ["session", sessionId]
// useSendMessage: useMutation with optimistic update in onMutate

// apps/front/src/routes/assessment.tsx
// Destructure { data: session } from useSessionHistory
// Pass session.messages, session.precision to child components
```

---

## Consolidated Decision Summary

| Area | Technology | Key Pattern |
|------|------------|-------------|
| Auth | Better Auth | Email/password, NIST 2025, anonymous-to-user linking |
| Errors | Effect TaggedError | Domain errors propagate via Effect, auto-map to HTTP |
| Logging | Pino | JSON structured logs, child loggers per session |
| Monitoring | Sentry Free | Backend + frontend, email alerts |
| Frontend State | TanStack Query | Server-state caching, optimistic mutations |
| Forms | TanStack Form | Validation, submission handling |
| UI State | React Context | Modals, toggles (non-synced) |
