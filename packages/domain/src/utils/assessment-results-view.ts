import { FACET_TO_TRAIT, type FacetName, type TraitName } from "../constants/big-five";
import { FACET_DESCRIPTIONS } from "../constants/facet-descriptions";
import type { FacetResult, TraitResult } from "../schemas/result-schemas";
import { TRAIT_LETTER_MAP } from "../types/archetype";
import { FACET_LEVEL_LABELS } from "../types/facet-levels";
import { BIG_FIVE_TRAITS } from "../types/trait";
import {
	type PersistedFacetScoresFragment,
	projectAssessmentSurfaceFromPersistedFacets,
} from "./assessment-surface-projection";
import { calculateConfidenceFromFacetScores } from "./confidence";
import { getFacetLevel } from "./facet-level";
import { computeTraitResults } from "./score-computation";

const mapTraitScoreToLevel = (traitName: TraitName, score: number): string => {
	const letters = TRAIT_LETTER_MAP[traitName];
	if (score < 40) return letters[0];
	if (score < 80) return letters[1];
	return letters[2];
};

export interface AssessmentResultsView {
	readonly oceanCode5: string;
	readonly oceanCode4: string;
	readonly archetypeName: string;
	readonly archetypeDescription: string;
	readonly archetypeColor: string;
	readonly isCurated: boolean;
	readonly traits: readonly TraitResult[];
	readonly facets: readonly FacetResult[];
	readonly overallConfidence: number;
}

/**
 * Canonical persisted facet blob → **Assessment surface** + trait/facet presentation used by results reads.
 */
export const buildAssessmentResultsViewFromPersistedFacets = (
	facets: PersistedFacetScoresFragment | Record<string, never>,
): AssessmentResultsView => {
	const { facetScoresMap, projection } = projectAssessmentSurfaceFromPersistedFacets(facets);

	const computedTraits = computeTraitResults(facetScoresMap);

	const overallConfidence =
		Math.round(calculateConfidenceFromFacetScores(facetScoresMap) * 100) / 100;

	const traits: TraitResult[] = BIG_FIVE_TRAITS.map((traitName) => {
		const traitScore = computedTraits[traitName];
		return {
			name: traitName,
			score: Math.round(traitScore.score),
			level: mapTraitScoreToLevel(traitName, traitScore.score),
			confidence: traitScore.confidence,
		};
	});

	const facetsOut: FacetResult[] = (Object.keys(facetScoresMap) as FacetName[]).map((facetName) => {
		const facetData = facetScoresMap[facetName];
		const level = getFacetLevel(facetName, facetData.score);
		const levelLabel = FACET_LEVEL_LABELS[level];
		const levelDescription =
			FACET_DESCRIPTIONS[facetName].levels[
				level as keyof (typeof FACET_DESCRIPTIONS)[typeof facetName]["levels"]
			];
		if (levelDescription === undefined) {
			throw new Error(`Missing facet description for ${facetName}:${level}`);
		}
		return {
			name: facetName,
			traitName: FACET_TO_TRAIT[facetName],
			score: Math.round(facetData.score),
			confidence: facetData.confidence,
			level,
			levelLabel,
			levelDescription,
		};
	});

	return {
		oceanCode5: projection.oceanCode5,
		oceanCode4: projection.oceanCode4,
		archetypeName: projection.archetype.name,
		archetypeDescription: projection.archetype.description,
		archetypeColor: projection.archetype.color,
		isCurated: projection.archetype.isCurated,
		traits,
		facets: facetsOut,
		overallConfidence,
	};
};
