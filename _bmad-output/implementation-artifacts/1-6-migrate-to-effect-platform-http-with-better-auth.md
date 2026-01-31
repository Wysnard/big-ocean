# Story 1.6: Migrate to Effect/Platform HTTP with Better Auth Integration

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Backend Developer**,
I want **to migrate from Express.js to Effect/Platform HTTP server with integrated Better Auth**,
so that **the API has consistent Effect-based architecture, type-safe HTTP contracts, and streamlined authentication integration**.

## Acceptance Criteria

### HTTP Server Migration
**Given** the current Express.js backend implementation
**When** I migrate to Effect/Platform HTTP
**Then** the server runs on `@effect/platform-node` HTTP server
**And** all routes are defined using `@effect/platform` HTTP API groups
**And** Better Auth integrates with Node.js http.IncomingMessage and http.ServerResponse
**And** the server starts successfully on port 4000 (dev) / 8080 (production)

### Contract-Based Route Definitions
**Given** the assessment and auth endpoints
**When** I define HTTP contracts using Effect Schema
**Then** routes follow the effect-worker-mono pattern with `HttpApiGroup.make()`
**And** request/response schemas are defined using `S.Struct()`
**And** handlers are implemented with `HttpApiBuilder.group()`
**And** the API composition uses `HttpApi.make().add().prefix("/api")`

### Better Auth Integration
**Given** Better Auth library requirements
**When** I integrate with Effect/Platform HTTP
**Then** Better Auth handler converts `IncomingMessage`/`ServerResponse` to Fetch API Request/Response
**And** auth routes (`/api/auth/*`) are handled by Better Auth
**And** session cookies work with HTTP-only, secure, and SameSite attributes
**And** trustedOrigins configuration includes localhost:3000, localhost:3001, and Railway domains

### Frontend Contract Migration
**Given** the frontend currently uses direct fetch calls
**When** I update frontend hooks
**Then** assessment hooks (`use-assessment.ts`) use HTTP endpoints
**And** auth hooks (`use-auth.ts`) use Better Auth client
**And** contracts package exports HTTP schemas and TypeScript types
**And** no RPC client references remain in the codebase

## Business Context

**Why This Story Matters:**
- **Architectural Consistency**: Unifies backend around Effect ecosystem (Platform, Schema, Layer composition)
- **Type Safety**: HTTP contracts provide compile-time guarantees for frontend-backend communication
- **Better Auth Integration**: Removes Express middleware complexity, uses direct node:http integration
- **Maintainability**: Effect patterns (Layer composition, memoized runtime) improve testability and error handling
- **Performance**: Effect/Platform HTTP is more lightweight than Express (fewer middleware layers)

**Blocks Until Complete:**
- Story 2.1 (Session Management) - needs HTTP contracts for session endpoints
- Story 4.1 (Frontend Auth UI) - needs Better Auth HTTP integration
- All Epic 2+ stories - depend on HTTP contract foundation

**Depends On:**
- Story 1.2 (Better Auth Integration) - Better Auth already configured
- Story 1.3 (RPC Contracts) - deprecated, replaced by HTTP contracts

## Technical Requirements

### Architecture Pattern Source

This story implements the pattern from **effect-worker-mono** repository:
- **Contracts**: `packages/contracts/src/http/groups/health.ts` - HTTP route groups with Schema definitions
- **Handlers**: `apps/effect-worker-api/src/handlers/health.ts` - Effect generator syntax for handler logic
- **API Composition**: `packages/contracts/src/http/api.ts` - API class with fluent `.add()` chaining
- **Runtime**: `apps/effect-worker-api/src/runtime.ts#L23` - Layer composition with `ManagedRuntime.make()`

**Better Auth Integration Patterns**:
- **Official File Organization**: https://www.better-auth.com/docs/basic-usage
  - Server: `auth.ts` - Better Auth configuration (server-side)
  - Client: `auth-client.ts` - Better Auth client (browser-side)
  - Separation: Server uses `auth.api`, client uses hooks (`useSession`, `signIn`, etc.)
- **Node.js HTTP Integration**: https://dev.to/danimydev/authentication-with-nodehttp-and-better-auth-2l2g
  - Convert `IncomingMessage`/`ServerResponse` to Fetch API Request/Response for Better Auth compatibility

### Dependencies to Install

```bash
# Effect Platform packages
pnpm add @effect/platform@latest @effect/platform-node@latest

# Better Auth already installed from Story 1.2
# @effect/schema already in catalog (0.71.0)
```

### File Structure Changes

**New Files to Create:**

```
packages/contracts/src/http/
  ├── groups/
  │   ├── assessment.ts    # Assessment HTTP route group
  │   └── health.ts        # Health check route group
  └── api.ts               # API composition class

apps/api/src/
  ├── auth.ts              # Better Auth server configuration (official pattern)
  ├── handlers/
  │   ├── assessment.ts    # Assessment handler implementation
  │   └── health.ts        # Health check handler
  ├── middleware/
  │   └── better-auth.ts   # Better Auth HTTP adapter (node:http bridge)
  └── runtime.ts           # Effect runtime with Layer composition

apps/front/src/lib/
  └── auth-client.ts       # Better Auth client configuration (official pattern)
```

**Files to Delete:**

```
apps/api/src/index.ts          # Replace with runtime.ts entry point
apps/api/src/middleware/cors.ts # CORS handled by Effect/Platform
apps/api/src/middleware/security.ts # Security headers in Effect middleware
packages/contracts/src/assessment.ts # Replaced by http/groups/assessment.ts
packages/contracts/src/profile.ts    # Replaced by http/groups/profile.ts
apps/front/src/lib/rpc-client.ts    # Already deleted in Story 1.2 fixes
```

**Files to Update:**

```
packages/contracts/src/index.ts # Export HTTP groups instead of RPC
apps/front/src/hooks/use-assessment.ts # Already uses HTTP fetch (no changes needed)
apps/front/src/hooks/use-auth.ts # Re-export Better Auth client hooks
apps/api/src/setup.ts # Remove Better Auth config (moved to auth.ts)
apps/api/package.json # Add Effect/Platform dependencies
```

## Dev Notes

### HTTP Contract Pattern (effect-worker-mono)

**Contract Definition** (`packages/contracts/src/http/groups/assessment.ts`):

```typescript
import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema as S } from "effect"

// Response schemas
export const StartAssessmentResponseSchema = S.Struct({
  sessionId: S.String,
  createdAt: S.DateTimeUtc
})

export const SendMessageResponseSchema = S.Struct({
  response: S.String,
  precision: S.Struct({
    openness: S.Number,
    conscientiousness: S.Number,
    extraversion: S.Number,
    agreeableness: S.Number,
    neuroticism: S.Number
  })
})

// Request schemas
export const StartAssessmentRequestSchema = S.Struct({
  userId: S.optional(S.String)
})

export const SendMessageRequestSchema = S.Struct({
  sessionId: S.String,
  message: S.String
})

// Route group definition
export const AssessmentGroup = HttpApiGroup.make("assessment")
  .add(
    HttpApiEndpoint
      .post("start", "/start")
      .addSuccess(StartAssessmentResponseSchema)
      .setPayload(StartAssessmentRequestSchema)
  )
  .add(
    HttpApiEndpoint
      .post("sendMessage", "/message")
      .addSuccess(SendMessageResponseSchema)
      .setPayload(SendMessageRequestSchema)
  )
  .add(
    HttpApiEndpoint
      .get("getResults", "/:sessionId/results")
      .addSuccess(GetResultsResponseSchema)
  )
  .add(
    HttpApiEndpoint
      .get("resumeSession", "/:sessionId/resume")
      .addSuccess(ResumeSessionResponseSchema)
  )
  .prefix("/assessment")
```

**Handler Implementation** (`apps/api/src/handlers/assessment.ts`):

```typescript
import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer } from "effect"
import { AssessmentApi } from "@workspace/contracts"
import { DatabaseRef, LoggerRef } from "@workspace/infrastructure"

export const AssessmentGroupLive = HttpApiBuilder.group(
  AssessmentApi,
  "assessment",
  (handlers) => Effect.gen(function* () {
    const db = yield* DatabaseRef
    const logger = yield* LoggerRef

    return handlers
      .handle("start", ({ payload }) =>
        Effect.gen(function* () {
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
          const createdAt = new Date()

          logger.info("Assessment session started", { sessionId, userId: payload.userId })

          return {
            sessionId,
            createdAt
          }
        })
      )
      .handle("sendMessage", ({ payload }) =>
        Effect.gen(function* () {
          logger.info("Message received", { sessionId: payload.sessionId })

          // Placeholder for Nerin agent (Epic 2)
          return {
            response: "Thank you for sharing that...",
            precision: {
              openness: 0.5,
              conscientiousness: 0.4,
              extraversion: 0.6,
              agreeableness: 0.7,
              neuroticism: 0.3
            }
          }
        })
      )
      .handle("getResults", ({ params }) =>
        Effect.gen(function* () {
          // Placeholder for results retrieval
          return {
            oceanCode: "PPAM",
            archetypeName: "The Grounded Thinker",
            traits: { /* ... */ }
          }
        })
      )
      .handle("resumeSession", ({ params }) =>
        Effect.gen(function* () {
          // Placeholder for session resumption
          return {
            messages: [],
            precision: { /* ... */ }
          }
        })
      )
  })
)
```

**API Composition** (`packages/contracts/src/http/api.ts`):

```typescript
import { HttpApi } from "@effect/platform"
import { AssessmentGroup } from "./groups/assessment.js"
import { HealthGroup } from "./groups/health.js"

export class BigOceanApi extends HttpApi.make("BigOceanApi")
  .add(HealthGroup)
  .add(AssessmentGroup)
  .prefix("/api") {}
```

**Runtime Setup** (`apps/api/src/runtime.ts`):

```typescript
import { Layer, ManagedRuntime } from "effect"
import { HttpApiBuilder, HttpServer } from "@effect/platform"
import { NodeHttpServer } from "@effect/platform-node"
import { BigOceanApi } from "@workspace/contracts"
import { AssessmentGroupLive } from "./handlers/assessment.js"
import { HealthGroupLive } from "./handlers/health.js"
import { BetterAuthMiddlewareLive } from "./middleware/better-auth.js"

// Merge all handler layers
const HandlersLayer = Layer.mergeAll(
  AssessmentGroupLive,
  HealthGroupLive
)

// API Layer composition
const ApiLayer = Layer.mergeAll(
  HttpApiBuilder.api(BigOceanApi),
  HttpApiBuilder.Router.Live,
  HttpApiBuilder.Middleware.layer,
  HttpServer.layerContext
).pipe(Layer.provide(HandlersLayer))
  .pipe(Layer.provide(BetterAuthMiddlewareLive))

// Create memoized runtime (built once at startup)
export const runtime = ManagedRuntime.make(ApiLayer)

// Start HTTP server
const ServerLayer = NodeHttpServer.layer(() => runtime.runPromise(HttpServer.serve()), {
  port: Number(process.env.PORT || 4000)
})

Layer.launch(ServerLayer).pipe(runtime.runPromise)
```

### Better Auth Official File Organization

Following the official Better Auth pattern from https://www.better-auth.com/docs/basic-usage:

**Server Configuration** (`apps/api/src/auth.ts`):

```typescript
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import bcrypt from "bcryptjs"
import { db } from "./setup.js" // Database from setup

/**
 * Better Auth Server Configuration
 *
 * Official pattern: Separate auth.ts file for server-side configuration
 * Reference: https://www.better-auth.com/docs/basic-usage
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),

  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:4000",
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,

    // NIST 2025: Length-based validation
    minPasswordLength: 12,
    maxPasswordLength: 128,

    // Bcrypt hashing
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 12)
      },
      verify: async (data: { hash: string; password: string }) => {
        return await bcrypt.compare(data.password, data.hash)
      },
    },
  },

  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",
  secret: process.env.BETTER_AUTH_SECRET || "placeholder-secret-for-development-only",

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.BETTER_AUTH_URL?.startsWith("https") ?? false,
      sameSite: "lax" as const,
    },
    useSecureCookies: process.env.BETTER_AUTH_URL?.startsWith("https") ?? false,
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user, context) => {
          console.info(`User created: ${user.id} (${user.email})`)

          // Link anonymous session to new user account
          const body = context?.body as any
          const anonymousSessionId = body?.anonymousSessionId

          if (anonymousSessionId) {
            try {
              await db
                .update(authSchema.session)
                .set({ userId: user.id, updatedAt: new Date() })
                .where(eq(authSchema.session.id, anonymousSessionId))

              console.info(`Linked anonymous session ${anonymousSessionId} to user ${user.id}`)
            } catch (error: any) {
              console.error(`Failed to link anonymous session: ${error.message}`)
            }
          }
        },
      },
    },
  },
})

// Export type for use in handlers
export type Auth = typeof auth
```

**Frontend Client Configuration** (`apps/front/src/lib/auth-client.ts`):

```typescript
import { createAuthClient } from "better-auth/react"

/**
 * Better Auth Client Configuration
 *
 * Official pattern: Separate auth-client.ts file for browser-side client
 * Reference: https://www.better-auth.com/docs/basic-usage
 *
 * IMPORTANT: Only use client methods from the browser, never from server.
 * Server-side operations should use `auth.api` from apps/api/src/auth.ts
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  // Add plugins here if needed (e.g., twoFactorClient)
})

// Export for direct usage in components
export default authClient
```

**Frontend Hook Wrapper** (`apps/front/src/hooks/use-auth.ts`):

```typescript
import { authClient } from "@/lib/auth-client"

/**
 * Re-export Better Auth React hooks for consistent import pattern
 *
 * Usage in components:
 * ```tsx
 * import { useSession, signIn, signOut } from "@/hooks/use-auth"
 *
 * function MyComponent() {
 *   const { data: session, isPending } = useSession()
 *
 *   if (isPending) return <div>Loading...</div>
 *   if (!session) return <button onClick={() => signIn.email(...)}>Sign In</button>
 *
 *   return <button onClick={() => signOut()}>Sign Out ({session.user.email})</button>
 * }
 * ```
 */

// Session management
export const { useSession } = authClient

// Authentication methods
export const { signIn, signUp, signOut } = authClient

// Export client for advanced usage
export { authClient }
```

**Key Principles:**

1. **Separation of Concerns:**
   - Server: `apps/api/src/auth.ts` - Configuration and `auth.api` methods
   - Client: `apps/front/src/lib/auth-client.ts` - Browser-side client with React hooks

2. **Usage Pattern:**
   - ✅ Components use `authClient.useSession()`, `authClient.signIn()`, etc.
   - ✅ Server handlers use `auth.api` for server-side operations
   - ❌ Never call client methods from server-side code

3. **File Organization:**
   - Follows Better Auth official pattern
   - Aligns with monorepo structure (separate client/server packages)

### Better Auth Node.js HTTP Integration

**Better Auth HTTP Adapter** (`apps/api/src/middleware/better-auth.ts`):

```typescript
import { Layer, Effect } from "effect"
import type { IncomingMessage, ServerResponse } from "node:http"
import { auth } from "../auth.js" // Better Auth configuration

/**
 * Convert Node.js IncomingMessage to Fetch API Request
 * Pattern from: https://dev.to/danimydev/authentication-with-nodehttp-and-better-auth-2l2g
 */
function incomingMessageToRequest(
  incomingMessage: IncomingMessage,
  baseUrl: URL
): Request {
  const method = incomingMessage.method || "GET"
  const url = new URL(incomingMessage.url || "/", baseUrl)

  const headers = new Headers()
  for (const [key, value] of Object.entries(incomingMessage.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value)
    }
  }

  const body = method !== "GET" && method !== "HEAD"
    ? incomingMessage
    : undefined

  return new Request(url.toString(), { method, headers, body })
}

/**
 * Better Auth middleware handler
 */
export async function betterAuthHandler(
  incomingMessage: IncomingMessage,
  serverResponse: ServerResponse
): Promise<void> {
  const baseUrl = new URL(process.env.BETTER_AUTH_URL || "http://localhost:4000")
  const request = incomingMessageToRequest(incomingMessage, baseUrl)

  const response = await auth.handler(request)

  serverResponse.statusCode = response.status

  response.headers.forEach((value, key) => {
    serverResponse.setHeader(key, value)
  })

  if (response.body) {
    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      serverResponse.write(value)
    }
  }

  serverResponse.end()
}

/**
 * Better Auth middleware layer for Effect/Platform
 */
export const BetterAuthMiddlewareLive = Layer.succeed(
  "BetterAuthMiddleware",
  {
    handler: betterAuthHandler
  }
)
```

**Integration in HTTP Server**:

```typescript
// In runtime.ts or server entry point
const httpServer = http.createServer(async (req, res) => {
  // Route Better Auth paths
  if (req.url?.startsWith("/api/auth/")) {
    await betterAuthHandler(req, res)
    return
  }

  // Route other paths through Effect/Platform
  // ... Effect HTTP handler
})
```

### Frontend Updates

**Auth Hook** (`apps/front/src/hooks/use-auth.ts`):

```typescript
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000"
})

// Export Better Auth React hooks
export const {
  useSession,
  signIn,
  signUp,
  signOut
} = authClient
```

**Frontend Usage**:

```typescript
// In components
import { useSession, signIn, signOut } from "@/hooks/use-auth"

function ProfileButton() {
  const { data: session } = useSession()

  if (!session) {
    return <button onClick={() => signIn.email(/* ... */)}>Sign In</button>
  }

  return <button onClick={() => signOut()}>Sign Out</button>
}
```

### Architecture Compliance

**Effect/Platform HTTP Pattern**:
- ✅ Use `HttpApiGroup.make()` for route group definitions
- ✅ Use `HttpApiEndpoint.get/post()` for individual routes
- ✅ Define schemas with `S.Struct()` from Effect Schema
- ✅ Implement handlers with `HttpApiBuilder.group()` and `Effect.gen()`
- ✅ Compose API with `HttpApi.make().add().prefix()`
- ✅ Use `ManagedRuntime.make()` for memoized layer composition

**Better Auth Integration**:
- ✅ Convert `IncomingMessage`/`ServerResponse` to Fetch API Request/Response
- ✅ Route `/api/auth/*` paths to Better Auth handler
- ✅ Use Better Auth React client for frontend
- ✅ Maintain HTTP-only cookies with secure attributes
- ✅ Configure trustedOrigins for CORS

### Library/Framework Requirements

**Effect Platform (Latest)**:
- `@effect/platform` - Core HTTP abstractions (HttpApi, HttpApiGroup, HttpApiEndpoint)
- `@effect/platform-node` - Node.js HTTP server implementation (NodeHttpServer)
- `@effect/schema` - Schema validation and serialization (already in project)

**Better Auth Integration**:
- Pattern: Node.js http module bridge to Fetch API Request/Response
- No additional libraries needed (use built-in http module)

**Frontend**:
- `better-auth/react` - React client for Better Auth (already installed from Story 1.2)

### File Structure Requirements

**Monorepo Structure**:
```
packages/contracts/src/
  ├── http/                    # NEW: HTTP contract definitions
  │   ├── groups/
  │   │   ├── assessment.ts
  │   │   ├── health.ts
  │   │   └── profile.ts       # Future: Profile sharing routes
  │   └── api.ts               # API composition
  ├── errors.ts                # Shared error definitions
  ├── schemas.ts               # Shared schemas
  └── index.ts                 # Export HTTP groups (not RPC)

apps/api/src/
  ├── auth.ts                  # Better Auth server configuration (OFFICIAL PATTERN)
  ├── handlers/
  │   ├── assessment.ts        # Assessment handler implementation
  │   ├── health.ts            # Health check handler
  │   └── profile.ts           # Future: Profile handlers
  ├── middleware/
  │   └── better-auth.ts       # Better Auth HTTP adapter (node:http bridge)
  ├── runtime.ts               # Effect runtime setup
  ├── setup.ts                 # Database initialization (auth config moved to auth.ts)
  └── logger.ts                # Winston logger

apps/front/src/
  ├── hooks/
  │   ├── use-assessment.ts    # HTTP fetch (no changes needed)
  │   └── use-auth.ts          # Better Auth React client
  └── lib/
      └── auth-client.ts       # Better Auth client initialization
```

### Testing Requirements

**Unit Tests** (`apps/api/src/__tests__/`):
- Test HTTP contract schema validation
- Test handler logic with mocked dependencies
- Test Better Auth adapter (IncomingMessage → Request conversion)

**Integration Tests**:
- Test full HTTP server with real Better Auth
- Test session cookie persistence
- Test authentication flow (sign up, sign in, sign out)
- Test assessment endpoints with auth

**Coverage Targets**:
- HTTP contracts: 100% (schema validation)
- Handler logic: 90%+ (business logic)
- Better Auth integration: 80%+ (auth flow coverage)

## Tasks / Subtasks

- [ ] **Task 1: Migrate HTTP Contracts** (AC: Contract-Based Route Definitions)
  - [ ] Create `packages/contracts/src/http/groups/health.ts` with health check route
  - [ ] Create `packages/contracts/src/http/groups/assessment.ts` with assessment routes (start, sendMessage, getResults, resumeSession)
  - [ ] Create `packages/contracts/src/http/api.ts` with `BigOceanApi` composition
  - [ ] Update `packages/contracts/src/index.ts` to export HTTP groups
  - [ ] Delete deprecated RPC files (`assessment.ts`, `profile.ts`)

- [ ] **Task 2: Implement HTTP Handlers** (AC: HTTP Server Migration)
  - [ ] Create `apps/api/src/handlers/health.ts` with health check handler
  - [ ] Create `apps/api/src/handlers/assessment.ts` with assessment handlers
  - [ ] Update `apps/api/src/setup.ts` to export database and logger for FiberRef
  - [ ] Verify handlers use `Effect.gen()` syntax with FiberRef access

- [ ] **Task 3: Better Auth Official File Organization** (AC: Better Auth Integration)
  - [ ] Create `apps/api/src/auth.ts` with Better Auth server configuration (official pattern)
  - [ ] Move Better Auth config from `setup.ts` to `auth.ts`
  - [ ] Update `setup.ts` to only export database and logger
  - [ ] Create `apps/api/src/middleware/better-auth.ts` with node:http adapter (IncomingMessage → Request)
  - [ ] Implement `betterAuthHandler()` function for streaming responses
  - [ ] Add `/api/auth/*` routing in HTTP server
  - [ ] Test session cookies with HTTP-only, secure, SameSite attributes

- [ ] **Task 4: Effect Runtime Setup** (AC: HTTP Server Migration)
  - [ ] Create `apps/api/src/runtime.ts` with Layer composition
  - [ ] Merge handler layers (`AssessmentGroupLive`, `HealthGroupLive`)
  - [ ] Create `ApiLayer` with Router, Middleware, HttpServer layers
  - [ ] Create `ManagedRuntime.make(ApiLayer)` for memoized runtime
  - [ ] Create `NodeHttpServer.layer()` for HTTP server on port 4000

- [ ] **Task 5: Frontend Auth Client Setup** (AC: Frontend Contract Migration)
  - [ ] Create `apps/front/src/lib/auth-client.ts` with `createAuthClient()` (official pattern)
  - [ ] Update `apps/front/src/hooks/use-auth.ts` to re-export Better Auth hooks
  - [ ] Export `useSession`, `signIn`, `signUp`, `signOut`, and `authClient`
  - [ ] Verify client methods only used in browser (never server-side)
  - [ ] Test frontend auth flow with new HTTP backend

- [ ] **Task 6: Remove Express/RPC Dependencies** (AC: HTTP Server Migration, Frontend Contract Migration)
  - [ ] Remove `express`, `cors`, `helmet` from `apps/api/package.json`
  - [ ] Delete `apps/api/src/index.ts` (replaced by `runtime.ts`)
  - [ ] Delete `apps/api/src/middleware/cors.ts` and `security.ts`
  - [ ] Verify no RPC client references remain in frontend
  - [ ] Update `apps/api/package.json` scripts to use `runtime.ts` entry point

- [ ] **Documentation & Testing** (AC: #2-3) — **REQUIRED BEFORE DONE**
  - [ ] Add JSDoc comments to HTTP contracts, handlers, and Better Auth adapter
  - [ ] Update `CLAUDE.md` with Effect/Platform HTTP architecture
  - [ ] Update `README.md` with new server startup commands
  - [ ] Write unit tests for HTTP contracts (schema validation)
  - [ ] Write integration tests for Better Auth HTTP flow
  - [ ] Update story file with completion notes and file list

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent after implementation_

## References

### External Documentation

- **effect-worker-mono Repository**: https://github.com/backpine/effect-worker-mono
  - Health contract: `/packages/contracts/src/http/groups/health.ts`
  - Health handler: `/apps/effect-worker-api/src/handlers/health.ts`
  - API composition: `/packages/contracts/src/http/api.ts`
  - Runtime setup: `/apps/effect-worker-api/src/runtime.ts#L23`
- **Better Auth Official Documentation**:
  - Basic Usage & File Organization: https://www.better-auth.com/docs/basic-usage
  - Node.js HTTP Integration Pattern: https://dev.to/danimydev/authentication-with-nodehttp-and-better-auth-2l2g

### Internal Documentation

- [Source: `_bmad-output/planning-artifacts/architecture.md`](#ADR-4) - Server-State Management with TanStack Query
- [Source: `_bmad-output/planning-artifacts/epics.md`](#Epic-1) - Infrastructure & Auth Setup
- [Source: `_bmad-output/implementation-artifacts/1-2-integrate-better-auth-for-email-password-authentication.md`] - Better Auth configuration reference

### Project Structure Notes

**Alignment with Unified Project Structure**:
- ✅ Follows monorepo package structure (`contracts`, `infrastructure`, `api`)
- ✅ Uses catalog dependencies (`effect: "latest"`, `@effect/platform: "latest"`)
- ✅ Maintains FiberRef pattern for dependency injection
- ✅ Aligns with Effect-first architecture vision

**Detected Variances**:
- ⚠️ Replaces Express.js (previous ad-hoc choice) with Effect/Platform (architectural alignment)
- ⚠️ Removes RPC contracts (Story 1.3) in favor of HTTP contracts (simpler, more standard)
- ✅ Follows Better Auth official file organization pattern (`auth.ts` for server, `auth-client.ts` for browser)

**Rationale**:
- Effect/Platform provides better type safety and Layer composition
- HTTP contracts are more standard than RPC for REST APIs
- Better Auth integration is cleaner with direct node:http adapter
- Official Better Auth pattern improves maintainability and aligns with library best practices
