/**
 * Conversation extension activation (Story 8.3) — POST /conversation/activate-extension.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Effect } from "effect";
import { makeApiClient } from "../lib/api-client";
import { subscriptionStateQueryKey } from "./use-subscription-state";

export function useActivateExtension() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: ["conversation", "activate-extension"],
		mutationFn: () =>
			Effect.gen(function* () {
				const client = yield* makeApiClient;
				return yield* client.conversation.activateExtension({});
			}).pipe(Effect.runPromise),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: subscriptionStateQueryKey });
		},
	});
}
