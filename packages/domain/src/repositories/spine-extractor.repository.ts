import { Context, Effect } from "effect";
import type { FacetScoresMap, TraitScoresMap } from "../types/facet-evidence";
import type { PortraitUserSummaryInput } from "../types/portrait-user-summary-input";
import type { SpineBrief } from "../types/spine-brief";
import { PortraitGenerationError } from "./portrait-pipeline.errors";

export interface SpineExtractorInput {
	readonly sessionId: string;
	readonly userSummary: PortraitUserSummaryInput;
	readonly facetScoresMap: FacetScoresMap;
	readonly traitScoresMap: TraitScoresMap;
	/** Appended on second extraction attempt when verifier supplies gap feedback. */
	readonly gapFeedback?: string;
}

export class SpineExtractorRepository extends Context.Tag("SpineExtractorRepository")<
	SpineExtractorRepository,
	{
		readonly extractSpineBrief: (
			input: SpineExtractorInput,
		) => Effect.Effect<SpineBrief, PortraitGenerationError, never>;
	}
>() {}
