import { ConversationEntity } from "@workspace/domain/entities/conversation.entity";
import { Context, Effect } from "effect";
import { ConcurrentMessageError, DatabaseError, SessionNotFound } from "../errors/http.errors";

/**
 * Session Repository Service Tag
 *
 * Service interface has NO requirements - dependencies managed by layer.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */
export class ConversationRepository extends Context.Tag("ConversationRepository")<
	ConversationRepository,
	{
		/**
		 * Create a new assessment session
		 *
		 * @param userId - Authenticated user ID
		 * @returns Effect with session entity (including empty messages array)
		 */
		readonly createSession: (
			userId: string,
		) => Effect.Effect<{ sessionId: string }, DatabaseError, never>;

		/**
		 * Find an active session for a user
		 *
		 * @param userId - User ID to look up
		 * @returns Effect with session entity or null if none found
		 */
		readonly getActiveSessionByUserId: (
			userId: string,
		) => Effect.Effect<ConversationEntity | null, DatabaseError, never>;

		/**
		 * Retrieve full session with message history
		 *
		 * @param sessionId - Session identifier
		 * @returns Effect with session entity or SessionNotFoundError
		 */
		readonly getSession: (
			sessionId: string,
		) => Effect.Effect<ConversationEntity, SessionNotFound | DatabaseError, never>;

		/**
		 * Update session properties (precision scores, status, etc.)
		 *
		 * @param sessionId - Session identifier
		 * @param session - Partial session properties to update
		 * @returns Effect with updated session entity
		 */
		readonly updateSession: (
			sessionId: string,
			session: Partial<ConversationEntity>,
		) => Effect.Effect<ConversationEntity, DatabaseError, never>;

		/**
		 * Get all assessment sessions for a user, ordered by creation date descending.
		 * Includes computed messageCount from assessment_message table and optional
		 * archetype data from public_profile join.
		 *
		 * @param userId - Authenticated user ID
		 * @returns Effect with array of session summaries (empty array if none)
		 */
		readonly getSessionsByUserId: (userId: string) => Effect.Effect<
			Array<{
				id: string;
				createdAt: Date;
				updatedAt: Date;
				status: string;
				messageCount: number;
				oceanCode5: string | null;
				archetypeName: string | null;
			}>,
			DatabaseError,
			never
		>;

		/**
		 * Find the most recent assessment session for a user.
		 * Returns the newest session or null if the user has no sessions.
		 *
		 * @param userId - Authenticated user ID
		 * @returns Effect with session summary or null
		 */
		readonly findSessionByUserId: (userId: string) => Effect.Effect<
			{
				id: string;
				createdAt: Date;
				updatedAt: Date;
				status: string;
				messageCount: number;
				oceanCode5: string | null;
				archetypeName: string | null;
			} | null,
			DatabaseError,
			never
		>;

		/**
		 * Atomically increment message_count and return the new value (Story 9.2)
		 *
		 * @param sessionId - Session identifier
		 * @returns Effect with the new message_count after increment
		 */
		readonly incrementMessageCount: (
			sessionId: string,
		) => Effect.Effect<number, DatabaseError, never>;

		/**
		 * Acquire a session-level advisory lock for concurrent message prevention (Story 10.5)
		 *
		 * Uses pg_try_advisory_lock(hashtext(sessionId)). Non-blocking — fails immediately
		 * with ConcurrentMessageError if the lock is already held.
		 *
		 * @param sessionId - Session identifier to lock
		 * @returns Effect that succeeds if lock acquired, fails with ConcurrentMessageError if contended
		 */
		readonly acquireSessionLock: (
			sessionId: string,
		) => Effect.Effect<void, ConcurrentMessageError | DatabaseError, never>;

		/**
		 * Release a session-level advisory lock (Story 10.5)
		 *
		 * @param sessionId - Session identifier to unlock
		 * @returns Effect that succeeds when lock is released
		 */
		readonly releaseSessionLock: (sessionId: string) => Effect.Effect<void, DatabaseError, never>;

		/**
		 * Find sessions eligible for drop-off re-engagement email (Story 31-7)
		 *
		 * Returns sessions where:
		 * - status is 'active' (in-progress)
		 * - updatedAt is older than thresholdHours ago
		 * - dropOffEmailSentAt IS NULL (not yet emailed)
		 * - userId IS NOT NULL (authenticated sessions only)
		 *
		 * JOINs with user table to include email and name.
		 *
		 * @param thresholdHours - Hours of inactivity before session is considered dropped-off
		 */
		readonly findDropOffSessions: (
			thresholdHours: number,
		) => Effect.Effect<Array<DropOffSession>, DatabaseError, never>;

		/**
		 * Mark a session as having had its drop-off email sent (Story 31-7)
		 *
		 * @param sessionId - Session to mark
		 */
		readonly markDropOffEmailSent: (sessionId: string) => Effect.Effect<void, DatabaseError, never>;

		/**
		 * Create a conversation extension session linked to a parent session (Story 36-1)
		 *
		 * @param userId - Authenticated user ID
		 * @param parentConversationId - ID of the completed conversation to extend
		 * @returns Effect with new session ID
		 */
		readonly createExtensionSession: (
			userId: string,
			parentConversationId: string,
		) => Effect.Effect<{ sessionId: string }, DatabaseError, never>;

		/**
		 * Atomically create an extension session plus exchange 0 and all greeting assistant messages (Story 8.3).
		 */
		readonly createExtensionSessionWithInitialTurn: (
			userId: string,
			parentConversationId: string,
			greetingContents: readonly string[],
		) => Effect.Effect<
			{
				sessionId: string;
				messages: ReadonlyArray<{
					role: "assistant";
					content: string;
					createdAt: Date;
				}>;
			},
			DatabaseError,
			never
		>;

		/**
		 * Find the most recent completed session that has no child extension session (Story 36-1)
		 *
		 * @param userId - Authenticated user ID
		 * @returns Effect with session entity or null if none eligible
		 */
		readonly findCompletedSessionWithoutChild: (
			userId: string,
		) => Effect.Effect<ConversationEntity | null, DatabaseError, never>;

		/**
		 * Check if a parent session already has a child extension session (Story 36-1)
		 *
		 * @param parentConversationId - Parent conversation ID to check
		 * @returns Effect with boolean — true if an extension session exists
		 */
		readonly hasExtensionSession: (
			parentConversationId: string,
		) => Effect.Effect<boolean, DatabaseError, never>;

		/**
		 * Find the active extension session for a given parent session (Story 36-1)
		 *
		 * @param parentConversationId - Parent conversation ID
		 * @returns Effect with session entity or null
		 */
		readonly findExtensionSession: (
			parentConversationId: string,
		) => Effect.Effect<ConversationEntity | null, DatabaseError, never>;

		/**
		 * Count completed extension sessions for a user, excluding one session id (Story 8.3).
		 * Used to detect first extension completion for bundled portrait (FR23).
		 */
		readonly countCompletedExtensionSessionsExcluding: (
			userId: string,
			excludeSessionId: string,
		) => Effect.Effect<number, DatabaseError, never>;

		/**
		 * Find sessions eligible for Nerin check-in email (Story 38-1)
		 *
		 * Returns sessions where:
		 * - status is 'completed'
		 * - updatedAt is older than thresholdDays ago
		 * - checkInEmailSentAt IS NULL (not yet emailed)
		 * - userId IS NOT NULL (authenticated sessions only)
		 *
		 * JOINs with user table to include email and name.
		 *
		 * @param thresholdDays - Days since completion before session is eligible for check-in
		 */
		readonly findCheckInEligibleSessions: (
			thresholdDays: number,
		) => Effect.Effect<Array<CheckInEligibleSession>, DatabaseError, never>;

		/**
		 * Mark a session as having had its check-in email sent (Story 38-1)
		 *
		 * @param sessionId - Session to mark
		 */
		readonly markCheckInEmailSent: (sessionId: string) => Effect.Effect<void, DatabaseError, never>;
	}
>() {}

/** Drop-off session record returned by findDropOffSessions */
export interface DropOffSession {
	readonly sessionId: string;
	readonly userId: string;
	readonly userEmail: string;
	readonly userName: string;
	readonly updatedAt: Date;
}

/** Check-in eligible session record returned by findCheckInEligibleSessions (Story 38-1) */
export interface CheckInEligibleSession {
	readonly sessionId: string;
	readonly userId: string;
	readonly userEmail: string;
	readonly userName: string;
	readonly updatedAt: Date;
}
