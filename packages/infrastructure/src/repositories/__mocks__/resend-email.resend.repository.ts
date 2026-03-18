/**
 * Mock: resend-email.resend.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/resend-email.resend.repository')
 *
 * In-memory email sending for testing.
 */
import { ResendEmailRepository, type SendEmailInput } from "@workspace/domain";
import { Effect, Layer } from "effect";

const sentEmails: SendEmailInput[] = [];

/** Get all sent emails for test assertions. */
export const _getSentEmails = () => [...sentEmails];

/** Clear in-memory state between tests. */
export const _resetMockState = () => {
	sentEmails.length = 0;
};

export const ResendEmailResendRepositoryLive = Layer.succeed(
	ResendEmailRepository,
	ResendEmailRepository.of({
		sendEmail: (input: SendEmailInput) =>
			Effect.sync(() => {
				sentEmails.push(input);
			}),
	}),
);
