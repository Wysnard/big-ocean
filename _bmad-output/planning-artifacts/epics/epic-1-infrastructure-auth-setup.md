# Epic 1: Infrastructure & Auth Setup

**Goal:** Establish production-ready infrastructure on Railway, configure authentication with Better Auth, and set up RPC contracts for type-safe backend-frontend communication.

**Dependencies:** None (foundational)

**Enables:** All subsequent epics (Epics 2-7 depend on infrastructure + RPC foundation)

**Critical Path:** Must complete before Epic 2 (backend needs deployed infra) and Epic 4 (frontend needs RPC contracts)

**User Value:** Provides secure, cost-optimized foundation for all subsequent features

## Story 1.1: Deploy Infrastructure to Railway

As a **DevOps Engineer**,
I want **to deploy big-ocean backend, PostgreSQL, and Redis to Railway**,
So that **the platform has a scalable, managed infrastructure with zero operational overhead**.

**Acceptance Criteria:**

**Given** the monorepo is ready to deploy
**When** I push to GitHub main branch
**Then** Railway automatically deploys backend + PostgreSQL + Redis
**And** environment variables are configured in Railway dashboard
**And** database migrations run automatically
**And** logs appear in Railway dashboard

**Given** the system is deployed to Railway
**When** I check the Railway dashboard
**Then** Backend service shows healthy status
**And** PostgreSQL is reachable from backend
**And** Redis is connected for cost tracking
**And** All services share the same Railway project

**Technical Details:**

- Railway app configuration with Dockerfile for backend
- PostgreSQL with logical replication enabled
- Redis for rate limiting + cost tracking
- Environment variables: DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY, SENTRY_DSN
- Cost estimate: $5-12/month (usage-based)

**Acceptance Checklist:**
- [ ] Railway project created and GitHub repo connected
- [ ] Backend service deploys on git push
- [ ] PostgreSQL initialized with migrations
- [ ] Redis available for cache/rate limiting
- [ ] Health check endpoint returns 200 OK
- [ ] Logs visible in Railway dashboard

---

## Story 1.2: Integrate Better Auth for Email/Password Authentication

As a **User**,
I want **to sign up with email and password (minimum 12 characters)**,
So that **I can create an account and save my assessment results**.

**Acceptance Criteria:**

**Given** an unauthenticated user
**When** they click "Sign Up" after first assessment message
**Then** a modal appears with email and password fields
**And** password must be 12+ characters with complexity validation (per NIST 2025)
**And** system checks password against compromised credentials database
**And** on success, anonymous session links to new user account

**Given** a user is signed up
**When** they sign in with email/password
**Then** session is established with auth token
**And** previous assessments are associated with their account
**And** profile data syncs across devices

**Technical Details:**

- Better Auth library setup in backend
- Custom password validation: 12+ chars, NIST 2025 standards
- Compromised credential screening before signup
- Anonymous-to-authenticated session linking
- TLS 1.3+ encryption for auth endpoints
- Secure HTTP-only session cookies

**Acceptance Checklist:**
- [ ] Sign-up modal appears after first message
- [ ] Password validation enforces 12+ characters
- [ ] Compromised password check implemented
- [ ] Anonymous session links to new account
- [ ] Login works with email/password
- [ ] Sessions persist across browser refresh

---

## Story 1.3: Configure Effect-ts RPC Contracts and Infrastructure Layer

As a **Backend Developer**,
I want **to define type-safe RPC contracts between frontend and backend**,
So that **all API interactions are compile-time verified and self-documenting**.

**Acceptance Criteria:**

**Given** the Effect-ts environment is configured
**When** I define an RPC contract (e.g., `startAssessment`)
**Then** the contract automatically generates TypeScript types for frontend/backend
**And** frontend client imports can only call valid procedures
**And** invalid RPC calls fail at compile time, not runtime

**Given** a backend handler is implemented
**When** it returns a successful response
**Then** the response matches the contract output schema
**And** errors are caught as tagged Error types (SessionNotFoundError, etc.)

**Technical Details:**

- @effect/rpc for contract definitions
- @effect/schema for runtime validation
- FiberRef bridges for request-scoped dependencies (database, logger, cost guard)
- Layer composition for dependency injection
- Error mapping to HTTP status codes (404, 429, 503)

**Acceptance Checklist:**
- [ ] RPC contracts defined in `packages/contracts`
- [ ] startAssessment, sendMessage, getResults RPC procedures working
- [ ] Type-safe RPC handlers in `apps/api/src/handlers`
- [ ] Frontend RPC client auto-generated from contracts
- [ ] Error types discriminated in client error handling

---
