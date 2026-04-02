/**
 * Conversanalyzer Repository Interface
 *
 * Pure interface for Haiku-based personality evidence extraction.
 * Split into two independent LLM calls — user state + evidence.
 *
 * Story 10.2 (v1), Story 24-1 (v2 evolution), Story 42-2 (split calls)
 */
import { Context, Effect } from "effect";
import * as S from "effect/Schema";
import type { EvidenceInput, EvidencePolarity } from "../types/evidence";
import type { DomainMessage } from "../types/message";
import type { EnergyBand, TellingBand } from "../types/pacing";
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

/** User state extracted from the user message */
export interface ConversanalyzerUserState {
	readonly energyBand: EnergyBand;
	readonly tellingBand: TellingBand;
	readonly energyReason: string;
	readonly tellingReason: string;
	readonly withinMessageShift: boolean;
}

/** Combined output — user state + evidence (for downstream compatibility) */
export interface ConversanalyzerV2Output {
	/** Extracted user state (energy + telling) */
	readonly userState: ConversanalyzerUserState;
	/** Extracted facet evidence (0-N records) */
	readonly evidence: (EvidenceInput & {
		readonly note: string;
		readonly polarity?: EvidencePolarity;
	})[];
	/** Token usage for cost tracking */
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

/** User state output — standalone extraction result */
export interface ConversanalyzerUserStateOutput {
	readonly userState: ConversanalyzerUserState;
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

/** Evidence output — standalone extraction result */
export interface ConversanalyzerEvidenceOutput {
	readonly evidence: (EvidenceInput & {
		readonly note: string;
		readonly polarity?: EvidencePolarity;
	})[];
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

export class ConversanalyzerRepository extends Context.Tag("ConversanalyzerRepository")<
	ConversanalyzerRepository,
	{
		/** User state extraction only — strict schema */
		readonly analyzeUserState: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerUserStateOutput, ConversanalyzerError>;
		/** User state extraction only — lenient schema */
		readonly analyzeUserStateLenient: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerUserStateOutput, ConversanalyzerError>;
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
