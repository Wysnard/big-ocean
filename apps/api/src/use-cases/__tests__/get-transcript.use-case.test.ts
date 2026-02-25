/**
 * Get Transcript Use Case Tests (Story 12.2)
 */

import { beforeEach, describe, expect, it } from "@effect/vitest";
import { AssessmentMessageRepository, AssessmentSessionRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import { vi } from "vitest";
import { getTranscript } from "../get-transcript.use-case";

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

const mockMessageRepo = {
	saveMessage: vi.fn(),
	getMessages: vi.fn(),
	getMessageCount: vi.fn(),
};

const mockSession = {
	id: "session_123",
	userId: "user_456",
	sessionToken: "mock_token",
	createdAt: new Date("2026-02-01"),
	updatedAt: new Date("2026-02-01"),
	status: "completed",
	messageCount: 12,
	finalizationProgress: null,
	personalDescription: null,
};

const mockMessages = [
	{
		id: "msg_001",
		sessionId: "session_123",
		role: "assistant",
		content: "Hello! I'm Nerin.",
		createdAt: new Date("2026-02-01T10:00:00Z"),
	},
	{
		id: "msg_002",
		sessionId: "session_123",
		role: "user",
		content: "Hi Nerin!",
		userId: "user_456",
		createdAt: new Date("2026-02-01T10:01:00Z"),
	},
];

const createTestLayer = () =>
	Layer.mergeAll(
		Layer.succeed(AssessmentSessionRepository, mockSessionRepo),
		Layer.succeed(AssessmentMessageRepository, mockMessageRepo),
	);

describe("getTranscript Use Case (Story 12.2)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSessionRepo.getSession.mockReturnValue(Effect.succeed(mockSession));
		mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(mockMessages));
	});

	it.effect("should return messages with IDs for a completed session", () =>
		Effect.gen(function* () {
			const result = yield* getTranscript({
				sessionId: "session_123",
				authenticatedUserId: "user_456",
			});

			expect(result.messages).toHaveLength(2);
			expect(result.messages[0]).toEqual({
				id: "msg_001",
				role: "assistant",
				content: "Hello! I'm Nerin.",
				createdAt: new Date("2026-02-01T10:00:00Z"),
			});
			expect(result.messages[1]).toEqual({
				id: "msg_002",
				role: "user",
				content: "Hi Nerin!",
				createdAt: new Date("2026-02-01T10:01:00Z"),
			});
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should reject unauthorized access (different user)", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(
				getTranscript({
					sessionId: "session_123",
					authenticatedUserId: "other_user",
				}),
			);

			expect(exit._tag).toBe("Failure");
		}).pipe(Effect.provide(createTestLayer())),
	);

	it.effect("should reject access to non-completed sessions", () =>
		Effect.gen(function* () {
			mockSessionRepo.getSession.mockReturnValue(Effect.succeed({ ...mockSession, status: "active" }));

			const exit = yield* Effect.exit(
				getTranscript({
					sessionId: "session_123",
					authenticatedUserId: "user_456",
				}),
			);

			expect(exit._tag).toBe("Failure");
		}).pipe(Effect.provide(createTestLayer())),
	);
});
