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
	extract4LetterCode,
	type FacetName,
	type FacetScoresMap,
	generateOceanCode,
	isLatestVersion,
	LoggerRepository,
	lookupArchetype,
	RelationshipAnalysisRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export interface RelationshipAnalysisListItem {
	readonly analysisId: string;
	readonly userAName: string;
	readonly userBName: string;
	readonly partnerName: string;
	readonly partnerArchetypeName: string;
	readonly partnerOceanCode: string;
	readonly isLatestVersion: boolean;
	readonly hasContent: boolean;
	readonly contentCompletedAt: Date | null;
	readonly createdAt: Date;
}

const UNKNOWN_ARCHETYPE_NAME = "Unknown";
const UNKNOWN_OCEAN_CODE = "?????";

/** Bounded concurrency for per-row DB + derivation work (avoid unbounded fan-out). */
const ENRICHMENT_CONCURRENCY = 10;

export const listRelationshipAnalyses = (userId: string) =>
	Effect.gen(function* () {
		const analysisRepo = yield* RelationshipAnalysisRepository;
		const resultRepo = yield* AssessmentResultRepository;
		const logger = yield* LoggerRepository;

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
					Effect.tap((result) => Effect.sync(() => latestResultMap.set(uid, result?.id ?? null))),
					Effect.catchTag("AssessmentResultError", () => {
						latestResultMap.set(uid, null);
						return Effect.void;
					}),
				),
			),
			{ concurrency: ENRICHMENT_CONCURRENCY },
		);

		// Enrich each analysis with version info
		return yield* Effect.all(
			analyses.map((analysis) =>
				Effect.gen(function* () {
					const latestA = latestResultMap.get(analysis.userAId) ?? null;
					const latestB = latestResultMap.get(analysis.userBId) ?? null;

					const versionCurrent =
						isLatestVersion(analysis.userAResultId, latestA) &&
						isLatestVersion(analysis.userBResultId, latestB);

					const partnerName = analysis.userAId === userId ? analysis.userBName : analysis.userAName;
					const partnerResultId =
						analysis.userAId === userId ? analysis.userBResultId : analysis.userAResultId;

					const partnerProfile = yield* resultRepo.getById(partnerResultId).pipe(
						Effect.flatMap((result) => {
							const facets = result?.facets;
							if (
								!result ||
								facets == null ||
								typeof facets !== "object" ||
								Object.keys(facets).length === 0
							) {
								return Effect.succeed({
									partnerArchetypeName: UNKNOWN_ARCHETYPE_NAME,
									partnerOceanCode: UNKNOWN_OCEAN_CODE,
								});
							}

							const facetScoresMap: FacetScoresMap = {} as FacetScoresMap;
							for (const [facetName, data] of Object.entries(facets)) {
								if (typeof data === "object" && data !== null && "score" in data && "confidence" in data) {
									facetScoresMap[facetName as FacetName] = {
										score: data.score,
										confidence: data.confidence,
									};
								}
							}

							if (Object.keys(facetScoresMap).length === 0) {
								return Effect.succeed({
									partnerArchetypeName: UNKNOWN_ARCHETYPE_NAME,
									partnerOceanCode: UNKNOWN_OCEAN_CODE,
								});
							}

							return Effect.try({
								try: () => {
									const partnerOceanCode = generateOceanCode(facetScoresMap);
									return {
										partnerArchetypeName: lookupArchetype(extract4LetterCode(partnerOceanCode)).name,
										partnerOceanCode,
									};
								},
								catch: (error) => new Error(error instanceof Error ? error.message : String(error)),
							}).pipe(
								Effect.catchAll(() =>
									Effect.succeed({
										partnerArchetypeName: UNKNOWN_ARCHETYPE_NAME,
										partnerOceanCode: UNKNOWN_OCEAN_CODE,
									}),
								),
							);
						}),
						Effect.catchTag("AssessmentResultError", (error) => {
							logger.warn("Failed to enrich relationship partner archetype", {
								analysisId: analysis.id,
								partnerResultId,
								error: error.message,
							});
							return Effect.succeed({
								partnerArchetypeName: UNKNOWN_ARCHETYPE_NAME,
								partnerOceanCode: UNKNOWN_OCEAN_CODE,
							});
						}),
					);

					return {
						analysisId: analysis.id,
						userAName: analysis.userAName,
						userBName: analysis.userBName,
						partnerName,
						partnerArchetypeName: partnerProfile.partnerArchetypeName,
						partnerOceanCode: partnerProfile.partnerOceanCode,
						isLatestVersion: versionCurrent,
						hasContent: analysis.content !== null,
						contentCompletedAt: analysis.contentCompletedAt,
						createdAt: analysis.createdAt,
					} satisfies RelationshipAnalysisListItem;
				}),
			),
			{ concurrency: ENRICHMENT_CONCURRENCY },
		);
	});
