/**
 * Hook: useCredits (Story 38-3)
 *
 * Shared hook for fetching relationship analysis credits.
 * Extracted from RelationshipCreditsSection for reuse across dashboard and results page.
 */

import { useQuery } from "@tanstack/react-query";
import type { GetCreditsResponse } from "@workspace/contracts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function useCredits(enabled: boolean) {
	return useQuery<GetCreditsResponse>({
		queryKey: ["purchase", "credits"],
		queryFn: async () => {
			const response = await fetch(`${API_URL}/api/purchase/credits`, {
				credentials: "include",
			});
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			return response.json();
		},
		staleTime: 30_000,
		enabled,
	});
}
