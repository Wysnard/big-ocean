/**
 * Relationship Analysis Hooks (Story 35-3)
 *
 * useRelationshipAnalysis: Polls GET /relationship/analysis/:analysisId every 5s
 * while content is null (generating). Stops when content arrives or on error.
 *
 * useRetryRelationshipAnalysis: Calls POST /relationship/analysis/:analysisId/retry
 * and invalidates the analysis query on success.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RelationshipAnalysisResponse } from "@workspace/contracts/http/groups/relationship";
import { Effect } from "effect";
import { makeApiClient } from "@/lib/api-client";

/** Polling interval in milliseconds */
export const RELATIONSHIP_POLL_INTERVAL_MS = 5000;

/**
 * Determine whether relationship analysis polling should continue.
 * Extracted as a pure function for testability.
 *
 * @returns polling interval in ms, or false to stop polling
 */
export function shouldPollRelationshipAnalysis(
	queryStatus: "pending" | "error" | "success",
	content: string | null | undefined,
): number | false {
	// Don't poll on error
	if (queryStatus === "error") return false;
	// Don't poll during initial load
	if (queryStatus === "pending") return false;
	// Stop polling when content is ready
	if (content !== null && content !== undefined) return false;
	// Poll while generating (content is null)
	return RELATIONSHIP_POLL_INTERVAL_MS;
}

/**
 * Fetch and poll a relationship analysis.
 * Polls every 5s while content is null (generating).
 */
export function useRelationshipAnalysis(analysisId: string, enabled: boolean) {
	return useQuery<RelationshipAnalysisResponse>({
		queryKey: ["relationship", "analysis", analysisId],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.relationship.getRelationshipAnalysis({ path: { analysisId } });
			}).pipe(Effect.runPromise),
		staleTime: 5 * 60 * 1000,
		enabled,
		refetchInterval: (query) =>
			shouldPollRelationshipAnalysis(query.state.status, query.state.data?.content),
	});
}

/**
 * Retry a failed relationship analysis generation.
 * Invalidates the analysis query on success to trigger re-fetch.
 */
export function useRetryRelationshipAnalysis(analysisId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["relationship", "analysis", analysisId, "retry"],
		mutationFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.relationship.retryRelationshipAnalysis({ path: { analysisId } });
			}).pipe(Effect.runPromise),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: ["relationship", "analysis", analysisId],
			});
		},
	});
}
