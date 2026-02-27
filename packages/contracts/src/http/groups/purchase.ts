/**
 * Purchase HTTP API Groups (Story 13.2)
 *
 * Split into two groups:
 * - PurchaseWebhookGroup: Public webhook endpoint (no auth)
 * - PurchaseGroup: Authenticated purchase endpoints
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError, WebhookVerificationError } from "../../errors";
import { OptionalAuthMiddleware } from "../../middleware/auth";

/**
 * Webhook Response Schema
 */
const WebhookResponseSchema = S.Struct({ received: S.Boolean });

/**
 * Verify Purchase Response Schema
 */
const VerifyPurchaseResponseSchema = S.Struct({
	verified: S.Boolean,
	capabilities: S.optional(
		S.Struct({
			availableCredits: S.Number,
			hasFullPortrait: S.Boolean,
			hasExtendedConversation: S.Boolean,
		}),
	),
});

/**
 * Purchase Webhook Group (public — no auth middleware)
 *
 * POST /api/purchase/polar-webhook
 */
export const PurchaseWebhookGroup = HttpApiGroup.make("purchaseWebhook")
	.add(
		HttpApiEndpoint.post("polarWebhook", "/polar-webhook")
			.addSuccess(WebhookResponseSchema)
			// No setPayload - we read raw body in handler for HMAC verification
			.addError(WebhookVerificationError, { status: 400 })
			.addError(DatabaseError, { status: 500 }),
	)
	.prefix("/purchase");

/**
 * Get Credits Response Schema (Story 14.1)
 */
const GetCreditsResponseSchema = S.Struct({
	availableCredits: S.Number,
	hasCompletedAssessment: S.Boolean,
});

/**
 * Purchase Group (authenticated)
 *
 * GET /api/purchase/verify?checkoutId=X
 * GET /api/purchase/credits
 */
export const PurchaseGroup = HttpApiGroup.make("purchase")
	.add(
		HttpApiEndpoint.get("verifyPurchase", "/verify")
			.addSuccess(VerifyPurchaseResponseSchema)
			.setUrlParams(S.Struct({ checkoutId: S.String }))
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.get("getCredits", "/credits")
			.addSuccess(GetCreditsResponseSchema)
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(OptionalAuthMiddleware)
	.prefix("/purchase");

// Export TypeScript types for frontend use
export type VerifyPurchaseResponse = typeof VerifyPurchaseResponseSchema.Type;
export type GetCreditsResponse = typeof GetCreditsResponseSchema.Type;
