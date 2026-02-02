/**
 * Message Repository Implementation (Drizzle)
 *
 * Manages message persistence for assessment conversations.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 * - Uses MessageRepository.of({...}) for proper service implementation
 */

import { Layer, Effect, Schema } from "effect";
import { eq, asc, sql } from "drizzle-orm";
import { Database } from "../context/database.js";
import { assessmentMessage } from "../infrastructure/db/schema.js";
import { AssessmentMessageRepository } from "@workspace/domain/repositories/assessment-message.repository";
import { AssessmentMessageEntitySchema } from "@workspace/domain/entities/message.entity";
import { DatabaseError } from "@workspace/contracts/errors";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";

/**
 * Message Repository Layer - Receives database and logger through DI
 *
 * Layer type: Layer<MessageRepository, never, Database | LoggerRepository>
 * Dependencies resolved during layer construction, not at service level.
 */
export const AssessmentMessageDrizzleRepositoryLive = Layer.effect(
  AssessmentMessageRepository,
  Effect.gen(function* () {
    // Receive dependencies through DI during layer construction
    const db = yield* Database;
    const logger = yield* LoggerRepository;

    // Return service implementation using .of() pattern
    return AssessmentMessageRepository.of({
      saveMessage: (sessionId, role, content, userId) =>
        Effect.gen(function* () {
          const [message] = yield* db
            .insert(assessmentMessage)
            .values({
              sessionId,
              userId: role === "user" ? (userId ?? null) : null,
              role,
              content,
              createdAt: new Date(),
            })
            .returning()
            .pipe(
              Effect.mapError((error) => {
                // Log technical details before throwing (safe - wrapped in try-catch)
                try {
                  logger.error("Database operation failed", {
                    operation: "saveMessage",
                    sessionId,
                    error:
                      error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                  });
                } catch (logError) {
                  // Silently ignore logger failures - don't let logging prevent error handling
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
              // Silently ignore logger failures - don't let logging prevent error handling
              console.error("Logger failed:", logError);
            }

            return yield* Effect.fail(
              new DatabaseError({
                message: "Failed to save message",
              }),
            );
          }

          return yield* Schema.decodeUnknown(AssessmentMessageEntitySchema)(
            message,
          ).pipe(
            Effect.mapError((error) => {
              // Log technical details before throwing (safe - wrapped in try-catch)
              try {
                logger.error("Database operation failed", {
                  operation: "saveMessage",
                  sessionId,
                  error: `Schema parse error: ${error}`,
                });
              } catch (logError) {
                // Silently ignore logger failures - don't let logging prevent error handling
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
                // Log technical details before throwing (safe - wrapped in try-catch)
                try {
                  logger.error("Database operation failed", {
                    operation: "getMessages",
                    sessionId,
                    error:
                      error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                  });
                } catch (logError) {
                  // Silently ignore logger failures - don't let logging prevent error handling
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
              // Log technical details before throwing (safe - wrapped in try-catch)
              try {
                logger.error("Database operation failed", {
                  operation: "getMessages",
                  sessionId,
                  error: `Schema parse error: ${error}`,
                });
              } catch (logError) {
                // Silently ignore logger failures - don't let logging prevent error handling
                console.error("Logger failed in error handler:", logError);
              }

              return new DatabaseError({
                message: "Failed to fetch messages",
              });
            }),
          );
        }),

      getMessageCount: (sessionId) =>
        Effect.gen(function* () {
          // Count messages for session
          const result = yield* db
            .select({ count: sql<number>`cast(count(*) as int)` })
            .from(assessmentMessage)
            .where(eq(assessmentMessage.sessionId, sessionId))
            .pipe(
              Effect.mapError((error) => {
                // Log technical details before throwing (safe - wrapped in try-catch)
                try {
                  logger.error("Database operation failed", {
                    operation: "getMessageCount",
                    sessionId,
                    error:
                      error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                  });
                } catch (logError) {
                  // Silently ignore logger failures - don't let logging prevent error handling
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
