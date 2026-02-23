/**
 * Conversanalyzer Repository Interface
 *
 * Pure interface for Haiku-based personality evidence extraction.
 * Analyzes each user message to extract Big Five facet evidence with domain tags.
 *
 * Story 10.2
 */
import { Context, Effect } from "effect";
import * as S from "effect/Schema";
import type { EvidenceInput } from "../types/evidence";
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

export interface ConversanalyzerOutput {
	/** Extracted facet evidence (0-3 records) */
	readonly evidence: EvidenceInput[];
	/** Token usage for cost tracking */
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

export class ConversanalyzerRepository extends Context.Tag("ConversanalyzerRepository")<
	ConversanalyzerRepository,
	{
		readonly analyze: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerOutput, ConversanalyzerError>;
	}
>() {}
