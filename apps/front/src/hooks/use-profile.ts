/**
 * Profile HTTP Hooks
 *
 * React hooks for type-safe profile sharing operations using TanStack Query.
 * Uses Effect HttpApiClient for type-safe API calls via @workspace/contracts.
 */

import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import type { GetPublicProfileResponse } from "@workspace/contracts";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";

/**
 * Create a shareable profile from a completed assessment session
 */
export function useShareProfile() {
	return useMutation({
		mutationKey: ["profile", "share"],
		mutationFn: (sessionId: string) =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.profile.shareProfile({ payload: { sessionId } });
			}).pipe(Effect.runPromise),
	});
}

/**
 * Query options factory for public profile.
 * Use with queryClient.ensureQueryData() for SSR prefetching (e.g., OG meta tags).
 */
export function getPublicProfileQueryOptions(publicProfileId: string) {
	return queryOptions<GetPublicProfileResponse>({
		queryKey: ["profile", "public", publicProfileId],
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.profile.getProfile({ path: { publicProfileId } });
			}).pipe(Effect.runPromise),
		retry: false,
	});
}

/**
 * Get a public profile by ID
 */
export function useGetPublicProfile(publicProfileId: string, enabled = true) {
	return useQuery({
		...getPublicProfileQueryOptions(publicProfileId),
		enabled: enabled && !!publicProfileId,
	});
}

/**
 * Toggle profile visibility (public/private)
 */
export function useToggleVisibility() {
	return useMutation({
		mutationKey: ["profile", "toggleVisibility"],
		mutationFn: (input: { publicProfileId: string; isPublic: boolean }) =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.profile.toggleVisibility({
					path: { publicProfileId: input.publicProfileId },
					payload: { isPublic: input.isPublic },
				});
			}).pipe(Effect.runPromise),
	});
}
