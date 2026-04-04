/**
 * Mock: nerin-actor.anthropic.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/nerin-actor.anthropic.repository')
 */
import { NerinActorRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

export const NerinActorAnthropicRepositoryLive = Layer.succeed(
	NerinActorRepository,
	NerinActorRepository.of({
		invoke: (input) =>
			Effect.succeed({
				response: `Mock Nerin Actor response for session ${input.sessionId}`,
				tokenCount: { input: 100, output: 50, total: 150 },
			}),
	}),
);
