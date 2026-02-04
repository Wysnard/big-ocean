/**
 * Orchestrator Node Implementations for LangGraph
 *
 * Defines the individual node functions for the multi-agent orchestration pipeline.
 * Each node is a pure function that takes state and returns partial state updates.
 *
 * Node Flow:
 * 1. Router Node: Budget check, batch decision, steering calculation
 * 2. Nerin Node: Conversational response generation
 * 3. Analyzer Node: Facet evidence extraction (batch only)
 * 4. Scorer Node: Score aggregation and trait derivation (batch only)
 *
 * @see Story 2-4: LangGraph State Machine and Orchestration
 */

import { HumanMessage } from "@langchain/core/messages";
import {
	BudgetPausedError,
	calculateConfidenceFromFacetScores,
	createInitialFacetScoresMap,
	type FacetName,
	type FacetScoresMap,
} from "@workspace/domain";
import { FACET_STEERING_HINTS } from "./facet-steering";
import type { OrchestratorState } from "./orchestrator.state";

// ============================================
// Constants
// ============================================

/**
 * Daily cost limit in dollars.
 * From NFR8: $75/day budget ceiling.
 */
export const DAILY_COST_LIMIT = 75;

/**
 * Estimated cost per message in dollars.
 * Includes Nerin response + amortized Analyzer/Scorer cost.
 */
export const MESSAGE_COST_ESTIMATE = 0.0043;

/**
 * Minimum standard deviation threshold for outlier detection.
 *
 * If stddev < this value, facets are too tightly clustered to identify
 * meaningful outliers. This prevents false positives in early assessment
 * when few data points exist and natural variance is very low.
 */
export const MIN_STDDEV_THRESHOLD = 0.001;

// ============================================
// Router Node
// ============================================

/**
 * Get next day midnight UTC for budget pause resumption.
 */
export function getNextDayMidnightUTC(): Date {
	const tomorrow = new Date();
	tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
	tomorrow.setUTCHours(0, 0, 0, 0);
	return tomorrow;
}

/**
 * Calculate steering target using outlier detection.
 *
 * Finds the facet with lowest confidence that is more than 1 standard
 * deviation below the mean. This self-regulates naturally:
 * - Early conversation (few facets) → high variance → fewer outliers
 * - Chaotic state → lower threshold → harder to be outlier
 * - Converged state → no outliers below threshold
 *
 * @param facetScores - Current facet scores map (must be initialized, use createInitialFacetScoresMap)
 * @returns The weakest outlier facet name, or undefined if no outliers/none assessed
 */
export function getSteeringTarget(facetScores: FacetScoresMap): FacetName | undefined {
	const normalizedScores = createInitialFacetScoresMap(facetScores);

	// Get all assessed facets (those with confidence > 0, i.e., actually assessed)
	const assessed = Object.entries(normalizedScores).filter(
		([_, score]) => score !== undefined && score.confidence > 0,
	);

	// Calculate mean and standard deviation of confidences
	// Safe to access confidence since we filtered for defined scores above
	const confidences = assessed.map(([_, score]) => score?.confidence ?? 0);
	const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
	const variance = confidences.reduce((sum, c) => sum + (c - mean) ** 2, 0) / confidences.length;
	const stddev = Math.sqrt(variance);

	// If tightly clustered (very low variance), no outliers
	if (stddev < MIN_STDDEV_THRESHOLD) return undefined;

	// Outlier threshold: mean - 1 stddev
	const threshold = mean - stddev;

	// Find facets below threshold, sorted by confidence (weakest first)
	const outliers = assessed
		.filter(([_, score]) => (score?.confidence ?? 0) < threshold)
		.sort((a, b) => (a[1]?.confidence ?? 0) - (b[1]?.confidence ?? 0));

	// Return the single weakest outlier
	const weakestOutlier = outliers[0];
	return weakestOutlier ? (weakestOutlier[0] as FacetName) : undefined;
}

/**
 * Get steering hint for the steering target facet.
 *
 * @param steeringTarget - The facet to get hint for
 * @returns Natural conversation steering hint, or undefined if no target
 */
export function getSteeringHint(steeringTarget: FacetName | undefined): string | undefined {
	if (!steeringTarget) return undefined;
	return FACET_STEERING_HINTS[steeringTarget];
}

/**
 * Router Node - Decision point for the orchestration pipeline.
 *
 * Responsibilities:
 * 1. Budget check - throws BudgetPausedError if limit exceeded
 * 2. Batch decision - determines if Analyzer/Scorer should run
 * 3. Steering calculation - finds weakest outlier facet for Nerin guidance
 *
 * @param state - Current orchestrator state
 * @returns Partial state updates with routing decisions
 * @throws BudgetPausedError when daily cost limit would be exceeded
 */
export function routerNode(state: OrchestratorState): Partial<OrchestratorState> {
	const { sessionId, messageCount, dailyCostUsed, facetScores } = state;

	// 1. BUDGET CHECK - First priority
	// Use > (not >=) so messages are allowed up to exactly $75.00
	if (dailyCostUsed + MESSAGE_COST_ESTIMATE > DAILY_COST_LIMIT) {
		// Calculate overall confidence from facetScores
		const overallConfidence = facetScores ? calculateConfidenceFromFacetScores(facetScores) : 50; // Default if no scores yet

		throw new BudgetPausedError(
			sessionId,
			"Your assessment is saved! Come back tomorrow to continue with full accuracy.",
			getNextDayMidnightUTC(),
			overallConfidence,
		);
	}

	// 2. BATCH DECISION
	const isBatchMessage = messageCount % 3 === 0;

	// 3. STEERING CALCULATION
	const normalizedFacetScores = createInitialFacetScoresMap(facetScores);
	const steeringTarget = getSteeringTarget(normalizedFacetScores);
	const steeringHint = getSteeringHint(steeringTarget);

	return {
		budgetOk: true,
		isBatchMessage,
		steeringTarget,
		steeringHint,
	};
}

// ============================================
// Nerin Node
// ============================================

/**
 * Nerin Node state update type.
 * Used by the actual Nerin invocation to update state.
 */
export interface NerinNodeResult {
	nerinResponse: string;
	tokenUsage: { input: number; output: number; total: number };
	costIncurred: number;
}

/**
 * Calculate cost from token usage.
 *
 * @param tokenUsage - Token counts from model invocation
 * @returns Cost in dollars
 */
export function calculateCostFromTokens(tokenUsage: { input: number; output: number }): number {
	// Pricing for Claude Sonnet 4.5 per million tokens
	const INPUT_PRICE_PER_MILLION = 0.003;
	const OUTPUT_PRICE_PER_MILLION = 0.015;

	const inputCost = (tokenUsage.input / 1_000_000) * INPUT_PRICE_PER_MILLION;
	const outputCost = (tokenUsage.output / 1_000_000) * OUTPUT_PRICE_PER_MILLION;

	return inputCost + outputCost;
}

/**
 * Creates Nerin node state updates from invocation result.
 *
 * The actual Nerin invocation happens in the LangGraph node function,
 * which uses NerinAgentRepository.invoke(). This function just structures
 * the result for state update.
 *
 * @param result - Result from Nerin agent invocation
 * @returns Partial state updates
 */
export function createNerinNodeResult(result: {
	response: string;
	tokenCount: { input: number; output: number; total: number };
}): NerinNodeResult {
	return {
		nerinResponse: result.response,
		tokenUsage: result.tokenCount,
		costIncurred: calculateCostFromTokens(result.tokenCount),
	};
}

// ============================================
// Analyzer Node
// ============================================

/**
 * Analyzer Node result type.
 * Used by the Analyzer invocation to update state.
 */
export interface AnalyzerNodeResult {
	facetEvidence: {
		assessmentMessageId: string;
		facetName: FacetName;
		score: number;
		confidence: number;
		quote: string;
		highlightRange: { start: number; end: number };
	}[];
}

// ============================================
// Scorer Node
// ============================================

/**
 * Scorer Node result type.
 * Used by the Scorer invocation to update state.
 */
export interface ScorerNodeResult {
	facetScores: FacetScoresMap;
	traitScores: Partial<
		Record<
			"openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism",
			{
				score: number;
				confidence: number;
			}
		>
	>;
}

// ============================================
// Conditional Edge Helpers
// ============================================

/**
 * Determines if batch processing (Analyzer + Scorer) should run.
 *
 * @param messageCount - Current message count in session
 * @returns true if this is a batch trigger message (3rd, 6th, 9th, etc.)
 */
export function shouldTriggerBatch(messageCount: number): boolean {
	return messageCount % 3 === 0;
}

/**
 * Creates the message array for Nerin invocation.
 *
 * Appends the current user message to the existing message history.
 *
 * @param state - Current orchestrator state
 * @returns Message array including current user message
 */
export function prepareMessagesForNerin(state: OrchestratorState) {
	const { messages, userMessage } = state;
	return [...messages, new HumanMessage(userMessage)];
}
