/**
 * Generates a deterministic 5-letter OCEAN code from facet scores.
 *
 * Algorithm:
 * 1. Sum 6 facets per trait (using FACET_TO_TRAIT lookup)
 * 2. Map each trait sum (0-120) to level: 0-40=L, 40-80=M, 80-120=H
 * 3. Concatenate 5 levels in OCEAN order
 *
 * @param facetScores - All 30 facet scores (caller must validate completeness)
 * @returns 5-letter code matching /^[LMH]{5}$/ (e.g., "HHMHM")
 *
 * @remarks
 * - No validation: Caller ensures all 30 facets present and valid (0-20)
 * - Deterministic: Same input always produces same output
 * - Performance: O(1) time complexity (constant 30 iterations)
 * - No side effects: Pure function, no DB/logging/errors
 */

import type { FacetName, TraitName } from "../constants/big-five";
import { FACET_TO_TRAIT } from "../constants/big-five";
import type { OceanCode5, TraitLevel } from "../types/archetype";
import type { FacetScore } from "../types/facet-evidence";
import { BIG_FIVE_TRAITS } from "../types/trait";

const mapTraitScoreToLevel = (score: number): TraitLevel => {
	if (score < 40) return "L";
	if (score < 80) return "M";
	return "H";
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

	return BIG_FIVE_TRAITS.map((trait) => mapTraitScoreToLevel(traitScores[trait])).join(
		"",
	) as OceanCode5;
};
