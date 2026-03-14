/**
 * Observation Gating & Competition Tests — Story 26-2
 *
 * Pure function tests for observation gating: explore mode (phase-gated
 * threshold with mutual exclusion) and close mode (raw strength argmax).
 *
 * Tests cover (AC #9):
 * - Early session (low phase): Relate wins by default
 * - Mid session (moderate phase + strong signal): noticing fires
 * - Mutual exclusion: contradiction > convergence > noticing
 * - Escalation: high fire count blocks moderate signals
 * - Close mode: raw strength competition, Relate can win
 * - Close mode: simmering contradiction wins
 * - Threshold escalation values
 * - Constants are named and match expected values
 */
import { describe, expect, it } from "vitest";
import type { LifeDomain } from "../../../constants/life-domain";
import type { ContradictionTarget, ConvergenceTarget } from "../../../types/pacing";
import {
	evaluateObservationGating,
	OBSERVATION_GATING_CONSTANTS,
	type ObservationGatingInput,
} from "../observation-gating";

// ─── Helpers ────────────────────────────────────────────────────────

/** Helper to create a minimal explore input */
function exploreInput(overrides: Partial<ObservationGatingInput> = {}): ObservationGatingInput {
	return {
		mode: "explore",
		phase: 0.5,
		sharedFireCount: 0,
		relateStrength: 0.3,
		noticingStrength: 0.1,
		contradictionStrength: 0.1,
		convergenceStrength: 0.1,
		noticingDomain: "work" as LifeDomain,
		...overrides,
	};
}

/** Helper to create a minimal close input */
function closeInput(overrides: Partial<ObservationGatingInput> = {}): ObservationGatingInput {
	return {
		mode: "close",
		phase: 0.8,
		sharedFireCount: 0,
		relateStrength: 0.3,
		noticingStrength: 0.1,
		contradictionStrength: 0.1,
		convergenceStrength: 0.1,
		noticingDomain: "work" as LifeDomain,
		...overrides,
	};
}

const sampleContradictionTarget: ContradictionTarget = {
	facet: "Openness to Experience" as any,
	pair: [
		{ domain: "work" as LifeDomain, score: 0.8, confidence: 0.7 },
		{ domain: "relationships" as LifeDomain, score: 0.2, confidence: 0.6 },
	],
	strength: 0.5,
};

const sampleConvergenceTarget: ConvergenceTarget = {
	facet: "Openness to Experience" as any,
	domains: [
		{ domain: "work" as LifeDomain, score: 0.7, confidence: 0.6 },
		{ domain: "relationships" as LifeDomain, score: 0.72, confidence: 0.6 },
		{ domain: "self" as LifeDomain, score: 0.68, confidence: 0.6 },
	],
	strength: 0.5,
};

// ─── Constants ──────────────────────────────────────────────────────

describe("OBSERVATION_GATING_CONSTANTS", () => {
	it("defines OBSERVE_BASE = 0.12", () => {
		expect(OBSERVATION_GATING_CONSTANTS.OBSERVE_BASE).toBe(0.12);
	});

	it("defines OBSERVE_STEP = 0.04", () => {
		expect(OBSERVATION_GATING_CONSTANTS.OBSERVE_STEP).toBe(0.04);
	});
});

// ─── Explore Mode ───────────────────────────────────────────────────

describe("evaluateObservationGating — explore mode", () => {
	it("early session (low phase): no non-Relate focus clears threshold -> Relate wins", () => {
		const result = evaluateObservationGating(
			exploreInput({
				phase: 0.1,
				noticingStrength: 0.3,
				contradictionStrength: 0.2,
				convergenceStrength: 0.15,
			}),
		);

		expect(result.focus.type).toBe("relate");
		// effectiveStrength for noticing: 0.3 * 0.1 = 0.03, threshold at n=0: 0.12
		// None clear threshold
		expect(result.debug.mode).toBe("explore");
		expect(result.debug.phase).toBeCloseTo(0.1);
		expect(result.debug.threshold).toBeCloseTo(0.12);
	});

	it("mid session (moderate phase + strong signal): noticing clears threshold -> fires", () => {
		const result = evaluateObservationGating(
			exploreInput({
				phase: 0.7,
				noticingStrength: 0.5,
				contradictionStrength: 0.05,
				convergenceStrength: 0.05,
				noticingDomain: "work" as LifeDomain,
			}),
		);

		// effectiveStrength for noticing: 0.5 * 0.7 = 0.35, threshold at n=0: 0.12
		// Clears threshold
		expect(result.focus.type).toBe("noticing");
		if (result.focus.type === "noticing") {
			expect(result.focus.domain).toBe("work");
		}
	});

	it("nothing clears threshold -> Relate wins by default", () => {
		const result = evaluateObservationGating(
			exploreInput({
				phase: 0.3,
				noticingStrength: 0.1,
				contradictionStrength: 0.1,
				convergenceStrength: 0.1,
				sharedFireCount: 0,
			}),
		);

		// effectiveStrength: 0.1 * 0.3 = 0.03 for all, threshold: 0.12
		expect(result.focus.type).toBe("relate");
		expect(result.debug.mutualExclusionApplied).toBe(false);
	});

	it("mutual exclusion: contradiction and noticing both clear -> contradiction wins", () => {
		const result = evaluateObservationGating(
			exploreInput({
				phase: 0.8,
				noticingStrength: 0.5,
				contradictionStrength: 0.4,
				convergenceStrength: 0.05,
				contradictionTarget: sampleContradictionTarget,
				noticingDomain: "work" as LifeDomain,
			}),
		);

		// noticing effective: 0.5 * 0.8 = 0.40 > 0.12
		// contradiction effective: 0.4 * 0.8 = 0.32 > 0.12
		// Both clear, but contradiction has higher priority
		expect(result.focus.type).toBe("contradiction");
		expect(result.debug.mutualExclusionApplied).toBe(true);
	});

	it("mutual exclusion priority: contradiction > convergence > noticing", () => {
		// All three clear, contradiction wins
		const result1 = evaluateObservationGating(
			exploreInput({
				phase: 0.9,
				noticingStrength: 0.5,
				contradictionStrength: 0.3,
				convergenceStrength: 0.4,
				contradictionTarget: sampleContradictionTarget,
				convergenceTarget: sampleConvergenceTarget,
			}),
		);
		expect(result1.focus.type).toBe("contradiction");

		// Only convergence and noticing clear, convergence wins
		const result2 = evaluateObservationGating(
			exploreInput({
				phase: 0.9,
				noticingStrength: 0.5,
				contradictionStrength: 0.01, // won't clear
				convergenceStrength: 0.4,
				convergenceTarget: sampleConvergenceTarget,
			}),
		);
		expect(result2.focus.type).toBe("convergence");
	});

	it("escalation: after 3 fires, threshold blocks moderate signals", () => {
		const result = evaluateObservationGating(
			exploreInput({
				phase: 0.5,
				noticingStrength: 0.4,
				contradictionStrength: 0.3,
				convergenceStrength: 0.2,
				sharedFireCount: 3,
			}),
		);

		// threshold at n=3: 0.12 + 0.04 * 3 = 0.24
		// noticing effective: 0.4 * 0.5 = 0.20 — does NOT clear 0.24
		// contradiction effective: 0.3 * 0.5 = 0.15 — does NOT clear 0.24
		expect(result.focus.type).toBe("relate");
		expect(result.debug.threshold).toBeCloseTo(0.24);
	});

	it("threshold escalation: n=0 -> 0.12, n=1 -> 0.16, n=2 -> 0.20, n=3 -> 0.24, n=4 -> 0.28", () => {
		for (const [n, expected] of [
			[0, 0.12],
			[1, 0.16],
			[2, 0.2],
			[3, 0.24],
			[4, 0.28],
		] as const) {
			const result = evaluateObservationGating(
				exploreInput({
					sharedFireCount: n,
					noticingStrength: 0.01, // won't clear any threshold
				}),
			);
			expect(result.debug.threshold).toBeCloseTo(expected, 10);
		}
	});
});

// ─── Close Mode ─────────────────────────────────────────────────────

describe("evaluateObservationGating — close mode", () => {
	it("all compete on raw strength, Relate wins when energy x telling is strongest", () => {
		const result = evaluateObservationGating(
			closeInput({
				relateStrength: 0.8,
				noticingStrength: 0.3,
				contradictionStrength: 0.2,
				convergenceStrength: 0.1,
			}),
		);

		expect(result.focus.type).toBe("relate");
		expect(result.debug.mode).toBe("close");
		// No threshold in close mode
		expect(result.debug.threshold).toBe(0);
	});

	it("simmering contradiction wins when its raw strength is highest", () => {
		const result = evaluateObservationGating(
			closeInput({
				relateStrength: 0.3,
				noticingStrength: 0.2,
				contradictionStrength: 0.6,
				convergenceStrength: 0.1,
				contradictionTarget: sampleContradictionTarget,
			}),
		);

		expect(result.focus.type).toBe("contradiction");
	});

	it("no phase gating in close mode — uses raw strengths directly", () => {
		const result = evaluateObservationGating(
			closeInput({
				phase: 0.1, // very low phase doesn't matter
				relateStrength: 0.2,
				noticingStrength: 0.5,
				contradictionStrength: 0.1,
				convergenceStrength: 0.1,
				noticingDomain: "work" as LifeDomain,
			}),
		);

		// noticing has highest raw strength, should win despite low phase
		expect(result.focus.type).toBe("noticing");
	});

	it("tiebreak uses priority: contradiction > convergence > noticing > relate", () => {
		// All equal — contradiction wins tiebreak
		const result = evaluateObservationGating(
			closeInput({
				relateStrength: 0.5,
				noticingStrength: 0.5,
				contradictionStrength: 0.5,
				convergenceStrength: 0.5,
				contradictionTarget: sampleContradictionTarget,
				convergenceTarget: sampleConvergenceTarget,
				noticingDomain: "work" as LifeDomain,
			}),
		);
		expect(result.focus.type).toBe("contradiction");
	});

	it("close mode does not use sharedFireCount", () => {
		const result = evaluateObservationGating(
			closeInput({
				sharedFireCount: 10, // high fire count doesn't matter
				relateStrength: 0.2,
				noticingStrength: 0.6,
				convergenceStrength: 0.1,
				contradictionStrength: 0.1,
				noticingDomain: "work" as LifeDomain,
			}),
		);

		expect(result.focus.type).toBe("noticing");
	});
});

// ─── Debug Output ───────────────────────────────────────────────────

describe("evaluateObservationGating — debug output", () => {
	it("includes all four candidates with raw and effective strengths", () => {
		const result = evaluateObservationGating(
			exploreInput({
				phase: 0.6,
				noticingStrength: 0.4,
				contradictionStrength: 0.3,
				convergenceStrength: 0.2,
				relateStrength: 0.35,
			}),
		);

		expect(result.debug.candidates).toHaveLength(4);
		const types = result.debug.candidates.map((c) => c.focus.type);
		expect(types).toContain("relate");
		expect(types).toContain("noticing");
		expect(types).toContain("contradiction");
		expect(types).toContain("convergence");
	});

	it("candidates in explore mode have effectiveStrength = rawStrength * phase for non-Relate", () => {
		const result = evaluateObservationGating(
			exploreInput({
				phase: 0.6,
				noticingStrength: 0.4,
			}),
		);

		const noticing = result.debug.candidates.find((c) => c.focus.type === "noticing");
		expect(noticing).toBeDefined();
		expect(noticing!.strength).toBeCloseTo(0.4 * 0.6, 10);
	});

	it("debug includes mode, phase, threshold, sharedFireCount, winner, mutualExclusionApplied", () => {
		const result = evaluateObservationGating(
			exploreInput({
				phase: 0.5,
				sharedFireCount: 2,
			}),
		);

		expect(result.debug.mode).toBe("explore");
		expect(result.debug.phase).toBeCloseTo(0.5);
		expect(result.debug.threshold).toBeCloseTo(0.2); // 0.12 + 0.04 * 2
		expect(result.debug.sharedFireCount).toBe(2);
		expect(result.debug.winner).not.toBeNull();
		expect(typeof result.debug.mutualExclusionApplied).toBe("boolean");
	});
});
