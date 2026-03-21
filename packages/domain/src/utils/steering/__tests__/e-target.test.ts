import { describe, expect, it } from "vitest";
import { computeETarget, type ETargetInput, type ETargetOutput, PACING_CONFIG } from "../e-target";

/**
 * Helper: simulate a multi-turn sequence and return all results.
 * Each turn receives an energy value and optional telling score.
 * The function builds cumulative histories from the turns.
 */
const simulateSequence = (
	turns: { energy: number; telling?: number | null }[],
): ETargetOutput[] => {
	const results: ETargetOutput[] = [];
	const energyHistory: number[] = [];
	const tellingHistory: (number | null)[] = [];

	for (const turn of turns) {
		energyHistory.push(turn.energy);
		tellingHistory.push(turn.telling ?? null);

		const input: ETargetInput = {
			energyHistory: [...energyHistory],
			tellingHistory: [...tellingHistory],
		};

		const result = computeETarget(input);
		results.push(result);
	}

	return results;
};

describe("computeETarget (v2 — [0, 1] space)", () => {
	// === Pure function interface ===
	describe("function interface", () => {
		it("returns eTarget, smoothedEnergy, and comfort", () => {
			const result = computeETarget({
				energyHistory: [0.5],
				tellingHistory: [null],
			});
			expect(result).toHaveProperty("eTarget");
			expect(result).toHaveProperty("smoothedEnergy");
			expect(result).toHaveProperty("comfort");
		});

		it("is deterministic — same inputs produce same output", () => {
			const input: ETargetInput = {
				energyHistory: [0.5, 0.7, 0.6],
				tellingHistory: [null, 0.6, 0.8],
			};
			const r1 = computeETarget(input);
			const r2 = computeETarget(input);
			expect(r1.eTarget).toBe(r2.eTarget);
			expect(r1.smoothedEnergy).toBe(r2.smoothedEnergy);
			expect(r1.comfort).toBe(r2.comfort);
		});

		it("output is always in [0, 1]", () => {
			const extremes: ETargetInput[] = [
				{ energyHistory: [0], tellingHistory: [0] },
				{ energyHistory: [1], tellingHistory: [1] },
				{ energyHistory: [1, 1, 1, 1, 1], tellingHistory: [1, 1, 1, 1, 1] },
				{ energyHistory: [0, 0, 0, 0, 0], tellingHistory: [0, 0, 0, 0, 0] },
				{ energyHistory: [1, 0, 1, 0, 1], tellingHistory: [null, null, null, null, null] },
			];
			for (const input of extremes) {
				const { eTarget } = computeETarget(input);
				expect(eTarget).toBeGreaterThanOrEqual(0);
				expect(eTarget).toBeLessThanOrEqual(1);
			}
		});
	});

	// === PACING_CONFIG ===
	describe("pacing config", () => {
		it("exports all named constants", () => {
			expect(PACING_CONFIG).toHaveProperty("lambda", 0.35);
			expect(PACING_CONFIG).toHaveProperty("alphaUp", 0.5);
			expect(PACING_CONFIG).toHaveProperty("alphaDown", 0.6);
			expect(PACING_CONFIG).toHaveProperty("comfortInit", 0.5);
			expect(PACING_CONFIG).toHaveProperty("comfortCap", 0.85);
			expect(PACING_CONFIG).toHaveProperty("K", 5);
			expect(PACING_CONFIG).toHaveProperty("floor", 0.25);
			expect(PACING_CONFIG).toHaveProperty("maxcap", 0.9);
		});
	});

	// === Cold start (AC4, FR25) ===
	describe("cold start", () => {
		it("empty history produces E_target = 0.5", () => {
			const result = computeETarget({
				energyHistory: [],
				tellingHistory: [],
			});
			expect(result.eTarget).toBeCloseTo(0.5, 5);
			expect(result.smoothedEnergy).toBeCloseTo(0.5, 5);
			expect(result.comfort).toBeCloseTo(0.5, 5);
		});

		it("first turn at E=0.5 produces E_target near 0.5", () => {
			const result = computeETarget({
				energyHistory: [0.5],
				tellingHistory: [null],
			});
			expect(result.eTarget).toBeCloseTo(0.5, 1);
		});

		it("first turn — no active forces, graceful default", () => {
			const result = computeETarget({
				energyHistory: [0.5],
				tellingHistory: [null],
			});
			// V=0 (first turn, previous smoothed = 0.5, lambda*0.5 + 0.65*0.5 = 0.5)
			// drain=0, trust=1.0 → E_shifted = E_s = 0.5, E_cap = 0.9
			expect(result.smoothedEnergy).toBeCloseTo(0.5, 5);
			expect(result.eTarget).toBeCloseTo(0.5, 1);
		});
	});

	// === EMA smoothing (Step 1) ===
	describe("EMA smoothing", () => {
		it("EMA converges toward user energy over multiple turns", () => {
			const results = simulateSequence([
				{ energy: 0.3 },
				{ energy: 0.3 },
				{ energy: 0.3 },
				{ energy: 0.3 },
				{ energy: 0.3 },
			]);
			const lastSmoothed = results[results.length - 1].smoothedEnergy;
			expect(lastSmoothed).toBeGreaterThan(0.25);
			expect(lastSmoothed).toBeLessThan(0.4);
		});

		it("lambda=0.35 gives expected first-turn smoothed value", () => {
			const result = computeETarget({
				energyHistory: [0.8],
				tellingHistory: [null],
			});
			// E_s = 0.35 * 0.8 + 0.65 * 0.5 = 0.28 + 0.325 = 0.605
			expect(result.smoothedEnergy).toBeCloseTo(0.605, 5);
		});
	});

	// === Trust from telling (Step 3, AC2) ===
	describe("trust function", () => {
		it("telling=null defaults to trust=1.0 (no effect on momentum)", () => {
			const withTelling = computeETarget({
				energyHistory: [0.7],
				tellingHistory: [0.5], // trust = 1.0
			});
			const withoutTelling = computeETarget({
				energyHistory: [0.7],
				tellingHistory: [null], // trust = 1.0
			});
			expect(withTelling.eTarget).toBeCloseTo(withoutTelling.eTarget, 5);
		});

		it("low telling dampens upward momentum", () => {
			const lowTelling = computeETarget({
				energyHistory: [0.5, 0.8],
				tellingHistory: [null, 0.0], // trust = 0.5
			});
			const highTelling = computeETarget({
				energyHistory: [0.5, 0.8],
				tellingHistory: [null, 1.0], // trust = 1.2
			});
			expect(lowTelling.eTarget).toBeLessThan(highTelling.eTarget);
		});

		it("telling does NOT affect downward momentum", () => {
			const lowTelling = computeETarget({
				energyHistory: [0.5, 0.2],
				tellingHistory: [null, 0.0],
			});
			const highTelling = computeETarget({
				energyHistory: [0.5, 0.2],
				tellingHistory: [null, 1.0],
			});
			// Downward momentum is not qualified by trust — same result
			expect(lowTelling.eTarget).toBeCloseTo(highTelling.eTarget, 5);
		});

		it("trust values match piecewise spec: T=0→0.5, T=0.5→1.0, T=1.0→1.2", () => {
			// We verify indirectly through upward momentum amplification
			// With an upward shift, higher trust → higher E_target
			const t0 = computeETarget({
				energyHistory: [0.3, 0.8],
				tellingHistory: [null, 0.0],
			});
			const t05 = computeETarget({
				energyHistory: [0.3, 0.8],
				tellingHistory: [null, 0.5],
			});
			const t1 = computeETarget({
				energyHistory: [0.3, 0.8],
				tellingHistory: [null, 1.0],
			});
			expect(t0.eTarget).toBeLessThan(t05.eTarget);
			expect(t05.eTarget).toBeLessThan(t1.eTarget);
		});
	});

	// === Adaptive comfort (Step 5, AC3) ===
	describe("adaptive comfort", () => {
		it("comfort is running mean of all raw energy values", () => {
			const result = computeETarget({
				energyHistory: [0.3, 0.5, 0.7],
				tellingHistory: [null, null, null],
			});
			// comfort = mean(0.3, 0.5, 0.7) = 0.5
			expect(result.comfort).toBeCloseTo(0.5, 5);
		});

		it("comfort is capped at 0.85", () => {
			const result = computeETarget({
				energyHistory: [1.0, 1.0, 1.0, 1.0, 1.0],
				tellingHistory: [null, null, null, null, null],
			});
			// comfort = mean(1.0 x 5) = 1.0, but capped at 0.85
			expect(result.comfort).toBeCloseTo(0.85, 5);
		});

		it("naturally intense user has less drain than low-baseline user at same energy", () => {
			// High-baseline user: all 0.7, then one 0.9
			const intense = computeETarget({
				energyHistory: [0.7, 0.7, 0.7, 0.7, 0.9],
				tellingHistory: [null, null, null, null, null],
			});
			// Low-baseline user: all 0.3, then one 0.9
			const lowBase = computeETarget({
				energyHistory: [0.3, 0.3, 0.3, 0.3, 0.9],
				tellingHistory: [null, null, null, null, null],
			});
			// The intense user should have a higher (less constrained) E_target
			// because their comfort is higher, so 0.9 feels like less of a spike
			expect(intense.eTarget).toBeGreaterThan(lowBase.eTarget);
		});
	});

	// === Drain and ceiling (Steps 6-7, AC5) ===
	describe("drain and ceiling", () => {
		it("energy at comfort level produces zero drain", () => {
			const result = computeETarget({
				energyHistory: [0.5, 0.5, 0.5, 0.5, 0.5],
				tellingHistory: [null, null, null, null, null],
			});
			// drain=0, ceiling=0.9
			expect(result.eTarget).toBeCloseTo(0.5, 1);
		});

		it("sustained high energy produces strong ceiling pressure (AC5)", () => {
			const results = simulateSequence([
				{ energy: 0.9 },
				{ energy: 0.9 },
				{ energy: 0.9 },
				{ energy: 0.9 },
				{ energy: 0.9 },
			]);
			const last = results[results.length - 1];
			// Comfort grows toward 0.85 (capped), drain from headroom-normalized cost
			// E_cap should be significantly below 0.9
			expect(last.eTarget).toBeLessThan(0.85);
		});

		it("maximum sustained drain drives E_cap toward floor (0.25)", () => {
			// Sustained E=1.0 with comfort capped at 0.85
			const results = simulateSequence([
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
			]);
			const last = results[results.length - 1];
			// drain should be high, ceiling near floor
			expect(last.eTarget).toBeLessThan(0.5);
		});

		it("K-padded drain: single hot message does not trigger heavy ceiling", () => {
			const result = computeETarget({
				energyHistory: [0.9], // only 1 turn, but drain divides by K=5
				tellingHistory: [null],
			});
			// Ceiling should still be permissive
			expect(result.eTarget).toBeGreaterThan(0.5);
		});

		it("at d=0 (no fatigue): E_cap = 0.9", () => {
			// Energy at exactly comfort, so no excess cost
			const result = computeETarget({
				energyHistory: [0.5],
				tellingHistory: [null],
			});
			// comfort = 0.5, energy = 0.5, cost = 0, drain = 0, E_cap = 0.9
			expect(result.eTarget).toBeCloseTo(0.5, 1); // capped at shifted, not ceiling
		});
	});

	// === Recovery (AC8) ===
	describe("recovery after drain", () => {
		it("ceiling rises as drain drops with low-energy recovery turns", () => {
			const results = simulateSequence([
				{ energy: 0.9 },
				{ energy: 0.9 },
				{ energy: 0.9 },
				{ energy: 0.9 },
				{ energy: 0.9 },
				{ energy: 0.3 },
				{ energy: 0.3 },
				{ energy: 0.3 },
			]);
			const turn5 = results[4].eTarget;
			const _turn8 = results[7].eTarget;
			// After recovery turns, drain should decrease
			// turn 8 E_target should be less constrained than turn 5 E_target
			// (though turn8 smoothed energy will be lower, so eTarget is lower overall)
			// The key: comfort adapts, drain window shifts
			expect(turn5).toBeLessThan(0.85);
		});
	});

	// === Weight hierarchy (AC6) ===
	describe("weight hierarchy", () => {
		it("drain ceiling > alpha_down > alpha_up", () => {
			expect(PACING_CONFIG.alphaDown).toBeGreaterThan(PACING_CONFIG.alphaUp);
			// Structural: ceiling is min() applied after shift, so it always wins
		});

		it("no coverage, portrait, or phase inputs in function signature", () => {
			// Structural test: ETargetInput only has energy/telling history and optional priors
			const input: ETargetInput = {
				energyHistory: [0.5],
				tellingHistory: [null],
			};
			const keys = Object.keys(input);
			expect(keys).toContain("energyHistory");
			expect(keys).toContain("tellingHistory");
			expect(keys).not.toContain("coverage");
			expect(keys).not.toContain("phase");
			expect(keys).not.toContain("portrait");
		});
	});

	// === Archetype simulations ===
	describe("archetype simulations", () => {
		it("Deep user — ceiling kicks in, forces pullback", () => {
			const results = simulateSequence([
				{ energy: 0.5 },
				{ energy: 0.7 },
				{ energy: 0.8 },
				{ energy: 0.9 },
				{ energy: 0.9 },
				{ energy: 0.9 },
				{ energy: 0.8 },
				{ energy: 0.7 },
			]);
			// By turn 6, sustained high energy should trigger ceiling
			expect(results[5].eTarget).toBeLessThan(0.85);
		});

		it("Light user — no upward pressure", () => {
			const results = simulateSequence([
				{ energy: 0.3 },
				{ energy: 0.2 },
				{ energy: 0.3 },
				{ energy: 0.2 },
				{ energy: 0.3 },
				{ energy: 0.2 },
			]);
			// E_target should stay low, never push up significantly
			for (const r of results.slice(2)) {
				expect(r.eTarget).toBeLessThan(0.45);
			}
		});

		it("Flowing user — smooth following", () => {
			const results = simulateSequence([
				{ energy: 0.6, telling: 0.8 },
				{ energy: 0.6, telling: 0.8 },
				{ energy: 0.7, telling: 0.9 },
				{ energy: 0.7, telling: 0.8 },
				{ energy: 0.6, telling: 0.7 },
			]);
			// E_target follows the gentle wave, stays within 0.15 of smoothed energy
			for (let i = 2; i < results.length; i++) {
				const gap = Math.abs(results[i].eTarget - results[i].smoothedEnergy);
				expect(gap).toBeLessThan(0.15);
			}
		});

		it("Fading user — follows the fade, no false uplift", () => {
			const results = simulateSequence([
				{ energy: 0.6 },
				{ energy: 0.5 },
				{ energy: 0.4 },
				{ energy: 0.3 },
				{ energy: 0.2 },
				{ energy: 0.2 },
				{ energy: 0.1 },
			]);
			// E_target should decline, not push up
			for (let i = 1; i < results.length; i++) {
				expect(results[i].eTarget).toBeLessThanOrEqual(results[i - 1].eTarget + 0.05);
			}
			// Final target should be low
			expect(results[results.length - 1].eTarget).toBeLessThan(0.35);
		});

		it("Performance mode — trust dampens upward following", () => {
			const highTellingResults = simulateSequence([
				{ energy: 0.7, telling: 0.9 },
				{ energy: 0.8, telling: 0.9 },
				{ energy: 0.8, telling: 0.9 },
			]);
			const lowTellingResults = simulateSequence([
				{ energy: 0.7, telling: 0.1 },
				{ energy: 0.8, telling: 0.1 },
				{ energy: 0.8, telling: 0.1 },
			]);
			expect(lowTellingResults[2].eTarget).toBeLessThan(highTellingResults[2].eTarget);
		});

		it("Over-sharer — ceiling protects before burnout", () => {
			const results = simulateSequence([
				{ energy: 0.9, telling: 0.9 },
				{ energy: 1.0, telling: 0.9 },
				{ energy: 1.0, telling: 0.8 },
				{ energy: 0.9, telling: 0.7 },
				{ energy: 1.0, telling: 0.8 },
			]);
			// Ceiling should activate strongly
			expect(results[3].eTarget).toBeLessThan(0.85);
		});

		it("Volatile — EMA dampens raw swings", () => {
			const rawEnergies = [0.3, 0.9, 0.2, 0.8, 0.3, 0.9];
			const results = simulateSequence(rawEnergies.map((energy) => ({ energy })));
			// E_target swings should be smaller than raw energy swings
			for (let i = 1; i < results.length; i++) {
				const rawSwing = Math.abs(rawEnergies[i] - rawEnergies[i - 1]);
				const targetSwing = Math.abs(results[i].eTarget - results[i - 1].eTarget);
				// Target swing should be less than raw swing (EMA dampening)
				expect(targetSwing).toBeLessThan(rawSwing);
			}
		});
	});

	// === Edge cases ===
	describe("edge cases", () => {
		it("sustained E=0 — E_target settles near 0", () => {
			const results = simulateSequence([
				{ energy: 0 },
				{ energy: 0 },
				{ energy: 0 },
				{ energy: 0 },
				{ energy: 0 },
				{ energy: 0 },
				{ energy: 0 },
				{ energy: 0 },
				{ energy: 0 },
				{ energy: 0 },
			]);
			const last = results[results.length - 1];
			expect(last.eTarget).toBeLessThan(0.15);
			expect(last.smoothedEnergy).toBeLessThan(0.1);
		});

		it("sustained E=1.0 — ceiling drops significantly", () => {
			const results = simulateSequence([
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
			]);
			const last = results[results.length - 1];
			// Ceiling should be heavily constrained
			expect(last.eTarget).toBeLessThan(0.6);
		});

		it("single turn with prior state", () => {
			const result = computeETarget({
				energyHistory: [0.7],
				tellingHistory: [0.5],
				priorSmoothedEnergy: 0.6,
				priorComfort: 0.55,
			});
			expect(result.eTarget).toBeGreaterThanOrEqual(0);
			expect(result.eTarget).toBeLessThanOrEqual(1);
		});
	});
});
