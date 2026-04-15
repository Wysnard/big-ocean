import {
	DatabaseError,
	LoggerRepository,
	resolveIsoWeekBounds,
	type WeeklySummary,
	WeeklySummaryRepository,
	type WeeklySummarySaveInput,
} from "@workspace/domain";
import { Database } from "@workspace/infrastructure/context/database";
import { and, desc, eq, sql } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { weeklySummaries } from "../db/drizzle/schema";

const mapRow = (row: typeof weeklySummaries.$inferSelect): WeeklySummary => ({
	id: row.id,
	userId: row.userId,
	weekStartDate:
		typeof row.weekStartDate === "string" ? row.weekStartDate : String(row.weekStartDate),
	weekEndDate: typeof row.weekEndDate === "string" ? row.weekEndDate : String(row.weekEndDate),
	content: row.content ?? null,
	generatedAt: row.generatedAt ?? null,
	failedAt: row.failedAt ?? null,
	retryCount: row.retryCount,
	createdAt: row.createdAt,
});

export const WeeklySummaryDrizzleRepositoryLive = Layer.effect(
	WeeklySummaryRepository,
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

		return WeeklySummaryRepository.of({
			save: (input: WeeklySummarySaveInput) =>
				Effect.gen(function* () {
					if (input.outcome === "generated") {
						const rows = yield* db
							.insert(weeklySummaries)
							.values({
								userId: input.userId,
								weekStartDate: input.weekStartDate,
								weekEndDate: input.weekEndDate,
								content: input.content,
								generatedAt: input.generatedAt,
								failedAt: null,
								retryCount: 0,
							})
							.onConflictDoUpdate({
								target: [weeklySummaries.userId, weeklySummaries.weekStartDate],
								set: {
									weekEndDate: input.weekEndDate,
									content: input.content,
									generatedAt: input.generatedAt,
									failedAt: null,
									retryCount: 0,
								},
							})
							.returning()
							.pipe(Effect.mapError((e) => toDatabaseError("save weekly summary (generated)", e)));

						const row = rows[0];
						if (!row) {
							return yield* Effect.fail(new DatabaseError({ message: "Failed to save weekly summary" }));
						}
						return mapRow(row);
					}

					const rows = yield* db
						.insert(weeklySummaries)
						.values({
							userId: input.userId,
							weekStartDate: input.weekStartDate,
							weekEndDate: input.weekEndDate,
							content: null,
							generatedAt: null,
							failedAt: input.failedAt,
							retryCount: 1,
						})
						.onConflictDoUpdate({
							target: [weeklySummaries.userId, weeklySummaries.weekStartDate],
							set: {
								weekEndDate: input.weekEndDate,
								failedAt: input.failedAt,
								retryCount: sql`${weeklySummaries.retryCount} + 1`,
							},
						})
						.returning()
						.pipe(Effect.mapError((e) => toDatabaseError("save weekly summary (failed)", e)));

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to record weekly failure" }));
					}
					return mapRow(row);
				}),

			getByUserAndWeekStart: (userId, weekStartDate) =>
				db
					.select()
					.from(weeklySummaries)
					.where(
						and(eq(weeklySummaries.userId, userId), eq(weeklySummaries.weekStartDate, weekStartDate)),
					)
					.limit(1)
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((e) => toDatabaseError("get weekly summary by user and week start", e)),
					),

			getByWeekId: (userId, weekId) =>
				Effect.gen(function* () {
					const bounds = resolveIsoWeekBounds(weekId);
					if (!bounds) {
						return yield* Effect.fail(
							new DatabaseError({ message: `Invalid weekId for weekly summary: ${weekId}` }),
						);
					}
					const rows = yield* db
						.select()
						.from(weeklySummaries)
						.where(
							and(
								eq(weeklySummaries.userId, userId),
								eq(weeklySummaries.weekStartDate, bounds.weekStartLocal),
							),
						)
						.limit(1)
						.pipe(Effect.mapError((e) => toDatabaseError("get weekly summary by week id", e)));

					return rows[0] ? mapRow(rows[0]) : null;
				}),

			getByUserId: (userId) =>
				db
					.select()
					.from(weeklySummaries)
					.where(eq(weeklySummaries.userId, userId))
					.orderBy(desc(weeklySummaries.weekStartDate))
					.pipe(
						Effect.map((rows) => rows.map(mapRow)),
						Effect.mapError((e) => toDatabaseError("list weekly summaries for user", e)),
					),

			getLatestForUser: (userId) =>
				db
					.select()
					.from(weeklySummaries)
					.where(eq(weeklySummaries.userId, userId))
					.orderBy(desc(weeklySummaries.weekStartDate))
					.limit(1)
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((e) => toDatabaseError("get latest weekly summary", e)),
					),
		});
	}),
);
