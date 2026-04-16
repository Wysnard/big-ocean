/**
 * Subscription entitlement + lifecycle for Me page / weekly letter (Story 8.2).
 */
import { type QueryClient, queryOptions, useQuery } from "@tanstack/react-query";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";

export const subscriptionStateQueryKey = ["purchase", "subscription-state"] as const;

export function subscriptionStateQueryOptions() {
	return queryOptions({
		queryKey: subscriptionStateQueryKey,
		queryFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.purchase.getSubscriptionState({});
			}).pipe(Effect.runPromise),
		staleTime: 60 * 1000,
	});
}

export function useSubscriptionState(enabled = true) {
	return useQuery({
		...subscriptionStateQueryOptions(),
		enabled,
	});
}

/**
 * Polls until `conversation_extension` entitlement is true (webhook latency after checkout).
 * @returns whether entitlement became true within the attempt budget
 */
export async function pollUntilConversationExtensionEntitled(
	queryClient: QueryClient,
	maxAttempts = 15,
	intervalMs = 2000,
): Promise<boolean> {
	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		const data = await queryClient.fetchQuery({
			...subscriptionStateQueryOptions(),
			staleTime: 0,
		});
		if (data.isEntitledToConversationExtension) {
			return true;
		}
		if (attempt < maxAttempts - 1) {
			await new Promise((resolve) => setTimeout(resolve, intervalMs));
		}
	}
	return false;
}
