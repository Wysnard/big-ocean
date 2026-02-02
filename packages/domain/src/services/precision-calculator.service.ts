/**
 * Precision Score Calculator Service
 *
 * Scores are ALWAYS stored on facets. Trait scores are ALWAYS computed from facet scores.
 * Trait precision is the average of its component facets.
 */

import type { FacetPrecisionScores } from "../types/facet.js";
import { FACETS_BY_TRAIT } from "../types/facet.js";
import type { TraitPrecisionScores } from "../types/trait.js";
import { BIG_FIVE_TRAITS } from "../types/trait.js";

/**
 * Calculate trait-level precision from facet precision scores.
 * Each trait's precision is the mean of its 6 component facets.
 *
 * NOTE: Trait scores are NEVER stored - always computed from facet scores.
 *
 * @param facetPrecision - Precision scores for all facets (the source of truth)
 * @returns Computed trait-level precision scores (Big Five)
 */
export const calculateTraitPrecision = (
  facetPrecision: FacetPrecisionScores,
): TraitPrecisionScores => {
  const result: Partial<TraitPrecisionScores> = {};

  for (const trait of BIG_FIVE_TRAITS) {
    const facets = FACETS_BY_TRAIT[trait];

    // Calculate mean of all facet precisions for this trait
    const sum = facets.reduce((acc, facet) => {
      return acc + facetPrecision[facet];
    }, 0);

    result[trait] = sum / facets.length;
  }

  return result as TraitPrecisionScores;
};

/**
 * Calculate weighted average of facet precision scores
 * Used to aggregate multiple facet scores with optional weights
 *
 * @param facetScores - Array of facet precision values
 * @param weights - Optional array of weights (must sum to 1 or will be normalized)
 * @returns Weighted average precision score
 */
export const calculateWeightedAverage = (
  facetScores: number[],
  weights?: number[],
): number => {
  if (facetScores.length === 0) return 0;

  if (!weights || weights.length !== facetScores.length) {
    // Equal weighting - simple average
    return facetScores.reduce((a, b) => a + b, 0) / facetScores.length;
  }

  // Normalize weights to sum to 1
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const normalizedWeights = weights.map((w) => w / weightSum);

  // Calculate weighted sum
  let total = 0;
  for (let i = 0; i < facetScores.length; i++) {
    total += facetScores[i]! * (normalizedWeights[i] ?? 0);
  }

  return total;
};

/**
 * Initialize facet precision scores with a baseline value
 * Typically used to initialize new sessions with neutral confidence
 *
 * @param baseline - Initial precision score for all facets (default: 0.5)
 * @returns New FacetPrecisionScores object with all facets set to baseline
 */
export const initializeFacetPrecision = (
  baseline: number = 0.5,
): FacetPrecisionScores => {
  const facets: Array<keyof FacetPrecisionScores> = [
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
    "depressiveness",
    "self_consciousness",
    "immoderation",
    "vulnerability",
  ];

  const result: Partial<FacetPrecisionScores> = {};
  for (const facet of facets) {
    result[facet] = baseline;
  }

  return result as FacetPrecisionScores;
};

/**
 * Update a single facet precision score
 * Ensures the update respects the 0-1 bounds
 *
 * @param facetPrecision - Current facet precision scores
 * @param facet - Facet to update
 * @param newScore - New precision score
 * @returns Updated facet precision scores
 */
export const updateFacetPrecision = (
  facetPrecision: FacetPrecisionScores,
  facet: keyof FacetPrecisionScores,
  newScore: number,
): FacetPrecisionScores => {
  // Clamp score to [0, 1]
  const clampedScore = Math.max(0, Math.min(1, newScore));

  return {
    ...facetPrecision,
    [facet]: clampedScore,
  };
};

/**
 * Merge two precision scores with optional weighting
 * Used for updating precision with new estimates
 *
 * @param current - Current precision scores
 * @param update - Updated precision scores to merge
 * @param weight - How much to weight the update (0-1, default 0.5)
 * @returns Merged precision scores
 */
export const mergePrecisionScores = (
  current: FacetPrecisionScores,
  update: Partial<FacetPrecisionScores>,
  weight: number = 0.5,
): FacetPrecisionScores => {
  const clampedWeight = Math.max(0, Math.min(1, weight));
  const result: Partial<FacetPrecisionScores> = {};

  const allFacets = Object.keys(current) as Array<keyof FacetPrecisionScores>;

  for (const facet of allFacets) {
    const currentValue = current[facet];
    const updateValue =
      update[facet] !== undefined ? update[facet] : currentValue;

    // Weighted average of current and update
    result[facet] =
      currentValue * (1 - clampedWeight) + updateValue * clampedWeight;
  }

  return result as FacetPrecisionScores;
};
