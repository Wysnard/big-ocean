// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Effect } from "effect";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	SERVER_GREETING_MESSAGES,
	setupDefaultMocks,
} from "./__fixtures__/use-therapist-chat.fixtures";

// ── Mocks ────────────────────────────────────────────────────────────────────

// Mock sonner toast so we can assert error handling
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
	toast: {
		error: (...args: unknown[]) => mockToastError(...args),
	},
}));

// Controllable sendMessage mock — returns the value that the Effect will resolve/reject with
let sendMessageMock: vi.Mock;

vi.mock("@/lib/api-client", () => ({
	makeApiClient: Effect.succeed({
		assessment: {
			sendMessage: (opts: { payload: { sessionId: string; message: string } }) =>
				Effect.tryPromise({
					try: () => sendMessageMock(opts.payload),
					catch: (e) => e, // preserve original error
				}),
			resumeSession: () =>
				Effect.succeed({
					messages: SERVER_GREETING_MESSAGES,
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

// We still need to mock use-assessment for useResumeSession (the hook uses it)
const { mockResumeSession } = vi.hoisted(() => ({
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
	useResumeSession: mockResumeSession,
}));

import { useTherapistChat } from "./useTherapistChat";

// Fresh QueryClient per test to avoid cache leaks
let queryClient: QueryClient;
let wrapper: ({ children }: { children: ReactNode }) => ReactNode;

function makeDefaultResumeData(
	overrides: {
		messages?: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
		confidence?: Record<string, number>;
		freeTierMessageThreshold?: number;
		status?: string;
	} = {},
) {
	return {
		messages: overrides.messages ?? SERVER_GREETING_MESSAGES,
		confidence: overrides.confidence ?? {
			openness: 0,
			conscientiousness: 0,
			extraversion: 0,
			agreeableness: 0,
			neuroticism: 0,
		},
		freeTierMessageThreshold: overrides.freeTierMessageThreshold ?? 25,
		status: overrides.status ?? "active",
	};
}

/** Seed both the mock and the query cache so optimistic updates work */
function seedSession(sessionId: string, data: ReturnType<typeof makeDefaultResumeData>) {
	mockResumeSession.mockReturnValue({
		data,
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	});
	queryClient.setQueryData(["assessment", "session", sessionId], data);
}

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}

describe("useTherapistChat", () => {
	describe("greeting stagger (fake timers)", () => {
		beforeEach(() => {
			vi.clearAllMocks();
			vi.useFakeTimers();
			sendMessageMock = vi.fn().mockResolvedValue({ response: "OK", isFinalTurn: false });
			queryClient = createQueryClient();
			wrapper = ({ children }: { children: ReactNode }) =>
				createElement(QueryClientProvider, { client: queryClient }, children);
			seedSession("session-123", makeDefaultResumeData());
			setupDefaultMocks(mockResumeSession);
			seedSession("session-123", makeDefaultResumeData());
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("staggers greeting messages for new sessions (0ms / 800ms)", () => {
			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			expect(result.current.messages).toHaveLength(1);
			expect(result.current.messages[0].role).toBe("assistant");
			expect(result.current.messages[0].content).toContain("Nerin");

			act(() => {
				vi.advanceTimersByTime(800);
			});
			expect(result.current.messages).toHaveLength(2);
			expect(result.current.messages[1].role).toBe("assistant");
		});

		it("initializes trait scores at zero", () => {
			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });
			act(() => {
				vi.advanceTimersByTime(1000);
			});

			expect(result.current.traits.openness).toBe(0);
			expect(result.current.traits.conscientiousness).toBe(0);
		});

		it("does not send when sessionId is empty", () => {
			const { result } = renderHook(() => useTherapistChat(""), { wrapper });

			act(() => {
				result.current.sendMessage("Hello");
			});

			expect(sendMessageMock).not.toHaveBeenCalled();
		});

		it("does not send when message is empty", () => {
			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			act(() => {
				result.current.sendMessage(undefined);
			});

			expect(sendMessageMock).not.toHaveBeenCalled();
		});
	});

	describe("mutation behavior (real timers)", () => {
		beforeEach(() => {
			vi.clearAllMocks();
			sendMessageMock = vi.fn().mockResolvedValue({ response: "OK", isFinalTurn: false });
			queryClient = createQueryClient();
			wrapper = ({ children }: { children: ReactNode }) =>
				createElement(QueryClientProvider, { client: queryClient }, children);
			// Use an existing conversation (not new session) to skip greeting stagger
			const existingConversation = makeDefaultResumeData({
				messages: [
					...SERVER_GREETING_MESSAGES,
					{ role: "user" as const, content: "I like hiking", timestamp: "2026-02-01T10:01:00Z" },
					{ role: "assistant" as const, content: "Tell me more!", timestamp: "2026-02-01T10:01:30Z" },
				],
			});
			seedSession("session-123", existingConversation);
		});

		it("adds user message optimistically before API responds", async () => {
			// Delay resolution so we can observe the optimistic state
			let resolveMessage!: (val: unknown) => void;
			sendMessageMock.mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveMessage = resolve;
					}),
			);

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			expect(result.current.messages).toHaveLength(4);

			await act(async () => {
				result.current.sendMessage("I love hiking");
			});

			// The mutation writes the user message to the query cache via onMutate
			const cached = queryClient.getQueryData<{
				messages: Array<{ role: string; content: string }>;
			}>(["assessment", "session", "session-123"]);
			expect(cached?.messages).toHaveLength(5);
			expect(cached?.messages[4].role).toBe("user");
			expect(cached?.messages[4].content).toBe("I love hiking");

			// Clean up: resolve the pending promise to avoid hanging
			await act(async () => {
				resolveMessage({ response: "OK", isFinalTurn: false });
			});
		});

		it("adds assistant message on mutation success", async () => {
			sendMessageMock.mockResolvedValue({
				response: "That's fascinating! Tell me more about your outdoor adventures.",
				isFinalTurn: false,
			});

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			await act(async () => {
				result.current.sendMessage("I love hiking");
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			const cached = queryClient.getQueryData<{
				messages: Array<{ role: string; content: string }>;
			}>(["assessment", "session", "session-123"]);
			// 4 existing + 1 user (optimistic) + 1 assistant (onSuccess) = 6
			expect(cached?.messages).toHaveLength(6);
			expect(cached?.messages[5].role).toBe("assistant");
			expect(cached?.messages[5].content).toBe(
				"That's fascinating! Tell me more about your outdoor adventures.",
			);
		});

		it("does not update traits from send-message response (Story 2.11: lean response)", async () => {
			sendMessageMock.mockResolvedValue({ response: "Interesting", isFinalTurn: false });

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			await act(async () => {
				result.current.sendMessage("I enjoy creative writing");
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.traits.openness).toBe(0);
			expect(result.current.traits.conscientiousness).toBe(0);
		});

		it("shows toast error on API failure", async () => {
			sendMessageMock.mockRejectedValue(new Error("HTTP 500: Internal Server Error"));

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			await act(async () => {
				result.current.sendMessage("Hello");
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(mockToastError).toHaveBeenCalledWith(
				"HTTP 500: Internal Server Error",
				expect.any(Object),
			);
		});

		it("parses SessionNotFound error and shows session toast", async () => {
			sendMessageMock.mockRejectedValue(new Error("HTTP 404: SessionNotFound"));

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			await act(async () => {
				result.current.sendMessage("Hello");
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(mockToastError).toHaveBeenCalledWith(
				expect.stringContaining("Session not found"),
				expect.any(Object),
			);
		});

		it("parses budget/cost error and shows budget toast", async () => {
			sendMessageMock.mockRejectedValue(new Error("HTTP 503: BudgetPaused"));

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			await act(async () => {
				result.current.sendMessage("Hello");
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(mockToastError).toHaveBeenCalledWith(
				expect.stringContaining("budget"),
				expect.any(Object),
			);
		});

		it("parses rate limit error", async () => {
			sendMessageMock.mockRejectedValue(new Error("HTTP 429: RateLimit exceeded"));

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			await act(async () => {
				result.current.sendMessage("Hello");
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(mockToastError).toHaveBeenCalledWith(
				expect.stringContaining("already started an assessment today"),
				expect.any(Object),
			);
		});

		it("parses network error", async () => {
			sendMessageMock.mockRejectedValue(new Error("Failed to fetch"));

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			await act(async () => {
				result.current.sendMessage("Hello");
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(mockToastError).toHaveBeenCalledWith(
				expect.stringContaining("Connection lost"),
				expect.any(Object),
			);
		});

		it("rolls back optimistic update on error", async () => {
			sendMessageMock.mockRejectedValue(new Error("Failed to fetch"));

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			await act(async () => {
				result.current.sendMessage("Hello");
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			const cached = queryClient.getQueryData<{
				messages: Array<{ role: string; content: string }>;
			}>(["assessment", "session", "session-123"]);
			expect(cached?.messages).toHaveLength(4);
		});
	});

	// Story 2.11: Message-count-based progress (replaces confidence-based celebration)
	describe("Message Count Progress", () => {
		beforeEach(() => {
			vi.clearAllMocks();
			sendMessageMock = vi.fn().mockResolvedValue({ response: "OK", isFinalTurn: false });
			queryClient = createQueryClient();
			wrapper = ({ children }: { children: ReactNode }) =>
				createElement(QueryClientProvider, { client: queryClient }, children);
		});

		it("sets isConfidenceReady when user message count reaches threshold (25)", () => {
			// Simulate a resumed session with 25 user messages + 25 assistant messages = 50
			const existingMessages = Array.from({ length: 50 }, (_, i) => ({
				role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
				content: `Message ${i + 1}`,
				timestamp: new Date(Date.now() - (50 - i) * 60000).toISOString(),
			}));

			seedSession("session-123", makeDefaultResumeData({ messages: existingMessages }));

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			expect(result.current.isConfidenceReady).toBe(true);
		});

		it("does not set isConfidenceReady when user message count is below threshold", () => {
			seedSession("session-123", makeDefaultResumeData());

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			// Only greeting messages (0 user messages) — well below threshold of 25
			expect(result.current.isConfidenceReady).toBe(false);
		});

		it("exposes progressPercent based on message count", () => {
			seedSession("session-123", makeDefaultResumeData());

			const { result } = renderHook(() => useTherapistChat("session-123"), { wrapper });

			// No user messages → 0%
			expect(result.current.progressPercent).toBe(0);
		});
	});
});
