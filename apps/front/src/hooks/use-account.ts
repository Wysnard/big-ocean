/**
 * Account HTTP Hooks (Story 30-2)
 *
 * React hooks for account management operations using TanStack Query.
 * Uses Effect HttpApiClient for type-safe API calls.
 */

import { useMutation } from "@tanstack/react-query";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";

export function fetchFirstVisitState() {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.account.getFirstVisitState({});
	}).pipe(Effect.runPromise);
}

export function completeFirstVisit() {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.account.completeFirstVisit({});
	}).pipe(Effect.runPromise);
}

export function scheduleFirstDailyPrompt(input: { scheduledFor: string }) {
	return Effect.gen(function* () {
		const client = yield* makeApiClient;
		return yield* client.account.scheduleFirstDailyPrompt({
			payload: input,
		});
	}).pipe(Effect.runPromise);
}

/**
 * Delete the authenticated user's account
 */
export function useDeleteAccount() {
	return useMutation({
		mutationKey: ["account", "delete"],
		mutationFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.account.deleteAccount({});
			}).pipe(Effect.runPromise),
	});
}
