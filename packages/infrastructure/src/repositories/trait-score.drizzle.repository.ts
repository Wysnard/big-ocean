/**
 * Trait Score Repository Implementation (Drizzle)
 *
 * Reads persisted trait scores from the trait_scores table.
 * Returns a complete TraitScoresMap with all 5 traits.
 */

import {
	createInitialTraitScoresMap,
	DatabaseError,
	isTraitName,
	LoggerRepository,
	type TraitName,
	TraitScoreRepository,
} from "@workspace/domain";
import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { traitScores } from "../db/drizzle/schema";

export const TraitScoreDrizzleRepositoryLive = Layer.effect(
	TraitScoreRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return TraitScoreRepository.of({
			getBySession: (sessionId: string) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select({
							traitName: traitScores.traitName,
							score: traitScores.score,
							confidence: traitScores.confidence,
						})
						.from(traitScores)
						.where(eq(traitScores.sessionId, sessionId))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Failed to query trait scores", {
										operation: "getBySession",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (_logError) {
									// Prevent logging from breaking error handling
								}
								return new DatabaseError({
									message: "Failed to query trait scores",
								});
							}),
						);

					// Initialize with defaults, then overlay stored scores
					const result = createInitialTraitScoresMap();

					for (const row of rows) {
						if (isTraitName(row.traitName)) {
							result[row.traitName as TraitName] = {
								score: row.score,
								confidence: row.confidence,
							};
						}
					}

					logger.info("Trait scores loaded", {
						sessionId,
						storedCount: rows.length,
					});

					return result;
				}),
		});
	}),
);
