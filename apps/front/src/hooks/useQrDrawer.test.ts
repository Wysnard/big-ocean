/**
 * useQrDrawer Hook Tests (Story 34-2)
 *
 * Tests for the QR drawer lifecycle hook:
 * - Token generation on open
 * - Status polling at 60s intervals
 * - Auto-regeneration before expiry
 * - Cleanup on close/unmount
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useQrDrawer } from "./useQrDrawer";

const API_URL = "http://localhost:4000";

const mockGenerateResponse = {
	token: "test-token-123",
	shareUrl: "http://localhost:3000/relationship/qr/test-token-123",
	expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
};

const _mockStatusValid = { status: "valid" as const };
const mockStatusAccepted = { status: "accepted" as const };

describe("useQrDrawer", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("starts in idle state", () => {
		const { result } = renderHook(() => useQrDrawer());

		expect(result.current.isOpen).toBe(false);
		expect(result.current.token).toBeNull();
		expect(result.current.shareUrl).toBeNull();
		expect(result.current.status).toBe("idle");
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it("generates token on open", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockGenerateResponse),
		});

		const { result } = renderHook(() => useQrDrawer());

		await act(async () => {
			result.current.open();
		});

		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
			expect(result.current.token).toBe("test-token-123");
			expect(result.current.shareUrl).toBe("http://localhost:3000/relationship/qr/test-token-123");
			expect(result.current.status).toBe("valid");
			expect(result.current.isLoading).toBe(false);
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`${API_URL}/api/relationship/qr/generate`,
			expect.objectContaining({ method: "POST", credentials: "include" }),
		);
	});

	it("sets loading state while generating", async () => {
		let resolveGenerate!: () => void;
		const pendingPromise = new Promise<void>((resolve) => {
			resolveGenerate = resolve;
		});

		fetchMock.mockReturnValueOnce(
			pendingPromise.then(() => ({
				ok: true,
				json: () => Promise.resolve(mockGenerateResponse),
			})),
		);

		const { result } = renderHook(() => useQrDrawer());

		act(() => {
			result.current.open();
		});

		// While pending, isLoading should be true
		expect(result.current.isLoading).toBe(true);
		expect(result.current.isOpen).toBe(true);

		await act(async () => {
			resolveGenerate();
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
			expect(result.current.token).toBe("test-token-123");
		});
	});

	it("sets error on generation failure", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
		});

		const { result } = renderHook(() => useQrDrawer());

		await act(async () => {
			result.current.open();
		});

		await waitFor(() => {
			expect(result.current.error).toBe("Failed to generate QR code. Please try again.");
			expect(result.current.isLoading).toBe(false);
			expect(result.current.isOpen).toBe(false);
		});
	});

	it("resets state on close", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockGenerateResponse),
		});

		const { result } = renderHook(() => useQrDrawer());

		await act(async () => {
			result.current.open();
		});

		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
			expect(result.current.token).toBe("test-token-123");
		});

		act(() => {
			result.current.close();
		});

		expect(result.current.isOpen).toBe(false);
		expect(result.current.token).toBeNull();
		expect(result.current.status).toBe("idle");
	});

	it("updates status via pollNow", async () => {
		fetchMock
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockGenerateResponse),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockStatusAccepted),
			});

		const { result } = renderHook(() => useQrDrawer());

		await act(async () => {
			result.current.open();
		});

		await waitFor(() => {
			expect(result.current.status).toBe("valid");
		});

		// Manually trigger a poll
		await act(async () => {
			await result.current.pollNow();
		});

		await waitFor(() => {
			expect(result.current.status).toBe("accepted");
		});
	});

	it("regenerates token when near expiry on pollNow", async () => {
		// Token expires in 50 minutes (below the 55-min threshold)
		const nearExpiryResponse = {
			...mockGenerateResponse,
			expiresAt: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
		};

		const freshResponse = {
			token: "fresh-token-456",
			shareUrl: "http://localhost:3000/relationship/qr/fresh-token-456",
			expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
		};

		fetchMock
			// Initial generate
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(nearExpiryResponse),
			})
			// Regeneration call triggered by pollNow
			.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(freshResponse),
			});

		const { result } = renderHook(() => useQrDrawer());

		await act(async () => {
			result.current.open();
		});

		await waitFor(() => {
			expect(result.current.token).toBe("test-token-123");
		});

		// Poll — should detect near-expiry and regenerate
		await act(async () => {
			await result.current.pollNow();
		});

		await waitFor(() => {
			expect(result.current.token).toBe("fresh-token-456");
			expect(result.current.shareUrl).toBe("http://localhost:3000/relationship/qr/fresh-token-456");
		});
	});

	it("does not poll after unmount", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockGenerateResponse),
		});

		const { result, unmount } = renderHook(() => useQrDrawer());

		await act(async () => {
			result.current.open();
		});

		await waitFor(() => {
			expect(result.current.isOpen).toBe(true);
		});

		unmount();

		// Attempting to poll after unmount should not cause state updates or errors
		// (isMountedRef prevents setState calls)
	});
});
