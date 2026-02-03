/**
 * Big Ocean API Server
 *
 * Effect-first architecture - all initialization via Layer composition.
 * Better Auth at node:http layer, Effect handles remaining routes.
 * Pattern from: https://dev.to/danimydev/authentication-with-nodehttp-and-better-auth-2l2g
 */

import "dotenv/config";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { HttpApiBuilder, HttpMiddleware } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { BigOceanApi } from "@workspace/contracts";
import { AppConfig } from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import {
	AppConfigLive,
	BetterAuthLive,
	BetterAuthService,
	DatabaseStack,
} from "@workspace/infrastructure";
import { AssessmentMessageDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/assessment-message.drizzle.repository";
import { AssessmentSessionDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { NerinAgentLangGraphRepositoryLive } from "@workspace/infrastructure/repositories/nerin-agent.langgraph.repository";
import { NerinAgentMockRepositoryLive } from "@workspace/infrastructure/repositories/nerin-agent.mock.repository";
import { Context, Effect, Layer } from "effect";
import { AssessmentGroupLive } from "./handlers/assessment";
import { HealthGroupLive } from "./handlers/health";
import { createBetterAuthHandler } from "./middleware/better-auth";

/**
 * Infrastructure Layer - Config, Database, Auth, Logger
 *
 * Build layers bottom-up: base services first, then dependent services.
 * AppConfig is the foundation - all other services depend on it.
 */

// Base services with no dependencies
const BaseServices = Layer.mergeAll(AppConfigLive, LoggerPinoRepositoryLive);

// Database stack needs AppConfig
const DatabaseServices = DatabaseStack.pipe(Layer.provide(AppConfigLive));

// BetterAuth needs AppConfig, Database, and LoggerRepository
const AuthServices = BetterAuthLive.pipe(
	Layer.provide(DatabaseServices),
	Layer.provide(LoggerPinoRepositoryLive),
	Layer.provide(AppConfigLive),
);

// Complete infrastructure layer - merge all services for consumers
const InfrastructureLayer = Layer.mergeAll(BaseServices, DatabaseServices, AuthServices);

/**
 * Nerin Agent Layer Selection
 *
 * Uses mock implementation when MOCK_LLM=true (for integration testing).
 * Uses real LangGraph implementation otherwise (production/development).
 *
 * Benefits:
 * - Zero Anthropic API costs during integration testing
 * - Deterministic responses for reliable test assertions
 * - Same Layer interface for both mock and real implementations
 */
const NerinAgentLayer =
	process.env.MOCK_LLM === "true" ? NerinAgentMockRepositoryLive : NerinAgentLangGraphRepositoryLive;

/**
 * Repository Layers - require Database and Logger
 */
const RepositoryLayers = Layer.mergeAll(
	AssessmentSessionDrizzleRepositoryLive,
	AssessmentMessageDrizzleRepositoryLive,
	NerinAgentLayer,
);

/**
 * Service Layers - combines infrastructure with repositories
 */
const ServiceLayers = RepositoryLayers.pipe(Layer.provide(InfrastructureLayer));

/**
 * Handler Layers - HTTP API handlers
 */
const HttpGroupsLive = Layer.mergeAll(
	HealthGroupLive,
	AssessmentGroupLive,
	LoggerPinoRepositoryLive,
);

/**
 * API Layer - Builds HTTP API from contracts with handlers
 */
const ApiLive = HttpApiBuilder.api(BigOceanApi).pipe(Layer.provide(HttpGroupsLive));

/**
 * Complete API Layer with Router, Middleware, and Server Context
 */
const ApiLayer = Layer.mergeAll(
	ApiLive,
	HttpApiBuilder.Router.Live,
	HttpApiBuilder.Middleware.layer,
);

/**
 * Create custom server factory that integrates Better Auth BEFORE Effect
 *
 * NodeHttpServer.layer will attach the Effect handler to this server.
 * We intercept requests first to handle Better Auth routes.
 */
const createCustomServerFactory =
	(auth: Context.Tag.Service<typeof BetterAuthService>, betterAuthUrl: string) => (): Server => {
		const betterAuthHandler = createBetterAuthHandler(auth, betterAuthUrl);

		const server = createServer();

		// Add a one-time listener for when Effect attaches its handler
		// We need to prepend our handler BEFORE Effect's handler
		server.once("newListener", (event) => {
			if (event === "request") {
				// Prepend our custom handler that runs BEFORE Effect
				// prependListener ensures we run first
				server.prependListener("request", async (req: IncomingMessage, res: ServerResponse) => {
					// Only process Better Auth routes - others pass through to Effect
					await betterAuthHandler(req, res);
				});
			}
		});

		return server;
	};

/**
 * Startup logging
 */
const logStartup = (port: number) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		logger.info(`Starting Big Ocean API server on port ${port}`);
		logger.info("");
		logger.info("✓ Better Auth routes (node:http layer):");
		logger.info("  - POST /api/auth/sign-up/email");
		logger.info("  - POST /api/auth/sign-in/email");
		logger.info("  - POST /api/auth/sign-out");
		logger.info("  - GET  /api/auth/get-session");
		logger.info("");
		logger.info("✓ Effect/Platform routes (Effect layer):");
		logger.info("  - GET  /health");
		logger.info("  - POST /api/assessment/start");
		logger.info("  - POST /api/assessment/message");
		logger.info("  - GET  /api/assessment/:sessionId/resume");
		logger.info("  - GET  /api/assessment/:sessionId/results");
	});

/**
 * Main program - all initialization via Layer composition
 *
 * All initialization runs within Effect context for proper error handling.
 */
const main = Effect.gen(function* () {
	// Get injected services
	const config = yield* AppConfig;
	const auth = yield* BetterAuthService;
	const logger = yield* LoggerRepository;

	// Log startup info
	yield* logStartup(config.port);

	// Create HTTP server layer with Better Auth integration
	const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
		Layer.provide(ApiLayer),
		Layer.provide(
			NodeHttpServer.layer(createCustomServerFactory(auth, config.betterAuthUrl), {
				port: config.port,
			}),
		),
		Layer.provide(ServiceLayers),
		Layer.provide(InfrastructureLayer),
	);

	logger.info("Launching HTTP server...");

	// Launch server
	yield* Layer.launch(HttpLive);
}).pipe(Effect.provide(InfrastructureLayer));

/**
 * Launch server
 */
NodeRuntime.runMain(main);

/**
 * Error Handlers
 */
process.on("unhandledRejection", (reason) => {
	console.error(`Unhandled Rejection: ${reason}`);
});

process.on("uncaughtException", (error) => {
	console.error(`Uncaught Exception: ${error.message}`, error);
	process.exit(1);
});
