/**
 * Profile HTTP Hooks
 *
 * React hooks for type-safe profile sharing operations using TanStack Query.
 * Uses direct HTTP calls to backend profile endpoints.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import type {
	GetPublicProfileResponse,
	ShareProfileResponse,
	ToggleVisibilityResponse,
} from "@workspace/contracts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * HTTP client for profile endpoints
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: response.statusText }));
		throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Create a shareable profile from a completed assessment session
 */
export function useShareProfile() {
	return useMutation({
		mutationKey: ["profile", "share"],
		mutationFn: async (sessionId: string): Promise<ShareProfileResponse> => {
			return fetchApi("/api/public-profile/share", {
				method: "POST",
				body: JSON.stringify({ sessionId }),
			});
		},
	});
}

/**
 * Get a public profile by ID
 */
export function useGetPublicProfile(publicProfileId: string, enabled = true) {
	return useQuery({
		queryKey: ["profile", "public", publicProfileId],
		queryFn: async (): Promise<GetPublicProfileResponse> => {
			return fetchApi(`/api/public-profile/${publicProfileId}`);
		},
		enabled: enabled && !!publicProfileId,
		retry: false,
	});
}

/**
 * Toggle profile visibility (public/private)
 */
export function useToggleVisibility() {
	return useMutation({
		mutationKey: ["profile", "toggleVisibility"],
		mutationFn: async (input: {
			publicProfileId: string;
			isPublic: boolean;
		}): Promise<ToggleVisibilityResponse> => {
			return fetchApi(`/api/public-profile/${input.publicProfileId}/visibility`, {
				method: "PATCH",
				body: JSON.stringify({ isPublic: input.isPublic }),
			});
		},
	});
}
