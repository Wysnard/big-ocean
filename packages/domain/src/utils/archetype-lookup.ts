/**
 * Archetype Lookup System
 *
 * Pure, deterministic lookup that maps 4-letter OCEAN codes to personality archetypes.
 * Uses hand-curated names for common combinations and a component-based fallback
 * generator for the remaining combinations.
 *
 * Letter system (unique per trait):
 *   Openness:          P (Practical)  G (Grounded)    O (Open-minded)
 *   Conscientiousness: F (Flexible)   B (Balanced)    D (Disciplined)
 *   Extraversion:      I (Introvert)  A (Ambivert)    E (Extravert)
 *   Agreeableness:     C (Candid)     N (Negotiator)  W (Warm)
 *
 * @module
 */

import { CURATED_ARCHETYPES } from "../constants/archetypes";
import type { Archetype, OceanCode4 } from "../types/archetype";

/** Valid letters per position in a 4-letter code (O, C, E, A) */
const VALID_CODE4_REGEX = /^[PGO][FBD][IAE][CNW]$/;
/** Valid letters per position in a 5-letter code (O, C, E, A, N) */
const VALID_CODE5_REGEX = /^[PGO][FBD][IAE][CNW][RTS]$/;

/** Short trait key for the 4 traits used in archetype lookup (OCEA order). */
type TraitKey = "O" | "C" | "E" | "A";

/** Valid letters for each trait position in a 4-letter code */
type OpennessLetter = "P" | "G" | "O";
type ConscientiousnessLetter = "F" | "B" | "D";
type ExtraversionLetter = "I" | "A" | "E";
type AgreeablenessLetter = "C" | "N" | "W";

/** Union of all valid code4 position letters */
type Code4Letter =
	| OpennessLetter
	| ConscientiousnessLetter
	| ExtraversionLetter
	| AgreeablenessLetter;

/**
 * Adjective pools for each trait at each level.
 * Used by the fallback generator to construct personality names.
 */
const TRAIT_ADJECTIVES: Record<TraitKey, Record<string, string[]>> = {
	O: {
		O: ["Creative", "Curious", "Imaginative"],
		G: ["Balanced", "Pragmatic"],
		P: ["Practical", "Traditional"],
	},
	C: {
		D: ["Organized", "Disciplined", "Methodical"],
		B: ["Flexible", "Adaptable"],
		F: ["Spontaneous", "Easygoing"],
	},
	E: {
		E: ["Energetic", "Social", "Outgoing"],
		A: ["Moderate", "Selective"],
		I: ["Quiet", "Reserved", "Reflective"],
	},
	A: {
		W: ["Caring", "Cooperative", "Warm"],
		N: ["Fair", "Balanced"],
		C: ["Independent", "Self-reliant", "Autonomous"],
	},
};

/**
 * Noun mapping derived from Agreeableness level.
 */
const AGREEABLENESS_NOUNS: Record<string, string> = {
	W: "Collaborator",
	N: "Navigator",
	C: "Individualist",
};

/**
 * Trait-level description fragments for generating descriptions.
 */
const TRAIT_DESCRIPTIONS: Record<TraitKey, Record<string, string>> = {
	O: {
		O: "embraces new ideas and creative exploration",
		G: "balances curiosity with practicality",
		P: "prefers familiar approaches and proven methods",
	},
	C: {
		D: "approaches tasks with discipline and careful planning",
		B: "adapts their organizational style to the situation",
		F: "favors spontaneity and flexible approaches",
	},
	E: {
		E: "thrives in social environments and draws energy from interaction",
		A: "selectively engages with social settings",
		I: "finds strength in quiet reflection and deeper connections",
	},
	A: {
		W: "prioritizes cooperation and genuine care for others",
		N: "balances personal goals with the needs of others",
		C: "values independence and self-directed decision-making",
	},
};

/**
 * Base RGB colors per trait level for deterministic color generation.
 */
const TRAIT_COLORS: Record<TraitKey, Record<string, [number, number, number]>> = {
	O: { O: [74, 144, 226], G: [128, 128, 128], P: [200, 180, 140] },
	C: { D: [46, 139, 87], B: [128, 128, 128], F: [210, 150, 80] },
	E: { E: [255, 165, 0], A: [128, 128, 128], I: [100, 100, 180] },
	A: { W: [255, 105, 180], N: [128, 128, 128], C: [120, 120, 120] },
};

const TRAIT_ORDER: readonly TraitKey[] = ["O", "C", "E", "A"];

/** Parsed 4-letter code as a fixed-length tuple of trait-level letters. */
type Code4Tuple = [Code4Letter, Code4Letter, Code4Letter, Code4Letter];

/**
 * Parse a validated 4-letter code into a typed tuple.
 * Must only be called after regex validation.
 */
const parseCode4 = (code4: string): Code4Tuple =>
	[code4[0], code4[1], code4[2], code4[3]] as Code4Tuple;

/**
 * Calculate the "extremeness" of a trait level (distance from mid).
 * High and Low letters are extreme (1), Mid letters are not (0).
 */
const MID_LETTERS = new Set(["G", "B", "A", "N"]);
const extremeness = (letter: Code4Letter): number => (MID_LETTERS.has(letter) ? 0 : 1);

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
	// Find primary trait: most extreme (High or Low), OCEAN order for ties
	let primaryIdx = 0;
	let primaryExtremeness = extremeness(levels[0]);

	for (let i = 1; i < 4; i++) {
		const ext = extremeness(levels[i] as Code4Letter);
		if (ext > primaryExtremeness) {
			primaryIdx = i;
			primaryExtremeness = ext;
		}
	}

	const primaryTrait = TRAIT_ORDER[primaryIdx] as TraitKey;
	const primaryLevel = levels[primaryIdx] as string;
	const adjectives = TRAIT_ADJECTIVES[primaryTrait][primaryLevel];
	const adjective = adjectives[0]; // deterministic: always first

	const aLevel = levels[3] as string; // Agreeableness is 4th position
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
	const oDesc = TRAIT_DESCRIPTIONS.O[levels[0] as string];
	const cDesc = TRAIT_DESCRIPTIONS.C[levels[1] as string];
	sentences.push(`Someone who ${oDesc} and ${cDesc}.`);

	// Second sentence: combine E and A descriptions
	const eDesc = TRAIT_DESCRIPTIONS.E[levels[2] as string];
	const aDesc = TRAIT_DESCRIPTIONS.A[levels[3] as string];
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
		const level = levels[i] as string;
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
 * @param code4 - 4-character string using trait-specific letters (O,C,E,A positions)
 * @returns Archetype with name, description, color, and curation status
 * @throws Error if code4 doesn't match valid letter pattern
 *
 * @example
 * ```typescript
 * const archetype = lookupArchetype("ODAW");
 * // → { code4: "ODAW", name: "The Creative Diplomat", ... }
 * ```
 */
export const lookupArchetype = (code4: string): Archetype => {
	if (!VALID_CODE4_REGEX.test(code4)) {
		throw new Error(
			`Invalid 4-letter OCEAN code: "${code4}". Expected pattern: [PGO][FBD][IAE][CNW].`,
		);
	}

	const validCode4 = code4 as OceanCode4;
	const curated = CURATED_ARCHETYPES[code4];
	if (curated) {
		return {
			code4: validCode4,
			name: curated.name,
			description: curated.description,
			color: curated.color,
			isCurated: true,
		};
	}

	const levels = parseCode4(code4);
	return {
		code4: validCode4,
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
 * @param oceanCode5 - 5-character OCEAN code (e.g., "ODEWR")
 * @returns 4-character code (e.g., "ODEW")
 * @throws Error if input doesn't match valid 5-letter pattern
 *
 * @example
 * ```typescript
 * extract4LetterCode("ODEWR") // → "ODEW"
 * ```
 */
export const extract4LetterCode = (oceanCode5: string): OceanCode4 => {
	if (!VALID_CODE5_REGEX.test(oceanCode5)) {
		throw new Error(
			`Invalid 5-letter OCEAN code: "${oceanCode5}". Expected pattern: [PGO][FBD][IAE][CNW][RTS].`,
		);
	}
	return oceanCode5.slice(0, 4) as OceanCode4;
};
