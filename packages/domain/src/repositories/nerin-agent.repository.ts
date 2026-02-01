import { Context, Effect } from "effect";
import type { BaseMessage } from "@langchain/core/messages";
import { AgentInvocationError } from "@workspace/contracts/errors";

/**
 * Token usage metrics from agent invocation
 */
export interface TokenUsage {
  readonly input: number;
  readonly output: number;
  readonly total: number;
}

/**
 * Precision scores for Big Five personality traits
 * Values are percentages (0-100) representing confidence level
 */
export interface PrecisionScores {
  readonly openness?: number;
  readonly conscientiousness?: number;
  readonly extraversion?: number;
  readonly agreeableness?: number;
  readonly neuroticism?: number;
}

/**
 * Input for Nerin agent invocation
 */
export interface NerinInvokeInput {
  readonly sessionId: string;
  readonly messages: readonly BaseMessage[];
  readonly precision?: PrecisionScores;
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
     * @param input - Session context, message history, and precision scores
     * @returns Effect with response text and token usage metrics
     */
    readonly invoke: (
      input: NerinInvokeInput,
    ) => Effect.Effect<NerinInvokeOutput, AgentInvocationError, never>;
  }
>() {}
