/**
 * useQrDrawer Hook Tests (Story 34-2)
 *
 * Tests for the QR drawer lifecycle hook using TanStack Query.
 * Mocks the qr-token-api module to avoid Effect/contracts import chain.
 */

import { vi } from "vitest";

const mockGenerateToken = vi.fn();
const mockFetchTokenStatus = vi.fn();

vi.mock("../lib/qr-token-api", () => ({
	generateToken: (...args: unknown[]) => mockGenerateToken(...args),
	fetchTokenStatus: (...args: unknown[]) => mockFetchTokenStatus(...args),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useQrDrawer } from "./useQrDrawer";

const mockGenerateResponse = {
	token: "test-token-123",
	shareUrl: "http://localhost:3000/relationship/qr/test-token-123",
	expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
};

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0 },
			mutations: { retry: false },
		},
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe("useQrDrawer", () => {
	beforeEach(() => {
		mockGenerateToken.mockResolvedValue(mockGenerateResponse);
		mockFetchTokenStatus.mockResolvedValue({ status: "valid" });
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("starts in idle state", () => {
		const { result } = renderHook(() => useQrDrawer(), { wrapper: createWrapper() });

		expect(result.current.isOpen).toBe(false);
		expect(result.current.token).toBeNull();
		expect(result.current.shareUrl).toBeNull();
		expect(result.current.status).toBe("idle");
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it("generates token on open via useMutation", async () => {
		const { result } = renderHook(() => useQrDrawer(), { wrapper: createWrapper() });

		act(() => {
			result.current.open();
		});

		expect(result.current.isOpen).toBe(true);
		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
			expect(result.current.token).toBe("test-token-123");
			expect(result.current.shareUrl).toBe("http://localhost:3000/relationship/qr/test-token-123");
			expect(result.current.status).toBe("valid");
		});

		expect(mockGenerateToken).toHaveBeenCalledOnce();
	});

	it("sets error and closes on generation failure", async () => {
		mockGenerateToken.mockRejectedValueOnce(new Error("HTTP 500"));

		const { result } = renderHook(() => useQrDrawer(), { wrapper: createWrapper() });

		act(() => {
			result.current.open();
		});

		await waitFor(() => {
			expect(result.current.error).toBe("Failed to generate QR code. Please try again.");
			expect(result.current.isOpen).toBe(false);
		});
	});

	it("resets state on close", async () => {
		const { result } = renderHook(() => useQrDrawer(), { wrapper: createWrapper() });

		act(() => {
			result.current.open();
		});

		await waitFor(() => {
			expect(result.current.token).toBe("test-token-123");
		});

		act(() => {
			result.current.close();
		});

		expect(result.current.isOpen).toBe(false);
		expect(result.current.token).toBeNull();
		expect(result.current.shareUrl).toBeNull();
		expect(result.current.status).toBe("idle");
	});

	it("polls token status via useQuery when drawer is open", async () => {
		mockFetchTokenStatus.mockResolvedValue({ status: "accepted" });

		const { result } = renderHook(() => useQrDrawer(), { wrapper: createWrapper() });

		act(() => {
			result.current.open();
		});

		await waitFor(() => {
			expect(result.current.token).toBe("test-token-123");
		});

		// useQuery should poll and detect "accepted" status
		await waitFor(() => {
			expect(result.current.status).toBe("accepted");
		});
	});

	it("regenerates token when near expiry", async () => {
		// Initial token expires in 50 min (below 55-min threshold)
		const nearExpiryResponse = {
			...mockGenerateResponse,
			expiresAt: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
		};

		const freshResponse = {
			token: "fresh-token-456",
			shareUrl: "http://localhost:3000/relationship/qr/fresh-token-456",
			expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
		};

		mockGenerateToken
			.mockResolvedValueOnce(nearExpiryResponse) // Initial generate
			.mockResolvedValueOnce(freshResponse); // Regeneration during poll

		const { result } = renderHook(() => useQrDrawer(), { wrapper: createWrapper() });

		act(() => {
			result.current.open();
		});

		// useQuery poll should detect near-expiry and regenerate to fresh token
		await waitFor(() => {
			expect(result.current.token).toBe("fresh-token-456");
			expect(result.current.shareUrl).toBe("http://localhost:3000/relationship/qr/fresh-token-456");
		});

		// generateToken should have been called twice (initial + regeneration)
		expect(mockGenerateToken).toHaveBeenCalledTimes(2);
	});
});
