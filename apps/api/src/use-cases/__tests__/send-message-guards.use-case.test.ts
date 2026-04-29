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
	ASSESSMENT_TURN_COUNT,
	createTestLayer,
	mockActiveSession,
	mockActorRepo,
	mockMessageRepo,
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
				mockActorRepo.invoke.mockReturnValue(
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
					userId: "user_456",
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
					userId: "user_456",
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
					userId: "user_456",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("ConcurrentMessageError");
				}
				// No side effects should have occurred
				expect(mockMessageRepo.saveMessage).not.toHaveBeenCalled();
				expect(mockActorRepo.invoke).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should release lock even when pipeline fails (Nerin error)", () =>
			Effect.gen(function* () {
				mockActorRepo.invoke.mockReturnValue(
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
					userId: "user_456",
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
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({
						...mockActiveSession,
						messageCount: ASSESSMENT_TURN_COUNT - 1,
					}),
				);
				mockSessionRepo.incrementMessageCount.mockReturnValue(Effect.succeed(ASSESSMENT_TURN_COUNT));
				mockSessionRepo.updateSession.mockReturnValue(
					Effect.succeed({ ...mockActiveSession, status: "finalizing" }),
				);

				const result = yield* sendMessage({
					sessionId: "session_test_123",
					message: "Final message",
					userId: "user_456",
				});

				expect(result.isFinalTurn).toBe(true);
				expect(mockSessionRepo.updateSession).toHaveBeenCalledWith("session_test_123", {
					status: "finalizing",
				});
			}).pipe(Effect.provide(createTestLayer())),
		);

		it.effect("should NOT update session status when isFinalTurn is false", () =>
			Effect.gen(function* () {
				mockSessionRepo.getSession.mockReturnValue(
					Effect.succeed({
						...mockActiveSession,
						messageCount: ASSESSMENT_TURN_COUNT - 2,
					}),
				);
				mockSessionRepo.incrementMessageCount.mockReturnValue(
					Effect.succeed(ASSESSMENT_TURN_COUNT - 1),
				);

				yield* sendMessage({
					sessionId: "session_test_123",
					message: "Normal message",
					userId: "user_456",
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
					userId: "user_456",
				}).pipe(Effect.exit);

				expect(exit._tag).toBe("Failure");
				if (exit._tag === "Failure") {
					expect(String(exit.cause)).toContain("SessionCompletedError");
				}
				expect(mockMessageRepo.saveMessage).not.toHaveBeenCalled();
			}).pipe(Effect.provide(createTestLayer())),
		);
	});
});
