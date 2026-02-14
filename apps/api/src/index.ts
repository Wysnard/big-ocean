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
	AnalyzerClaudeRepositoryLive,
	AppConfigLive,
	BetterAuthLive,
	BetterAuthService,
	CheckpointerPostgresRepositoryLive,
	CostGuardRedisRepositoryLive,
	DatabaseStack,
	FacetEvidenceDrizzleRepositoryLive,
	OrchestratorGraphLangGraphRepositoryLive,
	OrchestratorLangGraphRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
} from "@workspace/infrastructure";
import { AssessmentMessageDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/assessment-message.drizzle.repository";
import { AssessmentSessionDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { NerinAgentLangGraphRepositoryLive } from "@workspace/infrastructure/repositories/nerin-agent.langgraph.repository";
import { NerinAgentMockRepositoryLive } from "@workspace/infrastructure/repositories/nerin-agent.mock.repository";
import { RedisIoRedisRepositoryLive } from "@workspace/infrastructure/repositories/redis.ioredis.repository";
import { Context, Effect, Layer } from "effect";
import { AssessmentGroupLive } from "./handlers/assessment";
import { EvidenceGroupLive } from "./handlers/evidence";
import { HealthGroupLive } from "./handlers/health";
import { ProfileGroupLive } from "./handlers/profile";
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

// BetterAuth needs AppConfig and LoggerRepository (creates its own pg.Pool internally)
const AuthServices = BetterAuthLive.pipe(
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
 * Redis Layer - provides Redis for CostGuard
 */
const RedisLayer = RedisIoRedisRepositoryLive.pipe(Layer.provide(InfrastructureLayer));

/**
 * CostGuard Layer - budget tracking
 */
const CostGuardLayer = CostGuardRedisRepositoryLive.pipe(
	Layer.provide(RedisLayer),
	Layer.provide(InfrastructureLayer),
);

/**
 * Agent Layers - Nerin, Analyzer, Evidence for orchestration
 */
const AgentLayers = Layer.mergeAll(
	NerinAgentLayer,
	AnalyzerClaudeRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
).pipe(Layer.provide(InfrastructureLayer));

/**
 * Orchestrator Graph Layer - LangGraph graph with all agent dependencies
 *
 * Uses PostgreSQL checkpointer for durable conversation state persistence.
 */
const OrchestratorGraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(
	Layer.provide(AgentLayers),
	Layer.provide(CheckpointerPostgresRepositoryLive),
	Layer.provide(InfrastructureLayer),
);

/**
 * Orchestrator Layer - high-level orchestration repository
 *
 * Story 2.11: processAnalysis needs AnalyzerRepository + FacetEvidenceRepository
 */
const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
	Layer.provide(OrchestratorGraphLayer),
	Layer.provide(AgentLayers),
	Layer.provide(AssessmentMessageDrizzleRepositoryLive),
	Layer.provide(InfrastructureLayer),
);

/**
 * Repository Layers - require Database and Logger
 */
const RepositoryLayers = Layer.mergeAll(
	AssessmentSessionDrizzleRepositoryLive,
	AssessmentMessageDrizzleRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
	NerinAgentLayer,
	CostGuardLayer,
	OrchestratorLayer,
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
	ProfileGroupLive,
	EvidenceGroupLive,
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
 * Wrap Better Auth handler to intercept ALL requests
 *
 * Creates a wrapper that:
 * 1. Adds CORS headers to every response
 * 2. Handles OPTIONS preflight
 * 3. Processes Better Auth routes
 * 4. Passes non-auth requests to next handler
 */
function wrapServerWithCorsAndAuth(
	server: Server,
	auth: Context.Tag.Service<typeof BetterAuthService>,
	betterAuthUrl: string,
	frontendUrl: string,
): void {
	const betterAuthHandler = createBetterAuthHandler(auth, betterAuthUrl, frontendUrl);

	// Store original emit function
	const originalEmit = server.emit.bind(server);

	// Override emit to intercept "request" events
	server.emit = ((event: string, ...args: any[]): boolean => {
		if (event === "request") {
			const [req, res] = args as [IncomingMessage, ServerResponse];

			// Run our handler first (async, but we can't await in emit)
			betterAuthHandler(req, res).then(() => {
				// If response wasn't ended by our handler, let Effect handle it
				if (!res.writableEnded) {
					originalEmit("request", req, res);
				}
			});

			return true;
		}

		// For other events, use original emit
		return originalEmit(event, ...args);
	}) as any;
}

/**
 * Create custom server factory that integrates CORS and Better Auth BEFORE Effect
 *
 * NodeHttpServer.layer will attach the Effect handler to this server.
 * We intercept ALL requests first via emit override.
 */
const createCustomServerFactory =
	(
		auth: Context.Tag.Service<typeof BetterAuthService>,
		betterAuthUrl: string,
		frontendUrl: string,
	) =>
	(): Server => {
		const server = createServer();
		wrapServerWithCorsAndAuth(server, auth, betterAuthUrl, frontendUrl);
		return server;
	};

/**
 * Startup logging
 */
const logStartup = (port: number, frontendUrl: string) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		logger.info(`Starting Big Ocean API server on port ${port}`);
		logger.info("");
		logger.info("✓ CORS enabled:");
		logger.info(`  - Allowed origin: ${frontendUrl}`);
		logger.info("  - Credentials: true");
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
		logger.info("");
		logger.info("✓ Profile routes (Effect layer):");
		logger.info("  - POST  /api/profile/share");
		logger.info("  - GET   /api/profile/:publicProfileId");
		logger.info("  - PATCH /api/profile/:publicProfileId/visibility");
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
	yield* logStartup(config.port, config.frontendUrl);

	// Create HTTP server layer with CORS and Better Auth integration
	const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
		Layer.provide(ApiLayer),
		Layer.provide(
			NodeHttpServer.layer(createCustomServerFactory(auth, config.betterAuthUrl, config.frontendUrl), {
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
