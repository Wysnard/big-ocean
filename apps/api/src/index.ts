import "dotenv/config";
import { createServer } from "node:http";
import { Layer } from "effect";
import { HttpRouter } from "@effect/platform";
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
 * Main Server Layer
 *
 * Combines RPC, protocol, and HTTP server layers following the official pattern.
 */
const Main = HttpRouter.Default.serve().pipe(
  Layer.provide(RpcLayer),
  Layer.provide(HttpProtocol),
  Layer.provide(
    NodeHttpServer.layer(() => createServer(), {
      port: Number(process.env.PORT || 4000),
      host: process.env.HOST || "0.0.0.0",
    })
  )
);

/**
 * Startup logging
 */
logger.info(`Server starting on http://0.0.0.0:${process.env.PORT || 4000}`);
logger.info(`RPC endpoint available at /rpc`);

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
