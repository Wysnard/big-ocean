import { Context, Effect } from "effect";
import { SessionNotFound, DatabaseError } from "@workspace/contracts/errors";
import { AssessmentSessionEntity } from "@workspace/domain/entities/session.entity";

/**
 * Session Repository Service Tag
 *
 * Service interface has NO requirements - dependencies managed by layer.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */
export class AssessmentSessionRepository extends Context.Tag(
  "AssessmentSessionRepository",
)<
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
     * Retrieve full session with message history
     *
     * @param sessionId - Session identifier
     * @returns Effect with session entity or SessionNotFoundError
     */
    readonly getSession: (
      sessionId: string,
    ) => Effect.Effect<
      AssessmentSessionEntity,
      SessionNotFound | DatabaseError,
      never
    >;

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
  }
>() {}
