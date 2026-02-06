// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the assessment hooks
const mockMutate = vi.fn();
vi.mock("@/hooks/use-assessment", () => ({
	useSendMessage: () => ({
		mutate: mockMutate,
		isPending: false,
	}),
}));

import { useTherapistChat } from "./useTherapistChat";

describe("useTherapistChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("initializes with Nerin greeting message", () => {
		const { result } = renderHook(() => useTherapistChat("session-123"));

		expect(result.current.messages).toHaveLength(1);
		expect(result.current.messages[0].role).toBe("assistant");
		expect(result.current.messages[0].content).toContain("Nerin");
	});

	it("initializes trait scores at zero", () => {
		const { result } = renderHook(() => useTherapistChat("session-123"));

		expect(result.current.traits.openness).toBe(0);
		expect(result.current.traits.conscientiousness).toBe(0);
		expect(result.current.traits.opennessPrecision).toBe(0);
	});

	it("adds user message optimistically before API responds", () => {
		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage("I love hiking");
		});

		// User message should appear immediately (optimistic)
		expect(result.current.messages).toHaveLength(2);
		expect(result.current.messages[1].role).toBe("user");
		expect(result.current.messages[1].content).toBe("I love hiking");
		expect(result.current.isLoading).toBe(true);
	});

	it("adds assistant message on mutation success", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onSuccess?: (data: unknown) => void }) => {
				callbacks?.onSuccess?.({
					response: "That's fascinating! Tell me more about your outdoor adventures.",
					precision: {
						openness: 65,
						conscientiousness: 55,
						extraversion: 60,
						agreeableness: 50,
						neuroticism: 40,
					},
				});
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage("I love hiking");
		});

		// Should have: initial greeting + user message + assistant response
		expect(result.current.messages).toHaveLength(3);
		expect(result.current.messages[2].role).toBe("assistant");
		expect(result.current.messages[2].content).toBe(
			"That's fascinating! Tell me more about your outdoor adventures.",
		);
		expect(result.current.isLoading).toBe(false);
	});

	it("updates trait scores from API precision response", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onSuccess?: (data: unknown) => void }) => {
				callbacks?.onSuccess?.({
					response: "Interesting",
					precision: {
						openness: 72,
						conscientiousness: 48,
						extraversion: 65,
						agreeableness: 53,
						neuroticism: 35,
					},
				});
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage("I enjoy creative writing");
		});

		expect(result.current.traits.openness).toBe(72);
		expect(result.current.traits.conscientiousness).toBe(48);
		expect(result.current.traits.opennessPrecision).toBe(72);
		expect(result.current.traits.conscientiousnessPrecision).toBe(48);
		expect(result.current.traits.extraversionPrecision).toBe(65);
	});

	it("sets error message on API failure", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onError?: (error: Error) => void }) => {
				callbacks?.onError?.(new Error("HTTP 500: Internal Server Error"));
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage("Hello");
		});

		expect(result.current.errorMessage).toBe("HTTP 500: Internal Server Error");
		expect(result.current.errorType).toBe("generic");
		expect(result.current.isLoading).toBe(false);
	});

	it("parses SessionNotFound error and sets session type", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onError?: (error: Error) => void }) => {
				callbacks?.onError?.(new Error("HTTP 404: SessionNotFound"));
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage("Hello");
		});

		expect(result.current.errorType).toBe("session");
		expect(result.current.errorMessage).toContain("Session not found");
	});

	it("parses budget/cost error and sets budget type", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onError?: (error: Error) => void }) => {
				callbacks?.onError?.(new Error("HTTP 503: BudgetPaused"));
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage("Hello");
		});

		expect(result.current.errorType).toBe("budget");
		expect(result.current.errorMessage).toContain("budget");
	});

	it("parses rate limit error", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onError?: (error: Error) => void }) => {
				callbacks?.onError?.(new Error("HTTP 429: RateLimit exceeded"));
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage("Hello");
		});

		expect(result.current.errorType).toBe("rate-limit");
		expect(result.current.errorMessage).toContain("already started an assessment today");
	});

	it("parses network error", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onError?: (error: Error) => void }) => {
				callbacks?.onError?.(new Error("Failed to fetch"));
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage("Hello");
		});

		expect(result.current.errorType).toBe("network");
		expect(result.current.errorMessage).toContain("Connection lost");
	});

	it("clears error when clearError is called", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onError?: (error: Error) => void }) => {
				callbacks?.onError?.(new Error("Some error"));
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage("Hello");
		});

		expect(result.current.errorMessage).toBeTruthy();

		act(() => {
			result.current.clearError();
		});

		expect(result.current.errorMessage).toBeNull();
		expect(result.current.errorType).toBeNull();
	});

	it("does not send when sessionId is empty", () => {
		const { result } = renderHook(() => useTherapistChat(""));

		act(() => {
			result.current.sendMessage("Hello");
		});

		expect(mockMutate).not.toHaveBeenCalled();
		expect(result.current.messages).toHaveLength(1); // Only initial greeting
	});

	it("does not send when message is empty", () => {
		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage(undefined);
		});

		expect(mockMutate).not.toHaveBeenCalled();
	});
});
