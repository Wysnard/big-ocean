/**
 * Orchestrator LangGraph Repository Implementation
 *
 * Effect Layer implementation of the OrchestratorRepository interface.
 * Pure Effect dependency injection - depends on OrchestratorGraphRepository.
 *
 * Follows Effect Service Pattern:
 * - Context.Tag for service definition (in domain)
 * - Layer.effect for implementation with DI
 * - Dependencies resolved during layer construction
 *
 * @see Story 2-4: LangGraph State Machine and Orchestration
 */

import {
	LoggerRepository,
	OrchestratorGraphRepository,
	OrchestratorRepository,
	type ProcessMessageInput,
	type ProcessMessageOutput,
} from "@workspace/domain";
import { Effect, Layer } from "effect";

// ============================================
// Production Layer
// ============================================

/**
 * Production Layer for OrchestratorRepository.
 *
 * Pure Effect dependency injection - depends on OrchestratorGraphRepository
 * which handles graph compilation and agent coordination.
 *
 * Dependencies:
 * - OrchestratorGraphRepository: Compiled LangGraph graph
 * - LoggerRepository: Structured logging
 */
export const OrchestratorLangGraphRepositoryLive = Layer.effect(
	OrchestratorRepository,
	Effect.gen(function* () {
		const graph = yield* OrchestratorGraphRepository;
		const logger = yield* LoggerRepository;

		logger.info("Initializing OrchestratorRepository");

		return OrchestratorRepository.of({
			processMessage: (input: ProcessMessageInput) =>
				Effect.gen(function* () {
					const result = yield* graph.invoke(
						{
							sessionId: input.sessionId,
							userMessage: input.userMessage,
							messages: input.messages ?? [],
							messageCount: input.messageCount,
							dailyCostUsed: input.dailyCostUsed,
							facetScores: input.facetScores,
						},
						input.sessionId,
					);

					const output: ProcessMessageOutput = {
						nerinResponse: result.nerinResponse,
						tokenUsage: result.tokenUsage,
						costIncurred: result.costIncurred,
						facetEvidence: result.facetEvidence,
						facetScores: result.facetScores,
						traitScores: result.traitScores,
						steeringTarget: result.steeringTarget,
						steeringHint: result.steeringHint,
					};

					logger.info("Orchestrator processed message", {
						sessionId: input.sessionId,
						messageCount: input.messageCount,
						isBatch: result.isBatchMessage,
						hasScoringData: !!result.facetScores,
					});

					return output;
				}),
		});
	}),
);
