import { Context, Data, Effect } from "effect";
import type { FacetScoresMap, SavedFacetEvidence, TraitScoresMap } from "../types/facet-evidence";
import type { DomainMessage } from "../types/message";

/**
 * Input for portrait generation
 *
 * Pre-computed data from persisted assessment results — generator only produces text.
 */
export interface PortraitGenerationInput {
	readonly sessionId: string;
	readonly facetScoresMap: FacetScoresMap;
	readonly traitScoresMap: TraitScoresMap;
	readonly allEvidence: ReadonlyArray<SavedFacetEvidence>;
	readonly archetypeName: string;
	readonly archetypeDescription: string;
	readonly oceanCode5: string;
	readonly messages: ReadonlyArray<DomainMessage>;
}

/**
 * Portrait generation error — domain error, NOT TaggedError in contracts.
 * This error is caught internally by get-results use-case, never reaches HTTP layer.
 */
export class PortraitGenerationError extends Data.TaggedError("PortraitGenerationError")<{
	readonly sessionId: string;
	readonly message: string;
	readonly cause?: string;
}> {}

/**
 * Portrait Generator Repository — domain interface (port)
 *
 * Generates a personalized personality portrait using Claude API.
 * Production implementation: portrait-generator.claude.repository.ts
 */
export class PortraitGeneratorRepository extends Context.Tag("PortraitGeneratorRepository")<
	PortraitGeneratorRepository,
	{
		/**
		 * Generate a personalized portrait for a completed assessment.
		 *
		 * @param input - Pre-computed personality data and evidence
		 * @returns Effect with portrait as markdown string (4 sections: 1 h1 + 3 h2)
		 */
		readonly generatePortrait: (
			input: PortraitGenerationInput,
		) => Effect.Effect<string, PortraitGenerationError, never>;
	}
>() {}
