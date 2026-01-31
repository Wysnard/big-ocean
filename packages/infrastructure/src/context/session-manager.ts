/**
 * Session Manager Service
 *
 * Manages assessment conversation sessions and message persistence.
 *
 * Follows Story 2-0.5 Effect Service Pattern:
 * - Context.Tag for service definition
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 *
 * Official patterns:
 * - Effect Services: https://effect.website/docs/requirements-management/services/
 * - Effect Layers: https://effect.website/docs/requirements-management/layers/
 */

import { Context, Layer, Effect } from "effect"
import { sql, eq, asc } from "drizzle-orm"
import type { TaggedDrizzleQueryError } from "drizzle-orm/effect-core/errors"
import { nanoid } from "nanoid"
import { Database } from "./database.js"
import { sessions, messages } from "../auth-schema.js"
import type { PrecisionScores, SessionData } from "@workspace/domain"
import { SessionNotFoundError } from "@workspace/domain"

/**
 * Session Manager Service Tag
 *
 * Service interface has NO requirements - dependencies managed by layer.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */
export class SessionManager extends Context.Tag("SessionManager")<
  SessionManager,
  {
    /**
     * Create a new assessment session
     *
     * @param userId - Optional user ID (NULL for anonymous sessions)
     * @returns Effect with session ID
     */
    readonly createSession: (userId?: string) => Effect.Effect<{ sessionId: string }, TaggedDrizzleQueryError>

    /**
     * Save a message to a session
     *
     * @param sessionId - Session identifier
     * @param role - Message sender role ('user' | 'assistant')
     * @param content - Message content
     * @param userId - Optional user ID for user messages
     * @returns Effect with void
     */
    readonly saveMessage: (
      sessionId: string,
      role: "user" | "assistant",
      content: string,
      userId?: string
    ) => Effect.Effect<void, TaggedDrizzleQueryError>

    /**
     * Retrieve full session with message history
     *
     * @param sessionId - Session identifier
     * @returns Effect with session data or SessionNotFoundError
     */
    readonly getSession: (
      sessionId: string
    ) => Effect.Effect<SessionData, SessionNotFoundError | TaggedDrizzleQueryError>

    /**
     * Update precision scores for a session
     *
     * @param sessionId - Session identifier
     * @param precision - New precision scores
     * @returns Effect with void
     */
    readonly updatePrecision: (
      sessionId: string,
      precision: PrecisionScores
    ) => Effect.Effect<void, TaggedDrizzleQueryError>
  }
>() {}

/**
 * Session Manager Layer - Receives database through DI
 *
 * Layer type: Layer<SessionManager, never, Database>
 * Database dependency resolved during layer construction, not at service level.
 *
 * "Layers act as constructors for creating services" - dependencies managed at construction time.
 */
export const SessionManagerLive = Layer.effect(
  SessionManager,
  Effect.gen(function* () {
    // KEY: Receive database through DI during layer construction
    const database = yield* Database

    // Return service implementation
    return {
      createSession: (userId?: string) =>
        Effect.gen(function* () {
          // Generate unique session ID
          const sessionId = `session_${Date.now()}_${nanoid()}`

          // Insert session with baseline precision scores (all 0.5)
          // Note: Drizzle Effect Postgres returns Effect, not Promise
          yield* database.insert(sessions).values({
            id: sessionId,
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

          return { sessionId }
        }),

      saveMessage: (sessionId, role, content, userId) =>
        Effect.gen(function* () {
          // Save message
          yield* database.insert(messages).values({
            id: `msg_${nanoid()}`,
            sessionId,
            userId: role === "user" ? (userId ?? null) : null, // Only set userId for user messages
            role,
            content,
            createdAt: new Date(),
          })

          // Update session message count and timestamp
          yield* database
            .update(sessions)
            .set({
              messageCount: sql`${sessions.messageCount} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(sessions.id, sessionId))
        }),

      getSession: (sessionId) =>
        Effect.gen(function* () {
          // Load session using select (simpler than relational query)
          const sessionResults = yield* database
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1)

          // Session not found error
          if (sessionResults.length === 0) {
            return yield* Effect.fail(
              new SessionNotFoundError({ sessionId })
            )
          }

          const sessionResult = sessionResults[0]!

          // Load messages in chronological order
          const messagesResult = yield* database
            .select()
            .from(messages)
            .where(eq(messages.sessionId, sessionId))
            .orderBy(asc(messages.createdAt))

          return {
            session: {
              id: sessionResult.id,
              userId: sessionResult.userId,
              createdAt: sessionResult.createdAt,
              updatedAt: sessionResult.updatedAt,
              status: sessionResult.status as "active" | "paused" | "completed",
              precision: sessionResult.precision as PrecisionScores,
              messageCount: sessionResult.messageCount,
            },
            messages: messagesResult.map((m) => ({
              id: m.id,
              sessionId: m.sessionId,
              role: m.role as "user" | "assistant",
              content: m.content,
              createdAt: m.createdAt,
            })),
          }
        }),

      updatePrecision: (sessionId, precision) =>
        Effect.gen(function* () {
          yield* database
            .update(sessions)
            .set({
              precision,
              updatedAt: new Date(),
            })
            .where(eq(sessions.id, sessionId))
        }),
    }
  })
)
