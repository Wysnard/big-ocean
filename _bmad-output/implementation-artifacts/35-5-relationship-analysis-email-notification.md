# Story 35-5: Relationship Analysis Email Notification

**Status:** ready-for-dev
**Epic:** 6 — Relationship Analysis — Generation & Display
**Story:** 6.5

## User Story

As a user,
I want to be notified by email when a relationship analysis I participated in is ready,
So that I know to come back and read it.

## Acceptance Criteria

**AC1:** Given a relationship analysis generation completes successfully, when the content is written to the database, then both participating users receive an email notification (FR36). The email is delivered within 5 minutes of completion with >95% delivery rate (NFR27).

**AC2:** Given the email is sent, when it is composed, then it uses the Resend infrastructure and React Email templates from Epic 2 (existing email template pattern). The email is fire-and-forget — delivery failure does not affect the analysis or user experience.

**AC3:** Given the email content, when the user reads it, then it includes a direct link to view the analysis. It does not expose analysis content or personality data in the email body.

## Tasks

### Task 1: Create Relationship Analysis Ready Email Template
- Create `packages/infrastructure/src/email-templates/relationship-analysis-ready.ts`
- Follow existing email template pattern (plain HTML template literals, `escapeHtml` helper)
- Props: `userName`, `partnerName`, `analysisUrl`
- Include direct link to view the analysis
- Do NOT expose personality data or analysis content
- Match styling of existing email templates (dark theme, purple CTA)

### Task 2: Add `getParticipantEmails` Method to RelationshipAnalysisRepository
- Add method to repository interface: `getParticipantEmails(analysisId: string) => Effect<{ userAEmail: string; userAName: string; userBEmail: string; userBName: string } | null, DatabaseError>`
- Implement in Drizzle repository: join `relationship_analyses` with `user` table to get both emails and names
- Add to mock repository

### Task 3: Create `sendRelationshipAnalysisNotification` Use-Case
- Create `apps/api/src/use-cases/send-relationship-analysis-notification.use-case.ts`
- Depends on: `RelationshipAnalysisRepository`, `ResendEmailRepository`, `LoggerRepository`, `AppConfig`
- Loads participant emails/names via `getParticipantEmails`
- Sends email to both users (fire-and-forget, errors logged but swallowed)
- Constructs analysis URL using `config.frontendUrl`

### Task 4: Integrate Notification into Generate Relationship Analysis Use-Case
- After successful `updateContent` in `generate-relationship-analysis.use-case.ts`, call `sendRelationshipAnalysisNotification`
- Fire-and-forget: wrap in `Effect.catchAll` that logs errors
- Do NOT send notification if `updateContent` was skipped (idempotent case — analysis already had content)

### Task 5: Write Unit Tests
- Test email template renders correctly with expected props
- Test `sendRelationshipAnalysisNotification` use-case:
  - Sends email to both users on success
  - Handles missing participant data gracefully
  - Email failures are swallowed (fire-and-forget)
- Test integration in `generateRelationshipAnalysis`:
  - Notification is sent after successful content update
  - Notification is NOT sent on idempotent skip
  - Notification failure does not cause generation to fail

## Technical Notes

- Email template follows existing pattern in `packages/infrastructure/src/email-templates/`
- Fire-and-forget pattern: `Effect.catchAll` swallows errors, logs them
- Use `AppConfig.frontendUrl` for constructing analysis URLs
- Email subject should be warm/inviting (Nerin voice), not clinical
- No personality data in email body (NFR13 compliance)

## Dependencies

- Email infrastructure from Story 2.7 / 31-7 (ResendEmailRepository, email templates)
- Relationship analysis generation from Story 6.2 / 35-2
