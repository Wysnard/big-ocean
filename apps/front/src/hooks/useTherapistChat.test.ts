// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

/**
 * Simulates the 3 greeting messages that the backend now persists during startAssessment.
 * These are returned by the resume endpoint for new sessions.
 */
const SERVER_GREETING_MESSAGES = [
	{
		role: "assistant" as const,
		content:
			"Hey there! I'm Nerin — I'm here to help you understand your personality through conversation. No multiple choice, no right answers, just us talking.",
		timestamp: "2026-02-01T10:00:00Z",
	},
	{
		role: "assistant" as const,
		content:
			"Here's the thing: the more openly and honestly you share, the more accurate and meaningful your insights will be. This is a judgment-free space — be as real as you'd like. The honest answer, even if it's messy or contradictory, is always more valuable than the polished one.",
		timestamp: "2026-02-01T10:00:01Z",
	},
	{
		role: "assistant" as const,
		content: "If your closest friend described you in three words, what would they say?",
		timestamp: "2026-02-01T10:00:02Z",
	},
];

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

		// Mock matchMedia for greeting stagger reduced-motion detection
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});

		// Default mock: new session with 3 server-persisted greeting messages
		mockResumeSession.mockReturnValue({
			data: {
				messages: SERVER_GREETING_MESSAGES,
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
		expect(result.current.traits.opennessConfidence).toBe(0);
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

	// Task 1 Tests: Session Resume Integration
	describe("Session Resume", () => {
		it("loads messages from resume API response", () => {
			mockResumeSession.mockReturnValue({
				data: {
					messages: [
						{ role: "assistant", content: "Hi!", timestamp: "2026-01-01T00:00:00Z" },
						{ role: "user", content: "Hello", timestamp: "2026-01-01T00:01:00Z" },
					],
					confidence: {
						openness: 65,
						conscientiousness: 55,
						extraversion: 60,
						agreeableness: 50,
						neuroticism: 40,
					},
				},
				isLoading: false,
				error: null,
				refetch: vi.fn(),
			});

			const { result } = renderHook(() => useTherapistChat("session-123"));

			// Should load messages from resume response
			expect(result.current.messages).toHaveLength(2);
			expect(result.current.messages[0].role).toBe("assistant");
			expect(result.current.messages[0].content).toBe("Hi!");
			expect(result.current.messages[1].role).toBe("user");
			expect(result.current.messages[1].content).toBe("Hello");
		});

		it("maps server messages to local Message type with generated IDs", () => {
			mockResumeSession.mockReturnValue({
				data: {
					messages: [{ role: "assistant", content: "Hi!", timestamp: "2026-01-01T00:00:00Z" }],
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

			const { result } = renderHook(() => useTherapistChat("session-123"));

			// Should have generated ID from index
			expect(result.current.messages[0].id).toBe("msg-resume-0");
			expect(result.current.messages[0].timestamp).toBeInstanceOf(Date);
		});

		it("loads confidence scores correctly without multiplication", () => {
			mockResumeSession.mockReturnValue({
				data: {
					messages: [{ role: "assistant", content: "Hi!", timestamp: "2026-01-01T00:00:00Z" }],
					confidence: {
						openness: 72,
						conscientiousness: 48,
						extraversion: 65,
						agreeableness: 53,
						neuroticism: 35,
					},
				},
				isLoading: false,
				error: null,
				refetch: vi.fn(),
			});

			const { result } = renderHook(() => useTherapistChat("session-123"));

			// Confidence values are already 0-100, do NOT multiply
			expect(result.current.traits.openness).toBe(72);
			expect(result.current.traits.conscientiousness).toBe(48);
			expect(result.current.traits.extraversion).toBe(65);
			expect(result.current.traits.opennessConfidence).toBe(72);
		});

		it("loads server greeting messages for new session after stagger completes", () => {
			// Default mock already has greeting messages — verify they all load after stagger
			const { result } = renderHook(() => useTherapistChat("session-123"));
			completeGreetingStagger();

			expect(result.current.messages).toHaveLength(3);
			expect(result.current.messages[0].content).toContain("Nerin");
		});

		it("sets empty messages when resume returns empty array", () => {
			mockResumeSession.mockReturnValue({
				data: {
					messages: [],
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

			const { result } = renderHook(() => useTherapistChat("session-123"));

			// With server-side greetings, empty means empty (edge case — shouldn't happen in practice)
			expect(result.current.messages).toHaveLength(0);
		});

		it("skips Nerin greeting for existing session (has messages)", () => {
			mockResumeSession.mockReturnValue({
				data: {
					messages: [
						{ role: "assistant", content: "Previous message", timestamp: "2026-01-01T00:00:00Z" },
					],
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

			const { result } = renderHook(() => useTherapistChat("session-123"));

			// Should NOT show default greeting, use server messages
			expect(result.current.messages).toHaveLength(1);
			expect(result.current.messages[0].content).toBe("Previous message");
			expect(result.current.messages[0].content).not.toContain("Nerin");
		});

		it("exposes isResuming state from useResumeSession", () => {
			mockResumeSession.mockReturnValue({
				data: undefined,
				isLoading: true,
				error: null,
				refetch: vi.fn(),
			});

			const { result } = renderHook(() => useTherapistChat("session-123"));

			expect(result.current.isResuming).toBe(true);
		});

		it("exposes resumeError when SessionNotFound", () => {
			mockResumeSession.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: new Error("HTTP 404: SessionNotFound"),
				refetch: vi.fn(),
			});

			const { result } = renderHook(() => useTherapistChat("session-123"));

			expect(result.current.resumeError).toEqual(new Error("HTTP 404: SessionNotFound"));
		});
	});

	// Story 2.11: Message-count-based progress (replaces confidence-based celebration)
	describe("Message Count Progress", () => {
		it("sets isConfidenceReady when user message count reaches threshold (15)", () => {
			// Simulate a resumed session with 14 user messages + 14 assistant messages
			const existingMessages = Array.from({ length: 28 }, (_, i) => ({
				role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
				content: `Message ${i + 1}`,
				timestamp: new Date(Date.now() - (28 - i) * 60000).toISOString(),
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

			// Already 14 user messages, send one more to reach 15
			act(() => {
				result.current.sendMessage("15th user message");
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

			// Only 1 user message — well below threshold of 15
			expect(result.current.isConfidenceReady).toBe(false);
		});

		it("exposes hasShownCelebration state", () => {
			const { result } = renderHook(() => useTherapistChat("session-123"));

			expect(result.current.hasShownCelebration).toBe(false);
		});

		it("allows dismissing celebration via setHasShownCelebration", () => {
			// Simulate a resumed session with enough messages to trigger celebration
			const existingMessages = Array.from({ length: 30 }, (_, i) => ({
				role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
				content: `Message ${i + 1}`,
				timestamp: new Date(Date.now() - (30 - i) * 60000).toISOString(),
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

			const { result } = renderHook(() => useTherapistChat("session-123"));

			expect(result.current.isConfidenceReady).toBe(true);
			expect(result.current.hasShownCelebration).toBe(false);

			act(() => {
				result.current.setHasShownCelebration(true);
			});

			expect(result.current.hasShownCelebration).toBe(true);
		});

		it("exposes progressPercent based on message count", () => {
			const { result } = renderHook(() => useTherapistChat("session-123"));
			completeGreetingStagger();

			// No user messages → 0%
			expect(result.current.progressPercent).toBe(0);
		});
	});
});
