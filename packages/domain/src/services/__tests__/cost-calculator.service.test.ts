/**
 * Cost Calculator Tests
 *
 * TDD tests for cost calculation utility.
 * Updated for Haiku 4.5 pricing (Story 10.6):
 * Formula: (inputTokens / 1M * $1.00) + (outputTokens / 1M * $5.00)
 */

import { describe, expect, it } from "vitest";
import { calculateCost } from "../cost-calculator.service";

describe("calculateCost", () => {
	describe("Basic cost calculation", () => {
		it("should calculate cost correctly for 1000 input + 500 output tokens", () => {
			const result = calculateCost(1000, 500);

			// Input: 1000 / 1M * 1.0 = 0.001
			// Output: 500 / 1M * 5.0 = 0.0025
			// Total: 0.0035
			expect(result.inputCost).toBeCloseTo(0.001, 10);
			expect(result.outputCost).toBeCloseTo(0.0025, 10);
			expect(result.totalCost).toBeCloseTo(0.0035, 10);
		});

		it("should calculate cost for realistic assessment (12000 input + 3000 output tokens)", () => {
			const result = calculateCost(12000, 3000);

			// Input: 12000 / 1M * 1.0 = 0.012
			// Output: 3000 / 1M * 5.0 = 0.015
			// Total: 0.027
			expect(result.inputCost).toBeCloseTo(0.012, 10);
			expect(result.outputCost).toBeCloseTo(0.015, 10);
			expect(result.totalCost).toBeCloseTo(0.027, 10);
		});

		it("should return totalCents rounded up to nearest cent", () => {
			// 1000 input + 500 output = $0.0035 = 0.35 cents -> rounds up to 1 cent
			const result = calculateCost(1000, 500);
			expect(result.totalCents).toBe(1);
		});

		it("should return 0 cents for 0 tokens", () => {
			const result = calculateCost(0, 0);
			expect(result.inputCost).toBe(0);
			expect(result.outputCost).toBe(0);
			expect(result.totalCost).toBe(0);
			expect(result.totalCents).toBe(0);
		});
	});

	describe("Large token counts", () => {
		it("should calculate cost for 1 million input tokens", () => {
			const result = calculateCost(1_000_000, 0);

			// 1M / 1M * 1.0 = 1.0 = $1.00 = 100 cents
			expect(result.inputCost).toBeCloseTo(1.0, 10);
			expect(result.outputCost).toBe(0);
			expect(result.totalCost).toBeCloseTo(1.0, 10);
			expect(result.totalCents).toBe(100);
		});

		it("should calculate cost for 1 million output tokens", () => {
			const result = calculateCost(0, 1_000_000);

			// 1M / 1M * 5.0 = 5.0 = $5.00 = 500 cents
			expect(result.inputCost).toBe(0);
			expect(result.outputCost).toBeCloseTo(5.0, 10);
			expect(result.totalCost).toBeCloseTo(5.0, 10);
			expect(result.totalCents).toBe(500);
		});

		it("should calculate cost for expensive session (100K input + 50K output)", () => {
			const result = calculateCost(100_000, 50_000);

			// Input: 100000 / 1M * 1.0 = 0.1
			// Output: 50000 / 1M * 5.0 = 0.25
			// Total: 0.35 = $0.35 = 35 cents
			expect(result.inputCost).toBeCloseTo(0.1, 10);
			expect(result.outputCost).toBeCloseTo(0.25, 10);
			expect(result.totalCost).toBeCloseTo(0.35, 10);
			expect(result.totalCents).toBe(35);
		});
	});

	describe("Cost breakdown structure", () => {
		it("should return all required fields", () => {
			const result = calculateCost(1000, 500);

			expect(result).toHaveProperty("inputCost");
			expect(result).toHaveProperty("outputCost");
			expect(result).toHaveProperty("totalCost");
			expect(result).toHaveProperty("totalCents");
		});

		it("should have totalCost equal to inputCost + outputCost", () => {
			const result = calculateCost(50000, 25000);

			expect(result.totalCost).toBeCloseTo(result.inputCost + result.outputCost, 10);
		});
	});

	describe("Edge cases", () => {
		it("should handle only input tokens", () => {
			const result = calculateCost(10000, 0);

			expect(result.inputCost).toBeGreaterThan(0);
			expect(result.outputCost).toBe(0);
			expect(result.totalCost).toBe(result.inputCost);
		});

		it("should handle only output tokens", () => {
			const result = calculateCost(0, 10000);

			expect(result.inputCost).toBe(0);
			expect(result.outputCost).toBeGreaterThan(0);
			expect(result.totalCost).toBe(result.outputCost);
		});

		it("should handle very large token counts without overflow", () => {
			const result = calculateCost(10_000_000, 5_000_000);

			// Input: 10M / 1M * 1.0 = 10.0
			// Output: 5M / 1M * 5.0 = 25.0
			// Total: 35.0 = $35.00 = 3500 cents
			expect(result.inputCost).toBeCloseTo(10.0, 10);
			expect(result.outputCost).toBeCloseTo(25.0, 10);
			expect(result.totalCost).toBeCloseTo(35.0, 10);
			expect(result.totalCents).toBe(3500);
		});
	});
});
