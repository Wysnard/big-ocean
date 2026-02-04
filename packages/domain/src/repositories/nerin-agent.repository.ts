import type { BaseMessage } from "@langchain/core/messages";
import { AgentInvocationError } from "@workspace/contracts/errors";
import { Context, Effect } from "effect";
import type { FacetScoresMap } from "../types/facet-evidence";

/**
 * Token usage metrics from agent invocation
 */
export interface TokenUsage {
	readonly input: number;
	readonly output: number;
	readonly total: number;
}

/**
 * Input for Nerin agent invocation
 *
 * Nerin operates at facet-level granularity for personality assessment.
 * Receives facet scores (30 facets) rather than trait scores (5 traits)
 * for more precise conversational steering.
 */
export interface NerinInvokeInput {
	/** Session identifier for state persistence */
	readonly sessionId: string;

	/** Message history for conversational context */
	readonly messages: readonly BaseMessage[];

	/** Current facet scores for assessment context (optional, may be empty early in conversation) */
	readonly facetScores?: FacetScoresMap;

	/** Natural language steering hint to guide conversation toward low-confidence facets (optional) */
	readonly steeringHint?: string;
}

/**
 * Output from Nerin agent invocation
 */
export interface NerinInvokeOutput {
	readonly response: string;
	readonly tokenCount: TokenUsage;
}

/**
 * Nerin Agent Repository Service Tag
 *
 * Defines the contract for the Nerin conversational AI agent.
 * Implementation uses LangGraph with PostgreSQL state persistence.
 *
 * Following hexagonal architecture:
 * - This is the PORT (interface) in domain layer
 * - Implementation (ADAPTER) lives in infrastructure layer
 */
export class NerinAgentRepository extends Context.Tag("NerinAgentRepository")<
	NerinAgentRepository,
	{
		/**
		 * Invoke the Nerin agent to generate a conversational response
		 *
		 * @param input - Session context, message history, facet scores, and optional steering hint
		 * @returns Effect with response text and token usage metrics
		 */
		readonly invoke: (
			input: NerinInvokeInput,
		) => Effect.Effect<NerinInvokeOutput, AgentInvocationError, never>;
	}
>() {}
