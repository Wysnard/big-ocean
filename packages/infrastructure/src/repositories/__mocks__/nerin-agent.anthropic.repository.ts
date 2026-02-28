/**
 * Mock: nerin-agent.anthropic.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/nerin-agent.anthropic.repository')
 */
import { NerinAgentRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

export const NerinAgentAnthropicRepositoryLive = Layer.succeed(
	NerinAgentRepository,
	NerinAgentRepository.of({
		invoke: (input) =>
			Effect.succeed({
				response: `Mock Nerin response for session ${input.sessionId}`,
				tokenCount: { input: 100, output: 50, total: 150 },
			}),
	}),
);
