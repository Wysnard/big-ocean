/**
 * Effect-ts Testing Patterns
 *
 * Demonstrates how to test Effect-based services following the project's patterns.
 */

import { Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import {
	createTestSession,
	mockAnalyzer,
	mockCostGuard,
	mockDatabase,
	mockNerin,
	mockRateLimiter,
	mockScorer,
} from "../test-utils";

describe("Effect-ts Service Testing", () => {
	describe("Effect.succeed - Successful Operations", () => {
		it("should create Effect that succeeds with a value", async () => {
			const effect = Effect.succeed(42);
			const result = await Effect.runPromise(effect);

			expect(result).toBe(42);
		});

		it("should handle async operations with Effect.promise", async () => {
			const asyncOp = () => Promise.resolve("completed");
			const effect = Effect.promise(asyncOp);

			const result = await Effect.runPromise(effect);
			expect(result).toBe("completed");
		});
	});

	describe("Effect.gen - Generator-based Flow Control", () => {
		it("should chain multiple effects in sequence", async () => {
			const flow = Effect.gen(function* () {
				const a = yield* Effect.succeed(10);
				const b = yield* Effect.succeed(20);
				return a + b;
			});

			const result = await Effect.runPromise(flow);
			expect(result).toBe(30);
		});

		it("should handle errors in effect chains", async () => {
			const flow = Effect.gen(function* () {
				const value = yield* Effect.succeed(10);
				if (value < 20) {
					return yield* Effect.fail("Value too low");
				}
				return value;
			});

			const exit = await Effect.runPromiseExit(flow);

			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				expect(exit.cause._tag).toBe("Fail");
			}
		});
	});

	describe("Mock Service Integration", () => {
		it("should use mockNerin for conversational testing", async () => {
			const userMessage = "I love trying new experiences";
			const response = await Effect.runPromise(mockNerin(userMessage));

			expect(response).toContain("Thank you for sharing");
			expect(response).toContain(userMessage);
		});

		it("should use mockAnalyzer for pattern extraction", async () => {
			const messages = ["I love trying new experiences", "I always plan ahead carefully"];
			const analysis = await Effect.runPromise(mockAnalyzer(messages));

			expect(analysis).toHaveProperty("patterns");
			expect(analysis).toHaveProperty("contradictions");
			expect(analysis).toHaveProperty("confidence");
			expect(Array.isArray(analysis.patterns)).toBe(true);
			expect(analysis.confidence).toBeGreaterThan(0);
			expect(analysis.confidence).toBeLessThanOrEqual(1);
		});

		it("should use mockScorer for trait scoring", async () => {
			const messages = ["I prefer routine", "I enjoy social gatherings"];
			const scores = await Effect.runPromise(mockScorer(messages));

			expect(scores).toHaveProperty("openness");
			expect(scores).toHaveProperty("conscientiousness");
			expect(scores).toHaveProperty("extraversion");
			expect(scores).toHaveProperty("agreeableness");
			expect(scores).toHaveProperty("neuroticism");

			// All scores should be between 0 and 1
			Object.values(scores).forEach((score) => {
				expect(score).toBeGreaterThanOrEqual(0);
				expect(score).toBeLessThanOrEqual(1);
			});
		});
	});

	describe("Database Mock Testing", () => {
		it("should insert and retrieve session", async () => {
			const db = mockDatabase();
			const session = createTestSession({ userId: "user_123" });

			await Effect.runPromise(db.sessions.insert(session));
			const retrieved = await Effect.runPromise(db.sessions.findById(session.id));

			expect(retrieved).toEqual(session);
		});

		it("should find sessions by user ID", async () => {
			const db = mockDatabase();
			const session1 = createTestSession({ userId: "user_123" });
			const session2 = createTestSession({ userId: "user_123" });
			const session3 = createTestSession({ userId: "user_456" });

			await Effect.runPromise(
				Effect.all([
					db.sessions.insert(session1),
					db.sessions.insert(session2),
					db.sessions.insert(session3),
				]),
			);

			const user123Sessions = await Effect.runPromise(db.sessions.findByUserId("user_123"));

			expect(user123Sessions).toHaveLength(2);
			expect(user123Sessions.map((s) => s.id)).toContain(session1.id);
			expect(user123Sessions.map((s) => s.id)).toContain(session2.id);
		});

		it("should delete session", async () => {
			const db = mockDatabase();
			const session = createTestSession();

			await Effect.runPromise(db.sessions.insert(session));
			await Effect.runPromise(db.sessions.delete(session.id));

			const retrieved = await Effect.runPromise(db.sessions.findById(session.id));
			expect(retrieved).toBeUndefined();
		});
	});

	describe("Cost Guard Testing", () => {
		it("should track token usage and update budget", async () => {
			const costGuard = mockCostGuard();

			const initialBudget = await Effect.runPromise(costGuard.getRemainingBudget());
			expect(initialBudget).toBe(75.0);

			await Effect.runPromise(costGuard.trackUsage({ input: 1000, output: 500 }));

			const remainingBudget = await Effect.runPromise(costGuard.getRemainingBudget());
			expect(remainingBudget).toBeLessThan(initialBudget);
		});
	});

	describe("Rate Limiter Testing", () => {
		it("should allow requests under limit", async () => {
			const limiter = mockRateLimiter();

			const allowed = await Effect.runPromise(limiter.checkLimit("user_123"));
			expect(allowed).toBe(true);
		});

		it("should record requests", async () => {
			const limiter = mockRateLimiter();

			await Effect.runPromise(limiter.recordRequest("user_123"));
			await Effect.runPromise(limiter.recordRequest("user_123"));

			// Should still be under limit (100 max)
			const allowed = await Effect.runPromise(limiter.checkLimit("user_123"));
			expect(allowed).toBe(true);
		});
	});
});
