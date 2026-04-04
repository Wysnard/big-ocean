/**
 * Nerin Director Repository Interface (Story 43-3)
 *
 * Domain interface (port) for the Nerin Director LLM call.
 * The Director reads the full conversation and produces a creative director brief
 * that steers Nerin Actor's content direction, emotional shape, and conversation strategy.
 *
 * Implementation (adapter) lives in infrastructure:
 * - nerin-director.anthropic.repository.ts (Anthropic/LangChain)
 * - __mocks__/nerin-director.anthropic.repository.ts (in-memory mock)
 */
import { Context, Data, Effect } from "effect";
import type { DomainMessage } from "../types/message";
import type { CoverageTargetWithDefinitions } from "../utils/coverage-analyzer";

/**
 * Nerin Director error — domain error for Director LLM call failures.
 * Thrown after retry exhaustion (ADR-DM-4: retry once, then error).
 */
export class NerinDirectorError extends Data.TaggedError("NerinDirectorError")<{
	readonly message: string;
	readonly sessionId?: string;
	readonly cause?: string;
}> {}

/**
 * Input for Nerin Director invocation
 */
export interface NerinDirectorInput {
	/** The Director system prompt (main or closing variant) */
	readonly systemPrompt: string;

	/** Full conversation history — Director reads the entire conversation */
	readonly messages: readonly DomainMessage[];

	/** Coverage targets from the coverage analyzer (facets + domain with definitions) */
	readonly coverageTargets: CoverageTargetWithDefinitions;

	/** Session identifier for logging and error context */
	readonly sessionId: string;
}

/**
 * Output from Nerin Director invocation
 */
export interface NerinDirectorOutput {
	/** Creative director brief — plain text, three-beat structure */
	readonly brief: string;

	/** Token usage for cost tracking */
	readonly tokenUsage: { readonly input: number; readonly output: number };
}

/**
 * Nerin Director Repository Service Tag
 *
 * Defines the contract for the Nerin Director LLM call.
 * Director reads full conversation + coverage targets and produces
 * a creative director brief for Nerin Actor.
 *
 * Following hexagonal architecture:
 * - This is the PORT (interface) in domain layer
 * - Implementation (ADAPTER) lives in infrastructure layer
 */
export class NerinDirectorRepository extends Context.Tag("NerinDirectorRepository")<
	NerinDirectorRepository,
	{
		/**
		 * Generate a creative director brief for Nerin Actor.
		 *
		 * @param input - System prompt, full conversation, coverage targets
		 * @returns Effect with brief text and token usage
		 */
		readonly generateBrief: (
			input: NerinDirectorInput,
		) => Effect.Effect<NerinDirectorOutput, NerinDirectorError, never>;
	}
>() {}
