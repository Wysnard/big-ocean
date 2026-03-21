/**
 * Observation Focus Strength Tests — Story 26-1
 *
 * Pure function tests for ObservationFocus strength formulas and per-domain confidence.
 * Tests cover: per-domain confidence, relate, noticing (smoothed clarity),
 * contradiction, convergence, and [0, 1] bounding (FR7, FR20).
 */
import { describe, expect, it } from "vitest";
import { FORMULA_DEFAULTS } from "../../formula";
import {
	computeContradictionStrength,
	computeConvergenceStrength,
	computeNoticingStrength,
	computePerDomainConfidence,
	computeRelateStrength,
	computeSmoothedClarity,
	OBSERVATION_FOCUS_CONSTANTS,
} from "../observation-focus";

// ─── Per-Domain Confidence ───────────────────────────────────────────

describe("computePerDomainConfidence", () => {
	it("matches existing confidence formula when given same weight", () => {
		// The facet-level confidence in formula.ts is: C_max * (1 - exp(-k * W))
		// Per-domain confidence uses same C_MAX and k but scoped to single domain weight
		const weight = 1.5;
		const expected = FORMULA_DEFAULTS.C_max * (1 - Math.exp(-FORMULA_DEFAULTS.k * weight));
		const result = computePerDomainConfidence(weight);
		expect(result).toBeCloseTo(expected, 10);
	});

	it("returns 0 for zero weight", () => {
		expect(computePerDomainConfidence(0)).toBe(0);
	});

	it("approaches C_MAX for very large weight", () => {
		const result = computePerDomainConfidence(100);
		expect(result).toBeCloseTo(OBSERVATION_FOCUS_CONSTANTS.C_MAX, 5);
	});

	it("uses C_MAX=0.9 and K_CONFIDENCE=0.7", () => {
		expect(OBSERVATION_FOCUS_CONSTANTS.C_MAX).toBe(0.9);
		expect(OBSERVATION_FOCUS_CONSTANTS.K_CONFIDENCE).toBe(0.7);
	});
});

// ─── Relate Strength ─────────────────────────────────────────────────

describe("computeRelateStrength", () => {
	it("returns high strength for high energy and high telling", () => {
		expect(computeRelateStrength(0.8, 0.9)).toBeCloseTo(0.72, 10);
	});

	it("returns weak strength when either axis is low", () => {
		expect(computeRelateStrength(0.1, 0.9)).toBeCloseTo(0.09, 10);
		expect(computeRelateStrength(0.9, 0.1)).toBeCloseTo(0.09, 10);
	});

	it("returns 0 when energy is 0", () => {
		expect(computeRelateStrength(0, 0.9)).toBe(0);
	});

	it("returns 0 when telling is 0", () => {
		expect(computeRelateStrength(0.9, 0)).toBe(0);
	});

	it("returns 1 for maximum inputs", () => {
		expect(computeRelateStrength(1, 1)).toBe(1);
	});

	it("is bounded [0, 1]", () => {
		const result = computeRelateStrength(1, 1);
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThanOrEqual(1);
	});
});

// ─── Smoothed Clarity ────────────────────────────────────────────────

describe("computeSmoothedClarity", () => {
	it("applies EMA formula with default decay", () => {
		// decay * current + (1 - decay) * previous
		// 0.5 * 0.8 + 0.5 * 0.4 = 0.6
		const result = computeSmoothedClarity(0.4, 0.8);
		expect(result).toBeCloseTo(0.6, 10);
	});

	it("uses CLARITY_EMA_DECAY=0.5 by default", () => {
		expect(OBSERVATION_FOCUS_CONSTANTS.CLARITY_EMA_DECAY).toBe(0.5);
	});

	it("converges toward current clarity over iterations", () => {
		let smoothed = 0.0;
		const target = 0.9;
		for (let i = 0; i < 10; i++) {
			smoothed = computeSmoothedClarity(smoothed, target);
		}
		// After 10 iterations with decay=0.5, should be very close to target
		expect(smoothed).toBeCloseTo(target, 2);
	});

	it("accepts custom decay parameter", () => {
		// decay=0.8: 0.8 * 1.0 + 0.2 * 0.0 = 0.8
		const result = computeSmoothedClarity(0.0, 1.0, 0.8);
		expect(result).toBeCloseTo(0.8, 10);
	});
});

// ─── Noticing Strength ───────────────────────────────────────────────

describe("computeNoticingStrength", () => {
	it("returns smoothedClarity directly", () => {
		expect(computeNoticingStrength(0.65)).toBeCloseTo(0.65, 10);
	});

	it("is bounded [0, 1]", () => {
		expect(computeNoticingStrength(0)).toBe(0);
		expect(computeNoticingStrength(1)).toBe(1);
	});

	it("clamps values above 1 to 1", () => {
		expect(computeNoticingStrength(1.5)).toBe(1);
	});

	it("clamps negative values to 0", () => {
		expect(computeNoticingStrength(-0.1)).toBe(0);
	});
});

// ─── Contradiction Strength ──────────────────────────────────────────

describe("computeContradictionStrength", () => {
	it("returns high strength for high delta and high confidence", () => {
		// delta=0.8, conf_a=0.7, conf_b=0.6 => 0.8 * 0.6 = 0.48
		const result = computeContradictionStrength(0.8, 0.7, 0.6);
		expect(result).toBeCloseTo(0.48, 10);
	});

	it("returns weak strength for high delta but low confidence", () => {
		// delta=0.9, conf_a=0.1, conf_b=0.8 => 0.9 * 0.1 = 0.09
		const result = computeContradictionStrength(0.9, 0.1, 0.8);
		expect(result).toBeCloseTo(0.09, 10);
	});

	it("returns 0 when delta is 0", () => {
		expect(computeContradictionStrength(0, 0.8, 0.8)).toBe(0);
	});

	it("returns 0 when both confidences are 0", () => {
		expect(computeContradictionStrength(0.9, 0, 0)).toBe(0);
	});

	it("is bounded [0, 1]", () => {
		const result = computeContradictionStrength(1, 0.9, 0.9);
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThanOrEqual(1);
	});
});

// ─── Convergence Strength ────────────────────────────────────────────

describe("computeConvergenceStrength", () => {
	it("returns strong signal for 3+ domains with tight spread and high confidence", () => {
		// normalizedSpread=0.1, confidences=[0.8, 0.7, 0.75] => (1-0.1) * 0.7 = 0.63
		const result = computeConvergenceStrength(0.1, [0.8, 0.7, 0.75]);
		expect(result).toBeCloseTo(0.63, 10);
	});

	it("returns 0 for fewer than 3 domains", () => {
		expect(computeConvergenceStrength(0.1, [0.8, 0.7])).toBe(0);
		expect(computeConvergenceStrength(0.1, [0.8])).toBe(0);
		expect(computeConvergenceStrength(0.1, [])).toBe(0);
	});

	it("returns 0 when normalizedSpread is 1", () => {
		// (1 - 1) * min(...) = 0
		const result = computeConvergenceStrength(1, [0.8, 0.7, 0.6]);
		expect(result).toBe(0);
	});

	it("returns weak signal when min confidence is low", () => {
		// normalizedSpread=0.0, confidences=[0.8, 0.7, 0.05] => (1-0) * 0.05 = 0.05
		const result = computeConvergenceStrength(0.0, [0.8, 0.7, 0.05]);
		expect(result).toBeCloseTo(0.05, 10);
	});

	it("is bounded [0, 1]", () => {
		const result = computeConvergenceStrength(0, [0.9, 0.9, 0.9]);
		expect(result).toBeGreaterThanOrEqual(0);
		expect(result).toBeLessThanOrEqual(1);
	});

	it("works with exactly 3 domains", () => {
		const result = computeConvergenceStrength(0.2, [0.6, 0.6, 0.6]);
		expect(result).toBeCloseTo(0.48, 10);
	});

	it("works with more than 3 domains", () => {
		const result = computeConvergenceStrength(0.05, [0.8, 0.7, 0.75, 0.9]);
		// (1 - 0.05) * 0.7 = 0.665
		expect(result).toBeCloseTo(0.665, 10);
	});
});
