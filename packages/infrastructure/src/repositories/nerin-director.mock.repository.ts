/**
 * Nerin Director Mock Repository — ADR-DM-1
 *
 * Mock implementation for integration testing that provides deterministic
 * creative director briefs without calling the real Anthropic API.
 * Used via index.e2e.ts entrypoint for E2E and integration testing.
 *
 * Story 43-5: Created for pipeline integration.
 */

import {
	type NerinDirectorInput,
	type NerinDirectorOutput,
	NerinDirectorRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

/**
 * Generate a deterministic three-beat director brief based on conversation context.
 */
function generateMockBrief(input: NerinDirectorInput): string {
	const lastUserMessage = [...input.messages].reverse().find((m) => m.role === "user");
	const userContent = lastUserMessage?.content ?? "the conversation";

	const targetDomain = input.coverageTargets.candidateDomains[0]?.domain ?? "their life";
	const primaryFacet = input.coverageTargets.primaryFacet.facet;

	return `Observation: They said "${userContent.slice(0, 60)}" — there's something underneath that worth exploring. The way they framed it suggests a pattern worth naming.
Connection: That connects naturally to how they navigate ${targetDomain} contexts.
Question: Ask about a specific moment where ${primaryFacet} showed up in their life — something concrete, not abstract.
Warm, give-it-space. One question only.`;
}

/**
 * Nerin Director Mock Repository Layer
 *
 * Provides deterministic creative director briefs for integration testing
 * without calling the Anthropic API.
 */
export const NerinDirectorMockRepositoryLive = Layer.succeed(
	NerinDirectorRepository,
	NerinDirectorRepository.of({
		generateBrief: (input: NerinDirectorInput): Effect.Effect<NerinDirectorOutput, never, never> =>
			Effect.gen(function* () {
				const brief = generateMockBrief(input);

				// Simulate API latency (300-800ms — Director is Sonnet with larger input)
				const delay = Math.floor(Math.random() * 500) + 300;
				yield* Effect.sleep(`${delay} millis`);

				return {
					brief,
					tokenUsage: {
						input: Math.ceil(JSON.stringify(input.messages).length / 4) + 200,
						output: Math.ceil(brief.length / 4),
					},
				};
			}),
	}),
);
