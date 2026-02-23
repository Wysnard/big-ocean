import { describe, expect, it } from "@effect/vitest";
import type { EvidenceInput } from "../../types/evidence";
import {
	computeContextMean,
	computeContextWeight,
	computeFacetMetrics,
	computeNormalizedEntropy,
	FORMULA_DEFAULTS,
	type FormulaConfig,
} from "../formula";
import { ev, m } from "./__fixtures__/formula-numerical.fixtures";

// ─── Hand-computed example 1 (original) ─────────────────────────────
/**
 * Facet: Orderliness (0–20 scale)
 * Evidence:
 *   Work:          (18, 0.8), (17, 0.7), (16, 0.6)
 *   Relationships:  (14, 0.6)
 *   Family:         (6, 0.7)
 *
 * Uses k=0.6 and betaVolume=0.6 (not defaults).
 */
const config1: FormulaConfig = { ...FORMULA_DEFAULTS, k: 0.6, betaVolume: 0.6 };

describe("hand-computed example 1: orderliness with 3 domains", () => {
	it("work context mean ≈ 17.095", () => {
		// μ_work = Σ(c×s) / (Σc + ε) = 35.9 / (2.1 + ε) ≈ 17.095
		// 0.8×18 + 0.7×17 + 0.6×16 = 14.4 + 11.9 + 9.6 = 35.9
		const mu = computeContextMean([18, 17, 16], [0.8, 0.7, 0.6]);
		expect(mu).toBeCloseTo(35.9 / 2.1, 5);
	});

	it("work context weight = √2.1 ≈ 1.449", () => {
		expect(computeContextWeight([0.8, 0.7, 0.6])).toBeCloseTo(Math.sqrt(2.1), 10);
	});

	it("relationships context weight = √0.6 ≈ 0.775", () => {
		expect(computeContextWeight([0.6])).toBeCloseTo(Math.sqrt(0.6), 10);
	});

	it("family context weight = √0.7 ≈ 0.837", () => {
		expect(computeContextWeight([0.7])).toBeCloseTo(Math.sqrt(0.7), 10);
	});

	it("full pipeline: score, confidence, signalPower, domainWeights", () => {
		const evidence: EvidenceInput[] = [
			ev("orderliness", "work", 18, 0.8),
			ev("orderliness", "work", 17, 0.7),
			ev("orderliness", "work", 16, 0.6),
			ev("orderliness", "relationships", 14, 0.6),
			ev("orderliness", "family", 6, 0.7),
		];

		const result = computeFacetMetrics(evidence, config1);
		const o = m(result, "orderliness");

		// Domain weights
		const wWork = Math.sqrt(2.1);
		const wRel = Math.sqrt(0.6);
		const wFam = Math.sqrt(0.7);
		expect(o.domainWeights.get("work")).toBeCloseTo(wWork, 10);
		expect(o.domainWeights.get("relationships")).toBeCloseTo(wRel, 10);
		expect(o.domainWeights.get("family")).toBeCloseTo(wFam, 10);

		// Total mass W
		const W = wWork + wRel + wFam;
		expect(W).toBeCloseTo(3.061, 2);

		// Score: Σ(w_g × μ_g) / Σ(w_g)
		// μ_work = 35.9 / (2.1 + ε) — use computeContextMean for exact value
		const muWork = computeContextMean([18, 17, 16], [0.8, 0.7, 0.6]);
		const muRel = 14; // single item
		const muFam = 6; // single item
		const expectedScore = (wWork * muWork + wRel * muRel + wFam * muFam) / W;
		expect(o.score).toBeCloseTo(expectedScore, 4);

		// Confidence: C_max × (1 - e^{-k × W})
		const expectedConf = 0.9 * (1 - Math.exp(-0.6 * W));
		expect(o.confidence).toBeCloseTo(expectedConf, 10);

		// Signal power: V × D
		const V = 1 - Math.exp(-0.6 * W);
		const D = computeNormalizedEntropy([wWork, wRel, wFam]);
		expect(o.signalPower).toBeCloseTo(V * D, 10);
	});
});

// ─── Hand-computed example 2: single evidence item ──────────────────
describe("hand-computed example 2: single evidence item", () => {
	it("computes exact values for one record", () => {
		const evidence = [ev("trust", "leisure", 14, 0.6)];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const t = m(result, "trust");

		// w_leisure = √0.6
		const wL = Math.sqrt(0.6);
		expect(t.domainWeights.get("leisure")).toBeCloseTo(wL, 10);

		// Score = μ_leisure = 14 (single item, weighted mean = score itself)
		expect(t.score).toBeCloseTo(14, 5);

		// Confidence = 0.9 × (1 - e^{-0.7 × √0.6})
		const expectedConf = 0.9 * (1 - Math.exp(-0.7 * wL));
		expect(t.confidence).toBeCloseTo(expectedConf, 10);

		// Signal power = 0 (single domain → entropy = 0)
		expect(t.signalPower).toBe(0);
	});
});

// ─── Hand-computed example 3: two domains, equal weight ─────────────
describe("hand-computed example 3: two equal domains", () => {
	it("computes exact values for symmetric evidence", () => {
		const evidence = [ev("anxiety", "work", 12, 0.5), ev("anxiety", "solo", 8, 0.5)];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const a = m(result, "anxiety");

		// Both domains: w_g = √0.5
		const w = Math.sqrt(0.5);
		expect(a.domainWeights.get("work")).toBeCloseTo(w, 10);
		expect(a.domainWeights.get("solo")).toBeCloseTo(w, 10);

		// Score = (w×12 + w×8) / (w+w) = 20/2 = 10
		expect(a.score).toBeCloseTo(10, 5);

		// W = 2√0.5 = √2
		const W = 2 * w;
		expect(a.confidence).toBeCloseTo(0.9 * (1 - Math.exp(-0.7 * W)), 10);

		// Entropy of two equal weights = 1
		expect(computeNormalizedEntropy([w, w])).toBeCloseTo(1, 10);

		// Signal power = V × 1
		const V = 1 - Math.exp(-0.7 * W);
		expect(a.signalPower).toBeCloseTo(V, 10);
	});
});

// ─── Hand-computed example 4: anti-redundancy effect ────────────────
describe("hand-computed example 4: anti-redundancy (√ squashing)", () => {
	it("10 items in one domain weigh less than 10× a single item", () => {
		const singleEv = [ev("imagination", "work", 15, 0.8)];
		const tenEv = Array.from({ length: 10 }, () => ev("imagination", "work", 15, 0.8));

		const single = m(computeFacetMetrics(singleEv, FORMULA_DEFAULTS), "imagination");
		const ten = m(computeFacetMetrics(tenEv, FORMULA_DEFAULTS), "imagination");

		// Single: w = √0.8, Ten: w = √(10×0.8) = √8
		expect(single.domainWeights.get("work")).toBeCloseTo(Math.sqrt(0.8), 10);
		expect(ten.domainWeights.get("work")).toBeCloseTo(Math.sqrt(8), 10);

		// √8 / √0.8 ≈ 3.16, NOT 10 — that's the anti-redundancy effect
		const ratio = (ten.domainWeights.get("work") ?? 0) / (single.domainWeights.get("work") ?? 1);
		expect(ratio).toBeCloseTo(Math.sqrt(10), 5);
		expect(ratio).toBeLessThan(10);
	});

	it("scores are identical when all items have the same score", () => {
		const singleEv = [ev("imagination", "work", 15, 0.8)];
		const tenEv = Array.from({ length: 10 }, () => ev("imagination", "work", 15, 0.8));

		const single = m(computeFacetMetrics(singleEv, FORMULA_DEFAULTS), "imagination");
		const ten = m(computeFacetMetrics(tenEv, FORMULA_DEFAULTS), "imagination");

		// Same scores → same weighted mean regardless of quantity
		expect(ten.score).toBeCloseTo(single.score, 5);
		// But confidence is higher with more evidence
		expect(ten.confidence).toBeGreaterThan(single.confidence);
	});
});
