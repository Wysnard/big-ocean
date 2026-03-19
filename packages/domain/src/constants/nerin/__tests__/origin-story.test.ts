/**
 * Origin Story Module Tests — Story 31-2, Task 1
 *
 * Verifies Nerin's origin story is grounded in the Big Ocean dive shop
 * setting with Vincent as founder.
 */

import { describe, expect, it } from "vitest";
import { ORIGIN_STORY } from "../origin-story";

describe("ORIGIN_STORY", () => {
	it("is a non-empty string", () => {
		expect(typeof ORIGIN_STORY).toBe("string");
		expect(ORIGIN_STORY.length).toBeGreaterThan(0);
	});

	it("contains Big Ocean dive shop reference", () => {
		expect(ORIGIN_STORY).toContain("Big Ocean");
	});

	it("contains Vincent as founder", () => {
		expect(ORIGIN_STORY).toContain("Vincent");
	});

	it("contains dive master identity marker", () => {
		expect(ORIGIN_STORY.toLowerCase()).toMatch(/dive\s*master/);
	});

	it("does not contain forbidden assessment words", () => {
		const forbidden = ["assessment", "test", "diagnostic", "quiz"];
		for (const word of forbidden) {
			expect(ORIGIN_STORY.toLowerCase()).not.toContain(word);
		}
	});

	it("is between 100-300 words", () => {
		const wordCount = ORIGIN_STORY.split(/\s+/).filter((w) => w.length > 0).length;
		expect(wordCount).toBeGreaterThanOrEqual(100);
		expect(wordCount).toBeLessThanOrEqual(300);
	});
});
