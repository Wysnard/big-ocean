/**
 * Check Drop-off Use Case (Story 31-7)
 *
 * Finds sessions that have been inactive beyond the configured threshold
 * and sends a one-shot re-engagement email referencing the last conversation topic.
 *
 * Fire-and-forget: email failures are logged but never propagate.
 * One-shot: sessions are marked before email send to prevent duplicates.
 */

import {
	AppConfig,
	ConversationRepository,
	ExchangeRepository,
	LoggerRepository,
	ResendEmailRepository,
} from "@workspace/domain";
import { renderDropOffEmail } from "@workspace/infrastructure/email-templates/drop-off-re-engagement";
import { Effect } from "effect";
import { deriveDropOffTopic } from "./lifecycle-email-copy";

/**
 * Check for drop-off sessions and send re-engagement emails.
 *
 * @returns The number of emails sent (or attempted)
 */
export const checkDropOff = Effect.gen(function* () {
	const config = yield* AppConfig;
	const sessionRepo = yield* ConversationRepository;
	const exchangeRepo = yield* ExchangeRepository;
	const emailRepo = yield* ResendEmailRepository;
	const logger = yield* LoggerRepository;

	const dropOffSessions = yield* sessionRepo.findDropOffSessions(config.dropOffThresholdHours);

	if (dropOffSessions.length === 0) {
		logger.info("No drop-off sessions found");
		return { emailsSent: 0 };
	}

	logger.info("Found drop-off sessions", { count: dropOffSessions.length });

	let emailsSent = 0;

	for (const session of dropOffSessions) {
		// Mark session BEFORE sending to prevent duplicate emails on concurrent runs
		const marked = yield* sessionRepo.markDropOffEmailSent(session.sessionId).pipe(
			Effect.as(true),
			Effect.catchAll((err) => {
				logger.error("Failed to mark drop-off email sent", {
					sessionId: session.sessionId,
					error: err instanceof Error ? err.message : String(err),
				});
				return Effect.succeed(false);
			}),
		);

		if (!marked) {
			continue;
		}

		const exchanges = yield* exchangeRepo
			.findBySession(session.sessionId)
			.pipe(Effect.catchAll(() => Effect.succeed([])));
		const territoryName = deriveDropOffTopic(exchanges);

		const resumeUrl = `${config.frontendUrl}/chat?sessionId=${session.sessionId}`;

		const html = renderDropOffEmail({
			userName: session.userName,
			territoryName,
			resumeUrl,
		});

		// Fire-and-forget: send email, log and swallow any errors
		yield* emailRepo
			.sendEmail({
				to: session.userEmail,
				subject: "Continue your conversation with Nerin",
				html,
			})
			.pipe(
				Effect.tap(() => {
					logger.info("Drop-off re-engagement email sent", {
						sessionId: session.sessionId,
						userEmail: session.userEmail,
						territoryName,
					});
					emailsSent++;
					return Effect.void;
				}),
				Effect.catchAll((err) => {
					logger.error("Failed to send drop-off email (fail-open)", {
						sessionId: session.sessionId,
						userEmail: session.userEmail,
						error: err instanceof Error ? err.message : String(err),
					});
					return Effect.void;
				}),
			);
	}

	return { emailsSent };
});
