/**
 * Get Relationship Analysis Use-Case (Story 14.4, extended Story 36-3, Story 35-1)
 *
 * Returns the analysis content + participant names for an authorized user.
 * Authorization: requesting user must be either userAId or userBId.
 *
 * Story 35-1: Returns participant names; content may be null (still generating).
 * Story 36-3: Adds isLatestVersion — derive-at-read version detection.
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

		const analysis = yield* repo.getByIdWithParticipantNames(input.analysisId);

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
			userAName: analysis.userAName,
			userBName: analysis.userBName,
		};
	});
