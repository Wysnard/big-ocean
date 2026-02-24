/**
 * Score Computation — Pure domain functions (Story 11.3)
 *
 * Computes facet results, trait results, and domain coverage
 * from finalization evidence. Wraps computeFacetMetrics() to
 * ensure all 30 facets are present (defaulting missing ones).
 */
import {
	ALL_FACETS,
	type FacetName,
	TRAIT_NAMES,
	TRAIT_TO_FACETS,
	type TraitName,
} from "../constants/big-five";
import { LIFE_DOMAINS, type LifeDomain } from "../constants/life-domain";
import type { EvidenceInput } from "../types/evidence";
import { computeFacetMetrics, FORMULA_DEFAULTS } from "./formula";

export interface FacetResult {
	readonly score: number;
	readonly confidence: number;
	readonly signalPower: number;
}

export interface TraitResult {
	readonly score: number;
	readonly confidence: number;
	readonly signalPower: number;
}

/**
 * Compute results for all 30 facets from evidence.
 * Missing facets receive defaults: score = SCORE_MIDPOINT, confidence = 0, signalPower = 0.
 */
export function computeAllFacetResults(evidence: EvidenceInput[]): Record<FacetName, FacetResult> {
	const metrics = computeFacetMetrics(evidence);
	const result = {} as Record<FacetName, FacetResult>;

	for (const facet of ALL_FACETS) {
		const m = metrics.get(facet);
		if (m) {
			result[facet] = { score: m.score, confidence: m.confidence, signalPower: m.signalPower };
		} else {
			result[facet] = { score: FORMULA_DEFAULTS.SCORE_MIDPOINT, confidence: 0, signalPower: 0 };
		}
	}

	return result;
}

/**
 * Derive trait results from facet results.
 * Each trait = average of its 6 facets' score, confidence, signalPower.
 */
export function computeTraitResults(
	facets: Record<FacetName, FacetResult>,
): Record<TraitName, TraitResult> {
	const result = {} as Record<TraitName, TraitResult>;

	for (const trait of TRAIT_NAMES) {
		const traitFacets = TRAIT_TO_FACETS[trait];
		let scoreSum = 0;
		let confidenceSum = 0;
		let signalPowerSum = 0;

		for (const facet of traitFacets) {
			const f = facets[facet];
			scoreSum += f.score;
			confidenceSum += f.confidence;
			signalPowerSum += f.signalPower;
		}

		const count = traitFacets.length;
		result[trait] = {
			score: scoreSum / count,
			confidence: confidenceSum / count,
			signalPower: signalPowerSum / count,
		};
	}

	return result;
}

/**
 * Compute domain coverage from evidence.
 * Returns normalized distribution (sums to ~1.0) across all 6 life domains.
 * Zero evidence → all zeros.
 */
export function computeDomainCoverage(evidence: EvidenceInput[]): Record<LifeDomain, number> {
	const counts = {} as Record<LifeDomain, number>;
	for (const domain of LIFE_DOMAINS) {
		counts[domain] = 0;
	}

	for (const e of evidence) {
		counts[e.domain] = (counts[e.domain] ?? 0) + 1;
	}

	const total = evidence.length;
	if (total === 0) return counts;

	const result = {} as Record<LifeDomain, number>;
	for (const domain of LIFE_DOMAINS) {
		result[domain] = counts[domain] / total;
	}

	return result;
}
