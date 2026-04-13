import { DatabaseError } from "@workspace/domain/errors/http.errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import {
	PushNotificationQueueRepository,
	type QueuedPushNotification,
} from "@workspace/domain/repositories/push-notification-queue.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { and, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { pushNotificationQueue } from "../db/drizzle/schema";

const mapRow = (row: typeof pushNotificationQueue.$inferSelect): QueuedPushNotification => ({
	id: row.id,
	userId: row.userId,
	title: row.title,
	body: row.body,
	url: row.url,
	tag: row.tag,
	dedupeKey: row.dedupeKey,
	createdAt: row.createdAt,
	expiresAt: row.expiresAt,
});

export const PushNotificationQueueDrizzleRepositoryLive = Layer.effect(
	PushNotificationQueueRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return PushNotificationQueueRepository.of({
			enqueue: (input) =>
				Effect.gen(function* () {
					const rows = yield* db
						.insert(pushNotificationQueue)
						.values({
							userId: input.userId,
							title: input.title,
							body: input.body,
							url: input.url,
							tag: input.tag,
							dedupeKey: input.dedupeKey,
						})
						.onConflictDoUpdate({
							target: [pushNotificationQueue.userId, pushNotificationQueue.dedupeKey],
							set: {
								title: input.title,
								body: input.body,
								url: input.url,
								tag: input.tag,
							},
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "pushNotificationQueue.enqueue",
									userId: input.userId,
									dedupeKey: input.dedupeKey,
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({
									message: "Failed to queue push notification",
								});
							}),
						);

					const row = rows[0];
					if (!row) {
						return yield* Effect.fail(
							new DatabaseError({ message: "Failed to queue push notification" }),
						);
					}

					return mapRow(row);
				}),

			consumeByUserId: (userId) =>
				Effect.gen(function* () {
					const rows = yield* db
						.delete(pushNotificationQueue)
						.where(eq(pushNotificationQueue.userId, userId))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								logger.error("Database operation failed", {
									operation: "pushNotificationQueue.consumeByUserId",
									userId,
									error: error instanceof Error ? error.message : String(error),
								});
								return new DatabaseError({
									message: "Failed to consume queued push notifications",
								});
							}),
						);

					return rows.map(mapRow);
				}),

			deleteByDedupeKey: (userId, dedupeKey) =>
				db
					.delete(pushNotificationQueue)
					.where(
						and(eq(pushNotificationQueue.userId, userId), eq(pushNotificationQueue.dedupeKey, dedupeKey)),
					)
					.pipe(
						Effect.asVoid,
						Effect.mapError((error) => {
							logger.error("Database operation failed", {
								operation: "pushNotificationQueue.deleteByDedupeKey",
								userId,
								dedupeKey,
								error: error instanceof Error ? error.message : String(error),
							});
							return new DatabaseError({
								message: "Failed to remove queued push notification",
							});
						}),
					),
		});
	}),
);
