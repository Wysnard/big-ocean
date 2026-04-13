/**
 * Server-side email template rendering for the /dev/emails preview page.
 *
 * Uses createServerFn so the actual infrastructure email templates
 * are rendered on the server — the dev page always shows the real output.
 *
 * Dynamic imports avoid needing @workspace/infrastructure as a declared dependency.
 */

import { createServerFn } from "@tanstack/react-start";

const SAMPLE_URL = "https://bigocean.app/example";

export interface RenderedTemplate {
	readonly id: string;
	readonly name: string;
	readonly subject: string;
	readonly category: "auth" | "engagement" | "notification";
	readonly html: string;
}

export const getRenderedEmailTemplates = createServerFn({ method: "GET" }).handler(
	async (): Promise<RenderedTemplate[]> => {
		const [
			{ renderEmailVerificationEmail },
			{ renderPasswordResetEmail },
			{ renderCheckInEmail },
			{ renderDropOffEmail },
			{ renderRelationshipAnalysisReadyEmail },
			{ renderSubscriptionNudgeEmail },
		] = await Promise.all([
			import("@workspace/infrastructure/email-templates/email-verification"),
			import("@workspace/infrastructure/email-templates/password-reset"),
			import("@workspace/infrastructure/email-templates/nerin-check-in"),
			import("@workspace/infrastructure/email-templates/drop-off-re-engagement"),
			import("@workspace/infrastructure/email-templates/relationship-analysis-ready"),
			import("@workspace/infrastructure/email-templates/subscription-conversion-nudge"),
		]);

		return [
			{
				id: "email-verification",
				name: "Email Verification",
				subject: "Verify your email — big ocean",
				category: "auth",
				html: renderEmailVerificationEmail({ userName: "Alex", verifyUrl: SAMPLE_URL }),
			},
			{
				id: "password-reset",
				name: "Password Reset",
				subject: "Reset your password — big ocean",
				category: "auth",
				html: renderPasswordResetEmail({ userName: "Alex", resetUrl: SAMPLE_URL }),
			},
			{
				id: "nerin-check-in",
				name: "Nerin Check-in",
				subject: "I've been thinking about something you said",
				category: "engagement",
				html: renderCheckInEmail({
					userName: "Alex",
					territoryDescription:
						"how you described the pull between wanting connection and needing solitude",
					resultsUrl: SAMPLE_URL,
				}),
			},
			{
				id: "drop-off",
				name: "Drop-off Re-engagement",
				subject: "Continue your conversation with Nerin",
				category: "engagement",
				html: renderDropOffEmail({
					userName: "Alex",
					territoryName: "what creativity means to you",
					resumeUrl: SAMPLE_URL,
				}),
			},
			{
				id: "relationship-analysis",
				name: "Relationship Analysis Ready",
				subject: "Your relationship analysis is ready",
				category: "notification",
				html: renderRelationshipAnalysisReadyEmail({
					userName: "Alex",
					partnerName: "Jordan",
					analysisUrl: SAMPLE_URL,
				}),
			},
			{
				id: "subscription-nudge",
				name: "Subscription Nudge",
				subject: "I have more I want to say about what comes next",
				category: "engagement",
				html: renderSubscriptionNudgeEmail({
					userName: "Alex",
					subscriptionUrl: SAMPLE_URL,
				}),
			},
		];
	},
);
