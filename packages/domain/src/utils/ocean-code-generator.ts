/**
 * Generates a deterministic 5-letter OCEAN code from facet scores.
 *
 * Each trait maps to unique, semantically meaningful letters:
 *   Openness:          P (Practical)     G (Grounded)     O (Open-minded)
 *   Conscientiousness: F (Flexible)      B (Balanced)     D (Disciplined)
 *   Extraversion:      I (Introvert)     A (Ambivert)     E (Extravert)
 *   Agreeableness:     C (Candid)        N (Negotiator)   W (Warm)
 *   Neuroticism:       R (Resilient)     T (Temperate)    S (Sensitive)
 *
 * Algorithm:
 * 1. Sum 6 facets per trait (using FACET_TO_TRAIT lookup)
 * 2. Map each trait sum (0-120) to its trait-specific letter
 * 3. Concatenate 5 letters in OCEAN order
 *
 * @param facetScores - All 30 facet scores (caller must validate completeness)
 * @returns 5-letter code (e.g., "ODEWR")
 *
 * @remarks
 * - No validation: Caller ensures all 30 facets present and valid (0-20)
 * - Deterministic: Same input always produces same output
 * - Performance: O(1) time complexity (constant 30 iterations)
 * - No side effects: Pure function, no DB/logging/errors
 */

import type { FacetName, TraitName } from "../constants/big-five";
import { FACET_TO_TRAIT } from "../constants/big-five";
import type { OceanCode5 } from "../types/archetype";
import { TRAIT_LETTER_MAP } from "../types/archetype";
import type { FacetScore } from "../types/facet-evidence";
import { BIG_FIVE_TRAITS } from "../types/trait";

const mapTraitScoreToLetter = (trait: TraitName, score: number): string => {
	const [low, mid, high] = TRAIT_LETTER_MAP[trait];
	if (score < 40) return low;
	if (score < 80) return mid;
	return high;
};

export const generateOceanCode = (facetScores: Record<FacetName, FacetScore>): OceanCode5 => {
	const traitScores = {} as Record<TraitName, number>;

	for (const trait of BIG_FIVE_TRAITS) {
		traitScores[trait] = 0;
	}

	for (const facet of Object.keys(facetScores) as FacetName[]) {
		const trait = FACET_TO_TRAIT[facet];
		traitScores[trait] += facetScores[facet].score;
	}

	return BIG_FIVE_TRAITS.map((trait) => mapTraitScoreToLetter(trait, traitScores[trait])).join(
		"",
	) as OceanCode5;
};
