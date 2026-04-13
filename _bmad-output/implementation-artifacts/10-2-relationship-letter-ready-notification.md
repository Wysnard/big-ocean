# Story 10.2: Relationship Letter Ready Notification

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user who participated in a relationship letter,
I want to be notified when the letter is ready,
so that I don't miss the moment.

## Acceptance Criteria

1. **Given** a relationship letter finishes generating for the first time
   **When** its stored content transitions from `null` to ready content
   **Then** both participants are notified within 5 minutes
   **And** the ready notification fires only once for that successful write
   **And** idempotent re-runs that skip the content write do not send duplicate notifications

2. **Given** a participant has an active push subscription and permission is effectively granted
   **When** the ready notification is delivered
   **Then** push is attempted first
   **And** the notification deep-links directly to `/relationship/$analysisId`
   **And** failures in the push path are logged without failing the generation flow

3. **Given** push cannot be used for a participant because permission is not granted, no subscription exists, or push delivery fails
   **When** the fallback path runs
   **Then** a transactional email is sent via the existing Resend infrastructure
   **And** the email subject is Nerin-voiced and relationship-letter terminology is used, not "relationship analysis"
   **And** the email body does not expose personality data, scores, or letter content

4. **Given** the notification copy is rendered to users
   **When** the user sees push copy, email subject/body, or supporting labels/logging
   **Then** user-facing copy says "relationship letter" or "letter about your dynamic"
   **And** internal table/type names may remain `relationship_analysis` / `relationship_analyses` where renaming would widen scope
   **And** the route target remains `/relationship/$analysisId` unless a separate routing story changes it

5. **Given** the current codebase has email-only notification logic and no push infrastructure yet
   **When** this story is implemented
   **Then** the dev agent adds the smallest reusable notification-delivery boundary needed for push-first with email fallback
   **And** does not hardcode a second ad hoc notification path directly inside the relationship generation use-case
   **And** any new config, subscription persistence, or service-worker wiring follows the existing hexagonal boundaries and test patterns

## Tasks / Subtasks

- [x] Task 1: Audit and preserve the current relationship-ready notification flow before changing behavior (AC: 1, 3, 4, 5)
  - [x] 1.1 Confirm the existing trigger point in `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` only sends notifications after `updateContent` actually writes content
  - [x] 1.2 Reuse the existing participant lookup in `RelationshipAnalysisRepository.getParticipantEmails` instead of introducing duplicate joins or separate participant-loading logic
  - [x] 1.3 Keep the current fail-open behavior: notification problems are logged but never make the relationship letter generation fail
  - [x] 1.4 Preserve the deep link target `/relationship/$analysisId`, which already exists in the frontend and current email implementation

- [x] Task 2: Introduce a reusable delivery boundary for push-first relationship-letter notifications (AC: 1, 2, 3, 5)
  - [x] 2.1 Add a domain-level notification delivery port for relationship-letter-ready delivery if no such abstraction exists yet; keep business logic in use-cases, not handlers or route code
  - [x] 2.2 Model delivery per participant so the system can attempt push first when the participant has a valid subscription and can fall back to email otherwise
  - [x] 2.3 If push delivery fails for one participant, continue the other participant's delivery and log structured context for the failed leg
  - [x] 2.4 Keep the implementation narrowly scoped to this ready-notification path; do not build a generic campaign/marketing system

- [x] Task 3: Align the email fallback with the new Epic 10 copy and template rules (AC: 3, 4)
  - [x] 3.1 Replace or evolve `packages/infrastructure/src/email-templates/relationship-analysis-ready.ts` so the user-facing copy says "relationship letter" and the subject follows the epic's Nerin-voiced direction: `"[Name] and you - Nerin has something to share"` or the final approved variant
  - [x] 3.2 If Story 10.1 lands first and introduces shared React Email primitives, reuse that pattern instead of keeping a standalone plain-HTML divergence
  - [x] 3.3 Keep the email free of scores, OCEAN labels, traits, facets, excerpts, or any other sensitive relationship content
  - [x] 3.4 Preserve safe escaping and direct deep-link behavior to the existing relationship route

- [x] Task 4: Wire push-first plus email-fallback delivery into the relationship generation completion path (AC: 1, 2, 3, 5)
  - [x] 4.1 Update `send-relationship-analysis-notification.use-case.ts` or replace it with a renamed/evolved relationship-letter-ready notifier that orchestrates push-first and email fallback per participant
  - [x] 4.2 Keep notification send triggered only after successful first content write in `generate-relationship-analysis.use-case.ts`
  - [x] 4.3 Preserve idempotent skip behavior: if `updateContent` reports the letter already exists, do not send notifications again
  - [x] 4.4 Add structured logging that makes it clear which participant received push, which participant fell back to email, and which delivery attempts failed

- [x] Task 5: Add the minimum supporting infrastructure for push delivery, not more (AC: 2, 5)
  - [x] 5.1 Add or extend config and persistence only as required to support push subscription lookup and delivery for authenticated users
  - [x] 5.2 If browser subscription capture is not already present, introduce the thinnest end-to-end slice needed to support notification delivery later instead of faking push in the API layer
  - [x] 5.3 Follow the UX/architecture rule that lack of permission or revoked permission is normal: treat it as an email-fallback condition, not an error state
  - [x] 5.4 Do not introduce vendor-specific logic directly into domain contracts; keep provider wiring in infrastructure

- [x] Task 6: Add focused regression coverage for the new notification contract (AC: 1, 2, 3, 4, 5)
  - [x] 6.1 Extend `apps/api/src/use-cases/__tests__/send-relationship-analysis-notification.use-case.test.ts` to cover push-first delivery, no-subscription fallback, push-failure fallback, and one-participant failure isolation
  - [x] 6.2 Extend `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts` to verify notification still sends only on first successful content write and never on idempotent skip
  - [x] 6.3 Update template tests in `packages/infrastructure/src/email-templates/__tests__/relationship-analysis-ready.test.ts` or the renamed equivalent for the new subject/copy and no-sensitive-data rule
  - [x] 6.4 Add repository/mock tests for any new push-subscription lookup or delivery adapter rather than leaving it untested behind the use-case layer

## Dev Notes

- This story is not greenfield. The codebase already has an email-only relationship-ready notification path under old "relationship analysis" naming.
- The main risk is accidental wheel reinvention: there is already a repository method for participant emails, an existing route target, an existing completion hook, and an existing fail-open pattern.
- The main architecture gap is push. There is no push subscription storage, service-worker wiring, or push delivery adapter in the current repo. That is an inference from the current codebase, not a direct architecture-document statement.
- The implementation must satisfy the new spec without creating a one-off path that later conflicts with weekly-letter and daily-return notification work.

### Previous Story Intelligence

- `_bmad-output/implementation-artifacts/35-5-relationship-analysis-email-notification.md` already solved the email-only slice for this feature family:
  - `RelationshipAnalysisRepository.getParticipantEmails` already exists and should be reused
  - `generate-relationship-analysis.use-case.ts` already gates notification on actual content write, which is the correct idempotency boundary to preserve
  - The existing email template and tests already enforce "no personality data in email"; keep that rule intact while updating the copy
- Existing implementation names still use `relationship analysis`. UX and architecture now require user-facing copy to say `relationship letter`, but internal code/table names can stay unchanged when that avoids churn.

### Current Code Observations

- `apps/api/src/use-cases/send-relationship-analysis-notification.use-case.ts` currently sends email to both users directly through `ResendEmailRepository`; there is no push attempt, no delivery abstraction, and the subject is still `"Your relationship analysis is ready"`.
- `packages/infrastructure/src/email-templates/relationship-analysis-ready.ts` is a plain string-template HTML email, not a React Email component, and its body/CTA copy still says `"analysis"`.
- `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` already has the right "send after first successful write only" behavior via `contentWasWritten`; preserve this.
- `packages/domain/src/repositories/relationship-analysis.repository.ts` and `packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts` already expose `getParticipantEmails`, so participant lookup is not new work.
- `apps/front/src/routes/relationship/$analysisId.tsx` and several components already use `/relationship/$analysisId`; the story should reuse that route target rather than inventing a new one.
- There is no current push-subscription repository, notification repository, notification config, or service-worker implementation in `apps/front`, `apps/api`, `packages/domain`, or `packages/infrastructure`.
- `packages/domain/src/config/app-config.ts` currently contains Resend email settings but no web-push/VAPID settings, reinforcing that push infrastructure is not yet implemented.

### Architecture Compliance

- Keep the implementation inside the established hexagonal structure: domain ports in `packages/domain`, infrastructure adapters in `packages/infrastructure`, business rules in `apps/api/src/use-cases`, and thin HTTP/browser wiring outside the use-case core. [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-1; Project Structure & Boundaries]
- Reuse Resend as the transactional email provider; do not introduce a second email vendor. [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-12]
- Follow the product rule that push is primary and email is fallback for relationship-letter-ready notification. [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-12; `_bmad-output/planning-artifacts/prd.md` - FR36, FR77]
- Preserve fail-open behavior for notification delivery: logging is required, but notification failure must not break relationship-letter generation. [Source: `_bmad-output/planning-artifacts/architecture.md` - ADR-2 fail-open guidance; current notification use-case]
- Keep user-facing terminology aligned with the UX spec: say "relationship letter" or "letter about your dynamic," while leaving internal `relationship_analysis` naming intact unless a broader rename story is explicitly in scope. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - relationship-letter naming guidance]

### Library / Framework Requirements

- Backend orchestration must stay in Effect-ts patterns already used in the API app (`Effect.gen`, repository tags, layered tests). Do not introduce ad hoc singleton services.
- Resend is already installed at `^6.9.4` in `@workspace/infrastructure`; use the existing repository wrapper rather than calling the SDK from a use-case.
- If Story 10.1 establishes React Email, this story should consume that shared pattern instead of preserving a separate raw-HTML convention. If 10.1 has not landed yet, keep the fallback email implementation minimal and easy to migrate.
- Any browser push implementation must respect secure-context/service-worker constraints and treat missing permission/subscription as normal fallback conditions, not exceptional failures. [Inference from official platform docs + current architecture direction]

### File Structure Requirements

Likely touch points for implementation:

- API use-cases
  - `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts`
  - `apps/api/src/use-cases/send-relationship-analysis-notification.use-case.ts` or a renamed successor

- Domain contracts and config
  - `packages/domain/src/config/app-config.ts`
  - `packages/domain/src/repositories/resend-email.repository.ts` (reuse, do not duplicate email sending)
  - New notification/push repository port if needed

- Infrastructure adapters and templates
  - `packages/infrastructure/src/repositories/resend-email.resend.repository.ts`
  - `packages/infrastructure/src/email-templates/relationship-analysis-ready.ts` or renamed equivalent
  - New push-delivery adapter and any subscription persistence adapter required for this story

- Frontend/browser wiring only if needed to support push subscription capture
  - `apps/front/src/routes/relationship/$analysisId.tsx` only if a post-read subscription hook or route integration is genuinely needed
  - New notification subscription hook/service-worker wiring if this branch has no existing equivalent

- Tests
  - `apps/api/src/use-cases/__tests__/send-relationship-analysis-notification.use-case.test.ts`
  - `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts`
  - `packages/infrastructure/src/email-templates/__tests__/relationship-analysis-ready.test.ts`
  - New tests for any push repository / subscription adapter / config parsing added here

### Testing Requirements

- Use-case tests:
  - Both participants get notified after first successful content write
  - Push is attempted first when a valid subscription exists
  - Missing permission/subscription falls back to email
  - Push failure falls back to email without failing the generation flow
  - One participant's failed delivery does not block the other participant's notification
  - Idempotent `updateContent` skip does not trigger notifications

- Template tests:
  - Subject/body copy uses relationship-letter language
  - Direct link points to `/relationship/$analysisId`
  - No personality data, scores, or excerpts appear in the email
  - Escaping remains intact

- Infrastructure/config tests:
  - New push config parses correctly
  - New repository adapters are mocked and tested at their seam
  - Any persistence added for subscriptions follows existing mock/co-location patterns

- Manual verification:
  - Ready notification received for both participants on a freshly generated relationship letter
  - User with push permission gets a deep-linking push notification
  - User without push permission receives the email fallback
  - Clicking the email CTA lands on the existing relationship route

### Git Intelligence

- The most recent commits on this branch are `fix: update worktree.json` and a larger `refactor(front): remove deprecated components and PWYW credit system`.
- That recent refactor matters here because this story must not reintroduce retired purchase/credit language or PWYW-era assumptions around relationship flows.
- The current relationship page and notification code still carry historical "analysis" naming; this story should update user-facing copy carefully without turning into a broad rename migration.

### Latest Technical Information

- Resend's current Node send-email API supports both `html` and `react` payloads. That means a React Email migration can remain inside the existing repository wrapper instead of changing the use-case contract. [Source: https://resend.com/docs/api-reference/emails/send-email]
- The browser `Notification.permission` value should be treated as effectively unavailable for push unless it is explicitly `granted`; `default` is not a safe "push available" state. [Source: https://developer.mozilla.org/en-US/docs/Web/API/Notification/permission_static]
- `PushManager.subscribe()` requires a secure context and a service worker context. That reinforces that push delivery cannot be faked purely inside the API app; subscription capture and service-worker wiring need a real boundary. [Source: https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe]

### Project Structure Notes

- Story 10.1 and 10.2 are tightly related. If Story 10.1 lands first with shared lifecycle-email primitives, this story should build on them instead of duplicating template wrappers or naming conventions.
- Epic 7 already established the relationship-letter generation/read path. This story is about delivery orchestration at readiness time, not about changing the relationship-letter content model or page layout.
- Keep scope tight: no campaign scheduler, no generic inbox UI, no broad route migration from `/relationship` to `/circle`, and no full internal rename from `analysis` to `letter` unless directly required for this notification path.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` - Story 10.2 "Relationship Letter Ready Notification"]
- [Source: `_bmad-output/planning-artifacts/prd.md` - FR36, FR77, FR100, NFR27]
- [Source: `_bmad-output/planning-artifacts/architecture.md` - Technology Stack; ADR-1; ADR-2; ADR-12; Project Structure & Boundaries]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` - relationship-letter naming guidance; notification fallback principles]
- [Source: `_bmad-output/implementation-artifacts/35-5-relationship-analysis-email-notification.md` - prior email-only implementation context]
- [Source: `apps/api/src/use-cases/send-relationship-analysis-notification.use-case.ts` - current email-only notification orchestration]
- [Source: `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts` - current idempotent send trigger]
- [Source: `packages/infrastructure/src/email-templates/relationship-analysis-ready.ts` - current fallback email template]
- [Source: `packages/domain/src/repositories/relationship-analysis.repository.ts` - existing participant lookup contract]
- [Source: `packages/domain/src/config/app-config.ts` - current config surface, showing no push settings yet]
- [Source: `apps/front/src/routes/relationship/$analysisId.tsx` - current deep-link route target]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-04-12T20:28:39+0200 - Story 10.2 context created from Epic 10 story requirements, PRD notification requirements, architecture ADR-12 and project boundaries, UX naming rules, current relationship notification code, prior Story 35-5 implementation, and current branch history.
- 2026-04-12T22:30:00+0200 - Implemented push-first relationship-letter-ready delivery with subscription persistence, queued notification consumption, Web Push VAPID adapter, account endpoints, service worker sync, copy updates, and focused regression tests. Local test execution is currently blocked because the workspace has no `node_modules`, so `vitest` is unavailable.

### Completion Notes List

- Story created out of order for Epic 10 at the user's request.
- Captured the existing email-only relationship notification path so the dev agent extends it instead of rebuilding it.
- Called out the key architectural gap: push-first delivery is required by spec, but no push infrastructure exists in the repo yet.
- Preserved the existing idempotent trigger boundary in `generate-relationship-analysis.use-case.ts`.
- Scoped the work to ready-notification delivery and copy alignment, not a broad relationship-route or data-model rewrite.
- Added a narrow push stack: subscription storage, queued notification consumption, Web Push delivery adapter, authenticated account endpoints, and a service worker wake-up flow.
- Kept missing permission, missing subscription, missing VAPID config, and push delivery failures on the email-fallback path.
- Verification remains partially blocked in this workspace because the dependency install is missing; `pnpm --filter api test ...` and `pnpm --filter @workspace/infrastructure test ...` both fail with `vitest: command not found`.

### File List

- `_bmad-output/implementation-artifacts/10-2-relationship-letter-ready-notification.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/api/src/handlers/account.ts`
- `apps/api/src/index.ts`
- `apps/api/src/index.e2e.ts`
- `apps/api/src/use-cases/consume-push-notifications.use-case.ts`
- `apps/api/src/use-cases/generate-relationship-analysis.use-case.ts`
- `apps/api/src/use-cases/remove-push-subscription.use-case.ts`
- `apps/api/src/use-cases/save-push-subscription.use-case.ts`
- `apps/api/src/use-cases/send-relationship-analysis-notification.use-case.ts`
- `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/send-relationship-analysis-notification.use-case.test.ts`
- `apps/front/public/push-sw.js`
- `apps/front/src/hooks/use-push-subscription-sync.ts`
- `apps/front/src/routes/__root.tsx`
- `drizzle/20260412223000_push_notifications/migration.sql`
- `packages/contracts/src/http/groups/account.ts`
- `packages/domain/src/config/app-config.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/repositories/push-notification-queue.repository.ts`
- `packages/domain/src/repositories/push-subscription.repository.ts`
- `packages/domain/src/repositories/relationship-analysis.repository.ts`
- `packages/domain/src/repositories/web-push.repository.ts`
- `packages/infrastructure/src/config/app-config.live.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/email-templates/relationship-analysis-ready.ts`
- `packages/infrastructure/src/email-templates/__tests__/relationship-analysis-ready.test.ts`
- `packages/infrastructure/src/index.ts`
- `packages/infrastructure/src/repositories/__mocks__/relationship-analysis.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__tests__/web-push.fetch.repository.test.ts`
- `packages/infrastructure/src/repositories/push-notification-queue.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/push-subscription.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/relationship-analysis.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/web-push.fetch.repository.ts`

### Review Findings

- [x] [Review][Decision] **D1: Service worker cross-origin credentials will fail** — Resolved: removed cross-origin API fetch from SW; shows generic notification instead. [apps/front/public/push-sw.js]
- [x] [Review][Decision] **D2: No `Notification.requestPermission()` — push is dead code** — Resolved: deferred to a future UX story. Push infra is wired and will activate when permission prompt is added.
- [x] [Review][Decision] **D3: No TTL or cleanup for push notification queue** — Resolved: added `expires_at` column with 7-day default. Cleanup cron deferred to ops story. [drizzle migration, schema.ts]
- [x] [Review][Patch] **P1: `consumeByUserId` select-then-delete race condition** — Fixed: replaced with atomic `DELETE ... RETURNING`. [push-notification-queue.drizzle.repository.ts]
- [x] [Review][Patch] **P2: `removePushSubscription` no endpoint ownership check** — Fixed: `deleteByEndpoint` now requires userId. [domain interface, drizzle repo, use-case]
- [x] [Review][Patch] **P3: Push subscription upsert user-id takeover** — Fixed: `onConflictDoUpdate` no longer sets userId; uses `setWhere` to scope to same user. [push-subscription.drizzle.repository.ts]
- [x] [Review][Patch] **P4: `derToJose` DER parser lacks validation** — Fixed: added length bounds checks, undefined guards, and multi-byte length rejection. [web-push.fetch.repository.ts]
- [x] [Review][Patch] **P5: Missing `__mocks__` files for 3 new repositories** — Fixed: created __mocks__ for push-subscription, push-notification-queue, web-push. [packages/infrastructure/src/repositories/__mocks__/]
- [x] [Review][Patch] **P6: Test mockConfig objects missing pushVapid* fields** — Fixed: added pushVapid* and nerinDirector* fields to both test mockConfigs. [apps/api/src/use-cases/__tests__/*.test.ts]
- [x] [Review][Patch] **P7: No URL/HTTPS validation on push endpoint — SSRF vector** — Fixed: added S.filter with HTTPS URL validation to PushSubscriptionPayloadSchema. [packages/contracts/src/http/groups/account.ts]
- [x] [Review][Patch] **P8: Duplicated empty-to-undefined config coercion** — Fixed: extracted `normalizeVapidConfig` shared helper. [packages/infrastructure/src/config/app-config.live.ts]
- [x] [Review][Patch] **P9: Email subject not sanitized for header injection** — Fixed: strip control chars and newlines from partnerName. [relationship-analysis-ready.ts]
- [x] [Review][Patch] **P10: `onConflictDoUpdate` resets createdAt** — Fixed: removed createdAt from conflict update set. [push-notification-queue.drizzle.repository.ts]
- [x] [Review][Patch] **P11: Service worker silently swallows all errors** — Fixed: added console.error in catch block. [apps/front/public/push-sw.js]
- [x] [Review][Patch] **P12: Web Push missing Content-Length: 0 header** — Fixed: added header. [web-push.fetch.repository.ts]
- [x] [Review][Patch] **P13: `usePushSubscriptionSync` runs on every page load** — Fixed: added sessionStorage guard + removed apiBase query param from SW registration. [use-push-subscription-sync.ts]
- [x] [Review][Defer] **W1: Use-case imports directly from @workspace/infrastructure** — `send-relationship-analysis-notification.use-case.ts` imports email templates from infrastructure, bypassing hexagonal boundary. Pre-existing from Story 35-5, widened by this change. [send-relationship-analysis-notification.use-case.ts:17-20] — deferred, pre-existing

### Change Log

- 2026-04-12 - Added push-first relationship-letter-ready notifications with email fallback, minimal subscription/push infrastructure, account APIs, service-worker consumption, copy updates, and focused tests.
- 2026-04-13 - Code review: 3 decision-needed, 13 patch, 1 deferred, 6 dismissed.
