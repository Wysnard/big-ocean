import { Context, Effect } from "effect";
import type { AnalyzerError, MalformedEvidenceError } from "../errors/http.errors";
import type { FacetEvidence } from "../types/facet-evidence";
import type { ConversationMessage } from "../types/message";

/** A DB-persisted user message targeted for facet analysis */
export type AnalysisTarget = {
	readonly assessmentMessageId: string;
	readonly content: string;
};

/**
 * Analyzer Repository Service Tag
 *
 * Service interface for analyzing user messages and extracting personality facet evidence.
 * Follows hexagonal architecture pattern - this is the port (interface) that adapters implement.
 *
 * Implementation approaches:
 * - Production: AnalyzerClaudeRepositoryLive (uses Claude Sonnet 4.5 with structured JSON)
 * - Testing: createTestAnalyzerRepository() (returns mock evidence for deterministic tests)
 *
 * @see packages/infrastructure/src/repositories/analyzer.claude.repository.ts
 */
export class AnalyzerRepository extends Context.Tag("AnalyzerRepository")<
	AnalyzerRepository,
	{
		/**
		 * Analyze a single user message and extract facet evidence
		 *
		 * Uses LLM to identify signals for all 30 Big Five facets across 5 traits.
		 * Returns structured evidence with scores, confidence, quotes, and highlight ranges.
		 *
		 * @param assessmentMessageId - ID of the assessment message being analyzed (for evidence linkage)
		 * @param content - User message text to analyze for personality signals
		 * @param conversationHistory - Optional prior conversation messages for richer context
		 * @returns Effect with array of facet evidence (typically 3-10 facets per message)
		 * @throws AnalyzerError - Generic LLM invocation failure
		 * @throws MalformedEvidenceError - JSON parsing, structure validation, or invalid facet name
		 */
		readonly analyzeFacets: (
			assessmentMessageId: string,
			content: string,
			conversationHistory?: ReadonlyArray<ConversationMessage>,
		) => Effect.Effect<FacetEvidence[], AnalyzerError | MalformedEvidenceError, never>;

		/**
		 * Analyze multiple user messages in a single LLM call (batch mode)
		 *
		 * Consolidates multiple analyzeFacets calls into one LLM invocation to reduce
		 * input token costs by ~60-65% (system prompt + conversation history sent once).
		 *
		 * @param targets - Array of messages to analyze, each with DB message ID and content
		 * @param conversationHistory - Full conversation history with optional IDs on user messages
		 * @returns Effect with Map<assessmentMessageId, FacetEvidence[]>
		 * @throws AnalyzerError - Generic LLM invocation failure
		 * @throws MalformedEvidenceError - JSON parsing, structure validation, or invalid facet name
		 */
		readonly analyzeFacetsBatch: (
			targets: ReadonlyArray<AnalysisTarget>,
			conversationHistory?: ReadonlyArray<ConversationMessage>,
		) => Effect.Effect<Map<string, FacetEvidence[]>, AnalyzerError | MalformedEvidenceError, never>;
	}
>() {}
