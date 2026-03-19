// @vitest-environment jsdom

/**
 * useTherapistChat — Network error retry tests (Story 31-5)
 *
 * Verifies that unsent messages are preserved and retryable after network errors.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupDefaultMocks } from "./__fixtures__/use-therapist-chat.fixtures";

// Mock the assessment hooks
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

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) =>
	createElement(QueryClientProvider, { client: queryClient }, children);

describe("useTherapistChat — Network error retry (Story 31-5)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		setupDefaultMocks(mockResumeSession);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("preserves user message in messages array after network error", async () => {
		// Setup with an existing conversation (not a new session)
		mockResumeSession.mockReturnValue({
			data: {
				messages: [
					{ role: "assistant", content: "Hi there!", timestamp: "2026-01-01T00:00:00Z" },
					{ role: "user", content: "Hello", timestamp: "2026-01-01T00:01:00Z" },
					{ role: "assistant", content: "How are you?", timestamp: "2026-01-01T00:02:00Z" },
				],
				confidence: {
					openness: 50,
					conscientiousness: 50,
					extraversion: 50,
					agreeableness: 50,
					neuroticism: 50,
				},
				freeTierMessageThreshold: 25,
			},
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

		expect(result.current.messages).toHaveLength(3);

		// Send a message that will fail
		mockMutate.mockImplementation((_input: unknown, opts: { onError: (err: Error) => void }) => {
			opts.onError(new Error("Failed to fetch"));
		});

		await act(async () => {
			await result.current.sendMessage("My unsent message");
		});

		// User message should still be in messages (optimistic update)
		expect(result.current.messages).toHaveLength(4);
		expect(result.current.messages[3].content).toBe("My unsent message");
		expect(result.current.messages[3].role).toBe("user");

		// Error should be set
		expect(result.current.errorMessage).toBeTruthy();
		expect(result.current.errorType).toBe("network");
	});

	it("retryLastMessage re-sends the failed message", async () => {
		mockResumeSession.mockReturnValue({
			data: {
				messages: [
					{ role: "assistant", content: "Hi!", timestamp: "2026-01-01T00:00:00Z" },
				],
				confidence: {
					openness: 50,
					conscientiousness: 50,
					extraversion: 50,
					agreeableness: 50,
					neuroticism: 50,
				},
				freeTierMessageThreshold: 25,
			},
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

		// First send fails
		mockMutate.mockImplementation((_input: unknown, opts: { onError: (err: Error) => void }) => {
			opts.onError(new Error("Failed to fetch"));
		});

		await act(async () => {
			await result.current.sendMessage("Retry me");
		});

		expect(result.current.errorMessage).toBeTruthy();

		// Now retry succeeds
		mockMutate.mockImplementation(
			(_input: unknown, opts: { onSuccess: (data: { response: string; isFinalTurn: boolean }) => void }) => {
				opts.onSuccess({ response: "Nerin responds", isFinalTurn: false });
			},
		);

		await act(async () => {
			result.current.retryLastMessage();
		});

		// The retry should have called sendMessageMutate with the same message
		expect(mockMutate).toHaveBeenCalledTimes(2);
	});

	it("shows correct progress after resume", () => {
		// 5 user messages in a 25-turn conversation = 20%
		const msgs = [];
		for (let i = 0; i < 10; i++) {
			msgs.push({
				role: i % 2 === 0 ? "assistant" : "user",
				content: `Message ${i}`,
				timestamp: "2026-01-01T00:00:00Z",
			});
		}

		mockResumeSession.mockReturnValue({
			data: {
				messages: msgs,
				confidence: {
					openness: 60,
					conscientiousness: 55,
					extraversion: 50,
					agreeableness: 45,
					neuroticism: 40,
				},
				freeTierMessageThreshold: 25,
			},
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});

		const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

		// 5 user messages out of 25 = 20%
		expect(result.current.progressPercent).toBe(20);
		expect(result.current.freeTierMessageThreshold).toBe(25);
	});
});
