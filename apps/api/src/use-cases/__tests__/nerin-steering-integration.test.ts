/**
 * Nerin Steering Integration Test
 *
 * Verifies that facetScores and steeringHint flow correctly from
 * the Orchestrator Router to Nerin Agent.
 *
 * Uses a spy Nerin layer to capture and verify input parameters.
 * Uses inline test layers for dependencies (logger, config, analyzer)
 * rather than vi.mock() since this test uses real orchestrator infrastructure.
 *
 * Story 2.9: ScorerRepository removed — scorer node uses FacetEvidenceRepository + pure functions.
 */

import { vi } from "vitest";

// Only mock domain config — the one __mocks__ file that exists
vi.mock("@workspace/domain/config/app-config");

import { describe, expect, it } from "@effect/vitest";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import {
	AnalyzerRepository,
	CheckpointerRepository,
	createInitialFacetScoresMap,
	FacetEvidenceRepository,
	type FacetScoresMap,
	LoggerRepository,
	NerinAgentRepository,
	type NerinInvokeInput,
	OrchestratorRepository,
} from "@workspace/domain";
// vi.mock() replaces this import with __mocks__/app-config.ts which exports createTestAppConfigLayer
// @ts-expect-error -- TS sees the real module (no createTestAppConfigLayer), Vitest resolves the mock
import { createTestAppConfigLayer } from "@workspace/domain/config/app-config";
import {
	OrchestratorGraphLangGraphRepositoryLive,
	OrchestratorLangGraphRepositoryLive,
} from "@workspace/infrastructure";
import { Effect, Layer } from "effect";

// Inline test layers — no vi.mock() needed for these
const TestLoggerLayer = Layer.succeed(
	LoggerRepository,
	LoggerRepository.of({
		info: () => {},
		warn: () => {},
		error: () => {},
		debug: () => {},
	}),
);

const TestAnalyzerLayer = Layer.succeed(
	AnalyzerRepository,
	AnalyzerRepository.of({
		analyzeFacets: () => Effect.succeed([]),
	}),
);

const TestFacetEvidenceLayer = Layer.succeed(
	FacetEvidenceRepository,
	FacetEvidenceRepository.of({
		saveEvidence: () => Effect.succeed([]),
		getEvidenceByMessage: () => Effect.succeed([]),
		getEvidenceByFacet: () => Effect.succeed([]),
		getEvidenceBySession: () => Effect.succeed([]),
	}),
);

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
				TestLoggerLayer,
				createTestAppConfigLayer(),
				SpyNerinLayer,
				TestAnalyzerLayer,
				TestFacetEvidenceLayer,
				TestCheckpointerLayer,
			);

			// Build graph layer on top of base
			const GraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(Layer.provide(BaseLayer));

			// Build orchestrator layer on top of graph
			// Type assertion: all deps are satisfied via Layer.provide but TS can't resolve the full chain
			const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
				Layer.provide(GraphLayer),
				Layer.provide(TestLoggerLayer),
			) as Layer.Layer<OrchestratorRepository>;

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
				TestLoggerLayer,
				createTestAppConfigLayer(),
				SpyNerinLayer,
				TestAnalyzerLayer,
				TestFacetEvidenceLayer,
				TestCheckpointerLayer,
			);

			const GraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(Layer.provide(BaseLayer));
			const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
				Layer.provide(GraphLayer),
				Layer.provide(TestLoggerLayer),
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
				TestLoggerLayer,
				createTestAppConfigLayer(),
				SpyNerinLayer,
				TestAnalyzerLayer,
				TestFacetEvidenceLayer,
				TestCheckpointerLayer,
			);

			const GraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(Layer.provide(BaseLayer));
			const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
				Layer.provide(GraphLayer),
				Layer.provide(TestLoggerLayer),
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
