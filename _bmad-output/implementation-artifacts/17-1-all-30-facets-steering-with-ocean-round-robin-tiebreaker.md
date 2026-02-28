# Story 17.1: All-30-Facets Steering with OCEAN Round-Robin Tiebreaker

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user taking the assessment,
I want Nerin to explore all aspects of my personality — not just traits that happen to come up early,
So that my final profile has broad, balanced coverage across all 30 facets.

## Acceptance Criteria

1. **Given** `computeSteeringTarget()` is called with a metrics map containing some explored facets
   **When** selecting the next facet to steer toward
   **Then** ALL 30 facets are iterated (not just those with evidence), with unexplored facets defaulting to confidence=0, signalPower=0

2. **Given** multiple facets have equal priority scores
   **When** a tiebreaker is needed
   **Then** a static OCEAN-interleaved ordering is used (O[0], C[0], E[0], A[0], N[0], O[1], C[1], ...) ensuring trait coverage spread

3. **Given** user messages 4-8 (post cold-start)
   **When** steering targets are computed
   **Then** unexplored facets win (priority=1.15 is max), and OCEAN interleaving ensures one facet per trait before repeating

## Tasks / Subtasks

- [ ] Task 1: Create `OCEAN_INTERLEAVED_ORDER` constant (AC: #2)
  - [ ] 1.1: In `packages/domain/src/constants/big-five.ts`, create and export `OCEAN_INTERLEAVED_ORDER: readonly FacetName[]` — a static array of all 30 facets in OCEAN round-robin order: `[O[0], C[0], E[0], A[0], N[0], O[1], C[1], E[1], A[1], N[1], ... O[5], C[5], E[5], A[5], N[5]]`
  - [ ] 1.2: Build it programmatically from `BIG_FIVE_TRAITS` (OCEAN order) and `TRAIT_TO_FACETS` — do NOT hardcode individual facet names. Use: `Array.from({ length: 6 }, (_, i) => BIG_FIVE_TRAITS.flatMap(t => TRAIT_TO_FACETS[t][i])).flat()`
  - [ ] 1.3: Export from `packages/domain/src/constants/big-five.ts` and re-export from `packages/domain/src/index.ts` (check if barrel export already exists for this file — it does via `constants/index.ts`)

- [ ] Task 2: Rewrite `computeSteeringTarget()` Step 1 — Facet Priority (AC: #1, #2, #3)
  - [ ] 2.1: In `packages/domain/src/utils/formula.ts`, change the facet iteration loop (currently line ~227: `for (const [facet, m] of metrics)`) to iterate over `OCEAN_INTERLEAVED_ORDER` instead of `metrics` entries
  - [ ] 2.2: For each facet, look up metrics via `metrics.get(facet)`. If absent (unexplored), default to `confidence=0, signalPower=0` — this yields maximum priority `α × C_target + β × P_target = 1.0 × 0.75 + 0.8 × 0.5 = 1.15`
  - [ ] 2.3: Replace the tiebreaker logic (currently line ~243: `if (bestPriority === 0 && lowestConfidenceFacet)`) with OCEAN-interleaved index comparison: track `bestTiebreakerRank` alongside `bestPriority`. When `priority === bestPriority`, the facet with lower index in `OCEAN_INTERLEAVED_ORDER` wins
  - [ ] 2.4: Remove the `lowestConfidenceFacet` / `lowestConfidence` tracking variables — they are no longer needed
  - [ ] 2.5: The cold-start guard (`if (metrics.size === 0)` → greeting seed pool) must remain unchanged

- [ ] Task 3: Update Step 2 — Domain Selection for unexplored facets (AC: #1)
  - [ ] 3.1: When the selected `bestFacet` has no entry in `metrics` (unexplored), `domainWeights` is empty. In this case, all steerable domains have equal projected ΔP gain. The existing domain selection loop handles this naturally (projected entropy from zero weights). Verify this works correctly by stepping through the domain selection code with an empty `domainWeights` map — no code change expected, but confirm via test
  - [ ] 3.2: If domain selection degenerates (all scores equal), the first steerable domain in iteration order wins. This is acceptable — any domain is fine for the first signal on an unexplored facet

- [ ] Task 4: Update unit tests (AC: #1, #2, #3)
  - [ ] 4.1: In `packages/domain/src/utils/__tests__/formula-metrics-steering.test.ts`, update test "5.10: facet priority tiebreaker — lowest confidence wins when all above target" → rename and rewrite to verify OCEAN-interleaved tiebreaker instead
  - [ ] 4.2: Add test: "unexplored facets get maximum priority (1.15)" — pass metrics with 5 explored facets (one per trait), verify selected facet is the first unexplored facet in OCEAN_INTERLEAVED_ORDER
  - [ ] 4.3: Add test: "OCEAN interleaving ensures trait spread" — pass metrics with O[0] explored, verify next target is C[0] (not O[1])
  - [ ] 4.4: Add test: "all 30 facets explored — facet with lowest confidence wins via OCEAN order tiebreaker" — pass all 30 facets above target, verify tiebreaker selects by OCEAN_INTERLEAVED_ORDER index
  - [ ] 4.5: In `packages/domain/src/utils/__tests__/formula-numerical-steering.test.ts`, verify existing numerical tests still pass (steering priority formula unchanged, only iteration scope and tiebreaker changed)
  - [ ] 4.6: Add test for `OCEAN_INTERLEAVED_ORDER` constant: verify length=30, verify first 5 elements are one from each trait (O, C, E, A, N), verify no duplicates

- [ ] Task 5: Verify integration with `send-message.use-case.ts` (AC: #1)
  - [ ] 5.1: No changes needed in `send-message.use-case.ts` — it already calls `computeSteeringTarget(metrics, previousDomain)` and the function signature is unchanged
  - [ ] 5.2: Run full test suite (`pnpm test:run`) to confirm no regressions

## Parallelism

- **Blocked by:** none
- **Blocks:** 17-2-micro-intent-realizer
- **Mode:** parallel (can run concurrently with Epic 16 stories, 17-3, and Epic 19 stories)
- **Domain:** backend scoring/steering (pure domain utils)
- **Shared files:** `packages/domain/src/utils/formula.ts` (also touched by 16-3 for λ bump and 18-2 for evidence v2 rewrite — coordinate merge), `packages/domain/src/constants/big-five.ts` (new export only — low conflict risk)

## Dev Notes

- This is a **pure domain-layer change** — no infrastructure, no handlers, no database changes
- All changes are in `packages/domain/` — the `formula.ts` steering functions and `big-five.ts` constants
- The function signature of `computeSteeringTarget()` does NOT change — callers are unaffected
- The cold-start path (greeting seeds for messages 1-3) is unchanged
- `computeFacetMetrics()` is unchanged — it still returns metrics only for explored facets. The change is in how `computeSteeringTarget()` consumes that map

### Architecture Compliance

- **Hexagonal architecture:** Changes are in domain utils (pure functions) — correct layer
- **No business logic in handlers:** N/A — no handler changes
- **Error propagation:** N/A — pure functions, no Effect errors
- **Import discipline:** `OCEAN_INTERLEAVED_ORDER` is defined in `packages/domain/` and consumed in `packages/domain/` — no cross-layer imports

### Library/Framework Requirements

- No new dependencies required
- Uses existing `FacetName`, `BIG_FIVE_TRAITS`, `TRAIT_TO_FACETS` from `@workspace/domain`
- Pure TypeScript — no Effect-ts needed for this change

### File Structure Requirements

| File | Action | Purpose |
|------|--------|---------|
| `packages/domain/src/constants/big-five.ts` | Edit | Add `OCEAN_INTERLEAVED_ORDER` constant |
| `packages/domain/src/utils/formula.ts` | Edit | Rewrite `computeSteeringTarget()` Step 1 facet iteration + tiebreaker |
| `packages/domain/src/utils/__tests__/formula-metrics-steering.test.ts` | Edit | Update tiebreaker test, add coverage tests |
| `packages/domain/src/utils/__tests__/formula-numerical-steering.test.ts` | Verify | Ensure existing numerical tests pass |

### Testing Requirements

- **Test framework:** Vitest with `@effect/vitest` (existing pattern)
- **No mocks needed:** All functions under test are pure — no repository dependencies
- **Test location:** Co-located with source in `__tests__/` directories (existing pattern)
- **Coverage:** All 3 acceptance criteria must have corresponding test assertions

### Project Structure Notes

- `OCEAN_INTERLEAVED_ORDER` follows the existing pattern of `ALL_FACETS`, `BIG_FIVE_TRAITS` as exported constants from `big-five.ts`
- The `formula.ts` function signature stability means no changes propagate to `send-message.use-case.ts` or any other consumer

### References

- [Source: _bmad-output/planning-artifacts/architecture-conversation-pipeline.md#Decision 2] — Full algorithm specification with pseudocode
- [Source: _bmad-output/planning-artifacts/epics-conversation-pipeline.md#Story 2.1] — Acceptance criteria and parallelism metadata
- [Source: packages/domain/src/utils/formula.ts:204-304] — Current `computeSteeringTarget()` implementation
- [Source: packages/domain/src/constants/big-five.ts:88-94] — `ALL_FACETS` definition and `TRAIT_TO_FACETS` mapping
- [Source: packages/domain/src/utils/__tests__/formula-metrics-steering.test.ts] — Existing steering tests
- [Source: docs/ARCHITECTURE.md] — Hexagonal architecture rules

## Anti-Patterns

Do NOT introduce any of these patterns during implementation:

1. **Error handling scope** — No broad `catchAll`/`catchTag` that swallows errors. Only allowed: fail-open `catchTag("RedisOperationError", ...)` for resilience. Errors must propagate unchanged to the HTTP contract layer.
2. **Mock accuracy** — Mocks in `__mocks__/` must match live repository interfaces exactly. Never add methods to mocks that don't exist in the real implementation. Always use `vi.mock()` + original paths, never import from `__mocks__/` directly.
3. **Import discipline** — No cross-layer imports (infrastructure must not import from use-cases, domain must not import from infrastructure). No deep imports bypassing barrel exports. Use `@workspace/*` paths.
4. **Type safety** — No unsafe `as` casts (use type guards or `unknown` instead). No `in` operator for type narrowing (use discriminated unions with `_tag`). No `as any` without a justifying comment.
5. **Hardcoded facet lists** — Do NOT hardcode the 30 facet names in `OCEAN_INTERLEAVED_ORDER`. Build it programmatically from `BIG_FIVE_TRAITS` and `TRAIT_TO_FACETS` to stay DRY and avoid drift if facet names ever change.
6. **Changing function signatures** — Do NOT change the signature of `computeSteeringTarget()`. Callers must not need modification.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
