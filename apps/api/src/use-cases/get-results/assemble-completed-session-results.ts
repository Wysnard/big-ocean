import {
	AssessmentResultRepository,
	AssessmentResultsNotReady,
	buildAssessmentResultsViewFromPersistedFacets,
	type FacetResult,
	isLatestVersion,
	MessageRepository,
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
				new AssessmentResultsNotReady({
					sessionId: input.sessionId,
					currentStage: null,
					message: "Assessment results are not ready yet",
				}),
			);
		}

		if (result.stage !== "completed") {
			return yield* Effect.fail(
				new AssessmentResultsNotReady({
					sessionId: input.sessionId,
					currentStage: result.stage ?? null,
					message: "Assessment results are not ready yet",
				}),
			);
		}

		const view = buildAssessmentResultsViewFromPersistedFacets(result.facets);

		let latestVersion = true;
		const latestResult = yield* resultRepo
			.getLatestByUserId(input.authenticatedUserId)
			.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null)));
		latestVersion = isLatestVersion(result.id, latestResult?.id ?? null);

		return {
			oceanCode5: view.oceanCode5,
			oceanCode4: view.oceanCode4,
			archetypeName: view.archetypeName,
			archetypeDescription: view.archetypeDescription,
			archetypeColor: view.archetypeColor,
			isCurated: view.isCurated,
			traits: view.traits,
			facets: view.facets,
			overallConfidence: view.overallConfidence,
			messageCount: messages.length,
			isLatestVersion: latestVersion,
		} satisfies AssembledCompletedSessionResults;
	});
