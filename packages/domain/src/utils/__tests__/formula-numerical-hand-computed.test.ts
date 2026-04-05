import { describe, expect, it } from "@effect/vitest";
import type { EvidenceInput } from "../../types/evidence";
import {
	computeContextMean,
	computeContextWeight,
	computeFacetMetrics,
	FORMULA_DEFAULTS,
	type FormulaConfig,
} from "../formula";
import { ev, m } from "./__fixtures__/formula-numerical.fixtures";

/**
 * Native formula:
 *   finalWeight = STRENGTH_WEIGHT[strength] * CONFIDENCE_WEIGHT[confidence]
 *   Weighted mean deviation per domain: mu_g = sum(w_i * d_i) / sum(w_i)
 *   Context weight per domain: w_g = sqrt(sum(w_i))
 *   Facet deviation: D_f = sum(w_g * mu_g) / sum(w_g)
 *   Facet score: S_f = MIDPOINT(10) + D_f * SCALE_FACTOR(10/3)
 */

const config1: FormulaConfig = { ...FORMULA_DEFAULTS, k: 0.6 };

describe("hand-computed example 1: orderliness with 3 domains", () => {
	it("computes exact score, confidence, and domain weights", () => {
		const evidence: EvidenceInput[] = [
			ev("orderliness", "work", 2, "strong", "high"),
			ev("orderliness", "work", 2, "moderate", "high"),
			ev("orderliness", "work", 2, "moderate", "medium"),
			ev("orderliness", "relationships", 1, "moderate", "medium"),
			ev("orderliness", "family", -1, "moderate", "high"),
		];

		const result = computeFacetMetrics(evidence, config1);
		const metrics = m(result, "orderliness");

		const wWork = Math.sqrt(0.9 + 0.54 + 0.36);
		const wRel = Math.sqrt(0.36);
		const wFam = Math.sqrt(0.54);
		expect(metrics.domainWeights.get("work")).toBeCloseTo(wWork, 5);
		expect(metrics.domainWeights.get("relationships")).toBeCloseTo(wRel, 5);
		expect(metrics.domainWeights.get("family")).toBeCloseTo(wFam, 5);

		const W = wWork + wRel + wFam;
		const muDevWork = computeContextMean([2, 2, 2], [0.9, 0.54, 0.36]);
		const muDevRel = 1;
		const muDevFam = -1;
		const deviation =
			(wWork * muDevWork + wRel * muDevRel + wFam * muDevFam) / (W + FORMULA_DEFAULTS.epsilon);

		expect(metrics.score).toBeCloseTo(10 + deviation * (10 / 3), 4);
		expect(metrics.confidence).toBeCloseTo(0.9 * (1 - Math.exp(-0.6 * W)), 5);
	});
});

describe("hand-computed example 2: single evidence item", () => {
	it("computes exact values for one record", () => {
		const evidence = [ev("trust", "leisure", 1, "moderate", "medium")];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const metrics = m(result, "trust");

		const finalWeight = 0.36;
		const wLeisure = Math.sqrt(finalWeight);
		expect(metrics.domainWeights.get("leisure")).toBeCloseTo(wLeisure, 5);
		expect(metrics.score).toBeCloseTo(10 + 1 * (10 / 3), 4);
		expect(metrics.confidence).toBeCloseTo(0.9 * (1 - Math.exp(-0.7 * wLeisure)), 5);
	});
});

describe("hand-computed example 3: two equal domains", () => {
	it("computes exact values for symmetric evidence", () => {
		const evidence = [
			ev("anxiety", "work", 0, "weak", "high"),
			ev("anxiety", "health", 0, "weak", "high"),
		];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const metrics = m(result, "anxiety");

		const finalWeight = 0.27;
		const w = Math.sqrt(finalWeight);
		expect(metrics.domainWeights.get("work")).toBeCloseTo(w, 5);
		expect(metrics.domainWeights.get("health")).toBeCloseTo(w, 5);
		expect(metrics.score).toBeCloseTo(10, 4);
		expect(metrics.confidence).toBeCloseTo(0.9 * (1 - Math.exp(-0.7 * (2 * w))), 5);
	});
});

describe("hand-computed example 4: anti-redundancy (sqrt squashing)", () => {
	it("grows sublinearly when many items pile into one domain", () => {
		const singleEvidence = [ev("imagination", "work", 2, "strong", "medium")];
		const tenEvidence = Array.from({ length: 10 }, () =>
			ev("imagination", "work", 2, "strong", "medium"),
		);

		const single = m(computeFacetMetrics(singleEvidence, FORMULA_DEFAULTS), "imagination");
		const ten = m(computeFacetMetrics(tenEvidence, FORMULA_DEFAULTS), "imagination");

		expect(single.domainWeights.get("work")).toBeCloseTo(Math.sqrt(0.6), 5);
		expect(ten.domainWeights.get("work")).toBeCloseTo(Math.sqrt(6), 5);

		const ratio = (ten.domainWeights.get("work") ?? 0) / (single.domainWeights.get("work") ?? 1);
		expect(ratio).toBeCloseTo(Math.sqrt(10), 5);
		expect(ratio).toBeLessThan(10);
		expect(ten.score).toBeCloseTo(single.score, 5);
		expect(ten.confidence).toBeGreaterThan(single.confidence);
	});

	it("matches the standalone context-weight helper", () => {
		expect(computeContextWeight([0.9, 0.54, 0.36])).toBeCloseTo(Math.sqrt(1.8), 10);
	});
});
