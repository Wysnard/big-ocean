/**
 * Big Ocean API Server
 *
 * Effect/Platform HTTP server
 * Pattern from: effect-worker-mono + Effect RPC examples
 */

import "dotenv/config"
import { Layer } from "effect"
import { HttpApiBuilder, HttpMiddleware, HttpServer } from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { createServer } from "node:http"
import { BigOceanApi } from "@workspace/contracts"
import { HealthGroupLive } from "./handlers/health.js"
import { AssessmentGroupLive } from "./handlers/assessment.js"
import logger from "./logger.js"

/**
 * Configuration
 */
const port = Number(process.env.PORT || 4000)

/**
 * Combined Handler Layers
 */
const HttpGroupsLive = Layer.mergeAll(HealthGroupLive, AssessmentGroupLive)

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
  HttpApiBuilder.Middleware.layer,
  HttpServer.layerContext
)

/**
 * HTTP Server Layer
 * Serves the API with logging middleware and Node.js server
 */
const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(ApiLayer),
  Layer.provide(NodeHttpServer.layer(createServer, { port }))
)

/**
 * Startup logging
 */
logger.info(`Starting Big Ocean API server on port ${port}`)
logger.info("Available routes:")
logger.info("  - GET  /api/health")
logger.info("  - POST /api/assessment/start")
logger.info("  - POST /api/assessment/message")
logger.info("  - GET  /api/assessment/:sessionId/resume")
logger.info("  - GET  /api/assessment/:sessionId/results")
logger.info("")
logger.info("TODO - Better Auth routes (to be integrated in Phase 5):")
logger.info("  - POST /api/auth/sign-up/email")
logger.info("  - POST /api/auth/sign-in/email")
logger.info("  - POST /api/auth/sign-out")
logger.info("  - GET  /api/auth/get-session")

/**
 * Launch server
 */
NodeRuntime.runMain(Layer.launch(HttpLive))

/**
 * Error Handlers
 */
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`)
})

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { error })
  process.exit(1)
})
