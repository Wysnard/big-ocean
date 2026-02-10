/**
 * Evidence-related Schemas
 *
 * Type definitions for facet evidence retrieval endpoints.
 *
 * NOTE: These schemas must stay in sync with domain types:
 * - SavedFacetEvidence → @workspace/domain/types/facet-evidence.ts
 * - FacetName → @workspace/domain/constants/big-five.ts (ALL_FACETS)
 *
 * TODO: Consider creating shared Effect schemas in domain package to eliminate duplication.
 */

import { Schema as S } from "effect";

/**
 * Highlight Range Schema
 *
 * Character indices for highlighting a quote in the original message.
 */
export const HighlightRangeSchema = S.Struct({
	start: S.Number,
	end: S.Number,
});

/**
 * Saved Facet Evidence Schema
 *
 * Represents a single piece of evidence linking a message quote to a facet score.
 * Used by both "getEvidenceByFacet" and "getEvidenceByMessage" endpoints.
 */
export const SavedFacetEvidenceSchema = S.Struct({
	/** Unique evidence ID (UUID) */
	id: S.String,

	/** Assessment message this evidence came from (UUID) */
	assessmentMessageId: S.String,

	/** Clean facet name (e.g., "imagination", "altruism") */
	facetName: S.String,

	/** Score: 0-20 scale */
	score: S.Number,

	/** Confidence: 0-100 (integer) */
	confidence: S.Number,

	/** Exact phrase from message that triggered this facet detection */
	quote: S.String,

	/** Character indices for highlighting the quote in the UI */
	highlightRange: HighlightRangeSchema,

	/** When this evidence was created */
	createdAt: S.Date,
});

// Export TypeScript types for frontend use
export type SavedFacetEvidence = typeof SavedFacetEvidenceSchema.Type;
export type HighlightRange = typeof HighlightRangeSchema.Type;
