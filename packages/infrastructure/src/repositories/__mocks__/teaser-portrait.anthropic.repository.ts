/**
 * Mock TeaserPortraitRepository for unit tests
 *
 * Vitest auto-resolves this file when tests call:
 *   vi.mock("@workspace/infrastructure/repositories/teaser-portrait.anthropic.repository")
 *
 * Story 11.5
 */

import {
	TeaserPortraitError,
	type TeaserPortraitOutput,
	TeaserPortraitRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

const MOCK_TEASER = `# 🌊 The Quiet Architecture

You told me about the spreadsheet — the one you built to track your moods. There's something about the way you move through the world that I kept noticing. You gather with a patience that looks effortless from the outside. But it isn't patience at all, is it?

But here's what stayed with me after everything else settled. That precision you trust so completely? It has a cost you've stopped counting.`;

let mockOutput: TeaserPortraitOutput = {
	portrait: MOCK_TEASER,
	tokenUsage: { input: 500, output: 300 },
};

let mockError: string | null = null;
let callCount = 0;

export function _resetMockState(): void {
	mockOutput = {
		portrait: MOCK_TEASER,
		tokenUsage: { input: 500, output: 300 },
	};
	mockError = null;
	callCount = 0;
}

export function _setMockOutput(output: TeaserPortraitOutput): void {
	mockOutput = output;
}

export function _setMockError(message: string): void {
	mockError = message;
}

export function _getCallCount(): number {
	return callCount;
}

export const TeaserPortraitAnthropicRepositoryLive = Layer.succeed(
	TeaserPortraitRepository,
	TeaserPortraitRepository.of({
		generateTeaser: () => {
			callCount++;
			if (mockError) {
				return Effect.fail(new TeaserPortraitError({ message: mockError }));
			}
			return Effect.succeed(mockOutput);
		},
	}),
);
