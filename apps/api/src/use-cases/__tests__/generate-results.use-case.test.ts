/**
 * Generate Results Use Case Tests (Story 11.1)
 *
 * Tests idempotency tiers, session validation, and the placeholder pipeline.
 */

import { describe, expect, it } from "@effect/vitest";
import { AssessmentSessionRepository, LoggerRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { generateResults } from "../generate-results.use-case";

const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	updateSession: vi.fn(),
	getActiveSessionByUserId: vi.fn(),
	getSessionsByUserId: vi.fn(),
	findSessionByUserId: vi.fn(),
	createAnonymousSession: vi.fn(),
	findByToken: vi.fn(),
	assignUserId: vi.fn(),
	rotateToken: vi.fn(),
	incrementMessageCount: vi.fn(),
	acquireSessionLock: vi.fn(),
	releaseSessionLock: vi.fn(),
};

const mockLoggerRepo = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const mockFinalizingSession = {
	id: "session_123",
	userId: "user_456",
	sessionToken: "mock_token",
	createdAt: new Date("2026-02-01"),
	updatedAt: new Date("2026-02-01"),
	status: "finalizing",
	messageCount: 25,
	finalizationProgress: null,
	personalDescription: null,
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
		Layer.succeed(LoggerRepository, mockLoggerRepo),
	);

describe("generateResults Use Case (Story 11.1)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSessionRepo.getSession.mockReturnValue(Effect.succeed(mockFinalizingSession));
		mockSessionRepo.updateSession.mockReturnValue(Effect.succeed(mockFinalizingSession));
		mockSessionRepo.acquireSessionLock.mockReturnValue(Effect.void);
		mockSessionRepo.releaseSessionLock.mockReturnValue(Effect.void);
		mockLoggerRepo.info.mockImplementation(() => {});
	});

	describe("Session validation", () => {
		it.effect("should fail with SessionNotFound when userId doesn't match", () =>
			Effect.gen(function* () {
				const exit = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "wrong_user",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionNotFound");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should fail with SessionNotFinalizing when session is active", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockFinalizingSession, status: "active" }),
				);

				const exit = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionNotFinalizing");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Idempotency tier 1: already completed", () => {
		it.effect("should return completed without side effects", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockFinalizingSession, status: "completed" }),
				);

				const result = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				expect(result).toEqual({ status: "completed" });
				expect(mockSessionRepo.acquireSessionLock).not.toHaveBeenCalled();
				expect(mockSessionRepo.updateSession).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Idempotency tier 2: concurrent duplicate", () => {
		it.effect("should return current progress when lock fails", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({
						...mockFinalizingSession,
						finalizationProgress: "analyzing",
					}),
				);
				mockSessionRepo.acquireSessionLock.mockReturnValue(
					Effect.fail({
						_tag: "ConcurrentMessageError",
						sessionId: "session_123",
						message: "Lock held",
					}),
				);

				const result = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				expect(result).toEqual({ status: "analyzing" });
				expect(mockSessionRepo.updateSession).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Happy path: finalizing session", () => {
		it.effect("should acquire lock, update progress, and complete", () =>
			Effect.gen(function* () {
				const result = yield* generateResults({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				});

				expect(result).toEqual({ status: "completed" });
				expect(mockSessionRepo.acquireSessionLock).toHaveBeenCalledWith("session_123");

				// Verify progress updates
				const updateCalls = mockSessionRepo.updateSession.mock.calls;
				expect(updateCalls[0]).toEqual(["session_123", { finalizationProgress: "analyzing" }]);
				expect(updateCalls[1]).toEqual([
					"session_123",
					{ finalizationProgress: "generating_portrait" },
				]);
				expect(updateCalls[2]).toEqual([
					"session_123",
					{ status: "completed", finalizationProgress: "completed" },
				]);

				expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_123");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
