/**
 * Big Five Personality Traits
 *
 * The Big Five model consists of 5 broad personality traits.
 * Each trait is composed of 6 facets (defined in facet.ts).
 *
 * NOTE: Scores are ALWAYS stored on facets. Trait scores are ALWAYS computed from facet scores.
 */

import type { TraitName } from "../constants/big-five";
import { TRAIT_NAMES } from "../constants/big-five";

/** @deprecated Use TraitName from constants/big-five instead */
export type BigFiveTrait = TraitName;

/** @deprecated Use TRAIT_NAMES from constants/big-five instead */
export const BIG_FIVE_TRAITS = TRAIT_NAMES;

/**
 * Computed confidence scores for Big Five personality traits.
 * Values range from 0 (no confidence) to 100 (complete confidence) as integers.
 *
 * NOTE: These are ALWAYS computed from facet scores, never stored directly.
 */
export interface TraitConfidenceScores {
	openness: number;
	conscientiousness: number;
	extraversion: number;
	agreeableness: number;
	neuroticism: number;
}
