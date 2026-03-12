# Story 25-1: E_target Pacing Formula

**Epic:** Epic 3 — Adaptive Pacing & Territory Scoring (Conversation Pacing Pipeline)
**Status:** ready-for-dev
**FRs covered:** FR1, FR25
**NFRs addressed:** NFR1, NFR2, NFR8, NFR11
**Depends on:** Story 23-2 (Territory Catalog Evolution & Band Mapping) — uses band-to-numeric mapping and [0, 1] energy space

## Story

As a developer,
I want a pure function that computes E_target from energy/telling history using an 8-step pipeline,
So that the system has an adaptive pacing signal derived solely from user state — no coverage pressure, no phase terms, no monetization logic.

## Acceptance Criteria

### AC1: 8-step pipeline computation

**Given** a `computeETarget()` pure function at `packages/domain/src/utils/steering/e-target.ts`
**When** called with energy history, telling history, and optional prior state (smoothedEnergy, comfort)
**Then** it computes the 8-step pipeline in order:
1. `E_s` = EMA of energy (smoothed anchor, init 0.5, lambda=0.35)
2. `V_up/V_down` = momentum from smoothed energy (split for asymmetric treatment)
3. `trust` = f(telling) — linear interpolation: T=0.0->0.5, T=0.5->1.0, T=1.0->1.2
4. `E_shifted` = E_s + alpha_up(0.5) x trust x V_up - alpha_down(0.6) x V_down
5. `comfort` = running mean of all raw E values (adaptive baseline, init 0.5)
6. `d` = mean of headroom-normalized excess cost over last K(5) turns, always divide by K
7. `E_cap` = floor(0.25) + (maxcap(0.9) - floor) x (1 - d^2)
8. `E_target` = clamp(min(E_shifted, E_cap), 0, 1)

**And** the output is in [0, 1] space with no intermediate scales (NFR1)

### AC2: Trust function neutral default

**Given** the trust function
**When** telling is unavailable or defaults to 0.5
**Then** trust = 1.0 (neutral — no momentum modification)

### AC3: Adaptive comfort with cap

**Given** the adaptive comfort computation
**When** comfort is computed from all prior raw energy values
**Then** comfort is capped at 0.85 to prevent division-by-zero in headroom normalization
**And** cost(E) = max(0, E - comfort) / (1 - comfort) — headroom-normalized [0, 1]
**And** drain uses raw E values (not smoothed E_s) because drain measures what the user actually experienced

### AC4: Cold start defaults

**Given** cold start (no prior messages)
**When** `computeETarget()` is called with empty history
**Then** momentum = 0, drain = 0, telling = neutral -> E_target ~= 0.5 (comfort midpoint) (FR25)

### AC5: Drain ceiling bounds

**Given** the drain ceiling
**When** drain is at maximum (d=1, sustained overload)
**Then** E_cap = 0.25 (floor) — no other force can exceed this ceiling
**And** at d=0 (no fatigue): E_cap = 0.9

### AC6: Weight hierarchy

**Given** the weight hierarchy
**When** forces conflict
**Then** drain ceiling (structural) > alpha_down (0.6) >= alpha_up (0.5) — coverage is NOT in the formula (NFR2)

### AC7: Named configurable constants

**Given** all formula constants (lambda, alpha_up, alpha_down, floor, maxcap, K, comfort_cap)
**When** referenced in the code
**Then** they are defined as named constants in a pacing config object, easily adjustable for future empirical calibration

### AC8: Comprehensive unit tests

**Given** unit tests at `packages/domain/src/utils/steering/__tests__/e-target.test.ts`
**When** tests run
**Then** snapshot tests cover:
- Cold start -> E_target ~= 0.5
- Sustained high energy -> drain accumulates -> E_cap drops -> E_target constrained
- High energy + high telling -> trust amplifies upward momentum
- High energy + low telling (performance) -> trust discounts upward momentum
- Low energy -> alpha_down dominates, no trust dampening on downward momentum
- Naturally intense user (high comfort baseline) -> less drain than low-baseline user at same energy
- Recovery after drain -> comfort adapts, drain decreases, E_cap rises

## Tasks

### Task 1: Create pacing config constants

Create `packages/domain/src/utils/steering/pacing-config.ts` with:
- `PACING_CONFIG` object with all named constants:
  - `lambda: 0.35` (EMA smoothing factor)
  - `alphaUp: 0.5` (upward momentum weight)
  - `alphaDown: 0.6` (downward momentum weight)
  - `comfortInit: 0.5` (initial comfort baseline)
  - `comfortCap: 0.85` (max comfort to prevent div-by-zero)
  - `K: 5` (drain window size)
  - `floor: 0.25` (minimum ceiling)
  - `maxcap: 0.9` (maximum ceiling at zero drain)
- Export the config object and its type

### Task 2: Create E_target pure function

Create `packages/domain/src/utils/steering/e-target.ts` with:
- `ETargetInput` interface: `{ energyHistory: number[], tellingHistory: (number | null)[], priorSmoothedEnergy?: number, priorComfort?: number }`
- `ETargetOutput` interface: `{ eTarget: number, smoothedEnergy: number, comfort: number }`
- `computeETarget(input: ETargetInput): ETargetOutput` implementing the 8-step pipeline
- All values in [0, 1] space
- Internal helper functions for each step (computeTrust, computeDrain, computeCeiling)

### Task 3: Migrate old e-target.ts

- Update the old `packages/domain/src/utils/e-target.ts` to re-export from the new steering location for backward compatibility, or remove if no consumers exist
- Update `packages/domain/src/utils/index.ts` exports
- Update `packages/domain/src/utils/steering/index.ts` exports

### Task 4: Write comprehensive tests (TDD)

Create `packages/domain/src/utils/steering/__tests__/e-target.test.ts` with tests covering:
- Cold start (empty history) -> E_target ~= 0.5
- Sustained high energy -> drain accumulates, E_cap drops
- High energy + high telling -> trust amplifies upward momentum
- High energy + low telling -> trust discounts upward momentum
- Low energy -> alpha_down dominates
- High comfort baseline user -> less drain at same energy
- Recovery after drain -> comfort adapts, E_cap rises
- Edge cases: single turn, all zeros, all max
- Determinism: same inputs -> same outputs
- Output always in [0, 1]
- User-state purity: no coverage/phase/portrait inputs

### Task 5: Update exports and verify integration

- Update `packages/domain/src/utils/steering/index.ts` to export new E_target function and types
- Ensure `packages/domain/src/index.ts` re-exports through the chain
- Verify typecheck passes across the monorepo
