import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

export interface PushSubscriptionKeys {
	readonly p256dh: string;
	readonly auth: string;
}

export interface PushSubscriptionInput {
	readonly userId: string;
	readonly endpoint: string;
	readonly keys: PushSubscriptionKeys;
}

export interface PushSubscriptionRecord extends PushSubscriptionInput {
	readonly id: string;
	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export class PushSubscriptionRepository extends Context.Tag("PushSubscriptionRepository")<
	PushSubscriptionRepository,
	{
		readonly upsert: (
			input: PushSubscriptionInput,
		) => Effect.Effect<PushSubscriptionRecord, DatabaseError>;
		readonly listByUserId: (
			userId: string,
		) => Effect.Effect<ReadonlyArray<PushSubscriptionRecord>, DatabaseError>;
		readonly deleteByEndpoint: (
			endpoint: string,
			userId: string,
		) => Effect.Effect<void, DatabaseError>;
		readonly deleteByUserId: (userId: string) => Effect.Effect<void, DatabaseError>;
	}
>() {}
