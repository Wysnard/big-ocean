# Story 3.4: Your Public Face Section

Status: done

<!-- Ultimate context engine analysis completed - comprehensive developer guide created -->

## Story

As a user on my Me page,

I want to control my public profile visibility and share my archetype card,

So that I can manage what strangers see and easily share my identity.

## Acceptance Criteria

1. **Given** the Me page Your Public Face section renders **When** the user views this section **Then** a preview of their public profile appearance is shown (archetype name, OCEAN code).
2. **And** the existing profile visibility toggle flow is integrated, including **`PublicVisibilityPrompt`** when sharing while private (same semantics as the results page share flow).
3. **And** a **Copy link** action copies the public profile URL to the clipboard with **Sonner** toast confirmation (not only inline “Copied!” text).
4. **And** the archetype card image is displayed as a preview — implementation must use the same **Satori / `ArchetypeCardTemplate`** pipeline as elsewhere (see `generateArchetypeCardPng` in `apps/front/src/lib/archetype-card.server.ts`, which already composes `ArchetypeCardTemplate`).
5. **And** a primary **Share** action uses the **Web Share API** when available, otherwise falls back to copy (reuse the established `useShareFlow` behavior from `apps/front/src/hooks/use-share-flow.ts`).
6. **And** **no** view counts, **no** sign-up attribution metrics, **no** analytics-style social proof numbers appear anywhere in this section (**Intimacy Principle** — `_bmad-output/planning-artifacts/epics.md` Epic 3 intro).

## Tasks / Subtasks

- [x] Task 1 — Section shell & route wiring (AC: 1, 6)
  - [x] 1.1 Add a dedicated component under `apps/front/src/components/me/` (e.g. `YourPublicFaceSection.tsx`) and replace the placeholder copy in `apps/front/src/routes/me/index.tsx` inside `MePageSection` for `data-testid="me-section-public-face"`.
  - [x] 1.2 Preview header: show `results.archetypeName` and OCEAN code via **`GeometricSignature`** with `size="profile"` (18px) per Story 3.3 — this is the compact identity mark for “public face” preview; do not replace `OceanHieroglyphCode` usage in Identity Hero.
  - [x] 1.3 Do **not** add a second results fetch; keep **`useGetResults(sessionId)`** as the single source of truth for `GetResultsResponse`.

- [x] Task 2 — Share state, visibility, and hooks (AC: 2, 5)
  - [x] 2.1 Mirror the **`/results/$conversationSessionId`** pattern: initialize local `shareState` from `results.publicProfileId`, `results.shareableUrl`, `results.isPublic` when all are present (see existing `useEffect` in `apps/front/src/routes/results/$conversationSessionId.tsx`).
  - [x] 2.2 Use **`useToggleVisibility`** from `apps/front/src/hooks/use-profile.ts` (Effect `HttpApiClient` + `@workspace/contracts` — **no raw `fetch`**).
  - [x] 2.3 Use **`useShareFlow`** with the same options shape as the results page: `toggleVisibility: toggleVisibility.mutateAsync`, `onShareStateChange`, `archetypeName: results.archetypeName ?? "Big Ocean"`.
  - [x] 2.4 Reuse **`PublicVisibilityPrompt`** — either by composing existing **`ShareProfileSection`** (`apps/front/src/components/results/ShareProfileSection.tsx`) or by extracting shared presentational parts; do not fork dialog behavior.

- [x] Task 3 — Copy + Sonner + share button (AC: 3, 5)
  - [x] 3.1 On successful clipboard copy (path used when Web Share is unavailable or user cancels share), call **`toast.success`** from **`sonner`** with a short confirmation; `<Toaster />` is already mounted in `apps/front/src/routes/__root.tsx`.
  - [x] 3.2 If **`ShareProfileSection`** is reused as-is, extend the flow so Me page meets the Sonner AC (e.g. optional `onCopied` callback in `useShareFlow`, or wrapper that toasts after `initiateShare` resolves to copy — avoid duplicate toasts).
  - [x] 3.3 Preserve existing **`data-testid`** values on share controls where components are shared (`share-privacy-toggle`, `share-url`, `share-copy-btn`, `share-visibility-status`, visibility prompt buttons) — **never remove or rename** `data-testid` attributes per `CLAUDE.md`.

- [x] Task 4 — Archetype card preview (AC: 4)
  - [x] 4.1 When `shareState?.publicProfileId` is available, show a card preview by reusing **`ArchetypeShareCard`** (`apps/front/src/components/sharing/archetype-share-card.tsx`) **or** a slimmer variant that still calls **`generateArchetypeCardPng`** so the visual matches OG output.
  - [x] 4.2 Layout: fit within the Me page single column (`max-width` context already established on `/me`); avoid the results grid feeling unless you intentionally simplify (card + controls only).

- [x] Task 5 — Tests (AC: all)
  - [x] 5.1 Add `apps/front/src/components/me/__tests__/YourPublicFaceSection.test.tsx` (or matching component name) — **not** under `apps/front/src/routes/me/` (TanStack Router file routing).
  - [x] 5.2 Cover: preview shows archetype name + **`data-testid="geometric-signature"`** (from `GeometricSignature`); visibility toggle + prompt wiring with mocked mutations; assert **Sonner** `toast.success` when simulating copy path if feasible (mock `sonner`).
  - [x] 5.3 Run `pnpm --filter front exec vitest run …` for the new file and ensure `pnpm typecheck` passes.

## Dev Notes

### Epic & FR context

- **Epic 3** (`_bmad-output/planning-artifacts/epics.md`): Me page identity sanctuary; this story delivers the **Your Public Face** slice (visibility, link, share, card preview).
- **FRs touched:** FR39–FR46, FR51 (public profile, visibility, OG/share surfaces — backend already exists; this is primarily **front composition** on `/me`).

### Critical guardrails

| Rule | Detail |
|------|--------|
| API client | `makeApiClient` + contracts endpoints only (`useToggleVisibility`, etc.) |
| Navigation | `<Link>` from TanStack Router for internal links; no `<a href>` for app routes |
| Intimacy Principle | No metrics, counts, or attribution UI |
| `data-testid` | Do not remove/rename existing ids on shared components |
| Loading | No duplicate `useGetResults` / parallel results queries |

### Architecture compliance

- **Hexagonal / Effect:** No new business logic in route files — keep orchestration thin; mutations stay in hooks calling use-cases via HTTP client.
- **Derive-at-read:** No new stored aggregations; results payload already includes profile fields from existing APIs.

### Library / framework requirements

- **TanStack Query:** mutations for visibility; align keys with `use-profile.ts`.
- **Sonner:** `toast` from `sonner` for copy confirmation (AC3).
- **`@workspace/ui`:** `Switch`, existing patterns from `ShareProfileSection`.

### File structure (expected touchpoints)

```
apps/front/src/routes/me/index.tsx              # Wire section + share state
apps/front/src/components/me/
  YourPublicFaceSection.tsx                     # NEW (or equivalent name)
  __tests__/YourPublicFaceSection.test.tsx      # NEW

# Likely reuse (import, maybe small prop extensions):
apps/front/src/components/results/ShareProfileSection.tsx
apps/front/src/components/results/PublicVisibilityPrompt.tsx
apps/front/src/components/sharing/archetype-share-card.tsx
apps/front/src/hooks/use-share-flow.ts
apps/front/src/hooks/use-profile.ts
packages/ui/src/components/geometric-signature.tsx
```

### Testing requirements

- Vitest + Testing Library; follow `vi` / `vi.mock` import order from `CLAUDE.md` if mocking infrastructure.
- Prefer testing the new Me component in isolation with mocked `useGetResults` data and mutation mocks.

### Previous story intelligence (3.3)

From `_bmad-output/implementation-artifacts/3-3-geometricsignature-component.md`:

- **`GeometricSignature`** is **Satori-safe**, uses `data-testid="geometric-signature"`, `size` presets include **`profile`** (18px) for this preview.
- **`IdentityHeroSection`** already includes **`OceanHieroglyphCode`** and **`GeometricSignature`** — Public Face preview should use **`GeometricSignature`** at **`profile`** size for consistency with epics / cross-story notes, not duplicate hero styling.
- **`ArchetypeCardTemplate`** is used for PNG/OG via **`archetype-card.server.ts`** — **ArchetypeShareCard** already proves this path.

### Git intelligence (recent)

Recent commits are general churn; no conflicting Me-page refactor. Implement against current `main` patterns in `results/$conversationSessionId.tsx`.

### Latest tech notes

- **Web Share API:** `navigator.share` optional; `useShareFlow` already handles fallback to clipboard.
- **Sonner:** Already a dependency via `@workspace/ui/components/sonner` in root layout.

### Project context reference

- `CLAUDE.md` — Frontend API client, `data-testid` rules, route test file placement.
- `docs/FRONTEND.md` — Styling and layout patterns for Me page sections.
- `apps/front/src/components/me/MePageSection.tsx` — Section wrapper / landmark patterns.

## Dev Agent Record

### Agent Model Used

GPT-5.4

### Debug Log References

- `pnpm --filter front exec vitest run src/components/me/__tests__/YourPublicFaceSection.test.tsx src/hooks/use-share-flow.test.ts src/components/results/ShareProfileSection.test.tsx`
- `pnpm --filter front typecheck`
- `pnpm --filter front exec biome check src/components/me/YourPublicFaceSection.tsx src/routes/me/index.tsx src/components/results/ShareProfileSection.tsx src/hooks/use-share-flow.ts src/components/me/__tests__/YourPublicFaceSection.test.tsx src/components/results/ShareProfileSection.test.tsx src/hooks/use-share-flow.test.ts src/routes/results/\$conversationSessionId.tsx`
- `pnpm --filter front exec vitest run src/routes/-three-space-routes.test.tsx`
- `pnpm test:run`

### Completion Notes List

- Added `YourPublicFaceSection` to the Me page and replaced the placeholder content with a real public-preview surface showing the archetype name and `GeometricSignature size="profile"`.
- Reused the existing share architecture by wiring local Me-page share state through `useToggleVisibility`, `useShareFlow`, `ShareProfileSection`, and `PublicVisibilityPrompt` instead of introducing a parallel implementation.
- Extended the shared share UX to expose both an explicit `Copy link` action and a primary `Share` action while preserving existing `data-testid` selectors.
- Added Sonner success feedback for clipboard-based copy paths and extended `useShareFlow` with `copyLink()` and optional `onCopied` support so copy-fallback behavior can be reused cleanly.
- Reused `ArchetypeShareCard` for the public-face card preview so the Me page stays on the same Satori / PNG generation path as the existing OG-sharing surface.
- Added focused tests for the new Me section, expanded share hook tests, updated shared share-section tests, and patched the existing Me route scaffold test to mock the new section so route-layout tests remain QueryClient-free.
- Validation passed with focused Vitest runs, frontend typecheck, targeted Biome checks, the `-three-space-routes` regression test, and the full `pnpm test:run` suite.
- Post–code review: product **1A** (copy allowed while private); added regression test and inline note on `onCopyAction`.

### File List

- `apps/front/src/components/me/YourPublicFaceSection.tsx`
- `apps/front/src/components/me/__tests__/YourPublicFaceSection.test.tsx`
- `apps/front/src/components/results/ShareProfileSection.tsx`
- `apps/front/src/components/results/ShareProfileSection.test.tsx`
- `apps/front/src/hooks/use-share-flow.ts`
- `apps/front/src/hooks/use-share-flow.test.ts`
- `apps/front/src/routes/me/index.tsx`
- `apps/front/src/routes/results/$conversationSessionId.tsx`
- `apps/front/src/routes/-three-space-routes.test.tsx`

### Change Log

- 2026-04-15: Implemented Story 3.4 public-face controls on `/me`, added explicit copy/share actions with Sonner copy confirmation, reused archetype card preview infrastructure, added focused tests, and validated with full regression coverage.
- 2026-04-15: Code review — product decision **1A** (copy while private allowed); added regression test and marked story done.

### Review Findings

- [x] [Review][Decision] **Copy link vs private profile** — **Resolved (1A):** Copy link always allowed; user may copy the URL while still private. `PublicVisibilityPrompt` applies to **Share** when private, not to **Copy link**. Documented inline in `YourPublicFaceSection.tsx` and locked by test `copies the link while the profile is private without opening the visibility prompt (product 1A)`.

- [x] [Review][Patch] **Regression test for copy-while-private** — Added the test above in `YourPublicFaceSection.test.tsx`.

- [x] [Review][Defer] **`ArchetypeShareCard` cost on /me** — [`YourPublicFaceSection.tsx`](apps/front/src/components/me/YourPublicFaceSection.tsx) mounts PNG generation on section render; acceptable for MVP but may warrant lazy-load or below-the-fold if Me LCP regresses — deferred, not introduced as a functional bug.

## Story completion status

- **Status:** done
- **Note:** Code review complete; copy-while-private behavior (1A) documented and tested.
