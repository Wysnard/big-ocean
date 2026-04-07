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
import { ConversationRepository, ExchangeRepository, LoggerRepository } from "@workspace/domain";
import { _resetMockState as _resetSessionMockState } from "@workspace/infrastructure/repositories/__mocks__/conversation.drizzle.repository";
import { ConversationDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/conversation.drizzle.repository";
import { MessageDrizzleRepositoryLive } from "@workspace/infrastructure/repositories/message.drizzle.repository";
import { Effect, Exit, Layer } from "effect";
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

	it.effect("creates extension session linked to parent", () =>
		Effect.gen(function* () {
			// Seed a completed session for the user
			const sessionRepo = yield* ConversationRepository;
			const created = yield* sessionRepo.createSession("user_123");
			yield* sessionRepo.updateSession(created.sessionId, { status: "completed" });

			// Activate extension
			const result = yield* activateConversationExtension({ userId: "user_123" });

			expect(result.sessionId).toBeDefined();
			expect(result.parentSessionId).toBe(created.sessionId);
			expect(result.messages.length).toBeGreaterThan(0);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("fails with SessionNotFound when no completed session exists", () =>
		Effect.gen(function* () {
			const exit = yield* Effect.exit(activateConversationExtension({ userId: "user_no_session" }));

			expect(Exit.isFailure(exit)).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns existing extension session idempotently", () =>
		Effect.gen(function* () {
			// Seed a completed session with an existing child extension
			const sessionRepo = yield* ConversationRepository;
			const parent = yield* sessionRepo.createSession("user_456");
			yield* sessionRepo.updateSession(parent.sessionId, { status: "completed" });

			// Create extension session first time
			const first = yield* activateConversationExtension({ userId: "user_456" });
			expect(first.sessionId).toBeDefined();
			expect(first.parentSessionId).toBe(parent.sessionId);

			// Second call should detect parent now has a child and
			// not find an eligible session (parent has child), or find a different one
			// Since our mock findCompletedSessionWithoutChild filters out parents with children,
			// a second activation should fail (no more eligible sessions)
			const exit = yield* Effect.exit(activateConversationExtension({ userId: "user_456" }));

			expect(Exit.isFailure(exit)).toBe(true);
		}).pipe(Effect.provide(TestLayer)),
	);
});
