/**
 * Evidence HTTP Hooks
 *
 * React hooks for fetching facet evidence using TanStack Query.
 * Uses Effect HttpApiClient for type-safe API calls via @workspace/contracts.
 */

import { useQuery } from "@tanstack/react-query";
import type { FacetName } from "@workspace/domain";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";

/**
 * Get evidence for a specific facet
 *
 * Fetches all message quotes that contributed to a facet score.
 * Used by the "View Evidence" button on profile results page.
 *
 * @param sessionId - The session ID
 * @param facetName - The facet name (e.g., "imagination", "altruism")
 * @param enabled - Whether to enable the query (default: true)
 */
export function useFacetEvidence(sessionId: string, facetName: FacetName | null, enabled = true) {
	return useQuery({
		queryKey: ["evidence", "facet", sessionId, facetName],
		queryFn: () => {
			if (!facetName) return Promise.resolve([] as const);
			return Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.evidence.getEvidenceByFacet({
					urlParams: { sessionId, facetName },
				});
			}).pipe(Effect.runPromise);
		},
		enabled: enabled && !!sessionId && !!facetName,
		staleTime: 5 * 60 * 1000,
	});
}

/**
 * Get evidence for a specific message
 *
 * Fetches all facets that were detected in a message.
 * Used when clicking a message to see which facets it contributed to.
 *
 * @param assessmentMessageId - The message ID
 * @param enabled - Whether to enable the query (default: true)
 */
export function useMessageEvidence(assessmentMessageId: string | null, enabled = true) {
	return useQuery({
		queryKey: ["evidence", "message", assessmentMessageId],
		queryFn: () => {
			if (!assessmentMessageId) return Promise.resolve([] as const);
			return Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.evidence.getEvidenceByMessage({
					path: { assessmentMessageId },
				});
			}).pipe(Effect.runPromise);
		},
		enabled: enabled && !!assessmentMessageId,
		staleTime: 5 * 60 * 1000,
	});
}
