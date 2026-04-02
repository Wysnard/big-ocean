/**
 * Conversanalyzer Repository Interface
 *
 * Pure interface for Haiku-based personality evidence extraction.
 * v2: Dual extraction — userState (energy + telling) alongside evidence.
 * v3: Split into two separate LLM calls — user state + evidence independently.
 *
 * Story 10.2 (v1), Story 24-1 (v2 evolution), Story 42-2 (split calls)
 */
import { Context, Effect } from "effect";
import * as S from "effect/Schema";
import type { EvidenceInput } from "../types/evidence";
import type { DomainMessage } from "../types/message";
import type { EnergyBand, TellingBand } from "../types/pacing";
import type { DomainDistribution } from "../utils/domain-distribution";

/**
 * ConversAnalyzer v1 observed energy level — categorical classification.
 * @deprecated Use EnergyBand from pacing types instead (v2).
 * Kept for backward compatibility during migration.
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

/** v2 user state extracted from the user message */
export interface ConversanalyzerUserState {
	readonly energyBand: EnergyBand;
	readonly tellingBand: TellingBand;
	readonly energyReason: string;
	readonly tellingReason: string;
	readonly withinMessageShift: boolean;
}

/** v2 output — dual extraction (userState + evidence) */
export interface ConversanalyzerV2Output {
	/** Extracted user state (energy + telling) */
	readonly userState: ConversanalyzerUserState;
	/** Extracted facet evidence (0-N records) */
	readonly evidence: (EvidenceInput & { readonly note: string })[];
	/** Token usage for cost tracking */
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

/**
 * @deprecated v1 output type — use ConversanalyzerV2Output instead.
 * Kept for backward compatibility during pipeline migration.
 */
export interface ConversanalyzerOutput {
	/** Extracted facet evidence (0-5 records, v2 format) */
	readonly evidence: (EvidenceInput & { readonly note: string })[];
	/** Observed emotional energy level of the user's response (Story 21-6) */
	readonly observedEnergyLevel: ObservedEnergyLevel;
	/** Token usage for cost tracking */
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

/** v3 user state output — standalone extraction result (Story 42-2) */
export interface ConversanalyzerUserStateOutput {
	readonly userState: ConversanalyzerUserState;
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

/** v3 evidence output — standalone extraction result (Story 42-2) */
export interface ConversanalyzerEvidenceOutput {
	readonly evidence: (EvidenceInput & { readonly note: string })[];
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

export class ConversanalyzerRepository extends Context.Tag("ConversanalyzerRepository")<
	ConversanalyzerRepository,
	{
		/** v2: Strict schema — all-or-nothing validation */
		readonly analyze: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerV2Output, ConversanalyzerError>;
		/** v2: Lenient schema — independent field parsing with defaults */
		readonly analyzeLenient: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerV2Output, ConversanalyzerError>;
		/** v3: User state extraction only — strict schema (Story 42-2) */
		readonly analyzeUserState: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerUserStateOutput, ConversanalyzerError>;
		/** v3: User state extraction only — lenient schema (Story 42-2) */
		readonly analyzeUserStateLenient: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerUserStateOutput, ConversanalyzerError>;
		/** v3: Evidence extraction only — strict schema (Story 42-2) */
		readonly analyzeEvidence: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerEvidenceOutput, ConversanalyzerError>;
		/** v3: Evidence extraction only — lenient schema (Story 42-2) */
		readonly analyzeEvidenceLenient: (
			params: ConversanalyzerInput,
		) => Effect.Effect<ConversanalyzerEvidenceOutput, ConversanalyzerError>;
	}
>() {}
