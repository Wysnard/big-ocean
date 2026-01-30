import "dotenv/config";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { Effect, Layer } from "effect";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { RpcServer, RpcSerialization } from "@effect/rpc";
import { BigOceanRpcs } from "@workspace/contracts";
import logger from "./logger.js";
import { AssessmentRpcHandlersLive } from "./handlers/assessment.js";
import { ProfileRpcHandlersLive } from "./handlers/profile.js";

/**
 * Combined RPC Handlers Layer
 *
 * Merges all handler layers following the official @effect/rpc pattern.
 */
const HandlersLayer = Layer.mergeAll(AssessmentRpcHandlersLive, ProfileRpcHandlersLive);

/**
 * RPC Server Layer
 *
 * Creates the RPC server with handlers.
 */
const RpcLayer = RpcServer.layer(BigOceanRpcs).pipe(Layer.provide(HandlersLayer));

/**
 * HTTP Protocol Layer
 *
 * Configures HTTP protocol and serialization for RPC.
 */
const HttpProtocol = RpcServer.layerProtocolHttp({
  path: "/rpc",
}).pipe(Layer.provide(RpcSerialization.layerNdjson));

/**
 * Custom HTTP handler with health check
 */
const httpHandler = (req: IncomingMessage, res: ServerResponse) => {
  const url = req.url || "";
  const method = req.method || "GET";

  // Health check endpoint (CRITICAL for Railway deployment)
  if (url === "/health" && method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "ok" }));
    logger.debug("[HTTP] Health check passed");
    return;
  }

  // All other requests go to Effect RPC handler
  // (Effect RPC will handle /rpc requests via the HttpProtocol layer)
};

/**
 * Main Server Layer
 *
 * Combines RPC, protocol, and HTTP server layers with health check.
 */
const Main = NodeHttpServer.layer(() => createServer(httpHandler), {
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || "0.0.0.0",
}).pipe(Layer.provide(RpcLayer), Layer.provide(HttpProtocol));

/**
 * Startup logging
 */
logger.info(`Server starting on http://0.0.0.0:${process.env.PORT || 4000}`);
logger.info(`RPC endpoint available at /rpc`);
logger.info(`Health endpoint available at /health`);

// Launch the server
NodeRuntime.runMain(Layer.launch(Main));

// Error handlers
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { error });
  process.exit(1);
});
