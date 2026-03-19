/**
 * Safety Guardrails Module Tests — Story 31-2, Task 3
 *
 * Verifies FR9: no diagnostic language, no characterizing third parties.
 */

import { describe, expect, it } from "vitest";
import { SAFETY_GUARDRAILS } from "../safety-guardrails";

describe("SAFETY_GUARDRAILS", () => {
	it("is a non-empty string", () => {
		expect(typeof SAFETY_GUARDRAILS).toBe("string");
		expect(SAFETY_GUARDRAILS.length).toBeGreaterThan(0);
	});

	it("includes diagnostic language prohibition", () => {
		const lower = SAFETY_GUARDRAILS.toLowerCase();
		expect(lower).toMatch(/diagnostic/);
	});

	it("includes third party protection", () => {
		const lower = SAFETY_GUARDRAILS.toLowerCase();
		expect(lower).toMatch(/third part(y|ies)/);
	});

	it("provides examples of prohibited diagnostic labels", () => {
		const lower = SAFETY_GUARDRAILS.toLowerCase();
		// At least one example of a diagnostic label should be mentioned
		expect(lower).toMatch(/narcissis|codependent|attachment|toxic|borderline/);
	});
});
