/**
 * Mock: relationship-analysis-generator.anthropic.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/relationship-analysis-generator.anthropic.repository')
 */

import { RelationshipAnalysisGeneratorRepository } from "@workspace/domain";
import type { RelationshipAnalysisGenerationInput } from "@workspace/domain/repositories/relationship-analysis-generator.repository";
import { Effect, Layer } from "effect";

const MOCK_ANALYSIS_CONTENT = `# The Dynamic Between You

A fascinating pair — one who maps the territory before moving, and one who navigates by feel.

## Where You Meet

You both share a deep curiosity about the world around you. Where you diverge is in how you process what you find.

## Where You Complement

One of you builds the scaffolding; the other fills it with color. Together, you create structures that are both sound and alive.

## Where You Might Clash

The planner and the improviser will inevitably bump into each other. The question isn't whether — it's how you handle the collision.

## What Makes This Pairing Rare

This combination is uncommon — two people who see the world through genuinely different lenses but share enough common ground to translate for each other.`;

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
