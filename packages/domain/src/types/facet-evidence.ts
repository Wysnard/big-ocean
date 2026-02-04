/**
 * Facet Evidence and Scoring Types
 *
 * Type definitions for the evidence-based personality assessment system.
 * These types represent the data flow: Message → FacetEvidence → FacetScore → TraitScore
 */

import type { FacetName, TraitName } from "../constants/big-five";

// Re-export for convenience
export type { FacetName, TraitName };

/**
 * Highlight Range
 *
 * Character indices for highlighting a quote in the original message.
 * Used by the frontend to show which part of the message triggered a facet detection.
 */
export interface HighlightRange {
	/** Starting character index (0-based) */
	start: number;
	/** Ending character index (exclusive) */
	end: number;
}

/**
 * Facet Evidence (Analyzer Output)
 *
 * Represents a single facet signal detected by the Analyzer from a user message.
 * This is the input type - id and createdAt are added by the database.
 *
 * Storage: facet_evidence table (one row per detection)
 * Lifecycle: Created on every message analysis, never updated
 */
export interface FacetEvidence {
	/** Reference to the assessment message this evidence came from (UUID) */
	assessmentMessageId: string;

	/** Clean facet name (e.g., "imagination", "altruism") */
	facetName: FacetName;

	/**
	 * Score: 0-20 scale
	 * The analyzer's interpretation for THIS message only.
	 * 0 = Strong negative signal, 10 = Neutral, 20 = Strong positive signal
	 */
	score: number;

	/**
	 * Confidence: 0-100 (integer)
	 * How confident the analyzer is in this interpretation.
	 * 0 = No confidence, 50 = Moderate confidence, 100 = Complete confidence
	 */
	confidence: number;

	/** Exact phrase from message that triggered this facet detection */
	quote: string;

	/** Character indices for highlighting the quote in the UI */
	highlightRange: HighlightRange;
}

/**
 * Saved Facet Evidence (Database Record)
 *
 * Represents a facet evidence record returned from the database.
 * Includes the id and createdAt timestamp added by the database.
 */
export interface SavedFacetEvidence extends FacetEvidence {
	/** Unique identifier (UUID) */
	id: string;

	/** When this evidence was created */
	createdAt: Date;
}

/**
 * Facet Score Value (Aggregated from Evidence)
 *
 * Represents an aggregated score for a single facet across multiple messages.
 * Computed by the Scorer using weighted averaging with recency bias and
 * contradiction detection via variance analysis.
 *
 * Storage: facet_scores table (one row per session-facet pair, updated every 3 messages)
 * Lifecycle: Created/updated during aggregation, replaces previous value
 *
 * Note: facetName is stored as the map key, not in the value itself.
 */
export interface FacetScore {
	/**
	 * Aggregated score: 0-20 scale
	 * Weighted average of all evidence scores for this facet.
	 * Recent messages weighted higher (recency bias).
	 */
	score: number;

	/**
	 * Aggregated confidence: 0-100 (integer)
	 * Adjusted confidence based on:
	 * - Average evidence confidence
	 * - Variance penalty (contradictions lower confidence)
	 * - Sample size bonus (more evidence increases confidence)
	 */
	confidence: number;

	/**
	 * Sample Size
	 * Number of evidence records used to compute this score.
	 * Not stored in DB - computed on-demand from evidence count.
	 */
	sampleSize?: number;

	/**
	 * Variance
	 * Measure of contradiction (high variance = conflicting signals).
	 * Not stored in DB - computed on-demand from evidence scores.
	 */
	variance?: number;
}

/**
 * Trait Score (Derived from Facet Scores)
 *
 * Represents a Big Five trait score derived from its 6 constituent facet scores.
 * Each trait score is the sum of its related facets (0-120 scale).
 *
 * Storage: trait_scores table (one row per session-trait pair, updated with facet scores)
 * Lifecycle: Created/updated when facet scores are aggregated, replaces previous value
 *
 * Note: traitName is stored as the map key, not in the value itself.
 */
export interface TraitScore {
	/**
	 * Trait score: 0-120 scale
	 * Sum of the 6 related facet scores (each 0-20).
	 * Enables stacked bar visualization where each facet segment
	 * contributes proportionally to the total trait score.
	 *
	 * @example
	 * Openness score = sum(imagination, artistic_interests, emotionality,
	 *                      adventurousness, intellect, liberalism)
	 * // If each facet is 15: total = 90/120
	 */
	score: number;

	/**
	 * Trait confidence: 0-100 (integer)
	 * Minimum confidence across the 6 related facets (conservative estimate).
	 * A trait is only as confident as its least confident facet.
	 */
	confidence: number;
}

/**
 * Facet Scores Map
 *
 * Complete map of all 30 facet scores.
 * Always initialized with all facets (default: score=10, confidence=0).
 * Used by the Scorer to return aggregated results.
 */
export type FacetScoresMap = Record<FacetName, FacetScore>;

/**
 * Trait Scores Map
 *
 * Complete map of all 5 trait scores.
 * Always initialized with all traits (default: score=60, confidence=0).
 * Used by the Scorer to return derived trait results.
 */
export type TraitScoresMap = Record<TraitName, TraitScore>;
