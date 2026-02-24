import { ALL_FACETS, FACET_TO_TRAIT } from "../../../constants/big-five";
import type { FacetName, FacetScore, TraitName } from "../../../types/facet-evidence";

/**
 * Trait level identifier: L=Low, M=Mid, H=High (internal test helper only)
 */
export type InternalLevel = "L" | "M" | "H";

/**
 * Maps each trait to its [Low, Mid, High] letters for test assertions.
 */
export const TRAIT_LETTERS: Record<TraitName, [string, string, string]> = {
	openness: ["P", "G", "O"],
	conscientiousness: ["F", "B", "D"],
	extraversion: ["I", "A", "E"],
	agreeableness: ["C", "N", "W"],
	neuroticism: ["R", "T", "S"],
};

const LEVEL_INDEX: Record<InternalLevel, number> = { L: 0, M: 1, H: 2 };

/**
 * Get the expected letter for a trait at a given level.
 */
export const expectedLetter = (trait: TraitName, level: InternalLevel): string =>
	TRAIT_LETTERS[trait][LEVEL_INDEX[level]];

/**
 * Build expected 5-letter code from internal L/M/H levels.
 */
export const expectedCode = (levels: {
	O: InternalLevel;
	C: InternalLevel;
	E: InternalLevel;
	A: InternalLevel;
	N: InternalLevel;
}): string =>
	[
		expectedLetter("openness", levels.O),
		expectedLetter("conscientiousness", levels.C),
		expectedLetter("extraversion", levels.E),
		expectedLetter("agreeableness", levels.A),
		expectedLetter("neuroticism", levels.N),
	].join("");

/**
 * Creates a full 30-facet score map where each trait's 6 facets
 * are set to produce the desired trait level.
 *
 * L → per-facet score 3  (sum = 18, < 40)
 * M → per-facet score 10 (sum = 60, 40-80)
 * H → per-facet score 17 (sum = 102, > 80)
 */
export const createFacetScoresForTraitLevels = (levels: {
	O: InternalLevel;
	C: InternalLevel;
	E: InternalLevel;
	A: InternalLevel;
	N: InternalLevel;
}): Record<FacetName, FacetScore> => {
	const levelToPerFacetScore: Record<InternalLevel, number> = {
		L: 3,
		M: 10,
		H: 17,
	};

	const traitLevelMap: Record<TraitName, InternalLevel> = {
		openness: levels.O,
		conscientiousness: levels.C,
		extraversion: levels.E,
		agreeableness: levels.A,
		neuroticism: levels.N,
	};

	const result = {} as Record<FacetName, FacetScore>;
	for (const facet of ALL_FACETS) {
		const trait = FACET_TO_TRAIT[facet];
		const level = traitLevelMap[trait];
		result[facet] = {
			score: levelToPerFacetScore[level],
			confidence: 80,
		};
	}
	return result;
};

/**
 * Creates facet scores where all facets have the same score value.
 */
export const createAllFacetsAtScore = (score: number): Record<FacetName, FacetScore> => {
	const result = {} as Record<FacetName, FacetScore>;
	for (const facet of ALL_FACETS) {
		result[facet] = { score, confidence: 80 };
	}
	return result;
};

/**
 * Creates facet scores for a specific trait sum while keeping other traits at mid.
 * Sets the specified trait's 6 facets to equal portions of the target sum.
 */
export const createScoresForTraitSum = (
	trait: string,
	targetSum: number,
): Record<FacetName, FacetScore> => {
	const perFacetScore = targetSum / 6;
	const result = {} as Record<FacetName, FacetScore>;
	for (const facet of ALL_FACETS) {
		const facetTrait = FACET_TO_TRAIT[facet];
		result[facet] = {
			score: facetTrait === trait ? perFacetScore : 10,
			confidence: 80,
		};
	}
	return result;
};
