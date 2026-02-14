/**
 * Mock: orchestrator.langgraph.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/orchestrator.langgraph.repository')
 *
 * Story 2.11: Lean response. Implements deterministic orchestration logic:
 * 1. Budget check → BudgetPausedError
 * 2. Steering calculation → outlier detection
 * 3. Always route to Nerin → response
 * 4. Batch decision computed by caller from messageCount
 */
import {
	BudgetPausedError,
	createInitialFacetScoresMap,
	OrchestratorRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import {
	DAILY_COST_LIMIT,
	getNextDayMidnightUTC,
	getSteeringHint,
	getSteeringTarget,
	MESSAGE_COST_ESTIMATE,
} from "../orchestrator.nodes";

export const OrchestratorLangGraphRepositoryLive = Layer.succeed(
	OrchestratorRepository,
	OrchestratorRepository.of({
		processMessage: (input) =>
			Effect.gen(function* () {
				const { sessionId, messageCount, dailyCostUsed } = input;

				// 1. BUDGET CHECK
				if (dailyCostUsed + MESSAGE_COST_ESTIMATE > DAILY_COST_LIMIT) {
					return yield* Effect.fail(
						new BudgetPausedError(
							sessionId,
							"Your assessment is saved! Come back tomorrow to continue with full accuracy.",
							getNextDayMidnightUTC(),
							50,
						),
					);
				}

				// 2. STEERING CALCULATION (uses default facet scores — real router reads from DB)
				const normalizedFacetScores = createInitialFacetScoresMap();
				const steeringTarget = getSteeringTarget(normalizedFacetScores);
				const steeringHint = getSteeringHint(steeringTarget);

				// 3. BUILD LEAN RESPONSE
				const costIncurred = MESSAGE_COST_ESTIMATE;

				return {
					nerinResponse: `Mock orchestrator response for session ${sessionId}`,
					tokenUsage: { input: 150, output: 80, total: 230 },
					costIncurred,
					steeringTarget,
					steeringHint,
				};
			}),

		processAnalysis: (_input) => Effect.void,
	}),
);
