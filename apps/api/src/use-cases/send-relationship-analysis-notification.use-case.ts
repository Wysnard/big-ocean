/**
 * Send Relationship Analysis Notification Use Case (Story 35-5)
 *
 * Sends email notifications to both participants when a relationship
 * analysis generation completes successfully.
 *
 * Fire-and-forget: email failures are logged but never propagate.
 * Does NOT expose personality data or analysis content in the email (NFR13).
 */

import {
	AppConfig,
	LoggerRepository,
	RelationshipAnalysisRepository,
	ResendEmailRepository,
} from "@workspace/domain";
import { renderRelationshipAnalysisReadyEmail } from "@workspace/infrastructure/email-templates/relationship-analysis-ready";
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
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;

		// 1. Load participant emails and names
		const participants = yield* analysisRepo.getParticipantEmails(input.analysisId);
		if (!participants) {
			logger.warn("Cannot send notification: participant data not found", {
				analysisId: input.analysisId,
			});
			return;
		}

		const analysisUrl = `${config.frontendUrl}/relationship/${input.analysisId}`;

		// 2. Send email to User A (fire-and-forget)
		yield* emailRepo
			.sendEmail({
				to: participants.userAEmail,
				subject: "Your relationship analysis is ready",
				html: renderRelationshipAnalysisReadyEmail({
					userName: participants.userAName,
					partnerName: participants.userBName,
					analysisUrl,
				}),
			})
			.pipe(
				Effect.tap(() => {
					logger.info("Relationship analysis notification sent", {
						analysisId: input.analysisId,
						to: participants.userAEmail,
					});
					return Effect.void;
				}),
				Effect.catchAll((err) => {
					logger.error("Failed to send relationship analysis notification (fail-open)", {
						analysisId: input.analysisId,
						to: participants.userAEmail,
						error: err instanceof Error ? err.message : String(err),
					});
					return Effect.void;
				}),
			);

		// 3. Send email to User B (fire-and-forget)
		yield* emailRepo
			.sendEmail({
				to: participants.userBEmail,
				subject: "Your relationship analysis is ready",
				html: renderRelationshipAnalysisReadyEmail({
					userName: participants.userBName,
					partnerName: participants.userAName,
					analysisUrl,
				}),
			})
			.pipe(
				Effect.tap(() => {
					logger.info("Relationship analysis notification sent", {
						analysisId: input.analysisId,
						to: participants.userBEmail,
					});
					return Effect.void;
				}),
				Effect.catchAll((err) => {
					logger.error("Failed to send relationship analysis notification (fail-open)", {
						analysisId: input.analysisId,
						to: participants.userBEmail,
						error: err instanceof Error ? err.message : String(err),
					});
					return Effect.void;
				}),
			);
	});
