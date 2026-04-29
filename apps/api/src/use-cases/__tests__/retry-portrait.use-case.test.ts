/**
 * Retry Portrait Use Case Tests (Story 32-6, queue-based architecture)
 *
 * Tests:
 * - Deletes failed portrait and queues regeneration
 * - Rejects retry when portrait is not failed
 * - Rejects retry when no portrait exists
 * - Rejects retry for wrong user
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	AssessmentResultRepository,
	ConversationRepository,
	LoggerRepository,
	PortraitJobQueue,
	PortraitRepository,
	PurchaseEventRepository,
} from "@workspace/domain";
import type { Portrait } from "@workspace/domain/repositories/portrait.repository";
import { Effect, Exit, Layer, Queue } from "effect";
import { vi } from "vitest";
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

const mockResultRepo = {
	getBySessionId: vi.fn(),
	getByUserId: vi.fn(),
	upsert: vi.fn(),
	getById: vi.fn(),
	delete: vi.fn(),
	getLatestByUserId: vi.fn(),
};

const mockPortraitRepo = {
	insertWithContent: vi.fn(),
	insertFailed: vi.fn(),
	deleteByResultIdAndTier: vi.fn(),
	getByResultIdAndTier: vi.fn(),
	getFullPortraitBySessionId: vi.fn(),
};

const mockPurchaseRepo = {
	insertEvent: vi.fn(),
	getEventsByUserId: vi.fn(),
	getCapabilities: vi.fn(),
	getByCheckoutId: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(ConversationRepository, mockSessionRepo),
		Layer.succeed(AssessmentResultRepository, mockResultRepo),
		Layer.succeed(PortraitRepository, mockPortraitRepo),
		Layer.succeed(PurchaseEventRepository, mockPurchaseRepo),
		Layer.succeed(LoggerRepository, mockLogger),
		Layer.effect(PortraitJobQueue, Queue.unbounded()),
	);

const createMockPortrait = (overrides: Partial<Portrait> = {}): Portrait => ({
	id: "portrait_123",
	assessmentResultId: "result_456",
	tier: "full",
	content: null,
	modelUsed: null,
	failedAt: new Date(),
	createdAt: new Date(),
	...overrides,
});

describe("retryPortrait Use Case (Story 32-6, queue-based)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.effect("deletes failed portrait and queues regeneration", () =>
		Effect.gen(function* () {
			const failedPortrait = createMockPortrait({ failedAt: new Date() });
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({ id: "session_123", userId: "user_789", status: "completed" }),
			);
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(failedPortrait));
			mockResultRepo.getBySessionId.mockReturnValue(
				Effect.succeed({ id: "result_456", stage: "completed" as const }),
			);
			mockPortraitRepo.deleteByResultIdAndTier.mockReturnValue(Effect.succeed(true));

			const result = yield* retryPortrait({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.status).toBe("generating");
			expect(mockPortraitRepo.deleteByResultIdAndTier).toHaveBeenCalledWith("result_456", "full");
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Manual portrait retry: deleting failed portrait and queuing regeneration",
				expect.objectContaining({ portraitId: "portrait_123" }),
			);
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("rejects retry when portrait is not failed (has content)", () =>
		Effect.gen(function* () {
			const readyPortrait = createMockPortrait({
				content: "Some portrait",
				modelUsed: "test-model",
				failedAt: null,
			});
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({ id: "session_123", userId: "user_789", status: "completed" }),
			);
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(readyPortrait));
			mockResultRepo.getBySessionId.mockReturnValue(
				Effect.succeed({ id: "result_456", stage: "completed" as const }),
			);

			const result = yield* retryPortrait({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(result.status).toBe("ready");
			expect(mockPortraitRepo.deleteByResultIdAndTier).not.toHaveBeenCalled();
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("returns current status when no portrait exists (no retry needed)", () =>
		Effect.gen(function* () {
			mockSessionRepo.getSession.mockReturnValue(
				Effect.succeed({ id: "session_123", userId: "user_789", status: "completed" }),
			);
			mockPortraitRepo.getFullPortraitBySessionId.mockReturnValue(Effect.succeed(null));
			mockResultRepo.getBySessionId.mockReturnValue(
				Effect.succeed({ id: "result_456", stage: "completed" as const }),
			);

			const out = yield* retryPortrait({
				sessionId: "session_123",
				userId: "user_789",
			});

			expect(out.status).toBe("generating");
			// No delete should happen
			expect(mockPortraitRepo.deleteByResultIdAndTier).not.toHaveBeenCalled();
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
