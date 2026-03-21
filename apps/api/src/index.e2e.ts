/**
 * Big Ocean API Server — E2E Test Entrypoint
 *
 * Independent composition root for E2E testing.
 * Mirrors index.ts but swaps LLM, email, and payment layers for mocks.
 * No MOCK_LLM env var — mock selection is structural, not conditional.
 */

import "dotenv/config";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { HttpApiBuilder, HttpMiddleware, HttpServerRequest } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { BigOceanApi } from "@workspace/contracts";
import { AppConfig } from "@workspace/domain";
import { LoggerRepository } from "@workspace/domain/repositories/logger.repository";
import {
	AppConfigLive,
	AssessmentExchangeDrizzleRepositoryLive,
	AssessmentResultDrizzleRepositoryLive,
	BetterAuthLive,
	BetterAuthService,
	ConversanalyzerMockRepositoryLive,
	ConversationEvidenceDrizzleRepositoryLive,
	CostGuardRedisRepositoryLive,
	DatabaseStack,
	FacetEvidenceDrizzleRepositoryLive,
	PaymentGatewayMockRepositoryLive,
	PortraitDrizzleRepositoryLive,
	PortraitGeneratorMockRepositoryLive,
	PortraitRatingDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	PurchaseEventDrizzleRepositoryLive,
	QrTokenDrizzleRepositoryLive,
	RelationshipAnalysisDrizzleRepositoryLive,
	RelationshipAnalysisGeneratorMockRepositoryLive,
	ResendEmailMockRepositoryLive,
	WaitlistDrizzleRepositoryLive,
} from "@workspace/infrastructure";
import { AssessmentMessageDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/assessment-message.drizzle.repository";
import { AssessmentSessionDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import { NerinAgentMockRepositoryLive } from "@workspace/infrastructure/repositories/nerin-agent.mock.repository";
import { RedisIoRedisRepositoryLive } from "@workspace/infrastructure/repositories/redis.ioredis.repository";
import { UserAccountDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/user-account.drizzle.repository";
import { Cause, Context, Effect, Layer } from "effect";
import { AccountGroupLive } from "./handlers/account";
import { AssessmentGroupLive } from "./handlers/assessment";
import { EmailGroupLive } from "./handlers/email";
import { EvidenceGroupLive } from "./handlers/evidence";
import { HealthGroupLive } from "./handlers/health";
import { PortraitGroupLive } from "./handlers/portrait";
import { ProfileGroupLive } from "./handlers/profile";
import { PurchaseGroupLive } from "./handlers/purchase";
import { QrTokenGroupLive } from "./handlers/qr-token";
import { RelationshipGroupLive } from "./handlers/relationship";
import { WaitlistGroupLive } from "./handlers/waitlist";
import { AuthMiddlewareLive, OptionalAuthMiddlewareLive } from "./middleware/auth.middleware";
import { createBetterAuthHandler } from "./middleware/better-auth";

/**
 * Infrastructure Layer - Config, Database, Auth, Logger
 */

const BaseServices = Layer.mergeAll(AppConfigLive, LoggerPinoRepositoryLive);

const DatabaseServices = DatabaseStack.pipe(Layer.provide(AppConfigLive));

const AuthServices = BetterAuthLive.pipe(
	Layer.provide(LoggerPinoRepositoryLive),
	Layer.provide(AppConfigLive),
);

const InfrastructureLayer = Layer.mergeAll(BaseServices, DatabaseServices, AuthServices);

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
 * Mock layers swapped for E2E:
 * - NerinAgentMockRepositoryLive (was: NerinAgentAnthropicRepositoryLive)
 * - ConversanalyzerMockRepositoryLive (was: ConversanalyzerAnthropicRepositoryLive)
 * - PortraitGeneratorMockRepositoryLive (was: PortraitGeneratorClaudeRepositoryLive)
 * - RelationshipAnalysisGeneratorMockRepositoryLive (was: ...AnthropicRepositoryLive)
 * - ResendEmailMockRepositoryLive (was: ResendEmailResendRepositoryLive)
 * - PaymentGatewayMockRepositoryLive (was: PaymentGatewayPolarRepositoryLive)
 */
const SessionRepoLayer = AssessmentSessionDrizzleRepositoryLive.pipe(Layer.provide(RedisLayer));

const RepositoryLayers = Layer.mergeAll(
	SessionRepoLayer,
	AssessmentMessageDrizzleRepositoryLive,
	AssessmentExchangeDrizzleRepositoryLive,
	AssessmentResultDrizzleRepositoryLive,
	ConversationEvidenceDrizzleRepositoryLive,
	ConversanalyzerMockRepositoryLive,
	PublicProfileDrizzleRepositoryLive,
	ProfileAccessLogDrizzleRepositoryLive,
	FacetEvidenceDrizzleRepositoryLive,
	NerinAgentMockRepositoryLive,
	CostGuardLayer,
	PortraitGeneratorMockRepositoryLive,
	PortraitDrizzleRepositoryLive,
	PortraitRatingDrizzleRepositoryLive,
	PaymentGatewayMockRepositoryLive,
	PurchaseEventDrizzleRepositoryLive,
	RelationshipAnalysisDrizzleRepositoryLive,
	RelationshipAnalysisGeneratorMockRepositoryLive,
	QrTokenDrizzleRepositoryLive,
	UserAccountDrizzleRepositoryLive,
	WaitlistDrizzleRepositoryLive,
	ResendEmailMockRepositoryLive,
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
	AssessmentGroupLive,
	ProfileGroupLive,
	PortraitGroupLive,
	EvidenceGroupLive,
	PurchaseGroupLive,
	QrTokenGroupLive,
	RelationshipGroupLive,
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
		logger.info("Mock layers active:");
		logger.info("  - Nerin Agent (mock)");
		logger.info("  - ConversAnalyzer (mock)");
		logger.info("  - Portrait Generator (mock)");
		logger.info("  - Relationship Analysis Generator (mock)");
		logger.info("  - Resend Email (mock)");
		logger.info("  - Payment Gateway (mock)");
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
