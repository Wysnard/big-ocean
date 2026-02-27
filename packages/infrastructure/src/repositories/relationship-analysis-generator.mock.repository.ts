/**
 * Relationship Analysis Generator Mock Repository
 *
 * Mock implementation for integration testing that returns a deterministic analysis
 * without calling the real Anthropic API. Used when MOCK_LLM=true environment variable is set.
 */

import { RelationshipAnalysisGeneratorRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const MOCK_ANALYSIS = `# The Dynamic Between You

A fascinating pair — one who maps the territory before moving, and one who navigates by feel.

## Where You Meet

You both share a deep curiosity about the world around you. Where you diverge is in how you process what you find.

## Where You Complement

One of you builds the scaffolding; the other fills it with color. Together, you create structures that are both sound and alive.

## Where You Might Clash

The planner and the improviser will inevitably bump into each other. The question isn't whether — it's how you handle the collision.

## What Makes This Pairing Rare

This combination is uncommon — two people who see the world through genuinely different lenses but share enough common ground to translate for each other.`;

export const RelationshipAnalysisGeneratorMockRepositoryLive = Layer.succeed(
	RelationshipAnalysisGeneratorRepository,
	RelationshipAnalysisGeneratorRepository.of({
		generateAnalysis: () =>
			Effect.succeed({
				content: MOCK_ANALYSIS,
				modelUsed: "mock-sonnet",
			}),
	}),
);
