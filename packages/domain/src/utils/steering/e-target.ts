/**
 * E_target Pacing Formula — v3 (trust + drain)
 *
 * Computes a target energy level for the next conversation exchange using
 * a 7-step pipeline: smooth → momentum → tellingGain → shift → drain → trust → clamp.
 *
 * v3 changes from v2:
 * - Comfort removed — replaced by session trust (cap) and fixed-baseline drain (pull)
 * - Drain uses fixed midpoint (0.5) instead of adaptive comfort baseline
 * - Drain is a multiplicative pull on E_shifted, not a ceiling
 * - Session trust (EMA of energy × tellingFactor) gates depth as a cap
 * - conversationSkew in scorer is no longer needed (trust-gated e-target does the job)
 *
 * User-state-pure: no coverage, no portrait readiness, no session phase.
 * Deterministic: same inputs → same output.
 * All values operate in [0, 1] space (NFR1).
 *
 * Story 25-1 (FR1, FR25), evolved in pacing audit session
 */

/**
 * All formula constants in one configurable object.
 * Simulation-derived defaults — easily adjustable for future empirical calibration.
 */
export const PACING_CONFIG = {
	/** EMA smoothing factor (higher = more responsive to current turn) */
	lambda: 0.35,
	/** Upward momentum weight (tellingGain-qualified) */
	alphaUp: 0.5,
	/** Downward momentum weight (unconditional) */
	alphaDown: 0.6,
	/** Initial smoothed energy / cold-start e-target */
	initEnergy: 0.5,
	/** Drain window size (K-padded: always divide by K even with fewer turns) */
	K: 5,
	/** Fixed baseline for drain computation — excess above this accumulates as drain */
	drainBaseline: 0.5,
	/** Minimum ceiling (floor) — low trust drives trust_cap here */
	floor: 0.25,
	/** Maximum ceiling at full trust */
	maxcap: 0.9,
	/** EMA smoothing factor for session trust (lower = slower adaptation) */
	trustLambda: 0.2,
	/** Initial session trust */
	trustInit: 0.15,
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
	/** Optional: previously computed session trust (avoids full EMA replay) */
	readonly priorSessionTrust?: number;
}

export interface ETargetOutput {
	/** Target energy for next exchange [0, 1] */
	readonly eTarget: number;
	/** Smoothed energy E_s — caller can store for incremental computation */
	readonly smoothedEnergy: number;
	/** Session trust [0, 1] — accumulated trust level, stored for incremental computation */
	readonly sessionTrust: number;
	/** Drain [0, 1] — current fatigue level */
	readonly drain: number;
	/** Trust cap — ceiling on e-target from trust */
	readonly trustCap: number;
}

// ── Internal helpers ────────────────────────────────────────────────

/**
 * Step 3: Telling gain — per-turn momentum amplifier.
 * Controls how much upward momentum is followed based on who's steering.
 * Compliant user → dampen (0.5). Self-propelled → amplify (1.2).
 * Linear interpolation: T=0.0→0.5, T=0.5→1.0, T=1.0→1.2
 */
const computeTellingGain = (telling: number | null): number => {
	if (telling === null) return 1.0;
	if (telling <= 0.5) return 0.5 + telling;
	return 1.0 + 0.4 * (telling - 0.5);
};

/**
 * Telling factor for session trust computation.
 * Maps telling band to a multiplier on energy for trust accumulation.
 * Compliant → low trust signal. Self-propelled → high trust signal.
 */
const computeTellingFactor = (telling: number | null): number => {
	if (telling === null) return 0.7; // neutral default
	if (telling <= 0.25) return 0.5; // compliant — following, not trusting
	if (telling <= 0.5) return 0.7;
	if (telling <= 0.75) return 1.0; // mixed to self-propelled
	return 1.3; // strongly self-propelled — high trust signal
};

/**
 * Step 5: Session trust — EMA of (energy × tellingFactor).
 * Builds slowly over time. Represents earned relationship depth.
 */
const computeSessionTrust = (
	energyHistory: readonly number[],
	tellingHistory: readonly (number | null)[],
	priorSessionTrust: number | undefined,
	config: PacingConfig,
): number => {
	if (energyHistory.length === 0) return priorSessionTrust ?? config.trustInit;

	let trust = priorSessionTrust ?? config.trustInit;
	for (let i = 0; i < energyHistory.length; i++) {
		const energy = energyHistory[i] as number;
		const telling = i < tellingHistory.length ? (tellingHistory[i] ?? null) : null;
		const signal = energy * computeTellingFactor(telling);
		trust = config.trustLambda * signal + (1 - config.trustLambda) * trust;
	}
	return Math.min(trust, 1.0);
};

/**
 * Step 6: Drain — mean of excess cost over fixed baseline in last K turns.
 * Always divides by K (K-padded) to dampen early-session overreaction.
 * Uses a fixed baseline (0.5) so drain accumulates during sustained high energy
 * regardless of how long the user has been engaged.
 */
const computeDrain = (energyHistory: readonly number[], config: PacingConfig): number => {
	const baseline = config.drainBaseline;
	const headroom = 1 - baseline;
	if (headroom <= 0) return 0;

	const window = energyHistory.slice(-config.K);
	let totalCost = 0;
	for (const e of window) {
		totalCost += Math.max(0, e - baseline) / headroom;
	}
	return Math.min(1.0, totalCost / config.K);
};

/**
 * Step 7: Trust cap — ceiling on e-target from session trust.
 * trust_cap = floor + (maxcap - floor) × sessionTrust
 */
const computeTrustCap = (sessionTrust: number, config: PacingConfig): number =>
	config.floor + (config.maxcap - config.floor) * sessionTrust;

// ── Main function ───────────────────────────────────────────────────

/**
 * Compute E_target using the 7-step pipeline.
 *
 * Steps:
 * 1. E_s = EMA smooth (init 0.5, lambda=0.35)
 * 2. V_up / V_down = momentum from smoothed energy
 * 3. tellingGain = f(telling) — per-turn momentum amplifier
 * 4. E_shifted = E_s + alphaUp × tellingGain × V_up - alphaDown × V_down
 * 5. sessionTrust = EMA(energy × tellingFactor) — accumulated trust
 * 6. drain = excess over fixed baseline (0.5) in last K turns
 * 7. e_drained = E_shifted × (1 - drain)
 *    trust_cap = floor + (maxcap - floor) × sessionTrust
 *    E_target = clamp(min(e_drained, trust_cap), 0, 1)
 */
export const computeETarget = (input: ETargetInput): ETargetOutput => {
	const config = PACING_CONFIG;
	const { energyHistory, tellingHistory, priorSmoothedEnergy, priorSessionTrust } = input;

	// Empty history → cold start defaults
	if (energyHistory.length === 0) {
		const sessionTrust = priorSessionTrust ?? config.trustInit;
		return {
			eTarget: config.initEnergy,
			smoothedEnergy: config.initEnergy,
			sessionTrust,
			drain: 0,
			trustCap: computeTrustCap(sessionTrust, config),
		};
	}

	// ── Step 1: EMA smoothing ────────────────────────────────────
	let smoothedEnergy: number;
	if (priorSmoothedEnergy !== undefined && energyHistory.length === 1) {
		const e0 = energyHistory[0] as number;
		smoothedEnergy = config.lambda * e0 + (1 - config.lambda) * priorSmoothedEnergy;
	} else if (priorSmoothedEnergy !== undefined) {
		let es = priorSmoothedEnergy;
		for (const e of energyHistory) {
			es = config.lambda * e + (1 - config.lambda) * es;
		}
		smoothedEnergy = es;
	} else {
		let es = config.initEnergy;
		for (const e of energyHistory) {
			es = config.lambda * e + (1 - config.lambda) * es;
		}
		smoothedEnergy = es;
	}

	// Previous smoothed energy for momentum computation
	let prevSmoothed: number;
	if (energyHistory.length === 1) {
		prevSmoothed = priorSmoothedEnergy ?? config.initEnergy;
	} else {
		let es = priorSmoothedEnergy ?? config.initEnergy;
		for (let i = 0; i < energyHistory.length - 1; i++) {
			es = config.lambda * (energyHistory[i] as number) + (1 - config.lambda) * es;
		}
		prevSmoothed = es;
	}

	// ── Step 2: Momentum ─────────────────────────────────────────
	const velocity = smoothedEnergy - prevSmoothed;
	const vUp = Math.max(velocity, 0);
	const vDown = Math.max(-velocity, 0);

	// ── Step 3: Telling gain (per-turn momentum amplifier) ──────
	const currentTelling: number | null =
		tellingHistory.length > 0 ? (tellingHistory[tellingHistory.length - 1] ?? null) : null;
	const tellingGain = computeTellingGain(currentTelling);

	// ── Step 4: Shift ────────────────────────────────────────────
	const eShifted = smoothedEnergy + config.alphaUp * tellingGain * vUp - config.alphaDown * vDown;

	// ── Step 5: Session trust ────────────────────────────────────
	const sessionTrust = computeSessionTrust(energyHistory, tellingHistory, priorSessionTrust, config);

	// ── Step 6: Drain ────────────────────────────────────────────
	const drain = computeDrain(energyHistory, config);

	// ── Step 7: Drain pull + trust cap + clamp ───────────────────
	const eDrained = eShifted * (1 - drain);
	const trustCap = computeTrustCap(sessionTrust, config);
	const eTarget = Math.max(0, Math.min(Math.min(eDrained, trustCap), 1));

	return { eTarget, smoothedEnergy, sessionTrust, drain, trustCap };
};
