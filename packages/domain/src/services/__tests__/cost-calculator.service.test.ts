/**
 * Cost Calculator Tests
 *
 * TDD tests for cost calculation utility.
 * Supports per-model pricing: Haiku 4.5, Sonnet 4.x, Opus 4.5/4.6.
 * Default (no modelId) uses Opus 4.6 pricing (worst-case overestimate).
 */

import { describe, expect, it } from "vitest";
import { calculateCost, getPricingForModel } from "../cost-calculator.service";

describe("getPricingForModel", () => {
	it("should return Haiku 4.5 pricing", () => {
		const pricing = getPricingForModel("claude-haiku-4-5-20251001");
		expect(pricing.inputPerMillion).toBe(1.0);
		expect(pricing.outputPerMillion).toBe(5.0);
	});

	it("should return Sonnet 4 pricing", () => {
		const pricing = getPricingForModel("claude-sonnet-4-20250514");
		expect(pricing.inputPerMillion).toBe(3.0);
		expect(pricing.outputPerMillion).toBe(15.0);
	});

	it("should return Sonnet 4.6 pricing (matches claude-sonnet-4 prefix)", () => {
		const pricing = getPricingForModel("claude-sonnet-4-6-20260501");
		expect(pricing.inputPerMillion).toBe(3.0);
		expect(pricing.outputPerMillion).toBe(15.0);
	});

	it("should return Opus 4.5 pricing", () => {
		const pricing = getPricingForModel("claude-opus-4-5-20250901");
		expect(pricing.inputPerMillion).toBe(5.0);
		expect(pricing.outputPerMillion).toBe(25.0);
	});

	it("should return Opus 4.6 pricing", () => {
		const pricing = getPricingForModel("claude-opus-4-6-20260301");
		expect(pricing.inputPerMillion).toBe(5.0);
		expect(pricing.outputPerMillion).toBe(25.0);
	});

	it("should return Opus 4.1 pricing (legacy, more expensive)", () => {
		const pricing = getPricingForModel("claude-opus-4-1-20250301");
		expect(pricing.inputPerMillion).toBe(15.0);
		expect(pricing.outputPerMillion).toBe(75.0);
	});

	it("should return Haiku 3.5 pricing", () => {
		const pricing = getPricingForModel("claude-haiku-3-5-20240307");
		expect(pricing.inputPerMillion).toBe(0.8);
		expect(pricing.outputPerMillion).toBe(4.0);
	});

	it("should return default (Opus 4.6) pricing for unknown models", () => {
		const pricing = getPricingForModel("some-unknown-model");
		expect(pricing.inputPerMillion).toBe(5.0);
		expect(pricing.outputPerMillion).toBe(25.0);
	});
});

describe("calculateCost", () => {
	describe("Default pricing (Opus 4.6 — worst case)", () => {
		it("should use Opus 4.6 pricing when no modelId is provided", () => {
			const result = calculateCost(1_000_000, 1_000_000);

			// Input: 1M / 1M * 5.0 = 5.0
			// Output: 1M / 1M * 25.0 = 25.0
			expect(result.inputCost).toBeCloseTo(5.0, 10);
			expect(result.outputCost).toBeCloseTo(25.0, 10);
			expect(result.totalCost).toBeCloseTo(30.0, 10);
			expect(result.totalCents).toBe(3000);
		});

		it("should return 0 cents for 0 tokens", () => {
			const result = calculateCost(0, 0);
			expect(result.totalCost).toBe(0);
			expect(result.totalCents).toBe(0);
		});
	});

	describe("Per-model pricing", () => {
		it("should calculate Haiku 4.5 cost ($1/$5 per MTok)", () => {
			const result = calculateCost(12000, 3000, "claude-haiku-4-5-20251001");

			// Input: 12000 / 1M * 1.0 = 0.012
			// Output: 3000 / 1M * 5.0 = 0.015
			expect(result.inputCost).toBeCloseTo(0.012, 10);
			expect(result.outputCost).toBeCloseTo(0.015, 10);
			expect(result.totalCost).toBeCloseTo(0.027, 10);
			expect(result.totalCents).toBe(3);
		});

		it("should calculate Sonnet 4 cost ($3/$15 per MTok)", () => {
			const result = calculateCost(12000, 3000, "claude-sonnet-4-20250514");

			// Input: 12000 / 1M * 3.0 = 0.036
			// Output: 3000 / 1M * 15.0 = 0.045
			expect(result.inputCost).toBeCloseTo(0.036, 10);
			expect(result.outputCost).toBeCloseTo(0.045, 10);
			expect(result.totalCost).toBeCloseTo(0.081, 10);
			expect(result.totalCents).toBe(9);
		});

		it("should calculate Sonnet 4.6 cost ($3/$15 per MTok)", () => {
			const result = calculateCost(12000, 3000, "claude-sonnet-4-6-20260501");

			expect(result.inputCost).toBeCloseTo(0.036, 10);
			expect(result.outputCost).toBeCloseTo(0.045, 10);
			expect(result.totalCost).toBeCloseTo(0.081, 10);
		});

		it("should calculate Opus 4.6 cost ($5/$25 per MTok)", () => {
			const result = calculateCost(12000, 3000, "claude-opus-4-6-20260301");

			// Input: 12000 / 1M * 5.0 = 0.06
			// Output: 3000 / 1M * 25.0 = 0.075
			expect(result.inputCost).toBeCloseTo(0.06, 10);
			expect(result.outputCost).toBeCloseTo(0.075, 10);
			expect(result.totalCost).toBeCloseTo(0.135, 10);
		});
	});

	describe("Cost breakdown structure", () => {
		it("should return all required fields", () => {
			const result = calculateCost(1000, 500, "claude-haiku-4-5-20251001");

			expect(result).toHaveProperty("inputCost");
			expect(result).toHaveProperty("outputCost");
			expect(result).toHaveProperty("totalCost");
			expect(result).toHaveProperty("totalCents");
		});

		it("should have totalCost equal to inputCost + outputCost", () => {
			const result = calculateCost(50000, 25000, "claude-sonnet-4-20250514");

			expect(result.totalCost).toBeCloseTo(result.inputCost + result.outputCost, 10);
		});

		it("should round totalCents up to nearest cent", () => {
			// Haiku: 1000 input + 500 output = $0.0035 = 0.35 cents -> rounds up to 1 cent
			const result = calculateCost(1000, 500, "claude-haiku-4-5-20251001");
			expect(result.totalCents).toBe(1);
		});
	});

	describe("Edge cases", () => {
		it("should handle only input tokens", () => {
			const result = calculateCost(10000, 0, "claude-haiku-4-5-20251001");
			expect(result.inputCost).toBeGreaterThan(0);
			expect(result.outputCost).toBe(0);
		});

		it("should handle only output tokens", () => {
			const result = calculateCost(0, 10000, "claude-haiku-4-5-20251001");
			expect(result.inputCost).toBe(0);
			expect(result.outputCost).toBeGreaterThan(0);
		});

		it("should handle very large token counts without overflow", () => {
			const result = calculateCost(10_000_000, 5_000_000, "claude-haiku-4-5-20251001");

			// Input: 10M / 1M * 1.0 = 10.0
			// Output: 5M / 1M * 5.0 = 25.0
			expect(result.inputCost).toBeCloseTo(10.0, 10);
			expect(result.outputCost).toBeCloseTo(25.0, 10);
			expect(result.totalCents).toBe(3500);
		});
	});
});
