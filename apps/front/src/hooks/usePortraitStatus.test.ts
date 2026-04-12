// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/api-client", () => ({ makeApiClient: {} }));

import { PORTRAIT_POLL_INTERVAL_MS, shouldPollPortraitStatus } from "./usePortraitStatus";

describe("shouldPollPortraitStatus", () => {
	it("polls every 2s when status is 'generating'", () => {
		expect(shouldPollPortraitStatus("success", "generating")).toBe(PORTRAIT_POLL_INTERVAL_MS);
	});

	it("stops polling when status is 'ready'", () => {
		expect(shouldPollPortraitStatus("success", "ready")).toBe(false);
	});

	it("stops polling when status is 'failed'", () => {
		expect(shouldPollPortraitStatus("success", "failed")).toBe(false);
	});

	it("stops polling when status is 'none'", () => {
		expect(shouldPollPortraitStatus("success", "none")).toBe(false);
	});

	it("stops polling on query error regardless of data status", () => {
		expect(shouldPollPortraitStatus("error", "generating")).toBe(false);
		expect(shouldPollPortraitStatus("error", "none")).toBe(false);
	});

	it("polls when data status is undefined (initial load)", () => {
		expect(shouldPollPortraitStatus("pending", undefined)).toBe(PORTRAIT_POLL_INTERVAL_MS);
	});

	it("returns 2000ms as the polling interval constant", () => {
		expect(PORTRAIT_POLL_INTERVAL_MS).toBe(2000);
	});
});
