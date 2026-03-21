/**
 * Portrait Rating Drizzle Repository (Story 19-2)
 *
 * Persists portrait quality telemetry ratings to PostgreSQL.
 */

import { DatabaseError } from "@workspace/domain/errors/http.errors";
import { PortraitRatingRepository } from "@workspace/domain/repositories/portrait-rating.repository";
import type {
	DepthSignalLevel,
	PortraitRating,
	PortraitRatingRecord,
	PortraitType,
} from "@workspace/domain/types/portrait-rating.types";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { portraitRatings } from "../db/drizzle/schema";

export const PortraitRatingDrizzleRepositoryLive = Layer.effect(
	PortraitRatingRepository,
	Effect.gen(function* () {
		const db = yield* Database;

		return {
			insertRating: (input) =>
				db
					.insert(portraitRatings)
					.values({
						userId: input.userId,
						assessmentSessionId: input.assessmentSessionId,
						portraitType: input.portraitType,
						rating: input.rating,
						depthSignal: input.depthSignal,
						evidenceCount: input.evidenceCount,
					})
					.returning()
					.pipe(
						Effect.map((rows) => {
							const row = rows[0]!;
							return {
								id: row.id,
								userId: row.userId,
								assessmentSessionId: row.assessmentSessionId,
								portraitType: row.portraitType as PortraitType,
								rating: row.rating as PortraitRating,
								depthSignal: row.depthSignal as DepthSignalLevel,
								evidenceCount: row.evidenceCount,
								createdAt: row.createdAt,
							} satisfies PortraitRatingRecord;
						}),
						Effect.catchAll((error) =>
							Effect.fail(
								new DatabaseError({
									message: `Failed to insert portrait rating: ${String(error)}`,
								}),
							),
						),
					),
		};
	}),
);
