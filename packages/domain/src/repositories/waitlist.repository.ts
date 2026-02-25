/**
 * Waitlist Repository Interface (Story 15.3)
 *
 * Simple email capture for circuit breaker waitlist.
 */

import { Context, type Effect } from "effect";
import type { DatabaseError } from "../errors/http.errors";

/**
 * Waitlist Repository Methods
 */
export interface WaitlistMethods {
	/**
	 * Add email to waitlist — silently handles duplicates via upsert
	 * @param email - Email address to capture
	 */
	readonly addEmail: (email: string) => Effect.Effect<void, DatabaseError>;
}

/**
 * Waitlist Repository Tag
 */
export class WaitlistRepository extends Context.Tag("WaitlistRepository")<
	WaitlistRepository,
	WaitlistMethods
>() {}
