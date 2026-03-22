/**
 * Assessment Result Repository Implementation (Drizzle)
 *
 * Persists final scored results from the finalization pipeline.
 * Supports staged idempotency (scored → completed) via Story 18-4.
 *
 * Story 11.2, 18-4
 */
import {
	AssessmentResultError,
	type AssessmentResultRecord,
	AssessmentResultRepository,
} from "@workspace/domain";
import { and, desc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { assessmentResults, assessmentSession } from "../db/drizzle/schema";

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
							stage: input.stage ?? null,
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

			update: (id, input) =>
				Effect.gen(function* () {
					const rows = yield* db
						.update(assessmentResults)
						.set(input)
						.where(eq(assessmentResults.id, id))
						.returning()
						.pipe(
							Effect.mapError(
								(error) =>
									new AssessmentResultError({
										message: `Failed to update assessment result: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new AssessmentResultError({
								message: `Assessment result not found: ${id}`,
							}),
						);
					}

					return mapRow(row);
				}),

			upsert: (input) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(assessmentResults)
						.values({
							assessmentSessionId: input.assessmentSessionId,
							facets: input.facets,
							traits: input.traits,
							domainCoverage: input.domainCoverage,
							portrait: input.portrait,
							stage: input.stage ?? null,
						})
						.onConflictDoUpdate({
							target: assessmentResults.assessmentSessionId,
							set: {
								facets: input.facets,
								traits: input.traits,
								domainCoverage: input.domainCoverage,
								portrait: input.portrait,
								stage: input.stage ?? null,
							},
						})
						.returning()
						.pipe(
							Effect.mapError(
								(error) =>
									new AssessmentResultError({
										message: `Failed to upsert assessment result: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new AssessmentResultError({
								message: "No row returned from assessment result upsert",
							}),
						);
					}

					return mapRow(row);
				}),

			getLatestByUserId: (userId) =>
				Effect.gen(function* () {
					const rows = yield* db
						.select({
							id: assessmentResults.id,
							assessmentSessionId: assessmentResults.assessmentSessionId,
							facets: assessmentResults.facets,
							traits: assessmentResults.traits,
							domainCoverage: assessmentResults.domainCoverage,
							portrait: assessmentResults.portrait,
							stage: assessmentResults.stage,
							createdAt: assessmentResults.createdAt,
						})
						.from(assessmentResults)
						.innerJoin(assessmentSession, eq(assessmentResults.assessmentSessionId, assessmentSession.id))
						.where(and(eq(assessmentSession.userId, userId), eq(assessmentResults.stage, "completed")))
						.orderBy(desc(assessmentResults.createdAt))
						.limit(1)
						.pipe(
							Effect.mapError(
								(error) =>
									new AssessmentResultError({
										message: `Failed to get latest result by userId: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					const row = rows[0];
					if (!row) return null;

					return mapRow(row as typeof assessmentResults.$inferSelect);
				}),

			updateStage: (sessionId, stage) =>
				Effect.gen(function* () {
					const rows = yield* db
						.update(assessmentResults)
						.set({ stage })
						.where(eq(assessmentResults.assessmentSessionId, sessionId))
						.returning()
						.pipe(
							Effect.mapError(
								(error) =>
									new AssessmentResultError({
										message: `Failed to update stage: ${error instanceof Error ? error.message : String(error)}`,
									}),
							),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new AssessmentResultError({
								message: `Assessment result not found for session: ${sessionId}`,
							}),
						);
					}

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
		stage: row.stage as AssessmentResultRecord["stage"],
		createdAt: row.createdAt as Date,
	};
}
