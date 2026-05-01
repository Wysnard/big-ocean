import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

export interface ClaimPortraitJobOfferInput {
	readonly sessionId: string;
	readonly userId: string;
	readonly jobKey: string;
}

/**
 * Ledger for at-most-once portrait queue offers.
 *
 * The portrait worker queue is in-memory; this repository provides durable dedupe keyed by (session, jobKey).
 */
export class PortraitJobOfferRepository extends Context.Tag("PortraitJobOfferRepository")<
	PortraitJobOfferRepository,
	{
		/**
		 * Returns true if this call inserted a new offer row (caller should enqueue),
		 * false if the offer already existed (caller should skip enqueue).
		 */
		readonly claimOffer: (input: ClaimPortraitJobOfferInput) => Effect.Effect<boolean, DatabaseError>;

		/**
		 * Deletes offers whose jobKey starts with the given prefix for a session.
		 * Used by manual portrait retry to allow a fresh enqueue after deleting the failed portrait row.
		 */
		readonly deleteOffersByJobKeyPrefix: (
			sessionId: string,
			jobKeyPrefix: string,
		) => Effect.Effect<void, DatabaseError>;
	}
>() {}
