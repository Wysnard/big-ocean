/**
 * Nerin Steering Integration Test
 *
 * Verifies that the Orchestrator Router calculates steering internally
 * and passes steeringHint + facetScores to Nerin Agent.
 *
 * Uses a spy Nerin layer to capture and verify input parameters.
 * Uses inline test layers for dependencies (logger, config, analyzer)
 * rather than vi.mock() since this test uses real orchestrator infrastructure.
 *
 * Story 2.9: ScorerRepository removed — scorer node uses FacetEvidenceRepository + pure functions.
 * Story 2.11: facetScores removed from ProcessMessageInput — router reads evidence internally.
 * With default (empty) evidence, steering is always undefined. Steering with real data
 * will be tested in Task 4 when router reads from FacetEvidenceRepository.
 */

import { vi } from "vitest";

// Only mock domain config — the one __mocks__ file that exists
vi.mock("@workspace/domain/config/app-config");

import { describe, expect, it } from "@effect/vitest";
import { MemorySaver } from "@langchain/langgraph";
import {
	AnalyzerRepository,
	AssessmentMessageRepository,
	FacetEvidenceRepository,
	LoggerRepository,
	NerinAgentRepository,
	type NerinInvokeInput,
	OrchestratorRepository,
} from "@workspace/domain";
// vi.mock() replaces this import with __mocks__/app-config.ts which exports createTestAppConfigLayer
// @ts-expect-error -- TS sees the real module (no createTestAppConfigLayer), Vitest resolves the mock
import { createTestAppConfigLayer } from "@workspace/domain/config/app-config";
import {
	CheckpointerRepository,
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
		analyzeFacetsBatch: (targets) =>
			Effect.succeed(new Map(targets.map((t) => [t.assessmentMessageId, []]))),
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

const TestAssessmentMessageLayer = Layer.succeed(
	AssessmentMessageRepository,
	AssessmentMessageRepository.of({
		saveMessage: () =>
			Effect.succeed({
				id: "msg_test",
				sessionId: "test-session",
				role: "user",
				content: "",
				createdAt: new Date(),
			} as never),
		getMessages: () => Effect.succeed([]),
		getMessageCount: () => Effect.succeed(0),
	}),
);

// Create memory checkpointer layer
const TestCheckpointerLayer = Layer.succeed(CheckpointerRepository, {
	checkpointer: new MemorySaver(),
});

describe("Nerin Steering Integration", () => {
	/**
	 * Story 2.11: facetScores are no longer passed via ProcessMessageInput.
	 * Router uses internal defaults (all zero confidence) → no outliers → no steering.
	 * This test verifies the pipeline works end-to-end with default steering (undefined).
	 * Steering with real evidence data will be tested in Task 4.
	 */
	it.effect("passes facetScores and undefined steeringHint with default evidence", () =>
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
				TestAssessmentMessageLayer,
				TestCheckpointerLayer,
			);

			// Build graph layer on top of base
			const GraphLayer = OrchestratorGraphLangGraphRepositoryLive.pipe(Layer.provide(BaseLayer));

			// Build orchestrator layer on top of graph
			// Type assertion: all deps are satisfied via Layer.provide but TS can't resolve the full chain
			const OrchestratorLayer = OrchestratorLangGraphRepositoryLive.pipe(
				Layer.provide(GraphLayer),
				Layer.provide(TestLoggerLayer),
				Layer.provide(TestAnalyzerLayer),
				Layer.provide(TestFacetEvidenceLayer),
				Layer.provide(TestAssessmentMessageLayer),
			) as Layer.Layer<OrchestratorRepository>;

			const orchestrator = yield* OrchestratorRepository.pipe(Effect.provide(OrchestratorLayer));

			// Story 2.11: No facetScores in input — router uses defaults internally
			const result = yield* orchestrator.processMessage({
				sessionId: "test-steering-session",
				userMessage: "I prefer working alone in quiet spaces.",
				messages: [],
				messageCount: 2,
				dailyCostUsed: 10,
			});

			// VERIFY: Nerin received the input
			expect(capturedInput).not.toBeNull();

			// VERIFY: facetScores were passed to Nerin (all 30 facets initialized internally)
			expect(capturedInput?.facetScores).toBeDefined();
			expect(Object.keys(capturedInput?.facetScores ?? {}).length).toBe(30);

			// VERIFY: With default scores (all zero confidence), no steering outlier exists
			expect(result.steeringTarget).toBeUndefined();
			expect(result.steeringHint).toBeUndefined();
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
				Layer.provide(TestAnalyzerLayer),
				Layer.provide(TestFacetEvidenceLayer),
				Layer.provide(TestAssessmentMessageLayer),
			);

			const orchestrator = yield* OrchestratorRepository.pipe(Effect.provide(OrchestratorLayer));

			// Story 2.11: No facetScores in input
			const result = yield* orchestrator.processMessage({
				sessionId: "test-no-steering-session",
				userMessage: "Just a normal conversation.",
				messages: [],
				messageCount: 1,
				dailyCostUsed: 5,
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
				Layer.provide(TestAnalyzerLayer),
				Layer.provide(TestFacetEvidenceLayer),
				Layer.provide(TestAssessmentMessageLayer),
			);

			const orchestrator = yield* OrchestratorRepository.pipe(Effect.provide(OrchestratorLayer));

			// First message — no facetScores in input (Story 2.11)
			const result = yield* orchestrator.processMessage({
				sessionId: "test-first-message",
				userMessage: "Hello, I'm excited to start!",
				messages: [],
				messageCount: 1,
				dailyCostUsed: 0,
			});

			// VERIFY: Nerin received input
			expect(capturedInput).not.toBeNull();

			// VERIFY: facetScores are initialized (all 30 facets with confidence 0)
			expect(capturedInput?.facetScores).toBeDefined();
			expect(Object.keys(capturedInput?.facetScores ?? {}).length).toBe(30);

			// VERIFY: No steering on first message
			expect(capturedInput?.steeringHint).toBeUndefined();
			expect(result.steeringTarget).toBeUndefined();
		}),
	);
});
