/**
 * Start Assessment Use Case Tests (Migrated to @effect/vitest)
 *
 * Tests for startAuthenticatedAssessment, startAnonymousAssessment, and
 * the backward-compat startAssessment wrapper using @effect/vitest.
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

import {
	startAnonymousAssessment,
	startAssessment,
	startAuthenticatedAssessment,
} from "../../use-cases/start-assessment.use-case";

describe("startAssessment Use Case (@effect/vitest)", () => {
	beforeEach(() => {
		resetSessionState();
		resetMessageState();
		resetCostGuardState();
	});

	describe("startAuthenticatedAssessment", () => {
		it.effect("should create a new assessment session", () =>
			Effect.gen(function* () {
				const result = yield* startAuthenticatedAssessment({ userId: "user_auth_1" });

				expect(result.sessionId).toMatch(/^session_/);
				expect(result.createdAt).toBeInstanceOf(Date);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should create session with correct user ID", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;

				const result = yield* startAuthenticatedAssessment({ userId: "user_123" });

				expect(result.sessionId).toBeDefined();

				// Verify session was created with correct user ID
				const session = yield* sessionRepo.getSession(result.sessionId);
				expect(session.userId).toBe("user_123");
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should return session ID, creation timestamp, and greeting messages", () =>
			Effect.gen(function* () {
				const beforeTime = new Date();
				const result = yield* startAuthenticatedAssessment({ userId: "user_greet" });
				const afterTime = new Date();

				expect(result).toHaveProperty("sessionId");
				expect(result).toHaveProperty("createdAt");
				expect(result).toHaveProperty("messages");
				expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
				expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());

				// Verify 2 greeting messages (1 fixed + 1 opening question)
				expect(result.messages).toHaveLength(2);
				expect(result.messages[0].content).toBe(GREETING_MESSAGES[0]);
				expect(OPENING_QUESTIONS).toContain(result.messages[1].content);
				for (const msg of result.messages) {
					expect(msg.role).toBe("assistant");
				}
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should handle multiple session creations independently", () =>
			Effect.gen(function* () {
				const result1 = yield* startAuthenticatedAssessment({ userId: "user_1" });
				const result2 = yield* startAuthenticatedAssessment({ userId: "user_2" });

				expect(result1.sessionId).not.toBe(result2.sessionId);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should return existing active session for same user instead of creating new one", () =>
			Effect.gen(function* () {
				// First call creates a new session
				const result1 = yield* startAuthenticatedAssessment({ userId: "user_test" });
				expect(result1.sessionId).toMatch(/^session_/);

				// Second call returns the same active session
				const result2 = yield* startAuthenticatedAssessment({ userId: "user_test" });
				expect(result2.sessionId).toBe(result1.sessionId);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("startAnonymousAssessment", () => {
		it.effect("should create a new assessment session", () =>
			Effect.gen(function* () {
				const result = yield* startAnonymousAssessment();

				expect(result.sessionId).toMatch(/^session_/);
				expect(result.createdAt).toBeInstanceOf(Date);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should create session with token and null user ID", () =>
			Effect.gen(function* () {
				const result = yield* startAnonymousAssessment();

				expect(result.sessionToken).toBeDefined();
				expect(typeof result.sessionToken).toBe("string");
				expect(result.sessionToken.length).toBeGreaterThan(0);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should return greeting messages", () =>
			Effect.gen(function* () {
				const result = yield* startAnonymousAssessment();

				expect(result.messages).toHaveLength(2);
				expect(result.messages[0].content).toBe(GREETING_MESSAGES[0]);
				expect(OPENING_QUESTIONS).toContain(result.messages[1].content);
				for (const msg of result.messages) {
					expect(msg.role).toBe("assistant");
				}
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("startAssessment wrapper", () => {
		it.effect("should dispatch to authenticated path with userId", () =>
			Effect.gen(function* () {
				const sessionRepo = yield* AssessmentSessionRepository;

				const result = yield* startAssessment({ userId: "user_wrap" });

				const session = yield* sessionRepo.getSession(result.sessionId);
				expect(session.userId).toBe("user_wrap");
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should dispatch to anonymous path without userId", () =>
			Effect.gen(function* () {
				const result = yield* startAssessment({});

				// Anonymous path returns sessionToken
				expect("sessionToken" in result).toBe(true);
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Error handling", () => {
		it.effect("should propagate repository errors", () =>
			Effect.gen(function* () {
				// Create a custom layer with failing repository
				const failingSessionRepo = {
					createSession: () => Effect.fail(new Error("Database connection failed")),
					getActiveSessionByUserId: () => Effect.succeed(null),
					getSession: () => Effect.fail(new Error("Not implemented")),
					updateSession: () => Effect.fail(new Error("Not implemented")),
					getSessionsByUserId: () => Effect.succeed([]),
					findSessionByUserId: () => Effect.succeed(null),
					createAnonymousSession: () => Effect.fail(new Error("Database connection failed")),
					findByToken: () => Effect.succeed(null),
					assignUserId: () => Effect.fail(new Error("Not implemented")),
					rotateToken: () => Effect.fail(new Error("Not implemented")),
				};

				const failingLayer = Effect.provideService(
					startAnonymousAssessment(),
					AssessmentSessionRepository,
					failingSessionRepo,
				);

				const exit = yield* Effect.exit(failingLayer.pipe(Effect.provide(TestLayer)));

				expect(exit._tag).toBe("Failure");
			}).pipe(Effect.provide(TestLayer)),
		);
	});

	describe("Edge cases", () => {
		it.effect("should handle special characters in user ID", () =>
			Effect.gen(function* () {
				const specialUserId = "user+test@example.com";
				const sessionRepo = yield* AssessmentSessionRepository;

				const result = yield* startAuthenticatedAssessment({ userId: specialUserId });

				const session = yield* sessionRepo.getSession(result.sessionId);
				expect(session.userId).toBe(specialUserId);
			}).pipe(Effect.provide(TestLayer)),
		);

		it.effect("should handle very long user ID", () =>
			Effect.gen(function* () {
				const longUserId = "a".repeat(1000);
				const sessionRepo = yield* AssessmentSessionRepository;

				const result = yield* startAuthenticatedAssessment({ userId: longUserId });

				const session = yield* sessionRepo.getSession(result.sessionId);
				expect(session.userId).toBe(longUserId);
			}).pipe(Effect.provide(TestLayer)),
		);
	});
});
