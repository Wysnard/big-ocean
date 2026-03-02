import { describe, expect, it } from "@effect/vitest";
import type { LifeDomain } from "../../constants/life-domain";
import type { EvidenceConfidence, EvidenceStrength } from "../../types/evidence";
import {
	CONFIDENCE_WEIGHT,
	computeContextMean,
	computeFacetMetrics,
	computeFinalWeight,
	computeNormalizedEntropy,
	computeProjectedEntropy,
	FORMULA_DEFAULTS,
	STRENGTH_WEIGHT,
} from "../formula";
import { ev, m } from "./__fixtures__/formula-numerical.fixtures";

// ─── computeFinalWeight: all 9 enum combinations ────────────────────
describe("computeFinalWeight: all 9 strength × confidence combinations", () => {
	const cases: [EvidenceStrength, EvidenceConfidence, number][] = [
		["weak", "low", 0.09],
		["weak", "medium", 0.18],
		["weak", "high", 0.27],
		["moderate", "low", 0.18],
		["moderate", "medium", 0.36],
		["moderate", "high", 0.54],
		["strong", "low", 0.3],
		["strong", "medium", 0.6],
		["strong", "high", 0.9],
	];

	for (const [strength, confidence, expected] of cases) {
		it(`${strength}/${confidence} = ${expected}`, () => {
			expect(computeFinalWeight(strength, confidence)).toBeCloseTo(expected, 10);
		});
	}

	it("STRENGTH_WEIGHT is exported correctly", () => {
		expect(STRENGTH_WEIGHT.weak).toBe(0.3);
		expect(STRENGTH_WEIGHT.moderate).toBe(0.6);
		expect(STRENGTH_WEIGHT.strong).toBe(1.0);
	});

	it("CONFIDENCE_WEIGHT is exported correctly", () => {
		expect(CONFIDENCE_WEIGHT.low).toBe(0.3);
		expect(CONFIDENCE_WEIGHT.medium).toBe(0.6);
		expect(CONFIDENCE_WEIGHT.high).toBe(0.9);
	});
});

// ─── Normalized entropy exact values ────────────────────────────────
describe("computeNormalizedEntropy: exact computations", () => {
	it("2 domains [3, 1]: exact entropy value", () => {
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
		const result = computeProjectedEntropy(weights, "work", 1.0);
		const expected = computeNormalizedEntropy([2.0, 1.0]);
		expect(result).toBeCloseTo(expected, 10);
		expect(result).toBeLessThan(1);
	});

	it("adding to new domain increases entropy from 0 (single domain)", () => {
		const weights = new Map<LifeDomain, number>([["work", 2.0]]);
		const before = computeNormalizedEntropy([2.0]);
		const after = computeProjectedEntropy(weights, "family", 0.5);
		expect(before).toBe(0);
		expect(after).toBeGreaterThan(0);
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
		const result = computeContextMean([5, 15], [0.99, 0.01]);
		expect(result).toBeCloseTo((0.99 * 5 + 0.01 * 15) / 1.0, 5);
		expect(result).toBeLessThan(6);
	});

	it("three items: exact weighted mean", () => {
		const result = computeContextMean([4, 10, 18], [0.3, 0.5, 0.2]);
		expect(result).toBeCloseTo(9.8, 5);
	});
});

// ─── Confidence formula verification (v2 evidence) ──────────────────
/**
 * finalWeight = STRENGTH_WEIGHT[strength] * CONFIDENCE_WEIGHT[confidence]
 *   strong(1.0) * high(0.9) = 0.9
 *   moderate(0.6) * medium(0.6) = 0.36
 *   weak(0.3) * low(0.3) = 0.09
 * Context weight w_g = √(Σ finalWeights in group)
 */
describe("confidence formula: C_max × (1 - e^{-k × W}) with v2 evidence", () => {
	it("exact confidence for known W values", () => {
		// strong/high → finalWeight=0.9, w = √0.9, W = √0.9
		const evidence = [ev("trust", "work", 0, "strong", "high")];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "trust");
		const W = Math.sqrt(0.9);
		expect(result.confidence).toBeCloseTo(0.9 * (1 - Math.exp(-0.7 * W)), 5);
	});

	it("high k → confidence saturates faster", () => {
		const evidence = [
			ev("trust", "work", 0, "moderate", "medium"),
			ev("trust", "leisure", 0, "moderate", "medium"),
		];
		const lowK = computeFacetMetrics(evidence, { ...FORMULA_DEFAULTS, k: 0.3 });
		const highK = computeFacetMetrics(evidence, { ...FORMULA_DEFAULTS, k: 2.0 });
		expect(m(highK, "trust").confidence).toBeGreaterThan(m(lowK, "trust").confidence);
	});
});

// ─── Signal power decomposition (v2) ────────────────────────────────
describe("signal power: V × D decomposition (v2)", () => {
	it("V increases with total evidence mass W", () => {
		// Lower strength/confidence → lower mass
		const ev1 = [
			ev("trust", "work", 0, "weak", "medium"),
			ev("trust", "leisure", 0, "weak", "medium"),
		];
		// Higher strength/confidence → higher mass
		const ev2 = [
			ev("trust", "work", 0, "strong", "high"),
			ev("trust", "leisure", 0, "strong", "high"),
		];

		const m1 = m(computeFacetMetrics(ev1, FORMULA_DEFAULTS), "trust");
		const m2 = m(computeFacetMetrics(ev2, FORMULA_DEFAULTS), "trust");

		expect(m2.signalPower).toBeGreaterThan(m1.signalPower);
	});

	it("D drives signal power: 5 balanced domains > 2 balanced domains", () => {
		const fiveDomains = [
			ev("trust", "work", 0, "weak", "low"),
			ev("trust", "leisure", 0, "weak", "low"),
			ev("trust", "family", 0, "weak", "low"),
			ev("trust", "relationships", 0, "weak", "low"),
			ev("trust", "solo", 0, "weak", "low"),
		];
		const twoDomains = [
			ev("trust", "work", 0, "moderate", "medium"),
			ev("trust", "leisure", 0, "moderate", "medium"),
		];

		const m5 = m(computeFacetMetrics(fiveDomains, FORMULA_DEFAULTS), "trust");
		const m2 = m(computeFacetMetrics(twoDomains, FORMULA_DEFAULTS), "trust");

		expect(m5.signalPower).toBeGreaterThan(m2.signalPower);
	});

	it("adding 'other' domain evidence increases signal power", () => {
		const withoutOther = [ev("trust", "work", 0, "strong", "medium")];
		const withOther = [
			ev("trust", "work", 0, "strong", "medium"),
			ev("trust", "other", 0, "strong", "medium"),
		];

		const mWithout = m(computeFacetMetrics(withoutOther, FORMULA_DEFAULTS), "trust");
		const mWith = m(computeFacetMetrics(withOther, FORMULA_DEFAULTS), "trust");

		expect(mWithout.signalPower).toBe(0);
		expect(mWith.signalPower).toBeGreaterThan(0);
	});
});

// ─── Score weighting verification (v2) ──────────────────────────────
describe("facet score: context-weighted cross-domain mean (v2)", () => {
	it("higher-weight domain pulls score toward it", () => {
		// Work: dev=3, strong/high → finalWeight=0.9, w = √0.9
		// Leisure: dev=-3, weak/low → finalWeight=0.09, w = √0.09
		const evidence = [
			ev("imagination", "work", 3, "strong", "high"),
			ev("imagination", "leisure", -3, "weak", "low"),
		];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");

		const sWork = 10 + 3 * (10 / 3); // 20
		const sLeisure = 10 + -3 * (10 / 3); // 0
		const wW = Math.sqrt(0.9);
		const wL = Math.sqrt(0.09);
		const expected = (wW * sWork + wL * sLeisure) / (wW + wL);
		expect(result.score).toBeCloseTo(expected, 4);
		expect(result.score).toBeGreaterThan(13); // weighted toward high deviation
	});

	it("equal confidence across domains → simple average of domain means", () => {
		// Both moderate/medium → conf=0.36
		const evidence = [
			ev("orderliness", "work", 2, "moderate", "medium"),
			ev("orderliness", "leisure", -1, "moderate", "medium"),
		];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "orderliness");
		const sWork = 10 + 2 * (10 / 3);
		const sLeisure = 10 + -1 * (10 / 3);
		const expected = (sWork + sLeisure) / 2;
		expect(result.score).toBeCloseTo(expected, 4);
	});

	it("intra-domain averaging: multiple items in one domain average first", () => {
		// Work: 2 items with moderate/medium (conf=0.36 each), → Σconf=0.72, w=√0.72
		// Leisure: 1 item with moderate/medium (conf=0.36), w=√0.36
		const evidence = [
			ev("trust", "work", 3, "moderate", "medium"),
			ev("trust", "work", 0, "moderate", "medium"),
			ev("trust", "leisure", -1, "moderate", "medium"),
		];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "trust");

		const sWork1 = 10 + 3 * (10 / 3); // 20
		const sWork2 = 10 + 0 * (10 / 3); // 10
		const sLeisure = 10 + -1 * (10 / 3); // ≈6.67
		const confVal = 0.36;
		const muWork = (confVal * sWork1 + confVal * sWork2) / (2 * confVal);
		const wWork = Math.sqrt(2 * confVal);
		const wLeisure = Math.sqrt(confVal);
		const expected = (wWork * muWork + wLeisure * sLeisure) / (wWork + wLeisure);
		expect(result.score).toBeCloseTo(expected, 4);
	});
});

// ─── Multi-facet isolation (v2) ─────────────────────────────────────
describe("multi-facet: facets compute independently (v2)", () => {
	it("evidence for facet A does not affect facet B metrics", () => {
		const evidenceA = [ev("imagination", "work", 3, "strong", "high")];
		const evidenceBoth = [
			ev("imagination", "work", 3, "strong", "high"),
			ev("trust", "leisure", -2, "weak", "low"),
		];

		const mA = m(computeFacetMetrics(evidenceA, FORMULA_DEFAULTS), "imagination");
		const mBoth = m(computeFacetMetrics(evidenceBoth, FORMULA_DEFAULTS), "imagination");

		expect(mBoth.score).toBeCloseTo(mA.score, 10);
		expect(mBoth.confidence).toBeCloseTo(mA.confidence, 10);
		expect(mBoth.signalPower).toBeCloseTo(mA.signalPower, 10);
	});
});
