/**
 * Message Repository Implementation (Drizzle)
 *
 * Manages message persistence for assessment conversations.
 *
 * Story 23-3: Simplified to remove userId, territoryId, observedEnergyLevel.
 * Added optional exchangeId FK to assessment_exchange.
 */

import { DatabaseError } from "@workspace/contracts/errors";
import { AssessmentMessageEntitySchema } from "@workspace/domain/entities/message.entity";
import { AssessmentMessageRepository } from "@workspace/domain/repositories/assessment-message.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { asc, eq, sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";
import { Database } from "../context/database";
import { assessmentMessage, assessmentSession } from "../db/drizzle/schema";

export const AssessmentMessageDrizzleRepositoryLive = Layer.effect(
	AssessmentMessageRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return AssessmentMessageRepository.of({
			saveMessage: (sessionId, role, content, exchangeId) =>
				Effect.gen(function* () {
					const [message] = yield* db
						.insert(assessmentMessage)
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

					if (!message) {
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

					return yield* Schema.decodeUnknown(AssessmentMessageEntitySchema)(message).pipe(
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
						.from(assessmentMessage)
						.where(eq(assessmentMessage.sessionId, sessionId))
						.orderBy(asc(assessmentMessage.createdAt))
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

					return yield* Schema.decodeUnknown(
						Schema.mutable(Schema.Array(AssessmentMessageEntitySchema)),
					)(messages).pipe(
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
					.update(assessmentMessage)
					.set({ exchangeId })
					.where(eq(assessmentMessage.id, messageId))
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
							id: assessmentMessage.id,
							sessionId: assessmentMessage.sessionId,
							exchangeId: assessmentMessage.exchangeId,
							role: assessmentMessage.role,
							content: assessmentMessage.content,
							createdAt: assessmentMessage.createdAt,
						})
						.from(assessmentMessage)
						.innerJoin(assessmentSession, eq(assessmentMessage.sessionId, assessmentSession.id))
						.where(eq(assessmentSession.userId, userId))
						.orderBy(asc(assessmentMessage.createdAt))
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

					return yield* Schema.decodeUnknown(
						Schema.mutable(Schema.Array(AssessmentMessageEntitySchema)),
					)(messages).pipe(
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
						.from(assessmentMessage)
						.where(eq(assessmentMessage.sessionId, sessionId))
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
