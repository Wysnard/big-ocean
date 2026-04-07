/**
 * Message Repository Implementation (Drizzle)
 *
 * Manages message persistence for assessment conversations.
 *
 * Story 23-3: Simplified to remove userId, territoryId, observedEnergyLevel.
 * Added optional exchangeId FK to assessment_exchange.
 */

import { DatabaseError } from "@workspace/contracts/errors";
import { MessageEntitySchema } from "@workspace/domain/entities/message.entity";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { MessageRepository } from "@workspace/domain/repositories/message.repository";
import { asc, eq, sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";
import { Database } from "../context/database";
import { conversation, message as messageTable } from "../db/drizzle/schema";

export const MessageDrizzleRepositoryLive = Layer.effect(
	MessageRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return MessageRepository.of({
			saveMessage: (sessionId, role, content, exchangeId) =>
				Effect.gen(function* () {
					const [savedMessage] = yield* db
						.insert(messageTable)
						.values({
							sessionId,
							role,
							content,
							exchangeId: exchangeId ?? null,
							createdAt: new Date(),
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "saveMessage",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new DatabaseError({
									message: "Failed to save message",
								});
							}),
						);

					if (!savedMessage) {
						try {
							logger.error("Database operation failed", {
								operation: "saveMessage",
								sessionId,
								error: "Insert returned no result",
							});
						} catch (logError) {
							console.error("Logger failed:", logError);
						}

						return yield* Effect.fail(
							new DatabaseError({
								message: "Failed to save message",
							}),
						);
					}

					return yield* Schema.decodeUnknown(MessageEntitySchema)(savedMessage).pipe(
						Effect.mapError((error) => {
							try {
								logger.error("Database operation failed", {
									operation: "saveMessage",
									sessionId,
									error: `Schema parse error: ${error}`,
								});
							} catch (logError) {
								console.error("Logger failed in error handler:", logError);
							}

							return new DatabaseError({
								message: "Failed to save message",
							});
						}),
					);
				}),

			getMessages: (sessionId) =>
				Effect.gen(function* () {
					const messages = yield* db
						.select()
						.from(messageTable)
						.where(eq(messageTable.sessionId, sessionId))
						.orderBy(asc(messageTable.createdAt))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "getMessages",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new DatabaseError({
									message: "Failed to fetch messages",
								});
							}),
						);

					return yield* Schema.decodeUnknown(Schema.mutable(Schema.Array(MessageEntitySchema)))(
						messages,
					).pipe(
						Effect.mapError((error) => {
							try {
								logger.error("Database operation failed", {
									operation: "getMessages",
									sessionId,
									error: `Schema parse error: ${error}`,
								});
							} catch (logError) {
								console.error("Logger failed in error handler:", logError);
							}

							return new DatabaseError({
								message: "Failed to fetch messages",
							});
						}),
					);
				}),

			updateExchangeId: (messageId, exchangeId) =>
				db
					.update(messageTable)
					.set({ exchangeId })
					.where(eq(messageTable.id, messageId))
					.pipe(
						Effect.map(() => undefined as undefined),
						Effect.mapError((error) => {
							try {
								logger.error("Database operation failed", {
									operation: "updateExchangeId",
									messageId,
									error: error instanceof Error ? error.message : String(error),
								});
							} catch (logError) {
								console.error("Logger failed in error handler:", logError);
							}
							return new DatabaseError({ message: "Failed to update message exchange ID" });
						}),
					),

			getMessagesByUserId: (userId) =>
				Effect.gen(function* () {
					const messages = yield* db
						.select({
							id: messageTable.id,
							sessionId: messageTable.sessionId,
							exchangeId: messageTable.exchangeId,
							role: messageTable.role,
							content: messageTable.content,
							createdAt: messageTable.createdAt,
						})
						.from(messageTable)
						.innerJoin(conversation, eq(messageTable.sessionId, conversation.id))
						.where(eq(conversation.userId, userId))
						.orderBy(asc(messageTable.createdAt))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "getMessagesByUserId",
										userId,
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new DatabaseError({
									message: "Failed to fetch messages by user",
								});
							}),
						);

					return yield* Schema.decodeUnknown(Schema.mutable(Schema.Array(MessageEntitySchema)))(
						messages,
					).pipe(
						Effect.mapError((error) => {
							try {
								logger.error("Database operation failed", {
									operation: "getMessagesByUserId",
									userId,
									error: `Schema parse error: ${error}`,
								});
							} catch (logError) {
								console.error("Logger failed in error handler:", logError);
							}

							return new DatabaseError({
								message: "Failed to fetch messages by user",
							});
						}),
					);
				}),

			getMessageCount: (sessionId) =>
				Effect.gen(function* () {
					const result = yield* db
						.select({ count: sql<number>`cast(count(*) as int)` })
						.from(messageTable)
						.where(eq(messageTable.sessionId, sessionId))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "getMessageCount",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new DatabaseError({
									message: "Failed to count messages",
								});
							}),
						);

					return result[0]?.count ?? 0;
				}),
		});
	}),
);
