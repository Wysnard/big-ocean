/**
 * Check Check-in Use Case (Story 38-1)
 *
 * Finds completed sessions that are past the check-in threshold (~2 weeks)
 * and sends a one-shot Nerin check-in email referencing the last conversation territory.
 *
 * Fire-and-forget: email failures are logged but never propagate.
 * One-shot: sessions are marked before email send to prevent duplicates.
 */

import {
	AppConfig,
	AssessmentExchangeRepository,
	AssessmentSessionRepository,
	LoggerRepository,
	ResendEmailRepository,
} from "@workspace/domain";
import { renderCheckInEmail } from "@workspace/infrastructure/email-templates/nerin-check-in";
import { Effect } from "effect";

/**
 * Check for completed sessions eligible for Nerin check-in and send emails.
 *
 * @returns The number of emails sent (or attempted)
 */
export const checkCheckIn = Effect.gen(function* () {
	const config = yield* AppConfig;
	const sessionRepo = yield* AssessmentSessionRepository;
	const exchangeRepo = yield* AssessmentExchangeRepository;
	const emailRepo = yield* ResendEmailRepository;
	const logger = yield* LoggerRepository;

	const eligibleSessions = yield* sessionRepo.findCheckInEligibleSessions(
		config.checkInThresholdDays,
	);

	if (eligibleSessions.length === 0) {
		logger.info("No check-in eligible sessions found");
		return { emailsSent: 0 };
	}

	logger.info("Found check-in eligible sessions", { count: eligibleSessions.length });

	let emailsSent = 0;

	for (const session of eligibleSessions) {
		// Mark session BEFORE sending to prevent duplicate emails on concurrent runs
		yield* sessionRepo.markCheckInEmailSent(session.sessionId).pipe(
			Effect.catchAll((err) => {
				logger.error("Failed to mark check-in email sent", {
					sessionId: session.sessionId,
					error: err instanceof Error ? err.message : String(err),
				});
				return Effect.void;
			}),
		);

		// Look up last territory from assessment exchanges
		const _exchanges = yield* exchangeRepo
			.findBySession(session.sessionId)
			.pipe(Effect.catchAll(() => Effect.succeed([] as Array<{ selectedTerritory: string | null }>)));

		// Story 43-1: selectedTerritory removed from exchange table.
		// Territory description for check-in email defaults to generic.
		const territoryDescription = "your personality";

		const resultsUrl = `${config.frontendUrl}/results`;

		const html = renderCheckInEmail({
			userName: session.userName,
			territoryDescription,
			resultsUrl,
		});

		// Fire-and-forget: send email, log and swallow any errors
		yield* emailRepo
			.sendEmail({
				to: session.userEmail,
				subject: "I've been thinking about something you said",
				html,
			})
			.pipe(
				Effect.tap(() => {
					logger.info("Nerin check-in email sent", {
						sessionId: session.sessionId,
						userEmail: session.userEmail,
						territoryDescription,
					});
					emailsSent++;
					return Effect.void;
				}),
				Effect.catchAll((err) => {
					logger.error("Failed to send check-in email (fail-open)", {
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
