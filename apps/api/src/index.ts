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
import { HttpApiBuilder, HttpMiddleware, HttpServerRequest } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { BigOceanApi } from "@workspace/contracts";
import type { PortraitJob } from "@workspace/domain";
import { AppConfig, PortraitJobQueue } from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import {
	AppConfigLive,
	AssessmentResultDrizzleRepositoryLive,
	BetterAuthLive,
	BetterAuthService,
	ConversanalyzerAnthropicRepositoryLive,
	ConversationEvidenceDrizzleRepositoryLive,
	CostGuardRedisRepositoryLive,
	DailyCheckInDrizzleRepositoryLive,
	DatabaseStack,
	ExchangeDrizzleRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
	LifecycleEmailDrizzleRepositoryLive,
	PortraitDrizzleRepositoryLive,
	PortraitProseRendererAnthropicRepositoryLive,
	PortraitRatingDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	PurchaseEventDrizzleRepositoryLive,
	PushNotificationQueueDrizzleRepositoryLive,
	PushSubscriptionDrizzleRepositoryLive,
	QrTokenDrizzleRepositoryLive,
	RelationshipAnalysisDrizzleRepositoryLive,
	RelationshipAnalysisGeneratorAnthropicRepositoryLive,
	RelationshipSharedNoteDrizzleRepositoryLive,
	ResendEmailResendRepositoryLive,
	SpineExtractorAnthropicRepositoryLive,
	SpineVerifierAnthropicRepositoryLive,
	UserSummaryDrizzleRepositoryLive,
	UserSummaryGeneratorAnthropicRepositoryLive,
	WaitlistDrizzleRepositoryLive,
	WebPushFetchRepositoryLive,
	WeeklySummaryDrizzleRepositoryLive,
	WeeklySummaryGeneratorAnthropicRepositoryLive,
} from "@workspace/infrastructure";
import { ConversationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/conversation.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { MessageDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/message.drizzle.repository";
import { NerinActorAnthropicRepositoryLive } from "@workspace/infrastructure/repositories/nerin-actor.anthropic.repository";
import { NerinAgentAnthropicRepositoryLive } from "@workspace/infrastructure/repositories/nerin-agent.anthropic.repository";
import { NerinDirectorAnthropicRepositoryLive } from "@workspace/infrastructure/repositories/nerin-director.anthropic.repository";
import { RedisIoRedisRepositoryLive } from "@workspace/infrastructure/repositories/redis.ioredis.repository";
import { UserAccountDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/user-account.drizzle.repository";
import { Cause, Context, Effect, Layer, Queue } from "effect";
import { AccountGroupLive } from "./handlers/account";
import { ConversationGroupLive } from "./handlers/conversation";
import { EmailGroupLive } from "./handlers/email";
import { EvidenceGroupLive } from "./handlers/evidence";
import { HealthGroupLive } from "./handlers/health";
import { JobsGroupLive } from "./handlers/jobs";
import { PortraitGroupLive } from "./handlers/portrait";
import { ProfileGroupLive } from "./handlers/profile";
import { PurchaseGroupLive } from "./handlers/purchase";
import { QrTokenGroupLive } from "./handlers/qr-token";
import { RelationshipGroupLive } from "./handlers/relationship";
import { TodayGroupLive } from "./handlers/today";
import { WaitlistGroupLive } from "./handlers/waitlist";
import { AuthMiddlewareLive, OptionalAuthMiddlewareLive } from "./middleware/auth.middleware";
import { createBetterAuthHandler } from "./middleware/better-auth";
import { portraitGenerationWorker } from "./workers/portrait-generation.worker";

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

// Portrait job queue — shared between finalization/retry (offer) and worker fiber (take)
const PortraitJobQueueLive = Layer.effect(PortraitJobQueue, Queue.unbounded<PortraitJob>());

// BetterAuth needs AppConfig and LoggerRepository (plain pg pool for Better Auth queries)
const AuthServices = BetterAuthLive.pipe(
	Layer.provide(LoggerPinoRepositoryLive),
	Layer.provide(AppConfigLive),
);

// Complete infrastructure layer - merge all services for consumers
const InfrastructureLayer = Layer.mergeAll(
	BaseServices,
	DatabaseServices,
	AuthServices,
	PortraitJobQueueLive,
);

/**
 * LLM Layer Selection — Production
 *
 * For E2E testing with mock layers, use index.e2e.ts instead.
 */

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
 * Repository Layers - require Database and Logger
 */
const SessionRepoLayer = ConversationDrizzleRepositoryLive.pipe(Layer.provide(RedisLayer));

const RepositoryLayers = Layer.mergeAll(
	SessionRepoLayer,
	MessageDrizzleRepositoryLive,
	ExchangeDrizzleRepositoryLive,
	AssessmentResultDrizzleRepositoryLive,
	ConversationEvidenceDrizzleRepositoryLive,
	LifecycleEmailDrizzleRepositoryLive,
	ConversanalyzerAnthropicRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
	NerinActorAnthropicRepositoryLive,
	NerinAgentAnthropicRepositoryLive,
	NerinDirectorAnthropicRepositoryLive,
	CostGuardLayer,
	SpineExtractorAnthropicRepositoryLive,
	SpineVerifierAnthropicRepositoryLive,
	PortraitProseRendererAnthropicRepositoryLive,
	PortraitDrizzleRepositoryLive,
	PortraitRatingDrizzleRepositoryLive,
	PurchaseEventDrizzleRepositoryLive,
	DailyCheckInDrizzleRepositoryLive,
	PushNotificationQueueDrizzleRepositoryLive,
	PushSubscriptionDrizzleRepositoryLive,
	RelationshipAnalysisDrizzleRepositoryLive,
	RelationshipSharedNoteDrizzleRepositoryLive,
	RelationshipAnalysisGeneratorAnthropicRepositoryLive,
	QrTokenDrizzleRepositoryLive,
	UserAccountDrizzleRepositoryLive,
	UserSummaryDrizzleRepositoryLive,
	UserSummaryGeneratorAnthropicRepositoryLive,
	WeeklySummaryDrizzleRepositoryLive,
	WeeklySummaryGeneratorAnthropicRepositoryLive,
	WaitlistDrizzleRepositoryLive,
	ResendEmailResendRepositoryLive,
	WebPushFetchRepositoryLive,
);

/**
 * Service Layers - combines infrastructure with repositories
 */
const ServiceLayers = RepositoryLayers.pipe(Layer.provide(InfrastructureLayer));

/**
 * Handler Layers - HTTP API handlers
 */
/**
 * Auth Middleware Layer - requires BetterAuthService from InfrastructureLayer
 *
 * Provided separately from HttpGroupsLive because HttpApiBuilder.api() pulls
 * AuthMiddleware into its own R type parameter (from the group contract's
 * .middleware(AuthMiddleware) declaration). Layer.mergeAll doesn't cross-resolve
 * dependencies, so we provide AuthMiddleware explicitly to ApiLive.
 */
const AuthMiddlewareLayer = Layer.mergeAll(AuthMiddlewareLive, OptionalAuthMiddlewareLive).pipe(
	Layer.provide(InfrastructureLayer),
);

const HttpGroupsLive = Layer.mergeAll(
	HealthGroupLive,
	AccountGroupLive,
	ConversationGroupLive,
	ProfileGroupLive,
	PortraitGroupLive,
	EvidenceGroupLive,
	PurchaseGroupLive,
	QrTokenGroupLive,
	RelationshipGroupLive,
	TodayGroupLive,
	WaitlistGroupLive,
	EmailGroupLive,
	JobsGroupLive,
	LoggerPinoRepositoryLive,
);

/**
 * API Layer - Builds HTTP API from contracts with handlers
 */
const ApiLive = HttpApiBuilder.api(BigOceanApi).pipe(
	Layer.provide(HttpGroupsLive),
	Layer.provide(AuthMiddlewareLayer),
);

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
				if (!res.writableEnded && !res.headersSent) {
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
		logger.info("  - POST /api/conversation/start");
		logger.info("  - POST /api/conversation/message");
		logger.info("  - GET  /api/conversation/:sessionId/resume");
		logger.info("  - GET  /api/conversation/:sessionId/results");
		logger.info("");
		logger.info("✓ Public Profile routes (Effect layer):");
		logger.info("  - POST  /api/public-profile/share");
		logger.info("  - GET   /api/public-profile/:publicProfileId");
		logger.info("  - PATCH /api/public-profile/:publicProfileId/visibility");
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
	const errorLoggingMiddleware = HttpMiddleware.make((app) =>
		HttpMiddleware.logger(app).pipe(
			Effect.tap((response) =>
				Effect.gen(function* () {
					if (response.status >= 500) {
						const request = yield* HttpServerRequest.HttpServerRequest;
						const bodyText =
							response.body._tag === "Uint8Array"
								? new TextDecoder().decode(response.body.body)
								: response.body._tag;
						logger.error(`Server error ${response.status}: ${request.method} ${request.url}`, {
							status: response.status,
							method: request.method,
							url: request.url,
							responseBody: bodyText,
						});
					}
				}),
			),
			Effect.tapErrorCause((cause) =>
				Effect.sync(() => logger.error(`Unhandled server error: ${Cause.pretty(cause)}`)),
			),
		),
	);

	const HttpLive = HttpApiBuilder.serve(errorLoggingMiddleware).pipe(
		Layer.provide(ApiLayer),
		Layer.provide(
			NodeHttpServer.layer(createCustomServerFactory(auth, config.betterAuthUrl, config.frontendUrl), {
				port: config.port,
			}),
		),
		Layer.provide(ServiceLayers),
		Layer.provide(InfrastructureLayer),
	);

	// Start portrait generation worker fiber (takes from queue, runs LLM generation)
	// Worker inherits PortraitJobQueue + LoggerRepository from main's scope (InfrastructureLayer).
	// Only provide ServiceLayers for repository access (repos not in main's scope).
	yield* Effect.forkDaemon(portraitGenerationWorker.pipe(Effect.provide(ServiceLayers)));

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
