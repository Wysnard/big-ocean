/**
 * Check Recapture Use Case (Story 38-2)
 *
 * Finds completed sessions where the user skipped portrait purchase
 * and sends a one-shot deferred portrait recapture email.
 *
 * Fire-and-forget: email failures are logged but never propagate.
 * One-shot: sessions are marked before email send to prevent duplicates.
 * Portrait purchasers excluded: sessions where user has portrait_unlocked are filtered out in the repo query.
 */

import {
	AppConfig,
	AssessmentSessionRepository,
	LoggerRepository,
	ResendEmailRepository,
} from "@workspace/domain";
import { renderRecaptureEmail } from "@workspace/infrastructure/email-templates/portrait-recapture";
import { Effect } from "effect";

/**
 * Check for completed sessions eligible for portrait recapture and send emails.
 *
 * @returns The number of emails sent (or attempted)
 */
export const checkRecapture = Effect.gen(function* () {
	const config = yield* AppConfig;
	const sessionRepo = yield* AssessmentSessionRepository;
	const emailRepo = yield* ResendEmailRepository;
	const logger = yield* LoggerRepository;

	const eligibleSessions = yield* sessionRepo.findRecaptureEligibleSessions(
		config.recaptureThresholdDays,
	);

	if (eligibleSessions.length === 0) {
		logger.info("No recapture eligible sessions found");
		return { emailsSent: 0 };
	}

	logger.info("Found recapture eligible sessions", { count: eligibleSessions.length });

	let emailsSent = 0;

	for (const session of eligibleSessions) {
		// Mark session BEFORE sending to prevent duplicate emails on concurrent runs
		yield* sessionRepo.markRecaptureEmailSent(session.sessionId).pipe(
			Effect.catchAll((err) => {
				logger.error("Failed to mark recapture email sent", {
					sessionId: session.sessionId,
					error: err instanceof Error ? err.message : String(err),
				});
				return Effect.void;
			}),
		);

		const resultsUrl = `${config.frontendUrl}/results`;

		const html = renderRecaptureEmail({
			userName: session.userName,
			resultsUrl,
		});

		// Fire-and-forget: send email, log and swallow any errors
		yield* emailRepo
			.sendEmail({
				to: session.userEmail,
				subject: "Nerin's portrait is waiting for you",
				html,
			})
			.pipe(
				Effect.tap(() => {
					logger.info("Portrait recapture email sent", {
						sessionId: session.sessionId,
						userEmail: session.userEmail,
					});
					emailsSent++;
					return Effect.void;
				}),
				Effect.catchAll((err) => {
					logger.error("Failed to send recapture email (fail-open)", {
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
