import { Context, Effect } from "effect";
import { AgentInvocationError } from "../errors/http.errors";

/**
 * Token usage metrics from agent invocation
 */
export interface TokenUsage {
	readonly input: number;
	readonly output: number;
	readonly total: number;
}

/**
 * Input for Nerin Actor invocation — ADR-DM-3
 *
 * Actor receives ONLY the static actor prompt and the Director's brief.
 * No conversation history, no strategic context, no facet/domain awareness.
 */
export interface NerinActorInvokeInput {
	/** Session identifier for logging and cost tracking */
	readonly sessionId: string;

	/** Pre-composed actor system prompt (NERIN_PERSONA + ACTOR_VOICE_RULES + ACTOR_BRIEF_FRAMING) */
	readonly actorPrompt: string;

	/** Creative director brief from Nerin Director — the only content signal */
	readonly directorBrief: string;
}

/**
 * Output from Nerin Actor invocation
 */
export interface NerinActorInvokeOutput {
	readonly response: string;
	readonly tokenCount: TokenUsage;
}

/**
 * Nerin Actor Repository Service Tag — ADR-DM-3
 *
 * Defines the contract for the Nerin Actor — the voice layer that transforms
 * Director briefs into Nerin's character. Actor has no conversation history,
 * no strategic instincts, no facet/domain awareness.
 *
 * Following hexagonal architecture:
 * - This is the PORT (interface) in domain layer
 * - Implementation (ADAPTER) lives in infrastructure layer
 */
export class NerinActorRepository extends Context.Tag("NerinActorRepository")<
	NerinActorRepository,
	{
		/**
		 * Invoke Nerin Actor to voice a Director brief as Nerin's character
		 *
		 * @param input - Session ID, actor system prompt, and director brief
		 * @returns Effect with response text and token usage metrics
		 */
		readonly invoke: (
			input: NerinActorInvokeInput,
		) => Effect.Effect<NerinActorInvokeOutput, AgentInvocationError, never>;
	}
>() {}
