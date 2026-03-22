/**
 * Assessment Exchange Repository Implementation (Drizzle)
 *
 * Manages per-turn pipeline state persistence for assessment conversations.
 *
 * Story 23-3: Exchange Table & Schema Migration
 */

import { DatabaseError } from "@workspace/contracts/errors";
import { AssessmentExchangeRepository } from "@workspace/domain/repositories/assessment-exchange.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { asc, eq } from "drizzle-orm";
import { Effect, Layer } from "effect";
import { Database } from "../context/database";
import { assessmentExchange, assessmentSession } from "../db/drizzle/schema";

export const AssessmentExchangeDrizzleRepositoryLive = Layer.effect(
	AssessmentExchangeRepository,
	Effect.gen(function* () {
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		return AssessmentExchangeRepository.of({
			create: (sessionId, turnNumber) =>
				Effect.gen(function* () {
					const [exchange] = yield* db
						.insert(assessmentExchange)
						.values({
							sessionId,
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

					if (!exchange) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to create exchange" }));
					}

					return exchange;
				}),

			update: (exchangeId, data) =>
				Effect.gen(function* () {
					const [exchange] = yield* db
						.update(assessmentExchange)
						.set(data)
						.where(eq(assessmentExchange.id, exchangeId))
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

					if (!exchange) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to update exchange" }));
					}

					return exchange;
				}),

			findBySession: (sessionId) =>
				db
					.select()
					.from(assessmentExchange)
					.where(eq(assessmentExchange.sessionId, sessionId))
					.orderBy(asc(assessmentExchange.turnNumber))
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
						id: assessmentExchange.id,
						sessionId: assessmentExchange.sessionId,
						turnNumber: assessmentExchange.turnNumber,
						energy: assessmentExchange.energy,
						energyBand: assessmentExchange.energyBand,
						telling: assessmentExchange.telling,
						tellingBand: assessmentExchange.tellingBand,
						withinMessageShift: assessmentExchange.withinMessageShift,
						stateNotes: assessmentExchange.stateNotes,
						extractionTier: assessmentExchange.extractionTier,
						smoothedEnergy: assessmentExchange.smoothedEnergy,
						comfort: assessmentExchange.comfort,
						drain: assessmentExchange.drain,
						drainCeiling: assessmentExchange.drainCeiling,
						eTarget: assessmentExchange.eTarget,
						scorerOutput: assessmentExchange.scorerOutput,
						selectedTerritory: assessmentExchange.selectedTerritory,
						selectionRule: assessmentExchange.selectionRule,
						governorOutput: assessmentExchange.governorOutput,
						governorDebug: assessmentExchange.governorDebug,
						sessionPhase: assessmentExchange.sessionPhase,
						transitionType: assessmentExchange.transitionType,
						createdAt: assessmentExchange.createdAt,
					})
					.from(assessmentExchange)
					.innerJoin(assessmentSession, eq(assessmentExchange.sessionId, assessmentSession.id))
					.where(eq(assessmentSession.userId, userId))
					.orderBy(asc(assessmentExchange.createdAt))
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
