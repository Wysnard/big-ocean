/**
 * Big Ocean API Server
 *
 * Hybrid architecture - Better Auth at node:http layer, Effect handles rest
 * Pattern from: https://dev.to/danimydev/authentication-with-nodehttp-and-better-auth-2l2g
 */

import "dotenv/config"
import { Effect, Layer } from "effect"
import { HttpApiBuilder, HttpMiddleware } from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { createServer } from "node:http"
import type { Server, IncomingMessage, ServerResponse } from "node:http"
import { BigOceanApi } from "@workspace/contracts"
import { HealthGroupLive } from "./handlers/health.js"
import { AssessmentGroupLive } from "./handlers/assessment.js"
import { LoggerService, LoggerServiceLive } from "./services/logger.js"
import { betterAuthHandler } from "./middleware/better-auth.js"

/**
 * Configuration
 */
const port = Number(process.env.PORT || 4000)

/**
 * Combined Handler Layers with Logger Service
 */
const HttpGroupsLive = Layer.mergeAll(
  HealthGroupLive,
  AssessmentGroupLive,
  LoggerServiceLive
)

/**
 * API Layer - Builds HTTP API from contracts with handlers
 */
const ApiLive = HttpApiBuilder.api(BigOceanApi).pipe(
  Layer.provide(HttpGroupsLive)
)

/**
 * Complete API Layer with Router, Middleware, and Server Context
 */
const ApiLayer = Layer.mergeAll(
  ApiLive,
  HttpApiBuilder.Router.Live,
  HttpApiBuilder.Middleware.layer
)

/**
 * Custom server factory that integrates Better Auth BEFORE Effect
 *
 * NodeHttpServer.layer will attach the Effect handler to this server.
 * We intercept requests first to handle Better Auth routes.
 */
const createCustomServer = (): Server => {
  const server = createServer()
  let effectHandler: ((req: IncomingMessage, res: ServerResponse) => void) | null = null

  // Store reference to Effect's handler when it gets attached
  server.on("newListener", (event, listener) => {
    if (event === "request") {
      effectHandler = listener as any
      // Remove the Effect listener - we'll call it manually after Better Auth
      server.removeListener("request", listener as any)
    }
  })

  // Our custom request handler
  server.on("request", async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Step 1: Try Better Auth first
      await betterAuthHandler(req, res)

      // Step 2: If Better Auth handled the request, we're done
      if (res.writableEnded) {
        return
      }

      // Step 3: Pass to Effect handler
      if (effectHandler) {
        effectHandler(req, res)
      } else {
        // Fallback if Effect hasn't attached yet
        res.statusCode = 503
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify({
          error: "Service initializing"
        }))
      }
    } catch (error: any) {
      console.error("Server error:", error.message)
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify({ error: "Internal server error" }))
      }
    }
  })

  return server
}

/**
 * HTTP Server Layer with Better Auth integration
 */
const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(ApiLayer),
  Layer.provide(NodeHttpServer.layer(createCustomServer, { port })),
  Layer.provide(LoggerServiceLive)
)

/**
 * Startup logging
 */
const logStartup = Effect.gen(function* () {
  const logger = yield* LoggerService

  logger.info(`Starting Big Ocean API server on port ${port}`)
  logger.info("")
  logger.info("✓ Better Auth routes (node:http layer):")
  logger.info("  - POST /api/auth/sign-up/email")
  logger.info("  - POST /api/auth/sign-in/email")
  logger.info("  - POST /api/auth/sign-out")
  logger.info("  - GET  /api/auth/get-session")
  logger.info("")
  logger.info("✓ Effect/Platform routes (Effect layer):")
  logger.info("  - GET  /api/health")
  logger.info("  - POST /api/assessment/start")
  logger.info("  - POST /api/assessment/message")
  logger.info("  - GET  /api/assessment/:sessionId/resume")
  logger.info("  - GET  /api/assessment/:sessionId/results")
}).pipe(Effect.provide(LoggerServiceLive))

/**
 * Launch server
 */
Effect.runPromise(logStartup).then(() => {
  NodeRuntime.runMain(Layer.launch(HttpLive))
})

/**
 * Error Handlers
 */
process.on("unhandledRejection", (reason) => {
  console.error(`Unhandled Rejection: ${reason}`)
})

process.on("uncaughtException", (error) => {
  console.error(`Uncaught Exception: ${error.message}`, error)
  process.exit(1)
})
