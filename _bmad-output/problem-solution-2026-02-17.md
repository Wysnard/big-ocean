# Problem Solving Session: Results Page Performance — Slow Load & Frozen Interactions

**Date:** 2026-02-17
**Problem Solver:** Vincentlay
**Problem Category:** Frontend Performance / Rendering Architecture

---

## PROBLEM DEFINITION

### Initial Problem Statement

The results page (`/results/$assessmentSessionId`) takes too long on initial load even when the personalized portrait has already been generated. Interactions on the page — specifically opening the DetailZone by clicking a trait card — freeze the page. The larger the PersonalPortrait content, the worse the freeze. Chrome Performance tab confirms poor metrics across the board.

### Refined Problem Statement

The results page suffers from two distinct but related performance failures:

1. **Slow initial paint:** The entire page is client-side rendered with zero server-side data loading. The data fetching waterfall is: JS hydrate → auth check resolves → API fetch fires → full page renders (including heavy `react-markdown` parsing of the PersonalPortrait, Recharts RadarChart SVG computation, and Recharts RadialBarChart). Users see loading spinners for the entire duration.

2. **Frozen interactions:** Clicking a trait card calls `setSelectedTrait()` on the root `ResultsSessionPage` component. This triggers a full re-render of the entire component tree — including the expensive PersonalPortrait (react-markdown re-parses the full markdown string), PersonalityRadarChart, ConfidenceRingCard, all 5 TraitCards, and the newly-opening DetailZone. None of these components are memoized. The larger the portrait markdown, the longer the main thread blocks.

### Problem Context

- **Stack:** TanStack Start (SSR-capable) + TanStack Router + TanStack Query + React 19
- **Current state:** SSR capability exists but is completely unused for the results route — no `loader`, no `beforeLoad`, no server functions
- **Affected users:** Authenticated users viewing their own assessment results
- **Key files:**
  - Route: `apps/front/src/routes/results/$assessmentSessionId.tsx`
  - Layout: `apps/front/src/components/results/ProfileView.tsx`
  - Heavy components: `PersonalPortrait.tsx` (react-markdown), `PersonalityRadarChart.tsx` (Recharts), `DetailZone.tsx`
  - Evidence hook: `useTraitEvidence.ts` (6 parallel fetches per trait click)
- **The portrait size is growing** — as the AI generates richer personality narratives, the markdown content increases, making the re-render cost compound with each iteration

### Success Criteria

1. **Fast first paint:** Results page renders with meaningful content on first paint — no full-page loading spinner visible to the user
2. **Snappy interactions:** Clicking a trait card to open/close the DetailZone feels instant — no perceptible freeze or jank
3. **Scalable:** Performance remains stable as PersonalPortrait content grows in size

---

## DIAGNOSIS AND ROOT CAUSE ANALYSIS

### Problem Boundaries (Is/Is Not)

| Dimension | IS the problem | IS NOT the problem |
|-----------|---------------|-------------------|
| **Where** | Results page `/results/$assessmentSessionId` | Public profile page (has loader), Chat page, Home page |
| **When** | Initial page load (full spinner), every trait card click (freeze) | Evidence fetch itself (on-demand, properly gated with loading skeleton) |
| **Who** | Authenticated users viewing their own results | Anonymous users, public profile viewers |
| **What** | Client-side rendering waterfall, full tree re-renders on state change | API response time (backend is fast), network latency, bundle size |
| **Components** | PersonalPortrait (react-markdown), PersonalityRadarChart (Recharts), ConfidenceRingCard (Recharts), DetailZone open/close | ArchetypeHeroSection (lightweight SVG), ShareProfileSection (small) |
| **Pattern** | Worsens linearly with PersonalPortrait content size | Not device-specific — affects desktop and mobile equally |

**Key boundary insight:** The public profile route already uses a `loader` for SSR data. The results route does not. The codebase already has the SSR pattern — it's just not applied here.

### Root Cause Analysis

**Method: Five Whys (applied to each symptom)**

**Symptom 1 — Slow initial load:**

1. **Why** is the page slow on initial load? → User sees a full-page spinner while data fetches client-side
2. **Why** is data fetched client-side only? → No `loader` or `beforeLoad` defined on the results route
3. **Why** is auth checked client-side first? → `useAuth()` hook runs post-hydration; `canLoadResults` gates the query
4. **Why** can't the query fire during SSR? → The route was built as a pure SPA pattern — auth + data fetching are both client-side hooks
5. **Root cause:** The results route does not leverage TanStack Start's SSR capabilities (`loader`/`beforeLoad`) despite the framework and infrastructure being fully set up (`setupRouterSsrQueryIntegration` is configured in `router.tsx`)

**Symptom 2 — Frozen interactions (DetailZone):**

1. **Why** does clicking a trait card freeze the page? → The main thread is blocked by expensive re-renders
2. **Why** are re-renders expensive? → PersonalPortrait calls `splitMarkdownSections()` then renders each section through `react-markdown`, and Recharts recalculates full SVG geometry — all on every render
3. **Why** do these components re-render when only `selectedTrait` changes? → `setSelectedTrait()` lives on the root `ResultsSessionPage`, causing the entire tree to re-render
4. **Why** doesn't React skip unchanged subtrees? → None of the expensive child components use `React.memo()`, and `splitMarkdownSections()` is not wrapped in `useMemo()`
5. **Root cause:** Zero memoization on expensive components whose inputs are stable after initial data load — every interaction triggers O(entire page) render cost

### Contributing Factors

- **react-markdown parsing on every render:** `splitMarkdownSections()` runs inline in the render path of `PersonalPortrait`, producing new array references each time. Then each section body is parsed by `react-markdown` (which internally creates a full AST). None of this is memoized.
- **Recharts SVG computation:** Both `PersonalityRadarChart` and `ConfidenceRingCard` use Recharts, which computes SVG geometry synchronously in the render path. Recharts is known for expensive renders.
- **`markdownComponents` object recreated implicitly:** The `markdownComponents` const is defined at module scope (which is fine), but the sections array fed to `Markdown` changes every render.
- **No `staleTime` on `useGetResults`:** The results query has no `staleTime`, meaning TanStack Query marks it stale immediately. Any re-mount or window refocus triggers a background refetch.
- **Auto-share `useEffect` fires on results load:** `shareProfile.mutateAsync()` is called inside an effect that depends on `results`, adding an extra mutation during initial render.
- **`maxHeight` animation on DetailZone:** The `maxHeight: 2000px` transition forces layout recalculation on the entire grid when expanding.

### System Dynamics

```
Portrait content grows (richer AI narratives)
        ↓
react-markdown parsing cost increases
        ↓
Every setSelectedTrait triggers full re-render
        ↓
Page freezes longer on each interaction
        ↓
Pressure to limit portrait quality to maintain UX
        ↓
Conflict: Better content vs. usable interactions
```

**Feedback loop:** The richer the personality portrait (product value), the worse the interaction performance (user experience). This is a scaling conflict that will only worsen without architectural intervention.

**Compounding effect:** The lack of SSR means users experience BOTH the slow initial load AND the interaction freezes in sequence — the page takes a long time to appear, then feels broken when they interact with it.

---

## ANALYSIS

### Force Field Analysis

**Driving Forces (Supporting Solution):**

| Force | Strength | Notes |
|-------|----------|-------|
| TanStack Start SSR infrastructure already configured | Strong | `setupRouterSsrQueryIntegration()` in `router.tsx`, Nitro server runtime |
| Reference implementation exists | Strong | `public-profile.$publicProfileId.tsx` has a working loader pattern |
| React.memo is zero-cost to apply | Strong | No architectural change needed — just wrap exports |
| `useCallback` already used for handlers | Medium | `handleToggleTrait` and `handleCloseDetailZone` are already stable references |
| Results data is static after load | Strong | Traits, facets, portrait, archetype don't change during the session |
| React 19 compiler improvements | Medium | Better automatic memoization potential in future |

**Restraining Forces (Blocking Solution):**

| Force | Strength | Notes |
|-------|----------|-------|
| Auth gating complicates SSR | Medium | Need server-side cookie/session validation in `beforeLoad` |
| react-markdown is inherently heavy | Medium | Can memoize inputs but can't speed up the parser itself |
| Recharts has no lightweight mode | Low | Memoizing the component avoids re-renders entirely |
| DetailZone `maxHeight` animation | Low | CSS-only fix, not blocking |
| Testing coverage for SSR path | Medium | Need to verify hydration doesn't break existing tests |

### Constraint Identification

| Constraint | Type | Real or Assumed? |
|------------|------|-----------------|
| Auth protection on results | Real | Cannot expose results to unauthenticated users — must validate server-side |
| TanStack Start/Router architecture | Real | Must work within existing routing framework |
| Public profile route must not break | Real | Separate route, should be unaffected |
| Better Auth cookie-based sessions | Real | Server-side auth check requires forwarding cookies in loader |
| Cannot change API response shape | Assumed (flexible) | Could add `staleTime` or SSR-friendly endpoints if needed |

**Primary constraint:** Server-side auth validation. The `beforeLoad` guard must check the user's session cookie on the server before the `loader` fetches results data. Better Auth uses cookie-based sessions, so the cookie must be forwarded in the server-side fetch.

### Key Insights

1. **Two orthogonal fixes needed:** SSR (initial load) and memoization (interaction perf) are independent problems that can be solved independently. Memoization alone fixes the freeze. SSR alone fixes the initial load. Both together deliver the full solution.

2. **The memoization fix has the highest ROI:** Wrapping 5-6 components in `React.memo` and adding one `useMemo` for markdown parsing eliminates the interaction freeze entirely. This is the highest-impact, lowest-risk change.

3. **SSR is already 80% set up:** The router has `setupRouterSsrQueryIntegration()`, the public profile route demonstrates the loader pattern, and TanStack Query's `ensureQueryData` can hydrate the cache server-side. The remaining work is adding `beforeLoad` for auth + `loader` for data.

4. **The "static after load" insight is key:** After the initial results API response, the data (portrait, traits, facets, archetype) never changes during the page session. Only `selectedTrait` and `shareState` change. This means React.memo will prevent ALL expensive re-renders because the props to heavy components are referentially stable.

5. **`startTransition` is a polish layer:** Wrapping `setSelectedTrait` in `startTransition` tells React the update is non-urgent, keeping the UI responsive during the DetailZone transition even if some re-render cost remains.

---

## SOLUTION GENERATION

### Methods Used

- **Systematic Analysis:** Traced the render tree and data flow to identify every unnecessary re-render
- **Constraint-First Design:** Worked within TanStack Start/Router patterns already proven in the codebase
- **Layered Approach:** Separated solutions by impact area (SSR, memoization, polish) for independent implementation

### Generated Solutions

**Layer A — Memoization (fixes interaction freeze):**

| # | Solution | Impact | Effort |
|---|----------|--------|--------|
| A1 | Wrap `PersonalPortrait` in `React.memo` | High | Trivial |
| A2 | Add `useMemo` for `splitMarkdownSections()` inside PersonalPortrait | High | Trivial |
| A3 | Wrap `PersonalityRadarChart` in `React.memo` | Medium | Trivial |
| A4 | Wrap `ConfidenceRingCard` in `React.memo` | Medium | Trivial |
| A5 | Wrap `TraitCard` in `React.memo` | Medium | Trivial |
| A6 | Wrap `AboutArchetypeCard` in `React.memo` | Low | Trivial |
| A7 | Wrap `setSelectedTrait` in `startTransition` | Medium | Trivial |
| A8 | Add `staleTime: 5 * 60 * 1000` to `useGetResults` query | Low | Trivial |

**Layer B — SSR Data Loading (fixes initial load):**

| # | Solution | Impact | Effort |
|---|----------|--------|--------|
| B1 | Add `beforeLoad` to results route for server-side auth check | High | Medium |
| B2 | Add `loader` that calls `ensureQueryData` to prefetch results | High | Medium |
| B3 | Use route `pendingComponent` instead of manual loading spinner | Medium | Low |
| B4 | Add `staleTime` to results query so SSR-hydrated data isn't immediately refetched | Medium | Trivial |

**Layer C — Architectural (further optimization):**

| # | Solution | Impact | Effort |
|---|----------|--------|--------|
| C1 | Lazy-load DetailZone with `React.lazy` + `Suspense` | Low | Low |
| C2 | Lazy-load Recharts components (RadarChart, RadialBarChart) | Medium | Low |
| C3 | Pre-render PersonalPortrait markdown to HTML on the backend | High | High |
| C4 | Replace `maxHeight` animation with `grid-template-rows: 0fr/1fr` for cheaper layout | Low | Trivial |

### Creative Alternatives

- **Backend HTML pre-render:** The PersonalPortrait markdown is generated by an AI agent. Instead of sending raw markdown and parsing client-side, the backend could store pre-rendered HTML. This eliminates react-markdown entirely but couples the backend to presentation.
- **Incremental portrait rendering:** Render the portrait in chunks (first section immediately, remaining sections via `requestIdleCallback`), giving the perception of instant load while heavy sections render progressively.
- **Replace Recharts with a lightweight SVG-only radar:** The radar chart is 5 data points — a hand-drawn SVG polygon would be 10x lighter than the full Recharts library for this use case. This is a bigger refactor but eliminates the heaviest dependency.

---

## SOLUTION EVALUATION

### Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Effectiveness | 40% | Does it measurably fix the identified symptoms? |
| Feasibility | 25% | Can it be done with current stack and patterns? |
| Risk | 20% | Could it break existing behavior or introduce regressions? |
| Scope | 15% | How much code changes? Is it proportionate to the gain? |

### Solution Analysis

**Layer A (Memoization) — Score: 95/100**

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| Effectiveness | 38/40 | Eliminates all unnecessary re-renders on trait selection. PersonalPortrait, RadarChart, ConfidenceRing stop re-rendering entirely. |
| Feasibility | 25/25 | `React.memo`, `useMemo`, `startTransition` are standard React APIs. No architectural changes. |
| Risk | 19/20 | Near-zero risk. Memo with same props = same output. Only risk is a missed prop in memo comparison (mitigated by TypeScript). |
| Scope | 13/15 | ~20 lines of changes across 6 files. Proportionate to impact. |

**Layer B (SSR Data Loading) — Score: 82/100**

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| Effectiveness | 35/40 | Eliminates loading spinner for authenticated users. Data available on first paint. Auth-pending state still needed for unauthenticated visitors. |
| Feasibility | 20/25 | Pattern exists in public-profile route. Server-side auth check requires cookie forwarding which needs testing with Better Auth. |
| Risk | 14/20 | Moderate risk: SSR hydration mismatch if auth state differs server vs client. Need careful handling of the auth gate flow. |
| Scope | 13/15 | ~40-50 lines. New `beforeLoad` + `loader` functions. Remove manual loading states. |

**Layer C (Architectural) — Score: 65/100**

| Criterion | Score | Rationale |
|-----------|-------|-----------|
| Effectiveness | 30/40 | Incremental gains on top of A+B. Lazy-loading reduces initial bundle. Backend HTML eliminates react-markdown. |
| Feasibility | 15/25 | Backend HTML changes the API contract. Custom SVG radar is a rewrite. |
| Risk | 10/20 | Higher risk of regressions. Changes touch multiple layers. |
| Scope | 10/15 | Significant refactoring for incremental gains. |

### Recommended Solution

**Implement Layer A (Memoization) first, then Layer B (SSR Data Loading).**

Layer A is the immediate fix for the most painful symptom (frozen interactions). Layer B is the follow-up fix for the initial load speed. Together they fully satisfy all three success criteria.

Layer C items (lazy-loading, backend HTML) can be deferred to future optimization if needed — they offer diminishing returns after A+B.

### Rationale

1. **Layer A alone fixes the freeze:** The interaction jank is the most user-visible problem. Memoization eliminates it with trivial code changes and near-zero risk. This can ship immediately.

2. **Layer B eliminates the loading spinner:** SSR data loading means authenticated users see content on first paint. The pattern already exists in the codebase (`public-profile` route), reducing implementation risk.

3. **Sequencing A before B is strategic:** Memoization makes the page interaction-ready before SSR is added. If SSR introduces a hydration issue, the page still works well as a client-rendered page with memoization.

4. **Layer C is premature optimization:** With A+B in place, the page loads fast and interactions are snappy. Replacing Recharts or pre-rendering HTML on the backend adds complexity for marginal gains at this stage.

---

## IMPLEMENTATION PLAN

### Implementation Approach

**Phased rollout:** Two independent phases, each shippable on its own. Phase 1 (memoization) addresses the interaction freeze. Phase 2 (SSR) addresses the initial load. Each phase can be validated independently.

### Action Steps

**Phase 1 — Memoization (interaction fix)**

1. **PersonalPortrait:** Wrap export in `React.memo`. Inside the component, wrap `splitMarkdownSections(personalDescription)` in `useMemo` keyed on `personalDescription`.

2. **PersonalityRadarChart:** Wrap export in `React.memo`.

3. **ConfidenceRingCard:** Wrap export in `React.memo`.

4. **TraitCard:** Wrap export in `React.memo`.

5. **AboutArchetypeCard:** Wrap export in `React.memo`.

6. **ResultsSessionPage:** Wrap `setSelectedTrait` call path in `startTransition`:
   ```typescript
   import { startTransition } from "react";
   const handleToggleTrait = useCallback((trait: string) => {
     startTransition(() => {
       setSelectedTrait((prev) => (prev === trait ? null : (trait as TraitName)));
     });
   }, []);
   ```

7. **useGetResults:** Add `staleTime: 5 * 60 * 1000` to prevent unnecessary background refetches.

8. **Validate:** Chrome Performance profiler — record a trait card click. Confirm PersonalPortrait and RadarChart do NOT appear in the flame graph.

**Phase 2 — SSR Data Loading (initial load fix)**

1. **Add `beforeLoad` for server-side auth check:** Check the session cookie on the server. If unauthenticated, allow the page to render (auth gate handles it client-side). If authenticated, proceed to loader.

2. **Add `loader` with `ensureQueryData`:** Prefetch the results data into the TanStack Query cache:
   ```typescript
   loader: async ({ params, context }) => {
     await context.queryClient.ensureQueryData({
       queryKey: ["assessment", "results", params.assessmentSessionId],
       queryFn: () => fetchResults(params.assessmentSessionId),
     });
   }
   ```

3. **Remove manual loading spinner:** The SSR-hydrated data means `useGetResults` returns data immediately on first render. Replace the loading spinner with route-level `pendingComponent`.

4. **Handle auth edge case:** If the user is not authenticated, skip the loader (don't fetch results). The auth gate renders client-side as before.

5. **Validate:** Disable JavaScript in Chrome DevTools. Navigate to results page. Confirm HTML contains rendered content (not a spinner).

### Timeline and Milestones

| Milestone | Deliverable |
|-----------|-------------|
| Phase 1 complete | All memo wrappers applied, `startTransition` added, `staleTime` set. Chrome profiler confirms no unnecessary re-renders on trait click. |
| Phase 2 complete | `beforeLoad` + `loader` added. SSR delivers rendered HTML. No full-page spinner for authenticated users. |
| Validation complete | INP < 200ms confirmed for trait clicks. LCP improved. Existing tests pass. |

### Resource Requirements

- Chrome DevTools Performance tab for profiling before/after
- Existing test suite (`pnpm test:run`) to catch regressions
- Dev server (`pnpm dev`) for SSR validation

### Responsible Parties

| Role | Responsibility |
|------|---------------|
| Vincentlay | Implementation, profiling, validation |
| CI Pipeline | Automated lint, type check, test suite validation |

---

## MONITORING AND VALIDATION

### Success Metrics

| Metric | Current (estimated) | Target | How to Measure |
|--------|-------------------|--------|---------------|
| INP (Interaction to Next Paint) on trait click | >500ms (perceptible freeze) | <200ms | Chrome DevTools Performance → Interactions |
| LCP (Largest Contentful Paint) | >4s (full client waterfall) | <2.5s | Lighthouse / Chrome DevTools |
| PersonalPortrait re-renders per trait click | 1 (full re-render) | 0 | React DevTools Profiler → "Why did this render?" |
| RadarChart re-renders per trait click | 1 (full re-render) | 0 | React DevTools Profiler |
| Total components re-rendered on trait click | ~15+ (entire tree) | 2-3 (DetailZone + clicked TraitCard) | React DevTools Profiler |

### Validation Plan

**Phase 1 validation (Memoization):**
1. Open Chrome DevTools → Performance tab
2. Record a trait card click → open DetailZone → close DetailZone
3. Verify: PersonalPortrait, PersonalityRadarChart, ConfidenceRingCard do NOT appear in the flame graph
4. Verify: INP for trait click < 200ms
5. Run `pnpm test:run` — all existing tests pass

**Phase 2 validation (SSR):**
1. Run `pnpm dev`, navigate to results page as authenticated user
2. Open Network tab → verify no separate XHR for results data (it's SSR-hydrated)
3. Disable JavaScript → navigate to results page → verify HTML contains rendered content
4. Run `pnpm test:run` — all existing tests pass
5. Verify auth gate still works for unauthenticated users (no SSR data, client-side gate renders)

### Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| React.memo causes stale rendering | Low | Medium | All memo'd components receive primitive or referentially-stable props. TypeScript ensures prop shape. |
| SSR hydration mismatch | Medium | Medium | Use `beforeLoad` to check auth server-side. If unauthed, don't prefetch — let client handle. Test with JS disabled. |
| Better Auth cookies not forwarded in loader | Medium | High | Verify `request.headers` are available in TanStack Start loader context. Reference public-profile loader pattern. |
| `startTransition` delays DetailZone appearance | Low | Low | DetailZone has CSS transition — the slight delay will be masked by the animation. |
| Recharts memo prevents chart updates | Very Low | Low | Chart data (traits) never changes after load. Memo is safe. |

### Adjustment Triggers

| Trigger | Action |
|---------|--------|
| INP still >200ms after Phase 1 | Profile deeper — check if `markdownComponents` or Recharts `dot` render functions are the bottleneck. Consider lazy-loading Recharts. |
| SSR hydration errors in production | Fall back to client-only rendering (remove loader). Investigate auth cookie forwarding. |
| PersonalPortrait renders still show in profiler after memo | Check if `personalDescription` reference changes between renders. May need to stabilize at the query level. |
| Bundle size increases >5% | Audit — `startTransition` and `React.memo` should add zero bundle size. Check for accidental new imports. |

---

## LESSONS LEARNED

### Key Learnings

1. **SSR-capable frameworks don't help if you don't use their SSR features.** TanStack Start was fully configured for SSR, but the results route was built as a pure SPA. The infrastructure was there — it just wasn't connected.

2. **React's default rendering model is "re-render everything."** Without explicit `React.memo` boundaries, a single `setState` at the top of a component tree will re-render every descendant, no matter how expensive. This is by design — React optimizes for correctness over performance.

3. **Memoization is cheap insurance for expensive components.** Components that parse markdown, compute SVGs, or render charts should always be wrapped in `React.memo`. The cost is one shallow prop comparison; the savings are entire render cycles.

4. **"Static after load" data is a memoization goldmine.** When the input data never changes during a session (traits, facets, portrait), React.memo eliminates 100% of unnecessary re-renders for those components.

### What Worked

- **Is/Is Not analysis** quickly narrowed the problem to two specific components (PersonalPortrait, DetailZone interaction) and ruled out API speed, network, and other routes
- **Tracing the render tree** from `setSelectedTrait` through the component hierarchy made the cascade of unnecessary re-renders obvious
- **Having a reference implementation** (public-profile loader) made the SSR solution concrete rather than theoretical

### What to Avoid

- **Building SSR-capable pages as SPAs by default.** Every auth-gated route should at minimum check auth server-side in `beforeLoad` and prefetch data in `loader` when possible.
- **Skipping memoization because "it works fine now."** Performance degrades gradually as content grows. The PersonalPortrait freeze was unnoticeable with small portraits but became painful as the AI generated richer narratives.
- **Conflating two problems.** The slow initial load and the interaction freeze had different root causes and different solutions. Treating them as one "performance problem" would have led to an overly complex solution.

---

_Generated using BMAD Creative Intelligence Suite - Problem Solving Workflow_
