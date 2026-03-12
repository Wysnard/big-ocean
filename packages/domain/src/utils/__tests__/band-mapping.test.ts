import { describe, expect, it } from "vitest";
import { mapEnergyBand, mapTellingBand } from "../band-mapping";

describe("mapEnergyBand", () => {
	it("maps 'minimal' to 0.1", () => {
		expect(mapEnergyBand("minimal")).toBe(0.1);
	});

	it("maps 'low' to 0.3", () => {
		expect(mapEnergyBand("low")).toBe(0.3);
	});

	it("maps 'steady' to 0.5", () => {
		expect(mapEnergyBand("steady")).toBe(0.5);
	});

	it("maps 'high' to 0.7", () => {
		expect(mapEnergyBand("high")).toBe(0.7);
	});

	it("maps 'very_high' to 0.9", () => {
		expect(mapEnergyBand("very_high")).toBe(0.9);
	});

	it("all values are in [0, 1] range", () => {
		const bands = ["minimal", "low", "steady", "high", "very_high"] as const;
		for (const band of bands) {
			const value = mapEnergyBand(band);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThanOrEqual(1);
		}
	});
});

describe("mapTellingBand", () => {
	it("maps 'fully_compliant' to 0.0", () => {
		expect(mapTellingBand("fully_compliant")).toBe(0.0);
	});

	it("maps 'mostly_compliant' to 0.25", () => {
		expect(mapTellingBand("mostly_compliant")).toBe(0.25);
	});

	it("maps 'mixed' to 0.5", () => {
		expect(mapTellingBand("mixed")).toBe(0.5);
	});

	it("maps 'mostly_self_propelled' to 0.75", () => {
		expect(mapTellingBand("mostly_self_propelled")).toBe(0.75);
	});

	it("maps 'strongly_self_propelled' to 1.0", () => {
		expect(mapTellingBand("strongly_self_propelled")).toBe(1.0);
	});

	it("all values are in [0, 1] range", () => {
		const bands = [
			"fully_compliant",
			"mostly_compliant",
			"mixed",
			"mostly_self_propelled",
			"strongly_self_propelled",
		] as const;
		for (const band of bands) {
			const value = mapTellingBand(band);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThanOrEqual(1);
		}
	});
});
