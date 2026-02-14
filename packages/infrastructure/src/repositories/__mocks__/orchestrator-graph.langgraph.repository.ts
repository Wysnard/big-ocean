/**
 * Mock: orchestrator-graph.langgraph.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/orchestrator-graph.langgraph.repository')
 *
 * Story 2.11: Conversation-only output. Batch decision computed by caller.
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
			}),
	}),
);
