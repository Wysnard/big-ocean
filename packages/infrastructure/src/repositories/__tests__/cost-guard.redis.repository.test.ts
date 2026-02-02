/**
 * CostGuard Repository Tests
 *
 * Tests for cost tracking and rate limiting operations.
 * Uses test implementation (in-memory) for unit tests.
 */

import { CostGuardRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import {
	CostGuardTestRepositoryLive,
	createTestCostGuardRepository,
} from "../cost-guard.redis.repository";

describe("CostGuard Repository", () => {
	describe("Daily Cost Tracking", () => {
		it("should increment daily cost atomically", async () => {
			const testRepo = createTestCostGuardRepository();
			const testLayer = Layer.succeed(CostGuardRepository, testRepo);

			const program = Effect.gen(function* () {
				const costGuard = yield* CostGuardRepository;

				// First increment
				const first = yield* costGuard.incrementDailyCost("user_test", 100);
				expect(first).toBe(100);

				// Second increment
				const second = yield* costGuard.incrementDailyCost("user_test", 50);
				expect(second).toBe(150);

				return second;
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
			expect(result).toBe(150);
		});

		it("should get current daily cost", async () => {
			const testRepo = createTestCostGuardRepository();
			const testLayer = Layer.succeed(CostGuardRepository, testRepo);

			const program = Effect.gen(function* () {
				const costGuard = yield* CostGuardRepository;

				yield* costGuard.incrementDailyCost("user_get_test", 200);
				const cost = yield* costGuard.getDailyCost("user_get_test");

				expect(cost).toBe(200);
				return cost;
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
			expect(result).toBe(200);
		});

		it("should return 0 for user with no cost", async () => {
			const program = Effect.gen(function* () {
				const costGuard = yield* CostGuardRepository;
				const cost = yield* costGuard.getDailyCost("user_no_cost");
				expect(cost).toBe(0);
				return cost;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(CostGuardTestRepositoryLive)),
			);
			expect(result).toBe(0);
		});

		it("should track costs separately per user", async () => {
			const testRepo = createTestCostGuardRepository();
			const testLayer = Layer.succeed(CostGuardRepository, testRepo);

			const program = Effect.gen(function* () {
				const costGuard = yield* CostGuardRepository;

				yield* costGuard.incrementDailyCost("user_a", 100);
				yield* costGuard.incrementDailyCost("user_b", 200);

				const costA = yield* costGuard.getDailyCost("user_a");
				const costB = yield* costGuard.getDailyCost("user_b");

				expect(costA).toBe(100);
				expect(costB).toBe(200);

				return { costA, costB };
			});

			await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
		});
	});

	describe("Assessment Count Tracking", () => {
		it("should increment assessment count", async () => {
			const testRepo = createTestCostGuardRepository();
			const testLayer = Layer.succeed(CostGuardRepository, testRepo);

			const program = Effect.gen(function* () {
				const costGuard = yield* CostGuardRepository;

				const count1 = yield* costGuard.incrementAssessmentCount("user_assess");
				expect(count1).toBe(1);

				const count2 = yield* costGuard.incrementAssessmentCount("user_assess");
				expect(count2).toBe(2);

				return count2;
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
			expect(result).toBe(2);
		});

		it("should get current assessment count", async () => {
			const testRepo = createTestCostGuardRepository();
			const testLayer = Layer.succeed(CostGuardRepository, testRepo);

			const program = Effect.gen(function* () {
				const costGuard = yield* CostGuardRepository;

				yield* costGuard.incrementAssessmentCount("user_count");
				yield* costGuard.incrementAssessmentCount("user_count");
				yield* costGuard.incrementAssessmentCount("user_count");

				const count = yield* costGuard.getAssessmentCount("user_count");
				expect(count).toBe(3);

				return count;
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
			expect(result).toBe(3);
		});

		it("should return 0 for user with no assessments", async () => {
			const program = Effect.gen(function* () {
				const costGuard = yield* CostGuardRepository;
				const count = yield* costGuard.getAssessmentCount("user_no_assess");
				expect(count).toBe(0);
				return count;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(CostGuardTestRepositoryLive)),
			);
			expect(result).toBe(0);
		});

		it("should track assessments separately per user", async () => {
			const testRepo = createTestCostGuardRepository();
			const testLayer = Layer.succeed(CostGuardRepository, testRepo);

			const program = Effect.gen(function* () {
				const costGuard = yield* CostGuardRepository;

				yield* costGuard.incrementAssessmentCount("user_x");
				yield* costGuard.incrementAssessmentCount("user_y");
				yield* costGuard.incrementAssessmentCount("user_y");

				const countX = yield* costGuard.getAssessmentCount("user_x");
				const countY = yield* costGuard.getAssessmentCount("user_y");

				expect(countX).toBe(1);
				expect(countY).toBe(2);

				return { countX, countY };
			});

			await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
		});
	});

	describe("Combined Operations", () => {
		it("should handle both cost and assessment tracking for same user", async () => {
			const testRepo = createTestCostGuardRepository();
			const testLayer = Layer.succeed(CostGuardRepository, testRepo);

			const program = Effect.gen(function* () {
				const costGuard = yield* CostGuardRepository;

				// Track cost
				yield* costGuard.incrementDailyCost("user_combined", 150);

				// Track assessment
				yield* costGuard.incrementAssessmentCount("user_combined");

				// Verify both
				const cost = yield* costGuard.getDailyCost("user_combined");
				const count = yield* costGuard.getAssessmentCount("user_combined");

				expect(cost).toBe(150);
				expect(count).toBe(1);

				return { cost, count };
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
			expect(result.cost).toBe(150);
			expect(result.count).toBe(1);
		});

		it("should handle high volume of increments", async () => {
			const testRepo = createTestCostGuardRepository();
			const testLayer = Layer.succeed(CostGuardRepository, testRepo);

			const program = Effect.gen(function* () {
				const costGuard = yield* CostGuardRepository;

				// Simulate 100 API calls with cost increments
				for (let i = 0; i < 100; i++) {
					yield* costGuard.incrementDailyCost("user_volume", 5);
					yield* costGuard.incrementAssessmentCount("user_volume");
				}

				const cost = yield* costGuard.getDailyCost("user_volume");
				const count = yield* costGuard.getAssessmentCount("user_volume");

				expect(cost).toBe(500); // 100 * 5 cents
				expect(count).toBe(100);

				return { cost, count };
			});

			const result = await Effect.runPromise(program.pipe(Effect.provide(testLayer)));
			expect(result.cost).toBe(500);
			expect(result.count).toBe(100);
		});
	});
});
