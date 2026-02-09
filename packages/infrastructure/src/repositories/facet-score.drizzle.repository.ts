/**
 * Facet Score Repository Implementation (Drizzle)
 *
 * Reads persisted aggregated facet scores from the facet_scores table.
 * Returns a complete FacetScoresMap with all 30 facets.
 */

import {
	createInitialFacetScoresMap,
	DatabaseError,
	type FacetName,
	FacetScoreRepository,
	isFacetName,
	LoggerRepository,
} from "@workspace/domain";
import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { facetScores } from "../db/drizzle/schema";

export const FacetScoreDrizzleRepositoryLive = Layer.effect(
	FacetScoreRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return FacetScoreRepository.of({
			getBySession: (sessionId: string) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select({
							facetName: facetScores.facetName,
							score: facetScores.score,
							confidence: facetScores.confidence,
						})
						.from(facetScores)
						.where(eq(facetScores.sessionId, sessionId))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Failed to query facet scores", {
										operation: "getBySession",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (_logError) {
									// Prevent logging from breaking error handling
								}
								return new DatabaseError({
									message: "Failed to query facet scores",
								});
							}),
						);

					// Initialize with defaults, then overlay stored scores
					const result = createInitialFacetScoresMap();

					for (const row of rows) {
						if (isFacetName(row.facetName)) {
							result[row.facetName as FacetName] = {
								score: row.score,
								confidence: row.confidence,
							};
						}
					}

					logger.info("Facet scores loaded", {
						sessionId,
						storedCount: rows.length,
					});

					return result;
				}),
		});
	}),
);
