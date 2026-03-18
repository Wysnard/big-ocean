/**
 * Resend Email Repository Implementation (Story 31-7)
 *
 * Sends transactional email via Resend API.
 * Used for drop-off re-engagement emails (and future email types).
 */

import {
	AppConfig,
	EmailError,
	LoggerRepository,
	ResendEmailRepository,
	type SendEmailInput,
} from "@workspace/domain";
import { Effect, Layer, Redacted } from "effect";
import { Resend } from "resend";

/**
 * Resend Email Repository Layer
 */
export const ResendEmailResendRepositoryLive = Layer.effect(
	ResendEmailRepository,
	Effect.gen(function* () {
		const config = yield* AppConfig;
		const logger = yield* LoggerRepository;
		const resend = new Resend(Redacted.value(config.resendApiKey));

		return ResendEmailRepository.of({
			sendEmail: (input: SendEmailInput) =>
				Effect.gen(function* () {
					yield* Effect.tryPromise({
						try: () =>
							resend.emails.send({
								from: config.emailFromAddress,
								to: input.to,
								subject: input.subject,
								html: input.html,
							}),
						catch: (error) =>
							new EmailError(
								`Failed to send email to ${input.to}: ${error instanceof Error ? error.message : String(error)}`,
							),
					});

					logger.info("Email sent successfully", {
						to: input.to,
						subject: input.subject,
					});
				}),
		});
	}),
);
