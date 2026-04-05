import { describe, expect, it } from "@effect/vitest";
import type { EvidenceConfidence, EvidenceStrength } from "../../types/evidence";
import {
	CONFIDENCE_WEIGHT,
	computeContextMean,
	computeFacetMetrics,
	computeFinalWeight,
	FORMULA_DEFAULTS,
	STRENGTH_WEIGHT,
} from "../formula";
import { ev, m } from "./__fixtures__/formula-numerical.fixtures";

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

	it("exports the weight maps correctly", () => {
		expect(STRENGTH_WEIGHT.weak).toBe(0.3);
		expect(STRENGTH_WEIGHT.moderate).toBe(0.6);
		expect(STRENGTH_WEIGHT.strong).toBe(1.0);
		expect(CONFIDENCE_WEIGHT.low).toBe(0.3);
		expect(CONFIDENCE_WEIGHT.medium).toBe(0.6);
		expect(CONFIDENCE_WEIGHT.high).toBe(0.9);
	});
});

describe("computeContextMean: exact computations", () => {
	it("reduces to a simple average when weights are equal", () => {
		expect(computeContextMean([10, 20], [1, 1])).toBeCloseTo(15, 5);
	});

	it("skews toward the dominant weight", () => {
		const result = computeContextMean([5, 15], [0.99, 0.01]);
		expect(result).toBeCloseTo((0.99 * 5 + 0.01 * 15) / 1.0, 5);
		expect(result).toBeLessThan(6);
	});

	it("matches a hand-computed three-item weighted mean", () => {
		const result = computeContextMean([4, 10, 18], [0.3, 0.5, 0.2]);
		expect(result).toBeCloseTo(9.8, 5);
	});
});

describe("confidence formula: C_max × (1 - e^{-k × W})", () => {
	it("matches the exact confidence for known W", () => {
		const evidence = [ev("trust", "work", 0, "strong", "high")];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "trust");
		const W = Math.sqrt(0.9);

		expect(result.confidence).toBeCloseTo(0.9 * (1 - Math.exp(-0.7 * W)), 5);
	});

	it("saturates faster with a higher k", () => {
		const evidence = [
			ev("trust", "work", 0, "moderate", "medium"),
			ev("trust", "leisure", 0, "moderate", "medium"),
		];
		const lowK = computeFacetMetrics(evidence, { ...FORMULA_DEFAULTS, k: 0.3 });
		const highK = computeFacetMetrics(evidence, { ...FORMULA_DEFAULTS, k: 2.0 });

		expect(m(highK, "trust").confidence).toBeGreaterThan(m(lowK, "trust").confidence);
	});
});

describe("facet score: context-weighted cross-domain mean", () => {
	it("pulls the score toward the higher-weight domain", () => {
		const evidence = [
			ev("imagination", "work", 3, "strong", "high"),
			ev("imagination", "leisure", -3, "weak", "low"),
		];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");

		const sWork = 10 + 3 * (10 / 3);
		const sLeisure = 10 + -3 * (10 / 3);
		const wWork = Math.sqrt(0.9);
		const wLeisure = Math.sqrt(0.09);
		const expected = (wWork * sWork + wLeisure * sLeisure) / (wWork + wLeisure);

		expect(result.score).toBeCloseTo(expected, 4);
		expect(result.score).toBeGreaterThan(13);
	});

	it("reduces to the average of domain means when domain weights match", () => {
		const evidence = [
			ev("orderliness", "work", 2, "moderate", "medium"),
			ev("orderliness", "leisure", -1, "moderate", "medium"),
		];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "orderliness");

		const sWork = 10 + 2 * (10 / 3);
		const sLeisure = 10 + -1 * (10 / 3);
		expect(result.score).toBeCloseTo((sWork + sLeisure) / 2, 4);
	});

	it("averages items inside a domain before combining domains", () => {
		const evidence = [
			ev("trust", "work", 3, "moderate", "medium"),
			ev("trust", "work", 0, "moderate", "medium"),
			ev("trust", "leisure", -1, "moderate", "medium"),
		];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "trust");

		const sWork1 = 10 + 3 * (10 / 3);
		const sWork2 = 10;
		const sLeisure = 10 + -1 * (10 / 3);
		const confVal = 0.36;
		const muWork = (confVal * sWork1 + confVal * sWork2) / (2 * confVal);
		const wWork = Math.sqrt(2 * confVal);
		const wLeisure = Math.sqrt(confVal);
		const expected = (wWork * muWork + wLeisure * sLeisure) / (wWork + wLeisure);

		expect(result.score).toBeCloseTo(expected, 4);
	});
});

describe("multi-facet isolation", () => {
	it("keeps facet metrics independent", () => {
		const evidenceA = [ev("imagination", "work", 3, "strong", "high")];
		const evidenceBoth = [
			ev("imagination", "work", 3, "strong", "high"),
			ev("trust", "leisure", -2, "weak", "low"),
		];

		const metricsA = m(computeFacetMetrics(evidenceA, FORMULA_DEFAULTS), "imagination");
		const metricsBoth = m(computeFacetMetrics(evidenceBoth, FORMULA_DEFAULTS), "imagination");

		expect(metricsBoth.score).toBeCloseTo(metricsA.score, 10);
		expect(metricsBoth.confidence).toBeCloseTo(metricsA.confidence, 10);
	});
});
