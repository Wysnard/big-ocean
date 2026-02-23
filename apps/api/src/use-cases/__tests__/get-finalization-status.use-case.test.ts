/**
 * Get Finalization Status Use Case Tests (Story 11.1)
 */

import { describe, expect, it } from "@effect/vitest";
import { AssessmentSessionRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { getFinalizationStatus } from "../get-finalization-status.use-case";

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

const mockSession = {
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

const createTestLayer = () => Layer.succeed(AssessmentSessionRepository, mockSessionRepo);

describe("getFinalizationStatus Use Case (Story 11.1)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSessionRepo.getSession.mockReturnValue(Effect.succeed(mockSession));
	});

	it.effect("should return analyzing with progress 33", () =>
		Effect.gen(function* () {
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({ ...mockSession, finalizationProgress: "analyzing" }),
			);

			const result = yield* getFinalizationStatus({
				sessionId: "session_123",
				authenticatedUserId: "user_456",
			});

			expect(result).toEqual({ status: "analyzing", progress: 33 });
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should return generating_portrait with progress 66", () =>
		Effect.gen(function* () {
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({ ...mockSession, finalizationProgress: "generating_portrait" }),
			);

			const result = yield* getFinalizationStatus({
				sessionId: "session_123",
				authenticatedUserId: "user_456",
			});

			expect(result).toEqual({ status: "generating_portrait", progress: 66 });
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should return completed with progress 100 when status is completed", () =>
		Effect.gen(function* () {
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({ ...mockSession, status: "completed", finalizationProgress: "completed" }),
			);

			const result = yield* getFinalizationStatus({
				sessionId: "session_123",
				authenticatedUserId: "user_456",
			});

			expect(result).toEqual({ status: "completed", progress: 100 });
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should default to analyzing when finalizationProgress is null", () =>
		Effect.gen(function* () {
			const result = yield* getFinalizationStatus({
				sessionId: "session_123",
				authenticatedUserId: "user_456",
			});

			expect(result).toEqual({ status: "analyzing", progress: 33 });
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should fail with SessionNotFound for wrong user", () =>
		Effect.gen(function* () {
			const exit = yield* getFinalizationStatus({
				sessionId: "session_123",
				authenticatedUserId: "wrong_user",
			}).pipe(Effect.exit);

			expect(exit._tag).toBe("Failure");
			if (exit._tag === "Failure") {
				expect(String(exit.cause)).toContain("SessionNotFound");
			}
		}).pipe(Effect.provide(createTestLayer())),
	);
});
