/**
 * Orchestrator State Definition for LangGraph
 *
 * Defines the state annotation for the multi-agent orchestration pipeline.
 * This state flows through: Router → Nerin → END
 *
 * Uses LangGraph's Annotation.Root pattern for type-safe state management
 * with reducers for accumulating messages and evidence.
 *
 * @see Story 2-4: LangGraph State Machine and Orchestration
 */

import { Annotation } from "@langchain/langgraph";
import {
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	type DomainMessage,
	type FacetEvidence,
	type FacetName,
	type FacetScoresMap,
	type TraitScoresMap,
} from "@workspace/domain";
import type { TokenUsage } from "@workspace/domain/repositories/nerin-agent.repository";

/**
 * Serializable error type for graph state.
 *
 * LangGraph state must be JSON-serializable for checkpointing.
 * Domain errors (which extend Error) cannot be stored directly in state.
 * This discriminated union encodes all possible graph errors as plain data
 * that survives serialization round-trips through the checkpointer.
 *
 * Flow: domain error → serializeError() → state.error → deserializeError() → Effect.fail
 */
export type SerializableGraphError =
	| {
			readonly _tag: "BudgetPausedError";
			readonly sessionId: string;
			readonly message: string;
			readonly resumeAfter: string;
			readonly currentConfidence: number;
	  }
	| {
			readonly _tag: "OrchestrationError";
			readonly sessionId: string;
			readonly message: string;
			readonly cause?: string;
	  }
	| {
			readonly _tag: "ConfidenceGapError";
			readonly sessionId: string;
			readonly message: string;
			readonly cause?: string;
	  };

/**
 * Orchestrator State Annotation
 *
 * Central state definition for the multi-agent orchestration pipeline.
 * All agents read from and write to this shared state structure.
 *
 * State Flow:
 * 1. Input phase: sessionId, userMessage, messageCount, facetScores, dailyCostUsed set by caller
 * 2. Budget check: Router validates dailyCostUsed < limit before proceeding
 * 3. Steering: Router calculates steeringTarget from facetScores (outlier detection)
 * 4. Nerin: Generates response, updates nerinResponse and tokenUsage
 * 5. Batch (every 3rd): Analyzer extracts facetEvidence, Scorer aggregates facetScores/traitScores
 * 6. Output phase: All accumulated state returned to caller
 */
export const OrchestratorStateAnnotation = Annotation.Root({
	// ============================================
	// Input Fields (set by caller, read by agents)
	// ============================================

	/**
	 * Session identifier for thread context and state persistence.
	 * Used as LangGraph thread_id for checkpointer.
	 */
	sessionId: Annotation<string>,

	/**
	 * Current user message being processed.
	 */
	userMessage: Annotation<string>,

	/**
	 * Message history from the assessment session.
	 * Uses DomainMessage (framework-agnostic) — LangChain conversion
	 * happens at the infrastructure boundary (nerin node).
	 *
	 * Reducer appends new messages to maintain chronological order.
	 */
	messages: Annotation<DomainMessage[]>({
		reducer: (prev, next) => [...(prev ?? []), ...(next ?? [])],
		default: () => [] as DomainMessage[],
	}),

	/**
	 * Indices of messages that have been analyzed by the Analyzer.
	 * Used to track which messages have been processed to avoid re-analyzing.
	 * Reducer appends new indices and deduplicates.
	 *
	 * Example: [0, 1, 2, 4] means messages at indices 0, 1, 2, and 4 have been analyzed
	 * (message 3 is still pending analysis)
	 */
	analyzedMessageIndices: Annotation<number[]>({
		reducer: (prev, next) => {
			if (!next) return prev ?? [];
			if (!prev) return next;
			// Merge and deduplicate
			return Array.from(new Set([...prev, ...next]));
		},
		default: () => [],
	}),

	/**
	 * Current message count in the session (1-indexed).
	 * Used to determine batch processing trigger (every 3rd message).
	 */
	messageCount: Annotation<number>,

	/**
	 * Daily cost already used in dollars.
	 * Router checks this against budget limit ($75) before processing.
	 */
	dailyCostUsed: Annotation<number>,

	// ============================================
	// Routing Decision Fields
	// ============================================

	/**
	 * Whether budget check passed.
	 * Set by router, false triggers BudgetPausedError.
	 */
	budgetOk: Annotation<boolean>({
		reducer: (_, next) => next ?? true,
		default: () => true,
	}),

	/**
	 * Single steering target facet (outlier with lowest confidence).
	 * Calculated from facetScores using standard deviation outlier detection
	 * (confidence < mean - stddev). Passed to Nerin as exploration hint.
	 */
	steeringTarget: Annotation<FacetName | undefined>,

	/**
	 * Natural language steering hint for Nerin.
	 * Mapped from steeringTarget to human-readable exploration suggestion.
	 */
	steeringHint: Annotation<string | undefined>,

	// ============================================
	// Agent Output Fields
	// ============================================

	/**
	 * Response text generated by Nerin agent.
	 * Defaults to empty string before Nerin runs.
	 */
	nerinResponse: Annotation<string>({
		reducer: (_, next) => next ?? "",
		default: () => "",
	}),

	/**
	 * Token usage metrics from Nerin invocation.
	 * Defaults to zero counts before Nerin runs.
	 */
	tokenUsage: Annotation<TokenUsage>({
		reducer: (_, next) => next ?? { input: 0, output: 0, total: 0 },
		default: () => ({ input: 0, output: 0, total: 0 }),
	}),

	/**
	 * Cost incurred for this message processing (in dollars).
	 * Calculated from tokenUsage using pricing constants.
	 */
	costIncurred: Annotation<number>({
		reducer: (_, next) => next ?? 0,
		default: () => 0,
	}),

	// ============================================
	// Batch Processing Fields (populated on 3rd, 6th, 9th... messages)
	// ============================================

	/**
	 * Facet evidence extracted by Analyzer.
	 * Reducer appends to allow multi-message accumulation if needed.
	 */
	facetEvidence: Annotation<FacetEvidence[]>({
		reducer: (prev, next) => {
			if (!next) return prev;
			if (!prev) return next;
			return [...prev, ...next];
		},
	}),

	/**
	 * Aggregated facet scores from Scorer.
	 * Complete record of all 30 facets (initialized with score=10, confidence=0).
	 */
	facetScores: Annotation<FacetScoresMap>({
		reducer: (prev, next) => ({ ...prev, ...next }),
		default: () => createInitialFacetScoresMap(),
	}),

	/**
	 * Derived trait scores from Scorer.
	 * Complete record of all 5 traits (initialized with score=60, confidence=0).
	 */
	traitScores: Annotation<TraitScoresMap>({
		reducer: (prev, next) => ({ ...prev, ...next }),
		default: () => createInitialTraitScoresMap(),
	}),

	// ============================================
	// Error Tracking
	// ============================================

	/**
	 * Serializable error if a graph node fails.
	 * Set by runNodeEffect when a domain error occurs (e.g., BudgetPausedError).
	 * Checked by conditional edge to skip remaining nodes and exit early.
	 * Deserialized back into domain errors by the invoke method.
	 */
	error: Annotation<SerializableGraphError | undefined>,
});

/**
 * Type alias for the orchestrator state shape.
 * Use this for typing function parameters and return values.
 */
export type OrchestratorState = typeof OrchestratorStateAnnotation.State;

/**
 * Input type for processMessage - subset of OrchestratorState that callers provide.
 */
export interface OrchestratorInput {
	sessionId: string;
	userMessage: string;
	messages: DomainMessage[];
	messageCount: number;
	dailyCostUsed: number;
	facetScores?: FacetScoresMap;
}

/**
 * Output type for processMessage - subset of OrchestratorState returned to callers.
 */
export interface OrchestratorOutput {
	nerinResponse: string;
	tokenUsage: TokenUsage;
	costIncurred: number;
	facetEvidence?: FacetEvidence[];
	facetScores?: FacetScoresMap;
	traitScores?: TraitScoresMap;
	steeringTarget?: FacetName;
	steeringHint?: string;
}
