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
import { AuthMiddleware } from "../../middleware/auth";

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
 * Purchase Group (authenticated)
 *
 * GET /api/purchase/verify?checkoutId=X
 */
export const PurchaseGroup = HttpApiGroup.make("purchase")
	.add(
		HttpApiEndpoint.get("verifyPurchase", "/verify")
			.addSuccess(VerifyPurchaseResponseSchema)
			.setUrlParams(S.Struct({ checkoutId: S.String }))
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/purchase");

// Export TypeScript types for frontend use
export type VerifyPurchaseResponse = typeof VerifyPurchaseResponseSchema.Type;
