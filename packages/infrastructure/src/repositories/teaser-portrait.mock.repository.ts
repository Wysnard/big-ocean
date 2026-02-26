/**
 * Teaser Portrait Mock Repository Implementation
 *
 * Returns deterministic teaser content for MOCK_LLM=true integration testing.
 * Follows the same pattern as PortraitGeneratorMockRepositoryLive.
 *
 * Story 11.5
 */

import { LoggerRepository, TeaserPortraitRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const MOCK_TEASER = `# 🌊 The Quiet Architecture

You told me about the spreadsheet — the one you built to track your moods, then abandoned after two weeks. And then, almost in the same breath, you described how you reorganize your workspace every time you're stuck on a problem. You didn't connect those two things. I did.

There's something about the way you move through the world that I kept noticing. You gather — information, perspectives, options — with a patience that looks effortless from the outside. But it isn't patience at all, is it? It's precision. You're not waiting to decide. You're waiting until the signal is unmistakable.

But here's what stayed with me after everything else settled. That precision you trust so completely? It has a cost you've stopped counting.`;

export const TeaserPortraitMockRepositoryLive = Layer.effect(
	TeaserPortraitRepository,
	Effect.gen(function* () {
		const logger = yield* LoggerRepository;

		logger.info("TeaserPortrait configured (mock)");

		return TeaserPortraitRepository.of({
			generateTeaser: (input) => {
				logger.info("Mock teaser portrait generated", { sessionId: input.sessionId });
				return Effect.succeed({
					portrait: MOCK_TEASER,
					lockedSectionTitles: [
						"The Architecture of Your Empathy",
						"When Logic Meets Longing",
						"Your Emerging Edge",
					] as ReadonlyArray<string>,
					modelUsed: "mock-teaser-model",
					tokenUsage: { input: 0, output: 0 },
				});
			},
		});
	}),
);
