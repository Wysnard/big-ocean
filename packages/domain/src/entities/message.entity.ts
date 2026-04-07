import { Schema } from "effect";

/**
 * Message Entity
 *
 * Represents a single message in an assessment conversation.
 *
 * Story 23-3: Removed userId, territoryId, observedEnergyLevel
 * (moved to assessment_exchange table). Added optional exchangeId FK.
 */
export const MessageEntitySchema = Schema.Struct({
	id: Schema.UUID,
	sessionId: Schema.UUID,
	exchangeId: Schema.optionalWith(Schema.NullOr(Schema.UUID), { default: () => null }),
	role: Schema.Union(Schema.Literal("user"), Schema.Literal("assistant")),
	content: Schema.String,
	createdAt: Schema.DateFromSelf,
});

export type MessageEntity = Schema.Schema.Type<typeof MessageEntitySchema>;
