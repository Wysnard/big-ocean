/**
 * Evidence HTTP Hooks
 *
 * React hooks for fetching facet evidence using TanStack Query.
 * Provides evidence for Profile → Evidence and Message → Facets flows.
 */

import { useQuery } from "@tanstack/react-query";
import type { SavedFacetEvidence } from "@workspace/contracts";
import type { FacetName } from "@workspace/domain";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * HTTP client for evidence endpoints
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
		const error = await response.json().catch(() => ({ message: response.statusText }));
		throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Get evidence for a specific facet
 *
 * Fetches all message quotes that contributed to a facet score.
 * Used by the "View Evidence" button on profile results page.
 *
 * @param sessionId - The session ID
 * @param facetName - The facet name (e.g., "imagination", "altruism")
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useFacetEvidence("session-123", "imagination");
 *
 * {data && data.map((evidence) => (
 *   <div key={evidence.id}>
 *     <p>{evidence.quote}</p>
 *     <span>Score: {evidence.score}/20</span>
 *   </div>
 * ))}
 * ```
 */
export function useFacetEvidence(sessionId: string, facetName: FacetName | null, enabled = true) {
	return useQuery({
		queryKey: ["evidence", "facet", sessionId, facetName],
		queryFn: async (): Promise<SavedFacetEvidence[]> => {
			if (!facetName) {
				return [];
			}
			return fetchApi(`/api/evidence/facet?sessionId=${sessionId}&facetName=${facetName}`);
		},
		enabled: enabled && !!sessionId && !!facetName,
		staleTime: 5 * 60 * 1000, // 5 minutes
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
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMessageEvidence("msg-123");
 *
 * {data && data.map((evidence) => (
 *   <div key={evidence.id}>
 *     <span>{evidence.facetName}</span>
 *     <span>+{evidence.score}/20</span>
 *   </div>
 * ))}
 * ```
 */
export function useMessageEvidence(assessmentMessageId: string | null, enabled = true) {
	return useQuery({
		queryKey: ["evidence", "message", assessmentMessageId],
		queryFn: async (): Promise<SavedFacetEvidence[]> => {
			if (!assessmentMessageId) {
				return [];
			}
			return fetchApi(`/api/evidence/message/${assessmentMessageId}`);
		},
		enabled: enabled && !!assessmentMessageId,
		staleTime: 5 * 60 * 1000, // 5 minutes
	});
}
