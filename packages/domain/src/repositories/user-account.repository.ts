/**
 * User Account Repository Interface
 *
 * Defines the contract for user account management operations,
 * specifically account deletion with cascade cleanup.
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
		 * Delete a user account and all associated data.
		 *
		 * Deletion order (to avoid FK violations):
		 * 1. Delete relationship_analyses where user is participant
		 * 2. Delete relationship_invitations where user is inviter or invitee
		 * 3. Delete purchase_events for user
		 * 4. Delete assessment_sessions by user_id (cascades to messages, evidence, exchanges, results, portraits, public profiles)
		 * 5. Delete user row (cascades to Better Auth sessions, accounts, portrait_ratings)
		 *
		 * @returns true if user was found and deleted, false if user not found
		 */
		readonly deleteAccount: (userId: string) => Effect.Effect<boolean, DatabaseError>;
	}
>() {}
