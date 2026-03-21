// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { PORTRAIT_POLL_INTERVAL_MS, shouldPollPortraitStatus } from "./usePortraitStatus";

describe("shouldPollPortraitStatus", () => {
	it("polls every 2s when status is 'generating'", () => {
		expect(shouldPollPortraitStatus("success", "generating", false)).toBe(PORTRAIT_POLL_INTERVAL_MS);
	});

	it("stops polling when status is 'ready'", () => {
		expect(shouldPollPortraitStatus("success", "ready", false)).toBe(false);
	});

	it("stops polling when status is 'failed'", () => {
		expect(shouldPollPortraitStatus("success", "failed", false)).toBe(false);
	});

	it("stops polling when status is 'none' and waitingForUnlock is false", () => {
		expect(shouldPollPortraitStatus("success", "none", false)).toBe(false);
	});

	it("continues polling when waitingForUnlock is true even if status is 'none'", () => {
		expect(shouldPollPortraitStatus("success", "none", true)).toBe(PORTRAIT_POLL_INTERVAL_MS);
	});

	it("stops polling on query error regardless of data status", () => {
		expect(shouldPollPortraitStatus("error", "generating", false)).toBe(false);
		expect(shouldPollPortraitStatus("error", "none", true)).toBe(false);
	});

	it("polls while generating even with waitingForUnlock", () => {
		expect(shouldPollPortraitStatus("success", "generating", true)).toBe(PORTRAIT_POLL_INTERVAL_MS);
	});

	it("polls when data status is undefined (initial load)", () => {
		expect(shouldPollPortraitStatus("pending", undefined, false)).toBe(PORTRAIT_POLL_INTERVAL_MS);
	});

	it("returns 2000ms as the polling interval constant", () => {
		expect(PORTRAIT_POLL_INTERVAL_MS).toBe(2000);
	});
});
