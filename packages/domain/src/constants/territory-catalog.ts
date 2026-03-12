/**
 * Territory Catalog — Evolved for Conversation Pacing Pipeline
 *
 * 25 conversation territories covering all 30 Big Five facets across
 * diverse life domains. Each territory has a continuous expected energy
 * value [0, 1], exactly 2 domain tags, expected facets, and a conversation opener.
 *
 * Design principles:
 * - Every facet appears in at least one territory
 * - Territories feel like natural conversation topics, not clinical probes
 * - Openers invite storytelling, not introspection
 * - expectedEnergy measures opener cost, not depth potential
 * - Every territory has exactly 2 domains (compile-time enforced)
 * - Energy distribution: 9 light (0.20-0.37), 10 medium (0.38-0.53), 6 heavy (0.58-0.72)
 *
 * Evolved from Epic 21 (22 territories, categorical energy) to Epic 23 (25 territories,
 * continuous energy) per Territory Catalog Migration Spec.
 *
 * @see {@link file://_bmad-output/problem-solution-2026-03-08.md} for calibration rationale
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
	readonly expectedEnergy: number;
	readonly domains: readonly [LifeDomain, LifeDomain];
	readonly expectedFacets: readonly FacetName[];
	readonly opener: string;
}): Territory {
	return {
		...def,
		id: tid(def.id),
	} as Territory;
}

// ─── Light-Energy Territories (9) — expectedEnergy 0.20-0.37 ──────────────

const DAILY_ROUTINES = territory({
	id: "daily-routines",
	expectedEnergy: 0.20,
	domains: ["work", "solo"],
	expectedFacets: ["orderliness", "self_discipline", "activity_level"],
	opener: "What does a typical morning look like for you before the day really gets going?",
});

const CREATIVE_PURSUITS = territory({
	id: "creative-pursuits",
	expectedEnergy: 0.25,
	domains: ["leisure", "solo"],
	expectedFacets: ["imagination", "artistic_interests", "adventurousness"],
	opener: "Is there something creative you enjoy doing, even if it's just for fun?",
});

const WEEKEND_ADVENTURES = territory({
	id: "weekend-adventures",
	expectedEnergy: 0.25,
	domains: ["leisure", "solo"],
	expectedFacets: ["excitement_seeking", "adventurousness", "cheerfulness"],
	opener: "What's something you did recently on a weekend that you really enjoyed?",
});

const LEARNING_CURIOSITY = territory({
	id: "learning-curiosity",
	expectedEnergy: 0.25,
	domains: ["solo", "work"],
	expectedFacets: ["intellect", "imagination", "self_efficacy"],
	opener: "What's something you've been curious about or wanted to learn more about lately?",
});

const FAMILY_RITUALS = territory({
	id: "family-rituals",
	expectedEnergy: 0.28,
	domains: ["family", "leisure"],
	expectedFacets: ["dutifulness", "cheerfulness", "cooperation", "morality"],
	opener: "Does your family have any traditions or rituals, even small ones?",
});

const SOCIAL_CIRCLES = territory({
	id: "social-circles",
	expectedEnergy: 0.30,
	domains: ["relationships", "leisure"],
	expectedFacets: ["friendliness", "gregariousness", "trust"],
	opener: "Tell me about the people you tend to spend the most time with.",
});

const HELPING_OTHERS = territory({
	id: "helping-others",
	expectedEnergy: 0.30,
	domains: ["relationships", "work"],
	expectedFacets: ["altruism", "sympathy", "cooperation"],
	opener: "Can you tell me about a time you helped someone out recently?",
});

const COMFORT_ZONES = territory({
	id: "comfort-zones",
	expectedEnergy: 0.33,
	domains: ["solo", "relationships"],
	expectedFacets: ["cautiousness", "vulnerability", "adventurousness"],
	opener: "What's your go-to way to recharge when things get hectic?",
});

const SPONTANEITY_AND_IMPULSE = territory({
	id: "spontaneity-and-impulse",
	expectedEnergy: 0.37,
	domains: ["leisure", "solo"],
	expectedFacets: ["immoderation", "excitement_seeking", "cautiousness"],
	opener: "What's the most spontaneous thing you've done recently?",
});

// ─── Medium-Energy Territories (10) — expectedEnergy 0.38-0.53 ─────────────

const DAILY_FRUSTRATIONS = territory({
	id: "daily-frustrations",
	expectedEnergy: 0.38,
	domains: ["relationships", "work"],
	expectedFacets: ["anger", "cooperation", "self_consciousness", "assertiveness"],
	opener: "What's something that really gets on your nerves, even if it's small?",
});

const WORK_DYNAMICS = territory({
	id: "work-dynamics",
	expectedEnergy: 0.42,
	domains: ["work", "relationships"],
	expectedFacets: ["assertiveness", "achievement_striving", "self_efficacy", "cooperation"],
	opener: "What's the most interesting challenge you've faced at work recently?",
});

const EMOTIONAL_AWARENESS = territory({
	id: "emotional-awareness",
	expectedEnergy: 0.42,
	domains: ["solo", "relationships"],
	expectedFacets: ["emotionality", "anxiety", "self_consciousness"],
	opener: "When you're having a really good day, what does that feel like for you?",
});

const AMBITION_AND_GOALS = territory({
	id: "ambition-and-goals",
	expectedEnergy: 0.43,
	domains: ["work", "solo"],
	expectedFacets: ["achievement_striving", "self_discipline", "activity_level"],
	opener: "What's something you're working toward right now that matters to you?",
});

const GROWING_UP = territory({
	id: "growing-up",
	expectedEnergy: 0.45,
	domains: ["family", "solo"],
	expectedFacets: ["emotionality", "trust", "imagination", "dutifulness"],
	opener: "What's something from growing up that shaped who you are today?",
});

const SOCIAL_DYNAMICS = territory({
	id: "social-dynamics",
	expectedEnergy: 0.46,
	domains: ["relationships", "leisure"],
	expectedFacets: ["gregariousness", "self_consciousness", "cheerfulness", "friendliness"],
	opener: "How do you usually feel when you walk into a room full of people you don't know?",
});

const FRIENDSHIP_DEPTH = territory({
	id: "friendship-depth",
	expectedEnergy: 0.48,
	domains: ["relationships", "solo"],
	expectedFacets: ["trust", "friendliness", "modesty", "morality"],
	opener: "Think of a close friend — what made that friendship become important to you?",
});

const OPINIONS_AND_VALUES = territory({
	id: "opinions-and-values",
	expectedEnergy: 0.49,
	domains: ["solo", "relationships"],
	expectedFacets: ["liberalism", "morality", "assertiveness"],
	opener:
		"Is there something you feel strongly about that most people around you might disagree with?",
});

const TEAM_AND_LEADERSHIP = territory({
	id: "team-and-leadership",
	expectedEnergy: 0.49,
	domains: ["work", "relationships"],
	expectedFacets: ["assertiveness", "cooperation", "dutifulness", "modesty"],
	opener: "Tell me about a time you had to take charge of something — how did that feel?",
});

const GIVING_AND_RECEIVING = territory({
	id: "giving-and-receiving",
	expectedEnergy: 0.53,
	domains: ["relationships", "family"],
	expectedFacets: ["altruism", "modesty", "sympathy", "immoderation"],
	opener: "When someone does something really kind for you, how does that sit with you?",
});

// ─── Heavy-Energy Territories (6) — expectedEnergy 0.58-0.72 ───────────────

const FAMILY_BONDS = territory({
	id: "family-bonds",
	expectedEnergy: 0.58,
	domains: ["family", "relationships"],
	expectedFacets: ["trust", "sympathy", "dutifulness", "emotionality"],
	opener: "Tell me about someone in your family who's had a real impact on who you are.",
});

const CONFLICT_AND_RESOLUTION = territory({
	id: "conflict-and-resolution",
	expectedEnergy: 0.59,
	domains: ["relationships", "work"],
	expectedFacets: ["anger", "cooperation", "assertiveness", "morality"],
	opener: "Tell me about a disagreement that actually taught you something about yourself.",
});

const IDENTITY_AND_PURPOSE = territory({
	id: "identity-and-purpose",
	expectedEnergy: 0.63,
	domains: ["solo", "work"],
	expectedFacets: ["intellect", "liberalism", "self_efficacy", "emotionality"],
	opener: "If someone who knows you well described what drives you, what do you think they'd say?",
});

const INNER_STRUGGLES = territory({
	id: "inner-struggles",
	expectedEnergy: 0.65,
	domains: ["solo", "relationships"],
	expectedFacets: ["depression", "anxiety", "vulnerability", "anger"],
	opener: "Everyone has tough patches — what's something that's been weighing on you lately?",
});

const VULNERABILITY_AND_TRUST = territory({
	id: "vulnerability-and-trust",
	expectedEnergy: 0.70,
	domains: ["relationships", "family"],
	expectedFacets: ["vulnerability", "trust", "anxiety", "self_consciousness"],
	opener: "Can you think of a time when being open with someone actually brought you closer?",
});

const PRESSURE_AND_RESILIENCE = territory({
	id: "pressure-and-resilience",
	expectedEnergy: 0.72,
	domains: ["work", "family"],
	expectedFacets: ["vulnerability", "self_discipline", "achievement_striving", "depression"],
	opener: "Think of a time when things got really tough — how did you get through it?",
});

// ─── Catalog Assembly ───────────────────────────────────────────────────────

const ALL_TERRITORIES: readonly Territory[] = [
	// Light (9)
	DAILY_ROUTINES,
	CREATIVE_PURSUITS,
	WEEKEND_ADVENTURES,
	LEARNING_CURIOSITY,
	FAMILY_RITUALS,
	SOCIAL_CIRCLES,
	HELPING_OTHERS,
	COMFORT_ZONES,
	SPONTANEITY_AND_IMPULSE,
	// Medium (10)
	DAILY_FRUSTRATIONS,
	WORK_DYNAMICS,
	EMOTIONAL_AWARENESS,
	AMBITION_AND_GOALS,
	GROWING_UP,
	SOCIAL_DYNAMICS,
	FRIENDSHIP_DEPTH,
	OPINIONS_AND_VALUES,
	TEAM_AND_LEADERSHIP,
	GIVING_AND_RECEIVING,
	// Heavy (6)
	FAMILY_BONDS,
	CONFLICT_AND_RESOLUTION,
	IDENTITY_AND_PURPOSE,
	INNER_STRUGGLES,
	VULNERABILITY_AND_TRUST,
	PRESSURE_AND_RESILIENCE,
] as const;

/**
 * The complete territory catalog: 25 territories indexed by TerritoryId.
 *
 * Covers all 30 Big Five facets across 5 life domains with continuous
 * expected energy values in [0, 1].
 */
export const TERRITORY_CATALOG: ReadonlyMap<TerritoryId, Territory> = new Map(
	ALL_TERRITORIES.map((t) => [t.id, t]),
);

/**
 * Look up a territory by its ID.
 *
 * @param id - The territory ID to look up
 * @returns The territory if found, undefined otherwise
 */
export function getTerritoryById(id: TerritoryId): Territory | undefined {
	return TERRITORY_CATALOG.get(id);
}
