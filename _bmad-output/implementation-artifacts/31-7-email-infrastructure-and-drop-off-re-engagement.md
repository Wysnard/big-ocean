# Story 31-7: Email Infrastructure & Drop-off Re-engagement

Status: ready-for-dev

## Story

As the system,
I want to send a re-engagement email to users who abandon their conversation,
So that users who dropped off are reminded to return and complete their experience.

## Acceptance Criteria

1. **AC1: Resend email repository interface** — A `ResendEmailRepository` interface exists in `packages/domain/src/repositories/resend-email.repository.ts` with a method to send templated emails. A `ResendEmailRepositoryLive` implementation exists in `packages/infrastructure/src/repositories/resend-email.resend.repository.ts` using the Resend SDK.

2. **AC2: Drop-off re-engagement email** — When a user has an in-progress conversation and has been inactive for a configured duration (`dropOffThresholdHours`, default 24h), a re-engagement email is sent referencing the last territory from the final `assessment_exchange` row's `selectedTerritory` field (NFR27).

3. **AC3: One-shot enforcement** — The re-engagement email is one-shot only — no repeated re-engagement emails for the same session. A `dropOffEmailSentAt` column on `assessment_sessions` tracks whether the email has already been sent.

4. **AC4: Fire-and-forget / fail-open** — The email is sent fire-and-forget (does not block any user-facing operation). If sending fails, the failure is logged but does not affect any other system behavior.

5. **AC5: React Email template** — The drop-off re-engagement email uses a React Email template consistent with frontend styling, referencing the last conversation territory (e.g., "You and Nerin were talking about [territory]...").

6. **AC6: Drop-off detection use-case** — A `check-drop-off.use-case.ts` use-case queries for sessions that are `in_progress`, inactive beyond the threshold, and have not yet received a drop-off email. It sends the email and marks the session. This use-case is invoked periodically (cron or on-demand endpoint).

## Tasks / Subtasks

- [ ] Task 1: Create ResendEmailRepository interface (AC: #1)
  - [ ] 1.1 Create `packages/domain/src/repositories/resend-email.repository.ts` with:
    - `EmailError` plain Error class co-located with interface
    - `SendEmailInput` type: `{ to: string; subject: string; html: string }`
    - `ResendEmailMethods` interface with `sendEmail(input: SendEmailInput) => Effect<void, EmailError>`
    - `ResendEmailRepository` Context.Tag
  - [ ] 1.2 Export from `packages/domain/src/index.ts`

- [ ] Task 2: Create ResendEmailRepository implementation (AC: #1)
  - [ ] 2.1 Install `resend` package: `pnpm --filter=@workspace/infrastructure add resend`
  - [ ] 2.2 Add `resendApiKey` (Redacted) to `AppConfigService` in `packages/domain/src/config/app-config.ts`
  - [ ] 2.3 Add config binding in `packages/infrastructure/src/config/app-config.live.ts` reading `RESEND_API_KEY` env var
  - [ ] 2.4 Update `packages/domain/src/config/__mocks__/app-config.ts` with `resendApiKey` test default
  - [ ] 2.5 Create `packages/infrastructure/src/repositories/resend-email.resend.repository.ts`:
    - Layer.effect implementation using Resend SDK
    - Map Resend errors to `EmailError`
    - Log success/failure via `LoggerRepository`
  - [ ] 2.6 Create mock `packages/infrastructure/src/repositories/__mocks__/resend-email.resend.repository.ts` with in-memory implementation
  - [ ] 2.7 Export from `packages/infrastructure/src/index.ts`

- [ ] Task 3: Add drop-off tracking column (AC: #3)
  - [ ] 3.1 Add `dropOffEmailSentAt` column (nullable timestamp) to `assessment_sessions` table in `packages/infrastructure/src/db/drizzle/schema.ts`
  - [ ] 3.2 Run `pnpm db:generate` to create migration

- [ ] Task 4: Add `dropOffThresholdHours` config (AC: #2)
  - [ ] 4.1 Add `dropOffThresholdHours` (number, default 24) to `AppConfigService`
  - [ ] 4.2 Add config binding reading `DROP_OFF_THRESHOLD_HOURS` env var
  - [ ] 4.3 Update mock app-config with test default

- [ ] Task 5: Create React Email template (AC: #5)
  - [ ] 5.1 Create `packages/infrastructure/src/email-templates/drop-off-re-engagement.tsx` using React Email components
  - [ ] 5.2 Template accepts `{ userName: string; territoryName: string; resumeUrl: string }` props
  - [ ] 5.3 Template renders "You and Nerin were talking about [territory]..." with a CTA button to resume

- [ ] Task 6: Create check-drop-off use-case (AC: #2, #3, #4, #6)
  - [ ] 6.1 Add `findDropOffSessions` method to `AssessmentSessionRepository` interface:
    - Returns sessions where `status = 'in_progress'`, `updatedAt < now - thresholdHours`, `dropOffEmailSentAt IS NULL`, and `userId IS NOT NULL`
  - [ ] 6.2 Implement `findDropOffSessions` in `assessment-session.drizzle.repository.ts`
  - [ ] 6.3 Update `assessment-session.drizzle.repository.ts` mock
  - [ ] 6.4 Create `apps/api/src/use-cases/check-drop-off.use-case.ts`:
    - Query `findDropOffSessions(thresholdHours)` from session repo
    - For each session: get last exchange's `selectedTerritory`, look up territory name from catalog
    - Get user email from auth/user table
    - Render React Email template with territory name
    - Send via `ResendEmailRepository.sendEmail()` — fire-and-forget with `catchAll` logging
    - Mark session with `dropOffEmailSentAt = now`
  - [ ] 6.5 Write unit tests for the use-case

- [ ] Task 7: Create drop-off check endpoint (AC: #6)
  - [ ] 7.1 Add `checkDropOff` endpoint to contracts (internal/admin endpoint, no auth for cron invocation or protected by API key)
  - [ ] 7.2 Add handler calling `checkDropOff` use-case
  - [ ] 7.3 Wire into API server

## Dev Notes

- **Architecture pattern:** Follow hexagonal architecture — domain interface in `packages/domain`, implementation in `packages/infrastructure`, use-case in `apps/api/src/use-cases/`
- **Fire-and-forget pattern:** Use `Effect.catchAll` to log and swallow email send failures, similar to profile access logging pattern
- **Territory lookup:** Use `getTerritoryById()` from `@workspace/domain` to map territory ID to display name
- **Email from auth:** User email comes from Better Auth's user table. The session has `userId` which links to the auth user.
- **One-shot enforcement:** The `dropOffEmailSentAt` column prevents duplicate emails. Set it BEFORE sending (optimistic) to prevent race conditions with concurrent cron runs.
- **React Email:** Templates are server-rendered to HTML strings, passed to Resend's `sendEmail` as the `html` parameter.
