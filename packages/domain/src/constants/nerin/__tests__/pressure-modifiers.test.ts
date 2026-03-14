/**
 * Pressure Modifiers Tests — Story 28-3
 *
 * Verifies the 3 pressure modifier constants and the lookup function.
 */

import { describe, expect, it } from "vitest";

import type { EntryPressure } from "../../../types/pacing";
import {
	PRESSURE_ANGLED,
	PRESSURE_DIRECT,
	PRESSURE_SOFT,
	getPressureModifier,
} from "../pressure-modifiers";

// ─── Pressure Modifier Constants ────────────────────────────────────

describe("pressure modifier constants", () => {
	it("PRESSURE_DIRECT is a non-empty string", () => {
		expect(typeof PRESSURE_DIRECT).toBe("string");
		expect(PRESSURE_DIRECT.length).toBeGreaterThan(0);
	});

	it("PRESSURE_ANGLED is a non-empty string", () => {
		expect(typeof PRESSURE_ANGLED).toBe("string");
		expect(PRESSURE_ANGLED.length).toBeGreaterThan(0);
	});

	it("PRESSURE_SOFT is a non-empty string", () => {
		expect(typeof PRESSURE_SOFT).toBe("string");
		expect(PRESSURE_SOFT.length).toBeGreaterThan(0);
	});

	it("PRESSURE_DIRECT contains direct instruction", () => {
		expect(PRESSURE_DIRECT).toContain("straight");
	});

	it("PRESSURE_ANGLED contains angled instruction", () => {
		expect(PRESSURE_ANGLED).toContain("thread");
		expect(PRESSURE_ANGLED).toContain("guarded");
	});

	it("PRESSURE_SOFT contains soft instruction", () => {
		expect(PRESSURE_SOFT).toContain("naturally");
	});
});

// ─── getPressureModifier ────────────────────────────────────────────

describe("getPressureModifier", () => {
	it("returns PRESSURE_DIRECT for 'direct'", () => {
		expect(getPressureModifier("direct")).toBe(PRESSURE_DIRECT);
	});

	it("returns PRESSURE_ANGLED for 'angled'", () => {
		expect(getPressureModifier("angled")).toBe(PRESSURE_ANGLED);
	});

	it("returns PRESSURE_SOFT for 'soft'", () => {
		expect(getPressureModifier("soft")).toBe(PRESSURE_SOFT);
	});

	it("handles all EntryPressure values exhaustively", () => {
		const pressures: EntryPressure[] = ["direct", "angled", "soft"];
		for (const p of pressures) {
			const result = getPressureModifier(p);
			expect(typeof result).toBe("string");
			expect(result.length).toBeGreaterThan(0);
		}
	});
});
