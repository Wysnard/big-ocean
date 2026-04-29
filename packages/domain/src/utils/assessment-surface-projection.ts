import type { FacetName } from "../constants/big-five";
import type { Archetype, OceanCode4, OceanCode5 } from "../types/archetype";
import type { FacetScoresMap } from "../types/facet-evidence";
import { extract4LetterCode, lookupArchetype } from "./archetype-lookup";
import { generateOceanCode } from "./ocean-code-generator";

export interface AssessmentSurfaceProjection {
	readonly oceanCode5: OceanCode5;
	readonly oceanCode4: OceanCode4;
	readonly archetype: Archetype;
}

export const buildFacetScoresMap = (
	facets: Record<FacetName, { score: number; confidence: number }> | Record<string, never>,
): FacetScoresMap => {
	const facetScoresMap = {} as FacetScoresMap;
	for (const [facetName, data] of Object.entries(facets)) {
		facetScoresMap[facetName as FacetName] = {
			score: data.score,
			confidence: data.confidence,
		};
	}
	return facetScoresMap;
};

export const deriveAssessmentSurfaceFromFacetScores = (
	facetScores: FacetScoresMap,
): AssessmentSurfaceProjection => {
	const oceanCode5 = generateOceanCode(facetScores);
	const oceanCode4 = extract4LetterCode(oceanCode5);
	const archetype = lookupArchetype(oceanCode4);
	return { oceanCode5, oceanCode4, archetype };
};
