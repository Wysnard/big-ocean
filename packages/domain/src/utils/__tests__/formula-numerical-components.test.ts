import { describe, expect, it } from "@effect/vitest";
import type { LifeDomain } from "../../constants/life-domain";
import {
	computeContextMean,
	computeFacetMetrics,
	computeNormalizedEntropy,
	computeProjectedEntropy,
	FORMULA_DEFAULTS,
} from "../formula";
import { ev, m } from "./__fixtures__/formula-numerical.fixtures";

// ─── Normalized entropy exact values ────────────────────────────────
describe("computeNormalizedEntropy: exact computations", () => {
	it("2 domains [3, 1]: exact entropy value", () => {
		// p1 = 3/4, p2 = 1/4
		// H = -(3/4 ln(3/4) + 1/4 ln(1/4)) / ln(2)
		const H_raw = -(3 / 4) * Math.log(3 / 4) - (1 / 4) * Math.log(1 / 4);
		const expected = H_raw / Math.log(2);
		expect(computeNormalizedEntropy([3, 1])).toBeCloseTo(expected, 10);
	});

	it("3 domains [5, 3, 2]: exact entropy value", () => {
		const total = 10;
		const ps = [5 / total, 3 / total, 2 / total];
		const H_raw = -ps.reduce((s, p) => s + p * Math.log(p), 0);
		const expected = H_raw / Math.log(3);
		expect(computeNormalizedEntropy([5, 3, 2])).toBeCloseTo(expected, 10);
	});

	it("entropy increases as distribution becomes more uniform", () => {
		const skewed = computeNormalizedEntropy([100, 1, 1]);
		const moderate = computeNormalizedEntropy([10, 5, 5]);
		const uniform = computeNormalizedEntropy([5, 5, 5]);
		expect(skewed).toBeLessThan(moderate);
		expect(moderate).toBeLessThan(uniform);
		expect(uniform).toBeCloseTo(1, 10);
	});

	it("all zero weights returns 0", () => {
		expect(computeNormalizedEntropy([0, 0, 0])).toBe(0);
	});
});

// ─── computeProjectedEntropy exact values ───────────────────────────
describe("computeProjectedEntropy: exact computations", () => {
	it("adding equal weight to existing domain preserves entropy of 2 balanced domains", () => {
		const weights = new Map<LifeDomain, number>([
			["work", 1.0],
			["leisure", 1.0],
		]);
		// Adding 1.0 to work → [2.0, 1.0]: not balanced anymore
		const result = computeProjectedEntropy(weights, "work", 1.0);
		const expected = computeNormalizedEntropy([2.0, 1.0]);
		expect(result).toBeCloseTo(expected, 10);
		expect(result).toBeLessThan(1); // no longer perfectly balanced
	});

	it("adding to new domain increases entropy from 0 (single domain)", () => {
		const weights = new Map<LifeDomain, number>([["work", 2.0]]);
		const before = computeNormalizedEntropy([2.0]); // 0
		const after = computeProjectedEntropy(weights, "family", 0.5);
		expect(before).toBe(0);
		expect(after).toBeGreaterThan(0);
		// Should equal entropy of [2.0, 0.5]
		expect(after).toBeCloseTo(computeNormalizedEntropy([2.0, 0.5]), 10);
	});

	it("projected entropy matches manual recomputation with 3 domains", () => {
		const weights = new Map<LifeDomain, number>([
			["work", 1.5],
			["leisure", 0.8],
			["solo", 0.3],
		]);
		const delta = 0.4;
		const result = computeProjectedEntropy(weights, "leisure", delta);
		// Manual: [1.5, 1.2, 0.3]
		const expected = computeNormalizedEntropy([1.5, 1.2, 0.3]);
		expect(result).toBeCloseTo(expected, 10);
	});
});

// ─── computeContextMean exact values ────────────────────────────────
describe("computeContextMean: exact computations", () => {
	it("equal confidences → simple average", () => {
		expect(computeContextMean([10, 20], [1, 1])).toBeCloseTo(15, 5);
	});

	it("one dominant confidence → mean skews toward that score", () => {
		// c=[0.99, 0.01], scores=[5, 15] → mean ≈ 5.1
		const result = computeContextMean([5, 15], [0.99, 0.01]);
		expect(result).toBeCloseTo((0.99 * 5 + 0.01 * 15) / 1.0, 5);
		expect(result).toBeLessThan(6); // heavily skewed toward 5
	});

	it("three items: exact weighted mean", () => {
		// Σ(c×s) = 0.3×4 + 0.5×10 + 0.2×18 = 1.2 + 5.0 + 3.6 = 9.8
		// Σ(c) = 1.0
		const result = computeContextMean([4, 10, 18], [0.3, 0.5, 0.2]);
		expect(result).toBeCloseTo(9.8, 5);
	});
});

// ─── Confidence formula verification ────────────────────────────────
describe("confidence formula: C_max × (1 - e^{-k × W})", () => {
	it("exact confidence for known W values", () => {
		// W=1: C = 0.9 × (1 - e^{-0.7}) ≈ 0.9 × 0.5034 ≈ 0.4531
		const evidence = [ev("trust", "work", 10, 1.0)]; // w = √1 = 1, W = 1
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "trust");
		expect(result.confidence).toBeCloseTo(0.9 * (1 - Math.exp(-0.7)), 10);
	});

	it("confidence curve at W=2, W=3, W=5", () => {
		for (const W of [2, 3, 5]) {
			const expected = 0.9 * (1 - Math.exp(-0.7 * W));
			// Build evidence to get desired W: single domain, confidence = W²
			// w = √(W²) = W, so Σc = W² for single domain
			const c = W * W;
			const result = m(computeFacetMetrics([ev("trust", "work", 10, c)], FORMULA_DEFAULTS), "trust");
			expect(result.confidence).toBeCloseTo(expected, 8);
		}
	});

	it("high k → confidence saturates faster", () => {
		const evidence = [ev("trust", "work", 10, 0.5), ev("trust", "leisure", 10, 0.5)];
		const lowK = computeFacetMetrics(evidence, { ...FORMULA_DEFAULTS, k: 0.3 });
		const highK = computeFacetMetrics(evidence, { ...FORMULA_DEFAULTS, k: 2.0 });
		expect(m(highK, "trust").confidence).toBeGreaterThan(m(lowK, "trust").confidence);
	});
});

// ─── Signal power decomposition ─────────────────────────────────────
describe("signal power: V × D decomposition", () => {
	it("V increases with total evidence mass W", () => {
		const ev1 = [ev("trust", "work", 10, 0.5), ev("trust", "leisure", 10, 0.5)];
		const ev2 = [ev("trust", "work", 10, 2.0), ev("trust", "leisure", 10, 2.0)];

		const m1 = m(computeFacetMetrics(ev1, FORMULA_DEFAULTS), "trust");
		const m2 = m(computeFacetMetrics(ev2, FORMULA_DEFAULTS), "trust");

		// Same D (both have 2 balanced domains → D=1), but m2 has higher V
		expect(m2.signalPower).toBeGreaterThan(m1.signalPower);
	});

	it("D drives signal power: 5 balanced domains > 2 balanced domains (same total mass)", () => {
		// 5 domains × 0.2 confidence each = 1.0 total confidence per domain
		const fiveDomains = [
			ev("trust", "work", 10, 0.2),
			ev("trust", "leisure", 10, 0.2),
			ev("trust", "family", 10, 0.2),
			ev("trust", "relationships", 10, 0.2),
			ev("trust", "solo", 10, 0.2),
		];
		// 2 domains × 0.5 confidence each = 1.0 total confidence per domain
		const twoDomains = [ev("trust", "work", 10, 0.5), ev("trust", "leisure", 10, 0.5)];

		const m5 = m(computeFacetMetrics(fiveDomains, FORMULA_DEFAULTS), "trust");
		const m2 = m(computeFacetMetrics(twoDomains, FORMULA_DEFAULTS), "trust");

		// Same W = √0.2×5 vs √0.5×2 (not exactly equal but close)
		// Key point: 5 balanced domains → D ≈ 1, so signal power should be higher
		expect(m5.signalPower).toBeGreaterThan(m2.signalPower);
	});

	it("adding 'other' domain evidence increases signal power (other counts for V×D)", () => {
		const withoutOther = [ev("trust", "work", 10, 0.8)];
		const withOther = [ev("trust", "work", 10, 0.8), ev("trust", "other", 10, 0.8)];

		const mWithout = m(computeFacetMetrics(withoutOther, FORMULA_DEFAULTS), "trust");
		const mWith = m(computeFacetMetrics(withOther, FORMULA_DEFAULTS), "trust");

		// 'other' adds diversity → signal power goes from 0 (single domain) to > 0
		expect(mWithout.signalPower).toBe(0);
		expect(mWith.signalPower).toBeGreaterThan(0);
	});
});

// ─── Score weighting verification ───────────────────────────────────
describe("facet score: context-weighted cross-domain mean", () => {
	it("higher-confidence domain pulls score toward it", () => {
		// Work: score 18, confidence 0.9 → w = √0.9 ≈ 0.949
		// Leisure: score 2, confidence 0.1 → w = √0.1 ≈ 0.316
		// Score should be closer to 18 than to 2
		const evidence = [ev("imagination", "work", 18, 0.9), ev("imagination", "leisure", 2, 0.1)];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");

		const wW = Math.sqrt(0.9);
		const wL = Math.sqrt(0.1);
		const expected = (wW * 18 + wL * 2) / (wW + wL);
		expect(result.score).toBeCloseTo(expected, 8);
		expect(result.score).toBeGreaterThan(13); // weighted toward 18
	});

	it("equal confidence across domains → simple average of domain means", () => {
		const evidence = [ev("orderliness", "work", 16, 0.5), ev("orderliness", "leisure", 8, 0.5)];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "orderliness");
		// Equal w_g → score = (16 + 8) / 2 = 12
		expect(result.score).toBeCloseTo(12, 5);
	});

	it("intra-domain averaging: multiple items in one domain average first", () => {
		// Work: (20, 0.5), (10, 0.5) → μ_work = 15, w_work = √1 = 1
		// Leisure: (6, 0.5) → μ_leisure = 6, w_leisure = √0.5
		const evidence = [
			ev("trust", "work", 20, 0.5),
			ev("trust", "work", 10, 0.5),
			ev("trust", "leisure", 6, 0.5),
		];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "trust");

		const wWork = Math.sqrt(1.0);
		const wLeisure = Math.sqrt(0.5);
		const expected = (wWork * 15 + wLeisure * 6) / (wWork + wLeisure);
		expect(result.score).toBeCloseTo(expected, 5);
	});
});

// ─── Multi-facet isolation ──────────────────────────────────────────
describe("multi-facet: facets compute independently", () => {
	it("evidence for facet A does not affect facet B metrics", () => {
		const evidenceA = [ev("imagination", "work", 18, 0.9)];
		const evidenceBoth = [ev("imagination", "work", 18, 0.9), ev("trust", "leisure", 5, 0.3)];

		const mA = m(computeFacetMetrics(evidenceA, FORMULA_DEFAULTS), "imagination");
		const mBoth = m(computeFacetMetrics(evidenceBoth, FORMULA_DEFAULTS), "imagination");

		expect(mBoth.score).toBeCloseTo(mA.score, 10);
		expect(mBoth.confidence).toBeCloseTo(mA.confidence, 10);
		expect(mBoth.signalPower).toBeCloseTo(mA.signalPower, 10);
	});
});
