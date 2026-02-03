/**
 * Session Repository Implementation
 *
 * Manages assessment conversation sessions and message persistence.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 * - Uses AssessmentSessionRepository.of({...}) for proper service implementation
 */

import { DatabaseError, SessionNotFound } from "@workspace/contracts/errors";
import { AssessmentSessionEntitySchema } from "@workspace/domain/entities/session.entity";
import { AssessmentSessionRepository } from "@workspace/domain/repositories/assessment-session.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { eq } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";
import { assessmentSession } from "../db/schema";

/**
 * Session Repository Layer - Receives database and logger through DI
 *
 * Layer type: Layer<AssessmentSessionRepository, never, Database | LoggerRepository>
 * Dependencies resolved during layer construction, not at service level.
 *
 * "Layers act as constructors for creating services" - dependencies managed at construction time.
 */
export const AssessmentSessionDrizzleRepositoryLive = Layer.effect(
	AssessmentSessionRepository,
	Effect.gen(function* () {
		// Receive dependencies through DI during layer construction
		const db = yield* Database;
		const logger = yield* LoggerRepository;

		// Return service implementation using .of() pattern
		return AssessmentSessionRepository.of({
			createSession: (userId?: string) =>
				Effect.gen(function* () {
					// Insert session with baseline precision scores
					const [session] = yield* db
						.insert(assessmentSession)
						.values({
							userId: userId ?? null,
							createdAt: new Date(),
							updatedAt: new Date(),
							status: "active",
							precision: {
								openness: 0.5,
								conscientiousness: 0.5,
								extraversion: 0.5,
								agreeableness: 0.5,
								neuroticism: 0.5,
							},
							messageCount: 0,
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								// Log technical details before throwing (safe - wrapped in try-catch)
								try {
									logger.error("Database operation failed", {
										operation: "createSession",
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									// Silently ignore logger failures - don't let logging prevent error handling
									console.error("Logger failed in error handler:", logError);
								}

								// Return user-friendly error
								return new DatabaseError({
									message: "Failed to create session",
								});
							}),
						);

					if (!session) {
						logger.error("Database operation failed", {
							operation: "createSession",
							error: "Insert returned no result",
						});

						return yield* Effect.fail(
							new DatabaseError({
								message: "Failed to create session",
							}),
						);
					}

					return { sessionId: session.id };
				}),

			getSession: (sessionId) =>
				Effect.gen(function* () {
					// Validate UUID format before querying to return 404 for invalid IDs
					const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					if (!uuidRegex.test(sessionId)) {
						logger.warn("Invalid session ID format", { sessionId });
						return yield* Effect.fail(
							new SessionNotFound({
								sessionId,
								message: `Session '${sessionId}' not found`,
							}),
						);
					}

					// Load session
					const sessionResults = yield* db
						.select()
						.from(assessmentSession)
						.where(eq(assessmentSession.id, sessionId))
						.limit(1)
						.pipe(
							Effect.mapError((error) => {
								// Log technical details before throwing (safe - wrapped in try-catch)
								try {
									logger.error("Database operation failed", {
										operation: "getSession",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									// Silently ignore logger failures - don't let logging prevent error handling
									console.error("Logger failed in error handler:", logError);
								}

								return new DatabaseError({
									message: "Failed to fetch session",
								});
							}),
						);

					// Session not found error
					if (sessionResults.length === 0) {
						logger.warn("Session not found", { sessionId });
						return yield* Effect.fail(
							new SessionNotFound({
								sessionId,
								message: `Session '${sessionId}' not found`,
							}),
						);
					}

					const session = sessionResults[0];
					if (!session) {
						logger.error("Database operation failed", {
							operation: "getSession",
							sessionId,
							error: "Session query returned undefined",
						});

						return yield* Effect.fail(
							new DatabaseError({
								message: "Failed to fetch session",
							}),
						);
					}

					// Parse with SessionEntitySchema
					return yield* Schema.decodeUnknown(AssessmentSessionEntitySchema)(session).pipe(
						Effect.mapError((error) => {
							// Log technical details before throwing (safe - wrapped in try-catch)
							try {
								logger.error("Database operation failed", {
									operation: "getSession",
									sessionId,
									error: `Schema parse error: ${error}`,
								});
							} catch (logError) {
								// Silently ignore logger failures - don't let logging prevent error handling
								console.error("Logger failed in error handler:", logError);
							}

							return new DatabaseError({
								message: "Failed to fetch session",
							});
						}),
					);
				}),

			updateSession: (sessionId, partialSession) =>
				Effect.gen(function* () {
					// Update session
					const [updatedSession] = yield* db
						.update(assessmentSession)
						.set({
							...partialSession,
							updatedAt: new Date(),
						})
						.where(eq(assessmentSession.id, sessionId))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								// Log technical details before throwing (safe - wrapped in try-catch)
								try {
									logger.error("Database operation failed", {
										operation: "updateSession",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									// Silently ignore logger failures - don't let logging prevent error handling
									console.error("Logger failed in error handler:", logError);
								}

								return new DatabaseError({
									message: "Failed to update session",
								});
							}),
						);

					if (!updatedSession) {
						try {
							logger.error("Database operation failed", {
								operation: "updateSession",
								sessionId,
								error: "Update returned no result",
							});
						} catch (logError) {
							// Silently ignore logger failures - don't let logging prevent error handling
							console.error("Logger failed:", logError);
						}

						return yield* Effect.fail(
							new DatabaseError({
								message: "Failed to update session",
							}),
						);
					}

					// Prepare session data for parsing
					const sessionData = {
						id: updatedSession.id,
						userId: updatedSession.userId,
						createdAt: updatedSession.createdAt,
						updatedAt: updatedSession.updatedAt,
						status: updatedSession.status,
						precision: updatedSession.precision,
						messageCount: updatedSession.messageCount,
					};

					// Parse with SessionEntitySchema
					return yield* Schema.decodeUnknown(AssessmentSessionEntitySchema)(sessionData).pipe(
						Effect.mapError((error) => {
							// Log technical details before throwing (safe - wrapped in try-catch)
							try {
								logger.error("Database operation failed", {
									operation: "updateSession",
									sessionId,
									error: `Schema parse error: ${error}`,
								});
							} catch (logError) {
								// Silently ignore logger failures - don't let logging prevent error handling
								console.error("Logger failed in error handler:", logError);
							}

							return new DatabaseError({
								message: "Failed to update session",
							});
						}),
					);
				}),
		});
	}),
);
