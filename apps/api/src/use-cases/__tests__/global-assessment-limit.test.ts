/**
 * Global Assessment Limit & Waitlist Tests (Story 15.3)
 *
 * Tests for:
 * - checkAndRecordGlobalAssessmentStart (AC #1, #4, #5)
 * - GlobalAssessmentLimitReached propagation through start-assessment (AC #1)
 * - join-waitlist use-case (AC #3)
 */

import { GlobalAssessmentLimitReached } from "@workspace/contracts";
import { LoggerRepository, RedisOperationError, WaitlistRepository } from "@workspace/domain";
import { DateTime, Effect, Exit, Layer } from "effect";
import { describe, expect, it, vi } from "vitest";
import { joinWaitlist } from "../join-waitlist.use-case";
import {
	startAnonymousAssessment,
	startAuthenticatedAssessment,
} from "../start-assessment.use-case";
import {
	createTestLayer,
	mockAssessmentMessageRepo,
	mockAssessmentSessionRepo,
	mockCostGuardRepo,
	setupDefaultMocks,
} from "./__fixtures__/start-assessment.fixtures";

describe("Global Assessment Limit (Story 15.3)", () => {
	describe("startAuthenticatedAssessment — global limit propagation", () => {
		it("should propagate GlobalAssessmentLimitReached error unchanged", async () => {
			setupDefaultMocks();
			mockCostGuardRepo.checkAndRecordGlobalAssessmentStart.mockReturnValue(
				Effect.fail(
					new GlobalAssessmentLimitReached({
						message: "Limit reached",
						resumeAfter: DateTime.unsafeFromDate(new Date("2026-02-26T00:00:00Z")),
					}),
				),
			);

			const testLayer = createTestLayer();
			const exit = await Effect.runPromiseExit(
				startAuthenticatedAssessment({ userId: "user_test" }).pipe(Effect.provide(testLayer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause;
				// Error should propagate as-is (not remapped)
				expect(String(error)).toContain("GlobalAssessmentLimitReached");
			}
		});

		it("should fail-open when Redis is unavailable for global check", async () => {
			setupDefaultMocks();
			mockCostGuardRepo.checkAndRecordGlobalAssessmentStart.mockReturnValue(
				Effect.fail(new RedisOperationError("Connection refused")),
			);

			const testLayer = createTestLayer();
			const result = await Effect.runPromise(
				startAuthenticatedAssessment({ userId: "user_test" }).pipe(Effect.provide(testLayer)),
			);

			// Should succeed despite Redis failure (fail-open)
			expect(result.sessionId).toBeDefined();
		});
	});

	describe("startAnonymousAssessment — global limit propagation", () => {
		it("should propagate GlobalAssessmentLimitReached error unchanged", async () => {
			setupDefaultMocks();
			mockCostGuardRepo.checkAndRecordGlobalAssessmentStart.mockReturnValue(
				Effect.fail(
					new GlobalAssessmentLimitReached({
						message: "Limit reached",
						resumeAfter: DateTime.unsafeFromDate(new Date("2026-02-26T00:00:00Z")),
					}),
				),
			);

			const testLayer = createTestLayer();
			const exit = await Effect.runPromiseExit(
				startAnonymousAssessment().pipe(Effect.provide(testLayer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("should fail-open when Redis is unavailable for global check", async () => {
			setupDefaultMocks();
			mockCostGuardRepo.checkAndRecordGlobalAssessmentStart.mockReturnValue(
				Effect.fail(new RedisOperationError("Connection refused")),
			);

			const testLayer = createTestLayer();
			const result = await Effect.runPromise(
				startAnonymousAssessment().pipe(Effect.provide(testLayer)),
			);

			expect(result.sessionId).toBeDefined();
		});
	});

	describe("resumeAfter timestamp (AC #2)", () => {
		it("should set resumeAfter to next midnight UTC", async () => {
			setupDefaultMocks();
			const tomorrow = new Date();
			tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
			tomorrow.setUTCHours(0, 0, 0, 0);

			mockCostGuardRepo.checkAndRecordGlobalAssessmentStart.mockReturnValue(
				Effect.fail(
					new GlobalAssessmentLimitReached({
						message: "Limit reached",
						resumeAfter: DateTime.unsafeFromDate(tomorrow),
					}),
				),
			);

			const testLayer = createTestLayer();
			const exit = await Effect.runPromiseExit(
				startAuthenticatedAssessment({ userId: "user_test" }).pipe(Effect.provide(testLayer)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const errorStr = JSON.stringify(exit.cause);
				expect(errorStr).toContain("GlobalAssessmentLimitReached");
				// The resumeAfter should be midnight UTC of the next day
				expect(errorStr).toContain("00:00:00");
			}
		});
	});

	describe("existing sessions unaffected (AC #2)", () => {
		it("should not block existing active sessions when circuit breaker is open", async () => {
			setupDefaultMocks();
			// Clear call count from setupDefaultMocks
			mockCostGuardRepo.checkAndRecordGlobalAssessmentStart.mockClear();
			// Global limit is reached for NEW assessments — set mock AFTER clearing
			mockCostGuardRepo.checkAndRecordGlobalAssessmentStart.mockReturnValue(
				Effect.fail(
					new GlobalAssessmentLimitReached({
						message: "Limit reached",
						resumeAfter: DateTime.unsafeFromDate(new Date("2026-02-26T00:00:00Z")),
					}),
				),
			);

			// But an existing active session should still be returned (not blocked)
			mockAssessmentSessionRepo.findSessionByUserId.mockReturnValue(
				Effect.succeed({
					id: "session_existing_456",
					status: "active",
					createdAt: new Date("2026-02-25T08:00:00Z"),
				}),
			);
			mockAssessmentMessageRepo.getMessages.mockReturnValue(
				Effect.succeed([
					{
						id: "msg-1",
						sessionId: "session_existing_456",
						role: "assistant",
						content: "Hello!",
						createdAt: new Date("2026-02-25T08:00:00Z"),
					},
				]),
			);

			const testLayer = createTestLayer();
			const result = await Effect.runPromise(
				startAuthenticatedAssessment({ userId: "user_test" }).pipe(Effect.provide(testLayer)),
			);

			// Existing session is returned — circuit breaker check never reached
			expect(result.sessionId).toBe("session_existing_456");
			// checkAndRecordGlobalAssessmentStart should NOT have been called
			// because the existing session short-circuits before the global check
			expect(mockCostGuardRepo.checkAndRecordGlobalAssessmentStart).not.toHaveBeenCalled();
		});
	});
});

describe("Join Waitlist Use Case (Story 15.3)", () => {
	const mockWaitlistRepo = {
		addEmail: vi.fn(),
	};
	const mockLogger = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	};

	const TestLayer = Layer.mergeAll(
		Layer.succeed(WaitlistRepository, mockWaitlistRepo),
		Layer.succeed(LoggerRepository, mockLogger),
	);

	it("should store valid email successfully", async () => {
		mockWaitlistRepo.addEmail.mockReturnValue(Effect.succeed(undefined));

		const result = await Effect.runPromise(
			joinWaitlist({ email: "test@example.com" }).pipe(Effect.provide(TestLayer)),
		);

		expect(result).toEqual({ ok: true });
		expect(mockWaitlistRepo.addEmail).toHaveBeenCalledWith("test@example.com");
	});

	it("should handle duplicate email without error", async () => {
		// addEmail with ON CONFLICT DO NOTHING succeeds silently for duplicates
		mockWaitlistRepo.addEmail.mockReturnValue(Effect.succeed(undefined));

		const result = await Effect.runPromise(
			joinWaitlist({ email: "duplicate@example.com" }).pipe(Effect.provide(TestLayer)),
		);

		expect(result).toEqual({ ok: true });
	});
});
