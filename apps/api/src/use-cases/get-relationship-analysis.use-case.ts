/**
 * Get Relationship Analysis Use-Case (Story 14.4, extended Story 36-3, Story 35-1, Story 7.3)
 *
 * Returns the analysis content + participant names for an authorized user.
 * Authorization: requesting user must be either userAId or userBId.
 *
 * Story 35-1: Returns participant names; content may be null (still generating).
 * Story 36-3: Adds isLatestVersion — derive-at-read version detection.
 * Story 7.3: Adds locked-result facet/trait maps + letter history timestamps for living page.
 */

import {
	type AssessmentResultRecord,
	AssessmentResultRepository,
	isLatestVersion,
	RelationshipAnalysisNotFoundError,
	RelationshipAnalysisRepository,
	RelationshipAnalysisUnauthorizedError,
} from "@workspace/domain";
import { Effect } from "effect";

type ScoreConfidence = { score: number; confidence: number };

function serializeScoreMap(
	record: AssessmentResultRecord["facets"] | AssessmentResultRecord["traits"],
): Record<string, ScoreConfidence> {
	if (!record || Object.keys(record).length === 0) return {};
	const out: Record<string, ScoreConfidence> = {};
	for (const [k, v] of Object.entries(record)) {
		out[k] = { score: v.score, confidence: v.confidence };
	}
	return out;
}

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

		const content =
			analysis.content === null || analysis.content === undefined
				? null
				: analysis.content.trim() === ""
					? null
					: analysis.content;

		if (content === null) {
			return {
				analysisId: analysis.id,
				content: null,
				isLatestVersion: true,
				userAName: analysis.userAName,
				userBName: analysis.userBName,
				userAFacets: {},
				userBFacets: {},
				userATraits: {},
				userBTraits: {},
				contentCompletedAt: analysis.contentCompletedAt?.toISOString() ?? null,
				createdAt: analysis.createdAt.toISOString(),
			};
		}

		// Story 36-3: Derive-at-read version detection (fail-open: default to latest on error)
		const [latestUserA, latestUserB, resultA, resultB] = yield* Effect.all([
			resultRepo
				.getLatestByUserId(analysis.userAId)
				.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null))),
			resultRepo
				.getLatestByUserId(analysis.userBId)
				.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null))),
			resultRepo
				.getById(analysis.userAResultId)
				.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null))),
			resultRepo
				.getById(analysis.userBResultId)
				.pipe(Effect.catchTag("AssessmentResultError", () => Effect.succeed(null))),
		]);

		const versionCurrent =
			isLatestVersion(analysis.userAResultId, latestUserA?.id ?? null) &&
			isLatestVersion(analysis.userBResultId, latestUserB?.id ?? null);

		return {
			analysisId: analysis.id,
			content,
			isLatestVersion: versionCurrent,
			userAName: analysis.userAName,
			userBName: analysis.userBName,
			userAFacets: serializeScoreMap(resultA?.facets ?? {}),
			userBFacets: serializeScoreMap(resultB?.facets ?? {}),
			userATraits: serializeScoreMap(resultA?.traits ?? {}),
			userBTraits: serializeScoreMap(resultB?.traits ?? {}),
			contentCompletedAt: analysis.contentCompletedAt?.toISOString() ?? null,
			createdAt: analysis.createdAt.toISOString(),
		};
	});
