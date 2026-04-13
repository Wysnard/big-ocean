/**
 * Send Relationship Letter Ready Notification Use Case (Story 35-5, Story 10-2)
 *
 * Sends push-first notifications with email fallback to both participants
 * when a relationship letter finishes generating.
 */

import {
	AppConfig,
	LoggerRepository,
	PushNotificationQueueRepository,
	PushSubscriptionRepository,
	RelationshipAnalysisRepository,
	ResendEmailRepository,
	WebPushRepository,
} from "@workspace/domain";
import {
	buildRelationshipLetterReadySubject,
	renderRelationshipAnalysisReadyEmail,
} from "@workspace/infrastructure/email-templates/relationship-analysis-ready";
import { Effect } from "effect";

export interface SendRelationshipAnalysisNotificationInput {
	readonly analysisId: string;
}

export const sendRelationshipAnalysisNotification = (
	input: SendRelationshipAnalysisNotificationInput,
) =>
	Effect.gen(function* () {
		const analysisRepo = yield* RelationshipAnalysisRepository;
		const emailRepo = yield* ResendEmailRepository;
		const pushSubscriptionRepo = yield* PushSubscriptionRepository;
		const pushQueueRepo = yield* PushNotificationQueueRepository;
		const webPushRepo = yield* WebPushRepository;
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		// 1. Load participant emails and names from the existing repository seam
		const participants = yield* analysisRepo.getParticipantEmails(input.analysisId);
		if (!participants) {
			logger.warn("Cannot send relationship letter notification: participant data not found", {
				analysisId: input.analysisId,
			});
			return;
		}

		const analysisUrl = `${config.frontendUrl}/relationship/${input.analysisId}`;
		const participantList = [
			{
				userId: participants.userAId,
				email: participants.userAEmail,
				userName: participants.userAName,
				partnerName: participants.userBName,
				role: "user-a" as const,
			},
			{
				userId: participants.userBId,
				email: participants.userBEmail,
				userName: participants.userBName,
				partnerName: participants.userAName,
				role: "user-b" as const,
			},
		];

		for (const participant of participantList) {
			const dedupeKey = `relationship-letter-ready:${input.analysisId}`;
			const notificationTitle = buildRelationshipLetterReadySubject(participant.partnerName);
			const notificationBody = `Your relationship letter with ${participant.partnerName} is ready.`;

			yield* Effect.gen(function* () {
				const pushDelivered = yield* Effect.gen(function* () {
					const subscriptions = yield* pushSubscriptionRepo.listByUserId(participant.userId);
					if (subscriptions.length === 0) return false;

					yield* pushQueueRepo.enqueue({
						userId: participant.userId,
						title: notificationTitle,
						body: notificationBody,
						url: analysisUrl,
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
										pushSubscriptionRepo.deleteByEndpoint(subscription.endpoint, participant.userId).pipe(
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

						logger.warn("Relationship letter push delivery failed", {
							analysisId: input.analysisId,
							participantRole: participant.role,
							userId: participant.userId,
							to: participant.email,
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
						yield* pushQueueRepo.deleteByDedupeKey(participant.userId, dedupeKey);
					}

					return delivered;
				}).pipe(
					Effect.catchAll((err) => {
						logger.warn("Relationship letter push path failed, falling back to email", {
							analysisId: input.analysisId,
							participantRole: participant.role,
							userId: participant.userId,
							to: participant.email,
							error: err instanceof Error ? err.message : String(err),
						});
						return Effect.succeed(false);
					}),
				);

				if (pushDelivered) {
					logger.info("Relationship letter notification delivered via push", {
						analysisId: input.analysisId,
						participantRole: participant.role,
						userId: participant.userId,
						to: participant.email,
					});
					return;
				}

				yield* emailRepo.sendEmail({
					to: participant.email,
					subject: buildRelationshipLetterReadySubject(participant.partnerName),
					html: renderRelationshipAnalysisReadyEmail({
						userName: participant.userName,
						partnerName: participant.partnerName,
						analysisUrl,
					}),
				});

				logger.info("Relationship letter notification delivered via email fallback", {
					analysisId: input.analysisId,
					participantRole: participant.role,
					userId: participant.userId,
					to: participant.email,
				});
			}).pipe(
				Effect.catchAll((err) => {
					logger.error("Relationship letter notification leg failed (fail-open)", {
						analysisId: input.analysisId,
						participantRole: participant.role,
						userId: participant.userId,
						to: participant.email,
						error: err instanceof Error ? err.message : String(err),
					});
					return Effect.void;
				}),
			);
		}
	});
