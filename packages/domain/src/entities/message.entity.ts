import { Schema } from "effect";

/**
 * Message Entity
 *
 * Represents a single message in an assessment conversation.
 */
export const AssessmentHumanMessageEntitySchema = Schema.Struct({
	id: Schema.UUID,
	sessionId: Schema.UUID,
	userId: Schema.NullOr(Schema.UUID), // Null for anonymous users
	role: Schema.Literal("user"),
	content: Schema.String,
	createdAt: Schema.DateFromSelf,
});

export type AssessmentHumanMessageEntity = Schema.Schema.Type<
	typeof AssessmentHumanMessageEntitySchema
>;

export const AssessmentAssistantMessageEntitySchema = Schema.Struct({
	id: Schema.UUID,
	sessionId: Schema.UUID,
	role: Schema.Literal("assistant"),
	content: Schema.String,
	createdAt: Schema.DateFromSelf,
});

export type AssessmentAssistantMessageEntity = Schema.Schema.Type<
	typeof AssessmentAssistantMessageEntitySchema
>;

export const AssessmentMessageEntitySchema = Schema.Union(
	AssessmentHumanMessageEntitySchema,
	AssessmentAssistantMessageEntitySchema,
);

export type AssessmentMessageEntity = Schema.Schema.Type<typeof AssessmentMessageEntitySchema>;
