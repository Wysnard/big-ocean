import { Context, Effect } from "effect";
import { AssessmentMessageEntity } from "@workspace/domain/entities/message.entity";
import { DatabaseError } from "@workspace/contracts/errors";

/**
 * Message Repository Service Tag
 *
 * Service interface for message persistence operations.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */
export class AssessmentMessageRepository extends Context.Tag(
  "AssessmentMessageRepository",
)<
  AssessmentMessageRepository,
  {
    /**
     * Save a message to a session
     *
     * @param sessionId - Session identifier
     * @param role - Message sender role ('user' | 'assistant')
     * @param content - Message content
     * @param userId - Optional user ID for user messages
     * @returns Effect with created message entity
     */
    readonly saveMessage: (
      sessionId: string,
      role: "user" | "assistant",
      content: string,
      userId?: string,
    ) => Effect.Effect<AssessmentMessageEntity, DatabaseError, never>;

    /**
     * Get all messages for a session
     *
     * @param sessionId - Session identifier
     * @returns Effect with array of messages in chronological order
     */
    readonly getMessages: (
      sessionId: string,
    ) => Effect.Effect<AssessmentMessageEntity[], DatabaseError, never>;

    /**
     * Get message count for a session
     *
     * @param sessionId - Session identifier
     * @returns Effect with message count
     */
    readonly getMessageCount: (
      sessionId: string,
    ) => Effect.Effect<number, DatabaseError, never>;
  }
>() {}
