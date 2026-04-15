# Deferred Work

## Deferred from: code review of 2-5-return-seed-and-notification-permission-on-first-me-page-visit.md (2026-04-14)

- Results route: on `fetchFirstVisitState` rejection, state is set so the Return Seed section stays hidden; acceptable fail-closed behavior, recovery is refresh when the network recovers

## Deferred from: code review of 2-1-show-me-what-you-found-closing-button (2026-04-13)

- `sessionId` empty-string guard absent in `PostAssessmentTransitionButton` — route validates before mount so low risk; guard could be added defensively
- Race condition: `isFarewellReceived` fires before server writes final portrait data — CTA click may hit results before data is ready; Story 2.2 owns generating-state UX
- Arrow `→` in button label may produce odd screen-reader announcement depending on AT/locale — consider `aria-hidden` on the arrow character
- Mock `Link` fixture types `search` as `Record<string, string>` narrower than TanStack Router's actual generic — works today but may mask type mismatches in future tests
- No test for `isFarewellReceived=true, isAuthenticated=false` state (results in blank action area with no affordance)
- `data-slot="post-assessment-transition"` wrapper div lives in `TherapistChat.tsx` rather than inside `PostAssessmentTransitionButton` — component reuse will not carry the wrapper selector

## Deferred from: code review of 45-2-repository-and-domain-layer-renames (2026-04-07)

- `mockAssessmentMessageRepo` in `start-assessment.fixtures.ts:35` is missing `updateExchangeId` and `getMessagesByUserId` methods required by `MessageRepository` interface
- `mockExchangeRepo` in `start-assessment.fixtures.ts:48` is missing `findByUserId` method required by `ExchangeRepository` interface
- `smoke.test.ts:58` asserts `session.userId` which is beyond the `ConversationRepository.createSession` return type contract — works only because mock returns a superset
- Stale comments referencing old table names (`assessment_exchange`, `assessment_message`, `assessment session`) remain in domain/infra files (conversation.entity.ts, message.entity.ts, conversation.repository.ts, exchange.drizzle.repository.ts, message.drizzle.repository.ts, and others)
- Mock variable names in shared fixtures still use old naming (`mockAssessmentSessionRepo`, `mockAssessmentMessageRepo`) — affects `start-assessment.fixtures.ts`, `global-assessment-limit.test.ts`, `start-assessment-auth.use-case.test.ts`

## Deferred from: code review of 45-3-handler-contract-and-frontend-renames (2026-04-07)

- Integration test `apps/api/tests/integration/assessment.test.ts` uses old `/api/assessment/*` paths and `assessment_token` cookie (55 occurrences) — needs full rename to `/api/conversation/*` and `conversation_token`
- UI string "Start Fresh Assessment" in `apps/front/src/components/ResultsAuthGate.tsx:49,123` — may need updating to "Start Fresh Conversation" depending on product intent
- E2E factory exports `createAssessmentSession`/`sendAssessmentMessage` not renamed — explicitly deferred per story scope notes

## Deferred from: code review of 45-4-fk-column-migration (2026-04-08)

- `parentSessionId` TS property on `conversation` table not renamed to `parentConversationId` — pre-existing from Story 45-1 (SQL column was renamed to `parent_conversation_id` but TS property was left as `parentSessionId`)
- 4 legacy `assessment_session_*` prefixed index names on `conversations` table (`assessment_session_user_id_idx`, `assessment_session_original_lifetime_unique`, `assessment_session_token_unique`, `assessment_session_parent_session_id_idx`) — intentionally kept stable per Story 45-1 scope boundary

## Deferred from: code review of 45-5-fk-column-code-cascade (2026-04-08)

- `exchanges` table definition is missing from `docker/init-db-test.sql` — the table was renamed from `assessment_exchange` to `exchanges` in a prior story but the manual init SQL was not updated to include it

## Deferred from: code review of 45-6-assessment-turn-count-25-to-15 (2026-04-08)

- Dual milestone coordinate systems: `TherapistChat` uses integer percentages (25/50/75) while `DepthMeter` uses decimals (0.25/0.5/0.75) — fragile coupling, not a current bug
- Two divergent "is final turn" checks in `nerin-pipeline.ts` — exchange count vs. atomic `incrementMessageCount` counter could disagree in retry scenarios
- `eval-portrait.ts` variable still named `USER_MESSAGE_COUNT` instead of turn terminology — minor naming inconsistency in script
- Seed script `seed-completed-assessment.ts` produces 6 user turns vs. `assessmentTurnCount=15` — "completed" assessment shows 40% progress in certain views
- Stale `MESSAGE_THRESHOLD` references in `compose.e2e.yaml`, `compose.test.yaml`, and e2e spec comments — dead config from removed env var
- Milestone badge insertion at `i + 1` in TherapistChat creates 1-message visual delay vs. depth-meter tick position — pre-existing
- Resume milestone race condition: milestone tracking effect may fire before messages populate on async resume — pre-existing

## Deferred from: code review of 45-8-deferred-cleanup (2026-04-08)

- Concurrent final-turn requests can double-trigger farewell + finalization: two simultaneous requests for the same session can both compute `isFinalTurn=true` via `getTurnState()` and both attempt farewell message save + status transition to `finalizing`. No request-level mutex or optimistic locking guard exists. Pre-existing.
- `getTurnState(messageCount, 0)` yields `isFinalTurn=true` always when `totalTurns=0`. No guard against zero or negative `totalTurns` in the helper. Currently mitigated by config defaults but no defensive check. Pre-existing.
- `e2e/specs/dashboard-page.spec.ts` line 11 comment says `FREE_TIER_MESSAGE_THRESHOLD=2` but the e2e compose sets it to `1`. Pre-existing factual error in an untouched file.
- `docker/init-db-test.sql` FK constraint still named `assessment_session_user_id_user_id_fkey` (pre-ADR-39 naming). FK constraint names were not in scope for Story 45-8 (only index names).

## Deferred from: code review of 47-3-results-page-and-portrait-accessibility (2026-04-09)

- Route test mock drift: mocks in `-results-session-route.test.tsx` hardcode `role`/`aria-label` values that must stay in sync with real component implementations manually. Pre-existing mock architecture pattern.
- Brittle className assertion in `PortraitReadingView.test.tsx:47` — tests implementation detail (`max-w-[65ch]`) rather than observable behavior. No behavioral alternative available for asserting prose width.

## Deferred from: code review of 47-5-touch-targets-and-contrast-audit (2026-04-09)

- W1: Hardcoded error IDs (e.g., `login-email-error`, `signup-name-error`) risk DOM ID collision if multiple form instances render simultaneously. Pattern works today but `useId()` would be more robust.
- W2: Task 3 contrast audit (AC2) is incomplete — no color token or contrast-related changes in the diff. Explicitly marked incomplete in story spec.
- W3: Task 7.3/7.4 manual mobile-sized walkthrough and light/dark contrast verification not completed. Acknowledged in story completion notes.
- W4: No regression tests for shared `Input` min-height change (`h-9` → `min-h-11`) or `Button` size contract changes. Task 6.1 says to add tests if changes are material.
- W5: No reduced-motion regression tests for `motion-reduce:animate-none` additions to dialog, sheet, and tooltip. Motion behavior is hard to test in JSDOM; manual verification is more appropriate.

## Deferred from: code review of 1-4-retired-homepage-component-cleanup (2026-04-12)

- 4 component files are now orphaned dead code with zero imports: `ChatBubble.tsx`, `MessageGroup.tsx`, `HoroscopeVsPortraitComparison.tsx`, `RelationshipCta.tsx` in `apps/front/src/components/home/`. Intentionally preserved per story spec's DO-NOT-DELETE list — these components are needed for the Epic 9 split-layout homepage redesign.

## Deferred from: code review of 2-4-portrait-retry-with-exponential-backoff (2026-04-12)

- Successful retry transitions user out of portrait view with no generating indicator — when retry succeeds and status goes to "generating", the `view=portrait` branch falls through to ProfileView because neither "failed" nor "fullContent" matches. Pre-existing UX flow, not introduced by this change.

## Deferred from: code review of 10-1-three-lifecycle-email-templates (2026-04-12)

- Entitlement exclusion only checks `extended_conversation_unlocked` purchase events — when additional purchase types are added, the eligibility query in `lifecycle-email.drizzle.repository.ts` will need to include them
- `thresholdDays` / `thresholdHours` config values accept 0 or negative — no validation at config level; 0 would make all users immediately eligible. Pre-existing pattern across all lifecycle email threshold configs.
- Hardcoded engagement thresholds (>= 3 return visits OR >= 1 relationship letter) embedded in raw SQL in `lifecycle-email.drizzle.repository.ts:109-112` — not configurable, requires code change to adjust
- `Effect.tap` callbacks in all three lifecycle use-cases mutate `emailsSent++` via closure — correct in current sequential for-loop but would race under concurrent `Effect.forEach`

## Deferred from: code review of 9-2-dynamic-hook-with-animated-gradient (2026-04-13)

- Orphaned homepage components (`ChatInputBar.tsx`, `DepthMeter.tsx`, `FinalCta.tsx`, `HeroSection.tsx`, `HowItWorks.tsx`) no longer imported from `apps/front/src/routes/index.tsx` after homepage redesign. Still on disk as dead code. Should be cleaned up in a follow-up cleanup story.

## Deferred from: code review of 10-2-relationship-letter-ready-notification (2026-04-13)

- W1: Use-case imports directly from `@workspace/infrastructure` — `send-relationship-analysis-notification.use-case.ts` imports `buildRelationshipLetterReadySubject` and `renderRelationshipAnalysisReadyEmail` from `@workspace/infrastructure/email-templates/relationship-analysis-ready`, bypassing the hexagonal boundary. Pre-existing from Story 35-5, widened by this change.

## Deferred from: code review of 1-2-dashboard-retirement-and-nav-cleanup (2026-04-13)

- No E2E test for unauthenticated user hitting `/dashboard` — redirect chain `/dashboard` → `/today` → `/login` is untested. Pre-existing gap; `/today` has its own auth guard and unauth tests cover other routes.
- New MDX devDependencies (`@mdx-js/rollup`, `remark-frontmatter`, `remark-mdx-frontmatter`) added to `apps/front` lockfile — unrelated to story 1-2 scope, likely from concurrent work in the same worktree.
- `apps/front/src/hooks/use-auth.ts:37` JSDoc `@example` still references `<Dashboard user={user} />` — stale illustrative pseudocode, file was not touched in this story.

## Deferred from: code review of 2-2-portrait-reading-generating-state-with-nerin-voice (2026-04-13)

- Status "ready" with null/empty content falls through to generating state [`$conversationSessionId.tsx`:402] — backend `deriveStatus` prevents this via truthiness check on `portrait?.content`, but frontend has no defensive guard. Unlikely to manifest unless backend logic changes.
- Retry mutation race — polling may not restart if backend hasn't transitioned [`$conversationSessionId.tsx`:114-128] — if backend returns "failed" before state update propagates after retry, single refetch keeps "failed" status and polling stays stopped.
- Failed state "Back to your profile" uses `<button>` + `navigate()` instead of `<Link>` [`$conversationSessionId.tsx`:386-393] — violates CLAUDE.md navigation rule. Pre-existing from Story 2.4.

## Deferred from: code review of 12-1-knowledge-library-architecture-and-first-10-pages (2026-04-13)

- W1: `SITE_ORIGIN` (`import.meta.env.VITE_APP_URL`) evaluated at Vite build time — canonical URLs and JSON-LD are baked into the SSR output. Multi-env deploy from same artifact gets wrong origins. Pre-existing pattern used project-wide.
- W2: Sitemap script is `build-sitemap.mjs` (plain JS) instead of `build-sitemap.ts` as specified in spec file map. Functional but deviates from spec. Workaround from offline workspace environment.
- W3: `LibraryNav` tier pills all link to `/library` regardless of tier — no tier index routes exist yet. Will need updating when tier-specific listing routes are created.

## Deferred from: code review of 3-1-me-page-route-and-section-layout (2026-04-13)

- `archived` session status falls through to `/chat` redirect in `/me` route's `beforeLoad` — user with only archived sessions is redirected as if no assessment exists. No archived sessions in production yet; handle when archive feature is built.
- Pre-existing `overallConfidence * 100` bug in `ArchetypeHeroSection.tsx:177` — does `Math.round(overallConfidence * 100)` but the API returns 0-100 scale (contracts test uses `68`, backend unit test expects `60`). Would display "6800% confidence" with real data. Frontend tests mask this by using 0-1 scale mocks (`0.82`, `0.78`). Not caused by this change.
- BottomNav "Me" active tab not tested (AC6) — BottomNav mock is a stub rendering `<div data-testid="bottom-nav-root" />` with no tabs. AC6 requires "Me" tab as active but this cannot be verified through current test setup. Pre-existing from Story 1.1.

## Deferred from: code review of 4-1-daily-check-in-data-model-and-api (2026-04-14)

- `toDatabaseError` swallows original error cause — logs the error message but does not attach it as `cause` to the returned `DatabaseError`. Follows existing repo pattern (`conversation.drizzle.repository.ts`). Pre-existing pattern.
- No `updatedAt` column on `daily_check_ins` — after upsert update, `createdAt` still reflects first insert. No way to know when a record was last modified. Schema design decision not required by spec.
- No test coverage for `getTodayWeekGrid` ISO week parsing logic — complex date arithmetic (W53, year boundaries) has no unit tests. Story AC only requires submit/upsert tests (Task 6.2).
- `note` field has no length constraint in contract schema or DB column — accepts arbitrarily large strings. General system boundary concern, not unique to this story.

## Deferred from: code review of story-3.3 (2026-04-14)

- 4-letter `oceanCode` in `archetype-card-template.tsx` renders fallback circle for 5th (neuroticism) shape — `oceanCode: string` prop accepts any length, and `oceanLetters[4]` is `undefined` for 4-char codes, triggering the fallback. Pre-existing: slicing logic and untyped prop pre-date this change.

## Deferred from: code review of story-2.5 (2026-04-14)

- `/today` route `beforeLoad` has no error handling for `fetchFirstVisitState()` failure — if the API is unreachable (offline, server down, 500), the unhandled exception blocks route navigation entirely and renders an error boundary instead of the Today page. A try/catch with fail-open default (assume `firstVisitCompleted: true`) would prevent a network hiccup from blocking access. Pre-existing, not introduced by Story 2.5.
- Timezone handling for schedule timestamp — `getFirstDailyPromptSchedule` uses `setHours(19)` in user's local timezone, serialized to UTC, stored in timezone-less `timestamp` column. Accepted for MVP: stored UTC instant captures intended local 7 PM. Defer timezone-aware scheduling to future notification scheduler story.

## Deferred from: code review of 4-2-checkinform-component (2026-04-14)

- `hasCheckInRecord` type guard fragile — uses `"id" in value` only; if `CheckInNotFoundResponse` ever gains an `id` field, the form will be permanently hidden
- No `data-testid` on interactive elements (mood buttons, note, save) — can be added when E2E tests are written; story spec says no E2E
- `localDate` stale past midnight — `getTodayLocalDate()` evaluated once at hook-call time; user keeping page open past midnight submits previous day's date. Needs design decision about clock-refresh mechanism
- `FieldLabel asChild` with `<div>` child loses `<label>` semantics for the mood group — a11y improvement, not a regression
- Mood buttons lack `role="radiogroup"` and arrow-key navigation pattern — a11y enhancement for keyboard-only users
- `CheckInFormSkeleton` has `aria-busy` but no accessible name — minor a11y improvement, skeleton is temporary loading state
