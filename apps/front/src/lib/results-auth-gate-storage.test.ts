// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	clearPendingResultsGateSession,
	persistPendingResultsGateSession,
	RESULTS_GATE_TTL_MS,
	readPendingResultsGateSession,
} from "./results-auth-gate-storage";

describe("results-auth-gate-storage", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		window.localStorage.clear();
	});

	it("persists and reads pending session", () => {
		persistPendingResultsGateSession("session-123", 1000);
		const pending = readPendingResultsGateSession(1000 + 100);

		expect(pending?.sessionId).toBe("session-123");
		expect(pending?.expired).toBe(false);
	});

	it("marks pending session as expired after 24h", () => {
		persistPendingResultsGateSession("session-123", 1000);
		const pending = readPendingResultsGateSession(1000 + RESULTS_GATE_TTL_MS + 1);

		expect(pending?.expired).toBe(true);
	});

	it("clears a matching pending session", () => {
		persistPendingResultsGateSession("session-123", 1000);
		clearPendingResultsGateSession("session-123");

		expect(readPendingResultsGateSession()).toBeNull();
	});

	it("does not clear when provided session id does not match", () => {
		persistPendingResultsGateSession("session-123", 1000);
		clearPendingResultsGateSession("session-xyz");

		expect(readPendingResultsGateSession()?.sessionId).toBe("session-123");
	});
});
