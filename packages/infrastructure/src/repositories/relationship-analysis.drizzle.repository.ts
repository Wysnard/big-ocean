/**
 * Relationship Analysis Repository Implementation (Story 14.4)
 *
 * Drizzle-based implementation with placeholder row pattern.
 * Canonical user ordering: userAId = MIN(inviter, invitee), userBId = MAX(inviter, invitee).
 */

import { DatabaseError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import {
	AnalysisNotFoundError,
	RelationshipAnalysisRepository,
} from "@workspace/domain/repositories/relationship-analysis.repository";
import type { RelationshipAnalysis } from "@workspace/domain/types/relationship.types";
import { Database } from "@workspace/infrastructure/context/database";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { relationshipAnalyses } from "../db/drizzle/schema";

export const RelationshipAnalysisDrizzleRepositoryLive = Layer.effect(
	RelationshipAnalysisRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		const mapRow = (row: typeof relationshipAnalyses.$inferSelect): RelationshipAnalysis => ({
			id: row.id,
			invitationId: row.invitationId,
			userAId: row.userAId,
			userBId: row.userBId,
			content: row.content,
			modelUsed: row.modelUsed,
			retryCount: row.retryCount,
			createdAt: row.createdAt,
		});

		return RelationshipAnalysisRepository.of({
			insertPlaceholder: (input) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(relationshipAnalyses)
						.values({
							invitationId: input.invitationId,
							userAId: input.userAId,
							userBId: input.userBId,
						})
						.onConflictDoNothing({ target: relationshipAnalyses.invitationId })
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "insertPlaceholder",
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to insert analysis placeholder" });
							}),
						);

					const row = rows[0];
					if (!row) {
						// onConflictDoNothing returns empty when placeholder already exists
						return null;
					}
					return mapRow(row);
				}),

			updateContent: (input) =>
				Effect.gen(function* () {
					const rows = yield* db
						.update(relationshipAnalyses)
						.set({ content: input.content, modelUsed: input.modelUsed })
						.where(and(eq(relationshipAnalyses.id, input.id), isNull(relationshipAnalyses.content)))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "updateContent",
									analysisId: input.id,
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to update analysis content" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new AnalysisNotFoundError({ analysisId: input.id }));
					}
					return mapRow(row);
				}),

			incrementRetryCount: (id) =>
				Effect.gen(function* () {
					const rows = yield* db
						.update(relationshipAnalyses)
						.set({
							retryCount: sql`${relationshipAnalyses.retryCount} + 1`,
						})
						.where(eq(relationshipAnalyses.id, id))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "incrementRetryCount",
									analysisId: id,
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({ message: "Failed to increment retry count" });
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new AnalysisNotFoundError({ analysisId: id }));
					}
					return mapRow(row);
				}),

			getByInvitationId: (invitationId) =>
				db
					.select()
					.from(relationshipAnalyses)
					.where(eq(relationshipAnalyses.invitationId, invitationId))
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "getByInvitationId",
								invitationId,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to get analysis by invitation" });
						}),
					),

			getByUserId: (userId) =>
				db
					.select()
					.from(relationshipAnalyses)
					.where(or(eq(relationshipAnalyses.userAId, userId), eq(relationshipAnalyses.userBId, userId)))
					.pipe(
						Effect.map((rows) => rows.map(mapRow)),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "getByUserId",
								userId,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to get analyses by user" });
						}),
					),

			getById: (id) =>
				db
					.select()
					.from(relationshipAnalyses)
					.where(eq(relationshipAnalyses.id, id))
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "getById",
								analysisId: id,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({ message: "Failed to get analysis by id" });
						}),
					),
		});
	}),
);
