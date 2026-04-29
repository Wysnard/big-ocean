import { ALL_FACETS, type FacetName } from "../constants/big-five";
import type { Archetype, OceanCode4, OceanCode5 } from "../types/archetype";
import type { FacetScore, FacetScoresMap } from "../types/facet-evidence";
import { extract4LetterCode, lookupArchetype } from "./archetype-lookup";
import { generateOceanCode } from "./ocean-code-generator";

/** Missing facets in persisted assessment rows hydrate to zero — distinct from evidence aggregation defaults. */
const PERSISTED_FACET_DEFAULT: FacetScore = { score: 0, confidence: 0 };

export interface AssessmentSurfaceProjection {
	readonly oceanCode5: OceanCode5;
	readonly oceanCode4: OceanCode4;
	readonly archetype: Archetype;
}

/** Facet fields as returned from persistence (may omit facets; defaults apply). */
export type PersistedFacetScoresFragment = Partial<
	Record<FacetName, { score: number; confidence: number }>
>;

/**
 * Builds a complete {@link FacetScoresMap} from persisted facet fields.
 * Every {@link ALL_FACETS} key is present; omitted facets use {@link PERSISTED_FACET_DEFAULT}.
 */
export const buildFacetScoresMap = (
	facets: PersistedFacetScoresFragment | Record<string, never>,
): FacetScoresMap => {
	const facetScoresMap = {} as FacetScoresMap;
	for (const facetName of ALL_FACETS) {
		const data = facets[facetName];
		facetScoresMap[facetName] =
			data !== undefined
				? { score: data.score, confidence: data.confidence }
				: { ...PERSISTED_FACET_DEFAULT };
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

/**
 * Canonical persisted blob → full facet map + **Assessment surface** (OCEAN + archetype).
 */
export const projectAssessmentSurfaceFromPersistedFacets = (
	facets: PersistedFacetScoresFragment | Record<string, never>,
): {
	readonly facetScoresMap: FacetScoresMap;
	readonly projection: AssessmentSurfaceProjection;
} => {
	const facetScoresMap = buildFacetScoresMap(facets);
	const projection = deriveAssessmentSurfaceFromFacetScores(facetScoresMap);
	return { facetScoresMap, projection };
};
