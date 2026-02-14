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

import { HumanMessage } from "@langchain/core/messages";
import {
	AnalyzerRepository,
	AssessmentMessageRepository,
	aggregateFacetScores,
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
 * Story 2.11: processAnalysis runs analyzer → scorer as a separate Effect pipeline.
 *
 * Dependencies:
 * - OrchestratorGraphRepository: Compiled LangGraph graph (conversation only)
 * - LoggerRepository: Structured logging
 * - AnalyzerRepository: Facet evidence extraction (for processAnalysis)
 * - FacetEvidenceRepository: Evidence persistence and retrieval (for processAnalysis)
 * - AssessmentMessageRepository: Message lookup for evidence association
 */
export const OrchestratorLangGraphRepositoryLive = Layer.effect(
	OrchestratorRepository,
	Effect.gen(function* () {
		const graph = yield* OrchestratorGraphRepository;
		const logger = yield* LoggerRepository;
		const analyzer = yield* AnalyzerRepository;
		const evidenceRepo = yield* FacetEvidenceRepository;
		const messageRepo = yield* AssessmentMessageRepository;

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

					// Step 1: Prepare history and determine which user messages still need analysis
					const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> =
						input.messages
							.filter((msg) => msg !== undefined)
							.map((msg) => ({
								role: (msg instanceof HumanMessage ? "user" : "assistant") as "user" | "assistant",
								content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
							}));

					const dbMessages = yield* messageRepo.getMessages(input.sessionId);
					const userDbMessages = dbMessages.filter((message) => message.role === "user");
					const userMessages = input.messages.filter((msg) => msg instanceof HumanMessage);

					const existingEvidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);
					const analyzedMessageIds = new Set(
						existingEvidence.map((evidence) => evidence.assessmentMessageId),
					);

					const analysisTargets = userMessages
						.map((msg, index) => {
							const dbMessage = userDbMessages[index];
							if (!dbMessage) {
								logger.warn("Missing DB message for analyzer target", {
									sessionId: input.sessionId,
									messageIndex: index,
								});
								return null;
							}

							if (analyzedMessageIds.has(dbMessage.id)) {
								return null;
							}

							const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
							return {
								messageId: dbMessage.id,
								content,
								index,
							};
						})
						.filter(
							(target): target is { messageId: string; content: string; index: number } => !!target,
						);

					if (analysisTargets.length === 0) {
						logger.debug("No new user messages to analyze", {
							sessionId: input.sessionId,
							messageCount: input.messageCount,
						});
						return;
					}

					const allEvidence = yield* Effect.all(
						analysisTargets.map(({ messageId, content, index }) =>
							analyzer
								.analyzeFacets(messageId, content, conversationHistory)
								.pipe(Effect.map((evidence) => ({ messageId, evidence, index }))),
						),
						{ concurrency: 3 },
					);

					const flatEvidence = allEvidence.flatMap((result) => result.evidence);

					logger.debug("Analyzer extracted evidence", {
						sessionId: input.sessionId,
						evidenceCount: flatEvidence.length,
					});

					// Step 2: Save evidence to DB by message
					const saveOperations = allEvidence
						.filter((result) => result.evidence.length > 0)
						.map((result) => evidenceRepo.saveEvidence(result.messageId, result.evidence));

					if (saveOperations.length > 0) {
						yield* Effect.all(saveOperations, { concurrency: 3 });
					}

					// Step 3: Score — read all evidence and compute scores
					const storedEvidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);
					const facetScores = aggregateFacetScores(storedEvidence);
					const traitScores = deriveTraitScores(facetScores);

					logger.info("Background analysis completed", {
						sessionId: input.sessionId,
						evidenceCount: flatEvidence.length,
						facetCount: Object.keys(facetScores).length,
						traitCount: Object.keys(traitScores).length,
					});
				}).pipe(
					Effect.catchAll((error) =>
						Effect.fail(
							new OrchestrationError(input.sessionId, `Background analysis failed: ${String(error)}`),
						),
					),
				),
		});
	}),
);
