/**
 * Portrait Repository Implementation (Story 13.3, refactored for queue-based generation)
 *
 * Row inserted only on final outcome: content (success) or failedAt (failure).
 * Status derived from portrait row + purchase event.
 */

import { DatabaseError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import {
	type InsertPortraitFailed,
	type InsertPortraitWithContent,
	type Portrait,
	PortraitRepository,
	type PortraitTier,
} from "@workspace/domain/repositories/portrait.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { and, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { assessmentResults, assessmentSession, portraits } from "../db/drizzle/schema";

export const PortraitDrizzleRepositoryLive = Layer.effect(
	PortraitRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		const mapRow = (row: typeof portraits.$inferSelect): Portrait => ({
			id: row.id,
			assessmentResultId: row.assessmentResultId,
			tier: row.tier as PortraitTier,
			content: row.content,
			modelUsed: row.modelUsed,
			failedAt: row.failedAt,
			createdAt: row.createdAt,
		});

		return PortraitRepository.of({
			insertWithContent: (data: InsertPortraitWithContent) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(portraits)
						.values({
							assessmentResultId: data.assessmentResultId,
							tier: data.tier,
							content: data.content,
							modelUsed: data.modelUsed,
						})
						.onConflictDoNothing()
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "insertWithContent",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to insert portrait" });
							}),
						);

					return rows[0] ? mapRow(rows[0]) : null;
				}),

			insertFailed: (data: InsertPortraitFailed) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(portraits)
						.values({
							assessmentResultId: data.assessmentResultId,
							tier: data.tier,
							failedAt: data.failedAt,
						})
						.onConflictDoNothing()
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "insertFailed",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to insert failed portrait" });
							}),
						);

					return rows[0] ? mapRow(rows[0]) : null;
				}),

			deleteByResultIdAndTier: (assessmentResultId: string, tier: PortraitTier) =>
				Effect.gen(function* () {
					const rows = yield* db
						.delete(portraits)
						.where(and(eq(portraits.assessmentResultId, assessmentResultId), eq(portraits.tier, tier)))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "deleteByResultIdAndTier",
									assessmentResultId,
									tier,
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to delete portrait" });
							}),
						);

					return rows.length > 0;
				}),

			getByResultIdAndTier: (assessmentResultId: string, tier: PortraitTier) =>
				db
					.select()
					.from(portraits)
					.where(and(eq(portraits.assessmentResultId, assessmentResultId), eq(portraits.tier, tier)))
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "getByResultIdAndTier",
								assessmentResultId,
								tier,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to get portrait" });
						}),
					),

			getFullPortraitBySessionId: (sessionId: string) =>
				db
					.select({
						portrait: portraits,
					})
					.from(assessmentSession)
					.innerJoin(assessmentResults, eq(assessmentResults.assessmentSessionId, assessmentSession.id))
					.innerJoin(portraits, eq(portraits.assessmentResultId, assessmentResults.id))
					.where(and(eq(assessmentSession.id, sessionId), eq(portraits.tier, "full")))
					.pipe(
						Effect.map((rows) => (rows[0]?.portrait ? mapRow(rows[0].portrait) : null)),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "getFullPortraitBySessionId",
								sessionId,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to get full portrait" });
						}),
					),
		});
	}),
);
