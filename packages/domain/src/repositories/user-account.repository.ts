/**
 * User Account Repository Interface
 *
 * Defines the contract for user account management operations.
 * Account deletion relies on PostgreSQL FK cascades — deleting the user row
 * automatically removes all associated data.
 *
 * Part of the hexagonal architecture - this is a PORT (interface).
 *
 * @see packages/infrastructure/src/repositories/user-account.drizzle.repository.ts
 */

import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

/**
 * User Account Repository Service Tag
 *
 * Service interface has NO requirements - dependencies managed by layer.
 */
export class UserAccountRepository extends Context.Tag("UserAccountRepository")<
	UserAccountRepository,
	{
		/**
		 * Read whether the authenticated user's first Me-page visit has been completed.
		 *
		 * @returns false for users who have not yet completed their first visit
		 */
		readonly getFirstVisitCompleted: (userId: string) => Effect.Effect<boolean, DatabaseError>;

		/**
		 * Mark the authenticated user's first Me-page visit as completed.
		 *
		 * @returns true if the user existed and was updated, false if the user was not found
		 */
		readonly markFirstVisitCompleted: (userId: string) => Effect.Effect<boolean, DatabaseError>;

		/**
		 * Delete a user account and all associated data.
		 *
		 * All child rows are removed via PostgreSQL onDelete: "cascade" FKs.
		 * A single DELETE on the user table cascades to: sessions, accounts,
		 * assessment sessions (→ messages, evidence, exchanges, results, portraits,
		 * public profiles), purchase events, portrait ratings, relationship
		 * invitations, and relationship analyses.
		 *
		 * @returns true if user was found and deleted, false if user not found
		 */
		readonly deleteAccount: (userId: string) => Effect.Effect<boolean, DatabaseError>;
	}
>() {}
