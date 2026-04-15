/**
 * Send weekly letter ready notification (Story 5.3).
 *
 * Push-first with email fallback, aligned with send-relationship-analysis-notification.
 */

import {
	AppConfig,
	LoggerRepository,
	PushNotificationQueueRepository,
	PushSubscriptionRepository,
	ResendEmailRepository,
	UserAccountRepository,
	WebPushRepository,
} from "@workspace/domain";
import {
	buildWeeklyLetterReadyEmailSubject,
	renderWeeklyLetterReadyEmail,
	WEEKLY_LETTER_READY_PUSH_BODY,
	WEEKLY_LETTER_READY_PUSH_TITLE,
} from "@workspace/infrastructure/email-templates/weekly-letter-ready";
import { Effect } from "effect";

export interface SendWeeklyLetterReadyNotificationInput {
	readonly userId: string;
	readonly weekId: string;
}

export const sendWeeklyLetterReadyNotification = (input: SendWeeklyLetterReadyNotificationInput) =>
	Effect.gen(function* () {
		const accountRepo = yield* UserAccountRepository;
		const emailRepo = yield* ResendEmailRepository;
		const pushSubscriptionRepo = yield* PushSubscriptionRepository;
		const pushQueueRepo = yield* PushNotificationQueueRepository;
		const webPushRepo = yield* WebPushRepository;
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		const contact = yield* accountRepo.getEmailAndNameForUser(input.userId);
		if (!contact) {
			logger.warn("Weekly letter notification: user account row not found — skipping notification", {
				userId: input.userId,
			});
			return;
		}

		const letterUrl = `${config.frontendUrl}/today/week/${input.weekId}`;
		const dedupeKey = `weekly-letter-ready:${input.weekId}:${input.userId}`;

		yield* Effect.gen(function* () {
			const pushDelivered = yield* Effect.gen(function* () {
				const subscriptions = yield* pushSubscriptionRepo.listByUserId(input.userId);
				if (subscriptions.length === 0) return false;

				yield* pushQueueRepo.enqueue({
					userId: input.userId,
					title: WEEKLY_LETTER_READY_PUSH_TITLE,
					body: WEEKLY_LETTER_READY_PUSH_BODY,
					url: letterUrl,
					tag: dedupeKey,
					dedupeKey,
				});

				const pushResults = yield* Effect.forEach(
					subscriptions,
					(subscription) =>
						webPushRepo.sendNotification(subscription).pipe(
							Effect.as({ status: "sent" as const, endpoint: subscription.endpoint }),
							Effect.catchTags({
								PushSubscriptionExpiredError: (error) =>
									pushSubscriptionRepo.deleteByEndpoint(subscription.endpoint, input.userId).pipe(
										Effect.zipRight(
											Effect.succeed({
												status: "expired" as const,
												endpoint: subscription.endpoint,
												error,
											}),
										),
									),
								PushUnavailableError: (error) =>
									Effect.succeed({
										status: "unavailable" as const,
										endpoint: subscription.endpoint,
										error,
									}),
								PushDeliveryError: (error) =>
									Effect.succeed({
										status: "failed" as const,
										endpoint: subscription.endpoint,
										error,
									}),
							}),
						),
					{ concurrency: "unbounded" },
				);

				const delivered = pushResults.some((result) => result.status === "sent");

				for (const result of pushResults) {
					if (result.status === "sent") continue;

					logger.warn("Weekly letter push delivery failed", {
						userId: input.userId,
						weekId: input.weekId,
						to: contact.email,
						endpoint: result.endpoint,
						failure:
							result.status === "expired"
								? "expired"
								: result.status === "unavailable"
									? "unavailable"
									: "failed",
					});
				}

				if (!delivered) {
					yield* pushQueueRepo.deleteByDedupeKey(input.userId, dedupeKey);
				}

				return delivered;
			}).pipe(
				Effect.catchAll((err) => {
					logger.warn("Weekly letter push path failed, falling back to email", {
						userId: input.userId,
						weekId: input.weekId,
						to: contact.email,
						error: err instanceof Error ? err.message : String(err),
					});
					return Effect.succeed(false);
				}),
			);

			if (pushDelivered) {
				logger.info("Weekly letter notification delivered via push", {
					userId: input.userId,
					weekId: input.weekId,
					to: contact.email,
				});
				return;
			}

			yield* emailRepo.sendEmail({
				to: contact.email,
				subject: buildWeeklyLetterReadyEmailSubject(),
				html: renderWeeklyLetterReadyEmail({
					userName: contact.name,
					letterUrl,
				}),
			});

			logger.info("Weekly letter notification delivered via email fallback", {
				userId: input.userId,
				weekId: input.weekId,
				to: contact.email,
			});
		}).pipe(
			Effect.catchAll((err) => {
				logger.error("Weekly letter notification failed (fail-open)", {
					userId: input.userId,
					weekId: input.weekId,
					to: contact.email,
					error: err instanceof Error ? err.message : String(err),
				});
				return Effect.void;
			}),
		);
	});
