/**
 * Send Message Use Case Tests — Base pipeline + Ownership + Session guard + isFinalTurn
 *
 * Story 9.2: Base pipeline tests.
 * Uses @effect/vitest it.effect() pattern per project conventions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { Effect } from "effect";
import { sendMessage } from "../send-message.use-case";
import {
	coldStartMessages,
	createTestLayer,
	FREE_TIER_MESSAGE_THRESHOLD,
	mockActiveSession,
	mockMessageRepo,
	mockNerinRepo,
	mockNerinResponse,
	mockSessionRepo,
	setupDefaultMocks,
} from "./__fixtures__/send-message.fixtures";

describe("sendMessage Use Case", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Base pipeline (Story 9.2)", () => {
		it.effect("should send a message and get Nerin response", () =>
			Effect.gen(function* () {
				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "What do you do?",
				});

				expect(result).toEqual({
					response: mockNerinResponse.response,
					isFinalTurn: false,
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should save user message atomically inside the pipeline (after LLM success)", () =>
			Effect.gen(function* () {
				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Tell me something",
					userId: "user_456",
				});

				// User message is now saved inside the pipeline, after Nerin succeeds
				// Story 23-3: saveMessage now takes (sessionId, role, content, exchangeId?)
				expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
					"session_test_123",
					"user",
					"Tell me something",
					expect.any(String), // exchangeId
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should save messages with exchange_id and create exchange record (Story 23-3)", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				// User message linked to exchange
				expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
					"session_test_123",
					"user",
					"Test",
					expect.any(String), // exchangeId
				);

				// Assistant message linked to same exchange
				expect(mockMessageRepo.saveMessage).toHaveBeenCalledWith(
					"session_test_123",
					"assistant",
					mockNerinResponse.response,
					expect.any(String), // exchangeId
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should invoke Nerin with system prompt (Story 27-3)", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				expect(mockNerinRepo.invoke).toHaveBeenCalledWith(
					expect.objectContaining({
						sessionId: "session_test_123",
						messages: [
							...coldStartMessages.map((m) => ({
								id: m.id,
								role: m.role,
								content: m.content,
							})),
							// Current user message appended in-memory by pipeline
							expect.objectContaining({ role: "user", content: "Test" }),
						],
						systemPrompt: expect.any(String),
					}),
				);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should increment message_count atomically", () =>
			Effect.gen(function* () {
				yield* sendMessage({ sessionId: "session_test_123", message: "Test" });

				expect(mockSessionRepo.incrementMessageCount).toHaveBeenCalledWith("session_test_123");
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Ownership guard", () => {
		it.effect("should allow linked session owner to send messages", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, userId: "owner_user" }),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Owner message",
					userId: "owner_user",
				});

				expect(result.response).toBeDefined();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should deny non-owner access before side effects", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, userId: "owner_user" }),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Unauthorized",
					userId: "different_user",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionNotFound");
				}
				expect(mockMessageRepo.saveMessage).not.toHaveBeenCalled();
				expect(mockNerinRepo.invoke).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Session status guard", () => {
		it.effect("should reject messages to completed sessions", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, status: "completed" }),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionCompletedError");
				}
				expect(mockMessageRepo.saveMessage).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("isFinalTurn threshold", () => {
		it.effect("should return isFinalTurn: true at threshold", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(
					Effect.succeed(FREE_TIER_MESSAGE_THRESHOLD),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Threshold msg",
				});

				expect(result.isFinalTurn).toBe(true);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should return isFinalTurn: false below threshold", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(
					Effect.succeed(FREE_TIER_MESSAGE_THRESHOLD - 1),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Normal message",
				});

				expect(result.isFinalTurn).toBe(false);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
