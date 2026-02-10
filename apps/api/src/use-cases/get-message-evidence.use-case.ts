/**
 * Get Message Evidence Use Case
 *
 * Business logic for retrieving all facet evidence records from a specific message.
 * Fetches all evidence for a message, grouped and sorted by score (highest first).
 *
 * Dependencies: FacetEvidenceRepository, LoggerRepository
 */

import { FacetEvidenceRepository, LoggerRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface GetMessageEvidenceInput {
	readonly assessmentMessageId: string;
}

/**
 * Get Message Evidence Use Case
 *
 * 1. Fetches all facet evidence records for a specific message
 * 2. Sorts by score DESC (highest contributing facets first)
 * 3. Returns array of SavedFacetEvidence for UI display
 */
export const getMessageEvidence = (input: GetMessageEvidenceInput) =>
	Effect.gen(function* () {
		const evidenceRepo = yield* FacetEvidenceRepository;
		const logger = yield* LoggerRepository;

		logger.info("Fetching message evidence", {
			assessmentMessageId: input.assessmentMessageId,
		});

		// Fetch all facet evidence for this specific message
		const evidence = yield* evidenceRepo.getEvidenceByMessage(input.assessmentMessageId);

		// Sort by score descending to show highest contributing facets first
		const sortedEvidence = evidence.sort((a, b) => b.score - a.score);

		logger.info("Message evidence retrieved", {
			assessmentMessageId: input.assessmentMessageId,
			evidenceCount: sortedEvidence.length,
			facetsDetected: new Set(evidence.map((e) => e.facetName)).size,
		});

		return sortedEvidence;
	});
