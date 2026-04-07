// @vitest-environment jsdom

/**
 * useTherapistChat — Network error and retry tests (Story 31-5)
 *
 * Verifies that errors are surfaced via toast, cache is rolled back,
 * and the toast action allows retrying the failed message.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockToastError = vi.fn();
vi.mock("sonner", () => ({
	toast: {
		error: (...args: unknown[]) => mockToastError(...args),
	},
}));

let sendMessageMock: vi.Mock;

vi.mock("@/lib/api-client", () => ({
	makeApiClient: Effect.succeed({
		conversation: {
			sendMessage: (opts: { payload: { sessionId: string; message: string } }) =>
				Effect.tryPromise({
					try: () => sendMessageMock(opts.payload),
					catch: (e) => e, // preserve original error for parseApiError
				}),
			resumeSession: () =>
				Effect.succeed({
					messages: [],
					confidence: {
						openness: 0,
						conscientiousness: 0,
						extraversion: 0,
						agreeableness: 0,
						neuroticism: 0,
					},
					freeTierMessageThreshold: 25,
					status: "active",
				}),
		},
	}),
}));

const { mockResumeSession } = vi.hoisted(() => ({
	mockResumeSession: vi.fn(() => ({
		data: undefined,
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	})),
}));

vi.mock("@/hooks/use-conversation", () => ({
	ConversationApiError: class ConversationApiError extends Error {
		status: number;
		details: unknown;

		constructor(status: number, message: string, details: unknown) {
			super(message);
			this.status = status;
			this.details = details;
		}
	},
	useResumeSession: mockResumeSession,
}));

import { useTherapistChat } from "./useTherapistChat";

let queryClient: QueryClient;
let wrapper: ({ children }: { children: ReactNode }) => ReactNode;

describe("useTherapistChat — Network error retry (Story 31-5)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sendMessageMock = vi.fn().mockResolvedValue({ response: "OK", isFinalTurn: false });
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		wrapper = ({ children }: { children: ReactNode }) =>
			createElement(QueryClientProvider, { client: queryClient }, children);
	});

	it("rolls back cache and shows toast after network error", async () => {
		const existingMessages = [
			{ role: "assistant" as const, content: "Hi there!", timestamp: "2026-01-01T00:00:00Z" },
			{ role: "user" as const, content: "Hello", timestamp: "2026-01-01T00:01:00Z" },
			{ role: "assistant" as const, content: "How are you?", timestamp: "2026-01-01T00:02:00Z" },
		];

		const resumeData = {
			messages: existingMessages,
			confidence: {
				openness: 50,
				conscientiousness: 50,
				extraversion: 50,
				agreeableness: 50,
				neuroticism: 50,
			},
			freeTierMessageThreshold: 25,
			status: "active",
		};

		mockResumeSession.mockReturnValue({
			data: resumeData,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		queryClient.setQueryData(["conversation", "session", "session-123"], resumeData);

		const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

		expect(result.current.messages).toHaveLength(3);

		sendMessageMock.mockRejectedValue(new Error("Failed to fetch"));

		await act(async () => {
			result.current.sendMessage("My unsent message");
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		// Error should be surfaced via toast
		expect(mockToastError).toHaveBeenCalledWith(
			expect.stringContaining("Connection lost"),
			expect.any(Object),
		);

		// Cache should be rolled back (optimistic user message removed)
		const cached = queryClient.getQueryData<{
			messages: Array<{ role: string; content: string }>;
		}>(["conversation", "session", "session-123"]);
		expect(cached?.messages).toHaveLength(3);
	});

	it("toast action allows retry of the failed message", async () => {
		const resumeData = {
			messages: [{ role: "assistant" as const, content: "Hi!", timestamp: "2026-01-01T00:00:00Z" }],
			confidence: {
				openness: 50,
				conscientiousness: 50,
				extraversion: 50,
				agreeableness: 50,
				neuroticism: 50,
			},
			freeTierMessageThreshold: 25,
			status: "active",
		};

		mockResumeSession.mockReturnValue({
			data: resumeData,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		queryClient.setQueryData(["conversation", "session", "session-123"], resumeData);

		const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

		// First send fails
		sendMessageMock.mockRejectedValue(new Error("Failed to fetch"));

		await act(async () => {
			result.current.sendMessage("Retry me");
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(mockToastError).toHaveBeenCalled();

		// The toast should include a retry action
		const toastCall = mockToastError.mock.calls[0];
		const toastOpts = toastCall[1] as { action?: { label: string; onClick: () => void } };
		expect(toastOpts.action).toBeDefined();
		expect(toastOpts.action?.label).toBe("Retry");

		// Now make the retry succeed
		sendMessageMock.mockResolvedValue({ response: "Nerin responds", isFinalTurn: false });

		await act(async () => {
			toastOpts.action?.onClick();
		});

		// The retry should have called sendMessage again
		expect(sendMessageMock).toHaveBeenCalledTimes(2);
	});

	it("shows correct progress after resume", () => {
		const msgs = [];
		for (let i = 0; i < 10; i++) {
			msgs.push({
				role: i % 2 === 0 ? ("assistant" as const) : ("user" as const),
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
