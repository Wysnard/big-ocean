/**
 * Mock: nerin-director.anthropic.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/nerin-director.anthropic.repository')
 */
import { NerinDirectorRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

/**
 * Deterministic test brief following the three-beat structure (ADR-DM-1).
 */
const MOCK_DIRECTOR_BRIEF = `Observation: They said they "love the feeling of getting lost in a problem" — that's not just engagement, that's absorption. The kind where the outside world disappears.
Connection: That absorption — does it show up in how they relate to people too?
Question: Ask about a time they got so focused on something with another person that they lost track of time together.
Warm, medium length. One question only.`;

export const NerinDirectorAnthropicRepositoryLive = Layer.succeed(
	NerinDirectorRepository,
	NerinDirectorRepository.of({
		generateBrief: (_input) =>
			Effect.succeed({
				brief: MOCK_DIRECTOR_BRIEF,
				tokenUsage: { input: 500, output: 80 },
			}),
	}),
);
