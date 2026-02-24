import type { FacetName, SavedFacetEvidence } from "../../../types/facet-evidence";

let evidenceIdCounter = 0;

/**
 * Creates a SavedFacetEvidence record for testing.
 */
export function createEvidence(
	facetName: FacetName,
	score: number,
	confidence: number,
	createdAt: Date = new Date(),
): SavedFacetEvidence {
	evidenceIdCounter++;
	return {
		id: `evidence_${evidenceIdCounter}`,
		assessmentMessageId: "msg_test",
		facetName,
		score,
		confidence,
		quote: "test quote",
		highlightRange: { start: 0, end: 10 },
		createdAt,
	};
}

/**
 * Creates multiple evidence records for a facet with sequential timestamps.
 */
export function createEvidenceSequence(
	facetName: FacetName,
	entries: Array<{ score: number; confidence: number }>,
): SavedFacetEvidence[] {
	const baseTime = new Date("2026-01-01T00:00:00Z").getTime();
	return entries.map((entry, idx) =>
		createEvidence(facetName, entry.score, entry.confidence, new Date(baseTime + idx * 60000)),
	);
}
