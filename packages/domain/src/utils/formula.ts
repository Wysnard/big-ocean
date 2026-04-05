/**
 * Formula Functions — Facet Metrics (Story 10.3)
 *
 * Pure domain functions that compute per-facet score and confidence
 * from evidence. Deterministic, testable, zero-LLM-cost.
 */
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";
import type { EvidenceConfidence, EvidenceInput, EvidenceStrength } from "../types/evidence";

// ─── Types ───────────────────────────────────────────────────────────

export interface FormulaConfig {
	readonly C_max: number;
	readonly k: number;
	readonly epsilon: number;
	readonly SCORE_MIDPOINT: number;
}

export interface FacetMetrics {
	readonly score: number;
	readonly confidence: number;
	/** Per-domain context weights (w_g) — retained for diagnostics and tests */
	readonly domainWeights: ReadonlyMap<LifeDomain, number>;
}

// ─── Constants ───────────────────────────────────────────────────────

export const FORMULA_DEFAULTS = Object.freeze({
	C_max: 0.9,
	k: 0.7,
	epsilon: 1e-10,
	SCORE_MIDPOINT: 10,
}) satisfies FormulaConfig;

// ─── Helper Functions ────────────────────────────────────────────────

/** Anti-redundancy context weight: √(Σ w_i) for a domain group */
export function computeContextWeight(weights: number[]): number {
	const sum = weights.reduce((acc, w) => acc + w, 0);
	return Math.sqrt(sum);
}

/** Weighted mean: Σ(w_i × v_i) / Σ(w_i) with epsilon safety */
export function computeContextMean(
	values: number[],
	weights: number[],
	epsilon: number = FORMULA_DEFAULTS.epsilon,
): number {
	let num = 0;
	let den = 0;
	for (let i = 0; i < values.length; i++) {
		const w = weights[i] ?? 0;
		const v = values[i] ?? 0;
		num += w * v;
		den += w;
	}
	return num / (den + epsilon);
}

// ─── Weight Maps (exported for reuse by annotation API — Story 20-1) ──

/** Map strength enum → numeric weight */
export const STRENGTH_WEIGHT: Record<EvidenceStrength, number> = {
	weak: 0.3,
	moderate: 0.6,
	strong: 1.0,
};

/** Map confidence enum → numeric weight */
export const CONFIDENCE_WEIGHT: Record<EvidenceConfidence, number> = {
	low: 0.3,
	medium: 0.6,
	high: 0.9,
};

/** Compute combined weight from strength and confidence enums */
export function computeFinalWeight(
	strength: EvidenceStrength,
	confidence: EvidenceConfidence,
): number {
	return STRENGTH_WEIGHT[strength] * CONFIDENCE_WEIGHT[confidence];
}

/** Scale factor for mapping deviation (-3..+3) to score (0..20) */
const SCALE_FACTOR = 10 / 3;

// ─── Core Functions ──────────────────────────────────────────────────

/**
 * Compute per-facet metrics from evidence records.
 * Returns Map with entries only for facets that have evidence;
 * missing facets should be treated as defaults by the caller.
 */
export function computeFacetMetrics(
	evidence: EvidenceInput[],
	config: FormulaConfig = FORMULA_DEFAULTS,
): Map<FacetName, FacetMetrics> {
	const result = new Map<FacetName, FacetMetrics>();
	if (evidence.length === 0) return result;

	// Group by facet → domain
	const byFacet = new Map<FacetName, Map<LifeDomain, { deviations: number[]; weights: number[] }>>();

	for (const e of evidence) {
		let facetMap = byFacet.get(e.bigfiveFacet);
		if (!facetMap) {
			facetMap = new Map();
			byFacet.set(e.bigfiveFacet, facetMap);
		}
		let domainGroup = facetMap.get(e.domain);
		if (!domainGroup) {
			domainGroup = { deviations: [], weights: [] };
			facetMap.set(e.domain, domainGroup);
		}
		domainGroup.deviations.push(e.deviation);
		domainGroup.weights.push(computeFinalWeight(e.strength, e.confidence));
	}

	for (const [facet, domainMap] of byFacet) {
		// Per-domain: weighted mean deviation and context weight
		const domainWeights = new Map<LifeDomain, number>();
		const domainMeans: { weight: number; mean: number }[] = [];

		for (const [domain, group] of domainMap) {
			const wg = computeContextWeight(group.weights);
			const mu = computeContextMean(group.deviations, group.weights, config.epsilon);
			domainWeights.set(domain, wg);
			domainMeans.push({ weight: wg, mean: mu });
		}

		// Facet deviation: D_f = Σ(w_g × μ_g) / Σ(w_g)
		let devNum = 0;
		let devDen = 0;
		for (const { weight, mean } of domainMeans) {
			devNum += weight * mean;
			devDen += weight;
		}
		const D_f = devNum / (devDen + config.epsilon);

		// Map deviation to 0-20 score scale
		const score = config.SCORE_MIDPOINT + D_f * SCALE_FACTOR;

		// Total diversified evidence mass
		const W = Array.from(domainWeights.values()).reduce((a, b) => a + b, 0);

		// Confidence: C_max × (1 - e^{-k × W})
		const confidence = config.C_max * (1 - Math.exp(-config.k * W));

		result.set(facet, { score, confidence, domainWeights });
	}

	return result;
}
