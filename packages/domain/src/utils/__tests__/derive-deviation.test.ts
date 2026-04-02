import { describe, expect, it } from "@effect/vitest";
import { deriveDeviation } from "../derive-deviation";

describe("deriveDeviation", () => {
	it("returns +3 for high + strong", () => {
		expect(deriveDeviation("high", "strong")).toBe(3);
	});

	it("returns +2 for high + moderate", () => {
		expect(deriveDeviation("high", "moderate")).toBe(2);
	});

	it("returns +1 for high + weak", () => {
		expect(deriveDeviation("high", "weak")).toBe(1);
	});

	it("returns -3 for low + strong", () => {
		expect(deriveDeviation("low", "strong")).toBe(-3);
	});

	it("returns -2 for low + moderate", () => {
		expect(deriveDeviation("low", "moderate")).toBe(-2);
	});

	it("returns -1 for low + weak", () => {
		expect(deriveDeviation("low", "weak")).toBe(-1);
	});
});
