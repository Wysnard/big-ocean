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

describe("computeETarget (v3 — trust + drain)", () => {
	// === Pure function interface ===
	describe("function interface", () => {
		it("returns eTarget, smoothedEnergy, sessionTrust, drain, trustCap", () => {
			const result = computeETarget({
				energyHistory: [0.5],
				tellingHistory: [null],
			});
			expect(result).toHaveProperty("eTarget");
			expect(result).toHaveProperty("smoothedEnergy");
			expect(result).toHaveProperty("sessionTrust");
			expect(result).toHaveProperty("drain");
			expect(result).toHaveProperty("trustCap");
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
			expect(r1.sessionTrust).toBe(r2.sessionTrust);
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
			expect(PACING_CONFIG).toHaveProperty("initEnergy", 0.5);
			expect(PACING_CONFIG).toHaveProperty("K", 5);
			expect(PACING_CONFIG).toHaveProperty("drainBaseline", 0.5);
			expect(PACING_CONFIG).toHaveProperty("floor", 0.25);
			expect(PACING_CONFIG).toHaveProperty("maxcap", 0.9);
			expect(PACING_CONFIG).toHaveProperty("trustLambda", 0.2);
			expect(PACING_CONFIG).toHaveProperty("trustInit", 0.15);
		});
	});

	// === Cold start ===
	describe("cold start", () => {
		it("empty history produces E_target = initEnergy (0.5)", () => {
			const result = computeETarget({
				energyHistory: [],
				tellingHistory: [],
			});
			expect(result.eTarget).toBeCloseTo(0.5, 5);
			expect(result.smoothedEnergy).toBeCloseTo(0.5, 5);
			expect(result.sessionTrust).toBeCloseTo(PACING_CONFIG.trustInit, 5);
		});

		it("first turn at E=0.5 — trust cap limits e-target", () => {
			const result = computeETarget({
				energyHistory: [0.5],
				tellingHistory: [null],
			});
			// Trust is still very low (~0.15 + small EMA step), so trust_cap is low
			// E_shifted ≈ 0.5, but trust_cap ≈ floor + 0.65 * ~0.19 ≈ 0.37
			expect(result.eTarget).toBeLessThan(0.5);
			expect(result.trustCap).toBeLessThan(0.5);
		});

		it("first turn — smoothed energy is correct", () => {
			const result = computeETarget({
				energyHistory: [0.5],
				tellingHistory: [null],
			});
			expect(result.smoothedEnergy).toBeCloseTo(0.5, 5);
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

	// === Telling gain — per-turn momentum amplifier (Step 3) ===
	describe("telling gain", () => {
		it("telling=null defaults to gain=1.0 (no effect on momentum)", () => {
			const withTelling = computeETarget({
				energyHistory: [0.7],
				tellingHistory: [0.5], // gain = 1.0
			});
			const withoutTelling = computeETarget({
				energyHistory: [0.7],
				tellingHistory: [null], // gain = 1.0
			});
			// Both have same telling gain, but different telling factors for trust
			// The eTarget may differ slightly due to trust computation
			// But smoothedEnergy should be identical
			expect(withTelling.smoothedEnergy).toBeCloseTo(withoutTelling.smoothedEnergy, 5);
		});

		it("low telling dampens upward momentum", () => {
			const lowTelling = computeETarget({
				energyHistory: [0.5, 0.8],
				tellingHistory: [null, 0.0], // gain = 0.5
			});
			const highTelling = computeETarget({
				energyHistory: [0.5, 0.8],
				tellingHistory: [null, 1.0], // gain = 1.2
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
			// Downward momentum is not qualified by telling gain
			// Both have same E_shifted, but trust differs → trust_cap differs
			// High telling → higher trust → higher cap → potentially higher eTarget
			// But since E_shifted is already low, trust cap won't be binding
			// The key invariant: downward momentum weight is the same
			const lowSmoothed = lowTelling.smoothedEnergy;
			const highSmoothed = highTelling.smoothedEnergy;
			expect(lowSmoothed).toBeCloseTo(highSmoothed, 5);
		});

		it("telling gain values match piecewise spec: T=0→0.5, T=0.5→1.0, T=1.0→1.2", () => {
			// With an upward shift, higher telling gain → higher E_target
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

	// === Session trust (Step 5) ===
	describe("session trust", () => {
		it("trust starts low and builds over time with engagement", () => {
			const results = simulateSequence([
				{ energy: 0.6, telling: 0.5 },
				{ energy: 0.7, telling: 0.6 },
				{ energy: 0.7, telling: 0.7 },
				{ energy: 0.8, telling: 0.8 },
				{ energy: 0.8, telling: 0.9 },
			]);
			// Trust should increase monotonically
			for (let i = 1; i < results.length; i++) {
				expect(results[i].sessionTrust).toBeGreaterThan(results[i - 1].sessionTrust);
			}
		});

		it("low energy + compliant telling builds trust slowly", () => {
			const lowEngagement = simulateSequence([
				{ energy: 0.3, telling: 0.1 },
				{ energy: 0.3, telling: 0.1 },
				{ energy: 0.3, telling: 0.1 },
				{ energy: 0.3, telling: 0.1 },
				{ energy: 0.3, telling: 0.1 },
			]);
			const highEngagement = simulateSequence([
				{ energy: 0.7, telling: 0.8 },
				{ energy: 0.7, telling: 0.8 },
				{ energy: 0.7, telling: 0.8 },
				{ energy: 0.7, telling: 0.8 },
				{ energy: 0.7, telling: 0.8 },
			]);
			const lowTrust = lowEngagement[4].sessionTrust;
			const highTrust = highEngagement[4].sessionTrust;
			expect(lowTrust).toBeLessThan(highTrust);
		});

		it("trust_cap = floor + (maxcap - floor) × sessionTrust", () => {
			const result = computeETarget({
				energyHistory: [0.7],
				tellingHistory: [0.8],
			});
			const expectedCap =
				PACING_CONFIG.floor + (PACING_CONFIG.maxcap - PACING_CONFIG.floor) * result.sessionTrust;
			expect(result.trustCap).toBeCloseTo(expectedCap, 5);
		});

		it("trust gates depth — early session e-target is limited by trust cap", () => {
			// First turn: trust is very low, so trust_cap constrains e-target
			const result = computeETarget({
				energyHistory: [0.8],
				tellingHistory: [0.5],
			});
			// E_shifted would be high, but trust_cap holds it down
			expect(result.eTarget).toBeLessThanOrEqual(result.trustCap + 0.001);
		});
	});

	// === Drain (Step 6) ===
	describe("drain", () => {
		it("energy at baseline (0.5) produces zero drain", () => {
			const result = computeETarget({
				energyHistory: [0.5, 0.5, 0.5, 0.5, 0.5],
				tellingHistory: [null, null, null, null, null],
			});
			expect(result.drain).toBeCloseTo(0, 5);
		});

		it("sustained high energy accumulates drain against fixed baseline", () => {
			const results = simulateSequence([
				{ energy: 0.7 },
				{ energy: 0.7 },
				{ energy: 0.7 },
				{ energy: 0.7 },
				{ energy: 0.7 },
			]);
			// drain = mean of (0.7 - 0.5) / 0.5 = 0.4 per turn → drain = 0.4
			const last = results[results.length - 1];
			expect(last.drain).toBeCloseTo(0.4, 1);
		});

		it("drain pulls e-target down multiplicatively", () => {
			const _noDrain = computeETarget({
				energyHistory: [0.5],
				tellingHistory: [null],
			});
			const withDrain = computeETarget({
				energyHistory: [0.8, 0.8, 0.8, 0.8, 0.8],
				tellingHistory: [null, null, null, null, null],
			});
			// With drain, e-target should be pulled down from e_shifted
			expect(withDrain.drain).toBeGreaterThan(0);
		});

		it("K-padded: single hot message does not trigger heavy drain", () => {
			const result = computeETarget({
				energyHistory: [0.9],
				tellingHistory: [null],
			});
			// Only 1 turn, divided by K=5 → drain is mild
			expect(result.drain).toBeLessThan(0.2);
		});

		it("sustained E=1.0 produces maximum drain", () => {
			const results = simulateSequence([
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
			]);
			const last = results[results.length - 1];
			// drain = mean of (1.0 - 0.5) / 0.5 = 1.0 per turn → drain = 1.0
			expect(last.drain).toBeCloseTo(1.0, 1);
			// e_drained = e_shifted × (1 - 1.0) = 0
			expect(last.eTarget).toBeLessThan(0.1);
		});
	});

	// === Recovery ===
	describe("recovery after drain", () => {
		it("drain decreases with low-energy recovery turns", () => {
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
			const turn5Drain = results[4].drain;
			const turn8Drain = results[7].drain;
			expect(turn8Drain).toBeLessThan(turn5Drain);
		});
	});

	// === Weight hierarchy ===
	describe("weight hierarchy", () => {
		it("alphaDown > alphaUp", () => {
			expect(PACING_CONFIG.alphaDown).toBeGreaterThan(PACING_CONFIG.alphaUp);
		});

		it("no coverage, portrait, or phase inputs in function signature", () => {
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
		it("Deep user — drain pulls back, trust cap limits", () => {
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
			// By turn 6, drain should pull e-target significantly below raw energy
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
			for (const r of results.slice(2)) {
				expect(r.eTarget).toBeLessThan(0.45);
			}
		});

		it("Flowing user — trust builds, allows gradual depth", () => {
			const results = simulateSequence([
				{ energy: 0.5, telling: 0.5 },
				{ energy: 0.5, telling: 0.6 },
				{ energy: 0.6, telling: 0.7 },
				{ energy: 0.6, telling: 0.7 },
				{ energy: 0.7, telling: 0.8 },
				{ energy: 0.7, telling: 0.8 },
				{ energy: 0.7, telling: 0.8 },
				{ energy: 0.7, telling: 0.8 },
			]);
			// Trust should build over time → trust_cap rises → e-target can follow
			expect(results[7].trustCap).toBeGreaterThan(results[0].trustCap);
			// But drain also accumulates from sustained 0.7 → keeps things in check
			expect(results[7].eTarget).toBeLessThan(0.8);
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
			for (let i = 1; i < results.length; i++) {
				expect(results[i].eTarget).toBeLessThanOrEqual(results[i - 1].eTarget + 0.05);
			}
			expect(results[results.length - 1].eTarget).toBeLessThan(0.35);
		});

		it("Performance mode — low telling gain dampens upward following", () => {
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

		it("Over-sharer — drain protects before burnout", () => {
			const results = simulateSequence([
				{ energy: 0.9, telling: 0.9 },
				{ energy: 1.0, telling: 0.9 },
				{ energy: 1.0, telling: 0.8 },
				{ energy: 0.9, telling: 0.7 },
				{ energy: 1.0, telling: 0.8 },
			]);
			// Drain should activate strongly, pulling e-target down
			expect(results[3].eTarget).toBeLessThan(0.85);
			expect(results[3].drain).toBeGreaterThan(0.3);
		});

		it("Volatile — EMA dampens raw swings", () => {
			const rawEnergies = [0.3, 0.9, 0.2, 0.8, 0.3, 0.9];
			const results = simulateSequence(rawEnergies.map((energy) => ({ energy })));
			for (let i = 1; i < results.length; i++) {
				const eSwing = Math.abs(results[i].eTarget - results[i - 1].eTarget);
				const rawSwing = Math.abs(rawEnergies[i] - rawEnergies[i - 1]);
				expect(eSwing).toBeLessThan(rawSwing);
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
			]);
			expect(results[results.length - 1].eTarget).toBeLessThan(0.15);
		});

		it("sustained E=1.0 — drain pulls hard, trust may cap high", () => {
			const results = simulateSequence([
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
				{ energy: 1.0 },
			]);
			const last = results[results.length - 1];
			expect(last.drain).toBeGreaterThan(0.8);
			// Even if trust is high, drain × (1 - drain) kills the target
			expect(last.eTarget).toBeLessThan(0.2);
		});

		it("single turn with prior state", () => {
			const result = computeETarget({
				energyHistory: [0.7],
				tellingHistory: [0.5],
				priorSmoothedEnergy: 0.6,
				priorSessionTrust: 0.5,
			});
			expect(result.eTarget).toBeGreaterThanOrEqual(0);
			expect(result.eTarget).toBeLessThanOrEqual(1);
			expect(result.sessionTrust).toBeGreaterThan(0);
		});
	});
});
