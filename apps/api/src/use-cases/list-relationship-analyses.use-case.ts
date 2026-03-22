/**
 * List Relationship Analyses Use-Case (Story 35-4)
 *
 * Returns all relationship analyses for a user with derive-at-read version detection.
 * Each analysis is enriched with isLatestVersion flag using the shared utility.
 *
 * Fail-open: if getLatestByUserId errors, defaults to isLatestVersion = true.
 */

import {
	AssessmentResultRepository,
	isLatestVersion,
	RelationshipAnalysisRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export interface RelationshipAnalysisListItem {
	readonly analysisId: string;
	readonly userAName: string;
	readonly userBName: string;
	readonly isLatestVersion: boolean;
	readonly hasContent: boolean;
	readonly createdAt: Date;
}

export const listRelationshipAnalyses = (userId: string) =>
	Effect.gen(function* () {
		const analysisRepo = yield* RelationshipAnalysisRepository;
		const resultRepo = yield* AssessmentResultRepository;

		const analyses = yield* analysisRepo.listByUserId(userId);

		if (analyses.length === 0) {
			return [] as ReadonlyArray<RelationshipAnalysisListItem>;
		}

		// Collect unique user IDs from all analyses
		const uniqueUserIds = new Set<string>();
		for (const analysis of analyses) {
			uniqueUserIds.add(analysis.userAId);
			uniqueUserIds.add(analysis.userBId);
		}

		// Batch fetch latest result IDs (fail-open: default to null on error)
		const latestResultMap = new Map<string, string | null>();
		yield* Effect.all(
			[...uniqueUserIds].map((uid) =>
				resultRepo.getLatestByUserId(uid).pipe(
					Effect.map((result) => {
						latestResultMap.set(uid, result?.id ?? null);
					}),
					Effect.catchTag("AssessmentResultError", () => {
						latestResultMap.set(uid, null);
						return Effect.void;
					}),
				),
			),
			{ concurrency: "unbounded" },
		);

		// Enrich each analysis with version info
		return analyses.map((analysis) => {
			const latestA = latestResultMap.get(analysis.userAId) ?? null;
			const latestB = latestResultMap.get(analysis.userBId) ?? null;

			const versionCurrent =
				isLatestVersion(analysis.userAResultId, latestA) &&
				isLatestVersion(analysis.userBResultId, latestB);

			return {
				analysisId: analysis.id,
				userAName: analysis.userAName,
				userBName: analysis.userBName,
				isLatestVersion: versionCurrent,
				hasContent: analysis.content !== null,
				createdAt: analysis.createdAt,
			} satisfies RelationshipAnalysisListItem;
		});
	});
