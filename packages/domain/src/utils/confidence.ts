/**
 * Confidence Calculation and Initialization Utilities
 *
 * Provides functions for:
 * 1. Calculating assessment confidence scores (0-100 integers)
 * 2. Initializing facet/trait score maps with defaults
 *
 * Confidence is a measure of certainty in personality trait estimates.
 * All confidence values are integers in the range 0-100.
 */

import { ALL_FACETS, type FacetName, TRAIT_NAMES, type TraitName } from "../constants/big-five";
import type {
	FacetScore,
	FacetScoresMap,
	TraitScore,
	TraitScoresMap,
} from "../types/facet-evidence";

// ============================================
// Default Values
// ============================================

/**
 * Default facet score for initialization.
 * Score of 10 (neutral on 0-20 scale) with 0 confidence indicates "not yet assessed".
 */
export const DEFAULT_FACET_SCORE: FacetScore = {
	score: 10,
	confidence: 0,
};

/**
 * Default trait score for initialization.
 * Score of 60 (neutral on 0-120 scale) with 0 confidence indicates "not yet assessed".
 */
export const DEFAULT_TRAIT_SCORE: TraitScore = {
	score: 60,
	confidence: 0,
};

/**
 * Default facet confidence value.
 * 0 indicates no data yet for this facet.
 */
export const DEFAULT_FACET_CONFIDENCE = 0;

/** All 5 trait names (from single source of truth). */
const ALL_TRAITS = TRAIT_NAMES;

// ============================================
// Initialization Functions
// ============================================

/**
 * Create a fully initialized FacetScoresMap with all 30 facets.
 *
 * @param existingScores - Optional existing scores to merge (overrides defaults)
 * @returns Complete FacetScoresMap with all 30 facets
 */
export function createInitialFacetScoresMap(
	existingScores?: Partial<Record<FacetName, FacetScore>>,
): FacetScoresMap {
	const map = {} as FacetScoresMap;

	for (const facet of ALL_FACETS) {
		map[facet] = { ...DEFAULT_FACET_SCORE };
	}

	if (existingScores) {
		for (const [facet, score] of Object.entries(existingScores)) {
			if (score !== undefined) {
				map[facet as FacetName] = score;
			}
		}
	}

	return map;
}

/**
 * Create a fully initialized TraitScoresMap with all 5 traits.
 *
 * @param existingScores - Optional existing scores to merge (overrides defaults)
 * @returns Complete TraitScoresMap with all 5 traits
 */
export function createInitialTraitScoresMap(
	existingScores?: Partial<Record<TraitName, TraitScore>>,
): TraitScoresMap {
	const map = {} as TraitScoresMap;

	for (const trait of ALL_TRAITS) {
		map[trait] = { ...DEFAULT_TRAIT_SCORE };
	}

	if (existingScores) {
		for (const [trait, score] of Object.entries(existingScores)) {
			if (score !== undefined) {
				map[trait as TraitName] = score;
			}
		}
	}

	return map;
}

// ============================================
// Confidence Calculations
// ============================================

/**
 * Trait-level confidence structure.
 * Each trait has a confidence value (0-100 integer).
 */
export interface TraitConfidence {
	openness: number;
	conscientiousness: number;
	extraversion: number;
	agreeableness: number;
	neuroticism: number;
}

/**
 * Calculate overall assessment confidence from trait-level confidence values.
 *
 * Takes the average of all 5 trait confidence values.
 * Used when session has existing trait confidence and we need a single number.
 *
 * @param confidence - Trait-level confidence values, or undefined
 * @returns Overall confidence (0-100 integer), defaults to 50 if undefined
 */
export function calculateOverallConfidence(confidence: TraitConfidence | undefined): number {
	if (!confidence) return 50; // Default confidence

	const values = [
		confidence.openness,
		confidence.conscientiousness,
		confidence.extraversion,
		confidence.agreeableness,
		confidence.neuroticism,
	];

	return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

/**
 * Calculate overall assessment confidence from facet scores.
 *
 * Averages the confidence values across all 30 facets.
 * Used after batch scoring to get updated confidence from new facet data.
 *
 * @param facetScores - Complete map of all 30 facet scores with confidence (0-100 integers)
 * @returns Overall confidence value (0-100 integer)
 */
export function calculateConfidenceFromFacetScores(facetScores: FacetScoresMap): number {
	const values = Object.values(facetScores);
	const avgConfidence = values.reduce((sum, s) => sum + s.confidence, 0) / values.length;

	return Math.round(avgConfidence);
}
