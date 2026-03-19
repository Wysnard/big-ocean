/**
 * Account HTTP Hooks (Story 30-2)
 *
 * React hooks for account management operations using TanStack Query.
 */

import { useMutation } from "@tanstack/react-query";
import type { DeleteAccountResponse } from "@workspace/contracts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Delete the authenticated user's account
 */
export function useDeleteAccount() {
	return useMutation({
		mutationKey: ["account", "delete"],
		mutationFn: async (): Promise<DeleteAccountResponse> => {
			const response = await fetch(`${API_URL}/api/account`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: response.statusText }));
				throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
			}

			return response.json();
		},
	});
}
