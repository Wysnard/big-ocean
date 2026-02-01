import { Schema } from "effect";

/**
 * Message Entity
 */
export const MessageEntitySchema = Schema.Struct({
  id: Schema.String,
  sessionId: Schema.String,
  userId: Schema.optional(Schema.String),
  role: Schema.Literal("user", "assistant"),
  content: Schema.String,
  createdAt: Schema.Date,
});

export type MessageEntity = Schema.Schema.Type<typeof MessageEntitySchema>;
