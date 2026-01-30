/**
 * Assessment RPC Hooks
 *
 * React hooks for type-safe assessment operations using TanStack Query.
 * Integrates Effect-ts RPC client with React Query for caching and state management.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  StartAssessmentRpc,
  SendMessageRpc,
  GetResultsRpc,
  ResumeSessionRpc,
} from "@workspace/contracts";
import { callRpc } from "../lib/rpc-client.js";

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
    mutationFn: async (input: { userId?: string } = {}) => {
      return callRpc(StartAssessmentRpc, input);
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
    mutationFn: async (input: { sessionId: string; message: string }) => {
      return callRpc(SendMessageRpc, input);
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
    queryFn: async () => {
      return callRpc(GetResultsRpc, { sessionId });
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
    queryFn: async () => {
      return callRpc(ResumeSessionRpc, { sessionId });
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
