/**
 * Mock: orchestrator-graph.langgraph.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/orchestrator-graph.langgraph.repository')
 */
import { OrchestratorGraphRepository } from "@workspace/domain";
import { Effect, Layer } from "effect";

export const OrchestratorGraphLangGraphRepositoryLive = Layer.succeed(
	OrchestratorGraphRepository,
	OrchestratorGraphRepository.of({
		invoke: (input, _threadId) =>
			Effect.succeed({
				nerinResponse: `Mock graph response for session ${input.sessionId}`,
				tokenUsage: { input: 150, output: 80, total: 230 },
				costIncurred: 0.0043,
				isBatchMessage: input.messageCount % 3 === 0,
			}),
	}),
);
