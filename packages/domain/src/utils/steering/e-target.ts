/**
 * E_target Pacing Formula — v2 ([0, 1] space)
 *
 * Computes a target energy level for the next conversation exchange using
 * an 8-step pipeline: smooth → momentum → trust → shift → adaptive comfort →
 * drain → ceiling → clamp.
 *
 * User-state-pure: no coverage, no portrait readiness, no session phase.
 * Deterministic: same inputs → same output.
 * All values operate in [0, 1] space (NFR1).
 *
 * Story 25-1 (FR1, FR25)
 * @see {@link file://_bmad-output/planning-artifacts/epics-conversation-pacing.md}
 */

/**
 * All formula constants in one configurable object.
 * Simulation-derived defaults — easily adjustable for future empirical calibration.
 */
export const PACING_CONFIG = {
	/** EMA smoothing factor (higher = more responsive to current turn) */
	lambda: 0.35,
	/** Upward momentum weight (trust-qualified) */
	alphaUp: 0.5,
	/** Downward momentum weight (unconditional) */
	alphaDown: 0.6,
	/** Initial comfort baseline */
	comfortInit: 0.5,
	/** Maximum comfort to prevent division-by-zero in headroom normalization */
	comfortCap: 0.85,
	/** Drain window size (K-padded: always divide by K even with fewer turns) */
	K: 5,
	/** Minimum ceiling (floor) — sustained overload drives E_cap here */
	floor: 0.25,
	/** Maximum ceiling at zero drain */
	maxcap: 0.9,
} as const;

export type PacingConfig = typeof PACING_CONFIG;

/**
 * Input to the E_target computation.
 *
 * History-based API follows derive-at-read pattern: all intermediate state
 * is reconstructed from raw histories. Optional priors allow incremental
 * computation when prior state is already known.
 */
export interface ETargetInput {
	/** Raw energy values [0, 1] for each turn, in chronological order */
	readonly energyHistory: readonly number[];
	/** Telling values [0, 1] for each turn (null = unavailable), in chronological order */
	readonly tellingHistory: readonly (number | null)[];
	/** Optional: previously computed smoothed energy (avoids full EMA replay) */
	readonly priorSmoothedEnergy?: number;
	/** Optional: previously computed comfort baseline */
	readonly priorComfort?: number;
}

export interface ETargetOutput {
	/** Target energy for next exchange [0, 1] */
	readonly eTarget: number;
	/** Smoothed energy E_s — caller can store for incremental computation */
	readonly smoothedEnergy: number;
	/** Adaptive comfort baseline — caller can store for incremental computation */
	readonly comfort: number;
}

// ── Internal helpers ────────────────────────────────────────────────

/**
 * Step 3: Trust from telling.
 * Linear interpolation: T=0.0→0.5, T=0.5→1.0, T=1.0→1.2
 */
const computeTrust = (telling: number | null): number => {
	if (telling === null) return 1.0;
	if (telling <= 0.5) return 0.5 + telling;
	return 1.0 + 0.4 * (telling - 0.5);
};

/**
 * Step 5: Adaptive comfort — running mean of all raw energy values, capped.
 */
const computeComfort = (
	energyHistory: readonly number[],
	priorComfort: number | undefined,
	config: PacingConfig,
): number => {
	if (energyHistory.length === 0) return priorComfort ?? config.comfortInit;
	const sum = energyHistory.reduce((acc, e) => acc + e, 0);
	const mean = sum / energyHistory.length;
	return Math.min(mean, config.comfortCap);
};

/**
 * Step 6: Drain — mean of headroom-normalized excess cost over last K turns.
 * Always divides by K (K-padded) to dampen early-session overreaction.
 * Uses raw E values (not smoothed) because drain measures what the user actually experienced.
 */
const computeDrain = (
	energyHistory: readonly number[],
	comfort: number,
	config: PacingConfig,
): number => {
	const headroom = 1 - comfort;
	// If headroom is 0 (comfort = 1.0, shouldn't happen due to cap), avoid div-by-zero
	if (headroom <= 0) return 0;

	// Take last K values
	const window = energyHistory.slice(-config.K);
	let totalCost = 0;
	for (const e of window) {
		totalCost += Math.max(0, e - comfort) / headroom;
	}
	return Math.min(1.0, totalCost / config.K); // K-padded, clamped to [0, 1]
};

/**
 * Step 7: Fatigue ceiling.
 * E_cap = floor + (maxcap - floor) × (1 - d²)
 */
const computeCeiling = (drain: number, config: PacingConfig): number =>
	config.floor + (config.maxcap - config.floor) * (1 - drain * drain);

// ── Main function ───────────────────────────────────────────────────

/**
 * Compute E_target using the 8-step pipeline.
 *
 * Steps:
 * 1. E_s = EMA smooth (init 0.5, lambda=0.35)
 * 2. V_up / V_down = momentum from smoothed energy
 * 3. trust = f(telling) — piecewise linear
 * 4. E_shifted = E_s + alphaUp × trust × V_up - alphaDown × V_down
 * 5. comfort = running mean of all raw E, capped at 0.85
 * 6. d = headroom-normalized drain over last K turns
 * 7. E_cap = floor + (maxcap - floor) × (1 - d²)
 * 8. E_target = clamp(min(E_shifted, E_cap), 0, 1)
 */
export const computeETarget = (input: ETargetInput): ETargetOutput => {
	const config = PACING_CONFIG;
	const { energyHistory, tellingHistory, priorSmoothedEnergy, priorComfort } = input;

	// Empty history → cold start defaults (FR25)
	if (energyHistory.length === 0) {
		return {
			eTarget: config.comfortInit,
			smoothedEnergy: config.comfortInit,
			comfort: priorComfort ?? config.comfortInit,
		};
	}

	// ── Step 1: EMA smoothing ────────────────────────────────────
	// Replay full history or use prior for incremental computation
	let smoothedEnergy: number;
	if (priorSmoothedEnergy !== undefined && energyHistory.length === 1) {
		// Incremental: one new turn on top of prior state
		const e0 = energyHistory[0] as number; // length === 1 guarantees existence
		smoothedEnergy = config.lambda * e0 + (1 - config.lambda) * priorSmoothedEnergy;
	} else if (priorSmoothedEnergy !== undefined) {
		// Prior given but multiple turns — use prior as starting point, replay from index 0
		// Actually with history-based API, prior is the state before the first element
		let es = priorSmoothedEnergy;
		for (const e of energyHistory) {
			es = config.lambda * e + (1 - config.lambda) * es;
		}
		smoothedEnergy = es;
	} else {
		// Full replay from init
		let es = config.comfortInit;
		for (const e of energyHistory) {
			es = config.lambda * e + (1 - config.lambda) * es;
		}
		smoothedEnergy = es;
	}

	// We need the previous smoothed energy for momentum computation
	let prevSmoothed: number;
	if (energyHistory.length === 1) {
		prevSmoothed = priorSmoothedEnergy ?? config.comfortInit;
	} else {
		// Replay to get second-to-last smoothed
		let es = priorSmoothedEnergy ?? config.comfortInit;
		for (let i = 0; i < energyHistory.length - 1; i++) {
			es = config.lambda * (energyHistory[i] as number) + (1 - config.lambda) * es;
		}
		prevSmoothed = es;
	}

	// ── Step 2: Momentum ─────────────────────────────────────────
	const velocity = smoothedEnergy - prevSmoothed;
	const vUp = Math.max(velocity, 0);
	const vDown = Math.max(-velocity, 0);

	// ── Step 3: Trust from telling ───────────────────────────────
	const currentTelling: number | null =
		tellingHistory.length > 0 ? (tellingHistory[tellingHistory.length - 1] ?? null) : null;
	const trust = computeTrust(currentTelling);

	// ── Step 4: Shift ────────────────────────────────────────────
	const eShifted = smoothedEnergy + config.alphaUp * trust * vUp - config.alphaDown * vDown;

	// ── Step 5: Adaptive comfort ─────────────────────────────────
	const comfort = computeComfort(energyHistory, priorComfort, config);

	// ── Step 6: Drain ────────────────────────────────────────────
	const drain = computeDrain(energyHistory, comfort, config);

	// ── Step 7: Fatigue ceiling ──────────────────────────────────
	const eCap = computeCeiling(drain, config);

	// ── Step 8: Clamp ────────────────────────────────────────────
	const eTarget = Math.max(0, Math.min(Math.min(eShifted, eCap), 1));

	return { eTarget, smoothedEnergy, comfort };
};
