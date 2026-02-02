/**
 * Cost Calculator Tests
 *
 * TDD tests for cost calculation utility.
 * Formula: (inputTokens / 1M * $0.003) + (outputTokens / 1M * $0.015)
 */

import { describe, expect, it } from "vitest";
import { calculateCost } from "../cost-calculator.service.js";

describe("calculateCost", () => {
  describe("Basic cost calculation", () => {
    it("should calculate cost correctly for 1000 input + 500 output tokens", () => {
      const result = calculateCost(1000, 500);

      // Input: 1000 / 1M * 0.003 = 0.000003
      // Output: 500 / 1M * 0.015 = 0.0000075
      // Total: 0.0000105
      expect(result.inputCost).toBeCloseTo(0.000003, 10);
      expect(result.outputCost).toBeCloseTo(0.0000075, 10);
      expect(result.totalCost).toBeCloseTo(0.0000105, 10);
    });

    it("should calculate cost for realistic assessment (12000 input + 3000 output tokens)", () => {
      const result = calculateCost(12000, 3000);

      // Input: 12000 / 1M * 0.003 = 0.000036
      // Output: 3000 / 1M * 0.015 = 0.000045
      // Total: 0.000081
      expect(result.inputCost).toBeCloseTo(0.000036, 10);
      expect(result.outputCost).toBeCloseTo(0.000045, 10);
      expect(result.totalCost).toBeCloseTo(0.000081, 10);
    });

    it("should return totalCents rounded up to nearest cent", () => {
      // Very small amounts should round up to at least 1 cent
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

      // 1M / 1M * 0.003 = 0.003 = $0.003 = 0.3 cents → rounds to 1 cent
      expect(result.inputCost).toBeCloseTo(0.003, 10);
      expect(result.outputCost).toBe(0);
      expect(result.totalCost).toBeCloseTo(0.003, 10);
      expect(result.totalCents).toBe(1); // Rounds up 0.3 → 1
    });

    it("should calculate cost for 1 million output tokens", () => {
      const result = calculateCost(0, 1_000_000);

      // 1M / 1M * 0.015 = 0.015 = $0.015 = 1.5 cents → rounds to 2 cents
      expect(result.inputCost).toBe(0);
      expect(result.outputCost).toBeCloseTo(0.015, 10);
      expect(result.totalCost).toBeCloseTo(0.015, 10);
      expect(result.totalCents).toBe(2); // Rounds up 1.5 → 2
    });

    it("should calculate cost for expensive session (100K input + 50K output)", () => {
      const result = calculateCost(100_000, 50_000);

      // Input: 100000 / 1M * 0.003 = 0.0003
      // Output: 50000 / 1M * 0.015 = 0.00075
      // Total: 0.00105 = $0.00105 = 0.105 cents → rounds to 1 cent
      expect(result.inputCost).toBeCloseTo(0.0003, 10);
      expect(result.outputCost).toBeCloseTo(0.00075, 10);
      expect(result.totalCost).toBeCloseTo(0.00105, 10);
      expect(result.totalCents).toBe(1);
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

      expect(result.totalCost).toBeCloseTo(
        result.inputCost + result.outputCost,
        10,
      );
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

      // Input: 10M / 1M * 0.003 = 0.03
      // Output: 5M / 1M * 0.015 = 0.075
      // Total: 0.105 = 10.5 cents → rounds to 11 cents
      expect(result.inputCost).toBeCloseTo(0.03, 10);
      expect(result.outputCost).toBeCloseTo(0.075, 10);
      expect(result.totalCost).toBeCloseTo(0.105, 10);
      expect(result.totalCents).toBe(11);
    });
  });
});
