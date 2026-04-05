import { describe, expect, it } from "@effect/vitest";
import type { LifeDomain } from "../../constants/life-domain";
import type { EvidenceInput } from "../../types/evidence";
import { computeFacetMetrics, FORMULA_DEFAULTS, type FormulaConfig } from "../formula";
import { getMetrics, makeEvidence } from "./__fixtures__/formula.fixtures";

describe("computeFacetMetrics", () => {
	it("returns empty map for empty evidence", () => {
		const result = computeFacetMetrics([], FORMULA_DEFAULTS);
		expect(result.size).toBe(0);
	});

	it("handles a single evidence item without division by zero", () => {
		const evidence = [makeEvidence("imagination", "work", 2, "strong", "medium")];
		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const metrics = getMetrics(result, "imagination");

		expect(Number.isFinite(metrics.score)).toBe(true);
		expect(Number.isFinite(metrics.confidence)).toBe(true);
		expect(metrics.domainWeights.get("work")).toBeCloseTo(Math.sqrt(0.6), 5);
	});

	it("keeps score and confidence within documented bounds", () => {
		const evidence = [
			makeEvidence("imagination", "work", 3, "strong", "high"),
			makeEvidence("imagination", "leisure", 1, "moderate", "high"),
			makeEvidence("imagination", "family", 1, "moderate", "medium"),
		];
		const metrics = getMetrics(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");

		expect(metrics.score).toBeGreaterThanOrEqual(0);
		expect(metrics.score).toBeLessThanOrEqual(20);
		expect(metrics.confidence).toBeGreaterThanOrEqual(0);
		expect(metrics.confidence).toBeLessThanOrEqual(FORMULA_DEFAULTS.C_max);
	});

	it("increases confidence monotonically as evidence accumulates", () => {
		const ev1 = [makeEvidence("trust", "work", 0, "strong", "medium")];
		const ev2 = [
			makeEvidence("trust", "work", 0, "strong", "medium"),
			makeEvidence("trust", "leisure", 0, "moderate", "high"),
		];
		const ev3 = [
			makeEvidence("trust", "work", 0, "strong", "medium"),
			makeEvidence("trust", "leisure", 0, "moderate", "high"),
			makeEvidence("trust", "family", 0, "moderate", "medium"),
		];

		const c1 = getMetrics(computeFacetMetrics(ev1, FORMULA_DEFAULTS), "trust").confidence;
		const c2 = getMetrics(computeFacetMetrics(ev2, FORMULA_DEFAULTS), "trust").confidence;
		const c3 = getMetrics(computeFacetMetrics(ev3, FORMULA_DEFAULTS), "trust").confidence;

		expect(c2).toBeGreaterThan(c1);
		expect(c3).toBeGreaterThan(c2);
	});

	it("approaches C_max asymptotically without exceeding it", () => {
		const evidence: EvidenceInput[] = [];
		const domains: LifeDomain[] = ["work", "leisure", "family", "relationships", "health", "other"];

		for (let i = 0; i < 50; i++) {
			evidence.push(makeEvidence("altruism", domains[i % 6], 2, "strong", "high"));
		}

		const metrics = getMetrics(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "altruism");
		expect(metrics.confidence).toBeLessThanOrEqual(FORMULA_DEFAULTS.C_max);
		expect(metrics.confidence).toBeGreaterThan(FORMULA_DEFAULTS.C_max * 0.95);
	});

	it("populates domain weights correctly for multi-domain evidence", () => {
		const evidence = [
			makeEvidence("imagination", "work", 2, "strong", "medium"),
			makeEvidence("imagination", "work", 1, "moderate", "medium"),
			makeEvidence("imagination", "leisure", 1, "moderate", "high"),
		];
		const metrics = getMetrics(computeFacetMetrics(evidence, FORMULA_DEFAULTS), "imagination");

		expect(metrics.domainWeights.get("work")).toBeCloseTo(Math.sqrt(0.6 + 0.36), 5);
		expect(metrics.domainWeights.get("leisure")).toBeCloseTo(Math.sqrt(0.54), 5);
		expect(metrics.domainWeights.has("family")).toBe(false);
	});

	it("handles multi-facet evidence without cross-contamination", () => {
		const evidence: EvidenceInput[] = [
			makeEvidence("imagination", "work", 2, "strong", "medium"),
			makeEvidence("imagination", "leisure", 3, "strong", "high"),
			makeEvidence("imagination", "family", 1, "moderate", "medium"),
			makeEvidence("trust", "relationships", 1, "moderate", "high"),
			makeEvidence("trust", "work", 0, "weak", "medium"),
			makeEvidence("orderliness", "work", -1, "strong", "medium"),
			makeEvidence("orderliness", "health", -1, "moderate", "medium"),
			makeEvidence("assertiveness", "work", 2, "moderate", "high"),
			makeEvidence("assertiveness", "relationships", 2, "strong", "high"),
			makeEvidence("assertiveness", "leisure", 1, "weak", "medium"),
			makeEvidence("anxiety", "health", 0, "moderate", "medium"),
		];

		const result = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		expect(result.size).toBe(5);

		for (const [, metrics] of result) {
			expect(metrics.score).toBeGreaterThanOrEqual(0);
			expect(metrics.score).toBeLessThanOrEqual(20);
			expect(metrics.confidence).toBeGreaterThanOrEqual(0);
			expect(metrics.confidence).toBeLessThanOrEqual(FORMULA_DEFAULTS.C_max);
		}
	});

	it("responds to custom config values", () => {
		const evidence = [
			makeEvidence("imagination", "work", 2, "strong", "medium"),
			makeEvidence("imagination", "leisure", 1, "moderate", "medium"),
		];
		const defaultResult = computeFacetMetrics(evidence, FORMULA_DEFAULTS);
		const customConfig: FormulaConfig = { ...FORMULA_DEFAULTS, C_max: 0.5, k: 1.5 };
		const customResult = computeFacetMetrics(evidence, customConfig);

		const defaultMetrics = getMetrics(defaultResult, "imagination");
		const customMetrics = getMetrics(customResult, "imagination");
		expect(defaultMetrics.confidence).not.toBeCloseTo(customMetrics.confidence, 2);
	});
});
