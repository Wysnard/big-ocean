/**
 * Agent Response Schemas
 *
 * Effect Schema definitions for all LLM agent structured outputs.
 * These schemas serve as the single source of truth for agent responses,
 * providing both TypeScript types and JSON Schema conversion for LangChain.
 *
 * Pattern:
 * 1. Define schema using @effect/schema
 * 2. Export both Effect Schema and JSON Schema (via JSONSchema.make)
 * 3. Use JSON Schema with LangChain's model.withStructuredOutput()
 * 4. Validate responses using Schema.decodeUnknownEither(schema)
 *
 * Benefits:
 * - Single source of truth (no Zod or raw JSON Schema)
 * - Full type safety with TypeScript
 * - Runtime validation
 * - Composability via Effect Schema features
 * - JSON Schema annotations help LLM understand structure
 */

import { JSONSchema, Schema as S } from "@effect/schema";
import { ALL_FACETS } from "../constants/big-five";

// ============================================================================
// Nerin Agent Response Schema
// ============================================================================

/**
 * Emotional tone options for Nerin's response
 */
export const EmotionalTone = S.Literal("warm", "curious", "supportive", "encouraging");

/**
 * Nerin Agent Response Schema
 *
 * Structured output for conversational agent responses.
 * Provides both the message content and metadata about the response style.
 */
export const NerinResponseSchema = S.Struct({
	/** The conversational response message */
	message: S.String.pipe(S.minLength(1)),

	/** The emotional tone of the response */
	emotionalTone: EmotionalTone,

	/** Whether Nerin is asking a follow-up question to continue the conversation */
	followUpIntent: S.Boolean,

	/** Suggested conversation topics for future exploration (optional hints) */
	suggestedTopics: S.Array(S.String),
});

/** Type inference for Nerin response */
export type NerinResponse = S.Schema.Type<typeof NerinResponseSchema>;

/**
 * JSON Schema for LangChain integration
 * Used with: model.withStructuredOutput(NerinResponseJsonSchema)
 */
export const NerinResponseJsonSchema = JSONSchema.make(NerinResponseSchema);

// ============================================================================
// Analyzer Agent Response Schema
// ============================================================================

/**
 * Highlight range for evidence quotes
 */
export const HighlightRangeSchema = S.Struct({
	/** Start character index (0-based, inclusive) */
	start: S.Number.pipe(S.int(), S.greaterThanOrEqualTo(0)).annotations({
		description: "Start character index (0-based, inclusive) in the original user message text",
	}),

	/** End character index (exclusive) */
	end: S.Number.pipe(S.int(), S.greaterThan(0)).annotations({
		description: "End character index (exclusive) in the original user message text",
	}),
}).annotations({
	description: "Character range in the original user message that contains the evidence quote",
});

/**
 * Single facet extraction result
 */
export const FacetExtractionSchema = S.Struct({
	/** The facet name (must be one of 30 Big Five facets) */
	facet: S.Literal(...(ALL_FACETS as readonly [string, ...string[]])).annotations({
		description:
			"One of the 30 Big Five personality facets (e.g. 'imagination', 'orderliness', 'cheerfulness'). Use clean facet names without trait prefixes.",
	}),

	/** Evidence quote from user message */
	evidence: S.String.pipe(S.minLength(1)).annotations({
		description:
			"Exact quote from the user message that reveals this personality signal. Preserve original formatting.",
	}),

	/** Score 0-20: Higher = stronger signal for that facet */
	score: S.Number.pipe(S.between(0, 20)).annotations({
		description: "Signal strength for this facet (0 = no signal, 20 = very strong signal)",
	}),

	/** Confidence score 0-100 (higher = more certain interpretation) */
	confidence: S.Number.pipe(S.between(0, 100)).annotations({
		description:
			"How certain you are that this quote genuinely reflects this facet (0 = guessing, 100 = unmistakable)",
	}),

	/** Character range in original message */
	highlightRange: HighlightRangeSchema,
}).annotations({
	description: "A single personality facet signal extracted from a user message",
});

/**
 * Analyzer Agent Response Schema
 *
 * Array of facet extractions from a single user message.
 * Only includes facets with clear evidence (typically 3-10 per message).
 */
export const AnalyzerResponseSchema = S.Array(FacetExtractionSchema);

/** Type inference for Analyzer response */
export type AnalyzerResponse = S.Schema.Type<typeof AnalyzerResponseSchema>;

/**
 * Wrapped Analyzer Response Schema
 *
 * Anthropic tool use requires the top-level JSON Schema to be an object, not an array.
 * This wraps the array in { extractions: [...] } for the LLM structured output call.
 * The repository unwraps .extractions before validation.
 */
export const AnalyzerResponseWrappedSchema = S.Struct({
	extractions: S.Array(FacetExtractionSchema).annotations({
		description:
			"Array of personality facet signals found in the user message. Include only facets with clear evidence (typically 3-10 per message). Return an empty array if no personality signals are present.",
	}),
}).annotations({
	description: "Personality facet extraction results from analyzing a user message",
});

/**
 * JSON Schema for LangChain integration (wrapped in object for Anthropic tool use)
 * Used with: model.withStructuredOutput(AnalyzerResponseJsonSchema)
 */
export const AnalyzerResponseJsonSchema = JSONSchema.make(AnalyzerResponseWrappedSchema);

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validates a Nerin response against the schema
 * @returns Either with validated response or validation error
 */
export const validateNerinResponse = S.decodeUnknownEither(NerinResponseSchema);

/**
 * Validates an Analyzer response against the schema
 * @returns Either with validated response or validation error
 */
export const validateAnalyzerResponse = S.decodeUnknownEither(AnalyzerResponseSchema);

// ============================================================================
// Batch Analyzer Agent Response Schema
// ============================================================================

/**
 * Single facet extraction with source message ID for batch analysis.
 * Extends FacetExtractionSchema with a message_id field to tag which
 * user message the extraction came from.
 */
export const BatchFacetExtractionSchema = S.Struct({
	/** The source user message ID this extraction came from */
	message_id: S.String.pipe(S.minLength(1)).annotations({
		description:
			"The ID of the user message this extraction came from (matches the [id: ...] annotation in the conversation)",
	}),

	/** The facet name (must be one of 30 Big Five facets) */
	facet: S.Literal(...(ALL_FACETS as readonly [string, ...string[]])).annotations({
		description:
			"One of the 30 Big Five personality facets (e.g. 'imagination', 'orderliness', 'cheerfulness'). Use clean facet names without trait prefixes.",
	}),

	/** Evidence quote from user message */
	evidence: S.String.pipe(S.minLength(1)).annotations({
		description:
			"Exact quote from the user message that reveals this personality signal. Preserve original formatting.",
	}),

	/** Score 0-20: Higher = stronger signal for that facet */
	score: S.Number.pipe(S.between(0, 20)).annotations({
		description: "Signal strength for this facet (0 = no signal, 20 = very strong signal)",
	}),

	/** Confidence score 0-100 (higher = more certain interpretation) */
	confidence: S.Number.pipe(S.between(0, 100)).annotations({
		description:
			"How certain you are that this quote genuinely reflects this facet (0 = guessing, 100 = unmistakable)",
	}),

	/** Character range in original message */
	highlightRange: HighlightRangeSchema,
}).annotations({
	description:
		"A single personality facet signal extracted from a specific user message in the batch",
});

/** Type inference for batch facet extraction */
export type BatchFacetExtraction = S.Schema.Type<typeof BatchFacetExtractionSchema>;

/**
 * Batch Analyzer Response Schema (wrapped)
 *
 * Wraps batch extractions in { extractions: [...] } for Anthropic tool use compatibility.
 */
export const BatchAnalyzerResponseWrappedSchema = S.Struct({
	extractions: S.Array(BatchFacetExtractionSchema).annotations({
		description:
			"Array of personality facet signals found across the analyzed user messages. Tag each extraction with the source message_id. Return an empty array if no personality signals are present in any of the target messages.",
	}),
}).annotations({
	description: "Batch personality facet extraction results from analyzing multiple user messages",
});

/**
 * JSON Schema for LangChain batch analysis integration
 * Used with: model.withStructuredOutput(BatchAnalyzerResponseJsonSchema)
 */
export const BatchAnalyzerResponseJsonSchema = JSONSchema.make(BatchAnalyzerResponseWrappedSchema);
