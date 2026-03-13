import { Context, Effect } from "effect";
import { AgentInvocationError } from "../errors/http.errors";
import type { DomainMessage } from "../types/message";

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
 * Story 27-3: Pipeline now provides a fully composed system prompt from the
 * 4-tier prompt builder, replacing the old TerritoryPromptContent.
 */
export interface NerinInvokeInput {
	/** Session identifier for state persistence */
	readonly sessionId: string;

	/** Message history for conversational context */
	readonly messages: readonly DomainMessage[];

	/** Fully composed system prompt from the prompt builder (Story 27-3) */
	readonly systemPrompt?: string;
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
 * Implementation uses direct Claude invocation with structured output.
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
