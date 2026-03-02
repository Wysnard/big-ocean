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

/**
 * Native v2 formula:
 *   finalWeight = STRENGTH_WEIGHT[strength] * CONFIDENCE_WEIGHT[confidence]
 *     STRENGTH: weak=0.3, moderate=0.6, strong=1.0
 *     CONFIDENCE: low=0.3, medium=0.6, high=0.9
 *   Weighted mean deviation per domain: mu_g = sum(w_i * d_i) / sum(w_i)
 *   Context weight per domain: w_g = sqrt(sum(w_i))
 *   Facet deviation: D_f = sum(w_g * mu_g) / sum(w_g)
 *   Facet score: S_f = MIDPOINT(10) + D_f * SCALE_FACTOR(10/3)
 */

// ─── Hand-computed example 1: three domains, mixed v2 evidence ──────
/**
 * Facet: Orderliness
 * Evidence (v2):
 *   Work: (dev=2, strong, high) → finalWeight=0.9
 *         (dev=2, moderate, high) → finalWeight=0.54
 *         (dev=2, moderate, medium) → finalWeight=0.36
 *   Relationships: (dev=1, moderate, medium) → finalWeight=0.36
 *   Family: (dev=-1, moderate, high) → finalWeight=0.54
 */
const config1: FormulaConfig = { ...FORMULA_DEFAULTS, k: 0.6, betaVolume: 0.6 };

describe("hand-computed example 1: orderliness with 3 domains (v2)", () => {
	it("work context weight = √(0.9 + 0.54 + 0.36) = √1.8", () => {
		expect(computeContextWeight([0.9, 0.54, 0.36])).toBeCloseTo(Math.sqrt(1.8), 10);
	});

	it("relationships context weight = √0.36", () => {
		expect(computeContextWeight([0.36])).toBeCloseTo(Math.sqrt(0.36), 10);
	});

	it("family context weight = √0.54", () => {
		expect(computeContextWeight([0.54])).toBeCloseTo(Math.sqrt(0.54), 10);
	});

	it("full pipeline: score, confidence, signalPower, domainWeights", () => {
		const evidence: EvidenceInput[] = [
			ev("orderliness", "work", 2, "strong", "high"),
			ev("orderliness", "work", 2, "moderate", "high"),
			ev("orderliness", "work", 2, "moderate", "medium"),
			ev("orderliness", "relationships", 1, "moderate", "medium"),
			ev("orderliness", "family", -1, "moderate", "high"),
		];

		const result = computeFacetMetrics(evidence, config1);
		const o = m(result, "orderliness");

		// Domain weights
		const wWork = Math.sqrt(0.9 + 0.54 + 0.36); // √1.8
		const wRel = Math.sqrt(0.36);
		const wFam = Math.sqrt(0.54);
		expect(o.domainWeights.get("work")).toBeCloseTo(wWork, 5);
		expect(o.domainWeights.get("relationships")).toBeCloseTo(wRel, 5);
		expect(o.domainWeights.get("family")).toBeCloseTo(wFam, 5);

		// Total mass W
		const W = wWork + wRel + wFam;

		// Weighted mean deviation per domain (native v2)
		const muDevWork = computeContextMean([2, 2, 2], [0.9, 0.54, 0.36]); // all deviations = 2
		const muDevRel = 1; // single record, deviation = 1
		const muDevFam = -1; // single record, deviation = -1

		// Facet deviation: D_f = sum(w_g * mu_g) / sum(w_g)
		const D_f =
			(wWork * muDevWork + wRel * muDevRel + wFam * muDevFam) / (W + FORMULA_DEFAULTS.epsilon);

		// Score: S_f = MIDPOINT + D_f * SCALE_FACTOR(10/3)
		const expectedScore = 10 + D_f * (10 / 3);
		expect(o.score).toBeCloseTo(expectedScore, 4);

		// Confidence: C_max × (1 - e^{-k × W})
		const expectedConf = 0.9 * (1 - Math.exp(-0.6 * W));
		expect(o.confidence).toBeCloseTo(expectedConf, 5);

		// Signal power: V × D
		const V = 1 - Math.exp(-0.6 * W);
		const D = computeNormalizedEntropy([wWork, wRel, wFam]);
		expect(o.signalPower).toBeCloseTo(V * D, 5);
	});
});

// ─── Hand-computed example 2: single evidence item ──────────────────
describe("hand-computed example 2: single evidence item (v2)", () => {
	it("computes exact values for one record", () => {
		// deviation=1, moderate(0.6), medium(0.6) → finalWeight=0.36
		const evidence = [ev("trust", "leisure", 1, "moderate", "medium")];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const t = m(result, "trust");

		const finalWeight = 0.36; // 0.6 * 0.6
		const wL = Math.sqrt(finalWeight);
		expect(t.domainWeights.get("leisure")).toBeCloseTo(wL, 5);

		// D_f = 1 (single record), S_f = 10 + 1*(10/3) ≈ 13.33
		const expectedScore = 10 + 1 * (10 / 3);
		expect(t.score).toBeCloseTo(expectedScore, 4);

		// Confidence = 0.9 × (1 - e^{-0.7 × √0.36})
		const expectedConf = 0.9 * (1 - Math.exp(-0.7 * wL));
		expect(t.confidence).toBeCloseTo(expectedConf, 5);

		// Signal power = 0 (single domain → entropy = 0)
		expect(t.signalPower).toBe(0);
	});
});

// ─── Hand-computed example 3: two domains, equal weight ─────────────
describe("hand-computed example 3: two equal domains (v2)", () => {
	it("computes exact values for symmetric evidence", () => {
		// Both: deviation=0, weak(0.3), high(0.9) → score=10, conf=0.27
		const evidence = [
			ev("anxiety", "work", 0, "weak", "high"),
			ev("anxiety", "solo", 0, "weak", "high"),
		];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const a = m(result, "anxiety");

		const numConf = 0.27; // 0.3 * 0.9
		const w = Math.sqrt(numConf);
		expect(a.domainWeights.get("work")).toBeCloseTo(w, 5);
		expect(a.domainWeights.get("solo")).toBeCloseTo(w, 5);

		// Score = 10 (deviation=0 → MIDPOINT)
		expect(a.score).toBeCloseTo(10, 4);

		// W = 2√0.27
		const W = 2 * w;
		expect(a.confidence).toBeCloseTo(0.9 * (1 - Math.exp(-0.7 * W)), 5);

		// Entropy of two equal weights = 1
		expect(computeNormalizedEntropy([w, w])).toBeCloseTo(1, 10);

		// Signal power = V × 1
		const V = 1 - Math.exp(-0.7 * W);
		expect(a.signalPower).toBeCloseTo(V, 5);
	});
});

// ─── Hand-computed example 4: anti-redundancy effect ────────────────
describe("hand-computed example 4: anti-redundancy (√ squashing) (v2)", () => {
	it("10 items in one domain weigh less than 10× a single item", () => {
		// deviation=2, strong(1.0), medium(0.6) → conf=0.6
		const singleEv = [ev("imagination", "work", 2, "strong", "medium")];
		const tenEv = Array.from({ length: 10 }, () => ev("imagination", "work", 2, "strong", "medium"));

		const single = m(computeFacetMetrics(singleEv, FORMULA_DEFAULTS), "imagination");
		const ten = m(computeFacetMetrics(tenEv, FORMULA_DEFAULTS), "imagination");

		// Single: w = √0.6, Ten: w = √(10×0.6) = √6
		expect(single.domainWeights.get("work")).toBeCloseTo(Math.sqrt(0.6), 5);
		expect(ten.domainWeights.get("work")).toBeCloseTo(Math.sqrt(6), 5);

		// √6 / √0.6 ≈ √10 ≈ 3.16, NOT 10 — that's the anti-redundancy effect
		const ratio = (ten.domainWeights.get("work") ?? 0) / (single.domainWeights.get("work") ?? 1);
		expect(ratio).toBeCloseTo(Math.sqrt(10), 5);
		expect(ratio).toBeLessThan(10);
	});

	it("scores are identical when all items have the same deviation", () => {
		const singleEv = [ev("imagination", "work", 2, "strong", "medium")];
		const tenEv = Array.from({ length: 10 }, () => ev("imagination", "work", 2, "strong", "medium"));

		const single = m(computeFacetMetrics(singleEv, FORMULA_DEFAULTS), "imagination");
		const ten = m(computeFacetMetrics(tenEv, FORMULA_DEFAULTS), "imagination");

		// Same scores → same weighted mean regardless of quantity
		expect(ten.score).toBeCloseTo(single.score, 5);
		// But confidence is higher with more evidence
		expect(ten.confidence).toBeGreaterThan(single.confidence);
	});
});
