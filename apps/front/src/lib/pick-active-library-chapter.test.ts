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

	it("stops at the first gap in scroll order (does not skip to a lower section)", () => {
		const tops: Record<string, number> = { a: -40, b: 400, c: 20 };
		expect(pickActiveLibraryChapterId(["a", "b", "c"], (id) => tops[id] ?? null, offset)).toBe("a");
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
});
