import { describe, expect, it } from "@effect/vitest";
import type { LifeDomain } from "../../constants/life-domain";
import {
	computeContextMean,
	computeContextWeight,
	computeNormalizedEntropy,
	computeProjectedEntropy,
} from "../formula";

// ─── Helper function tests ───────────────────────────────────────────

describe("computeContextWeight", () => {
	it("returns 0 for empty array", () => {
		expect(computeContextWeight([])).toBe(0);
	});

	it("returns √(sum) for confidences", () => {
		expect(computeContextWeight([0.4, 0.6])).toBeCloseTo(Math.sqrt(1.0), 10);
	});
});

describe("computeContextMean", () => {
	it("computes weighted mean", () => {
		const result = computeContextMean([10, 15], [0.8, 0.2]);
		expect(result).toBeCloseTo((0.8 * 10 + 0.2 * 15) / (0.8 + 0.2), 5);
	});

	it("handles zero confidences with epsilon safety", () => {
		const result = computeContextMean([10], [0]);
		expect(Number.isFinite(result)).toBe(true);
	});
});

describe("computeNormalizedEntropy", () => {
	it("returns 0 for empty weights", () => {
		expect(computeNormalizedEntropy([])).toBe(0);
	});

	it("returns 0 for single domain", () => {
		expect(computeNormalizedEntropy([1.5])).toBe(0);
	});

	it("returns 1 for perfectly balanced domains", () => {
		expect(computeNormalizedEntropy([1, 1, 1, 1])).toBeCloseTo(1, 10);
	});

	it("returns value between 0 and 1 for unbalanced", () => {
		const result = computeNormalizedEntropy([10, 1]);
		expect(result).toBeGreaterThan(0);
		expect(result).toBeLessThan(1);
	});

	it("skips zero-weight domains", () => {
		expect(computeNormalizedEntropy([1, 0, 1])).toBeCloseTo(1, 10);
	});
});

describe("computeProjectedEntropy", () => {
	it("increases entropy when adding to new domain", () => {
		const weights = new Map<LifeDomain, number>([["work", 1.0]]);
		const result = computeProjectedEntropy(weights, "leisure", 1.0);
		expect(result).toBeCloseTo(1, 10); // two equal → entropy 1
	});

	it("adds domain if not in map", () => {
		const weights = new Map<LifeDomain, number>([["work", 1.0]]);
		const result = computeProjectedEntropy(weights, "family", 0.5);
		expect(result).toBeGreaterThan(0);
	});
});
