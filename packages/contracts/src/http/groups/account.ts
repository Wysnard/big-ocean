/**
 * Account HTTP API Group (Story 30-2)
 *
 * Defines account management endpoints.
 * Currently: account deletion with cascade cleanup.
 */

import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema as S } from "effect";
import { DatabaseError, Unauthorized } from "../../errors";
import { AuthMiddleware } from "../../middleware/auth";

/**
 * Delete Account Response Schema
 */
export const DeleteAccountResponseSchema = S.Struct({
	success: S.Boolean,
});

/**
 * Account API Group
 *
 * Routes:
 * - DELETE /api/account - Delete authenticated user's account
 */
export const AccountGroup = HttpApiGroup.make("account")
	.add(
		HttpApiEndpoint.del("deleteAccount", "/")
			.addSuccess(DeleteAccountResponseSchema)
			.addError(Unauthorized, { status: 401 })
			.addError(DatabaseError, { status: 500 }),
	)
	.middleware(AuthMiddleware)
	.prefix("/account");

// Export TypeScript types for frontend use
export type DeleteAccountResponse = typeof DeleteAccountResponseSchema.Type;
