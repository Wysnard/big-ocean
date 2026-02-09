/**
 * Big Five Personality Facets
 *
 * Each of the Big Five traits is composed of 6 facets.
 * Facets represent specific sub-dimensions of the broader trait.
 *
 * NOTE: Scores are ALWAYS stored on facets. Trait scores are ALWAYS computed from facet scores.
 */

import type { BigFiveTrait } from "./trait";

/**
 * Openness facets - tendency to seek new experiences and ideas
 */
export type OpennessFacet =
	| "imagination" // Tendency to imagine and think abstractly
	| "artistic_interests" // Appreciation for art, beauty, and aesthetic experiences
	| "emotionality" // Depth of emotional experience and expression
	| "adventurousness" // Willingness to try new things and take risks
	| "intellect" // Interest in intellectual pursuits and abstract ideas
	| "liberalism"; // Openness to questioning authority and tradition

/**
 * Conscientiousness facets - tendency to be organized and reliable
 */
export type ConscientiousnessFacet =
	| "self_efficacy" // Belief in one's ability to accomplish goals
	| "orderliness" // Preference for organized and structured environments
	| "dutifulness" // Sense of responsibility and obligation
	| "achievement_striving" // Drive to succeed and achieve goals
	| "self_discipline" // Ability to stay focused and motivated
	| "cautiousness"; // Tendency to think before acting

/**
 * Extraversion facets - tendency to be outgoing and social
 */
export type ExtravertFacet =
	| "friendliness" // Warmth and comfort in social situations
	| "gregariousness" // Preference for being with others
	| "assertiveness" // Tendency to be direct and take charge
	| "activity_level" // Energy and pace of life
	| "excitement_seeking" // Preference for stimulation and arousal
	| "cheerfulness"; // Tendency toward positive emotions

/**
 * Agreeableness facets - tendency to be cooperative and compassionate
 */
export type AgreeableFacet =
	| "trust" // Tendency to believe others are honest and well-intentioned
	| "morality" // Straightforwardness and preference for honesty
	| "altruism" // Willingness to help and cooperate with others
	| "cooperation" // Preference for harmony and agreement
	| "modesty" // Tendency to be humble and not boast
	| "sympathy"; // Concern for others' welfare

/**
 * Neuroticism facets - tendency to experience negative emotions
 */
export type NeuroticismFacet =
	| "anxiety" // Tendency to worry and experience nervousness
	| "anger" // Tendency to experience frustration and irritability
	| "depression" // Depression: Tendency toward sadness and hopelessness
	| "self_consciousness" // Sensitivity to criticism and embarrassment
	| "immoderation" // Difficulty controlling urges and impulses
	| "vulnerability"; // Susceptibility to stress and overwhelm

/**
 * All Big Five facets
 */
export type BigFiveFacet =
	| OpennessFacet
	| ConscientiousnessFacet
	| ExtravertFacet
	| AgreeableFacet
	| NeuroticismFacet;

/**
 * Facet confidence - confidence level (0-100 integer) for each facet
 */
export interface FacetConfidenceScores {
	// Openness facets
	imagination: number;
	artistic_interests: number;
	emotionality: number;
	adventurousness: number;
	intellect: number;
	liberalism: number;

	// Conscientiousness facets
	self_efficacy: number;
	orderliness: number;
	dutifulness: number;
	achievement_striving: number;
	self_discipline: number;
	cautiousness: number;

	// Extraversion facets
	friendliness: number;
	gregariousness: number;
	assertiveness: number;
	activity_level: number;
	excitement_seeking: number;
	cheerfulness: number;

	// Agreeableness facets
	trust: number;
	morality: number;
	altruism: number;
	cooperation: number;
	modesty: number;
	sympathy: number;

	// Neuroticism facets
	anxiety: number;
	anger: number;
	depression: number;
	self_consciousness: number;
	immoderation: number;
	vulnerability: number;
}

/**
 * Mapping from Big Five traits to their component facets.
 * Scores are ALWAYS stored on facets. Trait scores are ALWAYS computed from facet scores.
 */
export const FACETS_BY_TRAIT: Record<BigFiveTrait, Array<keyof FacetConfidenceScores>> = {
	openness: [
		"imagination",
		"artistic_interests",
		"emotionality",
		"adventurousness",
		"intellect",
		"liberalism",
	],
	conscientiousness: [
		"self_efficacy",
		"orderliness",
		"dutifulness",
		"achievement_striving",
		"self_discipline",
		"cautiousness",
	],
	extraversion: [
		"friendliness",
		"gregariousness",
		"assertiveness",
		"activity_level",
		"excitement_seeking",
		"cheerfulness",
	],
	agreeableness: ["trust", "morality", "altruism", "cooperation", "modesty", "sympathy"],
	neuroticism: [
		"anxiety",
		"anger",
		"depression",
		"self_consciousness",
		"immoderation",
		"vulnerability",
	],
} as const;
