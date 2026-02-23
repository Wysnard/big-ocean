/**
 * Generate Results Hook (Story 11.1)
 *
 * Fires POST /generate-results to trigger the finalization pipeline.
 */

import { useMutation } from "@tanstack/react-query";
import type { GenerateResultsResponse } from "@workspace/contracts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function useGenerateResults() {
	return useMutation({
		mutationFn: async ({ sessionId }: { sessionId: string }): Promise<GenerateResultsResponse> => {
			const response = await fetch(`${API_URL}/api/assessment/${sessionId}/generate-results`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
			});

			if (!response.ok) {
				const error = await response.json().catch(() => null);
				throw new Error(typeof error?.message === "string" ? error.message : `HTTP ${response.status}`);
			}

			return response.json();
		},
	});
}
