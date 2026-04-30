/**
 * Conversation HTTP Hooks
 *
 * React hooks for type-safe conversation operations using TanStack Query.
 * Uses Effect HttpApiClient for type-safe API calls via @workspace/contracts.
 */

import { keepPreviousData, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import type { SendMessageRequest, StartConversationRequest } from "@workspace/contracts";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";

/**
 * Structured API error for backward-compatible error detection.
 * Used by the results route loader and component to detect 404s.
 */
export class ConversationApiError extends Error {
	readonly status: number;
	readonly details: unknown;

	constructor(status: number, message: string, details: unknown) {
		super(message);
		this.name = "ConversationApiError";
		this.status = status;
		this.details = details;
	}
}

export const isConversationApiError = (error: unknown): error is ConversationApiError =>
	error instanceof ConversationApiError;

/**
 * Start a new conversation session
 */
export function useStartConversation() {
	return useMutation({
		mutationKey: ["conversation", "start"],
		mutationFn: (input: StartConversationRequest = {}) =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.conversation.start({ payload: input });
			}).pipe(Effect.runPromise),
	});
}

/**
 * Send a message in a conversation session
 */
export function useSendMessage() {
	return useMutation({
		mutationKey: ["conversation", "sendMessage"],
		mutationFn: (input: SendMessageRequest) =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.conversation.sendMessage({ payload: input });
			}).pipe(Effect.runPromise),
	});
}

/**
 * Fetch conversation results (non-hook)
 *
 * Standalone function for use in route loaders and other non-React contexts.
 * The Promise .catch() converts FiberFailure (from Effect.runPromise) into a real
 * ConversationApiError instance so instanceof checks work in the loader and component.
 */
export function fetchResults(sessionId: string) {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.conversation.getResults({ path: { sessionId } });
	})
		.pipe(Effect.runPromise)
		.catch((e: unknown) => {
			const str = String(e);
			const msg = e instanceof Error ? e.message : str;
			const status = str.includes("SessionNotFound")
				? 404
				: str.includes("SessionNotCompleted") || str.includes("AssessmentResultsNotReady")
					? 409
					: 500;
			throw new ConversationApiError(status, msg, e);
		});
}

/**
 * Trigger finalization for a conversation that has reached the finalizing state.
 *
 * This is intentionally a non-hook helper so route loaders can finish the
 * assessment before rendering the Me page.
 */
export function generateResultsForSession(sessionId: string) {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.conversation.generateResults({ path: { sessionId } });
	}).pipe(Effect.runPromise);
}

/**
 * Query options for conversation results
 *
 * Shared between useGetResults hook and route loader to ensure consistent
 * query key, function, and staleTime for SSR hydration.
 */
export function getResultsQueryOptions(sessionId: string) {
	return queryOptions({
		queryKey: ["conversation", "results", sessionId],
		queryFn: () => fetchResults(sessionId),
		staleTime: 5 * 60 * 1000,
	});
}

/**
 * Get conversation results
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
 * Resume an existing conversation session
 *
 * Loads message history and current state for a previously started session.
 *
 * @param sessionId - The session ID to resume
 * @param enabled - Whether to enable the query (default: true)
 */
export function useResumeSession(sessionId: string, enabled = true) {
	return useQuery({
		queryKey: ["conversation", "session", sessionId],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.conversation.resumeSession({ path: { sessionId } });
			}).pipe(Effect.runPromise),
		enabled: enabled && !!sessionId,
		placeholderData: keepPreviousData,
	});
}

/**
 * Query options factory for listing conversations.
 * Use with queryClient.fetchQuery() for imperative fetching (e.g., post-auth verification).
 */
export function listConversationsQueryOptions() {
	return queryOptions({
		queryKey: ["conversations", "list"],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.conversation.listSessions();
			}).pipe(Effect.runPromise),
		staleTime: 5 * 60 * 1000,
	});
}

/**
 * List conversation sessions for the authenticated user (Story 7.13)
 */
export function useListConversations(enabled = true) {
	return useQuery({
		...listConversationsQueryOptions(),
		enabled,
	});
}

/**
 * Get conversation transcript for a completed session (Story 12.2)
 *
 * Returns all messages with IDs for evidence linking in the transcript panel.
 * Cached with staleTime: Infinity since transcripts are immutable for completed sessions.
 *
 * @param sessionId - The completed session ID
 * @param enabled - Whether to enable the query (default: true)
 */
export function useConversationTranscript(sessionId: string, enabled = true) {
	return useQuery({
		queryKey: ["conversation", "transcript", sessionId],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.conversation.getTranscript({ path: { sessionId } });
			}).pipe(Effect.runPromise),
		enabled: enabled && !!sessionId,
		staleTime: Number.POSITIVE_INFINITY,
	});
}
