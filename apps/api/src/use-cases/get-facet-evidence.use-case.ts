/**
 * Get Facet Evidence Use Case
 *
 * Business logic for retrieving facet evidence records from a session.
 * Fetches all evidence for a specific facet, sorted by creation time (most recent first).
 *
 * Dependencies: FacetEvidenceRepository, LoggerRepository
 */

import { FacetEvidenceRepository, type FacetName, LoggerRepository } from "@workspace/domain";
import { Effect } from "effect";

export interface GetFacetEvidenceInput {
	readonly sessionId: string;
	readonly facetName: FacetName;
}

/**
 * Get Facet Evidence Use Case
 *
 * 1. Fetches all evidence records for a specific facet in a session
 * 2. Sorts by createdAt DESC (most recent first)
 * 3. Returns array of SavedFacetEvidence with message references for "Jump to Message"
 */
export const getFacetEvidence = (input: GetFacetEvidenceInput) =>
	Effect.gen(function* () {
		const evidenceRepo = yield* FacetEvidenceRepository;
		const logger = yield* LoggerRepository;

		logger.info("Fetching facet evidence", {
			sessionId: input.sessionId,
			facetName: input.facetName,
		});

		// Fetch evidence sorted by createdAt DESC (most recent first)
		const evidence = yield* evidenceRepo.getEvidenceByFacet(input.sessionId, input.facetName);

		// Sort by createdAt descending to show most recent evidence first
		const sortedEvidence = evidence.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		logger.info("Facet evidence retrieved", {
			sessionId: input.sessionId,
			facetName: input.facetName,
			evidenceCount: sortedEvidence.length,
		});

		return sortedEvidence;
	});
