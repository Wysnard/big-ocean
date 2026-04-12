import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

export interface QueuePushNotificationInput {
	readonly userId: string;
	readonly title: string;
	readonly body: string;
	readonly url: string;
	readonly tag?: string;
	readonly dedupeKey: string;
}

export interface QueuedPushNotification {
	readonly id: string;
	readonly userId: string;
	readonly title: string;
	readonly body: string;
	readonly url: string;
	readonly tag: string | null;
	readonly dedupeKey: string;
	readonly createdAt: Date;
	readonly expiresAt: Date;
}

export class PushNotificationQueueRepository extends Context.Tag("PushNotificationQueueRepository")<
	PushNotificationQueueRepository,
	{
		readonly enqueue: (
			input: QueuePushNotificationInput,
		) => Effect.Effect<QueuedPushNotification, DatabaseError>;
		readonly consumeByUserId: (
			userId: string,
		) => Effect.Effect<ReadonlyArray<QueuedPushNotification>, DatabaseError>;
		readonly deleteByDedupeKey: (
			userId: string,
			dedupeKey: string,
		) => Effect.Effect<void, DatabaseError>;
	}
>() {}
