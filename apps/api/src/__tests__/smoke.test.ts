/**
 * Smoke Test for @effect/vitest Setup
 *
 * Verifies that:
 * - @effect/vitest is installed and working
 * - Test Layers are properly configured
 * - Effect programs run in tests
 * - TestContext (TestClock) is available
 */

import { it } from "@effect/vitest";
import { AssessmentSessionRepository, LoggerRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import { beforeEach, describe, expect, vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/assessment-session.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/logger.pino.repository");

import {
	AssessmentSessionDrizzleRepositoryLive,
	// @ts-expect-error -- TS sees real module; Vitest resolves __mocks__ which exports _resetMockState
	_resetMockState as resetSessionState,
} from "@workspace/infrastructure/repositories/assessment-session.drizzle.repository";
import { LoggerPinoRepositoryLive } from "@workspace/infrastructure/repositories/logger.pino.repository";

const TestLayer = Layer.mergeAll(AssessmentSessionDrizzleRepositoryLive, LoggerPinoRepositoryLive);

describe("@effect/vitest Setup", () => {
	beforeEach(() => {
		resetSessionState();
	});

	// ✅ Basic Effect test
	it.effect("should run Effect programs in tests", () =>
		Effect.gen(function* () {
			const result = yield* Effect.succeed(42);
			expect(result).toBe(42);
		}),
	);

	// ✅ Test Layer provision
	it.effect("should provide test Layers", () =>
		Effect.gen(function* () {
			const sessionRepo = yield* AssessmentSessionRepository;
			expect(sessionRepo).toBeDefined();
			expect(sessionRepo.createSession).toBeTypeOf("function");
		}).pipe(Effect.provide(TestLayer)),
	);

	// ✅ Repository mock functionality
	it.effect("should create session with test repository", () =>
		Effect.gen(function* () {
			const sessionRepo = yield* AssessmentSessionRepository;
			const _logger = yield* LoggerRepository;

			const session = yield* sessionRepo.createSession("test-user-123");

			expect(session.sessionId).toMatch(/^session_/);
			expect(session.userId).toBe("test-user-123");
		}).pipe(Effect.provide(TestLayer)),
	);

	// ✅ Effect.exit for testing failures
	it.effect("should test failure cases with Effect.exit", () =>
		Effect.gen(function* () {
			const program = Effect.fail(new Error("Expected failure"));
			const exit = yield* Effect.exit(program);

			expect(exit._tag).toBe("Failure");
		}),
	);

	// ✅ Test modifiers work
	it.effect.skip("should skip this test", () => Effect.succeed(undefined));
});

describe("Test Layer Examples", () => {
	it.effect("should use multiple repositories", () =>
		Effect.gen(function* () {
			const sessionRepo = yield* AssessmentSessionRepository;
			const logger = yield* LoggerRepository;

			// Create session
			const session = yield* sessionRepo.createSession("user-multi-test");

			// Log event (no-op in test layer)
			logger.info("Session created", { sessionId: session.sessionId });

			// Verify session
			const retrieved = yield* sessionRepo.getSession(session.sessionId);
			expect(retrieved.sessionId).toBe(session.sessionId);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("should handle sequential operations", () =>
		Effect.gen(function* () {
			const sessionRepo = yield* AssessmentSessionRepository;

			// Create multiple sessions
			const session1 = yield* sessionRepo.createSession("user-1");
			const session2 = yield* sessionRepo.createSession("user-2");

			// Sessions should have different IDs
			expect(session1.sessionId).not.toBe(session2.sessionId);
			expect(session1.userId).toBe("user-1");
			expect(session2.userId).toBe("user-2");
		}).pipe(Effect.provide(TestLayer)),
	);
});
