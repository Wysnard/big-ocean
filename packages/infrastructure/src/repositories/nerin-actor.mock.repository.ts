/**
 * Nerin Actor Mock Repository — ADR-DM-3
 *
 * Mock implementation for integration testing that provides deterministic responses
 * without calling the real Anthropic API. Used via index.e2e.ts entrypoint for E2E
 * and integration testing.
 *
 * Benefits:
 * - Zero API costs during integration testing
 * - Deterministic responses for reliable test assertions
 * - Fast execution (no network latency)
 */

import {
	type NerinActorInvokeInput,
	type NerinActorInvokeOutput,
	NerinActorRepository,
	type TokenUsage,
} from "@workspace/domain/repositories/nerin-actor.repository";
import { Effect, Layer } from "effect";

/**
 * Generate a deterministic Nerin-voiced mock response from a director brief.
 */
function generateMockResponse(directorBrief: string): string {
	const lowerBrief = directorBrief.toLowerCase();

	if (/observ|notic|pattern|see/i.test(lowerBrief)) {
		return "Something you said is sticking with me. The way you described that — there's a pattern there I've seen before, but yours has a shape I haven't quite encountered. Tell me more about where that comes from.";
	}

	if (/vulnerab|tender|gentle|careful|space/i.test(lowerBrief)) {
		return "I appreciate you sharing that. It takes something to say that out loud. I want to sit with it for a moment before we go further. What does it feel like, having named it?";
	}

	if (/playful|light|fun|energy|excit/i.test(lowerBrief)) {
		return "Ha — okay, I like where this is going 🐙 There's something about the way you light up when you talk about this. What's the version of this that nobody else gets to see?";
	}

	if (/bridge|connect|shift|move|transition/i.test(lowerBrief)) {
		return "That connects to something I'm curious about. You mentioned how you approach that — I'm wondering if the same instinct shows up somewhere else in your life. Does it?";
	}

	return "That's interesting — tell me more about that. I'm curious what sits underneath it for you.";
}

/**
 * Generate mock token usage statistics
 */
function generateMockTokenUsage(brief: string, responseText: string): TokenUsage {
	const inputTokens = Math.ceil(brief.length / 4) + 200; // actor prompt + brief
	const outputTokens = Math.ceil(responseText.length / 4);

	return {
		input: inputTokens,
		output: outputTokens,
		total: inputTokens + outputTokens,
	};
}

/**
 * Nerin Actor Mock Repository Layer
 *
 * Provides mock responses for integration testing without calling Anthropic API.
 * Activated when MOCK_LLM=true environment variable is set.
 */
export const NerinActorMockRepositoryLive = Layer.succeed(
	NerinActorRepository,
	NerinActorRepository.of({
		invoke: (input: NerinActorInvokeInput): Effect.Effect<NerinActorInvokeOutput, never, never> =>
			Effect.gen(function* () {
				const response = generateMockResponse(input.directorBrief);
				const tokenCount = generateMockTokenUsage(input.directorBrief, response);

				// Simulate API latency (200-500ms — Actor is Haiku with minimal input)
				const delay = Math.floor(Math.random() * 300) + 200;
				yield* Effect.sleep(`${delay} millis`);

				return {
					response,
					tokenCount,
				};
			}),
	}),
);
