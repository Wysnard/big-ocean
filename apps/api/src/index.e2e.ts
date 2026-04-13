/**
 * Big Ocean API Server — E2E Test Entrypoint
 *
 * Independent composition root for E2E testing.
 * Mirrors index.ts but swaps LLM layers for mocks and uses sandbox Resend.
 * Payment webhooks handled by Better Auth plugin (not an Effect layer).
 * No MOCK_LLM env var — layer selection is structural, not conditional.
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
	ConversanalyzerMockRepositoryLive,
	ConversationEvidenceDrizzleRepositoryLive,
	CostGuardRedisRepositoryLive,
	DailyCheckInDrizzleRepositoryLive,
	DatabaseStack,
	ExchangeDrizzleRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
	LifecycleEmailDrizzleRepositoryLive,
	PortraitDrizzleRepositoryLive,
	PortraitGeneratorMockRepositoryLive,
	PortraitRatingDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	PurchaseEventDrizzleRepositoryLive,
	PushNotificationQueueDrizzleRepositoryLive,
	PushSubscriptionDrizzleRepositoryLive,
	QrTokenDrizzleRepositoryLive,
	RelationshipAnalysisDrizzleRepositoryLive,
	RelationshipAnalysisGeneratorMockRepositoryLive,
	ResendEmailResendRepositoryLive,
	WaitlistDrizzleRepositoryLive,
	WebPushFetchRepositoryLive,
} from "@workspace/infrastructure";
import { ConversationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/conversation.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { MessageDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/message.drizzle.repository";
import { NerinActorMockRepositoryLive } from "@workspace/infrastructure/repositories/nerin-actor.mock.repository";
import { NerinAgentMockRepositoryLive } from "@workspace/infrastructure/repositories/nerin-agent.mock.repository";
import { NerinDirectorMockRepositoryLive } from "@workspace/infrastructure/repositories/nerin-director.mock.repository";
import { RedisIoRedisRepositoryLive } from "@workspace/infrastructure/repositories/redis.ioredis.repository";
import { UserAccountDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/user-account.drizzle.repository";
import { Cause, Context, Effect, Layer, Queue } from "effect";
import { AccountGroupLive } from "./handlers/account";
import { ConversationGroupLive } from "./handlers/conversation";
import { EmailGroupLive } from "./handlers/email";
import { EvidenceGroupLive } from "./handlers/evidence";
import { HealthGroupLive } from "./handlers/health";
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
 */

const BaseServices = Layer.mergeAll(AppConfigLive, LoggerPinoRepositoryLive);

const DatabaseServices = DatabaseStack.pipe(Layer.provide(AppConfigLive));

// Portrait job queue — shared between webhook (offer) and worker fiber (take)
const PortraitJobQueueLive = Layer.effect(PortraitJobQueue, Queue.unbounded<PortraitJob>());

const AuthServices = BetterAuthLive.pipe(
	Layer.provide(LoggerPinoRepositoryLive),
	Layer.provide(AppConfigLive),
	Layer.provide(PortraitJobQueueLive),
);

const InfrastructureLayer = Layer.mergeAll(
	BaseServices,
	DatabaseServices,
	AuthServices,
	PortraitJobQueueLive,
);

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
 * Repository Layers
 *
 * Layers swapped for E2E:
 * - NerinAgentMockRepositoryLive (was: NerinAgentAnthropicRepositoryLive) — mock
 * - ConversanalyzerMockRepositoryLive (was: ConversanalyzerAnthropicRepositoryLive) — mock
 * - PortraitGeneratorMockRepositoryLive (was: PortraitGeneratorClaudeRepositoryLive) — mock
 * - RelationshipAnalysisGeneratorMockRepositoryLive (was: ...AnthropicRepositoryLive) — mock
 * - ResendEmailResendRepositoryLive — LIVE (sandbox API key via .env.e2e)
 *
 * PaymentGateway removed — webhook handling is in Better Auth plugin, not Effect layer.
 */
const SessionRepoLayer = ConversationDrizzleRepositoryLive.pipe(Layer.provide(RedisLayer));

const RepositoryLayers = Layer.mergeAll(
	SessionRepoLayer,
	MessageDrizzleRepositoryLive,
	ExchangeDrizzleRepositoryLive,
	AssessmentResultDrizzleRepositoryLive,
	ConversationEvidenceDrizzleRepositoryLive,
	LifecycleEmailDrizzleRepositoryLive,
	ConversanalyzerMockRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
	NerinActorMockRepositoryLive,
	NerinAgentMockRepositoryLive,
	NerinDirectorMockRepositoryLive,
	CostGuardLayer,
	PortraitGeneratorMockRepositoryLive,
	PortraitDrizzleRepositoryLive,
	PortraitRatingDrizzleRepositoryLive,
	PurchaseEventDrizzleRepositoryLive,
	DailyCheckInDrizzleRepositoryLive,
	PushNotificationQueueDrizzleRepositoryLive,
	PushSubscriptionDrizzleRepositoryLive,
	RelationshipAnalysisDrizzleRepositoryLive,
	RelationshipAnalysisGeneratorMockRepositoryLive,
	QrTokenDrizzleRepositoryLive,
	UserAccountDrizzleRepositoryLive,
	WaitlistDrizzleRepositoryLive,
	ResendEmailResendRepositoryLive,
	WebPushFetchRepositoryLive,
);

/**
 * Service Layers - combines infrastructure with repositories
 */
const ServiceLayers = RepositoryLayers.pipe(Layer.provide(InfrastructureLayer));

/**
 * Auth Middleware Layer
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
	LoggerPinoRepositoryLive,
);

/**
 * API Layer
 */
const ApiLive = HttpApiBuilder.api(BigOceanApi).pipe(
	Layer.provide(HttpGroupsLive),
	Layer.provide(AuthMiddlewareLayer),
);

const ApiLayer = Layer.mergeAll(
	ApiLive,
	HttpApiBuilder.Router.Live,
	HttpApiBuilder.Middleware.layer,
);

/**
 * CORS + Better Auth integration (identical to production)
 */
function wrapServerWithCorsAndAuth(
	server: Server,
	auth: Context.Tag.Service<typeof BetterAuthService>,
	betterAuthUrl: string,
	frontendUrl: string,
): void {
	const betterAuthHandler = createBetterAuthHandler(auth, betterAuthUrl, frontendUrl);

	const originalEmit = server.emit.bind(server);

	server.emit = ((event: string, ...args: any[]): boolean => {
		if (event === "request") {
			const [req, res] = args as [IncomingMessage, ServerResponse];

			betterAuthHandler(req, res).then(() => {
				if (!res.writableEnded && !res.headersSent) {
					originalEmit("request", req, res);
				}
			});

			return true;
		}

		return originalEmit(event, ...args);
	}) as any;
}

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
 * Startup logging (E2E mode)
 */
const logStartup = (port: number, frontendUrl: string) =>
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		logger.info(`Starting Big Ocean API server on port ${port} [E2E MODE]`);
		logger.info("");
		logger.info("E2E layers:");
		logger.info("  - Nerin Agent (mock)");
		logger.info("  - ConversAnalyzer (mock)");
		logger.info("  - Portrait Generator (mock)");
		logger.info("  - Relationship Analysis Generator (mock)");
		logger.info("  - Resend Email (sandbox)");
		logger.info("");
		logger.info(`CORS origin: ${frontendUrl}`);
	});

/**
 * Main program
 */
const main = Effect.gen(function* () {
	const config = yield* AppConfig;
	const auth = yield* BetterAuthService;
	const logger = yield* LoggerRepository;

	yield* logStartup(config.port, config.frontendUrl);

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

	// Start portrait generation worker fiber
	yield* Effect.forkDaemon(portraitGenerationWorker.pipe(Effect.provide(ServiceLayers)));

	logger.info("Launching HTTP server...");

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
