/**
 * Resend Email Mock Repository
 *
 * Mock implementation for E2E testing that logs email sends
 * without calling the real Resend API.
 */

import {
	ResendEmailRepository,
	type SendEmailInput,
} from "@workspace/domain/repositories/resend-email.repository";
import { Effect, Layer } from "effect";

/**
 * Resend Email Mock Repository Layer
 *
 * Succeeds immediately for all email sends. Logs to console for test observability.
 */
export const ResendEmailMockRepositoryLive = Layer.succeed(
	ResendEmailRepository,
	ResendEmailRepository.of({
		sendEmail: (input: SendEmailInput) =>
			Effect.sync(() => {
				console.log(`[E2E Mock] Email sent to=${input.to} subject="${input.subject}"`);
			}),
	}),
);
