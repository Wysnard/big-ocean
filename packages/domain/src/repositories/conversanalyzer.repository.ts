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

/**
 * ConversAnalyzer v1 observed energy level — categorical classification.
 * Will be replaced by EnergyBand (5-level) in ConversAnalyzer v2 (Story 2.1).
 */
export type ObservedEnergyLevel = "light" | "medium" | "heavy";

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
	/** Extracted facet evidence (0-5 records, v2 format) */
	readonly evidence: (EvidenceInput & { readonly note: string })[];
	/** Observed emotional energy level of the user's response (Story 21-6) */
	readonly observedEnergyLevel: ObservedEnergyLevel;
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
