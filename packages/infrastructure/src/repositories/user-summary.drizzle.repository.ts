import {
	DatabaseError,
	LoggerRepository,
	type UserSummaryQuoteEntry,
	type UserSummaryRecord,
	UserSummaryRepository,
	type UserSummaryThemeEntry,
	type UserSummaryUpsertInput,
} from "@workspace/domain";
import { Database } from "@workspace/infrastructure/context/database";
import { desc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { userSummaries } from "../db/drizzle/schema";

const mapThemes = (raw: unknown): readonly UserSummaryThemeEntry[] => {
	if (!Array.isArray(raw)) return [];
	return raw.filter(
		(t): t is UserSummaryThemeEntry =>
			t != null && typeof t === "object" && "theme" in t && "description" in t,
	) as UserSummaryThemeEntry[];
};

const mapQuotes = (raw: unknown): readonly UserSummaryQuoteEntry[] => {
	if (!Array.isArray(raw)) return [];
	return raw.filter(
		(q): q is UserSummaryQuoteEntry => q != null && typeof q === "object" && "quote" in q,
	) as UserSummaryQuoteEntry[];
};

const mapRow = (row: typeof userSummaries.$inferSelect): UserSummaryRecord => ({
	id: row.id,
	userId: row.userId,
	assessmentResultId: row.assessmentResultId,
	themes: mapThemes(row.themes),
	quoteBank: mapQuotes(row.quoteBank),
	summaryText: row.summaryText,
	version: row.version,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
});

export const UserSummaryDrizzleRepositoryLive = Layer.effect(
	UserSummaryRepository,
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

		return UserSummaryRepository.of({
			upsertForAssessmentResult: (input: UserSummaryUpsertInput) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(userSummaries)
						.values({
							userId: input.userId,
							assessmentResultId: input.assessmentResultId,
							themes: [...input.themes],
							quoteBank: [...input.quoteBank],
							summaryText: input.summaryText,
							version: input.version,
						})
						.onConflictDoUpdate({
							target: [userSummaries.assessmentResultId],
							set: {
								themes: [...input.themes],
								quoteBank: [...input.quoteBank],
								summaryText: input.summaryText,
								version: input.version,
								userId: input.userId,
							},
						})
						.returning()
						.pipe(Effect.mapError((e) => toDatabaseError("upsert user summary", e)));

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to upsert user summary" }));
					}
					return mapRow(row);
				}),

			getByAssessmentResultId: (assessmentResultId) =>
				db
					.select()
					.from(userSummaries)
					.where(eq(userSummaries.assessmentResultId, assessmentResultId))
					.limit(1)
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((e) => toDatabaseError("get user summary by assessment result", e)),
					),

			getLatestForUser: (userId) =>
				db
					.select()
					.from(userSummaries)
					.where(eq(userSummaries.userId, userId))
					.orderBy(desc(userSummaries.updatedAt))
					.limit(1)
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((e) => toDatabaseError("get latest user summary for user", e)),
					),
		});
	}),
);
