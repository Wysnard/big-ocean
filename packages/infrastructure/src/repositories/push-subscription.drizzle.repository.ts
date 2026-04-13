import { DatabaseError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import {
	type PushSubscriptionRecord,
	PushSubscriptionRepository,
} from "@workspace/domain/repositories/push-subscription.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { and, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { pushSubscriptions } from "../db/drizzle/schema";

const mapRow = (row: typeof pushSubscriptions.$inferSelect): PushSubscriptionRecord => ({
	id: row.id,
	userId: row.userId,
	endpoint: row.endpoint,
	keys: {
		p256dh: row.p256dh,
		auth: row.auth,
	},
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
});

export const PushSubscriptionDrizzleRepositoryLive = Layer.effect(
	PushSubscriptionRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return PushSubscriptionRepository.of({
			upsert: (input) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(pushSubscriptions)
						.values({
							userId: input.userId,
							endpoint: input.endpoint,
							p256dh: input.keys.p256dh,
							auth: input.keys.auth,
						})
						.onConflictDoUpdate({
							target: pushSubscriptions.endpoint,
							set: {
								p256dh: input.keys.p256dh,
								auth: input.keys.auth,
								updatedAt: new Date(),
							},
							setWhere: eq(pushSubscriptions.userId, input.userId),
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "pushSubscriptions.upsert",
									userId: input.userId,
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({
									message: "Failed to save push subscription",
								});
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to save push subscription" }));
					}

					return mapRow(row);
				}),

			listByUserId: (userId) =>
				db
					.select()
					.from(pushSubscriptions)
					.where(eq(pushSubscriptions.userId, userId))
					.pipe(
						Effect.map((rows) => rows.map(mapRow)),
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "pushSubscriptions.listByUserId",
								userId,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({
								message: "Failed to load push subscriptions",
							});
						}),
					),

			deleteByEndpoint: (endpoint, userId) =>
				db
					.delete(pushSubscriptions)
					.where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)))
					.pipe(
						Effect.asVoid,
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "pushSubscriptions.deleteByEndpoint",
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({
								message: "Failed to delete push subscription",
							});
						}),
					),

			deleteByUserId: (userId) =>
				db
					.delete(pushSubscriptions)
					.where(eq(pushSubscriptions.userId, userId))
					.pipe(
						Effect.asVoid,
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "pushSubscriptions.deleteByUserId",
								userId,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({
								message: "Failed to clear push subscriptions",
							});
						}),
					),
		});
	}),
);
