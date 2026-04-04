/**
 * Pacing Pipeline Types (Retained)
 *
 * Only ExtractionTier survives the Director Model cleanup (Story 44-1).
 * It is still used by the assessment_exchange table and extraction pipeline.
 */

/**
 * Extraction Tier — which retry tier produced the extraction result.
 * 1 = strict schema succeeded, 2 = lenient schema, 3 = neutral defaults
 */
export type ExtractionTier = 1 | 2 | 3;
