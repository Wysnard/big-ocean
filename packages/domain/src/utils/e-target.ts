/**
 * E_target Pacing Formula — v1
 *
 * Computes a target energy level for the next conversation exchange.
 * 7-step pipeline: smooth → momentum → trust → shift → drain → ceiling → clamp.
 *
 * User-state-pure: no coverage, no portrait readiness, no session phase.
 * Deterministic: same inputs → same output.
 *
 * @see {@link file://_bmad-output/problem-solution-2026-03-07.md} for full specification
 */

export interface PacingState {
	currentEnergy: number; // E(n) in [0, 10]
	previousSmoothedEnergy: number; // E_s(n-1), init at E_BASE
	recentEnergies: number[]; // last K raw E values for drain computation
	telling: number | null; // T(n) in [0, 1], null if unavailable
}

export interface PacingResult {
	eTarget: number; // target energy for next exchange [0, 10]
	smoothedEnergy: number; // E_s(n) — caller stores for next turn
}

export const PACING_CONSTANTS = {
	E_BASE: 5.0,
	LAMBDA: 0.35,
	ALPHA_UP: 0.5,
	ALPHA_DOWN: 0.6,
	COMFORT: 5.0,
	K: 5,
	E_FLOOR: 2.5,
	E_MAXCAP: 9.0,
} as const;

const computeTrust = (telling: number | null): number => {
	if (telling === null) return 1.0;
	if (telling <= 0.5) return 0.5 + telling;
	return 1.0 + 0.4 * (telling - 0.5);
};

const DRAIN_NORMALIZER = 5.0;

const computeDrain = (recentEnergies: readonly number[], K: number, comfort: number): number => {
	let totalCost = 0;
	for (const e of recentEnergies) {
		totalCost += Math.max(0, e - comfort) / DRAIN_NORMALIZER;
	}
	return Math.min(1.0, totalCost / K); // K-padded, clamped to [0, 1]
};

const computeCeiling = (drain: number, floor: number, maxcap: number): number =>
	floor + (maxcap - floor) * (1 - drain * drain);

export const computeETarget = (state: PacingState): PacingResult => {
	const { LAMBDA, ALPHA_UP, ALPHA_DOWN, COMFORT, K, E_FLOOR, E_MAXCAP } = PACING_CONSTANTS;

	// Step 1: Smooth energy (EMA)
	const smoothedEnergy = LAMBDA * state.currentEnergy + (1 - LAMBDA) * state.previousSmoothedEnergy;

	// Step 2: Momentum from smoothed energy
	const velocity = smoothedEnergy - state.previousSmoothedEnergy;
	const vUp = Math.max(velocity, 0);
	const vDown = Math.max(-velocity, 0);

	// Step 3: Trust from telling
	const trust = computeTrust(state.telling);

	// Step 4: Shift anchor by trusted momentum
	const eShifted = smoothedEnergy + ALPHA_UP * trust * vUp - ALPHA_DOWN * vDown;

	// Step 5: Drain from recent excess cost
	const drain = computeDrain(state.recentEnergies, K, COMFORT);

	// Step 6: Fatigue ceiling
	const eCap = computeCeiling(drain, E_FLOOR, E_MAXCAP);

	// Step 7: Apply ceiling and clamp
	const eTarget = Math.max(0, Math.min(Math.min(eShifted, eCap), 10));

	return { eTarget, smoothedEnergy };
};
