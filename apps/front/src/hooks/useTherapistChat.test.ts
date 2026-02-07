// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
	useSendMessage: () => ({
		mutate: mockMutate,
		isPending: false,
	}),
	useResumeSession: mockResumeSession,
}));

import { useTherapistChat } from "./useTherapistChat";

describe("useTherapistChat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default mock: empty session (new session with greeting)
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
		expect(result.current.traits.opennessConfidence).toBe(0);
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
					confidence: {
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

	it("updates trait scores from API confidence response", () => {
		mockMutate.mockImplementation(
			(_input: unknown, callbacks: { onSuccess?: (data: unknown) => void }) => {
				callbacks?.onSuccess?.({
					response: "Interesting",
					confidence: {
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
		expect(result.current.traits.opennessConfidence).toBe(72);
		expect(result.current.traits.conscientiousnessConfidence).toBe(48);
		expect(result.current.traits.extraversionConfidence).toBe(65);
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
					messages: [],
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

		it("shows Nerin greeting for new session (empty messages)", () => {
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

			// Should show default Nerin greeting for new session
			expect(result.current.messages).toHaveLength(1);
			expect(result.current.messages[0].content).toContain("Nerin");
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

	// Task 4 Tests: Celebration Overlay (70%+ Confidence)
	describe("70% Celebration", () => {
		it("sets isConfidenceReady when average confidence reaches 70%", () => {
			mockMutate.mockImplementation(
				(_input: unknown, callbacks: { onSuccess?: (data: unknown) => void }) => {
					callbacks?.onSuccess?.({
						response: "Great!",
						confidence: {
							openness: 72,
							conscientiousness: 68,
							extraversion: 75,
							agreeableness: 70,
							neuroticism: 65,
						},
					});
				},
			);

			const { result } = renderHook(() => useTherapistChat("session-123"));

			act(() => {
				result.current.sendMessage("Test message");
			});

			// Average = (72 + 68 + 75 + 70 + 65) / 5 = 70
			expect(result.current.isConfidenceReady).toBe(true);
		});

		it("does not set isConfidenceReady when average confidence is below 70%", () => {
			mockMutate.mockImplementation(
				(_input: unknown, callbacks: { onSuccess?: (data: unknown) => void }) => {
					callbacks?.onSuccess?.({
						response: "Good!",
						confidence: {
							openness: 60,
							conscientiousness: 65,
							extraversion: 70,
							agreeableness: 68,
							neuroticism: 62,
						},
					});
				},
			);

			const { result } = renderHook(() => useTherapistChat("session-123"));

			act(() => {
				result.current.sendMessage("Test message");
			});

			// Average = (60 + 65 + 70 + 68 + 62) / 5 = 65
			expect(result.current.isConfidenceReady).toBe(false);
		});

		it("exposes hasShownCelebration state", () => {
			const { result } = renderHook(() => useTherapistChat("session-123"));

			expect(result.current.hasShownCelebration).toBe(false);
		});

		it("allows dismissing celebration via setHasShownCelebration", () => {
			mockMutate.mockImplementation(
				(_input: unknown, callbacks: { onSuccess?: (data: unknown) => void }) => {
					callbacks?.onSuccess?.({
						response: "Great!",
						confidence: {
							openness: 80,
							conscientiousness: 75,
							extraversion: 85,
							agreeableness: 78,
							neuroticism: 72,
						},
					});
				},
			);

			const { result } = renderHook(() => useTherapistChat("session-123"));

			act(() => {
				result.current.sendMessage("Test message");
			});

			expect(result.current.isConfidenceReady).toBe(true);
			expect(result.current.hasShownCelebration).toBe(false);

			act(() => {
				result.current.setHasShownCelebration(true);
			});

			expect(result.current.hasShownCelebration).toBe(true);
		});
	});
});
