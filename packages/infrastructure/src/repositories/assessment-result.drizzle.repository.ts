/**
 * Assessment Result Repository Implementation (Drizzle)
 *
 * Persists final scored results from the finalization pipeline.
 * Phase 1 creates placeholder rows; Story 11.3 fills in real scores.
 *
 * Story 11.2
 */
import {
	AssessmentResultError,
	type AssessmentResultRecord,
	AssessmentResultRepository,
} from "@workspace/domain";
import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { assessmentResults } from "../db/drizzle/schema";

export const AssessmentResultDrizzleRepositoryLive = Layer.effect(
	AssessmentResultRepository,
	Effect.gen(function* () {
		const db = yield* Database;

		return AssessmentResultRepository.of({
			create: (input) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(assessmentResults)
						.values({
							assessmentSessionId: input.assessmentSessionId,
							facets: input.facets,
							traits: input.traits,
							domainCoverage: input.domainCoverage,
							portrait: input.portrait,
						})
						.returning()
						.pipe(
							Effect.mapError(
								(error) =>
									new AssessmentResultError({
										message: `Failed to create assessment result: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new AssessmentResultError({
								message: "No row returned from assessment result insert",
							}),
						);
					}

					return mapRow(row);
				}),

			getBySessionId: (sessionId) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select()
						.from(assessmentResults)
						.where(eq(assessmentResults.assessmentSessionId, sessionId))
						.limit(1)
						.pipe(
							Effect.mapError(
								(error) =>
									new AssessmentResultError({
										message: `Failed to get assessment result: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					const row = rows[0];
					if (!row) return null;

					return mapRow(row);
				}),
		});
	}),
);

function mapRow(row: typeof assessmentResults.$inferSelect): AssessmentResultRecord {
	return {
		id: row.id,
		assessmentSessionId: row.assessmentSessionId,
		facets: row.facets as AssessmentResultRecord["facets"],
		traits: row.traits as AssessmentResultRecord["traits"],
		domainCoverage: row.domainCoverage as AssessmentResultRecord["domainCoverage"],
		portrait: row.portrait,
		createdAt: row.createdAt as Date,
	};
}
