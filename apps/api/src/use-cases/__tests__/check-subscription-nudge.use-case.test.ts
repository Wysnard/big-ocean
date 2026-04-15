import { beforeEach, vi } from "vitest";

vi.mock("@workspace/domain/config/app-config");
vi.mock("@workspace/infrastructure/repositories/lifecycle-email.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/resend-email.resend.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import { describe, expect, it } from "@effect/vitest";
import { DatabaseError } from "@workspace/contracts/errors";
import {
	AppConfig,
	type AppConfigService,
	LifecycleEmailRepository,
	ResendEmailRepository,
} from "@workspace/domain";
import {
	_seedEligibleUser,
	LifecycleEmailDrizzleRepositoryLive,
	_resetMockState as resetLifecycleEmailMockState,
} from "@workspace/infrastructure/repositories/lifecycle-email.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";
import {
	_getSentEmails,
	ResendEmailResendRepositoryLive,
	_resetMockState as resetEmailMockState,
} from "@workspace/infrastructure/repositories/resend-email.resend.repository";
import { Effect, Layer, Redacted } from "effect";
import { checkSubscriptionNudge } from "../check-subscription-nudge.use-case";

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

describe("checkSubscriptionNudge use-case", () => {
	beforeEach(() => {
		resetLifecycleEmailMockState();
		resetEmailMockState();
	});

	const BaseTestLayer = Layer.mergeAll(
		LifecycleEmailDrizzleRepositoryLive,
		ResendEmailResendRepositoryLive,
		LoggerPinoRepositoryLive,
		TestConfigLayer,
	);

	it.effect("returns 0 when no subscription nudge eligible users exist", () =>
		Effect.gen(function* () {
			const result = yield* checkSubscriptionNudge;
			expect(result.emailsSent).toBe(0);
		}).pipe(Effect.provide(BaseTestLayer)),
	);

	it.effect("sends the subscription nudge once and points the CTA to /me", () =>
		Effect.gen(function* () {
			_seedEligibleUser("user-789", {
				userEmail: "alice@example.com",
				userName: "Alice",
				returnVisitCount: 4,
				relationshipLetterCount: 1,
			});

			const result = yield* checkSubscriptionNudge;
			const sentEmails = _getSentEmails();

			expect(result.emailsSent).toBe(1);
			expect(sentEmails).toHaveLength(1);
			expect(sentEmails[0]?.subject).toBe("I have more I want to say about what comes next");
			expect(sentEmails[0]?.html).toContain("deeper weekly letters");
			expect(sentEmails[0]?.html).toContain("http://localhost:3000/me");

			const secondRun = yield* checkSubscriptionNudge;
			expect(secondRun.emailsSent).toBe(0);
		}).pipe(Effect.provide(BaseTestLayer)),
	);

	it.effect("handles email send failure gracefully (fail-open)", () =>
		Effect.gen(function* () {
			_seedEligibleUser("user-999");

			const failingEmailLayer = Layer.succeed(
				ResendEmailRepository,
				ResendEmailRepository.of({
					sendEmail: () => Effect.fail({ _tag: "EmailError", message: "Resend API down" } as any),
				}),
			);

			const testLayer = Layer.mergeAll(
				LifecycleEmailDrizzleRepositoryLive,
				failingEmailLayer,
				LoggerPinoRepositoryLive,
				TestConfigLayer,
			);

			const result = yield* checkSubscriptionNudge.pipe(Effect.provide(testLayer));
			expect(result.emailsSent).toBe(0);
		}),
	);

	it.effect("skips user when mark fails (marked === false branch)", () =>
		Effect.gen(function* () {
			_seedEligibleUser("user-mark-fail", {
				userEmail: "mark-fail@example.com",
				userName: "MarkFail",
			});

			const failingMarkLayer = Layer.succeed(
				LifecycleEmailRepository,
				LifecycleEmailRepository.of({
					findSubscriptionNudgeEligibleUsers: (_thresholdDays: number) =>
						Effect.succeed([
							{
								userId: "user-mark-fail",
								userEmail: "mark-fail@example.com",
								userName: "MarkFail",
								returnVisitCount: 5,
								relationshipLetterCount: 1,
							},
						]),
					markSubscriptionNudgeEmailSent: (_userId: string) =>
						Effect.fail(new DatabaseError({ message: "Simulated mark failure" })),
				}),
			);

			const testLayer = Layer.mergeAll(
				failingMarkLayer,
				ResendEmailResendRepositoryLive,
				LoggerPinoRepositoryLive,
				TestConfigLayer,
			);

			const result = yield* checkSubscriptionNudge.pipe(Effect.provide(testLayer));
			const sentEmails = _getSentEmails();
			expect(result.emailsSent).toBe(0);
			expect(sentEmails).toHaveLength(0);
		}),
	);

	it.effect("excludes users who already received the nudge (already-marked)", () =>
		Effect.gen(function* () {
			_seedEligibleUser("user-already-marked", {
				subscriptionNudgeEmailSentAt: new Date(),
			});

			const result = yield* checkSubscriptionNudge;
			expect(result.emailsSent).toBe(0);
		}).pipe(Effect.provide(BaseTestLayer)),
	);
});
