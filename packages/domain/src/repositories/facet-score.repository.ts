import type { DatabaseError } from "@workspace/contracts/errors";
import { Context, type Effect } from "effect";
import type { FacetScoresMap } from "../types/facet-evidence";

/**
 * Facet Score Repository Service Tag
 *
 * Reads persisted aggregated facet scores from the database.
 * These are scores that have already been computed by the Scorer
 * and stored in the facet_scores table.
 */
export class FacetScoreRepository extends Context.Tag("FacetScoreRepository")<
	FacetScoreRepository,
	{
		/**
		 * Get all facet scores for a session
		 *
		 * Returns a complete FacetScoresMap with all 30 facets.
		 * Facets without stored scores use defaults (score=10, confidence=0).
		 *
		 * @param sessionId - Assessment session identifier
		 * @returns Complete FacetScoresMap (30 facets)
		 */
		readonly getBySession: (sessionId: string) => Effect.Effect<FacetScoresMap, DatabaseError, never>;
	}
>() {}
