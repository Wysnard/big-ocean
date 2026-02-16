/**
 * Orchestrator Graph Repository Interface
 *
 * Defines the contract for the compiled LangGraph orchestration graph.
 * Wraps the LangGraph StateGraph to enable Effect-based dependency injection.
 *
 * Following hexagonal architecture:
 * - This is the PORT (interface) in domain layer
 * - Implementation (ADAPTER) lives in infrastructure layer
 *
 * The graph coordinates multiple agents:
 * - Router: Budget check, steering calculation, batch decision
 * - Nerin: Conversational response generation
 * - Analyzer: Facet evidence extraction (batch)
 * - Scorer: Score aggregation (batch)
 *
 * @see packages/infrastructure/src/repositories/orchestrator-graph.langgraph.repository.ts
 */

import { Context, Effect } from "effect";
import type { FacetName } from "../types/facet-evidence";
import type { DomainMessage } from "../types/message";
import type { TokenUsage } from "./nerin-agent.repository";
import type { BudgetPausedError, OrchestrationError } from "./orchestrator.repository";

/**
 * Input for graph invocation
 *
 * Story 2.11: facetScores removed — router reads evidence internally on STEER messages.
 */
export interface GraphInput {
	readonly sessionId: string;
	readonly userMessage: string;
	readonly messages: DomainMessage[];
	readonly messageCount: number;
	readonly dailyCostUsed: number;
}

/**
 * Output from graph invocation
 *
 * Story 2.11: Conversation-only output. facetEvidence/facetScores/traitScores removed.
 * Analyzer + scorer run separately via processAnalysis.
 */
export interface GraphOutput {
	readonly nerinResponse: string;
	readonly tokenUsage: TokenUsage;
	readonly costIncurred: number;
	readonly steeringTarget?: FacetName;
	readonly steeringHint?: string;
}

/**
 * Orchestrator Graph Repository Service Tag
 *
 * Wraps the compiled LangGraph StateGraph for Effect-based dependency injection.
 * The graph is compiled once during layer construction with all dependencies resolved.
 */
export class OrchestratorGraphRepository extends Context.Tag("OrchestratorGraphRepository")<
	OrchestratorGraphRepository,
	{
		/**
		 * Invoke the orchestrator graph with the given input.
		 *
		 * @param input - Session context and message data
		 * @param threadId - Thread identifier for state persistence (usually sessionId)
		 * @returns Effect with graph output or orchestration errors
		 */
		readonly invoke: (
			input: GraphInput,
			threadId: string,
		) => Effect.Effect<GraphOutput, OrchestrationError | BudgetPausedError>;
	}
>() {}
