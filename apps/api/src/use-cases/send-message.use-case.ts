/**
 * Send Message Use Case
 *
 * Business logic for sending a message in an assessment conversation.
 * Saves user message, orchestrates AI response via Nerin/Analyzer/Scorer pipeline,
 * and updates confidence scores.
 *
 * Integration: Orchestrator repository routes to Nerin (always),
 * and triggers Analyzer + Scorer on batch messages (every 3rd).
 *
 * Story 2.4: Replaces direct Nerin calls with Orchestrator for multi-agent coordination.
 */

import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
	AssessmentMessageRepository,
	AssessmentSessionRepository,
	CostGuardRepository,
	calculateTraitConfidence,
	createInitialFacetScoresMap,
	type FacetConfidenceScores,
	type FacetScoresMap,
	initializeFacetConfidence,
	LoggerRepository,
	OrchestratorRepository,
} from "@workspace/domain";
import { Effect } from "effect";

export interface SendMessageInput {
	readonly sessionId: string;
	readonly message: string;
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
 *               LoggerRepository, OrchestratorRepository, CostGuardRepository
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

		// Verify session exists
		const session = yield* sessionRepo.getSession(input.sessionId);

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

		// Default facet confidence if not set (all facets at 50 = 50%)
		const defaultFacetConfidence = initializeFacetConfidence(50);

		// Use session facet confidence or default
		const sessionFacetConfidence: FacetConfidenceScores =
			session.confidence ?? defaultFacetConfidence;

		// Convert FacetConfidenceScores to FacetScoresMap for orchestrator
		// Initialize facet scores with confidence values from session
		const facetScores: FacetScoresMap = createInitialFacetScoresMap();
		for (const [key, confidence] of Object.entries(sessionFacetConfidence)) {
			// Map 'depressiveness' to 'depression' for compatibility
			const facetKey = key === "depressiveness" ? "depression" : key;
			if (facetKey in facetScores) {
				facetScores[facetKey as keyof FacetScoresMap] = {
					score: 10, // Default neutral score
					confidence: confidence as number,
				};
			}
		}

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

		// Calculate updated facet confidence from orchestrator result or use existing
		let updatedFacetConfidence = sessionFacetConfidence;

		// If batch processing occurred, update confidence from result
		if (result.facetScores) {
			// Convert FacetScoresMap back to FacetConfidenceScores
			// Map 'depression' back to 'depressiveness' for session storage
			const updatedFacets: Partial<FacetConfidenceScores> = {};
			for (const [facetName, facetScore] of Object.entries(result.facetScores)) {
				const sessionKey = facetName === "depression" ? "depressiveness" : facetName;
				if (sessionKey in sessionFacetConfidence) {
					updatedFacets[sessionKey as keyof FacetConfidenceScores] = facetScore.confidence;
				}
			}

			// Merge new facet confidence with existing
			updatedFacetConfidence = {
				...sessionFacetConfidence,
				...updatedFacets,
			};
		}

		// Update session with new facet confidence scores
		yield* sessionRepo.updateSession(input.sessionId, {
			confidence: updatedFacetConfidence,
		});

		// Compute trait confidence for API response (from facet confidence)
		const responseConfidence = calculateTraitConfidence(updatedFacetConfidence);

		logger.info("Message processed", {
			sessionId: input.sessionId,
			responseLength: result.nerinResponse.length,
			tokenCount: result.tokenUsage,
			isBatchMessage: messageCount % 3 === 0,
			steeringTarget: result.steeringTarget,
		});

		return {
			response: result.nerinResponse,
			confidence: {
				// Values are already 0-100 integers
				openness: responseConfidence.openness,
				conscientiousness: responseConfidence.conscientiousness,
				extraversion: responseConfidence.extraversion,
				agreeableness: responseConfidence.agreeableness,
				neuroticism: responseConfidence.neuroticism,
			},
		};
	});
