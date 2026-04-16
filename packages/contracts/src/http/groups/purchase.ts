/**
 * Purchase HTTP API Groups (Story 13.2)
 *
 * Webhook handling is now done via the @polar-sh/better-auth plugin
 * (routes registered under Better Auth at /api/polar/webhooks).
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError } from "../../errors";
import { OptionalAuthMiddleware } from "../../middleware/auth";

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
 * Get Credits Response Schema (Story 14.1)
 */
const GetCreditsResponseSchema = S.Struct({
	availableCredits: S.Number,
	hasCompletedAssessment: S.Boolean,
});

const SubscriptionStatusSchema = S.Literal("active", "cancelled_active", "expired", "none");

const GetSubscriptionStateResponseSchema = S.Struct({
	subscriptionStatus: SubscriptionStatusSchema,
	isEntitledToConversationExtension: S.Boolean,
	subscribedSince: S.NullOr(S.String),
});

/**
 * Purchase Group (authenticated)
 *
 * GET /api/purchase/verify?checkoutId=X
 * GET /api/purchase/credits
 * GET /api/purchase/subscription-state
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
	.add(
		HttpApiEndpoint.get("getSubscriptionState", "/subscription-state")
			.addSuccess(GetSubscriptionStateResponseSchema)
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(OptionalAuthMiddleware)
	.prefix("/purchase");

// Export TypeScript types for frontend use
export type VerifyPurchaseResponse = typeof VerifyPurchaseResponseSchema.Type;
export type GetCreditsResponse = typeof GetCreditsResponseSchema.Type;
export type GetSubscriptionStateResponse = typeof GetSubscriptionStateResponseSchema.Type;
