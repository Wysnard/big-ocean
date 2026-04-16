/**
 * Check Check-in Use Case Tests (Story 38-1)
 *
 * Verifies Nerin check-in email logic:
 * - Finds completed sessions and sends check-in emails
 * - One-shot enforcement (no duplicate emails)
 * - Fire-and-forget (email failures don't propagate)
 * - Theme derivation from exchange data with assessment-result fallback
 */
import { beforeEach, vi } from "vitest";

vi.mock("@workspace/domain/config/app-config");
vi.mock("@workspace/infrastructure/repositories/assessment-result.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/conversation.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/exchange.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/resend-email.resend.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { describe, expect, it } from "@effect/vitest";
import {
	AppConfig,
	type AppConfigService,
	ConversationRepository,
	ExchangeRepository,
	ResendEmailRepository,
} from "@workspace/domain";
import {
	_seedResult,
	AssessmentResultDrizzleRepositoryLive,
	_resetMockState as resetAssessmentResultMockState,
} from "@workspace/infrastructure/repositories/assessment-result.drizzle.repository";
import {
	ConversationDrizzleRepositoryLive,
	_resetMockState as resetConversationMockState,
} from "@workspace/infrastructure/repositories/conversation.drizzle.repository";
import {
	ExchangeDrizzleRepositoryLive,
	_resetMockState as resetExchangeMockState,
} from "@workspace/infrastructure/repositories/exchange.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import {
	_getSentEmails,
	ResendEmailResendRepositoryLive,
	_resetMockState as resetEmailMockState,
} from "@workspace/infrastructure/repositories/resend-email.resend.repository";
import { Effect, Layer, Redacted } from "effect";
import { checkCheckIn } from "../check-check-in.use-case";

const mockConfig: AppConfigService = {
	databaseUrl: "postgresql://test:test@localhost:5432/test",
	redisUrl: "redis://localhost:6379",
	anthropicApiKey: Redacted.make("test-api-key"),
	betterAuthSecret: Redacted.make("test-secret"),
	betterAuthUrl: "http://localhost:4000",
	frontendUrl: "http://localhost:3000",
	port: 4000,
	nodeEnv: "test",
	analyzerModelId: "claude-sonnet-4-20250514",
	analyzerMaxTokens: 2048,
	analyzerTemperature: 0.3,
	portraitModelId: "claude-sonnet-4-6",
	portraitMaxTokens: 16000,
	portraitTemperature: 0.7,
	dailyCostLimit: 75,
	nerinModelId: "claude-haiku-4-5-20251001",
	nerinMaxTokens: 1024,
	nerinTemperature: 0.7,
	assessmentTurnCount: 15,
	portraitWaitMinMs: 2000,
	shareMinConfidence: 70,
	conversanalyzerModelId: "claude-haiku-4-5-20251001",
	portraitGeneratorModelId: "claude-sonnet-4-6",
	messageRateLimit: 2,
	polarAccessToken: Redacted.make("test-polar-access-token"),
	polarWebhookSecret: Redacted.make("test-polar-webhook-secret"),
	polarProductPortraitUnlock: "polar_product_portrait",
	polarProductRelationshipSingle: "polar_product_single",
	polarProductRelationship5Pack: "polar_product_5pack",
	polarProductExtendedConversation: "polar_product_extended",
	globalDailyAssessmentLimit: 100,
	minEvidenceWeight: 0.36,
	resendApiKey: Redacted.make("test-resend-api-key"),
	emailFromAddress: "noreply@test.bigocean.dev",
	dropOffThresholdHours: 24,
	checkInThresholdDays: 14,
	subscriptionNudgeThresholdDays: 21,
	sessionCostLimitCents: 2000,
	nerinDirectorModelId: "claude-haiku-4-5-20251001",
	nerinDirectorMaxTokens: 1024,
	nerinDirectorTemperature: 0.7,
	nerinDirectorRetryTemperature: 0.9,
	cronSecret: Redacted.make(""),
};

const TestConfigLayer = Layer.succeed(AppConfig, mockConfig);

describe("checkCheckIn use-case", () => {
	beforeEach(() => {
		resetAssessmentResultMockState();
		resetConversationMockState();
		resetExchangeMockState();
		resetEmailMockState();
	});

	const BaseTestLayer = Layer.mergeAll(
		AssessmentResultDrizzleRepositoryLive,
		ConversationDrizzleRepositoryLive,
		ExchangeDrizzleRepositoryLive,
		ResendEmailResendRepositoryLive,
		LoggerPinoRepositoryLive,
		TestConfigLayer,
	);

	it.effect("returns 0 when no check-in eligible sessions exist", () =>
		Effect.gen(function* () {
			const result = yield* checkCheckIn;
			expect(result.emailsSent).toBe(0);
		}).pipe(Effect.provide(BaseTestLayer)),
	);

	it.effect("derives the check-in theme from the latest exchange and enforces one-shot sends", () =>
		Effect.gen(function* () {
			const sessionRepo = yield* ConversationRepository;
			const exchangeRepo = yield* ExchangeRepository;

			const { sessionId } = yield* sessionRepo.createSession("user-456");
			yield* sessionRepo.updateSession(sessionId, {
				status: "completed",
				userId: "user-456",
				userEmail: "alice@example.com",
				userName: "Alice",
			} as any);

			const exchange = yield* exchangeRepo.create(sessionId, 1);
			yield* exchangeRepo.update(exchange.id, {
				directorOutput: "Explore creative pursuits",
				coverageTargets: {
					primaryFacet: "imagination",
					candidateDomains: ["relationships"],
				},
			});

			const result = yield* checkCheckIn;
			const sentEmails = _getSentEmails();

			expect(result.emailsSent).toBe(1);
			expect(sentEmails).toHaveLength(1);
			expect(sentEmails[0]?.html).toContain("how imagination shows up in your close relationships");
			expect(sentEmails[0]?.html).toContain("/me");

			const secondRun = yield* checkCheckIn;
			expect(secondRun.emailsSent).toBe(0);
		}).pipe(Effect.provide(BaseTestLayer)),
	);

	it.effect("falls back to persisted assessment context when exchange context is missing", () =>
		Effect.gen(function* () {
			const sessionRepo = yield* ConversationRepository;
			const { sessionId } = yield* sessionRepo.createSession("user-789");
			yield* sessionRepo.updateSession(sessionId, {
				status: "completed",
				userId: "user-789",
			} as any);

			_seedResult(sessionId, {
				stage: "completed",
				traits: {
					openness: { score: 88, confidence: 92 },
				} as any,
				domainCoverage: {
					health: 0.72,
				} as any,
			});

			const result = yield* checkCheckIn;
			const sentEmails = _getSentEmails();

			expect(result.emailsSent).toBe(1);
			expect(sentEmails[0]?.html).toContain(
				"how your openness keeps shaping your energy and self-care",
			);
		}).pipe(Effect.provide(BaseTestLayer)),
	);

	it.effect("handles email send failure gracefully (fail-open)", () => {
		const failingEmailLayer = Layer.succeed(
			ResendEmailRepository,
			ResendEmailRepository.of({
				sendEmail: () => Effect.fail({ _tag: "EmailError", message: "Resend API down" } as any),
			}),
		);

		const testLayer = Layer.mergeAll(
			AssessmentResultDrizzleRepositoryLive,
			ConversationDrizzleRepositoryLive,
			ExchangeDrizzleRepositoryLive,
			failingEmailLayer,
			LoggerPinoRepositoryLive,
			TestConfigLayer,
		);

		return Effect.gen(function* () {
			const sessionRepo = yield* ConversationRepository;
			const { sessionId } = yield* sessionRepo.createSession("user-999");
			yield* sessionRepo.updateSession(sessionId, {
				status: "completed",
				userId: "user-999",
			} as any);

			const result = yield* checkCheckIn;
			expect(result.emailsSent).toBe(0);
		}).pipe(Effect.provide(testLayer));
	});
});
