# Story 38-2: Deferred Portrait Recapture Email

Status: ready-for-dev

## Story

As a user who skipped the PWYW modal,
I want to be reminded that Nerin wrote something for me,
So that I have another chance to unlock my portrait.

## Acceptance Criteria

1. **Given** a user completed their assessment but has no `portrait_unlocked` purchase event **When** a configured number of days have passed since assessment completion **Then** a recapture email is sent: "Nerin's portrait is waiting for you"

2. **Given** the recapture email **When** it is composed **Then** it includes a direct link to the results page (which shows the "Unlock your portrait" CTA) **And** it uses a warm, inviting tone consistent with Nerin's voice **And** it does not expose personality data in the email body

3. **Given** the recapture email for a specific user **When** it has already been sent once **Then** no additional recapture emails are sent for that session (one-shot only)

4. **Given** a user has since purchased their portrait **When** the recapture email trigger fires **Then** the email is not sent

5. **Given** the email sending **When** delivery is attempted **Then** it uses the Resend infrastructure and React Email templates from Epic 2 **And** it is fire-and-forget — delivery failure is logged but does not affect any other system behavior

## Tasks / Subtasks

- [ ] Task 1: Add `recaptureEmailSentAt` column to assessment_session schema and migration (AC: #3)
  - [ ] 1.1: Add `recaptureEmailSentAt: timestamp("recapture_email_sent_at")` to `assessmentSession` table in `packages/infrastructure/src/db/drizzle/schema.ts`
  - [ ] 1.2: Hand-write migration SQL: `ALTER TABLE assessment_session ADD COLUMN recapture_email_sent_at TIMESTAMP;`

- [ ] Task 2: Add `recaptureThresholdDays` config (AC: #1)
  - [ ] 2.1: Add `readonly recaptureThresholdDays: number` to `AppConfigService` in `packages/domain/src/config/app-config.ts`
  - [ ] 2.2: Add `recaptureThresholdDays: Config.number("RECAPTURE_THRESHOLD_DAYS").pipe(Config.withDefault(3))` to `packages/infrastructure/src/config/app-config.live.ts`
  - [ ] 2.3: Add to mock config in `packages/domain/src/config/__mocks__/app-config.ts`

- [ ] Task 3: Add repository methods for recapture email (AC: #1, #3, #4)
  - [ ] 3.1: Add `findRecaptureEligibleSessions` and `markRecaptureEmailSent` methods to `AssessmentSessionRepository` interface in `packages/domain/src/repositories/assessment-session.repository.ts` — add `RecaptureEligibleSession` type
  - [ ] 3.2: Implement in `packages/infrastructure/src/repositories/assessment-session.drizzle.repository.ts` — `findRecaptureEligibleSessions` queries completed sessions past threshold, with `recaptureEmailSentAt IS NULL`, userId IS NOT NULL, and LEFT JOIN on purchase_events to EXCLUDE sessions whose user has a `portrait_unlocked` event (AC: #4)
  - [ ] 3.3: Update mock repository in `packages/infrastructure/src/repositories/__mocks__/assessment-session.drizzle.repository.ts`

- [ ] Task 4: Create recapture email template (AC: #2)
  - [ ] 4.1: Create `packages/infrastructure/src/email-templates/portrait-recapture.ts` following the `nerin-check-in.ts` pattern
  - [ ] 4.2: Template uses warm, inviting Nerin voice — subject: "Nerin's portrait is waiting for you", body encourages returning to unlock portrait
  - [ ] 4.3: CTA links to `/results` (unlock CTA visible on results page)
  - [ ] 4.4: Add unit test in `packages/infrastructure/src/email-templates/__tests__/portrait-recapture.test.ts`

- [ ] Task 5: Create `check-recapture` use-case (AC: #1, #3, #4, #5)
  - [ ] 5.1: Create `apps/api/src/use-cases/check-recapture.use-case.ts` following the `check-check-in.use-case.ts` pattern
  - [ ] 5.2: Query for eligible sessions using `findRecaptureEligibleSessions` (portrait_unlocked exclusion happens in repo query)
  - [ ] 5.3: Mark session BEFORE sending to prevent duplicates (one-shot), then send email fire-and-forget
  - [ ] 5.4: Add unit test in `apps/api/src/use-cases/__tests__/check-recapture.use-case.test.ts`

- [ ] Task 6: Add `checkRecapture` endpoint to EmailGroup (AC: #5)
  - [ ] 6.1: Add `checkRecapture` POST endpoint to `packages/contracts/src/http/groups/email.ts`
  - [ ] 6.2: Wire handler in `apps/api/src/handlers/email.ts`

## Dev Notes

- Follows exact same architecture as the check-in email (Story 38-1): same repository methods pattern, same email template pattern, same use-case structure, same handler wiring
- Key difference from check-in: the recapture email must NOT be sent if the user has already purchased their portrait (portrait_unlocked purchase event exists). This exclusion is best done in the SQL query via LEFT JOIN on purchase_events
- One-shot enforcement: mark session with `recaptureEmailSentAt` timestamp BEFORE attempting send to prevent duplicates on concurrent cron runs
- Fire-and-forget: email failures are logged but never propagate errors
- Default recapture threshold: 3 days post-assessment completion (configurable via RECAPTURE_THRESHOLD_DAYS env var)
