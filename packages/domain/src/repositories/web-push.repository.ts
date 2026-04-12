import { Context, Data, Effect } from "effect";
import type { PushSubscriptionRecord } from "./push-subscription.repository";

export class PushUnavailableError extends Data.TaggedError("PushUnavailableError")<{
	readonly reason: string;
}> {}

export class PushSubscriptionExpiredError extends Data.TaggedError("PushSubscriptionExpiredError")<{
	readonly endpoint: string;
	readonly status?: number;
}> {}

export class PushDeliveryError extends Data.TaggedError("PushDeliveryError")<{
	readonly endpoint: string;
	readonly reason: string;
	readonly status?: number;
}> {}

export class WebPushRepository extends Context.Tag("WebPushRepository")<
	WebPushRepository,
	{
		readonly sendNotification: (
			subscription: PushSubscriptionRecord,
		) => Effect.Effect<void, PushUnavailableError | PushSubscriptionExpiredError | PushDeliveryError>;
	}
>() {}
