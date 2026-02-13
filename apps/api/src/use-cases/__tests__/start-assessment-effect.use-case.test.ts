/**
 * Start Assessment Use Case Tests (Migrated to @effect/vitest)
 *
 * Tests for the startAssessment business logic using @effect/vitest.
 * Demonstrates proper Effect testing patterns with test Layers.
 */

import { it } from "@effect/vitest";
import {
	AssessmentSessionRepository,
	GREETING_MESSAGES,
	OPENING_QUESTIONS,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/assessment-session.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/assessment-message.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");
vi.mock("@workspace/infrastructure/repositories/cost-guard.redis.repository");

import {
	AssessmentMessageDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__ which exports _resetMockState
	_resetMockState as resetMessageState,
} from "@workspace/infrastructure/repositories/assessment-message.drizzle.repository";
import {
	AssessmentSessionDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__ which exports _resetMockState
	_resetMockState as resetSessionState,
} from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import {
	CostGuardRedisRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__ which exports _resetMockState
	_resetMockState as resetCostGuardState,
} from "@workspace/infrastructure/repositories/cost-guard.redis.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";

const TestLayer = Layer.mergeAll(
	AssessmentSessionDrizzleRepositoryLive,
	AssessmentMessageDrizzleRepositoryLive,
	LoggerPinoRepositoryLive,
	CostGuardRedisRepositoryLive,
);

import { startAssessment } from "../../use-cases/start-assessment.use-case";

describe("startAssessment Use Case (@effect/vitest)", () => {
	beforeEach(() => {
		resetSessionState();
		resetMessageState();
		resetCostGuardState();
	});

	describe("Success scenarios", () => {
		it.effect("should create a new assessment session", () =>
			Effect.gen(function* () {
				const result = yield* startAssessment({});

				expect(result.sessionId).toMatch(/^session_/);
				expect(result.createdAt).toBeInstanceOf(Date);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should create session with user ID when provided", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;

				const result = yield* startAssessment({ userId: "user_123" });

				expect(result.sessionId).toBeDefined();

				// Verify session was created with correct user ID
				const session = yield* sessionRepo.getSession(result.sessionId);
				expect(session.userId).toBe("user_123");
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should create session without user ID when not provided", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;

				const result = yield* startAssessment({});

				// Verify session was created without user ID
				const session = yield* sessionRepo.getSession(result.sessionId);
				expect(session.userId).toBeUndefined();
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should return session ID, creation timestamp, and greeting messages", () =>
			Effect.gen(function* () {
				const beforeTime = new Date();
				const result = yield* startAssessment({});
				const afterTime = new Date();

				expect(result).toHaveProperty("sessionId");
				expect(result).toHaveProperty("createdAt");
				expect(result).toHaveProperty("messages");
				expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
				expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());

				// Verify 3 greeting messages
				expect(result.messages).toHaveLength(3);
				expect(result.messages[0].content).toBe(GREETING_MESSAGES[0]);
				expect(result.messages[1].content).toBe(GREETING_MESSAGES[1]);
				expect(OPENING_QUESTIONS).toContain(result.messages[2].content);
				for (const msg of result.messages) {
					expect(msg.role).toBe("assistant");
				}
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should handle multiple session creations independently", () =>
			Effect.gen(function* () {
				const result1 = yield* startAssessment({ userId: "user_1" });
				const result2 = yield* startAssessment({ userId: "user_2" });

				expect(result1.sessionId).not.toBe(result2.sessionId);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Error handling", () => {
		it.effect("should propagate repository errors", () =>
			Effect.gen(function* () {
				// Create a custom layer with failing repository
				const failingSessionRepo = {
					createSession: () => Effect.fail(new Error("Database connection failed")),
					getSession: () => Effect.fail(new Error("Not implemented")),
					updateSession: () => Effect.fail(new Error("Not implemented")),
					resumeSession: () => Effect.fail(new Error("Not implemented")),
				};

				const failingLayer = Effect.provideService(
					startAssessment({}),
					AssessmentSessionRepository,
					failingSessionRepo,
				);

				const exit = yield* Effect.exit(failingLayer.pipe(Effect.provide(TestLayer)));

				expect(exit._tag).toBe("Failure");
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Edge cases", () => {
		it.effect("should handle empty user ID string", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;

				const result = yield* startAssessment({ userId: "" });

				const session = yield* sessionRepo.getSession(result.sessionId);
				expect(session.userId).toBe("");
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should handle special characters in user ID", () =>
			Effect.gen(function* () {
				const specialUserId = "user+test@example.com";
				const sessionRepo = yield* AssessmentSessionRepository;

				const result = yield* startAssessment({ userId: specialUserId });

				const session = yield* sessionRepo.getSession(result.sessionId);
				expect(session.userId).toBe(specialUserId);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should handle very long user ID", () =>
			Effect.gen(function* () {
				const longUserId = "a".repeat(1000);
				const sessionRepo = yield* AssessmentSessionRepository;

				const result = yield* startAssessment({ userId: longUserId });

				const session = yield* sessionRepo.getSession(result.sessionId);
				expect(session.userId).toBe(longUserId);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Integration scenarios", () => {
		it.effect("should create session for anonymous user", () =>
			Effect.gen(function* () {
				const result = yield* startAssessment({ userId: undefined });

				expect(result).toHaveProperty("sessionId");
				expect(result.sessionId).toBeDefined();
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should enforce rate limit - second call fails for same user", () =>
			Effect.gen(function* () {
				// First call succeeds
				const result1 = yield* startAssessment({ userId: "user_test" });
				expect(result1.sessionId).toMatch(/^session_/);

				// Second call fails with RateLimitExceeded
				const exit = yield* Effect.exit(startAssessment({ userId: "user_test" }));
				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(exit.cause._tag).toBe("Fail");
					if (exit.cause._tag === "Fail") {
						const error = exit.cause.error;
						expect(error).toHaveProperty("_tag", "RateLimitExceeded");
						expect(error).toHaveProperty("message", "You can start a new assessment tomorrow");
					}
				}
			}).pipe(Effect.provide(TestLayer)),
		);
	});
});
