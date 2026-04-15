import { describe, expect, it } from "vitest";
import {
	formatLastSharedRelative,
	formatUnderstandingSinceMonthYear,
	lastSharedIsoForDisplay,
} from "../circle-relationship-copy";

describe("circle-relationship-copy", () => {
	it("formats month and year for duration line", () => {
		expect(formatUnderstandingSinceMonthYear("2026-03-20T00:00:00.000Z")).toMatch(/March.*2026/);
	});

	it("formats relative last shared", () => {
		const now = new Date("2026-03-25T12:00:00.000Z").getTime();
		const label = formatLastSharedRelative("2026-03-20T12:00:00.000Z", now);
		expect(label.length).toBeGreaterThan(0);
	});

	it("prefers contentCompletedAt for last shared display", () => {
		expect(
			lastSharedIsoForDisplay({
				hasContent: true,
				createdAt: "2026-01-01T00:00:00.000Z",
				contentCompletedAt: "2026-02-01T00:00:00.000Z",
			}),
		).toBe("2026-02-01T00:00:00.000Z");
	});

	it("falls back to createdAt when content ready but no completion timestamp", () => {
		expect(
			lastSharedIsoForDisplay({
				hasContent: true,
				createdAt: "2026-01-05T00:00:00.000Z",
				contentCompletedAt: null,
			}),
		).toBe("2026-01-05T00:00:00.000Z");
	});

	it("returns null when still generating", () => {
		expect(
			lastSharedIsoForDisplay({
				hasContent: false,
				createdAt: "2026-01-05T00:00:00.000Z",
				contentCompletedAt: null,
			}),
		).toBeNull();
	});
});
