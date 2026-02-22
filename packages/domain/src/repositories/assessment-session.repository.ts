import { AssessmentSessionEntity } from "@workspace/domain/entities/session.entity";
import { Context, Effect } from "effect";
import { DatabaseError, SessionNotFound } from "../errors/http.errors";

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
	}
>() {}
