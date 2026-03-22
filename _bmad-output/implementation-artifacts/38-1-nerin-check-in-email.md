# Story 38-1: Nerin Check-in Email

Status: ready-for-dev

## Story

As a user who completed their assessment,
I want to receive a personal check-in from Nerin a couple weeks later,
So that the experience has a lasting emotional resonance beyond the initial session.

## Acceptance Criteria

1. **Given** a user completed their assessment ~2 weeks ago **When** the check-in threshold is reached **Then** a Nerin-voiced email is sent referencing a tension or theme from the user's conversation **And** the last territory is derived from the final assessment_exchange.selected_territory

2. **Given** the check-in email **When** it is composed **Then** it uses Nerin's voice: warm, curious, never clinical **And** it includes a link back to the user's results page **And** it does not expose specific personality scores or evidence in the email body

3. **Given** the check-in email for a specific user **When** it has already been sent once **Then** no additional check-in emails are sent for that assessment session (one-shot only)

4. **Given** the email sending **When** delivery is attempted **Then** it uses the Resend infrastructure and React Email templates from Epic 2 **And** it is fire-and-forget — delivery failure is logged but does not affect any other system behavior

## Tasks / Subtasks

- [ ] Task 1: Add `checkInEmailSentAt` column to assessment_session schema and migration (AC: #3)
  - [ ] 1.1: Add `checkInEmailSentAt: timestamp("check_in_email_sent_at")` to `assessmentSession` table in `packages/infrastructure/src/db/drizzle/schema.ts`
  - [ ] 1.2: Hand-write migration SQL: `ALTER TABLE assessment_session ADD COLUMN check_in_email_sent_at TIMESTAMP;`
  - [ ] 1.3: Update `AssessmentSessionRepository` interface in `packages/domain/src/repositories/assessment-session.repository.ts` — add `findCheckInEligibleSessions` and `markCheckInEmailSent` methods
  - [ ] 1.4: Update Drizzle repository implementation in `packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts`
  - [ ] 1.5: Update mock repository in `packages/infrastructure/src/repositories/__mocks__/assessment-session.drizzle.repository.ts`

- [ ] Task 2: Add `checkInThresholdDays` config to AppConfig (AC: #1)
  - [ ] 2.1: Add `readonly checkInThresholdDays: number` to `AppConfigService` in `packages/domain/src/config/app-config.ts`
  - [ ] 2.2: Add `checkInThresholdDays: Config.number("CHECK_IN_THRESHOLD_DAYS").pipe(Config.withDefault(14))` to `packages/infrastructure/src/config/app-config.live.ts`
  - [ ] 2.3: Add to mock config in `packages/domain/src/config/__mocks__/app-config.ts`

- [ ] Task 3: Create Nerin check-in email template (AC: #2)
  - [ ] 3.1: Create `packages/infrastructure/src/email-templates/nerin-check-in.ts` following the `drop-off-re-engagement.ts` pattern
  - [ ] 3.2: Template uses Nerin's warm, curious voice — subject: "I've been thinking about something you said", body references last territory as a tension/theme
  - [ ] 3.3: CTA links to `/results` (extension CTA visible on results page)
  - [ ] 3.4: Add unit test in `packages/infrastructure/src/email-templates/__tests__/nerin-check-in.test.ts`

- [ ] Task 4: Create `check-check-in` use-case (AC: #1, #3, #4)
  - [ ] 4.1: Create `apps/api/src/use-cases/check-check-in.use-case.ts` following the `check-drop-off.use-case.ts` pattern
  - [ ] 4.2: Query for completed sessions where: status is 'completed', completedAt/updatedAt is older than `checkInThresholdDays` ago, `checkInEmailSentAt` IS NULL, userId IS NOT NULL
  - [ ] 4.3: For each eligible session, look up the last territory from assessment exchanges
  - [ ] 4.4: Mark the session BEFORE sending to prevent duplicates (one-shot), then send email fire-and-forget
  - [ ] 4.5: Add unit test in `apps/api/src/use-cases/__tests__/check-check-in.use-case.test.ts`

- [ ] Task 5: Add `checkCheckIn` endpoint to EmailGroup (AC: #4)
  - [ ] 5.1: Add `checkCheckIn` POST endpoint to `packages/contracts/src/http/groups/email.ts`
  - [ ] 5.2: Wire handler in `apps/api/src/handlers/email.ts`

## Dev Notes

- Follows exact same architecture as the drop-off re-engagement email (Story 31-7): same repository methods, same email template pattern, same use-case structure, same handler wiring
- Email content per UX spec 14.3: Subject "I've been thinking about something you said", body references the last territory as a conversational theme
- The `{tensionFromPortrait}` mentioned in UX spec is aspirational — for now, use the last territory name from assessment exchanges (same approach as drop-off email)
- One-shot enforcement: mark session with `checkInEmailSentAt` timestamp BEFORE attempting send to prevent duplicates on concurrent cron runs
- Fire-and-forget: email failures are logged but never propagate errors
