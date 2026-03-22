// @vitest-environment jsdom

/**
 * useRelationshipAnalysis Hook Tests (Story 35-3)
 *
 * Tests for polling logic extracted as pure functions.
 */

import { vi } from "vitest";

// Mock the api-client to prevent transitive contract resolution issues
vi.mock("@/lib/api-client", () => ({
	makeApiClient: {},
}));

import { describe, expect, it } from "vitest";
import {
	RELATIONSHIP_POLL_INTERVAL_MS,
	shouldPollRelationshipAnalysis,
} from "./useRelationshipAnalysis";

describe("shouldPollRelationshipAnalysis", () => {
	it("returns poll interval when content is null (generating)", () => {
		expect(shouldPollRelationshipAnalysis("success", null)).toBe(RELATIONSHIP_POLL_INTERVAL_MS);
	});

	it("returns false when content is present (ready)", () => {
		expect(shouldPollRelationshipAnalysis("success", "# Analysis content")).toBe(false);
	});

	it("returns false on query error", () => {
		expect(shouldPollRelationshipAnalysis("error", null)).toBe(false);
	});

	it("returns false when query is pending (initial load)", () => {
		expect(shouldPollRelationshipAnalysis("pending", undefined)).toBe(false);
	});

	it("returns 5000ms as the polling interval constant", () => {
		expect(RELATIONSHIP_POLL_INTERVAL_MS).toBe(5000);
	});
});
