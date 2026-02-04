/**
 * Facet Steering Hints for Personality Assessment
 *
 * Maps each of 30 Big Five facets to natural conversation steering hints.
 * Used by the orchestrator to guide Nerin toward exploring low-confidence areas
 * without directly asking about personality traits.
 *
 * The steering target is determined via outlier detection:
 * - Calculate mean and stddev of all facet confidences
 * - Find facets with confidence < (mean - stddev)
 * - Return the single weakest outlier (lowest confidence)
 *
 * @see Story 2-4: LangGraph State Machine and Orchestration
 */

import type { FacetName } from "@workspace/domain";

/**
 * Natural conversation steering hints for each facet.
 *
 * Each hint suggests a topic or angle for Nerin to explore
 * that naturally elicits signals for that facet without
 * being clinical or obvious about personality assessment.
 */
export const FACET_STEERING_HINTS: Record<FacetName, string> = {
	// Openness facets
	imagination: "Ask about daydreaming, creative scenarios, or 'what if' thinking",
	artistic_interests: "Explore appreciation for art, music, literature, or beauty",
	emotionality: "Discuss emotional experiences, depth of feelings, or sensitivity",
	adventurousness: "Ask about trying new things, travel, or unfamiliar experiences",
	intellect: "Explore curiosity about ideas, philosophy, or abstract concepts",
	liberalism: "Discuss openness to different viewpoints or unconventional ideas",

	// Conscientiousness facets
	self_efficacy: "Ask about confidence in handling challenges or achieving goals",
	orderliness: "Explore how they organize their space, time, or belongings",
	dutifulness: "Discuss keeping commitments, following rules, or obligations",
	achievement_striving: "Ask about goals, ambitions, or drive for excellence",
	self_discipline: "Explore staying focused on tasks or resisting distractions",
	cautiousness: "Discuss decision-making process, planning, or risk evaluation",

	// Extraversion facets
	friendliness: "Ask about warmth toward others or making new connections",
	gregariousness: "Explore preference for social gatherings vs solitude",
	assertiveness: "Discuss taking charge, speaking up, or leading",
	activity_level: "Ask about pace of life, busyness, or energy levels",
	excitement_seeking: "Explore thrill-seeking, stimulation, or excitement",
	cheerfulness: "Discuss general mood, optimism, or expressing joy",

	// Agreeableness facets
	trust: "Ask about trusting others or giving people benefit of the doubt",
	morality: "Explore honesty, straightforwardness, or ethical considerations",
	altruism: "Discuss helping others, volunteering, or selfless acts",
	cooperation: "Ask about compromising, working with others, or avoiding conflict",
	modesty: "Explore humility, self-perception, or comfort with praise",
	sympathy: "Discuss empathy for others' struggles or compassion",

	// Neuroticism facets
	anxiety: "Gently explore worrying, uncertainty, or feeling nervous",
	anger: "Ask about frustration triggers or how they handle irritation",
	depression: "Gently discuss low moods, discouragement, or sadness",
	self_consciousness: "Explore comfort in social situations or self-awareness",
	immoderation: "Ask about impulse control, cravings, or temptations",
	vulnerability: "Discuss handling stress, pressure, or overwhelming situations",
};

/**
 * Gets the steering hint for a given facet name.
 *
 * @param facetName - The facet to get the hint for
 * @returns The natural conversation steering hint
 */
export function getSteeringHintForFacet(facetName: FacetName): string {
	return FACET_STEERING_HINTS[facetName];
}
