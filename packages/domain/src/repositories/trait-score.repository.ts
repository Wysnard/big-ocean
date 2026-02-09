import type { DatabaseError } from "@workspace/contracts/errors";
import { Context, type Effect } from "effect";
import type { TraitScoresMap } from "../types/facet-evidence";

/**
 * Trait Score Repository Service Tag
 *
 * Reads persisted trait scores from the database.
 * These are scores derived from aggregated facet scores by the Scorer
 * and stored in the trait_scores table.
 */
export class TraitScoreRepository extends Context.Tag("TraitScoreRepository")<
	TraitScoreRepository,
	{
		/**
		 * Get all trait scores for a session
		 *
		 * Returns a complete TraitScoresMap with all 5 traits.
		 * Traits without stored scores use defaults (score=60, confidence=0).
		 *
		 * @param sessionId - Assessment session identifier
		 * @returns Complete TraitScoresMap (5 traits)
		 */
		readonly getBySession: (sessionId: string) => Effect.Effect<TraitScoresMap, DatabaseError, never>;
	}
>() {}
