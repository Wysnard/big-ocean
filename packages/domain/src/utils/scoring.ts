/**
 * Pure Scoring Functions
 *
 * Compute facet and trait scores on-demand from raw evidence.
 * These are pure functions with zero infrastructure dependencies.
 *
 * Algorithm:
 * 1. Group evidence by facetName
 * 2. Calculate weighted average: confidence x (1 + position x 0.1) for recency bias
 * 3. Detect contradictions via variance (>15 = confidence penalty)
 * 4. Derive trait scores: sum of 6 facets (0-120 scale), minimum confidence
 *
 * @see packages/domain/src/types/facet-evidence.ts
 */

import { ALL_FACETS, type FacetName, TRAIT_TO_FACETS, type TraitName } from "../constants/big-five";
import type {
	FacetScore,
	FacetScoresMap,
	SavedFacetEvidence,
	TraitScoresMap,
} from "../types/facet-evidence";
import { DEFAULT_FACET_SCORE } from "./confidence";

/**
 * Calculate sum of numbers
 */
function sum(values: number[]): number {
	return values.reduce((acc, val) => acc + val, 0);
}

/**
 * Calculate mean of numbers
 */
function mean(values: number[]): number {
	if (values.length === 0) return 0;
	return sum(values) / values.length;
}

/**
 * Calculate variance (measure of spread/contradiction)
 */
function variance(values: number[]): number {
	if (values.length < 2) return 0;
	const avg = mean(values);
	const squaredDiffs = values.map((val) => (val - avg) ** 2);
	return mean(squaredDiffs);
}

/**
 * Clamp value to range
 */
function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/**
 * Aggregate evidence for a single facet into a score.
 *
 * @param evidence - Array of evidence records for one facet, sorted oldest-first
 * @returns Aggregated score and confidence
 */
function aggregateFacet(evidence: SavedFacetEvidence[]): FacetScore {
	// Sort by createdAt (oldest first) for recency weighting
	const sorted = [...evidence].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

	// Calculate weighted average with recency bias
	let weightedSum = 0;
	let weightTotal = 0;

	sorted.forEach((e, idx) => {
		// Weight = confidence x (1 + position x 0.1)
		// Recent messages get 10% boost per position
		// Confidence is already 0-100, normalize to 0-1 for weighting calculation
		const confidenceNormalized = e.confidence / 100;
		const recencyBoost = 1 + idx * 0.1;
		const weight = confidenceNormalized * recencyBoost;

		weightedSum += e.score * weight;
		weightTotal += weight;
	});

	const aggregatedScore = weightTotal > 0 ? weightedSum / weightTotal : 0;

	// Calculate variance for contradiction detection
	const scores = sorted.map((e) => e.score);
	const varianceValue = variance(scores);

	// Calculate average confidence (work with 0-100 integers)
	const confidences = sorted.map((e) => e.confidence);
	const avgConfidence = mean(confidences);

	// Adjust confidence based on variance and sample size (0-100 scale)
	let adjustedConfidence = avgConfidence;

	// High variance (>15) indicates contradictions -> lower confidence
	if (varianceValue > 15) {
		adjustedConfidence -= 30; // -30 points on 0-100 scale
	}

	// Clamp to 0-100 integer range
	adjustedConfidence = Math.round(clamp(adjustedConfidence, 0, 100));

	return {
		score: Math.round(aggregatedScore * 10) / 10, // Round to 1 decimal
		confidence: adjustedConfidence, // Already 0-100 integer
	};
}

/**
 * Aggregate facet scores from raw evidence records.
 *
 * Groups evidence by facet name, computes weighted averages with recency bias,
 * and detects contradictions via variance analysis.
 *
 * @param evidence - All evidence records for a session
 * @returns Complete FacetScoresMap with all 30 facets
 *
 * @example
 * ```typescript
 * const evidence = await getEvidenceBySession(sessionId);
 * const facetScores = aggregateFacetScores(evidence);
 * // { imagination: { score: 16.5, confidence: 85 }, ... }
 * ```
 */
export function aggregateFacetScores(evidence: SavedFacetEvidence[]): FacetScoresMap {
	// Group evidence by facetName
	const evidenceByFacet = new Map<string, SavedFacetEvidence[]>();
	for (const row of evidence) {
		const existing = evidenceByFacet.get(row.facetName) || [];
		existing.push(row);
		evidenceByFacet.set(row.facetName, existing);
	}

	// Initialize full map with defaults, then update with aggregated evidence
	const facetScores = {} as FacetScoresMap;
	for (const facet of ALL_FACETS) {
		facetScores[facet] = { ...DEFAULT_FACET_SCORE };
	}

	for (const [facetName, facetEvidence] of evidenceByFacet.entries()) {
		facetScores[facetName as FacetName] = aggregateFacet(facetEvidence);
	}

	return facetScores;
}

/**
 * Derive trait scores from aggregated facet scores.
 *
 * Each trait score is the sum of its 6 constituent facet scores (0-120 scale).
 * Trait confidence is the minimum confidence across its 6 facets (conservative estimate).
 *
 * @param facetScores - Complete map of all 30 facet scores
 * @returns Complete TraitScoresMap with all 5 traits
 *
 * @example
 * ```typescript
 * const traitScores = deriveTraitScores(facetScores);
 * // { openness: { score: 90.5, confidence: 72 }, ... }
 * ```
 */
export function deriveTraitScores(facetScores: FacetScoresMap): TraitScoresMap {
	const traitScores = {} as TraitScoresMap;

	for (const traitName of Object.keys(TRAIT_TO_FACETS) as TraitName[]) {
		const facetNames = TRAIT_TO_FACETS[traitName];

		// Get scores for all 6 facets belonging to this trait
		const facetsForTrait = facetNames.map((fn) => facetScores[fn]);

		// Trait score = sum of facet scores (0-120 scale for stacked visualization)
		const traitScore = sum(facetsForTrait.map((f) => f.score));

		// Trait confidence = minimum confidence (conservative estimate)
		const traitConfidence = Math.min(...facetsForTrait.map((f) => f.confidence));

		traitScores[traitName] = {
			score: Math.round(traitScore * 10) / 10, // Round to 1 decimal
			confidence: Math.round(traitConfidence), // Already 0-100 integer, just ensure it's rounded
		};
	}

	return traitScores;
}
