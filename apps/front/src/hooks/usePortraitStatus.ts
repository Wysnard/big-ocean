/**
 * Portrait Status Polling Hook (Story 13.3)
 *
 * Polls GET /portrait/:sessionId/status every 2s while status is "generating".
 * Stops polling when status becomes "ready", "failed", or "none".
 *
 * When `waitingForUnlock` is true (after successful checkout), polls until
 * the full portrait becomes ready — even if status is still teaser/none
 * while the webhook is being processed.
 */

import { useQuery } from "@tanstack/react-query";
import type { GetPortraitStatusResponse } from "@workspace/contracts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface UsePortraitStatusOptions {
	waitingForUnlock?: boolean;
}

export function usePortraitStatus(sessionId: string, options?: UsePortraitStatusOptions) {
	const { waitingForUnlock = false } = options ?? {};

	return useQuery<GetPortraitStatusResponse>({
		queryKey: ["portraitStatus", sessionId],
		queryFn: async () => {
			const response = await fetch(`${API_URL}/api/portrait/${sessionId}/status`, {
				credentials: "include",
			});

			if (!response.ok) {
				const error = await response.json().catch(() => null);
				throw new Error(typeof error?.message === "string" ? error.message : `HTTP ${response.status}`);
			}

			return response.json();
		},
		refetchInterval: (query) => {
			// Stop polling on error
			if (query.state.status === "error") return false;
			// Stop polling when portrait is ready
			if (query.state.data?.status === "ready") return false;
			// Stop polling when portrait generation failed
			if (query.state.data?.status === "failed") return false;
			// Keep polling if waiting for unlock (webhook processing)
			if (waitingForUnlock) return 2000;
			// Stop polling when no portrait exists
			if (query.state.data?.status === "none") return false;
			// Poll every 2 seconds while generating
			return 2000;
		},
		enabled: !!sessionId,
	});
}
