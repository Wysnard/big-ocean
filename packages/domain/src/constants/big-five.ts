/**
 * Big Five Personality Model - Facets and Trait Mappings
 *
 * The Big Five model has 5 traits, each with 6 facets (30 facets total).
 * Facet names are clean (no trait prefixes): "imagination" not "openness_imagination".
 *
 * Reference: NEO-PI-R (Revised NEO Personality Inventory)
 */

/**
 * Openness to Experience Facets (6)
 *
 * Openness involves active imagination, aesthetic sensitivity, attentiveness to inner feelings,
 * preference for variety, and intellectual curiosity.
 */
export const OPENNESS_FACETS = [
	"imagination", // Fantasy: Active imagination, daydreaming
	"artistic_interests", // Aesthetics: Appreciation for art and beauty
	"emotionality", // Feelings: Receptiveness to own emotions
	"adventurousness", // Actions: Willingness to try new activities
	"intellect", // Ideas: Intellectual curiosity, open to new ideas
	"liberalism", // Values: Readiness to re-examine social, political, and religious values
] as const;

/**
 * Conscientiousness Facets (6)
 *
 * Conscientiousness concerns the way in which we control, regulate, and direct our impulses.
 */
export const CONSCIENTIOUSNESS_FACETS = [
	"self_efficacy", // Competence: Belief in one's ability to accomplish tasks
	"orderliness", // Order: Personal organization
	"dutifulness", // Dutifulness: Sense of moral obligation
	"achievement_striving", // Achievement Striving: Need for personal achievement
	"self_discipline", // Self-Discipline: Ability to complete tasks despite distractions
	"cautiousness", // Deliberation: Tendency to think carefully before acting
] as const;

/**
 * Extraversion Facets (6)
 *
 * Extraversion is characterized by positive emotions, surgency, assertiveness,
 * sociability and the tendency to seek stimulation in the company of others.
 */
export const EXTRAVERSION_FACETS = [
	"friendliness", // Warmth: Interest in and friendliness toward others
	"gregariousness", // Gregariousness: Preference for the company of others
	"assertiveness", // Assertiveness: Social dominance and forcefulness of expression
	"activity_level", // Activity: Pace of living
	"excitement_seeking", // Excitement-Seeking: Need for environmental stimulation
	"cheerfulness", // Positive Emotions: Tendency to experience joy, happiness, love
] as const;

/**
 * Agreeableness Facets (6)
 *
 * Agreeableness reflects individual differences in concern with cooperation and social harmony.
 */
export const AGREEABLENESS_FACETS = [
	"trust", // Trust: Belief in the sincerity and good intentions of others
	"morality", // Morality: Straightforwardness, frankness, sincerity, naiveté
	"altruism", // Altruism: Active concern for the welfare of others
	"cooperation", // Cooperation: Dislike of confrontations, willingness to compromise
	"modesty", // Modesty: Tendency to downplay oneself
	"sympathy", // Sympathy: Attitude of compassion for others, moved by others' needs
] as const;

/**
 * Neuroticism Facets (6)
 *
 * Neuroticism is the tendency to experience negative emotions such as anger, anxiety, or depression.
 * (Note: Sometimes called "Emotional Stability" when scored in reverse)
 */
export const NEUROTICISM_FACETS = [
	"anxiety", // Anxiety: Level of free-floating anxiety
	"anger", // Anger: Tendency to experience anger and related states
	"depression", // Depression: Tendency to experience feelings of guilt, sadness, hopelessness
	"self_consciousness", // Self-Consciousness: Shyness and social anxiety
	"immoderation", // Immoderation: Inability to control cravings and urges
	"vulnerability", // Vulnerability: Susceptibility to stress
] as const;

/**
 * All 30 Facets (Combined)
 *
 * Complete list of all facet names across all five traits.
 */
export const ALL_FACETS = [
	...OPENNESS_FACETS,
	...CONSCIENTIOUSNESS_FACETS,
	...EXTRAVERSION_FACETS,
	...AGREEABLENESS_FACETS,
	...NEUROTICISM_FACETS,
] as const;

/**
 * Facet Name Union Type (30 values)
 *
 * TypeScript union of all valid facet names.
 * Enables type-safe facet name references throughout the codebase.
 */
export type FacetName = (typeof ALL_FACETS)[number];

/**
 * Trait Name Union Type (5 values)
 *
 * TypeScript union of the five Big Five trait names.
 */
export type TraitName =
	| "openness"
	| "conscientiousness"
	| "extraversion"
	| "agreeableness"
	| "neuroticism";

/**
 * Facet-to-Trait Mapping
 *
 * Maps each facet to its parent trait.
 * Used by the Scorer to derive trait scores from facet scores.
 *
 * @example
 * ```typescript
 * FACET_TO_TRAIT["imagination"] // => "openness"
 * FACET_TO_TRAIT["altruism"]    // => "agreeableness"
 * ```
 */
export const FACET_TO_TRAIT: Record<FacetName, TraitName> = {
	// Openness facets
	imagination: "openness",
	artistic_interests: "openness",
	emotionality: "openness",
	adventurousness: "openness",
	intellect: "openness",
	liberalism: "openness",

	// Conscientiousness facets
	self_efficacy: "conscientiousness",
	orderliness: "conscientiousness",
	dutifulness: "conscientiousness",
	achievement_striving: "conscientiousness",
	self_discipline: "conscientiousness",
	cautiousness: "conscientiousness",

	// Extraversion facets
	friendliness: "extraversion",
	gregariousness: "extraversion",
	assertiveness: "extraversion",
	activity_level: "extraversion",
	excitement_seeking: "extraversion",
	cheerfulness: "extraversion",

	// Agreeableness facets
	trust: "agreeableness",
	morality: "agreeableness",
	altruism: "agreeableness",
	cooperation: "agreeableness",
	modesty: "agreeableness",
	sympathy: "agreeableness",

	// Neuroticism facets
	anxiety: "neuroticism",
	anger: "neuroticism",
	depression: "neuroticism",
	self_consciousness: "neuroticism",
	immoderation: "neuroticism",
	vulnerability: "neuroticism",
} as const;

/**
 * Trait-to-Facets Mapping (Inverse of FACET_TO_TRAIT)
 *
 * Maps each trait to its 6 constituent facets.
 * Used by the Scorer to group facets when deriving trait scores.
 *
 * @example
 * ```typescript
 * TRAIT_TO_FACETS["openness"] // => ["imagination", "artistic_interests", ...]
 * ```
 */
export const TRAIT_TO_FACETS: Record<TraitName, readonly FacetName[]> = {
	openness: OPENNESS_FACETS,
	conscientiousness: CONSCIENTIOUSNESS_FACETS,
	extraversion: EXTRAVERSION_FACETS,
	agreeableness: AGREEABLENESS_FACETS,
	neuroticism: NEUROTICISM_FACETS,
} as const;

/**
 * Validate Facet Name
 *
 * Type guard to check if a string is a valid facet name.
 *
 * @param name - String to validate
 * @returns True if name is a valid facet name
 */
export function isFacetName(name: string): name is FacetName {
	return (ALL_FACETS as readonly string[]).includes(name);
}

/**
 * Validate Trait Name
 *
 * Type guard to check if a string is a valid trait name.
 *
 * @param name - String to validate
 * @returns True if name is a valid trait name
 */
export function isTraitName(name: string): name is TraitName {
	return ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"].includes(
		name,
	);
}
