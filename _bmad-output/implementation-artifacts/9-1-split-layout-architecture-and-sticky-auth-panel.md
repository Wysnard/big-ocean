# Story 9.1: Split-Layout Architecture & Sticky Auth Panel

Status: done

<!-- Ultimate context refresh: 2026-04-15 — aligned to production `index.tsx` and related components. Prior narrative referenced `SplitHomepageLayout` as the live route wrapper; the homepage has since been composed with `DepthScrollProvider` + `HomepageTimeline` + `MobileHero`. -->

## Story

As a cold visitor,
I want to see a compelling homepage with the signup form always visible,
so that I can sign up whenever I'm ready without searching for a CTA.

## Acceptance Criteria (source: epics)

1. **Given** an unauthenticated user visits `/` **When** the homepage renders on desktop (≥1024px) **Then** a 60/40 split layout renders: scrollable timeline left, sticky auth panel right.

2. **Given** the sticky auth panel is visible **When** the user inspects its contents **Then** it contains: logo, dynamic hook line, **inline email + password login** (`LoginForm` embed), primary **"Start yours →"** link to `/signup` (dedicated signup page), "~30 min · Free · No credit card" tagline. *(Epic originally described a single combined form; product decision 2026-04-15: login inline, signup on `/signup`.)*

3. **Given** the user initiates signup **When** they complete the flow **Then** signup runs via Better Auth **And** on success they reach the verify-email step (ADR-24).

4. **Given** an unauthenticated user visits `/` on mobile (<1024px) **When** the homepage renders **Then** the layout stacks vertically **And** conversion CTAs are available without hunting (epic: `StickyBottomCTA` at bottom — see *Product vs codebase* below).

5. **Given** the homepage is requested **When** a crawler or user loads `/` **Then** the route remains SSR-friendly with meta tags for SEO.

---

## Product vs codebase (read this first)

| Epic expectation | Current production behavior (2026-04-15, post–product decisions) |
|------------------|------------------------------------------|
| “Email + password form” inside the sticky panel | **Login:** inline **`LoginForm` `variant="embed"`** (TanStack Form + shadcn fields). **Signup:** primary **“Start yours →”** goes to **`/signup`** (dedicated page), not inline on `/`. |
| “Dynamic hook line” in 9.1 | **`HomepageDynamicHook`** (scroll-linked copy) ships with Story **9.2** and is **already imported** in `StickyAuthPanel` and `MobileHero`. Treat hook behavior as owned by 9.2; layout/sticky shell is still 9.1 scope. |
| Mobile `StickyBottomCTA` fixed to bottom | **`StickyBottomCTA` is mounted** in `routes/index.tsx` with **`marketingOnly`** (always “Start yours” bar; session ignored on `/`). **`MobileHero`** remains for above-the-fold CTAs; left column has **`pb-24 lg:pb-0`** so content clears the fixed bar. |
| Authenticated visitors on `/` | **Marketing-only CTAs** on homepage surfaces (decision **3b**): `StickyBottomCTA` does not switch to “Continue to Nerin” on `/`; returning users use global nav. |

**Implication for dev agents:** Bugfixes or refactors for “Epic 9 homepage” must read **`index.tsx`** and **`StickyAuthPanel.tsx`** as source of truth — not only `SplitHomepageLayout.tsx`.

---

## Implementation snapshot (authoritative)

### Route composition

- **File:** `apps/front/src/routes/index.tsx`
- **Structure:** `PageMain` → **`DepthScrollProvider`** (scroll-linked homepage phase for ≥1024px) → CSS Grid on `lg:`: left column (`pb-24 lg:pb-0`) `MobileHero` + **`HomepageTimeline`**, right column **`StickyAuthPanel`**. **`StickyBottomCTA`** (`marketingOnly`) fixed at bottom on mobile.
- **Grid:** `lg:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.95fr)]` — approximately 60/40 with a minimum right-column width; not the older `3fr_2fr` from early drafts.
- **SSR:** `head()` defines `title`, `description`, `og:title`, `og:description`.

### Sticky auth panel (desktop)

- **File:** `apps/front/src/components/home/StickyAuthPanel.tsx`
- **Behavior:** `hidden lg:block`; **`sticky top-14`** under global header; card UI with logo (`big-` + `OceanHieroglyphSet`), **`HomepageDynamicHook`**, supporting copy, primary **Link** to `/signup`, embedded **`LoginForm variant="embed"`** (Better Auth sign-in), tagline.
- **Phase:** `useHomepagePhase()` from `DepthScrollProvider` sets `data-phase` for styling/testing.

### Timeline (left column)

- **File:** `apps/front/src/components/home/HomepageTimeline.tsx`
- **Behavior:** Full-height sections with `data-homepage-phase` attributes; content implements Epic **9.3**-style artifacts (conversation / portrait / world-after phases). Intersects with **`DepthScrollProvider`** for phase resolution on desktop.

### Mobile hero

- **File:** `apps/front/src/components/home/MobileHero.tsx`
- **`lg:hidden`** band at top: brand, **`HomepageDynamicHook`** (`phase="conversation"` compact), signup/login links, tagline.

### Scroll / phase infrastructure

- **Files:** `DepthScrollProvider.tsx`, `homepage-phase-config.ts`
- **Role:** Drives `currentPhase` from scroll position (desktop). Required by **`StickyAuthPanel`** and **9.2** hook.

### Legacy / alternate building blocks (still in repo)

These were part of an earlier composition and remain for tests and possible reuse; **they are not the current `index` tree:**

| Component | Notes |
|-----------|--------|
| `SplitHomepageLayout.tsx` | Grid shell with timeline/auth/bottom CTA slots — **unit-tested**, not used by `index.tsx`. |
| `TimelinePlaceholder.tsx` | Older left-pane placeholder — **tests only** from a routing perspective. |
| `HomepageSignupForm.tsx` | Inline signup — **not** wired to `/` in current route; signup is via `/signup`. |
| `StickyBottomCTA.tsx` | Mounted on **`/`** with **`marketingOnly`** (see route file). |

---

## Architecture compliance

- **ADR-15:** `/` stays a public landing surface; conversation is auth-gated elsewhere (`/chat`).
- **ADR-24:** Email verification after signup — flow completes on `/signup` + verify-email, not necessarily inside the sticky panel.
- **Navigation:** Internal routes use TanStack Router **`<Link>`** with required `search` for `/login` and `/signup` (see `StickyAuthPanel`, `MobileHero`).
- **Forms:** If reintroducing an inline signup on `/`, use **`@tanstack/react-form`** + shadcn field components (see `apps/front/src/components/auth/signup-form.tsx`). Current production defers form to `/signup`.
- **Data attributes:** Preserve existing **`data-testid`**; do not rename/remove for e2e. New UI continues **`data-slot`** pattern per `docs/FRONTEND.md`.
- **No raw `fetch` for API** on this story — homepage conversion is routing + presentation.

---

## Technical requirements

- **Breakpoints:** Match epic: split at **1024px (`lg:`)**; mobile-first stacking below.
- **Sticky panel:** Epic: `position: sticky; top: 0; height: 100vh` — production uses sticky column with **`top-0`** and **`h-screen`** inside the right grid cell; header offset may differ from older `top-[3.5rem]` drafts — verify visual acceptance against design.
- **OCEAN shapes:** Five distinct shapes with staggered breathe animation (trait-colored).
- **Accessibility:** `StickyAuthPanel` uses `<aside aria-label="Sign up or log in">`; keep landmarks coherent when editing.

---

## Library and framework notes

- **TanStack Router:** `createFileRoute`, `Link`, `head()` meta.
- **@workspace/ui:** `OceanHieroglyphSet`, shared buttons/spinner if inline forms return.
- **Framer Motion / motion:** Used by **9.2** (`HomepageDynamicHook`); not a 9.1-only dependency but present in the same panel.

---

## File structure (current vs optional)

**Production-critical**

- `apps/front/src/routes/index.tsx`
- `apps/front/src/components/home/StickyAuthPanel.tsx`
- `apps/front/src/components/home/HomepageTimeline.tsx`
- `apps/front/src/components/home/MobileHero.tsx`
- `apps/front/src/components/home/DepthScrollProvider.tsx`
- `apps/front/src/components/home/homepage-phase-config.ts`
- `apps/front/src/components/home/HomepageDynamicHook.tsx` (9.2, coupled)
- `apps/front/src/components/home/StickyBottomCTA.tsx` — used on **`/`** with `marketingOnly`
- `apps/front/src/components/auth/login-form.tsx` — **`variant="embed"`** for sticky panel

**Secondary / tests / legacy**

- `SplitHomepageLayout.tsx`, `TimelinePlaceholder.tsx`, `HomepageSignupForm.tsx` — maintain if still imported by tests; do not assume they are the live layout.

---

## Testing requirements

- **Unit tests:** Existing suites under `apps/front/src/components/home/*.test.tsx` for layout pieces — update if route composition changes.
- **Route tests:** Do not place `*.test.tsx` directly under `apps/front/src/routes/` (TanStack Router); use `-` prefix or `__tests__/`.
- **E2E:** Any new `data-testid` follows project rules; never remove existing ids used by Playwright.

---

## Previous story intelligence

- **Within Epic 9:** This is **9-1** — no prior story in the same epic.
- **Upstream:** Epic 8 and three-space nav (Epic 1) established global shells; homepage lives under the same **`PageMain`** and marketing meta patterns.

---

## Git intelligence (recent patterns)

- Homepage work has been **incremental:** layout shell → timeline content → dynamic hook. Small, focused commits per component; prefer same style for fixes.

---

## Latest tech notes (2026)

- TanStack Start SSR `head()` meta remains the standard for SEO on `/`.
- Prefer **CSS + `motion-safe:`** for animation respect over raw always-on motion.

---

## Project context reference

- No repo-root `project-context.md` found; rely on **`CLAUDE.md`**, **`docs/FRONTEND.md`**, and **`_bmad-output/planning-artifacts/architecture.md`** (ADR-15, ADR-24, frontend structure).

---

## Tasks / Subtasks

- [x] Task 1: Split-layout homepage shell (AC: #1)
  - [x] 1.1 CSS Grid on `lg:` with ~60/40 proportions (`StickyAuthPanel` right, `HomepageTimeline` left)
  - [x] 1.2 Desktop: sticky auth panel (`sticky top-0 h-screen`); hidden on mobile (`hidden lg:block`)
  - [x] 1.3 Mobile: single-column stacking with `MobileHero` above-the-fold

- [x] Task 2: Sticky auth panel contents (AC: #2)
  - [x] 2.1 Logo (`big-` + `OceanHieroglyphSet`)
  - [x] 2.2 Dynamic hook line placeholder (static text for 9.1; 9.2 replaced with `HomepageDynamicHook`)
  - [x] 2.3 Primary "Start yours →" (Link to `/signup`); inline **`LoginForm` `variant="embed"`** for log in (dedicated `/signup` for registration)
  - [x] 2.4 Tagline: "~30 min · Free · No credit card"
  - [x] 2.5 5 OCEAN breathing shapes with staggered `breathe` animation and trait colors

- [x] Task 3: Signup conversion flow (AC: #3)
  - [x] 3.1 "Start yours →" navigates to `/signup` where Better Auth signup form lives
  - [x] 3.2 Signup form triggers `signUp.email()` → redirect to `/verify-email`

- [x] Task 4: Mobile conversion surface (AC: #4)
  - [x] 4.1 `MobileHero` component (`lg:hidden`) with brand, hook, signup/login CTAs, tagline
  - [x] 4.2 `StickyBottomCTA` mounted on `/` with `marketingOnly` + `pb-24` on mobile column; `MobileHero` retained

- [x] Task 5: SSR + SEO meta tags (AC: #5)
  - [x] 5.1 `head()` function with `title`, `description`, `og:title`, `og:description`
  - [x] 5.2 Route at `/` via `createFileRoute("/")`

- [x] Task 6: Fix broken test files (post-review maintenance)
  - [x] 6.1 Add `// @vitest-environment jsdom` to 5 homepage test files missing the directive
  - [x] 6.2 Verify all 51 homepage tests pass, no regressions in full suite

### Review Findings (AI code review, 2026-04-15)

**Review scope:** Working-tree diff (`git diff HEAD`) is only the five `// @vitest-environment jsdom` lines in `*.test.tsx` — **Blind Hunter** had no issues on that diff. **Edge Case Hunter** and **Acceptance Auditor** evaluated current production files listed in this story (`index.tsx`, `StickyAuthPanel.tsx`, `MobileHero.tsx`, `DepthScrollProvider.tsx`, `HomepageTimeline.tsx`, route `head()`) against `epics.md` Story 9.1 and this spec.

**decision-needed** — **Resolved 2026-04-15**

- [x] [Review][Decision] **AC2 — Inline signup vs `/signup` route** — **Hybrid:** **(B)** inline **login** in the sticky panel (`LoginForm` embed); **signup stays on dedicated `/signup`** (primary “Start yours →”). Story AC updated above.

- [x] [Review][Decision] **AC4 — `StickyBottomCTA` vs `MobileHero` only** — **(A)** Mount `StickyBottomCTA` on `/` with bottom spacing (`pb-24` on mobile column). **`marketingOnly`** pairs with **3b** so the bar does not switch to “Continue to Nerin” on `/`.

- [x] [Review][Decision] **Authenticated visitors on `/`** — **(B)** Marketing-only CTAs on homepage; returning users use global nav. Implemented via `StickyBottomCTA` **`marketingOnly`** on `/`.

**patch**

- (none blocking — product decisions implemented 2026-04-15; optional follow-up: mirror `HomepageDynamicHook` reduced-motion tests if a11y regressions are reported.)

**defer**

- [x] [Review][Defer] **Unused layout primitives** — `SplitHomepageLayout`, `TimelinePlaceholder`, and route-detached `HomepageSignupForm` remain in the tree for unit tests / reuse; live route uses `DepthScrollProvider` + grid in `index.tsx` — deferred, pre-existing; tracked in *Legacy / alternate building blocks* above.

- [x] [Review][Defer] **`DepthScrollProvider` scroll metrics** — `scrollPercent` uses `document.body.scrollHeight`; very tall lazy-loaded media could shift phase thresholds slightly on first paint — low risk; monitor if reported.

---

## Dev Agent Record

### Agent Model Used

Story context refreshed via create-story workflow — 2026-04-15.
Dev-story maintenance pass — 2026-04-15.

### Completion Notes List

- **2026-04-15 (code review):** BMad code-review workflow — three layers (Blind Hunter on diff-only; Edge + Acceptance on production files vs spec). Findings: 3 **decision-needed**, 0 **patch**, 2 **defer**, 0 dismissed. Details in **Review Findings** above. Deferred bullets appended to `_bmad-output/implementation-artifacts/deferred-work.md`.
- **2026-04-12:** Initial implementation — split-layout homepage with `StickyAuthPanel`, `MobileHero`, `HomepageTimeline`, `StickyBottomCTA`, `HomepageSignupForm`, `SplitHomepageLayout`, `TimelinePlaceholder`. 5 new components + 5 test files.
- **2026-04-15 (create-story):** Reconciled story doc with production state — `DepthScrollProvider`, `HomepageTimeline`, `MobileHero`, CTA-to-`/signup` pattern, 9.2 hook coupling, `SplitHomepageLayout` not used in route.
- **2026-04-15 (dev-story):** Fixed 5 broken test files missing `// @vitest-environment jsdom` directive (`SplitHomepageLayout.test.tsx`, `StickyAuthPanel.test.tsx`, `HomepageSignupForm.test.tsx`, `StickyBottomCTA.test.tsx`, `TimelinePlaceholder.test.tsx`). All 51 homepage tests pass; full monorepo suite later verified green (see re-run below).
- **2026-04-15 (dev-story, re-run):** Invoked `/bmad-dev-story` for `9-1` — no open Tasks/Subtasks; implementation work already complete. Full monorepo `pnpm test:run` (turbo) **passed** (e.g. front 505 tests). Story remains **`review`**; three **decision-needed** items in Review Findings are product/epic choices (inline signup vs `/signup`, `StickyBottomCTA` mount, auth-aware CTAs), not unimplemented dev tasks.
- **2026-04-15 (product decisions → code):** **1:** Inline **`LoginForm` `variant="embed"`** in `StickyAuthPanel`; signup remains **`/signup`**. **2a:** **`StickyBottomCTA`** mounted on `/` with **`marketingOnly`** + mobile **`pb-24`**. **3b:** Homepage stays marketing-only (no session-based “Continue to Nerin” on `/`). Front `pnpm test` **508** passed after changes.
- **AC validation (2026-04-15, updated):** AC1 PASS, AC2 PASS (aligned to hybrid login + dedicated signup), AC3 PASS, AC4 PASS (`StickyBottomCTA` + `MobileHero`), AC5 PASS.

### File List

**Production files (from prior implementation):**
- `apps/front/src/routes/index.tsx`
- `apps/front/src/components/home/StickyAuthPanel.tsx`
- `apps/front/src/components/home/HomepageTimeline.tsx`
- `apps/front/src/components/home/MobileHero.tsx`
- `apps/front/src/components/home/DepthScrollProvider.tsx`
- `apps/front/src/components/home/HomepageDynamicHook.tsx`
- `apps/front/src/components/home/homepage-phase-config.ts`
- `apps/front/src/components/home/SplitHomepageLayout.tsx`
- `apps/front/src/components/home/HomepageSignupForm.tsx`
- `apps/front/src/components/home/StickyBottomCTA.tsx`
- `apps/front/src/components/home/TimelinePlaceholder.tsx`

**Modified (test fix + product decisions 2026-04-15):**
- `apps/front/src/components/auth/login-form.tsx` — `variant` **`page` | `embed`**
- `apps/front/src/components/auth/login-form.test.tsx` — embed variant test
- `apps/front/src/components/home/StickyAuthPanel.tsx` — embedded login form
- `apps/front/src/components/home/StickyAuthPanel.test.tsx` — mocks + embed assertions
- `apps/front/src/components/home/StickyBottomCTA.tsx` — **`marketingOnly`**
- `apps/front/src/components/home/StickyBottomCTA.test.tsx` — **`marketingOnly`** cases
- `apps/front/src/routes/index.tsx` — **`StickyBottomCTA`**, **`pb-24`**
- `apps/front/src/components/home/SplitHomepageLayout.test.tsx` — added `// @vitest-environment jsdom`
- `apps/front/src/components/home/HomepageSignupForm.test.tsx` — added `// @vitest-environment jsdom`
- `apps/front/src/components/home/TimelinePlaceholder.test.tsx` — added `// @vitest-environment jsdom`

### Debug Log References

- TanStack Router `Link` to `/login` and `/signup` requires `search` params — use `sessionId` / `redirectTo` as `undefined` when not needed.
- Root `vitest.config.ts` uses `environment: "node"` — all component test files MUST include `// @vitest-environment jsdom` at line 1 to override.

---

## References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 9, Story 9.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — ADR-15, ADR-24, frontend tree]
- [Source: docs/FRONTEND.md — data attributes, patterns]
- [Source: apps/front/src/routes/index.tsx — live route composition]

---

## Change Log

- **2026-04-12:** Initial Story 9.1 implementation — split-layout homepage, sticky auth panel, mobile hero, timeline, 5 components + 5 test files.
- **2026-04-15:** Fixed 5 test files missing `// @vitest-environment jsdom` (all 51 tests now pass). Reconciled story doc with production codebase. AC validation documented.
- **2026-04-15:** Adversarial code review (Blind Hunter / Edge Case Hunter / Acceptance Auditor) — Review Findings section added; 3 product decisions pending.
- **2026-04-15:** Dev-story workflow re-run — validation only; full `pnpm test:run` green.
- **2026-04-15:** Product decisions (login embed + dedicated signup, mount bottom CTA, marketing-only `/`) implemented; story status **`done`**.

---

## Story completion status

- **BMad create-story analysis:** Completed — comprehensive developer guide updated for **as-built** homepage (2026-04-15).
- **Sprint file:** `9-1-split-layout-architecture-and-sticky-auth-panel` set to **`done`** in `sprint-status.yaml` after product decisions shipped (2026-04-15).
