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
});
