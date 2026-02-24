// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupDefaultMocks } from "./__fixtures__/use-therapist-chat.fixtures";

// Mock the assessment hooks using vi.hoisted to avoid hoisting issues
const { mockMutate, mockResumeSession } = vi.hoisted(() => ({
	mockMutate: vi.fn(),
	mockResumeSession: vi.fn(() => ({
		data: undefined,
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	})),
}));

vi.mock("@/hooks/use-assessment", () => ({
	AssessmentApiError: class AssessmentApiError extends Error {
		status: number;
		details: unknown;

		constructor(status: number, message: string, details: unknown) {
			super(message);
			this.status = status;
			this.details = details;
		}
	},
	useSendMessage: () => ({
		mutate: mockMutate,
		isPending: false,
	}),
	useResumeSession: mockResumeSession,
}));

import { useTherapistChat } from "./useTherapistChat";

describe("useTherapistChat", () => {
	// Advance timers past all greeting stagger delays (0 + 1200 + 2000ms)
	function completeGreetingStagger() {
		act(() => {
			vi.advanceTimersByTime(2500);
		});
	}

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		setupDefaultMocks(mockResumeSession);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("staggers greeting messages for new sessions (0ms / 1200ms / 2000ms)", () => {
		const { result } = renderHook(() => useTherapistChat("session-123"));

		// First greeting message appears immediately (0ms)
		expect(result.current.messages).toHaveLength(1);
		expect(result.current.messages[0].role).toBe("assistant");
		expect(result.current.messages[0].content).toContain("Nerin");

		// Second message at 1200ms
		act(() => {
			vi.advanceTimersByTime(1200);
		});
		expect(result.current.messages).toHaveLength(2);
		expect(result.current.messages[1].role).toBe("assistant");

		// Third message at 2000ms
		act(() => {
			vi.advanceTimersByTime(800);
		});
		expect(result.current.messages).toHaveLength(3);
		expect(result.current.messages[2].role).toBe("assistant");
	});

	it("initializes trait scores at zero", () => {
		const { result } = renderHook(() => useTherapistChat("session-123"));
		completeGreetingStagger();

		expect(result.current.traits.openness).toBe(0);
		expect(result.current.traits.conscientiousness).toBe(0);
	});

	it("adds user message optimistically before API responds", () => {
		const { result } = renderHook(() => useTherapistChat("session-123"));
		completeGreetingStagger();

		act(() => {
			result.current.sendMessage("I love hiking");
		});

		// 3 greeting messages + 1 user message
		expect(result.current.messages).toHaveLength(4);
		expect(result.current.messages[3].role).toBe("user");
		expect(result.current.messages[3].content).toBe("I love hiking");
		expect(result.current.isLoading).toBe(true);
	});

	it("adds assistant message on mutation success", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onSuccess?: (data: unknown) => void }) => {
				callbacks?.onSuccess?.({
					response: "That's fascinating! Tell me more about your outdoor adventures.",
				});
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));
		completeGreetingStagger();

		act(() => {
			result.current.sendMessage("I love hiking");
		});

		// 3 greeting + user message + assistant response = 5
		expect(result.current.messages).toHaveLength(5);
		expect(result.current.messages[4].role).toBe("assistant");
		expect(result.current.messages[4].content).toBe(
			"That's fascinating! Tell me more about your outdoor adventures.",
		);
		expect(result.current.isLoading).toBe(false);
	});

	it("does not update traits from send-message response (Story 2.11: lean response)", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onSuccess?: (data: unknown) => void }) => {
				callbacks?.onSuccess?.({
					response: "Interesting",
				});
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));
		completeGreetingStagger();

		act(() => {
			result.current.sendMessage("I enjoy creative writing");
		});

		// Story 2.11: Traits are only updated from resume-session, not from send-message
		expect(result.current.traits.openness).toBe(0);
		expect(result.current.traits.conscientiousness).toBe(0);
	});

	it("sets error message on API failure", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onError?: (error: Error) => void }) => {
				callbacks?.onError?.(new Error("HTTP 500: Internal Server Error"));
			},
		);

		const { result } = renderHook(() => useTherapistChat("session-123"));
		completeGreetingStagger();

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
		completeGreetingStagger();

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
		completeGreetingStagger();

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
		completeGreetingStagger();

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
		completeGreetingStagger();

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
		completeGreetingStagger();

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
	});

	it("does not send when message is empty", () => {
		const { result } = renderHook(() => useTherapistChat("session-123"));

		act(() => {
			result.current.sendMessage(undefined);
		});

		expect(mockMutate).not.toHaveBeenCalled();
	});

	// Story 2.11: Message-count-based progress (replaces confidence-based celebration)
	describe("Message Count Progress", () => {
		it("sets isConfidenceReady when user message count reaches threshold (25)", () => {
			// Simulate a resumed session with 24 user messages + 24 assistant messages
			const existingMessages = Array.from({ length: 48 }, (_, i) => ({
				role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
				content: `Message ${i + 1}`,
				timestamp: new Date(Date.now() - (48 - i) * 60000).toISOString(),
			}));

			mockResumeSession.mockReturnValue({
				data: {
					messages: existingMessages,
					confidence: {
						openness: 0,
						conscientiousness: 0,
						extraversion: 0,
						agreeableness: 0,
						neuroticism: 0,
					},
				},
				isLoading: false,
				error: null,
				refetch: vi.fn(),
			});

			mockMutate.mockImplementation(
				(_input: unknown, callbacks: { onSuccess?: (data: unknown) => void }) => {
					callbacks?.onSuccess?.({ response: "Great!" });
				},
			);

			const { result } = renderHook(() => useTherapistChat("session-123"));

			// Already 24 user messages, send one more to reach 25
			act(() => {
				result.current.sendMessage("25th user message");
			});

			expect(result.current.isConfidenceReady).toBe(true);
		});

		it("does not set isConfidenceReady when user message count is below threshold", () => {
			const { result } = renderHook(() => useTherapistChat("session-123"));
			completeGreetingStagger();

			mockMutate.mockImplementation(
				(_input: unknown, callbacks: { onSuccess?: (data: unknown) => void }) => {
					callbacks?.onSuccess?.({ response: "Good!" });
				},
			);

			act(() => {
				result.current.sendMessage("Test message");
			});

			// Only 1 user message — well below threshold of 25
			expect(result.current.isConfidenceReady).toBe(false);
		});

		it("exposes progressPercent based on message count", () => {
			const { result } = renderHook(() => useTherapistChat("session-123"));
			completeGreetingStagger();

			// No user messages → 0%
			expect(result.current.progressPercent).toBe(0);
		});
	});
});
