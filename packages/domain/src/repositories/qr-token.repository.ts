/**
 * QR Token Repository Interface (Story 34-1)
 *
 * Port for QR token CRUD operations.
 * Tokens have 6h TTL. Expiry is derived at query time — no background cron.
 * Accept is atomic: WHERE status = active AND expires_at > NOW() AND user_id != acceptedByUserId.
 */

import { Context, Effect } from "effect";
import {
	DatabaseError,
	QrTokenAlreadyAcceptedError,
	QrTokenExpiredError,
	QrTokenNotFoundError,
	SelfInvitationError,
} from "../errors/http.errors";
import type { QrToken } from "../types/relationship.types";

export class QrTokenRepository extends Context.Tag("QrTokenRepository")<
	QrTokenRepository,
	{
		/**
		 * Generate a new QR token with 6h TTL.
		 * Uses crypto.randomUUID() for URL-safe unique tokens.
		 */
		readonly generate: (userId: string) => Effect.Effect<QrToken, DatabaseError>;

		/**
		 * Get a QR token by its token string.
		 * Derives expired status at application level.
		 */
		readonly getByToken: (
			token: string,
		) => Effect.Effect<QrToken, DatabaseError | QrTokenNotFoundError>;

		/**
		 * Lightweight status check with derived expiry.
		 * Returns "valid" for active non-expired tokens, "accepted" for accepted, "expired" otherwise.
		 */
		readonly getStatus: (
			token: string,
		) => Effect.Effect<"valid" | "accepted" | "expired", DatabaseError | QrTokenNotFoundError>;

		/**
		 * Atomic accept with guards:
		 * - Token must be active and not expired
		 * - Cannot accept your own token
		 * - Cannot accept an already-accepted token
		 */
		readonly accept: (input: {
			token: string;
			acceptedByUserId: string;
		}) => Effect.Effect<
			QrToken,
			| DatabaseError
			| QrTokenNotFoundError
			| QrTokenExpiredError
			| QrTokenAlreadyAcceptedError
			| SelfInvitationError
		>;

		/**
		 * Expire a token. Used when generating a new token to expire existing active tokens.
		 */
		readonly expireToken: (token: string) => Effect.Effect<void, DatabaseError>;

		/**
		 * Get active (non-expired) token for a user.
		 * Returns null if no active token exists.
		 */
		readonly getActiveByUserId: (userId: string) => Effect.Effect<QrToken | null, DatabaseError>;
	}
>() {}
