import { PushSubscriptionRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface RemovePushSubscriptionInput {
	readonly userId: string;
	readonly endpoint?: string;
}

export const removePushSubscription = (input: RemovePushSubscriptionInput) =>
	Effect.gen(function* () {
		const subscriptionRepo = yield* PushSubscriptionRepository;

		if (input.endpoint) {
			yield* subscriptionRepo.deleteByEndpoint(input.endpoint, input.userId);
		} else {
			yield* subscriptionRepo.deleteByUserId(input.userId);
		}

		return { success: true as const };
	});
