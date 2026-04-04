/**
 * Conversanalyzer Mock Repository
 *
 * Mock implementation for E2E and integration testing that provides deterministic
 * ConversAnalyzer output without calling the real Anthropic API.
 *
 * Evidence-only — user-state extraction removed in Story 43-6.
 */

import {
	type ConversanalyzerEvidenceOutput,
	type ConversanalyzerInput,
	ConversanalyzerRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const mockEvidence = [
	{
		bigfiveFacet: "imagination" as const,
		deviation: 1,
		polarity: "high" as const,
		strength: "moderate" as const,
		confidence: "medium" as const,
		domain: "work" as const,
		note: "Shows creative thinking in professional context",
	},
	{
		bigfiveFacet: "trust" as const,
		deviation: 1,
		polarity: "high" as const,
		strength: "weak" as const,
		confidence: "medium" as const,
		domain: "relationships" as const,
		note: "Indicates baseline trust in social interactions",
	},
];

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
		analyzeEvidence: (_input: ConversanalyzerInput) => Effect.succeed(mockEvidenceOutput()),
		analyzeEvidenceLenient: (_input: ConversanalyzerInput) => Effect.succeed(mockEvidenceOutput()),
	}),
);
