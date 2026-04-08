/**
 * Activate Conversation Extension Use Case Tests (Story 36-1)
 *
 * Verifies extension session creation, parent linking, idempotency,
 * and error handling when no eligible session exists.
 */

import { vi } from "vitest";

vi.mock("@workspace/infrastructure/repositories/conversation.drizzle.repository");
vi.mock("@workspace/infrastructure/repositories/message.drizzle.repository");
vi.mock("@workspace/domain/config/app-config");

import { beforeEach, describe, expect, it } from "@effect/vitest";
import {
	ConversationRepository,
	ExchangeRepository,
	LoggerRepository,
	MessageRepository,
} from "@workspace/domain";
import { _resetMockState as _resetSessionMockState } from "@workspace/infrastructure/repositories/__mocks__/conversation.drizzle.repository";
import { ConversationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/conversation.drizzle.repository";
import { MessageDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/message.drizzle.repository";
import { Effect, Layer } from "effect";
import { activateConversationExtension } from "../activate-conversation-extension.use-case";

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

const mockExchangeRepo = {
	create: vi.fn(() =>
		Effect.succeed({
			id: "exchange_123",
			sessionId: "session_123",
			turnNumber: 0,
		}),
	),
	getBySessionId: vi.fn(),
	getBySessionIdAndTurn: vi.fn(),
	update: vi.fn(),
	getLastExchange: vi.fn(),
};

const TestLayer = Layer.mergeAll(
	ConversationDrizzleRepositoryLive,
	MessageDrizzleRepositoryLive,
	Layer.succeed(ExchangeRepository, mockExchangeRepo),
	Layer.succeed(LoggerRepository, mockLogger),
);

describe("activateConversationExtension Use Case", () => {
	beforeEach(() => {
		_resetSessionMockState();
		vi.clearAllMocks();
	});

	it.effect("fails with FeatureUnavailable even when a completed parent conversation exists", () =>
		Effect.gen(function* () {
			// Seed a completed session for the user
			const sessionRepo = yield* ConversationRepository;
			const created = yield* sessionRepo.createSession("user_123");
			yield* sessionRepo.updateSession(created.sessionId, { status: "completed" });

			const error = yield* activateConversationExtension({ userId: "user_123" }).pipe(Effect.flip);
			const sessions = yield* sessionRepo.getSessionsByUserId("user_123");
			const messageRepo = yield* MessageRepository;
			const messages = yield* messageRepo.getMessages(created.sessionId);

			expect(error._tag).toBe("FeatureUnavailable");
			expect(sessions).toHaveLength(1);
			expect(messages).toHaveLength(0);
			expect(mockExchangeRepo.create).not.toHaveBeenCalled();
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect(
		"fails with FeatureUnavailable when called without any eligible parent conversation",
		() =>
			Effect.gen(function* () {
				const error = yield* activateConversationExtension({ userId: "user_no_session" }).pipe(
					Effect.flip,
				);

				expect(error._tag).toBe("FeatureUnavailable");
				expect(mockExchangeRepo.create).not.toHaveBeenCalled();
			}).pipe(Effect.provide(TestLayer)),
	);

	it.effect(
		"does not create greeting messages or child conversations while the feature is gated",
		() =>
			Effect.gen(function* () {
				const sessionRepo = yield* ConversationRepository;
				const messageRepo = yield* MessageRepository;
				const parent = yield* sessionRepo.createSession("user_blocked");
				yield* sessionRepo.updateSession(parent.sessionId, { status: "completed" });

				yield* activateConversationExtension({ userId: "user_blocked" }).pipe(Effect.flip);

				const sessions = yield* sessionRepo.getSessionsByUserId("user_blocked");
				const parentMessages = yield* messageRepo.getMessages(parent.sessionId);

				expect(sessions).toHaveLength(1);
				expect(parentMessages).toHaveLength(0);
				expect(mockExchangeRepo.create).not.toHaveBeenCalled();
			}).pipe(Effect.provide(TestLayer)),
	);
});
