/**
 * Archetype Lookup System
 *
 * Pure, deterministic lookup that maps 4-letter OCEAN codes to personality archetypes.
 * Uses hand-curated names for common combinations and a component-based fallback
 * generator for the remaining combinations.
 *
 * @module
 */

import { CURATED_ARCHETYPES } from "../constants/archetypes";
import type { Archetype, TraitLevel } from "../types/archetype";

const VALID_CODE4_REGEX = /^[LMH]{4}$/;
const VALID_CODE5_REGEX = /^[LMH]{5}$/;

/** Short trait key for the 4 traits used in archetype lookup (OCEA order). */
type TraitKey = "O" | "C" | "E" | "A";

/**
 * Adjective pools for each trait at each level.
 * Used by the fallback generator to construct personality names.
 */
const TRAIT_ADJECTIVES: Record<TraitKey, Record<TraitLevel, string[]>> = {
	O: {
		H: ["Creative", "Curious", "Imaginative"],
		M: ["Balanced", "Pragmatic"],
		L: ["Practical", "Traditional"],
	},
	C: {
		H: ["Organized", "Disciplined", "Methodical"],
		M: ["Flexible", "Adaptable"],
		L: ["Spontaneous", "Easygoing"],
	},
	E: {
		H: ["Energetic", "Social", "Outgoing"],
		M: ["Moderate", "Selective"],
		L: ["Quiet", "Reserved", "Reflective"],
	},
	A: {
		H: ["Caring", "Cooperative", "Warm"],
		M: ["Fair", "Balanced"],
		L: ["Independent", "Self-reliant", "Autonomous"],
	},
};

/**
 * Noun mapping derived from Agreeableness level.
 */
const AGREEABLENESS_NOUNS: Record<TraitLevel, string> = {
	H: "Collaborator",
	M: "Navigator",
	L: "Individualist",
};

/**
 * Trait-level description fragments for generating descriptions.
 */
const TRAIT_DESCRIPTIONS: Record<TraitKey, Record<TraitLevel, string>> = {
	O: {
		H: "embraces new ideas and creative exploration",
		M: "balances curiosity with practicality",
		L: "prefers familiar approaches and proven methods",
	},
	C: {
		H: "approaches tasks with discipline and careful planning",
		M: "adapts their organizational style to the situation",
		L: "favors spontaneity and flexible approaches",
	},
	E: {
		H: "thrives in social environments and draws energy from interaction",
		M: "selectively engages with social settings",
		L: "finds strength in quiet reflection and deeper connections",
	},
	A: {
		H: "prioritizes cooperation and genuine care for others",
		M: "balances personal goals with the needs of others",
		L: "values independence and self-directed decision-making",
	},
};

/**
 * Base RGB colors per trait level for deterministic color generation.
 */
const TRAIT_COLORS: Record<TraitKey, Record<TraitLevel, [number, number, number]>> = {
	O: { H: [74, 144, 226], M: [128, 128, 128], L: [200, 180, 140] },
	C: { H: [46, 139, 87], M: [128, 128, 128], L: [210, 150, 80] },
	E: { H: [255, 165, 0], M: [128, 128, 128], L: [100, 100, 180] },
	A: { H: [255, 105, 180], M: [128, 128, 128], L: [120, 120, 120] },
};

const TRAIT_ORDER: readonly TraitKey[] = ["O", "C", "E", "A"];

/** Parsed 4-letter code as a fixed-length tuple of trait levels. */
type Code4Tuple = [TraitLevel, TraitLevel, TraitLevel, TraitLevel];

/**
 * Parse a validated 4-letter code into a typed tuple.
 * Must only be called after regex validation.
 */
const parseCode4 = (code4: string): Code4Tuple =>
	[code4[0], code4[1], code4[2], code4[3]] as Code4Tuple;

/**
 * Calculate the "extremeness" of a trait level (distance from M).
 * H and L are extreme (1), M is not (0).
 */
const extremeness = (level: TraitLevel): number => (level === "M" ? 0 : 1);

/**
 * Generate a personality name from a 4-letter code using component-based approach.
 *
 * Strategy: Pick one adjective from the primary trait (most extreme, OCEAN priority for ties)
 * and combine with a noun derived from the Agreeableness level.
 *
 * @param levels - Parsed 4-letter code tuple
 * @returns Generated name like "Creative Collaborator"
 */
const generateArchetypeName = (levels: Code4Tuple): string => {
	// Find primary trait: most extreme (H or L), OCEAN order for ties
	let primaryIdx = 0;
	let primaryExtremeness = extremeness(levels[0]);

	for (let i = 1; i < 4; i++) {
		const ext = extremeness(levels[i] as TraitLevel);
		if (ext > primaryExtremeness) {
			primaryIdx = i;
			primaryExtremeness = ext;
		}
	}

	const primaryTrait = TRAIT_ORDER[primaryIdx] as TraitKey;
	const primaryLevel = levels[primaryIdx] as TraitLevel;
	const adjectives = TRAIT_ADJECTIVES[primaryTrait][primaryLevel];
	const adjective = adjectives[0]; // deterministic: always first

	const aLevel = levels[3]; // Agreeableness is 4th position
	const noun = AGREEABLENESS_NOUNS[aLevel];

	return `${adjective} ${noun}`;
};

/**
 * Generate a 2-3 sentence description from trait levels.
 *
 * @param levels - Parsed 4-letter code tuple
 * @returns Description string (50-300 characters)
 */
const generateDescription = (levels: Code4Tuple): string => {
	const sentences: string[] = [];

	// First sentence: combine O and C descriptions
	const oDesc = TRAIT_DESCRIPTIONS.O[levels[0]];
	const cDesc = TRAIT_DESCRIPTIONS.C[levels[1]];
	sentences.push(`Someone who ${oDesc} and ${cDesc}.`);

	// Second sentence: combine E and A descriptions
	const eDesc = TRAIT_DESCRIPTIONS.E[levels[2]];
	const aDesc = TRAIT_DESCRIPTIONS.A[levels[3]];
	sentences.push(`This person ${eDesc} and ${aDesc}.`);

	return sentences.join(" ");
};

/**
 * Generate a deterministic hex color by averaging trait-level RGB values.
 *
 * @param levels - Parsed 4-letter code tuple
 * @returns Hex color string like "#4A90D9"
 */
const generateColor = (levels: Code4Tuple): string => {
	let r = 0;
	let g = 0;
	let b = 0;

	for (let i = 0; i < 4; i++) {
		const trait = TRAIT_ORDER[i] as TraitKey;
		const level = levels[i] as TraitLevel;
		const [tr, tg, tb] = TRAIT_COLORS[trait][level];
		r += tr;
		g += tg;
		b += tb;
	}

	r = Math.round(r / 4);
	g = Math.round(g / 4);
	b = Math.round(b / 4);

	const toHex = (n: number): string => n.toString(16).padStart(2, "0").toUpperCase();
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Look up the personality archetype for a 4-letter OCEAN code.
 *
 * Checks hand-curated entries first, falls back to component-based generation.
 * Every valid 4-letter code (81 total) returns a valid archetype.
 *
 * @param code4 - 4-character string of L/M/H for O, C, E, A traits
 * @returns Archetype with name, description, color, and curation status
 * @throws Error if code4 is not exactly 4 characters of L/M/H
 *
 * @example
 * ```typescript
 * const archetype = lookupArchetype("HHMH");
 * // → { code4: "HHMH", name: "The Creative Diplomat", description: "...", color: "#5B8FA8", isCurated: true }
 * ```
 */
export const lookupArchetype = (code4: string): Archetype => {
	if (!VALID_CODE4_REGEX.test(code4)) {
		throw new Error(
			`Invalid 4-letter OCEAN code: "${code4}". Expected exactly 4 characters of L, M, or H.`,
		);
	}

	const curated = CURATED_ARCHETYPES[code4];
	if (curated) {
		return {
			code4,
			name: curated.name,
			description: curated.description,
			color: curated.color,
			isCurated: true,
		};
	}

	const levels = parseCode4(code4);
	return {
		code4,
		name: generateArchetypeName(levels),
		description: generateDescription(levels),
		color: generateColor(levels),
		isCurated: false,
	};
};

/**
 * Extract the first 4 characters from a 5-letter OCEAN code.
 *
 * Drops the Neuroticism letter (5th position) for POC archetype lookup.
 *
 * @param oceanCode5 - 5-character OCEAN code (e.g., "HHMHM")
 * @returns 4-character code (e.g., "HHMH")
 * @throws Error if input is not exactly 5 characters of L/M/H
 *
 * @example
 * ```typescript
 * extract4LetterCode("HHMHM") // → "HHMH"
 * ```
 */
export const extract4LetterCode = (oceanCode5: string): string => {
	if (!VALID_CODE5_REGEX.test(oceanCode5)) {
		throw new Error(
			`Invalid 5-letter OCEAN code: "${oceanCode5}". Expected exactly 5 characters of L, M, or H.`,
		);
	}
	return oceanCode5.slice(0, 4);
};
