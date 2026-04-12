import { PushNotificationQueueRepository } from "@workspace/domain";
import { Effect } from "effect";

export const consumePushNotifications = (userId: string) =>
	Effect.gen(function* () {
		const queueRepo = yield* PushNotificationQueueRepository;
		const notifications = yield* queueRepo.consumeByUserId(userId);
		return {
			notifications: notifications.map((notification) => ({
				id: notification.id,
				title: notification.title,
				body: notification.body,
				url: notification.url,
				tag: notification.tag ?? undefined,
			})),
		};
	});
