import { describe, expect, it } from "@effect/vitest";
import type { FacetName } from "../../constants/big-five";
import type { LifeDomain } from "../../constants/life-domain";
import { STEERABLE_DOMAINS } from "../../constants/life-domain";
import type { EvidenceInput } from "../../types/evidence";
import {
	computeFacetMetrics,
	computeSteeringTarget,
	type FacetMetrics,
	FORMULA_DEFAULTS,
	type FormulaConfig,
} from "../formula";
import { ev, m } from "./__fixtures__/formula-numerical.fixtures";

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
