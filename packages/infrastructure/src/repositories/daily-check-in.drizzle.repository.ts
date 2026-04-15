import {
	type DailyCheckIn,
	type DailyCheckInMood,
	DailyCheckInRepository,
	type DailyCheckInVisibility,
	DatabaseError,
	LoggerRepository,
	type UpsertDailyCheckIn,
} from "@workspace/domain";
import { and, asc, count, eq, gte, lte } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { dailyCheckIns } from "../db/drizzle/schema";

const mapRow = (row: typeof dailyCheckIns.$inferSelect): DailyCheckIn => ({
	id: row.id,
	userId: row.userId,
	localDate: row.localDate,
	mood: row.mood as DailyCheckInMood,
	note: row.note ?? null,
	visibility: row.visibility as DailyCheckInVisibility,
	createdAt: row.createdAt,
});

export const DailyCheckInDrizzleRepositoryLive = Layer.effect(
	DailyCheckInRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		const toDatabaseError = (operation: string, error: unknown) => {
			logger.error("Database operation failed", {
				operation,
				error: error instanceof Error ? error.message : String(error),
			});

			return new DatabaseError({
				message: `Failed to ${operation.replace(/([A-Z])/g, " $1").toLowerCase()}`,
			});
		};

		return DailyCheckInRepository.of({
			upsert: (input: UpsertDailyCheckIn) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(dailyCheckIns)
						.values({
							userId: input.userId,
							localDate: input.localDate,
							mood: input.mood,
							note: input.note ?? null,
							visibility: input.visibility,
						})
						.onConflictDoUpdate({
							target: [dailyCheckIns.userId, dailyCheckIns.localDate],
							set: {
								mood: input.mood,
								note: input.note ?? null,
								visibility: input.visibility,
							},
						})
						.returning()
						.pipe(Effect.mapError((error) => toDatabaseError("upsert daily check-in", error)));

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to upsert daily check-in" }));
					}

					return mapRow(row);
				}),

			getByDate: (userId: string, localDate: string) =>
				db
					.select()
					.from(dailyCheckIns)
					.where(and(eq(dailyCheckIns.userId, userId), eq(dailyCheckIns.localDate, localDate)))
					.limit(1)
					.pipe(
						Effect.map((rows) => (rows[0] ? mapRow(rows[0]) : null)),
						Effect.mapError((error) => toDatabaseError("get daily check-in by date", error)),
					),

			listForWeek: (userId: string, weekStartLocal: string, weekEndLocal: string) =>
				db
					.select()
					.from(dailyCheckIns)
					.where(
						and(
							eq(dailyCheckIns.userId, userId),
							gte(dailyCheckIns.localDate, weekStartLocal),
							lte(dailyCheckIns.localDate, weekEndLocal),
						),
					)
					.orderBy(asc(dailyCheckIns.localDate))
					.pipe(
						Effect.map((rows) => rows.map(mapRow)),
						Effect.mapError((error) => toDatabaseError("list daily check-ins for week", error)),
					),

			listForMonth: (userId: string, monthStartLocal: string, monthEndLocal: string) =>
				db
					.select()
					.from(dailyCheckIns)
					.where(
						and(
							eq(dailyCheckIns.userId, userId),
							gte(dailyCheckIns.localDate, monthStartLocal),
							lte(dailyCheckIns.localDate, monthEndLocal),
						),
					)
					.orderBy(asc(dailyCheckIns.localDate))
					.pipe(
						Effect.map((rows) => rows.map(mapRow)),
						Effect.mapError((error) => toDatabaseError("list daily check-ins for month", error)),
					),

			listUserIdsWithAtLeastNCheckInsInRange: (minCount, weekStartLocal, weekEndLocal) =>
				db
					.select({ userId: dailyCheckIns.userId })
					.from(dailyCheckIns)
					.where(
						and(gte(dailyCheckIns.localDate, weekStartLocal), lte(dailyCheckIns.localDate, weekEndLocal)),
					)
					.groupBy(dailyCheckIns.userId)
					.having(gte(count(), minCount))
					.pipe(
						Effect.map((rows) => rows.map((row) => row.userId)),
						Effect.mapError((error) => toDatabaseError("list user ids with check-ins in range", error)),
					),
		});
	}),
);
