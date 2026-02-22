import type { FacetName } from "@workspace/domain/constants/big-five";
import type { LifeDomain } from "@workspace/domain/constants/life-domain";
import { AssessmentMessageEntity } from "@workspace/domain/entities/message.entity";
import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

/**
 * Message Repository Service Tag
 *
 * Service interface for message persistence operations.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 */
export class AssessmentMessageRepository extends Context.Tag("AssessmentMessageRepository")<
	AssessmentMessageRepository,
	{
		/**
		 * Save a message to a session
		 *
		 * @param sessionId - Session identifier
		 * @param role - Message sender role ('user' | 'assistant')
		 * @param content - Message content
		 * @param userId - Optional user ID for user messages
		 * @param targetDomain - Optional life domain for steering (assistant messages, Story 9.2)
		 * @param targetBigfiveFacet - Optional facet for steering (assistant messages, Story 9.2)
		 * @returns Effect with created message entity
		 */
		readonly saveMessage: (
			sessionId: string,
			role: "user" | "assistant",
			content: string,
			userId?: string,
			targetDomain?: LifeDomain,
			targetBigfiveFacet?: FacetName,
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
		readonly getMessageCount: (sessionId: string) => Effect.Effect<number, DatabaseError, never>;
	}
>() {}
