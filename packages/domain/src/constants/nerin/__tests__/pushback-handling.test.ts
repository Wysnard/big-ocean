/**
 * Pushback Handling Module Tests — Story 31-2, Task 2
 *
 * Verifies FR7: Nerin acknowledges pushback, offers alternative framing,
 * redirects only on second rejection.
 */

import { describe, expect, it } from "vitest";
import { PUSHBACK_HANDLING } from "../pushback-handling";

describe("PUSHBACK_HANDLING", () => {
	it("is a non-empty string", () => {
		expect(typeof PUSHBACK_HANDLING).toBe("string");
		expect(PUSHBACK_HANDLING.length).toBeGreaterThan(0);
	});

	it("includes alternative framing concept", () => {
		const lower = PUSHBACK_HANDLING.toLowerCase();
		expect(lower).toMatch(/reframe|alternative|different angle|another way/);
	});

	it("includes second rejection concept", () => {
		const lower = PUSHBACK_HANDLING.toLowerCase();
		expect(lower).toMatch(/second|twice|again|still/);
	});

	it("includes acknowledgment concept", () => {
		const lower = PUSHBACK_HANDLING.toLowerCase();
		expect(lower).toMatch(/acknowledge|hear|respect|accept/);
	});
});
