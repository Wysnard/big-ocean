/**
 * Evidence Error Types
 *
 * Tagged error types for facet evidence persistence operations.
 * Uses Effect Schema pattern for JSON-serializable errors.
 */

import { Schema } from "effect";

/**
 * Error when persisting facet evidence fails.
 */
export class FacetEvidencePersistenceError extends Schema.TaggedError<FacetEvidencePersistenceError>()(
	"FacetEvidencePersistenceError",
	{
		assessmentMessageId: Schema.String,
		reason: Schema.String,
		evidenceCount: Schema.Number,
	},
) {}

/**
 * Error when evidence validation fails.
 */
export class EvidenceValidationError extends Schema.TaggedError<EvidenceValidationError>()(
	"EvidenceValidationError",
	{
		assessmentMessageId: Schema.String,
		field: Schema.String,
		value: Schema.Unknown,
		reason: Schema.String,
	},
) {}
