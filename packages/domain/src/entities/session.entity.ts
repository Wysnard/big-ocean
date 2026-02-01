import { Schema } from "effect";

export const PrecisionEntitySchema = Schema.Struct({
  openness: Schema.Number,
  conscientiousness: Schema.Number,
  extraversion: Schema.Number,
  agreeableness: Schema.Number,
  neuroticism: Schema.Number,
});

export type PrecisionEntity = Schema.Schema.Type<typeof PrecisionEntitySchema>;

export const AssessmentSessionEntitySchema = Schema.Struct({
  id: Schema.UUID,
  userId: Schema.NullOr(Schema.UUID),
  createdAt: Schema.DateFromSelf,
  updatedAt: Schema.DateFromSelf,
  status: Schema.Literal("active", "paused", "completed", "archived"),
  precision: PrecisionEntitySchema,
  messageCount: Schema.Number,
});

export type AssessmentSessionEntity = Schema.Schema.Type<
  typeof AssessmentSessionEntitySchema
>;
