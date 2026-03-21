/**
 * Conversanalyzer Mock Repository
 *
 * Mock implementation for E2E and integration testing that provides deterministic
 * ConversAnalyzer v2 output without calling the real Anthropic API.
 *
 * Extracted from conversanalyzer.anthropic.repository.ts to keep production code clean.
 */

import {
	type ConversanalyzerInput,
	ConversanalyzerRepository,
	type ConversanalyzerV2Output,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

function mockAnalyzeV2(): ConversanalyzerV2Output {
	return {
		userState: {
			energyBand: "steady",
			tellingBand: "mixed",
			energyReason: "Engaged with moderate self-reflection",
			tellingReason: "Follows prompts with some self-direction",
			withinMessageShift: false,
		},
		evidence: [
			{
				bigfiveFacet: "imagination",
				deviation: 1,
				strength: "moderate",
				confidence: "medium",
				domain: "work",
				note: "Shows creative thinking in professional context",
			},
			{
				bigfiveFacet: "trust",
				deviation: 1,
				strength: "weak",
				confidence: "medium",
				domain: "relationships",
				note: "Indicates baseline trust in social interactions",
			},
		],
		tokenUsage: { input: 0, output: 0 },
	};
}

/**
 * Conversanalyzer Mock Repository Layer
 *
 * Provides deterministic extraction output for E2E testing.
 * Both analyze and analyzeLenient return the same mock data.
 */
export const ConversanalyzerMockRepositoryLive = Layer.succeed(
	ConversanalyzerRepository,
	ConversanalyzerRepository.of({
		analyze: (_input: ConversanalyzerInput) => Effect.succeed(mockAnalyzeV2()),
		analyzeLenient: (_input: ConversanalyzerInput) => Effect.succeed(mockAnalyzeV2()),
	}),
);
