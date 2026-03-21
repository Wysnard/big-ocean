/**
 * Generate QR Token Use Case Tests (Story 34-1)
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/qr-token.drizzle.repository");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { AppConfig, QrTokenRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import { generateQrToken } from "../generate-qr-token.use-case";
import {
	QrTokenDrizzleRepositoryLive,
	_resetMockState,
} from "@workspace/infrastructure/repositories/qr-token.drizzle.repository";

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

const TestLayer = Layer.mergeAll(QrTokenDrizzleRepositoryLive, TestAppConfig);

describe("generateQrToken Use Case (Story 34-1)", () => {
	beforeEach(() => {
		_resetMockState();
	});

	it.effect("generates a new QR token with share URL", () =>
		Effect.gen(function* () {
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
