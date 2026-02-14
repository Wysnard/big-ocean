/**
 * Orchestrator Node Unit Tests
 *
 * Tests for the individual node functions in the orchestration pipeline.
 * These are pure function tests - no LangGraph or external dependencies.
 */

import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
	BudgetPausedError,
	calculateConfidenceFromFacetScores,
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
} from "@workspace/domain";
import { describe, expect, it } from "vitest";
import {
	calculateCostFromTokens,
	createNerinNodeResult,
	DAILY_COST_LIMIT,
	getNextDayMidnightUTC,
	getSteeringHint,
	getSteeringTarget,
	MESSAGE_COST_ESTIMATE,
	prepareMessagesForNerin,
	routerNode,
	shouldTriggerBatch,
} from "../orchestrator.nodes";
import type { OrchestratorState } from "../orchestrator.state";

// Helper to create minimal valid state
function createTestState(overrides: Partial<OrchestratorState> = {}): OrchestratorState {
	return {
		sessionId: "test-session",
		userMessage: "Test message",
		messages: [],
		messageCount: 1,
		dailyCostUsed: 10,
		budgetOk: true,
		steeringTarget: undefined,
		steeringHint: undefined,
		nerinResponse: "",
		tokenUsage: { input: 0, output: 0, total: 0 },
		costIncurred: 0,
		facetEvidence: [],
		facetScores: createInitialFacetScoresMap(),
		traitScores: createInitialTraitScoresMap(),
		error: undefined,
		...overrides,
	};
}

describe("Router Node", () => {
	describe("Budget check", () => {
		it("throws BudgetPausedError when budget exceeded", () => {
			const state = createTestState({
				dailyCostUsed: DAILY_COST_LIMIT, // Exactly at limit
			});

			expect(() => routerNode(state)).toThrow(BudgetPausedError);
		});

		it("throws BudgetPausedError when budget would be exceeded", () => {
			const state = createTestState({
				dailyCostUsed: DAILY_COST_LIMIT - MESSAGE_COST_ESTIMATE + 0.001, // Just over
			});

			expect(() => routerNode(state)).toThrow(BudgetPausedError);
		});

		it("proceeds when budget available", () => {
			const state = createTestState({
				dailyCostUsed: 10, // Well under limit
			});

			const result = routerNode(state);
			expect(result.budgetOk).toBe(true);
		});

		it("BudgetPausedError contains correct fields", () => {
			// Create facet scores with 45 average confidence (all facets at confidence=45)
			const facetScores = createInitialFacetScoresMap();
			for (const key of Object.keys(facetScores)) {
				facetScores[key as keyof typeof facetScores] = { score: 10, confidence: 45 };
			}

			const state = createTestState({
				sessionId: "test-123",
				facetScores,
				dailyCostUsed: DAILY_COST_LIMIT,
			});

			try {
				routerNode(state);
				expect.fail("Should have thrown BudgetPausedError");
			} catch (error) {
				expect(error).toBeInstanceOf(BudgetPausedError);
				const budgetError = error as BudgetPausedError;
				expect(budgetError.sessionId).toBe("test-123");
				expect(budgetError.currentConfidence).toBe(45); // Average of all 45 values
				expect(budgetError.resumeAfter).toBeDefined();
				expect(budgetError.message).toContain("saved");
			}
		});
	});

	describe("Offset steering", () => {
		it("returns no steering on cold start (msgs 1-3)", () => {
			const state = createTestState({
				messageCount: 1,
				facetScores: createInitialFacetScoresMap({
					imagination: { score: 16, confidence: 80 },
					orderliness: { score: 8, confidence: 20 }, // would be outlier
				}),
			});

			const result = routerNode(state);
			// Cold start: no steering regardless of facetScores
			expect(result.steeringTarget).toBeUndefined();
			expect(result.steeringHint).toBeUndefined();
		});

		it("calculates steeringTarget on STEER message (msg 4)", () => {
			// After first batch (msg 3), analyzer extracts ~5 facets from 3 messages
			const state = createTestState({
				messageCount: 4, // STEER: 4 % 3 === 1 && 4 > 3
				facetScores: createInitialFacetScoresMap({
					imagination: { score: 16, confidence: 75 },
					artistic_interests: { score: 14, confidence: 65 },
					orderliness: { score: 8, confidence: 15 }, // outlier
					altruism: { score: 14, confidence: 70 },
					gregariousness: { score: 15, confidence: 60 },
				}),
			});

			const result = routerNode(state);
			expect(result.steeringTarget).toBe("orderliness");
		});

		it("includes steeringHint on STEER message", () => {
			// After 2 batch cycles (msg 7), ~6 facets assessed from conversation
			const state = createTestState({
				messageCount: 7, // STEER: 7 % 3 === 1 && 7 > 3
				facetScores: createInitialFacetScoresMap({
					imagination: { score: 16, confidence: 75 },
					artistic_interests: { score: 14, confidence: 65 },
					orderliness: { score: 8, confidence: 10 }, // clear outlier
					self_discipline: { score: 12, confidence: 55 },
					gregariousness: { score: 15, confidence: 70 },
					trust: { score: 13, confidence: 60 },
				}),
			});

			const result = routerNode(state);
			expect(result.steeringHint).toBeDefined();
			expect(result.steeringHint).toContain("organize");
		});

		it("uses cached steering on COAST message (msg 5)", () => {
			// After first batch (msg 3), ~5 facets assessed
			const state = createTestState({
				messageCount: 5, // COAST: 5 % 3 === 2 && 5 > 3
				facetScores: createInitialFacetScoresMap({
					imagination: { score: 16, confidence: 75 },
					artistic_interests: { score: 14, confidence: 65 },
					orderliness: { score: 8, confidence: 15 }, // outlier
					self_discipline: { score: 12, confidence: 60 },
					gregariousness: { score: 15, confidence: 70 },
				}),
			});

			const result = routerNode(state);
			// COAST uses cached steering from state
			expect(result.steeringTarget).toBe("orderliness");
		});

		it("uses cached steering on BATCH message (msg 6)", () => {
			// After first batch (msg 3), ~5 facets assessed
			const state = createTestState({
				messageCount: 6, // BATCH: 6 % 3 === 0 && 6 > 3
				facetScores: createInitialFacetScoresMap({
					imagination: { score: 16, confidence: 75 },
					artistic_interests: { score: 14, confidence: 65 },
					orderliness: { score: 8, confidence: 15 }, // outlier
					self_discipline: { score: 12, confidence: 60 },
					gregariousness: { score: 15, confidence: 70 },
				}),
			});

			const result = routerNode(state);
			expect(result.steeringTarget).toBe("orderliness");
		});

		it("returns undefined steeringTarget when all facets unassessed (non-cold)", () => {
			const state = createTestState({
				messageCount: 4, // STEER, but default facets have confidence 0
			});
			const result = routerNode(state);
			expect(result.steeringTarget).toBeUndefined();
		});

		it("cold start on message 3 has no steering", () => {
			const state = createTestState({ messageCount: 3 });
			const result = routerNode(state);
			expect(result.steeringTarget).toBeUndefined();
		});
	});
});

describe("getSteeringTarget", () => {
	it("returns undefined when all facets unassessed", () => {
		// Default initialized map has confidence 0 for all facets
		expect(getSteeringTarget(createInitialFacetScoresMap())).toBeUndefined();
	});

	it("returns undefined when facets are tightly clustered", () => {
		const scores = createInitialFacetScoresMap({
			imagination: { score: 14, confidence: 60 },
			orderliness: { score: 14, confidence: 60 },
			altruism: { score: 14, confidence: 60 },
		});
		expect(getSteeringTarget(scores)).toBeUndefined();
	});

	it("returns weakest outlier when outliers exist", () => {
		// Realistic: ~5 facets assessed after first batch analysis
		const scores = createInitialFacetScoresMap({
			imagination: { score: 16, confidence: 75 },
			artistic_interests: { score: 14, confidence: 65 },
			orderliness: { score: 8, confidence: 15 }, // outlier
			altruism: { score: 14, confidence: 70 },
			gregariousness: { score: 15, confidence: 60 },
		});
		expect(getSteeringTarget(scores)).toBe("orderliness");
	});

	it("returns single weakest when multiple outliers", () => {
		// Realistic: ~6 facets assessed, two weak ones
		const scores = createInitialFacetScoresMap({
			imagination: { score: 16, confidence: 80 },
			artistic_interests: { score: 14, confidence: 70 },
			orderliness: { score: 6, confidence: 10 }, // weakest
			altruism: { score: 8, confidence: 20 }, // also outlier
			trust: { score: 15, confidence: 75 },
			gregariousness: { score: 13, confidence: 65 },
		});
		expect(getSteeringTarget(scores)).toBe("orderliness");
	});

	it("self-corrects as data changes", () => {
		// After first batch (~5 facets): orderliness weak
		const early = createInitialFacetScoresMap({
			imagination: { score: 12, confidence: 65 },
			artistic_interests: { score: 14, confidence: 60 },
			orderliness: { score: 8, confidence: 15 }, // outlier
			altruism: { score: 13, confidence: 55 },
			gregariousness: { score: 15, confidence: 70 },
		});
		expect(getSteeringTarget(early)).toBe("orderliness");

		// After more batches (~7 facets): orderliness improved, altruism now weak
		const later = createInitialFacetScoresMap({
			imagination: { score: 14, confidence: 75 },
			artistic_interests: { score: 15, confidence: 70 },
			orderliness: { score: 13, confidence: 65 },
			altruism: { score: 8, confidence: 15 }, // now the outlier
			gregariousness: { score: 14, confidence: 70 },
			trust: { score: 12, confidence: 60 },
			assertiveness: { score: 15, confidence: 65 },
		});
		expect(getSteeringTarget(later)).toBe("altruism");
	});
});

describe("getSteeringHint", () => {
	it("returns undefined for undefined target", () => {
		expect(getSteeringHint(undefined)).toBeUndefined();
	});

	it("returns hint for valid facet", () => {
		expect(getSteeringHint("imagination")).toContain("daydream");
		expect(getSteeringHint("orderliness")).toContain("organize");
		expect(getSteeringHint("altruism")).toContain("helping");
	});
});

describe("getNextDayMidnightUTC", () => {
	it("returns a future date", () => {
		const result = getNextDayMidnightUTC();
		expect(result.getTime()).toBeGreaterThan(Date.now());
	});

	it("returns midnight UTC", () => {
		const result = getNextDayMidnightUTC();
		expect(result.getUTCHours()).toBe(0);
		expect(result.getUTCMinutes()).toBe(0);
		expect(result.getUTCSeconds()).toBe(0);
		expect(result.getUTCMilliseconds()).toBe(0);
	});
});

describe("shouldTriggerBatch", () => {
	it("returns true for multiples of 3", () => {
		expect(shouldTriggerBatch(3)).toBe(true);
		expect(shouldTriggerBatch(6)).toBe(true);
		expect(shouldTriggerBatch(9)).toBe(true);
		expect(shouldTriggerBatch(12)).toBe(true);
	});

	it("returns false for non-multiples of 3", () => {
		expect(shouldTriggerBatch(1)).toBe(false);
		expect(shouldTriggerBatch(2)).toBe(false);
		expect(shouldTriggerBatch(4)).toBe(false);
		expect(shouldTriggerBatch(5)).toBe(false);
		expect(shouldTriggerBatch(7)).toBe(false);
	});
});

describe("calculateConfidenceFromFacetScores", () => {
	it("returns 0 for default initialized scores", () => {
		// All facets have confidence 0 by default
		expect(calculateConfidenceFromFacetScores(createInitialFacetScoresMap())).toBe(0);
	});

	it("calculates average confidence (0-100 integers)", () => {
		// Set all facets to same confidence to get predictable result
		const scores = createInitialFacetScoresMap();
		for (const key of Object.keys(scores)) {
			scores[key as keyof typeof scores] = { score: 10, confidence: 70 };
		}
		expect(calculateConfidenceFromFacetScores(scores)).toBe(70);
	});

	it("includes all facets in average", () => {
		// Set a mix of confidences
		const scores = createInitialFacetScoresMap({
			imagination: { score: 14, confidence: 85 },
		});
		// Only imagination has confidence=85, all others are 0
		// Average: 85/30 ≈ 2.83 → rounds to 3
		expect(calculateConfidenceFromFacetScores(scores)).toBe(3);
	});
});

describe("calculateCostFromTokens", () => {
	it("calculates cost from token counts", () => {
		const cost = calculateCostFromTokens({ input: 1000, output: 500 });
		// Input: 1000/1M * 0.003 = 0.000003
		// Output: 500/1M * 0.015 = 0.0000075
		// Total: ~0.0000105
		expect(cost).toBeGreaterThan(0);
		expect(cost).toBeLessThan(0.001);
	});

	it("returns 0 for zero tokens", () => {
		expect(calculateCostFromTokens({ input: 0, output: 0 })).toBe(0);
	});
});

describe("createNerinNodeResult", () => {
	it("structures result for state update", () => {
		const result = createNerinNodeResult({
			response: "Hello there!",
			tokenCount: { input: 100, output: 50, total: 150 },
		});

		expect(result.nerinResponse).toBe("Hello there!");
		expect(result.tokenUsage).toEqual({ input: 100, output: 50, total: 150 });
		expect(result.costIncurred).toBeGreaterThan(0);
	});
});

describe("prepareMessagesForNerin", () => {
	it("appends user message to existing history", () => {
		const state = createTestState({
			messages: [new HumanMessage("Previous"), new AIMessage("Response")],
			userMessage: "New message",
		});

		const messages = prepareMessagesForNerin(state);

		expect(messages).toHaveLength(3);
		const lastMessage = messages[2];
		expect(lastMessage).toBeInstanceOf(HumanMessage);
		expect(lastMessage?.content).toBe("New message");
	});

	it("handles empty message history", () => {
		const state = createTestState({
			messages: [],
			userMessage: "First message",
		});

		const messages = prepareMessagesForNerin(state);

		expect(messages).toHaveLength(1);
		expect(messages[0]).toBeInstanceOf(HumanMessage);
	});
});

describe("Constants", () => {
	it("DAILY_COST_LIMIT is $75", () => {
		expect(DAILY_COST_LIMIT).toBe(75);
	});

	it("MESSAGE_COST_ESTIMATE is reasonable", () => {
		expect(MESSAGE_COST_ESTIMATE).toBeGreaterThan(0);
		expect(MESSAGE_COST_ESTIMATE).toBeLessThan(0.01);
	});
});
