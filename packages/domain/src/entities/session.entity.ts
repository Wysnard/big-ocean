import { Schema } from "effect";

/**
 * Facet Confidence Entity Schema
 *
 * Stores confidence for all 30 Big Five facets.
 * Values are 0-100 integers representing confidence level.
 *
 * NOTE: Confidence is ALWAYS stored at facet level.
 * Trait confidence is ALWAYS computed from facet confidence, never stored.
 */
export const FacetConfidenceEntitySchema = Schema.Struct({
	// Openness facets
	imagination: Schema.Number,
	artistic_interests: Schema.Number,
	emotionality: Schema.Number,
	adventurousness: Schema.Number,
	intellect: Schema.Number,
	liberalism: Schema.Number,
	// Conscientiousness facets
	self_efficacy: Schema.Number,
	orderliness: Schema.Number,
	dutifulness: Schema.Number,
	achievement_striving: Schema.Number,
	self_discipline: Schema.Number,
	cautiousness: Schema.Number,
	// Extraversion facets
	friendliness: Schema.Number,
	gregariousness: Schema.Number,
	assertiveness: Schema.Number,
	activity_level: Schema.Number,
	excitement_seeking: Schema.Number,
	cheerfulness: Schema.Number,
	// Agreeableness facets
	trust: Schema.Number,
	morality: Schema.Number,
	altruism: Schema.Number,
	cooperation: Schema.Number,
	modesty: Schema.Number,
	sympathy: Schema.Number,
	// Neuroticism facets
	anxiety: Schema.Number,
	anger: Schema.Number,
	depression: Schema.Number,
	self_consciousness: Schema.Number,
	immoderation: Schema.Number,
	vulnerability: Schema.Number,
});

export type FacetConfidenceEntity = Schema.Schema.Type<typeof FacetConfidenceEntitySchema>;

// For backward compatibility
export const FacetPrecisionEntitySchema = FacetConfidenceEntitySchema;
export type FacetPrecisionEntity = FacetConfidenceEntity;

export const AssessmentSessionEntitySchema = Schema.Struct({
	id: Schema.UUID,
	userId: Schema.NullOr(Schema.UUID),
	createdAt: Schema.DateFromSelf,
	updatedAt: Schema.DateFromSelf,
	status: Schema.Literal("active", "paused", "completed", "archived"),
	messageCount: Schema.Number,
});

export type AssessmentSessionEntity = Schema.Schema.Type<typeof AssessmentSessionEntitySchema>;
