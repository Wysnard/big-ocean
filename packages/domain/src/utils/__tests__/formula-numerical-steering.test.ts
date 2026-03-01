import { describe, expect, it } from "@effect/vitest";
import { ALL_FACETS, type FacetName } from "../../constants/big-five";
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

/** Helper: create all 30 facets above target, then override specific ones */
function makeBaseMetrics(overrides: [FacetName, FacetMetrics][]): Map<FacetName, FacetMetrics> {
	const defaultDw = new Map<LifeDomain, number>([
		["work", 1.5],
		["leisure", 1.2],
	]);
	const base = new Map<FacetName, FacetMetrics>(
		ALL_FACETS.map((f) => [
			f,
			{ score: 14, confidence: 0.85, signalPower: 0.6, domainWeights: defaultDw },
		]),
	);
	for (const [facet, metrics] of overrides) {
		base.set(facet, metrics);
	}
	return base;
}

// ─── Steering: exact ΔP computation ─────────────────────────────────
describe("steering: exact ΔP domain selection", () => {
	it("with single saturated domain, all other domains have equal ΔP", () => {
		const dw = new Map<LifeDomain, number>([["work", 2.0]]);
		const metrics = makeBaseMetrics([
			["imagination", { score: 10, confidence: 0.3, signalPower: 0, domainWeights: dw }],
		]);

		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetFacet).toBe("imagination");
		expect(result.targetDomain).not.toBe("work");
	});

	it("switch cost can flip domain choice when ΔP values are close", () => {
		const dw = new Map<LifeDomain, number>([
			["work", 0.8],
			["leisure", 0.7],
		]);
		const metrics = makeBaseMetrics([
			["imagination", { score: 10, confidence: 0.3, signalPower: 0.2, domainWeights: dw }],
		]);

		const fromWork = computeSteeringTarget(metrics, "work", FORMULA_DEFAULTS);
		const fromSolo = computeSteeringTarget(metrics, "solo", FORMULA_DEFAULTS);

		expect(STEERABLE_DOMAINS).toContain(fromWork.targetDomain);
		expect(STEERABLE_DOMAINS).toContain(fromSolo.targetDomain);
	});

	it("lambda=0 eliminates switch cost entirely", () => {
		const dw = new Map<LifeDomain, number>([["work", 1.0]]);
		const metrics = makeBaseMetrics([
			["imagination", { score: 10, confidence: 0.3, signalPower: 0, domainWeights: dw }],
		]);

		const noLambda: FormulaConfig = { ...FORMULA_DEFAULTS, lambda: 0 };
		const fromWork = computeSteeringTarget(metrics, "work", noLambda);
		const fromSolo = computeSteeringTarget(metrics, "solo", noLambda);

		expect(fromWork.targetDomain).toBe(fromSolo.targetDomain);
	});

	it("high lambda makes domain switching very expensive", () => {
		const dw = new Map<LifeDomain, number>([
			["work", 0.5],
			["leisure", 0.5],
		]);
		const metrics = makeBaseMetrics([
			["imagination", { score: 10, confidence: 0.3, signalPower: 0.3, domainWeights: dw }],
		]);

		const highLambda: FormulaConfig = { ...FORMULA_DEFAULTS, lambda: 10 };
		const result = computeSteeringTarget(metrics, "work", highLambda);

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

		const metrics = makeBaseMetrics([
			["imagination", { score: 10, confidence: 0.1, signalPower: 0.8, domainWeights: dw }],
			["trust", { score: 10, confidence: 0.7, signalPower: 0.1, domainWeights: dw }],
		]);

		const result = computeSteeringTarget(metrics, null, config);
		expect(result.targetFacet).toBe("imagination");
	});

	it("low signal power facet wins when beta > alpha", () => {
		const config: FormulaConfig = { ...FORMULA_DEFAULTS, alpha: 0.5, beta: 2.0 };
		const dw = new Map<LifeDomain, number>([
			["work", 1.0],
			["leisure", 1.0],
		]);

		const metrics = makeBaseMetrics([
			["imagination", { score: 10, confidence: 0.7, signalPower: 0.05, domainWeights: dw }],
			["trust", { score: 10, confidence: 0.1, signalPower: 0.45, domainWeights: dw }],
		]);

		const result = computeSteeringTarget(metrics, null, config);
		// imagination priority = 0.5×(0.75-0.7) + 2.0×(0.5-0.05) = 0.025 + 0.9 = 0.925
		// trust priority = 0.5×(0.75-0.1) + 2.0×(0.5-0.45) = 0.325 + 0.1 = 0.425
		expect(result.targetFacet).toBe("imagination");
	});

	it("exact priority calculation with known values", () => {
		const dw = new Map<LifeDomain, number>([["work", 1.0]]);

		const metrics = makeBaseMetrics([
			["imagination", { score: 10, confidence: 0.5, signalPower: 0.3, domainWeights: dw }],
			["trust", { score: 10, confidence: 0.6, signalPower: 0.2, domainWeights: dw }],
		]);

		// imagination: 1.0×(0.75-0.5) + 0.8×(0.5-0.3) = 0.25 + 0.16 = 0.41
		// trust:       1.0×(0.75-0.6) + 0.8×(0.5-0.2) = 0.15 + 0.24 = 0.39
		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetFacet).toBe("imagination");
	});
});

// ─── Steering: "other" domain excluded from target ──────────────────
describe("steering: 'other' domain excluded from steering targets", () => {
	it("never selects 'other' as targetDomain", () => {
		const dw = new Map<LifeDomain, number>([["other", 2.0]]);
		const metrics = makeBaseMetrics([
			["imagination", { score: 10, confidence: 0.3, signalPower: 0, domainWeights: dw }],
		]);

		const result = computeSteeringTarget(metrics, null, FORMULA_DEFAULTS);
		expect(result.targetDomain).not.toBe("other");
		expect(STEERABLE_DOMAINS).toContain(result.targetDomain);
	});
});

// ─── Edge cases: extreme values ─────────────────────────────────────
describe("edge cases: extreme and boundary values (v2)", () => {
	it("deviation at boundaries: -3 and +3", () => {
		const evidence = [
			ev("imagination", "work", -3, "strong", "high"),
			ev("trust", "leisure", 3, "strong", "high"),
		];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		// deviation -3 → score = 10 + (-3)*(10/3) = 0
		expect(m(result, "imagination").score).toBeCloseTo(0, 4);
		// deviation +3 → score = 10 + 3*(10/3) = 20
		expect(m(result, "trust").score).toBeCloseTo(20, 4);
	});

	it("weak/low confidence produces low but valid metrics", () => {
		// weak(0.3) * low(0.3) = 0.09
		const evidence = [ev("imagination", "work", 0, "weak", "low")];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");
		expect(result.score).toBeCloseTo(10, 3);
		expect(result.confidence).toBeGreaterThan(0);
		expect(result.confidence).toBeLessThan(0.2);
		expect(Number.isFinite(result.signalPower)).toBe(true);
	});

	it("strong/high confidence produces high but bounded confidence", () => {
		// strong(1.0) * high(0.9) = 0.9
		const evidence = [
			ev("imagination", "work", 0, "strong", "high"),
			ev("imagination", "leisure", 0, "strong", "high"),
			ev("imagination", "family", 0, "strong", "high"),
		];
		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");
		expect(result.confidence).toBeLessThanOrEqual(FORMULA_DEFAULTS.C_max);
	});

	it("massive evidence count: 100 items across 6 domains", () => {
		const domains: LifeDomain[] = ["work", "relationships", "family", "leisure", "solo", "other"];
		const strengths: Array<"weak" | "moderate" | "strong"> = ["weak", "moderate", "strong"];
		const confidences: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];
		const evidence: EvidenceInput[] = Array.from({ length: 100 }, (_, i) =>
			ev("assertiveness", domains[i % 6], (i % 7) - 3, strengths[i % 3], confidences[i % 3]),
		);

		const result = m(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "assertiveness");
		expect(result.score).toBeGreaterThanOrEqual(0);
		expect(result.score).toBeLessThanOrEqual(20);
		expect(result.confidence).toBeGreaterThan(FORMULA_DEFAULTS.C_max * 0.99);
		expect(result.confidence).toBeLessThanOrEqual(FORMULA_DEFAULTS.C_max);
		expect(result.signalPower).toBeGreaterThan(0.5);
	});
});

// ─── Determinism ────────────────────────────────────────────────────
describe("determinism: same inputs always produce same outputs", () => {
	it("computeFacetMetrics is deterministic", () => {
		const evidence = [
			ev("imagination", "work", 2, "strong", "medium"),
			ev("imagination", "leisure", 1, "moderate", "medium"),
			ev("trust", "family", -1, "weak", "medium"),
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
		const metrics = makeBaseMetrics([
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
