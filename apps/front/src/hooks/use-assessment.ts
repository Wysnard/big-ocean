/**
 * Assessment HTTP Hooks
 *
 * React hooks for type-safe assessment operations using TanStack Query.
 * Uses direct HTTP calls to backend assessment endpoints.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  StartAssessmentRequest,
  StartAssessmentResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetResultsResponse,
  ResumeSessionResponse,
} from "@workspace/contracts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * HTTP client for assessment endpoints
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include", // Include cookies for auth
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(
      error.message || `HTTP ${response.status}: ${response.statusText}`,
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
    mutationFn: async (
      input: StartAssessmentRequest = {},
    ): Promise<StartAssessmentResponse> => {
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
    mutationFn: async (
      input: SendMessageRequest,
    ): Promise<SendMessageResponse> => {
      return fetchApi("/api/assessment/message", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
  });
}

/**
 * Get assessment results
 *
 * Retrieves final personality assessment results including OCEAN code and archetype.
 *
 * @param sessionId - The session ID to get results for
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useGetResults("session-123");
 *
 * {data && (
 *   <div>
 *     <h2>{data.archetypeName}</h2>
 *     <p>OCEAN Code: {data.oceanCode4Letter}</p>
 *   </div>
 * )}
 * ```
 */
export function useGetResults(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: ["assessment", "results", sessionId],
    queryFn: async (): Promise<GetResultsResponse> => {
      return fetchApi(`/api/assessment/${sessionId}/results`);
    },
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
