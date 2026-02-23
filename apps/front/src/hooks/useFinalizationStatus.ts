/**
 * Finalization Status Polling Hook (Story 11.1)
 *
 * Polls GET /finalization-status every 2s until status is "completed".
 */

import { useQuery } from "@tanstack/react-query";
import type { FinalizationStatusResponse } from "@workspace/contracts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function useFinalizationStatus(sessionId: string) {
	return useQuery<FinalizationStatusResponse>({
		queryKey: ["finalizationStatus", sessionId],
		queryFn: async () => {
			const response = await fetch(`${API_URL}/api/assessment/${sessionId}/finalization-status`, {
				credentials: "include",
			});

			if (!response.ok) {
				const error = await response.json().catch(() => null);
				throw new Error(typeof error?.message === "string" ? error.message : `HTTP ${response.status}`);
			}

			return response.json();
		},
		refetchInterval: (query) => {
			if (query.state.status === "error") return false;
			if (query.state.data?.status === "completed") return false;
			return 2000;
		},
		enabled: !!sessionId,
	});
}
