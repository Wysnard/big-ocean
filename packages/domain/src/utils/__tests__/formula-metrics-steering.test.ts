import { describe, expect, it } from "@effect/vitest";
import { ALL_FACETS, type FacetName, OCEAN_INTERLEAVED_ORDER } from "../../constants/big-five";
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

/** Helper: create a metrics map with all 30 facets above target (priority=0) */
function makeAllFacetsAboveTarget(): Map<FacetName, FacetMetrics> {
	const dw = new Map<LifeDomain, number>([
		["work", 1.5],
		["leisure", 1.2],
	]);
	return new Map<FacetName, FacetMetrics>(
		ALL_FACETS.map((f) => [f, { score: 14, confidence: 0.85, signalPower: 0.6, domainWeights: dw }]),
	);
}

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
		const customConfig: FormulaConfig = { ...FORMULA_DEFAULTS, C_max: 0.5, k: 1.5, betaVolume: 1.5 };
		const customResult = computeFacetMetrics(evidence, customConfig);
		const dm = getMetrics(defaultResult, "imagination");
		const cm = getMetrics(customResult, "imagination");
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
		expect(r5.targetFacet).toBe("imagination");
	});

	it("5.8: switch cost — same domain penalized less", () => {
		const metrics = makeAllFacetsAboveTarget();
		const dw = new Map<LifeDomain, number>([["work", 0.9]]);
		metrics.set("imagination", { score: 10, confidence: 0.3, signalPower: 0.1, domainWeights: dw });
		const sameDomain = computeSteeringTarget(metrics, "work", FORMULA_DEFAULTS);
		const diffDomain = computeSteeringTarget(metrics, "solo", FORMULA_DEFAULTS);
		expect(sameDomain.targetFacet).toBe("imagination");
		expect(diffDomain.targetFacet).toBe("imagination");
	});

	it("5.10: OCEAN-interleaved tiebreaker — first in OCEAN order wins when all priorities equal", () => {
		const metrics = makeAllFacetsAboveTarget();
		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetFacet).toBe(OCEAN_INTERLEAVED_ORDER[0]);
		expect(result.bestPriority).toBe(0);
	});

	it("unexplored facets get maximum priority (1.15)", () => {
		const dw = new Map<LifeDomain, number>([["work", 1.5], ["leisure", 1.2]]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 14, confidence: 0.85, signalPower: 0.6, domainWeights: dw }],
			["self_efficacy", { score: 14, confidence: 0.85, signalPower: 0.6, domainWeights: dw }],
			["friendliness", { score: 14, confidence: 0.85, signalPower: 0.6, domainWeights: dw }],
			["trust", { score: 14, confidence: 0.85, signalPower: 0.6, domainWeights: dw }],
			["anxiety", { score: 14, confidence: 0.85, signalPower: 0.6, domainWeights: dw }],
		]);
		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.bestPriority).toBeCloseTo(1.15);
		expect(metrics.has(result.targetFacet)).toBe(false);
		// First unexplored in OCEAN order: rank 5 = artistic_interests (O[1])
		expect(result.targetFacet).toBe("artistic_interests");
	});

	it("OCEAN interleaving ensures trait spread", () => {
		const dw = new Map<LifeDomain, number>([["work", 1.5], ["leisure", 1.2]]);
		const metrics = new Map<FacetName, FacetMetrics>([
			["imagination", { score: 14, confidence: 0.85, signalPower: 0.6, domainWeights: dw }],
		]);
		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		// First unexplored in OCEAN order: self_efficacy (C[0], rank 1)
		expect(result.targetFacet).toBe("self_efficacy");
	});

	it("all 30 facets explored — tiebreaker selects by OCEAN order", () => {
		const metrics = makeAllFacetsAboveTarget();
		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetFacet).toBe("imagination");
	});

	it("5.11: domain gain — empty domain has higher ΔP than saturated", () => {
		const metrics = makeAllFacetsAboveTarget();
		const dw = new Map<LifeDomain, number>([["work", 1.2]]);
		metrics.set("imagination", { score: 10, confidence: 0.2, signalPower: 0.0, domainWeights: dw });
		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetFacet).toBe("imagination");
		expect(result.targetDomain).not.toBe("work");
		expect(typeof result.steeringHint).toBe("string");
		expect(result.steeringHint.length).toBeGreaterThan(0);
	});

	it("steers away from saturated domain using exact weights", () => {
		const metrics = makeAllFacetsAboveTarget();
		const dw = new Map<LifeDomain, number>([["work", 2.5]]);
		metrics.set("orderliness", { score: 14, confidence: 0.5, signalPower: 0.0, domainWeights: dw });
		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetDomain).not.toBe("work");
	});

	it("returns valid SteeringTarget shape", () => {
		const metrics = makeAllFacetsAboveTarget();
		metrics.set("orderliness", { score: 8, confidence: 0.4, signalPower: 0.2, domainWeights: new Map([["work", 0.8]]) });
		metrics.set("imagination", { score: 16, confidence: 0.6, signalPower: 0.3, domainWeights: new Map([["leisure", 0.7]]) });
		const result = computeSteeringTarget(metrics, "work", FORMULA_DEFAULTS);
		expect(result).toHaveProperty("targetFacet");
		expect(result).toHaveProperty("targetDomain");
		expect(result).toHaveProperty("steeringHint");
		expect(result).toHaveProperty("bestPriority");
	});
});

// ─── OCEAN_INTERLEAVED_ORDER constant tests ──────────────────────────

describe("OCEAN_INTERLEAVED_ORDER", () => {
	it("has exactly 30 facets", () => {
		expect(OCEAN_INTERLEAVED_ORDER.length).toBe(30);
	});

	it("first 5 elements are one from each trait (O, C, E, A, N)", () => {
		const first5 = OCEAN_INTERLEAVED_ORDER.slice(0, 5);
		expect(first5[0]).toBe("imagination");
		expect(first5[1]).toBe("self_efficacy");
		expect(first5[2]).toBe("friendliness");
		expect(first5[3]).toBe("trust");
		expect(first5[4]).toBe("anxiety");
	});

	it("contains no duplicates", () => {
		const unique = new Set(OCEAN_INTERLEAVED_ORDER);
		expect(unique.size).toBe(30);
	});

	it("contains all facets from ALL_FACETS", () => {
		const ordered = new Set(OCEAN_INTERLEAVED_ORDER);
		for (const facet of ALL_FACETS) {
			expect(ordered.has(facet)).toBe(true);
		}
	});
});
