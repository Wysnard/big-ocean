import { describe, expect, it } from "vitest";

import { pickActiveLibraryChapterId } from "./pick-active-library-chapter";

describe("pickActiveLibraryChapterId", () => {
	const offset = 120;

	it("returns the first id when no section has reached the anchor yet", () => {
		const tops: Record<string, number> = { a: 200, b: 800 };
		expect(pickActiveLibraryChapterId(["a", "b"], (id) => tops[id] ?? null, offset)).toBe("a");
	});

	it("returns the last section whose top is at or above the anchor line", () => {
		const tops: Record<string, number> = { a: -40, b: 40, c: 400 };
		expect(pickActiveLibraryChapterId(["a", "b", "c"], (id) => tops[id] ?? null, offset)).toBe("b");
	});

	it("sorts measured chapters by document order before picking the active section", () => {
		const tops: Record<string, number> = { a: -40, b: 400, c: 20 };
		expect(pickActiveLibraryChapterId(["a", "b", "c"], (id) => tops[id] ?? null, offset)).toBe("c");
	});

	it("returns null for an empty list", () => {
		expect(pickActiveLibraryChapterId([], () => 0, offset)).toBeNull();
	});

	it("returns null when no ids produce a measurement", () => {
		expect(pickActiveLibraryChapterId(["x", "y"], () => null, offset)).toBeNull();
	});

	it("prefers a heading already aligned near the anchor line", () => {
		const tops: Record<string, number> = { a: 127, b: 379, c: 631, d: 883 };
		expect(pickActiveLibraryChapterId(["a", "b", "c", "d"], (id) => tops[id] ?? null, offset)).toBe(
			"a",
		);
	});

	it("uses the last passed heading when nothing is close to the anchor", () => {
		const tops: Record<string, number> = { a: -1009, b: -607, c: 127, d: 379, e: 631, f: 883 };
		expect(
			pickActiveLibraryChapterId(["a", "b", "c", "d", "e", "f"], (id) => tops[id] ?? null, offset),
		).toBe("c");
	});

	it("moves the activation line down near the document bottom", () => {
		const tops: Record<string, number> = {
			overview: -800,
			strengths: -200,
			growth: 320,
			compatible: 760,
		};

		expect(
			pickActiveLibraryChapterId(
				["overview", "strengths", "growth", "compatible"],
				(id) => tops[id] ?? null,
				offset,
				{ viewportHeight: 1200, scrollY: 800, scrollHeight: 2000 },
			),
		).toBe("compatible");
	});

	it("keeps the sticky-nav anchor away from the document bottom", () => {
		const tops: Record<string, number> = {
			overview: -800,
			strengths: -200,
			growth: 320,
			compatible: 760,
		};

		expect(
			pickActiveLibraryChapterId(
				["overview", "strengths", "growth", "compatible"],
				(id) => tops[id] ?? null,
				offset,
				{ viewportHeight: 1200, scrollY: 100, scrollHeight: 3000 },
			),
		).toBe("strengths");
	});

	it("prefers a visible hash-targeted chapter when multiple lower headings share the bottom scroll position", () => {
		const tops: Record<string, number> = {
			what: 127,
			quieter: 379,
			vivid: 631,
			daily: 883,
		};

		expect(
			pickActiveLibraryChapterId(
				["what", "quieter", "vivid", "daily"],
				(id) => tops[id] ?? null,
				offset,
				{ viewportHeight: 1200, scrollY: 1523, scrollHeight: 2723 },
				"quieter",
			),
		).toBe("quieter");
	});

	it("ignores a hash-targeted chapter after it leaves the viewport", () => {
		const tops: Record<string, number> = {
			overview: -1300,
			strengths: 20,
			compatible: 760,
		};

		expect(
			pickActiveLibraryChapterId(
				["overview", "strengths", "compatible"],
				(id) => tops[id] ?? null,
				offset,
				{ viewportHeight: 1200, scrollY: 600, scrollHeight: 2400 },
				"overview",
			),
		).toBe("strengths");
	});
});
