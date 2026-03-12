/**
 * Observation Focus Strength Formulas & Per-Domain Confidence — Story 26-1
 *
 * Pure functions that compute strength for each ObservationFocus variant:
 * - Relate: energy x telling
 * - Noticing: EMA-smoothed clarity (pass-through)
 * - Contradiction: delta x min(domainConf_A, domainConf_B)
 * - Convergence: (1 - normalizedSpread) x min(domainConf) for 3+ domains
 *
 * Per-domain confidence reuses the same formula as facet-level confidence
 * (C_MAX * (1 - exp(-k * w_g))) scoped to a single domain's evidence weight.
 *
 * All values operate in [0, 1] space per NFR1.
 * Constants are named and easily adjustable for future calibration.
 *
 * @see {@link ../../formula.ts} for the facet-level confidence formula (FORMULA_DEFAULTS)
 */

// ─── Constants ───────────────────────────────────────────────────────

/**
 * Named constants for observation focus strength computation.
 * Simulation-derived defaults requiring future empirical calibration.
 */
export const OBSERVATION_FOCUS_CONSTANTS = Object.freeze({
	/** Maximum confidence asymptote — same as FORMULA_DEFAULTS.C_max */
	C_MAX: 0.9,
	/** Confidence growth rate — same as FORMULA_DEFAULTS.k */
	K_CONFIDENCE: 0.7,
	/** EMA decay for smoothed clarity (noticing strength) */
	CLARITY_EMA_DECAY: 0.5,
});

// ─── Helpers ─────────────────────────────────────────────────────────

/** Clamp a value to [0, 1] */
function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

// ─── Per-Domain Confidence ───────────────────────────────────────────

/**
 * Compute confidence for a single domain's evidence weight.
 *
 * Formula: domainConf(f, d) = C_MAX * (1 - exp(-k * w_g(f, d)))
 *
 * Reuses the same formula and constants as facet-level confidence
 * in computeFacetMetrics() — just scoped to a single domain's weight
 * from FacetMetrics.domainWeights.
 *
 * @param domainWeight - The domain's context weight (w_g) from FacetMetrics.domainWeights
 * @returns Confidence value in [0, C_MAX]
 */
export function computePerDomainConfidence(domainWeight: number): number {
	const { C_MAX, K_CONFIDENCE } = OBSERVATION_FOCUS_CONSTANTS;
	return C_MAX * (1 - Math.exp(-K_CONFIDENCE * domainWeight));
}

// ─── Relate Strength ─────────────────────────────────────────────────

/**
 * Compute Relate observation strength.
 *
 * Relate is the default focus — Nerin relates to the user's energy and
 * self-disclosure style. Strength is high when the user is energetic
 * and self-propelled.
 *
 * Formula: energy * telling
 *
 * @param energy - User energy level [0, 1]
 * @param telling - User telling/self-disclosure level [0, 1]
 * @returns Strength value [0, 1]
 */
export function computeRelateStrength(energy: number, telling: number): number {
	return energy * telling;
}

// ─── Smoothed Clarity ────────────────────────────────────────────────

/**
 * Compute EMA-smoothed clarity for noticing strength.
 *
 * Formula: decay * currentClarity + (1 - decay) * previousSmoothed
 *
 * @param previousSmoothed - Previous smoothed clarity value
 * @param currentClarity - Current raw clarity value for top domain
 * @param decay - EMA decay factor (default: CLARITY_EMA_DECAY = 0.5)
 * @returns Smoothed clarity value
 */
export function computeSmoothedClarity(
	previousSmoothed: number,
	currentClarity: number,
	decay: number = OBSERVATION_FOCUS_CONSTANTS.CLARITY_EMA_DECAY,
): number {
	return decay * currentClarity + (1 - decay) * previousSmoothed;
}

// ─── Noticing Strength ───────────────────────────────────────────────

/**
 * Compute Noticing observation strength.
 *
 * Noticing fires when Nerin has high clarity about the user's behavior
 * in the top domain. Strength is the EMA-smoothed clarity value.
 *
 * The caller is responsible for computing smoothedClarity via
 * computeSmoothedClarity() before passing it here.
 *
 * @param smoothedClarity - EMA-smoothed clarity for top domain
 * @returns Strength value [0, 1]
 */
export function computeNoticingStrength(smoothedClarity: number): number {
	return clamp01(smoothedClarity);
}

// ─── Contradiction Strength ──────────────────────────────────────────

/**
 * Compute Contradiction observation strength.
 *
 * Contradiction fires when a facet shows high score divergence between
 * two life domains AND both domains have sufficient evidence (high
 * per-domain confidence). High divergence with weak evidence does NOT fire.
 *
 * Formula: delta * min(domainConf_A, domainConf_B)
 *
 * @param delta - Score divergence between two domains for the same facet [0, 1]
 * @param domainConfA - Per-domain confidence for domain A
 * @param domainConfB - Per-domain confidence for domain B
 * @returns Strength value [0, 1]
 */
export function computeContradictionStrength(
	delta: number,
	domainConfA: number,
	domainConfB: number,
): number {
	return clamp01(delta * Math.min(domainConfA, domainConfB));
}

// ─── Convergence Strength ────────────────────────────────────────────

/**
 * Compute Convergence observation strength.
 *
 * Convergence fires when 3+ life domains score similarly for the same
 * facet AND all domains have sufficient evidence. Requires minimum 3
 * domains by definition — returns 0 for fewer.
 *
 * Formula: (1 - normalizedSpread) * min(domainConfidences)
 *
 * @param normalizedSpread - Normalized spread of scores across domains [0, 1]
 * @param domainConfidences - Per-domain confidence values for each domain
 * @returns Strength value [0, 1], 0 if fewer than 3 domains
 */
export function computeConvergenceStrength(
	normalizedSpread: number,
	domainConfidences: readonly number[],
): number {
	if (domainConfidences.length < 3) return 0;

	const minConf = Math.min(...domainConfidences);
	return clamp01((1 - normalizedSpread) * minConf);
}
