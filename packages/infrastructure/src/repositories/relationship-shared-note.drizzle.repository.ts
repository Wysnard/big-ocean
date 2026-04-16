import {
	DatabaseError,
	LoggerRepository,
	type RelationshipSharedNoteRecord,
	RelationshipSharedNoteRepository,
} from "@workspace/domain";
import { asc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { relationshipSharedNotes, user } from "../db/drizzle/schema";

const mapRow = (
	row: typeof relationshipSharedNotes.$inferSelect,
): RelationshipSharedNoteRecord => ({
	id: row.id,
	relationshipAnalysisId: row.relationshipAnalysisId,
	authorUserId: row.authorUserId,
	body: row.body,
	createdAt: row.createdAt,
});

export const RelationshipSharedNoteDrizzleRepositoryLive = Layer.effect(
	RelationshipSharedNoteRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		const toDatabaseError = (operation: string, error: unknown) => {
			logger.error("Database operation failed", {
				operation,
				error: error instanceof Error ? error.message : String(error),
			});
			return new DatabaseError({
				message: `Failed to ${operation}`,
			});
		};

		return RelationshipSharedNoteRepository.of({
			listByAnalysisId: (analysisId) =>
				db
					.select({
						note: relationshipSharedNotes,
						authorDisplayName: user.name,
					})
					.from(relationshipSharedNotes)
					.innerJoin(user, eq(relationshipSharedNotes.authorUserId, user.id))
					.where(eq(relationshipSharedNotes.relationshipAnalysisId, analysisId))
					.orderBy(asc(relationshipSharedNotes.createdAt))
					.pipe(
						Effect.map((rows) =>
							rows.map((row) => ({
								...mapRow(row.note),
								authorDisplayName: row.authorDisplayName,
							})),
						),
						Effect.mapError((error) => toDatabaseError("list relationship shared notes", error)),
					),

			insert: (input) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(relationshipSharedNotes)
						.values({
							relationshipAnalysisId: input.relationshipAnalysisId,
							authorUserId: input.authorUserId,
							body: input.body,
						})
						.returning()
						.pipe(Effect.mapError((error) => toDatabaseError("insert relationship shared note", error)));

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to insert shared note" }));
					}
					return mapRow(row);
				}),
		});
	}),
);
