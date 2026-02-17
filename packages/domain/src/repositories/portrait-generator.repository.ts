import { Context, Data, Effect } from "effect";
import type { FacetScoresMap, SavedFacetEvidence } from "../types/facet-evidence";

/**
 * Input for portrait generation
 *
 * Pre-computed data from get-results use-case — generator only produces text.
 */
export interface PortraitGenerationInput {
	readonly sessionId: string;
	readonly facetScoresMap: FacetScoresMap;
	readonly topEvidence: ReadonlyArray<SavedFacetEvidence>;
	readonly archetypeName: string;
	readonly archetypeDescription: string;
	readonly oceanCode5: string;
	readonly messages: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
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
		 * @returns Effect with portrait as markdown string (6 sections with ## headers)
		 */
		readonly generatePortrait: (
			input: PortraitGenerationInput,
		) => Effect.Effect<string, PortraitGenerationError, never>;
	}
>() {}
