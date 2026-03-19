// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOnlineStatus } from "./useOnlineStatus";

describe("useOnlineStatus", () => {
	let originalOnLine: boolean;

	beforeEach(() => {
		vi.useFakeTimers();
		originalOnLine = navigator.onLine;
	});

	afterEach(() => {
		vi.useRealTimers();
		// Restore original value
		Object.defineProperty(navigator, "onLine", {
			value: originalOnLine,
			writable: true,
			configurable: true,
		});
	});

	function setOnlineStatus(value: boolean) {
		Object.defineProperty(navigator, "onLine", {
			value,
			writable: true,
			configurable: true,
		});
	}

	it("returns true when browser is online", () => {
		setOnlineStatus(true);
		const { result } = renderHook(() => useOnlineStatus());
		expect(result.current.isOnline).toBe(true);
		expect(result.current.wasOffline).toBe(false);
	});

	it("returns false when browser is offline", () => {
		setOnlineStatus(false);
		const { result } = renderHook(() => useOnlineStatus());
		expect(result.current.isOnline).toBe(false);
	});

	it("updates when going offline", () => {
		setOnlineStatus(true);
		const { result } = renderHook(() => useOnlineStatus());
		expect(result.current.isOnline).toBe(true);

		act(() => {
			setOnlineStatus(false);
			window.dispatchEvent(new Event("offline"));
		});

		expect(result.current.isOnline).toBe(false);
	});

	it("sets wasOffline when reconnecting", () => {
		setOnlineStatus(false);
		const { result } = renderHook(() => useOnlineStatus());
		expect(result.current.isOnline).toBe(false);

		act(() => {
			setOnlineStatus(true);
			window.dispatchEvent(new Event("online"));
		});

		expect(result.current.isOnline).toBe(true);
		expect(result.current.wasOffline).toBe(true);

		// wasOffline clears after 3 seconds
		act(() => {
			vi.advanceTimersByTime(3000);
		});

		expect(result.current.wasOffline).toBe(false);
	});

	it("clears wasOffline timer if going offline again", () => {
		setOnlineStatus(false);
		const { result } = renderHook(() => useOnlineStatus());

		// Go online
		act(() => {
			setOnlineStatus(true);
			window.dispatchEvent(new Event("online"));
		});
		expect(result.current.wasOffline).toBe(true);

		// Go offline again before timer expires
		act(() => {
			vi.advanceTimersByTime(1000);
			setOnlineStatus(false);
			window.dispatchEvent(new Event("offline"));
		});

		expect(result.current.isOnline).toBe(false);
		expect(result.current.wasOffline).toBe(false);
	});
});
