# Story 26-2: Observation Gating & Competition

Status: ready-for-dev

## Story

As a developer,
I want an observation gating system that controls when non-Relate observations fire using evidence-derived phase and escalating thresholds,
So that "seen" moments are rare, earned, and increasingly scarce — spending emotional currency wisely.

## Acceptance Criteria

1. **Given** an `evaluateObservationGating()` function at `packages/domain/src/utils/steering/observation-gating.ts` **When** called in `explore` mode with all four raw strengths, the current phase, and the shared fire count (n) **Then** it computes:
   - `phase` = mean(confidence_f for f where confidence_f > 0) / C_MAX — evidence-derived, not turn-based
   - `effectiveStrength` = rawStrength x phase — for each non-Relate candidate
   - `threshold(n)` = OBSERVE_BASE(0.12) + OBSERVE_STEP(0.04) x n — shared across all focus types
   - A non-Relate focus fires if effectiveStrength > threshold(n)

2. **Given** mutual exclusion **When** multiple non-Relate focuses clear the threshold **Then** at most one non-Relate observation fires per turn, priority: contradiction > convergence > noticing

3. **Given** nothing clears the threshold **When** gating completes in explore mode **Then** Relate wins by default (no gate needed)

4. **Given** `evaluate` is called in `amplify` mode (final turn) **When** thresholds are evaluated **Then** all four focuses (including Relate) compete on raw strength — no phase gating, no threshold **And** winner = argmax of all four raw strengths **And** Relate is a competitor, not a fallback — when energy x telling is strongest, Relate wins honestly

5. **Given** the shared fire count (n) **When** n increases through the session **Then** the threshold escalates linearly: n=0 -> 0.12, n=1 -> 0.16, n=2 -> 0.20, n=3 -> 0.24, n=4 -> 0.28 **And** expected budget is 3-5 non-Relate focuses per session (NFR6) **And** at n=4, threshold=0.28 requires high phase (approx 0.6+) AND strong signal

6. **Given** the fire count is derived at read time **When** `n` is needed **Then** it is reconstructed by counting prior exchanges where `governor_output->'observationFocus'->>'type'` is not `'relate'` — consistent with derive-at-read pattern

7. **Given** the gating constants (OBSERVE_BASE, OBSERVE_STEP, CLARITY_EMA_DECAY, C_MAX) **When** referenced in code **Then** they are defined as named constants, easily adjustable for calibration

8. **Given** the output **When** gating completes **Then** it returns:
   - The winning `ObservationFocus` variant (fully constructed with target data for contradiction/convergence, domain for noticing)
   - `ObservationGatingDebug` with mode, phase, threshold, sharedFireCount, all four candidates with raw/effective strengths, winner, and mutualExclusionApplied flag

9. **Given** unit tests at `packages/domain/src/utils/steering/__tests__/observation-gating.test.ts` **When** tests run **Then** tests cover:
   - Early session (low phase): no non-Relate focus clears threshold -> Relate wins
   - Mid session (moderate phase + strong signal): noticing clears threshold -> fires
   - Mutual exclusion: contradiction and noticing both clear -> contradiction wins (higher priority)
   - Escalation: after 3 fires, threshold is high enough that moderate signals no longer clear
   - Amplify mode: all compete on raw strength, Relate can win when energy x telling is strongest
   - Amplify mode: simmering contradiction that never cleared explore threshold now wins

## Tasks / Subtasks

- [ ] Task 1: Define gating constants and types (AC: #7, #8)
  - [ ] 1.1: Add `OBSERVE_BASE` (0.12) and `OBSERVE_STEP` (0.04) constants to `observation-gating.ts`
  - [ ] 1.2: Define `ObservationGatingMode` type: `"explore" | "amplify"`
  - [ ] 1.3: Define `ObservationFocusCandidate` type with `type`, `rawStrength`, `effectiveStrength`, and optional target data
  - [ ] 1.4: Define `ObservationGatingInput` type with `mode`, `rawStrengths` (all four), `phase`, `sharedFireCount`, and optional target data for each focus
  - [ ] 1.5: Define `ObservationGatingResult` type with winning `ObservationFocus` variant
  - [ ] 1.6: Define `ObservationGatingDebug` type with mode, phase, threshold, sharedFireCount, candidates, winner, and mutualExclusionApplied

- [ ] Task 2: Implement `evaluateObservationGating()` for explore mode (AC: #1, #2, #3)
  - [ ] 2.1: Compute `threshold(n)` = OBSERVE_BASE + OBSERVE_STEP * n
  - [ ] 2.2: Compute `effectiveStrength` = rawStrength * phase for each non-Relate candidate
  - [ ] 2.3: Filter candidates where effectiveStrength > threshold
  - [ ] 2.4: Apply mutual exclusion priority: contradiction > convergence > noticing
  - [ ] 2.5: Return Relate as default if no non-Relate focus clears threshold

- [ ] Task 3: Implement `evaluateObservationGating()` for amplify mode (AC: #4)
  - [ ] 3.1: All four focuses (including Relate) compete on raw strength
  - [ ] 3.2: Winner = argmax of all four raw strengths
  - [ ] 3.3: Tiebreak by priority order: contradiction > convergence > noticing > relate

- [ ] Task 4: Export from barrel files (AC: #7)
  - [ ] 4.1: Export `evaluateObservationGating`, constants, and types from `packages/domain/src/utils/steering/index.ts`

- [ ] Task 5: Unit tests (AC: #9)
  - [ ] 5.1: Test early session (low phase): no non-Relate focus clears threshold -> Relate wins
  - [ ] 5.2: Test mid session (moderate phase + strong signal): noticing clears threshold -> fires
  - [ ] 5.3: Test mutual exclusion: contradiction and noticing both clear -> contradiction wins
  - [ ] 5.4: Test escalation: after 3 fires, threshold blocks moderate signals
  - [ ] 5.5: Test amplify mode: Relate wins when energy x telling is strongest
  - [ ] 5.6: Test amplify mode: simmering contradiction wins when its raw strength is highest
  - [ ] 5.7: Test threshold escalation values: n=0 -> 0.12, n=1 -> 0.16, etc.
  - [ ] 5.8: Test all constants are named and match expected values
