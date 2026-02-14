/**
 * Orchestrator State Annotation Tests
 *
 * Tests for the LangGraph state annotation definition.
 * Validates state structure and type safety.
 *
 * Note: LangGraph Annotation internals (reducers, defaults) are not directly
 * accessible via public API. We test the exported types and structure instead.
 */

import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
	createInitialFacetScoresMap,
	createInitialTraitScoresMap,
	type FacetScoresMap,
} from "@workspace/domain";
import { describe, expect, it } from "vitest";
import {
	type OrchestratorInput,
	type OrchestratorOutput,
	type OrchestratorState,
	OrchestratorStateAnnotation,
} from "../orchestrator.state";

describe("OrchestratorStateAnnotation", () => {
	describe("State structure", () => {
		it("has all required input fields in spec", () => {
			// Verify all input fields are defined in the annotation spec
			const spec = OrchestratorStateAnnotation.spec;

			expect(spec.sessionId).toBeDefined();
			expect(spec.userMessage).toBeDefined();
			expect(spec.messages).toBeDefined();
			expect(spec.messageCount).toBeDefined();
			expect(spec.dailyCostUsed).toBeDefined();
		});

		it("has all routing decision fields in spec", () => {
			const spec = OrchestratorStateAnnotation.spec;

			expect(spec.budgetOk).toBeDefined();
			expect(spec.steeringTarget).toBeDefined();
			expect(spec.steeringHint).toBeDefined();
		});

		it("has all agent output fields in spec", () => {
			const spec = OrchestratorStateAnnotation.spec;

			expect(spec.nerinResponse).toBeDefined();
			expect(spec.tokenUsage).toBeDefined();
			expect(spec.costIncurred).toBeDefined();
		});

		it("has all batch processing fields in spec", () => {
			const spec = OrchestratorStateAnnotation.spec;

			expect(spec.facetEvidence).toBeDefined();
			expect(spec.facetScores).toBeDefined();
			expect(spec.traitScores).toBeDefined();
		});

		it("has error tracking field in spec", () => {
			const spec = OrchestratorStateAnnotation.spec;

			expect(spec.error).toBeDefined();
		});
	});

	describe("Type safety", () => {
		it("state type includes all required fields", () => {
			// This is a compile-time check - TypeScript will fail if types are wrong
			const state: OrchestratorState = {
				sessionId: "test-session",
				userMessage: "Hello",
				messages: [],
				messageCount: 1,
				dailyCostUsed: 10,
				budgetOk: true,
				steeringTarget: undefined,
				steeringHint: undefined,
				nerinResponse: "Hi there!",
				tokenUsage: { input: 100, output: 50, total: 150 },
				costIncurred: 0.0043,
				facetEvidence: [],
				facetScores: createInitialFacetScoresMap(),
				traitScores: createInitialTraitScoresMap(),
				error: undefined,
			};

			expect(state.sessionId).toBe("test-session");
			expect(state.facetScores).toBeDefined();
		});

		it("accepts FacetScoresMap type for facetScores", () => {
			const facetScores: FacetScoresMap = createInitialFacetScoresMap({
				imagination: { score: 16, confidence: 85 },
				altruism: { score: 18, confidence: 90 },
			});

			const state: Partial<OrchestratorState> = {
				facetScores,
			};

			expect(state.facetScores).toBeDefined();
			expect(state.facetScores?.imagination?.score).toBe(16);
		});

		it("OrchestratorInput type has correct fields", () => {
			const input: OrchestratorInput = {
				sessionId: "test-session",
				userMessage: "Hello",
				messages: [new HumanMessage("Hello")],
				messageCount: 1,
				dailyCostUsed: 10,
			};

			expect(input.sessionId).toBe("test-session");
			expect(input.messages).toHaveLength(1);
		});

		it("OrchestratorOutput type has correct fields", () => {
			const output: OrchestratorOutput = {
				nerinResponse: "Hi there!",
				tokenUsage: { input: 100, output: 50, total: 150 },
				costIncurred: 0.0043,
				facetEvidence: [
					{
						assessmentMessageId: "msg1",
						facetName: "imagination",
						score: 16,
						confidence: 85,
						quote: "test",
						highlightRange: { start: 0, end: 4 },
					},
				],
				steeringTarget: "orderliness",
				steeringHint: "Ask about organization",
			};

			expect(output.nerinResponse).toBe("Hi there!");
			expect(output.facetEvidence).toHaveLength(1);
			expect(output.steeringTarget).toBe("orderliness");
		});

		it("allows optional fields in OrchestratorOutput", () => {
			const minimalOutput: OrchestratorOutput = {
				nerinResponse: "Response",
				tokenUsage: { input: 50, output: 25, total: 75 },
				costIncurred: 0.002,
			};

			expect(minimalOutput.facetEvidence).toBeUndefined();
			expect(minimalOutput.facetScores).toBeUndefined();
			expect(minimalOutput.steeringTarget).toBeUndefined();
		});

		it("allows optional facetScores in OrchestratorInput", () => {
			const inputWithScores: OrchestratorInput = {
				sessionId: "test",
				userMessage: "Test",
				messages: [],
				messageCount: 3,
				dailyCostUsed: 15,
				facetScores: createInitialFacetScoresMap({
					imagination: { score: 16, confidence: 85 },
				}),
			};

			expect(inputWithScores.facetScores?.imagination?.score).toBe(16);
		});
	});

	describe("Annotation behavior validation", () => {
		it("spec keys match expected state shape", () => {
			const specKeys = Object.keys(OrchestratorStateAnnotation.spec);

			// All input fields
			expect(specKeys).toContain("sessionId");
			expect(specKeys).toContain("userMessage");
			expect(specKeys).toContain("messages");
			expect(specKeys).toContain("messageCount");
			expect(specKeys).toContain("dailyCostUsed");

			// Routing fields
			expect(specKeys).toContain("budgetOk");
			expect(specKeys).toContain("steeringTarget");
			expect(specKeys).toContain("steeringHint");

			// Agent output fields
			expect(specKeys).toContain("nerinResponse");
			expect(specKeys).toContain("tokenUsage");
			expect(specKeys).toContain("costIncurred");

			// Batch fields
			expect(specKeys).toContain("facetEvidence");
			expect(specKeys).toContain("facetScores");
			expect(specKeys).toContain("traitScores");

			// Error field
			expect(specKeys).toContain("error");
		});

		it("has correct total number of state fields", () => {
			const specKeys = Object.keys(OrchestratorStateAnnotation.spec);
			// 6 input + 3 routing + 3 agent output + 3 batch + 1 error = 16 total
			expect(specKeys.length).toBe(16);
		});
	});

	describe("Message handling", () => {
		it("supports BaseMessage types in messages array", () => {
			const state: Partial<OrchestratorState> = {
				messages: [new HumanMessage("Hello"), new AIMessage("Hi there!")],
			};

			expect(state.messages).toHaveLength(2);
			expect(state.messages?.[0]).toBeInstanceOf(HumanMessage);
			expect(state.messages?.[1]).toBeInstanceOf(AIMessage);
		});
	});
});
