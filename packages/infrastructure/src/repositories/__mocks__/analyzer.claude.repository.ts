/**
 * Mock: analyzer.claude.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/analyzer.claude.repository')
 */
import {
	AnalyzerRepository,
	type ConversationMessage,
	type FacetEvidence,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

function mockEvidence(assessmentMessageId: string): FacetEvidence[] {
	return [
		{
			assessmentMessageId,
			facetName: "imagination",
			score: 15,
			confidence: 70,
			quote: "mock evidence quote",
			highlightRange: { start: 0, end: 10 },
		},
		{
			assessmentMessageId,
			facetName: "altruism",
			score: 16,
			confidence: 75,
			quote: "mock altruism quote",
			highlightRange: { start: 0, end: 10 },
		},
	];
}

export const AnalyzerClaudeRepositoryLive = Layer.succeed(
	AnalyzerRepository,
	AnalyzerRepository.of({
		analyzeFacets: (
			assessmentMessageId: string,
			_content: string,
			_conversationHistory?: ReadonlyArray<ConversationMessage>,
		) => Effect.succeed(mockEvidence(assessmentMessageId)),

		analyzeFacetsBatch: (
			targets: ReadonlyArray<{ assessmentMessageId: string; content: string }>,
			_conversationHistory?: ReadonlyArray<ConversationMessage>,
		) =>
			Effect.succeed(
				new Map(targets.map((t) => [t.assessmentMessageId, mockEvidence(t.assessmentMessageId)])),
			),
	}),
);
