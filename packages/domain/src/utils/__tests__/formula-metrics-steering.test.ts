import { describe, expect, it } from "@effect/vitest";
import type { FacetName } from "../../constants/big-five";
import type { LifeDomain } from "../../constants/life-domain";
import type { EvidenceInput } from "../../types/evidence";
import {
	computeFacetMetrics,
	computeSteeringTarget,
	type FacetMetrics,
	FORMULA_DEFAULTS,
	type FormulaConfig,
	GREETING_SEED_POOL,
} from "../formula";
import { getMetrics, makeEvidence } from "./__fixtures__/formula.fixtures";

// ─── computeFacetMetrics tests ───────────────────────────────────────

describe("computeFacetMetrics", () => {
	it("5.5: returns empty map for empty evidence", () => {
		const result = computeFacetMetrics([], FORMULA_DEFAULTS);
		expect(result.size).toBe(0);
	});

	it("5.4: handles single evidence item without division by zero", () => {
		const evidence = [makeEvidence("imagination", "work", 15, 0.8)];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const m = getMetrics(result, "imagination");

		expect(m).toBeDefined();
		expect(Number.isFinite(m.score)).toBe(true);
		expect(Number.isFinite(m.confidence)).toBe(true);
		expect(Number.isFinite(m.signalPower)).toBe(true);
		expect(m.domainWeights).toBeDefined();
		expect(m.domainWeights.get("work")).toBeCloseTo(Math.sqrt(0.8), 10);
	});

	it("5.1: all outputs within documented ranges", () => {
		const evidence = [
			makeEvidence("imagination", "work", 18, 0.9),
			makeEvidence("imagination", "leisure", 12, 0.7),
			makeEvidence("imagination", "family", 14, 0.6),
		];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const m = getMetrics(result, "imagination");

		expect(m.score).toBeGreaterThanOrEqual(0);
		expect(m.score).toBeLessThanOrEqual(20);
		expect(m.confidence).toBeGreaterThanOrEqual(0);
		expect(m.confidence).toBeLessThanOrEqual(FORMULA_DEFAULTS.C_max);
		expect(m.signalPower).toBeGreaterThanOrEqual(0);
		expect(m.signalPower).toBeLessThanOrEqual(1);
	});

	it("5.2: more evidence → higher confidence (monotonic)", () => {
		const ev1 = [makeEvidence("trust", "work", 10, 0.8)];
		const ev2 = [makeEvidence("trust", "work", 10, 0.8), makeEvidence("trust", "leisure", 10, 0.7)];
		const ev3 = [
			makeEvidence("trust", "work", 10, 0.8),
			makeEvidence("trust", "leisure", 10, 0.7),
			makeEvidence("trust", "family", 10, 0.6),
		];

		const c1 = getMetrics(computeFacetMetrics(ev1, FORMULA_DEFAULTS), "trust").confidence;
		const c2 = getMetrics(computeFacetMetrics(ev2, FORMULA_DEFAULTS), "trust").confidence;
		const c3 = getMetrics(computeFacetMetrics(ev3, FORMULA_DEFAULTS), "trust").confidence;

		expect(c2).toBeGreaterThan(c1);
		expect(c3).toBeGreaterThan(c2);
	});

	it("5.3: confidence approaches C_max asymptotically, never exceeds", () => {
		const evidence: EvidenceInput[] = [];
		const domains: LifeDomain[] = ["work", "leisure", "family", "relationships", "solo", "other"];
		for (let i = 0; i < 50; i++) {
			evidence.push(makeEvidence("altruism", domains[i % 6], 15, 0.9));
		}
		const m = getMetrics(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "altruism");
		expect(m.confidence).toBeLessThanOrEqual(FORMULA_DEFAULTS.C_max);
		expect(m.confidence).toBeGreaterThan(FORMULA_DEFAULTS.C_max * 0.95);
	});

	it("populates domainWeights correctly for multi-domain evidence", () => {
		const evidence = [
			makeEvidence("imagination", "work", 15, 0.8),
			makeEvidence("imagination", "work", 12, 0.6),
			makeEvidence("imagination", "leisure", 14, 0.7),
		];
		const m = getMetrics(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");
		// work: √(0.8 + 0.6) = √1.4, leisure: √0.7
		expect(m.domainWeights.get("work")).toBeCloseTo(Math.sqrt(1.4), 10);
		expect(m.domainWeights.get("leisure")).toBeCloseTo(Math.sqrt(0.7), 10);
		expect(m.domainWeights.has("family")).toBe(false);
	});

	it("5.6: all-same-domain → signal power low (entropy ≈ 0)", () => {
		const evidence = [
			makeEvidence("orderliness", "work", 12, 0.8),
			makeEvidence("orderliness", "work", 14, 0.7),
			makeEvidence("orderliness", "work", 11, 0.6),
		];
		const m = getMetrics(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "orderliness");
		expect(m.signalPower).toBeCloseTo(0, 5);
	});

	it("5.7: perfectly balanced domains → signal power high", () => {
		const evidence = [
			makeEvidence("assertiveness", "work", 14, 0.8),
			makeEvidence("assertiveness", "leisure", 14, 0.8),
			makeEvidence("assertiveness", "family", 14, 0.8),
			makeEvidence("assertiveness", "relationships", 14, 0.8),
			makeEvidence("assertiveness", "solo", 14, 0.8),
		];
		const m = getMetrics(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "assertiveness");
		expect(m.signalPower).toBeGreaterThan(0.3);
	});

	it("5.12: multi-facet scenario with 10+ evidence records", () => {
		const evidence: EvidenceInput[] = [
			makeEvidence("imagination", "work", 16, 0.8),
			makeEvidence("imagination", "leisure", 18, 0.9),
			makeEvidence("imagination", "family", 14, 0.6),
			makeEvidence("trust", "relationships", 12, 0.7),
			makeEvidence("trust", "work", 10, 0.5),
			makeEvidence("orderliness", "work", 8, 0.8),
			makeEvidence("orderliness", "solo", 6, 0.6),
			makeEvidence("assertiveness", "work", 15, 0.7),
			makeEvidence("assertiveness", "relationships", 17, 0.9),
			makeEvidence("assertiveness", "leisure", 13, 0.5),
			makeEvidence("anxiety", "solo", 11, 0.6),
		];

		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		expect(result.size).toBe(5);

		for (const [, m] of result) {
			expect(m.score).toBeGreaterThanOrEqual(0);
			expect(m.score).toBeLessThanOrEqual(20);
			expect(m.confidence).toBeGreaterThanOrEqual(0);
			expect(m.confidence).toBeLessThanOrEqual(FORMULA_DEFAULTS.C_max);
			expect(m.signalPower).toBeGreaterThanOrEqual(0);
			expect(m.signalPower).toBeLessThanOrEqual(1);
		}
	});

	it("5.13: custom config values produce different results", () => {
		const evidence = [
			makeEvidence("imagination", "work", 15, 0.8),
			makeEvidence("imagination", "leisure", 12, 0.6),
		];

		const defaultResult = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const customConfig: FormulaConfig = {
			...FORMULA_DEFAULTS,
			C_max: 0.5,
			k: 1.5,
			betaVolume: 1.5,
		};
		const customResult = computeFacetMetrics(evidence, customConfig);

		const dm = getMetrics(defaultResult, "imagination");
		const cm = getMetrics(customResult, "imagination");

		// Different C_max should produce different confidence
		expect(dm.confidence).not.toBeCloseTo(cm.confidence, 2);
	});
});

// ─── computeSteeringTarget tests ─────────────────────────────────────

describe("computeSteeringTarget", () => {
	it("5.9: cold start — empty metrics returns greeting seed", () => {
		const metrics = new Map<FacetName, FacetMetrics>();
		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS, 0);
		expect(result.targetFacet).toBe(GREETING_SEED_POOL[0].facet);
		expect(result.targetDomain).toBe(GREETING_SEED_POOL[0].domain);
		expect(result.steeringHint).toContain("imagination");
	});

	it("5.9: cold start rotates through seed pool", () => {
		const metrics = new Map<FacetName, FacetMetrics>();
		const r0 = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS, 0);
		const r1 = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS, 1);
		const r5 = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS, 5);

		expect(r0.targetFacet).toBe("imagination");
		expect(r1.targetFacet).toBe("gregariousness");
		expect(r5.targetFacet).toBe("imagination"); // wraps
	});

	it("5.8: switch cost — same domain penalized less", () => {
		const dw = new Map<LifeDomain, number>([["work", 0.9]]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 10, confidence: 0.3, signalPower: 0.1, domainWeights: dw }],
		]);

		const sameDomain = computeSteeringTarget(metrics, "work", FORMULA_DEFAULTS);
		const diffDomain = computeSteeringTarget(metrics, "solo", FORMULA_DEFAULTS);

		// Both should select the same target facet (imagination)
		expect(sameDomain.targetFacet).toBe("imagination");
		expect(diffDomain.targetFacet).toBe("imagination");
	});

	it("5.10: facet priority tiebreaker — lowest confidence wins when all above target", () => {
		const dwIm = new Map<LifeDomain, number>([
			["work", 1.5],
			["leisure", 1.2],
		]);
		const dwTr = new Map<LifeDomain, number>([
			["relationships", 1.3],
			["work", 1.0],
		]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 15, confidence: 0.85, signalPower: 0.6, domainWeights: dwIm }],
			["trust", { score: 12, confidence: 0.78, signalPower: 0.55, domainWeights: dwTr }],
		]);

		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		// Both above C_target (0.75) and P_target (0.5) → priority = 0
		// Tiebreaker: lowest confidence → trust (0.78 < 0.85)
		expect(result.targetFacet).toBe("trust");
	});

	it("5.11: domain gain — empty domain has higher ΔP than saturated", () => {
		// All evidence from work only → steering should pick a different domain
		const dw = new Map<LifeDomain, number>([["work", 1.2]]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 10, confidence: 0.2, signalPower: 0.0, domainWeights: dw }],
		]);

		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetFacet).toBe("imagination");
		// With exact weights, steering knows work is the only domain → picks a different one
		expect(result.targetDomain).not.toBe("work");
		expect(typeof result.steeringHint).toBe("string");
		expect(result.steeringHint.length).toBeGreaterThan(0);
	});

	it("steers away from saturated domain using exact weights", () => {
		// All evidence from work only → steering should NOT pick work
		const dw = new Map<LifeDomain, number>([["work", 2.5]]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["orderliness", { score: 14, confidence: 0.5, signalPower: 0.0, domainWeights: dw }],
		]);

		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		// work is the only domain with evidence → adding to any other domain improves entropy more
		expect(result.targetDomain).not.toBe("work");
	});

	it("returns valid SteeringTarget shape", () => {
		const dw1 = new Map<LifeDomain, number>([["work", 0.8]]);
		const dw2 = new Map<LifeDomain, number>([["leisure", 0.7]]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["orderliness", { score: 8, confidence: 0.4, signalPower: 0.2, domainWeights: dw1 }],
			["imagination", { score: 16, confidence: 0.6, signalPower: 0.3, domainWeights: dw2 }],
		]);

		const result = computeSteeringTarget(metrics, "work", FORMULA_DEFAULTS);
		expect(result).toHaveProperty("targetFacet");
		expect(result).toHaveProperty("targetDomain");
		expect(result).toHaveProperty("steeringHint");
	});
});
