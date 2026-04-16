/**
 * Free-tier cost circuit breaker (Story 11-1)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AppConfig,
	CostGuardRepository,
	LoggerRepository,
	PurchaseEventRepository,
	RedisOperationError,
	WeeklySummaryRepository,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { vi } from "vitest";
import { evaluateFreeTierCostCircuitBreaker } from "../evaluate-free-tier-cost-circuit-breaker.use-case";

const mockWeekly = {
	listGeneratedCostsSince: vi.fn(),
};

const mockPurchase = {
	getEventsByUserId: vi.fn(),
};

const mockCostGuard = {
	getFreeTierLlmPaused: vi.fn(),
	setFreeTierLlmPaused: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
};

/** Minimal AppConfig for this use case (avoid deep imports from infrastructure package). */
const breakerTestConfig = {
	frontendUrl: "https://bigocean.dev",
	databaseUrl: "",
	redisUrl: "",
	anthropicApiKey: Redacted.make("test"),
	betterAuthSecret: Redacted.make("test"),
	betterAuthUrl: "",
	port: 4000,
	nodeEnv: "test",
	analyzerModelId: "",
	analyzerMaxTokens: 0,
	analyzerTemperature: 0,
	portraitModelId: "",
	portraitMaxTokens: 0,
	portraitTemperature: 0,
	nerinModelId: "",
	nerinMaxTokens: 0,
	nerinTemperature: 0,
	dailyCostLimit: 0,
	assessmentTurnCount: 0,
	portraitWaitMinMs: 0,
	shareMinConfidence: 0,
	conversanalyzerModelId: "",
	portraitGeneratorModelId: "",
	messageRateLimit: 0,
	polarAccessToken: Redacted.make("test"),
	polarWebhookSecret: Redacted.make("test"),
	polarProductPortraitUnlock: "",
	polarProductRelationshipSingle: "",
	polarProductRelationship5Pack: "",
	polarProductExtendedConversation: "",
	polarProductSubscription: "",
	globalDailyAssessmentLimit: 0,
	minEvidenceWeight: 0,
	resendApiKey: Redacted.make("test"),
	emailFromAddress: "noreply@example.com",
	dropOffThresholdHours: 24,
	checkInThresholdDays: 14,
	subscriptionNudgeThresholdDays: 21,
	recaptureThresholdDays: 3,
	sessionCostLimitCents: 2000,
	weeklyLetterExpectedCostCents: 10,
	costCeilingActiveUsersEstimate: 700,
	costCircuitBreakerMultiplier: 3,
	costGuardRetryAfterSeconds: 900,
	pushVapidPublicKey: undefined,
	pushVapidPrivateKey: undefined,
	pushVapidSubject: undefined,
	nerinDirectorModelId: "",
	nerinDirectorMaxTokens: 0,
	nerinDirectorTemperature: 0,
	nerinDirectorRetryTemperature: 0,
	cronSecret: Redacted.make(""),
} as const;

const testLayer = (configOverrides: Record<string, unknown> = {}) =>
	Layer.mergeAll(
		Layer.succeed(AppConfig, { ...breakerTestConfig, ...configOverrides } as never),
		Layer.succeed(WeeklySummaryRepository, mockWeekly),
		Layer.succeed(PurchaseEventRepository, mockPurchase),
		Layer.succeed(CostGuardRepository, mockCostGuard),
		Layer.succeed(LoggerRepository, mockLogger),
	);

describe("evaluateFreeTierCostCircuitBreaker", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockWeekly.listGeneratedCostsSince.mockReturnValue(Effect.succeed([]));
		mockPurchase.getEventsByUserId.mockReturnValue(Effect.succeed([]));
		mockCostGuard.getFreeTierLlmPaused.mockReturnValue(Effect.succeed(false));
		mockCostGuard.setFreeTierLlmPaused.mockReturnValue(Effect.void);
	});

	it.effect("sets pause when free-tier 24h spend exceeds threshold", () =>
		Effect.gen(function* () {
			mockWeekly.listGeneratedCostsSince.mockReturnValue(
				Effect.succeed([
					{ userId: "u1", llmCostCents: 2000 },
					{ userId: "u2", llmCostCents: 1500 },
				]),
			);
			mockCostGuard.getFreeTierLlmPaused
				.mockReturnValueOnce(Effect.succeed(false))
				.mockReturnValueOnce(Effect.succeed(true));

			const out = yield* evaluateFreeTierCostCircuitBreaker({}).pipe(Effect.provide(testLayer()));

			expect(out.actualCost24hCents).toBe(3500);
			expect(out.thresholdCents).toBe(3000);
			expect(out.freeTierLlmPaused).toBe(true);
			expect(mockCostGuard.setFreeTierLlmPaused).toHaveBeenCalledWith(true);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				"cost_circuit_breaker_tripped",
				expect.objectContaining({ event: "cost_circuit_breaker_tripped" }),
			);
		}),
	);

	it.effect("fails Unauthorized when cron secret mismatches", () =>
		Effect.gen(function* () {
			const err = yield* evaluateFreeTierCostCircuitBreaker({
				cronSecretHeader: "bad",
			}).pipe(
				Effect.provide(
					testLayer({
						cronSecret: Redacted.make("good"),
					}),
				),
				Effect.flip,
			);
			expect(err._tag).toBe("Unauthorized");
		}),
	);

	it.effect("fail-open: Redis errors on pause read are treated as not paused", () =>
		Effect.gen(function* () {
			mockWeekly.listGeneratedCostsSince.mockReturnValue(Effect.succeed([]));
			mockCostGuard.getFreeTierLlmPaused.mockReturnValue(
				Effect.fail(new RedisOperationError("redis down")),
			);

			const out = yield* evaluateFreeTierCostCircuitBreaker({}).pipe(Effect.provide(testLayer()));

			expect(out.freeTierLlmPaused).toBe(false);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				"Redis unavailable reading free_tier_llm_paused — fail-open",
				expect.objectContaining({ message: "redis down" }),
			);
		}),
	);

	it.effect("clears pause when spend drops below hysteresis band", () =>
		Effect.gen(function* () {
			mockWeekly.listGeneratedCostsSince.mockReturnValue(Effect.succeed([]));
			mockCostGuard.getFreeTierLlmPaused
				.mockReturnValueOnce(Effect.succeed(true))
				.mockReturnValueOnce(Effect.succeed(false));

			const out = yield* evaluateFreeTierCostCircuitBreaker({}).pipe(Effect.provide(testLayer()));

			expect(out.freeTierLlmPaused).toBe(false);
			expect(mockCostGuard.setFreeTierLlmPaused).toHaveBeenCalledWith(false);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"cost_circuit_breaker_cleared",
				expect.objectContaining({ event: "cost_circuit_breaker_cleared" }),
			);
		}),
	);

	it.effect("does not log tripped when Redis SET fails (fail-open)", () =>
		Effect.gen(function* () {
			mockWeekly.listGeneratedCostsSince.mockReturnValue(
				Effect.succeed([
					{ userId: "u1", llmCostCents: 2000 },
					{ userId: "u2", llmCostCents: 1500 },
				]),
			);
			mockCostGuard.getFreeTierLlmPaused
				.mockReturnValueOnce(Effect.succeed(false))
				.mockReturnValueOnce(Effect.succeed(false));
			mockCostGuard.setFreeTierLlmPaused.mockReturnValue(
				Effect.fail(new RedisOperationError("SET failed")),
			);

			const out = yield* evaluateFreeTierCostCircuitBreaker({}).pipe(Effect.provide(testLayer()));

			expect(out.freeTierLlmPaused).toBe(false);
			expect(
				mockLogger.warn.mock.calls.some((call) => call[0] === "cost_circuit_breaker_tripped"),
			).toBe(false);
		}),
	);
});
