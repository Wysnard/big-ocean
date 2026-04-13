/**
 * Account HTTP API Group (Story 30-2)
 *
 * Defines account management endpoints.
 * Currently: account deletion with cascade cleanup.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { AccountNotFound, DatabaseError, Unauthorized } from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";

/**
 * Delete Account Response Schema
 */
export const DeleteAccountResponseSchema = S.Struct({
	success: S.Boolean,
});

export const FirstVisitStateResponseSchema = S.Struct({
	firstVisitCompleted: S.Boolean,
});

/**
 * Account API Group
 *
 * Routes:
 * - GET /api/account/first-visit - Read authenticated user's first-visit flag
 * - POST /api/account/first-visit/complete - Mark first visit complete
 * - DELETE /api/account - Delete authenticated user's account
 */
export const AccountGroup = HttpApiGroup.make("account")
	.add(
		HttpApiEndpoint.get("getFirstVisitState", "/first-visit")
			.addSuccess(FirstVisitStateResponseSchema)
			.addError(AccountNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.post("completeFirstVisit", "/first-visit/complete")
			.addSuccess(FirstVisitStateResponseSchema)
			.addError(AccountNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.add(
		HttpApiEndpoint.del("deleteAccount", "/")
			.addSuccess(DeleteAccountResponseSchema)
			.addError(AccountNotFound, { status: 404 })
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/account");

// Export TypeScript types for frontend use
export type DeleteAccountResponse = typeof DeleteAccountResponseSchema.Type;
export type FirstVisitStateResponse = typeof FirstVisitStateResponseSchema.Type;
