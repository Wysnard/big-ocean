/**
 * Subscription state for Me page / weekly letter (Story 8.2).
 *
 * Derives status from purchase events — no mutable user.subscription column.
 */

import {
	getSubscribedSinceForCurrentSubscription,
	getSubscriptionStatus,
	isEntitledTo,
	PurchaseEventRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export const getSubscriptionState = (userId: string) =>
	Effect.gen(function* () {
		const purchaseRepo = yield* PurchaseEventRepository;
		const events = yield* purchaseRepo.getEventsByUserId(userId);
		return {
			subscriptionStatus: getSubscriptionStatus(events),
			isEntitledToConversationExtension: isEntitledTo(events, "conversation_extension"),
			subscribedSince: getSubscribedSinceForCurrentSubscription(events)?.toISOString() ?? null,
		};
	});
