/**
 * Send Message Use Case Tests — Error handling + Advisory lock + Finalization trigger + Farewell
 *
 * Story 10.5: Advisory lock, farewell winding-down.
 * Story 11.1: Finalization trigger.
 * Uses @effect/vitest it.effect() pattern per project conventions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "@effect/vitest";
import { AgentInvocationError, ConcurrentMessageError } from "@workspace/domain";
import { Effect } from "effect";
import { sendMessage } from "../send-message.use-case";
import {
	coldStartMessages,
	createTestLayer,
	FREE_TIER_MESSAGE_THRESHOLD,
	mockActiveSession,
	mockMessageRepo,
	mockNerinRepo,
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

	describe("Error handling", () => {
		it.effect("should fail when session not found", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.fail({
						_tag: "SessionNotFound",
						sessionId: "nonexistent",
						message: "Session 'nonexistent' not found",
					}),
				);

				const exit = yield* sendMessage({
					sessionId: "nonexistent",
					message: "Test",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should handle Nerin invocation failure", () =>
			Effect.gen(function* () {
				mockNerinRepo.invoke.mockReturnValue(
					Effect.fail(
						new AgentInvocationError({
							agentName: "Nerin",
							sessionId: "session_test_123",
							message: "Claude API error",
						}),
					),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("AgentInvocationError");
				}
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Advisory lock — unit tests with mock repos (Story 10.5)", () => {
		it.effect("should acquire and release advisory lock on successful pipeline", () =>
			Effect.gen(function* () {
				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				});

				expect(mockSessionRepo.acquireSessionLock).toHaveBeenCalledWith("session_test_123");
				expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_test_123");
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should return ConcurrentMessageError when lock is contended", () =>
			Effect.gen(function* () {
				mockSessionRepo.acquireSessionLock.mockReturnValue(
					Effect.fail(
						new ConcurrentMessageError({
							sessionId: "session_test_123",
							message: "Another message is being processed",
						}),
					),
				);

				const exit = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("ConcurrentMessageError");
				}
				// No side effects should have occurred
				expect(mockMessageRepo.saveMessage).not.toHaveBeenCalled();
				expect(mockNerinRepo.invoke).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should release lock even when pipeline fails (Nerin error)", () =>
			Effect.gen(function* () {
				mockNerinRepo.invoke.mockReturnValue(
					Effect.fail(
						new AgentInvocationError({
							agentName: "Nerin",
							sessionId: "session_test_123",
							message: "Claude API error",
						}),
					),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Test",
				}).pipe(Effect.exit);

				expect(mockSessionRepo.acquireSessionLock).toHaveBeenCalledWith("session_test_123");
				expect(mockSessionRepo.releaseSessionLock).toHaveBeenCalledWith("session_test_123");
				// Verify acquire happens before release (ordering guarantee)
				const acquireOrder = mockSessionRepo.acquireSessionLock.mock.invocationCallOrder[0] ?? 0;
				const releaseOrder = mockSessionRepo.releaseSessionLock.mock.invocationCallOrder[0] ?? 0;
				expect(acquireOrder).toBeLessThan(releaseOrder);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});

	describe("Finalization trigger (Story 11.1)", () => {
		it.effect("should update session status to 'finalizing' when isFinalTurn is true", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(
					Effect.succeed(FREE_TIER_MESSAGE_THRESHOLD),
				);
				mockSessionRepo.updateSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, status: "finalizing" }),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Final message",
				});

				expect(result.isFinalTurn).toBe(true);
				expect(mockSessionRepo.updateSession).toHaveBeenCalledWith("session_test_123", {
					status: "finalizing",
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should NOT update session status when isFinalTurn is false", () =>
			Effect.gen(function* () {
				mockSessionRepo.incrementMessageCount.mockReturnValue(
					Effect.succeed(FREE_TIER_MESSAGE_THRESHOLD - 1),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Normal message",
				});

				expect(mockSessionRepo.updateSession).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should reject messages when session status is 'finalizing'", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, status: "finalizing" }),
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

	describe("Farewell winding-down (Story 10.5)", () => {
		it.effect("should pass nearingEnd to Nerin when user messages >= threshold - 3", () =>
			Effect.gen(function* () {
				// Simulate many user messages (threshold - 3 = 22 user messages)
				const manyUserMessages = Array.from({ length: FREE_TIER_MESSAGE_THRESHOLD - 3 }, (_, i) => [
					{
						id: `msg_a_${i}`,
						sessionId: "session_test_123",
						role: "assistant" as const,
						content: `Response ${i}`,
						createdAt: new Date(),
					},
					{
						id: `msg_u_${i}`,
						sessionId: "session_test_123",
						role: "user" as const,
						content: `Message ${i}`,
						createdAt: new Date(),
					},
				]).flat();
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(manyUserMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Late message",
				});

				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.nearingEnd).toBe(true);
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should NOT pass nearingEnd when user messages < threshold - 3", () =>
			Effect.gen(function* () {
				// Cold start: 1 user message — well below threshold - 3
				mockMessageRepo.getMessages.mockReturnValue(Effect.succeed(coldStartMessages));

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Early message",
				});

				const nerinCall = mockNerinRepo.invoke.mock.calls[0][0];
				expect(nerinCall.nearingEnd).toBe(false);
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
