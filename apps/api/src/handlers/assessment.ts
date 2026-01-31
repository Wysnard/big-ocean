/**
 * Assessment Handlers
 *
 * HTTP handlers for assessment endpoints using Effect.gen() syntax.
 * Pattern from: effect-worker-mono/apps/effect-worker-api/src/handlers/*.ts
 */

import { HttpApiBuilder } from "@effect/platform"
import { DateTime, Effect } from "effect"
import { BigOceanApi } from "@workspace/contracts"
import { LoggerService } from "../services/logger.js"

export const AssessmentGroupLive = HttpApiBuilder.group(
  BigOceanApi,
  "assessment",
  (handlers) =>
    Effect.gen(function* () {
      return handlers
        .handle("start", ({ payload }) =>
          Effect.gen(function* () {
            const logger = yield* LoggerService

            // Generate session ID
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
            const createdAt = DateTime.unsafeMake(Date.now())

            // TODO: Store session in database (Epic 2)
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

            logger.info("Message received", {
              sessionId: payload.sessionId,
              messageLength: payload.message.length,
            })

            // TODO: Implement Nerin agent logic (Epic 2)
            return {
              response: "Thank you for sharing that. This is a placeholder response until Epic 2 implements the Nerin agent.",
              precision: {
                openness: 0.5,
                conscientiousness: 0.4,
                extraversion: 0.6,
                agreeableness: 0.7,
                neuroticism: 0.3,
              },
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
            const sessionId = pathParts[pathParts.length - 2] // /:sessionId/resume

            logger.info("Resume session request", { sessionId })

            // TODO: Load session from database (Epic 2)
            return {
              messages: [],
              precision: {
                openness: 0.5,
                conscientiousness: 0.5,
                extraversion: 0.5,
                agreeableness: 0.5,
                neuroticism: 0.5,
              },
            }
          })
        )
    })
)
