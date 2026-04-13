import { PushSubscriptionRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface SavePushSubscriptionInput {
	readonly userId: string;
	readonly endpoint: string;
	readonly keys: {
		readonly p256dh: string;
		readonly auth: string;
	};
}

export const savePushSubscription = (input: SavePushSubscriptionInput) =>
	Effect.gen(function* () {
		const subscriptionRepo = yield* PushSubscriptionRepository;
		yield* subscriptionRepo.upsert(input);
		return { success: true as const };
	});
