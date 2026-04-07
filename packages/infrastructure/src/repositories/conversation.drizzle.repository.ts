/**
 * Session Repository Implementation
 *
 * Manages assessment conversation sessions and message persistence.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 * - Uses ConversationRepository.of({...}) for proper service implementation
 */

import { randomBytes } from "node:crypto";
import {
	ConcurrentMessageError,
	DatabaseError,
	SessionNotFound,
} from "@workspace/contracts/errors";
import { ConversationEntitySchema } from "@workspace/domain/entities/conversation.entity";
import { ConversationRepository } from "@workspace/domain/repositories/conversation.repository";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import { RedisRepository } from "@workspace/domain/repositories/redis.repository";
import { Database } from "@workspace/infrastructure/context/database";
import { and, count, eq, isNull, lt, sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";
import { conversation, message, publicProfile, purchaseEvents, user } from "../db/drizzle/schema";

/**
 * Session Repository Layer - Receives database, logger, and Redis through DI
 *
 * Layer type: Layer<ConversationRepository, never, Database | LoggerRepository | RedisRepository>
 * Dependencies resolved during layer construction, not at service level.
 *
 * "Layers act as constructors for creating services" - dependencies managed at construction time.
 */
export const ConversationDrizzleRepositoryLive = Layer.effect(
	ConversationRepository,
	Effect.gen(function* () {
		// Receive dependencies through DI during layer construction
		const db = yield* Database;
		const logger = yield* LoggerRepository;
		const redis = yield* RedisRepository;

		// Return service implementation using .of() pattern
		return ConversationRepository.of({
			getActiveSessionByUserId: (userId: string) =>
				Effect.gen(function* () {
					const results = yield* db
						.select()
						.from(conversation)
						.where(and(eq(conversation.userId, userId), eq(conversation.status, "active")))
						.limit(1)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "getActiveSessionByUserId",
										userId,
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new DatabaseError({
									message: "Failed to find active session",
								});
							}),
						);

					if (results.length === 0 || !results[0]) {
						return null;
					}

					return yield* Schema.decodeUnknown(ConversationEntitySchema)(results[0]).pipe(
						Effect.mapError((error) => {
							try {
								logger.error("Database operation failed", {
									operation: "getActiveSessionByUserId",
									userId,
									error: `Schema parse error: ${error}`,
								});
							} catch (logError) {
								console.error("Logger failed in error handler:", logError);
							}

							return new DatabaseError({
								message: "Failed to find active session",
							});
						}),
					);
				}),

			createSession: (userId?: string) =>
				Effect.gen(function* () {
					const [session] = yield* db
						.insert(conversation)
						.values({
							// Omit userId entirely when absent — the Drizzle Effect adapter serializes explicit null
							// as an empty string in query params, violating the FK constraint on user.id.
							...(userId ? { userId } : {}),
							createdAt: new Date(),
							updatedAt: new Date(),
							status: "active",
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
						.from(conversation)
						.where(eq(conversation.id, sessionId))
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
					return yield* Schema.decodeUnknown(ConversationEntitySchema)(session).pipe(
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
						.update(conversation)
						.set({
							...partialSession,
							updatedAt: new Date(),
						})
						.where(eq(conversation.id, sessionId))
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
						sessionToken: updatedSession.sessionToken,
						createdAt: updatedSession.createdAt,
						updatedAt: updatedSession.updatedAt,
						status: updatedSession.status,
						finalizationProgress: updatedSession.finalizationProgress,
						messageCount: updatedSession.messageCount,
					};

					// Parse with SessionEntitySchema
					return yield* Schema.decodeUnknown(ConversationEntitySchema)(sessionData).pipe(
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
			findSessionByUserId: (userId: string) =>
				Effect.gen(function* () {
					const messageCountSubquery = db
						.select({
							sessionId: message.sessionId,
							messageCount: count().as("message_count"),
						})
						.from(message)
						.where(eq(message.role, "user"))
						.groupBy(message.sessionId)
						.as("msg_counts");

					const results = yield* db
						.select({
							id: conversation.id,
							createdAt: conversation.createdAt,
							updatedAt: conversation.updatedAt,
							status: conversation.status,
							messageCount: sql<number>`COALESCE("msg_counts"."message_count", 0)`.mapWith(Number),
							oceanCode5: publicProfile.oceanCode5,
							archetypeName: sql<string | null>`NULL`.as("archetype_name"),
						})
						.from(conversation)
						.leftJoin(messageCountSubquery, eq(conversation.id, messageCountSubquery.sessionId))
						.leftJoin(publicProfile, eq(conversation.id, publicProfile.sessionId))
						.where(eq(conversation.userId, userId))
						.orderBy(sql`${conversation.createdAt} DESC`)
						.limit(1)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "findSessionByUserId",
										userId,
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new DatabaseError({
									message: "Failed to find user session",
								});
							}),
						);

					const row = results[0];
					if (!row) return null;

					return {
						id: row.id,
						createdAt: row.createdAt,
						updatedAt: row.updatedAt,
						status: row.status,
						messageCount: Number(row.messageCount),
						oceanCode5: row.oceanCode5 ?? null,
						archetypeName: row.archetypeName ?? null,
					};
				}),

			getSessionsByUserId: (userId: string) =>
				Effect.gen(function* () {
					// Compute messageCount from assessment_message (stored messageCount is always 0)
					// Only count user messages to match send-message.use-case convention
					const messageCountSubquery = db
						.select({
							sessionId: message.sessionId,
							messageCount: count().as("message_count"),
						})
						.from(message)
						.where(eq(message.role, "user"))
						.groupBy(message.sessionId)
						.as("msg_counts");

					const results = yield* db
						.select({
							id: conversation.id,
							createdAt: conversation.createdAt,
							updatedAt: conversation.updatedAt,
							status: conversation.status,
							messageCount: sql<number>`COALESCE("msg_counts"."message_count", 0)`.mapWith(Number),
							oceanCode5: publicProfile.oceanCode5,
							archetypeName: sql<string | null>`NULL`.as("archetype_name"),
						})
						.from(conversation)
						.leftJoin(messageCountSubquery, eq(conversation.id, messageCountSubquery.sessionId))
						.leftJoin(publicProfile, eq(conversation.id, publicProfile.sessionId))
						.where(eq(conversation.userId, userId))
						.orderBy(sql`${conversation.createdAt} DESC`)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "getSessionsByUserId",
										userId,
										error: error instanceof Error ? error.message : String(error),
										stack: error instanceof Error ? error.stack : undefined,
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}

								return new DatabaseError({
									message: "Failed to list user sessions",
								});
							}),
						);

					return results.map((row) => ({
						id: row.id,
						createdAt: row.createdAt,
						updatedAt: row.updatedAt,
						status: row.status,
						messageCount: Number(row.messageCount),
						oceanCode5: row.oceanCode5 ?? null,
						archetypeName: row.archetypeName ?? null,
					}));
				}),

			createAnonymousSession: () =>
				Effect.gen(function* () {
					const sessionToken = randomBytes(32).toString("hex");

					const [session] = yield* db
						.insert(conversation)
						.values({
							sessionToken,
							status: "active",
							messageCount: 0,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "createAnonymousSession",
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}
								return new DatabaseError({ message: "Failed to create anonymous session" });
							}),
						);

					if (!session) {
						return yield* Effect.fail(
							new DatabaseError({ message: "Failed to create anonymous session" }),
						);
					}

					logger.info("Anonymous session created", { sessionId: session.id });
					return { sessionId: session.id, sessionToken };
				}),

			findByToken: (token: string) =>
				Effect.gen(function* () {
					const results = yield* db
						.select()
						.from(conversation)
						.where(and(eq(conversation.sessionToken, token), eq(conversation.status, "active")))
						.limit(1)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "findByToken",
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed in error handler:", logError);
								}
								return new DatabaseError({ message: "Failed to find session by token" });
							}),
						);

					if (results.length === 0 || !results[0]) {
						return null;
					}

					return yield* Schema.decodeUnknown(ConversationEntitySchema)(results[0]).pipe(
						Effect.mapError((error) => {
							try {
								logger.error("Schema parse error in findByToken", { error: String(error) });
							} catch (logError) {
								console.error("Logger failed:", logError);
							}
							return new DatabaseError({ message: "Failed to parse session from token" });
						}),
					);
				}),

			assignUserId: (sessionId: string, userId: string) =>
				Effect.gen(function* () {
					const [updated] = yield* db
						.update(conversation)
						.set({ userId, sessionToken: null, updatedAt: new Date() })
						.where(eq(conversation.id, sessionId))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "assignUserId",
										sessionId,
										userId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to assign user to session" });
							}),
						);

					if (!updated) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to assign user to session" }));
					}

					return yield* Schema.decodeUnknown(ConversationEntitySchema)(updated).pipe(
						Effect.mapError(() => new DatabaseError({ message: "Failed to parse updated session" })),
					);
				}),

			rotateToken: (sessionId: string) =>
				Effect.gen(function* () {
					const sessionToken = randomBytes(32).toString("hex");

					const [updated] = yield* db
						.update(conversation)
						.set({ sessionToken, updatedAt: new Date() })
						.where(eq(conversation.id, sessionId))
						.returning()
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "rotateToken",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to rotate session token" });
							}),
						);

					if (!updated) {
						return yield* Effect.fail(new DatabaseError({ message: "Failed to rotate session token" }));
					}

					logger.info("Session token rotated", { sessionId });
					return { sessionToken };
				}),

			incrementMessageCount: (sessionId: string) =>
				Effect.gen(function* () {
					const results = yield* db
						.update(conversation)
						.set({
							messageCount: sql`${conversation.messageCount} + 1`,
							updatedAt: new Date(),
						})
						.where(eq(conversation.id, sessionId))
						.returning({ messageCount: conversation.messageCount })
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "incrementMessageCount",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to increment message count" });
							}),
						);

					const result = results[0];
					if (!result) {
						return yield* Effect.fail(
							new DatabaseError({ message: "Failed to increment message count" }),
						);
					}

					return result.messageCount;
				}),

			acquireSessionLock: (sessionId: string) =>
				Effect.gen(function* () {
					const key = `session_lock:${sessionId}`;
					const count = yield* redis.incr(key).pipe(
						Effect.mapError((error) => {
							logger.error("Redis operation failed", {
								operation: "acquireSessionLock",
								sessionId,
								error: error.message,
							});
							return new DatabaseError({
								message: "Failed to acquire session lock",
							});
						}),
					);

					// First increment → lock acquired. Set safety TTL to auto-release on crash.
					if (count === 1) {
						yield* redis.expire(key, 120).pipe(Effect.catchAll(() => Effect.void));
					}

					if (count > 1) {
						// Another request is processing — decrement back and fail
						yield* redis.decr(key).pipe(Effect.catchAll(() => Effect.void));
						logger.warn("Session lock contention", {
							sessionId,
							event: "session_lock_contention",
						});
						return yield* Effect.fail(
							new ConcurrentMessageError({
								sessionId,
								message: "Another message is being processed",
							}),
						);
					}
				}),

			releaseSessionLock: (sessionId: string) =>
				Effect.gen(function* () {
					const key = `session_lock:${sessionId}`;
					yield* redis.decr(key).pipe(
						Effect.mapError((error) => {
							logger.error("Redis operation failed", {
								operation: "releaseSessionLock",
								sessionId,
								error: error.message,
							});
							return new DatabaseError({ message: "Failed to release session lock" });
						}),
					);
				}),

			findDropOffSessions: (thresholdHours: number) =>
				Effect.gen(function* () {
					const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

					const results = yield* db
						.select({
							sessionId: conversation.id,
							userId: conversation.userId,
							userEmail: user.email,
							userName: user.name,
							updatedAt: conversation.updatedAt,
						})
						.from(conversation)
						.innerJoin(user, eq(conversation.userId, user.id))
						.where(
							and(
								eq(conversation.status, "active"),
								lt(conversation.updatedAt, cutoff),
								isNull(conversation.dropOffEmailSentAt),
							),
						)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "findDropOffSessions",
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to find drop-off sessions" });
							}),
						);

					return results.map((row) => ({
						sessionId: row.sessionId,
						userId: row.userId as string,
						userEmail: row.userEmail,
						userName: row.userName,
						updatedAt: row.updatedAt,
					}));
				}),

			markDropOffEmailSent: (sessionId: string) =>
				Effect.gen(function* () {
					yield* db
						.update(conversation)
						.set({ dropOffEmailSentAt: new Date() })
						.where(eq(conversation.id, sessionId))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "markDropOffEmailSent",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to mark drop-off email sent" });
							}),
						);
				}),

			createExtensionSession: (userId: string, parentSessionId: string) =>
				Effect.gen(function* () {
					const [session] = yield* db
						.insert(conversation)
						.values({
							userId,
							parentSessionId,
							status: "active",
							messageCount: 0,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning()
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "createExtensionSession",
										userId,
										parentSessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to create extension session" });
							}),
						);

					if (!session) {
						return yield* Effect.fail(
							new DatabaseError({ message: "Failed to create extension session" }),
						);
					}

					logger.info("Extension session created", {
						sessionId: session.id,
						parentSessionId,
						userId,
					});
					return { sessionId: session.id };
				}),

			findCompletedSessionWithoutChild: (userId: string) =>
				Effect.gen(function* () {
					// Find most recent completed session that has no child extension session
					const childParentIds = db
						.select({ parentId: conversation.parentSessionId })
						.from(conversation)
						.where(sql`${conversation.parentSessionId} IS NOT NULL`);

					const results = yield* db
						.select()
						.from(conversation)
						.where(
							and(
								eq(conversation.userId, userId),
								eq(conversation.status, "completed"),
								sql`${conversation.id} NOT IN (${childParentIds})`,
							),
						)
						.orderBy(sql`${conversation.createdAt} DESC`)
						.limit(1)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "findCompletedSessionWithoutChild",
										userId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({
									message: "Failed to find completed session without child",
								});
							}),
						);

					if (results.length === 0 || !results[0]) {
						return null;
					}

					return yield* Schema.decodeUnknown(ConversationEntitySchema)(results[0]).pipe(
						Effect.mapError((error) => {
							try {
								logger.error("Schema parse error", {
									operation: "findCompletedSessionWithoutChild",
									error: String(error),
								});
							} catch (logError) {
								console.error("Logger failed:", logError);
							}
							return new DatabaseError({
								message: "Failed to parse completed session",
							});
						}),
					);
				}),

			hasExtensionSession: (parentSessionId: string) =>
				Effect.gen(function* () {
					const results = yield* db
						.select({ id: conversation.id })
						.from(conversation)
						.where(eq(conversation.parentSessionId, parentSessionId))
						.limit(1)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "hasExtensionSession",
										parentSessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to check extension session" });
							}),
						);

					return results.length > 0;
				}),

			findExtensionSession: (parentSessionId: string) =>
				Effect.gen(function* () {
					const results = yield* db
						.select()
						.from(conversation)
						.where(eq(conversation.parentSessionId, parentSessionId))
						.limit(1)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "findExtensionSession",
										parentSessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to find extension session" });
							}),
						);

					if (results.length === 0 || !results[0]) {
						return null;
					}

					return yield* Schema.decodeUnknown(ConversationEntitySchema)(results[0]).pipe(
						Effect.mapError((error) => {
							try {
								logger.error("Schema parse error", {
									operation: "findExtensionSession",
									error: String(error),
								});
							} catch (logError) {
								console.error("Logger failed:", logError);
							}
							return new DatabaseError({ message: "Failed to parse extension session" });
						}),
					);
				}),

			findCheckInEligibleSessions: (thresholdDays: number) =>
				Effect.gen(function* () {
					const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

					const results = yield* db
						.select({
							sessionId: conversation.id,
							userId: conversation.userId,
							userEmail: user.email,
							userName: user.name,
							updatedAt: conversation.updatedAt,
						})
						.from(conversation)
						.innerJoin(user, eq(conversation.userId, user.id))
						.where(
							and(
								eq(conversation.status, "completed"),
								lt(conversation.updatedAt, cutoff),
								isNull(conversation.checkInEmailSentAt),
							),
						)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "findCheckInEligibleSessions",
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to find check-in eligible sessions" });
							}),
						);

					return results.map((row) => ({
						sessionId: row.sessionId,
						userId: row.userId as string,
						userEmail: row.userEmail,
						userName: row.userName,
						updatedAt: row.updatedAt,
					}));
				}),

			markCheckInEmailSent: (sessionId: string) =>
				Effect.gen(function* () {
					yield* db
						.update(conversation)
						.set({ checkInEmailSentAt: new Date() })
						.where(eq(conversation.id, sessionId))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "markCheckInEmailSent",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to mark check-in email sent" });
							}),
						);
				}),

			findRecaptureEligibleSessions: (thresholdDays: number) =>
				Effect.gen(function* () {
					const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);

					// Find completed sessions past threshold, not yet emailed,
					// where the user has NO portrait_unlocked purchase event
					const results = yield* db
						.select({
							sessionId: conversation.id,
							userId: conversation.userId,
							userEmail: user.email,
							userName: user.name,
							updatedAt: conversation.updatedAt,
						})
						.from(conversation)
						.innerJoin(user, eq(conversation.userId, user.id))
						.leftJoin(
							purchaseEvents,
							and(
								eq(purchaseEvents.userId, conversation.userId),
								eq(purchaseEvents.eventType, "portrait_unlocked"),
							),
						)
						.where(
							and(
								eq(conversation.status, "completed"),
								lt(conversation.updatedAt, cutoff),
								isNull(conversation.recaptureEmailSentAt),
								isNull(purchaseEvents.id),
							),
						)
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "findRecaptureEligibleSessions",
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to find recapture eligible sessions" });
							}),
						);

					return results.map((row) => ({
						sessionId: row.sessionId,
						userId: row.userId as string,
						userEmail: row.userEmail,
						userName: row.userName,
						updatedAt: row.updatedAt,
					}));
				}),

			markRecaptureEmailSent: (sessionId: string) =>
				Effect.gen(function* () {
					yield* db
						.update(conversation)
						.set({ recaptureEmailSentAt: new Date() })
						.where(eq(conversation.id, sessionId))
						.pipe(
							Effect.mapError((error) => {
								try {
									logger.error("Database operation failed", {
										operation: "markRecaptureEmailSent",
										sessionId,
										error: error instanceof Error ? error.message : String(error),
									});
								} catch (logError) {
									console.error("Logger failed:", logError);
								}
								return new DatabaseError({ message: "Failed to mark recapture email sent" });
							}),
						);
				}),
		});
	}),
);
