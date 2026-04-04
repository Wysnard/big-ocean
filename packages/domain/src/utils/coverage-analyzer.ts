/**
 * Coverage Analyzer — Evidence-to-Target Pure Function (Story 43-2)
 *
 * Analyzes conversation evidence and identifies the weakest personality facets
 * in the weakest life domain. Returns coverage targets for the Director to steer
 * the conversation toward unexplored territory.
 *
 * Pure function — no DI, no repository, no side effects.
 */
import { ALL_FACETS, type FacetName, OCEAN_INTERLEAVED_ORDER } from "../constants/big-five";
import { FACET_PROMPT_DEFINITIONS } from "../constants/facet-prompt-definitions";
import {
	LIFE_DOMAIN_DEFINITIONS,
	type LifeDomain,
	STEERABLE_DOMAINS,
} from "../constants/life-domain";
import type { EvidenceInput } from "../types/evidence";
import { computeFinalWeight, FORMULA_DEFAULTS, type FormulaConfig } from "./formula";

// ─── Types ──────────────────────────────────────────────────────────

export interface CoverageTarget {
	readonly targetFacets: FacetName[];
	readonly targetDomain: LifeDomain;
}

export interface CoverageTargetWithDefinitions {
	readonly targetFacets: ReadonlyArray<{ readonly facet: FacetName; readonly definition: string }>;
	readonly targetDomain: { readonly domain: LifeDomain; readonly definition: string };
}

// ─── Core Function ──────────────────────────────────────────────────

/**
 * Analyze evidence coverage and return the weakest domain + 3 weakest facets.
 *
 * Algorithm:
 * 1. Group evidence by (domain, facet), compute per-pair evidence mass W
 * 2. Compute per-pair confidence: C_max × (1 - e^{-k × W})
 * 3. For each steerable domain, find the 3 lowest-confidence facets (bottom-3)
 * 4. Select domain with lowest bottom-3 average
 * 5. Tiebreak: full-domain average (weakest wins), then STEERABLE_DOMAINS order
 * 6. Return { targetDomain, targetFacets: [3 weakest facets in that domain] }
 */
export function analyzeCoverage(
	evidence: EvidenceInput[],
	config: FormulaConfig = FORMULA_DEFAULTS,
): CoverageTarget {
	// Step 1: Build per-(domain, facet) evidence mass
	const massMap = new Map<string, number>();

	for (const e of evidence) {
		const key = `${e.domain}|${e.bigfiveFacet}`;
		const weight = computeFinalWeight(e.strength, e.confidence);
		massMap.set(key, (massMap.get(key) ?? 0) + weight);
	}

	// Step 2: Compute per-(domain, facet) confidence
	const confidenceMap = new Map<string, number>();
	for (const [key, W] of massMap) {
		const confidence = config.C_max * (1 - Math.exp(-config.k * W));
		confidenceMap.set(key, confidence);
	}

	// Helper: get confidence for a (domain, facet) pair
	const getConfidence = (domain: string, facet: FacetName): number =>
		confidenceMap.get(`${domain}|${facet}`) ?? 0;

	// Step 3-4: For each steerable domain, compute bottom-3 avg and full avg
	let bestDomain: LifeDomain = STEERABLE_DOMAINS[0] as LifeDomain;
	let bestBottom3Avg = Number.POSITIVE_INFINITY;
	let bestFullAvg = Number.POSITIVE_INFINITY;

	for (const domain of STEERABLE_DOMAINS) {
		// Get all facet confidences for this domain, sorted ascending
		const facetConfidences = ALL_FACETS.map((facet) => getConfidence(domain, facet));
		const sorted = [...facetConfidences].sort((a, b) => a - b);

		// Bottom-3 average
		const bottom3Sum = (sorted[0] ?? 0) + (sorted[1] ?? 0) + (sorted[2] ?? 0);
		const bottom3Avg = bottom3Sum / 3;

		// Full-domain average
		const fullSum = facetConfidences.reduce((a, b) => a + b, 0);
		const fullAvg = fullSum / facetConfidences.length;

		// Select domain with lowest bottom-3 avg, tiebreak on full avg, then array order
		if (bottom3Avg < bestBottom3Avg || (bottom3Avg === bestBottom3Avg && fullAvg < bestFullAvg)) {
			bestBottom3Avg = bottom3Avg;
			bestFullAvg = fullAvg;
			bestDomain = domain as LifeDomain;
		}
	}

	// Step 5: Find the 3 lowest-confidence facets in the selected domain
	// Tiebreak: OCEAN_INTERLEAVED_ORDER index (lower index = higher priority)
	const facetsByConfidence = ALL_FACETS.map((facet) => ({
		facet,
		confidence: getConfidence(bestDomain, facet),
		interleavedIndex: OCEAN_INTERLEAVED_ORDER.indexOf(facet),
	})).sort((a, b) => {
		if (a.confidence !== b.confidence) return a.confidence - b.confidence;
		return a.interleavedIndex - b.interleavedIndex;
	});

	const targetFacets = facetsByConfidence.slice(0, 3).map((f) => f.facet);

	return { targetDomain: bestDomain, targetFacets };
}

// ─── Definition Enrichment ──────────────────────────────────────────

/**
 * Pair coverage targets with behavioral definitions for injection into
 * the Director prompt (~100-150 tokens of context).
 */
export function enrichWithDefinitions(target: CoverageTarget): CoverageTargetWithDefinitions {
	return {
		targetFacets: target.targetFacets.map((facet) => ({
			facet,
			definition: FACET_PROMPT_DEFINITIONS[facet],
		})),
		targetDomain: {
			domain: target.targetDomain,
			definition: LIFE_DOMAIN_DEFINITIONS[target.targetDomain],
		},
	};
}
