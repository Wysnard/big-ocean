# Story 5.3: Weekly Letter Inline Card & Notifications

Status: done

<!-- Ultimate context engine analysis completed — comprehensive developer guide created. -->

## Story

As a user on the Today page on Sunday,

I want to see that my weekly letter is ready and be nudged on other channels if I am not in the app,

So that I can tap through to read Nerin’s letter without hunting for it.

## Acceptance Criteria

1. **Given** it is **Sunday** in the user’s **local calendar** and a weekly summary **has been generated** for the **current ISO week** (row in `weekly_summaries` with non-null `content` and `generated_at` for that user/week — same eligibility rules as Stories 5.1–5.2: users with **≥3** check-ins in that week; users with **0–2** check-ins get **no** summary, **no** card, **no** notifications, **no** shame copy)

   **When** `/today` renders in the **post-check-in** state (`CheckInSavedState`)

   **Then** a **`WeeklyLetterCard`** appears **above** the journal content (top of the card column), headline copy: **"Your week with Nerin is ready"** (exact product string unless UX asks for punctuation-only tweaks)

   **And** the whole card (or a clear primary control within it) is a **TanStack Router** `<Link>` to **`/today/week/$weekId`** where `$weekId` matches **`getWeekIdForLocalDate(localDate)`** from `apps/front/src/hooks/use-today-check-in.ts` (must stay aligned with `GET /api/today/week?weekId=` and `GET /api/today/week/:weekId/letter`)

   **And** the card **replaces** the **`QuietAnticipationLine`** slot on Sundays when the letter exists — today `QuietAnticipationLine` already returns `null` on Sunday (`QuietAnticipationLine.tsx`); do **not** render both the anticipation line and the weekly card for the same week

2. **Given** it is **not** Sunday **or** no generated letter exists for the current week

   **When** `/today` renders post-check-in

   **Then** **no** `WeeklyLetterCard` is shown (Mon–Sat continue to use `QuietAnticipationLine` per Epic 4 / `FR68a` anticipation pattern)

3. **Given** a qualifying user’s letter was **just generated** by the batch pipeline (`generateWeeklySummariesForWeek` / cron)

   **When** generation **persists** successful content to `weekly_summaries`

   **Then** the system sends a **push notification** at generation time: title/body consistent with product copy — **"Your week with Nerin is ready."** (align title/body split with existing notification patterns; keep copy in one place for web push + any email)

   **And** notification deep-link **`url`** should open **`{frontendUrl}/today/week/{weekId}`** (use `AppConfig.frontendUrl` like relationship-letter notifications)

4. **Given** the user **does not** receive the push (no subscription, denied permission, expired endpoints, push unavailable)

   **When** generation completes

   **Then** an **email fallback** is sent via **`ResendEmailRepository`** (existing Resend + React Email stack per `ADR-12`), using a **dedupe key** per user/week so retries/cron re-runs do not spam (mirror `send-relationship-analysis-notification` idempotency discipline)

5. **Given** quality gates

   **When** `pnpm typecheck` and `pnpm test:run` run

   **Then** they pass, including tests for notification use-case (mocked email + push repos) and **frontend unit tests** for `WeeklyLetterCard` visibility rules

## Tasks / Subtasks

- [x] **Task 1 — Data for “letter ready” on Today (AC: #1–#2)**  
  - [x] Chose **option B:** extended `WeekGridResponse` with `weeklyLetter: { status: "ready" | "none"; generatedAt? }` on existing `GET /api/today/week` (no extra round trip).  
  - [x] `getTodayWeekGrid` loads summary via **`WeeklySummaryRepository.getByWeekId`**.  
  - [x] Contracts in `packages/contracts/src/http/groups/today.ts`; front consumes via existing **`getWeekGrid`** / TanStack Query (unchanged hook shape).

- [x] **Task 2 — `WeeklyLetterCard` UI (AC: #1–#2)**  
  - [x] Added `WeeklyLetterCard.tsx` + wired **`CheckInSavedState`** above `<JournalEntry />`.  
  - [x] Sunday + `weeklyLetter.status === "ready"` gating; **`<Link>`** to `/today/week/$weekId`.  
  - [x] `data-testid="weekly-letter-card"`; link **`min-h-[44px]`**.

- [x] **Task 3 — Push + email on generation (AC: #3–#4)**  
  - [x] **`send-weekly-letter-ready-notification.use-case.ts`** mirrors relationship notification (push queue + web push + Resend fallback).  
  - [x] Invoked from **`generate-weekly-summary.use-case.ts`** after successful save, **fail-open** (`Effect.catchAll` + warn).  
  - [x] HTML email **`weekly-letter-ready.ts`** + shared push copy constants.  
  - [x] **`UserAccountRepository.getEmailAndNameForUser`** for recipient resolution (no notification on ineligible users — generation path unchanged).

- [x] **Task 4 — Tests**  
  - [x] API: `get-today-week.use-case.test.ts`, `send-weekly-letter-ready-notification.use-case.test.ts`, extended **`generate-weekly-summary.use-case.test.ts`**.  
  - [x] Front: **`WeeklyLetterCard.test.tsx`** (router `load()` + visibility).  
  - [x] No new e2e (per `E2E-TESTING.md` / story optional).

## Dev Notes

### Epic cross-story context

- **5.1** — `weekly_summaries`, `generateWeeklySummariesForWeek`, cron `POST /api/jobs/weekly-summaries/generate`, `MIN_CHECK_INS = 3`.  
- **5.2** — `/today/week/$weekId`, `WeeklyLetterReadingView`, `GET /api/today/week/:weekId/letter`. This story **does not** change reading layout.  
- **PRD:** `FR89` (push + email fallback + inline card on Today), `FR68a` (anticipation line Mon–Sat).  
- **`QuietAnticipationLine`** explicitly documents: *Hidden on Sunday — Epic 5 weekly letter card replaces this slot.*

### Architecture compliance

- **ADR-45 (Weekly Letter Pipeline):** Sunday 6pm local generation; Today surface surfaces readiness.  
- **ADR-12 (Email):** Resend + React Email; transactional patterns already used for lifecycle emails.  
- **Hexagonal:** Notification orchestration in **use-cases**; handlers remain thin; **do not remap** domain errors except documented fail-open resilience.  
- **Push:** Existing **VAPID** + `savePushSubscription` / `syncPushSubscription` — reuse **WebPush** stack; users opt in via existing flows (e.g. Return Seed / permission). Do **not** invent a second push stack.

### File structure (expected touchpoints)

| Area | Path |
|------|------|
| Contracts | `packages/contracts/src/http/groups/today.ts`, compose in `packages/contracts/src/http/api.ts` |
| Today handler | `apps/api/src/handlers/today.ts` |
| Weekly notification UC | `apps/api/src/use-cases/send-weekly-letter-ready-notification.use-case.ts` (suggested name) |
| Weekly generation | `apps/api/src/use-cases/generate-weekly-summary.use-case.ts` |
| Email template | `packages/infrastructure/email-templates/weekly-letter-ready/` (suggested) |
| Front card | `apps/front/src/components/today/WeeklyLetterCard.tsx` |
| Saved state | `apps/front/src/components/today/CheckInForm.tsx` (`CheckInSavedState`) |
| Today route | `apps/front/src/routes/today/index.tsx` — only if layout wrapper changes are needed (prefer keeping logic in `CheckInSavedState`) |

### Testing standards

- **API:** `@effect/vitest`, `it.effect`, repository mocks.  
- **Front:** colocate tests (`QuietAnticipationLine.test.tsx` pattern); **never** put `.test.tsx` directly under `routes/` without `-` prefix.  
- Preserve **`data-testid`** conventions (`FRONTEND.md`).

### Previous story intelligence (5.2)

- `getWeekIdForLocalDate` / `todayWeekQueryKey` already exist — reuse for `$weekId`.  
- Letter body fetch must stay on the **reading route**; Today card should use **meta** only.  
- Story 5.2 explicitly deferred **inline card + notifications** to **this** story.

### Git intelligence (patterns)

- Follow recent Today + contracts commits (weekly letter read path) for Effect + `HttpApiGroup` wiring consistency.

### Latest tech notes

- Node **>= 20**, `pnpm@10.4.1`. Reuse **web-push** + Resend patterns; no new notification vendor.

### Project context reference

- Authoritative rules: `CLAUDE.md`, `docs/FRONTEND.md`.

### Technical requirements (guardrails)

- **Navigation:** `<Link>` for card navigation; `useNavigate()` only if imperative flow is clearly required.  
- **API client:** `makeApiClient` + `Effect.runPromise` in TanStack Query — **never raw `fetch`**.  
- **Eligibility silence:** Never show “you didn’t check in enough” — **no** empty-state shame for sub-threshold users (generation already omits them).

### Architecture compliance checklist

- [x] Contracts-first HTTP surface  
- [x] Use-case owns notification branching; handler delegates  
- [x] Fail-open notification path does not block weekly generation commit

### Library / framework requirements

- **TanStack Router**, **TanStack Query**, **Effect** / **@effect/platform** HttpApi  
- **React Email** (infrastructure templates) for fallback email HTML  
- Existing **web-push** (domain `WebPushRepository`)

### Testing requirements

- Unit tests for new use-case(s) and **WeeklyLetterCard** visibility (Sunday + ready vs not).  
- Mock push + email repos; assert dedupe key format.

## Dev Agent Record

### Agent Model Used

Composer (bmad-dev-story workflow)

### Debug Log References

### Completion Notes List

- Extended **`WeekGridResponse`** with `weeklyLetter` meta; **`getTodayWeekGrid`** now requires `WeeklySummaryRepository` (already in API `RepositoryLayers`).
- **`sendWeeklyLetterReadyNotification`** uses dedupe key `weekly-letter-ready:${weekId}:${userId}`; push copy centralized in `weekly-letter-ready.ts`.
- **`UserAccountRepository`**: new **`getEmailAndNameForUser`** (Drizzle + `__mocks__` updated).

### File List

- `packages/contracts/src/http/groups/today.ts`
- `packages/domain/src/repositories/user-account.repository.ts`
- `packages/infrastructure/src/repositories/user-account.drizzle.repository.ts`
- `packages/infrastructure/src/repositories/__mocks__/user-account.drizzle.repository.ts`
- `packages/infrastructure/src/email-templates/weekly-letter-ready.ts`
- `apps/api/src/use-cases/get-today-week.use-case.ts`
- `apps/api/src/use-cases/send-weekly-letter-ready-notification.use-case.ts`
- `apps/api/src/use-cases/generate-weekly-summary.use-case.ts`
- `apps/api/src/use-cases/index.ts`
- `apps/api/src/handlers/today.ts`
- `apps/api/src/use-cases/__tests__/get-today-week.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/send-weekly-letter-ready-notification.use-case.test.ts`
- `apps/api/src/use-cases/__tests__/generate-weekly-summary.use-case.test.ts`
- `apps/front/src/components/today/WeeklyLetterCard.tsx`
- `apps/front/src/components/today/WeeklyLetterCard.test.tsx`
- `apps/front/src/components/today/CheckInForm.tsx`
- `apps/front/src/components/today/MoodDotsWeek.test.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- **2026-04-15:** Implemented Epic 5.3 — week grid weekly-letter meta, Today `WeeklyLetterCard`, weekly generation push/email notification, tests, user contact port for email.

---

**Story completion status:** done — Code review complete; all patches applied; `pnpm typecheck` and `pnpm test:run` passed.

### Review Findings

#### Decision-needed

- [x] [Review][Decision] Email fallback missing idempotency/dedupe key — **Resolved: accepted as low-risk.** Use-case is only called from `generateWeeklySummariesForWeek` which skips already-generated weeks; cron-skip guarantee is sufficient. Added clarifying comment to use-case.
- [x] [Review][Decision] Card headline `HEADLINE` duplicated from push/email copy — **Resolved: share constant.** Export product copy string from `packages/contracts` and consume from both `WeeklyLetterCard` and the email template. Converted to patch item below.

#### Patches

- [x] [Review][Patch] Share `WEEKLY_LETTER_HEADLINE` constant via `packages/contracts` and consume from `WeeklyLetterCard.tsx` and `weekly-letter-ready.ts` [`packages/contracts`, `WeeklyLetterCard.tsx`, `weekly-letter-ready.ts`]
- [x] [Review][Patch] ~~Missing `</td>` in email HTML footer~~ — **dismissed**: `</td>` was already present; Blind Hunter false positive from abbreviated diff
- [x] [Review][Patch] Mock `getEmailAndNameForUser` returns `null` for empty-string email, Drizzle repo returns `{email: ""}` — fixed: mock now returns null only when user row is absent [`packages/infrastructure/src/repositories/__mocks__/user-account.drizzle.repository.ts`]
- [x] [Review][Patch] Log message improved to "user account row not found — skipping notification" [`apps/api/src/use-cases/send-weekly-letter-ready-notification.use-case.ts`]
- [x] [Review][Patch] `WeeklyLetterMetaSchema` converted to discriminated union (`ready ⇒ generatedAt` required); `TodayWeekGrid` updated to use `WeeklyLetterMeta` type [`packages/contracts/src/http/groups/today.ts`, `get-today-week.use-case.ts`]
- [x] [Review][Patch] Notification test now asserts `pushQueueRepo.enqueue` receives correct `dedupeKey` and `url` [`apps/api/src/use-cases/__tests__/send-weekly-letter-ready-notification.use-case.test.ts`]

#### Deferred

- [x] [Review][Defer] Unbounded push concurrency (`concurrency: "unbounded"`) [`apps/api/src/use-cases/send-weekly-letter-ready-notification.use-case.ts:92`] — deferred, pre-existing pattern from relationship-analysis notification
- [x] [Review][Defer] PII (email address) logged on push failures and email delivery [`apps/api/src/use-cases/send-weekly-letter-ready-notification.use-case.ts`] — deferred, pre-existing pattern across notification use-cases
- [x] [Review][Defer] `QuietAnticipationLine` uses `new Date()` for Sunday detection while `WeeklyLetterCard` uses `localDate` prop — both show/hide consistently in practice but use different clocks [`apps/front/src/components/today/CheckInForm.tsx`] — deferred, edge case at timezone boundaries; pre-existing `QuietAnticipationLine` behavior
- [x] [Review][Defer] `letterUrl` can produce double-slash if `config.frontendUrl` has trailing slash — deferred, pre-existing pattern if shared with relationship-analysis notification
- [x] [Review][Defer] Push+email duplicate notification possible if `Effect.forEach` encounters an uncaught defect after partial push delivery — deferred, pre-existing pattern from relationship-analysis notification

### Open questions (saved for product/UX — non-blocking for dev start)

- Exact **push title vs body** split if product wants title shorter than body (keep copy centralized).  
- Whether **email fallback** should send when push **succeeds** to some devices but not all (relationship flow sends email only when **no** successful push delivery — align unless PM says otherwise).
