/**
 * CostGuard Rate Limiting Tests
 *
 * Tests for rate limiting methods in CostGuard repository.
 * Uses in-memory test implementation for deterministic testing.
 */

import { describe, expect, it } from "@effect/vitest";
import { RateLimitExceeded } from "@workspace/contracts";
import { CostGuardRepository } from "@workspace/domain";
import { DateTime, Effect, Layer } from "effect";
import { createTestCostGuardRepository } from "../cost-guard.redis.repository";

// Create fresh layer for each test to avoid state pollution
const TestLayer = Layer.effect(CostGuardRepository, Effect.sync(createTestCostGuardRepository));

describe("CostGuardRepository - Rate Limiting", () => {
	it.effect("allows first assessment of the day", () =>
		Effect.gen(function* () {
			const costGuard = yield* CostGuardRepository;

			// Check if can start (should be true for first assessment)
			const canStart = yield* costGuard.canStartAssessment("user_123");
			expect(canStart).toBe(true);

			// Record assessment start
			yield* costGuard.recordAssessmentStart("user_123");

			// Verify count incremented
			const count = yield* costGuard.getAssessmentCount("user_123");
			expect(count).toBe(1);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("blocks second assessment on same day", () =>
		Effect.gen(function* () {
			const costGuard = yield* CostGuardRepository;

			// First assessment
			yield* costGuard.recordAssessmentStart("user_123");

			// Check if can start second (should be false)
			const canStart = yield* costGuard.canStartAssessment("user_123");
			expect(canStart).toBe(false);

			// Attempt second assessment (should fail with RateLimitExceeded)
			const error = yield* costGuard.recordAssessmentStart("user_123").pipe(Effect.flip);

			expect(error).toBeInstanceOf(RateLimitExceeded);
			const rateLimitError = error as RateLimitExceeded;
			expect(rateLimitError.userId).toBe("user_123");
			expect(rateLimitError.message).toContain("tomorrow");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("tracks different users separately", () =>
		Effect.gen(function* () {
			const costGuard = yield* CostGuardRepository;

			// Two users start assessments
			yield* costGuard.recordAssessmentStart("user_123");
			yield* costGuard.recordAssessmentStart("user_456");

			// Each should have count of 1
			const count123 = yield* costGuard.getAssessmentCount("user_123");
			const count456 = yield* costGuard.getAssessmentCount("user_456");

			expect(count123).toBe(1);
			expect(count456).toBe(1);

			// Each user can't start second assessment
			const canStart123 = yield* costGuard.canStartAssessment("user_123");
			const canStart456 = yield* costGuard.canStartAssessment("user_456");

			expect(canStart123).toBe(false);
			expect(canStart456).toBe(false);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("returns correct resetAt timestamp in error", () =>
		Effect.gen(function* () {
			const costGuard = yield* CostGuardRepository;

			// First assessment succeeds
			yield* costGuard.recordAssessmentStart("user_789");

			// Second assessment fails with resetAt
			const error = yield* costGuard.recordAssessmentStart("user_789").pipe(Effect.flip);

			expect(error).toBeInstanceOf(RateLimitExceeded);
			const rateLimitError = error as RateLimitExceeded;
			expect(rateLimitError.resetAt).toBeDefined();
			// resetAt should be tomorrow at midnight UTC
			const resetDate = DateTime.toDateUtc(rateLimitError.resetAt);
			const tomorrow = new Date();
			tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
			tomorrow.setUTCHours(0, 0, 0, 0);
			expect(resetDate.getTime()).toBe(tomorrow.getTime());
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("includes user-friendly message in error", () =>
		Effect.gen(function* () {
			const costGuard = yield* CostGuardRepository;

			// Record first assessment
			yield* costGuard.recordAssessmentStart("user_999");

			// Attempt second (should fail with message)
			const error = yield* costGuard.recordAssessmentStart("user_999").pipe(Effect.flip);

			expect(error).toBeInstanceOf(RateLimitExceeded);
			const rateLimitError = error as RateLimitExceeded;
			expect(rateLimitError.message).toContain("tomorrow");
			expect(rateLimitError.message).toContain("assessment");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("canStartAssessment returns false when count equals limit", () =>
		Effect.gen(function* () {
			const costGuard = yield* CostGuardRepository;

			// Before any assessments
			const beforeStart = yield* costGuard.canStartAssessment("user_abc");
			expect(beforeStart).toBe(true);

			// Record assessment (count = 1, limit = 1)
			yield* costGuard.recordAssessmentStart("user_abc");

			// After assessment started (count = 1)
			const afterStart = yield* costGuard.canStartAssessment("user_abc");
			expect(afterStart).toBe(false);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("handles rapid consecutive checks gracefully", () =>
		Effect.gen(function* () {
			const costGuard = yield* CostGuardRepository;

			// Multiple rapid checks before assessment
			const check1 = yield* costGuard.canStartAssessment("user_rapid");
			const check2 = yield* costGuard.canStartAssessment("user_rapid");
			const check3 = yield* costGuard.canStartAssessment("user_rapid");

			expect(check1).toBe(true);
			expect(check2).toBe(true);
			expect(check3).toBe(true);

			// Record assessment
			yield* costGuard.recordAssessmentStart("user_rapid");

			// Multiple rapid checks after assessment
			const checkAfter1 = yield* costGuard.canStartAssessment("user_rapid");
			const checkAfter2 = yield* costGuard.canStartAssessment("user_rapid");
			const checkAfter3 = yield* costGuard.canStartAssessment("user_rapid");

			expect(checkAfter1).toBe(false);
			expect(checkAfter2).toBe(false);
			expect(checkAfter3).toBe(false);
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("recordAssessmentStart is idempotent-safe (detects overflow)", () =>
		Effect.gen(function* () {
			const costGuard = yield* CostGuardRepository;

			// First call succeeds
			yield* costGuard.recordAssessmentStart("user_idempotent");

			// Second call fails with RateLimitExceeded
			const error = yield* costGuard.recordAssessmentStart("user_idempotent").pipe(Effect.flip);

			expect(error).toBeInstanceOf(RateLimitExceeded);
			const rateLimitError = error as RateLimitExceeded;
			expect(rateLimitError.userId).toBe("user_idempotent");
			expect(rateLimitError.message).toContain("tomorrow");
		}).pipe(Effect.provide(TestLayer)),
	);

	it.effect("error includes all required fields", () =>
		Effect.gen(function* () {
			const costGuard = yield* CostGuardRepository;

			yield* costGuard.recordAssessmentStart("user_fields");
			const error = yield* costGuard.recordAssessmentStart("user_fields").pipe(Effect.flip);

			expect(error).toBeInstanceOf(RateLimitExceeded);
			const rateLimitError = error as RateLimitExceeded;
			expect(rateLimitError.userId).toBe("user_fields");
			expect(rateLimitError.message).toBeTruthy();
			expect(rateLimitError.resetAt).toBeDefined();
		}).pipe(Effect.provide(TestLayer)),
	);
});
