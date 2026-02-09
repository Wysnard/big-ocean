/**
 * Mock: orchestrator.langgraph.repository.ts
 * Vitest auto-resolves when tests call:
 *   vi.mock('@workspace/infrastructure/repositories/orchestrator.langgraph.repository')
 *
 * Implements deterministic orchestration logic matching real routing behavior:
 * 1. Budget check → BudgetPausedError
 * 2. Steering calculation → outlier detection
 * 3. Always route to Nerin → response
 * 4. Batch trigger every 3rd message → evidence + scores
 */
import {
	BudgetPausedError,
	calculateConfidenceFromFacetScores,
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	type FacetName,
	OrchestratorRepository,
} from "@workspace/domain";
import { Effect, Layer } from "effect";
import {
	DAILY_COST_LIMIT,
	getNextDayMidnightUTC,
	getSteeringHint,
	getSteeringTarget,
	MESSAGE_COST_ESTIMATE,
	shouldTriggerBatch,
} from "../orchestrator.nodes";

export const OrchestratorLangGraphRepositoryLive = Layer.succeed(
	OrchestratorRepository,
	OrchestratorRepository.of({
		processMessage: (input) =>
			Effect.gen(function* () {
				const { sessionId, messageCount, dailyCostUsed, facetScores } = input;

				// 1. BUDGET CHECK
				if (dailyCostUsed + MESSAGE_COST_ESTIMATE > DAILY_COST_LIMIT) {
					const normalizedScores = createInitialFacetScoresMap(facetScores);
					const overallConfidence = facetScores
						? calculateConfidenceFromFacetScores(normalizedScores)
						: 50;

					return yield* Effect.fail(
						new BudgetPausedError(
							sessionId,
							"Your assessment is saved! Come back tomorrow to continue with full accuracy.",
							getNextDayMidnightUTC(),
							overallConfidence,
						),
					);
				}

				// 2. STEERING CALCULATION
				const normalizedFacetScores = createInitialFacetScoresMap(facetScores);
				const steeringTarget = getSteeringTarget(normalizedFacetScores);
				const steeringHint = getSteeringHint(steeringTarget);

				// 3. BATCH DECISION
				const isBatchMessage = shouldTriggerBatch(messageCount);

				// 4. BUILD RESPONSE
				const costIncurred = MESSAGE_COST_ESTIMATE;

				if (isBatchMessage) {
					// Batch: return evidence + scores
					return {
						nerinResponse: `Mock orchestrator response for session ${sessionId}`,
						tokenUsage: { input: 150, output: 80, total: 230 },
						costIncurred,
						facetEvidence: [
							{
								assessmentMessageId: `msg_${sessionId}`,
								facetName: "imagination" as FacetName,
								score: 15,
								confidence: 70,
								quote: "mock batch evidence",
								highlightRange: { start: 0, end: 10 },
							},
						],
						facetScores: createInitialFacetScoresMap(facetScores),
						traitScores: createInitialTraitScoresMap(),
						steeringTarget,
						steeringHint,
					};
				}

				// Non-batch: Nerin response only
				return {
					nerinResponse: `Mock orchestrator response for session ${sessionId}`,
					tokenUsage: { input: 150, output: 80, total: 230 },
					costIncurred,
					steeringTarget,
					steeringHint,
				};
			}),
	}),
);
