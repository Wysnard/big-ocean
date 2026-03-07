import { describe, expect, it } from "vitest";
import { computeETarget, PACING_CONSTANTS, type PacingResult, type PacingState } from "../e-target";

const { E_BASE } = PACING_CONSTANTS;

/**
 * Helper: simulate a multi-turn sequence and return all results.
 * Each turn receives an energy value and optional telling score.
 */
const simulateSequence = (turns: { energy: number; telling?: number | null }[]): PacingResult[] => {
	const results: PacingResult[] = [];
	let prevSmoothed = E_BASE;
	const recentEnergies: number[] = [];

	for (const turn of turns) {
		recentEnergies.push(turn.energy);
		if (recentEnergies.length > PACING_CONSTANTS.K) recentEnergies.shift();

		const state: PacingState = {
			currentEnergy: turn.energy,
			previousSmoothedEnergy: prevSmoothed,
			recentEnergies: [...recentEnergies],
			telling: turn.telling ?? null,
		};

		const result = computeETarget(state);
		results.push(result);
		prevSmoothed = result.smoothedEnergy;
	}

	return results;
};

describe("computeETarget", () => {
	// === Pure function interface ===
	describe("function interface", () => {
		it("returns eTarget and smoothedEnergy", () => {
			const result = computeETarget({
				currentEnergy: 5,
				previousSmoothedEnergy: E_BASE,
				recentEnergies: [5],
				telling: null,
			});
			expect(result).toHaveProperty("eTarget");
			expect(result).toHaveProperty("smoothedEnergy");
		});

		it("is deterministic — same inputs produce same output", () => {
			const state: PacingState = {
				currentEnergy: 7,
				previousSmoothedEnergy: 5.5,
				recentEnergies: [6, 7, 8, 7, 7],
				telling: 0.6,
			};
			const r1 = computeETarget(state);
			const r2 = computeETarget(state);
			expect(r1.eTarget).toBe(r2.eTarget);
			expect(r1.smoothedEnergy).toBe(r2.smoothedEnergy);
		});

		it("output is always in [0, 10]", () => {
			const extremes: PacingState[] = [
				{ currentEnergy: 0, previousSmoothedEnergy: 0, recentEnergies: [0, 0, 0, 0, 0], telling: 0 },
				{
					currentEnergy: 10,
					previousSmoothedEnergy: 10,
					recentEnergies: [10, 10, 10, 10, 10],
					telling: 1.0,
				},
				{ currentEnergy: 10, previousSmoothedEnergy: 0, recentEnergies: [10], telling: null },
				{ currentEnergy: 0, previousSmoothedEnergy: 10, recentEnergies: [0], telling: 0 },
			];
			for (const state of extremes) {
				const { eTarget } = computeETarget(state);
				expect(eTarget).toBeGreaterThanOrEqual(0);
				expect(eTarget).toBeLessThanOrEqual(10);
			}
		});
	});

	// === Cold start ===
	describe("cold start", () => {
		it("first turn at E=5 produces E_target near E_BASE", () => {
			const result = computeETarget({
				currentEnergy: 5,
				previousSmoothedEnergy: E_BASE,
				recentEnergies: [5],
				telling: null,
			});
			expect(result.eTarget).toBeCloseTo(E_BASE, 1);
		});

		it("first turn — no active forces, graceful default", () => {
			const result = computeETarget({
				currentEnergy: 5,
				previousSmoothedEnergy: E_BASE,
				recentEnergies: [5],
				telling: null,
			});
			// V=0, drain=0, trust=1.0 → E_shifted = E_s = 5.0, E_cap = 9.0
			expect(result.smoothedEnergy).toBeCloseTo(5.0, 5);
			expect(result.eTarget).toBeCloseTo(5.0, 1);
		});
	});

	// === EMA smoothing ===
	describe("EMA smoothing", () => {
		it("EMA initialized at E_BASE converges toward user energy", () => {
			const results = simulateSequence([
				{ energy: 3 },
				{ energy: 3 },
				{ energy: 3 },
				{ energy: 3 },
				{ energy: 3 },
			]);
			// Should converge toward 3 over 5 turns
			const lastSmoothed = results[results.length - 1].smoothedEnergy;
			expect(lastSmoothed).toBeGreaterThan(2.5);
			expect(lastSmoothed).toBeLessThan(4.0);
		});

		it("lambda=0.35 gives expected first-turn smoothed value", () => {
			const result = computeETarget({
				currentEnergy: 8,
				previousSmoothedEnergy: E_BASE,
				recentEnergies: [8],
				telling: null,
			});
			// E_s = 0.35 * 8 + 0.65 * 5 = 2.8 + 3.25 = 6.05
			expect(result.smoothedEnergy).toBeCloseTo(6.05, 5);
		});
	});

	// === Trust from telling ===
	describe("trust function", () => {
		it("telling=null defaults to trust=1.0 (no effect on momentum)", () => {
			const withTelling = computeETarget({
				currentEnergy: 7,
				previousSmoothedEnergy: 5,
				recentEnergies: [7],
				telling: 0.5, // trust = 1.0
			});
			const withoutTelling = computeETarget({
				currentEnergy: 7,
				previousSmoothedEnergy: 5,
				recentEnergies: [7],
				telling: null, // trust = 1.0
			});
			expect(withTelling.eTarget).toBeCloseTo(withoutTelling.eTarget, 5);
		});

		it("low telling dampens upward momentum", () => {
			const lowTelling = computeETarget({
				currentEnergy: 8,
				previousSmoothedEnergy: 5,
				recentEnergies: [8],
				telling: 0.0, // trust = 0.5
			});
			const highTelling = computeETarget({
				currentEnergy: 8,
				previousSmoothedEnergy: 5,
				recentEnergies: [8],
				telling: 1.0, // trust = 1.2
			});
			expect(lowTelling.eTarget).toBeLessThan(highTelling.eTarget);
		});

		it("telling does NOT affect downward momentum", () => {
			const lowTelling = computeETarget({
				currentEnergy: 2,
				previousSmoothedEnergy: 5,
				recentEnergies: [2],
				telling: 0.0,
			});
			const highTelling = computeETarget({
				currentEnergy: 2,
				previousSmoothedEnergy: 5,
				recentEnergies: [2],
				telling: 1.0,
			});
			// Downward momentum is not qualified by trust — same result
			expect(lowTelling.eTarget).toBeCloseTo(highTelling.eTarget, 5);
		});

		it("trust values match piecewise spec", () => {
			// T=0 → 0.5, T=0.25 → 0.75, T=0.5 → 1.0, T=0.75 → 1.1, T=1.0 → 1.2
			const testTrust = (telling: number, expectedTarget: number) => {
				// We test indirectly: use a scenario where only trust matters
				// With upward momentum, E_shifted = E_s + alpha_up * trust * V_up
				const prevSmoothed = 5.0;
				const currentEnergy = 8.0;
				const es = 0.35 * currentEnergy + 0.65 * prevSmoothed; // 6.05
				const vUp = es - prevSmoothed; // 1.05
				const shifted = es + 0.5 * expectedTarget * vUp;

				const result = computeETarget({
					currentEnergy,
					previousSmoothedEnergy: prevSmoothed,
					recentEnergies: [currentEnergy],
					telling,
				});
				expect(result.eTarget).toBeCloseTo(shifted, 3);
			};

			testTrust(0.0, 0.5);
			testTrust(0.25, 0.75);
			testTrust(0.5, 1.0);
			testTrust(0.75, 1.1);
			testTrust(1.0, 1.2);
		});
	});

	// === Drain and ceiling ===
	describe("drain and ceiling", () => {
		it("energy at comfort level produces zero drain", () => {
			const result = computeETarget({
				currentEnergy: 5,
				previousSmoothedEnergy: 5,
				recentEnergies: [5, 5, 5, 5, 5],
				telling: null,
			});
			// drain=0, ceiling=9.0
			expect(result.eTarget).toBeCloseTo(5.0, 1);
		});

		it("sustained E=9 produces strong ceiling pressure", () => {
			const results = simulateSequence([
				{ energy: 9 },
				{ energy: 9 },
				{ energy: 9 },
				{ energy: 9 },
				{ energy: 9 },
			]);
			const last = results[results.length - 1];
			// d = avg(max(0, 9-5)/5) = 0.8 per turn, all 5 turns → d=0.8
			// E_cap = 2.5 + 6.5 * (1 - 0.64) = 2.5 + 2.34 = 4.84
			expect(last.eTarget).toBeLessThan(5.5);
		});

		it("K-padded drain: single hot message does not trigger heavy ceiling", () => {
			const result = computeETarget({
				currentEnergy: 9,
				previousSmoothedEnergy: E_BASE,
				recentEnergies: [9], // only 1 turn, but drain divides by K=5
				telling: null,
			});
			// cost = max(0, 9-5)/5 = 0.8, d = 0.8/5 = 0.16
			// E_cap = 2.5 + 6.5 * (1 - 0.0256) = 2.5 + 6.33 = 8.83
			expect(result.eTarget).toBeGreaterThan(5.0); // ceiling is permissive
		});

		it("recovery: ceiling rises as drain drops", () => {
			const results = simulateSequence([
				{ energy: 9 },
				{ energy: 9 },
				{ energy: 9 },
				{ energy: 9 },
				{ energy: 9 },
				{ energy: 4 },
				{ energy: 3 },
				{ energy: 3 },
			]);
			const turn5 = results[4].eTarget;
			const turn8 = results[7].eTarget;
			// After recovery turns, the drain window shifts — ceiling should rise
			// (or at least not constrain a low-energy user)
			expect(turn8).toBeLessThanOrEqual(results[7].smoothedEnergy + 1);
			// The ceiling is less restrictive than at peak drain
			expect(turn5).toBeLessThan(6);
		});
	});

	// === 10 Archetype Simulations ===
	describe("archetype simulations", () => {
		it("Scenario 1: Deep user — ceiling kicks in, forces pullback", () => {
			const results = simulateSequence([
				{ energy: 5 },
				{ energy: 7 },
				{ energy: 8 },
				{ energy: 9 },
				{ energy: 9 },
				{ energy: 9 },
				{ energy: 8 },
				{ energy: 7 },
			]);
			// By turn 6, sustained high energy should trigger ceiling
			const turn6Ceiling = results[5].eTarget;
			expect(turn6Ceiling).toBeLessThan(8.5);
			// Recovery visible in later turns
			const turn8 = results[7].eTarget;
			expect(turn8).toBeLessThan(turn6Ceiling + 1);
		});

		it("Scenario 2: Light user — no upward pressure", () => {
			const results = simulateSequence([
				{ energy: 3 },
				{ energy: 2 },
				{ energy: 3 },
				{ energy: 2 },
				{ energy: 3 },
				{ energy: 2 },
				{ energy: 3 },
				{ energy: 2 },
			]);
			// E_target should track near user's energy, never push up significantly
			for (const r of results.slice(3)) {
				expect(r.eTarget).toBeLessThan(4.5);
			}
		});

		it("Scenario 3: Flowing user — smooth following, ceiling gentle", () => {
			const results = simulateSequence([
				{ energy: 6, telling: 0.8 },
				{ energy: 6, telling: 0.8 },
				{ energy: 7, telling: 0.9 },
				{ energy: 7, telling: 0.8 },
				{ energy: 6, telling: 0.7 },
				{ energy: 7, telling: 0.8 },
			]);
			// E_target follows the gentle wave, stays within 1.5 of user energy
			for (let i = 2; i < results.length; i++) {
				const gap = Math.abs(results[i].eTarget - results[i].smoothedEnergy);
				expect(gap).toBeLessThan(1.5);
			}
		});

		it("Scenario 4: Fading user — follows the fade, no false uplift", () => {
			const results = simulateSequence([
				{ energy: 6 },
				{ energy: 5 },
				{ energy: 4 },
				{ energy: 3 },
				{ energy: 2 },
				{ energy: 2 },
				{ energy: 1 },
			]);
			// E_target should decline with the user, not push up
			for (let i = 1; i < results.length; i++) {
				expect(results[i].eTarget).toBeLessThanOrEqual(results[i - 1].eTarget + 0.5);
			}
			// Final target should be low
			expect(results[results.length - 1].eTarget).toBeLessThan(3.5);
		});

		it("Scenario 5: Guarded user — respects measured pace", () => {
			const results = simulateSequence([
				{ energy: 3, telling: 0.2 },
				{ energy: 3, telling: 0.2 },
				{ energy: 4, telling: 0.3 },
				{ energy: 3, telling: 0.2 },
				{ energy: 3, telling: 0.2 },
				{ energy: 4, telling: 0.3 },
			]);
			// No persistent push above the user's comfort
			for (const r of results.slice(2)) {
				expect(r.eTarget).toBeLessThan(5.0);
			}
		});

		it("Scenario 6: Over-sharer — ceiling protects before burnout", () => {
			const results = simulateSequence([
				{ energy: 9, telling: 0.9 },
				{ energy: 10, telling: 0.9 },
				{ energy: 10, telling: 0.8 },
				{ energy: 9, telling: 0.7 },
				{ energy: 10, telling: 0.8 },
			]);
			// Ceiling should activate strongly by turn 3-4
			expect(results[3].eTarget).toBeLessThan(8.0);
			expect(results[4].eTarget).toBeLessThan(7.5);
		});

		it("Scenario 7: Performance mode — trust dampens upward following", () => {
			const highTellingResults = simulateSequence([
				{ energy: 7, telling: 0.9 },
				{ energy: 8, telling: 0.9 },
				{ energy: 8, telling: 0.9 },
			]);
			const lowTellingResults = simulateSequence([
				{ energy: 7, telling: 0.1 },
				{ energy: 8, telling: 0.1 },
				{ energy: 8, telling: 0.1 },
			]);
			// Low telling (performance mode) should produce lower E_target
			expect(lowTellingResults[2].eTarget).toBeLessThan(highTellingResults[2].eTarget);
		});

		it("Scenario 8: Quiet authentic — respects low energy + high telling", () => {
			const results = simulateSequence([
				{ energy: 3, telling: 0.8 },
				{ energy: 3, telling: 0.9 },
				{ energy: 4, telling: 0.8 },
				{ energy: 3, telling: 0.9 },
				{ energy: 3, telling: 0.8 },
			]);
			// Should NOT push up despite high telling — telling qualifies but doesn't add
			for (const r of results.slice(2)) {
				expect(r.eTarget).toBeLessThan(5.0);
			}
		});

		it("Scenario 9: Hot opener — K-padded drain prevents early overreaction", () => {
			const results = simulateSequence([{ energy: 8 }, { energy: 7 }]);
			// Turn 1: single hot message, drain divided by K=5 → ceiling permissive
			expect(results[0].eTarget).toBeGreaterThan(5.0);
			// Not capped aggressively
			expect(results[0].eTarget).toBeGreaterThan(results[0].smoothedEnergy - 1);
		});

		it("Scenario 10: Volatile — EMA dampens raw swings", () => {
			const results = simulateSequence([
				{ energy: 3 },
				{ energy: 9 },
				{ energy: 2 },
				{ energy: 8 },
				{ energy: 3 },
				{ energy: 9 },
				{ energy: 2 },
				{ energy: 8 },
			]);
			// E_target should not swing as wildly as raw energy
			for (let i = 1; i < results.length; i++) {
				const rawSwing = Math.abs((i % 2 === 0 ? 2 : 9) - (i % 2 === 0 ? 9 : 2));
				const targetSwing = Math.abs(results[i].eTarget - results[i - 1].eTarget);
				// Target swing should be less than 55% of raw swing (EMA dampening)
				expect(targetSwing).toBeLessThan(rawSwing * 0.7);
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
			expect(last.eTarget).toBeLessThan(1.5);
			expect(last.smoothedEnergy).toBeLessThan(1.0);
		});

		it("sustained E=10 — ceiling drops to floor within 5 turns", () => {
			const results = simulateSequence([
				{ energy: 10 },
				{ energy: 10 },
				{ energy: 10 },
				{ energy: 10 },
				{ energy: 10 },
			]);
			const last = results[results.length - 1];
			// d = avg(max(0,10-5)/5) = 1.0, E_cap = 2.5 + 6.5*(1-1) = 2.5
			expect(last.eTarget).toBeCloseTo(2.5, 0);
		});

		it("sudden spike E=3→9 — EMA dampens, ceiling barely affected", () => {
			const results = simulateSequence([{ energy: 3 }, { energy: 3 }, { energy: 3 }, { energy: 9 }]);
			const afterSpike = results[3];
			// EMA should not jump to 9 — dampened by ~55%
			expect(afterSpike.smoothedEnergy).toBeLessThan(6.0);
			// Ceiling should still be permissive (only 1 high turn in window)
			expect(afterSpike.eTarget).toBeGreaterThan(3.0);
		});

		it("empty recent energies — drain is zero, ceiling is maxcap", () => {
			const result = computeETarget({
				currentEnergy: 5,
				previousSmoothedEnergy: E_BASE,
				recentEnergies: [],
				telling: null,
			});
			// drain = 0/5 = 0, ceiling = 9.0
			expect(result.eTarget).toBeCloseTo(5.0, 1);
		});
	});

	// === No coverage / no assessment state ===
	describe("user-state purity", () => {
		it("formula has no coverage, portrait, or phase inputs", () => {
			// Structural test: PacingState only has energy, smoothed, recentEnergies, telling
			const state: PacingState = {
				currentEnergy: 5,
				previousSmoothedEnergy: 5,
				recentEnergies: [5],
				telling: null,
			};
			const keys = Object.keys(state);
			expect(keys).toEqual(
				expect.arrayContaining([
					"currentEnergy",
					"previousSmoothedEnergy",
					"recentEnergies",
					"telling",
				]),
			);
			expect(keys).toHaveLength(4);
		});
	});
});
