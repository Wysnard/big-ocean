/**
 * Tests for version-detection utility (Story 36-3)
 */
import { describe, expect, it } from "vitest";
import { isLatestVersion } from "../version-detection";

describe("isLatestVersion", () => {
	it("returns true when resultId matches latestResultId", () => {
		expect(isLatestVersion("result-1", "result-1")).toBe(true);
	});

	it("returns false when resultId does not match latestResultId", () => {
		expect(isLatestVersion("result-1", "result-2")).toBe(false);
	});

	it("returns true when latestResultId is null (no results exist)", () => {
		expect(isLatestVersion("result-1", null)).toBe(true);
	});
});
