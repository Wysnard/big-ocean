/**
 * Get Relationship Analysis Use-Case (Story 14.4, extended Story 36-3)
 *
 * Returns the full analysis content for an authorized user.
 * Authorization: requesting user must be either userAId or userBId.
 *
 * Story 36-3: Adds isLatestVersion — derive-at-read version detection.
 * If either user has a newer completed result than the one linked to the analysis,
 * the analysis is classified as "previous version".
 */

import {
	AssessmentResultRepository,
	isLatestVersion,
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisRepository,
	RelationshipAnalysisUnauthorizedError,
} from "@workspace/domain";
import { Effect } from "effect";

export const getRelationshipAnalysis = (input: { analysisId: string; userId: string }) =>
	Effect.gen(function* () {
		const repo = yield* RelationshipAnalysisRepository;
		const resultRepo = yield* AssessmentResultRepository;

		const analysis = yield* repo.getById(input.analysisId);

		if (!analysis) {
			return yield* Effect.fail(
				new RelationshipAnalysisNotFoundError({
					message: `Relationship analysis not found: ${input.analysisId}`,
				}),
			);
		}

		if (analysis.userAId !== input.userId && analysis.userBId !== input.userId) {
			return yield* Effect.fail(
				new RelationshipAnalysisUnauthorizedError({
					message: "You are not authorized to view this analysis",
				}),
			);
		}

		if (analysis.content === null) {
			return yield* Effect.fail(
				new RelationshipAnalysisNotFoundError({
					message: "Relationship analysis is still being generated",
				}),
			);
		}

		// Story 36-3: Derive-at-read version detection (fail-open: default to latest on error)
		const [latestUserA, latestUserB] = yield* Effect.all([
			resultRepo
				.getLatestByUserId(analysis.userAId)
				.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null))),
			resultRepo
				.getLatestByUserId(analysis.userBId)
				.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null))),
		]);

		const versionCurrent =
			isLatestVersion(analysis.userAResultId, latestUserA?.id ?? null) &&
			isLatestVersion(analysis.userBResultId, latestUserB?.id ?? null);

		return {
			analysisId: analysis.id,
			content: analysis.content,
			isLatestVersion: versionCurrent,
		};
	});
