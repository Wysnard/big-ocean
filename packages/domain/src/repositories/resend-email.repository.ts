/**
 * Resend Email Repository Interface (Story 31-7)
 *
 * Transactional email sending via Resend.
 * Used for drop-off re-engagement, Nerin check-in, and deferred portrait recapture.
 */

import { Context, type Effect } from "effect";

/**
 * Email sending error — co-located with repository interface per architecture rules
 */
export class EmailError {
	readonly _tag = "EmailError";
	constructor(readonly message: string) {}
}

/**
 * Input for sending an email
 */
export interface SendEmailInput {
	readonly to: string;
	readonly subject: string;
	readonly html: string;
}

/**
 * Resend Email Repository Methods
 */
export interface ResendEmailMethods {
	/**
	 * Send a transactional email via Resend
	 * @param input - Email recipient, subject, and HTML body
	 */
	readonly sendEmail: (input: SendEmailInput) => Effect.Effect<void, EmailError>;
}

/**
 * Resend Email Repository Tag
 */
export class ResendEmailRepository extends Context.Tag("ResendEmailRepository")<
	ResendEmailRepository,
	ResendEmailMethods
>() {}
