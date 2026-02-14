/**
 * Analyzer Mock Repository
 *
 * Mock implementation for integration testing that provides pattern-based facet evidence
 * without calling the real Anthropic API. Used when MOCK_LLM=true environment variable is set.
 *
 * Benefits:
 * - Zero API costs during integration testing
 * - Deterministic evidence extraction for reliable test assertions
 * - Fast execution (no network latency)
 * - Pattern-based responses that mimic real analyzer behavior
 */

import type { FacetEvidence, FacetName } from "@workspace/domain";
import { AnalyzerRepository } from "@workspace/domain/repositories/analyzer.repository";
import { Effect, Layer } from "effect";

/**
 * Pattern-based evidence extraction
 *
 * Maps message content patterns to Big Five facet evidence.
 * Each pattern returns 3-5 evidence items matching real analyzer output shape.
 */
function extractMockEvidence(assessmentMessageId: string, content: string): FacetEvidence[] {
	const lower = content.toLowerCase();
	const evidence: FacetEvidence[] = [];

	// Openness signals
	if (/creat|imagin|idea|art|novel|curio|explore|innovat|dream|philosoph/i.test(lower)) {
		evidence.push(
			facet(assessmentMessageId, "imagination", 16, 80, content, /creat|imagin|dream/i),
			facet(assessmentMessageId, "intellect", 14, 70, content, /curio|explore|idea|philosoph/i),
			facet(assessmentMessageId, "adventurousness", 13, 65, content, /explore|innovat|novel/i),
		);
	}

	// Conscientiousness signals
	if (/organiz|plan|schedule|structur|list|order|detail|methodic|system|disciplin/i.test(lower)) {
		evidence.push(
			facet(assessmentMessageId, "orderliness", 17, 85, content, /organiz|order|structur/i),
			facet(assessmentMessageId, "self_discipline", 15, 75, content, /disciplin|plan|schedule/i),
			facet(assessmentMessageId, "achievement_striving", 14, 70, content, /detail|methodic|system/i),
		);
	}

	// Extraversion signals
	if (/social|people|party|group|friend|gather|talk|meet|crowd|energi/i.test(lower)) {
		evidence.push(
			facet(assessmentMessageId, "gregariousness", 16, 80, content, /social|group|gather|crowd/i),
			facet(assessmentMessageId, "friendliness", 15, 75, content, /friend|people|meet/i),
			facet(assessmentMessageId, "activity_level", 14, 70, content, /energi|party|talk/i),
		);
	}

	// Agreeableness signals
	if (/help|care|kind|support|compassion|cooperat|team|empath|understand|listen/i.test(lower)) {
		evidence.push(
			facet(assessmentMessageId, "altruism", 17, 85, content, /help|care|support/i),
			facet(assessmentMessageId, "sympathy", 16, 80, content, /compassion|empath|understand/i),
			facet(assessmentMessageId, "cooperation", 14, 70, content, /cooperat|team|listen/i),
		);
	}

	// Neuroticism signals
	if (/worry|stress|anxiety|nervous|overwhelm|fear|tense|upset/i.test(lower)) {
		evidence.push(
			facet(assessmentMessageId, "anxiety", 15, 75, content, /worry|anxiety|nervous|fear/i),
			facet(assessmentMessageId, "vulnerability", 14, 70, content, /overwhelm|stress|tense/i),
			facet(assessmentMessageId, "self_consciousness", 12, 60, content, /nervous|upset/i),
		);
	}

	// Work/career signals
	if (/work|job|career|project|deadline|goal|achiev|ambitio/i.test(lower)) {
		evidence.push(
			facet(assessmentMessageId, "achievement_striving", 16, 80, content, /achiev|ambitio|goal/i),
			facet(assessmentMessageId, "self_efficacy", 14, 70, content, /work|career|project/i),
			facet(assessmentMessageId, "dutifulness", 13, 65, content, /deadline|job/i),
		);
	}

	// Conflict/assertiveness signals
	if (/disagree|conflict|argue|debate|opinion|stand|lead|decid/i.test(lower)) {
		evidence.push(
			facet(assessmentMessageId, "assertiveness", 15, 75, content, /argue|debate|stand|lead/i),
			facet(assessmentMessageId, "cooperation", 6, 65, content, /disagree|conflict/i),
		);
	}

	// Default: return at least some generic evidence if no patterns matched
	if (evidence.length === 0) {
		evidence.push(
			facet(assessmentMessageId, "intellect", 12, 55, content, /.+/),
			facet(assessmentMessageId, "friendliness", 11, 50, content, /.+/),
			facet(assessmentMessageId, "emotionality", 10, 45, content, /.+/),
		);
	}

	// Deduplicate by facetName — keep the first (highest priority) evidence per facet
	const seen = new Set<string>();
	return evidence.filter((e) => {
		if (seen.has(e.facetName)) return false;
		seen.add(e.facetName);
		return true;
	});
}

/**
 * Build a single FacetEvidence item with highlight range from pattern match
 */
function facet(
	assessmentMessageId: string,
	facetName: FacetName,
	score: number,
	confidence: number,
	content: string,
	pattern: RegExp,
): FacetEvidence {
	const match = content.match(pattern);
	const start = match?.index ?? 0;
	const quote = match?.[0] ?? content.substring(0, 20);
	return {
		assessmentMessageId,
		facetName,
		score,
		confidence,
		quote,
		highlightRange: { start, end: start + quote.length },
	};
}

/**
 * Analyzer Mock Repository Layer
 *
 * Provides mock facet evidence extraction for integration testing without calling Anthropic API.
 * Activated when MOCK_LLM=true environment variable is set.
 */
export const AnalyzerMockRepositoryLive = Layer.succeed(
	AnalyzerRepository,
	AnalyzerRepository.of({
		analyzeFacets: (
			assessmentMessageId: string,
			content: string,
			_conversationHistory?: ReadonlyArray<{ role: "user" | "assistant"; content: string }>,
		) =>
			Effect.gen(function* () {
				const evidence = extractMockEvidence(assessmentMessageId, content);

				console.log(`[MockAnalyzer] Message: ${assessmentMessageId}`);
				console.log(`[MockAnalyzer] Input: "${content.substring(0, 50)}..."`);
				console.log(`[MockAnalyzer] Evidence count: ${evidence.length}`);
				console.log(`[MockAnalyzer] Facets: ${evidence.map((e) => e.facetName).join(", ")}`);

				// Simulate analysis latency (200-800ms, faster than real ~1-2s)
				const delay = Math.floor(Math.random() * 600) + 200;
				yield* Effect.sleep(`${delay} millis`);

				return evidence;
			}),
	}),
);
