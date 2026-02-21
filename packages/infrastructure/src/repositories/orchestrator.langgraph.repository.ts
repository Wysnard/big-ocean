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
 * Story 2.11: Lean response. processAnalysis added for background daemon.
 *
 * @see Story 2-4: LangGraph State Machine and Orchestration
 */

import {
	type AnalysisTarget,
	AnalyzerRepository,
	aggregateFacetScores,
	type ConversationMessage,
	deriveTraitScores,
	FacetEvidenceRepository,
	LoggerRepository,
	OrchestrationError,
	OrchestratorGraphRepository,
	OrchestratorRepository,
	type ProcessAnalysisInput,
	type ProcessMessageInput,
	type ProcessMessageOutput,
} from "@workspace/domain";
import { Effect, Layer, Schedule } from "effect";

// ============================================
// Production Layer
// ============================================

/**
 * Production Layer for OrchestratorRepository.
 *
 * Pure Effect dependency injection - depends on OrchestratorGraphRepository
 * which handles graph compilation and agent coordination.
 *
 * Story 2.11: processAnalysis runs analyzer → scorer as a separate Effect pipeline.
 *
 * Dependencies:
 * - OrchestratorGraphRepository: Compiled LangGraph graph (conversation only)
 * - LoggerRepository: Structured logging
 * - AnalyzerRepository: Facet evidence extraction (for processAnalysis)
 * - FacetEvidenceRepository: Evidence persistence and retrieval (for processAnalysis)
 */
export const OrchestratorLangGraphRepositoryLive = Layer.effect(
	OrchestratorRepository,
	Effect.gen(function* () {
		const graph = yield* OrchestratorGraphRepository;
		const logger = yield* LoggerRepository;
		const analyzer = yield* AnalyzerRepository;
		const evidenceRepo = yield* FacetEvidenceRepository;
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
						},
						input.sessionId,
					);

					const output: ProcessMessageOutput = {
						nerinResponse: result.nerinResponse,
						tokenUsage: result.tokenUsage,
						costIncurred: result.costIncurred,
						steeringTarget: result.steeringTarget,
						steeringHint: result.steeringHint,
					};

					logger.info("Orchestrator processed message", {
						sessionId: input.sessionId,
						messageCount: input.messageCount,
					});

					return output;
				}),

			processAnalysis: (input: ProcessAnalysisInput) =>
				Effect.gen(function* () {
					logger.info("Background analysis started", {
						sessionId: input.sessionId,
						messageCount: input.messageCount,
					});

					// Build enriched conversation history from DomainMessage[] (IDs already present)
					const enrichedHistory: ConversationMessage[] = input.messages;

					// Determine which user messages still need analysis
					const existingEvidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);
					const analyzedMessageIds = new Set(
						existingEvidence.map((evidence) => evidence.assessmentMessageId),
					);

					const userMessages = input.messages.filter((m) => m.role === "user");
					const analysisTargets: AnalysisTarget[] = userMessages
						.filter((m) => !analyzedMessageIds.has(m.id))
						.map((m) => ({ assessmentMessageId: m.id, content: m.content }));

					if (analysisTargets.length === 0) {
						logger.debug("No new user messages to analyze", {
							sessionId: input.sessionId,
							messageCount: input.messageCount,
						});
						return;
					}

					// Step 2: Single batch LLM call for all unanalyzed messages (retry up to 2x on transient LLM failures)
					const evidenceMap = yield* analyzer.analyzeFacetsBatch(analysisTargets, enrichedHistory).pipe(
						Effect.retry(
							Schedule.exponential("1 seconds").pipe(
								Schedule.compose(Schedule.recurs(2)),
								Schedule.tapOutput((duration) =>
									Effect.sync(() =>
										logger.warn("Retrying batch analysis", {
											sessionId: input.sessionId,
											retryDelay: String(duration),
										}),
									),
								),
							),
						),
					);

					const totalEvidence = [...evidenceMap.values()].reduce((sum, arr) => sum + arr.length, 0);

					logger.debug("Analyzer extracted evidence", {
						sessionId: input.sessionId,
						evidenceCount: totalEvidence,
					});

					// Step 3: Save evidence to DB by message
					const saveOperations = [...evidenceMap.entries()]
						.filter(([, evidence]) => evidence.length > 0)
						.map(([messageId, evidence]) => evidenceRepo.saveEvidence(messageId, evidence));

					if (saveOperations.length > 0) {
						yield* Effect.all(saveOperations, { concurrency: 3 });
					}

					// Step 4: Score — read all evidence and compute scores
					const storedEvidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);
					const facetScores = aggregateFacetScores(storedEvidence);
					const traitScores = deriveTraitScores(facetScores);

					logger.info("Background analysis completed", {
						sessionId: input.sessionId,
						evidenceCount: totalEvidence,
						facetCount: Object.keys(facetScores).length,
						traitCount: Object.keys(traitScores).length,
					});
				}).pipe(
					Effect.catchAll((error) => {
						const cause =
							error && typeof error === "object" && "cause" in error
								? String((error as { cause?: unknown }).cause)
								: undefined;
						return Effect.fail(
							new OrchestrationError(
								input.sessionId,
								`Background analysis failed: ${String(error)}${cause ? ` | cause: ${cause}` : ""}`,
							),
						);
					}),
				),
		});
	}),
);
