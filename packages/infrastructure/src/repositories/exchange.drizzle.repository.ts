/**
 * Assessment Exchange Repository Implementation (Drizzle)
 *
 * Manages per-turn pipeline state persistence for assessment conversations.
 *
 * Story 23-3: Exchange Table & Schema Migration
 */

import { DatabaseError } from "@workspace/contracts/errors";
import { ExchangeRepository } from "@workspace/domain/repositories/exchange.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { asc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { conversation, exchange as exchangeTable } from "../db/drizzle/schema";

const mapExchangeRecord = (row: typeof exchangeTable.$inferSelect) => ({
	id: row.id,
	sessionId: row.conversationId,
	turnNumber: row.turnNumber,
	extractionTier: row.extractionTier,
	directorOutput: row.directorOutput,
	coverageTargets: row.coverageTargets,
	createdAt: row.createdAt,
});

export const ExchangeDrizzleRepositoryLive = Layer.effect(
	ExchangeRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return ExchangeRepository.of({
			create: (sessionId, turnNumber) =>
				Effect.gen(function* () {
					const [createdExchange] = yield* db
						.insert(exchangeTable)
						.values({
							conversationId: sessionId,
							turnNumber,
							createdAt: new Date(),
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "createExchange",
										sessionId,
										turnNumber,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}
								return new DatabaseError({ message: "Failed to create exchange" });
							}),
						);

					if (!createdExchange) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to create exchange" }));
					}

					return mapExchangeRecord(createdExchange);
				}),

			update: (exchangeId, data) =>
				Effect.gen(function* () {
					const [updatedExchange] = yield* db
						.update(exchangeTable)
						.set(data)
						.where(eq(exchangeTable.id, exchangeId))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "updateExchange",
										exchangeId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}
								return new DatabaseError({ message: "Failed to update exchange" });
							}),
						);

					if (!updatedExchange) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to update exchange" }));
					}

					return mapExchangeRecord(updatedExchange);
				}),

			findBySession: (sessionId) =>
				db
					.select()
					.from(exchangeTable)
					.where(eq(exchangeTable.conversationId, sessionId))
					.orderBy(asc(exchangeTable.turnNumber))
					.pipe(Effect.map((rows) => rows.map(mapExchangeRecord)))
					.pipe(
						Effect.mapError((error) => {
							try {
								logger.error("Database operation failed", {
									operation: "findExchangesBySession",
									sessionId,
									error: error instanceof Error ? error.message : String(error),
								});
							} catch (logError) {
								console.error("Logger failed in error handler:", logError);
							}
							return new DatabaseError({ message: "Failed to find exchanges" });
						}),
					),
			findByUserId: (userId) =>
				db
					.select({
						id: exchangeTable.id,
						sessionId: exchangeTable.conversationId,
						turnNumber: exchangeTable.turnNumber,
						extractionTier: exchangeTable.extractionTier,
						directorOutput: exchangeTable.directorOutput,
						coverageTargets: exchangeTable.coverageTargets,
						createdAt: exchangeTable.createdAt,
					})
					.from(exchangeTable)
					.innerJoin(conversation, eq(exchangeTable.conversationId, conversation.id))
					.where(eq(conversation.userId, userId))
					.orderBy(asc(exchangeTable.createdAt))
					.pipe(
						Effect.mapError((error) => {
							try {
								logger.error("Database operation failed", {
									operation: "findExchangesByUserId",
									userId,
									error: error instanceof Error ? error.message : String(error),
								});
							} catch (logError) {
								console.error("Logger failed in error handler:", logError);
							}
							return new DatabaseError({ message: "Failed to find exchanges by user" });
						}),
					),
		});
	}),
);
