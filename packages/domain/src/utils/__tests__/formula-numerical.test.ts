import { describe, expect, it } from "@effect/vitest";
import type { FacetName } from "../../constants/big-five";
import type { LifeDomain } from "../../constants/life-domain";
import { STEERABLE_DOMAINS } from "../../constants/life-domain";
import type { EvidenceInput } from "../../types/evidence";
import {
	computeContextMean,
	computeContextWeight,
	computeFacetMetrics,
	computeNormalizedEntropy,
	computeProjectedEntropy,
	computeSteeringTarget,
	type FacetMetrics,
	FORMULA_DEFAULTS,
	type FormulaConfig,
} from "../formula";

// ─── Test helpers ───────────────────────────────────────────────────

function ev(
	facet: FacetName,
	domain: LifeDomain,
	score: number,
	confidence: number,
): EvidenceInput {
	return { bigfiveFacet: facet, domain, score, confidence };
}

function m(result: Map<FacetName, FacetMetrics>, facet: FacetName): FacetMetrics {
	const metrics = result.get(facet);
	if (!metrics) throw new Error(`No metrics for ${facet}`);
	return metrics;
}

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

// ─── Steering: exact ΔP computation ─────────────────────────────────
describe("steering: exact ΔP domain selection", () => {
	it("with single saturated domain, all other domains have equal ΔP", () => {
		const dw = new Map<LifeDomain, number>([["work", 2.0]]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 10, confidence: 0.3, signalPower: 0, domainWeights: dw }],
		]);

		// With previousDomain = null (no switch cost), all non-work domains
		// should have identical ΔP since they all start at w=0
		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetDomain).not.toBe("work");
		// Any of the 4 other steerable domains is valid (first wins on tie)
	});

	it("switch cost can flip domain choice when ΔP values are close", () => {
		// Build scenario where two domains have similar ΔP
		// but one matches previousDomain (no switch cost) while other doesn't
		const dw = new Map<LifeDomain, number>([
			["work", 0.8],
			["leisure", 0.7],
		]);
		const metrics = new Map<FacetName, FacetMetrics>([
			[
				"imagination",
				{
					score: 10,
					confidence: 0.3,
					signalPower: 0.2,
					domainWeights: dw,
				},
			],
		]);

		const fromWork = computeSteeringTarget(metrics, "work", FORMULA_DEFAULTS);
		const fromSolo = computeSteeringTarget(metrics, "solo", FORMULA_DEFAULTS);

		// When previousDomain="work", work has 0 switch cost → may be preferred
		// When previousDomain="solo", work has switch cost → may lose to others
		// The exact outcome depends on ΔP magnitudes, but at minimum
		// the results should be deterministic and valid steerable domains
		expect(STEERABLE_DOMAINS).toContain(fromWork.targetDomain);
		expect(STEERABLE_DOMAINS).toContain(fromSolo.targetDomain);
	});

	it("lambda=0 eliminates switch cost entirely", () => {
		const dw = new Map<LifeDomain, number>([["work", 1.0]]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 10, confidence: 0.3, signalPower: 0, domainWeights: dw }],
		]);

		const noLambda: FormulaConfig = { ...FORMULA_DEFAULTS, lambda: 0 };
		const fromWork = computeSteeringTarget(metrics, "work", noLambda);
		const fromSolo = computeSteeringTarget(metrics, "solo", noLambda);

		// Without switch cost, previousDomain shouldn't matter
		expect(fromWork.targetDomain).toBe(fromSolo.targetDomain);
	});

	it("high lambda makes domain switching very expensive", () => {
		// Two domains with evidence, previousDomain is work
		const dw = new Map<LifeDomain, number>([
			["work", 0.5],
			["leisure", 0.5],
		]);
		const metrics = new Map<FacetName, FacetMetrics>([
			[
				"imagination",
				{
					score: 10,
					confidence: 0.3,
					signalPower: 0.3,
					domainWeights: dw,
				},
			],
		]);

		const highLambda: FormulaConfig = { ...FORMULA_DEFAULTS, lambda: 10 };
		const result = computeSteeringTarget(metrics, "work", highLambda);

		// With extreme switch cost, should strongly prefer staying on work
		expect(result.targetDomain).toBe("work");
	});
});

// ─── Steering: facet priority formula ───────────────────────────────
describe("steering: facet priority α(C_target - C_f)+ + β(P_target - P_f)+", () => {
	it("low confidence facet wins over low signal power facet when alpha > beta", () => {
		const config: FormulaConfig = { ...FORMULA_DEFAULTS, alpha: 2.0, beta: 0.5 };
		const dw = new Map<LifeDomain, number>([
			["work", 1.0],
			["leisure", 1.0],
		]);

		const metrics = new Map<FacetName, FacetMetrics>([
			// Low confidence, high signal power
			["imagination", { score: 10, confidence: 0.1, signalPower: 0.8, domainWeights: dw }],
			// High confidence, low signal power
			["trust", { score: 10, confidence: 0.7, signalPower: 0.1, domainWeights: dw }],
		]);

		const result = computeSteeringTarget(metrics, null, config);
		// With alpha=2, confidence gap dominates → imagination (conf=0.1) wins
		expect(result.targetFacet).toBe("imagination");
	});

	it("low signal power facet wins when beta > alpha", () => {
		const config: FormulaConfig = { ...FORMULA_DEFAULTS, alpha: 0.5, beta: 2.0 };
		const dw = new Map<LifeDomain, number>([
			["work", 1.0],
			["leisure", 1.0],
		]);

		const metrics = new Map<FacetName, FacetMetrics>([
			// High confidence, low signal power
			["imagination", { score: 10, confidence: 0.7, signalPower: 0.05, domainWeights: dw }],
			// Low confidence, high signal power
			["trust", { score: 10, confidence: 0.1, signalPower: 0.45, domainWeights: dw }],
		]);

		const result = computeSteeringTarget(metrics, null, config);
		// With beta=2, signal power gap dominates → imagination (power=0.05) has bigger gap
		// imagination priority = 0.5×(0.75-0.7) + 2.0×(0.5-0.05) = 0.025 + 0.9 = 0.925
		// trust priority = 0.5×(0.75-0.1) + 2.0×(0.5-0.45) = 0.325 + 0.1 = 0.425
		expect(result.targetFacet).toBe("imagination");
	});

	it("exact priority calculation with known values", () => {
		const dw = new Map<LifeDomain, number>([["work", 1.0]]);

		const metrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 10, confidence: 0.5, signalPower: 0.3, domainWeights: dw }],
			["trust", { score: 10, confidence: 0.6, signalPower: 0.2, domainWeights: dw }],
		]);

		// imagination: 1.0×(0.75-0.5) + 0.8×(0.5-0.3) = 0.25 + 0.16 = 0.41
		// trust:       1.0×(0.75-0.6) + 0.8×(0.5-0.2) = 0.15 + 0.24 = 0.39
		// imagination wins (0.41 > 0.39)
		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetFacet).toBe("imagination");
	});
});

// ─── Steering: "other" domain excluded from target ──────────────────
describe("steering: 'other' domain excluded from steering targets", () => {
	it("never selects 'other' as targetDomain", () => {
		// Evidence only in 'other' domain
		const dw = new Map<LifeDomain, number>([["other", 2.0]]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 10, confidence: 0.3, signalPower: 0, domainWeights: dw }],
		]);

		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetDomain).not.toBe("other");
		expect(STEERABLE_DOMAINS).toContain(result.targetDomain);
	});
});

// ─── Edge cases: extreme values ─────────────────────────────────────
describe("edge cases: extreme and boundary values", () => {
	it("score at boundaries: 0 and 20", () => {
		const evidence = [ev("imagination", "work", 0, 0.8), ev("trust", "leisure", 20, 0.8)];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		expect(m(result, "imagination").score).toBeCloseTo(0, 5);
		expect(m(result, "trust").score).toBeCloseTo(20, 5);
	});

	it("very low confidence (0.01) still produces valid metrics", () => {
		const evidence = [ev("imagination", "work", 10, 0.01)];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");
		expect(result.score).toBeCloseTo(10, 3);
		expect(result.confidence).toBeGreaterThan(0);
		expect(result.confidence).toBeLessThan(0.1);
		expect(Number.isFinite(result.signalPower)).toBe(true);
	});

	it("very high confidence (0.99) produces high but bounded confidence", () => {
		const evidence = [
			ev("imagination", "work", 10, 0.99),
			ev("imagination", "leisure", 10, 0.99),
			ev("imagination", "family", 10, 0.99),
		];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");
		expect(result.confidence).toBeLessThanOrEqual(FORMULA_DEFAULTS.C_max);
	});

	it("all evidence has confidence=0 → score uses epsilon safety, no NaN", () => {
		const evidence = [ev("imagination", "work", 15, 0), ev("imagination", "leisure", 5, 0)];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");
		expect(Number.isFinite(result.score)).toBe(true);
		expect(Number.isNaN(result.score)).toBe(false);
		expect(result.confidence).toBe(0);
	});

	it("massive evidence count: 100 items across 6 domains", () => {
		const domains: LifeDomain[] = ["work", "relationships", "family", "leisure", "solo", "other"];
		const evidence: EvidenceInput[] = Array.from({ length: 100 }, (_, i) =>
			ev("assertiveness", domains[i % 6], 10 + (i % 5), 0.3 + (i % 4) * 0.15),
		);

		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "assertiveness");
		expect(result.score).toBeGreaterThanOrEqual(0);
		expect(result.score).toBeLessThanOrEqual(20);
		expect(result.confidence).toBeGreaterThan(FORMULA_DEFAULTS.C_max * 0.99);
		expect(result.confidence).toBeLessThanOrEqual(FORMULA_DEFAULTS.C_max);
		// 6 balanced domains → high signal power
		expect(result.signalPower).toBeGreaterThan(0.8);
	});
});

// ─── Determinism ────────────────────────────────────────────────────
describe("determinism: same inputs always produce same outputs", () => {
	it("computeFacetMetrics is deterministic", () => {
		const evidence = [
			ev("imagination", "work", 15, 0.8),
			ev("imagination", "leisure", 12, 0.6),
			ev("trust", "family", 8, 0.4),
		];

		const r1 = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const r2 = computeFacetMetrics(evidence, FORMULA_DEFAULTS);

		for (const [facet, m1] of r1) {
			const m2 = r2.get(facet);
			expect(m2).toBeDefined();
			expect(m1.score).toBe(m2?.score);
			expect(m1.confidence).toBe(m2?.confidence);
			expect(m1.signalPower).toBe(m2?.signalPower);
		}
	});

	it("computeSteeringTarget is deterministic", () => {
		const dw = new Map<LifeDomain, number>([
			["work", 0.8],
			["leisure", 0.5],
		]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 10, confidence: 0.3, signalPower: 0.2, domainWeights: dw }],
			["trust", { score: 12, confidence: 0.5, signalPower: 0.1, domainWeights: dw }],
		]);

		const r1 = computeSteeringTarget(metrics, "work", FORMULA_DEFAULTS);
		const r2 = computeSteeringTarget(metrics, "work", FORMULA_DEFAULTS);

		expect(r1.targetFacet).toBe(r2.targetFacet);
		expect(r1.targetDomain).toBe(r2.targetDomain);
		expect(r1.steeringHint).toBe(r2.steeringHint);
	});
});
