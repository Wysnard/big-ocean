/**
 * Relationship Analysis Generator Repository Interface (Story 14.4)
 *
 * Port for generating relationship personality comparison analyses via LLM.
 * Production implementation uses Claude Sonnet.
 */

import { Context, Data, Effect } from "effect";
import type { FacetScoresMap } from "../types/facet-evidence";
import type { ConversationEvidenceRecord } from "./conversation-evidence.repository";

export interface RelationshipAnalysisGenerationInput {
	readonly userAFacetScores: FacetScoresMap;
	readonly userAEvidence: ReadonlyArray<ConversationEvidenceRecord>;
	readonly userAName: string;
	readonly userBFacetScores: FacetScoresMap;
	readonly userBEvidence: ReadonlyArray<ConversationEvidenceRecord>;
	readonly userBName: string;
}

export interface RelationshipAnalysisGenerationOutput {
	readonly content: string;
	readonly modelUsed: string;
}

export class RelationshipAnalysisGenerationError extends Data.TaggedError(
	"RelationshipAnalysisGenerationError",
)<{
	readonly message: string;
	readonly cause?: string;
}> {}

export class RelationshipAnalysisGeneratorRepository extends Context.Tag(
	"RelationshipAnalysisGeneratorRepository",
)<
	RelationshipAnalysisGeneratorRepository,
	{
		readonly generateAnalysis: (
			input: RelationshipAnalysisGenerationInput,
		) => Effect.Effect<RelationshipAnalysisGenerationOutput, RelationshipAnalysisGenerationError>;
	}
>() {}
