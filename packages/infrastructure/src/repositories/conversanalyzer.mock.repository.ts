/**
 * Conversanalyzer Mock Repository
 *
 * Mock implementation for E2E and integration testing that provides deterministic
 * ConversAnalyzer output without calling the real Anthropic API.
 *
 * Extracted from conversanalyzer.anthropic.repository.ts to keep production code clean.
 */

import {
	type ConversanalyzerEvidenceOutput,
	type ConversanalyzerInput,
	ConversanalyzerRepository,
	type ConversanalyzerUserStateOutput,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const mockUserState = {
	energyBand: "steady" as const,
	tellingBand: "mixed" as const,
	energyReason: "Engaged with moderate self-reflection",
	tellingReason: "Follows prompts with some self-direction",
	withinMessageShift: false,
};

const mockEvidence = [
	{
		bigfiveFacet: "imagination" as const,
		deviation: 1,
		strength: "moderate" as const,
		confidence: "medium" as const,
		domain: "work" as const,
		note: "Shows creative thinking in professional context",
	},
	{
		bigfiveFacet: "trust" as const,
		deviation: 1,
		strength: "weak" as const,
		confidence: "medium" as const,
		domain: "relationships" as const,
		note: "Indicates baseline trust in social interactions",
	},
];

function mockUserStateOutput(): ConversanalyzerUserStateOutput {
	return {
		userState: mockUserState,
		tokenUsage: { input: 0, output: 0 },
	};
}

function mockEvidenceOutput(): ConversanalyzerEvidenceOutput {
	return {
		evidence: mockEvidence,
		tokenUsage: { input: 0, output: 0 },
	};
}

/**
 * Conversanalyzer Mock Repository Layer
 *
 * Provides deterministic extraction output for E2E testing.
 * All methods return the same mock data.
 */
export const ConversanalyzerMockRepositoryLive = Layer.succeed(
	ConversanalyzerRepository,
	ConversanalyzerRepository.of({
		analyzeUserState: (_input: ConversanalyzerInput) => Effect.succeed(mockUserStateOutput()),
		analyzeUserStateLenient: (_input: ConversanalyzerInput) => Effect.succeed(mockUserStateOutput()),
		analyzeEvidence: (_input: ConversanalyzerInput) => Effect.succeed(mockEvidenceOutput()),
		analyzeEvidenceLenient: (_input: ConversanalyzerInput) => Effect.succeed(mockEvidenceOutput()),
	}),
);
