/**
 * Closing Exchange Module Tests — Story 31-3, Task 1
 *
 * Verifies FR12: Nerin delivers a distinct closing exchange that references
 * patterns/moments from the conversation and wraps themes with emotional resonance.
 */

import { describe, expect, it } from "vitest";
import { CLOSING_EXCHANGE } from "../closing-exchange";

describe("CLOSING_EXCHANGE", () => {
	it("is a non-empty string", () => {
		expect(typeof CLOSING_EXCHANGE).toBe("string");
		expect(CLOSING_EXCHANGE.length).toBeGreaterThan(0);
	});

	it("references patterns or moments from the conversation (FR12)", () => {
		const lower = CLOSING_EXCHANGE.toLowerCase();
		expect(lower).toMatch(/pattern|moment|noticed|surfaced|thread/);
	});

	it("contains concept of closing or final exchange", () => {
		const lower = CLOSING_EXCHANGE.toLowerCase();
		expect(lower).toMatch(/clos|last|final|end|wrap/);
	});

	it("does not contain forbidden words (assessment invisibility)", () => {
		const lower = CLOSING_EXCHANGE.toLowerCase();
		expect(lower).not.toMatch(/\bassessment\b/);
		expect(lower).not.toMatch(/\btest\b/);
		expect(lower).not.toMatch(/\bdiagnostic\b/);
		expect(lower).not.toMatch(/\bquiz\b/);
	});

	it("is between 50-200 words", () => {
		const wordCount = CLOSING_EXCHANGE.split(/\s+/).filter((w) => w.length > 0).length;
		expect(wordCount).toBeGreaterThanOrEqual(50);
		expect(wordCount).toBeLessThanOrEqual(200);
	});
});
