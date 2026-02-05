/**
 * Nerin Steering Integration Test
 *
 * Verifies that facetScores and steeringHint flow correctly from
 * the Orchestrator Router to Nerin Agent.
 *
 * Uses a spy Nerin layer to capture and verify input parameters.
 */

import { describe, expect, it } from "@effect/vitest";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import {
	CheckpointerRepository,
	createInitialFacetScoresMap,
	type FacetScoresMap,
	NerinAgentRepository,
	type NerinInvokeInput,
	OrchestratorRepository,
} from "@workspace/domain";
import {
	OrchestratorGraphLangGraphRepositoryLive,
	OrchestratorLangGraphRepositoryLive,
} from "@workspace/infrastructure";
import { Effect, Layer } from "effect";
import {
	createTestAnalyzerLayer,
	createTestLoggerLayer,
	createTestScorerLayer,
} from "../../test-utils/test-layers";

// Create memory checkpointer layer
const TestCheckpointerLayer = Layer.succeed(CheckpointerRepository, {
	checkpointer: new MemorySaver(),
});

describe("Nerin Steering Integration", () => {
	/**
	 * Test that verifies steeringHint calculated by Router actually reaches Nerin
	 */
	it.effect("passes steeringHint and facetScores to Nerin when outlier exists", () =>
		Effect.gen(function* () {
			// Capture what Nerin receives
			let capturedInput: NerinInvokeInput | null = null;

			// Create a spy Nerin layer that captures input
			const SpyNerinLayer = Layer.succeed(NerinAgentRepository, {
				invoke: (input: NerinInvokeInput) => {
					capturedInput = input;
					return Effect.succeed({
						response: `Spy response - steeringHint received: ${!!input.steeringHint}`,
						tokenCount: { input: 100, output: 50, total: 150 },
					});
				},
			});

			// Build base layer with all dependencies
			const BaseLayer = Layer.mergeAll(
				createTestLoggerLayer(),
				SpyNerinLayer,
				createTestAnalyzerLayer(),
				createTestScorerLayer(),
				TestCheckpointerLayer,
			);

			// Build graph layer on top of base
			const GraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(Layer.provide(BaseLayer));

			// Build orchestrator layer on top of graph
			const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
				Layer.provide(GraphLayer),
				Layer.provide(createTestLoggerLayer()),
			);

			// Run orchestrator with facetScores containing a clear outlier
			const orchestrator = yield* OrchestratorRepository.pipe(Effect.provide(OrchestratorLayer));

			const inputFacetScores: FacetScoresMap = createInitialFacetScoresMap({
				imagination: { score: 14, confidence: 80 },
				artistic_interests: { score: 15, confidence: 75 },
				orderliness: { score: 8, confidence: 20 }, // OUTLIER - low confidence
				altruism: { score: 16, confidence: 85 },
				trust: { score: 13, confidence: 70 },
			});

			const result = yield* orchestrator.processMessage({
				sessionId: "test-steering-session",
				userMessage: "I prefer working alone in quiet spaces.",
				messages: [new HumanMessage("Hello")],
				messageCount: 2,
				dailyCostUsed: 10,
				facetScores: inputFacetScores,
			});

			// VERIFY: Nerin received the input
			expect(capturedInput).not.toBeNull();

			// VERIFY: steeringHint was calculated and passed
			expect(capturedInput?.steeringHint).toBeDefined();
			expect(capturedInput?.steeringHint).toContain("organize"); // orderliness hint

			// VERIFY: facetScores were passed (all 30 facets always initialized)
			expect(capturedInput?.facetScores).toBeDefined();
			expect(Object.keys(capturedInput?.facetScores ?? {}).length).toBe(30);

			// VERIFY: Output also contains steering info
			expect(result.steeringTarget).toBe("orderliness");
			expect(result.steeringHint).toContain("organize");

			console.log("\n=== STEERING INTEGRATION TEST RESULTS ===");
			console.log("Nerin received:");
			console.log(`  - steeringHint: "${capturedInput?.steeringHint}"`);
			console.log(`  - facetScores: ${Object.keys(capturedInput?.facetScores ?? {}).length} facets`);
			console.log(`  - sessionId: ${capturedInput?.sessionId}`);
			console.log("Orchestrator output:");
			console.log(`  - steeringTarget: ${result.steeringTarget}`);
			console.log(`  - steeringHint: "${result.steeringHint}"`);
			console.log("===========================================\n");
		}),
	);

	it.effect("passes undefined steeringHint when no outliers exist", () =>
		Effect.gen(function* () {
			let capturedInput: NerinInvokeInput | null = null;

			const SpyNerinLayer = Layer.succeed(NerinAgentRepository, {
				invoke: (input: NerinInvokeInput) => {
					capturedInput = input;
					return Effect.succeed({
						response: "Spy response - no steering",
						tokenCount: { input: 100, output: 50, total: 150 },
					});
				},
			});

			const BaseLayer = Layer.mergeAll(
				createTestLoggerLayer(),
				SpyNerinLayer,
				createTestAnalyzerLayer(),
				createTestScorerLayer(),
				TestCheckpointerLayer,
			);

			const GraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(Layer.provide(BaseLayer));
			const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
				Layer.provide(GraphLayer),
				Layer.provide(createTestLoggerLayer()),
			);

			const orchestrator = yield* OrchestratorRepository.pipe(Effect.provide(OrchestratorLayer));

			// All facets have IDENTICAL confidence - no outliers possible
			const inputFacetScores: FacetScoresMap = createInitialFacetScoresMap({
				imagination: { score: 14, confidence: 70 },
				artistic_interests: { score: 15, confidence: 70 },
				orderliness: { score: 12, confidence: 70 },
				altruism: { score: 16, confidence: 70 },
			});

			const result = yield* orchestrator.processMessage({
				sessionId: "test-no-steering-session",
				userMessage: "Just a normal conversation.",
				messages: [],
				messageCount: 1,
				dailyCostUsed: 5,
				facetScores: inputFacetScores,
			});

			// VERIFY: Nerin received input but no steering hint
			expect(capturedInput).not.toBeNull();
			expect(capturedInput?.steeringHint).toBeUndefined();

			// VERIFY: facetScores still passed (for context) - now has all 30 facets
			expect(capturedInput?.facetScores).toBeDefined();
			expect(Object.keys(capturedInput?.facetScores ?? {}).length).toBe(30);

			// VERIFY: Output also has no steering
			expect(result.steeringTarget).toBeUndefined();
			expect(result.steeringHint).toBeUndefined();

			console.log("\n=== NO-STEERING TEST RESULTS ===");
			console.log("Nerin received:");
			console.log(`  - steeringHint: ${capturedInput?.steeringHint} (correctly undefined)`);
			console.log(
				`  - facetScores: ${Object.keys(capturedInput?.facetScores ?? {}).length} facets (all 30 initialized)`,
			);
			console.log("================================\n");
		}),
	);

	it.effect("passes empty facetScores on first message", () =>
		Effect.gen(function* () {
			let capturedInput: NerinInvokeInput | null = null;

			const SpyNerinLayer = Layer.succeed(NerinAgentRepository, {
				invoke: (input: NerinInvokeInput) => {
					capturedInput = input;
					return Effect.succeed({
						response: "Welcome to your personality assessment!",
						tokenCount: { input: 80, output: 40, total: 120 },
					});
				},
			});

			const BaseLayer = Layer.mergeAll(
				createTestLoggerLayer(),
				SpyNerinLayer,
				createTestAnalyzerLayer(),
				createTestScorerLayer(),
				TestCheckpointerLayer,
			);

			const GraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(Layer.provide(BaseLayer));
			const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
				Layer.provide(GraphLayer),
				Layer.provide(createTestLoggerLayer()),
			);

			const orchestrator = yield* OrchestratorRepository.pipe(Effect.provide(OrchestratorLayer));

			// First message - facet scores initialized but no meaningful data
			const result = yield* orchestrator.processMessage({
				sessionId: "test-first-message",
				userMessage: "Hello, I'm excited to start!",
				messages: [],
				messageCount: 1,
				dailyCostUsed: 0,
				facetScores: createInitialFacetScoresMap(), // Initialized with defaults - first message
			});

			// VERIFY: Nerin received input
			expect(capturedInput).not.toBeNull();

			// VERIFY: facetScores are initialized (all 30 facets with confidence 0)
			expect(capturedInput?.facetScores).toBeDefined();
			expect(Object.keys(capturedInput?.facetScores ?? {}).length).toBe(30);

			// VERIFY: No steering on first message
			expect(capturedInput?.steeringHint).toBeUndefined();
			expect(result.steeringTarget).toBeUndefined();

			console.log("\n=== FIRST MESSAGE TEST RESULTS ===");
			console.log("Nerin received:");
			console.log(`  - facetScores: 30 facets (initialized with defaults, first message)`);
			console.log(`  - steeringHint: undefined (no meaningful data yet)`);
			console.log("==================================\n");
		}),
	);
});
