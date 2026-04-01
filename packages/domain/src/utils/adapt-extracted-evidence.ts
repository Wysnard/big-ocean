/**
 * Adapt Extracted Evidence to Evidence Input (Story 42-1)
 *
 * Bridges the new polarity-based extraction model (ExtractedEvidence)
 * with the existing scoring formula input (EvidenceInput).
 *
 * The adapter derives deviation from polarity + strength using deriveDeviation(),
 * ensuring formula.ts receives the same deviation values it always has.
 */
import type { EvidenceInput, ExtractedEvidence } from "../types/evidence";
import { deriveDeviation } from "./derive-deviation";

/**
 * Converts an ExtractedEvidence (polarity model) into an EvidenceInput (deviation model).
 *
 * This is the single conversion point between the new extraction output and the
 * existing scoring pipeline. formula.ts remains completely unchanged.
 */
export function adaptExtractedEvidence(extracted: ExtractedEvidence): EvidenceInput {
	return {
		bigfiveFacet: extracted.bigfiveFacet,
		deviation: deriveDeviation(extracted.polarity, extracted.strength),
		strength: extracted.strength,
		confidence: extracted.confidence,
		domain: extracted.domain,
		note: extracted.note,
	};
}
