/**
 * Send Message Use Case
 *
 * Business logic for sending a message in an assessment conversation.
 * Saves user message, orchestrates AI response via Nerin/Analyzer/Scorer pipeline,
 * and computes confidence scores from evidence.
 *
 * Integration: Orchestrator repository routes to Nerin (always),
 * and triggers Analyzer + Scorer on batch messages (every 3rd).
 *
 * Story 2.4: Replaces direct Nerin calls with Orchestrator for multi-agent coordination.
 * Story 2.9: Scores computed on-demand from evidence instead of materialized tables.
 */

import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	aggregateFacetScores,
	CostGuardRepository,
	calculateTraitConfidence,
	type FacetConfidenceScores,
	FacetEvidenceRepository,
	initializeFacetConfidence,
	LoggerRepository,
	OrchestratorRepository,
	SessionNotFound,
} from "@workspace/domain";
import { Effect } from "effect";

export interface SendMessageInput {
	readonly sessionId: string;
	readonly message: string;
	readonly authenticatedUserId?: string;
	readonly userId?: string;
}

export interface SendMessageOutput {
	readonly response: string;
	readonly confidence: {
		readonly openness: number;
		readonly conscientiousness: number;
		readonly extraversion: number;
		readonly agreeableness: number;
		readonly neuroticism: number;
	};
}

/**
 * Send Message Use Case
 *
 * Dependencies: AssessmentSessionRepository, AssessmentMessageRepository,
 *               LoggerRepository, OrchestratorRepository, CostGuardRepository,
 *               FacetEvidenceRepository
 * Returns: AI response and updated confidence scores
 *
 * @throws BudgetPausedError - Daily cost limit reached, assessment paused
 * @throws OrchestrationError - Generic routing/pipeline failure
 */
export const sendMessage = (input: SendMessageInput) =>
	Effect.gen(function* () {
		const sessionRepo = yield* AssessmentSessionRepository;
		const messageRepo = yield* AssessmentMessageRepository;
		const logger = yield* LoggerRepository;
		const orchestrator = yield* OrchestratorRepository;
		const costGuard = yield* CostGuardRepository;
		const evidenceRepo = yield* FacetEvidenceRepository;

		// Verify session exists
		const session = yield* sessionRepo.getSession(input.sessionId);

		// Linked sessions are private to their owner.
		if (session.userId != null && session.userId !== input.authenticatedUserId) {
			return yield* Effect.fail(
				new SessionNotFound({
					sessionId: input.sessionId,
					message: `Session '${input.sessionId}' not found`,
				}),
			);
		}

		logger.info("Message received", {
			sessionId: input.sessionId,
			messageLength: input.message.length,
		});

		// Save user message
		yield* messageRepo.saveMessage(input.sessionId, "user", input.message, input.userId);

		// Get message count for batch trigger calculation
		const messageCount = yield* messageRepo.getMessageCount(input.sessionId);

		// Get all previous messages for context
		const previousMessages = yield* messageRepo.getMessages(input.sessionId);

		// Convert to LangChain message format
		const langchainMessages = previousMessages.map((msg) =>
			msg.role === "user"
				? new HumanMessage({ content: msg.content })
				: new AIMessage({ content: msg.content }),
		);

		// Get current daily cost for budget check
		const dailyCostCents = yield* costGuard.getDailyCost(session.userId ?? "anonymous");
		const dailyCostUsed = dailyCostCents / 100; // Convert cents to dollars

		// Compute facet scores from evidence (on-demand, no materialized tables)
		const evidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);
		const facetScores = aggregateFacetScores(evidence);

		logger.debug("Pre-orchestration facet scores", {
			sessionId: input.sessionId,
			evidenceCount: evidence.length,
			facetScores: Object.fromEntries(
				Object.entries(facetScores)
					.filter(([_, v]) => v.confidence > 0)
					.map(([k, v]) => [k, { score: v.score, confidence: v.confidence }]),
			),
		});

		// Invoke Orchestrator (routes to Nerin, optionally triggers Analyzer + Scorer)
		const result = yield* orchestrator
			.processMessage({
				sessionId: input.sessionId,
				userMessage: input.message,
				messages: langchainMessages,
				messageCount,
				dailyCostUsed,
				facetScores,
			})
			.pipe(
				Effect.tapError((error) =>
					Effect.sync(() =>
						logger.error("Orchestrator invocation failed", {
							errorTag: error._tag,
							sessionId: input.sessionId,
							message: error.message,
						}),
					),
				),
			);

		// Save AI message
		yield* messageRepo.saveMessage(input.sessionId, "assistant", result.nerinResponse);

		// Update cost tracking (convert dollars to cents)
		yield* costGuard.incrementDailyCost(
			session.userId ?? "anonymous",
			Math.round(result.costIncurred * 100),
		);

		// Recompute facet scores after orchestrator may have saved new evidence
		const updatedEvidence = yield* evidenceRepo.getEvidenceBySession(input.sessionId);
		const updatedFacetScores = aggregateFacetScores(updatedEvidence);

		// Convert facet scores to facet confidence for trait calculation
		const facetConfidence: Partial<FacetConfidenceScores> = {};
		for (const [facetName, facetScore] of Object.entries(updatedFacetScores)) {
			facetConfidence[facetName as keyof FacetConfidenceScores] = facetScore.confidence;
		}

		const defaultFacetConfidence = initializeFacetConfidence(50);
		const mergedFacetConfidence: FacetConfidenceScores = {
			...defaultFacetConfidence,
			...facetConfidence,
		};

		// Compute trait confidence for API response
		const responseConfidence = calculateTraitConfidence(mergedFacetConfidence);

		logger.info("Message processed", {
			sessionId: input.sessionId,
			responseLength: result.nerinResponse.length,
			tokenCount: result.tokenUsage,
			isBatchMessage: messageCount % 3 === 0,
			messageCount,
			steeringTarget: result.steeringTarget,
			traitConfidence: responseConfidence,
		});

		logger.debug("Post-orchestration facet scores", {
			sessionId: input.sessionId,
			updatedEvidenceCount: updatedEvidence.length,
			facetScores: Object.fromEntries(
				Object.entries(updatedFacetScores)
					.filter(([_, v]) => v.confidence > 0)
					.map(([k, v]) => [k, { score: v.score, confidence: v.confidence }]),
			),
		});

		return {
			response: result.nerinResponse,
			confidence: {
				openness: responseConfidence.openness,
				conscientiousness: responseConfidence.conscientiousness,
				extraversion: responseConfidence.extraversion,
				agreeableness: responseConfidence.agreeableness,
				neuroticism: responseConfidence.neuroticism,
			},
		};
	});
