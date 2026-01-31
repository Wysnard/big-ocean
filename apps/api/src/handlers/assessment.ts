/**
 * Assessment Handlers
 *
 * HTTP handlers for assessment endpoints using Effect.gen() syntax.
 * Pattern from: effect-worker-mono/apps/effect-worker-api/src/handlers/*.ts
 *
 * Story 2-1: Integrated SessionManager for session persistence
 */

import { HttpApiBuilder } from "@effect/platform"
import { DateTime, Effect } from "effect"
import { BigOceanApi } from "@workspace/contracts"
import { LoggerService } from "../services/logger.js"
import { SessionManager } from "@workspace/infrastructure"

export const AssessmentGroupLive = HttpApiBuilder.group(
  BigOceanApi,
  "assessment",
  (handlers) =>
    Effect.gen(function* () {
      // Story 2-1: Access SessionManager service via DI
      const sessionMgr = yield* SessionManager

      return handlers
        .handle("start", ({ payload }) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService

            // Story 2-1: Create session using SessionManager
            const { sessionId } = yield* sessionMgr.createSession(payload.userId).pipe(
              Effect.orDie // Convert database errors to defects for now
            )
            const createdAt = DateTime.unsafeMake(Date.now())

            logger.info("Assessment session started", {
              sessionId,
              userId: payload.userId,
            })

            return {
              sessionId,
              createdAt,
            }
          })
        )
        .handle("sendMessage", ({ payload }) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService

            // Story 2-1: Get session to validate it exists and is active
            const sessionData = yield* sessionMgr.getSession(payload.sessionId).pipe(
              Effect.orDie // Convert errors to defects for now
            )

            // Story 2-1: Save user message to database
            yield* sessionMgr.saveMessage(
              payload.sessionId,
              "user",
              payload.message,
              sessionData.session.userId ?? undefined
            ).pipe(
              Effect.orDie
            )

            logger.info("Message saved", {
              sessionId: payload.sessionId,
              messageLength: payload.message.length,
            })

            // TODO Story 2-2: Implement Nerin agent logic
            // For now, return placeholder response
            return {
              response: "Thank you for sharing that. This is a placeholder response until Story 2-2 implements the Nerin agent.",
              precision: sessionData.session.precision,
            }
          })
        )
        .handle("getResults", ({ request }) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService
            // Extract sessionId from URL path
            const url = new URL(request.url, "http://localhost")
            const pathParts = url.pathname.split("/")
            const sessionId = pathParts[pathParts.length - 2] // /:sessionId/results

            logger.info("Get results request", { sessionId })

            // TODO: Retrieve results from database (Epic 2)
            return {
              oceanCode: "PPAM",
              archetypeName: "The Grounded Thinker",
              traits: {
                openness: 0.75,
                conscientiousness: 0.65,
                extraversion: 0.45,
                agreeableness: 0.85,
                neuroticism: 0.25,
              },
            }
          })
        )
        .handle("resumeSession", ({ request }) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService
            // Extract sessionId from URL path
            const url = new URL(request.url, "http://localhost")
            const pathParts = url.pathname.split("/")
            const sessionId = pathParts[pathParts.length - 2]! // /:sessionId/resume - guaranteed by route pattern

            logger.info("Resume session request", { sessionId })

            // Story 2-1: Load session from database with full message history
            const { session, messages } = yield* sessionMgr.getSession(sessionId).pipe(
              Effect.orDie // Convert errors to defects for now
            )

            return {
              messages: messages.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
                timestamp: DateTime.unsafeMake(m.createdAt.getTime()),
              })),
              precision: session.precision,
            }
          })
        )
    })
)
