/**
 * Start Assessment Use Case Tests — startAnonymousAssessment + wrapper
 *
 * Tests for anonymous assessment creation and the startAssessment dispatcher.
 * Uses inline spy layers (Layer.succeed with vi.fn()) for per-test control.
 */

import { GREETING_MESSAGES, OPENING_QUESTIONS } from "@workspace/domain";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAnonymousAssessment, startAssessment } from "../start-assessment.use-case";
import {
	createTestLayer,
	mockAssessmentMessageRepo,
	mockAssessmentSessionRepo,
	mockCostGuardRepo,
	mockLoggerRepo,
	setupDefaultMocks,
} from "./__fixtures__/start-assessment.fixtures";

describe("startAssessment Use Case", () => {
	beforeEach(() => {
		setupDefaultMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("startAnonymousAssessment", () => {
		it("should create an anonymous session with token", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(
				startAnonymousAssessment().pipe(Effect.provide(testLayer)),
			);

			expect(result.sessionId).toBe("session_anon_123");
			expect(result.sessionToken).toBe("mock_token_abc123def456");
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(mockAssessmentSessionRepo.createAnonymousSession).toHaveBeenCalled();
		});

		it("should not call CostGuard at all", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer)));

			expect(mockCostGuardRepo.canStartAssessment).not.toHaveBeenCalled();
			expect(mockCostGuardRepo.recordAssessmentStart).not.toHaveBeenCalled();
		});

		it("should not check for existing sessions", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer)));

			expect(mockAssessmentSessionRepo.findSessionByUserId).not.toHaveBeenCalled();
		});

		it("should log anonymous session creation", async () => {
			const testLayer = createTestLayer();

			await Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer)));

			expect(mockLoggerRepo.info).toHaveBeenCalledWith("Anonymous assessment started", {
				sessionId: "session_anon_123",
				greetingCount: 2,
			});
		});

		describe("Greeting message persistence", () => {
			it("should save exactly 2 greeting messages to the database", async () => {
				const testLayer = createTestLayer();

				await Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer)));

				expect(mockAssessmentMessageRepo.saveMessage).toHaveBeenCalledTimes(2);
			});

			it("should save the fixed greeting message and opening question in order", async () => {
				const testLayer = createTestLayer();

				await Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer)));

				const firstCall = mockAssessmentMessageRepo.saveMessage.mock.calls[0];
				const secondCall = mockAssessmentMessageRepo.saveMessage.mock.calls[1];

				expect(firstCall[2]).toBe(GREETING_MESSAGES[0]);
				expect(OPENING_QUESTIONS).toContain(secondCall[2]);
			});

			it("should return 2 messages with role and content in the response", async () => {
				const testLayer = createTestLayer();

				const result = await Effect.runPromise(
					startAnonymousAssessment().pipe(Effect.provide(testLayer)),
				);

				expect(result.messages).toHaveLength(2);
				for (const msg of result.messages) {
					expect(msg.role).toBe("assistant");
					expect(typeof msg.content).toBe("string");
					expect(msg.createdAt).toBeInstanceOf(Date);
				}
			});

			it("should return messages with content matching what was saved", async () => {
				const testLayer = createTestLayer();

				const result = await Effect.runPromise(
					startAnonymousAssessment().pipe(Effect.provide(testLayer)),
				);

				expect(result.messages[0].content).toBe(GREETING_MESSAGES[0]);
				expect(OPENING_QUESTIONS).toContain(result.messages[1].content);
			});
		});

		describe("Error handling", () => {
			it("should fail when anonymous session creation fails", async () => {
				const creationError = new Error("Database connection failed");
				mockAssessmentSessionRepo.createAnonymousSession.mockReturnValue(Effect.fail(creationError));

				const testLayer = createTestLayer();

				await expect(
					Effect.runPromise(startAnonymousAssessment().pipe(Effect.provide(testLayer))),
				).rejects.toThrow("Database connection failed");
			});
		});
	});

	describe("startAssessment wrapper", () => {
		it("should dispatch to authenticated path when userId is provided", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(
				startAssessment({ userId: "user_wrapper" }).pipe(Effect.provide(testLayer)),
			);

			expect(result.sessionId).toBe("session_new_789");
			expect(mockAssessmentSessionRepo.findSessionByUserId).toHaveBeenCalledWith("user_wrapper");
			expect(mockCostGuardRepo.canStartAssessment).toHaveBeenCalledWith("user_wrapper");
		});

		it("should dispatch to anonymous path when userId is undefined", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(
				startAssessment({ userId: undefined }).pipe(Effect.provide(testLayer)),
			);

			expect(result.sessionId).toBe("session_anon_123");
			expect(mockAssessmentSessionRepo.findSessionByUserId).not.toHaveBeenCalled();
			expect(mockCostGuardRepo.canStartAssessment).not.toHaveBeenCalled();
		});

		it("should dispatch to anonymous path when no userId key", async () => {
			const testLayer = createTestLayer();

			const result = await Effect.runPromise(startAssessment({}).pipe(Effect.provide(testLayer)));

			expect(result.sessionId).toBe("session_anon_123");
			expect(mockAssessmentSessionRepo.findSessionByUserId).not.toHaveBeenCalled();
			expect(mockCostGuardRepo.canStartAssessment).not.toHaveBeenCalled();
		});

		it("should return current time, not repository creation time", async () => {
			const testLayer = createTestLayer();
			const beforeTime = new Date();

			const result = await Effect.runPromise(startAssessment({}).pipe(Effect.provide(testLayer)));

			const afterTime = new Date();

			expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
			expect(result.createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
		});
	});
});
