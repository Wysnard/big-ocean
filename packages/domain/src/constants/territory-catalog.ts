/**
 * Territory Catalog
 *
 * 22 conversation territories covering all 30 Big Five facets across
 * diverse life domains. Each territory has an energy level, expected facets,
 * and a conversation opener for Nerin.
 *
 * Design principles:
 * - Every facet appears in at least one territory
 * - Territories feel like natural conversation topics, not clinical probes
 * - Openers invite storytelling, not introspection
 * - Energy levels progress from approachable to emotionally deep
 *
 * Part of Epic 21 - Territory-Based Conversation Steering (FR1, FR6).
 */

import { Schema } from "effect";
import { type Territory, type TerritoryId, TerritoryIdSchema } from "../types/territory";
import type { FacetName } from "./big-five";
import type { LifeDomain } from "./life-domain";

/** Helper to create a branded TerritoryId at module load time */
const tid = (s: string): TerritoryId => Schema.decodeSync(TerritoryIdSchema)(s);

/**
 * Territory definition helper — provides compile-time type checking
 * via `satisfies` while preserving literal types for the map.
 */
function territory(def: {
	readonly id: string;
	readonly energyLevel: "light" | "medium" | "heavy";
	readonly domains: readonly LifeDomain[];
	readonly expectedFacets: readonly FacetName[];
	readonly opener: string;
}): Territory {
	return {
		...def,
		id: tid(def.id),
	} as Territory;
}

// ─── Light-Energy Territories (7) ───────────────────────────────────────────

const DAILY_ROUTINES = territory({
	id: "daily-routines",
	energyLevel: "light",
	domains: ["work", "solo"],
	expectedFacets: ["orderliness", "self_discipline", "activity_level"],
	opener: "What does a typical morning look like for you before the day really gets going?",
});

const CREATIVE_PURSUITS = territory({
	id: "creative-pursuits",
	energyLevel: "light",
	domains: ["leisure", "solo"],
	expectedFacets: ["imagination", "artistic_interests", "adventurousness"],
	opener: "Is there something creative you enjoy doing, even if it's just for fun?",
});

const WEEKEND_ADVENTURES = territory({
	id: "weekend-adventures",
	energyLevel: "light",
	domains: ["leisure", "solo"],
	expectedFacets: ["excitement_seeking", "adventurousness", "cheerfulness"],
	opener: "What's something you did recently on a weekend that you really enjoyed?",
});

const SOCIAL_CIRCLES = territory({
	id: "social-circles",
	energyLevel: "light",
	domains: ["relationships"],
	expectedFacets: ["friendliness", "gregariousness", "trust"],
	opener: "Tell me about the people you tend to spend the most time with.",
});

const LEARNING_CURIOSITY = territory({
	id: "learning-curiosity",
	energyLevel: "light",
	domains: ["solo", "work"],
	expectedFacets: ["intellect", "imagination", "self_efficacy"],
	opener: "What's something you've been curious about or wanted to learn more about lately?",
});

const COMFORT_ZONES = territory({
	id: "comfort-zones",
	energyLevel: "light",
	domains: ["solo", "leisure"],
	expectedFacets: ["cautiousness", "vulnerability", "adventurousness"],
	opener: "What's your go-to way to recharge when things get hectic?",
});

const HELPING_OTHERS = territory({
	id: "helping-others",
	energyLevel: "light",
	domains: ["relationships", "work"],
	expectedFacets: ["altruism", "sympathy", "cooperation"],
	opener: "Can you tell me about a time you helped someone out recently?",
});

// ─── Medium-Energy Territories (8) ──────────────────────────────────────────

const WORK_DYNAMICS = territory({
	id: "work-dynamics",
	energyLevel: "medium",
	domains: ["work"],
	expectedFacets: ["assertiveness", "achievement_striving", "self_efficacy", "cooperation"],
	opener: "What's the most interesting challenge you've faced at work recently?",
});

const FRIENDSHIP_DEPTH = territory({
	id: "friendship-depth",
	energyLevel: "medium",
	domains: ["relationships"],
	expectedFacets: ["trust", "friendliness", "modesty", "morality"],
	opener: "Think of a close friend — what made that friendship become important to you?",
});

const OPINIONS_AND_VALUES = territory({
	id: "opinions-and-values",
	energyLevel: "medium",
	domains: ["solo", "relationships"],
	expectedFacets: ["liberalism", "morality", "assertiveness"],
	opener:
		"Is there something you feel strongly about that most people around you might disagree with?",
});

const EMOTIONAL_AWARENESS = territory({
	id: "emotional-awareness",
	energyLevel: "medium",
	domains: ["solo"],
	expectedFacets: ["emotionality", "anxiety", "self_consciousness"],
	opener: "When you're having a really good day, what does that feel like for you?",
});

const AMBITION_AND_GOALS = territory({
	id: "ambition-and-goals",
	energyLevel: "medium",
	domains: ["work", "solo"],
	expectedFacets: ["achievement_striving", "self_discipline", "activity_level"],
	opener: "What's something you're working toward right now that matters to you?",
});

const TEAM_AND_LEADERSHIP = territory({
	id: "team-and-leadership",
	energyLevel: "medium",
	domains: ["work", "relationships"],
	expectedFacets: ["assertiveness", "cooperation", "dutifulness", "modesty"],
	opener: "Tell me about a time you had to take charge of something — how did that feel?",
});

const SPONTANEITY_AND_IMPULSE = territory({
	id: "spontaneity-and-impulse",
	energyLevel: "medium",
	domains: ["leisure", "solo"],
	expectedFacets: ["immoderation", "excitement_seeking", "cautiousness"],
	opener: "What's the most spontaneous thing you've done recently?",
});

const SOCIAL_DYNAMICS = territory({
	id: "social-dynamics",
	energyLevel: "medium",
	domains: ["relationships", "work"],
	expectedFacets: ["gregariousness", "self_consciousness", "cheerfulness", "friendliness"],
	opener: "How do you usually feel when you walk into a room full of people you don't know?",
});

// ─── Heavy-Energy Territories (7) ───────────────────────────────────────────

const FAMILY_BONDS = territory({
	id: "family-bonds",
	energyLevel: "heavy",
	domains: ["family"],
	expectedFacets: ["trust", "sympathy", "dutifulness", "emotionality"],
	opener: "Tell me about someone in your family who's had a real impact on who you are.",
});

const VULNERABILITY_AND_TRUST = territory({
	id: "vulnerability-and-trust",
	energyLevel: "heavy",
	domains: ["relationships", "family"],
	expectedFacets: ["vulnerability", "trust", "anxiety", "self_consciousness"],
	opener: "Can you think of a time when being open with someone actually brought you closer?",
});

const INNER_STRUGGLES = territory({
	id: "inner-struggles",
	energyLevel: "heavy",
	domains: ["solo"],
	expectedFacets: ["depression", "anxiety", "vulnerability", "anger"],
	opener: "Everyone has tough patches — what's something that's been weighing on you lately?",
});

const CONFLICT_AND_RESOLUTION = territory({
	id: "conflict-and-resolution",
	energyLevel: "heavy",
	domains: ["relationships", "work"],
	expectedFacets: ["anger", "cooperation", "assertiveness", "morality"],
	opener: "Tell me about a disagreement that actually taught you something about yourself.",
});

const IDENTITY_AND_PURPOSE = territory({
	id: "identity-and-purpose",
	energyLevel: "heavy",
	domains: ["solo", "work"],
	expectedFacets: ["intellect", "liberalism", "self_efficacy", "emotionality"],
	opener: "If someone who knows you well described what drives you, what do you think they'd say?",
});

const PRESSURE_AND_RESILIENCE = territory({
	id: "pressure-and-resilience",
	energyLevel: "heavy",
	domains: ["work", "family"],
	expectedFacets: ["vulnerability", "self_discipline", "achievement_striving", "depression"],
	opener: "Think of a time when things got really tough — how did you get through it?",
});

const GIVING_AND_RECEIVING = territory({
	id: "giving-and-receiving",
	energyLevel: "heavy",
	domains: ["relationships", "family"],
	expectedFacets: ["altruism", "modesty", "sympathy", "immoderation"],
	opener: "When someone does something really kind for you, how does that sit with you?",
});

// ─── Catalog Assembly ───────────────────────────────────────────────────────

const ALL_TERRITORIES: readonly Territory[] = [
	// Light
	DAILY_ROUTINES,
	CREATIVE_PURSUITS,
	WEEKEND_ADVENTURES,
	SOCIAL_CIRCLES,
	LEARNING_CURIOSITY,
	COMFORT_ZONES,
	HELPING_OTHERS,
	// Medium
	WORK_DYNAMICS,
	FRIENDSHIP_DEPTH,
	OPINIONS_AND_VALUES,
	EMOTIONAL_AWARENESS,
	AMBITION_AND_GOALS,
	TEAM_AND_LEADERSHIP,
	SPONTANEITY_AND_IMPULSE,
	SOCIAL_DYNAMICS,
	// Heavy
	FAMILY_BONDS,
	VULNERABILITY_AND_TRUST,
	INNER_STRUGGLES,
	CONFLICT_AND_RESOLUTION,
	IDENTITY_AND_PURPOSE,
	PRESSURE_AND_RESILIENCE,
	GIVING_AND_RECEIVING,
] as const;

/**
 * The complete territory catalog: 22 territories indexed by TerritoryId.
 *
 * Covers all 30 Big Five facets across light, medium, and heavy energy levels.
 */
export const TERRITORY_CATALOG: ReadonlyMap<TerritoryId, Territory> = new Map(
	ALL_TERRITORIES.map((t) => [t.id, t]),
);

/**
 * Cold-Start Territories (FR6)
 *
 * Three light-energy territories used for the first 3 messages
 * before the scoring formula takes over. Selected for broad appeal
 * and low emotional stakes.
 */
export const COLD_START_TERRITORIES: readonly TerritoryId[] = [
	tid("creative-pursuits"),
	tid("weekend-adventures"),
	tid("social-circles"),
] as const;

/**
 * Look up a territory by its ID.
 *
 * @param id - The territory ID to look up
 * @returns The territory if found, undefined otherwise
 */
export function getTerritoryById(id: TerritoryId): Territory | undefined {
	return TERRITORY_CATALOG.get(id);
}
