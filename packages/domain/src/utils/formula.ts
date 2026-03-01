/**
 * Formula Functions — Facet Metrics & Steering Target (Story 10.3)
 *
 * Pure domain functions that compute facet metrics and steering targets
 * from evidence. Deterministic, testable, zero-LLM-cost.
 */
import type { FacetName } from "../constants/big-five";
import type { LifeDomain } from "../constants/life-domain";
import { STEERABLE_DOMAINS } from "../constants/life-domain";
import type { EvidenceInput } from "../types/evidence";

// ─── Types ───────────────────────────────────────────────────────────

export interface FormulaConfig {
	readonly C_max: number;
	readonly k: number;
	readonly C_target: number;
	readonly P_target: number;
	readonly alpha: number;
	readonly beta: number;
	readonly betaVolume: number;
	readonly eta: number;
	readonly lambda: number;
	readonly cBar: number;
	readonly epsilon: number;
	readonly SCORE_MIDPOINT: number;
}

export interface FacetMetrics {
	readonly score: number;
	readonly confidence: number;
	readonly signalPower: number;
	/** Per-domain context weights (w_g) — used by steering for exact ΔP computation */
	readonly domainWeights: ReadonlyMap<LifeDomain, number>;
}

export interface SteeringTarget {
	readonly targetFacet: FacetName;
	readonly targetDomain: LifeDomain;
	readonly steeringHint: string;
	readonly bestPriority: number;
}

// ─── Constants ───────────────────────────────────────────────────────

export const FORMULA_DEFAULTS = Object.freeze({
	C_max: 0.9,
	k: 0.7,
	C_target: 0.75,
	P_target: 0.5,
	alpha: 1.0,
	beta: 0.8,
	betaVolume: 0.7,
	eta: 0.3,
	lambda: 0.3,
	cBar: 0.5,
	epsilon: 1e-10,
	SCORE_MIDPOINT: 10,
}) satisfies FormulaConfig;

export const GREETING_SEED_POOL = [
	{ domain: "leisure", facet: "imagination" },
	{ domain: "relationships", facet: "gregariousness" },
	{ domain: "work", facet: "achievement_striving" },
	{ domain: "solo", facet: "self_consciousness" },
	{ domain: "family", facet: "altruism" },
] as const satisfies readonly { domain: LifeDomain; facet: FacetName }[];

// ─── Helper Functions ────────────────────────────────────────────────

/** Anti-redundancy context weight: √(Σ c_i) for a domain group */
export function computeContextWeight(confidences: number[]): number {
	const sum = confidences.reduce((acc, c) => acc + c, 0);
	return Math.sqrt(sum);
}

/** Weighted mean: Σ(c_i × x_i) / Σ(c_i) with epsilon safety */
export function computeContextMean(
	scores: number[],
	confidences: number[],
	epsilon: number = FORMULA_DEFAULTS.epsilon,
): number {
	let num = 0;
	let den = 0;
	for (let i = 0; i < scores.length; i++) {
		const c = confidences[i] ?? 0;
		const s = scores[i] ?? 0;
		num += c * s;
		den += c;
	}
	return num / (den + epsilon);
}

/** Normalized entropy: -Σ(p_g × ln(p_g)) / ln(|G|) */
export function computeNormalizedEntropy(weights: number[]): number {
	const nonZero = weights.filter((w) => w > 0);
	if (nonZero.length <= 1) return 0;

	const total = nonZero.reduce((a, b) => a + b, 0);
	let entropy = 0;
	for (const w of nonZero) {
		const p = w / total;
		entropy -= p * Math.log(p);
	}
	return entropy / Math.log(nonZero.length);
}

/** Projected entropy with hypothetical updated weight for a target domain */
export function computeProjectedEntropy(
	currentWeights: ReadonlyMap<LifeDomain, number>,
	targetDomain: LifeDomain,
	deltaW: number,
): number {
	const projected: number[] = [];
	let found = false;
	for (const [domain, w] of currentWeights) {
		if (domain === targetDomain) {
			projected.push(w + deltaW);
			found = true;
		} else {
			projected.push(w);
		}
	}
	if (!found) {
		projected.push(deltaW);
	}
	return computeNormalizedEntropy(projected);
}

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
	const byFacet = new Map<FacetName, Map<LifeDomain, { scores: number[]; confidences: number[] }>>();

	for (const e of evidence) {
		let facetMap = byFacet.get(e.bigfiveFacet);
		if (!facetMap) {
			facetMap = new Map();
			byFacet.set(e.bigfiveFacet, facetMap);
		}
		let domainGroup = facetMap.get(e.domain);
		if (!domainGroup) {
			domainGroup = { scores: [], confidences: [] };
			facetMap.set(e.domain, domainGroup);
		}
		domainGroup.scores.push(e.score);
		domainGroup.confidences.push(e.confidence);
	}

	for (const [facet, domainMap] of byFacet) {
		// Per-domain: weighted mean and context weight
		const domainWeights = new Map<LifeDomain, number>();
		const domainMeans: { weight: number; mean: number }[] = [];

		for (const [domain, group] of domainMap) {
			const wg = computeContextWeight(group.confidences);
			const mu = computeContextMean(group.scores, group.confidences, config.epsilon);
			domainWeights.set(domain, wg);
			domainMeans.push({ weight: wg, mean: mu });
		}

		// Facet score: Σ(w_g × μ_g) / Σ(w_g)
		let scoreNum = 0;
		let scoreDen = 0;
		for (const { weight, mean } of domainMeans) {
			scoreNum += weight * mean;
			scoreDen += weight;
		}
		const score = scoreNum / (scoreDen + config.epsilon);

		// Total diversified evidence mass
		const W = Array.from(domainWeights.values()).reduce((a, b) => a + b, 0);

		// Confidence: C_max × (1 - e^{-k × W})
		const confidence = config.C_max * (1 - Math.exp(-config.k * W));

		// Signal power: V × D
		const weightsArray = Array.from(domainWeights.values());
		const D = computeNormalizedEntropy(weightsArray);
		const V = 1 - Math.exp(-config.betaVolume * W);
		const signalPower = V * D;

		result.set(facet, { score, confidence, signalPower, domainWeights });
	}

	return result;
}

/**
 * Compute steering target: which facet to explore and in which life domain.
 * Returns a deterministic greeting seed when no evidence exists.
 */
export function computeSteeringTarget(
	metrics: Map<FacetName, FacetMetrics>,
	previousDomain: LifeDomain | null,
	config: FormulaConfig = FORMULA_DEFAULTS,
	seedIndex?: number,
): SteeringTarget {
	// Cold start: no evidence
	if (metrics.size === 0) {
		const idx = (seedIndex ?? 0) % GREETING_SEED_POOL.length;
		const seed = GREETING_SEED_POOL[idx]!;
		return {
			targetFacet: seed.facet,
			targetDomain: seed.domain,
			steeringHint: `Start exploring ${seed.domain} — discover their ${formatFacetName(seed.facet)}`,
			bestPriority: 0,
		};
	}

	// Step 1: Facet Priority
	let bestFacet: FacetName | null = null;
	let bestPriority = -1;
	let lowestConfidence = Number.POSITIVE_INFINITY;
	let lowestConfidenceFacet: FacetName | null = null;

	for (const [facet, m] of metrics) {
		const priority =
			config.alpha * Math.max(0, config.C_target - m.confidence) +
			config.beta * Math.max(0, config.P_target - m.signalPower);

		if (m.confidence < lowestConfidence) {
			lowestConfidence = m.confidence;
			lowestConfidenceFacet = facet;
		}

		if (priority > bestPriority) {
			bestPriority = priority;
			bestFacet = facet;
		}
	}

	// Tiebreaker: if all priorities are 0, pick lowest confidence
	if (bestPriority === 0 && lowestConfidenceFacet) {
		bestFacet = lowestConfidenceFacet;
	}

	const targetFacet = bestFacet as FacetName;
	const facetMetrics = metrics.get(targetFacet);
	if (!facetMetrics) {
		const seed = GREETING_SEED_POOL[0]!;
		return {
			targetFacet: seed.facet,
			targetDomain: seed.domain,
			steeringHint: `Start exploring ${seed.domain} — discover their ${formatFacetName(seed.facet)}`,
			bestPriority: 0,
		};
	}

	// Step 2: Domain selection via expected signal power gain (exact weights)
	// biome-ignore lint/style/noNonNullAssertion: STEERABLE_DOMAINS is a compile-time constant with 5 elements
	let bestDomain: LifeDomain = STEERABLE_DOMAINS[0]!;
	let bestScore = Number.NEGATIVE_INFINITY;

	const currentP = facetMetrics.signalPower;
	const dw = facetMetrics.domainWeights;
	const W = Array.from(dw.values()).reduce((a, b) => a + b, 0);

	for (const domain of STEERABLE_DOMAINS) {
		// Exact current weight for this domain (0 if no evidence)
		const wCurrent = dw.get(domain) ?? 0;

		// Estimated mass delta: Δw_g ≈ √(w_{f,g}² + c̄) - w_{f,g}
		const deltaW = Math.sqrt(wCurrent * wCurrent + config.cBar) - wCurrent;

		// Projected total mass
		const Wprime = W + deltaW;

		// Projected volume
		const Vprime = 1 - Math.exp(-config.betaVolume * Wprime);

		// Projected diversity (exact: uses real domain weights + hypothetical delta)
		const Dprime = computeProjectedEntropy(dw, domain, deltaW);

		// Expected gain
		const deltaP = Vprime * Dprime - currentP;

		// Switch cost: SwitchCost(g) = 0 if same domain or no previous, else 1
		const switchCost = domain === previousDomain || previousDomain === null ? 0 : 1;
		const score = deltaP - config.lambda * switchCost;

		if (score > bestScore) {
			bestScore = score;
			bestDomain = domain;
		}
	}

	const steeringHint = `Bridge to ${bestDomain} — explore ${formatFacetName(targetFacet)}`;

	return {
		targetFacet,
		targetDomain: bestDomain,
		steeringHint,
		bestPriority,
	};
}

// ─── Internal Helpers ────────────────────────────────────────────────

function formatFacetName(facet: FacetName): string {
	return facet.replace(/_/g, " ");
}
