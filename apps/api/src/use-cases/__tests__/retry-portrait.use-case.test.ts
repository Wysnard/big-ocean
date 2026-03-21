/**
 * Retry Portrait Use Case Tests (Story 32-6)
 *
 * Tests:
 * - Resets retry count and forks daemon when portrait is failed
 * - Rejects retry when portrait is not failed
 * - Rejects retry when no portrait exists
 * - Rejects retry for wrong user
 */

import { vi } from "vitest";

vi.mock("../generate-full-portrait.use-case", () => ({
	generateFullPortrait: vi.fn(() => Effect.succeed({ success: true })),
}));

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentSessionRepository,
	LoggerRepository,
	PortraitRepository,
	SessionNotFound,
} from "@workspace/domain";
import type { Portrait } from "@workspace/domain/repositories/portrait.repository";
import { Effect, Exit, Layer } from "effect";
import { retryPortrait } from "../retry-portrait.use-case";

const mockSessionRepo = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	findSessionByUserId: vi.fn(),
	updateSession: vi.fn(),
	acquireSessionLock: vi.fn(),
	releaseSessionLock: vi.fn(),
	deleteSession: vi.fn(),
};

const mockPortraitRepo = {
	insertPlaceholder: vi.fn(),
	updateContent: vi.fn(),
	incrementRetryCount: vi.fn(),
	getByResultIdAndTier: vi.fn(),
	getFullPortraitBySessionId: vi.fn(),
	resetRetryCount: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
		Layer.succeed(PortraitRepository, mockPortraitRepo),
		Layer.succeed(LoggerRepository, mockLogger),
	);

const createMockPortrait = (overrides: Partial<Portrait> = {}): Portrait => ({
	id: "portrait_123",
	assessmentResultId: "result_456",
	tier: "full",
	content: null,
	modelUsed: "claude-sonnet-4-6",
	retryCount: 3,
	createdAt: new Date(),
	...overrides,
});

describe("retryPortrait Use Case (Story 32-6)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.effect("resets retry count and forks daemon when portrait is failed", () =>
		Effect.gen(function* () {
			const failedPortrait = createMockPortrait({ retryCount: 3 });
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({ id: "session_123", userId: "user_789", status: "completed" }),
			);
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(
				Effect.succeed(failedPortrait),
			);
			mockPortraitRepo.resetRetryCount.mockReturnValue(
				Effect.succeed({ ...failedPortrait, retryCount: 0 }),
			);

			const result = yield* retryPortrait({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.status).toBe("generating");
			expect(mockPortraitRepo.resetRetryCount).toHaveBeenCalledWith("portrait_123");
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Manual portrait retry: resetting retry count and spawning generation",
				expect.objectContaining({ portraitId: "portrait_123" }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("rejects retry when portrait is not failed (has content)", () =>
		Effect.gen(function* () {
			const readyPortrait = createMockPortrait({ content: "Some portrait", retryCount: 0 });
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({ id: "session_123", userId: "user_789", status: "completed" }),
			);
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(
				Effect.succeed(readyPortrait),
			);

			const result = yield* retryPortrait({
				sessionId: "session_123",
				userId: "user_789",
			});

			// Should return current status without retrying
			expect(result.status).toBe("ready");
			expect(mockPortraitRepo.resetRetryCount).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("rejects retry when no portrait exists", () =>
		Effect.gen(function* () {
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({ id: "session_123", userId: "user_789", status: "completed" }),
			);
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));

			const result = yield* retryPortrait({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.status).toBe("none");
			expect(mockPortraitRepo.resetRetryCount).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("rejects retry for wrong user (session ownership)", () =>
		Effect.gen(function* () {
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({ id: "session_123", userId: "other_user", status: "completed" }),
			);

			const exit = yield* Effect.exit(
				retryPortrait({
					sessionId: "session_123",
					userId: "user_789",
				}),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		}).pipe(Effect.provide(createTestLayer())),
	);
});
