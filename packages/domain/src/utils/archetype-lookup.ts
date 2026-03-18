/**
 * Archetype Lookup System
 *
 * Pure, deterministic lookup that maps 4-letter OCEAN codes to hand-curated
 * personality archetypes. All 81 valid combinations have curated entries.
 *
 * Letter system (unique per trait):
 *   Openness:          T (Traditional)  M (Moderate)    O (Open-minded)
 *   Conscientiousness: F (Flexible)     S (Steady)      C (Conscientious)
 *   Extraversion:      I (Introverted)  B (Balanced)    E (Extravert)
 *   Agreeableness:     D (Direct)       P (Pragmatic)   A (Agreeable)
 *
 * @module
 */

import { CURATED_ARCHETYPES } from "../constants/archetypes";
import type { Archetype, OceanCode4 } from "../types/archetype";

/** Valid letters per position in a 4-letter code (O, C, E, A) */
const VALID_CODE4_REGEX = /^[TMO][FSC][IBE][DPA]$/;
/** Valid letters per position in a 5-letter code (O, C, E, A, N) */
const VALID_CODE5_REGEX = /^[TMO][FSC][IBE][DPA][RVN]$/;

/**
 * Look up the personality archetype for a 4-letter OCEAN code.
 *
 * Returns the hand-curated archetype entry for the given code.
 * Every valid 4-letter code (81 total) has a curated entry.
 *
 * @param code4 - 4-character string using trait-specific letters (O,C,E,A positions)
 * @returns Archetype with name, description, color, and curation status
 * @throws Error if code4 doesn't match valid letter pattern
 *
 * @example
 * ```typescript
 * const archetype = lookupArchetype("OCBA");
 * // → { code4: "OCBA", name: "The Tapestry", ... }
 * ```
 */
export const lookupArchetype = (code4: string): Archetype => {
	if (!VALID_CODE4_REGEX.test(code4)) {
		throw new Error(
			`Invalid 4-letter OCEAN code: "${code4}". Expected pattern: [TMO][FSC][IBE][DPA].`,
		);
	}

	const validCode4 = code4 as OceanCode4;
	const curated = CURATED_ARCHETYPES[code4];
	if (!curated) {
		throw new Error(
			`Missing curated archetype for code: "${code4}". All 81 codes should have entries.`,
		);
	}

	return {
		code4: validCode4,
		name: curated.name,
		description: curated.description,
		color: curated.color,
		isCurated: true,
	};
};

/**
 * Extract the first 4 characters from a 5-letter OCEAN code.
 *
 * Drops the Neuroticism letter (5th position) for POC archetype lookup.
 *
 * @param oceanCode5 - 5-character OCEAN code (e.g., "OCEAR")
 * @returns 4-character code (e.g., "OCEA")
 * @throws Error if input doesn't match valid 5-letter pattern
 *
 * @example
 * ```typescript
 * extract4LetterCode("OCEAR") // → "OCEA"
 * ```
 */
export const extract4LetterCode = (oceanCode5: string): OceanCode4 => {
	if (!VALID_CODE5_REGEX.test(oceanCode5)) {
		throw new Error(
			`Invalid 5-letter OCEAN code: "${oceanCode5}". Expected pattern: [TMO][FSC][IBE][DPA][RVN].`,
		);
	}
	return oceanCode5.slice(0, 4) as OceanCode4;
};
