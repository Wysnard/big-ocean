/**
 * Big Five Personality Traits
 *
 * The Big Five model consists of 5 broad personality traits.
 * Each trait is composed of 6 facets (defined in facet.ts).
 *
 * NOTE: Scores are ALWAYS stored on facets. Trait scores are ALWAYS computed from facet scores.
 */

/**
 * Big Five trait names
 */
export type BigFiveTrait =
	| "openness"
	| "conscientiousness"
	| "extraversion"
	| "agreeableness"
	| "neuroticism";

/**
 * All Big Five traits as an array
 */
export const BIG_FIVE_TRAITS: readonly BigFiveTrait[] = [
	"openness",
	"conscientiousness",
	"extraversion",
	"agreeableness",
	"neuroticism",
] as const;

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
