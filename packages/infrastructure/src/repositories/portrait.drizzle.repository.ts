/**
 * Portrait Repository Implementation (Story 13.3)
 *
 * Two-tier portrait system with placeholder row pattern.
 * Status derived from data (content IS NULL + retry_count).
 */

import { DatabaseError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import {
	DuplicatePortraitError,
	type InsertPortraitPlaceholder,
	type Portrait,
	PortraitNotFoundError,
	PortraitRepository,
	type PortraitTier,
} from "@workspace/domain/repositories/portrait.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { and, eq, isNull, sql } from "drizzle-orm";
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
			lockedSectionTitles: row.lockedSectionTitles as ReadonlyArray<string> | null,
			modelUsed: row.modelUsed,
			retryCount: row.retryCount,
			createdAt: row.createdAt,
		});

		return PortraitRepository.of({
			insertPlaceholder: (data: InsertPortraitPlaceholder) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(portraits)
						.values({
							assessmentResultId: data.assessmentResultId,
							tier: data.tier,
							modelUsed: data.modelUsed,
							// content defaults to NULL (generating)
							// retryCount defaults to 0
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								const message = error instanceof Error ? error.message : String(error);
								// Catch unique constraint violation on (assessment_result_id, tier)
								if (message.includes("portraits_result_tier_unique")) {
									return new DuplicatePortraitError({
										assessmentResultId: data.assessmentResultId,
										tier: data.tier,
									});
								}
								logger.error("Database operation failed", {
									operation: "insertPlaceholder",
									error: message,
								});
								return new DatabaseError({ message: "Failed to insert portrait placeholder" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new DatabaseError({ message: "Insert returned no rows" }));
					}
					return mapRow(row);
				}),

			updateContent: (id: string, content: string) =>
				Effect.gen(function* () {
					// Idempotent: only updates if content IS NULL
					const rows = yield* db
						.update(portraits)
						.set({ content })
						.where(and(eq(portraits.id, id), isNull(portraits.content)))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "updateContent",
									portraitId: id,
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to update portrait content" });
							}),
						);

					const row = rows[0];
					if (!row) {
						// Either portrait doesn't exist OR content already set (idempotent)
						return yield* Effect.fail(new PortraitNotFoundError({ portraitId: id }));
					}
					return mapRow(row);
				}),

			incrementRetryCount: (id: string) =>
				Effect.gen(function* () {
					const rows = yield* db
						.update(portraits)
						.set({
							retryCount: sql`${portraits.retryCount} + 1`,
						})
						.where(eq(portraits.id, id))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "incrementRetryCount",
									portraitId: id,
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to increment retry count" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new PortraitNotFoundError({ portraitId: id }));
					}
					return mapRow(row);
				}),

			updateLockedSectionTitles: (id: string, titles: ReadonlyArray<string>) =>
				Effect.gen(function* () {
					const rows = yield* db
						.update(portraits)
						.set({ lockedSectionTitles: [...titles] })
						.where(eq(portraits.id, id))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "updateLockedSectionTitles",
									portraitId: id,
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to update locked section titles" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new PortraitNotFoundError({ portraitId: id }));
					}
					return mapRow(row);
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
