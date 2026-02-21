/**
 * Facet Prompt Definitions (Single Source of Truth for LLM Prompts)
 *
 * One rich sentence per facet explaining what it measures, used by both
 * the Analyzer and Portrait Generator prompts. Disambiguates confusing
 * terms (morality, liberalism, emotionality) with explicit clarifications.
 *
 * NOT the same as FACET_DESCRIPTIONS (Story 8.3) which provides
 * level-specific user-facing text (high/low) for the results page.
 */

import type { FacetName } from "./big-five";

/**
 * What each of the 30 Big Five facets measures, written for LLM consumption.
 *
 * Guidelines for each definition:
 * - One rich sentence explaining the construct
 * - Disambiguation in parentheses for confusing names
 * - Concrete behavioral anchors where helpful
 */
export const FACET_PROMPT_DEFINITIONS: Record<FacetName, string> = {
	// ─── Openness Facets ─────────────────────────────────────────────────────
	imagination:
		"Active fantasy life and vivid daydreaming — tendency to create rich mental scenarios and think in 'what if' terms",
	artistic_interests:
		"Appreciation for art, beauty, and aesthetic experiences — drawn to poetry, music, visual design, or nature's elegance",
	emotionality:
		"Receptiveness to one's own inner feelings and emotional awareness — attunement to personal emotional states (distinct from emotional instability under Neuroticism)",
	adventurousness:
		"Willingness to try new activities, visit unfamiliar places, and embrace novel experiences rather than sticking to familiar routines",
	intellect:
		"Intellectual curiosity and love of learning for its own sake — eagerness to explore abstract ideas, puzzles, and philosophical questions",
	liberalism:
		"Willingness to re-examine social, political, and religious values — openness to challenging convention and questioning authority (not political ideology or party affiliation)",

	// ─── Conscientiousness Facets ────────────────────────────────────────────
	self_efficacy:
		"Confidence in one's own competence and ability to accomplish things — belief that you can handle challenges effectively",
	orderliness:
		"Personal organization and preference for structured environments — tendency to keep spaces tidy, make plans, and follow systems",
	dutifulness:
		"Sense of moral obligation and adherence to principles — governed by conscience, reliable follow-through on commitments",
	achievement_striving:
		"Drive toward personal achievement and high standards — need to set ambitious goals and work diligently to reach them",
	self_discipline:
		"Ability to persist on tasks despite boredom or distractions — capacity to motivate oneself and see things through to completion",
	cautiousness:
		"Tendency to think carefully before acting — deliberate decision-making that weighs consequences before committing",

	// ─── Extraversion Facets ─────────────────────────────────────────────────
	friendliness:
		"Genuine warmth and interest in other people — tendency to be affectionate, welcoming, and quick to form connections",
	gregariousness:
		"Preference for the company of others — enjoyment of crowds, social gatherings, and group activities over solitude",
	assertiveness:
		"Social dominance and forcefulness of expression — tendency to speak up, take charge, and direct group activities",
	activity_level:
		"Pace of living and overall energy — preference for a fast, busy schedule versus a leisurely, unhurried rhythm",
	excitement_seeking:
		"Need for environmental stimulation and thrilling experiences — drawn to novelty, risk, and high-sensation activities",
	cheerfulness:
		"Tendency to experience and express positive emotions — frequency of joy, happiness, optimism, and enthusiastic energy",

	// ─── Agreeableness Facets ────────────────────────────────────────────────
	trust:
		"Belief in the sincerity and good intentions of others — disposition to assume people are honest and well-meaning until proven otherwise",
	morality:
		"Straightforwardness and sincerity in social interactions — tendency to be frank and genuine rather than manipulative (not moral character or ethics)",
	altruism:
		"Active concern for the welfare of others — willingness to help, give, and prioritize others' needs alongside one's own",
	cooperation:
		"Preference for harmony over confrontation — willingness to compromise and accommodate others to avoid conflict",
	modesty:
		"Tendency to be humble and self-effacing — discomfort with self-promotion and reluctance to claim superiority over others",
	sympathy:
		"Compassion and tender-mindedness — being moved by others' suffering and feeling a pull to comfort and support them",

	// ─── Neuroticism Facets ──────────────────────────────────────────────────
	anxiety:
		"Level of free-floating worry and nervousness — tendency to anticipate danger, feel apprehensive, and stay on alert",
	anger:
		"Tendency to experience anger, frustration, and bitterness — how quickly irritation flares and how intensely it burns",
	depression:
		"Tendency to experience feelings of guilt, sadness, loneliness, and hopelessness — susceptibility to low mood",
	self_consciousness:
		"Sensitivity to social evaluation and others' opinions — proneness to shame, embarrassment, and feeling scrutinized",
	immoderation:
		"Difficulty resisting cravings and urges — tendency to act on desires in the moment despite knowing better",
	vulnerability:
		"Susceptibility to stress and difficulty coping under pressure — tendency to feel overwhelmed when demands pile up",
} as const;

/** Derived type for the full definitions record */
export type FacetPromptDefinitions = typeof FACET_PROMPT_DEFINITIONS;
