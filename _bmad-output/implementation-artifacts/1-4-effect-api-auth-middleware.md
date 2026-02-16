# Story 1.4: Effect API Auth Middleware

Status: done

## Story

As a **Backend Developer**,
I want **to consolidate scattered inline auth resolution into a proper Effect/Platform HttpApiMiddleware**,
so that **authentication context is provided via typed dependency injection instead of manual per-handler resolution, following the official Effect Platform middleware pattern**.

## Acceptance Criteria

1. A `CurrentUser` Context.Tag exists in `packages/domain` providing `string | undefined` (authenticated user ID or undefined for anonymous)
2. An `AuthMiddleware` tag exists in `packages/contracts` using `HttpApiMiddleware.Tag` with cookie-based security (`better-auth.session_token`)
3. `AssessmentGroup` and `ProfileGroup` contracts apply `.middleware(AuthMiddleware)` — Evidence and Health groups remain unchanged
4. `AuthMiddlewareLive` Layer in `apps/api` implements the middleware: extracts session cookie, calls Better Auth `getSession()`, always succeeds (returns `undefined` on failure)
5. All handlers use `yield* CurrentUser` instead of `yield* resolveAuthenticatedUserId(request)` — the inline `resolveAuthenticatedUserId` and `toFetchHeaders` functions are removed
6. Profile `toggleVisibility` handler uses `Unauthorized` error (not `DatabaseError`) when authentication is missing
7. Auth context tests are rewritten to test `AuthMiddlewareLive` Layer directly
8. All existing tests pass (`pnpm test:run`), lint passes (`pnpm lint`), build succeeds (`pnpm build`)

## Tasks / Subtasks

- [ ] Task 1: Create `CurrentUser` context tag in domain (AC: #1)
  - [ ] 1.1 Create `packages/domain/src/context/current-user.ts` with `Context.Tag("CurrentUser")<string | undefined>`
  - [ ] 1.2 Export from `packages/domain/src/index.ts`

- [ ] Task 2: Create `AuthMiddleware` tag in contracts (AC: #2)
  - [ ] 2.1 Create `packages/contracts/src/middleware/auth.ts` with `HttpApiMiddleware.Tag`
  - [ ] 2.2 Configure `provides: CurrentUser`, `security: { sessionCookie: HttpApiSecurity.apiKey({ in: "cookie", key: "better-auth.session_token" }) }`
  - [ ] 2.3 No `failure` type, no `optional` flag — middleware always succeeds
  - [ ] 2.4 Export from `packages/contracts/src/index.ts`

- [ ] Task 3: Apply middleware to contract groups (AC: #3)
  - [ ] 3.1 Add `.middleware(AuthMiddleware)` to `AssessmentGroup` in `packages/contracts/src/http/groups/assessment.ts`
  - [ ] 3.2 Add `.middleware(AuthMiddleware)` to `ProfileGroup` in `packages/contracts/src/http/groups/profile.ts`
  - [ ] 3.3 Verify Evidence and Health groups are NOT modified

- [ ] Task 4: Implement `AuthMiddlewareLive` Layer (AC: #4)
  - [ ] 4.1 Create `apps/api/src/middleware/auth.middleware.ts`
  - [ ] 4.2 Implement `Layer.effect(AuthMiddleware, ...)` — security handler receives `Redacted<string>` cookie token
  - [ ] 4.3 Use `HttpServerRequest.HttpServerRequest` to get full request headers for `auth.api.getSession()`
  - [ ] 4.4 Move `toFetchHeaders()` helper from `assessment.ts` to this file
  - [ ] 4.5 Catch all Better Auth errors and return `undefined` (never fail)

- [ ] Task 5: Refactor assessment handlers (AC: #5)
  - [ ] 5.1 Remove `resolveAuthenticatedUserId`, `toFetchHeaders`, `BetterAuthService` import from `assessment.ts`
  - [ ] 5.2 Replace all `yield* resolveAuthenticatedUserId(request)` with `yield* CurrentUser`
  - [ ] 5.3 Remove `request` from handler destructuring where only used for auth

- [ ] Task 6: Refactor profile handlers (AC: #5, #6)
  - [ ] 6.1 Remove `import { resolveAuthenticatedUserId } from "./assessment"` from `profile.ts`
  - [ ] 6.2 Replace `yield* resolveAuthenticatedUserId(request)` with `yield* CurrentUser`
  - [ ] 6.3 Fix `toggleVisibility`: use `Unauthorized` error instead of `DatabaseError` for missing auth

- [ ] Task 7: Wire up in server (AC: #4)
  - [ ] 7.1 Import `AuthMiddlewareLive` in `apps/api/src/index.ts`
  - [ ] 7.2 Add `AuthMiddlewareLive` to `HttpGroupsLive` layer merge

- [ ] Task 8: Rewrite auth tests (AC: #7, #8)
  - [ ] 8.1 Rewrite `assessment-auth-context.test.ts` to test `AuthMiddlewareLive` Layer
  - [ ] 8.2 Test: valid session cookie → returns user ID
  - [ ] 8.3 Test: no session / empty cookie → returns `undefined`
  - [ ] 8.4 Test: Better Auth throws → returns `undefined`
  - [ ] 8.5 Test: header normalization (array cookies, scalar headers)

- [ ] Task 9: Verification (AC: #8)
  - [ ] 9.1 `pnpm lint` — no lint errors
  - [ ] 9.2 `pnpm test:run` — all tests pass
  - [ ] 9.3 `pnpm build` — full build succeeds

## Dev Notes

### Problem Statement

Every handler manually calls `resolveAuthenticatedUserId(request)` inline. This function lives in `apps/api/src/handlers/assessment.ts:79-88` and is imported by `apps/api/src/handlers/profile.ts:18`. There is no typed context for the authenticated user — handlers get a raw `string | undefined` from a manually invoked helper. This violates the hexagonal architecture principle of dependency injection via Effect Context.

### Design Decision: Non-Optional Middleware

**Final design:** A single **non-optional** middleware that **always succeeds**, providing `string | undefined` via `CurrentUser`.

**Why NOT `optional: true`:** After analyzing Effect Platform source (`HttpApiBuilder.js:324-338`), `optional: true` means if the middleware effect **fails**, the handler runs without the provided service. Since we want anonymous users to get `undefined` (not a failure), the middleware must always succeed. Using non-optional means `CurrentUser` is always available — handlers use `yield* CurrentUser` directly without `Effect.serviceOption()`.

**Cookie-based security:** Uses `HttpApiSecurity.apiKey({ in: "cookie", key: "better-auth.session_token" })`. The Effect Platform `securityDecode` uses `HttpServerRequest.schemaCookies` to extract the cookie value. On missing cookie, it returns `Redacted.make("")` (not a failure), so the security handler always runs.

**Security handler flow:**
1. Receives `Redacted<string>` cookie token (may be empty)
2. Gets full request headers from `HttpServerRequest.HttpServerRequest`
3. Calls `auth.api.getSession({ headers: toFetchHeaders(request.headers) })`
4. On success → returns user ID string
5. On failure/no session → returns `undefined`

### Architecture Alignment

Follows hexagonal architecture (ADR-6):
- **Domain** (`packages/domain`): `CurrentUser` Context.Tag — pure abstraction, no dependencies
- **Contracts** (`packages/contracts`): `AuthMiddleware` tag — HTTP middleware definition shared frontend/backend
- **API** (`apps/api`): `AuthMiddlewareLive` — implementation with Better Auth dependency
- **Handlers**: Consume `CurrentUser` via `yield*` — no direct auth service dependency

### Bug Fix (toggleVisibility)

Current `profile.ts:100-105` uses `DatabaseError` for missing auth. This is incorrect — `Unauthorized` error already exists in contracts and the `ProfileGroup` already declares `.addError(Unauthorized, { status: 401 })`.

### Existing Test Coverage

The existing `assessment-auth-context.test.ts` (4 tests) tests `resolveAuthenticatedUserId` directly with mock `BetterAuthService` + `Layer.succeed`. These tests must be rewritten to test `AuthMiddlewareLive` instead, maintaining equivalent coverage for:
- Valid session → user ID
- No session → undefined
- Better Auth throws → undefined
- Header normalization (array cookies, scalar headers)

Use-case tests are unaffected — they receive `authenticatedUserId` as input params, not from middleware.

### Project Structure Notes

- New files follow existing patterns: `packages/domain/src/context/` (new directory), `packages/contracts/src/middleware/` (new directory), `apps/api/src/middleware/` (exists — has `better-auth.ts`)
- No conflicts with existing structure — middleware is additive
- Barrel exports follow existing `index.ts` patterns in domain and contracts

### References

- [Source: Effect Platform README - HttpApiMiddleware](https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#middlewares)
- [Source: Effect Platform README - HttpApiSecurity](https://github.com/Effect-TS/effect/blob/main/packages/platform/README.md#security)
- [Source: apps/api/src/handlers/assessment.ts#L38-L88] — Current `toFetchHeaders` + `resolveAuthenticatedUserId`
- [Source: apps/api/src/handlers/profile.ts#L18,L98-L106] — Import + `toggleVisibility` auth check
- [Source: apps/api/src/index.ts#L155-L161] — `HttpGroupsLive` layer composition
- [Source: packages/contracts/src/http/groups/assessment.ts#L165-L203] — `AssessmentGroup` definition
- [Source: packages/contracts/src/http/groups/profile.ts#L80-L105] — `ProfileGroup` definition
- [Source: docs/ARCHITECTURE.md] — Hexagonal architecture, ADR-6
- [Source: apps/api/src/handlers/__tests__/assessment-auth-context.test.ts] — Existing auth tests (4 tests)

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (claude-opus-4-6)

### Debug Log References

### Completion Notes List

### File List

| File | Action | Description |
|------|--------|-------------|
| `packages/domain/src/context/current-user.ts` | CREATE | `CurrentUser` Context.Tag (`string \| undefined`) |
| `packages/domain/src/index.ts` | MODIFY | Export CurrentUser |
| `packages/contracts/src/middleware/auth.ts` | CREATE | AuthMiddleware tag with cookie security |
| `packages/contracts/src/index.ts` | MODIFY | Export AuthMiddleware |
| `packages/contracts/src/http/groups/assessment.ts` | MODIFY | Add `.middleware(AuthMiddleware)` |
| `packages/contracts/src/http/groups/profile.ts` | MODIFY | Add `.middleware(AuthMiddleware)` |
| `apps/api/src/middleware/auth.middleware.ts` | CREATE | AuthMiddlewareLive Layer implementation |
| `apps/api/src/handlers/assessment.ts` | MODIFY | Remove inline auth, use `yield* CurrentUser` |
| `apps/api/src/handlers/profile.ts` | MODIFY | Remove inline auth, use `yield* CurrentUser`, fix Unauthorized |
| `apps/api/src/index.ts` | MODIFY | Add AuthMiddlewareLive to HttpGroupsLive |
| `apps/api/src/handlers/__tests__/assessment-auth-context.test.ts` | REWRITE | Test AuthMiddlewareLive instead of removed function |
