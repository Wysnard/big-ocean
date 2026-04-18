# Deferred Work

## Deferred from: code review of 12-3-knowledge-library-article-page-layout-ux-spec.md (2026-04-18)

- ~~**Lighthouse SEO spot-check on `/library/trait/*`, `/library/facet/*`, `/library/archetype/*` after the layout refactor** — Story 12.1/12.2 standard >90; not evidenced in-repo. Run manually before release.~~ **Resolved 2026-04-18:** `lighthouse@12.8.2` (SEO category only, headless) against local dev `http://127.0.0.1:3000` — `/library/trait/openness`, `/library/facet/imagination`, `/library/archetype/beacon-personality-archetype` each scored **100** (no failing SEO audits in the run).

## Deferred from: code review of 13-2-conversation-and-chat-accessibility.md (2026-04-16)

- **`<nav>` element hosts `role="progressbar"` — semantic element/role mismatch** — `DepthMeter` wraps the sidebar progress bar in a `<nav>` element whose native implicit role (`navigation`) is overridden by `role="progressbar"`. Pre-existing before Story 13.2. Consider replacing `<nav>` with a `<div>` or `<span>` host in a future cleanup pass. [`apps/front/src/components/chat/DepthMeter.tsx`]
- **`opacity: 0` does not remove progressbar from accessibility tree at turn 0** — When conversation starts (`progress <= 0.02`), the sidebar nav has `opacity: 0` but remains in the AT, advertising an invisible "Conversation depth" progressbar to screen readers on wide viewports. Pre-existing. Fix by guarding with `aria-hidden={progress <= 0.02}` on the nav when it is fully invisible. [`apps/front/src/components/chat/DepthMeter.tsx`]
- **`aria-valuenow` may exceed `aria-valuemax` in extended sessions** — `conversationDepthProgressAriaProps` passes `currentTurn` raw; if `currentTurn > totalTurns` (extended conversation), ARIA validity is violated. Pre-existing; visual bar already clamps with `Math.min`. Fix by also clamping `aria-valuenow`: `Math.min(currentTurn, totalTurns)`. [`apps/front/src/components/chat/DepthMeter.tsx`]

## Deferred from: code review of 12-2-knowledge-library-content-expansion.md (2026-04-16)

- ~~**Lighthouse SEO on facet URLs (AC #6)** — No Lighthouse report or recorded scores in-repo for a sample of `/library/facet/*` pages. Run manual or CI Lighthouse (SEO category) before release to confirm >90 remains true for the new tier.~~ **Resolved 2026-04-16:** Manual `lighthouse@12.8.2` (SEO-only, desktop) on local Nitro preview — `imagination`, `activity_level`, `vulnerability` facet pages scored **100** each; JSON-LD present in HTML.

## Deferred from: code review of 9-4-reassurance-section-and-fear-addressing-cards.md (2026-04-16)

- **`HomepageReassurancePlaceholder` naming** — File and export still say “Placeholder” though the section is fully implemented. Rename to `HomepageReassuranceSection` (or add a clear re-export alias) when convenient to reduce onboarding confusion. [`apps/front/src/components/home/HomepageReassurancePlaceholder.tsx`]

## Deferred from: code review of 8-3-conversation-extension-activation.md (2026-04-16)

- **Portrait reading view omits extension CTA** — `view=portrait` with available portrait returns `PortraitReadingView` only; extension strip is injected on `ProfileView` after `ArchetypeHeroSection`. Matches spec placement on profile results; product may later want a secondary entry to extend from immersive portrait. [`apps/front/src/routes/results/$conversationSessionId.tsx`]

## Deferred from: code review of 5-3-weekly-letter-inline-card-and-notifications (2026-04-15)

- **Unbounded push concurrency** — `sendWeeklyLetterReadyNotification` uses `concurrency: "unbounded"` for `Effect.forEach` over push subscriptions. Mirrors existing `send-relationship-analysis-notification` pattern. Low risk in practice (few subs per user) but a spike risk at scale.
- **PII in logs** — Email address logged on push failures, success, and error paths. Pre-existing pattern across all notification use-cases. Consider hashing or redacting in a future logging hygiene pass.
- **QuietAnticipationLine / WeeklyLetterCard use different clocks for Sunday** — `QuietAnticipationLine` uses `new Date()` while `WeeklyLetterCard` uses the `localDate` prop. Pre-existing `QuietAnticipationLine` behavior; only matters at timezone boundaries right at midnight.
- **`letterUrl` double-slash if `frontendUrl` has trailing slash** — `\`${config.frontendUrl}/today/week/${weekId}\`` produces `//` if env var is configured with trailing slash. Same pattern as relationship-analysis notification; fix centrally in a config normalization pass.
- **Push+email duplicate on uncaught Effect defect in `forEach`** — If a push subscription throws an error type not covered by `catchTags`, the outer `catchAll` returns `pushDelivered = false` and email fallback runs even if some subscriptions were notified. Pre-existing pattern from relationship-analysis; low probability in production.


## Deferred from: code review of 3-5-subscription-pitch-section.md (2026-04-15)

- Subscribed users still see the pitch and checkout CTA until Epic 8 adds subscription lifecycle events and a subscriber-facing summary
- `extended-conversation` checkout slug is a stopgap; Epic 8 should align the slug and Polar product with the €9.99/mo subscription model (FR47)
- Story markdown AC/tasks still describe the superseded capability-based approach; refresh the story file when convenient — not a runtime defect

## Deferred from: code review of 9-1-split-layout-architecture-and-sticky-auth-panel.md (2026-04-15)

- Unused `SplitHomepageLayout` / `TimelinePlaceholder` / unwired `HomepageSignupForm` kept for tests and potential reuse; production homepage uses `DepthScrollProvider` + inline grid in `index.tsx`
- `DepthScrollProvider` phase/scroll percent tied to `document.body.scrollHeight` — edge case if above-the-fold images change layout height after load; acceptable unless UX reports phase flicker

## Deferred from: code review of 3-4-your-public-face-section.md (2026-04-15)

- `ArchetypeShareCard` on `/me` triggers PNG generation on section mount; consider lazy-loading or intersection observer if Me page LCP or main-thread cost becomes an issue

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

## Deferred from: code review of story-3-6 (2026-04-15)

- No `stage === "completed"` check on partner result before deriving archetype — FK set at analysis creation time always points to completed result; fail-open handles edge cases gracefully
- Redundant `getById` calls for the same `partnerResultId` across multiple analyses — memoization / batching opportunity for users with many relationships; correctness unaffected

## Deferred from: code review of 6-1-circle-page-and-person-cards (2026-04-15)

- `hasContent === true` with `contentCompletedAt === null` falls back to `createdAt` — pre-existing; rows completed before the migration will have null; fallback is intentional and tested in `circle-relationship-copy.test.ts`
- `formatLastSharedRelative` uses approximate 30/365-day unit constants — pre-existing Intl pattern; calendar-precise relative time would require a date library; cosmetic inaccuracy at month/year boundaries only

## Deferred from: code review of 4-4-mood-calendar-view (2026-04-16)

- `shiftYearMonth` throws raw `Error` on malformed input — edge case only reachable via corrupted local state; consider controlled fallback in future
- `YourGrowthSection` collapses loading/error/no-data into `null` — acceptable for a conditional Me section; future enhancement could add error distinction
- Auth redirect clears `redirectTo` — pre-existing pattern across all Today-space routes; users won't return to `/today/calendar` after login redirect
- Diff includes non-story-4.4 changes (weekly letter wiring, first-visit gate removal) — acknowledged in story completion notes

## Deferred from: code review of 7-1-usersummary-data-model-and-generator (2026-04-15)

- Unbounded evidence / prompt size for extension sessions — `findByUserId` returns all user evidence with no cap; prompt can exceed model context window. Pre-existing pattern across generators.
- TOCTOU race on concurrent requests — two concurrent calls can both pass the "already exists" check, causing duplicate LLM spend. Outer session lock mitigates; direct use-case call outside lock would race.
- No timeout / AbortSignal on LLM invoke — `model.invoke()` has no deadline; stall holds session lock indefinitely. Pre-existing pattern in weekly-summary and relationship generators.
- Shallow JSONB mapping trusts stored data — `mapThemes`/`mapQuotes` check for key existence but not value types. Pre-existing pattern in other Drizzle repos.
- No size caps on themes array or summary_text — schema validates structure but not size. Operational concern.
- Loss of structured error context from Anthropic — `Effect.tryPromise` catch stringifies errors, dropping status codes and request IDs. Pre-existing pattern.
- No retry/backoff for transient Anthropic failures — single LLM failure fails the entire finalization. Pre-existing across all generators.

## Deferred from: code review of 5-1-weekly-summary-data-model-and-generation-pipeline (2026-04-15)

- TOCTOU race on idempotency — concurrent requests for same weekId both proceed to LLM call before either saves; `onConflictDoUpdate` prevents duplicate rows but not duplicate LLM spend. Same pattern as relationship analysis. [`apps/api/src/use-cases/generate-weekly-summary.use-case.ts:80-81`]
- Partial facets (1–29) crash `computeTraitResults` — if assessment result has fewer than 30 facets, `computeTraitResults` accesses `undefined.score`. Same unguarded pattern as `generate-full-portrait.use-case.ts`. [`apps/api/src/use-cases/generate-weekly-summary.use-case.ts:106-114`]
- No `updated_at` column on `weekly_summaries` — upserts from failed→generated have no timestamp for the transition. [`drizzle/20260415140000_weekly_summaries/migration.sql`]
- `DatabaseError` used for input validation failures (invalid weekId) — returns 500 instead of 400. Same pattern as `get-today-week.use-case.ts`. [`apps/api/src/use-cases/generate-weekly-summary.use-case.ts:54-57`]

## Deferred from: code review of 6-2-invite-ceremony-dialog.md (2026-04-15)

- `removeQueries` with full `["inviteCeremony","qrToken","status"]` prefix is broad; harmless today with isolated prefix, but collateral risk if prefix reused. [`useInviteCeremonyQrToken.ts:42`]
- 60s poll + 55min regeneration threshold leaves a brief expired-link window under clock skew — pre-existing from `useQrDrawer`; cosmetic edge at TTL boundary only. [`useInviteCeremonyQrToken.ts:12-13`]
- `InviteCeremonyCard` teaser copy ("Circle", "Invite someone you care about", subtitle) is hardcoded — card teaser is not part of the §10.7 locked ceremony copy. [`InviteCeremonyCard.tsx`]
- Teaser `→` is `aria-hidden`; `aria-label` provides full accessible name. If UX ever removes `ChevronRight`, consider making arrow visible to AT. [`InviteCeremonyCard.tsx:28-30`]
- `presetName` propagation from `PublicProfileCTA` to dialog name input not integration-tested end-to-end — dialog's `presetName` pre-fill is covered directly in `InviteCeremonyDialog.test.tsx`. [`PublicProfileCTA.test.tsx`]
- UX §10.7 LOCKED block not in repo — exact wording compliance unverifiable from code alone. Process note: copy should be snapshotted in a fixture or test. [`invite-ceremony-copy.ts`]
- Re-entrant `openCeremony` while dialog is already open reuses live QR session without reset — production-unreachable in current nav model. [`InviteCeremonyProvider.tsx:26-29`]

## Deferred from: code review of 7-2-relationship-letter-generation-with-usersummary (2026-04-16)

- Retry loop has no termination strategy — `incrementRetryCount` with no cap, backoff, or terminal failure state. Pre-existing across all generators. [`generate-relationship-analysis.use-case.ts:90-94`]
- Asymmetric log levels for inviter vs invitee missing data — inviter = `error`, invitee = `info`. May trigger false alerts on transient delays. Pre-existing from Story 14.4. [`generate-relationship-analysis.use-case.ts:86-97`]
- Participant names hardcoded as "Person A"/"Person B" — display names not resolved from entity. Pre-existing since Story 14.4. [`generate-relationship-analysis.use-case.ts:106-109`]
- `Effect.catchAll` broader than `catchTag`-only guidance in CLAUDE.md — logs + re-fails without remapping. Pre-existing. [`generate-relationship-analysis.use-case.ts:116-125`]
- Empty/malformed UserSummary fields not validated before prompt construction — `summaryText`, `quoteBank` entries may degrade silently. Pre-existing pattern across generators. [`relationship-analysis.prompt.ts:84-100`]

## Deferred from: code review of 7-3-relationship-letter-page-living-relational-space (2026-04-16)

- **Unbounded notes per analysis (no insert cap)** — `createRelationshipSharedNote` validates body length only; no ceiling on total notes per analysis. A participant could POST unlimited notes, causing unbounded list payloads. MVP; no scalability requirement in spec. [`apps/api/src/use-cases/create-relationship-shared-note.use-case.ts:14`]
- **`isLatestVersion=true` vacuously when no completed result** — `isLatestVersion(resultId, null)` returns `true` when `getLatestByUserId` returns `null`, suppressing the "earlier chapter" banner. Pre-existing behavior from Story 36-3. [`apps/api/src/use-cases/get-relationship-analysis.use-case.ts:85`]

## Deferred from: code review of 7-3-relationship-letter-page-living-relational-space — re-run (2026-04-16)

- **`resetRelationshipSharedNoteMockStore` unused** — In-memory notes mock is not imported by any test; calling the reset helper in `beforeEach` is optional until tests adopt that layer. [`packages/infrastructure/src/repositories/__mocks__/relationship-shared-note.drizzle.repository.ts:11`]
- **E2E for ritual → letter → notes** — AC9 prefers unit/integration; full Playwright journey deferred unless QA requests it.

## Deferred from: code review of 8-2-subscription-checkout-flow.md (2026-04-16)

- **Portal `fetch` has no AbortSignal / timeout** — A hung TCP connection can leave the manage action pending until the browser gives up; same class of issue as other cookie-authenticated fetches. Defer to a cross-cutting fetch hygiene pass. [`apps/front/src/lib/polar-customer-portal.ts:10`]
