/**
 * Assessment HTTP Hooks
 *
 * React hooks for type-safe assessment operations using TanStack Query.
 * Uses Effect HttpApiClient for type-safe API calls via @workspace/contracts.
 */

import { keepPreviousData, queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import type { SendMessageRequest, StartAssessmentRequest } from "@workspace/contracts";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";

/**
 * Structured API error for backward-compatible error detection.
 * Used by the results route loader and component to detect 404s.
 */
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

/**
 * Start a new assessment session
 */
export function useStartAssessment() {
	return useMutation({
		mutationKey: ["assessment", "start"],
		mutationFn: (input: StartAssessmentRequest = {}) =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.assessment.start({ payload: input });
			}).pipe(Effect.runPromise),
	});
}

/**
 * Send a message in an assessment session
 */
export function useSendMessage() {
	return useMutation({
		mutationKey: ["assessment", "sendMessage"],
		mutationFn: (input: SendMessageRequest) =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.assessment.sendMessage({ payload: input });
			}).pipe(Effect.runPromise),
	});
}

/**
 * Fetch assessment results (non-hook)
 *
 * Standalone function for use in route loaders and other non-React contexts.
 * The Promise .catch() converts FiberFailure (from Effect.runPromise) into a real
 * AssessmentApiError instance so instanceof checks work in the loader and component.
 */
export function fetchResults(sessionId: string) {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.assessment.getResults({ path: { sessionId } });
	})
		.pipe(Effect.runPromise)
		.catch((e: unknown) => {
			const str = String(e);
			const msg = e instanceof Error ? e.message : str;
			const status = str.includes("SessionNotFound")
				? 404
				: str.includes("SessionNotCompleted")
					? 409
					: 500;
			throw new AssessmentApiError(status, msg, e);
		});
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
 */
export function useResumeSession(sessionId: string, enabled = true) {
	return useQuery({
		queryKey: ["assessment", "session", sessionId],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.assessment.resumeSession({ path: { sessionId } });
			}).pipe(Effect.runPromise),
		enabled: enabled && !!sessionId,
		placeholderData: keepPreviousData,
	});
}

/**
 * Query options factory for listing assessments.
 * Use with queryClient.fetchQuery() for imperative fetching (e.g., post-auth verification).
 */
export function listAssessmentsQueryOptions() {
	return queryOptions({
		queryKey: ["assessments", "list"],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.assessment.listSessions();
			}).pipe(Effect.runPromise),
		staleTime: 5 * 60 * 1000,
	});
}

/**
 * List assessment sessions for the authenticated user (Story 7.13)
 */
export function useListAssessments(enabled = true) {
	return useQuery({
		...listAssessmentsQueryOptions(),
		enabled,
	});
}

/**
 * Get conversation transcript for a completed assessment session (Story 12.2)
 *
 * Returns all messages with IDs for evidence linking in the transcript panel.
 * Cached with staleTime: Infinity since transcripts are immutable for completed sessions.
 *
 * @param sessionId - The completed session ID
 * @param enabled - Whether to enable the query (default: true)
 */
export function useConversationTranscript(sessionId: string, enabled = true) {
	return useQuery({
		queryKey: ["assessment", "transcript", sessionId],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.assessment.getTranscript({ path: { sessionId } });
			}).pipe(Effect.runPromise),
		enabled: enabled && !!sessionId,
		staleTime: Number.POSITIVE_INFINITY,
	});
}
