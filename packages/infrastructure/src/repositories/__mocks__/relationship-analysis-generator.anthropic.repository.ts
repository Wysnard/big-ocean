/**
 * Mock: relationship-analysis-generator.anthropic.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/relationship-analysis-generator.anthropic.repository')
 *
 * Story 35-2: Updated to return spine-format JSON content.
 */

import { RelationshipAnalysisGeneratorRepository } from "@workspace/domain";
import type { RelationshipAnalysisGenerationInput } from "@workspace/domain/repositories/relationship-analysis-generator.repository";
import { Effect, Layer } from "effect";

const MOCK_ANALYSIS_CONTENT = JSON.stringify([
	{
		emoji: "\u{1F30A}",
		title: "The Dynamic Between You",
		paragraphs: [
			"A fascinating pair \u2014 one who maps the territory before moving, and one who navigates by feel.",
			"Together, you create a dynamic where planning meets spontaneity, and both are richer for it.",
		],
	},
	{
		emoji: "\u{1F91D}",
		title: "Where You Meet",
		paragraphs: [
			"You both share a deep curiosity about the world around you. Where you diverge is in how you process what you find.",
		],
	},
	{
		emoji: "\u{1F9E9}",
		title: "Where You Complement",
		paragraphs: [
			"One of you builds the scaffolding; the other fills it with color. Together, you create structures that are both sound and alive.",
		],
	},
	{
		emoji: "\u{26A1}",
		title: "Where You Might Clash",
		paragraphs: [
			"The planner and the improviser will inevitably bump into each other. The question isn\u2019t whether \u2014 it\u2019s how you handle the collision.",
		],
	},
	{
		emoji: "\u{2728}",
		title: "What Makes This Pairing Rare",
		paragraphs: [
			"This combination is uncommon \u2014 two people who see the world through genuinely different lenses but share enough common ground to translate for each other.",
		],
	},
]);

export const RelationshipAnalysisGeneratorAnthropicRepositoryLive = Layer.succeed(
	RelationshipAnalysisGeneratorRepository,
	RelationshipAnalysisGeneratorRepository.of({
		generateAnalysis: (_input: RelationshipAnalysisGenerationInput) =>
			Effect.succeed({
				content: MOCK_ANALYSIS_CONTENT,
				modelUsed: "mock-sonnet",
			}),
	}),
);
