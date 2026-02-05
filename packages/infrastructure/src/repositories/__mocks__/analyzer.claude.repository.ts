/**
 * Mock: analyzer.claude.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/analyzer.claude.repository')
 */
import { AnalyzerRepository, type FacetEvidence } from "@workspace/domain";
import { Effect, Layer } from "effect";

export const AnalyzerClaudeRepositoryLive = Layer.succeed(
	AnalyzerRepository,
	AnalyzerRepository.of({
		analyzeFacets: (assessmentMessageId: string, _content: string) =>
			Effect.succeed([
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
			] satisfies FacetEvidence[]),
	}),
);
