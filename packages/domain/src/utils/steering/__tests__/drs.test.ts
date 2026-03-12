/**
 * DRS (Depth Readiness Score) Tests — Story 21-2, evolved Story 23-2
 *
 * Pure function tests for the single metric driving conversation energy pacing.
 * Tests cover: breadth, engagement, energy multiplier, full DRS, and energy fit.
 *
 * Evolved to use continuous energy values [0, 1] instead of categorical EnergyLevel.
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

/** Energy value constants matching old categorical bands */
const LIGHT_ENERGY = 0.25; // light territory energy
const MEDIUM_ENERGY = 0.42; // medium territory energy
const HEAVY_ENERGY = 0.65; // heavy territory energy

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
		expect(result).toBeCloseTo(0.06875, 3);
	});

	it("returns high engagement for long messages with rich evidence", () => {
		const result = computeEngagement([150, 180, 200], [8, 7, 9], defaultConfig);
		expect(result).toBe(1);
	});

	it("handles arrays shorter than 3 elements", () => {
		const result = computeEngagement([60], [3], defaultConfig);
		expect(result).toBeCloseTo(0.5, 3);
	});

	it("uses only available data for 2 elements", () => {
		const result = computeEngagement([120, 60], [6, 3], defaultConfig);
		expect(result).toBeCloseTo(0.75, 3);
	});

	it("caps word and evidence components at 1", () => {
		const result = computeEngagement([500], [20], defaultConfig);
		expect(result).toBe(1);
	});
});

// ─── computeEnergyMultiplier ────────────────────────────────────────

describe("computeEnergyMultiplier", () => {
	it("returns 1.0 for empty array (no energy history)", () => {
		expect(computeEnergyMultiplier([], defaultConfig)).toBe(1);
	});

	it("returns high value for all light energy values (low pressure)", () => {
		const result = computeEnergyMultiplier(
			[LIGHT_ENERGY, LIGHT_ENERGY, LIGHT_ENERGY],
			defaultConfig,
		);
		// Light energy (0.25) interpolates to a low-but-nonzero weight
		// Still produces high multiplier (low pressure)
		expect(result).toBeGreaterThan(0.5);
		expect(result).toBeLessThanOrEqual(1.0);
	});

	it("returns near 0 for all heavy energy values (max pressure)", () => {
		const result = computeEnergyMultiplier(
			[HEAVY_ENERGY, HEAVY_ENERGY, HEAVY_ENERGY],
			defaultConfig,
		);
		// Heavy energy maps to weight 2, maximum pressure
		expect(result).toBe(0);
	});

	it("returns intermediate value for mixed energy", () => {
		const result = computeEnergyMultiplier(
			[HEAVY_ENERGY, MEDIUM_ENERGY, LIGHT_ENERGY],
			defaultConfig,
		);
		expect(result).toBeGreaterThan(0.1);
		expect(result).toBeLessThan(0.7);
	});

	it("handles single energy value", () => {
		const result = computeEnergyMultiplier([MEDIUM_ENERGY], defaultConfig);
		// Medium energy weight interpolated between medium and heavy
		expect(result).toBeGreaterThan(0.3);
		expect(result).toBeLessThan(0.7);
	});
});

// ─── computeDRS ─────────────────────────────────────────────────────

describe("computeDRS", () => {
	it("returns near 0 for early conversation (no messages, few facets)", () => {
		const input: DRSInput = {
			coveredFacets: 0,
			lastWordCounts: [],
			lastEvidenceCounts: [],
			lastEnergyValues: [],
		};
		expect(computeDRS(input, defaultConfig)).toBe(0);
	});

	it("returns low DRS for early conversation (light energy)", () => {
		const input: DRSInput = {
			coveredFacets: 12,
			lastWordCounts: [40, 30, 25],
			lastEvidenceCounts: [1, 1, 2],
			lastEnergyValues: [LIGHT_ENERGY, LIGHT_ENERGY, LIGHT_ENERGY],
		};
		const result = computeDRS(input, defaultConfig);
		expect(result).toBeGreaterThan(0.05);
		expect(result).toBeLessThan(0.3);
	});

	it("returns mid-range DRS for mid conversation (mixed energy)", () => {
		const input: DRSInput = {
			coveredFacets: 18,
			lastWordCounts: [80, 90, 100],
			lastEvidenceCounts: [3, 4, 3],
			lastEnergyValues: [LIGHT_ENERGY, MEDIUM_ENERGY, LIGHT_ENERGY],
		};
		const result = computeDRS(input, defaultConfig);
		expect(result).toBeGreaterThan(0.2);
		expect(result).toBeLessThan(0.7);
	});

	it("returns high DRS for late conversation (many facets, high engagement)", () => {
		const input: DRSInput = {
			coveredFacets: 25,
			lastWordCounts: [120, 150, 130],
			lastEvidenceCounts: [5, 6, 7],
			lastEnergyValues: [LIGHT_ENERGY, LIGHT_ENERGY, LIGHT_ENERGY],
		};
		const result = computeDRS(input, defaultConfig);
		expect(result).toBeGreaterThan(0.65);
	});

	it("recovery after heavy: energy pressure drops DRS", () => {
		const withoutHeavy: DRSInput = {
			coveredFacets: 22,
			lastWordCounts: [100, 110, 90],
			lastEvidenceCounts: [4, 5, 4],
			lastEnergyValues: [LIGHT_ENERGY, LIGHT_ENERGY, LIGHT_ENERGY],
		};
		const withHeavy: DRSInput = {
			...withoutHeavy,
			lastEnergyValues: [HEAVY_ENERGY, HEAVY_ENERGY, MEDIUM_ENERGY],
		};
		const drsLight = computeDRS(withoutHeavy, defaultConfig);
		const drsHeavy = computeDRS(withHeavy, defaultConfig);
		expect(drsHeavy).toBeLessThan(drsLight);
	});

	it("edge case: all heavy history suppresses DRS to 0", () => {
		const input: DRSInput = {
			coveredFacets: 25,
			lastWordCounts: [150, 150, 150],
			lastEvidenceCounts: [6, 6, 6],
			lastEnergyValues: [HEAVY_ENERGY, HEAVY_ENERGY, HEAVY_ENERGY],
		};
		expect(computeDRS(input, defaultConfig)).toBe(0);
	});

	it("result is always between 0 and 1", () => {
		const high: DRSInput = {
			coveredFacets: 30,
			lastWordCounts: [500, 500, 500],
			lastEvidenceCounts: [20, 20, 20],
			lastEnergyValues: [LIGHT_ENERGY, LIGHT_ENERGY, LIGHT_ENERGY],
		};
		expect(computeDRS(high, defaultConfig)).toBeLessThanOrEqual(1);
		expect(computeDRS(high, defaultConfig)).toBeGreaterThanOrEqual(0);
	});
});

// ─── computeEnergyFit ───────────────────────────────────────────────

describe("computeEnergyFit", () => {
	it("low DRS (0.1): light territory fit high, heavy territory fit 0", () => {
		expect(computeEnergyFit(0.1, LIGHT_ENERGY, defaultConfig)).toBeGreaterThan(0.9);
		expect(computeEnergyFit(0.1, HEAVY_ENERGY, defaultConfig)).toBe(0);
	});

	it("mid DRS (0.55): medium territory fit high", () => {
		const mediumFit = computeEnergyFit(0.55, MEDIUM_ENERGY, defaultConfig);
		expect(mediumFit).toBe(1);
	});

	it("mid DRS (0.55): light and heavy territories have lower fit", () => {
		const lightFit = computeEnergyFit(0.55, LIGHT_ENERGY, defaultConfig);
		const heavyFit = computeEnergyFit(0.55, HEAVY_ENERGY, defaultConfig);
		expect(lightFit).toBe(0);
		expect(heavyFit).toBe(0);
	});

	it("high DRS (0.8): heavy territory fit high, light territory fit 0", () => {
		const heavyFit = computeEnergyFit(0.8, HEAVY_ENERGY, defaultConfig);
		const lightFit = computeEnergyFit(0.8, LIGHT_ENERGY, defaultConfig);
		expect(heavyFit).toBeCloseTo(0.6, 3);
		expect(lightFit).toBe(0);
	});

	it("DRS = 0: light territory fit > 0.9, heavy territory fit 0", () => {
		expect(computeEnergyFit(0, LIGHT_ENERGY, defaultConfig)).toBeGreaterThan(0.9);
		expect(computeEnergyFit(0, HEAVY_ENERGY, defaultConfig)).toBe(0);
	});

	it("DRS = 1: heavy territory fit = 1, light territory fit = 0", () => {
		expect(computeEnergyFit(1, HEAVY_ENERGY, defaultConfig)).toBe(1);
		expect(computeEnergyFit(1, LIGHT_ENERGY, defaultConfig)).toBe(0);
	});

	it("boundary: DRS at light center (0.55) gives light territory fit 0", () => {
		expect(computeEnergyFit(0.55, LIGHT_ENERGY, defaultConfig)).toBe(0);
	});

	it("boundary: DRS at heavy center (0.65) gives heavy territory fit 0", () => {
		expect(computeEnergyFit(0.65, HEAVY_ENERGY, defaultConfig)).toBe(0);
	});
});

// ─── extractDRSConfig ───────────────────────────────────────────────

describe("extractDRSConfig", () => {
	it("extracts DRS config fields from AppConfigService", () => {
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
