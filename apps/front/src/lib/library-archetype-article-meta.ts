export const ARCHETYPE_SLUGS = [
	"anchor-personality-archetype",
	"beacon-personality-archetype",
	"compass-personality-archetype",
	"ember-personality-archetype",
	"forge-personality-archetype",
] as const;

export type ArchetypeSlug = (typeof ARCHETYPE_SLUGS)[number];

export function isArchetypeSlug(value: string): value is ArchetypeSlug {
	return ARCHETYPE_SLUGS.includes(value as ArchetypeSlug);
}

export const COMPATIBLE_ARCHETYPE_SLUGS: Record<ArchetypeSlug, readonly ArchetypeSlug[]> = {
	"anchor-personality-archetype": [
		"beacon-personality-archetype",
		"compass-personality-archetype",
		"ember-personality-archetype",
	],
	"beacon-personality-archetype": [
		"anchor-personality-archetype",
		"compass-personality-archetype",
		"ember-personality-archetype",
	],
	"compass-personality-archetype": [
		"beacon-personality-archetype",
		"anchor-personality-archetype",
		"ember-personality-archetype",
	],
	"ember-personality-archetype": [
		"compass-personality-archetype",
		"anchor-personality-archetype",
		"beacon-personality-archetype",
	],
	"forge-personality-archetype": [
		"beacon-personality-archetype",
		"anchor-personality-archetype",
		"ember-personality-archetype",
	],
};

/** Relational labels for compatible archetype cards keyed by `currentSlug` → `relatedSlug`. */
export const ARCHETYPE_RELATIONAL_ROLES: Record<
	ArchetypeSlug,
	Partial<Record<ArchetypeSlug, string>>
> = {
	"beacon-personality-archetype": {
		"anchor-personality-archetype": "Pragmatic ballast",
		"compass-personality-archetype": "Directional contrast",
		"ember-personality-archetype": "Warm counterweight",
	},
	"anchor-personality-archetype": {
		"beacon-personality-archetype": "Visionary lift",
		"compass-personality-archetype": "Meaning-making pair",
		"ember-personality-archetype": "Humanizing balance",
	},
	"compass-personality-archetype": {
		"beacon-personality-archetype": "Momentum partner",
		"anchor-personality-archetype": "Grounding pair",
		"ember-personality-archetype": "Emotional compass",
	},
	"ember-personality-archetype": {
		"compass-personality-archetype": "Clarity counterpart",
		"anchor-personality-archetype": "Steady harbor",
		"beacon-personality-archetype": "Energetic mirror",
	},
	"forge-personality-archetype": {
		"beacon-personality-archetype": "Ideas-to-action bridge",
		"anchor-personality-archetype": "Reliability anchor",
		"ember-personality-archetype": "Warmth under pressure",
	},
};
