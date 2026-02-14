---
title: 'Enforce Assessment Session Ownership and Home Redirect'
slug: 'enforce-assessment-session-ownership-and-home-redirect'
created: '2026-02-14 02:46:06 CET'
status: 'Implementation Complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - 'TypeScript'
  - 'Effect Platform HTTP API'
  - 'Better Auth'
  - 'Drizzle ORM (PostgreSQL)'
  - 'TanStack Router'
  - 'TanStack Query'
files_to_modify:
  - 'apps/api/src/handlers/assessment.ts'
  - 'apps/api/src/use-cases/resume-session.use-case.ts'
  - 'apps/api/src/use-cases/get-results.use-case.ts'
  - 'apps/api/src/use-cases/send-message.use-case.ts'
  - 'apps/api/src/use-cases/__tests__/get-results.use-case.test.ts'
  - 'apps/api/src/use-cases/__tests__/send-message.use-case.test.ts'
  - 'apps/api/src/use-cases/__tests__/resume-session.use-case.test.ts'
  - 'apps/front/src/hooks/use-assessment.ts'
  - 'apps/front/src/hooks/useTherapistChat.ts'
  - 'apps/front/src/components/TherapistChat.tsx'
  - 'apps/front/src/routes/results/$sessionId.tsx'
  - 'apps/front/src/components/TherapistChat.test.tsx'
  - 'apps/front/src/routes/results-session-route.test.tsx'
code_patterns:
  - 'Use Effect use-case boundary checks before data loading (sessionRepo.getSession first)'
  - 'Handler-level error mapping via Effect.catchTag and contracts error classes'
  - 'Auth context is resolved in API layer; Better Auth server-side session lookup uses request headers'
  - 'Frontend error handling currently relies on string-matching error.message from fetch wrapper'
  - 'Route-level redirect handling with TanStack navigate/redirect in effects'
test_patterns:
  - 'Vitest use-case tests with Layer.succeed mocks and Effect.runPromise'
  - 'Use-case error assertions via Effect.flip for tagged domain/contract errors'
  - 'Frontend jsdom tests with mocked hooks/router and navigation assertions'
  - 'Route/component tests for redirect behavior on 404/session errors'
---

# Tech-Spec: Enforce Assessment Session Ownership and Home Redirect

**Created:** 2026-02-14 02:46:06 CET

## Overview

### Problem Statement

Assessment sessions are currently addressable by `sessionId` across resume/results/message APIs. After an anonymous session is linked to a user account, non-owners can still attempt access if they know or receive that `sessionId`. This conflicts with ownership/privacy expectations and the auth-gated results intent.

### Solution

Enforce ownership checks in assessment use cases. When a session is linked (`session.userId != null`), only the owning authenticated user can access it. For non-owners, return `404` (do not reveal existence). In frontend, treat ownership-denied `404` as a safe redirect to home page (`/`) for chat/results session views.

### Scope

**In Scope:**
- Add ownership guard inputs and checks for:
  - `resumeSession`
  - `getResults`
  - `sendMessage`
- Resolve current requester identity in assessment handlers using Better Auth session context.
- Return `404` for ownership-denied access to linked sessions.
- Frontend redirect to `/` for ownership-denied session access.
- Add regression tests for owner/non-owner behavior.

**Out of Scope:**
- Replacing Better Auth or changing auth cookie/session strategy.
- Altering public profile sharing model.
- Introducing new access control systems beyond linked-session ownership guard.

## Context for Development

### Codebase Patterns

- Use-cases encapsulate business rules and are called by thin handlers (`assessment.ts` delegates all business decisions).
- Current assessment use-cases validate existence only (`sessionRepo.getSession`) and do not enforce ownership.
- `assessment_session.user_id` is text in Drizzle schema, compatible with Better Auth non-UUID IDs.
- Better Auth exposes server-side session lookup (`auth.api.getSession({ headers })`); assessment handlers currently do not resolve authenticated user.
- Frontend fetch wrapper throws plain `Error(message)` and downstream logic pattern-matches message content (status/detail not structured).
- Chat/results flows currently treat 404 as session-not-found/continue flow; no explicit ownership-denied redirect-to-home behavior.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `apps/api/src/handlers/assessment.ts` | Entry point for start/message/results/resume API endpoints |
| `packages/infrastructure/src/context/better-auth.ts` | Anonymous-session linking and Better Auth service instance used for server-side session resolution |
| `packages/infrastructure/src/db/drizzle/schema.ts` | Source of truth for `assessment_session.user_id` and ownership persistence model |
| `apps/api/src/use-cases/resume-session.use-case.ts` | Resume flow logic, currently existence-only guard |
| `apps/api/src/use-cases/get-results.use-case.ts` | Results flow logic, currently existence-only guard |
| `apps/api/src/use-cases/send-message.use-case.ts` | Message flow logic, currently existence-only guard |
| `apps/front/src/hooks/use-assessment.ts` | Fetch wrappers and error propagation for assessment endpoints |
| `apps/front/src/hooks/useTherapistChat.ts` | Session error classification currently based on `error.message` |
| `apps/front/src/components/TherapistChat.tsx` | Current session error redirect behavior (`/chat`) |
| `apps/front/src/routes/results/$sessionId.tsx` | Results route auth gate + error handling target for home redirect behavior |
| `apps/api/src/use-cases/__tests__/get-results.use-case.test.ts` | Existing use-case style for SessionNotFound assertions |
| `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts` | Existing use-case style for repository + orchestration mocks |
| `apps/front/src/components/TherapistChat.test.tsx` | Existing UI assertions for resume/session error states |
| `apps/front/src/routes/results-session-route.test.tsx` | Existing results route behavior tests |

### Technical Decisions

- Unauthorized linked-session access policy: `404` (not `401/403`) to avoid leaking session existence.
- Redirect behavior: only ownership-denied linked-session access redirects to `/`.
- Anonymous pre-link session access remains allowed until `session.userId` is set.
- Ownership guard location: enforce in use-cases (`resumeSession`, `getResults`, `sendMessage`) with caller identity provided by handler.
- Caller identity source: assessment handlers resolve user from Better Auth session cookies (not client-passed `userId`).
- Error contract: ownership denial maps to `SessionNotFound` (HTTP 404) to preserve non-disclosure semantics.
- Frontend handling: add explicit home redirect on ownership-denied access path for chat/results session entry points.

## Implementation Plan

### Tasks

- [x] Task 1: Resolve authenticated requester identity in assessment handlers
  - File: `apps/api/src/handlers/assessment.ts`
  - Action: Add a reusable helper to resolve the current Better Auth session user ID from request cookies/headers and pass `authenticatedUserId` into `resumeSession`, `getResults`, and `sendMessage` use-case calls.
  - Notes: Keep `startAssessment` behavior unchanged; owner identity must come from server auth context (never from client payload).

- [x] Task 2: Add ownership guard to session-scoped assessment use-cases
  - File: `apps/api/src/use-cases/resume-session.use-case.ts`
  - Action: Extend input type with `authenticatedUserId?: string`; after loading the session, enforce: if `session.userId` is set and differs from requester, fail with `SessionNotFound`.
  - Notes: Ownership check must run immediately after `getSession` and before any side effects. Preserve anonymous pre-link access (`session.userId == null`) and existing confidence/message behavior.

- [x] Task 3: Add ownership guard to results use-case
  - File: `apps/api/src/use-cases/get-results.use-case.ts`
  - Action: Extend input with `authenticatedUserId?: string`; apply the same linked-session ownership check before evidence/result computation.
  - Notes: Ownership check must run immediately after `getSession` and before evidence loading. Keep response contract unchanged and continue returning 404 semantics for denied/missing sessions.

- [x] Task 4: Add ownership guard to send-message use-case
  - File: `apps/api/src/use-cases/send-message.use-case.ts`
  - Action: Extend input with `authenticatedUserId?: string`; enforce linked-session owner check before persisting message/orchestrating response.
  - Notes: Ownership check must run immediately after `getSession` and before any persistence/orchestrator call. Continue anonymous cost tracking for unlinked sessions only; owner mismatch must fail fast.

- [x] Task 5: Add API use-case regression tests for ownership matrix
  - File: `apps/api/src/use-cases/__tests__/get-results.use-case.test.ts`
  - Action: Add tests for linked session owner allowed, linked session non-owner denied (SessionNotFound), and unlinked session allowed.
  - Notes: Use existing `Layer.succeed` mocks and `Effect.flip` assertion style.

- [x] Task 6: Expand send-message ownership tests
  - File: `apps/api/src/use-cases/__tests__/send-message.use-case.test.ts`
  - Action: Add owner/non-owner/unlinked cases and verify denial occurs before any side effect for non-owners.
  - Notes: Assert `saveMessage`, session/message updates, and `processMessage` are never called when access is denied.

- [x] Task 7: Add resume-session ownership tests
  - File: `apps/api/src/use-cases/__tests__/resume-session.use-case.test.ts`
  - Action: Create test suite covering owner success, non-owner denial, unauthenticated denial for linked sessions, and unlinked success.
  - Notes: New file if missing; follow existing use-case test conventions.

- [x] Task 8: Standardize frontend session access error typing
  - File: `apps/front/src/hooks/use-assessment.ts`
  - Action: Replace plain `Error(message)` throws with a typed API error object including HTTP status to support deterministic redirect behavior.
  - Notes: Keep hook signatures stable for existing consumers.

- [x] Task 9: Enforce home redirect on denied linked-session access in chat flow
  - File: `apps/front/src/hooks/useTherapistChat.ts`
  - Action: Update error parsing to use typed HTTP status; classify 404 resume/send failures for authenticated users as ownership/session denial.
  - Notes: Avoid brittle string matching as primary signal.

- [x] Task 10: Update chat UI redirect target for ownership-denied access
  - File: `apps/front/src/components/TherapistChat.tsx`
  - Action: Redirect authenticated denied-session cases to `/` (home) instead of `/chat`.
  - Notes: Keep current `/chat` recovery behavior for unauthenticated/new-session flow.

- [x] Task 11: Enforce results-route redirect to home for denied linked-session access
  - File: `apps/front/src/routes/results/$sessionId.tsx`
  - Action: When authenticated and results fetch returns denied/not-found 404, navigate to `/` rather than rendering "Continue Assessment".
  - Notes: Preserve auth gate behavior for unauthenticated users.

- [x] Task 12: Add frontend regression tests for redirect behavior
  - File: `apps/front/src/components/TherapistChat.test.tsx`
  - Action: Add assertions that authenticated session-denied state routes to `/`.
  - Notes: Continue existing mocked `useNavigate` approach.

- [x] Task 13: Add results route redirect tests
  - File: `apps/front/src/routes/results-session-route.test.tsx`
  - Action: Add test coverage for authenticated 404 results access redirecting to `/`.
  - Notes: Keep existing mocked hook strategy and route component import pattern.

### Acceptance Criteria

- [ ] AC 1: Given a linked assessment session owned by user A, when user A requests resume/results or sends a message, then the API returns success data.
- [ ] AC 2: Given a linked assessment session owned by user A, when user B (authenticated) requests resume/results or sends a message, then the API responds with `SessionNotFound` (HTTP 404) and no session data is exposed.
- [ ] AC 3: Given a linked assessment session owned by user A, when an unauthenticated requester attempts resume/results or send-message, then the API responds with `SessionNotFound` (HTTP 404).
- [ ] AC 4: Given an unlinked (anonymous) assessment session, when an unauthenticated requester resumes/results/sends message with its `sessionId`, then existing anonymous behavior continues to work.
- [ ] AC 5: Given an authenticated user opening a chat/results page for a denied linked session, when frontend receives HTTP 404 from session-scoped assessment APIs, then the app redirects to `/`.
- [ ] AC 6: Given an authenticated non-owner on chat/results entry points, when denied access is returned, then the app redirects to `/` and does not render a "Continue Assessment" CTA.
- [ ] AC 7: Given ownership denial on send-message, when the request is processed, then no user message is persisted, no session/message DB writes occur, and orchestrator is not invoked.
- [ ] AC 8: Given an unauthenticated user opening chat flow, when session loading fails in non-ownership scenarios, then existing start/recovery UX remains intact and does not force home redirect.
- [ ] AC 9: Given signup/signin links an anonymous session to a user, when that same user resumes immediately after linking, then resume succeeds without schema parse errors or ownership denial.

## Additional Context

### Dependencies

- Better Auth session resolution in API layer
- Existing Effect error mapping in contracts/handlers
- Better Auth server API `getSession({ headers })` support for request-bound identity resolution
- Existing assessment session repository and Drizzle schema (`assessment_session.user_id` as text FK)

### Testing Strategy

- API unit tests:
  - Extend `get-results` and `send-message` tests for owner/non-owner/unlinked cases.
  - Add new `resume-session` use-case test file for ownership matrix.
- Frontend unit tests:
  - Validate typed API error parsing and redirect decisions in chat/results flows.
  - Add/extend route and component tests to assert navigation to `/` for authenticated denied access.
- Manual validation:
  - Start anonymous assessment, send message, sign up with `anonymousSessionId`, verify same user can resume.
  - Open linked `sessionId` from a different authenticated account, verify redirect to `/` and no data reveal.
  - Verify unlinked anonymous session still resumable prior to linking.

### Notes

This spec implements the approved correct-course proposal from `sprint-change-proposal-2026-02-14.md`.
- Security non-disclosure remains intentional: denied access and missing session both use HTTP 404.
- Frontend cannot cryptographically distinguish "missing" vs "owned by someone else" under non-disclosure policy; redirect logic should be scoped by authenticated session-route context.
- Hydration mismatch in `ThemeToggle` is a separate issue and out of scope for this correct-course item.
