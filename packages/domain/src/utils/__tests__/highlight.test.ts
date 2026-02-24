/**
 * Highlight Position Computation Tests
 *
 * Story 11.2, Task 7.3
 */
import { describe, expect, it } from "vitest";
import { computeHighlightPositions } from "../highlight";

describe("computeHighlightPositions", () => {
	it("returns correct positions for exact unique match", () => {
		const result = computeHighlightPositions(
			"I really enjoy solving complex problems at work",
			"solving complex problems",
		);
		expect(result).toEqual({ highlightStart: 15, highlightEnd: 39 });
	});

	it("returns null for multiple matches (ambiguous)", () => {
		const result = computeHighlightPositions("I like cats and I like dogs", "I like");
		expect(result).toEqual({ highlightStart: null, highlightEnd: null });
	});

	it("returns null when quote not found", () => {
		const result = computeHighlightPositions("I enjoy reading books", "writing code");
		expect(result).toEqual({ highlightStart: null, highlightEnd: null });
	});

	it("returns null for empty quote", () => {
		const result = computeHighlightPositions("Some message content", "");
		expect(result).toEqual({ highlightStart: null, highlightEnd: null });
	});

	it("returns null for empty message", () => {
		const result = computeHighlightPositions("", "some quote");
		expect(result).toEqual({ highlightStart: null, highlightEnd: null });
	});

	it("handles unicode content correctly", () => {
		const result = computeHighlightPositions("I feel 😊 when I help others", "😊 when I help");
		expect(result.highlightStart).not.toBeNull();
		expect(result.highlightEnd).not.toBeNull();
		if (result.highlightStart !== null && result.highlightEnd !== null) {
			expect(
				"I feel 😊 when I help others".substring(result.highlightStart, result.highlightEnd),
			).toBe("😊 when I help");
		}
	});

	it("handles quote at start of message", () => {
		const result = computeHighlightPositions(
			"I always plan ahead before starting tasks",
			"I always plan ahead",
		);
		expect(result).toEqual({ highlightStart: 0, highlightEnd: 19 });
	});

	it("handles quote at end of message", () => {
		const result = computeHighlightPositions(
			"My favorite activity is reading books",
			"reading books",
		);
		expect(result).toEqual({ highlightStart: 24, highlightEnd: 37 });
	});
});
