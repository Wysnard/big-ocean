/**
 * Generate QR Token Use Case Tests (Story 34-1)
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/qr-token.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/assessment-session.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { AppConfig, AssessmentSessionRepository, QrTokenRepository } from "@workspace/domain";
import {
	AssessmentSessionDrizzleRepositoryLive,
	_resetMockState as resetSessionMock,
} from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import {
	_resetMockState,
	QrTokenDrizzleRepositoryLive,
} from "@workspace/infrastructure/repositories/qr-token.drizzle.repository";
import { Effect, Layer } from "effect";
import { generateQrToken } from "../generate-qr-token.use-case";

const TEST_USER_ID = "user-123";
const TEST_FRONTEND_URL = "http://localhost:3000";

const TestAppConfig = Layer.succeed(
	AppConfig,
	AppConfig.of({
		port: 4000,
		databaseUrl: "test",
		redisUrl: "test",
		anthropicApiKey: "test",
		frontendUrl: TEST_FRONTEND_URL,
		betterAuthSecret: "test",
		betterAuthUrl: "http://localhost:4000",
		dailyCostLimitCents: 10000,
		rateLimitMaxRequests: 10,
		sessionCostLimitCents: 2000,
		polarAccessToken: "test",
		polarWebhookSecret: "test",
		polarPortraitProductId: "test",
		polarCreditProductId: "test",
		polarCreditPackProductId: "test",
		polarExtensionProductId: "test",
		resendApiKey: "test",
		emailFromAddress: "test@test.com",
		globalDailyAssessmentLimit: 100,
	}),
);

const TestLayer = Layer.mergeAll(
	QrTokenDrizzleRepositoryLive,
	AssessmentSessionDrizzleRepositoryLive,
	TestAppConfig,
);

describe("generateQrToken Use Case (Story 34-1)", () => {
	beforeEach(() => {
		_resetMockState();
		resetSessionMock();
	});

	/** Helper: seed a completed assessment session for the given user */
	const seedCompletedSession = (userId: string) =>
		Effect.gen(function* () {
			const sessionRepo = yield* AssessmentSessionRepository;
			const session = yield* sessionRepo.createSession(userId);
			yield* sessionRepo.updateSession(session.sessionId, { status: "completed" });
		});

	it.effect("generates a new QR token with share URL", () =>
		Effect.gen(function* () {
			yield* seedCompletedSession(TEST_USER_ID);
			const result = yield* generateQrToken(TEST_USER_ID);

			expect(result.token).toBeDefined();
			expect(result.shareUrl).toContain(TEST_FRONTEND_URL);
			expect(result.shareUrl).toContain("/relationship/qr/");
			expect(result.expiresAt).toBeInstanceOf(Date);
			expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("expires existing active token before generating new one", () =>
		Effect.gen(function* () {
			yield* seedCompletedSession(TEST_USER_ID);
			const qrRepo = yield* QrTokenRepository;

			// Generate first token
			const first = yield* generateQrToken(TEST_USER_ID);

			// Get its status before regeneration
			const firstStatus = yield* qrRepo.getStatus(first.token);
			expect(firstStatus).toBe("valid");

			// Generate second token — should expire the first
			const second = yield* generateQrToken(TEST_USER_ID);
			expect(second.token).not.toBe(first.token);

			// First token should be expired now
			const firstStatusAfter = yield* qrRepo.getStatus(first.token);
			expect(firstStatusAfter).toBe("expired");

			// Second token should be valid
			const secondStatus = yield* qrRepo.getStatus(second.token);
			expect(secondStatus).toBe("valid");
		}).pipe(Effect.provide(TestLayer)),
	);
});
