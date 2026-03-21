import { AssessmentSessionEntity } from "@workspace/domain/entities/session.entity";
import { Context, Effect } from "effect";
import { ConcurrentMessageError, DatabaseError, SessionNotFound } from "../errors/http.errors";

/**
 * Session Repository Service Tag
 *
 * Service interface has NO requirements - dependencies managed by layer.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */
export class AssessmentSessionRepository extends Context.Tag("AssessmentSessionRepository")<
	AssessmentSessionRepository,
	{
		/**
		 * Create a new assessment session
		 *
		 * @param userId - Optional user ID (NULL for anonymous sessions)
		 * @returns Effect with session entity (including empty messages array)
		 */
		readonly createSession: (
			userId?: string,
		) => Effect.Effect<{ sessionId: string }, DatabaseError, never>;

		/**
		 * Find an active session for a user
		 *
		 * @param userId - User ID to look up
		 * @returns Effect with session entity or null if none found
		 */
		readonly getActiveSessionByUserId: (
			userId: string,
		) => Effect.Effect<AssessmentSessionEntity | null, DatabaseError, never>;

		/**
		 * Retrieve full session with message history
		 *
		 * @param sessionId - Session identifier
		 * @returns Effect with session entity or SessionNotFoundError
		 */
		readonly getSession: (
			sessionId: string,
		) => Effect.Effect<AssessmentSessionEntity, SessionNotFound | DatabaseError, never>;

		/**
		 * Update session properties (precision scores, status, etc.)
		 *
		 * @param sessionId - Session identifier
		 * @param session - Partial session properties to update
		 * @returns Effect with updated session entity
		 */
		readonly updateSession: (
			sessionId: string,
			session: Partial<AssessmentSessionEntity>,
		) => Effect.Effect<AssessmentSessionEntity, DatabaseError, never>;

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
		 * Create an anonymous session with a cryptographic token (Story 9.1)
		 *
		 * @returns Effect with sessionId and sessionToken
		 */
		readonly createAnonymousSession: () => Effect.Effect<
			{ sessionId: string; sessionToken: string },
			DatabaseError,
			never
		>;

		/**
		 * Find a session by its anonymous session token (Story 9.1)
		 *
		 * @param token - Session token from httpOnly cookie
		 * @returns Effect with session entity or null if token invalid
		 */
		readonly findByToken: (
			token: string,
		) => Effect.Effect<AssessmentSessionEntity | null, DatabaseError, never>;

		/**
		 * Assign a user ID to an anonymous session (Story 9.4)
		 *
		 * @param sessionId - Session to assign
		 * @param userId - User ID to assign
		 * @returns Effect with updated session entity
		 */
		readonly assignUserId: (
			sessionId: string,
			userId: string,
		) => Effect.Effect<AssessmentSessionEntity, DatabaseError, never>;

		/**
		 * Rotate the session token (for auth transition security, Story 9.4)
		 *
		 * @param sessionId - Session to rotate token for
		 * @returns Effect with new token
		 */
		readonly rotateToken: (
			sessionId: string,
		) => Effect.Effect<{ sessionToken: string }, DatabaseError, never>;

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
