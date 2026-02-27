/**
 * Get Relationship Analysis Use-Case (Story 14.4)
 *
 * Returns the full analysis content for an authorized user.
 * Authorization: requesting user must be either userAId or userBId.
 */

import {
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisRepository,
	RelationshipAnalysisUnauthorizedError,
} from "@workspace/domain";
import { Effect } from "effect";

export const getRelationshipAnalysis = (input: { analysisId: string; userId: string }) =>
	Effect.gen(function* () {
		const repo = yield* RelationshipAnalysisRepository;

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

		return {
			analysisId: analysis.id,
			content: analysis.content,
		};
	});
