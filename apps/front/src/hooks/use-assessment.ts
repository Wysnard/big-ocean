/**
 * Assessment HTTP Hooks
 *
 * React hooks for type-safe assessment operations using TanStack Query.
 * Uses direct HTTP calls to backend assessment endpoints.
 */

import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import type {
	GetResultsResponse,
	ListSessionsResponse,
	ResumeSessionResponse,
	SendMessageRequest,
	SendMessageResponse,
	StartAssessmentRequest,
	StartAssessmentResponse,
} from "@workspace/contracts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export class AssessmentApiError extends Error {
	readonly status: number;
	readonly details: unknown;

	constructor(status: number, message: string, details: unknown) {
		super(message);
		this.name = "AssessmentApiError";
		this.status = status;
		this.details = details;
	}
}

export const isAssessmentApiError = (error: unknown): error is AssessmentApiError =>
	error instanceof AssessmentApiError;

const getErrorMessage = (details: unknown, status: number, statusText: string): string => {
	if (typeof details === "object" && details !== null && "message" in details) {
		const message = (details as { message?: unknown }).message;
		if (typeof message === "string" && message.length > 0) {
			return message;
		}
	}

	return `HTTP ${status}: ${statusText}`;
};

/**
 * HTTP client for assessment endpoints
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
		credentials: "include", // Include cookies for auth
	});

	if (!response.ok) {
		const error = await response.json().catch(() => null);
		throw new AssessmentApiError(
			response.status,
			getErrorMessage(error, response.status, response.statusText),
			error,
		);
	}

	return response.json();
}

/**
 * Start a new assessment session
 *
 * Creates a new personality assessment session for a user (optional userId for anonymous sessions).
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useStartAssessment();
 *
 * <button onClick={() => mutate({ userId: "123" })}>
 *   Start Assessment
 * </button>
 * ```
 */
export function useStartAssessment() {
	return useMutation({
		mutationKey: ["assessment", "start"],
		mutationFn: async (input: StartAssessmentRequest = {}): Promise<StartAssessmentResponse> => {
			return fetchApi("/api/assessment/start", {
				method: "POST",
				body: JSON.stringify(input),
			});
		},
	});
}

/**
 * Send a message in an assessment session
 *
 * Sends a user message to Nerin and receives a response with updated precision scores.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useSendMessage();
 *
 * <button onClick={() => mutate({
 *   sessionId: "session-123",
 *   message: "I enjoy trying new things"
 * })}>
 *   Send Message
 * </button>
 * ```
 */
export function useSendMessage() {
	return useMutation({
		mutationKey: ["assessment", "sendMessage"],
		mutationFn: async (input: SendMessageRequest): Promise<SendMessageResponse> => {
			return fetchApi("/api/assessment/message", {
				method: "POST",
				body: JSON.stringify(input),
			});
		},
	});
}

/**
 * Fetch assessment results (non-hook)
 *
 * Standalone function for use in route loaders and other non-React contexts.
 */
export function fetchResults(sessionId: string): Promise<GetResultsResponse> {
	return fetchApi(`/api/assessment/${sessionId}/results`);
}

/**
 * Query options for assessment results
 *
 * Shared between useGetResults hook and route loader to ensure consistent
 * query key, function, and staleTime for SSR hydration.
 */
export function getResultsQueryOptions(sessionId: string) {
	return queryOptions({
		queryKey: ["assessment", "results", sessionId],
		queryFn: () => fetchResults(sessionId),
		staleTime: 5 * 60 * 1000,
	});
}

/**
 * Get assessment results
 *
 * Retrieves final personality assessment results including OCEAN code and archetype.
 *
 * @param sessionId - The session ID to get results for
 * @param enabled - Whether to enable the query (default: true)
 */
export function useGetResults(sessionId: string, enabled = true) {
	return useQuery({
		...getResultsQueryOptions(sessionId),
		enabled: enabled && !!sessionId,
	});
}

/**
 * Resume an existing assessment session
 *
 * Loads message history and current state for a previously started session.
 *
 * @param sessionId - The session ID to resume
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useResumeSession("session-123");
 *
 * {data && (
 *   <div>
 *     <ul>
 *       {data.messages.map((msg) => (
 *         <li key={msg.id}>{msg.content}</li>
 *       ))}
 *     </ul>
 *     <p>Precision: {data.precision}%</p>
 *   </div>
 * )}
 * ```
 */
export function useResumeSession(sessionId: string, enabled = true) {
	return useQuery({
		queryKey: ["assessment", "session", sessionId],
		queryFn: async (): Promise<ResumeSessionResponse> => {
			return fetchApi(`/api/assessment/${sessionId}/resume`);
		},
		enabled: enabled && !!sessionId,
	});
}

/**
 * List assessment sessions for the authenticated user (Story 7.13)
 *
 * Returns all assessment sessions with computed message count and optional archetype data.
 * Also returns freeTierMessageThreshold for determining completion status on the frontend.
 *
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useListAssessments();
 *
 * {data?.sessions.map((session) => (
 *   <AssessmentCard key={session.id} session={session} />
 * ))}
 * ```
 */
export function useListAssessments(enabled = true) {
	return useQuery({
		queryKey: ["assessments", "list"],
		queryFn: async (): Promise<ListSessionsResponse> => {
			return fetchApi("/api/assessment/sessions");
		},
		enabled,
		staleTime: 5 * 60 * 1000, // 5 minute cache
	});
}

/**
 * Optimistic update helper for sendMessage
 *
 * Example of how to implement optimistic updates with the assessment mutations.
 *
 * @example
 * ```tsx
 * const queryClient = useQueryClient();
 * const { mutate } = useSendMessage();
 *
 * const optimisticSend = (sessionId: string, message: string) => {
 *   // Optimistically add message to UI
 *   queryClient.setQueryData(
 *     ["assessment", "session", sessionId],
 *     (old: any) => ({
 *       ...old,
 *       messages: [
 *         ...old.messages,
 *         { id: crypto.randomUUID(), role: "user", content: message }
 *       ]
 *     })
 *   );
 *
 *   // Send actual request
 *   mutate({ sessionId, message });
 * };
 * ```
 */
