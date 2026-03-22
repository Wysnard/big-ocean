import type { AssessmentMessageEntity } from "@workspace/domain/entities/message.entity";
import { Context, Effect } from "effect";
import { DatabaseError } from "../errors/http.errors";

/**
 * Message Repository Service Tag
 *
 * Service interface for message persistence operations.
 * Follows official Effect pattern from https://effect.website/docs/requirements-management/services/
 *
 * Story 23-3: Simplified saveMessage signature — removed userId, territoryId, observedEnergyLevel
 * (these now live on assessment_exchange). Added optional exchangeId.
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
		 * @param exchangeId - Optional exchange ID linking to assessment_exchange
		 * @returns Effect with created message entity
		 */
		readonly saveMessage: (
			sessionId: string,
			role: "user" | "assistant",
			content: string,
			exchangeId?: string,
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
		 * Update the exchangeId on an existing message.
		 * Used to link a user message to the previous exchange after creation.
		 */
		readonly updateExchangeId: (
			messageId: string,
			exchangeId: string,
		) => Effect.Effect<void, DatabaseError, never>;

		/**
		 * Get all messages for a user across all sessions
		 *
		 * @param userId - User identifier
		 * @returns Effect with array of messages in chronological order across all sessions
		 */
		readonly getMessagesByUserId: (
			userId: string,
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
