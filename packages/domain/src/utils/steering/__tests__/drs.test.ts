/**
 * DRS (Depth Readiness Score) Tests — Story 21-2
 *
 * Pure function tests for the single metric driving conversation energy pacing.
 * Tests cover: breadth, engagement, energy multiplier, full DRS, and energy fit.
 */
import { describe, expect, it } from "vitest";
import {
	computeBreadth,
	computeDRS,
	computeEnergyFit,
	computeEnergyMultiplier,
	computeEngagement,
	type DRSConfig,
	type DRSInput,
	extractDRSConfig,
} from "../drs";

// Default config matching AppConfig defaults
const defaultConfig: DRSConfig = {
	breadthWeight: 0.55,
	engagementWeight: 0.45,
	breadthOffset: 10,
	breadthRange: 15,
	wordCountThreshold: 120,
	evidenceThreshold: 6,
	engagementWordWeight: 0.55,
	engagementEvidenceWeight: 0.45,
	recencyWeights: [1.0, 0.6, 0.3],
	energyWeightLight: 0,
	energyWeightMedium: 1,
	energyWeightHeavy: 2,
	lightFitCenter: 0.55,
	lightFitRange: 0.35,
	mediumFitCenter: 0.55,
	mediumFitRange: 0.35,
	heavyFitCenter: 0.65,
	heavyFitRange: 0.25,
};

// ─── computeBreadth ─────────────────────────────────────────────────

describe("computeBreadth", () => {
	it("returns 0 for 0 covered facets (below offset)", () => {
		expect(computeBreadth(0, defaultConfig)).toBe(0);
	});

	it("returns 0 at exactly the offset (10 facets)", () => {
		expect(computeBreadth(10, defaultConfig)).toBe(0);
	});

	it("returns ~0.467 for 17 covered facets", () => {
		const result = computeBreadth(17, defaultConfig);
		expect(result).toBeCloseTo(7 / 15, 3);
	});

	it("returns 1.0 for 25 covered facets (at offset + range)", () => {
		expect(computeBreadth(25, defaultConfig)).toBe(1);
	});

	it("caps at 1.0 for 30 covered facets (above range)", () => {
		expect(computeBreadth(30, defaultConfig)).toBe(1);
	});

	it("returns 0 for negative facets", () => {
		expect(computeBreadth(-5, defaultConfig)).toBe(0);
	});
});

// ─── computeEngagement ──────────────────────────────────────────────

describe("computeEngagement", () => {
	it("returns 0 for empty arrays (no messages yet)", () => {
		expect(computeEngagement([], [], defaultConfig)).toBe(0);
	});

	it("returns low engagement for short messages with no evidence", () => {
		const result = computeEngagement([20, 15, 10], [0, 0, 0], defaultConfig);
		// word = avg(20,15,10)/120 = 15/120 = 0.125
		// evid = 0
		// engagement = 0.55*0.125 + 0.45*0 = 0.06875
		expect(result).toBeCloseTo(0.06875, 3);
	});

	it("returns high engagement for long messages with rich evidence", () => {
		const result = computeEngagement([150, 180, 200], [8, 7, 9], defaultConfig);
		// word = min(avg(150,180,200)/120, 1) = min(176.67/120, 1) = 1
		// evid = min(avg(8,7,9)/6, 1) = min(8/6, 1) = 1
		// engagement = 0.55*1 + 0.45*1 = 1.0
		expect(result).toBe(1);
	});

	it("handles arrays shorter than 3 elements", () => {
		const result = computeEngagement([60], [3], defaultConfig);
		// word = 60/120 = 0.5
		// evid = 3/6 = 0.5
		// engagement = 0.55*0.5 + 0.45*0.5 = 0.5
		expect(result).toBeCloseTo(0.5, 3);
	});

	it("uses only available data for 2 elements", () => {
		const result = computeEngagement([120, 60], [6, 3], defaultConfig);
		// word = avg(120,60)/120 = 90/120 = 0.75
		// evid = avg(6,3)/6 = 4.5/6 = 0.75
		// engagement = 0.55*0.75 + 0.45*0.75 = 0.75
		expect(result).toBeCloseTo(0.75, 3);
	});

	it("caps word and evidence components at 1", () => {
		const result = computeEngagement([500], [20], defaultConfig);
		// Both word and evid cap at 1
		expect(result).toBe(1);
	});
});

// ─── computeEnergyMultiplier ────────────────────────────────────────

describe("computeEnergyMultiplier", () => {
	it("returns 1.0 for empty array (no energy history)", () => {
		expect(computeEnergyMultiplier([], defaultConfig)).toBe(1);
	});

	it("returns 1.0 for all light energy (no pressure)", () => {
		const result = computeEnergyMultiplier(["light", "light", "light"], defaultConfig);
		expect(result).toBe(1);
	});

	it("returns near 0 for all heavy energy (max pressure)", () => {
		const result = computeEnergyMultiplier(["heavy", "heavy", "heavy"], defaultConfig);
		// pressure = (1.0*2 + 0.6*2 + 0.3*2) / 3.8 = 3.8/3.8 = 1.0
		// multiplier = clamp(1 - 1.0, 0, 1) = 0
		expect(result).toBe(0);
	});

	it("returns intermediate value for mixed energy", () => {
		const result = computeEnergyMultiplier(["heavy", "medium", "light"], defaultConfig);
		// pressure = (1.0*2 + 0.6*1 + 0.3*0) / 3.8 = 2.6/3.8 ≈ 0.6842
		// multiplier = 1 - 0.6842 ≈ 0.3158
		expect(result).toBeCloseTo(1 - 2.6 / 3.8, 3);
	});

	it("handles single energy level", () => {
		const result = computeEnergyMultiplier(["medium"], defaultConfig);
		// pressure = (1.0*1) / (1.0*2) = 0.5
		// multiplier = 1 - 0.5 = 0.5
		expect(result).toBeCloseTo(0.5, 3);
	});

	it("handles two energy levels", () => {
		const result = computeEnergyMultiplier(["light", "heavy"], defaultConfig);
		// pressure = (1.0*0 + 0.6*2) / (1.0*2 + 0.6*2) = 1.2/3.2 = 0.375
		// multiplier = 1 - 0.375 = 0.625
		expect(result).toBeCloseTo(0.625, 3);
	});
});

// ─── computeDRS ─────────────────────────────────────────────────────

describe("computeDRS", () => {
	it("returns near 0 for early conversation (no messages, few facets)", () => {
		const input: DRSInput = {
			coveredFacets: 0,
			lastWordCounts: [],
			lastEvidenceCounts: [],
			lastEnergyLevels: [],
		};
		expect(computeDRS(input, defaultConfig)).toBe(0);
	});

	it("returns ~0.1-0.3 for early conversation (light energy)", () => {
		const input: DRSInput = {
			coveredFacets: 12,
			lastWordCounts: [40, 30, 25],
			lastEvidenceCounts: [1, 1, 2],
			lastEnergyLevels: ["light", "light", "light"],
		};
		const result = computeDRS(input, defaultConfig);
		expect(result).toBeGreaterThan(0.05);
		expect(result).toBeLessThan(0.3);
	});

	it("returns ~0.4-0.6 for mid conversation (mixed energy)", () => {
		const input: DRSInput = {
			coveredFacets: 18,
			lastWordCounts: [80, 90, 100],
			lastEvidenceCounts: [3, 4, 3],
			lastEnergyLevels: ["light", "medium", "light"],
		};
		const result = computeDRS(input, defaultConfig);
		expect(result).toBeGreaterThan(0.3);
		expect(result).toBeLessThan(0.7);
	});

	it("returns ~0.7+ for late conversation (many facets, high engagement)", () => {
		const input: DRSInput = {
			coveredFacets: 25,
			lastWordCounts: [120, 150, 130],
			lastEvidenceCounts: [5, 6, 7],
			lastEnergyLevels: ["light", "light", "light"],
		};
		const result = computeDRS(input, defaultConfig);
		expect(result).toBeGreaterThan(0.65);
	});

	it("recovery after heavy: energy pressure drops DRS", () => {
		const withoutHeavy: DRSInput = {
			coveredFacets: 22,
			lastWordCounts: [100, 110, 90],
			lastEvidenceCounts: [4, 5, 4],
			lastEnergyLevels: ["light", "light", "light"],
		};
		const withHeavy: DRSInput = {
			...withoutHeavy,
			lastEnergyLevels: ["heavy", "heavy", "medium"],
		};
		const drsLight = computeDRS(withoutHeavy, defaultConfig);
		const drsHeavy = computeDRS(withHeavy, defaultConfig);
		expect(drsHeavy).toBeLessThan(drsLight);
		expect(drsHeavy).toBeLessThan(0.3);
	});

	it("edge case: all heavy history suppresses DRS to 0", () => {
		const input: DRSInput = {
			coveredFacets: 25,
			lastWordCounts: [150, 150, 150],
			lastEvidenceCounts: [6, 6, 6],
			lastEnergyLevels: ["heavy", "heavy", "heavy"],
		};
		expect(computeDRS(input, defaultConfig)).toBe(0);
	});

	it("result is always between 0 and 1", () => {
		// Extreme high values
		const high: DRSInput = {
			coveredFacets: 30,
			lastWordCounts: [500, 500, 500],
			lastEvidenceCounts: [20, 20, 20],
			lastEnergyLevels: ["light", "light", "light"],
		};
		expect(computeDRS(high, defaultConfig)).toBeLessThanOrEqual(1);
		expect(computeDRS(high, defaultConfig)).toBeGreaterThanOrEqual(0);
	});
});

// ─── computeEnergyFit ───────────────────────────────────────────────

describe("computeEnergyFit", () => {
	it("low DRS (0.1): light fit high, heavy fit 0", () => {
		expect(computeEnergyFit(0.1, "light", defaultConfig)).toBeGreaterThan(0.9);
		expect(computeEnergyFit(0.1, "heavy", defaultConfig)).toBe(0);
	});

	it("mid DRS (0.55): medium fit high", () => {
		const mediumFit = computeEnergyFit(0.55, "medium", defaultConfig);
		// mediumFit = 1 - clamp(abs(0.55 - 0.55)/0.35, 0, 1) = 1 - 0 = 1
		expect(mediumFit).toBe(1);
	});

	it("mid DRS (0.55): light and heavy have lower fit", () => {
		const lightFit = computeEnergyFit(0.55, "light", defaultConfig);
		const heavyFit = computeEnergyFit(0.55, "heavy", defaultConfig);
		// lightFit = clamp((0.55 - 0.55)/0.35, 0, 1) = 0
		// heavyFit = clamp((0.55 - 0.65)/0.25, 0, 1) = clamp(-0.4, 0, 1) = 0
		expect(lightFit).toBe(0);
		expect(heavyFit).toBe(0);
	});

	it("high DRS (0.8): heavy fit high, light fit 0", () => {
		const heavyFit = computeEnergyFit(0.8, "heavy", defaultConfig);
		const lightFit = computeEnergyFit(0.8, "light", defaultConfig);
		// heavyFit = clamp((0.8 - 0.65)/0.25, 0, 1) = clamp(0.6, 0, 1) = 0.6
		expect(heavyFit).toBeCloseTo(0.6, 3);
		expect(lightFit).toBe(0);
	});

	it("DRS = 0: light fit = 1, medium and heavy = 0 or low", () => {
		expect(computeEnergyFit(0, "light", defaultConfig)).toBeGreaterThan(0.9);
		expect(computeEnergyFit(0, "heavy", defaultConfig)).toBe(0);
	});

	it("DRS = 1: heavy fit = 1, light fit = 0", () => {
		expect(computeEnergyFit(1, "heavy", defaultConfig)).toBe(1);
		expect(computeEnergyFit(1, "light", defaultConfig)).toBe(0);
	});

	it("boundary: DRS at light center (0.55) gives light fit 0", () => {
		expect(computeEnergyFit(0.55, "light", defaultConfig)).toBe(0);
	});

	it("boundary: DRS at heavy center (0.65) gives heavy fit 0", () => {
		// heavyFit = clamp((0.65 - 0.65)/0.25, 0, 1) = 0
		expect(computeEnergyFit(0.65, "heavy", defaultConfig)).toBe(0);
	});
});

// ─── extractDRSConfig ───────────────────────────────────────────────

describe("extractDRSConfig", () => {
	it("extracts DRS config fields from AppConfigService", () => {
		// Use a minimal mock that has the DRS fields
		const appConfig = {
			drsBreadthWeight: 0.55,
			drsEngagementWeight: 0.45,
			drsBreadthOffset: 10,
			drsBreadthRange: 15,
			drsWordCountThreshold: 120,
			drsEvidenceThreshold: 6,
			drsEngagementWordWeight: 0.55,
			drsEngagementEvidenceWeight: 0.45,
			drsRecencyWeights: [1.0, 0.6, 0.3],
			drsEnergyWeightLight: 0,
			drsEnergyWeightMedium: 1,
			drsEnergyWeightHeavy: 2,
			drsLightFitCenter: 0.55,
			drsLightFitRange: 0.35,
			drsMediumFitCenter: 0.55,
			drsMediumFitRange: 0.35,
			drsHeavyFitCenter: 0.65,
			drsHeavyFitRange: 0.25,
		} as Parameters<typeof extractDRSConfig>[0];

		const config = extractDRSConfig(appConfig);
		expect(config.breadthWeight).toBe(0.55);
		expect(config.engagementWeight).toBe(0.45);
		expect(config.recencyWeights).toEqual([1.0, 0.6, 0.3]);
		expect(config.heavyFitRange).toBe(0.25);
	});
});
