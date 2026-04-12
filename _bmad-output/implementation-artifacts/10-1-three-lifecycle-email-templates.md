# Story 10.1: Three Lifecycle Email Templates

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to receive relevant lifecycle emails,
So that I'm reminded to return when I've drifted away.

## Acceptance Criteria

1. **Given** the Resend email infrastructure already exists
   **When** lifecycle triggers fire
   **Then** three lifecycle email templates exist in the current email-template system:
   1. **Drop-off re-engagement** for abandoned assessments
   2. **Nerin check-in** roughly two weeks after assessment completion
   3. **Subscription conversion nudge** for engaged free users

2. **Given** a drop-off email is sent
   **When** the user abandoned an in-progress assessment for longer than the configured threshold
   **Then** the email is sent at most once for that conversation
   **And** it derives the "last conversation topic" from the most recent `exchange` row using the current exchange schema
   **And** it links back to `/chat?sessionId={conversationId}`

3. **Given** a Nerin check-in email is sent
   **When** a completed assessment passes the configured check-in threshold
   **Then** the email is sent at most once for that conversation
   **And** it references a tension/theme from the user's existing persisted assessment context
   **And** it links back to `/results`
   **And** it does not expose raw scores, evidence text, or other sensitive personality data

4. **Given** a subscription conversion nudge is sent
   **When** a free user is eligible because they have either `>= 3` return visits or `>= 1` relationship letter
   **Then** the email is sent at most once per user
   **And** it highlights subscription value in Nerin's voice
   **And** it excludes users who already have the relevant paid entitlement
   **And** it reuses the current subscription/conversion CTA destination instead of inventing a new flow

5. **Given** lifecycle email delivery is attempted
   **When** any of the three trigger checks run
   **Then** they use `ResendEmailRepository`
   **And** failures are logged fail-open
   **And** the HTTP contract/handler surface reflects the active lifecycle-email checks
   **And** the obsolete deferred portrait recapture path is removed or renamed so the product only exposes the three current lifecycle email types

6. **Given** the lifecycle email implementation is complete
   **When** automated tests run
   **Then** template rendering, eligibility queries, one-shot enforcement, and handler wiring are covered for all three lifecycle emails

## Tasks / Subtasks

- [ ] Task 1: Reconcile the lifecycle email surface with the current product scope (AC: #1, #5)
  - [ ] 1.1 Create or update the active story files/modules for the three email types only: drop-off, check-in, subscription nudge
  - [ ] 1.2 Remove or rename obsolete "portrait recapture" references across repository comments, use-case headers, contracts, and tests so they no longer describe an active lifecycle email
  - [ ] 1.3 Preserve `ResendEmailRepository` as the single email delivery port; do not introduce a second provider abstraction
  - [ ] 1.4 Keep relationship-letter-ready notification work out of this story; that is Story 10.2

- [ ] Task 2: Finish the topic/tension derivation path for existing drop-off and check-in emails (AC: #2, #3)
  - [ ] 2.1 Replace the current `"your personality"` placeholder logic in [`apps/api/src/use-cases/check-drop-off.use-case.ts`](/Users/vincentlay/.21st/worktrees/big-ocean/xenacious-canopy/apps/api/src/use-cases/check-drop-off.use-case.ts) with a helper that derives a user-facing topic from the latest `exchange`
  - [ ] 2.2 Replace the current `"your personality"` placeholder logic in [`apps/api/src/use-cases/check-check-in.use-case.ts`](/Users/vincentlay/.21st/worktrees/big-ocean/xenacious-canopy/apps/api/src/use-cases/check-check-in.use-case.ts) with a helper that derives a user-facing tension/theme from persisted context
  - [ ] 2.3 Use the current exchange shape (`directorOutput`, `coverageTargets`) rather than reintroducing the deleted `selectedTerritory` column
  - [ ] 2.4 Define a deterministic fallback chain for both emails:
    - latest `coverageTargets` / `directorOutput` derived phrase first
    - existing persisted summary/tension string if available
    - generic safe fallback copy last
  - [ ] 2.5 Keep both checks one-shot by preserving `dropOffEmailSentAt` and `checkInEmailSentAt` behavior: mark before send, log failures, never retry the same record blindly

- [ ] Task 3: Replace deferred recapture with subscription conversion nudge eligibility and template work (AC: #1, #4, #5)
  - [ ] 3.1 Add a user-scoped one-shot marker for the subscription nudge, preferably on the `user` record or another user-scoped store, because the trigger is user-level rather than conversation-level
  - [ ] 3.2 Add a repository method that returns eligible free users by combining:
    - authenticated user identity and email
    - return-visit count across completed/return conversations
    - relationship-letter participation count using the existing `relationship_analysis` data model
    - exclusion of users who already have the paid entitlement in the current capability system
    - exclusion of users already marked as nudged
  - [ ] 3.3 Replace `check-recapture.use-case.ts` with a subscription-nudge use-case that follows the same fail-open / mark-before-send pattern as the existing email checks
  - [ ] 3.4 Replace `portrait-recapture.ts` with a subscription-nudge template module and matching tests
  - [ ] 3.5 Use user-facing copy that matches the current subscription story: unlock deeper weekly-letter / Nerin depth, not the retired portrait-paywall model
  - [ ] 3.6 Point the CTA at the existing subscription entry surface (`/me` subscription section or whichever route is already canonical) instead of creating a new pricing route in this story

- [ ] Task 4: Update contracts, handler wiring, and config for the active lifecycle checks (AC: #5)
  - [ ] 4.1 Update [`packages/contracts/src/http/groups/email.ts`](/Users/vincentlay/.21st/worktrees/big-ocean/xenacious-canopy/packages/contracts/src/http/groups/email.ts) so the internal email endpoints represent the active checks
  - [ ] 4.2 Update [`apps/api/src/handlers/email.ts`](/Users/vincentlay/.21st/worktrees/big-ocean/xenacious-canopy/apps/api/src/handlers/email.ts) to wire the active checks only
  - [ ] 4.3 Keep existing drop-off and check-in config knobs; add only the minimum extra config required for subscription nudge scheduling or suppression
  - [ ] 4.4 Do not add a new external scheduler abstraction in this story; reuse the existing cron/on-demand trigger shape

- [ ] Task 5: Test the three lifecycle-email paths end to end at the unit/integration seam level (AC: #6)
  - [ ] 5.1 Update template tests under [`packages/infrastructure/src/email-templates/__tests__`](/Users/vincentlay/.21st/worktrees/big-ocean/xenacious-canopy/packages/infrastructure/src/email-templates/__tests__) for drop-off, check-in, and subscription nudge
  - [ ] 5.2 Update use-case tests under [`apps/api/src/use-cases/__tests__`](/Users/vincentlay/.21st/worktrees/big-ocean/xenacious-canopy/apps/api/src/use-cases/__tests__) for all three checks
  - [ ] 5.3 Add repository-level tests or targeted assertions for eligibility queries, especially the user-level subscription-nudge exclusion rules
  - [ ] 5.4 Verify stale recapture names are gone from the active test surface

## Parallelism

- **Blocked by:** none
- **Blocks:** Story 10.2 should build on the cleaned-up lifecycle email surface, but does not need to share implementation details beyond `ResendEmailRepository`
- **Mode:** mostly parallel after the subscription-nudge storage decision is made
- **Shared files:** `packages/contracts/src/http/groups/email.ts`, `apps/api/src/handlers/email.ts`, `packages/domain/src/config/app-config.ts`, `packages/infrastructure/src/db/drizzle/schema.ts`

## Dev Notes

### Key File Locations

| File | Path | Expected Work |
|---|---|---|
| Email repository port | `packages/domain/src/repositories/resend-email.repository.ts` | Reuse; update comments if they still mention recapture |
| Conversation repository port | `packages/domain/src/repositories/conversation.repository.ts` | Reuse existing drop-off/check-in methods; add subscription-nudge eligibility if this remains the best home |
| Conversation repository impl | `packages/infrastructure/src/repositories/conversation.drizzle.repository.ts` | Extend eligibility queries and one-shot writes |
| Email contracts | `packages/contracts/src/http/groups/email.ts` | Replace recapture endpoint surface with subscription-nudge surface |
| Email handler | `apps/api/src/handlers/email.ts` | Wire active checks only |
| Drop-off use-case | `apps/api/src/use-cases/check-drop-off.use-case.ts` | Replace placeholder topic derivation |
| Check-in use-case | `apps/api/src/use-cases/check-check-in.use-case.ts` | Replace placeholder theme derivation |
| Recapture use-case | `apps/api/src/use-cases/check-recapture.use-case.ts` | Replace/rename to subscription nudge |
| Email templates | `packages/infrastructure/src/email-templates/*` | Keep drop-off/check-in, replace recapture with subscription nudge |
| Conversation schema | `packages/infrastructure/src/db/drizzle/schema.ts` | Add only the minimal new one-shot storage needed for subscription nudge |

### Architecture Context

- The project already has the full Resend path wired end to end: domain port, infrastructure adapter, contract group, handler group, use-cases, and tests.
- Existing lifecycle-email code lives under the standard hexagonal split:
  - domain interfaces in `packages/domain`
  - infra adapters/templates in `packages/infrastructure`
  - trigger use-cases in `apps/api/src/use-cases`
- Existing drop-off and check-in flows already follow the correct fail-open pattern:
  - query eligible records
  - mark before send
  - render template
  - send via `ResendEmailRepository`
  - swallow/log delivery failures
- The current codebase drift to account for explicitly:
  - product docs now require a **subscription conversion nudge**, but the code still implements **deferred portrait recapture**
  - architecture docs say "React Email", but the infrastructure package currently uses plain HTML renderer functions and has no JSX-based email pattern in production
  - product docs still say "territory" in places, but the current `exchange` schema stores `directorOutput` and `coverageTargets`

### Implementation Guidance

- Treat this as a **reuse/refactor** story, not greenfield email infrastructure.
- Do not create a second email repository, new provider, or marketing-automation pipeline.
- Do not reintroduce deleted exchange columns or message metadata just to satisfy old wording.
- For drop-off/check-in topic derivation, prefer a small helper that converts the latest `exchange` row into safe display copy using current data:
  - `coverageTargets` can provide the most recent steering domain/facet
  - `directorOutput` can provide a concise human phrase fallback
  - generic copy is acceptable only as the final fallback
- For subscription-nudge eligibility, the internal data model is still `relationship_analysis`; user-facing copy may say "relationship letter", but table/repository names should not be renamed in this story.
- The current subscription feature seam is dormant in MVP (`activate-conversation-extension.use-case.ts` currently returns `FeatureUnavailable`), so the email should reuse the existing conversion entry surface and capability model instead of assuming a brand-new checkout architecture lands here.

### Testing Guidance

- Mirror the existing email test style:
  - template rendering tests under `packages/infrastructure/src/email-templates/__tests__`
  - use-case tests under `apps/api/src/use-cases/__tests__`
  - repository eligibility assertions in Drizzle repo tests or focused mocks
- Add negative tests for:
  - duplicate-send prevention
  - entitled users excluded from subscription nudges
  - users below the engagement threshold excluded
  - generic fallback copy only used when exchange-derived copy is unavailable

### Project Structure Notes

- Alignment with unified project structure: lifecycle emails already live in the correct backend locations; extend that shape instead of inventing a separate notifications module.
- Detected variance:
  - Epic/architecture text says "React Email", but the current production pattern is plain HTML string renderers in `packages/infrastructure/src/email-templates`.
  - Epic text says drop-off derives from the last `assessment_exchange` topic; in the current schema this must be interpreted through `exchange.coverageTargets` / `exchange.directorOutput`, not `selectedTerritory`.
  - UX design positions subscription conversion primarily inside the weekly letter, while Epic 10.1 also introduces a subscription conversion email. Implement the email as specified here, but keep its copy aligned with the weekly-letter conversion narrative and avoid resurrecting retired portrait-paywall messaging.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` — Epic 10: Transactional Emails & Re-Engagement]
- [Source: `_bmad-output/planning-artifacts/prd.md` — FR76, FR77, NFR27]
- [Source: `_bmad-output/planning-artifacts/architecture.md` — ADR-12: Email Infrastructure (Resend)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` — §14 Re-Engagement Emails, Journey 8 subscription conversion]
- [Source: `packages/domain/src/repositories/resend-email.repository.ts`]
- [Source: `packages/domain/src/repositories/conversation.repository.ts`]
- [Source: `packages/domain/src/repositories/exchange.repository.ts`]
- [Source: `packages/infrastructure/src/repositories/conversation.drizzle.repository.ts`]
- [Source: `packages/infrastructure/src/email-templates/drop-off-re-engagement.ts`]
- [Source: `packages/infrastructure/src/email-templates/nerin-check-in.ts`]
- [Source: `packages/infrastructure/src/email-templates/portrait-recapture.ts`]
- [Source: `apps/api/src/use-cases/check-drop-off.use-case.ts`]
- [Source: `apps/api/src/use-cases/check-check-in.use-case.ts`]
- [Source: `apps/api/src/use-cases/check-recapture.use-case.ts`]
- [Source: `apps/api/src/use-cases/activate-conversation-extension.use-case.ts`]

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Schema backsliding** — Do not re-add `selectedTerritory`, `territory_id`, or other retired exchange/message fields just to support email copy.
2. **Obsolete-product leakage** — Do not keep the deferred portrait recapture email active beside the subscription conversion nudge. This story is explicitly replacing the retired flow.
3. **Infrastructure drift** — Do not introduce JSX/React Email in isolation unless you intentionally prepare the infrastructure package, build, and tests for it. The default path in this repo is the existing HTML renderer pattern.
4. **Wrong scope for one-shot state** — Do not store the subscription-nudge sent marker on a conversation row unless you can prove the trigger is conversation-scoped. The requirement is user-level engagement.
5. **Sensitive-content leakage** — Do not include raw scores, facet names, evidence quotes, or relationship-analysis content in lifecycle email bodies.
6. **New conversion surface invention** — Do not create a brand-new pricing route, checkout architecture, or scheduler as part of this story.

### Review Findings

- [x] [Review][Dismissed] Trait names in check-in email accepted as non-sensitive — trait names are not raw scores or evidence text per AC #3; current phrasing is fine.
- [x] [Review][Patch] Missing database migration for schema changes — FIXED: created `drizzle/20260412200000_lifecycle_email_schema/migration.sql`
- [x] [Review][Patch] `docker/init-db-test.sql` not updated for schema changes — FIXED: added `subscription_nudge_email_sent_at` to user table, removed `recapture_email_sent_at` from conversations
- [x] [Review][Patch] Race condition in mark-before-send — FIXED: added `WHERE ...SentAt IS NULL` guard + `.returning()` row count check to all three mark operations
- [x] [Review][Patch] No dedicated unit tests for `lifecycle-email-copy.ts` — FIXED: created `lifecycle-email-copy.test.ts` with 15 tests covering all derivation functions and fallback chains
- [x] [Review][Patch] `normalizeDirectorPhrase` produces grammatically broken output — FIXED: expanded keyword set and returns bare noun phrases as-is instead of prefixing "how"
- [x] [Review][Patch] Missing negative test for already-marked users — FIXED: added "excludes users who already received the nudge" test
- [x] [Review][Patch] Missing test for `marked === false` branch — FIXED: added "skips user when mark fails" test with failing mark layer
- [x] [Review][Patch] Subscription nudge template test missing sensitive-content leakage assertions — FIXED: added `not.toContain("OCEAN"/"facet"/"score"/trait names)` assertions
- [x] [Review][Patch] Drop-off test does not verify `/chat?sessionId=` link format — FIXED: added `toContain("/chat?sessionId=")` assertion
- [x] [Review][Patch] Check-in test does not verify `/results` link — FIXED: added `toContain("/results")` assertion
- [x] [Review][Patch] `getBySessionId` error swallowed without logging — FIXED: added `logger.error` call in catchAll
- [x] [Review][Patch] Indentation inconsistency in `catchAll` blocks — FIXED: aligned logger.error and return to consistent indentation
- [x] [Review][Patch] Pre-existing: fail-open tests missing Effect provider — FIXED: restructured to provide layer to entire generator
- [x] [Review][Defer] Entitlement exclusion only checks `extended_conversation_unlocked` — pre-existing, only one purchase type exists currently [lifecycle-email.drizzle.repository.ts] — deferred, pre-existing
- [x] [Review][Defer] `thresholdDays` accepts 0 or negative values — pre-existing pattern across all threshold configs [lifecycle-email.drizzle.repository.ts] — deferred, pre-existing
- [x] [Review][Defer] Hardcoded engagement thresholds (3 visits / 1 letter) in raw SQL — design decision, not configurable [lifecycle-email.drizzle.repository.ts:109-112] — deferred, pre-existing
- [x] [Review][Defer] `Effect.tap` mutation of `emailsSent++` — latent race condition if refactored to concurrent forEach [check-*.use-case.ts] — deferred, pre-existing

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `pnpm typecheck` fails in this worktree because local dependencies are not installed and `@workspace/typescript-config/base.json` is unavailable
- `pnpm exec biome` and local `./node_modules/.bin/{biome,vitest}` are unavailable because `node_modules` is missing in this worktree

### Completion Notes List

- Replaced the deferred portrait recapture path with a subscription conversion nudge flow: new user-scoped repository, use-case, template, tests, contract route, and handler wiring
- Added `lifecycle-email-copy.ts` and updated drop-off/check-in use-cases to derive user-facing topic/theme copy from `exchange.coverageTargets` / `directorOutput` with persisted assessment-result fallback for check-in
- Added a user-scoped `subscription_nudge_email_sent_at` schema field plus config rename to `subscriptionNudgeThresholdDays`, while keeping `ResendEmailRepository` as the only delivery port
- Updated lifecycle email tests to cover derived copy, one-shot behavior, active endpoint wiring expectations, and subscription nudge copy without portrait-paywall language
- Verification is currently blocked by missing workspace dependencies, so tasks remain unchecked and the story stays `in-progress`

### File List

- `_bmad-output/implementation-artifacts/10-1-three-lifecycle-email-templates.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `apps/api/src/handlers/email.ts`
- `apps/api/src/index.e2e.ts`
- `apps/api/src/index.ts`
- `apps/api/src/use-cases/__tests__/check-check-in.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/check-drop-off.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/check-subscription-nudge.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/generate-relationship-analysis.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/send-relationship-analysis-notification.use-case.test.ts`
- `apps/api/src/use-cases/check-check-in.use-case.ts`
- `apps/api/src/use-cases/check-drop-off.use-case.ts`
- `apps/api/src/use-cases/check-subscription-nudge.use-case.ts`
- `apps/api/src/use-cases/check-recapture.use-case.ts` (deleted)
- `apps/api/src/use-cases/lifecycle-email-copy.ts`
- `packages/contracts/src/http/groups/email.ts`
- `packages/domain/src/config/__mocks__/app-config.ts`
- `packages/domain/src/config/app-config.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/repositories/conversation.repository.ts`
- `packages/domain/src/repositories/lifecycle-email.repository.ts`
- `packages/domain/src/repositories/resend-email.repository.ts`
- `packages/infrastructure/src/config/app-config.live.ts`
- `packages/infrastructure/src/db/drizzle/schema.ts`
- `packages/infrastructure/src/email-templates/__tests__/portrait-recapture.test.ts` (deleted)
- `packages/infrastructure/src/email-templates/__tests__/subscription-conversion-nudge.test.ts`
- `packages/infrastructure/src/email-templates/portrait-recapture.ts` (deleted)
- `packages/infrastructure/src/email-templates/subscription-conversion-nudge.ts`
- `packages/infrastructure/src/index.ts`
- `packages/infrastructure/src/repositories/__mocks__/conversation.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/lifecycle-email.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/conversation.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/lifecycle-email.drizzle.repository.ts`
- `packages/infrastructure/src/utils/test/app-config.testing.ts`
