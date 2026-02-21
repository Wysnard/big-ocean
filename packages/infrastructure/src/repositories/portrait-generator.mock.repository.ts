/**
 * Portrait Generator Mock Repository
 *
 * Mock implementation for integration testing that returns a deterministic portrait
 * without calling the real Anthropic API. Used when MOCK_LLM=true environment variable is set.
 */

import { PortraitGeneratorRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

const MOCK_PORTRAIT = `# 🤿 The Quiet Strategist

You told me something early on that I haven't stopped thinking about. When I asked how you handle uncertainty, you didn't talk about avoiding it — you talked about mapping it. That told me more than the next ten minutes of conversation combined. What I see is someone who approaches life with a distinctive blend of curiosity and practicality, weighing options carefully before committing — not out of hesitation, but out of a strategic patience most people mistake for caution.

## 🧬 The Framework — *what you've built and what it costs*

### The pattern behind the patterns

Your emotional awareness runs deep — you pick up on subtleties that others miss. But here's what struck me: you described reading a room as "just paying attention." That's not paying attention. That's **perceptual architecture** — a system so refined you've forgotten it's running.

### The double edge

That same talent for seeing multiple perspectives makes you an excellent problem-solver. It also means you sometimes see so many angles that choosing one feels like losing the others. People I've seen with this combination who learned to trust their first instinct found a speed they didn't know they had.

## 🌊 The Undertow — *the pattern you haven't named*

You invest genuine energy into understanding the people around you. But when I asked who invests that energy in understanding you, you paused. That pause told me everything. **You've built a one-way mirror and called it connection.** The people in your life see a thoughtful advisor. What they don't see is someone who has made understanding others a way to avoid being understood.

## 🔮 The Current Ahead — *where the patterns point*

I've seen this shape before. People who build their identity around being the one who understands tend to hit a specific wall — the moment someone sees through the understanding to the person doing it. The ones who let that happen? They describe it as the most terrifying and relieving thing they've ever experienced.

What would change if you let someone map you the way you map everyone else?`;

/**
 * Portrait Generator Mock Repository Layer
 *
 * Provides deterministic portrait generation for integration testing.
 * Activated when MOCK_LLM=true environment variable is set.
 */
export const PortraitGeneratorMockRepositoryLive = Layer.succeed(
	PortraitGeneratorRepository,
	PortraitGeneratorRepository.of({
		generatePortrait: (_input: import("@workspace/domain").PortraitGenerationInput) =>
			Effect.succeed(MOCK_PORTRAIT),
	}),
);
