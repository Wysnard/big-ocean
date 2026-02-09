/**
 * Confidence Score Calculator Service
 *
 * Scores are ALWAYS stored on facets. Trait scores are ALWAYS computed from facet scores.
 * Trait confidence is the average of its component facets.
 *
 * All confidence values are integers in the range 0-100.
 */

import type { FacetConfidenceScores } from "../types/facet";
import { FACETS_BY_TRAIT } from "../types/facet";
import type { TraitConfidenceScores } from "../types/trait";
import { BIG_FIVE_TRAITS } from "../types/trait";

/**
 * Calculate trait-level confidence from facet confidence scores.
 * Each trait's confidence is the mean of its 6 component facets.
 *
 * NOTE: Trait scores are NEVER stored - always computed from facet scores.
 *
 * @param facetConfidence - Confidence scores for all facets (0-100 integers, the source of truth)
 * @returns Computed trait-level confidence scores (0-100 integers, Big Five)
 */
export const calculateTraitConfidence = (
	facetConfidence: FacetConfidenceScores,
): TraitConfidenceScores => {
	const result: Partial<TraitConfidenceScores> = {};

	for (const trait of BIG_FIVE_TRAITS) {
		const facets = FACETS_BY_TRAIT[trait];

		// Calculate mean of all facet confidences for this trait
		const sum = facets.reduce((acc, facet) => {
			return acc + facetConfidence[facet];
		}, 0);

		result[trait] = Math.round(sum / facets.length);
	}

	return result as TraitConfidenceScores;
};

/**
 * Calculate weighted average of facet confidence scores
 * Used to aggregate multiple facet scores with optional weights
 *
 * @param facetScores - Array of facet confidence values (0-100 integers)
 * @param weights - Optional array of weights (must sum to 1 or will be normalized)
 * @returns Weighted average confidence score (0-100 integer)
 */
export const calculateWeightedAverage = (facetScores: number[], weights?: number[]): number => {
	if (facetScores.length === 0) return 0;

	if (!weights || weights.length !== facetScores.length) {
		// Equal weighting - simple average
		return Math.round(facetScores.reduce((a, b) => a + b, 0) / facetScores.length);
	}

	// Normalize weights to sum to 1
	const weightSum = weights.reduce((a, b) => a + b, 0);
	const normalizedWeights = weights.map((w) => w / weightSum);

	// Calculate weighted sum
	let total = 0;
	for (let i = 0; i < facetScores.length; i++) {
		// biome-ignore lint/style/noNonNullAssertion: i is bounded by array length
		total += facetScores[i]! * (normalizedWeights[i] ?? 0);
	}

	return Math.round(total);
};

/**
 * Initialize facet confidence scores with a baseline value
 * Typically used to initialize new sessions with neutral confidence
 *
 * @param baseline - Initial confidence score for all facets (0-100 integer, default: 50)
 * @returns New FacetConfidenceScores object with all facets set to baseline
 */
export const initializeFacetConfidence = (baseline: number = 50): FacetConfidenceScores => {
	const facets: Array<keyof FacetConfidenceScores> = [
		// Openness
		"imagination",
		"artistic_interests",
		"emotionality",
		"adventurousness",
		"intellect",
		"liberalism",
		// Conscientiousness
		"self_efficacy",
		"orderliness",
		"dutifulness",
		"achievement_striving",
		"self_discipline",
		"cautiousness",
		// Extraversion
		"friendliness",
		"gregariousness",
		"assertiveness",
		"activity_level",
		"excitement_seeking",
		"cheerfulness",
		// Agreeableness
		"trust",
		"morality",
		"altruism",
		"cooperation",
		"modesty",
		"sympathy",
		// Neuroticism
		"anxiety",
		"anger",
		"depression",
		"self_consciousness",
		"immoderation",
		"vulnerability",
	];

	const result: Partial<FacetConfidenceScores> = {};
	for (const facet of facets) {
		result[facet] = baseline;
	}

	return result as FacetConfidenceScores;
};

/**
 * Update a single facet confidence score
 * Ensures the update respects the 0-100 bounds
 *
 * @param facetConfidence - Current facet confidence scores
 * @param facet - Facet to update
 * @param newScore - New confidence score (0-100 integer)
 * @returns Updated facet confidence scores
 */
export const updateFacetConfidence = (
	facetConfidence: FacetConfidenceScores,
	facet: keyof FacetConfidenceScores,
	newScore: number,
): FacetConfidenceScores => {
	// Clamp score to [0, 100]
	const clampedScore = Math.max(0, Math.min(100, Math.round(newScore)));

	return {
		...facetConfidence,
		[facet]: clampedScore,
	};
};

/**
 * Merge two confidence scores with optional weighting
 * Used for updating confidence with new estimates
 *
 * @param current - Current confidence scores (0-100 integers)
 * @param update - Updated confidence scores to merge (0-100 integers)
 * @param weight - How much to weight the update (0-1, default 0.5)
 * @returns Merged confidence scores (0-100 integers)
 */
export const mergeConfidenceScores = (
	current: FacetConfidenceScores,
	update: Partial<FacetConfidenceScores>,
	weight: number = 0.5,
): FacetConfidenceScores => {
	const clampedWeight = Math.max(0, Math.min(1, weight));
	const result: Partial<FacetConfidenceScores> = {};

	const allFacets = Object.keys(current) as Array<keyof FacetConfidenceScores>;

	for (const facet of allFacets) {
		const currentValue = current[facet];
		const updateValue = update[facet] !== undefined ? update[facet] : currentValue;

		// Weighted average of current and update
		result[facet] = Math.round(currentValue * (1 - clampedWeight) + updateValue * clampedWeight);
	}

	return result as FacetConfidenceScores;
};
