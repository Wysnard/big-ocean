import {
	AssessmentResultError,
	AssessmentResultRepository,
	BIG_FIVE_TRAITS,
	calculateConfidenceFromFacetScores,
	computeTraitResults,
	FACET_DESCRIPTIONS,
	FACET_LEVEL_LABELS,
	FACET_TO_TRAIT,
	type FacetName,
	type FacetResult,
	getFacetLevel,
	isLatestVersion,
	MessageRepository,
	projectAssessmentSurfaceFromPersistedFacets,
	TRAIT_LETTER_MAP,
	type TraitResult,
} from "@workspace/domain";
import { Effect } from "effect";

export interface AssembleCompletedSessionResultsInput {
	readonly sessionId: string;
	readonly authenticatedUserId: string;
}

export interface AssembledCompletedSessionResults {
	readonly oceanCode5: string;
	readonly oceanCode4: string;
	readonly archetypeName: string;
	readonly archetypeDescription: string;
	readonly archetypeColor: string;
	readonly isCurated: boolean;
	readonly traits: readonly TraitResult[];
	readonly facets: readonly FacetResult[];
	readonly overallConfidence: number;
	readonly messageCount: number;
	readonly isLatestVersion: boolean;
}

const mapScoreToLevel = (traitName: string, score: number): string => {
	const letters = TRAIT_LETTER_MAP[traitName as keyof typeof TRAIT_LETTER_MAP];
	if (score < 40) return letters[0];
	if (score < 80) return letters[1];
	return letters[2];
};

/**
 * Reads persisted assessment result and messages; builds trait/facet views,
 * **Assessment surface** projection, confidence, and latest-version flag.
 */
export const assembleCompletedSessionResults = (input: AssembleCompletedSessionResultsInput) =>
	Effect.gen(function* () {
		const resultRepo = yield* AssessmentResultRepository;
		const messageRepo = yield* MessageRepository;

		const messages = yield* messageRepo.getMessages(input.sessionId);

		const result = yield* resultRepo.getBySessionId(input.sessionId);
		if (!result) {
			return yield* Effect.fail(
				new AssessmentResultError({
					message: `Assessment results not found for completed session '${input.sessionId}'`,
				}),
			);
		}

		const { facetScoresMap, projection } = projectAssessmentSurfaceFromPersistedFacets(result.facets);

		const computedTraits = computeTraitResults(facetScoresMap);

		const overallConfidence =
			Math.round(calculateConfidenceFromFacetScores(facetScoresMap) * 100) / 100;

		const traits: TraitResult[] = BIG_FIVE_TRAITS.map((traitName) => {
			const traitScore = computedTraits[traitName];
			return {
				name: traitName,
				score: Math.round(traitScore.score),
				level: mapScoreToLevel(traitName, traitScore.score),
				confidence: traitScore.confidence,
			};
		});

		const facets: FacetResult[] = (Object.keys(facetScoresMap) as FacetName[]).map((facetName) => {
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

		let latestVersion = true;
		const latestResult = yield* resultRepo
			.getLatestByUserId(input.authenticatedUserId)
			.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null)));
		latestVersion = isLatestVersion(result.id, latestResult?.id ?? null);

		return {
			oceanCode5: projection.oceanCode5,
			oceanCode4: projection.oceanCode4,
			archetypeName: projection.archetype.name,
			archetypeDescription: projection.archetype.description,
			archetypeColor: projection.archetype.color,
			isCurated: projection.archetype.isCurated,
			traits,
			facets,
			overallConfidence,
			messageCount: messages.length,
			isLatestVersion: latestVersion,
		} satisfies AssembledCompletedSessionResults;
	});
