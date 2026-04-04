/**
 * Conversanalyzer Repository Interface
 *
 * Pure interface for Haiku-based personality evidence extraction.
 * Evidence-only — user-state extraction removed in Story 43-6
 * (Director reads energy/telling natively from conversation history).
 *
 * Story 10.2 (v1), Story 24-1 (v2 evolution), Story 42-2 (split calls), Story 43-6 (strip user-state)
 */
import { Context, Effect } from "effect";
import * as S from "effect/Schema";
import type { EvidenceInput, EvidencePolarity } from "../types/evidence";
import type { DomainMessage } from "../types/message";
import type { DomainDistribution } from "../utils/domain-distribution";

export class ConversanalyzerError extends S.TaggedError<ConversanalyzerError>()(
	"ConversanalyzerError",
	{ message: S.String },
) {}

export interface ConversanalyzerInput {
	/** The current user message text */
	readonly message: string;
	/** Recent conversation messages (last 6, including current) */
	readonly recentMessages: readonly DomainMessage[];
	/** Current evidence distribution across life domains */
	readonly domainDistribution: DomainDistribution;
}

/** Evidence output — standalone extraction result */
export interface ConversanalyzerEvidenceOutput {
	readonly evidence: (EvidenceInput & {
		readonly note: string;
		readonly polarity: EvidencePolarity;
	})[];
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

export class ConversanalyzerRepository extends Context.Tag("ConversanalyzerRepository")<
	ConversanalyzerRepository,
	{
		/** Evidence extraction only — strict schema */
		readonly analyzeEvidence: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerEvidenceOutput, ConversanalyzerError>;
		/** Evidence extraction only — lenient schema */
		readonly analyzeEvidenceLenient: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerEvidenceOutput, ConversanalyzerError>;
	}
>() {}
